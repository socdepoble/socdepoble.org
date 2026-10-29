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
test('D1: persistencia «local» per defecte, «pestanya» acceptada, qualsevol altra llança sense congelar', async () => {
  let p = await fresca(); vi.spyOn(console, 'warn').mockImplementation(() => {});
  expect(p.getRuntimePolicy().auth.persistencia).toBe('local');
  p = await fresca();
  expect(p.setRuntimePolicy({ auth: { persistencia: 'pestanya' } }).auth.persistencia).toBe('pestanya');
  p = await fresca();
  expect(() => p.setRuntimePolicy({ auth: { persistencia: 'cookie' } })).toThrow('persistencia');
  expect(p.getRuntimePolicy(true)).toBeNull();
});
test('un backend amb clau privada es rebutja abans de congelar res', async () => {
  const p = await fresca();
  expect(() => p.setRuntimePolicy({ backend: { supabaseUrl: 'https://backend.example.test', anonKey: 'sb_secret_x' } })).toThrow();
  expect(p.getRuntimePolicy(true)).toBeNull();
});
test('esOrigenParePermes: igualtat de host i HTTPS; mai prefixos, sufixos ni esquemes febles', async () => {
  const p = await fresca();
  for (const o of ['https://socdepoble.org', 'https://sollutia.cat', 'https://socdepoble.sollutia.com'])
    expect(p.esOrigenParePermes(o), o).toBe(true);
  for (const o of ['http://socdepoble.org', 'https://socdepoble.org.atacant.example', 'https://atacant-socdepoble.org',
    'https://x.socdepoble.org', 'javascript:alert(1)', 'no és un origen', '', null, undefined])
    expect(p.esOrigenParePermes(o), String(o)).toBe(false);
});
test('esOrigenParePermes: localhost només als ports coneguts i només si l’app mateixa corre en localhost', async () => {
  const p = await fresca();
  expect(p.esOrigenParePermes('http://localhost:3340')).toBe(true);
  expect(p.esOrigenParePermes('http://localhost:9999')).toBe(false);
  vi.stubGlobal('window', { location: { hostname: 'socdepoble.org' } });
  expect(p.esOrigenParePermes('http://localhost:3340')).toBe(false);
});
/* Fase C (261019) · L'app nativa viu a localhost però no és el servidor de
   desenvolupament: https://localhost (Android) i capacitor://localhost (iOS). */
test('esOrigenParePermes: a l’app nativa, localhost no obri els ports de desenvolupament', async () => {
  const p = await fresca();
  for (const protocol of ['https:', 'capacitor:']) {
    vi.stubGlobal('window', { location: { protocol, hostname: 'localhost' } });
    expect(p.esOrigenParePermes('http://localhost:3340'), protocol).toBe(false);
    expect(p.esOrigenParePermes('https://socdepoble.org'), protocol).toBe(true);
  }
  vi.stubGlobal('window', { location: { protocol: 'http:', hostname: 'localhost' } });
  expect(p.esOrigenParePermes('http://localhost:3340')).toBe(true);
});
/* P1 (261003) · Model B. La tornada d'OAuth és la pàgina de l'amfitrió i la valida
   GoTrue: la política ja no porta cap llista d'orígens de tornada, ni cap domini
   del relé retirat. Un `callbackOrigins` de l'amfitrió s'ignora com qualsevol
   altra clau desconeguda d'`auth`. */
test('P1 · cap origen de tornada d’OAuth: ni validador, ni llista, ni el relé com a origen permés', async () => {
  const p = await fresca(); vi.spyOn(console, 'warn').mockImplementation(() => {});
  expect(p).not.toHaveProperty('esOrigenCallbackPermes');
  expect(p).not.toHaveProperty('esOrigenPermes');
  expect(p.getRuntimePolicy().auth).not.toHaveProperty('callbackOrigins');
  for (const o of ['https://auth.socdepoble.org', 'https://v2.sollutia.com']) expect(p.esOrigenParePermes(o), o).toBe(false);
  const q = await fresca();
  expect(q.setRuntimePolicy({ auth: { issuer: 'https://auth.example.test', callbackOrigins: ['*'] } }).auth).not.toHaveProperty('callbackOrigins');
});
test('esOrigenParePermes: els orígens extra de l’amfitrió es comparen per origen exacte', async () => {
  const p = await fresca();
  p.setRuntimePolicy({ auth: { issuer: 'https://auth.example.test', parentOrigins: ['https://amfitrio.example.test'] } });
  expect(p.esOrigenParePermes('https://amfitrio.example.test')).toBe(true);
  expect(p.esOrigenParePermes('https://amfitrio.example.test.atacant.cat')).toBe(false);
  expect(p.esOrigenParePermes('http://amfitrio.example.test')).toBe(false);
});

