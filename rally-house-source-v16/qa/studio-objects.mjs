import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium,browserOptions} from './runtime.mjs';
const b=await chromium.launch({...browserOptions,args:['--use-angle=metal']});
try{
 const p=await b.newPage({viewport:{width:1280,height:800}}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await p.goto('http://127.0.0.1:8078/?debug');await p.waitForFunction(()=>window.__rh?.ready);await p.getByText('Arjan',{exact:true}).click();
 await p.evaluate(()=>{const g=window.__rh.game;g.settings.visuals='detail';g.clock.minutes=1190;g.openObject(g.world.objects.find(o=>o.id==='reception'));});
 await p.getByText('Ring the desk bell',{exact:true}).click();
 await p.waitForFunction(()=>window.__rh.game.activities.active.some(a=>a.kind==='touch'&&a.phase==='active'),null,{timeout:35000});
 await p.screenshot({path:'qa/studio/desk-interaction.png'});
 await p.waitForFunction(()=>window.__rh.game.activities.history.some(a=>a.kind==='touch'&&a.phase==='completed'));
 const sound=await p.evaluate(async()=>{
  const g=window.__rh.game,a=g.audio;
  a.volume=0;a.updateClubAmbience(1,1190,'clear',true);
  const muted=a.ambienceTarget;
  a.volume=.65;a.updateClubAmbience(1,1190,'rain',false);const first=a.ambienceSource;
  for(let i=0;i<30;i++)a.updateClubAmbience(1/60,1190,'rain',false);
  const reused=first===a.ambienceSource;a.stopAmbience();
  return {muted,reused,stopped:!a.ambienceSource,touches:g.touchRuns.size,input:g.matchInput.enabled};
 });assert.equal(sound.muted,0);assert(sound.reused&&sound.stopped);assert.equal(sound.touches,0);
 // Reduced motion still permits a tangible interaction and expiring effects.
 await p.evaluate(()=>{const g=window.__rh.game;g.settings.reducedMotion=true;g.openObject(g.world.objects.find(o=>o.id==='reception'));});
 await p.getByText('Ring the desk bell',{exact:true}).click();
 await p.waitForFunction(()=>window.__rh.game.activities.history.filter(a=>a.kind==='touch'&&a.phase==='completed').length>=2);
 await p.waitForTimeout(1800);assert.equal(await p.evaluate(()=>window.__rh.game.world.interactionFx.has('bell')),false);
 assert.deepEqual(errors,[]);fs.writeFileSync('qa/studio/objects.json',JSON.stringify({status:'PASS',sound,errors},null,2));console.log('Object, audio and reduced-motion browser checks PASS');
}finally{await b.close()}
