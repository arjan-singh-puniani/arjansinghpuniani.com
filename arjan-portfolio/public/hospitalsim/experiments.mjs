import {tick,validate,report,fingerprint,arrivalTape} from './simulation.mjs?v=043';
const copy=s=>JSON.parse(JSON.stringify({...s,lastAction:null}));
export function changed(a,b){return ['rooms','staff','access','breaks','urgency','communication','autoHandoff','prevention','cash'].filter(k=>JSON.stringify(a[k])!==JSON.stringify(b[k]));}
export function compare(base,plan){
 validate(copy(base));validate(copy(plan));
 if(base.seconds!==plan.seconds||base.initialSeed!==plan.initialSeed||fingerprint(base.arrivalTape)!==fingerprint(plan.arrivalTape)||JSON.stringify(base.patients)!==JSON.stringify(plan.patients)||JSON.stringify(base.records)!==JSON.stringify(plan.records))throw Error('Restore the checkpoint, pause, then change only layout, staffing or policy. Arrivals and current visits must match.');
 const runs=[];
 for(let i=0;i<5;i++){
  const a=copy(base),b=copy(plan);
  if(i){const tape=arrivalTape(a.scenario,a.initialSeed+i,a.prevention);for(let j=a.arrivalIndex;j<a.arrivalTape.length;j++){const v=tape[j%tape.length];for(const s of [a,b])s.arrivalTape[j]={...s.arrivalTape[j],barrier:v.barrier,urgent:v.urgent,imaging:v.imaging,returning:v.returning,navDelay:v.navDelay};}}
  const tape=fingerprint(a.arrivalTape);if(tape!==fingerprint(b.arrivalTape))throw Error('Exogenous arrivals differ');
  while(!a.ended)tick(a);while(!b.ended)tick(b);
  const metrics=s=>{const r=report(s);return {...r.counts,wait:r.waits.allArrivalsIncludingCurrent,budget:r.budget,energy:r.teamEnergy,experience:r.experience,access:r.accessCohorts}};
  runs.push({future:i===0?'Recorded exact arrival schedule':'Sensitivity future '+i,tape,baseline:metrics(a),plan:metrics(b)});
 }
 const delta=r=>r.plan.completed-r.baseline.completed;
 return {model:base.version,seed:base.initialSeed,checkpoint:base.seconds,changed:changed(base,plan),runs,sensitivity:{n:runs.length,completedDelta:[Math.min(...runs.map(delta)),Math.max(...runs.map(delta))]},limits:'One exact replay plus four paired fictional future variants. This range is sensitivity, not a confidence interval or evidence about real hospitals. Recorded arrivals match within every pair; model parameters are held fixed.'};
}
