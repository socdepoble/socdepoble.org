import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadFils, loadMissatges, marcaLlegit, creaFilDirecte, carregaMembres, enviaMissatge, subscribeToXat, unsubscribeFromXat } from './xat.js';
import { reiniciaLocalXat } from '../localXat.js';
import { XAT_SEED_IDS } from '../xatSeed.js';

const mock = vi.hoisted(() => ({ getClient: vi.fn(), user: { id: 'A' } }));
vi.mock('./config.js', () => ({ getClient: mock.getClient }));
vi.mock('../identitat.js', () => ({ usuariDeSessio: () => mock.user, getDefaultUserId: () => mock.user?.id || 'convidat-seed' }));
vi.mock('./runtime.js', () => ({
  getResolvedConfig: config => ({ ...config, runtimeDataMode: config.dataMode || 'remote' }),
  generateUUID: () => 'uuid-generat'
}));
vi.mock('./utils.js', () => ({ handleError: error => error }));

const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const REMOT = { tenantId: 'poble' };
const SEED = { dataMode: 'seed', tenantId: 'poble' };
let query, client;
beforeEach(() => {
  vi.clearAllMocks(); mock.user = { id: 'A' }; reiniciaLocalXat();
  query = { data: [], error: null, abortSignal: vi.fn().mockReturnThis() };
  client = { rpc: vi.fn().mockReturnValue(query), from: vi.fn().mockReturnValue(query), channel: vi.fn(), removeChannel: vi.fn().mockResolvedValue(null) };
  mock.getClient.mockResolvedValue(client);
});

const calls = [
  ['llista', config => loadFils(config)],
  ['missatges', config => loadMissatges('fil', config)],
  ['llegit', config => marcaLlegit('fil', config)],
  ['creacio', config => creaFilDirecte('B', null, config)],
  ['membres', config => carregaMembres(null, config)],
  ['enviament', config => enviaMissatge('fil', 'text', config)]
];

