import { describe, expect, it, vi } from 'vitest';
import {
  creaServeiXat,
  esErrorJwtCaducat,
  normalitzaMissatgeSortida,
} from '../serveiXat.js';

const UUID_1 = '11111111-1111-4111-8111-111111111111';
const UUID_2 = '22222222-2222-4222-8222-222222222222';
const UUID_3 = '33333333-3333-4333-8333-333333333333';
const UUID_4 = '44444444-4444-4444-8444-444444444444';
const UUID_5 = '55555555-5555-4555-8555-555555555555';
const FIL_PROVA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

function contextBase(extres = {}) {
  return {
    backend: 'supabase-prod',
    tenantId: 'la-torre-de-les-macanes',
    usuariId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    actorOrgId: null,
    autenticat: true,
    ...extres,
  };
}

describe('serveiXat · P1-XAT-04 (renovació JWT + reintent idempotent acotat)', () => {
  it('classifica amb precisió errors de JWT caducat i exclou 403 / RLS / domini', () => {
    expect(esErrorJwtCaducat(Object.assign(new Error('Unauthorized'), { status: 401 }))).toBe(true);
    expect(esErrorJwtCaducat(Object.assign(new Error('JWT expired'), { code: 'PGRST301' }))).toBe(true);
    expect(esErrorJwtCaducat(Object.assign(new Error('La sessió ha caducat.'), { codi: 'SESSIO_CADUCADA' }))).toBe(true);
    expect(esErrorJwtCaducat(new Error('PostgREST: token is expired'))).toBe(true);

    expect(esErrorJwtCaducat(Object.assign(new Error('Forbidden'), { status: 403 }))).toBe(false);
    expect(esErrorJwtCaducat(Object.assign(new Error('new row violates row-level security'), { code: '42501' }))).toBe(false);
    expect(esErrorJwtCaducat(Object.assign(new Error('Sense permís'), { codi: 'SENSE_PERMIS', status: 401 }))).toBe(false);
    expect(esErrorJwtCaducat(Object.assign(new Error('Fil tancat'), { code: 'SDP-XAT-FIL' }))).toBe(false);
    expect(esErrorJwtCaducat(new DOMException('Cancel·lat', 'AbortError'))).toBe(false);
  });

  it('reintenta exactament una vegada després de 401 / JWT expired preservant id i client_msg_id', async () => {
    let tokenVigent = 'jwt-vell';
    const intentsRebuts = [];

    const enviaMissatge = vi.fn(async (filId, payload) => {
      intentsRebuts.push({ filId, payload, tokenVigent });
      if (intentsRebuts.length === 1) {
        throw Object.assign(new Error('JWT expired'), { status: 401, code: 'PGRST301' });
      }
      return {
        id: payload.id,
        filId,
        seq: 42,
        text: payload.text,
        creatEl: '2026-11-14T16:30:00.000Z',
      };
    });

    const refreshSession = vi.fn(async () => {
      tokenVigent = 'jwt-nou';
      return true;
    });

    const servei = creaServeiXat({
      enviaMissatge,
      refreshSession,
      obteContextSessio: () => contextBase(),
      generaUuid: () => UUID_1,
    });

    const entradaMutable = { text: 'Bon dia des del bancal!', metadades: { prioritat: 'normal' } };
    const resposta = await servei.enviaMissatge(FIL_PROVA, entradaMutable);

    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(enviaMissatge).toHaveBeenCalledTimes(2);
    expect(intentsRebuts[0].payload.id).toBe(UUID_1);
    expect(intentsRebuts[0].payload.client_msg_id).toBe(UUID_1);
    expect(intentsRebuts[1].payload).toBe(intentsRebuts[0].payload);
    expect(intentsRebuts[1].tokenVigent).toBe('jwt-nou');
    expect(resposta).toMatchObject({
      id: UUID_1,
      client_msg_id: UUID_1,
      seq: 42,
      text: 'Bon dia des del bancal!',
    });
  });

  it('falla de forma terminal sense bucle infinit si refreshSession falla o si el segon intent torna 401', async () => {
    // Cas A: refreshSession retorna false -> 1 sol intent d'enviament, 0 reintents
    const enviaCasA = vi.fn(async () => {
      throw Object.assign(new Error('JWT expired'), { status: 401 });
    });
    const refreshCasA = vi.fn(async () => false);
    const serveiA = creaServeiXat({
      enviaMissatge: enviaCasA,
      refreshSession: refreshCasA,
      obteContextSessio: () => contextBase(),
      generaUuid: () => UUID_1,
    });

    await expect(serveiA.enviaMissatge(FIL_PROVA, { text: 'Intent A' })).rejects.toMatchObject({
      codi: 'SESSIO_CADUCADA',
      retriable: false,
      refreshFallit: true,
    });
    expect(enviaCasA).toHaveBeenCalledTimes(1);
    expect(refreshCasA).toHaveBeenCalledTimes(1);

    // Cas B: refreshSession té èxit però el segon intent torna a rebre 401 -> para en sec (2 enviaments, 1 refresc)
    const enviaCasB = vi.fn(async () => {
      throw Object.assign(new Error('Invalid JWT'), { status: 401 });
    });
    const refreshCasB = vi.fn(async () => true);
    const serveiB = creaServeiXat({
      enviaMissatge: enviaCasB,
      refreshSession: refreshCasB,
      obteContextSessio: () => contextBase(),
      generaUuid: () => UUID_2,
    });

    await expect(serveiB.enviaMissatge(FIL_PROVA, { text: 'Intent B' })).rejects.toMatchObject({
      codi: 'SESSIO_CADUCADA',
      retriable: false,
      reintentEsgotat: true,
    });
    expect(enviaCasB).toHaveBeenCalledTimes(2);
    expect(refreshCasB).toHaveBeenCalledTimes(1);
  });

  it('no crida mai refreshSession ni reintenta davant un error 403 / RLS', async () => {
    const errorPermis = Object.assign(new Error('No tens permís per escriure en aquest fil.'), {
      status: 403,
      code: '42501',
      codi: 'SENSE_PERMIS',
      retriable: false,
    });
    const enviaMissatge = vi.fn(async () => {
      throw errorPermis;
    });
    const refreshSession = vi.fn(async () => true);

    const servei = creaServeiXat({
      enviaMissatge,
      refreshSession,
      obteContextSessio: () => contextBase(),
      generaUuid: () => UUID_1,
    });

    await expect(servei.enviaMissatge(FIL_PROVA, { text: 'Prohibit' })).rejects.toBe(errorPermis);
    expect(enviaMissatge).toHaveBeenCalledTimes(1);
    expect(refreshSession).not.toHaveBeenCalled();
  });

  it('deduplica refreshSession quan 5 enviaments concurrents reben 401 simultàniament', async () => {
    let sessioRenovada = false;
    let resolRefresc;
    const barreraRefresc = new Promise((resolve) => {
      resolRefresc = resolve;
    });

    const enviaMissatge = vi.fn(async (filId, payload) => {
      if (!sessioRenovada) {
        throw Object.assign(new Error('JWT expired'), { status: 401, code: 'PGRST301' });
      }
      return { id: payload.id, filId, seq: Number(payload.metadades.ordre), text: payload.text };
    });

    const refreshSession = vi.fn(async () => {
      await barreraRefresc;
      sessioRenovada = true;
      return { ok: true, access_token: 'jwt-fresc' };
    });

    const servei = creaServeiXat({
      enviaMissatge,
      refreshSession,
      obteContextSessio: () => contextBase(),
    });

    const uuids = [UUID_1, UUID_2, UUID_3, UUID_4, UUID_5];
    const promeses = uuids.map((uuid, idx) =>
      servei.enviaMissatge(FIL_PROVA, {
        client_msg_id: uuid,
        text: `Missatge ${idx + 1}`,
        metadades: { ordre: idx + 1 },
      }),
    );

    await Promise.resolve();
    await Promise.resolve();
    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(servei.teRefrescEnVol()).toBe(true);

    resolRefresc();
    const resultats = await Promise.all(promeses);

    expect(servei.teRefrescEnVol()).toBe(false);
    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(enviaMissatge).toHaveBeenCalledTimes(10);
    expect(resultats.map((r) => r.client_msg_id)).toEqual(uuids);
    expect(resultats.map((r) => r.seq)).toEqual([1, 2, 3, 4, 5]);
  });

  it('congela el payload contra mutacions en vol i rebutja col·lisions de client_msg_id amb text diferent', async () => {
    let resolRefresc;
    const esperaRefresc = new Promise((resolve) => {
      resolRefresc = resolve;
    });
    let renovat = false;
    const textosEnviats = [];

    const servei = creaServeiXat({
      enviaMissatge: vi.fn(async (_filId, payload) => {
        textosEnviats.push(payload.text);
        if (!renovat) {
          throw Object.assign(new Error('JWT expired'), { status: 401 });
        }
        return { id: payload.id, seq: 9, text: payload.text };
      }),
      refreshSession: vi.fn(async () => {
        await esperaRefresc;
        renovat = true;
        return true;
      }),
      obteContextSessio: () => contextBase(),
    });

    const esborrany = { client_msg_id: UUID_1, text: 'Text original íntegre' };
    const enviamentEnCurs = servei.enviaMissatge(FIL_PROVA, esborrany);

    // Mutem l'objecte extern mentre el refresc està pendent: el payload congelat NO ha de canviar.
    esborrany.text = 'Text manipulat per error de UI';
    resolRefresc();

    const resultat = await enviamentEnCurs;
    expect(textosEnviats).toEqual(['Text original íntegre', 'Text original íntegre']);
    expect(resultat.text).toBe('Text original íntegre');

    // Reutilitzar el mateix client_msg_id amb un text diferent ha de fallar abans d'arribar a la xarxa.
    await expect(
      servei.enviaMissatge(FIL_PROVA, { client_msg_id: UUID_1, text: 'Un altre text amb el mateix UUID' }),
    ).rejects.toMatchObject({
      codi: 'COLISIO_PAYLOAD_IDEMPOTENT',
      retriable: false,
    });

    // I id i client_msg_id incoherents es rebutgen d'entrada.
    expect(() =>
      normalitzaMissatgeSortida({ id: UUID_1, client_msg_id: UUID_2, text: 'Incoherent' }),
    ).toThrow(/coincidir exactament/i);
  });

  it('avorta sense reintentar si durant el refresc canvia usuariId, tenantId o actorOrgId (o hi ha logout)', async () => {
    let ctxActual = contextBase({ actorOrgId: null });

    const enviaMissatge = vi.fn(async () => {
      throw Object.assign(new Error('JWT expired'), { status: 401 });
    });

    const refreshSession = vi.fn(async () => {
      // Simulem que durant el refresc l'usuari passa a actuar com a entitat/botiga
      ctxActual = contextBase({ actorOrgId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' });
      return true;
    });

    const servei = creaServeiXat({
      enviaMissatge,
      refreshSession,
      obteContextSessio: () => ctxActual,
      generaUuid: () => UUID_3,
    });

    await expect(servei.enviaMissatge(FIL_PROVA, { text: 'Missatge personal' })).rejects.toMatchObject({
      codi: 'SESSIO_CANVIADA',
      retriable: false,
    });
    expect(enviaMissatge).toHaveBeenCalledTimes(1);
    expect(refreshSession).toHaveBeenCalledTimes(1);
  });

  it('R25.2-X01/X02: detecta logout->login del mateix UUID (generacioLogin distinta) i passa un AbortSignal viu per intent', async () => {
    let genActual = 7;
    const senyalsRebuts = [];

    const enviaMissatge = vi.fn(async (_filId, payload, opts) => {
      senyalsRebuts.push(opts.signal);
      expect(opts.signal).toBeInstanceOf(AbortSignal);
      expect(opts.signal.aborted).toBe(false);
      if (senyalsRebuts.length === 1) {
        throw Object.assign(new Error('JWT expired'), { status: 401 });
      }
      return { id: payload.id, seq: 11, text: payload.text };
    });

    const refreshRenovacio = vi.fn(async () => true); // mateixa generació 7 -> OK
    const serveiOk = creaServeiXat({
      enviaMissatge,
      refreshSession: refreshRenovacio,
      obteContextSessio: () => contextBase({ generacioLogin: genActual }),
      generaUuid: () => UUID_4,
    });

    const ok = await serveiOk.enviaMissatge(FIL_PROVA, { text: 'Renovació neta' });
    expect(ok.seq).toBe(11);
    expect(senyalsRebuts).toHaveLength(2);
    expect(senyalsRebuts[0]).not.toBe(senyalsRebuts[1]); // senyal viu independent per intent!

    // Ara simulem logout -> login del MATEIX usuariId (generacioLogin passa de 7 a 8 durant el refresc)
    const enviaLogoutLogin = vi.fn(async () => {
      throw Object.assign(new Error('JWT expired'), { status: 401 });
    });
    const refreshLogoutLogin = vi.fn(async () => {
      genActual = 8;
      return true;
    });
    const serveiTrencat = creaServeiXat({
      enviaMissatge: enviaLogoutLogin,
      refreshSession: refreshLogoutLogin,
      obteContextSessio: () => contextBase({ generacioLogin: genActual }),
      generaUuid: () => UUID_5,
    });

    await expect(serveiTrencat.enviaMissatge(FIL_PROVA, { text: 'Sessió anterior' })).rejects.toMatchObject({
      codi: 'SESSIO_CANVIADA',
      retriable: false,
    });
    expect(enviaLogoutLogin).toHaveBeenCalledTimes(1);
  });
});
