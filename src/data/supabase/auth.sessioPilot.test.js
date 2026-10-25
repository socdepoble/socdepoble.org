/**
 * Gauntlet 261016_1530 (Bloc 3.6.4; F66) · L'entrada pilot local amb
 * l'adaptador real de Supabase: cap petició porta el testimoni de la sessió de
 * prova i eixir-ne no en fa cap. La xarxa és un fetch fals que rebutja com un
 * servidor caigut (ERR_EMPTY_RESPONSE): qualsevol crida queda apuntada.
 *
 * Gauntlet 261025_0545 (DF-03) · Estes quatre proves vivien a
 * src/data/sessioPilot.test.js, l'única raó per la qual tractor-enxufe E1 hi
 * veia dos imports de l'adaptador. Hi passen tal qual: la primera i la de
 * contrast proven el transport (runtime.js · request), que no és cap mètode
 * del port, i E1 només deixa importar l'adaptador des de src/data/supabase/.
 * La resta de l'entrada pilot (data/sessioPilot.js i identitat.js) continua
 * a sessioPilot.test.js.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  CLAU_JWT, TESTIMONI_PILOT, configuraBackendSessio, desaSessio, esborraSessio, usuariDeSessio
} from '../identitat.js';
import { entraComAPilot } from '../sessioPilot.js';
import { request } from './runtime.js';
import { loginWithPassword, logout } from './auth.js';
import { getEfimer } from '../../config/storage.js';

const URL_LOCAL = 'http://127.0.0.1:54321';
const CLAU_PUBLICA = 'sb_publishable_prova_pilot';
const TENANT = '00000000-0000-4000-8000-0000000000f6';
const LLAVOR = Object.freeze({ supabaseUrl: URL_LOCAL, supabaseAnonKey: CLAU_PUBLICA, tenantId: TENANT, dataMode: 'seed' });
const REMOT = Object.freeze({ ...LLAVOR, dataMode: 'remote' });

/* Un JWT sintètic (sense signatura) d'una sessió de veres del servidor. */
const b64u = (o) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const jwtDeVeres = (sub) => `${b64u({ alg: 'none' })}.${b64u({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })}.c2ln`;

let xarxa;
let avisos;
const escolta = (event) => avisos.push(event.detail?.user ?? null);
/* El handshake del document (el que fa SessionProvider). Un canvi de backend
   també avisa; els avisos que compten són els de després. */
const prepara = (config) => {
  configuraBackendSessio(config);
  avisos.length = 0;
};

beforeEach(() => {
  xarxa = vi.fn(async () => { throw new TypeError('Failed to fetch'); });
  vi.stubGlobal('fetch', xarxa);
  avisos = [];
  window.addEventListener('sdp:auth-change', escolta);
  esborraSessio({ abast: 'tot' });
});

afterEach(() => {
  window.removeEventListener('sdp:auth-change', escolta);
  esborraSessio({ abast: 'tot' });
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('amb l’adaptador de Supabase: cap petició porta el testimoni i eixir no en fa cap', () => {
  test('una petició de l’adaptador en mode de proves va amb la clau pública, mai amb el testimoni', async () => {
    prepara(LLAVOR);
    entraComAPilot(LLAVOR);
    xarxa.mockImplementationOnce(async () => ({ ok: true, status: 200, json: async () => [], headers: { get: () => null } }));
    await request('/rest/v1/prova', LLAVOR);
    expect(xarxa).toHaveBeenCalledTimes(1);
    const [, opcions] = xarxa.mock.calls[0];
    expect(opcions.headers.Authorization).toBe(`Bearer ${CLAU_PUBLICA}`);
    expect(JSON.stringify(xarxa.mock.calls)).not.toContain(TESTIMONI_PILOT);
  });

  test('eixir de la sessió pilot la buida sense revocar res al servidor (cap petició)', async () => {
    prepara(LLAVOR);
    entraComAPilot(LLAVOR);
    await logout(LLAVOR);
    expect(usuariDeSessio()).toBeNull();
    expect(getEfimer(CLAU_JWT, null)).toBeNull();
    expect(xarxa).not.toHaveBeenCalled();
  });

  /* Contrast: les dues proves de dalt tenen sentit perquè, amb una sessió de
     veres, el mateix fetch sí que veu el JWT i la revocació. */
  test('contrast · una sessió de veres sí que porta el seu JWT i, en eixir, sí que es revoca', async () => {
    prepara(REMOT);
    const real = { id: '00000000-0000-4000-8000-00000000000b' };
    const jwt = jwtDeVeres(real.id);
    expect(desaSessio({ access_token: jwt, refresh_token: 'rt', user: real })).toBe(true);
    xarxa.mockImplementationOnce(async () => ({ ok: true, status: 200, json: async () => [], headers: { get: () => null } }));
    await request('/rest/v1/prova', REMOT);
    expect(xarxa.mock.calls[0][1].headers.Authorization).toBe(`Bearer ${jwt}`);
    await logout(REMOT);
    expect(xarxa.mock.calls.map(([url]) => String(url))).toContain(`${URL_LOCAL}/auth/v1/logout?scope=local`);
  });

  test('l’entrada real continua rebutjant en mode de proves: la persona pilot no obri cap porta nova', async () => {
    prepara(LLAVOR);
    entraComAPilot(LLAVOR);
    await expect(loginWithPassword('pilot@poble.test', 'contrasenya-llarga', LLAVOR)).rejects.toMatchObject({ code: 'mode-local' });
    expect(xarxa).not.toHaveBeenCalled();
  });
});
