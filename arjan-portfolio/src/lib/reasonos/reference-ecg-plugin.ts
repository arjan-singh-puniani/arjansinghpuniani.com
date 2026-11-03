import type {
  ConstraintResult,
  DomainConstraint,
  DomainConstraintContext,
  DomainPlugin,
  ExpansionEvaluation,
  ExpansionPathKind,
  ExpansionReferenceGraph,
  JsonObject,
  State,
  StateId
} from './core/browser';
import { scoreExpansionPaths } from './core/browser';

export interface EcgConsensusFieldDefinition {
  readonly conceptId: string;
  readonly weight: number;
  readonly polarity: ConceptPolarity;
}

export interface EcgExpertPathDefinition {
  readonly id: string;
  readonly label: string;
  readonly kind: ExpansionPathKind;
  readonly validationStatus: 'candidate' | 'validated';
  readonly priorProbability: number;
  readonly expertCount: number;
  readonly modelProvenanceRefs: readonly string[];
  readonly fields: readonly EcgConsensusFieldDefinition[];
}

export interface EcgPathGraphDefinition {
  readonly id: string;
  readonly version: string;
  readonly paths: readonly EcgExpertPathDefinition[];
  readonly transitions: ExpansionReferenceGraph['transitions'];
}

export interface EcgPlugin extends DomainPlugin {
  readonly label: string;
  readonly operatorVocabulary: readonly string[];
  readonly quantifiers: readonly string[];
  readonly comparisonOutcomes: readonly string[];
  readonly comparisonClasses: readonly {
    id: 'capture' | 'observer' | 'subject';
    label: string;
    members: readonly string[];
  }[];
  readonly expansionReferenceGraphs: Readonly<Record<string, EcgPathGraphDefinition>>;
}

export type ConceptPolarity = 'present' | 'absent' | 'unknown';
export interface ConceptAssertion {
  readonly conceptId: string;
  readonly polarity: ConceptPolarity;
}

const VERSION = '0.5.0';
const PLUGIN_ID = 'ecg';

function result(
  code: string,
  passed: boolean,
  reason: string,
  details: JsonObject = {},
  severity: ConstraintResult['severity'] = 'required'
): ConstraintResult {
  return Object.freeze({
    code,
    scope: 'domain',
    severity,
    passed,
    reason,
    evaluator: '@reasonos/ecg-plugin',
    evaluatorVersion: VERSION,
    details
  });
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}
function array(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}
function object(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}
function inputStates(context: DomainConstraintContext): readonly State[] {
  return context.draft.inputStateIds
    .map((id) => context.trace.states.get(id))
    .filter((state): state is State => state !== undefined);
}
function unexaminedKillCriterion(state: State): boolean {
  const value = object(state.payload.killCriterion);
  return value?.status === 'unexamined';
}


function transition(fromPathId: string, toPathId: string): ExpansionReferenceGraph['transitions'][number] {
  return { fromPathId, toPathId, requiresExplanation: true, explanationOperators: ['DetectContradiction', 'Revise'] };
}

