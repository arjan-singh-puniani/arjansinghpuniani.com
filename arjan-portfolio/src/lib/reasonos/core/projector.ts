import type { Actor, ActorId, Provenance, ProvenanceId, State, StateId, Trace, TraceEntry, TraceView, Transformation } from './types';

export function projectTrace(trace: Trace): TraceView {
  const actors = new Map<ActorId, Actor>();
  const states = new Map<StateId, State>();
  const provenance = new Map<ProvenanceId, Provenance>();
  const transformations: Transformation[] = [];
  for (const entry of trace.entries) applyEntry(entry, actors, states, provenance, transformations);
  return Object.freeze({
    trace,
    actors,
    states,
    provenance,
    transformations: Object.freeze([...transformations]),
    acceptedTransformations: Object.freeze(transformations.filter((item) => item.accepted)),
    rejectedTransformations: Object.freeze(transformations.filter((item) => !item.accepted))
  });
}

function addProvenance(map: Map<ProvenanceId, Provenance>, value: Provenance): void {
  if (!map.has(value.id)) map.set(value.id, value);
}

function applyEntry(
  entry: TraceEntry,
  actors: Map<ActorId, Actor>,
  states: Map<StateId, State>,
  provenance: Map<ProvenanceId, Provenance>,
  transformations: Transformation[]
): void {
  switch (entry.event.type) {
    case 'actor.registered': actors.set(entry.event.actor.id, entry.event.actor); return;
    case 'state.seeded':
      states.set(entry.event.state.id, entry.event.state);
      addProvenance(provenance, entry.event.state.provenance);
      return;
    case 'transformation.attempted':
      transformations.push(entry.event.transformation);
      addProvenance(provenance, entry.event.transformation.provenance);
      addProvenance(provenance, entry.event.outputState.provenance);
      if (entry.event.transformation.accepted) states.set(entry.event.outputState.id, entry.event.outputState);
      return;
  }
}
