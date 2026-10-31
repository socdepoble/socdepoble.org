/* P6 (ordre del Mestre, 261003) · La llista plegada en rail en pantalles
   xicotetes (AppGridShell railEstret). Sense la propietat, la closca és la
   d'abans; en «ample» no canvia res. jsdom no fa layout: la geometria es
   comprova en la regla CSS (al final) i al navegador (APPGRID_MOBIL.txt).
   Amb el mock de 340/420: 1400 és ample, 820 mitjà, 375 estret.
   Decisió 4 del Mestre (30-10-2026 ~15:00) · railMitja (la llista en rail en
   «mitja») i railEsquerra (la navegació en rail fix en «mitja», barres
   261004) només els passava l'UniversalWorkspace, que amb columnesFixes ja
   no passa per «mitja»: s'han retirat, i les seues proves amb elles. */
import React from 'react';
import { createPortal } from 'react-dom';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, cleanup, fireEvent, render, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import AppGridShell, { useAppGrid } from './AppGridShell.jsx';
import { PUNTS_DE_TALL } from './graella.js';
import postcss from 'postcss';
import Specificity from '@bramus/specificity';
import { execFileSync } from 'node:child_process';
import { Dialeg } from '../PedraSeca/organismes/Dialeg.jsx';

/* Barres (ordre del Mestre, 261004) · El mock era { left: 420, middle: 340 }
   i SANEJA_AMPLADA rebutja amb raó el left de 420, fora de
   COLUMN_LIMITS.left (200-340): el canviava per 260, el mínim d'ample
   baixava a 922 i la prova de 950 es tornava roja. Ara dins dels límits i
   intercanviades: el mínim d'ample continua sent 1082 (340 + 420 + 320 + 2)
   i els talls de dalt valen. */
