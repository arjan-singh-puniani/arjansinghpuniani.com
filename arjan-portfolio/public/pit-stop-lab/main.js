import { CORNERS, SCENARIOS, PARAMETERS, configuration, simulate, snapshot, telemetry, sensitivity, monteCarlo, strategy, clamp } from './simulation.js';
import { operations } from './operations.js';
import { createAudio } from './audio.js';
import { createIntelligenceUI } from './intelligence-ui.js';
import { createExperienceUI } from './experience-ui.js';
import { watchShot } from './experience.js';
const $ = selector => document.querySelector(selector);
const params = new URLSearchParams(location.search);
let config = configuration({ scenario: Object.hasOwn(SCENARIOS, params.get('scenario')) ? params.get('scenario') : 'coordinated' });
let sim = simulate(config), time = 0, playing = false, playback = 1, mode = 'world', corner = 'FL', world = null, pinned = null, batchRevision = 0;
let experienceUI=null;
let guideStep = 0, strategyPlans = [], selectedAsset = null;
let watching = false, directing = false, watchCamera = null, watchWait = 0;
let frame = 0, lastWall = 0, lastUI = 0, fpsStart = 0, frames = 0, visible = true, disposed = false;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const audio = createAudio();
audio.setEnabled(false);
const listeners = [];
function listen(element, event, handler, options) { element.addEventListener(event, handler, options); listeners.push(() => element.removeEventListener(event, handler, options)); }
const intelligence = createIntelligenceUI(() => sim, listen);
listen($('#intelligenceOpen'), 'click', () => { stopWatch(); playing = false; updateUI(); });
listen($('#dataRoomBtn'), 'click', () => { stopWatch(); playing = false; updateUI(); });
const seconds = value => value === null ? 'HOLD' : `${value.toFixed(3)} s`;
const safeId = id => id.replace(/[^a-z0-9-]/gi, '-');
function notice(message) { $('#notice').textContent = message; $('#notice').hidden = false; }
function setOptions() { document.body.dataset.lighting = $('#lighting').value; world?.setOptions({ cutaway: $('#cutaway').checked, exploded: $('#exploded').checked, labels: $('#labels').checked, trails: $('#trails').checked, fov: Number($('#fov').value), lighting: $('#lighting').value, roof: $('#roof').checked, spatial: $('#spatial').checked, ghost: $('#ghost').checked }); }
function openInspector() { $('#inspector').hidden = false; $('#inspector').classList.add('mobile-open'); $('#inspectorBtn').setAttribute('aria-expanded', 'true'); }
function setMode(next) {
    if(experienceUI&&experienceUI.mode!=='engineer')experienceUI.choose('engineer',false);
    mode = next;
    document.body.className = document.body.className.replace(/\bmode-\w+\b/g, '').trim();
    document.body.classList.add(`mode-${next}`);
    document.querySelectorAll('[data-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === next)));
    $('#worldInspector').hidden = next === 'strategy' || next === 'mechanics';
    $('#mechanicsInspector').hidden = next !== 'mechanics';
    $('#strategyInspector').hidden = next !== 'strategy';
    $('#inspectorHeading').textContent = next === 'strategy' ? 'RACE STRATEGY / REDUCED MODEL' : next === 'mechanics' ? `MECHANICAL INSPECTION / ${corner}` : 'PIT BOX / 01';
    $('.world-caption h1').textContent = next === 'mechanics' ? `Wheel assembly / ${corner}` : next === 'strategy' ? 'Race strategy' : 'Pit box 01';
    world?.setView(next === 'mechanics' ? 'mechanics' : 'world', corner);
    if (next !== 'world')
        openInspector();
    else {
        $('#inspector').classList.remove('mobile-open');
        if (innerWidth < 761)
            $('#inspectorBtn').setAttribute('aria-expanded', 'false');
    }
    if (next === 'timing')
        setAnalysis(true);
    updateUI();
}
function chooseCorner(next) {
    corner = next;
    if (mode === 'mechanics')
        $('#inspectorHeading').textContent = `MECHANICAL INSPECTION / ${corner}`;
    $('#corner').value = corner;
    openInspector();
    if (mode === 'mechanics')
        world?.setView('mechanics', corner);
    updateUI();
}
function select(data) {
    if(Object.hasOwn(data,'hover')){const el=$('#componentHover');el.hidden=!data.hover;el.textContent=data.hover;el.style.left=`${data.x+12}px`;el.style.top=`${data.y-24}px`;return;}
    if(data.part&&experienceUI?.mode==='explore'){$('#componentNote').textContent=`${data.title} · ${data.description}`;return;}
    const manualTakeover=watching&&((data.camera&&!directing)||data.corner||data.facility||data.title);
    if(manualTakeover)stopWatch();
    if(data.camera){for(const button of document.querySelectorAll('[data-car-camera]'))button.setAttribute('aria-pressed',String(button.dataset.carCamera===data.camera));for(const button of document.querySelectorAll('[data-scene-camera]'))button.setAttribute('aria-pressed',String(button.dataset.sceneCamera===data.camera));if([...$('#camera').options].some(option=>option.value===data.camera))$('#camera').value=data.camera;}
    if (data.facility) {
        if (mode !== 'world' && mode !== 'timing')
            setMode('world');
        selectedAsset = data.facility;
        $('#assetPanel').hidden = false;
        openInspector();
        updateUI();
    }
    if (data.corner) {
        chooseCorner(data.corner);
        $('#partName').textContent = `${data.corner} wheel service`;
        $('#partDesc').textContent = 'Select Mechanics to inspect this corner at the current timestamp. The same events drive both scales.';
    }
    if (data.title) {
        $('#partName').textContent = data.title;
        $('#partDesc').textContent = data.description;
        $('#mechanicalDescription').textContent = `${data.title}. ${data.description}`;
        openInspector();
    }
    if(manualTakeover)updateUI();
}
for (const [key, scenario] of Object.entries(SCENARIOS)) {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = scenario.name;
    $('#scenario').append(option);
}
$('#scenario').value = config.scenario;
const groups = new Map();
for (const [key, [title, , min, max, step, unit, group]] of Object.entries(PARAMETERS)) {
    if (!groups.has(group)) {
        const details = document.createElement('details');
        details.className = 'parameters';
        details.open = group === 'Wheel service';
        const summary = document.createElement('summary');
        summary.textContent = group.toUpperCase();
        details.append(summary);
        $('#parameterGroups').append(details);
        groups.set(group, details);
    }
    const label = document.createElement('label');
    label.className = 'parameter';
    label.innerHTML = `<span><span>${title}</span><output id="${key}Out"></output></span><input aria-label="${title}" data-parameter="${key}" type="range" min="${min}" max="${max}" step="${step}" value="${config[key]}" />`;
    groups.get(group).append(label);
    listen(label.querySelector('input'), 'input', e => rebuild({ ...config, [key]: Number(e.target.value) }));
    $(`#${key}Out`).textContent = `${config[key].toFixed(step < .1 ? 2 : 1)} ${unit}`;
}
function rebuild(next) {
    stopWatch();
    try {
        config = configuration(next);
        sim = simulate(config);
    }
    catch (error) {
        notice(error.message);
        return;
    }
    time = 0;
    playing = false;
    batchRevision++;
    $('#monteBtn').disabled = false;
    $('#monteBtn').textContent = 'Run batch';
    $('#monteResult').textContent = 'Batch results reset when the configuration changes.';
    $('#histogram').replaceChildren();
    for (const [key, [, , , , step, unit]] of Object.entries(PARAMETERS)) {
        const slider = $(`[data-parameter="${key}"]`);
        slider.value = config[key];
        $(`#${key}Out`).textContent = `${config[key].toFixed(step < .1 ? 2 : 1)} ${unit}`;
    }
    $('#scenario').value = config.scenario;
    $('#seed').value = config.seed;
    $('#scenarioNote').textContent = SCENARIOS[config.scenario].note;
    $('#timeline').max = sim.duration;
    $('#stationary').textContent = seconds(sim.result.stationary);
    $('#service').textContent = seconds(sim.result.serviceDuration);
    $('#total').textContent = seconds(sim.result.total);
    $('#raceLoss').textContent = seconds(sim.result.raceLoss);
    $('#critical').textContent = sim.result.status === 'SAFETY HOLD' ? 'RR · HOLD' : `${sim.result.criticalCorner} / limiting`;
    const stop = sim.stops.at(-1);
    $('#criticalNote').textContent = stop.held ? 'Unconfirmed retention blocks jack release. No departure is scheduled.' : `Last corner clear at ${(stop.corners[stop.criticalCorner].events.at(-1).end - stop.stopAt).toFixed(3)} s after stopping. ${config.scenario === 'traffic' ? `Traffic wait: ${sim.events.find(e => e.state === 'TRAFFIC HOLD')?.duration.toFixed(3) ?? '0.000'} s.` : config.scenario === 'stack' ? `Car 02 queue: ${sim.result.queueWait.toFixed(3)} s.` : 'Earlier corners wait for this dependency.'}`;
    if (pinned)
        $('#comparison').textContent = `Pinned ${pinned.name}: ${seconds(pinned.result.stationary)} → current ${seconds(sim.result.stationary)}. ${sim.result.stationary !== null && pinned.result.stationary !== null ? `Δ ${(sim.result.stationary - pinned.result.stationary).toFixed(3)} s.` : ''}`;
    buildTracks();
    buildTelemetry();
    updateSensitivity();
    updateStrategy();
    intelligence.invalidate();
    const clean = simulate({ ...config, scenario: 'coordinated' });
    $('#quickDelta').textContent = sim.result.stationary === null ? 'Safety hold · release blocked' : `Stop Δ ${(sim.result.stationary - clean.result.stationary) >= 0 ? '+' : ''}${(sim.result.stationary - clean.result.stationary).toFixed(3)} s · queue ${sim.result.queueWait.toFixed(3)} s`;
    document.querySelectorAll('[data-quick-scenario]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.quickScenario === config.scenario)));
    updateUI();
}
function buildTracks() {
    $('#eventTracks').replaceChildren();
    const critical = new Set(sim.stops.flatMap(stop => stop.criticalIds));
    for (const track of ['Preparation', 'Arrival', 'Front jack', 'Rear jack', ...CORNERS, 'Safety']) {
        const row = document.createElement('div');
        row.className = 'track';
        const label = document.createElement('span');
        label.textContent = track;
        const line = document.createElement('div');
        line.className = 'track-line';
        for (const event of sim.events.filter(e => e.track === track)) {
            const button = document.createElement('button');
            button.className = `event${critical.has(event.id) ? ' critical' : ''}`;
            button.id = `event-${safeId(event.id)}`;
            button.style.left = `${event.start / sim.duration * 100}%`;
            button.style.width = `${Math.max(.2, event.duration / sim.duration * 100)}%`;
            const description = `Car ${event.car} · ${track} · ${event.state.replaceAll('_', ' ')} · ${event.start.toFixed(3)}–${event.end.toFixed(3)} s`;
            button.title = description;
            button.setAttribute('aria-label', description);
            button.onclick = () => {
                playing = false;
                time = event.start;
                document.querySelectorAll('.event.selected').forEach(el => el.classList.remove('selected'));
                button.classList.add('selected');
                if (CORNERS.includes(track)) {
                    chooseCorner(track);
                    if (mode !== 'mechanics')
                        world?.setCamera(track);
                }
                else if (track.includes('jack'))
                    world?.setCamera('top');
                $('#eventDescription').textContent = `${description}. ${critical.has(event.id) ? 'On the controlling dependency chain.' : 'This operation has parallel slack.'} Dependencies: ${event.deps.length ? event.deps.map(id => sim.events.find(e => e.id === id).state.replaceAll('_', ' ')).join(', ') : 'pit-entry clock'}.`;
                updateUI();
            };
            line.append(button);
        }
        row.append(label, line);
        $('#eventTracks').append(row);
    }
    const cursor = document.createElement('div');
    cursor.className = 'timeline-cursor';
    cursor.id = 'trackCursor';
    $('#eventTracks').append(cursor);
}
function buildTelemetry() {
    const samples = telemetry(sim), w = 930, x0 = 40, y0 = 120;
    const path = key => samples.map((sample, i) => `${i ? 'L' : 'M'}${(x0 + sample.time / sim.duration * w).toFixed(2)},${(y0 - (key === 'speed' ? sample.speed * 3.6 / config.approachSpeed : sample.lift / .1) * 100).toFixed(2)}`).join(' ');
    let markup = '';
    for (const fraction of [0, .5, 1]) {
        const y = y0 - fraction * 100;
        markup += `<line x1="40" y1="${y}" x2="970" y2="${y}" stroke="#a5b8b423"/><text x="0" y="${y + 3}">${Math.round(config.approachSpeed * fraction)}</text><text x="975" y="${y + 3}">${fraction * 100}</text>`;
    }
    for (let i = 0; i <= 5; i++) {
        const x = x0 + w * i / 5;
        markup += `<text x="${x}" y="143">${(sim.duration * i / 5).toFixed(1)} s</text>`;
    }
    markup += `<path class="speed-line" d="${path('speed')}"/><path class="lift-line" d="${path('lift')}"/><line id="plotCursor" x1="40" x2="40" y1="10" y2="125" stroke="#f7e5c3"/>`;
    $('#telemetry').innerHTML = markup;
}
function setAnalysis(open) { $('#analysis').hidden = !open; $('#analysisBtn').setAttribute('aria-expanded', String(open)); $('#analysisBtn').textContent = open ? 'Collapse analysis ↓' : 'Expand analysis ↑'; }
function updateSensitivity() {
    const key = $('#sensitivityParam').value, delta = key === 'confirmation' ? .1 : key === 'variability' ? -.03 : -.1;
    const experiment = sensitivity(config, key, delta);
    $('#sensitivityResult').textContent = experiment.change === null ? 'Safety hold: no completed stop to compare.' : `${seconds(experiment.before.stationary)} → ${seconds(experiment.after.stationary)} · Δ ${experiment.change >= 0 ? '+' : ''}${experiment.change.toFixed(3)} s. Limiting corner: ${experiment.before.criticalCorner} → ${experiment.after.criticalCorner}. Same seed.`;
}
function strategyInput() { return { laps: Number($('#laps').value), age: Number($('#tireAge').value), gap: Number($('#rivalGap').value), compound: $('#compound').value, pace: Number($('#pace').value), degradation: Number($('#degradation').value) }; }
function updateStrategy() {
    try {
        for (const id of ['laps', 'tireAge', 'rivalGap', 'pace', 'degradation'])
            if (!$(`#${id}`).checkValidity())
                return;
        const plans = strategy(sim, strategyInput());
        strategyPlans = plans;
        $('#strategyResults').replaceChildren();
        if (!plans.length) {
            $('#strategyResults').textContent = 'Safety hold: strategy cannot assume a completed stop.';
            return;
        }
        for (const plan of plans) {
            const row = document.createElement('div');
            row.className = 'strategy-row';
            row.innerHTML = `<span>${plan.wait === 0 ? 'Pit now' : `Pit ${plan.wait} lap${plan.wait > 1 ? 's' : ''} later`}</span><b>${plan.exitGap.toFixed(2)} s ${plan.exitGap >= 0 ? 'ahead' : 'behind'}</b>`;
            $('#strategyResults').append(row);
        }
        const explanation = document.createElement('p');
        explanation.className = 'muted';
        const change = plans[1].elapsed - plans[0].elapsed;
        explanation.textContent = `Over ${strategyInput().laps} laps, waiting one lap costs ${change.toFixed(2)} s relative to pitting now. Positive = earlier stop helps (undercut). Includes ${sim.result.raceLoss.toFixed(3)} s modeled pit loss; total transit ${sim.result.transit.toFixed(3)} s.`;
        $('#strategyResults').append(explanation);
    }
    catch (error) {
        notice(error.message);
    }
}
function updateWorld(state=snapshot(sim,time)){
    const manual=experienceUI?.frame();
    if(manual?.explore){const parked=snapshot(sim,manual.time);parked.cars[0].position=0;parked.cars[0].speed=0;world?.update(parked,sim,corner);}
    else world?.update(manual?.state??state,manual?.sim??sim,corner);
}
function updateUI() {
    document.body.dataset.assetState=world?(world.stats().heroLoaded?'ready':world.stats().heroError?'fallback':'loading'):window.__SIM_READY__?'fallback':'loading';
    const state = snapshot(sim, time), active = state.cars[state.activeCar - 1], stop = sim.stops[state.activeCar - 1];
    if(world?.stats().heroError)$('.explore-caption>span').textContent='Teaching geometry · car asset unavailable';
    updateWorld(state);
    $('#phase').textContent = playing ? `${active.phase} · CAR 0${active.number}` : time === 0 ? 'READY TO RUN' : `${active.phase} · PAUSED`;
    $('#clock').innerHTML = `${time.toFixed(3).padStart(6, '0')} <small>s</small>`;
    $('#playBtn').textContent = playing ? 'Ⅱ PAUSE' : time >= sim.duration ? '↺ REPLAY' : '▶ RUN STOP';
    $('#timeline').value = time;
    $('#timelineOut').textContent = `${time.toFixed(2)} / ${sim.duration.toFixed(2)} s`;
    if (!$('#cornerStates').children.length)
        $('#cornerStates').innerHTML = CORNERS.map(c => `<button data-corner="${c}" class="${stop.criticalCorner === c ? 'critical ' : ''}${corner === c ? 'selected' : ''}" aria-label="Inspect ${c} wheel, ${active.corners[c].state.replaceAll('_', ' ')}">${c} <small>${active.corners[c].state.replaceAll('_', ' ')}</small></button>`).join('');
    for (const key of CORNERS) {
        const button = $(`[data-corner="${key}"]`);
        button.className = `${stop.criticalCorner === key ? 'critical ' : ''}${corner === key ? 'selected' : ''}`;
        button.querySelector('small').textContent = active.corners[key].state.replaceAll('_', ' ');
        button.setAttribute('aria-label', `Inspect ${key} wheel, ${active.corners[key].state.replaceAll('_', ' ')}`);
        button.title = `Parallel slack: ${stop.slack[key].toFixed(3)} s`;
    }
    $('#safety').innerHTML = Object.entries({ wheelsSafe: '4 wheels retained', toolsClear: 'Tools & crew clear', jacksClear: 'Both jacks clear', pathClear: 'Traffic path clear' }).map(([key, label]) => `<div><span>${label}</span><b class="${active.safety[key] ? 'pass' : ''}">${active.safety[key] ? '✓ PASS' : '— HOLD'}</b></div>`).join('');
    const ops = operations(sim, state);
    $('#opsStations').textContent = `${ops.activeStations} / 4`;
    $('#opsCrew').textContent = `${ops.activeCrew} / 14`;
    $('#opsSecured').textContent = `${ops.secured} / 4`;
    $('#opsRelease').textContent = ops.status.toLowerCase();
    $('#opsCar').textContent = `0${ops.car}`;
    $('#opsBlocking').textContent = ops.blocking ? `${ops.blocking.track} · ${ops.blocking.state.replaceAll('_', ' ')} · ${ops.blocking.remaining.toFixed(2)} s remaining` : ops.status;
    for (const [i, stage] of ops.pipeline.entries()) {
        const el = $(`[data-pipeline="${i}"]`);
        el.dataset.status = stage.status;
        el.querySelector('i').style.width = `${stage.progress * 100}%`;
        el.querySelector('b').textContent = stage.name;
    }
    const mapPosition = (id, car, x) => { const el = $(id); el.toggleAttribute('hidden', !car); if (car) {
        el.setAttribute('cx', x);
        el.setAttribute('cy', clamp(105 + car.position * 4.5, 8, 202));
    } };
    mapPosition('#mapCar', state.cars[0], 97 + 45 * (state.cars[0].phase === 'DEPARTURE' ? (() => { const u = clamp((-state.cars[0].position - 7) / 8, 0, 1); return u * u * (3 - 2 * u); })() : 0));
    mapPosition('#mapSecond', state.cars[1], 97);
    mapPosition('#mapTraffic', state.traffic.visible ? { position: state.traffic.position } : null, 142);
    $('#mapStatus').textContent = ops.status;
    if (selectedAsset) {
        const descriptions = { garage: ['Race garage / Bay 01', 'Shared tools, independent corner tasks and a single guarded release. The neighboring aero bay is a static assembly display.'], tires: ['Tire preparation / Bay 03', 'Service inventory tracks this scenario’s allocated replacement sets and removed wheels. The compound racks are a separate labeled display stock.'], command: ['Pit-wall command', 'The release controller combines wheel retention, crew and tool clearance, both jacks, and the scheduled traffic window.'] };
        const [title, description] = descriptions[selectedAsset];
        $('#assetTitle').textContent = title;
        $('#assetDescription').textContent = description;
        const entries = selectedAsset === 'tires' ? { 'Allocated replacements': ops.inventory.allocated, 'Remaining replacements': ops.inventory.replacementsRemaining, 'Fitted replacements': ops.inventory.fitted, 'Removed wheels': ops.inventory.removed } : selectedAsset === 'command' ? { 'Wheels retained': `${ops.secured} / 4`, 'Equipment clear': ops.release.toolsClear ? 'CONFIRMED' : 'WAITING', 'Jacks clear': ops.release.jacksClear ? 'CONFIRMED' : 'WAITING', 'Traffic path': ops.release.pathClear ? 'CLEAR' : 'CONFLICT', 'Release': ops.release.approved ? 'APPROVED' : 'HOLD' } : { 'Active stations': `${ops.activeStations} / 4`, 'Active service crew': `${ops.activeCrew} / 14`, 'Active car': `0${ops.car}`, 'Critical corner': stop.criticalCorner };
        $('#assetMetrics').innerHTML = Object.entries(entries).map(([key, value]) => `<div><span>${key}</span><b>${value}</b></div>`).join('');
    }
    const c = active.corners[corner];
    $('#mechanicalState').textContent = `CAR 0${active.number} / ${corner} / ${c.state.replaceAll('_', ' ')}. Installed: ${c.installed ? 'yes' : 'no'}. Retention confirmed: ${c.secured ? 'yes' : 'no'}.`;
    $('#trackCursor').style.left = `calc(80px + (100% - 80px) * ${time / sim.duration})`;
    $('#plotCursor')?.setAttribute('x1', 40 + 930 * time / sim.duration);
    $('#plotCursor')?.setAttribute('x2', 40 + 930 * time / sim.duration);
    const sample = state.cars.at(-1);
    $('#telemetryCar').textContent = `0${sample.number}`;
    $('#telemetryReadout').textContent = `t ${time.toFixed(3)} s · v ${(sample.speed * 3.6).toFixed(1)} km/h · a ${sample.acceleration.toFixed(1)} m/s² · position ${sample.position.toFixed(2)} m · lift ${(sample.lift * 1000).toFixed(1)} mm · ${Object.values(sample.corners).filter(c => c.secured).length}/4 wheels secured.`;
    if (mode === 'strategy') {
        const path = $('#circuitPath'), length = path.getTotalLength();
        const input = strategyInput(), plan = strategyPlans[0];
        const raceTime = time / sim.duration * (plan?.elapsed ?? input.laps * input.pace);
        let remaining = Math.max(0, raceTime - (sim.result.raceLoss ?? 0)), distance = 0;
        for (const lapTime of plan?.splits ?? []) {
            if (remaining >= lapTime) {
                distance++;
                remaining -= lapTime;
            }
            else {
                distance += remaining / lapTime;
                break;
            }
        }
        const fraction = value => ((value % 1) + 1) % 1;
        const p = path.getPointAtLength(fraction(distance) * length), r = path.getPointAtLength(fraction((raceTime - input.gap) / (input.pace + .15)) * length);
        $('#strategyCar').setAttribute('cx', p.x);
        $('#strategyCar').setAttribute('cy', p.y);
        $('#rivalCar').setAttribute('cx', r.x);
        $('#rivalCar').setAttribute('cy', r.y);
    }
    window.__PIT_LAB_STATE__ = { experience:experienceUI?.debug, operations: ops, time, playing, watching, watchCamera, mode, corner, configuration: config, result: sim.result, snapshot: state, render: world?.stats() ?? null };
}
function togglePlay() {
    stopWatch();
    audio.ensure();
    if (time >= sim.duration)
        time = 0;
    playing = !playing;
    lastWall = performance.now();
    updateUI();
}
listen($('#playBtn'), 'click', togglePlay);
function stopWatch() {
    watching = false; watchWait = 0; watchCamera = null;
    document.body.classList.remove('watching-stop');
    $('#watchBtn').setAttribute('aria-pressed', 'false');
    $('#watchBtn').textContent = '▶ Watch stop';
}
function startWatch() {
    setMode('world');
    watching = true; watchCamera = null; watchWait = 0; time = 0; playing = true; playback = .5;
    $('#speed').value = '.5'; $('#watchBtn').setAttribute('aria-pressed', 'true'); $('#watchBtn').textContent = '■ Stop watching';
    document.body.classList.add('watching-stop'); lastWall = performance.now(); updateUI();
}
listen($('#watchBtn'), 'click', () => { if (watching) { stopWatch(); playing = false; updateUI(); } else startWatch(); });
listen($('#inspectorBtn'), 'click', stopWatch);
for (const button of document.querySelectorAll('[data-quick-scenario]')) listen(button, 'click', () => {
    const reference = simulate({ ...config, scenario: 'coordinated' });
    pinned = { name: 'Clean stop', result: { ...reference.result }, simulation: reference };
    rebuild({ ...config, scenario: button.dataset.quickScenario }); world?.setReference(reference); startWatch();
});
for (const id of ['resetBtn', 'stepBackBtn', 'stepFwdBtn', 'timeline']) listen($('#'+id), id === 'timeline' ? 'input' : 'click', stopWatch);
listen($('#resetBtn'), 'click', () => { time = 0; playing = false; updateUI(); });
listen($('#stepBackBtn'), 'click', () => { time = Math.max(0, time - .05); playing = false; updateUI(); });
listen($('#stepFwdBtn'), 'click', () => { time = Math.min(sim.duration, time + .05); playing = false; updateUI(); });
listen($('#timeline'), 'input', e => { time = Number(e.target.value); playing = false; updateUI(); });
listen($('#speed'), 'change', e => playback = Number(e.target.value));
listen($('#scenario'), 'change', e => rebuild({ ...config, scenario: e.target.value }));
listen($('#seed'), 'change', e => {
    if (e.target.checkValidity())
        rebuild({ ...config, seed: Number(e.target.value) });
});
listen($('#restoreDefaults'), 'click', () => rebuild({ scenario: config.scenario, seed: config.seed }));
listen($('#controlsBtn'), 'click', () => {
    const open = $('#controls').hidden;
    $('#controls').hidden = !open;
    $('#controlsBtn').setAttribute('aria-expanded', String(open));
    if (open && innerWidth < 761) {
        $('#inspector').classList.remove('mobile-open');
        $('#inspectorBtn').setAttribute('aria-expanded', 'false');
    }
});
listen($('#inspectorBtn'), 'click', () => {
    const mobile = innerWidth < 761, open = mobile ? !$('#inspector').classList.contains('mobile-open') : $('#inspector').hidden;
    if (open) {
        openInspector();
        if (mobile)
            $('#controls').hidden = true;
    }
    else {
        $('#inspector').hidden = true;
        $('#inspector').classList.remove('mobile-open');
        $('#inspectorBtn').setAttribute('aria-expanded', 'false');
    }
});
for (const button of document.querySelectorAll('[data-close]'))
    listen(button, 'click', () => { $(`#${button.dataset.close}`).hidden = true; const control = button.dataset.close === 'controls' ? '#controlsBtn' : '#inspectorBtn'; $(control).setAttribute('aria-expanded', 'false'); $(control).focus(); });
listen($('#cameraReset'), 'click', () => { world?.setCamera(mode === 'mechanics' ? 'hero' : 'overview'); $('#camera').value = 'overview'; });
listen($('#hideBtn'), 'click', () => { const hidden = document.body.classList.toggle('hide-ui'); $('#hideBtn').setAttribute('aria-pressed', String(hidden)); $('#hideBtn').innerHTML = hidden ? '◉ <span>Show overlays</span>' : '◉ <span>Hide overlays</span>'; });
listen($('#fullscreenBtn'), 'click', async () => {
    try {
        if (document.fullscreenElement)
            await document.exitFullscreen();
        else
            await document.documentElement.requestFullscreen();
    }
    catch {
        notice('Full screen is unavailable in this browser. Open the standalone lab in a new tab.');
    }
});
for (const button of document.querySelectorAll('[data-mode]'))
    listen(button, 'click', () => setMode(button.dataset.mode));
for (const button of document.querySelectorAll('[data-detail-camera]'))
    listen(button, 'click', () => world?.setCamera(button.dataset.detailCamera === 'top' ? 'detailTop' : button.dataset.detailCamera));
listen($('#camera'), 'change', e => {
    const camera = e.target.value;
    if (camera === 'cutaway') {
        setMode('mechanics');
        $('#cutaway').checked = true;
        setOptions();
    }
    else {
        if (mode === 'mechanics')
            setMode('world');
        world?.setCamera(camera);
    }
});
listen($('#corner'), 'change', e => chooseCorner(e.target.value));
listen($('#cornerStates'), 'click', e => {
    const button = e.target.closest('[data-corner]');
    if (button)
        chooseCorner(button.dataset.corner);
});
listen($('#focusSelect'), 'change', e => { setMode('mechanics'); world?.focus(e.target.value); });
for (const id of ['cutaway', 'exploded', 'labels', 'trails', 'spatial', 'roof', 'ghost'])
    listen($(`#${id}`), 'change', () => {
        if ((id === 'cutaway' || id === 'exploded') && mode !== 'mechanics')
            setMode('mechanics');
        setOptions();
        updateUI();
    });
listen($('#fov'), 'input', setOptions);
listen($('#lighting'), 'change', setOptions);
for (const button of document.querySelectorAll('[data-scene-camera]'))
    listen(button, 'click', () => { world?.setCamera(button.dataset.sceneCamera); for (const other of document.querySelectorAll('[data-scene-camera]'))
        other.setAttribute('aria-pressed', String(other === button)); });
listen($('#mapReset'), 'click', () => world?.setCamera('facility'));
listen($('#dismissGuide'), 'click', () => $('#discovery').hidden = true);
listen($('#guideBtn'), 'click', () => {
    if (guideStep === 0) {
        togglePlay();
        $('#guideBtn').textContent = '02 / Try a slow wheel gun →';
        guideStep = 1;
    }
    else if (guideStep === 1) {
        rebuild({ ...config, scenario: 'gun' });
        togglePlay();
        $('#guideBtn').textContent = '03 / Follow its critical path →';
        guideStep = 2;
    }
    else {
        setMode('timing');
        $('#discovery').hidden = true;
    }
});
listen($('#sound'), 'change', e => audio.setEnabled(e.target.checked));
listen($('#analysisBtn'), 'click', () => setAnalysis($('#analysis').hidden));
for (const button of document.querySelectorAll('[data-analysis]'))
    listen(button, 'click', () => {
        for (const tab of document.querySelectorAll('[data-analysis]')) {
            const active = tab === button;
            tab.setAttribute('aria-selected', String(active));
            $(`#${tab.dataset.analysis}Panel`).hidden = !active;
        }
        updateUI();
    });
listen($('#sensitivityParam'), 'change', updateSensitivity);
listen($('#pinBtn'), 'click', () => { pinned = { name: SCENARIOS[config.scenario].name, result: { ...sim.result }, simulation: sim }; world?.setReference(sim); $('#ghostNote').textContent = `Reference: ${pinned.name}, ${seconds(pinned.result.stationary)}. The translucent car follows this saved schedule.`; $('#comparison').textContent = `Pinned ${pinned.name}: ${seconds(pinned.result.stationary)}. Change a parameter or scenario to compare.`; });
listen($('#monteBtn'), 'click', async () => {
    if (!$('#threshold').checkValidity())
        return;
    const revision = ++batchRevision;
    $('#monteBtn').disabled = true;
    $('#monteBtn').textContent = 'Running…';
    try {
        const threshold = Number($('#threshold').value), result = await monteCarlo(config, { runs: Number($('#runs').value), threshold });
        if (revision !== batchRevision)
            return;
        $('#monteResult').textContent = `${result.runs} runs · median ${seconds(result.median)} · P10 ${seconds(result.p10)} · P90 ${seconds(result.p90)} · ${(result.exceeding * 100).toFixed(1)}% exceed ${threshold.toFixed(1)} s (holds count as exceeding). Bottlenecks: ${CORNERS.map(c => `${c} ${result.bottlenecks[c]}`).join(' / ')}. ${result.holds} holds.`;
        if (result.times.length) {
            const lo = result.times[0], hi = result.times.at(-1), bins = Array(24).fill(0);
            for (const value of result.times)
                bins[Math.min(23, Math.floor((value - lo) / Math.max(.0001, hi - lo) * 24))]++;
            const max = Math.max(...bins);
            $('#histogram').innerHTML = bins.map((n, i) => `<rect x="${i * 16}" y="${50 - 45 * n / max}" width="13" height="${45 * n / max}" fill="#9ad3b7"/>`).join('') + `<text x="0" y="65">${lo.toFixed(3)} s</text><text x="320" y="65">${hi.toFixed(3)} s</text>`;
        }
    }
    catch (error) {
        notice(error.message);
    }
    finally {
        if (revision === batchRevision) {
            $('#monteBtn').disabled = false;
            $('#monteBtn').textContent = 'Run batch';
        }
    }
});
for (const id of ['compound', 'laps', 'tireAge', 'rivalGap', 'pace', 'degradation'])
    listen($(`#${id}`), 'change', updateStrategy);
listen($('#exportBtn'), 'click', () => { const blob = new Blob([JSON.stringify({ model: 'Pit Stop Lab 2.0 / illustrative', config, result: sim.result, events: sim.events, telemetry: telemetry(sim, 300) }, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = `pit-stop-${config.scenario}-seed-${config.seed}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); });
listen(window, 'keydown', e => {
    if ($('#intelligenceDialog').open||experienceUI?.mode!=='engineer') return;
    if (e.target.matches('input,select,button,summary,a'))
        return;
    const key = e.key.toLowerCase();
    if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
    }
    if (key === 'f') {
        if (mode === 'mechanics')
            world?.focus($('#focusSelect').value);
        else
            world?.setCamera('overview');
    }
    if (key === 'r') {
        $('#resetBtn').click();
    }
    if (key === 'h')
        $('#hideBtn').click();
    if (key === 'escape') {
        for (const id of ['controls', 'inspector'])
            $(`#${id}`).hidden = true;
    }
    if (key === 'c') {
        $('#cutaway').checked = !$('#cutaway').checked;
        setMode('mechanics');
        setOptions();
    }
    if (key === 'e') {
        $('#exploded').checked = !$('#exploded').checked;
        setMode('mechanics');
        setOptions();
    }
    if (key === 'm') {
        $('#sound').checked = !$('#sound').checked;
        audio.setEnabled($('#sound').checked);
    }
    const cameras = ['overview', 'follow', 'FL', 'FR', 'RL', 'RR', 'top', 'cutaway', 'release'];
    const index = Number(key) - 1;
    if (index >= 0 && index < cameras.length) {
        $('#camera').value = cameras[index];
        $('#camera').dispatchEvent(new Event('change'));
    }
});
listen(document, 'visibilitychange', () => {
    lastWall = performance.now();
    if (document.hidden)
        audio.setEnabled(false);
    else if ($('#sound').checked)
        audio.setEnabled(true);
});
const intersection = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; lastWall = performance.now(); });
intersection.observe($('#stage'));
function animate(now) {
    if (disposed)
        return;
    frame = requestAnimationFrame(animate);
    const elapsed = Math.max(0, (now - lastWall) / 1000);
    lastWall = now;
    if (!visible || document.hidden)
        return;
    experienceUI?.tick();
    if (watching && !$('#intelligenceDialog').open) {
        if (time >= sim.duration) {
            watchWait += elapsed;
            if ($('#watchLoop').checked && sim.result.stationary !== null && watchWait >= 1.8) { time = 0; watchWait = 0; watchCamera = null; playing = true; }
        }
    }
    const before = time;
    if (playing) {
        time = Math.min(sim.duration, time + elapsed * playback);
        if (time >= sim.duration)
            playing = false;
    }
    if (watching && !$('#intelligenceDialog').open) {
        const shot = watchShot(sim, time);
        $('#watchChapter').textContent = shot.label;
        if (watchCamera !== shot.camera) { watchCamera = shot.camera; directing = true; world?.setCamera(shot.camera); directing = false; }
    }
    if (playing && audio.enabled)
        for (const event of sim.events) {
            if (event.start > before && event.start <= time) {
                audio.triggerEvent(event, playback);
            }
        }
    if (now - lastUI > 33) {
        updateUI();
        lastUI = now;
    }else updateWorld();
    world?.render(now);
    if(window.__PIT_LAB_STATE__)window.__PIT_LAB_STATE__.render=world?.stats()??null;
    frames++;
    if (now - fpsStart > 1200) {
        const fps = frames * 1000 / (now - fpsStart);
        $('#renderStats').textContent = world ? `${playing ? `${Math.round(fps)} fps` : 'PAUSED'} · ${world.stats().calls} draws` : '2D ANALYSIS AVAILABLE';
        if (playing||(experienceUI?.mode==='challenge'&&experienceUI.debug.session?.started))
            world?.adapt(fps);
        frames = 0;
        fpsStart = now;
    }
}
function teardown() { disposed = true; cancelAnimationFrame(frame); intersection.disconnect(); listeners.forEach(remove => remove()); world?.dispose(); audio.dispose(); }
listen(window, 'pagehide', event => {
    if (event.persisted) {
        playing = false;
        audio.setEnabled(false);
    }
    else
        teardown();
});
listen(window, 'pageshow', () => lastWall = performance.now());
$('#pipeline').innerHTML = Array.from({ length: 5 }, (_, i) => `<div data-pipeline="${i}" data-status="pending"><span><i></i></span><b></b></div>`).join('');
rebuild(config);
try {
    const { createWorld } = await import('./world.js');
    world = createWorld($('#viewport'), select, notice);
    setOptions();
    setMode('world');
    experienceUI=createExperienceUI({world:()=>world,sim:()=>sim,listen,setMode,pause:()=>{stopWatch();playing=false;},audio});
    window.__SIM_READY__ = true;
}
catch (error) {
    $('#fallback').hidden = false;
    $('#viewport').hidden = true;
    notice(`3D unavailable: ${error.message}. Timing and analysis remain fully usable.`);
    setAnalysis(true);
    window.__SIM_READY__ = true;
}
if(!experienceUI){experienceUI=createExperienceUI({world:()=>world,sim:()=>sim,listen,setMode,pause:()=>{stopWatch();playing=false;},audio});experienceUI.choose('engineer');setAnalysis(true);}
if (params.get('ui') === '0')
    document.body.classList.add('hide-ui');
if (params.has('shot'))
    time = clamp(Number(params.get('shot')) || 0, 0, 1) * sim.duration;
if (params.get('camera')) {
    const name = params.get('camera');
    if (['hero', 'gun', 'hub', 'brake', 'wide'].includes(name))
        setMode('mechanics');
    world?.setCamera(name, true);
}
if (params.get('cutaway') === '1') {
    $('#cutaway').checked = true;
    setMode('mechanics');
    setOptions();
}
if (params.get('explode') === '1') {
    $('#exploded').checked = true;
    setMode('mechanics');
    setOptions();
}
if (params.get('play') === '1' && !reduced)
    playing = true;
if (innerWidth < 761)
    $('#inspectorBtn').setAttribute('aria-expanded', 'false');
updateUI();
lastWall = performance.now();
fpsStart = lastWall;
frame = requestAnimationFrame(animate);
