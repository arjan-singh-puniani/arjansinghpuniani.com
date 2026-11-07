import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {initial,expandSite,enableEquipment,build,staffModule,tick,placement,siteOf,placementStep} from '../dist/simulation.mjs';
const app=fs.readFileSync('dist/app.mjs','utf8'),source=app.slice(app.indexOf('function updateLocations('),app.indexOf('\n\nfunction checkTile'));
const s=initial('clinic',431,'sandbox',{gentle:true,receptionFirst:true});expandSite(s);enableEquipment(s);
const results=[];
for(const[type,tile,rotation]of[['intake',{x:.25,y:25},1],['gp',{x:3.5,y:24},0],['intake',{x:.25,y:25},1]]){
 const bounds=siteOf(s),step=placementStep(s),candidates=[{...tile}];
 for(let dy=-1;dy<=1;dy+=step)for(let dx=-1;dx<=1;dx+=step)candidates.push({x:tile.x+dx,y:tile.y+dy});
 for(let y=0;y<bounds.h;y+=3)for(let x=0;x<bounds.w;x+=3)candidates.push({x,y});
 for(const x of[0,bounds.w-1])for(const y of[0,bounds.h-1])candidates.push({x,y});
 const seen=new Set();let exhaustiveChecks=0;const before=performance.now();
 const expected=candidates.filter(p=>{const key=p.x+','+p.y;if(seen.has(key))return false;seen.add(key);exhaustiveChecks++;return placement(s,type,p.x,p.y,rotation).ok}).sort((a,b)=>Math.abs(a.x-tile.x)+Math.abs(a.y-tile.y)-Math.abs(b.x-tile.x)-Math.abs(b.y-tile.y)).slice(0,32),exhaustiveMs=performance.now()-before;
 const dom=new Map();let actual,navigationChecks=0;const context={s,held:null,tile:{...tile},tool:type,rotation,siteOf,placementStep,$:id=>{if(!dom.has(id))dom.set(id,{});return dom.get(id)},checkTile:(x,y)=>{navigationChecks++;return placement(s,type,x,y,rotation)},showPreview(){},renderer:{planningTargets(options){actual=options}}};vm.createContext(context);const start=performance.now();vm.runInContext(source+';updateLocations()',context);const actualMs=performance.now()-start;
 assert.deepEqual(JSON.parse(JSON.stringify(actual)),expected,'same nearest valid locations and stable tie ordering');assert(navigationChecks<=exhaustiveChecks);assert.equal(actual.length,32);for(const p of actual)assert(placement(s,type,p.x,p.y,rotation).ok);
 if(results.length<2)assert(navigationChecks<exhaustiveChecks/2,'opening stops expensive checks after32 suggestions');
 results.push({type,existingRooms:s.rooms.length,exhaustiveChecks,navigationChecks,exhaustiveMs,actualMs});
 if(s.rooms.length<2){const room=build(s,type,tile.x,tile.y,rotation);assert(room.ok);staffModule(s,room.room.id);for(let t=0;t<10;t++)tick(s)}
}
fs.writeFileSync('evidence/first-minute-rc9/placement-suggestions.json',JSON.stringify({hardware:'Apple M2 / Node22; actual app function, not iPhone or end-to-end input latency',results},null,2));console.log('PASS: actual UI suggestion function preserves nearest valid sites, collisions and stable ties while reducing opening navigation checks',results);