vi.mock('../../config/storage.js', () => ({
  getVal: () => ({ left: 340, middle: 420 }),
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
   mostra amb un portal (com UniversalWorkspace). Corrector del Gauntlet f4
   (30-10-2026) · Sense llistaEnRail, retirat del context: si el rail és obert
   o tancat ho diuen els seus atributs (data-obert, inert, aria-hidden). */
function Sonda() {
  const { llistaPlegable, nodeRail } = useAppGrid();
  return (
    <>
      <output data-plegable={String(llistaPlegable)} data-node={String(Boolean(nodeRail))} />
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

test('P6 · sense railEstret, cap data-llista ni cap rail a cap mida: la closca d’abans', () => {
  senseObservador();
  for (const [amplada, mida] of [[1400, 'ample'], [820, 'mitja'], [375, 'estret']]) {
    ambAmplada(amplada);
    const { container } = render(closca({ middleCollapsed: true }));
    expect(shell(container).dataset.layout).toBe(mida);
    expect(shell(container).hasAttribute('data-llista'), `${amplada}`).toBe(false);
    expect(rail(container), `${amplada}`).toBeNull();
    expect(sonda(container)).toMatchObject({ plegable: 'false', node: 'false' });
    cleanup();
  }
});

test('P6 · en ample, railEstret no hi fa res: el plegat de sempre (has-middle-collapsed)', () => {
  senseObservador();
  ambAmplada(1400);
  const { container } = render(closca({ railEstret: true, middleCollapsed: true }));
  expect(shell(container).dataset.layout).toBe('ample');
  expect(shell(container).hasAttribute('data-llista')).toBe(false);
  expect(rail(container)).toBeNull();
  expect(container.querySelector('.app-grid-content.has-middle-collapsed')).not.toBeNull();
  expect(sonda(container)).toMatchObject({ plegable: 'false', node: 'false' });
});

/* Decisió 4 del Mestre (30-10-2026 ~15:00) · En «mitja» (el Xat, les apps),
   la closca no té cap rail de llista ni de navegació: qui encara passara
   railMitja o railEsquerra obtindria el mateix DOM que sense (cap
   data-llista, cap data-esquerra, el separador del mig, la navegació
   tancada fins que s'obri el seu panell) i el context ja no oferix
   ambRailNavegacio ni navegacioEnRail. És l'única prova que encara les
   passa: la regressió explícita de «s'ignoren».
   Corrector del Gauntlet f4 (30-10-2026) · Tampoc llistaEnRail, que només
   llegia la llista en rail de «mitja» (railMitja). Cap atribut data-esquerra
   no existix ja enlloc: l'igualtat del DOM ho cobrix, i la CSS ho vigila la
   prova «cap regla de data-esquerra» de davall. */
function SondaContext() {
  return <i data-testid="claus" data-claus={Object.keys(useAppGrid()).sort().join(' ')} />;
}
test('Decisió 4 · en mitjà, railMitja i railEsquerra ja no existixen: el DOM i el context són els de sense', () => {
  senseObservador();
  ambAmplada(820);
  const sense = render(closca({ middleCollapsed: true, rightColumn: <SondaContext /> })).container.innerHTML;
  cleanup();
  const { container } = render(closca({ railMitja: true, railEsquerra: true, middleCollapsed: true, rightColumn: <SondaContext /> }));
  expect(container.innerHTML).toBe(sense);
  expect(shell(container).dataset.layout).toBe('mitja');
  expect(shell(container).hasAttribute('data-llista')).toBe(false);
  expect(container.querySelector('.app-grid-resizer--middle')).not.toBeNull();
  expect(tancada(navegacio(container))).toEqual([true, 'true']);
  expect(sonda(container)).toMatchObject({ plegable: 'false', node: 'false' });
  const claus = container.querySelector('[data-testid="claus"]').dataset.claus.split(' ');
  expect(claus).not.toContain('ambRailNavegacio');
  expect(claus).not.toContain('navegacioEnRail');
  expect(claus).not.toContain('llistaEnRail');
});

test('P6 · plegar la llista en mitjà lleva espai a la mínima d’ample: si hi cap, la closca passa a ample (la regla de sempre)', () => {
  senseObservador();
  ambAmplada(950);
  const { container, rerender } = render(closca());
  expect(shell(container).dataset.layout).toBe('mitja');
  rerender(closca({ middleCollapsed: true }));
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
  expect(sonda(container)).toMatchObject({ plegable: 'true', node: 'true' });
  expect(within(rail(container)).getByRole('button', { name: 'Menú del rail' })).toBeTruthy();

  /* El panell de la llista tapa rail i detall: el rail es queda muntat (la
     graella no es mou), però tancat. */
  fireEvent.click(boto(container, 'Llista'));
  expect([s.dataset.panell, s.dataset.llista]).toEqual(['middle', 'rail']);
  expect(tancada(rail(container))).toEqual([true, 'true']);
  expect(rail(container).dataset.obert).toBe('false');
  expect(tancada(llista(container))).toEqual([false, null]);
  expect(tancada(detall(container))).toEqual([true, 'true']);
  expect(sonda(container)).toMatchObject({ node: 'true' });

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

/* Decisió 4 del Mestre (30-10-2026 ~15:00) · Sense el rail fix de la
   navegació (railEsquerra, retirat), en «mitja» el separador del mig parteix
   de la llista visible, min(desada, closca − detall), i la tecla Fi la porta
   fins on deixa el detall: el càlcul d'abans per al Xat i les apps. */
test('Decisió 4 · en mitjà, el separador del mig compta només el detall', () => {
  senseObservador();
  const separador = (c) => c.querySelector('.app-grid-resizer--middle');
  const desada = (c) => c.querySelector('.app-grid-page').style.getPropertyValue('--app-grid-col-list');
  /* 760: min(420, 760 − 320) = 420 (amb el rail retirat, 760 − 320 − 56 = 384). */
  ambAmplada(760);
  const a760 = render(closca());
  expect(separador(a760.container).getAttribute('aria-valuenow')).toBe('420');
  /* Corrector del Gauntlet f4 (30-10-2026) · El màxim declarat és el mateix
     on porta Fi: 760 − 320 = 440, no els 520 de sempre. */
  expect(separador(a760.container).getAttribute('aria-valuemax')).toBe(String(760 - PUNTS_DE_TALL.detall));
  cleanup();
  ambAmplada(820);
  const ambFi = render(closca());
  fireEvent.keyDown(separador(ambFi.container), { key: 'End' });
  expect(separador(ambFi.container).getAttribute('aria-valuenow')).toBe(String(820 - PUNTS_DE_TALL.detall));
  expect(separador(ambFi.container).getAttribute('aria-valuemax')).toBe(String(820 - PUNTS_DE_TALL.detall));
  expect(desada(ambFi.container)).toBe(`${820 - PUNTS_DE_TALL.detall}px`);
});

/* ═══ La regla CSS (jsdom no pinta: es llig el full) ═══════════════════ */
const css = readFileSync(resolve(process.cwd(), 'src/components/layout/AppGridShell.css'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');

test('P6 · CSS: el rail és --app-grid-col-collapsed i el detall, la resta; tot penja de data-llista="rail"', () => {
  expect(css).toMatch(/\.app-grid-shell\[data-layout="estret"\]\[data-llista="rail"\] \.app-grid-content \{ grid-template-columns: var\(--app-grid-col-collapsed\) minmax\(0, 1fr\); \}/);
  /* Decisió 4 del Mestre (30-10-2026 ~15:00) · Cap regla de la llista en
     rail en «mitja» (railMitja, retirat). */
  expect(css).not.toContain('[data-layout="mitja"][data-llista="rail"]');
  expect(css).toMatch(/\.app-grid-shell\[data-layout="estret"\]\[data-llista="rail"\] \.app-grid-column--right \{ grid-column: 2; \}/);
  /* En estret, navegació i llista continuen sent panells de banda a banda. */
  expect(css).toMatch(/\[data-layout="estret"\]\[data-llista="rail"\] \.app-grid-column--left, \.app-grid-shell\[data-layout="estret"\]\[data-llista="rail"\] \.app-grid-column--middle \{ grid-column: 1 \/ -1; \}/);
  expect(css).toMatch(/\[data-layout="estret"\]\[data-llista="rail"\] \.app-grid-rail \{ grid-column: 1; grid-row: 1 \/ 2;/);
  expect(css).toMatch(/\[data-layout="estret"\]\[data-llista="rail"\] \.app-grid-rail:not\(\[data-obert="true"\]\) \{ visibility: hidden; \}/);
  /* Cap regla nova sense l'atribut: cada selector amb rail el porta. */
  const regles = [...css.matchAll(/([^{}]+)\{[^}]*\}/g)].map(([, selector]) => selector.trim());
  const ambRail = regles.filter((selector) => selector.includes('data-llista') || selector.includes('app-grid-rail'));
  expect(ambRail.length).toBe(5);
  for (const selector of ambRail) {
    for (const part of selector.split(',')) expect(part, part).toContain('[data-llista="rail"]');
  }
  /* El rail no escriu cap xifra pròpia (graella.capes.test.js en vigila la font). */
  expect(css.split(`${PUNTS_DE_TALL.plegada}px`).length - 1).toBe(1);
});

/* Decisió 4 del Mestre (30-10-2026 ~15:00) · Les tres regles del rail fix de
   la navegació en «mitja» (data-esquerra="rail", railEsquerra) s'han
   retirat: cap regla nomena data-esquerra. «Mitja» (el Xat, les apps)
   conserva el panell de la navegació i el mínim del detall de sempre. */
test('Decisió 4 · CSS: cap regla de data-esquerra; «mitja» conserva el panell de la navegació i el mínim del detall', () => {
  expect(css).not.toContain('data-esquerra');
  expect(css).toMatch(/\.app-grid-shell\[data-layout="mitja"\] \.app-grid-column--left \{ position: absolute; left: 0; top: 0; bottom: 0; width: max-content;/);
  /* Pla2045: menú segons contingut, topall300px i espai tàctil fora. */
  expect(css).toContain('max-width: min(var(--sdp-menu-ample-max), calc(100% - var(--sdp-touch-min)));');
  /* El detall de «mitja» conserva el seu mínim: les pistes de sempre. */
  expect(css).toContain(`min(var(--app-grid-col-list-live, var(--app-grid-col-list)), calc(100% - ${PUNTS_DE_TALL.detall}px))`);
  expect(css).toContain(`minmax(${PUNTS_DE_TALL.detall}px, 1fr)`);
  const regles = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].map(([, selector, cos]) => [selector.trim(), cos]);
  /* Els recomptes de graella.capes.test.js: 56px una vegada i 320px dues. */
  expect(css.split(`${PUNTS_DE_TALL.plegada}px`).length - 1).toBe(1);
  expect(css.split(`${PUNTS_DE_TALL.detall}px`).length - 1).toBe(2);
  /* La closca no s'escurça per baix: la reserva de la barra mòbil va als
     scrollers del Workspace (modules.css), no a .app-grid-page. */
  const pagina = regles.filter(([selector]) => /(^|,\s*)\.app-grid-page\s*$/.test(selector)).map(([, cos]) => cos).join(' ');
  expect(pagina).toContain('inset: 0;');
  expect(pagina).not.toMatch(/(^|[\s;])bottom:/);
});

/* Enxufe · Vite processa el full real que PedraSecaEmbed injecta. jsdom no
   pinta @layer: PostCSS i l'analitzador d'especificitat del lock resolen les
   declaracions sobre el Dialeg real portalitzat. No es compta cap literal
   ni es busquen selectors esperats; les dimensions es projecten en la caixa
   de cada instància. La mesura de píxel real queda per al navegador. */
let fullEnxufat;
let estilsEnxufats;
const capesDelFull = () => {
  const capes = [];
  fullEnxufat.walkAtRules('layer', (regla) => {
    for (const nom of regla.params.split(',').map((s) => s.trim())) if (!capes.includes(nom)) capes.push(nom);
  });
  return capes;
};
function selectorLocal(node, selector) {
  const host = node.getRootNode().host;
  const inici = /^:host(?:\(([^)]*)\))?(?:\s+|$)/.exec(selector);
  if (inici) {
    if (!host || (inici[1] && !host.matches(inici[1]))) return false;
    selector = selector.slice(inici[0].length);
    if (!selector) return node === host;
  } else if (selector.includes(':host')) return false;
  try { return node.matches(selector); } catch { return false; }
}
function declaracioGuanyadora(node, propietat) {
  let guanyadora = null;
  let ordre = 0;
  const CAPES = capesDelFull();
  fullEnxufat.walkRules((regla) => {
    ordre++;
    const d = regla.nodes?.findLast((n) => n.type === 'decl' && n.prop === propietat);
    if (!d) return;
    let pare = regla.parent;
    let capa = CAPES.length;
    while (pare) {
      if (pare.type === 'atrule' && pare.name === 'layer') capa = CAPES.indexOf(pare.params);
      pare = pare.parent;
    }
    for (const selector of regla.selectors) {
      if (!selectorLocal(node, selector)) continue;
      const [especificitat] = Specificity.calculate(selector);
      const rang = [d.important ? 1 : 0, d.important ? -capa : capa, ...especificitat.toArray(), ordre];
      if (!guanyadora || rang.some((n, i) => n !== guanyadora.rang[i] && rang.slice(0, i).every((p, j) => p === guanyadora.rang[j]) && n > guanyadora.rang[i])) {
        guanyadora = { valor: d.value, rang };
      }
    }
  });
  return guanyadora?.valor;
}
function variableDe(node, nom) {
  const root = node.closest('.sdp-root');
  return root.style.getPropertyValue(nom) || declaracioGuanyadora(root, nom);
}
function pixelsDe(valor, node, amplada) {
  const variable = /^var\((--[\w-]+)\)$/.exec(valor);
  if (variable) return pixelsDe(variableDe(node, variable[1]), node, amplada);
  const min = /^min\((.*),\s*(.*)\)$/.exec(valor);
  if (min) return Math.min(pixelsDe(min[1], node, amplada), pixelsDe(min[2], node, amplada));
  const resta = /^calc\((.*) - (.*)\)$/.exec(valor);
  if (resta) return pixelsDe(resta[1], node, amplada) - pixelsDe(resta[2], node, amplada);
  const dimensio = /^([\d.]+)(px|rem|%)$/.exec(valor);
  if (!dimensio) throw new Error(`Dimensió CSS no interpretable en esta prova: ${valor}`);
  return Number(dimensio[1]) * ({ px: 1, rem: 16, '%': amplada / 100 })[dimensio[2]];
}
function calaixEncastat(sidebar = true) {
  const host = document.createElement('soc-de-poble');
  document.body.append(host);
  const shadow = host.attachShadow({ mode: 'closed' });
  const estil = document.createElement('style');
  estil.textContent = estilsEnxufats;
  shadow.append(estil);
  const root = document.createElement('div');
  root.className = 'sdp-root is-compact';
  shadow.append(root);
  const muntatge = document.createElement('div');
  root.append(muntatge);
  render(<Dialeg obert titol="Menú de la instància" costat="esquerra" variant="sense-marc" className={sidebar ? 'sdp-dialeg-sidebar' : undefined}><nav>Una etiqueta prou llarga per requerir el sostre del menú</nav></Dialeg>, { container: muntatge, baseElement: root });
  return { host, shadow, root, dialeg: within(root).getByRole('dialog', { name: 'Menú de la instància' }) };
}

test('Enxufe · la cascada del full injectat deixa espai tàctil fora del calaix de cada instància', async () => {
  // Vitest omet CSS per defecte. Processem l'entrada amb la mateixa API de
  // Vite, sense .env, servidor, build escrit ni cap configuració global nova.
  estilsEnxufats = execFileSync(process.execPath, ['--input-type=module', '-e', `
    import { readFileSync } from 'node:fs';
    import { resolve } from 'node:path';
    import { preprocessCSS, resolveConfig } from 'vite';
    const entrada = resolve(process.cwd(), 'src/css/index.css');
    const config = await resolveConfig({ configFile: false, envFile: false, root: process.cwd(), logLevel: 'silent' }, 'build');
    const { code } = await preprocessCSS(readFileSync(entrada, 'utf8'), entrada, config);
    process.stdout.write(code);
  `], { cwd: process.cwd(), encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  fullEnxufat = postcss.parse(estilsEnxufats);
  const instancies = [calaixEncastat(), calaixEncastat()];
  const control = calaixEncastat(false);
  try {
    for (const { shadow, root, dialeg } of instancies) {
      expect(dialeg.getRootNode()).toBe(shadow);
      expect(dialeg.parentElement.classList.contains('sdp-capa-modal--calaix')).toBe(true);
      expect(dialeg.parentElement.parentElement).toBe(root);
      expect(document.body.querySelector('dialog')).toBeNull();
      expect(declaracioGuanyadora(dialeg, 'width')).toBe('max-content');
      for (const amplada of [280, 360, 600]) {
        const maxim = pixelsDe(declaracioGuanyadora(dialeg, 'max-width'), dialeg, amplada);
        expect(maxim, `sostre del calaix dins de ${amplada}px`).toBeLessThanOrEqual(300);
        expect(amplada - maxim, `aire per a tancar dins de ${amplada}px`).toBeGreaterThanOrEqual(48);
      }
    }
    instancies[0].root.style.setProperty('--sdp-menu-ample-max', '240px');
    expect(pixelsDe(declaracioGuanyadora(instancies[0].dialeg, 'max-width'), instancies[0].dialeg, 600)).toBe(240);
    expect(pixelsDe(declaracioGuanyadora(instancies[1].dialeg, 'max-width'), instancies[1].dialeg, 600)).toBe(300);
    // El sostre del menú no captura altres calaixos de la mateixa instància.
    expect(pixelsDe(declaracioGuanyadora(control.dialeg, 'max-width'), control.dialeg, 600)).toBe(600);
  } finally {
    cleanup();
    [...instancies, control].forEach(({ host }) => host.remove());
  }
});
