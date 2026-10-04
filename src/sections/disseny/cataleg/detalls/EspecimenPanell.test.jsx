/**
 * W4-13 (auditoria de Codex, 261004) · El Panell de Disseny es munta i els
 * seus controls funcionen sense tocar mai document.documentElement.
 *
 *  · /disseny?categoria=fonaments&item=fonaments-panell es pinta dins de la
 *    closca real (abans: «Element type is invalid», importació per defecte
 *    d'una UniversalCard que només s'exporta amb nom).
 *  · L'interruptor del Bancal és el mateix estat que el full «Ajustos» del Xat
 *    (UIContext.setContrast → theme.js): desa la tria i App.jsx posa
 *    l'atribut a l'arrel que pertoca. En un document alié, .sdp-root.
 *  · L'ombra de la targeta es canvia només a la caixa de la mostra, amb
 *    tokens (--sdp-ombra-1/2/3), mai a l'<html> ni a l'arrel de l'app.
 *  · Zero style=, cap color cru i el contracte públic de la UniversalCard.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import PedraSecaEmbed, { activeElements, defineCustomElement } from '../../../../PedraSecaEmbed.jsx';
import { MemoryRouter } from '../../../../app/contexts/RouterContext.jsx';
import { CONTRACTE_NUCLI } from '../../../../data/contracte.js';
import { getBackendImplementation, setBackendImplementation } from '../../../../data/backendPort.js';
import { CONSULTA_CONTRAST_SISTEMA, CONTRAST_KEY } from '../../../../config/theme.js';
import { delVal, getVal, setVal } from '../../../../config/storage.js';
import EspecimenPanell from './EspecimenPanell.jsx';

vi.mock('../../../../host.js', () => ({ quanLlest: async () => undefined, arrencaAuto: vi.fn(), exposaGlobal: vi.fn() }));
vi.mock('../../../../sections/notes/GlobalSaveManager.js', async (importOriginal) => ({
  ...await importOriginal(),
  getDraftsForScope: async () => ({})
}));

const FONT = readFileSync(resolve(process.cwd(), 'src/sections/disseny/cataleg/detalls/EspecimenPanell.jsx'), 'utf8');
const RUTA = '/disseny?categoria=fonaments&item=fonaments-panell';
const html = document.documentElement;
const ESPERA = { timeout: 15_000 };

function sistema({ contrastMes = false } = {}) {
  vi.stubGlobal('matchMedia', vi.fn((consulta) => ({
    matches: consulta === CONSULTA_CONTRAST_SISTEMA ? contrastMes : false,
    media: consulta,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {}
  })));
}

/* Tot el que porta l'<html>: atributs i estil en línia. */
const estatHtml = () => [...html.attributes].map((a) => `${a.name}=${a.value}`).sort().join(' | ');

let anterior = null;
let contrastAbans = null;
let temaHtmlAbans = null;
beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('Xarxa inesperada'); }));
  contrastAbans = getVal(CONTRAST_KEY);
  delVal(CONTRAST_KEY);
  temaHtmlAbans = html.getAttribute('data-theme');
  html.setAttribute('data-contrast', 'HOST-CONTRAST');
  html.style.setProperty('--sdp-shadow-card', 'HOST-OMBRA');
  anterior = { ...getBackendImplementation() };
  setBackendImplementation({
    ...Object.fromEntries(CONTRACTE_NUCLI.map((nom) => [nom, async () => null])),
    getCurrentUser: () => null,
    getRuntimeDataMode: () => 'local',
    getBackendConfigurat: () => true,
    getDefaultUserId: () => null,
    recullTornadaOAuth: async () => null,
    loadCoreContent: async () => ({ towns: [], pages: [], agents: [] }),
    loadMur: async () => ({ feedPosts: [], events: [], marketItems: [] }),
    loadNotes: async () => ({ notes: [], noteFolders: [] }),
    loadMultimedia: async () => ({ mediaItems: [], mediaTimelineGroups: [] }),
    loadFils: async () => []
  });
});
afterEach(() => {
  cleanup();
  document.body.replaceChildren();
  if (Object.keys(anterior).length) setBackendImplementation(anterior);
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  html.removeAttribute('data-contrast');
  html.removeAttribute('style');
  if (temaHtmlAbans == null) html.removeAttribute('data-theme');
  else html.setAttribute('data-theme', temaHtmlAbans);
  if (contrastAbans == null) delVal(CONTRAST_KEY);
  else setVal(CONTRAST_KEY, contrastAbans);
});

const munta = (extra = {}) => render(<PedraSecaEmbed config={{ routerType: 'memory', manageDocumentHead: false, rutaInicial: RUTA, ...extra }} />);
const interruptor = (dins = document.body) => within(dins).findByRole('switch', { name: 'Activar el Mode Bancal' }, ESPERA);

