import React from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

/* Gauntlet 261030 (cicle 4, ALT-C1 de Codex; C4-CONSOLA-WIKI-TRADUIR) · La
   Consola també viu dins de la Wiki: la fitxa /wikidepoble?item=consola_termodinamica
   munta ConsolaIncrustada (el tauler amb el govern, la sala de màquines i El Mas
   en xifres), que llig consola.json, el Mapa i el govern d'este ordinador. Cap
   d'eixes dades pot eixir cap a un motor de traducció (el servei del mateix
   origen, Apertium o MyMemory), com a /consola (ConsolaSection.traduccio.test.jsx).
   Ruta real: el router de veres, la Wiki amb el seu workspace, la UniversalPage
   i el PageFrame de veres, el tros de la Consola carregat a demanda, el Traductor
   Sobirà disponible pels dos transports i el clic de la persona: Traduir i, si
   hi haguera menú, una llengua. Només es falsegen les fonts (sense xarxa), el
   manifest de la Wiki (un document públic, la sonda), els avisos, el SEO i el
   llenç del graf.
   La sonda: un document públic de la Wiki, amb el mateix arnés, SÍ que es
   traduïx. Si l'arnés deixara de vore les peticions, la sonda cauria. */
const mocks = vi.hoisted(() => ({ toast: null, ui: null }));
vi.mock('../../app/contexts/UIContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useUIState: () => mocks.ui,
  useUIStateOpcional: () => mocks.ui,
  useUIActions: () => ({ t: (_clau, perDefecte) => perDefecte }),
  useUIActionsOpcional: () => null
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
vi.mock('../../hooks/useSEO.js', () => ({ useSEO: () => {} }));
vi.mock('../../components/universal/graph/BrainGraph', () => ({ default: () => null }));
vi.mock('../../data/wikiManifest.js', () => ({
  wikiManifest: {
    categories: [{ id: 'folder:02_saber', parentId: null, label: 'SABER' }],
    items: [{
      id: 'document_public', title: 'Document públic', subtitle: 'Un text de la Wiki',
      categoryId: 'folder:02_saber', tags: [], attributes: {},
      content: '# Document públic\n\nEste paràgraf és públic i es pot traduir.'
    }]
  }
}));
vi.mock('../consola/mapa/useMapa.js', () => ({
  useMapa: () => ({ estat: 'ready', mapa: MAPA, error: null, carrega: () => {} })
}));
vi.mock('../consola/consolaContent.js', async (importOriginal) => ({
  ...(await importOriginal()),
  carregaConsola: () => Promise.resolve({
    generat: '2026-09-25T13:00:00.000Z', rebuts: [], consums: [{ agent: 'claude', entrada: 1, eixida: 1 }], credits: null,
    skills: [{ nom: 'sdp-workflow', estat: 'canonic', descripcio: 'x', core: true, alDisc: true, alManifest: true }],
    segell: null, immunitari: { operacions: 0 }
  })
}));
vi.mock('../consola/govern/governContent.js', async (importOriginal) => ({
  ...(await importOriginal()),
  carregaGovern: () => Promise.resolve(null)
}));
import { RouterProvider, Route, Routes } from '../../app/contexts/RouterContext';
import WikiDePobleSection from './WikiDePobleSection.jsx';
import { AVIS_PAGINA_SENSE_TRADUCCIO } from '../../components/universal/PageFrame.jsx';
import { NOM_MENU_TRADUIR } from '../../components/universal/traduccio/MenuTraduir.jsx';
import { buidaCauTraduccions } from '../../components/PedraSeca/hooks/useTraduccioPagina.js';
import { APERTIUM_BETA, APERTIUM_RESERVA, MYMEMORY, buidaSessioLliure, fixaTraductorLliure } from '../../data/traductorLliure.js';
import { PAGE_COPY } from '../text/pageContent';

const MAPA = vi.hoisted(() => ({
  schema: 'sdp.mapa.v1', generat: '2026-09-25T13:12:23.715Z', tall: null,
  nodes: [
    { id: 'agent:claude-code', tipus: 'agent', font: 'CLAUDE.md', atributs: { arnes: 'Claude Code' } },
    { id: 'skill:sdp-workflow', tipus: 'skill', font: null, atributs: {} }
  ],
  arestes: [],
  tasques: [{ id: 'plaquetes', estat: 'viu', llancador: { tipus: 'launchd', etiqueta: 'x' }, cadencia: { cada_segons: 3600 }, script: null, font: null }],
  avisos: [],
  salut: []
}));

const URL_SERVEI = '/wp-json/socdepoble/v1/traduir';
/* Els dos transports del Traductor Sobirà (IDEA-31): el servei del mateix
   origen (en desenvolupament, /__iaia/traduir), i el lliure del navegador
   (Apertium; el basc i l'alemany, MyMemory). */
const TRANSPORTS = Object.freeze([
  { nom: 'el servei del lloc', llengua: 'Castellà', prepara: () => { mocks.ui = { locale: 'ca-ES', externalConfig: { traductorUrl: URL_SERVEI } }; } },
  { nom: 'el transport lliure (MyMemory)', llengua: 'Basc', prepara: () => { fixaTraductorLliure('apertium'); } }
]);

const esDeTraduccio = (url) => {
  const adreca = String(url);
  return adreca.includes(URL_SERVEI) || [APERTIUM_BETA, APERTIUM_RESERVA, MYMEMORY].some((motor) => adreca.startsWith(motor));
};
const respostaJson = (status, cos) => ({ ok: status >= 200 && status < 300, status, json: async () => cos });
/* Un motor que respon de veres: si la fitxa deixara traduir, la traducció
   arribaria i es pintaria (la forma de ConsolaSection.traduccio.test.jsx). */
const fetchFals = () => vi.fn(async (url, opcions = {}) => {
  if (!esDeTraduccio(url)) return respostaJson(404, null);
  if (String(url).startsWith(`${MYMEMORY}?`)) {
    const consulta = new URL(url).searchParams;
    const traduccio = `${consulta.get('langpair').split('|')[1]}:${consulta.get('q')}`;
    return respostaJson(200, {
      responseData: { translatedText: traduccio, match: 0.85 }, quotaFinished: false, responseDetails: '', responseStatus: 200,
      matches: [{ id: 0, segment: consulta.get('q'), translation: traduccio, 'created-by': 'MT!', match: 0.85 }]
    });
  }
  if (opcions.body instanceof URLSearchParams) {
    const q = opcions.body.get('q');
    return respostaJson(200, { responseData: { translatedText: `${opcions.body.get('langpair').split('|')[1]}:${q}` }, responseDetails: null, responseStatus: 200 });
  }
  const { textos, desti } = JSON.parse(opcions.body);
  return respostaJson(200, { traduccions: textos.map((text) => `[srv] ${text}`), origen: 'CA', desti, cache: false });
});

let fetch;
beforeEach(() => {
  mocks.toast = vi.fn();
  mocks.ui = { locale: 'ca-ES', externalConfig: {} };
  buidaCauTraduccions();
  buidaSessioLliure();
  fetch = fetchFals();
  vi.stubGlobal('fetch', fetch);
  // El workspace de la Wiki, amb amplada d'escriptori (WikiDePobleSection.navegacio.test.jsx).
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  fixaTraductorLliure(null);
  localStorage.clear();
});

async function obri(item) {
  window.history.replaceState(null, '', `/wikidepoble?item=${item}`);
  const { container } = render(
    <RouterProvider>
      <Routes>
        <Route path="/wikidepoble" element={<WikiDePobleSection />} />
      </Routes>
    </RouterProvider>
  );
  await act(async () => {});
  return container;
}
/* La fitxa de la Consola, amb el tauler pintat i les dades d'este ordinador a la vista. */
async function obriLaConsola() {
  const container = await obri('consola_termodinamica');
  // El primer tros de la Consola es transforma i s'importa ací: més d'un segon la primera vegada.
  await waitFor(() => expect(container.querySelector('.sdp-consola__graella')).not.toBeNull(), { timeout: 10000 });
  await waitFor(() => expect(document.body.textContent).not.toMatch(/Llegint|Carregant la Consola/));
  expect(container.querySelector('header.page-title h1').textContent).toBe(PAGE_COPY.consola.title);
  // Una dada de consola.json d'este ordinador, al cos de la pàgina: la que no ha d'eixir.
  expect(container.querySelector('article.content-wrapper').textContent).toContain('sdp-workflow');
  return container;
}
/* El clic de la persona: Traduir a la barra blava i, si s'obrira el menú, la llengua. */
async function provaDeTraduir(container, llengua) {
  const boto = container.querySelector('header.bar-blue button[aria-label="Traduir"]');
  expect(boto).not.toBeNull();
  await act(async () => { fireEvent.click(boto); });
  const menu = screen.queryByRole('menu', { name: NOM_MENU_TRADUIR });
  if (menu) {
    await act(async () => { fireEvent.click(within(menu).getByRole('menuitemradio', { name: llengua })); });
  }
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
  return { menu: Boolean(menu) };
}
const peticionsDeTraduccio = () => fetch.mock.calls.map(([url]) => String(url)).filter(esDeTraduccio);

describe.each(TRANSPORTS)('ALT-C1 · la Consola dins de la Wiki, amb el Traductor Sobirà disponible per $nom', ({ llengua, prepara }) => {
  test('el tauler amb dades d’este ordinador: Traduir avisa i cap text ix cap al motor', async () => {
    prepara();
    const container = await obriLaConsola();
    const { menu } = await provaDeTraduir(container, llengua);
    expect(peticionsDeTraduccio()).toEqual([]);
    expect(menu).toBe(false);
    expect(mocks.toast).toHaveBeenCalledWith(AVIS_PAGINA_SENSE_TRADUCCIO);
    expect(container.querySelector('article.sdp-traduccio-cos')).toBeNull();
    expect(container.querySelector('.sdp-avis-traduccio')).toBeNull();
    expect(container.querySelector('article.content-wrapper').textContent).toContain('sdp-workflow');
  });

  test('sonda: un document públic de la Wiki, amb el mateix arnés, sí que es traduïx', async () => {
    prepara();
    const container = await obri('document_public');
    await waitFor(() => expect(container.querySelector('article.content-wrapper')?.textContent).toContain('Este paràgraf és públic'));
    const { menu } = await provaDeTraduir(container, llengua);
    expect(menu).toBe(true);
    await waitFor(() => expect(peticionsDeTraduccio().length).toBeGreaterThan(0));
    expect(mocks.toast).not.toHaveBeenCalledWith(AVIS_PAGINA_SENSE_TRADUCCIO);
  });
});
