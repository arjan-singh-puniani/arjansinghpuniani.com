import { ActingState } from '../animation/ActingState.js';
import { WalkCycle } from '../animation/WalkCycle.js';
import { Vec3, clamp, smoothstep } from '../rendering/Math3D.js';
import { Navigation } from '../world/Navigation.js';
import { clipForState, sampleClip } from '../animation/ClipLibrary.js';
import { CHARACTER_SKIN, skinMatrices } from '../animation/CharacterSkin.js';
export function locomotionStyleFor(id) {
    if (id === 'coach')
        return { cadence: 4.22, bounce: .018, armSwing: .155, hipSwing: .042, torsoCounter: .048, stride: .94, headStabilize: .72, turnSharpness: 8.0 };
    if (id === 'mika')
        return { cadence: 4.58, bounce: .030, armSwing: .235, hipSwing: .060, torsoCounter: .070, stride: .96, headStabilize: .60, turnSharpness: 8.7 };
    if (id === 'nia')
        return { cadence: 4.34, bounce: .022, armSwing: .185, hipSwing: .048, torsoCounter: .056, stride: .91, headStabilize: .68, turnSharpness: 7.6 };
    if (id === 'leo')
        return { cadence: 4.12, bounce: .024, armSwing: .250, hipSwing: .064, torsoCounter: .074, stride: 1.04, headStabilize: .64, turnSharpness: 8.4 };
    return { cadence: 4.38, bounce: .022, armSwing: .205, hipSwing: .052, torsoCounter: .060, stride: 1, headStabilize: .66, turnSharpness: 8.2 };
}
const isShot = (s) => s === 'swingForehand' || s === 'swingBackhand' || s === 'serve' || s === 'volley';
const MOVING = new Set(['walk', 'jog', 'shuffle']);
function expDamp(current, target, sharpness, dt) { return current + (target - current) * (1 - Math.exp(-sharpness * dt)); }
function angleDelta(a, b) { let d = (b - a + Math.PI) % (Math.PI * 2) - Math.PI; if (d < -Math.PI)
    d += Math.PI * 2; return d; }
