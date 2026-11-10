import test from 'node:test';
import assert from 'node:assert/strict';
import {aligned, begin, cancel, changeView, confirmImage, dress, makeCase, move, release, returnToReduction, score, startReduction} from '../dist/ortho/model.mjs';

const neutral = {x:0,z:0,gap:.055,front:0,side:0,twist:0};
function drag(s,x,y) {
  assert(begin(s));
  move(s,x,y);
  return release(s);
}

test('seeded replay, total displacement, and interrupted grip', () => {
  const a=makeCase(431),b=makeCase(431);
  assert.deepEqual(a,b);
  assert.notDeepEqual(a.baseline,makeCase(432).baseline);
  startReduction(a); startReduction(b);
  drag(a,.20,-.15);
  assert(begin(b)); move(b,.04,-.06); move(b,.20,-.15); release(b);
  assert.deepEqual(a,b);
  const pose={...b.pose};
  begin(b); move(b,-.30,.30); cancel(b);
  assert.deepEqual(b.pose,pose);
  begin(b); move(b,-.30,.30); changeView(b,'side');
  assert.deepEqual(b.pose,pose);
  assert.equal(b.grip,null);
});

test('orthogonal angulation, axial twist, seating stop and correction', () => {
  const s=makeCase();
  assert.equal(confirmImage(s),false);
  startReduction(s);
  s.pose={...neutral,side:.14};
  assert(aligned(s.pose,'front'));
  assert(!aligned(s.pose,'side'));
  assert(confirmImage(s));
  changeView(s,'side');
  assert.equal(confirmImage(s),false);
  s.pose.twist=.15;
  assert(!aligned(s.pose,'front'));
  s.pose={...neutral,side:.054};
  assert(confirmImage(s));
  assert.equal(s.stage,'seat');
  drag(s,0,2);
  assert.equal(s.nail,.43);
  assert.match(s.notice,/blocked/i);
  returnToReduction(s);
  assert.equal(s.nail,0);
  assert.deepEqual(s.checked,{});
  s.pose={...neutral};
  assert(confirmImage(s)); changeView(s,'front'); assert(confirmImage(s));
  drag(s,0,2);
  assert.equal(s.stage,'fix');
  assert.equal(dress(s),false);
  const previous={...s.aim};
  begin(s); move(s,-s.aim.x,s.aim.y); cancel(s);
  assert.deepEqual(s.aim,previous);
  assert.equal(s.locks,0);
  assert.equal(drag(s,-s.aim.x,s.aim.y),'locked');
  release(s);
  assert.equal(s.locks,1);
  assert.equal(drag(s,-s.aim.x,s.aim.y),'locked');
  assert.equal(s.stage,'image');
  assert(confirmImage(s)); assert.equal(s.stage,'image');
  changeView(s,'side'); assert(confirmImage(s));
  assert(dress(s));
  assert.equal(s.stage,'review');
  assert.deepEqual(score(s),{alignment:60,fixation:30,correction:4});
});

test('only Guided snaps inside the narrow game window', () => {
  for (const expert of [false,true]) {
    const s=makeCase(431,expert);
    startReduction(s);
    s.pose={...neutral,x:.1};
    drag(s,-.09/(.65+.35*.1/.4),0);
    assert(Math.abs(s.pose.x-(expert ? .01 : 0)) < 1e-8);
  }
});
