import { prepareDataset, trainModel, predict, evaluateStrategies } from './intelligence.js';
import { simulate } from './simulation.js';
import { createDataExperience } from './data-experience.js';
export function createIntelligenceUI(getSimulation, listen) {
    const $ = id => document.getElementById(id), dialog = $('intelligenceDialog');
    let model = null, bundle = null, result = null, busy = false, revision = 0;
    const pct = p => `${(p * 100).toFixed(1)}%`;
    const status = message => { $('intelligenceStatus').textContent = message; experience.update(); if (dialog.open) dialog.scrollTop = 0; };
    const numeric = id => Number($(id).value);
    const download = (value, name) => {
        const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    const experience = createDataExperience({getModel:()=>model,getBundle:()=>bundle,getResult:()=>result,getSimulation,readScenario:scenario,listen,isLoading:()=>busy});
    function invalidate() {
        revision++;
        result = null;
        $('intelExport').disabled = true;
        $('intelCall').textContent = model ? 'Inputs changed. Evaluate again.' : 'Train first. Then compare.';
        $('intelProbability').textContent = '—';
        $('intelUplift').textContent = '—';
        $('intelMargin').textContent = '—';
        $('intelPlans').replaceChildren();
        $('intelReason').textContent = 'Run the same seeded futures for every candidate action.';
        const sim = getSimulation();
        $('intelService').textContent = sim.result.stationary === null ? 'Safety hold: no race call is available until retention is confirmed.' : `Your stationary time: ${sim.result.stationary.toFixed(3)} s from the active ${sim.config.scenario} experiment. Crew variation, traffic holds and any stack queue feed the race trials; the local segment's race-loss number is not used as full-lane transit.`;
        $('intelRun').disabled = busy || !model || sim.result.stationary === null;
        $('intelWarning').textContent = sim.result.stationary === null ? 'Resolve the pit safety hold before evaluating race futures.' : 'Conditional scenario only. No calibrated real-world win probability.';
        window.__PIT_INTELLIGENCE__ = { state: 'stale', source: model?.data.session ?? null };
        experience.reset();
    }
    function selectOptions(id, values, preferred, label = x => x) {
        const select = $(id);
        select.replaceChildren();
        for (const value of values) {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = label(value);
            select.append(option);
        }
        select.value = String(values.includes(preferred) ? preferred : values[0]);
    }
    function scenario() {
        for (const el of dialog.querySelectorAll('.intel-inputs input[type=number]:not(#intelSession)'))
            if (!el.checkValidity() || el.value.trim() === '')
                throw new Error('Complete every numeric race input within its displayed bounds.');
        return { driver: numeric('intelDriver'), lap: numeric('intelLap'), laps: numeric('intelLaps'), age: numeric('intelAge'), current: $('intelCurrent').value, next: $('intelNext').value, transitLoss: numeric('intelTransit'), rivalService: numeric('intelRivalService'), traffic: numeric('intelTraffic'), scProbability: numeric('intelSC') / 100, rivals: [0, 1].map(i => ({ driver: numeric(`intelRival${i}`), gap: numeric(`intelGap${i}`), age: numeric(`intelRivalAge${i}`), pit: numeric(`intelPit${i}`) })) };
    }
    function paceChart() {
        if (!model)
            return;
        const driver = numeric('intelDriver'), lap = numeric('intelLap');
        if (!model.drivers.includes(driver) || !Number.isFinite(lap) || lap < 1 || lap > 200)
            return;
        const colors = ['#f27c59', '#b0d3b4', '#e5c883'];
        const curves = model.compounds.map(compound => { const support = model.support[compound]; return { compound, points: Array.from({ length: support.maxAge - support.minAge + 1 }, (_, i) => { const age = support.minAge + i; return { age, seconds: predict(model, { driver, compound, age, lap }) }; }) }; });
        const values = curves.flatMap(c => c.points.map(p => p.seconds)), min = Math.min(...values) - .2, max = Math.max(...values) + .2, maxAge = Math.max(...curves.flatMap(c => c.points.map(p => p.age)));
        const x = age => 55 + age / maxAge * 550, y = seconds => 140 - (seconds - min) / (max - min) * 110;
        $('intelPace').innerHTML = `<path d="M55 20V140H605" fill="none" stroke="#668177"/>${[0, .5, 1].map(f => `<text x="3" y="${y(min + f * (max - min)) + 3}">${(min + f * (max - min)).toFixed(1)}s</text><path d="M55 ${y(min + f * (max - min))}H605" stroke="#355348" stroke-dasharray="3 5"/>`).join('')}${curves.map((c, i) => `<path d="${c.points.map((p, j) => `${j ? 'L' : 'M'}${x(p.age).toFixed(1)},${y(p.seconds).toFixed(1)}`).join(' ')}" fill="none" stroke="${colors[i]}" stroke-width="2.5"/><text x="${75 + i * 150}" y="17" fill="${colors[i]}">${c.compound}</text>`).join('')}<text x="55" y="162">0</text><text x="570" y="162">${maxAge} laps</text>`;
        $('intelPaceNote').textContent = `Predicted pace vs tire age · Car ${driver} · race lap ${lap} fixed. Lines stop at observed training-age support. These are associations, not isolated causal tire degradation. Unsupported compounds are omitted.`;
    }
    function bindModel(nextBundle) {
        const data = prepareDataset(nextBundle), trained = trainModel(data);
        bundle = nextBundle;
        model = trained;
        selectOptions('intelDriver', data.drivers, 1, d => `Car ${d}`);
        selectOptions('intelCurrent', data.compounds, 'HARD');
        selectOptions('intelNext', data.compounds, 'SOFT');
        $('intelLap').value = Math.max(2, data.maxLap - 17);
        $('intelLaps').value = Math.min(18, data.maxLap - 1);
        $('intelRivals').replaceChildren();
        for (let i = 0; i < 2; i++) {
            const row = document.createElement('div');
            row.className = 'intel-rival';
            row.innerHTML = `<label>Rival ${i + 1}<select id="intelRival${i}"></select></label><label>Gap · s<input id="intelGap${i}" type="number" min="-60" max="120" step=".1" value="${i ? -9 : -3}" /></label><label>Tire age<input id="intelRivalAge${i}" type="number" min="0" max="60" value="${i ? 18 : 20}" /></label><label>Pit in · laps<input id="intelPit${i}" type="number" min="-1" max="39" value="${i ? 4 : 2}" /></label>`;
            $('intelRivals').append(row);
            selectOptions(`intelRival${i}`, data.drivers, data.drivers.includes(i ? 55 : 11) ? (i ? 55 : 11) : data.drivers[i + 1], d => `Car ${d}`);
        }
        $('intelSource').textContent = `${data.session.name} · ${data.session.date.slice(0, 10)} · session ${data.session.key} · ${data.rows.length}/${data.rawCount} clean laps`;
        $('intelWeather').textContent = `${data.weather.samples} historical weather samples · dry · track ${data.weather.trackMin?.toFixed(1) ?? '?'}–${data.weather.trackMax?.toFixed(1) ?? '?'} °C. Retrieved ${data.retrievedAt.slice(0, 10)}. Not live telemetry.`;
        const v = model.validation;
        $('intelValidation').innerHTML = `<div><span>HELD-OUT PACE ERROR</span><strong>${v.mae.toFixed(3)} s</strong><small>MAE · ${v.test} laps after lap ${v.cutoff}</small></div><div><span>MEAN-PACE BASELINE</span><strong>${v.baselineMae.toFixed(3)} s</strong><small>same held-out laps</small></div><div><span>TRAINING / FILTERED OUT</span><strong>${v.train} / ${data.excluded}</strong><small>ridge λ 0.1 · 32 stint bootstraps</small></div>`;
        $('intelSourceLinks').replaceChildren();
        for (const endpoint of ['sessions', 'laps', 'stints', 'race_control', 'weather']) {
            const a = document.createElement('a');
            a.href = `https://api.openf1.org/v1/${endpoint}?session_key=${data.session.key}`;
            a.textContent = `${endpoint} ↗ `;
            a.target = '_blank';
            a.rel = 'noreferrer';
            $('intelSourceLinks').append(a);
        }
        $('intelDataExport').disabled = false;
        invalidate();
        paceChart();
        status(`Trained locally: ${v.train} training laps; ${v.test} later laps held out. ${v.mae < v.baselineMae ? 'Pace model beats the mean-pace baseline in this session.' : 'Model does not beat the baseline; use extra caution.'}`);
    }
    async function load(operation) {
        if (busy)
            return;
        busy = true;
        invalidate();
        $('intelRefresh').disabled = true;
        $('intelImport').disabled = true;
        status('Loading historical records and fitting the pace model…');
        try {
            bindModel(await operation());
        }
        catch (error) {
            status(`Data not loaded: ${error.message}. ${model ? 'Previous calibration retained.' : 'Retry the example or import a valid dry-race bundle.'}`);
        }
        finally {
            busy = false;
            $('intelRefresh').disabled = false;
            $('intelImport').disabled = false;
            $('intelRun').disabled = !model || getSimulation().result.stationary === null;
            experience.update();
        }
    }
    async function readJSON(url) {
        const response = await fetch(url, { signal: AbortSignal.timeout(20000), credentials: 'omit' });
        if (!response.ok)
            throw new Error(`Source returned HTTP ${response.status}`);
        const text = await response.text();
        if (text.length > 5e6)
            throw new Error('Source exceeds the 5 MB limit.');
        return JSON.parse(text);
    }
    function renderResult() {
        const best = result.plans[0];
        $('intelCall').textContent = best.label;
        $('intelProbability').textContent = pct(best.probability);
        $('intelInterval').textContent = `${pct(best.interval[0])}–${pct(best.interval[1])} · 95% sampling interval`;
        $('intelUplift').textContent = `${result.uplift >= 0 ? '+' : ''}${(result.uplift * 100).toFixed(1)} pp`;
        $('intelBaseline').textContent = result.baseline;
        $('intelMargin').textContent = best.margin.map(x => `${x > 0 ? '+' : ''}${x.toFixed(1)}`).join(' / ') + ' s';
        const runner = result.plans[1], overlaps = best.interval[0] <= runner.interval[1];
        $('intelReason').textContent = `${result.plans.length} actions × ${result.runs.toLocaleString()} shared seeded futures. ${overlaps ? 'The top two sampling intervals overlap: keep both calls under consideration.' : 'The leading action has a separated sampling interval from the runner-up.'} Your stop loss samples: ${result.service.min.toFixed(2)}–${result.service.max.toFixed(2)} s plus ${result.scenario.transitLoss.toFixed(1)} s assumed full-lane transit loss.`;
        $('intelWarning').textContent = `${result.warning} ${model.validation.mae >= model.validation.baselineMae ? 'Held-out ML error is worse than baseline.' : ''} Rival ages, fuel/traffic confounding and sporting eligibility require engineer review.`;
        $('intelPlans').replaceChildren();
        for (const [i, p] of result.plans.entries()) {
            const row = document.createElement('div');
            row.className = 'intel-plan';
            row.dataset.best = String(i === 0);
            row.innerHTML = `<div><b>${String(i + 1).padStart(2, '0')}</b><span>${p.label}<small>${p.outside ? 'TIRE-AGE EXTRAPOLATION' : 'Within tire-age support'}</small></span><strong>${pct(p.probability)}</strong><button data-preview-plan="${i}" aria-pressed="false">Replay ↗</button></div><div class="intel-bar"><i style="width:${p.probability * 100}%"></i><span style="left:${p.interval[0] * 100}%;width:${(p.interval[1] - p.interval[0]) * 100}%"></span></div><p>P50 gap ${p.margin[1] >= 0 ? '+' : ''}${p.margin[1].toFixed(2)} s · P10–P90 ${p.margin[0].toFixed(2)} to ${p.margin[2].toFixed(2)} s</p>`;
            $('intelPlans').append(row);
        }
        $('intelExport').disabled = false;
        window.__PIT_INTELLIGENCE__ = { state: 'ready', result, validation: model.validation, support: model.support };
        status(`Evaluation complete · seed ${result.seed} · ${result.runs} trials per action · first of ${result.scenario.rivals.length + 1} entered cars, not a full-grid win forecast.`);
        experience.preview(0);
        if (innerWidth > 650)
            dialog.scrollTop = 0;
        else
            $('raceReplay').scrollIntoView({ block: 'start' });
    }
    listen($('intelligenceOpen'), 'click', () => { dialog.showModal(); if (!model)
        load(() => readJSON('./data/bahrain-2024.json')); });
    listen($('dataRoomBtn'), 'click', async () => {dialog.showModal();if(!model)await load(()=>readJSON('./data/bahrain-2024.json'));if(model&&!result&&!busy)$('intelRun').click();});
    listen($('intelligenceClose'), 'click', () => dialog.close());
    listen($('intelRefresh'), 'click', () => load(async () => {
        const key = numeric('intelSession');
        if (!$('intelSession').checkValidity() || !Number.isInteger(key))
            throw new Error('Enter a valid session key.');
        const sessions = await readJSON(`https://api.openf1.org/v1/sessions?session_key=${key}`);
        if (!Array.isArray(sessions) || sessions.length !== 1 || sessions[0].session_name !== 'Race' || Date.parse(sessions[0].date_end) >= Date.now())
            throw new Error('Choose a completed historical race.');
        const next = { schema: 1, source: 'OpenF1', retrievedAt: new Date().toISOString(), session: sessions[0] };
        for (const endpoint of ['laps', 'stints', 'race_control', 'weather']) {
            await new Promise(resolve => setTimeout(resolve, 1100));
            next[endpoint] = await readJSON(`https://api.openf1.org/v1/${endpoint}?session_key=${key}`);
        }
        return next;
    }));
    listen($('intelImport'), 'change', e => { const file = e.target.files?.[0]; if (!file)
        return; load(async () => { if (file.size > 5e6)
        throw new Error('Import exceeds 5 MB.'); return JSON.parse(await file.text()); }); e.target.value = ''; });
    listen($('intelDataExport'), 'click', () => { if (bundle)
        download(bundle, `openf1-${model.data.session.key}.json`); });
    listen($('intelExport'), 'click', () => { if (result)
        download({ schema: 1, model: 'Pit Stop Lab / historical ridge + scenario Monte Carlo v1', createdAt: new Date().toISOString(), ...result, calibration: { session: model.data.session, retrievedAt: model.data.retrievedAt, filters: model.data.rejected, weights: model.weights, featureOrder: ['intercept', 'raceLap/60', ...model.compounds.map(c => `${c}:age/30`), ...model.compounds.slice(1).map(c => `${c}:offset`), ...model.drivers.slice(1).map(d => `driver:${d}`)], support: model.support }, pitConfiguration: getSimulation().config, limitations: 'First of entered cars only. Uncalibrated outcome probabilities; dry, single-stop scenario. Transit, rival plans and SC factors are assumptions; no inventory, sporting, traffic or overtaking model. Export data separately to reproduce calibration.' }, `pit-decision-seed-${result.seed}.json`); });
    listen(dialog.querySelector('.intel-inputs'), 'change', e => { if (e.target.id === 'intelImport' || e.target.id === 'intelSession')
        return; invalidate(); paceChart(); });
    listen($('intelRun'), 'click', async () => {
        if (!model || busy)
            return;
        const currentRevision = ++revision;
        result = null;
        $('intelExport').disabled = true;
        $('intelRun').disabled = true;
        try {
            const s = scenario(), runs = numeric('intelRuns'), seed = numeric('intelSeed'), sim = getSimulation();
            if (sim.result.stationary === null)
                throw new Error('Safety hold: no completed stop.');
            const samples = Array.from({ length: 128 }, (_, i) => { const sample = simulate({ ...sim.config, seed: (seed + i) >>> 0 }); return sample.result.stationary + sample.result.queueWait + (sample.queue ? .9 : 0); });
            status(`Evaluating ${runs.toLocaleString()} race futures for each action…`);
            experience.setRunning(true);
            const evaluation = await evaluateStrategies(model, s, { runs, seed, serviceSamples: samples, yieldBatch: async () => { await new Promise(resolve => setTimeout(resolve, 0)); if (revision !== currentRevision)
                    throw new Error('Inputs changed. Evaluate again.'); } });
            if (revision === currentRevision) {
                result = evaluation;
                renderResult();
            }
        }
        catch (error) {
            status(`Evaluation unavailable: ${error.message}`);
        }
        finally {
            experience.setRunning(false);
            $('intelRun').disabled = !model || getSimulation().result.stationary === null;
            experience.update();
        }
    });
    return { invalidate };
}
