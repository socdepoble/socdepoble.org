/* T1 · D01 (assalt 261101) · El comportament de l'adaptador local més enllà
   del kit: cada mètode del contracte que cap cas del kit no prova
   (metodesSenseCas) té ací la seua prova, i una guarda ho vigila. A més, els
   invariants de l'adaptador: aïllament entre instàncies, determinisme de la
   llavor, còpies a l'eixida, senyal, destroy, personalització, mitjans,
   formes del contracte i la frontera (cap entrada de producció l'importa). */
import { webcrypto } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import { CAPACITATS, CONTRACTE_BACKEND, VERSIO_NORMES_CONVIVENCIA } from '../contracte.js';
import { FORMAT_LOT } from '../dadesObertesLot.js';
import { entradaOpenDataDelPoble } from '../entradaOpenDataDelPoble.js';
import { exportaMunicipiOpenData } from '../exportaMunicipiOpenData.js';
import { importaMunicipiOpenData } from '../importaMunicipiOpenData.js';
import { metodesSenseCas } from '../conformitat/kit.js';
import { adoptaSessioExterna, configuraBackendSessio, desaSessio, esborraSessio, usuariDeSessio } from '../identitat.js';
import { esperaLaIAIA, reiniciaLocalXat } from '../localXat.js';
import { APP_SEED } from '../appSeed.js';
import { IAIA_ID } from '../identitatsSeed.js';
import { CAPACITATS_NO_DECLARADES, MODES_ADAPTADOR_LOCAL, creaAdaptadorLocal } from './adaptadorLocal.js';

const PERSONA = '1d2e3f40-5a6b-4c7d-8e9f-a0b1c2d3e4f5';
const VEINA = '2e3f4051-6b7c-4d8e-9fa0-b1c2d3e4f5a6';
const ARA = new Date('2026-11-01T10:00:00.000Z');
const ara = () => new Date(ARA);
const ENTITAT_PILOT = 'socdepoble';
const RENTONAR = 'rentonar';
const SINCRONS = ['getRuntimeDataMode', 'getBackendConfigurat', 'getDefaultUserId', 'getCurrentUser', 'adoptaSessioExterna'];

const xarxa = vi.fn(() => { throw new Error('XARXA_PROHIBIDA'); });
beforeAll(() => { vi.stubGlobal('fetch', xarxa); reiniciaLocalXat(); });
afterEach(() => { esborraSessio({ abast: 'tot' }); });
afterAll(async () => {
  await esperaLaIAIA();
  reiniciaLocalXat();
  vi.unstubAllGlobals();
  expect(xarxa).not.toHaveBeenCalled();
});

function entra(adaptador, id = PERSONA, metadades = {}) {
  configuraBackendSessio(adaptador.configuracio);
  expect(desaSessio({ access_token: 'testimoni-opac-local', user: { id, email: 'proves@poble.invalid', user_metadata: metadades } })).toBe(true);
}
const ix = () => esborraSessio({ abast: 'tot' });
const ambCodi = (code) => expect.objectContaining({ code });
const webp = (bytes = [1, 2, 3]) => new Blob([new Uint8Array(bytes)], { type: 'image/webp' });
/* localXat avisa els canals amb queueMicrotask: una tasca després, tots els avisos pendents ja han eixit. */
const buidaAvisos = () => new Promise((resol) => { setTimeout(resol, 0); });

/* La guarda de cobertura: cada mètode sense cas al kit té almenys una prova ací. */
const COBERTS = new Map();
const cobrix = (metodes, nom, fn) => {
  for (const metode of metodes) COBERTS.set(metode, [...(COBERTS.get(metode) ?? []), nom]);
  test(nom, fn);
};

describe('opcions de la factoria', () => {
  test('mode, tenantId, dades i magatzem invàlids rebutgen en crear, abans de cap magatzem', () => {
    expect(MODES_ADAPTADOR_LOCAL).toEqual(['seed', 'local']);
    expect(() => creaAdaptadorLocal({ mode: 'remote' })).toThrow(TypeError);
    expect(() => creaAdaptadorLocal({ tenantId: 'poble' })).toThrow(TypeError);
    expect(() => creaAdaptadorLocal({ dades: { usuaris: [] } })).toThrow(TypeError);
    expect(() => creaAdaptadorLocal({ dades: { feedPosts: {} } })).toThrow(TypeError);
    expect(() => creaAdaptadorLocal({ magatzemNotes: {} })).toThrow(TypeError);
    expect(() => creaAdaptadorLocal({ mode: 'local', dades: { actesAgenda: [{ id: 'a' }] } })).toThrow(TypeError);
  });

  test('configuracio és la del node local, congelada, amb el tenant en minúscules', () => {
    const a = creaAdaptadorLocal({ tenantId: '7A1B2C3D-4E5F-4A60-8B71-C2D3E4F5A6B7', mode: 'local' });
    expect(a.configuracio).toEqual({ backendId: 'sdp-local', tenantId: '7a1b2c3d-4e5f-4a60-8b71-c2d3e4f5a6b7', dataMode: 'local' });
    expect(Object.isFrozen(a.configuracio)).toBe(true);
    expect(Object.isFrozen(a)).toBe(true);
    expect(a.getRuntimeDataMode({ dataMode: 'remote' })).toBe('local');
    expect(a.getBackendConfigurat({ supabaseUrl: 'https://altre.invalid' })).toBe(false);
  });

  test('les capacitats no declarades són exactament les que el contracte té i este node deixa a posta', () => {
    const a = creaAdaptadorLocal();
    const absents = Object.keys(CAPACITATS).filter((cap) => CAPACITATS[cap].every((m) => typeof a[m] !== 'function'));
    expect(Object.keys(CAPACITATS)).toHaveLength(45);
    expect(CAPACITATS_NO_DECLARADES).toEqual(['importacioPaquetMunicipal','verificacioCorreu','recuperacioCorreu']);
    expect(absents).toEqual(CAPACITATS_NO_DECLARADES);
    const deContracte = CONTRACTE_BACKEND.filter((m) => !absents.some((cap) => CAPACITATS[cap].includes(m)));
    expect(deContracte.filter((m) => typeof a[m] !== 'function')).toEqual([]);
  });
});

describe('entrada, sessió i eixida', () => {
  cobrix(['loginWithMagicLink', 'registerWithPassword', 'loginWithPassword', 'loginWithGoogle', 'recullTornadaOAuth',
    'updateUserPassword', 'definixContrasenyaNova', 'createOrganization'],
  'l’entrada real i l’alta d’organitzacions rebutgen amb mode-local sense tocar la sessió', async () => {
    const a = creaAdaptadorLocal();
    entra(a);
    const crides = [
      () => a.loginWithMagicLink('veina@poble.invalid', {}), () => a.registerWithPassword('veina@poble.invalid', 'contrasenya-llarga', {}, {}),
      () => a.loginWithPassword('veina@poble.invalid', 'contrasenya-llarga', {}), () => a.loginWithGoogle({}),
      () => a.recullTornadaOAuth({}), () => a.updateUserPassword('contrasenya-nova-llarga', {}),
      () => a.definixContrasenyaNova('contrasenya-nova-llarga', {}), () => a.createOrganization({ name: 'Forn', kind: 'company', town_name: 'Poble' }, {})
    ];
    for (const crida of crides) await expect(crida()).rejects.toEqual(ambCodi('mode-local'));
    expect(usuariDeSessio()?.id).toBe(PERSONA);
  });

  cobrix(['logout'], 'logout buida la sessió, avisa amb sdp:auth-change i tanca els canals del Xat; scope others no la toca', async () => {
    const a = creaAdaptadorLocal({ mode: 'local' });
    entra(a);
    const filId = await a.creaFilDirecte('0001', null, {});
    const avisos = vi.fn();
    await a.subscribeToXat(filId, avisos, {});
    await a.logout({}, { scope: 'others' });
    expect(a.getCurrentUser()?.id).toBe(PERSONA);
    const escolta = vi.fn();
    window.addEventListener('sdp:auth-change', escolta);
    try {
      await a.logout({});
    } finally { window.removeEventListener('sdp:auth-change', escolta); }
    expect(a.getCurrentUser()).toBeNull();
    expect(escolta.mock.calls.at(-1)[0].detail).toEqual({ user: null });
    entra(a);
    await a.enviaMissatge(filId, { id: 'despres-d-eixir', text: 'Ja no hi ha canal' }, {});
    await buidaAvisos();
    expect(avisos).not.toHaveBeenCalled();
  });

  cobrix(['adoptaSessioExterna', 'refrescaSessio'], 'adoptaSessioExterna és la d’identitat.js i refrescaSessio no renova res', async () => {
    const a = creaAdaptadorLocal();
    expect(a.adoptaSessioExterna).toBe(adoptaSessioExterna);
    expect(await a.refrescaSessio({})).toBe(false);
  });

  cobrix(['updateProfile'], 'updateProfile desa la fitxa, porta els camps de la sessió a l’usuari i valida l’identificador', async () => {
    const a = creaAdaptadorLocal();
    await expect(a.updateProfile({ bio: 'Sense sessió' }, {})).rejects.toThrow('Cal iniciar sessió per a desar la fitxa.');
    entra(a);
    const fila = await a.updateProfile({ bio: 'Bio nova', full_name: 'Veïna de proves', icon: '🌾 i text' }, {});
    expect(fila).toMatchObject({ id: PERSONA, bio: 'Bio nova', full_name: 'Veïna de proves' });
    expect((await a.getProfile({})).bio).toBe('Bio nova');
    expect(a.getCurrentUser().user_metadata.full_name).toBe('Veïna de proves');
    await expect(a.updateProfile({ username: 'a' }, {})).rejects.toEqual(ambCodi('SDP-USER-001'));
    const ambUsuari = await a.updateProfile({ username: 'veina-de-proves', lema: 'Lema nou' }, {});
    expect(ambUsuari).toMatchObject({ username: 'veina-de-proves', lema: 'Lema nou' });
  });
});

