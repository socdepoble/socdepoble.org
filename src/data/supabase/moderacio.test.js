/* Fase D (261020, tasca 2; pla 261020_1300) · L'adaptador de la moderació
   (moderacio.js) amb el runtime de producció i un fetch de mentida: les rutes
   i els cossos exactes de PostgREST i de les RPC de 2610201500, el 409 que
   només és «ja hi era» amb el 23505, el `signal` que arriba a fetch, la regla
   d'entrada abans de cap xarxa i el magatzem en memòria de seed i local. */
import { afterAll, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  acceptaNormes, bloquejaAutor, denunciaContingut, desbloquejaAutor, estatNormes, llistaBloquejos, reiniciaModeracioLocal
} from './moderacio.js';
import { configuraBackendSessio, desaSessio, esborraSessio, getDefaultUserId } from '../identitat.js';
import { CODI_BACKEND_INABASTABLE } from '../errorsBackend.js';
/* Actualitzada a posta (261024 T2): la versió vigent de les normes es llig del
   contracte (VERSIO_NORMES_CONVIVENCIA puja a 2026-10-24 amb les mesures
   proporcionades), no d'una data copiada. */
import { VERSIO_NORMES_CONVIVENCIA as VERSIO } from '../contracte.js';

const ORIGEN = 'http://localhost:54321';
const POBLE = '7a1b2c3d-4e5f-4a60-8b71-c2d3e4f5a6b7';
const PERSONA = '1d2e3f40-5a6b-4c7d-8e9f-a0b1c2d3e4f5';
const VEINA = '2e3f4051-6b7c-4d8e-9fa0-b1c2d3e4f5a6';
const ENTITAT = '5b6c7d8e-9fa0-4b1c-8d2e-3f4051627384';
const FIL = '3f405162-7c8d-4e9f-a0b1-c2d3e4f5a6b7';
const REMOT = Object.freeze({ dataMode: 'remote', supabaseUrl: ORIGEN, supabaseAnonKey: 'sb_publishable_proves', tenantId: POBLE });

const resposta = (cos, status = 200) => ({
  ok: status >= 200 && status < 300, status,
  headers: { get: () => null },
  json: async () => structuredClone(cos),
  text: async () => (cos === null ? '' : JSON.stringify(cos))
});
const fetchDeProva = vi.fn();
const crida = (n = 0) => {
  const [url, opcions = {}] = fetchDeProva.mock.calls[n];
  return { url: new URL(String(url)), opcions, cos: typeof opcions.body === 'string' ? JSON.parse(opcions.body) : undefined };
};
const entra = () => {
  configuraBackendSessio(REMOT);
  expect(desaSessio({ access_token: 'jwt-de-prova', user: { id: PERSONA, email: 'prova@poble.invalid' } })).toBe(true);
};

vi.stubGlobal('fetch', fetchDeProva);
afterAll(() => { vi.unstubAllGlobals(); esborraSessio({ abast: 'tot' }); });
beforeEach(() => {
  fetchDeProva.mockReset();
  reiniciaModeracioLocal();
  entra();
});

