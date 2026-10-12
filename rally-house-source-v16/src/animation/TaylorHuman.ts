import {Vec3,identity,clamp,smoothstep} from '../rendering/Math3D.js';
import type {RenderItem,SkinGeometry,SkinnedMesh} from '../rendering/Renderer.js';

type Point=[number,number,number];
type Tri=(a:Point,b:Point,c:Point)=>void;
const bones=new Float32Array(15*16);for(let i=0;i<15;i++)bones.set(identity(),i*16);

// Cached, authored surfaces. The head is attached to the same world landmark
// as the body; facial acting changes transforms, never the skeleton.
function surface(id:string,emit:(tri:Tri)=>void,smooth=true):SkinGeometry{
 const p:number[]=[],n:number[]=[],bi:number[]=[],bw:number[]=[];
 emit((a,b,c)=>{const normal=Vec3.cross(Vec3.sub(new Vec3(...b),new Vec3(...a)),Vec3.sub(new Vec3(...c),new Vec3(...a)));if(normal.len()<1e-10)return;normal.normalize();for(const v of [a,b,c]){p.push(...v);n.push(normal.x,normal.y,normal.z);bi.push(0,0,0,0);bw.push(1,0,0,0);}});
 if(smooth){const sums=new Map<string,Vec3>(),key=(i:number)=>p.slice(i,i+3).map(v=>v.toFixed(7)).join(',');for(let i=0;i<p.length;i+=3){const k=key(i),v=sums.get(k)??new Vec3();v.add(new Vec3(...n.slice(i,i+3) as Point));sums.set(k,v);}for(let i=0;i<p.length;i+=3){const v=sums.get(key(i))!.clone().normalize();n[i]=v.x;n[i+1]=v.y;n[i+2]=v.z;}}
 return {id,positions:new Float32Array(p),normals:new Float32Array(n),boneIndices:new Float32Array(bi),boneWeights:new Float32Array(bw)};
}

const profile:Point[]=[[-.177,0,0],[-.166,.032,.043],[-.142,.066,.067],[-.107,.087,.077],[-.062,.107,.088],[-.005,.114,.096],[.052,.113,.099],[.108,.096,.087],[.155,.052,.047],[.175,0,0]];
function radius(y:number):[number,number]{
 let i=0;while(i<profile.length-2&&y>profile[i+1][0])i++;
 const a=profile[i],b=profile[i+1],t=clamp((y-a[0])/(b[0]-a[0]),0,1),d=b[0]-a[0];
 return [1,2].map(k=>{const slope=(j:number)=>{if(j===0||j===profile.length-1)return 0;const p=profile[j-1],q=profile[j],r=profile[j+1],u=(q[k]-p[k])/(q[0]-p[0]),v=(r[k]-q[k])/(r[0]-q[0]);return u*v<=0?0:2*u*v/(u+v);};return (2*t*t*t-3*t*t+1)*a[k]+(t*t*t-2*t*t+t)*d*slope(i)+(-2*t*t*t+3*t*t)*b[k]+(t*t*t-t*t)*d*slope(i+1);}) as [number,number];
}
const gaussian=(x:number,y:number,cx:number,cy:number,rx:number,ry:number)=>Math.exp(-(((x-cx)/rx)**2)-((y-cy)/ry)**2);
function relief(x:number,y:number){
 return .011*gaussian(x,y,0,.004,.012,.058)+.024*gaussian(x,y,0,-.034,.016,.016)
 +.006*gaussian(x,y,-.073,-.028,.025,.028)+.006*gaussian(x,y,.073,-.028,.025,.028)
 -.006*gaussian(x,y,-.048,.018,.030,.015)-.006*gaussian(x,y,.048,.018,.030,.015)
 +.004*gaussian(x,y,0,-.095,.034,.022);
}
export function humanFaceDepth(x:number,y:number){const [rx,rz]=radius(y);return rz*Math.sqrt(Math.max(0,1-(x/Math.max(.00001,rx))**2))+relief(x,y);}
const face=surface('taylor-human-sculpted-face-v1',tri=>{
 const at=(r:number,i:number):Point=>{const y=-.177+r/48*.352,[rx,rz]=radius(y),angle=i/64*Math.PI*2,x=Math.sin(angle)*rx,c=Math.cos(angle);return r===0||r===48?[0,y,0]:[x,y,c*rz+(c>0?relief(x,y)*Math.pow(c,6):0)];};
 for(let r=0;r<48;r++)for(let i=0;i<64;i++){const a=at(r,i),b=at(r,i+1),c=at(r+1,i+1),d=at(r+1,i);tri(a,b,c);tri(a,c,d);}
});

