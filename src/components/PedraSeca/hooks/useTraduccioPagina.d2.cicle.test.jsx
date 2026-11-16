import { act, cleanup, render } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { RouterContext } from '../../../app/contexts/objectesDeContext.js';
import { useTraduccioPagina } from './useTraduccioPagina.js';

const veu = vi.hoisted(() => ({ parla: vi.fn(() => Promise.resolve()), atura: vi.fn() }));
vi.mock('../../../services/veuIaiaService.js', () => veu);

let lectura;
function Pagina({ cami = '/a' }) {
  const cosRef = useRef(null);
  const traduccio = useTraduccioPagina({ titol: `Pàgina ${cami}`, cosRef });
  lectura = traduccio.menu.lecturaVeu;
  return <article ref={cosRef}><p>Cos de la pàgina {cami}.</p></article>;
}
function Arnes({ cami = '/a', consulta = '' }) {
  return <RouterContext.Provider value={{ currentPath: cami, searchParams: new URLSearchParams(consulta) }}><Pagina cami={cami} /></RouterContext.Provider>;
}
beforeEach(() => {
  veu.parla.mockClear();
  veu.atura.mockClear();
  vi.stubGlobal('speechSynthesis', {});
  vi.stubGlobal('SpeechSynthesisUtterance', function Enunciat() {});
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test('D2: la primera importació de veu pendent no parla després de desmuntar la pàgina', async () => {
  const pagina = render(<Arnes />);
  act(() => {
    lectura.onEscoltar();
    pagina.unmount();
  });
  await act(async () => { await vi.dynamicImportSettled(); });
  expect(veu.parla).not.toHaveBeenCalled();
});

test('D2: canviar de ruta invalida la primera crida de veu pendent d’importació', async () => {
  const pagina = render(<Arnes />);
  act(() => {
    lectura.onEscoltar();
    pagina.rerender(<Arnes cami="/b" />);
  });
  await act(async () => { await vi.dynamicImportSettled(); });
  expect(veu.parla).not.toHaveBeenCalled();
});

test('D2: una primera crida vigent continua llegint el títol i el cos', async () => {
  render(<Arnes />);
  await act(async () => { lectura.onEscoltar(); await vi.dynamicImportSettled(); });
  expect(veu.parla).toHaveBeenCalledTimes(1);
  expect(veu.parla.mock.calls[0][0]).toBe('Pàgina /a\nCos de la pàgina /a.');
});

test('D2: afegir només seccio no invalida una primera importació pendent', async () => {
  const pagina = render(<Arnes />);
  act(() => {
    lectura.onEscoltar();
    pagina.rerender(<Arnes consulta="seccio=segon" />);
  });
  await act(async () => { await vi.dynamicImportSettled(); });
  expect(veu.parla).toHaveBeenCalledTimes(1);
});

test('D2: la pàgina nova pot parlar després d’invalidar la crida antiga', async () => {
  const pagina = render(<Arnes />);
  act(() => {
    lectura.onEscoltar();
    pagina.rerender(<Arnes cami="/b" />);
  });
  await act(async () => { await vi.dynamicImportSettled(); });
  expect(veu.parla).not.toHaveBeenCalled();
  await act(async () => { lectura.onEscoltar(); await vi.dynamicImportSettled(); });
  expect(veu.parla).toHaveBeenCalledTimes(1);
  expect(veu.parla.mock.calls[0][0]).toBe('Pàgina /b\nCos de la pàgina /b.');
});
