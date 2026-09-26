import { afterEach, beforeEach, expect, test, vi } from 'vitest';
/* D1 (260926) · El servei de sessió amb el registre persistent. identitat i storage
   reals; es falsegen el port (com a RequireAuth.test.jsx), l'amfitrió i la política. */
const m = vi.hoisted(() => ({ policy: null, refresh: null, logout: null }));
vi.mock('../config/runtimePolicy.js', () => ({ getRuntimePolicy: () => m.policy }));
vi.mock('./backendPort.js', async () => {
  const identitat = await import('./identitat.js');
  return {
    getCurrentUser: () => identitat.usuariDeSessio(), teCapacitat: () => true, elMeuRol: async () => 'usuari',
    refrescaSessio: (...args) => m.refresh(...args), logout: (...args) => m.logout(...args)
  };
});
vi.mock('../host.js', () => ({ quanLlest: async () => undefined }));
import { sincronitza, getSessionState, subscribeSession } from './sessionService.js';
import { adoptaSessioExterna, desaSessio, esborraSessio, usuariDeSessio, CLAU_PERSISTENT } from './identitat.js';
import { getVal, setVal, STORAGE_PREFIX } from '../config/storage.js';

m.refresh = vi.fn(); m.logout = vi.fn();
const EMISSOR = 'https://auth.example.test';
const A = '11111111-2222-4333-8444-555555555555';
const b64u = (o) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const token = (sub, segons = 3600) => `${b64u({ alg: 'none' })}.${b64u({ sub, iss: EMISSOR, aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + segons })}.c2ln`;
const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
const registre = () => getVal(CLAU_PERSISTENT, null);
const posaRegistre = (rt, sub = A) => setVal(CLAU_PERSISTENT, { v: 1, rt, sub, t: Date.now() });
/* El que fa auth.js quan el servidor torna la sessió del registre (després d'anar a la xarxa). */
const restauraCom = (rt) => async () => {
  await Promise.resolve();
  desaSessio({ access_token: token(A), refresh_token: rt, user: { id: A } }, { restauracio: { sub: A } });
  window.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user: { id: A } } }));
  return true;
};
/* Una altra pestanya del mateix origen toca el registre. */
const senyalStorage = () => window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_PREFIX + CLAU_PERSISTENT }));
const buida = async () => {
  esborraSessio({ abast: 'tot' }); window.sessionStorage.clear(); window.localStorage.clear();
  sincronitza(); await flush();
};
beforeEach(async () => {
  m.policy = { auth: { issuer: EMISSOR, audiences: ['authenticated'], persistencia: 'local' } };
  await buida(); m.refresh.mockReset(); m.logout.mockReset();
});
afterEach(async () => { vi.useRealTimers(); await buida(); m.policy = null; });

test('pestanya nova amb només el registre: comprovant, una renovació i dins, mai fora pel camí', async () => {
  posaRegistre('r1');
  m.refresh.mockImplementationOnce(restauraCom('r2'));
  const estats = []; const deixa = subscribeSession(s => estats.push(s.estat)); estats.length = 0;
  try {
    sincronitza();
    expect(getSessionState()).toMatchObject({ estat: 'comprovant', usuari: null });
    await flush();
    expect(m.refresh).toHaveBeenCalledTimes(1);
    expect(getSessionState()).toMatchObject({ estat: 'dins', usuari: { id: A } });
    expect(estats).not.toContain('fora');
  } finally { deixa(); }
});

test('una altra pestanya ix: esta es queda fora sense renovar ni tornar a eixir', async () => {
  posaRegistre('r1');
  m.refresh.mockImplementationOnce(restauraCom('r2'));
  sincronitza(); await flush();
  expect(getSessionState().estat).toBe('dins');
  m.refresh.mockClear();
  window.localStorage.removeItem(STORAGE_PREFIX + CLAU_PERSISTENT);
  senyalStorage(); await flush();
  expect(getSessionState()).toMatchObject({ estat: 'fora', usuari: null });
  expect(usuariDeSessio()).toBeNull();
  expect(m.refresh).not.toHaveBeenCalled();
  expect(m.logout).not.toHaveBeenCalled();
});

test('una altra pestanya entra mentre esta és fora: es restaura una sola vegada', async () => {
  expect(getSessionState().estat).toBe('fora');
  m.refresh.mockImplementation(restauraCom('r2'));
  posaRegistre('r1');
  senyalStorage(); await flush();
  expect(getSessionState()).toMatchObject({ estat: 'dins', usuari: { id: A } });
  senyalStorage(); await flush();                              // la rotació següent no reobri res
  expect(m.refresh).toHaveBeenCalledTimes(1);
});

