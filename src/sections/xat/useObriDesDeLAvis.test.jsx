/* B8C-6 (marató 261101_2143; B8-CLIENT §5.1) · useObriDesDeLAvis amb un
   router fals (per a vore el `replace`), el Xat simulat i el registre DE
   DEBÒ dels avisos push (src/config/avisosPushXat.js) amb un adaptador fals
   que en guarda el toc. La bandera es llig a cada accés: encesa per defecte
   en este fitxer; la prova (7) la llig del mòdul de debò (encesa des del
   261106) i la (7b) la torna a apagar.
     (1) /xat?obri=no-llegits amb un sol fil no llegit → /xat/<id>, replace;
     (2) amb dos → /xat;
     (3) amb cap → /xat, replace;
     (4) un toc a /xat/123 sense cap no llegit → no navega;
     (5) sense sessió → /xat sense recarregar;
     (6) amb una recàrrega penjada, als 8 s resol amb el que hi ha;
     (7) amb la bandera de debò (encesa), la ruta recarrega i obri la conversa;
     (7b) amb la bandera apagada, la ruta només lleva el marcador;
     (8) recarrega torna null (superada): espera el canvi següent de la
         llista i resol amb la nova. */
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mock = vi.hoisted(() => ({
  pathname: '/xat', search: '', navigate: null, sessio: null, fils: [], recarrega: null, bandera: true
}));
vi.mock('../../app/contexts/RouterContext', () => ({
  useLocation: () => ({ pathname: mock.pathname, search: mock.search, state: null, hash: '' }),
  useNavigate: () => mock.navigate
}));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSessioOpcional: () => mock.sessio }));
vi.mock('./XatContext', () => ({ useXat: () => ({ chatThreads: mock.fils, recarrega: mock.recarrega }) }));
vi.mock('../../config/avisosPushXat.js', async (importOriginal) => {
  const real = await importOriginal();
  const modul = { ...real };
  Object.defineProperty(modul, 'AVISOS_PUSH_XAT_ACTIUS', { enumerable: true, configurable: true, get: () => mock.bandera });
  return modul;
});

/* Onada R9 (C3) · El motor del registre, que s'endolla a la façana en avaluar-se (com a l'entrada). */
import '../../config/motorAvisosPushXat.js';
import { registraAvisosPush } from '../../config/avisosPushXat.js';
import useObriDesDeLAvis, { ESPERA_AVIS_MS } from './useObriDesDeLAvis.js';

/* L'adaptador fals: només ens cal el seu toc. */
let toca = null;
registraAvisosPush({
  tipus: 'web',
  motiu: () => null,
  estat: async () => ({ estat: 'inactiu' }),
  activa: async () => ({ estat: 'actiu' }),
  desactiva: async () => ({ estat: 'inactiu' }),
  sincronitza: async () => ({ estat: 'inactiu' }),
  neteja: async () => {},
  oblida: () => {},
  escoltaToc: (fn) => { toca = fn; return () => {}; }
});

function Obri() {
  useObriDesDeLAvis();
  return null;
}
const fil = (id, noLlegits = 0, extra = {}) => ({ id, noLlegits, ...extra });
const DINS = Object.freeze({ estat: 'dins', currentUser: { id: 'A' } });
const buida = () => act(async () => { for (let i = 0; i < 5; i += 1) await Promise.resolve(); });
const aLaRutaDeLAvis = () => { mock.pathname = '/xat'; mock.search = 'obri=no-llegits'; };

