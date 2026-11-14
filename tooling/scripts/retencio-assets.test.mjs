/* Onada R24 · Consola Zero (P-A de l'informe 261114 «consola_404_chunks») ·
   La retenció de recursos amb empremta entre desplegaments
   (tooling/scripts/retencio-assets.mjs) sobre dist/ i arxius fingits en un
   mkdtemp: el pla pur (builds sencers o res, sostre, dies, clausura, llista
   de retirada), les col·lisions, la idempotència, els enllaços simbòlics, la
   paritat de l'expressió amb el service worker i l'ordre de veres (codis
   0/1/2, cap carpeta creada sense --arxiu, res escrit a dist/ fora
   d'assets/). Cap build ni xarxa. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ESQUEMA, NOM_AMB_EMPREMTA, PER_DEFECTE, arxiva, comprovaClausura, entradaDeLHtml, incorpora,
  main, planDeRetencio, referenciesDelTros
} from './retencio-assets.mjs';

const ORDRE = fileURLToPath(new URL('./retencio-assets.mjs', import.meta.url));
const ARREL = fileURLToPath(new URL('../..', import.meta.url));
const sha = (text) => createHash('sha256').update(text).digest('hex');
const MB = 1024 * 1024;

function temporal(t, prefix) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

/* Un dist de Vite en miniatura: l'entrada importa un tros estàtic i un de
   diferit amb les seues dependències a __vite__mapDeps, com el de veres. */
function build({ entrada, tros, icona, extra = {} }) {
  return {
    [entrada]: `const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/${tros}","assets/${icona}"])))=>i.map(i=>d[i]);`
      + `import{r as e}from"./react-ReactR01.js";const x=()=>import(${JSON.stringify(`./${tros}`)});export{e as c_};`,
    [tros]: `import{c_ as a}from"./${entrada}";import"./react-ReactR01.js";export default a;`,
    [icona]: `import{c_ as e}from"./${entrada}";export const i=e;`,
    'react-ReactR01.js': 'export const r=1;',
    ...extra
  };
}

function escriuDist(dir, fitxers, entrada) {
  fs.mkdirSync(path.join(dir, 'assets', 'system'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), `<!doctype html><html><head>
<script type="module" crossorigin src="/assets/${entrada}"></script>
<link rel="modulepreload" crossorigin href="/assets/react-ReactR01.js">
</head><body><div id="root"></div></body></html>`);
  fs.writeFileSync(path.join(dir, 'assets', 'system', 'logo.png'), 'png');
  fs.writeFileSync(path.join(dir, 'assets', 'llicencia.svg'), '<svg/>');
  for (const [nom, text] of Object.entries(fitxers)) fs.writeFileSync(path.join(dir, 'assets', nom), text);
  return dir;
}

const A = build({ entrada: 'index-EntradA1.js', tros: 'XatSection-XatSecA1.js', icona: 'send-SendAAA1.js' });
const B = build({ entrada: 'index-EntradB2.js', tros: 'XatSection-XatSecB2.js', icona: 'send-SendBBB2.js' });
const C = build({ entrada: 'index-EntradC3.js', tros: 'XatSection-XatSecC3.js', icona: 'send-SendCCC3.js' });

const manifest = (entrada, fitxers, creat) => ({
  schema: ESQUEMA, creat, entrada, commit: null,
  fitxers: Object.entries(fitxers).map(([nom, text]) => ({ nom, bytes: Buffer.byteLength(text), sha256: sha(text) })).sort((x, y) => x.nom.localeCompare(y.nom)),
  totalBytes: Object.values(fitxers).reduce((s, text) => s + Buffer.byteLength(text), 0)
});
const actualsDe = (fitxers) => new Map(Object.entries(fitxers).map(([nom, text]) => [nom, sha(text)]));
const referencies = (...builds) => (nom) => {
  for (const fitxers of builds) if (nom in fitxers) return referenciesDelTros(fitxers[nom], nom);
  return null;
};
const ARA = new Date('2026-11-14T05:00:00Z');

