/* P1-20 · D15 (Assalt 10/10, T4a, 261101) · La porta del pressupost del tros
   d'entrada (pressupost-paquet.mjs) sobre dist/ fingits en un mkdtemp: què
   pren de l'HTML, què mesura (gzip -9 de zlib), el sostre opcional de
   l'arrencada i els tres codis d'eixida, també executada com a ordre de
   veres. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SOSTRE_PER_DEFECTE, main, mesura, recursosDArrencada } from './pressupost-paquet.mjs';

const PORTA = fileURLToPath(new URL('./pressupost-paquet.mjs', import.meta.url));
const gz = (bytes) => gzipSync(bytes, { level: 9 }).length;

/* L'index.html que escriu Vite amb manualChunks, retallat: JSON-LD, fonts,
   l'entrada i quatre modulepreload (un amb cometes simples i atributs en un
   altre ordre). */
const HTML = `<!doctype html><html><head>
<link rel="manifest" href="/manifest.webmanifest" />
<link rel="preload" href="/fonts/noto.woff2" as="font" type="font/woff2" crossorigin />
<link rel="stylesheet" href="/fonts/noto-sans.css" />
<script type="application/ld+json">{"@type":"WebSite"}</script>
<script type="module" crossorigin src="/assets/index-AbCd1234.js"></script>
<link rel="modulepreload" crossorigin href="/assets/react-EfGh5678.js">
<link rel="modulepreload" crossorigin href="/assets/estils-IjKl9012.js">
<link crossorigin href='/assets/dompurify-MnOp3456.js' rel='modulepreload'>
<link rel="modulepreload" crossorigin href="/assets/ca-QrSt7890.js">
</head><body><div id="root"></div></body></html>`;

function distDeProva(t, { html = HTML, entrada = Buffer.from('export const a = 1;\n'.repeat(500)), absents = [] } = {}) {
  const dist = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-pressupost-'));
  t.after(() => fs.rmSync(dist, { recursive: true, force: true }));
  fs.mkdirSync(path.join(dist, 'assets'));
  fs.writeFileSync(path.join(dist, 'index.html'), html);
  const fitxers = { 'index-AbCd1234.js': entrada, 'react-EfGh5678.js': 'react', 'estils-IjKl9012.js': 'estils'.repeat(100), 'dompurify-MnOp3456.js': 'purify', 'ca-QrSt7890.js': 'ca' };
  for (const [nom, contingut] of Object.entries(fitxers)) if (!absents.includes(nom)) fs.writeFileSync(path.join(dist, 'assets', nom), contingut);
  return dist;
}

test('el sostre per defecte és el KPI de D15: 250.000 B gzip', () => {
  assert.equal(SOSTRE_PER_DEFECTE, 250000);
});

test("de l'HTML pren l'entrada i els modulepreload, i res més", () => {
  assert.deepEqual(recursosDArrencada(HTML), {
    entrades: ['/assets/index-AbCd1234.js'],
    precarregues: ['/assets/react-EfGh5678.js', '/assets/estils-IjKl9012.js', '/assets/dompurify-MnOp3456.js', '/assets/ca-QrSt7890.js']
  });
  assert.deepEqual(recursosDArrencada('<script src="/a.js"></script><link rel="preload" href="/b.js">'), { entrades: [], precarregues: [] });
});

test('mesura els bytes i el gzip -9 de cada recurs i en suma l’arrencada', (t) => {
  const entrada = Buffer.from('export const a = 1;\n'.repeat(500));
  const r = mesura(distDeProva(t, { entrada }));
  assert.deepEqual(r.entrada, { recurs: '/assets/index-AbCd1234.js', bytes: entrada.length, gzip: gz(entrada) });
  assert.equal(r.precarregues.length, 4);
  assert.equal(r.arrencada.fitxers, 5);
  assert.equal(r.arrencada.bytes, entrada.length + 5 + 600 + 6 + 2);
  assert.equal(r.arrencada.gzip, [entrada, 'react', 'estils'.repeat(100), 'purify', 'ca'].reduce((s, b) => s + gz(Buffer.from(b)), 0));
  assert.equal(r.dinsDelSostre, true);
  // Sense --sostre-arrencada, l'arrencada s'informa però no té sostre.
  assert.equal(r.sostreArrencada, null);
  assert.equal(r.arrencadaDinsDelSostre, true);
});

test('una entrada que passa del sostre fa caure la porta (codi 1) i diu en quant', (t) => {
  // Bytes aleatoris: gzip no els pot comprimir, i 260.000 passen dels 250.000.
  const dist = distDeProva(t, { entrada: randomBytes(260000) });
  const eixida = [];
  const errors = [];
  assert.equal(main(['--dist', dist], { out: (l) => eixida.push(l), err: (l) => errors.push(l) }), 1);
  assert.match(eixida[0], /Entrada \/assets\/index-AbCd1234\.js: 260000 B, \d+ B gzip -9 \(sostre 250000 B\)/);
  assert.match(errors.join('\n'), /passa del sostre en \d+ B gzip -9/);
  // El mateix dist/ amb un sostre més alt passa.
  assert.equal(main(['--dist', dist, '--sostre', '300000'], { out: () => {}, err: () => {} }), 0);
});

