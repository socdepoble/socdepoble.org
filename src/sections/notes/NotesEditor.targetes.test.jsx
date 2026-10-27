/* T7 (ordre del Mestre, prompt 261004_0515) · El Bloc de Notes oferix
   targetes incrustades: l'adaptador porta `targetes.cerca`, sempre (l'esquema
   de l'editor es fixa en crear-lo) i estable entre renders, i busca només
   en fonts públiques (Mur, Agenda, Mercat, pobles i pàgines), mai a les notes. */
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  adapter: null,
  mur: null,
  core: null,
  notes: [{ id: 'n1', title: 'La festa secreta', content: '<p>Només meua</p>' }]
}));
vi.mock('./NotesContext', () => ({
  useNotes: () => ({
    noteFolders: [], t: (_clau, text) => text, config: { tenantId: '00000000-0000-4000-8000-0000000000a1' },
    workspaceKey: 'a', notes: mocks.notes, setLocalNoteField: vi.fn(), notesComplete: true
  }),
  etiquetesDeNota: () => []
}));
vi.mock('./useEstatDesamentNota.js', async (importOriginal) => ({
  ...(await importOriginal()),
  useEstatDesamentNota: () => ({ estat: 'net', problema: null, quarantena: [] })
}));
vi.mock('../../components/universal/DocumentEditor', () => ({ DocumentEditor: ({ adapter }) => { mocks.adapter = adapter; return null; } }));
vi.mock('../../data/backendPort.js', () => ({ uploadToStorage: vi.fn(), teCapacitat: () => true }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorId: 'user' }) }));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => mocks.core }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({}), ESTAT: { DINS: 'dins' } }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../mur/MurContext', () => ({ useMur: () => mocks.mur }));
import NotesEditor from './NotesEditor.jsx';

beforeEach(() => {
  mocks.mur = {
    feedPosts: [{ id: 'p1', title: 'La festa de la Torre', summary: 'Música a la plaça', post_subtitle: '<p>Agost</p>', author_name: 'Pep', town_name: 'La Torre' }],
    events: [{ id: 'e1', title: 'Concert de festa', date: '2026-08-15', author_name: 'Banda' }],
    marketItems: [{ id: 'm1', title: 'Mel de festa', subtitle: 'De romer', seller: 'Rosa', population: 'Penàguila' }]
  };
  mocks.core = {
    agents: [],
    towns: [{ id: 't1', name: 'Festa Major', post_subtitle: 'Un poble en festa', comarca: 'L’Alcoià' }],
    pages: [{ key: 'qui-som', title: 'Qui som', lead: 'La festa de fer poble' }]
  };
});
afterEach(() => {
  cleanup();
  mocks.adapter = null;
});

test('l’adaptador porta targetes.cerca, i la funció és estable entre renders', () => {
  const { rerender } = render(<NotesEditor />);
  const primera = mocks.adapter.targetes;
  expect(typeof primera?.cerca).toBe('function');
  rerender(<NotesEditor />);
  expect(mocks.adapter.targetes).toBe(primera);
});

test('busca en publicacions, actes, productes, pobles i pàgines, amb la instantània; mai en les notes', () => {
  render(<NotesEditor />);
  const resultats = mocks.adapter.targetes.cerca('festa');
  expect(resultats.map((entrada) => entrada.clau).sort()).toEqual(['agenda:e1', 'mercat:m1', 'pagines:qui-som', 'pobles:t1', 'publicacions:p1']);
  expect(resultats.some((entrada) => entrada.tipus === 'notes' || entrada.titol === 'La festa secreta')).toBe(false);
  const publicacio = resultats.find((entrada) => entrada.clau === 'publicacions:p1');
  // El subtítol arriba en text pla, sense etiquetes.
  expect(publicacio).toMatchObject({ titol: 'La festa de la Torre', subtitol: 'Agost', autor: 'Pep', poble: 'La Torre' });
  expect(resultats.find((entrada) => entrada.clau === 'mercat:m1')).toMatchObject({ autor: 'Rosa', poble: 'Penàguila', subtitol: 'De romer' });
});

test('les fonts noves es veuen a la cerca següent, sense canviar la funció', () => {
  const { rerender } = render(<NotesEditor />);
  const cerca = mocks.adapter.targetes.cerca;
  expect(cerca('oli')).toEqual([]);
  mocks.mur = { ...mocks.mur, marketItems: [...mocks.mur.marketItems, { id: 'm2', title: 'Oli nou', seller: 'Vicent' }] };
  rerender(<NotesEditor />);
  expect(mocks.adapter.targetes.cerca).toBe(cerca);
  expect(cerca('oli').map((entrada) => entrada.clau)).toEqual(['mercat:m2']);
});

/* Ordre del Mestre (261027; verificació dels retocs) · Dins de l'app nativa,
   la targeta de Descàrregues (només web) no s'oferix: el seu cos nomena
   Android, Google Play i l'APK. A la web, sí. */
test('dins de l’app nativa, Descàrregues no s’oferix com a targeta; a la web, sí', () => {
  mocks.core = { ...mocks.core, pages: [...mocks.core.pages, { key: 'descarregues', title: 'Descàrregues i Aplicacions', html: '<h3>Android</h3>' }] };
  render(<NotesEditor />);
  expect(mocks.adapter.targetes.cerca('android').map((entrada) => entrada.clau)).toEqual(['pagines:descarregues']);
  cleanup();
  window.Capacitor = { isNativePlatform: () => true };
  try {
    render(<NotesEditor />);
    expect(mocks.adapter.targetes.cerca('android')).toEqual([]);
    expect(mocks.adapter.targetes.cerca('festa').map((entrada) => entrada.clau)).toContain('pagines:qui-som');
  } finally {
    delete window.Capacitor;
  }
});
