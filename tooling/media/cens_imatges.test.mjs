import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { censImatges, usosDe, main, plaConsola } from './cens_imatges.mjs';
import { idDelCens } from '../../src/sections/multimedia/censImatges.js';

function fixture(t) {
  const arrel = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-cens-prova-'));
  t.after(() => fs.rmSync(arrel, { recursive: true, force: true }));
  const escriu = (rel, text) => {
    const abs = path.join(arrel, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, text);
    return abs;
  };
  escriu('public/assets/viu.jpg', 'bytes-original');
  return { arrel, escriu, opcions: { cens: [], excloses: {}, alies: {}, arrels: ['src', 'tests', 'public'] } };
}

test('cens determinista i només lectura; originals, bessones i àlies conserven identitat', (t) => {
  const { arrel, escriu, opcions } = fixture(t);
  escriu('public/assets/viu.webp', 'bytes-webp');
  escriu('public/assets/copia.jpg', 'bytes-original');
  escriu('src/pagina.js', "const src = '/assets/viu.jpg';");
  opcions.cens = [{ src: '/assets/viu.jpg', titol: 'Viu' }];
  opcions.alies = { '/assets/copia.jpg': '/assets/viu.jpg' };
  opcions.excloses = { '/assets/copia.jpg': 'còpia de /assets/viu.jpg' };
  const abans = fs.readFileSync(path.join(arrel, 'public/assets/viu.jpg'));
  const a = censImatges(arrel, opcions);
  assert.deepEqual(censImatges(arrel, opcions), a);
  assert.deepEqual(fs.readFileSync(path.join(arrel, 'public/assets/viu.jpg')), abans);
  const [copia, viu, webp] = a.imatges;
  assert.equal(copia.assetId, viu.assetId);
  assert.equal(webp.assetId, viu.assetId);
  assert.equal(webp.bessonaDe, viu.src);
  assert.equal(webp.estat, 'codi_literal');
  assert.equal(webp.usos[0].via, viu.src);
  assert.equal(a.resum.imatges, 3);
  assert.equal(a.resum.hashesUnics, 2);
  assert.equal(a.resum.grupsDuplicats, 1);
  assert.equal(a.resum.copiesRedundants, 1);
  assert.equal(a.resum.bytesRedundants, abans.length);
});

test('referències codificades, query i plantilles dinàmiques no es confonen amb absència', () => {
  const imgs = [{ cami: 'assets/foto amb espai.jpg' }, { cami: 'assets/towns/tibi/1.jpg' }];
  const usos = usosDe(imgs, [
    { fitxer: 'src/a.js', text: "const x = 'https://socdepoble.org/assets/foto%20amb%20espai.jpg?v=2#foto';" },
    { fitxer: 'src/b.js', text: 'const src = `/assets/towns/${slug}/1.jpg`;' }
  ]);
  assert.equal(usos.get(imgs[0].cami)[0].evidencia, 'cami');
  assert.equal(usos.get(imgs[1].cami)[0].evidencia, 'dinamica');
  const fals = usosDe([{ cami: 'assets/normal.png' }], [{ fitxer: 'src/c.js', text: "const copia = '/assets/normal.png.backup';" }]);
  assert.notEqual(fals.get('assets/normal.png')[0].evidencia, 'cami');
});

test('galeria, dades i proves no acrediten ús viu; basename compartit queda ambigu', (t) => {
  const { arrel, escriu, opcions } = fixture(t);
  for (const nom of ['galeria', 'dades', 'prova', 'orfe', 'nom']) escriu(`public/assets/${nom}.jpg`, nom);
  escriu('src/pagina.js', "const nom = 'nom.jpg';");
  escriu('src/galeria.js', '// no resource references');
  escriu('public/dades.json', '{"src":"/assets/dades.jpg"}');
  escriu('tests/imatge.test.mjs', "const src = '/assets/prova.jpg';");
  opcions.cens = [{ src: '/assets/galeria.jpg', titol: 'Arxiu' }];
  const a = censImatges(arrel, opcions);
  const perSrc = Object.fromEntries(a.imatges.map((i) => [i.src, i]));
  assert.equal(perSrc['/assets/galeria.jpg'].estat, 'nomes_galeria');
  assert.equal(perSrc['/assets/dades.jpg'].estat, 'nomes_dades');
  assert.equal(perSrc['/assets/prova.jpg'].estat, 'nomes_proves');
  assert.equal(perSrc['/assets/orfe.jpg'].estat, 'sense_referencia');
  assert.equal(perSrc['/assets/nom.jpg'].estat, 'codi_nom_possible');
  assert.ok(a.senseUsViuIdentificat.includes('/assets/galeria.jpg'));
  assert.ok(!a.senseUsViuIdentificat.includes('/assets/nom.jpg'));
});

