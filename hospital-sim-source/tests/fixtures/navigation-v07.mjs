import {GRID} from '../../dist/content.mjs';
export const entrance=s=>s.entrance||GRID.entry,exit=s=>s.exit||GRID.exit;
export const gateDirection=p=>p.y===GRID.h-1?{x:0,y:1}:p.y===0?{x:0,y:-1}:p.x===0?{x:-1,y:0}:{x:1,y:0};
export const door=r=>({x:r.x,y:r.y+2});
export const blocked=(x,y,rooms)=>rooms.some(r=>x>r.x-.75&&x<r.x+1.75&&y>r.y-.75&&y<r.y+1.75);
export function path(a,b,rooms,avoid=[]){
 const start={x:Math.round(a.x*4),y:Math.round(a.y*4)},goal={x:Math.round(b.x*4),y:Math.round(b.y*4)},q=[start],key=p=>`${p.x},${p.y}`,seen=new Set([key(start)]),prev=new Map(),occupied=new Set(avoid.map(v=>`${Math.round(v.x*4)},${Math.round(v.y*4)}`));
 for(let i=0;i<q.length;i++){const c=q[i],k=key(c);if(c.x===goal.x&&c.y===goal.y){const result=[];let t=k;while(t!==key(start)){const [x,y]=t.split(',').map(Number);result.unshift({x:x/4,y:y/4});t=prev.get(t)}return result}
 for(const [dx,dy] of [[1,0],[0,1],[-1,0],[0,-1]]){const p={x:c.x+dx,y:c.y+dy},k=key(p);if(p.x<0||p.x>(GRID.w-1)*4||p.y<0||p.y>(GRID.h-1)*4||blocked(p.x/4,p.y/4,rooms)||seen.has(k)||occupied.has(k))continue;seen.add(k);prev.set(k,key(c));q.push(p)}}return null;
}
