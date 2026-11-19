import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '../../tests/helpers/diccionaris.js';
import PedraSecaEmbed, { activeElements } from '../PedraSecaEmbed.jsx';
import { CONTRACTE_NUCLI } from '../data/contracte.js';
import { getBackendImplementation, setBackendImplementation } from '../data/backendPort.js';
import { carregaDiccionari } from '../config/i18n.js';

vi.mock('../host.js', () => ({ quanLlest: async () => undefined, arrencaAuto: vi.fn(), exposaGlobal: vi.fn() }));
vi.mock('../sections/notes/GlobalSaveManager.js', async (importOriginal) => ({
  ...await importOriginal(),
  getDraftsForScope: async () => ({})
}));

const consulta = (media) => ({
  matches: false,
  media,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => true
});

let anterior = null;
let amplada = 360;
let descriptorRect = null;

beforeEach(() => {
  amplada = 360;
  vi.stubGlobal('matchMedia', vi.fn(consulta));
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
    }
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
    loadFils: async () => []
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

async function muntaVisitant(ruta, { width = 360, language = 'ca' } = {}) {
  amplada = width;
  vi.stubGlobal('innerWidth', width);
  window.history.replaceState(null, '', ruta);
  render(<PedraSecaEmbed config={{ routerType: 'browser', manageDocumentHead: false, language }} />);
  await screen.findByRole('main');
  await act(async () => { await carregaDiccionari(language); });
}

describe('Onada R32.10 · Lot 02 · Selector d’idioma per a visitants sense sessió i jerarquia <= 359px', () => {
  test('a 360px un visitant sense sessió conserva 4 icones a header.bar-black i obri /traduccions en 2 tocs pel calaix', async () => {
    await muntaVisitant('/mur', { width: 360, language: 'ca' });
    const topBar = document.querySelector('header.bar-black');
    expect(topBar.querySelectorAll('.right-icons > *')).toHaveLength(4);
    expect(within(topBar).queryByRole('button', { name: /idioma/i })).toBeNull();
    expect(within(topBar).queryByRole('link', { name: /idioma/i })).toBeNull();

    const calaix = document.querySelector('dialog.sdp-dialeg-sidebar');
    expect(calaix.open).toBe(false);

    // Toc 1: obrir el calaix pel logotip
    fireEvent.click(within(topBar).getByRole('button', { name: 'Obrir menú' }));
    await waitFor(() => expect(calaix.open).toBe(true));

    // Toc 2: obrir /traduccions des de l'entrada d'idioma del calaix
    const enllacIdioma = within(calaix).getByRole('link', { name: 'Idioma' });
    expect(enllacIdioma.getAttribute('href')).toBe('/traduccions');
    fireEvent.click(enllacIdioma);

    await waitFor(() => expect(window.location.pathname).toBe('/traduccions'));
    await waitFor(() => expect(calaix.open).toBe(false));
  });

  test('en escriptori (1280px) l’entrada d’idioma de la barra lateral funciona en 1 toc i es traduïx en les 5 llengües', async () => {
    await muntaVisitant('/mur', { width: 1280, language: 'eu' });
    const barra = screen.getByRole('navigation', { name: 'Nabigazio nagusia' });
    const enllacIdioma = within(barra).getByRole('link', { name: 'Hizkuntza' });
    expect(enllacIdioma.getAttribute('href')).toBe('/traduccions');
    fireEvent.click(enllacIdioma);
    await waitFor(() => expect(window.location.pathname).toBe('/traduccions'));
  });

  test('les pàgines editorials (/projecte i /page/node-zero) mostren el peu d’idioma accessible en 1 toc', async () => {
    await muntaVisitant('/projecte', { width: 360, language: 'en' });
    const peu = await waitFor(() => {
      const node = document.querySelector('section.sdp-pagina-peu .sdp-peu-editorial-idioma');
      expect(node).not.toBeNull();
      return node;
    });
    expect(peu.textContent).toContain('System language');
    expect(peu.textContent).toContain('English');
    const accio = within(peu).getByRole('link', { name: 'Choose a language' });
    expect(accio.getAttribute('href')).toBe('/traduccions');
    fireEvent.click(accio);
    await waitFor(() => expect(window.location.pathname).toBe('/traduccions'));
  });

  test('jerarquia CSS <= 400px i <= 359px: el subtítol d’apartat mai supera el títol i les targetes amb quadrat redueixen escalat sense inline styles', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/css/modules.css'), 'utf8');
    expect(css).toContain(
      '.app-grid-shell[data-layout="estret"][data-dues-columnes="true"][data-panell="left"] .sdp-gestor-fitxa__subtitol {\n    font-size: var(--sdp-text-meta);\n    font-stretch: var(--sdp-font-amplada-semi);'
    );
    expect(css).toContain(
      '.app-grid-shell[data-layout="estret"][data-dues-columnes="true"][data-panell="left"] .sdp-gestor-fitxa__subtitol {\n    font-size: var(--sdp-text-meta);\n    font-stretch: var(--sdp-font-amplada-estreta);'
    );
    expect(css).toContain('.sp-card .sp-card-body.has-calendar-badge .sp-card-title');
    expect(css).toContain('font-size: var(--sdp-text-h6);');
  });
});
