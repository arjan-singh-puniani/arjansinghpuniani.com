import { Vec3 } from '../rendering/Math3D.js';
export class Navigation {
    cell = .5;
    minX = -12.5;
    maxX = 12.5;
    minZ = -9.5;
    maxZ = 9.5;
    obstacles = [];
    constructor(obstacles = []) { this.obstacles = obstacles; }
    isBlocked(x, z) { if (x < this.minX || x > this.maxX || z < this.minZ || z > this.maxZ)
        return true; return this.obstacles.some(o => x > o.x - o.w / 2 - .22 && x < o.x + o.w / 2 + .22 && z > o.z - o.d / 2 - .22 && z < o.z + o.d / 2 + .22); }
    snap(v, min) { return Math.round((v - min) / this.cell); }
    world(ix, iz) { return new Vec3(this.minX + ix * this.cell, 0, this.minZ + iz * this.cell); }
    path(start, end) {
        if (![start.x, start.z, end.x, end.z].every(Number.isFinite))
            return [];
        if (this.isBlocked(end.x, end.z))
            return [];
        const anchor = (p) => { const x = this.snap(p.x, this.minX), z = this.snap(p.z, this.minZ), options = []; for (let dx = -2; dx <= 2; dx++)
            for (let dz = -2; dz <= 2; dz++) {
                const w = this.world(x + dx, z + dz);
                if (this.clearSegment(p, w))
                    options.push({ x: x + dx, z: z + dz, d: Vec3.sub(p, w).len() });
            } return options.sort((a, b) => a.d - b.d)[0]; };
        const first = anchor(start), last = anchor(end);
        if (!first || !last)
            return [];
        const sx = first.x, sz = first.z, ex = last.x, ez = last.z;
        const key = (x, z) => `${x},${z}`;
        const open = [{ x: sx, z: sz, f: 0 }], came = new Map(), g = new Map([[key(sx, sz), 0]]);
        const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
        let guard = 0;
        while (open.length && guard++ < 12000) {
            open.sort((a, b) => a.f - b.f);
            const cur = open.shift();
            if (cur.x === ex && cur.z === ez) {
                const out = [];
                let k = key(ex, ez);
                while (k !== key(sx, sz)) {
                    const [x, z] = k.split(',').map(Number);
                    out.push(this.world(x, z));
                    k = came.get(k) ?? key(sx, sz);
                }
                out.reverse();
                out.unshift(this.world(sx, sz));
                out.push(new Vec3(end.x, 0, end.z));
                return this.simplify(out, start);
            }
            for (const [dx, dz] of dirs) {
                const nx = cur.x + dx, nz = cur.z + dz, w = this.world(nx, nz);
                if (this.isBlocked(w.x, w.z))
                    continue;
                if (dx && dz) {
                    const a = this.world(cur.x + dx, cur.z), b = this.world(cur.x, cur.z + dz);
                    if (this.isBlocked(a.x, a.z) || this.isBlocked(b.x, b.z))
                        continue;
                }
                const ng = (g.get(key(cur.x, cur.z)) ?? Infinity) + Math.hypot(dx, dz);
                const nk = key(nx, nz);
                if (ng < (g.get(nk) ?? Infinity)) {
                    came.set(nk, key(cur.x, cur.z));
                    g.set(nk, ng);
                    const h = Math.hypot(ex - nx, ez - nz);
                    const old = open.find(v => v.x === nx && v.z === nz);
                    if (old)
                        old.f = ng + h;
                    else
                        open.push({ x: nx, z: nz, f: ng + h });
                }
            }
        }
        return [];
    }
    /** Social circulation stays outside the playing area. Players leaving court first use a short exit route. */
    clubPath(start, end) {
        const inside = (p) => p.x > -3.8 && p.x < 5.8 && p.z > -6.6 && p.z < 6.6;
        if (inside(end))
            return this.path(start, end);
        const outside = new Navigation([...this.obstacles, { x: 1, z: 0, w: 9, d: 12.6 }]);
        if (!inside(start))
            return outside.path(start, end);
        const exits = [new Vec3(-4, 0, start.z), new Vec3(6, 0, start.z), new Vec3(start.x, 0, -7), new Vec3(start.x, 0, 7)];
        const routes = exits.map(exit => { const first = this.path(start, exit), last = outside.path(exit, end); return first.length && last.length ? [...first, ...last] : []; }).filter(r => r.length);
        const length = (r) => r.reduce((n, p, i) => n + Vec3.sub(p, i ? r[i - 1] : start).len(), 0);
        return routes.sort((a, b) => length(a) - length(b))[0] ?? [];
    }
    clearSegment(a, b) {
        if (this.isBlocked(a.x, a.z) || this.isBlocked(b.x, b.z))
            return false;
        for (const o of this.obstacles) {
            let enter = 0, leave = 1;
            for (const [origin, delta, min, max] of [[a.x, b.x - a.x, o.x - o.w / 2 - .22, o.x + o.w / 2 + .22], [a.z, b.z - a.z, o.z - o.d / 2 - .22, o.z + o.d / 2 + .22]]) {
                if (Math.abs(delta) < 1e-9) {
                    if (origin <= min || origin >= max) {
                        enter = 2;
                        break;
                    }
                }
                else {
                    const x = (min - origin) / delta, y = (max - origin) / delta;
                    enter = Math.max(enter, Math.min(x, y));
                    leave = Math.min(leave, Math.max(x, y));
                }
            }
            if (enter <= leave)
                return false;
        }
        return true;
    }
    simplify(path, start) {
        const out = [];
        let anchor = start, index = 0;
        while (index < path.length) {
            let far = index;
            for (let i = path.length - 1; i > index; i--)
                if (this.clearSegment(anchor, path[i])) {
                    far = i;
                    break;
                }
            out.push(path[far]);
            anchor = path[far];
            index = far + 1;
        }
        return out;
    }
}
