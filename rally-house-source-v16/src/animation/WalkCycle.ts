import {Vec3,clamp,smoothstep} from '../rendering/Math3D.js';

/** One owner for each shoe: world-space support, then a continuous airborne arc. */
export class WalkCycle {
  phase=0;
  feet=[new Vec3(),new Vec3()];
  planted=[true,true];
  yaws=[0,0];
  private starts=[new Vec3(),new Vec3()];
  private targets=[new Vec3(),new Vec3()];
  private active=false;private initialFeet?:[Vec3,Vec3];
  private swingPhase=[.55,.55];
  private settleAge=0;private settleHeights:number[]|null=null;
  reset(feet?:[Vec3,Vec3]){this.settleHeights=null;this.active=false;this.initialFeet=feet?[feet[0].clone(),feet[1].clone()]:undefined;}
  settle(dt:number){
    if(!this.active||dt<=0)return false;
    // A stopped root still needs a timed landing; preserve the support footprint rather than chasing the old stride target.
    if(!this.settleHeights){this.settleHeights=this.feet.map(foot=>foot.y);this.settleAge=0;}
    this.settleAge+=dt;const t=smoothstep(0,.16,this.settleAge);let landed=false;
    for(let i=0;i<2;i++){
      this.feet[i].y=this.settleHeights[i]+(.11-this.settleHeights[i])*t;
      if(t===1&&!this.planted[i]){this.planted[i]=true;landed=true;}
    }
    return landed;
  }
  update(position:Vec3,yaw:number,distance:number,stride:number,shape:{halfWidth:number;lift:number;stance:number}={halfWidth:.17,lift:.075,stance:.55},direction?:Vec3){
    // With no travel, keep the in-flight target; a zero direction would teleport the receiving shoe.
    if(this.active&&distance===0)return false;
    if(this.settleHeights){
      // Give the restarted step a full half-cycle so a nearly finished old step cannot snap to its new target.
      this.phase=this.phase<.5?0:.5;
      for(let i=0;i<2;i++){const phase=(this.phase+i*.5)%1;this.starts[i]=this.feet[i].clone();this.targets[i]=this.feet[i].clone();this.swingPhase[i]=phase;this.planted[i]=phase<shape.stance;}
      this.settleHeights=null;
    }
    const local=(side:number,forward:number)=>new Vec3(position.x+Math.cos(yaw)*side+(direction?.x??Math.sin(yaw))*forward,.11,position.z-Math.sin(yaw)*side+(direction?.z??Math.cos(yaw))*forward);
    if(!this.active){const seeded=!!this.initialFeet;this.yaws=[yaw,yaw];this.phase=this.initialFeet?0:.25;this.feet=this.initialFeet??[local(-shape.halfWidth,.04),local(shape.halfWidth,.04)];this.initialFeet=undefined;this.planted=[true,true];this.active=true;if(seeded&&distance===0)return false;}
    this.phase=(this.phase+distance/stride)%1;
    let landed=false;
    for(let i=0;i<2;i++){
      const phase=(this.phase+i*.5)%1,stance=phase<shape.stance;
      if(stance){if(!this.planted[i]){this.feet[i]=this.targets[i].clone();landed=true;}this.planted[i]=true;}
      else {
        if(this.planted[i]){this.starts[i]=this.feet[i].clone();this.swingPhase[i]=direction?Math.min(phase,shape.stance):phase;this.targets[i]=local(i===0?-shape.halfWidth:shape.halfWidth,stride*(1-phase+shape.stance/2));}
        this.planted[i]=false;
        const angle=Math.atan2(Math.sin(yaw-this.yaws[i]),Math.cos(yaw-this.yaws[i]));this.yaws[i]+=angle*Math.min(1,distance*24);
        this.targets[i]=local(i===0?-shape.halfWidth:shape.halfWidth,stride*(1-phase+shape.stance/2));
        const t=clamp((phase-this.swingPhase[i])/(1-this.swingPhase[i]),0,1);
        this.feet[i]=Vec3.lerp(this.starts[i],this.targets[i],smoothstep(0,1,t));
        this.feet[i].y=.11+(this.starts[i].y-.11)*(1-smoothstep(0,1,t))+shape.lift*Math.sin(Math.PI*t)**2;
      }
    }
    return landed;
  }
}
