import React from 'react';
import { webcrypto } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

/* Gauntlet 261030 (cicle 4, ALT-C1 de l'auditoria matinal de Codex) · La
   Consola mostra dades d'este ordinador: la matriu de requeriments que el
   Mestre obri d'un fitxer («Es llig en este navegador: no es puja enlloc»),
   amb les seues fonts i evidències (rutes que el mode privacitat amaga), i
   les fonts del servidor local (consola.json, el Mapa, els empaquetats). Cap
   d'elles pot eixir cap a un motor de traducció (el servei del mateix origen,
   Apertium o MyMemory). Ruta real: el router de veres, la UniversalPage i el
   PageFrame de veres, el Traductor Sobirà disponible pels dos transports
   (el servei del lloc i el lliure del navegador, que porta el basc a
   MyMemory), i el clic de la persona: Traduir i, si hi haguera menú, una
   llengua. Cap pàgina de /consola no fa cap petició de traducció, i Traduir
   avisa (AVIS_PAGINA_SENSE_TRADUCCIO), com les apps i les altres pàgines
   amb contingut privat. Només es falsegen les fonts (sense xarxa), els
   avisos, el SEO i el llenç del graf. */
const mocks = vi.hoisted(() => ({ toast: null, ui: null }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIState: () => mocks.ui,
  useUIActions: () => ({ t: (_clau, perDefecte) => perDefecte }),
  useUIActionsOpcional: () => null
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../components/universal/graph/BrainGraph', () => ({ default: () => null }));
vi.mock('./mapa/useMapa.js', () => ({
  useMapa: () => ({ estat: 'ready', mapa: MAPA, error: null, carrega: () => {} })
}));
vi.mock('./consolaContent.js', async (importOriginal) => ({
  ...(await importOriginal()),
  carregaConsola: () => Promise.resolve({
    generat: '2026-09-25T13:00:00.000Z', rebuts: [], consums: [{ agent: 'claude', entrada: 1, eixida: 1 }], credits: null,
    skills: [{ nom: 'sdp-workflow', estat: 'canonic', descripcio: 'x', core: true, alDisc: true, alManifest: true }],
    segell: null, immunitari: { operacions: 0 }
  })
}));
vi.mock('./govern/governContent.js', async (importOriginal) => ({
  ...(await importOriginal()),
  carregaGovern: () => Promise.resolve(null)
}));
vi.mock('./empaquetats.js', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, carregaEmpaquetats: () => Promise.resolve(real.normalitzaEmpaquetats(EMPAQUETATS)) };
});
import { RouterProvider, Route, Routes } from '../../app/contexts/RouterContext';
import ConsolaSection from './ConsolaSection.jsx';
import { AVIS_PAGINA_SENSE_TRADUCCIO } from '../../components/universal/PageFrame.jsx';
import { NOM_MENU_TRADUIR } from '../../components/universal/traduccio/MenuTraduir.jsx';
import { buidaCauTraduccions } from '../../components/PedraSeca/hooks/useTraduccioPagina.js';
import { APERTIUM_BETA, APERTIUM_RESERVA, MYMEMORY, buidaSessioLliure, fixaTraductorLliure } from '../../data/traductorLliure.js';
import { RUTA_EMPAQUETATS } from './empaquetats.js';
import { RUTA_POLS } from './polsConsola.js';
import { SLUGS_XIFRES, rutaXifra } from './xifresMas.js';

// Les empremtes de les files de la matriu es calculen amb WebCrypto, com al navegador.
if (!globalThis.crypto?.subtle) vi.stubGlobal('crypto', webcrypto);

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
const EMPAQUETATS = vi.hoisted(() => ({
  schema: 'sdp.empaquetats.v1',
  generat: '2026-10-28T16:30:00.000Z',
  canonica: '1.0.0',
  carpeta: true,
  plataformes: {
    android: { versions: ['1.0.0'], builds: ['1'], font: 'android/app/build.gradle', artefactes: ['261023_socdepoble_1.0.0+1.aab'] },
    ios: { versions: ['1.0.0'], builds: ['1'], font: 'ios/App/App.xcodeproj/project.pbxproj', artefactes: [] },
    pwa: { versions: ['1.0.0'], font: 'package.json', artefactes: [] },
    wordpress: { versions: ['1.1.9'], estable: '1.1.9', font: 'wordpress-plugin/socdepoble-enxufe.php', artefactes: [] }
  }
}));

/* La matriu que el Mestre obri d'un fitxer d'este ordinador: un requeriment
   i una evidència amb una ruta local, inventats. */
const REQUERIMENT_LOCAL = 'Requeriment inventat que no ha d’eixir d’este ordinador';
const MATRIU_LOCAL = {
  at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  baseline_head: '7a1828ca779ef74284846c9e5a4122cd23945689',
  scope: 'local-audit',
  statuses: { '[PARCIAL]': 1 },
  requirements: [{
    id: 'F01', source: '§0.5', requirement: REQUERIMENT_LOCAL, status: '[PARCIAL]',
    evidence: '[src/inventat.jsx:1](</Users/mestre/inventat/src/inventat.jsx:1>) encara no.',
    owner: 'Claude implementa; Codex verifica', priority: 'P1', acceptance: 'Prova del flux d’usuari.'
  }]
};

