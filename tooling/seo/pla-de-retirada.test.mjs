/* P0-SEO-UNIVERSAL (ordre del Mestre, 13-11-2026) · El pla de retirada del prerender social
   (pla-de-retirada.mjs): només calcula. El Node 0 es puja amb rsync sense --delete, i sense este pla
   una fitxa retirada hi continuaria servida per temps indefinit. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fitxersDelRebut, main, plaDeRetirada} from './pla-de-retirada.mjs';

const rebut = (camins, imatges = []) => ({schema: 'sdp.social-rebut.v1', camins: camins.map(cami => ({cami, classe: 'canonica', origen: 'veinal'})), imatges: imatges.map(fitxer => ({fitxer}))});
const ANTERIOR = rebut(['/projecte', '/empresa', '/empresa/olidelatorre', '/empresa/forn', '/gent/forn', '/perfil'], ['assets/og/aaaaaaaaaaaaaaaaaaaaaaaa.jpg', 'assets/og/bbbbbbbbbbbbbbbbbbbbbbbb.jpg']);
const ACTUAL = rebut(['/projecte', '/empresa', '/empresa/olidelatorre', '/perfil'], ['assets/og/aaaaaaaaaaaaaaaaaaaaaaaa.jpg']);
const DIST = ['index.html', 'manifest.webmanifest', 'assets/index-AbCd.js', 'assets/og/aaaaaaaaaaaaaaaaaaaaaaaa.jpg', 'projecte/index.html',
  'empresa/index.html', 'empresa/olidelatorre/index.html', 'perfil/index.html', 'opendata/directori.jsonld'];

test('un camí del rebut anterior que no és al nou ix a la llista d’esborrar, amb la seua imatge', () => {
  const pla = plaDeRetirada({rebutAnterior: ANTERIOR, rebutActual: ACTUAL, fitxersDeDist: DIST});
  assert.deepEqual(pla.esborra, ['assets/og/bbbbbbbbbbbbbbbbbbbbbbbb.jpg', 'empresa/forn/index.html', 'gent/forn/index.html']);
  assert.deepEqual(pla.avisos, []);
});

test('els directoris propis: tots els fitxers són del prerender; assets/og hi entra i assets no; el més amunt possible', () => {
  const {directorisPropis} = plaDeRetirada({rebutAnterior: ANTERIOR, rebutActual: ACTUAL, fitxersDeDist: DIST});
  assert.deepEqual(directorisPropis, ['assets/og', 'empresa', 'perfil', 'projecte']);
  // Un directori amb un fitxer que no és del prerender no és propi, ni cap avantpassat seu.
  const barrejat = plaDeRetirada({rebutActual: ACTUAL, fitxersDeDist: [...DIST, 'empresa/logo.png']});
  assert.deepEqual(barrejat.directorisPropis, ['assets/og', 'empresa/olidelatorre', 'perfil', 'projecte']);
  assert.ok(!barrejat.directorisPropis.includes('opendata') && !barrejat.directorisPropis.includes('assets'));
});

test('sense rebut anterior només dona els directoris propis; mai proposa esborrar un fitxer que el dist/ d’ara porta', () => {
  const sense = plaDeRetirada({rebutActual: ACTUAL, fitxersDeDist: DIST});
  assert.deepEqual(sense.esborra, []);
  assert.match(sense.avisos.join(' '), /sense rebut anterior/);
  // /gent/forn va ser del prerender, però ara el dist/ el porta per un altre camí (no és al rebut actual): no es toca.
  const ara = plaDeRetirada({rebutAnterior: ANTERIOR, rebutActual: ACTUAL, fitxersDeDist: [...DIST, 'gent/forn/index.html']});
  assert.ok(!ara.esborra.includes('gent/forn/index.html'));
  assert.match(ara.avisos.join(' '), /gent\/forn\/index\.html ja no és del prerender/);
  // Res del que es proposa esborrar és fora del que va escriure el prerender anterior.
  const anteriors = fitxersDelRebut(ANTERIOR);
  for (const fitxer of ara.esborra) assert.ok(anteriors.has(fitxer), fitxer);
  // Un rebut que no és de la mateixa release que el dist/ s'avisa.
  assert.match(plaDeRetirada({rebutActual: ACTUAL, fitxersDeDist: ['index.html']}).avisos.join(' '), /no són de la mateixa release/);
});

test('un rebut mal format o amb camins que ixen de dist/ és un error; la CLI només imprimix i no executa res', t => {
  for (const dolent of [null, {}, {schema: 'altre', camins: [], imatges: []}, rebut(['/../etc/passwd']), rebut(['/a'], ['../fora.jpg']), rebut(['/a'], ['/abs.jpg'])]) {
    assert.throws(() => plaDeRetirada({rebutActual: dolent, fitxersDeDist: []}), /rebut|no vàlid/);
  }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-retirada-')); t.after(() => fs.rmSync(dir, {recursive: true, force: true}));
  for (const rel of DIST) { fs.mkdirSync(path.dirname(path.join(dir, 'dist', rel)), {recursive: true}); fs.writeFileSync(path.join(dir, 'dist', rel), rel); }
  fs.writeFileSync(path.join(dir, 'anterior.json'), JSON.stringify(ANTERIOR)); fs.writeFileSync(path.join(dir, 'actual.json'), JSON.stringify(ACTUAL));
  const abans = fs.readdirSync(path.join(dir, 'dist'), {recursive: true}).sort();
  let text = '';
  const codi = main(['--actual', path.join(dir, 'actual.json'), '--anterior', path.join(dir, 'anterior.json'), '--dist', path.join(dir, 'dist')], {stdout: {write: s => { text += s; }}, stderr: {write: () => {}}});
  const pla = JSON.parse(text);
  assert.deepEqual([codi, pla.valid, pla.nomesCalcula, pla.esborra.length, pla.directorisPropis], [0, true, true, 3, ['assets/og', 'empresa', 'perfil', 'projecte']]);
  assert.deepEqual(fs.readdirSync(path.join(dir, 'dist'), {recursive: true}).sort(), abans, 'el dist/ no es toca');
  let error = '';
  assert.equal(main(['--actual', path.join(dir, 'no-hi-es.json'), '--dist', path.join(dir, 'dist')], {stdout: {write: () => {}}, stderr: {write: s => { error += s; }}}), 1);
  assert.equal(JSON.parse(error).valid, false);
  assert.equal(main(['--executa', 'x'], {stdout: {write: () => {}}, stderr: {write: () => {}}}), 1);
});
