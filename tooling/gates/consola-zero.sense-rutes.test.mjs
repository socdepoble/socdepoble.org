/* R24 · Gauntlet Loop, ronda 2 (G-client-9) · Prova de regressió permanent · Consola Zero amb fixtures CDP.
   1) Les quatre menes que l'ordre demana que facen fallar (console.warn,
      pageerror, unhandledrejection, 404 del mateix origen): ha de caure cadascuna.
   2) Un informe sense cap ruta visitada no pot ser «verd» (codi 0): una porta
      que no ha mirat res no certifica res. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classificaEsdeveniment, classificaFallada, classificaResposta, codiDEixida, resumeix } from './consola-zero-nucli.mjs';

const ORIGEN = 'http://127.0.0.1:4173';

test('sobreviu · console.warn, pageerror, unhandledrejection i 404 del mateix origen fan fallar', () => {
  const avis = classificaEsdeveniment({ method: 'Runtime.consoleAPICalled', params: { type: 'warning', args: [{ type: 'string', value: 'compte' }] } });
  const pageerror = classificaEsdeveniment({ method: 'Runtime.exceptionThrown', params: { exceptionDetails: { text: 'Uncaught', exception: { description: 'TypeError: x is undefined' } } } });
  const rebuig = classificaEsdeveniment({ method: 'Runtime.exceptionThrown', params: { exceptionDetails: { text: 'Uncaught (in promise)', exception: { description: 'Error: no' } } } });
  const assert1 = classificaEsdeveniment({ method: 'Runtime.consoleAPICalled', params: { type: 'assert', args: [] } });
  const r404 = classificaResposta({ url: `${ORIGEN}/assets/x-AbCdEf12.js`, estat: 404, iniciador: { type: 'parser', url: 'about:client' } }, { origen: ORIGEN });
  const xarxa = classificaFallada({ url: `${ORIGEN}/manifest.webmanifest`, error: 'net::ERR_FAILED' }, { origen: ORIGEN });
  for (const t of [avis, pageerror, rebuig, assert1, r404, xarxa]) assert.equal(t?.falla, true, JSON.stringify(t));
  assert.equal(r404.iniciador, 'modulepreload');
  // Un 404 d'un altre origen no és del build: s'anota però no falla.
  assert.equal(classificaResposta({ url: 'https://exemple.org/x.js', estat: 404 }, { origen: ORIGEN }), null);
});

test('G-client-9 · un informe que no ha visitat cap ruta no és verd', () => {
  for (const informe of [
    { escenaris: {}, troballesGlobals: [] },
    { escenaris: { rutes: [], interna: [] }, troballesGlobals: [] }
  ]) {
    assert.notEqual(codiDEixida(informe), 0, `${JSON.stringify(informe)} → ${resumeix(informe).text}`);
    assert.equal(codiDEixida(informe), 2, 'no haver mirat res és un error d’ús o d’infraestructura');
    assert.equal(resumeix(informe).verd, false);
    assert.match(resumeix(informe).text, /cap ruta visitada/);
  }
  /* Només la interna, o només el desfasament executat i verd: sí que han mirat alguna cosa. */
  assert.equal(codiDEixida({ escenaris: { interna: [{ ruta: '/xat', troballes: [] }] }, troballesGlobals: [] }), 0);
  assert.equal(codiDEixida({ escenaris: { skew: { veredicte: 'verd' } }, troballesGlobals: [] }), 0);
});

test('G-client-9 · --escenaris o --rutes buits després del filtre són un error d’ús (codi 2), abans de construir res', async (t) => {
  const { main } = await import('./consola-zero.mjs');
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-consola-zero-us-'));
  t.after(() => fs.rmSync(scratch, { recursive: true, force: true }));
  const errors = [];
  const original = process.stderr.write;
  process.stderr.write = (text) => { errors.push(String(text)); return true; };
  try {
    assert.equal(await main(['--scratch', scratch, '--escenaris', ',']), 2);
    assert.equal(await main(['--scratch', scratch, '--escenaris', ' , ']), 2);
    assert.equal(await main(['--scratch', scratch, '--rutes', ',']), 2);
  } finally {
    process.stderr.write = original;
  }
  assert.equal(errors.length, 3, errors.join(''));
  assert.match(errors[0], /--escenaris/);
  assert.match(errors[2], /--rutes/);
  /* Cap mkdtemp de l'arnés (consola-zero-*) dins de --scratch: s'ha aturat en l'ús. */
  assert.deepEqual(fs.readdirSync(scratch), []);
});
