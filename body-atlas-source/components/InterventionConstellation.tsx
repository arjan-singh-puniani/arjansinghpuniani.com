"use client";
import {useMemo,useState} from 'react';
import {structures} from '@/lib/atlas';
import type {InterventionAnnotation,LabelProjection} from '@/lib/annotations';

const displayParent:Record<string,string>={
 'UBERON:0000956':'UBERON:0000955','UBERON:0001897':'UBERON:0000955','UBERON:0001906':'UBERON:0000955','UBERON:0003129':'UBERON:0000955','BODY:external-head':'UBERON:0000955','BODY:spinal-epidural':'UBERON:0002240',
 'BODY:coronary':'BODY:heart','BODY:heart-valves':'BODY:heart','BODY:cornea':'BODY:eye','BODY:retina':'BODY:eye','BODY:lens':'BODY:eye',
};
const GOLDEN=2.399963229728653;
export default function InterventionConstellation({entries,projection,selected,onSelect,onRegion}:{entries:InterventionAnnotation[];projection:LabelProjection;selected:string|null;onSelect:(id:string)=>void;onRegion:(id:string)=>void}){
 const [hover,setHover]=useState<InterventionAnnotation|null>(null);
 const groups=useMemo(()=>{
  const index=new Map<string,InterventionAnnotation[]>();
  for(const entry of entries){const original=entry.mapping.structureId!;const id=displayParent[original]||original;if(!projection.regions.includes(id))continue;index.set(id,[...index.get(id)||[],entry]);}
  return [...index].map(([id,items])=>({id,items,name:structures.find(s=>s.id===id)?.name||id}));
 },[entries,projection.regions.join(',')]);
 const compact=projection.width<650;
 const glyphScale=Math.max(.3,Math.min(1,projection.height/650));
 const rowHeight=24,limit=Math.max(2,Math.floor((projection.height-130)/rowHeight)*2);
 const priorities=['BODY:heart','BODY:eye','UBERON:0000955','BODY:lung','BODY:knee','BODY:hip','BODY:kidney','BODY:foot'];
 // Keep reviewed glyphs above contextual clouds in crowded overview regions.
 const positioned=groups.filter(g=>projection.points[g.id]).map(g=>({...g,point:projection.points[g.id]})).sort((a,b)=>Number(a.items.some(e=>e.mapping.type!=='indication_context'))-Number(b.items.some(e=>e.mapping.type!=='indication_context')));
 const ordered=[...positioned].sort((a,b)=>{const pa=priorities.indexOf(a.id),pb=priorities.indexOf(b.id);return (pa<0?99:pa)-(pb<0?99:pb)||b.items.length-a.items.length;}).slice(0,limit).sort((a,b)=>a.point[1]-b.point[1]);
 const labels=ordered.map((g,i)=>({...g,side:i%2}));
 for(const side of [0,1]){
  const column=labels.filter(g=>g.side===side);let previous=52;
  for(const g of column){g.point=[g.point[0],Math.max(previous,Math.min(projection.height-90,g.point[1]))];previous=g.point[1]+rowHeight;}
  let next=projection.height-90;
  for(const g of [...column].reverse()){g.point=[g.point[0],Math.min(g.point[1],next)];next=g.point[1]-rowHeight;}
 }
 // Record glyphs occupy a diagram spiral around a regional anchor. They are NOT anatomical/device coordinates.
 return <div className="intervention-constellation" role="group" aria-label="Whole-body intervention map" style={{width:projection.width,height:projection.height}}>
 <svg width={projection.width} height={projection.height} className="constellation-svg" aria-hidden="true">{positioned.map(group=>{const [x,y]=group.point;return <g key={group.id}><circle cx={x} cy={y} r={Math.min(44,9+Math.sqrt(group.items.length)*3)*glyphScale} className="region-orbit"/>{group.items.map((entry,i)=>{const r=(7+Math.sqrt(i)*3.2)*glyphScale,angle=i*GOLDEN;const px=x+Math.cos(angle)*r,py=y+Math.sin(angle)*r;return <g key={entry.familyId} className={entry.familyId===selected?'record-node node-selected':entry.mapping.type==='indication_context'?'record-node node-context':'record-node node-reviewed'} onPointerDown={e=>e.stopPropagation()} onClick={()=>onSelect(entry.familyId)} onPointerEnter={()=>setHover(entry)} onPointerLeave={()=>setHover(null)}><title>{entry.name} — {entry.role}: {entry.regionName}</title><circle cx={px} cy={py} r={Math.max(2,5*glyphScale)} className="record-hit"/><circle cx={px} cy={py} r={Math.max(.8,(entry.familyId===selected?4:2.2)*glyphScale)}/></g>;})}</g>;})}{labels.map(g=>{const p=projection.points[g.id];const x=g.side?projection.width-(compact?112:148)-8:(compact?112:148)+8;return <path key={'label-'+g.id} className="region-connector" d={`M ${p[0]} ${p[1]} L ${x} ${g.point[1]+10}`}/>;})}</svg>
 <div className="constellation-region-index" aria-label="Map regions">{labels.map((group)=>{const dx=group.side?projection.width-(compact?112:148)-8:8;const dy=group.point[1];return <button key={group.id} className="constellation-region" aria-label={`Explore ${group.name} — ${group.items.length} indexed entries`} style={{left:dx,top:dy}} onClick={()=>onRegion(group.id)}><span>{group.name}</span><strong>{group.items.length}</strong></button>;})}</div>
 {hover&&<div className="constellation-hover"><strong>{hover.name}</strong><span>{hover.mapping.type==='indication_context'?'Unreviewed FDA text context':`${hover.role} · ${hover.regionName}`}</span></div>}
 <div className="constellation-legend"><span><i/>Reviewed relationships</span><span><i/>FDA text context · unreviewed</span><small>Dots are indexed records, not implant sites.</small></div>
 </div>;
}
