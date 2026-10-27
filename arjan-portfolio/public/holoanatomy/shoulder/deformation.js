/** Illustrative XPBD surface mechanics; normalized geometry units, not calibrated human tissue. */
export const SOLVER = Object.freeze({ step: 1 / 120, iterations: 5, maxSubsteps: 4, maxPull: 0.2 });
const length = (a, i, j) => Math.sqrt((a[i]-a[j])**2 + (a[i+1]-a[j+1])**2 + (a[i+2]-a[j+2])**2);
export function weldSurface(positions, triangles) {
  const keys = new Map(), rest = [], renderMap = [];
  for (let i=0;i<positions.length;i+=3) {
    const key = `${Math.round(positions[i]*1e6)},${Math.round(positions[i+1]*1e6)},${Math.round(positions[i+2]*1e6)}`;
    if (!keys.has(key)) { keys.set(key, rest.length/3); rest.push(positions[i],positions[i+1],positions[i+2]); }
    renderMap.push(keys.get(key));
  }
  const faces = [];
  for (let i=0;i<triangles.length;i+=3) {
    const f = [renderMap[triangles[i]],renderMap[triangles[i+1]],renderMap[triangles[i+2]]];
    if (new Set(f).size === 3) faces.push(...f);
  }
  return { rest: new Float64Array(rest), faces: new Uint32Array(faces), renderMap: new Uint32Array(renderMap) };
}
export class SurfaceTissue {
  constructor({rest, faces, pins, axis = [1,0,0], contacts = [], complianceScale = null}) {
    if (!rest?.length || rest.length%3 || !rest.every(Number.isFinite) || !faces?.length || faces.length%3 || !faces.every(i=>Number.isInteger(i)&&i>=0&&i<rest.length/3) || !pins || pins.length!==rest.length/3)
      throw Error('Invalid tissue surface');
    this.rest = Float64Array.from(rest); this.x = Float64Array.from(rest);
    this.previous = Float64Array.from(rest); this.velocity = new Float64Array(rest.length);
    this.faces = faces; this.pins = Uint8Array.from(pins); this.axis = axis;
    this.complianceScale = complianceScale;
    this.contacts = contacts; this.accumulator = 0; this.active = false; this.held = false;
    this.iterations=SOLVER.iterations;
    this.steps = 0; this.recoveries = 0; this.failed = false;
    const map = new Map();
    for (let i=0;i<faces.length;i+=3) {
      const [a,b,c] = faces.slice(i,i+3);
      for (const [u,v,w] of [[a,b,c],[b,c,a],[c,a,b]]) {
        const key = u<v ? `${u}:${v}` : `${v}:${u}`;
        if (!map.has(key)) map.set(key,{a:u,b:v,opposite:[]});
        map.get(key).opposite.push(w);
      }
    }
    this.closed = [...map.values()].every(e=>e.opposite.length===2);
    this.edges = [...map.values()].map(e=>this.constraint(e.a,e.b,0.000006));
    this.bends = [...map.values()].filter(e=>e.opposite.length===2 && e.opposite[0]!==e.opposite[1])
      .map(e=>this.constraint(...e.opposite,0.00004));
    this.restVolume = this.volume(this.rest);
    this.volumeEnabled = this.closed && Math.abs(this.restVolume)>1e-7;
    this.gradient = new Float64Array(rest.length);
  }
  constraint(a,b,compliance) {
    const i=a*3,j=b*3,L=length(this.rest,i,j);
    const alignment = L ? Math.abs(((this.rest[j]-this.rest[i])*this.axis[0]+(this.rest[j+1]-this.rest[i+1])*this.axis[1]+(this.rest[j+2]-this.rest[i+2])*this.axis[2])/L) : 0;
    return {a:i,b:j,L,compliance:compliance*(this.complianceScale?Math.min(this.complianceScale[a],this.complianceScale[b]):1)/(1+2*alignment*alignment),lambda:0};
  }
  volume(x) {
    let value=0;
    for(let f=0;f<this.faces.length;f+=3) {
      const a=this.faces[f]*3,b=this.faces[f+1]*3,c=this.faces[f+2]*3;
      value+=(x[a]*(x[b+1]*x[c+2]-x[b+2]*x[c+1])+x[a+1]*(x[b+2]*x[c]-x[b]*x[c+2])+x[a+2]*(x[b]*x[c+1]-x[b+1]*x[c]))/6;
    }
    return value;
  }
  grasp(point) {
    if (!point.every(Number.isFinite)) return false;
    let nearest=-1,best=Infinity;
    for(let i=0;i<this.x.length;i+=3) {
      if(this.pins[i/3]) continue;
      const d=Math.hypot(this.x[i]-point[0],this.x[i+1]-point[1],this.x[i+2]-point[2]);
      if(d<best) {best=d;nearest=i/3;}
    }
    if(nearest<0) return false;
    // Geodesic falloff avoids grasping the opposite surface through a thin mesh.
    const distances=new Float64Array(this.pins.length).fill(Infinity), visited=new Uint8Array(this.pins.length);
    distances[nearest]=0;
    const graph=Array.from({length:this.pins.length},()=>[]);
    for(const e of this.edges) {graph[e.a/3].push([e.b/3,e.L]);graph[e.b/3].push([e.a/3,e.L]);}
    for(let n=0;n<distances.length;n++) {
      let u=-1,d=Infinity;
      for(let j=0;j<distances.length;j++) if(!visited[j]&&distances[j]<d){d=distances[j];u=j;}
      if(u<0 || d>0.24) break;
      visited[u]=1;
      for(const [v,L] of graph[u]) distances[v]=Math.min(distances[v],d+L);
    }
    this.grabWeights=Float64Array.from(distances,(d,i)=>this.pins[i]?0:Math.pow(Math.max(0,1-d/0.24),2));
    this.grabStart=this.x.slice(); this.target=[0,0,0]; this.grabbed=nearest;
    this.held=false; this.active=true;this.quietSteps=0;this.returnFrom=null; this.velocity.fill(0); this.failed=false;
    return true;
  }
  pull(delta) {
    if(!this.grabWeights || !delta.every(Number.isFinite)) return;
    const d=Math.hypot(...delta), response=d>0?SOLVER.maxPull*Math.tanh(d/SOLVER.maxPull)/d:0;
    this.active=true;this.quietSteps=0;
    this.target=delta.map(v=>v*response); this.load=d>0?Math.hypot(...this.target)/SOLVER.maxPull:0;
  }
  release(hold=false) {
    this.active=true;this.quietSteps=0;
    this.held=Boolean(hold && this.grabWeights);
    if(!this.held) {this.grabWeights=null;this.returnFrom=this.x.slice();this.returnTime=0;}
    this.velocity.fill(0);
  }
  restore() {
    this.x.set(this.rest);this.previous.set(this.rest);this.velocity.fill(0);this.active=false;this.held=false;
    this.grabWeights=null;this.returnFrom=null;this.accumulator=0;this.load=0;
  }
  advance(seconds) {
    if(!this.active) return false;
    this.accumulator+=Math.min(Math.max(seconds,0),SOLVER.step*SOLVER.maxSubsteps);
    let changed=false;
    while(this.accumulator+1e-9>=SOLVER.step) {
      this.step(SOLVER.step);this.accumulator-=SOLVER.step;changed=true;
    }
    return changed;
  }
  projectEdges(edges,dt,hard=false) {
    for(const e of edges) {
      const {a,b,L}=e,wa=this.pins[a/3]?0:1,wb=this.pins[b/3]?0:1;
      const dx=this.x[a]-this.x[b],dy=this.x[a+1]-this.x[b+1],dz=this.x[a+2]-this.x[b+2],d=Math.sqrt(dx*dx+dy*dy+dz*dz);
      if(d<1e-10 || !wa&&!wb) continue;
      const C=hard?Math.max(0,d-L*1.3):d-L;
      if(hard&&!C) continue;
      const alpha=hard?0:e.compliance/(dt*dt), dl=(-C-alpha*e.lambda)/(wa+wb+alpha);
      if(!hard)e.lambda+=dl;
      const k=dl/d;
      this.x[a]+=wa*k*dx;this.x[a+1]+=wa*k*dy;this.x[a+2]+=wa*k*dz;
      this.x[b]-=wb*k*dx;this.x[b+1]-=wb*k*dy;this.x[b+2]-=wb*k*dz;
    }
  }
  projectVolume(dt) {
    if(!this.volumeEnabled) return;
    const g=this.gradient,x=this.x;g.fill(0);
    for(let f=0;f<this.faces.length;f+=3) {
      const a=this.faces[f]*3,b=this.faces[f+1]*3,c=this.faces[f+2]*3;
      g[a]+=(x[b+1]*x[c+2]-x[b+2]*x[c+1])/6;
      g[a+1]+=(x[b+2]*x[c]-x[b]*x[c+2])/6;
      g[a+2]+=(x[b]*x[c+1]-x[b+1]*x[c])/6;
      g[b]+=(x[c+1]*x[a+2]-x[c+2]*x[a+1])/6;
      g[b+1]+=(x[c+2]*x[a]-x[c]*x[a+2])/6;
      g[b+2]+=(x[c]*x[a+1]-x[c+1]*x[a])/6;
      g[c]+=(x[a+1]*x[b+2]-x[a+2]*x[b+1])/6;
      g[c+1]+=(x[a+2]*x[b]-x[a]*x[b+2])/6;
      g[c+2]+=(x[a]*x[b+1]-x[a+1]*x[b])/6;
    }
    let denom=0;for(let i=0;i<g.length;i++)if(!this.pins[Math.floor(i/3)])denom+=g[i]*g[i];
    const alpha=0.000001/(dt*dt),dl=(-(this.volume(x)-this.restVolume)-alpha*this.volumeLambda)/(denom+alpha);
    this.volumeLambda+=dl;
    for(let i=0;i<x.length;i++)if(!this.pins[Math.floor(i/3)])x[i]+=Math.max(-0.003,Math.min(0.003,g[i]*dl));
  }
  enforceBounds() {
    for(let i=0;i<this.x.length;i+=3) {
      if(this.pins[i/3]) {this.x.set(this.rest.subarray(i,i+3),i);continue;}
      const dx=this.x[i]-this.rest[i],dy=this.x[i+1]-this.rest[i+1],dz=this.x[i+2]-this.rest[i+2],r=Math.sqrt(dx*dx+dy*dy+dz*dz);
      if(r>SOLVER.maxPull) {const k=SOLVER.maxPull/r;this.x[i]=this.rest[i]+dx*k;this.x[i+1]=this.rest[i+1]+dy*k;this.x[i+2]=this.rest[i+2]+dz*k;}
    }
    for(const c of this.contacts) {
      const i=c.index*3;if(this.pins[c.index])continue;
      const signed=(this.x[i]-c.point[0])*c.normal[0]+(this.x[i+1]-c.point[1])*c.normal[1]+(this.x[i+2]-c.point[2])*c.normal[2];
      if(signed<c.margin)for(let k=0;k<3;k++)this.x[i+k]+=(c.margin-signed)*c.normal[k];
    }
  }
  step(dt) {
    if(!this.grabWeights && this.returnFrom) {
      this.returnTime+=dt;
      const decay=Math.exp(-11*this.returnTime);
      for(let i=0;i<this.x.length;i++)this.x[i]=this.rest[i]+(this.returnFrom[i]-this.rest[i])*decay;
      this.velocity.fill(0);this.enforceBounds();this.steps++;
      if(decay<.0005){this.restore();this.recoveries++;}
      return;
    }
    this.previous.set(this.x);this.volumeLambda=0;
    for(const e of this.edges)e.lambda=0;for(const e of this.bends)e.lambda=0;
    for(let i=0;i<this.x.length;i++)if(!this.pins[Math.floor(i/3)]) {
      this.velocity[i]=(this.velocity[i]+(this.rest[i]-this.x[i])*65*dt)*Math.exp(-22*dt);
      this.x[i]+=this.velocity[i]*dt;
    }
    if(!this.grabWeights) {
      const recovery=1-Math.exp(-18*dt);
      for(let i=0;i<this.x.length;i++)this.x[i]+=(this.rest[i]-this.x[i])*recovery;
    }
    for(let iteration=0;iteration<this.iterations;iteration++) {
      if(this.grabWeights)for(let i=0;i<this.x.length;i++) {
        const w=this.grabWeights[Math.floor(i/3)];
        this.x[i]+=(this.grabStart[i]+this.target[i%3]-this.x[i])*w*0.7;
      }
      this.projectEdges(this.edges,dt);this.projectEdges(this.bends,dt);if(iteration%3===0)this.projectVolume(dt);
      this.projectEdges(this.edges,dt,true);this.enforceBounds();
    }
    for(let i=0;i<3;i++){this.projectEdges(this.edges,dt,true);this.enforceBounds();}
    let max=0,change=0;
    for(let i=0;i<this.x.length;i++) {
      if(!Number.isFinite(this.x[i])) {this.restore();this.failed=true;return;}
      change=Math.max(change,Math.abs(this.x[i]-this.previous[i]));
      this.velocity[i]=(this.x[i]-this.previous[i])/dt;
      max=Math.max(max,Math.abs(this.x[i]-this.rest[i]));
    }
    this.steps++;
    this.quietSteps=change<.00001?(this.quietSteps||0)+1:0;
    if(this.grabWeights && this.quietSteps>20)this.active=false;
    if(!this.grabWeights && max<0.0001) {this.restore();this.recoveries++;}
  }
  diagnostics() {
    let pinError=0,maxDisplacement=0;
    for(let i=0;i<this.x.length;i+=3) {
      const d=Math.hypot(this.x[i]-this.rest[i],this.x[i+1]-this.rest[i+1],this.x[i+2]-this.rest[i+2]);
      if(this.pins[i/3])pinError=Math.max(pinError,d);
      maxDisplacement=Math.max(maxDisplacement,d);
    }
    let maxContactPenetration=0;
    for(const c of this.contacts){const i=c.index*3;if(this.pins[c.index])continue;const s=(this.x[i]-c.point[0])*c.normal[0]+(this.x[i+1]-c.point[1])*c.normal[1]+(this.x[i+2]-c.point[2])*c.normal[2];maxContactPenetration=Math.max(maxContactPenetration,c.margin-s);}
    return {typedArrayBytes:[this.rest,this.x,this.previous,this.velocity,this.gradient,this.pins,this.faces,this.complianceScale,this.grabWeights,this.grabStart,this.returnFrom].reduce((sum,array)=>sum+(array?.byteLength||0),0),iterations:this.iterations,maxContactPenetration,particles:this.pins.length,pinned:this.pins.reduce((a,b)=>a+b,0),edges:this.edges.length,bends:this.bends.length,closed:this.closed,volumeEnabled:this.volumeEnabled,volumeRatio:this.restVolume?this.volume(this.x)/this.restVolume:null,pinError,maxDisplacement,maxEdgeRatio:Math.max(...this.edges.filter(e=>e.L>1e-8).map(e=>length(this.x,e.a,e.b)/e.L)),active:this.active,held:this.held,failed:this.failed,steps:this.steps};
  }
}
