"use client";
import {useEffect,useMemo,useState} from 'react';
import {ArrowUpRight,ChevronLeft,ChevronRight} from 'lucide-react';
import {structures} from '@/lib/atlas';
import {interventionSummaries} from '@/lib/intervention-view';
import type {InterventionAnnotation,LabelProjection} from '@/lib/annotations';

const displayParent:Record<string,string>={
 'UBERON:0000956':'UBERON:0000955','UBERON:0001897':'UBERON:0000955','UBERON:0001906':'UBERON:0000955','UBERON:0003129':'UBERON:0000955','BODY:external-head':'UBERON:0000955','BODY:spinal-epidural':'UBERON:0002240',
 'BODY:coronary':'BODY:heart','BODY:heart-valves':'BODY:heart','BODY:cornea':'BODY:eye','BODY:retina':'BODY:eye','BODY:lens':'BODY:eye',
};
const GOLDEN=2.399963229728653;
export default function InterventionConstellation({entries,projection,selected,onSelect,onRegion,named=false}:{entries:InterventionAnnotation[];projection:LabelProjection;selected:string|null;onSelect:(id:string)=>void;onRegion:(id:string)=>void;named?:boolean}){
 const [hover,setHover]=useState<InterventionAnnotation|null>(null),[page,setPage]=useState(0);
 const groups=useMemo(()=>{
  const index=new Map<string,InterventionAnnotation[]>();
  for(const entry of entries){const original=entry.mapping.structureId!;const parent=displayParent[original];const id=parent&&projection.regions.includes(parent)?parent:original;if(!projection.regions.includes(id))continue;index.set(id,[...index.get(id)||[],entry]);}
  return [...index].map(([id,items])=>({id,items,name:structures.find(s=>s.id===id)?.name||id}));
 },[entries,projection.regions.join(',')]);
 const compact=projection.width<650,width=named?(compact?132:210):(compact?112:148);
 const glyphScale=Math.max(.3,Math.min(1,projection.height/650));
 const rowHeight=named?(compact?36:42):24,top=named?(compact?45:68):52,bottom=named?(compact?105:150):90;
 const limit=Math.max(2,Math.floor((projection.height-top-bottom)/rowHeight)*2);
 const priorities=['BODY:heart','BODY:eye','UBERON:0000955','BODY:lung','BODY:knee','BODY:hip','BODY:kidney','BODY:foot'];
 const positioned=groups.filter(g=>projection.points[g.id]).map(g=>({...g,point:projection.points[g.id]})).sort((a,b)=>Number(a.items.some(e=>e.mapping.type!=='indication_context'))-Number(b.items.some(e=>e.mapping.type!=='indication_context')));
 // In an overview, show one named approach per region; focusing a region exposes all its approaches.
 const candidates=named?positioned.flatMap(g=>positioned.length<=3?g.items.map(entry=>({...g,entry,key:entry.familyId})):[{...g,entry:g.items.find(e=>e.familyId===selected)||g.items.find(e=>e.familyId==='rns')||g.items[0],key:g.id}]).sort((a,b)=>a.point[1]-b.point[1]):[];
 const important=candidates.filter(g=>priorities.includes(g.id));
 const rest=candidates.filter(g=>!important.includes(g));
 const first=[...important.slice(0,limit)];
 const slots=Math.min(limit-first.length,rest.length);
 for(let i=0;i<slots;i++)first.push(rest[Math.floor(i*rest.length/slots)]);
 const remaining=candidates.filter(g=>!first.includes(g));
 const labelPages=[first];for(let i=0;i<remaining.length;i+=limit)labelPages.push(remaining.slice(i,i+limit));
 const pages=labelPages.length,pageIndex=Math.min(page,pages-1);
 const namedLabels=[...labelPages[pageIndex]].sort((a,b)=>a.point[1]-b.point[1]);
 const signature=groups.map(g=>g.id+':'+g.items.map(e=>e.familyId).join(',')).join('|');
 useEffect(()=>setPage(0),[signature]);
 useEffect(()=>{const i=labelPages.findIndex(list=>list.some(g=>positioned.length<=3?g.entry.familyId===selected:g.items.some(e=>e.familyId===selected)));if(i>=0)setPage(i);},[selected,pages,signature]);
 const regional=[...positioned].sort((a,b)=>{const pa=priorities.indexOf(a.id),pb=priorities.indexOf(b.id);return (pa<0?99:pa)-(pb<0?99:pb)||b.items.length-a.items.length;}).slice(0,limit).sort((a,b)=>a.point[1]-b.point[1]);
 const labels=(named?namedLabels:regional.map(g=>({...g,entry:g.items[0],key:g.id}))).map((g,i)=>({...g,side:i%2,labelY:g.point[1]}));
 for(const side of [0,1]){
  const column=labels.filter(g=>g.side===side);let previous=top;
  for(const g of column){g.labelY=Math.max(previous,Math.min(projection.height-bottom,g.labelY));previous=g.labelY+rowHeight;}
  let next=projection.height-bottom;
  for(const g of [...column].reverse()){g.labelY=Math.min(g.labelY,next);next=g.labelY-rowHeight;}
 }
 return <div className={`intervention-constellation ${named?'constellation-named':''}`} role="group" aria-label="Whole-body intervention map" style={{width:projection.width,height:projection.height}}>
 <svg width={projection.width} height={projection.height} className="constellation-svg" aria-hidden="true">{positioned.map(group=>{const [x,y]=group.point;return <g key={group.id}><circle cx={x} cy={y} r={Math.min(44,9+Math.sqrt(group.items.length)*3)*glyphScale} className="region-orbit"/>{group.items.map((entry,i)=>{const r=(7+Math.sqrt(i)*3.2)*glyphScale,angle=i*GOLDEN;const px=x+Math.cos(angle)*r,py=y+Math.sin(angle)*r;return <g key={entry.familyId} className={entry.familyId===selected?'record-node node-selected':entry.mapping.type==='indication_context'?'record-node node-context':'record-node node-reviewed'} onPointerDown={e=>e.stopPropagation()} onClick={()=>onSelect(entry.familyId)} onPointerEnter={()=>setHover(entry)} onPointerLeave={()=>setHover(null)}><title>{entry.name} — {entry.role}: {entry.regionName}</title><circle cx={px} cy={py} r={Math.max(2,5*glyphScale)} className="record-hit"/><circle cx={px} cy={py} r={Math.max(.8,(entry.familyId===selected?4:2.2)*glyphScale)}/></g>;})}</g>;})}{labels.map(g=>{const p=projection.points[g.id],x=g.side?projection.width-width-8:width+8;return <path key={'label-'+g.key} className="region-connector" d={`M ${p[0]} ${p[1]} L ${x} ${g.labelY+(named?18:10)}`}/>;})}</svg>
 <div className="constellation-region-index" aria-label={named?'Named interventions':'Map regions'}>{labels.map(group=>{
  const style={left:group.side?projection.width-width-8:8,top:group.labelY,width};
  return named?<div key={group.key} className={`constellation-intervention ${group.entry.familyId===selected?'constellation-selected':''}`} style={style} data-family={group.entry.familyId}>
   <button className="constellation-select" aria-label={`Select ${group.entry.name} from body map`} aria-pressed={group.entry.familyId===selected} title={`${group.entry.title} — ${group.entry.role}: ${group.entry.regionName}`} onClick={()=>onSelect(group.entry.familyId)}><strong>{group.entry.title}</strong><span>{group.entry.regionName} · {group.entry.role}</span></button>
   <a className="constellation-source" href={interventionSummaries[group.entry.familyId]?.sourceUrl||group.entry.mapping.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={`Original source for ${group.entry.name}`} title="Original source"><ArrowUpRight size={12}/></a>
   {positioned.length>3&&group.items.length>1&&<button className="constellation-more" aria-label={`Explore all ${group.items.length} interventions in ${group.name}`} title={`All ${group.name} interventions`} onClick={()=>onRegion(group.id)}>+{group.items.length-1}</button>}
  </div>:<button key={group.key} className="constellation-region" aria-label={`Explore ${group.name} — ${group.items.length} indexed entries`} style={style} onClick={()=>onRegion(group.id)}><span>{group.name}</span><strong>{group.items.length}</strong></button>;
 })}</div>
 {named&&pages>1&&<div className="constellation-pages"><button aria-label="Previous mapped interventions" disabled={pageIndex===0} onClick={()=>setPage(p=>Math.max(0,p-1))}><ChevronLeft size={13}/></button><span>{pageIndex+1} / {pages}</span><button aria-label="Next mapped interventions" disabled={pageIndex===pages-1} onClick={()=>setPage(p=>Math.min(pages-1,p+1))}><ChevronRight size={13}/></button></div>}
 {hover&&<div className="constellation-hover"><strong>{hover.name}</strong><span>{hover.mapping.type==='indication_context'?'Unreviewed FDA text context':`${hover.role} · ${hover.regionName}`}</span></div>}
 <div className="constellation-legend"><span><i/>Reviewed relationships</span><span><i/>FDA text context · unreviewed</span><small>{named?(compact?'Select a name or marker · + more in region':'Choose an intervention · + opens more in its region. Markers are regional record links.'):'Dots are indexed records, not implant sites.'}</small></div>
 </div>;
}
