/* Onada R32.2 (ARBITRATGE-EGM-03, Peixos del Node 0) · Els oblits de l'eixida
   que viuen darrere d'un import() (els títols locals de la IAIA i les carpetes
   locals del Gestor) no poden acabar en silenci mut quan el tros no arriba
   (una xarxa rural que cau, o un desplegament que deixa en 404 el tros vell):
     · en eixir, l'eixida acaba igual, sessio.js ho avisa a la consola i queden
       posades la marca d'oblit pendent del registre de títols (la que
       lligEstat ja respecta) i la llista per a la pròxima arrencada;
     · la pròxima arrencada, després del primer pintat i siga qui siga qui
       entre (o ningú), torna a provar els oblits pendents i, quan van bé, en
       lleva les marques; sense res pendent no demana cap tros.
   Onada R32.2 (Peixos) · La marca del registre és la font de veritat de la
   llista de reintent (una persona sense marca ix de la llista sense tornar a
   oblidar res), i una eixida que veu canviar la sessió de la pestanya durant
   l'intent final no deixa les dades locals de qui ix a la persona següent.
   Cada prova és una arrencada nova de l'App: vi.resetModules i imports
   dinàmics de React, Testing Library i SessionContext (el reintent es fa una
   sola vegada per càrrega del mòdul). Els títols van damunt del fals
   d'IndexedDB de la prova del xat (global) i les carpetes, damunt del fals
   estricte de la biblioteca, que es passa per opcions. */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { creaIdbFals } from '../../utils/__fixtures__/navegadorFals.js';
import { creaIdbFalsEstructurat } from '../../../tests/helpers/idbFalsEstructurat.js';
import { CarpetaFalsa, clonaAmbHandles } from '../../../tests/helpers/carpetaLocalFalsa.js';
import { setVal } from '../../config/storage.js';

const m = vi.hoisted(() => ({
  trosTitols: true,
  intentsTitols: 0,
  intentsCarpetes: 0,
  idbCarpetes: null,
  logout: vi.fn(() => Promise.resolve()),
  estat: null,
  enviaNotes: null,
  oblidaNotes: vi.fn(() => Promise.resolve())
}));
/* Els dos trossos diferits es tornen a simular a cada arrencada (vi.doMock a
   arrencada()): el registre de mocks guarda el resultat d'un factory que ha
   anat bé i vi.resetModules no el buida. El dels títols falla amb el mateix
   error que dona el navegador; cada import() el torna a demanar
   (SessionContext oblida la càrrega fallida). */
const TROS_TITOLS = '../../sections/xat/sessionsIAIALocals.js';
const TROS_CARPETES = '../../sections/multimedia/bibliotecaCarpetesLocals.js';
const simulaTrossos = () => {
  vi.doMock(TROS_TITOLS, async (importOriginal) => {
    m.intentsTitols += 1;
    if (!m.trosTitols) throw new TypeError('Failed to fetch dynamically imported module: /trossos/sessionsIAIALocals-AbCd1234.js');
    return importOriginal();
  });
  vi.doMock(TROS_CARPETES, async (importOriginal) => {
    m.intentsCarpetes += 1;
    const real = await importOriginal();
    return { ...real, oblidaTotesLesCarpetesLocals: () => real.oblidaTotesLesCarpetesLocals({ idb: m.idbCarpetes }) };
  });
};
/* L'intent final de Notes és on una prova pot fer canviar la sessió de la
   pestanya mentre l'eixida espera xarxa (m.enviaNotes). */
vi.mock('../../sections/notes/GlobalSaveManager.js', () => ({
  enviaNotesDeLUsuari: async (...args) => m.enviaNotes?.(...args),
  oblidaNotesDeLUsuari: (...args) => m.oblidaNotes(...args),
  pendentsNotesDe: async () => []
}));
vi.mock('../../data/xifratXatEixida.js', () => ({ oblidaXatEnEixir: async () => null }));
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: () => false,
  logout: m.logout, loginWithGoogle: vi.fn(), loginWithPassword: vi.fn(), registerWithPassword: vi.fn(),
  listMyOrganizations: vi.fn(), comprovaServidor: vi.fn(), demanaRecuperacioContrasenya: vi.fn(),
  definixContrasenyaNova: vi.fn(), entraAmbTokenDeProveidor: vi.fn(),
  getCurrentUser: () => m.estat.usuari,
  getBackendImplementation: () => ({})
}));
vi.mock('../../data/sessionService.js', () => ({
  getSessionState: () => m.estat,
  subscribeSession: () => () => {},
  setSessionConfig: () => () => {},
  renovaAra: vi.fn()
}));

