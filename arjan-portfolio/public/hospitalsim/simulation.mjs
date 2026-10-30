// The original LCG, BFS, pathway and queue policy are retained from Hospital Works v0.1.
// No DOM, clock or renderer dependencies. One tick is one fictional game second.
import {VERSION,STEP,GRID,TYPES,TRAITS,SCENARIOS,DECOR,GOALS} from './content.mjs?v=042';
export {VERSION,STEP,GRID,TYPES,TRAITS,SCENARIOS,DECOR} from './content.mjs?v=042';
const names=['Alex','Sam','Noor','Jordan','Maya','Eli','Robin','Avery','Kai','Imani','Rae','Morgan'];
export function initial(scenario='neighborhood',seed=431,mode='sandbox',continuity={}){
 const s={version:VERSION,scenario,mode,autoHandoff:true,communication:false,prevention:!!continuity.prevention,arrivalIndex:0,arrivalTape:arrivalTape(scenario,seed,continuity.prevention),initialSeed:seed,seed,seconds:0,cash:8000,served:0,left:0,arrivals:0,trust:85,energy:100,breaks:false,access:false,urgency:true,rooms:[{id:1,x:5,y:2,type:'consult',level:1,staff:[1]},{id:2,x:1,y:0,type:'scan',level:1,staff:[2]},{id:3,x:1,y:3,type:'care',level:1,staff:[3,4]}],staff:['Mira','Jules','Remy','Ash','Sage','Kit'].map((name,i)=>({id:i+1,name,role:'clinician',skills:i===1?['scan']:i===5?['scan','consult','plan']:['consult','care',...(i===4?['plan']:[])],trait:['listener','steady','steady','brisk','brisk','listener'][i],shiftEnd:scenario==='staffing'&&i===3?300:480,fatigue:0,breakUntil:0})),patients:[],nextId:10,nextArrival:1,surge:0,eventDone:false,ended:false,records:[],actions:[],log:['Doors open. A little space. A lot of care.'],utilization:{},lastAction:null};
 s.rooms.forEach(r=>r.decor=[]); return s;
}
export function random(s){s.seed=(s.seed*1664525+1013904223)>>>0;return s.seed/4294967296}
export const door=r=>({x:r.x,y:r.y+2});
export const blocked=(x,y,rooms)=>rooms.some(r=>x>r.x-.75&&x<r.x+1.75&&y>r.y-.75&&y<r.y+1.75);
export function path(a,b,rooms,avoid=[]){
 const start={x:Math.round(a.x*4),y:Math.round(a.y*4)},goal={x:Math.round(b.x*4),y:Math.round(b.y*4)},q=[start],key=p=>`${p.x},${p.y}`,seen=new Set([key(start)]),prev=new Map(),occupied=new Set(avoid.map(v=>`${Math.round(v.x*4)},${Math.round(v.y*4)}`));
 for(let i=0;i<q.length;i++){const c=q[i],k=key(c);if(c.x===goal.x&&c.y===goal.y){const result=[];let t=k;while(t!==key(start)){const [x,y]=t.split(',').map(Number);result.unshift({x:x/4,y:y/4});t=prev.get(t)}return result}
 for(const [dx,dy] of [[1,0],[0,1],[-1,0],[0,-1]]){const p={x:c.x+dx,y:c.y+dy},k=key(p);if(p.x<0||p.x>(GRID.w-1)*4||p.y<0||p.y>(GRID.h-1)*4||blocked(p.x/4,p.y/4,rooms)||seen.has(k)||occupied.has(k))continue;seen.add(k);prev.set(k,key(c));q.push(p)}}return null;
}
export function placement(s,type,x,y){
 if(!Object.hasOwn(TYPES,type)||!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x+1>=GRID.w||y+2>=GRID.h)return {ok:false,reason:'Outside the buildable floor.'};
 for(let a=x;a<x+2;a++)for(let b=y;b<y+2;b++)if(blocked(a,b,s.rooms))return {ok:false,reason:'This space overlaps another module.'};
 const inside=p=>p.x>x-.75&&p.x<x+1.75&&p.y>y-.75&&p.y<y+1.75;
 if(inside(GRID.entry)||inside(GRID.exit)||s.patients.some(p=>inside(p)||(p.route||[]).some(inside))||s.staff.some(st=>st.breakTrip&&(inside(st.breakTrip.position)||st.breakTrip.route.some(inside))))return {ok:false,reason:'A person or their reserved walking route needs this space.'};
 const proposed=[...s.rooms,{x,y,type}];
 if(path(GRID.entry,GRID.exit,proposed)===null||proposed.some(r=>blocked(door(r).x,door(r).y,proposed)||path(GRID.entry,door(r),proposed)===null))return {ok:false,reason:'Keep every doorway connected to the entrance.'};
 if(s.patients.some(p=>p.state!=='service'&&path(p,GRID.entry,proposed)===null))return {ok:false,reason:'This would strand a person away from the exit.'};
 const assigned=new Set(s.rooms.flatMap(r=>r.staff));const free=s.staff.filter(p=>!assigned.has(p.id)&&compatible(p,type)&&p.shiftEnd>s.seconds);
 if(free.length<TYPES[type].staff)return {ok:false,reason:`Needs ${TYPES[type].staff} unassigned clinicians. Recruit in Team first.`};
 if(s.cash<TYPES[type].cost)return {ok:false,reason:'Not enough operating funds.'};
 return {ok:true,reason:'Clear route · staffed · ready to place',staff:free.slice(0,TYPES[type].staff).map(p=>p.id)};
}
export function note(s,message){s.log.unshift(message);s.log=s.log.slice(0,5)}
export function recordAction(s,type,details={}){s.actions.push({at:s.seconds,type,...details})}
export function build(s,type,x,y){
 if(s.ended)return {ok:false,reason:'This shift has ended.'};const check=placement(s,type,x,y);if(!check.ok)return check;
 const snapshot=JSON.stringify({...s,lastAction:null});
 const r={id:s.nextId++,type,x,y,level:1,staff:check.staff,decor:[]};s.rooms.push(r);s.cash-=TYPES[type].cost;
 recordAction(s,'build',{room:{...r}});s.lastAction={at:s.seconds,snapshot};note(s,`${TYPES[type].name} opens. ${check.staff.length} clinicians assigned.`);return {ok:true,room:r};
}
export function undo(s){if(!s.lastAction||s.lastAction.at!==s.seconds)return null;return JSON.parse(s.lastAction.snapshot)}
export function upgrade(s,id){const r=s.rooms.find(r=>r.id===id);if(!r||r.level>=3||s.cash<650||s.ended)return false;const snapshot=JSON.stringify({...s,lastAction:null});s.cash-=650;r.level++;recordAction(s,'upgrade',{id,level:r.level});s.lastAction={at:s.seconds,snapshot};return true}
export function remove(s,id){const r=s.rooms.find(r=>r.id===id);if(!r||s.ended)return {ok:false,reason:'Select a module.'};if(s.patients.some(p=>p.room===id||p.target===id)||s.staff.some(st=>st.breakTrip&&(st.breakTrip.home===id||st.breakTrip.lounge===id)))return {ok:false,reason:'This module has a reserved or occupied visit. Let it finish first.'};const snapshot=JSON.stringify({...s,lastAction:null});s.rooms=s.rooms.filter(r=>r.id!==id);s.cash+=TYPES[r.type].cost*.5;recordAction(s,'remove',{id});s.lastAction={at:s.seconds,snapshot};return {ok:true}}
export function policy(s,key,value){
 if(s.ended)return false;
 if(key==='hire'){if(s.cash<800||s.staff.length>=12||s.scenario==='staffing')return false;s.cash-=800;s.staff.push({id:Math.max(...s.staff.map(p=>p.id))+1,name:'Rowan '+(s.staff.length-5),role:'clinician',skills:value==='scan'?['scan']:value==='plan'?['plan','consult']:['consult','care'],trait:'steady',shiftEnd:480,fatigue:0,breakUntil:0})}
 else if(['access','communication','prevention'].includes(key)){const cost={access:500,communication:350,prevention:700}[key];if(s[key]||s.cash<cost)return false;s[key]=true;s.cash-=cost}
 else if(key==='surge'){if(s.seconds>=400||s.arrivalTape.length>192)return false;const firstId=Math.max(9999,...s.arrivalTape.map(e=>e.id))+1;for(let i=0;i<8;i++){const event={...s.arrivalTape[(s.arrivalIndex+i)%s.arrivalTape.length],id:firstId+i,at:s.seconds+1+i*4};s.arrivalTape.push(event)}s.arrivalTape.sort((a,b)=>a.at-b.at||a.id-b.id);s.surge=32}
 else if(['breaks','urgency','autoHandoff'].includes(key))s[key]=!s[key];else return false;
 s.lastAction=null;recordAction(s,'policy',{key,value:s[key]??s.staff.length});return true;
}
export const queueFor=(s,type)=>s.patients.filter(p=>p.stage===type&&!['service','transfer-in','transfer-out','entering-room','leaving-room','exiting'].includes(p.state)).length;
export function spawn(s,event){
 const e=event||s.arrivalTape[s.arrivalIndex++];if(!e)return;
 s.arrivals++;s.patients.push({id:e.id,name:names[e.id%names.length],...GRID.entry,stage:'consult',state:'arrival',route:[],target:null,room:null,urgent:e.urgent,barrier:e.barrier,imaging:e.imaging,returning:e.returning,goal:e.goal,wait:0,walking:0,service:0,handoff:0,transfer:0,yielding:0,elapsedOffset:0,arrival:s.seconds,progress:0,navDelay:e.navDelay,history:[],outside:true,stalled:0});
}
export function tick(s){
 if(s.ended)return;s.seconds++;s.lastAction=null;
 while(s.arrivalIndex<s.arrivalTape.length&&s.arrivalTape[s.arrivalIndex].at<=s.seconds)spawn(s);
 if(s.surge>0)s.surge--;if(!s.eventDone&&s.seconds>=130){s.eventDone=true;s.surge=35;note(s,'The community bus arrived. More neighbors for 35 seconds.')}
 const busy=new Set(s.patients.filter(p=>['service','transfer-in','transfer-out'].includes(p.state)).flatMap(p=>s.rooms.find(r=>r.id===p.room)?.staff||[]));
 const lounges=s.rooms.filter(r=>r.type==='rest').length;
 for(const st of s.staff){
  const trip=st.breakTrip;
  if(trip){st.breakUntil=s.seconds+1;trip.previous={...trip.position};trip.motion=[{...trip.position}];trip.moved=false;
   if(trip.phase==='resting'){st.fatigue=Math.max(0,st.fatigue-.95);if(s.seconds>=trip.restEnd){trip.phase='returning';trip.destination=door(s.rooms.find(r=>r.id===trip.home));trip.route=path(trip.position,trip.destination,s.rooms)||[]}}
   else{for(let i=0;i<4&&trip.route.length;i++){const next=trip.route[0],others=[...s.patients.filter(p=>floorPerson(p)&&!p.outside),...s.staff.filter(q=>q!==st&&q.breakTrip&&q.breakTrip.phase!=='resting').map(q=>q.breakTrip.position)];if(others.some(p=>p.x===next.x&&p.y===next.y)){const detour=path(trip.position,trip.destination,s.rooms,others);if(detour)trip.route=detour;break}trip.position={...trip.route.shift()};trip.motion.push({...trip.position});trip.moved=true}if(!trip.route.length){if(trip.phase==='returning'){st.breakTrip=null;st.breakUntil=s.seconds}else{trip.phase='resting';trip.restEnd=s.seconds+16}}}continue;
  }
  st.fatigue=Math.max(0,Math.min(100,st.fatigue+(busy.has(st.id)?TRAITS[st.trait].fatigue:-.08*(1+lounges))));
  if(s.breaks&&st.fatigue>34&&st.breakUntil<s.seconds&&!busy.has(st.id)){const home=s.rooms.find(r=>r.staff.includes(st.id)),lounge=s.rooms.find(r=>r.type==='rest');if(home&&!s.patients.some(p=>p.target===home.id)){const position=door(home),destination=lounge?door(lounge):breakDestination(s,home);st.breakTrip={phase:'outbound',home:home.id,lounge:lounge?.id||null,position,previous:position,destination,route:path(position,destination,s.rooms)||[],motion:[position]};st.breakUntil=s.seconds+1;note(s,`${st.name}: ${TRAITS[st.trait].line} Protected break includes travel; assigned capacity pauses.`)}}
 }
 s.energy=100-s.staff.reduce((a,b)=>a+b.fatigue,0)/s.staff.length;
 if(s.seconds%15===0)s.cash-=25+s.rooms.length*7+s.staff.length*4+(s.access?8:0)+(s.communication?4:0);
 for(const r of s.rooms){const stat=s.utilization[r.id]??={busy:0,elapsed:0};stat.elapsed++;if(s.patients.some(p=>p.room===r.id&&p.state==='service'))stat.busy++}
 // Release capacity on the next tick so loop order cannot let a later visitor jump the queue.
 const reservedAtStart=new Set(s.patients.map(p=>p.target).filter(id=>id!==null));
 const ordered=[...s.patients].sort((a,b)=>(s.urgency?Number(b.urgent)-Number(a.urgent):0)||a.arrival-b.arrival||a.id-b.id);
 for(const p of ordered){
  if(p.arrival===s.seconds)continue;const counter=p.outside||['arrival','waiting'].includes(p.state)?'wait':['walking','queue-walking','exiting','entering-room','leaving-room'].includes(p.state)?'walking':p.state==='handoff'?'handoff':p.state.startsWith('transfer')?'transfer':'service';p[counter]++;p.moved=false;p.motion=null;if(p.outside){if(s.patients.some(q=>q!==p&&!q.outside&&floorPerson(q)&&q.x===GRID.entry.x&&q.y===GRID.entry.y))continue;p.outside=false}if(p.state==='arrival')p.state='waiting';
  if(p.state==='queue-walking'){
   const r=s.rooms.find(r=>r.type===p.stage&&!reservedAtStart.has(r.id)&&!s.patients.some(q=>q.target===r.id)&&r.staff.length===TYPES[r.type].staff&&r.staff.every(id=>{const st=s.staff.find(st=>st.id===id);return st.breakUntil<=s.seconds&&st.shiftEnd>s.seconds}));
   if(r){const route=path(p,door(r),s.rooms,traffic(s,p));if(route){p.room=r.id;p.target=r.id;p.destination=door(r);p.route=route;p.state='walking'}}
  }
  if(p.state==='waiting'){
   if(p.navDelay>0&&!s.access){p.navDelay--;continue}
   const available=s.rooms.filter(r=>r.type===p.stage&&!reservedAtStart.has(r.id)&&r.staff.length>=TYPES[r.type].staff&&r.staff.every(id=>{const st=s.staff.find(st=>st.id===id);return st.breakUntil<=s.seconds&&st.shiftEnd>s.seconds&&compatible(st,r.type)})&&!s.patients.some(q=>q.id!==p.id&&q.target===r.id));
   let best;for(const r of available){const route=path(p,door(r),s.rooms,traffic(s,p));if(route&&(!best||route.length<best.route.length))best={r,route}}
   if(best){p.target=best.r.id;p.room=best.r.id;p.route=best.route;p.state='walking';p.destination=door(best.r)}else if((p.x===GRID.entry.x&&p.y===GRID.entry.y)||s.rooms.some(r=>door(r).x===p.x&&door(r).y===p.y)){
    const occupied=t=>s.staff.some(st=>st.breakTrip&&((st.breakTrip.destination.x===t.x&&st.breakTrip.destination.y===t.y)||(st.breakTrip.position.x===t.x&&st.breakTrip.position.y===t.y)))||s.patients.some(q=>q!==p&&floorPerson(q)&&((q.x===t.x&&q.y===t.y)||(q.destination?.x===t.x&&q.destination?.y===t.y)));
    const candidates=[];for(let y=0;y<GRID.h;y++)for(let x=0;x<GRID.w;x++){const d=Math.abs(x-p.x)+Math.abs(y-p.y);if(d>=1&&!blocked(x,y,s.rooms)&&!occupied({x,y})&&!s.rooms.some(r=>door(r).x===x&&door(r).y===y)&&!(x===GRID.entry.x&&y===GRID.entry.y)&&!(x===GRID.exit.x&&y===GRID.exit.y))candidates.push({x,y,d})}
    for(const bay of candidates.sort((a,b)=>a.d-b.d||a.y-b.y||a.x-b.x)){if([GRID.exit,...s.rooms.map(door)].some(dest=>!path(GRID.entry,dest,s.rooms,[bay])))continue;const route=path(p,bay,s.rooms,traffic(s,p));if(route){p.route=route;p.destination={x:bay.x,y:bay.y};p.state='queue-walking';break}}
   }
  }else if(p.state==='walking'||p.state==='queue-walking'||p.state==='exiting'){
   if(p.route.length){p.previous={x:p.x,y:p.y};p.motion=[{...p.previous}];for(let stride=0;stride<4&&p.route.length;stride++){const next=p.route[0],others=[...s.patients.filter(q=>q!==p&&floorPerson(q)&&!q.outside),...s.staff.filter(st=>st.breakTrip&&st.breakTrip.phase!=='resting').map(st=>st.breakTrip.position)];if(others.some(q=>(q.x===next.x&&q.y===next.y)||q.moved&&q.motion?.some(v=>v.x===next.x&&v.y===next.y))){p.stalled++;if(p.stalled>=2){const route=path(p,p.destination||p.route.at(-1),s.rooms,traffic(s,p));if(route)p.route=route;}if(!p.moved){p.walking--;p.wait++;p.yielding++}break}p.route.shift();p.x=next.x;p.y=next.y;p.motion.push({x:p.x,y:p.y});p.moved=true;p.stalled=0}}else if(p.state==='queue-walking'){p.state='waiting'}else if(p.state==='exiting'){p.state='done';if(p.outcome==='completed')s.served++;else s.left++;s.records.push({...p,route:undefined,state:undefined,total:s.seconds-p.arrival});if(s.served&&s.served%4===0)note(s,`${p.name} heads home. ${s.served} neighbors helped.`)}else{
    p.state='entering-room';p.progress=0;
   }
  }else if(p.state==='entering-room'){p.progress++;if(p.progress>=3){p.progress=0;if(['scan','care'].includes(p.stage))p.state='transfer-in';else beginService(s,p)}
  }else if(p.state==='leaving-room'){p.progress++;if(p.progress>=3)finishService(s,p);
  }else if(p.state==='transfer-in'||p.state==='transfer-out'){
   p.progress++;if(p.progress>=3){if(p.state==='transfer-in')beginService(s,p);else{p.state='leaving-room';p.progress=0}}
  }else if(p.state==='handoff'){
   p.progress++;if(((s.autoHandoff&&p.progress>=(s.communication?1:4))||p.handoffReady)&&!s.patients.some(q=>q!==p&&!q.outside&&floorPerson(q)&&q.x===p.x&&q.y===p.y)){p.state='waiting';p.progress=0}
  }else if(p.state==='service'){
   p.progress++;if(p.progress>=p.duration){if(['scan','care'].includes(p.stage)){p.state='transfer-out';p.progress=0}else{p.state='leaving-room';p.progress=0}}
  }
  if(p.wait>170&&p.state==='waiting'){p.state='exiting';p.outcome='departed';p.target=null;p.room=null;p.route=path(p,GRID.exit,s.rooms)||[];p.destination={...GRID.exit};s.trust=Math.max(0,s.trust-4);note(s,`${p.name} is leaving after a long wait. The constraint needs attention.`)}
 }
 s.patients=s.patients.filter(p=>p.state!=='done');if(s.seconds>=480||s.cash<-1000)s.ended=true;
}
export function validate(raw){
 const s=migrate(raw);
 const finite=n=>typeof n==='number'&&Number.isFinite(n),integer=n=>Number.isInteger(n)&&n>=0,safeName=n=>typeof n==='string'&&/^[A-Za-z][A-Za-z0-9 ]{0,30}$/.test(n);
 if(!s||s.version!==VERSION||!Object.hasOwn(SCENARIOS,s.scenario)||!['sandbox','campaign'].includes(s.mode)||!Array.isArray(s.rooms)||s.rooms.length>18||!Array.isArray(s.staff)||s.staff.length<4||s.staff.length>12||!Array.isArray(s.patients)||s.patients.length>200||!Array.isArray(s.records)||!Array.isArray(s.actions)||!Array.isArray(s.log)||!s.utilization||!integer(s.seed)||!finite(s.cash)||!integer(s.seconds)||s.seconds>480||!integer(s.initialSeed)||!integer(s.nextId)||!integer(s.nextArrival)||!finite(s.energy)||!finite(s.trust)||!finite(s.surge))throw Error('Unsupported or damaged shift');
 for(const key of ['served','left','arrivals'])if(!integer(s[key]))throw Error('Invalid counts');
 for(const key of ['ended','breaks','access','urgency','eventDone'])if(typeof s[key]!=='boolean')throw Error('Invalid policy');
 if(s.arrivals!==s.served+s.left+s.patients.length)throw Error('Arrival accounting mismatch');
 const ids=new Set();for(const p of [...s.patients,...s.records]){if(ids.has(p.id)||!integer(p.id)||!safeName(p.name)||![p.wait,p.walking,p.service,p.arrival,p.progress,p.x,p.y].every(n=>finite(n)&&n>=0)||p.x>=GRID.w||p.y>=GRID.h||!Array.isArray(p.history)||p.history.some(h=>!Object.hasOwn(TYPES,h.stage)||!integer(h.at)||!finite(h.duration)))throw Error('Invalid visit');ids.add(p.id)}
 const staffIds=new Set();for(const st of s.staff){if(staffIds.has(st.id)||!integer(st.id)||!safeName(st.name)||!finite(st.fatigue)||st.fatigue<0||st.fatigue>100||!integer(st.breakUntil))throw Error('Invalid clinician');staffIds.add(st.id)}
 const roomIds=new Set(),assigned=new Set();for(const r of s.rooms){if(roomIds.has(r.id)||!integer(r.id)||!Object.hasOwn(TYPES,r.type)||!integer(r.x)||!integer(r.y)||r.x+1>=GRID.w||r.y+2>=GRID.h||![1,2,3].includes(r.level)||!Array.isArray(r.staff)||r.staff.length>TYPES[r.type].staff||r.staff.some(id=>!staffIds.has(id)||assigned.has(id))||s.rooms.some(q=>q!==r&&r.x<q.x+2&&r.x+2>q.x&&r.y<q.y+2&&r.y+2>q.y)||path(GRID.entry,door(r),s.rooms)===null)throw Error('Invalid room');roomIds.add(r.id);r.staff.forEach(id=>assigned.add(id))}
 const reserved=new Set();for(const p of s.patients){if(!['arrival','waiting','walking','queue-walking','service','transfer-in','transfer-out','entering-room','leaving-room','handoff','exiting'].includes(p.state)||!Object.hasOwn(TYPES,p.stage)||!Array.isArray(p.route)||p.route.some(t=>!Number.isInteger(t.x*4)||!Number.isInteger(t.y*4)||t.x<0||t.y<0||t.x>=GRID.w||t.y>=GRID.h||blocked(t.x,t.y,s.rooms)))throw Error('Invalid navigation');if(p.target!==null){if(!roomIds.has(p.target)||reserved.has(p.target))throw Error('Duplicate assignment');reserved.add(p.target)}}
 if(!Array.isArray(s.arrivalTape)||s.arrivalTape.length>200||!integer(s.arrivalIndex)||s.arrivalIndex>s.arrivalTape.length||!['autoHandoff','communication','prevention'].every(k=>typeof s[k]==='boolean'))throw Error('Invalid schedule or policy');
 const events=new Set();let at=-1;for(const e of s.arrivalTape){if(!integer(e.id)||events.has(e.id)||!finite(e.at)||e.at<at||e.at>480||!GOALS.includes(e.goal)||!finite(e.navDelay)||e.navDelay<0||e.navDelay>9||['barrier','imaging','urgent','returning'].some(k=>typeof e[k]!=='boolean'))throw Error('Invalid arrival event');events.add(e.id);at=e.at}
 for(const st of s.staff)if(!Array.isArray(st.skills)||st.skills.some(k=>!Object.hasOwn(TYPES,k))||!Object.hasOwn(TRAITS,st.trait)||!integer(st.shiftEnd)||st.shiftEnd>480)throw Error('Invalid staff skills');
 for(const r of s.rooms)if(!Array.isArray(r.decor)||r.decor.some(k=>!Object.hasOwn(DECOR,k))||r.staff.some(id=>!compatible(s.staff.find(st=>st.id===id),r.type)))throw Error('Invalid room team or decoration');
 for(const p of [...s.patients,...s.records])if(!GOALS.includes(p.goal)||![p.handoff,p.transfer,p.yielding].every(n=>finite(n)&&n>=0))throw Error('Invalid visit timing');
 for(const p of [...s.patients,...s.records])if(!finite(p.elapsedOffset))throw Error('Invalid prior timing offset');
 const point=p=>p&&finite(p.x)&&finite(p.y)&&p.x>=0&&p.y>=0&&p.x<GRID.w&&p.y<GRID.h;
 if(s.actions.length>20000||s.records.length>200||s.log.length>5||s.log.some(x=>typeof x!=='string'||x.length>500)||s.records.length!==s.served+s.left||path(GRID.entry,GRID.exit,s.rooms)===null)throw Error('Invalid saved records');
 for(const p of s.patients){if((p.destination&&!point(p.destination))||(p.previous&&!point(p.previous))||(p.motion&&(!Array.isArray(p.motion)||p.motion.length>5||p.motion.some(v=>!point(v))))||(['walking','service','transfer-in','transfer-out','entering-room','leaving-room'].includes(p.state)&&(!roomIds.has(p.room)||p.room!==p.target)))throw Error('Invalid movement or reservation')}
 for(const st of s.staff)if(st.breakTrip){const tr=st.breakTrip;if(!['outbound','resting','returning'].includes(tr.phase)||!roomIds.has(tr.home)||(tr.lounge!==null&&!roomIds.has(tr.lounge))||!point(tr.position)||!point(tr.previous)||!point(tr.destination)||!Array.isArray(tr.route)||tr.route.length>300||tr.route.some(p=>!point(p)||blocked(p.x,p.y,s.rooms))||!Array.isArray(tr.motion)||tr.motion.length>5||tr.motion.some(p=>!point(p))||(tr.phase==='resting'&&!integer(tr.restEnd)))throw Error('Invalid protected break')}
 s.lastAction=null;return s;
}
export function statistics(values){const a=[...values].sort((x,y)=>x-y);return {n:a.length,mean:a.length?a.reduce((x,y)=>x+y,0)/a.length:null,median:a.length?(a[Math.floor((a.length-1)/2)]+a[Math.ceil((a.length-1)/2)])/2:null,p90:a.length?a[Math.ceil(a.length*.9)-1]:null}}
export function report(s){const completed=s.records.filter(r=>r.outcome==='completed');return {game:'hospitalSIM',model:VERSION,scenario:s.scenario,mode:s.mode,mastery:mastery(s),arrivalFingerprint:fingerprint(s.arrivalTape),seed:s.initialSeed,randomState:s.seed,simulationSeconds:s.seconds,definitions:{unit:'fictional game seconds',waiting:'ticks in waiting state, including modeled access delay; excludes walking, handoff, equipment transfer and service',handoff:'ticks communicating the next service',transfer:'ticks getting on/off equipment',walking:'route and doorway-navigation ticks; yielding is counted in waiting',timingMigration:'Prior-version visits retain an explicit elapsedOffset; categories sum to elapsed plus this offset',service:'ticks receiving a service',experience:'unvalidated game indicator',selectionBias:'Completed-only waits exclude people who departed or remain unfinished; consult all-outcome statistics too.'},counts:{arrivals:s.arrivals,completed:s.served,departed:s.left,unfinished:s.patients.length},waits:{completed:statistics(completed.map(p=>p.wait)),allRecordedOutcomes:statistics(s.records.map(p=>p.wait)),allArrivalsIncludingCurrent:statistics([...s.records,...s.patients].map(p=>p.wait))},accessCohorts:[true,false].map(barrier=>({barrier,arrivals:[...s.records,...s.patients].filter(p=>p.barrier===barrier).length,completed:statistics(completed.filter(p=>p.barrier===barrier).map(p=>p.wait))})),budget:s.cash,teamEnergy:s.energy,experience:s.trust,layout:s.rooms,staff:s.staff,policy:{urgency:s.urgency,access:s.access,breaks:s.breaks,autoHandoff:s.autoHandoff,communication:s.communication,prevention:s.prevention},decisions:s.actions,visits:s.records,unfinished:s.patients,utilization:s.utilization,disclaimer:'Fictional simulation. Substantial AI assistance. No clinical or educational effectiveness validation. Device-local records only.'}}

