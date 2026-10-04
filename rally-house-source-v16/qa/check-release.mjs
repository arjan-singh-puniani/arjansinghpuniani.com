import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const source=path.resolve(import.meta.dirname,'..');
const served=path.resolve(source,'../arjan-portfolio/public/rally-house');
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const sync=process.argv.includes('--sync');let count=0;
const artifacts=[...files(path.join(source,'dist')).filter(f=>f.endsWith('.js')),...['index.html','style.css','championship.css','spatial.css'].map(f=>path.join(source,f))];
for(const f of artifacts){const target=path.join(served,path.relative(source,f));if(sync){fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(f,target);}assert.ok(fs.existsSync(target),`Missing served artifact: ${target}`);assert.ok(fs.readFileSync(f).equals(fs.readFileSync(target)),`Stale served artifact: ${target}`);count++;}
for(const dir of [path.join(source,'dist'),path.join(served,'dist')])for(const f of files(dir).filter(f=>f.endsWith('.js'))){const text=fs.readFileSync(f,'utf8');for(const m of text.matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g))assert.ok(fs.existsSync(path.resolve(path.dirname(f),m[1])),`Broken import in ${f}: ${m[1]}`);}
console.log(`${count} release artifacts match; compiled relative imports resolve in source and served trees.`);
