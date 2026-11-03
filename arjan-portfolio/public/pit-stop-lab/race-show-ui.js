import {prepareTelemetry,telemetryAt} from './pit-wall.js';
import {cinematicTrack,cinematicFrame,advanceReel,pitFilmShot,pitFilmStart,pitFilmDuration,pitFilmRate} from './cinema.js';
import {snapshot} from './simulation.js';
import {operations} from './operations.js';

export function createRaceShow({listen,getSimulation,getWorld,ensureWorld,chooseExperiment,openWall,openFallback,audio}){
    const $=id=>document.getElementById(id),text=(id,value)=>{const node=$(id),next=String(value);if(node.textContent!==next)node.textContent=next;};
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,stage=$('stage'),home=stage.parentElement;
    let state={chapter:new URLSearchParams(location.search).get('scene')==='pit'?'pit':'lap',time:0,playing:!reduced,speed:2,loop:true,blocked:false},tracks=[],race=null,starting=false,disposed=false,active=false,sceneChapter='',lastWall=0,lastShot='',lastSignature='',needsPaint=true,loading=true,failed=false,controller=null;
    let miniature=()=>({x:0,y:0}),miniLength=1,onScreen=true;
    const visibility=new IntersectionObserver(entries=>{onScreen=entries[0].isIntersecting;lastWall=performance.now();if(!onScreen)audio.engineFrame?.(null);});visibility.observe($('raceShow'));
    if(state.chapter==='pit')state.time=pitFilmStart(getSimulation());
    const duration=()=>state.chapter==='lap'?(tracks[0]?.driver.duration??96.941):pitFilmDuration(getSimulation());
    const clock=t=>`${Math.floor(t/60)}:${(t%60).toFixed(3).padStart(6,'0')}`;
    function debug(extra={}){window.__PIT_SHOW__={...state,active,ready:active&&sceneChapter===state.chapter&&!loading&&(state.chapter==='lap'?!!race?.ready:!!getWorld()?.stats().heroLoaded),loading,failed,stats:state.chapter==='lap'?(race?.stats??null):(getWorld()?.stats()??null),...extra};}
    function setPlaying(value){state.playing=value;text('showPlay',value?'Ⅱ Pause':'▶ Play');$('showPlay').setAttribute('aria-pressed',String(value));lastWall=performance.now();needsPaint=true;debug();}
    function restoreStage(){if(stage.parentElement!==home)home.insertBefore(stage,$('dock'));}
    function cameras(){
        const choices=state.chapter==='lap'?[['director','Director'],['chase','Chase'],['drone','Aerial'],['oncar','On car'],['overview','Circuit'],['orbit','Orbit / paused']]:[['director','Director'],['wide','Pit box'],['wheel','Wheel station']];
        $('showCamera').replaceChildren(...choices.map(([value,name])=>{const o=document.createElement('option');o.value=value;o.textContent=name;return o;}));
    }
    function fail(message){failed=true;loading=false;$('showFailure').hidden=false;text('showFailureText',`${message} Timing and strategy tools remain available.`);$('showLoading').hidden=true;setPlaying(false);debug();}
    async function startRace(){
        if(race||starting||disposed)return;starting=true;loading=true;$('showLoading').hidden=false;
        try{
            controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),20000);
            let bundle;try{const response=await fetch(new URL('./data/telemetry-bahrain-2024.json',import.meta.url),{signal:controller.signal});if(!response.ok)throw new Error(`Archive unavailable (${response.status}).`);bundle=await response.json();}finally{clearTimeout(timeout);}
            const drivers=prepareTelemetry(bundle);tracks=drivers.map(cinematicTrack);
            const locations=drivers[0].locations,xs=locations.map(r=>r.x),ys=locations.map(r=>r.y),cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2,scale=Math.min(190/(Math.max(...xs)-Math.min(...xs)),105/(Math.max(...ys)-Math.min(...ys)));
            miniature=p=>({x:115+(p.x-cx)*scale,y:70-(p.y-cy)*scale});
            const path=locations.map((p,i)=>{const q=miniature(p);return `${i?'L':'M'}${q.x},${q.y}`;}).join(' ')+' Z';$('showMiniRoad').setAttribute('d',path);$('showMiniProgress').setAttribute('d',path);miniLength=$('showMiniProgress').getTotalLength();
            const {createRaceScene}=await import('./race-scene.js');if(disposed)return;
            race=createRaceScene($('showCanvas'),tracks,{onReady(){if(state.chapter==='lap'){loading=false;$('showLoading').hidden=true;lastWall=performance.now();}needsPaint=true;},onError:fail,onOrbit:()=>setPlaying(false)});race.setGhost($('showGhost').checked);race.setCamera($('showCamera').value);
        }catch(error){if(!disposed)fail(error.message);}finally{starting=false;}
    }
    async function enterChapter(){
        sceneChapter=state.chapter;lastShot='';audio.engineFrame?.(null);loading=true;failed=false;$('showFailure').hidden=true;$('showLoading').hidden=false;needsPaint=true;cameras();
        $('raceShow').dataset.chapter=state.chapter;
        document.querySelectorAll('[data-show-chapter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.showChapter===state.chapter)));
        $('showRate').disabled=state.chapter==='pit';$('showRate').value=state.chapter==='pit'?'.35':String(state.speed);$('showGhost').disabled=state.chapter==='pit';$('showPitExperiments').hidden=state.chapter!=='pit';$('showPedals').hidden=state.chapter!=='lap';$('showCornerStates').hidden=state.chapter!=='pit';
        text('showSource',state.chapter==='lap'?'RECORDED LAP / 2024':'MODELED PIT OPERATION');text('showName',state.chapter==='lap'?'Charles Leclerc':'Pit box 01');text('showNumber',state.chapter==='lap'?'16':'P/');text('showVenue',state.chapter==='lap'?'SAKHIR / LAP 32':'PIT LANE / EXTERIOR SERVICE BOX');text('showMapTitle',state.chapter==='lap'?'LAP-ALIGNED COMPARISON':'MODEL / EXACT EVENT CLOCK');
        text('showDisclosure',state.chapter==='lap'?'Archived inputs · condensed track · enlarged illustrative car / architecture · SAI ghost offset for visibility':'Seeded pit-lane operation · 1× entry/exit, 0.35× service · not a recorded race stop');
        if(state.chapter==='lap'){
            restoreStage();$('showCanvas').hidden=false;await startRace();race?.setCamera($('showCamera').value);if(race?.ready){loading=false;$('showLoading').hidden=true;}
        }else{
            $('showCanvas').hidden=true;$('showVisual').append(stage);await ensureWorld();if(disposed||state.chapter!=='pit')return;const world=getWorld();if(!world){fail('3D could not start.');return;}world.setExperience('show');world.setView('world');world.setOptions({lighting:'golden',labels:false,spatial:false,ghost:false,roof:false,trails:false,fov:40});
        }
        lastWall=performance.now();debug();
    }
    function chooseChapter(value){state.chapter=value;state.time=value==='pit'?pitFilmStart(getSimulation()):0;setPlaying(!reduced);sceneChapter='';debug();}
    function paint(){
        const pit=state.chapter==='pit',sim=getSimulation();if(pit)$('showRate').value=String(pitFilmRate(sim,state.time));
        text('showClock',clock(state.time));text('showTimelineLabel',pit?'PIT OPERATION':'LAP 32');text('showTimelineOut',`${clock(state.time).slice(0,-4)} / ${clock(duration()).slice(0,-4)}`);$('showSeek').value=Math.round(state.time/duration()*1000);
        if(!pit&&tracks.length){
            const sample=telemetryAt(tracks[0].driver,state.time);text('showVelocity',sample?Math.round(sample.speed):'—');text('showMetricLabel','SPEED / km/h');text('showGearLabel','GEAR');text('showGear',sample?.gear??'—');
            $('showThrottle').style.width=`${sample?.throttle??0}%`;$('showBrake').style.width=`${sample?.brake??0}%`;text('showThrottleValue',sample?`${Math.round(sample.throttle)}%`:'—');text('showBrakeValue',sample?`${sample.brake}%`:'—');
            text('showAction',!sample?'Telemetry gap':sample.brake?'BRAKING / RECORDED PEDAL INPUT':sample.drs?'DRS ACTIVE / RECORDED STATUS':sample.throttle>90?'FULL THROTTLE':'PART THROTTLE');$('raceShow').dataset.braking=String(!!sample?.brake);
            tracks.forEach((track,i)=>{const f=cinematicFrame(track,Math.min(state.time,track.driver.duration)),p=miniature({x:f.x/track.scale+track.center[0],y:track.center[1]-f.z/track.scale});$('showMiniCar'+i).setAttribute('cx',p.x);$('showMiniCar'+i).setAttribute('cy',p.y);});
            $('showMiniProgress').setAttribute('stroke-dasharray',`${(sample?.progress??0)*miniLength} ${miniLength}`);
        }else if(pit){
            const snap=snapshot(sim,state.time),ops=operations(sim,snap);text('showMetricLabel','STATIONARY / seconds');text('showVelocity',ops.status==='SAFETY HOLD'?'HOLD':Math.max(0,Math.min(state.time-sim.stops[0].stopAt,sim.result.stationary??Infinity)).toFixed(2));$('raceShow').dataset.safety=ops.status==='SAFETY HOLD'?'hold':'clear';text('showGearLabel','SECURED');text('showGear',`${ops.secured}/4`);text('showAction',ops.status.replaceAll('_',' '));
            text('showPitBlocking',ops.status==='SAFETY HOLD'?`${ops.corners.filter(c=>!c.secured).map(c=>c.key).join(' / ')} retention unconfirmed. Jacks remain up; no release.`:ops.blocking?`${ops.blocking.track} · ${ops.blocking.state.replaceAll('_',' ')} · ${ops.blocking.remaining.toFixed(2)} s remaining`:ops.release.approved?'Release confirmed · all safety dependencies satisfied':'Release depends on retention, jack state and the traffic gap.');
            $('showCornerStates').innerHTML=ops.corners.map(c=>`<span data-secured="${c.secured}"><i></i>${c.key}<b>${c.secured?'RETAINED':c.state.replaceAll('_',' ')}</b></span>`).join('');debug({operations:ops});
        }
    }
    listen($('showPlay'),'click',()=>{if(state.time>=duration()){state.time=state.chapter==='pit'?pitFilmStart(getSimulation()):0;race?.setCamera($('showCamera').value);}setPlaying(!state.playing);});
    listen($('showRestart'),'click',()=>{state.time=state.chapter==='pit'?pitFilmStart(getSimulation()):0;race?.setCamera($('showCamera').value);setPlaying(!reduced);needsPaint=true;});
    listen($('showSeek'),'input',()=>{state.time=Number($('showSeek').value)/1000*duration();race?.setCamera($('showCamera').value);setPlaying(false);});
    listen($('showRate'),'change',()=>state.speed=Number($('showRate').value));listen($('showLoop'),'change',()=>state.loop=$('showLoop').checked);
    listen($('showCamera'),'change',()=>{const value=$('showCamera').value;if(state.chapter==='lap')race?.setCamera(value);if(value==='orbit')setPlaying(false);needsPaint=true;});
    listen($('showGhost'),'change',()=>race?.setGhost($('showGhost').checked));
    for(const b of document.querySelectorAll('[data-show-chapter]'))listen(b,'click',()=>chooseChapter(b.dataset.showChapter));
    for(const b of document.querySelectorAll('[data-show-scenario]'))listen(b,'click',()=>{chooseExperiment(b.dataset.showScenario);document.querySelectorAll('[data-show-scenario]').forEach(button=>button.setAttribute('aria-pressed',String(button===b)));state.time=pitFilmStart(getSimulation());state.blocked=getSimulation().result.stationary===null;setPlaying(!reduced);needsPaint=true;});
    const inspect=()=>openWall(state.chapter==='lap'?state.time:0);listen($('showOpenWall'),'click',inspect);listen($('showFallbackWall'),'click',openFallback);
    listen($('showFull'),'click',()=>{if(document.fullscreenElement)document.exitFullscreen?.();else $('app').requestFullscreen?.();});
    listen($('showSound'),'change',()=>{audio.setEnabled($('showSound').checked);$('sound').checked=$('showSound').checked;$('challengeSound').checked=$('showSound').checked;});
    return {tick(now){
        if(!onScreen){lastWall=now;audio.engineFrame?.(null);return;}
        if(!active){active=true;lastWall=now;needsPaint=true;}
        const signature=JSON.stringify(getSimulation().config);if(signature!==lastSignature){if(lastSignature&&state.chapter==='pit')state.time=pitFilmStart(getSimulation());lastSignature=signature;needsPaint=true;document.querySelectorAll('[data-show-scenario]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.showScenario===getSimulation().config.scenario)));}
        if(sceneChapter!==state.chapter)enterChapter();
        if(state.chapter==='pit'&&getWorld()?.stats().heroError&&!failed)fail(getWorld().stats().heroError);
        if(state.chapter==='pit'&&getWorld()?.stats().heroLoaded){loading=false;$('showLoading').hidden=true;}
        const before={...state},dt=Math.max(0,(now-lastWall)/1000);lastWall=now;state.blocked=state.chapter==='pit'&&getSimulation().result.stationary===null;
        if(!loading&&!failed)state=advanceReel(state,dt,tracks[0]?.driver.duration??96.941,pitFilmDuration(getSimulation()),pitFilmRate(getSimulation(),state.time));
        if(before.playing!==state.playing)setPlaying(state.playing);
        if(state.chapter!==before.chapter){if(state.chapter==='pit')state.time=pitFilmStart(getSimulation());enterChapter();return;}
        if(state.chapter==='lap'&&state.playing&&state.time>duration()-8&&!getWorld())void ensureWorld();
        if(state.chapter==='lap'&&race){race.render(state.time,now);if(state.playing&&audio.enabled)audio.engineFrame?.(telemetryAt(tracks[0].driver,state.time));else audio.engineFrame?.(null);}
        if(state.chapter==='pit'&&getWorld()&&!loading){
            const sim=getSimulation(),snap=snapshot(sim,state.time),car=snap.cars[snap.activeCar-1],world=getWorld(),shot=pitFilmShot(sim,state.time,car),choice=$('showCamera').value;
            if(needsPaint||state.time!==before.time){world.update(snap,sim);world.setFilmCamera(choice==='wide'?{position:[4.8,3,-5.6],target:[0,.4,0],fov:43}:choice==='wheel'?{position:[3.3,2.1,-3.2],target:[.85,.46,-1.65],fov:36}:shot);}
            world.render(now);audio.engineFrame?.(null);
            if(state.playing&&audio.enabled)for(const event of sim.events)if(event.start>before.time&&event.start<=state.time)audio.triggerEvent(event,.35);
            lastShot=choice==='director'?shot.shot:choice;
        }
        if(needsPaint||state.time!==before.time){paint();needsPaint=false;}
        if(state.chapter==='lap')debug({shot:race?.stats.shot});else debug({shot:lastShot,operations:operations(getSimulation(),snapshot(getSimulation(),state.time))});
    },activate(){if(disposed)return;active=true;lastWall=performance.now();needsPaint=true;if(sceneChapter!==state.chapter)enterChapter();},suspend(){if(!active)return;active=false;sceneChapter='';restoreStage();audio.engineFrame?.(null);debug();},dispose(){disposed=true;visibility.disconnect();controller?.abort();restoreStage();race?.dispose();}};
}
