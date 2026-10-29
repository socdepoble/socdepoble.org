/* APP-D1 (pla 261029_0216, Pas 2; auditoria Gemini 261029_0336 §2.5) · Prova
   de conformitat de la degradació quan el servidor remot encara no té la
   migració 2610282100 (producció, 261029). A diferència d'auth.usuari.test.js
   (que simula rpc()), ací runtime.js és el de veres i només es simula fetch:
   PostgREST respon amb els seus cossos literals (un 404 de la ruta, PGRST202
   per a una funció o una signatura que no hi és, PGRST204 per a una columna
   del cos i 42703 per a una columna de Postgres) i es mira què fa el client
   en els quatre moments de l'alta: el registre amb correu, @usuari i poble;
   la primera entrada amb Google; la primera lectura de la fitxa; i desar
   l'@usuari i el poble des del perfil. També la guarda de regressió: amb la
   migració aplicada, les crides i les respostes són les de sempre.
   Fets fixats ací (verificats a HEAD 7a87205f3): completa_la_meua_alta té
   UNA signatura al client ({ p_tenant_id }) i no es reintenta amb cap altra;
   la lectura de la fila no nomena cap columna; cap PATCH no escriu username
   ni town_uuid. Noms i identificadors sintètics. */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ user: null, peticions: [], servidor: null, canvis: vi.fn() }));
vi.mock('../../config/publicCredentials.js', () => ({ validatePublicCredentials: () => {} }));
vi.mock('../appSeed.js', () => ({
  APP_SEED: { agents: [], chatThreads: [], chatMessages: [], feedPosts: [], marketItems: [], events: [], towns: [], mediaItems: [], noteFolders: [], notes: [], pages: [] },
  APP_SEED_VERSION: 'sintetic', getDefaultUserId: () => 'A'
}));
vi.mock('../../config/storage.js', () => ({ getEfimer: () => null }));
vi.mock('../recuperacioPendent.js', () => ({
  ESTAT_ENLLAC: Object.freeze({ PENDENT: 'pendent', PERDUT: 'perdut' }),
  marcaRecuperacioPendent: vi.fn(), oblidaRecuperacioPendent: vi.fn(),
  anunciaEnllacDeRecuperacio: vi.fn(), oblidaEnllacDeRecuperacio: vi.fn(),
  estatEnllacDeRecuperacio: () => null, escoltaRecuperacioPendent: () => () => {}
}));
/* La sessió viu en m.user: desaSessio la posa (el registre i Google) i el JWT
   hi viatja; cap renovació ni cap canvi de versió pel camí. */
vi.mock('../identitat.js', () => ({
  configuraBackendSessio: vi.fn(), esBackendDeSessio: () => true, jwtPerBackend: () => (m.user ? 'jwt-sintetic' : null),
  CLAU_REFRESC: 'refresh', CLAU_JWT: 'jwt', CLAU_ORIGEN: 'origen', CLAU_USUARI: 'usuari', versioSessio: 0,
  triaRefresc: () => null, rotaRegistre: vi.fn(), oblidaRegistre: vi.fn(),
  desaSessio: (sessio) => { m.user = sessio.user; return true; },
  capturaSessio: () => () => {}, esborraSessio: vi.fn(), usuariDeSessio: () => m.user, actualitzaUsuariSessio: m.canvis,
  caducitatJwt: () => null, MARGE_RENOVACIO_MS: 60_000
}));
vi.mock('../oauthRelay.js', () => ({
  entraAmbGoogle: vi.fn(), gestionaTornada: vi.fn(), exigeixSenseMarcAlie: vi.fn(),
  urlDeTornadaAlta: vi.fn(() => null), urlDeTornadaRecuperacio: vi.fn(() => null), recullMarcaDeRecuperacio: vi.fn(() => null)
}));
vi.mock('./realtime.js', () => ({ tancaRealtime: vi.fn(async () => {}) }));
vi.mock('./config.js', () => ({ resetClient: vi.fn() }));
import { getProfile, recullTornadaOAuth, registerWithPassword, updateProfile } from './auth.js';
import { gestionaTornada } from '../oauthRelay.js';
import { MISSATGES_USERNAME } from '../../sections/onboarding/onboardingModel.js';

