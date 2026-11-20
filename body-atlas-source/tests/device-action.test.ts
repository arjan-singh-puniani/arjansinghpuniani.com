import test from 'node:test';
import assert from 'node:assert/strict';
import { anatomyFocus, deviceActions } from '../lib/device-action';
import { familyById, familyMappings, recordById } from '../lib/atlas';
import { hasExplanation } from '../lib/intervention-view';
import { interventionSummaries } from '../lib/intervention-summaries';
import { humanRegionLocators } from '../lib/annotations';
import { deviceIllustrations } from '../lib/device-illustrations';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import DeviceMechanism from '../components/DeviceMechanism';

test('device illustrations render substantive vectors and abstain for an unsupported device',()=>{
  for(const [id,action] of Object.entries(deviceActions)){
    const html=renderToStaticMarkup(createElement(DeviceMechanism,{id,action,step:0,playing:false}),{identifierPrefix:id});
    assert.ok((html.match(/<(?:path|ellipse|circle|rect)\b/g)||[]).length>6,id);
    assert.match(html,/not to scale/);
    assert.doesNotMatch(html,/<(?:image|script|foreignObject)\b/);
  }
  assert.equal(renderToStaticMarkup(createElement(DeviceMechanism,{id:'unreviewed-device',action:deviceActions.rns,step:0,playing:false})), '');
});

test('every reviewed mechanism has a device-specific illustration with component evidence',()=>{
  assert.deepEqual(Object.keys(deviceIllustrations).sort(),Object.keys(deviceActions).sort());
  for(const [id,illustration] of Object.entries(deviceIllustrations)){
    assert.equal(illustration.parts.length,3,id);
    assert.equal(new Set(illustration.parts).size,3,id);
    assert.equal(new URL(illustration.sourceUrl).protocol,'https:');
    assert.ok(illustration.title&&illustration.locator,id);
  }
  assert.notEqual(deviceIllustrations['source-fda-p140031'].title,deviceIllustrations['source-fda-p180002'].title);
  assert.match(deviceIllustrations['source-fda-p180002'].parts.join(' '),/Duckbill/);
  assert.match(deviceIllustrations['source-fda-p040033'].parts.join(' '),/Retained femoral neck/);
});

test('mechanisms resolve named entries, original evidence and contextual reference anatomy',()=>{
  assert.equal(Object.keys(deviceActions).length,12);
  for(const [id,action] of Object.entries(deviceActions)){
    const family=familyById(id)!;assert.ok(family&&hasExplanation(family));
    const sources=[...familyMappings(id).map(m=>m.sourceUrl),...family.regulatoryIds.map(r=>recordById(r)!.url)];
    assert.ok(sources.includes(action.sourceUrl),id);assert.ok(action.locator&&action.limit);
    assert.equal(action.steps.length,3);assert.ok(humanRegionLocators[anatomyFocus(id)!.region]);
    assert.ok(!('coordinates' in action));
  }
});
test('whole-body context stays provisional while valve focus uses the available valve geometry',()=>{
  const focus=anatomyFocus('source-fda-p140031')!;
  assert.equal(focus.intendedRegion,'BODY:heart-valves');assert.equal(focus.region,'BODY:heart-valves');
  assert.equal(focus.broaderReference,false);
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
