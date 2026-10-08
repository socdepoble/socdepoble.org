import { beforeEach, describe, expect, it, vi } from 'vitest';
import { enviaMissatge, loadFils, loadMissatges, obriFilDePagina } from './xat.js';
import { reiniciaLocalXat } from '../localXat.js';
import { XAT_SEED_IDS } from '../xatSeed.js';
import { ENTITAT_PILOT_SLUG } from '../identitatsSeed.js';

/* T63.2 i T67 · La capacitat opcional 'xatDePagina' de l'adaptador Supabase,
   amb el client simulat com a xat.test.js (que és d'un altre torn). */
const mock = vi.hoisted(() => ({ getClient: vi.fn(), user: { id: 'A' } }));
/* Mocks parcials: l'última prova munta l'adaptador sencer (index.js), i els
   altres mòduls de la carpeta necessiten la resta d'exports reals. */
vi.mock('./config.js', async (original) => ({ ...(await original()), getClient: mock.getClient }));
vi.mock('../identitat.js', async (original) => ({
  ...(await original()), usuariDeSessio: () => mock.user, getDefaultUserId: () => mock.user?.id || 'convidat-seed'
}));
vi.mock('./runtime.js', async (original) => ({
  ...(await original()),
  getResolvedConfig: (config) => ({ ...config, runtimeDataMode: config.dataMode || 'remote' }),
  generateUUID: () => 'uuid-generat'
}));
vi.mock('./utils.js', async (original) => ({ ...(await original()), handleError: (error) => error }));

const REMOT = { tenantId: '00000000-0000-4000-8000-000000000000' };
const SEED = { dataMode: 'seed', tenantId: '00000000-0000-4000-8000-000000000000' };
const PUBLICACIO = { tipus: 'publicacio', id: 'p-1', titol: 'Festa de la tomaca', ruta: '/mur/p-1' };
const resposta = (data, error = null) => ({ data, error, abortSignal: vi.fn().mockReturnThis() });
let client;

beforeEach(() => {
  vi.clearAllMocks(); mock.user = { id: 'A' }; reiniciaLocalXat();
  client = { rpc: vi.fn().mockReturnValue(resposta([])) };
  mock.getClient.mockResolvedValue(client);
});

/* Una fila de la RPC obri_fil_de_pagina. */
const fila = (id, tipus, extra = {}) => ({
  id, tipus, titol: tipus === 'canal' ? 'Avisos' : tipus === 'grup' ? 'General' : 'Cooperativa', imatge_url: null,
  actualitzat_al: '2026-09-28T10:00:00Z', ultim_seq: 0, comunitat_id: tipus === 'comunitat' ? null : 'c-1', org_id: 'org-1',
  subjecte_tipus: 'entitat', subjecte_id: 'org-1', subjecte_ruta: '/empresa/org-1', subjecte_titol: 'Cooperativa',
  subjecte_uri: null, participant: false, rol: null, desti: false, ...extra
});

