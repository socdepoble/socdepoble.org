/**
 * Gauntlet 261016_1530 (Bloc 3.6.4; F66) · sessionService amb la sessió pilot
 * local: la cadena real (sessionService → identitat → sessioPilot), amb el
 * port fals de RequireAuth.test.jsx. La sessió pilot no té cap servidor a qui
 * preguntar el rol: és 'usuari' i el port no es crida. Contrast: una sessió de
 * veres en el mateix backend sí que el pregunta.
 */
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ rol: vi.fn(async () => 'superadmin') }));
vi.mock('./backendPort.js', async () => {
  const identitat = await import('./identitat.js');
  return {
    getCurrentUser: () => identitat.usuariDeSessio(),
    teCapacitat: () => true,
    elMeuRol: (...args) => m.rol(...args),
    refrescaSessio: vi.fn(async () => false),
    logout: vi.fn(async () => undefined)
  };
});
vi.mock('../host.js', () => ({ quanLlest: async () => undefined }));
import { getSessionState, setSessionConfig } from './sessionService.js';
import { desaSessio, esborraSessio } from './identitat.js';
import { entraComAPilot } from './sessioPilot.js';
import { PERSONA_PILOT } from './identitatsSeed.js';

const LLAVOR = Object.freeze({
  supabaseUrl: 'http://127.0.0.1:54321', supabaseAnonKey: 'sb_publishable_prova_pilot',
  tenantId: '00000000-0000-4000-8000-0000000000f6', dataMode: 'seed'
});
const b64u = (o) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const jwtDeVeres = (sub) => `${b64u({ alg: 'none' })}.${b64u({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })}.c2ln`;

let allibera = () => {};
let xarxa;
beforeEach(async () => {
  xarxa = vi.fn(async () => { throw new TypeError('Failed to fetch'); });
  vi.stubGlobal('fetch', xarxa);
  m.rol.mockClear();
  esborraSessio({ abast: 'tot' });
  allibera = setSessionConfig(LLAVOR);
  await vi.waitFor(() => expect(getSessionState().estat).toBe('fora'));
});
afterEach(() => {
  allibera();
  esborraSessio({ abast: 'tot' });
  window.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user: null } }));
  vi.unstubAllGlobals();
});

test('la sessió pilot és «dins» com a usuari, sense preguntar el rol a ningú ni fer cap petició', async () => {
  entraComAPilot(LLAVOR);
  await vi.waitFor(() => expect(getSessionState()).toMatchObject({ estat: 'dins', rol: 'usuari', nivell: null }));
  expect(getSessionState().usuari).toMatchObject({ user_metadata: { full_name: PERSONA_PILOT.nom } });
  await Promise.resolve();
  expect(m.rol).not.toHaveBeenCalled();
  expect(xarxa).not.toHaveBeenCalled();
});

test('contrast · una sessió de veres en el mateix backend sí que pregunta el rol al port', async () => {
  const real = { id: '00000000-0000-4000-8000-00000000000c' };
  expect(desaSessio({ access_token: jwtDeVeres(real.id), refresh_token: 'rt', user: real })).toBe(true);
  window.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user: real } }));
  await vi.waitFor(() => expect(getSessionState()).toMatchObject({ estat: 'dins', rol: 'superadmin' }));
  expect(m.rol).toHaveBeenCalled();
});
