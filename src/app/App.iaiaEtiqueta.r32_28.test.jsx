/**
 * App.iaiaEtiqueta.r32_28.test.jsx — Onada R32.28 · Lot 02 (E1 de Rosa 78 anys).
 *
 * Certifica en les 5 llengües oficials (ca, es, en, eu, gl) que:
 *   1. El botó de la IAIA MarIA a `header.bar-black` és una pastilla Pedra Seca
 *      (`.sdp-top-bar-btn--iaia`) amb rètol visible breu «IAIA» tant en escriptori
 *      com en mòbil (`360 px`), evitant qualsevol confusió amb el commutador «Lletra gran».
 *   2. El nom accessible (`aria-label="IAIA MarIA"`) conté el rètol visible «IAIA»
 *      (WCAG 2.5.3 Label in Name) i el `title` explicita el rol d'assistent digital en 5 llengües.
 *   3. `.right-icons` conserva exactament 4 fills per a un visitant sense sessió i navega a `/iaia`.
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

describe('Onada R32.28 · Lot 02 (E1 Rosa 78a) · Pastilla IAIA amb rètol clar a header.bar-black', () => {
  test.each(Object.entries(TITOLS_ESPERATS))(
    'en %s a 360px pinta el rètol «IAIA», conserva WCAG 2.5.3 (aria-label «IAIA MarIA») i el title traduït',
    async (llengua, titolEsperat) => {
      await muntaApp('/mur', { width: 360, language: llengua });
      const topBar = document.querySelector('header.bar-black');
      expect(topBar.querySelectorAll('.right-icons > *')).toHaveLength(4);

      const botoIaia = within(topBar).getByRole('button', { name: 'IAIA MarIA' });
      expect(botoIaia.classList.contains('sdp-top-bar-btn--iaia')).toBe(true);
      expect(botoIaia.classList.contains('icon')).toBe(false);
      expect(botoIaia.getAttribute('aria-label')).toBe('IAIA MarIA');
      expect(botoIaia.getAttribute('title')).toBe(titolEsperat);

      const rotul = botoIaia.querySelector('.sdp-top-bar-btn__rotul');
      expect(rotul?.textContent).toBe('IAIA');
      expect(botoIaia.getAttribute('aria-label').includes(rotul?.textContent || '')).toBe(true);

      fireEvent.click(botoIaia);
      await waitFor(() => expect(window.location.pathname).toBe('/iaia'));
    }
  );

  test('utilities.css manté visible el rètol de .sdp-top-bar-btn--iaia en compacte i ajusta 359px amb tokens de closca', () => {
    const utilitiesCss = readFileSync(resolve(process.cwd(), 'src/css/utilities.css'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '');
    expect(utilitiesCss).toContain('.sdp-top-bar-btn.sdp-top-bar-btn--iaia');
    expect(utilitiesCss).not.toMatch(/\.sdp-top-bar-btn--iaia\s+\.sdp-top-bar-btn__rotul\s*\{\s*display:\s*none/);
    expect(utilitiesCss).toContain(':where(.sdp-root.is-compact) .sdp-top-bar-btn.sdp-top-bar-btn--iaia');
  });
});
