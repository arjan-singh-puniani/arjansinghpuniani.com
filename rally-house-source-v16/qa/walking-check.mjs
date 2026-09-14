import fs from 'node:fs';import assert from 'node:assert/strict';
export async function walking(page){
 await page.evaluate(()=>{const g=window.__rh.game;g.clock.paused=true;for(const a of [...g.activities.active])g.cancelActivity(a);g.settings.visuals='detail';g.ui.hideSpeech();g.characters.forEach((c,i)=>{c.path=[];c.clearCourtMove();c.setAnimation('idle');c.position.set(-2+i*1.4,0,2);c.yaw=0;c.targetYaw=0;c.setLook(undefined);c.socialGesture='none';c.racketStowed=true;c.path=[c.position.clone().add({x:0,y:0,z:5})];});g.camera.focus(0,3,13);for(let i=0;i<180;i++)g.camera.update(1/60);});
 const frames=[];
 for(let frame=0;frame<8;frame++){
  frames.push(await page.evaluate(()=>{const g=window.__rh.game;for(let i=0;i<8;i++)for(const c of g.characters)c.update(1/60);return g.characters.map(c=>({id:c.id,position:c.position,kinematics:c.debugKinematics()}));}));
  await page.screenshot({path:`qa/walk-${frame}.png`,timeout:60000});
 }
 assert(frames.every(f=>f.every(c=>Number.isFinite(c.kinematics.leftFoot.x))));
 fs.writeFileSync('qa/walking-browser.json',JSON.stringify(frames,null,2));console.log('WALKING VISUAL FRAMES CAPTURED');
}
