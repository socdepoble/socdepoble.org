/**
 * v1.2.17 · Gauntlet R1 (L2-01) · El bucle del rellotge avançat amb les peces reals: runtime.js
 * (request i el preflight), auth.js (refreshSession, renova, emetCanvi) i identitat.js (desaSessio,
 * versioSessio, caducitatJwt). Només la xarxa és falsa. Un GoTrue en hora que torna tokens que,
 * per al rellotge del client (59 min o més avançat), ja naixen dins del marge o caducats; i un
 * oient de sdp:auth-change que recarrega, com fa sincronitza amb els proveïdors. Abans, cada
 * recàrrega tornava a renovar i cada renovació tornava a avisar: un bucle contra GoTrue.
 */
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { configuraBackendSessio, desaSessio, esborraSessio, versioSessio } from '../identitat.js';
import { request } from './runtime.js';
import './auth.js';

const A = '11111111-2222-4333-8444-555555555555';
const CONFIG = Object.freeze({ supabaseUrl: 'https://backend.example.test', supabaseAnonKey: 'sb_publishable_synthetic' });
const b64u = (o) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
let nonce = 0;
/* JWT sintètic sense signatura; el nonce fa cada token diferent dins del mateix segon. */
const jwt = (segons) => `${b64u({ alg: 'none' })}.${b64u({ sub: A, n: ++nonce, exp: Math.floor(Date.now() / 1000) + segons })}.c2ln`;
const RUTA_RENOVACIO = '/auth/v1/token?grant_type=refresh_token';
const reposa = () => new Promise((r) => setTimeout(r, 30));

let xarxa;
let oient;
beforeEach(() => { configuraBackendSessio(CONFIG); });
afterEach(() => {
  if (oient) window.removeEventListener('sdp:auth-change', oient);
  oient = null;
  vi.unstubAllGlobals();
  esborraSessio({ abast: 'tot' });
  window.sessionStorage.clear(); window.localStorage.clear();
});

/* GoTrue en hora: cada renovació torna un token nou que el client veu amb `segons` de vida. */
function servidor(segons) {
  const emesos = [];
  xarxa = vi.fn(async (url, opcions) => {
    if (String(url).endsWith(RUTA_RENOVACIO)) {
      const access_token = jwt(segons);
      emesos.push(access_token);
      return { ok: true, status: 200, json: async () => ({ access_token, refresh_token: `r${emesos.length + 1}`, user: { id: A } }) };
    }
    return { ok: true, status: 200, text: async () => '', json: async () => ({ ok: true, auth: opcions.headers.Authorization }), headers: { get: () => null } };
  });
  vi.stubGlobal('fetch', xarxa);
  return emesos;
}
const renovacions = () => xarxa.mock.calls.filter(([url]) => String(url).endsWith(RUTA_RENOVACIO)).length;
const autoritzacionsRest = () => xarxa.mock.calls.filter(([url]) => !String(url).endsWith(RUTA_RENOVACIO)).map(([, o]) => o.headers.Authorization);

/* Gauntlet R2 (L2R2-02) · El preflight només mira el token ja caducat. */
test.each([['ja caducat', -10], ['caducat de fa una hora', -3600]])('v1.2.17 · Gauntlet R1 (L2-01) · rellotge avançat, el token nou naix %s: una sola renovació i el bucle avís → recàrrega → renovació s’atura', async (_cas, segons) => {
  const emesos = servidor(segons);
  expect(desaSessio({ access_token: jwt(segons), refresh_token: 'r1', user: { id: A } })).toBe(true);
  const epoca = versioSessio;
  let avisos = 0;
  /* La recàrrega de sincronitza; el límit només evita penjar la prova si el bucle tornara. */
  oient = () => { if (++avisos <= 20) void request('/rest/v1/app_content', CONFIG).catch(() => {}); };
  window.addEventListener('sdp:auth-change', oient);
  expect(await request('/rest/v1/a', CONFIG)).toMatchObject({ ok: true });
  await reposa();
  for (const t of ['b', 'c', 'd']) await request(`/rest/v1/${t}`, CONFIG);
  await reposa();
  expect(renovacions()).toBe(1);
  expect(avisos).toBe(1);
  // La guarda C14 amb el desaSessio de veres: la renovació preventiva puja l'època una sola vegada.
  expect(versioSessio).toBe(epoca + 1);
  expect(autoritzacionsRest()).toEqual(Array(5).fill(`Bearer ${emesos[0]}`));
});
