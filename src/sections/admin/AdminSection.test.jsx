/* AdminSection · el Tauler amb el bloc «Indicadors» (decisió del Mestre
   261003, «Graphfy»). Llei del Píxel: el benvingut i el menú d'abans es
   pinten igual i la columna del mig no porta res més; el bloc ocupa la
   columna del detall, que abans era buida. El benvingut de referència és el
   JSX d'abans del canvi, copiat tal qual: si algú el toca, esta prova ho
   diu. Dades sintètiques. */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import AppGridColumn from '../../components/layout/AppGridColumn';

/* Onada 11 (261010; prompt 261010_1730, tasca 2) · La sessió del context i el
   segon factor del port: per defecte, aal2 (el Tauler d'abans).
   Front D4 · També la personalització del port (les facetes de la taxonomia i
   de l'estil) i el contingut core que lligen. */
const m = vi.hoisted(() => ({
  usuaris: vi.fn(), entitats: vi.fn(), caps: ['admin'],
  llista: vi.fn(), inscriu: vi.fn(), repta: vi.fn(), verifica: vi.fn(), retira: vi.fn(),
  desa: vi.fn(), historial: vi.fn(), refresh: vi.fn(),
  sessio: { esSuperadmin: true, nivell: 'aal2', calSegonFactor: false },
  core: { status: 'ready', pageCopy: {}, personalitzacio: null, refresh: null }
}));
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: (cap) => m.caps.includes(cap),
  adminListUsers: (...args) => m.usuaris(...args),
  adminListOrganizations: (...args) => m.entitats(...args),
  llistaFactors: (...args) => m.llista(...args),
  inscriuFactor: (...args) => m.inscriu(...args),
  reptaFactor: (...args) => m.repta(...args),
  verificaFactor: (...args) => m.verifica(...args),
  retiraFactor: (...args) => m.retira(...args),
  adminDesaPersonalitzacio: (...args) => m.desa(...args),
  adminHistorialPersonalitzacio: (...args) => m.historial(...args)
}));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => m.sessio, useSessioOpcional: () => m.sessio }));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => m.core }));
/* El doble de la Pàgina Universal: el títol com a H1 i, si en rep, la fletxa
   de la barra blava crida l'onBack (com a AdminSection.mestreDetall.test.jsx). */
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ children, title, onBack }) => (
    <main>
      {onBack ? <button type="button" onClick={() => onBack()}>Tornar arrere</button> : null}
      {title ? <header className="page-title"><h1>{title}</h1></header> : null}
      {children}
    </main>
  )
}));
import AdminSection, { FACETES, FACETA_SEGON_FACTOR } from './AdminSection.jsx';
import { FACETA_TAXONOMIA } from './FacetaTaxonomia.jsx';
import { FACETA_ESTIL } from './FacetaEstil.jsx';

/* El JSX d'AdminDashboard abans dels Indicadors (commit b22b168b9). */
function BenvingutAbans() {
  return (
    <div className="sdp-buit">
      <AppGridColumn titol="Tauler" />
      <div className="sdp-buit__text">
        <p>Benvingut a l'administració de Sóc de Poble.</p>
        <div className="sdp-alerta sdp-alerta--info" role="status">
          <p>Nota: Aquesta àrea està restringida a Superadmins. Si no tens permisos a la base de dades, les crides fallaran amb 42501.</p>
        </div>
      </div>
    </div>
  );
}