const eyeY=.018,eyeX=.048,eyeWidth=.028,eyeHeight=.0095;
const aperture=(u:number)=>Math.pow(Math.max(0,1-u*u),.72);
const eyePoint=(x:number,y:number,offset:number):Point=>[x,y,humanFaceDepth(x,y)+offset];
function eyePatch(id:string,shape:(u:number,v:number,side:number)=>[number,number],offset:number){return surface(id,tri=>{
 for(const side of [-1,1])for(let r=0;r<6;r++)for(let i=0;i<40;i++){
  const at=(row:number,col:number):Point=>{const angle=col/40*Math.PI*2,[x,y]=shape(Math.cos(angle)*row/6,Math.sin(angle)*row/6,side);return eyePoint(x,y,offset);};
  const a=at(r,i),b=at(r+1,i),c=at(r+1,i+1),d=at(r,i+1);tri(a,b,c);tri(a,c,d);
 }
},false);}
const eyeWhite=eyePatch('taylor-human-almond-sclera-v1',(u,v,side)=>[side*eyeX+u*eyeWidth,eyeY+v*eyeHeight*aperture(u)+u*side*.002],.0035);
const iris=eyePatch('taylor-human-iris-v1',(u,v,side)=>[side*eyeX+u*.0072,eyeY+v*.0082],.0052);
const pupil=eyePatch('taylor-human-pupil-v1',(u,v,side)=>[side*eyeX+u*.0034,eyeY+v*.0061],.0062);

function ribbon(id:string,path:(t:number)=>[number,number],width:number,offset:number){return surface(id,tri=>{
 for(let i=0;i<36;i++){
  const at=(j:number,side:number):Point=>{const [x,y]=path(j/36),[x1,y1]=path(clamp(j/36+.001,0,1)),[x0,y0]=path(clamp(j/36-.001,0,1)),dx=x1-x0,dy=y1-y0,l=Math.hypot(dx,dy)||1,px=x-side*dy/l*width,py=y+side*dx/l*width;return eyePoint(px,py,offset);};
  const a=at(i,-1),b=at(i+1,-1),c=at(i+1,1),d=at(i,1);tri(a,b,c);tri(a,c,d);
 }
},false);}
const lids=[-1,1].map(side=>ribbon(`taylor-human-lid-${side}-v1`,t=>{const u=t*2-1;return [side*eyeX+u*eyeWidth,eyeY+eyeHeight*aperture(u)+u*side*.002];},.0012,.0047));
const brows=[-1,1].map(side=>ribbon(`taylor-human-brow-${side}-v1`,t=>[side*(.020+t*.064),.045+.009*Math.sin(t*Math.PI)-t*.002],.0023,.0035));
function lips(id:string,smile:number,upper:boolean){return surface(id,tri=>{
 const at=(i:number,j:number):Point=>{const u=-1+i/40*2,t=j/5,x=u*.030,envelope=Math.pow(Math.max(0,1-u*u),.65),seam=-.088+smile*u*u*.007,height=upper?(.004+ .003*Math.exp(-(((Math.abs(u)-.3)/.2)**2))):.007,y=seam+(upper?1:-1)*height*envelope*t,z=humanFaceDepth(x,y)+.003+.004*envelope*Math.sin(Math.PI*t);return [x,y,z];};
 for(let i=0;i<40;i++)for(let j=0;j<5;j++){const a=at(i,j),b=at(i+1,j),c=at(i+1,j+1),d=at(i,j+1);if(upper){tri(a,b,c);tri(a,c,d);}else{tri(a,c,b);tri(a,d,c);}}
});}
const upperLip=lips('taylor-human-upper-lip-v1',0,true),lowerLip=lips('taylor-human-lower-lip-v1',0,false),smileUpper=lips('taylor-human-smiling-upper-lip-v1',1,true),smileLower=lips('taylor-human-smiling-lower-lip-v1',1,false);
const seam=ribbon('taylor-human-lip-seam-v1',t=>[(t*2-1)*.028,-.088],.0007,.0045);
const mouthGap=surface('taylor-human-mouth-opening-v1',tri=>{
 const point=(r:number,i:number):Point=>{const a=i/32*Math.PI*2,x=Math.cos(a)*r/4*.027,y=-.088+Math.sin(a)*r/4*.008;return eyePoint(x,y,.0035);};
 for(let r=0;r<4;r++)for(let i=0;i<32;i++){const a=point(r,i),b=point(r+1,i),c=point(r+1,i+1),d=point(r,i+1);tri(a,b,c);tri(a,c,d);}
},false);

