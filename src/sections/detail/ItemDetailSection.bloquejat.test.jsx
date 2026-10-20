/* Fase D (261020, tasca 2; pla 261020_1300; crítica 261020, 5) · Bloquejar
   des del detall d'una publicació la lleva de useMur (MurContext filtra el
   que has bloquejat): la pàgina ja no pinta «Element no trobat» amb la píndola
   Error, que és el que veuria un revisor de la botiga, sinó un avís neutre i
   el camí de tornada. Un element arribat per location.state (preloadedItem),
   que MurContext no filtra, també. Del bloquejat, res al <head>. I la barra
   taronja del detall porta «Més opcions» només al contingut de la gent
   (Mur, Mercat i Agenda). Proveïdors de mentida, com ItemDetailSection.test.jsx. */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  pagina: null, sectionId: 'mur', itemId: 'p1', preloaded: null, feedPosts: [], seo: vi.fn(), navigate: vi.fn(),
  t: (_, alternativa) => alternativa, sessio: { currentUser: null, estat: 'fora', rol: null, esSuperadmin: false }
}));
vi.mock('../../app/contexts/RouterContext', () => ({
  useParams: () => ({ sectionId: mocks.sectionId, itemId: mocks.itemId }),
  useNavigate: () => mocks.navigate,
  useLocation: () => ({ pathname: `/${mocks.sectionId}/${mocks.itemId}`, search: '', state: mocks.preloaded ? { preloadedItem: mocks.preloaded } : null }),
  Navigate: () => null,
  Link: ({ to, children, className }) => <a href={to} className={className}>{children}</a>
}));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: (props) => { mocks.pagina = props; return <section data-titol={props.title}>{props.children}</section>; }
}));
vi.mock('../../sections/mur/MurContext', () => ({ useMur: () => ({ events: [], feedPosts: mocks.feedPosts, marketItems: [], status: 'ready' }) }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ towns: [], status: 'ready' }) }));
vi.mock('../../sections/notes/NotesDataContext', () => ({ useNotesData: () => ({ notes: [], status: 'ready' }) }));
vi.mock('../../sections/multimedia/MultimediaContext', () => ({ useMultimedia: () => ({ mediaItems: [], status: 'ready' }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: mocks.t }) }));
vi.mock('../../app/contexts/SessionContext', () => ({
  ESTAT: Object.freeze({ COMPROVANT: 'comprovant', DINS: 'dins', FORA: 'fora' }),
  useSession: () => mocks.sessio,
  useSessioOpcional: () => mocks.sessio
}));
vi.mock('../../hooks/useSEO.js', () => ({ useSEO: (opcions) => mocks.seo(opcions) }));
/* La llista de connexions del lector del MAS (elementDeSeccio · useElementDeSeccio) no fa falta ací. */
vi.mock('./SincronitzacioTargetes.jsx', () => ({ ProveidorSincronitzacioTargetes: ({ children }) => children }));
import ItemDetailSection from './ItemDetailSection.jsx';
import { ModeracioContext } from '../../components/PedraSeca/hooks/moderacioDePoble.js';

const DE_PEPA = Object.freeze({ id: 'p1', type: 'feed', title: 'Fira de tardor', ownerUserId: 'pepa', author_name: 'Pepa', created_at: '2026-10-01T10:00:00.000Z' });
const bloquejaPepa = (bloquejat) => ({ disponible: true, esElementBloquejat: (item) => bloquejat && item?.ownerUserId === 'pepa' });
const arbre = (valor) => <ModeracioContext.Provider value={valor}><ItemDetailSection /></ModeracioContext.Provider>;

beforeEach(() => {
  mocks.pagina = null; mocks.sectionId = 'mur'; mocks.itemId = 'p1'; mocks.preloaded = null; mocks.feedPosts = [DE_PEPA];
  mocks.seo.mockReset(); mocks.navigate.mockReset();
});
afterEach(cleanup);

test('un element que es bloqueja amb la pàgina oberta: l’avís i el camí de tornada, mai «Element no trobat»', () => {
  const vista = render(arbre(bloquejaPepa(false)));
  expect(mocks.pagina.title).toBe('Fira de tardor');
  /* MurContext ja l'ha llevat i qui el signa està bloquejat. */
  mocks.feedPosts = [];
  vista.rerender(arbre(bloquejaPepa(true)));
  expect(mocks.pagina).toMatchObject({ title: 'Contingut amagat', chrome: 'system', objecte: null });
  expect(mocks.pagina.labels).toBeUndefined();
  expect(screen.getByRole('status').textContent).toBe('Has bloquejat qui ha publicat este contingut: ja no el veuràs.');
  expect(screen.getByRole('link', { name: 'Torna al llistat' }).getAttribute('href')).toBe('/mur');
  expect(screen.queryByText('Element no trobat')).toBeNull();
});

test('un element arribat per location.state (preloadedItem) i bloquejat també porta l’avís, i res al <head>', () => {
  mocks.feedPosts = [];
  mocks.preloaded = DE_PEPA;
  render(arbre(bloquejaPepa(true)));
  expect(mocks.pagina.title).toBe('Contingut amagat');
  expect(mocks.seo).toHaveBeenLastCalledWith({ title: null, description: '', image: null });
});

test('si no està bloquejat i ja no hi és, «Element no trobat», com sempre', () => {
  mocks.feedPosts = [];
  render(arbre(bloquejaPepa(false)));
  expect(mocks.pagina.title).toBe('Element no trobat');
});

test('«Més opcions» a la barra taronja del Mur, el Mercat i l’Agenda; no a Pobles', () => {
  render(arbre(bloquejaPepa(false)));
  expect(mocks.pagina.ambModeracio).toBe(true);
  cleanup();
  mocks.sectionId = 'pobles';
  mocks.preloaded = { id: 'p1', name: 'La Torre', title: 'La Torre' };
  render(arbre(bloquejaPepa(false)));
  expect(mocks.pagina.ambModeracio).toBe(false);
});

test('sense proveïdor de moderació, el detall de sempre', () => {
  render(<ItemDetailSection />);
  expect(mocks.pagina.title).toBe('Fira de tardor');
});
