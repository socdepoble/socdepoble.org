import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { creaCablejatXatRural } from './cablejatXatRural.js';

const sessio = vi.hoisted(() => ({ entrada: 1 }));
vi.mock('../../data/identitat.js', async (original) => ({ ...await original(), entradaSessio: () => sessio.entrada }));
const ID = '11111111-1111-4111-8111-111111111111';
const FIL = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const USER = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const CONFIG = { dataMode: 'remote', backendUrl: 'https://test.invalid', tenantId: null };
const pendent = () => { let resolve; const promise = new Promise((r) => { resolve = r; }); return { promise, resolve }; };
const instances = [];
function entorn(transport, refresh = vi.fn(async () => true)) {
  let token = { ambit: 'persona-A', jo: USER, actor: null, config: CONFIG };
  let op = { token, llinatge: {}, controller: new AbortController() };
  const rural = creaCablejatXatRural({ obteToken: () => token, obteOperacio: () => op, enviaMissatge: transport, refreshSession: refresh });
  instances.push(rural);
  return {
    rural, origen: op, refresh,
    envia: (text = 'Bon dia') => rural.envia(op, FIL, { id: ID, text }, CONFIG),
    rota(canvis = {}, mateixLlinatge = true) {
      const anterior = op;
      token = { ...token, ...canvis };
      op = { token, llinatge: mateixLlinatge ? anterior.llinatge : {}, controller: new AbortController() };
      anterior.controller.abort();
      rural.revalida();
      return op;
    },
  };
}
beforeEach(() => { sessio.entrada = 1; });
afterEach(() => { for (const i of instances.splice(0)) i.tanca(); });