test('l’expressió dels noms amb empremta és la del service worker i la del registre, sense /assets/', () => {
  const sw = fs.readFileSync(path.join(ARREL, 'public/sw.js'), 'utf8').match(/const RECURS_AMB_EMPREMTA = \/(.+)\/;/)[1];
  const registre = fs.readFileSync(path.join(ARREL, 'src/pwa/registre.js'), 'utf8').match(/export const RECURS_AMB_EMPREMTA = \/(.+)\/;/)[1];
  assert.equal(sw, registre);
  assert.equal(`^\\/assets\\/${NOM_AMB_EMPREMTA.source.slice(1)}`, sw);
  for (const nom of ['plus-BdnY3z-k.js', 'index-BxDhPh_v.js', 'x-AbCdEf12.css', 'f-AbCdEf12.woff2']) assert.ok(NOM_AMB_EMPREMTA.test(nom), nom);
  for (const nom of ['logo.png', 'x-AbCdEf1.js', 'sub/x-AbCdEf12.js', 'x-AbCdEf12.png']) assert.ok(!NOM_AMB_EMPREMTA.test(nom), nom);
  assert.deepEqual({ ...PER_DEFECTE }, { builds: 3, dies: 30, maxMb: 64 });
});

test('referenciesDelTros: from, import d’efecte, import() i __vite__mapDeps; mai el text lliure ni un altre directori', () => {
  assert.deepEqual([...referenciesDelTros(A['index-EntradA1.js'], 'index-EntradA1.js')].sort(),
    ['XatSection-XatSecA1.js', 'react-ReactR01.js', 'send-SendAAA1.js']);
  assert.deepEqual([...referenciesDelTros(A['XatSection-XatSecA1.js'], 'XatSection-XatSecA1.js')].sort(), ['index-EntradA1.js', 'react-ReactR01.js']);
  // Un manifest de la wiki que només ANOMENA un tros (el cas real de wikiManifest) no és cap importació.
  assert.deepEqual([...referenciesDelTros('const t="vegeu assets/index-BoNloTr2.js i ./x-AbCdEf12.js";', 'wikiManifest-AbCdEf12.js')], []);
  assert.deepEqual([...referenciesDelTros('const l=["assets/index-BoNloTr2.js","./x-AbCdEf12.js",\'./y-AbCdEf12.js\'];', 'wikiManifest-AbCdEf12.js')], []);
  assert.deepEqual([...referenciesDelTros('import"../fora-AbCdEf12.js";', 'a-AbCdEf12.js')], []);
  assert.deepEqual([...referenciesDelTros('@font-face{src:url(/assets/noto-AbCdEf12.woff2)}.x{background:url(./fons-AbCdEf12.css)}', 'e-AbCdEf12.css')].sort(),
    ['fons-AbCdEf12.css', 'noto-AbCdEf12.woff2']);
});

test('entradaDeLHtml: un sol script de mòdul a /assets/; cap o dos és un error', () => {
  assert.equal(entradaDeLHtml('<script type="module" crossorigin src="/assets/index-EntradA1.js"></script>'), 'index-EntradA1.js');
  assert.throws(() => entradaDeLHtml('<html></html>'), /una sola entrada/);
  assert.throws(() => entradaDeLHtml('<script type="module" src="/assets/a-AAAAAAAA.js"></script><script type="module" src="/assets/b-BBBBBBBB.js"></script>'), /una sola entrada/);
  assert.throws(() => entradaDeLHtml('<script type="module" src="https://cdn.example/index-AAAAAAAA.js"></script>'), /una sola entrada/);
});

test('planDeRetencio: amb dos manifests, retén tots els fitxers de l’anterior que no són a l’actual', () => {
  const pla = planDeRetencio({
    manifests: [manifest('index-EntradA1.js', A, '2026-11-14T02:27:52.000Z'), manifest('index-EntradB2.js', B, '2026-11-14T04:00:00.000Z')],
    entradaActual: 'index-EntradB2.js', actuals: actualsDe(B), ara: ARA, referencies: referencies(A, B)
  });
  assert.deepEqual(pla.retinguts.map((r) => r.entrada), ['index-EntradA1.js']);
  assert.deepEqual(pla.copia.map((f) => f.nom).sort(), ['XatSection-XatSecA1.js', 'index-EntradA1.js', 'send-SendAAA1.js']);
  // React no canvia de nom: és compartit, no es copia.
  assert.equal(pla.retinguts[0].compartits, 1);
  assert.deepEqual(pla.exclosos, []);
});

