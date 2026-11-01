import assert from 'node:assert/strict';
import {path,blocked,door} from '../dist/navigation.mjs';
import {path as original} from './fixtures/navigation-v07.mjs';
import {initial,random} from '../dist/simulation.mjs';
const s=initial(),layouts=[s.rooms,[...s.rooms,{x:7,y:3,type:'consult'}],[{x:1,y:1,type:'scan'},{x:4,y:3,type:'care'}]],rng={seed:5101};let checked=0;
for(const rooms of layouts)for(let i=0;i<900;i++){const point=()=>({x:Math.floor(random(rng)*33)/4,y:Math.floor(random(rng)*29)/4}),a=point(),b=point(),avoid=Array.from({length:i%5},point);assert.deepEqual(path(a,b,rooms,avoid),original(a,b,rooms,avoid));checked++}
const calls=Array.from({length:300},(_,i)=>[{x:(i%33)/4,y:Math.floor(i/33)/4},door(s.rooms[i%3]),s.rooms]),measure=fn=>{const start=performance.now();for(const c of calls)fn(...c);return +(performance.now()-start).toFixed(2)};
console.log(JSON.stringify({checked,queries:calls.length,originalMs:measure(original),currentMs:measure(path),device:'Apple M2 host; Node22; not iPhone'}));