describe('transport cancel·lable del Xat', () => {
  it.each(calls)('propaga AbortSignal a %s', async (_name, call) => {
    query.data = _name === 'enviament' ? [{ id: 'm', seq: 1, creat_al: '2026-09-27T08:00:00Z' }] : [];
    const signal = new AbortController().signal;
    await call({ ...REMOT, signal });
    expect(query.abortSignal).toHaveBeenCalledWith(signal);
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

describe('enviament idempotent per RPC', () => {
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
  it('marca com a reintentables la xarxa i els errors del servidor', async () => {
    query.error = new TypeError('Failed to fetch');
    await expect(enviaMissatge('fil', 'Hola', REMOT)).rejects.toMatchObject({ retriable: true, message: 'No s’ha pogut enviar el missatge.' });
    query.error = { message: 'upstream', status: 503 };
    await expect(enviaMissatge('fil', 'Hola', REMOT)).rejects.toMatchObject({ retriable: true });
    query.error = { message: 'Could not find the function public.xat_envia', code: 'PGRST202' };
    await expect(enviaMissatge('fil', 'Hola', REMOT)).rejects.toMatchObject({ code: 'ESQUEMA', retriable: false });
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
    expect(client.rpc).toHaveBeenCalledWith('xat_fils_meus', { p_tenant_id: 'poble' });
    expect(fil).toEqual({ id: 'f', tipus: 'grup', titol: 'Comissió', altresNoms: ['Pepa'], imatgeUrl: null, actualitzatAl: 'x', ultimText: 'Hola',
      ultimAl: 'y', ultimAutorId: 'B', ultimSeq: 18, llegitFinsSeq: 15, rebutFinsSeq: 18, llegitPelsAltresFinsSeq: 18, noLlegits: 3,
      arxivatAl: null, fixatAl: null, silenciatFinsAl: null, preferitAl: null, noLlegitManual: false });
  });
  it('carregaMembres cerca al servidor i llança l’error', async () => {
    query.data = [{ usuari_id: 'B', nom: 'Pepa', fil_id: null }];
    await expect(carregaMembres('  pep ', REMOT)).resolves.toEqual([{ usuari_id: 'B', nom: 'Pepa', fil_id: null }]);
    expect(client.rpc).toHaveBeenCalledWith('membres_del_poble', { p_tenant_id: 'poble', p_cerca: 'pep' });
    query.error = { message: 'SDP-XAT-003: no eres membre d’aquest poble.' };
    await expect(carregaMembres(null, REMOT)).rejects.toMatchObject({ code: 'SDP-XAT-003' });
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
  it('serveix les tres converses de la llavor sense tocar Supabase', async () => {
    const fils = await loadFils(SEED);
    expect(mock.getClient).not.toHaveBeenCalled();
    expect(fils).toHaveLength(3);
    expect(fils.map(f => f.tipus).sort()).toEqual(['directe', 'directe', 'grup']);
    expect(fils.reduce((total, f) => total + f.noLlegits, 0)).toBe(5);
    const comissio = fils.find(f => f.id === XAT_SEED_IDS.filComissio);
    expect(comissio).toMatchObject({ titol: 'Comissió de Festes', noLlegits: 3, ultimSeq: 18, llegitFinsSeq: 15, llegitPelsAltresFinsSeq: 18 });
    expect(comissio.altresNoms).toContain('IAIA MarIA');
  });
  it('pagina per seq cap arrere i cap avant', async () => {
    const fil = XAT_SEED_IDS.filComissio;
    const tots = await loadMissatges(fil, SEED);
    expect(tots.map(m => m.seq)).toEqual(Array.from({ length: 18 }, (_, i) => i + 1));
    expect(tots[0]).toMatchObject({ tipus: 'sistema', text: null, metadades: { clau: 'grup_creat' } });
    expect(tots.find(m => m.esIA)).toMatchObject({ autorNom: 'IAIA MarIA' });
    const ultims = await loadMissatges(fil, { ...SEED, limit: 5 });
    expect(ultims.map(m => m.seq)).toEqual([14, 15, 16, 17, 18]);
    const anteriors = await loadMissatges(fil, { ...SEED, abansDeSeq: ultims[0].seq, limit: 5 });
    expect(anteriors.map(m => m.seq)).toEqual([9, 10, 11, 12, 13]);
    const nous = await loadMissatges(fil, { ...SEED, despresDeSeq: 16 });
    expect(nous.map(m => m.seq)).toEqual([17, 18]);
    const esborrat = (await loadMissatges(XAT_SEED_IDS.filPepa, SEED)).find(m => m.esborratAl);
    expect(esborrat).toMatchObject({ seq: 11, text: null });
  });
  it('un missatge enviat dos vegades amb el mateix id es guarda una i marca com a llegit', async () => {
    const fil = XAT_SEED_IDS.filPepa;
    const primer = await enviaMissatge(fil, { id: 'id-client', text: 'Vaig cap allà' }, SEED);
    const segon = await enviaMissatge(fil, { id: 'id-client', text: 'Vaig cap allà' }, SEED);
    expect(primer.seq).toBe(14); expect(segon.seq).toBe(14);
    expect((await loadMissatges(fil, SEED)).filter(m => m.id === 'id-client')).toHaveLength(1);
    expect(await enviaMissatge(fil, 'Sense id', SEED)).toMatchObject({ id: 'uuid-generat', seq: 15, usuariId: 'A' });
    const pepa = (await loadFils(SEED)).find(f => f.id === fil);
    expect(pepa).toMatchObject({ noLlegits: 0, ultimText: 'Sense id', ultimSeq: 15, llegitPelsAltresFinsSeq: 13 });
  });
  it('marcaLlegit no retrocedix i sense marca arriba a l’últim', async () => {
    const fil = XAT_SEED_IDS.filComissio;
    expect(await marcaLlegit(fil, { ...SEED, llegitFinsSeq: 16 })).toEqual({ llegitFinsSeq: 16, rebutFinsSeq: 18 });
    expect(await marcaLlegit(fil, { ...SEED, llegitFinsSeq: 3 })).toEqual({ llegitFinsSeq: 16, rebutFinsSeq: 18 });
    expect(await marcaLlegit(fil, SEED)).toEqual({ llegitFinsSeq: 18, rebutFinsSeq: 18 });
    expect((await loadFils(SEED)).find(f => f.id === fil).noLlegits).toBe(0);
  });
  it('directori i conversa nova, idempotent, i sense canal', async () => {
    const membres = await carregaMembres('pep', SEED);
    expect(membres).toEqual([{ usuari_id: XAT_SEED_IDS.pepa, nom: 'Pepa Ferrer', fil_id: XAT_SEED_IDS.filPepa }]);
    const tots = await carregaMembres(null, SEED);
    expect(tots.map(m => m.nom)).toEqual(['Maria Roig', 'Pepa Ferrer', 'Toni Pastor', 'Vicent Sanchis']);
    const nou = await creaFilDirecte(XAT_SEED_IDS.maria, null, SEED);
    expect(await creaFilDirecte(XAT_SEED_IDS.maria, null, SEED)).toBe(nou);
    expect((await loadFils(SEED)).some(f => f.id === nou && f.altresNoms[0] === 'Maria Roig')).toBe(true);
    await expect(loadMissatges('fil-inexistent', SEED)).rejects.toMatchObject({ code: 'SDP-XAT-005' });
    const callback = vi.fn();
    expect(await subscribeToXat(nou, callback, SEED)).toEqual({ subscription: null, error: null });
    expect(callback).not.toHaveBeenCalled();
  });
  it('sense sessió usa el convidat perquè el xat es veja al navegador', async () => {
    mock.user = null;
    const fils = await loadFils(SEED);
    expect(fils).toHaveLength(3);
    const meu = await enviaMissatge(XAT_SEED_IDS.filVicent, 'Hola des del convidat', SEED);
    expect(meu.usuariId).toBe('convidat-seed');
  });
});
