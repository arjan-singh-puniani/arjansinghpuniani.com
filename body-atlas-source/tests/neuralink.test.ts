import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {authorized,brief,familyById,familyMappings,recordById,retrieve,timeline} from '../lib/atlas';
import {deviceActions,anatomyFocus} from '../lib/device-action';
import {isSourceUrl} from '../lib/source-url';
import {dossiers} from '../lib/dossiers';

test('Neuralink is research-only recording/decoding, never an FDA-approved stimulator',()=>{
 const f=familyById('neuralink')!;assert.ok(f);assert.equal(authorized(f),false);assert.deepEqual(f.regulatoryIds,[]);
 assert.deepEqual(f.modalities,['Electrophysiological recording','Computational analysis']);
 assert.equal(f.studyIds.length,6);assert.ok(!f.studyIds.includes('NCT07407725'));
 assert.equal(deviceActions.neuralink.kind,'bci');assert.match(deviceActions.neuralink.limit,/not implanted/);
 assert.ok(retrieve('Neuralink intracortical BCI').families.some(f=>f.id==='neuralink'));
 assert.ok(!retrieve('Which authorized Neuralink devices interface with the brain?').families.some(f=>f.id==='neuralink'));
});
test('housing, tissue contact and recording remain separate supported regional relationships',()=>{
 const m=familyMappings('neuralink');assert.equal(m.length,3);assert.ok(m.every(x=>x.state==='Supported'&&x.precision==='region'&&!('coordinates' in x)));
 assert.equal(m.find(x=>x.type==='implantation_site')!.structureId,'UBERON:0003129');
 assert.equal(m.find(x=>x.type==='measurement_site')!.structureId,'UBERON:0000956');
 assert.ok(m.every(x=>!/R1/.test(x.component)));assert.ok(m.every(x=>isSourceUrl(x.sourceUrl)));
 assert.equal(anatomyFocus('neuralink')!.region,'UBERON:0000955');
});
test('six registry records preserve sponsor, dates, estimated enrollment and absence of posted results',()=>{
 const f=familyById('neuralink')!;
 for(const id of f.studyIds){const r=recordById(id)!;assert.ok(r);assert.equal(r.kind,'trial');assert.equal(r.sponsor,'Neuralink Corp');assert.equal(r.hasResults,false);assert.ok(r.lastUpdatePosted);
  const raw=JSON.parse(readFileSync(`data/sources/${r.sourceSha}.json`,'utf8')).studies.find((s:any)=>s.protocolSection.identificationModule.nctId===id);
  assert.ok(raw);assert.equal(r.status,raw.protocolSection.statusModule.overallStatus);assert.deepEqual(r.enrollment,raw.protocolSection.designModule.enrollmentInfo);
 }
 const r=recordById('NCT06429735')!;assert.equal(r.firstPosted,'2024-05-28');assert.equal(r.studyStart!.date,'2024-01-09');assert.equal(r.enrollment!.type,'ESTIMATED');
 assert.ok(timeline(['neuralink']).some(e=>e.recordId==='NCT06429735'&&e.date==='2024-05-28'&&e.kind==='Study first posted'));
});
test('configuration differences and sponsor reports are retained without FDA recall or IFU claims',()=>{
 const d=JSON.parse(readFileSync('public/dossiers/neuralink.json','utf8'));
 assert.deepEqual(d.applications,[]);assert.equal(d.regulatory.state,'not-established');assert.equal(d.safety.state,'not-established');assert.equal(d.labeling.state,'not-applicable');assert.deepEqual(d.safety.rows,[]);
 const text=d.labelReview.findings.map((x:any)=>x.text).join(' ');
 assert.match(text,/64 threads/);assert.match(text,/128 threads/);assert.match(text,/undated/);assert.match(text,/not an FDA recall/);
 assert.equal(dossiers.neuralink.currentLabelReview,'investigational');
});
test('briefs retain source-linked uncertainty and distinguish the earlier platform paper from human outcomes',()=>{
 const text=brief(['neuralink']);assert.match(text,/NCT06429735/);assert.match(text,/NCT07224256/);assert.match(text,/31642810/);
 assert.match(text,/2019.*not.*clinical results/);assert.match(text,/revision crosswalk/);assert.match(text,/thread retraction/);
 assert.match(text,/Investigational \/ research/);assert.match(text,/64 threads/);assert.match(text,/128 threads/);
 for(const url of ['https://neuralink.com/pdfs/PRIME-Study-Brochure.pdf','https://www.uclh.nhs.uk/news/uclh-evaluate-safety-and-functionality-neuralinks-brain-computer-interface-bci-technology'])assert.ok(isSourceUrl(url));
 assert.equal(isSourceUrl('https://neuralink.com.evil.test/source'),false);
});
