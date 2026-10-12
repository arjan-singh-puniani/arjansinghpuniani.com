import { Vec3 } from '../rendering/Math3D.js';
export const PHONE_ANCHOR = new Vec3(-3.8, 1.42, -8.0);
export const PHONE_MARK = new Vec3(-4.3, 0, -4.5);
export const PERFORMANCE_STATION = {
    id: 'performanceLab', label: 'Performance Lab', kind: 'performanceLab', position: new Vec3(-3.8, 0, -8.35), radius: 1.2,
    description: 'Your courtside phone anchor. Mount a phone and record your avatar, then explore VectorCourt and AnatomyMotion—two apps by Arjan Singh Puniani. Championship replay is also here.',
    selection: { centre: new Vec3(-3.8, .86, -8.32), size: new Vec3(1.44, 1.8, .85) },
    interactionPoint: PHONE_ANCHOR.clone(), careSpot: new Vec3(-3.8, 0, -7.55),
};
export function stationMeshes() {
    const m = [];
    const box = (x, y, z, w, h, d, color, material = 'metal', unlit = false) => m.push({ kind: 'roundBox', position: new Vec3(x, y, z), scale: new Vec3(w, h, d), color, material, unlit });
    box(-3.8, .10, -8.35, 1.35, .18, .75, '#5a706c');
    box(-3.8, .72, -8.35, .22, 1.35, .25, '#506964');
    // A single post, articulated arm and clamp replace the old kiosk display.
    box(-3.8, 1.42, -8.18, .22, .09, .31, '#6d8981');
    m.push({ kind: 'sphere', position: new Vec3(-3.8, 1.42, -8.14), scale: new Vec3(.14, .14, .14), color: '#b6c2b8', material: 'metal' });
    box(-3.8, 1.42, -8.055, .19, .30, .035, '#344d46');
    for (const x of [-3.945, -3.655])
        box(x, 1.42, -8.015, .045, .18, .10, '#759889');
    box(-3.8, 1.17, -8.005, .20, .045, .10, '#759889');
    box(-3.61, 1.42, -8.055, .09, .05, .08, '#e4bb75');
    // Two app icons on the post plaque: court space and body space.
    box(-3.8, .92, -8.16, .58, .28, .035, '#192f34');
    box(-3.96, .92, -8.135, .15, .19, .01, '#9ed6bf', 'glass', true);
    box(-3.64, .92, -8.135, .15, .19, .01, '#e4c48a', 'glass', true);
    return m;
}
