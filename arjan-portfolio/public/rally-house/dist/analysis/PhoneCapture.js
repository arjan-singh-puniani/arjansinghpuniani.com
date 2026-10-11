import { Vec3 } from '../rendering/Math3D.js';
import { captureFrame } from './MotionCapture.js';
import { PHONE_ANCHOR, PHONE_MARK } from '../world/PerformanceStation.js';
export { PHONE_ANCHOR, PHONE_MARK } from '../world/PerformanceStation.js';
/** A single phone belongs either to the selected avatar's hand or to its anchor. */
export function phoneMeshes(position, recording = false) {
    const p = (x, y, z) => position.clone().add(new Vec3(x, y, z));
    return [
        { kind: 'roundBox', position: p(0, 0, 0), scale: new Vec3(.255, .465, .038), color: '#273634', material: 'metal' },
        { kind: 'roundBox', position: p(0, 0, .021), scale: new Vec3(.224, .414, .008), color: '#173438', material: 'glass' },
        { kind: 'roundBox', position: p(0, .15, .027), scale: new Vec3(.14, .025, .004), color: '#9cd7c5', unlit: true },
        { kind: 'roundBox', position: p(-.04, -.005, .027), scale: new Vec3(.055, .14, .004), color: '#92ccb8', unlit: true },
        { kind: 'roundBox', position: p(.045, -.005, .027), scale: new Vec3(.055, .14, .004), color: '#e3c88f', unlit: true },
        { kind: 'sphere', position: p(.088, .185, .027), scale: new Vec3(.026, .026, .006), color: recording ? '#fa6b51' : '#17201f', unlit: true },
        { kind: 'roundBox', position: p(0, -.176, .027), scale: new Vec3(.075, .008, .004), color: '#d1ded0', unlit: true },
    ];
}
/** Local canvas video and pose samples share the real rendered avatar; no camera CV is implied. */
export class PhoneCapture {
    camera;
    canvas;
    active = false;
    mounted = false;
    phase = 'mounting';
    last = null;
    layer = document.createElement('section');
    title = document.createElement('h2');
    status = document.createElement('p');
    clock = document.createElement('output');
    actor = null;
    prior = null;
    priorAspect = 0;
    age = 0;
    recordStart = 0;
    lastSample = -1;
    strokeStarted = false;
    recoveryStarted = false;
    clip = null;
    recorder = null;
    stream = null;
    chunks = [];
    mime = '';
    generation = 0;
    onComplete = () => { };
    onCancel = () => { };
    constructor(camera, canvas) {
        this.camera = camera;
        this.canvas = canvas;
        this.layer.className = 'phone-capture';
        this.layer.hidden = true;
        this.layer.dataset.worldUi = 'true';
        this.layer.setAttribute('aria-label', 'Anchored phone capture');
        const header = document.createElement('header'), identity = document.createElement('div'), brand = document.createElement('small'), owner = document.createElement('p'), cancel = document.createElement('button');
        brand.textContent = 'RALLY HOUSE · VECTORCOURT · ANATOMYMOTION';
        owner.textContent = 'Three apps by Arjan Singh Puniani';
        identity.append(brand, owner);
        cancel.textContent = 'Cancel capture';
        cancel.onclick = () => this.cancel();
        header.append(identity, cancel);
        const panel = document.createElement('aside');
        panel.append(this.title, this.status, this.clock);
        const note = document.createElement('p');
        note.className = 'phone-source';
        note.textContent = 'In-game phone video · local to this tab · analysis uses the same game motion';
        panel.append(note);
        this.layer.append(header, panel);
        for (const event of ['pointerdown', 'pointerup', 'pointermove', 'wheel', 'keydown', 'keyup'])
            this.layer.addEventListener(event, e => { e.stopPropagation(); if (event === 'keydown' && e.key === 'Escape')
                this.cancel(); });
        document.getElementById('app').append(this.layer);
    }
    open(actor) {
        if (this.active)
            return;
        this.generation++;
        this.actor = actor;
        this.prior = this.camera.captureState();
        this.priorAspect = this.camera.aspect;
        this.active = true;
        this.phase = this.mounted ? 'step-back' : 'mounting';
        this.age = 0;
        this.strokeStarted = this.recoveryStarted = false;
        actor.path = [];
        actor.setAnimation('watch');
        actor.acting.setRole('none');
        actor.majorActivity = true;
        actor.racketStowed = true;
        actor.socialGesture = 'none';
        actor.socialProp = null;
        actor.face(PHONE_ANCHOR);
        actor.setLook(PHONE_ANCHOR);
        actor.setInteractionTarget(this.mounted ? undefined : PHONE_ANCHOR);
        if (this.mounted)
            actor.goTo(PHONE_MARK, 'watch');
        this.layer.hidden = false;
        document.body.classList.add('phone-active');
        this.layer.querySelector('button').focus({ preventScroll: true });
        this.refresh();
    }
    move(phase) { this.phase = phase; this.age = 0; this.refresh(); }
    update(dt) {
        const c = this.actor;
        if (!this.active || !c || !Number.isFinite(dt) || dt <= 0)
            return;
        this.age += dt;
        c.majorActivity = true;
        if (this.phase === 'mounting' && this.age >= 1.35) {
            const distance = Vec3.sub(c.analysisPose().handR, PHONE_ANCHOR).len();
            if (distance > .06) {
                if (this.age > 4)
                    this.cancel();
                return;
            }
            this.mounted = true;
            c.setInteractionTarget(undefined);
            c.setLook(undefined);
            c.goTo(PHONE_MARK, 'watch');
            this.move('step-back');
        }
        else if (this.phase === 'step-back') {
            if (c.pathIndex >= c.path.length && Vec3.sub(c.position, PHONE_MARK).len() < .18) {
                c.face(PHONE_ANCHOR);
                c.setLook(PHONE_ANCHOR);
                c.setAnimation('watch');
                this.move('countdown');
            }
            else if (this.age > 14)
                this.cancel();
        }
        else if (this.phase === 'countdown' && this.age >= 3) {
            this.move('recording');
            this.beginVideo();
            c.racketStowed = false;
            c.goTo(PHONE_MARK.clone().add(new Vec3(.45, 0, 0)), 'ready');
        }
        else if (this.phase === 'recording') {
            if (this.age >= 1.35 && !this.strokeStarted) {
                c.path = [];
                c.face(PHONE_ANCHOR);
                c.triggerShot('swingForehand', new Vec3(-3.8, .09, -7));
                this.strokeStarted = true;
            }
            if (this.age >= 3.2 && !this.recoveryStarted) {
                c.clearShotIntent();
                c.goTo(PHONE_MARK, 'watch');
                this.recoveryStarted = true;
            }
            if (this.age >= 5.4) {
                this.move('finishing');
                this.finishVideo();
            }
        }
        if (this.active)
            c.update(dt);
        this.refresh();
    }
    frameCamera(reducedMotion) {
        if (!this.active)
            return;
        const phone = ['countdown', 'recording', 'finishing'].includes(this.phase), target = phone ? PHONE_MARK.clone().add(new Vec3(.22, 1.3, 0)) : new Vec3(-3.9, 1.05, -7.55);
        this.camera.autoFrame = false;
        if (phone) {
            const eye = PHONE_ANCHOR.clone().add(new Vec3(0, 0, .04)), delta = Vec3.sub(eye, target), distance = delta.len();
            this.camera.fov = 2 * Math.atan(Math.max(1.65, 1.55 / this.camera.aspect) / distance);
            this.camera.desiredTarget = target;
            this.camera.desiredDistance = distance;
            this.camera.desiredAzimuth = Math.atan2(delta.x, delta.z);
            this.camera.desiredElevation = Math.asin(delta.y / distance);
        }
        else {
            this.camera.fov = (this.camera.aspect < .9 ? 65 : 40) * Math.PI / 180;
            this.camera.desiredTarget = target;
            this.camera.desiredDistance = 6.8;
            this.camera.desiredAzimuth = -1.75;
            this.camera.desiredElevation = .24;
        }
        if (reducedMotion || this.phase === 'recording' || this.phase === 'finishing') {
            this.camera.target = target.clone();
            this.camera.distance = this.camera.desiredDistance;
            this.camera.azimuth = this.camera.desiredAzimuth;
            this.camera.elevation = this.camera.desiredElevation;
            this.camera.pin();
            this.camera.update(0);
        }
    }
    afterRender() {
        if (!this.active || this.phase !== 'recording' || !this.actor || !this.clip)
            return;
        const time = (performance.now() - this.recordStart) / 1000;
        if (time - this.lastSample < 1 / 35)
            return;
        this.lastSample = time;
        if (this.clip.frames.length < 360)
            this.clip.frames.push(captureFrame(this.actor, time, null));
    }
    beginVideo() {
        this.releaseLast();
        this.clip = { name: `${this.actor.spec.name} · anchored phone recording`, kind: 'phone', source: 'phone-recording', frames: [] };
        this.lastSample = -1;
        this.recordStart = performance.now();
        this.chunks = [];
        this.mime = '';
        if (typeof MediaRecorder === 'undefined' || typeof this.canvas.captureStream !== 'function')
            return;
        try {
            this.stream = this.canvas.captureStream(30);
            const candidates = ['video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
            this.mime = candidates.find(t => MediaRecorder.isTypeSupported(t)) ?? '';
            const recorder = new MediaRecorder(this.stream, this.mime ? { mimeType: this.mime, videoBitsPerSecond: 1800000 } : undefined);
            this.recorder = recorder;
            this.mime = recorder.mimeType;
            const generation = this.generation;
            recorder.ondataavailable = e => { if (generation === this.generation && e.data.size)
                this.chunks.push(e.data); };
            recorder.onstop = () => { if (generation !== this.generation)
                return; this.stopTracks(); if (this.active)
                this.complete(); };
            recorder.onerror = () => { if (generation === this.generation) {
                this.chunks = [];
                this.recorder = null;
                this.stopTracks();
                if (this.phase === 'finishing')
                    this.complete();
            } };
            recorder.start();
        }
        catch {
            this.recorder = null;
            this.stopTracks();
        }
    }
    finishVideo() { if (this.recorder?.state === 'recording')
        this.recorder.stop();
    else
        this.complete(); }
    complete() {
        if (!this.clip || this.clip.frames.length < 3) {
            this.cancel();
            return;
        }
        const blob = this.chunks.length ? new Blob(this.chunks, { type: this.mime }) : null;
        this.last = { clip: this.clip, url: blob && blob.size ? URL.createObjectURL(blob) : null, mime: this.mime };
        this.clip = null;
        this.recorder = null;
        this.chunks = [];
        this.leave();
        this.onComplete();
    }
    stopTracks() { this.stream?.getTracks().forEach(t => t.stop()); this.stream = null; }
    leave() {
        this.active = false;
        this.layer.hidden = true;
        document.body.classList.remove('phone-active');
        if (this.actor) {
            this.actor.setInteractionTarget(undefined);
            this.actor.setLook(undefined);
            this.actor.clearShotIntent();
            this.actor.path = [];
            this.actor.setAnimation('idle');
            this.actor.racketStowed = true;
            this.actor.majorActivity = false;
        }
        if (this.prior) {
            this.camera.restoreState(this.prior);
            if (this.camera.aspect !== this.priorAspect) {
                const a = this.camera.aspect;
                this.camera.aspect = 0;
                this.camera.setAspect(a);
                this.camera.update(0);
            }
        }
        this.prior = null;
        this.canvas.focus({ preventScroll: true });
    }
    cancel() {
        if (!this.active)
            return;
        this.generation++;
        if (this.recorder?.state === 'recording')
            this.recorder.stop();
        this.recorder = null;
        this.stopTracks();
        this.chunks = [];
        this.clip = null;
        this.leave();
        this.onCancel();
    }
    key(e) { if (e.key === 'Escape') {
        e.preventDefault();
        this.cancel();
    } }
    meshes() {
        if (this.active && this.phase === 'mounting' && this.actor)
            return phoneMeshes(this.actor.analysisPose().handR);
        return this.mounted ? phoneMeshes(PHONE_ANCHOR, this.active && this.phase === 'recording') : [];
    }
    refresh() {
        const name = this.actor?.spec.name ?? 'Your avatar';
        const titles = { mounting: `${name} seats the phone`, 'step-back': 'Step into the frame', countdown: 'Ready when you are', recording: 'Recording your movement', finishing: 'Open your apps' };
        const details = { mounting: 'One post-mounted clamp. A stable camera, without a tripod.', 'step-back': 'The phone stays anchored while you move.', countdown: 'Side-step, forehand, recover.', recording: 'VectorCourt · court movement   /   AnatomyMotion · body movement', finishing: 'Keeping the video and movement together.' };
        this.title.textContent = titles[this.phase];
        this.status.textContent = details[this.phase];
        this.clock.textContent = this.phase === 'countdown' ? String(Math.max(1, Math.ceil(3 - this.age))) : this.phase === 'recording' ? `● REC ${this.age.toFixed(1)}s` : '';
    }
    report() { return { active: this.active, phase: this.phase, mounted: this.mounted, avatar: this.actor?.spec.avatar, samples: this.last?.clip.frames.length ?? this.clip?.frames.length ?? 0, video: !!this.last?.url, liveTracks: this.stream?.getTracks().filter(t => t.readyState === 'live').length ?? 0, anchor: { ...PHONE_ANCHOR } }; }
    releaseLast() { if (this.last?.url)
        URL.revokeObjectURL(this.last.url); this.last = null; }
    dispose() { this.cancel(); this.releaseLast(); this.layer.remove(); }
}