describe('obriFilDePagina en remot', () => {
  it('crida obri_fil_de_pagina amb el subjecte net i torna el destí i les converses, sense fer-te participant', async () => {
    client.rpc.mockReturnValueOnce(resposta([fila('c-1', 'comunitat'), fila('a-1', 'canal'), fila('g-1', 'grup', { org_id: null, desti: true })]));
    const signal = new AbortController().signal;
    const obert = await obriFilDePagina({ tipus: 'organitzacio', id: ' org-1 ', titol: 'Cooperativa', ruta: '/empresa/org-1' }, { ...REMOT, signal });
    /* Cap ruta: la deriva el servidor (una ruta del client quedaria fixada per a tot el poble). */
    expect(client.rpc).toHaveBeenCalledWith('obri_fil_de_pagina', {
      p_tenant_id: '00000000-0000-4000-8000-000000000000', p_tipus: 'entitat', p_id: 'org-1', p_titol: 'Cooperativa'
    });
    expect(client.rpc.mock.results[0].value.abortSignal).toHaveBeenCalledWith(signal);
    expect(obert.filId).toBe('g-1');
    expect(obert.fils.map((f) => [f.id, f.tipus, f.comunitatId, f.participant])).toEqual([
      ['c-1', 'comunitat', null, false], ['a-1', 'canal', 'c-1', false], ['g-1', 'grup', 'c-1', false]
    ]);
    expect(obert.fils[2].subjecte).toEqual({ tipus: 'entitat', id: 'org-1', ruta: '/empresa/org-1', titol: 'Cooperativa' });
    expect(obert.fils[0]).toMatchObject({ entitatId: 'org-1' });
  });

  it('un subjecte sense xat torna null sense anar al servidor', async () => {
    for (const objecte of [{ tipus: 'nota', id: 'n' }, { tipus: 'persona', id: 'B' }, { tipus: 'ia', id: 'iaia' },
      { tipus: 'publicacio', id: '' }, { tipus: 'pagina', id: 'Títol', ruta: '' },
      { tipus: 'pagina', id: '/notes/n1', ruta: '/notes/n1', titol: 'Avís oficial' }, { tipus: 'pagina', id: '/a1', ruta: '/a1' }]) {
      expect(await obriFilDePagina(objecte, REMOT)).toBeNull();
    }
    expect(mock.getClient).not.toHaveBeenCalled();
  });

  it('sense la migració (PGRST202 o 404) rebutja amb codi sense-capacitat', async () => {
    client.rpc.mockReturnValueOnce(resposta(null, { code: 'PGRST202', message: 'Could not find the function public.obri_fil_de_pagina' }));
    await expect(obriFilDePagina(PUBLICACIO, REMOT)).rejects.toMatchObject({ codi: 'sense-capacitat', code: 'SENSE_CAPACITAT', retriable: false });
    client.rpc.mockReturnValueOnce(resposta(null, { message: 'Not Found', status: 404 }));
    await expect(obriFilDePagina(PUBLICACIO, REMOT)).rejects.toMatchObject({ codi: 'sense-capacitat' });
    /* Auditoria 261007 (B) · Amb la forma real de postgrest-js, el 404 és a la
       resposta i no a l'error: l'adaptador el copia abans de decidir. */
    client.rpc.mockReturnValueOnce({ ...resposta(null, { message: 'Not Found', code: '', details: null, hint: null }), status: 404 });
    await expect(obriFilDePagina(PUBLICACIO, REMOT)).rejects.toMatchObject({ codi: 'sense-capacitat' });
  });

  it('els errors del servidor conserven el codi SDP i no són sense-capacitat', async () => {
    client.rpc.mockReturnValueOnce(resposta(null, { message: 'SDP-XAT-013: la pàgina no existix o no la pots vore.', code: '42501' }));
    const error = await obriFilDePagina(PUBLICACIO, REMOT).catch((e) => e);
    expect(error).toMatchObject({ code: 'SDP-XAT-013', retriable: false });
    expect(error.codi).toBeUndefined();
    client.rpc.mockReturnValueOnce(resposta([fila('g-1', 'grup')]));
    await expect(obriFilDePagina(PUBLICACIO, REMOT)).rejects.toMatchObject({ code: 'SENSE_CONFIRMACIO' });
  });

  it('sense sessió o sense poble no crida cap RPC', async () => {
    mock.user = null;
    await expect(obriFilDePagina(PUBLICACIO, REMOT)).rejects.toMatchObject({ code: 'SESSIO' });
    mock.user = { id: 'A' };
    await expect(obriFilDePagina(PUBLICACIO, {})).rejects.toMatchObject({ code: 'SENSE_POBLE' });
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it('en mode seed delega a la llavor i no toca Supabase', async () => {
    const obert = await obriFilDePagina({ tipus: 'entitat', id: ENTITAT_PILOT_SLUG }, SEED);
    expect(obert.filId).toBe(XAT_SEED_IDS.filGeneral);
    const grup = await obriFilDePagina(PUBLICACIO, SEED);
    expect(grup.fils[0]).toMatchObject({ tipus: 'grup', participant: true, subjecte: { tipus: 'publicacio', id: 'p-1' } });
    expect(mock.getClient).not.toHaveBeenCalled();
  });
});

describe('fil de pàgina com a visitant', () => {
  it('loadMissatges amb visitant llig per xat_llig_fil_de_pagina, amb els mateixos cursors', async () => {
    client.rpc.mockReturnValue(resposta([{ id: 'm2', usuari_id: 'B', autor_nom: 'Pepa', cos: 'Hola', tipus: 'text', seq: 2, metadades: {}, creat_al: 'x' }]));
    const missatges = await loadMissatges('g-1', { ...REMOT, visitant: true });
    expect(client.rpc).toHaveBeenLastCalledWith('xat_llig_fil_de_pagina', { p_fil_id: 'g-1', p_abans_de_seq: null, p_despres_de_seq: null, p_limit: 50 });
    expect(missatges[0]).toMatchObject({ id: 'm2', filId: 'g-1', seq: 2, autorNom: 'Pepa', text: 'Hola' });
    /* Un missatge signat per l'entitat arriba sense usuari_id: el visitant no sap qui de l'equip l'ha escrit. */
    client.rpc.mockReturnValueOnce(resposta([{ id: 'm3', usuari_id: null, com_org_id: 'org-1', autor_nom: 'Cooperativa', cos: 'Avís', seq: 3, creat_al: 'x' }]));
    const [signat] = await loadMissatges('a-1', { ...REMOT, visitant: true });
    expect(signat).toMatchObject({ usuariId: null, comOrgId: 'org-1', autorNom: 'Cooperativa' });
    await loadMissatges('g-1', { ...REMOT, visitant: true, despresDeSeq: 2 });
    expect(client.rpc).toHaveBeenLastCalledWith('xat_llig_fil_de_pagina', { p_fil_id: 'g-1', p_abans_de_seq: null, p_despres_de_seq: 2, p_limit: 50 });
    /* Sense visitant, el camí de sempre. */
    await loadMissatges('g-1', REMOT);
    expect(client.rpc).toHaveBeenLastCalledWith('xat_historial', { p_fil_id: 'g-1', p_abans_de_seq: null, p_limit: 50 });
  });

  it('enviaMissatge amb visitant hi entra abans del primer missatge; sense visitant, no', async () => {
    client.rpc.mockReturnValueOnce(resposta('g-1')).mockReturnValueOnce(resposta([{ id: 'm-1', seq: 1, creat_al: 'x' }]));
    const desat = await enviaMissatge('g-1', { id: 'm-1', text: 'Hola, veïns' }, { ...REMOT, visitant: true });
    expect(client.rpc.mock.calls.map(([nom, args]) => [nom, args.p_fil_id])).toEqual([
      ['xat_entra_al_fil_de_pagina', 'g-1'], ['xat_envia', 'g-1']
    ]);
    expect(desat).toMatchObject({ id: 'm-1', seq: 1, usuariId: 'A' });
    client.rpc.mockClear();
    client.rpc.mockReturnValueOnce(resposta([{ id: 'm-2', seq: 2, creat_al: 'x' }]));
    await enviaMissatge('g-1', { id: 'm-2', text: 'Segon' }, REMOT);
    expect(client.rpc.mock.calls.map(([nom]) => nom)).toEqual(['xat_envia']);
  });

  it('si l’alta falla, no envia res i l’error conserva el codi del servidor', async () => {
    client.rpc.mockReturnValueOnce(resposta(null, { message: 'SDP-XAT-006: no eres membre actiu del fil.' }));
    await expect(enviaMissatge('g-1', { id: 'm-1', text: 'Hola' }, { ...REMOT, visitant: true })).rejects.toMatchObject({ code: 'SDP-XAT-006' });
    expect(client.rpc.mock.calls.map(([nom]) => nom)).toEqual(['xat_entra_al_fil_de_pagina']);
  });
});

describe('xat_fils_meus amb comunitat i subjecte', () => {
  it('passa comunitatId, subjecte, rol i recompte; els fils sense subjecte queden com abans', async () => {
    client.rpc.mockReturnValueOnce(resposta([
      { id: 'a-1', tipus: 'canal', titol: 'Avisos', comunitat_id: 'c-1', subjecte_tipus: 'poble', subjecte_id: 'la-torre',
        subjecte_ruta: '/pobles/la-torre', subjecte_titol: 'La Torre', subjecte_uri: 'https://node.test/pobles/la-torre',
        rol: 'membre', participants: 41, altres_noms: [], altres: [] },
      { id: 'd-1', tipus: 'directe', altres_noms: ['Pepa'] }
    ]));
    const [avisos, directe] = await loadFils(REMOT);
    expect(avisos).toMatchObject({
      comunitatId: 'c-1', rol: 'membre', participants: 41,
      subjecte: { tipus: 'poble', id: 'la-torre', ruta: '/pobles/la-torre', titol: 'La Torre', uri: 'https://node.test/pobles/la-torre' }
    });
    expect(avisos).not.toHaveProperty('participant');
    expect(directe).toMatchObject({ comunitatId: null, subjecte: null });
    expect(directe).not.toHaveProperty('rol');
    expect(directe).not.toHaveProperty('participants');
  });
});

describe('la capacitat al port', () => {
  it('l’adaptador Supabase sencer declara xatDePagina', async () => {
    const [{ setBackendImplementation, teCapacitat }, supabase] = await Promise.all([import('../backendPort.js'), import('./index.js')]);
    setBackendImplementation({ ...supabase });
    expect(teCapacitat('xatDePagina')).toBe(true);
    expect(typeof supabase.obriFilDePagina).toBe('function');
  });
});
