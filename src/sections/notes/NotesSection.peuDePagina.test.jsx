/* Esmena 2 del pla 261007_1645 (ordre del Mestre, 261007: «En seleccionar la
   carpeta 'Mur' o 'Mercat' i el perfil 'Sóc de Poble', la part inferior de la
   nota hauria de llistar totes les notícies/productes ja publicades en eixe
   context per al perfil actiu») · El Bloc passa al detall la secció de la
   carpeta triada (seccioDeCarpeta de categoriaBase, la mateixa de la nota
   preparada): Mur, Mercat o Esdeveniments, i cap en una altra carpeta.
   NotesEditor en fa el peu (NotesEditor.peuDePagina.test.jsx). Router en
   memòria i espai de treball de veres; el detall, simulat. */
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

test('carpeta Mercat: el detall rep la secció «mercat»', () => {
  munta('/notes?carpeta=f-mercat&nota=m1');
  expect(detall().textContent).toBe('m1');
  expect(detall().dataset.seccio).toBe('mercat');
});

test('l’entrada nua de /notes (la primera carpeta, Mur): «mur»', () => {
  munta('/notes');
  expect(detall().textContent).toBe('n1');
  expect(detall().dataset.seccio).toBe('mur');
});

test('una carpeta sense secció (Altres notes): cap secció, i canviar de carpeta la segueix', () => {
  munta('/notes?carpeta=f-notes&nota=a1');
  expect(detall().dataset.seccio).toBe('cap');
  fireEvent.click(within(rail()).getByRole('button', { name: 'Mercat' }));
  expect(detall().textContent).toBe('m1');
  expect(detall().dataset.seccio).toBe('mercat');
});