const EXPANSION_REFERENCE_GRAPHS: Readonly<Record<string, EcgPathGraphDefinition>> = Object.freeze({
  'sinus rhythm': {
    id: 'ecg:sinus-rhythm:expert-paths', version: '1.0.0',
    paths: [
      { id: 'morphology-led', label: 'Morphology-led sinus pathway', kind: 'authored-equivalence-class', validationStatus: 'candidate', priorProbability: 0.5, expertCount: 0, modelProvenanceRefs: ['ontology-candidate:ecg-sinus:morphology-led:v1'], fields: [
        { conceptId: 'p-wave-morphology', weight: 1, polarity: 'present' },
        { conceptId: 'p-qrs-relationship', weight: 1, polarity: 'present' }
      ] },
      { id: 'timing-led', label: 'Timing-led sinus pathway', kind: 'authored-equivalence-class', validationStatus: 'candidate', priorProbability: 0.5, expertCount: 0, modelProvenanceRefs: ['ontology-candidate:ecg-sinus:timing-led:v1'], fields: [
        { conceptId: 'regularity', weight: 1, polarity: 'present' },
        { conceptId: 'rate', weight: 1, polarity: 'present' },
        { conceptId: 'p-qrs-relationship', weight: 1, polarity: 'present' }
      ] }
    ],
    transitions: [transition('morphology-led', 'timing-led'), transition('timing-led', 'morphology-led')]
  },
  'organized atrial activation': {
    id: 'ecg:organized-atrial-activation:expert-paths', version: '1.0.0',
    paths: [{ id: 'morphology-relationship', label: 'Morphology and relationship', kind: 'authored-equivalence-class', validationStatus: 'candidate', priorProbability: 1, expertCount: 0, modelProvenanceRefs: ['ontology-candidate:ecg-atrial-activation:v1'], fields: [
      { conceptId: 'p-wave-morphology', weight: 1, polarity: 'present' },
      { conceptId: 'p-qrs-relationship', weight: 1, polarity: 'present' }
    ] }], transitions: []
  },
  'normal axis': {
    id: 'ecg:normal-axis:expert-paths', version: '1.0.0',
    paths: [
      { id: 'quadrant-method', label: 'Lead I/aVF quadrant method', kind: 'authored-equivalence-class', validationStatus: 'candidate', priorProbability: 0.67, expertCount: 0, modelProvenanceRefs: ['ontology-candidate:ecg-axis:quadrant:v1'], fields: [
        { conceptId: 'lead-i-polarity', weight: 1, polarity: 'present' },
        { conceptId: 'avf-polarity', weight: 1, polarity: 'present' }
      ] },
      { id: 'vector-angle-method', label: 'Vector angle method', kind: 'authored-equivalence-class', validationStatus: 'candidate', priorProbability: 0.33, expertCount: 0, modelProvenanceRefs: ['ontology-candidate:ecg-axis:vector-angle:v1'], fields: [
        { conceptId: 'axis-angle', weight: 1, polarity: 'present' }
      ] }
    ], transitions: [transition('quadrant-method', 'vector-angle-method'), transition('vector-angle-method', 'quadrant-method')]
  },
  'normal intervals': {
    id: 'ecg:normal-intervals:expert-paths', version: '1.0.0',
    paths: [{ id: 'complete-interval-set', label: 'Complete interval set', kind: 'authored-equivalence-class', validationStatus: 'candidate', priorProbability: 1, expertCount: 0, modelProvenanceRefs: ['ontology-candidate:ecg-intervals:v1'], fields: [
      { conceptId: 'pr-interval', weight: 1, polarity: 'present' },
      { conceptId: 'qrs-duration', weight: 1, polarity: 'present' },
      { conceptId: 'qt-interval', weight: 1, polarity: 'present' }
    ] }], transitions: []
  },
  'acute anterior injury': {
    id: 'ecg:acute-anterior-injury:expert-paths', version: '1.0.0',
    paths: [
      { id: 'primary-anterior-morphology', label: 'Primary anterior morphology', kind: 'authored-equivalence-class', validationStatus: 'candidate', priorProbability: 0.5, expertCount: 0, modelProvenanceRefs: ['ontology-candidate:acute-anterior-injury:primary:v1'], fields: [
        { conceptId: 'anterior-st-elevation', weight: 1, polarity: 'present' },
        { conceptId: 'contiguous-anterior-distribution', weight: 1, polarity: 'present' }
      ] },
      { id: 'inferior-reciprocal-pattern', label: 'Inferior reciprocal pattern', kind: 'authored-equivalence-class', validationStatus: 'candidate', priorProbability: 0.5, expertCount: 0, modelProvenanceRefs: ['ontology-candidate:acute-anterior-injury:reciprocal:v1'], fields: [
        { conceptId: 'inferior-reciprocal-depression', weight: 1, polarity: 'present' },
        { conceptId: 'reciprocal-pattern', weight: 1, polarity: 'present' }
      ] }
    ], transitions: [transition('primary-anterior-morphology', 'inferior-reciprocal-pattern'), transition('inferior-reciprocal-pattern', 'primary-anterior-morphology')]
  }
});

