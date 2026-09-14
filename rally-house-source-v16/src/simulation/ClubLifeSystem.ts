export interface ClubMoment {key:string;title:string;text:string;speakerId:string;targetId:string;destination:string;duration:number}
export interface ClubLifeSave {seen:string[];memories:string[]}
const beats=[
  {minute:575,title:'A clean one',text:'Leo catches Lucresia’s last forehand and gives a tiny racket tap of approval.',speakerId:'leo',targetId:'mika',destination:'courtBench'},
  {minute:620,title:'The usual',text:'Barbara has Coach Contessa’s tea ready before Contessa asks.',speakerId:'nia',targetId:'coach',destination:'cafe'},
  {minute:665,title:'Ten balls?',text:'Lucresia asks Leo for ten easy crosscourt balls. It quietly becomes twenty-seven.',speakerId:'mika',targetId:'leo',destination:'courtBench'},
  {minute:710,title:'Bonsai consultation',text:'Leo stands beside the bonsai long enough that Barbara asks whether it fixed his footwork.',speakerId:'nia',targetId:'leo',destination:'bonsai'},
  {minute:760,title:'One useful cue',text:'Contessa writes one sentence from the morning on the club board and leaves it there.',speakerId:'coach',targetId:'mika',destination:'clubBoard'}
] as const;
export class ClubLifeSystem {
  private seen=new Set<string>(); memories:string[]=[];
  update(day:number,minute:number){for(let i=0;i<beats.length;i++){const b=beats[(i+day-1)%beats.length],key=`${day}:${b.minute}`;if(minute>=b.minute&&minute<b.minute+2&&!this.seen.has(key)){this.seen.add(key);this.memories.unshift(`Day ${day} · ${b.title}: ${b.text}`);this.memories=this.memories.slice(0,18);return {key,title:b.title,text:b.text,speakerId:b.speakerId,targetId:b.targetId,destination:b.destination,duration:9} as ClubMoment;}}return null;}
  addMemory(day:number,text:string){const line=`Day ${day} · ${text}`;this.memories.unshift(line);this.memories=[...new Set(this.memories)].slice(0,18)}
  serialize():ClubLifeSave{return {seen:[...this.seen],memories:[...this.memories]}}
  load(s?:ClubLifeSave){if(!s)return;this.seen=new Set(s.seen||[]);this.memories=s.memories||[];}
}
