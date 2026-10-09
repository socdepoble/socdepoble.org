/* Higiene d'amfitrió i Admin (ordre del Mestre, 261004, front
   «amfitrio-admin») · Les vistes Usuaris i Entitats del Tauler:
   (a) UniversalWorkspace crida renderDetail amb item null (cap element
       triat): el detall diu «Tria un element» i no peta;
   (b) sense la capacitat 'admin', cap crida al port i un estat buit honest
       (com els Indicadors); un port que llança de manera síncrona acaba en
       l'estat d'error, mai en una excepció fora del .catch;
   (c) regla del Mestre: tota pàgina, també les de sistema, porta la barra
       taronja amb l'autor. A Usuaris i a Entitats la pàgina és el detall
       (sdp-universal-page §5: la UniversalPage es construïx dins de la
       columna dreta, mai al voltant del Workspace): sense barra blava,
       signada per Sóc de Poble i enllaçada al seu perfil (Onada 8; abans,
       a /projecte). Els estats sense
       graella (sense la capacitat, l'error) porten la seua.
   La UniversalPage és la de veres. Dades sintètiques. */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({
  navigate: vi.fn(), toast: vi.fn(), usuaris: vi.fn(), entitats: vi.fn(), capacitats: ['admin']
}));
vi.mock('../../config/assetResolver', () => ({ resolveAsset: (uri) => uri }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => m.navigate, Link: 'a' }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: m.toast }) }));
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: (cap) => m.capacitats.includes(cap),
  adminListUsers: (...args) => m.usuaris(...args),
  adminListOrganizations: (...args) => m.entitats(...args)
}));
import AdminSection from './AdminSection.jsx';
/* Onada 8 (261009) · La boina de Sóc de Poble porta al seu perfil, ja no a /projecte. */
import { DEFAULT_AUTHOR } from '../../components/universal/UniversalUtils.js';

const SELECTOR_DE_LA_REGLA = '.sdp-universal-page-container--sense-blava > .content-wrapper > .app-grid-page';
const VISTES = [
  ['Usuaris', 'Detall de l\'Usuari', () => m.usuaris, 'Error de permisos o de xarxa en carregar usuaris.'],
  ['Entitats', 'Detall de l\'Entitat', () => m.entitats, 'Error de permisos o de xarxa en carregar entitats.']
];

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
  m.capacitats = ['admin'];
  m.usuaris.mockReset().mockResolvedValue([]);
  m.entitats.mockReset().mockResolvedValue([]);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

/* Del Tauler a una vista, esperant que la promesa del port s'assente. */
async function obri(nom) {
  const vista = render(<AdminSection />);
  await act(async () => {
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Menú d\'administració' })).getByRole('button', { name: nom }));
  });
  return vista;
}
const textDErrors = (espia) => espia.mock.calls.flat().map((x) => String(x?.message ?? x));

describe('(a) renderDetail amb item null', () => {
  test.each(VISTES)('%s sense cap element triat: «Tria un element», amb la capçalera, i cap error', async (nom, titol) => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = await obri(nom);
    const detall = container.querySelector('#app-grid-main');
    expect(within(detall).getByText('Tria un element')).toBeTruthy();
    expect(detall.querySelector('.app-grid-col-header__titol').textContent).toBe(titol);
    expect(textDErrors(errors).filter((t) => /reading 'data'/.test(t))).toEqual([]);
  });
});

describe('(b) sense la capacitat admin', () => {
  test.each(VISTES)('%s: cap crida al port, un estat buit honest i la tornada al Tauler', async (nom, _titol, port) => {
    m.capacitats = [];
    await obri(nom);
    expect(port()).not.toHaveBeenCalled();
    expect(screen.getByText('Este node no oferix les dades d’administració')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Tornar al Tauler' }));
    expect(screen.getByText('Benvingut a l\'administració de Sóc de Poble.')).toBeTruthy();
  });

  test.each(VISTES)('%s: un port que llança de manera síncrona acaba en l’estat d’error', async (nom, _titol, port, textError) => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    port().mockImplementation(() => { throw new Error('mètode absent'); });
    await obri(nom);
    expect(screen.getByRole('alert').textContent).toBe(textError);
    // L'excepció s'ha registrat al .catch, no ha pujat sense control.
    expect(textDErrors(errors)).toContain('mètode absent');
  });
});

/* La Pàgina Universal del detall: davall de la capçalera de la columna (la
   d'abans, amb la fletxa ← en estret), sense barra blava, amb la barra
   taronja de Sóc de Poble enllaçada al seu perfil (Onada 8; abans, a /projecte). */
