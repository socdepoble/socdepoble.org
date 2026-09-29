import { afterEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ user: { id: 'A' }, role: vi.fn(), refresh: vi.fn(), logout: vi.fn() }));
vi.mock('./backendPort.js', () => ({ getCurrentUser: () => mocks.user, teCapacitat: () => true,
  elMeuRol: mocks.role, refrescaSessio: mocks.refresh, logout: mocks.logout }));
vi.mock('../host.js', () => ({ quanLlest: async () => undefined }));
import { sincronitza, setSessionConfig, getSessionState, renovaAra, subscribeSession } from './sessionService.js';
import { desaSessio, esborraSessio } from './identitat.js';
const flush = async () => { for (let i = 0; i < 6; i++) await Promise.resolve(); };
const b64u = (o) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const jwt = (segons) => `${b64u({ alg: 'none' })}.${b64u({ sub: 'A', exp: Math.floor(Date.now() / 1000) + segons })}.c2ln`;
const sessioCaducada = () => desaSessio({ access_token: jwt(-60), refresh_token: 'r1', user: { id: 'A' } });
/* Deixa la sessió com la deixa un logout real: res desat i l'estat resincronitzat. */
const buida = () => { esborraSessio(); mocks.user = null; sincronitza(); };
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

test('T18 · rol i renovació reben endpoint i opcions d’un backend alternatiu', async () => {
  mocks.user = { id: 'A' };
  mocks.role.mockResolvedValue('usuari');
  mocks.refresh.mockResolvedValue(true);
  const config = { backendId: 'wordpress', backend_url: 'https://poble.test/wp-json/sdp/v1',
    tenant_id: 'poble', transport: 'cookie' };
  const release = setSessionConfig(config, Symbol());
  try {
    await vi.dynamicImportSettled(); await flush();
    expect(mocks.role.mock.calls.at(-1)[0]).toMatchObject({
      backendId: 'wordpress', backendUrl: config.backend_url, tenantId: 'poble', transport: 'cookie'
    });
    await renovaAra();
    expect(mocks.refresh.mock.calls.at(-1)[0]).toMatchObject({
      backendUrl: config.backend_url, tenantId: 'poble', transport: 'cookie'
    });
  } finally { release(); }
});

test('T18 · dos embeds poden compartir sessió amb tema, idioma i àlies diferents', async () => {
  mocks.user = { id: 'A' };
  mocks.role.mockResolvedValue('usuari');
  const config = {
    backendId: 'wordpress', backend_url: 'https://poble.test/wp-json/sdp/v1/', tenant_id: 'poble',
    transport: 'cookie', authOptions: { mode: 'host', audience: 'poble' },
    themeMode: 'dark', language: 'ca', routerType: 'memory', basename: '/primer',
    basePath: '/assets/primer', fontsHref: 'https://fonts.example/primer.css',
    pluginUrl: '/plugin/primer', manageDocumentHead: true, version: '1'
  };
  const release = setSessionConfig(config, Symbol());
  let second;
  try {
    await vi.dynamicImportSettled(); await flush();
    const generacio = getSessionState().generacio;
    second = setSessionConfig({
      tenantId: 'poble', backendUrl: 'https://poble.test/wp-json/sdp/v1', backendId: 'wordpress',
      authOptions: { audience: 'poble', mode: 'host' }, transport: 'cookie',
      themeMode: 'light', language: 'es', routerType: 'browser', basename: '/segon',
      basePath: '/assets/segon', fontsHref: 'https://fonts.example/segon.css',
      pluginUrl: '/plugin/segon', manageDocumentHead: false, version: '2'
    }, Symbol());
    expect(getSessionState()).toMatchObject({ generacio, rol: 'usuari' });
    await vi.dynamicImportSettled(); await flush();
    expect(mocks.role.mock.calls.at(-1)[0]).toMatchObject({
      backendUrl: 'https://poble.test/wp-json/sdp/v1', tenantId: 'poble',
      transport: 'cookie', authOptions: { mode: 'host', audience: 'poble' }
    });
  } finally { second?.(); release(); }
});

