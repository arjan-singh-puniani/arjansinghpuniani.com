import {Vec3,identity,smoothstep} from '../rendering/Math3D.js';
import type {RenderItem,SkinGeometry,SkinnedMesh} from '../rendering/Renderer.js';

export const TAYLOR_PALETTE={indigo:'#202d91',fur:'#ffe257',gold:'#e8b947',ink:'#202050',white:'#fffdf2'};
const rigidBones=new Float32Array(15*16);for(let i=0;i<15;i++)rigidBones.set(identity(),i*16);
type Point=[number,number,number];
type Tri=(a:Point,b:Point,c:Point)=>void;
function geometry(id:string,emit:(tri:Tri)=>void,smooth=false):SkinGeometry{
 const positions:number[]=[],normals:number[]=[],indices:number[]=[],weights:number[]=[];
 emit((a,b,c)=>{const n=Vec3.cross(Vec3.sub(new Vec3(...b),new Vec3(...a)),Vec3.sub(new Vec3(...c),new Vec3(...a)));if(n.len()<1e-8)return;n.normalize();for(const p of [a,b,c]){positions.push(...p);normals.push(n.x,n.y,n.z);indices.push(0,0,0,0);weights.push(1,0,0,0);}});
 if(smooth){
  const sums=new Map<string,Vec3>(),key=(i:number)=>positions.slice(i,i+3).map(n=>n.toFixed(6)).join(',');
  for(let i=0;i<positions.length;i+=3){const k=key(i),n=sums.get(k)??new Vec3();n.add(new Vec3(...normals.slice(i,i+3) as Point));sums.set(k,n);}
  for(let i=0;i<positions.length;i+=3){const n=sums.get(key(i))!.clone().normalize();normals[i]=n.x;normals[i+1]=n.y;normals[i+2]=n.z;}
 }
 return {id,positions:new Float32Array(positions),normals:new Float32Array(normals),boneIndices:new Float32Array(indices),boneWeights:new Float32Array(weights)};
}
// Monotone cubic radius interpolation avoids pinched chins and bulges between
// authored cross sections. The same profile projects the face graphics onto
// the skin surface, giving them actual cheek curvature rather than flat cards.
function profile(points:Point[],y:number):[number,number]{
 let i=0;while(i<points.length-2&&y>points[i+1][0])i++;
 const a=points[i],b=points[i+1],t=Math.max(0,Math.min(1,(y-a[0])/(b[0]-a[0])));
 return [1,2].map(k=>{
  const slope=(j:number)=>{if(j===0||j===points.length-1)return 0;const p=points[j-1],q=points[j],r=points[j+1],u=(q[k]-p[k])/(q[0]-p[0]),v=(r[k]-q[k])/(r[0]-q[0]);return u*v<=0?0:2*u*v/(u+v);};
  const d=b[0]-a[0];return (2*t**3-3*t*t+1)*a[k]+(t**3-2*t*t+t)*d*slope(i)+(-2*t**3+3*t*t)*b[k]+(t**3-t*t)*d*slope(i+1);
 }) as [number,number];
}
const faceProfile:Point[]=[[-.277,0,0],[-.270,.15,.118],[-.248,.279,.197],[-.211,.365,.240],[-.12,.424,.269],[.015,.412,.276],[.115,.394,.266],[.22,.33,.233],[.292,.18,.135],[.315,0,0]];
const surfaceZ=(x:number,y:number,depth:number)=>{const [rx,rz]=profile(faceProfile,y);return rz*Math.sqrt(Math.max(.001,1-(x/Math.max(.001,rx))**2))+depth;};
const face=geometry('taylor-reference-cheeks-v3',tri=>{
 const at=(r:number,i:number):Point=>{const y=-.277+r/36*.592,[rx,rz]=profile(faceProfile,y),a=i/48*Math.PI*2;return [Math.sin(a)*rx,y,Math.cos(a)*rz];};
 for(let r=0;r<36;r++)for(let i=0;i<48;i++){const a=at(r,i),b=at(r,i+1),c=at(r+1,i+1),d=at(r+1,i);tri(a,b,c);tri(a,c,d);}
},true);
const bobProfile:Point[]=[[-.35,.29,.205],[-.325,.365,.248],[-.245,.432,.292],[-.12,.449,.303],[.055,.445,.298],[.17,.414,.281],[.23,.353,.261]];
const hoodOpening=(y:number)=>.71+.40*Math.sin((y+.35)/.58*Math.PI);
const hood=geometry('taylor-cheek-framed-headdress-v3',tri=>{
 const at=(r:number,i:number):Point=>{const y=-.35+r/18*.58,[rx,rz]=profile(bobProfile,y),opening=hoodOpening(y),a=opening+i/48*(Math.PI*2-opening*2);return [Math.sin(a)*rx,y,Math.cos(a)*rz];};
 for(let r=0;r<18;r++)for(let i=0;i<48;i++){const a=at(r,i),b=at(r,i+1),c=at(r+1,i+1),d=at(r+1,i);tri(a,b,c);tri(a,c,d);}
 // Continue the lower bob around the neck instead of leaving an open gap
 // beneath the shortened chin. Outer vertices share the hood's sampled edge.
 for(const side of [-1,1]){
  const front=(r:number,i:number):Point=>{const edge=at(r,0),t=i/6,y=edge[1],innerX=.050+r/5*.020,innerZ=.10+r/5*.07;return [side*(innerX+(edge[0]-innerX)*t),y,innerZ+(edge[2]-innerZ)*t+.014*Math.sin(t*Math.PI)];};
  for(let r=0;r<5;r++)for(let i=0;i<6;i++){const a=front(r,i),b=front(r,i+1),c=front(r+1,i+1),d=front(r+1,i);if(side===1){tri(a,b,c);tri(a,c,d);}else{tri(a,c,b);tri(a,d,c);}}
 }
 for(let i=0;i<48;i++)tri([0,-.35,-.04],at(0,i+1),at(0,i));
 const bottom=Math.acos(.23/.34),rad=Math.sin(bottom),angles=Array.from({length:65},(_,i)=>i<=48?.71+i/48*(Math.PI*2-1.42):Math.PI*2-.71+(i-48)/16*1.42);
 const atCrown=(r:number,i:number):Point=>{const a=angles[i],t=r/12*bottom;return [.353/rad*Math.sin(t)*Math.sin(a),.34*Math.cos(t),.261/rad*Math.sin(t)*Math.cos(a)];};
 for(let r=0;r<12;r++)for(let i=0;i<64;i++){const a=atCrown(r,i),b=atCrown(r,i+1),c=atCrown(r+1,i+1),d=atCrown(r+1,i);tri(a,c,b);tri(a,d,c);}
},true);
const hairline=geometry('taylor-authored-hairline-v2',tri=>{
 const xs=[-.35,-.29,-.21,-.12,-.035,0,.035,.12,.21,.29,.35],ys=[.12,.18,.225,.237,.20,.235,.20,.237,.225,.18,.12];
 const pt=(i:number,upper:boolean):Point=>{const x=xs[i],y=upper?.285+Math.sqrt(Math.max(0,1-(x/.37)**2))*.022:ys[i];return [x,y,surfaceZ(x,Math.min(y,.284),.016)];};
 for(let i=0;i<xs.length-1;i++){const a=pt(i,false),b=pt(i+1,false),c=pt(i+1,true),d=pt(i,true);tri(a,b,c);tri(a,c,d);}
},true);
// Triangular prisms retain the reference's tall ears. The broad front
// planes, gold inlays and rear planes have their own normals and thickness.
const ears=geometry('taylor-solid-ears-v2',tri=>{
 for(const side of [-1,1]){
  const a:Point=[side*.375,.205,.083],b:Point=[side*.115,.26,.083],c:Point=[side*.254,.805,.025];
  const back=(p:Point):Point=>[p[0],p[1],p[2]-.125],aa=back(a),bb=back(b),cc=back(c);
  if(side===1){tri(a,c,b);tri(aa,bb,cc);}else{tri(a,b,c);tri(aa,cc,bb);}
  for(const [u,v] of [[a,b],[b,c],[c,a]]){const x=back(u),y=back(v);if(side===1){tri(u,y,x);tri(u,v,y);}else{tri(u,x,y);tri(u,y,v);}}
 }
});
const earInlays=geometry('taylor-gold-ear-insets-v2',tri=>{
 for(const side of [-1,1]){const a:Point=[side*.325,.294,.080],b:Point=[side*.16,.322,.080],c:Point=[side*.251,.705,.037];if(side===1)tri(a,c,b);else tri(a,b,c);}
});
const stripes=geometry('taylor-attached-headdress-stripes-v3',tri=>{
 for(const side of [-1,1])for(const base of [-.23,-.09,.045]){
  const at=(r:number,i:number):Point=>{const y=base+(r?-.016:.040)-i/8*.040,start=Math.max(.87,hoodOpening(y)+.012),a=start+i/8*(1.55-start),[rx,rz]=profile(bobProfile,y);return [side*Math.sin(a)*(rx+.007),y,Math.cos(a)*(rz+.007)];};
  for(let i=0;i<8;i++){const a=at(0,i),b=at(0,i+1),c=at(1,i+1),d=at(1,i);if(side===1){tri(a,c,b);tri(a,d,c);}else{tri(a,b,c);tri(a,c,d);}}
 }
});
// Subdivide graphic patches radially. A single triangle fan would cut below
// the convex face between its vertices and leave gold specks in the eye white.
function curvedPatch(tri:Tri,cx:number,cy:number,width:number,top:number,bottom:number,depth:number,rows=6,sectors=40){
 const at=(r:number,i:number):Point=>{const t=r/rows,a=i/sectors*Math.PI*2,x=cx+Math.cos(a)*width/2*t,v=Math.sin(a),y=cy+v*(v>0?top:bottom)*t;return [x,y,surfaceZ(x,y,depth)];};
 for(let r=0;r<rows;r++)for(let i=0;i<sectors;i++){const a=at(r,i),b=at(r,i+1),c=at(r+1,i+1),d=at(r+1,i);tri(a,d,c);tri(a,c,b);}
}
// Eye borders are authored as a nearly straight upper lid and an almond
// lower arc. Pupils are intersected with the white aperture, so their border
// stays clean under close inspection rather than painting over the eyeliner.
function eyeBounds(x:number,side:number,width:number,top:number,bottom:number):[number,number]{
 const u=(x-side*.183)/(width/2),arc=Math.sqrt(Math.max(0,1-u*u));
 return [.040-bottom*arc,.040+top*(1-u*u)];
}
function eyes(id:string,width:number,top:number,bottom:number,depth:number,pupil=false){
 return geometry(id,tri=>{
  for(const side of [-1,1]){
   const at=(col:number,row:number):Point=>{
    const u=-1+col/40*2,x=side*(pupil?.128:.183)+u*width/2;
    let low:number,high:number;
    if(pupil){const arc=Math.sqrt(Math.max(0,1-u*u)),white=eyeBounds(x,side,.281,.014,.059);low=Math.max(.040-bottom*arc,white[0]+.001);high=Math.min(.040+top*arc,white[1]-.001);}
    else [low,high]=eyeBounds(x,side,width,top,bottom);
    const y=low+(Math.max(low,high)-low)*row/6;return [x,y,surfaceZ(x,y,depth)];
   };
   for(let col=0;col<40;col++)for(let row=0;row<6;row++){const a=at(col,row),b=at(col+1,row),c=at(col+1,row+1),d=at(col,row+1);tri(a,b,c);tri(a,c,d);}
  }
 },true);
}
const eyeOutline=eyes('taylor-almond-eye-ink-v4',.305,.020,.071,.009),eyeWhite=eyes('taylor-almond-eye-white-v4',.281,.014,.059,.012),pupils=eyes('taylor-clipped-half-lidded-pupils-v4',.124,.024,.064,.015,true);
const eyelid=geometry('taylor-curved-upper-lids-v3',tri=>{for(const side of [-1,1])curvedPatch(tri,side*.183,.054,.306,.105,.008,.019);},true);
const eyeGlints=geometry('taylor-small-eye-catchlights-v4',tri=>{
 for(const side of [-1,1]){
  const x=side*.132,y=.029;
  curvedPatch(tri,x,y,.011,.005,.006,.027,3,16);
  curvedPatch(tri,side*.112,-.006,.005,.002,.002,.027,3,16);
 }
});
const eyeliner=geometry('taylor-swept-eyeliner-v1',tri=>{
 for(const side of [-1,1]){
  const at=(i:number,upper:boolean):Point=>{const u=-1+i/24*2,x=side*.183+u*.151,y=.054-.008*Math.sqrt(Math.max(0,1-u*u))+(upper?.004:-.003);return [x,y,surfaceZ(x,y,.024)];};
  for(let i=0;i<24;i++){const a=at(i,false),b=at(i+1,false),c=at(i+1,true),d=at(i,true);tri(a,b,c);tri(a,c,d);}
 }
});
const lashes=geometry('taylor-swept-lash-corners-v3',tri=>{
 for(const side of [-1,1]){
  const p=(x:number,y:number):Point=>[side*x,y,surfaceZ(side*x,y,.024)];
  const a=p(.322,.046),b=p(.361,.074),c=p(.338,.041);
  if(side===1)tri(a,c,b);else tri(a,b,c);
 }
});
function mouth(id:string,width:number,curve:number,asymmetry=0){return geometry(id,tri=>{
 const pt=(i:number,upper:boolean):Point=>{const x=-width+i/16*width*2,t=x/width,y=-.084+curve*(1-t*t)+asymmetry*t+(upper?.0045:-.0045);return [x,y,surfaceZ(x,y,.010)];};
 for(let i=0;i<16;i++){const a=pt(i,false),b=pt(i+1,false),c=pt(i+1,true),d=pt(i,true);tri(a,b,c);tri(a,c,d);}
});}
const frown=mouth('taylor-reference-frown-v4',.078,.038),smirk=mouth('taylor-confident-smile-v2',.075,-.009,.008),smile=mouth('taylor-warm-smile-v4',.089,-.027);
const crest=geometry('taylor-cobra-crest-v2',tri=>{
 const outline:Point[]=[[-.037,.283,.276],[-.047,.337,.268],[-.039,.382,.255],[0,.402,.246],[.039,.382,.255],[.047,.337,.268],[.037,.283,.276],[0,.254,.282]];
 const center:Point=[0,.335,.291];for(let i=0;i<outline.length;i++)tri(center,outline[(i+1)%outline.length],outline[i]);
},true);
export const TAYLOR_GEOMETRY={face,hood,hairline,ears,earInlays,stripes,eyeOutline,eyeWhite,pupils,eyelid,eyeGlints,eyeliner,lashes,frown,smirk,smile,crest};

