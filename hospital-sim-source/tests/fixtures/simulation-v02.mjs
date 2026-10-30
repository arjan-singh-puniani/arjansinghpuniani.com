// The original LCG, BFS, pathway and queue policy are retained from Hospital Works v0.1.
// No DOM, clock or renderer dependencies. One tick is one fictional game second.
export const VERSION='0.2.0-diorama';
export const TYPES={consult:{name:'Consultation',cost:900,duration:12,staff:1},scan:{name:'Imaging',cost:1500,duration:17,staff:1},care:{name:'Procedure & care',cost:1100,duration:15,staff:2},rest:{name:'Team lounge',cost:600,duration:0,staff:0}};
export const GRID={w:9,h:8,entry:{x:4,y:5},step:1.65};
const names=['Alex','Sam','Noor','Jordan','Maya','Eli','Robin','Avery','Kai','Imani','Rae','Morgan'];
export function initial(scenario='neighborhood',seed=431){
 const s={version:VERSION,scenario,initialSeed:seed,seed,seconds:0,cash:8000,served:0,left:0,arrivals:0,trust:85,energy:100,breaks:false,access:false,urgency:true,rooms:[{id:1,x:5,y:2,type:'consult',level:1,staff:[1]},{id:2,x:1,y:0,type:'scan',level:1,staff:[2]},{id:3,x:1,y:3,type:'care',level:1,staff:[3,4]}],staff:['Mira','Jules','Remy','Ash','Sage','Kit'].map((name,i)=>({id:i+1,name,role:'clinician',fatigue:0,breakUntil:0})),patients:[],nextId:10,nextArrival:1,surge:0,eventDone:false,ended:false,records:[],actions:[],log:['Doors open. A little space. A lot of care.'],utilization:{},lastAction:null};
 return s;
}
export function random(s){s.seed=(s.seed*1664525+1013904223)>>>0;return s.seed/4294967296}
export const door=r=>({x:r.x,y:r.y+2});
export const blocked=(x,y,rooms)=>rooms.some(r=>x>=r.x&&x<r.x+2&&y>=r.y&&y<r.y+2);
export function path(a,b,rooms){
 const start={x:Math.round(a.x),y:Math.round(a.y)},q=[start],seen=new Set([`${start.x},${start.y}`]),prev=new Map();
 for(let i=0;i<q.length;i++){
  const c=q[i],key=`${c.x},${c.y}`;
  if(c.x===b.x&&c.y===b.y){const p=[];let k=key;while(k!==`${start.x},${start.y}`){const [x,y]=k.split(',').map(Number);p.unshift({x,y});k=prev.get(k)}return p}
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=c.x+dx,y=c.y+dy,k=`${x},${y}`;if(x<0||x>=GRID.w||y<0||y>=GRID.h||blocked(x,y,rooms)||seen.has(k))continue;seen.add(k);prev.set(k,key);q.push({x,y})}
 }return null;
}
export function placement(s,type,x,y){
 if(!TYPES[type]||!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x+1>=GRID.w||y+2>=GRID.h)return {ok:false,reason:'Outside the buildable floor.'};
 for(let a=x;a<x+2;a++)for(let b=y;b<y+2;b++)if(blocked(a,b,s.rooms))return {ok:false,reason:'This space overlaps another module.'};
 const inside=p=>p.x>=x&&p.x<x+2&&p.y>=y&&p.y<y+2;
 if(inside(GRID.entry)||s.patients.some(p=>inside(p)||(p.route||[]).some(inside)))return {ok:false,reason:'A person or their reserved walking route needs this space.'};
 const proposed=[...s.rooms,{x,y,type}];
 if(proposed.some(r=>blocked(door(r).x,door(r).y,proposed)||path(GRID.entry,door(r),proposed)===null))return {ok:false,reason:'Keep every doorway connected to the entrance.'};
 if(s.patients.some(p=>p.state!=='service'&&path(p,GRID.entry,proposed)===null))return {ok:false,reason:'This would strand a person away from the exit.'};
 const assigned=new Set(s.rooms.flatMap(r=>r.staff));const free=s.staff.filter(p=>!assigned.has(p.id));
 if(free.length<TYPES[type].staff)return {ok:false,reason:`Needs ${TYPES[type].staff} unassigned clinicians. Recruit in Team first.`};
 if(s.cash<TYPES[type].cost)return {ok:false,reason:'Not enough operating funds.'};
 return {ok:true,reason:'Clear route · staffed · ready to place',staff:free.slice(0,TYPES[type].staff).map(p=>p.id)};
}
export function note(s,message){s.log.unshift(message);s.log=s.log.slice(0,5)}
export function recordAction(s,type,details={}){s.actions.push({at:s.seconds,type,...details})}
export function build(s,type,x,y){
 if(s.ended)return {ok:false,reason:'This shift has ended.'};const check=placement(s,type,x,y);if(!check.ok)return check;
 const snapshot=JSON.stringify({...s,lastAction:null});
 const r={id:s.nextId++,type,x,y,level:1,staff:check.staff};s.rooms.push(r);s.cash-=TYPES[type].cost;
 recordAction(s,'build',{room:{...r}});s.lastAction={at:s.seconds,snapshot};note(s,`${TYPES[type].name} opens. ${check.staff.length} clinicians assigned.`);return {ok:true,room:r};
}
export function undo(s){if(!s.lastAction||s.lastAction.at!==s.seconds)return null;return JSON.parse(s.lastAction.snapshot)}
export function upgrade(s,id){const r=s.rooms.find(r=>r.id===id);if(!r||r.level>=3||s.cash<650||s.ended)return false;const snapshot=JSON.stringify({...s,lastAction:null});s.cash-=650;r.level++;recordAction(s,'upgrade',{id,level:r.level});s.lastAction={at:s.seconds,snapshot};return true}
export function remove(s,id){const r=s.rooms.find(r=>r.id===id);if(!r||s.ended)return {ok:false,reason:'Select a module.'};if(s.patients.some(p=>p.room===id||p.target===id))return {ok:false,reason:'This module has a reserved or occupied visit. Let it finish first.'};const snapshot=JSON.stringify({...s,lastAction:null});s.rooms=s.rooms.filter(r=>r.id!==id);s.cash+=TYPES[r.type].cost*.5;recordAction(s,'remove',{id});s.lastAction={at:s.seconds,snapshot};return {ok:true}}
export function policy(s,key){if(!['breaks','access','urgency','hire','surge'].includes(key)||s.ended)return false;if(key==='hire'){if(s.cash<800||s.staff.length>=12)return false;s.cash-=800;s.staff.push({id:s.staff.length+1,name:'Rowan '+(s.staff.length-5),role:'clinician',fatigue:0,breakUntil:0})}else if(key==='access'){if(s.access||s.cash<500)return false;s.access=true;s.cash-=500}else if(key==='surge'){s.surge=40}else s[key]=!s[key];s.lastAction=null;recordAction(s,'policy',{key,value:s[key]??s.staff.length});return true}
export const queueFor=(s,type)=>s.patients.filter(p=>p.stage===type&&!['service','exiting'].includes(p.state)).length;
export function spawn(s){
 const barrier=random(s)<(s.scenario==='access'?.65:.3),id=s.nextId++;
 s.arrivals++;s.patients.push({id,name:names[id%names.length],...GRID.entry,stage:'consult',state:'arrival',route:[],target:null,room:null,urgent:random(s)<.25,barrier,imaging:random(s)<.55,wait:0,walking:0,service:0,arrival:s.seconds,progress:0,navDelay:barrier?9:0,history:[]});
}
export function tick(s){
 if(s.ended)return;s.seconds++;s.lastAction=null;
 if(s.seconds>=s.nextArrival&&s.seconds<445){spawn(s);s.nextArrival=s.seconds+(s.surge>0?3:s.scenario==='surge'?6:9)}
 if(s.surge>0)s.surge--;if(!s.eventDone&&s.seconds>=130){s.eventDone=true;s.surge=35;note(s,'The community bus arrived. More neighbors for 35 seconds.')}
 const busy=new Set(s.patients.filter(p=>p.state==='service').flatMap(p=>s.rooms.find(r=>r.id===p.room)?.staff||[]));
 const lounges=s.rooms.filter(r=>r.type==='rest').length;
 for(const st of s.staff){st.fatigue=Math.max(0,Math.min(100,st.fatigue+(busy.has(st.id)?.15:-.08*(1+lounges))));if(s.breaks&&st.fatigue>34&&st.breakUntil<s.seconds&&!busy.has(st.id)){st.breakUntil=s.seconds+16;st.fatigue=Math.max(0,st.fatigue-18);note(s,`${st.name} takes a protected break. Their assigned module pauses for 16 seconds.`)}}
 s.energy=100-s.staff.reduce((a,b)=>a+b.fatigue,0)/s.staff.length;
 if(s.seconds%15===0)s.cash-=25+s.rooms.length*7+s.staff.length*4+(s.access?8:0);
 for(const r of s.rooms){const stat=s.utilization[r.id]??={busy:0,elapsed:0};stat.elapsed++;if(s.patients.some(p=>p.room===r.id&&p.state==='service'))stat.busy++}
 // Release capacity on the next tick so loop order cannot let a later visitor jump the queue.
 const reservedAtStart=new Set(s.patients.map(p=>p.target).filter(id=>id!==null));
 const ordered=[...s.patients].sort((a,b)=>(s.urgency?Number(b.urgent)-Number(a.urgent):0)||a.arrival-b.arrival||a.id-b.id);
 for(const p of ordered){
  if(p.state==='arrival')p.state='waiting';
  if(p.state==='waiting'){
   p.wait++;if(p.navDelay>0&&!s.access){p.navDelay--;continue}
   const available=s.rooms.filter(r=>r.type===p.stage&&!reservedAtStart.has(r.id)&&r.staff.length>=TYPES[r.type].staff&&r.staff.every(id=>s.staff.find(st=>st.id===id).breakUntil<=s.seconds)&&!s.patients.some(q=>q.id!==p.id&&q.target===r.id));
   let best;for(const r of available){const route=path(p,door(r),s.rooms);if(route&&(!best||route.length<best.route.length))best={r,route}}
   if(best){p.target=best.r.id;p.room=best.r.id;p.route=best.route;p.state='walking'}else if(s.patients.filter(q=>q.state==='waiting'&&q.x===p.x&&q.y===p.y).length>4){
    const occupied=t=>s.patients.some(q=>q!==p&&((q.x===t.x&&q.y===t.y)||q.route?.some(a=>a.x===t.x&&a.y===t.y)));
    const candidates=[];for(let y=0;y<GRID.h;y++)for(let x=0;x<GRID.w;x++){const d=Math.abs(x-p.x)+Math.abs(y-p.y);if(d>=1&&d<=3&&!blocked(x,y,s.rooms)&&!occupied({x,y}))candidates.push({x,y,d})}
    for(const bay of candidates.sort((a,b)=>a.d-b.d||a.y-b.y||a.x-b.x)){const route=path(p,bay,s.rooms);if(route){p.route=route;p.state='queue-walking';break}}
   }
  }else if(p.state==='walking'||p.state==='queue-walking'||p.state==='exiting'){
   p.walking++;if(p.route.length){const next=p.route.shift();p.x=next.x;p.y=next.y}else if(p.state==='queue-walking'){p.state='waiting'}else if(p.state==='exiting'){p.state='done';if(p.outcome==='completed')s.served++;else s.left++;s.records.push({...p,route:undefined,state:undefined,total:s.seconds-p.arrival});if(s.served&&s.served%4===0)note(s,`${p.name} heads home. ${s.served} neighbors helped.`)}else{
    const r=s.rooms.find(r=>r.id===p.room);p.state='service';p.progress=0;const fatigue=r.staff.reduce((a,id)=>a+s.staff.find(st=>st.id===id).fatigue,0)/r.staff.length;
    p.duration=TYPES[r.type].duration/(1+.22*(r.level-1))*(1+fatigue/140);p.history.push({stage:p.stage,at:s.seconds,room:r.id,duration:p.duration});
   }
  }else if(p.state==='service'){
   p.service++;p.progress++;
   if(p.progress>=p.duration){p.target=null;p.room=null;p.state='waiting';if(p.stage==='consult')p.stage=p.imaging?'scan':'care';else if(p.stage==='scan')p.stage='care';else{p.state='exiting';p.outcome='completed';p.route=path(p,GRID.entry,s.rooms)||[];s.cash+=390;s.trust=Math.max(0,Math.min(100,s.trust+(p.wait<75?1.2:-1.5)))}}
  }
  if(p.wait>170&&p.state==='waiting'){p.state='exiting';p.outcome='departed';p.target=null;p.room=null;p.route=path(p,GRID.entry,s.rooms)||[];s.trust=Math.max(0,s.trust-4);note(s,`${p.name} is leaving after a long wait. The constraint needs attention.`)}
 }
 s.patients=s.patients.filter(p=>p.state!=='done');if(s.seconds>=480||s.cash<-1000)s.ended=true;
}
export function validate(s){
 const finite=n=>typeof n==='number'&&Number.isFinite(n),integer=n=>Number.isInteger(n)&&n>=0,safeName=n=>typeof n==='string'&&/^[A-Za-z][A-Za-z0-9 ]{0,30}$/.test(n);
 if(!s||s.version!==VERSION||!['neighborhood','surge','access'].includes(s.scenario)||!Array.isArray(s.rooms)||s.rooms.length>18||!Array.isArray(s.staff)||s.staff.length<4||s.staff.length>12||!Array.isArray(s.patients)||s.patients.length>200||!Array.isArray(s.records)||!Array.isArray(s.actions)||!Array.isArray(s.log)||!s.utilization||!integer(s.seed)||!finite(s.cash)||!integer(s.seconds)||s.seconds>480||!integer(s.initialSeed)||!integer(s.nextId)||!integer(s.nextArrival)||!finite(s.energy)||!finite(s.trust)||!finite(s.surge))throw Error('Unsupported or damaged shift');
 for(const key of ['served','left','arrivals'])if(!integer(s[key]))throw Error('Invalid counts');
 for(const key of ['ended','breaks','access','urgency','eventDone'])if(typeof s[key]!=='boolean')throw Error('Invalid policy');
 if(s.arrivals!==s.served+s.left+s.patients.length)throw Error('Arrival accounting mismatch');
 const ids=new Set();for(const p of [...s.patients,...s.records]){if(ids.has(p.id)||!integer(p.id)||!safeName(p.name)||![p.wait,p.walking,p.service,p.arrival,p.progress,p.x,p.y].every(n=>finite(n)&&n>=0)||p.x>=GRID.w||p.y>=GRID.h||!Array.isArray(p.history)||p.history.some(h=>!TYPES[h.stage]||!integer(h.at)||!finite(h.duration)))throw Error('Invalid visit');ids.add(p.id)}
 const staffIds=new Set();for(const st of s.staff){if(staffIds.has(st.id)||!integer(st.id)||!safeName(st.name)||!finite(st.fatigue)||st.fatigue<0||st.fatigue>100||!integer(st.breakUntil))throw Error('Invalid clinician');staffIds.add(st.id)}
 const roomIds=new Set(),assigned=new Set();for(const r of s.rooms){if(roomIds.has(r.id)||!integer(r.id)||!TYPES[r.type]||!integer(r.x)||!integer(r.y)||r.x+1>=GRID.w||r.y+2>=GRID.h||![1,2,3].includes(r.level)||!Array.isArray(r.staff)||r.staff.length!==TYPES[r.type].staff||r.staff.some(id=>!staffIds.has(id)||assigned.has(id))||s.rooms.some(q=>q!==r&&r.x<q.x+2&&r.x+2>q.x&&r.y<q.y+2&&r.y+2>q.y)||path(GRID.entry,door(r),s.rooms)===null)throw Error('Invalid room');roomIds.add(r.id);r.staff.forEach(id=>assigned.add(id))}
 const reserved=new Set();for(const p of s.patients){if(!['arrival','waiting','walking','queue-walking','service','exiting'].includes(p.state)||!TYPES[p.stage]||!Array.isArray(p.route)||p.route.some(t=>!integer(t.x)||!integer(t.y)||t.x>=GRID.w||t.y>=GRID.h||blocked(t.x,t.y,s.rooms)))throw Error('Invalid navigation');if(p.target!==null){if(!roomIds.has(p.target)||reserved.has(p.target))throw Error('Duplicate assignment');reserved.add(p.target)}}
 return s;
}
export function statistics(values){const a=[...values].sort((x,y)=>x-y);return {n:a.length,mean:a.length?a.reduce((x,y)=>x+y,0)/a.length:null,median:a.length?(a[Math.floor((a.length-1)/2)]+a[Math.ceil((a.length-1)/2)])/2:null,p90:a.length?a[Math.ceil(a.length*.9)-1]:null}}
export function report(s){const completed=s.records.filter(r=>r.outcome==='completed');return {game:'Common Good',model:VERSION,scenario:s.scenario,seed:s.initialSeed,randomState:s.seed,simulationSeconds:s.seconds,definitions:{unit:'fictional game seconds',waiting:'ticks in waiting state, including modeled access delay; excludes walking and service',walking:'ticks navigating or exiting',service:'ticks receiving a service',experience:'unvalidated game indicator',selectionBias:'Completed-only waits exclude people who departed or remain unfinished; consult all-outcome statistics too.'},counts:{arrivals:s.arrivals,completed:s.served,departed:s.left,unfinished:s.patients.length},waits:{completed:statistics(completed.map(p=>p.wait)),allRecordedOutcomes:statistics(s.records.map(p=>p.wait)),allArrivalsIncludingCurrent:statistics([...s.records,...s.patients].map(p=>p.wait))},accessCohorts:[true,false].map(barrier=>({barrier,arrivals:[...s.records,...s.patients].filter(p=>p.barrier===barrier).length,completed:statistics(completed.filter(p=>p.barrier===barrier).map(p=>p.wait))})),budget:s.cash,teamEnergy:s.energy,experience:s.trust,layout:s.rooms,staff:s.staff,policy:{urgency:s.urgency,access:s.access,breaks:s.breaks},decisions:s.actions,visits:s.records,unfinished:s.patients,utilization:s.utilization,disclaimer:'Fictional simulation. Substantial AI assistance. No clinical or educational effectiveness validation. Device-local records only.'}}
