/* T3.2-UI (marató 261101) · El Bloc passa a l'editor, al costat de
   «🎴 Proposa Card», la fitxa de memòria oral (memoriaOralDelBloc.js): la
   revisió només es pot signar amb sessió (sense sessió, ningú), i el fitxer
   no porta l'identificador del compte (Gauntlet 2, 261101, G2-MO-08), coneix els
   pobles de l'aplicació, no es refà a cada pintada i les mateixes notes que no
   porten el botó (una connexió, un contingut de fora) tampoc no la porten.
   Els mocks són els de NotesEditor.test.jsx. El relat està escrit per a esta
   prova. */
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => {
  const NET = Object.freeze({ estat: 'net', problema: null, quarantena: Object.freeze([]) });
  const TENANT_A = '00000000-0000-4000-8000-0000000000a1';
  return {
    TENANT_A, showToast: vi.fn(), noteFolders: [], adapter: null, config: { tenantId: TENANT_A }, notes: [], setLocal: vi.fn(),
    session: {}, NET, desament: vi.fn(() => NET), identitat: { actorId: 'user' }, core: { agents: [] }
  };
});
vi.mock('./NotesContext', () => ({
  useNotes: () => ({
    noteFolders: mocks.noteFolders, t: (_key, fallback) => fallback, config: mocks.config, workspaceKey: mocks.config.tenantId,
    notes: mocks.notes, setLocalNoteField: mocks.setLocal, notesComplete: true,
    mouNota: vi.fn(), esborraNota: vi.fn(), potEsborrar: false, publishNote: vi.fn(), compartirNota: vi.fn(), scopeKey: undefined
  }),
  etiquetesDeNota: () => []
}));
vi.mock('./useEstatDesamentNota.js', async (importOriginal) => ({
  ...await importOriginal(),
  useEstatDesamentNota: (scope, id) => mocks.desament(scope, id)
}));
vi.mock('../../components/universal/DocumentEditor', () => ({ DocumentEditor: ({ adapter }) => { mocks.adapter = adapter; return null; } }));
vi.mock('../../data/backendPort.js', () => ({ uploadToStorage: vi.fn(), teCapacitat: () => true }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => mocks.identitat }));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => mocks.core }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => mocks.session, ESTAT: { DINS: 'dins' } }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.showToast }) }));
import NotesEditor from './NotesEditor.jsx';

beforeEach(() => {
  mocks.adapter = null;
  mocks.session = {};
  mocks.core = { agents: [] };
  mocks.identitat = { actorId: 'user' };
  mocks.desament.mockReset().mockReturnValue(mocks.NET);
});
afterEach(cleanup);

const NOTA = Object.freeze({ id: 'p', folderId: 'f-notes', categories: ['Sistema'], tags: [] });
const RELAT = Object.freeze({
  title: '', subtitle: '', lead: '',
  content: '<p>A Benimantell, quan arribava la collita de les olives, tot el poble anava al molí i les xiquetes portaven el berenar als bancals.</p>'
});

test('una nota pròpia porta la fitxa; amb sessió es pot signar, i l’id del compte no va al fitxer', () => {
  mocks.session = { currentUser: { id: 'U-1' } };
  render(<NotesEditor activeNote={NOTA} />);
  const { memoriaOral } = mocks.adapter;
  expect(typeof memoriaOral?.estructura).toBe('function');
  expect(typeof memoriaOral?.revisa).toBe('function');
  const fitxa = memoriaOral.estructura(RELAT);
  expect(fitxa.okf.frontmatter.status).toBe('draft');
  expect(fitxa.okf.frontmatter.sources[0].author).toBe('human:sense-identificador');
  expect(fitxa.okf.frontmatter.generated.at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  const revisada = memoriaOral.revisa(fitxa);
  expect(revisada.okf.frontmatter.verified.map((v) => v.by)).toEqual(['human:sense-identificador']);
  expect([fitxa.okf.markdown, revisada.okf.markdown].some((md) => md.includes('U-1'))).toBe(false);
  // Gauntlet 261101, B2-04: la correcció del diàleg passa per la mateixa revisió.
  expect(fitxa.etiquetes.length).toBeGreaterThan(0);
  const corregida = memoriaOral.revisa(fitxa, { etiquetes: [] });
  expect([corregida.okf.frontmatter.tags, corregida.okf.frontmatter.verified.map((v) => v.by)]).toEqual([[], ['human:sense-identificador']]);
});

test('sense sessió (la còpia de prova), la fitxa sí, però ningú no la pot signar', () => {
  mocks.session = { currentUser: null, estat: 'fora' };
  render(<NotesEditor />);
  expect(typeof mocks.adapter.memoriaOral?.estructura).toBe('function');
  expect(mocks.adapter.memoriaOral.revisa).toBeNull();
});

test('coneix els pobles de l’aplicació (useCoreContent().towns); sense, la llavor', () => {
  mocks.session = { currentUser: { id: 'U-1' } };
  const { unmount } = render(<NotesEditor activeNote={NOTA} />);
  expect(mocks.adapter.memoriaOral.estructura(RELAT).municipi).toBeNull();
  unmount();
  mocks.core = { agents: [], towns: [{ id: 'benimantell', title: 'Benimantell', comarca: 'la Marina Baixa', provincia: 'Alacant' }] };
  render(<NotesEditor activeNote={NOTA} />);
  expect(mocks.adapter.memoriaOral.estructura(RELAT).municipi?.id).toBe('benimantell');
});

test('la mateixa a cada pintada mentre la sessió i els pobles no canvien', () => {
  mocks.session = { currentUser: { id: 'U-1' } };
  const { rerender } = render(<NotesEditor activeNote={NOTA} />);
  const primera = mocks.adapter.memoriaOral;
  mocks.session = { currentUser: { id: 'U-1' } };
  rerender(<NotesEditor activeNote={NOTA} />);
  expect(mocks.adapter.memoriaOral).toBe(primera);
});

test('una connexió i un contingut de fora no la porten, com «Proposa Card»', () => {
  mocks.session = { currentUser: { id: 'U-1' } };
  render(<NotesEditor activeNote={{ ...NOTA, id: 'c', folderId: 'f-connectats', origen: { tipus: 'connexio', itemId: 'x', autorNom: 'Pepa' } }} />);
  expect([mocks.adapter.proposaCard, mocks.adapter.memoriaOral]).toEqual([null, null]);
  cleanup();
  render(<NotesEditor activeNote={{
    id: 'e', folderId: 'f-connectats', categories: ['Sistema'], tags: [],
    content: '<p>Font: <a href="https://exemple.org/recepta">exemple.org</a></p>',
    origen: { tipus: 'extern', url: 'https://exemple.org/recepta', lloc: 'exemple.org', titol: 'Coca de llanda' }
  }} />);
  expect([mocks.adapter.proposaCard, mocks.adapter.memoriaOral]).toEqual([null, null]);
});
