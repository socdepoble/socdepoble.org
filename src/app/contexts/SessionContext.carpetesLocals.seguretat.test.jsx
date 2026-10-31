/* Pla 261029_1605 (decisions de l'orquestrador, «Sessió»; IDEA-54/55) · En un
   ordinador compartit del poble, eixir de veres oblida les carpetes locals
   recordades del Gestor d'arxius: oblidaTotesLesCarpetesLocals entra a
   DESPRES_DE_TANCAR al costat de Notes i de l'oblit del xat xifrat (carril
   C1b), només si tancar ha anat bé. Buidar només la pestanya no és eixir.
   La biblioteca és la real, damunt d'un IndexedDB fals estricte que es passa
   per opcions (la global de jsdom no existix i Notes no l'ha de vore). */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { creaIdbFalsEstructurat } from '../../../tests/helpers/idbFalsEstructurat.js';
import { CarpetaFalsa, clonaAmbHandles } from '../../../tests/helpers/carpetaLocalFalsa.js';

const m = vi.hoisted(() => ({
  actiu: false,
  idb: null,
  logout: vi.fn(() => Promise.resolve()),
  estat: { usuari: { id: 'U' }, estat: 'dins', rol: 'usuari', generacio: 1, nivell: null }
}));
vi.mock('../../config/xifratXat.js', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, get E2EE_ACTIU_PER_DEFECTE() { return m.actiu; } };
});
vi.mock('../../data/xifratXatEixida.js', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, oblidaXatEnEixir: vi.fn(async () => null) };
});
/* L'espia apunta les crides tal qual i oblida, de veres, a la base falsa. */
vi.mock('../../sections/multimedia/bibliotecaCarpetesLocals.js', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, oblidaTotesLesCarpetesLocals: vi.fn(() => real.oblidaTotesLesCarpetesLocals({ idb: m.idb })) };
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
import { E2EE_ACTIU_PER_DEFECTE } from '../../config/xifratXat.js';
import { cuaDesament } from '../../data/autodesament/cua.js';
import { bgSaveManager } from '../../sections/notes/GlobalSaveManager.js';
import { oblidaXatEnEixir } from '../../data/xifratXatEixida.js';
import {
  NOM_BD_ARXIUS_LOCALS, STORE_CARPETES_LOCALS, creaBibliotecaCarpetesLocals, llistaCarpetesLocalsRecordades, oblidaTotesLesCarpetesLocals,
  oblitCarpetesLocalsPendent
} from '../../sections/multimedia/bibliotecaCarpetesLocals.js';
import { getVal } from '../../config/storage.js';

/* QA-R2-04 · La clau de la marca persistent de l'oblit pendent (SessionContext, a la capa de preferències). */
const CLAU_OBLIT_PENDENT = 'arxius-locals-oblit-pendent';

const CONFIG = Object.freeze({ backendId: 'supabase', supabaseUrl: 'https://poble.test', supabaseAnonKey: 'anon', dataMode: 'remote', tenantId: null });

function ambSonda() {
  const sonda = { sessio: null };
  function Sonda() { sonda.sessio = useSessioOpcional(); return null; }
  render(<SessionProvider config={CONFIG}><Sonda /></SessionProvider>);
  return sonda;
}
const diferit = () => { let resol; const promesa = new Promise((r) => { resol = r; }); return { promesa, resol }; };
const recordades = async () => (await llistaCarpetesLocalsRecordades({ idb: m.idb })).map((c) => c.nom);
/* Dues carpetes recordades per la persona anterior (p. ex. la de salut). */
async function recordaDues() {
  const bib = creaBibliotecaCarpetesLocals({ idb: m.idb });
  expect((await bib.desa(new CarpetaFalsa('_salut_de_poble', { 'analitica.pdf': 'x' }))).ok).toBe(true);
  expect((await bib.desa(new CarpetaFalsa('_multimedia_de_poble', { 'foto.png': 'y' }))).ok).toBe(true);
  expect((await recordades()).sort()).toEqual(['_multimedia_de_poble', '_salut_de_poble']);
}

