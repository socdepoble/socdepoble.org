import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { desaSessio, esborraSessio, versioSessio } from '../identitat.js';
const m = vi.hoisted(() => ({ rpc: vi.fn(), configured: true }));
vi.mock('./runtime.js', () => ({ getCurrentUser: () => ({ id: 'super' }), rpc: m.rpc, getResolvedConfig: () => ({ hasSupabaseConfig: m.configured }) }));
import { adminLlistaSessionsDispositius } from './admin.js';
const actor = '11111111-1111-4111-8111-111111111111';
const session = id => ({ access_token: 'synthetic-local-test-session', user: { id } });
beforeEach(() => { m.rpc.mockReset(); m.configured = true; esborraSessio(); desaSessio(session(actor)); });
afterEach(() => esborraSessio());
test('nom exacte de RPC, filtres tancats i senyal preservat', async () => { const signal=new AbortController().signal; m.rpc.mockResolvedValue({files:[],total:0,consultat_a:'2026-11-09T14:00:00Z'}); await adminLlistaSessionsDispositius({cerca:'  veïna ',cami:'app_ios'},{signal}); expect(m.rpc).toHaveBeenCalledWith('admin_llista_sessions_dispositius',{p_cerca:'veïna',p_cami:'app_ios'},{signal},{signal}); });
test('sense servidor i filtres invàlids no envien xarxa', async () => { m.configured=false; await expect(adminLlistaSessionsDispositius()).rejects.toMatchObject({code:'no-disponible'}); expect(m.rpc).not.toHaveBeenCalled(); });
test('cancel·lació posterior a RPC no retorna dades d’altra sessió', async () => { const c=new AbortController(); m.rpc.mockImplementation(async()=>{c.abort();return{files:[],total:0,consultat_a:'2026-11-09T14:00:00Z'};}); await expect(adminLlistaSessionsDispositius({}, {signal:c.signal})).rejects.toMatchObject({name:'AbortError'}); });

const response = () => ({ files: [], total: 0, consultat_a: '2026-11-09T14:00:00Z' });
test('la renovació real del token del mateix compte conserva la resposta del directori', async () => {
  const start = versioSessio;
  m.rpc.mockImplementation(async () => { expect(desaSessio(session(actor), { renovacio: true })).toBe(true); return response(); });
  await expect(adminLlistaSessionsDispositius()).resolves.toMatchObject({ files: [], total: 0 });
  expect(versioSessio).toBe(start + 1);
});
test.each([
  ['logout', () => esborraSessio()],
  ['canvi de compte', () => desaSessio(session('22222222-2222-4222-8222-222222222222'))],
  ['reentrada del mateix compte', () => { esborraSessio(); desaSessio(session(actor)); }]
])('%s rebutja la resposta privada antiga del directori', async (_name, change) => {
  m.rpc.mockImplementation(async () => { change(); return response(); });
  await expect(adminLlistaSessionsDispositius()).rejects.toMatchObject({ name: 'AbortError' });
});
