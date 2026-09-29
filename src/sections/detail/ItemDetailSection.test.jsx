/**
 * Poliment T39/T40 · El detall d'una publicació diu el mateix que la seua
 * targeta del Mur: els drets que porta (payload.copyright) i la data triada al
 * calendari (publish_date); el text de sèrie i created_at, només si no en porta.
 */
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ pagina: null, item: null, itemId: null, sectionId: 'mur', navigate: vi.fn(), t: (_, alternativa) => alternativa }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useParams: () => ({ sectionId: mocks.sectionId, itemId: mocks.itemId ?? mocks.item?.id }),
  useNavigate: () => mocks.navigate,
  useLocation: () => ({ pathname: `/${mocks.sectionId}/${mocks.item?.id}`, state: { preloadedItem: mocks.item } })
}));
vi.mock('../../components/universal/UniversalPage', () => ({ UniversalPage: (props) => { mocks.pagina = props; return null; } }));
vi.mock('../../sections/mur/MurContext', () => ({ useMur: () => ({ events: [], feedPosts: [], marketItems: [] }) }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ towns: [] }) }));
vi.mock('../../sections/notes/NotesDataContext', () => ({ useNotesData: () => ({ notes: [] }) }));
vi.mock('../../sections/multimedia/MultimediaContext', () => ({ useMultimedia: () => ({ mediaItems: [] }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: mocks.t }) }));
vi.mock('../../hooks/useSEO.js', () => ({ useSEO: () => {} }));
import ItemDetailSection from './ItemDetailSection.jsx';
import { COPYRIGHT_SDP, dataHoraDeBarra } from '../../components/universal/editorial.js';
import { rutaXatDePagina } from '../../config/objecteConnectable.js';
import { objecteDe } from '../../config/navigation.js';

beforeEach(() => { mocks.pagina = null; mocks.itemId = null; mocks.sectionId = 'mur'; mocks.navigate.mockReset(); window.scrollTo = vi.fn(); });
afterEach(cleanup);

test('el detall porta els drets de la publicació i la data triada al calendari', () => {
  mocks.item = { id: 'cc', type: 'feed', title: 'Recepta de coca', copyright: 'CC BY 4.0',
    created_at: '2026-09-01T10:00:00.000Z', publish_date: '2026-10-05T08:30:00.000Z' };
  render(<ItemDetailSection />);
  expect(mocks.pagina.copyright).toBe('CC BY 4.0');
  /* T51 · el format únic de la pastilla (dd/mm/aa i hh:mm), no el d/m/aaaa d'abans. */
  expect(mocks.pagina).toMatchObject(dataHoraDeBarra({ publicat: '2026-10-05T08:30:00.000Z' }));
});

test('sense drets ni data triada: el text de sèrie i la data de creació', () => {
  mocks.item = { id: 'vella', type: 'feed', title: 'Crònica vella', created_at: '2026-08-15T10:00:00.000Z' };
  render(<ItemDetailSection />);
  expect(mocks.pagina.copyright).toBe(COPYRIGHT_SDP);
  expect(mocks.pagina).toMatchObject(dataHoraDeBarra({ creat: '2026-08-15T10:00:00.000Z' }));
});

/* T63.2 (doctrina del Mestre, 260928) · La Pàgina Universal d'un element porta
   el seu descriptor tipat: Comentar obri el seu xat comú (useAccions). Abans
   no en passava cap i el botó anava a /xat sense destí. */
test('T63.2 · el detall passa l’objecte tipat: el xat comú de la publicació, i Connectar amb el mateix descriptor', () => {
  mocks.item = { id: 'cc', type: 'feed', title: 'Recepta de coca', created_at: '2026-09-01T10:00:00.000Z' };
  render(<ItemDetailSection />);
  expect(mocks.pagina.objecte).toMatchObject({ tipus: 'publicacio', id: 'cc', titol: 'Recepta de coca', ruta: '/mur/cc' });
  expect(rutaXatDePagina(mocks.pagina.objecte)).toBe('/xat?sobre=publicacio:cc&titol=Recepta%20de%20coca&ruta=%2Fmur%2Fcc');
  mocks.pagina.onConnect();
  const connectar = new URL(mocks.navigate.mock.calls[0][0], 'http://localhost');
  expect(Object.fromEntries(connectar.searchParams)).toMatchObject({ item_id: 'cc', objecte: 'publicacio', ruta: '/mur/cc' });
});

