/* Onada R24 · Consola Zero (P-B de l'informe 261114 «consola_404_chunks») ·
   Trinquet del contracte de memòria cau de Firebase Hosting, avaluat com el
   servix Hosting (totes les regles que casen; per a la mateixa clau, l'última)
   i no com a text de firebase.json:
     · index.html, les rutes de l'SPA, sw.js i el manifest: no-cache (cap
       navegador no fixa un HTML vell que demane trossos retirats);
     · els recursos amb empremta de l'arrel d'/assets: immutable;
     · res de dins d'/assets/system (ni cap subcarpeta d'/assets) és immutable:
       són còpies de public/assets amb nom estable;
     · la reescriptura de l'SPA no cobrix /assets: un tros que falta és un 404
       de veritat, mai l'index.html amb 200 (error de MIME).
   En producció ja es complix (curl del 14-11, §7 de l'informe): la prova no
   ha de fallar hui. Que no és buida ho diuen els mutants de baix: cada canvi
   que trencaria el contracte la fa caure. Cap xarxa. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { capcaleresEfectives, reescripturaDe } from '../tooling/gates/consola-zero-nucli.mjs';

const ARREL = fileURLToPath(new URL('..', import.meta.url));
const HOSTING = JSON.parse(fs.readFileSync(path.join(ARREL, 'firebase.json'), 'utf8')).hosting;
const IMMUTABLE = 'public, max-age=31536000, immutable';

const SENSE_MEMORIA = ['/', '/index.html', '/xat', '/mur/la-veu-de-soc-de-poble', '/page/descarregues', '/sw.js', '/manifest.webmanifest'];
const AMB_EMPREMTA = ['/assets/x-AbCdEf12.js', '/assets/index-BxDhPh_v.js', '/assets/plus-BdnY3z-k.js', '/assets/estils-AbCdEf12.css',
  '/assets/noto-AbCdEf12.woff2', '/assets/modul-AbCdEf12.mjs'];
const NO_IMMUTABLES = ['/assets/system/ui/logo.png', '/assets/system/ui/x-AbCdEf12.js', '/assets/og/mur-AbCdEf12.png', '/assets/llicencia.svg',
  '/assets/x-AbCdEf1.js', '/assets/x-AbCdEf12.png', '/sw.js', '/index.html'];

const cacheDe = (hosting, cami) => capcaleresEfectives(hosting, cami)['cache-control']?.valor ?? null;

/** Les violacions del contracte de memòria cau d'una configuració de Hosting. */
function violacionsDeCache(hosting) {
  const v = [];
  for (const cami of SENSE_MEMORIA) if (cacheDe(hosting, cami) !== 'no-cache') v.push(`${cami}: ${cacheDe(hosting, cami)} (cal no-cache)`);
  for (const cami of AMB_EMPREMTA) if (cacheDe(hosting, cami) !== IMMUTABLE) v.push(`${cami}: ${cacheDe(hosting, cami)} (cal immutable)`);
  for (const cami of NO_IMMUTABLES) if (/immutable/.test(cacheDe(hosting, cami) ?? '')) v.push(`${cami}: immutable sense empremta`);
  for (const cami of ['/xat', '/', '/no-existix', '/el-meu-perfil']) if (reescripturaDe(hosting, cami) !== '/index.html') v.push(`${cami}: sense reescriptura a /index.html`);
  for (const cami of [...AMB_EMPREMTA, '/assets/send-Cok00000.js', '/assets/system/ui/logo.png', '/fonts/noto-sans.css']) {
    if (reescripturaDe(hosting, cami) !== null) v.push(`${cami}: reescrit a ${reescripturaDe(hosting, cami)} (un tros que falta ha de ser 404)`);
  }
  return v;
}

test('firebase.json complix el contracte de memòria cau: no-cache, immutable només amb empremta i cap reescriptura d’/assets', () => {
  assert.deepEqual(violacionsDeCache(HOSTING), []);
});

test('cap memòria cau negativa: cap regla dona memòria a un tros que no existix, i l’SW de juny (/service-worker.js) és no-cache', () => {
  // Un nom que no és al build no casa amb la regla d'immutable ni amb cap altra: el 404 porta el no-cache de Firebase (curl, §8.3).
  assert.equal(cacheDe(HOSTING, '/assets/no-existix.js'), null);
  assert.equal(cacheDe(HOSTING, '/service-worker.js'), 'no-cache');
});

/* Els mutants: cada un trenca una part del contracte i la guarda l'ha de veure. */
const clona = () => structuredClone(HOSTING);
const MUTANTS = [
  ['sense la regla d’immutable', (h) => { h.headers = h.headers.filter((r) => !(r.regex || '').startsWith('^/assets/')); }],
  ['immutable a tot /assets/**', (h) => { h.headers.push({ source: '/assets/**', headers: [{ key: 'Cache-Control', value: IMMUTABLE }] }); }],
  ['sense no-cache a l’HTML', (h) => { h.headers = h.headers.filter((r) => r.source !== '!/@(assets|fonts)/**'); }],
  ['memòria llarga a sw.js', (h) => { h.headers.push({ source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }] }); }],
  ['reescriptura de l’SPA també per a /assets', (h) => { h.rewrites[h.rewrites.length - 1] = { source: '**', destination: '/index.html' }; }],
  ['regex d’immutable sense l’arrel', (h) => { const r = h.headers.find((x) => (x.regex || '').startsWith('^/assets/')); r.regex = '^/assets/.+-[A-Za-z0-9_-]{8}\\.(js|mjs|css|woff2?|png)$'; }]
];
for (const [nom, muta] of MUTANTS) {
  test(`mutant: ${nom} → la guarda cau`, () => {
    const h = clona();
    muta(h);
    assert.notDeepEqual(violacionsDeCache(h), [], nom);
  });
}
