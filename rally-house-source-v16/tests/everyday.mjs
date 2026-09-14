import assert from 'node:assert/strict';
import {EverydayLife} from '../dist/simulation/EverydayLife.js';
import {World} from '../dist/world/World.js';
import {destinations} from '../dist/content/content.js';
import {Vec3} from '../dist/rendering/Math3D.js';
import {HUD} from '../dist/ui/HUD.js';
import {SaveSystem} from '../dist/persistence/SaveSystem.js';
import {CURRENT_SAVE_VERSION,migrateGameSave} from '../dist/persistence/migrations.js';
const ctx={free:new Set(['coach','mika','leo','nia']),minute:700,day:1,weather:'clear',warmth:()=>12,hasBench:false};
let n=0;const test=(name,fn)=>{fn();n++;console.log('✓ '+name)};
test('An invitation does not write a memory or invent familiarity',()=>{const d=new EverydayLife();d.tick(8);const s=d.choose(ctx);assert(s);d.started(s);assert.equal(d.history.length,0);assert.equal(Object.keys(d.counts).length,0)});
test('Busy members never enter an everyday scene',()=>{const d=new EverydayLife();d.tick(8);const s=d.choose({...ctx,free:new Set(['leo'])});assert.deepEqual(s.people,['leo']);assert.equal(d.choose({...ctx,free:new Set()}),null)});
test('A failed route leaves no completed story and backs off',()=>{const d=new EverydayLife();d.tick(8);const s=d.choose(ctx);d.failed(s);assert.equal(d.history.length,0);assert(d.cooldowns[s.id]>d.time);assert.equal(d.choose(ctx),null)});
test('Cold tea is a consequence of finished notes, not starting notes',()=>{const d=new EverydayLife();d.tick(8);const s=d.scenes(ctx).find(s=>s.id==='notes'),id=d.started(s);assert(!d.scenes(ctx).some(s=>s.id==='cold-tea'));d.completed(s,id,1);assert(d.scenes(ctx).some(s=>s.id==='cold-tea'));assert(!d.completed(s,id,1));assert.equal(d.counts.notes,1)});
test('Learned usual changes the next conversation',()=>{const d=new EverydayLife(),s=d.scenes(ctx).find(s=>s.id==='usual');assert.equal(s.title,'Barbara learns Lucresia’s usual');d.completed(s,'a',1);assert.equal(d.scenes(ctx).find(s=>s.id==='usual').title,'Barbara remembers')});
test('Post-match conversation quotes actual score and respects consumed result',()=>{const d=new EverydayLife(),c={...ctx,match:{id:'match-8',winner:'leo',score:{mika:1,leo:3}}},s=d.scenes(c).find(s=>s.id==='score-talk');assert(s.beats.some(b=>b.line?.includes('Lucresia 1, Leo 3')));d.completed(s,'a',1,'match-8');assert(!d.scenes(c).some(s=>s.id==='score-talk'))});
test('Rain and closing scenes require their world conditions',()=>{const d=new EverydayLife();assert(!d.scenes(ctx).some(s=>s.id==='rain'||s.id==='closing'));assert(d.scenes({...ctx,weather:'rain',minute:1150}).some(s=>s.id==='rain'));assert.equal(d.choose({...ctx,minute:1400}),null)});
test('A completed scene gets breathing room and a repetition cooldown',()=>{const d=new EverydayLife();d.tick(8);const s=d.choose(ctx);d.completed(s,'a',1);assert.equal(d.choose(ctx),null);d.tick(40);assert.notEqual(d.choose(ctx).id,s.id)});
test('Followups, learned rituals and bounded history survive save',()=>{const d=new EverydayLife(),s=d.scenes(ctx).find(s=>s.id==='notes');for(let i=0;i<45;i++)d.completed(s,'id'+i,1);const copy=new EverydayLife();copy.load(JSON.parse(JSON.stringify(d.serialize())));assert.equal(copy.history.length,32);assert(copy.pending.includes('cold-tea'));assert.equal(copy.counts.notes,45);assert.equal(copy.sequence,d.sequence)});
test('Invalid everyday state fails visibly instead of propagating NaN',()=>{assert.throws(()=>new EverydayLife().load({time:NaN,next:0,sequence:0,history:[],pending:[]}))});
test('v13 saves migrate unchanged and newly written envelopes use schema 7',()=>{assert.equal(CURRENT_SAVE_VERSION,7);const s={clock:{minutes:600,day:2,speed:1,paused:false},coins:17,mikaProgress:44,player:{x:0,z:0},relationships:{}};assert.equal(migrateGameSave(5,s).coins,17);assert.equal(new SaveSystem().version,7)});
test('An everyday caption has no wall-clock expiry while the simulation is paused',()=>{
 const oldWindow=globalThis.window,oldDocument=globalThis.document;let timers=0;
 const elements=new Map();globalThis.document={getElementById:id=>{if(!elements.has(id))elements.set(id,{textContent:'',classList:{add(){},remove(){}}});return elements.get(id)}};globalThis.window={setTimeout:()=>{timers++;return 1}};
 try{HUD.prototype.showSpeech.call({},'Barbara','The tea can wait.',0);assert.equal(timers,0);assert.equal(elements.get('speechText').textContent,'The tea can wait.');HUD.prototype.showSpeech.call({},'Leo','A normal brief comment.',3500);assert.equal(timers,1);}finally{globalThis.window=oldWindow;globalThis.document=oldDocument;}
});
test('Cafe-to-bonsai circulation does not cut through the playing area',()=>{
 const w=new World(),start=destinations.cafe,path=w.nav.clubPath(start,destinations.bonsai);assert(path.length);let previous=start;
 for(const p of path){for(let t=0;t<=1;t+=.025){const v=Vec3.lerp(previous,p,t);assert(!(v.x>-3.7&&v.x<5.7&&v.z>-6.5&&v.z<6.5),'Crossed playing area');}previous=p;}
 assert(w.nav.clubPath(destinations.courtSouth,destinations.cafe).length,'Player cannot leave court');
});
console.log(`${n} everyday-life checks passed.`);
