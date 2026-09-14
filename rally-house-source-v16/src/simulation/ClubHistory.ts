export interface MatchRecord {id:string;day:number;winner:string;score:Record<string,number>;longest:number;contacts:number;errors:Record<string,number>}
export interface Intention {id:string;person:string;kind:'rematch'|'practice'|'cafe';notBefore:number;text:string;}
export interface ClubHistorySave {matches:MatchRecord[];intentions:Intention[];firstMikaWin:boolean;breakthrough:boolean;nextSocial:number;nextObject:number}
export class ClubHistory {
  matches:MatchRecord[]=[];intentions:Intention[]=[];firstMikaWin=false;breakthrough=false;nextSocial=0;nextObject=0;
  addIntention(i:Intention){this.intentions=this.intentions.filter(v=>v.id!==i.id);this.intentions.push(i);this.intentions=this.intentions.slice(-8);}
  record(match:MatchRecord){
    if(this.matches.some(m=>m.id===match.id))return false;
    this.matches.unshift(match);this.matches=this.matches.slice(0,24);
    const first=match.winner==='mika'&&!this.firstMikaWin;if(first)this.firstMikaWin=true;
    this.addIntention({id:'rematch',person:match.winner==='mika'?'leo':'mika',kind:'rematch',notBefore:(match.day+1)*1440+540,text:match.winner==='mika'?'Leo wants another try tomorrow.':'Lucresia wants another chance with Leo tomorrow.'});
    this.addIntention({id:'after-court',person:'nia',kind:'cafe',notBefore:match.day*1440,text:'Barbara is keeping a place for a post-court break.'});return first;
  }
  serialize():ClubHistorySave{return JSON.parse(JSON.stringify({matches:this.matches,intentions:this.intentions,firstMikaWin:this.firstMikaWin,breakthrough:this.breakthrough,nextSocial:this.nextSocial,nextObject:this.nextObject}));}
  load(s?:ClubHistorySave){if(!s)return;Object.assign(this,s);this.matches=this.matches.slice(0,24);this.intentions=this.intentions.slice(-8);}
}
