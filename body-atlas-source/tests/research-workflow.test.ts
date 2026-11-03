import test from 'node:test';
import assert from 'node:assert/strict';
import {families,familyMappings} from '../lib/atlas';
import {hasExplanation} from '../lib/intervention-view';
import {comparisonRelationships,csvCell,reviewCsv,reviewRows} from '../lib/research-workflow';

test('comparisons separate recording, physical placement, physiological action and provisional context',()=>{
 assert.ok(comparisonRelationships('rns','measurement').some(m=>m.type==='measurement_site'));
 assert.ok(comparisonRelationships('neuralink','measurement').some(m=>m.type==='measurement_site'));
 assert.ok(comparisonRelationships('activa','placement').some(m=>m.structureId==='BODY:chest-wall'));
 assert.ok(comparisonRelationships('activa','target').every(m=>m.structureId==='UBERON:0001897'));
 assert.equal(comparisonRelationships('source-fda-p140031','target').length,0);
 assert.ok(comparisonRelationships('source-fda-p140031','context').every(m=>m.state==='Provisional'));
 assert.ok(comparisonRelationships('cochlear','placement').some(m=>m.state==='Unknown'));
});
test('independent-review packet preserves every explained assertion and leaves adjudication blank',()=>{
 const entries=families.filter(hasExplanation),rows=reviewRows();assert.equal(entries.length,92);assert.equal(rows.length,108);
 assert.equal(new Set(rows.map(r=>r.entry_id)).size,92);
 for(const row of rows){const m=familyMappings(row.entry_id).find(m=>m.id===row.mapping_id)!;assert.ok(m);
  assert.equal(row.recorded_state,m.state);assert.equal(row.assertion,m.assertion);assert.equal(row.source_url,m.sourceUrl);assert.equal(row.source_locator,m.locator);
  for(const key of ['independent_reviewer','independent_review_date','independent_assessment','proposed_correction','review_notes'] as const)assert.equal(row[key],'');
 }
 assert.match(rows.find(r=>r.entry_id==='cochlear')!.reference_display,/No reference position/);
 const csv=reviewCsv();assert.ok(csv.startsWith('"entry_id","product","mapping_id"'));assert.match(csv,/"source_quote","source_sha256"/);assert.ok(!csv.includes('undefined'));
});
test('CSV quotes source text and neutralizes formula-prefixed external content',()=>{
 assert.equal(csvCell('a,"b"\nc'),'"a,""b""\nc"');
 for(const value of ['=SUM(1,2)',' +cmd','\t@SUM(A1)','-1+2'])assert.equal(csvCell(value)[1],"'");
 assert.equal(csvCell('https://www.fda.gov/'),'"https://www.fda.gov/"');
});
