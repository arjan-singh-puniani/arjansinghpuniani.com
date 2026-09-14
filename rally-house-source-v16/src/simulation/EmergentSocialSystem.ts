import type {Weather} from '../world/World.js';
import type {RelationshipSystem} from './RelationshipSystem.js';

export interface EmergentSocialContext {
  day:number;
  minute:number;
  weather:Weather;
  busy:Set<string>;
  lessonActive:boolean;
  courtBusy:boolean;
  mikaProgress:number;
}
export interface EmergentSocialEvent {
  key:string;
  title:string;
  text:string;
  speakerId:string;
  targetId:string;
  destination:string;
  duration:number;
  interaction:'greet'|'coach'|'rally'|'matcha'|'compliment'|'listen'|'help';
  tags:string[];
}
export interface EmergentSocialSave {nextAllowed:number;day:number;seen:string[]}

export class EmergentSocialSystem {
  private nextAllowed=548;private activeDay=1;private seen=new Set<string>();
  constructor(private relationships:RelationshipSystem){}

  update(ctx:EmergentSocialContext):EmergentSocialEvent|null{
    if(ctx.day!==this.activeDay){this.activeDay=ctx.day;this.nextAllowed=520+((ctx.day*17)%26);this.seen.clear();}
    if(ctx.lessonActive||ctx.minute<this.nextAllowed||ctx.minute<500||ctx.minute>790)return null;
    const free=(...ids:string[])=>ids.every(id=>!ctx.busy.has(id));
    const choose=(e:EmergentSocialEvent)=>{this.seen.add(e.key);this.nextAllowed=ctx.minute+22+((ctx.day+this.seen.size*7)%17);return e;};

    const mikaLeo=this.relationships.behaviorBias('mika','leo');
    if(!ctx.courtBusy&&free('mika','leo')&&mikaLeo.seekCompany>.10&&!this.seen.has('mika-leo-rally')){
      return choose({key:'mika-leo-rally',title:'“Ten easy balls?”',text:'Lucresia catches Leo between routines and asks for a calm crosscourt rally. The invitation comes from their growing familiarity, not a timetable.',speakerId:'mika',targetId:'leo',destination:'courtBench',duration:13,interaction:'rally',tags:['tennis','friendship','emergent']});
    }
    const juneMika=this.relationships.behaviorBias('coach','mika');
    if(ctx.mikaProgress<68&&free('coach','mika')&&juneMika.encouragement>.10&&!this.seen.has('june-notices-mika')){
      return choose({key:'june-notices-mika',title:'Contessa notices the feet',text:'Contessa watches two repetitions, then quietly points at Lucresia’s split step instead of her racket. Lucresia tries the next ball differently.',speakerId:'coach',targetId:'mika',destination:'training',duration:11,interaction:'coach',tags:['coaching','footwork','emergent']});
    }
    if(ctx.weather==='rain'&&free('nia','coach')&&!this.seen.has('rain-tea')){
      return choose({key:'rain-tea',title:'Rain ritual',text:'The windows soften under the rain. Barbara slides Contessa a warm cup before either of them says anything.',speakerId:'nia',targetId:'coach',destination:'cafe',duration:10,interaction:'matcha',tags:['weather','ritual','emergent']});
    }
    const niaLeo=this.relationships.behaviorBias('nia','leo');
    if(free('nia','leo')&&niaLeo.seekCompany>.10&&!this.seen.has('bonsai-footwork')){
      return choose({key:'bonsai-footwork',title:'Unsolicited bonsai coaching',text:'Leo checks the bonsai. Barbara asks whether staring at it has improved his recovery step yet.',speakerId:'nia',targetId:'leo',destination:'bonsai',duration:9,interaction:'greet',tags:['humor','routine','emergent']});
    }
    if(free('leo','mika')&&!this.seen.has('leo-encourages')){
      return choose({key:'leo-encourages',title:'Tiny approval',text:'Leo catches one especially clean forehand and taps the throat of his racket twice against his palm. Lucresia notices.',speakerId:'leo',targetId:'mika',destination:'courtBench',duration:8,interaction:'compliment',tags:['tennis','encouragement','emergent']});
    }
    this.nextAllowed=ctx.minute+12;return null;
  }
  serialize():EmergentSocialSave{return {nextAllowed:this.nextAllowed,day:this.activeDay,seen:[...this.seen]};}
  load(s?:EmergentSocialSave){if(!s)return;this.nextAllowed=s.nextAllowed??548;this.activeDay=s.day??1;this.seen=new Set(s.seen??[]);}
}
