/**
 * App.iaiaEtiqueta.r32_28.test.jsx — Onada R32.28 · Lot 02 (E1 de Rosa 78 anys).
 *
 * Certifica en les 5 llengües oficials (ca, es, en, eu, gl) que:
 *   1. [Derogat per IDEA-326, vegeu davall] El botó de la IAIA MarIA a `header.bar-black` és una pastilla Pedra Seca
 *      (`.sdp-top-bar-btn--iaia`) amb rètol visible breu «IAIA» tant en escriptori
 *      com en mòbil (`360 px`), evitant qualsevol confusió amb el commutador «Lletra gran».
 *   2. El nom accessible (`aria-label="IAIA MarIA"`) conté el rètol visible «IAIA»
 *      (WCAG 2.5.3 Label in Name; clàusula derogada per IDEA-326, vegeu davall) i el `title` explicita el rol
 *      d'assistent digital en 5 llengües.
 *   3. `.right-icons` conserva exactament 4 fills per a un visitant sense sessió i navega a `/iaia`.
 *
 * v1.2.22 · IDEA-326 (ajust en calent del Mestre, 22-11-2026 20:51) · Derogats el punt 1 i, del punt 2, la clàusula del
 * rètol visible «IAIA» (WCAG 2.5.3 Label in Name): el botó de la IAIA ja no porta cap rètol visible (no competix amb la
 * marca Sóc de Poble), i sense rètol visible WCAG 2.5.3 no hi té cap text a contindre. Vigents: el nom accessible
 * «IAIA MarIA», el title traduït en cinc llengües (la resta del punt 2) i el punt 3. El botó és un cercle blau (el
 * ::before, border-radius 50 %) sobre la diana de 48 px (--sdp-touch, i --sdp-touch-min també val 48 px): 38 px amb inset
 * de 5 px i, per davall de 360 px, 36 px amb inset de 6 px. El fons blau és fix també amb la IA activa: el resplendor és
 * un halo de box-shadow amb keyframe propi (Gauntlet R2, M1-01). La icona és gran (28 px en escriptori, 26 px en mòbil).
 * S'actualitza a posta.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import '../../tests/helpers/diccionaris.js';
import PedraSecaEmbed, { activeElements } from '../PedraSecaEmbed.jsx';
import { CONTRACTE_NUCLI } from '../data/contracte.js';
import { getBackendImplementation, setBackendImplementation } from '../data/backendPort.js';
import { carregaDiccionari } from '../config/i18n.js';

vi.mock('../host.js', () => ({ quanLlest: async () => undefined, arrencaAuto: vi.fn(), exposaGlobal: vi.fn() }));
vi.mock('../sections/notes/GlobalSaveManager.js', async (importOriginal) => ({
  ...(await importOriginal()),
  getDraftsForScope: async () => ({}),
}));

const TITOLS_ESPERATS = {
  ca: 'IAIA MarIA · Assistent digital de Sóc de Poble',
  es: 'IAIA MarIA · Asistente digital de Sóc de Poble',
  en: 'IAIA MarIA · Sóc de Poble digital assistant',
  eu: 'IAIA MarIA · Sóc de Pobleren laguntzaile digitala',
  gl: 'IAIA MarIA · Asistente dixital de Sóc de Poble',
};

let anterior = null;
let amplada = 360;
let descriptorRect = null;

beforeEach(() => {
  amplada = 360;
  vi.stubGlobal('matchMedia', vi.fn((media) => ({
    matches: false,
    media,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => true,
  })));
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('Xarxa inesperada'); }));
  vi.stubGlobal('innerWidth', amplada);
  descriptorRect = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'getBoundingClientRect');
  Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
    configurable: true,
    value() {
      if (this.classList?.contains('sdp-root')) {
        return { width: amplada, height: 800, top: 0, left: 0, right: amplada, bottom: 800, x: 0, y: 0, toJSON() {} };
      }
      return { width: 48, height: 48, top: 0, left: 0, right: 48, bottom: 48, x: 0, y: 0, toJSON() {} };
    },
  });
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
    loadFils: async () => [],
  });
});

afterEach(async () => {
  cleanup();
  await act(async () => {
    for (const element of [...activeElements]) {
      element.remove();
      element._desmuntaAra();
    }
  });
  document.body.replaceChildren();
  if (descriptorRect) Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', descriptorRect);
  else delete HTMLElement.prototype.getBoundingClientRect;
  if (Object.keys(anterior).length) setBackendImplementation(anterior);
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function muntaApp(ruta, { width = 360, language = 'ca' } = {}) {
  amplada = width;
  vi.stubGlobal('innerWidth', width);
  window.history.replaceState(null, '', ruta);
  render(<PedraSecaEmbed config={{ routerType: 'browser', manageDocumentHead: false, language }} />);
  await screen.findByRole('main');
  await act(async () => { await carregaDiccionari(language); });
}

describe('Onada R32.28 · Lot 02 (E1 Rosa 78a) · IDEA-326 (v1.2.22) · La IAIA, un cercle blau sense rètol a header.bar-black', () => {
  test.each(Object.entries(TITOLS_ESPERATS))(
    'en %s a 360px no pinta cap rètol, conserva el nom accessible «IAIA MarIA» i el title traduït',
    async (llengua, titolEsperat) => {
      await muntaApp('/mur', { width: 360, language: llengua });
      const topBar = document.querySelector('header.bar-black');
      expect(topBar.querySelectorAll('.right-icons > *')).toHaveLength(4);

      const botoIaia = within(topBar).getByRole('button', { name: 'IAIA MarIA' });
      expect(botoIaia.classList.contains('sdp-top-bar-btn--iaia')).toBe(true);
      expect(botoIaia.classList.contains('icon')).toBe(false);
      expect(botoIaia.getAttribute('aria-label')).toBe('IAIA MarIA');
      expect(botoIaia.getAttribute('title')).toBe(titolEsperat);

      // IDEA-326 · Cap rètol ni cap text visible: només la icona (aria-hidden).
      expect(botoIaia.querySelector('.sdp-top-bar-btn__rotul')).toBeNull();
      expect(botoIaia.textContent.trim()).toBe('');
      expect(botoIaia.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');

      fireEvent.click(botoIaia);
      await waitFor(() => expect(window.location.pathname).toBe('/iaia'));
    }
  );

  /* v1.2.22 · IDEA-326 · El cercle blau i les icones grans, al CSS: jsdom no fa disposició, la geometria la mesura la sonda
     CDP (eines/cdp_v1222.mjs, escenaris «logo» i «iaiaActiva»). Ací es resolen els tokens de la diana contra el seu fitxer
     (no la cadena del token) i l'inset de cada amplària: diana − 2 × inset ha de donar 38 px a partir de 360 px i 36 px per
     davall (Gauntlet R2, M1-02 i M1-03). */
  test('IDEA-326 · utilities.css pinta el cercle blau de la IAIA (38 px, i 36 px per davall de 360 px, sobre la diana de 48 px) amb el fons fix i un halo quan la IA és activa, i layout.css les quatre icones grans', () => {
    const sense = (fitxer) => readFileSync(resolve(process.cwd(), fitxer), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const utilitiesCss = sense('src/css/utilities.css');
    const layoutCss = sense('src/css/layout.css');
    /* La regla pròpia del selector: la que comença just després d'una altra regla (cap selector compost davant). */
    const regla = (css, selector) => {
      for (let i = css.indexOf(`${selector} {`); i >= 0; i = css.indexOf(`${selector} {`, i + 1)) {
        if (/[}{]\s*$/.test(css.slice(0, i))) return css.slice(i, css.indexOf('}', i));
      }
      return '';
    };
    /* El cos d'un bloc amb claus niades (@container, @supports, @media o @keyframes), a partir del seu prelud. */
    const bloc = (css, prelud) => {
      const inici = css.indexOf(prelud);
      if (inici < 0) return '';
      const obri = css.indexOf('{', inici);
      let j = obri + 1;
      for (let nivell = 1; nivell > 0 && j < css.length; j += 1) nivell += css[j] === '{' ? 1 : css[j] === '}' ? -1 : 0;
      return css.slice(obri + 1, j - 1);
    };
    /* Els tokens de la diana, resolts contra el fitxer que els declara: --sdp-touch a tokens.css i --sdp-touch-min a
       design-tokens.css. Tots dos valen 48 px: per davall de 360 px la diana no minva (LLEI_04). */
    const token = (fitxer, nom) => Number(sense(fitxer).match(new RegExp(`${nom}:\\s*(\\d+(?:\\.\\d+)?)px;`))?.[1]);
    const touch = token('src/css/tokens.css', '--sdp-touch');
    const touchMin = token('src/css/design-tokens.css', '--sdp-touch-min');
    expect(touch).toBe(48);
    expect(touchMin).toBe(48);

    const boto = regla(utilitiesCss, '.sdp-top-bar-btn.sdp-top-bar-btn--iaia');
    expect(boto).toMatch(/width:\s*var\(--sdp-touch\);/);
    expect(boto).toMatch(/height:\s*var\(--sdp-touch\);/);
    expect(boto).toMatch(/padding:\s*0;/);
    expect(boto).toMatch(/margin-inline:\s*0;/);
    const cercle = regla(utilitiesCss, '.sdp-top-bar-btn.sdp-top-bar-btn--iaia::before');
    expect(cercle).toMatch(/border-radius:\s*50%;/);
    const insetAmple = Number(cercle.match(/inset:\s*(\d+)px;/)?.[1]);
    expect(touch - 2 * insetAmple).toBe(38);

    /* Per davall de 360 px (@container i la xarxa @supports not … @media): cap regla de mida per a la IAIA (la diana es
       queda a --sdp-touch), el cercle a 36 px i l'avatar de la sessió, el mateix cercle. */
    const estrets = [
      bloc(utilitiesCss, '@container sdp-arrel (max-width: 359px)'),
      bloc(bloc(utilitiesCss, '@supports not (container-type: inline-size)'), '@media (max-width: 359px)'),
    ];
    const insetsEstrets = estrets.map((cos) => {
      expect(cos).not.toBe('');
      expect(cos).not.toMatch(/\.sdp-top-bar-btn\.sdp-top-bar-btn--iaia\s*\{/);
      expect(cos).not.toMatch(/touch-min/);
      expect(cos).toMatch(/\.sdp-top-bar-avatar \.sdp-avatar \{ width: 36px; height: 36px; \}/);
      const inset = Number(cos.match(/\.sdp-top-bar-btn\.sdp-top-bar-btn--iaia::before \{ inset: (\d+)px; \}/)?.[1]);
      expect(touch - 2 * inset).toBe(36);
      return inset;
    });
    // Cap literal de 44 px: la diana no baixa mai de --sdp-touch.
    expect(utilitiesCss).not.toMatch(/\b44px\b/);

    // El fons de crom, al ::before comú, i fix: el resplendor de la IA activa té un keyframe propi que no toca el fons.
    expect(utilitiesCss).toMatch(/\.sdp-top-bar-btn:is\(\.sdp-top-bar-btn--instal, \.sdp-top-bar-btn--iaia\)::before \{[^}]*background: var\(--sdp-crom-control-fons\);/);
    expect(utilitiesCss).toContain('.sdp-top-bar-btn--iaia-activa::before { animation: sdp-iaia-resplendor-cercle 8s ease-in-out infinite; }');
    expect(utilitiesCss).not.toMatch(/animation:\s*sdp-iaia-resplendor\s/);
    const resplendor = bloc(utilitiesCss, '@keyframes sdp-iaia-resplendor-cercle {');
    expect(resplendor).not.toBe('');
    expect(resplendor).not.toMatch(/background/);
    expect(resplendor).toMatch(/0%\s*\{\s*box-shadow: 0 0 0 0 transparent;\s*\}/);
    expect(resplendor).toMatch(/50%\s*\{\s*box-shadow: 0 0 0 4px var\(--sdp-accent-vel\);\s*\}/);
    expect(resplendor).toMatch(/100%\s*\{\s*box-shadow: 0 0 0 0 transparent;\s*\}/);
    // L'halo de 4 px cap dins del marge entre el cercle i la vora de la diana (5 i 6 px).
    const halo = Number(resplendor.match(/box-shadow: 0 0 0 (\d+)px var/)?.[1]);
    expect(halo).toBe(4);
    expect(halo).toBeLessThanOrEqual(Math.min(insetAmple, ...insetsEstrets));
    // El keyframe de fons de layout.css es queda per a .sdp-realitat__iaia--activa (modules.css).
    expect(layoutCss).toContain('@keyframes sdp-iaia-resplendor {');
    // L'apagador global de moviment reduït (base.css, sense capa) també cobrix el ::before del cercle.
    expect(sense('src/css/base.css')).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s*\*,\s*\*::before,\s*\*::after \{\s*animation-duration: 0\.01ms !important;\s*animation-iteration-count: 1 !important;/);

    expect(regla(utilitiesCss, '.bar-black .right-icons .sdp-top-bar-btn--iaia svg')).toMatch(/width:\s*28px;/);
    expect(utilitiesCss).not.toMatch(/\.sdp-top-bar-btn--iaia\s+\.sdp-top-bar-btn__rotul/);
    expect(utilitiesCss).toContain(':where(.sdp-root.is-compact) .sdp-top-bar-btn.sdp-top-bar-btn--iaia');
    // En mòbil (≤ 480 px, @container i @media): les quatre icones a 26 px.
    expect(layoutCss.match(/header\.bar-black \.right-icons svg \{ width: 26px; height: 26px; stroke-width: 2\.2; \}/g)).toHaveLength(2);
    expect(layoutCss).not.toMatch(/header\.bar-black \.right-icons svg \{ width: 22px;/);
    /* La icona de la IAIA en mòbil, a utilities.css (@layer utilities guanya el @layer legacy de layout.css): 26 px, amb
       @container i la xarxa @media. */
    expect(utilitiesCss.match(/\.bar-black \.right-icons \.sdp-top-bar-btn--iaia svg \{ width: 26px; height: 26px; \}/g)).toHaveLength(2);
    // A layout.css només queda el resplendor de T30.2 (.sdp-top-bar-btn--iaia-activa), cap regla de mida que no guanyaria.
    expect(layoutCss).not.toMatch(/\.sdp-top-bar-btn--iaia(?!-activa)/);
    // En escriptori, la resta d'icones continuen a 30 px.
    expect(regla(layoutCss, '.bar-black .right-icons svg')).toMatch(/width:\s*30px;/);
  });
});
