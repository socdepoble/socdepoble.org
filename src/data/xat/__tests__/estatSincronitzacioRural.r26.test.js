/**
 * estatSincronitzacioRural.r26.test.js — Microsondes permanents de les
 * troballes R25.2-X03 i R25.2-X04 de l'auditoria de Codex (261114_1737), més
 * dues vores que la mateixa auditoria deixa obertes: la partició que es purga
 * i es torna a crear amb el mateix àmbit (eixir i tornar a entrar com la
 * mateixa persona) i la rehidratació des del disc, que no pot pintar un ✓
 * sense seq del servidor.
 */
import { describe, expect, it, vi } from 'vitest';
import {
  ESTATS_MISSATGE_RURAL,
  construeixAmbitCuaRural,
  creaCuaSincronitzacioRural,
} from '../estatSincronitzacioRural.js';

const UUID_A = '11111111-2222-4333-8444-555555555555';
const UUID_B = '66666666-7777-4888-8999-aaaaaaaaaaaa';
const FIL_1 = 'ffffffff-eeee-4ddd-8ccc-bbbbbbbbbbbb';
const FIL_2 = 'eeeeeeee-dddd-4ccc-8bbb-aaaaaaaaaaaa';
const AMBIT = construeixAmbitCuaRural({
  backend: 'supabase-prod',
  tenantId: 'la-torre-de-les-macanes',
  usuariId: 'usuari-javi',
});

function barrera() {
  let obri;
  const promesa = new Promise((resol) => { obri = resol; });
  return { promesa, obri };
}

describe('R25.2-X03 · el mateix UUID en un altre fil no esborra el primer pendent', () => {
  it('microsonda de Codex: encuar A/UUID i B/mateixaUUID deixa A intacte i el drenatge envia A', async () => {
    const cua = creaCuaSincronitzacioRural({ ambitInicial: AMBIT });
    await cua.encua({ filId: FIL_1, client_msg_id: UUID_A, text: 'A · primer fil' });

    await expect(cua.encua({ filId: FIL_2, client_msg_id: UUID_A, text: 'B · segon fil' }))
      .rejects.toMatchObject({ codi: 'COLISIO_UUID_ENTRE_FILS' });

    const llista = cua.llistaMissatges();
    expect(llista).toHaveLength(1);
    expect(llista[0]).toMatchObject({ filId: FIL_1, client_msg_id: UUID_A });
    expect(llista[0].payload.text).toBe('A · primer fil');

    const enviaFn = vi.fn(async (_fil, payload) => ({ id: payload.client_msg_id, seq: 3 }));
    await cua.drenaPendents(enviaFn);
    expect(enviaFn).toHaveBeenCalledTimes(1);
    expect(enviaFn.mock.calls[0][0]).toBe(FIL_1);
    expect(enviaFn.mock.calls[0][1].text).toBe('A · primer fil');
  });

  it('la col·lisió entre fils també es detecta després de confirmar A i després de rehidratar-lo del disc', async () => {
    const desat = [];
    const adaptador = {
      desa: vi.fn(async (_ambit, pendents) => { desat.splice(0, desat.length, ...pendents); }),
      carrega: vi.fn(async () => desat.map((r) => ({ ...r }))),
      esborra: vi.fn(async () => {}),
    };
    const primera = creaCuaSincronitzacioRural({ ambitInicial: AMBIT, adaptadorPersistencia: adaptador });
    await primera.encua({ filId: FIL_1, client_msg_id: UUID_A, text: 'A' });

    // Una pestanya nova (o una recàrrega) rehidrata A i rep B amb el mateix UUID en un altre fil.
    const segona = creaCuaSincronitzacioRural({ ambitInicial: AMBIT, adaptadorPersistencia: adaptador });
    await segona.hidrataAmbit();
    await expect(segona.encua({ filId: FIL_2, client_msg_id: UUID_A, text: 'B' }))
      .rejects.toMatchObject({ codi: 'COLISIO_UUID_ENTRE_FILS' });
    expect(segona.llistaMissatges().map((r) => r.filId)).toEqual([FIL_1]);

    // Confirmat A, el UUID continua reservat per al seu fil.
    await primera.drenaPendents(async (_fil, payload) => ({ id: payload.client_msg_id, seq: 8 }));
    expect(primera.llistaMissatges()[0].estat).toBe(ESTATS_MISSATGE_RURAL.ENVIAT_SERVIDOR);
    await expect(primera.encua({ filId: FIL_2, client_msg_id: UUID_A, text: 'B' }))
      .rejects.toMatchObject({ codi: 'COLISIO_UUID_ENTRE_FILS' });
  });
});