const TENANT = '00000000-0000-4000-8000-00000000000a';
const CONFIG = Object.freeze({ supabaseUrl: 'https://example.test', supabaseAnonKey: 'clau-publica', tenantId: TENANT });
const ARA = '2026-10-29T04:00:00.000Z';

/* Els cossos literals de PostgREST (i el 404 de la passarel·la sense ruta). */
const RUTA_ABSENT = Object.freeze({ status: 404, cos: { message: 'no Route matched with those values' } });
const pgrst202 = (nom, parametres, suggerida = null) => ({ status: 404, cos: {
  code: 'PGRST202',
  message: `Could not find the function public.${nom}(${parametres}) in the schema cache`,
  details: `Searched for the function public.${nom} with parameter ${parametres} or with a single unnamed json/jsonb parameter, but no matches were found in the schema cache.`,
  hint: suggerida ? `Perhaps you meant to call the function public.${nom}(${suggerida})` : null
} });
const pgrst204 = (columna) => ({ status: 400, cos: { code: 'PGRST204', message: `Could not find the '${columna}' column of 'profiles' in the schema cache`, details: null, hint: null } });
const pg42703 = (columna) => ({ status: 400, cos: { code: '42703', message: `column profiles.${columna} does not exist`, details: null, hint: null } });
const OK = (cos) => ({ status: 200, cos });
const SESSIO = (id, data) => OK({ access_token: `jwt-${id}`, refresh_token: 'refresc', token_type: 'bearer', user: { id, aud: 'authenticated', user_metadata: data } });
/* L'alta completada amb la signatura de 2609261500. */
const ALTA = OK({ poble: TENANT, poble_nou: false, baixa_demanada_at: null });

/* El servidor d'una prova: regles [patró de «MÈTODE camí», resposta o funció
   de la petició]; sense cap regla que case, 200 []. */
const servidor = (regles) => (peticio) => {
  for (const [patro, resposta] of regles) {
    if (patro.test(`${peticio.metode} ${peticio.cami}`)) return typeof resposta === 'function' ? resposta(peticio) : resposta;
  }
  return OK([]);
};
const crides = () => m.peticions.map((p) => `${p.metode} ${p.cami}`);
const deRpc = (nom) => m.peticions.filter((p) => p.cami === `/rest/v1/rpc/${nom}`);
/* Les promeses de millor esforç (completaAlta, reafirmaAvatarPropi) acaben soles. */
const buida = () => new Promise((resolve) => { setTimeout(resolve, 0); });

let avis;
beforeEach(() => {
  m.user = null; m.peticions = []; m.canvis.mockReset();
  m.servidor = servidor([]);
  avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn(async (url, init = {}) => {
    const { pathname, search } = new URL(url);
    const peticio = { metode: init.method || 'GET', cami: pathname + search, cos: init.body === undefined ? undefined : JSON.parse(init.body) };
    m.peticions.push(peticio);
    const r = m.servidor(peticio);
    const text = JSON.stringify(r.cos ?? null);
    return { ok: r.status >= 200 && r.status < 300, status: r.status, text: async () => text, json: async () => r.cos, headers: { get: () => null } };
  }));
});
afterEach(() => { avis.mockRestore(); vi.unstubAllGlobals(); });