test('planDeRetencio: el sostre de bytes deixa fora el build sencer (0 fitxers seus) i tots els més vells', () => {
  const gran = build({ entrada: 'index-EntradA1.js', tros: 'XatSection-XatSecA1.js', icona: 'send-SendAAA1.js', extra: { 'pes-PesPesA1.js': 'x'.repeat(2 * MB) } });
  const pla = planDeRetencio({
    manifests: [manifest('index-EntradA1.js', gran, '2026-11-13T02:00:00.000Z'), manifest('index-EntradB2.js', B, '2026-11-14T02:00:00.000Z'),
      manifest('index-EntradC3.js', C, '2026-11-14T04:00:00.000Z')],
    entradaActual: 'index-EntradC3.js', actuals: actualsDe(C), ara: ARA, maxBytes: 1 * MB, referencies: referencies(gran, B, C)
  });
  assert.deepEqual(pla.retinguts.map((r) => r.entrada), ['index-EntradB2.js']);
  assert.ok(!pla.copia.some((f) => /A1\.js$/.test(f.nom)), 'cap fitxer del build que no hi cap');
  assert.deepEqual(pla.exclosos.map((e) => [e.entrada, e.motiu]), [['index-EntradA1.js', 'sostre']]);
  assert.ok(pla.bytes <= 1 * MB);
  // Un sostre que no deixa entrar ni el primer: tampoc cap dels més vells, encara que hi cabrien.
  const granB = { ...B, 'pes-PesPesB2.js': 'x'.repeat(2 * MB) };
  const res = planDeRetencio({
    manifests: [manifest('index-EntradA1.js', A, '2026-11-13T02:00:00.000Z'), manifest('index-EntradB2.js', granB, '2026-11-14T02:00:00.000Z'),
      manifest('index-EntradC3.js', C, '2026-11-14T04:00:00.000Z')],
    entradaActual: 'index-EntradC3.js', actuals: actualsDe(C), ara: ARA, maxBytes: 1 * MB,
    referencies: referencies(A, granB, C)
  });
  assert.deepEqual([res.retinguts.length, res.copia.length], [0, 0]);
  assert.deepEqual(res.exclosos.map((e) => e.motiu), ['sostre', 'sostre']);
});

test('planDeRetencio: com a molt N builds, dins dels dies; els més vells queden fora amb el seu motiu', () => {
  const D = build({ entrada: 'index-EntradD4.js', tros: 'XatSection-XatSecD4.js', icona: 'send-SendDDD4.js' });
  const manifests = [
    manifest('index-EntradA1.js', A, '2026-10-01T00:00:00.000Z'),
    manifest('index-EntradB2.js', B, '2026-11-12T00:00:00.000Z'),
    manifest('index-EntradC3.js', C, '2026-11-13T00:00:00.000Z'),
    manifest('index-EntradD4.js', D, '2026-11-14T04:00:00.000Z')
  ];
  const tots = referencies(A, B, C, D);
  const unSol = planDeRetencio({ manifests, entradaActual: 'index-EntradD4.js', actuals: actualsDe(D), ara: ARA, builds: 1, referencies: tots });
  assert.deepEqual(unSol.retinguts.map((r) => r.entrada), ['index-EntradC3.js']);
  // L'A també hi sobraria, però el primer motiu que se li aplica és l'edat.
  assert.deepEqual(unSol.exclosos.map((e) => [e.entrada, e.motiu]), [['index-EntradB2.js', 'fora-dels-n-builds'], ['index-EntradA1.js', 'massa-vell']]);
  const perDefecte = planDeRetencio({ manifests, entradaActual: 'index-EntradD4.js', actuals: actualsDe(D), ara: ARA, referencies: tots });
  assert.deepEqual(perDefecte.retinguts.map((r) => r.entrada), ['index-EntradC3.js', 'index-EntradB2.js']);
  // L'A té 44 dies: fora per edat, encara que hi càpia.
  assert.deepEqual(perDefecte.exclosos.map((e) => [e.entrada, e.motiu]), [['index-EntradA1.js', 'massa-vell']]);
});