describe('R25.2-X04 · un sol drenatge en vol i cap fallada antiga rebaixa un ACK', () => {
  it('microsonda de Codex: dos drenatges concurrents, el primer confirma i el «segon» timeout tardà no degrada enviat_servidor', async () => {
    const cua = creaCuaSincronitzacioRural({ ambitInicial: AMBIT });
    await cua.encua({ filId: FIL_1, client_msg_id: UUID_A, text: 'Una sola vegada' });

    const confirma = barrera();
    const timeoutTarda = barrera();
    let crida = 0;
    // Sense single-flight, la segona crida (del segon drenatge) faria timeout DESPRÉS de la confirmació.
    const enviaFn = vi.fn(async (_fil, payload) => {
      crida += 1;
      if (crida === 1) {
        await confirma.promesa;
        return { id: payload.client_msg_id, seq: 101 };
      }
      await timeoutTarda.promesa;
      throw Object.assign(new Error('Timeout tardà'), { name: 'TimeoutError' });
    });

    const d1 = cua.drenaPendents(enviaFn);
    const d2 = cua.drenaPendents(enviaFn, { forca: true });
    confirma.obri();
    await d1;
    timeoutTarda.obri();
    await d2;
    await Promise.resolve();

    expect(enviaFn).toHaveBeenCalledTimes(1);
    const [registre] = cua.llistaMissatges();
    expect(registre.estat).toBe(ESTATS_MISSATGE_RURAL.ENVIAT_SERVIDOR);
    expect(registre.seq).toBe(101);
    expect(registre.ultimError).toBeNull();
    expect(cua.comptaPendents()).toBe(0);
  });

  it('el single-flight s\'allibera en acabar (també si el transport falla) i un drenatge posterior torna a enviar', async () => {
    const cua = creaCuaSincronitzacioRural({
      ambitInicial: AMBIT,
      ara: () => 0,
      opcionsBackoff: { baseMs: 1000, factorJitter: 0 },
    });
    await cua.encua({ filId: FIL_1, client_msg_id: UUID_A, text: 'Reintent' });

    const r1 = await cua.drenaPendents(async () => { throw new Error('Failed to fetch'); });
    expect(r1[0]).toMatchObject({ ok: false });
    const enviaOk = vi.fn(async (_fil, payload) => ({ id: payload.client_msg_id, seq: 4 }));
    const r2 = await cua.drenaPendents(enviaOk, { forca: true });
    expect(enviaOk).toHaveBeenCalledTimes(1);
    expect(r2[0].registre.estat).toBe(ESTATS_MISSATGE_RURAL.ENVIAT_SERVIDOR);
  });

  it('un cursor de lectura ja aplicat no el toca cap drenatge posterior, ni forçat', async () => {
    const cua = creaCuaSincronitzacioRural({ ambitInicial: AMBIT });
    await cua.encua({ filId: FIL_1, client_msg_id: UUID_A, text: 'Llegit' });
    await cua.drenaPendents(async (_fil, payload) => ({ id: payload.client_msg_id, seq: 12 }));
    cua.actualitzaCursorFil(FIL_1, { llegitPelsAltresFinsSeq: 12 });
    expect(cua.llistaMissatges()[0].estat).toBe(ESTATS_MISSATGE_RURAL.LLEGIT_DESTINATARI);

    const enviaFn = vi.fn(async () => { throw new Error('No s\'havia de cridar'); });
    await cua.drenaPendents(enviaFn, { forca: true });
    expect(enviaFn).not.toHaveBeenCalled();
    expect(cua.llistaMissatges()[0].estat).toBe(ESTATS_MISSATGE_RURAL.LLEGIT_DESTINATARI);
  });

  it('eixir i tornar a entrar amb el mateix àmbit durant un transport penjat: la partició nova drena sola i el drenatge vell no hi escriu', async () => {
    const cua = creaCuaSincronitzacioRural({ ambitInicial: AMBIT });
    await cua.encua({ filId: FIL_1, client_msg_id: UUID_A, text: 'De la sessió vella' });

    const vell = barrera();
    const enviaVell = vi.fn(async (_fil, payload) => {
      await vell.promesa;
      return { id: payload.client_msg_id, seq: 50 };
    });
    const drenatgeVell = cua.drenaPendents(enviaVell);
    await vi.waitFor(() => expect(enviaVell).toHaveBeenCalledTimes(1));

    // Logout: es purga la partició. Login de la mateixa persona: el mateix àmbit, una partició nova.
    await cua.purgaAmbit(AMBIT);
    cua.canviaAmbitActiu(AMBIT);
    await cua.encua({ filId: FIL_1, client_msg_id: UUID_B, text: 'De la sessió nova' });

    const enviaNou = vi.fn(async (_fil, payload) => ({ id: payload.client_msg_id, seq: 51 }));
    const resultatsNous = await cua.drenaPendents(enviaNou);
    expect(enviaNou).toHaveBeenCalledTimes(1);
    expect(enviaNou.mock.calls[0][1].client_msg_id).toBe(UUID_B);
    expect(resultatsNous.map((r) => r.registre.client_msg_id)).toEqual([UUID_B]);

    // La resposta tardana de la sessió vella no entra a la partició nova.
    vell.obri();
    await drenatgeVell;
    const llista = cua.llistaMissatges();
    expect(llista.map((r) => r.client_msg_id)).toEqual([UUID_B]);
    expect(llista[0]).toMatchObject({ estat: ESTATS_MISSATGE_RURAL.ENVIAT_SERVIDOR, seq: 51 });

    // I el drenatge vell, en acabar, no allibera el single-flight d'un drenatge nou en vol.
    await cua.encua({ filId: FIL_1, client_msg_id: '77777777-7777-4777-8777-777777777777', text: 'Tercer' });
    const obertura = barrera();
    const enviaTercer = vi.fn(async (_fil, payload) => {
      await obertura.promesa;
      return { id: payload.client_msg_id, seq: 52 };
    });
    const d1 = cua.drenaPendents(enviaTercer);
    const d2 = cua.drenaPendents(enviaTercer);
    obertura.obri();
    const [r1, r2] = await Promise.all([d1, d2]);
    expect(r2).toBe(r1);
    expect(enviaTercer).toHaveBeenCalledTimes(1);
  }, 4000);
});

