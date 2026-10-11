import { Vec3 } from './Math3D.js';
/** One cached, two-sided canopy. Curved, pointed leaves replace solid ellipsoids
 * without multiplying draw calls or changing an object's interaction envelope. */
export function foliageGeometry() {
    const positions = [], normals = [];
    const triangle = (a, b, c) => {
        const n = Vec3.cross(Vec3.sub(b, a), Vec3.sub(c, a)).normalize();
        for (const [vertices, normal] of [[[a, b, c], n], [[c, b, a], n.clone().scale(-1)]])
            for (const v of vertices) {
                positions.push(v.x, v.y * 1.75, v.z);
                const corrected = new Vec3(normal.x, normal.y / 1.75, normal.z).normalize();
                normals.push(corrected.x, corrected.y, corrected.z);
            }
    };
    for (let i = 0; i < 23; i++) {
        const angle = i * 2.399963, r = Math.sqrt((i + .5) / 23) * .31;
        const centre = new Vec3(Math.cos(angle) * r, Math.sin(i * 1.7) * .19, Math.sin(angle) * r);
        const axis = new Vec3(Math.cos(angle + .5), .28 * Math.sin(i * 2.1), Math.sin(angle + .5)).normalize();
        const side = Vec3.cross(new Vec3(0, 1, 0), axis).normalize();
        const length = .23 + .045 * Math.sin(i * 2.3), width = .095 + .015 * Math.cos(i * 1.1);
        const point = (t, s) => centre.clone().add(axis.clone().scale((t - .5) * length)).add(side.clone().scale(s * Math.sin(Math.PI * t) * width)).add(new Vec3(0, Math.sin(Math.PI * t) * (.065 - s * s * .04), 0));
        for (let j = 0; j < 4; j++) {
            const t = j / 4, u = (j + 1) / 4;
            for (const s of [-1, 1]) {
                const a = point(t, 0), b = point(t, s), c = point(u, s), d = point(u, 0);
                // The pointed end has coincident vertices; emit only non-degenerate faces.
                if (j > 0)
                    triangle(a, b, c);
                if (j < 3)
                    triangle(a, c, d);
            }
        }
    }
    return { positions: new Float32Array(positions), normals: new Float32Array(normals) };
}