const constraints: readonly DomainConstraint[] = [
  {
    code: 'ECG.MeasurementReady',
    version: VERSION,
    evaluate(context): ConstraintResult {
      const { draft } = context;
      if (draft.operator !== 'Measure') return result(this.code, true, 'Not a Measure transformation.');
      const calibrationId = text(draft.payload.calibrationId);
      const raw = object(draft.payload.rawOperation);
      const pointA = object(raw?.a);
      const pointB = object(raw?.b);
      const validPoint = (point: Record<string, unknown> | null): boolean =>
        point !== null && Number.isFinite(point.x) && Number.isFinite(point.y);
      const validRaw = validPoint(pointA) && validPoint(pointB) &&
        (pointA?.x !== pointB?.x || pointA?.y !== pointB?.y);
      const hasCalibrationInput = inputStates(context).some((state) =>
        state.role === 'calibration' &&
        (state.payload.calibrationId === calibrationId || state.payload.recordingId === draft.outputState.payload.recordingId)
      );
      return result(
        this.code,
        calibrationId.length > 0 && validRaw && hasCalibrationInput,
        'ECG measurement requires a referenced calibration state and a non-degenerate two-point raw operation.',
        { calibrationId, validRaw, hasCalibrationInput }
      );
    }
  },
  {
    code: 'ECG.ObservationLocalized',
    version: VERSION,
    evaluate({ draft }): ConstraintResult {
      if (draft.operator !== 'Observe') return result(this.code, true, 'Not an Observe transformation.');
      const claim = text(draft.payload.text).trim();
      const location = text(draft.payload.location).trim();
      const leads = array(draft.payload.leadOrLeads).filter((item): item is string => typeof item === 'string');
      const localized = claim.length > 2 && location.length > 2 && leads.length > 0;
      return result(
        this.code,
        localized,
        'An ECG observation must contain a claim, an exact source location, and at least one lead reference.',
        { claimLength: claim.length, locationLength: location.length, leadCount: leads.length }
      );
    }
  },
  {
    code: 'ECG.MachineNotTruth',
    version: VERSION,
    evaluate(context): ConstraintResult {
      const { draft } = context;
      if (!['Observe', 'Hypothesize', 'Decide', 'Revise'].includes(draft.operator)) {
        return result(this.code, true, 'Operator does not assert or revise an ECG interpretation.');
      }
      const inputs = inputStates(context);
      const machineOnly = inputs.length > 0 && inputs.every((state) => state.provenance.witnessType === 'machine-derived');
      return result(
        this.code,
        !machineOnly,
        'Machine-derived states may not be the sole witness for an ECG interpretation.',
        { machineOnly, inputCount: inputs.length }
      );
    }
  },
  {
    code: 'ECG.CompressionKnown',
    version: VERSION,
    evaluate({ draft }): ConstraintResult {
      if (draft.operator !== 'Compress') return result(this.code, true, 'Not a Compress transformation.');
      const pattern = text(draft.payload.patternId).toLowerCase();
      const known = Object.prototype.hasOwnProperty.call(ECG_PLUGIN.expansionReferenceGraphs, pattern);
      return result(
        this.code,
        known,
        'Compression must use a versioned ECG ontology pattern.',
        { pattern }
      );
    }
  },
  {
    code: 'ECG.CompressionGrounded',
    version: VERSION,
    evaluate(context): ConstraintResult {
      const { draft } = context;
      if (draft.operator !== 'Compress') return result(this.code, true, 'Not a Compress transformation.');
      const evidenceInputs = inputStates(context).filter((state) => state.role === 'localized-observation');
      return result(
        this.code,
        evidenceInputs.length >= 2,
        'Compression requires at least two accepted localized observations as inputs.',
        { evidenceInputCount: evidenceInputs.length }
      );
    }
  },
  {
    code: 'ECG.CompareClassified',
    version: VERSION,
    evaluate({ draft }): ConstraintResult {
      if (draft.operator !== 'Compare') return result(this.code, true, 'Not a Compare transformation.');
      const classification = text(draft.payload.classification);
      const knownMembers = ECG_PLUGIN.comparisonClasses.flatMap((item) => item.members);
      const valid = knownMembers.includes(classification) || ECG_PLUGIN.comparisonOutcomes.includes(classification);
      return result(
        this.code,
        valid,
        'ECG comparisons must use a versioned plugin classification.',
        { classification }
      );
    }
  },
  {
    code: 'ECG.ContradictionLinked',
    version: VERSION,
    evaluate(context): ConstraintResult {
      if (context.draft.operator !== 'DetectContradiction') return result(this.code, true, 'Not a contradiction transformation.');
      const evidenceInputs = inputStates(context).filter((state) =>
        state.role === 'localized-observation' || state.role === 'candidate-explanation' || state.role === 'revised-hypothesis'
      );
      const description = text(context.draft.payload.description).trim();
      return result(
        this.code,
        evidenceInputs.length >= 2 && description.length > 4,
        'A contradiction must link at least two accepted epistemic states and describe the conflict.',
        { linkedStateCount: evidenceInputs.length, descriptionLength: description.length }
      );
    }
  },
  {
    code: 'ECG.RevisionGrounded',
    version: VERSION,
    evaluate(context): ConstraintResult {
      if (context.draft.operator !== 'Revise') return result(this.code, true, 'Not a Revise transformation.');
      const reason = text(context.draft.payload.reason).trim();
      const revisionInputs = inputStates(context).filter((state) =>
        ['localized-observation', 'candidate-explanation', 'revised-hypothesis', 'contradiction'].includes(state.role)
      );
      const lineagePresent = context.draft.provenance.revisionOf !== null && context.draft.outputState.provenance.revisionOf !== null;
      return result(
        this.code,
        reason.length > 4 && revisionInputs.length > 0 && lineagePresent,
        'A revision requires a reason, a prior accepted epistemic state, and explicit provenance lineage.',
        { reasonLength: reason.length, revisionInputCount: revisionInputs.length, lineagePresent }
      );
    }
  },
  {
    code: 'ECG.ReferencePathValidated',
    version: VERSION,
    evaluate({ draft }): ConstraintResult {
      if (draft.operator !== 'Expand') return result(this.code, true, 'Not an Expand transformation.', {}, 'warning');
      if (draft.expansionEvaluation === null) return result(this.code, false, 'Expansion has no expert reference graph.', {}, 'warning');
      const match = scoreExpansionPaths(draft.expansionEvaluation);
      const path = draft.expansionEvaluation.referenceGraph.paths.find((item) => item.id === match.matchedPathId);
      const validated = path?.validationStatus === 'validated';
      return result(
        this.code,
        validated,
        validated
          ? 'The matched pathway is backed by a validated expert reference model.'
          : 'The matched pathway is an authored candidate awaiting expert-trace validation; do not present its score as expert consensus.',
        { matchedPathId: match.matchedPathId, validationStatus: path?.validationStatus ?? null, expertCount: path?.expertCount ?? 0 },
        'warning'
      );
    }
  },
  {
    code: 'ECG.PathTransitionExplained',
    version: VERSION,
    evaluate(context): ConstraintResult {
      const { draft, trace } = context;
      if (!['Compress', 'Expand'].includes(draft.operator)) return result(this.code, true, 'Operator does not declare an expert pathway.', {}, 'warning');
      const currentPathId = text(draft.payload.matchedPathId);
      const patternId = text(draft.payload.patternId).toLowerCase();
      const recordingId = text(draft.payload.recordingId);
      if (currentPathId.length === 0 || patternId.length === 0) return result(this.code, true, 'No classifiable pathway is declared.', { currentPathId, patternId }, 'warning');
      const prior = [...trace.acceptedTransformations].reverse().find((item) =>
        ['Compress', 'Expand'].includes(item.operator) && item.payload.patternId === patternId &&
        item.payload.recordingId === recordingId && typeof item.payload.matchedPathId === 'string'
      );
      const priorPathId = prior === undefined ? '' : text(prior.payload.matchedPathId);
      if (prior === undefined || priorPathId.length === 0 || priorPathId === currentPathId) {
        return result(this.code, true, 'The learner remains on the same expert pathway or has no prior path.', { priorPathId, currentPathId }, 'warning');
      }
      const graph = ECG_PLUGIN.expansionReferenceGraphs[patternId];
      const transitionRule = graph?.transitions.find((item) => item.fromPathId === priorPathId && item.toPathId === currentPathId);
      const subsequent = trace.acceptedTransformations.filter((item) => item.sequence > prior.sequence);
      const explanationOperator = transitionRule?.explanationOperators.find((operator) => subsequent.some((item) => item.operator === operator)) ?? null;
      const explained = transitionRule?.requiresExplanation !== true || explanationOperator !== null;
      return result(
        this.code,
        explained,
        explained
          ? 'The pathway transition is linked to an explicit contradiction or revision.'
          : 'The learner changed expert pathways without an intervening contradiction or revision; prompt for an explanation.',
        { priorPathId, currentPathId, explanationOperator, requiresExplanation: transitionRule?.requiresExplanation ?? false },
        'warning'
      );
    }
  },
  {
    code: 'ECG.DecisionClosure',
    version: VERSION,
    evaluate(context): ConstraintResult {
      if (context.draft.operator !== 'Decide') return result(this.code, true, 'Not a Decide transformation.');
      const stopping = text(context.draft.payload.stoppingRule).trim();
      const alternatives = text(context.draft.payload.rejectedAlternatives).trim();
      const evidenceInputs = inputStates(context);
      const openKillCriteria = evidenceInputs.filter(unexaminedKillCriterion).length;
      const hasIndependentEvidence = evidenceInputs.some((state) =>
        state.provenance.witnessType === 'learner-derived' || state.provenance.witnessType === 'expert-derived'
      );
      const passed = stopping.length > 4 && alternatives.length > 4 && openKillCriteria === 0 && hasIndependentEvidence;
      return result(
        this.code,
        passed,
        'Decision requires a stopping rule, rejected alternatives, no unexamined kill criterion, and at least one non-machine witness.',
        { openKillCriteria, hasIndependentEvidence, stoppingLength: stopping.length, alternativesLength: alternatives.length }
      );
    }
  }
];

