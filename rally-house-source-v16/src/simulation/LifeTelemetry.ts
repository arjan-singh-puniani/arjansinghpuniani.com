import type {LifeScene} from './EverydayLife.js';
export class LifeTelemetry {
 seconds=0;samples=0;idle=0;quiet=0;interruptions=0;cancellations=0;meaningful=0;memoryCount=0;favoriteUses=0;rituals=0;
 scenes:Record<string,number>={};pairs:Record<string,number>={};places:Record<string,number>={};initiators:Record<string,number>={};
 log:{at:number;day:number;minute:number;who:string[];what:string;why:string;changed:string;next:string}[]=[];
 sample(dt:number,people:{state:string;busy:boolean}[]){this.seconds+=dt;this.samples+=people.length*dt;this.idle+=people.filter(p=>p.state==='idle'&&!p.busy).length*dt;this.quiet+=people.filter(p=>['watch','sit','drink','stretch'].includes(p.state)).length*dt;}
 completed(scene:LifeScene,day:number,minute:number,why:string,next:string,favorite=false){
  const add=(r:Record<string,number>,k:string)=>r[k]=(r[k]??0)+1;
  add(this.scenes,scene.family??scene.id);add(this.places,scene.objectId??scene.place);add(this.initiators,scene.people[0]);if(scene.people.length>1)add(this.pairs,[...scene.people].sort().join('|'));
  this.meaningful++;this.rituals+=scene.ritual?1:0;this.favoriteUses+=favorite?1:0;
  this.log.push({at:this.seconds,day,minute,who:[...scene.people],what:scene.title,why,changed:scene.memory,next});this.log=this.log.slice(-240);
 }
 report(){const top=(r:Record<string,number>)=>Object.entries(r).sort((a,b)=>b[1]-a[1])[0]??null,totalPairs=Object.values(this.pairs).reduce((a,b)=>a+b,0),pair=top(this.pairs);return {seconds:this.seconds,uniqueScenes:Object.keys(this.scenes).length,uniquePairs:Object.keys(this.pairs).length,uniqueLocations:Object.keys(this.places).length,idlePercent:this.samples?this.idle/this.samples*100:0,quietPercent:this.samples?this.quiet/this.samples*100:0,mostRepeatedBehavior:top(this.scenes),mostRepeatedPair:pair,flags:totalPairs>=8&&pair&&pair[1]/totalPairs>.7?['One pair accounts for over 70% of social scenes; inspect the relationship explanation.']:[],initiators:this.initiators,scenes:this.scenes,pairs:this.pairs,places:this.places,interruptions:this.interruptions,cancellations:this.cancellations,meaningful:this.meaningful,memoryCount:this.memoryCount,favoriteUses:this.favoriteUses,rituals:this.rituals,log:this.log};}
}
