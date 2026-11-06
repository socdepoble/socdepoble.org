/* B8C-1 (marató 261101_2143; B8-CLIENT §2.4 i §5.1) · Els avisos push se'n van
   amb la sessió, sense filtrar res a la persona següent del mateix aparell:
   · eixir de veres fa la baixa (amb retirada) ABANS del logout del port, dins
     de l'intent final i amb límit, i l'oblit local DESPRÉS, només si tancar ha
     anat bé; si tancar falla, el registre torna a admetre el servidor de qui
     continua dins (D-B8C-8);
   · preparaEixida (l'avís previ) i buidar només la pestanya no fan cap baixa;
   · cada entrada explícita fa una baixa local sense esperar-la.
   El registre (config/avisosPushXat.js) es simula amb espies que per defecte
   criden les funcions reals: la integració usa el registre de debò amb un
   adaptador fals. */
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';

const m = vi.hoisted(() => ({
  ordre: [],
  logout: vi.fn(() => Promise.resolve()),
  entra: vi.fn(async () => ({ access_token: 'sintetic' })),
  pilot: vi.fn(() => ({ id: 'pilot' })),
  estat: { usuari: { id: 'U' }, estat: 'dins', rol: 'usuari', generacio: 1, nivell: null }
}));
/* Cada espia anota el seu nom a l'ordre i crida la funció real; mockReset hi
   torna (és la implementació original de vi.fn). */
vi.mock('../../config/avisosPushXat.js', async (importOriginal) => {
  const real = await importOriginal();
  const espia = (nom) => vi.fn((...args) => { m.ordre.push(nom); return real[nom](...args); });
  return {
    ...real,
    baixaAvisosPushEnEixir: espia('baixaAvisosPushEnEixir'),
    oblidaAvisosPushEnEixir: espia('oblidaAvisosPushEnEixir'),
    reprenAvisosPushTrasEixidaFallida: espia('reprenAvisosPushTrasEixidaFallida'),
    baixaLocalAvisosPushEnEntrar: espia('baixaLocalAvisosPushEnEntrar')
  };
});
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: () => false,
  logout: m.logout,
  loginWithGoogle: (...args) => m.entra('google', ...args),
  loginWithPassword: (...args) => m.entra('contrasenya', ...args),
  registerWithPassword: (...args) => m.entra('alta', ...args),
  entraAmbTokenDeProveidor: (...args) => m.entra('token', ...args),
  listMyOrganizations: vi.fn(), comprovaServidor: vi.fn(), demanaRecuperacioContrasenya: vi.fn(),
  definixContrasenyaNova: vi.fn(),
  getCurrentUser: () => m.estat.usuari
}));
vi.mock('../../data/sessionService.js', () => ({
  getSessionState: () => m.estat,
  subscribeSession: () => () => {},
  setSessionConfig: () => () => {},
  renovaAra: vi.fn()
}));
vi.mock('../../data/sessioPilot.js', () => ({ entraComAPilot: (...args) => { m.ordre.push('entra:pilot'); return m.pilot(...args); } }));
import { SessionProvider, useSessioOpcional } from './SessionContext.jsx';
import { LIMIT_EIXIDA_MS } from '../../data/autodesament/sessio.js';
import { cuaDesament } from '../../data/autodesament/cua.js';
import { expulsaPerLEixidaDeVeres } from '../../data/expulsioAmfitrio.js';
/* Onada R9 (C3) · El motor del registre, que s'endolla a la façana en avaluar-se (com a l'entrada). */
import '../../config/motorAvisosPushXat.js';
import {
  baixaAvisosPushEnEixir, baixaLocalAvisosPushEnEntrar, fixaServidorAvisosPush, instantaniaAvisosPush,
  oblidaAvisosPushEnEixir, registraAvisosPush, reprenAvisosPushTrasEixidaFallida
} from '../../config/avisosPushXat.js';

const CONFIG = Object.freeze({ backendId: 'supabase', supabaseUrl: 'https://poble.test', supabaseAnonKey: 'anon', dataMode: 'remote', tenantId: null });
const ENDPOINT = 'https://fcm.googleapis.com/fcm/send/de-qui-ix';

/* L'adaptador fals del registre real: un de sol per a tot el fitxer (el
   registre només n'admet un per càrrega). */
