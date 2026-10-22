import { cp, mkdtemp, mkdir, readFile, rm, symlink, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
assert.ok(process.argv[2],'Pass a generated output directory, e.g. /path/to/portfolio/public/atlas');
const destination=path.resolve(process.argv[2]);
assert.equal(path.basename(destination),'atlas');
assert.equal(path.basename(path.dirname(destination)),'public');
const marker='body-atlas-export.json';
let exists=false;
try {await access(destination);exists=true;} catch(error) {if(error.code!=='ENOENT')throw error;}
if(exists){
 const previous=JSON.parse(await readFile(path.join(destination,marker),'utf8'));
 assert.equal(previous.application,'BODY//ATLAS','Refusing to overwrite an unrecognized directory');
}
const temp=await mkdtemp(path.join(tmpdir(),'body-atlas-export-'));
try {
 for(const name of ['app','components','lib','public','package.json','tsconfig.json']) {
  await cp(path.join(root,name),path.join(temp,name),{recursive:true,dereference:true,filter:source=>source!==path.join(root,'app','api')});
 }
 await mkdir(path.join(temp,'data'));
 for(const name of ['atlas.json','catalogue.json','body-regions.json'])await cp(path.join(root,'data',name),path.join(temp,'data',name));
 const snapshot=JSON.parse(await readFile(path.join(root,'data','atlas.json'),'utf8'));
 await mkdir(path.join(temp,'public','sources'));
 for(const source of snapshot.sources) {
  assert.match(source.sha,/^[a-f0-9]{64}$/);
  const bytes=await readFile(path.join(root,'data','sources',source.sha+'.json'));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),source.sha,'Original source checksum mismatch');
  await writeFile(path.join(temp,'public','sources',source.sha+'.json'),bytes);
 }
 await symlink(path.join(root,'node_modules'),path.join(temp,'node_modules'),'dir');
 await writeFile(path.join(temp,'next.config.mjs'),"export default {output:'export',basePath:'/atlas',trailingSlash:true,poweredByHeader:false};\n");
 const build=spawnSync(process.execPath,[path.join(root,'node_modules/next/dist/bin/next'),'build','--webpack'],{cwd:temp,env:{...process.env,NEXT_PUBLIC_ATLAS_BASE_PATH:'/atlas'},stdio:'inherit'});
 assert.equal(build.status,0,'Static atlas build failed');
 const manifest={application:'BODY//ATLAS',basePath:'/atlas',snapshotExportedAt:snapshot.exportedAt,sourceRecords:snapshot.records.length,cachedSources:snapshot.sources.length,disposition:'Research preview; anatomical text contexts remain Provisional.'};
 await writeFile(path.join(temp,'out',marker),JSON.stringify(manifest,null,2)+'\n');
 // Only replace a recognized generated atlas directory, after a successful build.
 await rm(destination,{recursive:true,force:true});
 await cp(path.join(temp,'out'),destination,{recursive:true});
 console.log(JSON.stringify({destination,...manifest}));
} finally {await rm(temp,{recursive:true,force:true});}
