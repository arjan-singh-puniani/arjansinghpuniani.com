import assert from 'node:assert/strict';import fs from 'node:fs';
export async function avatars(page){
 const rows=[];
 await page.click('#settingsBtn');await page.getByText('Character: choose your look',{exact:true}).click();await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('#context')).opacity)===1);await page.locator('#context button').filter({has:page.locator('strong',{hasText:'Taylor'})}).click();
 for(const id of ['taylor','arjan']){
  if(id==='arjan'){await page.click('#settingsBtn');await page.getByText('Character: Taylor',{exact:true}).click();await page.getByText('Arjan',{exact:true}).click();}
  await page.evaluate(()=>{const g=window.__rh.game,p=g.player;p.goTo(p.position.clone().set(-5,0,2),'idle');for(let i=0;i<2400&&p.pathIndex<p.path.length;i++)p.update(1/60);if(Math.hypot(p.position.x+5,p.position.z-2)>.1)throw Error('Avatar walking did not arrive');});
  const before=await page.evaluate(async()=>{const g=window.__rh.game;g.clock.paused=true;const p=g.player;g.camera.focus(p.position.x,p.position.z,13);for(let i=0;i<180;i++)g.camera.update(1/60);p.yaw=p.targetYaw=Math.atan2(g.camera.position.x-p.position.x,g.camera.position.z-p.position.z);await g.save();return {id:g.playerAvatar,name:p.spec.name,position:{x:p.position.x,z:p.position.z},coins:g.coins,progress:g.mikaProgress};});
  assert.equal(before.id,id);await page.screenshot({path:`qa/avatar-${id}.png`,timeout:60000});
  await page.reload();await page.waitForFunction(()=>window.__rh?.ready);const after=await page.evaluate(()=>{const g=window.__rh.game;g.clock.paused=true;return {id:g.playerAvatar,name:g.player.spec.name,position:{x:g.player.position.x,z:g.player.position.z},coins:g.coins,progress:g.mikaProgress};});assert.deepEqual(after,before);rows.push({before,after});
 }
 fs.writeFileSync('qa/avatar-results.json',JSON.stringify(rows,null,2));console.log('Both avatars selected, rendered and persisted without altering club progress.');
}