describe('Rehidratació honesta (garantia 1: cap ✓ sense seq real del servidor)', () => {
  it('descarta registres del disc en estats confirmats, sense UUID canònic o amb payload incoherent', async () => {
    const valid = {
      ambit: AMBIT, filId: FIL_1, client_msg_id: UUID_A, estat: ESTATS_MISSATGE_RURAL.ERROR_REINTENTABLE,
      seq: null, intents: 1, creatLocalMs: 1,
      payload: { id: UUID_A, client_msg_id: UUID_A, text: 'Pendent de veres', tipus: 'text', respostaA: null, metadades: {} },
    };
    const falsCheck = {
      ...valid, client_msg_id: UUID_B, estat: ESTATS_MISSATGE_RURAL.LLEGIT_DESTINATARI, seq: null,
      payload: { ...valid.payload, id: UUID_B, client_msg_id: UUID_B, text: 'Fals ✓✓' },
    };
    const incoherent = {
      ...valid, client_msg_id: '88888888-8888-4888-8888-888888888888', estat: ESTATS_MISSATGE_RURAL.CUA_LOCAL,
      payload: { ...valid.payload, id: UUID_A, client_msg_id: UUID_A },
    };
    const senseUuid = { ...valid, client_msg_id: 'no-uuid', payload: { ...valid.payload, id: 'no-uuid', client_msg_id: 'no-uuid' } };
    const adaptador = { desa: vi.fn(async () => {}), carrega: vi.fn(async () => [valid, falsCheck, incoherent, senseUuid]) };

    const cua = creaCuaSincronitzacioRural({ ambitInicial: AMBIT, adaptadorPersistencia: adaptador });
    const hidratats = await cua.hidrataAmbit();

    expect(hidratats.map((r) => r.client_msg_id)).toEqual([UUID_A]);
    expect(hidratats[0]).toMatchObject({ estat: ESTATS_MISSATGE_RURAL.ERROR_REINTENTABLE, persistitLocal: true });
    expect(cua.comptaPendents()).toBe(1);
  });
});

