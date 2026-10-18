/* Llei de la Roda Dentada (ordre del Mestre, 261007) · La roda dentada és el
   lloc estàndard de la personalització a tots els UniversalWorkspace (tret
   del Xat, que no en fa servir cap). Ací, amb les seccions DE VERITAT i els
   detalls pesats simulats (com UniversalWorkspace.barres.consumidors.test.jsx):
     · Perfil: la roda obri «Amplada de les columnes» i «Carpetes a la
       vista», amb un interruptor per persona, entitat i aplicació; la
       preferència és de l'espai 'perfil' (la clau del seu mestre-detall);
     · Admin (Usuaris): navegació buida, la roda obri l'amplada i la secció
       de carpetes no es pinta.
   Wiki, Disseny i Notes: UniversalWorkspace.ajustos.seccions.test.jsx i
   UniversalWorkspace.ajustos.notes.test.jsx. jsdom no fa layout: l'amplària
   és la de la closca. Dades sintètiques. */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { delVal, getVal, setVal } from '../../../config/storage.js';
import { CLAU_CARPETES_VISIBLES, _reiniciaCarpetesVisibles } from './carpetesVisibles.js';

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

/* Seccions de veres i el diàleg obert: amb la màquina carregada passaven
   dels 5 s per defecte. */
vi.setConfig({ testTimeout: 30000 });

const jo = { id: 'jo', mena: 'persona', nom: 'Javi Llinares', dades: {} };
const forn = { id: 'O', mena: 'empresa', nom: 'Forn', dades: { role: 'owner' } };
const USUARIS = [{ id: 'u1', email: 'pep@exemple.test', created_at: '2026-01-01', last_sign_in_at: '2026-10-01' }];

let restaura = () => {};
function ambAmplada(amplada) {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
  const observadorAbans = globalThis.ResizeObserver;
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => amplada });
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  restaura = () => {
    if (descriptor) Object.defineProperty(HTMLElement.prototype, 'clientWidth', descriptor);
    else delete HTMLElement.prototype.clientWidth;
    globalThis.ResizeObserver = observadorAbans;
  };
}

beforeEach(() => {
  sessionStorage.clear();
  delVal(CLAU_CARPETES_VISIBLES);
  _reiniciaCarpetesVisibles();
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
  delVal(CLAU_CARPETES_VISIBLES);
  _reiniciaCarpetesVisibles();
});

const RODA = 'Configuració de l’espai de treball';
const navegacio = (c) => c.querySelector('#app-grid-sidebar');
const obriRoda = (c) => {
  const roda = within(navegacio(c)).getByRole('button', { name: RODA });
  roda.focus();
  fireEvent.click(roda);
  return { roda, dialeg: within(screen.getByRole('dialog', { name: RODA })) };
};

test('Perfil · la roda obri l’amplada i les carpetes a la vista; amagar Forn la lleva de PERFIL i es desa a l’espai «perfil»', () => {
  ambAmplada(1400);
  const { container } = render(<PerfilShell />);
  expect(within(navegacio(container)).getByRole('button', { name: 'Forn' })).toBeTruthy();
  const { roda, dialeg } = obriRoda(container);
  expect(dialeg.getByRole('heading', { level: 3, name: 'Amplada de les columnes' })).toBeTruthy();
  expect(dialeg.getByRole('button', { name: 'Restablir l’amplada de les columnes' })).toBeTruthy();
  expect(dialeg.getByRole('heading', { level: 3, name: 'Carpetes a la vista' })).toBeTruthy();
  for (const nom of ['Javi Llinares', 'Forn', 'Gestoria de Poble']) {
    expect(dialeg.getByRole('switch', { name: `Vull vore ${nom}` }).getAttribute('aria-checked')).toBe('true');
  }
  fireEvent.click(dialeg.getByRole('switch', { name: 'Vull vore Forn' }));
  expect(within(navegacio(container)).queryByRole('button', { name: 'Forn' })).toBeNull();
  expect(within(navegacio(container)).getByRole('button', { name: 'Javi Llinares' })).toBeTruthy();
  expect(getVal(CLAU_CARPETES_VISIBLES, null)).toEqual({ v: 1, espais: { perfil: { O: false } } });
  fireEvent.click(dialeg.getByRole('button', { name: 'Fet' }));
  expect(document.activeElement).toBe(roda);
});

/* Correcció R1 del verificador · El Perfil entra a la persona (o a
   l'entitat de la ruta) sense cap selecció controlada: si la persona l'ha
   amagada, s'entra a «Tot». */
test('Perfil · amb la persona (la carpeta d’entrada) amagada, s’entra a «Tot» i cap carpeta amagada queda activa', () => {
  setVal(CLAU_CARPETES_VISIBLES, { v: 1, espais: { perfil: { jo: false } } });
  _reiniciaCarpetesVisibles();
  ambAmplada(1400);
  const { container } = render(<PerfilShell />);
  const nav = within(navegacio(container));
  expect(nav.queryByRole('button', { name: 'Javi Llinares' })).toBeNull();
  expect(nav.getByRole('button', { name: 'Forn' })).toBeTruthy();
  expect(nav.getByRole('button', { name: 'Tot' }).getAttribute('aria-pressed')).toBe('true');
  expect(nav.queryAllByRole('button').filter((boto) => boto.hasAttribute('aria-current'))).toEqual([]);
});

test('Admin · Usuaris: la roda hi és, obri l’amplada, i amb la navegació buida la secció de carpetes no es pinta', async () => {
  ambAmplada(1400);
  const { container } = render(<AdminSection />);
  await act(async () => { fireEvent.click(within(navegacio(container)).getByRole('button', { name: 'Usuaris' })); });
  expect(container.querySelector('.app-grid-page.sdp-workspace--universal')).not.toBeNull();
  const { dialeg } = obriRoda(container);
  expect(dialeg.getByRole('heading', { level: 3, name: 'Amplada de les columnes' })).toBeTruthy();
  expect(dialeg.queryByRole('heading', { name: 'Carpetes a la vista' })).toBeNull();
  expect(dialeg.queryAllByRole('switch')).toEqual([]);
});
