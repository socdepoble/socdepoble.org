import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';

/* L'espai de treball del Perfil amb el UniversalWorkspace DE VERITAT: les
   proves de PerfilShell.test miren el model; estes miren que el Workspace
   el pinta com el Bloc de Notes (tres columnes, grups amb etiqueta) i que
   cada clic porta on toca. Els detalls pesats van simulats. */
const m = vi.hoisted(() => ({ perfil: null, caps: new Set(), sessio: null }));
vi.mock('../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: (ref) => ({ url: ref, status: ref ? 'ready' : 'idle', error: null, isLoading: false, retry: () => {}, cancel: () => {} }),
}));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorId: null, refresh: vi.fn() }) }));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => ({ agents: [] }) }));
/* Gauntlet 261016 (Bloc 3.4) · PerfilShell llig si qui mira és superadmin
   (useSessioOpcional): les utilitats internes només ixen per a ell. */
vi.mock('../../app/contexts/SessionContext.jsx', () => ({
  useSession: () => ({ currentUser: null, estat: 'fora' }),
  useSessioOpcional: () => m.sessio,
}));
vi.mock('../../app/contexts/RouterContext', () => ({
  useRouter: () => ({ navigate: vi.fn(), location: { pathname: '/' } }),
  useNavigate: () => vi.fn(),
  /* T43 · PerfilShell llig ?organitzacio=ID per a triar què obri primer. */
  useSearchParams: () => [new URLSearchParams()],
  /* Encàrrec 261018_1220 · PerfilShell llig l'estat de l'historial (espaiIdentitat). */
  useLocation: () => ({ pathname: '/el-meu-perfil', search: '', state: null, hash: '' }),
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
vi.mock('./DetallVistes.jsx', () => ({ DetallVistes: ({ identitat }) => <p>{`vistes de ${identitat.nom}`}</p> }));
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
  m.sessio = null;
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

/* Gauntlet 261016 (Bloc 3.4; ordre del Mestre: «retirar definitivament la
   maquinària interna de desenvolupament de l'aside en pantalles d'usuari») ·
   Prova actualitzada a propòsit. Abans fixava les cinc utilitats per a
   tothom; ara la Consola de Mètriques i el Cervell (intern: true) només ixen
   per a qui és superadmin (prova de davall). */
test('la primera columna, en ordre: la persona pel seu nom, GRUPS I EMPRESES i APLICACIONS, sense la maquinària interna', () => {
  const { container } = render(<PerfilShell />);
  expect(etiquetesDe(navegacio())).toEqual([
    'Javi Llinares', 'GRUPS I EMPRESES', 'Forn', 'APLICACIONS', 'Gestoria de Poble', 'Rebost Domèstic', 'Salut', 'Lector RSS', 'TPV del Bar', 'Snippet',
  ]);
  expect(within(navegacio()).getByRole('button', { name: 'GRUPS I EMPRESES' }).getAttribute('aria-expanded')).toBe('true');
  // En entrar: la persona activa, els seus apartats i la fitxa oberta.
  expect(within(navegacio()).getByRole('button', { name: 'Javi Llinares' }).getAttribute('aria-current')).toBe('page');
  /* T9 (261001) · «Els nodes», abans l'últim apartat de la persona.
     Expectativa actualitzada a propòsit: Pla 261018_1605, Tasca 4 («Multimèdia», l’últim apartat de la persona).
     Ordre del Mestre (261008) · «Les vistes», just després de «La fitxa». */
  expect(apartats(container)).toEqual(['La fitxa', 'Les vistes', 'El compte', 'Els nodes', 'Multimèdia']);
  expect(within(detall(container)).getByText('fitxa de Javi Llinares')).toBeTruthy();
  expect(container.querySelector('.perfil-espai .perfil-espai__detall')).toBe(detall(container));
});

test('Bloc 3.4 · qui és superadmin hi veu també la Consola de Mètriques i el Cervell, al seu lloc', () => {
  m.sessio = { esSuperadmin: true };
  render(<PerfilShell />);
  expect(etiquetesDe(navegacio())).toEqual([
    'Javi Llinares', 'GRUPS I EMPRESES', 'Forn', 'APLICACIONS', 'Gestoria de Poble', 'Rebost Domèstic', 'Salut', 'Lector RSS', 'TPV del Bar', 'Snippet', 'Consola de Mètriques', 'Cervell (Node Graph)',
  ]);
  /* Una sessió que no és superadmin, o un valor que no és un sí, no les mostra. */
  for (const sessio of [{ esSuperadmin: false }, { rol: 'veí' }, {}]) {
    cleanup();
    m.sessio = sessio;
    render(<PerfilShell />);
    expect(etiquetesDe(navegacio())).not.toContain('Consola de Mètriques');
    expect(etiquetesDe(navegacio())).not.toContain('Cervell (Node Graph)');
  }
});

test('Bloc 3.4 · una selecció que apuntava a una utilitat interna no peta quan deixa de veure’s: l’espai torna a la primera categoria', () => {
  m.sessio = { esSuperadmin: true };
  const { container, rerender } = render(<PerfilShell />);
  fireEvent.click(within(navegacio()).getByRole('button', { name: 'Consola de Mètriques' }));
  expect(within(detall(container)).getByRole('heading', { level: 1, name: 'Consola de Mètriques' })).toBeTruthy();
  m.sessio = null;
  rerender(<PerfilShell />);
  expect(etiquetesDe(navegacio())).not.toContain('Consola de Mètriques');
  expect(within(navegacio()).getByRole('button', { name: 'Javi Llinares' }).getAttribute('aria-current')).toBe('page');
  // Expectativa actualitzada a propòsit: Pla 261018_1605, Tasca 4 («Multimèdia», l’últim apartat de la persona).
  expect(apartats(container)).toEqual(['La fitxa', 'Les vistes', 'El compte', 'Els nodes', 'Multimèdia']);
  expect(within(detall(container)).queryByRole('heading', { level: 1, name: 'Consola de Mètriques' })).toBeNull();
});

/* Revisió adversarial del carril D (261016, problema 2) · A cada renovació
   del JWT la sessió torna a comprovar el rol del mateix compte ('dins' amb el
   rol 'desconegut' arriba com a 'comprovant') i esSuperadmin val false un
   moment. Abans, les internes desapareixien i el superadmin queia a la
   persona; ara es conserva l'últim rol resolt (useSuperadminEstable). */
test('Bloc 3.4 · la renovació del JWT d’un superadmin que és a les Mètriques no el trau d’allí', () => {
  const usuari = { id: 'u-1' };
  m.sessio = { estat: 'dins', currentUser: usuari, rol: 'superadmin', esSuperadmin: true };
  const { container, rerender } = render(<PerfilShell />);
  fireEvent.click(within(navegacio()).getByRole('button', { name: 'Consola de Mètriques' }));
  const titol = within(detall(container)).getByRole('heading', { level: 1, name: 'Consola de Mètriques' });
  m.sessio = { estat: 'comprovant', currentUser: usuari, rol: 'desconegut', esSuperadmin: false };
  rerender(<PerfilShell />);
  expect(etiquetesDe(navegacio())).toContain('Consola de Mètriques');
  expect(etiquetesDe(navegacio())).toContain('Cervell (Node Graph)');
  // El mateix node: ni s'ha reconciliat ni s'ha tornat a muntar.
  expect(within(detall(container)).getByRole('heading', { level: 1, name: 'Consola de Mètriques' })).toBe(titol);
  m.sessio = { estat: 'dins', currentUser: usuari, rol: 'superadmin', esSuperadmin: true };
  rerender(<PerfilShell />);
  expect(within(detall(container)).getByRole('heading', { level: 1, name: 'Consola de Mètriques' })).toBe(titol);
});

test('Bloc 3.4 · si en tornar el rol ja no és superadmin, les internes se’n van i l’espai torna a la persona', () => {
  const usuari = { id: 'u-1' };
  m.sessio = { estat: 'dins', currentUser: usuari, rol: 'superadmin', esSuperadmin: true };
  const { container, rerender } = render(<PerfilShell />);
  fireEvent.click(within(navegacio()).getByRole('button', { name: 'Consola de Mètriques' }));
  m.sessio = { estat: 'comprovant', currentUser: usuari, rol: 'desconegut', esSuperadmin: false };
  rerender(<PerfilShell />);
  m.sessio = { estat: 'dins', currentUser: usuari, rol: 'usuari', esSuperadmin: false };
  rerender(<PerfilShell />);
  expect(etiquetesDe(navegacio())).not.toContain('Consola de Mètriques');
  expect(within(navegacio()).getByRole('button', { name: 'Javi Llinares' }).getAttribute('aria-current')).toBe('page');
  expect(within(detall(container)).queryByRole('heading', { level: 1, name: 'Consola de Mètriques' })).toBeNull();
});

test('cada element de l’esquerra obri els seus apartats i el primer al detall', () => {
  m.caps = new Set(['compte']);
  const { container } = render(<PerfilShell />);
  // Expectativa actualitzada a propòsit: Pla 261018_1605, Tasca 4 («Multimèdia», l’últim apartat de la persona).
  expect(apartats(container)).toEqual(['La fitxa', 'Les vistes', 'El compte', 'Privacitat i dades', 'Els nodes', 'Multimèdia']);
  fireEvent.click(within(container).getByRole('button', { name: /Privacitat i dades/ }));
  expect(within(detall(container)).getByText('privacitat de Javi Llinares')).toBeTruthy();

  /* 261008 · «Les vistes» obri la seua pàgina, fora de l'editor. */
  fireEvent.click(within(container).getByRole('button', { name: /Les vistes/ }));
  expect(within(detall(container)).getByText('vistes de Javi Llinares')).toBeTruthy();

  /* T9 · «Els nodes» obri la seua pàgina de lectura: sense amfitrió, només Sóc de Poble. */
  fireEvent.click(within(container).getByRole('button', { name: /Els nodes/ }));
  const nodes = detall(container);
  expect(within(nodes).getByRole('heading', { level: 1, name: 'Els nodes' })).toBeTruthy();
  expect([...nodes.querySelectorAll('ul.sdp-llista-nodes > li strong')].map((s) => s.textContent)).toEqual(['Sóc de Poble']);
  expect(within(nodes).getByRole('link', { name: 'Com funcionen els nodes i el Fedivers' }).getAttribute('href')).toBe('/fedivers');
  expect(within(nodes).queryAllByRole('button')).toEqual([]);

  fireEvent.click(within(navegacio()).getByRole('button', { name: 'Forn' }));
  // Expectativa actualitzada a propòsit: relleu del Pla 2000, punt 3 («Multimèdia», l'últim apartat de l'organització).
  expect(apartats(container)).toEqual(['La fitxa', 'Les vistes', 'El compte', 'Multimèdia']);
  expect(within(detall(container)).getByText('fitxa de Forn')).toBeTruthy();

  fireEvent.click(within(navegacio()).getByRole('button', { name: 'Gestoria de Poble' }));
  expect(apartats(container)).toEqual(['Sobre esta utilitat']);
  const pagina = detall(container);
  expect(within(pagina).getByRole('heading', { level: 1, name: 'Gestoria de Poble' })).toBeTruthy();
  expect(within(pagina).getByText('Pendent de connectar en este node')).toBeTruthy();
  /* Ordre del Mestre (261007, prompt 261007_1628, peça C) · Sense preferència
     la utilitat ja és al Panell (la mateixa regla que ControlSection: només
     l'amaga un false explícit), i el botó ho diu. */
  expect(within(pagina).getAllByRole('button').map((b) => b.textContent)).toEqual(['Ocultar del Panell de Control']);
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