describe('R26 ronda 2 · despertar perdut del single-flight (R26-XAT-09)', () => {
  it('un missatge encuat amb un drenatge en vol i demanat amb drenaPendents ix en la MATEIXA promesa', async () => {
    const cua = creaCuaSincronitzacioRural({ ambitInicial: AMBIT });
    await cua.encua({ filId: FIL_1, client_msg_id: UUID_A, text: 'Primer' });
    const porta = barrera();
    const enviaFn = vi.fn(async (_fil, payload) => {
      if (payload.client_msg_id === UUID_A) await porta.promesa;
      return { id: payload.client_msg_id, seq: 60 + enviaFn.mock.calls.length };
    });

    const d1 = cua.drenaPendents(enviaFn);
    await vi.waitFor(() => expect(enviaFn).toHaveBeenCalledTimes(1));
    // La foto de pendents de d1 ja està feta: B arriba després i el disparador és el de sempre.
    await cua.encua({ filId: FIL_1, client_msg_id: UUID_B, text: 'Encuat amb el drenatge en vol' });
    const d2 = cua.drenaPendents(enviaFn);

    porta.obri();
    const [resultats, resultats2] = await Promise.all([d1, d2]);
    expect(resultats2).toBe(resultats); // el single-flight es manté: un sol drenatge, un sol resultat
    expect(enviaFn).toHaveBeenCalledTimes(2);
    expect(enviaFn.mock.calls.map((crida) => crida[1].client_msg_id)).toEqual([UUID_A, UUID_B]);
    expect(resultats.map((r) => r.registre.client_msg_id)).toEqual([UUID_A, UUID_B]);
    expect(cua.comptaPendents()).toBe(0);
  }, 4000);

  it('la passada de més respecta el forçat de qui l\'ha demanada i no reenvia cap ACK', async () => {
    let rellotge = 0;
    const cua = creaCuaSincronitzacioRural({ ambitInicial: AMBIT, ara: () => rellotge, opcionsBackoff: { baseMs: 1000, factorJitter: 0 } });
    await cua.encua({ filId: FIL_1, client_msg_id: UUID_A, text: 'Falla' });
    await cua.drenaPendents(async () => { throw new Error('Failed to fetch'); });
    expect(cua.llistaMissatges()[0].estat).toBe(ESTATS_MISSATGE_RURAL.ERROR_REINTENTABLE);

    await cua.encua({ filId: FIL_1, client_msg_id: UUID_B, text: 'Bloqueja' });
    const porta = barrera();
    const enviaFn = vi.fn(async (_fil, payload) => {
      if (payload.client_msg_id === UUID_B) await porta.promesa;
      return { id: payload.client_msg_id, seq: 70 + enviaFn.mock.calls.length };
    });
    rellotge = 10; // el backoff d'A encara no ha vençut
    const d1 = cua.drenaPendents(enviaFn);
    await vi.waitFor(() => expect(enviaFn).toHaveBeenCalledTimes(1));
    const d2 = cua.drenaPendents(enviaFn, { forca: true }); // «Torna-ho a provar» amb un drenatge en vol
    porta.obri();
    await Promise.all([d1, d2]);
    expect(enviaFn.mock.calls.map((crida) => crida[1].client_msg_id)).toEqual([UUID_B, UUID_A]);
    expect(cua.comptaPendents()).toBe(0);
  }, 4000);
});

