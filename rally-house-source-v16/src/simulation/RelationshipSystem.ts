import {relationshipTiers} from '../content/content.js';

export interface MemoryEvent {
  id:string;
  type:string;
  day:number;
  people:string[];
  tags:string[];
  sentiment:number;
  strength:number;
  detail:string;place?:string;subject?:string;
}

export interface Relationship {
  familiarity:number;
  warmth:number;
  trust:number;
  rivalry:number;
  memories:string[];
  events:MemoryEvent[];
}

export type InteractionType='greet'|'coach'|'rally'|'matcha'|'compliment'|'listen'|'help';

const fresh=():Relationship=>({familiarity:10,warmth:12,trust:10,rivalry:0,memories:[],events:[]});
const pairKey=(a:string,b:string)=>`@${[a,b].sort().join('|')}`;

export class RelationshipSystem {
  private rel=new Map<string,Relationship>();

  get(id:string){if(!this.rel.has(id))this.rel.set(id,fresh());return this.rel.get(id)!;}
  getBetween(a:string,b:string){const k=pairKey(a,b);if(!this.rel.has(k))this.rel.set(k,fresh());return this.rel.get(k)!;}
  label(id:string){const score=this.get(id).familiarity;let label=relationshipTiers[0].label;for(const t of relationshipTiers)if(score>=t.min)label=t.label;return label;}
  pairLabel(a:string,b:string){const score=this.getBetween(a,b).familiarity;let label=relationshipTiers[0].label;for(const t of relationshipTiers)if(score>=t.min)label=t.label;return label;}

  interact(id:string,type:InteractionType,day=1,detail=''){
    return this.apply(this.get(id),['player',id],type,day,detail);
  }

  interactBetween(a:string,b:string,type:InteractionType,day=1,detail=''){
    return this.apply(this.getBetween(a,b),[a,b],type,day,detail);
  }

  remember(id:string,event:Omit<MemoryEvent,'id'>){const r=this.get(id);this.pushEvent(r,event);return r;}
  rememberBetween(a:string,b:string,event:Omit<MemoryEvent,'id'>){const r=this.getBetween(a,b);this.pushEvent(r,event);return r;}

  recall(id:string,tag?:string){const events=this.get(id).events;return tag?events.find(e=>e.tags.includes(tag))??null:events[0]??null;}
  recallBetween(a:string,b:string,tag?:string){const events=this.getBetween(a,b).events;return tag?events.find(e=>e.tags.includes(tag))??null:events[0]??null;}

  behaviorBias(a:string,b:string){
    const r=this.getBetween(a,b);
    return {
      seekCompany:Math.min(1,(r.warmth*.55+r.familiarity*.35+r.trust*.10)/100),
      encouragement:Math.min(1,(r.warmth*.45+r.trust*.55)/100),
      competition:Math.min(1,(r.rivalry*.75+r.familiarity*.25)/100)
    };
  }

  load(data:Record<string,Relationship>){
    this.rel.clear();
    for(const [k,v] of Object.entries(data||{}))this.rel.set(k,{
      familiarity:v.familiarity??10,warmth:v.warmth??12,trust:v.trust??10,rivalry:v.rivalry??0,
      memories:v.memories??[],events:(v.events??[]).map(e=>({...e,people:e.people??[],tags:e.tags??[],sentiment:e.sentiment??0,strength:e.strength??.5,detail:e.detail??''}))
    });
  }
  serialize(){return Object.fromEntries(this.rel.entries());}

  private apply(r:Relationship,people:string[],type:InteractionType,day:number,detail:string){
    const gains:Record<InteractionType,[number,number,number,number]>={greet:[3,2,1,0],coach:[3,3,5,0],rally:[4,2,2,1],matcha:[5,6,2,0],compliment:[3,4,2,0],listen:[3,4,4,0],help:[4,4,5,0]};
    const g=gains[type];r.familiarity=Math.min(100,r.familiarity+g[0]);r.warmth=Math.min(100,r.warmth+g[1]);r.trust=Math.min(100,r.trust+g[2]);r.rivalry=Math.min(100,Math.max(0,r.rivalry+g[3]));
    const nice=detail||({greet:'said hello',coach:'worked through a lesson',rally:'shared a rally',matcha:'had matcha together',compliment:'shared a genuine compliment',listen:'made time to listen',help:'helped out around the club'} as Record<InteractionType,string>)[type];
    r.memories.unshift(`Day ${day} · ${nice}`);r.memories=[...new Set(r.memories)].slice(0,10);
    const tags:string[]=[type];if(type==='coach')tags.push('tennis','learning');if(type==='rally')tags.push('tennis','shared-court');if(type==='matcha')tags.push('social','ritual');
    this.pushEvent(r,{type,day,people,tags,sentiment:type==='rally'?.45:.75,strength:type==='greet'?.35:type==='coach'?.85:.65,detail:nice});
    return r;
  }

  private pushEvent(r:Relationship,event:Omit<MemoryEvent,'id'>){
    const id=`${event.day}:${event.type}:${event.people.join('-')}:${event.detail}`;
    r.events.unshift({id,...event});
    const dedup=new Map<string,MemoryEvent>();for(const e of r.events)if(!dedup.has(e.id))dedup.set(e.id,e);
    const all=[...dedup.values()],major=all.filter(e=>e.strength>=.95).slice(0,8);const ids=new Set(major.map(e=>e.id));r.events=[...major,...all.filter(e=>!ids.has(e.id)).slice(0,16-major.length)].sort((a,b)=>b.day-a.day);
  }
}