test('T63.2 · cada secció, el seu tipus: producte, esdeveniment, poble', () => {
  for (const [seccio, tipus] of [['mercat', 'producte'], ['events', 'esdeveniment'], ['pobles', 'poble']]) {
    mocks.sectionId = seccio;
    mocks.item = { id: 'x1', title: 'X', created_at: '2026-09-01T10:00:00.000Z' };
    render(<ItemDetailSection />);
    expect(mocks.pagina.objecte.tipus).toBe(tipus);
    expect(new URL(rutaXatDePagina(mocks.pagina.objecte), 'http://localhost').searchParams.get('sobre')).toBe(`${tipus}:x1`);
    cleanup();
  }
});

test('T63.2 · una nota personal (/notes/:id) no té xat comú: el seu objecte no porta enlloc', () => {
  mocks.sectionId = 'notes';
  mocks.item = { id: 'n1', title: 'Llista de la compra', created_at: '2026-09-01T10:00:00.000Z' };
  render(<ItemDetailSection />);
  expect(mocks.pagina.objecte.tipus).toBe('nota');
  expect(rutaXatDePagina(mocks.pagina.objecte)).toBeNull();
});

/* Revisió de T63.2 · «Element no trobat» (també mentre es carrega) no té cap
   element: ni el xat de la ruta, que s'enduria el títol «Element no trobat».
   objecte null deixa el botó on era i el clic avisa. Una nota, ni es pinta. */
test('T63.2 · «Element no trobat»: objecte null (cap xat); a /notes/:id, l’objecte és una nota, sense xat', () => {
  mocks.item = null;
  mocks.itemId = 'x9';
  render(<ItemDetailSection />);
  expect(mocks.pagina.title).toBe('Element no trobat');
  expect(mocks.pagina.objecte).toBeNull();
  cleanup();
  mocks.sectionId = 'notes';
  mocks.itemId = 'n1';
  render(<ItemDetailSection />);
  expect(mocks.pagina.title).toBe('Element no trobat');
  expect(mocks.pagina.objecte).toMatchObject({ tipus: 'nota', id: 'n1' });
  expect(rutaXatDePagina(mocks.pagina.objecte)).toBeNull();
});

/* Enxufe universal (260929) · Dins d'un amfitrió, window.scrollTo mou la
   pàgina de l'amfitrió, no la columna de Sóc de Poble: el detall no la crida
   mai, ni en muntar, ni en canviar d'element, ni quan no el troba. */
test('el detall no mou mai la finestra de l’amfitrió', () => {
  mocks.item = { id: 'a', type: 'feed', title: 'A', created_at: '2026-09-01T10:00:00.000Z' };
  const { rerender } = render(<ItemDetailSection />);
  mocks.item = { id: 'b', type: 'feed', title: 'B', created_at: '2026-09-02T10:00:00.000Z' };
  rerender(<ItemDetailSection />);
  mocks.sectionId = 'mercat';
  rerender(<ItemDetailSection />);
  mocks.item = null;
  mocks.itemId = 'x9';
  rerender(<ItemDetailSection />);
  expect(mocks.pagina.title).toBe('Element no trobat');
  expect(window.scrollTo).not.toHaveBeenCalled();
});

test('T63.2 · el xat porta el nom propi de l’element, el de la seua targeta: «Sella», no «Gent de Sella»', () => {
  mocks.sectionId = 'pobles';
  mocks.item = { id: 'sella', title: 'Sella', created_at: '2026-09-01T10:00:00.000Z' };
  render(<ItemDetailSection />);
  expect(mocks.pagina.title).toBe('Gent de Sella');
  expect(mocks.pagina.objecte.titol).toBe('Sella');
  // La targeta de Pobles (objecteDe(town, 'pobles')) i el detall obrin el mateix xat, amb el mateix nom.
  expect(rutaXatDePagina(mocks.pagina.objecte)).toBe(rutaXatDePagina(objecteDe(mocks.item, 'pobles')));
  // Connectar no canvia: el títol de la pàgina, com abans.
  mocks.pagina.onConnect();
  expect(new URL(mocks.navigate.mock.calls[0][0], 'http://localhost').searchParams.get('title')).toBe('Gent de Sella');
});
