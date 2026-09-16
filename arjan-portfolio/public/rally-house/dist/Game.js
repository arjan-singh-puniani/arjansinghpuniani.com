import { deriveActing } from './animation/ActingState.js';
import { DialogueComposer } from './simulation/DialogueComposer.js';
import { playerSpec } from './content/PlayerAvatars.js';
import { CharacterMind, MEMBERS, motiveFor } from './simulation/CharacterMind.js';
import { SceneGrammar } from './simulation/SceneGrammar.js';
import { LifeTelemetry } from './simulation/LifeTelemetry.js';
import { Renderer } from './rendering/Renderer.js';
import { CameraController } from './rendering/CameraController.js';
import { Vec3, clamp } from './rendering/Math3D.js';
import { World } from './world/World.js';
import { GameClock } from './core/GameClock.js';
import { AudioManager } from './core/AudioManager.js';
import { PerformanceMonitor } from './core/PerformanceMonitor.js';
import { Character } from './entities/Character.js';
import { memberData, destinations, schedules, drills, conversationLines } from './content/content.js';
import { ScheduleSystem } from './simulation/ScheduleSystem.js';
import { RelationshipSystem } from './simulation/RelationshipSystem.js';
import { DailyGoalsSystem } from './simulation/DailyGoalsSystem.js';
import { ClubLifeSystem } from './simulation/ClubLifeSystem.js';
import { EmergentSocialSystem } from './simulation/EmergentSocialSystem.js';
import { RallySystem } from './tennis/RallySystem.js';
import { ActivitySystem } from './simulation/ActivitySystem.js';
import { CoachingEvidence, cueFor, summarize } from './simulation/CoachingEvidence.js';
import { ClubHistory } from './simulation/ClubHistory.js';
import { ObjectAffordances } from './simulation/ObjectAffordances.js';
import { EverydayLife } from './simulation/EverydayLife.js';
import { AmbientSocialPlanner } from './simulation/AmbientSocialPlanner.js';
import { SaveSystem, SaveConflictError } from './persistence/SaveSystem.js';
import { migrateGameSave } from './persistence/migrations.js';
import { HUD } from './ui/HUD.js';
import { DECOR_BY_ID, rotatedFootprint } from './content/DecorCatalog.js';
const LESSON_FEE = 18;
const weatherOrder = ['clear', 'cloudy', 'rain'];
export class Game {
    canvas;
    renderer;
    camera;
    world;
    clock = new GameClock(9 * 60 + 20, 1);
    ui = new HUD();
    audio = new AudioManager();
    relations = new RelationshipSystem();
    schedule = new ScheduleSystem(schedules);
    daily = new DailyGoalsSystem(1);
    life = new ClubLifeSystem();
    socialSimulation = new EmergentSocialSystem(this.relations);
    characters = [];
    player;
    rally;
    socialRally;
    coins = 100;
    stars = 3;
    mikaProgress = 28;
    coachXP = 14;
    equipment = { frame: 'Cedar 98', tension: 52, string: 'Soft poly' };
    dialogue = new DialogueComposer();
    saveBlocked = false;
    lessonKeys = new Map();
    coachingTrace = [];
    aiMs = 0;
    renderItems = 0;
    traceCoaching(event, data) { this.coachingTrace ??= []; this.coachingTrace.push({ at: this.everyday.time, event, data }); this.coachingTrace = this.coachingTrace.slice(-160); }
    mind = new CharacterMind();
    grammar = new SceneGrammar();
    telemetry = new LifeTelemetry();
    mindTimer = 0;
    routineNotices = new Map();
    lastNotice = new Map();
    everyday = new EverydayLife();
    lifeRuns = new Map();
    speechOwner = null;
    activities = new ActivitySystem();
    evidence = new CoachingEvidence();
    history = new ClubHistory();
    affordances = new ObjectAffordances();
    ambientSocial = new AmbientSocialPlanner();
    development = { preparation: 0, recovery: 0 };
    settings = { volume: .65, visuals: 'auto', reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches };
    queuedLesson = null;
    movingPlacement = null;
    decisionTimer = 0;
    observationStarted = false;
    saveSystem = new SaveSystem();
    selectedId = null;
    buildType = null;
    buildRotation = 0;
    hoverGround = null;
    frameSamples = [];
    graphicsLost = false;
    last = performance.now();
    simAcc = 0;
    lessonUntil = -1;
    lessonActive = false;
    rallyWasRunning = false;
    autosave = 0;
    lastDay = 1;
    playerWatchingRally = false;
    playerWatchActivityId = null;
    playerWatchPeak = 0;
    playerWatchNextReaction = 8;
    pointers = new Map();
    pointerStart = null;
    lastPointer = null;
    dragged = false;
    pinchDistance = 0;
    perf = new PerformanceMonitor(new URLSearchParams(location.search).has('debug'));
    socialUntil = -1;
    socialIds = new Set();
    activeSpeechId = null;
    speechUntil = 0;
    weatherRedirectUntil = -1;
    socialRallyWasRunning = false;
    socialRallyUntil = -1;
    constructor(canvas) {
        this.canvas = canvas;
        this.clock.minutesPerSecond = 1;
        this.renderer = new Renderer(canvas);
        this.camera = new CameraController(canvas);
        this.world = new World();
        const get = (id) => memberData.find(x => x.id === id);
        const coach = new Character(get('coach'), destinations.courtNorth, this.world.nav, destinations);
        const mika = new Character(get('mika'), destinations.courtSouth, this.world.nav, destinations);
        mika.setDevelopment(this.mikaProgress);
        const leo = new Character(get('leo'), destinations.proshop, this.world.nav, destinations);
        const nia = new Character(get('nia'), destinations.cafe, this.world.nav, destinations);
        this.characters = [coach, mika, leo, nia];
        this.player = new Character({ id: 'player', name: 'You', role: 'Club founder', shirt: '#d89a77', skin: '#d3a17d', hair: '#3e332b', accent: '#f1dfcf', hairStyle: 'crop', playStyle: 'curious all-court', goal: 'Build a club people want to linger in', quirk: 'Stops to watch good rallies' }, new Vec3(-11.9, 0, 8.1), this.world.nav, destinations);
        this.rally = new RallySystem(coach, mika, { onShot: e => this.evidence.observe(e), onHit: q => this.audio.hit(q), onBounce: () => this.audio.bounce(), onNet: () => this.audio.net() });
        this.rally.stop();
        this.socialRally = new RallySystem(leo, mika, { onShot: e => this.evidence.observe(e), onHit: q => this.audio.hit(q), onBounce: () => this.audio.bounce(), onNet: () => this.audio.net() });
        this.socialRally.stop();
        this.lastDay = this.clock.day;
        this.bindUI();
        this.bindInput();
    }
    async init() { await this.restore(); this.daily.ensureDay(this.clock.day); this.lastDay = this.clock.day; for (const c of this.characters)
        this.schedule.update(c, this.clock.minutes); this.updateObjective(); this.ui.hideLoading(); this.exposeDebugHooks(); this.loop(performance.now()); if (!this.playerAvatar)
        this.openAvatarPicker(); }
    /** Local, dev-only instrumentation. No network, no user data. Used by tools/shoot.mjs and by hand in the console. */
    exposeDebugHooks() {
        if (!new URLSearchParams(location.search).has('debug'))
            return;
        window.__rh = {
            ready: true,
            game: this,
            setTime: (minutes) => { this.clock.minutes = clamp(minutes, 0, 1439); for (const c of this.characters)
                if (!this.activities.busy(c.id))
                    this.schedule.update(c, this.clock.minutes); },
            setWeather: (w) => { this.world.weather = w; this.applyWeatherBehavior(); },
            setPaused: (p) => { this.clock.paused = p; },
            setLampShadows: (on) => { this.renderer.lampShadowEnabled = on; },
            lockCamera: (on) => { if (on)
                this.camera.pin(); this.camera.locked = on; },
            setSpeed: (s) => { this.clock.speed = s; },
            focus: (x, z, distance) => this.camera.focus(x, z, distance),
            report: () => ({
                day: this.clock.day, minutes: Math.round(this.clock.minutes), weather: this.world.weather,
                renderScale: this.renderer.renderScale, drawCalls: this.renderer.drawCalls, instancedDraws: this.renderer.instancedDraws, triangles: Math.round(this.renderer.triangles), shadowCasters: this.renderer.shadowCasters, lampShadows: this.renderer.lampShadowEnabled,
                camera: { distance: +this.camera.distance.toFixed(2), elevation: +this.camera.elevation.toFixed(3), azimuth: +this.camera.azimuth.toFixed(3), fovDeg: +(this.camera.fov * 180 / Math.PI).toFixed(1), aspect: +this.camera.aspect.toFixed(3) },
                activities: this.activities.active.map(a => ({ kind: a.kind, phase: a.phase, seconds: Math.round(a.phaseTime) })), completed: this.activities.history.filter(a => a.phase === 'completed').length, interrupted: this.activities.history.filter(a => a.phase === 'interrupted').length, intentions: this.history.intentions, objects: this.affordances.serialize(), rallyActive: this.rally.enabled || this.socialRally.enabled, rallyCount: Math.max(this.rally.rallyCount, this.socialRally.rallyCount),
                presence: { acting: this.characters.map(c => ({ id: c.id, values: c.acting.values, role: c.acting.role, reaction: c.acting.reactionName, micro: c.acting.micro })), coaching: this.coachingTrace, saveConflicts: this.saveSystem.conflicts, aiMs: this.aiMs, renderItems: this.renderItems, memoryClasses: Object.fromEntries(['foundational', 'major', 'ordinary'].map(k => [k, this.mind.memories.filter(m => m.memoryClass === k).length])) }, mind: { states: this.mind.states, chosen: this.mind.chosen, choices: this.mind.explanations, culture: this.mind.culture }, telemetry: this.telemetry.report(), everyday: this.everyday.serialize(), characters: this.characters.map(c => ({ id: c.spec.id, state: c.state, x: +c.position.x.toFixed(2), z: +c.position.z.toFixed(2) })),
            }),
        };
    }
    bindUI() {
        this.ui.onBuildClose = () => { this.buildType = null; this.buildRotation = 0; this.movingPlacement = null; };
        document.getElementById('scenePeek').onclick = () => { const run = this.lifeRuns.values().next().value; if (run) {
            const people = run.scene.people.map(id => this.actor(id));
            this.camera.focus(people.reduce((v, c) => v + c.position.x, 0) / people.length, people.reduce((v, c) => v + c.position.z, 0) / people.length, 25);
        } };
        document.getElementById('settingsBtn').onclick = () => this.openSettings();
        this.ui.onPlay = () => { this.clock.paused = !this.clock.paused; this.audio.click(); };
        this.ui.onSpeed = () => { this.clock.speed = this.clock.speed === 1 ? 2 : this.clock.speed === 2 ? .5 : 1; this.ui.toast(`Time ${this.clock.speed}×`); this.audio.click(); };
        this.ui.onBook = () => this.openBook();
        this.ui.onCoach = () => this.openCoaching();
        this.ui.onBuild = () => { this.ui.toggleBuild(); this.audio.click(); };
        this.ui.onBuildSelect = (type) => { this.buildType = type; this.buildRotation = 0; const d = DECOR_BY_ID[this.buildType]; this.ui.toast(`${d.label} selected · Q / E rotates`); this.audio.click(); };
        this.ui.onBuildRotate = (direction) => { this.rotateBuild(direction); this.audio.click(); };
        this.ui.onWeather = () => { const i = weatherOrder.indexOf(this.world.weather); this.world.weather = weatherOrder[(i + 1) % weatherOrder.length]; const msg = this.world.weather === 'rain' ? 'Soft rain moved in. The indoor court feels extra cozy.' : this.world.weather === 'cloudy' ? 'Clouds softened the light.' : 'The clouds cleared.'; this.ui.toast(msg); this.audio.click(); this.applyWeatherBehavior(); void this.save(); };
        this.ui.onCamera = () => { const view = this.camera.cycleView(); this.ui.toast(view === 1 ? 'Mirrored dollhouse view' : view === 2 ? 'High center view' : 'Classic dollhouse view'); this.audio.click(); };
        this.ui.onSave = () => void this.save(true);
    }
    bindInput() {
        this.canvas.addEventListener('dblclick', e => { const c = this.pickCharacter(e.clientX, e.clientY); if (c) {
            this.camera.focus(c.position.x, c.position.z, 17, 1);
            this.ui.closeContext();
        } });
        document.addEventListener('visibilitychange', () => { this.last = performance.now(); this.simAcc = 0; });
        this.canvas.tabIndex = 0;
        this.canvas.addEventListener('webglcontextlost', e => {
            e.preventDefault();
            this.graphicsLost = true;
            this.clock.paused = true;
            const box = document.getElementById('loading');
            box.classList.remove('hide');
            box.replaceChildren();
            const title = document.createElement('strong');
            title.textContent = 'The graphics took a break';
            const detail = document.createElement('span');
            detail.textContent = 'Saving your club before recovery…';
            box.append(title, detail);
            void this.saveSystem.save(this.snapshot()).then(() => { detail.textContent = 'Your club is saved. Reload to restore the view.'; const button = document.createElement('button'); button.textContent = 'Reload saved club'; button.onclick = () => location.reload(); box.append(button); }).catch(() => { detail.textContent = 'Graphics stopped, and recent changes could not be saved. Keep this tab open.'; });
        });
        document.addEventListener('keydown', e => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
                return;
            const key = e.key.toLowerCase();
            if (e.key === 'Escape') {
                const hadPanel = !!document.querySelector('#context.open,#book.open');
                this.ui.closeContext();
                this.ui.closeBook();
                this.ui.toggleBuild(false);
                this.buildType = null;
                this.buildRotation = 0;
                this.movingPlacement = null;
                if (!hadPanel)
                    this.canvas.focus();
                return;
            }
            if (this.buildType && (key === 'q' || key === 'e')) {
                e.preventDefault();
                this.rotateBuild(key === 'q' ? -1 : 1, e.shiftKey);
                return;
            }
            if (e.target !== this.canvas)
                return;
            const c = this.characters[Number(e.key) - 1];
            if (c)
                this.openCharacter(c);
            if (key === 'c')
                this.openCoaching();
            if (key === 'b')
                this.ui.toggleBuild();
            if (e.key.startsWith('Arrow')) {
                e.preventDefault();
                this.camera.pan(e.key === 'ArrowLeft' ? -25 : e.key === 'ArrowRight' ? 25 : 0, e.key === 'ArrowUp' ? -25 : e.key === 'ArrowDown' ? 25 : 0);
            }
        });
        this.canvas.addEventListener('wheel', e => { e.preventDefault(); this.camera.zoom(e.deltaY * .012); }, { passive: false });
        this.canvas.addEventListener('contextmenu', e => e.preventDefault());
        this.canvas.addEventListener('pointerdown', e => { this.canvas.setPointerCapture(e.pointerId); this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (this.pointers.size === 1) {
            this.pointerStart = { x: e.clientX, y: e.clientY };
            this.lastPointer = { x: e.clientX, y: e.clientY };
            this.dragged = false;
        }
        else if (this.pointers.size === 2)
            this.pinchDistance = this.currentPinch(); });
        this.canvas.addEventListener('pointermove', e => { const prev = this.pointers.get(e.pointerId); if (prev)
            this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY }); this.hoverGround = this.camera.groundPoint(e.clientX, e.clientY); if (this.pointers.size === 2) {
            const d = this.currentPinch();
            if (this.pinchDistance > 0)
                this.camera.zoom((this.pinchDistance - d) * .035);
            this.pinchDistance = d;
            this.dragged = true;
            return;
        } if (prev && this.lastPointer && this.pointers.size === 1) {
            const dx = e.clientX - this.lastPointer.x, dy = e.clientY - this.lastPointer.y;
            if (this.pointerStart && Math.hypot(e.clientX - this.pointerStart.x, e.clientY - this.pointerStart.y) > 7)
                this.dragged = true;
            if (this.dragged) {
                if (e.shiftKey || e.buttons === 2)
                    this.camera.rotate(dx);
                else
                    this.camera.pan(dx, dy);
            }
            this.lastPointer = { x: e.clientX, y: e.clientY };
        } });
        this.canvas.addEventListener('pointerup', e => { if (!this.dragged && this.pointers.size === 1)
            this.handleTap(e.clientX, e.clientY); this.pointers.delete(e.pointerId); this.pointerStart = null; this.lastPointer = null; this.pinchDistance = 0; this.ui.hideHint(); });
        this.canvas.addEventListener('pointercancel', e => { this.pointers.delete(e.pointerId); this.pointerStart = null; this.lastPointer = null; this.pinchDistance = 0; });
    }
    currentPinch() { const a = [...this.pointers.values()]; return a.length < 2 ? 0 : Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y); }
    byId(id) { return this.characters.find(c => c.spec.id === id); }
    say(c, text, duration = 3900) { c.trigger('talk'); c.setEmotion('friendly', Math.min(1.2, duration / 1000)); c.setConversationPartner(this.player.position); this.player.setConversationPartner(c.position); this.activeSpeechId = c.spec.id; this.speechUntil = performance.now() + duration; this.ui.showSpeech(c.spec.name, text, duration); }
    randomLine(c) {
        const recentCoach = this.relations.recall(c.spec.id, 'coach'), recentMatcha = this.relations.recall(c.spec.id, 'matcha'), recentRally = this.relations.recall(c.spec.id, 'rally');
        if (c.spec.id === 'mika' && recentCoach && this.clock.day > recentCoach.day)
            return '“I tried that earlier-preparation cue again. I can actually feel the extra time now.”';
        if (c.spec.id === 'leo' && recentRally && this.clock.day >= recentRally.day)
            return '“That rally from earlier is still in my head. The clean ones are weirdly satisfying.”';
        if (c.spec.id === 'nia' && recentMatcha && this.clock.day >= recentMatcha.day)
            return '“I remembered your usual. I was already halfway through making it.”';
        const intention = this.history.intentions.find(i => i.person === c.id);
        if (intention)
            return intention.text;
        const lines = conversationLines[c.spec.id] ?? [c.spec.goal];
        const seed = Math.floor(this.clock.day * 17 + this.clock.minutes / 12 + c.spec.id.length) % lines.length;
        return lines[seed];
    }
    socialLine(host, companion, object) {
        if (object?.type === 'bench')
            return host.id === 'mika' ? '“You can see the whole court from here.”' : host.id === 'leo' ? '“This is a dangerously good place to sit between sets.”' : '“This corner actually feels like part of the club now.”';
        if (object?.type === 'plant')
            return host.id === 'leo' ? '“I swear this one has changed since yesterday.”' : host.id === 'nia' ? '“The plants make people stay five minutes longer.”' : '“This is a good quiet spot.”';
        if (object?.type === 'basket')
            return host.id === 'mika' ? '“One more little footwork block?”' : '“Somehow the basket always becomes a training station.”';
        if (object?.type === 'lamp')
            return host.id === 'coach' ? '“Good light changes the whole feel of a lesson.”' : '“This is cozy at this hour.”';
        const rel = this.relations.behaviorBias(host.id, companion.id);
        if (rel.competition > .48 && ((host.id === 'mika' && companion.id === 'leo') || (host.id === 'leo' && companion.id === 'mika')))
            return '“We should probably settle that on court later.”';
        return this.randomLine(host);
    }
    interact(c, type, detail) { return this.relations.interact(c.spec.id, type, this.clock.day, detail); }
    handleTap(x, y) {
        this.audio.click();
        if (this.movingPlacement) {
            const g = this.camera.groundPoint(x, y);
            if (g)
                this.moveFurniture(this.movingPlacement, g.x, g.z);
            return;
        }
        if (this.buildType) {
            const g = this.camera.groundPoint(x, y);
            if (g)
                this.place(this.buildType, g.x, g.z);
            return;
        }
        const placed = this.world.placements.find(p => { const q = this.camera.project(new Vec3(p.x, .6, p.z)), d = DECOR_BY_ID[p.type], threshold = Math.min(62, 24 + Math.max(d.footprintX, d.footprintZ) * 12); return Math.hypot(q.x - x, q.y - y) < threshold; });
        if (placed) {
            this.openFurniture(placed);
            return;
        }
        const c = this.pickCharacter(x, y);
        if (c) {
            this.openCharacter(c);
            return;
        }
        const o = this.pickObject(x, y);
        if (o) {
            this.openObject(o);
            return;
        }
        const g = this.camera.groundPoint(x, y);
        if (g && !this.activities.busy('player') && g.x > -12.2 && g.x < 12.2 && g.z > -9.2 && g.z < 9.2) {
            this.stopPlayerWatching(false);
            this.selectedId = null;
            this.ui.closeContext();
            this.player.goTo(new Vec3(clamp(g.x, -12, 12), 0, clamp(g.z, -9, 9)), 'idle');
        }
    }
    pickCharacter(x, y) { let best = null, bd = 48; for (const c of this.characters) {
        const p = this.camera.project(new Vec3(c.position.x, 1.25, c.position.z)), d = Math.hypot(x - p.x, y - p.y);
        if (d < bd) {
            bd = d;
            best = c;
        }
    } return best; }
    pickObject(x, y) { let best = null, bd = Infinity; for (const o of this.world.objects) {
        const p = this.camera.project(new Vec3(o.position.x, .75, o.position.z)), d = Math.hypot(x - p.x, y - p.y), threshold = Math.min(78, 28 + o.radius * 7);
        if (d < threshold && d < bd) {
            bd = d;
            best = o;
        }
    } return best; }
    openCharacter(c) {
        this.selectedId = c.id;
        this.camera.focus(c.position.x, c.position.z, 27);
        this.ui.showContext(c.spec.role, c.spec.name, `${c.activity || c.spec.goal}. ${this.mind.mood(c.id)}.`, [this.relations.label(c.id), c.spec.quirk ?? ''], [
            { title: 'Spend a moment', subtitle: 'Walk over and listen', run: () => this.visitMember(c, false) },
            { title: 'Share matcha', subtitle: 'Make time for a shared break', run: () => this.visitMember(c, true) },
            ...(c.id === 'mika' ? [{ title: 'Coach a lesson', subtitle: 'Observe, choose a cue, then practice', run: () => this.openCoaching() }] : [])
        ]);
    }
    visitMember(c, tea) {
        const base = tea ? destinations.cafe : new Vec3(c.position.x, 0, c.position.z);
        const a = this.startActivity(tea ? 'matcha' : 'greeting', ['player', c.id], tea ? 'cafe-table' : `conversation-${c.id}`, [new Vec3(base.x - 1, 0, base.z), base], tea ? 'Sharing matcha' : 'Making time to listen');
        this.ui.toast(a ? 'You make time to meet.' : 'They are busy just now. Try after their activity.');
        if (a)
            this.ui.closeContext();
    }
    openObject(o) {
        this.selectedId = o.id;
        const actions = [];
        if (o.kind === 'cafe')
            actions.push({ title: 'Make matcha', subtitle: 'A tiny ritual with immediate feedback', run: () => { this.visitMember(this.actor('nia'), true); } });
        if (o.kind === 'equipment')
            actions.push({ title: 'Customize racket', subtitle: `${this.equipment.frame} · ${this.equipment.tension} lb`, run: () => this.openEquipment() });
        if (o.kind === 'training')
            actions.push({ title: 'Run ball-machine drill', subtitle: 'A short rhythm block', run: () => { this.beginLesson('dropFeed'); } });
        if (o.kind === 'bonsai')
            actions.push({ title: 'Water bonsai', subtitle: 'No productivity required', run: () => { this.world.triggerInteraction('bonsai'); this.ui.toast('The bonsai continues doing excellent work.'); this.audio.success(); void this.save(); } });
        if (o.kind === 'reception')
            actions.push({ title: 'Review bookings', subtitle: 'Three courts · one lesson · one social', run: () => this.ui.toast('Enough structure to create life. Not enough to feel like work.') });
        if (o.kind === 'lounge')
            actions.push({ title: 'Take five', subtitle: 'Let the simulation carry itself', run: () => { if (this.activities.busy('player')) {
                    this.ui.toast('Finish your shared moment first.');
                    return;
                } this.camera.focus(6.5, 3.2, 25); this.player.goTo(destinations.lounge, 'sit'); this.ui.toast('You sit down. The academy carries on without you.'); } });
        if (o.kind === 'water')
            actions.push({ title: 'Fill bottle', subtitle: 'Hydration, quietly handled', run: () => { this.world.triggerInteraction('water'); this.ui.toast('Cold water. No meter. No chore.'); } });
        if (o.kind === 'court')
            actions.push({ title: 'Watch a rally', subtitle: 'Walk to the sideline and follow the ball', run: () => this.watchRallyAsPlayer() });
        if (o.kind === 'board')
            actions.push({ title: 'Read today’s note', subtitle: 'One useful cue survives the lesson', run: () => { this.ui.showMoment('Club board', '“Prepare earlier. Then let the swing breathe.” — Contessa'); } });
        if (!actions.length)
            actions.push({ title: 'Admire it', subtitle: 'The club is allowed to be pretty', run: () => this.ui.toast('You admire it for exactly long enough.') });
        this.ui.showContext(o.kind, o.label, o.description, [], actions);
    }
    openCoaching() {
        if (this.queuedLesson) {
            this.ui.showContext('COACHING', 'Contessa is making time', 'Practice will begin when the current activity finishes.', [], [{ title: 'Cancel planned lesson', subtitle: 'Everyone continues their day', run: () => { this.queuedLesson = null; this.ui.closeContext(); } }]);
            return;
        }
        const active = this.activities.active.find(a => a.kind === 'lesson');
        if (active) {
            this.ui.showContext('COACHING', 'One cue at a time', `${active.phase} · ${this.evidence.reps.length}/8 contacts`, [], [{ title: 'Watch practice', subtitle: 'Walk over and stay present at the sideline', run: () => this.watchRallyAsPlayer() }, { title: 'End practice', subtitle: 'Stop safely without completion rewards', run: () => { this.cancelActivity(active); this.ui.closeContext(); } }]);
            return;
        }
        const e = summarize(this.evidence.recent.slice(-8));
        this.ui.showContext('COACHING', 'What is Lucresia finding difficult?', e.count ? `${e.late} of her last ${e.count} contacts had a short preparation window; ${e.clean} were clean. Watch her spacing and recovery too.` : 'Watch a few balls first, or try a practice block to learn what needs attention.', [], [{ title: 'Observe a rally', subtitle: 'Walk over, watch the ball, then choose a cue', run: () => this.watchRallyAsPlayer() }, ...Object.entries(drills).map(([key, d]) => ({ title: d.name, subtitle: d.description, run: () => this.beginLesson(key) }))]);
    }
    beginLesson(key) {
        if (!(key in drills))
            return;
        this.traceCoaching('request', { key, queued: this.queuedLesson, active: this.activities.active.map(a => ({ id: a.id, phase: a.phase, people: a.participants })) });
        const observation = this.activities.active.find(a => a.kind === 'observe');
        if (observation)
            this.cancelActivity(observation);
        const a = this.startActivity('lesson', ['coach', 'mika'], 'court', [destinations.courtNorth, destinations.courtSouth], drills[key].name);
        if (!a) {
            this.traceCoaching('queued', { key, positions: this.characters.map(c => ({ id: c.id, position: c.position, path: c.path.length })) });
            this.queuedLesson = key;
            this.ui.toast('Contessa will begin when everyone is free. Keep enjoying the club.');
            return;
        }
        this.queuedLesson = null;
        this.lessonKeys ??= new Map();
        this.lessonKeys.set(a.id, key);
        this.traceCoaching('reserved', { id: a.id, key, targets: this.routes.get(a.id) });
        this.evidence.begin(cueFor(key));
        this.lessonActive = true;
        this.observationStarted = true;
        this.camera.focus(1, 0, 28);
        this.ui.closeContext();
        this.ui.toast('Contessa will demonstrate, then Lucresia will try eight contacts.');
    }
    beginExhibition() {
        const current = this.activities.active.find(a => a.resource === 'court');
        if (current) {
            this.ui.closeContext();
            return current;
        }
        const a = this.startActivity('observe', ['coach', 'mika'], 'court', [destinations.courtNorth, destinations.courtSouth], 'Watch the preparation');
        if (a)
            this.ui.closeContext();
        return a;
    }
    watchRallyAsPlayer() {
        if (this.activities.busy('player')) {
            this.ui.toast('Finish your shared moment first.');
            return;
        }
        const a = this.beginExhibition();
        if (!a) {
            this.ui.toast('The court is not ready just yet.');
            return;
        }
        const center = new Vec3(1, 0, 0), candidates = [new Vec3(-5.15, 0, 3.6), new Vec3(-5.15, 0, -3.0), new Vec3(6.35, 0, 3.1), new Vec3(6.35, 0, -3.0), new Vec3(1, 0, 7.45)];
        candidates.sort((p, q) => Vec3.sub(p, this.player.position).len() - Vec3.sub(q, this.player.position).len());
        const spot = this.player.freeDestination(candidates[0]);
        this.playerWatchingRally = true;
        this.playerWatchActivityId = a.id;
        this.playerWatchPeak = 0;
        this.playerWatchNextReaction = 8;
        this.player.activity = 'Watching the rally from the sideline';
        this.player.setConversationPartner(undefined);
        this.player.setLook(center);
        this.player.goTo(spot, 'watch');
        this.ui.closeContext();
        this.ui.toast('You head to the sideline. The camera stays yours.');
    }
    stopPlayerWatching(showMoment = true) {
        if (!this.playerWatchingRally)
            return;
        const peak = this.playerWatchPeak;
        this.playerWatchingRally = false;
        this.playerWatchActivityId = null;
        this.playerWatchPeak = 0;
        this.playerWatchNextReaction = 8;
        this.player.setLook(undefined);
        this.player.activity = '';
        if (this.player.pathIndex >= this.player.path.length)
            this.player.setAnimation('idle');
        if (showMoment && peak > 0)
            this.ui.showMoment('You stayed for the rally', `${peak} ${peak === 1 ? 'contact' : 'contacts'} · you watched it happen from inside the club.`);
    }
    updatePlayerWatching() {
        if (!this.playerWatchingRally)
            return;
        const watched = this.playerWatchActivityId ? this.activities.active.find(a => a.id === this.playerWatchActivityId) : undefined;
        const live = this.rally.enabled ? this.rally : this.socialRally.enabled ? this.socialRally : null;
        if (!watched && !live) {
            this.stopPlayerWatching(true);
            return;
        }
        if (this.player.pathIndex < this.player.path.length)
            return;
        const center = new Vec3(1, 0, 0), look = live?.ball.active ? live.ball.position : center;
        if (this.player.state !== 'watch')
            this.player.setAnimation('watch');
        this.player.face(center);
        this.player.setLook(look);
        this.player.setEmotion('attentive', .35);
        const count = live?.rallyCount ?? 0;
        this.playerWatchPeak = Math.max(this.playerWatchPeak, count);
        if (live && count >= this.playerWatchNextReaction) {
            this.player.react(count >= 16 ? 'acknowledge' : 'thoughtful', look, 1.1);
            this.playerWatchNextReaction += 8;
        }
    }
    openEquipment() {
        const e = this.equipment;
        const actions = [
            { title: 'Willow 100', subtitle: 'Forgiving frame · 20 club funds', run: () => this.buyFrame('Willow 100', 20) },
            { title: 'Cedar 98', subtitle: 'Precise frame · 20 club funds', run: () => this.buyFrame('Cedar 98', 20) },
            { title: 'Softer strings', subtitle: 'Multifilament · 12 club funds', run: () => this.buyString('Multifilament', 12) },
            { title: 'Firm strings', subtitle: 'Soft poly · 12 club funds', run: () => this.buyString('Soft poly', 12) },
            { title: 'Tension −2 lb', subtitle: 'More launch', run: () => { e.tension = Math.max(44, e.tension - 2); this.openEquipment(); void this.save(); } },
            { title: 'Tension +2 lb', subtitle: 'More control', run: () => { e.tension = Math.min(60, e.tension + 2); this.openEquipment(); void this.save(); } }
        ];
        this.ui.showContext('PRO SHOP', 'Racket bench', `${e.frame} · ${e.string} · ${e.tension} lb`, ['visual customization', 'persistent equipment', 'no hidden rarity tiers'], actions);
    }
    buyFrame(frame, cost) { if (this.coins < cost) {
        this.ui.toast('Not enough club funds yet.');
        return;
    } this.coins -= cost; this.equipment.frame = frame; this.life.addMemory(this.clock.day, `You set up a ${frame}.`); this.ui.toast(`${frame} is now in the bag.`); this.audio.success(); this.openEquipment(); void this.save(); }
    buyString(string, cost) { if (this.coins < cost) {
        this.ui.toast('Not enough club funds yet.');
        return;
    } this.coins -= cost; this.equipment.string = string; this.world.triggerInteraction('stringing'); this.life.addMemory(this.clock.day, `The pro-shop bench restrung your racket with ${string}.`); this.ui.toast(`Restrung with ${string}.`); this.audio.stringing(); this.audio.success(); this.openEquipment(); void this.save(); }
    openBook() {
        const members = this.characters.map(c => { const r = this.relations.get(c.spec.id); const favorite = Object.entries(this.affordances.objects).find(([, h]) => h.favoriteOf.includes(c.id)), memory = this.mind.recall(c.id)[0]; return { mood: this.mind.mood(c.id), intention: c.activity || this.history.intentions.find(i => i.person === c.id)?.text || c.spec.goal, favorite: favorite ? `Your ${this.world.placements.find(p => p.id === favorite[0])?.type ?? 'quiet corner'}` : undefined, personalMemory: memory?.detail, possessions: this.mind.possessions.filter(p => p.owner === c.id).map(p => `${p.kind === 'wateringCan' ? 'Watering can' : p.kind} · ${p.uses ? 'part of a familiar ritual' : 'a familiar belonging'}`), name: c.spec.name, role: c.spec.role, tier: this.relations.label(c.spec.id), familiarity: r.familiarity, warmth: r.warmth, trust: r.trust, goal: c.spec.goal, quirk: c.spec.quirk ?? '', memories: [...r.memories, ...this.characters.filter(o => o.id !== c.id).flatMap(o => this.relations.getBetween(c.id, o.id).memories)].slice(0, 8) }; });
        this.audio.paper();
        this.ui.showBook({ culture: this.mind.cultureDescription(), philosophy: this.coachingIdentity(), mikaProgress: this.mikaProgress, equipment: this.equipment, coins: Math.floor(this.coins), day: this.clock.day, time: this.clock.formatted(), weather: this.world.weather, heart: this.clubHeart, coachLevel: this.coachLevel, coachXP: this.coachXP, bestRally: this.rally.bestRally, placements: this.world.placements.length, goals: this.daily.goals, moments: [...Array.from(this.lifeRuns.values()).map(r => 'Happening now · ' + r.scene.title), ...this.history.intentions.map(i => i.text), ...this.life.memories], members });
        this.audio.click();
    }
    openFurniture(p) {
        const h = this.affordances.objects[p.id], def = DECOR_BY_ID[p.type], favorites = h?.favoriteOf.map(id => this.actor(id).spec.name).join(', ');
        this.ui.showContext('YOUR ACADEMY', def.label, favorites ? `A favorite place for ${favorites}.` : h?.memories[0] ?? 'A new place for a club ritual.', this.affordances.affordances(p), [
            { title: 'Move', subtitle: 'Keep this object’s history', run: () => { if (this.activities.reserved(p.id)) {
                    this.ui.toast('Let their break finish first.');
                    return;
                } this.movingPlacement = p.id; this.ui.closeContext(); this.ui.toast('Tap a free floor tile. Escape cancels.'); } },
            { title: 'Rotate left', subtitle: 'Turn 22.5° without moving it', run: () => this.rotateFurniture(p, -1) },
            { title: 'Rotate right', subtitle: 'Turn 22.5° without moving it', run: () => this.rotateFurniture(p, 1) },
            { title: 'Return to catalog', subtitle: 'Full refund; clears this place’s history', run: () => { if (this.activities.reserved(p.id)) {
                    this.ui.toast('Someone is using this place.');
                    return;
                } this.world.placements = this.world.placements.filter(v => v !== p); for (const e of this.mind.events)
                    if (e.kind === 'move' && e.place === p.id)
                        e.pending = []; this.coins += def.cost; this.affordances.sync(this.world.placements, this.clock.day); this.rebuildFurnitureObstacles(); this.ui.closeContext(); void this.save(); } }
        ]);
    }
    rotateBuild(direction, fine = false) { if (!this.buildType)
        return; const step = fine ? Math.PI / 24 : DECOR_BY_ID[this.buildType].rotationStep, tau = Math.PI * 2; this.buildRotation = (this.buildRotation + direction * step + tau) % tau; }
    rotateFurniture(p, direction) {
        if (this.activities.reserved(p.id)) {
            this.ui.toast('Let their break finish first.');
            return;
        }
        const step = DECOR_BY_ID[p.type].rotationStep, tau = Math.PI * 2, next = ((p.rotation ?? 0) + direction * step + tau) % tau;
        if (!this.placementClear(p.type, p.x, p.z, next, p.id)) {
            this.ui.toast('That rotation would crowd another object.');
            return;
        }
        p.rotation = next;
        this.rebuildFurnitureObstacles();
        this.audio.click();
        void this.save();
        this.openFurniture(p);
    }
    furnitureObstacles = [];
    rebuildFurnitureObstacles() {
        this.world.nav.obstacles = this.world.nav.obstacles.filter(o => !this.furnitureObstacles.includes(o));
        this.furnitureObstacles = this.world.placements.filter(p => DECOR_BY_ID[p.type].blocksNavigation).map(p => { const f = rotatedFootprint(p.type, p.rotation ?? 0); return { x: p.x, z: p.z, w: f.w, d: f.d }; });
        this.world.nav.obstacles.push(...this.furnitureObstacles);
        for (const c of [...this.characters, this.player])
            if (c.pathIndex < c.path.length) {
                const target = c.path[c.path.length - 1];
                c.goTo(target, c.state === 'walk' ? 'watch' : c.state);
            }
    }
    moveFurniture(id, x, z) {
        const p = this.world.placements.find(p => p.id === id);
        if (!p)
            return;
        const xx = Math.round(x * 2) / 2, zz = Math.round(z * 2) / 2, rotation = p.rotation ?? 0;
        if (this.activities.reserved(id) || !this.placementClear(p.type, xx, zz, rotation, id) || this.placementNearPerson(p.type, xx, zz, rotation)) {
            this.ui.toast('Choose a free patch of floor away from people.');
            return;
        }
        p.x = xx;
        p.z = zz;
        const revision = this.affordances.moved(id);
        for (const person of this.affordances.objects[id]?.favoriteOf ?? []) {
            if (!MEMBERS.includes(person))
                continue;
            this.mind.recordEvent({ id: `move:${id}:${revision}:${person}`, kind: 'move', subject: person, day: this.clock.day, place: id, detail: `The familiar ${DECOR_BY_ID[p.type].label.toLowerCase()} moved to another part of the club.`, importance: .5 }, Object.fromEntries(this.characters.map(c => [c.id, c.position])), new Set(), () => false);
        }
        this.rebuildFurnitureObstacles();
        this.movingPlacement = null;
        this.ui.toast('Moved, with its history intact.');
        void this.save();
    }
    playerAvatar = null;
    choosePlayerAvatar(id) {
        this.playerAvatar = id;
        this.player.spec = playerSpec(id);
        this.ui.closeContext();
        this.camera.focus(this.player.position.x, this.player.position.z, 22);
        this.ui.toast(`${this.player.spec.name} · Welcome to your club.`);
        void this.save();
    }
    openAvatarPicker() {
        this.ui.showContext('YOUR CHARACTER', 'Who’s arriving at Rally House?', 'Choose your look. You can switch anytime in Settings.', [], [
            { title: 'Taylor', subtitle: 'Long dark hair · navy-and-gold cat ears · turquoise charm', run: () => this.choosePlayerAvatar('taylor') },
            { title: 'Arjan', subtitle: 'Swept dark hair · strong brows · charcoal tenniswear', run: () => this.choosePlayerAvatar('arjan') }
        ]);
    }
    openSettings() {
        this.ui.showContext('COMFORT', 'Make yourself comfortable', 'Your character, camera motion and sound are yours to adjust.', [], [
            { title: `Character: ${this.playerAvatar ? this.player.spec.name : 'choose your look'}`, subtitle: 'Play as Taylor or Arjan', run: () => this.openAvatarPicker() },
            { title: `Visuals: ${this.settings.visuals === 'auto' ? 'adaptive' : 'full detail'}`, subtitle: 'Keep lighting and geometry; adapt pixel resolution on slower devices', run: () => { this.settings.visuals = this.settings.visuals === 'auto' ? 'detail' : 'auto'; this.renderer.renderScale = 1; this.frameSamples = []; this.openSettings(); void this.save(); } },
            { title: this.settings.reducedMotion ? 'Motion: reduced' : 'Motion: full', subtitle: 'Reduce camera and environmental motion', run: () => { this.settings.reducedMotion = !this.settings.reducedMotion; this.openSettings(); void this.save(); } },
            { title: `Volume: ${Math.round(this.settings.volume * 100)}%`, subtitle: 'Cycle muted, quiet, medium, full', run: () => { const levels = [0, .3, .65, 1]; this.settings.volume = levels[(levels.indexOf(this.settings.volume) + 1) % 4]; this.audio.volume = this.settings.volume; this.openSettings(); void this.save(); } }
        ]);
    }
    staticPlacementBlocked(x, z) {
        if (x < this.world.nav.minX || x > this.world.nav.maxX || z < this.world.nav.minZ || z > this.world.nav.maxZ)
            return true;
        return this.world.nav.obstacles.some(o => !this.furnitureObstacles.includes(o) && x > o.x - o.w / 2 - .22 && x < o.x + o.w / 2 + .22 && z > o.z - o.d / 2 - .22 && z < o.z + o.d / 2 + .22);
    }
    placementNearPerson(type, x, z, rotation = 0) {
        const f = rotatedFootprint(type, rotation);
        return [...this.characters, this.player].some(c => Math.abs(c.position.x - x) < f.w / 2 + .42 && Math.abs(c.position.z - z) < f.d / 2 + .42);
    }
    placementClear(type, x, z, rotation = 0, ignoreId) {
        if (!this.world.canPlace(x, z, type, rotation, ignoreId))
            return false;
        const f = rotatedFootprint(type, rotation);
        for (const dx of [-f.w / 2, 0, f.w / 2])
            for (const dz of [-f.d / 2, 0, f.d / 2]) {
                const xx = x + dx, zz = z + dz;
                if (this.staticPlacementBlocked(xx, zz) || (xx > -3.8 && xx < 5.8 && zz > -6.6 && zz < 6.6))
                    return false;
            }
        return true;
    }
    place(type, x, z) {
        const def = DECOR_BY_ID[type];
        if (!def)
            return;
        x = Math.round(x * 2) / 2;
        z = Math.round(z * 2) / 2;
        const cost = def.cost;
        if (this.coins < cost) {
            this.ui.toast('Not enough club funds yet. Coach a lesson to earn more.');
            return;
        }
        if (!this.placementClear(type, x, z, this.buildRotation) || this.placementNearPerson(type, x, z, this.buildRotation)) {
            this.ui.toast('That spot is a little crowded.');
            return;
        }
        this.coins -= cost;
        this.world.placements.push({ type, x, z, rotation: this.buildRotation });
        this.affordances.sync(this.world.placements, this.clock.day);
        this.history.nextObject = this.absoluteMinute;
        this.mind.reinforceCulture(def.culture, .025);
        this.rebuildFurnitureObstacles();
        this.buildType = null;
        this.buildRotation = 0;
        this.ui.clearBuildSelection();
        this.recordGoal('decorate');
        this.life.addMemory(this.clock.day, `You added a ${def.label.toLowerCase()} to the academy.`);
        this.ui.toast('Placed. The club feels a little more yours.');
        this.audio.success();
        void this.save();
    }
    recordGoal(kind) { this.daily.ensureDay(this.clock.day); const before = this.daily.doneCount; this.daily.record(kind); if (this.daily.doneCount > before)
        this.ui.showMoment('A gentle intention', 'Done. Nothing resets if you leave.'); const reward = this.daily.claim(); if (reward > 0) {
        this.coins += reward;
        this.life.addMemory(this.clock.day, `The day’s three gentle intentions came together. +${reward} club funds.`);
        this.ui.showMoment('Morning complete', `+${reward} club funds. No streak. No timer. The rest of the day is yours.`);
        this.audio.success();
    } this.updateObjective(); }
    updateObjective() {
        this.daily.ensureDay(this.clock.day);
        const phase = this.clock.minutes < 495 || this.clock.minutes >= 1280 ? 'After hours' : this.clock.minutes < 720 ? 'Morning' : this.clock.minutes < 1020 ? 'Afternoon' : 'Evening';
        const court = this.activities.active.find(a => a.resource === 'court'), intention = this.history.intentions.find(i => i.kind === 'rematch');
        this.ui.setObjective(`Day ${this.clock.day} · ${phase} at Rally House`, court?.detail ?? intention?.text ?? 'Follow a member, build a corner, or simply watch.');
    }
    get coachLevel() { return this.coachXP >= 90 ? 'Academy mentor' : this.coachXP >= 55 ? 'Trusted club coach' : this.coachXP >= 25 ? 'Club coach' : 'Assistant coach'; }
    get clubHeart() { const social = this.characters.reduce((sum, c) => sum + this.relations.get(c.spec.id).familiarity + this.relations.get(c.spec.id).warmth * .5, 0); return Math.min(5, Math.max(1, 1 + Math.floor((social + this.mikaProgress + this.coachXP + this.world.placements.length * 12) / 170))); }
    get absoluteMinute() { return this.clock.day * 1440 + this.clock.minutes; }
    actor(id) { return id === 'player' ? this.player : this.byId(id); }
    routes = new Map();
    waitingForPlace = new Map();
    startActivity(kind, ids, resource, targets, detail = '') {
        if (ids.includes('player'))
            this.stopPlayerWatching(false);
        if (targets.some(p => this.world.nav.isBlocked(p.x, p.z)))
            return null;
        const paths = targets.map((p, i) => this.world.nav.clubPath(this.actor(ids[i]).position, p));
        if (paths.some((p, i) => !p.length && Vec3.sub(this.actor(ids[i]).position, targets[i]).len() > .6))
            return null;
        const a = this.activities.begin(kind, ids, resource, detail);
        if (!a)
            return null;
        this.routes.set(a.id, targets);
        ids.forEach((id, i) => { this.routineNotices.delete(id); this.waitingForPlace.delete(id); const c = this.actor(id); c.goTo(targets[i], 'watch'); c.activity = detail || kind; c.setConversationPartner(undefined); c.acting.setRole('approach'); });
        return a;
    }
    releaseActivity(a) {
        this.lifeRuns.delete(a.id);
        if (this.speechOwner === a.id) {
            this.speechOwner = null;
            this.ui.hideSpeech();
            this.activeSpeechId = null;
        }
        if (a.resource === 'court') {
            this.rally.stop();
            this.socialRally.stop();
            this.byId('mika').practiceCue = '';
            this.evidence.practicing = false;
        }
        for (const id of a.participants) {
            const c = this.actor(id);
            c.currentScheduleIndex = -1;
            c.clearCourtMove();
            c.clearShotIntent();
            c.path = [];
            c.setLook(undefined);
            c.setConversationPartner(undefined);
            c.setAnimation('idle');
            c.seatDepth = 0;
            c.socialGesture = 'none';
            c.socialProp = null;
            c.racketStowed = false;
            c.acting.setRole('exit');
        }
        this.routes.delete(a.id);
        this.lessonActive = false;
    }
    cancelActivity(a, retry = false) { if (a.kind === 'lesson') {
        this.traceCoaching('cancelled', { id: a.id, retry, phase: a.phase, seconds: a.phaseTime, positions: a.participants.map(id => ({ id, position: this.actor(id).position, path: this.actor(id).path, index: this.actor(id).pathIndex })) });
        if (retry)
            this.queuedLesson = this.lessonKeys?.get(a.id) ?? this.queuedLesson;
        this.lessonKeys?.delete(a.id);
    } this.telemetry.cancellations++; const run = this.lifeRuns.get(a.id); if (run)
        this.everyday.failed(run.scene); this.activities.cancel(a, 'Interrupted safely; no completion rewards.'); this.releaseActivity(a); }
    startMatch() {
        const a = this.startActivity('match', ['leo', 'mika'], 'court', [destinations.courtNorth, destinations.courtSouth], this.history.matches.length ? 'Another friendly challenge' : 'First shared court');
        if (a) {
            this.ui.toast(this.history.matches.length ? 'Leo and Lucresia are heading back to court.' : 'Lucresia asked Leo to hit. You can keep building.');
            this.history.nextSocial = this.absoluteMinute + 150;
        }
        return a;
    }
    startBreak(object, companion = 'mika', host = 'nia') {
        if (host === companion)
            return null;
        const base = object ? new Vec3(object.x, 0, object.z - .95) : destinations.cafe;
        const hostName = this.actor(host).spec.name, companionName = this.actor(companion).spec.name;
        const a = this.startActivity(object ? 'object' : 'tea', [host, companion], object?.id ?? 'cafe-table', [new Vec3(base.x - .55, 0, base.z), new Vec3(base.x + .55, 0, base.z)], object ? `${hostName} and ${companionName} found a quiet spot` : `${hostName} and ${companionName} shared a break`);
        if (a) {
            this.history.nextObject = this.absoluteMinute + 85 + ((host.charCodeAt(0) + companion.charCodeAt(0)) % 35);
        }
        return a;
    }
    completeActivity(a) {
        let text = '';
        if (a.phase !== 'resolving' || !this.activities.active.includes(a))
            return;
        this.activities.finish(a, a.kind, () => {
            if (a.kind === 'everyday') {
                const run = this.lifeRuns.get(a.id);
                if (run.scene.family === 'watch-court' && !run.sawCourt)
                    run.scene.memory = `${this.actor(run.scene.people[0]).spec.name} reached the court after the game had ended.`;
                text = run.scene.memory;
                if (this.everyday.completed(run.scene, run.id, this.clock.day, run.matchId, run.interrupted)) {
                    const ids = run.scene.people;
                    this.mind.complete(run.scene, run.id, this.clock.day);
                    this.telemetry.completed(run.scene, this.clock.day, this.clock.minutes, run.why ?? 'Available authored opportunity', this.mind.mood(ids[0]), !!run.objectId && this.affordances.objects[run.objectId]?.favoriteOf.includes(ids[0]));
                    for (let i = 0; i < ids.length; i++)
                        for (let j = i + 1; j < ids.length; j++)
                            this.relations.interactBetween(ids[i], ids[j], motiveFor(run.scene) === 'advice' ? 'coach' : 'listen', this.clock.day, text);
                    if (run.scene.id === 'bench-room') {
                        this.mind.states.leo.tone = Math.max(0, this.mind.states.leo.tone - .06);
                        const bond = this.relations.getBetween('mika', 'leo');
                        bond.warmth = Math.max(0, bond.warmth - 2);
                    }
                    if (run.scene.id === 'bench-reconnect')
                        this.mind.states.leo.tone = Math.min(1, this.mind.states.leo.tone + .06);
                    if (run.objectId)
                        this.affordances.visit(run.objectId, ids, this.clock.day);
                }
            }
            else if (a.kind === 'lesson') {
                this.traceCoaching('completed', { id: a.id, reps: this.evidence.reps.length });
                this.lessonKeys?.delete(a.id);
                const result = this.evidence.result();
                const prior = this.mikaProgress;
                this.mikaProgress = Math.min(100, this.mikaProgress + result.gain);
                const mika = this.byId('mika');
                mika.setDevelopment(this.mikaProgress);
                if (result.gain) {
                    if (this.evidence.cue === 'preparation')
                        this.development.preparation = Math.min(.08, this.development.preparation + .007 * result.gain);
                    if (this.evidence.cue === 'recovery')
                        this.development.recovery = Math.min(.8, this.development.recovery + .07 * result.gain);
                }
                mika.preparationBonus = this.development.preparation;
                mika.recoveryBonus = this.development.recovery;
                this.coachXP += result.gain ? 4 : 1;
                this.coins += LESSON_FEE;
                text = `Lucresia completed eight practice contacts: ${result.after.clean} clean. ${result.gain ? 'The cue gave her something to keep.' : 'Contessa will try a different cue next time.'}`;
                this.relations.interact('mika', 'coach', this.clock.day, text);
                this.relations.interactBetween('coach', 'mika', 'coach', this.clock.day, text);
                this.recordGoal('coach');
                if (!this.history.breakthrough && result.breakthrough && prior >= 35 && this.mikaProgress >= 45) {
                    this.history.breakthrough = true;
                    this.stars = Math.max(this.stars, 4);
                    this.relations.remember('mika', { type: 'breakthrough', day: this.clock.day, people: ['player', 'mika', 'coach'], tags: ['coach', 'breakthrough'], strength: 1, sentiment: .9, place: 'court', subject: 'early turn', detail: 'After struggling, Lucresia kept the early turn through a completed practice block.' });
                    text += ' Contessa keeps this lesson’s ball.';
                }
                this.history.addIntention({ id: 'test-cue', person: 'mika', kind: 'practice', notBefore: this.absoluteMinute + 30, text: 'Lucresia wants to try the cue with Leo.' });
                this.history.nextSocial = this.absoluteMinute + 25;
                this.mind.coaching(this.evidence.cue, result.gain);
                this.recordLifeEvent(a, 'lesson', 'mika', text, undefined, this.history.breakthrough && result.breakthrough ? 1 : .8);
                this.ui.showMoment(result.gain ? 'A cue worth keeping' : 'A useful diagnosis', `${text} +${LESSON_FEE} club funds for the completed lesson.`);
            }
            else if (a.kind === 'match') {
                const r = this.socialRally, score = { ...r.score };
                const winner = (score.mika ?? 0) === (score.leo ?? 0) ? 'draw' : (score.mika ?? 0) > (score.leo ?? 0) ? 'mika' : 'leo';
                const first = this.history.record({ id: a.id, day: this.clock.day, winner, score, longest: r.bestRally, contacts: r.sessionHits, errors: { ...r.errors } });
                text = `Lucresia ${score.mika ?? 0} · Leo ${score.leo ?? 0}. ${winner === 'draw' ? 'They finish level.' : winner === 'mika' ? 'Lucresia takes their practice game.' : 'Leo takes their practice game.'} Longest rally: ${r.bestRally}.`;
                const rel = this.relations.interactBetween('mika', 'leo', 'rally', this.clock.day, text);
                rel.rivalry = Math.min(100, rel.rivalry + 6);
                this.relations.rememberBetween('mika', 'leo', { type: first ? 'first_win' : 'match_result', day: this.clock.day, people: ['mika', 'leo'], tags: ['tennis', 'match', 'rematch', ...(first ? ['first_win'] : [])], strength: first ? 1 : .8, sentiment: .6, place: 'court', subject: winner, detail: text });
                this.history.intentions = this.history.intentions.filter(i => i.id !== 'test-cue');
                this.history.nextSocial = this.absoluteMinute + 180;
                this.recordLifeEvent(a, 'match', winner === 'leo' ? 'leo' : 'mika', text, winner, first ? 1 : .8);
                this.ui.showMoment(first ? 'Lucresia’s first win' : 'A shared court', text);
            }
            else if (a.kind === 'object' || a.kind === 'tea') {
                const object = this.world.placements.find(p => p.id === a.resource), host = a.participants[0], companion = a.participants[1], hostName = this.actor(host).spec.name, companionName = this.actor(companion).spec.name;
                const beforeFavorites = object?.id ? [...(this.affordances.objects[object.id]?.favoriteOf ?? [])] : [];
                text = object ? `${hostName} and ${companionName} took a break by your ${object.type}.` : `${hostName} and ${companionName} shared a cup.`;
                this.relations.interactBetween(host, companion, 'matcha', this.clock.day, text);
                if (object?.id) {
                    this.affordances.visit(object.id, a.participants, this.clock.day);
                    const after = this.affordances.objects[object.id]?.favoriteOf ?? [];
                    const newFavorite = after.find(id => !beforeFavorites.includes(id));
                    if (newFavorite) {
                        const who = this.actor(newFavorite).spec.name;
                        text += ` ${who} has started treating this as a favorite spot.`;
                        this.life.addMemory(this.clock.day, `${who} adopted the ${object.type} as a favorite place.`);
                    }
                }
                if (a.participants.includes('mika'))
                    this.history.intentions = this.history.intentions.filter(i => i.id !== 'after-court');
                this.mind.complete({ id: a.kind, title: a.detail, people: a.participants, place: object?.id ?? 'cafe', motive: 'company', beats: [], memory: text }, a.id, this.clock.day);
                if (a.kind === 'tea')
                    this.audio.cup();
            }
            else if (a.kind === 'greeting' || a.kind === 'matcha') {
                const c = this.actor(a.participants[1]);
                text = a.kind === 'matcha' ? `You and ${c.spec.name} shared matcha.` : `You made time to listen to ${c.spec.name}.`;
                this.interact(c, a.kind === 'matcha' ? 'matcha' : 'listen', text);
                this.recordGoal(a.kind === 'matcha' ? 'matcha' : 'greet');
            }
            else {
                text = `Contessa and Lucresia finished a practice rally of ${this.rally.bestRally} contacts.`;
                this.recordGoal('watch');
            }
            if (a.kind !== 'everyday') {
                const people = a.participants.filter(id => MEMBERS.includes(id));
                if (people.length)
                    this.telemetry.completed({ id: a.kind, title: a.detail, people, place: a.resource, objectId: this.world.placements.some(p => p.id === a.resource) ? a.resource : undefined, beats: [], memory: text }, this.clock.day, this.clock.minutes, a.kind === 'lesson' ? 'Player requested a completed lesson' : a.kind === 'match' ? 'Court opportunity and challenge readiness' : a.kind === 'object' || a.kind === 'tea' ? 'Relationship and place preference' : a.detail === 'Morning practice' ? 'Opening club routine' : 'Player invitation', this.history.intentions.find(i => people.includes(i.person))?.text ?? 'Return to the day');
            }
            this.telemetry.memoryCount = this.mind.memories.length;
            this.life.addMemory(this.clock.day, text);
        });
        a.result = text;
        const receipt = this.activities.history.find(r => r.id === a.id);
        if (receipt)
            receipt.result = text;
        const winner = a.kind === 'match' ? this.history.matches[0]?.winner : null;
        this.releaseActivity(a);
        if (winner && winner !== 'draw') {
            this.actor(winner).react('proud', this.actor(winner === 'mika' ? 'leo' : 'mika').position, 22);
            this.actor(winner === 'mika' ? 'leo' : 'mika').react('disappointed', this.actor(winner).position, 18);
            const witnessed = this.mind.events.find(e => e.id === a.id)?.witnesses ?? [];
            for (const id of witnessed) {
                const observer = this.actor(id);
                if (!this.activities.busy(id)) {
                    observer.react(id === 'coach' ? 'thoughtful' : 'encouraging', this.actor(winner).position, 12);
                }
            }
        }
        else if (a.kind === 'lesson') {
            this.actor('mika').react('relieved', this.actor('coach').position, 14);
            this.actor('coach').react('acknowledge', this.actor('mika').position, 12);
        }
        void this.save();
    }
    coachingIdentity() {
        const entries = Object.entries(this.mind.philosophy).sort((a, b) => b[1] - a[1]);
        if (!entries.length)
            return 'Your coaching style will emerge from the lessons you finish.';
        const names = { preparation: 'early preparation', spacing: 'room around contact', recovery: 'movement and recovery', rhythm: 'a calmer rally rhythm' };
        return `Your completed lessons have emphasized ${names[entries[0][0]] ?? 'patient practice'}.`;
    }
    recordLifeEvent(a, kind, subject, detail, winner, importance = .8) {
        const witnesses = this.mind.recordEvent({ id: a.id, kind, subject, detail, winner, importance, day: this.clock.day, place: 'court' }, Object.fromEntries(this.characters.map(c => [c.id, c.position])), new Set(this.characters.filter(c => !this.activities.busy(c.id) || this.activities.active.some(a => a.participants.includes(c.id) && a.phase !== 'traveling' && this.lifeRuns.get(a.id)?.scene.family === 'watch-court')).map(c => c.id)), (a, b) => this.world.nav.clearSegment(a, b));
        for (const id of witnesses) {
            const c = this.actor(id);
            if (!this.activities.busy(id) && c.pathIndex < c.path.length) {
                this.routineNotices.set(id, { target: c.path[c.path.length - 1].clone(), after: 'watch', activity: c.activity, remaining: .6 });
                c.path = [];
                c.setAnimation('watch');
            }
            c.react(kind === 'match' ? 'acknowledge' : 'thoughtful', this.actor(subject).position, 10);
        }
    }
    sceneContext() {
        return { day: this.clock.day, minute: this.clock.minutes, weather: this.world.weather, free: new Set(this.characters.filter(c => !this.activities.busy(c.id)).map(c => c.id)), positions: Object.fromEntries(this.characters.map(c => [c.id, c.position])), schedule: Object.fromEntries(this.characters.map(c => [c.id, schedules[c.id]?.[c.currentScheduleIndex]?.destination ?? ''])), intentions: this.history.intentions, relationship: (a, b) => this.relations.getBetween(a, b), favorite: (id, object) => !!object && !!this.affordances.objects[object]?.favoriteOf.includes(id), objects: this.world.placements, courtActive: this.socialRally.enabled && this.socialRally.sessionHits < 30, usualKnown: (this.everyday.counts.usual ?? 0) > 0, available: scene => {
                const object = scene.objectId ? this.world.placements.find(p => p.id === scene.objectId) : scene.place === 'built-bench' ? this.world.placements.find(p => p.type === 'bench' && !this.activities.reserved(p.id)) : undefined;
                if ((scene.objectId || scene.place === 'built-bench' || scene.place === 'built-object') && !object)
                    return false;
                const base = object ? new Vec3(object.x, 0, object.z - 1) : destinations[scene.place];
                const resource = object?.id ?? (['cafe', 'cafeTable'].includes(scene.place) ? 'cafe-table' : `place-${scene.place}`);
                return !!base && !this.world.nav.isBlocked(base.x, base.z) && !this.activities.reserved(resource);
            } };
    }
    quietLife() {
        for (const c of this.characters) {
            if (this.activities.busy(c.id) || this.routineNotices.has(c.id) || c.acting.settling)
                continue;
            if (c.pathIndex < c.path.length) {
                const learner = this.actor('mika'), learning = this.activities.active.some(a => a.participants.includes('mika') && (a.kind === 'lesson' || (this.lifeRuns.get(a.id) && motiveFor(this.lifeRuns.get(a.id).scene) === 'practice')));
                if (c.id === 'coach' && learning && Vec3.sub(c.position, learner.position).len() < 4 && this.world.nav.clearSegment(c.position, learner.position) && this.mind.time - (this.lastNotice.get(c.id) ?? -200) > 100) {
                    this.routineNotices.set(c.id, { target: c.path[c.path.length - 1].clone(), after: schedules[c.id]?.[c.currentScheduleIndex]?.animation ?? 'watch', activity: c.activity, remaining: 3 });
                    this.lastNotice.set(c.id, this.mind.time);
                    c.path = [];
                    c.setAnimation('watch');
                    c.setLook(learner.position);
                    c.activity = 'Pausing to watch Lucresia, then carrying on';
                    this.telemetry.interruptions++;
                }
                continue;
            }
            const id = c.id, place = schedules[id]?.[c.currentScheduleIndex]?.destination;
            c.socialProp = null;
            c.socialGesture = 'none';
            if (c.state === 'coachFeed') {
                c.setAnimation('watch');
                c.activity = 'Inspecting the court';
            }
            if (id === 'coach' && place === 'cafeTable') {
                c.socialProp = 'notebook';
                c.socialGesture = 'inspect';
            }
            if (id === 'leo' && ['proshop', 'gearWall', 'stringing'].includes(place ?? '')) {
                c.socialGesture = 'inspect';
                c.setAnimation('watch');
            }
            if (id === 'nia' && place === 'cafe') {
                c.socialProp = 'cup';
                c.socialGesture = 'offer';
            }
            if (c.state === 'talk')
                c.setAnimation('watch');
            const other = this.characters.filter(o => o !== c && Vec3.sub(o.position, c.position).len() < 2.5).sort((a, b) => this.relations.getBetween(id, b.id).warmth - this.relations.getBetween(id, a.id).warmth)[0];
            c.setLook(other?.position);
            c.acting.requestMicro(c.socialProp ?? (['proshop', 'gearWall', 'stringing'].includes(place ?? '') ? 'gear' : place === 'warmup' ? 'warmup' : ''));
            const state = this.mind.states[id];
            if (state.energy < .35)
                c.setEmotion('tired', 1.2);
            else if (state.confidence < .42)
                c.setEmotion('attentive', 1.2);
        }
    }
    lifeContext() { return { free: new Set(this.characters.filter(c => !this.activities.busy(c.id)).map(c => c.id)), minute: this.clock.minutes, day: this.clock.day, weather: this.world.weather, match: this.history.matches[0], warmth: (a, b) => this.relations.getBetween(a, b).warmth, hasBench: this.world.placements.some(p => p.type === 'bench' && !this.activities.reserved(p.id)) }; }
    startEveryday(scene) {
        const object = scene.objectId ? this.world.placements.find(p => p.id === scene.objectId) : scene.place === 'built-bench' ? this.world.placements.find(p => p.type === 'bench' && !this.activities.reserved(p.id)) : undefined;
        if (scene.objectId && !object) {
            this.everyday.failed(scene);
            return null;
        }
        const base = object ? new Vec3(object.x, 0, object.z - 1) : destinations[scene.place];
        if (!base) {
            this.everyday.failed(scene);
            return null;
        }
        const bond = scene.people.length === 2 ? this.relations.getBetween(...scene.people) : null;
        const gap = deriveActing(this.mind.states[scene.people[0]], bond ?? undefined, scene.people[0]).personalDistance / 2;
        const offsets = scene.people.length === 1 ? [0] : scene.people.length === 3 ? [-.8, .8, 0] : object?.type === 'bench' ? (bond && bond.warmth >= 40 ? [-.56, .56] : [-.62, .62]) : [-gap, gap];
        const targets = offsets.map((x, i) => scene.people.length === 3 ? new Vec3(base.x + x, 0, base.z + (i === 2 ? 1.45 : .2)) : scene.place === 'courtBench' ? new Vec3(base.x, 0, base.z + x) : new Vec3(base.x + x, 0, base.z));
        const resource = object?.id ?? (scene.place === 'cafe' || scene.place === 'cafeTable' ? 'cafe-table' : `place-${scene.place}`);
        const a = this.startActivity('everyday', scene.people, resource, targets, scene.title);
        if (!a) {
            this.everyday.failed(scene);
            return null;
        }
        for (const id of scene.people)
            this.actor(id).racketStowed = !['grip', 'gear-advice', 'small-win', 'counting'].includes(scene.id);
        this.lifeRuns.set(a.id, { scene, id: this.everyday.started(scene), beat: -1, age: 0, pause: 0, matchId: this.history.matches[0]?.id, objectId: object?.id, why: this.mind.chosen?.scene === scene.id ? Object.entries(this.mind.chosen.factors).filter(([, v]) => v > .08).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k]) => k).join(', ') : 'An authored opportunity' });
        return a;
    }
    playLifeBeat(a, beat) {
        const run = this.lifeRuns.get(a.id);
        const seat = run.objectId ? this.world.placements.find(p => p.id === run.objectId) : undefined;
        const seated = seat?.type === 'bench' && ['rest', 'company', 'witness', 'celebrate'].includes(motiveFor(run.scene));
        for (const id of a.participants) {
            const c = this.actor(id), other = beat.speaker && beat.speaker !== id ? beat.speaker : a.participants.find(p => p !== id);
            c.acting.setRole(beat.speaker === id ? 'speak' : beat.speaker ? 'listen' : 'pause');
            c.socialGesture = beat.gestures?.[id] ?? 'none';
            c.socialProp = null;
            if (seated)
                c.seatDepth = .8;
            c.setAnimation(seated ? 'sit' : beat.poses?.[id] ?? 'watch');
            c.setEmotion(beat.emotions?.[id] ?? (beat.gestures?.[id] === 'laugh' ? 'amused' : this.mind.states[id].energy < .35 ? 'tired' : this.mind.states[id].tone < .4 ? 'disappointed' : 'attentive'), beat.seconds);
            if (seated)
                c.face(new Vec3(c.position.x, 0, c.position.z - 2));
            if (other) {
                if (!seated)
                    c.face(this.actor(other).position);
                c.setLook(this.actor(other).position);
            }
            else {
                const object = run.objectId ? this.world.placements.find(p => p.id === run.objectId) : undefined;
                const target = run.scene.family === 'watch-court' ? new Vec3(1, 0, 0) : object && object.type !== 'bench' ? new Vec3(object.x, 0, object.z) : run.scene.place === 'bonsai' ? new Vec3(10.2, 0, 3.9) : new Vec3(c.position.x, 0, c.position.z - 1);
                if (!seated)
                    c.face(target);
            }
        }
        if (beat.prop) {
            const id = beat.speaker ?? a.participants[0];
            this.actor(id).socialProp = beat.prop;
        }
        if (beat.line && beat.speaker) {
            const c = this.actor(beat.speaker);
            this.activeSpeechId = c.id;
            this.speechOwner = a.id;
            const duration = 0;
            this.speechUntil = Infinity;
            let text = beat.line;
            if (run.beat === 0 && run.scene.family === 'shared-break') {
                const partner = run.scene.people.find(id => id !== c.id);
                const composed = this.dialogue.compose({ core: text, speaker: c.id, partner, topic: 'company', now: this.everyday.time, relationship: this.relations.getBetween(c.id, partner), memory: this.mind.recall(c.id, { topic: 'company', partner })[0], favoriteId: run.objectId && this.affordances.objects[run.objectId]?.favoriteOf.includes(c.id) ? run.objectId : undefined });
                text = composed.text;
                this.dialogue.commit(composed, this.everyday.time);
            }
            this.ui.showSpeech(c.spec.name, text, duration);
        }
        if (!beat.line && this.speechOwner === a.id) {
            this.ui.hideSpeech();
            this.activeSpeechId = null;
        }
        if (beat.effect === 'cup')
            this.audio.cup();
        if (beat.effect === 'water') {
            this.world.triggerInteraction(run.scene.place === 'bonsai' ? 'bonsai' : 'water');
            this.audio.watering();
        }
        if (Object.values(beat.gestures ?? {}).includes('laugh'))
            this.audio.chuckle();
        if (run.scene.id === 'bench-room' && beat.gestures?.leo === 'offer') {
            const c = this.actor('leo'), target = c.position.clone().add(new Vec3(.22, 0, 0));
            if (run.objectId) {
                for (const id of a.participants) {
                    const person = this.actor(id);
                    person.seatDepth = .8;
                    person.face(new Vec3(person.position.x, 0, person.position.z - 2));
                    person.setAnimation('sit');
                }
            }
            if (!this.world.nav.isBlocked(target.x, target.z))
                c.goTo(target, run.objectId ? 'sit' : 'watch');
        }
    }
    interruptEveryday(a, cause) {
        const run = this.lifeRuns.get(a.id);
        if (!run || run.interrupted)
            return;
        run.pause = 4;
        run.interrupted = cause;
        this.telemetry.interruptions++;
        for (const id of a.participants) {
            const c = this.actor(id);
            c.socialGesture = 'none';
            c.setAnimation('watch');
            c.setLook(cause === 'rally' ? new Vec3(1, 1, 0) : new Vec3(-8, 2, -9));
            c.setEmotion('surprised', 2);
        }
        const c = this.actor(a.participants[0]);
        this.activeSpeechId = c.id;
        this.speechOwner = a.id;
        this.speechUntil = Infinity;
        this.ui.showSpeech(c.spec.name, cause === 'rain' ? 'Oh. There’s the rain.' : 'Hang on—look at this rally.', 0);
    }
    updateEveryday(a, dt) {
        const run = this.lifeRuns.get(a.id);
        if (!run) {
            this.cancelActivity(a);
            return;
        }
        const people = a.participants.map(id => this.actor(id)), targets = this.routes.get(a.id);
        if (a.elapsed > (run.scene.family === 'watch-court' ? 160 : 100) || (run.objectId && !this.world.placements.some(p => p.id === run.objectId))) {
            this.cancelActivity(a);
            return;
        }
        if (a.phase === 'traveling') {
            if (people.every((c, i) => Vec3.sub(c.position, targets[i]).len() < .55 && c.pathIndex >= c.path.length)) {
                this.activities.transition(a, 'starting');
                people.forEach((c, i) => { c.setAnimation('watch'); if (people.length > 1)
                    c.face(people[(i + 1) % people.length].position); c.acting.setRole('orient'); });
            }
            else if (a.phaseTime > 65)
                this.cancelActivity(a);
            return;
        }
        if (a.phase === 'starting' && a.phaseTime >= 1.2) {
            this.activities.transition(a, 'active');
            run.beat = 0;
            run.age = 0;
            this.playLifeBeat(a, run.scene.beats[0]);
        }
        if (a.phase === 'active') {
            if (run.scene.family === 'watch-court' && this.socialRally.enabled) {
                run.sawCourt = true;
                people[0].setLook(this.socialRally.ball.position);
            }
            if (people.length > 1 && Vec3.sub(people[0].position, people[1].position).len() > 2.4) {
                this.cancelActivity(a);
                return;
            }
            if (!run.interrupted && this.socialRally.enabled && this.socialRally.rallyCount >= 12 && run.age > 1 && run.beat > 0 && people.some(c => Vec3.sub(c.position, this.actor('mika').position).len() < 7.5 && this.world.nav.clearSegment(c.position, this.actor('mika').position))) {
                this.interruptEveryday(a, 'rally');
            }
            if (run.pause > 0) {
                run.pause = Math.max(0, run.pause - dt);
                if (run.pause === 0)
                    this.playLifeBeat(a, run.scene.beats[run.beat]);
                return;
            }
            run.age += dt;
            if (run.scene.family === 'watch-court' && run.beat === run.scene.beats.length - 1 && this.socialRally.enabled && a.phaseTime < 95)
                run.age = Math.min(run.age, run.scene.beats[run.beat].seconds - .1);
            if (run.age >= run.scene.beats[run.beat].seconds) {
                run.age = 0;
                run.beat++;
                if (run.beat >= run.scene.beats.length) {
                    this.activities.transition(a, 'resolving');
                    people.forEach(c => { c.socialGesture = 'nod'; c.socialProp = null; c.setAnimation('watch'); });
                }
                else
                    this.playLifeBeat(a, run.scene.beats[run.beat]);
            }
        }
        if (a.phase === 'resolving' && a.phaseTime >= (people.length > 1 && this.relations.getBetween(people[0].id, people[1].id).warmth >= 40 ? 3 : 1.5))
            this.completeActivity(a);
    }
    applyWeatherBehavior() {
        if (this.world.weather === 'rain')
            for (const [id, run] of this.lifeRuns) {
                const a = this.activities.active.find(a => a.id === id);
                if (a?.phase === 'active' && !run.interrupted)
                    this.interruptEveryday(a, 'rain');
            }
        if (this.world.weather === 'rain' && !this.activities.busy('nia')) {
            this.history.nextObject = Math.min(this.history.nextObject, this.absoluteMinute);
        }
    }
    updateFixed(dt) {
        this.clock.update(dt);
        const step = this.clock.paused ? 0 : dt * this.clock.speed;
        if (!step)
            return;
        if (this.clock.day !== this.lastDay) {
            this.lastDay = this.clock.day;
            this.daily.ensureDay(this.clock.day);
            for (const c of this.characters)
                c.currentScheduleIndex = -1;
        }
        this.activities.tick(step);
        this.everyday.tick(step);
        this.mindTimer += step;
        if (this.mindTimer >= 1) {
            const aiStart = performance.now(), elapsed = this.mindTimer;
            this.mindTimer = 0;
            const activity = Object.fromEntries(this.characters.map(c => { const a = this.activities.active.find(a => a.participants.includes(c.id)), run = a ? this.lifeRuns.get(a.id) : undefined; return [c.id, `${c.state === 'walk' ? 'walk ' : ''}${run ? motiveFor(run.scene) : a?.kind ?? c.state}`]; }));
            this.mind.tick(elapsed, activity);
            this.telemetry.sample(elapsed, this.characters.map(c => ({ state: c.state, busy: this.activities.busy(c.id) })));
            for (const c of this.characters) {
                const partner = this.characters.filter(o => o !== c).sort((a, b) => Vec3.sub(a.position, c.position).len() - Vec3.sub(b.position, c.position).len())[0];
                c.acting.setState(this.mind.states[c.id], partner ? this.relations.getBetween(c.id, partner.id) : undefined);
            }
            this.quietLife();
            this.aiMs = (this.aiMs ?? 0) * .9 + (performance.now() - aiStart) * .1;
        }
        const crowd = [...this.characters, this.player];
        for (const c of crowd) {
            c.crowd = crowd;
            c.majorActivity = this.activities.active.some(a => a.resource === 'court' && a.phase !== 'traveling' && a.participants.includes(c.id));
        }
        for (const c of this.characters) {
            if (!this.activities.busy(c.id) && c.acting.settling) {
                c.update(step);
                continue;
            }
            if (!this.activities.busy(c.id)) {
                const notice = this.routineNotices.get(c.id);
                if (notice) {
                    notice.remaining -= step;
                    if (notice.remaining > 0) {
                        c.update(step);
                        continue;
                    }
                    this.routineNotices.delete(c.id);
                    c.goTo(notice.target, notice.after);
                    c.activity = notice.activity;
                    c.update(step);
                    continue;
                }
                const waiting = this.waitingForPlace.get(c.id);
                if (waiting && !this.activities.active.some(a => a.id === waiting)) {
                    this.waitingForPlace.delete(c.id);
                    c.currentScheduleIndex = -1;
                }
                if (!this.waitingForPlace.has(c.id)) {
                    if (c.acting.clock >= c.yieldUntil)
                        this.schedule.update(c, this.clock.minutes);
                    if (c.pathIndex >= c.path.length && c.acting.clock >= c.yieldUntil) {
                        const incoming = crowd.find(o => { if (o === c || o.pathIndex >= o.path.length)
                            return false; const d = Vec3.sub(c.position, o.position), v = Vec3.sub(o.path[o.pathIndex], o.position).normalize(); return d.len() < 1.35 && Vec3.dot(d, v) > .25 && Math.abs(d.x * v.z - d.z * v.x) < .82; });
                        if (incoming) {
                            const v = Vec3.sub(incoming.path[incoming.pathIndex], incoming.position).normalize();
                            const options = [c.position.clone().add(v.clone().scale(1.7)), new Vec3(-6.5, 0, 3.5), new Vec3(6.5, 0, 3.5)];
                            const target = options.map(p => c.freeDestination(p)).find(p => Vec3.sub(p, c.position).len() > .8 && !this.world.nav.isBlocked(p.x, p.z) && this.world.nav.clubPath(c.position, p).length);
                            if (target) {
                                c.goTo(target, 'watch');
                                c.yieldUntil = c.acting.clock + 12;
                                c.currentScheduleIndex = -1;
                                c.activity = 'Making a little room';
                            }
                        }
                    }
                    if (c.pathIndex >= c.path.length && crowd.some(o => o !== c && Vec3.sub(o.position, c.position).len() < .8)) {
                        const free = c.freeDestination(c.position);
                        if (Vec3.sub(free, c.position).len() > .1)
                            c.goTo(free, 'watch');
                    }
                    const destination = c.path[c.path.length - 1] ?? c.position;
                    for (const [id] of this.lifeRuns) {
                        const spots = this.routes.get(id) ?? [];
                        if (!spots.some(p => Vec3.sub(p, destination).len() < .9))
                            continue;
                        const base = spots[0], options = [new Vec3(base.x - 1.6, 0, base.z), new Vec3(base.x + 2.2, 0, base.z), new Vec3(base.x, 0, base.z + 1.6), new Vec3(base.x, 0, base.z - 1.6)];
                        const target = options.find(p => !this.world.nav.isBlocked(p.x, p.z) && spots.every(t => Vec3.sub(t, p).len() > 1) && this.characters.every(o => o === c || Vec3.sub(o.position, p).len() > .7) && this.world.nav.path(c.position, p).length > 0);
                        if (target) {
                            this.waitingForPlace.set(c.id, id);
                            c.goTo(target, 'watch');
                            c.setLook(base);
                            c.activity = 'Giving them a little room';
                        }
                        break;
                    }
                }
                // Nonparticipants watch from the side instead of occupying a reserved court.
                if (this.activities.reserved('court') && Math.abs(c.position.x - 1) < 4.5 && Math.abs(c.position.z) < 6.3) {
                    const exit = new Vec3(6.3, 0, c.id === 'coach' ? 1.3 : 2.7), target = c.path[c.path.length - 1];
                    if (!target || Vec3.sub(exit, target).len() > .1)
                        c.goTo(exit, 'watch');
                    c.activity = 'Watching from the side';
                    const court = this.activities.active.find(a => a.resource === 'court');
                    if (court)
                        this.waitingForPlace.set(c.id, court.id);
                }
            }
            c.update(step);
            if (c.consumeStepEvent())
                this.audio.shoe(c.state === 'shuffle');
        }
        this.player.update(step);
        this.updatePlayerWatching();
        for (const a of [...this.activities.active]) {
            const people = a.participants.map(id => this.actor(id)), targets = this.routes.get(a.id);
            if (a.kind === 'everyday') {
                this.updateEveryday(a, step);
                continue;
            }
            if (a.elapsed > 180) {
                this.cancelActivity(a, true);
                continue;
            }
            if (a.kind === 'object' && !this.world.placements.some(p => p.id === a.resource)) {
                this.cancelActivity(a);
                continue;
            }
            if (a.phase === 'traveling') {
                if (people.every((c, i) => Vec3.sub(c.position, targets[i]).len() < .55 && c.pathIndex >= c.path.length)) {
                    this.activities.transition(a, 'starting');
                    if (a.kind === 'lesson') {
                        people[0].trigger(this.evidence.cue === 'recovery' ? 'shuffle' : 'swingForehand');
                        people[1].setLook(people[0].position);
                    }
                    else
                        people.forEach((c, i) => { c.face(people[1 - i].position); c.setConversationPartner(people[1 - i].position); c.setAnimation(i ? 'watch' : 'talk'); c.acting.setRole(i ? 'listen' : 'speak'); });
                }
                else if (a.phaseTime > 65) {
                    this.cancelActivity(a, true);
                }
                continue;
            }
            if (a.phase === 'starting' && a.phaseTime >= 3.5) {
                this.activities.transition(a, 'active');
                if (a.kind === 'lesson')
                    this.traceCoaching('practice-start', { id: a.id });
                if (a.resource === 'court') {
                    const r = a.kind === 'match' ? this.socialRally : this.rally;
                    r.start();
                    if (a.kind === 'lesson') {
                        this.evidence.practicing = true;
                        this.actor('mika').practiceCue = this.evidence.cue;
                    }
                }
                else {
                    const object = this.world.placements.find(p => p.id === a.resource);
                    people.forEach((c, i) => { if (object?.type === 'bench') {
                        c.face(new Vec3(c.position.x, 0, c.position.z - 3));
                        c.seatDepth = .80;
                        c.setAnimation('sit');
                    }
                    else
                        c.setAnimation(a.kind === 'object' ? (['basket', 'ballHopper', 'coneSet', 'racketRack'].includes(object?.type ?? '') ? 'stretch' : 'watch') : i ? 'drink' : 'talk'); });
                    this.activeSpeechId = people[0].id;
                    this.speechUntil = performance.now() + 3500;
                    this.ui.showSpeech(people[0].spec.name, this.socialLine(people[0], people[1], object), 3500);
                }
            }
            if (a.phase === 'active') {
                if (a.resource === 'court') {
                    const r = a.kind === 'match' ? this.socialRally : this.rally;
                    r.update(step);
                    const finished = a.kind === 'lesson' ? this.evidence.complete : a.kind === 'match' ? Math.max(...Object.values(r.score)) >= 3 || r.sessionHits >= 60 : r.sessionHits >= 16;
                    if (finished) {
                        this.activities.transition(a, 'resolving');
                        r.enabled = false;
                        this.evidence.practicing = false;
                        people.forEach(c => c.setAnimation('watch'));
                    }
                }
                else if (Vec3.sub(people[0].position, people[1].position).len() > 1.8) {
                    this.cancelActivity(a);
                    continue;
                }
                else if (a.phaseTime >= 10)
                    this.activities.transition(a, 'resolving');
            }
            if (a.phase === 'resolving' && a.phaseTime >= 2)
                this.completeActivity(a);
        }
        if (this.queuedLesson && Math.floor(this.everyday.time) % 5 === 0 && Math.floor(this.everyday.time - step) % 5 !== 0)
            this.traceCoaching('waiting', { key: this.queuedLesson, active: this.activities.active.map(a => ({ kind: a.kind, phase: a.phase, people: a.participants })) });
        // Low frequency, state-derived opportunities. No autonomous camera control.
        this.decisionTimer -= step;
        if (this.decisionTimer > 0)
            return;
        this.decisionTimer = 2;
        // A player-requested lesson may finish its queue after the club's autonomous hours.
        if (this.queuedLesson && !this.activities.reserved('court') && !this.activities.busy('mika') && !this.activities.busy('coach')) {
            this.beginLesson(this.queuedLesson);
            return;
        }
        const open = this.clock.minutes >= 510 && this.clock.minutes < 1250;
        if (!open) {
            // Closing the court should not switch off the people who remain in the club.
            if (!this.lifeRuns.size) {
                const context = this.sceneContext();
                const quiet = (scene) => !!scene.family && ['rest', 'reflect', 'care', 'company'].includes(motiveFor(scene));
                const scene = this.everyday.choose(this.lifeContext(), this.grammar.compose(this.mind, context).filter(quiet), scenes => this.mind.rank(scenes.filter(quiet), context).map(v => v.s), true);
                if (scene && this.startEveryday(scene))
                    this.everyday.next = Math.max(this.everyday.next, this.everyday.time + 75);
            }
            return;
        }
        if (!this.observationStarted && this.clock.day === 1) {
            const a = this.startActivity('observe', ['coach', 'mika'], 'court', [destinations.courtNorth, destinations.courtSouth], 'Morning practice');
            if (a) {
                this.observationStarted = true;
                this.history.nextSocial = this.absoluteMinute + 65;
            }
        }
        if (this.absoluteMinute >= this.history.nextSocial && !this.activities.reserved('court')) {
            const rematch = this.history.intentions.find(i => i.kind === 'rematch');
            if ((!rematch || rematch.notBefore <= this.absoluteMinute || this.history.intentions.some(i => i.id === 'test-cue')) && this.mind.challenge('mika', this.relations.getBetween('mika', 'leo').rivalry) > .68 && this.mind.challenge('leo', this.relations.getBetween('mika', 'leo').rivalry) > .68)
                this.startMatch();
        }
        if (!this.lifeRuns.size) {
            const context = this.sceneContext(), scene = this.everyday.choose(this.lifeContext(), this.grammar.compose(this.mind, context), scenes => this.mind.rank(scenes, context).map(v => v.s));
            if (scene)
                this.startEveryday(scene);
        }
        if (!this.lifeRuns.size && this.absoluteMinute >= this.history.nextObject && (this.world.placements.length > 0 || this.history.intentions.some(i => i.id === 'after-court'))) {
            this.affordances.sync(this.world.placements, this.clock.day);
            const ids = ['nia', 'mika', 'leo', 'coach'], busy = new Set(ids.filter(id => this.activities.busy(id)));
            const recentPairs = this.activities.history.filter(a => a.kind === 'object' || a.kind === 'tea').slice(0, 6).map(a => [...a.participants].sort().join('|'));
            const choice = this.ambientSocial.choose(ids, this.world.placements, this.affordances, this.relations, busy, recentPairs, this.absoluteMinute);
            if (choice)
                this.startBreak(choice.object, choice.companion, choice.host);
            else if (this.history.intentions.some(i => i.id === 'after-court') || this.world.weather === 'rain')
                this.startBreak();
        }
    }
    render(now) {
        const peek = document.getElementById('scenePeek'), run = this.lifeRuns.values().next().value;
        const title = run?.scene.title ?? '';
        if (peek.querySelector('strong').textContent !== title)
            peek.querySelector('strong').textContent = title;
        peek.hidden = !run || !!document.querySelector('.context.open,.book.open,.build.open');
        const aspect = this.renderer.resize();
        this.camera.setAspect(aspect);
        if (this.settings.reducedMotion) {
            this.camera.target = this.camera.desiredTarget.clone();
            this.camera.distance = this.camera.desiredDistance;
            this.camera.azimuth = this.camera.desiredAzimuth;
            this.camera.elevation = this.camera.desiredElevation;
            this.camera.update(0);
        }
        else
            this.camera.update(1 / 60);
        const meshes = [...this.world.meshes, ...this.world.placementMeshes(), ...this.world.dynamicMeshes(this.settings.reducedMotion ? 0 : now / 1000, this.clock.minutes, this.camera.position, 1 / 60)];
        for (const c of this.characters)
            meshes.push(...c.meshes(this.selectedId === c.spec.id));
        meshes.push(...this.player.meshes(false), ...this.rally.meshes(), ...this.socialRally.meshes());
        if (this.buildType && this.hoverGround) {
            const x = Math.round(this.hoverGround.x * 2) / 2, z = Math.round(this.hoverGround.z * 2) / 2;
            meshes.push(...this.previewMeshes(this.buildType, x, z, this.placementClear(this.buildType, x, z, this.buildRotation)));
        }
        if (this.history.breakthrough || this.history.firstMikaWin)
            meshes.push({ kind: 'roundBox', position: new Vec3(4.25, 2.12, -9.1), scale: new Vec3(.7, .12, .45), color: '#c58a5b', material: 'wood' }, { kind: 'sphere', position: new Vec3(4.25, 2.3, -9.1), scale: new Vec3(.24, .24, .24), color: '#e6c65f', material: 'fabric' });
        this.renderItems = meshes.length;
        this.renderer.render(meshes, this.camera.viewProjection(), this.world.lighting(this.clock.minutes), this.camera.position);
        if (this.activeSpeechId && performance.now() < this.speechUntil) {
            const c = this.byId(this.activeSpeechId);
            if (c) {
                const p = this.camera.project(new Vec3(c.position.x, 2.55, c.position.z));
                this.ui.positionSpeech(p.x, p.y);
            }
        }
        else
            this.activeSpeechId = null;
    }
    previewMeshes(type, x, z, valid) { return this.world.previewPlacement(type, x, z, this.buildRotation, valid); }
    loop = (now) => {
        if (this.graphicsLost)
            return;
        if (document.hidden) {
            this.last = now;
            this.simAcc = 0;
            requestAnimationFrame(this.loop);
            return;
        }
        const elapsed = Math.max(0, (now - this.last) / 1000), realDt = Math.min(2, elapsed);
        this.last = now;
        if (this.settings.visuals === 'auto') {
            this.frameSamples.push(elapsed);
            if (this.frameSamples.length >= 12) {
                const mean = this.frameSamples.reduce((a, b) => a + b, 0) / this.frameSamples.length;
                this.renderer.renderScale = clamp(this.renderer.renderScale + (mean > .055 ? -.12 : mean < .024 ? .04 : 0), .64, 1);
                this.frameSamples = [];
            }
        }
        else
            this.renderer.renderScale = 1;
        this.simAcc += realDt;
        const step = 1 / 60;
        let loops = 0;
        const simStart = performance.now();
        while (this.simAcc >= step && loops++ < 120) {
            this.updateFixed(step);
            this.simAcc -= step;
        }
        const simMs = performance.now() - simStart;
        this.autosave += realDt;
        if (this.autosave > 15) {
            this.autosave = 0;
            void this.save(false);
        }
        this.ui.update({ coins: this.coins, stars: this.stars, heart: this.clubHeart, clock: this.clock.formatted(), weather: this.world.weather, day: this.clock.day }, this.clock.paused, this.clock.speed);
        this.updateObjective();
        const renderStart = performance.now();
        this.render(now);
        const renderMs = performance.now() - renderStart;
        this.perf.sample({ simMs, renderMs, drawCalls: this.renderer.drawCalls, triangles: this.renderer.triangles, entities: this.characters.length + 1 }, now);
        requestAnimationFrame(this.loop);
    };
    snapshot() { return { playerAvatar: this.playerAvatar, queuedLesson: this.queuedLesson ?? (this.activities.active.find(a => a.kind === 'lesson') ? this.lessonKeys?.get(this.activities.active.find(a => a.kind === 'lesson').id) : null) ?? null, mind: this.mind.serialize(), clock: this.clock.serialize(), coins: this.coins, stars: this.stars, coachXP: this.coachXP, mikaProgress: this.mikaProgress, weather: this.world.weather, placements: this.world.placements, relationships: this.relations.serialize(), dailyGoals: this.daily.serialize(), clubLife: this.life.serialize(), equipment: { ...this.equipment }, player: { x: this.player.position.x, z: this.player.position.z }, bestRally: this.rally.bestRally, emergentSocial: this.socialSimulation.serialize(), activities: this.activities.serialize(), history: this.history.serialize(), affordances: this.affordances.serialize(), development: { ...this.development }, settings: { ...this.settings }, everyday: this.everyday.serialize() }; }
    async save(showToast = false) { if (this.saveBlocked)
        return; try {
        await this.saveSystem.save(this.snapshot());
        if (showToast) {
            this.ui.toast('Club saved.');
            this.audio.success();
        }
    }
    catch (e) {
        if (e instanceof SaveConflictError) {
            this.saveBlocked = true;
            this.ui.showContext('SAVE CONFLICT', 'Another tab saved this club', e.message, [], [{ title: 'Reload the newer save', subtitle: 'Discard unsaved changes in this tab', run: () => location.reload() }, { title: 'Export this tab', subtitle: 'Keep a separate JSON copy before reloading', run: () => { const url = URL.createObjectURL(new Blob([JSON.stringify(this.snapshot(), null, 2)], { type: 'application/json' })); const link = document.createElement('a'); link.href = url; link.download = 'rally-house-unsaved-club.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); } }]);
        }
        else {
            this.ui.toast('Could not save. Keep this tab open and check browser storage.');
            console.error('Save failed', e);
        }
    } }
    async restore() { const env = await this.saveSystem.load(); if (!env)
        return; const s = migrateGameSave(env.version, env.state); if (s.playerAvatar) {
        this.playerAvatar = s.playerAvatar;
        this.player.spec = playerSpec(s.playerAvatar);
    } this.clock.minutes = s.clock.minutes; this.clock.day = s.clock.day; this.clock.paused = false; this.clock.speed = s.clock.speed || 1; this.coins = s.coins; this.stars = s.stars; this.coachXP = s.coachXP ?? 14; this.mikaProgress = s.mikaProgress; this.world.weather = s.weather; this.world.placements = s.placements || []; this.relations.load(s.relationships || {}); this.daily.load(s.dailyGoals); this.daily.ensureDay(this.clock.day); this.life.load(s.clubLife); this.equipment = { ...this.equipment, ...s.equipment }; this.rally.bestRally = s.bestRally ?? 0; this.socialSimulation.load(s.emergentSocial); this.byId('mika')?.setDevelopment(this.mikaProgress); this.player.position.set(s.player.x, 0, s.player.z); this.player.goTo(this.player.position, 'idle'); this.settings = { ...this.settings, ...s.settings }; this.audio.volume = this.settings.volume; this.activities.load(s.activities); this.everyday.load(s.everyday); this.mind.load(s.mind); this.queuedLesson = s.queuedLesson && s.queuedLesson in drills ? s.queuedLesson : null; this.history.load(s.history); this.affordances.load(s.affordances); this.affordances.sync(this.world.placements, this.clock.day); this.development = s.development ?? { preparation: 0, recovery: 0 }; this.actor('mika').preparationBonus = this.development.preparation; this.actor('mika').recoveryBonus = this.development.recovery; this.observationStarted = !!s.history; this.rebuildFurnitureObstacles(); if (this.world.nav.isBlocked(this.player.position.x, this.player.position.z)) {
        const safe = destinations.entrance;
        this.player.position.set(safe.x, 0, safe.z);
        this.player.path = [];
    } }
}
