/* Bloc 3.8 del Gauntlet (261016) · La icona «Emojis» de la capçalera de NOTES
   amb l'espai de treball de veres i el router en memòria de veres:
     · és dins de la capçalera de NOTES, després del títol i abans de
       «Replegar NOTES» (entre NOTES i el [|<]); al Snippet (mode desa), no;
     · obri el diàleg «Emojis» amb la graella (el catàleg arriba a demanda);
     · amb un editor que es pot escriure, l'emoji s'hi escriu al cursor quan
       el diàleg ja s'ha tancat, i res al porta-retalls;
     · sense cap editor on escriure, es copia dins del mateix clic i, ja
       tancat el diàleg, el toast «Copiat…».
   El detall és un doble que es registra al canal com ho fa DocumentEditor
   (registraInsercio). Dades sintètiques. */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import { SmilePlus } from 'lucide-react';
import { MemoryRouter } from '../../app/contexts/RouterContext';

const dades = vi.hoisted(() => ({ notes: [], buit: [], editor: null, toast: null }));

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
/* El Snippet (mode desa) pregunta per la sessió i per l'amfitrió, com a NotesSection.desa.test.jsx. */
vi.mock('../../app/contexts/SessionContext', () => ({ useSession: () => ({ currentUser: { id: 'usuari-sintetic' } }) }));
vi.mock('../../app/contexts/UIContext', async (importOriginal) => ({
  ...await importOriginal(),
  useUIState: () => ({ externalConfig: {} })
}));
vi.mock('../mur/MurContext', () => ({ useMur: () => ({ sortedFeedPosts: dades.buit, sortedEvents: dades.buit, sortedMarketItems: dades.buit }) }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: (...args) => dades.toast(...args) }) }));
/* El detall: un editor de mentides que es registra al canal com DocumentEditor. */
vi.mock('./NotesDetail.jsx', async () => {
  const { useEffect } = await import('react');
  const { useCanalEmojis } = await import('./canalEmojis.js');
  return {
    default: function DetallDeProva({ activeNote }) {
      const canal = useCanalEmojis();
      useEffect(() => {
        if (!canal || !dades.editor) return undefined;
        return canal.registra(dades.editor.inserix, { pot: dades.editor.pot });
      }, [canal]);
      return <p data-testid="detall">{activeNote?.id ?? 'cap'}</p>;
    }
  };
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
/* El catàleg, sintètic: el mateix camí d'import() que fa servir el Bloc. El ©
   sense selector de presentació fa d'emoji que este navegador no reconeix
   (emojiSol el rebutja en qualsevol motor). */
vi.mock('../disseny/cataleg/dades/emojisUnicode18.js', () => ({
  GRUPS_EMOJIS: [{ id: 'menjar', nom: 'Menjar i beguda', emojis: [['1F345', '🍅', 'tomato'], ['1F33D', '🌽', 'ear of corn'], ['00A9', '©', 'copyright']] }]
}));

import NotesSection from './NotesSection.jsx';

const NOTA = Object.freeze({ id: 'a1', title: 'Primera', folderId: 'f-mur', updatedAt: '2026-01-03T09:00:00Z' });

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  }
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 1400 });
});
let escriu;
beforeEach(() => {
  dades.notes = [NOTA];
  dades.toast = vi.fn();
  escriu = { pot: vi.fn(() => true), inserix: vi.fn(() => true) };
  dades.editor = escriu;
  sessionStorage.clear();
});
afterEach(() => {
  cleanup();
  delete globalThis.navigator.clipboard;
});

const munta = (ruta = '/notes?carpeta=f-mur&nota=a1') => render(
  <MemoryRouter rutaInicial={ruta}>
    <NotesSection />
  </MemoryRouter>
);
const capcaleraDeNotes = (container) => container.querySelector('#app-grid-list .app-grid-col-header');
const dialegEmojis = () => screen.queryByRole('dialog', { name: 'Emojis' });
/* El porta-retalls del navegador (jsdom no en porta). */
const portaretalls = (writeText) => Object.defineProperty(globalThis.navigator, 'clipboard', { configurable: true, value: { writeText } });

