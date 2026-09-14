import type {AnimState,EmotionState} from '../entities/Character.js';

export type MemberId='coach'|'mika'|'leo'|'nia';
export type Gesture='none'|'shrug'|'point'|'laugh'|'think'|'offer'|'inspect'|'nod';
export interface LifeBeat {seconds:number;speaker?:MemberId;line?:string;poses?:Partial<Record<MemberId,AnimState>>;gestures?:Partial<Record<MemberId,Gesture>>;emotions?:Partial<Record<MemberId,EmotionState>>;prop?:'cup'|'notebook'|'ball'|'wateringCan';effect?:'water'|'cup';}
export interface LifeScene {motive?:string;family?:string;motif?:string;ritual?:string;objectId?:string;eventId?:string;minInterval?:number;id:string;title:string;people:MemberId[];place:string;beats:LifeBeat[];memory:string;followup?:string;}
export interface LifeContext {free:Set<string>;minute:number;day:number;weather:string;match?:{id:string;winner:string;score:Record<string,number>};warmth:(a:string,b:string)=>number;hasBench:boolean;}
export interface LifeReceipt {id:string;scene:string;title:string;people:MemberId[];day:number;at:number;memory:string;interruptedBy?:string;place?:string;motif?:string;}
export interface EverydaySave {time:number;next:number;sequence:number;cooldowns:Record<string,number>;counts:Record<string,number>;history:LifeReceipt[];pending:string[];lastMatch:string;}
const beat=(seconds:number,speaker:MemberId,line:string,gesture:Gesture='none',pose:AnimState='talk'):LifeBeat=>({seconds,speaker,line,poses:{[speaker]:pose},gestures:{[speaker]:gesture}});

