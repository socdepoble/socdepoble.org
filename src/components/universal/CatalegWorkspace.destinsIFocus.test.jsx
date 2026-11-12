/* R15b · Carril G3. PRODNM-02, USA-04, RV-05: els destins de navegació i de
   publicació només porten on hi ha app. SEG-R15b-05, PRODNM-06, USA-13: el
   selector de destins només per a qui pot publicar, i una fitxa privada no
   naix amb el Mur triat. USA-05: la vista persistix per superfície. USA-01,
   USA-03: la fitxa es porta a la vista i el focus va al títol (gest o enllaç
   profund), es queda a la llista amb les fletxes i hi torna en tancar. */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation } from '../../app/contexts/RouterContext';
import { delVal } from '../../config/storage.js';
import { CLAU_VISTA_CATALEG } from './workspace/vistaCataleg.js';
const ui = vi.hoisted(() => ({ language: 'ca' }));
const pub = vi.hoisted(() => ({ autoritzat: true }));
vi.mock('../../app/contexts/UIContext', async original => ({ ...await original(), useUIActionsOpcional: () => ui }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast() {} }) }));
vi.mock('./workspace/ProjeccionsCatalegContext.js', () => ({ useProjeccionsCatalegContext: () => ({ projeccions: [], error: null,
  ownerId: '1d2e3f40-5a6b-4c7d-8e9f-a0b1c2d3e4f5', persistent: true, autoritzat: pub.autoritzat, desa: async () => {} }) }));
import CatalegWorkspace from './CatalegWorkspace.jsx';

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1440);
  delVal(CLAU_VISTA_CATALEG);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); ui.language = 'ca'; pub.autoritzat = true; delVal(CLAU_VISTA_CATALEG); });

const model = { status: 'ready', canAutoSelect: () => false, categories: [{ id: 'a', label: 'Carpeta A' }],
  items: ['Romer', 'Timonet', 'Sàlvia'].map((title, index) => ({ id: `planta-${index + 1}`, title, categoryIds: ['a'], glyph: '🌿' })) };
function Path() { const { pathname, search } = useLocation(); return <output data-testid="path">{pathname + search}</output>; }
const detall = ({ item, onClose, onTriaItem }) => item
  ? <section className="sdp-cataleg-workspace__fitxa"><h3>{item.title}</h3>
    <button type="button" onClick={onClose}>Tancar</button>
    <button type="button" onClick={() => onTriaItem('planta-3')}>Germana Sàlvia</button></section>
  : <header className="page-title"><h1>Introducció canònica</h1></header>;
function mount({ ruta = '/page/herbari', rutaInicial = ruta, ...props } = {}) {
  return render(<MemoryRouter rutaInicial={rutaInicial}><CatalegWorkspace id="prova-cataleg" ruta={ruta} model={model}
    renderDetail={detall} {...props} /><Path /></MemoryRouter>);
}
/* El doble requestAnimationFrame del gestor de la fitxa. */
const marcs = () => act(() => new Promise(resolve => setTimeout(resolve, 80)));
const titolDeLaFitxa = container => container.querySelector('.sdp-cataleg-workspace__fitxa h3');
const overlay = (container, id) => container.querySelector(`#app-grid-list [data-element="${id}"]`);
const opcions = (etiqueta = 'Pàgina de destinació') => [...screen.getByLabelText(etiqueta).querySelectorAll('option')].map(o => [o.value, o.textContent]);

test('producció sense apps: cap destí al Rebost ni al Bar, ni el nom del negoci', () => {
  vi.stubEnv('DEV', false); vi.stubEnv('VITE_SDP_APP_NEVERA', '0'); vi.stubEnv('VITE_SDP_APP_BAR', '0');
  mount({ font: 'herbari', destiPublicacio: 'herbari', permetreEdicioDestins: true, rutaInicial: '/page/herbari?fitxa=planta-1' });
  expect(opcions()).toEqual([['/page/herbari', 'Herbari'], ['/page/banc-de-llavors', 'Banc de llavors'], ['/page/receptes', 'Receptes']]);
  expect(screen.queryByRole('checkbox', { name: 'Rebost privat' })).toBeNull();
  expect(screen.queryByRole('checkbox', { name: 'TPV Bar privat' })).toBeNull();
  expect(screen.getByRole('checkbox', { name: 'Mur' })).toBeTruthy();
  expect(document.body.textContent).not.toMatch(/Parr[òo]quia/);
});

