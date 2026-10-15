import assert from 'node:assert/strict';import {ChampionshipArena,GALLERY_SEATS} from '../dist/tennis/ChampionshipArena.js';import {courtDetails} from '../dist/world/CourtDetail.js';
const arena=new ChampionshipArena(),net=courtDetails();assert.equal(GALLERY_SEATS.length,24);assert.equal(new Set(GALLERY_SEATS.map(s=>s.id)).size,24);
for(const s of GALLERY_SEATS){assert(Math.abs(s.x-1)>4.8||s.z<-7,'Every gallery seat remains outside the playable court');assert(Math.abs(s.x)<12&&Math.abs(s.z)<9.5);}
arena.begin();const idle=arena.meshes(0,1,false),snap=idle.filter(m=>'skin' in m&&m.skin.id.includes('gallery-arms')).map(m=>[...m.boneMatrices]);
assert(idle.length<40,'24 guests are batched rather than emitted as hundreds of draws');
assert.deepEqual(arena.meshes(.1,1,false).filter(m=>'skin' in m&&m.skin.id.includes('gallery-arms')).map(m=>[...m.boneMatrices]),snap,'No applause without an actual point event');
arena.react('player');const first=arena.meshes(.15,1,false).filter(m=>'skin' in m&&m.skin.id.includes('gallery-arms')).map(m=>[...m.boneMatrices]);const second=arena.meshes(.15,1,false).filter(m=>'skin' in m&&m.skin.id.includes('gallery-arms')).map(m=>[...m.boneMatrices]);assert.notDeepEqual(first,second,'Point reaction animates actual arm transforms');
assert.deepEqual(arena.meshes(0,1,true).filter(m=>'skin' in m&&m.skin.id.includes('gallery-arms')).map(m=>[...m.boneMatrices]),snap,'Reduced motion removes applause motion');
assert.deepEqual(arena.meshes(3,1,false).filter(m=>'skin' in m&&m.skin.id.includes('gallery-arms')).map(m=>[...m.boneMatrices]),snap,'Applause returns to the authored rest pose');assert.deepEqual(arena.meshes(.01,0,false),[],'Gallery disappears completely on club restoration');
let triangles=0;
for(const m of [...net,...idle]){const g=m.skin;assert(g);triangles+=g.positions.length/9;for(let i=0;i<g.positions.length;i+=3){assert([...g.positions.slice(i,i+3)].every(Number.isFinite));assert(Math.abs(Math.hypot(...g.normals.slice(i,i+3))-1)<1e-5);}for(let i=0;i<g.boneIndices.length;i++)assert(g.boneIndices[i]>=0&&g.boneIndices[i]<15);assert.equal(m.id,m.skin.id.startsWith('court-')?'court':'spectatorRow');}
assert(triangles<50000,'Net and 24-seat gallery stay within a bounded geometry budget');
const tape=net.find(m=>m.skin.id.includes('bound-net-tape'));let max=-Infinity;for(let i=1;i<tape.skin.positions.length;i+=3)max=Math.max(max,tape.skin.positions[i]);assert(Math.abs(max-.94)<1e-6,'Rendered net tape matches the actual .94 collision plane');
console.log(JSON.stringify({seats:GALLERY_SEATS.length,draws:idle.length,triangles,netDraws:net.length}));console.log('Championship detail PASS: bounded batched gallery, point-driven applause, reduced motion, full exit cleanup and collision-aligned net.');
