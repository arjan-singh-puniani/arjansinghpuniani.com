import {
  InMemoryTraceStore, projectTrace,
  type ActorId, type StateId, type ProvenanceId, type TransformationId,
  type IsoTimestamp, type JsonObject, type State, type Trace, type DomainPlugin,
} from "./core/browser";
import { imageInterval } from "./recordings";

export interface DigitalECG {
  sampleRate: number;
  sampleCount: number;
  leads: string[];
  millivolts: Float64Array[];
}
export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export const STRIP_WIDTH = 1000, STRIP_HEIGHT = 240;

function pointPair(value: unknown, width: number, height: number) {
  if (!Array.isArray(value) || value.length !== 2 || !value.every(p => Array.isArray(p) && p.length === 2 &&
    p.every(Number.isFinite) && p[0] >= 0 && p[0] <= width && p[1] >= 0 && p[1] <= height))
    throw new Error("Endpoints must lie inside the source view.");
  return value.map(p => ({ x: p[0] as number, y: p[1] as number }));
}

export function calculateWorkspaceInterval(p: JsonObject, source: JsonObject) {
  if (p.sourceId !== source.sourceId || typeof p.lead !== "string" || !p.lead.trim() || p.lead.length > 40 ||
    typeof p.calibrationKey !== "string" || !p.calibrationKey || !p.calibration || typeof p.calibration !== "object" || Array.isArray(p.calibration))
    throw new Error("A source identity, lead and calibration record are required.");
  const c = p.calibration as JsonObject;
  if (source.format === "digital-waveform") {
    const fs = source.sampleRateHz, count = source.sampleCount, start = p.windowStart, span = p.span;
    if (typeof fs !== "number" || !Number.isFinite(fs) || fs <= 0 || typeof count !== "number" || !Number.isInteger(count) || count < 2 ||
      c.sampleRateHz !== fs || !Array.isArray(source.leads) || !source.leads.includes(p.lead) ||
      p.coordinateSystem !== "focused-strip" || typeof start !== "number" || !Number.isFinite(start) || start < 0 ||
      typeof span !== "number" || !Number.isFinite(span) || span <= 0 || start + span > (count - 1) / fs + 1e-9)
      throw new Error("The view and sampling calibration must match the imported recording.");
    const points = pointPair(p.points, STRIP_WIDTH, STRIP_HEIGHT);
    const first = Math.round(start * fs);
    const indices = points.map(point => first + Math.round(point.x / STRIP_WIDTH * span * fs));
    if (indices[1] <= indices[0] || indices[1] >= count) throw new Error("Choose two ordered samples in the recording.");
    const duration = (indices[1] - indices[0]) / fs * 1000, uncertainty = 1000 / fs;
    return { duration, uncertainty, low: Math.max(0, duration - uncertainty), high: duration + uncertainty, ordered: true, sampleIndices: indices };
  }
  if (source.format !== "source-image" || p.coordinateSystem !== "source-image" || p.calibrationConfirmed !== true ||
    typeof source.width !== "number" || typeof source.height !== "number" ||
    typeof c.mm !== "number" || typeof c.speedMmPerSecond !== "number" || typeof c.errorPx !== "number")
    throw new Error("An image needs confirmed grid calibration and paper speed.");
  const points = pointPair(p.points, source.width, source.height), grid = pointPair(c.grid, source.width, source.height);
  const result = imageInterval(points[0], points[1], { a: grid[0], b: grid[1], mm: c.mm, speed: c.speedMmPerSecond, errorPx: c.errorPx });
  if (!result.ordered || result.duration <= 0) throw new Error("Choose ordered endpoints along the calibrated paper axis.");
  return { ...result, sampleIndices: null };
}