test('Enxufe · dos embeds amb nomPoble, poble i rutaInicial diferents comparteixen sessió', async () => {
  mocks.user = { id: 'A' };
  mocks.role.mockResolvedValue('usuari');
  const comuna = { backendId: 'supabase', backendUrl: 'https://poble.test', tenantId: 'poble' };
  const release = setSessionConfig({ ...comuna, nomPoble: 'Gent de la Torre',
    poble: 'la-torre-de-les-macanes', rutaInicial: '/pobles/la-torre-de-les-macanes' }, Symbol());
  let second;
  try {
    await vi.dynamicImportSettled(); await flush();
    const generacio = getSessionState().generacio;
    expect(() => {
      second = setSessionConfig({ ...comuna, nomPoble: 'Penàguila', poble: 'penaguila',
        rutaInicial: '/pobles/penaguila' }, Symbol());
    }).not.toThrow();
    expect(getSessionState()).toMatchObject({ generacio, rol: 'usuari' });
    // El tenantId sí que continua sent identitat: presentació no pot amagar-ne un canvi.
    expect(() => setSessionConfig({ ...comuna, tenantId: 'altre', poble: 'penaguila' }, Symbol()))
      .toThrow('Dos instàncies');
  } finally { second?.(); release(); }
});

test.each([
  { transport: 'bearer' },
  { authOptions: { audience: 'altre-poble' } },
  { oauthRelayUrl: 'https://auth.example/altre-callback' }
])('T18 · canviar transport o autenticació entre embeds és incompatible: %j', diferencia => {
  const config = {
    backendId: 'wordpress', backendUrl: 'https://poble.test/wp-json/sdp/v1', tenantId: 'poble',
    transport: 'cookie', authOptions: { audience: 'poble' }, oauthRelayUrl: 'https://auth.example/callback'
  };
  const release = setSessionConfig(config, Symbol());
  try {
    expect(() => setSessionConfig({ ...config, ...diferencia }, Symbol())).toThrow('Dos instàncies');
  } finally { release(); }
});

/* ───────── D6 · JWT caducat amb refresh token viu (auditoria 260925_1316) ───────── */

test('D6: JWT caducat amb refresh token → comprovant, una renovació i dins; mai fora pel camí', async () => {
  buida(); await flush(); mocks.refresh.mockReset(); mocks.logout.mockReset();
  sessioCaducada(); mocks.role.mockResolvedValue('usuari');
  let acaba; mocks.refresh.mockImplementationOnce(() => new Promise(resolve => { acaba = resolve; }));
  const estats = []; const deixa = subscribeSession(s => estats.push(s.estat));
  estats.length = 0;   // subscribeSession avisa de seguida amb l'estat previ (fora, per buida())
  sincronitza();
  expect(getSessionState()).toMatchObject({ estat: 'comprovant', usuari: null });
  await flush();
  expect(mocks.refresh).toHaveBeenCalledTimes(1);
  // El backend desa la sessió renovada i avisa, com fa auth.js:renova().
  desaSessio({ access_token: jwt(3600), refresh_token: 'r2', user: { id: 'A' } }); mocks.user = { id: 'A' };
  window.dispatchEvent(new CustomEvent('sdp:auth-change'));
  acaba(true); await flush();
  deixa();
  expect(getSessionState()).toMatchObject({ estat: 'dins', usuari: { id: 'A' }, rol: 'usuari' });
  expect(estats).not.toContain('fora');
  expect(mocks.refresh).toHaveBeenCalledTimes(1);
  buida();
});
test('D6: rellotge desquadrat (el token nou ja naix caducat): un sol intent i fora, sense bucle', async () => {
  buida(); await flush(); mocks.refresh.mockReset();
  sessioCaducada();
  mocks.refresh.mockImplementation(async () => {
    desaSessio({ access_token: jwt(-30), refresh_token: 'r2', user: { id: 'A' } });
    window.dispatchEvent(new CustomEvent('sdp:auth-change'));
    return true;
  });
  sincronitza(); await flush(); await flush();
  expect(mocks.refresh).toHaveBeenCalledTimes(1);
  expect(getSessionState()).toMatchObject({ estat: 'fora', usuari: null });
  buida();
});
test('D6: si la renovació no torna sessió no es queda penjat en comprovant', async () => {
  buida(); await flush(); mocks.refresh.mockReset(); mocks.logout.mockReset();
  sessioCaducada(); mocks.refresh.mockResolvedValue(false);
  sincronitza(); await flush(); await flush();
  expect(mocks.refresh).toHaveBeenCalledTimes(1);
  expect(mocks.logout).toHaveBeenCalled();
  expect(getSessionState()).toMatchObject({ estat: 'fora' });
  buida();
});
test('D6: sense refresh token no hi ha res a recuperar: fora de seguida i cap crida', async () => {
  buida(); await flush(); mocks.refresh.mockReset();
  desaSessio({ access_token: jwt(-60), user: { id: 'A' } });
  sincronitza(); await flush();
  expect(getSessionState()).toMatchObject({ estat: 'fora' });
  expect(mocks.refresh).not.toHaveBeenCalled();
  buida();
});
