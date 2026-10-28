import {simulate,configuration} from './simulation.js';
import {newChallenge,challengeAction,challengeFrame,replayChallenge,CHALLENGE_STEPS} from './challenge.js';
export function createExperienceUI({world,sim,listen,setMode,pause,audio}){
 const $=s=>document.querySelector(s);let mode='explore',session=null,clock=0,replaying=false,saved=null,drag=null,lastPhase='',frameSim=null,started=false;
 let trainingSim=null,lastClock=performance.now(),lastPulse=-Infinity;
 const gunPulse=()=>{audio.triggerEvent({state:session.phase==='loosen'?'LOOSENING':'TIGHTENING',track:'FL',duration:.10},1);lastPulse=clock;};
 const advanceClock=()=>{const now=performance.now();if(started&&!document.hidden)clock+=Math.max(0,(now-lastClock)/1000);lastClock=now;};
 let best=null;try{const v=Number(localStorage.getItem('pit-lab-best'));if(Number.isFinite(v)&&v>0)best=v;}catch{/* Storage can be unavailable in embedded/private browsing. */}
 const options=()=>({arrival:trainingSim.stops[0].stopAt,teamReady:Math.max(...['FR','RL','RR'].map(c=>trainingSim.stops[0].corners[c].events.at(-1).end))});
 function reset(){trainingSim=simulate(configuration({seed:sim().config.seed}));session=newChallenge(options());clock=0;lastClock=performance.now();replaying=false;started=false;lastPhase='';frameSim=null;$('#challengeReplay').disabled=!saved;render();}
 function choose(next,invoke=true){
  if(next===mode&&session)return;mode=next;document.body.dataset.experience=next;pause();world()?.setExperience(next);world()?.inspectBody(next==='explore'&&$('#bodyworkToggle').checked,next==='explore'&&$('#isolateToggle').checked);$('#challengeSound').checked=audio.enabled;
  for(const b of document.querySelectorAll('button[data-experience]'))b.setAttribute('aria-pressed',String(b.dataset.experience===next));
  if(next==='challenge'){reset();world()?.setView('world');world()?.setCamera('challenge');}
  if(next==='explore'){world()?.setView('world');world()?.setCamera('carHero');$('#inspector').hidden=true;$('#controls').hidden=true;$('#analysis').hidden=true;}
  if(next==='engineer'){if(invoke)setMode('world');$('#inspector').hidden=true;}
 }
 const act=(type,value)=>{if(!session||replaying)return;advanceClock();session=challengeAction(session,type,clock,value);if(type==='hold'&&['loosen','tighten'].includes(session.phase))gunPulse();render();};
 function render(){
  if(!session)return;const [,,description]=CHALLENGE_STEPS.find(p=>p[0]===session.phase);const title=CHALLENGE_STEPS.find(p=>p[0]===session.phase)[1];
  if($('#challengeTitle').textContent!==title)$('#challengeTitle').textContent=title;const hint=session.message||description;if($('#challengeHint').textContent!==hint)$('#challengeHint').textContent=hint;
  $('#challengeTime').textContent=`${(session.completedAt??session.elapsed).toFixed(2)} s`;
  $('#challengeStationary').textContent=session.completedAt===null?'':`Stationary ${(session.completedAt-session.arrival).toFixed(2)} s · FL controlled release`;
  $('#challengeProgress').value=session.progress;$('#challengeErrors').textContent=`${session.errors} procedure error${session.errors===1?'':'s'}${best?` · best ${best.toFixed(2)} s`:''}`;
  const labels={prepare:'Stage bay & begin',align:'Align to nut · assisted',release:'Confirm safe release',complete:'Run again'};
  $('#challengeAction').textContent=labels[session.phase]||`Hold · ${title.toLowerCase()}`;
  $('#challengeAction').disabled=replaying;$('#challengeReplay').disabled=!saved||replaying;
  $('#contactTarget').hidden=!['align','loosen','remove','fit','tighten'].includes(session.phase)||replaying;
  $('#contactTarget').textContent=({align:'◎ Align gun',loosen:'Hold · loosen',remove:'Drag outward ↗',fit:'↙ Seat wheel',tighten:'Hold · fasten'})[session.phase]||'';
  $('#contactTarget').dataset.phase=session.phase;
  $('#challengeStep').textContent=`${Math.min(11,CHALLENGE_STEPS.findIndex(p=>p[0]===session.phase)+1)} / 11${replaying?' · REPLAY':''}`;
  if(lastPhase!==session.phase){
   if(session.phase==='align')world()?.setCamera('serviceWheel');
   if(['clear','lower','release','complete'].includes(session.phase))world()?.setCamera('challenge');
   if(lastPhase==='loosen')audio.triggerEvent({state:'NUT_RELEASED',track:'FL',duration:.1},1);if(lastPhase==='fit')audio.triggerEvent({state:'WHEEL_INSTALLED',track:'FL',duration:.1},1);if(lastPhase==='lower')audio.triggerEvent({state:'LOWER & CLEAR',track:'Front jack',duration:.2},1);
   if(session.phase==='complete'&&!replaying){saved={actions:session.actions.map(a=>({...a})),options:options(),duration:session.completedAt};if(!session.errors&&(best===null||session.completedAt<best)){best=session.completedAt;try{localStorage.setItem('pit-lab-best',String(best));}catch{}}$('#challengeReplay').disabled=false;}
   lastPhase=session.phase;
  }
 }
 for(const b of document.querySelectorAll('button[data-experience]'))listen(b,'click',()=>choose(b.dataset.experience));
 for(const b of document.querySelectorAll('[data-car-camera]'))listen(b,'click',()=>world()?.setCamera(b.dataset.carCamera));
 listen($('#bodyworkToggle'),'change',()=>world()?.inspectBody($('#bodyworkToggle').checked,$('#isolateToggle').checked));
 listen($('#isolateToggle'),'change',()=>world()?.inspectBody($('#bodyworkToggle').checked,$('#isolateToggle').checked));
 listen($('#challengeReset'),'click',reset);
 listen($('#challengeReplay'),'click',()=>{if(saved){replaying=true;clock=0;lastClock=performance.now();lastPhase='';session=newChallenge(saved.options);started=true;render();}});
 const begin=()=>{audio.ensure();if(replaying)return;if(session.phase==='complete'){reset();return;}if(session.phase==='prepare'){lastClock=performance.now();started=true;act('prepare');return;}if(session.phase==='align'){act('align');return;}if(session.phase==='release'){act('release');return;}act('hold');};
 listen($('#challengeAction'),'pointerdown',e=>{if(e.button!==0)return;$('#challengeAction').setPointerCapture(e.pointerId);begin();});
 listen($('#challengeAction'),'pointerup',()=>act('end'));listen($('#challengeAction'),'pointercancel',()=>act('end'));listen(window,'blur',()=>{if(mode==='challenge')act('end');});
 listen($('#challengeAction'),'keydown',e=>{if([' ','Enter'].includes(e.key)&&!e.repeat){e.preventDefault();begin();}});
 listen($('#challengeAction'),'keyup',e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();act('end');}});
 // Screen-space contact/axial drags have the same reducer path as the accessible hold control.
 listen($('#contactTarget'),'pointerdown',e=>{e.preventDefault();e.stopPropagation();if(replaying)return;const el=e.currentTarget;el.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY,progress:session.progress,phase:session.phase};world()?.interactionLock(true);if(['loosen','tighten'].includes(session.phase))act('hold');});
 listen($('#contactTarget'),'pointermove',e=>{if(!drag)return;const d=Math.hypot(e.clientX-drag.x,e.clientY-drag.y);const p=world()?.projectContact();const rect=$('#stage').getBoundingClientRect();if(drag.phase==='align'&&session.phase==='align'){const x=e.clientX-rect.left,y=e.clientY-rect.top;const distance=p?Math.hypot(x-p.x,y-p.y):100;if(p&&distance<32)act('align');else{act('aim',Math.max(0,1-distance/90));e.currentTarget.style.left=`${x}px`;e.currentTarget.style.top=`${y}px`;}}else if(['remove','fit'].includes(drag.phase)&&session.phase===drag.phase){const signed=(e.clientX-drag.x)*(drag.phase==='remove'?1:-1);act('drag',Math.max(drag.progress,drag.progress+signed/115));}else if(d>75&&['loosen','tighten'].includes(drag.phase)){act('end');session.message='Contact lost. Return to the nut and hold.';render();}});
 const endDrag=()=>{if(drag){act('end');drag=null;world()?.interactionLock(false);}};listen($('#contactTarget'),'pointerup',endDrag);listen($('#contactTarget'),'pointercancel',endDrag);
 listen(document,'visibilitychange',()=>{lastClock=performance.now();if(document.hidden&&mode==='challenge')act('end');});
 listen($('#challengeSound'),'change',()=>{audio.ensure();audio.setEnabled($('#challengeSound').checked);$('#sound').checked=$('#challengeSound').checked;});
 choose('explore');
 return {get mode(){return mode;},choose,
  tick(){if(mode!=='challenge'||!session)return;if(started){advanceClock();if(replaying){session=replayChallenge(saved.actions,Math.min(clock,saved.duration),saved.options);if(clock>=saved.duration+3){replaying=false;started=false;clock=session.elapsed;}}else{act('tick');if(session.holding&&['loosen','tighten'].includes(session.phase)&&clock-lastPulse>.09)gunPulse();}}render();const p=world()?.projectContact();if(p&&!drag){$('#contactTarget').style.left=`${p.x+(session.phase==='align'?85:0)}px`;$('#contactTarget').style.top=`${p.y+(session.phase==='align'?25:0)}px`; }},
  frame(){if(mode==='explore'){const s=sim();const t=Math.max(0,s.stops[0].stopAt-.001);return {time:t,explore:true};}if(mode!=='challenge')return null;if(!frameSim||frameSim.source!==trainingSim){frameSim={...trainingSim,stops:[{...trainingSim.stops[0]}],source:trainingSim};}const f=challengeFrame(session,trainingSim);Object.assign(frameSim.stops[0],{front:f.jack,rear:f.jack,frontDown:null,rearDown:null,error:0});return {state:f.state,sim:frameSim};},
  get debug(){return {mode,session,replaying,contact:world()?.projectContact()};}
 };
}
