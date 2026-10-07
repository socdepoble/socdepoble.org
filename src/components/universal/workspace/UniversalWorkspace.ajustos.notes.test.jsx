/* Llei de la Roda Dentada (ordre del Mestre, 261007) · El Bloc de Notes amb
   l'espai de treball de veres i el router en memòria de veres (com
   NotesSection.mestreDetall.test.jsx): les carpetes de sistema (Mur, Mercat,
   Pobles…, NOTE_FOLDERS_SEED) porten la seua icona de Lucide i no s'esborren
   mai, però la roda dentada de la navegació les amaga o les mostra. En
   «ample» la navegació del Bloc arrenca plegada en rail: la roda hi és, al
   costat de «Configurar categories». La preferència es desa a l'espai
   'notes' (la clau del seu mestre-detall). Dades sintètiques. */
import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../../app/contexts/RouterContext';
import { NOTE_FOLDERS_SEED } from '../../../data/appSeed.js';
import { delVal, getVal, setVal } from '../../../config/storage.js';
import { CLAU_CARPETES_VISIBLES, _reiniciaCarpetesVisibles } from './carpetesVisibles.js';

const dades = vi.hoisted(() => ({ notes: [], buit: [] }));

vi.mock('../../../sections/notes/NotesContext', async (importOriginal) => ({
  ...await importOriginal(),
  useNotes: () => ({
    notes: dades.notes, noteFolders: dades.buit, status: 'ready', canCreate: true, teSessio: true,
    notesComplete: true, config: { dataMode: 'remote' }, obriConfiguracioNotes: () => {}, informaError: () => {},
    creaNota: async (entrada) => entrada, setLocalNoteField: () => {}
  })
}));
vi.mock('../../../sections/notes/NotesDataContext.jsx', () => ({ useNotesData: () => ({ activate: () => () => {}, config: { dataMode: 'remote' } }) }));
vi.mock('../../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actor: { tipus: 'persona', id: 'uuid-prova', rol: 'persona' }, memberships: [] }) }));
vi.mock('../../../sections/mur/MurContext', () => ({ useMur: () => ({ sortedFeedPosts: dades.buit, sortedEvents: dades.buit, sortedMarketItems: dades.buit }) }));
vi.mock('../NotificationContext.jsx', () => ({ useToast: () => ({ showToast: () => {} }) }));
vi.mock('../../../sections/notes/NotesDetail.jsx', () => ({ default: ({ activeNote }) => <p>{activeNote?.title || 'cap'}</p> }));
vi.mock('../../../sections/notes/NotaFitxa.jsx', () => ({
  NotaFitxa: ({ item, active, onSelect }) => (
    <button type="button" aria-current={active ? 'true' : undefined} onClick={onSelect}>{item.title}</button>
  )
}));
vi.mock('../../../sections/notes/ConnexioFitxa.jsx', () => ({ ConnexioFitxa: () => null }));
vi.mock('../../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: (ref) => ({ url: ref, status: ref ? 'ready' : 'idle', error: null, isLoading: false, retry: () => {}, cancel: () => {} })
}));

import NotesSection from '../../../sections/notes/NotesSection.jsx';

/* La secció de veres i el diàleg obert: amb la màquina carregada passava
   dels 5 s per defecte. */
vi.setConfig({ testTimeout: 30000 });

const NOTA = Object.freeze({ id: 'a1', title: 'Primera', folderId: 'f-mercat', updatedAt: '2026-01-03T09:00:00Z' });
const nom = (id) => NOTE_FOLDERS_SEED.find((carpeta) => carpeta.id === id).name;

beforeEach(() => {
  dades.notes = [NOTA];
  sessionStorage.clear();
  delVal(CLAU_CARPETES_VISIBLES);
  _reiniciaCarpetesVisibles();
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delVal(CLAU_CARPETES_VISIBLES);
  _reiniciaCarpetesVisibles();
});

const RODA = 'Configuració de l’espai de treball';

