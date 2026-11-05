import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';

/* D-B4-3 (Onada R6, Bloc 4; decisió de MarIA) · El span.sdp-sr-only (la marca
   NomesPerALectors de l'editor) es veu dins de .ProseMirror i continua amagat a
   la lectura pública. jsdom no resol la cascada: es comproven els fulls i
   l'ordre de les capes. */

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(resolve(ARREL, ruta), 'utf8');
const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
/** Les declaracions de la primera regla amb el selector exacte `selector`. */
function declaracions(css, selector) {
  const escapat = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const trobada = new RegExp(`(?:^|[}\\s])${escapat}\\s*\\{([^}]*)\\}`).exec(css);
  return trobada ? trobada[1].replace(/\s+/g, ' ').trim() : null;
}

const MODULS = senseComentaris(llig('src/css/modules.css'));
const BASE = senseComentaris(llig('src/css/base.css'));
const INDEX = senseComentaris(llig('src/css/index.css'));

test('dins de l’editor, el text per a lectors es veu: cap retall, mida natural, en el flux', () => {
  const regla = declaracions(MODULS, '.ProseMirror .sdp-sr-only');
  expect(regla).not.toBeNull();
  for (const decl of ['position: static;', 'width: auto;', 'height: auto;', 'overflow: visible;', 'clip: auto;', 'clip-path: none;', 'white-space: normal;']) {
    expect(regla, decl).toContain(decl);
  }
  // Discret i sense cap color ni mida de lletra nous (fonts ≥ 16 px, cap color cru).
  expect(regla).not.toMatch(/(?:^|\s)(?:color|font-size|background)\s*:/);
  expect(regla).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i);
});

test('la regla de l’editor viu a la capa components, que guanya la legacy de base.css', () => {
  const posicio = MODULS.indexOf('.ProseMirror .sdp-sr-only');
  const capa = MODULS.slice(0, posicio).match(/@layer\s+([a-z]+)\s*\{/g)?.pop();
  expect(capa).toMatch(/@layer\s+components/);
  const ordre = /@layer\s+([a-z,\s]+);/.exec(INDEX)?.[1].split(',').map((nom) => nom.trim());
  expect(ordre.indexOf('components')).toBeGreaterThan(ordre.indexOf('legacy'));
});

test('a la lectura pública continua amagat, i només .ProseMirror el mostra', () => {
  const base = declaracions(BASE, '.sr-only, .sdp-sr-only');
  expect(base).toContain('position: absolute;');
  expect(base).toContain('clip: rect(0, 0, 0, 0);');
  // Cap altra regla de modules.css no torna a mostrar .sdp-sr-only fora de l'editor.
  const selectors = [...MODULS.matchAll(/([^{}]*\.sdp-sr-only[^{}]*)\{/g)].map(([, selector]) => selector.trim());
  expect(selectors).toEqual(['.ProseMirror .sdp-sr-only']);
});
