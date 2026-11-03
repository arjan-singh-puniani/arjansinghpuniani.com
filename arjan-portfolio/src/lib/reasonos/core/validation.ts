import type { Actor, JsonValue, Provenance, State, TransformationDraft } from './types';

export class ValidationError extends Error {
  public constructor(message: string) { super(message); this.name = 'ValidationError'; }
}

function requireText(value: string, field: string): void {
  if (value.trim().length === 0) throw new ValidationError(`${field} must be non-empty.`);
}
function requireIso(value: string, field: string): void {
  requireText(value, field);
  if (!Number.isFinite(Date.parse(value))) throw new ValidationError(`${field} must be a valid ISO timestamp.`);
}
function validateJson(value: JsonValue, path = '$'): void {
  if (typeof value === 'number' && !Number.isFinite(value)) throw new ValidationError(`${path} contains a non-finite number.`);
  if (Array.isArray(value)) { value.forEach((item, index) => validateJson(item, `${path}[${index}]`)); return; }
  if (value !== null && typeof value === 'object') for (const [key, child] of Object.entries(value)) validateJson(child, `${path}.${key}`);
}

export function validateActor(actor: Actor): void {
  requireText(actor.id, 'actor.id'); requireText(actor.label, 'actor.label');
  if (actor.version !== null) requireText(actor.version, 'actor.version');
}
export function validateProvenance(provenance: Provenance): void {
  requireText(provenance.id, 'provenance.id'); requireText(provenance.source, 'provenance.source');
  requireText(provenance.method, 'provenance.method'); requireText(provenance.actorId, 'provenance.actorId');
  requireText(provenance.domainId, 'provenance.domainId'); requireText(provenance.domainVersion, 'provenance.domainVersion');
  requireIso(provenance.observedAt, 'provenance.observedAt'); requireIso(provenance.recordedAt, 'provenance.recordedAt');
  if (provenance.confidence !== null && (provenance.confidence < 0 || provenance.confidence > 1)) throw new ValidationError('provenance.confidence must be null or within [0,1].');
  if (provenance.confidence !== null && (provenance.confidenceBasis === null || provenance.confidenceBasis.trim() === '')) throw new ValidationError('A confidence value requires confidenceBasis describing the observed behavior or method.');
}
export function validateState(state: State): void {
  requireText(state.id, 'state.id'); requireText(state.role, 'state.role'); requireText(state.domainId, 'state.domainId');
  requireText(state.schemaVersion, 'state.schemaVersion'); validateProvenance(state.provenance); validateJson(state.payload);
  requireIso(state.createdAt, 'state.createdAt');
  if (state.provenance.domainId !== state.domainId) throw new ValidationError('State and provenance domainId must match.');
}
export function validateDraft(draft: TransformationDraft): void {
  requireText(draft.id, 'draft.id'); requireText(draft.operator, 'draft.operator'); requireText(draft.actorId, 'draft.actorId');
  requireIso(draft.attemptedAt, 'draft.attemptedAt');
  validateProvenance(draft.provenance); validateState(draft.outputState); validateJson(draft.payload);
  if (draft.provenance.actorId !== draft.actorId) throw new ValidationError('Transformation provenance actorId must match actorId.');
  if (new Set(draft.inputStateIds).size !== draft.inputStateIds.length) throw new ValidationError('inputStateIds must not contain duplicates.');
  if (draft.expansionEvaluation !== null) {
    const e = draft.expansionEvaluation;
    validateJson(e as unknown as JsonValue, '$.expansionEvaluation');
    requireText(e.patternId, 'expansionEvaluation.patternId');
    requireText(e.ontologyVersion, 'expansionEvaluation.ontologyVersion');
    requireText(e.evaluatorPluginId, 'expansionEvaluation.evaluatorPluginId');
    requireText(e.evaluatorPluginVersion, 'expansionEvaluation.evaluatorPluginVersion');
    requireText(e.referenceGraph.id, 'expansionEvaluation.referenceGraph.id');
    requireText(e.referenceGraph.version, 'expansionEvaluation.referenceGraph.version');
    if (!Number.isFinite(e.minimumScore) || e.minimumScore < 0 || e.minimumScore > 1) throw new ValidationError('expansionEvaluation.minimumScore must be within [0,1].');
    if (e.referenceGraph.paths.length === 0) throw new ValidationError('expansionEvaluation.referenceGraph.paths must not be empty.');
    for (const path of e.referenceGraph.paths) {
      requireText(path.id, 'expansionEvaluation.referenceGraph.paths[].id');
      requireText(path.label, 'expansionEvaluation.referenceGraph.paths[].label');
      if (!['authored-equivalence-class', 'weighted-expert-consensus', 'latent-corpus-cluster'].includes(path.kind)) throw new ValidationError('Expansion path kind is invalid.');
      if (!['candidate', 'validated'].includes(path.validationStatus)) throw new ValidationError('Expansion path validationStatus is invalid.');
      if (!Number.isFinite(path.priorProbability) || path.priorProbability < 0 || path.priorProbability > 1) throw new ValidationError('Expansion path priorProbability must be within [0,1].');
      if (!Number.isInteger(path.expertCount) || path.expertCount < 0) throw new ValidationError('Expansion path expertCount must be a non-negative integer.');
      if (path.validationStatus === 'validated' && path.expertCount < 1) throw new ValidationError('A validated expansion path requires at least one expert trace.');
      if (path.modelProvenanceRefs.length === 0) throw new ValidationError('Expansion path modelProvenanceRefs must not be empty.');
      path.modelProvenanceRefs.forEach((ref) => requireText(ref, 'expansionEvaluation.referenceGraph.paths[].modelProvenanceRefs[]'));
      for (const field of path.consensusFields) {
        requireText(field.id, 'expansionEvaluation.referenceGraph.paths[].consensusFields[].id');
        if (!Number.isFinite(field.weight) || field.weight < 0 || field.weight > 1) throw new ValidationError('Expansion consensus field weight must be within [0,1].');
      }
    }
    for (const transition of e.referenceGraph.transitions) {
      requireText(transition.fromPathId, 'expansionEvaluation.referenceGraph.transitions[].fromPathId');
      requireText(transition.toPathId, 'expansionEvaluation.referenceGraph.transitions[].toPathId');
      transition.explanationOperators.forEach((operator) => requireText(operator, 'expansionEvaluation.referenceGraph.transitions[].explanationOperators[]'));
    }
  }
}