test('ús i dist/ incomplet: codi 2, sense mesurar', (t) => {
  const silenci = { out: () => {}, err: () => {} };
  const buit = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-pressupost-buit-'));
  t.after(() => fs.rmSync(buit, { recursive: true, force: true }));
  assert.equal(main(['--dist', buit], silenci), 2, 'sense index.html');
  assert.equal(main(['--dist', distDeProva(t, { absents: ['ca-QrSt7890.js'] })], silenci), 2, 'un modulepreload absent');
  assert.equal(main(['--dist', distDeProva(t, { html: HTML.replace('<script type="module"', '<script type="module" src="/assets/ca-QrSt7890.js"></script><script type="module"') })], silenci), 2, 'dues entrades');
  assert.equal(main(['--dist', distDeProva(t, { html: HTML.replace('/assets/react-EfGh5678.js', '/../../etc/passwd') })], silenci), 2, 'fora de dist/');
  assert.equal(main(['--dist', distDeProva(t, { html: HTML.replace('/assets/react-EfGh5678.js', 'https://cdn.example/react.js') })], silenci), 2, "d'un altre origen");
  assert.equal(main(['--dist', distDeProva(t, { html: HTML.replace('/assets/react-EfGh5678.js', '/assets/%E0%A4%A.js') })], silenci), 2, 'mal codificat');
  assert.equal(main(['--sostre', 'molt'], silenci), 2, 'sostre no numèric');
  assert.equal(main(['--sostre-arrencada', '-1'], silenci), 2, "sostre d'arrencada no numèric");
  assert.equal(main(['--bundle'], silenci), 2, 'opció desconeguda');
});

test('un error de lectura del dist/ és 2, mai 1 (el codi de «passa del sostre»)', (t) => {
  // index.html que és una carpeta: readFileSync llança EISDIR, que no és cap ErrorDUs.
  const dist = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-pressupost-eisdir-'));
  t.after(() => fs.rmSync(dist, { recursive: true, force: true }));
  fs.mkdirSync(path.join(dist, 'index.html'));
  const errors = [];
  assert.equal(main(['--dist', dist], { out: () => {}, err: (l) => errors.push(l) }), 2);
  assert.match(errors.join('\n'), /no s'ha pogut llegir el dist\/: .*EISDIR/);
  const ordre = spawnSync(process.execPath, [PORTA, '--dist', dist], { encoding: 'utf8' });
  assert.equal(ordre.status, 2, ordre.stderr);
});

test("el sostre de l'arrencada és opcional i, si se'n dona un, també fa caure la porta", (t) => {
  const dist = distDeProva(t);
  const { arrencada } = mesura(dist);
  const eixida = [];
  const errors = [];
  const codi = main(['--dist', dist, '--sostre-arrencada', String(arrencada.gzip - 1)], { out: (l) => eixida.push(l), err: (l) => errors.push(l) });
  assert.equal(codi, 1);
  assert.match(eixida[1], new RegExp(`${arrencada.gzip} B gzip -9 \\(sostre ${arrencada.gzip - 1} B\\)`));
  assert.match(errors.join('\n'), /L'arrencada estàtica passa del sostre en 1 B gzip -9/);
  // L'entrada continua dins del seu: només ha caigut el de l'arrencada.
  assert.doesNotMatch(errors.join('\n'), /L'entrada passa del sostre/);
  assert.equal(main(['--dist', dist, '--sostre-arrencada', String(arrencada.gzip)], { out: () => {}, err: () => {} }), 0);
  const informe = mesura(dist, { sostreArrencada: arrencada.gzip - 1 });
  assert.equal(informe.sostreArrencada, arrencada.gzip - 1);
  assert.equal(informe.arrencadaDinsDelSostre, false);
  assert.equal(informe.dinsDelSostre, true);
});

test('com a ordre de veres: el codi d’eixida del procés és el de la porta, i --json és llegible', (t) => {
  const dist = distDeProva(t);
  const bo = spawnSync(process.execPath, [PORTA, '--dist', dist, '--json'], { encoding: 'utf8' });
  assert.equal(bo.status, 0, bo.stderr);
  const informe = JSON.parse(bo.stdout);
  assert.equal(informe.sostre, 250000);
  assert.equal(informe.dinsDelSostre, true);
  assert.equal(informe.arrencada.fitxers, 5);
  const massa = spawnSync(process.execPath, [PORTA, '--dist', dist, '--sostre', '10'], { encoding: 'utf8' });
  assert.equal(massa.status, 1);
  assert.match(massa.stderr, /passa del sostre/);
  const sense = spawnSync(process.execPath, [PORTA, '--dist', path.join(dist, 'no-hi-es')], { encoding: 'utf8' });
  assert.equal(sense.status, 2);
  assert.match(sense.stderr, /cal fer abans el build/);
});
