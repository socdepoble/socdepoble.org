/* Onada 11 (261010; prompt 261010_1730, tasca 2) · La personalització del
   poble (taxonomia i estil): les RPC del Tauler en remot, amb un doble de
   rpc(), i el magatzem en memòria en seed o local. */
import { beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ user: { id: 'A' }, rpc: vi.fn(), tenantId: 'T' }));
vi.mock('./runtime.js', () => ({
  getCurrentUser: () => m.user, rpc: m.rpc,
  getResolvedConfig: (config) => ({ hasSupabaseConfig: true, tenantId: m.tenantId, runtimeDataMode: config.dataMode || 'remote' })
}));
import {
  CLAUS_PERSONALITZACIO, adminDesaPersonalitzacio, adminHistorialPersonalitzacio, personalitzacioDeFiles, personalitzacioLocal,
  reiniciaPersonalitzacioLocal
} from './personalitzacio.js';
import { CODI_PERSONALITZACIO, MISSATGE_PERSONALITZACIO } from '../errorsBackend.js';

const errorPostgrest = (status, cos) => Object.assign(new Error(`Supabase ${status}: ${JSON.stringify(cos)}`), { status });
const SEED = { dataMode: 'seed' };

beforeEach(() => { m.rpc.mockReset(); m.user = { id: 'A' }; m.tenantId = 'T'; reiniciaPersonalitzacioLocal(); });

test('les claus són taxonomia i estil; una altra clau rebutja amb clau-invalida sense cap petició', async () => {
  expect(CLAUS_PERSONALITZACIO).toEqual(['taxonomia', 'estil']);
  for (const clau of ['towns', 'agents', '', null, 'Taxonomia']) {
    await expect(adminDesaPersonalitzacio({ clau, payload: {}, versio: null }, {})).rejects.toMatchObject({ code: 'clau-invalida', message: MISSATGE_PERSONALITZACIO['clau-invalida'] });
    await expect(adminHistorialPersonalitzacio(clau, {})).rejects.toMatchObject({ code: 'clau-invalida' });
  }
  expect(m.rpc).not.toHaveBeenCalled();
});

test('sense sessió, desar i l’historial rebutgen amb sense-sessio sense cap petició (remot i seed)', async () => {
  m.user = null;
  for (const config of [{}, SEED]) {
    await expect(adminDesaPersonalitzacio({ clau: 'taxonomia', payload: {}, versio: null }, config)).rejects.toMatchObject({ code: CODI_PERSONALITZACIO.SENSE_SESSIO });
    await expect(adminHistorialPersonalitzacio('estil', config)).rejects.toMatchObject({ code: CODI_PERSONALITZACIO.SENSE_SESSIO });
  }
  expect(m.rpc).not.toHaveBeenCalled();
});

/* ── Remot: les RPC ── */
test('en remot, desar crida admin_desa_contingut amb p_clau, p_payload, p_versio i p_tenant_id i torna la versió nova', async () => {
  m.rpc.mockResolvedValueOnce([{ key: 'taxonomia', payload: { categories: ['Festes'] }, version: 4 }]);
  const payload = { categories: ['Festes'] };
  expect(await adminDesaPersonalitzacio({ clau: 'taxonomia', payload, versio: 3 }, {})).toEqual({ clau: 'taxonomia', payload: { categories: ['Festes'] }, versio: 4 });
  expect(m.rpc).toHaveBeenCalledWith('admin_desa_contingut', { p_clau: 'taxonomia', p_payload: payload, p_versio: 3, p_tenant_id: 'T' }, {});
  /* Sense versió prèvia: null. Una fila sola (no llista) també val. */
  m.rpc.mockResolvedValueOnce({ key: 'estil', payload: { '--sdp-accent': '#000' }, version: 1 });
  expect(await adminDesaPersonalitzacio({ clau: 'estil', payload: { '--sdp-accent': '#000' } }, {})).toEqual({ clau: 'estil', payload: { '--sdp-accent': '#000' }, versio: 1 });
  expect(m.rpc.mock.calls[1][1].p_versio).toBeNull();
});

