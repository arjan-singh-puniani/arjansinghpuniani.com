import {Vec3,identity,rigidFrame,scaling,multiply,clamp} from '../rendering/Math3D.js';
import {DetailBatch} from '../rendering/DetailGeometry.js';
import type {RenderItem,SkinnedMesh} from '../rendering/Renderer.js';

export interface GallerySeat {id:string;x:number;y:number;z:number;yaw:number;group:number;}
export const GALLERY_SEATS:GallerySeat[]=[
 ...Array.from({length:6},(_,i)=>({id:`north-${i}`,x:-2.35+i*1.3,y:.48,z:-7.45,yaw:0,group:Math.floor(i/3)})),
 ...Array.from({length:6},(_,i)=>({id:`west-rear-${i}`,x:-5.85,y:.82,z:-4.1+i*1.6,yaw:Math.PI/2,group:2+Math.floor(i/3)})),
 ...Array.from({length:6},(_,i)=>({id:`west-${i}`,x:-4.9,y:.48,z:-4.1+i*1.6,yaw:Math.PI/2,group:4+Math.floor(i/3)})),
 ...[-4.8,-3.5,-2.2,-.9,.4,4].map((z,i)=>({id:`east-${i}`,x:6.8,y:.48,z,yaw:-Math.PI/2,group:6+Math.floor(i/3)})),
];
const tones=['#b57e5d','#dfb08c','#855f4d','#c7916f'];
const shirts=['#658a7b','#b37d62','#4c6c86','#b3a57a','#7f6b80','#d4c2a2'];
const hairColors=['#332b27','#6b4c36','#b19468'];
const glyphs:Record<string,string>={A:'01110/10001/10001/11111/10001/10001/10001',C:'01111/10000/10000/10000/10000/10000/01111',E:'11111/10000/10000/11110/10000/10000/11111',H:'10001/10001/10001/11111/10001/10001/10001',I:'111/010/010/010/010/010/111',L:'10000/10000/10000/10000/10000/10000/11111',M:'10001/11011/10101/10101/10001/10001/10001',N:'10001/11001/11001/10101/10011/10011/10001',O:'01110/10001/10001/10001/10001/10001/01110',R:'11110/10001/10001/11110/10100/10010/10001',S:'01111/10000/10000/01110/00001/00001/11110',T:'11111/00100/00100/00100/00100/00100/00100',U:'10001/10001/10001/10001/10001/10001/01110',V:'10001/10001/10001/10001/10001/01010/00100',Y:'10001/10001/01010/00100/00100/00100/00100'};
const at=(s:GallerySeat,p:Vec3)=>new Vec3(s.x+Math.cos(s.yaw)*p.x+Math.sin(s.yaw)*p.z,s.y+p.y,s.z-Math.sin(s.yaw)*p.x+Math.cos(s.yaw)*p.z);

