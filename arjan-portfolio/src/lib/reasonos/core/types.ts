export type Brand<T, Name extends string> = T & { readonly __brand: Name };
export type ActorId = Brand<string, 'ActorId'>;
export type StateId = Brand<string, 'StateId'>;
export type TransformationId = Brand<string, 'TransformationId'>;
export type ProvenanceId = Brand<string, 'ProvenanceId'>;
export type TraceId = Brand<string, 'TraceId'>;
export type EventId = Brand<string, 'EventId'>;
export type IsoTimestamp = Brand<string, 'IsoTimestamp'>;
export type Sha256 = Brand<string, 'Sha256'>;
export type Signature = Brand<string, 'Signature'>;

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | readonly JsonValue[] | { readonly [key: string]: JsonValue };
export type JsonObject = { readonly [key: string]: JsonValue };

export type ActorKind = 'learner' | 'expert' | 'tutor' | 'tool' | 'simulator' | 'model' | 'group' | 'system';
export interface Actor {
  readonly id: ActorId;
  readonly kind: ActorKind;
  readonly label: string;
  readonly version: string | null;
  readonly authority: string | null;
}

export type WitnessType =
  | 'learner-derived'
  | 'expert-derived'
  | 'machine-derived'
  | 'application-calculated'
  | 'reference-derived'
  | 'simulation-derived';
export type VerificationStatus = 'unverified' | 'verified' | 'disputed' | 'rejected';

export interface Provenance {
  readonly id: ProvenanceId;
  readonly source: string;
  readonly method: string;
  readonly actorId: ActorId;
  readonly witnessType: WitnessType;
  readonly verificationStatus: VerificationStatus;
  readonly observedAt: IsoTimestamp;
  readonly recordedAt: IsoTimestamp;
  readonly domainId: string;
  readonly domainVersion: string;
  readonly modelVersion: string | null;
  readonly revisionOf: ProvenanceId | null;
  readonly confidence: number | null;
  readonly confidenceBasis: string | null;
  readonly sourceRefs: readonly string[];
}

export type StateCategory = 'Perceptual' | 'Epistemic' | 'External' | 'Learner' | 'Instructional';
/** Domain-free causal position. Plugins may refine, never reorder, these stages. */
export type CausalStage = 'source' | 'attention' | 'observation' | 'measurement' | 'inference' | 'decision' | 'meta';
export interface State {
  readonly id: StateId;
  readonly category: StateCategory;
  readonly role: string;
  readonly causalStage: CausalStage;
  readonly domainId: string;
  readonly schemaVersion: string;
  readonly payload: JsonObject;
  readonly provenance: Provenance;
  readonly createdAt: IsoTimestamp;
}

export type ExpansionPathKind = 'authored-equivalence-class' | 'weighted-expert-consensus' | 'latent-corpus-cluster';
export type ExpansionPathValidationStatus = 'candidate' | 'validated';

export interface ExpansionConsensusField {
  readonly id: string;
  readonly weight: number;
  readonly evidenceStateIds: readonly StateId[];
}

export interface ExpansionPathModel {
  readonly id: string;
  readonly label: string;
  readonly kind: ExpansionPathKind;
  readonly validationStatus: ExpansionPathValidationStatus;
  readonly priorProbability: number;
  readonly expertCount: number;
  readonly modelProvenanceRefs: readonly string[];
  readonly consensusFields: readonly ExpansionConsensusField[];
}

export interface ExpansionPathTransition {
  readonly fromPathId: string;
  readonly toPathId: string;
  readonly requiresExplanation: boolean;
  readonly explanationOperators: readonly string[];
}

/**
 * A plugin-derived graph of independently valid expert reasoning pathways.
 * The kernel validates graph shape and performs only pure MinMax set math; it
 * never derives weights, expert clusters, domain meaning, or transition policy.
 */
