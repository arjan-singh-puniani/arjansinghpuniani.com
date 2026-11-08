import {Vec3,identity,clamp,smoothstep} from '../rendering/Math3D.js';
import type {RenderItem,SkinGeometry,SkinnedMesh} from '../rendering/Renderer.js';
import type {HumanHeadOptions} from './TaylorHuman.js';
import {surface} from './HumanSurface.js';
import {ARJAN_FACE_POINTS as points,ARJAN_FACE_TRIANGLES as triangles,ARJAN_FACE_FEATURES as features} from './ArjanFaceData.js';
type Point=[number,number,number];
const bones=new Float32Array(15*16);for(let i=0;i<15;i++)bones.set(identity(),i*16);
const at=(i:number,offset=0):Point=>[points[i][0],points[i][1],points[i][2]+offset];
const average=(p:Point[]):Point=>[0,1,2].map(k=>p.reduce((s,v)=>s+v[k],0)/p.length) as Point;
const front=(tri:(a:Point,b:Point,c:Point)=>void,a:Point,b:Point,c:Point)=>{if((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])>0)tri(a,b,c);else tri(a,c,b);};
// Follow connected edges: angle sorting can reorder the two sides of an almost-closed mouth.
const ordered=(edges:number[][])=>{const adjacency=new Map<number,number[]>();for(const [a,b] of edges){adjacency.set(a,[...(adjacency.get(a)??[]),b]);adjacency.set(b,[...(adjacency.get(b)??[]),a]);}const ids=[edges[0][0]];let previous=-1,current=ids[0];do{const next=adjacency.get(current)!.find(i=>i!==previous)!;previous=current;current=next;if(current!==ids[0])ids.push(current);if(ids.length>adjacency.size)throw Error('Invalid facial feature loop');}while(current!==ids[0]);if(ids.length!==adjacency.size)throw Error('Disconnected facial feature loop');const area=ids.reduce((a,id,i)=>{const b=points[ids[(i+1)%ids.length]];return a+points[id][0]*b[1]-b[0]*points[id][1];},0);return area<0?ids.reverse():ids;};
const oval=ordered(features.FACE_LANDMARKS_FACE_OVAL);
const face=surface('arjan-reference-face-v1',tri=>{
 for(const ids of triangles)tri(at(ids[0]),at(ids[1]),at(ids[2]));
 // Close the back of the measured face into a skull; no changes reach the body attachment or pose.
 const ring=(r:number,i:number):Point=>{const p=at(oval[(i+oval.length)%oval.length]),t=r/16,a=t*Math.PI/2,c=Math.cos(a);return [p[0]*c,(p[1]-.018)*c+.018+.042*Math.max(0,p[1]/.126)*Math.sin(t*Math.PI),p[2]*c-.113*Math.sin(a)];};
 for(let r=0;r<16;r++)for(let i=0;i<oval.length;i++){const a=ring(r,i),b=ring(r,i+1),c=ring(r+1,i+1),d=ring(r+1,i);const emit=(a:Point,b:Point,c:Point)=>{const n=Vec3.cross(Vec3.sub(new Vec3(...b),new Vec3(...a)),Vec3.sub(new Vec3(...c),new Vec3(...a))),mid=average([a,b,c]);if(Vec3.dot(n,new Vec3(mid[0],mid[1]-.018,mid[2]))>0)tri(a,b,c);else tri(a,c,b);};emit(a,c,b);emit(a,d,c);}
});
// Intersect the emitted reference triangles so every detail follows this actual surface.
function depth(x:number,y:number){let z=-Infinity;for(const ids of triangles){const [a,b,c]=ids.map(i=>points[i]),det=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(det)<1e-12)continue;const u=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/det,v=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/det,w=1-u-v;if(u>=-1e-6&&v>=-1e-6&&w>=-1e-6)z=Math.max(z,u*a[2]+v*b[2]+w*c[2]);}return z;}
function surfaceDepth(x:number,y:number,p:Float32Array){let z=-Infinity;for(let i=0;i<p.length;i+=9){const ax=p[i],ay=p[i+1],bx=p[i+3],by=p[i+4],cx=p[i+6],cy=p[i+7],det=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);if(Math.abs(det)<1e-12)continue;const a=((by-cy)*(x-cx)+(cx-bx)*(y-cy))/det,b=((cy-ay)*(x-cx)+(ax-cx)*(y-cy))/det,c=1-a-b;if(a>=-1e-6&&b>=-1e-6&&c>=-1e-6)z=Math.max(z,a*p[i+2]+b*p[i+5]+c*p[i+8]);}return z;}
const eyes=[features.FACE_LANDMARKS_RIGHT_EYE,features.FACE_LANDMARKS_LEFT_EYE].map((edges,index)=>{
 const boundary=ordered(edges).map(i=>at(i)),centre=average(boundary);
 const white=surface(`arjan-reference-sclera-${index}`,tri=>{for(let r=0;r<6;r++)for(let i=0;i<boundary.length;i++){const p=(row:number,j:number):Point=>{const t=row/6,b=boundary[j%boundary.length],x=centre[0]+(b[0]-centre[0])*t,y=centre[1]+(b[1]-centre[1])*t;return [x,y,centre[2]*(1-t)+b[2]*t+.003*(1-t*t)+.0002];};tri(p(r,i),p(r+1,i),p(r+1,i+1));tri(p(r,i),p(r+1,i+1),p(r,i+1));}});
 // Clip the iris to the measured eyelid aperture before depth fitting, including both gaze endpoints.
 const disc=(name:string,radius:number,offset:number)=>{
  const make=(gaze:number)=>surface(`arjan-reference-${name}-${index}`,tri=>{
   const p=(r:number,i:number):Point=>{const angle=i/48*Math.PI*2,dx=Math.cos(angle),dy=Math.sin(angle),cx=centre[0]+gaze,cy=centre[1];let limit=radius;
    for(let j=0;j<boundary.length;j++){const a=boundary[j],b=boundary[(j+1)%boundary.length],ex=b[0]-a[0],ey=b[1]-a[1],det=dx*ey-dy*ex;if(Math.abs(det)<1e-10)continue;const ax=a[0]-cx,ay=a[1]-cy,t=(ax*ey-ay*ex)/det,u=(ax*dy-ay*dx)/det;if(t>0&&u>=0&&u<=1)limit=Math.min(limit,Math.max(.0005,t-.00025));}
    const x=cx+dx*limit*r/6,y=cy+dy*limit*r/6,z=surfaceDepth(x,y,white.positions);if(!Number.isFinite(z))throw Error('Iris left reference aperture');return [x,y,z+offset];};
   for(let r=0;r<6;r++)for(let i=0;i<48;i++){tri(p(r,i),p(r+1,i),p(r+1,i+1));tri(p(r,i),p(r+1,i+1),p(r,i+1));}
  },false);
  const base=make(0),right=make(.016*Math.sin(.3)),left=make(-.016*Math.sin(.3));
  base.morphs=[right.positions.map((v,i)=>v-base.positions[i]),left.positions.map((v,i)=>v-base.positions[i]),...Array.from({length:3},()=>new Float32Array(base.positions.length))];
  base.morphNormals=[right.normals.map((v,i)=>v-base.normals[i]),left.normals.map((v,i)=>v-base.normals[i]),...Array.from({length:3},()=>new Float32Array(base.positions.length))];return base;
 };

 return {centre,white,iris:disc('iris',.0102,.0010),pupil:disc('pupil',.0043,.0016)};
});
const lips=features.FACE_LANDMARKS_LIPS;
const outerLip=ordered(lips.slice(0,20)).map(i=>at(i));
function inside(x:number,y:number,polygon:Point[]){let result=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])result=!result;}return result;}
// Reuse the actual lip triangles; a coarse replacement strip cuts through their curved surface.
const lipSurface=(upper:boolean)=>surface(`arjan-reference-${upper?'upper':'lower'}-lip`,tri=>{for(const ids of triangles){const p=ids.map(i=>at(i,.0008)),c=average(p);if(inside(c[0],c[1],outerLip)&&(c[1]>points[13][1])===upper)tri(p[0],p[1],p[2]);}});
const upper=lipSurface(true),lower=lipSurface(false);
const mouthCentre=average([at(13),at(14)]),mouth=surface('arjan-reference-mouth',tri=>{const ids=ordered(lips.slice(20));for(let i=0;i<ids.length;i++){const a=at(ids[i],-.0002),b=at(ids[(i+1)%ids.length],-.0002);tri(mouthCentre,a,b);}} ,false);
const brows=[features.FACE_LANDMARKS_RIGHT_EYEBROW,features.FACE_LANDMARKS_LEFT_EYEBROW].map((edges,index)=>surface(`arjan-reference-strand-brow-${index}`,tri=>{
 const bottom=[edges[0][0],...edges.slice(0,4).map(e=>e[1])],top=[edges[4][0],...edges.slice(4).map(e=>e[1])];
 // Keep a narrow core inside a smooth strand envelope so the brow does not read as a painted polygon.
 const curve=(ids:number[],u:number):Point=>{const v=clamp(u,0,1)*4,j=Math.min(3,Math.floor(v)),t=v-j,a=at(ids[Math.max(0,j-1)]),b=at(ids[j]),c=at(ids[j+1]),d=at(ids[Math.min(4,j+2)]);return [0,1,2].map(k=>.5*(2*b[k]+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t*t+(-a[k]+3*b[k]-3*c[k]+d[k])*t*t*t)) as Point;};
 for(let i=0;i<24;i++)for(let row=0;row<6;row++){const p=(j:number,r:number):Point=>{const u=j/24,t=.5+(r/6-.5)*.80*(.50+.50*Math.pow(Math.sin(u*Math.PI),.35)),a=curve(bottom,u),b=curve(top,u),x=a[0]*(1-t)+b[0]*t,y=a[1]*(1-t)+b[1]*t;return [x,y,depth(x,y)+.0012];};front(tri,p(i,row),p(i+1,row),p(i+1,row+1));front(tri,p(i,row),p(i+1,row+1),p(i,row+1));}
 let seed=719+index;const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
 for(let i=0;i<850;i++){const u=random(),s=random(),a=curve(bottom,u),b=curve(top,u),x=a[0]*(1-s)+b[0]*s,y=a[1]*(1-s)+b[1]*s,z=depth(x,y);if(!Number.isFinite(z))continue;tri([x-.00015,y,z+.0014],[x+.00015,y,z+.0014],[x+.0004,y+.0013,z+.0014]);}
},false));
const stubble=surface('arjan-reference-stubble',tri=>{let seed=1701;const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);for(let i=0;i<2600;i++){const x=(random()*2-1)*.105,y=-.172+random()*.118,beard=y<-.120||Math.abs(x)>.045&&y<-.055||Math.abs(x)<.037&&y>-.081&&y<-.067;if(!beard)continue;const z=depth(x,y);if(!Number.isFinite(z))continue;front(tri,[x-.00012,y,z+.0005],[x+.00012,y,z+.0005],[x+.0001,y-.0007,z+.0005]);}},false);
// Find the skull under each hair root so the side sweep cannot leave a bright gap at the temples.
function skullRadius(angle:number,y:number){const direction=new Vec3(Math.sin(angle),0,Math.cos(angle)),origin=new Vec3(0,y,0),p=face.positions;let radius=0;for(let i=0;i<p.length;i+=9){const a=new Vec3(...p.subarray(i,i+3)),b=new Vec3(...p.subarray(i+3,i+6)),c=new Vec3(...p.subarray(i+6,i+9)),e1=Vec3.sub(b,a),e2=Vec3.sub(c,a),h=Vec3.cross(direction,e2),det=Vec3.dot(e1,h);if(Math.abs(det)<1e-9)continue;const s=Vec3.sub(origin,a),u=Vec3.dot(s,h)/det,q=Vec3.cross(s,e1),v=Vec3.dot(direction,q)/det,t=Vec3.dot(e2,q)/det;if(u>=-1e-6&&v>=-1e-6&&u+v<=1+1e-6&&t>radius)radius=t;}if(radius<.01)throw Error('Missing skull beneath hair root');return radius+.002;}
const skullRoots=Array.from({length:80},(_,i)=>{const a=i/80*Math.PI*2,f=(1+Math.cos(a))*.5,delta=Math.atan2(Math.sin(a-.25),Math.cos(a-.25));return skullRadius(a,-.023+.139*f+.009*Math.sin(a)*f-.017*Math.exp(-((delta/.28)**2)));});
const cap=surface('arjan-reference-swept-hair',tri=>{
 // One connected shell carries the lifted side sweep; separate tubes read as floating curls.
 const p=(r:number,i:number):Point=>{const a=i/80*Math.PI*2,t=r/28,f=(1+Math.cos(a))*.5,delta=Math.atan2(Math.sin(a-.25),Math.cos(a-.25)),edge=-.023+.139*f+.009*Math.sin(a)*f-.017*Math.exp(-((delta/.28)**2)),phi=Math.acos(clamp((edge-.05)/.19,-1,1))*(1-t),radial=Math.sin(phi),ridge=.0007*Math.sin(a*34-t*8)*radial,lift=.015*Math.sin(t*Math.PI)*(.5-.5*Math.sin(a)),root=skullRoots[i%80],blend=smoothstep(0,.14,t);const x=Math.sin(a)*(root*(1-blend)+(.127*radial+ridge)*blend)-.019*Math.sin(t*Math.PI),y=.05+.19*Math.cos(phi)+lift,z=Math.cos(a)*(root*(1-blend)+(.124*radial+ridge)*blend)-.012*t;
  return [x,y,z];};
 for(let r=0;r<28;r++)for(let i=0;i<80;i++){tri(p(r,i),p(r,i+1),p(r+1,i+1));tri(p(r,i),p(r+1,i+1),p(r+1,i));}
});
// Spread jaw motion along the connected skin, never across the open mouth into the upper lip.
const xyKey=(x:number,y:number)=>x.toFixed(7)+','+y.toFixed(7),jawWeights=new Float64Array(points.length),pinned=new Set<number>(),adjacency=points.map(()=>new Set<number>());
for(const t of triangles)for(let i=0;i<3;i++){adjacency[t[i]].add(t[(i+1)%3]);adjacency[t[(i+1)%3]].add(t[i]);}
for(let i=0;i<points.length;i++){jawWeights[i]=1-smoothstep(-.122,-.080,points[i][1]);if(points[i][1]>-.080||points[i][1]<-.122)pinned.add(i);}
for(const id of [61,185,40,39,37,0,267,269,270,409,291,78,191,80,81,82,13,312,311,310,415,308]){jawWeights[id]=0;pinned.add(id);}
for(const id of [146,91,181,84,17,314,405,321,375,95,88,178,87,14,317,402,318,324]){jawWeights[id]=Math.pow(Math.max(0,1-(points[id][0]/.050)**2),.4);pinned.add(id);}
for(let iteration=0;iteration<600;iteration++){let change=0;for(let i=0;i<points.length;i++)if(!pinned.has(i)){const value=[...adjacency[i]].reduce((s,j)=>s+jawWeights[j],0)/adjacency[i].size;change=Math.max(change,Math.abs(value-jawWeights[i]));jawWeights[i]=value;}if(change<1e-8)break;}
const vertexJaw=new Map(points.map((p,i)=>[xyKey(p[0],p[1]),jawWeights[i]]));
function jawAt(x:number,y:number){const exact=vertexJaw.get(xyKey(x,y));if(exact!==undefined)return exact;let z=-Infinity,weight=1-smoothstep(-.122,-.080,y);for(const ids of triangles){const [a,b,c]=ids.map(i=>points[i]),det=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(det)<1e-12)continue;const u=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/det,v=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/det,w=1-u-v,d=u*a[2]+v*b[2]+w*c[2];if(u>=-1e-6&&v>=-1e-6&&w>=-1e-6&&d>z){z=d;weight=u*jawWeights[ids[0]]+v*jawWeights[ids[1]]+w*jawWeights[ids[2]];}}return weight;}
// Facial acting uses the existing GPU morph channels, with the same field on skin and details.
function facialMorphs(g:SkinGeometry){
 const morphs=Array.from({length:5},()=>new Float32Array(g.positions.length));
 for(let i=0;i<g.positions.length;i+=3){const x=g.positions[i],y=g.positions[i+1],z=g.positions[i+2],front=smoothstep(.01,.07,z),corner=Math.exp(-(((Math.abs(x)-.043)/.024)**2)-((y+.096)/.025)**2)*front;
  morphs[0][i]=Math.sign(x)*.003*corner;morphs[0][i+1]=.005*corner;
  const jaw=g===mouth&&!vertexJaw.has(xyKey(x,y))?.5:jawAt(x,y);morphs[1][i+1]=-.015*jaw*front;
  const eye=eyes[x<0?0:1].centre,w=(1-smoothstep(.026,.042,Math.abs(x-eye[0])))*(1-smoothstep(.013,.029,Math.abs(y-eye[1])))*front;
  morphs[2][i+1]=.94*(eye[1]-y)*w;
  morphs[3][i+1]=.003*Math.exp(-(((y-.055)/.027)**2))*front;
 }
 // The renderer has five fixed channels; the unused grip channel stays zero.
 g.morphs=morphs;g.morphNormals=morphs.map(delta=>{const posed=surface(g.id+'-normal-fit',tri=>{for(let i=0;i<g.positions.length;i+=9){const p=[0,3,6].map(k=>[0,1,2].map(a=>g.positions[i+k+a]+delta[i+k+a]) as Point);tri(p[0],p[1],p[2]);}},!g.id.includes('brow')&&!g.id.includes('stubble'));if(posed.normals.length!==g.normals.length)throw Error('Facial expression collapsed a triangle');return posed.normals.map((v,i)=>v-g.normals[i]);});return g;
}
for(const g of [face,stubble,upper,lower,mouth,...brows])facialMorphs(g);
export const ARJAN_REFERENCE_GEOMETRY:Record<string,SkinGeometry>={face,cap,stubble,upper,lower,mouth,...Object.fromEntries(brows.map((g,i)=>['brow'+i,g])),...Object.fromEntries(eyes.flatMap((e,i)=>Object.entries({white:e.white,iris:e.iris,pupil:e.pupil}).map(([k,g])=>[k+i,g])))};
export function arjanReferenceHair(head:Vec3,yaw:number,tilt:number,options:HumanHeadOptions={}):RenderItem[]{return [cap].map(g=>({skin:g,boneMatrices:bones,position:head.clone(),rotation:new Vec3(-(options.pitch??0),yaw,tilt),scale:new Vec3(options.width??1,options.height??1,1),color:options.hair??'#251e1d',material:'groomedHair'}));}
export function arjanReferenceHead(head:Vec3,yaw:number,tilt:number,expression:{smile:number;mouthOpen:number;squint:number;browRaise:number},time:number,skin:string,options:HumanHeadOptions={}):RenderItem[]{
 const out:RenderItem[]=[],width=options.width??1,height=options.height??1,rotation=new Vec3(-(options.pitch??0),yaw,tilt);
 const point=(x:number,y:number,z:number)=>{const p=new Vec3(x*width,y*height,z);const tx=p.x*Math.cos(tilt)-p.y*Math.sin(tilt),up=p.x*Math.sin(tilt)+p.y*Math.cos(tilt),pitch=options.pitch??0,py=up*Math.cos(pitch)+z*Math.sin(pitch),pz=z*Math.cos(pitch)-up*Math.sin(pitch);return head.clone().add(new Vec3(tx*Math.cos(yaw)+pz*Math.sin(yaw),py,-tx*Math.sin(yaw)+pz*Math.cos(yaw)));};
 const phase=(time+.47)%3.75,blink=phase<.10?1-smoothstep(0,.10,phase):0,open=clamp(1-blink-expression.squint*.35,.06,1),gaze=.016*Math.sin(clamp(options.eyeYaw??0,-.3,.3));
 const actingBlink=(1-open)/.94;
 const part=(g:SkinGeometry,color:string,material:SkinnedMesh['material']='humanSkin',x=0,y=0,z=0,sy=1)=>out.push({skin:g,boneMatrices:bones,position:point(x,y,z),rotation,scale:new Vec3(width,height*sy,1),color,material,...(g.morphs?{expression:[clamp(expression.smile,0,1),clamp(expression.mouthOpen,0,1),actingBlink,clamp(expression.browRaise,0,1)] as [number,number,number,number]}:{})});
 part(face,skin,'referenceSkin');part(stubble,'#736252');out.push(...arjanReferenceHair(head,yaw,tilt,options));

 for(const e of eyes){const offset=e.centre[1]*(1-open);part(e.white,'#d8d2c8','ceramic',0,offset,0,open);
  for(const [g,color,material] of [[e.iris,options.eye??'#493326','ceramic'],[e.pupil,'#211b19','hair']] as [SkinGeometry,string,SkinnedMesh['material']][]){part(g,color,material,0,offset,0,open);const mesh=out[out.length-1] as SkinnedMesh,t=gaze/(.016*Math.sin(.3));mesh.expression=[Math.max(0,t),Math.max(0,-t),0,0];}
 }
 for(const g of brows)part(g,options.hair??'#251e1d','groomedHair');
 part(mouth,'#4d302d','skin');part(upper,options.lip??'#a16d66','lip');part(lower,options.lip??'#a16d66','lip');
 for(const side of [-1,1])out.push({kind:'sphere',position:point(side*.110,-.026,-.007),rotation,scale:new Vec3(.027*width,.058*height,.037),color:skin,material:'humanSkin'});
 return out;
}