describe('Xat', () => {
  cobrix(['creaFilDirecte'], 'creaFilDirecte és idempotent, rebutja tu mateix i una persona forastera', async () => {
    const a = creaAdaptadorLocal({ mode: 'local' });
    entra(a);
    const filId = await a.creaFilDirecte('0001', null, {});
    expect(await a.creaFilDirecte('0001', null, {})).toBe(filId);
    await expect(a.creaFilDirecte(PERSONA, null, {})).rejects.toThrow('No pots obrir una conversa amb tu mateix.');
    await expect(a.creaFilDirecte('persona-de-fora', null, {})).rejects.toEqual(ambCodi('SDP-XAT-004'));
  });

  cobrix(['appendChatMessages'], 'appendChatMessages envia en ordre, amb seq ascendent, i reenviar la llista no duplica', async () => {
    const a = creaAdaptadorLocal({ mode: 'local' });
    entra(a);
    const filId = await a.creaFilDirecte('0001', null, {});
    const llista = [{ filId, id: 'conformitat-1', text: 'Primer' }, { threadId: filId, id: 'conformitat-2', text: 'Segon' }];
    const enviats = await a.appendChatMessages(llista, {});
    expect(enviats.map((m) => m.text)).toEqual(['Primer', 'Segon']);
    expect(enviats[1].seq).toBeGreaterThan(enviats[0].seq);
    expect((await a.appendChatMessages(llista, {})).map((m) => m.seq)).toEqual(enviats.map((m) => m.seq));
    expect((await a.loadMissatges(filId, {})).map((m) => m.id)).toEqual(['conformitat-1', 'conformitat-2']);
    expect(await a.appendChatMessages(null, {})).toEqual([]);
  });

  cobrix([...CAPACITATS.clausXat, ...CAPACITATS.xatMultimediaXifrat], 'el transport E2EE rebutja sempre amb sense-capacitat-e2ee: cap clau ni cap sobre inventats', async () => {
    const a = creaAdaptadorLocal();
    entra(a);
    for (const metode of [...CAPACITATS.clausXat, ...CAPACITATS.xatMultimediaXifrat]) {
      await expect(a[metode]({}, {}), metode).rejects.toMatchObject({ code: 'sense-capacitat', codi: 'sense-capacitat-e2ee' });
    }
  });

  test('marcaLlegit normalitza el cursor abans del magatzem: la lectura porta el rebut fins on llig, i un rebut sol no marca cap lectura', async () => {
    const a = creaAdaptadorLocal({ mode: 'local' });
    entra(a);
    /* Un fil amb un missatge de l'altra part (la resposta de la IAIA): la
       lectura de qui mira comença darrere de l'últim seq. */
    const filId = await a.creaFilDirecte(IAIA_ID, null, {});
    await a.enviaMissatge(filId, { id: 'rebut-1', text: 'Hola' }, {});
    await esperaLaIAIA();
    expect((await a.loadMissatges(filId, {})).map((m) => m.seq)).toEqual([1, 2]);
    await expect(a.marcaLlegit(filId, { llegitFinsSeq: -1 })).rejects.toEqual(ambCodi('CURSOR_INVALID'));
    await expect(a.marcaLlegit(filId, { rebutFinsSeq: 1.5 })).rejects.toEqual(ambCodi('CURSOR_INVALID'));
    /* Com supabase/xat.js: el rebut segueix la lectura (1), no salta a l'últim (2). */
    expect(await a.marcaLlegit(filId, { llegitFinsSeq: 1 })).toEqual({ llegitFinsSeq: 1, rebutFinsSeq: 1 });
    expect(await a.marcaLlegit(filId, { rebutFinsSeq: 2 })).toEqual({ llegitFinsSeq: 1, rebutFinsSeq: 2 });
    expect(await a.marcaLlegit(filId, {})).toEqual({ llegitFinsSeq: 2, rebutFinsSeq: 2 });
  });
});

describe('contingut i publicacions', () => {
  cobrix(['appendSectionSubmissionNetworkOnly'], 'appendSectionSubmissionNetworkOnly desa al node: sessió, secció, upsert per id i qui signa', async () => {
    const a = creaAdaptadorLocal({ mode: 'local', ara });
    const publicacio = { id: '5a6b7c8d-9e0f-4a1b-8c2d-3e4f5a6b7c8d', sectionId: 'mur', title: 'Fira de la tardor',
      payload: { title: 'Fira de la tardor', description: 'Dissabte a la plaça' } };
    await expect(a.appendSectionSubmissionNetworkOnly(publicacio, {})).rejects.toThrow('Cal iniciar sessió per publicar.');
    entra(a);
    await expect(a.appendSectionSubmissionNetworkOnly({ ...publicacio, sectionId: 'tenda' }, {})).rejects.toThrow('Secció no suportada per a connectar.');
    await expect(a.appendSectionSubmissionNetworkOnly({ ...publicacio, actor: { tipus: 'entitat' } }, {})).rejects.toThrow('Falta l’entitat que signa la publicació.');
    await expect(a.appendSectionSubmissionNetworkOnly({ ...publicacio, actor: { tipus: 'entitat', id: RENTONAR } }, {})).rejects.toMatchObject({ status: 403 });
    const desada = await a.appendSectionSubmissionNetworkOnly(publicacio, {});
    expect(desada).toMatchObject({ id: publicacio.id, ownerUserId: PERSONA, authorOrgId: null, sectionId: 'mur', title: 'Fira de la tardor' });
    await a.appendSectionSubmissionNetworkOnly({ ...publicacio, title: 'Fira de la tardor (canvi d’hora)', actor: { tipus: 'entitat', id: ENTITAT_PILOT } }, {});
    const { feedPosts, events, marketItems } = await a.loadMur(PERSONA, {});
    expect(feedPosts.filter((p) => p.id === publicacio.id)).toEqual([expect.objectContaining({ ownerUserId: PERSONA, author_org_id: ENTITAT_PILOT })]);
    expect([...events, ...marketItems]).toEqual([]);
    entra(a, VEINA);
    await expect(a.appendSectionSubmissionNetworkOnly(publicacio, {})).rejects.toMatchObject({ status: 403 });
  });

  cobrix(['loadActesAgenda'], 'loadActesAgenda: buida en seed; en local, els actes que toquen el rang; un rang invàlid és un TypeError', async () => {
    expect(await creaAdaptadorLocal().loadActesAgenda({ desde: new Date(2026, 10, 1), fins: new Date(2026, 11, 1) }, {})).toEqual([]);
    const actesAgenda = [
      { id: 'aplec', titol: 'Aplec', inici: '2026-11-05T10:00:00.000Z', fi: '2026-11-05T12:00:00.000Z' },
      { id: 'fira', titol: 'Fira', inici: '2026-12-08' },
      { id: 'cami', titol: 'Camí de ronda', inici: '2026-10-30T09:00:00.000Z', fi: '2026-11-02T18:00:00.000Z' }
    ];
    const a = creaAdaptadorLocal({ mode: 'local', dades: { actesAgenda } });
    const novembre = await a.loadActesAgenda({ desde: new Date(2026, 10, 1), fins: new Date(2026, 11, 1) }, {});
    expect(novembre.map((acte) => acte.id)).toEqual(['aplec', 'cami']);
    expect((await a.loadActesAgenda({ desde: '2026-12-01', fins: '2027-01-01' }, {})).map((acte) => acte.id)).toEqual(['fira']);
    await expect(a.loadActesAgenda({ desde: 'demà', fins: '2026-12-01' }, {})).rejects.toThrow(TypeError);
    await expect(a.loadActesAgenda({ desde: '2026-12-01', fins: '2026-11-01' }, {})).rejects.toThrow('Rang de l’agenda invàlid.');
    novembre[0].titol = 'Alterat';
    expect((await a.loadActesAgenda({ desde: '2026-11-01', fins: '2026-12-01' }, {}))[0].titol).toBe('Aplec');
  });

  test('loadSeccioPage: sense cap pàgina més, i un cursor que no ha emés este node no val', async () => {
    const a = creaAdaptadorLocal();
    expect(await a.loadSeccioPage({ seccio: 'mercat', cursor: null }, {})).toEqual({ elements: [], complete: true, nextCursor: null });
    await expect(a.loadSeccioPage({ seccio: 'mur', cursor: '["x"]' }, {})).rejects.toThrow('Cursor de la secció invàlid per a este àmbit.');
    await expect(a.loadSeccioPage({ seccio: 'mur', limit: 51 }, {})).rejects.toThrow('Límit de la secció invàlid.');
  });
});

