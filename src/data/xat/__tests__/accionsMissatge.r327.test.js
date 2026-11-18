import { beforeEach, expect, test, vi } from 'vitest';
import { creaAccionsMissatge, projectaAccionsMissatges } from '../accionsMissatge.js';

const m = { id: 'm1', threadId: 'f1', usuariId: 'other', author: 'Anna', text: 'Missatge visible', tipus: 'text', seq: 1, estatEnviament: 'enviat' };
const estat = extra => ({ missatgeId: m.id, filId: m.threadId, reaccions: [], destacat: false, fixat: false, amagat: false, ...extra });
const deferred = () => { let resolve, reject; const promise = new Promise((r, j) => { resolve = r; reject = j; }); return { promise, resolve, reject }; };
let ctx, port, canvis, motor, fonts, creaPrivat, obreFil, enviaText, enviaAdjunt, lligBlob, comptador;
beforeEach(() => {
  ctx = { clau: 'backend:town:me:actor:entry1', actiu: true, usuariId: 'me', modeDades: 'remote', config: { token: 'one' } };
  fonts = new Map([[m.id, m]]); canvis = []; comptador = 0;
  port = {
    carregaAccionsMissatges: vi.fn().mockResolvedValue({ missatges: [estat()], teMes: false, seguentId: null }),
    alternaDestacat: vi.fn(async d => estat({ destacat: d.actiu })),
    alternaFixat: vi.fn(async d => estat({ fixat: d.actiu })),
    eliminaPerAMi: vi.fn(async () => estat({ amagat: true })),
    alternaReaccio: vi.fn(async d => estat({ reaccions: d.activa ? [{ emoji: d.emoji, meua: true, total: 1 }] : [] }))
  };
  creaPrivat = vi.fn().mockResolvedValue('direct'); obreFil = vi.fn();
  enviaText = vi.fn(async (d, _text, o) => [{ id: o.clientMsgId, filId: d.id, tipus: 'text', seq: 1 }]);
  enviaAdjunt = vi.fn(async (d, a) => [{ id: a.id, filId: d.id, tipus: a.tipus, seq: 1 }]);
  lligBlob = vi.fn().mockResolvedValue(new Blob(['raster'], { type: 'image/webp' }));
  motor = creaAccionsMissatge({ port, obteContext: () => ctx, obteMissatge: ref => fonts.get(typeof ref === 'string' ? ref : ref.id),
    onCanvi: s => canvis.push(s), creaPrivat, obreFil, enviaText, enviaAdjunt, lligBlob, generaId: () => `new-${++comptador}` });
});