describe('1 · el registre amb correu, @usuari i poble', () => {
  const METADADES = Object.freeze({ full_name: 'Anna Pérez Soler', accepta_rgpd: true, tenant_id: TENANT, username: 'anna-p', town_name: 'Penàguila' });
  test.each([
    ['la ruta no hi és (404 de la passarel·la)', RUTA_ABSENT],
    ['la funció no hi és (PGRST202)', pgrst202('completa_la_meua_alta', 'p_tenant_id')],
    ['la signatura no casa (PGRST202 amb suggeriment)', pgrst202('completa_la_meua_alta', 'p_tenant_id', 'p_tenant_id, p_username')],
  ])('completa_la_meua_alta: %s → l’alta no cau, cap avís i cap altra signatura', async (_, resposta) => {
    m.servidor = servidor([
      [/^POST \/auth\/v1\/signup/, (p) => SESSIO('U-1', p.cos.data)],
      [/^POST \/rest\/v1\/rpc\/completa_la_meua_alta$/, resposta],
    ]);
    const resultat = await registerWithPassword('anna@poble.test', 'contrasenya-llarga', METADADES, CONFIG);
    expect(resultat.access_token).toBe('jwt-U-1');
    /* Les metadades viatgen senceres: l'@usuari i el poble es queden a GoTrue,
       mai es descarten en silenci (el disparador de la migració les llegirà
       a l'alta i el client completa el poble en la primera lectura). */
    expect(m.peticions[0]).toMatchObject({ metode: 'POST', cami: '/auth/v1/signup', cos: { email: 'anna@poble.test', data: METADADES } });
    await vi.waitFor(() => expect(deRpc('completa_la_meua_alta')).toHaveLength(1));
    await buida();
    expect(deRpc('completa_la_meua_alta')[0].cos).toEqual({ p_tenant_id: TENANT });
    expect(crides()).toEqual(['POST /auth/v1/signup', 'POST /rest/v1/rpc/completa_la_meua_alta']);
    expect(avis).not.toHaveBeenCalled();
  });

  test('regressió · amb la migració, l’alta és la de sempre: una sola crida, { p_tenant_id } i cap avís', async () => {
    m.servidor = servidor([
      [/^POST \/auth\/v1\/signup/, (p) => SESSIO('U-1', p.cos.data)],
      [/^POST \/rest\/v1\/rpc\/completa_la_meua_alta$/, ALTA],
    ]);
    await registerWithPassword('anna@poble.test', 'contrasenya-llarga', METADADES, CONFIG);
    await vi.waitFor(() => expect(deRpc('completa_la_meua_alta')).toHaveLength(1));
    await buida();
    expect(deRpc('completa_la_meua_alta')[0].cos).toEqual({ p_tenant_id: TENANT });
    expect(avis).not.toHaveBeenCalled();
  });

  test('els altres errors de l’alta continuen avisant una vegada (500)', async () => {
    m.servidor = servidor([
      [/^POST \/auth\/v1\/signup/, (p) => SESSIO('U-1', p.cos.data)],
      [/^POST \/rest\/v1\/rpc\/completa_la_meua_alta$/, { status: 500, cos: { message: 'res' } }],
    ]);
    await registerWithPassword('anna@poble.test', 'contrasenya-llarga', METADADES, CONFIG);
    await vi.waitFor(() => expect(avis).toHaveBeenCalledTimes(1));
    expect(avis.mock.calls[0][0]).toBe('[supabase] Avís completant l’alta:');
  });

  test('sense sessió (confirmació per correu pendent) no es crida cap RPC: res a degradar', async () => {
    m.servidor = servidor([[/^POST \/auth\/v1\/signup/, OK({ id: 'U-1', confirmation_sent_at: ARA })]]);
    await registerWithPassword('anna@poble.test', 'contrasenya-llarga', METADADES, CONFIG);
    await buida();
    expect(crides()).toEqual(['POST /auth/v1/signup']);
  });
});