describe('organitzacions, agents i reclamacions', () => {
  cobrix(['updateOrganization'], 'updateOrganization només desa a qui l’administra (403 si no) i rebutja un canvi buit', async () => {
    const a = creaAdaptadorLocal();
    await expect(a.updateOrganization(ENTITAT_PILOT, { lema: 'Sense sessió' }, {})).rejects.toMatchObject({ status: 403 });
    entra(a);
    await expect(a.updateOrganization(ENTITAT_PILOT, { inventat: 1 }, {})).rejects.toThrow('Cap camp de l’organització per desar.');
    await expect(a.updateOrganization(RENTONAR, { lema: 'No és meua' }, {})).rejects.toMatchObject({ status: 403 });
    expect(await a.updateOrganization(ENTITAT_PILOT, { lema: 'Lema del Mas' }, {})).toMatchObject({ id: ENTITAT_PILOT, lema: 'Lema del Mas' });
    expect((await a.loadPerfilPublic(ENTITAT_PILOT, {})).lema).toBe('Lema del Mas');
  });

  cobrix(['updateAgent'], 'updateAgent només desa l’agent que administres (403 si no)', async () => {
    const a = creaAdaptadorLocal();
    await expect(a.updateAgent(IAIA_ID, { lema: 'Sense sessió' }, {})).rejects.toMatchObject({ status: 403 });
    entra(a);
    await expect(a.updateAgent('agent-de-ningu', { lema: 'x' }, {})).rejects.toMatchObject({ status: 403 });
    expect(await a.updateAgent(IAIA_ID, { lema: 'La iaia del Mas' }, {})).toMatchObject({ id: IAIA_ID, lema: 'La iaia del Mas' });
  });

  cobrix(['reclamaOrganitzacio'], 'reclamaOrganitzacio: SDP-CLAIM-000 sense sessió; amb sessió, l’administres a l’instant', async () => {
    const a = creaAdaptadorLocal();
    await expect(a.reclamaOrganitzacio(RENTONAR, { justificacio: 'Hi treballe' }, {})).rejects.toEqual(ambCodi('SDP-CLAIM-000'));
    entra(a);
    expect(await a.reclamaOrganitzacio(RENTONAR, { justificacio: 'Hi treballe' }, {})).toMatchObject({ organitzacioId: RENTONAR, estat: 'aprovada', role: 'admin' });
    expect((await a.listMyOrganizations({})).map((org) => org.id)).toContain(RENTONAR);
    expect(await a.lesMevesReclamacions({})).toEqual([]);
    await expect(a.reclamaOrganitzacio('no-existix', null, {})).rejects.toEqual(ambCodi('SDP-CLAIM-001'));
  });
});

describe('compte i consentiment', () => {
  cobrix(['estatBaixa', 'demanaBaixa', 'cancelaBaixa'], 'la baixa: quarantena de 30 dies, tanca la sessió i es pot cancel·lar', async () => {
    const a = creaAdaptadorLocal({ ara });
    await expect(a.estatBaixa({})).rejects.toThrow('Cal iniciar sessió.');
    entra(a);
    expect(await a.estatBaixa({})).toEqual({ demanada: false, demanadaAl: null, purgaPrevistaAl: null });
    const baixa = await a.demanaBaixa({ motiu: 'Me’n vaig' }, {});
    expect(baixa).toEqual({ demanada: true, demanadaAl: '2026-11-01T10:00:00.000Z', purgaPrevistaAl: '2026-12-01T10:00:00.000Z' });
    expect(a.getCurrentUser()).toBeNull();
    entra(a);
    expect(await a.estatBaixa({})).toEqual(baixa);
    expect(await a.cancelaBaixa({})).toEqual({ demanada: false, demanadaAl: null, purgaPrevistaAl: null });
    expect((await a.estatBaixa({})).demanada).toBe(false);
  });

  cobrix(['exportaLesMeuesDades'], 'exportaLesMeuesDades: el format v1 amb les dades pròpies (també la paperera) i res d’una altra persona', async () => {
    const a = creaAdaptadorLocal({ mode: 'local', ara });
    await expect(a.exportaLesMeuesDades({})).rejects.toThrow('Cal iniciar sessió.');
    entra(a, VEINA);
    await a.createNote({ title: 'Nota de la veïna' }, {});
    entra(a);
    const nota = await a.createNote({ title: 'Nota pròpia' }, {});
    await a.mouNota(nota.id, 'paperera', 0, {});
    await a.bloquejaAutor({ tipus: 'entitat', id: RENTONAR, nom: 'Rentonar' }, {});
    await a.registraConsentiment('rgpd_acepta', '2026-10', {});
    const dades = await a.exportaLesMeuesDades({});
    expect(dades).toMatchObject({ format: 'socdepoble.exportacio.v1', node: 'local', generatAl: '2026-11-01T10:00:00.000Z' });
    expect(dades.perfil.id).toBe(PERSONA);
    expect(dades.notes.map((n) => [n.title, n.estat])).toEqual([['Nota pròpia', 'paperera']]);
    expect(dades.bloquejos).toEqual([{ tipus: 'entitat', id: RENTONAR, nom: 'Rentonar', creatAl: '2026-11-01T10:00:00.000Z' }]);
    expect(dades.consentiments).toEqual([{ tipus: 'rgpd_acepta', accio: 'accepta', versio: '2026-10', al: '2026-11-01T10:00:00.000Z' }]);
    expect(JSON.stringify(dades)).not.toContain('Nota de la veïna');
    expect(JSON.stringify(dades)).not.toContain(VEINA);
  });

  cobrix(['estatConsentiment', 'registraConsentiment', 'revocaConsentiment'], 'el consentiment: forma del contracte, registrar, revocar afig un acte i no n’esborra cap', async () => {
    const politica = { versio: '2026-10', url: 'https://socdepoble.org/legal', textSha256: 'a'.repeat(64) };
    const a = creaAdaptadorLocal({ politica, ara });
    await expect(a.estatConsentiment({})).rejects.toThrow('Cal iniciar sessió.');
    entra(a);
    expect(await a.estatConsentiment({})).toEqual({ versioVigent: '2026-10', url: politica.url, textSha256: politica.textSha256, consentiments: [], calReconsentir: true });
    await expect(a.registraConsentiment('inventat', '2026-10', {})).rejects.toThrow(TypeError);
    await a.registraConsentiment('rgpd_acepta', '2026-10', {});
    expect((await a.estatConsentiment({})).calReconsentir).toBe(false);
    await expect(a.revocaConsentiment('  ', {})).rejects.toThrow('Cal indicar quin consentiment es revoca.');
    await a.revocaConsentiment('rgpd_acepta', {});
    const estat = await a.estatConsentiment({});
    expect(estat.calReconsentir).toBe(true);
    expect(estat.consentiments).toEqual([{ tipus: 'rgpd_acepta', accio: 'revoca', versio: null, al: '2026-11-01T10:00:00.000Z' }]);
    expect((await a.exportaLesMeuesDades({})).consentiments.map((c) => c.accio)).toEqual(['accepta', 'revoca']);
  });
});