beforeEach(async () => {
  m.actiu = false;
  m.idb = creaIdbFalsEstructurat({ clona: clonaAmbHandles });
  m.estat = { usuari: { id: 'U' }, estat: 'dins', rol: 'usuari', generacio: 1, nivell: null };
  m.logout.mockReset().mockImplementation(() => Promise.resolve());
  /* QA-R2-04 · Cap oblit pendent d'una prova anterior: un oblit bo el confirma (memòria i marca). */
  const { oblidaTotesLesCarpetesLocals: real } = await vi.importActual('../../sections/multimedia/bibliotecaCarpetesLocals.js');
  await real({ idb: creaIdbFalsEstructurat({ clona: clonaAmbHandles }) });
  vi.mocked(oblidaTotesLesCarpetesLocals).mockClear();
  vi.mocked(oblidaXatEnEixir).mockClear();
  await cuaDesament.reinicia();
});
afterEach(() => {
  cleanup();
});

describe('eixida de sessió i carpetes locals recordades', () => {
  test('eixir oblida totes les carpetes recordades, una vegada, després del logout i sense passar-li usuariId', async () => {
    await recordaDues();
    const ordre = [];
    m.logout.mockImplementation(async () => { ordre.push('logout'); });
    vi.mocked(oblidaTotesLesCarpetesLocals).mockImplementationOnce(async () => {
      ordre.push('carpetes');
      const { oblidaTotesLesCarpetesLocals: real } = await vi.importActual('../../sections/multimedia/bibliotecaCarpetesLocals.js');
      return real({ idb: m.idb });
    });
    const sonda = ambSonda();
    await act(async () => { await sonda.sessio.logout(); });
    expect(ordre).toEqual(['logout', 'carpetes']);
    expect(oblidaTotesLesCarpetesLocals).toHaveBeenCalledTimes(1);
    expect(oblidaTotesLesCarpetesLocals).toHaveBeenCalledWith();
    expect(await recordades()).toEqual([]);
  });

  test('si tancar falla, la persona continua dins i les seues carpetes també', async () => {
    await recordaDues();
    m.logout.mockImplementationOnce(async () => { throw new Error('Sense xarxa'); });
    const sonda = ambSonda();
    await act(async () => { await expect(sonda.sessio.logout()).rejects.toThrow('Sense xarxa'); });
    expect(oblidaTotesLesCarpetesLocals).not.toHaveBeenCalled();
    expect(await recordades()).toHaveLength(2);
  });

  test('buidar només la pestanya (renovació fallida) no és eixir: no s’oblida cap carpeta', async () => {
    await recordaDues();
    const sonda = ambSonda();
    await act(async () => { await sonda.sessio.logout(undefined, { abast: 'pestanya' }); });
    expect(m.logout).toHaveBeenCalledTimes(1);
    expect(oblidaTotesLesCarpetesLocals).not.toHaveBeenCalled();
    expect(await recordades()).toHaveLength(2);
  });

  test('la baixa (eixAmb) també les oblida; si la baixa falla, no', async () => {
    await recordaDues();
    const sonda = ambSonda();
    await act(async () => { await expect(sonda.sessio.eixAmb(async () => { throw new Error('Rebutjada'); })).rejects.toThrow('Rebutjada'); });
    expect(oblidaTotesLesCarpetesLocals).not.toHaveBeenCalled();
    expect(await recordades()).toHaveLength(2);
    await act(async () => { await expect(sonda.sessio.eixAmb(async () => ({ demanada: true }), CONFIG)).resolves.toEqual({ demanada: true }); });
    expect(oblidaTotesLesCarpetesLocals).toHaveBeenCalledTimes(1);
    expect(await recordades()).toEqual([]);
    expect(m.logout).not.toHaveBeenCalled();
  });

  test('l’eixida espera l’oblit de les carpetes abans de tornar', async () => {
    const vol = diferit();
    vi.mocked(oblidaTotesLesCarpetesLocals).mockImplementationOnce(() => vol.promesa);
    const sonda = ambSonda();
    let acabada = false;
    let eixida;
    await act(async () => { eixida = sonda.sessio.logout().then(() => { acabada = true; }); await Promise.resolve(); });
    await act(async () => { await new Promise((r) => { setTimeout(r, 0); }); });
    expect(oblidaTotesLesCarpetesLocals).toHaveBeenCalledTimes(1);
    expect(acabada).toBe(false);
    await act(async () => { vol.resol(true); await eixida; });
    expect(acabada).toBe(true);
  });

  test('sense base del navegador (navegació privada) o amb un oblit que rebutja, l’eixida acaba igual', async () => {
    m.idb = creaIdbFalsEstructurat({ clona: clonaAmbHandles });
    m.idb.fallaEnObrir = new DOMException('privat', 'InvalidStateError');
    const sonda = ambSonda();
    await act(async () => { await expect(sonda.sessio.logout()).resolves.toBeUndefined(); });
    expect(oblidaTotesLesCarpetesLocals).toHaveBeenCalledTimes(1);
    /* QA-R2-04 · Una base que no s'obri no s'ha pogut buidar: l'oblit queda pendent. */
    await expect(vi.mocked(oblidaTotesLesCarpetesLocals).mock.results[0].value).resolves.toEqual({ ok: false, codi: 'OBLIT_CARPETES_PENDENT' });

    const avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      vi.mocked(oblidaTotesLesCarpetesLocals).mockRejectedValueOnce(new Error('inesperat'));
      await act(async () => { await expect(sonda.sessio.logout()).resolves.toBeUndefined(); });
      expect(oblidaTotesLesCarpetesLocals).toHaveBeenCalledTimes(2);
    } finally {
      avis.mockRestore();
    }
  });

  /* QA-R2-04 (Codex, Ronda 2) · L'IndexedDB no deixa buidar la base: el
     logout no canvia i l'eixida acaba igual, l'oblit torna
     OBLIT_CARPETES_PENDENT i la marca persistent (storage.js) queda posada.
     Mentre ho és, la biblioteca no torna res de l'anterior; el reintent bo la
     lleva. */
  test('QA-R2-04 · el clear() falla en eixir: OBLIT_CARPETES_PENDENT, marca persistent i res de l’anterior fins que el reintent la confirma', async () => {
    await recordaDues();
    m.idb.errorsEnTransaccio.push(new DOMException('perduda', 'UnknownError'), new DOMException('perduda', 'UnknownError'));
    const sonda = ambSonda();
    await act(async () => { await expect(sonda.sessio.logout()).resolves.toBeUndefined(); });
    expect(m.logout).toHaveBeenCalledTimes(1);
    expect(oblidaTotesLesCarpetesLocals).toHaveBeenCalledTimes(1);
    await expect(vi.mocked(oblidaTotesLesCarpetesLocals).mock.results[0].value).resolves.toEqual({ ok: false, codi: 'OBLIT_CARPETES_PENDENT' });
    expect(getVal(CLAU_OBLIT_PENDENT)).toBe(true);
    expect(oblitCarpetesLocalsPendent({ idb: m.idb })).toBe(true);
    /* El primer reintent també falla: la base continua plena, però no en torna res. */
    expect(await recordades()).toEqual([]);
    expect(m.idb.files(NOM_BD_ARXIUS_LOCALS, STORE_CARPETES_LOCALS)).toHaveLength(2);
    /* El següent va bé: la neteja es confirma i la marca se'n va. */
    expect(await recordades()).toEqual([]);
    expect(m.idb.files(NOM_BD_ARXIUS_LOCALS, STORE_CARPETES_LOCALS)).toHaveLength(0);
    expect(getVal(CLAU_OBLIT_PENDENT)).toBeNull();
    expect(oblitCarpetesLocalsPendent({ idb: m.idb })).toBe(false);
  });

  test('amb la bandera real (apagada) la llista és Notes i carpetes, sense cap crida al xat', async () => {
    m.actiu = E2EE_ACTIU_PER_DEFECTE;
    expect(m.actiu).toBe(false);
    const oblidaNotes = vi.spyOn(bgSaveManager, 'oblidaUsuari');
    try {
      const sonda = ambSonda();
      await act(async () => { await sonda.sessio.logout(); });
      expect(oblidaNotes).toHaveBeenCalledWith('U');
      expect(oblidaTotesLesCarpetesLocals).toHaveBeenCalledTimes(1);
      expect(oblidaXatEnEixir).not.toHaveBeenCalled();
    } finally {
      oblidaNotes.mockRestore();
    }
  });

  test('amb la bandera encesa, l’oblit del xat (C1b) continua i les carpetes també s’obliden', async () => {
    m.actiu = true;
    await recordaDues();
    const sonda = ambSonda();
    await act(async () => { await sonda.sessio.logout(); });
    expect(oblidaXatEnEixir).toHaveBeenCalledTimes(1);
    expect(oblidaXatEnEixir).toHaveBeenCalledWith({ config: CONFIG, usuariId: 'U' });
    expect(oblidaTotesLesCarpetesLocals).toHaveBeenCalledTimes(1);
    expect(await recordades()).toEqual([]);
    await act(async () => { await sonda.sessio.eixAmb(async () => ({ demanada: true }), CONFIG); });
    expect(oblidaXatEnEixir).toHaveBeenLastCalledWith({ mantenSessio: false, config: CONFIG, usuariId: 'U' });
    expect(oblidaTotesLesCarpetesLocals).toHaveBeenCalledTimes(2);
  });
});
