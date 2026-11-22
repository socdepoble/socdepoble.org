import { afterEach, expect, test, vi } from 'vitest';
import { configuraBackendSessio, desaSessio, esborraSessio } from '../identitat.js';
import { preparaSincronitzacioCrdtRural, estatCrdtRuralBuit } from '../crdtRural.js';
import * as backend from './index.js';

const A = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const B = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const ID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const CONFIG = Object.freeze({ dataMode: 'remote', supabaseUrl: 'https://lazy-autopsy.example.test', supabaseAnonKey: 'sb_publishable_synthetic', tenantId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' });
const capture = preparaSincronitzacioCrdtRural(estatCrdtRuralBuit(), 'snapshot');
const cases = [
  ['confirmaCapturaCrdtRural', capture, { requestId: capture.requestId, sha256: capture.sha256, frontera: capture.frontera, confirmatEl: '2026-11-21T19:00:00.000Z', ack_remot_confirmat: true }],
  ['registraDenunciaDiligent', { publicacioId: ID, motiu: 'altre', detall: 'Intenció A de fixture', operacioId: ID }, { id: ID, estat: 'rebuda', versio: 1, repetida: false }],
  ['revisaDenunciaDiligent', { id: ID, estatEsperat: 'rebuda', versio: 1, estat: 'en_revisio', justificacio: 'Revisió A de fixture', operacioId: ID }, { id: ID, estat: 'en_revisio', versio: 2, repetida: false }],
  ['llistaDenunciesDiligents', {}, []],
];
let generation = 0;
const entra = (id = A, renovacio = false) => {
  configuraBackendSessio(CONFIG);
  const token = `synthetic-token-${++generation}`;
  expect(desaSessio({ access_token: token, user: { id } }, { renovacio })).toBe(true);
  return token;
};
const transport = value => {
  const fetch = vi.fn(async () => new Response(JSON.stringify(value), { headers: { 'Content-Type': 'application/json' } }));
  vi.stubGlobal('fetch', fetch);
  return fetch;
};
afterEach(() => {
  esborraSessio({ abast: 'tot' }); localStorage.clear(); sessionStorage.clear(); vi.unstubAllGlobals();
});

for (const [name, input, reply] of cases) {
  for (const change of ['B', 'logout', 'nova entrada A']) {
    test(`R32.31 · ${name}: cap intenció travessa import() després de ${change}`, async () => {
      entra();
      const fetch = transport(reply);
      // El yield és l’import real, també quan el mòdul ja està en memòria.
      const pending = backend[name](input, CONFIG).then(value => ({ value }), error => ({ error }));
      esborraSessio({ abast: 'tot' });
      if (change !== 'logout') entra(change === 'B' ? B : A);
      expect(await pending).toMatchObject({ error: { name: 'AbortError' } });
      expect(fetch).not.toHaveBeenCalled();
    });
  }
  test(`R32.31 · ${name}: renovació del mateix llinatge durant import() permesa`, async () => {
    entra();
    const fetch = transport(reply);
    const pending = backend[name](input, CONFIG);
    const token = entra(A, true);
    await pending;
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe(`Bearer ${token}`);
  });
  test(`R32.31 · ${name}: config capturada i senyal cancel·lat abans de transport`, async () => {
    entra();
    const fetch = transport(reply), control = new AbortController();
    const config = { ...CONFIG, signal: control.signal };
    const pending = backend[name](input, config).then(value => ({ value }), error => ({ error }));
    control.abort();
    // Canviar l’objecte del cridador no pot llevar el senyal de la intenció original.
    config.signal = new AbortController().signal;
    config.supabaseUrl = 'https://other-lazy.example.test';
    expect(await pending).toMatchObject({ error: { name: 'AbortError' } });
    expect(fetch).not.toHaveBeenCalled();
  });
}