test('amb les apps al build hi són, amb una etiqueta genèrica traduïda', () => {
  vi.stubEnv('DEV', true);
  mount();
  expect(opcions().map(([valor]) => valor)).toEqual(['/page/herbari', '/page/banc-de-llavors', '/page/receptes', '/app/nevera/rebost', '/app/bar/cataleg']);
  expect(opcions().at(-1)[1]).toBe('El Bar');
  expect(document.body.textContent).not.toMatch(/Parr[òo]quia/);
  cleanup(); ui.language = 'en'; mount();
  expect(opcions('Destination page').map(([, etiqueta]) => etiqueta)).toEqual(['Herbarium', 'Seed bank', 'Recipes', 'Pantry', 'The Bar']);
});

test('una pàgina que no és entre les opcions obri la que mostra el selector', () => {
  mount({ ruta: '/page/fediversity' });
  expect(screen.getByLabelText('Pàgina de destinació').value).toBe('/page/herbari');
  fireEvent.click(screen.getByRole('button', { name: 'Obri la pàgina' }));
  expect(screen.getByTestId('path').textContent).toBe('/page/herbari');
});

test('la lectura pública és la mateixa per a qui administra i per a qualsevol visitant: per defecte no es mostra On es publica?; amb permetreEdicioDestins=true ho veu qui publica', () => {
  pub.autoritzat = true;
  mount({ font: 'herbari', destiPublicacio: 'herbari', rutaInicial: '/page/herbari?fitxa=planta-1' });
  expect(screen.queryByRole('heading', { name: 'On es publica?' })).toBeNull();
  expect(screen.queryByRole('checkbox', { name: 'Mur' })).toBeNull();
  cleanup(); pub.autoritzat = false;
  mount({ font: 'herbari', destiPublicacio: 'herbari', permetreEdicioDestins: true, rutaInicial: '/page/herbari?fitxa=planta-1' });
  expect(screen.queryByRole('heading', { name: 'On es publica?' })).toBeNull();
  expect(screen.queryByRole('checkbox', { name: 'Mur' })).toBeNull();
  cleanup(); pub.autoritzat = true;
  mount({ font: 'herbari', destiPublicacio: 'herbari', permetreEdicioDestins: true, rutaInicial: '/page/herbari?fitxa=planta-1' });
  expect(screen.getByRole('checkbox', { name: 'Mur' }).checked).toBe(true);
});

test('una fitxa privada no naix amb cap destí públic triat', () => {
  vi.stubEnv('DEV', true);
  mount({ font: 'nevera', destiPublicacio: 'rebost', privateItems: true, permetreEdicioDestins: true, rutaInicial: '/page/herbari?fitxa=planta-1' });
  const caselles = screen.getAllByRole('checkbox').filter(casella => casella.closest('fieldset'));
  expect(caselles.length).toBeGreaterThan(0);
  expect(caselles.filter(casella => casella.checked)).toEqual([]);
});

test('la vista triada persistix per superfície després de tornar a muntar', () => {
  const primer = mount();
  fireEvent.click(screen.getByRole('button', { name: 'Quadrícula 2×2', exact: true }));
  primer.unmount();
  mount();
  expect(screen.getByRole('button', { name: 'Quadrícula 2×2', exact: true }).getAttribute('aria-pressed')).toBe('true');
  expect(screen.getByRole('button', { name: 'Canònica', exact: true }).getAttribute('aria-pressed')).toBe('false');
  cleanup();
  render(<MemoryRouter rutaInicial="/page/herbari"><CatalegWorkspace id="una-altra-superficie" ruta="/page/herbari" model={model} renderDetail={detall} /></MemoryRouter>);
  expect(screen.getByRole('button', { name: 'Canònica', exact: true }).getAttribute('aria-pressed')).toBe('true');
});

test('triar una fitxa hi porta el focus; Tancar el torna a l’element de la llista', async () => {
  const { container } = mount();
  fireEvent.click(overlay(container, 'planta-2'));
  await marcs();
  expect(titolDeLaFitxa(container).textContent).toBe('Timonet');
  expect(document.activeElement).toBe(titolDeLaFitxa(container));
  fireEvent.click(screen.getByRole('button', { name: 'Tancar' }));
  await marcs();
  expect(titolDeLaFitxa(container)).toBeNull();
  expect(document.activeElement).toBe(overlay(container, 'planta-2'));
});

test('una germana triada des de la fitxa porta el focus al títol nou, mai al body', async () => {
  const { container } = mount();
  fireEvent.click(overlay(container, 'planta-1'));
  await marcs();
  fireEvent.click(screen.getByRole('button', { name: 'Germana Sàlvia' }));
  await marcs();
  expect(titolDeLaFitxa(container).textContent).toBe('Sàlvia');
  expect(document.activeElement).toBe(titolDeLaFitxa(container));
  expect(overlay(container, 'planta-3').getAttribute('aria-current')).toBe('true');
});