const ampladaOriginal = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  }
  // jsdom no fa layout: sense amplada, AppGridShell cauria a «estret».
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 1400 });
});
afterAll(() => {
  if (ampladaOriginal) Object.defineProperty(HTMLElement.prototype, 'clientWidth', ampladaOriginal);
  vi.unstubAllGlobals();
});
beforeEach(() => {
  m.caps = ['admin'];
  m.sessio = { esSuperadmin: true, nivell: 'aal2', calSegonFactor: false };
  m.core = { status: 'ready', pageCopy: {}, personalitzacio: null, refresh: m.refresh };
  m.usuaris.mockReset().mockResolvedValue([]);
  m.entitats.mockReset().mockResolvedValue([]);
  m.llista.mockReset().mockResolvedValue([]);
  m.historial.mockReset().mockResolvedValue([]);
  for (const f of [m.inscriu, m.repta, m.verifica, m.retira, m.desa, m.refresh]) f.mockReset();
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

test('la columna del mig: només el benvingut d’abans, idèntic', () => {
  const { container } = render(<AdminSection />);
  const mig = container.querySelector('.app-grid-column--middle');
  expect(mig.children).toHaveLength(1);
  const referencia = render(<BenvingutAbans />).container.firstElementChild;
  expect(mig.firstElementChild.outerHTML).toBe(referencia.outerHTML);
});

test('la columna del detall: el bloc Indicadors, amb la seua capçalera, sense cridar el port', () => {
  const { container } = render(<AdminSection />);
  const detall = container.querySelector('.app-grid-column--right');
  expect(detall.children).toHaveLength(1);
  expect(detall.firstElementChild.className).toBe('sdp-marc-columna');
  expect(detall.querySelector('.sdp-marc-columna__cap .app-grid-col-header__titol').textContent).toBe('Indicadors');
  const indicadors = within(detall).getByRole('region', { name: 'Indicadors' });
  expect(within(indicadors).getByRole('button', { name: 'Calcula els indicadors' })).toBeTruthy();
  // Minimització: obrir el Tauler no baixa cap llista de persones.
  expect(m.usuaris).not.toHaveBeenCalled();
  expect(m.entitats).not.toHaveBeenCalled();
});

/* Onada 11 (261010; front D4) · El menú d'abans (Panell General, Usuaris,
   Entitats) i, darrere, les tres facetes noves, en este ordre exacte. */
const MENU = ['Panell General', 'Usuaris', 'Entitats', 'Etiquetes i categories', 'Estil del poble', 'Segon factor'];

test('el menú d’administració: les entrades d’abans i, darrere, les facetes de l’Onada 11', () => {
  render(<AdminSection />);
  const menu = screen.getByRole('navigation', { name: 'Menú d\'administració' });
  expect(within(menu).getAllByRole('button').map((b) => b.textContent)).toEqual(MENU);
  expect(within(menu).getByRole('button', { name: 'Panell General' }).className).toBe('univ-manager-facet-item univ-manager-facet-item--active');
  // Les facetes noves porten la mateixa classe que Usuaris i Entitats, i cap és activa.
  for (const nom of MENU.slice(3)) {
    expect(within(menu).getByRole('button', { name: nom }).className).toBe('univ-manager-facet-item ');
  }
});

test('Onada 11 · FACETES: les tres facetes del menú, congelades, amb id, títol i icona', () => {
  expect(Object.isFrozen(FACETES)).toBe(true);
  expect(FACETES).toEqual([FACETA_TAXONOMIA, FACETA_ESTIL, FACETA_SEGON_FACTOR]);
  expect(FACETA_SEGON_FACTOR).toMatchObject({ id: 'segon-factor', titol: 'Segon factor' });
  expect(typeof FACETA_SEGON_FACTOR.icona).toBe('object');
  expect(Object.isFrozen(FACETA_SEGON_FACTOR)).toBe(true);
  expect(new Set(FACETES.map((f) => f.id)).size).toBe(3);
});

/* ── Onada 11 (261010; prompt 261010_1730, tasca 2) · la porta del segon factor ── */

test('Onada 11 · amb aal2 cap crida al segon factor: el Tauler és el d’abans', () => {
  render(<AdminSection />);
  expect(m.llista).not.toHaveBeenCalled();
  expect(screen.queryByText('Cal el segon factor per a administrar')).toBeNull();
  expect(screen.queryByRole('region', { name: 'Segon factor' })).toBeNull();
});

test('Onada 11 · amb la sessió en aal1, la columna del mig pinta primer l’avís i el segon factor, i davall el benvingut d’abans', async () => {
  m.caps = ['admin', 'segonFactor'];
  m.sessio = { esSuperadmin: true, nivell: 'aal1', calSegonFactor: true };
  const { container } = render(<AdminSection />);
  const mig = container.querySelector('.app-grid-column--middle');
  expect(mig.children).toHaveLength(1);
  const porta = mig.querySelector('.sdp-admin-porta');
  expect(porta).not.toBeNull();
  const avis = within(porta).getByText('Cal el segon factor per a administrar').closest('[role="status"]');
  expect(avis.className).toBe('sdp-alerta sdp-alerta--avis');
  expect(porta.firstElementChild).toBe(avis);
  expect(within(porta).getByRole('region', { name: 'Segon factor' })).toBeTruthy();
  expect(await within(porta).findByRole('button', { name: 'Activa el segon factor' })).toBeTruthy();
  expect(m.llista).toHaveBeenCalledTimes(1);
  // L'avís va abans del benvingut, i el benvingut continua sent el d'abans.
  expect(porta.nextElementSibling.className).toBe('sdp-buit__text');
  const referencia = render(<BenvingutAbans />).container.querySelector('.sdp-buit__text');
  expect(porta.nextElementSibling.outerHTML).toBe(referencia.outerHTML);
  // La resta del Tauler no canvia: el menú (amb les facetes del front D4) i els Indicadors hi són.
  expect(within(screen.getByRole('navigation', { name: 'Menú d\'administració' })).getAllByRole('button')).toHaveLength(MENU.length);
  expect(container.querySelector('.app-grid-column--right .sdp-marc-columna')).not.toBeNull();
});

/* El 42501 d'una funció del Tauler quan la sessió és aal1 (private.es_superadmin
   exigix aal2): PostgREST el servix com a 403 i runtime.request l'embolcalla. */
const REBUIG_AAL = () => Object.assign(
  new Error('Supabase 403: {"code":"42501","details":null,"hint":null,"message":"SDP-ADMIN-001: cal rol de superadmin."}'),
  { status: 403 }
);
const VISTES = [
  ['Usuaris', () => m.usuaris, 'Error de permisos o de xarxa en carregar usuaris.'],
  ['Entitats', () => m.entitats, 'Error de permisos o de xarxa en carregar entitats.']
];
async function obri(nom) {
  const vista = render(<AdminSection />);
  await act(async () => {
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Menú d\'administració' })).getByRole('button', { name: nom }));
  });
  return vista;
}