describe('invariants de l’adaptador', () => {
  test('dues instàncies no compartixen notes, Xat, moderació ni publicacions', async () => {
    const a = creaAdaptadorLocal({ mode: 'local' });
    const b = creaAdaptadorLocal({ mode: 'local' });
    entra(a);
    const nota = await a.createNote({ title: 'Només d’A' }, {});
    await a.bloquejaAutor({ tipus: 'entitat', id: RENTONAR }, {});
    await a.appendSectionSubmissionNetworkOnly({ id: 'publicacio-d-a', sectionId: 'mur', title: 'D’A' }, {});
    const filA = await a.creaFilDirecte('0001', null, {});
    await a.enviaMissatge(filA, { id: 'missatge-d-a', text: 'Hola des d’A' }, {});
    entra(b);
    expect((await b.loadNotes(PERSONA, {})).notes.map((n) => n.id)).not.toContain(nota.id);
    expect(await b.llistaBloquejos({})).toEqual([]);
    expect((await b.loadMur(PERSONA, {})).feedPosts).toEqual([]);
    expect((await b.loadFils({})).map((fil) => fil.id)).not.toContain(filA);
    await expect(b.loadMissatges(filA, {})).rejects.toEqual(ambCodi('SDP-XAT-005'));
  });

  test('determinisme: el mateix rellotge i les mateixes dades donen les mateixes lectures', async () => {
    const dades = { feedPosts: [{ id: 'p1', title: 'Un' }], towns: [{ id: 't1', name: 'Poble' }] };
    const [a, b] = [creaAdaptadorLocal({ mode: 'local', dades, ara }), creaAdaptadorLocal({ mode: 'local', dades, ara })];
    expect(await a.loadMur('x', {})).toEqual(await b.loadMur('x', {}));
    expect(await a.loadCoreContent('x', {})).toEqual(await b.loadCoreContent('x', {}));
    const [s1, s2] = [creaAdaptadorLocal({ ara }), creaAdaptadorLocal({ ara })];
    expect(await s1.loadMur('x', {})).toEqual(await s2.loadMur('x', {}));
    expect(await s1.listPublicOrganizations({}, {})).toEqual(await s2.listPublicOrganizations({}, {}));
  });

  test('còpies a l’eixida: mutar un resultat no canvia ni la lectura següent ni la llavor', async () => {
    const a = creaAdaptadorLocal();
    const mur = await a.loadMur('x', {});
    /* La primera llista de la llavor que porta elements (el Mur pot nàixer buit). */
    const clau = ['feedPosts', 'marketItems', 'events'].find((nom) => mur[nom].length);
    expect(clau).toBeDefined();
    const llavor = JSON.stringify(APP_SEED[clau]);
    const primera = JSON.stringify(mur[clau][0]);
    mur[clau][0].alterada = true;
    mur[clau].length = 0;
    expect(JSON.stringify((await a.loadMur('x', {}))[clau][0])).toBe(primera);
    expect(JSON.stringify(APP_SEED[clau])).toBe(llavor);
    entra(a);
    /* Una nota de la llavor amb etiquetes: localNotes en fa una còpia plana
       ({...n}), i sense la còpia de l'adaptador l'array seria el d'APP_SEED. */
    const llavorNotes = JSON.stringify(APP_SEED.notes);
    const nota = (await a.loadNotes(PERSONA, {})).notes.find((n) => Array.isArray(n.labels) && n.labels.length);
    expect(nota).toBeDefined();
    nota.labels.push('alterada');
    nota.title = 'alterada';
    const relectura = (await a.loadNotes(PERSONA, {})).notes.find((n) => n.id === nota.id);
    expect(relectura.labels).not.toContain('alterada');
    expect(relectura.title).not.toBe('alterada');
    expect(JSON.stringify(APP_SEED.notes)).toBe(llavorNotes);
    const dades = { towns: [{ id: 't1', name: 'Poble' }] };
    const b = creaAdaptadorLocal({ mode: 'local', dades });
    dades.towns[0].name = 'Canviat per qui crida';
    expect((await b.loadCoreContent('x', {})).towns[0].name).toBe('Poble');
  });

  test('un senyal avortat rebutja amb AbortError: abans no escriu res, i després no deixa eixir el resultat', async () => {
    const a = creaAdaptadorLocal({ mode: 'local' });
    entra(a);
    const ac = new AbortController();
    ac.abort();
    await expect(a.createNote({ title: 'Avortada' }, { signal: ac.signal })).rejects.toMatchObject({ name: 'AbortError' });
    await expect(a.loadNotesPage({ ownerUserId: PERSONA, signal: ac.signal }, {})).rejects.toMatchObject({ name: 'AbortError' });
    expect((await a.loadNotes(PERSONA, {})).notes).toEqual([]);
    const tard = new AbortController();
    const lectura = a.loadMur(PERSONA, { signal: tard.signal });
    tard.abort();
    await expect(lectura).rejects.toMatchObject({ name: 'AbortError' });
  });

  test('un senyal avortat en el mateix tic de la crida no escriu: ni la nota ni l’alta del canal', async () => {
    const a = creaAdaptadorLocal({ mode: 'local' });
    entra(a);
    const ac = new AbortController();
    const escriptura = a.createNote({ title: 'Mateix tic' }, { signal: ac.signal });
    ac.abort();
    await expect(escriptura).rejects.toMatchObject({ name: 'AbortError' });
    expect((await a.loadNotes(PERSONA, {})).notes.map((n) => n.title)).not.toContain('Mateix tic');
    const filId = await a.creaFilDirecte('0001', null, {});
    const avisos = vi.fn();
    const canal = new AbortController();
    const alta = a.subscribeToXat(filId, avisos, { signal: canal.signal });
    canal.abort();
    await expect(alta).rejects.toMatchObject({ name: 'AbortError' });
    await a.enviaMissatge(filId, { id: 'mateix-tic', text: 'Hola' }, {});
    await buidaAvisos();
    expect(avisos).not.toHaveBeenCalled();
  });

  test('una alta del Xat avortada mentre es fa es desfà: AbortError i cap avís', async () => {
    const a = creaAdaptadorLocal({ mode: 'local' });
    entra(a);
    const filId = await a.creaFilDirecte('0001', null, {});
    const avisos = vi.fn();
    const canal = new AbortController();
    const alta = a.subscribeToXat(filId, avisos, { signal: canal.signal });
    /* La guarda ja ha comprovat el senyal i l'alta ja és feta quan s'avorta. */
    queueMicrotask(() => canal.abort());
    await expect(alta).rejects.toMatchObject({ name: 'AbortError' });
    await a.enviaMissatge(filId, { id: 'alta-avortada', text: 'Hola' }, {});
    await buidaAvisos();
    expect(avisos).not.toHaveBeenCalled();
    /* Una alta sense senyal sí que rep l'avís: la prova mossega. */
    const vius = vi.fn();
    await a.subscribeToXat(filId, vius, {});
    await a.enviaMissatge(filId, { id: 'alta-viva', text: 'Hola' }, {});
    await buidaAvisos();
    expect(vius).toHaveBeenCalled();
  });

  test('una alta del Xat que acaba amb l’adaptador ja tancat es desfà', async () => {
    const a = creaAdaptadorLocal({ mode: 'local' });
    entra(a);
    const filId = await a.creaFilDirecte('0001', null, {});
    const avisos = vi.fn();
    const alta = a.subscribeToXat(filId, avisos, {});
    queueMicrotask(() => { a.destroy(); });
    await expect(alta).rejects.toThrow('[adaptadorLocal] Adaptador tancat.');
    const b = creaAdaptadorLocal({ mode: 'local', tenantId: a.configuracio.tenantId });
    await b.enviaMissatge(filId, { id: 'alta-tancada', text: 'Hola' }, {});
    await buidaAvisos();
    expect(avisos).not.toHaveBeenCalled();
  });

  test('destroy: cap crida asíncrona més, els canals tancats i les síncrones encara responen', async () => {
    const a = creaAdaptadorLocal({ mode: 'local' });
    entra(a);
    const filId = await a.creaFilDirecte('0001', null, {});
    const avisos = vi.fn();
    await a.subscribeToXat(filId, avisos, {});
    await a.destroy();
    for (const metode of CONTRACTE_BACKEND.filter((m) => typeof a[m] === 'function' && !SINCRONS.includes(m))) {
      await expect(a[metode]({}, {}), metode).rejects.toThrow('[adaptadorLocal] Adaptador tancat.');
    }
    expect(a.getRuntimeDataMode()).toBe('local');
    const b = creaAdaptadorLocal({ mode: 'local', tenantId: a.configuracio.tenantId });
    await b.enviaMissatge(filId, { id: 'despres-de-destroy', text: 'Hola' }, {});
    await buidaAvisos();
    expect(avisos).not.toHaveBeenCalled();
  });

  test('loadNotes: el detall d’una nota absent és not-found, i les notes d’un altre propietari no hi són', async () => {
    const a = creaAdaptadorLocal();
    entra(a);
    expect(await a.loadNotes(PERSONA, { noteId: 'no-hi-es' })).toMatchObject({ notes: [], noteResolution: { id: 'no-hi-es', status: 'not-found' } });
    const nota = await a.createNote({ title: 'Privada' }, {});
    expect((await a.loadNotes(PERSONA, { noteId: nota.id })).noteResolution.status).toBe('found');
    ix();
    expect((await a.loadNotes(PERSONA, {})).notes).toEqual([]);
    expect((await a.loadNotes(PERSONA, { noteId: nota.id })).noteResolution.status).toBe('not-found');
  });

  test('dues edicions amb la mateixa revisió: una entra i l’altra rebutja amb 409', async () => {
    const a = creaAdaptadorLocal({ mode: 'local' });
    entra(a);
    const nota = await a.createNote({ title: 'Original' }, {});
    const resultats = await Promise.allSettled([a.updateNote(nota.id, { title: 'U' }, 0, {}), a.updateNote(nota.id, { title: 'Dos' }, 0, {})]);
    expect(resultats.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(resultats.find((r) => r.status === 'rejected').reason.status).toBe(409);
  });

  test('les notes a IndexedDB, sense IndexedDB (jsdom), rebutgen amb el text de localNotes', async () => {
    const a = creaAdaptadorLocal({ mode: 'local', persistenciaNotes: 'indexeddb' });
    entra(a);
    await expect(a.createNote({ title: 'x' }, {})).rejects.toThrow('El navegador no permet desar notes locals.');
  });
});

describe('personalització del poble', () => {
  test('estricta per defecte: sense sessió, sense-sessio; amb sessió, cal-segon-factor', async () => {
    const a = creaAdaptadorLocal();
    const desa = () => a.adminDesaPersonalitzacio({ clau: 'taxonomia', payload: { categories: [] }, versio: null }, {});
    await expect(desa()).rejects.toEqual(ambCodi('sense-sessio'));
    entra(a);
    await expect(desa()).rejects.toEqual(ambCodi('cal-segon-factor'));
    await expect(a.adminHistorialPersonalitzacio('taxonomia', {})).rejects.toEqual(ambCodi('cal-segon-factor'));
    await expect(a.adminHistorialPersonalitzacio('colors', {})).rejects.toEqual(ambCodi('clau-invalida'));
  });

  test('oberta: versions, lectura per loadCoreContent, conflicte-versio i historial del més nou al més vell', async () => {
    const a = creaAdaptadorLocal({ personalitzacioOberta: true, ara });
    entra(a);
    expect(await a.adminDesaPersonalitzacio({ clau: 'taxonomia', payload: { categories: ['fira'] }, versio: null }, {})).toEqual({ clau: 'taxonomia', payload: { categories: ['fira'] }, versio: 1 });
    expect((await a.loadCoreContent(PERSONA, {})).personalitzacio).toEqual({ taxonomia: { payload: { categories: ['fira'] }, versio: 1 }, estil: null });
    await expect(a.adminDesaPersonalitzacio({ clau: 'taxonomia', payload: { categories: [] }, versio: 0 }, {})).rejects.toEqual(ambCodi('conflicte-versio'));
    await expect(a.adminDesaPersonalitzacio({ clau: 'taxonomia', payload: ['no', 'objecte'], versio: 1 }, {})).rejects.toEqual(ambCodi('desconegut'));
    await a.adminDesaPersonalitzacio({ clau: 'taxonomia', payload: { categories: ['fira', 'mercat'] }, versio: 1 }, {});
    expect((await a.adminHistorialPersonalitzacio('taxonomia', {})).map((r) => [r.versio, r.autor])).toEqual([[2, PERSONA], [1, PERSONA]]);
  });
});

describe('mitjans', () => {
  test('pujada, resolució a data:, URL pública, privadesa del bucket privat i promoció idempotent', async () => {
    const a = creaAdaptadorLocal({ nouId: () => '4b5c6d7e-8f90-4a1b-8c2d-3e4f5a6b7c8d' });
    await expect(a.uploadToStorage(webp(), { carpeta: 'avatars' }, {})).rejects.toThrow('Cal iniciar sessió');
    entra(a);
    const poble = a.configuracio.tenantId;
    const { url, ruta } = await a.uploadToStorage(webp([104, 111, 108, 97]), { carpeta: 'avatars' }, {});
    expect(url).toBe(`sdp-media://mitjans/${poble}/${PERSONA}/avatars/4b5c6d7e-8f90-4a1b-8c2d-3e4f5a6b7c8d.webp`);
    expect(await a.resolveAsset(url, {})).toBe('data:image/webp;base64,aG9sYQ==');
    expect(await a.getPublicUrl('mitjans', ruta, {})).toBe('data:image/webp;base64,aG9sYQ==');
    await expect(a.getPublicUrl('', '', {})).rejects.toThrow(TypeError);
    await expect(a.getPublicUrl('mitjans', '../fora', {})).rejects.toThrow('Bucket o camí invàlid.');
    await expect(a.uploadToStorage(webp(), { carpeta: 'avatars', tenantId: '00000000-0000-4000-8000-000000000000' }, {})).rejects.toThrow('Poble inconsistent');
    await expect(a.uploadToStorage(new Blob(['%PDF'], { type: 'application/pdf' }), { carpeta: 'avatars' }, {})).rejects.toThrow('Format de fitxer no admés en este destí');
    await expect(a.uploadToStorage(new Blob([new Uint8Array(5242881)], { type: 'image/webp' }), { carpeta: 'avatars' }, {})).rejects.toThrow('Mida de fitxer no admesa');
    const privada = await a.uploadToStorage(new Blob(['%PDF'], { type: 'application/pdf' }), { carpeta: 'notes' }, {});
    expect(privada.url.startsWith('sdp-media://mitjans_privats/')).toBe(true);
    expect(await a.resolveAsset(privada.url, {})).toBe('data:application/pdf;base64,JVBERg==');
    expect(await a.getPublicUrl('mitjans_privats', privada.ruta, {})).toBe(privada.url);
    const publica = await a.promoteToPublic(privada.url, {});
    expect(publica).toBe(`sdp-media://mitjans/${privada.ruta}`);
    expect(await a.promoteToPublic(privada.url, {})).toBe(publica);
    expect(await a.resolveAsset(publica, {})).toBe('data:application/pdf;base64,JVBERg==');
    entra(a, VEINA);
    expect(await a.resolveAsset(privada.url, {})).toBe(privada.url);
    expect(await a.promoteToPublic(privada.url, {})).toBe(privada.url);
    expect(await a.resolveAsset('sdp-media://mitjans/../../fora', {})).toBe('sdp-media://mitjans/../../fora');
    expect(await a.llistaElsMeusMitjans({})).toEqual([]);
    await expect(a.esborraElMeuMitja(url, {})).rejects.toMatchObject({ code: 'no-disponible', codi: 'no-disponible' });
  });
});

describe('formes del contracte de la comunitat', () => {
  test('seguiments i bloquejos: formes, idempotència i el bloqueig que talla el seguiment', async () => {
    const a = creaAdaptadorLocal({ ara });
    entra(a);
    const seguit = { tipus: 'entitat', id: RENTONAR };
    expect(await a.segueix(seguit, {})).toEqual({ seguint: true, creatAl: '2026-11-01T10:00:00.000Z', nou: true, primer: true });
    expect(await a.segueix(seguit, {})).toMatchObject({ seguint: true, nou: false, primer: false });
    expect(await a.estatSeguiment(seguit, {})).toEqual({ seguint: true, creatAl: '2026-11-01T10:00:00.000Z' });
    expect((await a.elsMeusSeguiments({})).map((s) => [s.tipus, s.id])).toEqual([['entitat', RENTONAR]]);
    expect(await a.deixaDeSeguir(seguit, {})).toEqual({ seguint: false });
    expect(await a.bloquejaAutor({ ...seguit, nom: 'Rentonar' }, {})).toEqual({ tipus: 'entitat', id: RENTONAR, nom: 'Rentonar', creatAl: '2026-11-01T10:00:00.000Z' });
    await expect(a.segueix(seguit, {})).rejects.toEqual(ambCodi('SDP-SEG-004'));
    expect(await a.desbloquejaAutor(seguit, {})).toEqual({ desbloquejat: true });
    expect(await a.desbloquejaAutor(seguit, {})).toEqual({ desbloquejat: false });
    await expect(a.bloquejaAutor({ tipus: 'persona', id: PERSONA }, {})).rejects.toEqual(ambCodi('autobloqueig'));
  });

  test('denúncies sense sessió (repetida la segona vegada) i normes només amb sessió', async () => {
    const a = creaAdaptadorLocal({ ara });
    const denuncia = { objecte: { tipus: 'publicacio', id: 'publicacio-de-prova' }, motiu: 'spam_frau' };
    expect(await a.denunciaContingut(denuncia, {})).toEqual({ rebuda: true, repetida: false });
    expect(await a.denunciaContingut(denuncia, {})).toEqual({ rebuda: true, repetida: true });
    expect(await a.estatNormes({})).toEqual({ versio: VERSIO_NORMES_CONVIVENCIA, acceptadaAl: null });
    await expect(a.acceptaNormes(VERSIO_NORMES_CONVIVENCIA, {})).rejects.toEqual(ambCodi('sense-sessio'));
    entra(a);
    expect(await a.acceptaNormes(VERSIO_NORMES_CONVIVENCIA, {})).toEqual({ versio: VERSIO_NORMES_CONVIVENCIA, acceptadaAl: '2026-11-01T10:00:00.000Z' });
    expect(await a.estatNormes({})).toEqual({ versio: VERSIO_NORMES_CONVIVENCIA, acceptadaAl: '2026-11-01T10:00:00.000Z' });
  });
});

/* Gauntlet V-A01 i V-A03 (assalt 261101) · El que el node ja té fora del
   magatzem de les dades obertes (dadesObertesLocal.js · ocupatsDelNode): els
   pobles de la base amb la regla de l'exportador i el padró d'entitats sencer. */
describe('dades obertes: el que el node ja té', () => {
  const portDe = (adaptador) => ({
    ...adaptador,
    teCapacitat: (capacitat) => Object.hasOwn(CAPACITATS, capacitat) && CAPACITATS[capacitat].every((metode) => typeof adaptador[metode] === 'function')
  });
  const lot = (municipi, colleccions = {}) => ({
    format: FORMAT_LOT, versio: '1.2.0', municipi, entitats: [], noticies: [], agenda: [], memoria: [], memoriaOral: [], ...colleccions
  });
  const errorDe = (promesa) => promesa.then(() => null, (error) => error);
  const pobles = async (a) => (await a.loadCoreContent()).towns.map((poble) => [poble.id ?? null, poble.slug ?? null, poble.title || poble.name]);

  test('V-A01 · un poble de `dades` sense slug és el seu id, com per a l’exportador: el seu paquet torna al mateix node sense conflicte', async () => {
    const dades = {
      towns: [{ id: 't1', title: 'La Torre' }],
      entitats: [{ id: 'org-1', slug: 'ajuntament', name: 'Ajuntament', kind: 'entity', town_name: 't1', visibility: 'public' }],
      feedPosts: [{ id: 'n1', title: 'Ban', body: 'Text', poble_id: 't1', author_org_id: 'org-1', created_at: '2026-10-01T10:00:00Z', visibility: 'public' }]
    };
    const a = creaAdaptadorLocal({ mode: 'local', dades, restauracioOberta: true });
    const port = portDe(a);
    // El slug del nom queda reservat: cap lot no hi entra, ni amb el mateix nom ni amb un altre.
    for (const nom of ['La Torre', 'Altra']) {
      expect(await errorDe(a.restauraDadesObertes(lot({ slug: 'la-torre', nom }))), nom)
        .toMatchObject({ code: 'conflicte-identificador', message: "El slug la-torre ja és d'un altre poble d'este servidor." });
    }
    const entrada = await entradaOpenDataDelPoble('t1', { port, ara: '2026-11-01T10:00:00Z', origen: 'https://socdepoble.org' });
    expect(entrada.municipi).toEqual({ slug: 't1', nom: 'La Torre' });
    const paquet = await exportaMunicipiOpenData(entrada, { subtle: webcrypto.subtle });
    expect(paquet.comptes.noticies).toBe(1);
    const { restauracio } = await importaMunicipiOpenData(paquet.zip, port, { subtle: webcrypto.subtle });
    expect(restauracio.creats.noticies).toBe(1);
    expect(await pobles(a)).toEqual([['t1', null, 'La Torre']]);
    expect((await a.llegixDadesObertes({ poble: entrada.municipi })).noticies.map((n) => n.id)).toEqual(['n1']);
    await a.destroy();
  });

  test('V-A01 · cap àlies d’un poble de la base no porta el seu nom: el slug del nom o l’id no el dupliquen, i el paquet legítim entra', async () => {
    // El nom és `title || name`, com a l'exportador: un title buit no deixa el poble sense nom.
    for (const poble of [{ slug: 'latorre', title: 'La Torre' }, { id: 't1', slug: 'latorre', title: 'La Torre' }, { slug: 'latorre', title: '', name: 'La Torre' }]) {
      const a = creaAdaptadorLocal({ mode: 'local', dades: { towns: [poble] }, restauracioOberta: true });
      const abans = await pobles(a);
      for (const slug of poble.id ? ['la-torre', 't1'] : ['la-torre']) {
        expect(await errorDe(a.restauraDadesObertes(lot({ slug, nom: 'La Torre' }))), `${poble.id ?? 'sense id'} · ${slug}`)
          .toMatchObject({ code: 'conflicte-identificador', message: `El slug ${slug} ja és d'un altre poble d'este servidor.` });
      }
      expect(await pobles(a)).toEqual(abans);
      // El paquet legítim (el slug de l'exportador) entra, i continua havent-hi una sola «La Torre».
      await expect(a.restauraDadesObertes(lot({ slug: 'latorre', nom: 'La Torre' }))).resolves.toMatchObject({ creats: { noticies: 0 } });
      expect((await pobles(a)).filter(([, , nom]) => nom === 'La Torre')).toEqual(abans);
      await a.destroy();
    }
    // El slug canònic d'un poble mana sobre la reserva d'un altre (l'id «a» del segon és el slug del primer).
    const a = creaAdaptadorLocal({ mode: 'local', dades: { towns: [{ slug: 'a', title: 'A' }, { id: 'a', slug: 'b', title: 'B' }] }, restauracioOberta: true });
    await expect(a.restauraDadesObertes(lot({ slug: 'a', nom: 'A' }))).resolves.toMatchObject({ creats: { noticies: 0 } });
    await a.destroy();
  });

  test('V-A03 · el slug d’una entitat no pública del padró (de `dades`) és seu: un lot d’un altre poble no el pren', async () => {
    const privada = { id: 'priv-1', slug: 'privada', name: 'Privada', kind: 'entity', town_name: 'Sella', visibility: 'private' };
    const a = creaAdaptadorLocal({ mode: 'local', dades: { entitats: [privada] }, restauracioOberta: true });
    expect(await a.listPublicOrganizations({})).toEqual([]);
    const benillup = { slug: 'benillup', nom: 'Benillup' };
    const entitat = (slug) => ({ id: 'b-1', slug, name: 'Entitat de Benillup', town_name: benillup.nom, visibility: 'public' });
    expect(await errorDe(a.restauraDadesObertes(lot(benillup, { entitats: [entitat('privada')] }))))
      .toMatchObject({ code: 'conflicte-identificador', message: "El slug privada ja és d'una altra entitat." });
    expect(await a.listPublicOrganizations({})).toEqual([]);
    // Un altre slug, sí: la guarda és del slug, no de l'entitat.
    expect((await a.restauraDadesObertes(lot(benillup, { entitats: [entitat('publica-de-benillup')] }))).creats.entitats).toBe(1);
    expect((await a.listPublicOrganizations({})).map((o) => [o.id, o.slug])).toEqual([['b-1', 'publica-de-benillup']]);
    await a.destroy();
  });
});

cobrix(['adminLlistaUsuarisRegistrats','adminAssignaMembreOrganitzacio','adminConnectaUsuari'],'administració d’usuaris no inferix autoritat de metadades locals',async()=>{
  const a=creaAdaptadorLocal();entra(a,PERSONA,{role:'superadmin',aal:'aal2'});
  const config={tenantId:a.configuracio.tenantId};
  await expect(a.adminLlistaUsuarisRegistrats({},config)).rejects.toMatchObject({code:'no-disponible'});
  await expect(a.adminAssignaMembreOrganitzacio({usuariId:VEINA,organitzacioId:PERSONA,rol:'editor'},config)).rejects.toMatchObject({code:'no-disponible'});
  await expect(a.adminConnectaUsuari({usuariId:VEINA,categoria:'amics'},config)).rejects.toMatchObject({code:'no-disponible'});
  a.destroy();
});

test('administració local autoritzada actualitza membres reals de la llavor i revoca sense tocar l’owner',async()=>{
  const tenantId='11111111-1111-4111-8111-111111111111';
  const a=creaAdaptadorLocal({tenantId,dades:{persones:[{id:PERSONA,nom:'Actora'},{id:VEINA,nom:'Veïna'}]},administracioLocal:{pobles:[{id:tenantId,slug:'la-torre',nom:'La Torre'}],autoritza:async()=>true}});entra(a);
  const config={tenantId};
  await expect(a.adminAssignaMembreOrganitzacio({usuariId:VEINA,organitzacioId:'socdepoble',rol:'editor'},config)).resolves.toMatchObject({rol:'editor'});
  expect((await a.adminLlistaUsuarisRegistrats({},config)).find(p=>p.id===VEINA).organitzacions).toContainEqual({id:'socdepoble',nom:'Sóc de Poble',rol:'editor'});
  await expect(a.adminAssignaMembreOrganitzacio({usuariId:VEINA,organitzacioId:'socdepoble',lleva:true},config)).resolves.toMatchObject({llevat:true});
  expect((await a.adminLlistaUsuarisRegistrats({},config)).find(p=>p.id===VEINA).organitzacions).toEqual([]);
  a.destroy();
});

test('guarda de cobertura: cada mètode sense cas al kit té la seua prova ací', () => {
  const absents = CAPACITATS_NO_DECLARADES.flatMap((cap) => CAPACITATS[cap] ?? []);
  expect(metodesSenseCas().filter((metode) => !COBERTS.has(metode) && !absents.includes(metode))).toEqual([]);
});

/* La frontera: cap mòdul de src/data/local (l'adaptador ni cap dels seus
   mòduls, que arrosseguen localXat, la IAIA i la llavor) entra al paquet de
   producció per cap porta. Compta com a importador un especificador
   d'importació estàtica, dinàmica, de reexportació o d'efecte que resol dins
   de la carpeta: relatiu, amb l'àlies @ de Vite (vite.config.js) o des de
   l'arrel de Vite ('/src/…'). Gauntlet T1-V02 · També un patró
   d'import.meta.glob(…) o un import() amb plantilla (Vite en fa un glob) que
   hi pot arribar. El lector és a mà, sense cap regex (cap retrocés). */
const ARREL_REPO = process.cwd();
const ARREL_SRC = path.join(ARREL_REPO, 'src');
const CARPETA_LOCAL = path.join(ARREL_SRC, 'data', 'local');
const COMETES = new Set(["'", '"', '`']);
const BLANCS = new Set([' ', '\t', '\n', '\r']);
const COMODINS = new Set(['*', '?', '[', ']', '{', '}', '(', ')', '!', '+', '@']);
const esDIdentificador = (car) => car !== undefined && ((car >= 'a' && car <= 'z') || (car >= 'A' && car <= 'Z') || (car >= '0' && car <= '9') || car === '_' || car === '$');
const saltaBlancs = (text, i) => {
  let j = i;
  while (j < text.length && BLANCS.has(text[j])) j += 1;
  return j;
};
const ambComodi = (tros) => [...tros].some((car) => COMODINS.has(car));
const dinsDeLaCarpeta = (desti) => typeof desti === 'string' && (desti === CARPETA_LOCAL || desti.startsWith(CARPETA_LOCAL + path.sep));

/* El literal de text que comença a `i` ('…', "…" o `…`) i on acaba, o null.
   En una plantilla, cada ${…} es torna «*», com el glob que en fa Vite. */
function literalA(text, i) {
  const cometa = text[i];
  if (!COMETES.has(cometa)) return null;
  let valor = '';
  let ambPlantilla = false;
  for (let j = i + 1; j < text.length; j += 1) {
    const car = text[j];
    if (car === cometa) return { valor, plantilla: ambPlantilla, fi: j + 1 };
    if (car === '\\') { valor += text[j + 1] ?? ''; j += 1; continue; }
    if (car === '\n' && cometa !== '`') return null;
    if (cometa === '`' && car === '$' && text[j + 1] === '{') {
      const tanca = text.indexOf('}', j + 2);
      if (tanca < 0) return null;
      valor += '*';
      ambPlantilla = true;
      j = tanca;
      continue;
    }
    valor += car;
  }
  return null;
}

/* Els especificadors d'un font, { valor, glob }: els de from, import i
   import(…), i cada patró del primer argument d'import.meta.glob(…) (un text o
   una llista de textos). */
function especificadorsDe(text) {
  const trobats = [];
  for (const paraula of ['import', 'from']) {
    for (let i = text.indexOf(paraula); i >= 0; i = text.indexOf(paraula, i + 1)) {
      if (esDIdentificador(text[i - 1]) || text[i - 1] === '.') continue;
      let j = i + paraula.length;
      if (paraula === 'import' && text.startsWith('.meta.glob', j)) {
        j += '.meta.glob'.length;
        while (esDIdentificador(text[j])) j += 1;
        j = saltaBlancs(text, j);
        if (text[j] !== '(') continue;
        j = saltaBlancs(text, j + 1);
        const llista = text[j] === '[';
        let literal = literalA(text, llista ? saltaBlancs(text, j + 1) : j);
        while (literal) {
          trobats.push({ valor: literal.valor, glob: true });
          j = saltaBlancs(text, literal.fi);
          if (!llista || text[j] !== ',') break;
          literal = literalA(text, saltaBlancs(text, j + 1));
        }
        continue;
      }
      if (esDIdentificador(text[j])) continue;
      j = saltaBlancs(text, j);
      if (paraula === 'import' && text[j] === '(') j = saltaBlancs(text, j + 1);
      const literal = literalA(text, j);
      if (literal) trobats.push({ valor: literal.valor, glob: literal.plantilla });
    }
  }
  return trobats;
}

/* El directori d'on parteix un especificador, i la resta: relatiu, l'àlies @
   o l'arrel de Vite. Un paquet (o qualsevol altra cosa), null. */
function origenDe(fitxer, especificador) {
  if (especificador.startsWith('@/')) return { base: ARREL_SRC, resta: especificador.slice(2) };
  if (especificador.startsWith('/')) return { base: ARREL_REPO, resta: especificador.slice(1) };
  if (especificador.startsWith('.')) return { base: path.dirname(fitxer), resta: especificador };
  return null;
}

/* Un glob arriba a la carpeta si la seua part fixa resol dins, o si la
   carpeta és davall i la resta del patró la pot recórrer: cada tros fix ha
   de casar, un tros amb comodí pot casar, «**» casa amb tot, i cal almenys
   un tros més (el fitxer). Un patró negatiu (!…) no hi afig res. */
function globArribaALaCarpeta(fitxer, patro) {
  const origen = patro.startsWith('!') ? null : origenDe(fitxer, patro);
  if (!origen) return false;
  const trossos = origen.resta.split('/');
  const primerComodi = trossos.findIndex(ambComodi);
  const fixos = primerComodi < 0 ? trossos : trossos.slice(0, primerComodi);
  const base = path.resolve(origen.base, ...fixos);
  if (dinsDeLaCarpeta(base)) return true;
  if (primerComodi < 0 || !CARPETA_LOCAL.startsWith(base + path.sep)) return false;
  const cami = path.relative(base, CARPETA_LOCAL).split(path.sep);
  const resta = trossos.slice(primerComodi);
  for (const [n, tros] of cami.entries()) {
    if (resta[n] === undefined) return false;
    if (resta[n].includes('**')) return true;
    if (!ambComodi(resta[n]) && resta[n] !== tros) return false;
  }
  return resta.length > cami.length;
}

function importaLaCarpetaLocal(fitxer, text) {
  return especificadorsDe(text).some(({ valor, glob }) => {
    if (glob) return globArribaALaCarpeta(fitxer, valor);
    const origen = origenDe(fitxer, valor);
    return origen !== null && dinsDeLaCarpeta(path.resolve(origen.base, origen.resta));
  });
}

test('la detecció de la frontera mossega: relatiu, dinàmic, reexportació, efecte i àlies; els veïns localXat i companyia, no', () => {
  const a = (relatiu) => path.join(ARREL_SRC, relatiu);
  expect(importaLaCarpetaLocal(a('sections/xat/Vista.jsx'), "import { creaConversesLocal } from '../../data/local/conversesLocal.js';")).toBe(true);
  expect(importaLaCarpetaLocal(a('data/backend.js'), "const m = await import( './local/notesLocal.js');")).toBe(true);
  expect(importaLaCarpetaLocal(a('main.jsx'), "export * from '@/data/local/mitjansLocal.js';")).toBe(true);
  expect(importaLaCarpetaLocal(a('data/index.js'), "import './local';")).toBe(true);
  expect(importaLaCarpetaLocal(a('data/supabase/xat.js'), "import { createLocalXatAdapter } from '../localXat.js';")).toBe(false);
  expect(importaLaCarpetaLocal(a('data/supabase/notes.js'), "import { createLocalNotesAdapter } from '../localNotes.js';")).toBe(false);
  expect(importaLaCarpetaLocal(a('sections/x.js'), '/* data/local/ citat en un comentari */')).toBe(false);
});

test('Gauntlet T1-V02 · la frontera també veu els globs de Vite, l’arrel de Vite i els import() amb plantilla; els globs que no hi arriben, no', () => {
  const a = (relatiu) => path.join(ARREL_SRC, relatiu);
  const si = [
    [a('sections/mur/Vista.jsx'), "const tot = import.meta.glob('../../data/**');"],
    [a('sections/mur/Vista.jsx'), "const m = import.meta.glob(\n  ['../tractors/*.js', '../../data/local/*.js'],\n  { eager: true }\n);"],
    [a('main.jsx'), "const m = import.meta.glob('/src/data/local/*.js', { eager: true });"],
    [a('main.jsx'), "const m = import.meta.glob('@/data/*/adaptadorLocal.js');"],
    [a('main.jsx'), 'const m = import.meta.globEager("./data/local/*.js");'],
    [a('main.jsx'), "import { creaAdaptadorLocal } from '/src/data/local/adaptadorLocal.js';"],
    [a('data/backend.js'), 'const m = await import(`./local/${nom}.js`);'],
    [a('sections/x.js'), 'const m = await import(`../data/${carpeta}/notesLocal.js`);']
  ];
  for (const [fitxer, text] of si) expect(importaLaCarpetaLocal(fitxer, text), text).toBe(true);
  const no = [
    // Els globs vius de producció (registreTractors.js i registreSentinelles.js) i el negatiu.
    [a('sections/tractors/registreTractors.js'), "...import.meta.glob(\n    ['../gestoria/**/*.{js,jsx,md}', '../tractors/**/*.{js,jsx}', '!**/*.test.*', '!**/__fixtures__/**'],\n    { query: '?raw' }\n  ),"],
    [a('sections/tractors/registreSentinelles.js'), "import.meta.glob(['./sentinelles/**/*.{js,md}', './*.{js,jsx}', './nucli/*.js', '../gestoria/nucli/*.js'])"],
    [a('components/PedraSeca/recursos/alergens.js'), "const FITXERS = import.meta.glob('../../../assets/alergens/*.svg', { query: '?raw', import: 'default', eager: true });"],
    // Un comodí d'un sol tros no baixa a la carpeta, i un glob germà no hi entra.
    [a('sections/x.js'), "import.meta.glob('../data/*.js')"],
    [a('main.jsx'), "import.meta.glob('/src/data/supabase/*.js')"],
    [a('data/backend.js'), 'await import(`./supabase/${nom}.js`)'],
    // En prosa, sense parèntesi, o un identificador que comença per import.
    [a('config/i18n.js'), '/* cap import.meta.glob): els tornaria a ficar */'],
    [a('sections/x.js'), "importaLaCarpetaLocal('../data/local/x.js'); const de = 'fromage';"]
  ];
  for (const [fitxer, text] of no) expect(importaLaCarpetaLocal(fitxer, text), text).toBe(false);
});

test('cap fitxer de src fora de src/data/local ni de les proves importa cap mòdul de la carpeta local', () => {
  const ARREL = ARREL_SRC;
  const importadors = [];
  const camina = (dir) => {
    for (const entrada of readdirSync(dir, { withFileTypes: true })) {
      const cami = path.join(dir, entrada.name);
      if (entrada.isDirectory()) camina(cami);
      else if (/\.(?:js|jsx|mjs)$/.test(entrada.name) && !/\.test\.(?:js|jsx|mjs)$/.test(entrada.name)) {
        const relatiu = path.relative(process.cwd(), cami).split(path.sep).join('/');
        if (relatiu.startsWith('src/data/local/')) continue;
        const text = readFileSync(cami, 'utf8');
        if (text.includes('local/adaptadorLocal') || importaLaCarpetaLocal(cami, text)) importadors.push(relatiu);
      }
    }
  };
  camina(ARREL);
  expect(importadors).toEqual([]);
  /* I la carpeta no toca Supabase ni l'emmagatzematge del navegador. */
  for (const fitxer of readdirSync(path.join(ARREL, 'data/local')).filter((nom) => nom.endsWith('.js') && !nom.includes('.test.'))) {
    const text = readFileSync(path.join(ARREL, 'data/local', fitxer), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(text, fitxer).not.toMatch(/from\s+['"][^'"]*supabase/);
    expect(text, fitxer).not.toMatch(/\b(?:localStorage|sessionStorage)\s*[.[]/);
  }
});
