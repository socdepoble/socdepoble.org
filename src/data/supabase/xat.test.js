import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadFils, loadMissatges, marcaLlegit, creaFilDirecte, carregaMembres, enviaMissatge, obriFilDePagina, subscribeToXat, unsubscribeFromXat } from './xat.js';
import { esperaLaIAIA, reiniciaLocalXat } from '../localXat.js';
import { AGENTS_MAP } from '../agentsSeed.js';
import { BENVINGUDA_IAIA, PERSONA_PILOT } from '../identitatsSeed.js';
import { XAT_SEED_IDS, XAT_SEED_MEMBRES, XAT_SEED_NOMS, construeixLlavorXat } from '../xatSeed.js';

/* modePerDefecte fa de política d'execució del host (host.js): és el mode que
   resol una crida sense config, com la baixa que fa XatContext. */
const mock = vi.hoisted(() => ({ getClient: vi.fn(), user: { id: 'A' }, modePerDefecte: 'remote' }));
vi.mock('./config.js', () => ({ getClient: mock.getClient }));
vi.mock('../identitat.js', () => ({ usuariDeSessio: () => mock.user, getDefaultUserId: () => mock.user?.id || 'convidat-seed' }));
vi.mock('./runtime.js', () => ({
  getResolvedConfig: config => ({ ...config, runtimeDataMode: config.dataMode || mock.modePerDefecte }),
  generateUUID: () => 'uuid-generat'
}));
vi.mock('./utils.js', () => ({ handleError: error => error }));

const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
/* Deixa córrer tota la cua de microtasques: l'intent acotat de la baixa no l'espera ningú. */
const buidaCua = () => new Promise((r) => { setTimeout(r, 0); });
const REMOT ={ tenantId: '00000000-0000-4000-8000-000000000000' };
/* W4-10 · A Supabase l'altra part d'un fil directe és un UUID (crea_fil_directe). */
const ALTRE = '00000000-0000-4000-8000-000000000042';
const SEED = { dataMode: 'seed', tenantId: '00000000-0000-4000-8000-000000000000' };
let query, client;
beforeEach(() => {
  vi.clearAllMocks(); mock.user = { id: 'A' }; mock.modePerDefecte = 'remote'; reiniciaLocalXat();
  query = { data: [], error: null, abortSignal: vi.fn().mockReturnThis() };
  client = { rpc: vi.fn().mockReturnValue(query), from: vi.fn().mockReturnValue(query), channel: vi.fn(), removeChannel: vi.fn().mockResolvedValue('ok') };
  mock.getClient.mockResolvedValue(client);
});

const calls = [
  ['llista', config => loadFils(config)],
  ['missatges', config => loadMissatges('fil', config)],
  ['llegit', config => marcaLlegit('fil', config)],
  ['creacio', config => creaFilDirecte(ALTRE, null, config)],
  ['membres', config => carregaMembres(null, config)],
  ['enviament', config => enviaMissatge('fil', 'text', config)]
];

describe('transport cancel·lable del Xat', () => {
  it.each(calls)('propaga AbortSignal a %s', async (_name, call) => {
    query.data = _name === 'enviament' ? [{ id: 'm', seq: 1, creat_al: '2026-09-27T08:00:00Z' }] : [];
    const signal = new AbortController().signal;
    await call({ ...REMOT, signal });
    expect(query.abortSignal).toHaveBeenCalledOnce();
    const intern = query.abortSignal.mock.calls[0][0];
    expect(intern).toBeInstanceOf(AbortSignal);
    expect(intern).not.toBe(signal);
    expect(intern.aborted).toBe(false);
  });
  it.each(calls)('no despatxa %s si canvia el scope durant getClient', async (_name, call) => {
    const pending = deferred(); mock.getClient.mockReturnValueOnce(pending.promise);
    const controller = new AbortController();
    const result = call({ ...REMOT, signal: controller.signal }).catch(error => error);
    controller.abort(); pending.resolve(client); await result;
    expect(client.rpc).not.toHaveBeenCalled(); expect(client.from).not.toHaveBeenCalled();
  });
  it('no converteix un intent d’A en un enviament de B durant getClient', async () => {
    const pending = deferred(); mock.getClient.mockReturnValueOnce(pending.promise);
    const result = enviaMissatge('fil-A', 'privat A').catch(error => error);
    mock.user = { id: 'B' }; pending.resolve(client);
    const error = await result;
    expect(error.message).toBe('La sessió ha canviat.');
    expect(error.retriable).toBe(false);
    expect(client.rpc).not.toHaveBeenCalled();
  });
});


/* CUR-02 (261025) · El transport pot ignorar abort: el termini i la
   cancel·lació han de liquidar igualment la promesa i alliberar la cua. */
