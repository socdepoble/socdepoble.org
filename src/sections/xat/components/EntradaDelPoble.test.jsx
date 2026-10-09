/* Torn 260930 (T1) · EntradaDelPoble: qui arriba a /xat en un amfitrió amb
   poble veu primer el grup del poble, UNA sola vegada per àmbit, només en
   ample, i en remot mai no el crea en silenci. */
import { render, cleanup, act } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import EntradaDelPoble from './EntradaDelPoble.jsx';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  mida: 'ample',
  xat: {}
}));

vi.mock('../../../app/contexts/RouterContext', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('../../../components/layout/AppGridShell.jsx', () => ({ useAppGrid: () => ({ mida: mocks.mida }) }));
vi.mock('../XatContext', () => ({ useXat: () => mocks.xat }));

const POBLE = { id: 'la-torre-de-les-macanes', nom: 'Gent de la Torre' };
const COMUNITAT = {
  fil: { id: 'c-torre', tipus: 'comunitat', subjecte: { tipus: 'poble', id: POBLE.id } },
  fills: [{ id: 'avisos', tipus: 'canal' }, { id: 'general', tipus: 'grup' }]
};

/* La guarda de veres viu al proveïdor: ací, un conjunt per prova. */
function guarda() {
  const fetes = new Set();
  return vi.fn((clau) => {
    if (fetes.has(clau)) return false;
    fetes.add(clau);
    return true;
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  mocks.navigate.mockReset();
  mocks.mida = 'ample';
  mocks.xat = { status: 'ready', senseSessio: false, modeDades: 'seed', consumixEntrada: guarda() };
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const decidix = () => act(() => { vi.runAllTimers(); });

test('en ample, amb la comunitat del poble, obri el seu General', () => {
  render(<EntradaDelPoble poble={POBLE} comunitat={COMUNITAT} aLaLlista />);
  decidix();
  expect(mocks.navigate).toHaveBeenCalledTimes(1);
  expect(mocks.navigate).toHaveBeenCalledWith('/xat/general', { replace: true });
});

test('en seed, sense comunitat, la crea pel camí del «Comentar» (?sobre=poble:<id>)', () => {
  render(<EntradaDelPoble poble={POBLE} comunitat={null} aLaLlista />);
  decidix();
  const [ruta, opcions] = mocks.navigate.mock.calls[0];
  expect(opcions).toEqual({ replace: true });
  const url = new URL(ruta, 'https://x.invalid');
  expect(url.pathname).toBe('/xat');
  expect(url.searchParams.get('sobre')).toBe('poble:la-torre-de-les-macanes');
  expect(url.searchParams.get('titol')).toBe('Gent de la Torre');
});

/* Integració Xat i Pobles (Onada 6) · Sense nom declarat, el grup que es crea
   es diu com la gent del poble de la fitxa (towns), també un poble inventat;
   que arriben les fitxes després no torna a decidir. */
test('en seed, sense nom declarat i amb les fitxes, el grup nou es diu com la gent', () => {
  const towns = [{ id: 'olivera-inventada', title: "L'Olivera Inventada" }];
  const poble = { id: 'olivera-inventada', nom: '' };
  const { rerender } = render(<EntradaDelPoble poble={poble} comunitat={null} towns={null} aLaLlista />);
  rerender(<EntradaDelPoble poble={poble} comunitat={null} towns={towns} aLaLlista />);
  decidix();
  expect(mocks.navigate).toHaveBeenCalledTimes(1);
  const url = new URL(mocks.navigate.mock.calls[0][0], 'https://x.invalid');
  expect(url.searchParams.get('sobre')).toBe('poble:olivera-inventada');
  expect(url.searchParams.get('titol')).toBe("Gent de l'Olivera Inventada");
  expect(url.searchParams.get('ruta')).toBe('/pobles/olivera-inventada');
});

test('en remot, sense comunitat, no crea res (pla 2135, P2) però consumix l\'entrada', () => {
  mocks.xat.modeDades = 'remote';
  render(<EntradaDelPoble poble={POBLE} comunitat={null} aLaLlista />);
  decidix();
  expect(mocks.navigate).not.toHaveBeenCalled();
  expect(mocks.xat.consumixEntrada).toHaveBeenCalledWith(`poble:${POBLE.id}`);
});

test('en remot, amb la comunitat ja existent, sí que obri el General', () => {
  mocks.xat.modeDades = 'remote';
  render(<EntradaDelPoble poble={POBLE} comunitat={COMUNITAT} aLaLlista />);
  decidix();
  expect(mocks.navigate).toHaveBeenCalledWith('/xat/general', { replace: true });
});

test('una sola vegada: tornar a /xat no reobri el grup', () => {
  const { unmount } = render(<EntradaDelPoble poble={POBLE} comunitat={COMUNITAT} aLaLlista />);
  decidix();
  unmount();
  render(<EntradaDelPoble poble={POBLE} comunitat={COMUNITAT} aLaLlista />);
  decidix();
  expect(mocks.navigate).toHaveBeenCalledTimes(1);
});

test('en estret no navega, i l\'entrada queda consumida: passar després a ample no segresta la llista', () => {
  mocks.mida = 'estret';
  const { rerender } = render(<EntradaDelPoble poble={POBLE} comunitat={COMUNITAT} aLaLlista />);
  decidix();
  expect(mocks.navigate).not.toHaveBeenCalled();
  mocks.mida = 'ample';
  rerender(<EntradaDelPoble poble={POBLE} comunitat={COMUNITAT} aLaLlista />);
  decidix();
  expect(mocks.navigate).not.toHaveBeenCalled();
});

test('la mida es llig en decidir, no en el primer render (la closca naix «ample» i mesura després)', () => {
  const { rerender } = render(<EntradaDelPoble poble={POBLE} comunitat={COMUNITAT} aLaLlista />);
  mocks.mida = 'estret';
  rerender(<EntradaDelPoble poble={POBLE} comunitat={COMUNITAT} aLaLlista />);
  decidix();
  expect(mocks.navigate).not.toHaveBeenCalled();
});

test('no fa res sense poble, fora de la llista, sense sessió o amb el xat carregant', () => {
  const casos = [
    [{ poble: null, aLaLlista: true }, {}],
    [{ poble: POBLE, aLaLlista: false }, {}],
    [{ poble: POBLE, aLaLlista: true }, { senseSessio: true }],
    [{ poble: POBLE, aLaLlista: true }, { status: 'loading' }]
  ];
  for (const [props, xat] of casos) {
    mocks.xat = { status: 'ready', senseSessio: false, modeDades: 'seed', consumixEntrada: guarda(), ...xat };
    render(<EntradaDelPoble {...props} comunitat={COMUNITAT} />);
    decidix();
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(mocks.xat.consumixEntrada).not.toHaveBeenCalled();
    cleanup();
  }
});
