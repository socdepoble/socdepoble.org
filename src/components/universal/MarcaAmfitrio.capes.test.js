import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createElement } from 'react';
import { afterEach, expect, test } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { TitolAmfitrio } from './MarcaAmfitrio.jsx';
import { MemoryRouter } from '../../app/contexts/RouterContext.jsx';
import EspecimenShell from '../../sections/disseny/cataleg/detalls/EspecimenShell.jsx';

/* Enxufe universal, T2 (260929) · jsdom no pinta: es comprova la regla.
   Amb la barra lateral plegada, la marca (.brand) de layout.css sobreïx del
   rail i tapa l'inici de la barra negra; el títol de l'amfitrió (modules.css,
   bloc SDP:amfitrio) comença on acaba la marca. Eixe 176px no és cap token:
   és la resta de dos literals de layout.css. Si algú en canvia un, este test
   ho diu abans que el nom quede tapat o separat de la marca. */
const net = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');

/** Regles finals (sense blocs niats): selectors separats i declaracions. */
const regles = (css) => [...css.matchAll(/([^{};]+)\{([^{}]*)\}/g)].map(([, sel, cos]) => ({
  selectors: sel.split(',').map((s) => s.trim()).filter(Boolean),
  decls: Object.fromEntries(cos.split(';').map((d) => d.trim()).filter(Boolean)
    .map((d) => [d.slice(0, d.indexOf(':')).trim(), d.slice(d.indexOf(':') + 1).trim()]))
}));

const layout = regles(net('src/css/layout.css'));
const moduls = regles(net('src/css/modules.css'));

/** L'únic valor en px de `prop` a les regles que nomenen exactament `selector`. */
const px = (fulls, selector, prop) => {
  const valors = fulls.filter((r) => r.selectors.includes(selector) && prop in r.decls).map((r) => r.decls[prop]);
  expect([selector, valors.length]).toEqual([selector, 1]);
  const m = /^(\d+)px$/.exec(valors[0]);
  expect(m, `${selector} { ${prop}: ${valors[0]} } ha de ser un literal en px`).not.toBeNull();
  return Number(m[1]);
};

const reglesDelTitolPlegat = moduls.filter((r) => r.selectors.some((s) => s.includes('sidebar-closed') && s.includes('.sdp-amfitrio-titol')));

const arrels = [];
const arrelPlegada = () => {
  const arrel = document.body.appendChild(document.createElement('div'));
  arrel.className = 'sdp-root sidebar-closed';
  arrels.push(arrel);
  return arrel;
};

afterEach(() => {
  cleanup();
  for (const arrel of arrels.splice(0)) arrel.remove();
});

/* Ordre del Mestre, 261001 · Les regles de la barra plegada de layout.css
   (§ TRUC PER A LA SIDEBAR EN ESCRIPTORI) porten ara la guarda
   :not(.is-compact): la closca compacta la decidix AppShell per l'ample del
   contenidor (≤1023px, també incrustada) i no el viewport. MarIA va posar
   la classe .is-compact (prompt 260930_2135 de Codex, T2); la guarda CSS és
   la proposta C1-2 de l'auditoria de Claude (260930_2145), aplicada per
   Codex amb el repartiment confirmat pel Mestre (260930_2150, C1), i
   l'adaptació d'esta prova és la D5-T1 de Codex (260930_2150 i l'acta
   261001_0052). La geometria no canvia (232 − 56 = 176). */
const MARCA_PLEGADA = '.sdp-root:not(.is-compact).sidebar-closed .brand';
const RAIL_PLEGAT = '.sdp-root:not(.is-compact).sidebar-closed nav.app-sidebar';

test('el marge del títol plegat és exactament l’ample de la marca menys el del rail (layout.css)', () => {
  const marca = px(layout, MARCA_PLEGADA, 'width');
  const rail = px(layout, RAIL_PLEGAT, 'width');
  expect(marca).toBeGreaterThan(rail);
  expect(reglesDelTitolPlegat).toHaveLength(1);
  expect(reglesDelTitolPlegat[0].decls['margin-inline-start']).toBe(`${marca - rail}px`);
});

/* La negativa del canvi de dalt: en una arrel compacta (calaix, sense rail)
   la marca de 232px no s'aplica encara que l'arrel conserve sidebar-closed
   (AppShell no la lleva en passar d'escriptori a compacte). */
test('la marca i el rail plegats només casen amb una arrel que no és compacta', () => {
  const arrel = arrelPlegada();
  const marca = arrel.appendChild(document.createElement('button'));
  marca.className = 'brand';
  const rail = arrel.appendChild(document.createElement('nav'));
  rail.className = 'app-sidebar';
  expect([marca.matches(MARCA_PLEGADA), rail.matches(RAIL_PLEGAT)]).toEqual([true, true]);
  arrel.classList.add('is-compact');
  expect([marca.matches(MARCA_PLEGADA), rail.matches(RAIL_PLEGAT)]).toEqual([false, false]);
});

test('la regla del títol plegat només toca el fill directe de la barra negra', () => {
  expect(reglesDelTitolPlegat).toHaveLength(1);
  for (const selector of reglesDelTitolPlegat[0].selectors) {
    expect(selector).toMatch(/\.bar-black > \.sdp-amfitrio-titol$/);
  }
});

test('al DOM: desplaça el títol de la barra negra real i no la mostra del catàleg', () => {
  const [selector] = reglesDelTitolPlegat[0].selectors;

  const barra = arrelPlegada().appendChild(document.createElement('header'));
  barra.className = 'bar-black';
  render(createElement(TitolAmfitrio, { nomPoble: 'Gent de la Torre' }), { container: barra });
  const titolBarra = barra.querySelector('p.sdp-amfitrio-titol');
  expect(titolBarra.parentElement).toBe(barra);
  expect(titolBarra.matches(selector)).toBe(true);

  const arrelCataleg = arrelPlegada();
  render(createElement(MemoryRouter, null, createElement(EspecimenShell)), { container: arrelCataleg });
  const titolMostra = arrelCataleg.querySelector('.sdp-amfitrio-mostra > p.sdp-amfitrio-titol');
  expect(titolMostra).not.toBeNull();
  // La mostra sí que viu dins d'una arrel plegada: la negativa no és buida.
  expect(titolMostra.matches('.sdp-root.sidebar-closed .sdp-amfitrio-titol')).toBe(true);
  expect(titolMostra.matches(selector)).toBe(false);
});