describe('remot · bloquejos sobre public.bloquejos', () => {
  test('la llista és un GET dels meus, del més nou al més vell, en la forma del contracte', async () => {
    fetchDeProva.mockResolvedValueOnce(resposta([
      { bloquejat_tipus: 'persona', bloquejat_persona: VEINA, bloquejat_entitat: null, nom: 'Veïna', creat_al: '2026-10-20T10:00:00+00:00' },
      { bloquejat_tipus: 'entitat', bloquejat_persona: null, bloquejat_entitat: ENTITAT, nom: null, creat_al: '2026-10-19T10:00:00+00:00' },
      { bloquejat_tipus: 'persona', bloquejat_persona: null }
    ]));
    expect(await llistaBloquejos(REMOT)).toEqual([
      { tipus: 'persona', id: VEINA, nom: 'Veïna', creatAl: '2026-10-20T10:00:00+00:00' },
      { tipus: 'entitat', id: ENTITAT, nom: null, creatAl: '2026-10-19T10:00:00+00:00' }
    ]);
    const { url, opcions } = crida();
    expect(url.pathname).toBe('/rest/v1/bloquejos');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      select: 'bloquejat_tipus,bloquejat_persona,bloquejat_entitat,nom,creat_al', bloquejador: `eq.${PERSONA}`, order: 'creat_al.desc', limit: '1000'
    });
    expect(opcions.method).toBe('GET');
  });

  test('bloquejar és un POST amb return=representation; el servidor tria bloquejador i data', async () => {
    fetchDeProva.mockResolvedValueOnce(resposta([{ bloquejat_tipus: 'persona', bloquejat_persona: VEINA, nom: 'Veïna', creat_al: '2026-10-20T11:00:00+00:00' }], 201));
    expect(await bloquejaAutor({ tipus: 'persona', id: VEINA, nom: '  Veïna  ' }, REMOT))
      .toEqual({ tipus: 'persona', id: VEINA, nom: 'Veïna', creatAl: '2026-10-20T11:00:00+00:00' });
    const { url, opcions, cos } = crida();
    expect(url.pathname).toBe('/rest/v1/bloquejos');
    expect(url.searchParams.get('select')).toBe('bloquejat_tipus,bloquejat_persona,bloquejat_entitat,nom,creat_al');
    expect(opcions.method).toBe('POST');
    expect(opcions.headers.Prefer).toBe('return=representation');
    expect(cos).toEqual({ bloquejat_tipus: 'persona', nom: 'Veïna', bloquejat_persona: VEINA });
    fetchDeProva.mockResolvedValueOnce(resposta([{ bloquejat_tipus: 'entitat', bloquejat_entitat: ENTITAT, nom: null, creat_al: null }], 201));
    await bloquejaAutor({ tipus: 'entitat', id: ENTITAT }, REMOT);
    expect(crida(1).cos).toEqual({ bloquejat_tipus: 'entitat', nom: null, bloquejat_entitat: ENTITAT });
  });

  test('un 409 amb el 23505 és «ja hi era» (idempotent); amb el 23503 és objectiu-invalid, mai un èxit fals', async () => {
    fetchDeProva.mockResolvedValueOnce(resposta({ code: '23505', message: 'duplicate key value violates unique constraint "bloquejos_persona_unic"' }, 409));
    expect(await bloquejaAutor({ tipus: 'persona', id: VEINA, nom: 'Veïna' }, REMOT)).toEqual({ tipus: 'persona', id: VEINA, nom: 'Veïna', creatAl: null });
    fetchDeProva.mockResolvedValueOnce(resposta({ code: '23503', message: 'insert or update on table "bloquejos" violates foreign key constraint' }, 409));
    await expect(bloquejaAutor({ tipus: 'persona', id: VEINA }, REMOT)).rejects.toMatchObject({ code: 'objectiu-invalid', status: 409 });
  });

  test('un 403 (la RLS amb sessió) és desconegut, no «cal entrar»; un 401 sí que és sense-sessio', async () => {
    fetchDeProva.mockResolvedValueOnce(resposta({ code: '42501', message: 'new row violates row-level security policy for table "bloquejos"' }, 403));
    await expect(bloquejaAutor({ tipus: 'persona', id: VEINA }, REMOT)).rejects.toMatchObject({ code: 'desconegut', status: 403 });
    fetchDeProva.mockResolvedValueOnce(resposta({ message: 'JWT expired' }, 401));
    await expect(llistaBloquejos(REMOT)).rejects.toMatchObject({ code: 'sense-sessio', status: 401 });
  });

  test('els codis SDP-MOD del servidor, la taula absent i la xarxa caiguda es tradueixen', async () => {
    fetchDeProva.mockResolvedValueOnce(resposta({ code: '42900', message: 'SDP-MOD-429: has arribat al màxim de 1.000 bloquejos.' }, 400));
    await expect(bloquejaAutor({ tipus: 'persona', id: VEINA }, REMOT)).rejects.toMatchObject({ code: 'limit' });
    fetchDeProva.mockResolvedValueOnce(resposta({ code: '22023', message: 'SDP-MOD-004: no et pots bloquejar a tu mateix.' }, 400));
    await expect(bloquejaAutor({ tipus: 'persona', id: VEINA }, REMOT)).rejects.toMatchObject({ code: 'autobloqueig' });
    fetchDeProva.mockResolvedValueOnce(resposta({ code: 'PGRST205', message: "Could not find the table 'public.bloquejos' in the schema cache" }, 404));
    await expect(llistaBloquejos(REMOT)).rejects.toMatchObject({ code: 'no-disponible' });
    fetchDeProva.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(llistaBloquejos(REMOT)).rejects.toMatchObject({ code: 'desconegut', codi: CODI_BACKEND_INABASTABLE });
  });

  test('desbloquejar és un DELETE del meu bloqueig; desbloquejat diu si hi era', async () => {
    fetchDeProva.mockResolvedValueOnce(resposta([{ bloquejat_tipus: 'entitat' }]));
    expect(await desbloquejaAutor({ tipus: 'entitat', id: ENTITAT }, REMOT)).toEqual({ desbloquejat: true });
    const { url, opcions } = crida();
    expect(url.pathname).toBe('/rest/v1/bloquejos');
    expect(Object.fromEntries(url.searchParams)).toEqual({ bloquejador: `eq.${PERSONA}`, bloquejat_entitat: `eq.${ENTITAT}`, select: 'bloquejat_tipus' });
    expect(opcions.method).toBe('DELETE');
    expect(opcions.headers.Prefer).toBe('return=representation');
    fetchDeProva.mockResolvedValueOnce(resposta([]));
    expect(await desbloquejaAutor({ tipus: 'persona', id: VEINA }, REMOT)).toEqual({ desbloquejat: false });
    expect(crida(1).url.searchParams.get('bloquejat_persona')).toBe(`eq.${VEINA}`);
  });

  test('el signal de la configuració arriba a fetch: avortar-lo avorta la petició (AbortError tal qual)', async () => {
    fetchDeProva.mockImplementation((_url, opcions) => new Promise((_resol, rebutja) => {
      opcions.signal.addEventListener('abort', () => rebutja(new DOMException('Avortada', 'AbortError')));
    }));
    for (const fes of [(signal) => llistaBloquejos({ ...REMOT, signal }), (signal) => estatNormes({ ...REMOT, signal }),
      (signal) => denunciaContingut({ objecte: { tipus: 'publicacio', id: 'p1' }, motiu: 'altre' }, { ...REMOT, signal })]) {
      const control = new AbortController();
      const promesa = fes(control.signal);
      control.abort();
      await expect(promesa).rejects.toMatchObject({ name: 'AbortError' });
    }
    expect(fetchDeProva).toHaveBeenCalledTimes(3);
  });
});

