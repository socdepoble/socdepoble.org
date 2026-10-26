/* 261026 (prompt 261026_1615, tasques 2 i 3) · ReceptorCompartit amb els dos
   registres reals (config/compartirNatiu.js i config/avisosNatius.js) i un
   router fals. Un lot nou del menú «Compartir» porta la persona al Xat una
   sola vegada, si encara no hi és i si el lot no té conversa triada; el toc
   d'un avís del sistema obri el seu xat. El registre dels avisos només
   s'omple una vegada per mòdul: l'adaptador fals es registra ací dalt i en
   guarda el toc. El lot pendent es buida abans i després de cada prova. */
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import ReceptorCompartit from './ReceptorCompartit.jsx';
import { descartaCompartit, lliuraCompartit, triaDestiCompartit } from '../../config/compartirNatiu.js';
import { registraAvisosNatius } from '../../config/avisosNatius.js';

const router = vi.hoisted(() => ({ pathname: '/mur', navigate: vi.fn() }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useLocation: () => ({ pathname: router.pathname, search: '', state: null, hash: '' }),
  useNavigate: () => router.navigate
}));

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

beforeEach(() => { router.pathname = '/mur'; router.navigate.mockClear(); descartaCompartit(); });
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
