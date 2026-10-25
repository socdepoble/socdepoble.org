import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import configDeVite, * as modulDeVite from '../vite.config.js';

/* T13 · L'empremta de src/config/dataMode.js és del PROCÉS `vite`. Els reinicis
   que Vite fa sol (canvis a vite.config.js, a les seues dependències de tooling/
   o a .env) tornen a avaluar el config i no l'han de canviar: si canviara, cada
   edició d'un altre agent tornaria el Mestre a la llavor i li tancaria la sessió.
   L'única excepció és un canvi de VITE_DATA_MODE, que sí que és començar de nou. */
test('T13 · l’empremta de desenvolupament sobreviu a reavaluar el config i no existix en preview', () => {
  const claus = ['VITE_SDP_SERVIDOR_DEV', 'SDP_DADES_DEV', 'VITE_DATA_MODE'];
  const abans = Object.fromEntries(claus.map((k) => [k, process.env[k]]));
  try {
    for (const k of claus) delete process.env[k];
    configDeVite({ command: 'serve', mode: 'development', isPreview: true });
    assert.equal(process.env.VITE_SDP_SERVIDOR_DEV, undefined);
    configDeVite({ command: 'serve', mode: 'development', isPreview: false });
    assert.match(process.env.VITE_SDP_SERVIDOR_DEV, /^dev-\d+-[a-z0-9]+$/);
    // Un reinici dins del mateix procés: el config es torna a avaluar i l'empremta no canvia.
    process.env.VITE_SDP_SERVIDOR_DEV = 'dev-1-mateix-proces';
    configDeVite({ command: 'serve', mode: 'development', isPreview: false });
    assert.equal(process.env.VITE_SDP_SERVIDOR_DEV, 'dev-1-mateix-proces');
    // Canviar el mode de dades demanat sí que renova l'empremta.
    process.env.VITE_DATA_MODE = process.env.SDP_DADES_DEV === 'remote' ? 'seed' : 'remote';
    configDeVite({ command: 'serve', mode: 'development', isPreview: false });
    assert.notEqual(process.env.VITE_SDP_SERVIDOR_DEV, 'dev-1-mateix-proces');
  } finally {
    for (const k of claus) {
      if (abans[k] === undefined) delete process.env[k];
      else process.env[k] = abans[k];
    }
  }
});

/* El servidor de desenvolupament escolta a la xarxa local (host:true) i servix
   l'arrel: el 260929 donava un 200 per a .sdp-reflex/secret.key. */
test('el servidor de desenvolupament no servix mai l’estat local ni les sessions d’eines', () => {
  const claus = ['VITE_SDP_SERVIDOR_DEV', 'SDP_DADES_DEV'];
  const abans = Object.fromEntries(claus.map((k) => [k, process.env[k]]));
  try {
    const { deny } = configDeVite({ command: 'serve', mode: 'development', isPreview: false }).server.fs;
    for (const patro of ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/.sdp-reflex/**', '**/.sdp-paperera/**',
      '**/.immunitari/**', '**/.iaia_auth/**', '**/.wwebjs_auth/**', '**/.claude/**', '**/.codex/**']) {
      assert.ok(deny.includes(patro), `falta ${patro} a server.fs.deny`);
    }
  } finally {
    for (const k of claus) {
      if (abans[k] === undefined) delete process.env[k];
      else process.env[k] = abans[k];
    }
  }
});

/* Notes (261025) · Un sol React a la pàgina depén de dues coses: que cap àlies
   salte el mapa `exports` de react i react-dom, i que cap altra arrel (una còpia
   de treball amb node_modules enllaçat, o una que arranque Vite amb un altre
   config) no puga reescriure la memòria cau de Vite del servidor viu. */
const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const configServe = () => configDeVite({ command: 'serve', mode: 'development', isPreview: true });

const IMPORTS_DE_REACT = ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client', 'react-dom/server'];

test('Notes · react i react-dom es resolen pel mapa exports: cap àlies a un camí absolut', () => {
  const { alias, dedupe } = configServe().resolve;
  const finds = Array.isArray(alias) ? alias.map((a) => a.find) : Object.keys(alias);
  for (const find of finds) {
    // Com Vite: un text tapa l'import igual o el que comença per «text/»; una RegExp, el que casa.
    const tapats = IMPORTS_DE_REACT.filter((imp) => (find instanceof RegExp
      ? imp.search(find) !== -1
      : imp === find || imp.startsWith(`${find}/`)));
    assert.deepEqual(tapats, [],
      `àlies «${find}»: amb un camí absolut, react-dom/server pren al navegador la versió de Node`);
  }
  assert.deepEqual([...dedupe].sort(), ['react', 'react-dom']);
});

test('Notes · el config fa servir la memòria cau de la seua arrel', () => {
  assert.equal(typeof modulDeVite.cacheDirPropi, 'function', 'vite.config.js ha d’exportar cacheDirPropi');
  assert.equal(configServe().cacheDir, modulDeVite.cacheDirPropi(ARREL));
});

test('Notes · cap còpia comparteix la memòria cau del viu ni hi escriu dins', (t) => {
  const { cacheDirPropi } = modulDeVite;
  assert.equal(typeof cacheDirPropi, 'function', 'vite.config.js ha d’exportar cacheDirPropi');
  const tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-cau-')));
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
  const viu = path.join(tmp, 'viu');
  const enllacada = path.join(tmp, 'copia-enllacada'); // node_modules enllaçat sencer al viu
  const mixta = path.join(tmp, 'copia-mixta'); // node_modules propi, però .vite enllaçat al del viu
  fs.mkdirSync(path.join(viu, 'node_modules', '.vite'), { recursive: true });
  fs.mkdirSync(enllacada);
  fs.symlinkSync(path.join(viu, 'node_modules'), path.join(enllacada, 'node_modules'));
  fs.mkdirSync(path.join(mixta, 'node_modules'), { recursive: true });
  fs.symlinkSync(path.join(viu, 'node_modules', '.vite'), path.join(mixta, 'node_modules', '.vite'));

  const cauViva = cacheDirPropi(viu, tmp);
  assert.match(path.relative(path.join(viu, 'node_modules', '.vite'), cauViva), /^[0-9a-f]{12}$/,
    'la del viu és una subcarpeta amb empremta, mai node_modules/.vite, deps ni vitest');
  assert.equal(cacheDirPropi(viu, tmp), cauViva, 'estable entre reinicis');
  for (const copia of [enllacada, mixta]) {
    const cau = cacheDirPropi(copia, tmp);
    assert.ok(!cau.startsWith(viu + path.sep), `${path.basename(copia)}: escriu dins de l’arbre viu (${cau})`);
    assert.equal(path.dirname(cau), path.join(tmp, 'sdp-vite-cache'));
  }
  assert.notEqual(cacheDirPropi(enllacada, tmp), cacheDirPropi(mixta, tmp), 'cada arrel, la seua');
});