const URL_SERVEI = '/wp-json/socdepoble/v1/traduir';
/* Els dos transports del Traductor Sobirà (IDEA-31): el servei del mateix
   origen, i el lliure del navegador (Apertium; el basc i l'alemany, MyMemory). */
const TRANSPORTS = Object.freeze([
  { nom: 'el servei del lloc', llengua: 'Anglés', prepara: () => { mocks.ui = { locale: 'ca-ES', externalConfig: { traductorUrl: URL_SERVEI } }; } },
  { nom: 'el transport lliure (MyMemory)', llengua: 'Basc', prepara: () => { fixaTraductorLliure('apertium'); } }
]);

const esDeTraduccio = (url) => {
  const adreca = String(url);
  return adreca.includes(URL_SERVEI) || [APERTIUM_BETA, APERTIUM_RESERVA, MYMEMORY].some((motor) => adreca.startsWith(motor));
};
const respostaJson = (status, cos) => ({ ok: status >= 200 && status < 300, status, json: async () => cos });
/* Un motor que respon de veres (la forma de PageFrame.traduccio.lliure.test.jsx):
   si alguna pàgina deixara traduir, la traducció arribaria i es pintaria. */
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
let errors;
beforeEach(() => {
  mocks.toast = vi.fn();
  mocks.ui = { locale: 'ca-ES', externalConfig: {} };
  buidaCauTraduccions();
  buidaSessioLliure();
  fetch = fetchFals();
  vi.stubGlobal('fetch', fetch);
  errors = vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  errors.mockRestore();
  vi.unstubAllGlobals();
  if (!globalThis.crypto?.subtle) vi.stubGlobal('crypto', webcrypto);
  fixaTraductorLliure(null);
  localStorage.clear();
});

function Aplicacio() {
  return (
    <RouterProvider>
      <Routes>
        <Route path="/consola/*" element={<ConsolaSection />} />
      </Routes>
    </RouterProvider>
  );
}
async function obri(ruta) {
  window.history.replaceState(null, '', ruta);
  const { container } = render(<Aplicacio />);
  await act(async () => {});
  await waitFor(() => expect(document.body.textContent).not.toMatch(/Llegint/));
  return container;
}
/* Obri la matriu amb el selector de Pedra Seca del peu, com ho faria el Mestre. */
async function obriMatriuLocal() {
  const input = screen.getByLabelText('La matriu de requeriments');
  const fitxer = new File([JSON.stringify(MATRIU_LOCAL)], 'mcr.json', { type: 'application/json' });
  await act(async () => { fireEvent.change(input, { target: { files: [fitxer] } }); });
  await waitFor(() => expect(document.body.textContent).toContain(REQUERIMENT_LOCAL));
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
function capPeticioDeTraduccio(container, { menu }) {
  expect(fetch.mock.calls.map(([url]) => String(url)).filter(esDeTraduccio)).toEqual([]);
  expect(menu).toBe(false);
  expect(mocks.toast).toHaveBeenCalledWith(AVIS_PAGINA_SENSE_TRADUCCIO);
  expect(container.querySelector('article.sdp-traduccio-cos')).toBeNull();
  expect(container.querySelector('.sdp-avis-traduccio')).toBeNull();
}

/* Les superfícies de la Consola, amb la ruta i el que hi ha de local. */
const PAGINES = Object.freeze([
  { nom: 'el tauler (/consola)', ruta: '/consola' },
  { nom: 'una pàgina de la sala de màquines amb consola.json', ruta: RUTA_POLS },
  { nom: 'una pàgina de la sala de màquines amb el Mapa', ruta: '/consola/inventari' },
  { nom: 'els empaquetats', ruta: RUTA_EMPAQUETATS },
  { nom: 'una pàgina del govern que no existix', ruta: '/consola/govern/no-existix' },
  { nom: 'un panell del pols', ruta: `${RUTA_POLS}/rebuts` },
  { nom: 'una xifra del Mas', ruta: rutaXifra(SLUGS_XIFRES[0]) }
]);

describe.each(TRANSPORTS)('ALT-C1 · amb el Traductor Sobirà disponible per $nom', ({ llengua, prepara }) => {
  test('la matriu de requeriments oberta d’un fitxer d’este ordinador: Traduir avisa i cap text ix cap al motor', async () => {
    prepara();
    const container = await obri('/consola/govern/requeriments');
    await obriMatriuLocal();
    const prova = await provaDeTraduir(container, llengua);
    capPeticioDeTraduccio(container, prova);
    expect(document.body.textContent).toContain(REQUERIMENT_LOCAL);
  });

  test.each(PAGINES)('$nom: Traduir avisa i cap text ix cap al motor', async ({ ruta }) => {
    prepara();
    const container = await obri(ruta);
    const prova = await provaDeTraduir(container, llengua);
    capPeticioDeTraduccio(container, prova);
  });
});
