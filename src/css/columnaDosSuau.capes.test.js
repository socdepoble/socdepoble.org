// @vitest-environment node
/* Gauntlet R22, ronda 3 (regressió del crític sobre UniversalWorkspace.jsx) · El COMMIT 5 va llevar el
   behavior de scrollIntoView a l'efecte que porta la fila activa de la Columna 2 a la vista («mana el
   scroll-behavior del CSS»), però cap regla no donava scroll-behavior al contenidor que es desplaça
   (.sdp-workspace-column__body): una tria que arribava de fora saltava de colp per a tothom.
   jsdom no pinta ni resol capes: es llig la regla escrita, sense comentaris, amb els blocs que la contenen.
   El contracte: el JavaScript no tria el moviment; la Columna 2, dins de @layer components, es desplaça
   suau, i amb moviment reduït torna a «auto» (també dins de la capa), a banda de l'apagador global de base.css.
   Ronda 4 (crític) · NOMÉS la Columna 2: el suau va al modificador .sdp-workspace-column__body--llista, que
   només porta el cos de la llista de UniversalWorkspace. La classe compartida (la navegació de la Columna 1,
   les vistes del Xat, ClosCaXat…) no té cap scroll-behavior. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';

const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** Regles fulla: { prelud, cos, pares } (pares: els blocs que la contenen, de fora cap a dins). */
function regles(css) {
  const eixida = [];
  const pila = [];
  let tros = '';
  for (const c of senseComentaris(css)) {
    if (c === '{') {
      if (pila.length) pila[pila.length - 1].fills = true;
      pila.push({ prelud: tros.split(';').pop().trim().replace(/\s+/g, ' '), fills: false });
      tros = '';
    } else if (c === '}') {
      const marc = pila.pop();
      if (marc && !marc.fills) eixida.push({ prelud: marc.prelud, cos: tros.replace(/\s+/g, ' ').trim(), pares: pila.map((p) => p.prelud) });
      tros = '';
    } else {
      tros += c;
    }
  }
  return eixida;
}

const declaracions = (cos) => cos.split(';').map((d) => d.trim()).filter((d) => d.includes(':'))
  .map((d) => [d.slice(0, d.indexOf(':')).trim(), d.slice(d.indexOf(':') + 1).trim()]);

const COS_COMPARTIT = '.sdp-workspace-column__body';
const COLUMNA_2 = '.sdp-workspace-column__body--llista';
const REDUIT = '@media (prefers-reduced-motion: reduce)';
const FULLS = ['src/css/base.css', 'src/css/layout.css', 'src/css/components.css', 'src/css/modules.css', 'src/css/utilities.css', 'src/css/sdp.css'];

test('l’efecte de la Columna 2 no tria el moviment: crida scrollIntoView sense behavior i sense cap consulta de mitjans', () => {
  const workspace = senseComentaris(llig('src/components/universal/workspace/UniversalWorkspace.jsx'));
  expect(workspace).toMatch(/\n\s*fila\.scrollIntoView\(\{ block: 'nearest' \}\);\n/);
  expect(workspace).not.toMatch(/scrollIntoView\(\{[^}]*behavior/);
  expect(workspace).not.toMatch(/matchMedia|prefers-reduced-motion/);
});

test('la Columna 2 es desplaça suau dins de @layer components, i amb moviment reduït torna a auto dins de la mateixa capa', () => {
  const modul = regles(llig('src/css/modules.css'));
  const suau = modul.filter((r) => r.prelud === COLUMNA_2 && r.pares.join(' | ') === '@layer components'
    && declaracions(r.cos).some(([p, v]) => p === 'scroll-behavior' && v === 'smooth'));
  expect(suau).toHaveLength(1);
  const reduit = modul.filter((r) => r.prelud === COLUMNA_2 && r.pares.join(' | ') === `@layer components | ${REDUIT}`);
  expect(reduit.map((r) => declaracions(r.cos))).toEqual([[['scroll-behavior', 'auto']]]);
  // El modificador va amb el contenidor que es desplaça: la classe compartida és la que el fa scroller.
  const cos = modul.filter((r) => r.prelud === COS_COMPARTIT && r.pares.join(' | ') === '@layer components');
  expect(cos).toHaveLength(1);
  expect(declaracions(cos[0].cos)).toEqual(expect.arrayContaining([['overflow-y', 'auto']]));
});

test('ronda 4 · el modificador només el porta el cos de la Columna 2 de UniversalWorkspace, amb la classe compartida', () => {
  const workspace = senseComentaris(llig('src/components/universal/workspace/UniversalWorkspace.jsx'));
  expect(workspace.match(/sdp-workspace-column__body--llista/g)).toHaveLength(1);
  expect(workspace).toMatch(/className="sdp-workspace-column__body sdp-workspace-column__body--llista"/);
  // L'efecte de la Columna 2 continua trobant el contenidor per la classe compartida.
  expect(workspace).toMatch(/llista\.closest\('\.sdp-workspace-column__body'\)/);
  // La Columna 1 i les vistes del Xat porten només la classe compartida.
  for (const ruta of ['src/sections/xat/XatSection.jsx', 'src/sections/xat/components/ClosCaXat.jsx', 'src/sections/xat/components/VistaComunitats.jsx']) {
    expect(llig(ruta), ruta).not.toMatch(/sdp-workspace-column__body--llista/);
  }
});

test('cap altra regla dels fulls no dona scroll-behavior a la Columna 2 ni a la classe compartida, i l’apagador global de base.css continua', () => {
  const altres = FULLS.flatMap((ruta) => regles(llig(ruta)).map((r) => ({ ...r, ruta })))
    .filter((r) => r.prelud.split(',').some((s) => /\.sdp-workspace-column__body(?![\w-])|\.sdp-workspace-column__body--llista/.test(s)))
    .filter((r) => declaracions(r.cos).some(([p]) => p === 'scroll-behavior'));
  expect(altres.every((r) => r.prelud === COLUMNA_2), altres.map((r) => r.prelud).join(' · ')).toBe(true);
  expect(altres.map((r) => `${r.ruta} · ${r.pares.join(' | ')}`)).toEqual([
    'src/css/modules.css · @layer components',
    `src/css/modules.css · @layer components | ${REDUIT}`
  ]);
  expect(senseComentaris(llig('src/css/base.css'))).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{\s*\*,\s*\*::before,\s*\*::after\s*\{[^}]*scroll-behavior: auto !important;/);
});
