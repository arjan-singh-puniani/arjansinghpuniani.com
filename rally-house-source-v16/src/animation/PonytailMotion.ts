import {Vec3,clamp} from '../rendering/Math3D.js';

/** Advance with simulation time; drawing and replay only read the angles. */
export class PonytailMotion {
  angle=new Vec3();
  private velocity=new Vec3();
  private previousYaw?:number;
  update(dt:number,yaw:number,movement:Vec3,gait:number){
    if(dt<=0)return;
    const turn=this.previousYaw===undefined?0:Math.atan2(Math.sin(yaw-this.previousYaw),Math.cos(yaw-this.previousYaw))/dt;
    this.previousYaw=yaw;
    const moving=Math.min(1,movement.len()/2.5),target=new Vec3(clamp(movement.z*.025+Math.sin(gait*2)*.04*moving,-.04,.18),clamp(-turn*.055,-.40,.40),clamp(-movement.x*.018+turn*.04,-.24,.24));
    const decay=Math.exp(-10*dt);
    for(const key of ['x','y','z'] as const){
      const offset=this.angle[key]-target[key],impulse=this.velocity[key]+10*offset;
      this.angle[key]=target[key]+(offset+impulse*dt)*decay;
      this.velocity[key]=(this.velocity[key]-10*impulse*dt)*decay;
    }
  }
}
