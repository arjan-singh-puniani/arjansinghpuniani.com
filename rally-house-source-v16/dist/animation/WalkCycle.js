import { Vec3, clamp, smoothstep } from '../rendering/Math3D.js';
/** One owner for each shoe: world-space support, then a continuous airborne arc. */
export class WalkCycle {
    phase = 0;
    feet = [new Vec3(), new Vec3()];
    planted = [true, true];
    yaws = [0, 0];
    starts = [new Vec3(), new Vec3()];
    targets = [new Vec3(), new Vec3()];
    active = false;
    initialFeet;
    swingPhase = [.55, .55];
    reset(feet) { this.active = false; this.initialFeet = feet ? [feet[0].clone(), feet[1].clone()] : undefined; }
    update(position, yaw, distance, stride, shape = { halfWidth: .17, lift: .075, stance: .55 }, direction) {
        const local = (side, forward) => new Vec3(position.x + Math.cos(yaw) * side + (direction?.x ?? Math.sin(yaw)) * forward, .11, position.z - Math.sin(yaw) * side + (direction?.z ?? Math.cos(yaw)) * forward);
        if (!this.active) {
            const seeded = !!this.initialFeet;
            this.yaws = [yaw, yaw];
            this.phase = this.initialFeet ? 0 : .25;
            this.feet = this.initialFeet ?? [local(-shape.halfWidth, .04), local(shape.halfWidth, .04)];
            this.initialFeet = undefined;
            this.planted = [true, true];
            this.active = true;
            if (seeded && distance === 0)
                return false;
        }
        this.phase = (this.phase + distance / stride) % 1;
        let landed = false;
        for (let i = 0; i < 2; i++) {
            const phase = (this.phase + i * .5) % 1, stance = phase < shape.stance;
            if (stance) {
                if (!this.planted[i]) {
                    this.feet[i] = this.targets[i].clone();
                    landed = true;
                }
                this.planted[i] = true;
            }
            else {
                if (this.planted[i]) {
                    this.starts[i] = this.feet[i].clone();
                    this.swingPhase[i] = direction ? Math.min(phase, shape.stance) : phase;
                    this.targets[i] = local(i === 0 ? -shape.halfWidth : shape.halfWidth, stride * (1 - phase + shape.stance / 2));
                }
                this.planted[i] = false;
                const angle = Math.atan2(Math.sin(yaw - this.yaws[i]), Math.cos(yaw - this.yaws[i]));
                this.yaws[i] += angle * Math.min(1, distance * 24);
                this.targets[i] = local(i === 0 ? -shape.halfWidth : shape.halfWidth, stride * (1 - phase + shape.stance / 2));
                const t = clamp((phase - this.swingPhase[i]) / (1 - this.swingPhase[i]), 0, 1);
                this.feet[i] = Vec3.lerp(this.starts[i], this.targets[i], smoothstep(0, 1, t));
                this.feet[i].y = .11 + (this.starts[i].y - .11) * (1 - smoothstep(0, 1, t)) + shape.lift * Math.sin(Math.PI * t) ** 2;
            }
        }
        return landed;
    }
}
