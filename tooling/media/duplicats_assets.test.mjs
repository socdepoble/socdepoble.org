/**
 * P1-29 · Unicitat de bytes de public/assets (B10 marató 261101_2143, spec B10-GOVERN §2.1c).
 * Les tres primeres proves miren l'arbre real: un duplicat nou sense àlies, bessona, parella o
 * declaració fa caure la suite primària i el missatge diu quina entrada caldria afegir.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire, syncBuiltinESMExports } from 'node:module';
import { fileURLToPath } from 'node:url';
import { arrelSegura } from '../lib/arrel.mjs';
import { inventariAssets } from './cens_imatges.mjs';
import { EXCLOSES } from '../../src/sections/multimedia/censImatges.js';
import {
  CORRECCIONS_D_ALIES, DUPLICATS_ACREDITATS, MAX_SALTS, TIPUS_DECLARATS, arrelDelCens, classificaDuplicats,
  contextDelCens, declaracionsRancies, grupsDuplicats, motiusTrencats, originalDelMotiu, propostaDeclaracio
} from './duplicats_assets.mjs';

const ordenats = (llista) => [...llista].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

let real = null;
/** L'arbre real es llig una sola vegada (462 imatges, ~134 MB de hash). */
function arbreReal() {
  if (!real) {
    const inventari = inventariAssets(arrelSegura());
    const ctx = contextDelCens({ presents: inventari.map((i) => i.src) });
    const grups = grupsDuplicats(inventari);
    real = { inventari, ctx, grups, classificats: classificaDuplicats(grups, ctx) };
  }
  return real;
}

test('arbre real: cap grup de bytes idèntics sense acreditar', () => {
  const { classificats, inventari } = arbreReal();
  assert.ok(inventari.length > 100, `inventari sospitosament curt: ${inventari.length}`);
  const sense = classificats.filter((g) => g.acreditacio === 'no_acreditat');
  assert.deepEqual(sense.map((g) => g.fitxers), [], sense.map((g) => [
    `Grup sense acreditar (sha256 ${g.sha256.slice(0, 12)}…): ${g.fitxers.join(' = ')}`,
    `  arrels: ${g.arrels.join(', ')}`,
    '  Resol l’àlies (EXCLOSES/CORRECCIONS_D_ALIES) o afig a DUPLICATS_ACREDITATS de tooling/media/duplicats_assets.mjs:',
    propostaDeclaracio(g)
  ].join('\n')).join('\n'));
  assert.ok(classificats.some((g) => g.acreditacio === 'mateix_asset'));
  assert.ok(classificats.some((g) => g.acreditacio === 'parella_cens'));
});

test('arbre real: cada declaració és exactament un grup real que no s’explica sol', () => {
  const { classificats, grups } = arbreReal();
  for (const d of DUPLICATS_ACREDITATS) {
    assert.ok(TIPUS_DECLARATS.includes(d.tipus), `tipus desconegut: ${d.tipus}`);
    assert.equal(d.decisio, 'pendent_mestre');
    assert.ok(typeof d.motiu === 'string' && d.motiu.length > 20, `motiu buit: ${d.fitxers[0]}`);
    assert.deepEqual([...d.fitxers], ordenats(new Set(d.fitxers)), `fitxers no ordenats o repetits: ${d.fitxers[0]}`);
    const casen = grups.filter((g) => g.fitxers.join('|') === d.fitxers.join('|'));
    assert.equal(casen.length, 1, `declaració sense grup real idèntic: ${d.fitxers.join(' = ')}`);
  }
  const rancies = declaracionsRancies(classificats);
  assert.deepEqual(rancies.map((d) => d.fitxers), [],
    'retira de DUPLICATS_ACREDITATS les declaracions ràncies (grup desaparegut, membres canviats o ja explicat per àlies)');
});

