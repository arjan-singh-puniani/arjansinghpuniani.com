import { Vec3 } from '../rendering/Math3D.js';
export const PERFORMANCE_STATION = {
    id: 'performanceLab', label: 'Performance Lab', kind: 'performanceLab', position: new Vec3(-3.8, 0, -8.35), radius: 1.2,
    description: 'A courtside instrument for seeing movement in court space and body space. Replay your Championship or explore an authored demonstration.',
    selection: { centre: new Vec3(-3.8, 1.2, -8.35), size: new Vec3(1.7, 2.25, .65) },
    interactionPoint: new Vec3(-3.8, 1.25, -8.0), careSpot: new Vec3(-3.8, 0, -7.35),
};
export function stationMeshes() {
    const m = [];
    const box = (x, y, z, w, h, d, color, material = 'metal', unlit = false) => m.push({ kind: 'roundBox', position: new Vec3(x, y, z), scale: new Vec3(w, h, d), color, material, unlit });
    box(-3.8, .10, -8.35, 1.35, .18, .75, '#5a706c');
    box(-3.8, .72, -8.35, .22, 1.35, .25, '#506964');
    box(-3.8, 1.48, -8.35, 1.7, 1.13, .18, '#c5b394');
    box(-3.8, 1.48, -8.23, 1.49, .93, .04, '#192f34');
    box(-3.8, 1.0, -8.06, 1.65, .09, .55, '#bb9974', 'wood');
    box(-3.8, 1.09, -7.97, .48, .05, .25, '#819d91');
    for (let i = 0; i < 3; i++)
        box(-4.36 + i * .12, 1.90, -8.195, .05, .05, .02, ['#8fc4af', '#e2c28c', '#a4c8d5'][i], 'glass', true);
    // The idle screen is a designed icon, never presented as a live measurement.
    for (let i = 0; i < 9; i++) {
        box(-4.30 + i * .07, 1.26 + Math.sin(i * .85) * .035, -8.19, .055, .018, .012, '#a9d7c6', 'glass', true);
    }
    box(-3.29, 1.57, -8.19, .024, .44, .016, '#a9d7c6', 'glass', true);
    box(-3.29, 1.69, -8.19, .34, .024, .016, '#a9d7c6', 'glass', true);
    for (const x of [-3.37, -3.21])
        box(x, 1.35, -8.19, .025, .27, .016, '#e2c28c', 'glass', true);
    m.push({ kind: 'sphere', position: new Vec3(-3.29, 1.86, -8.19), scale: new Vec3(.10, .10, .04), color: '#c7e6d7', unlit: true });
    return m;
}
