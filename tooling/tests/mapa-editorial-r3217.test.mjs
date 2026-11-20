import test from 'node:test';
import assert from 'node:assert/strict';
import { generaTaulaEditorial301 } from '../importacio/mapa-editorial-301.mjs';
import { verificaMapaRedireccions301, normalitzaOrigen301 } from '../seo/mapa-redireccions-301.mjs';

function construct(sources, destinations) {
  const inventory = [...new Set(destinations)];
  const direct = sources.map((source, i) => ({ linkOriginal: source, rutaDestiCanonica: destinations[i] }));
  const mapping = Object.fromEntries(sources.map((source, i) => [source, destinations[i]]));
  const a = generaTaulaEditorial301(direct, { destinsDisponibles: inventory });
  const b = generaTaulaEditorial301(sources.map(linkOriginal => ({ linkOriginal })), { destinsDisponibles: inventory, destinacions: mapping });
  assert.deepEqual(a, b);
  assert.equal(verificaMapaRedireccions301(a).valid, true);
  assert.deepEqual(a.redireccions, sources.map((source, i) => ({ source: normalitzaOrigen301(source), destination: destinations[i], status: 301 })));
  return a;
}

test('R32.17 índex exacte conserva prefixes, zeros, hosts i sufixos col·lidents', () => {
  const sources = ['https://socdepoble.net/a-1', 'https://socdepoble.net/b-1', 'https://socdepoble.com/a-1', 'https://socdepoble.net/a-01', 'https://socdepoble.net/a-0001', 'https://socdepoble.net/index.php?p=1'];
  const destinations = ['/mur/a-1', '/mur/b-1', '/mur/a-01', '/mur/c-1', '/mur/d-1', '/mur/e-1'];
  assert.equal(construct(sources, destinations).redireccions.length, 6);
});

test('R32.17 tots els buckets col·lidents passen a comparació exacta', () => {
  const sources = Array.from({ length: 4000 }, (_, i) => `https://socdepoble.net/prefix-${i}-1`);
  const destinations = sources.map((_, i) => `/mur/prefix-${i}-1`);
  assert.equal(construct(sources, destinations).redireccions.length, 4000);
  sources.push(sources[937]); destinations.push(destinations[937]);
  assert.throws(() => construct(sources, destinations), /origen_duplicat/);
});

test('R32.17 IDs fora de bucket, 19 dígits i rutes sense sufix continuen exactes', () => {
  construct(['https://socdepoble.com/index.php?attachment_id=9999999999999999999', 'https://socdepoble.net/normal', 'https://socdepoble.net/a-200001', 'https://socdepoble.net/..visible'], ['/mur/a', '/mur/b', '/mur/c', '/mur/d']);
});

for (const [name, sources] of [
  ['http/www', ['https://socdepoble.net/a-1', 'http://www.socdepoble.net/a-1']],
  ['Blogger m=1', ['https://elrentonar.blogspot.com/2026/11/memoria.html', 'http://elrentonar.blogspot.com/2026/11/memoria.html?m=1']],
]) test(`R32.17 normalització compartida detecta duplicat ${name}`, () => {
  assert.throws(() => construct(sources, ['/mur/final', '/mur/final']), /origen_duplicat/);
});

test('R32.17 inventari duplicat es refusa encara que la fila no el consulte', () => {
  assert.throws(() => generaTaulaEditorial301([], { destinsDisponibles: ['/mur/a-1', 'https://socdepoble.org/mur/a-1'] }), /desti_duplicat/);
});

test('R32.17 l’èxit previ no autoritza mutacions posteriors ni corpus parcial', () => {
  const article = { linkOriginal: 'https://socdepoble.net/a-1', rutaDestiCanonica: '/mur/final' }, options = { destinsDisponibles: ['/mur/final'] };
  const first = generaTaulaEditorial301([article], options);
  article.linkOriginal = 'https://evil.example/a-1';
  assert.throws(() => generaTaulaEditorial301([article], options), /origen_invalid/);
  article.linkOriginal = 'https://socdepoble.net/a-1'; options.destinsDisponibles[0] = '/mur/other';
  assert.throws(() => generaTaulaEditorial301([article], options), /desti_no_verificat/);
  assert.equal(verificaMapaRedireccions301({ ...first, origensEsperats: [] }).valid, false);
});

test('R32.17 claus heretades no substituïxen la correspondència revisada', () => {
  const source = 'https://socdepoble.net/a-1';
  Object.defineProperty(Object.prototype, source, { configurable: true, value: '/mur/final' });
  try {
    assert.throws(() => generaTaulaEditorial301([{ linkOriginal: source }], { destinsDisponibles: ['/mur/final'], destinacions: {} }), /correspondència/);
  } finally { delete Object.prototype[source]; }
});

test('R32.17 no hi ha cadenes, cicles, esquemes hostils ni eixides externes', () => {
  const source = 'https://socdepoble.net/a-1';
  for (const destination of [source, 'https://socdepoble.com/b-1', '//evil.example/a', 'javascript:alert(1)', 'https://socdepoble.org.evil.example/a', '/mur/../final', '/mur/%2Ffinal', '/mur/a\\b', '/mur/a?redirect=evil']) {
    assert.throws(() => generaTaulaEditorial301([{ linkOriginal: source, rutaDestiCanonica: destination }], { destinsDisponibles: ['/mur/final'] }), /desti_/);
  }
});

test('R32.17 no elimina fonts addicionals, ni supera el pressupost de files', () => {
  const sources = ['https://socdepoble.net/a-1', 'https://socdepoble.com/b-1'];
  const table = generaTaulaEditorial301([{ fontsOriginals: sources }], { destinsDisponibles: ['/mur/final'], destinacions: Object.fromEntries(sources.map(s => [s, '/mur/final'])) });
  assert.equal(table.redireccions.length, 2);
  assert.throws(() => generaTaulaEditorial301(new Array(200001), { destinsDisponibles: [] }));
});


test('R32.17 Proxy has-traps cannot hide own origins or reviewed destinations', () => {
  const one = 'https://socdepoble.net/a-1', two = 'https://socdepoble.com/b-1';
  const options = { destinsDisponibles: ['/mur/final'], destinacions: { [one]: '/mur/final', [two]: '/mur/final' } };
  const hides = value => new Proxy(value, { has: () => false });
  assert.throws(() => generaTaulaEditorial301([hides({ linkOriginal: one, rutaDestiCanonica: '/mur/final', fontsOriginals: [one, two] })], { destinsDisponibles: ['/mur/final'] }), /expandir/);
  const expanded = generaTaulaEditorial301([hides({ linkOriginal: one, fontsOriginals: [one, two] })], options);
  assert.equal(expanded.redireccions.length, 2);
  assert.throws(() => generaTaulaEditorial301([hides({ linkOriginal: one, rutaDestiCanonica: '/mur/other' })], options), /divergents/);
  const throws = new Proxy({ linkOriginal: one }, { has() { throw new Error('has trap must not execute'); } });
  assert.equal(generaTaulaEditorial301([throws], options).redireccions.length, 1);
});
