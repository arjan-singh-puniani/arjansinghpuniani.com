import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const out='Documentation/shoulder-living/baseline';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome'});
try {
  const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  await page.goto('http://127.0.0.1:4195/holoanatomy/shoulder/index.html');
  await page.waitForFunction(()=>window.shoulderStudio?.ready);
  await page.screenshot({path:out+'/desktop.png'});
  await page.click('[data-mode="peel"]');
  await page.screenshot({path:out+'/peel.png'});
  const audit=await page.evaluate(()=>{
    const s=shoulderStudio.scene;
    return {metrics:s.metrics(),parts:[...s.fragments].map(([id,meshes])=>({id,name:s.parts.get(id).name,fragments:meshes.length,vertices:meshes.reduce((n,m)=>n+m.geometry.attributes.position.count,0),triangles:meshes.reduce((n,m)=>n+(m.geometry.index?.count || m.geometry.attributes.position.count)/3,0),bounds:meshes.map(m=>({min:m.geometry.boundingBox.min.toArray(),max:m.geometry.boundingBox.max.toArray()})),transforms:meshes.map(m=>m.matrixWorld.toArray()),indexed:meshes.every(m=>Boolean(m.geometry.index))}))};
  });
  await writeFile(out+'/mesh-audit.json',JSON.stringify(audit,null,2));
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:out+'/mobile.png'});
  console.log(JSON.stringify(audit.parts.filter(p=>['ZA_infra','ZA_supra','ZA_teres','ZA_subscap','ZA_infra_insertion'].includes(p.id))));
}finally{await browser.close();}
