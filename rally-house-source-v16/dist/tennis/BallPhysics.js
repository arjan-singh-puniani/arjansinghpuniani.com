import { Vec3 } from '../rendering/Math3D.js';
export class BallPhysics {
    position = new Vec3();
    velocity = new Vec3();
    active = false;
    radius = .09;
    gravity = -9.81;
    bounces = 0;
    lastZ = 0;
    launch(start, target, flightTime = .82) { this.position = start.clone(); this.lastZ = start.z; this.velocity = new Vec3((target.x - start.x) / flightTime, (target.y - start.y - .5 * this.gravity * flightTime * flightTime) / flightTime, (target.z - start.z) / flightTime); this.active = true; this.bounces = 0; }
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
                this.velocity.y *= -.56;
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
//# sourceMappingURL=BallPhysics.js.map