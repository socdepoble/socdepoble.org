import { beforeEach, expect, test, vi } from 'vitest';
const store = vi.hoisted(() => ({ values: new Map(), writable: true }));
vi.mock('./storage.js', () => ({ getVal: (key, fallback) => store.values.get(key) ?? fallback, setVal: (key, value) => {
  if (!store.writable) return false;
  store.values.set(key, value);
  return true;
} }));
vi.mock('./runtimePolicy.js', () => ({ getRuntimePolicy: () => null }));
const config = { backendId: 'custom', backendUrl: 'https://example.test/api', tenantId: 'poble', dataMode: 'seed' };
beforeEach(() => { vi.resetModules(); store.values.clear(); store.writable = true; });

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
  store.values.set(`data-mode-choice:${JSON.stringify(['custom', 'https://example.test/api', 'poble'])}`, { v: 1, mode: 'remote' });
  expect(resolveDataMode(config)).toBe('seed');
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
