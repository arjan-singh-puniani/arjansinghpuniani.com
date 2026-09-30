import {Vec3} from '../rendering/Math3D.js';
import type {Mesh} from '../rendering/Renderer.js';

interface TrailSample {position:Vec3; age:number}

/** A short, time-sampled comet. Bounded in time and space at every frame rate. */
export class BallTrail {
  private samples:TrailSample[]=[];
  private remainder=0;
  private previous:Vec3|null=null;
  private readonly interval=1/90;
  private readonly lifetime=.19;

  reset() {
    this.samples=[];
    this.previous=null;
    this.remainder=0;
  }

  update(position:Vec3,dt:number) {
    for(const sample of this.samples)sample.age+=dt;
    this.samples=this.samples.filter(sample=>sample.age<this.lifetime);
    if(!this.previous){this.previous=position.clone();return;}
    // Never bridge a teleport, a new serve, or a long suspended frame.
    if(dt>.1||Vec3.sub(position,this.previous).len()>2){this.reset();this.previous=position.clone();return;}
    let next=this.interval-this.remainder;
    while(next<=dt){
      this.samples.unshift({position:Vec3.lerp(this.previous,position,next/dt),age:dt-next});
      next+=this.interval;
    }
    this.remainder=(this.remainder+dt)%this.interval;
    this.samples.length=Math.min(this.samples.length,18);
    this.previous=position.clone();
  }

  meshes(head:Vec3,reducedMotion=false):Mesh[] {
    const meshes:Mesh[]=[];
    let newer=head;
    let distance=0;
    for(const sample of this.samples){
      const delta=Vec3.sub(newer,sample.position);
      const length=delta.len();
      distance+=length;
      if(distance>(reducedMotion?.55:1.9))break;
      if(length<.002)continue;
      const life=Math.max(0,1-sample.age/this.lifetime);
      const width=.015+.135*life*life;
      const rotation=new Vec3(Math.atan2(Math.hypot(delta.x,delta.z),delta.y),Math.atan2(delta.x,delta.z),0);
      meshes.push({
        id:'ball-comet',kind:'cylinder',position:Vec3.lerp(newer,sample.position,.5),rotation,
        scale:new Vec3(width,length+.025,width),color:'#f4f8ad',alpha:life*(reducedMotion?.22:.52),
        unlit:true,noShadow:true,
      });
      newer=sample.position;
    }
    return meshes;
  }
}
