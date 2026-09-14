import {Vec3,clamp,smoothstep} from '../rendering/Math3D.js';

/** One owner for each shoe: world-space support, then a continuous airborne arc. */
export class WalkCycle {
  phase=0;
  feet=[new Vec3(),new Vec3()];
  planted=[true,true];
  yaws=[0,0];
  private starts=[new Vec3(),new Vec3()];
  private targets=[new Vec3(),new Vec3()];
  private active=false;
  private swingPhase=[.55,.55];
  reset(){this.active=false;}
  update(position:Vec3,yaw:number,distance:number,stride:number){
    const local=(side:number,forward:number)=>new Vec3(position.x+Math.cos(yaw)*side+Math.sin(yaw)*forward,.11,position.z-Math.sin(yaw)*side+Math.cos(yaw)*forward);
    if(!this.active){this.yaws=[yaw,yaw];this.phase=.25;this.feet=[local(-.17,.04),local(.17,.04)];this.planted=[true,true];this.active=true;}
    this.phase=(this.phase+distance/stride)%1;
    let landed=false;
    for(let i=0;i<2;i++){
      const phase=(this.phase+i*.5)%1,stance=phase<.55;
      if(stance){if(!this.planted[i]){this.feet[i]=this.targets[i].clone();landed=true;}this.planted[i]=true;}
      else {
        if(this.planted[i]){this.starts[i]=this.feet[i].clone();this.swingPhase[i]=phase;this.targets[i]=local(i===0?-.17:.17,stride*(1-phase+.275));}
        this.planted[i]=false;
        const angle=Math.atan2(Math.sin(yaw-this.yaws[i]),Math.cos(yaw-this.yaws[i]));this.yaws[i]+=angle*Math.min(1,distance*24);
        this.targets[i]=local(i===0?-.17:.17,stride*(1-phase+.275));
        const t=clamp((phase-this.swingPhase[i])/(1-this.swingPhase[i]),0,1);
        this.feet[i]=Vec3.lerp(this.starts[i],this.targets[i],smoothstep(0,1,t));
        this.feet[i].y=.11+.075*Math.sin(Math.PI*t)**2;
      }
    }
    return landed;
  }
}