/** Deliberately bounded: one multiplexed format-16 file, calibrated in mV or µV. */
export function decodeWorkspaceWFDB(header: string, buffer: ArrayBuffer, filename: string): DigitalECG {
  if (header.length > 64_000 || buffer.byteLength > MAX_FILE_BYTES) throw new Error("Recording exceeds the import limit.");
  const lines = header.split(/\r?\n/).map(s => s.trim()).filter(s => s && !s.startsWith("#"));
  const fields = lines[0]?.split(/\s+/) ?? [];
  const channels = Number(fields[1]), sampleRate = Number(fields[2]), sampleCount = Number(fields[3]);
  if (!/^[\w-]+$/.test(fields[0] ?? "") || !Number.isInteger(channels) || channels < 1 || channels > 12 ||
    !Number.isFinite(sampleRate) || sampleRate < 1 || sampleRate > 10_000 ||
    !Number.isInteger(sampleCount) || sampleCount < 2 || channels * sampleCount > 2_000_000 ||
    buffer.byteLength !== channels * sampleCount * 2 || lines.length !== channels + 1)
    throw new Error("Use a single-segment WFDB recording with 1–12 channels and a complete format-16 data file (up to 2 million samples total).");
  const data = new DataView(buffer), leads: string[] = [], millivolts: Float64Array[] = [];
  for (let channel = 0; channel < channels; channel++) {
    const f = lines[channel + 1].split(/\s+/);
    const scale = f[2]?.match(/^([\d.]+)(?:\((-?\d+)\))?\/(mV|uV|µV)$/);
    const gain = Number(scale?.[1]), baseline = Number(scale?.[2] ?? f[4]);
    const lead = f.slice(8).join(" ");
    if (f[0] !== filename || f[1] !== "16" || !scale || !Number.isFinite(gain) || gain <= 0 ||
      !Number.isFinite(baseline) || !lead || lead.length > 40 || leads.includes(lead) ||
      !/^-?\d+$/.test(f[5] ?? "") || !/^-?\d+$/.test(f[6] ?? "") || f[7] !== "0")
      throw new Error("Unsupported WFDB layout. Use one format-16 .dat file, explicit mV/µV calibration, lead names, initial values and checksums; offsets, skew and multi-file layouts are not supported.");
    const values = new Float64Array(sampleCount);
    let checksum = 0;
    for (let i = 0; i < sampleCount; i++) {
      const raw = data.getInt16((i * channels + channel) * 2, true);
      if (raw === -32768) throw new Error("The recording contains missing samples; this viewer does not interpolate them.");
      if (i === 0 && raw !== Number(f[5])) throw new Error("WFDB initial sample does not match the header.");
      checksum = (checksum + raw) & 65535;
      values[i] = (raw - baseline) / gain / (scale[3] === "mV" ? 1 : 1000);
      if (!Number.isFinite(values[i])) throw new Error("WFDB calibration produces non-finite voltages.");
    }
    if (checksum !== (Number(f[6]) & 65535)) throw new Error("WFDB checksum failed. Select the matching, unmodified header and data file.");
    leads.push(lead); millivolts.push(values);
  }
  return { sampleRate, sampleCount, leads, millivolts };
}

/** CSV is an explicit interchange contract, not a claim of vendor compatibility. */
export function decodeWorkspaceCSV(text: string): DigitalECG {
  if (text.length > MAX_FILE_BYTES) throw new Error("CSV exceeds 25 MB.");
  const rows = text.replace(/^\uFEFF/, "").trim().split(/\r?\n/);
  const names = rows.shift()?.split(",").map(s => s.trim()) ?? [];
  if (names[0] !== "time_ms" || names.length < 2 || names.length > 13 ||
    names.slice(1).some(s => !/^[\w -]{1,40}_mV$/.test(s)) || new Set(names).size !== names.length || rows.length < 2 ||
    rows.length * (names.length - 1) > 2_000_000)
    throw new Error("CSV needs time_ms followed by lead columns such as I_mV,II_mV, with 1–12 leads and at least two rows.");
  let first = 0, step = 0;
  const millivolts = names.slice(1).map(() => new Float64Array(rows.length));
  rows.forEach((row, i) => {
    const cells = row.split(",");
    if (cells.length !== names.length || cells.some(c => !c.trim() || !Number.isFinite(Number(c)))) throw new Error(`Invalid or missing numeric data on CSV row ${i + 2}.`);
    const values = cells.map(Number);
    if (i === 0) first = values[0];
    if (i === 1) step = values[0] - first;
    if (i > 0 && (step < .1 || step > 1000 || Math.abs(values[0] - first - i * step) > Math.max(1e-5, step * 1e-4)))
      throw new Error("CSV timestamps must increase at a uniform sample interval between 0.1 and 1000 ms. Gaps are not interpolated.");
    millivolts.forEach((lead, c) => { lead[i] = values[c + 1]; });
  });
  return { sampleRate: 1000 / step, sampleCount: rows.length, leads: names.slice(1).map(s => s.slice(0, -3)), millivolts };
}

