import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {Character} from '../dist/entities/Character.js';
import {Navigation} from '../dist/world/Navigation.js';
import {Vec3} from '../dist/rendering/Math3D.js';
import {InteractiveMatchSystem} from '../dist/tennis/InteractiveMatchSystem.js';
import {MatchInput} from '../dist/tennis/MatchInput.js';
import {CHAMPIONSHIP_OPPONENTS} from '../dist/tennis/ChampionshipOpponents.js';
import {CHAMPIONSHIP_CONTACT_FEEL} from '../dist/tennis/ChampionshipTuning.js';
import {chromium,browserOptions} from './runtime.mjs';

const output=path.resolve('../takeover-evidence/impact-20261009');fs.mkdirSync(output,{recursive:true});
const profiles=[{id:'restrained',scale:.60},{id:'selected',scale:1},{id:'extra-heavy',scale:1.45}];
const defaults=structuredClone(CHAMPIONSHIP_CONTACT_FEEL),report={simulation:[],camera:[],errors:[]};
const actor=(id,z)=>new Character({id,name:id,role:'member',shirt:'#888888',skin:'#c99977',hair:'#333333',playStyle:'test',goal:'test'},new Vec3(1,0,z),new Navigation(),{});
for(const profile of profiles){
 for(const q of Object.keys(defaults))Object.assign(CHAMPIONSHIP_CONTACT_FEEL[q],{...defaults[q],hold:Math.min(.075,defaults[q].hold*profile.scale),dwell:defaults[q].dwell*profile.scale});
 for(const hz of [30,60,120])for(const id of ['leo','coach','mika','nia']){
  const player=actor('player',5),opponent=actor(id,-5),input=new MatchInput(),contacts=[];
  let now=0,releaseCount=0,previousReleased=false,maxCompressionGap=0,points=0,restart=false;
  const match=new InteractiveMatchSystem(player,opponent,CHAMPIONSHIP_OPPONENTS[id],input,{onHit:(q,side)=>contacts.push({q,side,time:now}),onPoint:()=>{points++;restart=true;}});
  match.startPoint('player');input.setEnabled(true);input.queueSwing();
  for(let i=0;i<hz*45;i++){
   if(restart){restart=false;match.startPoint('player');input.setEnabled(true);input.queueSwing();previousReleased=false;}
   now=i/hz;player.update(1/hz);opponent.update(1/hz);if(match.playerCue()==='swing')input.queueSwing();match.update(1/hz);
   const p=match.pending;if(p?.impactStarted&&!p.released)maxCompressionGap=Math.max(maxCompressionGap,Vec3.sub(match.stagedBall(p),p.hitter.racketContactFrame().center).len());
   if(p?.released&&!previousReleased)releaseCount++;previousReleased=!!p?.released;
  }
  assert(maxCompressionGap<.12);assert(contacts.length>=10);assert(contacts.length-releaseCount<=1,'Only the final still-compressed ball may await release');
  report.simulation.push({profile:profile.id,hz,opponent:id,contacts:contacts.length,releases:releaseCount,points,maxCompressionGap,lastContact:contacts.at(-1).time});
 }
}
for(const q of Object.keys(defaults))Object.assign(CHAMPIONSHIP_CONTACT_FEEL[q],defaults[q]);
const browser=await chromium.launch({...browserOptions,args:['--use-angle=metal']});
try{
 for(const viewport of [{width:1280,height:800},{width:390,height:844}]){
  const page=await browser.newPage({viewport,hasTouch:viewport.width<500});page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto('http://127.0.0.1:8078/?debug');await page.waitForFunction(()=>window.__rh?.ready);await page.getByText('Arjan',{exact:true}).click();
  await page.evaluate(()=>{const g=window.__rh.game;g.clock.paused=true;g.settings.reducedMotion=true;g.autosave=-10000;for(const a of [...g.activities.active])g.cancelActivity(a);g.startChampionship(g.actor('leo'));for(let i=0;i<6000&&g.championship.phase!=='serving';i++)g.updateFixed(1/60);g.settings.reducedMotion=false;g.updateFixed=()=>{};});
  await page.waitForTimeout(1500);
  for(const profile of profiles){
   const camera=await page.evaluate(async profile=>{
    const g=window.__rh.game,m=g.interactiveMatch,{CHAMPIONSHIP_CONTACT_FEEL:feel}=await import('./dist/tennis/ChampionshipTuning.js');
    if(!window.qaFeelDefaults)window.qaFeelDefaults=structuredClone(feel);
    for(const q of Object.keys(feel)){const original=window.qaFeelDefaults[q];Object.assign(feel[q],{...original,hold:Math.min(.075,original.hold*profile.scale),dwell:original.dwell*profile.scale,camera:original.camera*profile.scale,flare:original.flare*profile.scale});}
    m.stop();m.startPoint('player');g.matchInput.setEnabled(true);g.player.position.set(1,0,5);g.actor('leo').position.set(1,0,-5);m.prepareShot('player','serve','perfect');
    for(let i=0;i<180&&!m.pending.impactStarted;i++){g.player.update(1/120);g.actor('leo').update(1/120);m.update(1/120);}
    if(!m.pending.impactStarted)throw Error('No contact');g.renderDt=0;g.render(performance.now());
    const V=g.player.position.constructor,impulse=g.championshipCamera.renderImpulse(),points=[[-3.25,-6],[5.25,-6],[-3.25,6],[5.25,6]];
    const corners=points.map(([x,z])=>{const v=new V(x,.1,z);return {plain:g.camera.project(v),impact:g.camera.project(v,undefined,impulse)};});
    return {impulse:{pushIn:impulse.pushIn,offset:impulse.offset},corners,hold:feel.perfect.hold,dwell:feel.perfect.dwell};
   },profile);
   await page.locator('canvas').screenshot({path:path.join(output,`${profile.id}-${viewport.width}-contact.png`)});
   report.camera.push({profile:profile.id,viewport,...camera});
  }await page.close();
 }
 assert.deepEqual(report.errors,[]);
}finally{fs.writeFileSync(path.join(output,'experiments.json'),JSON.stringify(report,null,2));await browser.close();}
console.log('Three contact profiles at 3 rates / 4 opponents; contact cameras in desktop and portrait PASS');
