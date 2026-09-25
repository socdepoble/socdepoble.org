import { afterEach, expect, test, vi } from 'vitest';
/* La política és un singleton immutable de mòdul: cada prova en carrega una còpia verge. */
const fresca = async () => { vi.resetModules(); return import('./runtimePolicy.js'); };
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

test('sense configurar: la lectura estricta no inventa res i la normal congela la de defecte', async () => {
  const p = await fresca(); vi.spyOn(console, 'warn').mockImplementation(() => {});
  expect(p.getRuntimePolicy(true)).toBeNull();
  const politica = p.getRuntimePolicy();
  expect(Object.isFrozen(politica)).toBe(true);
  expect(Object.isFrozen(politica.auth)).toBe(true);
  expect(Object.isFrozen(politica.auth.audiences)).toBe(true);
  expect(politica.auth.audiences).toEqual(['socdepoble']);
  expect(p.getRuntimePolicy(true)).toBe(politica);
});
test('és immutable: una segona configuració llança i l’emissor no canvia', async () => {
  const p = await fresca();
  p.setRuntimePolicy({ auth: { issuer: 'https://auth.example.test', audiences: ['authenticated'] } });
  expect(() => p.setRuntimePolicy({ auth: { issuer: 'https://atacant.example' } })).toThrow('immutable');
  expect(p.getRuntimePolicy().auth).toMatchObject({ issuer: 'https://auth.example.test', audiences: ['authenticated'] });
});
test('emissor: el de l’amfitrió guanya; si no n’hi ha, el de VITE_SOLLUTIA_ISSUER', async () => {
  vi.stubEnv('VITE_SOLLUTIA_ISSUER', 'https://entorn.example.test');
  let p = await fresca();
  expect(p.setRuntimePolicy({ auth: { issuer: 'https://amfitrio.example.test' } }).auth.issuer).toBe('https://amfitrio.example.test');
  p = await fresca();
  expect(p.setRuntimePolicy({}).auth.issuer).toBe('https://entorn.example.test');
});
test('un backend amb clau privada es rebutja abans de congelar res', async () => {
  const p = await fresca();
  expect(() => p.setRuntimePolicy({ backend: { supabaseUrl: 'https://backend.example.test', anonKey: 'sb_secret_x' } })).toThrow();
  expect(p.getRuntimePolicy(true)).toBeNull();
});
test('esOrigenPermes: igualtat de host i HTTPS; mai prefixos, sufixos ni esquemes febles', async () => {
  const p = await fresca();
  for (const o of ['https://socdepoble.org', 'https://auth.socdepoble.org', 'https://sollutia.cat', 'https://socdepoble.sollutia.com', 'https://v2.sollutia.com'])
    expect(p.esOrigenPermes(o), o).toBe(true);
  for (const o of ['http://socdepoble.org', 'https://socdepoble.org.atacant.example', 'https://atacant-socdepoble.org',
    'https://x.socdepoble.org', 'javascript:alert(1)', 'no és un origen', '', null, undefined])
    expect(p.esOrigenPermes(o), String(o)).toBe(false);
});
test('esOrigenPermes: localhost només als ports coneguts i només si l’app mateixa corre en localhost', async () => {
  const p = await fresca();
  expect(p.esOrigenPermes('http://localhost:3340')).toBe(true);
  expect(p.esOrigenPermes('http://localhost:9999')).toBe(false);
  vi.stubGlobal('window', { location: { hostname: 'socdepoble.org' } });
  expect(p.esOrigenPermes('http://localhost:3340')).toBe(false);
});
test('esOrigenPermes: els orígens extra de l’amfitrió es comparen per origen exacte', async () => {
  const p = await fresca();
  p.setRuntimePolicy({ auth: { issuer: 'https://auth.example.test', parentOrigins: ['https://amfitrio.example.test'] } });
  expect(p.esOrigenParePermes('https://amfitrio.example.test')).toBe(true);
  expect(p.esOrigenParePermes('https://amfitrio.example.test.atacant.cat')).toBe(false);
  expect(p.esOrigenParePermes('http://amfitrio.example.test')).toBe(false);
});

test('una política explícita substituïx els defaults i separa pare de callback', async () => {
  const p = await fresca();
  const parents = ['https://pare.example.test:8443'];
  p.setRuntimePolicy({ auth: { issuer: 'https://auth.example.test', parentOrigins: parents, callbackOrigins: [] } });
  expect(Object.isFrozen(parents)).toBe(false);
  parents.push('https://socdepoble.org');
  expect(p.esOrigenParePermes('https://socdepoble.org')).toBe(false);
  expect(p.esOrigenParePermes('https://pare.example.test:8443')).toBe(true);
  expect(p.esOrigenParePermes('https://pare.example.test')).toBe(false);
  expect(p.esOrigenCallbackPermes('https://auth.socdepoble.org')).toBe(false);
});
test('ports aliens, camins, credencials i comodins mai són orígens', async () => {
  const p = await fresca();
  for (const origin of ['https://socdepoble.org:444', 'https://socdepoble.org/path', 'https://u@socdepoble.org', 'ftp://localhost:3340']) {
    expect(p.esOrigenParePermes(origin)).toBe(false);
    expect(p.esOrigenCallbackPermes(origin)).toBe(false);
  }
  expect(() => p.setRuntimePolicy({ auth: { parentOrigins: ['*'] } })).toThrow('orígens exactes');
  expect(p.getRuntimePolicy(true)).toBeNull();
});