test('arbre real: cap motiu trencat; cada correcció continua fent falta i diu la veritat', () => {
  const { ctx, inventari } = arbreReal();
  assert.deepEqual(motiusTrencats(ctx), []);
  const hash = new Map(inventari.map((i) => [i.src, i.sha256]));
  const correccions = Object.entries(CORRECCIONS_D_ALIES);
  assert.ok(correccions.length > 0);
  for (const [copia, { original, motiu }] of correccions) {
    assert.ok(motiu, `correcció sense motiu: ${copia}`);
    assert.ok(ctx.presents.has(copia), `correcció rància, la còpia ja no existix: ${copia}`);
    assert.ok(ctx.presents.has(original), `la correcció nomena un original absent: ${original}`);
    assert.equal(hash.get(copia), hash.get(original), `la còpia i l’original corregit no són els mateixos bytes: ${copia}`);
    const ingenu = originalDelMotiu(copia, EXCLOSES[copia]);
    assert.ok(ingenu, `EXCLOSES ja no dona cap original per a ${copia}: retira la correcció`);
    assert.ok(!ctx.presents.has(ingenu), `l’original ingenu ${ingenu} ja existix: la correcció és rància, retira-la`);
  }
});

/* ── Fixtures pures: context injectat, cap disc ─────────────────────────── */

const ctxDe = (extra) => contextDelCens({ cens: [], excloses: {}, svgs: {}, correccions: {}, ...extra });

test('una cadena còpia → còpia → cens dona una sola arrel; l’avatar de DIR/ conserva el nom', () => {
  const ctx = ctxDe({
    presents: ['/assets/a.jpg', '/assets/b.jpg', '/assets/c.jpg', '/assets/av/cara.png', '/assets/gent/av/cara.png'],
    cens: [{ src: '/assets/a.jpg' }, { src: '/assets/av/cara.png' }],
    excloses: {
      '/assets/b.jpg': 'còpia de /assets/a.jpg', '/assets/c.jpg': 'còpia de /assets/b.jpg',
      '/assets/gent/av/cara.png': 'còpia de l’avatar de /assets/av/'
    }
  });
  assert.equal(arrelDelCens('/assets/c.jpg', ctx), '/assets/a.jpg');
  assert.equal(arrelDelCens('/assets/gent/av/cara.png', ctx), '/assets/av/cara.png');
  const [grup] = classificaDuplicats([{ sha256: 'x', fitxers: ['/assets/a.jpg', '/assets/b.jpg', '/assets/c.jpg'] }], ctx,
    { pares: [], acreditats: [] });
  assert.deepEqual(grup.arrels, ['/assets/a.jpg']);
  assert.equal(grup.acreditacio, 'mateix_asset');
});

test('una bessona hereta l’arrel del seu original; amb dues fonts no és bessona de ningú', () => {
  const ctx = ctxDe({
    presents: ['/assets/x/o.png', '/assets/o.png', '/assets/o.webp'],
    cens: [{ src: '/assets/x/o.png' }],
    excloses: { '/assets/o.png': 'còpia de /assets/x/o.png' }
  });
  assert.equal(arrelDelCens('/assets/o.webp', ctx), '/assets/x/o.png');
  const ambiguo = ctxDe({
    presents: ['/assets/x/o.png', '/assets/o.png', '/assets/o.jpg', '/assets/o.webp'],
    cens: [{ src: '/assets/x/o.png' }],
    excloses: { '/assets/o.png': 'còpia de /assets/x/o.png' }
  });
  assert.equal(arrelDelCens('/assets/o.webp', ambiguo), '/assets/o.webp');
});

test('un SVG documentat com a «còpia idèntica de X:» té X per arrel; un altre motiu no', () => {
  const svgs = {
    '/assets/uploads/l.svg': { motiu: 'logotip quadrat; còpia idèntica de /assets/system/ui/l.svg: cap mòdul la cita' },
    '/assets/uploads/b.svg': { motiu: 'insígnia vectorial per a la pàgina /fediversity' }
  };
  const ctx = ctxDe({ presents: ['/assets/system/ui/l.svg', '/assets/uploads/l.svg', '/assets/uploads/b.svg'], svgs });
  assert.equal(originalDelMotiu('/assets/uploads/l.svg', svgs['/assets/uploads/l.svg'].motiu), '/assets/system/ui/l.svg');
  assert.equal(arrelDelCens('/assets/uploads/l.svg', ctx), '/assets/system/ui/l.svg');
  assert.equal(arrelDelCens('/assets/uploads/b.svg', ctx), '/assets/uploads/b.svg');
  const [grup] = classificaDuplicats([{ sha256: 's', fitxers: ['/assets/system/ui/l.svg', '/assets/uploads/l.svg'] }], ctx,
    { pares: [], acreditats: [] });
  assert.equal(grup.acreditacio, 'mateix_asset');
});

