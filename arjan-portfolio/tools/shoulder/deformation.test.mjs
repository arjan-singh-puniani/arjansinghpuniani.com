import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { SurfaceTissue, weldSurface, SOLVER } from '../../public/holoanatomy/shoulder/deformation.js';
import { supportRegions } from '../../public/holoanatomy/shoulder/anatomy.js';
import { parseOBJ } from '../../public/holoanatomy/src/engine/obj.js';
const base=new URL('../../public/holoanatomy/shoulder/assets/atlas/',import.meta.url);
const assets=await Promise.all(['ZA_infra','ZA_infra_tendon','ZA_infra_insertion'].map(async id=>parseOBJ(await readFile(new URL(id+'.obj',base),'utf8'))));
const positions=[...assets[0].positions,...assets[1].positions],indices=[...assets[0].indices,...Array.from(assets[1].indices,i=>i+assets[0].positions.length/3)];
const surface=weldSurface(positions,indices),supports=supportRegions(surface.rest,assets[2].positions,new Float64Array(surface.rest.length/3).fill(.025));
function fixture(){return new SurfaceTissue({...surface,pins:supports.pins,axis:supports.axis});}
function belly(s){let best=-1,d=Infinity;const center=[.2,-.4,-.52];for(let i=0;i<s.x.length;i+=3){if(s.pins[i/3])continue;const r=Math.hypot(...center.map((v,k)=>v-s.x[i+k]));if(r<d){d=r;best=i;}}return Array.from(s.x.slice(best,best+3));}
function run(s,seconds,rate=60){for(let f=0;f<Math.round(seconds*rate);f++)s.advance(1/rate);}
test('actual infraspinatus source mesh deforms locally while support particles stay exact',()=>{
 const s=fixture();s.grasp(belly(s));s.pull([0,.08,-.2]);run(s,.5);
 const d=s.diagnostics();assert.equal(d.pinError,0);assert.ok(d.maxDisplacement>.008,JSON.stringify(d));assert.ok(d.maxDisplacement<=SOLVER.maxPull+1e-6);assert.ok(d.maxEdgeRatio<1.5,JSON.stringify(d));
 const changes=[];for(let i=0;i<s.x.length;i+=3)if(!s.pins[i/3])changes.push(Math.hypot(s.x[i]-s.rest[i],s.x[i+1]-s.rest[i+1],s.x[i+2]-s.rest[i+2]));
 assert.ok(Math.max(...changes)-Math.min(...changes)>.008);assert.equal(d.failed,false);
});
test('fixed time step is consistent at 30, 60, 120 and variable frame rates',()=>{
 const samples=[30,60,120].map(rate=>{const s=fixture();s.grasp(belly(s));s.pull([0,0,-.18]);run(s,.25,rate);return s;});
 // Compare equal exact elapsed time (30Hz sample rounds to 8 frames).
 const a=fixture(),b=fixture();for(const s of [a,b]){s.grasp(belly(s));s.pull([0,0,-.18]);}
 for(let i=0;i<12;i++){a.advance(1/30);b.advance(1/120);b.advance(1/40);}
 assert.equal(a.steps,b.steps);assert.ok(a.x.every((x,i)=>Math.abs(x-b.x[i])<1e-8));
 for(const s of samples)assert.equal(s.diagnostics().pinError,0);
});
test('release recovers source geometry, intentional hold persists, restore is exact',()=>{
 const s=fixture();s.grasp(belly(s));s.pull([0,0,-.2]);run(s,.2);s.release(true);run(s,.2);assert.equal(s.held,true);assert.ok(s.diagnostics().maxDisplacement>.005);
 s.release(false);run(s,5);assert.ok(s.diagnostics().maxDisplacement<.002,JSON.stringify(s.diagnostics()));s.restore();assert.deepEqual(s.x,s.rest);
});
test('rapid alternating/extreme input and repeated grasps cannot explode or drift anchors',()=>{
 const s=fixture();for(let cycle=0;cycle<8;cycle++){s.grasp(belly(s));for(let f=0;f<12;f++){s.pull([f%2?100:-100,100,-100]);s.advance(1/60);}assert.equal(s.diagnostics().pinError,0);assert.ok(s.x.every(Number.isFinite));s.release();s.restore();}
 assert.deepEqual(s.x,s.rest);s.grasp(belly(s));s.pull([NaN,0,0]);s.advance(1/60);assert.ok(s.x.every(Number.isFinite));assert.equal(s.failed,false);
});
test('source bone contact half-spaces prevent incremental penetration',()=>{
 const s=fixture();const i=Array.from(s.pins).findIndex(p=>!p);s.contacts=[{index:i,point:[s.rest[i*3],s.rest[i*3+1],s.rest[i*3+2]-.01],normal:[0,0,1],margin:.005}];
 s.grasp(Array.from(s.rest.slice(i*3,i*3+3)));s.pull([0,0,-1]);run(s,.2);assert.ok(s.x[i*3+2]>=s.rest[i*3+2]-.005-1e-8);assert.equal(s.diagnostics().pinError,0);
});
test('closed source surfaces enable volume correction; open surfaces do not claim volume',()=>{
 const s=fixture();assert.equal(typeof s.closed,'boolean');assert.equal(s.volumeEnabled,s.closed&&Math.abs(s.restVolume)>1e-7);
 const open=new SurfaceTissue({rest:[0,0,0,1,0,0,0,1,0],faces:[0,1,2],pins:[1,0,1]});assert.equal(open.volumeEnabled,false);
 assert.throws(()=>new SurfaceTissue({rest:[NaN,0,0],faces:[0,1,2],pins:[0]}));
});
console.log('Source solver topology',fixture().diagnostics());

