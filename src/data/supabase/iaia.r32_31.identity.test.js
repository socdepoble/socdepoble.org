import { afterEach, expect, test, vi } from 'vitest';
import { configuraBackendSessio, desaSessio, esborraSessio } from '../identitat.js';
import { consultaIAIA } from './iaia.js';
import { resetClient } from './config.js';

const A = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const B = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const REQUEST = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const CONFIG = Object.freeze({ dataMode: 'remote', supabaseUrl: 'https://iaia-autopsy.example.test', supabaseAnonKey: 'sb_publishable_synthetic', tenantId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' });
const INPUT = Object.freeze({ mode: 'direct', requestId: REQUEST, question: 'Pregunta privada de la fixture' });
const ANSWER = Object.freeze({ source: 'model', inference: true, requestId: REQUEST, text: 'Resposta privada de la fixture A' });
const barrera = () => {
  let resolve;
  const promise = new Promise(r => { resolve = r; });
  return { promise, resolve };
};
let generation = 0;
const entra = (id = A, renovacio = false) => {
  configuraBackendSessio(CONFIG);
  expect(desaSessio({ access_token: `synthetic-token-${++generation}`, user: { id } }, { renovacio })).toBe(true);
};
afterEach(() => {
  resetClient(); esborraSessio({ abast: 'tot' });
  sessionStorage.clear(); localStorage.clear(); vi.unstubAllGlobals();
});

for (const canvi of ['B', 'eixida', 'nova entrada A']) {
  test(`R32.31 · SDK real IAIA descarta la resposta després de ${canvi}`, async () => {
    entra();
    const dins = barrera(), resposta = barrera();
    const fetch = vi.fn((_url, options) => { dins.resolve(options); return resposta.promise; });
    vi.stubGlobal('fetch', fetch);
    const consulta = consultaIAIA(INPUT, CONFIG).then(value => ({ value }), error => ({ error }));
    const transport = await dins.promise;
    expect(transport.headers.get('Authorization')).toMatch(/^Bearer synthetic-token-/);
    esborraSessio({ abast: 'tot' });
    if (canvi !== 'eixida') entra(canvi === 'B' ? B : A);
    resposta.resolve(new Response(JSON.stringify(ANSWER), { headers: { 'Content-Type': 'application/json' } }));
    expect(await consulta).toMatchObject({ error: { name: 'AbortError' } });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
}

test('R32.31 · SDK real IAIA conserva resposta legítima durant renovació del mateix llinatge', async () => {
  entra();
  const dins = barrera(), resposta = barrera();
  vi.stubGlobal('fetch', vi.fn(() => { dins.resolve(); return resposta.promise; }));
  const consulta = consultaIAIA(INPUT, CONFIG);
  await dins.promise;
  entra(A, true);
  resposta.resolve(new Response(JSON.stringify(ANSWER), { headers: { 'Content-Type': 'application/json' } }));
  await expect(consulta).resolves.toEqual(ANSWER);
});