test('la icona «Emojis» és a la capçalera de NOTES, entre el títol i «Replegar NOTES»', () => {
  const { container } = munta();
  const capcalera = capcaleraDeNotes(container);
  const titol = capcalera.querySelector('.app-grid-col-header__plec--fix');
  expect(titol.textContent).toBe('NOTES');
  const emojis = within(capcalera).getByRole('button', { name: 'Emojis' });
  const replegar = within(capcalera).getByRole('button', { name: 'Replegar NOTES' });
  // Germanes dins de les accions de la capçalera, en este ordre: títol, Emojis, [|<].
  expect(emojis.parentElement).toBe(replegar.parentElement);
  expect(emojis.parentElement.className).toBe('app-grid-col-header__accions');
  expect(titol.compareDocumentPosition(emojis) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(emojis.compareDocumentPosition(replegar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(emojis.className).toBe('app-grid-col-header__accio-icon');
  // La icona és SmilePlus de lucide-react (24 px, com el chevron de CARPETES).
  const referencia = render(<SmilePlus size={24} />).container.querySelector('svg');
  expect(emojis.querySelector('svg').innerHTML).toBe(referencia.innerHTML);
  expect(emojis.querySelector('svg').getAttribute('width')).toBe('24');
  expect(emojis.getAttribute('title')).toBe('Emojis');
  // El diàleg és tancat fins que s'obri.
  expect(dialegEmojis()).toBeNull();
});

test('al Snippet (mode desa) no hi ha ni la icona ni el diàleg', () => {
  const { container } = munta('/notes?mode=desa&url=https%3A%2F%2Fexemple.org%2Fa&titol=A');
  expect(screen.queryByRole('button', { name: 'Emojis' })).toBeNull();
  expect(container.querySelector('dialog .sdp-graella-emojis')).toBeNull();
  expect(screen.queryByRole('heading', { name: 'Emojis', hidden: true })).toBeNull();
});

test('obri el diàleg «Emojis» amb la graella; amb un editor on escriure, l’emoji s’hi escriu en tancar-se', async () => {
  const writeText = vi.fn(() => Promise.resolve());
  portaretalls(writeText);
  munta();
  fireEvent.click(screen.getByRole('button', { name: 'Emojis' }));
  const dialeg = dialegEmojis();
  expect(dialeg).toBeTruthy();
  expect(escriu.pot).toHaveBeenCalledTimes(1);
  expect(within(dialeg).getByText('Toca un emoji i s’escriurà on tenies el cursor, a la nota oberta.')).toBeTruthy();
  fireEvent.click(await within(dialeg).findByRole('button', { name: 'tomato' }));
  expect(escriu.inserix).toHaveBeenCalledWith('🍅');
  expect(dialegEmojis()).toBeNull();
  expect(writeText).not.toHaveBeenCalled();
  expect(dades.toast).not.toHaveBeenCalled();
});

test('«Tancar» (l’única eixida amb eixe nom) tanca sense escriure ni copiar res', async () => {
  const writeText = vi.fn(() => Promise.resolve());
  portaretalls(writeText);
  munta();
  fireEvent.click(screen.getByRole('button', { name: 'Emojis' }));
  const dialeg = dialegEmojis();
  await within(dialeg).findByRole('button', { name: 'tomato' });
  const tancar = within(dialeg).getAllByRole('button', { name: 'Tancar' });
  expect(tancar).toHaveLength(1);
  fireEvent.click(tancar[0]);
  expect(dialegEmojis()).toBeNull();
  expect(escriu.inserix).not.toHaveBeenCalled();
  expect(writeText).not.toHaveBeenCalled();
  expect(dades.toast).not.toHaveBeenCalled();
});

test('sense cap editor on escriure, copia dins del clic i, ja tancat, el toast «Copiat…»', async () => {
  dades.editor = null;
  let resol;
  const writeText = vi.fn(() => new Promise((r) => { resol = r; }));
  portaretalls(writeText);
  munta();
  fireEvent.click(screen.getByRole('button', { name: 'Emojis' }));
  const dialeg = dialegEmojis();
  expect(within(dialeg).getByText(/per copiar-lo al porta-retalls/)).toBeTruthy();
  fireEvent.click(await within(dialeg).findByRole('button', { name: 'ear of corn' }));
  // Dins del mateix clic (Safari 16), abans de cap espera.
  expect(writeText).toHaveBeenCalledWith('🌽');
  expect(dialegEmojis()).toBeNull();
  expect(dades.toast).not.toHaveBeenCalled();
  await act(async () => { resol(); });
  expect(dades.toast).toHaveBeenCalledWith('Copiat 🌽 al porta-retalls: ja el pots apegar.', 'success');
});

test('un editor que no es pot escriure (el detall tapat o en lectura) també copia; sense porta-retalls, ho diu', async () => {
  escriu.pot.mockReturnValue(false);
  portaretalls(undefined);
  munta();
  fireEvent.click(screen.getByRole('button', { name: 'Emojis' }));
  fireEvent.click(await within(dialegEmojis()).findByRole('button', { name: 'tomato' }));
  expect(escriu.inserix).not.toHaveBeenCalled();
  expect(dialegEmojis()).toBeNull();
  expect(dades.toast).toHaveBeenCalledWith('La còpia no està disponible en aquest navegador.', 'error');
});

/* Correcció de la revisió adversarial (261016; encàrrec A1) · L'avís per als
   glifs que este navegador no pinta (emojiSol), també en mode cos. */
test('un emoji que este navegador no reconeix ni s’escriu ni es copia: el diàleg es queda obert i ho diu', async () => {
  const writeText = vi.fn(() => Promise.resolve());
  portaretalls(writeText);
  munta();
  fireEvent.click(screen.getByRole('button', { name: 'Emojis' }));
  const dialeg = dialegEmojis();
  fireEvent.click(await within(dialeg).findByRole('button', { name: 'copyright' }));
  expect(dialegEmojis()).toBe(dialeg);
  expect(within(dialeg).getByText('Este navegador encara no reconeix © com a emoji: tria’n un altre.')).toBeTruthy();
  expect(escriu.inserix).not.toHaveBeenCalled();
  expect(writeText).not.toHaveBeenCalled();
  expect(dades.toast).not.toHaveBeenCalled();
  // Un de reconegut, després: s'escriu i el diàleg es tanca.
  fireEvent.click(within(dialeg).getByRole('button', { name: 'tomato' }));
  expect(escriu.inserix).toHaveBeenCalledWith('🍅');
  expect(dialegEmojis()).toBeNull();
  // En tornar-lo a obrir, cap avís vell.
  fireEvent.click(screen.getByRole('button', { name: 'Emojis' }));
  await within(dialegEmojis()).findByRole('button', { name: 'tomato' });
  expect(within(dialegEmojis()).queryByText(/encara no reconeix/)).toBeNull();
});

test('si en tancar-se l’editor ja no pot escriure, la còpia de reserva i el seu toast', async () => {
  escriu.inserix.mockReturnValue(false);
  const writeText = vi.fn(() => Promise.reject(new Error('NotAllowedError')));
  portaretalls(writeText);
  munta();
  fireEvent.click(screen.getByRole('button', { name: 'Emojis' }));
  fireEvent.click(await within(dialegEmojis()).findByRole('button', { name: 'tomato' }));
  expect(escriu.inserix).toHaveBeenCalledWith('🍅');
  expect(writeText).toHaveBeenCalledWith('🍅');
  await act(async () => {});
  expect(dades.toast).toHaveBeenCalledWith('No s’ha pogut copiar l’emoji. Torna-ho a provar.', 'error');
});
