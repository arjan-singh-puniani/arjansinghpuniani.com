import {clamp,smoothstep} from '../rendering/Math3D.js';
import type {InnerState} from '../simulation/CharacterMind.js';
export interface ActingValues {postureLift:number;shoulderOpenness:number;headTilt:number;gazeHold:number;gestureAmplitude:number;idleFidgetRate:number;stepEnergy:number;reactionLatency:number;smileBias:number;browBias:number;personalDistance:number;}
export type ReactionName='acknowledge'|'smallSmile'|'proud'|'relieved'|'annoyed'|'embarrassed'|'surprised'|'focused'|'disappointed'|'teasing'|'encouraging'|'thoughtful';
export const REACTIONS:Record<ReactionName,{smile:number;brow:number;lift:number;tilt:number}>={
 acknowledge:{smile:.1,brow:.03,lift:.01,tilt:.025},smallSmile:{smile:.3,brow:0,lift:.01,tilt:.015},proud:{smile:.4,brow:.08,lift:.045,tilt:-.025},relieved:{smile:.25,brow:.04,lift:-.012,tilt:.025},annoyed:{smile:-.25,brow:-.16,lift:-.012,tilt:-.03},embarrassed:{smile:.08,brow:.13,lift:-.035,tilt:.07},surprised:{smile:.02,brow:.25,lift:.02,tilt:-.04},focused:{smile:-.08,brow:-.09,lift:.015,tilt:0},disappointed:{smile:-.2,brow:.1,lift:-.04,tilt:.045},teasing:{smile:.32,brow:.12,lift:.02,tilt:-.055},encouraging:{smile:.3,brow:.05,lift:.02,tilt:.04},thoughtful:{smile:.02,brow:.07,lift:0,tilt:.06}
};
const unit=(v:number)=>Number.isFinite(v)?clamp(v,0,1):.5;
export function deriveActing(state:InnerState,bond?:{warmth:number;familiarity:number;trust:number;rivalry:number},id='mika'):ActingValues{
 const energy=unit(state.energy),confidence=unit(state.confidence),social=unit(state.social),tone=unit(state.tone),warmth=unit((bond?.warmth??0)/100),familiarity=unit((bond?.familiarity??0)/100);
 return {postureLift:(confidence-.5)*.06+(energy-.5)*.025,shoulderOpenness:(confidence-.5)*.06+warmth*.016,headTilt:(.5-confidence)*.055,gazeHold:1.8+confidence*1.2+warmth*.8,gestureAmplitude:clamp(.65+energy*.22+confidence*.18+(id==='nia'?.05:id==='coach'?-.1:0),.6,1.12),idleFidgetRate:clamp(.2+energy*.4+(1-confidence)*.3,.2,.95),stepEnergy:.94+energy*.04+confidence*.02,reactionLatency:id==='coach'?.55:id==='leo'?.14:id==='nia'?.22:.24,smileBias:(tone-.5)*.22+warmth*.06,browBias:(.5-confidence)*.16,personalDistance:1.46-warmth*.18-familiarity*.10};
}
const DEFAULT:InnerState={energy:.7,confidence:.6,social:.5,practice:.6,comfort:.6,tone:.6};
export class ActingState {
 values:ActingValues;private target:ActingValues;clock=0;role:'none'|'approach'|'orient'|'settle'|'speak'|'listen'|'pause'|'exit'='none';roleAge=0;
 reactionName:ReactionName|null=null;reactionWeight=0;private reactionAge=0;private reactionDuration=0;
 micro:string|null=null;private microUntil=0;private cooldown=0;protected=false;
 constructor(public id:string){this.values=deriveActing(DEFAULT,undefined,id);this.target={...this.values};}
 setState(state:InnerState,bond?:Parameters<typeof deriveActing>[1]){this.target=deriveActing(state,bond,this.id);}
 setRole(role:ActingState['role']){if(role!==this.role){this.role=role;this.roleAge=0;}}
 react(name:ReactionName,duration=18){this.reactionName=name;this.reactionAge=0;this.reactionDuration=clamp(duration,1,30);this.reactionWeight=0;}
 requestMicro(context:string){if(this.clock<this.cooldown||this.protected||this.reactionName||this.role==='speak')return;const kind=context==='notebook'?'note-tap':context==='wateringCan'?'leaf-inspect':context==='cup'?'cup-turn':context==='gear'?'string-check':context==='warmup'?'headband-adjust':null;if(!kind)return;this.micro=kind;this.microUntil=this.clock+2.8;this.cooldown=this.clock+24+(this.id.length%4)*5;}
 update(dt:number,major=false){if(!Number.isFinite(dt)||dt<=0)return;this.clock+=dt;this.roleAge+=dt;this.protected=major;const t=1-Math.exp(-dt*2.8);for(const k of Object.keys(this.values) as (keyof ActingValues)[])this.values[k]+=(this.target[k]-this.values[k])*t;
  if(major||this.clock>=this.microUntil)this.micro=null;
  if(this.reactionName){this.reactionAge+=dt;const age=this.reactionAge-this.values.reactionLatency;this.reactionWeight=major?0:smoothstep(0,.45,age)*(1-smoothstep(this.reactionDuration-3,this.reactionDuration,age));if(age>=this.reactionDuration){this.reactionName=null;this.reactionWeight=0;}}
 }
 get reaction(){return this.reactionName?REACTIONS[this.reactionName]:null;}
 get settling(){return this.reactionName!==null&&this.reactionAge<2.8;}
}
