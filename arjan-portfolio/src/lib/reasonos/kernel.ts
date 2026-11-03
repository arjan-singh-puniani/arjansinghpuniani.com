import {
  InMemoryTraceStore,
  FixedClock,
  deepFreeze,
  projectTrace,
  sha256,
  canonicalize,
} from "./core/browser";
import type {
  ActorId,
  StateId,
  ProvenanceId,
  TransformationId,
  EventId,
  TraceId,
  IsoTimestamp,
  Trace,
  State,
  DomainPlugin,
  ConstraintResult as CoreConstraint,
  JsonObject,
  JsonValue,
  Provenance as CoreProvenance,
} from "./core/types";
import { ECG_PLUGIN } from "./reference-ecg-plugin";
import { narrowQrsRule } from "./model";
import {
  RECORDINGS,
  imageInterval,
  validateImagePoint,
  type ImageCalibration,
} from "./recordings";

export type ActorType = "learner" | "system";
export type WitnessType =
  | "source"
  | "learner-derived"
  | "application-calculated"
  | "machine-derived"
  | "reference-derived"
  | "expert-authored";
export type Operator =
  | "Inspect"
  | "Select"
  | "Calibrate"
  | "Measure"
  | "Hypothesize"
  | "AttachEvidence"
  | "Challenge"
  | "Revise";
export interface Provenance {
  source: string;
  method: string;
  verification: "unverified" | "user-confirmed" | "synthetic-reference";
  witnessType: WitnessType;
  modelVersion?: string | null;
}
export interface ReasonState {
  id: string;
  sequence: number;
  summary: string;
  parentId?: string;
}
export interface ConstraintResult {
  name: string;
  passed: boolean;
  applied?: boolean;
  reason: string;
}
export interface TraceEvent {
  id: string;
  eventHash: string;
  sequence: number;
  operator: Operator;
  actor: ActorType;
  inputStateIds: readonly string[];
  outputStateId?: string;
  summary: string;
  accepted: boolean;
  evidenceRefs: readonly string[];
  provenance: Provenance;
  kernelConstraintResults: readonly ConstraintResult[];
  domainConstraintResults: readonly ConstraintResult[];
  revisionOf?: string;
  applicationVeto?: boolean;
  kernelVersion: "0.3.0";
  domain: "ecg" | "generic";
  domainVersion: string;
}
export interface KernelSnapshot {
  states: readonly ReasonState[];
  trace: readonly TraceEvent[];
  journal: Trace;
}
export interface TransformationAttempt {
  operator: Operator;
  actor: ActorType;
  inputStateIds: string[];
  summary: string;
  provenance: Provenance;
  evidenceRefs?: string[];
  domainAccepted?: boolean;
  revisionOf?: string;
  domain?: "ecg" | "generic";
}
const rootId = "state-000-source";
const timestamp = (sequence: number) =>
  new Date(Date.UTC(2000, 0, 1) + sequence).toISOString() as IsoTimestamp;