test('support-region definition and mechanics are invariant under a common translation',()=>{
 const translation=[2,-3,1];
 const moved=Float64Array.from(surface.rest,(v,i)=>v+translation[i%3]);
 const insertion=Float64Array.from(assets[2].positions,(v,i)=>v+translation[i%3]);
 const d=supportRegions(moved,insertion,new Float64Array(moved.length/3).fill(.025));
 assert.deepEqual(d.pins,supports.pins);
 assert.ok(d.axis.every((v,i)=>Math.abs(v-supports.axis[i])<1e-8));
 const a=fixture(),b=new SurfaceTissue({rest:moved,faces:surface.faces,pins:d.pins,axis:d.axis});
 const point=belly(a);a.grasp(point);b.grasp(point.map((v,i)=>v+translation[i]));
 for(const s of [a,b]){s.pull([0,.05,-.1]);run(s,.1);}
 assert.ok(a.x.every((v,i)=>Math.abs(v-(b.x[i]-translation[i%3]))<1e-7));
});
test('responsive mechanics retains bounds and attachments',()=>{
 const s=fixture();s.iterations=3;s.grasp(belly(s));s.pull([2,-2,2]);run(s,.2);
 assert.equal(s.diagnostics().pinError,0);assert.ok(s.diagnostics().maxDisplacement<=SOLVER.maxPull+1e-6);assert.equal(s.failed,false);
});

test('distance constraint sweeps converge toward source segment lengths',()=>{
 const s=fixture();let i=0;while(s.pins[i])i++;s.x[i*3]+=.12;s.x[i*3+1]-=.08;
 const residual=()=>s.edges.reduce((sum,e)=>sum+Math.abs(Math.hypot(s.x[e.a]-s.x[e.b],s.x[e.a+1]-s.x[e.b+1],s.x[e.a+2]-s.x[e.b+2])-e.L),0);
 const before=residual();for(let k=0;k<25;k++){for(const e of s.edges)e.lambda=0;s.projectEdges(s.edges,1/120);}
 assert.ok(residual()<before*.5);assert.equal(s.diagnostics().pinError,0);
});