test('en remot, l’historial crida admin_historial_contingut i tradueix les files a { versio, payload, creat, autor }', async () => {
  m.rpc.mockResolvedValueOnce([
    { key: 'taxonomia', version: 2, payload: { b: 1 }, created_at: '2026-10-10T10:00:00+00:00', author: 'A' },
    { key: 'taxonomia', version: 1, payload: { a: 1 }, created_at: '2026-10-09T10:00:00+00:00', author: 'A' }
  ]);
  expect(await adminHistorialPersonalitzacio('taxonomia', {})).toEqual([
    { versio: 2, payload: { b: 1 }, creat: '2026-10-10T10:00:00+00:00', autor: 'A' },
    { versio: 1, payload: { a: 1 }, creat: '2026-10-09T10:00:00+00:00', autor: 'A' }
  ]);
  expect(m.rpc).toHaveBeenCalledWith('admin_historial_contingut', { p_clau: 'taxonomia', p_tenant_id: 'T' }, {});
  m.rpc.mockResolvedValueOnce(null);
  expect(await adminHistorialPersonalitzacio('estil', {})).toEqual([]);
});

test('un 42501 amb SDP-ADMIN al missatge és cal-segon-factor, amb la frase del Mestre; SDP-ADMIN-006 és conflicte-versio', async () => {
  const cru = errorPostgrest(403, { code: '42501', details: null, hint: null, message: 'SDP-ADMIN-003: cal confirmar el segon factor (aal2).' });
  m.rpc.mockRejectedValueOnce(cru);
  const error = await adminDesaPersonalitzacio({ clau: 'taxonomia', payload: {}, versio: 1 }, {}).catch((e) => e);
  expect(error).toMatchObject({ code: 'cal-segon-factor', message: 'Cal confirmar el segon factor per a desar.', status: 403, cause: cru });
  m.rpc.mockRejectedValueOnce(errorPostgrest(403, { code: '42501', message: 'SDP-ADMIN-003: cal confirmar el segon factor (aal2).' }));
  await expect(adminHistorialPersonalitzacio('taxonomia', {})).rejects.toMatchObject({ code: 'cal-segon-factor' });
  m.rpc.mockRejectedValueOnce(errorPostgrest(409, { code: 'P0001', message: 'SDP-ADMIN-006: la versió 3 ja no és l’última.' }));
  await expect(adminDesaPersonalitzacio({ clau: 'taxonomia', payload: {}, versio: 3 }, {})).rejects.toMatchObject({ code: 'conflicte-versio', message: MISSATGE_PERSONALITZACIO['conflicte-versio'] });
});

test('un 42501 sense SDP-ADMIN, l’esquema sense aplicar (404) i un 401 tenen el seu codi; la resta és desconegut', async () => {
  m.rpc.mockRejectedValueOnce(errorPostgrest(403, { code: '42501', message: 'permission denied for table app_content' }));
  await expect(adminDesaPersonalitzacio({ clau: 'estil', payload: {}, versio: null }, {})).rejects.toMatchObject({ code: 'desconegut' });
  m.rpc.mockRejectedValueOnce(Object.assign(new Error('L\'esquema requerit no està aplicat (falta "admin_desa_contingut").'), { status: 404 }));
  await expect(adminDesaPersonalitzacio({ clau: 'estil', payload: {}, versio: null }, {})).rejects.toMatchObject({ code: 'no-disponible' });
  m.rpc.mockRejectedValueOnce(errorPostgrest(401, { message: 'JWT expired' }));
  await expect(adminHistorialPersonalitzacio('estil', {})).rejects.toMatchObject({ code: 'sense-sessio' });
  const avortat = new DOMException('La sessió ha canviat.', 'AbortError');
  m.rpc.mockRejectedValueOnce(avortat);
  await expect(adminHistorialPersonalitzacio('estil', {})).rejects.toBe(avortat);
});

