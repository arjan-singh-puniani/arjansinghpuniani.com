import {Vec3} from '../rendering/Math3D.js';
import {COURT} from '../tennis/CourtGeometry.js';
const clearance=.22;
// Include both service baselines and the net-post run-off in the same
// boundary used for circulation and for clearing nonparticipants.
const courtHalfWidth=COURT.doublesHalfWidth+1,courtHalfDepth=COURT.baselineDepth+.25;
export interface Rect {x:number;z:number;w:number;d:number}
export class Navigation {
  cell=.5; minX=-12.5; maxX=12.5; minZ=-9.5; maxZ=9.5; obstacles:Rect[]=[];
  courtReserved=()=>false;
  constructor(obstacles:Rect[]=[]){this.obstacles=obstacles}
  isBlocked(x:number,z:number){if(x<this.minX||x>this.maxX||z<this.minZ||z>this.maxZ)return true;return this.obstacles.some(o=>x>o.x-o.w/2-clearance&&x<o.x+o.w/2+clearance&&z>o.z-o.d/2-clearance&&z<o.z+o.d/2+clearance)}
  private snap(v:number,min:number){return Math.round((v-min)/this.cell)}
  private world(ix:number,iz:number){return new Vec3(this.minX+ix*this.cell,0,this.minZ+iz*this.cell)}
  path(start:Vec3,end:Vec3){
    if(![start.x,start.z,end.x,end.z].every(Number.isFinite))return [];
    if(this.isBlocked(end.x,end.z))return [];
    if(this.clearSegment(start,end))return [new Vec3(end.x,0,end.z)];
    const anchor=(p:Vec3)=>{const x=this.snap(p.x,this.minX),z=this.snap(p.z,this.minZ),options:{x:number;z:number;d:number}[]=[];for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++){const w=this.world(x+dx,z+dz);if(this.clearSegment(p,w))options.push({x:x+dx,z:z+dz,d:Vec3.sub(p,w).len()});}return options.sort((a,b)=>a.d-b.d)[0];};
    const first=anchor(start),last=anchor(end);if(!first||!last)return [];
    const sx=first.x,sz=first.z,ex=last.x,ez=last.z;const key=(x:number,z:number)=>`${x},${z}`;
    const open:{x:number,z:number,f:number}[]=[{x:sx,z:sz,f:0}],came=new Map<string,string>(),g=new Map<string,number>([[key(sx,sz),0]]);const dirs=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
    let guard=0;while(open.length&&guard++<12000){open.sort((a,b)=>a.f-b.f);const cur=open.shift()!;if(cur.x===ex&&cur.z===ez){const out:Vec3[]=[];let k=key(ex,ez);while(k!==key(sx,sz)){const [x,z]=k.split(',').map(Number);out.push(this.world(x,z));k=came.get(k)??key(sx,sz)}out.reverse();out.unshift(this.world(sx,sz));out.push(new Vec3(end.x,0,end.z));return this.simplify(out,start);}
      for(const [dx,dz] of dirs){const nx=cur.x+dx,nz=cur.z+dz,w=this.world(nx,nz);if(!this.clearSegment(this.world(cur.x,cur.z),w))continue;if(dx&&dz){const a=this.world(cur.x+dx,cur.z),b=this.world(cur.x,cur.z+dz);if(this.isBlocked(a.x,a.z)||this.isBlocked(b.x,b.z))continue;}const ng=(g.get(key(cur.x,cur.z))??Infinity)+Math.hypot(dx,dz);const nk=key(nx,nz);if(ng<(g.get(nk)??Infinity)){came.set(nk,key(cur.x,cur.z));g.set(nk,ng);const h=Math.hypot(ex-nx,ez-nz);const old=open.find(v=>v.x===nx&&v.z===nz);if(old)old.f=ng+h;else open.push({x:nx,z:nz,f:ng+h});}}
    }return [];
  }
  /** Occupied courts stay clear; idle courts are ordinary walkable floor. */
  onCourt(p:Vec3){return Math.abs(p.x-COURT.centerX)<courtHalfWidth&&Math.abs(p.z)<courtHalfDepth;}
  clubPath(start:Vec3,end:Vec3){
    if(!this.courtReserved()||this.onCourt(end))return this.path(start,end);
    // isBlocked expands obstacles by clearance; use exactly onCourt's bounds.
    const outside=new Navigation([...this.obstacles,{x:COURT.centerX,z:0,w:2*(courtHalfWidth-clearance),d:2*(courtHalfDepth-clearance)}]);
    if(!this.onCourt(start))return outside.path(start,end);
    const exits=[new Vec3(COURT.centerX-courtHalfWidth-.25,0,start.z),new Vec3(COURT.centerX+courtHalfWidth+.25,0,start.z),new Vec3(start.x,0,-courtHalfDepth-.25),new Vec3(start.x,0,courtHalfDepth+.25)];
    const routes=exits.map(exit=>{const first=this.path(start,exit),last=outside.path(exit,end);return first.length&&last.length?[...first,...last]:[]}).filter(r=>r.length);
    const length=(r:Vec3[])=>r.reduce((n,p,i)=>n+Vec3.sub(p,i?r[i-1]:start).len(),0);
    return routes.sort((a,b)=>length(a)-length(b))[0]??[];
  }
  clearSegment(a:Vec3,b:Vec3){
    if(this.isBlocked(a.x,a.z)||this.isBlocked(b.x,b.z))return false;
    for(const o of this.obstacles){
      let enter=0,leave=1;
      for(const [origin,delta,min,max] of [[a.x,b.x-a.x,o.x-o.w/2-clearance,o.x+o.w/2+clearance],[a.z,b.z-a.z,o.z-o.d/2-clearance,o.z+o.d/2+clearance]]){
        if(Math.abs(delta)<1e-9){if(origin<=min||origin>=max){enter=2;break;}}
        else {const x=(min-origin)/delta,y=(max-origin)/delta;enter=Math.max(enter,Math.min(x,y));leave=Math.min(leave,Math.max(x,y));}
      }
      if(enter<=leave)return false;
    }
    return true;
  }
  private simplify(path:Vec3[],start:Vec3){
    const out:Vec3[]=[];let anchor=start,index=0;
    while(index<path.length){let far=index;for(let i=path.length-1;i>index;i--)if(this.clearSegment(anchor,path[i])){far=i;break;}out.push(path[far]);anchor=path[far];index=far+1;}
    return out;
  }
}
