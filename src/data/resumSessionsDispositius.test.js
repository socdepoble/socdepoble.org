/* R13-C7 (ordre del Mestre, 08-11-2026) · Les dades del panell «👥 Usuaris, Dispositius i Botigues»:
   la validació de la resposta de la RPC (claus tancades, cap xifra inventada), la classificació dels
   errors (la migració que falta, el segon factor, la xarxa) i el camí pel port, que encara no porta el
   mètode perquè el contracte no el declara (decisió del Mestre). L'adaptador de Supabase es prova a
   supabase/admin.resumSessions.test.js (porta E1 de tractor-enxufe: ningú de fora l'importa). */
import { expect, test, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  CAMINS_SESSIONS, CODI_RESUM_SESSIONS, METODE_RESUM_SESSIONS, MIGRACIO_RESUM_SESSIONS,
  codiDErrorResumSessions, consultaResumSessionsDispositius, validaResumSessions
} from './resumSessionsDispositius.js';
import { CONTRACTE_BACKEND } from './contracte.js';
import * as backendPort from './backendPort.js';

const resposta = (canvis = {}) => ({
  consultat_a: '2026-11-08T21:40:00.000Z',
  camins: [
    { cami: 'altres', persones_24h: 0, persones_7d: 1, persones_14d: 1 },
    { cami: 'app_ios', persones_24h: 1, persones_7d: 1, persones_14d: 2 },
    { cami: 'web_ios', persones_24h: 0, persones_7d: 1, persones_14d: 1 },
    { cami: 'app_android', persones_24h: 1, persones_7d: 1, persones_14d: 1 },
    { cami: 'web_android', persones_24h: 0, persones_7d: 0, persones_14d: 1 },
    { cami: 'escriptori', persones_24h: 1, persones_7d: 1, persones_14d: 1 }
  ],
  total: { persones_24h: 3, persones_7d: 4, persones_14d: 6 },
  ...canvis
});
const ambCami = (cami, canvis) => resposta({ camins: resposta().camins.map((c) => (c.cami === cami ? { ...c, ...canvis } : c)) });

test('la migració i els camins són els de la RPC', () => {
  expect(MIGRACIO_RESUM_SESSIONS).toBe('2611082238_admin_resum_sessions_dispositius.sql');
  expect(readFileSync(`supabase/migrations/${MIGRACIO_RESUM_SESSIONS}`, 'utf8')).toContain('create or replace function public.admin_resum_sessions_dispositius()');
  expect(CAMINS_SESSIONS).toEqual(['app_ios', 'web_ios', 'app_android', 'web_android', 'escriptori', 'altres']);
});

test('una resposta bona es valida, es posa en l’ordre del panell i passa a camelCase', () => {
  const r = validaResumSessions(resposta());
  expect(r.consultatA).toBe('2026-11-08T21:40:00.000Z');
  expect(r.camins.map((c) => c.cami)).toEqual(CAMINS_SESSIONS);
  expect(r.camins[0]).toEqual({ cami: 'app_ios', persones24h: 1, persones7d: 1, persones14d: 2 });
  expect(r.total).toEqual({ persones24h: 3, persones7d: 4, persones14d: 6 });
});

test.each([
  ['un camp de més a l’arrel (podria portar una dada personal)', resposta({ correus: ['x@example.invalid'] })],
  ['un camp de més en un camí', ambCami('app_ios', { usuaris: ['00000000-0000-4000-8000-000000000001'] })],
  ['un camí desconegut', ambCami('app_ios', { cami: 'tauleta' })],
  ['un camí repetit', resposta({ camins: [...resposta().camins.slice(1), resposta().camins[1]] })],
  ['un camí de menys', resposta({ camins: resposta().camins.slice(1) })],
  ['una xifra negativa', ambCami('escriptori', { persones_24h: -1 })],
  ['una xifra decimal', ambCami('escriptori', { persones_7d: 1.5 })],
  ['una xifra en text', ambCami('escriptori', { persones_14d: '1' })],
  ['finestres que decreixen', ambCami('web_android', { persones_24h: 2, persones_7d: 1 })],
  ['un total menor que un camí', resposta({ total: { persones_24h: 0, persones_7d: 4, persones_14d: 6 } })],
  ['un total major que la suma', resposta({ total: { persones_24h: 3, persones_7d: 4, persones_14d: 60 } })],
  ['sense hora de consulta', resposta({ consultat_a: 'ahir' })],
  ['una llista en lloc d’un objecte', []],
  ['res', null]
])('rebutja %s sense tornar cap xifra', (_nom, valor) => {
  expect(() => validaResumSessions(valor)).toThrow(expect.objectContaining({ code: CODI_RESUM_SESSIONS.RESPOSTA_INVALIDA }));
});