test.each(VISTES)('Onada 11 · %s amb el 42501 «SDP-ADMIN»: «Cal confirmar el segon factor», no «permisos o xarxa», i la tornada al Tauler', async (nom, port) => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  m.sessio = { esSuperadmin: true, nivell: 'aal1', calSegonFactor: true };
  port().mockRejectedValue(REBUIG_AAL());
  await obri(nom);
  const alerta = screen.getByRole('alert');
  expect(alerta.textContent).toContain('Cal confirmar el segon factor');
  expect(alerta.textContent).not.toMatch(/permisos o de xarxa/);
  fireEvent.click(within(alerta).getByRole('button', { name: 'Tornar al Tauler' }));
  expect(screen.getByText('Benvingut a l\'administració de Sóc de Poble.')).toBeTruthy();
});

test.each(VISTES)('Onada 11 · %s amb un altre error (un 42501 sense «SDP-ADMIN»): el text de sempre, sense botó', async (nom, port, textError) => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  port().mockRejectedValue(Object.assign(new Error('permission denied'), { code: '42501' }));
  await obri(nom);
  const alerta = screen.getByRole('alert');
  expect(alerta.textContent).toBe(textError);
  expect(within(alerta).queryByRole('button')).toBeNull();
});

/* ── Onada 11 (261010; prompt 261010_1730, tasca 2; front D4) · les facetes del menú ── */

const benvingut = () => screen.queryByText('Benvingut a l\'administració de Sóc de Poble.');
const menuDelTauler = () => screen.queryByRole('navigation', { name: 'Menú d\'administració' });

test('Onada 11 · «Etiquetes i categories» obri la faceta de la taxonomia com a pàgina pròpia (títol, «Desar»), sense el Tauler darrere, i la fletxa blava hi torna', async () => {
  m.caps = ['admin', 'personalitzacio'];
  await obri('Etiquetes i categories');
  expect(screen.getByRole('heading', { level: 1, name: 'Etiquetes i categories' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Desar' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Historial' })).toBeTruthy();
  // Com Usuaris i Entitats: una vista pròpia, el Tauler no hi és darrere.
  expect(menuDelTauler()).toBeNull();
  expect(benvingut()).toBeNull();
  // Obrir-la no desa ni llig l'historial.
  expect(m.desa).not.toHaveBeenCalled();
  expect(m.historial).not.toHaveBeenCalled();
  // La fletxa de la barra blava (l'onBack que la faceta reenvia a la seua pàgina) torna al Tauler.
  fireEvent.click(screen.getByRole('button', { name: 'Tornar arrere' }));
  expect(benvingut()).toBeTruthy();
  expect(within(menuDelTauler()).getByRole('button', { name: 'Panell General' }).className).toContain('--active');
});

