import type {
  ConstraintResult, ExpansionEvaluation, Provenance, State, StateId, TraceView,
  TransformationDraft, WitnessType
} from './types';

export const REASONOS_KERNEL_VERSION = '0.3.0';
const VERSION = REASONOS_KERNEL_VERSION;
const STAGE_ORDER: Record<State['causalStage'], number> = {
  source: 0, attention: 1, observation: 2, measurement: 3, inference: 4, decision: 5, meta: 6
};

function result(code: string, passed: boolean, reason: string, details: ConstraintResult['details'] = {}): ConstraintResult {
  return Object.freeze({ code, scope: 'kernel', severity: 'required', passed, reason, evaluator: '@reasonos/kernel', evaluatorVersion: VERSION, details });
}

function ancestors(view: TraceView, stateId: StateId): ReadonlySet<StateId> {
  const byOutput = new Map<StateId, readonly StateId[]>();
  for (const transformation of view.acceptedTransformations) byOutput.set(transformation.outputStateId, transformation.inputStateIds);
  const found = new Set<StateId>();
  const stack = [...(byOutput.get(stateId) ?? [])];
  while (stack.length > 0) {
    const current = stack.pop();
    if (current === undefined || found.has(current)) continue;
    found.add(current);
    stack.push(...(byOutput.get(current) ?? []));
  }
  return found;
}

function witnessTransitionAllowed(input: WitnessType, output: WitnessType): boolean {
  return !(input === 'machine-derived' && output === 'learner-derived');
}

function unique<T>(values: readonly T[]): boolean { return new Set(values).size === values.length; }
function isSubset(left: readonly StateId[], right: ReadonlySet<StateId>): boolean { return left.every((id) => right.has(id)); }

export interface ExpansionPathScore {
  readonly pathId: string;
  readonly pathLabel: string;
  readonly pathKind: ExpansionEvaluation['referenceGraph']['paths'][number]['kind'];
  readonly validationStatus: ExpansionEvaluation['referenceGraph']['paths'][number]['validationStatus'];
  readonly expertCount: number;
  readonly priorProbability: number;
  readonly score: number;
}

export interface ExpansionScoreResult {
  readonly score: number;
  readonly matchedPathId: string | null;
  readonly matchedPathLabel: string | null;
  readonly matchedPathValidationStatus: ExpansionPathScore['validationStatus'] | null;
  readonly runnerUpPathId: string | null;
  readonly matchMargin: number | null;
  readonly pathScores: readonly ExpansionPathScore[];
}

/** Pure domain-blind MinMax similarity. The plugin supplies every weight. */
export function scoreExpansionPaths(value: ExpansionEvaluation): ExpansionScoreResult {
  const selected = new Set(value.selectedEvidenceIds);
  const pathScores = value.referenceGraph.paths.map((path): ExpansionPathScore => {
    let numerator = 0;
    let denominator = 0;
    const modeledEvidence = new Set<StateId>();
    for (const field of path.consensusFields) {
      field.evidenceStateIds.forEach((id) => modeledEvidence.add(id));
      const learnerValue = field.evidenceStateIds.some((id) => selected.has(id)) ? 1 : 0;
      const expertWeight = field.weight;
      numerator += Math.min(learnerValue, expertWeight);
      denominator += Math.max(learnerValue, expertWeight);
    }
    // A selected state outside the candidate path is an explicit false-positive
    // term. This preserves select-all resistance without domain vocabulary.
    denominator += value.selectedEvidenceIds.filter((id) => !modeledEvidence.has(id)).length;
    return {
      pathId: path.id,
      pathLabel: path.label,
      pathKind: path.kind,
      validationStatus: path.validationStatus,
      expertCount: path.expertCount,
      priorProbability: path.priorProbability,
      score: denominator === 0 ? 0 : numerator / denominator
    };
  }).sort((left, right) => right.score - left.score || right.priorProbability - left.priorProbability || left.pathId.localeCompare(right.pathId));
  const matched = pathScores[0] ?? null;
  const runnerUp = pathScores[1] ?? null;
  return {
    score: matched?.score ?? 0,
    matchedPathId: matched?.pathId ?? null,
    matchedPathLabel: matched?.pathLabel ?? null,
    matchedPathValidationStatus: matched?.validationStatus ?? null,
    runnerUpPathId: runnerUp?.pathId ?? null,
    matchMargin: matched !== null && runnerUp !== null ? matched.score - runnerUp.score : null,
    pathScores
  };
}