describe('remot · denúncies i normes per RPC', () => {
  test('denunciar crida denuncia_contingut amb els p_*; un fil que no és UUID no hi viatja', async () => {
    fetchDeProva.mockResolvedValueOnce(resposta({ rebuda: true, repetida: false }));
    expect(await denunciaContingut({ objecte: { tipus: 'missatge', id: 'm-1' }, motiu: 'ofensiu', detall: ' insults ',
      autor: { tipus: 'persona', id: VEINA }, filId: FIL }, REMOT)).toEqual({ rebuda: true, repetida: false });
    const { url, opcions, cos } = crida();
    expect(url.pathname).toBe('/rest/v1/rpc/denuncia_contingut');
    expect(opcions.method).toBe('POST');
    expect(cos).toEqual({ p_objecte_tipus: 'missatge', p_objecte_id: 'm-1', p_motiu: 'ofensiu', p_detall: 'insults',
      p_autor_tipus: 'persona', p_autor_id: VEINA, p_fil_id: FIL, p_tenant_id: POBLE });
    fetchDeProva.mockResolvedValueOnce(resposta({ rebuda: true, repetida: true }));
    expect(await denunciaContingut({ objecte: { tipus: 'publicacio', id: 'p1' }, motiu: 'altre', filId: 'fake-sdp' }, REMOT))
      .toEqual({ rebuda: true, repetida: true });
    expect(crida(1).cos).toMatchObject({ p_detall: null, p_autor_tipus: null, p_autor_id: null, p_fil_id: null });
  });

  test('també sense sessió (anon): el servidor ho rep amb la clau pública', async () => {
    esborraSessio({ abast: 'tot' });
    fetchDeProva.mockResolvedValueOnce(resposta({ rebuda: true, repetida: false }));
    expect(await denunciaContingut({ objecte: { tipus: 'persona', id: VEINA }, motiu: 'spam_frau' }, REMOT)).toMatchObject({ rebuda: true });
    expect(crida().opcions.headers.Authorization).toBe('Bearer sb_publishable_proves');
  });

  test('l’RPC absent (migració sense aplicar) és no-disponible; SDP-MOD-002 és motiu-invalid', async () => {
    fetchDeProva.mockResolvedValueOnce(resposta({ code: 'PGRST202', message: 'Could not find the function public.denuncia_contingut' }, 404));
    await expect(denunciaContingut({ objecte: { tipus: 'publicacio', id: 'p1' }, motiu: 'altre' }, REMOT)).rejects.toMatchObject({ code: 'no-disponible' });
    fetchDeProva.mockResolvedValueOnce(resposta({ code: '22023', message: 'SDP-MOD-002: el motiu de la denúncia no és vàlid.' }, 400));
    await expect(denunciaContingut({ objecte: { tipus: 'publicacio', id: 'p1' }, motiu: 'altre' }, REMOT)).rejects.toMatchObject({ code: 'motiu-invalid' });
  });

  test('l’estat de les normes demana la versió vigent: { p_versio: VERSIO_NORMES_CONVIVENCIA }', async () => {
    expect(VERSIO).toBe('2026-10-24');
    fetchDeProva.mockResolvedValueOnce(resposta({ versio: VERSIO, acceptada_al: '2026-10-24T09:00:00+00:00' }));
    expect(await estatNormes(REMOT)).toEqual({ versio: VERSIO, acceptadaAl: '2026-10-24T09:00:00+00:00' });
    expect(crida().url.pathname).toBe('/rest/v1/rpc/estat_normes_convivencia');
    expect(crida().cos).toEqual({ p_versio: VERSIO });
    fetchDeProva.mockResolvedValueOnce(resposta({ versio: VERSIO, acceptada_al: null }));
    expect(await estatNormes(REMOT)).toEqual({ versio: VERSIO, acceptadaAl: null });
  });

  test('acceptar les normes crida accepta_normes_convivencia amb la versió', async () => {
    fetchDeProva.mockResolvedValueOnce(resposta({ versio: VERSIO, acceptada_al: '2026-10-24T09:00:00+00:00' }));
    expect(await acceptaNormes(VERSIO, REMOT)).toEqual({ versio: VERSIO, acceptadaAl: '2026-10-24T09:00:00+00:00' });
    expect(crida().url.pathname).toBe('/rest/v1/rpc/accepta_normes_convivencia');
    expect(crida().cos).toEqual({ p_versio: VERSIO });
  });
});

