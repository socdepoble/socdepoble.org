// @vitest-environment node
/* T7 (P2) · Prova de capes: les xifres de punt de tall i de plegat que la
   CSS i App.jsx encara escriuen a mà han de ser les de graella.js, la font
   única. La CSS no pot importar JS; esta prova és el lligam. Si un número
   canvia en un lloc, la prova diu en quin altre l'has de seguir.
   Es llig el text sense comentaris: un comentari no pinta res. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { PUNTS_DE_TALL } from './graella.js';

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
    /* Cap altre tall de consulta que no siga el d'estret o el de mòbil estret (480). */
    expect([...new Set(talls)].sort((a, b) => a - b)).toEqual([480, estret]);
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
