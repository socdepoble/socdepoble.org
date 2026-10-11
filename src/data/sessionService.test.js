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
  const config = { tenantId: '00000000-0000-4000-8000-000000000000' };
  /* Mutar l'objecte després de registrar-lo no ha d'arribar a la sessió: el
     rol es consulta amb el tenant del moment del registre. */
  const release = setSessionConfig(config, owner); config.tenantId = '00000000-0000-4000-8000-000000000002';
  /* L'alliberament va en finally: un propietari que quedara registrat faria
     fallar en cascada, amb «Dos instàncies», totes les proves següents. */
  try {
    await vi.dynamicImportSettled(); await flush();
    expect(mocks.role.mock.calls.at(-1)[0].tenantId).toBe('00000000-0000-4000-8000-000000000000');
    expect(() => setSessionConfig({ tenantId: '00000000-0000-4000-8000-000000000001' }, other)).toThrow('Dos instàncies');
  } finally { release(); }
  const second = setSessionConfig({ tenantId: '00000000-0000-4000-8000-000000000001' }, owner);
  try {
    expect(getSessionState().rol).toBe('desconegut');
  } finally { second(); }
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
    tenant_id: '00000000-0000-4000-8000-000000000000', transport: 'cookie' };
  const release = setSessionConfig(config, Symbol());
  try {
    await vi.dynamicImportSettled(); await flush();
    expect(mocks.role.mock.calls.at(-1)[0]).toMatchObject({
      backendId: 'wordpress', backendUrl: config.backend_url, tenantId: '00000000-0000-4000-8000-000000000000', transport: 'cookie'
    });
    await renovaAra();
    expect(mocks.refresh.mock.calls.at(-1)[0]).toMatchObject({
      backendUrl: config.backend_url, tenantId: '00000000-0000-4000-8000-000000000000', transport: 'cookie'
    });
  } finally { release(); }
});

test('T18 · dos embeds poden compartir sessió amb tema, idioma i àlies diferents', async () => {
  mocks.user = { id: 'A' };
  mocks.role.mockResolvedValue('usuari');
  const config = {
    backendId: 'wordpress', backend_url: 'https://poble.test/wp-json/sdp/v1/', tenant_id: '00000000-0000-4000-8000-000000000000',
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
      tenantId: '00000000-0000-4000-8000-000000000000', backendUrl: 'https://poble.test/wp-json/sdp/v1', backendId: 'wordpress',
      authOptions: { audience: 'poble', mode: 'host' }, transport: 'cookie',
      themeMode: 'light', language: 'es', routerType: 'browser', basename: '/segon',
      basePath: '/assets/segon', fontsHref: 'https://fonts.example/segon.css',
      pluginUrl: '/plugin/segon', manageDocumentHead: false, version: '2'
    }, Symbol());
    expect(getSessionState()).toMatchObject({ generacio, rol: 'usuari' });
    await vi.dynamicImportSettled(); await flush();
    expect(mocks.role.mock.calls.at(-1)[0]).toMatchObject({
      backendUrl: 'https://poble.test/wp-json/sdp/v1', tenantId: '00000000-0000-4000-8000-000000000000',
      transport: 'cookie', authOptions: { mode: 'host', audience: 'poble' }
    });
  } finally { second?.(); release(); }
});

test('Enxufe · dos embeds amb nomPoble, poble i rutaInicial diferents comparteixen sessió', async () => {
  mocks.user = { id: 'A' };
  mocks.role.mockResolvedValue('usuari');
  const comuna = { backendId: 'supabase', backendUrl: 'https://poble.test', tenantId: '00000000-0000-4000-8000-000000000000' };
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
    expect(() => setSessionConfig({ ...comuna, tenantId: '00000000-0000-4000-8000-000000000003', poble: 'penaguila' }, Symbol()))
      .toThrow('Dos instàncies');
  } finally { second?.(); release(); }
});

/* Auditoria 261007 (B) · ruta-a-url (només la primera instància, segons el
   contracte), apps i traductor-url són claus de l'amfitrió: no identifiquen la
   sessió. Abans la segona instància petava amb «Dos instàncies…». */
test('Enxufe · dos embeds amb rutaAUrl, apps i traductorUrl diferents comparteixen sessió', async () => {
  mocks.user = { id: 'A' };
  mocks.role.mockResolvedValue('usuari');
  const comuna = { backendId: 'supabase', backendUrl: 'https://poble.test', tenantId: '00000000-0000-4000-8000-000000000000' };
  const owner = Symbol();
  const release = setSessionConfig({ ...comuna, rutaAUrl: 'fragment', apps: ['bar'],
    traductorUrl: 'https://poble.test/wp-json/sdp/v1/traductor' }, owner);
  let second, calenta;
  try {
    await vi.dynamicImportSettled(); await flush();
    const generacio = getSessionState().generacio;
    expect(() => { second = setSessionConfig({ ...comuna }, Symbol()); }).not.toThrow();
    expect(getSessionState()).toMatchObject({ generacio, rol: 'usuari' });
    // Una app registrada en calent (la mateixa instància) no mou la generació.
    calenta = setSessionConfig({ ...comuna, rutaAUrl: 'fragment', apps: ['bar', 'nevera'],
      traductorUrl: 'https://poble.test/wp-json/sdp/v1/traductor' }, owner);
    expect(getSessionState().generacio).toBe(generacio);
    // Una opció desconeguda continua sent identitat.
    expect(() => setSessionConfig({ ...comuna, transport: 'bearer' }, Symbol())).toThrow('Dos instàncies');
  } finally { second?.(); calenta?.(); release(); }
});

