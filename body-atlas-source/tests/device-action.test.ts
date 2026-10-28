import test from 'node:test';
import assert from 'node:assert/strict';
import { anatomyFocus, deviceActions } from '../lib/device-action';
import { familyById, familyMappings, recordById } from '../lib/atlas';
import { hasExplanation } from '../lib/intervention-view';
import { interventionSummaries } from '../lib/intervention-summaries';
import { humanRegionLocators } from '../lib/annotations';

test('mechanisms resolve named entries, original evidence and contextual reference anatomy',()=>{
  assert.equal(Object.keys(deviceActions).length,11);
  for(const [id,action] of Object.entries(deviceActions)){
    const family=familyById(id)!;assert.ok(family&&hasExplanation(family));
    const sources=[...familyMappings(id).map(m=>m.sourceUrl),...family.regulatoryIds.map(r=>recordById(r)!.url)];
    assert.ok(sources.includes(action.sourceUrl),id);assert.ok(action.locator&&action.limit);
    assert.equal(action.steps.length,3);assert.ok(humanRegionLocators[anatomyFocus(id)!.region]);
    assert.ok(!('coordinates' in action));
  }
});
test('whole-body context edges remain provisional; valve focus explicitly uses broader heart mesh',()=>{
  const focus=anatomyFocus('source-fda-p140031')!;
  assert.equal(focus.intendedRegion,'BODY:heart-valves');assert.equal(focus.region,'BODY:heart');
  assert.equal(focus.broaderReference,true);
  assert.ok(familyMappings('source-fda-p140031').every(m=>m.state==='Provisional'));
});
test('unlocalized, unsupported and female-only anatomy abstain from organ focus',()=>{
  assert.equal(anatomyFocus('cochlear'),null);assert.equal(anatomyFocus('missing'),null);
  for(const [id,s] of Object.entries(interventionSummaries))if(s.regions.every(r=>!humanRegionLocators[r]))assert.equal(anatomyFocus(id),null,id);
});
test('mechanisms retain external, investigational and multi-component limits',()=>{
  assert.match(deviceActions.tms.steps[0],/external/);
  assert.match(deviceActions.precision.limit,/does not mean spinal cord penetration/);
  assert.match(deviceActions.vns.steps.join(' '),/left chest.*left vagus/);
  assert.equal(deviceActions.braingate,undefined);assert.equal(deviceActions.cooling,undefined);
});
