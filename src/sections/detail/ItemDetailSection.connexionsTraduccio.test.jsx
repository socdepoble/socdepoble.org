/* FEDI-23 · Detall real del poble: els noms públics continuen traduint-se,
   però les preferències privades de qui administra no ixen pel transport.
   Només proveïdors, port i fetch són dobles amb dades inventades. */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  visibilitat: 'privada', sectionId: 'mur', itemId: null, navigate: vi.fn(), toast: vi.fn(), t: (_, alternativa) => alternativa,
  mur: { events: [], feedPosts: [], marketItems: [] }, towns: [], notes: [],
  sessio: { currentUser: null, estat: 'fora', rol: null, esSuperadmin: false }
}));
vi.mock('../../app/contexts/RouterContext', () => ({
  useParams: () => ({ sectionId: mocks.sectionId, itemId: mocks.itemId }),
  useNavigate: () => mocks.navigate,
  useLocation: () => ({ pathname: `/${mocks.sectionId}/${mocks.itemId}`, state: null }),
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('../../sections/mur/MurContext', () => ({ useMur: () => mocks.mur }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ towns: mocks.towns }) }));
vi.mock('../../sections/notes/NotesDataContext', () => ({ useNotesData: () => ({ notes: mocks.notes, status: 'ready' }) }));
vi.mock('../../sections/multimedia/MultimediaContext', () => ({ useMultimedia: () => ({ mediaItems: [] }) }));
vi.mock('../../app/contexts/UIContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useUIActions: () => ({ t: mocks.t })
}));
vi.mock('../../app/contexts/SessionContext', () => ({
  ESTAT: Object.freeze({ COMPROVANT: 'comprovant', DINS: 'dins', FORA: 'fora' }),
  useSession: () => mocks.sessio,
  useSessioOpcional: () => mocks.sessio
}));
vi.mock('../../hooks/useSEO.js', () => ({ useSEO: () => {} }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
import ItemDetailSection from './ItemDetailSection.jsx';
beforeEach(() => {
  vi.clearAllMocks();
  mocks.towns = [];
  mocks.notes = [];
});
afterEach(cleanup);


vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: cap => cap === 'connexionsPubliques',
  membresIEntitatsConnectadesDe: async () => mocks.visibilitat === 'publica' ? [{ tipus: 'persona', id: 'public-peer', nom: 'VeinaPublicaLMN', direccio: 'poble' }] : [],
  preferenciesConnexions: async ({ tipus, id }) => ({ tipus, id, visibilitatConnexions: mocks.visibilitat, connexions: [{ tipus: 'persona', id: 'secret-peer', nom: 'VeinaPrivadaZQX', direccio: 'poble', visibilitatConnexions: 'privada' }] })
}));
import { buidaSessioLliure, fixaTraductorLliure } from '../../data/traductorLliure.js';
import { buidaCauTraduccions } from '../../components/PedraSeca/hooks/useTraduccioPagina.js';
afterEach(() => { fixaTraductorLliure(null); vi.unstubAllGlobals(); });

test.each(['privada', 'publica'])('detall del poble administrat: global %s, només connexions públiques al traductor', async visibilitat => {
  mocks.visibilitat = visibilitat;
  mocks.sectionId = 'pobles'; mocks.itemId = 'sella';
  mocks.towns = [{ id: 'sella', slug: 'sella', title: 'Sella', name: 'Sella', administrable: true }];
  mocks.sessio = { currentUser: { id: 'admin-town' }, estat: 'dins', rol: 'admin', esSuperadmin: false };
  buidaSessioLliure(); buidaCauTraduccions(); fixaTraductorLliure('apertium');
  const fetch = vi.fn(async (_, { body } = {}) => ({ status: 200, ok: true, json: async () => ({ responseData: { translatedText: `spa:${body?.get?.('q') ?? ''}` }, responseStatus: 200 }) }));
  vi.stubGlobal('fetch', fetch);
  const { container } = render(<ItemDetailSection />);
  expect(await screen.findByRole('link', { name: 'VeinaPrivadaZQX' })).toBeTruthy();
  if (visibilitat === 'publica') expect(await screen.findByRole('link', { name: 'VeinaPublicaLMN' })).toBeTruthy();
  else expect(screen.queryByRole('link', { name: 'VeinaPublicaLMN' })).toBeNull();
  const boto = container.querySelector('header.bar-blue button[aria-label="Traduir"]');
  expect(boto.getAttribute('aria-haspopup')).toBe('menu');
  fireEvent.click(boto);
  await act(async () => { fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitemradio', { name: 'Castellà' })); });
  await waitFor(() => expect(container.querySelector('.sdp-avis-traduccio')?.textContent).toContain('Traduït automàticament del valencià'));
  const texts = fetch.mock.calls.map(([, options]) => options?.body?.get?.('q') || '').join('\n');
  expect(fetch).toHaveBeenCalled();
  expect(texts).toContain('Sella');
  if (visibilitat === 'publica') expect(texts).toContain('VeinaPublicaLMN');
  else expect(texts).not.toContain('VeinaPublicaLMN');
  expect(texts).not.toContain('VeinaPrivadaZQX');
});
