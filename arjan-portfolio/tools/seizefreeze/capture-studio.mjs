import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
const base=process.env.SEIZEFREEZE_BASE_URL||'http://127.0.0.1:3216';
const output=new URL('../../Documentation/Validation/SeizeFreeze/',import.meta.url);
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'chromium',args:['--use-angle=metal']});
try{
 for(const [width,height] of [[1440,1000],[390,844]]){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),page=await context.newPage();
  await page.goto(`${base}/seizefreeze-lab/index.html`);
  await page.waitForFunction(()=>window.seizefreeze?.snapshot().stats.frames>0);
  assert.equal(await page.locator('#poster').isVisible(),false);
  assert.equal(await page.locator('#device-lens').isVisible(),true);
  await page.screenshot({path:new URL(`studio-final-${width}.png`,output).pathname});
  if(width===1440){
   const lens=await page.locator('#device-lens').evaluate(el=>{const b=el.getBoundingClientRect(),h=document.getElementById('scene').getBoundingClientRect();return{x:b.x-h.x,y:b.y-h.y,w:b.width,h:b.height};});
   const hide=await page.addStyleTag({content:'.introduction,.chapter-nav,.inspector,.scene-head,.scene-tools,.peel-control,.scene-caption,.anatomy-credit,.scene-gesture,.sf-scene-note,#device-lens{visibility:hidden!important}'});
   const shot=await page.locator('#scene').screenshot();
   const webp=await sharp(shot).webp({quality:85}).toBuffer(),meta=await sharp(shot).metadata();
   const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${meta.width}" height="${meta.height}" viewBox="0 0 ${meta.width} ${meta.height}" role="img"><title>SeizeFreeze reference anatomy and enlarged proposed device</title><desc>Human Reference Atlas brain with an illustrative left superior temporal target. Inset shows the same proposed geometry enlarged. No patient localization or clinical performance is represented.</desc><metadata>Kristen Browne; Heidi Schlehlein / HuBMAP. CC BY 4.0. HRA Brain Male v1.3 and United Male v1.5. Display extraction, materials and concept device added for SeizeFreeze.</metadata><image width="100%" height="100%" href="data:image/webp;base64,${webp.toString('base64')}"/><g font-family="Arial,sans-serif" font-size="12" fill="#e1eff0"><rect x="${lens.x}" y="${lens.y}" width="${lens.w}" height="32" fill="#08121b"/><text x="${lens.x+14}" y="${lens.y+21}">PROPOSED DEVICE · ENLARGED</text><rect x="${lens.x}" y="${lens.y+lens.h-28}" width="${lens.w}" height="28" fill="#08121b"/><text x="${lens.x+14}" y="${lens.y+lens.h-10}">10 × 10 mm contact · assumed</text><text x="32" y="${meta.height-22}">STATIC REFERENCE RENDER · ILLUSTRATIVE TARGET</text></g></svg>`;
   await writeFile(new URL('../../public/seizefreeze-lab/poster.svg',import.meta.url),svg);
   await hide.evaluate(el=>el.remove());
  }
  await context.close();
 }
}finally{await browser.close();}
console.log('Captured final native renders and rebuilt attributed static poster from the actual scene.');