describe('R26 ronda 2 · l\'àmbit de la cua no té sentinelles compartides (com la X01)', () => {
  it('sense backend o sense tenant declarat es rebutja; tenant null explícit és «sense-tenant»', () => {
    expect(() => construeixAmbitCuaRural({ tenantId: null, usuariId: 'usuari-javi' }))
      .toThrow(expect.objectContaining({ codi: 'AMBIT_SENSE_BACKEND' }));
    expect(() => construeixAmbitCuaRural({ backend: '   ', tenantId: null, usuariId: 'usuari-javi' }))
      .toThrow(expect.objectContaining({ codi: 'AMBIT_SENSE_BACKEND' }));
    expect(() => construeixAmbitCuaRural({ backend: 'supabase-prod', usuariId: 'usuari-javi' }))
      .toThrow(expect.objectContaining({ codi: 'AMBIT_SENSE_TENANT' }));
    expect(construeixAmbitCuaRural({ backend: 'supabase-prod', tenantId: null, usuariId: 'usuari-javi' }))
      .toBe('supabase-prod::sense-tenant::usuari-javi::personal');
    expect(construeixAmbitCuaRural({ backend: 'a', tenantId: null, usuariId: 'u' }))
      .not.toBe(construeixAmbitCuaRural({ backend: 'b', tenantId: null, usuariId: 'u' }));
  });

  it('cap component (fora del backend) pot portar el separador: dues tuples distintes mai no comparteixen partició', () => {
    // backend 'b', tenant 't::u' vs backend 'b::t', tenant 'u': sense la guarda donarien la mateixa clau.
    expect(() => construeixAmbitCuaRural({ backend: 'b', tenantId: 't::u', usuariId: 'x' }))
      .toThrow(expect.objectContaining({ codi: 'AMBIT_INVALID' }));
    expect(() => construeixAmbitCuaRural({ backend: 'b', tenantId: null, usuariId: 'x::y' }))
      .toThrow(expect.objectContaining({ codi: 'AMBIT_INVALID' }));
    expect(() => construeixAmbitCuaRural({ backend: 'b', tenantId: null, usuariId: 'x', actorOrgId: 'o::p' }))
      .toThrow(expect.objectContaining({ codi: 'AMBIT_INVALID' }));
  });

  it('un actor que no és text no cau a la partició personal', () => {
    const personal = construeixAmbitCuaRural({ backend: 'b', tenantId: null, usuariId: 'x', actorOrgId: null });
    expect(personal).toBe('b::sense-tenant::x::personal');
    for (const actorOrgId of [42, { id: 'org' }, true]) {
      expect(() => construeixAmbitCuaRural({ backend: 'b', tenantId: null, usuariId: 'x', actorOrgId }))
        .toThrow(expect.objectContaining({ codi: 'AMBIT_INVALID' }));
    }
  });
});