test('planDeRetencio: un build retingut que importa un tros absent del pool queda fora amb un avís (clausura)', () => {
  const trencat = { ...A, 'XatSection-XatSecA1.js': 'import"./absent-AAAAAAAA.js";import{c_ as a}from"./index-EntradA1.js";' };
  const pla = planDeRetencio({
    manifests: [manifest('index-EntradA1.js', trencat, '2026-11-14T02:00:00.000Z'), manifest('index-EntradB2.js', B, '2026-11-14T04:00:00.000Z')],
    entradaActual: 'index-EntradB2.js', actuals: actualsDe(B), ara: ARA, referencies: referencies(trencat, B)
  });
  assert.deepEqual(pla.retinguts, []);
  assert.deepEqual(pla.copia, []);
  assert.equal(pla.exclosos[0].motiu, 'clausura');
  assert.match(pla.exclosos[0].detall, /absent-AAAAAAAA\.js/);
  // Un fitxer del manifest que ja no és al pool, igual.
  const sensePool = planDeRetencio({
    manifests: [manifest('index-EntradA1.js', A, '2026-11-14T02:00:00.000Z')], entradaActual: 'index-EntradB2.js', actuals: actualsDe(B), ara: ARA,
    referencies: (nom) => (nom === 'send-SendAAA1.js' ? null : referencies(A)(nom))
  });
  assert.deepEqual([sensePool.retinguts.length, sensePool.exclosos[0].motiu], [0, 'falta-al-pool']);
});

test('planDeRetencio: el mateix nom amb un altre SHA-256 que el build actual fa llançar; --retira no copia el tros i el rebut ho diu', () => {
  const colisio = { ...B, 'react-ReactR01.js': 'export const r=2;' };
  assert.throws(() => planDeRetencio({
    manifests: [manifest('index-EntradA1.js', A, '2026-11-14T02:00:00.000Z')], entradaActual: 'index-EntradB2.js', actuals: actualsDe(colisio), ara: ARA, referencies: referencies(A)
  }), /col·lisió.*react-ReactR01\.js/);
  const pla = planDeRetencio({
    manifests: [manifest('index-EntradA1.js', A, '2026-11-14T02:00:00.000Z')], entradaActual: 'index-EntradB2.js', actuals: actualsDe(B), ara: ARA,
    retira: new Set(['XatSection-XatSecA1.js']), referencies: referencies(A)
  });
  assert.deepEqual(pla.copia.map((f) => f.nom).sort(), ['index-EntradA1.js', 'send-SendAAA1.js']);
  assert.deepEqual(pla.retinguts[0].retirats, ['XatSection-XatSecA1.js']);
});

