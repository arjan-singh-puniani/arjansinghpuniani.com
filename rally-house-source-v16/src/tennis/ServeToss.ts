import {Vec3,clamp} from '../rendering/Math3D.js';

/** Timed arcade toss: a fixed target, one apex, descending into contact. */
export function serveToss(start:Vec3,contact:Vec3,progress:number){
  const t=clamp(progress,0,1),ball=Vec3.lerp(start,contact,t);
  const arc=Math.max(.60,(contact.y-start.y)*.75);
  ball.y+=4*arc*t*(1-t);
  return ball;
}