test('cens declara absents i rebutja symlinks en lloc de llegir fora del corpus', (t) => {
  const { arrel, escriu, opcions } = fixture(t);
  opcions.cens = [{ src: '/assets/absent.jpg' }];
  assert.deepEqual(censImatges(arrel, opcions).absentsDelCens, ['/assets/absent.jpg']);
  const secret = escriu('fora.txt', 'no llegir');
  fs.symlinkSync(secret, path.join(arrel, 'public/assets/enllac.jpg'));
  assert.throws(() => censImatges(arrel, opcions), /Symlink no admés/);
});

test('cap ancestre symlink pot obrir un directori extern al cens', (t) => {
  const { arrel, escriu, opcions } = fixture(t);
  escriu('extern/assets/externa.png', 'fora del corpus');
  fs.rmSync(path.join(arrel, 'public'), { recursive: true });
  fs.symlinkSync(path.join(arrel, 'extern'), path.join(arrel, 'public'));
  assert.throws(() => censImatges(arrel, opcions), /Symlink no admés al cens: public/);
});

test('inventari d’assets inclou ocults, builds i altres noms exclosos del corpus', (t) => {
  const { arrel, escriu, opcions } = fixture(t);
  for (const rel of ['.oculta.png', 'builds/legitima.png', 'node_modules/imatge.png', '.cache/imatge.png']) {
    escriu(`public/assets/${rel}`, rel);
  }
  const a = censImatges(arrel, opcions);
  assert.equal(a.resum.fitxersAssets, 5);
  assert.equal(a.resum.imatges, 5);
  assert.ok(a.imatges.some((i) => i.src === '/assets/.oculta.png'));
  assert.ok(a.imatges.some((i) => i.src === '/assets/builds/legitima.png'));
  assert.ok(a.imatges.some((i) => i.src === '/assets/node_modules/imatge.png'));
  assert.ok(a.imatges.some((i) => i.src === '/assets/.cache/imatge.png'));
});

test('eina no es compta a si mateixa i errors de CLI retornen no-zero', (t) => {
  const { arrel, escriu, opcions } = fixture(t);
  escriu('tooling/media/cens_imatges.mjs', "const fixture = '/assets/viu.jpg';");
  opcions.arrels.push('tooling');
  assert.equal(censImatges(arrel, opcions).imatges[0].estat, 'sense_referencia');
  const errors = [];
  assert.equal(main(['--aplica'], { sortida: { error: (e) => errors.push(e) } }), 2);
  assert.equal(main(['--json', '--json'], { sortida: { error: (e) => errors.push(e) } }), 2);
  assert.equal(main([], { arrel: path.join(arrel, 'absent'), sortida: { error: (e) => errors.push(e) } }), 1);
  assert.equal(errors.length, 3);
});

test('pla dels quatre esborranys declara acceptació i conserva les rutes actuals', () => {
  const pla = plaConsola({ actors: { imatge: '/actual.webp' } });
  assert.deepEqual(pla.map((i) => i.id), ['actors', 'salut', 'fluxos', 'calendari']);
  assert.equal(pla[0].actual, '/actual.webp');
  assert.ok(pla.every((i) => i.estat === 'pendent_obra_propia' && i.acceptacio.includes('imatgesConsola.test.js')));
});

/* P1-29 (B10 marató 261101_2143) · Opcions completes: cap taula real s'hi cola, i main pot donar 0. */
const completes = (opcions, extra = {}) => ({
  ...opcions, cens: [{ src: '/assets/viu.jpg', titol: 'Viu', ambit: 'contingut', origen: 'ia' }], excloses: {}, alies: {},
  correccions: {}, acreditats: [], pares: [], svgs: {}, trazabilitat: {}, ...extra
});
const captura = () => {
  const linies = [];
  return { linies, text: () => linies.join('\n'), sortida: { log: (l) => linies.push(l), error: (l) => linies.push(l) } };
};

test('el verificador de duplicats tampoc es compta a si mateix; un altre fitxer de tooling sí (control)', (t) => {
  const { arrel, escriu, opcions } = fixture(t);
  opcions.arrels.push('tooling');
  escriu('tooling/media/duplicats_assets.mjs', "const fixture = '/assets/viu.jpg';");
  escriu('tooling/media/duplicats_assets.test.mjs', "const fixture = '/assets/viu.jpg';");
  assert.equal(censImatges(arrel, opcions).imatges[0].estat, 'sense_referencia');
  escriu('tooling/media/altra.mjs', "const fixture = '/assets/viu.jpg';");
  assert.equal(censImatges(arrel, opcions).imatges[0].estat, 'nomes_dades');
});

