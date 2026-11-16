/* Onada R32 (Gauntlet final; QA-R2-04 i QA-A01b) · Des de R30.2 la biblioteca
   de carpetes locals (bibliotecaCarpetesLocals.js) és un tros diferit que
   SessionContext demana amb import(). Ací el tros NO arriba mai: ni en la
   precàrrega posterior al primer pintat ni en eixir (una xarxa rural que cau,
   o un desplegament que deixa en 404 el tros vell). L'eixida ha d'acabar igual
   i, en un ordinador compartit del poble, no pot deixar a la persona següent
   les carpetes de qui ha eixit:
     · la marca persistent d'oblit pendent queda posada des del mòdul lleuger
       (marcaOblitCarpetesLocals.js), i quan el tros arriba la biblioteca no
       llista res de l'anterior fins que un reintent del clear() va bé;
     · l'avís de l'oblit arriba als Gestors de les altres pestanyes pel canal
       de la biblioteca;
     · una precàrrega fallida no marca res: el Gestor de qui és dins no queda
       bloquejat.
   vi.mock és de tot el fitxer: per això este cas no viu a
   SessionContext.carpetesLocals.seguretat.test.jsx, on la biblioteca sí que
   arriba. La biblioteca «que arriba després» és la real (vi.importActual),
   damunt d'un IndexedDB fals estricte que es passa per opcions. */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { creaIdbFalsEstructurat } from '../../../tests/helpers/idbFalsEstructurat.js';
import { CarpetaFalsa, clonaAmbHandles } from '../../../tests/helpers/carpetaLocalFalsa.js';

const m = vi.hoisted(() => ({
  intents: 0,
  idb: null,
  logout: vi.fn(() => Promise.resolve()),
  estat: { usuari: { id: 'U' }, estat: 'dins', rol: 'usuari', generacio: 1, nivell: null }
}));
vi.mock('../../data/xifratXatEixida.js', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, oblidaXatEnEixir: vi.fn(async () => null) };
});
/* El tros que no arriba: el mateix error que dona el navegador. Cada import()
   el torna a demanar (SessionContext oblida la càrrega fallida). */
vi.mock('../../sections/multimedia/bibliotecaCarpetesLocals.js', () => {
  m.intents += 1;
  throw new TypeError('Failed to fetch dynamically imported module: /trossos/bibliotecaCarpetesLocals-AbCd1234.js');
});
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
import { SessionProvider, useSessioOpcional } from './SessionContext.jsx';
import { cuaDesament } from '../../data/autodesament/cua.js';
import { esOblitCarpetaPendent } from '../../sections/multimedia/marcaOblitCarpetesLocals.js';
import { getVal } from '../../config/storage.js';

/* QA-R2-04 · La clau de la marca persistent de l'oblit pendent (SessionContext, a la capa de preferències). */
const CLAU_OBLIT_PENDENT = 'arxius-locals-oblit-pendent';
const NOM_BD = 'socdepoble_arxius_locals_v1';
const STORE = 'carpetes';

const CONFIG = Object.freeze({ backendId: 'supabase', supabaseUrl: 'https://poble.test', supabaseAnonKey: 'anon', dataMode: 'remote', tenantId: null });

/* La biblioteca real: la que la pestanya baixa quan el tros ja arriba. */
const bibliotecaReal = () => vi.importActual('../../sections/multimedia/bibliotecaCarpetesLocals.js');

function ambSonda() {
  const sonda = { sessio: null };
  function Sonda() { sonda.sessio = useSessioOpcional(); return null; }
  render(<SessionProvider config={CONFIG}><Sonda /></SessionProvider>);
  return sonda;
}
const recordades = async () => (await (await bibliotecaReal()).llistaCarpetesLocalsRecordades({ idb: m.idb })).map((c) => c.nom).sort();
/* Dues carpetes recordades per la persona que ix (p. ex. la de salut). */
async function recordaDues() {
  const bib = (await bibliotecaReal()).creaBibliotecaCarpetesLocals({ idb: m.idb });
  expect((await bib.desa(new CarpetaFalsa('_salut_de_poble', { 'analitica.pdf': 'x' }))).ok).toBe(true);
  expect((await bib.desa(new CarpetaFalsa('_multimedia_de_poble', { 'foto.png': 'y' }))).ok).toBe(true);
  expect(await recordades()).toEqual(['_multimedia_de_poble', '_salut_de_poble']);
}
/* Espera que la precàrrega del primer pintat haja provat el tros (i fallat). */
async function esperaPrecarrega() {
  await waitFor(() => expect(m.intents).toBeGreaterThanOrEqual(1));
  await act(async () => { await new Promise((r) => { setTimeout(r, 0); }); });
}

