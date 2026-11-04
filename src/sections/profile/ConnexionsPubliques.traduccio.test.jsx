import React from 'react';
import { act, cleanup, fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

/* FEDI-23 · Les preferències autoritzades poden mostrar connexions privades
   dins d'una fitxa pública. Exercim la pàgina, l'extractor i el transport
   lliure reals; només el port i fetch són dobles amb dades inventades. */
const mocks = vi.hoisted(() => ({
  id: 'pepa', navigate: vi.fn(), load: vi.fn(), qui: vi.fn(), seo: vi.fn(), toast: vi.fn(),
  config: { dataMode: 'seed' }, t: (_, alternativa) => alternativa, resolveAsset: (v) => v, agents: [],
  capacitats: new Set(['directori', 'seguiments']), visibilitat: 'privada',
  identitat: { memberships: [], actor: null, setActor: vi.fn() },
  xat: { senseSessio: false }
}));
vi.mock('../xat/XatContext', () => ({ useXat: () => mocks.xat }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => mocks.identitat }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useParams: () => ({ agentId: mocks.id }),
  useNavigate: () => mocks.navigate,
  useLocation: () => ({ pathname: `/perfil/${mocks.id}` }),
  useRouter: () => ({ navigate: mocks.navigate, currentPath: `/perfil/${mocks.id}`, basename: '' }),
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: mocks.t, resolveAsset: mocks.resolveAsset }),
  useUIState: () => ({ externalConfig: mocks.config, locale: 'ca-ES', language: 'ca' })
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: (opcions) => mocks.seo(opcions) }));
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: (capacitat) => mocks.capacitats.has(capacitat),
  loadPerfilPublic: mocks.load,
  quiEmSegueix: (...args) => mocks.qui(...args),
  elsMeusSeguiments: async () => [],
  connexionsPubliquesDe: async () => [],
  membresIEntitatsConnectadesDe: async () => mocks.visibilitat === 'publica' ? [{ tipus: 'persona', id: 'public-peer', nom: 'VeinaPublicaLMN', direccio: 'membre' }] : [],
  preferenciesConnexions: async ({ tipus, id }) => ({ tipus, id, visibilitatConnexions: mocks.visibilitat, connexions: [{ tipus: 'persona', id: 'secret-peer', nom: 'VeinaPrivadaZQX', direccio: 'membre', visibilitatConnexions: 'privada' }] })
}));
vi.mock('../../host.js', () => ({ quanLlest: async () => {} }));
import PerfilPublicSection from './PerfilPublicSection.jsx';
import { oblidaEntitatDelProjecte } from '../../config/navigation.js';
import { buidaSessioLliure, fixaTraductorLliure } from '../../data/traductorLliure.js';
import { buidaCauTraduccions } from '../../components/PedraSeca/hooks/useTraduccioPagina.js';

const PEPA = {
  tipus: 'persona', id: 'pepa', slug: 'pepa', nom: 'Pepa Inventada', avatar: '', hero: '', lema: '', bio: 'Mestra jubilada',
  presentacioHtml: '', poble: 'La Torre de les Maçanes', esIA: false, publicat: true, propietari: true, copyright: ''
};
const fetch = vi.fn();
const traduir = (container) => container.querySelector('header.bar-blue button[aria-label="Traduir"]');

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  fixaTraductorLliure(null);
});
beforeEach(() => {
  vi.clearAllMocks();
  mocks.id = 'pepa';
  mocks.capacitats = new Set(['directori', 'seguiments']);
  mocks.qui.mockResolvedValue([
    { id: 'u-rosa', nom: 'Rosa Inventada Secreta', creatAl: '2026-10-24T09:00:00Z' },
    { id: 'e-forn', tipus: 'entitat', nom: 'Forn Inventat', creatAl: '2026-10-25T09:00:00Z' }
  ]);
  oblidaEntitatDelProjecte();
  buidaSessioLliure();
  buidaCauTraduccions();
  fixaTraductorLliure('apertium');
  fetch.mockReset();
  fetch.mockImplementation(async (_, { body } = {}) => ({
    status: 200, ok: true, json: async () => ({ responseData: { translatedText: `spa:${body?.get?.('q') ?? ''}` }, responseStatus: 200 })
  }));
  vi.stubGlobal('fetch', fetch);
});

test.each(['privada', 'publica'])('entitat pública administrada: global %s, connexió privada fora del traductor i pública dins', async visibilitat => {
  mocks.visibilitat = visibilitat;
  mocks.capacitats.add('connexionsPubliques');
  mocks.id = 'entitat-prova';
  mocks.identitat.memberships = [{ id: mocks.id, slug: mocks.id, role: 'owner' }];
  mocks.load.mockResolvedValue({ ...PEPA, tipus: 'entitat', id: mocks.id, slug: mocks.id, nom: 'Entitat Pública', publicat: true, propietari: false, bio: 'Un text públic ordinari.' });
  const { container } = render(<PerfilPublicSection agents={mocks.agents} />);
  expect(await screen.findByRole('link', { name: 'VeinaPrivadaZQX' })).toBeTruthy();
  const boto = traduir(container);
  await act(async () => { fireEvent.click(boto); });
  expect(boto.getAttribute('aria-haspopup')).toBe('menu');
  await act(async () => { fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitemradio', { name: 'Castellà' })); });
  await waitFor(() => expect(container.querySelector('.sdp-avis-traduccio')?.textContent).toContain('Traduït automàticament del valencià'));
  const texts = fetch.mock.calls.map(([, options]) => options?.body?.get?.('q') || '').join('\n');
  expect(fetch).toHaveBeenCalled();
  expect(texts).toContain('Entitat Pública');
  if (visibilitat === 'publica') expect(texts).toContain('VeinaPublicaLMN');
  else expect(texts).not.toContain('VeinaPublicaLMN');
  expect(texts).not.toContain('VeinaPrivadaZQX');
});
