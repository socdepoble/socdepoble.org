import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const simulacio = vi.hoisted(() => ({ rpc: vi.fn(), usuari: null, entrada: 0 }));
vi.mock('./runtime.js', () => ({
  getCurrentUser: () => simulacio.usuari,
  getResolvedConfig: config => ({ runtimeDataMode: config.dataMode ?? 'remote', hasSupabaseConfig: true,
    tenantId: '11000000-0000-4000-8000-000000000001' }),
  rpc: simulacio.rpc,
  esRpcAbsent: error => error?.status === 404 && error?.postgrestCode === 'PGRST202'
}));
vi.mock('./capacitatRpc.js', () => ({
  esCapacitatRpcNoDisponible: error => error?.codi === 'capacitat-no-disponible',
  rpcOpcional: (nom, cos, config, { disponible, ...opcions }) => disponible
    ? simulacio.rpc(nom, cos, config, opcions)
    : Promise.reject(Object.assign(new Error('Capacitat no disponible.'), { codi: 'capacitat-no-disponible' }))
}));
vi.mock('../identitat.js', () => ({
  capturaSessio: () => {
    const entrada = simulacio.entrada;
    return () => {
      if (entrada !== simulacio.entrada) throw new DOMException('La sessió ha canviat.', 'AbortError');
    };
  }
}));

import { lligPublicadorsRegistrats, reverteixTraspasPublicacio, traspassaPublicacio } from './copublicacio.js';

const REC = Object.freeze({ recursTipus: 'pagina', recursId: 'receptes' });
const A = '33000000-0000-4000-8000-000000000001';
const B = '33000000-0000-4000-8000-000000000002';
const OP = '55000000-0000-4000-8000-00000000000a';
const ALTRA_OP = '55000000-0000-4000-8000-00000000000b';
const TENANT = '11000000-0000-4000-8000-000000000001';
const TRASPAS = Object.freeze({ ...REC, nouActorRegistratId: A, versioEsperada: 0, operacioId: OP });
const REVERSIO = Object.freeze({ ...REC, traspasId: OP, versioEsperada: 1, operacioId: ALTRA_OP });

const actor = (id, rol = 'principal') => ({
  actor_id: id, slug_ruta: `/perfil/${id}?registre=organitzacio`, nom: 'Entitat de prova',
  avatar_url: null, poble_nom: 'Poble de prova', rol_publicacio: rol
});
const resposta = (versio, publicadorsRegistrats = [], altres = {}) =>
  ({ ...REC, versio, publicadorsRegistrats, ...altres });

beforeEach(() => {
  vi.stubEnv('VITE_SDP_COPUBLICACIO', '1');
  simulacio.rpc.mockReset();
  simulacio.usuari = { id: A };
  simulacio.entrada = 1;
});
afterEach(() => vi.unstubAllEnvs());

