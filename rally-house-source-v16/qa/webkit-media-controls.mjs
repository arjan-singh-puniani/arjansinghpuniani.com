import assert from 'node:assert/strict';
import fs from 'node:fs';
import {webkit} from './runtime.mjs';

const [out]=process.argv.slice(2);assert(out,'OUTPUT_JSON');
const report={environment:'Mac Playwright WebKit; empty document with one native video control, no game code.',errors:[]};
const browser=await webkit.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:440,height:763},deviceScaleFactor:3,isMobile:true,hasTouch:true});
 page.on('console',message=>{if(message.type()==='error')report.errors.push({text:message.text(),location:message.location()});});
 page.on('pageerror',error=>report.errors.push({exception:error.message}));
 await page.setContent('<!doctype html><title>Native media-control isolation</title><video controls muted playsinline preload="metadata"></video>');
 await page.waitForTimeout(3000);
 report.reproduced=report.errors.some(e=>/^Button failed to load, iconName = (invalid|pip|airplay)-placard,/.test(e.text??''));
 fs.writeFileSync(out,JSON.stringify(report,null,2));
 console.log(JSON.stringify(report));
}finally{await browser.close();}
