import test from 'node:test';
import assert from 'node:assert/strict';
import { readPilotDraft, type PilotDraft } from '../lib/pilot-draft';

const draft: PilotDraft = {
  version: 1, first: 'P100026', second: 'P080025', question: 'Which evidence supports our review?',
  applications: ['P080025'], notes: { 'P080025/P100026': { finding: 'Source supports recording.', gap: 'Check later labeling.' } },
  supplements: { P100026: 'S104' },
};

test('a saved worksheet preserves user work and source identifiers without trusted source assertions', () => {
  assert.deepEqual(readPilotDraft(JSON.stringify(draft)), draft);
  const poisoned = { ...draft, verifications: { 'P100026/S104': true }, sourceUrl: 'javascript:alert(1)', applicant: 'Invented owner' };
  assert.deepEqual(readPilotDraft(JSON.stringify(poisoned)), draft);
});

test('unreadable, oversized and incorrectly keyed saved worksheets are rejected', () => {
  for (const invalid of [null, [], {}, { ...draft, version: 2 }, { ...draft, first: 'P100026/S104' },
    { ...draft, second: 'P100026' }, { ...draft, question: 'x'.repeat(241) },
    { ...draft, applications: ['https://example.com'] },
    { ...draft, notes: { ['__proto__']: {} } },
    { ...draft, notes: { 'P100026/P080025': { finding: '', gap: '' } } },
    { ...draft, notes: { 'P080025/P100026': { finding: 'x'.repeat(801), gap: '' } } },
    { ...draft, supplements: { P100026: 'P960009/S104' } },
    { ...draft, applications: Array(101).fill('P080025') }]) {
    assert.equal(readPilotDraft(JSON.stringify(invalid)), null, JSON.stringify(invalid).slice(0, 100));
  }
  assert.equal(readPilotDraft('{'), null);
  assert.equal(readPilotDraft(' '.repeat(1_000_001)), null);
});
