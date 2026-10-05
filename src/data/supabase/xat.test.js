import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadFils, loadMissatges, marcaLlegit, creaFilDirecte, carregaMembres, enviaMissatge, subscribeToXat, unsubscribeFromXat } from './xat.js';
import { reiniciaLocalXat } from '../localXat.js';
import { AGENTS_MAP } from '../agentsSeed.js';
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
const REMOT = { tenantId: '00000000-0000-4000-8000-000000000000' };
/* W4-10 · A Supabase l'altra part d'un fil directe és un UUID (crea_fil_directe). */
const ALTRE = '00000000-0000-4000-8000-000000000042';
const SEED = { dataMode: 'seed', tenantId: '00000000-0000-4000-8000-000000000000' };
let query, client;
beforeEach(() => {
  vi.clearAllMocks(); mock.user = { id: 'A' }; mock.modePerDefecte = 'remote'; reiniciaLocalXat();
  query = { data: [], error: null, abortSignal: vi.fn().mockReturnThis() };
  client = { rpc: vi.fn().mockReturnValue(query), from: vi.fn().mockReturnValue(query), channel: vi.fn(), removeChannel: vi.fn().mockResolvedValue(null) };
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
    expect(client.rpc).toHaveBeenCalledWith('xat_fils_meus', { p_tenant_id: '00000000-0000-4000-8000-000000000000' });
    expect(fil).toEqual({ id: 'f', tipus: 'grup', titol: 'Comissió', altresNoms: ['Pepa'], imatgeUrl: null, actualitzatAl: 'x', ultimText: 'Hola',
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
    expect(await loadFils(REMOT)).toEqual([expect.objectContaining({ entitatId: 'org-real', entitatNom: 'Sóc de Poble', comEntitat: true,
      altres: [{ id: 'client-real', nom: 'Client', tipus: 'persona', avatarUrl: null }] })]);
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
  const LOGO = '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg';
  const TIPUS_DE_LA_LLAVOR = ['canal', 'comunitat', 'grup', 'grup', 'iaia'];
  const noLlegits = (fils) => fils.reduce((total, f) => total + f.noLlegits, 0);

  it('T63.1 · la llavor només porta identitats reals: cap persona ni conversa inventada', () => {
    expect(XAT_SEED_MEMBRES.map(m => [m.usuariId, m.nom, m.tipus])).toEqual([
      ['0001', 'Javi', 'persona'],
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
    /* La benvinguda de la IAIA, tal com estava. */
    expect(llavor.missatges.filter(m => m.filId === XAT_SEED_IDS.filIaia))
      .toEqual([expect.objectContaining({ usuariId: XAT_SEED_IDS.iaia, esIA: true, text: expect.stringMatching(/^Hola! Sóc la IAIA MarIA/) })]);
  });

  it('T63.1 · la comunitat «Sóc de Poble» naix de la Pàgina Universal de l’entitat i porta Avisos, General i Beta testers', () => {
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
    expect(fil(XAT_SEED_IDS.filBetaTesters)).toMatchObject({
      tipus: 'grup', titol: 'Beta testers', orgId: null, comunitatId: XAT_SEED_IDS.filComunitat, subjecte: SUBJECTE, ultimSeq: 2
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
    const fils = await loadFils(SEED);
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
    const missatges = await loadMissatges(XAT_SEED_IDS.filIaia, SEED);
    expect(missatges.map(m => m.seq)).toEqual([1, 2, 3]);
    expect(missatges[2]).toMatchObject({ usuariId: XAT_SEED_IDS.iaia, autorNom: 'IAIA MarIA', esIA: true });
    expect(missatges[2].text).toMatch(/^Ara estic en proves/);
    await Promise.resolve();
    expect(callback).toHaveBeenCalledWith(null, { tipus: 'nous', filId: XAT_SEED_IDS.filIaia, seq: 3 });
    await unsubscribeFromXat(subscription);
    await enviaMissatge(XAT_SEED_IDS.filIaia, { id: 'segon-a-la-iaia', text: 'Segon' }, SEED);
    await Promise.resolve();
    expect(callback).toHaveBeenCalledTimes(1);
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
  it('directori de tres (Javi, Sóc de Poble i la IAIA) i conversa nova, idempotent, amb canal local', async () => {
    const membres = await carregaMembres('jav', SEED);
    expect(membres).toEqual([{ usuari_id: '0001', nom: 'Javi', tipus: 'persona', avatar_url: null, fil_id: null }]);
    const tots = await carregaMembres(null, SEED);
    expect(tots.map(m => m.nom)).toEqual(['IAIA MarIA', 'Javi', 'Sóc de Poble']);
    expect(tots.find(m => m.nom === 'IAIA MarIA')).toMatchObject({ tipus: 'ia', fil_id: XAT_SEED_IDS.filIaia });
    /* La comunitat no és cap conversa amb l'entitat: el padró no hi apunta. */
    expect(tots.find(m => m.nom === 'Sóc de Poble')).toMatchObject({ tipus: 'entitat', avatar_url: LOGO, fil_id: null });
    const nou = await creaFilDirecte(XAT_SEED_IDS.javi, null, SEED);
    expect(await creaFilDirecte(XAT_SEED_IDS.javi, null, SEED)).toBe(nou);
    expect((await loadFils(SEED)).some(f => f.id === nou && f.tipus === 'directe' && f.altresNoms[0] === 'Javi')).toBe(true);
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
  it('en mode local no hi ha converses de llavor, però el padró és el mateix de tres', async () => {
    const LOCAL = { dataMode: 'local', tenantId: '00000000-0000-4000-8000-000000000000' };
    expect(await loadFils(LOCAL)).toEqual([]);
    expect((await carregaMembres(null, LOCAL)).map(m => m.nom)).toEqual(['IAIA MarIA', 'Javi', 'Sóc de Poble']);
    expect(mock.getClient).not.toHaveBeenCalled();
  });
  it('sense sessió usa el convidat, que també veu la comunitat i hi pot conversar', async () => {
    mock.user = null;
    const fils = await loadFils(SEED);
    expect(fils.map(f => f.tipus).sort()).toEqual(TIPUS_DE_LA_LLAVOR);
    expect(noLlegits(fils)).toBe(2);
    const meu = await enviaMissatge(XAT_SEED_IDS.filGeneral, 'Hola des del convidat', SEED);
    expect(meu.usuariId).toBe('convidat-seed');
  });
});
