/**
 * Gauntlet 261016_1530 (Bloc 3.6.4; F66) · L'entrada pilot local, a la capa de
 * dades: data/sessioPilot.js i les garanties d'identitat.js, amb la cadena real
 * (identitat → storage). Les peticions i l'eixida amb l'adaptador real de
 * Supabase són a supabase/auth.sessioPilot.test.js (Gauntlet 261025_0545,
 * DF-03: tractor-enxufe E1). La xarxa és un fetch fals que rebutja com un
 * servidor caigut (ERR_EMPTY_RESPONSE): qualsevol crida queda apuntada.
 *
 * Proves positives (mode de proves en desenvolupament) i negatives (remot,
 * producció, una configuració falsa, el pas a remot i un document nou).
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  CLAU_JWT, CLAU_PERSISTENT, CLAU_USUARI, TESTIMONI_PILOT, configuraBackendSessio, desaSessio, esSessioPilot,
  esborraSessio, jwtPerBackend, usuariDeSessio
} from './identitat.js';
import { CODI_PILOT_NO_DISPONIBLE, PROVEIDOR_PILOT, entraComAPilot, entradaPilotDisponible, usuariPilot } from './sessioPilot.js';
import { PERSONA_PILOT } from './identitatsSeed.js';
import { AGENTS_MAP } from './agentsSeed.js';
import { getEfimer, getVal } from '../config/storage.js';

const URL_LOCAL = 'http://127.0.0.1:54321';
const CLAU_PUBLICA = 'sb_publishable_prova_pilot';
const TENANT = '00000000-0000-4000-8000-0000000000f6';
const LLAVOR = Object.freeze({ supabaseUrl: URL_LOCAL, supabaseAnonKey: CLAU_PUBLICA, tenantId: TENANT, dataMode: 'seed' });
const LOCAL = Object.freeze({ ...LLAVOR, dataMode: 'local' });
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

describe('entradaPilotDisponible: només en desenvolupament i en mode de proves', () => {
  test('seed i local, sí; remot o sense mode (que és remot), no', () => {
    expect(entradaPilotDisponible(LLAVOR)).toBe(true);
    expect(entradaPilotDisponible(LOCAL)).toBe(true);
    expect(entradaPilotDisponible(REMOT)).toBe(false);
    expect(entradaPilotDisponible({ supabaseUrl: URL_LOCAL, supabaseAnonKey: CLAU_PUBLICA })).toBe(false);
  });

  test('una configuració que no es pot normalitzar no en té (i no llança)', () => {
    expect(entradaPilotDisponible({ ...LLAVOR, tenantId: 'no-es-un-uuid' })).toBe(false);
  });

  test('en un build de producció (DEV fals), mai', () => {
    vi.stubEnv('DEV', false);
    expect(entradaPilotDisponible(LLAVOR)).toBe(false);
    expect(entradaPilotDisponible(LOCAL)).toBe(false);
  });
});

describe('entraComAPilot en mode de proves', () => {
  test.each([['seed', LLAVOR], ['local', LOCAL]])('%s · la sessió de prova naix sense cap petició i és la persona pilot', (_mode, config) => {
    prepara(config);
    const { user } = entraComAPilot(config);

    expect(user).toEqual(usuariPilot());
    expect(user).toMatchObject({
      id: AGENTS_MAP.JAVI.id,
      app_metadata: { provider: PROVEIDOR_PILOT },
      user_metadata: { full_name: PERSONA_PILOT.nom, avatar_url: PERSONA_PILOT.avatar }
    });
    expect(PERSONA_PILOT.alies).toContain(user.id);
    expect(usuariDeSessio()).toEqual(user);
    expect(esSessioPilot()).toBe(true);
    // Cap petició: ni per a entrar ni per a preparar res.
    expect(xarxa).not.toHaveBeenCalled();
    // La interfície se n'assabenta pel camí de sempre.
    expect(avisos).toEqual([user]);
  });

  test('el testimoni no és cap JWT, no viatja i no baixa al registre persistent', () => {
    prepara(LLAVOR);
    entraComAPilot(LLAVOR);
    expect(getEfimer(CLAU_JWT, null)).toBe(TESTIMONI_PILOT);
    expect(TESTIMONI_PILOT.split('.')).toHaveLength(1);
    expect(jwtPerBackend(LLAVOR)).toBeNull();
    expect(getVal(CLAU_PERSISTENT, null)).toBeNull();
  });

  test('cada usuariPilot() és una còpia nova: ningú no pot tocar la del mòdul', () => {
    const una = usuariPilot();
    una.user_metadata.full_name = 'Una altra';
    expect(usuariPilot().user_metadata.full_name).toBe(PERSONA_PILOT.nom);
  });
});

describe('negatives: el mode remot mai no rep la identitat ni els permisos de pilot', () => {
  test('en remot rebutja amb el seu codi, sense tocar la sessió de veres ni fer cap petició', () => {
    prepara(REMOT);
    const real = { id: '00000000-0000-4000-8000-00000000000a' };
    expect(desaSessio({ access_token: jwtDeVeres(real.id), refresh_token: 'rt', user: real })).toBe(true);

    expect(() => entraComAPilot(REMOT)).toThrow(expect.objectContaining({ code: CODI_PILOT_NO_DISPONIBLE }));
    expect(usuariDeSessio()).toEqual(real);
    expect(esSessioPilot()).toBe(false);
    expect(avisos).toEqual([]);
    expect(xarxa).not.toHaveBeenCalled();
  });

  test('una configuració de proves falsa no canvia el backend d’un document remot', () => {
    prepara(REMOT);
    expect(() => entraComAPilot(LLAVOR)).toThrow(expect.objectContaining({ code: CODI_PILOT_NO_DISPONIBLE }));
    expect(getEfimer(CLAU_JWT, null)).toBeNull();
    expect(usuariDeSessio()).toBeNull();
    expect(avisos).toEqual([]);
    expect(xarxa).not.toHaveBeenCalled();
  });

  test('desaSessio no admet el testimoni pilot dins d’un backend remot, ni com a renovació', () => {
    prepara(REMOT);
    expect(desaSessio({ access_token: TESTIMONI_PILOT, refresh_token: null, user: usuariPilot() })).toBe(false);
    expect(getEfimer(CLAU_JWT, null)).toBeNull();
    prepara(LLAVOR);
    entraComAPilot(LLAVOR);
    expect(desaSessio({ access_token: TESTIMONI_PILOT, user: usuariPilot() }, { renovacio: true })).toBe(false);
  });

  test('en producció (DEV fals) rebutja, i el testimoni no es desa ni es llig', () => {
    prepara(LLAVOR);
    entraComAPilot(LLAVOR);
    vi.stubEnv('DEV', false);
    // Una sessió pilot que quedara d'abans ja no val.
    expect(usuariDeSessio()).toBeNull();
    expect(esSessioPilot()).toBe(false);
    esborraSessio({ abast: 'tot' });
    expect(() => entraComAPilot(LLAVOR)).toThrow(expect.objectContaining({ code: CODI_PILOT_NO_DISPONIBLE }));
    expect(desaSessio({ access_token: TESTIMONI_PILOT, refresh_token: null, user: usuariPilot() })).toBe(false);
    expect(getEfimer(CLAU_JWT, null)).toBeNull();
    expect(xarxa).not.toHaveBeenCalled();
  });

  test('en passar a remot (el document nou fa el seu handshake) la pestanya es buida', () => {
    prepara(LLAVOR);
    entraComAPilot(LLAVOR);
    prepara(REMOT);
    expect(usuariDeSessio()).toBeNull();
    expect(getEfimer(CLAU_JWT, null)).toBeNull();
    expect(getEfimer(CLAU_USUARI, null)).toBeNull();
    expect(jwtPerBackend(REMOT)).toBeNull();
    expect(xarxa).not.toHaveBeenCalled();
  });
});

/* Gauntlet 261025_0545 (DF-03) · «amb l’adaptador de Supabase: cap petició porta
   el testimoni i eixir no en fa cap» viu ara, tal qual, a
   supabase/auth.sessioPilot.test.js: prova el transport de l'adaptador
   (runtime.js · request), que no és cap mètode del port, i tractor-enxufe E1
   només deixa importar l'adaptador des de src/data/supabase/. */

/* L'última del fitxer: torna a carregar els mòduls. */
describe('un document nou', () => {
  test('no veu la persona pilot ni abans del handshake, i el handshake remot la buida', async () => {
    prepara(LLAVOR);
    entraComAPilot(LLAVOR);
    // La pestanya continua (sessionStorage); el mòdul torna a nàixer, com en recarregar.
    vi.resetModules();
    const nou = await import('./identitat.js');
    expect(getEfimer(CLAU_JWT, null)).toBe(TESTIMONI_PILOT);
    expect(nou.usuariDeSessio()).toBeNull();
    expect(nou.esSessioPilot()).toBe(false);
    nou.configuraBackendSessio(REMOT);
    expect(nou.usuariDeSessio()).toBeNull();
    expect(getEfimer(CLAU_JWT, null)).toBeNull();
    expect(xarxa).not.toHaveBeenCalled();
  });
});