test('una parella acreditada i les seues bessones donen parella_cens; sense parella, no_acreditat; declarada, declarat', () => {
  const ctx = ctxDe({
    presents: ['/assets/p.jpg', '/assets/s.jpg', '/assets/p.webp', '/assets/s.webp'],
    cens: [{ src: '/assets/p.jpg' }, { src: '/assets/s.jpg' }]
  });
  const pares = [{ primaria: '/assets/s.jpg', secundaria: '/assets/p.jpg' }];
  const grups = [
    { sha256: 'a', fitxers: ['/assets/p.jpg', '/assets/s.jpg'] },
    { sha256: 'b', fitxers: ['/assets/p.webp', '/assets/s.webp'] }
  ];
  assert.deepEqual(classificaDuplicats(grups, ctx, { pares, acreditats: [] }).map((g) => g.acreditacio), ['parella_cens', 'parella_cens']);
  assert.deepEqual(classificaDuplicats(grups, ctx, { pares: [], acreditats: [] }).map((g) => g.acreditacio), ['no_acreditat', 'no_acreditat']);
  const acreditats = [{ tipus: 'semantic_arxiu', fitxers: ['/assets/p.webp', '/assets/s.webp'], motiu: 'prova', decisio: 'pendent_mestre' }];
  const classificats = classificaDuplicats(grups, ctx, { pares: [], acreditats });
  assert.deepEqual(classificats.map((g) => g.acreditacio), ['no_acreditat', 'declarat']);
  assert.deepEqual(declaracionsRancies(classificats, acreditats), []);
  /* Una declaració d'un grup que ja s'explica per la parella és rància. */
  assert.deepEqual(declaracionsRancies(classificaDuplicats(grups, ctx, { pares, acreditats }), acreditats), acreditats);
  assert.match(propostaDeclaracio(grups[0]), /'\/assets\/p\.jpg',\n {4}'\/assets\/s\.jpg'/);
});

test('una tercera arrel en el grup d’una parella acreditada no s’acredita; una còpia per àlies d’un membre, sí', () => {
  /* B10G-CENS-ARB-02: la parella només acredita grups de dues arrels exactes. */
  const pares = [{ primaria: '/assets/s.jpg', secundaria: '/assets/p.jpg' }];
  const presents = ['/assets/p.jpg', '/assets/s.jpg', '/assets/t.jpg'];
  const cens = [{ src: '/assets/p.jpg' }, { src: '/assets/s.jpg' }];
  const grups = [{ sha256: 't', fitxers: presents }];
  const [ambTercera] = classificaDuplicats(grups, ctxDe({ presents, cens }), { pares, acreditats: [] });
  assert.deepEqual(ambTercera.arrels, presents);
  assert.equal(ambTercera.acreditacio, 'no_acreditat');
  const declarat = [{ tipus: 'semantic_arxiu', fitxers: presents, motiu: 'prova', decisio: 'pendent_mestre' }];
  assert.equal(classificaDuplicats(grups, ctxDe({ presents, cens }), { pares, acreditats: declarat })[0].acreditacio, 'declarat');
  const ambAlies = ctxDe({ presents, cens, excloses: { '/assets/t.jpg': 'còpia de /assets/p.jpg' } });
  const [ambCopia] = classificaDuplicats(grups, ambAlies, { pares, acreditats: [] });
  assert.deepEqual(ambCopia.arrels, ['/assets/p.jpg', '/assets/s.jpg']);
  assert.equal(ambCopia.acreditacio, 'parella_cens');
});