beforeEach(async () => {
  m.intents = 0;
  m.idb = creaIdbFalsEstructurat({ clona: clonaAmbHandles });
  m.estat = { usuari: { id: 'U' }, estat: 'dins', rol: 'usuari', generacio: 1, nivell: null };
  m.logout.mockReset().mockImplementation(() => Promise.resolve());
  /* Cap oblit pendent d'una prova anterior: un oblit bo el confirma (memòria i marca). */
  await (await bibliotecaReal()).oblidaTotesLesCarpetesLocals({ idb: creaIdbFalsEstructurat({ clona: clonaAmbHandles }) });
  expect(getVal(CLAU_OBLIT_PENDENT, null)).toBeNull();
  expect(esOblitCarpetaPendent()).toBe(false);
  await cuaDesament.reinicia();
});
afterEach(() => {
  cleanup();
});

describe('eixida de sessió quan el tros de la biblioteca de carpetes no arriba', () => {
  test('la precàrrega fallida no marca res: el Gestor de qui és dins continua veient les seues carpetes', async () => {
    await recordaDues();
    ambSonda();
    await esperaPrecarrega();
    expect(getVal(CLAU_OBLIT_PENDENT, null)).toBeNull();
    expect(esOblitCarpetaPendent()).toBe(false);
    expect(await recordades()).toEqual(['_multimedia_de_poble', '_salut_de_poble']);
    expect(m.idb.files(NOM_BD, STORE)).toHaveLength(2);
  });

  test('QA-R2-04 · eixir sense el tros: l’eixida acaba, la marca persistent queda posada i, quan el tros arriba, no es llista res de l’anterior fins al reintent bo', async () => {
    await recordaDues();
    const sonda = ambSonda();
    await esperaPrecarrega();
    const intentsPrecarrega = m.intents;
    await act(async () => { await expect(sonda.sessio.logout()).resolves.toBeUndefined(); });
    expect(m.logout).toHaveBeenCalledTimes(1);
    /* L'eixida ho ha tornat a provar (la càrrega fallida s'oblida) i tampoc ha arribat. */
    expect(m.intents).toBeGreaterThan(intentsPrecarrega);
    expect(getVal(CLAU_OBLIT_PENDENT)).toBe(true);
    expect(esOblitCarpetaPendent()).toBe(true);
    const biblioteca = await bibliotecaReal();
    expect(biblioteca.oblitCarpetesLocalsPendent({ idb: m.idb })).toBe(true);
    /* El tros arriba i els dos primers reintents del clear() fallen (la Barra i
       l'autoobertura de la més recent): la base continua plena, però no en torna res. */
    m.idb.errorsEnTransaccio.push(new DOMException('perduda', 'UnknownError'), new DOMException('perduda', 'UnknownError'));
    expect(await recordades()).toEqual([]);
    expect(await biblioteca.recuperaUltimaCarpetaLocal({ idb: m.idb })).toBeNull();
    expect(m.idb.files(NOM_BD, STORE)).toHaveLength(2);
    expect(getVal(CLAU_OBLIT_PENDENT)).toBe(true);
    /* El següent va bé: la neteja es confirma i la marca se'n va. */
    expect(await recordades()).toEqual([]);
    expect(m.idb.files(NOM_BD, STORE)).toHaveLength(0);
    expect(getVal(CLAU_OBLIT_PENDENT, null)).toBeNull();
    expect(esOblitCarpetaPendent()).toBe(false);
  });

  test('QA-A01b · l’avís de l’oblit arriba pel canal de la biblioteca als Gestors de les altres pestanyes', async () => {
    const biblioteca = await bibliotecaReal();
    const escoltador = vi.fn();
    const deixaDEscoltar = biblioteca.escoltaOblitCarpetesLocals(escoltador);
    try {
      const sonda = ambSonda();
      await esperaPrecarrega();
      expect(escoltador).not.toHaveBeenCalled();
      await act(async () => { await expect(sonda.sessio.logout()).resolves.toBeUndefined(); });
      await waitFor(() => expect(escoltador).toHaveBeenCalledTimes(1));
    } finally {
      deixaDEscoltar();
    }
  });

  test('si tancar falla, o només es buida la pestanya, no hi ha cap marca ni cap avís', async () => {
    await recordaDues();
    const escoltador = vi.fn();
    const deixaDEscoltar = (await bibliotecaReal()).escoltaOblitCarpetesLocals(escoltador);
    try {
      const sonda = ambSonda();
      await esperaPrecarrega();
      m.logout.mockImplementationOnce(async () => { throw new Error('Sense xarxa'); });
      await act(async () => { await expect(sonda.sessio.logout()).rejects.toThrow('Sense xarxa'); });
      await act(async () => { await sonda.sessio.logout(undefined, { abast: 'pestanya' }); });
      await act(async () => { await new Promise((r) => { setTimeout(r, 20); }); });
      expect(m.logout).toHaveBeenCalledTimes(2);
      expect(getVal(CLAU_OBLIT_PENDENT, null)).toBeNull();
      expect(esOblitCarpetaPendent()).toBe(false);
      expect(escoltador).not.toHaveBeenCalled();
      expect(await recordades()).toEqual(['_multimedia_de_poble', '_salut_de_poble']);
    } finally {
      deixaDEscoltar();
    }
  });
});