test('arxiva: copia al pool, escriu un manifest sdp.retencio-assets.v1 i és idempotent; la col·lisió avorta sense copiar res', (t) => {
  const arxiu = temporal(t, 'sdp-retencio-arxiu-');
  // Un tros amb empremta que el graf de l'index.html no demana (un retingut d'un incorpora d'abans): no és del build.
  const distA = escriuDist(temporal(t, 'sdp-retencio-distA-'), { ...A, 'vell-VellVel1.js': 'export{}' }, 'index-EntradA1.js');
  const primer = arxiva({ dist: distA, arxiu, creat: new Date('2026-11-14T02:27:52Z'), commit: 'a599251d3+brut' });
  assert.equal(primer.idempotent, false);
  assert.deepEqual(primer.noAbastables, ['vell-VellVel1.js']);
  assert.equal(primer.manifest.schema, ESQUEMA);
  assert.equal(primer.manifest.entrada, 'index-EntradA1.js');
  assert.equal(primer.manifest.creat, '2026-11-14T02:27:52.000Z');
  assert.deepEqual(primer.manifest.fitxers.map((f) => f.nom), Object.keys(A).sort());
  assert.equal(primer.manifest.totalBytes, primer.manifest.fitxers.reduce((s, f) => s + f.bytes, 0));
  assert.match(path.basename(primer.fitxer), /^261114_0327_index-EntradA1\.json$/);
  for (const nom of Object.keys(A)) assert.equal(fs.readFileSync(path.join(arxiu, 'pool', nom), 'utf8'), A[nom]);
  // Ni el PNG de /assets/system ni el SVG sense empremta van al pool.
  assert.deepEqual(fs.readdirSync(path.join(arxiu, 'pool')).sort(), Object.keys(A).sort());
  const segon = arxiva({ dist: distA, arxiu, creat: new Date('2026-11-14T05:00:00Z') });
  assert.equal(segon.idempotent, true);
  assert.equal(fs.readdirSync(path.join(arxiu, 'builds')).length, 1);
  // Un build B amb un React del mateix nom i un altre contingut: avorta abans de copiar res de B.
  const distB = escriuDist(temporal(t, 'sdp-retencio-distB-'), { ...B, 'react-ReactR01.js': 'export const r=2;' }, 'index-EntradB2.js');
  assert.throws(() => arxiva({ dist: distB, arxiu }), /col·lisió.*react-ReactR01\.js/);
  assert.ok(!fs.existsSync(path.join(arxiu, 'pool', 'index-EntradB2.js')));
  assert.equal(fs.readdirSync(path.join(arxiu, 'builds')).length, 1);
});

test('arxiva i incorpora rebutgen els enllaços simbòlics de dist/assets i del pool', (t) => {
  const arxiu = temporal(t, 'sdp-retencio-arxiu-');
  const dist = escriuDist(temporal(t, 'sdp-retencio-dist-'), A, 'index-EntradA1.js');
  const fora = path.join(temporal(t, 'sdp-retencio-fora-'), 'icona.js');
  fs.writeFileSync(fora, 'export{}');
  fs.symlinkSync(fora, path.join(dist, 'assets', 'pin-PinPinA1.js'));
  assert.throws(() => arxiva({ dist, arxiu }), /enllaç simbòlic.*pin-PinPinA1\.js/);
  fs.unlinkSync(path.join(dist, 'assets', 'pin-PinPinA1.js'));
  arxiva({ dist, arxiu, creat: new Date('2026-11-14T02:00:00Z') });
  const distB = escriuDist(temporal(t, 'sdp-retencio-distB-'), B, 'index-EntradB2.js');
  arxiva({ dist: distB, arxiu, creat: new Date('2026-11-14T04:00:00Z') });
  fs.rmSync(path.join(arxiu, 'pool', 'send-SendAAA1.js'));
  fs.symlinkSync(fora, path.join(arxiu, 'pool', 'send-SendAAA1.js'));
  assert.throws(() => incorpora({ dist: distB, arxiu, ara: ARA }), /enllaç simbòlic.*send-SendAAA1\.js/);
});