export const ECG_PLUGIN = Object.freeze({
  id: PLUGIN_ID,
  version: VERSION,
  label: 'VECTOR ECG',
  constraints,
  operatorVocabulary: [
    'Attend', 'Observe', 'Localize', 'Measure', 'Compare', 'Predict', 'Hypothesize',
    'WeighEvidence', 'DetectContradiction', 'Revise', 'Compress', 'Expand', 'Reflect',
    'Decide', 'Intervene', 'Calibrate'
  ],
  quantifiers: ['two-point-caliper', 'axis-angle-estimator', 'rate-counter'],
  comparisonOutcomes: ['stable', 'minor variation', 'uncertain', 'potentially meaningful'],
  comparisonClasses: [
    { id: 'capture', label: 'Acquisition or representation effect', members: ['image-quality', 'baseline-artifact', 'lead-placement'] },
    { id: 'observer', label: 'Observer or measurement effect', members: ['measurement-variability', 'boundary-method'] },
    { id: 'subject', label: 'True subject change', members: ['physiological-variation', 'meaningful-morphology-change'] }
  ],
  expansionReferenceGraphs: EXPANSION_REFERENCE_GRAPHS
} satisfies EcgPlugin);

function conceptPolarity(source: string, positive: RegExp, negative: RegExp): ConceptPolarity | null {
  if (negative.test(source)) return 'absent';
  if (positive.test(source)) return 'present';
  return null;
}

