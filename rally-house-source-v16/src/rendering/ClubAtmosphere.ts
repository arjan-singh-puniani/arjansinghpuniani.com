import type {Lighting} from './Renderer.js';

/** Smooth weather/mode changes without allocating another post-processing pass. */
export class ClubAtmosphere {
  private current:Lighting|null=null;

  update(target:Lighting,dt:number){
    if(!this.current){this.current=target;return target;}
    const current=this.current;
    const blend=1-Math.exp(-Math.max(0,dt)*2.8);
    const mix=(a:number,b:number)=>a+(b-a)*blend;
    current.ambient=mix(current.ambient,target.ambient);
    current.warmth=mix(current.warmth??0,target.warmth??0);
    current.shadowStrength=mix(current.shadowStrength??0,target.shadowStrength??0);
    for(let i=0;i<4;i++)current.background[i]=mix(current.background[i],target.background[i]);
    for(const key of ['sunColor','skyColor','bounceColor'] as const){
      const from=current[key],to=target[key];
      if(from&&to)for(let i=0;i<3;i++)from[i]=mix(from[i],to[i]);
    }
    current.sunDir.x=mix(current.sunDir.x,target.sunDir.x);
    current.sunDir.y=mix(current.sunDir.y,target.sunDir.y);
    current.sunDir.z=mix(current.sunDir.z,target.sunDir.z);
    current.sunDir.normalize();
    for(let i=0;i<(current.pointLights?.length??0);i++){
      const from=current.pointLights![i],to=target.pointLights?.[i];
      if(to){from.intensity=mix(from.intensity,to.intensity);for(let c=0;c<3;c++)from.color[c]=mix(from.color[c],to.color[c]);}
    }
    if(current.castingLight&&target.castingLight)current.castingLight.strength=mix(current.castingLight.strength,target.castingLight.strength);
    return current;
  }
}