export interface ExpansionReferenceGraph {
  readonly id: string;
  readonly version: string;
  readonly paths: readonly ExpansionPathModel[];
  readonly transitions: readonly ExpansionPathTransition[];
}

export interface ExpansionEvaluation {
  readonly compressionStateId: StateId;
  readonly patternId: string;
  readonly ontologyVersion: string;
  readonly evaluatorPluginId: string;
  readonly evaluatorPluginVersion: string;
  readonly availableEvidenceIds: readonly StateId[];
  readonly selectedEvidenceIds: readonly StateId[];
  readonly referenceGraph: ExpansionReferenceGraph;
  readonly minimumScore: number;
}

export interface TransformationDraft {
  readonly id: TransformationId;
  readonly operator: string;
  readonly actorId: ActorId;
  readonly inputStateIds: readonly StateId[];
  readonly outputState: State;
  readonly attemptedAt: IsoTimestamp;
  readonly provenance: Provenance;
  readonly payload: JsonObject;
  readonly expansionEvaluation: ExpansionEvaluation | null;
}

export type ConstraintScope = 'kernel' | 'domain';
export type ConstraintSeverity = 'required' | 'warning';
export interface ConstraintResult {
  readonly code: string;
  readonly scope: ConstraintScope;
  readonly severity: ConstraintSeverity;
  readonly passed: boolean;
  readonly reason: string;
  readonly evaluator: string;
  readonly evaluatorVersion: string;
  readonly details: JsonObject;
}

export interface Transformation {
  readonly id: TransformationId;
  readonly sequence: number;
  readonly operator: string;
  readonly actorId: ActorId;
  readonly inputStateIds: readonly StateId[];
  readonly outputStateId: StateId;
  readonly attemptedAt: IsoTimestamp;
  readonly provenance: Provenance;
  readonly payload: JsonObject;
  readonly expansionEvaluation: ExpansionEvaluation | null;
  readonly constraints: readonly ConstraintResult[];
  readonly accepted: boolean;
}

export type TraceEvent =
  | { readonly type: 'actor.registered'; readonly actor: Actor }
  | { readonly type: 'state.seeded'; readonly state: State }
  | { readonly type: 'transformation.attempted'; readonly transformation: Transformation; readonly outputState: State };

export interface TraceEntry {
  readonly eventId: EventId;
  readonly traceId: TraceId;
  readonly sequence: number;
  readonly recordedAt: IsoTimestamp;
  readonly previousHash: Sha256 | null;
  readonly eventHash: Sha256;
  readonly event: TraceEvent;
}

export interface Trace {
  readonly id: TraceId;
  readonly entries: readonly TraceEntry[];
}

export interface TraceView {
  readonly trace: Trace;
  readonly actors: ReadonlyMap<ActorId, Actor>;
  readonly states: ReadonlyMap<StateId, State>;
  readonly transformations: readonly Transformation[];
  readonly acceptedTransformations: readonly Transformation[];
  readonly rejectedTransformations: readonly Transformation[];
  readonly provenance: ReadonlyMap<ProvenanceId, Provenance>;
}

export interface DomainConstraintContext {
  readonly trace: TraceView;
  readonly draft: TransformationDraft;
}

export interface DomainConstraint {
  readonly code: string;
  readonly version: string;
  evaluate(context: DomainConstraintContext): ConstraintResult;
}

export interface DomainPlugin {
  readonly id: string;
  readonly version: string;
  readonly constraints: readonly DomainConstraint[];
}

export interface AppendReceipt {
  readonly entry: TraceEntry;
  readonly transformation: Transformation;
  readonly trace: Trace;
}

export interface TraceCheckpoint {
  readonly traceId: TraceId;
  readonly sequence: number;
  readonly eventHash: Sha256 | null;
  readonly signedAt: IsoTimestamp;
  readonly signer: string;
  readonly algorithm: 'hmac-sha256';
  readonly signature: Signature;
}
