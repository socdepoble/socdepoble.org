/**
 * Gauntlet 261030 (cicle 4, lang-ca-nomes-a-textsection) · Decisió del Mestre
 * (261030): «lang="ca" al contingut original en valencià quan la interfície
 * està en una altra llengua». Mesura en viu: amb la interfície en anglés, /iaia
 * llegia «Pensant en global, treballant en local.» amb la veu anglesa (WCAG
 * 3.1.2). La fitxa de la IAIA és text del projecte, en valencià: l'H1, el
 * subtítol, el lema i la presentació porten lang="ca". La fitxa d'una persona
 * no declara cap llengua (l'escriu qui vol, en la llengua que vol). Amb la
 * interfície en valencià, cap lang (el DOM de sempre). La pàgina és la de veres
 * (UniversalPage i PageFrame); els dobles són els de PerfilPublicSection.iaia.test.jsx.
 */
import { createElement } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  id: 'iaia-maria', navigate: vi.fn(), load: vi.fn(), seo: vi.fn(), toast: vi.fn(),
  config: { dataMode: 'seed' }, t: (_, alternativa) => alternativa, resolveAsset: (valor) => valor,
  identitat: { memberships: [], actor: null, setActor: () => true }, llengua: 'en'
}));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => mocks.identitat }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useParams: () => ({ agentId: mocks.id }),
  useNavigate: () => mocks.navigate,
  useLocation: () => ({ pathname: `/perfil/${mocks.id}` }),
  useRouter: () => ({ navigate: mocks.navigate, currentPath: `/perfil/${mocks.id}`, basename: '' }),
  Link: ({ to, children, ...resta }) => createElement('a', { href: to, ...resta }, children)
}));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: mocks.t, resolveAsset: mocks.resolveAsset }),
  useUIState: () => ({ externalConfig: mocks.config, locale: 'ca-ES', language: mocks.llengua, llenguaDelText: mocks.llengua })
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: (opcions) => mocks.seo(opcions) }));
vi.mock('../../data/backendPort.js', () => ({ teCapacitat: () => true, loadPerfilPublic: mocks.load }));
vi.mock('../../host.js', () => ({ quanLlest: async () => {} }));

import PerfilPublicSection from './PerfilPublicSection.jsx';
import { AGENTS_MAP } from '../../data/agentsSeed.js';
import { createLocalPerfilsAdapter } from '../../data/localPerfils.js';

const PEPA = {
  tipus: 'persona', id: 'pepa', slug: 'pepa', nom: 'Pepa Inventada', avatar: '', hero: '', lema: 'Un lema inventat', bio: 'Mestra jubilada',
  presentacioHtml: '<p>Una presentació inventada.</p>', poble: 'La Torre de les Maçanes', esIA: false, publicat: true, propietari: false, copyright: ''
};
const original = (container) => container.querySelector('article.content-wrapper:not(.sdp-traduccio-cos)');

let perfils;
afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  mocks.id = 'iaia-maria';
  mocks.llengua = 'en';
  perfils = createLocalPerfilsAdapter();
  mocks.load.mockImplementation(async (clau) => (clau === 'pepa' ? PEPA : perfils.loadPerfilPublic(clau, null)));
});

async function obri(id) {
  mocks.id = id;
  const pintada = render(createElement(PerfilPublicSection, { agents: [] }));
  await screen.findByText(/Qui és la IAIA MarIA\?|Una presentació inventada\./);
  return pintada.container;
}

test('/iaia amb la interfície en anglés: l’H1, la capçalera i la presentació porten lang="ca"; l’article sencer, no', async () => {
  const container = await obri('iaia-maria');
  const h1 = container.querySelector('header.page-title h1');
  expect([h1.textContent, h1.getAttribute('lang')]).toEqual([AGENTS_MAP.IAIA.name, 'ca']);
  expect(original(container).querySelector('.page-intro').getAttribute('lang')).toBe('ca');
  /* Amb la targeta de l'Ànima, cada tros de text porta el lang (CosAmbTargetes,
     cicle 3); la targeta i el seu article, no: hi ha botons de la interfície. */
  const presentacio = [...original(container).querySelectorAll('article.detail-content:not(.sdp-amb-targetes), .sdp-cos-tros')];
  expect(presentacio.length).toBeGreaterThan(0);
  expect(presentacio.map((node) => node.getAttribute('lang'))).toEqual(presentacio.map(() => 'ca'));
  expect(presentacio.map((node) => node.textContent).join(' ')).toContain('Qui és la IAIA MarIA?');
  expect(original(container).hasAttribute('lang')).toBe(false);
});

test('la fitxa d’una persona no declara cap llengua', async () => {
  const container = await obri('pepa');
  expect(container.querySelector('header.page-title h1').hasAttribute('lang')).toBe(false);
  expect(original(container).querySelectorAll('[lang]')).toHaveLength(0);
});

test('amb la interfície en valencià, la fitxa de la IAIA no porta cap lang (el DOM de sempre)', async () => {
  mocks.llengua = 'ca';
  const container = await obri('iaia-maria');
  expect(container.querySelectorAll('[lang]')).toHaveLength(0);
});
