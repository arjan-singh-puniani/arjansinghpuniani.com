import {simulation} from './sim-harness.mjs';
const g=simulation(); const seen=new Set();
for(let i=0;i<36000;i++) {g.updateFixed(1/60);for(const a of g.activities.active)if(a.phase==='traveling'&&a.phaseTime>50&&!seen.has(a.id)){seen.add(a.id);console.log(JSON.stringify({t:i/60,a,targets:g.routes.get(a.id),actors:[...g.characters,g.player].map(c=>({id:c.id,pos:c.position,state:c.state,path:c.path.slice(c.pathIndex),busy:g.activities.busy(c.id)}))}));}}
