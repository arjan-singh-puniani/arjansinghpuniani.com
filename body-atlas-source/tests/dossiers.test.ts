import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dossiers,dossierBrief,dossierCoverage,matchesRecall,scopeExcerpt,reviewLabels,reviewMeanings} from '../lib/dossiers';
import {isSourceUrl} from '../lib/source-url';
import {families,brief} from '../lib/atlas';
import {hasExplanation} from '../lib/intervention-view';

const read=(id:string)=>JSON.parse(readFileSync(`public/dossiers/${id}.json`,'utf8'));
test('all 91 explained entries have a matching dossier and explicit review gaps',()=>{
 assert.deepEqual(Object.keys(dossiers).sort(),families.filter(hasExplanation).map(f=>f.id).sort());
 assert.equal(dossierCoverage.entries,91);assert.equal(dossierCoverage.regulatory,89);assert.equal(dossierCoverage.recalls,89);
 for(const [id,s] of Object.entries(dossiers)){
  const d=read(id);assert.equal(d.familyId,id);assert.equal(d.name,s.name);assert.equal(d.regulatory.rows.length,s.regulatory.records);assert.equal(d.safety.rows.length,s.safety.recalls);
  assert.equal(d.labeling.rows.filter((r:any)=>r.url&&r.state!=='summary-only').length,s.labeling.documents);
  assert.equal(d.noticeReview,'screened-candidates-reviewed');assert.notEqual(d.currentLabelReview,'complete');assert.ok(d.review.next.length);
  assert.ok(reviewLabels[d.labelReview.status]);assert.ok(d.labelReview.findings.length>=2);assert.ok(d.labelReview.limitations.length);assert.ok(d.labelReview.scope);
  for(const finding of d.labelReview.findings){assert.ok(isSourceUrl(finding.sourceUrl));assert.ok(finding.locator);assert.ok(d.labelReview.sources.some((s:any)=>s.url===finding.sourceUrl));}
 }
});
test('investigational entries never inherit commercial labeling or empty recall certification',()=>{
 for(const id of ['cooling','braingate']){const d=read(id);assert.deepEqual(d.applications,[]);assert.equal(d.regulatory.state,'not-established');assert.equal(d.safety.state,'not-established');assert.equal(d.labeling.state,'not-applicable');assert.deepEqual(d.safety.rows,[]);}
});
test('positive safety dossier preserves affected model, lot, dates, action and original reference',()=>{
 const d=read('source-fda-p040033');assert.ok(d.safety.rows.length>=29);
 const r=d.safety.rows.find((r:any)=>r.cfres_id==='55398');assert.ok(r);assert.match(r.code_info,/64803/);assert.match(r.product_description,/74120146/);assert.equal(r.event_date_initiated,'2007-07-12');assert.equal(r.event_date_posted,'2007-10-25');assert.ok(r.action);assert.match(r.url,/id=55398$/);assert.equal(d.modelLotReview,'source-fields-audited');assert.equal(r.scopeAudit.unitApplicability,'not-determined');
});
test('every source has matching bytes, preserved raw records and safe source links',()=>{
 const raw=new Map<string,any>();for(const file of readdirSync('public/dossier-sources')){
  assert.match(file,/^[a-f0-9]{64}\.(json|txt)$/);const bytes=readFileSync(`public/dossier-sources/${file}`);assert.equal(createHash('sha256').update(bytes).digest('hex'),file.split('.')[0]);if(file.endsWith('.json'))raw.set(file.split('.')[0],JSON.parse(bytes.toString()));
 }
 for(const id of Object.keys(dossiers)){const d=read(id);
  for(const r of d.regulatory.rows.filter((r:any)=>r.application.startsWith('P'))){const source=raw.get(r.sourceSha);const original=source.results.find((s:any)=>s.pma_number===r.application&&s.supplement_number===r.supplement);assert.ok(original);assert.equal(original.decision_date,r.date);assert.equal(original.ao_statement||'',r.statement);}
  for(const r of d.safety.rows){const original=raw.get(r.sourceSha).results.find((s:any)=>s.cfres_id===r.cfres_id);assert.ok(original);assert.equal(r.code_info,original.code_info||'');assert.equal(r.reason_for_recall,original.reason_for_recall||'');assert.ok(r.applications.every((a:string)=>[...original.pma_numbers||[],...original.k_numbers||[]].some((v:string)=>v===a||new RegExp(`^${a}/?S\\d{1,4}$`).test(v))));}
  for(const s of d.sourceLinks)assert.ok(isSourceUrl(s.url),s.url);
 }
});
test('label PDFs are separated from clearance summaries and known gaps remain visible',()=>{
 for(const id of ['tms','source-fda-k250173','source-fda-k260007','source-fda-k260721']){const d=read(id);assert.equal(d.labeling.state,'summary-only');assert.equal(d.labeling.rows[0].state,'summary-only');assert.match(d.labeling.detail,/model-scoped review/);}
 const d=read('source-fda-p040033');assert.match(d.labeling.rows[0].url,/P040033C\.pdf$/);assert.equal(d.currentLabelReview,'historical-label-reviewed');assert.match(d.labelReview.limitations.join(' '),/latest complete US IFU/);
});
test('briefs include dossier status, source links and applicability limits',()=>{
 const markdown=brief(['source-fda-p040033']);assert.match(markdown,/Regulatory, labeling and safety dossier/);assert.match(markdown,/P040033C\.pdf/);assert.match(markdown,/model\/lot review: source-fields-audited/);assert.match(markdown,/dossiers\/source-fda-p040033.json/);assert.match(markdown,/Metal-ion/);assert.match(markdown,/Open limit:/);
 assert.deepEqual(dossierBrief('unreviewed-placeholder'),[]);
});
test('model-specific MRI differences and historical amendments remain explicit',()=>{
 assert.match(read('rns').labelReview.findings.map((f:any)=>f.text).join(' '),/RNS-300M is MR Unsafe.*RNS-320 is MR Conditional/);
 assert.match(read('source-fda-p130008').labelReview.findings[0].text,/3024 must not undergo MRI.*3028 and 3150/);
 assert.match(read('source-fda-p950035').labelReview.limitations.join(' '),/replaced.*S005.*2000-01-13/);
 assert.equal(dossierCoverage.assessed,91);assert.equal(dossierCoverage.labelGaps,3);
});
test('recall text search covers long lists without interpreting ranges or certifying units',()=>{
 const r=read('activa').safety.rows.find((r:any)=>r.code_info.length>100000);assert.ok(r);
 const tail=r.code_info.match(/[A-Z0-9]{6,}/g).at(-1);assert.ok(matchesRecall(r,tail));assert.match(scopeExcerpt(r.code_info,tail),new RegExp(tail));assert.ok(scopeExcerpt(r.code_info,'').length<=452);
 const range={product_description:'Model A',code_info:'Serial numbers 1000 through 2000',product_res_number:'Z-001'};
 assert.equal(matchesRecall(range,'1500'),false);assert.equal(matchesRecall(range,'model a'),true);assert.equal(matchesRecall(range,'Z-001'),true);
});
test('source anomalies and rejected notice matches are preserved rather than silently repaired',()=>{
 assert.match(read('source-fda-p000006').safety.rows.find((r:any)=>r.cfres_id==='198913').scopeAudit.flags.join(' '),/placeholder/);
 assert.match(read('source-fda-p050052').safety.rows.find((r:any)=>r.cfres_id==='99710').scopeAudit.flags.join(' '),/1024417.*1034417/);
 assert.match(read('source-fda-p010014').safety.rows.find((r:any)=>r.cfres_id==='152454').scopeAudit.flags.join(' '),/no lot values/);
 assert.equal(read('source-fda-k250173').safety.noticeReviews[0].status,'different-product');
 const heart=read('source-fda-p060040').safety.noticeReviews;assert.equal(heart.filter((n:any)=>n.status==='different-product').length,2);
});
test('manufacturer citations remain usable without expanding the URL trust boundary',()=>{
 assert.equal(isSourceUrl('https://www.neuropace.com/manual.pdf#page=14'),true);
 for(const url of ['https://www.neuropace.com.evil.example/manual','https://user:password@www.neuropace.com/manual','https://www.neuropace.com:444/manual','http://www.neuropace.com/manual','javascript:alert(1)','https://localhost/'])assert.equal(isSourceUrl(url),false,url);
});

