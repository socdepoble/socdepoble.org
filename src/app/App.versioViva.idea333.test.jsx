/* v1.2.23 · IDEA-333 (ordre del Mestre 261123) · D-MENU-NUMERO-VERSIO-VIU (captura
   01_produccio/261123_1325_captura_versions_menu_lateral_idea332_idea333.png). A la barra lateral
   esquerra (i al title del rail plegat, en les 5 llengües) l'entrada de /versions porta la versió viva
   llegida de VERSIO_SISTEMA (config/versio.js ← package.json): «Versions · v1.2.23».

   La versió es fa falsa ací (vi.mock de config/versio.js) perquè la prova demostre que el rètol llig la
   constant i no cap literal: quan l'integrador puge package.json, el menú canvia sol. La ruta i la
   pàgina continuen sent /versions. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '../../tests/helpers/diccionaris.js';
import PedraSecaEmbed, { activeElements } from '../PedraSecaEmbed.jsx';
import { CONTRACTE_NUCLI } from '../data/contracte.js';
import { getBackendImplementation, setBackendImplementation } from '../data/backendPort.js';
import { carregaDiccionari, createTranslator, SUPPORTED_LANGUAGES } from '../config/i18n.js';
import { SECTIONS, SEPARADOR_DE_VERSIO, rotolDeLaSeccio } from '../config/sections.js';
import { desaColumnaPlegada } from '../components/universal/workspace/columnesPlegades.js';

const VERSIO_DE_PROVA = '9.87.6';
vi.mock('../config/versio.js', async (importOriginal) => ({ ...await importOriginal(), VERSIO_SISTEMA: '9.87.6' }));
vi.mock('../host.js', () => ({ quanLlest: async () => undefined, arrencaAuto: vi.fn(), exposaGlobal: vi.fn() }));
vi.mock('../sections/notes/GlobalSaveManager.js', async (importOriginal) => ({
  ...await importOriginal(),
  getDraftsForScope: async () => ({})
}));

const LLENGUES = SUPPORTED_LANGUAGES.map((llengua) => llengua.code);
const VERSIONS = SECTIONS.find((seccio) => seccio.id === 'versions');
const rotolEsperat = (llengua) => `${createTranslator(llengua)('nav.versions')} · v${VERSIO_DE_PROVA}`;

const consulta = (media) => ({
  matches: false, media, onchange: null,
  addEventListener: () => {}, removeEventListener: () => {},
  addListener: () => {}, removeListener: () => {}, dispatchEvent: () => true
});

let anterior = null;
let amplada = 1280;
let descriptorRect = null;

beforeEach(() => {
  /* El plegat de la barra es desa (columnesPlegades.js): cada prova comença amb la barra desplegada. */
  desaColumnaPlegada('app-sidebar', 'left', false);
  vi.stubGlobal('matchMedia', vi.fn(consulta));
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('Xarxa inesperada'); }));
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
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function munta(ruta, { width, language }) {
  amplada = width;
  vi.stubGlobal('innerWidth', width);
  window.history.replaceState(null, '', ruta);
  render(<PedraSecaEmbed config={{ routerType: 'browser', manageDocumentHead: false, language }} />);
  await screen.findByRole('main');
  await act(async () => { await carregaDiccionari(language); });
}

/* «Sistema» està plegat fora de les seues rutes (l'enllaç hi és, però dins d'un grup hidden): es busca per href. */
const enllacDeVersions = (arrel) => arrel.querySelector('a.nav-item[href="/versions"]');

