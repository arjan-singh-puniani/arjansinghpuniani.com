import {metric,type Joint,type MotionClip,type MotionFrame} from './MotionCapture.js';

export interface ServeSnapshot {title:string;caption:string;joint:Joint;frame:MotionFrame;}

/** Select observed moments from the latest complete serve; never fill recording gaps with a demo. */
export function serveSnapshots(clip:MotionClip):ServeSnapshot[]{
 const frames=clip.frames;
 for(let contact=frames.length-1;contact>=0;contact--){
  if(!frames[contact].contact||frames[contact].state!=='serve')continue;
  let start=contact,end=contact;
  while(start>0&&frames[start-1].state==='serve'&&frames[start].time-frames[start-1].time<=.15)start--;
  while(end+1<frames.length&&frames[end+1].state==='serve'&&frames[end+1].time-frames[end].time<=.15)end++;
  if(frames[start].pose.sp>.12||frames[end].pose.sp<.85||start===contact||end===contact)continue;
  const before=frames.slice(start,contact),after=frames.slice(contact+1,end+1);
  // Observed peak bend and normalized follow-through avoid fixed timestamps that differ between players.
  const load=before.reduce((a,b)=>(metric(b,'knee')??-Infinity)>(metric(a,'knee')??-Infinity)?b:a);
  const finish=after.reduce((a,b)=>Math.abs(b.pose.sp-.85)<Math.abs(a.pose.sp-.85)?b:a);
  if(metric(load,'knee')===null||metric(frames[contact],'elbow')===null)continue;
  return [
   {title:'Load',caption:'Knee flexion',joint:'knee',frame:load},
   {title:'Contact',caption:'Recorded racket contact',joint:'elbow',frame:frames[contact]},
   {title:'Finish',caption:'Follow-through',joint:'shoulder',frame:finish},
  ];
 }
 return [];
}
