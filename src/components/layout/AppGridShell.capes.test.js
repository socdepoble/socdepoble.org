import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';

/* jsdom no pinta ni apila: es comprova la regla. En «mitja» el panell esquerre
   llisca per damunt (z-index 30) i les barres sticky de la fitxa del Perfil
   (99090, 99080, 99070) el tapaven perquè compartien context d'apilament.
   La correcció viu al Perfil: el Bloc de Notes ha de quedar com a HEAD. */
const net = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
const graella = net('src/components/layout/AppGridShell.css');
const perfil = net('src/sections/profile/PerfilShell.css');

test('en «mitja» la columna dreta del Perfil té context d’apilament propi', () => {
  expect(perfil).toMatch(/\.perfil-espai \.app-grid-shell\[data-layout="mitja"\] \.app-grid-column--right,[^{]*\{ isolation: isolate; \}/);
  expect(graella).toMatch(/\.app-grid-shell\[data-layout="mitja"\] \.app-grid-column--left \{[^}]*z-index: 30;/);
});

test('la graella comuna no aïlla la columna dreta en «mitja»: Notes no canvia', () => {
  expect(graella).not.toContain('.app-grid-shell[data-layout="mitja"] .app-grid-column--right { isolation: isolate; }');
  expect(graella).toContain('.app-grid-shell[data-layout="estret"] .app-grid-column--right { z-index: 1; }');
});

/* Ordre del Mestre (261026_2126, pla 261026_1615 §6) · Els 12px entre
   l'Ordenar i el Crear els porta ara el Crear, el germà que el seguix (abans,
   un margin-right de l'Ordenar). Sense Crear (Disseny, el Bloc sense sessió),
   l'Ordenar no porta cap marge propi a l'extrem i toca el coixí de la fila. */
const reglesDe = (css) => css.split('}').filter((tros) => tros.includes('{')).map((tros) => {
  const obri = tros.lastIndexOf('{');
  return { selector: tros.slice(0, obri).split(/[{;]/).pop().trim(), cos: tros.slice(obri + 1).trim() };
});
const ES_ORDENAR = /\.sdp-workspace-sort-action(:[\w-]+(\([^)]*\))?)*$/;

test('§6 · el buit de 12px va davant del Crear que seguix l’Ordenar, i l’Ordenar no porta cap marge propi a l’extrem', () => {
  expect(graella).toContain('.sdp-workspace-sort-action + .app-grid-col-header__accio { margin-inline-start: var(--sdp-space-3); }');
  const moduls = net('src/css/modules.css');
  const delOrdenar = [...reglesDe(graella), ...reglesDe(moduls)]
    .filter(({ selector }) => selector.split(',').some((s) => ES_ORDENAR.test(s.trim())));
  expect(delOrdenar.filter(({ cos }) => /(^|;)\s*margin(-right|-inline-end|-inline)?\s*:/.test(cos))).toEqual([]);
});
