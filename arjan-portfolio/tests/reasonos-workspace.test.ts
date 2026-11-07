import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { decodeWorkspaceWFDB, decodeWorkspaceCSV, createWorkspaceTrace, appendWorkspaceState, workspaceStates, claimNeedsReview, calculateWorkspaceInterval } from "@/lib/reasonos/workspace";
import { InMemoryTraceStore } from "@/lib/reasonos/core/browser";

const root = "public/ecg-reference/ptb-xl-1.0.3";
function record(id = "00010") {
  const header = readFileSync(`${root}/${id}_hr.hea`, "utf8");
  const bytes = readFileSync(`${root}/${id}_hr.dat`);
  return { header, buffer: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) };
}
describe("browser ECG file boundaries", () => {
  it.each(["00010", "00618", "03155", "08215"])("decodes original %s samples with checksum and calibration", id => {
    const { header, buffer } = record(id), ecg = decodeWorkspaceWFDB(header, buffer, `${id}_hr.dat`);
    expect(ecg.sampleRate).toBe(500); expect(ecg.sampleCount).toBe(5000); expect(ecg.leads).toHaveLength(12);
    const raw = new DataView(buffer);
    for (let c = 0; c < 12; c++) for (const i of [0, 90, 599, 4999]) expect(ecg.millivolts[c][i]).toBe(raw.getInt16((i * 12 + c) * 2, true) / 1000);
  });
  it("rejects corrupt, missing, mismatched and unsupported WFDB records", () => {
    const { header, buffer } = record();
    const corrupt = buffer.slice(0); new DataView(corrupt).setInt16(100, 999, true);
    for (const [h, b, file] of [[header, corrupt, "00010_hr.dat"], [header, buffer.slice(0, 20), "00010_hr.dat"],
      [header, buffer, "wrong.dat"], [header.replace(".dat 16 ", ".dat 212 "), buffer, "00010_hr.dat"],
      [header.replace(".dat 16 ", ".dat 16+12 "), buffer, "00010_hr.dat"],
      [header.replace("1000.0(0)/mV", "0(0)/mV"), buffer, "00010_hr.dat"]] as const)
      expect(() => decodeWorkspaceWFDB(h, b, file)).toThrow();
  });
  it("uses explicit baseline and microvolt units", () => {
    const b = new ArrayBuffer(6), v = new DataView(b); [100, 300, -100].forEach((x, i) => v.setInt16(i * 2, x, true));
    const ecg = decodeWorkspaceWFDB("example 1 250 3\nexample.dat 16 2(100)/uV 16 0 100 300 0 II", b, "example.dat");
    expect([...ecg.millivolts[0]]).toEqual([0, .1, -.1]);
  });
  it("rejects finite gains that overflow calibrated voltages", () => {
    const bytes = new ArrayBuffer(4), data = new DataView(bytes); data.setInt16(0, 1, true); data.setInt16(2, 2, true);
    const tiny = "0." + "0".repeat(320) + "1";
    expect(() => decodeWorkspaceWFDB(`test 1 500 2\ntest.dat 16 ${tiny}(0)/mV 16 0 1 3 0 II`, bytes, "test.dat")).toThrow(/non-finite/);
  });
  it("decodes explicit CSV units without inventing a sample rate", () => {
    const ecg = decodeWorkspaceCSV("time_ms,I_mV,II_mV\n100,0.1,-1\n102,0.2,2\n104,-0.3,0");
    expect(ecg.sampleRate).toBe(500); expect(ecg.leads).toEqual(["I", "II"]);
    expect([...ecg.millivolts[1]]).toEqual([-1, 2, 0]);
  });
  it("publishes review CSV values identical to the original recorded samples", () => {
    const csv = decodeWorkspaceCSV(readFileSync("public/reasonos/review/reference-00010.csv", "utf8"));
    const { header, buffer } = record();
    const original = decodeWorkspaceWFDB(header, buffer, "00010_hr.dat");
    expect(csv.sampleRate).toBe(original.sampleRate); expect(csv.leads).toEqual(original.leads);
    expect(csv.sampleCount).toBe(original.sampleCount);
    for (let lead = 0; lead < 12; lead++) expect([...csv.millivolts[lead]]).toEqual([...original.millivolts[lead]]);
  });
  it.each([
    "time,I\n0,1\n1,2", "time_ms,I_mV\n0,1\n0,2", "time_ms,I_mV\n0,1\n2,2\n5,3",
    "time_ms,I_mV\n0,\n2,1", "time_ms,I_mV\n0,NaN\n2,1", "time_ms,I_mV,I_mV\n0,1,2\n2,1,2",
    "time_ms,I_mV\n0,1\n2,Infinity", "time_ms,I_mV\n0,1\n-2,1",
  ])("rejects malformed CSV without silently filling values", text => expect(() => decodeWorkspaceCSV(text)).toThrow());
});

const metadata = { format: "digital-waveform", sampleRateHz: 500, sampleCount: 5000, leads: ["II"], width: 1200, height: 700 };
const measurement = { calibration: { sampleRateHz: 500 }, coordinateSystem: "focused-strip", windowStart: 0, span: 2, endpointsConfirmed: true, leadConfirmed: true,
  sampleIndices: [10, 51], lowerMs: 80, upperMs: 84, sourceId: "recording:sha", label: "QRS", lead: "II", durationMs: 82, uncertaintyMs: 2,
  points: [[10, 120], [51, 120]], calibrationKey: "sample-rate=500" };
