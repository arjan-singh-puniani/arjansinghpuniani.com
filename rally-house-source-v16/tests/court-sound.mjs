import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {simulation} from '../qa/sim-harness.mjs';
import {Vec3} from '../dist/rendering/Math3D.js';
import {COURT} from '../dist/tennis/CourtGeometry.js';
import {footstepSignal} from '../dist/core/FootstepSound.js';
import {AudioManager} from '../dist/core/AudioManager.js';
import {MatchInput} from '../dist/tennis/MatchInput.js';
import {CHAMPIONSHIP_OPPONENTS} from '../dist/tennis/ChampionshipOpponents.js';

// The shipped reaction is short, unclipped PCM and matches its recorded source manifest.
const reaction=fs.readFileSync(new URL('../assets/audio/opponent-doh.wav',import.meta.url)),credit=JSON.parse(fs.readFileSync(new URL('../assets/audio/provenance.json',import.meta.url)))[0];
assert(credit.sourceAudio.endsWith('/homer/doh1_y.wav'),'Keep the user-selected TV take A');
assert.equal(reaction.toString('ascii',0,4),'RIFF');assert.equal(reaction.readUInt16LE(20),1);assert.equal(reaction.readUInt16LE(22),1);assert.equal(reaction.readUInt16LE(34),16);
const samples=new Int16Array(reaction.buffer.slice(reaction.byteOffset+44,reaction.byteOffset+reaction.length)),seconds=samples.length/reaction.readUInt32LE(24);
assert(seconds>.65&&seconds<.8,'Retain the complete user-approved TV take A');assert(Math.max(...samples.map(Math.abs))<=26214,'The sample keeps headroom');assert.equal(samples[0],0);assert.equal(samples.at(-1),0);assert.equal(createHash('sha256').update(reaction).digest('hex'),credit.sha256);
{
 const originalFetch=globalThis.fetch;let requests=0;
 try{globalThis.fetch=async url=>{assert(new URL(url).pathname.endsWith('/assets/audio/opponent-doh.wav'));requests++;return new Response(reaction);};const audio=new AudioManager(),context={decodeAudioData:async data=>{assert.equal(data.byteLength,reaction.length);return {duration:seconds};}};await Promise.all([audio.prepareVoice(context,'doh'),audio.prepareVoice(context,'doh')]);assert.equal(requests,1,'One decoded reaction is shared by the cast');}
 finally{globalThis.fetch=originalFetch;}
}

let playerLandings=0,opponentLandings=0;
for(const hz of [30,60,120]){
 const g=simulation(),heard=[],expected=[];g.schedule.update=()=>{};g.quietLife=()=>{};
 const opponent=g.characters.find(c=>c.id==='mika');g.world.nav.courtReserved=()=>false;
 g.player.position.set(COURT.centerX,0,5);g.player.goTo(new Vec3(COURT.centerX,0,2));
 opponent.position.set(COURT.centerX,0,-5);opponent.goTo(new Vec3(COURT.centerX,0,-2));
 let frame=0;for(const c of [...g.characters,g.player]){
  const consume=c.consumeStepEvent.bind(c);c.consumeStepEvent=()=>{const landed=consume();if(landed){const p=c.analysisPose();assert(Math.min(p.footL.y,p.footR.y)<.111,'A step must coincide with ground support');expected.push({id:c.id,frame,surface:g.world.nav.onCourt(c.position)?'court':'tile'});}return landed;};
 }
 g.audio=new Proxy({shoe:(surface)=>heard.push({frame,surface})},{get:(o,k)=>o[k]??(()=>{})});
 for(frame=0;frame<hz*2;frame++)g.updateFixed(1/hz);
 assert.deepEqual(heard,expected.map(({frame,surface})=>({frame,surface})),'Every actor landing, including the player, reaches audio in the same simulation frame');
 playerLandings+=expected.filter(e=>e.id==='player').length;opponentLandings+=expected.filter(e=>e.id==='mika').length;
 const count=heard.length;g.clock.paused=true;g.updateFixed(1);assert.equal(heard.length,count,'Pause cannot synthesize footsteps');
}
assert(playerLandings>6&&opponentLandings>6);
const signatures=new Set();
for(const rate of [22050,44100,48000])for(const surface of ['court','tile'])for(const scuff of [false,true])for(let variant=0;variant<3;variant++){
 const data=footstepSignal(surface,scuff,variant,rate);assert(data.every(Number.isFinite));assert.equal(Math.abs(data[0]),0);assert(Math.max(...data.map(Math.abs))<=.800001);
 const energy=data.reduce((s,n)=>s+n*n,0),tail=data.slice(Math.floor(rate*.1)).reduce((s,n)=>s+n*n,0);assert(energy>0&&tail/energy<.02,'Short footsteps leave room for ball contact');signatures.add(data.slice(0,80).join(','));
}
assert.equal(signatures.size,36,'Floor, scuff and take vary the shoe material at each rate');

{
 const started=[],stopped=[];
 const context={state:'running',close:async()=>{},createGain:()=>({gain:{value:0},connect(){return this;},disconnect(){}}),createBufferSource:()=>{const node={connect(){return this;},disconnect(){},start(){started.push(this);},stop(){stopped.push(this);}};return node;}};
 const a=new AudioManager();a.ctx=context;a.voiceLoads.set('doh',Promise.resolve({}));
 assert(a.opponentMiss());await Promise.resolve();assert.equal(started.length,1);assert(!a.opponentMiss());assert(!a.opponentMiss());assert(!a.opponentMiss(),'Cooldown prevents rapid repeated reactions');
 a.volume=0;assert.equal(stopped.length,1,'Muting stops an active voice immediately');a.volume=.65;
 a.lastMissVoice=-Infinity;a.opponentMiss();a.opponentMiss();a.opponentMiss();await Promise.resolve();assert.equal(started.length,2);a.stopVoice();assert.equal(stopped.length,2);a.dispose();
 let complete;const pending=new AudioManager();pending.ctx=context;pending.voiceLoads.set('doh',new Promise(resolve=>complete=resolve));pending.opponentMiss();pending.stopVoice();complete({});await Promise.resolve();assert.equal(started.length,2,'A voice finishing loading after pause cannot play');pending.dispose();
 const g=simulation(),lines=[];g.championshipOpponentId='mika';g.matchInput=new MatchInput();g.championship={phase:'pointResult',resolvePoint(){}};g.audio={opponentMiss:()=>true,success(){}};g.ui={showSpeech:(...args)=>lines.push(args)};
 const match=g.createInteractiveMatch(g.characters.find(c=>c.id==='mika'),CHAMPIONSHIP_OPPONENTS.mika);match.resolvePoint('player','miss');match.resolvePoint('player','miss');assert.equal(lines.length,1);assert.deepEqual(lines[0].slice(1),["D'oh!",1300,true]);
 match.startPoint('player');match.resolvePoint('opponent','miss');assert.equal(lines.length,1,'The opponent does not react for the player’s error');
 match.startPoint('player');match.resolvePoint('player','winner');assert.equal(lines.length,2,'Failing to return a clean winner can also trigger the opponent reaction');
}
console.log('Court sound PASS: real player/opponent footfalls, floor-specific material, pause/mute, sparse voiced error reactions, caption fallback and point ownership.');
