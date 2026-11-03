import { canonicalize, sha256 } from './canonical';
import { evaluateKernelConstraints } from './constraints';
import { projectTrace } from './projector';
import { RandomIdGenerator, SystemClock, asJson, deepFreeze, type Clock, type IdGenerator } from './runtime';
import { validateActor, validateDraft, validateState } from './validation';
import type { Actor, AppendReceipt, DomainPlugin, JsonValue, State, Trace, TraceEntry, TraceEvent, Transformation, TransformationDraft } from './types';

export interface TraceStore {
  createTrace(): Trace;
  registerActor(trace: Trace, actor: Actor): Trace;
  seedState(trace: Trace, state: State): Trace;
  append(trace: Trace, draft: TransformationDraft, plugin: DomainPlugin | null): AppendReceipt;
  verify(trace: Trace): void;
}

export interface KernelOptions { readonly clock?: Clock; readonly ids?: IdGenerator; }

export class InMemoryTraceStore implements TraceStore {
  private readonly clock: Clock;
  private readonly ids: IdGenerator;
  public constructor(options: KernelOptions = {}) {
    this.clock = options.clock ?? new SystemClock();
    this.ids = options.ids ?? new RandomIdGenerator();
  }

  createTrace(): Trace { return deepFreeze({ id: this.ids.traceId(), entries: [] }); }

  registerActor(trace: Trace, actor: Actor): Trace {
    this.verify(trace); validateActor(actor);
    const view = projectTrace(trace);
    if (view.actors.has(actor.id)) throw new Error(`Actor ${actor.id} already exists.`);
    return this.appendEvent(trace, { type: 'actor.registered', actor: deepFreeze(actor) });
  }

  seedState(trace: Trace, state: State): Trace {
    this.verify(trace); validateState(state);
    const view = projectTrace(trace);
    if (!view.actors.has(state.provenance.actorId)) throw new Error(`State provenance references unknown actor ${state.provenance.actorId}.`);
    if (view.states.has(state.id)) throw new Error(`State ${state.id} already exists.`);
    if (view.provenance.has(state.provenance.id)) throw new Error(`State provenance ${state.provenance.id} already exists.`);
    return this.appendEvent(trace, { type: 'state.seeded', state: deepFreeze(state) });
  }

  append(trace: Trace, draft: TransformationDraft, plugin: DomainPlugin | null): AppendReceipt {
    this.verify(trace); validateDraft(draft);
    if (plugin !== null && (plugin.id !== draft.outputState.domainId || plugin.version !== draft.outputState.provenance.domainVersion)) {
      throw new Error('Plugin identity/version must match the output state provenance.');
    }
    const view = projectTrace(trace);
    if (view.transformations.some((item) => item.id === draft.id)) throw new Error(`Transformation ${draft.id} already exists.`);
    if (view.provenance.has(draft.provenance.id)) throw new Error(`Transformation provenance ${draft.provenance.id} already exists.`);
    if (view.provenance.has(draft.outputState.provenance.id)) throw new Error(`Output provenance ${draft.outputState.provenance.id} already exists.`);
    if (draft.provenance.id === draft.outputState.provenance.id) throw new Error('Transformation and output state must have distinct provenance identifiers.');
    const kernelResults = evaluateKernelConstraints(view, draft);
    const domainResults = plugin === null ? [] : plugin.constraints.map((constraint) => {
      const first = constraint.evaluate({ trace: view, draft });
      const second = constraint.evaluate({ trace: view, draft });
      if (canonicalize(asJson(first)) !== canonicalize(asJson(second))) {
        throw new Error(`Domain constraint ${constraint.code} is non-deterministic.`);
      }
      if (first.scope !== 'domain' || first.code !== constraint.code || first.evaluatorVersion !== constraint.version) {
        throw new Error(`Domain constraint ${constraint.code} returned an invalid identity envelope.`);
      }
      return deepFreeze(first);
    });
    const constraints = deepFreeze([...kernelResults, ...domainResults]);
    const accepted = constraints.filter((item) => item.severity === 'required').every((item) => item.passed);
    const transformation: Transformation = deepFreeze({
      id: draft.id,
      sequence: view.transformations.length + 1,
      operator: draft.operator,
      actorId: draft.actorId,
      inputStateIds: [...draft.inputStateIds],
      outputStateId: draft.outputState.id,
      attemptedAt: draft.attemptedAt,
      provenance: draft.provenance,
      payload: draft.payload,
      expansionEvaluation: draft.expansionEvaluation,
      constraints,
      accepted
    });
    const next = this.appendEvent(trace, { type: 'transformation.attempted', transformation, outputState: deepFreeze(draft.outputState) });
    const entry = next.entries[next.entries.length - 1];
    if (entry === undefined) throw new Error('Internal error: append produced no entry.');
    return deepFreeze({ entry, transformation, trace: next });
  }

