/* v1.2.26 · Lot C1-3, paquet D2 · IDEA-366 (Llibre Mestre, 22:23) al Banc de llavors:
   · C26-2 #14 · una fitxa d'una font de tercers porta la llicència de la presentació de la seua font, mai
     COPYRIGHT_SDP («CC BY-NC-SA 4.0 Sóc de Poble / Fet per la IAIA i Nano Banana»);
   · C26-2 #7 · la columna de Catàlegs nomena les oliveres amb el seu títol curt, «Generalitat Valenciana · Oliveres»;
   · C26-2 #6 · /page/banc-de-llavors/<llibre> obri la Pàgina de Presentació del llibre (una sola URL per llibre). */
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation } from '../../app/contexts/RouterContext';
import { COPYRIGHT_SDP } from '../../components/universal/editorial.js';
import { FONTS_BANC_LLAVORS, entradesDelCataleg } from '../../data/patrimoni/bancLlavors.js';
import { presentacioDeLaFont } from '../../data/patrimoni/catalegsMultipoble.js';
import BancLlavorsWorkspaceSection from './BancLlavorsWorkspaceSection.jsx';

const ui = vi.hoisted(() => ({ language: 'ca', t: (_key, fallback) => fallback }));
vi.mock('../../app/contexts/UIContext', async original => ({ ...await original(), useUIActions: () => ui, useUIActionsOpcional: () => ui, useUIStateOpcional: () => ({ language: 'ca' }) }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast() {} }) }));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ children, title, copyright }) => <article data-pagina={title} data-copyright={copyright}>{children}</article>
}));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1440);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

const marcs = () => act(() => new Promise(resolve => setTimeout(resolve, 80)));
const munta = (slug) => render(
  <MemoryRouter rutaInicial={`/page/banc-de-llavors/${slug}`}><BancLlavorsWorkspaceSection page={{}} itemSlug={slug} /></MemoryRouter>
);

test.each(FONTS_BANC_LLAVORS.map((font) => [font.id, font]))('C26-2 #14 · %s · la fitxa porta la llicència de la presentació de la seua font', async (_id, font) => {
  const [entrada] = entradesDelCataleg(font.id);
  const { container } = munta(entrada.id);
  await marcs();
  const pagina = container.querySelector(`article[data-pagina="${entrada.nom}"]`);
  expect(pagina).not.toBeNull();
  expect(pagina.getAttribute('data-copyright')).toBe(presentacioDeLaFont(font).llicencia);
  expect(pagina.getAttribute('data-copyright')).not.toBe(COPYRIGHT_SDP);
});

test('C26-2 #7 · la columna de Catàlegs: «Generalitat Valenciana · Oliveres», no l’autoria llarga', async () => {
  const { container } = munta('oliveres-gva-ivia');
  await marcs();
  const columna = container.querySelector('#app-grid-sidebar');
  expect(columna).not.toBeNull();
  expect(columna.textContent).toContain('Generalitat Valenciana · Oliveres');
  expect(columna.textContent).not.toContain('Generalitat Valenciana · IVIA (Iniguez, Paz i Illa-Gómez, 2001)');
});

test('C26-2 #6 · /page/banc-de-llavors/avl-mallorca obri la presentació del llibre', async () => {
  const { container } = munta('avl-mallorca');
  await marcs();
  const font = FONTS_BANC_LLAVORS.find((f) => f.id === 'avl-mallorca');
  expect(container.querySelector(`article[data-pagina="${font.titol}"]`)).not.toBeNull();
});

/* C26-2 #6 · ?cataleg=&fitxa= només és una entrada de compatibilitat: CatalegWorkspace hi redirigix (replace) al camí
   únic, sense cap paràmetre orfe. */
function Ubicacio() {
  const ubicacio = useLocation();
  return <output data-ubicacio={`${ubicacio.pathname}${ubicacio.search}`} />;
}
test.each([
  ['?cataleg=avl-mallorca', '/page/banc-de-llavors/avl-mallorca'],
  [`?cataleg=avl-mallorca&fitxa=${entradesDelCataleg('avl-mallorca')[0].id}`, `/page/banc-de-llavors/${entradesDelCataleg('avl-mallorca')[0].id}`]
])('C26-2 #6 · %s redirigix al camí %s', async (consulta, cami) => {
  const { container } = render(
    <MemoryRouter rutaInicial={`/page/banc-de-llavors${consulta}`}><BancLlavorsWorkspaceSection page={{}} sincronitzaRuta /><Ubicacio /></MemoryRouter>
  );
  await marcs();
  expect(container.querySelector('output[data-ubicacio]').getAttribute('data-ubicacio')).toBe(cami);
});
