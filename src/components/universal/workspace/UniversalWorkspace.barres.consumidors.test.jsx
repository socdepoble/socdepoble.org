/* Correcció dels verificadors (261004) · L'abast del rail de «mitja» als
   consumidors d'UniversalWorkspace que no són a la matriu del navegador
   (/wikidepoble, /notes i /disseny): Admin i Perfil. Totes dues rutes
   demanen sessió (RequireAuth) i, sense el node local, no es poden obrir al
   navegador; ací es munten les seccions DE VERITAT amb els detalls pesats
   simulats, com PerfilShell.espai.test.jsx i AdminSection.mestreDetall.test.jsx.
     · Admin (Usuaris, Entitats): navigationGroups buit i cap categoria. El
       rail no hi va (railEsquerra només amb una navegació declarada): la
       navegació de «mitja», amagada com abans, i el detall sense perdre els
       56 px.
     · Perfil: té navegació (PERFIL, GRUPS I EMPRESES, APLICACIONS) i rep el
       rail, com la Wiki. Canvi declarat: a 820 i a 764 (1024 amb la Roca
       de 260) el rail fix porta Expandir, la roda i una icona per persona,
       entitat i aplicació; el detall conserva la seua classe (isolation de
       PerfilShell.css) i el panell desplegat no hi arriba (260 contra 56 +
       la llista, que en fa 240 com a mínim).
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
  test(`Perfil a ${amplada} (mitja): la navegació PERFIL és el rail fix, oberta, i el detall conserva la seua classe`, () => {
    ambAmplada(amplada);
    const { container } = render(<PerfilShell />);
    expect([closca(container).dataset.layout, closca(container).dataset.esquerra]).toEqual(['mitja', 'rail']);
    expect(tancada(navegacio(container))).toEqual([false, null]);
    const nav = within(navegacio(container));
    expect(nav.getByRole('button', { name: 'Expandir PERFIL' }).getAttribute('aria-controls')).toBe('app-grid-sidebar');
    /* Una icona per persona, entitat i aplicació, totes a l'abast. */
    for (const nom of ['Javi Llinares', 'Forn', 'Gestoria de Poble']) {
      expect(nav.getByRole('button', { name: nom })).toBeTruthy();
    }
    expect(container.querySelector('#app-grid-main > .sdp-workspace-detail.perfil-espai__detall')).not.toBeNull();
    expect(container.querySelector('.app-grid-page.perfil-espai.sdp-workspace--universal')).not.toBeNull();
    /* Expandir obri el panell de sempre, i Replegar el torna al rail. */
    fireEvent.click(nav.getByRole('button', { name: 'Expandir PERFIL' }));
    expect(closca(container).dataset.panell).toBe('left');
    fireEvent.click(nav.getByRole('button', { name: 'Replegar PERFIL' }));
    expect(closca(container).dataset.panell).toBe('');
    expect(nav.getByRole('button', { name: 'Expandir PERFIL' })).toBeTruthy();
  });
}

test('Admin · Usuaris a 820 (mitja): cap rail (navegació buida), la navegació amagada com abans', async () => {
  const redimensiona = ambAmplada(1400);
  const { container } = render(<AdminSection />);
  /* El Tauler és una closca a mà (sense railEsquerra): en ample, el menú. */
  await act(async () => { fireEvent.click(within(navegacio(container)).getByRole('button', { name: 'Usuaris' })); });
  expect(container.querySelector('.app-grid-page.sdp-workspace--universal')).not.toBeNull();
  redimensiona(820);
  expect(closca(container).dataset.layout).toBe('mitja');
  expect(closca(container).hasAttribute('data-esquerra')).toBe(false);
  expect(tancada(navegacio(container))).toEqual([true, 'true']);
  expect(navegacio(container).querySelector('[aria-label="Expandir FILTRES"]')).toBeNull();
});
