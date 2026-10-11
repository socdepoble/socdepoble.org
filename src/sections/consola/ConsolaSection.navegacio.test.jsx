import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

/* Navegació real de la Consola: el router de l'aplicació (RouterContext), la
   UniversalPage i les targetes de veres. Només es falsegen les fonts de dades
   i el que no té res a vore amb navegar (SEO, avisos, llenç del graf). */
const fonts = vi.hoisted(() => ({ mapa: null }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIState: () => ({ locale: 'ca-ES' }),
  useUIActions: () => ({ t: (_clau, perDefecte) => perDefecte })
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../components/universal/graph/BrainGraph', () => ({ default: () => null }));
vi.mock('./mapa/useMapa.js', () => ({
  useMapa: () => ({ estat: 'ready', mapa: fonts.mapa, error: null, carrega: () => {} })
}));
vi.mock('./consolaContent.js', async (importOriginal) => ({
  ...(await importOriginal()),
  carregaConsola: () => Promise.resolve({
    generat: '2026-09-25T13:00:00.000Z', rebuts: [], consums: [{ agent: 'claude', entrada: 1, eixida: 1 }], credits: null,
    skills: [{ nom: 'sdp-workflow', estat: 'canonic', descripcio: 'x', core: true, alDisc: true, alManifest: true }],
    segell: null, immunitari: { operacions: 0 }
  })
}));
import { RouterProvider, Route, Routes } from '../../app/contexts/RouterContext';
import ConsolaSection from './ConsolaSection.jsx';
import { paginesConsola } from './consolaPagines.js';
import { SLUGS_XIFRES, rutaXifra } from './xifresMas.js';

const MAPA = {
  schema: 'sdp.mapa.v1', generat: '2026-09-25T13:12:23.715Z', tall: null,
  nodes: [
    { id: 'agent:claude-code', tipus: 'agent', font: 'CLAUDE.md', atributs: { arnes: 'Claude Code' } },
    { id: 'skill:sdp-workflow', tipus: 'skill', font: null, atributs: {} }
  ],
  arestes: [],
  tasques: [{ id: 'plaquetes', estat: 'viu', llancador: { tipus: 'launchd', etiqueta: 'x' }, cadencia: { cada_segons: 3600 }, script: null, font: null }],
  avisos: [],
  salut: []
};

let errors;
beforeEach(() => {
  fonts.mapa = MAPA;
  window.history.replaceState(null, '', '/consola');
  errors = vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  errors.mockRestore();
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

/** Un contenidor de scroll com el de l'aplicació (.app-main__content), amb posició manual: jsdom no en té. */
function contenidorDesplacat(inici = 0) {
  const div = document.createElement('div');
  let posicio = inici;
  Object.defineProperty(div, 'scrollTop', { configurable: true, get: () => posicio, set: (v) => { posicio = v; } });
  document.body.appendChild(div);
  return div;
}

const h1 = () => screen.getByRole('heading', { level: 1 }).textContent;
const tauler = () => screen.getByRole('navigation', { name: 'Pàgines de la Consola' });
/* Onada 11 (261010; prompt 261010_1730, tasca 5) · El tauler ha acabat de
   llegir quan la mètrica del pols és al DOM. Des de l'Índex de la Consola, el
   mateix text és també el títol de la xifra «registres-de-consum» a l'índex:
   dues aparicions, i es busquen totes. */
const esperaElTauler = () => screen.findAllByText(/registres? de consum/);

/* Correcció 261004 (verificador, punt 4) · Les dues proves que recorrien les
   nou pàgines en un sol test passaven del temps límit (8 s). La causa no era
   cap espera: cada volta feia dues pintades senceres de la pàgina i quatre
   consultes per rol (getByRole calcula el nom accessible de cada element de
   tot el document, i el tauler en té centenars entre targetes i peus). Ara
   cada pàgina és una prova pròpia, i dins del recorregut es busca pel DOM
   (l'enllaç de la targeta pel seu href, l'H1 i la molla pel selector), que és
   el que es prova: la ruta i la pàgina que s'obri. */
const h1Rapid = () => document.querySelector('h1')?.textContent;
const enllacDelTauler = (ruta) => document.querySelector(`nav[aria-label="Pàgines de la Consola"] a.sp-card-link-overlay[href="${ruta}"]`);
const mollaCapALaConsola = () => document.querySelector('nav.sdp-molla a[href="/consola"]');

test.each(paginesConsola().map((p) => [p.id, p]))('la targeta del tauler obri /consola/%s i la molla de pa torna al tauler', async (_id, p) => {
  render(<Aplicacio />);
  await esperaElTauler();

  fireEvent.click(enllacDelTauler(p.ruta));
  expect(window.location.pathname).toBe(p.ruta);
  expect(h1Rapid()).toBe(p.title);
  expect(document.querySelector('nav.sdp-molla[aria-label="Molla de pa"]')).not.toBeNull();

  fireEvent.click(mollaCapALaConsola());
  expect(window.location.pathname).toBe('/consola');
  expect(h1Rapid()).toBe('Consola Termodinàmica');
  expect(errors).not.toHaveBeenCalled();
});

/* Ordre del Mestre, 261004 (xat: tota targeta amb boina i pàgina pròpia) ·
   Cada xifra del Mas porta a la seua pàgina pròpia (/consola/xifres/<slug>),
   i d'allí, la pàgina de la Consola que la tracta, amb el filtre de
   l'Inventari a la URL. Derogat per l'ordre del Mestre del 261004 (xat: tota
   targeta amb boina i pàgina pròpia): la xifra que portava directament a la
   pàgina de la Consola (prompt 261004_0515, §6/T8).
   Ordre del Mestre, 261004 (xat: cap xifra solta) · les peces d'Agents
   atòmics també porten a la seua pàgina pròpia. Derogat per l'ordre del
   Mestre del 261004 (xat: cap xifra solta): «les peces d'Agents atòmics
   continuen sent dades: clicar-les no porta enlloc». */
test('cada xifra del Mas porta a la seua pàgina pròpia, i d’allí a la de la Consola; les peces dels agents també', async () => {
  render(<Aplicacio />);
  await esperaElTauler();

  const xifres = () => screen.getByRole('region', { name: 'El Mas en xifres' });
  fireEvent.click(within(xifres()).getByRole('link', { name: '1 skill opaca' }));
  expect(window.location.pathname).toBe('/consola/xifres/skills-opaques');
  expect(h1()).toBe('1 skill opaca');
  fireEvent.click(screen.getByRole('link', { name: 'Entrades i eixides' }));
  expect(window.location.pathname).toBe('/consola/entrades');
  expect(h1()).toBe('Entrades i eixides');
  fireEvent.click(within(screen.getByRole('navigation', { name: 'Molla de pa' })).getByRole('link', { name: 'Consola Termodinàmica' }));

  // La xifra de les skills amb avisos obri la seua pàgina, i d'allí l'Inventari ja filtrat: el filtre és a la URL.
  fireEvent.click(within(xifres()).getByRole('link', { name: '0 skills amb avisos' }));
  expect(window.location.pathname).toBe('/consola/xifres/skills-amb-avisos');
  fireEvent.click(screen.getByRole('link', { name: 'Inventari de skills' }));
  expect(`${window.location.pathname}${window.location.search}`).toBe('/consola/inventari?filtre=avisos');
  expect(h1()).toBe('Inventari de skills');
  const filtres = screen.getByRole('group', { name: 'Quines skills es mostren' });
  expect(within(filtres).getByRole('button', { name: 'Amb avisos' }).getAttribute('aria-pressed')).toBe('true');
  expect(screen.getByText('Cap skill casa amb el filtre.')).toBeTruthy();
  // I triar un altre filtre el reescriu a la URL; «Totes» la neteja.
  fireEvent.click(within(filtres).getByRole('button', { name: 'Nucli' }));
  expect(window.location.search).toBe('?filtre=nucli');
  fireEvent.click(within(screen.getByRole('group', { name: 'Quines skills es mostren' })).getByRole('button', { name: 'Totes' }));
  expect(window.location.search).toBe('');

  window.history.replaceState(null, '', '/consola/agents');
  act(() => { window.dispatchEvent(new PopStateEvent('popstate')); });
  expect(h1()).toBe('Agents atòmics');
  const peces = screen.getByRole('heading', { level: 3, name: 'Les quatre peces que ho fan possible' }).closest('section');
  expect([...peces.querySelectorAll('a.sp-card-link-overlay')].map((a) => a.getAttribute('href'))).toEqual(
    ['peca-fluxos-de-treball', 'peca-tauler', 'peca-agents-sols', 'peca-vigilants'].map(rutaXifra));
  fireEvent.click(peces.querySelector('a.sp-card-link-overlay[href="/consola/xifres/peca-tauler"]'));
  expect(window.location.pathname).toBe('/consola/xifres/peca-tauler');
  expect(h1()).toBe('Tauler');
  expect(errors).not.toHaveBeenCalled();
});

/* Derogat per l'ordre del Mestre del 261004 (prompt 261004_0515): «una sola
   porta per pàgina» ja no val per a les xifres del Mas, que porten al seu
   detall. Continua valent per al tauler: una targeta per pàgina.
   Ordre del Mestre, 261004 (xat: tota targeta amb boina i pàgina pròpia) ·
   El detall de cada xifra és la seua pàgina pròpia, /consola/xifres/<slug>.
   Ordre del Mestre, 261004 (xat: cap xifra solta) · Dins de cada pàgina, les
   targetes de les seues xifres i peces porten a la seua pàgina pròpia
   (/consola/xifres/<slug>, i les del pols a /consola/pols/<id>): l'única
   porta cap al tauler o cap a una altra pàgina de la Consola continua sent
   la molla. Derogat per l'ordre del Mestre del 261004 (xat: cap xifra
   solta): «a cada pàgina, l'única porta cap a /consola/… és la molla». */
const cap = (prefix, dins = document) => [...dins.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'))
  .filter((h) => h === prefix || h.startsWith(`${prefix}/`));
const esPaginaPropia = (h) => /^\/consola\/(xifres\/[a-z0-9-]+|pols\/[a-z]+)$/.test(h);

test('al tauler de /consola, cada pàgina té exactament una targeta, i cada xifra la seua', async () => {
  render(<Aplicacio />);
  await esperaElTauler();
  const recompte = cap('/consola', tauler()).reduce((acc, h) => ({ ...acc, [h]: (acc[h] || 0) + 1 }), {});
  expect(recompte).toEqual(Object.fromEntries(paginesConsola().map((p) => [p.ruta, 1])));
  // Fora del tauler, les úniques portes són les de les xifres, una per xifra, cap a la seua pàgina pròpia.
  const xifres = cap('/consola', screen.getByRole('region', { name: 'El Mas en xifres' }));
  expect(xifres).toEqual(SLUGS_XIFRES.map(rutaXifra));
  /* Onada 11 (261010; prompt 261010_1730, tasca 5) · I, al peu, l'Índex de la
     Consola enllaça en text pur cada pàgina i cada targeta: les seues portes
     es compten a part (ConsolaSection.index.test.jsx les fixa una a una), i
     fora d'ell no n'hi ha cap altra. */
  const delIndex = cap('/consola', screen.getByRole('region', { name: 'Índex de la Consola' }));
  expect(delIndex.length).toBeGreaterThan(paginesConsola().length + xifres.length);
  expect(cap('/consola').length).toBe(paginesConsola().length + xifres.length + delIndex.length);
  expect(errors).not.toHaveBeenCalled();
});

test.each(paginesConsola().map((p) => [p.id, p]))('a /consola/%s, l’única porta cap a la Consola és la molla; la resta, pàgines pròpies', async (_id, p) => {
  window.history.replaceState(null, '', p.ruta);
  render(<Aplicacio />);
  await screen.findAllByText(/^Instantània/);
  expect(h1Rapid()).toBe(p.title);
  const portes = cap('/consola');
  expect(portes.filter((h) => !esPaginaPropia(h)), p.id).toEqual(['/consola']);
  expect(mollaCapALaConsola()).not.toBeNull();
  expect(errors).not.toHaveBeenCalled();
});

/* T2 (ordre del Mestre, 260930) · l'Índex de la Consola arriba a h6: les
   mètriques de les targetes (h5) hi entren, sagnades davall del seu títol. */
test('l’Índex de secció de la Consola recull les mètriques en h5', async () => {
  render(<Aplicacio />);
  await esperaElTauler();
  fireEvent.click(screen.getByRole('button', { name: 'Índex de secció' }));
  const index = screen.getByRole('dialog', { name: 'Taula de continguts' });
  const entrades = [...index.querySelectorAll('li')].map((li) => [li.className, li.textContent]);
  const titol = entrades.findIndex(([, text]) => text === 'El pols del cervell');
  expect(entrades[titol][0]).toBe('toc-item toc-level-3');
  // Correcció 261004 (verificador de la segona passada, punt 3) · cada mètrica concorda.
  expect(entrades.slice(titol + 2, titol + 5)).toEqual([
    ['toc-item toc-level-5', '1 registre de consum'],
    ['toc-item toc-level-5', '0 rebuts'],
    // Ordre del Mestre, 261004 · «orfes» és paraula del Mapa: el pols diu «fora del manifest».
    ['toc-item toc-level-5', '1 skill (0 fora del manifest)']
  ]);
  // Totes les mètriques del tauler: 3 del pols i 17 de les huit targetes del Mapa.
  expect(entrades.filter(([classe]) => classe === 'toc-item toc-level-5')).toHaveLength(20);
  // T3 (ordre del Mestre, 260930) · la coberta desglossa estats sense capçaleres:
  // l'Índex no s'empastra, i sota les mètriques no hi penja res.
  expect(document.querySelectorAll('.sdp-consola__estats').length).toBeGreaterThan(0);
  expect(entrades.filter(([classe]) => classe === 'toc-item toc-level-6')).toHaveLength(0);
  expect(errors).not.toHaveBeenCalled();
});

test('arrere i avant del navegador tornen a la pàgina i al tauler', async () => {
  render(<Aplicacio />);
  await esperaElTauler();
  fireEvent.click(within(tauler()).getByRole('link', { name: 'Calendari de processos' }));
  expect(h1()).toBe('Calendari de processos');

  act(() => { window.history.back(); });
  await waitFor(() => expect(window.location.pathname).toBe('/consola'));
  await waitFor(() => expect(h1()).toBe('Consola Termodinàmica'));

  act(() => { window.history.forward(); });
  await waitFor(() => expect(window.location.pathname).toBe('/consola/calendari'));
  await waitFor(() => expect(h1()).toBe('Calendari de processos'));
  expect(errors).not.toHaveBeenCalled();
});

test('canviar de pàgina torna al cim del contenidor de scroll', async () => {
  const contenidor = contenidorDesplacat(0);
  render(<Aplicacio />, { container: contenidor });
  await esperaElTauler();

  contenidor.scrollTop = 900;                       // el Mestre ha baixat fins al peu del tauler
  fireEvent.click(within(tauler()).getByRole('link', { name: 'Actors del Mas' }));
  expect(h1()).toBe('Actors del Mas');
  expect(contenidor.scrollTop).toBe(0);

  contenidor.scrollTop = 450;
  fireEvent.click(within(screen.getByRole('navigation', { name: 'Molla de pa' })).getByRole('link', { name: 'Consola Termodinàmica' }));
  expect(contenidor.scrollTop).toBe(0);
  contenidor.remove();
});

/* Ordre del Mestre, 261004 (xat: cap xifra solta) · Cada targeta del pols
   porta a la pàgina pròpia del seu panell, i la molla torna al pols.
   Derogat per l'ordre del Mestre del 261004 (xat: cap xifra solta): «targetes
   i desplegables no toquen la ruta» (el detall obria un <details>). */
test('/consola/pols: cada targeta porta a la pàgina del seu panell, i la molla torna al pols', async () => {
  window.history.replaceState(null, '', '/consola/pols');
  render(<Aplicacio />);
  await screen.findByText('0 rebuts de lectura');

  for (const [id, titol] of [['rebuts', 'Rebuts'], ['skills', 'Skills']]) {
    fireEvent.click(document.querySelector(`a.sp-card-link-overlay[href="/consola/pols/${id}"]`));
    expect(window.location.pathname).toBe(`/consola/pols/${id}`);
    expect(h1Rapid()).toBe(titol);
    fireEvent.click(document.querySelector('nav.sdp-molla a[href="/consola/pols"]'));
    expect(window.location.pathname).toBe('/consola/pols');
    expect(h1Rapid()).toBe('El pols del cervell');
  }
  expect(document.querySelector('details')).toBeNull();
  expect(errors).not.toHaveBeenCalled();
});

test('una subruta desconeguda torna al tauler sense deixar-la a l’historial', async () => {
  window.history.replaceState(null, '', '/consola/pestanyes');
  const abans = window.history.length;
  render(<Aplicacio />);
  await esperaElTauler();
  expect(window.location.pathname).toBe('/consola');
  expect(window.history.length).toBe(abans);
});
