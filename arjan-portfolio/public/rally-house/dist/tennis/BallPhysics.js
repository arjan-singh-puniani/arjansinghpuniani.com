import { Vec3 } from '../rendering/Math3D.js';
export class BallPhysics {
    position = new Vec3();
    velocity = new Vec3();
    active = false;
    radius = .09;
    gravity = -9.81;
    restitution = .56;
    bounces = 0;
    lastZ = 0;
    launch(start, target, flightTime = .82) { this.position = start.clone(); this.lastZ = start.z; this.velocity = new Vec3((target.x - start.x) / flightTime, (target.y - start.y - .5 * this.gravity * flightTime * flightTime) / flightTime, (target.z - start.z) / flightTime); this.active = true; this.bounces = 0; }
    /** Forecast the first landing using the same semi-implicit fixed step as update. */
    firstLanding(step = 1 / 60) {
        if (!this.active || this.bounces > 0 || this.gravity >= 0 || step <= 0)
            return null;
        const v = this.velocity.y + this.gravity * step / 2;
        const discriminant = v * v - 2 * this.gravity * (this.position.y - this.radius);
        if (discriminant < 0)
            return null;
        const seconds = (-v - Math.sqrt(discriminant)) / this.gravity;
        const frames = Math.ceil(seconds / step);
        if (!Number.isFinite(frames) || frames < 1)
            return null;
        return new Vec3(this.position.x + this.velocity.x * frames * step, this.radius, this.position.z + this.velocity.z * frames * step);
    }
    update(dt) {
        if (!this.active)
            return { bounced: false, net: false };
        this.lastZ = this.position.z;
        this.velocity.y += this.gravity * dt;
        this.position.add(this.velocity.clone().scale(dt));
        let bounced = false, net = false;
        if ((this.lastZ < 0 && this.position.z >= 0) || (this.lastZ > 0 && this.position.z <= 0)) {
            if (this.position.y < .94) {
                this.position.y = Math.max(this.radius, this.position.y);
                this.velocity.set(0, 0, 0);
                this.active = false;
                net = true;
            }
        }
        if (this.position.y < this.radius) {
            this.position.y = this.radius;
            if (this.velocity.y < 0) {
                this.velocity.y *= -this.restitution;
                this.velocity.x *= .93;
                this.velocity.z *= .93;
                this.bounces++;
                bounced = true;
                if (this.bounces > 2 || Math.abs(this.velocity.y) < .7)
                    this.active = false;
            }
        }
        if (Math.abs(this.position.x) > 5.2 || Math.abs(this.position.z) > 7.0)
            this.active = false;
        return { bounced, net };
    }
}
export function solveLaunch(start, target, flightTime, gravity = -9.81) { return new Vec3((target.x - start.x) / flightTime, (target.y - start.y - .5 * gravity * flightTime * flightTime) / flightTime, (target.z - start.z) / flightTime); }