function dampAngle(current, target, sharpness, dt) { return current + angleDelta(current, target) * (1 - Math.exp(-sharpness * dt)); }
function bell(x, width) { const q = x / Math.max(.001, width); return Math.exp(-q * q * 3.2); }
function blendVec(a, b, t) { return Vec3.lerp(a, b, t); }
function blendFace(a, b, t) { return { smile: a.smile + (b.smile - a.smile) * t, mouthOpen: a.mouthOpen + (b.mouthOpen - a.mouthOpen) * t, browRaise: a.browRaise + (b.browRaise - a.browRaise) * t, squint: a.squint + (b.squint - a.squint) * t, focus: a.focus + (b.focus - a.focus) * t }; }
function mixHex(a, b, t) { const parse = (h) => { const s = h.replace('#', ''); return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)]; }; const aa = parse(a), bb = parse(b), c = aa.map((v, i) => Math.round(v + (bb[i] - v) * t)); return '#' + c.map(v => v.toString(16).padStart(2, '0')).join(''); }
export class Character {
    spec;
    nav;
    destinations;
    get id() { return this.spec.id; }
    acting;
    crowd = [];
    majorActivity = false;
    yieldUntil = 0;
    crowdCooldown = 0;
    gazeYaw = 0;
    gazeStarted = false;
    gazeClock = 0;
    seatHeight = .54;
    react(name, target, duration = 18) { this.acting.react(name, duration); if (target)
        this.setLook(target); }
    position;
    yaw = 0;
    state = 'idle';
    activity = '';
    currentScheduleIndex = -1;
    path = [];
    pathIndex = 0;
    speed = 1.55;
    animTime = 0;
    targetLook;
    pendingState = 'idle';
    courtTarget;
    courtFacing;
    courtSpeed = 3.15;
    previousState = 'idle';
    previousAnimTime = 0;
    transitionAge = 1;
    transitionDuration = .20;
    walkCycle = new WalkCycle();
    exitWalkPose = null;
    targetYaw = 0;
    locomotion = 0;
    horizontalSpeed = 0;
    gaitPhase = 0;
    travelSpeed = 0;
    leftFootLock = null;
    rightFootLock = null;
    prevLeftStance = false;
    prevRightStance = false;
    incomingContact = null;
    contactTarget = null;
    outgoingTarget = null;
    facePose = { smile: .08, mouthOpen: 0, browRaise: .05, squint: 0, focus: .08 };
    lastPose = null;
    prevPosition;
    localVelocity = new Vec3();
    courtPhase = 'neutral';
    courtPhaseAge = 0;
    courtMoveDelay = 0;
    development = 50;
    emotion = 'neutral';
    emotionUntil = 0;
    conversationTarget;
    racketVibration = 0;
    stepEvent = false;
    lastStanceKey = '';
    constructor(spec, start, nav, destinations) {
        this.spec = spec;
        this.nav = nav;
        this.destinations = destinations;
        this.acting = new ActingState(spec.id);
        this.position = start.clone();
        this.prevPosition = start.clone();
        this.targetYaw = this.yaw;
    }
    setDestination(id, activity, animation) { const original = this.destinations[id]; if (!original)
        return; const arrivalSpots = { coach: new Vec3(-6.5, 0, 6.2), mika: new Vec3(-6.5, 0, 8.7), leo: new Vec3(-8, 0, 8.7), nia: new Vec3(-8, 0, 6.2) }; const dest = this.freeDestination(id === 'entrance' ? (arrivalSpots[this.id] ?? original) : original); this.clearCourtMove(); this.activity = activity; this.path = this.nav.clubPath(this.position, dest); this.pathIndex = 0; this.pendingState = animation || 'idle'; this.changeState(this.path.length ? 'walk' : this.pendingState, false); }
    freeDestination(dest) {
        const clear = (p) => !this.nav.isBlocked(p.x, p.z) && this.crowd.every(c => c === this || Math.hypot(p.x - c.position.x, p.z - c.position.z) > .92);
        if (clear(dest))
            return dest;
        for (const radius of [1.05, 1.55, 2.05])
            for (let i = 0; i < 8; i++) {
                const p = new Vec3(dest.x + Math.cos(i * Math.PI / 4) * radius, 0, dest.z + Math.sin(i * Math.PI / 4) * radius);
                if (clear(p) && this.nav.clubPath(this.position, p).length)
                    return p;
            }
        return this.position.clone();
    }
    crowdStep(target, step) {
        if (this.majorActivity || !this.crowd.length)
            return step;
        const delta = Vec3.sub(target, this.position), length = Math.hypot(delta.x, delta.z);
        if (!length)
            return step;
        const dx = delta.x / length, dz = delta.z / length;
        const blockers = this.crowd.filter(c => c !== this && Math.hypot(c.position.x - this.position.x, c.position.z - this.position.z) < 1.5);
        const blocked = blockers.some(c => { const before = Math.hypot(c.position.x - this.position.x, c.position.z - this.position.z), after = Math.hypot(c.position.x - this.position.x - dx * step, c.position.z - this.position.z - dz * step); return after < .82 && after < before - 1e-6; });
        if (!blocked)
            return step;
        if (this.crowdCooldown <= 0) {
            this.crowdCooldown = .7;
            const goal = this.path[this.path.length - 1];
            const heading = Vec3.sub(goal ?? target, this.position).normalize();
            const detour = new Vec3(this.position.x + heading.x * .3 + heading.z * 1.05, 0, this.position.z + heading.z * .3 - heading.x * 1.05);
            const dynamic = new Navigation([...this.nav.obstacles, ...blockers.map(c => ({ x: c.position.x, z: c.position.z, w: 1.24, d: 1.24 }))]);
            const first = dynamic.clubPath(this.position, detour), last = goal ? dynamic.clubPath(detour, goal) : [];
            const path = first.length && last.length ? [...first, ...last] : goal ? dynamic.clubPath(this.position, goal) : [];
            if (path.length) {
                this.path = path;
                this.pathIndex = 0;
            }
            else {
                const options = Array.from({ length: 16 }, (_, i) => { const a = i * Math.PI / 8; return new Vec3(this.position.x + Math.cos(a) * .5, 0, this.position.z + Math.sin(a) * .5); }).filter(p => this.nav.clearSegment(this.position, p) && blockers.every(c => Math.hypot(p.x - c.position.x, p.z - c.position.z) > Math.min(.84, Math.hypot(this.position.x - c.position.x, this.position.z - c.position.z)) && ((p.x - this.position.x) * (c.position.x - this.position.x) + (p.z - this.position.z) * (c.position.z - this.position.z) <= 0)));
                const cost = (p) => Vec3.sub(p, goal ?? target).len() + .4 * (heading.x * (p.z - this.position.z) - heading.z * (p.x - this.position.x));
                options.sort((a, b) => cost(a) - cost(b));
                for (const escape of options) {
                    let rest = dynamic.clubPath(escape, goal ?? target);
                    if (!rest.length && blockers.some(c => c.pathIndex < c.path.length && Math.hypot(c.position.x - (goal ?? target).x, c.position.z - (goal ?? target).z) < .9))
                        rest = this.nav.clubPath(escape, goal ?? target);
                    if (rest.length) {
                        this.path = [escape, ...rest];
                        this.pathIndex = 0;
                        break;
                    }
                }
            }
        }
        return 0;
    }
    goTo(dest, after = 'idle') { if (this.state === 'sit') {
        this.changeState('idle', false);
        this.departureDelay = .65;
    } this.clearCourtMove(); this.path = this.nav.clubPath(this.position, dest); this.pathIndex = 0; this.pendingState = after; if (this.departureDelay <= 0)
        this.changeState(this.path.length ? 'walk' : after, false); }
    moveOnCourt(dest, faceTarget, split = true) { this.path = []; this.pathIndex = 0; this.courtTarget = dest.clone(); this.courtFacing = faceTarget?.clone(); this.courtPhase = split ? 'split' : 'recover'; this.courtPhaseAge = 0; this.courtMoveDelay = split ? .09 : 0; this.changeState('shuffle', false); }
    clearCourtMove() { this.courtTarget = undefined; this.courtFacing = undefined; if (!isShot(this.state)) {
        this.courtPhase = 'neutral';
        this.courtPhaseAge = 0;
    } }
    setLook(target) { this.targetLook = target?.clone(); }
    setConversationPartner(target) { this.conversationTarget = target?.clone(); if (target)
        this.setLook(target); }
    gestureAge = 1;
    previousGesture = 'none';
    gesture = 'none';
    get socialGesture() { return this.gesture; }
    set socialGesture(g) { if (g !== this.gesture) {
        this.previousGesture = this.gesture;
        this.gesture = g;
        this.gestureAge = 0;
    } }
    racketStowed = false;
    propWanted = null;
    propKind = null;
    propAge = 0;
    propAnchor = null;
    propRelease = null;
    departureDelay = 0;
    get socialProp() { return this.propWanted; }
    set socialProp(kind) {
        if (kind === this.propWanted)
            return;
        const previous = this.propWanted;
        this.propWanted = kind;
        if (kind && kind === this.propKind) {
            if (previous === null)
                this.propAge = 1;
            return;
        }
        this.propAge = 0;
        if (kind) {
            this.propKind = kind;
            this.propAnchor = this.worldLocal(kind === 'notebook' ? -.34 : .34, .99, .13);
            this.propRelease = null;
        }
        else
            this.propRelease = (this.propKind === 'notebook' ? this.lastPose?.handL : this.lastPose?.handR)?.clone() ?? null;
    }
    get propPhase() { return !this.propKind ? 'none' : !this.propWanted ? 'release' : this.propAge < .4 ? 'reach' : this.propAge < .65 ? 'grasp' : 'use'; }
    practiceCue = '';
    seatDepth = 0;
    preparationBonus = 0;
    recoveryBonus = 0;
    setDevelopment(value) { this.development = clamp(value, 0, 100); }
    getDevelopment() { return this.development; }
    tennisSkill() { if (this.spec.id === 'coach')
        return .95; if (this.spec.id === 'leo')
        return .72; if (this.spec.id === 'nia')
        return .48; if (this.spec.id === 'mika')
        return .44 + this.development * .0048; return .62; }
    setEmotion(emotion, duration = .9) { this.emotion = emotion; this.emotionUntil = duration; }
    notifyRacketImpact(quality = 'clean') { this.racketVibration = quality === 'clean' ? 1 : quality === 'frame' ? 1.45 : .75; this.setEmotion(quality === 'clean' ? 'pleased' : quality === 'frame' ? 'surprised' : 'disappointed', .55); }
    consumeStepEvent() { const v = this.stepEvent; this.stepEvent = false; return v; }
    face(target) { const d = Vec3.sub(target, this.position); this.targetYaw = Math.atan2(d.x, d.z); }
    trigger(state) { this.changeState(state, true); if (isShot(state))
        this.clearCourtMove(); }
    setAnimation(state) { this.changeState(state, false); }
    setIncomingContact(point) { this.incomingContact = point.clone(); }
    triggerShot(state, outgoingTarget) { this.outgoingTarget = outgoingTarget.clone(); this.contactTarget = this.solveContactTarget(state, this.incomingContact); this.incomingContact = null; this.courtPhase = 'stroke'; this.courtPhaseAge = 0; this.setEmotion('focused', this.shotDuration(state)); this.trigger(state); }
    clearShotIntent() { this.contactTarget = null; this.outgoingTarget = null; this.incomingContact = null; this.courtPhase = 'recover'; this.courtPhaseAge = 0; }
    shotContactTime(state = this.state) { const style = this.strokeStyle(); const base = state === 'serve' ? .48 : state === 'volley' ? .21 : state === 'swingBackhand' ? .35 : .33; const dev = this.spec.id === 'mika' ? (this.development - 50) * .0007 : 0; return Math.max(.16, base * style.timing + dev + this.preparationBonus + (this.practiceCue === 'preparation' ? .065 : 0)); }
    shotDuration(state = this.state) { const style = this.strokeStyle(); const base = state === 'serve' ? .96 : state === 'volley' ? .50 : state === 'swingBackhand' ? .78 : .76; return base * style.tempo; }
    serveTossPoint() { const p = this.pose(); return p.handL.clone(); }
    strokeStyle() {
        if (this.spec.id === 'coach')
            return { timing: 1.08, tempo: .92, coil: .88, follow: .92, reach: .96 };
        if (this.spec.id === 'leo')
            return { timing: .98, tempo: 1.06, coil: 1.18, follow: 1.16, reach: 1.06 };
        if (this.spec.id === 'nia')
            return { timing: 1.02, tempo: 1.12, coil: .78, follow: .78, reach: .90 };
        if (this.spec.id === 'mika') {
            const d = this.development / 100;
            return { timing: .94 + d * .10, tempo: 1.06 - d * .08, coil: .92 + d * .10, follow: .90 + d * .13, reach: .96 + d * .04 };
        }
        return { timing: 1, tempo: 1, coil: 1, follow: 1, reach: 1 };
    }
    update(dt) {
        this.propAge += dt;
        this.departureDelay = Math.max(0, this.departureDelay - dt);
        if (!this.propWanted && this.propAge >= .65) {
            this.propKind = null;
            this.propAnchor = null;
            this.propRelease = null;
        }
        this.acting.update(dt, this.majorActivity || isShot(this.state) || this.state === 'shuffle');
        this.crowdCooldown -= dt;
        this.gazeClock += dt;
        const look = this.targetLook ?? this.conversationTarget;
        let aim = look ? Math.atan2(look.x - this.position.x, look.z - this.position.z) : this.yaw;
        if (look && !this.majorActivity && this.acting.role !== 'none' && this.gazeClock % (this.acting.values.gazeHold + 1) > this.acting.values.gazeHold)
            aim += .24;
        if (!this.gazeStarted) {
            this.gazeYaw = this.yaw;
            this.gazeStarted = true;
        }
        this.gazeYaw = dampAngle(this.gazeYaw, aim, 5, dt);
        this.animTime += dt;
        this.gestureAge += dt;
        this.transitionAge += dt;
        this.courtPhaseAge += dt;
        this.racketVibration = expDamp(this.racketVibration, 0, 18, dt);
        if (this.emotionUntil > 0) {
            this.emotionUntil = Math.max(0, this.emotionUntil - dt);
            if (this.emotionUntil === 0)
                this.emotion = 'neutral';
        }
        const before = this.position.clone();
        let moved = 0;
        if (this.pathIndex < this.path.length && this.departureDelay <= 0) {
            while (this.pathIndex < this.path.length && Vec3.sub(this.path[this.pathIndex], this.position).len() < .0001)
                this.pathIndex++;
            if (this.pathIndex >= this.path.length) {
                this.travelSpeed = 0;
                this.trigger(this.pendingState);
            }
            else {
                const target = this.path[this.pathIndex], delta = Vec3.sub(target, this.position), dist = Math.hypot(delta.x, delta.z);
                this.targetYaw = Math.atan2(delta.x, delta.z);
                const next = this.path[this.pathIndex + 1];
                if (next && dist < .5) {
                    const outgoing = Vec3.sub(next, target);
                    this.targetYaw += angleDelta(this.targetYaw, Math.atan2(outgoing.x, outgoing.z)) * (1 - dist / .5) * .65;
                }
                const remaining = this.path.slice(this.pathIndex).reduce((n, p, i) => n + Vec3.sub(p, i ? this.path[this.pathIndex + i - 1] : this.position).len(), 0);
                const alignment = Math.max(.08, Math.cos(angleDelta(this.yaw, this.targetYaw)));
                const nominal = Math.min(this.speed * this.acting.values.stepEnergy, Math.sqrt(2 * 2.8 * remaining)) * alignment;
                this.travelSpeed = expDamp(this.travelSpeed, nominal, 7, dt);
                const step = this.crowdStep(target, Math.min(dist, this.travelSpeed * dt));
                this.position.x += delta.x / dist * step;
                this.position.z += delta.z / dist * step;
                moved = step;
                this.changeState('walk', false);
                if (step >= dist) {
                    this.pathIndex++;
                    if (this.pathIndex >= this.path.length) {
                        this.travelSpeed = 0;
                        this.trigger(this.pendingState);
                    }
                }
            }
        }
        else if (this.courtTarget) {
            this.travelSpeed = expDamp(this.travelSpeed, 0, 8, dt);
            const d = Vec3.sub(this.courtTarget, this.position), dist = Math.hypot(d.x, d.z);
            if (this.courtFacing) {
                const fd = Vec3.sub(this.courtFacing, this.position);
                this.targetYaw = Math.atan2(fd.x, fd.z);
            }
            if (this.courtMoveDelay > 0) {
                this.courtMoveDelay = Math.max(0, this.courtMoveDelay - dt);
                this.courtPhase = 'split';
            }
            else if (dist < .055) {
                this.position.x = this.courtTarget.x;
                this.position.z = this.courtTarget.z;
                this.courtTarget = undefined;
                this.courtPhase = 'load';
                this.courtPhaseAge = 0;
                this.changeState('ready', false);
            }
            else {
                const step = Math.min(dist, (this.courtSpeed + this.recoveryBonus + (this.practiceCue === 'recovery' ? .6 : 0)) * dt);
                this.position.x += d.x / dist * step;
                this.position.z += d.z / dist * step;
                moved = step;
                this.courtPhase = 'adjust';
                this.changeState('shuffle', false);
            }
        }
        else {
            this.travelSpeed = expDamp(this.travelSpeed, 0, 7.5, dt);
            if (this.courtPhase === 'recover' && this.courtPhaseAge > .28) {
                this.courtPhase = 'neutral';
                this.courtPhaseAge = 0;
            }
        }
        const locomotionStyle = locomotionStyleFor(this.spec.id);
        this.yaw = dampAngle(this.yaw, this.targetYaw, isShot(this.state) ? 12 : this.acting.role === 'speak' || this.acting.role === 'listen' ? 2.8 : locomotionStyle.turnSharpness, dt);
        const worldVel = Vec3.sub(this.position, before).scale(dt > 0 ? 1 / dt : 0);
        const s = Math.sin(this.yaw), c = Math.cos(this.yaw);
        this.localVelocity.set(c * worldVel.x - s * worldVel.z, 0, s * worldVel.x + c * worldVel.z);
        const instantaneous = dt > 0 ? moved / dt : 0;
        this.horizontalSpeed = expDamp(this.horizontalSpeed, instantaneous, 14, dt);
        const targetLoc = MOVING.has(this.state) ? .98 : 0;
        this.locomotion = expDamp(this.locomotion, targetLoc, 10, dt);
        if (this.state === 'walk' || this.state === 'jog') {
            const stride = 1.02 * locomotionStyle.stride;
            this.stepEvent = this.walkCycle.update(this.position, this.yaw, moved, stride) || this.stepEvent;
            this.gaitPhase = this.walkCycle.phase * Math.PI * 2;
        }
        else if (this.locomotion > .02) {
            const cadence = this.state === 'shuffle' ? 5.8 : locomotionStyle.cadence;
            this.gaitPhase = (this.gaitPhase + Math.max(.25, this.horizontalSpeed) * cadence * dt) % (Math.PI * 2);
        }
        this.updateFootPlanting();
        const desired = this.expressionFor(this.state), reaction = this.acting.reaction, w = this.acting.reactionWeight;
        if (!isShot(this.state)) {
            desired.smile = clamp(desired.smile + this.acting.values.smileBias + (reaction?.smile ?? 0) * w, -.5, 1);
            desired.browRaise = clamp(desired.browRaise + this.acting.values.browBias + (reaction?.brow ?? 0) * w, -.25, 1);
        }
        this.facePose = { smile: expDamp(this.facePose.smile, desired.smile, 10, dt), mouthOpen: expDamp(this.facePose.mouthOpen, desired.mouthOpen, 14, dt), browRaise: expDamp(this.facePose.browRaise, desired.browRaise, 10, dt), squint: expDamp(this.facePose.squint, desired.squint, 12, dt), focus: expDamp(this.facePose.focus, desired.focus, 12, dt) };
        this.prevPosition = this.position.clone();
    }
    racketContactPoint() { const pose = this.pose(); return pose.racketCenter.clone(); }
    debugKinematics() { const p = this.pose(); const err = this.contactTarget ? Vec3.sub(p.racketCenter, this.contactTarget).len() : 0; const lateral = Math.min(1, Math.abs(this.localVelocity.x) / Math.max(.01, this.courtSpeed)), forward = Math.min(1, Math.max(0, this.localVelocity.z) / Math.max(.01, this.courtSpeed)), backward = Math.min(1, Math.max(0, -this.localVelocity.z) / Math.max(.01, this.courtSpeed)), jog = Math.min(1, Math.max(0, (this.horizontalSpeed - 1.45) / .8)), walk = Math.min(1, this.horizontalSpeed / 1.55) * (1 - jog); return { leftFoot: p.footL.clone(), rightFoot: p.footR.clone(), leftHand: p.handL.clone(), rightHand: p.handR.clone(), leftFootPlanted: this.leftFootLock !== null, rightFootPlanted: this.rightFootLock !== null, racketGrip: p.racketGrip.clone(), racketCenter: p.racketCenter.clone(), contactTarget: this.contactTarget?.clone() ?? null, contactError: err, state: this.state, transition: clamp(this.transitionAge / this.transitionDuration, 0, 1), locomotion: this.locomotion, courtPhase: this.courtPhase, development: this.development, racketVibration: this.racketVibration, motionBlend: { idle: 1 - this.locomotion, walk, jog, lateral, forward, backward } }; }
    changeState(next, resetTime) {
        if (next === this.state) {
            if (resetTime)
                this.animTime = 0;
            return;
        }
        if ((next === 'walk' || next === 'jog') && this.state !== 'walk' && this.state !== 'jog') {
            this.walkCycle.reset();
            this.walkCycle.update(this.position, this.yaw, 0, 1.02 * locomotionStyleFor(this.spec.id).stride);
        }
        this.exitWalkPose = ((this.state === 'walk' || this.state === 'jog') && !MOVING.has(next) || this.state === 'sit') ? this.pose() : null;
        if (!MOVING.has(next))
            this.walkCycle.reset();
        this.previousState = this.state;
        this.previousAnimTime = this.animTime;
        this.state = next;
        this.animTime = resetTime ? 0 : 0;
        this.transitionAge = 0;
        this.transitionDuration = isShot(next) || isShot(this.previousState) ? .13 : MOVING.has(next) || MOVING.has(this.previousState) ? .18 : next === 'sit' || this.previousState === 'sit' ? .65 : .26;
        if (!MOVING.has(next)) {
            this.leftFootLock = null;
            this.rightFootLock = null;
            this.prevLeftStance = false;
            this.prevRightStance = false;
        }
    }
    solveContactTarget(state, incoming) {
        if (state === 'serve')
            return this.worldLocal(.14, 2.36, .28);
        const local = incoming ? this.localFromWorld(incoming) : new Vec3(state === 'swingForehand' ? .54 : state === 'swingBackhand' ? -.42 : .30, 1.02, .48);
        local.y = clamp(local.y, state === 'volley' ? .90 : .66, state === 'volley' ? 1.58 : 1.38);
        local.z = clamp(local.z, .28, .78);
        if (state === 'swingForehand')
            local.x = clamp(Math.abs(local.x) + .18, .46, .88);
        if (state === 'swingBackhand')
            local.x = -clamp(Math.abs(local.x) + .12, .30, .76);
        if (state === 'volley')
            local.x = clamp(local.x, -.56, .56);
        return this.worldLocal(local.x, local.y, local.z);
    }
    updateFootPlanting() {
        if (!(this.state === 'walk' || this.state === 'jog' || this.state === 'shuffle')) {
            this.leftFootLock = null;
            this.rightFootLock = null;
            this.prevLeftStance = false;
            this.prevRightStance = false;
            this.lastStanceKey = '';
            return;
        }
        if (this.state === 'walk' || this.state === 'jog') {
            this.leftFootLock = this.walkCycle.planted[0] ? this.walkCycle.feet[0].clone() : null;
            this.rightFootLock = this.walkCycle.planted[1] ? this.walkCycle.feet[1].clone() : null;
            return;
        }
        const phase = this.gaitPhase, isShuffle = this.state === 'shuffle', wave = Math.sin(phase);
        const leftStance = isShuffle ? wave < .22 : Math.cos(phase) > .08, rightStance = isShuffle ? wave > -.22 : Math.cos(phase + Math.PI) > .08;
        const speedRef = this.courtSpeed;
        const speed01 = clamp(this.horizontalSpeed / Math.max(.01, speedRef), 0, 1);
        const style = locomotionStyleFor(this.spec.id);
        const stride = (.22) * speed01 * style.stride;
        const side = clamp(this.localVelocity.x / Math.max(.01, this.courtSpeed), -1, 1);
        const fore = clamp(this.localVelocity.z / Math.max(.01, this.courtSpeed), -1, 1);
        const predict = Math.min(.12, this.horizontalSpeed * .035);
        const future = this.position.clone().add(new Vec3(Math.sin(this.yaw) * fore * predict + Math.cos(this.yaw) * side * predict, 0, Math.cos(this.yaw) * fore * predict - Math.sin(this.yaw) * side * predict));
        const desired = (left) => { const lateral = (left ? -.29 : .29) + (isShuffle ? -side * .10 : 0); const z = isShuffle ? (left ? .12 : -.03) + (left ? wave : -wave) * .045 : (.04 + (left ? Math.sin(phase) : Math.sin(phase + Math.PI)) * stride); const old = this.position; this.position = future; const v = this.worldLocal(lateral, .11, z); this.position = old; return v; };
        const leftDesired = desired(true), rightDesired = desired(false);
        if (leftStance && !this.prevLeftStance) {
            this.leftFootLock = leftDesired.clone();
            this.stepEvent = true;
        }
        if (!leftStance)
            this.leftFootLock = null;
        if (rightStance && !this.prevRightStance) {
            this.rightFootLock = rightDesired.clone();
            this.stepEvent = true;
        }
        if (!rightStance)
            this.rightFootLock = null;
        const key = `${leftStance ? 'L' : ''}${rightStance ? 'R' : ''}`;
        this.lastStanceKey = key;
        this.prevLeftStance = leftStance;
        this.prevRightStance = rightStance;
    }
    expressionFor(state) {
        const emotional = {
            neutral: { smile: .12, mouthOpen: 0, browRaise: .08, squint: 0, focus: .10 }, attentive: { smile: .08, mouthOpen: 0, browRaise: .20, squint: .02, focus: .58 }, friendly: { smile: .52, mouthOpen: .05, browRaise: .16, squint: .04, focus: .16 }, focused: { smile: .01, mouthOpen: .03, browRaise: .08, squint: .18, focus: .90 }, amused: { smile: .72, mouthOpen: .14, browRaise: .22, squint: .16, focus: .18 }, pleased: { smile: .62, mouthOpen: .04, browRaise: .12, squint: .10, focus: .16 }, disappointed: { smile: -.22, mouthOpen: .04, browRaise: .26, squint: .08, focus: .28 }, tired: { smile: .02, mouthOpen: .05, browRaise: -.08, squint: .30, focus: .08 }, surprised: { smile: .06, mouthOpen: .28, browRaise: .58, squint: 0, focus: .52 }, proud: { smile: .78, mouthOpen: .05, browRaise: .20, squint: .09, focus: .12 }, frustrated: { smile: -.30, mouthOpen: .06, browRaise: -.10, squint: .24, focus: .50 }
        };
        if (this.emotion !== 'neutral')
            return emotional[this.emotion];
        if (state === 'celebrate')
            return emotional.proud;
        if (state === 'reactMiss')
            return emotional.disappointed;
        if (state === 'talk' || state === 'coachExplain')
            return { smile: .46, mouthOpen: .38 + .18 * Math.sin(this.animTime * 9), browRaise: .30, squint: .03, focus: .12 };
        if (isShot(state)) {
            const p = this.shotProgress(), contact = this.shotContactTime() / this.shotDuration(), near = bell(p - contact, .11);
            return { smile: .02, mouthOpen: .04, browRaise: .08 + .10 * near, squint: .06 + .22 * near, focus: .85 };
        }
        if (state === 'ready' || state === 'shuffle' || state === 'watch')
            return emotional.attentive;
        if (state === 'drink')
            return emotional.pleased;
        return emotional.neutral;
    }
    worldLocal(x, y, z, yaw = this.yaw) { const s = Math.sin(yaw), c = Math.cos(yaw); const shift = this.state === 'sit' ? -this.seatDepth * smoothstep(0, .6, this.animTime) : 0; return new Vec3(this.position.x + c * x + s * (z + shift), y, this.position.z - s * x + c * (z + shift)); }
    localFromWorld(v) { const dx = v.x - this.position.x, dz = v.z - this.position.z, s = Math.sin(this.yaw), c = Math.cos(this.yaw); return new Vec3(c * dx - s * dz, v.y, s * dx + c * dz); }
    limb(a, b, r, color) { const d = Vec3.sub(b, a), len = d.len() || .001; const h = Math.hypot(d.x, d.z); const pitch = Math.atan2(h, d.y); const yaw = Math.atan2(d.x, d.z); return { kind: 'cylinder', position: Vec3.lerp(a, b, .5), rotation: new Vec3(pitch, yaw, 0), scale: new Vec3(r, len, r), color }; }
    seed() { let n = 0; for (const c of this.spec.id)
        n += c.charCodeAt(0); return n; }
    shotProgress(state = this.state, time = this.animTime) { return isShot(state) ? clamp(time / Math.max(.001, this.shotDuration(state)), 0, 1) : 0; }
    clipPhase(state, time) {
        if (state === 'walk' || state === 'jog' || state === 'shuffle')
            return ((this.gaitPhase / (Math.PI * 2)) % 1 + 1) % 1;
        if (isShot(state))
            return this.shotProgress(state, time);
        const durations = { sit: 2.4, talk: 1.9, drink: 1.35, stretch: 2.8, watch: 2.6, celebrate: 1.2, reactMiss: 1.0, coachFeed: 1.8, coachExplain: 2.1, ready: 1.35 };
        return (time / (durations[state] ?? 3.6)) % 1;
    }
    poseFor(state, time) {
        const sit = state === 'sit';
        const clip = sampleClip(clipForState(state, this.seed()), this.clipPhase(state, time));
        let baseY = (sit ? (this.seatHeight + .10 - .79) : 0) + clip.pelvisY;
        const breathe = Math.sin(time * 2.05 + this.seed() * .01) * .014;
        const shot = isShot(state), sp = shot ? this.shotProgress(state, time) : 0;
        const contact = shot ? this.shotContactTime(state) / this.shotDuration(state) : .45;
        const style = this.strokeStyle();
        let coil = clip.torsoTwist, hipCoil = clip.hipTwist, lean = clip.lean, knee = clip.knee, weightShift = 0;
        if (state === 'swingForehand') {
            const pre = clamp(sp / contact, 0, 1), post = clamp((sp - contact) / (1 - contact), 0, 1);
            coil += (-.62 * (1 - smoothstep(0, .82, pre)) + .66 * style.follow * smoothstep(0, 1, post)) * style.coil;
            hipCoil += coil * .52;
            lean += .035 + .07 * Math.sin(sp * Math.PI);
            knee += .11 * Math.sin(Math.min(1, sp / contact) * Math.PI);
            weightShift = smoothstep(.18, .75, sp);
        }
        if (state === 'swingBackhand') {
            const pre = clamp(sp / contact, 0, 1), post = clamp((sp - contact) / (1 - contact), 0, 1);
            coil += (.58 * (1 - smoothstep(0, .82, pre)) - .56 * style.follow * smoothstep(0, 1, post)) * style.coil;
            hipCoil += coil * .56;
            lean += .04;
            knee += .10 * Math.sin(Math.min(1, sp / contact) * Math.PI);
            weightShift = smoothstep(.20, .78, sp);
        }
        if (state === 'serve') {
            coil += (-.36 + sp * .72) * style.coil;
            hipCoil += (-.18 + sp * .34) * style.coil;
            lean += -.045 + sp * .12;
            knee += .15 * Math.sin(Math.min(1, sp / .57) * Math.PI);
            weightShift = smoothstep(.34, .82, sp);
        }
        if (state === 'volley') {
            coil += (sp < contact ? -.14 : .20);
            hipCoil += coil * .35;
            knee += .055;
            weightShift = smoothstep(.18, .66, sp);
        }
        const moving = state === 'walk' || state === 'jog';
        const shuffle = state === 'shuffle';
        const gait = moving ? Math.cos(this.gaitPhase) : 0;
        const gaitStyle = locomotionStyleFor(this.spec.id);
        const stepLift = moving ? Math.pow(Math.abs(Math.sin(this.gaitPhase)), 1.7) * gaitStyle.bounce : 0;
        const gaitCounter = moving ? Math.sin(this.gaitPhase) * gaitStyle.torsoCounter : 0;
        const splitHop = this.courtPhase === 'split' ? Math.sin(Math.min(1, this.courtPhaseAge / .10) * Math.PI) * .055 : 0;
        if (state === 'idle') {
            const phase = time * this.acting.values.idleFidgetRate * (this.spec.id === 'mika' ? .92 : this.spec.id === 'nia' ? .68 : .58) + this.seed() * .037;
            const amp = this.spec.id === 'coach' ? .010 : this.spec.id === 'mika' ? .024 : this.spec.id === 'nia' ? .018 : .015;
            hipCoil += Math.sin(phase) * amp;
            coil -= Math.sin(phase) * amp * .72;
            baseY += Math.sin(phase * 1.7) * amp * .13;
        }
        if (moving) {
            coil = gait * gaitStyle.torsoCounter * .45;
            hipCoil = -gait * gaitStyle.hipSwing * .45;
            baseY = .008 + Math.sin(this.gaitPhase * 2) * .012;
            lean = 0;
            knee = 0;
        }
        const torsoYaw = this.yaw + coil, hipYaw = this.yaw + hipCoil;
        const targetHeadYaw = this.gazeYaw;
        const headYaw = this.yaw + clamp(angleDelta(this.yaw, targetHeadYaw), -.42, .42) + clip.headTurn;
        const sy = Math.sin(headYaw), cy = Math.cos(headYaw), right = new Vec3(cy, 0, -sy), forward = new Vec3(sy, 0, cy);
        const contactLocal = this.contactTarget ? this.localFromWorld(this.contactTarget) : new Vec3(state === 'swingBackhand' ? -.52 : state === 'serve' ? .14 : .56, state === 'serve' ? 2.36 : 1.02, .5);
        const outside = clamp(contactLocal.x, -.85, .85);
        const pelvisShiftX = shot ? outside * .05 * bell(sp - contact, .24) : 0;
        const pelvisShiftZ = (shot ? .08 * weightShift : 0) + clip.pelvisZ;
        const pelvisCenter = this.worldLocal(pelvisShiftX, .79 + baseY - knee + splitHop, pelvisShiftZ, hipYaw);
        const torsoCenter = this.worldLocal(pelvisShiftX * .45, 1.14 + baseY + breathe - knee + splitHop, .025 + pelvisShiftZ * .6, torsoYaw);
        const actingLift = shot ? 0 : this.acting.values.postureLift + (this.acting.reaction?.lift ?? 0) * this.acting.reactionWeight;
        torsoCenter.y += actingLift;
        const feminine = this.spec.presentation === 'feminine', shoulderHalf = feminine ? .355 : .38;
        const shoulderL = this.worldLocal(-shoulderHalf + pelvisShiftX * .3, 1.34 + baseY + breathe - knee + splitHop, .015 + pelvisShiftZ * .55, torsoYaw), shoulderR = this.worldLocal(shoulderHalf + pelvisShiftX * .3, 1.34 + baseY + breathe - knee + splitHop, .015 + pelvisShiftZ * .55, torsoYaw);
        shoulderL.y += actingLift;
        shoulderR.y += actingLift;
        if (!shot) {
            shoulderL.add(this.localVector(-this.acting.values.shoulderOpenness, 0, 0));
            shoulderR.add(this.localVector(this.acting.values.shoulderOpenness, 0, 0));
        }
        const neutralL = this.worldLocal(-.48, 1.02 + baseY - knee, -.02), neutralR = this.worldLocal(.48, 1.02 + baseY - knee, -.02);
        let handL = neutralL.clone(), handR = neutralR.clone();
        if (moving) {
            const swing = gait * gaitStyle.armSwing * .65;
            const lift = Math.abs(gait) * .015;
            handL = this.worldLocal(-.43, 1.06 + baseY + lift, -swing);
            handR = this.worldLocal(.43, 1.06 + baseY + lift, swing);
        }
        if (state === 'talk') {
            const amp = this.acting.values.gestureAmplitude;
            handL = this.worldLocal(-.39, 1.08 + baseY, .14 + .035 * Math.sin(time * 2.1));
            handR = this.worldLocal(.38, 1.18 + baseY, .26 + .09 * amp * Math.sin(time * 2.4));
        }
        if (sit) {
            handL = this.worldLocal(-.20, .88 + baseY, .28);
            handR = this.worldLocal(.20, .88 + baseY, .28);
        }
        if (state === 'drink') {
            handR = this.worldLocal(.20, 1.56 + baseY, .33);
            handL = this.worldLocal(-.38, 1.06 + baseY, .04);
        }
        if (state === 'stretch') {
            handL = this.worldLocal(-.30, 2.05 + baseY, .02);
            handR = this.worldLocal(.30, 2.05 + baseY, .02);
        }
        if (state === 'watch' || state === 'ready') {
            handL = this.worldLocal(.22, 1.12 + baseY, .25);
            handR = this.worldLocal(-.22, 1.12 + baseY, .27);
        }
        if (state === 'shuffle') {
            const pulse = Math.sin(time * 8.5);
            handL = this.worldLocal(.20, 1.10 + baseY, .24 + pulse * .03);
            handR = this.worldLocal(-.20, 1.10 + baseY, .26 - pulse * .03);
        }
        if (state === 'coachFeed') {
            handL = this.worldLocal(-.42, 1.05 + baseY, .12);
            handR = this.worldLocal(.55, 1.12 + baseY, .30 + Math.sin(time * 2.4) * .12);
        }
        if (state === 'coachExplain') {
            handL = this.worldLocal(-.42, 1.08 + baseY, .1);
            handR = this.worldLocal(.58, 1.38 + baseY, .22 + Math.sin(time * 2.1) * .08);
        }
        if (state === 'swingForehand') {
            const a = -1.45 + smoothstep(0, .70, sp / contact) * 1.98 + smoothstep(contact, 1, sp) * 1.10;
            handR = this.worldLocal(.54 * Math.cos(a), 1.05 + baseY - knee, .58 * Math.sin(a) + .29, torsoYaw);
            handL = this.worldLocal(-.14, 1.18 + baseY - knee, .30, torsoYaw);
        }
        if (state === 'swingBackhand') {
            const a = 1.30 - smoothstep(0, .70, sp / contact) * 1.72 - smoothstep(contact, 1, sp) * .86;
            handR = this.worldLocal(.42 * Math.cos(a), 1.13 + baseY - knee, .54 * Math.sin(a) + .25, torsoYaw);
            handL = this.worldLocal(-.02, 1.16 + baseY - knee, .30, torsoYaw);
        }
        if (state === 'serve') {
            const toss = smoothstep(0, .43, sp), reach = smoothstep(.33, .69, sp), finish = smoothstep(.64, 1, sp);
            handL = this.worldLocal(-.26, 1.43 + baseY + toss * .74, .23 - toss * .06);
            handR = this.worldLocal(.31 - finish * .26, 1.29 + baseY + reach * .96 - finish * .48, .02 - reach * .18 + finish * .38, torsoYaw);
        }
        if (state === 'volley') {
            const punch = smoothstep(0, .64, sp);
            handR = this.worldLocal(.34, 1.18 + baseY, .15 + punch * .39, torsoYaw);
            handL = this.worldLocal(-.22, 1.20 + baseY, .18, torsoYaw);
        }
        if (state === 'celebrate') {
            handL = this.worldLocal(-.36, 1.98 + baseY, .04);
            handR = this.worldLocal(.36, 1.98 + baseY, .04);
        }
        if (state === 'reactMiss') {
            handL = this.worldLocal(-.52, .98 + baseY, .1);
            handR = this.worldLocal(.52, .98 + baseY, .1);
        }
        // Authored clip underlay: broad human performance is data-driven; procedural constraints still win later.
        handL.add(this.localVector(clip.handL.x, clip.handL.y, clip.handL.z));
        handR.add(this.localVector(clip.handR.x, clip.handR.y, clip.handR.z));
        // Ease authored social hand targets through the existing skinned rig, outside tennis and locomotion.
        if (!shot && !moving && !shuffle) {
            const hands = (g) => {
                let l = handL.clone(), r = handR.clone();
                const pulse = Math.sin(time * 4) * .025;
                if (g === 'shrug') {
                    l = this.worldLocal(-.57, 1.34 + baseY, .18);
                    r = this.worldLocal(.57, 1.34 + baseY, .18);
                }
                if (g === 'point')
                    r = this.worldLocal(.35, 1.38 + baseY, .59);
                if (g === 'think')
                    r = this.worldLocal(.17, 1.63 + baseY, .22);
                if (g === 'offer')
                    r = this.worldLocal(.24, 1.17 + baseY, .52);
                if (g === 'inspect') {
                    r = this.worldLocal(.12, 1.22 + baseY, .38);
                    l = this.worldLocal(-.12, 1.18 + baseY, .4);
                }
                if (g === 'laugh') {
                    l = this.worldLocal(-.28, 1.2 + baseY + pulse, .28);
                    r = this.worldLocal(.28, 1.2 + baseY + pulse, .28);
                }
                return [l, r];
            };
            const from = hands(this.previousGesture), to = hands(this.socialGesture), t = smoothstep(0, .24, this.gestureAge);
            handL = Vec3.lerp(from[0], to[0], t);
            handR = Vec3.lerp(from[1], to[1], t);
        }
        if (!shot && !moving && !shuffle) {
            if (this.acting.role === 'listen' && this.socialGesture === 'none') {
                handL = Vec3.lerp(handL, neutralL, .65);
                handR = Vec3.lerp(handR, neutralR, .65);
            }
            const micro = this.acting.micro, pulse = Math.sin(this.acting.clock * 3) * .035;
            if (micro === 'headband-adjust')
                handR = this.worldLocal(.26, 1.99 + baseY, .05);
            if (micro === 'string-check' || micro === 'note-tap') {
                handL = this.worldLocal(-.12, 1.15 + baseY, .33);
                handR = this.worldLocal(.12, 1.18 + baseY + pulse, .35);
            }
            if (micro === 'leaf-inspect')
                handL = this.worldLocal(-.20, 1.18 + baseY, .43);
            if (micro === 'cup-turn')
                handR = this.worldLocal(.23, 1.25 + baseY, .27 + pulse);
        }
        if (this.propKind && this.propAnchor && !shot && !moving && !shuffle) {
            const left = this.propKind === 'notebook', target = left ? handL : handR, neutral = left ? neutralL : neutralR;
            const contact = this.propWanted ? (this.propAge < .4 ? Vec3.lerp(neutral, this.propAnchor, smoothstep(0, .4, this.propAge)) : Vec3.lerp(this.propAnchor, target, smoothstep(.4, 1, this.propAge))) : Vec3.lerp(this.propRelease ?? target, this.propAnchor, smoothstep(0, .65, this.propAge));
            if (left)
                handL = contact;
            else
                handR = contact;
        }
        // Racket constraint: the hand owns the grip. At contact, solve the hand backwards from the requested sweet spot.
        const racketForward = Vec3.sub(this.outgoingTarget ?? this.worldLocal(0, 1, 2), this.position);
        racketForward.y = 0;
        if (racketForward.len() < .001)
            racketForward.set(Math.sin(this.yaw), 0, Math.cos(this.yaw));
        racketForward.normalize();
        const racketRight = new Vec3(racketForward.z, 0, -racketForward.x);
        let headOffset = Vec3.add(new Vec3(0, .34, 0), racketForward.clone().scale(.18));
        if (state === 'serve')
            headOffset = Vec3.add(new Vec3(0, .42, 0), racketForward.clone().scale(.10));
        if (state === 'volley')
            headOffset = Vec3.add(new Vec3(0, .31, 0), racketForward.clone().scale(.21));
        if (shot && this.contactTarget) {
            const w = bell(sp - contact, .11);
            const desiredHand = Vec3.sub(this.contactTarget, headOffset);
            handR = blendVec(handR, desiredHand, w);
            if (state === 'swingBackhand') {
                const secondGrip = Vec3.add(handR, racketForward.clone().scale(-.08)).add(new Vec3(0, .04, 0));
                handL = blendVec(handL, secondGrip, clamp(w * .90 + .18, 0, 1));
            }
        }
        const racketGrip = handR.clone();
        const racketHandleTop = Vec3.add(racketGrip, racketForward.clone().scale(.18)).add(new Vec3(0, .12, 0));
        const racketCenter = Vec3.add(racketGrip, headOffset);
        let racketRot = new Vec3(.02, Math.atan2(racketForward.x, racketForward.z), 0);
        if (state === 'swingForehand')
            racketRot = new Vec3(.10, torsoYaw, -.32 + sp * .68);
        else if (state === 'swingBackhand')
            racketRot = new Vec3(-.09, torsoYaw, .34 - sp * .58);
        else if (state === 'serve')
            racketRot = new Vec3(.46 - sp * .58, torsoYaw, .36 - sp * .72);
        else if (state === 'volley')
            racketRot = new Vec3(.04, torsoYaw, -.12);
        const vib = this.racketVibration * Math.sin(this.animTime * 62) * .045;
        racketRot.z += vib;
        racketRot.x += vib * .35;
        const hipHalf = this.spec.presentation === 'feminine' ? .175 : .165;
        const hipL = this.worldLocal(-hipHalf + pelvisShiftX, .76 + baseY - knee, pelvisShiftZ, hipYaw), hipR = this.worldLocal(hipHalf + pelvisShiftX, .76 + baseY - knee, pelvisShiftZ, hipYaw);
        const walkReach = (state === 'jog' ? .40 : .34) * gaitStyle.stride;
        let footL = this.worldLocal(-.17, .11 + baseY, .05 + gait * walkReach), footR = this.worldLocal(.17, .11 + baseY, .05 - gait * walkReach);
        if (moving) {
            footL = this.walkCycle.feet[0].clone();
            footR = this.walkCycle.feet[1].clone();
        }
        if (state === 'ready' || shuffle) {
            const sideMotion = clamp(this.localVelocity.x / Math.max(.01, this.courtSpeed), -1, 1), foreMotion = clamp(this.localVelocity.z / Math.max(.01, this.courtSpeed), -1, 1), lateral = shuffle ? Math.sin(this.gaitPhase) * .055 + sideMotion * .045 : 0, wide = this.courtPhase === 'split' ? .07 : 0;
            footL = this.leftFootLock && shuffle ? this.leftFootLock.clone() : this.worldLocal(-.29 - wide - lateral, .11 + baseY + splitHop, .16 + foreMotion * .07);
            footR = this.rightFootLock && shuffle ? this.rightFootLock.clone() : this.worldLocal(.29 + wide - lateral, .11 + baseY + splitHop, -.05 + foreMotion * .07);
        }
        if (shot) {
            const stance = Math.min(.16, Math.abs(outside) * .13);
            if (state === 'swingForehand') {
                footL = this.worldLocal(-.25, .11 + baseY, .12 + weightShift * .08);
                footR = this.worldLocal(.34 + stance, .11 + baseY, -.07 + weightShift * .04);
            }
            else if (state === 'swingBackhand') {
                footL = this.worldLocal(-.34 - stance, .11 + baseY, -.04 + weightShift * .05);
                footR = this.worldLocal(.25, .11 + baseY, .13 + weightShift * .08);
            }
            else if (state === 'serve') {
                footL = this.worldLocal(-.20, .11 + baseY, .14 + weightShift * .08);
                footR = this.worldLocal(.23, .11 + baseY, -.14 + weightShift * .12);
            }
            else {
                footL = this.worldLocal(-.26, .11 + baseY, .12);
                footR = this.worldLocal(.27, .11 + baseY, -.04);
            }
        }
        if (sit) {
            footL = this.worldLocal(-.22, .11, .48);
            footR = this.worldLocal(.22, .11, .48);
        }
        if (!moving && !this.leftFootLock)
            footL.add(this.localVector(-clip.stance + clip.footL.x, clip.footL.y, clip.footL.z));
        if (!moving && !this.rightFootLock)
            footR.add(this.localVector(clip.stance + clip.footR.x, clip.footR.y, clip.footR.z));
        const kneePulse = moving ? Math.max(0, -Math.cos(this.gaitPhase * 2)) * .018 : 0;
        const kneeL = Vec3.lerp(hipL, footL, .54).add(this.localVector(-.015, .04 - kneePulse, .10)), kneeR = Vec3.lerp(hipR, footR, .54).add(this.localVector(.015, .04 - kneePulse, .10));
        if (sit) {
            const l = this.worldLocal(-.22, this.seatHeight + .08, .35), r = this.worldLocal(.22, this.seatHeight + .08, .35);
            kneeL.set(l.x, l.y, l.z);
            kneeR.set(r.x, r.y, r.z);
        }
        const headStabilize = moving ? stepLift * gaitStyle.headStabilize : 0;
        const head = this.worldLocal(pelvisShiftX * .25, 1.80 + baseY + actingLift + breathe - knee + splitHop + clip.headNod - headStabilize + (!shot && !moving && (this.socialGesture === 'nod' || this.socialGesture === 'laugh') ? Math.sin(time * 6) * .022 : 0), .01 + pelvisShiftZ * .45, headYaw);
        const elbowL = Vec3.lerp(shoulderL, handL, .50).add(forward.clone().scale(.055)).add(right.clone().scale(-.035));
        const elbowR = Vec3.lerp(shoulderR, handR, .50).add(forward.clone().scale(.055)).add(right.clone().scale(.035));
        return { baseY, breathe, walking: moving, gait, torsoYaw, hipYaw, headYaw, right, forward, shoulderL, shoulderR, elbowL, elbowR, handL, handR, hipL, hipR, kneeL, kneeR, footL, footR, torsoCenter, pelvisCenter, head, racketGrip, racketHandleTop, racketCenter, racketRot, lean, knee, shot, sp, face: { ...this.facePose }, weightShift };
    }
    localVector(x, y, z) { const s = Math.sin(this.yaw), c = Math.cos(this.yaw); return new Vec3(c * x + s * z, y, -s * x + c * z); }
    blendPose(a, b, t) {
        const av = (k) => a[k], bv = (k) => b[k];
        const v = (k) => blendVec(av(k), bv(k), t);
        return { ...b, baseY: a.baseY + (b.baseY - a.baseY) * t, breathe: a.breathe + (b.breathe - a.breathe) * t, gait: a.gait + (b.gait - a.gait) * t, torsoYaw: a.torsoYaw + angleDelta(a.torsoYaw, b.torsoYaw) * t, hipYaw: a.hipYaw + angleDelta(a.hipYaw, b.hipYaw) * t, headYaw: a.headYaw + angleDelta(a.headYaw, b.headYaw) * t, right: v('right'), forward: v('forward'), shoulderL: v('shoulderL'), shoulderR: v('shoulderR'), elbowL: v('elbowL'), elbowR: v('elbowR'), handL: v('handL'), handR: v('handR'), hipL: v('hipL'), hipR: v('hipR'), kneeL: v('kneeL'), kneeR: v('kneeR'), footL: v('footL'), footR: v('footR'), torsoCenter: v('torsoCenter'), pelvisCenter: v('pelvisCenter'), head: v('head'), racketGrip: v('racketGrip'), racketHandleTop: v('racketHandleTop'), racketCenter: v('racketCenter'), racketRot: v('racketRot'), lean: a.lean + (b.lean - a.lean) * t, knee: a.knee + (b.knee - a.knee) * t, sp: a.sp + (b.sp - a.sp) * t, face: blendFace(a.face, b.face, t), weightShift: a.weightShift + (b.weightShift - a.weightShift) * t };
    }
    pose() {
        const target = this.poseFor(this.state, this.animTime);
        const t = smoothstep(0, this.transitionDuration, this.transitionAge);
        let result = target;
        if (t < .999) {
            const prior = this.exitWalkPose ?? this.poseFor(this.previousState, this.previousAnimTime + this.transitionAge * .25);
            result = this.blendPose(prior, target, t);
        }
        // A planted foot is a world-space constraint, not merely another animation channel.
        // Re-apply it after state blending so transition smoothing cannot make the shoe skate.
        if (this.state === 'walk' || this.state === 'jog' || this.state === 'shuffle') {
            if (this.leftFootLock) {
                result.footL = this.leftFootLock.clone();
                result.kneeL = Vec3.lerp(result.hipL, result.footL, .54).add(this.localVector(-.015, .04, .10));
            }
            if (this.rightFootLock) {
                result.footR = this.rightFootLock.clone();
                result.kneeR = Vec3.lerp(result.hipR, result.footR, .54).add(this.localVector(.015, .04, .10));
            }
        }
        this.lastPose = result;
        return result;
    }
    meshes(selected = false) {
        const m = [];
        const p = this.position;
        const pose = this.pose();
        const { baseY, torsoYaw, hipYaw, headYaw, right, forward, shoulderL, shoulderR, elbowL, elbowR, handL, handR, racketGrip, racketHandleTop, racketCenter, racketRot, hipL, hipR, kneeL, kneeR, footL, footR, torsoCenter, pelvisCenter, head } = pose;
        const ready = this.state === 'ready' || this.state === 'shuffle';
        const seed = this.seed();
        m.push({ kind: 'sphere', position: new Vec3(p.x, .028, p.z), scale: new Vec3(.78, .045, .50), color: '#4f5d53', alpha: .16, unlit: true });
        if (selected)
            m.push({ kind: 'torus', position: new Vec3(p.x, .055, p.z), rotation: new Vec3(Math.PI / 2, 0, 0), scale: new Vec3(1.35, 1.35, .55), color: '#e4c967', alpha: .52, unlit: true });
        const local = (v) => this.localFromWorld(v);
        const rig = { pelvis: local(pelvisCenter), spine: local(Vec3.lerp(pelvisCenter, torsoCenter, .62)), chest: local(Vec3.lerp(shoulderL, shoulderR, .5)), neck: local(Vec3.lerp(Vec3.lerp(shoulderL, shoulderR, .5), head, .58)), head: local(head), upperArmL: local(shoulderL), foreArmL: local(elbowL), handL: local(handL), upperArmR: local(shoulderR), foreArmR: local(elbowR), handR: local(handR), thighL: local(hipL), shinL: local(kneeL), footL: local(footL), thighR: local(hipR), shinR: local(kneeR), footR: local(footR), forward: new Vec3(Math.sin(torsoYaw - this.yaw), 0, Math.cos(torsoYaw - this.yaw)) };
        const bones = skinMatrices(rig);
        const skinRoot = { position: new Vec3(p.x, 0, p.z), rotation: new Vec3(0, this.yaw, 0), boneMatrices: bones };
        const torsoSkin = this.spec.presentation === 'feminine' ? CHARACTER_SKIN.feminineTop : CHARACTER_SKIN.top;
        m.push({ ...skinRoot, skin: torsoSkin, color: this.spec.shirt, material: 'fabric' }, { ...skinRoot, skin: CHARACTER_SKIN.pants, color: this.spec.avatar === 'arjan' ? '#28383c' : this.spec.outfit === 'skirt' || this.spec.outfit === 'skort' ? mixHex(this.spec.shirt, '#5d665f', .18) : '#625f59', material: 'fabric' }, { ...skinRoot, skin: CHARACTER_SKIN.arms, color: this.spec.skin, material: 'skin' });
        m.push({ kind: 'roundBox', position: torsoCenter.clone().add(new Vec3(0, .025, 0)), rotation: new Vec3(0, torsoYaw, 0), scale: new Vec3(this.spec.presentation === 'feminine' ? .65 : .70, .66, .46), color: this.spec.shirt, material: 'fabric' });
        for (const elbow of [elbowL, elbowR])
            m.push({ kind: 'sphere', position: elbow, scale: new Vec3(.25, .25, .24), color: this.spec.skin, material: 'skin' });
        for (const shoulder of [shoulderL, shoulderR])
            m.push({ kind: 'sphere', position: Vec3.lerp(shoulder, Vec3.lerp(shoulderL, shoulderR, .5), .25).add(new Vec3(0, -.035, 0)), scale: new Vec3(.34, .34, .34), color: this.spec.shirt, material: 'fabric' });
        const leftShoePitch = pose.walking && !this.leftFootLock ? clamp(-pose.gait * .18, -.18, .18) : 0, rightShoePitch = pose.walking && !this.rightFootLock ? clamp(pose.gait * .18, -.18, .18) : 0;
        const leftShoeYaw = pose.walking ? this.walkCycle.yaws[0] : this.yaw, rightShoeYaw = pose.walking ? this.walkCycle.yaws[1] : this.yaw;
        const shoeColor = this.spec.shoe ?? '#fff8ee', soleColor = mixHex(shoeColor, '#ffffff', .62);
        m.push({ kind: 'roundBox', position: footL, rotation: new Vec3(leftShoePitch, leftShoeYaw, 0), scale: new Vec3(.29, .135, .43), color: shoeColor, material: 'fabric' }, { kind: 'roundBox', position: footR, rotation: new Vec3(rightShoePitch, rightShoeYaw, 0), scale: new Vec3(.29, .135, .43), color: shoeColor, material: 'fabric' });
        m.push({ kind: 'roundBox', position: new Vec3(footL.x, footL.y - .055, footL.z), rotation: new Vec3(leftShoePitch, leftShoeYaw, 0), scale: new Vec3(.30, .055, .445), color: soleColor, material: 'fabric' }, { kind: 'roundBox', position: new Vec3(footR.x, footR.y - .055, footR.z), rotation: new Vec3(rightShoePitch, rightShoeYaw, 0), scale: new Vec3(.30, .055, .445), color: soleColor, material: 'fabric' });
        m.push({ kind: 'roundBox', position: this.worldLocal(0, 1.43 + baseY + pose.breathe - pose.knee, .20, torsoYaw), rotation: new Vec3(0, torsoYaw, 0), scale: new Vec3(.24, .08, .05), color: this.spec.accent ?? '#efe7d9', material: 'fabric' });
        m.push({ kind: 'sphere', position: handL, scale: new Vec3(.22, .24, .18), color: this.spec.skin, material: 'skin' }, { kind: 'sphere', position: handR, scale: new Vec3(.22, .24, .18), color: this.spec.skin, material: 'skin' });
        for (const [hand, side] of [[handL, -1], [handR, 1]])
            m.push({ kind: 'sphere', position: Vec3.add(hand, this.localVector(-side * .075, .025, .045)), scale: new Vec3(.095, .12, .10), color: this.spec.skin, material: 'skin' });
        const headStart = m.length;
        const faceShape = this.spec.id === 'mika' ? new Vec3(.565, .600, .530) : this.spec.id === 'coach' ? new Vec3(.545, .590, .520) : this.spec.id === 'nia' ? new Vec3(.570, .585, .535) : new Vec3(.550, .595, .525);
        m.push({ kind: 'sphere', position: head, scale: faceShape, color: this.spec.skin, material: 'skin' });
        // A tiny neck bridge and outfit silhouette make the skinned body read as one soft adult figure rather than stacked primitives.
        const neck = Vec3.lerp(Vec3.lerp(shoulderL, shoulderR, .5), head, .30);
        m.push({ kind: 'cylinder', position: neck, scale: new Vec3(.18, .25, .18), color: this.spec.skin, material: 'skin' });
        if (this.spec.outfit === 'skirt' || this.spec.outfit === 'skort' || this.spec.outfit === 'host') {
            const skirtY = pelvisCenter.y + .02;
            const skirtColor = this.spec.outfit === 'host' ? mixHex(this.spec.shirt, '#f1e5d7', .12) : mixHex(this.spec.shirt, '#ffffff', .08);
            m.push({ kind: 'cone', position: new Vec3(pelvisCenter.x, skirtY, pelvisCenter.z), rotation: new Vec3(0, hipYaw, Math.sin(this.animTime * 2.0 + seed) * .008), scale: new Vec3(this.spec.outfit === 'host' ? .58 : .54, this.spec.outfit === 'host' ? .38 : .32, this.spec.outfit === 'host' ? .58 : .54), color: skirtColor, material: 'fabric' });
            m.push({ kind: 'roundBox', position: new Vec3(pelvisCenter.x, pelvisCenter.y + .14, pelvisCenter.z), rotation: new Vec3(0, hipYaw, 0), scale: new Vec3(.49, .10, .36), color: mixHex(skirtColor, '#ffffff', .12), material: 'fabric' });
        }
        // Boutique outfit details: bright collar, socks and a tiny club badge improve readability without texture assets.
        const collar = Vec3.lerp(torsoCenter, Vec3.lerp(shoulderL, shoulderR, .5), .72);
        m.push({ kind: 'torus', position: collar, rotation: new Vec3(Math.PI / 2, torsoYaw, 0), scale: new Vec3(.42, .34, .08), color: this.spec.accent ?? '#fff0d7', material: 'fabric', alpha: .86 });
        const sockColor = mixHex(this.spec.shoe ?? '#fffaf0', '#ffffff', .35);
        for (const f of [footL, footR])
            m.push({ kind: 'cylinder', position: new Vec3(f.x, f.y + .16, f.z - .035), rotation: new Vec3(0, this.yaw, 0), scale: new Vec3(.145, .18, .145), color: sockColor, material: 'fabric' });
        const badge = this.worldLocal(.18, 1.42 + baseY + pose.breathe - pose.knee, .195, torsoYaw);
        m.push({ kind: 'sphere', position: badge, scale: new Vec3(.055, .055, .025), color: this.spec.accent ?? '#fff0d7', material: 'ceramic', unlit: true });
        const faceDetailsStart = m.length;
        m.push({ kind: 'sphere', position: Vec3.add(head, right.clone().scale(-.255)), scale: new Vec3(.085, .125, .075), color: this.spec.skin, material: 'skin' }, { kind: 'sphere', position: Vec3.add(head, right.clone().scale(.255)), scale: new Vec3(.085, .125, .075), color: this.spec.skin, material: 'skin' });
        const hairStyle = this.spec.hairStyle ?? 'cap';
        const hairSway = clamp(angleDelta(this.yaw, this.targetYaw), -.35, .35) * .12 + Math.sin(this.animTime * 7 + seed) * Math.min(.025, this.horizontalSpeed * .008);
        const hair = (position, scale, alpha = 1) => m.push({ kind: 'sphere', position, scale, color: this.spec.hair, material: 'hair', alpha });
        if (hairStyle === 'long') {
            hair(Vec3.add(head, new Vec3(0, .17, 0)), new Vec3(.58, .34, .54));
            hair(Vec3.add(head, forward.clone().scale(-.20)).add(new Vec3(0, -.27, 0)), new Vec3(.53, .74, .25));
            for (const side of [-1, 1])
                hair(Vec3.add(head, right.clone().scale(side * .255)).add(forward.clone().scale(.015)).add(new Vec3(0, -.19, 0)), new Vec3(.17, .66, .20));
            // Navy-and-gold cat-ear headband; the face remains human.
            for (const side of [-1, 1]) {
                const ear = Vec3.add(head, right.clone().scale(side * .22)).add(new Vec3(0, .43, 0));
                m.push({ kind: 'cone', position: ear, rotation: new Vec3(0, headYaw, side * -.18), scale: new Vec3(.22, .34, .15), color: '#172a49', material: 'fabric' }, { kind: 'cone', position: Vec3.add(ear, forward.clone().scale(.055)), rotation: new Vec3(0, headYaw, side * -.18), scale: new Vec3(.115, .20, .04), color: '#dfbb50', material: 'metal' });
            }
        }
        else if (hairStyle === 'swept') {
            hair(Vec3.add(head, new Vec3(0, .16, 0)), new Vec3(.58, .35, .54));
            for (let i = 0; i < 5; i++) {
                const tuft = Vec3.add(head, right.clone().scale(-.22 + i * .10)).add(forward.clone().scale(.06)).add(new Vec3(0, .26 + Math.sin(i * .7) * .045, 0));
                hair(tuft, new Vec3(.23, .24, .33));
            }
            hair(Vec3.add(head, right.clone().scale(-.23)).add(forward.clone().scale(.14)).add(new Vec3(0, .14, 0)), new Vec3(.15, .28, .15));
        }
        else if (hairStyle === 'bun') {
            hair(new Vec3(head.x, head.y + .18, head.z - .035), new Vec3(.555, .33, .525));
            hair(Vec3.add(head, forward.clone().scale(-.21)).add(right.clone().scale(-hairSway)).add(new Vec3(0, .22, 0)), new Vec3(.245, .245, .245));
            hair(Vec3.add(head, right.clone().scale(-.28)).add(forward.clone().scale(.02)).add(new Vec3(0, .07, 0)), new Vec3(.12, .22, .12), .94);
        }
        else if (hairStyle === 'ponytail') {
            hair(new Vec3(head.x, head.y + .16, head.z - .03), new Vec3(.555, .32, .525));
            const tie = Vec3.add(head, forward.clone().scale(-.21)).add(new Vec3(0, .10, 0));
            m.push({ kind: 'torus', position: tie, rotation: new Vec3(Math.PI / 2, this.yaw, 0), scale: new Vec3(.18, .18, .10), color: this.spec.accent ?? '#ead2bd', material: 'fabric' });
            const tailBase = Vec3.add(tie, forward.clone().scale(-.11)).add(right.clone().scale(-hairSway * .75));
            hair(tailBase.add(new Vec3(0, -.10, 0)), new Vec3(.18, .34, .16));
            hair(Vec3.add(tailBase, new Vec3(0, -.34, 0)).add(right.clone().scale(-hairSway)), new Vec3(.14, .28, .13), .95);
        }
        else if (hairStyle === 'bob') {
            hair(new Vec3(head.x, head.y + .14, head.z - .03), new Vec3(.565, .36, .535));
            for (const side of [-1, 1])
                hair(Vec3.add(head, right.clone().scale(side * .31)).add(new Vec3(0, -.08, 0)), new Vec3(.17, .35, .15), .98);
            hair(Vec3.add(head, forward.clone().scale(-.19)).add(new Vec3(0, -.13, 0)), new Vec3(.39, .30, .18), .96);
        }
        else if (hairStyle === 'waves') {
            hair(new Vec3(head.x, head.y + .13, head.z - .03), new Vec3(.565, .37, .535));
            for (const side of [-1, 1]) {
                hair(Vec3.add(head, right.clone().scale(side * .28)).add(new Vec3(0, -.02, 0)), new Vec3(.18, .33, .16), .96);
                hair(Vec3.add(head, right.clone().scale(side * .30)).add(new Vec3(0, -.30, 0)), new Vec3(.14, .28, .13), .92);
            }
        }
        else if (hairStyle === 'crop') {
            hair(new Vec3(head.x, head.y + .20, head.z - .02), new Vec3(.54, .26, .51));
        }
        else
            hair(new Vec3(head.x, head.y + .17, head.z - .015), new Vec3(.55, .31, .525));
        // Small sheen patch gives hair a soft illustrated highlight rather than a plastic gloss.
        hair(Vec3.add(head, right.clone().scale(-.12)).add(forward.clone().scale(.11)).add(new Vec3(0, .24, 0)), new Vec3(.16, .060, .11), .16);
        // Face: sclera + pupils + independently posed brows + cheeks + two-corner mouth give us cheap but readable deformation.
        const blinkPhase = (this.animTime + seed * .113) % 3.75, blink = blinkPhase < .085 ? 1 - smoothstep(0, .085, blinkPhase) : 0;
        let gaze = 0;
        if (this.targetLook) {
            const aim = Math.atan2(this.targetLook.x - p.x, this.targetLook.z - p.z) - headYaw;
            gaze = clamp(aim, -.22, .22) * .12;
        }
        const eyeOpen = clamp(1 - blink - pose.face.squint * .55, .08, 1);
        const eyeSpacing = this.spec.id === 'mika' ? .112 : this.spec.id === 'nia' ? .106 : this.spec.id === 'coach' ? .102 : .108;
        for (const sideEye of [-1, 1]) {
            const ep = Vec3.add(head, forward.clone().scale(.224)).add(right.clone().scale(sideEye * eyeSpacing));
            ep.y += .032;
            m.push({ kind: 'sphere', position: ep, scale: new Vec3(.108, .088 * eyeOpen, .038), color: '#fffdf7', material: 'ceramic', unlit: true });
            const pupil = Vec3.add(ep, forward.clone().scale(.018)).add(right.clone().scale(gaze));
            m.push({ kind: 'sphere', position: pupil, scale: new Vec3(.053, .063 * eyeOpen, .023), color: mixHex(this.spec.eye ?? '#34483f', '#17271f', .55), material: 'hair', unlit: true });
            const sparkle = Vec3.add(pupil, forward.clone().scale(.012)).add(right.clone().scale(-sideEye * .008));
            sparkle.y += .010;
            m.push({ kind: 'sphere', position: sparkle, scale: new Vec3(.010, .010, .008), color: '#ffffff', unlit: true });
            const brow = Vec3.add(ep, new Vec3(0, .102 + pose.face.browRaise * .045, 0)).add(right.clone().scale(sideEye * .005));
            m.push({ kind: 'roundBox', position: brow, rotation: new Vec3(0, headYaw, sideEye * (-.02 - pose.face.smile * .09)), scale: new Vec3(this.spec.avatar === 'arjan' ? .115 : .090, this.spec.avatar === 'arjan' ? .035 : .018, .015), color: this.spec.hair, material: 'hair', unlit: true });
        }
        const nose = Vec3.add(head, forward.clone().scale(.254));
        nose.y -= .040;
        m.push({ kind: 'sphere', position: nose, scale: new Vec3(.035, .050, .032), color: mixHex(this.spec.skin, '#86594f', .20), material: 'skin' });
        const cheekY = head.y - .075;
        for (const s of [-1, 1]) {
            const cp = Vec3.add(head, forward.clone().scale(.215)).add(right.clone().scale(s * .15));
            cp.y = cheekY;
            m.push({ kind: 'sphere', position: cp, scale: new Vec3(.060, .034, .018), color: mixHex(this.spec.skin, '#dd8e91', .42), alpha: .14 + .10 * Math.max(0, pose.face.smile), unlit: true });
        }
        const mouthBase = Vec3.add(head, forward.clone().scale(.250));
        mouthBase.y -= .135;
        const width = .085 + .035 * Math.max(0, pose.face.smile), cornerLift = pose.face.smile * .045;
        for (const s of [-1, 1]) {
            const corner = Vec3.add(mouthBase, right.clone().scale(s * width));
            corner.y += cornerLift;
            m.push({ kind: 'sphere', position: corner, scale: new Vec3(.026, .020, .016), color: mixHex(this.spec.skin, '#6c3f46', .48), unlit: true });
        }
        m.push({ kind: 'roundBox', position: new Vec3(mouthBase.x, mouthBase.y + cornerLift * .5, mouthBase.z), rotation: new Vec3(0, headYaw, 0), scale: new Vec3(width * 1.7, .018 + .055 * pose.face.mouthOpen, .020), color: pose.face.mouthOpen > .18 ? '#5b3d43' : mixHex(this.spec.skin, '#6c3f46', .48), unlit: true });
        if (this.spec.presentation === 'feminine') {
            for (const sideEye of [-1, 1]) {
                const lash = Vec3.add(head, forward.clone().scale(.229)).add(right.clone().scale(sideEye * .156));
                lash.y += .066;
                m.push({ kind: 'roundBox', position: lash, rotation: new Vec3(0, headYaw, sideEye * -.08), scale: new Vec3(.038, .010, .008), color: this.spec.hair, unlit: true });
            }
            if (this.spec.id === 'mika') {
                const band = Vec3.add(head, new Vec3(0, .245, 0));
                m.push({ kind: 'torus', position: band, rotation: new Vec3(Math.PI / 2, headYaw, 0), scale: new Vec3(.64, .65, .09), color: this.spec.accent ?? '#efd7bb', material: 'fabric', alpha: .86 });
            }
        }
        // Scale the existing face/hair together, retaining identity and the skeletal contact rig.
        const tilt = this.majorActivity ? 0 : this.acting.values.headTilt + (this.acting.reaction?.tilt ?? 0) * this.acting.reactionWeight;
        for (const item of [m[headStart], ...m.slice(faceDetailsStart)]) {
            if ('skin' in item)
                continue;
            const offset = Vec3.sub(item.position, head), x = Vec3.dot(offset, right), y = offset.y;
            item.position.add(right.clone().scale((x * Math.cos(tilt) - y * Math.sin(tilt) - x))).add(new Vec3(0, x * Math.sin(tilt) + y * Math.cos(tilt) - y, 0));
            item.position = Vec3.add(head, Vec3.sub(item.position, head).scale(1.10));
            item.scale.scale(1.10);
        }
        if (this.spec.avatar) {
            const charm = this.worldLocal(0, 1.28 + baseY + pose.breathe - pose.knee, .235, torsoYaw);
            m.push({ kind: 'torus', position: Vec3.add(charm, new Vec3(0, .07, 0)), rotation: new Vec3(.3, torsoYaw, 0), scale: new Vec3(.28, .20, .025), color: this.spec.avatar === 'taylor' ? '#dbb447' : '#c6c6bd', material: 'metal' });
            if (this.spec.avatar === 'taylor')
                m.push({ kind: 'sphere', position: charm, scale: new Vec3(.10, .12, .035), color: '#50b8b4', material: 'ceramic' });
        }
        if (this.spec.id !== 'nia' && (pose.shot || this.state === 'ready' || this.state === 'shuffle' || this.socialGesture === 'inspect' && !this.racketStowed) && !this.racketStowed && this.state !== 'drink' && !this.propKind) {
            m.push(this.limb(racketGrip, racketHandleTop, .045, '#705747'));
            m.push({ kind: 'torus', position: racketCenter, rotation: racketRot, scale: new Vec3(.86, 1.08, .58), color: this.spec.accent ?? '#e0c474', material: 'metal' });
            m.push({ kind: 'torus', position: racketCenter, rotation: racketRot, scale: new Vec3(.62, .79, .42), color: '#ece6d7', material: 'metal', alpha: .52, unlit: true });
            // A tiny butt cap makes the hand-to-racket constraint visually obvious at close zoom.
            m.push({ kind: 'cylinder', position: racketGrip, rotation: new Vec3(Math.PI / 2, this.yaw, 0), scale: new Vec3(.075, .10, .075), color: '#44372f', material: 'fabric' });
        }
        const propHandR = this.propKind && this.propWanted && this.propAge < .4 && this.propAnchor ? this.propAnchor : handR, propHandL = this.propKind && this.propWanted && this.propAge < .4 && this.propAnchor ? this.propAnchor : handL;
        if (this.propKind === 'wateringCan') {
            const can = Vec3.add(propHandR, new Vec3(0, .015, .1));
            m.push({ kind: 'cylinder', position: can, scale: new Vec3(.24, .25, .24), color: '#769c92', material: 'metal' }, { kind: 'cone', position: Vec3.add(can, this.localVector(0, .02, .17)), rotation: new Vec3(.95, this.yaw, 0), scale: new Vec3(.08, .27, .08), color: '#769c92', material: 'metal' });
        }
        if (this.propKind === 'notebook')
            m.push({ kind: 'roundBox', position: Vec3.add(propHandL, new Vec3(0, .035, .08)), rotation: new Vec3(.25, this.yaw, 0), scale: new Vec3(.29, .045, .36), color: '#f2e4be', material: 'fabric' });
        if (this.propKind === 'ball')
            m.push({ kind: 'sphere', position: Vec3.add(propHandR, new Vec3(0, .08, 0)), scale: new Vec3(.13, .13, .13), color: '#d7dc79' });
        if (this.state === 'drink' || this.propKind === 'cup') {
            const cup = Vec3.add(propHandR, new Vec3(0, .05, 0));
            m.push({ kind: 'cylinder', position: cup, scale: new Vec3(.16, .28, .16), color: '#f0e8d8', material: 'ceramic' });
            for (let i = 0; i < 2; i++) {
                const ph = (this.animTime * .55 + i * .43) % 1;
                m.push({ kind: 'sphere', position: new Vec3(cup.x + Math.sin(this.animTime * 2 + i) * .025, cup.y + .19 + ph * .24, cup.z), scale: new Vec3(.035, .07, .035), color: '#f6f1e8', alpha: .18 * (1 - ph), unlit: true });
            }
        }
        return m;
    }
}
