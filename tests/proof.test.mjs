import { test } from 'node:test';
import assert from 'node:assert/strict';
import { artifactHash, runAgent, createManifest, verifyManifest } from '../src/proof.mjs';

const salt = '11'.repeat(32);
test('salted commitments detect content changes and separate artifact kinds', () => {
  const h = artifactHash('delivery', salt, 'output');
  assert.match(h, /^0x[0-9a-f]{64}$/);
  assert.notEqual(h, artifactHash('delivery!', salt, 'output'));
  assert.notEqual(h, artifactHash('delivery', '22'.repeat(32), 'output'));
  assert.notEqual(h, artifactHash('delivery', salt, 'input'));
});
test('document-checking agent reports source-backed presence and gaps deterministically', () => {
  const input = 'Submission deadline: 2026-10-13. Required: demo, code link, short write-up.';
  assert.deepEqual(runAgent(input), runAgent(input));
  assert.equal(runAgent(input).checks.find(x => x.id === 'deadline').status, 'found');
  assert.equal(runAgent('A demo is required.').checks.find(x => x.id === 'deadline').status, 'missing');
  assert.equal(runAgent(input).checks.find(x => x.id === 'timezone').status, 'missing');
});
test('portable manifest round trip verifies and changed delivery fails', () => {
  const m = createManifest('Demo, code link, short write-up. Deadline: 2026-10-13.', salt, '0x' + 'aa'.repeat(32));
  assert.equal(verifyManifest(JSON.parse(JSON.stringify(m)), m.output).valid, true);
  const r = verifyManifest(m, m.output + '\nEdited after publication');
  assert.equal(r.valid, false);
  assert.equal(r.reason, 'Output commitment mismatch');
});
test('invalid salts, empty input and altered policy are rejected', () => {
  assert.throws(() => artifactHash('x', 'short', 'input'), /salt/i);
  assert.throws(() => createManifest('', salt, '0x' + 'aa'.repeat(32)), /input/i);
  const m = createManifest('Demo required.', salt, '0x' + 'aa'.repeat(32));
  m.policy += ' changed';
  assert.equal(verifyManifest(m, m.output).valid, false);
  assert.equal(verifyManifest({version:'bad'}, 'x').valid, false);
});