test('incorpora: exigix el build actual arxivat, copia el build anterior sencer, escriu el rebut a l’arxiu i a dist/ només afig assets/<nom>', (t) => {
  const arxiu = temporal(t, 'sdp-retencio-arxiu-');
  const distA = escriuDist(temporal(t, 'sdp-retencio-distA-'), A, 'index-EntradA1.js');
  const distB = escriuDist(temporal(t, 'sdp-retencio-distB-'), B, 'index-EntradB2.js');
  arxiva({ dist: distA, arxiu, creat: new Date('2026-11-14T02:27:52Z') });
  assert.throws(() => incorpora({ dist: distB, arxiu, ara: ARA }), /arxiva.*abans/);
  arxiva({ dist: distB, arxiu, creat: new Date('2026-11-14T04:00:00Z') });
  const abans = new Set(fs.readdirSync(distB, { recursive: true }));
  const rebut = incorpora({ dist: distB, arxiu, ara: ARA });
  const despres = fs.readdirSync(distB, { recursive: true }).filter((rel) => !abans.has(rel));
  assert.deepEqual(despres.sort(), ['XatSection-XatSecA1.js', 'index-EntradA1.js', 'send-SendAAA1.js'].map((nom) => path.join('assets', nom)));
  assert.deepEqual(rebut.retinguts.map((r) => r.entrada), ['index-EntradA1.js']);
  assert.equal(rebut.copiats, 3);
  assert.ok(fs.readdirSync(path.join(arxiu, 'rebuts')).some((nom) => /_incorpora_index-EntradB2\.json$/.test(nom)));
  for (const nom of Object.keys(A)) assert.equal(fs.readFileSync(path.join(distB, 'assets', nom), 'utf8'), A[nom]);
  // La pestanya del build A troba tot el seu graf al dist/ nou.
  assert.deepEqual(comprovaClausura({ dist: distB, html: fs.readFileSync(path.join(distA, 'index.html'), 'utf8') }).falten, []);
  // Tornar-hi és idempotent: no copia res més ni falla; i arxivar després d'incorpora no fa seus els retinguts.
  assert.equal(incorpora({ dist: distB, arxiu, ara: ARA }).copiats, 0);
  const tornaAArxivar = arxiva({ dist: distB, arxiu });
  assert.deepEqual([tornaAArxivar.idempotent, tornaAArxivar.noAbastables.sort()], [true, ['XatSection-XatSecA1.js', 'index-EntradA1.js', 'send-SendAAA1.js']]);
  // --retira d'un tros del build viu és un error: mai no es trau res del build actual.
  assert.throws(() => incorpora({ dist: distB, arxiu, ara: ARA, retira: ['index-EntradB2.js'] }), /build actual/);
  assert.throws(() => incorpora({ dist: distB, arxiu, ara: ARA, retira: ['../fora.js'] }), /nom amb empremta/);
});

test('incorpora: un fitxer de dist/assets amb el nom d’un retingut i un altre contingut avorta (col·lisió)', (t) => {
  const arxiu = temporal(t, 'sdp-retencio-arxiu-');
  arxiva({ dist: escriuDist(temporal(t, 'sdp-retencio-distA-'), A, 'index-EntradA1.js'), arxiu, creat: new Date('2026-11-14T02:00:00Z') });
  const distB = escriuDist(temporal(t, 'sdp-retencio-distB-'), B, 'index-EntradB2.js');
  arxiva({ dist: distB, arxiu, creat: new Date('2026-11-14T04:00:00Z') });
  fs.writeFileSync(path.join(distB, 'assets', 'send-SendAAA1.js'), 'export const altre=1;');
  assert.throws(() => incorpora({ dist: distB, arxiu, ara: ARA }), /col·lisió.*send-SendAAA1\.js/);
});

test('comprovaClausura: diu cada tros que falta i des d’on es demana', (t) => {
  const dist = escriuDist(temporal(t, 'sdp-retencio-dist-'), B, 'index-EntradB2.js');
  const html = fs.readFileSync(path.join(escriuDist(temporal(t, 'sdp-retencio-distA-'), A, 'index-EntradA1.js'), 'index.html'), 'utf8');
  const res = comprovaClausura({ dist, html });
  assert.deepEqual(res.falten, [{ nom: 'index-EntradA1.js', desDe: 'index.html' }]);
  assert.deepEqual(res.presents, ['react-ReactR01.js']);
  assert.deepEqual(comprovaClausura({ dist, html: fs.readFileSync(path.join(dist, 'index.html'), 'utf8') }).falten, []);
  // Un dist/ incomplet no s'arxiva.
  fs.rmSync(path.join(dist, 'assets', 'send-SendBBB2.js'));
  assert.throws(() => arxiva({ dist, arxiu: temporal(t, 'sdp-retencio-arxiu-') }), /incomplet: falta send-SendBBB2\.js/);
});

