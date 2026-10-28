import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

/* P1-68 (decisió del Mestre 261028: «públic si el perfil és públic») · La
   fitxa pública d'una persona porta el seu @usuari com a píndola només si
   està publicada i l'identificador té la forma del servidor (2610282100).
   Mai en una privada (tampoc la pròpia), mai en una entitat ni en una IA.
   L'harnés és el de PerfilPublicSection.test.jsx. Noms sintètics. */
const mocks = vi.hoisted(() => ({
  id: 'u-anna', navigate: vi.fn(), load: vi.fn(), seo: vi.fn(), toast: vi.fn(), config: {},
  identitat: { memberships: [], actor: null, setActor: vi.fn() }, xat: { senseSessio: false }
}));
vi.mock('../xat/XatContext', () => ({ useXat: () => mocks.xat }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => mocks.identitat }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useParams: () => ({ agentId: mocks.id }),
  useNavigate: () => mocks.navigate,
  useLocation: () => ({ pathname: `/gent/${mocks.id}` }),
  useRouter: () => ({ navigate: mocks.navigate, currentPath: `/gent/${mocks.id}`, basename: '' }),
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

const ANNA = Object.freeze({ tipus: 'persona', id: 'u-anna', slug: null, nom: 'Anna Pérez Soler', avatar: '', hero: '', lema: '', bio: '', presentacioHtml: '',
  poble: 'Penàguila', esIA: false, publicat: true, propietari: false, copyright: '', creat: null, modificat: null, emoticona: '', usuari: 'annaperez' });
const etiquetes = (container) => [...container.querySelectorAll('header.page-title .page-title-labels > li')].map((li) => li.textContent);
const pinta = async (perfil) => {
  mocks.load.mockResolvedValue(perfil);
  const vista = render(<PerfilPublicSection agents={[]} />);
  await screen.findByRole('heading', { level: 1, name: perfil.nom });
  return vista.container;
};

afterEach(cleanup);
beforeEach(() => { vi.clearAllMocks(); mocks.config = {}; });

test('publicada: el poble i @usuari', async () => {
  expect(etiquetes(await pinta(ANNA))).toEqual(['Penàguila', '@annaperez']);
});

test('privada, també la pròpia: cap @usuari', async () => {
  expect(etiquetes(await pinta({ ...ANNA, publicat: false }))).toEqual(['Penàguila']);
  cleanup();
  expect(etiquetes(await pinta({ ...ANNA, publicat: false, propietari: true }))).toEqual(['Penàguila', 'La teua fitxa']);
});

test('sense identificador o amb una forma que no és la del servidor: res', async () => {
  expect(etiquetes(await pinta({ ...ANNA, usuari: null }))).toEqual(['Penàguila']);
  cleanup();
  expect(etiquetes(await pinta({ ...ANNA, usuari: 'Anna <b>' }))).toEqual(['Penàguila']);
});

test('una entitat o una IA no en porten mai', async () => {
  const entitat = await pinta({ ...ANNA, tipus: 'entitat', id: 'forn', nom: 'Forn Sintètic', usuari: 'forn' });
  expect(etiquetes(entitat).some((text) => text.startsWith('@'))).toBe(false);
});