describe('remot · sense sessió i la regla d’entrada, abans de cap xarxa', () => {
  test('sense sessió: la llista és buida i l’estat no acceptat, sense cap petició; bloquejar i acceptar demanen entrar', async () => {
    esborraSessio({ abast: 'tot' });
    expect(await llistaBloquejos(REMOT)).toEqual([]);
    expect(await estatNormes(REMOT)).toEqual({ versio: VERSIO, acceptadaAl: null });
    await expect(bloquejaAutor({ tipus: 'persona', id: VEINA }, REMOT)).rejects.toMatchObject({ code: 'sense-sessio' });
    await expect(desbloquejaAutor({ tipus: 'persona', id: VEINA }, REMOT)).rejects.toMatchObject({ code: 'sense-sessio' });
    await expect(acceptaNormes(VERSIO, REMOT)).rejects.toMatchObject({ code: 'sense-sessio' });
    expect(fetchDeProva).not.toHaveBeenCalled();
  });

  test('un motiu, un detall, un tipus o un id dolents, una versió que no és la vigent, un no UUID o un mateix: cap petició', async () => {
    const objecte = { tipus: 'publicacio', id: 'p1' };
    await expect(denunciaContingut({ objecte, motiu: 'inventat' }, REMOT)).rejects.toMatchObject({ code: 'motiu-invalid' });
    await expect(denunciaContingut({ objecte, motiu: 'altre', detall: 'x'.repeat(1001) }, REMOT)).rejects.toMatchObject({ code: 'detall-massa-llarg' });
    await expect(denunciaContingut({ objecte: { tipus: 'nota', id: 'n1' }, motiu: 'altre' }, REMOT)).rejects.toMatchObject({ code: 'objectiu-invalid' });
    await expect(denunciaContingut({ objecte: { tipus: 'publicacio', id: 'amb espai' }, motiu: 'altre' }, REMOT)).rejects.toMatchObject({ code: 'objectiu-invalid' });
    await expect(bloquejaAutor({ tipus: 'grup', id: VEINA }, REMOT)).rejects.toMatchObject({ code: 'objectiu-invalid' });
    await expect(bloquejaAutor({ tipus: 'persona', id: 'pepa-veina' }, REMOT)).rejects.toMatchObject({ code: 'objectiu-invalid' });
    await expect(desbloquejaAutor({ tipus: 'entitat', id: 'forn' }, REMOT)).rejects.toMatchObject({ code: 'objectiu-invalid' });
    await expect(bloquejaAutor({ tipus: 'persona', id: PERSONA }, REMOT)).rejects.toMatchObject({ code: 'autobloqueig' });
    await expect(acceptaNormes('2026-01-01', REMOT)).rejects.toMatchObject({ code: 'versio-invalida' });
    expect(fetchDeProva).not.toHaveBeenCalled();
  });
});

