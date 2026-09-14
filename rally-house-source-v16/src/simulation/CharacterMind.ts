import {clamp,Vec3} from '../rendering/Math3D.js';
import type {LifeScene,MemberId} from './EverydayLife.js';
import type {Relationship} from './RelationshipSystem.js';

export const MEMBERS:MemberId[]=['coach','mika','leo','nia'];
export type Motive='rest'|'practice'|'advice'|'company'|'care'|'reflect'|'gear'|'witness'|'celebrate'|'challenge';
export interface InnerState {energy:number;confidence:number;social:number;practice:number;comfort:number;tone:number;}
export interface MindEvent {id:string;kind:'match'|'lesson'|'move';subject:MemberId;winner?:string;day:number;at:number;place:string;detail:string;importance:number;witnesses:MemberId[];pending:MemberId[];}
export interface PersonalMemory {id:string;person:MemberId;topic:string;place:string;people:MemberId[];day:number;importance:number;detail:string;memoryClass?:'foundational'|'major'|'ordinary';count?:number;}
export interface Possession {id:string;owner:MemberId;kind:'cup'|'notebook'|'racket'|'wateringCan';uses:number;lastPlace:string;}
export interface MindSave {time:number;states:Record<MemberId,InnerState>;events:MindEvent[];memories:PersonalMemory[];receipts:string[];recent:{scene:string;pair:string;place:string;motif:string;at:number}[];rituals:Record<string,number>;culture:Record<'training'|'social'|'calm'|'competition'|'care',number>;philosophy:Record<string,number>;possessions:Possession[];}
export interface MindContext {day:number;minute:number;weather:string;free:Set<string>;positions:Record<string,Vec3>;schedule:Record<string,string>;intentions:{person:string;kind:string;notBefore:number}[];relationship:(a:string,b:string)=>Relationship;favorite:(person:string,object?:string)=>boolean;available:(s:LifeScene)=>boolean;}
export interface Utility {scene:string;person:string;total:number;factors:Record<string,number>;}
const BASE:Record<MemberId,InnerState>={
 coach:{energy:.72,confidence:.82,social:.36,practice:.62,comfort:.75,tone:.65},
 mika:{energy:.81,confidence:.54,social:.52,practice:.83,comfort:.58,tone:.65},
 leo:{energy:.78,confidence:.75,social:.47,practice:.74,comfort:.64,tone:.68},
 nia:{energy:.72,confidence:.78,social:.82,practice:.22,comfort:.82,tone:.75}
};
const TRAITS:Record<MemberId,Partial<Record<Motive,number>>>={coach:{reflect:.34,advice:.28,rest:.18,witness:.26},mika:{practice:.36,advice:.30,celebrate:.17},leo:{gear:.38,challenge:.28,practice:.21},nia:{care:.52,company:.32,witness:.30,rest:.10}};
const MOTIVES:Record<string,Motive>={grip:'gear',cups:'care',notes:'reflect',counting:'practice',bonsai:'company',usual:'company','gear-advice':'advice','small-win':'advice','bench-room':'rest',closing:'care','cold-tea':'care','score-talk':'company',rain:'rest'};
export const motiveFor=(s:LifeScene):Motive=> (s.motive as Motive)??MOTIVES[s.id]??'company';
const pairOf=(people:string[])=>[...people].sort().join('|');
const finiteState=(s:InnerState)=>['energy','confidence','social','practice','comfort','tone'].every(k=>typeof s?.[k as keyof InnerState]==='number'&&Number.isFinite(s[k as keyof InnerState])&&s[k as keyof InnerState]>=0&&s[k as keyof InnerState]<=1);