test('missing labels retain their gaps while exact known restrictions and archive limits are explained',()=>{
 const ha=read('source-fda-k260007'),shoulder=read('source-fda-k260721'),thumb=read('source-fda-p960053');
 for(const d of [ha,shoulder,thumb])assert.equal(d.currentLabelReview,'current-label-not-established');
 assert.match(ha.labelReview.findings[0].text,/not compatible with condoms/);
 assert.match(ha.labelReview.findings[1].text,/different excipients/);
 assert.match(shoulder.labelReview.findings[0].text,/cemented use only.*Press-fit.*does not apply/s);
 assert.match(thumb.labelReview.findings[0].text,/P960053.*K931588.*separate/s);
 assert.match(thumb.labelReview.findings[1].text,/Historical.*cemented use only/);
 assert.match(thumb.labelReview.findings[2].text,/2016.*without publishing/s);
 assert.equal(thumb.labelReview.revision,null);assert.match(thumb.labelReview.limitations.join(' '),/2023.*not a labeling revision/s);
 assert.equal(dossierCoverage.labelGaps,3);
});
test('every review class explains its boundary and briefs preserve model and revision context',()=>{
 for(const d of Object.values(dossiers))assert.ok(reviewMeanings[d.currentLabelReview]);
 const historical=dossierBrief('source-fda-p040033').join('\n');assert.match(historical,/historical labeling.*Later revisions/s);
 const rns=dossierBrief('rns').join('\n');assert.match(rns,/Models compared \(not interchangeable\): RNS-300M; RNS-320/);
 const thumb=dossierBrief('source-fda-p960053').join('\n');assert.match(thumb,/Revision not established/);assert.match(thumb,/complete product-specific label is missing/);
});
