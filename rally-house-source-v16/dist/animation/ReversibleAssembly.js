import { Vec3, clamp, smoothstep } from '../rendering/Math3D.js';
/** Sample from immutable TRS, never from the last frame. Cancellation also restores exactly. */
export class ReversibleAssembly {
    parts;
    originals;
    elapsed = 0;
    active = false;
    constructor(parts) {
        this.parts = parts;
        this.originals = parts.map(({ mesh }) => ({ position: mesh.position.clone(), rotation: (mesh.rotation ?? new Vec3()).clone(), scale: mesh.scale.clone() }));
    }
    start() { if (this.active)
        return false; this.originals = this.parts.map(({ mesh }) => ({ position: mesh.position.clone(), rotation: (mesh.rotation ?? new Vec3()).clone(), scale: mesh.scale.clone() })); this.elapsed = 0; this.active = true; return true; }
    update(dt, reducedMotion = false) {
        if (!this.active)
            return;
        this.elapsed += clamp(dt, 0, .1);
        if (reducedMotion || this.elapsed >= 3.2) {
            this.restore();
            return;
        }
        const t = this.elapsed < 1 ? smoothstep(0, 1, this.elapsed) : this.elapsed < 1.85 ? 1 : 1 - smoothstep(1.85, 3.2, this.elapsed);
        this.parts.forEach((part, i) => {
            const o = this.originals[i], turn = part.turn ?? new Vec3(), stretch = part.stretch ?? new Vec3();
            part.mesh.position = Vec3.add(o.position, part.offset.clone().scale(t));
            part.mesh.rotation = Vec3.add(o.rotation, turn.clone().scale(t));
            part.mesh.scale = Vec3.add(o.scale, stretch.clone().scale(t));
        });
    }
    restore() {
        this.parts.forEach(({ mesh }, i) => { const o = this.originals[i]; mesh.position = o.position.clone(); mesh.rotation = o.rotation.clone(); mesh.scale = o.scale.clone(); });
        this.elapsed = 0;
        this.active = false;
    }
}