beforeEach(() => {
  mock.pathname = '/mur';
  mock.search = '';
  mock.navigate = vi.fn();
  mock.sessio = DINS;
  mock.fils = [];
  mock.recarrega = vi.fn(async () => true);
  mock.bandera = true;
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('la ruta de l\'avís (/xat?obri=no-llegits)', () => {
  test('(1) un sol fil amb missatges nous → /xat/<id codificat>, amb replace (la ruta neutra no queda a l\'historial)', async () => {
    aLaRutaDeLAvis();
    mock.fils = [fil('f 1', 2), fil('f-2', 0), fil('f-3', 4, { silenciat: true })];
    render(<Obri />);
    await buida();
    expect(mock.recarrega).toHaveBeenCalledTimes(1);
    expect(mock.navigate).toHaveBeenCalledTimes(1);
    expect(mock.navigate).toHaveBeenCalledWith('/xat/f%201', { replace: true });
  });

  test('(2) dos fils amb missatges nous → la llista (/xat)', async () => {
    aLaRutaDeLAvis();
    mock.fils = [fil('f-1', 1), fil('f-2', '3')];
    render(<Obri />);
    await buida();
    expect(mock.navigate).toHaveBeenCalledTimes(1);
    expect(mock.navigate).toHaveBeenCalledWith('/xat', { replace: true });
  });

  test('(3) cap fil amb missatges nous → /xat, amb replace (lleva el marcador)', async () => {
    aLaRutaDeLAvis();
    mock.fils = [fil('f-1', 0), fil('f-2', 0, { noLlegitManual: true })];
    render(<Obri />);
    await buida();
    expect(mock.navigate).toHaveBeenCalledTimes(1);
    expect(mock.navigate).toHaveBeenCalledWith('/xat', { replace: true });
  });

  test('(5) sense sessió → /xat, amb replace, sense recarregar (cap fil d\'abans)', async () => {
    aLaRutaDeLAvis();
    mock.sessio = { estat: 'fora', currentUser: null };
    mock.fils = [fil('f-1', 3)];
    render(<Obri />);
    await buida();
    expect(mock.recarrega).not.toHaveBeenCalled();
    expect(mock.navigate).toHaveBeenCalledTimes(1);
    expect(mock.navigate).toHaveBeenCalledWith('/xat', { replace: true });
  });

  test('(5b) sense proveïdor de sessió és com fora; amb la sessió en comprovant, espera i després resol', async () => {
    aLaRutaDeLAvis();
    mock.sessio = { estat: 'comprovant', currentUser: null };
    mock.fils = [fil('f-1', 1)];
    const vista = render(<Obri />);
    await buida();
    expect(mock.recarrega).not.toHaveBeenCalled();
    expect(mock.navigate).not.toHaveBeenCalled();
    mock.sessio = DINS;
    vista.rerender(<Obri />);
    await buida();
    expect(mock.recarrega).toHaveBeenCalledTimes(1);
    expect(mock.navigate).toHaveBeenCalledWith('/xat/f-1', { replace: true });
  });

  test('(6) amb una recàrrega penjada, als 8 s resol amb la llista que hi ha', async () => {
    vi.useFakeTimers();
    aLaRutaDeLAvis();
    mock.recarrega = vi.fn(() => new Promise(() => {}));
    mock.fils = [fil('f-1', 1)];
    render(<Obri />);
    await buida();
    await act(async () => { await vi.advanceTimersByTimeAsync(ESPERA_AVIS_MS - 10); });
    expect(mock.navigate).not.toHaveBeenCalled();
    await act(async () => { await vi.advanceTimersByTimeAsync(20); });
    expect(mock.navigate).toHaveBeenCalledTimes(1);
    expect(mock.navigate).toHaveBeenCalledWith('/xat/f-1', { replace: true });
  });

  /* Onada R9 (C3, G8-08 d) · La bandera de debò ara és encesa (ordre del
     Mestre del 261106): el cas de debò la llig del mòdul real i prova el camí
     encés sencer (recàrrega i conversa). La branca apagada continua al codi
     (si el Mestre la torna a apagar) i té la seua prova pròpia, amb el nom que
     diu què és. */
  test('(7) amb la bandera de debò (encesa), la ruta recarrega i obri l’única conversa amb missatges nous, amb replace', async () => {
    const real = await vi.importActual('../../config/avisosPushXat.js');
    expect(real.AVISOS_PUSH_XAT_ACTIUS).toBe(true);
    mock.bandera = real.AVISOS_PUSH_XAT_ACTIUS;
    aLaRutaDeLAvis();
    mock.fils = [fil('f-1', 1)];
    render(<Obri />);
    await buida();
    expect(mock.recarrega).toHaveBeenCalledTimes(1);
    expect(mock.navigate).toHaveBeenCalledTimes(1);
    expect(mock.navigate).toHaveBeenCalledWith('/xat/f-1', { replace: true });
  });

  test('(7b) amb la bandera apagada (si el Mestre l’apaga), la ruta només fa navigate(\'/xat\', { replace: true }) i no recarrega (ARB-15)', async () => {
    mock.bandera = false;
    aLaRutaDeLAvis();
    mock.fils = [fil('f-1', 1)];
    render(<Obri />);
    await buida();
    expect(mock.recarrega).not.toHaveBeenCalled();
    expect(mock.navigate).toHaveBeenCalledTimes(1);
    expect(mock.navigate).toHaveBeenCalledWith('/xat', { replace: true });
  });

  test('(8) recarrega torna null (una altra càrrega l\'ha superada): espera el canvi següent de la llista i resol amb la nova', async () => {
    aLaRutaDeLAvis();
    mock.recarrega = vi.fn(async () => null);
    mock.fils = [fil('f-1', 0)];
    const vista = render(<Obri />);
    await buida();
    vista.rerender(<Obri />);
    await buida();
    expect(mock.navigate).not.toHaveBeenCalled();
    /* La càrrega guanyadora porta la llista nova. */
    mock.fils = [fil('f-1', 0), fil('f-nou', 1)];
    vista.rerender(<Obri />);
    await buida();
    expect(mock.navigate).toHaveBeenCalledTimes(1);
    expect(mock.navigate).toHaveBeenCalledWith('/xat/f-nou', { replace: true });
  });

  test('recarrega que torna false o que llança: també espera la llista (sense trencar res)', async () => {
    aLaRutaDeLAvis();
    mock.recarrega = vi.fn(async () => { throw new Error('xarxa'); });
    mock.fils = [fil('f-1', 0)];
    const vista = render(<Obri />);
    await buida();
    expect(mock.navigate).not.toHaveBeenCalled();
    mock.fils = [fil('f-1', 2)];
    vista.rerender(<Obri />);
    await buida();
    expect(mock.navigate).toHaveBeenCalledWith('/xat/f-1', { replace: true });
  });

  test('si la persona ja ha anat a una altra ruta mentre esperava, ha triat ella: no se la mou', async () => {
    aLaRutaDeLAvis();
    mock.recarrega = vi.fn(async () => null);
    mock.fils = [fil('f-1', 0)];
    const vista = render(<Obri />);
    await buida();
    mock.pathname = '/xat/f-9';
    mock.search = '';
    mock.fils = [fil('f-1', 1)];
    vista.rerender(<Obri />);
    await buida();
    expect(mock.navigate).not.toHaveBeenCalled();
  });

  test('la sessió que se\'n va mentre recarrega no deixa cap fil d\'abans: només la llista', async () => {
    aLaRutaDeLAvis();
    let resol;
    mock.recarrega = vi.fn(() => new Promise((r) => { resol = r; }));
    mock.fils = [fil('f-de-A', 3)];
    const vista = render(<Obri />);
    await buida();
    mock.sessio = { estat: 'fora', currentUser: null };
    vista.rerender(<Obri />);
    await act(async () => { resol(true); });
    await buida();
    expect(mock.navigate).toHaveBeenCalledTimes(1);
    expect(mock.navigate).toHaveBeenCalledWith('/xat', { replace: true });
  });
});

describe('el toc d\'un avís (registre)', () => {
  test('(4) un toc a /xat/123 sense cap no llegit no navega: la persona es queda on és', async () => {
    mock.pathname = '/xat/123';
    mock.fils = [fil('123', 0), fil('f-2', 0)];
    render(<Obri />);
    await buida();
    expect(typeof toca).toBe('function');
    await act(async () => { toca({ filId: 'trampa', desti: '/xat/trampa' }); });
    await buida();
    expect(mock.recarrega).toHaveBeenCalledTimes(1);
    expect(mock.navigate).not.toHaveBeenCalled();
  });

  test('un toc amb un sol no llegit obri la conversa, sense replace, i ignora qualsevol dada del toc', async () => {
    mock.pathname = '/mur';
    mock.fils = [fil('f-2', 1)];
    render(<Obri />);
    await buida();
    await act(async () => { toca({ filId: 'trampa' }); });
    await buida();
    expect(mock.navigate).toHaveBeenCalledTimes(1);
    expect(mock.navigate).toHaveBeenCalledWith('/xat/f-2', undefined);
  });

  test('un toc arribat abans que ningú escolte (l\'app oberta des de l\'avís) es resol en muntar, una sola vegada', async () => {
    mock.fils = [fil('f-2', 1)];
    toca({});
    const vista = render(<Obri />);
    await buida();
    expect(mock.navigate).toHaveBeenCalledTimes(1);
    expect(mock.navigate).toHaveBeenCalledWith('/xat/f-2', undefined);
    vista.unmount();
    render(<Obri />);
    await buida();
    expect(mock.navigate).toHaveBeenCalledTimes(1);
  });

  test('un toc sense sessió no navega ni recarrega', async () => {
    mock.sessio = { estat: 'fora', currentUser: null };
    mock.fils = [fil('f-2', 1)];
    render(<Obri />);
    await buida();
    await act(async () => { toca({}); });
    await buida();
    expect(mock.recarrega).not.toHaveBeenCalled();
    expect(mock.navigate).not.toHaveBeenCalled();
  });

  test('un toc amb la sessió fora es descarta, no s\'ajorna: si després entra una persona, aquell toc no la recarrega ni la mou (CORRECTOR ARB-P05-02)', async () => {
    mock.sessio = { estat: 'fora', currentUser: null };
    mock.fils = [fil('f-de-B', 2)];
    const vista = render(<Obri />);
    await buida();
    await act(async () => { toca({}); });
    await buida();
    mock.sessio = { estat: 'dins', currentUser: { id: 'B' } };
    vista.rerender(<Obri />);
    await buida();
    expect(mock.recarrega).not.toHaveBeenCalled();
    expect(mock.navigate).not.toHaveBeenCalled();
  });

  test('un disparador nou substituïx el vell: el resultat tardà del primer no navega', async () => {
    mock.pathname = '/mur';
    const resolts = [];
    mock.recarrega = vi.fn(() => new Promise((r) => { resolts.push(r); }));
    mock.fils = [fil('f-1', 1)];
    render(<Obri />);
    await buida();
    await act(async () => { toca({}); });
    await buida();
    await act(async () => { toca({}); });
    await buida();
    expect(mock.recarrega).toHaveBeenCalledTimes(2);
    await act(async () => { resolts[0](true); });
    await buida();
    expect(mock.navigate).not.toHaveBeenCalled();
    await act(async () => { resolts[1](true); });
    await buida();
    expect(mock.navigate).toHaveBeenCalledTimes(1);
  });
});