const CONFIG = Object.freeze({ backendId: 'supabase', supabaseUrl: 'https://poble.test', supabaseAnonKey: 'anon', dataMode: 'remote', tenantId: null });
const DINS = Object.freeze({ usuari: { id: 'U' }, estat: 'dins', rol: 'usuari', generacio: 1, nivell: null });
const FORA = Object.freeze({ usuari: null, estat: 'fora', rol: null, generacio: 2, nivell: null });
/* Les claus de la capa de preferències: la marca del registre de títols
   (PREFIX_OBLIT_PENDENT de sessionsIAIALocals.js), la llista de la pròxima
   arrencada (SessionContext) i la marca de les carpetes (QA-R2-04). */
const MARCA_TITOLS_U = 'iaia-titols-oblit-pendent:U';
const LLISTA_REINTENT = 'iaia-titols-oblit-reintent';
const MARCA_CARPETES = 'arxius-locals-oblit-pendent';
const ID = 'iaia-local-00000000-0000-4000-8000-000000000099';
const ID_NOU = 'iaia-local-00000000-0000-4000-8000-000000000098';
const AMBIT_U = JSON.stringify(['backend', 'U', 'persona::U']);
const AMBIT_V = JSON.stringify(['backend', 'V', 'persona::V']);

let neteges = [];
let fals = null;

