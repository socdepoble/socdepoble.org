/* Esmena 2 del pla 261007_1645 (ordre del Mestre, 261007: «En seleccionar la
   carpeta 'Mur' o 'Mercat' i el perfil 'Sóc de Poble', la part inferior de la
   nota hauria de llistar totes les notícies/productes ja publicades en eixe
   context per al perfil actiu») · NotesEditor fa el peu de la pàgina amb la
   `seccio` que li passa el Bloc: la clau d'adaptador `peuDePagina`
   (PublicacionsDeLActor, sense la publicació de la mateixa nota) i
   `etiquetaPeuDePagina`. Memoritzat: el mateix node entre pintades, perquè
   l'adaptador no es refaça. Sense secció, en una secció sense històric,
   sense actor o amb el Foraster (el convidat, que porta id), cap clau: el
   DOM de sempre. */
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
import { PublicacionsDeLActor } from '../mur/PublicacionsDeLActor.jsx';

const NOTA = { id: 'n7', title: 'Nota', content: '<p>Cos</p>', folderId: 'f-mercat' };
const SDP = { tipus: 'entitat', id: 'socdepoble' };
/* El Foraster de veres: sense sessió (currentUser null), IdentitatContext hi
   posa la persona convidada, amb l'id de convidat (mai buit) i rol 'convidat'. */
const FORASTER = Object.freeze({ tipus: 'persona', id: '00000000-0000-4000-8000-0000000c0f1d', rol: 'convidat' });

beforeEach(() => {
  mocks.adapter = null;
  mocks.identitat = { actor: SDP, actorId: 'U', memberships: [] };
  mocks.currentUser = { id: 'U' };
});
afterEach(cleanup);

describe('el peu de la pàgina de l’editor', () => {
  test('amb la secció de la carpeta (Mercat) i un actor: PublicacionsDeLActor i el títol de la regió', () => {
    render(<NotesEditor activeNote={NOTA} seccio="mercat" />);
    const { peuDePagina, etiquetaPeuDePagina } = mocks.adapter;
    expect(peuDePagina.type).toBe(PublicacionsDeLActor);
    expect(peuDePagina.props).toEqual({ seccio: 'mercat', exclouId: null });
    expect(etiquetaPeuDePagina).toBe('Ja publicat al Mercat');
  });

  test('una nota publicada al Mur: la seua publicació no es repetix davall (exclouId)', () => {
    render(<NotesEditor activeNote={{ ...NOTA, folderId: 'f-mur', isPublished: true, publishedSubmissionId: 'sub-7' }} seccio="mur" />);
    expect(mocks.adapter.peuDePagina.props).toEqual({ seccio: 'mur', exclouId: 'sub-7' });
    expect(mocks.adapter.etiquetaPeuDePagina).toBe('Ja publicat al Mur');
  });

  test('memoritzat: el mateix node entre pintades (l’adaptador no es refà pel peu)', () => {
    const { rerender } = render(<NotesEditor activeNote={NOTA} seccio="events" />);
    const abans = mocks.adapter.peuDePagina;
    rerender(<NotesEditor activeNote={NOTA} seccio="events" />);
    expect(mocks.adapter.peuDePagina).toBe(abans);
    rerender(<NotesEditor activeNote={NOTA} seccio="mur" />);
    expect(mocks.adapter.peuDePagina).not.toBe(abans);
    expect(mocks.adapter.peuDePagina.props.seccio).toBe('mur');
  });

  test.each([
    ['sense secció (una altra carpeta, el snippet)', null],
    ['Multimèdia (sense targeta canònica de llista)', 'multimedia'],
    ['una secció desconeguda', 'pobles']
  ])('%s: cap clau nova a l’adaptador', (_cas, seccio) => {
    render(<NotesEditor activeNote={NOTA} seccio={seccio} />);
    expect('peuDePagina' in mocks.adapter).toBe(false);
    expect('etiquetaPeuDePagina' in mocks.adapter).toBe(false);
  });

  test('sense la prop (el muntatge de sempre): cap clau nova', () => {
    render(<NotesEditor activeNote={NOTA} />);
    expect('peuDePagina' in mocks.adapter).toBe(false);
  });

  test('sense actor: cap clau nova', () => {
    mocks.identitat = { actor: null, actorId: null, memberships: [] };
    render(<NotesEditor activeNote={NOTA} seccio="mercat" />);
    expect('peuDePagina' in mocks.adapter).toBe(false);
  });

  /* Decisió per defecte del Mestre (261007) · el Foraster no veu cap
     històric. Revisió adversarial del 261007 · El Foraster de veres porta id
     (el del convidat) i no té sessió: abans `Boolean(actor?.id)` el deixava
     passar i el Bloc obert a la carpeta Mur pintava la regió davall de la
     còpia de prova. */
  test.each([
    ['la còpia de prova (sandbox), a la carpeta Mur', null, 'mur'],
    ['una nota oberta, a la carpeta Mercat', NOTA, 'mercat']
  ])('el Foraster (el convidat, amb id i sense sessió) · %s: cap clau nova', (_cas, nota, seccio) => {
    mocks.identitat = { actor: FORASTER, actorId: FORASTER.id, memberships: [] };
    mocks.currentUser = null;
    render(<NotesEditor activeNote={nota} seccio={seccio} />);
    expect('peuDePagina' in mocks.adapter).toBe(false);
    expect('etiquetaPeuDePagina' in mocks.adapter).toBe(false);
  });

  test('el convidat com a actor, encara que hi haja sessió: cap clau nova (la regla de PublicacionsDeLActor)', () => {
    mocks.identitat = { actor: FORASTER, actorId: FORASTER.id, memberships: [] };
    render(<NotesEditor activeNote={NOTA} seccio="mercat" />);
    expect('peuDePagina' in mocks.adapter).toBe(false);
  });
});
