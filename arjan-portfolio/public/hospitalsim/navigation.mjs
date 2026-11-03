import {GRID} from './content.mjs?v=130';
export const entrance=s=>s.entrance||GRID.entry,exit=s=>s.exit||GRID.exit;
const directions=[{x:0,y:1},{x:1,y:0},{x:0,y:-1},{x:-1,y:0}];
export const gateDirection=(p,bounds=GRID)=>p.direction!==undefined?directions[p.direction]:p.y===bounds.h-1?{x:0,y:1}:p.y===0?{x:0,y:-1}:p.x===0?{x:-1,y:0}:{x:1,y:0};
export const roomAngle=r=>(r.rotation||0)*Math.PI/2;
export const door=r=>[{x:r.x,y:r.y+2},{x:r.x+2,y:r.y+1},{x:r.x+1,y:r.y-1},{x:r.x-1,y:r.y}][r.rotation||0];
export const blocked=(x,y,rooms)=>rooms.some(r=>x>r.x-.75&&x<r.x+1.75&&y>r.y-.75&&y<r.y+1.75);
let topologyKey='',walls;
function wallsFor(rooms,bounds){
 const w=(bounds.w-1)*4+1,h=(bounds.h-1)*4+1,n=w*h,key=w+','+h+':'+rooms.map(r=>r.x+','+r.y).join(';');
 if(key!==topologyKey||!walls){topologyKey=key;walls=new Uint8Array(n);for(const r of rooms){const left=Math.max(0,Math.floor((r.x-.75)*4)+1),right=Math.min(w-1,Math.ceil((r.x+1.75)*4)-1),top=Math.max(0,Math.floor((r.y-.75)*4)+1),bottom=Math.min(h-1,Math.ceil((r.y+1.75)*4)-1);for(let y=top;y<=bottom;y++)walls.fill(1,y*w+left,y*w+right+1)}}return{w,h,n,walls};
}
export function reachable(start,rooms,bounds=GRID){
 const {w,h,n,walls}=wallsFor(rooms,bounds),visited=new Uint8Array(n),queue=new Int32Array(n),first=Math.round(start.y*4)*w+Math.round(start.x*4);let end=1;queue[0]=first;visited[first]=1;
 for(let i=0;i<end;i++){const c=queue[i],x=c%w,y=Math.floor(c/w);for(let d=0;d<4;d++){const next=d===0?(x+1<w?c+1:-1):d===1?(y+1<h?c+w:-1):d===2?(x>0?c-1:-1):(y>0?c-w:-1);if(next>=0&&!walls[next]&&!visited[next]){visited[next]=1;queue[end++]=next}}}
 return p=>p.x>=0&&p.y>=0&&p.x<=bounds.w-1&&p.y<=bounds.h-1&&!!visited[Math.round(p.y*4)*w+Math.round(p.x*4)];
}
export function path(a,b,rooms,avoid=[],bounds=GRID){
 const {w,h,n,walls}=wallsFor(rooms,bounds);
 const ax=Math.round(a.x*4),ay=Math.round(a.y*4),bx=Math.round(b.x*4),by=Math.round(b.y*4);if(ax<0||ax>=w||ay<0||ay>=h||bx<0||bx>=w||by<0||by>=h)return null;
 const start=ay*w+ax,goal=by*w+bx,occupied=walls.slice(),previous=new Int32Array(n).fill(-1),queue=new Int32Array(n);for(const p of avoid){const x=Math.round(p.x*4),y=Math.round(p.y*4);if(x>=0&&x<w&&y>=0&&y<h)occupied[y*w+x]=1}
 queue[0]=start;previous[start]=start;let end=1;
 for(let i=0;i<end;i++){const c=queue[i];if(c===goal){const result=[];for(let v=c;v!==start;v=previous[v])result.push({x:(v%w)/4,y:Math.floor(v/w)/4});return result.reverse()}
  const x=c%w,y=Math.floor(c/w);for(const next of [x+1<w?c+1:-1,y+1<h?c+w:-1,x>0?c-1:-1,y>0?c-w:-1])if(next>=0&&!occupied[next]&&previous[next]===-1){previous[next]=c;queue[end++]=next}
 }return null;
}
