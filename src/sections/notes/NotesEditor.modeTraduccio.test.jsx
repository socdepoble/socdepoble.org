/* R51 (P0-46 / IDEA-177), fase A · NotesEditor posa el selector del mode de
   traducció a la ranura `revisioEdicioAvancada` (dins de l'«Edició
   avançada»), darrere de la revisora editorial: cap canvi a DocumentEditor ni
   a la closca. L'arnés de NotesEditor.revisorEditorial.test.jsx. */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ adapter: null, extra: {}, sessio: { currentUser: { id: 'U' } }, feedPosts: [] }));
vi.mock('./NotesContext', () => ({
  useNotes: () => ({
    noteFolders: [], t: (_clau, text) => text, config: { tenantId: '00000000-0000-4000-8000-0000000000a1' },
    workspaceKey: 'a', notes: [], notesComplete: true, setLocalNoteField: () => {}, ...mocks.extra
  }),
  etiquetesDeNota: () => []
}));
vi.mock('./useEstatDesamentNota.js', async (importOriginal) => ({
  ...(await importOriginal()),
  useEstatDesamentNota: () => ({ estat: 'net', problema: null, quarantena: [] })
}));
vi.mock('../../components/universal/DocumentEditor', () => ({ DocumentEditor: ({ adapter }) => { mocks.adapter = adapter; return null; } }));
vi.mock('../../data/backendPort.js', () => ({ uploadToStorage: vi.fn(), teCapacitat: () => true }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actor: { tipus: 'persona', id: 'U', nom: 'Pepa' }, actorId: 'U', memberships: [] }) }));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => ({ agents: [], towns: [], pages: [] }) }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => mocks.sessio, ESTAT: { DINS: 'dins' } }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('../../app/contexts/UIContext.jsx', async (importOriginal) => ({
  ...(await importOriginal()),
  useUIStateOpcional: () => null
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../mur/MurContext', () => ({ useMur: () => ({ status: 'ready', feedPosts: mocks.feedPosts, events: [], marketItems: [] }) }));
import NotesEditor from './NotesEditor.jsx';
import { llegeixModeTraduccio } from '../../components/universal/traduccio/modesTraduccioLocals.js';

const NOTA = Object.freeze({ id: 'n-r51', title: 'Crònica', content: '<p>Cos</p>', folderId: 'f-mur' });

beforeEach(() => {
  mocks.adapter = null;
  mocks.extra = {};
  mocks.sessio = { currentUser: { id: 'U' } };
  mocks.feedPosts = [];
  window.localStorage.clear();
});
afterEach(cleanup);

const ranura = () => render(mocks.adapter.revisioEdicioAvancada).container;

test('la ranura porta la revisora i, darrere, el bloc «Traducció»; cap prop nova a l’editor', () => {
  render(<NotesEditor activeNote={NOTA} />);
  expect('traduccio' in mocks.adapter).toBe(false);
  const cont = ranura();
  const revisora = cont.querySelector('[data-sdp-revisor-editorial-node0="true"]');
  const bloc = screen.getByRole('group', { name: 'Traducció' });
  expect(revisora).not.toBeNull();
  expect(revisora.compareDocumentPosition(bloc) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

test('una nota pròpia amb sessió: el mode es pot triar i es guarda en este dispositiu', () => {
  render(<NotesEditor activeNote={NOTA} />);
  ranura();
  act(() => { fireEvent.click(screen.getByRole('radio', { name: /Sense traducció/ })); });
  expect(llegeixModeTraduccio('n-r51')).toEqual({ translation_mode: 'none', source_language: 'ca' });
});

test('una publicació d’altri (motiuModeTraduccio de PublicacioEditable): desactivat, amb el motiu', () => {
  mocks.extra = { motiuModeTraduccio: 'Esta publicació la signa una altra persona.' };
  render(<NotesEditor activeNote={NOTA} />);
  ranura();
  expect(screen.getByRole('radio', { name: /Sense traducció/ }).closest('fieldset').disabled).toBe(true);
  expect(screen.getByText('Esta publicació la signa una altra persona.')).toBeTruthy();
});

test('sense sessió o en només lectura, desactivat amb el motiu general', () => {
  mocks.extra = { nomesLectura: true };
  render(<NotesEditor activeNote={NOTA} />);
  ranura();
  expect(screen.getByLabelText('Llengua original').disabled).toBe(true);
  expect(screen.getByText(/Només qui l’ha escrita/)).toBeTruthy();
});

/* R51V-02 · Publicar s'emporta el mode d'este dispositiu: el document que
   arriba a publishNote el porta (NotesContext el posa al payload). */
test('publicar passa a publishNote el document amb el mode i la llengua d’este dispositiu', async () => {
  const publishNote = vi.fn().mockResolvedValue(true);
  mocks.extra = { publishNote, compartirNota: vi.fn() };
  render(<NotesEditor activeNote={NOTA} />);
  ranura();
  act(() => { fireEvent.click(screen.getByRole('radio', { name: /Sense traducció/ })); });
  act(() => { fireEvent.change(screen.getByLabelText('Llengua original'), { target: { value: 'en' } }); });
  await act(async () => { await mocks.adapter.visibilitat.onTria(true, { ...NOTA }); });
  expect(publishNote).toHaveBeenCalledTimes(1);
  expect(publishNote.mock.calls[0][0]).toMatchObject({ id: 'n-r51', title: 'Crònica', translation_mode: 'none', source_language: 'en' });
});

test('sense mode en este dispositiu, el document va tal qual (publishNote conserva el de la fila publicada)', async () => {
  const publishNote = vi.fn().mockResolvedValue(true);
  mocks.extra = { publishNote, compartirNota: vi.fn() };
  render(<NotesEditor activeNote={NOTA} />);
  const doc = { ...NOTA };
  await act(async () => { await mocks.adapter.visibilitat.onTria(true, doc); });
  expect(publishNote.mock.calls[0][0]).toBe(doc);
});

test('el selector parteix del mode que ja porta la fila publicada d’esta nota', () => {
  mocks.feedPosts = [{ id: 'fila-r51', title: 'Crònica', translation_mode: 'none', source_language: 'gl' }];
  render(<NotesEditor activeNote={{ ...NOTA, isPublished: true, publishedSubmissionId: 'fila-r51' }} />);
  ranura();
  expect(screen.getByRole('radio', { name: /Sense traducció/ }).checked).toBe(true);
  expect(screen.getByLabelText('Llengua original').value).toBe('gl');
  expect(screen.getByText('Es guarda en este dispositiu i viatja amb la publicació quan la publiques o l’actualitzes al Mur.')).toBeTruthy();
});

test('una revisió editorial (modeTraduccioNomesLocal de PublicacioEditable) diu que només es guarda en este dispositiu', () => {
  mocks.extra = { modeTraduccioNomesLocal: true };
  render(<NotesEditor activeNote={NOTA} />);
  ranura();
  expect(screen.getByText(/només es guarda en este dispositiu, perquè la revisió editorial encara no el pot portar/)).toBeTruthy();
});