describe('2 · la primera entrada amb Google', () => {
  test('completa_la_meua_alta amb PGRST202: l’entrada torna la sessió, { p_tenant_id } només i cap avís', async () => {
    const sessio = SESSIO('U-G', { full_name: 'Anna Pérez Soler', avatar_url: 'https://lh3.googleusercontent.com/a/foto' }).cos;
    gestionaTornada.mockResolvedValueOnce(sessio);
    m.user = sessio.user;
    m.servidor = servidor([[/^POST \/rest\/v1\/rpc\/completa_la_meua_alta$/, pgrst202('completa_la_meua_alta', 'p_tenant_id', 'p_tenant_id, p_username')]]);
    expect(await recullTornadaOAuth(CONFIG)).toBe(sessio);
    await vi.waitFor(() => expect(deRpc('completa_la_meua_alta')).toHaveLength(1));
    await buida();
    expect(deRpc('completa_la_meua_alta')[0].cos).toEqual({ p_tenant_id: TENANT });
    /* La foto pròpia es mira amb una columna de sempre (avatar_url): cap 42703 possible. */
    expect(crides().filter((c) => c.startsWith('GET'))).toEqual(['GET /rest/v1/profiles?id=eq.U-G&select=avatar_url']);
    expect(avis).not.toHaveBeenCalled();
  });
});

