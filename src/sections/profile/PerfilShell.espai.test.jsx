import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';

/* L'espai de treball del Perfil amb el UniversalWorkspace DE VERITAT: les
   proves de PerfilShell.test miren el model; estes miren que el Workspace
   el pinta com el Bloc de Notes (tres columnes, grups amb etiqueta) i que
   cada clic porta on toca. Els detalls pesats van simulats. */
const m = vi.hoisted(() => ({ perfil: null, caps: new Set() }));
vi.mock('../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: (ref) => ({ url: ref, status: ref ? 'ready' : 'idle', error: null, isLoading: false, retry: () => {}, cancel: () => {} }),
}));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorId: null, refresh: vi.fn() }) }));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => ({ agents: [] }) }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ currentUser: null, estat: 'fora' }) }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useRouter: () => ({ navigate: vi.fn(), location: { pathname: '/' } }),
  useNavigate: () => vi.fn(),
  /* T43 · PerfilShell llig ?organitzacio=ID per a triar què obri primer. */
  useSearchParams: () => [new URLSearchParams()],
  Link: ({ to, children }) => <a href={to}>{children}</a>,
}));
vi.mock('../../app/contexts/UIContext', () => ({ useUI: () => ({ externalConfig: {} }) }));
vi.mock('../../components/universal/ContentProvider', () => ({ useContent: () => null }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../data/backendPort.js', () => ({ teCapacitat: (cap) => m.caps.has(cap) }));
vi.mock('./PerfilContext.jsx', () => ({ PerfilProvider: ({ children }) => children, usePerfil: () => m.perfil }));
vi.mock('./PerfilEditor.jsx', () => ({ PerfilEditor: ({ identitat }) => <p>{`fitxa de ${identitat.nom}`}</p> }));
vi.mock('./DetallCompte.jsx', () => ({ DetallCompte: ({ identitat }) => <p>{`compte de ${identitat.nom}`}</p> }));
vi.mock('./DetallPrivacitat.jsx', () => ({ DetallPrivacitat: ({ identitat }) => <p>{`privacitat de ${identitat.nom}`}</p> }));
vi.mock('./DialegNovaOrganitzacio.jsx', () => ({
  DialegNovaOrganitzacio: ({ obert }) => (obert ? <div role="dialog" aria-label="Nova organització" /> : null),
}));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ title, lead, children }) => (
    <main><header className="page-title"><h1>{title}</h1></header><p>{lead}</p>{children}</main>
  ),
}));
import PerfilShell from './PerfilShell.jsx';

const jo = { id: 'jo', mena: 'persona', nom: 'Javi Llinares', dades: {} };
const forn = { id: 'O', mena: 'empresa', nom: 'Forn', dades: { role: 'owner' } };

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  }
  // jsdom no fa layout: sense amplada, AppGridShell cauria a «estret» i amagaria la columna esquerra.
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 1400 });
});
beforeEach(() => {
  m.caps = new Set();
  m.perfil = {
    identitats: [jo, forn], carregant: false, error: null,
    guardarAjust: vi.fn(), pujaMitja: vi.fn(), recarrega: vi.fn(), creaOrganitzacio: vi.fn(),
  };
});
afterEach(cleanup);

const navegacio = () => screen.getByRole('navigation', { name: 'PERFIL' });
const etiquetesDe = (arrel) => [...arrel.querySelectorAll('.sdp-workspace-nav-item__label')].map((e) => e.textContent);
const apartats = (container) => [...container.querySelectorAll('.sdp-gestor-fitxa__titol')].map((e) => e.textContent);
const detall = (container) => container.querySelector('.sdp-workspace-detail');

test('la primera columna, en ordre: la persona pel seu nom, GRUPS I EMPRESES i APLICACIONS', () => {
  const { container } = render(<PerfilShell />);
  expect(etiquetesDe(navegacio())).toEqual([
    'Javi Llinares', 'GRUPS I EMPRESES', 'Forn', 'APLICACIONS', 'Gestoria de Poble', 'Llibreria', 'Ajuntament',
  ]);
  expect(within(navegacio()).getByRole('button', { name: 'GRUPS I EMPRESES' }).getAttribute('aria-expanded')).toBe('true');
  // En entrar: la persona activa, els seus apartats i la fitxa oberta.
  expect(within(navegacio()).getByRole('button', { name: 'Javi Llinares' }).getAttribute('aria-current')).toBe('page');
  /* T9 (261001) · «Els nodes» és l'últim apartat de la persona. */
  expect(apartats(container)).toEqual(['La fitxa', 'El compte', 'Els nodes']);
  expect(within(detall(container)).getByText('fitxa de Javi Llinares')).toBeTruthy();
  expect(container.querySelector('.perfil-espai .perfil-espai__detall')).toBe(detall(container));
});

test('cada element de l’esquerra obri els seus apartats i el primer al detall', () => {
  m.caps = new Set(['compte']);
  const { container } = render(<PerfilShell />);
  expect(apartats(container)).toEqual(['La fitxa', 'El compte', 'Privacitat i dades', 'Els nodes']);
  fireEvent.click(within(container).getByRole('button', { name: /Privacitat i dades/ }));
  expect(within(detall(container)).getByText('privacitat de Javi Llinares')).toBeTruthy();

  /* T9 · «Els nodes» obri la seua pàgina de lectura: sense amfitrió, només Sóc de Poble. */
  fireEvent.click(within(container).getByRole('button', { name: /Els nodes/ }));
  const nodes = detall(container);
  expect(within(nodes).getByRole('heading', { level: 1, name: 'Els nodes' })).toBeTruthy();
  expect([...nodes.querySelectorAll('ul.sdp-llista-nodes > li strong')].map((s) => s.textContent)).toEqual(['Sóc de Poble']);
  expect(within(nodes).getByRole('link', { name: 'Com funcionen els nodes i el Fedivers' }).getAttribute('href')).toBe('/fedivers');
  expect(within(nodes).queryAllByRole('button')).toEqual([]);

  fireEvent.click(within(navegacio()).getByRole('button', { name: 'Forn' }));
  expect(apartats(container)).toEqual(['La fitxa', 'El compte']);
  expect(within(detall(container)).getByText('fitxa de Forn')).toBeTruthy();

  fireEvent.click(within(navegacio()).getByRole('button', { name: 'Gestoria de Poble' }));
  expect(apartats(container)).toEqual(['Sobre esta utilitat']);
  const pagina = detall(container);
  expect(within(pagina).getByRole('heading', { level: 1, name: 'Gestoria de Poble' })).toBeTruthy();
  expect(within(pagina).getByText('Pendent de connectar en este node')).toBeTruthy();
  expect(within(pagina).queryAllByRole('button')).toEqual([]);
  expect(within(pagina).queryAllByRole('link')).toEqual([]);
});

test('sense organitzacions: el grup es veu, explica com crear-ne una i NOVA ORG obri el diàleg', () => {
  m.perfil = { ...m.perfil, identitats: [jo] };
  const { container } = render(<PerfilShell />);
  expect(etiquetesDe(navegacio())).toContain('Encara no en tens cap');
  fireEvent.click(within(navegacio()).getByRole('button', { name: 'Encara no en tens cap' }));
  expect(apartats(container)).toEqual(['Crear un grup o una empresa']);
  expect(within(detall(container)).getByRole('heading', { level: 1, name: 'Grups i empreses' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'NOVA ORG' }));
  expect(screen.getByRole('dialog', { name: 'Nova organització' })).toBeTruthy();
});
