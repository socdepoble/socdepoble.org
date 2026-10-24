import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

/* T6b (IDEA-14; decisió del Mestre, 261024) · L'altra banda ho sap: la fitxa
   PRÒPIA d'una persona porta «Veïnat connectat amb tu» al peu, amb la llista
   de quiEmSegueix (sense entitat) i la configuració de la fitxa. La d'una
   altra persona, la d'una entitat i la d'una IA, no; i sense la capacitat, cap.
   Els mateixos dobles que PerfilPublicSection.moderacio.test.jsx.
   Actualitzada a posta (P1-11, pla 261024_2230; G1945-04 de Gemini, ordre del
   Mestre): el títol nou del bloc. */
const mocks = vi.hoisted(() => ({
  id: 'pepa', navigate: vi.fn(), load: vi.fn(), qui: vi.fn(), seo: vi.fn(), toast: vi.fn(),
  config: { dataMode: 'seed' }, t: (_, alternativa) => alternativa, resolveAsset: (v) => v, agents: [],
  capacitats: new Set(['directori', 'seguiments']),
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
  quiEmSegueix: (...args) => mocks.qui(...args)
}));
vi.mock('../../host.js', () => ({ quanLlest: async () => {} }));
import PerfilPublicSection from './PerfilPublicSection.jsx';
import { oblidaEntitatDelProjecte } from '../../config/navigation.js';

const PEPA = {
  tipus: 'persona', id: 'pepa', slug: 'pepa', nom: 'Pepa Garcia', avatar: '', hero: '', lema: '', bio: 'Mestra jubilada',
  presentacioHtml: '', poble: 'La Torre de les Maçanes', esIA: false, publicat: true, propietari: false, copyright: ''
};
const FORN = { ...PEPA, tipus: 'entitat', id: 'forn', slug: 'forn', nom: 'Forn de la Torre', propietari: true };
const titol = () => screen.queryByRole('heading', { level: 3, name: 'Veïnat connectat amb tu' });

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  mocks.id = 'pepa';
  mocks.capacitats = new Set(['directori', 'seguiments']);
  mocks.qui.mockResolvedValue([{ id: 'u-rosa', nom: 'Rosa Pérez', creatAl: '2026-10-24T09:00:00Z' }]);
  mocks.identitat = { memberships: [], actor: null, setActor: vi.fn(() => true) };
  oblidaEntitatDelProjecte();
});

test('la fitxa pròpia d’una persona porta «Veïnat connectat amb tu» amb la seua llista, des de la configuració de la fitxa', async () => {
  mocks.load.mockResolvedValue({ ...PEPA, propietari: true });
  render(<PerfilPublicSection agents={mocks.agents} />);
  expect(await screen.findByRole('heading', { level: 1, name: 'Pepa Garcia' })).toBeTruthy();
  expect(titol()).toBeTruthy();
  expect(await screen.findByText(/Rosa Pérez/)).toBeTruthy();
  expect(mocks.qui).toHaveBeenCalledWith({}, expect.objectContaining({ dataMode: 'seed', signal: expect.any(AbortSignal) }));
  /* Al peu de la fitxa, dins del cos de la pàgina i no a la capçalera. */
  expect(titol().closest('header.page-title')).toBeNull();
});

test('la fitxa d’una altra persona, la d’una entitat que administres i la d’una IA no en porten, i no demanen res', async () => {
  for (const perfil of [PEPA, FORN, { ...PEPA, tipus: 'ia', id: 'gall', nom: 'El Gall', esIA: true, propietari: true }]) {
    mocks.load.mockResolvedValue(perfil);
    render(<PerfilPublicSection agents={mocks.agents} />);
    expect(await screen.findByRole('heading', { level: 1, name: perfil.nom })).toBeTruthy();
    expect(titol(), perfil.nom).toBeNull();
    cleanup();
  }
  expect(mocks.qui).not.toHaveBeenCalled();
});

test('sense la capacitat de seguiments, la fitxa pròpia de sempre', async () => {
  mocks.capacitats = new Set(['directori']);
  mocks.load.mockResolvedValue({ ...PEPA, propietari: true });
  render(<PerfilPublicSection agents={mocks.agents} />);
  expect(await screen.findByRole('heading', { level: 1, name: 'Pepa Garcia' })).toBeTruthy();
  await waitFor(() => expect(mocks.load).toHaveBeenCalled());
  expect(titol()).toBeNull();
  expect(mocks.qui).not.toHaveBeenCalled();
});