test('una política explícita substituïx els defaults', async () => {
  const p = await fresca();
  const parents = ['https://pare.example.test:8443'];
  p.setRuntimePolicy({ auth: { issuer: 'https://auth.example.test', parentOrigins: parents } });
  expect(Object.isFrozen(parents)).toBe(false);
  parents.push('https://socdepoble.org');
  expect(p.esOrigenParePermes('https://socdepoble.org')).toBe(false);
  expect(p.esOrigenParePermes('https://pare.example.test:8443')).toBe(true);
  expect(p.esOrigenParePermes('https://pare.example.test')).toBe(false);
});
test('ports aliens, camins, credencials i comodins mai són orígens', async () => {
  const p = await fresca();
  for (const origin of ['https://socdepoble.org:444', 'https://socdepoble.org/path', 'https://u@socdepoble.org', 'ftp://localhost:3340']) {
    expect(p.esOrigenParePermes(origin)).toBe(false);
  }
  expect(() => p.setRuntimePolicy({ auth: { parentOrigins: ['*'] } })).toThrow('orígens exactes');
  expect(p.getRuntimePolicy(true)).toBeNull();
});

/* T5.1 (ordre del Mestre, 261029) · La consola de l'amfitrió ha d'eixir neta: cap
   avís en arrencar sense emissor, ni amb configura({}) (setRuntimePolicy({})) ni
   amb la política de defecte que crea getRuntimePolicy() quan ningú no ha
   configurat res (host.js, arrenca). Qui té motiu per a dir-ho és el flux de
   validació de la sessió externa (identitat.js, adoptaSessioExterna), i només
   quan s'invoca: ací es prova amb el runtimePolicy real, sense cap simulació. */
test('T5.1 · arrencar sense emissor no escriu res a la consola, ni amb configura({}) ni amb la política de defecte', async () => {
  vi.stubEnv('VITE_SOLLUTIA_ISSUER', '');
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  let p = await fresca();
  expect(p.setRuntimePolicy({}).auth.issuer).toBeFalsy();
  p = await fresca();
  expect(p.getRuntimePolicy().auth.issuer).toBeFalsy();
  expect(p.getRuntimePolicy(true)).not.toBeNull();
  expect(warn).not.toHaveBeenCalled();
  expect(error).not.toHaveBeenCalled();
});
test('T5.1 · només el flux de sessió externa via JWT parla d’emissor, i només quan s’invoca sense cap', async () => {
  vi.stubEnv('VITE_SOLLUTIA_ISSUER', '');
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  const p = await fresca();
  const { adoptaSessioExterna } = await import('../data/identitat.js');
  p.setRuntimePolicy({});
  expect(warn).not.toHaveBeenCalled();
  expect(error).not.toHaveBeenCalled();
  // El JWT és sintètic i no es valida: sense emissor, el flux el rebutja abans de llegir-lo i ho diu una sola vegada.
  expect(adoptaSessioExterna({ access_token: 'capcalera.carrega.signatura' })).toBe(false);
  const missatges = [...warn.mock.calls, ...error.mock.calls].map(([missatge]) => String(missatge));
  expect(missatges).toHaveLength(1);
  expect(missatges[0]).toMatch(/emissor|issuer/);
  // Amb emissor, el mateix flux calla: cap avís de política en cap dels dos camins.
  warn.mockClear(); error.mockClear();
  const q = await fresca();
  const identitat = await import('../data/identitat.js');
  q.setRuntimePolicy({ auth: { issuer: 'https://auth.example.test' } });
  expect(identitat.adoptaSessioExterna({ access_token: 'capcalera.carrega.signatura' })).toBe(false);
  expect([...warn.mock.calls, ...error.mock.calls].filter(([missatge]) => /emissor|issuer/.test(String(missatge)))).toEqual([]);
});
