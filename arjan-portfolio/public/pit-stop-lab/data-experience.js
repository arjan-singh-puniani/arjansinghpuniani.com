import { raceProfile, raceFrame } from './intelligence.js';

const EDGES = [['laps','filter'],['stints','filter'],['flags','filter'],['weather','filter'],['filter','model'],['model','futures'],['pit','futures'],['assumptions','futures'],['futures','decision']];
export function createDataExperience({ getModel, getBundle, getResult, getSimulation, readScenario, listen, isLoading }) {
    const $ = id => document.getElementById(id), graph = $('dataFlow'), dialog = $('intelligenceDialog');
    let selected = null, running = false, replay = [], replayTime = 0, duration = 1, playing = false, frame = 0, wall = 0;
    const nodes = Object.fromEntries([...graph.querySelectorAll('[data-flow]')].map(node => [node.dataset.flow, node]));
    function drawEdges() {
        const rect = graph.getBoundingClientRect(); if (!rect.width) return;
        $('flowEdges').setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
        const ancestors = new Set(selected ? [selected] : []);
        for (let i=0;i<EDGES.length;i++) for(const [from,to] of EDGES) if(ancestors.has(to)) ancestors.add(from);
        const descendants = new Set(selected ? [selected] : []);
        for (let i=0;i<EDGES.length;i++) for(const [from,to] of EDGES) if(descendants.has(from)) descendants.add(to);
        $('flowEdges').innerHTML = '<defs><marker id="flowArrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#a9bd94"/></marker></defs>'+EDGES.map(([from,to]) => {
            const a=nodes[from].getBoundingClientRect(),b=nodes[to].getBoundingClientRect(),x=a.right-rect.left,y=a.top+a.height/2-rect.top,x2=b.left-rect.left,y2=b.top+b.height/2-rect.top;
            const vertical=Math.abs(a.left-b.left)<2;
            const curve=vertical?`M${a.left+a.width/2-rect.left},${a.bottom-rect.top}V${b.top-rect.top}`:`M${x},${y} C${x+(x2-x)/2},${y} ${x+(x2-x)/2},${y2} ${x2},${y2}`;
            return `<path d="${curve}" marker-end="url(#flowArrow)" data-active="${(ancestors.has(from)&&ancestors.has(to))||(descendants.has(from)&&descendants.has(to))}"/>`;
        }).join('');
    }
    function detail() {
        if (!selected) return;
        const model=getModel(),bundle=getBundle(),result=getResult(),sim=getSimulation();
        let scenario=null;try { scenario=readScenario(); } catch { /* Inputs may be incomplete while editing. */ }
        const info = {
            laps: ['Lap timing', 'Observed lap durations supply the training target. Pit, start, incident and incomplete laps are filtered.', bundle?.laps.slice(0,3)],
            stints: ['Tire stints', 'Driver and lap ranges join each lap to its compound and tire age. These become model features.', bundle?.stints.slice(0,3)],
            flags: ['Race control', 'Flags and neutralisation messages exclude affected laps. Chequered flags stay eligible.', bundle?.race_control.filter(r=>r.flag).slice(0,3)],
            weather: ['Weather / dry gate', 'Rainfall gates this dry model. Track temperature is historical context; weather is not a pace-regression feature.', bundle?.weather.slice(0,3)],
            pit: ['Crew + release', 'The active experiment supplies stop and queue samples to your race futures. An unsecured wheel blocks evaluation.', {scenario:sim.config.scenario,stationary:sim.result.stationary,queue:sim.result.queueWait,release:sim.result.status,criticalCorner:sim.result.criticalCorner}],
            filter: ['Joined, filtered laps', 'These accepted records become training and validation sets. Source records are preserved for audit.', model ? {accepted:model.data.rows.length,excluded:model.data.excluded,reasons:model.data.rejected,sample:model.data.rows[0]} : null],
            model: ['Learned pace', 'Ridge regression learns race-lap, compound, tire-age and driver associations. Later laps measure prediction error.', model?.validation],
            assumptions: ['Race assumptions', 'These are entered scenario choices, not observed current race data or AI weather forecasts.', scenario],
            futures: ['Race futures', 'Every action uses shared model draws, pit variation and race events. Percentages describe the entered rivals only.', result ? {trials:result.runs,seed:result.seed,actions:result.plans.length,service:result.service} : null],
            decision: ['Ranked pit call', 'Rank by simulated chance of finishing ahead of all entered rivals. Replay uses the central pace model, without random events.', result?.plans.slice(0,3)]
        }[selected];
        $('flowWatch').hidden=selected!=='pit'; $('flowTitle').textContent=info[0]; $('flowDescription').textContent=info[1];
        $('flowSample').hidden=!info[2]; $('flowSample').textContent=info[2] ? JSON.stringify(info[2],null,2) : '';
        for (const [id,node] of Object.entries(nodes)) node.setAttribute('aria-pressed',String(id===selected));
    }
    function update() {
        const m=getModel(),b=getBundle(),r=getResult(),s=getSimulation();
        const metrics={laps:b?`${b.laps.length.toLocaleString()} laps`:'Not loaded',stints:b?`${b.stints.length} stints`:'Not loaded',flags:b?`${b.race_control.length} messages`:'Not loaded',weather:m?`Dry · ${m.data.weather.trackMin?.toFixed(1)??'?'}–${m.data.weather.trackMax?.toFixed(1)??'?'} °C`:'Not loaded',pit:s.result.stationary===null?'SAFETY HOLD':`${s.result.stationary.toFixed(3)} s stop`,filter:m?`${m.data.rows.length} accepted / ${m.data.excluded} excluded`:'Awaiting evidence',model:m?`${m.validation.mae.toFixed(3)} s held-out MAE`:'Awaiting fit',assumptions:'Rivals · transit · neutralisation',futures:running?'Calculating…':r?`${r.runs.toLocaleString()} trials × ${r.plans.length} actions`:'Needs evaluation',decision:r?r.plans[0].label:'Needs evaluation'};
        for(const [id,value] of Object.entries(metrics)) nodes[id].querySelector('output').textContent=value;
        graph.dataset.state=isLoading()?'loading':running?'calculating':r?'ready':m?'stale':'empty';
        detail();drawEdges();
    }
    function pause() { playing=false;cancelAnimationFrame(frame);$('racePlay').textContent='▶ Play race';$('racePlay').setAttribute('aria-pressed','false'); }
    function renderReplay() {
        if(!replay.length)return;
        const path=$('raceTrackPath'),length=path.getTotalLength();
        const states=replay.map((car,i)=>{
            const state=raceFrame(car.profile,replayTime-car.gap),point=path.getPointAtLength((state.progress%1)*length);
            const dot=$(`raceCar${i}`);dot.setAttribute('transform',`translate(${state.phase==='PIT'?255+i*37:point.x},${state.phase==='PIT'?173:point.y+(i-1.5)*5})`);
            return {...state,label:car.label,driver:car.profile.driver};
        });
        $('raceTimeline').value=String(replayTime/duration*1000);
        $('raceClock').textContent=`${Math.floor(replayTime/60)}:${String(Math.floor(replayTime%60)).padStart(2,'0')}`;
        $('racePositions').replaceChildren();
        states.forEach((state,i)=>{const row=document.createElement('div');row.style.setProperty('--car-color',replay[i].color);const name=document.createElement('b'),value=document.createElement('span');name.textContent=state.label;value.textContent=`Lap ${state.lap} · ${state.phase} · ${state.compound.toLowerCase()}`;row.append(name,value);$('racePositions').append(row);});
        window.__PIT_RACE_REPLAY__={time:replayTime,playing,duration,states};
    }
    function tick(now) {
        if(!playing)return;
        replayTime=Math.min(duration,replayTime+Math.max(0,(now-wall)/1000)*120);wall=now;renderReplay();
        if(replayTime>=duration){pause();renderReplay();}else frame=requestAnimationFrame(tick);
    }
    function preview(index=0) {
        const result=getResult(),model=getModel();if(!result||!model||!Number.isInteger(index)||!result.plans[index])return;
        pause();replayTime=0;
        const s=result.scenario,plan=result.plans[index],baseline=result.plans.find(p=>p.wait===0&&p.compound===s.next);
        replay=[{label:`You · ${plan.label}`,color:'#f28761',profile:raceProfile(model,s,s.driver,s.age,plan.wait,plan.compound,result.service.median),gap:0},{label:`Baseline · ${baseline.label}`,color:'#8ebdde',profile:raceProfile(model,s,s.driver,s.age,baseline.wait,baseline.compound,result.service.median),gap:0},...s.rivals.map((r,i)=>({label:`Rival · car ${r.driver}`,color:i?'#e7cc88':'#a4d1a2',profile:raceProfile(model,s,r.driver,r.age,r.pit,s.next,s.rivalService),gap:r.gap}))];
        duration=Math.max(...replay.map(car=>car.profile.duration+car.gap));
        $('raceCars').innerHTML=replay.map((car,i)=>`<g id="raceCar${i}"><circle r="${i===1?10:7}" fill="${i===1?'none':car.color}" stroke="${car.color}" stroke-width="2"/><text y="-15" text-anchor="middle">${i===0?'YOU':i===1?'BASE':car.profile.driver}</text></g>`).join('');
        $('raceReplay').hidden=false;$('racePreviewTitle').textContent=plan.label;
        for(const button of $('intelPlans').querySelectorAll('[data-preview-plan]'))button.setAttribute('aria-pressed',String(Number(button.dataset.previewPlan)===index));
        renderReplay();
    }
    function reset() { pause();replay=[];$('raceReplay').hidden=true;window.__PIT_RACE_REPLAY__=null;update(); }
    listen($('flowWatch'),'click',()=>{dialog.close();$('watchBtn').click();});
    listen(graph,'click',event=>{const node=event.target.closest('[data-flow]');if(node){selected=node.dataset.flow;detail();drawEdges();}});
    listen($('intelPlans'),'click',event=>{const button=event.target.closest('[data-preview-plan]');if(button){preview(Number(button.dataset.previewPlan));$('raceReplay').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}});
    listen($('racePlay'),'click',()=>{if(playing){pause();renderReplay();return;}if(replayTime>=duration)replayTime=0;playing=true;wall=performance.now();$('racePlay').textContent='Ⅱ Pause race';$('racePlay').setAttribute('aria-pressed','true');frame=requestAnimationFrame(tick);});
    listen($('raceTimeline'),'input',()=>{pause();replayTime=Number($('raceTimeline').value)/1000*duration;renderReplay();});
    listen(dialog,'close',()=>{pause();renderReplay();});
    listen(document,'visibilitychange',()=>{if(document.hidden){pause();renderReplay();}});
    const resize=new ResizeObserver(drawEdges);resize.observe(graph);
    listen(window,'pagehide',event=>{pause();if(!event.persisted)resize.disconnect();});
    return {update,preview,reset,setRunning(value){running=value;update();}};
}
