import { Vec3, clamp } from '../rendering/Math3D.js';
import { demonstration } from './LabDemonstrations.js';
import { ReplayTimeline, FOCUS_KEYS, JOINT_KEYS, LIMBS, METRIC_NAMES, jointTriplet, value, summary } from './MotionCapture.js';
const svgNS = 'http://www.w3.org/2000/svg';
const format = (v, digits = 0) => v === null || !Number.isFinite(v) ? '—' : v.toFixed(digits);
// Court surface is .07; markings start at .072 and end at .098.
// Coverage sits above the floor and below the markings; paths sit above both.
export const COURT_OVERLAY = { coverage: .076, path: .115 };
export function rod(a, b, color, width = .018, alpha = 1) {
    const d = Vec3.sub(b, a), len = d.len();
    return { kind: 'roundBox', position: Vec3.lerp(a, b, .5), rotation: new Vec3(Math.acos(clamp(d.y / Math.max(1e-6, len), -1, 1)), Math.atan2(d.x, d.z), 0), scale: new Vec3(width, len, width), color, alpha, unlit: true, noShadow: true };
}
/** One replay owner drives the avatar, skeleton, ball, trail, plot and numerical readout. */
export class PerformanceLab {
    camera;
    canvas;
    active = false;
    layer = document.createElement('section');
    panel = document.createElement('aside');
    heading = document.createElement('h2');
    provenance = document.createElement('p');
    transport = document.createElement('div');
    play = document.createElement('button');
    scrub = document.createElement('input');
    timeLabel = document.createElement('output');
    readout = document.createElement('output');
    stats = document.createElement('p');
    source = document.createElement('select');
    plot = document.createElementNS(svgNS, 'svg');
    plotPath = document.createElementNS(svgNS, 'path');
    plotMarker = document.createElementNS(svgNS, 'line');
    plotTitle = document.createElement('p');
    phase = document.createElement('p');
    lens = document.createElement('button');
    separation = document.createElement('button');
    timer = 0;
    renderKey = '';
    cached = [];
    clips = new Map();
    prior = null;
    timeline = null;
    contactLens = true;
    separateRig = false;
    restoreFocus = null;
    lastAspect = 0;
    priorAspect = 0;
    onReturn = () => { };
    constructor(camera, canvas) {
        this.camera = camera;
        this.canvas = canvas;
        this.layer.className = 'performance-lab';
        this.layer.dataset.worldUi = 'true';
        this.layer.hidden = true;
        this.layer.setAttribute('aria-label', 'Performance Lab replay');
        const header = document.createElement('header'), identity = document.createElement('div'), brand = document.createElement('span'), close = document.createElement('button');
        brand.textContent = 'RALLY HOUSE / PERFORMANCE LAB';
        const sub = document.createElement('small');
        sub.textContent = 'Court space ↔ body space';
        identity.append(brand, sub);
        close.textContent = 'Return to club ↗';
        close.dataset.labAction = 'close';
        close.onclick = () => this.close();
        header.append(identity, close);
        this.panel.className = 'lab-panel';
        this.panel.setAttribute('aria-labelledby', 'labTitle');
        this.heading.id = 'labTitle';
        this.heading.textContent = 'See the movement.';
        this.provenance.className = 'lab-provenance';
        const modes = document.createElement('div');
        modes.className = 'lab-modes';
        modes.setAttribute('role', 'group');
        modes.setAttribute('aria-label', 'Analysis view');
        for (const [id, title] of [['court', 'VectorCourt'], ['body', 'AnatomyMotion'], ['combined', 'Combined']]) {
            const b = document.createElement('button');
            b.textContent = title;
            b.dataset.mode = id;
            b.onclick = () => { if (!this.timeline)
                return; this.timeline.mode = id; this.invalidate(); this.frameCamera(); this.syncControls(); };
            modes.append(b);
        }
        const label = document.createElement('label');
        label.textContent = 'Replay source';
        label.htmlFor = 'labSource';
        this.source.id = 'labSource';
        this.source.onchange = () => this.load(this.source.value);
        this.readout.className = 'lab-readout';
        this.readout.setAttribute('aria-label', 'Selected joint measurement');
        const focus = document.createElement('div');
        focus.className = 'lab-focus';
        focus.setAttribute('role', 'group');
        focus.setAttribute('aria-label', 'Joint focus');
        for (const j of ['knee', 'hip', 'ankle', 'shoulder', 'elbow']) {
            const b = document.createElement('button');
            b.dataset.joint = j;
            b.textContent = j;
            b.onclick = () => this.focus(j);
            focus.append(b);
        }
        this.plot.setAttribute('viewBox', '0 0 300 82');
        this.plot.setAttribute('role', 'img');
        this.plot.setAttribute('aria-label', 'Joint measurement over replay time');
        this.plotPath.setAttribute('fill', 'none');
        this.plotPath.setAttribute('stroke', '#e6c889');
        this.plotPath.setAttribute('stroke-width', '2');
        this.plotMarker.setAttribute('y1', '4');
        this.plotMarker.setAttribute('y2', '78');
        this.plotMarker.setAttribute('stroke', '#9edbcc');
        this.plotMarker.setAttribute('stroke-width', '1.5');
        this.plot.append(this.plotPath, this.plotMarker);
        this.plotTitle.className = 'lab-plot-title';
        this.stats.className = 'lab-stats';
        this.lens.textContent = 'Slow contact';
        this.lens.title = 'Slow the replay near racket contact. Joint positions remain registered to the body.';
        this.lens.onclick = () => { this.contactLens = !this.contactLens; this.syncControls(); this.invalidate(); };
        this.separation.textContent = 'Separate rig';
        this.separation.dataset.labAction = 'separate';
        this.separation.title = 'Optional exploded view. Return to the registered overlay by switching this off.';
        this.separation.onclick = () => { this.separateRig = !this.separateRig; this.syncControls(); this.invalidate(); };
        const orbit = document.createElement('div');
        orbit.className = 'lab-orbit';
        for (const [sign, text] of [[-1, '↶ Orbit'], [1, 'Orbit ↷']]) {
            const b = document.createElement('button');
            b.textContent = text;
            b.onclick = () => this.camera.desiredAzimuth += sign * .35;
            orbit.append(b);
        }
        const note = document.createElement('p');
        note.className = 'lab-note';
        note.textContent = 'Simulated rig geometry · distances in club units. Camera pose estimates, forces and muscle activation are not measured here.';
        this.phase.className = 'lab-phase';
        const inspection = document.createElement('div');
        inspection.className = 'lab-orbit';
        inspection.append(this.lens, this.separation);
        this.panel.append(this.heading, this.provenance, modes, label, this.source, focus, this.readout, this.plotTitle, this.plot, this.phase, this.stats, inspection, orbit, note);
        this.transport.className = 'lab-transport';
        this.play.dataset.labAction = 'play';
        this.play.onclick = () => this.togglePlay();
        this.scrub.type = 'range';
        this.scrub.min = '0';
        this.scrub.max = '1000';
        this.scrub.step = '1';
        this.scrub.setAttribute('aria-label', 'Replay time');
        this.scrub.oninput = () => { if (!this.timeline)
            return; this.timeline.playing = false; this.timeline.seek(this.timeline.start + (this.timeline.end - this.timeline.start) * Number(this.scrub.value) / 1000); this.invalidate(); this.refresh(); };
        const speed = document.createElement('select');
        speed.setAttribute('aria-label', 'Replay speed');
        for (const n of [.25, .5, 1]) {
            const o = document.createElement('option');
            o.value = String(n);
            o.textContent = `${n}×`;
            speed.append(o);
        }
        speed.value = '1';
        speed.onchange = () => { if (this.timeline)
            this.timeline.speed = Number(speed.value); };
        this.transport.append(this.play, this.scrub, this.timeLabel, speed);
        this.layer.append(header, this.panel, this.transport);
        for (const event of ['pointerdown', 'pointerup', 'pointermove', 'wheel', 'dblclick', 'keydown', 'keyup'])
            this.layer.addEventListener(event, e => { e.stopPropagation(); if (event === 'keydown')
                this.key(e); });
        document.getElementById('app').append(this.layer);
    }
    open(spec, recording) {
        if (this.active)
            return;
        this.restoreFocus = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : this.canvas;
        this.prior = this.camera.captureState();
        this.priorAspect = this.camera.aspect;
        this.active = true;
        this.separateRig = false;
        this.clips.clear();
        for (const kind of ['gait', 'forehand', 'serve'])
            this.clips.set(kind, demonstration(kind, spec));
        if (recording && recording.frames.length > 2)
            this.clips.set('championship', recording);
        this.source.replaceChildren(...[...this.clips].map(([key, clip]) => { const o = document.createElement('option'); o.value = key; o.textContent = clip.name; return o; }));
        this.layer.hidden = false;
        document.body.classList.add('lab-active');
        for (const el of document.querySelectorAll('.topbar,.hud,.objective,#scenePeek'))
            el.inert = true;
        this.load(this.clips.has('championship') ? 'championship' : 'forehand');
        this.layer.querySelector('header button').focus({ preventScroll: true });
    }
    close() {
        if (!this.active)
            return;
        this.active = false;
        this.layer.hidden = true;
        document.body.classList.remove('lab-active');
        if (this.prior)
            this.camera.restoreState(this.prior);
        if (this.camera.aspect !== this.priorAspect) {
            const aspect = this.camera.aspect;
            this.camera.aspect = 0;
            this.camera.setAspect(aspect);
            this.camera.update(0);
        }
        this.prior = null;
        this.timeline = null;
        this.cached = [];
        this.clips.clear();
        for (const el of document.querySelectorAll('.topbar,.hud,.objective,#scenePeek'))
            el.inert = false;
        const target = this.restoreFocus?.isConnected && !this.restoreFocus.closest('[hidden]') ? this.restoreFocus : this.canvas;
        target.focus({ preventScroll: true });
        this.restoreFocus = null;
        this.onReturn();
    }
    load(kind) {
        const clip = this.clips.get(kind);
        if (!clip)
            return;
        const mode = this.timeline?.mode ?? 'combined', focus = this.timeline?.clip.kind === kind ? this.timeline.focus : kind === 'gait' ? 'knee' : 'elbow';
        this.timeline = new ReplayTimeline(clip);
        this.timeline.mode = mode;
        this.timeline.focus = focus;
        this.timeline.speed = Number(this.transport.querySelector('select')?.value ?? 1);
        this.source.value = kind;
        this.provenance.textContent = clip.source === 'game-recording' ? 'GAME RECORDING · your last 360 samples' : 'AUTHORED DEMO · simulated movement';
        const s = summary(clip);
        this.stats.textContent = `${format(s.distance, 1)} club units travelled · ${s.contacts} player racket contacts${s.cadence === null ? '' : ` · ${format(s.cadence)} steps/min · ${format(s.stride, 2)} u stride · stance L ${format(s.stance[0])}% / R ${format(s.stance[1])}% · footsteps: L mint / R gold`}`;
        this.invalidate();
        this.frameCamera();
        this.syncControls();
        this.refresh();
    }
    focus(j) { if (!this.timeline)
        return; this.timeline.focus = j; this.invalidate(); this.syncControls(); this.refresh(); }
    togglePlay() { if (!this.timeline)
        return; if (this.timeline.time >= this.timeline.end)
        this.timeline.seek(this.timeline.start); this.timeline.playing = !this.timeline.playing; this.refresh(); }
    zoom(delta) { this.camera.desiredDistance = clamp(this.camera.desiredDistance + delta * (this.camera.desiredDistance / 20), this.camera.aspect < .9 ? 12 : 7, 60); }
    key(e) {
        if (!this.active)
            return;
        if (e.key === 'Escape') {
            e.preventDefault();
            this.close();
        }
        else if (e.key === ' ' && e.target === this.canvas) {
            e.preventDefault();
            this.togglePlay();
        }
        else if (e.target === this.canvas && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
            e.preventDefault();
            if (this.timeline) {
                this.timeline.playing = false;
                this.timeline.seek(this.timeline.time + (e.key === 'ArrowLeft' ? -.1 : .1));
                this.invalidate();
                this.refresh();
            }
        }
    }
    rigOffset(_reducedMotion) {
        void _reducedMotion; // Retain the caller contract; this inspection offset never animates.
        // Registration is the default, including at contact. Separation is a static,
        // explicitly selected inspection view, never a moving visual effect.
        return this.timeline && this.separateRig ? new Vec3(.85, 0, 0) : new Vec3();
    }
    pickJoint(x, y, reducedMotion = false) {
        const f = this.timeline?.frame;
        if (!f || this.timeline?.mode === 'court')
            return;
        const offset = this.rigOffset(reducedMotion);
        const ranked = Object.keys(FOCUS_KEYS).map(j => { const p = this.camera.project(f.pose[FOCUS_KEYS[j]].clone().add(offset)); return { j, d: p.visible ? Math.hypot(p.x - x, p.y - y) : Infinity }; }).sort((a, b) => a.d - b.d);
        if (ranked[0]?.d < 30)
            this.focus(ranked[0].j);
    }
    invalidate() { this.renderKey = ''; this.timer = 0; }
    syncControls() {
        for (const b of this.panel.querySelectorAll('[data-mode]'))
            b.setAttribute('aria-pressed', String(b.dataset.mode === this.timeline?.mode));
        for (const b of this.panel.querySelectorAll('[data-joint]'))
            b.setAttribute('aria-pressed', String(b.dataset.joint === this.timeline?.focus));
        this.lens.setAttribute('aria-pressed', String(this.contactLens));
        this.separation.setAttribute('aria-pressed', String(this.separateRig));
        this.separation.textContent = this.separateRig ? 'Register rig' : 'Separate rig';
    }
    frameCamera() {
        const t = this.timeline;
        if (!t)
            return;
        const f = t.frame ?? t.clip.frames[0], portrait = this.camera.aspect < .9;
        this.camera.autoFrame = false;
        this.camera.desiredAzimuth = t.mode === 'court' ? .36 : 2.55;
        this.camera.desiredElevation = t.mode === 'court' ? .72 : .36;
        this.camera.desiredDistance = t.mode === 'court' ? (portrait ? 48 : 35) : t.mode === 'body' ? (portrait ? 14 : 9) : (portrait ? 18 : 13);
        this.lastAspect = this.camera.aspect;
        this.trackCamera(f);
    }
    trackCamera(f) {
        if (!this.timeline)
            return;
        const portrait = this.camera.aspect < .9, wide = this.canvas.clientWidth > 850;
        const court = this.timeline.mode === 'court';
        const shift = wide && !court ? 1.25 : 0;
        this.camera.desiredTarget.set(court ? 1 : f.root.x + Math.cos(this.camera.desiredAzimuth) * shift, court ? 0 : f.root.y + (portrait ? -.05 : 1.15), court ? 0 : f.root.z - Math.sin(this.camera.desiredAzimuth) * shift);
    }
    update(dt, reducedMotion) {
        if (!this.active || !this.timeline)
            return;
        this.timeline.update(dt, this.contactLens && !reducedMotion);
        this.timer -= dt;
        if (this.lastAspect !== this.camera.aspect)
            this.frameCamera();
        const f = this.timeline.frame;
        if (f)
            this.trackCamera(f);
        if (this.timer <= 0) {
            this.refresh();
            this.timer = 1 / 15;
        }
    }
    refresh() {
        const t = this.timeline;
        if (!t)
            return;
        const f = t.frame;
        this.play.textContent = t.playing ? 'Pause' : 'Play';
        this.scrub.value = String(Math.round(1000 * (t.time - t.start) / Math.max(.001, t.end - t.start)));
        this.timeLabel.textContent = `${(t.time - t.start).toFixed(2)} / ${(t.end - t.start).toFixed(2)}s`;
        this.scrub.setAttribute('aria-valuetext', this.timeLabel.textContent);
        const j = t.focus, unit = j === 'ankle' ? 'u' : '°', v = f ? value(f, j) : null;
        this.readout.textContent = `${format(v, j === 'ankle' ? 2 : 0)}${v === null ? '' : unit}`;
        this.plotTitle.textContent = `${METRIC_NAMES[j]} · ${unit}${f ? '' : ' · no sample in this gap'}`;
        this.phase.textContent = !f ? 'No recorded sample' : t.clip.kind === 'gait' ? `Left ${f.planted[0] ? 'stance' : 'swing'} · Right ${f.planted[1] ? 'stance' : 'swing'}` : f.contact ? 'Racket contact' : f.state === 'serve' ? 'Serve motion' : f.state.startsWith('swing') ? 'Stroke motion' : f.state === 'ready' ? 'Ready / recovery' : f.state;
        const values = t.clip.frames.map(f => value(f, j)), finite = values.filter((v) => v !== null && Number.isFinite(v));
        const min = Math.min(...finite), max = Math.max(...finite), span = Math.max(j === 'ankle' ? .05 : 10, max - min);
        let path = '', gap = true;
        for (let i = 0; i < values.length; i++) {
            const v = values[i];
            if (v === null || !Number.isFinite(v)) {
                gap = true;
                continue;
            }
            const f = t.clip.frames[i];
            if (i && f.time - t.clip.frames[i - 1].time > .15)
                gap = true;
            const x = 4 + 292 * (f.time - t.start) / Math.max(.001, t.end - t.start), y = 72 - 58 * (v - min) / span;
            path += `${gap ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)} `;
            gap = false;
        }
        if (this.plotPath.getAttribute('d') !== path)
            this.plotPath.setAttribute('d', path);
        const x = String(4 + 292 * (t.time - t.start) / Math.max(.001, t.end - t.start));
        this.plotMarker.setAttribute('x1', x);
        this.plotMarker.setAttribute('x2', x);
        this.plot.setAttribute('aria-label', `${METRIC_NAMES[j]} from ${format(min, 1)} to ${format(max, 1)} ${unit}, current ${format(v, 1)}`);
    }
    meshes(reducedMotion) {
        const t = this.timeline, f = t?.frame;
        if (!this.active || !t || !f)
            return [];
        const offset = this.rigOffset(reducedMotion), key = `${t.index()}/${t.mode}/${t.focus}/${offset.x.toFixed(4)}/${this.contactLens}/${reducedMotion}`;
        if (this.renderKey === key)
            return this.cached;
        this.renderKey = key;
        const m = [...f.body], frames = t.clip.frames.slice(0, t.index() + 1);
        if (f.ball)
            m.push({ kind: 'sphere', position: f.ball, scale: new Vec3(.19, .19, .19), color: '#fff078', unlit: true, noShadow: true });
        if (t.mode !== 'body') {
            // Sampling history only. Gaussian kernels, fixed world registration, no airborne projection.
            let peak = 0;
            const cells = [];
            for (let x = -3; x <= 5; x += .8)
                for (let z = -6; z <= 6; z += .8) {
                    let v = 0;
                    for (let i = 0; i < frames.length; i += 4) {
                        const p = frames[i].root;
                        v += Math.exp(-((x - p.x) ** 2 + (z - p.z) ** 2) / .85);
                    }
                    peak = Math.max(peak, v);
                    cells.push({ x, z, v });
                }
            for (const c of cells)
                if (c.v > peak * .08 && peak > 0)
                    m.push({ kind: 'roundBox', position: new Vec3(c.x, COURT_OVERLAY.coverage, c.z), scale: new Vec3(.79, .01, .79), color: c.v > peak * .65 ? '#dfbd78' : '#67b9aa', alpha: .09 + .19 * c.v / peak, unlit: true, noShadow: true });
            for (let i = 4; i < frames.length; i += 4)
                if (frames[i].time - frames[i - 4].time <= .15)
                    m.push(rod(new Vec3(frames[i - 4].root.x, COURT_OVERLAY.path, frames[i - 4].root.z), new Vec3(frames[i].root.x, COURT_OVERLAY.path, frames[i].root.z), '#b1ded0', .028, .62));
            if (t.clip.kind === 'gait')
                for (let i = 1; i < frames.length; i++)
                    for (let foot = 0; foot < 2; foot++) {
                        const a = frames[i - 1], b = frames[i];
                        if (b.time - a.time > .15 || a.planted[foot] || !b.planted[foot])
                            continue;
                        const p = foot ? b.pose.footR : b.pose.footL;
                        m.push({ kind: 'roundBox', position: new Vec3(p.x, COURT_OVERLAY.path, p.z), rotation: new Vec3(0, Math.atan2(b.pose.forward.x, b.pose.forward.z), 0), scale: new Vec3(.12, .012, .24), color: foot ? '#edcc89' : '#b1e7db', alpha: .8, unlit: true, noShadow: true });
                    }
            for (const s of frames.filter(f => f.contact))
                m.push({ kind: 'torus', position: new Vec3(s.pose.racketCenter.x, COURT_OVERLAY.path, s.pose.racketCenter.z), rotation: new Vec3(Math.PI / 2, 0, 0), scale: new Vec3(.42, .42, .18), color: '#e8c77f', alpha: .7, unlit: true, noShadow: true });
            for (const s of frames.filter(f => f.bounce && f.ball))
                m.push({ kind: 'torus', position: new Vec3(s.ball.x, COURT_OVERLAY.path, s.ball.z), rotation: new Vec3(Math.PI / 2, 0, 0), scale: new Vec3(.26, .26, .14), color: '#c8e5d7', alpha: .7, unlit: true, noShadow: true });
            for (let i = 2; i < frames.length; i += 2) {
                const a = frames[i - 2], b = frames[i];
                if (a.ball && b.ball && b.time - a.time < .1)
                    m.push(rod(a.ball, b.ball, '#e6daa0', .018, .42));
            }
        }
        // Opaque surfaces preserve the silhouette. An annotation pass makes the
        // captured joint centres visible through clothing without displacing them.
        if (t.mode !== 'court') {
            const p = f.pose;
            for (const [a, b] of LIMBS)
                m.push({ ...rod(p[a].clone().add(offset), p[b].clone().add(offset), '#a4ded0', .022, 1), overlay: true });
            for (const j of JOINT_KEYS) {
                const selected = j === FOCUS_KEYS[t.focus], size = selected ? .08 : .042;
                m.push({ kind: 'sphere', position: p[j].clone().add(offset), scale: new Vec3(size, size, size), color: selected ? '#ffe3a0' : '#cff2e5', unlit: true, noShadow: true, overlay: true });
            }
            const triple = jointTriplet(p, t.focus);
            if (triple) {
                const [a, v, b] = triple, u = Vec3.sub(a, v).normalize(), w = Vec3.sub(b, v).normalize();
                let prev = null;
                for (let i = 0; i <= 16; i++) {
                    const blend = Vec3.lerp(u, w, i / 16);
                    if (blend.len() < 1e-5)
                        continue;
                    const point = v.clone().add(blend.normalize().scale(.20)).add(offset);
                    if (prev)
                        m.push({ ...rod(prev, point, '#ffe3a0', .018), overlay: true });
                    prev = point;
                }
            }
            for (let i = Math.max(1, frames.length - 16); i < frames.length; i++)
                m.push(rod(frames[i - 1].pose.racketCenter, frames[i].pose.racketCenter, '#e8c889', .015, .20 + .35 * (i / frames.length)));
        }
        return this.cached = m;
    }
    report() { return { active: this.active, kind: this.timeline?.clip.kind, mode: this.timeline?.mode, focus: this.timeline?.focus, time: this.timeline?.time, samples: this.timeline?.clip.frames.length, playing: this.timeline?.playing, frame: this.timeline?.frame?.time ?? null, meshes: this.cached.length }; }
    dispose() { this.close(); this.layer.remove(); }
}