const adaptador = {
  tipus: 'web',
  motiu: vi.fn(() => null),
  estat: vi.fn(async () => ({ estat: 'actiu' })),
  activa: vi.fn(async () => ({ estat: 'actiu' })),
  desactiva: vi.fn(async () => ({ estat: 'inactiu' })),
  sincronitza: vi.fn(async () => ({ estat: 'actiu' })),
  neteja: vi.fn(async () => {}),
  oblida: vi.fn(() => {}),
  escoltaToc: vi.fn(() => () => {})
};
const ESPIES = [baixaAvisosPushEnEixir, oblidaAvisosPushEnEixir, reprenAvisosPushTrasEixidaFallida, baixaLocalAvisosPushEnEntrar];

function ambSonda() {
  const sonda = { sessio: null };
  function Sonda() { sonda.sessio = useSessioOpcional(); return null; }
  render(<SessionProvider config={CONFIG}><Sonda /></SessionProvider>);
  return sonda;
}
const totsElsTics = () => act(async () => { await new Promise((resolve) => { setTimeout(resolve, 0); }); });

beforeAll(() => {
  expect(registraAvisosPush(adaptador)).toBe(true);
});
beforeEach(async () => {
  m.ordre = [];
  m.estat = { usuari: { id: 'U' }, estat: 'dins', rol: 'usuari', generacio: 1, nivell: null };
  m.logout.mockReset().mockImplementation(async () => { m.ordre.push('logout'); });
  m.entra.mockReset().mockImplementation(async (via) => { m.ordre.push(`entra:${via}`); return { access_token: 'sintetic' }; });
  m.pilot.mockReset().mockImplementation(() => ({ id: 'pilot' }));
  for (const espia of ESPIES) vi.mocked(espia).mockReset();
  for (const f of Object.values(adaptador)) if (typeof f === 'function') f.mockClear();
  fixaServidorAvisosPush(null);
  await cuaDesament.reinicia();
});
afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