describe('3 · la primera lectura de la fitxa', () => {
  /* La fila tal com la fa la base sense 2610282100: handle_new_user escriu id,
     full_name i avatar_url, i town_name pren el DEFAULT 'La Torre de les
     Maçanes' (2609110600:10). Revisió final (261029): el client ha de tractar
     eixe poble de sèrie com a «cap poble propi», igual que el disparador. */
  const SENSE_MIGRACIO = Object.freeze({ id: 'U-2', full_name: 'Anna Pérez Soler', avatar_url: null, town_name: 'La Torre de les Maçanes', visibility: 'private', is_public: true, bio: null });
  const ambLaFila = (fila) => servidor([
    [/^GET \/rest\/v1\/profiles\?id=eq\.U-2$/, OK([fila])],
    [/^PATCH \/rest\/v1\/profiles\?id=eq\.U-2$/, (p) => OK([{ ...fila, ...p.cos }])],
  ]);

  test('sense 2610282100: la lectura no nomena cap columna (cap 42703 possible), la fila ve sense username i el poble de l’alta es completa UNA vegada pel PATCH de sempre', async () => {
    m.user = { id: 'U-2', user_metadata: { full_name: 'Anna Pérez Soler', username: 'anna-p', town_name: 'Penàguila' } };
    m.servidor = ambLaFila(SENSE_MIGRACIO);
    const perfil = await getProfile(CONFIG);
    expect(perfil).toMatchObject({ id: 'U-2', town_name: 'Penàguila' });
    expect(perfil).not.toHaveProperty('username');
    expect(perfil).not.toHaveProperty('reserva');
    expect(crides()).toEqual(['GET /rest/v1/profiles?id=eq.U-2', 'PATCH /rest/v1/profiles?id=eq.U-2']);
    expect(m.peticions[1].cos).toEqual({ town_name: 'Penàguila' });
    /* L'@usuari no té cap camí sense la RPC: es queda a les metadades i no es
       dona per desat (cap PATCH no l'escriu, cap camp inventat a la fila). */
    expect(JSON.stringify(m.peticions.map((p) => p.cos))).not.toContain('anna-p');
    // Una altra lectura del mateix compte en este document: cap PATCH més.
    m.peticions = [];
    await getProfile(CONFIG);
    expect(crides()).toEqual(['GET /rest/v1/profiles?id=eq.U-2']);
  });

  test('una base sense el DEFAULT (town_name nul) també completa el poble de l’alta', async () => {
    // Un compte nou (U-2n): «una vegada per compte i document» ja s'ha gastat per a U-2 dalt.
    m.user = { id: 'U-2n', user_metadata: { full_name: 'Anna Pérez Soler', town_name: 'Penàguila' } };
    m.servidor = servidor([
      [/^GET \/rest\/v1\/profiles\?id=eq\.U-2n$/, OK([{ ...SENSE_MIGRACIO, id: 'U-2n', town_name: null }])],
      [/^PATCH \/rest\/v1\/profiles\?id=eq\.U-2n$/, (p) => OK([{ ...SENSE_MIGRACIO, id: 'U-2n', ...p.cos }])],
    ]);
    expect(await getProfile(CONFIG)).toMatchObject({ id: 'U-2n', town_name: 'Penàguila' });
    expect(m.peticions[1].cos).toEqual({ town_name: 'Penàguila' });
  });

  test('si el PATCH del poble falla, la fila es torna tal qual i s’avisa una vegada; no es torna a provar', async () => {
    m.user = { id: 'U-2b', user_metadata: { town_name: 'Penàguila' } };
    m.servidor = servidor([
      [/^GET \/rest\/v1\/profiles\?id=eq\.U-2b$/, OK([{ ...SENSE_MIGRACIO, id: 'U-2b' }])],
      [/^PATCH /, { status: 403, cos: { code: '42501', message: 'new row violates row-level security policy for table "profiles"' } }],
    ]);
    expect(await getProfile(CONFIG)).toMatchObject({ id: 'U-2b', town_name: 'La Torre de les Maçanes' });
    expect(avis).toHaveBeenCalledTimes(1);
    expect(avis.mock.calls[0][0]).toBe('[supabase] Avís completant el poble de l’alta:');
    m.peticions = [];
    await getProfile(CONFIG);
    expect(crides()).toEqual(['GET /rest/v1/profiles?id=eq.U-2b']);
  });

  test.each([
    ['la fila ja porta poble', { ...SENSE_MIGRACIO, id: 'U-2c', town_name: 'Tibi' }, { town_name: 'Penàguila' }],
    ['les metadades no en porten cap', { ...SENSE_MIGRACIO, id: 'U-2c' }, { full_name: 'Anna' }],
    ['les metadades porten el de sèrie (el mateix que la fila)', { ...SENSE_MIGRACIO, id: 'U-2c' }, { town_name: 'La Torre de les Maçanes' }],
    ['regressió · la fila porta username (migració aplicada: el disparador ja l’ha derivat)', { ...SENSE_MIGRACIO, id: 'U-2c', username: 'annaperez', username_confirmat_at: null }, { town_name: 'Penàguila' }],
  ])('cap PATCH quan %s', async (_, fila, metadades) => {
    m.user = { id: 'U-2c', user_metadata: metadades };
    m.servidor = servidor([[/^GET \/rest\/v1\/profiles\?id=eq\.U-2c$/, OK([fila])]]);
    expect(await getProfile(CONFIG)).toEqual(fila);
    expect(crides()).toEqual(['GET /rest/v1/profiles?id=eq.U-2c']);
    expect(avis).not.toHaveBeenCalled();
  });

  test('sense fila i sense la RPC (PGRST202): la reserva amb el poble de l’alta, una sola crida i cap avís', async () => {
    m.user = { id: 'U-2d', user_metadata: { full_name: 'Anna Pérez Soler', town_name: 'Penàguila' } };
    m.servidor = servidor([
      [/^GET \/rest\/v1\/profiles\?id=eq\.U-2d$/, OK([])],
      [/^POST \/rest\/v1\/rpc\/completa_la_meua_alta$/, pgrst202('completa_la_meua_alta', 'p_tenant_id')],
    ]);
    expect(await getProfile(CONFIG)).toMatchObject({ reserva: true, id: 'U-2d', town_name: 'Penàguila' });
    expect(crides()).toEqual(['GET /rest/v1/profiles?id=eq.U-2d', 'POST /rest/v1/rpc/completa_la_meua_alta']);
    expect(avis).not.toHaveBeenCalled();
  });
});