test('Notes · la roda del rail obri «Carpetes a la vista»: les carpetes de sistema amb la seua icona; amagar-ne una la lleva del rail i no l’esborra', () => {
  const { container } = render(<MemoryRouter rutaInicial="/notes"><NotesSection /></MemoryRouter>);
  const navegacio = container.querySelector('#app-grid-sidebar');
  const rail = () => within(navegacio).getByRole('navigation', { name: 'CARPETES' });
  const carpetesDelRail = () => within(rail()).getAllByRole('button').map((b) => b.getAttribute('aria-label'));
  expect(carpetesDelRail()).toContain(nom('f-mercat'));
  /* La roda, al costat de «Configurar categories», a la capçalera del rail. */
  expect(within(navegacio).getByRole('button', { name: 'Configurar categories' })).toBeTruthy();
  const roda = within(navegacio).getByRole('button', { name: RODA });
  roda.focus();
  fireEvent.click(roda);
  const dialeg = within(screen.getByRole('dialog', { name: RODA }));
  expect(dialeg.getByRole('heading', { level: 3, name: 'Carpetes a la vista' })).toBeTruthy();
  for (const id of ['f-mur', 'f-mercat', 'f-pobles', 'f-media', 'f-events', 'f-mapa', 'f-connectats', 'f-notes']) {
    const interruptor = dialeg.getByRole('switch', { name: `Vull vore ${nom(id)}` });
    expect(interruptor.getAttribute('aria-checked')).toBe('true');
    expect(interruptor.closest('.sdp-interruptor').querySelector('.sdp-workspace-settings__glif svg')).toBeTruthy();
  }

  fireEvent.click(dialeg.getByRole('switch', { name: `Vull vore ${nom('f-mercat')}` }));
  expect(carpetesDelRail()).not.toContain(nom('f-mercat'));
  expect(carpetesDelRail()).toContain(nom('f-mur'));
  expect(getVal(CLAU_CARPETES_VISIBLES, null)).toEqual({ v: 1, espais: { notes: { 'f-mercat': false } } });
  fireEvent.click(dialeg.getByRole('button', { name: 'Fet' }));
  expect(document.activeElement).toBe(roda);
  /* La nota de Mercat continua a la llista de «Tot»: amagar no esborra res. */
  fireEvent.click(within(navegacio).getByRole('button', { name: 'Expandir CARPETES' }));
  fireEvent.click(within(navegacio).getByRole('button', { name: 'Tot' }));
  expect(within(container.querySelector('#app-grid-list')).getByRole('button', { name: 'Primera' })).toBeTruthy();
});

/* Correcció R1 del verificador · El Bloc entra a la primera carpeta (Mur,
   model.primeraCarpeta) o a la d'un enllaç. Si la persona l'ha amagada, la
   carpeta activa no pot ser una que no es veu: s'entra a «Tot». */
const amagaMur = () => {
  setVal(CLAU_CARPETES_VISIBLES, { v: 1, espais: { notes: { 'f-mur': false } } });
  _reiniciaCarpetesVisibles();
};
const marcadesDelRail = (navegacio) => within(within(navegacio).getByRole('navigation', { name: 'CARPETES' }))
  .getAllByRole('button')
  .filter((boto) => boto.hasAttribute('aria-current'));

test('Notes · amb Mur (la carpeta d’entrada) amagat, /notes entra a «Tot» i la llista és la de «Tot»', () => {
  amagaMur();
  const { container } = render(<MemoryRouter rutaInicial="/notes"><NotesSection /></MemoryRouter>);
  const navegacio = container.querySelector('#app-grid-sidebar');
  const rail = within(navegacio).getByRole('navigation', { name: 'CARPETES' });
  expect(within(rail).getAllByRole('button').map((b) => b.getAttribute('aria-label'))).not.toContain(nom('f-mur'));
  expect(marcadesDelRail(navegacio)).toEqual([]);
  /* La nota de Mercat és a la llista: no és la d'una carpeta que no es veu. */
  expect(within(container.querySelector('#app-grid-list')).getByRole('button', { name: 'Primera' })).toBeTruthy();
  fireEvent.click(within(navegacio).getByRole('button', { name: 'Expandir CARPETES' }));
  expect(within(navegacio).getByRole('button', { name: 'Tot' }).getAttribute('aria-pressed')).toBe('true');
});

test('Notes · un enllaç a una nota de Mur amb Mur amagat: «Tot», la mateixa nota oberta i la URL intacta', () => {
  dades.notes = [NOTA, { id: 'm1', title: 'Del Mur', folderId: 'f-mur', updatedAt: '2026-01-02T09:00:00Z' }];
  amagaMur();
  const rutes = vi.fn();
  const { container } = render(
    <MemoryRouter rutaInicial="/notes?carpeta=f-mur&nota=m1" onCanvi={rutes}><NotesSection /></MemoryRouter>
  );
  const navegacio = container.querySelector('#app-grid-sidebar');
  expect(marcadesDelRail(navegacio)).toEqual([]);
  const llista = within(container.querySelector('#app-grid-list'));
  expect(llista.getByRole('button', { name: 'Del Mur' }).getAttribute('aria-current')).toBe('true');
  expect(llista.getByRole('button', { name: 'Primera' })).toBeTruthy();
  expect(rutes.mock.calls.map(([ruta]) => ruta)).toEqual(['/notes?carpeta=f-mur&nota=m1']);
  fireEvent.click(within(navegacio).getByRole('button', { name: 'Expandir CARPETES' }));
  expect(within(navegacio).getByRole('button', { name: 'Tot' }).getAttribute('aria-pressed')).toBe('true');
});
