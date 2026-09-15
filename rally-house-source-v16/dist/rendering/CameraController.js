import { Vec3, clamp, lookAt, multiply, perspective, transformPoint } from './Math3D.js';
function spring(current, velocity, target, omega, dt) {
    const f = 1 + 2 * dt * omega, oo = omega * omega, hoo = dt * oo, hhoo = dt * hoo, det = 1 / (f + hhoo);
    const next = (f * current + dt * velocity + hhoo * target) * det;
    const vel = (velocity + hoo * (target - current)) * det;
    return [next, vel];
}
function nearestAngle(current, target) { let t = target; while (t - current > Math.PI)
    t -= Math.PI * 2; while (t - current < -Math.PI)
    t += Math.PI * 2; return t; }
export class CameraController {
    canvas;
    target = new Vec3(0, 0, 0);
    desiredTarget = this.target.clone();
    distance = 48;
    desiredDistance = 48;
    azimuth = Math.PI / 4;
    desiredAzimuth = Math.PI / 4;
    elevation = 0.62;
    desiredElevation = .62;
    position = new Vec3();
    fov = 26 * Math.PI / 180;
    aspect = 1;
    viewIndex = 0;
    /** True until the player zooms. While true the club is reframed automatically on resize/rotate. */
    autoFrame = true;
    /** QA aid. While locked the camera ignores focus, pan and zoom requests so A/B captures are pixel-comparable. */
    locked = false;
    fitDistance = 48;
    minDistance = 16;
    maxDistance = 58;
    targetVelocity = new Vec3();
    distanceVelocity = 0;
    azimuthVelocity = 0;
    elevationVelocity = 0;
    constructor(canvas) {
        this.canvas = canvas;
        this.setAspect(1.6);
        this.distance = this.desiredDistance = this.fitDistance;
        this.update(0);
    }
    /**
     * Frames the whole academy for the current viewport.
     * Portrait phones get a wider lens and a tighter subject radius, otherwise the club
     * ends up 70 units away and unreadable. Landscape keeps the long miniature-model lens.
     */
    setAspect(a) {
        if (Math.abs(a - this.aspect) < 1e-4)
            return;
        this.aspect = a;
        const portrait = clamp((1.25 - a) / 0.75, 0, 1); // 0 at 16:9, 1 at tall phone portrait
        this.fov = (26 + 14 * portrait) * Math.PI / 180;
        const radius = 12.4 - 3.1 * portrait; // show the whole club wide, the court area tall
        const halfV = Math.tan(this.fov / 2), halfH = halfV * a;
        this.fitDistance = clamp(radius / Math.max(1e-3, Math.min(halfV, halfH)) * 1.02, 20, 86);
        this.minDistance = this.fitDistance * .34;
        this.maxDistance = this.fitDistance * 1.14;
        if (this.autoFrame)
            this.desiredDistance = this.fitDistance;
        else
            this.desiredDistance = clamp(this.desiredDistance, this.minDistance, this.maxDistance);
    }
    /** Freeze exactly where the camera is right now. Used by the lock so A/B captures match. */
    pin() { this.desiredTarget.set(this.target.x, this.target.y, this.target.z); this.desiredDistance = this.distance; this.desiredAzimuth = this.azimuth; this.desiredElevation = this.elevation; this.targetVelocity.set(0, 0, 0); this.distanceVelocity = 0; this.azimuthVelocity = 0; this.elevationVelocity = 0; }
    /** Return to the framed establishing shot. */
    frameAcademy() { this.autoFrame = true; this.desiredTarget.set(0, 0, 0); this.desiredDistance = this.fitDistance; }
    update(dt) {
        if (dt <= 0) {
            const ce = Math.cos(this.elevation);
            this.position.set(this.target.x + Math.sin(this.azimuth) * ce * this.distance, this.target.y + Math.sin(this.elevation) * this.distance, this.target.z + Math.cos(this.azimuth) * ce * this.distance);
            return;
        }
        [this.target.x, this.targetVelocity.x] = spring(this.target.x, this.targetVelocity.x, this.desiredTarget.x, 8.8, dt);
        [this.target.y, this.targetVelocity.y] = spring(this.target.y, this.targetVelocity.y, this.desiredTarget.y, 8.8, dt);
        [this.target.z, this.targetVelocity.z] = spring(this.target.z, this.targetVelocity.z, this.desiredTarget.z, 8.8, dt);
        [this.distance, this.distanceVelocity] = spring(this.distance, this.distanceVelocity, this.desiredDistance, 8.1, dt);
        const desiredA = nearestAngle(this.azimuth, this.desiredAzimuth);
        [this.azimuth, this.azimuthVelocity] = spring(this.azimuth, this.azimuthVelocity, desiredA, 7.2, dt);
        [this.elevation, this.elevationVelocity] = spring(this.elevation, this.elevationVelocity, this.desiredElevation, 7.5, dt);
        const ce = Math.cos(this.elevation);
        this.position.set(this.target.x + Math.sin(this.azimuth) * ce * this.distance, this.target.y + Math.sin(this.elevation) * this.distance, this.target.z + Math.cos(this.azimuth) * ce * this.distance);
    }
    viewProjection() { return multiply(perspective(this.fov, this.aspect, .1, 120), lookAt(this.position, this.target)); }
    focus(x = 0, z = 0, distance = this.fitDistance, height = 0) { if (this.locked)
        return; this.autoFrame = false; this.desiredTarget.set(clamp(x, -12, 12), height, clamp(z, -9, 9)); this.desiredDistance = clamp(distance, this.minDistance, this.maxDistance); }
    nudgeFocus(x, z, amount = .18) { if (this.locked)
        return; this.desiredTarget.x = clamp(this.desiredTarget.x + (x - this.desiredTarget.x) * amount, -8, 8); this.desiredTarget.z = clamp(this.desiredTarget.z + (z - this.desiredTarget.z) * amount, -5.5, 5.5); }
    zoom(delta) { if (this.locked)
        return; this.autoFrame = false; this.desiredDistance = clamp(this.desiredDistance + delta * (this.desiredDistance / 40), this.minDistance, this.maxDistance); }
    pan(dxPixels, dyPixels) { if (this.locked)
        return; const scale = this.distance * .0019; const forward = Vec3.sub(this.target, this.position); forward.y = 0; forward.normalize(); const right = Vec3.cross(forward, new Vec3(0, 1, 0)).normalize(); this.desiredTarget.add(right.scale(-dxPixels * scale)).add(forward.scale(dyPixels * scale)); this.desiredTarget.x = clamp(this.desiredTarget.x, -8, 8); this.desiredTarget.z = clamp(this.desiredTarget.z, -5.5, 5.5); }
    rotate(deltaPixels) { if (this.locked)
        return; this.desiredAzimuth = clamp(this.desiredAzimuth + deltaPixels * .0045, -.95, .95); }
    cycleView() { this.viewIndex = (this.viewIndex + 1) % 3; this.desiredAzimuth = [Math.PI / 4, -Math.PI / 4, 0][this.viewIndex]; this.desiredElevation = [.62, .62, .69][this.viewIndex]; this.frameAcademy(); return this.viewIndex; }
    rayFromScreen(clientX, clientY) { const r = this.canvas.getBoundingClientRect(); const nx = ((clientX - r.left) / r.width) * 2 - 1, ny = 1 - ((clientY - r.top) / r.height) * 2; const forward = Vec3.sub(this.target, this.position).normalize(); const right = Vec3.cross(forward, new Vec3(0, 1, 0)).normalize(); const up = Vec3.cross(right, forward).normalize(); const hh = Math.tan(this.fov / 2); const dir = forward.clone().add(right.scale(nx * hh * this.aspect)).add(up.scale(ny * hh)).normalize(); return { origin: this.position.clone(), dir }; }
    groundPoint(clientX, clientY) { const ray = this.rayFromScreen(clientX, clientY); if (Math.abs(ray.dir.y) < 1e-5)
        return null; const t = -ray.origin.y / ray.dir.y; if (t < 0)
        return null; return ray.origin.add(ray.dir.scale(t)); }
    project(v) { const p = transformPoint(this.viewProjection(), v), r = this.canvas.getBoundingClientRect(); return { x: (p.x * .5 + .5) * r.width, y: (1 - (p.y * .5 + .5)) * r.height, visible: p.z > -1 && p.z < 1 }; }
}
