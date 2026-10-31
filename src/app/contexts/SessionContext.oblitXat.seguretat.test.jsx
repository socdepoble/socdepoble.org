/* P1-12 pas 17 (disseny §8.5 i §18 D-09; pla 261029_1605, C.1) · L'eixida de
   sessió oblida el xat xifrat d'este aparell: darrere d'oblidaNotesDeLUsuari a
   DESPRES_DE_TANCAR, només si tancar ha anat bé, amb la config de l'eixida en
   una clausura (sessio.js només passa usuariId) i, per a la baixa, sense
   conservar res. Amb la bandera real (apagada) no hi ha cap crida nova.
   La bandera es simula amb un getter mutable; l'oblit, amb un espia que per
   defecte crida la funció real (la prova d'integració la fa servir sencera,
   amb un servei fals registrat pel canal lateral). */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';

const m = vi.hoisted(() => ({
  actiu: false,
  backend: {},
  logout: vi.fn(() => Promise.resolve()),
  estat: { usuari: { id: 'U' }, estat: 'dins', rol: 'usuari', generacio: 1, nivell: null }
}));
vi.mock('../../config/xifratXat.js', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, get E2EE_ACTIU_PER_DEFECTE() { return m.actiu; } };
});
vi.mock('../../data/xifratXatEixida.js', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, oblidaXatEnEixir: vi.fn(real.oblidaXatEnEixir) };
});
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: () => false,
  logout: m.logout, loginWithGoogle: vi.fn(), loginWithPassword: vi.fn(), registerWithPassword: vi.fn(),
  listMyOrganizations: vi.fn(), comprovaServidor: vi.fn(), demanaRecuperacioContrasenya: vi.fn(),
  definixContrasenyaNova: vi.fn(), entraAmbTokenDeProveidor: vi.fn(),
  getCurrentUser: () => m.estat.usuari,
  getBackendImplementation: () => m.backend
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
import { _reiniciaOblitXat, estatOblitXat, oblidaXatEnEixir } from '../../data/xifratXatEixida.js';
import { registraServeiXifratXat } from '../../data/xifratXatServei.js';
import { clauIdentitat } from '../../data/xifratXatMagatzem.js';

const U = 'aaaaaaaa-1111-4111-8111-111111111111';
const CONFIG = Object.freeze({ backendId: 'supabase', supabaseUrl: 'https://poble.test', supabaseAnonKey: 'anon', dataMode: 'remote', tenantId: null });
const ALTRA = Object.freeze({ ...CONFIG, supabaseUrl: 'https://altre.test' });

function ambSonda() {
  const sonda = { sessio: null };
  function Sonda() { sonda.sessio = useSessioOpcional(); return null; }
  render(<SessionProvider config={CONFIG}><Sonda /></SessionProvider>);
  return sonda;
}
const diferit = () => { let resol; const promesa = new Promise((r) => { resol = r; }); return { promesa, resol }; };

beforeEach(async () => {
  m.actiu = false;
  m.backend = {};
  m.estat = { usuari: { id: 'U' }, estat: 'dins', rol: 'usuari', generacio: 1, nivell: null };
  m.logout.mockReset().mockImplementation(() => Promise.resolve());
  /* mockReset torna a la implementació original (la funció real). */
  vi.mocked(oblidaXatEnEixir).mockReset();
  _reiniciaOblitXat();
  await cuaDesament.reinicia();
});
afterEach(() => {
  cleanup();
  _reiniciaOblitXat();
});

describe('bandera real (apagada)', () => {
  test('la bandera del codi continua apagada i eixir no crida res del xat', async () => {
    m.actiu = E2EE_ACTIU_PER_DEFECTE;
    expect(m.actiu).toBe(false);
    const sonda = ambSonda();
    await act(async () => { await sonda.sessio.logout(); });
    await act(async () => { await sonda.sessio.eixAmb(async () => ({ demanada: true }), CONFIG); });
    expect(m.logout).toHaveBeenCalledTimes(1);
    expect(oblidaXatEnEixir).not.toHaveBeenCalled();
  });
});

