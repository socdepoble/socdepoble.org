/* Correcció dels verificadors (261004) · L'abast del rail de «mitja» als
   consumidors d'UniversalWorkspace que no són a la matriu del navegador
   (/wikidepoble, /notes i /disseny): Admin i Perfil. Totes dues rutes
   demanen sessió (RequireAuth) i, sense el node local, no es poden obrir al
   navegador; ací es munten les seccions DE VERITAT amb els detalls pesats
   simulats, com PerfilShell.espai.test.jsx i AdminSection.mestreDetall.test.jsx.
     · Admin (Usuaris, Entitats): navigationGroups buit i cap categoria. El
       rail no hi anava (el rail fix de «mitja» només amb una navegació declarada): la
       navegació de «mitja», amagada com abans, i el detall sense perdre els
       56 px.
     · Perfil: té navegació (PERFIL, GRUPS I EMPRESES, APLICACIONS) i rep el
       rail, com la Wiki. Canvi declarat: a 820 i a 764 (1024 amb la Roca
       de 260) el rail fix porta Expandir, la roda i una icona per persona,
       entitat i aplicació; el detall conserva la seua classe (isolation de
       PerfilShell.css) i el panell desplegat no hi arriba (260 contra 56 +
       la llista, que en fa 240 com a mínim).
   Ordre del Mestre (30-10-2026 ~12:45) · Columnes fixes: fora de mòbil el
   Workspace no passa per «mitja». A 820 i a 764, Perfil i Admin són «ample»:
   la navegació és la primera columna de la graella, desplegada, i plegar-la
   és el rail d'«ample», mai un panell amb vel.
   jsdom no fa layout: l'amplària és la de la closca. Dades sintètiques. */
import React from 'react';
import { act, cleanup, fireEvent, render, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({ perfil: null, usuaris: vi.fn() }));
vi.mock('../../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: (ref) => ({ url: ref, status: ref ? 'ready' : 'idle', error: null, isLoading: false, retry: () => {}, cancel: () => {} })
}));
vi.mock('../../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorId: null, refresh: vi.fn() }) }));
vi.mock('../../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => ({ agents: [] }) }));
/* Gauntlet 261016 (Bloc 3.4) · PerfilShell també llig useSessioOpcional (qui és superadmin). */
vi.mock('../../../app/contexts/SessionContext.jsx', () => ({
  useSession: () => ({ currentUser: null, estat: 'fora' }),
  useSessioOpcional: () => null,
}));
vi.mock('../../../app/contexts/RouterContext', () => ({
  useRouter: () => ({ navigate: vi.fn(), location: { pathname: '/' } }),
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams()],
  /* Encàrrec 261018_1220 · PerfilShell llig l'estat de l'historial (espaiIdentitat). */
  useLocation: () => ({ pathname: '/', search: '', state: null, hash: '' }),
  Link: ({ to, children }) => <a href={to}>{children}</a>
}));
vi.mock('../../../app/contexts/UIContext', () => ({ useUI: () => ({ externalConfig: {} }) }));
vi.mock('../ContentProvider', () => ({ useContent: () => null }));
vi.mock('../NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../../data/backendPort.js', () => ({
  teCapacitat: (cap) => cap === 'admin',
  adminListUsers: (...args) => m.usuaris(...args),
  adminListOrganizations: vi.fn(async () => [])
}));
vi.mock('../../../sections/profile/PerfilContext.jsx', () => ({ PerfilProvider: ({ children }) => children, usePerfil: () => m.perfil }));
vi.mock('../../../sections/profile/PerfilEditor.jsx', () => ({ PerfilEditor: ({ identitat }) => <p>{`fitxa de ${identitat.nom}`}</p> }));
vi.mock('../../../sections/profile/DetallCompte.jsx', () => ({ DetallCompte: ({ identitat }) => <p>{`compte de ${identitat.nom}`}</p> }));
vi.mock('../../../sections/profile/DetallPrivacitat.jsx', () => ({ DetallPrivacitat: ({ identitat }) => <p>{`privacitat de ${identitat.nom}`}</p> }));
vi.mock('../../../sections/profile/DialegNovaOrganitzacio.jsx', () => ({ DialegNovaOrganitzacio: () => null }));
vi.mock('../UniversalPage', () => ({
  UniversalPage: ({ children }) => <main>{children}</main>
}));

import PerfilShell from '../../../sections/profile/PerfilShell.jsx';
import AdminSection from '../../../sections/admin/AdminSection.jsx';

const jo = { id: 'jo', mena: 'persona', nom: 'Javi Llinares', dades: {} };
const forn = { id: 'O', mena: 'empresa', nom: 'Forn', dades: { role: 'owner' } };
const USUARIS = [{ id: 'u1', email: 'pep@exemple.test', created_at: '2026-01-01', last_sign_in_at: '2026-10-01' }];

let restaura = () => {};
let avisos = new Set();
function ambAmplada(inicial) {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
  const observadorAbans = globalThis.ResizeObserver;
  let amplada = inicial;
  avisos = new Set();
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => amplada });
  globalThis.ResizeObserver = class {
    constructor(cb) { this.cb = cb; }
    observe() { avisos.add(this.cb); }
    unobserve() {}
    disconnect() { avisos.delete(this.cb); }
  };
  restaura = () => {
    if (descriptor) Object.defineProperty(HTMLElement.prototype, 'clientWidth', descriptor);
    else delete HTMLElement.prototype.clientWidth;
    globalThis.ResizeObserver = observadorAbans;
  };
  return (nova) => {
    amplada = nova;
    act(() => { [...avisos].forEach((cb) => cb([{ contentRect: { width: nova } }])); });
  };
}

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  m.perfil = {
    identitats: [jo, forn], carregant: false, error: null,
    guardarAjust: vi.fn(), pujaMitja: vi.fn(), recarrega: vi.fn(), creaOrganitzacio: vi.fn()
  };
  m.usuaris.mockReset().mockResolvedValue(USUARIS);
});
afterEach(() => {
  cleanup();
  restaura();
  restaura = () => {};
});