describe("ReasonOS source-linked evidence", () => {
  it.each([{ durationMs: 100 }, { uncertaintyMs: 0 }, { lowerMs: 0 }, { upperMs: 8000 }, { sampleIndices: [10, 52] },
    { endpointsConfirmed: false }, { leadConfirmed: false }, { lead: "V1" }, { calibration: { sampleRateHz: 400 } }])("recomputes and rejects falsified measurement %j", change => {
    const t = createWorkspaceTrace("recording:sha", metadata);
    expect(appendWorkspaceState(t, "measurement", { ...measurement, ...change }, ["source"]).transformation.accepted).toBe(false);
  });
  it("uses one sample-index calculation for nonzero windows and half-sample boundaries", () => {
    const p = { ...measurement, windowStart: .002, span: 2.5, points: [[5.2, 110], [7.6, 110]] };
    const result = calculateWorkspaceInterval(p, { ...metadata, sourceId: "recording:sha" });
    expect(result.duration).toBe((result.sampleIndices![1] - result.sampleIndices![0]) * 2);
    const first = Math.round(.002 * 500);
    expect(result.sampleIndices![0]).toBe(first + Math.round(5.2 / 1000 * 2.5 * 500));
    expect(result.sampleIndices![1]).toBe(first + Math.round(7.6 / 1000 * 2.5 * 500));
  });
  it("recomputes image intervals and rotation from known geometry", () => {
    const source = { sourceId: "image", format: "source-image", width: 1000, height: 700 };
    const p = { ...measurement, sourceId: "image", coordinateSystem: "source-image", calibrationConfirmed: true,
      points: [[200, 200], [260, 280]], calibration: { grid: [[100, 100], [400, 500]], mm: 25, speedMmPerSecond: 25, errorPx: 0 } };
    const result = calculateWorkspaceInterval(p, source);
    expect(result.duration).toBeCloseTo(200, 10); expect(result.uncertainty).toBe(0);
    expect(() => calculateWorkspaceInterval({ ...p, points: [...p.points].reverse() }, source)).toThrow();
    expect(() => calculateWorkspaceInterval({ ...p, calibrationConfirmed: false }, source)).toThrow();
    expect(() => calculateWorkspaceInterval({ ...p, calibration: { ...p.calibration, grid: [[100, 100], [1001, 500]] } }, source)).toThrow();
  });
  it("rejects claims that hide an actual measurement dependency", () => {
    const t = createWorkspaceTrace("recording:sha", metadata);
    const a = appendWorkspaceState(t, "measurement", measurement, ["source"]);
    const b = appendWorkspaceState(a.trace, "measurement", measurement, ["source"]);
    const ids = [a.transformation.outputStateId, b.transformation.outputStateId];
    const claim = { sourceId: "recording:sha", text: "Comparison proposed for review", lead: "II", measurementIds: [ids[0]] };
    expect(appendWorkspaceState(b.trace, "claim", claim, ids).transformation.accepted).toBe(false);
    expect(appendWorkspaceState(b.trace, "claim", { ...claim, measurementIds: ids }, ids).transformation.accepted).toBe(true);
  });
  it("uses the real kernel, preserves old evidence and flags dependent claims after revision", () => {
    const original = createWorkspaceTrace("recording:sha", metadata);
    const m = appendWorkspaceState(original, "measurement", measurement, ["source"]);
    expect(m.transformation.accepted).toBe(true);
    const mId = m.transformation.outputStateId;
    const claim = appendWorkspaceState(m.trace, "claim", { sourceId: "recording:sha", text: "Observation pending review", lead: "II", measurementIds: [mId] }, [mId]);
    expect(claim.transformation.accepted).toBe(true);
    const claimState = workspaceStates(claim.trace).at(-1)!;
    expect(claimNeedsReview(claimState, workspaceStates(claim.trace))).toBe(false);
    const revised = appendWorkspaceState(claim.trace, "measurement", { ...measurement, points: [[10, 120], [57, 120]], sampleIndices: [10, 57], durationMs: 94, lowerMs: 92, upperMs: 96 }, ["source"], mId);
    expect(revised.transformation.accepted).toBe(true);
    expect(claimNeedsReview(claimState, workspaceStates(revised.trace))).toBe(true);
    expect(workspaceStates(revised.trace).find(st => st.id === mId)?.payload.durationMs).toBe(82);
    expect(original.entries).toHaveLength(2);
    new InMemoryTraceStore().verify(revised.trace);
    const tampered = JSON.parse(JSON.stringify(revised.trace)); tampered.entries[0].event.actor.label = "changed";
    expect(() => new InMemoryTraceStore().verify(tampered)).toThrow();
  });
  it("retains rejected attempts without admitting claims lacking a measurement", () => {
    const t = createWorkspaceTrace("recording:sha", metadata);
    const result = appendWorkspaceState(t, "claim", { sourceId: "recording:sha", text: "Unsupported diagnosis", measurementIds: [] }, ["source"]);
    expect(result.transformation.accepted).toBe(false);
    expect(workspaceStates(result.trace)).toHaveLength(1);
    expect(result.trace.entries.length).toBe(t.entries.length + 1);
  });
  it.each([{ durationMs: -1 }, { uncertaintyMs: -1 }, { sourceId: "another source" }, { calibrationKey: "" }, { points: [[-1, 0], [2, 0]] }])("rejects invalid source measurement %j", change => {
    const t = createWorkspaceTrace("recording:sha", metadata);
    expect(appendWorkspaceState(t, "measurement", { ...measurement, ...change }, ["source"]).transformation.accepted).toBe(false);
  });
});
