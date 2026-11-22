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
 *  · v1.2.22 · Gauntlet R1 (L2-01, L3-05 i L2-02) · Un sol interruptor, el
 *    «Mode Bancal · Sol i Lletra Gran» (el rètol del xip): diu el mode
 *    (seniorMode), com el xip, i cap toc no esborra la tria «Segons el sistema».
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
import { CONSULTA_CONTRAST_SISTEMA, CONTRAST_KEY, SENIOR_KEY, reiniciaMemoriaSenior } from '../../../../config/theme.js';
import { delVal, getVal, setVal } from '../../../../config/storage.js';
import { TEXTOS_MODE_SENIOR } from '../../../../config/textosModeSenior.js';
import EspecimenPanell from './EspecimenPanell.jsx';

vi.mock('../../../../host.js', () => ({ quanLlest: async () => undefined, arrencaAuto: vi.fn(), exposaGlobal: vi.fn() }));
vi.mock('../../../../sections/notes/GlobalSaveManager.js', async (importOriginal) => ({
  ...await importOriginal(),
  getDraftsForScope: async () => ({})
}));

const FONT = readFileSync(resolve(process.cwd(), 'src/sections/disseny/cataleg/detalls/EspecimenPanell.jsx'), 'utf8');
/* El mot vetat (regla del Mestre, 261025), en singular o plural i amb accent o
   sense; no casa dins d'altres paraules («demasiado»). */
const MOT_VETAT = /\bmas[ií](?:a|es)\b/i;
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
  /* IDEA-323.4 · DOL-31 (v1.2.22) · El Mode Bancal també porta la clau de Sènior. */
  delVal(SENIOR_KEY);
  reiniciaMemoriaSenior();
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
  delVal(SENIOR_KEY);
  reiniciaMemoriaSenior();
});

const munta = (extra = {}) => render(<PedraSecaEmbed config={{ routerType: 'memory', manageDocumentHead: false, rutaInicial: RUTA, ...extra }} />);
/* v1.2.22 · Gauntlet R1 (L2-01) · L'interruptor porta el rètol del xip, «Mode Bancal · Sol i Lletra Gran»
   (abans, «Activar el Mode Bancal»): és el mateix mode a tot arreu. */
const MODE_BANCAL = TEXTOS_MODE_SENIOR.ca.xip;
const interruptor = (dins = document.body) => within(dins).findByRole('switch', { name: MODE_BANCAL }, ESPERA);
/* Els espècimens del Panell (fonaments-panell), sense la resta de la closca. */
const especimens = (dins) => [...dins.querySelectorAll('.sdp-especimen')];

