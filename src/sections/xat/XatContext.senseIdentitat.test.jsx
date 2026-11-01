/* D-7 (pla 261101_1246; P1-71) · XatProvider muntat FORA d'IdentitatProvider
   (una recàrrega en calent amb un context vell), amb la sessió de la persona
   A: no llança (sense ErrorBoundary: si llançara, la prova cauria) i el xat
   és el d'un visitant, de només lectura. Sense «jo» (joId null), cap fil no
   es carrega i res no s'envia ni es crea. L'arnés és el de
   XatContext.ambit.test.jsx, sense el doble d'IdentitatContext: és el de
   veres. Dades sintètiques. */
import { StrictMode } from 'react';
import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => ({
  session: { currentUser: { id: 'A' }, generacio: 1, estat: 'dins' }, pathname: '/xat', showToast: vi.fn(),
  loadFils: vi.fn(), loadMissatges: vi.fn(), enviaMissatge: vi.fn(), marcaLlegit: vi.fn(),
  creaFilDirecte: vi.fn(), carregaMembres: vi.fn(), subscribeToXat: vi.fn(), unsubscribeFromXat: vi.fn(),
  obriFilDePagina: vi.fn(), teCapacitat: vi.fn()
}));
vi.mock('../../app/contexts/SessionContext', () => ({ useSession: () => mock.session }));
vi.mock('../../app/contexts/RouterContext', () => ({ useLocation: () => ({ pathname: mock.pathname }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_, alternativa) => alternativa }) }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mock.showToast }) }));
vi.mock('../../data/backendPort.js', () => mock);
vi.mock('../../host.js', () => ({ quanLlest: async () => {} }));

import { XatProvider, useXat } from './XatContext.jsx';

const CONFIG = { backendId: 'supabase', tenantId: '00000000-0000-0000-0000-00000000000a' };
let value;
function Sonda() {
  value = useXat();
  return null;
}

beforeEach(() => {
  vi.clearAllMocks();
  mock.session = { currentUser: { id: 'A' }, generacio: 1, estat: 'dins' };
  mock.loadFils.mockResolvedValue([{ id: 'fil-a', titol: 'Fil de la persona A' }]);
  mock.loadMissatges.mockResolvedValue([]);
  mock.subscribeToXat.mockResolvedValue({ subscription: null, error: null });
  mock.unsubscribeFromXat.mockResolvedValue(null);
  mock.teCapacitat.mockReturnValue(true);
});
afterEach(cleanup);

it('sense IdentitatProvider: cap «jo», senseSessio, cap fil carregat i cap error', async () => {
  const errors = vi.spyOn(console, 'error');
  render(<StrictMode><XatProvider config={CONFIG}><Sonda /></XatProvider></StrictMode>);
  await waitFor(() => expect(value.status).toBe('ready'));
  expect(value.joId).toBeNull();
  expect(value.senseSessio).toBe(true);
  expect(value.chatThreads).toEqual([]);
  expect(mock.loadFils).not.toHaveBeenCalled();
  expect(mock.subscribeToXat).not.toHaveBeenCalled();
  expect(errors).not.toHaveBeenCalled();
  errors.mockRestore();
});

it('sense IdentitatProvider: enviar i crear una conversa no arriben al port', async () => {
  render(<StrictMode><XatProvider config={CONFIG}><Sonda /></XatProvider></StrictMode>);
  await waitFor(() => expect(value.status).toBe('ready'));
  await expect(value.sendChatMessage({ id: 'fil-a' }, 'Hola')).resolves.toEqual([]);
  await expect(value.creaFil('B')).resolves.toBeNull();
  await expect(value.obriFilDePagina({ tipus: 'pagina', id: 'p1' })).resolves.toBeNull();
  expect(value.marcaLlegides(['fil-a'])).toBe(0);
  expect(mock.enviaMissatge).not.toHaveBeenCalled();
  expect(mock.creaFilDirecte).not.toHaveBeenCalled();
  expect(mock.obriFilDePagina).not.toHaveBeenCalled();
  expect(mock.marcaLlegit).not.toHaveBeenCalled();
});
