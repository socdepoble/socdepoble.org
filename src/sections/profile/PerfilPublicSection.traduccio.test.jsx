import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

/* Gauntlet 261030 (cicle 2, traduir-fitxa-propia-veinat-connectat; decisió 7)
   · La fitxa pròpia d'una persona, mirada per ella, porta al peu el veïnat
   connectat amb ella («Esta llista només la veus tu»): Traduir no hi envia
   res (el botó avisa, cap petició). La fitxa que mira una altra persona es
   continua traduint. Els mateixos dobles que PerfilPublicSection.seguidors.test.jsx,
   amb el transport lliure fixat com fa main.jsx i un fetch fals. */
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

test('la fitxa pròpia amb el veïnat connectat: Traduir avisa i no envia cap nom (cap petició)', async () => {
  mocks.load.mockResolvedValue(PEPA);
  const { container } = render(<PerfilPublicSection agents={mocks.agents} />);
  expect(await screen.findByText(/Rosa Inventada Secreta/)).toBeTruthy();
  const boto = traduir(container);
  expect(boto.hasAttribute('aria-haspopup')).toBe(false);
  await act(async () => { fireEvent.click(boto); });
  expect(mocks.toast).toHaveBeenCalledWith('Esta pàgina no es traduïx: el que mostra no ix d’este dispositiu.');
  expect(screen.queryByRole('menu')).toBeNull();
  expect(fetch).not.toHaveBeenCalled();
});

test('la fitxa d’una persona que mira una altra: Traduir es continua traduint (menú de llengües)', async () => {
  mocks.load.mockResolvedValue({ ...PEPA, propietari: false });
  const { container } = render(<PerfilPublicSection agents={mocks.agents} />);
  expect(await screen.findByRole('heading', { level: 1, name: 'Pepa Inventada' })).toBeTruthy();
  expect(screen.queryByText(/Rosa Inventada Secreta/)).toBeNull();
  const boto = traduir(container);
  expect(boto.getAttribute('aria-haspopup')).toBe('menu');
  fireEvent.click(boto);
  await act(async () => {
    fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitemradio', { name: 'Castellà' }));
  });
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
  expect(fetch).toHaveBeenCalled();
  expect(fetch.mock.calls.some(([, { body }]) => /Rosa|Forn Inventat/.test(body.get('q')))).toBe(false);
});

/* Gauntlet 261030 (Fase 3, TC3.2; traduir-contingut-de-membres) · Només una
   fitxa pública (DTO `publicat`): la d'una entitat només per als membres
   (visibility 'members') o una fitxa privada no ixen cap al motor; sense la
   marca, tampoc (fallada tancada). El botó no canvia. */
test('TC3.2 · fitxa d’una entitat només per als membres (publicat fals) o sense marca: Traduir avisa i no envia res', async () => {
  const ENTITAT = {
    tipus: 'entitat', id: 'e-inventada', slug: 'e-inventada', nom: 'Associació Inventada', avatar: '', hero: '', lema: '',
    bio: 'Text intern inventat', presentacioHtml: '', poble: 'La Torre de les Maçanes', esIA: false, propietari: false, copyright: ''
  };
  mocks.id = 'e-inventada';
  for (const fitxa of [{ ...ENTITAT, publicat: false }, { ...ENTITAT }]) {
    mocks.toast.mockClear();
    mocks.load.mockResolvedValue(fitxa);
    const { container, unmount } = render(<PerfilPublicSection agents={mocks.agents} />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Associació Inventada' })).toBeTruthy();
    const boto = traduir(container);
    expect(boto.hasAttribute('aria-haspopup')).toBe(false);
    await act(async () => { fireEvent.click(boto); });
    expect(mocks.toast).toHaveBeenCalledWith('Esta pàgina no es traduïx: el que mostra no ix d’este dispositiu.');
    expect(screen.queryByRole('menu')).toBeNull();
    unmount();
  }
  expect(fetch).not.toHaveBeenCalled();
  mocks.load.mockResolvedValue({ ...ENTITAT, publicat: true });
  const { container } = render(<PerfilPublicSection agents={mocks.agents} />);
  expect(await screen.findByRole('heading', { level: 1, name: 'Associació Inventada' })).toBeTruthy();
  expect(traduir(container).getAttribute('aria-haspopup')).toBe('menu');
});