describe.each(['seed', 'local'])('mode %s · el magatzem en memòria, sense xarxa', (dataMode) => {
  const config = { dataMode };

  test('bloquejar, llistar i desbloquejar; bloquejar dues vegades és idempotent; un mateix, autobloqueig', async () => {
    const primer = await bloquejaAutor({ tipus: 'persona', id: 'pepa', nom: 'Pepa' }, config);
    expect(primer).toMatchObject({ tipus: 'persona', id: 'pepa', nom: 'Pepa' });
    expect(primer.creatAl).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(await bloquejaAutor({ tipus: 'persona', id: 'pepa', nom: 'Altre nom' }, config)).toBe(primer);
    await bloquejaAutor({ tipus: 'entitat', id: 'forn' }, config);
    expect((await llistaBloquejos(config)).map((b) => `${b.tipus}:${b.id}`)).toEqual(['entitat:forn', 'persona:pepa']);
    expect(await desbloquejaAutor({ tipus: 'persona', id: 'pepa' }, config)).toEqual({ desbloquejat: true });
    expect(await desbloquejaAutor({ tipus: 'persona', id: 'pepa' }, config)).toEqual({ desbloquejat: false });
    expect((await llistaBloquejos(config)).map((b) => b.id)).toEqual(['forn']);
    await expect(bloquejaAutor({ tipus: 'persona', id: PERSONA }, config)).rejects.toMatchObject({ code: 'autobloqueig' });
  });

  test('cada persona té els seus bloquejos: el convidat no veu els de la sessió', async () => {
    await bloquejaAutor({ tipus: 'persona', id: 'pepa' }, config);
    esborraSessio({ abast: 'tot' });
    expect(await llistaBloquejos(config)).toEqual([]);
    await expect(bloquejaAutor({ tipus: 'persona', id: getDefaultUserId() }, config)).rejects.toMatchObject({ code: 'autobloqueig' });
  });

  test('la segona denúncia del mateix contingut és repetida; les normes s’accepten en memòria', async () => {
    const denuncia = { objecte: { tipus: 'publicacio', id: 'p1' }, motiu: 'spam_frau' };
    expect(await denunciaContingut(denuncia, config)).toEqual({ rebuda: true, repetida: false });
    expect(await denunciaContingut(denuncia, config)).toEqual({ rebuda: true, repetida: true });
    expect(await estatNormes(config)).toEqual({ versio: VERSIO, acceptadaAl: null });
    const acceptada = await acceptaNormes(VERSIO, config);
    expect(acceptada.acceptadaAl).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(await estatNormes(config)).toEqual(acceptada);
    await expect(acceptaNormes('no-es-cap-versio', config)).rejects.toMatchObject({ code: 'versio-invalida' });
  });

  test('cap petició de xarxa en tot el mode', async () => {
    await llistaBloquejos(config);
    await estatNormes(config);
    expect(fetchDeProva).not.toHaveBeenCalled();
  });
});