test('un estat optimista es veu abans del transport; confirmat i sense alterar el missatge', async () => {
  const pendent = deferred(); port.alternaDestacat.mockReturnValueOnce(pendent.promise);
  const p = motor.alternaDestacat(m, true);
  expect(motor.snapshot().perMissatge.m1).toMatchObject({ destacat: true, estat: 'pendent' });
  await vi.waitFor(() => expect(port.alternaDestacat).toHaveBeenCalledOnce());
  pendent.resolve(estat({ destacat: true }));
  await expect(p).resolves.toMatchObject({ estat: 'confirmat', destacat: true });
  expect(m).not.toHaveProperty('destacat'); expect(m.seq).toBe(1);
});
test.each([401, 403, 404, 500])('HTTP%s no és absència SQL ni èxit local', async status => {
  const failure = Object.assign(new Error('fallada'), { status }); port.alternaDestacat.mockRejectedValueOnce(failure);
  await expect(motor.alternaDestacat(m, true)).rejects.toBe(failure);
  expect(motor.snapshot().perMissatge.m1).toMatchObject({ destacat: false, estat: 'error' });
});
test('només SQL absent dona estat local explícit; seed local no necessita el port', async () => {
  port.alternaDestacat.mockRejectedValueOnce(Object.assign(new Error('SQL absent'), { code: 'XAT_ACCIONS_SQL_ABSENT' }));
  await expect(motor.alternaDestacat(m, true)).resolves.toMatchObject({ estat: 'local', destacat: true });
  ctx = { ...ctx, clau: 'seed', modeDades: 'seed' };
  await expect(motor.eliminaPerAMi(m)).resolves.toMatchObject({ estat: 'local', amagat: true });
  expect(port.eliminaPerAMi).not.toHaveBeenCalled();
});
test('un rollback vell no desfà la intenció posterior ni una altra funció', async () => {
  const primer = deferred(); port.alternaDestacat.mockReturnValueOnce(primer.promise);
  const p1 = motor.alternaDestacat(m, true).catch(e => e), p2 = motor.alternaDestacat(m, false);
  await motor.alternaFixat(m, true);
  primer.reject(new Error('first failed'));
  await p1; await p2;
  expect(motor.snapshot().perMissatge.m1).toMatchObject({ destacat: false, fixat: true });
  expect(port.alternaDestacat.mock.calls.map(([d]) => d.actiu)).toEqual([true, false]);
});
test('dos errors seguits tornen a la base confirmada, mai a l’optimista del primer intent', async () => {
  const d = deferred(); port.alternaDestacat.mockReturnValueOnce(d.promise).mockRejectedValueOnce(new Error('second'));
  const p1 = motor.alternaDestacat(m, true).catch(e => e), p2 = motor.alternaDestacat(m, false).catch(e => e);
  d.reject(new Error('first')); await p1; await p2;
  expect(motor.snapshot().perMissatge.m1).toMatchObject({ destacat: false, estat: 'error' });
});
test('hidratar mentre continua pendent no etiqueta un optimista com a confirmat', async () => {
  const d = deferred(); port.alternaDestacat.mockReturnValueOnce(d.promise);
  const p = motor.alternaDestacat(m, true);
  await motor.carregaAccionsMissatges({ filId: 'f1' });
  expect(motor.snapshot().perMissatge.m1).toMatchObject({ destacat: true, estat: 'pendent' });
  d.resolve(estat({ destacat: true })); await p;
});
test('batch vell que ix durant la mutació no desfà l’ACK més nou', async () => {
  const mutacio = deferred(), lectura = deferred(); port.alternaDestacat.mockReturnValueOnce(mutacio.promise); port.carregaAccionsMissatges.mockReturnValueOnce(lectura.promise);
  const p = motor.alternaDestacat(m, true); const l = motor.carregaAccionsMissatges({ filId: 'f1' });
  mutacio.resolve(estat({ destacat: true })); await p;
  lectura.resolve({ missatges: [estat()], teMes: false, seguentId: null }); await l;
  expect(motor.snapshot().perMissatge.m1.destacat).toBe(true);
});
test('una renovació equivalent conserva l’acció; canvi d’entrada avorta fins i tot un port que ignora el senyal', async () => {
  const pendent = deferred(); port.alternaDestacat.mockReturnValueOnce(pendent.promise);
  const p = motor.alternaDestacat(m, true).catch(e => e);
  await vi.waitFor(() => expect(port.alternaDestacat).toHaveBeenCalledOnce());
  const signal = port.alternaDestacat.mock.calls[0][1].signal;
  ctx = { ...ctx, config: { token: 'renewed' } }; motor.sincronitza(); expect(signal.aborted).toBe(false);
  ctx = { ...ctx, clau: 'entry2' }; motor.sincronitza();
  expect(signal.aborted).toBe(true); expect(await p).toMatchObject({ name: 'AbortError' });
  pendent.resolve(estat({ destacat: true })); await Promise.resolve();
  expect(motor.snapshot().perMissatge).toEqual({});
});
test('ocultar és projecció estable: dades i seq bruts sobreviuen a recàrrega/realtime', async () => {
  await motor.eliminaPerAMi(m);
  const raw = [m, { ...m, id: 'm2', seq: 2 }];
  expect(projectaAccionsMissatges(raw, motor.snapshot().perMissatge)).toEqual([raw[1]]);
  expect(raw.map(m => m.seq)).toEqual([1, 2]);
  expect(projectaAccionsMissatges([...raw], motor.snapshot().perMissatge)).toEqual([raw[1]]);
});
test('reacció única pròpia, conservar totals aliens i desactivar un altre emoji no lleva la pròpia', async () => {
  port.carregaAccionsMissatges.mockResolvedValueOnce({ missatges: [estat({ reaccions: [{ emoji: '😂', total: 2, meua: true }] })], teMes: false });
  await motor.carregaAccionsMissatges({ filId: 'f1' });
  const d = deferred(); port.alternaReaccio.mockReturnValueOnce(d.promise);
  const p = motor.alternaReaccio(m, '❤️', true);
  expect(motor.snapshot().perMissatge.m1.reaccions).toEqual([{ emoji: '😂', total: 1, meua: false }, { emoji: '❤️', total: 1, meua: true }]);
  d.resolve(estat({ reaccions: [{ emoji: '😂', total: 1, meua: false }, { emoji: '❤️', total: 1, meua: true }] })); await p;
});
test('resposta privada és esborrany textual, sense enviar ni respostaA d’altre fil', async () => {
  const r = await motor.responEnPrivat(m);
  expect(r).toEqual({ filId: 'direct', cita: { text: m.text, autorNom: 'Anna' }, textCita: `Anna: ${m.text}`, respostaA: null });
  expect(creaPrivat).toHaveBeenCalledWith('other'); expect(obreFil).toHaveBeenCalledWith('direct');
  expect(enviaText).not.toHaveBeenCalled(); expect(enviaAdjunt).not.toHaveBeenCalled();
});
test('una autoria d’entitat porta a l’entitat pública, mai a l’operador', async () => {
  fonts.set(m.id, { ...m, comOrgId: 'entity', usuariId: 'hidden-operator' });
  await motor.responEnPrivat(m); expect(creaPrivat).toHaveBeenCalledWith('entity');
});
test('una autoria d’entitat antiga sense ID públic no recau en l’operador ocult', async () => {
  fonts.set(m.id, { ...m, comEntitat: true, usuariId: 'hidden-operator' });
  await expect(motor.responEnPrivat(m)).rejects.toThrow('entitat'); expect(creaPrivat).not.toHaveBeenCalled();
});
test('canvi de sessió mentre es crea el directe no l’obri ni conserva la cita', async () => {
  const d = deferred(); creaPrivat.mockReturnValueOnce(d.promise);
  const p = motor.responEnPrivat(m).catch(e => e); ctx = { ...ctx, clau: 'new-entry' }; motor.sincronitza();
  d.resolve('direct'); expect(await p).toMatchObject({ name: 'AbortError' });
  expect(obreFil).not.toHaveBeenCalled(); expect(motor.snapshot().esborranyPrivat).toBeNull();
});
test('reenviament parcial: repetir amb operacioId conserva IDs i no duplica èxits', async () => {
  enviaText.mockImplementationOnce(async (d, _text, o) => [{ id: o.clientMsgId, filId: d.id, tipus: 'text', seq: 1 }]).mockRejectedValueOnce(new Error('offline'));
  const primer = await motor.reenviaAConverses([m], [{ id: 'a' }, { id: 'b' }]);
  expect(primer.resultats.map(r => r.estat)).toEqual(['confirmat', 'error']);
  const segon = await motor.reenviaAConverses([m], [{ id: 'a' }, { id: 'b' }], { operacioId: primer.operacioId });
  expect(segon.resultats.map(r => r.estat)).toEqual(['confirmat', 'confirmat']);
  expect(enviaText.mock.calls.map(([d]) => d.id)).toEqual(['a', 'b', 'b']);
  expect(enviaText.mock.calls[1][2].clientMsgId).toBe(enviaText.mock.calls[2][2].clientMsgId);
  await expect(motor.reenviaAConverses([m], [{ id: 'c' }], { operacioId: primer.operacioId })).rejects.toThrow('mateix reenviament');
});
test('forward d’adjunt: Blob autoritzat una volta, IDs nous per destí i cap URL/metadada d’origen', async () => {
  const original = { ...m, tipus: 'imatge', metadades: { adjunt: { id: 'source-private-id', mime: 'image/webp', url: 'https://secret.invalid/token' } } };
  fonts.set(m.id, original);
  const r = await motor.reenviaAConverses([original], [{ id: 'a' }, { id: 'b' }]);
  expect(lligBlob).toHaveBeenCalledOnce(); expect(enviaAdjunt).toHaveBeenCalledTimes(2);
  const payloads = enviaAdjunt.mock.calls.map(([, a]) => a);
  expect(payloads[0].id).not.toBe(payloads[1].id); expect(payloads[0].fitxer).toBeInstanceOf(Blob);
  expect(JSON.stringify(payloads)).not.toMatch(/source-private-id|secret.invalid|metadades|respostaA/);
  expect(r.resultats.every(r => r.estat === 'confirmat')).toBe(true);
});
test('cancel·lar forward no confirma transport tardà ni envia destinacions següents', async () => {
  const d = deferred(); enviaText.mockReturnValueOnce(d.promise); const control = new AbortController();
  const p = motor.reenviaAConverses([m], [{ id: 'a' }, { id: 'b' }], { signal: control.signal }).catch(e => e);
  await vi.waitFor(() => expect(enviaText).toHaveBeenCalledOnce()); control.abort();
  expect(await p).toMatchObject({ name: 'AbortError' });
  d.resolve([{ id: 'new-2', seq: 1 }]); await Promise.resolve(); expect(enviaText).toHaveBeenCalledOnce();
});
test.each([{ seq: true }, { filId: 'wrong' }, { tipus: 'veu' }, { encuat: true }])('un ACK de forward fals no confirma ni bloqueja reintent: %j', async extra => {
  enviaText.mockImplementationOnce(async (d, _t, o) => [{ id: o.clientMsgId, filId: d.id, tipus: 'text', seq: 1, ...extra }]);
  const r = await motor.reenviaAConverses([m], [{ id: 'a' }]);
  expect(r.resultats[0]).toMatchObject({ estat: 'error', error: { code: 'sense-confirmacio' } });
  const retry = await motor.reenviaAConverses([m], [{ id: 'a' }], { operacioId: r.operacioId });
  expect(retry.resultats[0].estat).toBe('confirmat'); expect(retry.resultats[0].id).toBe(r.resultats[0].id);
});
test('el pressupost de 20 MB inclou descàrregues concurrents i s’allibera en acabar, també entre manifests', async () => {
  const video = { ...m, tipus: 'video', metadades: { adjunt: { duradaMs: 1000 } } }; fonts.set(m.id, video);
  const d = deferred(); lligBlob.mockReturnValueOnce(d.promise).mockResolvedValue(new Blob(['video'], { type: 'video/mp4' }));
  const primer = motor.reenviaAConverses([video], [{ id: 'a' }]);
  await vi.waitFor(() => expect(lligBlob).toHaveBeenCalledOnce());
  const segon = await motor.reenviaAConverses([video], [{ id: 'b' }]);
  expect(segon.resultats[0]).toMatchObject({ estat: 'error', error: { code: 'XAT_MEMORIA_ADJUNTS' } });
  expect(lligBlob).toHaveBeenCalledOnce();
  d.resolve(new Blob(['video'], { type: 'video/mp4' })); await primer;
  const retry = await motor.reenviaAConverses([video], [{ id: 'b' }], { operacioId: segon.operacioId });
  expect(retry.resultats[0].estat).toBe('confirmat'); expect(lligBlob).toHaveBeenCalledTimes(2);
});
test('un retorn parcial no reté Blobs: el reintent torna a autoritzar la font i només envia l’error', async () => {
  const photo = { ...m, tipus: 'imatge' }; fonts.set(m.id, photo);
  enviaAdjunt.mockImplementationOnce(async (d, a) => [{ id: a.id, filId: d.id, tipus: a.tipus, seq: 1 }]).mockRejectedValueOnce(new Error('offline'));
  const first = await motor.reenviaAConverses([photo], [{ id: 'a' }, { id: 'b' }]);
  await motor.reenviaAConverses([photo], [{ id: 'a' }, { id: 'b' }], { operacioId: first.operacioId });
  expect(lligBlob).toHaveBeenCalledTimes(2); expect(enviaAdjunt.mock.calls.map(([d]) => d.id)).toEqual(['a', 'b', 'b']);
});