export const compatible=(st,type)=>!TYPES[type].staff||st.skills.includes(TYPES[type].skill);
// Keep the doorway reserved throughout a visit so exiting never overlaps corridor traffic.
export const floorPerson=p=>p.state!=='done';
const traffic=(s,p)=>s.patients.filter(q=>q!==p&&floorPerson(q)&&!q.outside);
export function arrivalTape(scenario,seed,prevention=false){
 const rng={seed},cfg=SCENARIOS[scenario],events=[];if(!cfg)throw Error('Unknown scenario');
 for(let at=1;at<425;){const barrier=random(rng)<cfg.barrier,urgent=random(rng)<.25,imaging=random(rng)<.55,goal=GOALS[Math.floor(random(rng)*GOALS.length)],returning=scenario==='community'&&random(rng)<.32;events.push({id:1000+events.length,at,barrier,urgent,imaging,goal,returning,navDelay:barrier?(prevention&&scenario==='community'?4:9):0});at+=at>=130&&at<165?6:cfg.interval}return events;
}
export function fingerprint(value){let h=2166136261;for(const c of JSON.stringify(value)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return(h>>>0).toString(16)}
function beginService(s,p){const r=s.rooms.find(r=>r.id===p.room);p.state='service';p.progress=0;const fatigue=r.staff.reduce((a,id)=>a+s.staff.find(st=>st.id===id).fatigue,0)/r.staff.length,speed=r.staff.reduce((a,id)=>a+TRAITS[s.staff.find(st=>st.id===id).trait].speed,0)/r.staff.length;p.duration=TYPES[r.type].duration/(1+.22*(r.level-1))/speed*(1+fatigue/140);p.history.push({stage:p.stage,at:s.seconds,room:r.id,duration:p.duration})}
function finishService(s,p){if(((p.stage==='care'&&!p.returning)||p.stage==='plan')&&s.patients.some(q=>q!==p&&!q.outside&&floorPerson(q)&&q.x===p.x&&q.y===p.y))return;p.target=null;p.room=null;p.progress=0;if((p.stage==='care'&&!p.returning)||p.stage==='plan'){p.state='exiting';p.outcome='completed';p.destination={...GRID.exit};p.route=path(p,GRID.exit,s.rooms)||[];s.cash+=390;s.trust=Math.min(100,Math.max(0,s.trust+(p.wait<75?1.2:-1.5)))}else{p.stage=p.stage==='consult'?(p.imaging?'scan':'care'):p.stage==='scan'?'care':'plan';p.state='handoff';p.handoffReady=false}}
export function acknowledge(s,id){const p=s.patients.find(p=>p.id===id&&p.state==='handoff');if(!p)return false;p.handoffReady=true;recordAction(s,'handoff',{id});return true}
export function assignStaff(s,staffId,roomId){const st=s.staff.find(p=>p.id===staffId),to=s.rooms.find(r=>r.id===roomId),from=s.rooms.find(r=>r.staff.includes(staffId));if(!st||s.ended||st.breakUntil>s.seconds||(st.shiftEnd<=s.seconds&&roomId!==null)||(from&&s.patients.some(p=>p.target===from.id))||(to&&(!compatible(st,to.type)||to.staff.length>=TYPES[to.type].staff)))return {ok:false,reason:'Finish reserved work first; choose a compatible module with a team vacancy.'};if(roomId!==null&&!to)return {ok:false,reason:'Unknown module.'};if(from)from.staff=from.staff.filter(id=>id!==staffId);if(to)to.staff.push(staffId);recordAction(s,'assign',{staffId,roomId});s.lastAction=null;return {ok:true}}
export function decorate(s,id,kind){const r=s.rooms.find(r=>r.id===id);if(!r||!Object.hasOwn(DECOR,kind)||r.decor.includes(kind)||s.cash<DECOR[kind].cost||s.ended)return false;const before=JSON.stringify({...s,lastAction:null});r.decor.push(kind);s.cash-=DECOR[kind].cost;recordAction(s,'decorate',{id,kind});s.lastAction={at:s.seconds,snapshot:before};return true}
export function causes(s,type){const rooms=s.rooms.filter(r=>r.type===type),waiting=s.patients.filter(p=>p.stage===type&&!['service','transfer-in','transfer-out','entering-room','leaving-room','exiting'].includes(p.state)),ready=r=>r.staff.length===TYPES[type].staff&&r.staff.every(id=>{const st=s.staff.find(p=>p.id===id);return st.breakUntil<=s.seconds&&st.shiftEnd>s.seconds&&compatible(st,type)});return {waiting:waiting.length,modules:rooms.length,reserved:rooms.filter(r=>s.patients.some(p=>p.target===r.id)).length,understaffed:rooms.filter(r=>!ready(r)).length,handoffs:waiting.filter(p=>p.state==='handoff').length,accessDelay:waiting.filter(p=>p.navDelay>0&&!s.access).length,explanation:!rooms.length?'No module provides this service.':rooms.some(r=>!ready(r))?'Staff skills, shifts or protected breaks currently reduce capacity.':rooms.every(r=>s.patients.some(p=>p.target===r.id))?'Every module has a reserved visit. Added unrelated capacity cannot serve this queue.':waiting.some(p=>p.state==='handoff')?'A next-service handoff is still being communicated.':waiting.some(p=>p.navDelay>0&&!s.access)?'The modeled communication and transport delay remains.':'A module is ready; travel and arrival order govern the next reservation.'}}
export function mastery(s){const g=SCENARIOS[s.scenario];return s.ended&&s.served>=g.goal&&s.left<=g.departure&&s.cash>=0&&s.energy>=40}
function migrateV02(s){if(s?.version!=='0.2.0-diorama')return s;const defaults=initial(s.scenario,s.initialSeed);s.version='0.3.0-neighborhood';s.mode='sandbox';s.autoHandoff=true;s.communication=false;s.prevention=false;s.arrivalTape=defaults.arrivalTape.filter(e=>e.at>s.seconds).map((e,i)=>({...e,id:3000+i}));s.arrivalIndex=0;s.lastAction=null;for(const r of s.rooms)r.decor=[];for(const [i,st] of s.staff.entries())Object.assign(st,{skills:defaults.staff[i%6].skills,trait:defaults.staff[i%6].trait,shiftEnd:480});for(const p of [...s.patients,...s.records])Object.assign(p,{handoff:0,transfer:0,goal:GOALS[0],returning:false,outside:false,stalled:0,destination:p.state==='exiting'?GRID.exit:p.target?door(s.rooms.find(r=>r.id===p.target)):p.route?.at(-1)});recordAction(s,'model-migration',{from:'0.2.0-diorama',note:'Existing visits retained; future arrival schedule uses v0.3 parameters.'});return s}

function breakDestination(s,home){const candidates=[];for(let y=0;y<GRID.h;y++)for(const x of [0,GRID.w-1]){if(blocked(x,y,s.rooms)||s.patients.some(p=>p.x===x&&p.y===y||p.destination?.x===x&&p.destination?.y===y))continue;const route=path(door(home),{x,y},s.rooms);if(route)candidates.push({x,y,d:route.length})}return candidates.sort((a,b)=>a.d-b.d)[0]||door(home)}

export function migrate(raw){const s=migrateV02(raw);if(s?.version!=='0.3.0-neighborhood')return s;s.version=VERSION;s.lastAction=null;for(const p of [...s.patients,...s.records]){p.yielding=0;p.elapsedOffset=p.wait+p.walking+p.service+p.handoff+p.transfer-(p.total??s.seconds-p.arrival)}for(const p of s.patients){if(blocked(p.x,p.y,s.rooms)){const candidates=[];for(let y=0;y<GRID.h;y+=.5)for(let x=0;x<GRID.w;x+=.5)if(!blocked(x,y,s.rooms)&&!s.patients.some(q=>q!==p&&!q.outside&&q.x===x&&q.y===y))candidates.push({x,y,d:Math.abs(p.x-x)+Math.abs(p.y-y)});const nearest=candidates.sort((a,b)=>a.d-b.d||a.y-b.y||a.x-b.x)[0];if(nearest){p.x=nearest.x;p.y=nearest.y;p.previous={x:p.x,y:p.y};p.motion=null}}if(p.route.some(t=>blocked(t.x,t.y,s.rooms))){p.route=path(p,p.destination||p.route.at(-1),s.rooms)||[];p.previous={x:p.x,y:p.y};p.motion=null}}
recordAction(s,'model-migration',{from:'0.3.0-neighborhood',note:'Prior visit timing retained as an explicit offset. Future time is classified once; doorway movement and body clearance added. Prior corridor positions/routes are adjusted to clear platforms.'});return s}
