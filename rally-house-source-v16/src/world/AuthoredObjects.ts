import {COURT} from '../tennis/CourtGeometry.js';
import {Vec3} from '../rendering/Math3D.js';
import type {Mesh} from '../rendering/Renderer.js';
import type {InteractiveObject} from './World.js';
import {ObjectIdentity,type ObjectAction} from './ObjectIdentity.js';
import {ReversibleAssembly} from '../animation/ReversibleAssembly.js';
import {BallPhysics} from '../tennis/BallPhysics.js';

const mesh=(kind:Mesh['kind'],x:number,y:number,z:number,sx:number,sy:number,sz:number,color:string):Mesh=>({kind,position:new Vec3(x,y,z),scale:new Vec3(sx,sy,sz),rotation:new Vec3(),color});
export function authorObjectTargets(objects:InteractiveObject[]){
  const set=(id:string,centre:number[],size:number[],kind?:string,contact?:number[],seatHeight?:number)=>{
    const o=objects.find(o=>o.id===id)!;o.selection={centre:new Vec3(...centre as [number,number,number]),size:new Vec3(...size as [number,number,number])};
    if(kind)o.kind=kind;if(contact)o.interactionPoint=new Vec3(...contact as [number,number,number]);if(seatHeight!==undefined)o.seatHeight=seatHeight;
  };
  set('reception',[-9,.67,4.8],[3.55,1.35,1.25],'reception',[-8.35,1.30,5.22]);
  set('cafe',[-9.1,.75,-5.8],[4.45,1.5,1.38]);
  set('machine',[-7.5,.72,.2],[1.1,1.3,1.1]);set('water',[-5.5,.85,5.9],[1.25,1.7,.85]);
  set('lounge',[8.5,.7,5.8],[3.75,1.4,1.48],'lounge',[8.5,.87,5.8],.87);
  objects.find(o=>o.id==='lounge')!.seatCentre=new Vec3(8.35,0,5.8);
  set('journal',[6.95,.66,4.52],[.45,.3,.65]);
  set('historyShelf',[4.25,1.4,-9.1],[.75,.8,.35],'trophy',[4.25,1.4,-9.1]);
  set('bonsai',[10.54,2.10,3.9],[1.5,1.4,.9],'bonsai',[10.2,1.36,3.9]);
  objects.find(o=>o.id==='bonsai')!.viewSpot=new Vec3(9.0,0,3.0);
  objects.find(o=>o.id==='bonsai')!.careSpot=new Vec3(10.2,0,3.0);
  set('proshop',[9.2,1.05,-3.4],[2.3,1.95,1.3]);set('court',[COURT.centerX,.08,0],[COURT.doublesHalfWidth*2,.12,COURT.halfLength*2]);
  set('clubBoard',[2.8,2.58,-9.27],[4.15,1.18,.32],'board',[2.8,2.05,-9.16]);
  objects.find(o=>o.id==='clubBoard')!.careSpot=new Vec3(2.8,0,-8.7);
  set('warmup',[-9.3,.15,1.6],[3.1,.3,3.9],'warmup',[-9.3,1.2,1.6]);
  set('westWater',[-11.2,.8,-2.2],[.9,1.6,.9],'water',[-11.0,1.15,-2.2]);
  set('lobby',[-10.35,.65,6.35],[1.35,1.3,1.15],'lounge',[-10.35,.8,6.35],.8);
  objects.find(o=>o.id==='lobby')!.seatYaw=-Math.PI/2;
  set('gearWall',[11.30,.95,.3],[.75,1.9,3.3],'gear',[11.0,1.3,.3]);
  set('spectatorRow',[-3.9,.65,8.22],[3.35,1.3,.85],'lounge',[-3.9,.67,8.22],.67);
  set('equipment',[-1.4,1.05,-8.3],[2.4,1.95,.9],'trolley',[-1.4,1.72,-8.2]);
  const add=(id:string,label:string,kind:string,centre:number[],size:number[],description:string,contact?:number[],seatHeight?:number)=>{
    const c=new Vec3(...centre as [number,number,number]);objects.push({id,label,kind,position:new Vec3(c.x,0,c.z),radius:.8,description});set(id,centre,size,kind,contact,seatHeight);
  };
  add('clubClock','Club clock','clock',[5.7,2.75,-9.12],[.95,.95,.45],'A brass-hearted clock. Its mechanism has a little secret.',[5.7,2.75,-9.12]);
  add('deskBell','Brass desk bell','reception',[-8.35,1.31,5.22],[.26,.22,.26],'One clear note. A polite interruption.',[-8.35,1.30,5.22]);
  add('courtRack','Court-side racket rack','equipment',[6.54,.85,2.83],[1.62,1.35,.4],'Three frames, three different voices.',[6.53,.99,2.87]);
  add('shopRack','Pro-shop racket display','displayRackets',[9.14,2.15,-7.02],[3.65,1.55,.42],'Five frames above the shop shelf. Look them over; pluck the reachable frame at the stringing bench.',[9.14,2.43,-6.98]);
  add('courtBench','Courtside bench','lounge',[6.5,.65,4.8],[2.22,1.1,.8],'A short pause between points.',[6.5,.55,4.8],.55);
  add('sidePerch','Mint spectator perch','lounge',[4.55,.62,8],[2.35,1.2,.86],'Watch the far baseline from here.',[4.55,.82,8],.82);
  add('lobbyChair','Peach entrance chair','lounge',[-10.35,.65,8.05],[1.35,1.3,1.15],'A softer landing before the first serve.',[-10.35,.8,8.05],.8);
  objects.find(o=>o.id==='lobbyChair')!.seatYaw=-Math.PI/2;
  add('courtScoreboard','Court scoreboard','score',[7.22,1.62,8.5],[1.0,.75,.20],'The last completed court result, when there is one.',[7.22,1.62,8.44]);
  add('loungeLamp','Lounge floor lamp','lamp',[10.7,1.5,7.1],[.85,2.5,.85],'A warm shade beside the reading corner.',[10.7,1.35,7.1]);
  add('windowLamp','Window floor lamp','lamp',[-6.4,1.5,-7],[.85,2.5,.85],'A quiet light under the window.',[-6.4,1.35,-7]);
  add('entranceLamp','Entrance floor lamp','lamp',[-8.35,1.5,8.45],[.86,2.6,.86],'A peach shade for the last cup before heading home.',[-8.35,1.35,8.45]);
  add('courtBasket','Practice ball basket','supply',[6.0,.6,1.95],[.75,1.0,.75],'Eight visible balls stacked beside the rack. A supply for the next practice.',[6.0,.8,1.95]);
  add('westHopper','West spectator hopper','supply',[-4.8,.55,7.9],[.78,1.1,.78],'Six visible balls, close to the long spectator bench.',[-4.8,.7,7.9]);
  add('eastHopper','East spectator hopper','supply',[5.6,.55,7.9],[.78,1.1,.78],'Six visible balls beside the mint perch.',[5.6,.7,7.9]);
  add('spectatorTea','Spectator tea table','cafe',[-1.25,.62,8.0],[.9,1.0,.9],'A pink cup and a folded note between the baseline seats.',[-1.37,.8,7.95]);
  add('entranceTea','Entrance tea table','cafe',[-9,.62,7.2],[.85,1.0,.85],'A mint cup between the two entrance chairs.',[-9.05,.83,7.15]);
  const plants:[string,string,number,number,number][]=[['windowPlant','Window fern',-11.1,-7.2,1.1],['gearPlant','Gear-room fern',11.2,-1.5,.9],['loungePlant','Reading-corner fern',7,7.3,1],['windowSprig','Small window fern',-5.75,-7.5,.72],['entryPlant','Entrance fern',-6.3,8.5,.92],['perchPlant','Spectator fern',9,8.4,.86]];
  for(const [id,label,x,z,s] of plants)add(id,label,'plant',[x,.95*s,z],[1.25*s,1.65*s,.9*s],'A small green companion with its own watering history.',[x,.82*s,z]);
  const bonsai:[string,string,number,number,number,number][]=[['deskPine','Reception pine',-8.22,4.48,.34,1.18],['teaCascade','Tea-shelf cascade',-10.58,-8.91,.31,2.22],['tableMaple','Lounge maple',7.06,4.58,.30,.70],['shopFlower','Flowering shop bonsai',10.62,-7.04,.27,2.23]];
  for(const [id,label,x,z,s,y] of bonsai){add(id,label,'bonsai',[x,y+.85*s,z],[1.05*s,1.65*s,.85*s],'A different silhouette, a different quiet moment.',[x,y+.28*s,z]);
    // High shelves are for looking. Do not offer a pour a standing hand cannot reach.
    if(y>2)objects.find(o=>o.id===id)!.observeOnly=true;
  }
}