const cap=surface('taylor-human-swept-hair-cap-v1',tri=>{
 const at=(r:number,i:number):Point=>{const angle=i/64*Math.PI*2,front=(1+Math.cos(angle))*.5,edge=-.046+.129*Math.pow(front,3)+.006*Math.sin(angle*2),y=edge+(.202-edge)*r/24,phi=clamp((y+.009)/.211,0,1),wave=r===24?0:Math.sqrt(Math.max(0,1-phi*phi)),x=Math.sin(angle)*.122*wave,z=Math.cos(angle)*.110*wave-.011;return [x,y,z];};
 for(let r=0;r<24;r++)for(let i=0;i<64;i++){const a=at(r,i),b=at(r,i+1),c=at(r+1,i+1),d=at(r+1,i);tri(a,b,c);tri(a,c,d);}
});
function lock(id:string,points:Point[],radii:number[]){return surface(id,tri=>{
 const sample=(t:number)=>{const u=t*(points.length-1),i=Math.min(points.length-2,Math.floor(u)),v=u-i,a=points[Math.max(0,i-1)],b=points[i],c=points[i+1],d=points[Math.min(points.length-1,i+2)],p=new Vec3(...[0,1,2].map(k=>.5*((2*b[k])+(-a[k]+c[k])*v+(2*a[k]-5*b[k]+4*c[k]-d[k])*v*v+(-a[k]+3*b[k]-3*c[k]+d[k])*v*v*v)) as Point);return {p,r:radii[i]+(radii[i+1]-radii[i])*v};};
 const at=(r:number,i:number):Point=>{const t=r/40,{p,c,radius}=(()=>{const s=sample(t);return {p:s.p,c:Vec3.sub(sample(Math.min(1,t+.002)).p,sample(Math.max(0,t-.002)).p).normalize(),radius:s.r};})(),z=new Vec3(0,0,1);z.sub(c.clone().scale(Vec3.dot(z,c))).normalize();const x=Vec3.cross(c,z).normalize(),a=i/20*Math.PI*2,v=p.add(x.scale(Math.cos(a)*radius)).add(z.scale(Math.sin(a)*radius*.72));return [v.x,v.y,v.z];};
 for(let r=0;r<40;r++)for(let i=0;i<20;i++){const a=at(r,i),b=at(r,i+1),c=at(r+1,i+1),d=at(r+1,i);tri(a,c,b);tri(a,d,c);}
},true);}
const ponytail=lock('taylor-human-athletic-ponytail-v1',[[0,.123,-.085],[.018,.082,-.159],[.030,-.015,-.183],[.020,-.134,-.157],[.038,-.267,-.131],[.060,-.349,-.113]],[.026,.032,.030,.025,.018,0]);
const sweep=lock('taylor-human-side-part-v1',[[-.009,.166,.065],[-.052,.126,.099],[-.095,.076,.074],[-.115,.002,.029],[-.111,-.068,.006]],[0,.015,.013,.009,0]);
const fineSweep=lock('taylor-human-temple-strand-v1',[[.079,.095,.076],[.112,.025,.031],[.112,-.045,.018],[.103,-.096,.015]],[0,.006,.005,0]);

