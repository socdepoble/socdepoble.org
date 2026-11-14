import { describe, expect, it, vi } from 'vitest';
import {
  ESTATS_CONNEXIO_RURAL,
  ESTATS_MISSATGE_RURAL,
  aplicaCursorDestinatari,
  calculaRetardReintentRural,
  confirmaEnviamentServidor,
  construeixAmbitCuaRural,
  creaCuaSincronitzacioRural,
  creaRegistreMissatgeRural,
  derivaEstatConnexioRural,
  descriptorVisualEstatMissatge,
  marcaErrorReintentable,
} from './estatSincronitzacioRural.js';

const UUID_A = '11111111-2222-4333-8444-555555555555';
const UUID_B = '66666666-7777-4888-8999-aaaaaaaaaaaa';
const FIL_1 = 'ffffffff-eeee-4ddd-8ccc-bbbbbbbbbbbb';

describe('estatSincronitzacioRural · R25-B (Emowe · honestedat rural sense falsos ✓✓)', () => {
  const ambitPersonal = construeixAmbitCuaRural({
    backend: 'supabase-prod',
    tenantId: 'la-torre-de-les-macanes',
    usuariId: 'usuari-javi',
    actorOrgId: null,
  });

  const ambitBotiga = construeixAmbitCuaRural({
    backend: 'supabase-prod',
    tenantId: 'la-torre-de-les-macanes',
    usuariId: 'usuari-javi',
    actorOrgId: 'org-forn-del-poble',
  });

  it('naix en cua_local amb icona de rellotge (0 checks) i prohibeix marcar ✓ sense seq real del servidor', () => {
    const inicial = creaRegistreMissatgeRural({
      ambit: ambitPersonal,
      filId: FIL_1,
      clientMsgId: UUID_A,
      text: 'Guardeu-me una fogassa per a migdia',
      araMs: 1000,
    });

    expect(inicial.estat).toBe(ESTATS_MISSATGE_RURAL.CUA_LOCAL);
    expect(descriptorVisualEstatMissatge(inicial)).toMatchObject({
      icona: 'rellotge_local',
      checks: 0,
      pendentXarxa: true,
    });

    // Fonts espúries o HTTP 200 sense seq es rebutgen matemàticament
    expect(() => confirmaEnviamentServidor(inicial, { font: 'navigator_online', id: UUID_A, seq: 1 }))
      .toThrow(/no acredita/i);
    expect(() => confirmaEnviamentServidor(inicial, { font: 'http_ok_sense_seq', id: UUID_A }))
      .toThrow(/no acredita/i);
    expect(() => confirmaEnviamentServidor(inicial, { id: UUID_A, seq: 0 }))
      .toThrow(/seq enter segur/i);
    expect(() => confirmaEnviamentServidor(inicial, { id: UUID_B, seq: 7 }))
      .toThrow(/no coincideix amb client_msg_id/i);

    const enviat = confirmaEnviamentServidor(inicial, {
      id: UUID_A,
      seq: 12,
      creatEl: '2026-11-14T16:35:00.000Z',
    });
    expect(enviat.estat).toBe(ESTATS_MISSATGE_RURAL.ENVIAT_SERVIDOR);
    expect(enviat.seq).toBe(12);
    expect(descriptorVisualEstatMissatge(enviat)).toMatchObject({
      icona: 'check_unic',
      checks: 1,
      lecturaConfirmada: false,
      pendentXarxa: false,
    });
  });

  it('prohibeix marcar ✓✓ sense cursor real del destinatari i garanteix transicions monòtones davant desordre', () => {
    const inicial = creaRegistreMissatgeRural({
      ambit: ambitPersonal,
      filId: FIL_1,
      clientMsgId: UUID_A,
      text: 'Ja he regat els tarongers',
    });

    // Sense seq de servidor mai pot passar a ✓✓
    expect(() => aplicaCursorDestinatari(inicial, { rebutPelsAltresFinsSeq: 50 }))
      .toThrow(/encara no té seq confirmat/i);

    const enviat = confirmaEnviamentServidor(inicial, { id: UUID_A, seq: 25 });

    // ACK de proveïdor Push o despertar del Service Worker es rebutgen com a prova d'entrega
    expect(() => aplicaCursorDestinatari(enviat, { font: 'push_provider', rebutPelsAltresFinsSeq: 30 }))
      .toThrow(/font no acreditada/i);
    expect(() => aplicaCursorDestinatari(enviat, { font: 'service_worker_wake', rebutPelsAltresFinsSeq: 30 }))
      .toThrow(/font no acreditada/i);

    // El cursor del mateix autor NO compta mai com a destinatari
    const senseAutoCheck = aplicaCursorDestinatari(enviat, {
      usuariCursorId: 'usuari-javi',
      autorUsuariId: 'usuari-javi',
      rebutPelsAltresFinsSeq: 99,
      llegitPelsAltresFinsSeq: 99,
    });
    expect(senseAutoCheck.estat).toBe(ESTATS_MISSATGE_RURAL.ENVIAT_SERVIDOR);

    // Cursor inferior al seq del missatge no el promou
    expect(aplicaCursorDestinatari(enviat, { rebutPelsAltresFinsSeq: 24 }).estat)
      .toBe(ESTATS_MISSATGE_RURAL.ENVIAT_SERVIDOR);

    // Cursor real de recepció >= 25 -> ✓✓ gris
    const entregat = aplicaCursorDestinatari(enviat, { rebutPelsAltresFinsSeq: 25 });
    expect(entregat.estat).toBe(ESTATS_MISSATGE_RURAL.ENTREGAT_DESTINATARI);
    expect(descriptorVisualEstatMissatge(entregat)).toMatchObject({
      icona: 'doble_check_gris',
      checks: 2,
      lecturaConfirmada: false,
    });

    // Cursor real de lectura >= 25 -> ✓✓ blau
    const llegit = aplicaCursorDestinatari(entregat, { llegitPelsAltresFinsSeq: 28 });
    expect(llegit.estat).toBe(ESTATS_MISSATGE_RURAL.LLEGIT_DESTINATARI);
    expect(descriptorVisualEstatMissatge(llegit)).toMatchObject({
      icona: 'doble_check_blau',
      checks: 2,
      lecturaConfirmada: true,
    });

    // Esdeveniments endarrerits fora d'ordre MAI degraden ✓✓ blau a gris ni a ✓ ni a error
    const retardRecepcio = aplicaCursorDestinatari(llegit, { rebutPelsAltresFinsSeq: 25 });
    expect(retardRecepcio.estat).toBe(ESTATS_MISSATGE_RURAL.LLEGIT_DESTINATARI);

    const retardRpc = confirmaEnviamentServidor(llegit, { id: UUID_A, seq: 25 });
    expect(retardRpc.estat).toBe(ESTATS_MISSATGE_RURAL.LLEGIT_DESTINATARI);

    const falsErrorTarda = marcaErrorReintentable(llegit, new Error('Timeout tardà'));
    expect(falsErrorTarda.estat).toBe(ESTATS_MISSATGE_RURAL.LLEGIT_DESTINATARI);
  });

  it('informa amb honestedat persistitLocal=false davant QuotaExceededError i reintenta amb el mateix client_msg_id', async () => {
    let rellotgeMs = 10_000;
    const adaptadorPle = {
      desa: vi.fn(async () => {
        const quotaErr = new Error('The quota has been exceeded.');
        quotaErr.name = 'QuotaExceededError';
        throw quotaErr;
      }),
      carrega: vi.fn(async () => []),
      esborra: vi.fn(async () => {}),
    };

    const cua = creaCuaSincronitzacioRural({
      ambitInicial: ambitPersonal,
      adaptadorPersistencia: adaptadorPle,
      ara: () => rellotgeMs,
      opcionsBackoff: { baseMs: 1000, maxMs: 8000, factorJitter: 0, aleatori: () => 0.5 },
    });

    const encuat = await cua.encua({
      filId: FIL_1,
      client_msg_id: UUID_A,
      text: 'Pujo al mas, ara no tinc cobertura',
    });

    expect(encuat.persistitLocal).toBe(false);
    expect(encuat.avisPersistencia).toBe('QuotaExceededError');
    expect(cua.comptaPendents()).toBe(1);

    // Primer intent de drenatge falla per tall de cobertura rural
    const enviaFallit = vi.fn(async () => {
      throw new Error('Failed to fetch');
    });
    const r1 = await cua.drenaPendents(enviaFallit);
    expect(r1).toHaveLength(1);
    expect(r1[0].ok).toBe(false);
    expect(r1[0].registre.estat).toBe(ESTATS_MISSATGE_RURAL.ERROR_REINTENTABLE);
    expect(r1[0].registre.properReintentMs).toBe(11_000);

    // Abans d'arribar al backoff (10_500 ms), un drenatge no forçat respecta el temporitzador
    rellotgeMs = 10_500;
    const enviaPrevi = vi.fn();
    expect(await cua.drenaPendents(enviaPrevi)).toHaveLength(0);
    expect(enviaPrevi).not.toHaveBeenCalled();

    // Quan venç el backoff (11_000 ms), reintenta amb el MATEIX client_msg_id i confirma ✓
    rellotgeMs = 11_000;
    const enviaOk = vi.fn(async (_filId, payload) => ({
      id: payload.client_msg_id,
      seq: 77,
    }));
    const r2 = await cua.drenaPendents(enviaOk);
    expect(r2).toHaveLength(1);
    expect(r2[0].ok).toBe(true);
    expect(r2[0].registre.estat).toBe(ESTATS_MISSATGE_RURAL.ENVIAT_SERVIDOR);
    expect(r2[0].registre.seq).toBe(77);
    expect(enviaOk.mock.calls[0][1].client_msg_id).toBe(UUID_A);
    expect(cua.comptaPendents()).toBe(0);
  });

  it('aïlla les cues per backend::tenantId::usuariId::actorOrgId i bloqueja drenatges creuats en canviar d\'entitat o logout', async () => {
    const cua = creaCuaSincronitzacioRural({ ambitInicial: ambitPersonal });

    await cua.encua({
      filId: FIL_1,
      client_msg_id: UUID_A,
      text: 'Missatge privat com a veí Javi',
    });

    // Canviem a actuar com a entitat Botiga del Poble: la cua activa NO veu ni drena el missatge personal!
    cua.canviaAmbitActiu(ambitBotiga);
    expect(cua.llistaMissatges()).toHaveLength(0);

    const enviaBotiga = vi.fn();
    expect(await cua.drenaPendents(enviaBotiga)).toHaveLength(0);
    expect(enviaBotiga).not.toHaveBeenCalled();

    await expect(cua.drenaPendents(enviaBotiga, { ambit: ambitPersonal }))
      .rejects.toMatchObject({ codi: 'DRENATGE_AMBIT_INACTIU' });

    // En purgar la partició personal per logout, desapareix completament
    await cua.purgaAmbit(ambitPersonal);
    cua.canviaAmbitActiu(ambitPersonal);
    expect(cua.llistaMissatges()).toHaveLength(0);
  });

  it('calcula backoff exponencial amb jitter acotat i deriva els 4 estats de cobertura rural', () => {
    expect(calculaRetardReintentRural(0, { baseMs: 1000, maxMs: 30000, factorJitter: 0 })).toBe(1000);
    expect(calculaRetardReintentRural(3, { baseMs: 1000, maxMs: 30000, factorJitter: 0 })).toBe(8000);
    expect(calculaRetardReintentRural(9, { baseMs: 1000, maxMs: 30000, factorJitter: 0.25, aleatori: () => 1 }))
      .toBe(30000);

    expect(derivaEstatConnexioRural({ navigatorOnline: false })).toBe(ESTATS_CONNEXIO_RURAL.FORA_DE_LINIA);
    expect(derivaEstatConnexioRural({ navigatorOnline: true, sincronitzant: true })).toBe(ESTATS_CONNEXIO_RURAL.SINCRONITZANT);
    expect(derivaEstatConnexioRural({ navigatorOnline: true, falladesRecents: 2 })).toBe(ESTATS_CONNEXIO_RURAL.COBERTURA_INESTABLE);
    expect(derivaEstatConnexioRural({ navigatorOnline: true, rttMs: 2400 })).toBe(ESTATS_CONNEXIO_RURAL.COBERTURA_INESTABLE);
    expect(derivaEstatConnexioRural({ navigatorOnline: true, rttMs: 180, falladesRecents: 0 })).toBe(ESTATS_CONNEXIO_RURAL.EN_LINIA);
  });

  it('R25.2-X03/X04: rebutja reutilitzar UUID en un altre fil i deduplica drenaPendents en vol sense degradar ACKs', async () => {
    const cua = creaCuaSincronitzacioRural({ ambitInicial: ambitPersonal });
    const FIL_2 = 'eeeeeeee-dddd-4ccc-8bbb-aaaaaaaaaaaa';

    await cua.encua({
      filId: FIL_1,
      client_msg_id: UUID_A,
      text: 'Primer fil legítim',
    });

    // R25.2-X03: reutilitzar UUID_A en FIL_2 es rebutja sense sobreescriure el pendent de FIL_1
    await expect(
      cua.encua({
        filId: FIL_2,
        client_msg_id: UUID_A,
        text: 'Intent de reutilització creuada',
      }),
    ).rejects.toMatchObject({ codi: 'COLISIO_UUID_ENTRE_FILS' });
    expect(cua.llistaMissatges()).toHaveLength(1);
    expect(cua.llistaMissatges()[0].filId).toBe(FIL_1);

    // R25.2-X04: dues crides concurrents a drenaPendents comparteixen un únic drenatge en vol
    let resolTransport;
    const barrera = new Promise((r) => { resolTransport = r; });
    const enviaUnic = vi.fn(async (_fil, payload) => {
      await barrera;
      return { id: payload.client_msg_id, seq: 101 };
    });

    const d1 = cua.drenaPendents(enviaUnic);
    const d2 = cua.drenaPendents(enviaUnic);
    resolTransport();
    const [res1, res2] = await Promise.all([d1, d2]);

    expect(enviaUnic).toHaveBeenCalledTimes(1);
    expect(res1).toBe(res2);
    expect(cua.llistaMissatges()[0].estat).toBe(ESTATS_MISSATGE_RURAL.ENVIAT_SERVIDOR);
  });
});