/** Mutable prop geometry stays out of Renderer.cacheStatic. Architecture remains cached. */
export class AuthoredObjects {
  readonly clockMeshes:Mesh[];
  readonly clock:ReversibleAssembly;
  private age=0;
  private active=new Map<string,{action:ObjectAction;age:number}>();
  private leafParts:{mesh:Mesh;original:Vec3;id:string}[]=[];
  private soilParts:{mesh:Mesh;id:string}[]=[];
  private bell:Mesh;
  private ballAge=4;
  readonly demonstrationBall=new BallPhysics();
  constructor(staticMeshes:Mesh[],readonly identity:ObjectIdentity){
    this.clockMeshes=[mesh('torus',5.7,2.75,-9.32,.75,.75,.30,'#8b7761'),mesh('sphere',5.7,2.75,-9.245,.58,.58,.09,'#f5eedf'),
      mesh('torus',5.52,2.78,-9.27,.25,.25,.11,'#c7a257'),mesh('torus',5.91,2.68,-9.27,.31,.31,.11,'#ad8c48'),
      mesh('roundBox',5.7,2.91,-9.20,.035,.34,.025,'#59645c'),mesh('roundBox',5.83,2.75,-9.18,.29,.028,.025,'#59645c'),mesh('sphere',5.7,2.75,-9.15,.085,.085,.055,'#d3ac62')];
    for(const [x,y,r,color] of [[5.52,2.78,.25,'#c7a257'],[5.91,2.68,.31,'#ad8c48']] as const)for(let i=0;i<4;i++){const tooth=mesh('roundBox',x,y,-9.27,r*1.15,.045,.065,color);tooth.rotation!.z=i*Math.PI/4;this.clockMeshes.push(tooth);}
    this.clock=new ReversibleAssembly(this.clockMeshes.map((m,i)=>{const left=i===2||(i>=7&&i<11),right=i===3||i>=11;return {mesh:m,offset:new Vec3(left?-.26:right?.25:0,left?.14:right?-.14:0,left?.62:right?.76:[0,.34,0,0,1.04,1.18,1.35][i]),turn:new Vec3(0,0,left?1.6:right?-1.6:i===4?-.35:i===5?.35:0)};}));
    this.demonstrationBall.bounds={halfWidth:12,halfDepth:9};this.demonstrationBall.netEnabled=false;
    this.bell=mesh('sphere',-8.35,1.30,5.22,.12,.08,.12,'#d8ba6c');
    for(let i=staticMeshes.length-1;i>=0;i--){const m=staticMeshes[i];
      if(m.material==='leaf'){
        const o=identity.objects.filter(o=>['plant','bonsai'].includes(o.kind)).sort((a,b)=>Math.hypot(a.position.x-m.position.x,a.position.z-m.position.z)-Math.hypot(b.position.x-m.position.x,b.position.z-m.position.z))[0];
        if(o){this.leafParts.push({mesh:m,original:m.position.clone(),id:o.id});staticMeshes.splice(i,1);}
      }else if(m.color==='#57483d'){
        const o=identity.objects.find(o=>o.kind==='bonsai'&&Math.hypot(o.position.x-m.position.x,o.position.z-m.position.z)<.03);
        if(o){this.soilParts.push({mesh:m,id:o.id});staticMeshes.splice(i,1);}
      }
    }
  }
  start(id:string,action:ObjectAction,minute:number){
    this.active.set(id,{action,age:0});
    this.identity.apply(id,action,minute);
    if(action.assembly)this.clock.start();
    if(action.effect==='training'){this.ballAge=0;this.demonstrationBall.launch(new Vec3(-7.1,.86,-.12),new Vec3(-6.35,.09,.08),.58);}
  }
  cancel(id:string){this.active.delete(id);if(id==='clubClock')this.clock.restore();}
  lampLevel(id:string){return this.identity.state(id).dimmed?.4:1;}
  update(dt:number,reducedMotion:boolean){
    this.age+=dt;this.clock.update(dt,reducedMotion);
    for(const [id,a] of this.active){a.age+=dt;if(a.age>a.action.seconds)this.active.delete(id);}
    this.ballAge+=dt;return this.demonstrationBall.update(dt).bounced;
  }
  meshes(minute:number,reducedMotion:boolean):Mesh[]{
    if(!this.clock.active){const minuteAngle=minute/60*Math.PI*2,hourAngle=minute/720*Math.PI*2;
      this.clockMeshes[4].position.set(5.7+Math.sin(minuteAngle)*.16,2.75+Math.cos(minuteAngle)*.16,-9.20);this.clockMeshes[4].rotation!.z=-minuteAngle;
      this.clockMeshes[5].position.set(5.7+Math.sin(hourAngle)*.13,2.75+Math.cos(hourAngle)*.13,-9.18);this.clockMeshes[5].rotation!.z=Math.PI/2-hourAngle;
    }
    const m:Mesh[]=[...this.clockMeshes];
    const ring=[...this.active.values()].find(a=>a.action.effect==='bell');
    this.bell.position.y=1.30-(ring?.age!==undefined&&ring.age<.35?.035*Math.sin(Math.PI*ring.age/.35):0);m.push(this.bell);
    for(const p of this.leafParts){const a=this.active.get(p.id),motion=reducedMotion?0:Math.sin(this.age*1.3+p.original.y)*(.006+(a?.action.effect==='leaves'?.035:0));p.mesh.position=p.original.clone().add(new Vec3(motion,0,motion*.4));m.push(p.mesh);}
    for(const p of this.soilParts){const s=this.identity.state(p.id);p.mesh.color=s.lastWater!==null&&minute-s.lastWater<30?'#302e28':'#57483d';m.push(p.mesh);}
    for(const o of this.identity.objects){
      if(o.kind==='plant'){const s=this.identity.state(o.id),wet=s.lastWater!==null&&minute-s.lastWater<30;if(wet)m.push(mesh('cylinder',o.position.x,o.interactionPoint!.y-.04,o.position.z,.34,.03,.34,'#3d4332'));}
      if(o.kind==='board'&&this.identity.state(o.id).sketched){
        // A crosscourt arrow in the lower-right corner. No invented lesson outcome.
        m.push(mesh('roundBox',3.55,2.12,-9.195,.92,.015,.018,'#426a79'),mesh('roundBox',3.15,2.30,-9.195,.018,.37,.018,'#426a79'),mesh('roundBox',3.98,2.30,-9.195,.018,.37,.018,'#426a79'));
        const arrow=mesh('roundBox',3.54,2.32,-9.185,.85,.025,.018,'#be775b');arrow.rotation!.z=.35;m.push(arrow);
        for(const tilt of [.9,-.2]){const tip=mesh('roundBox',3.89,2.45,-9.18,.17,.023,.018,'#be775b');tip.rotation!.z=tilt;m.push(tip);}
      }
      if(['equipment','trolley','displayRackets'].includes(o.kind)){
        const c=o.interactionPoint!,a=this.active.get(o.id),wave=reducedMotion?0:a?.action.effect==='stringing'?Math.sin(a.age*42)*.026*Math.exp(-a.age*2):0;
        const r=o.id==='proshop'?.38:o.id==='equipment'?.16:.23;
        for(let i=-2;i<=2;i++){
          m.push(mesh('roundBox',c.x+i*r*.3,c.y,c.z+.03+wave,.009,r*1.35,.009,'#d9d0b9'),mesh('roundBox',c.x,c.y+i*r*.3,c.z+.03-wave,r*1.35,.009,.009,'#d9d0b9'));
        }
      }
    }
    if(this.ballAge<3){
      const p=this.demonstrationBall.position;m.push(mesh('sphere',p.x,p.y,p.z,.14,.14,.14,'#d9c65f'));
      const wheel=mesh('roundBox',-7.4,.72,.62,.29,.06,.05,'#596f60');wheel.rotation=new Vec3(0,0,reducedMotion?0:this.ballAge*18);m.push(wheel);
    }
    return m;
  }
}