test('en remot sense tenantId, desar rebutja amb un code abans de cap petició; un payload que no és objecte, també', async () => {
  m.tenantId = null;
  await expect(adminDesaPersonalitzacio({ clau: 'estil', payload: {}, versio: null }, {})).rejects.toMatchObject({ code: 'desconegut', message: /tenantId/ });
  m.tenantId = 'T';
  await expect(adminDesaPersonalitzacio({ clau: 'estil', payload: 'text', versio: null }, {})).rejects.toMatchObject({ code: 'desconegut' });
  await expect(adminDesaPersonalitzacio({ clau: 'estil' }, {})).rejects.toMatchObject({ code: 'desconegut' });
  expect(m.rpc).not.toHaveBeenCalled();
});

/* ── Seed i local: el magatzem en memòria ── */
test.each(['seed', 'local'])('en mode %s, desar guarda en memòria amb versions, l’historial ix de més nova a més vella i cap RPC viatja', async (dataMode) => {
  const config = { dataMode };
  expect(personalitzacioLocal()).toEqual({ taxonomia: null, estil: null });
  expect(await adminDesaPersonalitzacio({ clau: 'taxonomia', payload: { categories: ['Festes'] }, versio: null }, config))
    .toEqual({ clau: 'taxonomia', payload: { categories: ['Festes'] }, versio: 1 });
  expect(await adminDesaPersonalitzacio({ clau: 'taxonomia', payload: { categories: ['Festes', 'Mercat'] }, versio: 1 }, config))
    .toEqual({ clau: 'taxonomia', payload: { categories: ['Festes', 'Mercat'] }, versio: 2 });
  expect(personalitzacioLocal()).toEqual({ taxonomia: { payload: { categories: ['Festes', 'Mercat'] }, versio: 2 }, estil: null });
  const historial = await adminHistorialPersonalitzacio('taxonomia', config);
  expect(historial.map((r) => r.versio)).toEqual([2, 1]);
  expect(historial[0]).toMatchObject({ payload: { categories: ['Festes', 'Mercat'] }, autor: 'A' });
  expect(historial[0].creat).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  expect(await adminHistorialPersonalitzacio('estil', config)).toEqual([]);
  expect(m.rpc).not.toHaveBeenCalled();
});

test('en seed, una versió que ja no és l’última rebutja amb conflicte-versio i no toca res; sense versió (null) sempre desa damunt', async () => {
  await adminDesaPersonalitzacio({ clau: 'estil', payload: { a: 1 }, versio: 0 }, SEED);
  await expect(adminDesaPersonalitzacio({ clau: 'estil', payload: { a: 2 }, versio: 0 }, SEED)).rejects.toMatchObject({ code: 'conflicte-versio' });
  expect(personalitzacioLocal().estil).toEqual({ payload: { a: 1 }, versio: 1 });
  expect(await adminDesaPersonalitzacio({ clau: 'estil', payload: { a: 3 }, versio: null }, SEED)).toMatchObject({ versio: 2 });
});

test('el magatzem torna còpies: mutar el que torna no canvia el que hi ha desat', async () => {
  const payload = { categories: ['Festes'] };
  const desat = await adminDesaPersonalitzacio({ clau: 'taxonomia', payload, versio: null }, SEED);
  payload.categories.push('Intrús');
  desat.payload.categories.push('Altre');
  expect(personalitzacioLocal().taxonomia.payload).toEqual({ categories: ['Festes'] });
});

/* ── personalitzacioDeFiles: les files d'app_content → el camp de loadCoreContent ── */
test('personalitzacioDeFiles torna { payload, versio } per clau present i null per a l’absent, i ignora les altres claus', () => {
  expect(personalitzacioDeFiles([
    { key: 'towns', payload: [], version: 1 },
    { key: 'taxonomia', payload: { categories: ['Festes'] }, version: 7 },
    { key: 'estil', payload: null, version: 2 }
  ])).toEqual({ taxonomia: { payload: { categories: ['Festes'] }, versio: 7 }, estil: null });
  expect(personalitzacioDeFiles([])).toEqual({ taxonomia: null, estil: null });
  expect(personalitzacioDeFiles(null)).toEqual({ taxonomia: null, estil: null });
  expect(personalitzacioDeFiles([{ key: 'estil', payload: {} }])).toEqual({ taxonomia: null, estil: { payload: {}, versio: 0 } });
});
