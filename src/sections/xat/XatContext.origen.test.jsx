/* Ordre del Mestre (261021, pla 261021_0015 §8.5) · AvisadorXat (dins de
   XatProvider, per damunt de les rutes) recorda la darrera ruta de l'app fora
   del Xat, amb la consulta: la pàgina d'origen on torna la fletxa de la
   conversa (origenDelXat.js). Les rutes del Xat no la trepitgen. */
import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import '../../host.js';
import { XatProvider } from './XatContext.jsx';
import { oblidaOrigenDelXat, origenDelXat } from './origenDelXat.js';

const mock = vi.hoisted(() => ({
  session: { currentUser: { id: 'A' }, generacio: 1 }, actorKey: 'persona::A', pathname: '/mur', search: '', showToast: vi.fn(),
  loadFils: vi.fn(), loadMissatges: vi.fn(), enviaMissatge: vi.fn(), marcaLlegit: vi.fn(),
  creaFilDirecte: vi.fn(), carregaMembres: vi.fn(), subscribeToXat: vi.fn(), unsubscribeFromXat: vi.fn(),
  obriFilDePagina: vi.fn(), teCapacitat: vi.fn()
}));
vi.mock('../../app/contexts/SessionContext', () => ({ useSession: () => mock.session }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorKey: mock.actorKey, identitats: undefined }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useLocation: () => ({ pathname: mock.pathname, search: mock.search }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_, fallback) => fallback }) }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mock.showToast }) }));
vi.mock('../../data/backendPort.js', () => mock);
vi.mock('../../host.js', () => ({ quanLlest: async () => {} }));

const arbre = () => <XatProvider config={{ backendId: 'supabase', tenantId: '00000000-0000-0000-0000-00000000000a' }}><span /></XatProvider>;
const ves = (rerender, pathname, search = '') => {
  mock.pathname = pathname;
  mock.search = search;
  rerender(arbre());
};

beforeEach(() => {
  vi.clearAllMocks(); localStorage.clear(); oblidaOrigenDelXat();
  mock.pathname = '/mur'; mock.search = '';
  mock.loadFils.mockResolvedValue([]);
  mock.loadMissatges.mockResolvedValue([]);
  mock.subscribeToXat.mockResolvedValue({ subscription: null, error: null });
  mock.teCapacitat.mockReturnValue(true);
});
afterEach(() => { cleanup(); localStorage.clear(); oblidaOrigenDelXat(); });

test('recorda la pàgina de fora del Xat amb la consulta, i les rutes del Xat no la trepitgen', async () => {
  const { rerender } = render(arbre());
  await waitFor(() => expect(origenDelXat()).toBe('/mur'));
  ves(rerender, '/iaia', 'pestanya=presentacio');
  await waitFor(() => expect(origenDelXat()).toBe('/iaia?pestanya=presentacio'));
  ves(rerender, '/xat', 'amb=iaia-maria');
  ves(rerender, '/xat/iaia');
  expect(origenDelXat()).toBe('/iaia?pestanya=presentacio');
});
