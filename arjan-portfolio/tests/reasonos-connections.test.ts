import { describe, expect, it } from "vitest";
import { RECORDINGS, imageInterval } from "@/lib/reasonos/recordings";
import { initialSnapshot, replayTrace } from "@/lib/reasonos/kernel";
import {
  CHEST_LEADS,
  ELECTRICAL_PHASES,
  SOURCE_BEATS,
  recordedImageSource,
  reportedAxisProjection,
  recordConnectedInterval,
  testConnectedClaim,
} from "@/lib/reasonos/connections";
import { LEADS } from "@/lib/reasonos/model";
describe("source-connected ECG explanation", () => {
  it("uses the actual printed P/QRS/T axes, preserving relative lead scaling and exact electrode identities", () => {
    for (const recording of RECORDINGS)
      for (const [phase, index] of [
        ["P", 0],
        ["QRS", 1],
        ["T", 2],
      ] as const) {
        const p = Object.fromEntries(
          LEADS.map((lead) => [
            lead,
            reportedAxisProjection(recording, phase, lead)!,
          ]),
        );
        expect(p.I.degrees).toBe(recording.report.axes[index]);
        expect(p.I.vector[0]).toBeCloseTo(
          Math.cos((recording.report.axes[index] * Math.PI) / 180),
          13,
        );
        expect(p.I.vector[1]).toBeCloseTo(
          Math.sin((recording.report.axes[index] * Math.PI) / 180),
          13,
        );
        expect(p.I.value + p.III.value).toBeCloseTo(p.II.value, 13);
        expect(p.aVR.value + p.aVL.value + p.aVF.value).toBeCloseTo(0, 13);
        expect(p.aVR.norm).toBeCloseTo(Math.sqrt(3) / 2, 13);
        expect(p.I.value).toBeCloseTo(p.II.value - p.III.value, 13);
      }
  });
  it("does not fabricate segment axes or chest voltages from a frontal angle", () => {
    for (const phase of ELECTRICAL_PHASES)
      for (const lead of CHEST_LEADS)
        expect(
          reportedAxisProjection(RECORDINGS[0], phase.id, lead),
        ).toBeNull();
    for (const phase of ["PR", "ST"] as const)
      for (const lead of LEADS)
        expect(reportedAxisProjection(RECORDINGS[0], phase, lead)).toBeNull();
    expect(() =>
      reportedAxisProjection(RECORDINGS[0], "invented" as "P", "II"),
    ).toThrow();
  });
  it("records actual image coordinates, calibration and placement bounds; confirms no diagnosis", () => {
    for (const recording of RECORDINGS) {
      const calibration = {
        a: recording.initialGrid[0],
        b: recording.initialGrid[1],
        mm: 25,
        speed: 25,
        errorPx: 2,
      };
      const points = SOURCE_BEATS[recording.id].qrs;
      const denied = recordConnectedInterval(
        initialSnapshot(),
        recording,
        calibration,
        points,
        false,
      );
      expect(denied.trace.at(-1)?.accepted).toBe(false);
      expect(denied.trace.some((e) => e.operator === "Measure")).toBe(false);
      const snapshot = recordConnectedInterval(
        initialSnapshot(),
        recording,
        calibration,
        points,
        true,
      );
      expect(snapshot.trace.at(-1)?.accepted).toBe(true);
      const projected = imageInterval(points[0], points[1], calibration);
      const output = snapshot.journal.entries.at(-1)!.event as unknown as {
        outputState: {
          payload: {
            duration: number;
            rawOperation: unknown;
            uncertainty: number;
          };
        };
      };
      expect(output.outputState.payload.duration).toBeCloseTo(
        projected.duration,
        12,
      );
      expect(output.outputState.payload.rawOperation).toEqual({
        a: points[0],
        b: points[1],
      });
      expect(output.outputState.payload.uncertainty).toBeGreaterThan(0);
      const claim = testConnectedClaim(
        snapshot,
        recording,
        calibration,
        snapshot.states.at(-1)!.id,
        "duration",
      );
      expect(claim.trace.at(-1)?.accepted).toBe(true);
      const broad = testConnectedClaim(
        claim,
        recording,
        calibration,
        snapshot.states.at(-1)!.id,
        "normal",
      );
      expect(broad.trace.at(-1)?.accepted).toBe(false);
      expect(broad.states).toHaveLength(claim.states.length);
      expect(replayTrace(broad.trace, broad.journal).states).toEqual(
        broad.states,
      );
      expect(broad.trace.every((e) => e.provenance.modelVersion === null)).toBe(
        true,
      );
    }
  });
  it("refuses absent, stale and reversed evidence and detects altered rejected events", () => {
    const recording = RECORDINGS[1],
      calibration = {
        a: recording.initialGrid[0],
        b: recording.initialGrid[1],
        mm: 25,
        speed: 25,
        errorPx: 2,
      };
    const snapshot = recordConnectedInterval(
      initialSnapshot(),
      recording,
      calibration,
      SOURCE_BEATS.B.qrs,
      true,
    );
    expect(
      testConnectedClaim(
        snapshot,
        recording,
        calibration,
        undefined,
        "duration",
      ).trace.at(-1)?.accepted,
    ).toBe(false);
    expect(
      testConnectedClaim(
        snapshot,
        RECORDINGS[0],
        calibration,
        snapshot.states.at(-1)!.id,
        "duration",
      ).trace.at(-1)?.accepted,
    ).toBe(false);
    expect(
      recordConnectedInterval(
        initialSnapshot(),
        recording,
        calibration,
        [SOURCE_BEATS.B.qrs[1], SOURCE_BEATS.B.qrs[0]],
        true,
      ).trace.at(-1)?.accepted,
    ).toBe(false);
    const changed = structuredClone(
      testConnectedClaim(
        snapshot,
        recording,
        calibration,
        snapshot.states.at(-1)!.id,
        "normal",
      ),
    );
    changed.trace.at(-1)!.summary = "Normal ECG confirmed";
    expect(() => replayTrace(changed.trace, changed.journal)).toThrow();
    expect(
      JSON.parse(recordedImageSource(recording, calibration)).recording.sha256,
    ).toBe(recording.sha256);
  });
  it("retains the selected interval kind; an RR measurement cannot support a QRS claim", () => {
    const recording = RECORDINGS[1],
      calibration = {
        a: recording.initialGrid[0],
        b: recording.initialGrid[1],
        mm: 25,
        speed: 25,
        errorPx: 2,
      };
    const rr = recordConnectedInterval(
      initialSnapshot(),
      recording,
      calibration,
      SOURCE_BEATS.B.rr,
      true,
      "RR",
    );
    expect(rr.trace.at(-1)?.accepted).toBe(true);
    expect(
      testConnectedClaim(
        rr,
        recording,
        calibration,
        rr.states.at(-1)!.id,
        "duration",
      ).trace.at(-1)?.accepted,
    ).toBe(false);
    expect(() =>
      recordConnectedInterval(
        initialSnapshot(),
        recording,
        calibration,
        SOURCE_BEATS.B.rr,
        true,
        "diagnosis" as "RR",
      ),
    ).toThrow();
  });
});
