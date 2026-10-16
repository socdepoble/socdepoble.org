import React, { StrictMode } from 'react';
import { act, cleanup, fireEvent, render, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { UniversalWorkspace } from './UniversalWorkspace.jsx';
import { useAppGrid } from '../../layout/AppGridShell.jsx';

/*
 * Defecte P2 del Gauntlet (auditoria de Codex 261016_0021) · El focus diferit
 * del Workspace (useFocusAfterLayout): una sola petició per espai, que espera
 * dos fotogrames perquè la closca assente el layout.
 *   · Una tria nova abans del primer fotograma cancel·la la petició d'abans
 *     (cancelAnimationFrame amb el seu id) i només mana la darrera.
 *   · Si el destí ja s'ha tornat a tapar quan arriba el fotograma (la persona
 *     ha tornat a obrir la llista), el focus no hi va: es queda on l'ha posat
 *     la closca.
 *   · Desmuntar cancel·la el fotograma pendent, i un fotograma que el
 *     navegador ja tinguera a la cua no fa res: ni focus, ni un segon
 *     fotograma.
 * La reproducció de Codex (tests/gauntlet-codex-lifecycle.test.jsx) prova el
 * focus de l'editor, el Shadow DOM tancat i el desmuntatge des de la llista;
 * ací, els altres camins. jsdom no fa layout: amplària, observador i
 * fotogrames, a mà. Dades sintètiques.
 */

vi.mock('../../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: (ref) => ({ url: ref, status: ref ? 'ready' : 'idle', error: null, isLoading: false, retry: () => {}, cancel: () => {} })
}));

let fotogrames;
let seguent;
let cancela;
let descriptor;
beforeEach(() => {
  fotogrames = new Map();
  seguent = 0;
  descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
  /* 375: «estret», el mòbil del defecte. */
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 375 });
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal('requestAnimationFrame', (cb) => { seguent += 1; fotogrames.set(seguent, cb); return seguent; });
  cancela = vi.fn((id) => { fotogrames.delete(id); });
  vi.stubGlobal('cancelAnimationFrame', cancela);
  sessionStorage.clear();
});
afterEach(() => {
  cleanup();
  if (descriptor) Object.defineProperty(HTMLElement.prototype, 'clientWidth', descriptor);
  else delete HTMLElement.prototype.clientWidth;
  vi.unstubAllGlobals();
});

/* Un fotograma: els que hi ha a la cua ara (els que demanen s'esperen al següent). */
const fotograma = () => act(() => {
  const cua = [...fotogrames.values()];
  fotogrames.clear();
  cua.forEach((cb) => cb(0));
});

const MODEL = Object.freeze({
  status: 'ready',
  itemsComplete: true,
  categories: [{ id: 'c', label: 'Carpeta' }],
  items: [{ id: 'a', title: 'Nota A', categoryIds: ['c'] }, { id: 'b', title: 'Nota B', categoryIds: ['c'] }]
});
/* El detall porta un control que torna a obrir la llista (com la fletxa ←). */
function Detall() {
  const { obriPanell } = useAppGrid();
  return <button type="button" onClick={() => obriPanell('middle')}>Torna a la llista</button>;
}
const espai = () => <UniversalWorkspace model={MODEL} mestreDetall="navegacio" renderDetail={() => <Detall />} />;

const navegacio = (c) => c.querySelector('#app-grid-sidebar');
const llista = (c) => c.querySelector('#app-grid-list');
const arrelDelDetall = (c) => c.querySelector('.sdp-workspace-detail');

test('una tria nova abans del primer fotograma cancel·la la petició d’abans, i el focus va on demana la darrera', () => {
  const { container } = render(espai());
  fireEvent.click(within(navegacio(container)).getByRole('button', { name: 'Carpeta' }));
  expect(fotogrames.size).toBe(1);
  const [primera] = fotogrames.keys();

  fireEvent.click(within(llista(container)).getByRole('button', { name: 'Nota A' }));
  expect(cancela).toHaveBeenCalledWith(primera);
  expect(fotogrames.has(primera)).toBe(false);
  expect(fotogrames.size).toBe(1);

  fotograma();
  fotograma();
  expect(fotogrames.size).toBe(0);
  expect(document.activeElement).toBe(arrelDelDetall(container));
});

test('si la llista torna a tapar el detall abans del fotograma, el focus no hi va: es queda a la llista', () => {
  const { container } = render(espai());
  fireEvent.click(within(navegacio(container)).getByRole('button', { name: 'Carpeta' }));
  fotograma();
  fotograma();
  fireEvent.click(within(llista(container)).getByRole('button', { name: 'Nota A' }));
  expect(fotogrames.size).toBe(1);

  /* La persona torna a la llista abans que el layout s'assente: la closca
     hi porta el focus (obriPanell) i tapa el detall. */
  fireEvent.click(within(container.querySelector('#app-grid-main')).getByRole('button', { name: 'Torna a la llista' }));
  const alaLlista = document.activeElement;
  expect(llista(container).contains(alaLlista)).toBe(true);
  expect(container.querySelector('#app-grid-main').hasAttribute('inert')).toBe(true);

  fotograma();
  fotograma();
  expect(document.activeElement).toBe(alaLlista);
  expect(arrelDelDetall(container).contains(document.activeElement)).toBe(false);
});

test('desmuntar (StrictMode) cancel·la el fotograma pendent, i un fotograma ja a la cua no fa res', () => {
  const muntat = render(<StrictMode>{espai()}</StrictMode>);
  fireEvent.click(within(navegacio(muntat.container)).getByRole('button', { name: 'Carpeta' }));
  expect(fotogrames.size).toBe(1);
  const [[id, enCua]] = fotogrames.entries();

  muntat.unmount();
  expect(cancela).toHaveBeenCalledWith(id);
  expect(fotogrames.size).toBe(0);

  /* El navegador podia tindre'l ja a punt: executat a destemps, no demana el
     segon fotograma ni mou el focus. */
  act(() => enCua(0));
  expect(fotogrames.size).toBe(0);
  expect(document.activeElement).toBe(document.body);
});