test('el desplegament web encadena build → arxiva → incorpora → firebase deploy, amb l’arxiu explícit, i els scripts npm hi són', async () => {
  const paquet = JSON.parse(fs.readFileSync(path.join(ARREL, 'package.json'), 'utf8'));
  assert.equal(paquet.scripts['deploy:arxiva'], 'node tooling/scripts/retencio-assets.mjs arxiva --dist dist');
  assert.equal(paquet.scripts['deploy:retencio'], 'node tooling/scripts/retencio-assets.mjs incorpora --dist dist');
  const publica = await import(new URL('../../scripts/botigues/publica-tot.mjs', import.meta.url));
  const passos = String(publica.ORDRE_WEB).split('&&').map((pas) => pas.trim());
  assert.deepEqual(passos.map((pas) => pas.split(' --')[0]), [
    'npm run build', 'npm run deploy:arxiva', 'npm run deploy:retencio', 'firebase deploy'
  ]);
  // L'arxiu va explícit a les dues passes (cap valor per defecte), és el mateix i és la proposta pendent (D-consola-1).
  const arxius = passos.slice(1, 3).map((pas) => / -- --arxiu (\S+)$/.exec(pas)?.[1]);
  assert.deepEqual(arxius, [publica.ARXIU_RETENCIO_PROPOSAT, publica.ARXIU_RETENCIO_PROPOSAT]);
  assert.equal(publica.ARXIU_RETENCIO_PROPOSAT, '../_builds_de_poble/web_assets_retencio');
  // El pas web del resum en sec és exactament esta ordre.
  assert.match(fs.readFileSync(path.join(ARREL, 'scripts/botigues/publica-tot.mjs'), 'utf8'), /plataforma: 'web',\s*accio: [^\n]+\n\s*ordre: ORDRE_WEB\b/);
});

test('l’ordre: sense --arxiu ix amb 2 i no crea cap carpeta; amb un arxiu inexistent, 2; arxiva+incorpora+comprova de veres', (t) => {
  const base = temporal(t, 'sdp-retencio-ordre-');
  const distA = escriuDist(path.join(base, 'distA'), A, 'index-EntradA1.js');
  const distB = escriuDist(path.join(base, 'distB'), B, 'index-EntradB2.js');
  const abans = fs.readdirSync(base).sort();
  const sense = spawnSync(process.execPath, [ORDRE, 'arxiva', '--dist', distA], { cwd: base, encoding: 'utf8' });
  assert.equal(sense.status, 2, sense.stderr);
  assert.match(sense.stderr, /--arxiu/);
  const inexistent = spawnSync(process.execPath, [ORDRE, 'incorpora', '--dist', distB, '--arxiu', path.join(base, 'no-hi-es')], { cwd: base, encoding: 'utf8' });
  assert.equal(inexistent.status, 2, inexistent.stderr);
  assert.deepEqual(fs.readdirSync(base).sort(), abans);
  assert.equal(spawnSync(process.execPath, [ORDRE, 'desconeguda'], { encoding: 'utf8' }).status, 2);
  const arxiu = path.join(base, 'arxiu');
  fs.mkdirSync(arxiu);
  const ok = (args) => {
    const r = spawnSync(process.execPath, [ORDRE, ...args], { cwd: base, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    return r;
  };
  ok(['arxiva', '--dist', distA, '--arxiu', arxiu, '--creat', '2026-11-14T03:27:52+01:00']);
  ok(['arxiva', '--dist', distB, '--arxiu', arxiu, '--json']);
  const falla = spawnSync(process.execPath, [ORDRE, 'comprova', '--dist', distB, '--html', path.join(distA, 'index.html')], { encoding: 'utf8' });
  assert.equal(falla.status, 1);
  assert.match(falla.stdout + falla.stderr, /index-EntradA1\.js/);
  const json = JSON.parse(ok(['incorpora', '--dist', distB, '--arxiu', arxiu, '--json']).stdout);
  assert.equal(json.copiats, 3);
  ok(['comprova', '--dist', distB, '--html', path.join(distA, 'index.html')]);
  assert.equal(spawnSync(process.execPath, [ORDRE, 'incorpora', '--dist', distB, '--arxiu', arxiu, '--builds', 'zero'], { encoding: 'utf8' }).status, 2);
  assert.equal(spawnSync(process.execPath, [ORDRE, 'arxiva', '--dist', distB, '--arxiu', arxiu, '--creat', '2026-11-14 03:27'], { encoding: 'utf8' }).status, 2);
  // main() també es pot cridar com a funció, sense eixir del procés.
  assert.equal(main(['comprova', '--dist', distB, '--html', path.join(distA, 'index.html')], { out: () => {}, err: () => {} }), 0);
});
