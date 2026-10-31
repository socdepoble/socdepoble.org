/* QA-A01a (Gauntlet 261029_1858) · L'amfitrió que expulsa la sessió
   (host.js expulsaSessio: l'API window.SocDePoble i el pont d'iframe) passa per
   la MATEIXA eixida de veres que «Tancar sessió»: logout amb la config del
   proveïdor i, si ha anat bé, DESPRES_DE_TANCAR (Notes, carpetes locals i, amb
   E2EE, el xat). Abans cridava el logout de l'adaptador directament i, en un
   ordinador compartit, les carpetes locals recordades i els esborranys de Notes
   es quedaven per a la persona següent. La biblioteca és la real, damunt d'un
   IndexedDB fals estricte (el patró de SessionContext.carpetesLocals). */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { creaIdbFalsEstructurat } from '../../../tests/helpers/idbFalsEstructurat.js';
import { CarpetaFalsa, clonaAmbHandles } from '../../../tests/helpers/carpetaLocalFalsa.js';

const m = vi.hoisted(() => ({
  actiu: false,
  idb: null,
  logout: vi.fn(() => Promise.resolve()),
  estat: { usuari: { id: 'U' }, estat: 'dins', rol: 'usuari', generacio: 1, nivell: null }
}));
vi.mock('../../PedraSecaEmbed.jsx', () => ({ defineCustomElement: vi.fn() }));
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
  /* El port d'una arrencada feta: l'adaptador té logout (el camí de l'expulsió). */
  getBackendImplementation: () => ({ logout: (...args) => m.logout(...args) })
}));
vi.mock('../../data/sessionService.js', () => ({
  getSessionState: () => m.estat,
  subscribeSession: () => () => {},
  setSessionConfig: () => () => {},
  renovaAra: vi.fn()
}));
import { SessionProvider } from './SessionContext.jsx';
import { expulsaSessio } from '../../host.js';
import { cuaDesament } from '../../data/autodesament/cua.js';
import { bgSaveManager } from '../../sections/notes/GlobalSaveManager.js';
import { oblidaXatEnEixir } from '../../data/xifratXatEixida.js';
import {
  creaBibliotecaCarpetesLocals, llistaCarpetesLocalsRecordades, oblidaTotesLesCarpetesLocals
} from '../../sections/multimedia/bibliotecaCarpetesLocals.js';

const CONFIG = Object.freeze({ backendId: 'supabase', supabaseUrl: 'https://poble.test', supabaseAnonKey: 'anon', dataMode: 'remote', tenantId: null });

const recordades = async () => (await llistaCarpetesLocalsRecordades({ idb: m.idb })).map((c) => c.nom);
/* La carpeta de salut que la persona anterior havia vinculat al Gestor d'arxius. */
async function recordaUna() {
  const bib = creaBibliotecaCarpetesLocals({ idb: m.idb });
  expect((await bib.desa(new CarpetaFalsa('_salut_de_poble', { 'analitica.pdf': 'x' }))).ok).toBe(true);
  expect(await recordades()).toEqual(['_salut_de_poble']);
}
const totsElsTics = () => act(async () => { await new Promise((resolve) => { setTimeout(resolve, 0); }); });

let oblidaNotes;
beforeEach(async () => {
  m.actiu = false;
  m.idb = creaIdbFalsEstructurat({ clona: clonaAmbHandles });
  m.estat = { usuari: { id: 'U' }, estat: 'dins', rol: 'usuari', generacio: 1, nivell: null };
  m.logout.mockReset().mockImplementation(() => Promise.resolve());
  vi.mocked(oblidaTotesLesCarpetesLocals).mockClear();
  vi.mocked(oblidaXatEnEixir).mockClear();
  oblidaNotes = vi.spyOn(bgSaveManager, 'oblidaUsuari');
  await cuaDesament.reinicia();
});
afterEach(() => {
  oblidaNotes.mockRestore();
  cleanup();
});

describe('expulsió de l’amfitrió (host.js expulsaSessio) pel circuit d’eixida', () => {
  test('amb el proveïdor muntat: logout amb la seua config, biblioteca buida i oblit de Notes', async () => {
    await recordaUna();
    render(<SessionProvider config={CONFIG}><span /></SessionProvider>);
    expect(expulsaSessio()).toBe(true);
    await waitFor(() => expect(oblidaTotesLesCarpetesLocals).toHaveBeenCalledTimes(1));
    await totsElsTics();
    expect(m.logout).toHaveBeenCalledTimes(1);
    expect(m.logout).toHaveBeenCalledWith(CONFIG, undefined);
    expect(oblidaNotes).toHaveBeenCalledWith('U');
    expect(await recordades()).toEqual([]);
    expect(oblidaXatEnEixir).not.toHaveBeenCalled();
  });

  test('si el logout falla, la persona continua dins i res no s’oblida (cap rebuig sense atendre)', async () => {
    await recordaUna();
    m.logout.mockImplementationOnce(async () => { throw new Error('Sense xarxa'); });
    render(<SessionProvider config={CONFIG}><span /></SessionProvider>);
    expect(expulsaSessio()).toBe(true);
    await totsElsTics();
    await totsElsTics();
    expect(m.logout).toHaveBeenCalledTimes(1);
    expect(oblidaTotesLesCarpetesLocals).not.toHaveBeenCalled();
    expect(oblidaNotes).not.toHaveBeenCalled();
    expect(await recordades()).toEqual(['_salut_de_poble']);
  });

  test('sense cap proveïdor muntat (l’element tret de la pàgina), la mateixa eixida amb la config del paquet', async () => {
    await recordaUna();
    const vista = render(<SessionProvider config={CONFIG}><span /></SessionProvider>);
    vista.unmount();
    expect(expulsaSessio()).toBe(true);
    await waitFor(() => expect(oblidaTotesLesCarpetesLocals).toHaveBeenCalledTimes(1));
    await totsElsTics();
    expect(m.logout).toHaveBeenCalledTimes(1);
    expect(m.logout).toHaveBeenCalledWith({});
    expect(oblidaNotes).toHaveBeenCalledWith('U');
    expect(await recordades()).toEqual([]);
  });

  test('amb la bandera encesa, també l’oblit del xat xifrat de qui ix', async () => {
    m.actiu = true;
    render(<SessionProvider config={CONFIG}><span /></SessionProvider>);
    expulsaSessio();
    await waitFor(() => expect(oblidaXatEnEixir).toHaveBeenCalledTimes(1));
    expect(oblidaXatEnEixir).toHaveBeenCalledWith({ config: CONFIG, usuariId: 'U' });
  });
});
