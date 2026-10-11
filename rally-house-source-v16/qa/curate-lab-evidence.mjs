import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {createRequire} from 'node:module';
const sharp=createRequire(new URL('../../arjan-portfolio/package.json',import.meta.url))('sharp');
const root=process.env.QA_EVIDENCE??'evidence/performance-lab-20261011',out=path.join(root,'screens');fs.mkdirSync(out,{recursive:true});
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?e.name==='screens'?[]:walk(path.join(d,e.name)):[path.join(d,e.name)]);
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),manifest=[];
for(const file of walk(root).filter(p=>p.endsWith('.png'))){const relative=path.relative(root,file),target=path.join(out,relative.replace(/\.png$/,'.webp'));fs.mkdirSync(path.dirname(target),{recursive:true});await sharp(file).webp({quality:88}).toFile(target);manifest.push({capture:relative,captureSHA256:hash(file),curated:path.relative(root,target),curatedSHA256:hash(target)});}
fs.writeFileSync(path.join(root,'capture-manifest.json'),JSON.stringify(manifest,null,2));
await sharp(path.join(root,'chromium/1440x900-combined.png')).webp({quality:90}).toFile('../arjan-portfolio/public/rally-house/media/performance-lab.webp');
console.log(`${manifest.length} genuine browser captures curated; original PNGs retained locally; portfolio still refreshed.`);
