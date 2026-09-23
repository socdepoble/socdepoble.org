import { afterEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ user: { id: 'A' }, role: vi.fn(), refresh: vi.fn(), logout: vi.fn() }));
vi.mock('./backendPort.js', () => ({ getCurrentUser: () => mocks.user, teCapacitat: () => true,
  elMeuRol: mocks.role, refrescaSessio: mocks.refresh, logout: mocks.logout }));
vi.mock('../host.js', () => ({ quanLlest: async () => undefined }));
import { sincronitza, setSessionConfig, getSessionState, renovaAra } from './sessionService.js';
const flush = async () => { for (let i = 0; i < 6; i++) await Promise.resolve(); };
afterEach(() => { vi.useRealTimers(); mocks.role.mockReset(); mocks.refresh.mockReset(); });
test('última consulta de rol guanya, també quan l’antiga falla', async () => {
  let old, recent;
  mocks.role.mockImplementationOnce(() => new Promise(resolve => { old = resolve; }))
    .mockImplementationOnce(() => new Promise(resolve => { recent = resolve; }));
  sincronitza(); sincronitza(); await flush();
  recent('usuari'); await flush(); old('superadmin'); await flush();
  expect(getSessionState().rol).toBe('usuari');
  let reject;
  mocks.role.mockImplementationOnce(() => new Promise((_, fail) => { reject = fail; }))
    .mockResolvedValueOnce('superadmin');
  sincronitza(); sincronitza(); await flush(); reject(new Error()); await flush();
  expect(getSessionState().rol).toBe('superadmin');
});
test('A→B→logout no conserva permisos ni accepta respostes pendents', async () => {
  let finish;
  mocks.user = { id: 'A' }; mocks.role.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  sincronitza(); await flush();
  mocks.user = { id: 'B' }; sincronitza();
  expect(getSessionState().rol).toBe('desconegut');
  finish('superadmin'); await flush();
  expect(getSessionState().rol).toBe('desconegut');
  mocks.user = null; sincronitza(); finish('superadmin'); await flush();
  expect(getSessionState()).toMatchObject({ usuari: null, rol: null, estat: 'fora' });
});
test('configuració clonada, canvi invalida rol i instàncies incompatibles fallen explícitament', async () => {
  mocks.user = { id: 'A' }; mocks.role.mockResolvedValue('usuari');
  const owner = Symbol(), other = Symbol();
  const config = { tenantId: 'A' };
  const release = setSessionConfig(config, owner); config.tenantId = 'B';
  await vi.dynamicImportSettled(); await flush();
  expect(mocks.role.mock.calls.at(-1)[0].tenantId).toBe('A');
  expect(() => setSessionConfig({ tenantId: 'B' }, other)).toThrow('Dos instàncies');
  release();
  const second = setSessionConfig({ tenantId: 'B' }, owner);
  expect(getSessionState().rol).toBe('desconegut');
  second();
});
test('errors de xarxa: tres reintents, sense un bucle de renovació', async () => {
  vi.useFakeTimers(); mocks.refresh.mockRejectedValue(new Error('xarxa'));
  await renovaAra();
  await vi.advanceTimersByTimeAsync(8000);
  expect(mocks.refresh).toHaveBeenCalledTimes(4);
  expect(vi.getTimerCount()).toBe(0);
});
