import {TYPES,queueFor} from './simulation.mjs?v=067';
export function nextStep(s){
 const expansion=s.actions.find(a=>a.type==='build'&&s.rooms.some(r=>r.id===a.room.id));
 if(!expansion)return {kind:'build',type:'consult',label:'Place consultation',title:'A second consultation. A shorter first queue.',text:'Add a staffed room, then watch its first neighbor arrive.'};
 const room=s.rooms.find(r=>r.id===expansion.room.id),visits=[...s.records,...s.patients].filter(p=>p.history.some(h=>h.room===room.id));
 if(!visits.length)return {kind:'room',id:room.id,label:'Inspect new room',title:'The new room is ready. Watch its first visit.',text:`${queueFor(s,room.type)} neighbors need ${TYPES[room.type].name.toLowerCase()}. Its assigned team provides the added capacity.`};
 if(!s.served){const p=s.patients.find(p=>p.history.some(h=>h.room===room.id));if(p)return {kind:'patient',id:p.id,label:'Follow '+p.name,title:'Your new room is working. Follow '+p.name+'.',text:'Watch their next service. Added consultation capacity can move the queue downstream.'}}
 const type=['consult','scan','care',...(s.scenario==='community'?['plan']:[])].sort((a,b)=>queueFor(s,b)-queueFor(s,a))[0],target=s.rooms.filter(r=>r.type===type).sort((a,b)=>a.level-b.level||a.id-b.id)[0],n=queueFor(s,type);
 return {kind:target?'room':'build',id:target?.id,type,label:(target?'Inspect ':'Place ')+TYPES[type].name.toLowerCase(),title:n?`${n} neighbors need ${TYPES[type].name.toLowerCase()}.`:'A little breathing room. Check the next constraint.',text:`${visits.length} visits have used your added module. Inspect the current queue before choosing your next change.`};
}
