import assert from 'node:assert/strict';
import {serveSnapshots} from '../dist/analysis/ServeSnapshots.js';
import {demonstration} from '../dist/analysis/LabDemonstrations.js';
import {playerSpec} from '../dist/content/PlayerAvatars.js';

for(const avatar of ['taylor','arjan']){
 const clip=demonstration('serve',playerSpec(avatar)),moments=serveSnapshots(clip),contact=clip.frames.find(f=>f.contact);
 assert.deepEqual(moments.map(m=>m.title),['Load','Contact','Finish']);assert.equal(moments[1].frame,contact);
 assert(moments.every(m=>clip.frames.includes(m.frame)),'Snapshots retain actual recorded frames');
 assert(moments[0].frame.time<contact.time&&moments[2].frame.time>contact.time);
 assert.equal(serveSnapshots({...clip,frames:clip.frames.filter(f=>f.time>=contact.time)}).length,0,'Truncated loading is not reconstructed');
 assert.equal(serveSnapshots({...clip,frames:clip.frames.filter(f=>f.time<=contact.time)}).length,0,'A missing finish remains missing');
 const broken=clip.frames.map(f=>({...f,time:f.time+(f.time>=contact.time ? .5 : 0)}));
 assert.equal(serveSnapshots({...clip,frames:broken}).length,0,'A recording gap cannot be crossed');
 const offset=clip.frames.at(-1).time+1,second=clip.frames.map(f=>({...f,time:f.time+offset}));
 assert(serveSnapshots({...clip,frames:[...clip.frames,...second]})[1].frame.time>offset,'Select the latest complete serve');

}
for(const kind of ['gait','forehand'])assert.equal(serveSnapshots(demonstration(kind,playerSpec('taylor'))).length,0,'Non-serve clips do not get a fabricated serve strip');
console.log('Serve snapshots PASS: real complete serves, exact contact, chronological phases, gap abstention and no invented phases.');