export const HUMAN_TAYLOR_GEOMETRY={face,eyeWhite,iris,pupil,upperLip,lowerLip,smileUpper,smileLower,seam,mouthGap,cap,ponytail,sweep,fineSweep,...Object.fromEntries(lids.map((g,i)=>[`lid${i}`,g])),...Object.fromEntries(brows.map((g,i)=>[`brow${i}`,g]))};

export function humanTaylorHead(head:Vec3,yaw:number,tilt:number,expression:{smile:number;mouthOpen:number;squint:number;browRaise:number},time:number,skin:string):RenderItem[]{
 const out:RenderItem[]=[],right=new Vec3(Math.cos(yaw),0,-Math.sin(yaw)),forward=new Vec3(Math.sin(yaw),0,Math.cos(yaw));
 const point=(x:number,y:number,z:number)=>head.clone().add(right.clone().scale(x*Math.cos(tilt)-y*Math.sin(tilt))).add(new Vec3(0,x*Math.sin(tilt)+y*Math.cos(tilt),0)).add(forward.clone().scale(z));
 const part=(geometry:SkinGeometry,color:string,material:SkinnedMesh['material']='skin',y=0,sy=1,unlit=false)=>out.push({skin:geometry,boneMatrices:bones,position:point(0,y,0),rotation:new Vec3(0,yaw,tilt),scale:new Vec3(1,sy,1),color,material,unlit});
 part(face,skin);for(const g of [cap,ponytail,sweep,fineSweep])part(g,'#251e1d','hair');
 const phase=(time+.47)%3.75,blink=phase<.10?1-smoothstep(0,.10,phase):0,open=clamp(1-blink-expression.squint*.35,.06,1),offset=eyeY*(1-open);
 part(eyeWhite,'#eee9e0','ceramic',offset,open);part(iris,'#684b35','hair',offset,open,true);part(pupil,'#231d1c','hair',offset,open,true);
 for(const g of lids)part(g,'#34221f','hair',offset,open);
 for(const g of brows)part(g,'#332420','hair',expression.browRaise*.003);
 const smiling=expression.smile>.3,mouth=clamp(expression.mouthOpen,0,1),gapScale=Math.max(.03,mouth);
 part(mouthGap,'#5a3835','skin',-.088*(1-gapScale),gapScale);part(smiling?smileUpper:upperLip,'#b87570','skin',mouth*.002);part(smiling?smileLower:lowerLip,'#c1847a','skin',-mouth*.010);part(seam,'#704943','skin',-mouth*.004);
 for(const side of [-1,1]){
  const x=side*eyeX-.001,y=eyeY+.002;out.push({kind:'sphere',position:point(x,eyeY+(y-eyeY)*open,humanFaceDepth(x,y)+.008),rotation:new Vec3(0,yaw,tilt),scale:new Vec3(.003,.003*open,.0015),color:'#fff5dc',unlit:true,noShadow:true});
  out.push({kind:'sphere',position:point(side*.110,-.026,-.007),rotation:new Vec3(0,yaw,tilt),scale:new Vec3(.027,.058,.037),color:skin,material:'skin'});
 }
 out.push({kind:'torus',position:point(.003,.123,-.105),rotation:new Vec3(Math.PI/2,yaw,tilt),scale:new Vec3(.066,.057,.012),color:'#cedb68',material:'fabric'});
 return out;
}
