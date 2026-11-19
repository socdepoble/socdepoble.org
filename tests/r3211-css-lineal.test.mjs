import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { blocsCssFulla } from '../tooling/lib/lexic-css.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const oldSurface = text => [...text.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m => ({ selector: m[1], body: m[2], index: m.index }));

test('leaf scanner retains selectors, bodies and offsets over real CSS and nested/invalid surfaces', () => {
  const samples = ['', '{}', 'a{b}', '@media{x{y} z{a:b}}', 'a{{x}} b{x{y}z}', '}text{body}other', 'a{unterminated'];
  for (const name of fs.readdirSync(path.join(ROOT, 'src/css'))) if (name.endsWith('.css')) samples.push(fs.readFileSync(path.join(ROOT, 'src/css', name), 'utf8'));
  let seed = 0x3211;
  for (let i = 0; i < 1000; i++) {
    let text = '';
    for (let j = 0; j < 64; j++) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; text += '{};a\n'.charAt(seed % 5); }
    samples.push(text);
  }
  for (const sample of samples) assert.deepEqual([...blocsCssFulla(sample)], oldSurface(sample));
});

test('64 KiB hostile missing-delimiter surfaces stay below the unchanged25ms budget', () => {
  for (const text of ['a'.repeat(65536), '{'.repeat(65536), 'a{'.repeat(32768), '}'.repeat(65536), 'x{}'.repeat(21845) + 'x']) {
    assert.equal(Buffer.byteLength(text), 65536);
    // Warm once; retain each sample and assert the maximum, not a median.
    [...blocsCssFulla(text)];
    const times = [];
    for (let i = 0; i < 7; i++) { const start = performance.now(); [...blocsCssFulla(text)]; times.push(performance.now() - start); }
    assert.ok(Math.max(...times) < 25, JSON.stringify(times));
  }
});
