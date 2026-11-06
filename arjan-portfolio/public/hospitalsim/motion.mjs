import {CLINIC_DEPARTMENTS} from './clinic.mjs?v=138';
import {blocked} from './navigation.mjs?v=138';
export const WALK_SPEED=1.2375;
// Quarter-cell paths keep their endpoints; tiny corner arcs stay within the clear corridor.
const curvedRoutes=new WeakMap();
export function sampleRoute(points,alpha,rooms){
 let route=rooms?curvedRoutes.get(points):points;
 if(!route){route=[points[0]];for(let i=1;i<points.length-1;i++){
  const a=points[i-1],b=points[i],c=points[i+1],u={x:b.x-a.x,y:b.y-a.y},v={x:c.x-b.x,y:c.y-b.y},l=Math.hypot(u.x,u.y),m=Math.hypot(v.x,v.y),r=Math.min(.08,l/3,m/3);
  if(!l||!m||Math.abs(u.x*v.y-u.y*v.x)<1e-8){route.push(b);continue}
  const entry={x:b.x-u.x/l*r,y:b.y-u.y/l*r},out={x:b.x+v.x/m*r,y:b.y+v.y/m*r},arc=[entry];
  for(let j=1;j<=4;j++){const t=j/4;arc.push({x:(1-t)**2*entry.x+2*t*(1-t)*b.x+t*t*out.x,y:(1-t)**2*entry.y+2*t*(1-t)*b.y+t*t*out.y})}
  if(arc.some(p=>blocked(p.x,p.y,rooms)))route.push(b);else route.push(...arc);
 }if(points.length>1)route.push(points.at(-1));curvedRoutes.set(points,route)}
 const lengths=route.slice(1).map((p,i)=>Math.hypot(p.x-route[i].x,p.y-route[i].y)),total=lengths.reduce((a,b)=>a+b,0);let distance=Math.max(0,Math.min(1,alpha))*total,i=0;
 while(i<lengths.length-1&&distance>lengths[i])distance-=lengths[i++];
 const a=route[i],b=route[i+1]||a,t=lengths[i]?distance/lengths[i]:0;
 return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,dx:b.x-a.x,dy:b.y-a.y,rate:total,distance:Math.max(0,Math.min(1,alpha))*total};
}
export function interiorPath(type,height){
 const ramp=[-.825,0,1.62],door=[-.825,.25-height,2.475];
 if(CLINIC_DEPARTMENTS[type])return [door,ramp,[CLINIC_DEPARTMENTS[type].patient[0],.03,1.35],CLINIC_DEPARTMENTS[type].patient];
 if(type==='scan')return [door,ramp,[.60,0,1.65],[0,0,.12]];
 if(type==='care')return [door,ramp,[1.25,0,1.20],[.55,0,-.45]];
 return [door,ramp,[1.12,.03,1.30],[.77,.03,.48]];
}
export function sampleInterior(points,progress){
 const lengths=points.slice(1).map((p,i)=>Math.hypot(...p.map((v,j)=>v-points[i][j]))),total=lengths.reduce((a,b)=>a+b,0);
 let distance=Math.max(0,Math.min(1,progress))*total,i=0;
 while(i<lengths.length-1&&distance>lengths[i])distance-=lengths[i++];
 const a=points[i],b=points[i+1],t=lengths[i]?distance/lengths[i]:0;
 return {position:a.map((v,j)=>v+(b[j]-v)*t),dx:b[0]-a[0],dz:b[2]-a[2],rate:total/3/WALK_SPEED};
}

// Staff use the same doorway and ramp as patients, with routes around the equipment.
export function staffPost(type,index=0,clearing=false){
 if(CLINIC_DEPARTMENTS[type])return{position:CLINIC_DEPARTMENTS[type].staffPost,heading:CLINIC_DEPARTMENTS[type].heading};
 if(type==='scan')return {position:[1,0,-.20],heading:Math.PI};
 if(type==='care')return {position:index===0?[-.78,0,-.06]:clearing?[1.20,0,-.85]:[.79,0,-.02],heading:index===0?Math.PI/2:-Math.PI/2};
 return {position:[-.90,0,.25],heading:Math.PI/2};
}
export function staffInteriorPath(type,height,index=0,lounge=false){
 const door=[-.825,.25-height,2.475],ramp=[-.825,0,1.62];
 if(lounge)return [door,ramp,[index%2?-.9:.9,0,.8],[index%2?-.45:.45,.05,-.35]];
 const post=staffPost(type,index).position;
 if(CLINIC_DEPARTMENTS[type])return [door,ramp,[-1.4,0,1.3],[-1.4,0,post[2]],post];
 if(type==='care'&&index===0)return [door,ramp,[-1.25,0,1.15],[-1.25,0,-.06],post];
 if(type==='care')return [door,ramp,[1.35,0,1.2],[1.35,0,-.02],post];
 if(CLINIC_DEPARTMENTS[type])return [door,ramp,[CLINIC_DEPARTMENTS[type].patient[0],.03,1.35],CLINIC_DEPARTMENTS[type].patient];
 if(type==='scan')return [door,ramp,[1.35,0,1.15],[1.35,0,-.20],post];
 return [door,ramp,[-1.35,0,1.15],[-1.35,0,.25],post];
}

export function drapePose(state,progress){
 const spread=state==='service'?Math.min(1,Math.max(0,progress)):state==='uncovering'?1-Math.min(1,Math.max(0,progress)):0;
 return {visible:spread>0,scaleY:.2+.8*spread,scaleZ:.12+.88*spread,opacity:Math.min(1,spread*10)};
}

// A clear front/right lane keeps support work away from gantry, bed and clinician posts.
export function supportInteriorPath(type,height){return [[-.825,.25-height,2.475],[.35,0,1.72],[1.2,0,1.15]]}

export function waitingSeat(index,layout=0){const x=index? .5:-.5;return layout?[.55,0,x]:[x,0,-.55]}
export function waitingInteriorPath(height,index,layout=0){const seat=waitingSeat(index,layout);return [[-.825,.25-height,2.475],[-.825,0,1.62],[seat[0],0,1.15],seat]}

export function changingPath(){return [[0,.03,.8],[.3,.03,1.35],[1.05,.03,1.35],[1.05,.03,.8]]}