export function evidenceConceptAssertions(textValue: string, location: string, leads: readonly string[]): ConceptAssertion[] {
  const source = `${textValue} ${location} ${leads.join(' ')}`.toLowerCase();
  const rules: readonly [string, RegExp, RegExp][] = [
    ['p-wave-morphology', /\bp[- ]?waves?\b|upright p/, /\b(no|absent|without)\s+p[- ]?waves?\b/],
    ['regularity', /\bregular\b/, /\birregular\b/],
    ['p-qrs-relationship', /before each qrs|p.*qrs|1:1/, /dissociat|no relationship|not before each qrs/],
    ['rate', /\brate\b|\bbpm\b/, /rate not measured|unknown rate/],
    ['pr-interval', /\bpr\b/, /pr not measured|unknown pr/],
    ['qrs-duration', /qrs duration|narrow qrs|wide qrs/, /qrs not measured|unknown qrs/],
    ['qt-interval', /\bqt\b/, /qt not measured|unknown qt/],
    ['lead-i-polarity', /lead i|\bi\b/, /lead i not assessed/],
    ['avf-polarity', /avf/, /avf not assessed/],
    ['axis-angle', /axis/, /axis not measured|unknown axis/],
    ['st-elevation', /st elevation|st-elevation/, /no st elevation/],
    ['anterior-st-elevation', /(?:st elevation|st-elevation).*(?:v2|v3|v4)/, /no (?:anterior )?st elevation/],
    ['contiguous-anterior-distribution', /(?:v2.*v3|v3.*v4|v2.*v4)/, /not contiguous|isolated lead/],
    ['inferior-reciprocal-depression', /(?:reciprocal )?st depression.*(?:ii|iii|avf)/, /no (?:inferior )?(?:reciprocal )?st depression/],
    ['reciprocal-pattern', /reciprocal (?:st )?(?:change|changes|depression|pattern)/, /no reciprocal (?:change|changes|pattern)/],
    ['qrs-widening', /wide qrs|qrs widening/, /narrow qrs|no qrs widening/],
    ['irregular-irregular', /irregularly irregular/, /not irregularly irregular/],
    ['absent-p-waves', /absent p|no p wave/, /p waves? present/]
  ];
  return rules.flatMap(([conceptId, positive, negative]) => {
    const polarity = conceptPolarity(source, positive, negative);
    return polarity === null ? [] : [{ conceptId, polarity }];
  });
}

