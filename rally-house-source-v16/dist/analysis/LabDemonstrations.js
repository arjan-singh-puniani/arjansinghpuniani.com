import { Character } from '../entities/Character.js';
import { Vec3 } from '../rendering/Math3D.js';
import { Navigation } from '../world/Navigation.js';
import { BallPhysics } from '../tennis/BallPhysics.js';
import { captureFrame } from './MotionCapture.js';
/** The real animation/foot/contact solvers generate these explicitly authored demonstrations. */
export function demonstration(kind, spec) {
    const clip = { name: kind === 'gait' ? 'Walk the analysis strip' : kind === 'serve' ? 'Serve · toss to recovery' : 'Forehand · load to follow-through', kind, source: 'authored-demo', frames: [] };
    const c = new Character({ ...spec }, new Vec3(kind === 'gait' ? -1 : 1, 0, 4.1), new Navigation([]), {});
    const ball = new BallPhysics();
    c.racketStowed = kind === 'gait';
    c.majorActivity = true;
    let started = false, released = false, finished = false, contact = false, bounce = false;
    const stroke = kind === 'serve' ? 'serve' : 'swingForehand';
    const duration = kind === 'gait' ? 5.8 : 3.4;
    if (kind === 'gait')
        c.goTo(new Vec3(4.5, 0, 4.1), 'idle');
    else {
        c.face(new Vec3(1, 0, -4));
        c.setAnimation('ready');
    }
    for (let i = 0; i <= Math.round(duration * 60); i++) {
        const time = i / 60;
        if (kind !== 'gait' && !started && time >= .75) {
            started = true;
            c.triggerShot(stroke, new Vec3(.1, .09, -3.8));
        }
        c.update(1 / 60);
        if (started && !released && c.animTime >= c.shotContactTime(stroke)) {
            released = contact = true;
            const point = c.racketContactPoint();
            c.notifyRacketImpact('clean');
            ball.launch(point, new Vec3(.1, .09, -3.8), .9);
        }
        else if (ball.active) {
            bounce = ball.update(1 / 60).bounced || bounce;
        }
        if (started && !released) {
            // Illustrative incoming/toss path, explicitly part of the authored demo.
            const end = c.debugKinematics().contactTarget ?? c.racketContactPoint();
            const from = kind === 'serve' ? c.serveTossPoint() : new Vec3(1.5, 1.05, 2.3);
            ball.position = Vec3.lerp(from, end, Math.min(1, c.animTime / c.shotContactTime(stroke)));
            ball.active = true;
        }
        if (started && released && !finished && c.animTime >= c.shotDuration(stroke)) {
            c.clearShotIntent();
            c.setAnimation('ready');
            finished = true;
        }
        if (i % 2 === 0 || contact || bounce) {
            clip.frames.push(captureFrame(c, time, ball.active ? ball.position : null, contact, bounce));
            contact = bounce = false;
        }
    }
    return clip;
}
