import {GRID,blocked,entrance,exit,door,canLift,dropPlacement} from './simulation.mjs?v=127';

// A held scene is paused. Build one navigation snapshot, never run BFS in pointermove.
export function landingOptions(s,kind,id){
 const valid=new Map(),lift=canLift(s,kind,id);if(!lift.ok)return valid;
 const w=(GRID.w-1)*4+1,h=(GRID.h-1)*4+1,n=w*h,index=p=>Math.round(p.y*4)*w+Math.round(p.x*4),point=i=>({x:(i%w)/4,y:Math.floor(i/w)/4});
 const open=new Uint8Array(n),adj=Array.from({length:n},()=>[]);for(let i=0;i<n;i++){const p=point(i);open[i]=!blocked(p.x,p.y,s.rooms)}
 for(let i=0;i<n;i++)if(open[i])for(const j of [i%w?i-1:-1,i%w<w-1?i+1:-1,i-w,i+w])if(j>=0&&j<n&&open[j])adj[i].push(j);
 const connected=new Uint8Array(n),queue=[index(exit(s))];connected[queue[0]]=1;for(let k=0;k<queue.length;k++)for(const j of adj[queue[k]])if(!connected[j]){connected[j]=1;queue.push(j)}
 const person=(kind==='patient'?s.patients:s.staff).find(p=>p.id===id),home=kind==='staff'&&s.rooms.find(r=>r.staff.includes(id)),destination=kind==='patient'?(person.target?door(s.rooms.find(r=>r.id===person.target)):person.state==='exiting'?exit(s):null):home?door(home):null;
 if(destination&&!connected[index(destination)])return valid;
 const critical=new Uint8Array(n);
 if(kind==='staff'&&!home){
  const targets=new Uint8Array(n),disc=new Int32Array(n),low=new Int32Array(n);let clock=0;for(const p of [exit(s),...s.rooms.map(door)])targets[index(p)]=1;
  function visit(v,parent){disc[v]=low[v]=++clock;let count=targets[v];for(const j of adj[v]){if(j===parent)continue;if(!disc[j]){const below=visit(j,v);count+=below;low[v]=Math.min(low[v],low[j]);if(parent!==-1&&low[j]>=disc[v]&&below)critical[v]=1}else low[v]=Math.min(low[v],disc[j])}return count}visit(index(entrance(s)),-1);
 }
 const portals=[entrance(s),exit(s),...s.rooms.map(door)],people=[...s.patients.filter(p=>!(kind==='patient'&&p.id===id)&&!p.outside),...s.staff.filter(st=>!(kind==='staff'&&st.id===id)).flatMap(st=>[st.position,st.breakTrip?.position].filter(Boolean))];
 for(const i of queue){const p=point(i);if(critical[i]||portals.some(q=>Math.hypot(q.x-p.x,q.y-p.y)<.6)||people.some(q=>Math.hypot(q.x-p.x,q.y-p.y)<.55))continue;valid.set(`${p.x},${p.y}`,p)}if(kind==='staff')for(const r of s.rooms){const d=door(r);for(let dy=-.25;dy<=.25;dy+=.25)for(let dx=-.25;dx<=.25;dx+=.25){const p={x:d.x+dx,y:d.y+dy},check=dropPlacement(s,kind,id,p.x,p.y);if(check.ok&&check.assignment)valid.set(`${p.x},${p.y}`,{...p,assignment:check.assignment,reason:check.reason})}}return valid;
}
export function landingCheck(options,x,y){const p=options.get(`${x},${y}`);return p?{ok:true,reason:p.reason||'Clear landing · connected route'}:{ok:false,reason:'Keep equipment, people and doorways clear; choose a green tile'};}
