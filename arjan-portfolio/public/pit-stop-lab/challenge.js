import { snapshot, clamp } from './simulation.js';
export const CHALLENGE_STEPS=[
 ['prepare','Prepare the bay','Stage the front-left wheel and gun. The other three corners are handled by the crew.'],
 ['position','Position equipment','The car is arriving. Hold to position the jacks clear of its path.'],
 ['jack','Raise the car','Wait for the car to stop, then hold to raise both jacks.'],
 ['align','Align the wheel gun','Drag the contact marker onto the front-left nut, or use Align for assisted contact.'],
 ['loosen','Loosen the captive nut','Hold on the contact point. The nut stays captive in the outgoing wheel.'],
 ['remove','Pull the wheel clear','Drag outward from the hub. The disc and caliper stay on the car.'],
 ['fit','Seat the replacement','Drag inward toward the hub until the replacement seats.'],
 ['tighten','Secure the replacement','Hold the aligned gun to fasten and confirm retention.'],
 ['clear','Clear the equipment','Move the tool and your wheel clear before lowering the car.'],
 ['lower','Lower both jacks','All four corners must be confirmed before lowering.'],
 ['release','Check & release','Four wheels retained, tools clear, both jacks down and the modeled lane clear.'],
 ['complete','Car released','Practice again to improve your time and avoid procedure errors.'],
];
const durations={position:.65,jack:.45,loosen:.65,remove:.65,fit:.75,tighten:.75,clear:.4,lower:.4};
export function newChallenge({arrival=1.61,teamReady=3.65}={}){
 return {phase:'prepare',elapsed:0,progress:0,holding:false,aligned:false,errors:0,completedAt:null,arrival,teamReady,actions:[],message:'',started:false};
}
// The replay folds this same reducer over timestamped input; rendering never advances a procedure.
export function challengeAction(previous,type,at,value){
 if(!Number.isFinite(at)||at<previous.elapsed||!['prepare','hold','end','tick','aim','align','drag','release'].includes(type))throw new Error('Invalid challenge input');
 const s={...previous,actions:[...previous.actions]};
 const dt=at-s.elapsed;s.elapsed=at;s.message='';
 const next=()=>{s.phase=CHALLENGE_STEPS[CHALLENGE_STEPS.findIndex(p=>p[0]===s.phase)+1][0];s.progress=0;s.holding=false;};
 const blocked=message=>{s.errors++;s.message=message;};
 if(s.phase==='complete'){s.elapsed=Math.min(at,s.completedAt+5);return s;}
 if(s.holding&&durations[s.phase]){
  if(s.phase==='jack'&&at<s.arrival)s.message='Wait for the car to stop.';
  else if(s.phase==='lower'&&at<s.teamReady)s.message='Another corner is still working. Keep the jacks raised.';
  else {s.progress=clamp(s.progress+dt/durations[s.phase],0,1);if(s.progress>=1)next();}
 }
 if(type==='prepare'){if(s.phase==='prepare'){s.started=true;next();}else blocked('The bay is already prepared.');}
 if(type==='aim'&&s.phase==='align'&&Number.isFinite(value))s.progress=clamp(value,0,1);
 if(type==='align'){if(s.phase==='align'){s.aligned=true;next();}else blocked('Align the tool after raising the car.');}
 if(type==='hold'){
  if(!durations[s.phase])blocked('Complete the highlighted procedure first.');
  else if(['loosen','tighten'].includes(s.phase)&&!s.aligned)blocked('The gun must be aligned to the nut.');
  else s.holding=true;
 }
 if(type==='end')s.holding=false;
 if(type==='drag'){
  if(!['remove','fit'].includes(s.phase)||!Number.isFinite(value))blocked('A secured wheel cannot be moved.');
  else {s.progress=clamp(value,0,1);if(s.progress>=1)next();}
 }
 if(type==='release'){
  if(s.phase==='release'&&at>=s.teamReady){next();s.completedAt=at;}
  else blocked('Release blocked: finish wheel retention, clearance and jack checks.');
 }
 if(type!=='tick'||s.phase!==previous.phase)s.actions.push({type,at,...(value===undefined?{}:{value})});return s;
}
export function replayChallenge(actions,at,options){let s=newChallenge(options);for(const a of actions){if(a.at>at)break;s=challengeAction(s,a.type,a.at,a.value);}if(at>s.elapsed)s=challengeAction(s,'tick',at);return s;}
export function challengeFrame(s,sim){
 const phase=CHALLENGE_STEPS.findIndex(p=>p[0]===s.phase), t=s.elapsed;
 const state=snapshot(sim,Math.min(t,s.teamReady)), car=state.cars[0];
 state.time=t;state.activeCar=1;state.cars=[car];state.traffic.visible=false;
 const lifting=phase===2?s.progress:phase>2&&phase<9?1:phase===9?1-s.progress:0;
 if(phase===0)car.position=0;
 if(t>=s.arrival){car.position=0;car.speed=0;car.acceleration=0;car.phase=phase===11?'DEPARTURE':'MANUAL SERVICE';}
 car.frontLift=car.rearLift=car.lift=lifting*.1;car.released=phase===11;
 if(car.released){const u=Math.max(0,t-s.completedAt);car.position=-Math.min(30,2*u*u);car.speed=4*u;}
 const c=car.corners.FL;
 c.removal=phase<5?0:phase===5?s.progress:1;
 c.alignment=phase<6?0:phase===6?Math.min(1,s.progress/.65):1;c.installation=phase<6?0:phase===6?clamp((s.progress-.65)/.35,0,1):1;
 c.incomingInstalled=phase>=7;c.outgoingInstalled=phase<5;c.installed=c.incomingInstalled||c.outgoingInstalled;
 c.secured=phase<4||phase>=8;c.loosen=phase<4?0:phase===4?s.progress:1;c.tighten=phase<7?0:phase===7?s.progress:1;
 c.toolClear=phase<8?0:phase===8?s.progress:1;
 c.gun=phase<3?0:phase===3?s.progress:phase<=7?1:1-c.toolClear;c.gunActive=s.holding&&[4,7].includes(phase);
 c.state=s.phase.toUpperCase();c.correction=0;c.complete=phase>=8;
 c.crew={task:c.state,clear:c.toolClear===1};c.tool={engaged:c.gun===1,operating:c.gunActive,clear:c.toolClear===1};
 const other=Object.entries(car.corners).filter(([key])=>key!=='FL').map(([,c])=>c);
 car.safety={wheelsSafe:phase>=8&&other.every(c=>c.secured),toolsClear:phase>=9&&other.every(c=>c.toolClear===1),jacksClear:phase>=10,pathClear:true};
 car.guard=Object.values(car.safety).every(Boolean);
 if(phase===11&&!car.guard){car.released=false;car.phase='SAFETY HOLD';car.position=0;car.speed=0;}
 // Jack placement is derived from the manual lift fraction, using the existing renderer contract.
 const jack={start:t-lifting,end:t+1-lifting};
 return {state,jack};
}
