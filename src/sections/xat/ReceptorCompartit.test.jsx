/* 261026 (prompt 261026_1615, tasques 2 i 3) · ReceptorCompartit amb els dos
   registres reals (config/compartirNatiu.js i config/avisosNatius.js) i un
   router fals. Un lot nou del menú «Compartir» porta la persona al Xat una
   sola vegada, si encara no hi és i si el lot no té conversa triada; el toc
   d'un avís del sistema obri el seu xat. El registre dels avisos només
   s'omple una vegada per mòdul: l'adaptador fals es registra ací dalt i en
   guarda el toc. El lot pendent es buida abans i després de cada prova.
   B8C-6 (marató 261101_2143) · El receptor també munta els avisos push del
   Xat: la ruta de l'avís amb la bandera de debò (encesa des del 261106,
   Onada R9) i la sessió dins acaba a la llista si no hi ha res nou, i amb un
   adaptador push registrat la sincronització (un tros diferit) corre en
   muntar i mai pregunta. La sessió és la del mock (sense proveïdor del Xat).
   R9V-C3-04 · El tros SincronitzaAvisosPush es compta (en importar-se i en
   muntar-se) amb un embolcall del mòdul real: sense adaptador no es baixa
   mai, i amb adaptador es baixa una vegada. */
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import ReceptorCompartit from './ReceptorCompartit.jsx';
import { ESPERA_AVIS_MS } from './useObriDesDeLAvis.js';
import { descartaCompartit, lliuraCompartit, triaDestiCompartit } from '../../config/compartirNatiu.js';
import { registraAvisosNatius } from '../../config/avisosNatius.js';
/* Onada R9 (C3) · El motor del registre, que s'endolla a la façana en avaluar-se (com a l'entrada). */
import '../../config/motorAvisosPushXat.js';
import { AVISOS_PUSH_XAT_ACTIUS, fixaServidorAvisosPush, registraAvisosPush } from '../../config/avisosPushXat.js';

const router = vi.hoisted(() => ({ pathname: '/mur', search: '', navigate: vi.fn(), sessio: null }));
const trosSincronitza = vi.hoisted(() => ({ carregues: 0, muntatges: 0 }));
vi.mock('./SincronitzaAvisosPush.jsx', async (importOriginal) => {
  const real = await importOriginal();
  trosSincronitza.carregues += 1;
  return { default: function SincronitzaComptada() { trosSincronitza.muntatges += 1; return real.default(); } };
});
vi.mock('../../app/contexts/RouterContext', () => ({
  useLocation: () => ({ pathname: router.pathname, search: router.search, state: null, hash: '' }),
  useNavigate: () => router.navigate
}));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSessioOpcional: () => router.sessio }));

/* El pont natiu fals: el toc d'un avís arriba per la funció que rep escoltaToc. */
let toca = null;
registraAvisosNatius({
  estatPermis: async () => 'granted',
  demanaPermis: async () => 'granted',
  avisa: async () => {},
  escoltaToc: (fn) => { toca = fn; }
});

const vista = () => render(<ReceptorCompartit />);
/* El canvi de ruta arriba com un render nou amb el pathname del router. */
const vesA = (ruta, rerender) => { router.pathname = ruta; rerender(<ReceptorCompartit />); };
const comparteix = (text = 'Mira esta foto') => {
  let id = null;
  act(() => { id = lliuraCompartit({ text }); });
  return id;
};

beforeEach(() => { router.pathname = '/mur'; router.search = ''; router.sessio = null; router.navigate.mockClear(); descartaCompartit(); });
afterEach(() => { cleanup(); descartaCompartit(); });

test('un lot nou fora del xat porta al Xat una sola vegada', () => {
  vista();
  expect(router.navigate).not.toHaveBeenCalled();
  expect(comparteix()).not.toBeNull();
  expect(router.navigate).toHaveBeenCalledTimes(1);
  expect(router.navigate).toHaveBeenCalledWith('/xat');
});

test('el mateix lot no torna a portar al Xat ni en repintar ni en canviar de ruta', () => {
  const { rerender } = vista();
  comparteix();
  expect(router.navigate).toHaveBeenCalledTimes(1);
  vesA('/xat', rerender);
  rerender(<ReceptorCompartit />);
  /* La persona ix del Xat sense triar conversa: el lot ja l'havia portada. */
  vesA('/mur', rerender);
  vesA('/perfil', rerender);
  expect(router.navigate).toHaveBeenCalledTimes(1);
});

test('si la persona ja és al xat, el lot no navega (tampoc quan després n’ix)', () => {
  router.pathname = '/xat/x';
  const { rerender } = vista();
  comparteix();
  expect(router.navigate).not.toHaveBeenCalled();
  vesA('/mur', rerender);
  expect(router.navigate).not.toHaveBeenCalled();
  /* El xat dins d'un espai (/e/:slug/xat) també és el xat. */
  vesA('/e/forn/xat', rerender);
  comparteix('Un altre');
  expect(router.navigate).not.toHaveBeenCalled();
});

