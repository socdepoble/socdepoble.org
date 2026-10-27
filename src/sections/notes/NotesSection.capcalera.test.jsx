/* Ordre del Mestre (261026_2126, pla 261026_1615 §6) · Al Bloc de Notes, en
   «mitja», la carpeta de l'esquerra de NOTES ja no hi és: duplicava la del
   rail fix i trencava l'eix vertical. Fila 1 (NOTES) i fila 2 (cerca i
   ordenar) comencen per la mateixa cel·la (la icona de NOTES damunt de la
   lupa), amb totes les icones a 24px dins de cel·les de botó. jsdom no mesura
   cap x: la plomada es comprova al navegador; ací, l'ordre de les peces. Amb
   CREAR NOTA (canCreate), l'Ordenar no cau davall del [|<]: on va el Crear és
   decisió del Mestre. En «estret» la carpeta es queda: la llista oberta tapa
   el rail i n'és l'única porta a la vista. L'espai de treball de veres, el
   router en memòria de veres i dades sintètiques (els mocks de
   NotesSection.mestreDetall.test.jsx). */
import React from 'react';
import { act, cleanup, fireEvent, render, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext';
import { NOTE_FOLDERS_SEED } from '../../data/appSeed.js';

const dades = vi.hoisted(() => ({ notes: [], buit: [] }));

vi.mock('./NotesContext', async (importOriginal) => ({
  ...await importOriginal(),
  useNotes: () => ({
    notes: dades.notes, noteFolders: dades.buit, status: 'ready', canCreate: true, teSessio: true,
    notesComplete: true, config: { dataMode: 'remote' }, obriConfiguracioNotes: () => {}, informaError: () => {},
    creaNota: async (entrada) => entrada, setLocalNoteField: () => {}
  })
}));
vi.mock('./NotesDataContext.jsx', () => ({ useNotesData: () => ({ activate: () => () => {}, config: { dataMode: 'remote' } }) }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actor: { tipus: 'persona', id: 'uuid-prova', rol: 'persona' }, memberships: [] }) }));
vi.mock('../mur/MurContext', () => ({ useMur: () => ({ sortedFeedPosts: dades.buit, sortedEvents: dades.buit, sortedMarketItems: dades.buit }) }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: () => {} }) }));
vi.mock('./NotesDetail.jsx', async () => {
  const { UniversalPage } = await import('../../components/universal/UniversalPage.jsx');
  return { default: ({ activeNote }) => <UniversalPage chrome="context" title={activeNote?.title || 'cap'} /> };
});
vi.mock('./NotaFitxa.jsx', () => ({
  NotaFitxa: ({ item, active, onSelect }) => (
    <button type="button" aria-current={active ? 'true' : undefined} onClick={onSelect}>{item.title}</button>
  )
}));
vi.mock('./ConnexioFitxa.jsx', () => ({ ConnexioFitxa: () => null }));
vi.mock('../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: (ref) => ({ url: ref, status: ref ? 'ready' : 'idle', error: null, isLoading: false, retry: () => {}, cancel: () => {} })
}));

import NotesSection from './NotesSection.jsx';

const NOTA = Object.freeze({ id: 'a1', title: 'Primera', folderId: 'f-mur', updatedAt: '2026-01-03T09:00:00Z' });
const MUR = NOTE_FOLDERS_SEED.find((carpeta) => carpeta.id === 'f-mur').name;

let restaura = () => {};
function ambAmplada(amplada) {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
  const rafAbans = globalThis.requestAnimationFrame;
  const observadorAbans = globalThis.ResizeObserver;
  const cua = [];
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => amplada });
  globalThis.requestAnimationFrame = (cb) => { cua.push(cb); return cua.length; };
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  restaura = () => {
    if (descriptor) Object.defineProperty(HTMLElement.prototype, 'clientWidth', descriptor);
    else delete HTMLElement.prototype.clientWidth;
    globalThis.requestAnimationFrame = rafAbans;
    globalThis.ResizeObserver = observadorAbans;
  };
  return () => act(() => { while (cua.length) cua.shift()(0); });
}

beforeEach(() => { dades.notes = [NOTA]; sessionStorage.clear(); });
afterEach(() => {
  cleanup();
  restaura();
  restaura = () => {};
});

const munta = (ruta) => render(
  <MemoryRouter rutaInicial={ruta}>
    <NotesSection />
  </MemoryRouter>
);
const closca = (c) => c.querySelector('.app-grid-shell');
const files = (c) => [...c.querySelectorAll('#app-grid-list aside.sdp-workspace-column > .app-grid-col-header')];
const carpetaDeNotes = (c) => files(c)[0]?.querySelector('[aria-controls="app-grid-sidebar"]') ?? null;

test('§6 · a 820 («mitja»): NOTES sense carpeta a l’esquerra, les dues files alineades a l’esquerra (NOTES, després la lupa), l’ordre de les peces i els glifs de 24px', () => {
  ambAmplada(820);
  const { container } = munta('/notes?carpeta=f-mur&nota=a1');
  expect(closca(container).dataset.layout).toBe('mitja');
  const [fila1, fila2] = files(container);
  expect(carpetaDeNotes(container)).toBeNull();
  expect(within(fila1).queryByRole('button', { name: 'CARPETES' })).toBeNull();
  // Fila 1: [icona NOTES] … [Emojis][|<]. Fila 2: [lupa] … [Ordenar][CREAR NOTA].
  expect(fila1.firstElementChild.className).toContain('app-grid-col-header__plec');
  expect(fila1.firstElementChild.textContent).toBe('NOTES');
  expect(fila2.firstElementChild.querySelector('button').getAttribute('aria-label')).toBe('Cercar notes');
  const ordenar = within(fila2).getByRole('button', { name: 'Ordenar per data o nom' });
  expect(ordenar.querySelector('svg').getAttribute('width')).toBe('24');
  // El buit de 12px (AppGridShell.css) el porta el Crear, el germà que seguix l'Ordenar.
  expect(ordenar.nextElementSibling.classList.contains('app-grid-col-header__accio')).toBe(true);
  expect(new Set([...fila1.querySelectorAll('svg'), ...fila2.querySelectorAll('svg')].map((svg) => svg.getAttribute('width')))).toEqual(new Set(['24']));
  // CARPETES continua al rail fix de l'esquerra.
  expect(within(container.querySelector('#app-grid-sidebar')).getByRole('navigation', { name: 'CARPETES' })).toBeTruthy();
});

test('§6 · a 375 («estret»): la llista oberta tapa el rail; la carpeta de NOTES es queda i torna a CARPETES d’un toc', () => {
  ambAmplada(375);
  const { container } = munta('/notes');
  fireEvent.click(within(container.querySelector('#app-grid-sidebar')).getByRole('button', { name: MUR }));
  expect(closca(container).dataset.panell).toBe('middle');
  const carpeta = carpetaDeNotes(container);
  expect(carpeta).not.toBeNull();
  expect(carpeta.getAttribute('aria-label')).toBe('CARPETES');
  expect(carpeta.querySelector('svg').getAttribute('width')).toBe('24');
  fireEvent.click(carpeta);
  expect(closca(container).dataset.panell).toBe('left');
});
