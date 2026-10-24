import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

/* P1-11 (pla 261024_2230, T5B-02; C11-04 de Codex) · La fitxa pública munta,
   al peu i dins del Mur de l'App, l'aparador de la identitat VISITADA (Mur,
   Mercat i Agenda), sense cap botó de seguir; la d'una IA, no. Els mocks són
   els de PerfilPublicSection.test.jsx, més el Mur. */
const mocks = vi.hoisted(() => ({
  id: 'forn', navigate: vi.fn(), load: vi.fn(), seo: vi.fn(), toast: vi.fn(), config: {},
  identitat: { memberships: [], actor: null, setActor: vi.fn() }, xat: { senseSessio: false }, mur: null
}));
vi.mock('../xat/XatContext', () => ({ useXat: () => mocks.xat }));
vi.mock('../mur/MurContext', () => ({ useMur: () => mocks.mur }));
vi.mock('../../app/contexts/CoreContentContext', () => ({
  useCoreContent: () => ({ status: 'ready', refresh: () => {}, pageCopy: {}, towns: [], pages: [], agents: [] })
}));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => mocks.identitat }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useParams: () => ({ agentId: mocks.id }),
  useNavigate: () => mocks.navigate,
  useLocation: () => ({ pathname: `/empresa/${mocks.id}` }),
  useRouter: () => ({ navigate: mocks.navigate, currentPath: `/empresa/${mocks.id}`, basename: '' }),
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa, resolveAsset: (v) => v }),
  useUIState: () => ({ externalConfig: mocks.config, locale: 'ca-ES', language: 'ca' })
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: (opcions) => mocks.seo(opcions) }));
vi.mock('../../data/backendPort.js', () => ({ teCapacitat: () => true, loadPerfilPublic: mocks.load }));
vi.mock('../../host.js', () => ({ quanLlest: async () => {} }));
import PerfilPublicSection from './PerfilPublicSection.jsx';

const FORN = { tipus: 'entitat', id: 'org-forn', slug: 'forn', nom: 'Forn de la Torre', avatar: '', hero: '', lema: 'Pa de llenya', bio: 'Forn de llenya',
  presentacioHtml: '', poble: 'La Torre de les Maçanes', esIA: false, publicat: true, propietari: false, copyright: '' };
const IAIA = { ...FORN, tipus: 'ia', id: 'iaia', slug: 'iaia-maria', nom: 'IAIA MarIA', esIA: true };

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  mocks.id = 'forn';
  mocks.load.mockResolvedValue(FORN);
  mocks.mur = {
    status: 'ready', error: null, refresh: vi.fn(),
    sortedFeedPosts: [{ id: 'p1', type: 'post', title: 'Coca de llanda', author_org_id: 'org-forn', created_at: '2026-10-06T10:00:00Z' }],
    sortedMarketItems: [{ id: 'm1', title: 'Pa de llenya', author_org_id: 'org-forn', price: '2 €', created_at: '2026-10-03T10:00:00Z' }],
    sortedEvents: []
  };
});

test('P1-11 · al peu de la fitxa d’una entitat, «El que publica …» amb les pestanyes Mur, Mercat i Agenda', async () => {
  render(<PerfilPublicSection />);
  expect(await screen.findByRole('heading', { level: 1, name: 'Forn de la Torre' })).toBeTruthy();
  const regio = screen.getByRole('region', { name: 'El que publica Forn de la Torre' });
  /* Revisió adversarial 261024 · Al peu de PageFrame, FORA de l'article: ni l'Índex ni la traducció el recullen. */
  expect(regio.classList.contains('sdp-pagina-peu')).toBe(true);
  expect(regio.closest('article')).toBeNull();
  expect(document.querySelector('article.content-wrapper').textContent).not.toContain('Coca de llanda');
  expect(within(regio).getAllByRole('tab').map((p) => p.textContent)).toEqual(['Mur', 'Mercat', 'Agenda']);
  expect(within(regio).getByText('Coca de llanda')).toBeTruthy();
  /* L'H2 de l'article continua sent la bio; el peu porta el seu h2, com el de PublicacioDetall. */
  expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['Forn de llenya', 'El que publica Forn de la Torre']);
  expect(within(regio).getByRole('heading', { level: 2, name: 'El que publica Forn de la Torre' })).toBeTruthy();
  /* Doctrina del Connectar: cap botó de seguir a la fitxa. */
  expect(document.body.textContent).not.toMatch(/Seguir|Seguidors/);
});

test('P1-11 · la fitxa d’una IA no porta aparador', async () => {
  mocks.id = 'iaia';
  mocks.load.mockResolvedValue(IAIA);
  render(<PerfilPublicSection />);
  expect(await screen.findByRole('heading', { level: 1, name: 'IAIA MarIA' })).toBeTruthy();
  expect(screen.queryByRole('region', { name: /^El que publica/ })).toBeNull();
  /* Cap regió de peu buida. */
  expect(document.querySelector('.sdp-pagina-peu')).toBeNull();
  expect(screen.queryAllByRole('tab')).toEqual([]);
});
