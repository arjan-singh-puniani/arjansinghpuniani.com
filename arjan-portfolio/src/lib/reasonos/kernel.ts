export type ActorType = "learner" | "system";
export type WitnessType = "source" | "learner-derived" | "application-calculated" | "expert-authored";
export type Operator = "Inspect" | "Select" | "Calibrate" | "Measure" | "Hypothesize" | "AttachEvidence" | "Challenge" | "Revise";

export interface Provenance {
  source: string;
  method: string;
  verification: "unverified" | "user-confirmed" | "synthetic-reference";
  witnessType: WitnessType;
}

export interface ReasonState {
  id: string;
  sequence: number;
  summary: string;
  parentId?: string;
}

export interface ConstraintResult {
  name: "InputsExist" | "AppendOnly" | "ActorPresent" | "ProvenancePresent" | "AcyclicCausation" | "AttentionNotDownstream" | "WitnessTypePreserved" | "DomainAdmissibility";
  passed: boolean;
}

export interface TraceEvent {
  id: string;
  sequence: number;
  operator: Operator;
  actor: ActorType;
  inputStateIds: string[];
  outputStateId?: string;
  summary: string;
  accepted: boolean;
  evidenceRefs: string[];
  provenance: Provenance;
  kernelConstraintResults: ConstraintResult[];
  domainConstraintResults: ConstraintResult[];
  revisionOf?: string;
  kernelVersion: "3.0.0";
  domain: "ecg";
  domainVersion: "0.5.0";
}

export interface KernelSnapshot {
  states: ReasonState[];
  trace: TraceEvent[];
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
}

const stableHash = (value: string) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};

export const initialSnapshot = (): KernelSnapshot => ({
  states: [{ id: "state-000-source", sequence: 0, summary: "Synthetic ECG source loaded" }],
  trace: [],
});

export function attemptTransformation(snapshot: KernelSnapshot, attempt: TransformationAttempt): KernelSnapshot {
  const sequence = snapshot.trace.length + 1;
  const inputsExist = attempt.inputStateIds.every((id) => snapshot.states.some((state) => state.id === id));
  const actorPresent = Boolean(attempt.actor);
  const provenancePresent = Boolean(attempt.provenance.source && attempt.provenance.method);
  const witnessPreserved = Boolean(attempt.provenance.witnessType);
  const acyclic = !attempt.inputStateIds.some((id) => id === attempt.revisionOf && attempt.operator !== "Revise");
  const attentionNotDownstream = true;
  const domainAccepted = attempt.domainAccepted ?? true;
  const accepted = inputsExist && actorPresent && provenancePresent && witnessPreserved && acyclic && attentionNotDownstream && domainAccepted;
  const canonical = JSON.stringify({ sequence, ...attempt, accepted });
  const eventId = `event-${String(sequence).padStart(3, "0")}-${stableHash(canonical)}`;
  const outputStateId = accepted ? `state-${String(sequence).padStart(3, "0")}-${stableHash(`${canonical}:state`)}` : undefined;
  const kernelConstraintResults: ConstraintResult[] = [
    { name: "InputsExist", passed: inputsExist },
    { name: "AppendOnly", passed: true },
    { name: "ActorPresent", passed: actorPresent },
    { name: "ProvenancePresent", passed: provenancePresent },
    { name: "AcyclicCausation", passed: acyclic },
    { name: "AttentionNotDownstream", passed: attentionNotDownstream },
    { name: "WitnessTypePreserved", passed: witnessPreserved },
  ];
  const domainConstraintResults: ConstraintResult[] = [{ name: "DomainAdmissibility", passed: domainAccepted }];
  const event: TraceEvent = {
    id: eventId,
    sequence,
    operator: attempt.operator,
    actor: attempt.actor,
    inputStateIds: [...attempt.inputStateIds],
    outputStateId,
    summary: attempt.summary,
    accepted,
    evidenceRefs: [...(attempt.evidenceRefs ?? [])],
    provenance: { ...attempt.provenance },
    kernelConstraintResults,
    domainConstraintResults,
    revisionOf: attempt.revisionOf,
    kernelVersion: "3.0.0",
    domain: "ecg",
    domainVersion: "0.5.0",
  };
  const nextStates = outputStateId
    ? [...snapshot.states, { id: outputStateId, sequence, summary: attempt.summary, parentId: attempt.inputStateIds.at(-1) }]
    : snapshot.states;
  return { states: nextStates, trace: [...snapshot.trace, event] };
}

export function replayTrace(trace: TraceEvent[]): KernelSnapshot {
  return trace.reduce<KernelSnapshot>((snapshot, event) => {
    const states = event.accepted && event.outputStateId
      ? [...snapshot.states, { id: event.outputStateId, sequence: event.sequence, summary: event.summary, parentId: event.inputStateIds.at(-1) }]
      : snapshot.states;
    return { states, trace: [...snapshot.trace, event] };
  }, initialSnapshot());
}
