import assert from 'node:assert/strict';
import { test } from 'node:test';
import { benchmark301, normalitzaOrigen301, verificaMapaRedireccions301 } from '../seo/mapa-redireccions-301.mjs';

const row = (source, destination) => ({ source, destination, status: 301 });
const source = suffix => `https://socdepoble.net/${suffix}`;
const input = (sources, destinations) => ({
  redireccions: sources.map((value, i) => row(value, destinations[i % destinations.length])),
  destinsDisponibles: destinations,
});

test('numeric bucket collisions compare the complete URI including prefix, host and leading zeros', () => {
  const urls = [source('alpha1'), source('beta1'), source('alpha01'), 'https://socdepoble.com/alpha1',
    source('gamma1'), source('delta1'), source('alpha000000001'), source('alpha999999999999999999')];
  const data = input(urls, ['/page/alpha1', '/page/beta1', '/page/alpha01']);
  assert.equal(verificaMapaRedireccions301(data).valid, true);
  for (let i = 0; i < urls.length; i++) {
    const duplicate = { ...data, redireccions: [...data.redireccions, row(urls[i], '/page/alpha1')] };
    assert.equal(verificaMapaRedireccions301(duplicate).errors[0].code, 'origen_duplicat_o_conflictiu');
  }
  assert.equal(verificaMapaRedireccions301({ ...data, destinsDisponibles: [...data.destinsDisponibles, '/page/beta1'] }).errors[0].code, 'desti_duplicat');
  assert.equal(verificaMapaRedireccions301({ ...data, redireccions: [...data.redireccions, row(source('new2'), '/page/missing1')] }).errors[0].code, 'desti_no_verificat');
});

test('every adversarial suffix collision remains linear through native Set fallback', () => {
  const routes = Array.from({ length: 10000 }, (_, i) => `/page/name-${i}-1`);
  const data = input(routes.map(value => source(value.slice(1))), routes);
  assert.equal(verificaMapaRedireccions301(data).valid, true);
  data.redireccions[9999].source = data.redireccions[8000].source;
  assert.equal(verificaMapaRedireccions301(data).errors[0].code, 'origen_duplicat_o_conflictiu');
});

test('fast ASCII source path preserves dot-segment, query and host validation', () => {
  for (const uri of ['/index.php?p=1', '/a.b/route_2?page_id=17', '/a~b/route-3?attachment_id=99']) {
    assert.equal(normalitzaOrigen301(source(uri.slice(1))), source(uri.slice(1)));
  }
  for (const uri of ['/index.php?p=01', '/index.php?p=0', '/index.php?p=1&x=2', '/index.php?p=1#frag',
    '/index.php?p=12345678901234567890', '/a/../route1', '/a/./route1', '/a//route1', '/a/..', '/a/.',
    '/a/%2E/route1', '/a/%2Froute1', '/a\u0000route1', '/a\n']) {
    assert.equal(normalitzaOrigen301(source(uri.slice(1))), null, JSON.stringify(uri));
  }
});

test('canonical aliases and exact corpus remain checked after bucket optimization', () => {
  const data = input([source('a1'), source('b1')], ['/page/a1', '/page/b1']);
  assert.equal(verificaMapaRedireccions301({ ...data, origensEsperats: ['http://www.socdepoble.net/a1', source('b1')] }).valid, true);
  assert.equal(verificaMapaRedireccions301({ ...data, origensEsperats: [source('a1'), source('missing1')] }).errors[0].code, 'origen_sense_regla');
  assert.equal(verificaMapaRedireccions301({ ...data, redireccions: [...data.redireccions, row('http://www.socdepoble.net/a1', '/page/b1')] }).errors[0].code, 'origen_duplicat_o_conflictiu');
});

test('membership shortcut is evidence from this invocation and never trusts prior validation', () => {
  const data = input([source('a1')], ['/page/a1']);
  assert.equal(verificaMapaRedireccions301(data).valid, true);
  data.destinsDisponibles[0] = '/page/other1';
  assert.equal(verificaMapaRedireccions301(data).errors[0].code, 'desti_no_verificat');
  data.destinsDisponibles[0] = source('a1');
  data.redireccions[0].destination = source('a1');
  assert.equal(verificaMapaRedireccions301(data).errors[0].code, 'inventari_destins_invalid');
});

test('multi-pass chains and cycles on historical hosts keep failing closed', () => {
  for (let length = 1; length < 30; length++) {
    const data = input(Array.from({ length }, (_, i) => source(`a${i}`)), ['/page/final1']);
    for (let i = 0; i < length; i++) data.redireccions[i].destination = i === length - 1 ? '/page/final1' : source(`a${i + 1}`);
    assert.equal(verificaMapaRedireccions301(data).valid, length === 1);
    data.redireccions[length - 1].destination = source('a0');
    assert.equal(verificaMapaRedireccions301(data).valid, false);
  }
});

test('shuffled general benchmark explicitly reports actual randomization and query coverage', () => {
  const report = benchmark301({ shape: 'general-shuffled', count: 1000, samples: 3 });
  assert.equal(report.mode, 'general');
  assert.deepEqual(report.workload, { shuffledRows: true, shuffledInventory: true, queryRows: 250, seed: 3214 });
  assert.equal(report.targetMet, report.medianMs < 25);
  assert.equal(report.samplesMs.length, 3);
  const legacy = benchmark301({ shape: 'general', count: 1000, samples: 3 });
  assert.equal(legacy.workload.queryRows, 0);
  assert.equal(legacy.workload.shuffledRows, false);
});