export function taylorHeadMeshes(head:Vec3,yaw:number,tilt:number,expression:{smile:number;mouthOpen:number;squint:number;browRaise:number},time:number):RenderItem[]{
 const out:RenderItem[]=[],right=new Vec3(Math.cos(yaw),0,-Math.sin(yaw)),forward=new Vec3(Math.sin(yaw),0,Math.cos(yaw));
 const point=(x:number,y:number,z:number)=>head.clone().add(right.clone().scale(x*Math.cos(tilt)-y*Math.sin(tilt))).add(new Vec3(0,x*Math.sin(tilt)+y*Math.cos(tilt),0)).add(forward.clone().scale(z));
 const piece=(skin:SkinGeometry,color:string,unlit=false,y=0,scaleY=1,material:SkinnedMesh['material']='matte')=>out.push({skin,boneMatrices:rigidBones,position:point(0,y,0),rotation:new Vec3(0,yaw,tilt),scale:new Vec3(1,scaleY,1),color,material,unlit});
 piece(face,TAYLOR_PALETTE.fur,false,0,1,'skin');piece(hood,TAYLOR_PALETTE.indigo);piece(hairline,TAYLOR_PALETTE.indigo);piece(ears,TAYLOR_PALETTE.indigo);piece(earInlays,TAYLOR_PALETTE.fur);piece(stripes,TAYLOR_PALETTE.fur);
 const phase=(time+.47)%3.75,blink=phase<.10?1-smoothstep(0,.10,phase):0,open=Math.max(.065,1-blink-expression.squint*.35);
 const lidLift=expression.browRaise*.008;
 piece(eyeOutline,TAYLOR_PALETTE.ink,true,.040*(1-open),open);piece(eyeWhite,TAYLOR_PALETTE.white,true,.040*(1-open),open);piece(pupils,TAYLOR_PALETTE.ink,true,.040*(1-open),open);piece(eyeGlints,TAYLOR_PALETTE.white,true,.040*(1-open),open);piece(eyelid,'#bd9b3d',false,lidLift);piece(eyeliner,TAYLOR_PALETTE.ink,true,lidLift);piece(lashes,TAYLOR_PALETTE.ink,true);
 // The reference's skeptical resting mouth gives way to the real social
 // expression when warmth or celebration rises, rather than a permanent grin.
 piece(expression.smile>.35?smile:expression.smile>.24?smirk:frown,TAYLOR_PALETTE.ink,true);piece(crest,TAYLOR_PALETTE.gold,false,0,1,'metal');
 out.push({kind:'sphere',position:point(0,.351,.294),rotation:new Vec3(0,yaw,tilt),scale:new Vec3(.049,.050,.021),color:TAYLOR_PALETTE.gold,material:'metal'});
 for(const side of [-1,1]){
  out.push({kind:'sphere',position:point(side*.012,.353,.3065),rotation:new Vec3(0,yaw,tilt),scale:new Vec3(.010,.008,.004),color:TAYLOR_PALETTE.ink,unlit:true});
  out.push({kind:'sphere',position:point(side*.392,-.190,.148),rotation:new Vec3(0,yaw,tilt),scale:new Vec3(.022,.020,.019),color:TAYLOR_PALETTE.gold,material:'metal'},
   {kind:'torus',position:point(side*.392,-.226,.156),rotation:new Vec3(0,yaw,tilt),scale:new Vec3(.052,.066,.017),color:TAYLOR_PALETTE.gold,material:'metal'},
   {kind:'sphere',position:point(side*.392,-.282,.157),rotation:new Vec3(0,yaw,tilt),scale:new Vec3(.033,.043,.023),color:'#308d99',material:'ceramic'});
 }
 out.push({kind:'cone',position:point(0,.300,.294),rotation:new Vec3(0,yaw,tilt),scale:new Vec3(.022,.054,.014),color:TAYLOR_PALETTE.gold,material:'metal'});
 if(expression.mouthOpen>.18)out.push({kind:'sphere',position:point(0,-.078,surfaceZ(0,-.078,.012)),rotation:new Vec3(0,yaw,tilt),scale:new Vec3(.050,.020+expression.mouthOpen*.028,.009),color:TAYLOR_PALETTE.ink,unlit:true});
 return out;
}
const tailPoint=(t:number)=>new Vec3(.50*Math.sin(t*1.3),-.065-.17*Math.sin(t*Math.PI),-.16-.27*Math.sin(t*Math.PI/2));
const tailGeometry=(gold:boolean)=>geometry(`taylor-smooth-tail-${gold?'gold':'indigo'}-v2`,tri=>{
 const at=(r:number,i:number):Point=>{const t=r/60,c=tailPoint(t),d=Vec3.sub(tailPoint(Math.min(1,t+.001)),tailPoint(Math.max(0,t-.001))).normalize(),x=Vec3.cross(d,new Vec3(0,1,0)).normalize(),y=Vec3.cross(x,d).normalize(),a=i/16*Math.PI*2,radius=.034-t*.006;const p=c.add(x.scale(Math.cos(a)*radius)).add(y.scale(Math.sin(a)*radius));return [p.x,p.y,p.z];};
 for(let r=0;r<60;r++)if((r>=54||Math.floor(r/6)%4>=2)===gold)for(let i=0;i<16;i++){const a=at(r,i),b=at(r,i+1),c=at(r+1,i+1),d=at(r+1,i);tri(a,c,b);tri(a,d,c);}
 if(gold){
  const end=tailPoint(1),axis=Vec3.sub(end,tailPoint(.999)).normalize(),x=Vec3.cross(axis,new Vec3(0,1,0)).normalize(),y=Vec3.cross(x,axis).normalize();
  const cap=(r:number,i:number):Point=>{const theta=r/6*Math.PI/2,a=i/16*Math.PI*2,p=end.clone().add(axis.clone().scale(Math.sin(theta)*.028)).add(x.clone().scale(Math.cos(theta)*Math.cos(a)*.028)).add(y.clone().scale(Math.cos(theta)*Math.sin(a)*.028));return [p.x,p.y,p.z];};
  for(let r=0;r<6;r++)for(let i=0;i<16;i++){const a=cap(r,i),b=cap(r,i+1),c=cap(r+1,i+1),d=cap(r+1,i);tri(a,c,b);tri(a,d,c);}
 }
},true);
const tailGold=tailGeometry(true),tailIndigo=tailGeometry(false);
export const TAYLOR_TAIL_GEOMETRY={tailGold,tailIndigo};
export function taylorTailMeshes(pelvis:Vec3,yaw:number,time:number,speed:number):RenderItem[]{
 const rotation=new Vec3(0,yaw+Math.sin(time*2.1)*(.025+Math.min(.04,speed*.015)),0);
 return [tailGold,tailIndigo].map(skin=>({skin,boneMatrices:rigidBones,position:pelvis.clone(),rotation,scale:new Vec3(1,1,1),color:skin===tailGold?TAYLOR_PALETTE.fur:TAYLOR_PALETTE.indigo,material:'skin'}));
}