/* Una arrencada nova de l'App: mòduls frescos i el proveïdor muntat. */
async function arrencada() {
  vi.resetModules();
  simulaTrossos();
  const React = await import('react');
  const rtl = await import('@testing-library/react');
  const { SessionProvider, useSessioOpcional } = await import('./SessionContext.jsx');
  const storage = await import('../../config/storage.js');
  /* La mateixa instància d'identitat.js que el SessionContext d'esta arrencada. */
  const identitat = await import('../../data/identitat.js');
  const sonda = { sessio: null };
  function Sonda() { sonda.sessio = useSessioOpcional(); return null; }
  rtl.render(React.createElement(SessionProvider, { config: CONFIG }, React.createElement(Sonda)));
  neteges.push(rtl.cleanup);
  return { sonda, rtl, getVal: storage.getVal, getEfimer: storage.getEfimer, identitat };
}
/* El registre real de títols, el que la pestanya baixa quan el tros arriba. */
async function registreReal() {
  const { creaRegistreSessionsIAIA } = await vi.importActual(TROS_TITOLS);
  return creaRegistreSessionsIAIA();
}
async function titolsDeDues() {
  const registre = await registreReal();
  try {
    await registre.llig(AMBIT_U);
    await registre.desaPrimerTitol(AMBIT_U, ID, 'Mercat');
    await registre.desaPrimerTitol(AMBIT_V, ID, 'Biblioteca');
  } finally { registre.tanca(); }
  expect(fals.files('xat-iaia-titols', 'titols').map((fila) => fila.ambit).sort()).toEqual([AMBIT_U, AMBIT_V].sort());
}
const ambitsDesats = () => fals.files('xat-iaia-titols', 'titols').map((fila) => fila.ambit);
const posa = (clau, valor) => expect(setVal(clau, valor)).toBe(true);

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  m.enviaNotes = null;
  m.oblidaNotes.mockReset().mockImplementation(() => Promise.resolve());
  m.trosTitols = true;
  m.intentsTitols = 0;
  m.intentsCarpetes = 0;
  m.idbCarpetes = creaIdbFalsEstructurat({ clona: clonaAmbHandles });
  m.estat = DINS;
  m.logout.mockReset().mockImplementation(() => Promise.resolve());
  vi.stubGlobal('BroadcastChannel', null);
  fals = creaIdbFals();
  /* Només la base dels títols va al fals amb keyPath; la cua d'esborranys
     (sessio.js) no s'obri i treballa en memòria, com en un navegador sense base. */
  const tancat = creaIdbFals({ fallaObrir: true }).idb;
  vi.stubGlobal('indexedDB', { open: (nom, versio) => (nom === 'xat-iaia-titols' ? fals.idb : tancat).open(nom, versio) });
});
afterEach(() => {
  for (const neteja of neteges) neteja();
  neteges = [];
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('EGM-03 · eixir quan el tros dels títols de la IAIA no arriba', () => {
  test('l’eixida acaba, avisa a la consola i deixa la marca del registre i la de la pròxima arrencada; el registre real la respecta', async () => {
    await titolsDeDues();
    m.trosTitols = false;
    const avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { sonda, rtl, getVal } = await arrencada();
    /* La precàrrega del primer pintat també ho prova (i falla) sense marcar res. */
    await rtl.waitFor(() => expect(m.intentsTitols).toBeGreaterThanOrEqual(1));
    expect(getVal(MARCA_TITOLS_U, null)).toBeNull();
    await rtl.act(async () => { await expect(sonda.sessio.logout()).resolves.toBeUndefined(); });
    expect(m.logout).toHaveBeenCalledTimes(1);
    /* Mai silenci mut: el rebuig del tros (l'únic oblit que falla ací) arriba
       a sessio.js, que l'avisa una vegada. */
    expect(avis.mock.calls.filter(([pre]) => pre === '[autodesament] Eixida:')).toHaveLength(1);
    expect(m.intentsTitols).toBeGreaterThanOrEqual(2);
    expect(getVal(MARCA_TITOLS_U)).toBe(true);
    expect(getVal(LLISTA_REINTENT)).toEqual(['U']);
    expect(ambitsDesats().sort()).toEqual([AMBIT_U, AMBIT_V].sort());
    /* Quan el tros arriba, el registre real llig la mateixa marca (el prefix
       és el seu): oblida els títols de qui va eixir abans de tornar-ne cap. */
    const registre = await registreReal();
    try {
      expect(await registre.llig(AMBIT_U)).toEqual([]);
      expect(await registre.llig(AMBIT_V)).toEqual([{ id: ID, titol: 'Biblioteca' }]);
    } finally { registre.tanca(); }
    expect(ambitsDesats()).toEqual([AMBIT_V]);
    expect(getVal(MARCA_TITOLS_U, null)).toBeNull();
  });

  test('si tancar falla, o només es buida la pestanya, no hi ha cap marca ni cap oblit dels títols', async () => {
    await titolsDeDues();
    const { sonda, rtl, getVal } = await arrencada();
    m.logout.mockImplementationOnce(async () => { throw new Error('Sense xarxa'); });
    await rtl.act(async () => { await expect(sonda.sessio.logout()).rejects.toThrow('Sense xarxa'); });
    await rtl.act(async () => { await sonda.sessio.logout(undefined, { abast: 'pestanya' }); });
    expect(m.logout).toHaveBeenCalledTimes(2);
    expect(getVal(MARCA_TITOLS_U, null)).toBeNull();
    expect(getVal(LLISTA_REINTENT, null)).toBeNull();
    expect(ambitsDesats().sort()).toEqual([AMBIT_U, AMBIT_V].sort());
  });

  test('amb el tros a punt, eixir oblida els títols de qui ix i no deixa cap marca', async () => {
    await titolsDeDues();
    const { sonda, rtl, getVal } = await arrencada();
    await rtl.act(async () => { await expect(sonda.sessio.logout()).resolves.toBeUndefined(); });
    expect(ambitsDesats()).toEqual([AMBIT_V]);
    expect(getVal(MARCA_TITOLS_U, null)).toBeNull();
    expect(getVal(LLISTA_REINTENT, null)).toBeNull();
  });
});

describe('EGM-03 · la pròxima arrencada torna a provar els oblits pendents', () => {
  test('sense ningú dins, oblida els títols de qui va eixir, conserva els d’una altra persona i lleva les dues marques', async () => {
    await titolsDeDues();
    posa(MARCA_TITOLS_U, true);
    posa(LLISTA_REINTENT, ['U']);
    m.estat = FORA;
    const { rtl, getVal } = await arrencada();
    await rtl.waitFor(() => expect(getVal(LLISTA_REINTENT, null)).toBeNull());
    expect(getVal(MARCA_TITOLS_U, null)).toBeNull();
    expect(ambitsDesats()).toEqual([AMBIT_V]);
  });

  test('si el tros tampoc arriba ara, les marques es queden per a la següent arrencada, res no cau i la consola ho diu sense dir qui', async () => {
    await titolsDeDues();
    posa(MARCA_TITOLS_U, true);
    posa(LLISTA_REINTENT, ['U']);
    m.trosTitols = false;
    m.estat = FORA;
    const avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { rtl, getVal } = await arrencada();
    await rtl.waitFor(() => expect(avis.mock.calls.filter(([text]) => String(text).startsWith('[sessio] L\'oblit pendent dels títols'))).toHaveLength(1));
    expect(m.intentsTitols).toBeGreaterThanOrEqual(1);
    /* L'avís no porta l'identificador de la persona ('U'). */
    expect(avis.mock.calls.flat().map(String).some((text) => /\bU\b/.test(text))).toBe(false);
    expect(getVal(MARCA_TITOLS_U)).toBe(true);
    expect(getVal(LLISTA_REINTENT)).toEqual(['U']);
    expect(ambitsDesats().sort()).toEqual([AMBIT_U, AMBIT_V].sort());
  });

  test('si el clear() de les carpetes falla en arrencar, la marca es queda i la consola ho diu', async () => {
    const { creaBibliotecaCarpetesLocals, NOM_BD_ARXIUS_LOCALS, STORE_CARPETES_LOCALS } = await vi.importActual(TROS_CARPETES);
    const bib = creaBibliotecaCarpetesLocals({ idb: m.idbCarpetes });
    expect((await bib.desa(new CarpetaFalsa('_salut_de_poble', { 'analitica.pdf': 'x' }))).ok).toBe(true);
    posa(MARCA_CARPETES, true);
    m.idbCarpetes.errorsEnTransaccio.push(new DOMException('perduda', 'UnknownError'));
    m.estat = FORA;
    const avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { rtl, getVal } = await arrencada();
    await rtl.waitFor(() => expect(avis.mock.calls.filter(([text]) => String(text).startsWith('[sessio] L\'oblit pendent de les carpetes'))).toHaveLength(1));
    expect(getVal(MARCA_CARPETES)).toBe(true);
    expect(m.idbCarpetes.files(NOM_BD_ARXIUS_LOCALS, STORE_CARPETES_LOCALS)).toHaveLength(1);
  });

  test('les carpetes de qui va eixir es buiden en arrencar si la seua marca continua posada', async () => {
    const { creaBibliotecaCarpetesLocals, NOM_BD_ARXIUS_LOCALS, STORE_CARPETES_LOCALS } = await vi.importActual(TROS_CARPETES);
    const bib = creaBibliotecaCarpetesLocals({ idb: m.idbCarpetes });
    expect((await bib.desa(new CarpetaFalsa('_salut_de_poble', { 'analitica.pdf': 'x' }))).ok).toBe(true);
    expect(m.idbCarpetes.files(NOM_BD_ARXIUS_LOCALS, STORE_CARPETES_LOCALS)).toHaveLength(1);
    posa(MARCA_CARPETES, true);
    m.estat = FORA;
    const { rtl, getVal } = await arrencada();
    await rtl.waitFor(() => expect(getVal(MARCA_CARPETES, null)).toBeNull());
    expect(m.idbCarpetes.files(NOM_BD_ARXIUS_LOCALS, STORE_CARPETES_LOCALS)).toHaveLength(0);
  });

  test('sense res pendent i sense ningú dins, l’arrencada no demana cap tros', async () => {
    m.estat = FORA;
    const { rtl, getVal } = await arrencada();
    await rtl.act(async () => { await new Promise((r) => { setTimeout(r, 20); }); });
    expect(m.intentsTitols).toBe(0);
    expect(m.intentsCarpetes).toBe(0);
    expect(getVal(LLISTA_REINTENT, null)).toBeNull();
  });
});

describe('R32.2 (Peixos) · la marca del registre és la font de veritat de la llista de reintent', () => {
  test('si el registre acaba l’oblit pel seu compte, la pròxima arrencada trau la persona de la llista i conserva els títols nous de la seua sessió viva', async () => {
    await titolsDeDues();
    m.trosTitols = false;
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const primera = await arrencada();
    await primera.rtl.act(async () => { await primera.sonda.sessio.logout(); });
    expect(primera.getVal(LLISTA_REINTENT)).toEqual(['U']);
    /* Sense recarregar, el tros torna: U entra de nou i el Xat llig el
       registre, que oblida el títol vell i lleva NOMÉS la seua marca. */
    m.trosTitols = true;
    let registre = await registreReal();
    try {
      expect(await registre.llig(AMBIT_U)).toEqual([]);
      await registre.desaPrimerTitol(AMBIT_U, ID_NOU, 'Recepta de coca');
    } finally { registre.tanca(); }
    expect(primera.getVal(MARCA_TITOLS_U, null)).toBeNull();
    expect(primera.getVal(LLISTA_REINTENT)).toEqual(['U']);
    /* U, encara dins, recarrega. */
    const segona = await arrencada();
    await segona.rtl.waitFor(() => expect(segona.getVal(LLISTA_REINTENT, null)).toBeNull());
    expect(segona.getVal(MARCA_TITOLS_U, null)).toBeNull();
    registre = await registreReal();
    try {
      expect(await registre.llig(AMBIT_U)).toEqual([{ id: ID_NOU, titol: 'Recepta de coca' }]);
    } finally { registre.tanca(); }
    expect(ambitsDesats().sort()).toEqual([AMBIT_U, AMBIT_V].sort());
  });
});

describe('R32.2 (Peixos sobre el lot_02) · la sessió canvia durant l’intent final de l’eixida, amb identitat.js i sessio.js reals', () => {
  async function preparaDadesDeU() {
    await titolsDeDues();
    const { creaBibliotecaCarpetesLocals } = await vi.importActual(TROS_CARPETES);
    const bib = creaBibliotecaCarpetesLocals({ idb: m.idbCarpetes });
    expect((await bib.desa(new CarpetaFalsa('_salut_de_U', { 'analitica.pdf': 'x' }))).ok).toBe(true);
  }
  const carpetesDesades = async () => {
    const { NOM_BD_ARXIUS_LOCALS, STORE_CARPETES_LOCALS } = await vi.importActual(TROS_CARPETES);
    return m.idbCarpetes.files(NOM_BD_ARXIUS_LOCALS, STORE_CARPETES_LOCALS);
  };
  const entra = (identitat, id) => identitat.desaSessio({ access_token: `jwt-${id}`, user: { id } }, { origen: 'amfitrio' });

  test('la pestanya es buida (renovació que rep 400): l’eixida acaba, tanca i oblida Notes, títols i carpetes de qui ix', async () => {
    await preparaDadesDeU();
    const { sonda, rtl, getVal, identitat } = await arrencada();
    expect(entra(identitat, 'U')).toBe(true);
    m.enviaNotes = async () => { identitat.esborraSessio({ abast: 'pestanya' }); };
    await rtl.act(async () => { await expect(sonda.sessio.logout()).resolves.toBeUndefined(); });
    expect(m.logout).toHaveBeenCalledTimes(1);
    expect(m.oblidaNotes).toHaveBeenCalledWith('U');
    expect(ambitsDesats()).toEqual([AMBIT_V]);
    expect(await carpetesDesades()).toHaveLength(0);
    expect(getVal(MARCA_CARPETES, null)).toBeNull();
    expect(getVal(MARCA_TITOLS_U, null)).toBeNull();
    expect(getVal(LLISTA_REINTENT, null)).toBeNull();
  });

  test('una altra persona entra: la seua sessió no es toca, l’eixida rebutja i les dades locals de qui ix s’obliden igualment', async () => {
    await preparaDadesDeU();
    const { sonda, rtl, getVal, getEfimer, identitat } = await arrencada();
    expect(entra(identitat, 'U')).toBe(true);
    m.enviaNotes = async () => { entra(identitat, 'V'); };
    await rtl.act(async () => { await expect(sonda.sessio.logout()).rejects.toMatchObject({ name: 'AbortError' }); });
    expect(m.logout).not.toHaveBeenCalled();
    expect(getEfimer(identitat.CLAU_USUARI, null)).toMatchObject({ id: 'V' });
    expect(m.oblidaNotes).toHaveBeenCalledWith('U');
    expect(m.oblidaNotes).not.toHaveBeenCalledWith('V');
    expect(ambitsDesats()).toEqual([AMBIT_V]);
    expect(await carpetesDesades()).toHaveLength(0);
    expect(getVal(MARCA_CARPETES, null)).toBeNull();
    expect(getVal(LLISTA_REINTENT, null)).toBeNull();
  });

  test('la mateixa persona torna a entrar: l’eixida rebutja i les seues dades es queden', async () => {
    await preparaDadesDeU();
    const { sonda, rtl, identitat } = await arrencada();
    expect(entra(identitat, 'U')).toBe(true);
    m.enviaNotes = async () => { entra(identitat, 'U'); };
    await rtl.act(async () => { await expect(sonda.sessio.logout()).rejects.toMatchObject({ name: 'AbortError' }); });
    expect(m.logout).not.toHaveBeenCalled();
    expect(m.oblidaNotes).not.toHaveBeenCalled();
    expect(ambitsDesats().sort()).toEqual([AMBIT_U, AMBIT_V].sort());
    expect(await carpetesDesades()).toHaveLength(1);
  });
});