/* D6 dona un sol intent per sessió desada: la sincronització que la declara fora
   també para el temporitzador de reintents. Sense xarxa, la restauració no insistix
   ni gasta el registre; «online» (o una altra pestanya) la torna a provar. */
test('sense xarxa: un intent, fora amb el registre intacte, cap bucle; «online» ho torna a provar una vegada', async () => {
  vi.useFakeTimers();
  posaRegistre('r1');
  m.refresh.mockRejectedValue(new TypeError('offline'));
  sincronitza();
  await vi.advanceTimersByTimeAsync(0);
  expect(getSessionState().estat).toBe('fora');
  await vi.advanceTimersByTimeAsync(60_000);
  expect(m.refresh).toHaveBeenCalledTimes(1);
  expect(vi.getTimerCount()).toBe(0);
  expect(m.logout).not.toHaveBeenCalled();
  expect(registre()?.rt).toBe('r1');
  window.dispatchEvent(new Event('online'));
  await vi.advanceTimersByTimeAsync(60_000);
  expect(m.refresh).toHaveBeenCalledTimes(2);
  expect(getSessionState().estat).toBe('fora');
  expect(registre()?.rt).toBe('r1');
});

/* Com auth.js: 'pestanya' buida només esta pestanya; per defecte (eixir), també el registre del compte. */
const tancaCom = async (_config, { abast = 'actor' } = {}) => {
  esborraSessio({ abast });
  window.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user: null } }));
};

test('una renovació que falla per xarxa amb el JWT ja caducat buida només la pestanya: el registre es queda i «online» el torna a provar', async () => {
  vi.useFakeTimers();
  desaSessio({ access_token: token(A, -10), refresh_token: 'r1', user: { id: A } });   // entrada pròpia, JWT ja caducat
  expect(registre()?.rt).toBe('r1');
  m.logout.mockImplementation(tancaCom);
  m.refresh.mockRejectedValue(new TypeError('offline'));
  sincronitza();
  await vi.advanceTimersByTimeAsync(0);
  expect(m.refresh).toHaveBeenCalledTimes(1);
  expect(m.logout).toHaveBeenCalledWith(expect.anything(), { abast: 'pestanya' });
  expect(registre()?.rt).toBe('r1');
  expect(getSessionState().estat).toBe('fora');
  window.dispatchEvent(new Event('online'));
  await vi.advanceTimersByTimeAsync(0);
  expect(m.refresh).toHaveBeenCalledTimes(2);
  expect(registre()?.rt).toBe('r1');
});

test('la sessió de l’amfitrió sense refresh token caduca: només ix esta pestanya i el registre propi del mateix compte es queda', async () => {
  vi.useFakeTimers();
  m.logout.mockImplementation(tancaCom);
  m.refresh.mockResolvedValue(false);                           // sense refresh token, auth.js torna false
  posaRegistre('r1');
  expect(adoptaSessioExterna({ access_token: token(A, 30), user: { id: A } })).toBe(true);
  expect(registre()?.rt).toBe('r1');                            // la injecció del mateix compte el conserva
  await vi.advanceTimersByTimeAsync(5);                          // dins del marge: renova de seguida
  expect(m.refresh).toHaveBeenCalled();
  expect(m.logout).toHaveBeenCalledWith(expect.anything(), { abast: 'pestanya' });
  expect(m.logout).not.toHaveBeenCalledWith(expect.anything());
  expect(usuariDeSessio()).toBeNull();
  expect(registre()?.rt).toBe('r1');
});

test('D6 amb el rellotge avançat: ni la rotació d’una altra pestanya ni tornar a la pestanya rearmen la renovació', async () => {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
  try {
    posaRegistre('r1');
    /* Cada token nou naix caducat per al rellotge d'esta màquina. */
    m.refresh.mockImplementation(async () => {
      await Promise.resolve();
      posaRegistre('r2');
      desaSessio({ access_token: token(A, -7200), user: { id: A } }, { restauracio: { sub: A } });
      window.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user: { id: A } } }));
      return true;
    });
    sincronitza(); await flush();
    expect(m.refresh).toHaveBeenCalledTimes(1);
    expect(getSessionState().estat).toBe('fora');
    posaRegistre('r3'); senyalStorage(); await flush();          // l'altra pestanya rota r2 → r3
    document.dispatchEvent(new Event('visibilitychange')); await flush();
    window.dispatchEvent(new Event('online')); await flush();
    expect(m.refresh).toHaveBeenCalledTimes(1);
    expect(getSessionState().estat).toBe('fora');
  } finally { delete document.visibilityState; }
});