test('classifica la causa: migració absent, permís, sense servidor i la resta', () => {
  const absent = Object.assign(new Error('L\'esquema requerit no està aplicat (falta "admin_resum_sessions_dispositius"). Executa les migracions corresponents.'), { status: 404 });
  expect(codiDErrorResumSessions(absent)).toBe(CODI_RESUM_SESSIONS.SENSE_MIGRACIO);
  expect(codiDErrorResumSessions(new Error('Supabase 404: {"code":"PGRST202","message":"Could not find the function"}'))).toBe(CODI_RESUM_SESSIONS.SENSE_MIGRACIO);
  expect(codiDErrorResumSessions({ code: '42883', message: 'function does not exist' })).toBe(CODI_RESUM_SESSIONS.SENSE_MIGRACIO);
  const refusada = Object.assign(new Error('Supabase 403: {"code":"42501","message":"SDP-ADMIN-003: cal superadmin amb el segon factor confirmat (aal2)."}'), { status: 403 });
  expect(codiDErrorResumSessions(refusada)).toBe(CODI_RESUM_SESSIONS.SENSE_PERMIS);
  expect(codiDErrorResumSessions(Object.assign(new Error('Supabase 401: {}'), { status: 401 }))).toBe(CODI_RESUM_SESSIONS.SENSE_PERMIS);
  expect(codiDErrorResumSessions({ code: 'no-disponible' })).toBe(CODI_RESUM_SESSIONS.SENSE_SERVIDOR);
  expect(codiDErrorResumSessions(new TypeError('Failed to fetch'))).toBe(CODI_RESUM_SESSIONS.ERROR);
  expect(codiDErrorResumSessions(Object.assign(new Error('El backend no ha respost a temps.'), { name: 'TimeoutError' }))).toBe(CODI_RESUM_SESSIONS.ERROR);
  expect(codiDErrorResumSessions(null)).toBe(CODI_RESUM_SESSIONS.ERROR);
});

test('el port: sense el mètode, SENSE_PORT i cap crida; amb ell, la resposta validada', async () => {
  await expect(consultaResumSessionsDispositius({})).rejects.toMatchObject({ code: CODI_RESUM_SESSIONS.SENSE_PORT });
  await expect(consultaResumSessionsDispositius(null)).rejects.toMatchObject({ code: CODI_RESUM_SESSIONS.SENSE_PORT });
  const metode = vi.fn().mockResolvedValue(resposta());
  const config = { signal: new AbortController().signal };
  const r = await consultaResumSessionsDispositius({ [METODE_RESUM_SESSIONS]: metode }, config);
  expect(metode).toHaveBeenCalledWith(config);
  expect(r.total.persones14d).toBe(6);
});

test('el port: l’error es classifica sense mutar l’original, una resposta mala no passa i la cancel·lació passa tal qual', async () => {
  const original = Object.freeze(Object.assign(new Error('Supabase 404: {"code":"PGRST202"}'), { status: 404 }));
  const err = await consultaResumSessionsDispositius({ [METODE_RESUM_SESSIONS]: () => Promise.reject(original) }).catch((e) => e);
  expect(err).toMatchObject({ code: CODI_RESUM_SESSIONS.SENSE_MIGRACIO });
  expect(err.cause).toBe(original);
  await expect(consultaResumSessionsDispositius({ [METODE_RESUM_SESSIONS]: async () => ({ ...resposta(), emails: [] }) }))
    .rejects.toMatchObject({ code: CODI_RESUM_SESSIONS.RESPOSTA_INVALIDA });
  const avortada = new DOMException('Operació cancel·lada.', 'AbortError');
  await expect(consultaResumSessionsDispositius({ [METODE_RESUM_SESSIONS]: () => Promise.reject(avortada) })).rejects.toBe(avortada);
});

test('R15 declara resum i detall com a capacitat opcional completa, sense alterar el nucli', async () => {
  expect(CONTRACTE_BACKEND).toContain(METODE_RESUM_SESSIONS);
  expect(backendPort[METODE_RESUM_SESSIONS]).toBeTypeOf('function');
  const metode = vi.fn().mockResolvedValue(resposta());
  const { candidate } = backendPort.validaBackendImplementation({
    ...Object.fromEntries(CONTRACTE_BACKEND.map((nom) => [nom, () => null])),
    [METODE_RESUM_SESSIONS]: metode
  });
  expect(await candidate[METODE_RESUM_SESSIONS]()).toEqual(resposta());
  expect(metode).toHaveBeenCalledOnce();
});
