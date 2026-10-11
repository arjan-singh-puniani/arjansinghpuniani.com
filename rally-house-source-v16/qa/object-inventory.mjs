import fs from 'node:fs';
import {World} from '../dist/world/World.js';
import {DECOR_CATALOG} from '../dist/content/DecorCatalog.js';
const world=new World();
const objects=world.objects.map(o=>({id:o.id,name:o.label,category:o.kind,description:o.description,position:o.position,selection:o.selection,contact:o.interactionPoint,seatHeight:o.seatHeight,observeOnly:o.observeOnly??false,actions:world.identity.actions(o,2000).map(a=>({id:a.id,verb:a.title,animation:a.animation,effect:a.effect,seconds:a.seconds,prop:a.prop,gesture:a.gesture??'none'}))}));
fs.mkdirSync('evidence/objects-20261010',{recursive:true});fs.writeFileSync('evidence/objects-20261010/registry.json',JSON.stringify({builtInCount:objects.length,objects,decorCatalog:DECOR_CATALOG},null,2));console.log(objects.length,'stable built-in identities inventoried');