function comprovaLaPaginaDelDetall(container, titol) {
  const detall = container.querySelector('#app-grid-main');
  const aside = detall.querySelector('aside.perfil-detall');
  expect(aside.firstElementChild.classList.contains('app-grid-col-header')).toBe(true);
  expect(aside.firstElementChild.querySelector('.app-grid-col-header__titol').textContent).toBe(titol);
  const pagina = aside.children[1];
  expect(pagina.classList.contains('sdp-universal-page-container')).toBe(true);
  expect(pagina.classList.contains('sdp-universal-page-container--sense-blava')).toBe(true);
  expect(container.querySelector('header.bar-blue')).toBeNull();
  const barra = pagina.querySelector(':scope > section.bar-orange');
  expect(barra.firstElementChild.getAttribute('href')).toBe(DEFAULT_AUTHOR.href);
  expect(barra.querySelector('.sp-card-author-name').textContent).toBe('Sóc de Poble');
  // Una sola Pàgina Universal: la del detall.
  expect(container.querySelectorAll('.sdp-universal-page-container')).toHaveLength(1);
  // Tota capçalera de pàgina (el logotip de qui signa, PageFrame) va dins del
  // detall, en el flux de la columna: cap queda davall de la graella absoluta.
  expect([...container.querySelectorAll('header.page-title')].filter((h) => !detall.contains(h))).toEqual([]);
  return detall;
}

/* (c) Derogat (sdp-universal-page §5 i norma de logotips, ordre del Mestre,
   261004): una Pàgina Universal al voltant del Workspace, amb els fills
   exactes ['bar-orange', 'content-wrapper'] i la graella baixada per la regla
   de modules.css. Contra §5, i el logotip que PageFrame hi posa entre la barra
   i el contingut quedava davall de la graella absoluta. */
describe('(c) la barra taronja a Usuaris i a Entitats, dins del detall', () => {
  test.each(VISTES)('%s: cap Pàgina Universal embolcalla el Workspace (sdp-universal-page §5)', async (nom) => {
    const { container } = await obri(nom);
    const graella = container.querySelector('.app-grid-page');
    expect(graella).not.toBeNull();
    expect(graella.closest('.sdp-universal-page-container')).toBeNull();
    expect(container.querySelector(SELECTOR_DE_LA_REGLA)).toBeNull();
  });

  test.each(VISTES)('%s sense cap element triat: el detall porta la barra taronja de Sóc de Poble, sense barra blava', async (nom, titol) => {
    const { container } = await obri(nom);
    const detall = comprovaLaPaginaDelDetall(container, titol);
    expect(within(detall).getByText('Tria un element')).toBeTruthy();
  });

  test.each([
    ['Usuaris', 'Detall de l\'Usuari', () => m.usuaris, { id: 'u1', email: 'pep@exemple.test', created_at: '2026-01-01', last_sign_in_at: '2026-10-01' }, 'pep@exemple.test'],
    ['Entitats', 'Detall de l\'Entitat', () => m.entitats, { id: 'e1', name: 'Forn del Raval', slug: 'forn', created_at: '2026-03-01', description: 'Pa i coca' }, 'Forn del Raval']
  ])('%s amb un element triat: el detall és la mateixa pàgina, amb el contingut d’abans', async (nom, titol, port, fila, nomFila) => {
    port().mockResolvedValue([fila]);
    const { container } = await obri(nom);
    const llista = container.querySelector('#app-grid-list');
    fireEvent.click(within(llista).getByRole('button', { name: (n) => n.startsWith(nomFila) }));
    const detall = comprovaLaPaginaDelDetall(container, titol);
    const pagina = detall.querySelector('.sdp-universal-page-container');
    expect(within(pagina).getByRole('heading', { level: 2 }).textContent).toBe(nomFila);
    expect(pagina.querySelector(':scope > .content-wrapper .perfil-detall-buit')).not.toBeNull();
  });

  test('sense la capacitat, l’estat buit també va davall de la barra taronja', async () => {
    m.capacitats = [];
    const { container } = await obri('Usuaris');
    const pagina = container.querySelector('.sdp-universal-page-container');
    expect(pagina.querySelector(':scope > section.bar-orange')).not.toBeNull();
    expect(within(pagina).getByText('Este node no oferix les dades d’administració')).toBeTruthy();
    expect(container.querySelector('.app-grid-page')).toBeNull();
  });

  test('l’error del port també va davall de la barra taronja', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    m.entitats.mockRejectedValue(new Error('42501'));
    const { container } = await obri('Entitats');
    const pagina = container.querySelector('.sdp-universal-page-container');
    expect(pagina.querySelector(':scope > section.bar-orange')).not.toBeNull();
    expect(within(pagina).getByRole('alert').textContent).toBe('Error de permisos o de xarxa en carregar entitats.');
  });
});