  verify(trace: Trace): void {
    let previousHash: string | null = null;
    let sequence = 1;
    const eventIds = new Set<string>();
    const actorIds = new Set<string>();
    const stateIds = new Set<string>();
    const transformationIds = new Set<string>();
    const provenanceIds = new Set<string>();
    for (const entry of trace.entries) {
      if (entry.traceId !== trace.id) throw new Error(`Trace entry ${entry.eventId} belongs to another trace.`);
      if (eventIds.has(entry.eventId)) throw new Error(`Duplicate event id ${entry.eventId}.`);
      eventIds.add(entry.eventId);
      if (entry.sequence !== sequence) throw new Error(`Trace sequence discontinuity at ${entry.eventId}.`);
      if (entry.previousHash !== previousHash) throw new Error(`Trace hash-chain predecessor mismatch at ${entry.eventId}.`);
      const expected = this.hashEntry(entry.traceId, entry.sequence, entry.recordedAt, entry.previousHash, entry.event);
      if (entry.eventHash !== expected) throw new Error(`Trace hash mismatch at ${entry.eventId}.`);
      switch (entry.event.type) {
        case 'actor.registered':
          if (actorIds.has(entry.event.actor.id)) throw new Error(`Duplicate actor id ${entry.event.actor.id}.`);
          actorIds.add(entry.event.actor.id);
          break;
        case 'state.seeded':
          if (stateIds.has(entry.event.state.id)) throw new Error(`Duplicate state id ${entry.event.state.id}.`);
          if (provenanceIds.has(entry.event.state.provenance.id)) throw new Error(`Duplicate provenance id ${entry.event.state.provenance.id}.`);
          stateIds.add(entry.event.state.id); provenanceIds.add(entry.event.state.provenance.id);
          break;
        case 'transformation.attempted': {
          const tx = entry.event.transformation;
          if (transformationIds.has(tx.id)) throw new Error(`Duplicate transformation id ${tx.id}.`);
          if (provenanceIds.has(tx.provenance.id) || provenanceIds.has(entry.event.outputState.provenance.id) || tx.provenance.id === entry.event.outputState.provenance.id) {
            throw new Error(`Duplicate provenance in transformation ${tx.id}.`);
          }
          transformationIds.add(tx.id); provenanceIds.add(tx.provenance.id); provenanceIds.add(entry.event.outputState.provenance.id);
          if (tx.accepted) {
            if (stateIds.has(entry.event.outputState.id)) throw new Error(`Duplicate accepted state id ${entry.event.outputState.id}.`);
            stateIds.add(entry.event.outputState.id);
          }
          break;
        }
      }
      previousHash = entry.eventHash; sequence += 1;
    }
  }

  private appendEvent(trace: Trace, event: TraceEvent): Trace {
    const previous = trace.entries[trace.entries.length - 1] ?? null;
    const recordedAt = this.clock.now();
    const sequence = trace.entries.length + 1;
    const previousHash = previous?.eventHash ?? null;
    const entry: TraceEntry = deepFreeze({
      eventId: this.ids.eventId(), traceId: trace.id, sequence, recordedAt, previousHash,
      eventHash: this.hashEntry(trace.id, sequence, recordedAt, previousHash, event), event
    });
    return deepFreeze({ id: trace.id, entries: [...trace.entries, entry] });
  }

  private hashEntry(traceId: Trace['id'], sequence: number, recordedAt: TraceEntry['recordedAt'], previousHash: TraceEntry['previousHash'], event: TraceEvent): TraceEntry['eventHash'] {
    const body = { traceId, sequence, recordedAt, previousHash, event } as unknown as JsonValue;
    return sha256(body);
  }
}