export const evidenceConcepts = (textValue: string, location: string, leads: readonly string[]): string[] =>
  evidenceConceptAssertions(textValue, location, leads).map((item) => item.conceptId);

export interface ExpansionEvidenceCandidate {
  readonly stateId: StateId;
  readonly assertions: readonly ConceptAssertion[];
}

function materializeReferenceGraph(pattern: string, available: readonly ExpansionEvidenceCandidate[]): ExpansionReferenceGraph {
  const definition = ECG_PLUGIN.expansionReferenceGraphs[pattern];
  if (definition === undefined) throw new Error(`Unknown ECG expansion pattern: ${pattern}`);
  return {
    id: definition.id,
    version: definition.version,
    paths: definition.paths.map((path) => ({
      id: path.id,
      label: path.label,
      kind: path.kind,
      validationStatus: path.validationStatus,
      priorProbability: path.priorProbability,
      expertCount: path.expertCount,
      modelProvenanceRefs: [...path.modelProvenanceRefs],
      consensusFields: path.fields.map((field) => ({
        id: field.conceptId,
        weight: field.weight,
        evidenceStateIds: available.filter((item) => item.assertions.some((assertion) =>
          assertion.conceptId === field.conceptId && assertion.polarity === field.polarity
        )).map((item) => item.stateId)
      }))
    })),
    transitions: definition.transitions.map((item) => ({ ...item, explanationOperators: [...item.explanationOperators] }))
  };
}

export function buildExpansionEvaluation(args: {
  compressionStateId: StateId;
  patternId: string;
  ontologyVersion?: string;
  available: readonly ExpansionEvidenceCandidate[];
  selectedStateIds: readonly StateId[];
  minimumScore?: number;
}): ExpansionEvaluation {
  const pattern = args.patternId.toLowerCase();
  return Object.freeze({
    compressionStateId: args.compressionStateId,
    patternId: pattern,
    ontologyVersion: args.ontologyVersion ?? ECG_PLUGIN.version,
    evaluatorPluginId: ECG_PLUGIN.id,
    evaluatorPluginVersion: ECG_PLUGIN.version,
    availableEvidenceIds: args.available.map((item) => item.stateId),
    selectedEvidenceIds: [...args.selectedStateIds],
    referenceGraph: materializeReferenceGraph(pattern, args.available),
    minimumScore: args.minimumScore ?? 0.85
  });
}

export function matchEvidencePath(args: {
  patternId: string;
  available: readonly ExpansionEvidenceCandidate[];
  selectedStateIds: readonly StateId[];
}): ReturnType<typeof scoreExpansionPaths> {
  const evaluation = buildExpansionEvaluation({
    compressionStateId: 'path-classification-only' as StateId,
    patternId: args.patternId,
    available: args.available,
    selectedStateIds: args.selectedStateIds,
    minimumScore: 0
  });
  return scoreExpansionPaths(evaluation);
}
