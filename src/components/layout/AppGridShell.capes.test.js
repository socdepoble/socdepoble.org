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