/** Tournament dressing on the same court. No physics, reservations or save state. */
export class ChampionshipArena {
 readonly staticMeshes:SkinnedMesh[]=[];
 private armMeshes:SkinnedMesh[]=[];
 private age=10;private clock=0;private winner:'player'|'opponent'='player';
 constructor(){
  const batches=new Map<string,DetailBatch>();
  const batch=(color:string,material:SkinnedMesh['material']='fabric')=>{const key=`${color}-${material}`;let b=batches.get(key);if(!b){b=new DetailBatch(`championship-gallery-${key}-v1`,color,material);batches.set(key,b);}return b;};
  const seats=batch('#55756a'),hardware=batch('#53645d','metal'),trousers=batch('#4c5654'),shoes=batch('#e5e5d9');
  for(const [i,s] of GALLERY_SEATS.entries()){
   const side=Math.abs(s.yaw)>.1,skin=batch(tones[s.group%tones.length],'skin'),shirt=batch(shirts[i%shirts.length]),hair=batch(hairColors[(i*7)%3],'hair'),dark=batch('#302d2b','hair');
   seats.box(at(s,new Vec3(0,-.025,0)),new Vec3(side?.46:.50,.055,side?.50:.46));seats.box(at(s,new Vec3(0,.24,-.205)),new Vec3(side?.065:.50,.43,side?.50:.065));
   for(const x of [-.18,.18])for(const z of [-.15,.15])hardware.rod(at(s,new Vec3(x,-.02,z)),at(s,new Vec3(x,-.44,z)),.018,0,6);
   shirt.ellipsoid(at(s,new Vec3(0,.32,.012)),new Vec3(side?.12:.17,.28,side?.17:.12),0,10,14);
   skin.rod(at(s,new Vec3(0,.56,0)),at(s,new Vec3(0,.73,0)),.043);skin.ellipsoid(at(s,new Vec3(0,.82,.008)),new Vec3(.101,.139,.103),0,10,14);
   hair.ellipsoid(at(s,new Vec3(0,.885,-.025)),new Vec3(.107,.095,.103),0,8,12);
   if(i%3===1)hair.ellipsoid(at(s,new Vec3(0,.81,-.097)),new Vec3(.080,.16,.055));
   if(i%4===0)hair.ellipsoid(at(s,new Vec3(0,.91,-.09)),new Vec3(.062,.065,.062));
   for(const x of [-.039,.039])dark.ellipsoid(at(s,new Vec3(x,.834,.103)),new Vec3(.012,.009,.008),0,4,6);
   skin.ellipsoid(at(s,new Vec3(0,.805,.114)),new Vec3(.017,.022,.019),0,5,8);
   for(const x of [-.10,.10]){const hip=at(s,new Vec3(x,.045,0)),knee=at(s,new Vec3(x,-.045,.31)),foot=at(s,new Vec3(x,-.43,.36));trousers.rod(hip,knee,.065,0,8,.055);trousers.rod(knee,foot,.049,0,8,.034);shoes.ellipsoid(at(s,new Vec3(x,-.435,.405)),new Vec3(side?.12:.065,.045,side?.065:.12),0,6,10);}
  }
  // A raised west tier and north backboard leave the equipment displays clear.
  const deck=batch('#a18363','wood'),board=batch('#254c43'),letter=batch('#ede9d8');
  deck.box(new Vec3(-5.85,.215,-.1),new Vec3(1.02,.34,9.2));
  board.box(new Vec3(1,.30,-6.85),new Vec3(8.8,.43,.10));
  const label=(word:string,x:number,y:number,unit:number)=>{let cursor=x;for(const c of word){const rows=glyphs[c]?.split('/');if(rows){for(let row=0;row<7;row++)for(let col=0;col<rows[row].length;col++)if(rows[row][col]==='1')letter.box(new Vec3(cursor+col*unit,y-row*unit,-6.785),new Vec3(unit*.84,unit*.84,.012));cursor+=(rows[0].length+1)*unit;}else cursor+=3*unit;}};
  label('RALLY HOUSE',-2.94,.42,.034);label('VECTORCOURT',.05,.42,.023);label('ANATOMYMOTION',2.43,.42,.023);
  for(const b of batches.values())this.staticMeshes.push({...b.finish(),id:'spectatorRow'});
  // Three guests per material batch, four real segment transforms per guest.
  // This keeps 24 spectators to eight animated draws instead of hundreds.
  for(let group=0;group<8;group++){
   const b=new DetailBatch(`championship-gallery-arms-${group}-v1`,tones[group%tones.length],'skin');
   for(let person=0;person<3;person++)for(let side=0;side<2;side++){const bone=person*4+side*2;b.rod(new Vec3(),new Vec3(0,.27,0),.040,bone,8,.032);b.rod(new Vec3(),new Vec3(0,.25,0),.032,bone+1,8,.025);b.ellipsoid(new Vec3(0,.27,0),new Vec3(.036,.056,.028),bone+1,6,8);}
   this.armMeshes.push({...b.finish(),boneMatrices:new Float32Array(15*16),id:'spectatorRow'});
  }
 }
 begin(){this.age=10;this.clock=0;}
 react(winner:'player'|'opponent'){this.winner=winner;this.age=0;}
 meshes(dt:number,focus:number,reducedMotion:boolean):RenderItem[]{
  if(focus<.005)return [];
  this.clock+=dt;this.age=Math.min(10,this.age+dt);
  const applause=reducedMotion?0:Math.max(0,1-this.age/2.4);
  for(let group=0;group<8;group++){
   const bones=this.armMeshes[group].boneMatrices;for(let i=0;i<15;i++)bones.set(identity(),i*16);
   for(const [person,s] of GALLERY_SEATS.filter(s=>s.group===group).entries())for(let side=0;side<2;side++){
    const sign=side===0?-1:1,delay=(group%3)*.11,pulse=applause*(this.age>delay?1:0),close=.5+.5*Math.sin(Math.max(0,this.age-delay)*17+(this.winner==='player'?0:.4));
    const shoulder=at(s,new Vec3(sign*.16,.52,.008)),elbow=at(s,new Vec3(sign*(.19-pulse*.05),.27+pulse*.02,.09+pulse*.12)),hand=at(s,new Vec3(sign*(.12*(1-pulse)+pulse*(.026+.11*close)),.105+pulse*.40,.30+pulse*.04));
    for(const [index,a,b,rest] of [[person*4+side*2,shoulder,elbow,.27],[person*4+side*2+1,elbow,hand,.25]] as const)bones.set(multiply(rigidFrame(a,b,new Vec3(Math.sin(s.yaw),0,Math.cos(s.yaw))),scaling(new Vec3(1,Vec3.sub(b,a).len()/rest,1))),index*16);
   }
  }
  const alpha=clamp(focus*1.01,0,1);
  return [...this.staticMeshes,...this.armMeshes].map(m=>({...m,alpha}));
 }
}
