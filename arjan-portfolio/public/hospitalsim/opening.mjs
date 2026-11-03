export const openingCount=s=>(s.prior?.completed||0)+s.served;
export function openingBuilds(s){return !s.first?null:['consult',...(openingCount(s)>=1?['waiting']:[])]}
export function openingStep(s){
 const count=openingCount(s),rooms=s.rooms.filter(r=>r.type==='consult'),room=rooms[0];
 if(!room)return{kind:s.first.opened?'build':'starter-build',type:'consult',label:'Build consultation · $900',title:'Your clinic starts with one room.',text:'A place to sit, talk and make a plan. No staff or patients yet.'};
 const closed=rooms.find(r=>!r.staff.length);
 if(closed)return{kind:'staff-room',id:closed.id,label:s.staff.some(st=>!s.rooms.some(r=>r.staff.includes(st.id)))?'Send your doctor':s.first.opened?'Hire doctor · $800':'Hire Mira & open · $800',title:s.first.opened?'A second room needs a second doctor.':'Now give your room its doctor.',text:'Hiring includes the assignment. Watch your doctor come through the door and walk to work.'};
 const patient=s.patients[0];
 if(!count){const arriving=s.staff.some(st=>st.entering!==undefined||st.breakTrip);return{kind:patient?'patient':'watch',id:patient?.id,label:patient?'Follow '+patient.name:'Doors are opening…',title:patient?.state==='service'?'Mira is helping '+patient.name+'.':patient&&['exiting','leaving-hospital'].includes(patient.state)?patient.name+' is heading home.':arriving?'Mira is on her way.':patient?patient.name+' is finding the room.':'Your first neighbor is arriving.',text:'One room. One doctor. One neighbor to help home. Watch the visit; there is nothing else to manage yet.'}}
 const waiting=s.patients.filter(p=>p.stage==='consult'&&['waiting','queue-walking','seated','seat-walking'].includes(p.state)).length;
 return{kind:'grow',id:room.id,label:'Improve your clinic',title:waiting>=2?waiting+' waiting. How will you make room?':count===1?'Your first neighbor is home!':waiting?waiting+' waiting. How will you make room?':count+' neighbors home. Your clinic is growing.',text:waiting?'One doctor helps one person at a time. Speed up a room, or open another with its own doctor.':'Choose one useful improvement. Watch what changes before adding more.'};
}