describe('bandera encesa', () => {
  beforeEach(() => { m.actiu = true; });

  test('eixir crida l’oblit una vegada, després del logout, amb la config del proveïdor i qui ix', async () => {
    const ordre = [];
    m.logout.mockImplementation(async () => { ordre.push('logout'); });
    vi.mocked(oblidaXatEnEixir).mockImplementation(async () => { ordre.push('oblit'); return null; });
    const oblidaNotes = vi.spyOn(bgSaveManager, 'oblidaUsuari');
    const sonda = ambSonda();
    await act(async () => { await sonda.sessio.logout(); });
    expect(ordre).toEqual(['logout', 'oblit']);
    expect(oblidaXatEnEixir).toHaveBeenCalledTimes(1);
    expect(oblidaXatEnEixir).toHaveBeenCalledWith({ config: CONFIG, usuariId: 'U' });
    /* Notes continua a l'eixida (la llista de sempre, més l'oblit del xat). */
    expect(oblidaNotes).toHaveBeenCalledWith('U');
    oblidaNotes.mockRestore();
  });

  test('una config explícita d’eixida arriba tal qual a l’oblit (la de la revocació)', async () => {
    vi.mocked(oblidaXatEnEixir).mockResolvedValue(null);
    const sonda = ambSonda();
    await act(async () => { await sonda.sessio.logout(ALTRA, { scope: 'global' }); });
    expect(m.logout).toHaveBeenCalledWith(ALTRA, { scope: 'global' });
    expect(oblidaXatEnEixir).toHaveBeenCalledWith({ config: ALTRA, usuariId: 'U' });
  });

  test('si tancar falla, no s’oblida res del xat', async () => {
    m.logout.mockImplementationOnce(async () => { throw new Error('Sense xarxa'); });
    const sonda = ambSonda();
    await act(async () => { await expect(sonda.sessio.logout()).rejects.toThrow('Sense xarxa'); });
    expect(oblidaXatEnEixir).not.toHaveBeenCalled();
  });

  test('buidar només la pestanya (renovació fallida) no és eixir: cap oblit', async () => {
    const sonda = ambSonda();
    await act(async () => { await sonda.sessio.logout(undefined, { abast: 'pestanya' }); });
    expect(m.logout).toHaveBeenCalledTimes(1);
    expect(oblidaXatEnEixir).not.toHaveBeenCalled();
  });

  test('la baixa (eixAmb) no conserva res: mantenSessio false; si la baixa falla, cap oblit', async () => {
    vi.mocked(oblidaXatEnEixir).mockResolvedValue(null);
    const sonda = ambSonda();
    await act(async () => { await expect(sonda.sessio.eixAmb(async () => { throw new Error('Rebutjada'); })).rejects.toThrow('Rebutjada'); });
    expect(oblidaXatEnEixir).not.toHaveBeenCalled();
    await act(async () => { await sonda.sessio.eixAmb(async () => ({ demanada: true }), ALTRA); });
    expect(oblidaXatEnEixir).toHaveBeenCalledTimes(1);
    expect(oblidaXatEnEixir).toHaveBeenCalledWith({ mantenSessio: false, config: ALTRA, usuariId: 'U' });
    expect(m.logout).not.toHaveBeenCalled();
  });

  test('l’eixida espera l’oblit abans de tornar (qui recarrega després no el talla a mitges)', async () => {
    const vol = diferit();
    vi.mocked(oblidaXatEnEixir).mockImplementation(() => vol.promesa);
    const sonda = ambSonda();
    let acabada = false;
    let eixida;
    await act(async () => { eixida = sonda.sessio.logout().then(() => { acabada = true; }); await Promise.resolve(); });
    await act(async () => { await new Promise((r) => { setTimeout(r, 0); }); });
    expect(oblidaXatEnEixir).toHaveBeenCalledTimes(1);
    expect(acabada).toBe(false);
    await act(async () => { vol.resol(null); await eixida; });
    expect(acabada).toBe(true);
  });

  test('un oblit que rebutja (no hauria) no tomba l’eixida', async () => {
    const avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      vi.mocked(oblidaXatEnEixir).mockRejectedValueOnce(new Error('inesperat'));
      const sonda = ambSonda();
      await act(async () => { await expect(sonda.sessio.logout()).resolves.toBeUndefined(); });
      expect(oblidaXatEnEixir).toHaveBeenCalledTimes(1);
    } finally {
      avis.mockRestore();
    }
  });

  /* Regressió de la carrera (C-oblit §0.2): quan arriba DESPRES_DE_TANCAR, la
     interfície ja ha buidat l'àmbit (clauIdentitat null). L'eixida ha de passar
     la CI de qui ix, calculada amb la config de l'eixida; si no, IndexedDB no
     s'esborraria i es diria 'oblidat' en un ordinador compartit. */
  test('integració: la CI explícita de qui ix arriba al servei encara que l’àmbit ja s’haja buidat; una fallada queda anotada', async () => {
    m.estat = { ...m.estat, usuari: { id: U } };
    const fallit = Object.freeze({ estat: 'OBLIT_FALLIT', pendents: Object.freeze(['indexeddb']), causes: Object.freeze([]), quanMs: 1234 });
    const servei = {
      oblidaTotXat: vi.fn(async () => fallit),
      estatAmbit: () => ({ clauIdentitat: null }),
      estatOblit: () => fallit,
      desaEstatOblit: vi.fn()
    };
    registraServeiXifratXat(m.backend, servei);
    const sonda = ambSonda();
    await act(async () => { await sonda.sessio.logout(); });
    expect(servei.oblidaTotXat).toHaveBeenCalledTimes(1);
    const [opcions] = servei.oblidaTotXat.mock.calls[0];
    expect(opcions.clauIdentitat).toBe(clauIdentitat({ backendId: 'supabase', endpoint: CONFIG.supabaseUrl, joId: U }));
    expect(opcions.mantenSessio).toBe(false);
    for (const capa of [opcions.sessio, opcions.preferencies]) {
      expect(typeof capa?.removeItem).toBe('function');
      expect('getItem' in capa).toBe(false);
      expect('setItem' in capa).toBe(false);
    }
    expect(estatOblitXat()).toMatchObject({ estat: 'OBLIT_FALLIT', pendents: ['indexeddb'], persones: 1, recuperat: false });
  });
});
