import { test } from 'node:test';
import assert from 'node:assert/strict';

import configDeVite from '../vite.config.js';

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
