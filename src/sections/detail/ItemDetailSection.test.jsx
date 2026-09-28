/**
 * Poliment T39/T40 · El detall d'una publicació diu el mateix que la seua
 * targeta del Mur: els drets que porta (payload.copyright) i la data triada al
 * calendari (publish_date); el text de sèrie i created_at, només si no en porta.
 */
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ pagina: null, item: null, t: (_, alternativa) => alternativa }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useParams: () => ({ sectionId: 'mur', itemId: mocks.item?.id }),
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: `/mur/${mocks.item?.id}`, state: { preloadedItem: mocks.item } })
}));
vi.mock('../../components/universal/UniversalPage', () => ({ UniversalPage: (props) => { mocks.pagina = props; return null; } }));
vi.mock('../../sections/mur/MurContext', () => ({ useMur: () => ({ events: [], feedPosts: [], marketItems: [] }) }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ towns: [] }) }));
vi.mock('../../sections/notes/NotesDataContext', () => ({ useNotesData: () => ({ notes: [] }) }));
vi.mock('../../sections/multimedia/MultimediaContext', () => ({ useMultimedia: () => ({ mediaItems: [] }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: mocks.t }) }));
vi.mock('../../hooks/useSEO.js', () => ({ useSEO: () => {} }));
import ItemDetailSection from './ItemDetailSection.jsx';
import { COPYRIGHT_SDP } from '../../components/universal/editorial.js';

beforeEach(() => { mocks.pagina = null; window.scrollTo = vi.fn(); });
afterEach(cleanup);

test('el detall porta els drets de la publicació i la data triada al calendari', () => {
  mocks.item = { id: 'cc', type: 'feed', title: 'Recepta de coca', copyright: 'CC BY 4.0',
    created_at: '2026-09-01T10:00:00.000Z', publish_date: '2026-10-05T08:30:00.000Z' };
  render(<ItemDetailSection />);
  expect(mocks.pagina.copyright).toBe('CC BY 4.0');
  expect(mocks.pagina.date).toBe(new Date('2026-10-05T08:30:00.000Z').toLocaleDateString('ca-ES'));
  expect(mocks.pagina.time).toBe(new Date('2026-10-05T08:30:00.000Z').toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' }));
});

test('sense drets ni data triada: el text de sèrie i la data de creació', () => {
  mocks.item = { id: 'vella', type: 'feed', title: 'Crònica vella', created_at: '2026-08-15T10:00:00.000Z' };
  render(<ItemDetailSection />);
  expect(mocks.pagina.copyright).toBe(COPYRIGHT_SDP);
  expect(mocks.pagina.date).toBe(new Date('2026-08-15T10:00:00.000Z').toLocaleDateString('ca-ES'));
});
