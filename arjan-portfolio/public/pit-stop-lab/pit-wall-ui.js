import { decisionEvidence, decisionForecast, validationPoints, prepareTelemetry, telemetryAt, locationAt, timeAtProgress, brakingZones } from './pit-wall.js';

export function createPitWall({ listen, getSimulation, chooseExperiment, chooseExperience, openAdvanced }) {
    const $ = id => document.getElementById(id), text = (id,value) => {const node=$(id),next=String(value);if(node.textContent!==next)node.textContent=next;};
    let archive=null, bundle=null, drivers=[], evidence=null, result=null, busy=false, revision=0, replayTime=0, playing=!matchMedia('(prefers-reduced-motion: reduce)').matches, last=0, lastPaint=0, timer=0, signature='', disposed=false, controller=null, selectedSource='quality';
    let point = () => ({x:0,y:0}), sweep=null, sweeping=false, sweepKeyUsed='';
    const sweepKey=()=>JSON.stringify({lap:Number($('pwDecisionLap').value),config:getSimulation().config,traffic:Number($('pwTraffic').value),gap:$('pwGap').value,rivalWait:Number($('pwRivalStop').value)});
    function emptySweep(){let html='<span></span>'+[5,10,15,20,25,30].map(v=>`<span>${v} s</span>`).join('');for(const probability of [75,60,45,30,15,0])html+=`<span>${probability}%</span>`+'<span aria-hidden="true">·</span>'.repeat(6);$('pwSweepGrid').innerHTML=html;}
    emptySweep();
    const cache=new Map(), pct=n=>`${(n*100).toFixed(1)}%`, signed=n=>`${n>=0?'+':'−'}${Math.abs(n).toFixed(3)}`;
    const state = () => { window.__PIT_WALL__={ready:!!drivers.length,busy,time:replayTime,playing,result,evidence:evidence?{cutoff:evidence.cutoff,counts:evidence.counts,validation:evidence.model.validation,lap:evidence.lap}:null}; };
    const status = value => {text('pwStatus',value);$('pwStatus').hidden=!value;};
    const assumptions = () => ({ transitLoss:Number($('pwTransit').value),traffic:Number($('pwTraffic').value),scProbability:Number($('pwSC').value)/100,gap:$('pwGap').value===''?NaN:Number($('pwGap').value),rivalWait:Number($('pwRivalStop').value),laps:8 });
    function controls(){text('pwTransitValue',`${Number($('pwTransit').value).toFixed(1)} s`);text('pwTrafficValue',`${Number($('pwTraffic').value).toFixed(1)} s`);text('pwSCValue',`${$('pwSC').value}%`);}
    function setPlaying(value){playing=value;text('pwPlay',value?'Ⅱ Pause':'▶ Replay');$('pwPlay').setAttribute('aria-pressed',String(value));last=performance.now();state();}
    function paintReplay(){
        if(!drivers.length)return;
        const main=telemetryAt(drivers[0],replayTime),progress=main?.progress??replayTime/drivers[0].duration;
        text('pwLapClock',`${String(Math.floor(replayTime/60)).padStart(2,'0')}:${(replayTime%60).toFixed(3).padStart(6,'0')}`);
        text('pwLapAction',!main?'Telemetry gap':main.brake?'BRAKING':main.drs?'DRS ACTIVE':main.throttle>90?'FULL THROTTLE':'PART THROTTLE');
        text('pwProgress',`${Math.round(progress*100)}%`);$('pwSeek').value=Math.round(replayTime/drivers[0].duration*1000);
        const delta=timeAtProgress(drivers[1],progress)-timeAtProgress(drivers[0],progress);text('pwDelta',`≈ ${delta>=0?'+':'−'}${Math.abs(delta).toFixed(2)} s`);$('pwDelta').dataset.ahead=String(delta<0);
        drivers.forEach((driver,i)=>{
            const sample=telemetryAt(driver,Math.min(replayTime,driver.duration)),position=point(locationAt(driver,Math.min(replayTime,driver.duration)));
            $('pwMarker'+i).setAttribute('transform',`translate(${position.x},${position.y})`);
            text(`pwSpeed${i}`,sample?Math.round(sample.speed):'—');text(`pwMobileSpeed${i}`,sample?Math.round(sample.speed):'—');text(`pwGear${i}`,sample?sample.gear:'—');text(`pwRPM${i}`,sample?`${(sample.rpm/1000).toFixed(1)}k`:'—');text(`pwThrottle${i}`,sample?`${Math.round(sample.throttle)}%`:'—');
            $(`pwThrottleBar${i}`).style.width=`${sample?.throttle??0}%`;$(`pwBrakeBar${i}`).style.width=`${sample?.brake??0}%`;
            text(`pwDRS${i}`,sample?.drs?'DRS ON':'DRS OFF');$(`pwDRS${i}`).dataset.on=String(!!sample?.drs);
        });
        $('pwTraceCursor').setAttribute('x1',progress*960);$('pwTraceCursor').setAttribute('x2',progress*960);state();
    }
    function seek(time){replayTime=Math.max(0,Math.min(drivers[0].duration,time));setPlaying(false);paintReplay();}
    function buildReplay(){
        $('pwDrivers').innerHTML=drivers.map((d,i)=>`<article class="pw-driver" style="--driver:${i?'#63ded0':'#ff553e'}"><div class="pw-driver-heading"><span>${i?'55 / SAI':'16 / LEC'}</span><b id="pwDRS${i}">DRS OFF</b></div><h2>${i?'Carlos Sainz':'Charles Leclerc'}</h2><div class="pw-driver-speed"><strong id="pwSpeed${i}">—</strong><small>km/h</small><div><span>GEAR <b id="pwGear${i}">—</b></span><span>RPM <b id="pwRPM${i}">—</b></span></div></div><div class="pw-pedal"><span>THROTTLE</span><div><i id="pwThrottleBar${i}"></i></div><b id="pwThrottle${i}">—</b></div><div class="pw-pedal pw-brake"><span>BRAKE</span><div><i id="pwBrakeBar${i}"></i></div><b>0 / 100</b></div></article>`).join('');
        const rotate=p=>({x:p.x*Math.cos(.65)-p.y*Math.sin(.65),y:p.x*Math.sin(.65)+p.y*Math.cos(.65)}),locations=drivers[0].locations,xs=locations.map(p=>rotate(p).x),ys=locations.map(p=>rotate(p).y),xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys),scale=Math.min(820/(xmax-xmin),470/(ymax-ymin));
        point=p=>{const r=rotate(p);return {x:480+(r.x-(xmin+xmax)/2)*scale,y:295-(r.y-(ymin+ymax)/2)*scale};};
        const path=locations.map((p,i)=>{const q=point(p);return `${i?'L':'M'}${q.x.toFixed(2)},${q.y.toFixed(2)}`;}).join(' ')+' Z';
        const colored=drivers[0].samples.filter((_,i)=>i%4===0).slice(1).map((r,i,rows)=>{const a=point(locationAt(drivers[0],rows[Math.max(0,i-1)].time)),b=point(locationAt(drivers[0],r.time));return `<path d="M${a.x},${a.y}L${b.x},${b.y}" stroke="${r.brake?'#ff553e':r.speed>250?'#63ded0':'#a9b6c4'}"/>`;}).join('');
        $('pwMapRoad').innerHTML=`<path d="${path}" fill="none" stroke="#02070a" stroke-width="32" transform="translate(0 8)"/><path d="${path}" fill="none" stroke="#42505b" stroke-width="23"/><path d="${path}" fill="none" stroke="#121d25" stroke-width="19"/><g fill="none" stroke-width="3" stroke-linecap="round" opacity=".85">${colored}</g>`;
        const zones=brakingZones(drivers[0]);
        $('pwMapEvents').innerHTML=zones.map((r,i)=>{const p=point(locationAt(drivers[0],r.time));return `<g transform="translate(${p.x},${p.y})"><circle r="18" fill="none" stroke="#d7e4e8" stroke-opacity=".12"/><text x="18" y="-16" class="pw-event-label">B${i+1}</text></g>`;}).join('');
        $('pwBrakeZones').replaceChildren(...zones.map((r,i)=>{const b=document.createElement('button');b.textContent=`B${i+1}`;b.setAttribute('aria-label',`Seek to braking event ${i+1} at ${r.time.toFixed(1)} seconds`);listen(b,'click',()=>seek(r.time));return b;}));
        $('pwTraceGrid').innerHTML=[0,100,200,300].map(v=>`<path d="M0 ${140-v*.4}H960" stroke="#fff" stroke-opacity=".08"/><text x="4" y="${136-v*.4}">${v}</text>`).join('');
        $('pwSpeedPaths').innerHTML=drivers.map((d,i)=>`<path d="${d.samples.map((r,j)=>`${j?'L':'M'}${(r.progress*960).toFixed(2)},${(140-r.speed*.4).toFixed(2)}`).join(' ')}" fill="none" stroke="${i?'#63ded0':'#ff6549'}" stroke-width="2" opacity="${i?.65:1}"/>`).join('');
        setPlaying(playing);paintReplay();
    }
    function sourceDetail(){
        if(!evidence)return;
        const e=evidence,m=e.model,c=e.counts;
        const description={
            laps:`${c.laps} completed laps, ${c.stints} known stints, ${c.flags} race-control messages and ${c.weather} weather records available by ${new Date(e.cutoff).toISOString()}. Later observations cannot enter this model. Telemetry lap 32 is a separate retrospective inspection.`,
            quality:`${c.accepted} accepted / ${c.excluded} excluded. Gates remove incomplete, start, pit, flagged and conspicuously slow laps. Compound and driver coverage are checked before fitting. Wet or unknown rainfall blocks this dry model.`,
            model:`Ridge λ = 0.1. Features: race lap, compound, compound-specific tire age and driver identity. ${m.validation.train} fitting laps through lap ${m.validation.cutoff}; ${m.validation.test} later available laps held out. 32 driver-stratified stint bootstraps preserve within-stint dependence. Hard-tire age association: ${signed(m.weights[2+m.compounds.indexOf('HARD')]/30)} s per additional tire lap. These are associations, not identified causal effects.`,
            crew:`The active ${getSimulation().config.scenario} event simulation supplies 64 seeded completed service/queue durations. An unsecured wheel prevents a release and clears the race call. Each of 9 actions faces the same 1,200 seeded pace, service and neutralisation draws.`,
            call:result?`${result.plans[0].label} leads this eight-lap entered-rival scenario. The Wilson interval describes Monte Carlo sampling error, not real-world calibration. Tire-age extrapolation, traffic, passing and sporting constraints limit applicability. No full-grid winning probability is calculated.`:'No recommendation is available while the result is stale or the safety guard blocks release.'
        };
        text('pwSourceDetail',description[selectedSource]);
        document.querySelectorAll('[data-pw-source]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.pwSource===selectedSource)));
    }
    function paintEvidence(){
        const e=evidence,m=e.model,v=m.validation,c=e.counts;
        text('pwCutoff',`AS OF ${new Date(e.cutoff).toISOString().slice(11,19)} UTC · NO FUTURE LAPS`);
        text('pwRailRaw',`${c.laps} completed laps`);text('pwRailQuality',`${c.accepted} accepted`);text('pwRailModel',`${v.mae.toFixed(3)} s held-out MAE`);text('pwRailCall',result?.plans[0].label??'Stale / blocked');
        text('pwFlowLaps',`${c.laps} completed`);text('pwFlowQuality',`${c.accepted} accepted`);text('pwFlowModel',`${v.mae.toFixed(3)} s MAE`);text('pwFlowCrew','64 stops / 1,200 futures');text('pwFlowCall',result?.plans[0].label??'Blocked / stale');
        text('pwMAE',`${v.mae.toFixed(3)} s`);text('pwBaseline',`${v.baselineMae.toFixed(3)} s`);text('pwValidationCount',v.test);text('pwBias',`bias ${signed(v.bias)} s`);
        const rows=validationPoints(e),range=Math.max(1,...rows.map(r=>Math.abs(r.residual))),min=Math.min(...rows.map(r=>r.lap)),max=Math.max(...rows.map(r=>r.lap));
        $('pwResiduals').innerHTML=`<path d="M22 78H550" stroke="#ffffff40" stroke-dasharray="3 4"/>${rows.map(r=>`<circle cx="${30+(r.lap-min)/Math.max(1,max-min)*500+(r.driver%7-3)*1.6}" cy="${78-r.residual/range*62}" r="2.5" fill="${r.residual>0?'#ffb09c':'#63ded0'}" opacity=".6"/>`).join('')}<text x="22" y="156">L${min}</text><text x="520" y="156">L${max}</text><text x="2" y="16">+${range.toFixed(1)}</text><text x="2" y="144">−${range.toFixed(1)}</text>`;
        sourceDetail();
    }
    function clearCall(message){result=null;$('pwBrief').disabled=true;$('pwSweep').disabled=true;text('pwCall',message);text('pwProbability','—');text('pwSaving','—');text('pwMCInterval','');$('pwPlans').replaceChildren();text('pwFlowCall','Awaiting evaluation');text('pwRailCall','Stale / blocked');state();}
    async function forecast(){
        if(!bundle||disposed)return;
        const run=++revision;busy=true;clearCall('Evaluating the pit call…');text('pwCallKind','COMPARING ACTIONS');text('pwWarning','');controls();
        try{
            const lap=Number($('pwDecisionLap').value);
            if(!cache.has(lap))cache.set(lap,decisionEvidence(bundle,16,lap));evidence=cache.get(lap);paintEvidence();
            const config={...getSimulation().config};$('pwService').value=config.scenario;
            text('pwServiceValue',getSimulation().result.stationary===null?'SAFETY HOLD':`${getSimulation().result.stationary.toFixed(3)} s stationary · +${getSimulation().result.queueWait.toFixed(3)} s queue`);
            const next=await decisionForecast(evidence,config,assumptions(),{yieldBatch:()=>new Promise(resolve=>setTimeout(resolve,0))});
            if(run!==revision||disposed)return;result=next;
            const best=result.plans[0],second=result.plans[1],v=evidence.model.validation;
            const weak=best.outside||v.mae>=v.baselineMae||best.interval[0]<=second.interval[1];
            text('pwCallKind',weak?'EXPLORATORY PREFERENCE':'SCENARIO PREFERENCE');text('pwCall',best.label);
            text('pwReason',best.outside?'Leading plan exceeds observed tire-age support. This is an extrapolation stress test, not an operational recommendation.':weak?'The model does not establish a decisive real-world advantage. Compare alternatives and inspect uncertainty.':'Preferred under the entered assumptions. Change inputs to test whether the call survives.');
            text('pwProbability',pct(best.probability));text('pwSaving',`${result.savedSeconds.toFixed(2)} s`);text('pwMCInterval',`95% MC sampling interval ${pct(best.interval[0])}–${pct(best.interval[1])} · entered rival only. Paired elapsed ΔT P10/P90: ${signed(best.relativeTime[0])}/${signed(best.relativeTime[2])} s vs stay out.`);
            $('pwPlans').innerHTML=`<div class="pw-plan-heading"><span>ACTION / ΔT VS STAY OUT</span><span>P(AHEAD)</span></div>`+result.plans.map((p,i)=>`<div class="pw-plan ${i?'':'pw-plan-best'}"><span>${p.label}${p.outside?' *':''}</span><div>${p.relativeTime[1]>=0?'+':'−'}${Math.abs(p.relativeTime[1]).toFixed(1)}s</div><b>${pct(p.probability)}</b></div>`).join('');
            text('pwWarning',result.warning+' * marks tire-age extrapolation.');$('pwBrief').disabled=false;paintEvidence();
        }catch(error){if(run!==revision||disposed)return;clearCall('No defensible call');text('pwCallKind','GUARD / INPUT CHECK');text('pwReason',error.message);text('pwWarning','Resolve the blocked release or invalid input before comparing actions.');text('pwServiceValue',getSimulation().result.stationary===null?'SAFETY HOLD':'Input validation blocked comparison.');sourceDetail();}
        finally{if(run===revision){busy=false;$('pwSweep').disabled=!result||sweeping;state();}}
    }
    function changed(){revision++;if(sweepKeyUsed&&sweepKeyUsed!==sweepKey()){sweep=null;window.__PIT_WALL_SWEEP__=null;emptySweep();text('pwSweepStatus','Evidence or fixed assumptions changed. Run a fresh sweep.');}clearCall('Inputs changed…');clearTimeout(timer);timer=setTimeout(forecast,180);controls();}
    async function load(){
        if(busy||disposed)return;busy=true;status('Loading the archived timing and telemetry…');$('pwRetry').hidden=true;controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),20000);
        try{
            const read=async name=>{const r=await fetch(new URL(`./data/${name}`,import.meta.url),{signal:controller.signal});if(!r.ok)throw new Error(`Archive unavailable (HTTP ${r.status}).`);return r.json();};
            [bundle,archive]=await Promise.all([read('bahrain-2024.json'),read('telemetry-bahrain-2024.json')]);drivers=prepareTelemetry(archive);buildReplay();if(pendingSeek!==null){seek(pendingSeek);pendingSeek=null;}status('');busy=false;await forecast();
        }catch(error){if(disposed)return;busy=false;status(`Archive could not load. ${error.message}`);$('pwRetry').hidden=false;state();}
        finally{clearTimeout(timeout);}
    }
    for(const id of ['pwTransit','pwTraffic','pwSC','pwGap'])listen($(id),'input',changed);
    for(const id of ['pwDecisionLap','pwRivalStop'])listen($(id),'change',changed);
    listen($('pwService'),'change',()=>{chooseExperiment($('pwService').value);changed();});
    listen($('pwReset'),'click',()=>{for(const [id,value] of Object.entries({pwDecisionLap:32,pwTransit:20,pwTraffic:0,pwSC:0,pwGap:2,pwRivalStop:2,pwService:'coordinated'}))$(id).value=value;chooseExperiment('coordinated');changed();});
    listen($('pwPlay'),'click',()=>{if(drivers.length){if(replayTime>=drivers[0].duration)replayTime=0;setPlaying(!playing);}});
    listen($('pwSeek'),'input',()=>{if(drivers.length)seek(Number($('pwSeek').value)/1000*drivers[0].duration);});
    listen($('pwTelemetry'),'pointerdown',e=>{if(!drivers.length)return;const el=e.currentTarget;el.setPointerCapture(e.pointerId);const r=el.getBoundingClientRect();seek(timeAtProgress(drivers[0],(e.clientX-r.left)/r.width));});
    listen($('pwTelemetry'),'pointermove',e=>{if(!drivers.length||e.buttons!==1)return;const r=e.currentTarget.getBoundingClientRect();seek(timeAtProgress(drivers[0],(e.clientX-r.left)/r.width));});
    listen($('pwGarage'),'click',()=>chooseExperience('explore'));
    listen($('pwAdvanced'),'click',()=>{chooseExperience('engineer');openAdvanced();});
    listen($('pwMethods'),'click',()=>document.querySelector('.pw-evidence').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'}));
    for(const b of document.querySelectorAll('[data-pw-source]'))listen(b,'click',()=>{selectedSource=b.dataset.pwSource;sourceDetail();if(b.closest('.pw-provenance-rail'))document.querySelector('.pw-evidence').scrollIntoView({block:'start'});});
    listen($('pwRetry'),'click',load);
    listen($('pwSweep'),'click',async()=>{
        if(!result||busy||sweeping)return;
        const version=revision,config={...getSimulation().config},inputs=assumptions();sweepKeyUsed=sweepKey();sweeping=true;$('pwSweep').disabled=true;sweep=null;window.__PIT_WALL_SWEEP__=null;emptySweep();
        const cells=[];
        try{
            for(const scProbability of [.75,.6,.45,.3,.15,0])for(const transitLoss of [5,10,15,20,25,30]){
                const comparison=await decisionForecast(evidence,config,{...inputs,scProbability,transitLoss},{runs:200,yieldBatch:()=>new Promise(resolve=>setTimeout(resolve,0))});
                if(disposed||revision!==version){text('pwSweepStatus','Sweep canceled because inputs changed. Run again with fixed assumptions.');return;}
                const best=comparison.plans[0];cells.push({scProbability,transitLoss,wait:best.wait,compound:best.compound,probability:best.probability,outside:best.outside,relativeTime:best.relativeTime});
                text('pwSweepStatus',`Comparing ${cells.length} / 36 assumption combinations…`);
            }
            sweep={key:sweepKeyUsed,fixed:inputs,config,seed:42,runs:200,cells};
            let html='<span></span>'+[5,10,15,20,25,30].map(v=>`<span>${v} s</span>`).join('');
            cells.forEach((c,i)=>{if(i%6===0)html+=`<span>${Math.round(c.scProbability*100)}%</span>`;const label=c.wait<0?'OUT':`${c.compound==='HARD'?'H':'S'}${c.wait}`;html+=`<button data-transit="${c.transitLoss}" data-sc="${c.scProbability*100}" data-tire="${c.wait<0?'OUT':c.compound}" aria-label="Inspect ${c.transitLoss} seconds transit and ${Math.round(c.scProbability*100)} percent neutralisation: ${label}, ${(c.probability*100).toFixed(1)} percent ahead of entered rival">${label}</button>`;});
            $('pwSweepGrid').innerHTML=html;text('pwSweepStatus','36 combinations complete · 200 shared seeded futures each. Select a cell to investigate.');window.__PIT_WALL_SWEEP__=sweep;
        }catch(error){text('pwSweepStatus',`Sweep unavailable: ${error.message}`);}
        finally{sweeping=false;$('pwSweep').disabled=busy||!result;}
    });
    listen($('pwSweepGrid'),'click',e=>{const b=e.target.closest('button[data-transit]');if(!b||!sweep||sweep.key!==sweepKey())return;$('pwTransit').value=b.dataset.transit;$('pwSC').value=b.dataset.sc;changed();$('pwMethods').scrollIntoView({block:'end'});});
    listen($('pwBrief'),'click',()=>{
        if(!result||busy)return;
        const r=result,v=evidence.model.validation;
        const brief=`# Pit Stop Lab — engineering decision record\n\nIndependent educational study by Arjan Singh Puniani.\n\n## Reproduction\n\nSession 9472, Bahrain 2024. Information cutoff ${new Date(evidence.cutoff).toISOString()}; start of LEC lap ${evidence.lap}. Only completed laps and available stint, weather and race-control records enter training. Seed ${r.seed}; ${r.runs} shared Monte Carlo futures; 32 stint-bootstrap pace models; 64 service/queue samples.\n\n## Conditional comparison\n\n${r.plans.map(p=>`- ${p.label}: ${(p.probability*100).toFixed(1)}% ahead of entered rival; median modeled elapsed ${p.medianTime.toFixed(3)} s; tire-age extrapolation ${p.outside}.`).join('\n')}\n\n## Validation\n\n${v.train} earlier fitting laps; ${v.test} later available validation laps. Ridge MAE ${v.mae.toFixed(6)} s; constant-pace MAE ${v.baselineMae.toFixed(6)} s; bias ${v.bias.toFixed(6)} s. Validation measures pace error, not strategy-outcome calibration.\n\n## Assumptions and guards\n\n${JSON.stringify(r.scenario,null,2)}\n\nCrew configuration:\n${JSON.stringify(r.config,null,2)}\n\n${r.warning}\n\nNo overtaking/retirement/tire-eligibility model; no full-grid win forecast; Monte Carlo intervals are simulation sampling intervals. Telemetry is a separately archived, retrospectively lap-aligned comparison, never an ML feature. OpenF1 is an independent source, not an official team feed.\n\nSources: https://openf1.org/docs/\nhttps://arjansinghpuniani.com/pit-stop-lab/data/telemetry-bahrain-2024.json\nhttps://arjansinghpuniani.com/pit-stop-lab/data/bahrain-2024.json\n\n## Machine-readable result\n\n\x60\x60\x60json\n${JSON.stringify({...r,robustnessSweep:sweep?.key===sweepKey()?sweep:null},null,2)}\n\x60\x60\x60\n`;
        const url=URL.createObjectURL(new Blob([brief],{type:'text/markdown'})),a=document.createElement('a');a.href=url;a.download=`pit-wall-lap-${evidence.lap}-seed-${r.seed}.md`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    });
    const compact=matchMedia('(max-width: 640px)'),fitMap=()=>{ $('pwTrack').setAttribute('viewBox',compact.matches?'210 15 540 550':'0 0 960 570'); };listen(compact,'change',fitMap);fitMap();
    let pendingSeek=null,started=false;
    return {seekTo(time){if(drivers.length)seek(time);else pendingSeek=time;},tick(now){
        if(!started){started=true;load();}
        const next=JSON.stringify(getSimulation().config);if(signature&&signature!==next&&!busy)changed();signature=next;
        let advanced=false;
        if(drivers.length&&playing){advanced=true;replayTime+=Math.min(.1,Math.max(0,(now-last)/1000))*Number($('pwSpeed').value);if(replayTime>=drivers[0].duration){replayTime=drivers[0].duration;setPlaying(false);}}
        last=now;if(drivers.length&&advanced&&now-lastPaint>14){paintReplay();lastPaint=now;}
    },dispose(){disposed=true;revision++;clearTimeout(timer);controller?.abort();}};
}
