import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
const root=process.env.QA_RUNTIME?pathToFileURL(process.env.QA_RUNTIME+'/'):new URL('../',import.meta.url);
const [{Character},{playerSpec},{memberData},{Navigation},{Vec3},{loadAuthoredAthlete},{InteractiveMatchSystem},{MatchInput},{CHAMPIONSHIP_OPPONENTS}]=await Promise.all(['entities/Character','content/PlayerAvatars','content/content','world/Navigation','rendering/Math3D','animation/AuthoredAthlete','tennis/InteractiveMatchSystem','tennis/MatchInput','tennis/ChampionshipOpponents'].map(p=>import(new URL('dist/'+p+'.js',root))));
const fetchBefore=globalThis.fetch,imageBefore=globalThis.Image;
try{
 globalThis.fetch=async url=>new Response(fs.readFileSync(new URL(url)));globalThis.Image=class{async decode(){}};await loadAuthoredAthlete();
 let cases=0,maxVerticalSpeed=0,maxHeadRange=0,anchoredChecks=0;
 for(const spec of [playerSpec('taylor'),playerSpec('arjan'),...memberData])for(const hz of [30,60,120])for(const [x,z] of [[1,0],[-1,0],[0,1],[0,-1]]){
  const p=new Character(spec,new Vec3(1,0,5),new Navigation([]),{}),o=new Character(memberData.find(s=>s.id==='mika'),new Vec3(1,0,-5),new Navigation([]),{}),input=new MatchInput(),match=new InteractiveMatchSystem(p,o,CHAMPIONSHIP_OPPONENTS.mika,input);
  match.startPoint('player');input.setEnabled(true);for(let i=0;i<hz;i++){match.update(1/hz);p.update(1/hz);o.update(1/hz);}
  let last=null,low=Infinity,high=-Infinity;
  for(let i=0;i<hz*3;i++){
   const t=i/hz,amount=t<.6?1:t<1.2?0:t<1.5?-1:t<1.6?0:t<1.7?1:0;input.setTouchMovement(x*amount,z*amount);match.update(1/hz);p.update(1/hz);o.update(1/hz);const pose=p.analysisPose(),k=p.debugKinematics();low=Math.min(low,pose.head.y);high=Math.max(high,pose.head.y);
   if(last){const vertical=Math.abs(pose.head.y-last.pose.head.y)*hz;maxVerticalSpeed=Math.max(maxVerticalSpeed,vertical);assert(vertical<2.5,`${spec.id}/${hz}/${x},${z}/${t}: court movement jolts the head at ${vertical} units/s`);
    if(p.state==='shuffle'&&last.state==='shuffle')for(const [side,planted] of [['L',k.leftFootPlanted],['R',k.rightFootPlanted]])if(planted&&last[side]){assert(Vec3.sub(pose['foot'+side],last.pose['foot'+side]).len()<1e-6,'A support shoe must stay fixed while the body travels');anchoredChecks++;}
   }
   last={pose,state:p.state,L:k.leftFootPlanted,R:k.rightFootPlanted};
  }
  const range=high-low;maxHeadRange=Math.max(maxHeadRange,range);assert(range<.06,`${spec.id}/${hz}/${x},${z}: steering makes the torso dip ${range} units`);cases++;
 }
 assert(anchoredChecks>1000);console.log(JSON.stringify({cases,maxVerticalSpeed,maxHeadRange,anchoredChecks}));
}finally{globalThis.fetch=fetchBefore;globalThis.Image=imageBefore;}
