import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

/* T4 · la pàgina pública d'una persona, una entitat o la IAIA. */
/* Els objectes i funcions dels mocks són estables (hoisted): un valor nou a
   cada render entraria als deps de l'efecte de càrrega i faria un bucle. */
const mocks = vi.hoisted(() => ({
  id: 'iaia', navigate: vi.fn(), load: vi.fn(), capacitat: true, seo: vi.fn(), toast: vi.fn(),
  config: {}, t: (_, alternativa) => alternativa, resolveAsset: (v) => v, agents: [],
  /* T43 · la identitat de qui mira (pertinences i actor). */
  identitat: { memberships: [], actor: null, setActor: vi.fn() }
}));
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
vi.mock('../../data/backendPort.js', () => ({ teCapacitat: () => mocks.capacitat, loadPerfilPublic: mocks.load }));
vi.mock('../../host.js', () => ({ quanLlest: async () => {} }));
import PerfilPublicSection from './PerfilPublicSection.jsx';

const IAIA = { tipus: 'ia', id: 'iaia', slug: 'iaia-maria', nom: 'IAIA MarIA', avatar: '', hero: '', lema: 'Pensant en global', bio: 'Matriarca Digital', presentacioHtml: '<p>Cor antic i circuits nous.</p>', poble: 'La Torre de les Maçanes', esIA: true, publicat: true, propietari: false, copyright: '' };
const ENTITAT = { ...IAIA, tipus: 'entitat', id: 'socdepoble', nom: 'Sóc de Poble', esIA: false, propietari: true, presentacioHtml: '' };

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks(); mocks.config = {}; mocks.id = 'iaia'; mocks.capacitat = true; mocks.load.mockResolvedValue(IAIA);
  mocks.identitat = { memberships: [], actor: null, setActor: vi.fn(() => true) };
});

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
  /* Poliment T45 · en remot la fitxa d'una altra persona encara no es pot
     llegir: el text no diu només «és privada». */
  expect(screen.getByText(/Les fitxes d’altres persones encara no es poden obrir en este servidor/)).toBeTruthy();
});

test('en seed el «Perfil no trobat» no parla de cap límit del servidor', async () => {
  mocks.config = { dataMode: 'seed' };
  mocks.id = 'ningu';
  mocks.load.mockResolvedValue(null);
  render(<PerfilPublicSection agents={mocks.agents} />);
  expect(await screen.findByRole('heading', { level: 1, name: 'Perfil no trobat' })).toBeTruthy();
  expect(screen.getByText('Ningú del poble té este identificador, o la seua fitxa és privada.')).toBeTruthy();
  expect(screen.queryByText(/encara no es poden obrir/)).toBeNull();
});

/* T43 (ordre del Mestre, 260928) · la fitxa pública és connectable: abans
   passava onConnect={false}, que UniversalPage no respectava (sortia el
   Connectar genèric, només amb el nom). Ara porta el descriptor del perfil. */
const destiDe = (crida) => {
  const url = new URL(crida, 'http://localhost');
  return { ruta: url.pathname, params: Object.fromEntries(url.searchParams) };
};

test('T43 · CONNECTAR d’una persona (o de la IAIA) porta objecte i ruta del perfil, sense organització', async () => {
  render(<PerfilPublicSection agents={mocks.agents} />);
  await screen.findByRole('heading', { level: 1, name: 'IAIA MarIA' });
  fireEvent.click(screen.getByRole('button', { name: 'Connectar' }));
  const desti = destiDe(mocks.navigate.mock.calls.at(-1)[0]);
  expect(desti.ruta).toBe('/connectar');
  expect(desti.params).toEqual({ item_id: 'iaia', title: 'IAIA MarIA', sectionId: 'perfil', objecte: 'ia', ruta: '/perfil/iaia' });
});

test('T43 · CONNECTAR d’una entitat afig organitzacio=ID per al lent d’administrar', async () => {
  mocks.id = 'socdepoble';
  mocks.load.mockResolvedValue(ENTITAT);
  render(<PerfilPublicSection agents={mocks.agents} />);
  await screen.findByRole('heading', { level: 1, name: 'Sóc de Poble' });
  fireEvent.click(screen.getByRole('button', { name: 'Connectar' }));
  expect(destiDe(mocks.navigate.mock.calls.at(-1)[0]).params).toEqual({
    item_id: 'socdepoble', title: 'Sóc de Poble', sectionId: 'perfil', objecte: 'entitat', ruta: '/empresa/socdepoble', organitzacio: 'socdepoble'
  });
});

