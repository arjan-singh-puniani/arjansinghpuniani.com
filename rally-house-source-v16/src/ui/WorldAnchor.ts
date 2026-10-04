export interface AnchorPoint {
    x: number;
    y: number;
    visible: boolean;
}
export interface AnchorBounds {
    width: number;
    height: number;
    top: number;
    bottom: number;
    left: number;
    right: number;
}
export interface AnchorLayout {
    x: number;
    y: number;
    side: 'left' | 'right' | 'above';
    offscreen: boolean;
}
/** CSS pixels: projection already accounts for the canvas viewport and DPR. */
export function placeWorldCard(p: AnchorPoint, w: number, h: number, b: AnchorBounds): AnchorLayout {
    const right = Math.max(b.left, b.width - b.right - w), bottom = Math.max(b.top, b.height - b.bottom - h);
    const finite = Number.isFinite(p.x) && Number.isFinite(p.y);
    const offscreen = !finite || !p.visible || p.x < b.left || p.x > b.width - b.right || p.y < b.top || p.y > b.height - b.bottom;
    const px = finite ? p.x : b.width / 2, py = finite ? p.y : b.height / 2;
    let side: AnchorLayout['side'] = 'right', x = px + 32, y = py - h * .42;
    if (x > right) {
        side = 'left';
        x = px - w - 32;
    }
    if (x < b.left) {
        side = 'above';
        x = px - w / 2;
        y = py - h - 30;
    }
    return { x: Math.max(b.left, Math.min(right, x)), y: Math.max(b.top, Math.min(bottom, y)), side, offscreen };
}
