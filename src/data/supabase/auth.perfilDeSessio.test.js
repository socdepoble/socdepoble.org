/* APP-D1: el camí de recuperació conserva la persona que va iniciar l’operació. Dades sintètiques i fetch simulat; runtime real. */
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
  capturaSessio: () => { const captured = m.user?.id; return () => { if (m.user?.id !== captured) throw new DOMException('La sessió ha canviat.', 'AbortError'); }; }, esborraSessio: vi.fn(), usuariDeSessio: () => m.user, actualitzaUsuariSessio: m.canvis,
  caducitatJwt: () => null, MARGE_RENOVACIO_MS: 60_000
}));
vi.mock('../oauthRelay.js', () => ({
  entraAmbGoogle: vi.fn(), gestionaTornada: vi.fn(), exigeixSenseMarcAlie: vi.fn(),
  urlDeTornadaAlta: vi.fn(() => null), urlDeTornadaRecuperacio: vi.fn(() => null), recullMarcaDeRecuperacio: vi.fn(() => null)
}));
vi.mock('./realtime.js', () => ({ tancaRealtime: vi.fn(async () => {}) }));
vi.mock('./config.js', () => ({ resetClient: vi.fn() }));
import { updateProfile } from './auth.js';

const TENANT = '00000000-0000-4000-8000-00000000000a';
const CONFIG = Object.freeze({ supabaseUrl: 'https://example.test', supabaseAnonKey: 'clau-publica', tenantId: TENANT });

/* Els cossos literals de PostgREST (i el 404 de la passarel·la sense ruta). */
const pgrst202 = (nom, parametres, suggerida = null) => ({ status: 404, cos: {
  code: 'PGRST202',
  message: `Could not find the function public.${nom}(${parametres}) in the schema cache`,
  details: `Searched for the function public.${nom} with parameter ${parametres} or with a single unnamed json/jsonb parameter, but no matches were found in the schema cache.`,
  hint: suggerida ? `Perhaps you meant to call the function public.${nom}(${suggerida})` : null
} });
const OK = (cos) => ({ status: 200, cos });
/* L'alta completada amb la signatura de 2609261500. */

/* El servidor d'una prova: regles [patró de «MÈTODE camí», resposta o funció
   de la petició]; sense cap regla que case, 200 []. */
const servidor = (regles) => (peticio) => {
  for (const [patro, resposta] of regles) {
    if (patro.test(`${peticio.metode} ${peticio.cami}`)) return typeof resposta === 'function' ? resposta(peticio) : resposta;
  }
  return OK([]);
};
/* Les promeses de millor esforç (completaAlta, reafirmaAvatarPropi) acaben soles. */

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


describe('QA-C1 · perfil parcial conserva la sessió original', () => {
  test('canvi de persona mentre falla la RPC: cap PATCH sobre la persona nova', async () => {
    m.user = { id: 'PERSONA-A', user_metadata: {} };
    m.servidor = servidor([
      [/^POST \/rest\/v1\/rpc\/desa_el_meu_usuari$/, () => { m.user = { id: 'PERSONA-B', user_metadata: {} }; return pgrst202('desa_el_meu_usuari','p_usuari'); }],
      [/^PATCH \/rest\/v1\/profiles/, (p) => OK([{ id: 'PERSONA-B', ...p.cos }])]
    ]);
    const outcome = await updateProfile({username:'anna-p',lema:'Text només de A'},CONFIG).then(value=>({value}),error=>({error}));
    expect(m.peticions.filter(p=>p.metode==='PATCH')).toEqual([]);
    expect(outcome.error).toMatchObject({name:'AbortError'});
  });
  test('control amb la mateixa persona: conserva els camps admesos i declara username no desat', async () => {
    m.user = { id: 'PERSONA-C', user_metadata: {} };
    m.servidor = servidor([
      [/^POST \/rest\/v1\/rpc\/desa_el_meu_usuari$/, pgrst202('desa_el_meu_usuari','p_usuari')],
      [/^PATCH \/rest\/v1\/profiles/, (p) => OK([{ id:'PERSONA-C', ...p.cos }])]
    ]);
    await expect(updateProfile({username:'carme-p',lema:'Text només de C'},CONFIG)).resolves.toEqual({id:'PERSONA-C',lema:'Text només de C',campsNoDesats:['username']});
    expect(m.peticions.filter(p=>p.metode==='PATCH').map(p=>p.cami)).toEqual(['/rest/v1/profiles?id=eq.PERSONA-C']);
  });
});
