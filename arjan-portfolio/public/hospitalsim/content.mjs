import {CLINIC_DEPARTMENTS,CLINIC_ROLES} from './clinic.mjs?v=138';
export const VERSION='1.0.0-rc8', STEP=1;
export const WALK_SUBSTEPS=3;
export const GRID={w:9,h:8,entry:{x:4,y:7},exit:{x:7,y:7},step:1.65};
export const CAMPUS_V1={w:24,h:20,shiftY:12,version:1};
export const CAMPUS={w:32,h:28,shiftY:20,version:2};
export const placementStep=s=>s.site?.version===2 ? .25 : .5;
export const siteOf=s=>s.site||GRID;
export const TYPES={consult:{name:'Consultation',cost:900,duration:12,staff:1,skill:'consult',asset:'consult'},scan:{name:'Imaging',cost:1500,duration:17,staff:1,skill:'scan',asset:'scan'},care:{name:'Procedure & care',cost:1100,duration:15,staff:2,skill:'care',asset:'care'},rest:{name:'Team lounge',cost:600,duration:0,staff:0,asset:'rest'},plan:{name:'Specialist planning',cost:1400,duration:13,staff:1,skill:'plan',asset:'consult'}};
TYPES.waiting={name:'Waiting garden',cost:350,duration:0,staff:0,asset:'lobby'};
export const TRAITS={steady:{name:'Steady hands',speed:1,fatigue:.12,line:'The trolley has a parking space. I drew it myself.'},brisk:{name:'Quick thinker',speed:1.12,fatigue:.19,line:'Efficient is good. Unhurried is better.'},listener:{name:'Careful listener',speed:.96,fatigue:.10,line:'One clear handoff saves two confused journeys.'}};
export const SCENARIOS={clinic:{name:"Juniper Clinic",interval:21,barrier:0,goal:8,departure:8,description:"Build reception, hire an administrator, then add a GP. Open the doors and grow into booked specialist services."},first:{name:'Little Juniper',interval:15,barrier:0,goal:6,departure:6,description:'Start with an empty clinic. Build a consultation, hire its doctor and help six neighbors home. Choose faster rooms or more doctors as the queue grows.'},neighborhood:{name:'Neighborhood clinic',interval:18,barrier:.3,goal:12,departure:8,description:'Help 12 neighbors, with at most 8 departures. Add a consultation, then recruit a surgeon and RN for a second care room when care queues grow. Resolve intake and equipment incidents.'},surge:{name:'Evening surge',interval:13,barrier:.3,goal:15,departure:10,description:'A scheduled bus creates a short surge. Protect the next service from the queue you just solved.'},staffing:{name:'A smaller team',interval:19,barrier:.3,goal:7,departure:12,description:'The nurse finishes at 5:00. Recruitment is closed. Reassign relief clinicians and protect recovery time.'},access:{name:'Finding the way',interval:16,barrier:.7,goal:13,departure:7,description:'Remove the specific modeled communication and transport delay.'},community:{name:'Coming back together',interval:18,barrier:.4,goal:12,departure:8,description:'Some neighbors return for specialist planning. A community workshop changes a future modeled obstacle.'}};
export const DECOR={plant:{name:'Pocket garden',cost:90},art:{name:'Quiet geometry print',cost:65},palette:{name:'Lagoon upholstery',cost:75}};
export const CAMPAIGN=Object.keys(SCENARIOS);
export const GOALS=['Understand my next step','Get home before the cat judges me','Have time to ask a question','Find a quieter waiting spot'];

export const STAFF_ROLES={
 doctor:{label:'Doctor',short:'Doctor',badge:'MD',base:'coat',color:'#2f526e',work:'Consultation, planning and paired handoff review'},
 surgeon:{label:'Surgeon',short:'Surgeon',badge:'SUR',base:'clinician',color:'#344c77',work:'Procedure team'},
 nurse:{label:'Registered nurse',short:'Nurse',badge:'RN',base:'clinician',color:'#087d79',work:'Procedure preparation, bedside care and recovery'},
 np:{label:'Nurse practitioner',short:'NP',badge:'NP',base:'coat',color:'#8a4779',work:'Consultation and planning'},
 pa:{label:'Physician assistant',short:'PA',badge:'PA',base:'coat',color:'#397ca1',work:'Consultation and planning; scenario-specific handoff rules'},
 imaging:{label:'Imaging technologist',short:'Imaging',badge:'XR',base:'clinician',color:'#465f91',work:'Imaging'},
 reception:{label:'Front desk',short:'Front desk',badge:'DESK',base:'clinician',color:'#9a593d',work:'Staffed check-in and arrival guidance'}
};
STAFF_ROLES.assistant={label:'Medical assistant',short:'Medical assistant',badge:'MA',base:'clinician',color:'#398985',work:'Intake support or clinical room preparation'};
STAFF_ROLES.facilities={label:'Facilities',short:'Facilities',badge:'FAC',base:'clinician',color:'#966c32',work:'Equipment readiness, room turnover and spill cleanup'};
export const ROLE_SKILLS={doctor:['consult','plan'],surgeon:['care'],nurse:['care'],np:['consult','plan'],pa:['consult','plan'],imaging:['scan'],reception:[],assistant:[],facilities:[]};
export const initialRole=id=>['doctor','imaging','surgeon','nurse','np','pa'][id-1]||'reception';

export const ROOM_ROLES={consult:['doctor','np','pa'],care:['surgeon','nurse'],scan:['imaging'],plan:['doctor','np','pa'],rest:[],waiting:[]};
export const CASES={welcome:{name:'The map collector',goal:'One clear plan, preferably on one sheet of paper',checkin:3,consultOnly:true},binder:{name:'The overprepared neighbor',goal:'Find the answer without opening the appendix to the appendix',checkin:9},fitness:{name:'The step-count champion',goal:'A little assessment, then a proper sit-down',checkin:4},questions:{name:'The question list',goal:'Understand the next step before heading home',checkin:4}};
export const VOICES={Mira:['One question at a time. I have a pen.','The next step should fit on one page.'],Jules:['Stillness is a team sport.','This scanner has a better posture than I do.'],Remy:['A clear table and a clear plan.','My trolley has a parking space.'],Ash:['Ready, comfortable, then we begin.','No one needs to hurry the chair.'],Sage:['Let’s leave room for one more question.','I can work with that. And a little space.'],Kit:['Good handoffs travel further than gossip.','A clear route. My favorite shortcut.'],Quinn:['Welcome. You are in the right place.','I alphabetized the staplers. They objected.'],Tess:['Measurements first. Guesswork never.','A clear intake makes a calmer next step.'],Ellis:['I have a mop, a plan, and sensible shoes.','One spill at a time. Please stop testing my theory.']};

Object.assign(TYPES,CLINIC_DEPARTMENTS);Object.assign(STAFF_ROLES,CLINIC_ROLES);for(const [role,d]of Object.entries(CLINIC_ROLES))ROLE_SKILLS[role]=d.skills;for(const [type,d]of Object.entries(CLINIC_DEPARTMENTS))ROOM_ROLES[type]=[d.role];

export const shiftSeconds=s=>s.periodSeconds||480;
export const shiftEnd=s=>(s.shiftStart||0)+shiftSeconds(s);