test('les fletxes de la llista trien sense traure el focus de la llista', async () => {
  const { container } = mount();
  act(() => overlay(container, 'planta-1').focus());
  fireEvent.keyDown(overlay(container, 'planta-1'), { key: 'ArrowDown' });
  await marcs();
  expect(overlay(container, 'planta-2').getAttribute('aria-current')).toBe('true');
  expect(document.activeElement).toBe(overlay(container, 'planta-2'));
});

test('un enllaç profund ?fitxa= obri la fitxa amb el focus al títol', async () => {
  const { container } = mount({ rutaInicial: '/page/herbari?fitxa=planta-3' });
  await marcs();
  expect(overlay(container, 'planta-3').getAttribute('aria-current')).toBe('true');
  expect(titolDeLaFitxa(container).textContent).toBe('Sàlvia');
  expect(document.activeElement).toBe(titolDeLaFitxa(container));
});

/* C6-04 (R16b) · El panell substituïx el Dialeg i en conserva el focus: entra al títol en obrir-se,
   torna a la roda en tancar-se (mai a <body>) i Escape el tanca. */
const RODA = 'Configuració de l’espai de treball';
const roda = () => screen.getAllByRole('button', { name: RODA })[0];
const titolDelPanell = () => within(screen.getByTestId('workspace-settings-inline-panel')).getByRole('heading', { level: 2, name: RODA });

test('Llei Zero Finestres Flotants: la roda dentada obri la Configuració en la columna 3 amb botons Tornar i sense dialog', async () => {
  mount();
  fireEvent.click(roda());
  expect(screen.queryByRole('dialog')).toBeNull();
  const panell = screen.getByTestId('workspace-settings-inline-panel');
  expect(panell).toBeTruthy();
  expect(screen.getByTestId('workspace-settings-inline-top-back')).toBeTruthy();
  expect(screen.getByTestId('workspace-settings-inline-bottom-back')).toBeTruthy();
  await marcs();
  expect(document.activeElement).toBe(titolDelPanell());
  fireEvent.click(screen.getByTestId('workspace-settings-inline-bottom-back'));
  expect(screen.queryByTestId('workspace-settings-inline-panel')).toBeNull();
  await marcs();
  expect(document.activeElement).not.toBe(document.body);
  expect(document.activeElement).toBe(roda());
});

test('C6-04 · Escape dins del panell el tanca i el focus torna a la roda', async () => {
  mount();
  fireEvent.click(roda());
  await marcs();
  expect(document.activeElement).toBe(titolDelPanell());
  fireEvent.keyDown(document.activeElement, { key: 'Escape' });
  expect(screen.queryByTestId('workspace-settings-inline-panel')).toBeNull();
  await marcs();
  expect(document.activeElement).toBe(roda());
});

test('C6-04 · amagar la carpeta activa des del panell no el tanca: la tornada a «Tot» és del mateix panell', async () => {
  mount();
  fireEvent.click(screen.getByRole('button', { name: 'Carpeta A' }));
  fireEvent.click(roda());
  await marcs();
  fireEvent.click(within(screen.getByTestId('workspace-settings-inline-panel')).getByRole('switch', { name: 'Vull vore Carpeta A' }));
  await marcs();
  expect(screen.getByTestId('workspace-settings-inline-panel')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Carpeta A' })).toBeNull();
});

test('C6-04 · en estret la roda queda en una columna inert: en tancar, el focus va a l’arrel de la columna 3, no a <body>', async () => {
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(375);
  const { container } = mount();
  fireEvent.click(roda());
  await marcs();
  expect(document.activeElement).toBe(titolDelPanell());
  fireEvent.click(screen.getByTestId('workspace-settings-inline-top-back'));
  await marcs();
  expect(document.activeElement).not.toBe(document.body);
  expect(document.activeElement).toBe(container.querySelector('.sdp-workspace-detail'));
});

/* R16b (3a ronda) · Una tria explícita a la llista tanca el panell també sobre la fitxa que ja és
   activa: abans només el tancava un canvi de selecció i el clic no feia res. */
test('C6-04 · amb una fitxa activa i el panell obert, tornar a clicar la mateixa fitxa torna la columna 3 a la fitxa', async () => {
  const { container } = mount();
  fireEvent.click(overlay(container, 'planta-2'));
  await marcs();
  expect(titolDeLaFitxa(container).textContent).toBe('Timonet');
  fireEvent.click(roda());
  await marcs();
  expect(screen.getByTestId('workspace-settings-inline-panel')).toBeTruthy();
  expect(titolDeLaFitxa(container)).toBeNull();
  fireEvent.click(overlay(container, 'planta-2'));
  expect(screen.queryByTestId('workspace-settings-inline-panel')).toBeNull();
  await marcs();
  expect(titolDeLaFitxa(container).textContent).toBe('Timonet');
  expect(overlay(container, 'planta-2').getAttribute('aria-current')).toBe('true');
  expect(document.activeElement).toBe(titolDeLaFitxa(container));
});