describe('IDEA-333 · el rètol (sections.js, rotolDeLaSeccio)', () => {
  test('només /versions porta versioViva, i la ruta continua sent /versions', () => {
    expect(VERSIONS).toMatchObject({ path: '/versions', pageKey: 'versions', versioViva: true });
    expect(SECTIONS.filter((seccio) => seccio.versioViva === true).map((seccio) => seccio.id)).toEqual(['versions']);
  });

  test('etiqueta traduïda + « · v» + versió; sense versió o sense versioViva, l’etiqueta sola', () => {
    expect(SEPARADOR_DE_VERSIO).toBe(' · v');
    expect(rotolDeLaSeccio(VERSIONS, 'Versions', '1.2.23')).toBe('Versions · v1.2.23');
    expect(rotolDeLaSeccio(VERSIONS, 'Bertsioak', ' 1.2.23 ')).toBe('Bertsioak · v1.2.23');
    for (const buida of [undefined, null, '', '   ', 1.2]) expect(rotolDeLaSeccio(VERSIONS, 'Versions', buida)).toBe('Versions');
    expect(rotolDeLaSeccio(SECTIONS.find((seccio) => seccio.id === 'legal'), 'Legal i privacitat', '1.2.23')).toBe('Legal i privacitat');
    expect(rotolDeLaSeccio(null, 'Mur', '1.2.23')).toBe('Mur');
  });

  test('sections.js no importa versio.js (node el carrega tal qual) i App.jsx passa la constant, mai un literal', () => {
    const seccions = readFileSync(resolve(process.cwd(), 'src/config/sections.js'), 'utf8');
    expect(seccions).not.toMatch(/from\s+['"][^'"]*versio(\.js)?['"]/);
    const app = readFileSync(resolve(process.cwd(), 'src/app/App.jsx'), 'utf8');
    expect(app).toContain("import { VERSIO_SISTEMA } from '../config/versio.js';");
    expect(app).toContain('const rotol = rotolDeLaSeccio(section, traduides.label, VERSIO_SISTEMA);');
    expect(app).not.toMatch(/rotolDeLaSeccio\([^)]*['"]\d+\.\d+\.\d+['"]/);
  });
});

describe('IDEA-333 · la barra lateral en les 5 llengües', () => {
  test.each(LLENGUES)('%s · pantalla gran (1280 px): el rètol i el nom porten la versió viva; plegada, també el title del rail', async (llengua) => {
    await munta('/mur', { width: 1280, language: llengua });
    const t = createTranslator(llengua);
    const barra = screen.getByRole('navigation', { name: t('nav.navegacioPrincipal') });
    const enllac = enllacDeVersions(barra);
    expect(enllac, llengua).toBeTruthy();
    expect(enllac.getAttribute('href')).toBe('/versions');
    expect(enllac.querySelector('.nav-item__text').textContent).toBe(rotolEsperat(llengua));
    expect(enllac.getAttribute('aria-label')).toBe(rotolEsperat(llengua));
    // Oberta, el rètol ja es veu: cap title.
    expect(enllac.hasAttribute('title')).toBe(false);

    fireEvent.click(within(barra).getByRole('button', { name: t('nav.plegaBarra') }));
    await waitFor(() => expect(barra.closest('.sdp-root').classList.contains('sidebar-closed')).toBe(true));
    const plegat = enllacDeVersions(barra);
    expect(plegat.getAttribute('title')).toBe(rotolEsperat(llengua));
    expect(plegat.getAttribute('aria-label')).toBe(rotolEsperat(llengua));
    // Cap altra entrada del rail canvia: ni title ni versió.
    const altres = [...barra.querySelectorAll('a.nav-item')].filter((a) => a !== plegat);
    expect(altres.length).toBeGreaterThan(5);
    for (const a of altres) {
      expect(a.hasAttribute('title'), a.getAttribute('href')).toBe(false);
      expect(a.textContent, a.getAttribute('href')).not.toContain(` · v${VERSIO_DE_PROVA}`);
    }
  }, 30000);

  test.each(LLENGUES)('%s · compacte (360 px): el calaix porta el mateix rètol, sense title', async (llengua) => {
    await munta('/mur', { width: 360, language: llengua });
    const t = createTranslator(llengua);
    fireEvent.click(within(document.querySelector('header.bar-black')).getByRole('button', { name: t('nav.obrirMenu') }));
    const calaix = document.querySelector('dialog.sdp-dialeg-sidebar');
    await waitFor(() => expect(calaix.open).toBe(true));
    const enllac = enllacDeVersions(calaix);
    expect(enllac.querySelector('.nav-item__text').textContent).toBe(rotolEsperat(llengua));
    expect(enllac.hasAttribute('title')).toBe(false);
  }, 30000);

  test('la ruta no canvia: l’entrada porta a /versions i s’hi encén', async () => {
    await munta('/mur', { width: 1280, language: 'ca' });
    const barra = screen.getByRole('navigation', { name: 'Navegació principal' });
    fireEvent.click(enllacDeVersions(barra));
    await waitFor(() => expect(window.location.pathname).toBe('/versions'));
    await waitFor(() => expect(enllacDeVersions(barra).getAttribute('aria-current')).toBe('page'));
    expect(within(barra).getByRole('link', { name: `Versions · v${VERSIO_DE_PROVA}` })).toBe(enllacDeVersions(barra));
  }, 30000);
});
