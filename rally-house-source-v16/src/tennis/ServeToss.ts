import {Vec3} from '../rendering/Math3D.js';
import {BALL_GRAVITY,solveLaunch} from './BallPhysics.js';

export const SERVE_RELEASE=.35;
export const SERVE_TIMING={contact:1.02,duration:1.72} as const;
export interface ServeFlight {origin:Vec3;velocity:Vec3;gravity:number;}

/** Freeze launch conditions at palm release; later racket movement cannot steer the toss. */
export function releaseServeToss(origin:Vec3,contact:Vec3,seconds:number):ServeFlight{
  if(!Number.isFinite(seconds)||seconds<=0)throw new RangeError('Serve flight requires a positive duration');
  return {origin:origin.clone(),velocity:solveLaunch(origin,contact,seconds),gravity:BALL_GRAVITY};
}
export function serveToss(flight:ServeFlight,seconds:number){
  const t=Math.max(0,seconds);
  return flight.origin.clone().add(flight.velocity.clone().scale(t)).add(new Vec3(0,.5*flight.gravity*t*t,0));
}
