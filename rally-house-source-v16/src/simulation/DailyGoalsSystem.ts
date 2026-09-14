export type GoalKind='greet'|'coach'|'matcha'|'decorate'|'watch';
export interface DailyGoal {kind:GoalKind;label:string;done:boolean;reward:number}
export interface DailyGoalsSave {day:number;goals:DailyGoal[];claimed:boolean}
const templates:Record<GoalKind,{label:string;reward:number}>={
  greet:{label:'Say hello to someone',reward:4},coach:{label:'Coach one focused block',reward:8},matcha:{label:'Make a matcha',reward:4},decorate:{label:'Add one cozy detail',reward:6},watch:{label:'Watch a rally for a moment',reward:4}
};
const rotations:GoalKind[][]=[['greet','coach','matcha'],['greet','decorate','watch'],['coach','matcha','watch'],['greet','coach','decorate']];
export class DailyGoalsSystem {
  day=1;goals:DailyGoal[]=[];claimed=false;
  constructor(day=1){this.reset(day)}
  reset(day:number){this.day=day;this.claimed=false;this.goals=rotations[(day-1)%rotations.length].map(kind=>({kind,...templates[kind],done:false}));}
  ensureDay(day:number){if(day!==this.day)this.reset(day)}
  record(kind:GoalKind){const g=this.goals.find(x=>x.kind===kind);if(g)g.done=true;}
  get complete(){return this.goals.every(g=>g.done)}
  get doneCount(){return this.goals.filter(g=>g.done).length}
  claim(){if(!this.complete||this.claimed)return 0;this.claimed=true;return this.goals.reduce((s,g)=>s+g.reward,0);}
  nextLabel(){return this.goals.find(g=>!g.done)?.label??'The rest of the day is yours';}
  serialize():DailyGoalsSave{return {day:this.day,goals:this.goals.map(g=>({...g})),claimed:this.claimed}}
  load(s?:DailyGoalsSave){if(!s)return;this.day=s.day;this.goals=(s.goals||[]).map(g=>({...g}));this.claimed=!!s.claimed;if(!this.goals.length)this.reset(this.day)}
}