test('Onada 11 · «Estil del poble» pinta la faceta dins d’una pàgina del detall: capçalera amb el títol i la fletxa ← «Tornar al Tauler»', async () => {
  m.caps = ['admin', 'personalitzacio'];
  const { container } = await obri('Estil del poble');
  const aside = container.querySelector('aside.perfil-detall');
  expect(aside).not.toBeNull();
  expect(aside.firstElementChild.classList.contains('app-grid-col-header')).toBe(true);
  expect(aside.querySelector('.app-grid-col-header__titol').textContent).toBe('Estil del poble');
  expect(within(aside).getByRole('region', { name: 'Estil del poble' })).toBeTruthy();
  expect(within(aside).getByRole('button', { name: 'Desar' })).toBeTruthy();
  expect(menuDelTauler()).toBeNull();
  // La fletxa ← viu a la capçalera, davant del títol, i torna al Tauler.
  const fletxa = within(aside.firstElementChild).getByRole('button', { name: 'Tornar al Tauler' });
  expect(fletxa.className).toBe('app-grid-col-header__accio-icon');
  expect(aside.firstElementChild.firstElementChild).toBe(fletxa);
  fireEvent.click(fletxa);
  expect(benvingut()).toBeTruthy();
  expect(container.querySelector('aside.perfil-detall')).toBeNull();
});

test('Onada 11 · «Segon factor» pinta SegonFactor dins d’una pàgina del detall, també amb aal2 (per a gestionar-lo), i la fletxa ← torna al Tauler', async () => {
  m.caps = ['admin', 'segonFactor'];
  m.llista.mockResolvedValue([{ id: 'f1', nom: 'Autenticador del Mestre', tipus: 'totp', estat: 'verificat' }]);
  const { container } = await obri('Segon factor');
  const aside = container.querySelector('aside.perfil-detall');
  expect(aside.querySelector('.app-grid-col-header__titol').textContent).toBe('Segon factor');
  const regio = within(aside).getByRole('region', { name: 'Segon factor' });
  expect(await within(regio).findByText('Segon factor actiu')).toBeTruthy();
  expect(within(regio).getByRole('button', { name: 'Retira el segon factor' })).toBeTruthy();
  expect(m.llista).toHaveBeenCalledTimes(1);
  // Amb aal2, la porta de la columna del mig no hi és: la faceta és l'únic lloc del Tauler on es gestiona.
  expect(container.querySelector('.sdp-admin-porta')).toBeNull();
  fireEvent.click(within(aside.firstElementChild).getByRole('button', { name: 'Tornar al Tauler' }));
  expect(benvingut()).toBeTruthy();
  expect(screen.queryByRole('region', { name: 'Segon factor' })).toBeNull();
});

test('Onada 11 · sense la capacitat personalitzacio, les dues facetes ho diuen, tornen al Tauler i no criden el port', async () => {
  m.caps = ['admin'];
  await obri('Etiquetes i categories');
  expect(screen.getByText('Este node no admet personalització')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Tornar al Tauler' }));
  expect(benvingut()).toBeTruthy();
  fireEvent.click(within(menuDelTauler()).getByRole('button', { name: 'Estil del poble' }));
  expect(screen.getByText('Este node no oferix la personalització de l’estil')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Desar' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Tornar al Tauler' }));
  expect(benvingut()).toBeTruthy();
  expect(m.desa).not.toHaveBeenCalled();
  expect(m.historial).not.toHaveBeenCalled();
});

test('Onada 11 · el detall d’Usuaris no canvia: la capçalera sense fletxa pròpia en ample (Llei del Píxel)', async () => {
  m.usuaris.mockResolvedValue([{ id: 'u1', email: 'pep@exemple.test', created_at: '2026-01-01', last_sign_in_at: '2026-10-01' }]);
  const { container } = await obri('Usuaris');
  fireEvent.click(within(container.querySelector('#app-grid-list')).getByRole('button', { name: (n) => n.startsWith('pep@exemple.test') }));
  const capcalera = container.querySelector('#app-grid-main aside.perfil-detall .app-grid-col-header');
  expect(within(capcalera).queryByRole('button', { name: 'Tornar al Tauler' })).toBeNull();
  expect(capcalera.firstElementChild.className).toBe('app-grid-col-header__plec app-grid-col-header__plec--fix');
});