describe('a la ruta del catàleg, dins de la closca real', () => {
  test('es munta: interruptor, botons d’ombra i la UniversalCard amb el contracte públic', async () => {
    sistema();
    const { container } = munta();
    const boto = await interruptor(container);
    expect(boto.getAttribute('aria-checked')).toBe('false');
    expect(boto.disabled).toBe(false);

    const targeta = within(container).getByRole('heading', { name: 'Mas del Roure' }).closest('article');
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
    /* IDEA-323.4 · DOL-31 (v1.2.22) · El Bancal és el Mode Bancal sencer: el desa la clau de Sènior. */
    expect(getVal(SENIOR_KEY)).toBe(true);
    expect(arrel.getAttribute('data-contrast')).toBe('bancal');
    expect(estatHtml()).toBe(abans);

    fireEvent.click(boto);
    await waitFor(() => expect(boto.getAttribute('aria-checked')).toBe('false'));
    /* v1.2.22 · Gauntlet R1 (L2-02) · Apagar és setSeniorMode(false), com el xip: apaga el mode i no escriu cap tria de
       contrast que la persona no haja fet (abans setContrast('normal') desava 'normal'). */
    expect(getVal(SENIOR_KEY)).toBe(false);
    expect(getVal(CONTRAST_KEY)).toBeNull();
    expect(arrel.hasAttribute('data-contrast')).toBe(false);
    expect(arrel.hasAttribute('data-sdp-senior')).toBe(false);
    expect(estatHtml()).toBe(abans);
  }, 30_000);

  /* v1.2.22 · Gauntlet R1 (L2-02) · Abans l'interruptor deia el contrast que es veia («Sí» amb el contrast del sistema,
     mentre el xip deia ○) i apagar-lo desava 'normal' damunt de «Segons el sistema». Ara diu el mode, com el xip; una
     nota diu d'on ve el contrast, i ni encendre ni apagar no toquen la tria desada. */
  test('«Segons el sistema» desat als Ajustos: l’interruptor diu el mode, com el xip, i cap toc no esborra la tria', async () => {
    sistema({ contrastMes: true });
    setVal(CONTRAST_KEY, 'sistema');
    const { container } = munta();
    const boto = await interruptor(container);
    const arrel = container.querySelector('.sdp-root');
    const panell = container.querySelector('#panell-bancal');
    expect(boto.getAttribute('aria-checked')).toBe('false');
    expect(arrel.getAttribute('data-contrast')).toBe('bancal');
    expect(arrel.hasAttribute('data-sdp-senior')).toBe(false);
    expect(panell.textContent).toContain('Ara el contrast Bancal el posa el dispositiu («Segons el sistema», triat als Ajustos)');

    fireEvent.click(boto);
    await waitFor(() => expect(boto.getAttribute('aria-checked')).toBe('true'));
    expect(getVal(SENIOR_KEY)).toBe(true);
    expect(getVal(CONTRAST_KEY)).toBe('sistema');
    expect(arrel.getAttribute('data-contrast')).toBe('bancal');
    expect(arrel.getAttribute('data-sdp-senior')).toBe('true');
    expect(panell.textContent).not.toContain('Ara el contrast Bancal el posa el dispositiu');

    fireEvent.click(boto);
    await waitFor(() => expect(boto.getAttribute('aria-checked')).toBe('false'));
    expect(getVal(SENIOR_KEY)).toBe(false);
    expect(getVal(CONTRAST_KEY)).toBe('sistema');
    expect(arrel.getAttribute('data-contrast')).toBe('bancal');
    expect(arrel.hasAttribute('data-sdp-senior')).toBe(false);
  }, 30_000);

  /* v1.2.22 · Gauntlet R1 (L2-01 i L3-05) · El segon interruptor, «Mode Sènior / Lectura Gran», llegia setModeSenior i
     modeSenior, que UIContext no exposa: dins de l'app deia «No» i estava desactivat amb la lletra gran encesa. */
  test('un sol interruptor del mode al Panell: diu «Sí» amb la lletra gran desada i no queda cap rastre del segon', async () => {
    sistema();
    setVal(SENIOR_KEY, true);
    const { container } = munta();
    const boto = await interruptor(container);
    const switches = especimens(container).flatMap((seccio) => within(seccio).queryAllByRole('switch'));
    expect(switches).toEqual([boto]);
    expect(boto.getAttribute('aria-checked')).toBe('true');
    expect(boto.disabled).toBe(false);
    expect(boto.textContent).toContain('Sí');
    expect(within(container).getByRole('heading', { level: 3, name: MODE_BANCAL })).toBeTruthy();
    expect(container.querySelector('#panell-mode-senior')).toBeNull();
    const text = especimens(container).map((seccio) => seccio.textContent).join(' ');
    expect(text).not.toMatch(/Mode Sènior|Lectura Gran\)|lectura gran a canviar|Fora de l’app/);
    expect(container.querySelector('.sdp-root').getAttribute('data-sdp-senior')).toBe('true');
    expect(container.querySelector('.sdp-root').getAttribute('data-contrast')).toBe('bancal');
  }, 30_000);

  test('l’ombra canvia només la caixa de la mostra, amb tokens; Restablir la torna; ni l’<html> ni l’arrel', async () => {
    sistema();
    const { container } = munta();
    await interruptor(container);
    const arrel = container.querySelector('.sdp-root');
    const mostra = within(container).getByRole('heading', { name: 'Mas del Roure' }).closest('.sdp-especimen__mostra');
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
    const boto = await dins.findByRole('switch', { name: MODE_BANCAL }, ESPERA);
    expect(estatHtml()).toBe(abans);

    fireEvent.click(boto);
    await waitFor(() => expect(boto.getAttribute('aria-checked')).toBe('true'));
    expect(element.getAttribute('data-contrast')).toBe('bancal');
    /* IDEA-323.4 · DOL-31 (v1.2.22) · El Bancal és el Mode Bancal sencer: el desa la clau de Sènior. */
    expect(getVal(SENIOR_KEY)).toBe(true);
    expect(estatHtml()).toBe(abans);

    fireEvent.click(dins.getByRole('button', { name: 'Ombra elevada' }));
    const mostra = dins.getByRole('heading', { name: 'Mas del Roure' }).closest('.sdp-especimen__mostra');
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
  const boto = screen.getByRole('switch', { name: MODE_BANCAL });
  expect(boto.disabled).toBe(true);
  /* v1.2.22 · Gauntlet R1 (L2-01) · Un sol interruptor, també fora de l'app. */
  expect(screen.getAllByRole('switch')).toHaveLength(1);
  expect(screen.getByText('Fora de l’app no hi ha cap preferència del Mode Bancal a canviar.')).toBeTruthy();
  expect(screen.getByRole('heading', { name: 'Mas del Roure' })).toBeTruthy();
  /* Regla del Mestre (261025): la plataforma és «el Mas», i el mot vetat no
     ix mai en text visible. Gauntlet 261030 (cicle 4) el va trobar ací. */
  expect(document.body.textContent).not.toMatch(MOT_VETAT);
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

  test('cap mot vetat: la targeta d’exemple és el «Mas del Roure»', () => {
    expect(FONT).not.toMatch(MOT_VETAT);
    expect(FONT).toContain('title="Mas del Roure"');
  });
});
