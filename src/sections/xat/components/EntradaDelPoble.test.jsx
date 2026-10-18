/* Torn 260930 (T1) · EntradaDelPoble: qui arriba a /xat en un amfitrió amb
   poble veu primer el poble, UNA sola vegada per àmbit i només en ample.
   Ordre del Mestre (14-10, pla 261014_0210, XAT-01) · Ja no obri el General:
   demana la fitxa de la comunitat amb l'id del seu fil (`onEntra`), mai un
   fil, i sense comunitat no crea ni demana res en cap mode de dades. La ruta
   (/xat?comunitat=<id>, amb replace) i el focus són de XatSection: en té les
   proves XatSection.revisio260930.test.jsx. */
import { render, cleanup, act } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import EntradaDelPoble from './EntradaDelPoble.jsx';

const mocks = vi.hoisted(() => ({
  mida: 'ample',
  xat: {}
}));

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

let onEntra;

beforeEach(() => {
  vi.useFakeTimers();
  onEntra = vi.fn();
  mocks.mida = 'ample';
  mocks.xat = { status: 'ready', senseSessio: false, modeDades: 'seed', consumixEntrada: guarda() };
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const decidix = () => act(() => { vi.runAllTimers(); });

test('en ample, amb la comunitat del poble, no segresta la vista i manté la llista de converses visible', () => {
  render(<EntradaDelPoble poble={POBLE} comunitat={COMUNITAT} aLaLlista onEntra={onEntra} />);
  decidix();
  expect(onEntra).not.toHaveBeenCalled();
});

/* Crear la comunitat només per arribar a /xat era un efecte col·lateral: la
   fila del poble ja és al capdamunt (anteposaPoble). */
test.each([['seed'], ['local'], ['remote']])('en %s, sense comunitat, no crea ni demana res, però consumix l\'entrada', (modeDades) => {
  mocks.xat.modeDades = modeDades;
  render(<EntradaDelPoble poble={POBLE} comunitat={null} aLaLlista onEntra={onEntra} />);
  decidix();
  expect(onEntra).not.toHaveBeenCalled();
  expect(mocks.xat.consumixEntrada).toHaveBeenCalledWith(`poble:${POBLE.id}`);
});

test('una comunitat sense id de fil no demana res', () => {
  render(<EntradaDelPoble poble={POBLE} comunitat={{ ...COMUNITAT, fil: { ...COMUNITAT.fil, id: '' } }} aLaLlista onEntra={onEntra} />);
  decidix();
  expect(onEntra).not.toHaveBeenCalled();
});

test('una sola vegada: tornar a /xat no torna a consumir l\'entrada', () => {
  const { unmount } = render(<EntradaDelPoble poble={POBLE} comunitat={COMUNITAT} aLaLlista onEntra={onEntra} />);
  decidix();
  expect(mocks.xat.consumixEntrada).toHaveBeenCalledTimes(1);
  unmount();
  render(<EntradaDelPoble poble={POBLE} comunitat={COMUNITAT} aLaLlista onEntra={onEntra} />);
  decidix();
  expect(mocks.xat.consumixEntrada).toHaveBeenCalledTimes(2);
  expect(onEntra).not.toHaveBeenCalled();
});

test('la comunitat que arriba després de consumir l\'entrada no la reobri', () => {
  const { rerender } = render(<EntradaDelPoble poble={POBLE} comunitat={null} aLaLlista onEntra={onEntra} />);
  decidix();
  rerender(<EntradaDelPoble poble={POBLE} comunitat={COMUNITAT} aLaLlista onEntra={onEntra} />);
  decidix();
  expect(onEntra).not.toHaveBeenCalled();
});

/* XatSection li passa una funció nova a cada render: onEntra no es crida mai
   perquè la llista de converses es conserva sencera (Ordre 261017_2302). */
test('un onEntra nou a cada render: no es crida mai i es consumix l\'entrada una sola vegada', () => {
  const primer = vi.fn();
  const { rerender } = render(<EntradaDelPoble poble={POBLE} comunitat={COMUNITAT} aLaLlista onEntra={primer} />);
  rerender(<EntradaDelPoble poble={POBLE} comunitat={COMUNITAT} aLaLlista onEntra={onEntra} />);
  decidix();
  expect(primer).not.toHaveBeenCalled();
  expect(onEntra).not.toHaveBeenCalled();
  rerender(<EntradaDelPoble poble={POBLE} comunitat={COMUNITAT} aLaLlista onEntra={vi.fn()} />);
  decidix();
  expect(onEntra).not.toHaveBeenCalled();
  expect(mocks.xat.consumixEntrada).toHaveBeenCalledTimes(1);
});

test.each([['estret'], ['mitja']])('en %s no demana res, i l\'entrada queda consumida: passar després a ample no segresta la llista', (mida) => {
  mocks.mida = mida;
  const { rerender } = render(<EntradaDelPoble poble={POBLE} comunitat={COMUNITAT} aLaLlista onEntra={onEntra} />);
  decidix();
  expect(onEntra).not.toHaveBeenCalled();
  expect(mocks.xat.consumixEntrada).toHaveBeenCalledWith(`poble:${POBLE.id}`);
  mocks.mida = 'ample';
  rerender(<EntradaDelPoble poble={POBLE} comunitat={COMUNITAT} aLaLlista onEntra={onEntra} />);
  decidix();
  expect(onEntra).not.toHaveBeenCalled();
});

test('la mida es llig en decidir, no en el primer render (la closca naix «ample» i mesura després)', () => {
  const { rerender } = render(<EntradaDelPoble poble={POBLE} comunitat={COMUNITAT} aLaLlista onEntra={onEntra} />);
  mocks.mida = 'estret';
  rerender(<EntradaDelPoble poble={POBLE} comunitat={COMUNITAT} aLaLlista onEntra={onEntra} />);
  decidix();
  expect(onEntra).not.toHaveBeenCalled();
});

test('no fa res sense poble, fora de la llista, sense sessió, amb el xat carregant o sense onEntra', () => {
  const casos = [
    [{ poble: null, aLaLlista: true }, {}],
    [{ poble: POBLE, aLaLlista: false }, {}],
    [{ poble: POBLE, aLaLlista: true }, { senseSessio: true }],
    [{ poble: POBLE, aLaLlista: true }, { status: 'loading' }],
    [{ poble: POBLE, aLaLlista: true, onEntra: null }, {}]
  ];
  for (const [props, xat] of casos) {
    mocks.xat = { status: 'ready', senseSessio: false, modeDades: 'seed', consumixEntrada: guarda(), ...xat };
    render(<EntradaDelPoble onEntra={onEntra} {...props} comunitat={COMUNITAT} />);
    decidix();
    expect(onEntra).not.toHaveBeenCalled();
    expect(mocks.xat.consumixEntrada).not.toHaveBeenCalled();
    cleanup();
  }
});
