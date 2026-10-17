/* Gauntlet 261016_1530 (Bloc 3.9, Onada 1.5; ordre del Mestre: «Eliminar el
   bloc inferior "Ja publicat al Mur: Amb esta identitat encara no hi ha res
   publicat al Mur" de la vista d'edició») · Deroga a l'editor l'Esmena 2 del
   pla 261007_1645, que posava el peu amb el que l'actor ja tenia publicat
   (PublicacionsDeLActor) i que este fitxer fixava. Es reescriu a propòsit,
   no s'esborra (qualitat.publicacionsActor.test.js el té al cens): ara
   comprova que l'adaptador de l'editor no porta mai ni `peuDePagina` ni
   `etiquetaPeuDePagina`, en cap carpeta, amb cap actor i tampoc si algú encara
   hi passa la `seccio` vella. La lectura d'una publicació del MAS
   (PublicacioDetall) conserva el seu peu: PublicacioDetall.peuDePagina.test.jsx. */
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ adapter: null, identitat: null, currentUser: null }));
vi.mock('./NotesContext', () => ({
  useNotes: () => ({
    noteFolders: [], t: (_clau, text) => text, config: { tenantId: '00000000-0000-4000-8000-0000000000a1' },
    workspaceKey: 'a', notes: [], setLocalNoteField: vi.fn(), notesComplete: true
  }),
  etiquetesDeNota: () => []
}));
vi.mock('./useEstatDesamentNota.js', async (importOriginal) => ({
  ...(await importOriginal()),
  useEstatDesamentNota: () => ({ estat: 'net', problema: null, quarantena: [] })
}));
vi.mock('../../components/universal/DocumentEditor', () => ({ DocumentEditor: ({ adapter }) => { mocks.adapter = adapter; return null; } }));
vi.mock('../../data/backendPort.js', () => ({ uploadToStorage: vi.fn(), teCapacitat: () => true }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => mocks.identitat }));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => ({ agents: [], towns: [], pages: [] }) }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ currentUser: mocks.currentUser }), ESTAT: { DINS: 'dins' } }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../mur/MurContext', () => ({ useMur: () => ({ status: 'ready', feedPosts: [], events: [], marketItems: [] }) }));
import NotesEditor from './NotesEditor.jsx';

const NOTA = { id: 'n7', title: 'Nota', content: '<p>Cos</p>', folderId: 'f-mercat' };
const SDP = { tipus: 'entitat', id: 'socdepoble' };
/* El Foraster de veres: sense sessió (currentUser null), IdentitatContext hi
   posa la persona convidada, amb l'id de convidat (mai buit) i rol 'convidat'. */
const CONVIDAT = Object.freeze({ tipus: 'persona', id: '00000000-0000-4000-8000-0000000c0f1d', rol: 'convidat' });

beforeEach(() => {
  mocks.adapter = null;
  mocks.identitat = { actor: SDP, actorId: 'U', memberships: [] };
  mocks.currentUser = { id: 'U' };
});
afterEach(cleanup);

const senseClausDelPeu = () => {
  expect('peuDePagina' in mocks.adapter).toBe(false);
  expect('etiquetaPeuDePagina' in mocks.adapter).toBe(false);
};

describe('Bloc 3.9 · cap peu «Ja publicat…» a la vista d’edició', () => {
  test.each([
    ['Mur', 'mur', { ...NOTA, folderId: 'f-mur' }],
    ['Mercat', 'mercat', NOTA],
    ['Esdeveniments', 'events', { ...NOTA, folderId: 'f-events' }],
    ['Multimèdia', 'multimedia', NOTA],
    ['sense secció', null, NOTA]
  ])('carpeta %s, actuant com a Sóc de Poble: l’adaptador no porta el peu', (_cas, seccio, nota) => {
    // Una `seccio` que encara arribe per un muntatge vell no fa res.
    render(<NotesEditor activeNote={nota} seccio={seccio} />);
    senseClausDelPeu();
  });

  test('una nota publicada al Mur, que abans s’excloïa del peu: tampoc cap peu', () => {
    render(<NotesEditor activeNote={{ ...NOTA, folderId: 'f-mur', isPublished: true, publishedSubmissionId: 'sub-7' }} seccio="mur" />);
    senseClausDelPeu();
  });

  test.each([
    ['una persona amb sessió', { actor: { tipus: 'persona', id: 'U', nom: 'Pepa' }, actorId: 'U', memberships: [] }, { id: 'U' }],
    ['sense actor', { actor: null, actorId: null, memberships: [] }, { id: 'U' }],
    ['el convidat sense sessió (la còpia de prova)', { actor: CONVIDAT, actorId: CONVIDAT.id, memberships: [] }, null]
  ])('%s: cap peu', (_cas, identitat, currentUser) => {
    mocks.identitat = identitat;
    mocks.currentUser = currentUser;
    render(<NotesEditor activeNote={currentUser ? NOTA : null} seccio="mercat" />);
    senseClausDelPeu();
  });

  test('el muntatge de sempre, sense la prop: cap peu', () => {
    render(<NotesEditor activeNote={NOTA} />);
    senseClausDelPeu();
  });
});