test('un cicle a → b → a llança; més de 8 salts llança; 8 salts no', () => {
  const cicle = ctxDe({
    presents: ['/assets/a.jpg', '/assets/b.jpg'],
    excloses: { '/assets/a.jpg': 'còpia de /assets/b.jpg', '/assets/b.jpg': 'còpia de /assets/a.jpg' }
  });
  assert.throws(() => arrelDelCens('/assets/a.jpg', cicle), /Cicle d’àlies al cens: \/assets\/a\.jpg → \/assets\/b\.jpg → \/assets\/a\.jpg/);
  const cadena = (salts) => {
    const fitxers = Array.from({ length: salts + 1 }, (_, i) => `/assets/f${i}.jpg`);
    const excloses = Object.fromEntries(fitxers.slice(0, -1).map((f, i) => [f, `còpia de ${fitxers[i + 1]}`]));
    return ctxDe({ presents: fitxers, cens: [{ src: fitxers.at(-1) }], excloses });
  };
  assert.equal(MAX_SALTS, 8);
  assert.equal(arrelDelCens('/assets/f0.jpg', cadena(MAX_SALTS)), `/assets/f${MAX_SALTS}.jpg`);
  assert.throws(() => arrelDelCens('/assets/f0.jpg', cadena(MAX_SALTS + 1)), /Més de 8 salts/);
});

test('sense motiu de còpia l’arrel és el mateix src; un original absent es denuncia i una correcció el resol', () => {
  const presents = ['/assets/solta.jpg', '/assets/logo.png', '/assets/trencada.jpg', '/assets/av/x_a.png', '/assets/ia/av/x-b.png'];
  const excloses = {
    '/assets/logo.png': 'logotip', '/assets/trencada.jpg': 'còpia de /assets/absent.jpg',
    '/assets/ia/av/x-b.png': 'còpia de l’avatar de /assets/av/', '/assets/fantasma.png': 'còpia de /assets/absent.jpg'
  };
  const sense = ctxDe({ presents, cens: [{ src: '/assets/av/x_a.png' }], excloses });
  assert.equal(arrelDelCens('/assets/solta.jpg', sense), '/assets/solta.jpg');
  assert.equal(arrelDelCens('/assets/logo.png', sense), '/assets/logo.png');
  assert.equal(arrelDelCens('/assets/trencada.jpg', sense), '/assets/trencada.jpg');
  assert.equal(arrelDelCens('/assets/ia/av/x-b.png', sense), '/assets/ia/av/x-b.png');
  /* La còpia absent (fantasma) no compta: només es denuncien motius de còpies presents. */
  assert.deepEqual(motiusTrencats(sense), [
    { src: '/assets/ia/av/x-b.png', original: '/assets/av/x-b.png', font: 'excloses' },
    { src: '/assets/trencada.jpg', original: '/assets/absent.jpg', font: 'excloses' }
  ]);
  const correccions = { '/assets/ia/av/x-b.png': { original: '/assets/av/x_a.png', motiu: 'el nom ingenu no existix' } };
  const amb = ctxDe({ presents, cens: [{ src: '/assets/av/x_a.png' }], excloses, correccions });
  assert.equal(arrelDelCens('/assets/ia/av/x-b.png', amb), '/assets/av/x_a.png');
  assert.deepEqual(motiusTrencats(amb), [{ src: '/assets/trencada.jpg', original: '/assets/absent.jpg', font: 'excloses' }]);
  const correccioTrencada = ctxDe({ presents, excloses, correccions: { '/assets/solta.jpg': { original: '/assets/no-hi-es.png' } } });
  assert.deepEqual(motiusTrencats(correccioTrencada).filter((m) => m.font === 'correccio'),
    [{ src: '/assets/solta.jpg', original: '/assets/no-hi-es.png', font: 'correccio' }]);
});

test('els motius es lligen en temps lineal (cap regex amb retrocés)', () => {
  const llarg = `còpia de /assets/${'a'.repeat(200000)} ${'còpia idèntica de '.repeat(5000)}`;
  const inici = process.hrtime.bigint();
  assert.equal(originalDelMotiu('/assets/x.png', llarg), null);
  assert.equal(originalDelMotiu('/assets/x.png', `${'; '.repeat(100000)}còpia idèntica de /assets/y.svg:`), '/assets/y.svg');
  assert.ok(Number(process.hrtime.bigint() - inici) / 1e6 < 500);
});