describe('R26 ronda 3 · el despertar del single-flight cedix el fil i acota els reintents (microsonda V6)', () => {
  it('V6 · una enviaFn que demana un drenatge forçat i rebutja de seguida no fa passades sense fi: un sol intent', async () => {
    const cua = creaCuaSincronitzacioRural({ ambitInicial: AMBIT });
    await cua.encua({ filId: FIL_1, client_msg_id: UUID_A, text: 'Falla sempre' });
    const peticions = [];
    const enviaFn = vi.fn(async () => {
      // Guarda de la sonda: sense correcció, cada passada en demana una altra (la ronda 2 no s'aturava).
      if (enviaFn.mock.calls.length <= 50) peticions.push(cua.drenaPendents(enviaFn, { forca: true }));
      throw Object.assign(new Error('La sessió ha caducat.'), { codi: 'SESSIO_CADUCADA' });
    });

    const resultats = await cua.drenaPendents(enviaFn);
    await Promise.all(peticions);
    expect(enviaFn).toHaveBeenCalledTimes(1);
    expect(resultats).toHaveLength(1);
    expect(resultats[0]).toMatchObject({ ok: false });
    expect(cua.comptaPendents()).toBe(1); // continua pendent, per al disparador següent
  }, 4000);

  it('una passada de més no corre sense cedir el fil: una macrotasca programada abans ja ha corregut quan ix el missatge nou', async () => {
    const cua = creaCuaSincronitzacioRural({ ambitInicial: AMBIT });
    await cua.encua({ filId: FIL_1, client_msg_id: UUID_A, text: 'Primer' });
    const porta = barrera();
    let macrotascaFeta = false;
    const vistes = [];
    const enviaFn = vi.fn(async (_fil, payload) => {
      if (payload.client_msg_id === UUID_A) await porta.promesa;
      else vistes.push(macrotascaFeta);
      return { id: payload.client_msg_id, seq: 80 + enviaFn.mock.calls.length };
    });

    const d1 = cua.drenaPendents(enviaFn);
    await vi.waitFor(() => expect(enviaFn).toHaveBeenCalledTimes(1));
    await cua.encua({ filId: FIL_1, client_msg_id: UUID_B, text: 'Encuat amb el drenatge en vol' });
    const d2 = cua.drenaPendents(enviaFn);
    setTimeout(() => { macrotascaFeta = true; }, 0);
    porta.obri();
    const [resultats, resultats2] = await Promise.all([d1, d2]);
    expect(resultats2).toBe(resultats);
    expect(enviaFn.mock.calls.map((crida) => crida[1].client_msg_id)).toEqual([UUID_A, UUID_B]);
    expect(vistes).toEqual([true]);
  }, 4000);

  it('una petició forçada arribada DESPRÉS que un missatge ha fallat el torna a provar en la passada de més (com a la ronda 2)', async () => {
    let rellotge = 1; // creatLocalMs prendria Date.now() amb 0
    const cua = creaCuaSincronitzacioRural({ ambitInicial: AMBIT, ara: () => rellotge, opcionsBackoff: { baseMs: 1000, factorJitter: 0 } });
    await cua.encua({ filId: FIL_1, client_msg_id: UUID_A, text: 'Falla la primera vegada' });
    rellotge = 2;
    await cua.encua({ filId: FIL_1, client_msg_id: UUID_B, text: 'Bloqueja' });
    const porta = barrera();
    let falladesA = 0;
    const enviaFn = vi.fn(async (_fil, payload) => {
      if (payload.client_msg_id === UUID_A && falladesA === 0) {
        falladesA += 1;
        throw new Error('Failed to fetch');
      }
      if (payload.client_msg_id === UUID_B) await porta.promesa;
      return { id: payload.client_msg_id, seq: 90 + enviaFn.mock.calls.length };
    });

    const d1 = cua.drenaPendents(enviaFn);
    await vi.waitFor(() => expect(enviaFn).toHaveBeenCalledTimes(2)); // A ha fallat i B és en vol
    const d2 = cua.drenaPendents(enviaFn, { forca: true }); // «Torna-ho a provar» d'A
    porta.obri();
    await Promise.all([d1, d2]);
    expect(enviaFn.mock.calls.map((crida) => crida[1].client_msg_id)).toEqual([UUID_A, UUID_B, UUID_A]);
    expect(cua.comptaPendents()).toBe(0);
  }, 4000);

  it('cap missatge es prova més de dues vegades en un drenatge, encara que una petició forçada arribe després de cada fallada', async () => {
    const UUID_C = 'cccccccc-1111-4222-8333-444444444444';
    let rellotge = 1; // creatLocalMs prendria Date.now() amb 0
    const cua = creaCuaSincronitzacioRural({ ambitInicial: AMBIT, ara: () => rellotge, opcionsBackoff: { baseMs: 1000, factorJitter: 0 } });
    await cua.encua({ filId: FIL_1, client_msg_id: UUID_A, text: 'Falla sempre' });
    rellotge = 2;
    await cua.encua({ filId: FIL_1, client_msg_id: UUID_B, text: 'Bloqueja la primera passada' });
    const porta1 = barrera();
    const porta2 = barrera();
    const enviaFn = vi.fn(async (_fil, payload) => {
      if (payload.client_msg_id === UUID_A) throw new Error('Failed to fetch');
      if (payload.client_msg_id === UUID_B) await porta1.promesa;
      if (payload.client_msg_id === UUID_C) await porta2.promesa;
      return { id: payload.client_msg_id, seq: 100 + enviaFn.mock.calls.length };
    });

    const d1 = cua.drenaPendents(enviaFn);
    await vi.waitFor(() => expect(enviaFn).toHaveBeenCalledTimes(2)); // A ha fallat, B en vol
    const d2 = cua.drenaPendents(enviaFn, { forca: true });
    rellotge = 3;
    await cua.encua({ filId: FIL_1, client_msg_id: UUID_C, text: 'Bloqueja la segona passada' });
    porta1.obri();
    await vi.waitFor(() => expect(enviaFn).toHaveBeenCalledTimes(4)); // A ha tornat a fallar, C en vol
    const d3 = cua.drenaPendents(enviaFn, { forca: true });
    porta2.obri();
    await Promise.all([d1, d2, d3]);
    expect(enviaFn.mock.calls.map((crida) => crida[1].client_msg_id)).toEqual([UUID_A, UUID_B, UUID_A, UUID_C]);
    expect(cua.comptaPendents()).toBe(1); // A, pendent per al disparador següent
  }, 4000);
});

