export interface ShotEvidence {who:string;stroke:string;preparation:number;spacing:number;recovery:number;clean:boolean}
export type Cue='preparation'|'spacing'|'recovery'|'rhythm';
export const cueFor=(key:string):Cue=>key==='movement'?'recovery':key==='crosscourt'?'rhythm':key==='spacing'?'spacing':'preparation';
export function summarize(shots:ShotEvidence[]){
  const n=shots.length;const avg=(key:'preparation'|'spacing'|'recovery')=>n?shots.reduce((v,s)=>v+s[key],0)/n:0;
  return {count:n,late:shots.filter(s=>s.preparation<.65).length,clean:shots.filter(s=>s.clean).length,preparation:avg('preparation'),spacing:avg('spacing'),recovery:avg('recovery')};
}
export class CoachingEvidence {
  recent:ShotEvidence[]=[];before:ShotEvidence[]=[];reps:ShotEvidence[]=[];cue:Cue='preparation';practicing=false;
  observe(s:ShotEvidence){if(s.who!=='mika'||s.stroke==='serve')return;this.recent.push({...s});this.recent=this.recent.slice(-16);if(this.practicing&&this.reps.length<8)this.reps.push({...s});}
  begin(cue:Cue){this.cue=cue;this.before=this.recent.slice(-8);this.reps=[];this.practicing=false;}
  get complete(){return this.reps.length===8;}
  result(){
    const before=summarize(this.before),after=summarize(this.reps);
    const quality=this.cue==='rhythm'?after.clean/Math.max(1,after.count):after[this.cue];
    const prior=this.cue==='rhythm'?before.clean/Math.max(1,before.count):before[this.cue];
    const gain=this.complete&&after.clean>=4&&quality>=.45?Math.max(1,Math.min(5,Math.round(1+quality*2+Math.max(0,quality-prior)*3))):0;
    return {before,after,gain,breakthrough:this.complete&&before.count>=6&&before.late>=3&&this.cue==='preparation'&&after.late<=2&&after.clean>=6};
  }
}