describe('eixir de veres', () => {
  test('(1) logout() fa la baixa ABANS del logout del port, sense arguments, i l’oblit DESPRÉS', async () => {
    const sonda = ambSonda();
    await act(async () => { await sonda.sessio.logout(); });
    const push = m.ordre.filter((pas) => pas === 'logout' || /AvisosPush/.test(pas));
    expect(push).toEqual(['baixaAvisosPushEnEixir', 'logout', 'oblidaAvisosPushEnEixir']);
    /* sessio.js passaria (usuariId, { espera }) i el registre els prendria per opcions. */
    expect(baixaAvisosPushEnEixir).toHaveBeenCalledWith();
    expect(oblidaAvisosPushEnEixir).toHaveBeenCalledWith();
    expect(reprenAvisosPushTrasEixidaFallida).not.toHaveBeenCalled();
  });

  test('(2) preparaEixida (l’avís previ, que no tanca res) no fa cap baixa', async () => {
    const sonda = ambSonda();
    await act(async () => { await sonda.sessio.preparaEixida(); });
    expect(baixaAvisosPushEnEixir).not.toHaveBeenCalled();
    expect(oblidaAvisosPushEnEixir).not.toHaveBeenCalled();
    expect(m.logout).not.toHaveBeenCalled();
  });

  test('(3) una baixa que no es resol mai no penja l’eixida: el logout arriba en LIMIT_EIXIDA_MS', async () => {
    vi.mocked(baixaAvisosPushEnEixir).mockImplementation(() => new Promise(() => {}));
    const sonda = ambSonda();
    vi.useFakeTimers();
    let eixida;
    await act(async () => { eixida = sonda.sessio.logout(); await Promise.resolve(); });
    await act(async () => { await vi.advanceTimersByTimeAsync(LIMIT_EIXIDA_MS - 1); });
    expect(baixaAvisosPushEnEixir).toHaveBeenCalledTimes(1);
    expect(m.logout).not.toHaveBeenCalled();
    await act(async () => { await vi.advanceTimersByTimeAsync(1); await eixida; });
    expect(m.logout).toHaveBeenCalledTimes(1);
    expect(oblidaAvisosPushEnEixir).toHaveBeenCalledTimes(1);
  });

  test('(4) si el logout del port falla: cap oblit, el registre reprén i l’error es propaga igual', async () => {
    m.logout.mockImplementationOnce(async () => { throw new Error('Sense xarxa'); });
    const sonda = ambSonda();
    await act(async () => { await expect(sonda.sessio.logout()).rejects.toThrow('Sense xarxa'); });
    expect(baixaAvisosPushEnEixir).toHaveBeenCalledTimes(1);
    expect(oblidaAvisosPushEnEixir).not.toHaveBeenCalled();
    expect(reprenAvisosPushTrasEixidaFallida).toHaveBeenCalledTimes(1);
  });

  test('si tancar ha anat bé però l’oblit de la cua falla, no es reprén res (la sessió ja és tancada)', async () => {
    const oblit = vi.spyOn(cuaDesament, 'oblida').mockRejectedValueOnce(new Error('IndexedDB'));
    try {
      const sonda = ambSonda();
      await act(async () => { await expect(sonda.sessio.logout()).rejects.toThrow('IndexedDB'); });
      expect(m.logout).toHaveBeenCalledTimes(1);
      expect(reprenAvisosPushTrasEixidaFallida).not.toHaveBeenCalled();
    } finally {
      oblit.mockRestore();
    }
  });

  test('(5) buidar només la pestanya (renovació fallida) no és eixir: cap baixa, cap oblit, cap represa', async () => {
    const sonda = ambSonda();
    await act(async () => { await sonda.sessio.logout(undefined, { abast: 'pestanya' }); });
    expect(m.logout).toHaveBeenCalledTimes(1);
    expect(baixaAvisosPushEnEixir).not.toHaveBeenCalled();
    expect(oblidaAvisosPushEnEixir).not.toHaveBeenCalled();
    expect(reprenAvisosPushTrasEixidaFallida).not.toHaveBeenCalled();
  });

  test('(6) la baixa del compte (eixAmb) també fa la baixa i, si va bé, l’oblit; si falla, reprén', async () => {
    const sonda = ambSonda();
    await act(async () => { await expect(sonda.sessio.eixAmb(async () => { throw new Error('Rebutjada'); })).rejects.toThrow('Rebutjada'); });
    expect(baixaAvisosPushEnEixir).toHaveBeenCalledTimes(1);
    expect(oblidaAvisosPushEnEixir).not.toHaveBeenCalled();
    expect(reprenAvisosPushTrasEixidaFallida).toHaveBeenCalledTimes(1);
    await act(async () => { await sonda.sessio.eixAmb(async () => ({ demanada: true })); });
    expect(baixaAvisosPushEnEixir).toHaveBeenCalledTimes(2);
    expect(oblidaAvisosPushEnEixir).toHaveBeenCalledTimes(1);
    expect(m.logout).not.toHaveBeenCalled();
  });

  test('l’expulsió de l’amfitrió passa per la mateixa eixida i també fa la baixa', async () => {
    ambSonda();
    let resultat;
    await act(async () => { resultat = await expulsaPerLEixidaDeVeres(); });
    expect(resultat).toBe(true);
    expect(baixaAvisosPushEnEixir).toHaveBeenCalledTimes(1);
    expect(oblidaAvisosPushEnEixir).toHaveBeenCalledTimes(1);
  });
});

describe('entrada explícita', () => {
  test.each([
    ['loginWithPassword', ['correu@poble.test', 'secret'], 'entra:contrasenya'],
    ['registerWithPassword', ['correu@poble.test', 'secret'], 'entra:alta'],
    ['loginWithGoogle', [], 'entra:google'],
    ['entraAmbTokenDeProveidor', [{ proveidor: 'apple', idToken: 'x' }], 'entra:token'],
    ['entraComAPilot', [CONFIG], 'entra:pilot']
  ])('(7) %s fa una baixa local abans d’entrar, una sola vegada i sense esperar-la', async (via, args, pas) => {
    vi.mocked(baixaLocalAvisosPushEnEntrar).mockImplementation(() => { m.ordre.push('baixaLocalAvisosPushEnEntrar'); return new Promise(() => {}); });
    m.estat = { usuari: null, estat: 'fora', rol: null, generacio: 1, nivell: null };
    const sonda = ambSonda();
    let resultat;
    await act(async () => {
      const promesa = sonda.sessio[via](...args);
      /* L'entrada del port ja s'ha cridat en el mateix tic: res no l'ha esperat. */
      expect(m.ordre).toContain(pas);
      resultat = await promesa;
    });
    expect(resultat).toBeTruthy();
    expect(baixaLocalAvisosPushEnEntrar).toHaveBeenCalledTimes(1);
    expect(baixaLocalAvisosPushEnEntrar).toHaveBeenCalledWith();
    expect(m.ordre.indexOf('baixaLocalAvisosPushEnEntrar')).toBeLessThan(m.ordre.indexOf(pas));
  });

  test('una baixa local que llança (no hauria) no talla l’entrada', async () => {
    vi.mocked(baixaLocalAvisosPushEnEntrar).mockImplementation(() => { throw new Error('inesperat'); });
    m.estat = { usuari: null, estat: 'fora', rol: null, generacio: 1, nivell: null };
    const sonda = ambSonda();
    await act(async () => { await expect(sonda.sessio.loginWithPassword('a', 'b')).resolves.toEqual({ access_token: 'sintetic' }); });
    vi.mocked(baixaLocalAvisosPushEnEntrar).mockImplementation(() => Promise.reject(new Error('inesperat')));
    await act(async () => { await expect(sonda.sessio.loginWithPassword('a', 'b')).resolves.toEqual({ access_token: 'sintetic' }); });
    await totsElsTics();
  });
});

