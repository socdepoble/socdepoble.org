/* P6 (ordre del Mestre, 261003) · La llista plegada en rail en pantalles
   xicotetes (AppGridShell railMitja i railEstret). Sense les propietats, la
   closca és la d'abans; en «ample» no canvia res. jsdom no fa layout: la
   geometria es comprova en la regla CSS (al final) i al navegador
   (APPGRID_MOBIL.txt). Amb el mock de 420/340: 1400 és ample, 820 mitjà,
   375 estret. */
import React from 'react';
import { createPortal } from 'react-dom';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, cleanup, fireEvent, render, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import AppGridShell, { useAppGrid } from './AppGridShell.jsx';
import { PUNTS_DE_TALL } from './graella.js';

vi.mock('../../config/storage.js', () => ({
  getVal: () => ({ left: 420, middle: 340 }),
  setVal: vi.fn()
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const ambAmplada = (amplada) => vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(amplada);
const senseObservador = () => vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });

/* Pinta el que la closca diu al context; amb nodeRail, hi pinta un rail de
   mostra amb un portal (com UniversalWorkspace). */
function Sonda() {
  const { llistaPlegable, llistaEnRail, nodeRail } = useAppGrid();
  return (
    <>
      <output data-plegable={String(llistaPlegable)} data-rail={String(llistaEnRail)} data-node={String(Boolean(nodeRail))} />
      {nodeRail ? createPortal(<Panell nom="Menú del rail" valor="left" controls="app-grid-sidebar" />, nodeRail) : null}
    </>
  );
}
function Panell({ nom, valor, controls }) {
  const { setPanellObert } = useAppGrid();
  return (
    <button type="button" aria-controls={controls} data-obri-columna={controls ? '' : undefined} onClick={() => setPanellObert(valor)}>
      {nom}
    </button>
  );
}

const closca = (props = {}) => (
  <AppGridShell
    leftColumn={<Panell nom="Carpeta" valor="middle" />}
    middleColumn={(
      <>
        <Sonda />
        <Panell nom="Fitxa" valor={null} />
      </>
    )}
    rightColumn={<Panell nom="Llista" valor="middle" controls="app-grid-list" />}
    {...props}
  />
);

const shell = (c) => c.querySelector('.app-grid-shell');
const llista = (c) => c.querySelector('#app-grid-list');
const detall = (c) => c.querySelector('#app-grid-main');
const navegacio = (c) => c.querySelector('#app-grid-sidebar');
const rail = (c) => c.querySelector('#app-grid-rail');
const tancada = (el) => [el.hasAttribute('inert'), el.getAttribute('aria-hidden')];
const sonda = (c) => c.querySelector('output').dataset;
const boto = (c, nom) => [...c.querySelectorAll('button')].find((b) => b.textContent === nom);

test('P6 · sense railMitja ni railEstret, cap data-llista ni cap rail a cap mida: la closca d’abans', () => {
  senseObservador();
  for (const [amplada, mida] of [[1400, 'ample'], [820, 'mitja'], [375, 'estret']]) {
    ambAmplada(amplada);
    const { container } = render(closca({ middleCollapsed: true }));
    expect(shell(container).dataset.layout).toBe(mida);
    expect(shell(container).hasAttribute('data-llista'), `${amplada}`).toBe(false);
    expect(rail(container), `${amplada}`).toBeNull();
    expect(sonda(container)).toMatchObject({ plegable: 'false', rail: 'false', node: 'false' });
    cleanup();
  }
});

test('P6 · en ample, railMitja i railEstret no hi fan res: el plegat de sempre (has-middle-collapsed)', () => {
  senseObservador();
  ambAmplada(1400);
  const { container } = render(closca({ railMitja: true, railEstret: true, middleCollapsed: true }));
  expect(shell(container).dataset.layout).toBe('ample');
  expect(shell(container).hasAttribute('data-llista')).toBe(false);
  expect(rail(container)).toBeNull();
  expect(container.querySelector('.app-grid-content.has-middle-collapsed')).not.toBeNull();
  expect(sonda(container)).toMatchObject({ plegable: 'false', rail: 'false', node: 'false' });
});

test('P6 · en mitjà amb railMitja: desplegada és la d’abans; plegada, la columna és el rail, sense separador i oberta', () => {
  senseObservador();
  ambAmplada(820);
  const { container, rerender } = render(closca({ railMitja: true, railEstret: true }));
  expect(shell(container).dataset.layout).toBe('mitja');
  expect(shell(container).hasAttribute('data-llista')).toBe(false);
  expect(container.querySelector('.app-grid-resizer--middle')).not.toBeNull();
  /* El rail a part és només d'estret. */
  expect(rail(container)).toBeNull();
  expect(sonda(container)).toMatchObject({ plegable: 'true', rail: 'false', node: 'false' });

  rerender(closca({ railMitja: true, railEstret: true, middleCollapsed: true }));
  expect(shell(container).dataset.layout).toBe('mitja');
  expect(shell(container).dataset.llista).toBe('rail');
  expect(container.querySelector('.app-grid-resizer--middle')).toBeNull();
  expect(tancada(llista(container))).toEqual([false, null]);
  expect(tancada(detall(container))).toEqual([false, null]);
  /* La classe d'«ample» no s'hi posa: la graella de mitjà és la del rail. */
  expect(container.querySelector('.has-middle-collapsed')).toBeNull();
  expect(sonda(container)).toMatchObject({ plegable: 'true', rail: 'true', node: 'false' });

  rerender(closca({ railMitja: true, railEstret: true }));
  expect(shell(container).hasAttribute('data-llista')).toBe(false);
  expect(container.querySelector('.app-grid-resizer--middle')).not.toBeNull();
});

test('P6 · plegar la llista en mitjà lleva espai a la mínima d’ample: si hi cap, la closca passa a ample (la regla de sempre)', () => {
  senseObservador();
  ambAmplada(950);
  const { container, rerender } = render(closca({ railMitja: true }));
  expect(shell(container).dataset.layout).toBe('mitja');
  rerender(closca({ railMitja: true, middleCollapsed: true }));
  expect(shell(container).dataset.layout).toBe('ample');
  expect(shell(container).hasAttribute('data-llista')).toBe(false);
  expect(container.querySelector('.has-middle-collapsed')).not.toBeNull();
});

test('P6 · en estret amb railEstret: el rail és a part, obert amb el detall; la llista continua sent el panell del mestre-detall', () => {
  senseObservador();
  ambAmplada(375);
  const { container } = render(closca({ railEstret: true }));
  const s = shell(container);
  expect([s.dataset.layout, s.dataset.panell, s.dataset.llista]).toEqual(['estret', '', 'rail']);
  expect(rail(container)).not.toBeNull();
  expect(rail(container).dataset.obert).toBe('true');
  expect(tancada(rail(container))).toEqual([false, null]);
  /* Les tres columnes, com les vol el mestre-detall: només el detall obert. */
  expect(tancada(detall(container))).toEqual([false, null]);
  expect(tancada(llista(container))).toEqual([true, 'true']);
  expect(tancada(navegacio(container))).toEqual([true, 'true']);
  /* L'ordre del DOM és el visual: el rail, abans del detall. */
  expect(rail(container).nextElementSibling).toBe(detall(container));
  /* El consumidor hi pinta amb un portal. */
  expect(sonda(container)).toMatchObject({ plegable: 'true', rail: 'true', node: 'true' });
  expect(within(rail(container)).getByRole('button', { name: 'Menú del rail' })).toBeTruthy();

  /* El panell de la llista tapa rail i detall: el rail es queda muntat (la
     graella no es mou), però tancat. */
  fireEvent.click(boto(container, 'Llista'));
  expect([s.dataset.panell, s.dataset.llista]).toEqual(['middle', 'rail']);
  expect(tancada(rail(container))).toEqual([true, 'true']);
  expect(rail(container).dataset.obert).toBe('false');
  expect(tancada(llista(container))).toEqual([false, null]);
  expect(tancada(detall(container))).toEqual([true, 'true']);
  expect(sonda(container)).toMatchObject({ rail: 'false', node: 'true' });

  /* I el de la navegació, igual. */
  fireEvent.click(within(llista(container)).getByRole('button', { name: 'Fitxa' }));
  fireEvent.click(within(rail(container)).getByRole('button', { name: 'Menú del rail' }));
  expect(s.dataset.panell).toBe('left');
  expect(tancada(rail(container))).toEqual([true, 'true']);
  expect(tancada(navegacio(container))).toEqual([false, null]);
});

test('P6 · en estret amb railEstret, obrir un panell des del rail no deixa el focus retingut al rail que es tapa', () => {
  senseObservador();
  ambAmplada(375);
  const { container } = render(closca({ railEstret: true }));
  const menu = within(rail(container)).getByRole('button', { name: 'Menú del rail' });
  menu.focus();
  expect(document.activeElement).toBe(menu);
  fireEvent.click(menu);
  expect(shell(container).dataset.panell).toBe('left');
  expect(rail(container).getAttribute('aria-hidden')).toBe('true');
  expect(rail(container).contains(document.activeElement)).toBe(false);
});

test('P6 · tancar el panell de la llista amb el focus a dins el porta a l’obridor de la llista que hi ha al rail', () => {
  senseObservador();
  ambAmplada(375);
  function RailAmbObridor() {
    const { nodeRail } = useAppGrid();
    return nodeRail ? createPortal(<Panell nom="Expandir" valor="middle" controls="app-grid-list" />, nodeRail) : null;
  }
  const { container } = render(closca({ railEstret: true, panellEstret: 'middle', middleColumn: (
    <>
      <RailAmbObridor />
      <Panell nom="Fitxa" valor={null} />
    </>
  ) }));
  expect(shell(container).dataset.panell).toBe('middle');
  const fitxa = within(llista(container)).getByRole('button', { name: 'Fitxa' });
  fitxa.focus();
  fireEvent.click(fitxa);
  expect(shell(container).dataset.panell).toBe('');
  expect(document.activeElement).toBe(within(rail(container)).getByRole('button', { name: 'Expandir' }));
});

test('P6 · d’ample a estret amb la closca muntada el detall es queda, amb el focus, i ara amb el rail; i de tornada a ample el rail se’n va', () => {
  let avisa = null;
  vi.stubGlobal('ResizeObserver', class { constructor(cb) { avisa = cb; } observe() {} disconnect() {} });
  const amplada = ambAmplada(1400);
  const { container } = render(closca({ railEstret: true, rightColumn: <input aria-label="Cos de la nota" /> }));
  const editor = within(detall(container)).getByRole('textbox', { name: 'Cos de la nota' });
  editor.focus();
  amplada.mockReturnValue(375);
  act(() => avisa());
  expect([shell(container).dataset.layout, shell(container).dataset.panell, shell(container).dataset.llista]).toEqual(['estret', '', 'rail']);
  expect(document.activeElement).toBe(editor);
  amplada.mockReturnValue(1400);
  act(() => avisa());
  expect(shell(container).dataset.layout).toBe('ample');
  expect(rail(container)).toBeNull();
  expect(sonda(container)).toMatchObject({ node: 'false' });
});

/* ═══ La regla CSS (jsdom no pinta: es llig el full) ═══════════════════ */
const css = readFileSync(resolve(process.cwd(), 'src/components/layout/AppGridShell.css'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');

test('P6 · CSS: el rail és --app-grid-col-collapsed i el detall, la resta; tot penja de data-llista="rail"', () => {
  for (const mida of ['mitja', 'estret']) {
    const graella = new RegExp(`\\.app-grid-shell\\[data-layout="${mida}"\\]\\[data-llista="rail"\\] \\.app-grid-content[^{]*\\{ grid-template-columns: var\\(--app-grid-col-collapsed\\) minmax\\(0, 1fr\\); \\}`);
    expect(css, mida).toMatch(graella);
  }
  expect(css).toMatch(/\.app-grid-shell\[data-layout="mitja"\]\[data-llista="rail"\] \.app-grid-column--middle \{ grid-column: 1; \}/);
  expect(css).toMatch(/\[data-layout="estret"\]\[data-llista="rail"\] \.app-grid-column--right \{ grid-column: 2; \}/);
  /* En estret, navegació i llista continuen sent panells de banda a banda. */
  expect(css).toMatch(/\[data-layout="estret"\]\[data-llista="rail"\] \.app-grid-column--left, \.app-grid-shell\[data-layout="estret"\]\[data-llista="rail"\] \.app-grid-column--middle \{ grid-column: 1 \/ -1; \}/);
  expect(css).toMatch(/\[data-layout="estret"\]\[data-llista="rail"\] \.app-grid-rail \{ grid-column: 1; grid-row: 1 \/ 2;/);
  expect(css).toMatch(/\[data-layout="estret"\]\[data-llista="rail"\] \.app-grid-rail:not\(\[data-obert="true"\]\) \{ visibility: hidden; \}/);
  /* Cap regla nova sense l'atribut: cada selector amb rail el porta. */
  const regles = [...css.matchAll(/([^{}]+)\{[^}]*\}/g)].map(([, selector]) => selector.trim());
  const ambRail = regles.filter((selector) => selector.includes('data-llista') || selector.includes('app-grid-rail'));
  expect(ambRail.length).toBe(6);
  for (const selector of ambRail) {
    for (const part of selector.split(',')) expect(part, part).toContain('[data-llista="rail"]');
  }
  /* El rail no escriu cap xifra pròpia (graella.capes.test.js en vigila la font). */
  expect(css.split(`${PUNTS_DE_TALL.plegada}px`).length - 1).toBe(1);
});