describe('4 · desar l’@usuari i el poble des del perfil', () => {
  beforeEach(() => { m.user = { id: 'U-3', user_metadata: { full_name: 'Anna Pérez Soler' } }; });

  test.each([
    ['la ruta no hi és (404)', RUTA_ABSENT],
    ['la funció no hi és (PGRST202)', pgrst202('desa_el_meu_usuari', 'p_usuari')],
    ['la signatura no casa (PGRST202)', pgrst202('desa_el_meu_usuari', 'p_usuari', 'p_usuari, p_confirma')],
  ])('l’@usuari sol: %s → NO-DISPONIBLE amb el motiu en valencià, cap PATCH i res donat per desat', async (_, resposta) => {
    m.servidor = servidor([[/^POST \/rest\/v1\/rpc\/desa_el_meu_usuari$/, resposta]]);
    const error = await updateProfile({ username: 'anna-p' }, CONFIG).catch((e) => e);
    expect(error).toMatchObject({ code: 'NO-DISPONIBLE', message: MISSATGES_USERNAME['NO-DISPONIBLE'] });
    expect(error.message).toContain('migració pendent');
    expect(deRpc('desa_el_meu_usuari')[0].cos).toEqual({ p_usuari: 'anna-p' });
    expect(crides()).toEqual(['POST /rest/v1/rpc/desa_el_meu_usuari']);
    expect(m.canvis).not.toHaveBeenCalled();
  });

  test('l’@usuari amb més camps: la resta es desa i la fila diu que l’identificador no (campsNoDesats)', async () => {
    m.servidor = servidor([
      [/^POST \/rest\/v1\/rpc\/desa_el_meu_usuari$/, pgrst202('desa_el_meu_usuari', 'p_usuari')],
      [/^PATCH \/rest\/v1\/profiles\?id=eq\.U-3$/, (p) => OK([{ id: 'U-3', ...p.cos }])],
    ]);
    const fila = await updateProfile({ username: 'anna-p', lema: 'Del Comtat' }, CONFIG);
    expect(fila).toEqual({ id: 'U-3', lema: 'Del Comtat', campsNoDesats: ['username'] });
    expect(fila).not.toHaveProperty('username');
    expect(crides()).toEqual(['POST /rest/v1/rpc/desa_el_meu_usuari', 'PATCH /rest/v1/profiles?id=eq.U-3']);
    expect(m.peticions[1].cos).toEqual({ lema: 'Del Comtat' });
  });

  test('el poble va per town_name, la columna de sempre: es desa també sense la migració', async () => {
    m.servidor = servidor([
      [/^PATCH \/rest\/v1\/profiles\?id=eq\.U-3$/, (p) => OK([{ id: 'U-3', ...p.cos }])],
      [/^PUT \/auth\/v1\/user$/, (p) => OK({ id: 'U-3', user_metadata: p.cos.data })],
    ]);
    expect(await updateProfile({ town_name: 'Penàguila · La Torre de les Maçanes' }, CONFIG)).toEqual({ id: 'U-3', town_name: 'Penàguila · La Torre de les Maçanes' });
    expect(crides()).toEqual(['PATCH /rest/v1/profiles?id=eq.U-3', 'PUT /auth/v1/user']);
    expect(m.peticions[0].cos).not.toHaveProperty('town_uuid');
  });

  test.each([
    ['PGRST204', pgrst204],
    ['42703', pg42703],
  ])('una columna del cos que el servidor no té (%s) amb més camps: es torna a enviar sense ella, GoTrue no la rep i la fila la diu', async (_, falta) => {
    let patches = 0;
    m.servidor = servidor([
      [/^PATCH \/rest\/v1\/profiles\?id=eq\.U-3$/, (p) => (Object.hasOwn(p.cos, 'town_name') ? (patches++, falta('town_name')) : OK([{ id: 'U-3', ...p.cos }]))],
      [/^PUT \/auth\/v1\/user$/, (p) => OK({ id: 'U-3', user_metadata: p.cos.data })],
    ]);
    const fila = await updateProfile({ full_name: 'Anna Pérez', town_name: 'Penàguila', lema: 'Del Comtat' }, CONFIG);
    expect(fila).toEqual({ id: 'U-3', full_name: 'Anna Pérez', lema: 'Del Comtat', campsNoDesats: ['town_name'] });
    expect(patches).toBe(1);
    expect(m.peticions.map((p) => [p.metode, p.cos])).toEqual([
      ['PATCH', { full_name: 'Anna Pérez', town_name: 'Penàguila', lema: 'Del Comtat' }],
      ['PATCH', { full_name: 'Anna Pérez', lema: 'Del Comtat' }],
      ['PUT', { data: { full_name: 'Anna Pérez' } }],
    ]);
    expect(m.canvis).toHaveBeenCalledTimes(1);
    expect(m.canvis.mock.calls[0][0]).not.toHaveProperty('town_name');
  });

  test('la columna absent sola: l’error de sempre (ErrorColumnaAbsent), un sol PATCH i res a GoTrue', async () => {
    m.servidor = servidor([[/^PATCH /, pgrst204('town_name')]]);
    const error = await updateProfile({ town_name: 'Penàguila' }, CONFIG).catch((e) => e);
    expect(error).toMatchObject({ name: 'ErrorColumnaAbsent', columna: 'town_name', camps: ['town_name'] });
    expect(error.message).toContain('«town_name»');
    expect(crides()).toEqual(['PATCH /rest/v1/profiles?id=eq.U-3']);
    expect(m.canvis).not.toHaveBeenCalled();
  });

  test('un PGRST204 que no nomena cap columna del cos no es reintenta: l’error de sempre', async () => {
    m.servidor = servidor([[/^PATCH /, { status: 400, cos: { code: 'PGRST204', message: 'Could not find the column in the schema cache' } }]]);
    const error = await updateProfile({ full_name: 'Anna', lema: 'Del Comtat' }, CONFIG).catch((e) => e);
    expect(error).toMatchObject({ name: 'ErrorColumnaAbsent', columna: null });
    expect(crides()).toEqual(['PATCH /rest/v1/profiles?id=eq.U-3']);
  });

  test('qualsevol altre error del PATCH passa tal qual, sense reintent (403 de la RLS)', async () => {
    m.servidor = servidor([[/^PATCH /, { status: 403, cos: { code: '42501', message: 'new row violates row-level security policy for table "profiles"' } }]]);
    const error = await updateProfile({ full_name: 'Anna', lema: 'Del Comtat' }, CONFIG).catch((e) => e);
    expect(error).toMatchObject({ name: 'ErrorSupabase', status: 403 });
    expect(crides()).toEqual(['PATCH /rest/v1/profiles?id=eq.U-3']);
  });

  test('regressió · amb la migració, l’@usuari i la fitxa es desen com sempre, sense campsNoDesats', async () => {
    m.servidor = servidor([
      [/^POST \/rest\/v1\/rpc\/desa_el_meu_usuari$/, OK({ desat: true, usuari: 'anna-p', confirmat_al: ARA })],
      [/^PATCH \/rest\/v1\/profiles\?id=eq\.U-3$/, (p) => OK([{ id: 'U-3', ...p.cos }])],
      [/^PUT \/auth\/v1\/user$/, (p) => OK({ id: 'U-3', user_metadata: p.cos.data })],
    ]);
    expect(await updateProfile({ username: '@Anna.P' }, CONFIG)).toEqual({ id: 'U-3', username: 'anna-p', username_confirmat_at: ARA });
    const fila = await updateProfile({ full_name: 'Anna Pérez', lema: 'Del Comtat' }, CONFIG);
    expect(fila).toEqual({ id: 'U-3', full_name: 'Anna Pérez', lema: 'Del Comtat' });
    expect(fila).not.toHaveProperty('campsNoDesats');
    expect(crides()).toEqual(['POST /rest/v1/rpc/desa_el_meu_usuari', 'PATCH /rest/v1/profiles?id=eq.U-3', 'PUT /auth/v1/user']);
    expect(m.peticions[0].cos).toEqual({ p_usuari: 'anna-p' });
    expect(m.peticions[2].cos).toEqual({ data: { full_name: 'Anna Pérez' } });
  });
});