/** Small hidden state; it suggests actions, never moves actors or awards activity outcomes. */
export class CharacterMind {
 time=0;states:Record<MemberId,InnerState>=structuredClone(BASE);events:MindEvent[]=[];memories:PersonalMemory[]=[];receipts:string[]=[];
 recent:MindSave['recent']=[];rituals:Record<string,number>={};culture:MindSave['culture']={training:.2,social:.2,calm:.2,competition:.2,care:.2};philosophy:Record<string,number>={};
 possessions:Possession[]=[{id:'june-notebook',owner:'coach',kind:'notebook',uses:0,lastPlace:'carried'},{id:'june-cup',owner:'coach',kind:'cup',uses:0,lastPlace:'carried'},{id:'mika-racket',owner:'mika',kind:'racket',uses:0,lastPlace:'carried'},{id:'leo-racket',owner:'leo',kind:'racket',uses:0,lastPlace:'carried'},{id:'nia-can',owner:'nia',kind:'wateringCan',uses:0,lastPlace:'carried'}];
 explanations:Utility[]=[];chosen:Utility|null=null;
 tick(dt:number,activity:Record<string,string>){
  if(!Number.isFinite(dt)||dt<=0)return;dt=Math.min(dt,60);this.time+=dt;
  for(const key of Object.keys(this.culture) as (keyof MindSave['culture'])[])this.culture[key]=.15+(this.culture[key]-.15)*Math.exp(-dt/2400);
  for(const id of MEMBERS){const s=this.states[id],a=activity[id]??'',effort=/match|lesson|practice|walk|shuffle/.test(a),rest=/rest|reflect|drink|sit/.test(a);
   s.energy=clamp(s.energy+dt*(effort?-.0011:rest?.0022:.00055),0,1);
   s.social=clamp(s.social+dt*(/company|tea/.test(a)?-.002:.0005),0,1);
   s.practice=clamp(s.practice+dt*(/practice|lesson|match/.test(a)?-.0012:.00035),0,1);
   for(const key of ['confidence','comfort','tone'] as const)s[key]+=(BASE[id][key]-s[key])*(1-Math.exp(-dt/1100));
  }
 }
 score(scene:LifeScene,c:MindContext):Utility{
  const actor=scene.people[0],s=this.states[actor],m=motiveFor(scene),pair=pairOf(scene.people),partner=scene.people[1],r=partner?c.relationship(actor,partner):null;
  const rest=m==='rest'||m==='reflect',training=m==='practice'||m==='challenge',social=!!partner;
  const recent=this.recent.filter(h=>this.time-h.at<300),ageWeight=(at:number)=>Math.max(0,1-(this.time-at)/300);
  const f:Record<string,number>={opportunity:.22,'shared time':social?.20:0,personality:TRAITS[actor][m]??.04};
  f.energy=rest?(1-s.energy)*.85:training?(s.energy-.45)*.6:0;
  f['practice drive']=training?s.practice*.65:m==='gear'?s.practice*.28:0;
  f.confidence=m==='challenge'?(s.confidence-.5)*1.25:m==='advice'?(1-s.confidence)*.85:m==='practice'&&actor==='mika'?(1-s.confidence)*.32:m==='gear'&&actor==='leo'?(1-s.confidence)*.4:0;
  f['social appetite']=social?(s.social-.35)*.55:rest?(1-s.social)*.12:0;
  f['emotional tone']=rest?(1-s.tone)*.18:m==='challenge'?(s.tone-.5)*.18:0;
  f.comfort=rest?(1-s.comfort)*.3:0;
  f.relationship=r?(m==='advice'?r.trust*.008:m==='challenge'?r.rivalry*.009:r.warmth*.006+r.familiarity*.002):0;
  f['live court']=scene.family==='watch-court'?.6:0;f['care object']=scene.objectId&&m==='care'?.25:0;
  f['authored performance']=scene.family?0:.15;
  f.schedule=c.schedule[actor]===scene.place?.24:0;
  f.intention=c.intentions.some(i=>i.person===actor&&i.notBefore<=c.day*1440+c.minute&&((i.kind==='practice'&&training)||(i.kind==='cafe'&&rest)))?.3:0;
  f.memory=scene.eventId&&this.events.some(e=>e.id===scene.eventId&&e.pending.includes(actor))?.72:0;
  f['favorite place']=scene.objectId&&c.favorite(actor,scene.objectId)?.30:0;
  f.weather=c.weather==='rain'?(rest||m==='company'?.18:training?-.08:0):0;
  f['time of day']=c.minute<660&&(training||m==='care'||m==='reflect')?.12:c.minute>1080&&(rest||social)?.12:0;
  f.culture=(training?this.culture.training*.13:rest?this.culture.calm*.13:social?this.culture.social*.13:m==='care'?this.culture.care*.13:0);
  const a=c.positions[actor],b=partner?c.positions[partner]:null;f.proximity=a&&b?Math.max(0,.16-Math.hypot(a.x-b.x,a.z-b.z)*.01):0;
  f['recent family']=-recent.filter(h=>h.scene===(scene.family??scene.id)).reduce((v,h)=>v+.24*ageWeight(h.at),0);
  f['recent pair']=social?-recent.filter(h=>h.pair===pair).reduce((v,h)=>v+.20*ageWeight(h.at),0):0;
  f['recent place']=-recent.filter(h=>h.place===scene.place).reduce((v,h)=>v+.09*ageWeight(h.at),0);
  f['recent motif']=-recent.filter(h=>h.motif===(scene.motif??scene.id)).reduce((v,h)=>v+.13*ageWeight(h.at),0);
  if(scene.ritual)f.ritual=this.rituals[scene.ritual]===c.day?-.65:.16+((c.day+actor.length)%3)*.035;
  const eligible=scene.people.every(id=>c.free.has(id))&&c.available(scene);
  return {scene:scene.id,person:actor,total:eligible?Object.values(f).reduce((a,b)=>a+b,0):-Infinity,factors:f};
 }
 rank(scenes:LifeScene[],c:MindContext){const scores=scenes.map(s=>({s,u:this.score(s,c)})).filter(v=>Number.isFinite(v.u.total)).sort((a,b)=>b.u.total-a.u.total||a.s.id.localeCompare(b.s.id));this.explanations=scores.slice(0,12).map(v=>v.u);this.chosen=scores[0]?.u??null;return scores;}
 challenge(id:MemberId,rivalry:number){const s=this.states[id];return .15+s.energy*.35+s.practice*.4+s.confidence*.6+rivalry*.002-(1-s.confidence)*(id==='mika'?.65:.25);}
 mood(id:MemberId){const s=this.states[id];return s.energy<.35?'Taking things gently':s.confidence<.42?'Finding their confidence':s.tone<.42?'A little out of sorts':s.practice>.8?'Keen to try again':s.social>.75?'In the mood for company':s.comfort>.8?'At home here':'Settling into the day';}
 reinforceCulture(key:keyof MindSave['culture'],weight:number){this.culture[key]=clamp(this.culture[key]+(1-this.culture[key])*clamp(weight,0,1),0,1);}
 remember(m:PersonalMemory){
  if(this.memories.some(e=>e.id===m.id))return;
  const foundation=m.importance>=.95&&['match','lesson','witness'].includes(m.topic)&&!this.memories.some(e=>e.person===m.person&&e.topic===m.topic&&e.memoryClass==='foundational');
  m={...m,memoryClass:foundation?'foundational':m.importance>=.95?'major':'ordinary',count:m.count??1};
  if(m.importance<.7){const same=this.memories.filter(e=>e.importance<.7&&e.person===m.person&&e.topic===m.topic&&e.place===m.place&&[...e.people].sort().join('|')===[...m.people].sort().join('|'));
   if(same.length>=2||same.some(e=>(e.count??1)>=3)){m.count=(m.count??1)+same.reduce((n,e)=>n+(e.count??1),0);m.detail=m.topic==='company'?'Often made time for company here.':m.topic==='rest'?'Often took a quiet break here.':m.topic==='practice'?'Returned here to rehearse the small things.':m.detail;this.memories=this.memories.filter(e=>!same.includes(e));}
  }
  this.memories.unshift(m);this.retain();
 }
 private retain(){
  const foundations=this.memories.filter(m=>m.memoryClass==='foundational').slice(0,12);
  const major=this.memories.filter(m=>m.memoryClass!=='foundational'&&m.importance>=.95).sort((a,b)=>b.day-a.day).slice(0,24);
  const ordinary=this.memories.filter(m=>m.importance<.95).sort((a,b)=>b.day-a.day).slice(0,48);
  this.memories=[...foundations,...major,...ordinary].sort((a,b)=>b.day-a.day);
  this.events=this.events.slice(0,48);
 }
 recall(person:MemberId,query:{topic?:string;place?:string;partner?:MemberId}={}){return this.memories.filter(m=>m.person===person&&(!query.topic||m.topic===query.topic)&&(!query.place||m.place===query.place)&&(!query.partner||m.people.includes(query.partner))).sort((a,b)=>b.importance-a.importance||b.day-a.day);}
 complete(scene:LifeScene,id:string,day:number){
  if(this.receipts.includes(id))return false;this.receipts.push(id);this.receipts=this.receipts.slice(-512);
  const motive=motiveFor(scene),place=scene.objectId??scene.place;
  for(const person of scene.people){const s=this.states[person];s.energy=clamp(s.energy+(['rest','reflect','company'].includes(motive)?.1:0),0,1);s.social=clamp(s.social-(scene.people.length>1?.14:0),0,1);s.comfort=clamp(s.comfort+.04,0,1);s.tone=clamp(s.tone+.035,0,1);
   if(motive==='practice'||motive==='advice'){s.practice=clamp(s.practice-.13,0,1);s.confidence=clamp(s.confidence+.035,0,1);}
   this.remember({id:`${id}:${person}`,person,topic:motive,place,people:[...scene.people],day,importance:scene.eventId?.78:.4,detail:scene.memory});
   for(const p of this.possessions.filter(p=>p.owner===person&&((p.kind==='notebook'&&motive==='reflect')||(p.kind==='cup'&&motive==='rest')||(p.kind==='wateringCan'&&motive==='care')||(p.kind==='racket'&&['practice','gear','advice'].includes(motive))))){p.uses++;p.lastPlace=place;}
  }
  if(scene.eventId){const e=this.events.find(e=>e.id===scene.eventId);if(e)e.pending=e.pending.filter(p=>p!==scene.people[0]);}
  if(scene.ritual)this.rituals[scene.ritual]=day;
  this.recent.unshift({scene:scene.family??scene.id,pair:pairOf(scene.people),place:scene.place,motif:scene.motif??scene.id,at:this.time});this.recent=this.recent.slice(0,32);
  const culture=motive==='practice'||motive==='advice'?'training':motive==='care'?'care':scene.people.length>1?'social':'calm';this.reinforceCulture(culture,.025);return true;
 }
 recordEvent(event:Omit<MindEvent,'at'|'witnesses'|'pending'>,positions:Record<string,Vec3>,free:Set<string>,visible:(a:Vec3,b:Vec3)=>boolean){
  if(this.events.some(e=>e.id===event.id)||this.memories.some(m=>m.id===event.id))return [];
  const subject=positions[event.subject],witnesses=MEMBERS.filter(id=>id!==event.subject&&!(event.kind==='match'&&['mika','leo'].includes(id))&&free.has(id)&&subject&&positions[id]&&Vec3.sub(subject,positions[id]).len()<=7.5&&visible(positions[id],subject));
  const pending=event.kind==='match'?[...new Set<MemberId>(['mika','leo',...witnesses])]:event.kind==='move'?[event.subject]:[event.subject,...witnesses];
  this.events.unshift({...event,at:this.time,witnesses,pending});this.events=this.events.slice(0,48);
  this.remember({id:event.id,person:event.subject,topic:event.kind,place:event.place,people:event.kind==='match'?['mika','leo']:[event.subject],day:event.day,importance:event.importance,detail:event.detail});
  if(event.kind==='match'){for(const person of ['mika','leo'] as MemberId[])if(person!==event.subject)this.remember({id:`${event.id}:participant:${person}`,person,topic:'match',place:event.place,people:['mika','leo'],day:event.day,importance:event.importance,detail:event.detail});for(const id of ['mika','leo'] as MemberId[]){const s=this.states[id],won=event.winner===id,draw=event.winner==='draw';s.energy=clamp(s.energy-.12,0,1);s.confidence=clamp(s.confidence+(draw?.015:won?.13:id==='mika'?-.12:-.07),0,1);s.practice=clamp(s.practice+(won?.02:.16),0,1);s.tone=clamp(s.tone+(draw?0:won?.12:-.12),0,1);}this.reinforceCulture('competition',.045);}
  if(event.kind==='lesson'){this.states.mika.confidence=clamp(this.states.mika.confidence+.06,0,1);this.states.mika.practice=clamp(this.states.mika.practice-.1,0,1);this.reinforceCulture('training',.045);}
  for(const witness of witnesses)this.remember({id:`${event.id}:seen:${witness}`,person:witness,topic:'witness',place:event.place,people:[witness,event.subject],day:event.day,importance:.72,detail:`Saw: ${event.detail}`});
  return witnesses;
 }
 coaching(cue:string,gain:number){this.philosophy[cue]=(this.philosophy[cue]??0)+1;if(gain>0)this.states.mika.confidence=clamp(this.states.mika.confidence+.02,0,1);}
 cultureDescription(){const [key,value]=Object.entries(this.culture).sort((a,b)=>b[1]-a[1])[0];if(value<.28)return 'Still finding its rhythm.';return ({training:'A place to work patiently at the small things.',social:'A club where a short break tends to become a conversation.',calm:'People are making room for quiet moments.',competition:'Friendly competition is becoming part of the club.',care:'The little details are becoming shared rituals.'} as Record<string,string>)[key];}
 serialize():MindSave{return structuredClone({time:this.time,states:this.states,events:this.events,memories:this.memories,receipts:this.receipts,recent:this.recent,rituals:this.rituals,culture:this.culture,philosophy:this.philosophy,possessions:this.possessions});}
 load(s?:MindSave){if(!s)return;const fail=()=>{throw Error('Character-life save is invalid. Storage has been left untouched.');};
  const record=(v:unknown)=>!!v&&typeof v==='object'&&!Array.isArray(v);
  if(!record(s.states)||!record(s.culture)||!record(s.philosophy)||!record(s.rituals))fail();
  if(!Number.isFinite(s.time)||s.time<0||!MEMBERS.every(id=>finiteState(s.states?.[id]))||!Array.isArray(s.events)||!Array.isArray(s.memories)||!Array.isArray(s.receipts)||!s.receipts.every(v=>typeof v==='string')||!Array.isArray(s.recent)||!s.culture||!s.philosophy||!s.rituals||!Array.isArray(s.possessions))fail();
  for(const key of ['training','social','calm','competition','care'] as const)if(!Number.isFinite(s.culture[key])||s.culture[key]<0||s.culture[key]>1)fail();
  if(!Object.values({...s.philosophy,...s.rituals}).every(v=>Number.isFinite(v)&&v>=0))fail();
  for(const e of s.events)if(!e||typeof e.id!=='string'||!['match','lesson','move'].includes(e.kind)||!MEMBERS.includes(e.subject)||!Array.isArray(e.pending)||!Array.isArray(e.witnesses)||![...e.pending,...e.witnesses].every(p=>MEMBERS.includes(p))||![e.at,e.day,e.importance].every(Number.isFinite)||typeof e.detail!=='string'||typeof e.place!=='string'||(e.kind==='match'&&!['mika','leo','draw'].includes(e.winner??'')))fail();
  for(const m of s.memories)if(!m||typeof m.id!=='string'||!MEMBERS.includes(m.person)||!Array.isArray(m.people)||!m.people.every(p=>MEMBERS.includes(p))||![m.day,m.importance].every(Number.isFinite)||![m.topic,m.place,m.detail].every(x=>typeof x==='string'))fail();
  for(const m of s.memories)if((m.memoryClass!==undefined&&!['foundational','major','ordinary'].includes(m.memoryClass))||(m.count!==undefined&&(!Number.isSafeInteger(m.count)||m.count<1)))fail();
  for(const r of s.recent)if(!r||![r.scene,r.pair,r.place,r.motif].every(x=>typeof x==='string')||!Number.isFinite(r.at))fail();
  for(const p of s.possessions)if(!p||typeof p.id!=='string'||!MEMBERS.includes(p.owner)||!['cup','notebook','racket','wateringCan'].includes(p.kind)||!Number.isFinite(p.uses)||p.uses<0||typeof p.lastPlace!=='string')fail();
  const clean=structuredClone(s);for(const key of Object.keys(this.serialize()) as (keyof MindSave)[])(this as unknown as Record<string,unknown>)[key]=clean[key];this.receipts=this.receipts.slice(-512);this.recent=this.recent.slice(0,32);
  const old=[...this.memories].sort((a,b)=>a.day-b.day);this.memories=[];for(const m of old)this.remember(m);this.retain();
 }
}
