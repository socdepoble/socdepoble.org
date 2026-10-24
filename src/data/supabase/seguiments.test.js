/* T6b (IDEA-14; decisió del Mestre, 261024) · L'adaptador dels seguiments
   (seguiments.js) amb el runtime de producció i un fetch de mentida: les RPC
   i els cossos exactes de 2610241430, la traducció dels errors a
   MISSATGES_SEGUIMENTS (també el 404 de l'esquema absent), el `signal` que
   arriba a fetch, la regla d'entrada abans de cap xarxa, i en seed i local el
   servidor de localSeguiments.js amb els bloquejos de la moderació local. */
import { afterAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { deixaDeSeguir, elsMeusSeguiments, estatSeguiment, quiEmSegueix, segueix } from './seguiments.js';
import { bloquejaAutor, reiniciaModeracioLocal } from './moderacio.js';
import { reiniciaLocalSeguiments } from '../localSeguiments.js';
import { reiniciaLocalPerfils } from '../localPerfils.js';
import { configuraBackendSessio, desaSessio, esborraSessio } from '../identitat.js';
import { CODI_BACKEND_INABASTABLE } from '../errorsBackend.js';
import { MISSATGES_SEGUIMENTS } from '../contracte.js';

const ORIGEN = 'http://localhost:54321';
const POBLE = '7a1b2c3d-4e5f-4a60-8b71-c2d3e4f5a6b7';
const PERSONA = '1d2e3f40-5a6b-4c7d-8e9f-a0b1c2d3e4f5';
const VEINA = '2e3f4051-6b7c-4d8e-9fa0-b1c2d3e4f5a6';
const ENTITAT = '5b6c7d8e-9fa0-4b1c-8d2e-3f4051627384';
const REMOT = Object.freeze({ dataMode: 'remote', supabaseUrl: ORIGEN, supabaseAnonKey: 'sb_publishable_proves', tenantId: POBLE });
const ARA = '2026-10-24T12:30:00+00:00';

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
const errorDelServidor = (codiPg, missatge, status = 400) => resposta({ code: codiPg, message: missatge, details: null, hint: null }, status);

vi.stubGlobal('fetch', fetchDeProva);
afterAll(() => { vi.unstubAllGlobals(); esborraSessio({ abast: 'tot' }); });
beforeEach(() => {
  fetchDeProva.mockReset();
  reiniciaLocalSeguiments();
  reiniciaModeracioLocal();
  reiniciaLocalPerfils();
  entra();
});

describe('remot · les RPC de 2610241430', () => {
  /* Actualitzada a posta (261024 correccions): motiu, segueix torna `primer` (R4-01,
     R2-04) i `nou` en val el mateix; el servidor el dona en les dues formes. */
  test('seguir és un POST a segueix amb { p_tipus, p_id } i la sessió; torna la forma del contracte', async () => {
    fetchDeProva.mockResolvedValueOnce(resposta({ seguint: true, creat_al: ARA, nou: true, primer: true }));
    expect(await segueix({ tipus: 'persona', id: VEINA }, REMOT)).toEqual({ seguint: true, creatAl: ARA, nou: true, primer: true });
    const { url, opcions, cos } = crida();
    expect(url.pathname).toBe('/rest/v1/rpc/segueix');
    expect(opcions.method).toBe('POST');
    expect(opcions.headers.Authorization).toBe('Bearer jwt-de-prova');
    expect(cos).toEqual({ p_tipus: 'persona', p_id: VEINA });
    /* Idempotent: el servidor diu que ja hi era. */
    fetchDeProva.mockResolvedValueOnce(resposta({ seguint: true, creat_al: ARA, nou: false, primer: false }));
    expect(await segueix({ tipus: 'entitat', id: ` ${ENTITAT} ` }, REMOT)).toEqual({ seguint: true, creatAl: ARA, nou: false, primer: false });
    expect(crida(1).cos).toEqual({ p_tipus: 'entitat', p_id: ENTITAT });
  });

  test('nou val el mateix que primer: una resposta sense primer (o amb primer fals) no és cap primera vegada', async () => {
    /* Una represa després de deixar de seguir: cap avís al xat (R4-01). */
    fetchDeProva.mockResolvedValueOnce(resposta({ seguint: true, creat_al: ARA, nou: false, primer: false }));
    expect(await segueix({ tipus: 'persona', id: VEINA }, REMOT)).toMatchObject({ nou: false, primer: false });
    /* Un servidor que només diguera nou (sense primer) no faria enviar cap avís. */
    fetchDeProva.mockResolvedValueOnce(resposta({ seguint: true, creat_al: ARA, nou: true }));
    expect(await segueix({ tipus: 'persona', id: VEINA }, REMOT)).toMatchObject({ nou: false, primer: false });
    fetchDeProva.mockResolvedValueOnce(resposta([{ seguint: true, creat_al: ARA, nou: true, primer: true }]));
    expect(await segueix({ tipus: 'persona', id: VEINA }, REMOT)).toMatchObject({ nou: true, primer: true });
  });

  test('deixar de seguir i l’estat: deixa_de_seguir i estat_seguiment amb els mateixos p_*', async () => {
    fetchDeProva.mockResolvedValueOnce(resposta({ seguint: false }));
    expect(await deixaDeSeguir({ tipus: 'entitat', id: ENTITAT }, REMOT)).toEqual({ seguint: false });
    expect([crida(0).url.pathname, crida(0).cos]).toEqual(['/rest/v1/rpc/deixa_de_seguir', { p_tipus: 'entitat', p_id: ENTITAT }]);
    fetchDeProva.mockResolvedValueOnce(resposta({ seguint: true, creat_al: ARA }));
    expect(await estatSeguiment({ tipus: 'persona', id: VEINA }, REMOT)).toEqual({ seguint: true, creatAl: ARA });
    expect([crida(1).url.pathname, crida(1).cos]).toEqual(['/rest/v1/rpc/estat_seguiment', { p_tipus: 'persona', p_id: VEINA }]);
    fetchDeProva.mockResolvedValueOnce(resposta({ seguint: false, creat_al: null }));
    expect(await estatSeguiment({ tipus: 'persona', id: VEINA }, REMOT)).toEqual({ seguint: false, creatAl: null });
  });

  test('les llistes: els_meus_seguiments i qui_em_segueix en la forma del contracte; una fila malmesa no passa', async () => {
    fetchDeProva.mockResolvedValueOnce(resposta([
      { tipus: 'entitat', id: ENTITAT, nom: 'Forn de la Torre', creat_al: ARA },
      { tipus: 'persona', id: VEINA, nom: '', creat_al: null },
      { tipus: 'ia', id: 'iaia', nom: 'IAIA', creat_al: ARA },
      { tipus: 'persona', id: null }
    ]));
    expect(await elsMeusSeguiments(REMOT)).toEqual([
      { tipus: 'entitat', id: ENTITAT, nom: 'Forn de la Torre', creatAl: ARA },
      { tipus: 'persona', id: VEINA, nom: null, creatAl: null }
    ]);
    expect([crida(0).url.pathname, crida(0).cos]).toEqual(['/rest/v1/rpc/els_meus_seguiments', {}]);
    fetchDeProva.mockResolvedValueOnce(resposta([{ id: VEINA, nom: 'Veïna', creat_al: ARA }, { nom: 'sense id' }]));
    expect(await quiEmSegueix({}, REMOT)).toEqual([{ id: VEINA, nom: 'Veïna', creatAl: ARA }]);
    expect([crida(1).url.pathname, crida(1).cos]).toEqual(['/rest/v1/rpc/qui_em_segueix', { p_org_id: null }]);
    fetchDeProva.mockResolvedValueOnce(resposta([]));
    expect(await quiEmSegueix({ orgId: ENTITAT }, REMOT)).toEqual([]);
    expect(crida(2).cos).toEqual({ p_org_id: ENTITAT });
    fetchDeProva.mockResolvedValueOnce(resposta([]));
    expect(await quiEmSegueix(undefined, REMOT)).toEqual([]);
    expect(crida(3).cos).toEqual({ p_org_id: null });
  });

  test('els codis SDP-SEG del servidor, amb el seu missatge; el 404 de l’esquema absent és NO-DISPONIBLE', async () => {
    const casos = [
      [errorDelServidor('22023', 'SDP-SEG-002: no trobem esta persona o esta entitat, o no la pots seguir.'), 'SDP-SEG-002'],
      [errorDelServidor('22023', 'SDP-SEG-003: no et pots seguir a tu mateix ni seguir una entitat que administres.'), 'SDP-SEG-003'],
      [errorDelServidor('22023', 'SDP-SEG-004: l\'has bloquejada: desbloqueja-la abans de seguir-la.'), 'SDP-SEG-004'],
      [errorDelServidor('42900', 'SDP-SEG-006: has fet massa seguiments nous en poc de temps.'), 'SDP-SEG-006'],
      [errorDelServidor('PGRST202', 'Could not find the function public.segueix(p_id, p_tipus) in the schema cache', 404), 'NO-DISPONIBLE'],
      [errorDelServidor('22P02', 'invalid input syntax for type uuid'), 'SDP-SEG-001'],
      [errorDelServidor('23503', 'insert or update on table "seguiments" violates foreign key constraint', 409), 'SDP-SEG-002'],
      [resposta({ message: 'massa peticions' }, 429), 'SDP-SEG-006'],
      [errorDelServidor('XX000', 'una altra cosa', 500), 'DESCONEGUT']
    ];
    for (const [respostaDelServidor, code] of casos) {
      fetchDeProva.mockResolvedValueOnce(respostaDelServidor);
      await expect(segueix({ tipus: 'persona', id: VEINA }, REMOT), code).rejects.toMatchObject({ code, message: MISSATGES_SEGUIMENTS[code] });
    }
    fetchDeProva.mockResolvedValueOnce(errorDelServidor('42501', 'SDP-SEG-005: només qui administra l\'entitat veu qui la seguix.', 403));
    await expect(quiEmSegueix({ orgId: ENTITAT }, REMOT)).rejects.toMatchObject({ code: 'SDP-SEG-005', status: 403 });
  });

  test('un 403 sense prefix no és «cal entrar»; un 401 sí; sense xarxa, DESCONEGUT amb el codi neutral', async () => {
    fetchDeProva.mockResolvedValueOnce(errorDelServidor('42501', 'permission denied for function segueix', 403));
    await expect(segueix({ tipus: 'persona', id: VEINA }, REMOT)).rejects.toMatchObject({ code: 'DESCONEGUT', status: 403 });
    fetchDeProva.mockResolvedValueOnce(resposta({ message: 'JWT expired' }, 401));
    await expect(elsMeusSeguiments(REMOT)).rejects.toMatchObject({ code: 'SDP-SEG-000', status: 401 });
    fetchDeProva.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(estatSeguiment({ tipus: 'persona', id: VEINA }, REMOT)).rejects.toMatchObject({ code: 'DESCONEGUT', codi: CODI_BACKEND_INABASTABLE });
  });

  test('el signal de la configuració arriba a fetch: avortar-lo avorta la petició (AbortError tal qual)', async () => {
    fetchDeProva.mockImplementation((_url, opcions) => new Promise((_resol, rebutja) => {
      opcions.signal.addEventListener('abort', () => rebutja(new DOMException('Avortada', 'AbortError')));
    }));
    for (const fes of [(signal) => quiEmSegueix({}, { ...REMOT, signal }), (signal) => elsMeusSeguiments({ ...REMOT, signal }),
      (signal) => segueix({ tipus: 'entitat', id: ENTITAT }, { ...REMOT, signal })]) {
      const control = new AbortController();
      const promesa = fes(control.signal);
      control.abort();
      await expect(promesa).rejects.toMatchObject({ name: 'AbortError' });
    }
    expect(fetchDeProva).toHaveBeenCalledTimes(3);
  });
});

describe('remot · sense sessió i la regla d’entrada, abans de cap xarxa', () => {
  test('sense sessió: les lectures, buides; seguir i deixar de seguir demanen entrar; cap petició', async () => {
    esborraSessio({ abast: 'tot' });
    expect(await estatSeguiment({ tipus: 'persona', id: VEINA }, REMOT)).toEqual({ seguint: false, creatAl: null });
    expect(await elsMeusSeguiments(REMOT)).toEqual([]);
    expect(await quiEmSegueix({}, REMOT)).toEqual([]);
    expect(await quiEmSegueix({ orgId: ENTITAT }, REMOT)).toEqual([]);
    await expect(segueix({ tipus: 'persona', id: VEINA }, REMOT)).rejects.toMatchObject({ code: 'SDP-SEG-000' });
    await expect(deixaDeSeguir({ tipus: 'persona', id: VEINA }, REMOT)).rejects.toMatchObject({ code: 'SDP-SEG-000' });
    expect(fetchDeProva).not.toHaveBeenCalled();
  });

  test('un tipus que no és persona ni entitat, un id buit o que no és cap UUID del servidor: SDP-SEG-001 sense cap petició', async () => {
    for (const dolent of [{ tipus: 'grup', id: VEINA }, { tipus: 'ia', id: VEINA }, { tipus: 'persona', id: '' }, { tipus: 'persona', id: 'pepa-veina' },
      { tipus: 'entitat', id: 'socdepoble' }, null]) {
      await expect(segueix(dolent, REMOT), JSON.stringify(dolent)).rejects.toMatchObject({ code: 'SDP-SEG-001' });
      await expect(estatSeguiment(dolent, REMOT), JSON.stringify(dolent)).rejects.toMatchObject({ code: 'SDP-SEG-001' });
      await expect(deixaDeSeguir(dolent, REMOT), JSON.stringify(dolent)).rejects.toMatchObject({ code: 'SDP-SEG-001' });
    }
    await expect(quiEmSegueix({ orgId: 'socdepoble' }, REMOT)).rejects.toMatchObject({ code: 'SDP-SEG-001' });
    await expect(quiEmSegueix({ orgId: 'amb espai' }, REMOT)).rejects.toMatchObject({ code: 'SDP-SEG-001' });
    expect(fetchDeProva).not.toHaveBeenCalled();
  });
});

describe.each(['seed', 'local'])('mode %s · localSeguiments fa de servidor, sense xarxa', (dataMode) => {
  const config = { dataMode };

  test('seguir una entitat del padró, idempotent; l’estat, la llista i deixar-la de seguir', async () => {
    const primer = await segueix({ tipus: 'entitat', id: 'rentonar' }, config);
    expect(primer).toMatchObject({ seguint: true, nou: true, primer: true });
    expect(primer.creatAl).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    /* Actualitzada a posta (261024 correccions): motiu, la forma porta `primer` (R4-01). */
    expect(await segueix({ tipus: 'entitat', id: 'rentonar' }, config)).toEqual({ seguint: true, creatAl: primer.creatAl, nou: false, primer: false });
    expect(await estatSeguiment({ tipus: 'entitat', id: 'rentonar' }, config)).toEqual({ seguint: true, creatAl: primer.creatAl });
    expect(await elsMeusSeguiments(config)).toEqual([{ tipus: 'entitat', id: 'rentonar', nom: expect.any(String), creatAl: primer.creatAl }]);
    expect(await deixaDeSeguir({ tipus: 'entitat', id: 'rentonar' }, config)).toEqual({ seguint: false });
    expect(await deixaDeSeguir({ tipus: 'entitat', id: 'rentonar' }, config)).toEqual({ seguint: false });
    expect(await estatSeguiment({ tipus: 'entitat', id: 'rentonar' }, config)).toEqual({ seguint: false, creatAl: null });
    /* Tornar a seguir no és cap primera vegada: l'avís al xat no torna a eixir (R4-01). */
    expect(await segueix({ tipus: 'entitat', id: 'rentonar' }, config)).toMatchObject({ seguint: true, nou: false, primer: false });
    expect(await estatSeguiment({ tipus: 'entitat', id: 'rentonar' }, config)).toMatchObject({ seguint: true });
    expect(fetchDeProva).not.toHaveBeenCalled();
  });

  test('les regles: l’entitat que administres, tu mateix, algú de fora del padró, un tipus estrany', async () => {
    /* Amb sessió, la llavor fa propietària de l'entitat pilot (rolALEntitat) i la fitxa és la de la persona pilot. */
    await expect(segueix({ tipus: 'entitat', id: 'socdepoble' }, config)).rejects.toMatchObject({ code: 'SDP-SEG-003' });
    await expect(segueix({ tipus: 'persona', id: '0001' }, config)).rejects.toMatchObject({ code: 'SDP-SEG-003' });
    await expect(segueix({ tipus: 'persona', id: PERSONA }, config)).rejects.toMatchObject({ code: 'SDP-SEG-003' });
    await expect(segueix({ tipus: 'persona', id: 'ningu-del-poble' }, config)).rejects.toMatchObject({ code: 'SDP-SEG-002' });
    await expect(segueix({ tipus: 'entitat', id: 'cap-entitat' }, config)).rejects.toMatchObject({ code: 'SDP-SEG-002' });
    await expect(segueix({ tipus: 'grup', id: 'rentonar' }, config)).rejects.toMatchObject({ code: 'SDP-SEG-001' });
  });

  test('un bloqueig de la moderació local impedix seguir i amaga el seguiment', async () => {
    await segueix({ tipus: 'entitat', id: 'rentonar' }, config);
    await bloquejaAutor({ tipus: 'entitat', id: 'rentonar', nom: 'Rentonar' }, config);
    expect(await estatSeguiment({ tipus: 'entitat', id: 'rentonar' }, config)).toEqual({ seguint: false, creatAl: null });
    expect(await elsMeusSeguiments(config)).toEqual([]);
    await expect(segueix({ tipus: 'entitat', id: 'rentonar' }, config)).rejects.toMatchObject({ code: 'SDP-SEG-004' });
  });

  test('qui et seguix: el convidat que seguix la persona pilot apareix a la seua llista; una entitat, només per a qui l’administra', async () => {
    esborraSessio({ abast: 'tot' });
    expect(await segueix({ tipus: 'persona', id: '0001' }, config)).toMatchObject({ seguint: true, nou: true });
    expect(await segueix({ tipus: 'entitat', id: 'socdepoble' }, config)).toMatchObject({ seguint: true, nou: true });
    entra();
    const meus = await quiEmSegueix({}, config);
    expect(meus).toEqual([{ id: expect.any(String), nom: 'Veí/na', creatAl: expect.stringMatching(/^\d{4}-/) }]);
    const seus = await quiEmSegueix({ orgId: 'socdepoble' }, config);
    expect(seus).toEqual([{ id: meus[0].id, nom: 'Veí/na', creatAl: expect.stringMatching(/^\d{4}-/) }]);
    await expect(quiEmSegueix({ orgId: 'rentonar' }, config)).rejects.toMatchObject({ code: 'SDP-SEG-005' });
    await expect(quiEmSegueix({ orgId: 'cap-entitat' }, config)).rejects.toMatchObject({ code: 'SDP-SEG-005' });
    /* Qui el bloqueja ja no el veu entre qui el seguix. */
    await bloquejaAutor({ tipus: 'persona', id: meus[0].id }, config);
    expect(await quiEmSegueix({}, config)).toEqual([]);
    expect(fetchDeProva).not.toHaveBeenCalled();
  });
});