test('procedència i assetIdArrel d’una còpia encadenada (còpia → còpia → cens) i de la seua bessona', (t) => {
  const { arrel, escriu, opcions } = fixture(t);
  escriu('public/assets/c1.jpg', 'bytes-c1');
  escriu('public/assets/c2.jpg', 'bytes-c2');
  escriu('public/assets/c2.webp', 'bytes-c2-webp');
  escriu('public/assets/solta.jpg', 'bytes-solta');
  escriu('public/assets/segell.svg', '<svg/>');
  const opts = completes(opcions, {
    cens: [{ src: '/assets/viu.jpg', titol: 'Viu', ambit: 'poble', origen: 'foto', poble: 'tibi' }],
    excloses: { '/assets/c1.jpg': 'còpia de /assets/viu.jpg', '/assets/c2.jpg': 'còpia de /assets/c1.jpg' },
    trazabilitat: { '/assets/viu.jpg': { commit: 'abc1234' } },
    svgs: { '/assets/segell.svg': { ambit: 'entitat', commit: 'dbc5a1c14', motiu: 'insígnia vectorial' } }
  });
  const a = censImatges(arrel, opts);
  const perSrc = Object.fromEntries(a.imatges.map((i) => [i.src, i]));
  const procedencia = { font: 'cens', origen: 'foto', ambit: 'poble', poble: 'tibi', commit: 'abc1234' };
  for (const src of ['/assets/c2.jpg', '/assets/c2.webp', '/assets/c1.jpg', '/assets/viu.jpg']) {
    assert.equal(perSrc[src].arrelCens, '/assets/viu.jpg', src);
    assert.equal(perSrc[src].assetIdArrel, idDelCens('/assets/viu.jpg'), src);
    assert.deepEqual(perSrc[src].procedencia, procedencia, src);
  }
  /* assetId es conserva com abans (alies buit: la còpia no arriba al cens). */
  assert.equal(perSrc['/assets/c2.jpg'].assetId, idDelCens('/assets/c2.jpg'));
  assert.equal(perSrc['/assets/solta.jpg'].procedencia, null);
  assert.equal(perSrc['/assets/solta.jpg'].assetIdArrel, idDelCens('/assets/solta.jpg'));
  assert.deepEqual(perSrc['/assets/segell.svg'].procedencia, { font: 'svg_documentat', ambit: 'entitat', commit: 'dbc5a1c14' });
  assert.equal(main([], { arrel, sortida: captura().sortida, opcions: opts }), 0);
});

test('duplicat no declarat, en tres temps: control 0, còpia byte a byte 1, declarada 0', (t) => {
  const { arrel, escriu, opcions } = fixture(t);
  const opts = completes(opcions);
  const control = captura();
  assert.equal(main([], { arrel, sortida: control.sortida, opcions: opts }), 0, control.text());
  assert.match(control.text(), /0 sense acreditar; motius trencats: 0\./);
  escriu('public/assets/copia.jpg', 'bytes-original');
  const defecte = captura();
  assert.equal(main([], { arrel, sortida: defecte.sortida, opcions: opts }), 1, defecte.text());
  assert.match(defecte.text(), /· 1 sense acreditar;/);
  assert.match(defecte.text(), /sense acreditar: \/assets\/copia\.jpg = \/assets\/viu\.jpg/);
  const acreditats = [{ tipus: 'semantic_arxiu', fitxers: ['/assets/copia.jpg', '/assets/viu.jpg'], motiu: 'prova', decisio: 'pendent_mestre' }];
  const declarat = captura();
  assert.equal(main([], { arrel, sortida: declarat.sortida, opcions: { ...opts, acreditats } }), 0, declarat.text());
  assert.match(declarat.text(), /1 declarats · 0 sense acreditar;/);
  const json = captura();
  assert.equal(main(['--json'], { arrel, sortida: json.sortida, opcions: opts }), 1);
  const resultat = JSON.parse(json.text());
  assert.equal(resultat.resum.duplicatsNoAcreditats, 1);
  assert.deepEqual(resultat.duplicats[0].arrels, ['/assets/copia.jpg', '/assets/viu.jpg']);
});

test('motiu trencat: control 0; «còpia de» un original absent 1', (t) => {
  const { arrel, escriu, opcions } = fixture(t);
  escriu('public/assets/copia.jpg', 'bytes-copia-redimensionada');
  const control = captura();
  const bo = completes(opcions, { excloses: { '/assets/copia.jpg': 'còpia de /assets/viu.jpg' } });
  assert.equal(main([], { arrel, sortida: control.sortida, opcions: bo }), 0, control.text());
  assert.match(control.text(), /motius trencats: 0\./);
  const trencat = captura();
  const dolent = completes(opcions, { excloses: { '/assets/copia.jpg': 'còpia de /assets/absent.jpg' } });
  assert.equal(main([], { arrel, sortida: trencat.sortida, opcions: dolent }), 1, trencat.text());
  assert.match(trencat.text(), /0 sense acreditar; motius trencats: 1\./);
  assert.match(trencat.text(), /motiu trencat \(excloses\): \/assets\/copia\.jpg → \/assets\/absent\.jpg absent/);
});
