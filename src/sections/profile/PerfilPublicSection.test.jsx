import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

/* T4 · la pàgina pública d'una persona, una entitat o la IAIA. */
/* Els objectes i funcions dels mocks són estables (hoisted): un valor nou a
   cada render entraria als deps de l'efecte de càrrega i faria un bucle. */
const mocks = vi.hoisted(() => ({
  id: 'iaia', navigate: vi.fn(), load: vi.fn(), capacitat: true, seo: vi.fn(), toast: vi.fn(),
  config: {}, t: (_, alternativa) => alternativa, resolveAsset: (v) => v, agents: []
}));
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
vi.mock('../../data/backendPort.js', () => ({ teCapacitat: () => mocks.capacitat, loadPerfilPublic: mocks.load }));
vi.mock('../../host.js', () => ({ quanLlest: async () => {} }));
import PerfilPublicSection from './PerfilPublicSection.jsx';

const IAIA = { tipus: 'ia', id: 'iaia', slug: 'iaia-maria', nom: 'IAIA MarIA', avatar: '', hero: '', lema: 'Pensant en global', bio: 'Matriarca Digital', presentacioHtml: '<p>Cor antic i circuits nous.</p>', poble: 'La Torre de les Maçanes', esIA: true, publicat: true, propietari: false, copyright: '' };
const ENTITAT = { ...IAIA, tipus: 'entitat', id: 'socdepoble', nom: 'Sóc de Poble', esIA: false, propietari: true, presentacioHtml: '' };

afterEach(cleanup);
beforeEach(() => { vi.clearAllMocks(); mocks.config = {}; mocks.id = 'iaia'; mocks.capacitat = true; mocks.load.mockResolvedValue(IAIA); });

test('la IAIA porta avís d’intel·ligència artificial i el botó parla amb ella al xat', async () => {
  render(<PerfilPublicSection agents={mocks.agents} />);
  expect(await screen.findByRole('heading', { level: 1, name: 'IAIA MarIA' })).toBeTruthy();
  expect(mocks.load).toHaveBeenCalledWith('iaia', mocks.config);
  const avis = screen.getByRole('status');
  expect(avis.textContent).toContain('Este perfil és una intel·ligència artificial');
  expect(screen.getByText('Intel·ligència artificial', { selector: '.sp-card-label' })).toBeTruthy();
  expect(screen.getByText('Cor antic i circuits nous.')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Parla amb la IAIA' }));
  expect(mocks.navigate).toHaveBeenCalledWith('/xat?amb=iaia');
  expect(screen.queryByRole('button', { name: 'Edita la fitxa' })).toBeNull();
  expect(mocks.seo).toHaveBeenLastCalledWith(expect.objectContaining({ title: 'IAIA MarIA', index: true }));
});

test('la fitxa pròpia d’una entitat s’edita des del Workspace i no porta avís d’IA', async () => {
  mocks.id = 'soc-de-poble';
  mocks.load.mockResolvedValue(ENTITAT);
  render(<PerfilPublicSection agents={mocks.agents} />);
  expect(await screen.findByRole('heading', { level: 1, name: 'Sóc de Poble' })).toBeTruthy();
  expect(screen.queryByRole('status')).toBeNull();
  expect(screen.getByText('La teua fitxa', { selector: '.sp-card-label' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Edita la fitxa' }));
  expect(mocks.navigate).toHaveBeenCalledWith('/el-meu-perfil');
  fireEvent.click(screen.getByRole('button', { name: 'Escriu-li al xat' }));
  expect(mocks.navigate).toHaveBeenCalledWith('/xat?amb=socdepoble');
});

test('sense la capacitat del port cau al catàleg d’agents; sense ningú, «Perfil no trobat»', async () => {
  mocks.config = { dataMode: 'seed' };
  mocks.capacitat = false;
  mocks.id = '0001';
  const agents = [{ id: '0001', name: 'Mestre Poble', role: 'Coordinador', type: 'PERSON', short_bio: 'Visionari.' }];
  render(<PerfilPublicSection agents={agents} />);
  expect(await screen.findByRole('heading', { level: 1, name: 'Mestre Poble' })).toBeTruthy();
  expect(mocks.load).not.toHaveBeenCalled();
  expect(screen.getByText('Persona', { selector: '.sp-card-label' })).toBeTruthy();
  cleanup();
  mocks.id = 'ningu';
  render(<PerfilPublicSection agents={agents} />);
  await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: 'Perfil no trobat' })).toBeTruthy());
  fireEvent.click(screen.getByRole('button', { name: 'Torna al directori' }));
  expect(mocks.navigate).toHaveBeenCalledWith('/perfil');
});

test.each([true, false])('en remot cap catàleg suplix un perfil absent (directori=%s)', async capacitat => {
  mocks.capacitat = capacitat;
  mocks.id = 'socdepoble';
  mocks.load.mockResolvedValue(null);
  render(<PerfilPublicSection agents={[{ id: 'socdepoble', name: 'Sóc de Poble', type: 'COMPANY' }]} />);
  expect(await screen.findByRole('heading', { level: 1, name: 'Perfil no trobat' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Escriu-li al xat' })).toBeNull();
});

test('fins i tot en seed una resposta nul·la del port és autoritativa', async () => {
  mocks.config = { dataMode: 'seed' };
  mocks.load.mockResolvedValue(null);
  render(<PerfilPublicSection agents={[{ id: 'iaia', name: 'IAIA inventada', type: 'AI' }]} />);
  expect(await screen.findByRole('heading', { level: 1, name: 'Perfil no trobat' })).toBeTruthy();
});
