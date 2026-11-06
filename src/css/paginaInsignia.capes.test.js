// @vitest-environment node
/* P0-27 (IDEA-102) · El quadrat de la fila .sdp-pagina-insignia: la base
   .sp-card-calendar-badge (float: right; margin-left/-bottom) viu a
   components.css, capa `components`, que guanya a tota regla de la capa
   `legacy` (layout.css) sigui quina sigui l'especificitat. L'anul·lació ha de
   viure, doncs, a la capa `components` i després de la base (mesurat a Chrome
   sense interfície: dins de layout.css el quadrat quedava a 16 px de l'esquerra). */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';

const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const net = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/* La pila de preludis oberts davant de la primera aparició de `selector {`. */
function pilaDe(css, selector) {
  const text = net(css);
  const posicio = text.indexOf(`${selector} {`);
  if (posicio < 0) return null;
  const pila = [];
  let preludi = '';
  for (let i = 0; i < posicio; i += 1) {
    const c = text[i];
    if (c === '{') { pila.push(preludi.trim()); preludi = ''; }
    else if (c === '}') { pila.pop(); preludi = ''; }
    else if (c === ';') preludi = '';
    else preludi += c;
  }
  return pila;
}

test('P0-27 · l’anul·lació del float i dels marges del quadrat és a la capa components, després de la base', () => {
  const components = llig('src/css/components.css');
  expect(pilaDe(components, '.sdp-pagina-insignia > .sp-card-calendar-badge')).toEqual(['@layer components']);
  const text = net(components);
  expect(text.indexOf('.sdp-pagina-insignia > .sp-card-calendar-badge {')).toBeGreaterThan(text.indexOf('\n.sp-card-calendar-badge {'));
  expect(text).toMatch(/\.sdp-pagina-insignia > \.sp-card-calendar-badge \{\s*float: none;\s*margin: 0;/);
});

test('P0-27 · layout.css (capa legacy) no torna a posar el float ni el marge al quadrat de la fila', () => {
  expect(net(llig('src/css/layout.css'))).not.toMatch(/\.sdp-pagina-insignia > \.sp-card-calendar-badge/);
});