test('inventari real d’una fixture: només imatges, forma { src, abs, bytes, sha256 }, i una còpia sense motiu no s’acredita', (t) => {
  const arrel = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-duplicats-prova-'));
  t.after(() => fs.rmSync(arrel, { recursive: true, force: true }));
  const escriu = (rel, text) => {
    fs.mkdirSync(path.dirname(path.join(arrel, rel)), { recursive: true });
    fs.writeFileSync(path.join(arrel, rel), text);
  };
  escriu('public/assets/viu.jpg', 'bytes-original');
  escriu('public/assets/copia/viu.jpg', 'bytes-original');
  escriu('public/assets/altra.png', 'bytes-altres');
  escriu('public/assets/notes.txt', 'bytes-original');
  const inventari = inventariAssets(arrel);
  assert.deepEqual(inventari.map((i) => i.src), ['/assets/altra.png', '/assets/copia/viu.jpg', '/assets/viu.jpg']);
  assert.deepEqual(Object.keys(inventari[0]).sort(), ['abs', 'bytes', 'sha256', 'src']);
  const grups = grupsDuplicats(inventari);
  assert.deepEqual(grups.map((g) => g.fitxers), [['/assets/copia/viu.jpg', '/assets/viu.jpg']]);
  const ctx = contextDelCens({ presents: inventari.map((i) => i.src), cens: [{ src: '/assets/viu.jpg' }], excloses: {}, svgs: {}, correccions: {} });
  assert.equal(classificaDuplicats(grups, ctx, { pares: [], acreditats: [] })[0].acreditacio, 'no_acreditat');
  const ambMotiu = contextDelCens({ presents: inventari.map((i) => i.src), cens: [{ src: '/assets/viu.jpg' }],
    excloses: { '/assets/copia/viu.jpg': 'còpia de /assets/viu.jpg' }, svgs: {}, correccions: {} });
  assert.equal(classificaDuplicats(grups, ambMotiu, { pares: [], acreditats: [] })[0].acreditacio, 'mateix_asset');
});

test('arrelDelCens i la classificació no toquen el disc: mòdul sense imports d’I/O i fs interceptat', () => {
  const font = fs.readFileSync(fileURLToPath(new URL('./duplicats_assets.mjs', import.meta.url)), 'utf8');
  const imports = [...font.matchAll(/\bfrom\s+'([^']+)'/g)].map((m) => m[1]);
  assert.deepEqual(ordenats(imports), ['../../src/config/politicaDeMitjans.js', '../../src/sections/multimedia/censImatges.js']);
  assert.doesNotMatch(font, /\bimport\s*\(|\brequire\s*\(|process\.|node:/);
  const fsCjs = createRequire(import.meta.url)('node:fs');
  const noms = ['readFileSync', 'readdirSync', 'statSync', 'lstatSync', 'existsSync', 'openSync', 'realpathSync', 'accessSync'];
  const originals = Object.fromEntries(noms.map((n) => [n, fsCjs[n]]));
  const accessos = [];
  try {
    for (const n of noms) fsCjs[n] = (...args) => { accessos.push([n, String(args[0])]); throw new Error(`disc tocat: ${n}`); };
    syncBuiltinESMExports();
    const ctx = ctxDe({
      presents: ['/assets/a.jpg', '/assets/b.jpg', '/assets/b.webp'], cens: [{ src: '/assets/a.jpg' }],
      excloses: { '/assets/b.jpg': 'còpia de /assets/a.jpg' }
    });
    assert.equal(arrelDelCens('/assets/b.webp', ctx), '/assets/a.jpg');
    classificaDuplicats([{ sha256: 'x', fitxers: ['/assets/a.jpg', '/assets/b.webp'] }], ctx, { pares: [], acreditats: [] });
    motiusTrencats(ctx);
  } finally {
    for (const n of noms) fsCjs[n] = originals[n];
    syncBuiltinESMExports();
  }
  assert.deepEqual(accessos, []);
});
