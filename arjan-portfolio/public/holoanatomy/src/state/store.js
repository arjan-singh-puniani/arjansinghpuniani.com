import { LAYERS } from '../anatomy/manifest.js';

const ORDER = ['visible', 'ghost', 'hidden'];

export function createInitialState({ reducedMotion = false, quality = 'auto' } = {}) {
  return {
    module: 'head-neck',
    layers: Object.fromEntries(Object.entries(LAYERS).map(([id, cfg]) => [id, cfg.initial])),
    selectedId: null,
    isolatedId: null,
    dissect: true,
    table: true,
    quizMode: false,
    explode: false,
    explodeAmount: 0,
    section: { enabled: false, axis: 'x', position: 0, flip: false },
    parallax: !reducedMotion,
    focusMode: false,
    quality,
    reducedMotion
  };
}

export function cycleLayerState(state, layer) {
  const current = state.layers[layer] || 'visible';
  state.layers[layer] = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
  if (state.isolatedId && state.layers[layer] === 'hidden') state.isolatedId = null;
  return state.layers[layer];
}

export function selectStructure(state, id) { state.selectedId = id || null; return state; }
export function toggleIsolation(state) {
  state.isolatedId = state.selectedId && state.isolatedId !== state.selectedId ? state.selectedId : null;
  return state.isolatedId;
}
export function setSectionAxis(state, axis) {
  if (!['x','y','z'].includes(axis)) throw new Error(`Invalid section axis: ${axis}`);
  state.section.axis = axis; return state;
}
export function setSectionPosition(state, position) {
  state.section.position = Math.max(-1.1, Math.min(1.1, Number(position) || 0)); return state;
}
export function setQuality(state, quality) {
  if (!['auto','high','medium','low'].includes(quality)) throw new Error(`Invalid quality: ${quality}`);
  state.quality = quality; return state;
}

export function structureVisibility(state, part) {
  const layerState = state.layers[part.layer] || 'visible';
  if (layerState === 'hidden') return { visible:false, ghost:false };
  if (state.isolatedId && state.isolatedId !== part.id) return { visible:true, ghost:true };
  return { visible:true, ghost:layerState === 'ghost' };
}