function evaluateExpansion(view: TraceView, draft: TransformationDraft, value: ExpansionEvaluation | null): { passed: boolean; details: ConstraintResult['details'] } {
  if (value === null) return { passed: draft.operator !== 'Expand', details: { applied: false, expandRequiresEvaluation: draft.operator === 'Expand' } };
  const all = new Set(value.availableEvidenceIds);
  const inputIds = new Set(draft.inputStateIds);
  const pathIds = value.referenceGraph.paths.map((path) => path.id);
  const weightedEvidenceIds = value.referenceGraph.paths.flatMap((path) => path.consensusFields.flatMap((field) => field.evidenceStateIds));
  const allIds = [...all, ...weightedEvidenceIds, value.compressionStateId];
  const referencesExist = allIds.every((id) => view.states.has(id));
  const structurallyLinked = draft.inputStateIds.includes(value.compressionStateId) &&
    isSubset(value.selectedEvidenceIds, all) && isSubset(value.selectedEvidenceIds, inputIds);
  const priorSum = value.referenceGraph.paths.reduce((sum, path) => sum + path.priorProbability, 0);
  const pathsValid = value.referenceGraph.paths.length > 0 && unique(pathIds) &&
    value.referenceGraph.paths.every((path) => unique(path.consensusFields.map((field) => field.id)) &&
      path.consensusFields.length > 0 && path.consensusFields.some((field) => field.weight > 0) &&
      path.consensusFields.every((field) => unique(field.evidenceStateIds) && field.evidenceStateIds.every((id) => all.has(id)) && field.weight >= 0 && field.weight <= 1) &&
      path.modelProvenanceRefs.length > 0 && unique(path.modelProvenanceRefs) && path.modelProvenanceRefs.every((ref) => ref.trim().length > 0) &&
      path.priorProbability >= 0 && path.priorProbability <= 1 && Number.isInteger(path.expertCount) && path.expertCount >= 0 &&
      ['authored-equivalence-class', 'weighted-expert-consensus', 'latent-corpus-cluster'].includes(path.kind) &&
      ['candidate', 'validated'].includes(path.validationStatus) && (path.validationStatus !== 'validated' || path.expertCount > 0));
  const transitionsValid = value.referenceGraph.transitions.every((transition) =>
    pathIds.includes(transition.fromPathId) && pathIds.includes(transition.toPathId) &&
    transition.fromPathId !== transition.toPathId &&
    (!transition.requiresExplanation || transition.explanationOperators.length > 0));
  const referenceGraphValid = unique(value.availableEvidenceIds) && unique(value.selectedEvidenceIds) &&
    pathsValid && transitionsValid && Math.abs(priorSum - 1) < 0.000001;
  const identityMatches = value.evaluatorPluginId === draft.outputState.domainId &&
    value.evaluatorPluginVersion === draft.outputState.provenance.domainVersion;
  const scoring = scoreExpansionPaths(value);
  const passed = referencesExist && structurallyLinked && referenceGraphValid && identityMatches &&
    value.minimumScore >= 0 && value.minimumScore <= 1 && scoring.score >= value.minimumScore;
  return {
    passed,
    details: {
      applied: true,
      referencesExist,
      structurallyLinked,
      referenceGraphValid,
      identityMatches,
      graphId: value.referenceGraph.id,
      graphVersion: value.referenceGraph.version,
      pathCount: value.referenceGraph.paths.length,
      priorSum,
      score: scoring.score,
      minimumScore: value.minimumScore,
      matchedPathId: scoring.matchedPathId,
      matchedPathLabel: scoring.matchedPathLabel,
      matchedPathValidationStatus: scoring.matchedPathValidationStatus,
      runnerUpPathId: scoring.runnerUpPathId,
      matchMargin: scoring.matchMargin,
      pathScores: scoring.pathScores.map((path) => ({
        pathId: path.pathId,
        pathLabel: path.pathLabel,
        pathKind: path.pathKind,
        validationStatus: path.validationStatus,
        expertCount: path.expertCount,
        priorProbability: path.priorProbability,
        score: path.score
      })),
      patternId: value.patternId,
      ontologyVersion: value.ontologyVersion
    }
  };
}

