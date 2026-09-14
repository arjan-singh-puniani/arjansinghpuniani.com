import assert from 'node:assert/strict';
import {Character} from '../dist/entities/Character.js';
import {Navigation} from '../dist/world/Navigation.js';
import {Vec3,transformPoint,compose} from '../dist/rendering/Math3D.js';
const results=[];
for(const id of ['coach','mika','leo','nia'])for(const hz of [30,60,120]){
 const c=new Character({id,name:id,role:'member',shirt:'#888888',skin:'#c99977',hair:'#333333',playStyle:'test',goal:'test'},new Vec3(0,0,0),new Navigation(),{});
 c.path=[new Vec3(0,0,3),new Vec3(3,0,3),new Vec3(3,0,0)];
 let previous=null,slide=0,jump=0,height=0,maxSpeed=0,states=new Set();
 for(let i=0;i<hz*14;i++){
  const root=c.position.clone();c.update(1/hz);const k=c.debugKinematics();states.add(c.state);
  maxSpeed=Math.max(maxSpeed,Vec3.sub(root,c.position).len()*hz);
  for(const side of ['left','right']){
   const f=k[side+'Foot'];assert(Number.isFinite(f.x+f.y+f.z));assert(f.y>=.085,'Shoe below ground');height=Math.max(height,f.y);
   if(previous){const d=Vec3.sub(f,previous[side+'Foot']).len();jump=Math.max(jump,d);if(k[side+'FootPlanted']&&previous[side+'FootPlanted'])slide=Math.max(slide,d);}
  }
  if(i%hz===0){
   const mesh=c.meshes().find(m=>m.skin?.id==='char-pants-v1');
   for(const [bone,point,foot] of [[12,new Vec3(-.17,.11,.08),k.leftFoot],[14,new Vec3(.17,.11,.08),k.rightFoot]]){
    const local=transformPoint(mesh.boneMatrices.slice(bone*16,bone*16+16),point),world=transformPoint(compose(mesh.position,mesh.rotation),local);
    assert(Math.hypot(world.x-foot.x,world.y-foot.y,world.z-foot.z)<.0001,'Trouser ankle detached from shoe');
   }
  }
  previous=k;
 }
 assert(Vec3.sub(c.position,new Vec3(3,0,0)).len()<.001,'Route did not finish');
 assert(!states.has('jog'),'Unexpected jogging');assert(slide<.00001,'Planted foot slid');assert(jump<7.5/hz+.01,`Foot discontinuity ${jump}`);assert(maxSpeed<=c.speed+.001);assert(height>.15&&height<.23);
 results.push({id,hz,slide,maxFootFrameDistance:jump,maxSpeed});
}
console.log(JSON.stringify(results,null,2));console.log('12 walking scenarios passed (four members, three update rates, starts, corners and stops).');

const nav=new Navigation([{x:0,z:0,w:2,d:2}]);
const start=new Vec3(-3,0,-2),path=nav.path(start,new Vec3(3,0,2));assert(path.length);
let prev=start;for(const end of path){for(let t=0;t<=1;t+=.002){const v=Vec3.lerp(prev,end,t);assert(!nav.isBlocked(v.x,v.z),'Smoothed route clips furniture');}prev=end;}
assert.equal(new Navigation().path(new Vec3(0,0,0),new Vec3(.1,0,0)).length,1,'Small destination discarded');
console.log('Obstacle clearance, small destinations and animated ankle attachment passed.');
