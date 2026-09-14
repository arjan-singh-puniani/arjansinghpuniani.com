import {simulation,advance} from '../../v16-audit-reference/Rally-House-Character-Life-v15/qa/sim-harness.mjs';
import fs from 'node:fs';
const g=simulation();g.clock.minutes=1300;g.actor('coach').position.set(-10,0,2);g.beginLesson('dropFeed');const accepted=g.activities.active.find(a=>a.kind==='lesson');if(!accepted)throw Error('Fixture did not reserve lesson');
g.actor('coach').path=[];g.actor('coach').pathIndex=0;advance(g,43);const r={fault:'Interrupted travel path after request was accepted, before arrival',accepted:{id:accepted.id,phase:accepted.phase},queue:g.queuedLesson,lessons:g.activities.history.filter(a=>a.kind==='lesson'),progress:g.mikaProgress};fs.writeFileSync('qa/baseline-coaching-cancellation.json',JSON.stringify(r,null,2));console.log(r);