export function evaluateKernelConstraints(view: TraceView, draft: TransformationDraft): readonly ConstraintResult[] {
  const inputs = draft.inputStateIds.map((id) => view.states.get(id));
  const existingOutput = view.states.has(draft.outputState.id);
  const actor = view.actors.get(draft.actorId);
  const provenanceComplete = isProvenanceComplete(draft.provenance) && isProvenanceComplete(draft.outputState.provenance);
  const provenanceActorConsistent = draft.provenance.actorId === draft.actorId && draft.outputState.provenance.actorId === draft.actorId;
  const revisionRefsValid = [draft.provenance.revisionOf, draft.outputState.provenance.revisionOf]
    .every((id) => id === null || view.provenance.has(id));
  const inputAncestors = new Set<StateId>();
  for (const id of draft.inputStateIds) for (const ancestor of ancestors(view, id)) inputAncestors.add(ancestor);
  // New output IDs make cycles structurally impossible in normal writes; this still rejects malformed drafts.
  const acyclic = !draft.inputStateIds.includes(draft.outputState.id) && !inputAncestors.has(draft.outputState.id);
  const attention = draft.outputState.causalStage === 'attention';
  const attentionOk = !attention || inputs.filter((item): item is State => item !== undefined)
    .every((state) => STAGE_ORDER[state.causalStage] <= STAGE_ORDER.source);
  const witnessOk = inputs.filter((state): state is State => state !== undefined)
    .every((state) => witnessTransitionAllowed(state.provenance.witnessType, draft.outputState.provenance.witnessType));
  const expansion = evaluateExpansion(view, draft, draft.expansionEvaluation);

  return Object.freeze([
    result('InputsExist', inputs.every((item) => item !== undefined), 'Every input state must already exist.'),
    result('AppendOnly', !existingOutput, 'An output state id may never replace an existing state.'),
    result('ActorPresent', actor !== undefined, 'Every transformation must name a registered actor.'),
    result('ProvenancePresent', provenanceComplete && provenanceActorConsistent && revisionRefsValid,
      'State and transformation provenance must be complete, actor-consistent, and have valid revision lineage.',
      { provenanceComplete, provenanceActorConsistent, revisionRefsValid }),
    result('AcyclicCausation', acyclic, 'A state may not be its own direct or transitive cause.'),
    result('AttentionNotDownstream', attentionOk,
      'Attention may only be derived from source-stage inputs; observation, measurement, inference, and decision states are downstream.',
      { attention, inputStages: inputs.filter((item): item is State => item !== undefined).map((item) => item.causalStage) }),
    result('CompressExpandInverse', expansion.passed,
      'Expansion must match at least one validated expert pathway in the plugin-supplied reference graph.', expansion.details),
    result('WitnessTypePreserved', witnessOk, 'Machine-derived evidence may not silently become learner-derived.')
  ]);
}

function isProvenanceComplete(value: Provenance): boolean {
  return value.id.length > 0 && value.source.trim().length > 0 && value.method.trim().length > 0 &&
    value.actorId.length > 0 && value.domainId.trim().length > 0 && value.domainVersion.trim().length > 0 &&
    value.observedAt.length > 0 && value.recordedAt.length > 0 &&
    (value.confidence === null || (value.confidence >= 0 && value.confidence <= 1 && value.confidenceBasis !== null && value.confidenceBasis.trim().length > 0));
}
