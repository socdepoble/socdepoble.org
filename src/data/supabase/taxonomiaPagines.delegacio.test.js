/* v1.2.26 · #7 P2 (Gauntlet C26-3) · La delegació diferida de supabase/index.js cap a taxonomiaPagines.js captura la
   sessió i una còpia de la configuració abans de l'import(), com delegaCapturat (R32.31). Mateix patró que
   index.r32_31.identity.test.js: sessió real (identitat.js), transport real (runtime.js) i fetch de fixture. */
import { afterEach, expect, test, vi } from 'vitest';
import { configuraBackendSessio, desaSessio, esborraSessio } from '../identitat.js';
import * as backend from './index.js';

const A = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const B = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const CONFIG = Object.freeze({ dataMode: 'remote', supabaseUrl: 'https://taxonomia-diferida.example.test', supabaseAnonKey: 'sb_publishable_synthetic', tenantId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' });
const FILA = { idPagina: 'legal', categoriesSistema: ['Mur'], categoriesTematiques: [], etiquetes: ['Idees'], geografia: {}, mencions: [], versio: 1 };
const cases = [
  ['actualitzaTaxonomiaPagina', config => backend.actualitzaTaxonomiaPagina('legal', { categoriesSistema: ['Mur'], etiquetes: ['Idees'] }, config)],
  ['lligTaxonomiaPagina', config => backend.lligTaxonomiaPagina('legal', config)]
];
let generation = 0;
const entra = (id = A, renovacio = false) => {
  configuraBackendSessio(CONFIG);
  const token = `synthetic-token-${++generation}`;
  expect(desaSessio({ access_token: token, user: { id } }, { renovacio })).toBe(true);
  return token;
};
const transport = () => {
  const fetch = vi.fn(async () => new Response(JSON.stringify(FILA), { headers: { 'Content-Type': 'application/json' } }));
  vi.stubGlobal('fetch', fetch);
  return fetch;
};
afterEach(() => {
  esborraSessio({ abast: 'tot' }); localStorage.clear(); sessionStorage.clear(); vi.unstubAllGlobals();
});

for (const [name, call] of cases) {
  for (const change of ['B', 'logout', 'nova entrada A']) {
    test(`${name}: cap intenció travessa import() després de ${change}`, async () => {
      entra();
      const fetch = transport();
      const pending = call(CONFIG).then(value => ({ value }), error => ({ error }));
      esborraSessio({ abast: 'tot' });
      if (change !== 'logout') entra(change === 'B' ? B : A);
      expect(await pending).toMatchObject({ error: { name: 'AbortError' } });
      expect(fetch).not.toHaveBeenCalled();
    });
  }
  test(`${name}: la renovació del mateix llinatge durant import() es permet i viatja amb el testimoni renovat`, async () => {
    entra();
    const fetch = transport();
    const pending = call(CONFIG);
    const token = entra(A, true);
    expect(await pending).toEqual(FILA);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe(`Bearer ${token}`);
  });
  test(`${name}: la configuració es captura i un senyal cancel·lat no arriba al transport`, async () => {
    entra();
    const fetch = transport(), control = new AbortController();
    const config = { ...CONFIG, signal: control.signal };
    const pending = call(config).then(value => ({ value }), error => ({ error }));
    control.abort();
    // Canviar l'objecte del cridador no pot llevar el senyal de la intenció original.
    config.signal = new AbortController().signal;
    config.supabaseUrl = 'https://altra-taxonomia.example.test';
    expect(await pending).toMatchObject({ error: { name: 'AbortError' } });
    expect(fetch).not.toHaveBeenCalled();
  });
}
