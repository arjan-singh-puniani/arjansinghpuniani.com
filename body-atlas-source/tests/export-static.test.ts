import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

test('static export refuses to overwrite an unrecognized destination',()=>{
 const temp=mkdtempSync(join(tmpdir(),'atlas-export-guard-'));
 try{
  const destination=join(temp,'public','atlas');mkdirSync(destination,{recursive:true});
  const sentinel=join(destination,'keep.txt');writeFileSync(sentinel,'Existing user content');
  const result=spawnSync(process.execPath,['scripts/export-static.mjs',destination],{encoding:'utf8',timeout:30000});
  assert.notEqual(result.status,0);
  assert.equal(readFileSync(sentinel,'utf8'),'Existing user content');
 }finally{rmSync(temp,{recursive:true,force:true});}
});