describe('R30.2 · servei JWT i estat rural al contracte del proveïdor', () => {
  it('renova una vegada i preserva exactament UUID i payload entre els dos intents', async () => {
    const transport = vi.fn().mockRejectedValueOnce(Object.assign(new Error('JWT expired'), { status: 401 }))
      .mockImplementationOnce(async (_, p) => ({ id: p.id, seq: 7 }));
    let e;
    const refresh = vi.fn(async () => { e.rota(); return true; });
    e = entorn(transport, refresh);
    const resultat = await e.envia();
    expect(resultat.desat).toMatchObject({ id: ID, client_msg_id: ID, seq: 7 });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(transport).toHaveBeenCalledTimes(2);
    expect(transport.mock.calls[0][1]).toBe(transport.mock.calls[1][1]);
    expect(transport.mock.calls[1][1]).toEqual({ id: ID, client_msg_id: ID, text: 'Bon dia', tipus: 'text', respostaA: null, metadades: {} });
  });

  it('no reenvia el transport en vol quan una renovació aliena rota el senyal de la UI', async () => {
    const espera = pendent();
    const transport = vi.fn(() => espera.promise);
    const e = entorn(transport);
    const enviament = e.envia();
    await vi.waitFor(() => expect(transport).toHaveBeenCalledTimes(1));
    const senyal = transport.mock.calls[0][2].signal;
    const nova = e.rota();
    await Promise.resolve();
    expect(senyal.aborted).toBe(false);
    espera.resolve({ id: ID, seq: 3 });
    expect((await enviament).op).toBe(nova);
    expect(transport).toHaveBeenCalledTimes(1);
  });

  it.each([
    { ambit: 'entitat-A', actor: 'org-A' },
    { ambit: 'persona-B', jo: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' },
    { ambit: 'backend-B', config: { ...CONFIG, backendUrl: 'https://altre.invalid' } },
  ])('cancel·la definitivament davant el canvi de llinatge %j i ignora ACK tardans', async (canvis) => {
    const espera = pendent();
    const transport = vi.fn(() => espera.promise);
    const e = entorn(transport);
    const enviament = e.envia();
    const resultat = expect(enviament).rejects.toMatchObject({ codi: 'SESSIO_CANVIADA' });
    await vi.waitFor(() => expect(transport).toHaveBeenCalledTimes(1));
    const senyal = transport.mock.calls[0][2].signal;
    e.rota(canvis, false);
    await resultat;
    expect(senyal.aborted).toBe(true);
    espera.resolve({ id: ID, seq: 9 });
    await Promise.resolve();
    expect(transport).toHaveBeenCalledTimes(1);
    expect(e.refresh).not.toHaveBeenCalled();
  });

  it('detecta eixida i reentrada amb el mateix UUID encara que React no pinte l’estat intermedi', async () => {
    const espera = pendent(); const transport = vi.fn(() => espera.promise);
    const e = entorn(transport); const enviament = e.envia();
    const error = expect(enviament).rejects.toMatchObject({ codi: 'SESSIO_CANVIADA' });
    await vi.waitFor(() => expect(transport).toHaveBeenCalledTimes(1));
    sessio.entrada += 1;
    e.rural.revalida();
    await error;
    espera.resolve({ id: ID, seq: 9 });
  });

  it.each([{ id: ID }, { seq: 1 }, { id: ID, seq: 0 }, { id: '22222222-2222-4222-8222-222222222222', seq: 1 }])('no acredita enviament amb ACK invàlid %j', async (resposta) => {
    const transport = vi.fn(async () => resposta); const e = entorn(transport);
    await expect(e.envia()).rejects.toMatchObject({ codi: expect.stringMatching(/EVIDENCIA_SERVIDOR_SENSE_SEQ|EVIDENCIA_SERVIDOR_SENSE_ID|ID_SERVIDOR_DIVERGENT/) });
    expect(transport).toHaveBeenCalledTimes(1);
    expect(e.refresh).not.toHaveBeenCalled();
  });

  it('exigix cursor alié, conserva monotonia i declara persistència local absent', () => {
    const e = entorn(vi.fn());
    const missatge = { id: ID, threadId: FIL, sender: 'me', text: 'Bon dia', seq: 11, estatEnviament: 'enviat' };
    const projecta = (fil) => e.rural.projecta([missatge], fil)[0];
    expect(projecta({ rebutFinsSeq: 100, llegitFinsSeq: 100 })).toMatchObject({ estatEnviament: 'enviat', estatSincronitzacio: 'enviat_servidor', persistitLocal: false });
    expect(projecta({ rebutPelsAltresFinsSeq: 11 })).toMatchObject({ estatEnviament: 'lliurat', estatSincronitzacio: 'entregat_destinatari' });
    expect(projecta({ llegitPelsAltresFinsSeq: 11 })).toMatchObject({ estatEnviament: 'llegit', estatSincronitzacio: 'llegit_destinatari' });
    expect(projecta({ rebutPelsAltresFinsSeq: 0, llegitPelsAltresFinsSeq: 0 }).estatEnviament).toBe('llegit');
  });

  it('purga registres i empremtes en logout encara que no es projecte cap llista fins a reentrar al mateix àmbit', async () => {
    const transport = vi.fn(async (_, p) => ({ id: p.id, seq: 7 })); const e = entorn(transport);
    const m = { id: ID, threadId: FIL, sender: 'me', text: 'Primer', seq: 7, estatEnviament: 'enviat' };
    await e.envia('Primer');
    expect(e.rural.projecta([m], { llegitPelsAltresFinsSeq: 7 })[0].estatEnviament).toBe('llegit');
    e.rota({ jo: null, ambit: 'sense-persona' }, false);
    e.rota({ jo: USER, ambit: 'persona-A' }, false);
    expect(e.rural.projecta([m], { llegitPelsAltresFinsSeq: 0 })[0].estatEnviament).toBe('enviat');
    await expect(e.envia('Segon')).resolves.toMatchObject({ desat: { seq: 7 } });
    expect(transport).toHaveBeenCalledTimes(2);
  });

  it('purga també amb entrada de login nova sense render intermedi i en tancar, però no en renovar JWT', () => {
    const e = entorn(vi.fn());
    const m = { id: ID, threadId: FIL, sender: 'me', text: 'Primer', seq: 7, estatEnviament: 'enviat' };
    const marcaLlegit = () => e.rural.projecta([m], { llegitPelsAltresFinsSeq: 7 })[0];
    const senseCursor = () => e.rural.projecta([m], { llegitPelsAltresFinsSeq: 0 })[0];
    expect(marcaLlegit().estatEnviament).toBe('llegit');
    e.rota();
    expect(senseCursor().estatEnviament).toBe('llegit');
    sessio.entrada += 1; e.rural.revalida();
    expect(senseCursor().estatEnviament).toBe('enviat');
    expect(marcaLlegit().estatEnviament).toBe('llegit');
    e.rural.tanca();
    expect(senseCursor().estatEnviament).toBe('enviat');
    expect(senseCursor()).not.toHaveProperty('estatSincronitzacio');
  });

  it('refusa la reutilització d’un UUID amb altre text sense enviar el payload anterior silenciosament', async () => {
    const transport = vi.fn(async (_, p) => ({ id: p.id, seq: 7 })); const e = entorn(transport);
    await e.envia('Primer');
    await expect(e.envia('Segon')).rejects.toMatchObject({ codi: 'COLISIO_PAYLOAD_IDEMPOTENT' });
    expect(transport).toHaveBeenCalledTimes(1);
  });

  /* R32 · F7 · La forma literal de motor.encua (xifratXatPipeline.js): desat
     a la safata del dispositiu, sense seq. Ni ✓ ni error; la renovació no el
     passa a error (Descarta no el trauria de la safata). */
  const encuat = (_, p) => Object.freeze({ id: p.id, filId: FIL, encuat: true, reintentable: true, codi: 'encuat' });
  it('R32 · F7: el missatge encuat a la safata E2EE es queda pendent (cua_local), sense ✓ ni error', async () => {
    const transport = vi.fn(async (...a) => encuat(...a)); const e = entorn(transport);
    const resultat = await e.envia();
    expect(resultat).toMatchObject({ encuat: true, desat: { id: ID, encuat: true } });
    expect(transport).toHaveBeenCalledTimes(1);
    const bombolla = { id: ID, threadId: FIL, sender: 'me', text: 'Bon dia', seq: null, estatEnviament: 'pendent', error: null };
    expect(e.rural.projecta([bombolla], {})[0]).toMatchObject({ estatEnviament: 'pendent', estatSincronitzacio: 'cua_local' });
    const altre = { ...bombolla, id: '22222222-2222-4222-8222-222222222222' };
    const aturats = e.rural.interromp({ [FIL]: [bombolla, altre] })[FIL];
    expect(aturats[0]).toBe(bombolla);
    expect(aturats[1]).toMatchObject({ id: altre.id, estatEnviament: 'error', error: null });
  });

  it.each([
    ['un altre id', (_, p) => ({ ...encuat(_, p), id: '22222222-2222-4222-8222-222222222222' })],
    ['un altre fil', (_, p) => ({ ...encuat(_, p), filId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' })],
    ['encuat no booleà', (_, p) => ({ ...encuat(_, p), encuat: 'si' })],
  ])('R32 · F7: un «encuat» amb %s no esquiva l’ACK estricte', async (_nom, resposta) => {
    const e = entorn(vi.fn(async (...a) => resposta(...a)));
    await expect(e.envia()).rejects.toMatchObject({ codi: 'EVIDENCIA_SERVIDOR_SENSE_SEQ' });
    const bombolla = { id: ID, threadId: FIL, sender: 'me', text: 'Bon dia', seq: null, estatEnviament: 'pendent' };
    expect(e.rural.interromp({ [FIL]: [bombolla] })[FIL][0]).toMatchObject({ estatEnviament: 'error' });
  });

  it('R32 · F7: un logout oblida els encuats de l’àmbit anterior', async () => {
    const e = entorn(vi.fn(async (...a) => encuat(...a)));
    await e.envia();
    e.rota({ jo: null, ambit: 'sense-persona' }, false);
    e.rota({ jo: USER, ambit: 'persona-A' }, false);
    const bombolla = { id: ID, threadId: FIL, sender: 'me', text: 'Bon dia', seq: null, estatEnviament: 'pendent' };
    expect(e.rural.interromp({ [FIL]: [bombolla] })[FIL][0]).toMatchObject({ estatEnviament: 'error' });
  });

  it('tanca operacions pendents sense esperar transports que ignoren AbortSignal', async () => {
    const espera = pendent(); const transport = vi.fn(() => espera.promise); const e = entorn(transport);
    const enviament = e.envia(); const error = expect(enviament).rejects.toMatchObject({ codi: 'SERVEI_TANCAT' });
    await vi.waitFor(() => expect(transport).toHaveBeenCalledTimes(1));
    e.rural.tanca(); await error;
    expect(transport.mock.calls[0][2].signal.aborted).toBe(true);
    espera.resolve({ id: ID, seq: 10 });
  });
});
