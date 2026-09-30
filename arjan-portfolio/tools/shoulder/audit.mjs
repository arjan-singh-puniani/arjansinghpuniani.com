import { MODULE_MANIFESTS, BODY_PARTS_LICENSE } from '../../public/holoanatomy/src/anatomy/manifest.js';
import { readFile, writeFile } from 'node:fs/promises';
const inventory=[];
for(const part of MODULE_MANIFESTS.shoulder){
 const text=await readFile(`public/holoanatomy/anatomy/${part.file}`,'utf8');
 const lines=text.split(/\r?\n/), positions=lines.filter(l=>l.startsWith('v ')).map(l=>l.trim().split(/\s+/).slice(1).map(Number));
 const faces=lines.filter(l=>l.startsWith('f '));
 inventory.push({...part, structureId:part.id,FMA:part.fma,sourceVersion:'4.0',attribution:BODY_PARTS_LICENSE.attribution,geometryType:'OBJ polygon surface',vertexCount:positions.length,faceCount:faces.length,triangleCount:faces.reduce((s,l)=>s+l.trim().split(/\s+/).length-3,0),hasUV:lines.some(l=>l.startsWith('vt ')),hasNormals:lines.some(l=>l.startsWith('vn ')),hasTangents:false,textures:[],materialData:lines.filter(l=>/^(mtllib|usemtl) /.test(l)),bounds:{min:[0,1,2].map(i=>Math.min(...positions.map(p=>p[i]))),max:[0,1,2].map(i=>Math.max(...positions.map(p=>p[i])))},bytes:Buffer.byteLength(text),classificationCorrect:true,classificationBasis:'Manifest name is consistent with broad tissue class; muscle meshes do not establish separate tendon geometry.',derivedOperations:[],reviewStatus:'Engineering inventory; not independently clinically validated'});
}
await writeFile('Documentation/shoulder-baseline/mesh-inventory.json',JSON.stringify(inventory,null,2));
console.table(inventory.map(p=>({id:p.id,name:p.name,vertices:p.vertexCount,triangles:p.triangleCount,uv:p.hasUV,normals:p.hasNormals})));