function store(sequence = 0) {
  let next = sequence;
  return new InMemoryTraceStore({
    clock: new FixedClock(timestamp(sequence)),
    ids: {
      eventId: () => `entry-${++next}` as EventId,
      traceId: () => "reasonos-portfolio-logical-clock" as TraceId,
    },
  });
}
function coreProvenance(
  id: string,
  p: Provenance,
  actor: string,
  domain: string,
  time: IsoTimestamp,
  revision: ProvenanceId | null,
): CoreProvenance {
  return {
    id: id as ProvenanceId,
    source: p.source,
    method: p.method,
    actorId: actor as ActorId,
    witnessType:
      p.witnessType === "source"
        ? "simulation-derived"
        : p.witnessType === "expert-authored"
          ? "expert-derived"
          : p.witnessType,
    verificationStatus:
      p.verification === "unverified" ? "unverified" : "verified",
    observedAt: time,
    recordedAt: time,
    domainId: domain,
    domainVersion: "0.5.0",
    modelVersion:
      p.modelVersion === undefined ? "ECG-FRONTAL-1" : p.modelVersion,
    revisionOf: revision,
    confidence: null,
    confidenceBasis: null,
    sourceRefs: [p.source],
  };
}
export function initialSnapshot(): KernelSnapshot {
  const kernel = store();
  let journal = kernel.createTrace();
  for (const kind of ["learner", "system"] as const)
    journal = kernel.registerActor(journal, {
      id: kind as ActorId,
      kind,
      label: kind,
      version: null,
      authority: null,
    });
  const p = coreProvenance(
    "source-provenance",
    {
      source: "ECG workspace",
      method: "Workspace registration; source inspection follows",
      verification: "unverified",
      witnessType: "reference-derived",
      modelVersion: null,
    },
    "system",
    "ecg",
    timestamp(0),
    null,
  );
  journal = kernel.seedState(journal, {
    id: rootId as StateId,
    category: "External",
    role: "source",
    causalStage: "source",
    domainId: "ecg",
    schemaVersion: "1.0.0",
    payload: { summary: "ECG workspace opened" },
    provenance: p,
    createdAt: timestamp(0),
  });
  return deepFreeze({
    states: [{ id: rootId, sequence: 0, summary: "ECG workspace opened" }],
    trace: [],
    journal,
  });
}
function result(
  code: string,
  passed: boolean,
  reason: string,
  details: JsonObject = {},
): CoreConstraint {
  return {
    code,
    scope: "domain",
    severity: "required",
    passed,
    reason,
    details,
    evaluator: "reasonos-portfolio-adapter",
    evaluatorVersion: "2.0.0",
  };
}
const labConstraints: DomainPlugin["constraints"] = [
  {
    code: "Lab.Admission",
    version: "2.0.0",
    evaluate({ trace, draft }) {
      const inputs = draft.inputStateIds
        .map((id) => trace.states.get(id))
        .filter((state): state is State => state !== undefined);
      let passed = draft.payload.applicationVeto !== true;
      const reasons: string[] = [];
      if (!draft.inputStateIds.length) {
        passed = false;
        reasons.push("A recorded input is required.");
      }
      if (
        draft.payload.imageSource === true &&
        draft.payload.sourceIdentityValid !== true
      ) {
        passed = false;
        reasons.push(
          "The recording identity must match its registered image dimensions and SHA-256 digest.",
        );
      }
      if (
        draft.payload.imageSource === true &&
        draft.operator === "Calibrate" &&
        draft.payload.gridConfirmed !== true
      ) {
        passed = false;
        reasons.push(
          "Confirm the selected grid span before recording its calibration.",
        );
      }
      if (draft.outputState.provenance.witnessType === "expert-derived") {
        passed = false;
        reasons.push("No expert actor is registered in this laboratory.");
      }
      if (
        draft.payload.domainMode === "ecg" &&
        ["Calibrate", "Measure"].includes(draft.operator) &&
        draft.payload.calibrationValid !== true
      ) {
        passed = false;
        reasons.push(
          "Calibration requires finite positive speed, gain, and coordinate scale.",
        );
      }
      if (
        draft.operator === "Revise" &&
        !draft.inputStateIds.some(
          (id) =>
            trace.states.get(id)?.provenance.id === draft.provenance.revisionOf,
        )
      ) {
        passed = false;
        reasons.push("Revision lineage must name a supplied input.");
      }
      if (draft.payload.domainMode === "ecg" && draft.operator === "Measure") {
        const calibration = inputs.find(
          (state) => state.role === "calibration",
        );
        const same =
          calibration?.payload.recordingId === draft.payload.recordingId;
        const start = Number(draft.payload.startMs),
          end = Number(draft.payload.endMs);
        if (
          !same ||
          !Number.isFinite(start) ||
          !Number.isFinite(end) ||
          end <= start
        ) {
          passed = false;
          reasons.push(
            "Current calibration and ordered raw endpoints are required.",
          );
        }
      }
      if (
        draft.payload.domainMode === "ecg" &&
        ["Hypothesize", "Challenge"].includes(draft.operator)
      ) {
        const measurement = inputs.find(
            (state) => state.role === "measurement",
          ),
          p = measurement?.payload;
        const evaluation = narrowQrsRule({
          duration: p?.kind === "QRS" ? Number(p.duration) : 0,
          uncertainty: Number(p?.uncertainty ?? 0),
          calibrated: Boolean(p?.calibrationId),
          currentSource: Boolean(
            p && p.recordingId === draft.payload.recordingId,
          ),
        });
        if (!evaluation.accepted) {
          passed = false;
          reasons.push(
            ...evaluation.checks
              .filter((check) => !check.passed)
              .map((check) => check.name),
          );
        }
      }
      return result(
        this.code,
        passed,
        reasons.join(" ") || "Laboratory evidence dependencies are admissible.",
      );
    },
  },
];
export function attemptTransformation(
  snapshot: KernelSnapshot,
  attempt: TransformationAttempt,
): KernelSnapshot {
  const sequence = snapshot.trace.length + 1,
    domain = attempt.domain ?? "generic";
  const references = attempt.evidenceRefs ?? [];
  const source =
    references.find((ref) => ref.startsWith("source="))?.slice(7) ?? "";
  let config: {
    speed?: number;
    gain?: number;
    pixelsPerMm?: number;
    kind?: string;
    calibration?: ImageCalibration;
    recording?: { id: string; sha256: string; width: number; height: number };
  } = {};
  if (source) config = JSON.parse(source);
  const value = (name: string) =>
    references
      .find((ref) => ref.startsWith(`${name}=`))
      ?.slice(name.length + 1);
  let start = Number(value("startMs") ?? 0),
    end = Number(value("endMs") ?? 0);
  const rawScale = ((config.speed ?? 25) * (config.pixelsPerMm ?? 12)) / 1000;
  const imageSource = config.kind === "recording-image";
  const knownRecording = RECORDINGS.find(
    (recording) =>
      recording.id === config.recording?.id &&
      recording.sha256 === config.recording?.sha256 &&
      recording.width === config.recording?.width &&
      recording.height === config.recording?.height,
  );
  let calibrationValid =
    Boolean(source) &&
    [config.speed, config.gain, config.pixelsPerMm].every(
      (n) => typeof n === "number" && Number.isFinite(n) && n > 0,
    );
  let measured: ReturnType<typeof imageInterval> | undefined;
  let rawOperation = {
    a: { x: start * rawScale, y: 0 },
    b: { x: end * rawScale, y: 0 },
  };
  if (imageSource) {
    try {
      if (!knownRecording || !config.calibration)
        throw new Error("Unknown image calibration");
      validateImagePoint(config.calibration.a, knownRecording);
      validateImagePoint(config.calibration.b, knownRecording);
      const reference = imageInterval(
        config.calibration.a,
        config.calibration.b,
        config.calibration,
      );
      calibrationValid =
        calibrationValid &&
        config.speed === config.calibration.speed &&
        config.speed === knownRecording.paperSpeed &&
        config.gain === knownRecording.gain &&
        Math.abs(reference.pixelsPerMm - config.pixelsPerMm!) < 1e-9;
      if (attempt.operator === "Measure") {
        const a = { x: Number(value("imageAX")), y: Number(value("imageAY")) },
          b = { x: Number(value("imageBX")), y: Number(value("imageBY")) };
        validateImagePoint(a, knownRecording);
        validateImagePoint(b, knownRecording);
        measured = imageInterval(a, b, config.calibration);
        start = 0;
        end = measured.ordered ? measured.duration : -measured.duration;
        rawOperation = { a, b };
      }
    } catch {
      calibrationValid = false;
      start = 0;
      end = 0;
      rawOperation = { a: { x: 0, y: 0 }, b: { x: 0, y: 0 } };
    }
  }
  const payload: JsonObject = {
    summary: attempt.summary,
    domainMode: domain,
    operator: attempt.operator,
    actor: attempt.actor,
    witness: attempt.provenance.witnessType,
    verification: attempt.provenance.verification,
    evidenceRefs: [...references],
    applicationVeto: attempt.domainAccepted === false,
    revisionStateId: attempt.revisionOf ?? null,
    recordingId: source,
    calibrationId: source,
    calibrationValid,
    imageSource,
    sourceIdentityValid: Boolean(knownRecording),
    gridConfirmed: value("gridConfirmed") === "true",
    kind: value("kind") ?? "",
    startMs: start,
    endMs: end,
    duration: measured?.duration ?? Math.round(Math.abs(end - start)),
    uncertainty: measured?.uncertainty ?? Number(value("uncertaintyMs") ?? 0),
    rawOperation,
    reason: attempt.summary,
  };
  const identity = sha256({
    sequence,
    payload,
    inputs: attempt.inputStateIds,
    provenance: attempt.provenance as unknown as JsonValue,
  }).slice(0, 12);
  const outputId = `state-${String(sequence).padStart(3, "0")}-${identity}`;
  const view = projectTrace(snapshot.journal),
    time = timestamp(snapshot.journal.entries.length);
  const revision = attempt.revisionOf
    ? (view.states.get(attempt.revisionOf as StateId)?.provenance.id ??
      ("missing-revision" as ProvenanceId))
    : null;
  const isSource =
    attempt.operator === "Inspect" &&
    ["source", "machine-derived", "reference-derived"].includes(
      attempt.provenance.witnessType,
    );
  const role = isSource
    ? "source"
    : attempt.operator === "Calibrate"
      ? "calibration"
      : attempt.operator === "Measure"
        ? "measurement"
        : attempt.operator === "Revise"
          ? "revised-hypothesis"
          : attempt.operator === "Hypothesize"
            ? "candidate-explanation"
            : "localized-observation";
  const stage = isSource
    ? "source"
    : ["Calibrate", "Measure"].includes(attempt.operator)
      ? "measurement"
      : ["Hypothesize", "Challenge", "Revise"].includes(attempt.operator)
        ? "inference"
        : "observation";
  const p = coreProvenance(
    `tx-provenance-${sequence}`,
    imageSource
      ? { ...attempt.provenance, modelVersion: null }
      : attempt.provenance,
    attempt.actor,
    domain,
    time,
    revision,
  );
  const output: State = {
    id: outputId as StateId,
    category: "Epistemic",
    role,
    causalStage: stage,
    domainId: domain,
    schemaVersion: "1.0.0",
    payload,
    provenance: { ...p, id: `state-provenance-${sequence}` as ProvenanceId },
    createdAt: time,
  };
  const plugin: DomainPlugin = {
    id: domain,
    version: "0.5.0",
    constraints: [
      ...(domain === "ecg" ? ECG_PLUGIN.constraints : []),
      ...labConstraints,
    ],
  };
  const kernel = store(snapshot.journal.entries.length);
  const receipt = kernel.append(
    snapshot.journal,
    {
      id: `tx-${sequence}-${identity}` as TransformationId,
      operator: attempt.operator,
      actorId: attempt.actor as ActorId,
      inputStateIds: attempt.inputStateIds as StateId[],
      outputState: output,
      attemptedAt: time,
      provenance: p,
      payload,
      expansionEvaluation: null,
    },
    plugin,
  );
  const constraints = (scope: string) =>
    receipt.transformation.constraints
      .filter((check) => check.scope === scope)
      .map((check) => ({
        name: check.code,
        passed: check.passed,
        applied:
          check.details.applied !== false &&
          !(
            check.code === "AttentionNotDownstream" && !check.details.attention
          ),
        reason: check.reason,
      }));
  const event: TraceEvent = {
    id: receipt.entry.eventId,
    eventHash: receipt.entry.eventHash,
    sequence,
    operator: attempt.operator,
    actor: attempt.actor,
    inputStateIds: [...attempt.inputStateIds],
    outputStateId: receipt.transformation.accepted ? outputId : undefined,
    summary: attempt.summary,
    accepted: receipt.transformation.accepted,
    evidenceRefs: [...references],
    provenance: { ...attempt.provenance },
    kernelConstraintResults: constraints("kernel"),
    domainConstraintResults: constraints("domain"),
    revisionOf: attempt.revisionOf,
    applicationVeto: attempt.domainAccepted === false,
    kernelVersion: "0.3.0",
    domain,
    domainVersion: "0.5.0 + lab-2.0.0",
  };
  return deepFreeze({
    journal: receipt.trace,
    states: event.accepted
      ? [
          ...snapshot.states,
          {
            id: outputId,
            sequence,
            summary: attempt.summary,
            parentId: attempt.inputStateIds.at(-1),
          },
        ]
      : snapshot.states,
    trace: [...snapshot.trace, event],
  });
}
export function replayTrace(
  trace: readonly TraceEvent[],
  journal?: Trace,
): KernelSnapshot {
  if (journal) store().verify(journal);
  const replayed = trace.reduce<KernelSnapshot>((snapshot, event) => {
    const next = attemptTransformation(snapshot, {
      operator: event.operator,
      actor: event.actor,
      inputStateIds: [...event.inputStateIds],
      summary: event.summary,
      provenance: event.provenance,
      evidenceRefs: [...event.evidenceRefs],
      domainAccepted: !event.applicationVeto,
      revisionOf: event.revisionOf,
      domain: event.domain,
    });
    const plain = (value: unknown) =>
      JSON.parse(JSON.stringify(value)) as JsonValue;
    if (canonicalize(plain(next.trace.at(-1))) !== canonicalize(plain(event)))
      throw new Error(
        `Event ${event.sequence} does not reproduce its recorded transformation.`,
      );
    return next;
  }, initialSnapshot());
  if (
    journal &&
    canonicalize(replayed.journal as unknown as JsonValue) !==
      canonicalize(journal as unknown as JsonValue)
  )
    throw new Error(
      "The journal does not match its projected transformations.",
    );
  return replayed;
}
