import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const store = vi.hoisted(() => ({ values: new Map(), writable: true }));
vi.mock('./storage.js', () => ({ getVal: (key, fallback) => store.values.get(key) ?? fallback, setVal: (key, value) => {
  if (!store.writable) return false;
  store.values.set(key, value);
  return true;
} }));
vi.mock('./runtimePolicy.js', () => ({ getRuntimePolicy: () => null }));
const config = { backendId: 'custom', backendUrl: 'https://example.test/api', tenantId: 'poble', dataMode: 'seed' };
const clau = `data-mode-choice:${JSON.stringify(['custom', 'https://example.test/api', 'poble'])}`;
// T13 · Quin procés de `vite` simula cada prova; '' simula un build (DEV false).
const servidor = (valor) => { vi.stubEnv('VITE_SDP_SERVIDOR_DEV', valor); vi.stubEnv('DEV', valor !== ''); };
beforeEach(() => { vi.resetModules(); store.values.clear(); store.writable = true; servidor('dev-a'); });
afterEach(() => { vi.unstubAllEnvs(); });

test('el mode remot és explícit, es manté després de recarregar i no transporta credencials', async () => {
  const first = await import('./dataMode.js');
  const reload = vi.fn();
  expect(first.resolveDataMode(config)).toBe('seed');
  first.enterRemoteMode({ ...config, supabaseAnonKey: 'public-key' }, reload);
  expect(reload).toHaveBeenCalledTimes(1);
  expect(JSON.stringify([...store.values])).not.toContain('public-key');
  expect(first.resolveDataMode(config)).toBe('seed');
  vi.resetModules();
  const { normalizeBackendConfig } = await import('./backendConfig.js');
  expect(normalizeBackendConfig(config).dataMode).toBe('remote');
  expect(normalizeBackendConfig({ backendId: 'custom', backend_url: 'https://example.test/api/', tenant_id: 'poble', dataMode: 'seed' }).dataMode).toBe('remote');
});

test('l’elecció no afecta altres proveïdors, camins ni pobles', async () => {
  const { enterRemoteMode } = await import('./dataMode.js');
  enterRemoteMode(config, vi.fn());
  vi.resetModules();
  const { resolveDataMode } = await import('./dataMode.js');
  for (const different of [{ backendId: 'other' }, { backendUrl: 'https://example.test/other' }, { tenantId: 'altre' }]) {
    expect(resolveDataMode({ ...config, ...different })).toBe('seed');
  }
});

test('una altra pestanya no pot canviar el mode d’un muntatge viu', async () => {
  const { resolveDataMode } = await import('./dataMode.js');
  expect(resolveDataMode(config)).toBe('seed');
  // Una elecció VÀLIDA per a este procés: només el retrat del document la para.
  store.values.set(clau, { v: 1, mode: 'remote', servidor: 'dev-a' });
  expect(resolveDataMode(config)).toBe('seed');
  vi.resetModules();
  expect((await import('./dataMode.js')).resolveDataMode(config)).toBe('remote');
});

test('entrar en un segon node conserva l’elecció del primer després de recarregar', async () => {
  const { enterRemoteMode } = await import('./dataMode.js');
  const second = { ...config, tenantId: 'segon-poble' };
  enterRemoteMode(config, vi.fn());
  enterRemoteMode(second, vi.fn());
  vi.resetModules();
  const { resolveDataMode } = await import('./dataMode.js');
  expect(resolveDataMode(config)).toBe('remote');
  expect(resolveDataMode(second)).toBe('remote');
});

test('quota denegada no recarrega ni simula una entrada real', async () => {
  const { enterRemoteMode } = await import('./dataMode.js');
  const reload = vi.fn(); store.writable = false;
  expect(() => enterRemoteMode(config, reload)).toThrow('No s’ha pogut guardar');
  expect(reload).not.toHaveBeenCalled();
});

test('T13 · un procés nou de `vite` torna al mode de VITE_DATA_MODE; el mateix procés el conserva', async () => {
  (await import('./dataMode.js')).enterRemoteMode(config, vi.fn());
  expect(store.values.get(clau)).toEqual({ v: 1, mode: 'remote', servidor: 'dev-a' });
  vi.resetModules();                                    // recàrrega, pestanya nova o reinici de Vite sol
  expect((await import('./dataMode.js')).resolveDataMode(config)).toBe('remote');
  servidor('dev-b'); vi.resetModules();                 // `npm run dev` de nou
  expect((await import('./dataMode.js')).resolveDataMode(config)).toBe('seed');
});

test('T13 · una elecció d’abans (sense empremta) no val en desenvolupament i sí en un build', async () => {
  store.values.set(clau, { v: 1, mode: 'remote' });
  expect((await import('./dataMode.js')).resolveDataMode(config)).toBe('seed');
  servidor(''); vi.resetModules();
  expect((await import('./dataMode.js')).resolveDataMode(config)).toBe('remote');
});

test('T13 · en un build l’elecció es desa com abans i dura entre càrregues', async () => {
  servidor('');
  (await import('./dataMode.js')).enterRemoteMode(config, vi.fn());
  expect(store.values.get(clau)).toEqual({ v: 1, mode: 'remote' });
  vi.resetModules();
  expect((await import('./dataMode.js')).resolveDataMode(config)).toBe('remote');
});

test('T13 · sense VITE_DATA_MODE (producció) el mode és remote encara que hi haja una elecció', async () => {
  store.values.set(clau, { v: 1, mode: 'remote', servidor: 'dev-a' });
  const { resolveDataMode } = await import('./dataMode.js');
  expect(resolveDataMode({ ...config, dataMode: undefined })).toBe('remote');
  expect(resolveDataMode({ ...config, dataMode: 'remote' })).toBe('remote');
});
