const ROWS = [0.58, 0.19, -0.19, -0.58];
const LEFT_FIRST = new Set(['skeleton', 'arteries', 'muscles']);

export function preferredStageSide(layer) {
  return LEFT_FIRST.has(layer) ? 'left' : 'right';
}

// Returns camera-frustum-relative fractions, not world-space meters.
// The renderer scales x by the visible half-width and y by the visible half-height,
// keeping staged structures on-screen from portrait phones through desktop displays.
export function stageSlot(index, side) {
  const safeIndex = Math.max(0, Math.floor(Number(index) || 0));
  const row = safeIndex % ROWS.length;
  const lane = Math.floor(safeIndex / ROWS.length);
  const sign = side === 'left' ? -1 : 1;
  const x = Math.min(0.90, 0.64 + lane * 0.14);
  return [sign * x, ROWS[row], lane * 0.025];
}
