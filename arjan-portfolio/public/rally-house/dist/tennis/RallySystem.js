import { Vec3, clamp, smoothstep } from '../rendering/Math3D.js';
import { BallPhysics } from './BallPhysics.js';
const fract = (v) => v - Math.floor(v);
const hash = (n) => fract(Math.sin(n * 12.9898 + 78.233) * 43758.5453);
export class RallySystem {
    north;
    south;
    ball = new BallPhysics();
    enabled = true;
    rallyCount = 0;
    bestRally = 0;
    sessionHits = 0;
    score = {};
    errors = {};
    cue = '';
    flightHitter = null;
    hitter = 0;
    shotTimer = .4;
    shotCount = 0;
    trail = [];
    impactPulse = 0;
    pending = null;
    lastContact = null;
    waitingForReceiver = false;
    callbacks;
    capturedIncoming = null;
    netRipple = 0;
    lastOutcome = 'clean';
    constructor(north, south, callbacks = {}) {
        this.north = north;
        this.south = south;
        this.callbacks = callbacks;
        this.north.face(this.south.position);
        this.south.face(this.north.position);
    }
    start() { this.sessionHits = 0; this.score = { [this.north.id]: 0, [this.south.id]: 0 }; this.errors = { [this.north.id]: 0, [this.south.id]: 0 }; this.bestRally = 0; this.enabled = true; this.rallyCount = 0; this.ball.active = false; this.shotTimer = .16; this.waitingForReceiver = false; this.pending = null; this.trail = []; this.hitter = 0; this.capturedIncoming = null; this.north.setAnimation('ready'); this.south.setAnimation('ready'); }
    stop() { this.enabled = false; this.ball.active = false; this.trail = []; this.pending = null; this.waitingForReceiver = false; this.capturedIncoming = null; this.north.clearCourtMove(); this.south.clearCourtMove(); this.north.setLook(undefined); this.south.setLook(undefined); }
    update(dt) {
        if (!this.enabled)
            return;
        this.impactPulse = Math.max(0, this.impactPulse - dt * 3.2);
        this.netRipple = Math.max(0, this.netRipple - dt * 3.8);
        if (this.pending) {
            const p = this.pending;
            if (!p.released && p.hitter.animTime >= p.contactAt) {
                p.released = true;
                this.flightHitter = p.hitter;
                this.sessionHits++;
                this.callbacks.onShot?.(p.evidence);
                const start = p.hitter.racketContactPoint();
                this.lastContact = start.clone();
                p.hitter.notifyRacketImpact(p.outcome === 'frame' ? 'frame' : p.outcome === 'net' ? 'net' : 'clean');
                this.ball.launch(start, p.target, p.flight);
                this.trail = [];
                this.impactPulse = 1;
                this.lastOutcome = p.outcome;
                this.callbacks.onHit?.(p.outcome === 'frame' ? 'frame' : p.outcome === 'net' ? 'net' : 'clean');
                if (p.outcome === 'clean' || p.outcome === 'frame') {
                    this.rallyCount++;
                    this.bestRally = Math.max(this.bestRally, this.rallyCount);
                    this.callbacks.onRally?.(this.rallyCount);
                }
                this.waitingForReceiver = false;
            }
            if (p.hitter.animTime >= p.duration) {
                if (p.hitter.state === p.state) {
                    p.hitter.setAnimation('ready');
                    p.hitter.clearShotIntent();
                    const recovery = new Vec3(1, 0, p.hitter.position.z < 0 ? -5 : 5);
                    p.hitter.moveOnCourt(recovery, p.receiver.position, false);
                }
                if (p.released)
                    this.pending = null;
            }
        }
        if (this.ball.active) {
            this.north.setLook(this.ball.position);
            this.south.setLook(this.ball.position);
            const ev = this.ball.update(dt);
            this.trail.unshift(this.ball.position.clone());
            this.trail = this.trail.slice(0, 12);
            if (ev.bounced) {
                this.callbacks.onBounce?.();
                this.impactPulse = .48;
                if (this.ball.bounces === 1)
                    this.waitingForReceiver = true;
            }
            if (ev.net) {
                this.callbacks.onNet?.();
                this.netRipple = 1;
                this.finishError('net');
                return;
            }
            if (this.waitingForReceiver) {
                const receiver = this.hitter === 0 ? this.south : this.north;
                const d = Math.hypot(this.ball.position.x - receiver.position.x, this.ball.position.z - receiver.position.z);
                const approaching = this.ball.bounces >= 1 && this.ball.position.y < 1.48 && this.ball.velocity.y < 2.2;
                if (approaching && d < 1.50) {
                    this.capturedIncoming = this.ball.position.clone();
                    receiver.setIncomingContact(this.ball.position);
                    this.ball.active = false;
                    this.waitingForReceiver = false;
                    this.hitter = 1 - this.hitter;
                    this.shotTimer = .03;
                    receiver.face(this.hitter === 0 ? this.south.position : this.north.position);
                }
            }
            if (!this.ball.active && this.waitingForReceiver) {
                this.waitingForReceiver = false;
                this.finishError(this.lastOutcome === 'long' ? 'long' : 'frame');
            }
            else if (!this.ball.active && !this.waitingForReceiver && this.lastOutcome === 'long')
                this.finishError('long');
            return;
        }
        if (this.pending)
            return;
        this.shotTimer -= dt;
        if (this.shotTimer <= 0)
            this.prepareHit();
    }
    finishError(kind) {
        const striker = this.flightHitter ?? (this.hitter === 0 ? this.north : this.south);
        const receiver = striker === this.north ? this.south : this.north;
        const lastHitter = kind === 'net' || kind === 'long' ? striker : receiver;
        lastHitter.setEmotion(kind === 'net' ? 'frustrated' : 'disappointed', .8);
        lastHitter.trigger('reactMiss');
        const other = lastHitter === this.north ? this.south : this.north;
        this.score[other.id] = (this.score[other.id] ?? 0) + 1;
        this.errors[lastHitter.id] = (this.errors[lastHitter.id] ?? 0) + 1;
        this.callbacks.onPoint?.(other.id, lastHitter.id, kind);
        other.setEmotion('attentive', .55);
        this.callbacks.onMiss?.(lastHitter.id, kind);
        this.rallyCount = 0;
        this.waitingForReceiver = false;
        this.pending = null;
        this.ball.active = false;
        this.capturedIncoming = null;
        this.shotTimer = .72;
    }
    outcomeFor(hitter, state) {
        if (state === 'serve' && this.shotCount === 0)
            return 'clean';
        const skill = clamp(hitter.tennisSkill() - Math.min(.08, this.sessionHits * .0008), .35, .98), r = hash(this.shotCount * 3.71 + hitter.id.length * 5.13);
        const errorChance = .025 + (1 - skill) * .21;
        if (r > errorChance)
            return 'clean';
        const kind = hash(this.shotCount * 8.11 + hitter.id.charCodeAt(0));
        return kind < .42 ? 'frame' : kind < .72 ? 'net' : 'long';
    }
    prepareHit() {
        const hitter = this.hitter === 0 ? this.north : this.south, receiver = this.hitter === 0 ? this.south : this.north;
        const side = this.hitter === 0 ? -1 : 1;
        const pattern = [-.92, .62, -.34, 1.00, .18, -.72, .48, .86, -.12];
        let targetX = clamp(1 + pattern[this.shotCount % pattern.length], -2.75, 4.75);
        const receiverZ = receiver.position.z;
        let targetDepth = receiverZ + side * (.18 + ((this.shotCount % 3) - 1) * .18);
        let flight = .79 + (this.shotCount % 4) * .04;
        let state = this.shotCount === 0 ? 'serve' : this.shotCount % 7 === 5 ? 'volley' : this.shotCount % 2 ? 'swingForehand' : 'swingBackhand';
        if (state !== 'serve' && hitter.practiceCue === 'preparation')
            state = 'swingForehand';
        if (receiver.practiceCue === 'rhythm')
            flight += .12;
        const outcome = this.outcomeFor(hitter, state);
        if (outcome === 'frame') {
            targetX = clamp(targetX + (hash(this.shotCount + 4) > .5 ? .85 : -.85), -3.35, 5.35);
            flight *= 1.03;
        }
        if (outcome === 'net') {
            targetDepth = side < 0 ? 1.6 : -1.6;
            flight = .39;
        }
        if (outcome === 'long') {
            targetDepth = receiverZ - side * 2.75;
            flight = .84;
        }
        const target = new Vec3(targetX, .11, targetDepth);
        const receiveX = clamp(targetX + (receiver.practiceCue === 'spacing' ? .40 : (this.shotCount % 2 ? .22 : -.18)), -2.65, 4.65), receiveZ = receiver.position.z < 0 ? -5 : 5;
        receiver.moveOnCourt(new Vec3(receiveX, 0, receiveZ), hitter.position);
        receiver.setLook(hitter.position);
        receiver.setEmotion('focused', .8);
        hitter.face(target);
        hitter.setLook(receiver.position);
        hitter.triggerShot(state, target);
        const kin = hitter.debugKinematics(), contactAt = hitter.shotContactTime(state), duration = hitter.shotDuration(state);
        const evidence = { who: hitter.id, stroke: state, preparation: clamp((contactAt - .24) / .15, 0, 1), spacing: this.capturedIncoming && kin.contactTarget ? clamp(1 - Vec3.sub(this.capturedIncoming, kin.contactTarget).len() / 1.5, 0, 1) : .75, recovery: clamp(1 - Math.abs(hitter.position.x - 1) / 2.8, 0, 1), clean: outcome === 'clean' };
        this.pending = { evidence, hitter, receiver, state, target, flight, contactAt, duration, released: false, outcome, incomingStart: this.capturedIncoming?.clone() ?? null, contactTarget: kin.contactTarget?.clone() ?? null, tossStart: hitter.serveTossPoint() };
        this.capturedIncoming = null;
        this.shotCount++;
    }
    meshes() {
        const m = [];
        if (this.pending && !this.pending.released) {
            const p = this.pending, t = clamp(p.hitter.animTime / Math.max(.001, p.contactAt), 0, 1), contact = p.contactTarget ?? p.hitter.racketContactPoint();
            if (p.state === 'serve') {
                const rise = smoothstep(0, .72, t), settle = smoothstep(.72, 1, t);
                const toss = Vec3.lerp(p.tossStart, contact, rise);
                toss.y += Math.sin(Math.PI * t) * (.58 - .18 * settle);
                m.push({ kind: 'sphere', position: toss, scale: new Vec3(.16, .16, .16), color: '#dbc65d', unlit: true });
            }
            else if (p.incomingStart) {
                const q = Vec3.lerp(p.incomingStart, contact, smoothstep(0, 1, t));
                q.y += Math.sin(Math.PI * t) * .06;
                m.push({ kind: 'sphere', position: q, scale: new Vec3(.16, .16, .16), color: '#dbc65d', unlit: true });
            }
            else if (1 - t < .36) {
                m.push({ kind: 'sphere', position: contact.clone(), scale: new Vec3(.16, .16, .16), color: '#dbc65d', unlit: true });
            }
        }
        if (this.ball.active) {
            for (let i = this.trail.length - 1; i >= 0; i--) {
                const q = this.trail[i], a = .025 + (this.trail.length - i) * .015;
                m.push({ kind: 'sphere', position: q.clone(), scale: new Vec3(.095, .095, .095), color: '#e2cf66', alpha: Math.min(.14, a), unlit: true });
            }
            const squash = this.ball.position.y < .14 ? .82 : 1;
            m.push({ kind: 'sphere', position: this.ball.position.clone(), scale: new Vec3(.16 / squash, .16 * squash, .16 / squash), color: '#dbc65d', unlit: true }, { kind: 'sphere', position: new Vec3(this.ball.position.x, .025, this.ball.position.z), scale: new Vec3(.23, .024, .14), color: '#435448', alpha: .14, unlit: true });
        }
        if (this.impactPulse > 0 && this.lastContact) {
            const q = this.lastContact, scale = .32 + (1 - this.impactPulse) * .24;
            m.push({ kind: 'torus', position: q.clone(), rotation: new Vec3(Math.PI / 2, 0, 0), scale: new Vec3(scale, scale, .23), color: '#f0d778', alpha: Math.min(.28, this.impactPulse * .34), unlit: true });
        }
        if (this.netRipple > 0) {
            for (let i = 0; i < 5; i++) {
                const x = -2.2 + i * 1.55, phase = (1 - this.netRipple) * 5 + i * .6;
                m.push({ kind: 'roundBox', position: new Vec3(x, .55, Math.sin(phase) * .045 * this.netRipple), scale: new Vec3(.025, .68, .025), color: '#ede6d7', alpha: .32 * this.netRipple, unlit: true });
            }
        }
        return m;
    }
}