test('un lot que ja esperava en muntar (l’App oberta des del menú Compartir) porta al Xat', () => {
  act(() => { lliuraCompartit({ text: 'Des del menú' }); });
  vista();
  expect(router.navigate).toHaveBeenCalledTimes(1);
  expect(router.navigate).toHaveBeenCalledWith('/xat');
});

test('un lot que ja té conversa triada no navega', () => {
  act(() => {
    lliuraCompartit({ text: 'Ja sé on va' });
    expect(triaDestiCompartit('f-1')).toBe(true);
  });
  vista();
  expect(router.navigate).not.toHaveBeenCalled();
});

test('un segon lot torna a portar al Xat', () => {
  const { rerender } = vista();
  const primer = comparteix('U');
  vesA('/xat', rerender);
  vesA('/mur', rerender);
  expect(router.navigate).toHaveBeenCalledTimes(1);
  const segon = comparteix('Dos');
  expect(segon).not.toBe(primer);
  expect(router.navigate).toHaveBeenCalledTimes(2);
  expect(router.navigate).toHaveBeenLastCalledWith('/xat');
});

test('el toc d’un avís obri el seu xat, amb l’id codificat a la ruta', () => {
  expect(typeof toca).toBe('function');
  const { unmount } = vista();
  act(() => { toca({ filId: 'a b' }); });
  expect(router.navigate).toHaveBeenCalledTimes(1);
  expect(router.navigate).toHaveBeenCalledWith('/xat/a%20b');
  /* Desmuntat, deixa d'escoltar: el toc espera el receptor següent (l'App
     que s'obri des de l'avís) i no es perd. */
  unmount();
  act(() => { toca({ filId: 'f-2' }); });
  expect(router.navigate).toHaveBeenCalledTimes(1);
  vista();
  expect(router.navigate).toHaveBeenCalledTimes(2);
  expect(router.navigate).toHaveBeenLastCalledWith('/xat/f-2');
});

/* B8C-6 (marató 261101_2143) · Els avisos push del Xat. */
/* Onada R9 (C3, G8-08 c) · La bandera de debò és encesa des del 261106. Amb la
   sessió DINS (la persona de veres, no la sessió fora), sense proveïdor del
   Xat (la recàrrega no porta res i la llista és buida): la ruta espera la
   llista fins al sostre i, sense cap conversa amb missatges nous, lleva el
   marcador cap a la llista, una sola vegada i substituint-lo. */
test('B8C-6: la ruta de l\'avís amb la bandera de debò (encesa) i la sessió dins, sense cap conversa nova, acaba a la llista una sola vegada', async () => {
  expect(AVISOS_PUSH_XAT_ACTIUS).toBe(true);
  vi.useFakeTimers();
  try {
    router.pathname = '/xat';
    router.search = 'obri=no-llegits';
    router.sessio = { estat: 'dins', currentUser: { id: 'A' } };
    vista();
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(router.navigate).not.toHaveBeenCalled();
    await act(async () => { await vi.advanceTimersByTimeAsync(ESPERA_AVIS_MS + 10); });
    expect(router.navigate).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith('/xat', { replace: true });
  } finally {
    vi.useRealTimers();
  }
});

test('B8C-6: sense adaptador push, el receptor no toca res (ni a /xat ni fora)', async () => {
  router.sessio = { estat: 'dins', currentUser: { id: 'A' } };
  const { rerender } = vista();
  vesA('/xat', rerender);
  /* Temps de sobra perquè un import() diferit arribara si s'haguera demanat. */
  await act(async () => { await new Promise((fi) => setTimeout(fi, 100)); });
  expect(router.navigate).not.toHaveBeenCalled();
  /* R9V-C3-04: ni en esta prova ni en cap de les anteriors s'ha baixat el tros de la sincronització. */
  expect(trosSincronitza).toEqual({ carregues: 0, muntatges: 0 });
});

test('B8C-6: amb un adaptador push registrat i la sessió dins, la sincronització corre en muntar i no pregunta mai', async () => {
  const sincronitza = vi.fn(async () => ({ estat: 'inactiu' }));
  const activa = vi.fn(async () => ({ estat: 'actiu' }));
  registraAvisosPush({
    tipus: 'web', motiu: () => null, estat: async () => ({ estat: 'inactiu' }), activa,
    desactiva: async () => ({ estat: 'inactiu' }), sincronitza, neteja: async () => {}, oblida: () => {}, escoltaToc: () => () => {}
  });
  try {
    router.sessio = { estat: 'dins', currentUser: { id: 'A' } };
    vista();
    /* Onada R9 (C3): la sincronització és un tros diferit que es munta quan ja
       hi ha adaptador; s'espera que arribe, i després els mateixos fets. */
    await vi.waitFor(() => expect(sincronitza).toHaveBeenCalled());
    await act(async () => {});
    /* Sense proveïdor del Xat ni port, no hi ha servidor: la sincronització fa d'interruptor. */
    expect(sincronitza).toHaveBeenCalledTimes(1);
    expect(sincronitza).toHaveBeenCalledWith(expect.objectContaining({ actiu: false }));
    expect(trosSincronitza.carregues).toBe(1);
    expect(trosSincronitza.muntatges).toBeGreaterThanOrEqual(1);
    expect(activa).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  } finally {
    fixaServidorAvisosPush(null);
  }
});