describe('Contracte R19 de co-publicació', () => {
  test('R21.1 v2 · sense declaració de desplegament no fa cap lectura ni mutació remota', async () => {
    vi.stubEnv('VITE_SDP_COPUBLICACIO', '');
    await expect(lligPublicadorsRegistrats(REC)).rejects.toMatchObject({ code: 'no-disponible' });
    await expect(traspassaPublicacio(TRASPAS)).rejects.toMatchObject({ code: 'no-disponible' });
    await expect(reverteixTraspasPublicacio(REVERSIO)).rejects.toMatchObject({ code: 'no-disponible' });
    expect(simulacio.rpc).not.toHaveBeenCalled();
    // La reserva local continua llegible amb la bandera apagada.
    expect((await lligPublicadorsRegistrats(REC, { dataMode: 'local' })).publicadorsRegistrats).toEqual([]);
  });

  test('R21.1 v2 · només una absència de funció acreditada es degrada; un 404 inesperat continua visible', async () => {
    const inesperat = Object.assign(new Error('Ruta inesperada.'), { status: 404 });
    simulacio.rpc.mockRejectedValueOnce(inesperat);
    await expect(lligPublicadorsRegistrats(REC)).rejects.toBe(inesperat);
    simulacio.rpc.mockRejectedValueOnce(Object.assign(new Error('Funció absent.'), { status: 404, postgrestCode: 'PGRST202' }));
    await expect(traspassaPublicacio(TRASPAS)).rejects.toMatchObject({ code: 'no-disponible' });
  });
  test('el publicador oficial es resol sense barrejar-lo amb el padró o la font editorial', async () => {
    simulacio.rpc.mockResolvedValue(resposta(0, [], { publicadorEfectiu: { actor_id: 'inventat' }, copyright: 'forjat' }));
    const r = await lligPublicadorsRegistrats(REC);
    expect(r).toEqual({ ...REC, versio: 0, publicadorsRegistrats: [], publicadorEfectiu: expect.objectContaining({
      actor_id: 'socdepoble', nom: 'Sóc de Poble', slug_ruta: '/socdepoble', rol_publicacio: 'principal'
    }) });
    expect(simulacio.rpc).toHaveBeenCalledWith('llig_publicadors_registrats',
      { p_tenant_id: TENANT, p_tipus: 'pagina', p_recurs_id: 'receptes' }, {}, { signal: undefined });
  });

  test('els actors registrats ixen en ordre, amb les metadades públiques exactes', async () => {
    const a = actor(A);
    const b = actor(B, 'copublicador');
    simulacio.rpc.mockResolvedValue(resposta(1, [{ ...a, email: 'privat@prova.invalid' }, b]));
    expect(await lligPublicadorsRegistrats(REC)).toEqual({ ...resposta(1, [a, b]), publicadorEfectiu: a });
  });

  test('el traspàs captura només UUIDs i selectors, i normalitza el rebut', async () => {
    const a = actor(A);
    const b = actor(B, 'copublicador');
    simulacio.rpc.mockResolvedValue(resposta(1, [a, b], { operacioId: OP, repetida: false, versioOperacio: 1 }));
    const r = await traspassaPublicacio({ ...TRASPAS, operacioId: OP.toUpperCase(),
      copublicadorsRegistratsIds: [B], mantindreCopublicadorSdp: true });
    expect(r).toEqual({ ...resposta(1, [a, b]), publicadorEfectiu: a, operacioId: OP, repetida: false, versioOperacio: 1 });
    expect(simulacio.rpc).toHaveBeenCalledWith('traspassa_publicacio', {
      p_tenant_id: TENANT, p_tipus: 'pagina', p_recurs_id: 'receptes',
      p_actor_id: A, p_copublicadors_ids: [B], p_mantindre_sdp: true, p_operacio_id: OP, p_versio_esperada: 0
    }, {}, { signal: undefined });
  });

  test('reversió amb CAS i reintent després d’una altra operació', async () => {
    simulacio.rpc.mockResolvedValue(resposta(5, [actor(B)], { operacioId: ALTRA_OP, repetida: true, versioOperacio: 2 }));
    const r = await reverteixTraspasPublicacio(REVERSIO);
    expect([r.versio, r.versioOperacio, r.repetida]).toEqual([5, 2, true]);
    expect(simulacio.rpc).toHaveBeenCalledWith('reverteix_traspas_publicacio', {
      p_tenant_id: TENANT, p_tipus: 'pagina', p_recurs_id: 'receptes',
      p_traspas_id: OP, p_operacio_id: ALTRA_OP, p_versio_esperada: 1
    }, {}, { signal: undefined });
  });

  test('rebutja autoria, llicència, getters, actors repetits, arrays amb forats i versió falsa abans de la RPC', async () => {
    const llig = vi.fn(() => A);
    const ambGetter = Object.defineProperty({ ...TRASPAS }, 'nouActorRegistratId', { get: llig });
    const forat = Array(1);
    for (const input of [
      { ...TRASPAS, copyright: 'CC0' }, { ...TRASPAS, tenantId: TENANT }, ambGetter,
      { ...TRASPAS, copublicadorsRegistratsIds: [A.toUpperCase()] },
      { ...TRASPAS, copublicadorsRegistratsIds: forat },
      { ...TRASPAS, copublicadorsRegistratsIds: null },
      { ...TRASPAS, mantindreCopublicadorSdp: null },
      { ...TRASPAS, versioEsperada: '0' }, { ...TRASPAS, versioEsperada: 2147483647 }
    ]) {
      await expect(traspassaPublicacio(input)).rejects.toMatchObject({ code: 'publicacio-invalida' });
    }
    await expect(reverteixTraspasPublicacio({ ...REVERSIO, operacioId: OP })).rejects.toMatchObject({ code: 'publicacio-invalida' });
    expect(llig).not.toHaveBeenCalled();
    expect(simulacio.rpc).not.toHaveBeenCalled();
  });

  test('rebutja publicadors repetits, una ruta forjada, una resposta creuada i un rebut incoherent', async () => {
    for (const valor of [
      resposta(1, [actor(A), actor(A, 'copublicador')]),
      resposta(1, [{ ...actor(A), slug_ruta: '//hostil.invalid' }]),
      resposta(1, [actor(A)], { recursId: 'un-altre-recurs' }),
      resposta(1, [actor('socdepoble')])
    ]) {
      simulacio.rpc.mockResolvedValueOnce(valor);
      await expect(lligPublicadorsRegistrats(REC)).rejects.toMatchObject({ code: 'resposta-invalida' });
    }
    simulacio.rpc.mockResolvedValueOnce(resposta(2, [actor(A)], { operacioId: OP, repetida: false, versioOperacio: 1 }));
    await expect(traspassaPublicacio(TRASPAS)).rejects.toMatchObject({ code: 'resposta-invalida' });
  });

  test('la reserva local és llegible i el mode de prova no fingix l’autorització ni fa xarxa', async () => {
    const mode = { dataMode: 'local' };
    expect((await lligPublicadorsRegistrats(REC, mode)).publicadorsRegistrats).toEqual([]);
    await expect(traspassaPublicacio(TRASPAS, mode)).rejects.toMatchObject({ code: 'no-disponible' });
    await expect(reverteixTraspasPublicacio(REVERSIO, { dataMode: 'seed' })).rejects.toMatchObject({ code: 'no-disponible' });
    simulacio.usuari = null;
    await expect(traspassaPublicacio(TRASPAS)).rejects.toMatchObject({ code: 'sense-sessio' });
    expect(simulacio.rpc).not.toHaveBeenCalled();
  });

  test('els codis de servidor són neutrals i els resultats s’anul·len quan canvia la sessió', async () => {
    for (const [id, code] of [
      ['003', 'publicador-no-registrat'], ['004', 'conflicte-versio'], ['005', 'operacio-reutilitzada'],
      ['006', 'publicador-oficial-no-configurat'], ['007', 'cal-segon-factor'], ['008', 'sense-permis']
    ]) {
      simulacio.rpc.mockRejectedValueOnce(new Error(`Supabase: SDP-COPUB-${id}: intern`));
      await expect(traspassaPublicacio(TRASPAS)).rejects.toMatchObject({ code });
    }
    simulacio.rpc.mockImplementationOnce(async () => { simulacio.entrada++; return resposta(0); });
    await expect(lligPublicadorsRegistrats(REC)).rejects.toMatchObject({ name: 'AbortError' });
    const control = new AbortController();
    control.abort();
    await expect(lligPublicadorsRegistrats(REC, { signal: control.signal })).rejects.toMatchObject({ name: 'AbortError' });
  });
});