describe('CUR-02 · termini RPC i cancel·lació independents del transport', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.restoreAllMocks(); });

  const penjades = [...calls, ['pagina', config => obriFilDePagina({ tipus: 'publicacio', id: 'x', ruta: '/mur/x' }, config)]];
  it.each(penjades)('liquida %s als 30 s encara que el SDK ignore abort', async (_nom, call) => {
    const pendent = deferred();
    query.then = pendent.promise.then.bind(pendent.promise);
    const extern = new AbortController();
    const afig = vi.spyOn(extern.signal, 'addEventListener');
    const lleva = vi.spyOn(extern.signal, 'removeEventListener');
    let resultat;
    const crida = call({ ...REMOT, signal: extern.signal }).then(valor => { resultat = { valor }; }, error => { resultat = { error }; });
    await vi.advanceTimersByTimeAsync(29999);
    expect(resultat).toBeUndefined();
    await vi.advanceTimersByTimeAsync(2);
    expect(resultat?.error).toMatchObject({ name: 'TimeoutError', code: 'TimeoutError', retriable: true });
    const intern = query.abortSignal.mock.calls[0][0];
    expect(intern).not.toBe(extern.signal);
    expect(intern.aborted).toBe(true);
    expect(extern.signal.aborted).toBe(false);
    expect(lleva).toHaveBeenCalledWith('abort', afig.mock.calls.find(([nom]) => nom === 'abort')[1]);
    expect(vi.getTimerCount()).toBe(0);
    await crida;
    pendent.resolve({ data: [], error: null });
    await vi.advanceTimersByTimeAsync(0);
    expect(resultat).toHaveProperty('error');
  });

  it('el termini també existix sense senyal extern i el reintent conserva p_id', async () => {
    const pendent = deferred();
    query.then = pendent.promise.then.bind(pendent.promise);
    const entrada = { id: 'id-que-es-reintenta', text: 'Bon dia' };
    let error;
    const crida = enviaMissatge('fil', entrada, REMOT).catch(e => { error = e; });
    await vi.advanceTimersByTimeAsync(30001);
    expect(error).toMatchObject({ name: 'TimeoutError', retriable: true });
    await crida;
    const segona = { data: [{ id: entrada.id, seq: 7 }], error: null, abortSignal: vi.fn().mockReturnThis() };
    client.rpc.mockReturnValue(segona);
    await expect(enviaMissatge('fil', entrada, REMOT)).resolves.toMatchObject({ id: entrada.id, seq: 7 });
    expect(client.rpc.mock.calls.map(([nom, args]) => [nom, args.p_id])).toEqual([['xat_envia', entrada.id], ['xat_envia', entrada.id]]);
    pendent.resolve({ data: [{ id: entrada.id, seq: 7 }], error: null });
    await vi.advanceTimersByTimeAsync(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(penjades)('l’avortament extern liquida %s de seguida amb SDK penjat i es distingix del termini', async (_nom, call) => {
    const pendent = deferred();
    query.then = pendent.promise.then.bind(pendent.promise);
    const extern = new AbortController();
    const afig = vi.spyOn(extern.signal, 'addEventListener');
    const lleva = vi.spyOn(extern.signal, 'removeEventListener');
    let error;
    const crida = call({ ...REMOT, signal: extern.signal }).catch(e => { error = e; });
    await vi.advanceTimersByTimeAsync(0);
    const intern = query.abortSignal.mock.calls[0][0];
    extern.abort();
    await vi.advanceTimersByTimeAsync(0);
    expect(error).toMatchObject({ name: 'AbortError', code: 'AbortError' });
    expect(intern.aborted).toBe(true);
    expect(lleva).toHaveBeenCalledWith('abort', afig.mock.calls.find(([nom]) => nom === 'abort')[1]);
    expect(vi.getTimerCount()).toBe(0);
    await crida;
    pendent.resolve({ data: [], error: null });
    await vi.advanceTimersByTimeAsync(0);
  });

  it('un rebuig tardà després del termini queda consumit i no torna a liquidar la crida', async () => {
    let rebutja;
    const pendent = new Promise((_resol, reject) => { rebutja = reject; });
    query.then = pendent.then.bind(pendent);
    const errorRebut = vi.fn();
    const crida = loadMissatges('fil', REMOT).catch(errorRebut);
    await vi.advanceTimersByTimeAsync(30001);
    expect(errorRebut).toHaveBeenCalledOnce();
    expect(errorRebut.mock.calls[0][0]).toMatchObject({ name: 'TimeoutError' });
    await crida;
    rebutja(new Error('Resposta fallida tardana'));
    await vi.advanceTimersByTimeAsync(0);
    expect(errorRebut).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('èxit o excepció en abortSignal netegen el temporitzador i el listener', async () => {
    const extern = new AbortController();
    const afig = vi.spyOn(extern.signal, 'addEventListener');
    const lleva = vi.spyOn(extern.signal, 'removeEventListener');
    await expect(loadMissatges('fil', { ...REMOT, signal: extern.signal })).resolves.toEqual([]);
    expect(vi.getTimerCount()).toBe(0);
    expect(lleva).toHaveBeenCalledWith('abort', afig.mock.calls[0][1]);
    query.abortSignal.mockImplementationOnce(() => { throw new TypeError('Transport indisponible'); });
    await expect(loadMissatges('fil', { ...REMOT, signal: extern.signal })).rejects.toMatchObject({ retriable: true });
    expect(vi.getTimerCount()).toBe(0);
    expect(lleva).toHaveBeenLastCalledWith('abort', afig.mock.calls.at(-1)[1]);
  });
});

describe('enviament idempotent per RPC', () => {
  it.each([1, 7, '7', Number.MAX_SAFE_INTEGER, String(Number.MAX_SAFE_INTEGER)])('admet el seq enter positiu segur %s de la confirmació', async (seq) => {
    query.data = [{ id: 'id-client', seq }];
    await expect(enviaMissatge('fil', { id: 'id-client', text: 'Hola' }, REMOT)).resolves.toMatchObject({ seq: Number(seq) });
  });
  it.each([
    ['absent', undefined], ['nul', null], ['text', 'invalid'], ['buit', ''], ['espais', ' '],
    ['NaN', NaN], ['infinit', Infinity], ['zero', 0], ['negatiu', -1], ['decimal', 1.5],
    ['enter insegur', Number.MAX_SAFE_INTEGER + 1], ['enter insegur en text', '9007199254740993'],
    ['zero en text', '0'], ['decimal en text', '1.5'], ['hexadecimal', '0x10'],
    ['booleà true', true], ['booleà false', false], ['array buit', []], ['array numèric', [1]], ['objecte', {}]
  ])('rebutja el seq %s amb error de confirmació reintentable', async (_cas, seq) => {
    query.data = [{ id: 'id-client', seq }];
    await expect(enviaMissatge('fil', { id: 'id-client', text: 'Hola' }, REMOT))
      .rejects.toMatchObject({ code: 'SENSE_CONFIRMACIO', retriable: true });
    expect(client.rpc).toHaveBeenCalledTimes(1);
  });
  /* Auditoria de Codex 261016 (P2) · El cas exacte de la reproducció: la
     confirmació { id: 'm-bad', seq: 'invalid' } tornava seq NaN i XatContext
     la prenia per bona. Ara falla, i el reintent de XatContext (mateix id)
     queda confirmat per la resposta vàlida, sense cap missatge nou. */
  it('una confirmació amb seq invàlid falla reintentable i el reintent amb el mateix id es confirma', async () => {
    const entrada = { id: 'm-bad', text: 'Prova' };
    query.data = [{ id: 'm-bad', seq: 'invalid' }];
    const error = await enviaMissatge('fil', entrada, REMOT).catch((e) => e);
    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({ code: 'SENSE_CONFIRMACIO', retriable: true, message: 'El servidor no ha confirmat el missatge.' });
    query.data = [{ id: 'm-bad', seq: 3, creat_al: '2026-10-16T00:30:00Z' }];
    await expect(enviaMissatge('fil', entrada, REMOT)).resolves.toMatchObject({ id: 'm-bad', seq: 3 });
    expect(client.rpc.mock.calls.map(([nom, args]) => [nom, args.p_id])).toEqual([['xat_envia', 'm-bad'], ['xat_envia', 'm-bad']]);
  });
  it('envia una cadena amb xat_envia i un id generat, i torna el seq del servidor', async () => {
    query.data = [{ id: 'uuid-generat', seq: 7, creat_al: '2026-09-27T08:00:00Z' }];
    const desat = await enviaMissatge('fil', '  Bon dia \n', REMOT);
    expect(client.from).not.toHaveBeenCalled();
    expect(client.rpc).toHaveBeenCalledWith('xat_envia', {
      p_id: 'uuid-generat', p_fil_id: 'fil', p_tipus: 'text', p_text: 'Bon dia', p_resposta_a: null, p_metadades: {}
    });
    expect(desat).toMatchObject({ id: 'uuid-generat', filId: 'fil', seq: 7, usuariId: 'A', text: 'Bon dia', tipus: 'text', esIA: false, creatAl: '2026-09-27T08:00:00Z' });
  });
  it('conserva l’id del client en els reintents', async () => {
    query.data = [{ id: 'id-client', seq: 8, creat_al: '2026-09-27T08:01:00Z' }];
    await enviaMissatge('fil', { id: 'id-client', text: 'Hola', respostaA: 'm-anterior', metadades: { origen: 'prova' } }, REMOT);
    await enviaMissatge('fil', { id: 'id-client', text: 'Hola' }, REMOT);
    expect(client.rpc.mock.calls.map(([, args]) => args.p_id)).toEqual(['id-client', 'id-client']);
    expect(client.rpc.mock.calls[0][1]).toMatchObject({ p_resposta_a: 'm-anterior', p_metadades: { origen: 'prova' } });
  });
  it('l’autoria d’entitat prové de la confirmació del servidor, mai d’un id triat pel client', async () => {
    query.data = [{ id: 'm-org', seq: 8, creat_al: '2026-09-27T08:01:00Z', com_org_id: 'org-real', autor_nom: 'Sóc de Poble' }];
    const desat = await enviaMissatge('fil-entitat', { text: 'Bon dia', comOrgId: 'org-inventada' }, REMOT);
    expect(desat).toMatchObject({ usuariId: 'A', comOrgId: 'org-real', autorNom: 'Sóc de Poble' });
    expect(client.rpc.mock.calls[0][1]).not.toHaveProperty('p_com_org_id');
    expect(client.rpc.mock.calls[0][1]).not.toHaveProperty('comOrgId');
  });
  it('rebutja el missatge buit o de sistema abans d’anar al servidor', async () => {
    await expect(enviaMissatge('fil', '   ', REMOT)).rejects.toMatchObject({ code: 'SDP-XAT-007', retriable: false });
    await expect(enviaMissatge('fil', { text: 'x', tipus: 'sistema' }, REMOT)).rejects.toMatchObject({ code: 'SDP-XAT-010' });
    await expect(enviaMissatge('fil', { text: 'x', tipus: 'imatge' }, REMOT)).rejects.toMatchObject({ code: 'SDP-XAT-010' });
    await expect(enviaMissatge('fil', 'a'.repeat(4097), REMOT)).rejects.toMatchObject({ code: 'SDP-XAT-007' });
    expect(client.rpc).not.toHaveBeenCalled();
  });
  it('conserva el text del servidor quan comença per SDP-XAT- i no és reintentable', async () => {
    query.error = { message: 'SDP-XAT-006: no eres membre actiu d’este fil.', code: '42501' };
    const error = await enviaMissatge('fil', 'Hola', REMOT).catch(e => e);
    expect(error.message).toBe('SDP-XAT-006: no eres membre actiu d’este fil.');
    expect(error.code).toBe('SDP-XAT-006');
    expect(error.retriable).toBe(false);
  });
  /* Auditoria 261007 (B) · Amb la forma REAL de postgrest-js: no llança, torna
     { data: null, error: objecte pla, status } i l'estat HTTP és a la
     resposta, no a l'error (node_modules/@supabase/postgrest-js, 420-431 i
     486-509). La prova d'abans simulava un TypeError i un error amb `status`
     dins, que postgrest-js no produïx mai, i passava sense provar res. */
  it('marca com a reintentables la xarxa i els errors del servidor, amb la forma real de postgrest-js', async () => {
    const respon = (error, status) => { query.error = error; query.status = status; };
    /* Safari (iOS 16, el baseline): un fetch que no arriba. */
    respon({ message: 'TypeError: Load failed', details: '', hint: '', code: '' }, 0);
    const safari = await enviaMissatge('fil', 'Hola', REMOT).catch((e) => e);
    expect(safari).toMatchObject({ retriable: true, code: 'XAT', message: 'No s’ha pogut enviar el missatge.' });
    expect(safari.cause).toMatchObject({ status: 0 });
    respon({ message: 'TypeError: Failed to fetch', details: '', hint: '', code: '' }, 0);
    await expect(enviaMissatge('fil', 'Hola', REMOT)).rejects.toMatchObject({ retriable: true });
    /* La passarel·la o PostgREST sense la memòria de l'esquema: 5xx. */
    respon({ message: 'Could not query the database for the schema cache. Retrying.', code: 'PGRST002', details: null, hint: null }, 503);
    await expect(enviaMissatge('fil', 'Hola', REMOT)).rejects.toMatchObject({ retriable: true });
    respon({ message: '<html>502 Bad Gateway</html>' }, 502);
    await expect(loadMissatges('fil', REMOT)).rejects.toMatchObject({ retriable: true });
    /* Sense estat (un altre client), el text del fetch caigut encara es reconeix. */
    respon({ message: 'TypeError: Load failed' }, undefined);
    await expect(loadFils(REMOT)).rejects.toMatchObject({ retriable: true });
    /* Una regla del servidor o l'esquema absent no es reintenten mai. */
    respon({ message: 'SDP-XAT-006: no eres membre actiu d’este fil.', code: '42501', details: null, hint: null }, 403);
    await expect(enviaMissatge('fil', 'Hola', REMOT)).rejects.toMatchObject({ code: 'SDP-XAT-006', retriable: false });
    respon({ message: 'Could not find the function public.xat_envia', code: 'PGRST202', details: null, hint: null }, 404);
    await expect(enviaMissatge('fil', 'Hola', REMOT)).rejects.toMatchObject({ code: 'ESQUEMA', retriable: false });
    respon({ message: 'permís', code: '42501' }, 400);
    await expect(marcaLlegit('fil', REMOT)).rejects.toMatchObject({ code: 'XAT', retriable: false });
  });

  /* Auditoria 261007 (B) · Un TypeError LLANÇAT de veres (no tornat per
     postgrest-js) encara pot arribar a errorDeXat: un fetch que llança dins
     de getClient o del client. El de Safari el reconeix també el text; el
     d'undici («fetch failed», Node) només la branca `instanceof TypeError`. */
  it('un TypeError llançat sense estat és reintentable', async () => {
    client.rpc.mockImplementationOnce(() => { throw new TypeError('Load failed'); });
    await expect(enviaMissatge('fil', 'Hola', REMOT)).rejects.toMatchObject({ retriable: true, code: 'XAT' });
    client.rpc.mockImplementationOnce(() => { throw new TypeError('fetch failed'); });
    const error = await enviaMissatge('fil', 'Hola', REMOT).catch((e) => e);
    expect(error).toMatchObject({ retriable: true, code: 'XAT', message: 'No s’ha pogut enviar el missatge.' });
    expect(error.cause).toBeInstanceOf(TypeError);
    expect(error.cause.status).toBeUndefined();
  });

  it('un estat que ja porta l’error no se sobreescriu amb el de la resposta', async () => {
    query.error = { message: 'upstream', status: 503 };
    query.status = 0;
    const error = await enviaMissatge('fil', 'Hola', REMOT).catch((e) => e);
    expect(error.cause.status).toBe(503);
    expect(error.retriable).toBe(true);
  });

  it('una crida avortada mentre era en vol ix com a AbortError, no com a error del xat', async () => {
    const controller = new AbortController();
    query.abortSignal = vi.fn(function avorta() { controller.abort(); return this; });
    query.error = { message: 'AbortError: The user aborted a request.', details: '', hint: 'Request was aborted (timeout or manual cancellation)', code: '' };
    query.status = 0;
    const error = await loadMissatges('fil', { ...REMOT, signal: controller.signal }).catch((e) => e);
    expect(error).toMatchObject({ name: 'AbortError', code: 'AbortError' });
  });
});

describe('historial per cursor i marques', () => {
  const fila = (seq, extra = {}) => ({ id: `m${seq}`, usuari_id: 'B', autor_nom: 'Pepa', cos: `t${seq}`, tipus: 'text', seq, resposta_a: null,
    editat_al: null, esborrat_al: null, metadades: {}, es_ia: false, creat_al: `2026-09-27T08:0${seq}:00Z`, ...extra });
  it('sense opcions demana xat_historial sense cursor i ordena per seq', async () => {
    query.data = [fila(3), fila(1), fila(2, { cos: null, esborrat_al: '2026-09-27T09:00:00Z' })];
    const missatges = await loadMissatges('fil', REMOT);
    expect(client.rpc).toHaveBeenCalledWith('xat_historial', { p_fil_id: 'fil', p_abans_de_seq: null, p_limit: 50 });
    expect(missatges.map(m => m.seq)).toEqual([1, 2, 3]);
    expect(missatges[1]).toMatchObject({ id: 'm2', filId: 'fil', text: null, esborratAl: '2026-09-27T09:00:00Z', autorNom: 'Pepa', usuariId: 'B' });
  });
  it('amb abansDeSeq pagina cap arrere i amb despresDeSeq demana els nous', async () => {
    await loadMissatges('fil', { ...REMOT, abansDeSeq: 40, limit: 20 });
    expect(client.rpc).toHaveBeenLastCalledWith('xat_historial', { p_fil_id: 'fil', p_abans_de_seq: 40, p_limit: 20 });
    await loadMissatges('fil', { ...REMOT, despresDeSeq: 40 });
    expect(client.rpc).toHaveBeenLastCalledWith('xat_nous', { p_fil_id: 'fil', p_despres_de_seq: 40 });
  });
  it('rebutja un límit o un cursor invàlid sense cridar el servidor', async () => {
    await expect(loadMissatges('fil', { ...REMOT, limit: 101 })).rejects.toMatchObject({ code: 'SDP-XAT-009' });
    await expect(loadMissatges('fil', { ...REMOT, abansDeSeq: 0 })).rejects.toMatchObject({ code: 'SDP-XAT-009' });
    await expect(loadMissatges('fil', { ...REMOT, despresDeSeq: -1 })).rejects.toMatchObject({ code: 'SDP-XAT-009' });
    expect(client.rpc).not.toHaveBeenCalled();
  });
  it('marcaLlegit crida xat_marca i torna les dos marques', async () => {
    query.data = [{ rebut_fins_seq: 15, llegit_fins_seq: 12 }];
    const marques = await marcaLlegit('fil', { ...REMOT, llegitFinsSeq: 12 });
    expect(client.rpc).toHaveBeenCalledWith('xat_marca', { p_fil_id: 'fil', p_rebut_fins: null, p_llegit_fins: 12 });
    expect(marques).toEqual({ llegitFinsSeq: 12, rebutFinsSeq: 15 });
  });
  it('loadFils mapeja la v2 de xat_fils_meus', async () => {
    query.data = [{ id: 'f', tipus: 'grup', titol: 'Comissió', imatge_url: null, actualitzat_al: 'x', altres_noms: ['Pepa'], ultim_text: 'Hola',
      ultim_al: 'y', ultim_autor_id: 'B', ultim_seq: 18, llegit_fins_seq: 15, rebut_fins_seq: 18, llegit_pels_altres_fins_seq: 18,
      no_llegits: 3, arxivat_al: null, fixat_al: null, silenciat_fins_al: null, preferit_al: null, no_llegit_manual: false }];
    const [fil] = await loadFils(REMOT);
    expect(client.rpc).toHaveBeenCalledWith('xat_fils_meus', { p_tenant_id: '00000000-0000-4000-8000-000000000000' });
    expect(fil).toEqual({ id: 'f', tipus: 'grup', titol: 'Comissió', altresNoms: ['Pepa'], imatgeUrl: null, actualitzatAl: 'x', ultimText: 'Hola',
      /* La v2 no porta ultim_tipus (arriba amb la v5 de 2610220240). */
      ultimTipus: null,
      ultimAl: 'y', ultimAutorId: 'B', ultimSeq: 18, llegitFinsSeq: 15, rebutFinsSeq: 18, llegitPelsAltresFinsSeq: 18, noLlegits: 3,
      arxivatAl: null, fixatAl: null, silenciatFinsAl: null, preferitAl: null, noLlegitManual: false,
      /* Lògica d'Usuari: la v2 encara no diu qui són els altres ni si és un canal d'entitat. */
      altres: [], entitatId: null, entitatNom: null, comEntitat: false,
      /* Contracte del Xat §2: tota Conversa porta comunitatId i subjecte; la v2 no en diu res. */
      comunitatId: null, subjecte: null });
  });
  it('carregaMembres cerca al servidor i llança l’error', async () => {
    query.data = [{ usuari_id: 'B', nom: 'Pepa', fil_id: null }];
    await expect(carregaMembres('  pep ', REMOT)).resolves.toEqual([{ usuari_id: 'B', nom: 'Pepa', fil_id: null }]);
    expect(client.rpc).toHaveBeenCalledWith('membres_del_poble', { p_tenant_id: '00000000-0000-4000-8000-000000000000', p_cerca: 'pep' });
    query.error = { message: 'SDP-XAT-003: no eres membre d’aquest poble.' };
    await expect(carregaMembres(null, REMOT)).rejects.toMatchObject({ code: 'SDP-XAT-003' });
  });
  it('el padró remot i els fils conserven les identitats reals d’entitat', async () => {
    const org = { usuari_id: 'org-real', nom: 'Sóc de Poble', tipus: 'entitat', avatar_url: '/logo.svg', fil_id: 'fil-org' };
    query.data = [org];
    expect(await carregaMembres('Sóc', REMOT)).toEqual([org]);
    query.data = [{ id: 'fil-org', org_id: 'org-real', entitat_nom: 'Sóc de Poble', com_entitat: true,
      altres: [{ id: 'client-real', nom: 'Client', tipus: 'persona', avatarUrl: null }] }];
    /* Ordre del Mestre (261007) · Les files d'ajuda per defecte van a la cua:
       es comparen les converses de veres. */
    expect((await loadFils(REMOT)).filter(f => !f.perDefecte)).toEqual([expect.objectContaining({ entitatId: 'org-real', entitatNom: 'Sóc de Poble', comEntitat: true,
      altres: [{ id: 'client-real', nom: 'Client', tipus: 'persona', avatarUrl: null }] })]);
  });
});

/* Ordre del Mestre (261007) · «Sóc de Poble» i la «IAIA MarIA» a la llista de
   tota persona en remot: la regla és de xatsPerDefecte.js i l'adaptador només
   la crida amb la resposta del servidor. */
describe('xats d’ajuda per defecte en remot', () => {
  // Onada 8 (261009) · El logo quadrat és el PNG (abans, l'SVG).
  const LOGO_QUADRAT = '/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png';
  const UUID_ENTITAT = '00000000-0000-4000-8000-0000000000aa';
  /* Gauntlet 261016 (Bloc 3.6) · Ordre del Mestre: quatre converses sempre.
     Les tres directes (Sóc de Poble, Javi Llinares i la IAIA) van a la cua;
     abans n'eren dues. Gauntlet 261016_1530 (Bloc 3.6.1, ordre vigent) ·
     «PROHIBIT duplicar Sóc de Poble»: fora la fila directa sintètica de
     l'entitat. A la cua, Javi i la IAIA; el primer actor és la comunitat, que
     posa la llista (sections/xat/actorsDelXat.js). S'actualitza a posta. */
  it('sense cap conversa, les dues files a la cua: Javi amb la seua foto i la IAIA; cap de Sóc de Poble', async () => {
    query.data = [];
    const fils = await loadFils(REMOT);
    expect(fils.map(f => [f.id, f.perDefecte, f.imatgeUrl])).toEqual([
      ['sdp-per-defecte:javi', 'javi', '/assets/fotos/javi-llinares-perfil-1200px.jpg'],
      ['sdp-per-defecte:iaia', 'iaia', AGENTS_MAP.IAIA.avatar_url]
    ]);
    expect(fils.some(f => f.imatgeUrl === LOGO_QUADRAT)).toBe(false);
    expect(client.rpc).toHaveBeenCalledTimes(1);
  });
  it('un usuari anònim sense sessió rep directament els fils per defecte sense cridar xat_fils_meus (zero 401 a la consola)', async () => {
    mock.user = null;
    const fils = await loadFils(REMOT);
    expect(fils.map(f => [f.id, f.perDefecte])).toEqual([
      ['sdp-per-defecte:javi', 'javi'],
      ['sdp-per-defecte:iaia', 'iaia']
    ]);
    expect(client.rpc).not.toHaveBeenCalled();
  });
  it('amb el missatge directe real amb l’entitat (xat_fils_meus porta el seu slug), el directe i, a la cua, Javi i la IAIA', async () => {
    query.data = [{ id: 'f-real', tipus: 'directe', titol: null, org_id: UUID_ENTITAT, entitat_nom: 'Sóc de Poble', com_entitat: false,
      altres: [{ id: UUID_ENTITAT, nom: 'Sóc de Poble', tipus: 'entitat', avatarUrl: null, slug: 'socdepoble' }], ultim_seq: 2 }];
    expect((await loadFils(REMOT)).map(f => f.perDefecte ?? f.id)).toEqual(['f-real', 'javi', 'iaia']);
  });
  it('la comunitat de l’entitat (amb subjecte) arriba tal qual, i cap fila sintètica de Sóc de Poble s’hi suma', async () => {
    query.data = [{ id: 'f-av', tipus: 'canal', org_id: UUID_ENTITAT, subjecte_tipus: 'entitat', subjecte_id: UUID_ENTITAT,
      altres: [{ id: UUID_ENTITAT, nom: 'Sóc de Poble', tipus: 'entitat', avatarUrl: null, slug: 'socdepoble' }] }];
    expect((await loadFils(REMOT)).map(f => f.perDefecte ?? f.id)).toEqual(['f-av', 'javi', 'iaia']);
  });
  /* Gauntlet 261016 (Bloc 3.6, també la IAIA a localhost) · Derogat «en seed,
     cap fila sintètica»: la llavor rep les que li falten (Sóc de Poble i Javi;
     la IAIA ja hi té el seu fil 'iaia'), sense tocar Supabase.
     Gauntlet 261016_1530 (Bloc 3.6.1) · Era el duplicat visible de l'MCR (la
     comunitat de la llavor més el directe sintètic): ara només Javi, i la
     comunitat «Sóc de Poble» de la llavor és l'única. */
  it('en seed, només la fila que falta a la llavor (Javi): ni Sóc de Poble, que ja hi és com a comunitat, ni la IAIA', async () => {
    const fils = await loadFils(SEED);
    expect(fils.filter(f => f.perDefecte).map(f => f.perDefecte)).toEqual(['javi']);
    expect(fils.filter(f => f.titol === 'Sóc de Poble').map(f => f.tipus)).toEqual(['comunitat']);
    expect(mock.getClient).not.toHaveBeenCalled();
  });
  it('sense poble, cap llista ni cap fila sintètica', async () => {
    expect(await loadFils({})).toEqual([]);
    expect(client.rpc).not.toHaveBeenCalled();
  });
  it('un error del servidor es propaga sense injectar res', async () => {
    query.error = { message: 'SDP-XAT-003: no eres membre d’aquest poble.' };
    await expect(loadFils(REMOT)).rejects.toMatchObject({ code: 'SDP-XAT-003' });
  });
});

/* W4-10 (auditoria de Codex 261003_1950) · La restricció de format és del
   proveïdor: la interfície passa l'id que li torna el port i és l'adaptador
   qui sap que crea_fil_directe(p_altre_usuari uuid) només en vol un UUID. */
describe('W4-10 · crea_fil_directe només rep un UUID', () => {
  it('un destinatari UUID arriba tal qual a la RPC i torna el fil del servidor', async () => {
    query.data = 'fil-nou';
    await expect(creaFilDirecte(ALTRE, null, REMOT)).resolves.toBe('fil-nou');
    expect(client.rpc).toHaveBeenCalledTimes(1);
    expect(client.rpc).toHaveBeenCalledWith('crea_fil_directe', {
      p_tenant_id: '00000000-0000-4000-8000-000000000000', p_altre_usuari: ALTRE, p_titol: null
    });
  });
  it.each([
    ['l’id opac d’un altre backend', '42'],
    ['l’id d’entitat de WordPress', 'wp:organization:42'],
    ['l’id de la llavor', 'socdepoble'],
    ['el slug de l’entitat', 'soc-de-poble'],
    ['un UUID amb espais', ` ${ALTRE}`],
    ['una cadena buida', ''],
    ['res', null],
    ['un número', 42]
  ])('rebutja %s amb un error clar, abans de demanar el client i sense cap RPC', async (_cas, id) => {
    const error = await creaFilDirecte(id, null, REMOT).catch(e => e);
    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({ code: 'DESTINATARI_INVALID', retriable: false });
    expect(error.message).toMatch(/^No es pot obrir la conversa: .*UUID/);
    expect(mock.getClient).not.toHaveBeenCalled();
    expect(client.rpc).not.toHaveBeenCalled();
  });
  it('en seed el destinatari de la llavor continua obrint la conversa local, sense Supabase', async () => {
    const fil = await creaFilDirecte(XAT_SEED_IDS.entitat, null, SEED);
    expect(XAT_SEED_IDS.entitat).toBe('socdepoble');
    expect(typeof fil).toBe('string');
    expect(mock.getClient).not.toHaveBeenCalled();
  });
});

describe('canal privat de temps real', () => {
  it('subscriu xat:f:<filId> en broadcast privat i només avisa del seq', async () => {
    const channel = { on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() };
    client.channel.mockReturnValue(channel);
    const controller = new AbortController(), callback = vi.fn();
    const { subscription, error } = await subscribeToXat('fil', callback, { ...REMOT, signal: controller.signal });
    expect(error).toBeNull();
    expect(client.channel).toHaveBeenCalledWith('xat:f:fil', { config: { private: true, broadcast: { self: false } } });
    expect(channel.on.mock.calls[0].slice(0, 2)).toEqual(['broadcast', { event: 'nous' }]);
    const incoming = channel.on.mock.calls[0][2];
    incoming({ payload: { filId: 'fil', seq: 9 } });
    expect(callback).toHaveBeenCalledWith(null, { tipus: 'nous', filId: 'fil', seq: 9 });
    const estat = channel.subscribe.mock.calls[0][0];
    estat('SUBSCRIBED'); expect(callback).toHaveBeenCalledTimes(1);
    estat('CHANNEL_ERROR', new Error('sense permís'));
    expect(callback).toHaveBeenLastCalledWith(expect.objectContaining({ message: 'No s’ha pogut obrir el canal del xat.' }), null);
    controller.abort(); incoming({ payload: { seq: 10 } }); expect(callback).toHaveBeenCalledTimes(2);
    mock.getClient.mockResolvedValue({ removeChannel: vi.fn() });
    await unsubscribeFromXat(subscription);
    expect(client.removeChannel).toHaveBeenCalledWith(channel);
    expect(mock.getClient).toHaveBeenCalledTimes(1);
  });
  it('T48 · la segona baixa d’un canal remot no el torna a tancar ni demana client', async () => {
    const channel = { on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() };
    client.channel.mockReturnValue(channel);
    const { subscription } = await subscribeToXat('fil', vi.fn(), REMOT);
    await Promise.all([unsubscribeFromXat(subscription), unsubscribeFromXat(subscription)]);
    expect(client.removeChannel).toHaveBeenCalledTimes(1);
    expect(mock.getClient).toHaveBeenCalledTimes(1);
  });
  /* Auditoria de Codex 261016 (P2, baixa fallida) · Amb 'timed out', Phoenix
     ja ha tancat el canal i l'ha tret del client (phoenix channel.js, leave;
     RealtimeChannel.ts, _onClose → _remove). Esta prova el fixava abans com a
     fallida, junt amb 'error'; l'ordre del 261016 diu que la baixa és efectiva
     amb tot estat que no siga 'error'. */
  it.each(['ok', 'timed out'])('la baixa amb estat %s és efectiva: lleva el propietari i no es torna a provar', async (estat) => {
    const channel = { on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() };
    client.channel.mockReturnValue(channel);
    const { subscription } = await subscribeToXat('fil', vi.fn(), REMOT);
    client.removeChannel.mockResolvedValueOnce(estat);
    await expect(unsubscribeFromXat(subscription)).resolves.toBeUndefined();
    await buidaCua();
    await expect(unsubscribeFromXat(subscription)).resolves.toBeUndefined();
    expect(client.removeChannel).toHaveBeenCalledTimes(1);
  });
  it('la baixa amb estat error conserva el client propietari, avisa qui crida i el reintent s’afig a l’intent acotat', async () => {
    const channel = { on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() };
    client.channel.mockReturnValue(channel);
    client.removeAllChannels = vi.fn();
    const { subscription } = await subscribeToXat('fil', vi.fn(), REMOT);
    client.removeChannel.mockResolvedValueOnce('error');
    mock.getClient.mockResolvedValue({ removeChannel: vi.fn() });
    await expect(unsubscribeFromXat(subscription)).rejects.toMatchObject({
      code: 'CANAL_NO_TANCAT', retriable: true, cause: expect.objectContaining({ message: 'El canal ha tornat l’estat error en donar-se de baixa.' })
    });
    // Encara que canvie el mode, el reintent és del client que va obrir el canal,
    // i no n'obri cap altre: s'afig a l'intent acotat que ja és en marxa.
    await expect(unsubscribeFromXat(subscription, SEED)).resolves.toBeUndefined();
    expect(client.removeChannel).toHaveBeenCalledTimes(2);
    expect(client.removeChannel).toHaveBeenLastCalledWith(channel);
    expect(mock.getClient).toHaveBeenCalledTimes(1);
    await unsubscribeFromXat(subscription);
    expect(client.removeChannel).toHaveBeenCalledTimes(2);
    expect(client.removeAllChannels).not.toHaveBeenCalled();
  });
  /* Alliberament acotat · El desmuntatge de XatContext dona de baixa una sola
     vegada i no reintenta: l'adaptador fa un intent més pel seu compte. */
  it('en el desmuntatge, darrere d’un error, un sol intent més allibera el canal sense que ningú reintente', async () => {
    const channel = { on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() };
    client.channel.mockReturnValue(channel);
    client.removeAllChannels = vi.fn();
    const { subscription } = await subscribeToXat('fil', vi.fn(), REMOT);
    client.removeChannel.mockResolvedValueOnce('error');
    await expect(unsubscribeFromXat(subscription)).rejects.toMatchObject({ code: 'CANAL_NO_TANCAT', retriable: true });
    await buidaCua();
    expect(client.removeChannel).toHaveBeenCalledTimes(2);
    expect(client.removeChannel).toHaveBeenLastCalledWith(channel);
    // Ja és tancat: una baixa tardana no torna al client.
    await expect(unsubscribeFromXat(subscription)).resolves.toBeUndefined();
    expect(client.removeChannel).toHaveBeenCalledTimes(2);
    expect(client.removeAllChannels).not.toHaveBeenCalled();
  });
  it('si l’intent acotat també falla, no n’hi ha cap més i el propietari queda per a un reintent explícit', async () => {
    const channel = { on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() };
    client.channel.mockReturnValue(channel);
    const { subscription } = await subscribeToXat('fil', vi.fn(), REMOT);
    client.removeChannel.mockResolvedValue('error');
    await expect(unsubscribeFromXat(subscription)).rejects.toMatchObject({ code: 'CANAL_NO_TANCAT', retriable: true });
    await buidaCua();
    await buidaCua();
    expect(client.removeChannel).toHaveBeenCalledTimes(2);
    client.removeChannel.mockResolvedValue('ok');
    await expect(unsubscribeFromXat(subscription)).resolves.toBeUndefined();
    expect(client.removeChannel).toHaveBeenCalledTimes(3);
    expect(client.removeChannel).toHaveBeenLastCalledWith(channel);
    expect(mock.getClient).toHaveBeenCalledTimes(1);
  });
  it.each(['rebuig', 'llançament'])('la baixa amb %s preserva la causa i es pot tornar a provar', async (cas) => {
    const channel = { on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() };
    client.channel.mockReturnValue(channel);
    const { subscription } = await subscribeToXat('fil', vi.fn(), REMOT);
    const cause = new Error('transport fallit');
    if (cas === 'rebuig') client.removeChannel.mockRejectedValueOnce(cause);
    else client.removeChannel.mockImplementationOnce(() => { throw cause; });
    await expect(unsubscribeFromXat(subscription)).rejects.toMatchObject({ code: 'CANAL_NO_TANCAT', retriable: true, cause });
    await expect(unsubscribeFromXat(subscription)).resolves.toBeUndefined();
    expect(client.removeChannel).toHaveBeenCalledTimes(2);
  });
  it('dues baixes simultànies comparteixen el mateix intent i rebuig, sense perdre el reintent', async () => {
    const channel = { on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() };
    client.channel.mockReturnValue(channel);
    const { subscription } = await subscribeToXat('fil', vi.fn(), REMOT);
    const pendent = deferred();
    client.removeChannel.mockReturnValueOnce(pendent.promise);
    const resultats = Promise.allSettled([unsubscribeFromXat(subscription), unsubscribeFromXat(subscription)]);
    await Promise.resolve();
    expect(client.removeChannel).toHaveBeenCalledTimes(1);
    pendent.resolve('error');
    const [primera, segona] = await resultats;
    expect(primera).toMatchObject({ status: 'rejected', reason: { code: 'CANAL_NO_TANCAT', retriable: true } });
    expect(segona).toMatchObject({ status: 'rejected', reason: primera.reason });
    await expect(unsubscribeFromXat(subscription)).resolves.toBeUndefined();
    expect(client.removeChannel).toHaveBeenCalledTimes(2);
  });
  it('T48 · una subscripció que no és un canal remot no crea client ni llança', async () => {
    await expect(unsubscribeFromXat({ filId: 'fil', callback: vi.fn() })).resolves.toBeUndefined();
    expect(mock.getClient).not.toHaveBeenCalled();
  });
  it('avisa amb callback(error, null) si la subscripció no es pot obrir', async () => {
    mock.getClient.mockRejectedValue(new Error('Falta configuració pública de Supabase'));
    const callback = vi.fn();
    const result = await subscribeToXat('fil', callback, REMOT);
    expect(result.subscription).toBeNull();
    expect(result.error).toMatchObject({ code: 'XAT' });
    expect(callback).toHaveBeenCalledWith(result.error, null);
  });
});

describe('mode seed (localXat)', () => {
  /* T63.1 · La Pàgina Universal d'on naix la comunitat: el perfil públic de l'entitat pilot. */
  const SUBJECTE = { tipus: 'entitat', id: 'socdepoble', ruta: '/empresa/socdepoble', titol: 'Sóc de Poble' };
  // Onada 8 (261009) · El logo de l'entitat a la llavor és el PNG (abans, l'SVG).
  const LOGO = '/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png';
  const TIPUS_DE_LA_LLAVOR = ['canal', 'comunitat', 'grup', 'grup', 'iaia'];
  const noLlegits = (fils) => fils.reduce((total, f) => total + f.noLlegits, 0);

  it('T63.1 · la llavor només porta identitats reals: cap persona ni conversa inventada', () => {
    expect(XAT_SEED_MEMBRES.map(m => [m.usuariId, m.nom, m.tipus])).toEqual([
      ['0001', 'Javi Llinares', 'persona'],
      ['socdepoble', 'Sóc de Poble', 'entitat'],
      [XAT_SEED_IDS.iaia, 'IAIA MarIA', 'ia']
    ]);
    expect(XAT_SEED_MEMBRES.find(m => m.tipus === 'entitat').avatarUrl).toBe(LOGO);
    const llavor = construeixLlavorXat('jo-proves', Date.UTC(2026, 8, 28, 12, 0));
    const tot = JSON.stringify({ llavor, XAT_SEED_MEMBRES, XAT_SEED_NOMS, XAT_SEED_IDS });
    for (const robot of ['Pepa', 'Vicent', 'Maria Roig', 'Toni', 'Comissió', '4b0f9c3e-1a2d-4f5e-8b6c']) {
      expect(tot).not.toContain(robot);
    }
    expect(llavor.fils.map(f => f.tipus).sort()).toEqual(TIPUS_DE_LA_LLAVOR);
    /* La salutació canònica acordada també és la benvinguda de la llavor. */
    expect(llavor.missatges.filter(m => m.filId === XAT_SEED_IDS.filIaia))
      .toEqual([expect.objectContaining({ usuariId: XAT_SEED_IDS.iaia, esIA: true, text: BENVINGUDA_IAIA })]);
  });

  it('T63.1 · la comunitat «Sóc de Poble» naix de la Pàgina Universal de l’entitat i porta Avisos, General i Beta Testers', () => {
    const llavor = construeixLlavorXat('jo-proves', Date.UTC(2026, 8, 28, 12, 0));
    const fil = (id) => llavor.fils.find(f => f.id === id);
    /* Contracte del Xat §1: tot fil porta comunitatId i subjecte (null si no en té). */
    for (const f of llavor.fils) expect(Object.keys(f)).toEqual(expect.arrayContaining(['comunitatId', 'subjecte']));
    expect(fil(XAT_SEED_IDS.filIaia)).toMatchObject({ tipus: 'iaia', comunitatId: null, subjecte: null, ultimSeq: 1 });
    expect(fil(XAT_SEED_IDS.filComunitat)).toEqual({
      id: XAT_SEED_IDS.filComunitat, tipus: 'comunitat', titol: 'Sóc de Poble', orgId: 'socdepoble', imatgeUrl: LOGO,
      comunitatId: null, subjecte: SUBJECTE, creatAl: expect.any(String), actualitzatAl: expect.any(String), ultimSeq: 0
    });
    expect(fil(XAT_SEED_IDS.filAvisos)).toMatchObject({
      tipus: 'canal', titol: 'Avisos', orgId: 'socdepoble', comunitatId: XAT_SEED_IDS.filComunitat, subjecte: SUBJECTE, ultimSeq: 3
    });
    expect(fil(XAT_SEED_IDS.filGeneral)).toMatchObject({
      tipus: 'grup', titol: 'General', orgId: null, comunitatId: XAT_SEED_IDS.filComunitat, subjecte: SUBJECTE, ultimSeq: 2
    });
    /* Gauntlet 261016_1530 (Bloc 3.6.1) · El literal de l'ordre del Mestre,
       «Beta Testers» (abans «Beta testers»): s'actualitza a posta. */
    expect(fil(XAT_SEED_IDS.filBetaTesters)).toMatchObject({
      tipus: 'grup', titol: 'Beta Testers', orgId: null, comunitatId: XAT_SEED_IDS.filComunitat, subjecte: SUBJECTE, ultimSeq: 2
    });
    /* Cada fil té la seua còpia del subjecte: tocar-ne una no en canvia cap altra. */
    expect(fil(XAT_SEED_IDS.filAvisos).subjecte).not.toBe(fil(XAT_SEED_IDS.filGeneral).subjecte);
    /* La comunitat és un contenidor: cap missatge propi. */
    expect(llavor.missatges.filter(m => m.filId === XAT_SEED_IDS.filComunitat)).toEqual([]);
    /* Els avisos els signa l'entitat; General s'obri amb el missatge de sistema de creació. */
    const avisos = llavor.missatges.filter(m => m.filId === XAT_SEED_IDS.filAvisos);
    expect(avisos.map(m => [m.seq, m.usuariId, m.autorNom, m.comOrgId])).toEqual([
      [1, 'socdepoble', 'Sóc de Poble', 'socdepoble'], [2, 'socdepoble', 'Sóc de Poble', 'socdepoble'],
      [3, 'socdepoble', 'Sóc de Poble', 'socdepoble']
    ]);
    const general = llavor.missatges.filter(m => m.filId === XAT_SEED_IDS.filGeneral);
    expect(general[0]).toMatchObject({ seq: 1, tipus: 'sistema', text: null, metadades: { clau: 'creat' } });
    expect(general[1]).toMatchObject({ seq: 2, tipus: 'text', autorNom: 'Sóc de Poble', comOrgId: 'socdepoble' });
    /* Jo a la comunitat i als tres fills; l'entitat hi és com a participant virtual. A Avisos queden dos missatges per llegir. */
    const de = (filId) => llavor.participants.filter(p => p.filId === filId).map(p => [p.usuariId, p.esEntitat, p.llegitFinsSeq]);
    expect(de(XAT_SEED_IDS.filComunitat)).toEqual([['jo-proves', false, 0], ['socdepoble', true, 0]]);
    expect(de(XAT_SEED_IDS.filAvisos)).toEqual([['jo-proves', false, 1], ['socdepoble', true, 3]]);
    expect(de(XAT_SEED_IDS.filGeneral)).toEqual([['jo-proves', false, 2], ['socdepoble', true, 2]]);
    expect(de(XAT_SEED_IDS.filBetaTesters)).toEqual([['jo-proves', false, 2], ['socdepoble', true, 2]]);
    const beta = llavor.missatges.filter(m => m.filId === XAT_SEED_IDS.filBetaTesters);
    expect(beta).toHaveLength(2);
    expect(beta[0]).toMatchObject({ seq: 1, tipus: 'sistema', text: null, metadades: { clau: 'creat' } });
    expect(beta[1]).toMatchObject({ seq: 2, autorNom: 'Sóc de Poble', comOrgId: 'socdepoble', text: expect.stringMatching(/^Benvinguts al canal de Beta Testers!/) });
  });

  it('serveix les cinc converses de la llavor sense tocar Supabase, amb dos avisos per llegir', async () => {
    /* Gauntlet 261016 (Bloc 3.6) · Les files sintètiques de la cua (Sóc de
       Poble i Javi) no són de la llavor: les prova «xats d’ajuda per defecte».
       Gauntlet 261016_1530 (Bloc 3.6.1) · Només la de Javi: la de Sóc de
       Poble s'ha retirat (la llavor ja en porta la comunitat). */
    const totes = await loadFils(SEED);
    const fils = totes.filter(f => !f.perDefecte);
    expect(totes.length - fils.length).toBe(1);
    expect(mock.getClient).not.toHaveBeenCalled();
    expect(fils).toHaveLength(5);
    expect(fils.map(f => f.tipus).sort()).toEqual(TIPUS_DE_LA_LLAVOR);
    expect(noLlegits(fils)).toBe(2);
    /* T4 · cada fil diu qui són els altres, amb tipus i avatar. */
    const iaia = fils.find(f => f.id === XAT_SEED_IDS.filIaia);
    expect(iaia.altres).toEqual([{ id: XAT_SEED_IDS.iaia, nom: 'IAIA MarIA', tipus: 'ia', avatarUrl: AGENTS_MAP.IAIA.avatar_url }]);
    expect(iaia.imatgeUrl).toBe(AGENTS_MAP.IAIA.avatar_url);
    expect(fils.find(f => f.id === XAT_SEED_IDS.filComunitat)).toMatchObject({
      tipus: 'comunitat', titol: 'Sóc de Poble', imatgeUrl: LOGO, ultimSeq: 0, noLlegits: 0, ultimText: null, entitatId: 'socdepoble'
    });
    const avisos = fils.find(f => f.id === XAT_SEED_IDS.filAvisos);
    expect(avisos).toMatchObject({
      tipus: 'canal', titol: 'Avisos', ultimSeq: 3, llegitFinsSeq: 1, noLlegits: 2, imatgeUrl: LOGO,
      entitatId: 'socdepoble', entitatNom: 'Sóc de Poble', comEntitat: false, llegitPelsAltresFinsSeq: 3
    });
    expect(avisos.ultimText).toMatch(/^Estem a punt de donar permís als usuaris/);
    expect(fils.find(f => f.id === XAT_SEED_IDS.filGeneral)).toMatchObject({ tipus: 'grup', titol: 'General', ultimSeq: 2, noLlegits: 0 });
  });

  it('Contracte del Xat §2 · la Conversa local porta el comunitatId i el subjecte del fil', async () => {
    const perId = new Map((await loadFils(SEED)).map(f => [f.id, f]));
    expect(perId.get(XAT_SEED_IDS.filIaia)).toMatchObject({ comunitatId: null, subjecte: null });
    expect(perId.get(XAT_SEED_IDS.filComunitat)).toMatchObject({ comunitatId: null, subjecte: SUBJECTE });
    expect(perId.get(XAT_SEED_IDS.filAvisos)).toMatchObject({ comunitatId: XAT_SEED_IDS.filComunitat, subjecte: SUBJECTE });
    expect(perId.get(XAT_SEED_IDS.filGeneral)).toMatchObject({ comunitatId: XAT_SEED_IDS.filComunitat, subjecte: SUBJECTE });
  });

  it('T3 · la IAIA respon sola amb la frase fixa i avisa el canal', async () => {
    /* La baixa va sense config, com a XatContext: el mode el posa la política del host. */
    mock.modePerDefecte = 'seed';
    const callback = vi.fn();
    const { subscription } = await subscribeToXat(XAT_SEED_IDS.filIaia, callback, SEED);
    expect(subscription).toEqual({ filId: XAT_SEED_IDS.filIaia, callback });
    /* Ids explícits: el generateUUID de la prova sempre torna el mateix, i el
       segon enviament seria idempotent (ni resposta de la IAIA ni avís), de
       manera que la prova passaria encara que la baixa no fera res. */
    const meu = await enviaMissatge(XAT_SEED_IDS.filIaia, { id: 'bon-dia-iaia', text: 'Bon dia, IAIA' }, SEED);
    expect(meu).toMatchObject({ usuariId: 'A', esIA: false, seq: 2 });
    /* Gauntlet 261016_1530 (Bloc 3.6.6; relleu F25) · La resposta és
       asíncrona (primer mira la Wiki; una salutació no hi busca res): es
       demana quan la IAIA ha acabat. L'avís continua sent un de sol, amb el
       seq de la resposta. */
    await esperaLaIAIA();
    const missatges = await loadMissatges(XAT_SEED_IDS.filIaia, SEED);
    expect(missatges.map(m => m.seq)).toEqual([1, 2, 3]);
    expect(missatges[2]).toMatchObject({ usuariId: XAT_SEED_IDS.iaia, autorNom: 'IAIA MarIA', esIA: true });
    /* Gauntlet 261022_0225 (crítica Claude) · A una salutació, la seua
       salutació: abans, «Ara estic en proves» contradeia la benvinguda. */
    expect(missatges[2].text).toBe(BENVINGUDA_IAIA);
    await Promise.resolve();
    expect(callback).toHaveBeenCalledWith(null, { tipus: 'nous', filId: XAT_SEED_IDS.filIaia, seq: 3 });
    expect(callback).toHaveBeenCalledTimes(1);
    await unsubscribeFromXat(subscription);
    await enviaMissatge(XAT_SEED_IDS.filIaia, { id: 'segon-a-la-iaia', text: 'Segon' }, SEED);
    await esperaLaIAIA();
    await Promise.resolve();
    expect(callback).toHaveBeenCalledTimes(1);
  });
  it('Gauntlet 261016_1530 (F25) · en remot el client no respon per la IAIA: només xat_envia, cap resposta local', async () => {
    query.data = [{ id: 'remot-iaia', seq: 4, creat_al: '2026-10-16T08:00:00Z' }];
    const enviat = await enviaMissatge(XAT_SEED_IDS.filIaia, { id: 'remot-iaia', text: 'Què és Sollutia?' }, REMOT);
    expect(enviat).toMatchObject({ id: 'remot-iaia', seq: 4 });
    expect(client.rpc.mock.calls.map(([nom]) => nom)).toEqual(['xat_envia']);
    await esperaLaIAIA();
    expect((await loadMissatges(XAT_SEED_IDS.filIaia, SEED)).map(m => m.seq)).toEqual([1]);
  });
  it('T48 · la baixa del canal local va al magatzem i no crea cap client de Supabase', async () => {
    const fil = XAT_SEED_IDS.filGeneral, callback = vi.fn();
    const { subscription } = await subscribeToXat(fil, callback, SEED);
    /* Ids explícits: el generateUUID de la prova sempre torna el mateix i el segon no avisaria. */
    await enviaMissatge(fil, { id: 'abans-de-la-baixa', text: 'Abans' }, SEED);
    await Promise.resolve();
    expect(callback).toHaveBeenCalledTimes(1);
    await unsubscribeFromXat(subscription, SEED);
    await enviaMissatge(fil, { id: 'despres-de-la-baixa', text: 'Després' }, SEED);
    await Promise.resolve();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(mock.getClient).not.toHaveBeenCalled();
  });
  it('T2 · els avisos els signa l’entitat; com a client, obric un canal propi amb ella, idempotent', async () => {
    const avisos = await loadMissatges(XAT_SEED_IDS.filAvisos, SEED);
    expect(avisos.map(m => [m.seq, m.autorNom, m.comOrgId, m.esIA])).toEqual([
      [1, 'Sóc de Poble', XAT_SEED_IDS.entitat, false], [2, 'Sóc de Poble', XAT_SEED_IDS.entitat, false],
      [3, 'Sóc de Poble', XAT_SEED_IDS.entitat, false]
    ]);
    /* Com a client, jo obric un canal amb l'entitat: no és cap fill de la comunitat i l'altra part és l'entitat. */
    const nou = await creaFilDirecte(XAT_SEED_IDS.entitat, null, SEED);
    expect(await creaFilDirecte(XAT_SEED_IDS.entitat, null, SEED)).toBe(nou);
    expect([XAT_SEED_IDS.filComunitat, XAT_SEED_IDS.filAvisos, XAT_SEED_IDS.filGeneral]).not.toContain(nou);
    const meu = (await loadFils(SEED)).find(f => f.id === nou);
    expect(meu).toMatchObject({ tipus: 'entitat', comEntitat: false, entitatId: XAT_SEED_IDS.entitat });
    expect(meu.altres).toEqual([{ id: XAT_SEED_IDS.entitat, nom: 'Sóc de Poble', tipus: 'entitat', avatarUrl: LOGO }]);
    /* Ids explícits: el generateUUID de la prova sempre torna el mateix i la idempotència per id els confondria. */
    const hola = await enviaMissatge(nou, { id: 'hola-entitat', text: 'Hola, Sóc de Poble!' }, SEED);
    expect(hola).toMatchObject({ autorNom: null, comOrgId: null });
  });
  it('pagina per seq cap arrere i cap avant', async () => {
    const fil = XAT_SEED_IDS.filGeneral;
    /* General porta dos missatges de llavor; se n'hi afigen sis per a poder paginar. */
    for (let i = 1; i <= 6; i += 1) await enviaMissatge(fil, { id: `pagina-${i}`, text: `Missatge ${i}` }, SEED);
    const tots = await loadMissatges(fil, SEED);
    expect(tots.map(m => m.seq)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(tots[0]).toMatchObject({ tipus: 'sistema', text: null, metadades: { clau: 'creat' } });
    expect(tots[1]).toMatchObject({ autorNom: 'Sóc de Poble', comOrgId: XAT_SEED_IDS.entitat });
    const ultims = await loadMissatges(fil, { ...SEED, limit: 3 });
    expect(ultims.map(m => m.seq)).toEqual([6, 7, 8]);
    const anteriors = await loadMissatges(fil, { ...SEED, abansDeSeq: ultims[0].seq, limit: 3 });
    expect(anteriors.map(m => m.seq)).toEqual([3, 4, 5]);
    const nous = await loadMissatges(fil, { ...SEED, despresDeSeq: 6 });
    expect(nous.map(m => m.seq)).toEqual([7, 8]);
  });
  it('un missatge enviat dos vegades amb el mateix id es guarda una i marca com a llegit', async () => {
    const fil = XAT_SEED_IDS.filGeneral;
    const primer = await enviaMissatge(fil, { id: 'id-client', text: 'Vaig cap allà' }, SEED);
    const segon = await enviaMissatge(fil, { id: 'id-client', text: 'Vaig cap allà' }, SEED);
    expect(primer.seq).toBe(3); expect(segon.seq).toBe(3);
    expect((await loadMissatges(fil, SEED)).filter(m => m.id === 'id-client')).toHaveLength(1);
    expect(await enviaMissatge(fil, 'Sense id', SEED)).toMatchObject({ id: 'uuid-generat', seq: 4, usuariId: 'A' });
    const general = (await loadFils(SEED)).find(f => f.id === fil);
    /* L'entitat ha llegit fins a la seua benvinguda (2); els meus, encara no. */
    expect(general).toMatchObject({ noLlegits: 0, ultimText: 'Sense id', ultimSeq: 4, llegitPelsAltresFinsSeq: 2 });
  });
  it('marcaLlegit no retrocedix i sense marca arriba a l’últim', async () => {
    const fil = XAT_SEED_IDS.filAvisos;
    expect(await marcaLlegit(fil, { ...SEED, llegitFinsSeq: 0 })).toEqual({ llegitFinsSeq: 1, rebutFinsSeq: 3 });
    expect(await marcaLlegit(fil, SEED)).toEqual({ llegitFinsSeq: 3, rebutFinsSeq: 3 });
    expect(await marcaLlegit(fil, { ...SEED, llegitFinsSeq: 1 })).toEqual({ llegitFinsSeq: 3, rebutFinsSeq: 3 });
    const fils = await loadFils(SEED);
    expect(fils.find(f => f.id === fil).noLlegits).toBe(0);
    expect(noLlegits(fils)).toBe(0);
  });
  it('directori de tres (Javi Llinares, Sóc de Poble i la IAIA) i conversa nova, idempotent, amb canal local', async () => {
    /* Onada 12 (261011; ordres 261011_0130, punt 3, D-09) · Javi porta al padró
       del xat la foto del padró pilot (abans, null: la silueta). */
    const membres = await carregaMembres('jav', SEED);
    expect(membres).toEqual([{ usuari_id: '0001', nom: 'Javi Llinares', tipus: 'persona', avatar_url: PERSONA_PILOT.avatar, fil_id: null }]);
    expect(PERSONA_PILOT.avatar).toMatch(/^\/assets\/fotos\/.+\.jpg$/);
    expect(PERSONA_PILOT.avatar).not.toBe(LOGO);
    const tots = await carregaMembres(null, SEED);
    expect(tots.map(m => m.nom)).toEqual(['IAIA MarIA', 'Javi Llinares', 'Sóc de Poble']);
    expect(tots.find(m => m.nom === 'IAIA MarIA')).toMatchObject({ tipus: 'ia', fil_id: XAT_SEED_IDS.filIaia });
    /* La comunitat no és cap conversa amb l'entitat: el padró no hi apunta. */
    expect(tots.find(m => m.nom === 'Sóc de Poble')).toMatchObject({ tipus: 'entitat', avatar_url: LOGO, fil_id: null });
    const nou = await creaFilDirecte(XAT_SEED_IDS.javi, null, SEED);
    expect(await creaFilDirecte(XAT_SEED_IDS.javi, null, SEED)).toBe(nou);
    expect((await loadFils(SEED)).some(f => f.id === nou && f.tipus === 'directe' && f.altresNoms[0] === 'Javi Llinares')).toBe(true);
    /* D-09 · La conversa directa amb Javi es pinta amb la seua foto, a la llista i a la capçalera. */
    expect((await loadFils(SEED)).find(f => f.id === nou)).toMatchObject({
      imatgeUrl: PERSONA_PILOT.avatar, altres: [expect.objectContaining({ id: '0001', tipus: 'persona', avatarUrl: PERSONA_PILOT.avatar })]
    });
    expect((await carregaMembres('jav', SEED))[0].fil_id).toBe(nou);
    await expect(loadMissatges('fil-inexistent', SEED)).rejects.toMatchObject({ code: 'SDP-XAT-005' });
    const callback = vi.fn();
    const { subscription, error } = await subscribeToXat(nou, callback, SEED);
    expect(error).toBeNull();
    expect(subscription).toMatchObject({ filId: nou });
    expect(callback).not.toHaveBeenCalled();
    await enviaMissatge(nou, 'Hola, Javi', SEED);
    await Promise.resolve();
    expect(callback).toHaveBeenCalledWith(null, { tipus: 'nous', filId: nou, seq: 1 });
  });
  /* Gauntlet 261016 (Bloc 3.6.2, «la IAIA falla a localhost») · En local no
     hi ha converses de llavor, i la llista naixia BUIDA: ni la IAIA hi era.
     Ara hi ha les tres files directes, la IAIA inclosa. S'actualitza a posta.
     Gauntlet 261016_1530 (Bloc 3.6.1) · Dues: fora la de Sóc de Poble. En
     local la comunitat la porta la llista (actorsDelXat.js), amb la fila que
     fa el camí del «Comentar» de /socdepoble. */
  it('en mode local no hi ha converses de llavor, però sí les dues files permanents, i el padró és el mateix de tres', async () => {
    const LOCAL = { dataMode: 'local', tenantId: '00000000-0000-4000-8000-000000000000' };
    expect((await loadFils(LOCAL)).map(f => f.id)).toEqual(['sdp-per-defecte:javi', 'sdp-per-defecte:iaia']);
    expect((await carregaMembres(null, LOCAL)).map(m => m.nom)).toEqual(['IAIA MarIA', 'Javi Llinares', 'Sóc de Poble']);
    expect(mock.getClient).not.toHaveBeenCalled();
  });
  /* Auditoria adversarial 261016 (P2) · En local, comentar a /iaia crea el
     grup «L'ànima de la iaia», on la IAIA no contesta. Eixe grup no és el
     seu xat: la fila «IAIA MarIA» es queda (porta al directe, ?amb=IAIA_ID) i
     el grup ix amb el títol de la pàgina, sense vestir. En remot, el xat
     públic de /iaia sí que és el de la IAIA (vegeu «xats d’ajuda per defecte»). */
  it('en mode local, el xat públic de /iaia no retira la fila de la IAIA', async () => {
    const LOCAL = { dataMode: 'local', tenantId: '00000000-0000-4000-8000-000000000000' };
    const obert = await obriFilDePagina({ tipus: 'pagina', id: '/iaia', ruta: '/iaia', titol: "L'ànima de la iaia" }, LOCAL);
    expect(obert?.filId).toBeTruthy();
    const fils = await loadFils(LOCAL);
    expect(fils.map(f => f.perDefecte ?? f.id)).toEqual([obert.filId, 'javi', 'iaia']);
    expect(fils[0]).toMatchObject({ tipus: 'grup', titol: "L'ànima de la iaia", subjecte: expect.objectContaining({ tipus: 'pagina', id: '/iaia' }) });
    expect(mock.getClient).not.toHaveBeenCalled();
  });
  it('sense sessió usa el convidat, que també veu la comunitat i hi pot conversar', async () => {
    mock.user = null;
    const fils = (await loadFils(SEED)).filter(f => !f.perDefecte);
    expect(fils.map(f => f.tipus).sort()).toEqual(TIPUS_DE_LA_LLAVOR);
    expect(noLlegits(fils)).toBe(2);
    const meu = await enviaMissatge(XAT_SEED_IDS.filGeneral, 'Hola des del convidat', SEED);
    expect(meu.usuariId).toBe('convidat-seed');
  });
});

/* CUR-03 · El canal recuperat torna a avisar i pot tornar a fallar. */
describe('CUR-03 · recuperació del canal real', () => {
  const prepara = async () => {
    const channel = { on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() };
    client.channel.mockReturnValue(channel);
    const callback = vi.fn(), controller = new AbortController();
    const res = await subscribeToXat('fil', callback, { ...REMOT, signal: controller.signal });
    return { channel, callback, controller, res, estat: channel.subscribe.mock.calls[0][0] };
  };
  it('CUR-03 · SUBSCRIBED després d’un error emet recuperació neutral', async () => {
    const { estat, callback, res } = await prepara();
    estat('CHANNEL_ERROR', new Error('fora'));
    estat('SUBSCRIBED');
    expect(callback).toHaveBeenLastCalledWith(null, { tipus: 'nous', filId: 'fil', seq: null });
    await unsubscribeFromXat(res.subscription);
  });
  it('CUR-03 · un error nou després de recuperar no queda silenciat', async () => {
    const { estat, callback, res } = await prepara();
    estat('CHANNEL_ERROR', new Error('fora'));
    estat('TIMED_OUT', new Error('mateixa fallada'));
    expect(callback).toHaveBeenCalledTimes(1);
    estat('SUBSCRIBED');
    estat('TIMED_OUT', new Error('una altra fallada'));
    expect(callback.mock.calls.filter(([error]) => error)).toHaveLength(2);
    expect(callback.mock.calls.filter(([, dades]) => dades?.tipus === 'nous' && dades.seq === null)).toHaveLength(1);
    await unsubscribeFromXat(res.subscription);
  });
  it('CUR-03 · un avís de nous també rearma la fallada següent', async () => {
    const { channel, estat, callback, res } = await prepara();
    estat('CHANNEL_ERROR', new Error('fora'));
    channel.on.mock.calls[0][2]({ payload: { seq: 9 } });
    estat('TIMED_OUT', new Error('una altra fallada'));
    expect(callback.mock.calls.filter(([error]) => error)).toHaveLength(2);
    expect(callback).toHaveBeenNthCalledWith(2, null, { tipus: 'nous', filId: 'fil', seq: 9 });
    await unsubscribeFromXat(res.subscription);
  });
  it('CUR-03 · un SUBSCRIBED tardà després d’abortar no avisa', async () => {
    const { estat, callback, controller, res } = await prepara();
    estat('CHANNEL_ERROR', new Error('fora'));
    controller.abort(); estat('SUBSCRIBED');
    expect(callback).toHaveBeenCalledTimes(1);
    await unsubscribeFromXat(res.subscription);
  });
});