describe('a la ruta del catàleg, dins de la closca real', () => {
  test('es munta: interruptor, botons d’ombra i la UniversalCard amb el contracte públic', async () => {
    sistema();
    const { container } = munta();
    const boto = await interruptor(container);
    expect(boto.getAttribute('aria-checked')).toBe('false');
    expect(boto.disabled).toBe(false);

    const targeta = within(container).getByRole('heading', { name: 'Masia El Roure' }).closest('article');
    expect(targeta.classList.contains('sp-card')).toBe(true);
    expect(within(targeta).getByText('Provant l’arquitectura de Pedra Seca')).toBeTruthy();
    expect(targeta.querySelector('img.sp-card-media').getAttribute('src')).toMatch(/assets\/ui\/plugins\/disseny_vinyeta\.jpg$/);
    expect(within(targeta).getByText(/Observa l’ombra i el contrast/)).toBeTruthy();
    const grup = within(container).getByRole('group', { name: 'Ombra de la targeta de mostra' });
    expect(within(grup).getAllByRole('button').map((b) => [b.textContent, b.getAttribute('aria-pressed')])).toEqual([
      ['Ombra subtil', 'false'], ['Ombra mitjana', 'true'], ['Ombra elevada', 'false']
    ]);
  }, 30_000);

  test('l’interruptor és l’estat dels Ajustos: desa la tria i el Bancal va a .sdp-root; l’<html> no es toca', async () => {
    sistema();
    const { container } = munta();
    const boto = await interruptor(container);
    const arrel = container.querySelector('.sdp-root');
    const abans = estatHtml();
    expect(abans).toContain('data-contrast=HOST-CONTRAST');

    fireEvent.click(boto);
    await waitFor(() => expect(boto.getAttribute('aria-checked')).toBe('true'));
    expect(getVal(CONTRAST_KEY)).toBe('bancal');
    expect(arrel.getAttribute('data-contrast')).toBe('bancal');
    expect(estatHtml()).toBe(abans);

    fireEvent.click(boto);
    await waitFor(() => expect(boto.getAttribute('aria-checked')).toBe('false'));
    expect(getVal(CONTRAST_KEY)).toBe('normal');
    expect(arrel.hasAttribute('data-contrast')).toBe(false);
    expect(estatHtml()).toBe(abans);
  }, 30_000);

  test('«Segons el sistema» desat als Ajustos: l’interruptor diu el mode que es veu', async () => {
    sistema({ contrastMes: true });
    setVal(CONTRAST_KEY, 'sistema');
    const { container } = munta();
    const boto = await interruptor(container);
    expect(boto.getAttribute('aria-checked')).toBe('true');
    expect(container.querySelector('.sdp-root').getAttribute('data-contrast')).toBe('bancal');
    fireEvent.click(boto);
    await waitFor(() => expect(boto.getAttribute('aria-checked')).toBe('false'));
    expect(getVal(CONTRAST_KEY)).toBe('normal');
  }, 30_000);

  test('l’ombra canvia només la caixa de la mostra, amb tokens; Restablir la torna; ni l’<html> ni l’arrel', async () => {
    sistema();
    const { container } = munta();
    await interruptor(container);
    const arrel = container.querySelector('.sdp-root');
    const mostra = within(container).getByRole('heading', { name: 'Masia El Roure' }).closest('.sdp-especimen__mostra');
    expect(mostra).toBeTruthy();
    const abans = estatHtml();

    fireEvent.click(within(container).getByRole('button', { name: 'Ombra elevada' }));
    expect(mostra.style.getPropertyValue('--sdp-ombra-2')).toBe('var(--sdp-ombra-3)');
    expect(within(container).getByRole('button', { name: 'Ombra elevada' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(within(container).getByRole('button', { name: 'Ombra subtil' }));
    expect(mostra.style.getPropertyValue('--sdp-ombra-2')).toBe('var(--sdp-ombra-1)');

    fireEvent.click(within(container).getByRole('button', { name: 'Restablir l’ombra de sempre' }));
    expect(mostra.style.getPropertyValue('--sdp-ombra-2')).toBe('');
    expect(within(container).getByRole('button', { name: 'Ombra mitjana' }).getAttribute('aria-pressed')).toBe('true');

    expect(arrel.style.getPropertyValue('--sdp-ombra-2')).toBe('');
    expect(html.style.getPropertyValue('--sdp-ombra-2')).toBe('');
    expect(html.style.getPropertyValue('--sdp-shadow-card')).toBe('HOST-OMBRA');
    expect(estatHtml()).toBe(abans);
  }, 30_000);

  test('dues instàncies: el Panell de l’una canvia també l’altra, cadascuna a la seua arrel', async () => {
    sistema();
    const a = munta();
    const b = render(<PedraSecaEmbed config={{ routerType: 'memory', manageDocumentHead: false }} isFirstInstance={false} />);
    const boto = await interruptor(a.container);
    await waitFor(() => expect(b.container.querySelector('main')).toBeTruthy());
    const abans = estatHtml();

    await act(async () => { fireEvent.click(boto); });
    expect(a.container.querySelector('.sdp-root').getAttribute('data-contrast')).toBe('bancal');
    expect(b.container.querySelector('.sdp-root').getAttribute('data-contrast')).toBe('bancal');
    expect(estatHtml()).toBe(abans);
  }, 30_000);
});

/* Revisió adversarial de C1 · la reproducció original de Codex (W4-13,
   panell-0210) era dins de <soc-de-poble> amb Shadow DOM tancat: allà el clic
   escrivia data-contrast i --sdp-shadow-card a l'<html> alié i no es
   restauraven en desmuntar. Ara el Bancal va a l'amfitrió i l'<html> no canvia
   ni en muntar, ni en clicar, ni en desmuntar. */
describe('dins de <soc-de-poble> (Shadow DOM tancat), la reproducció de Codex', () => {
  beforeAll(() => { defineCustomElement(); });
  afterEach(async () => {
    await act(async () => {
      for (const element of [...activeElements]) {
        element.remove();
        element._desmuntaAra();
      }
    });
  });

  test('el Bancal va a l’amfitrió i l’ombra a la mostra; l’<html> conserva contrast i ombra de la pàgina', async () => {
    sistema();
    const abans = estatHtml();
    const element = document.createElement('soc-de-poble');
    element.setAttribute('plugin-url', '/');
    element.setAttribute('ruta-inicial', RUTA);
    await act(async () => { document.body.appendChild(element); });
    const dins = within(element._closedRoot);
    const boto = await dins.findByRole('switch', { name: 'Activar el Mode Bancal' }, ESPERA);
    expect(estatHtml()).toBe(abans);

    fireEvent.click(boto);
    await waitFor(() => expect(boto.getAttribute('aria-checked')).toBe('true'));
    expect(element.getAttribute('data-contrast')).toBe('bancal');
    expect(getVal(CONTRAST_KEY)).toBe('bancal');
    expect(estatHtml()).toBe(abans);

    fireEvent.click(dins.getByRole('button', { name: 'Ombra elevada' }));
    const mostra = dins.getByRole('heading', { name: 'Masia El Roure' }).closest('.sdp-especimen__mostra');
    expect(mostra.style.getPropertyValue('--sdp-ombra-2')).toBe('var(--sdp-ombra-3)');
    expect(element.style.getPropertyValue('--sdp-ombra-2')).toBe('');
    expect(estatHtml()).toBe(abans);

    fireEvent.click(boto);
    await waitFor(() => expect(boto.getAttribute('aria-checked')).toBe('false'));
    expect(element.hasAttribute('data-contrast')).toBe(false);

    await act(async () => { element.remove(); element._desmuntaAra(); });
    expect(estatHtml()).toBe(abans);
  }, 30_000);

  test('ama del document (socdepoble.org): el Bancal va a <html> i, en desmuntar, torna el valor de la pàgina', async () => {
    sistema();
    const { container, unmount } = munta({ manageDocumentHead: true });
    const boto = await interruptor(container);
    fireEvent.click(boto);
    await waitFor(() => expect(boto.getAttribute('aria-checked')).toBe('true'));
    expect(html.getAttribute('data-contrast')).toBe('bancal');
    expect(container.querySelector('.sdp-root').hasAttribute('data-contrast')).toBe(false);
    fireEvent.click(within(container).getByRole('button', { name: 'Ombra elevada' }));
    expect(html.style.getPropertyValue('--sdp-ombra-2')).toBe('');
    expect(html.style.getPropertyValue('--sdp-shadow-card')).toBe('HOST-OMBRA');
    unmount();
    expect(html.getAttribute('data-contrast')).toBe('HOST-CONTRAST');
  }, 30_000);
});

test('fora d’un UIProvider (el catàleg solt) es pinta i l’interruptor queda desactivat', () => {
  sistema();
  render(<MemoryRouter><EspecimenPanell /></MemoryRouter>);
  const boto = screen.getByRole('switch', { name: 'Activar el Mode Bancal' });
  expect(boto.disabled).toBe(true);
  expect(screen.getByRole('heading', { name: 'Masia El Roure' })).toBeTruthy();
});

describe('la font', () => {
  test('zero style=, cap color cru i cap escriptura al document', () => {
    expect(FONT).not.toMatch(/style=/);
    expect(FONT).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(FONT).not.toMatch(/rgba?\(/);
    expect(FONT).not.toMatch(/documentElement/);
    expect(FONT).not.toMatch(/setAttribute|removeAttribute/);
  });

  test('UniversalCard amb nom i el contracte públic (title, subtitle, imageUrl, body)', () => {
    expect(FONT).toMatch(/import \{ UniversalCard \} from '[^']*\/UniversalCard\.jsx'/);
    for (const prop of ['title=', 'subtitle=', 'imageUrl=', 'body=']) expect(FONT).toContain(prop);
    for (const prop of ['titol=', 'subtitol=', 'imatgePortada=', 'cos=']) expect(FONT).not.toContain(prop);
  });
});
