/* R13-C7 (ordre del Mestre, 08-11-2026) · L'adaptador de Supabase del resum de sessions per camí:
   la RPC de 2611082238_admin_resum_sessions_dispositius.sql pel nom exacte, sense paràmetres i amb el
   senyal; el JSON tal qual (el valida src/data/resumSessionsDispositius.js); i, sense servidor
   configurat, no-disponible abans de cap crida, mai un resum buit que semble un zero. */
import { beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ rpc: vi.fn(), configured: true }));
vi.mock('./runtime.js', () => ({
  getCurrentUser: () => ({ id: 'super' }), rpc: m.rpc,
  getResolvedConfig: () => ({ hasSupabaseConfig: m.configured, runtimeDataMode: 'remote' })
}));
vi.mock('../identitat.js', () => ({ versioSessio: 1 }));
import { adminResumSessionsDispositius } from './admin.js';
import { CODI_RESUM_SESSIONS, codiDErrorResumSessions, consultaResumSessionsDispositius, METODE_RESUM_SESSIONS } from '../resumSessionsDispositius.js';

beforeEach(() => { m.rpc.mockReset(); m.configured = true; });

const RESPOSTA = Object.freeze({
  consultat_a: '2026-11-08T21:40:00.000Z',
  camins: ['app_ios', 'web_ios', 'app_android', 'web_android', 'escriptori', 'altres'].map((cami) => ({ cami, persones_24h: 0, persones_7d: 1, persones_14d: 1 })),
  total: { persones_24h: 0, persones_7d: 3, persones_14d: 6 }
});

test('crida la RPC sense paràmetres, conserva config i senyal i torna el JSON tal qual', async () => {
  const control = new AbortController(), config = { signal: control.signal };
  m.rpc.mockResolvedValue(RESPOSTA);
  expect(await adminResumSessionsDispositius(config)).toBe(RESPOSTA);
  expect(m.rpc).toHaveBeenCalledWith('admin_resum_sessions_dispositius', {}, config, { signal: control.signal });
});

test('sense servidor configurat: no-disponible, cap crida, i el panell ho llig com a SENSE_SERVIDOR', async () => {
  m.configured = false;
  const error = await adminResumSessionsDispositius({}).catch((e) => e);
  expect(error).toMatchObject({ code: 'no-disponible' });
  expect(m.rpc).not.toHaveBeenCalled();
  expect(codiDErrorResumSessions(error)).toBe(CODI_RESUM_SESSIONS.SENSE_SERVIDOR);
});

test('quan el contracte el declare, la mateixa funció servix el port: la resposta passa la validació', async () => {
  m.rpc.mockResolvedValue(RESPOSTA);
  const resum = await consultaResumSessionsDispositius({ [METODE_RESUM_SESSIONS]: adminResumSessionsDispositius });
  expect(resum.camins).toHaveLength(6);
  expect(resum.total).toEqual({ persones24h: 0, persones7d: 3, persones14d: 6 });
});

test('la funció absent a la base (el 404 que runtime.rpc ja tradueix) arriba al panell com a migració pendent', async () => {
  m.rpc.mockRejectedValue(Object.assign(new Error('L\'esquema requerit no està aplicat (falta "admin_resum_sessions_dispositius"). Executa les migracions corresponents.'), { status: 404 }));
  await expect(consultaResumSessionsDispositius({ [METODE_RESUM_SESSIONS]: adminResumSessionsDispositius }))
    .rejects.toMatchObject({ code: CODI_RESUM_SESSIONS.SENSE_MIGRACIO });
});