describe('R26 ronda 3 · la clau de partició és injectiva de veres (microsonda V5)', () => {
  it('V5 · «:» a les vores i els literals de sentinella es rebutgen; null i blanc són la mateixa absència', () => {
    for (const ambit of [
      { backend: 'b', tenantId: 'x:', usuariId: 'y' },
      { backend: 'b', tenantId: 'x', usuariId: ':y' },
      { backend: 'b', tenantId: null, usuariId: 'y', actorOrgId: 'org:' },
      { backend: 'b', tenantId: 'sense-tenant', usuariId: 'y' },
      { backend: 'b', tenantId: null, usuariId: 'y', actorOrgId: 'personal' },
    ]) {
      expect(() => construeixAmbitCuaRural(ambit)).toThrow(expect.objectContaining({ codi: 'AMBIT_INVALID' }));
    }
    expect(construeixAmbitCuaRural({ backend: 'b', tenantId: '   ', usuariId: 'y' }))
      .toBe(construeixAmbitCuaRural({ backend: 'b', tenantId: null, usuariId: 'y' }));
    expect(construeixAmbitCuaRural({ backend: 'b', tenantId: null, usuariId: 'y', actorOrgId: '   ' }))
      .toBe(construeixAmbitCuaRural({ backend: 'b', tenantId: null, usuariId: 'y', actorOrgId: null }));
    // L'abast real (backendScope) porta «:» i continua sent vàlid: el backend és el que queda per l'esquerra.
    const backend = `backend:${JSON.stringify([null, 'https://a.example.test', 'la-torre', 'remote'])}`;
    const ambit = construeixAmbitCuaRural({ backend, tenantId: 'la-torre', usuariId: UUID_A, actorOrgId: UUID_B });
    expect(ambit).toBe(`${backend}::la-torre::${UUID_A}::${UUID_B}`);
    expect(creaCuaSincronitzacioRural({ ambitInicial: ambit }).obteAmbitActiu()).toBe(ambit);
  });

  it('V5 · propietat: totes les tuples admeses d\'un alfabet amb «:» donen claus distintes', () => {
    const trossos = ['', 'a', ':', 'a:', ':a', '::', 'aa'];
    const vistes = new Map();
    let admeses = 0;
    for (const backend of trossos.filter(Boolean)) {
      for (const tenantId of [null, ...trossos]) {
        for (const usuariId of trossos.filter(Boolean)) {
          for (const actorOrgId of [null, ...trossos]) {
            let clau;
            try {
              clau = construeixAmbitCuaRural({ backend, tenantId, usuariId, actorOrgId });
            } catch {
              continue;
            }
            admeses += 1;
            const tupla = JSON.stringify([backend, tenantId || null, usuariId, actorOrgId || null]);
            if (vistes.has(clau)) expect(vistes.get(clau)).toBe(tupla);
            vistes.set(clau, tupla);
          }
        }
      }
    }
    expect(admeses).toBeGreaterThan(0);
  });
});
