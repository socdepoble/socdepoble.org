/* D-7 (pla 261101_1246; P1-71) · El Bloc (/notes) FORA d'IdentitatProvider
   (una recàrrega en calent amb un context vell), amb sessió: NotesSection,
   NotaFitxa i la resta de la ruta prenen la reserva anònima de només lectura
   (useIdentitatOReserva.js) en lloc del pet. Ni CREAR NOTA ni nota preparada;
   la Card «Bloc de notes» hi és, triada i a la primera fila de «Tot» (D-4).
   IdentitatContext.jsx i NotaFitxa.jsx són els de veres; el proveïdor de dades
   no diu res de la lectura: ho decidix la identitat. Dades sintètiques. */
import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext';

const dades = vi.hoisted(() => ({ buit: [], config: { dataMode: 'remote' }, detalls: [] }));
vi.mock('./NotesContext', async (importOriginal) => ({
  ...await importOriginal(),
  useNotes: () => ({
    notes: dades.buit, noteFolders: dades.buit, status: 'ready', canCreate: true, teSessio: true,
    notesComplete: true, config: dades.config, obriConfiguracioNotes: () => {}, informaError: () => {},
    creaNota: vi.fn(), setLocalNoteField: vi.fn(), resolveNote: vi.fn(async () => ({ status: 'not-found' }))
  })
}));
vi.mock('./NotesDataContext.jsx', () => ({ useNotesData: () => ({ activate: () => () => {}, config: dades.config }) }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ generacio: 1, currentUser: { id: 'persona-a' }, estat: 'dins' }) }));
vi.mock('../mur/MurContext', () => ({ useMur: () => ({ status: 'ready', sortedFeedPosts: dades.buit, sortedEvents: dades.buit, sortedMarketItems: dades.buit }) }));
vi.mock('./NotesDetail.jsx', () => ({
  default: ({ activeNote }) => <p data-testid="detall">{activeNote === null ? 'card' : (activeNote?.id ?? 'cap')}</p>
}));
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
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

test('sense IdentitatProvider i amb sessió: no llança, cap CREAR NOTA ni nota preparada, i la Card és la primera fila de «Tot»', () => {
  const errors = vi.spyOn(console, 'error');
  render(<MemoryRouter rutaInicial="/notes"><NotesSection /></MemoryRouter>);
  const columna = screen.getByRole('complementary', { name: 'NOTES' });
  expect(screen.queryByRole('button', { name: 'CREAR NOTA' })).toBeNull();
  expect(within(columna).queryByRole('button', { name: /Nota sense títol/ })).toBeNull();
  // Les files de la llista (la fitxa de veres porta llistes pròpies dins).
  const files = [...columna.querySelector('ul.sdp-gestor-llista').children];
  expect(files).toHaveLength(1);
  expect(files[0].textContent).toContain('Bloc de notes');
  expect(screen.getByTestId('detall').textContent).toBe('card');
  expect(errors).not.toHaveBeenCalled();
});