test.each([
  { transport: 'bearer' },
  { authOptions: { audience: 'altre-poble' } },
  { oauthRelayUrl: 'https://auth.example/altre-callback' }
])('T18 · canviar transport o autenticació entre embeds és incompatible: %j', diferencia => {
  const config = {
    backendId: 'wordpress', backendUrl: 'https://poble.test/wp-json/sdp/v1', tenantId: '00000000-0000-4000-8000-000000000000',
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

/* Auditoria 261007 (B) · getCurrentUser torna un JSON.parse nou a cada crida i
   el temporitzador sincronitza cada ≤10 min: sense canvis, cap avís ni cap
   referència nova; un canvi de contingut amb el mateix id (actualitzaUsuari)
   sí que avisa. */
test('una sincronització sense canvis no avisa ni canvia la referència de l’usuari', async () => {
  buida(); await flush();
  mocks.role.mockResolvedValue('usuari');
  mocks.user = { id: 'A', nom: 'Anna' };
  sincronitza(); await flush();
  expect(getSessionState()).toMatchObject({ estat: 'dins', rol: 'usuari', usuari: { id: 'A', nom: 'Anna' } });
  const abans = getSessionState();
  const avisos = [];
  const deixa = subscribeSession(s => avisos.push(s));
  avisos.length = 0;   // subscribeSession avisa de seguida amb l'estat actual
  try {
    const consultes = mocks.role.mock.calls.length;
    mocks.user = { id: 'A', nom: 'Anna' };   // objecte nou, mateix contingut
    sincronitza(); await flush();
    // El rol es torna a consultar (un rol revocat s'ha de vore), però el mateix rol no avisa.
    expect(mocks.role.mock.calls.length).toBe(consultes + 1);
    expect(avisos).toEqual([]);
    expect(getSessionState()).toBe(abans);
    mocks.user = { id: 'A', nom: 'Anna Maria' };   // mateix id, nom nou
    sincronitza(); await flush();
    expect(avisos).toHaveLength(1);
    expect(getSessionState().usuari).toEqual({ id: 'A', nom: 'Anna Maria' });
    expect(getSessionState().generacio).toBe(abans.generacio);
  } finally { deixa(); buida(); }
});

/* Onada 11 (261010; prompt 261010_1730, tasca 2) · El nivell d'asseguranca
   (claim aal) viatja amb l'estat i un canvi de nivell avisa, com el de rol:
   el verify del segon factor desa una sessió nova (renovació) i avisa amb
   sdp:auth-change, i la interfície ha de vore que ja és aal2. */
const jwtAmb = (extra) => `${b64u({ alg: 'none' })}.${b64u({ sub: 'A', exp: Math.floor(Date.now() / 1000) + 3600, ...extra })}.c2ln`;
test('Onada 11 · l’estat porta nivell (aal del JWT desat) i un canvi de nivell amb el mateix usuari avisa una vegada', async () => {
  buida(); await flush();
  mocks.role.mockResolvedValue('superadmin');
  desaSessio({ access_token: jwtAmb({ aal: 'aal1' }), refresh_token: 'r1', user: { id: 'A' } });
  mocks.user = { id: 'A' };
  sincronitza(); await flush();
  expect(getSessionState()).toMatchObject({ estat: 'dins', rol: 'superadmin', nivell: 'aal1' });
  const avisos = [];
  const deixa = subscribeSession(s => avisos.push(s.nivell));
  avisos.length = 0;
  try {
    /* Com fa verificaFactor (segonFactor.js): la sessió nova com a renovació i l'avís. */
    expect(desaSessio({ access_token: jwtAmb({ aal: 'aal2' }), refresh_token: 'r2', user: { id: 'A' } }, { renovacio: true })).toBe(true);
    window.dispatchEvent(new CustomEvent('sdp:auth-change'));
    await flush();
    expect(getSessionState().nivell).toBe('aal2');
    /* El primer avís ja porta el nivell nou; el segon és la reconsulta del rol
       que fa tota renovació (la generació es mou). Cap avís torna a aal1. */
    expect(avisos[0]).toBe('aal2');
    expect(avisos.every((n) => n === 'aal2')).toBe(true);
    expect(getSessionState().rol).toBe('superadmin');
    /* Una sincronització sense canvis no avisa ni canvia la referència. */
    const abans = getSessionState();
    avisos.length = 0;
    sincronitza(); await flush();
    expect(avisos).toEqual([]);
    expect(getSessionState()).toBe(abans);
  } finally { deixa(); buida(); }
  /* Fora de la sessió, el nivell torna a null. */
  expect(getSessionState()).toMatchObject({ estat: 'fora', nivell: null });
});

test('Onada 11 · un JWT opac (sense claim aal) deixa el nivell a null, sense fer caure la sessió', async () => {
  buida(); await flush();
  mocks.role.mockResolvedValue('usuari');
  desaSessio({ access_token: 'jwt-opac', refresh_token: 'r1', user: { id: 'A' } });
  mocks.user = { id: 'A' };
  sincronitza(); await flush();
  expect(getSessionState()).toMatchObject({ estat: 'dins', usuari: { id: 'A' }, nivell: null });
  buida();
});

test('un rol nou sí que avisa, una sola vegada', async () => {
  buida(); await flush();
  mocks.role.mockResolvedValue('usuari');
  mocks.user = { id: 'A' };
  sincronitza(); await flush();
  const avisos = [];
  const deixa = subscribeSession(s => avisos.push(s.rol));
  avisos.length = 0;
  try {
    mocks.role.mockResolvedValue('superadmin');
    sincronitza(); await flush();
    expect(avisos).toEqual(['superadmin']);
  } finally { deixa(); buida(); }
});
