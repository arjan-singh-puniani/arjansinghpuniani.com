import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dossiers,dossierBrief,dossierCoverage} from '../lib/dossiers';
import {families,brief} from '../lib/atlas';
import {hasExplanation} from '../lib/intervention-view';

const read=(id:string)=>JSON.parse(readFileSync(`public/dossiers/${id}.json`,'utf8'));
test('all 91 explained entries have a matching dossier and explicit review gaps',()=>{
 assert.deepEqual(Object.keys(dossiers).sort(),families.filter(hasExplanation).map(f=>f.id).sort());
 assert.equal(dossierCoverage.entries,91);assert.equal(dossierCoverage.regulatory,89);assert.equal(dossierCoverage.recalls,89);
 for(const [id,s] of Object.entries(dossiers)){
  const d=read(id);assert.equal(d.familyId,id);assert.equal(d.name,s.name);assert.equal(d.regulatory.rows.length,s.regulatory.records);assert.equal(d.safety.rows.length,s.safety.recalls);
  assert.equal(d.labeling.rows.filter((r:any)=>r.url&&r.state!=='summary-only').length,s.labeling.documents);
  assert.equal(d.noticeReview,'partial');assert.notEqual(d.currentLabelReview,'complete');assert.ok(d.review.next.length);
 }
});
test('investigational entries never inherit commercial labeling or empty recall certification',()=>{
 for(const id of ['cooling','braingate']){const d=read(id);assert.deepEqual(d.applications,[]);assert.equal(d.regulatory.state,'not-established');assert.equal(d.safety.state,'not-established');assert.equal(d.labeling.state,'not-applicable');assert.deepEqual(d.safety.rows,[]);}
});
test('positive safety dossier preserves affected model, lot, dates, action and original reference',()=>{
 const d=read('source-fda-p040033');assert.ok(d.safety.rows.length>=29);
 const r=d.safety.rows.find((r:any)=>r.cfres_id==='55398');assert.ok(r);assert.match(r.code_info,/64803/);assert.match(r.product_description,/74120146/);assert.equal(r.event_date_initiated,'2007-07-12');assert.equal(r.event_date_posted,'2007-10-25');assert.ok(r.action);assert.match(r.url,/id=55398$/);assert.equal(d.modelLotReview,'pending');
});
test('every source has matching bytes, preserved raw records and safe source links',()=>{
 const raw=new Map<string,any>();for(const file of readdirSync('public/dossier-sources')){
  assert.match(file,/^[a-f0-9]{64}\.(json|txt)$/);const bytes=readFileSync(`public/dossier-sources/${file}`);assert.equal(createHash('sha256').update(bytes).digest('hex'),file.split('.')[0]);if(file.endsWith('.json'))raw.set(file.split('.')[0],JSON.parse(bytes.toString()));
 }
 for(const id of Object.keys(dossiers)){const d=read(id);
  for(const r of d.regulatory.rows.filter((r:any)=>r.application.startsWith('P'))){const source=raw.get(r.sourceSha);const original=source.results.find((s:any)=>s.pma_number===r.application&&s.supplement_number===r.supplement);assert.ok(original);assert.equal(original.decision_date,r.date);assert.equal(original.ao_statement||'',r.statement);}
  for(const r of d.safety.rows){const original=raw.get(r.sourceSha).results.find((s:any)=>s.cfres_id===r.cfres_id);assert.ok(original);assert.equal(r.code_info,original.code_info||'');assert.equal(r.reason_for_recall,original.reason_for_recall||'');assert.ok(r.applications.every((a:string)=>[...original.pma_numbers||[],...original.k_numbers||[]].some((v:string)=>v===a||new RegExp(`^${a}/?S\\d{1,4}$`).test(v))));}
  for(const s of d.sourceLinks){const u=new URL(s.url);assert.equal(u.protocol,'https:');assert.ok(['www.accessdata.fda.gov','clinicaltrials.gov','pubmed.ncbi.nlm.nih.gov'].includes(u.hostname));assert.equal(u.username,'');}
 }
});
test('label PDFs are separated from clearance summaries and known gaps remain visible',()=>{
 for(const id of ['tms','source-fda-k250173','source-fda-k260007','source-fda-k260721']){const d=read(id);assert.equal(d.labeling.state,'summary-only');assert.equal(d.labeling.rows[0].state,'summary-only');assert.match(d.labeling.detail,/complete current instructions.*unreviewed/);}
 const d=read('source-fda-p040033');assert.match(d.labeling.rows[0].url,/P040033C\.pdf$/);assert.match(d.labeling.detail,/Current revision.*pending/);
});
test('briefs include dossier status, source links and applicability limits',()=>{
 const markdown=brief(['source-fda-p040033']);assert.match(markdown,/Regulatory, labeling and safety dossier/);assert.match(markdown,/P040033C\.pdf/);assert.match(markdown,/model\/lot review: pending/);assert.match(markdown,/dossiers\/source-fda-p040033.json/);
 assert.deepEqual(dossierBrief('unreviewed-placeholder'),[]);
});
