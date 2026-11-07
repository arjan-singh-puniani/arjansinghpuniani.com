import assert from 'node:assert/strict';
import {initial,expandSite,enableEquipment,build,rotateRoom,remove,roomEditCheck,moveGate,entrance,door,path,siteOf,undo,validate} from '../dist/simulation.mjs';

const s=initial('clinic',431,'sandbox',{gentle:true,receptionFirst:true});
expandSite(s);
enableEquipment(s);
const {room}=build(s,'intake',.25,25,1);
const before=structuredClone(room);
const funds=s.cash;
assert(rotateRoom(s,room.id).ok);
assert.notDeepEqual(door(room),door(before));
assert(path(entrance(s),door(room),s.rooms,[],siteOf(s)));
assert.deepEqual({...room,rotation:before.rotation},before);
assert.equal(s.cash,funds);
assert.deepEqual(undo(s).rooms,[before]);
assert.equal(validate(structuredClone(s)).rooms[0].rotation,room.rotation);

s.patients.push({target:room.id});
assert.equal(roomEditCheck(s,room.id).ok,false);
assert.equal(rotateRoom(s,room.id).ok,false);
assert.equal(remove(s,room.id).ok,false);
s.patients.pop();

const nextSide=(room.rotation+1)%4;
s.patients.push({...door({...room,rotation:nextSide})});
assert(rotateRoom(s,room.id).ok);
assert.notEqual(room.rotation,nextSide);
s.patients.pop();

assert(remove(s,room.id).ok);
assert.equal(s.cash,funds+before.paid/2);
assert.equal(undo(s).rooms[0].id,room.id);
const old=entrance(s);
const destination={x:old.x-1,y:old.y};
assert(moveGate(s,'entrance',destination.x,destination.y).ok);
assert.deepEqual(entrance(s),destination);
assert.deepEqual(entrance(undo(s)),old);
assert.equal(s.cash,funds+before.paid/2-150);
assert.equal(moveGate(s,'entrance',destination.x,old.y-1).ok,false);
validate(structuredClone(s));
console.log('PASS: door move, preserved room identity and equipment, occupancy checks, removal refund, save and undo');