/** Authored opportunities, paced by availability and completed history. Game owns physical execution. */
export class EverydayLife {
  time=0;next=7;sequence=0;cooldowns:Record<string,number>={};counts:Record<string,number>={};history:LifeReceipt[]=[];pending:string[]=[];lastMatch='';
  private retentionAt=0;
  tick(dt:number){if(Number.isFinite(dt)&&dt>0)this.time+=dt;if(this.time>=this.retentionAt){this.retentionAt=this.time+60;for(const [key,until] of Object.entries(this.cooldowns))if(until<this.time&&/^(after-|witness-|try-cue-|find-|three-)/.test(key)){delete this.cooldowns[key];delete this.counts[key];}}}
  scenes(c:LifeContext):LifeScene[]{
    const knownTea=(this.counts['usual']??0)>0,close=c.warmth('nia','mika')>=24;
    const match=c.match,score=match?`Lucresia ${match.score.mika??0}, Leo ${match.score.leo??0}`:'';
    const scenes:LifeScene[]=[
      {id:'grip',title:'Leo changes absolutely nothing',people:['leo'],place:'stringing',beats:[beat(4,'leo','Just checking the grip.','inspect','watch'),{seconds:4,poses:{leo:'coachExplain'},gestures:{leo:'inspect'}},beat(4,'leo','No. The old one was right.','shrug')],memory:'Leo tested his grip, considered a change, and put it back exactly as it was.'},
      {id:'cups',title:'Barbara sets an extra cup',people:['nia'],place:'cafe',beats:[{seconds:4,poses:{nia:'watch'},gestures:{nia:'offer'},prop:'cup'},beat(4,'nia','An extra cup. Someone will say they don’t want one.','think'),beat(4,'nia','They always change their mind.','nod')],memory:'Barbara set out an extra cup before anyone asked.'},
      {id:'notes',title:'Contessa forgets her tea',people:['coach'],place:'cafeTable',beats:[{seconds:5,poses:{coach:'watch'},gestures:{coach:'inspect'},prop:'notebook'},beat(4,'coach','One more note. Then tea.','think'),{seconds:5,poses:{coach:'watch'},gestures:{coach:'inspect'},prop:'notebook'}],memory:'Contessa got caught up in her notes and left her tea untouched.',followup:'cold-tea'},
      {id:'counting',title:'Lucresia starts the count again',people:['mika'],place:'warmup',beats:[beat(4,'mika','Split. Turn. Set.','point','coachExplain'),{seconds:4,poses:{mika:'shuffle'}},beat(4,'mika','That one counts. Probably.','think'),{seconds:3,poses:{mika:'ready'},gestures:{mika:'nod'}}],memory:'Lucresia quietly rehearsed her footwork, then gave herself permission to count the imperfect rep.'},
      {id:'bonsai',title:'Leo asks the wrong expert',people:['leo','nia'],place:'bonsai',beats:[beat(4,'leo','Is it leaning toward the court?','point','watch'),beat(4,'nia','It’s a plant, Leo. It doesn’t have a favorite player.','shrug'),{seconds:2,poses:{leo:'watch',nia:'watch'}},beat(4,'leo','You can’t know that.','think'),{seconds:3,gestures:{nia:'laugh',leo:'nod'},poses:{nia:'talk',leo:'watch'}}],memory:'Leo tried to recruit the bonsai as a supporter. Barbara declined to speak for it.'},
      {id:'usual',title:knownTea?'Barbara remembers':'Barbara learns Lucresia’s usual',people:['nia','mika'],place:'cafe',beats:[{...beat(4,'nia',knownTea?'Your usual. I waited until you were off court.':'Matcha? I was about to make one.','offer'),prop:'cup',effect:'cup'},beat(4,'mika',knownTea?(close?'You even remembered the extra foam.':'You remembered. Thank you.'):'Yes. Extra foam, if that’s not annoying.','think'),beat(4,'nia',knownTea?'Some things are worth remembering.':'That is an extremely manageable request.','nod'),{seconds:4,poses:{mika:'drink',nia:'watch'},gestures:{nia:'nod'}}],memory:knownTea?'Barbara remembered Lucresia’s extra foam without being asked.':'Barbara learned that Lucresia likes extra foam. Lucresia stopped apologizing for asking.'},
      {id:'gear-advice',title:'Advice Leo almost takes',people:['coach','leo'],place:'stringing',beats:[beat(4,'leo','Do you think a different string would help?','inspect'),beat(4,'coach','Getting to the ball first would help.','point'),{seconds:2,poses:{leo:'watch',coach:'watch'}},beat(4,'leo','And after that?','shrug'),beat(4,'coach','Then we can have a very expensive conversation.','nod'),{seconds:3,gestures:{leo:'laugh',coach:'nod'}}],memory:'Leo asked Contessa about strings. She prescribed footwork, then allowed a future gear conversation.'},
      {id:'small-win',title:'Contessa notices the second try',people:['coach','mika'],place:'training',beats:[{seconds:4,poses:{mika:'shuffle',coach:'watch'}},beat(4,'mika','Still not quite right.','shrug'),beat(4,'coach','You reset without getting cross with yourself. I saw that.','nod'),{seconds:3,poses:{mika:'ready',coach:'watch'}},beat(4,'mika','Can that be the useful thing today?','think'),beat(3,'coach','Absolutely.','nod')],memory:'Contessa noticed Lucresia resetting calmly. They agreed that could be the useful thing for today.'},
      {id:'bench-room',followup:'bench-reconnect',title:'Making room, eventually',people:['mika','leo'],place:c.hasBench?'built-bench':'courtBench',beats:[beat(4,'mika','Are you saving that whole spot?','point'),beat(4,'leo','For my tactical thoughts.','think'),{seconds:2,poses:{mika:'watch',leo:'watch'}},beat(4,'mika','They can sit closer together.','shrug'),{seconds:4,gestures:{leo:'offer',mika:'laugh'},poses:{leo:'talk',mika:'watch'}}],memory:'Lucresia asked Leo to make room. He eventually found somewhere else for his tactical thoughts.'},
      {id:'closing',title:'The last cup takes two people',people:['nia','coach'],place:'cafe',beats:[beat(4,'nia','You can leave that. I’m closing up.','offer'),beat(4,'coach','I can manage one cup.','nod'),{seconds:3,poses:{coach:'drink',nia:'watch'}},beat(4,'nia','That is drinking it, Contessa.','point'),{seconds:3,gestures:{coach:'shrug',nia:'laugh'}}],memory:'Contessa volunteered to help Barbara with the last cup. Her first contribution was drinking it.'}
    ];
    if(this.pending.includes('bench-reconnect'))scenes.push({id:'bench-reconnect',title:'The tactical thoughts can share',people:['leo','mika'],place:'courtBench',beats:[beat(4,'leo','I left room for your tactical thoughts this time.','offer'),beat(4,'mika','They are very compact.','nod'),beat(4,'leo','Mine are learning.','shrug'),{seconds:5,poses:{leo:'watch',mika:'watch'},gestures:{mika:'laugh'}}],memory:'Leo made room before Lucresia had to ask. They let the joke do the apologizing.'});
    if(this.pending.includes('cold-tea'))scenes.push({id:'cold-tea',title:'Barbara rescues Contessa’s tea',people:['nia','coach'],place:'cafeTable',beats:[{...beat(4,'nia','This used to be hot.','offer'),prop:'cup'},beat(4,'coach','I was only writing one note.','think'),beat(4,'nia','You wrote on the back as well.','point'),{seconds:3,poses:{coach:'drink',nia:'watch'},effect:'cup'},beat(4,'coach','Thank you for keeping track of the important part.','nod')],memory:'Barbara brought Contessa back to her forgotten tea. Contessa finally put the notes down.'});
    if(match&&match.id!==this.lastMatch)scenes.push({id:'score-talk',title:match.winner==='draw'?'Nobody lost, apparently':'The score follows them off court',people:['mika','leo'],place:'courtBench',beats:[beat(4,'mika',`${score}. I’m remembering that.`, 'nod'),beat(4,'leo',match.winner==='draw'?'A draw. So technically, I remain undefeated.':match.winner==='mika'?'I’m calling that useful research.':'You made me work for the last one.','shrug'),beat(4,'mika',match.winner==='draw'?'So do I. This is a very successful rivalry.':match.winner==='mika'?'Put the result in your research notes.':'I’m keeping the good points. You can keep the score.','point'),{seconds:4,gestures:{leo:'laugh',mika:'nod'},poses:{leo:'talk',mika:'watch'}}],memory:`After ${score}, ${match.winner==='draw'?'Lucresia and Leo both claimed to remain undefeated.':'Lucresia and Leo found something different to keep from the match.'}`});
    if(c.weather==='rain')scenes.push({id:'rain',title:'The rain gets a review',people:['nia','leo'],place:'cafe',beats:[beat(4,'leo','Perfect tennis weather.','shrug'),beat(4,'nia','We play indoors.','point'),{seconds:3,poses:{leo:'watch',nia:'watch'}},beat(4,'leo','Exactly.','nod'),{seconds:4,poses:{nia:'drink',leo:'watch'}}],memory:'Leo praised the rain as perfect tennis weather. Barbara reminded him where the roof was.'});
    // Familiar rituals keep their shape, but a second visit acknowledges the first.
    const returning:Record<string,string[]>={
      grip:['Still the same grip.','Just making sure.'],
      cups:[knownTea?'Extra foam for Lucresia. That one I know.':'One spare cup. Same theory as before.','Someone always changes their mind.'],
      notes:['This is going to be a short note.'],
      counting:['Start again. A little slower.','That felt less rushed.'],
      bonsai:[match?'It watched the entire match.':'It’s leaning the other way now.','Try watering it instead of interviewing it.','I can do both.'],
      'gear-advice':['I have a very short equipment question.','Does the answer still start with your feet?','You remembered.','It was excellent advice.'],
      'cold-tea':['The notes are winning again.','Only on paper.','Then let the tea have a turn.','A very fair point.']
    };
    for(const scene of scenes){if((this.counts[scene.id]??0)>0&&returning[scene.id]){let i=0;for(const b of scene.beats)if(b.line)b.line=returning[scene.id][i++]??b.line;}}
    return scenes.filter(s=>s.id!=='closing'||c.minute>=1100);
  }
  choose(c:LifeContext,extra:LifeScene[]=[],rank?:(scenes:LifeScene[])=>LifeScene[],allowAfterHours=false):LifeScene|null{
    if(this.time<this.next||(!allowAfterHours&&(c.minute<495||c.minute>=1280)))return null;
    const eligible=[...this.scenes(c),...extra].filter(s=>s.people.every(id=>c.free.has(id))&&(this.cooldowns[s.id]??0)<=this.time);
    if(rank)return rank(eligible)[0]??null;
    const recent=this.history.slice(0,3);
    return this.scenes(c).filter(s=>s.people.every(id=>c.free.has(id))&&(this.cooldowns[s.id]??0)<=this.time).map(s=>({s,score:20-(this.counts[s.id]??0)*7-recent.filter(h=>h.people.some(id=>s.people.includes(id))).length*3+(s.id==='cold-tea'||s.id==='score-talk'?22:0)+(s.id==='rain'?10:0)+(s.id==='closing'?15:0)+s.people.reduce((sum,id)=>sum+(this.history.slice(0,5).some(h=>h.people.includes(id))?0:5),0)})).sort((a,b)=>b.score-a.score||a.s.id.localeCompare(b.s.id))[0]?.s??null;
  }
  started(scene:LifeScene){this.next=this.time+32;return `life-${++this.sequence}`;}
  failed(scene:LifeScene){this.cooldowns[scene.id]=this.time+25;this.next=Math.max(this.next,this.time+6);}
  completed(scene:LifeScene,id:string,day:number,matchId?:string,interruptedBy?:string){
    if(this.history.some(h=>h.id===id))return false;
    this.counts[scene.id]=(this.counts[scene.id]??0)+1;this.cooldowns[scene.id]=this.time+(scene.minInterval??220);this.next=Math.max(this.next,this.time+12);
    this.pending=this.pending.filter(p=>p!==scene.id);if(scene.followup&&!this.pending.includes(scene.followup))this.pending.push(scene.followup);
    if(scene.id==='score-talk'&&matchId)this.lastMatch=matchId;
    this.history.unshift({id,scene:scene.id,title:scene.title,people:[...scene.people],day,at:this.time,memory:scene.memory,interruptedBy,place:scene.place,motif:scene.motif??scene.id});this.history=this.history.slice(0,32);return true;
  }
  serialize():EverydaySave{return structuredClone({time:this.time,next:this.next,sequence:this.sequence,cooldowns:this.cooldowns,counts:this.counts,history:this.history,pending:this.pending,lastMatch:this.lastMatch});}
  load(s?:EverydaySave){
    if(!s)return;
    const record=(v:unknown)=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.values(v).every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0);
    if(![s.time,s.next,s.sequence].every(n=>Number.isFinite(n)&&n>=0)||!record(s.counts)||!record(s.cooldowns)||!Array.isArray(s.history)||!Array.isArray(s.pending)||!s.pending.every(p=>typeof p==='string')||typeof s.lastMatch!=='string'||!s.history.every(h=>h&&typeof h.id==='string'&&typeof h.scene==='string'&&typeof h.title==='string'&&typeof h.memory==='string'&&Number.isFinite(h.day)&&Number.isFinite(h.at)&&Array.isArray(h.people)&&h.people.every(p=>['coach','mika','leo','nia'].includes(p))))throw Error('Everyday-life save is invalid. Storage has been left untouched.');
    this.time=s.time;this.next=Math.max(s.next,s.time+5);this.sequence=s.sequence;this.counts={...s.counts};this.cooldowns={...s.cooldowns};this.history=structuredClone(s.history.slice(0,32));this.pending=s.pending.slice(0,4);this.lastMatch=s.lastMatch;
  }
}