const kernel = new InMemoryTraceStore();
const actor = "workspace-learner" as ActorId;
const version = "1.1.0";
function provenance(id: string, source: string, method: string, time: IsoTimestamp, revisionOf: ProvenanceId | null = null) {
  return {
    id: id as ProvenanceId, source, method, actorId: actor,
    witnessType: "learner-derived" as const, verificationStatus: "unverified" as const,
    observedAt: time, recordedAt: time, domainId: "ecg-workspace", domainVersion: version,
    modelVersion: null, revisionOf, confidence: null, confidenceBasis: null, sourceRefs: [source],
  };
}
const plugin: DomainPlugin = {
  id: "ecg-workspace", version,
  constraints: [{
    code: "Workspace.SourceEvidence", version,
    evaluate({ trace, draft }) {
      const p = draft.outputState.payload;
      const inputs = draft.inputStateIds.map(id => trace.states.get(id));
      let passed = inputs.length > 0 && inputs.every(s => s && s.payload.sourceId === p.sourceId);
      let reason = "Evidence must refer to the same recording page or digital signal.";
      if (draft.outputState.role === "measurement") {
        try {
          if (p.endpointsConfirmed !== true || p.leadConfirmed !== true) throw new Error("Confirm endpoints and lead.");
          const source = [...trace.states.values()].find(s => s.role === "source" && s.payload.sourceId === p.sourceId);
          if (!source) throw new Error("Source missing.");
          const calculated = calculateWorkspaceInterval(p, source.payload);
          const same = (a: unknown, b: number) => typeof a === "number" && Number.isFinite(a) && Math.abs(a - b) <= 1e-8 * Math.max(1, Math.abs(b));
          passed = passed && same(p.durationMs, calculated.duration) && same(p.uncertaintyMs, calculated.uncertainty) &&
            same(p.lowerMs, calculated.low) && same(p.upperMs, calculated.high) &&
            (calculated.sampleIndices === null ? p.sampleIndices === null : Array.isArray(p.sampleIndices) && p.sampleIndices.length === 2 && p.sampleIndices.every((v, i) => v === calculated.sampleIndices![i]));
        } catch { passed = false; }
        reason = "Duration, uncertainty and sample indices must recompute from the imported source, saved endpoints and calibration.";
      }
      if (draft.outputState.role === "claim") {
        const refs = p.measurementIds;
        const measurements = inputs.filter(s => s?.role === "measurement");
        passed = passed && typeof p.text === "string" && p.text.trim().length >= 3 && p.text.length <= 2000 &&
          Array.isArray(refs) && refs.length > 0 && refs.length === measurements.length && new Set(refs).size === refs.length &&
          refs.every(id => typeof id === "string" && inputs.some(s => s?.id === id && s.role === "measurement" && s.payload.lead === p.lead));
        reason = "A proposed interpretation needs text and a source-linked measurement; admission does not establish clinical truth.";
      }
      if (p.revisionOf !== null && p.revisionOf !== undefined)
        passed = passed && inputs.some(s => s?.id === p.revisionOf && s.role === draft.outputState.role);
      return { code: this.code, scope: "domain", severity: "required", passed, reason,
        evaluator: "ReasonOS ECG workspace", evaluatorVersion: version, details: {} };
    },
  }],
};

export function createWorkspaceTrace(sourceId: string, metadata: JsonObject): Trace {
  let trace = kernel.registerActor(kernel.createTrace(), { id: actor, kind: "learner", label: "Browser user", version: null, authority: null });
  const time = new Date().toISOString() as IsoTimestamp;
  trace = kernel.seedState(trace, {
    id: "source" as StateId, category: "External", role: "source", causalStage: "source", domainId: plugin.id, schemaVersion: version,
    payload: { ...metadata, sourceId }, provenance: provenance("source-provenance", sourceId, "Source import; no diagnostic interpretation", time), createdAt: time,
  });
  return trace;
}

export function appendWorkspaceState(trace: Trace, role: "measurement" | "claim", payload: JsonObject, inputIds: string[], revisionId?: string) {
  const view = projectTrace(trace), time = new Date().toISOString() as IsoTimestamp;
  const id = `state-${trace.entries.length}`, old = revisionId ? view.states.get(revisionId as StateId) : undefined;
  const p = provenance(`${id}-provenance`, String(payload.sourceId), role === "measurement" ? "User-positioned calipers; recorded calibration and endpoint bound" : "User-authored proposed interpretation", time, old?.provenance.id ?? null);
  const state: State = { id: id as StateId, category: role === "measurement" ? "Perceptual" : "Epistemic", role,
    causalStage: role === "measurement" ? "measurement" : "inference", domainId: plugin.id, schemaVersion: version,
    payload: { ...payload, revisionOf: revisionId ?? null }, provenance: p, createdAt: time };
  return kernel.append(trace, {
    id: `${id}-transformation` as TransformationId, operator: revisionId ? "Revise" : role === "measurement" ? "Measure" : "Hypothesize",
    actorId: actor, inputStateIds: [...new Set([...inputIds, ...(revisionId ? [revisionId] : [])])] as StateId[],
    outputState: state, attemptedAt: time, provenance: { ...p, id: `${id}-attempt-provenance` as ProvenanceId },
    payload: { purpose: "Educational evidence workflow; no automatic diagnosis" }, expansionEvaluation: null,
  }, plugin);
}

export function workspaceStates(trace: Trace) {
  return [...projectTrace(trace).states.values()];
}
export function claimNeedsReview(claim: State, states: readonly State[]) {
  const refs = claim.payload.measurementIds;
  return Array.isArray(refs) && states.some(s => s.role === "measurement" && refs.includes(s.payload.revisionOf));
}
