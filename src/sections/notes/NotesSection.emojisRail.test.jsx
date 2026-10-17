/* Bloc 3.8 del Gauntlet (261016) · El resultat visible de l'assignació des de
   la ranura d'emoticona, de punta a punta: NotesSection, NotesDetail i
   NotesEditor de veres, amb un Bloc de mentides que guarda les notes en
   memòria (setLocalNoteField de veres per a la vista). Un clic a la graella
   del DialegEmoticona posa l'emoji a la barra taronja (l'emoticona crua de
   l'adaptador), a la fitxa de la llista i al rail de la llista plegada.
   El DocumentEditor és un doble: pinta la ranura i el que la barra taronja
   rebria. Dades sintètiques. */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext';

const dades = vi.hoisted(() => ({ notes: [], oients: new Set(), buit: [] }));

vi.mock('./NotesContext', async (importOriginal) => {
  const real = await importOriginal();
  const { useSyncExternalStore } = await import('react');
  const subscriu = (oient) => { dades.oients.add(oient); return () => dades.oients.delete(oient); };
  const llig = () => dades.notes;
  const setLocalNoteField = (id, camp, valor) => {
    dades.notes = dades.notes.map((nota) => (String(nota.id) === String(id) ? { ...nota, [camp]: valor } : nota));
    dades.oients.forEach((oient) => oient());
  };
  return {
    ...real,
    useNotes: () => ({
      notes: useSyncExternalStore(subscriu, llig, llig), noteFolders: dades.buit, status: 'ready', canCreate: true, teSessio: true,
      notesComplete: true, config: { dataMode: 'remote' }, obriConfiguracioNotes: () => {}, informaError: () => {},
      creaNota: async (entrada) => entrada, setLocalNoteField, saveNoteField: () => {}, t: (_clau, text) => text, workspaceKey: 'k'
    })
  };
});
vi.mock('./NotesDataContext.jsx', () => ({
  useNotesData: () => ({ activate: () => () => {}, config: { dataMode: 'remote' }, resolveNote: async () => ({}), workspaceKey: 'k' })
}));
vi.mock('./useEstatDesamentNota.js', async (importOriginal) => ({
  ...await importOriginal(),
  useEstatDesamentNota: () => Object.freeze({ estat: 'net', problema: null, quarantena: Object.freeze([]) })
}));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({
  useIdentitat: () => ({ actor: { tipus: 'persona', id: 'uuid-prova', rol: 'persona' }, actorId: 'uuid-prova', memberships: [] })
}));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => ({ agents: [], towns: [], pages: [] }) }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ currentUser: { id: 'u' } }), ESTAT: { DINS: 'dins' } }));
vi.mock('../mur/MurContext', () => ({
  useMur: () => ({ sortedFeedPosts: dades.buit, sortedEvents: dades.buit, sortedMarketItems: dades.buit, feedPosts: dades.buit, events: dades.buit, marketItems: dades.buit })
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: () => {} }) }));
/* L'editor: el que pintaria la barra taronja i la botonera de veres de
   l'adaptador. Gauntlet 261016 (Bloc 3.9; ordre del Mestre: fora la ploma
   central de la barra taronja) · La ranura ja no és a la barra (cap
   onObriEmoticona): el diàleg s'obri amb el botó «Emojis XL» de la botonera,
   dins de l'«Edició avançada». */
vi.mock('../../components/universal/DocumentEditor', () => ({
  DocumentEditor: ({ adapter }) => (
    <div>
      <output data-testid="barra-taronja">{adapter.emoticona}</output>
      {adapter.onObriEmoticona ? <button type="button" onClick={adapter.onObriEmoticona}>Ranura d’emoticona</button> : null}
      <div data-testid="edicio-avancada">{adapter.classificacio}</div>
    </div>
  )
}));
/* La fitxa de la llista mostra la icona del model de vista (item.icon). */
vi.mock('./NotaFitxa.jsx', () => ({
  NotaFitxa: ({ item, active, onSelect }) => (
    <button type="button" aria-current={active ? 'true' : undefined} onClick={onSelect}>
      <span data-testid={`icona-${item.id}`}>{item.icon}</span>{item.title}
    </button>
  )
}));
vi.mock('./ConnexioFitxa.jsx', () => ({ ConnexioFitxa: () => null }));
vi.mock('../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: (ref) => ({ url: ref, status: ref ? 'ready' : 'idle', error: null, isLoading: false, retry: () => {}, cancel: () => {} })
}));
vi.mock('../disseny/cataleg/dades/emojisUnicode18.js', () => ({
  GRUPS_EMOJIS: [{ id: 'menjar', nom: 'Menjar i beguda', emojis: [['1F345', '🍅', 'tomato']] }]
}));

import NotesSection from './NotesSection.jsx';

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  }
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 1400 });
});
beforeEach(() => {
  dades.notes = [{ id: 'a1', title: 'Primera', folderId: 'f-mur', updatedAt: '2026-01-03T09:00:00Z' }];
  dades.oients.clear();
  sessionStorage.clear();
});
afterEach(() => cleanup());

test('triar a la graella del botó «Emojis XL» posa l’emoji a la barra taronja, a la fitxa i al rail', async () => {
  render(
    <MemoryRouter rutaInicial="/notes?carpeta=f-mur&nota=a1">
      <NotesSection />
    </MemoryRouter>
  );
  // Abans: cap emoticona triada (barra buida) i, a la llista, la ploma per defecte.
  expect(screen.getByTestId('barra-taronja').textContent).toBe('');
  expect(screen.getByTestId('icona-a1').textContent).toBe('🪶');
  // Bloc 3.9 · Cap ranura a la barra taronja: només el botó de la botonera.
  expect(screen.queryByRole('button', { name: 'Ranura d’emoticona' })).toBeNull();
  fireEvent.click(within(screen.getByTestId('edicio-avancada')).getByRole('button', { name: /^Emojis XL/ }));
  const dialeg = screen.getByRole('dialog', { name: 'Emoticona del document' });
  fireEvent.click(await within(dialeg).findByRole('button', { name: 'tomato' }));
  expect(screen.queryByRole('dialog', { name: 'Emoticona del document' })).toBeNull();
  expect(dades.notes[0].icon).toBe('🍅');
  expect(screen.getByTestId('barra-taronja').textContent).toBe('🍅');
  expect(screen.getByTestId('icona-a1').textContent).toBe('🍅');
  // El rail de la llista plegada porta el mateix glif.
  act(() => { fireEvent.click(screen.getByRole('button', { name: 'Replegar NOTES' })); });
  const rail = screen.getByRole('navigation', { name: 'NOTES' });
  expect(within(rail).getByRole('button', { name: 'Primera' }).textContent).toContain('🍅');
});
