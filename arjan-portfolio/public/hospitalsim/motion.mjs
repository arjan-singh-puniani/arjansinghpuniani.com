export function sampleRoute(points,alpha){
 const lengths=points.slice(1).map((p,i)=>Math.hypot(p.x-points[i].x,p.y-points[i].y)),total=lengths.reduce((a,b)=>a+b,0);let distance=Math.max(0,Math.min(1,alpha))*total,i=0;
 while(i<lengths.length-1&&distance>lengths[i])distance-=lengths[i++];
 const a=points[i],b=points[i+1]||a,t=lengths[i]?distance/lengths[i]:0;
 return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,dx:b.x-a.x,dy:b.y-a.y,rate:total};
}
export function interiorPath(type,height){
 const ramp=[-.825,0,1.62],door=[-.825,.25-height,2.475];
 if(type==='scan')return [door,ramp,[.60,0,1.65],[0,0,.12]];
 if(type==='care')return [door,ramp,[1.25,0,1.20],[.55,0,-.45]];
 return [door,ramp,[1.12,.03,1.30],[.77,.03,.48]];
}
export function sampleInterior(points,progress){
 const lengths=points.slice(1).map((p,i)=>Math.hypot(...p.map((v,j)=>v-points[i][j]))),total=lengths.reduce((a,b)=>a+b,0);
 let distance=Math.max(0,Math.min(1,progress))*total,i=0;
 while(i<lengths.length-1&&distance>lengths[i])distance-=lengths[i++];
 const a=points[i],b=points[i+1],t=lengths[i]?distance/lengths[i]:0;
 return {position:a.map((v,j)=>v+(b[j]-v)*t),dx:b[0]-a[0],dz:b[2]-a[2],rate:total/3/1.65};
}
