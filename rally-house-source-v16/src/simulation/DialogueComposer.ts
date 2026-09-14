import type {MatchRecord} from './ClubHistory.js';
import type {PersonalMemory} from './CharacterMind.js';
export interface DialogueContext {core:string;speaker:string;partner?:string;topic:string;now:number;relationship:{warmth:number;familiarity:number;trust:number;rivalry:number};match?:MatchRecord;memory?:PersonalMemory;favoriteId?:string;}
export interface ComposedLine {text:string;evidence:string[];key:string;}
/** Only opt-in, semantically compatible clauses; committed when spoken, never during candidate scoring. */
export class DialogueComposer {
 private recent:{key:string;at:number}[]=[];
 compose(c:DialogueContext):ComposedLine{
  let clause='',evidence:string[]=[];
  if(c.topic==='challenge'&&c.match&&['mika','leo'].includes(c.speaker)&&c.partner&&['mika','leo'].includes(c.partner)&&Number.isFinite(c.match.score.mika)&&Number.isFinite(c.match.score.leo)){
   clause=` The last one was ${c.match.score.mika}–${c.match.score.leo}. I kept the score.`;evidence=[c.match.id];
  }else if(c.topic==='company'&&c.memory?.person===c.speaker&&c.partner&&c.memory.people.some(p=>p===c.partner)&&c.memory.topic==='company'&&/cup|matcha|tea\b/i.test(c.memory.detail)){
   clause=' That last cup was a good idea.';evidence=[c.memory.id];
  }else if(c.topic==='company'&&c.favoriteId){clause=' There’s room at the familiar bench.';evidence=[c.favoriteId];}
  else if(c.topic==='company'&&c.relationship.familiarity>=35&&c.relationship.warmth>=40)clause=' No hurry.';
  const key=[c.speaker,c.partner,c.topic,clause].join('|');if(this.recent.some(r=>r.key===key&&c.now-r.at<360)){clause='';evidence=[];}
  return {text:c.core+clause,evidence,key};
 }
 commit(line:ComposedLine,now:number){this.recent=this.recent.filter(r=>now-r.at<360);this.recent.push({key:line.key,at:now});this.recent=this.recent.slice(-32);}
}
