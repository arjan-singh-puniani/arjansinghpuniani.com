export async function capture(page){
 await page.evaluate(()=>{const g=window.__rh.game;g.clock.paused=false;g.settings.visuals='detail';for(let i=0;i<4000;i++){g.updateFixed(1/60);const r=Array.from(g.lifeRuns.values())[0];if(r?.scene.id==='bonsai'&&r.beat===1&&r.age>.8)break;}g.clock.paused=true;g.camera.frameAcademy();for(let i=0;i<180;i++)g.camera.update(1/60);});
 await page.waitForTimeout(1200);await page.screenshot({path:'qa/v14-release-desktop.png',timeout:60000});console.log('FINAL VISUAL CAPTURED');
}