const closca = (c) => c.querySelector('.app-grid-shell');
const navegacio = (c) => c.querySelector('#app-grid-sidebar');
const tancada = (el) => [el.hasAttribute('inert'), el.getAttribute('aria-hidden')];

for (const amplada of [820, 764]) {
  test(`Perfil a ${amplada} (columnes fixes): la navegació PERFIL és la primera columna de la graella i el detall conserva la seua classe`, () => {
    ambAmplada(amplada);
    const { container } = render(<PerfilShell />);
    expect([closca(container).dataset.layout, closca(container).dataset.panell]).toEqual(['ample', '']);
    expect(tancada(navegacio(container))).toEqual([false, null]);
    const nav = within(navegacio(container));
    /* Persona, entitat i aplicació, totes a l'abast a l'arbre desplegat. */
    for (const nom of ['Javi Llinares', 'Forn', 'Gestoria de Poble']) {
      expect(nav.getAllByRole('button', { name: new RegExp(nom) }).length).toBeGreaterThan(0);
    }
    expect(container.querySelector('#app-grid-main > .sdp-workspace-detail.perfil-espai__detall')).not.toBeNull();
    expect(container.querySelector('.app-grid-page.perfil-espai.sdp-workspace--universal')).not.toBeNull();
    expect(container.querySelector('.app-grid-resizer--left')).not.toBeNull();
    expect(container.querySelector('.app-grid-resizer--middle')).not.toBeNull();
    /* Replegar el porta al rail d'«ample» i Expandir el torna a la graella:
       cap panell. */
    fireEvent.click(nav.getByRole('button', { name: 'Replegar PERFIL' }));
    expect(closca(container).dataset.panell).toBe('');
    expect(container.querySelector('.has-left-collapsed')).not.toBeNull();
    for (const nom of ['Javi Llinares', 'Forn', 'Gestoria de Poble']) {
      expect(nav.getByRole('button', { name: nom })).toBeTruthy();
    }
    fireEvent.click(nav.getByRole('button', { name: 'Expandir PERFIL' }));
    expect(closca(container).dataset.panell).toBe('');
    expect(container.querySelector('.has-left-collapsed')).toBeNull();
    expect(nav.getByRole('button', { name: 'Replegar PERFIL' })).toBeTruthy();
  });
}

test('Admin · Usuaris a 820 (columnes fixes): «ample», la navegació FILTRES és la columna de la graella, oberta, com a 1400', async () => {
  const redimensiona = ambAmplada(1400);
  const { container } = render(<AdminSection />);
  /* El Tauler és una closca a mà (sense columnesFixes): en ample, el menú. */
  await act(async () => { fireEvent.click(within(navegacio(container)).getByRole('button', { name: 'Usuaris' })); });
  expect(container.querySelector('.app-grid-page.sdp-workspace--universal')).not.toBeNull();
  redimensiona(820);
  expect([closca(container).dataset.layout, closca(container).dataset.panell]).toEqual(['ample', '']);
  expect(tancada(navegacio(container))).toEqual([false, null]);
  expect(navegacio(container).querySelector('[aria-label="Expandir FILTRES"]')).toBeNull();
});
