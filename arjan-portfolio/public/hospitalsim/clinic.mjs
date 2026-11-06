// Booked fictional service requests, not a diagnosis or treatment algorithm.
export const CLINIC_DEPARTMENTS={
 intake:{name:'Reception',cost:400,duration:3,staff:1,skill:'intake',asset:'reception',role:'admin',fee:0,site:{x:0,y:5,rotation:1},patient:[0,.03,.8],staffPost:[0,0,-.65],heading:0},
 gp:{name:'GP consultation',cost:900,duration:10,staff:1,skill:'gp',asset:'gp',role:'gp',fee:180,site:{x:3,y:4,rotation:0},patient:[0,.03,.95],staffPost:[0,.03,-.85],heading:0,seated:true},
 pharmacy:{name:'Pharmacy',cost:800,duration:5,staff:1,skill:'pharmacy',asset:'pharmacy',role:'pharmacist',fee:75,site:{x:6,y:4,rotation:0},patient:[0,.03,.85],staffPost:[0,0,-.65],heading:0},
 neuro:{name:'Neurology',cost:1400,duration:13,staff:1,skill:'neuro',asset:'neuro',role:'neurologist',fee:220,site:{x:0,y:2.5,rotation:1},patient:[0,.03,.95],staffPost:[0,.03,-.85],heading:0,seated:true},
 gait:{name:'Gait assessment',cost:1100,duration:12,staff:1,skill:'gait',asset:'gait',role:'physio',fee:180,site:{x:3,y:1,rotation:0},patient:[0,.03,1],staffPost:[-1.15,0,-.3],heading:Math.PI/2},
 eeg:{name:'Video EEG',cost:1300,duration:18,staff:1,skill:'eeg',asset:'eeg',role:'neurotech',fee:260,site:{x:6,y:1,rotation:0},patient:[.55,0,-.45],staffPost:[-1.15,0,-.3],heading:Math.PI/2,bed:true},
 sleep:{name:'Sleep lab',cost:1300,duration:20,staff:1,skill:'sleep',asset:'sleep',role:'neurotech',fee:260,site:{x:0,y:0,rotation:1},patient:[.55,0,-.45],staffPost:[-1.15,0,-.3],heading:Math.PI/2,bed:true}
};
export const CLINIC_ROLES={
 admin:{label:'Administrator',short:'Admin',badge:'DESK',base:'clinician',assetAlias:'staff-reception',color:'#9a593d',work:'Check-in and arrival guidance',skills:['intake'],cost:500,name:'Quinn'},
 gp:{label:'General practitioner',short:'GP',badge:'GP',base:'coat',assetAlias:'staff-doctor',color:'#2f526e',work:'General practice consultations and fictional referrals',skills:['gp'],cost:800,name:'Mira'},
 pharmacist:{label:'Pharmacist',short:'Pharmacist',badge:'RX',base:'coat',color:'#3d8072',work:'Fictional collection orders; no medication or dosing decisions',skills:['pharmacy'],cost:700,name:'Rowan'},
 neurologist:{label:'Neurologist',short:'Neurologist',badge:'NEU',base:'coat',color:'#65508c',work:'Booked specialist consultations',skills:['neuro'],cost:1000,name:'Noor'},
 physio:{label:'Physiotherapist',short:'Physio',badge:'PT',base:'clinician',color:'#287b8b',work:'Booked gait and mobility assessments',skills:['gait'],cost:800,name:'Leon'},
 neurotech:{label:'Neurophysiology technologist',short:'Neuro tech',badge:'EEG',base:'clinician',color:'#426592',work:'Booked video EEG and sleep recordings',skills:['eeg','sleep'],cost:800,name:'Avery'}
};
export const CLINIC_CASES={
 routine:{label:'General practice visit',path:['gp']},
 collection:{label:'Visit with a fictional collection order',path:['gp','pharmacy']},
 neuroReview:{label:'Booked neurology follow-up',path:['gp','neuro']},
 mobility:{label:'Parkinson’s follow-up with a booked mobility assessment',path:['gp','neuro','gait','pharmacy']},
 epilepsy:{label:'Epilepsy follow-up with booked video EEG',path:['gp','neuro','eeg','pharmacy']},
 sleepReview:{label:'Narcolepsy follow-up with a booked sleep assessment',path:['gp','neuro','sleep']}
};
export const clinicTotal=s=>(s.prior?.completed||0)+s.served;
export function clinicBuilds(s){
 const types=new Set(['intake','gp']);if(s.clinic.gpVisits)for(const t of ['waiting',...(!s.clinic.pacing?['pharmacy']:[]),'entrance','exit'])types.add(t);
 for(const r of s.rooms)types.add(r.type);
 for(const p of s.patients)for(const t of s.clinic.pacing?[p.stage]:CLINIC_CASES[p.clinicalCase]?.path||[])types.add(t);
 return [...types];
}
export function clinicStep(s){
 for(const type of ['intake','gp']){
  const room=s.rooms.find(r=>r.type===type),d=CLINIC_DEPARTMENTS[type];
  if(!room)return{kind:'clinic-build',type,label:'Build '+d.name+' · $'+d.cost,title:type==='intake'?'First, a place to check in.':'Now add your GP’s room.',text:type==='intake'?'Start with a reception desk. Arrivals need someone to welcome them.':'The patient’s chair faces the GP, across the desk.'};
  if(!room.staff.length)return{kind:'staff-room',id:room.id,label:'Hire '+CLINIC_ROLES[d.role].name+' · $'+CLINIC_ROLES[d.role].cost,title:type==='intake'?'Reception needs an administrator.':'Your GP room needs its doctor.',text:type==='intake'?'Quinn handles check-in. Hiring includes the room assignment.':'Mira will see one neighbor at a time. No free staff come with a room.'};
 }
 if(!s.clinic.opened)return{kind:'open-clinic',label:'Open the doors',title:'Your first team is ready.',text:'Quinn checks people in. Mira sees them next. Open when you are ready; there is no cost while closed.'};
 const closed=s.rooms.find(r=>CLINIC_DEPARTMENTS[r.type]&&!r.staff.length);
 if(closed){const d=CLINIC_DEPARTMENTS[closed.type],role=CLINIC_ROLES[d.role];return{kind:'staff-room',id:closed.id,label:'Hire '+role.short+' · $'+role.cost,title:d.name+' needs its own colleague.',text:'The room opens after its assigned colleague walks in.'}}
 const needs=s.patients.find(p=>p.stage!=='intake'&&p.stage!=='gp'&&!s.rooms.some(r=>r.type===p.stage));
 if(needs){const d=CLINIC_DEPARTMENTS[needs.stage];return{kind:'clinic-build',type:needs.stage,label:'Build '+d.name+' · $'+d.cost,title:needs.name+' is waiting for '+d.name.toLowerCase()+'.',text:'This visit has a booked next step. More GP rooms cannot provide this service.'}}
 const p=s.patients[0];
 if(!s.clinic.gpVisits)return{kind:p?'patient':'watch',id:p?.id,label:p?'Follow '+p.name:'Waiting for an arrival…',title:p?.state==='changing'?'Checked in. A quick gown-change spin.':p?.stage==='gp'?'Next stop: the GP.':p?'Quinn is welcoming '+p.name+'.':'The doors are open.',text:'People arrive in everyday clothes, check in, change, then queue for their GP.'};
 return{kind:'grow',label:'Improve your clinic',title:clinicTotal(s)+(clinicTotal(s)===1?' neighbor':' neighbors')+' home · $'+s.clinic.revenue+' service revenue.',text:'Build to add capacity. Select a room to equip it.'};
}

export const clinicSite=(s,type)=>({...CLINIC_DEPARTMENTS[type].site,y:CLINIC_DEPARTMENTS[type].site.y+(s.site?.shiftY||0)});