describe('integració amb el registre de debò', () => {
  test('eixir: l’aparell es retira amb el servidor de qui ix abans del logout; després, oblit i neteja, i qui ix no pot tornar a fixar-lo', async () => {
    const servidor = { ambit: 'U', desa: vi.fn(async () => {}), retira: vi.fn(async () => { m.ordre.push('retira'); }) };
    expect(fixaServidorAvisosPush(servidor)).toBe(true);
    adaptador.desactiva.mockImplementation(async ({ retira }) => {
      m.ordre.push(retira ? 'desactiva+retira' : 'desactiva-local');
      if (retira) await retira({ plataforma: 'web', adreca: ENDPOINT });
      return { estat: 'inactiu' };
    });
    const sonda = ambSonda();
    await act(async () => { await sonda.sessio.logout(); });
    const passos = m.ordre.filter((pas) => !/AvisosPush/.test(pas));
    expect(passos).toEqual(['desactiva+retira', 'retira', 'logout', 'desactiva-local']);
    expect(servidor.retira).toHaveBeenCalledWith({ plataforma: 'web', adreca: ENDPOINT });
    expect(adaptador.oblida).toHaveBeenCalledTimes(1);
    expect(adaptador.neteja).toHaveBeenCalledTimes(1);
    expect(instantaniaAvisosPush()).toMatchObject({ eixint: true, ambServidor: false, estat: 'inactiu' });
    /* Si React encara pinta la sessió vella un instant, el servidor de qui ix no torna. */
    expect(fixaServidorAvisosPush({ ...servidor })).toBe(false);
    /* La persona següent sí. */
    expect(fixaServidorAvisosPush({ ambit: 'V', desa: vi.fn(), retira: vi.fn() })).toBe(true);
  });

  test('si tancar falla, el servidor de qui continua dins es pot tornar a fixar (el push ja és apagat)', async () => {
    const servidor = { ambit: 'U', desa: vi.fn(async () => {}), retira: vi.fn(async () => {}) };
    fixaServidorAvisosPush(servidor);
    m.logout.mockImplementationOnce(async () => { throw new Error('Sense xarxa'); });
    const sonda = ambSonda();
    await act(async () => { await expect(sonda.sessio.logout()).rejects.toThrow('Sense xarxa'); });
    expect(adaptador.desactiva).toHaveBeenCalledTimes(1);
    expect(instantaniaAvisosPush()).toMatchObject({ eixint: false, ambServidor: false });
    expect(fixaServidorAvisosPush(servidor)).toBe(true);
  });

  test('entrar a mà: baixa local de la subscripció que hi haja, sense cap retirada', async () => {
    const servidor = { ambit: 'U', desa: vi.fn(async () => {}), retira: vi.fn(async () => {}) };
    fixaServidorAvisosPush(servidor);
    m.estat = { usuari: null, estat: 'fora', rol: null, generacio: 1, nivell: null };
    const sonda = ambSonda();
    await act(async () => { await sonda.sessio.loginWithPassword('a', 'b'); });
    await totsElsTics();
    expect(adaptador.desactiva).toHaveBeenCalledTimes(1);
    expect(adaptador.desactiva).toHaveBeenCalledWith({ retira: null });
    expect(servidor.retira).not.toHaveBeenCalled();
  });
});
