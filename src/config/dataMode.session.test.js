import { afterEach, expect, test, vi } from 'vitest';
vi.mock('./runtimePolicy.js', () => ({ getRuntimePolicy: () => ({ auth: {
  issuer: 'https://auth.example.test', audiences: ['authenticated'], persistencia: 'local'
} }) }));
const config = { dataMode: 'seed', backendUrl: 'https://api.example.test', tenantId: 'poble' };
const id = '11111111-2222-4333-8444-555555555555';
const b64 = value => btoa(JSON.stringify(value)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const session = { access_token: `${b64({ alg: 'none' })}.${b64({ sub: id, iss: 'https://auth.example.test', aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })}.c2ln`,
  refresh_token: 'synthetic-refresh', user: { id } };
afterEach(() => { sessionStorage.clear(); localStorage.clear(); vi.resetModules(); });

test('seed → recàrrega remota elimina credencials antigues; la sessió real sobreviu al retorn OAuth i a una pestanya nova', async () => {
  vi.resetModules();
  const original = await import('../data/identitat.js');
  const mode = await import('./dataMode.js');
  original.configuraBackendSessio(config);
  expect(original.desaSessio(session)).toBe(true);
  mode.enterRemoteMode(config, vi.fn());
  expect(original.jwtPerBackend(config)).toBe(session.access_token);

  // Nou document: el mode remot es resol abans de restaurar la identitat.
  vi.resetModules();
  const real = await import('../data/identitat.js');
  const { backendScope, normalizeBackendConfig } = await import('./backendConfig.js');
  real.configuraBackendSessio(config);
  expect(normalizeBackendConfig(config).dataMode).toBe('remote');
  expect(real.jwtPerBackend(config)).toBeNull();
  expect(real.triaRefresc()).toBeNull();
  expect(real.desaSessio(session)).toBe(true);
  const scopeOAuth = backendScope(config);

  sessionStorage.clear();
  vi.resetModules();
  const restored = await import('../data/identitat.js');
  const again = await import('./backendConfig.js');
  restored.configuraBackendSessio(config);
  expect(again.backendScope(config)).toBe(scopeOAuth);
  expect(restored.triaRefresc()).toMatchObject({ rt: session.refresh_token, sub: id, mode: 'restauracio' });
});
