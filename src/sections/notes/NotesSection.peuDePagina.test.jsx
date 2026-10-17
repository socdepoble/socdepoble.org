/* Gauntlet 261016_1530 (Bloc 3.9, Onada 1.5; ordre del Mestre: «Eliminar el
   bloc inferior "Ja publicat al Mur" de la vista d'edició») · Deroga a
   l'editor l'Esmena 2 del pla 261007_1645: abans el Bloc passava al detall la
   secció de la carpeta triada (Mur, Mercat o Esdeveniments) perquè NotesEditor
   en fera el peu, i este fitxer ho fixava. Es reescriu a propòsit, no
   s'esborra (qualitat.publicacionsActor.test.js el té al cens): ara comprova
   que el detall d'una nota no rep cap secció en cap carpeta, tampoc en
   canviar-ne. Router en memòria i espai de treball de veres; el detall,
   simulat. */
import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext';

const dades = vi.hoisted(() => ({
  notes: [
    { id: 'n1', title: 'Primera', folderId: 'f-mur', updatedAt: '2026-01-03T09:00:00Z' },
    { id: 'm1', title: 'Samarreta', folderId: 'f-mercat', updatedAt: '2026-01-01T09:00:00Z' },
    { id: 'a1', title: 'Apunt', folderId: 'f-notes', updatedAt: '2026-01-01T08:00:00Z' }
  ],
  noteFolders: [],
  buit: []
}));

vi.mock('./NotesContext', async (importOriginal) => ({
  ...await importOriginal(),
  useNotes: () => ({
    notes: dades.notes, noteFolders: dades.noteFolders, status: 'ready', canCreate: true, notesComplete: true,
    obriConfiguracioNotes: () => {}, creaNota: async () => ({ id: 'nova' })
  })
}));
vi.mock('./NotesDataContext.jsx', () => ({ useNotesData: () => ({ activate: () => () => {}, config: { dataMode: 'seed' } }) }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actor: { tipus: 'entitat', id: 'socdepoble' }, memberships: [] }) }));
vi.mock('../mur/MurContext', () => ({ useMur: () => ({ sortedFeedPosts: dades.buit, sortedEvents: dades.buit, sortedMarketItems: dades.buit }) }));
vi.mock('./NotesDetail.jsx', () => ({
  default: ({ activeNote, seccio }) => <p data-testid="detall" data-seccio={seccio ?? 'cap'}>{activeNote?.id ?? 'cap'}</p>
}));
vi.mock('./NotaFitxa.jsx', () => ({
  NotaFitxa: ({ item, active, onSelect }) => (
    <button type="button" className="fitxa-de-prova" aria-current={active ? 'true' : undefined} onClick={onSelect}>{item.title}</button>
  )
}));
vi.mock('./ConnexioFitxa.jsx', () => ({ ConnexioFitxa: () => null }));
vi.mock('../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: (ref) => ({ url: ref, status: ref ? 'ready' : 'idle', error: null, isLoading: false, retry: () => {}, cancel: () => {} })
}));

import NotesSection from './NotesSection.jsx';

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  }
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 1400 });
});
afterEach(() => cleanup());

const munta = (ruta) => render(<MemoryRouter rutaInicial={ruta}><NotesSection /></MemoryRouter>);
const detall = () => screen.getByTestId('detall');
const rail = () => screen.getByRole('navigation', { name: 'CARPETES' });

test('Bloc 3.9 · carpeta Mercat: el detall de la nota no rep cap secció (cap peu a l’editor)', () => {
  munta('/notes?carpeta=f-mercat&nota=m1');
  expect(detall().textContent).toBe('m1');
  expect(detall().dataset.seccio).toBe('cap');
});

test('Bloc 3.9 · l’entrada nua de /notes (la primera carpeta, Mur): cap secció', () => {
  munta('/notes');
  expect(detall().textContent).toBe('n1');
  expect(detall().dataset.seccio).toBe('cap');
});

test('Bloc 3.9 · d’una carpeta sense secció a Mercat: el detall continua sense secció', () => {
  munta('/notes?carpeta=f-notes&nota=a1');
  expect(detall().dataset.seccio).toBe('cap');
  fireEvent.click(within(rail()).getByRole('button', { name: 'Mercat' }));
  expect(detall().textContent).toBe('m1');
  expect(detall().dataset.seccio).toBe('cap');
});
