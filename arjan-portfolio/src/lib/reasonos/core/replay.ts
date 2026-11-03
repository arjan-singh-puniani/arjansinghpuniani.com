import { projectTrace } from './projector';
import type { State, StateId, Trace, TraceView } from './types';

export function replay(trace: Trace): TraceView { return projectTrace(trace); }

export function causalAncestors(view: TraceView, stateId: StateId): readonly State[] {
  const byOutput = new Map(view.acceptedTransformations.map((item) => [item.outputStateId, item.inputStateIds] as const));
  const ids = new Set<StateId>(); const stack = [...(byOutput.get(stateId) ?? [])];
  while (stack.length > 0) {
    const current = stack.pop(); if (current === undefined || ids.has(current)) continue;
    ids.add(current); stack.push(...(byOutput.get(current) ?? []));
  }
  return Object.freeze([...ids].map((id) => view.states.get(id)).filter((item): item is State => item !== undefined));
}
