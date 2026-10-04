/* D3 (barra taronja universal, ordre del Mestre 261004) · El Tauler
   d'administració munta una AppGridShell dins d'una Pàgina Universal sense
   chrome (cau a 'page': sense barra blava). La barra taronja hi és, signada
   per Sóc de Poble i enllaçada a /projecte, i la graella absoluta ha de
   començar davall d'ella: la regla de modules.css
   (.sdp-universal-page-container--sense-blava > .content-wrapper >
   .app-grid-page, PageFrame.capes.test.js) casa amb el DOM de veres de
   l'Admin. jsdom no pinta: es prova que el selector troba la graella i que la
   barra és germana anterior del contingut, no dins de la graella. Ací la
   UniversalPage és la de veres (AdminSection.test.jsx la simula). */
import { cleanup, render } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({ navigate: vi.fn(), toast: vi.fn(), usuaris: vi.fn(), entitats: vi.fn() }));
vi.mock('../../config/assetResolver', () => ({ resolveAsset: (uri) => uri }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => m.navigate, Link: 'a' }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: m.toast }) }));
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: (cap) => cap === 'admin',
  adminListUsers: (...args) => m.usuaris(...args),
  adminListOrganizations: (...args) => m.entitats(...args)
}));
import AdminSection from './AdminSection.jsx';

const SELECTOR_DE_LA_REGLA = '.sdp-universal-page-container--sense-blava > .content-wrapper > .app-grid-page';

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
  m.usuaris.mockReset().mockResolvedValue([]);
  m.entitats.mockReset().mockResolvedValue([]);
});
afterEach(cleanup);

test('el Tauler porta la barra taronja de Sóc de Poble, enllaçada a /projecte, sense barra blava', () => {
  const { container } = render(<AdminSection />);
  const pagina = container.querySelector('.sdp-universal-page-container');
  expect(pagina.classList.contains('sdp-universal-page-container--sense-blava')).toBe(true);
  expect(container.querySelector('header.bar-blue')).toBeNull();
  const barra = pagina.querySelector(':scope > section.bar-orange');
  expect(barra).not.toBeNull();
  expect(barra.firstElementChild.getAttribute('href')).toBe('/projecte');
  expect(barra.querySelector('.sp-card-author-name').textContent).toBe('Sóc de Poble');
});

test('D3 · la regla que baixa la graella casa amb la graella de veres de l’Admin, i la barra en queda fora', () => {
  const { container } = render(<AdminSection />);
  const graella = container.querySelector('.app-grid-page');
  expect(graella).not.toBeNull();
  expect(container.querySelector(SELECTOR_DE_LA_REGLA)).toBe(graella);
  // La barra és germana anterior de l'article que conté la graella, no cap fill seu.
  const pagina = container.querySelector('.sdp-universal-page-container');
  expect([...pagina.children].map((e) => e.className)).toEqual(['bar-orange', 'content-wrapper']);
  expect(graella.querySelector('section.bar-orange')).toBeNull();
  // Les tres columnes, amb les seues capçaleres, viuen dins de la graella que baixa.
  for (const columna of ['left', 'middle', 'right']) {
    expect(graella.querySelector(`.app-grid-column--${columna}`), columna).not.toBeNull();
  }
});
