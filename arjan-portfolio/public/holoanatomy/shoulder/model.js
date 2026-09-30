/** Pure domain state. World +X=left, +Y=superior, +Z=anterior. */
export const SITS=['FJ1506','FJ1500','FJ1508','FJ1504'];
export const BONES=['FJ3384','FJ3362','FJ3368'];
export const DELTOID=['FJ1467','FJ1468','FJ1513'];
export const VESSELS=['FJ3579','FJ2268','FJ2303','FJ2298','FJ2273','FJ2269','FJ2302','FJ2299','FJ2274'];
export const ALL=[...BONES,...SITS,...DELTOID,'FJ1478',...VESSELS];
export const TISSUES={
 BONE:{baseColor:'#cec2a6',roughness:.76,specular:.22,ghostAlpha:.12},
 SKELETAL_MUSCLE:{baseColor:'#974f44',roughness:.69,specular:.25,ghostAlpha:.09},
 TENDON:{baseColor:'#d6cbb6',roughness:.78,specular:.2,ghostAlpha:.12},
 CARTILAGE:{baseColor:'#dbd6c8',roughness:.54,specular:.3,ghostAlpha:.13},
 ARTERY:{baseColor:'#983d36',roughness:.64,specular:.24,ghostAlpha:.13},
 VEIN:{baseColor:'#576778',roughness:.7,specular:.22,ghostAlpha:.13},
 NERVE:{baseColor:'#b8ab77',roughness:.78,specular:.2,ghostAlpha:.15},
 CONNECTIVE_TISSUE:{baseColor:'#c4b5a4',roughness:.82,specular:.18,ghostAlpha:.12},
 GENERIC_SOFT_TISSUE:{baseColor:'#a18174',roughness:.75,specular:.2,ghostAlpha:.1},
};
export const CUFF_COLORS={'FJ1506':'#a7815f','FJ1500':'#985e56','FJ1508':'#a57770','FJ1504':'#b2664b'};
export function tissueFor(part){return ({skeleton:'BONE',muscles:'SKELETAL_MUSCLE',arteries:'ARTERY',veins:'VEIN',nerves:'NERVE'})[part.layer]||'GENERIC_SOFT_TISSUE';}
function preset(label,yaw,pitch,distance,visible,ghost,purpose,labels,target=[0,.12,0]){
 return {label,yaw,pitch,distance,fov:32,target,visible,ghost,hidden:ALL.filter(id=>!visible.includes(id)&&!ghost.includes(id)),purpose,labels};
}
export const PRESETS={
 posterior:preset('Posterior cuff',-2.85,.17,3.9,[...BONES,...SITS],[],'Compare the cuff behind the scapula.',SITS.slice(0,3)),
 anterior:preset('Anterior cuff',-.35,.1,3.9,[...BONES,...SITS],[],'Find subscapularis on the costal surface.', ['FJ1504','FJ1506']),
 superior:preset('Superior · supraspinatus',-.8,1.18,3.25,[...BONES,'FJ1506'],['FJ1500','FJ1504','FJ1508'],'Follow supraspinatus above the scapular spine.',['FJ1506']),
 lateral:preset('Lateral insertion',-Math.PI/2,.1,3.5,[...BONES,...SITS],[],'Inspect the relationship to the proximal humerus; footprints are not segmented.',['FJ1506','FJ1500','FJ1508']),
 joint:preset('Glenohumeral context',-.8,.22,3.8,BONES,SITS,'Locate the humeral head and glenoid with ghosted cuff context.',[],[-.18,.06,0]),
 vascular:preset('Regional vessels',-.55,.15,5.3,[...BONES,...VESSELS],SITS,'Inspect the supplied regional vessels. This is an incomplete vascular tree.',[],[-.2,-.4,0]),
};
export const LESSON=[
 {title:'A mobile joint. A stabilizing cuff.',text:'Start with the scapula and humeral head. The cuff helps keep the head centered as the arm moves.',view:'joint'},
 {title:'Above the spine',text:'Find supraspinatus in the supraspinous fossa. Select the highlighted muscle to inspect its source.',view:'posterior',id:'FJ1506'},
 {title:'Look from above',text:'Rotate superiorly and see its relationship to the acromion. A separate tendon is not provided by this mesh.',view:'superior',id:'FJ1506'},
 {title:'The posterior cuff',text:'Infraspinatus spreads below the scapular spine. Follow its broad form toward the humerus.',view:'posterior',id:'FJ1500'},
 {title:'Similar direction, different scale',text:'Teres minor sits inferior to infraspinatus. Compare the slender teres minor with its broad neighbor.',view:'posterior',id:'FJ1508'},
 {title:'Turn to the front',text:'Move around the rib-facing surface of the scapula. The anterior cuff comes into view.',view:'anterior'},
 {title:'Subscapularis',text:'This broad anterior muscle inserts on the lesser tubercle. Its insertion footprint is described in text, not drawn on this model.',view:'anterior',id:'FJ1504'},
 {title:'Reconstruct the cuff',text:'Orbit around the four muscles. One superior, two posterior, one anterior: a spatial arrangement around the joint.',view:'lateral'},
 {title:'Now find them yourself',text:'Use the 3D model to identify the muscles. Labels are removed in Quiz. A first-attempt answer earns a point; retries are for learning.',view:'posterior',quiz:true},
];
export const CURRICULUM={
 FJ1506:{name:'Supraspinatus',origin:'Supraspinous fossa of the scapula.',insertion:'Superior facet of the greater tubercle of the humerus.',action:'Assists arm abduction and joint stabilization.',innervation:'Suprascapular nerve (C5–C6).',relationship:'Above the scapular spine; passes beneath the acromion.',clinical:'A frequent site of rotator-cuff tendon injury.'},
 FJ1500:{name:'Infraspinatus',origin:'Infraspinous fossa of the scapula.',insertion:'Middle facet of the greater tubercle of the humerus.',action:'External rotation; helps stabilize the humeral head.',innervation:'Suprascapular nerve (C5–C6).',relationship:'Broad posterior cuff, inferior to the scapular spine.',clinical:'External-rotation weakness can accompany posterior cuff dysfunction.'},
 FJ1508:{name:'Teres minor',origin:'Lateral border of the scapula.',insertion:'Inferior facet of the greater tubercle of the humerus.',action:'External rotation and joint stabilization.',innervation:'Axillary nerve (C5–C6).',relationship:'Inferior to infraspinatus, forming the lower posterior cuff.',clinical:'Axillary nerve injury may impair its function.'},
 FJ1504:{name:'Subscapularis',origin:'Subscapular fossa on the anterior scapula.',insertion:'Lesser tubercle of the humerus.',action:'Internal rotation and joint stabilization.',innervation:'Upper and lower subscapular nerves (primarily C5–C6).',relationship:'Between the scapula and thoracic wall.',clinical:'Subscapularis dysfunction may reduce internal-rotation strength.'},
};
export const SOURCES=[{title:'Anatomy, Rotator Cuff · StatPearls / NCBI',url:'https://www.ncbi.nlm.nih.gov/books/NBK441844/'},{title:'Scapulohumeral Muscles · StatPearls / NCBI',url:'https://www.ncbi.nlm.nih.gov/books/NBK546633/'},{title:'US anatomy of the shoulder · peer-reviewed pictorial essay',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC3553044/'}];
export function createState(){return {mode:'explore',view:'posterior',selected:null,isolated:false,atlas:true,peel:2,staged:[],undo:[],lesson:0,quiz:{index:0,score:0,answered:false,retried:false,previous:null},section:false};}
export function visibility(state,id){
 const p=PRESETS[state.view];let value=p.visible.includes(id)?'visible':p.ghost.includes(id)?'ghost':'hidden';
 if(state.mode==='peel'){
  value=[...BONES,...SITS].includes(id)?'visible':'hidden';
  if(DELTOID.includes(id))value=state.peel===0?'visible':state.peel===1?'ghost':'hidden';
  if(state.peel===4&&SITS.includes(id)&&id!==state.selected)value='ghost';
 }
 if(state.selected===id&&state.mode!=='quiz')value='visible';
 if(state.mode==='quiz'&&SITS.includes(id))value='visible';
 if(state.isolated&&state.selected&&id!==state.selected&&value==='visible')value='ghost';
 return value;
}
export function stage(state,id){if(!SITS.includes(id)||state.staged.includes(id))return;state.undo.push([...state.staged]);state.staged.push(id);state.peel=3;}
export function undoStage(state){if(state.undo.length)state.staged=state.undo.pop();}
export function reassemble(state){if(state.staged.length)state.undo.push([...state.staged]);state.staged=[];}
export function question(state){
 const order=['FJ1506','FJ1504','FJ1500','FJ1508'];const id=order[state.quiz.index%4],level=Math.floor(state.quiz.index/4);
 const relation={FJ1506:'Select the cuff muscle above the scapular spine.',FJ1504:'Select the anterior rotator-cuff muscle.',FJ1500:'Select the broad posterior muscle below the scapular spine.',FJ1508:'Which cuff muscle lies inferior to infraspinatus?'};
 return {id,prompt:level?relation[id]:`Identify ${CURRICULUM[id].name.toLowerCase()}.`,view:id==='FJ1504'?'anterior':'posterior',level:level?'Relationships':'Identification'};
}
export function answer(state,id){if(state.quiz.answered)return 'answered';const correct=id===question(state).id;if(correct){state.quiz.answered=true;if(!state.quiz.retried)state.quiz.score++;return 'correct';}state.quiz.retried=true;return 'retry';}
export function nextQuestion(state){if(!state.quiz.answered)return false;state.quiz.previous=question(state).id;state.quiz.index++;state.quiz.answered=false;state.quiz.retried=false;return true;}
export function layoutLabels(items,width,height){
 const gap=44,margin=18;const sides=[[],[]];for(const item of items)sides[item.x<width/2?0:1].push(item);
 return sides.flatMap((side,i)=>{side.sort((a,b)=>a.y-b.y);const maxY=height-70;let y=70;return side.map((item,index)=>{y=Math.max(y,Math.min(item.y,maxY-(side.length-index-1)*gap));const out={...item,labelX:i?width-180:margin,labelY:y};y+=gap;return out;});});
}
export const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
export function zoomDistance(distance,delta){return clamp(distance*Math.exp(delta),1.4,7.5);}
export function isClick(start,end,multi){return !multi&&Math.hypot(end.x-start.x,end.y-start.y)<6;}
