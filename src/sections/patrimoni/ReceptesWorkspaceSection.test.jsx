/* Onada R15b (RV-06) · /page/receptes munta ara el Workspace (ReceptesWorkspaceSection) i no ReceptesQueDinemSection:
   la regla de R15 P3-1 ha de valdre a les seues targetes. L'alt de la làmina diu la pàgina on és impresa (la 79 → p. 89,
   la 115 → p. 127), no la primera de la recepta, i ve de la clau patrimoni.receptes.altLamina en cada llengua. */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation } from '../../app/contexts/RouterContext';
import { RECEPTES_QUE_DINEM, laminaDeRecepta } from '../../data/patrimoni/queDinem.js';
import CA from '../../config/idiomes/ca.js';
import ES from '../../config/idiomes/es.js';
import EN from '../../config/idiomes/en.js';
import EU from '../../config/idiomes/eu.js';
import GL from '../../config/idiomes/gl.js';
import ReceptesWorkspaceSection from './ReceptesWorkspaceSection.jsx';
import { PaginaDeRecepta } from './ReceptaDetailSection.jsx';

const ui = vi.hoisted(() => {
  const estat = { language: 'ca', dic: null };
  estat.accions = () => ({ language: estat.language, t: (clau, reserva) => (estat.dic && Object.hasOwn(estat.dic, clau) ? estat.dic[clau] : reserva) });
  return estat;
});
vi.mock('../../app/contexts/UIContext', async (original) => ({ ...await original(), useUIActions: () => ui.accions(), useUIActionsOpcional: () => ui.accions() }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast() {} }) }));
vi.mock('../text/TextSection', () => ({ default: ({ children }) => <article>{children}</article> }));
vi.mock('../../hooks/useSEO.js', () => ({ useSEO() {} }));

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1440);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); ui.language = 'ca'; ui.dic = null; });

const munta = () => render(<MemoryRouter rutaInicial="/page/receptes"><ReceptesWorkspaceSection page={{}} /></MemoryRouter>);
const imatgeDe = (container, recepta) => [...container.querySelectorAll('#app-grid-list img')].find((img) => img.getAttribute('src')?.endsWith(recepta.lamina));

test.each([[79, 89], [115, 127]])('la targeta de la recepta %i porta la pàgina %i de la làmina al text alternatiu', (numero, pagina) => {
  const recepta = RECEPTES_QUE_DINEM[numero - 1];
  expect(recepta.pagina).not.toBe(pagina);
  expect(laminaDeRecepta(recepta).pagina).toBe(pagina);
  const { container } = munta();
  const img = imatgeDe(container, recepta);
  expect(img).toBeTruthy();
  expect(img.getAttribute('alt')).toBe(`Làmina de la pàgina ${pagina} del llibre`);
});

test.each([['ca', CA], ['es', ES], ['en', EN], ['eu', EU], ['gl', GL]])('%s: l’alt de la làmina ve del diccionari', (llengua, dic) => {
  ui.language = llengua; ui.dic = dic;
  const recepta = RECEPTES_QUE_DINEM[78];
  const { container } = munta();
  expect(dic['patrimoni.receptes.altLamina']).toContain('{n}');
  expect(imatgeDe(container, recepta).getAttribute('alt')).toBe(dic['patrimoni.receptes.altLamina'].split('{n}').join('89'));
});

/* PRODUCCIO-03 (revisió R15b) · «Totes les receptes», dins d'una recepta oberta, torna a la pàgina principal del
   receptari (sense recepta) en tots els casos: oberta amb un clic (la URL no canvia) o amb ?fitxa=, ample i estret. */
const marcs = () => act(() => new Promise((resolve) => setTimeout(resolve, 80)));
function Ubicacio() {
  const { pathname, search } = useLocation();
  return <output data-testid="ubicacio">{`${pathname}${search ? `?${search}` : ''}`}</output>;
}
test.each([
  ['un clic', 1440, false], ['un clic', 375, false], ['?fitxa=', 1440, true], ['?fitxa=', 375, true]
])('%s a %ipx: «Totes les receptes» tanca la recepta i torna al receptari', async (_, ample, enllacada) => {
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(ample);
  const recepta = RECEPTES_QUE_DINEM[0];
  const ruta = enllacada ? `/page/receptes?fitxa=${recepta.slug}` : '/page/receptes';
  const { container } = render(<MemoryRouter rutaInicial={ruta}><ReceptesWorkspaceSection page={{}}><p>Cos del receptari</p></ReceptesWorkspaceSection><Ubicacio /></MemoryRouter>);
  const titolDeLaRecepta = () => screen.queryByRole('heading', { level: 1, name: recepta.titol });
  if (!enllacada) {
    expect(titolDeLaRecepta()).toBeNull();
    fireEvent.click(container.querySelector(`#app-grid-list .sdp-gestor-fitxa[data-element="${recepta.slug}"]`));
    expect(screen.getByTestId('ubicacio').textContent).toBe('/page/receptes');
  }
  await marcs();
  expect(titolDeLaRecepta()).toBeTruthy();
  expect(screen.queryByText('Cos del receptari')).toBeNull();
  fireEvent.click(screen.getByRole('link', { name: 'Totes les receptes' }));
  await marcs();
  expect(titolDeLaRecepta()).toBeNull();
  expect(screen.queryByRole('link', { name: 'Totes les receptes' })).toBeNull();
  expect(screen.getByText('Cos del receptari')).toBeTruthy();
  expect(screen.getByTestId('ubicacio').textContent).toBe('/page/receptes');
  expect(document.activeElement).not.toBe(document.body);
});

test('fora del Workspace (/receptes/:slug), «Totes les receptes» continua sent l’enllaç al receptari', () => {
  const recepta = RECEPTES_QUE_DINEM[0];
  render(<MemoryRouter rutaInicial={`/receptes/${recepta.slug}`}><PaginaDeRecepta recepta={recepta} /><Ubicacio /></MemoryRouter>);
  const enllac = screen.getByRole('link', { name: 'Totes les receptes' });
  expect(enllac.getAttribute('href')).toBe('/page/receptes');
  fireEvent.click(enllac);
  expect(screen.getByTestId('ubicacio').textContent).toBe('/page/receptes');
});

test('cap targeta no diu la primera pàgina de la recepta quan la làmina és en una altra', () => {
  const { container } = munta();
  const ambLamina = RECEPTES_QUE_DINEM.filter((recepta) => laminaDeRecepta(recepta));
  expect(ambLamina).toHaveLength(148);
  for (const recepta of ambLamina) {
    const img = imatgeDe(container, recepta);
    expect([recepta.numero, img?.getAttribute('alt')]).toEqual([recepta.numero, `Làmina de la pàgina ${laminaDeRecepta(recepta).pagina} del llibre`]);
  }
});
