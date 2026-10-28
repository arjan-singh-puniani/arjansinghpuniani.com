import test from 'node:test';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fdaUpdateScope,fdaUpdateUrl,handleFDAUpdates,parseFDAUpdates} from '../lib/fda-updates';
import scope from '../data/dossier-scope.json';
const request=(app:string)=>new Request('https://atlas.example/api/fda?application='+app);
const fixture=(app:string)=>JSON.stringify({meta:{last_updated:'2026-10-05',results:{total:1}},results:[{pma_number:app,supplement_number:'S007',trade_name:'Example',decision_code:'APPR',decision_date:'20261001'}]});

test('FDA lookup accepts only the 89 exact application identities; no user URL or query is forwarded',async()=>{
 assert.equal(fdaUpdateScope.length,89);
 assert.deepEqual([...fdaUpdateScope].sort(),[...new Set(scope.flatMap(e=>e.regulatory.map(r=>r.application)))].sort());
 for(const app of ['https://127.0.0.1','P100026 OR *','P999999','P100026S001','']){
  assert.equal(fdaUpdateUrl(app),null);
  assert.equal((await handleFDAUpdates(request(app),async()=>{throw new Error('Must not fetch');})).status,400);
 }
 assert.equal((await handleFDAUpdates(new Request('https://atlas.example/api/fda?application=P100026&url=http://localhost'))).status,400);
});
test('original response is downloadable and hash-verifiable; supplements never become original approvals',()=>{
 const raw=fixture('P100026'),r=parseFDAUpdates('P100026',raw);
 assert.equal(r.sourceSha,createHash('sha256').update(raw).digest('hex'));
 assert.equal(r.sourceText,raw);assert.equal(r.entries[0].decision,'PMA supplement · APPR');
 assert.equal(r.entries[0].date,'2026-10-01');assert.match(r.entries[0].url,/P100026S007$/);
});
test('schema drift, mixed identities, duplicate decisions and impossible dates are rejected',()=>{
 const base=JSON.parse(fixture('P100026'));
 for(const mutate of [(d:any)=>d.results[0].pma_number='P970003',(d:any)=>d.results[0].decision_date='20260230',(d:any)=>d.results[0].supplement_number='../../../secret',(d:any)=>d.results.push({...d.results[0]}),(d:any)=>d.meta.results.total='1']){
  const d=structuredClone(base);mutate(d);assert.throws(()=>parseFDAUpdates('P100026',JSON.stringify(d)));
 }
});
test('simultaneous public requests coalesce and reuse successful source without repeat acquisition',async()=>{
 let calls=0;const fetcher:typeof fetch=async(input,init)=>{calls++;assert.match(String(input),/^https:\/\/api.fda.gov\/device\/pma.json\?/);assert.equal(init?.redirect,'error');return Response.json(JSON.parse(fixture('P960009')));};
 const responses=await Promise.all([handleFDAUpdates(request('P960009'),fetcher),handleFDAUpdates(request('P960009'),fetcher)]);
 assert.equal(calls,1);assert.ok(responses.every(r=>r.status===200));
 await handleFDAUpdates(request('P960009'),fetcher);assert.equal(calls,1);
});
test('provider outage and oversized/invalid replies fail visibly and never masquerade as empty results',async()=>{
 let index=0;for(const fetcher of [async()=>new Response('outage',{status:429}),async()=>new Response('not json'),async()=>new Response('x'.repeat(1024*1024+1),{headers:{'Content-Type':'application/json'}})]){
  const app=['P970003','P030017','P150038'][index++];const r=await handleFDAUpdates(request(app),fetcher);assert.equal(r.status,503);assert.equal(r.headers.get('Cache-Control'),'no-store');
  assert.match((await r.json()).error,/snapshot.*remain available/);
  let calls=0;await handleFDAUpdates(request(app),async()=>{calls++;throw new Error('cooldown should prevent this');});assert.equal(calls,0);
 }
});

test('authentic FDA response accepts ISO dates and OK30 notices without treating them as approvals',()=>{
 const raw=readFileSync('tests/fixtures/fda-p100026-20261027.json','utf8'),r=parseFDAUpdates('P100026',raw);
 assert.equal(r.entries.length,10);assert.equal(r.entries[0].id,'P100026S104');
 assert.equal(r.entries[0].date,'2026-08-19');assert.equal(r.entries[0].decision,'PMA supplement · OK30');
 assert.match(r.entries[0].change,/30-Day Notice/);assert.match(r.entries[0].statement,/RNS-320/);
});