/* ── T43b (ordre del Mestre, 260928) · administrar i correu públic ── */

const FORN = { ...ENTITAT, id: 'o-1', slug: 'forn', nom: 'Forn de la Torre', propietari: false };

test('T43 · qui administra una entitat (pertinença) veu «Edita la fitxa» cap a la seua fitxa i «Actua com a»', async () => {
  mocks.id = 'forn';
  mocks.load.mockResolvedValue(FORN);
  mocks.identitat.memberships = [{ id: 'o-1', slug: 'forn', name: 'Forn de la Torre', role: 'admin' }];
  mocks.identitat.actor = { tipus: 'persona', id: 'u-1', nom: 'Pepa' };
  render(<PerfilPublicSection agents={mocks.agents} />);
  await screen.findByRole('heading', { level: 1, name: 'Forn de la Torre' });
  fireEvent.click(screen.getByRole('button', { name: 'Edita la fitxa' }));
  expect(mocks.navigate).toHaveBeenLastCalledWith('/el-meu-perfil?organitzacio=o-1');
  /* Canviar d'identitat és un botó a banda, mai un efecte d'editar. */
  expect(mocks.identitat.setActor).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Actua com a Forn de la Torre' }));
  expect(mocks.identitat.setActor).toHaveBeenCalledWith('entitat', 'o-1');
});

test('T43 · si ja actues com a l’entitat no hi ha «Actua com a», i un membre no l’edita', async () => {
  mocks.id = 'forn';
  mocks.load.mockResolvedValue(FORN);
  mocks.identitat.memberships = [{ id: 'o-1', slug: 'forn', role: 'owner' }];
  mocks.identitat.actor = { tipus: 'entitat', id: 'o-1', nom: 'Forn de la Torre' };
  const vista = render(<PerfilPublicSection agents={mocks.agents} />);
  await screen.findByRole('heading', { level: 1, name: 'Forn de la Torre' });
  expect(screen.queryByRole('button', { name: 'Actua com a Forn de la Torre' })).toBeNull();
  expect(screen.getByRole('status').textContent).toBe('Ara actues com a Forn de la Torre.');
  vista.unmount();
  mocks.identitat.memberships = [{ id: 'o-1', slug: 'forn', role: 'member' }];
  mocks.identitat.actor = null;
  render(<PerfilPublicSection agents={mocks.agents} />);
  await screen.findByRole('heading', { level: 1, name: 'Forn de la Torre' });
  expect(screen.queryByRole('button', { name: 'Edita la fitxa' })).toBeNull();
  expect(screen.queryByRole('button', { name: /Actua com a/ })).toBeNull();
});

test('T43 · el correu públic d’una organització ix amb mailto validat; un correu dubtós o d’una persona, no', async () => {
  mocks.id = 'forn';
  mocks.load.mockResolvedValue({ ...FORN, correu: 'hola@forn.cat' });
  const vista = render(<PerfilPublicSection agents={mocks.agents} />);
  const enllac = await screen.findByRole('link', { name: 'hola@forn.cat' });
  expect(enllac.getAttribute('href')).toBe('mailto:hola@forn.cat');
  expect(enllac.closest('p').textContent).toBe('Correu: hola@forn.cat');
  vista.unmount();
  mocks.load.mockResolvedValue({ ...FORN, correu: 'hola@forn.cat?bcc=altre@x.cat' });
  const dubtos = render(<PerfilPublicSection agents={mocks.agents} />);
  await screen.findByRole('heading', { level: 1, name: 'Forn de la Torre' });
  expect(screen.queryByText(/Correu:/)).toBeNull();
  dubtos.unmount();
  mocks.load.mockResolvedValue({ ...IAIA, tipus: 'persona', esIA: false, correu: 'pepa@x.cat' });
  render(<PerfilPublicSection agents={mocks.agents} />);
  await screen.findByRole('heading', { level: 1, name: 'IAIA MarIA' });
  expect(screen.queryByText(/pepa@x\.cat/)).toBeNull();
});

test('fins i tot en seed una resposta nul·la del port és autoritativa', async () => {
  mocks.config = { dataMode: 'seed' };
  mocks.load.mockResolvedValue(null);
  render(<PerfilPublicSection agents={[{ id: 'iaia', name: 'IAIA inventada', type: 'AI' }]} />);
  expect(await screen.findByRole('heading', { level: 1, name: 'Perfil no trobat' })).toBeTruthy();
});
