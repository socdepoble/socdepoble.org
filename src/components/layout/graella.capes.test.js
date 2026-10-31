// @vitest-environment node
/* T7 (P2) · Prova de capes: les xifres de punt de tall i de plegat que la
   CSS i App.jsx encara escriuen a mà han de ser les de graella.js, la font
   única. La CSS no pot importar JS; esta prova és el lligam. Si un número
   canvia en un lloc, la prova diu en quin altre l'has de seguir.
   Es llig el text sense comentaris: un comentari no pinta res. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { PUNTS_DE_TALL, midaDeGraella } from './graella.js';

const senseComentaris = (codi) => codi
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|\s)\/\/[^\n]*/g, '$1')
  .replace(/\s+/g, ' ');
const llig = (ruta) => senseComentaris(readFileSync(resolve(process.cwd(), ruta), 'utf8'));
const vegades = (text, tros) => text.split(tros).length - 1;

const { estret, plegada, detall, eines, compacte } = PUNTS_DE_TALL;

describe('AppGridShell.css', () => {
  const css = llig('src/components/layout/AppGridShell.css');

  test('el rail plegat és PUNTS_DE_TALL.plegada, declarat una sola vegada', () => {
    expect(css).toContain(`--app-grid-col-collapsed: ${plegada}px;`);
    expect(vegades(css, `${plegada}px`)).toBe(1);
  });

  test('en «mitja», el detall es queda amb PUNTS_DE_TALL.detall com a mínim', () => {
    expect(css).toContain(`calc(100% - ${detall}px)`);
    expect(css).toContain(`minmax(${detall}px, 1fr)`);
    expect(vegades(css, `${detall}px`)).toBe(2);
  });
});

describe('layout.css', () => {
  const css = llig('src/css/layout.css');

  test('la barra principal plegada fa l’amplària del rail del Workspace', () => {
    expect(css).toContain(`.sdp-root:not(.is-compact).sidebar-closed nav.app-sidebar { width: ${plegada}px; }`);
  });

  test('el tall de tauleta xicoteta és PUNTS_DE_TALL.estret, en contenidor i en la xarxa @media', () => {
    expect(css).toContain(`@container sdp-arrel (max-width: ${estret}px)`);
    expect(css).toContain(`@media (max-width: ${estret}px)`);
    const talls = [...css.matchAll(/max-width: (\d+)px\)/g)].map(([, n]) => Number(n));
    /* T4 (261004): les sis accions de la barra necessiten llevar el gap a
       400px. És un ajust de la barra, no un nou tall de les columnes. */
    expect([...new Set(talls)].sort((a, b) => a - b)).toEqual([400, 480, estret]);
    const barra = ':where(.sdp-root.is-compact) nav.mobile-nav { gap: 0; padding-inline: 0; justify-content: space-evenly; }';
    expect(css).toContain(`@container sdp-arrel (max-width: 400px) { ${barra} }`);
    expect(css).toContain(`@supports not (container-type: inline-size) { @media (max-width: 400px) { ${barra} } }`);
    expect(vegades(css, 'max-width: 400px)')).toBe(2);
  });

  /* Onada 5 (ordre del Mestre, 261008) · La barra inferior reparteix les
     cinc caselles en pistes d'ample igual de vora a vora. Abans s'apinyaven
     al centre amb un gap en vw i el defecte de 600px passava totes les
     portes: esta prova evita que una escombrada les torne a centrar. */
  test('la barra inferior compacta són cinc pistes iguals, sense gap en vw', () => {
    const inici = css.indexOf(':where(.sdp-root.is-compact) nav.mobile-nav {');
    expect(inici).toBeGreaterThan(-1);
    const regla = css.slice(inici, css.indexOf('}', inici));
    expect(regla).toContain('display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); justify-items: center;');
    expect(regla).toContain('gap: 0;');
    expect(regla).not.toContain('justify-content');
    expect(css).not.toContain('clamp(8px, 3vw, 24px)');
  });
});

describe('App.jsx (només lectura: el T7 no el toca)', () => {
  const app = llig('src/app/App.jsx');

  test('el calaix de la barra lateral talla a PUNTS_DE_TALL.compacte', () => {
    expect(app).toContain(`const AMPLE_MAXIM_COMPACTE = ${compacte};`);
  });

  test('data-sdp-estret talla a PUNTS_DE_TALL.estret', () => {
    expect(app).toContain(`ample <= ${estret}`);
  });
});

/* Decisió 1 del Mestre (30-10-2026 ~15:00: «> 720 px per a 3 columnes fixes
   i <= 720 px per a vista mòbil») · La CSS (max-width, que inclou el 720) i
   App.jsx (<=) tallen inclusiu; la mida de la closca, el mateix, amb i sense
   columnesFixes (el Workspace; el Xat i les apps). Abans, 720 justos eren
   «ample» o «mitja» amb la CSS ja en mòbil. */
describe('la frontera d’«estret» és la mateixa al JS i a la CSS', () => {
  test('a PUNTS_DE_TALL.estret és «estret» per a tots els consumidors; un píxel més, ja no', () => {
    expect(llig('src/css/layout.css')).toContain(`@media (max-width: ${estret}px)`);
    expect(llig('src/app/App.jsx')).toContain(`ample <= ${estret}`);
    for (const opcions of [{}, { columnesFixes: true }]) {
      expect([opcions, midaDeGraella(estret, {}, {}, opcions)]).toEqual([opcions, 'estret']);
      expect([opcions, midaDeGraella(estret + 1, {}, {}, opcions)]).not.toEqual([opcions, 'estret']);
    }
  });
});

describe('el JS no torna a escriure els números a mà', () => {
  test.each([
    'src/components/layout/AppGridShell.jsx',
    'src/components/universal/UniversalToolbar.jsx'
  ])('%s importa els talls de graella.js', (ruta) => {
    const codi = llig(ruta);
    expect(codi).toMatch(/from '\.{1,2}\/(?:layout\/)?graella\.js'/);
    const literals = [estret, PUNTS_DE_TALL.ample, plegada, detall, eines, compacte]
      .filter((n) => new RegExp(`(?:^|[^\\w.])${n}(?![\\w.])`).test(codi));
    expect(literals).toEqual([]);
  });
});
