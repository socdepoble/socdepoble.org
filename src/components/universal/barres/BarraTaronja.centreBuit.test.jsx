import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
vi.mock('../../../config/assetResolver', () => ({ resolveAsset: (uri) => uri }));
import { BarraTaronja } from './BarraTaronja.jsx';

/* Correcció de l'Onada 6 (QA visual, 375×812: l'autoria es tallava a 100px
   amb uns 100px lliures fins a la data; «Gent de la Torre» 127/100, «La
   Torre de les Maçanes» 157/100, «Titular sense configurar» 190/100 a la
   Gestoria) · En lectura sense emoticona l'espai central és buit: la barra
   ho diu amb data-centre="buit" i, només llavors, l'autoria pren l'ample que
   deixa la data. Amb emoticona o en edició, la graella de T51 de sempre.
   jsdom no pinta: es comprova el DOM que la CSS necessita i la regla escrita.
   Verificat al navegador a 375: els tres noms es veuen sencers i la data no
   es mou. */
afterEach(cleanup);

const AUTORIA = { authorName: 'Gent de la Torre', authorLocation: 'La Torre de les Maçanes' };
const barra = (props = {}) => render(<BarraTaronja {...AUTORIA} {...props} />).container.querySelector('section.bar-orange');

test('lectura sense emoticona: data-centre="buit"; amb emoticona o en edició, sense l’atribut', () => {
  expect(barra().getAttribute('data-centre')).toBe('buit');
  cleanup();
  expect(barra({ emoticona: '   ' }).getAttribute('data-centre')).toBe('buit');
  cleanup();
  expect(barra({ emoticona: '🍅' }).hasAttribute('data-centre')).toBe(false);
  cleanup();
  expect(barra({ onObriEmoticona: () => {} }).hasAttribute('data-centre')).toBe(false);
  cleanup();
  expect(barra({ emoticona: '🍅', onObriEmoticona: () => {} }).hasAttribute('data-centre')).toBe(false);
});

test('l’atribut no canvia la classe ni els fills de la barra', () => {
  const seccio = barra();
  expect(seccio.className).toBe('bar-orange');
  expect([...seccio.children].map((e) => e.className))
    .toEqual(['sp-card-author', 'sdp-emoticona-barra sdp-emoticona-barra--buida', 'bar-actions']);
});

const net = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
const T51 = 'section.bar-orange { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(max-content, 1fr); }';
const BUIT = 'section.bar-orange[data-centre="buit"] { grid-template-columns: minmax(0, 1fr) auto max-content; }';
const AUTOR = 'section.bar-orange[data-centre="buit"] > .sp-card-author { justify-self: start; max-width: 100%; }';

test('sense centre, les accions fan el seu contingut i l’autoria la resta; la graella de T51 continua intacta', () => {
  const components = net('src/css/components.css');
  expect(components).toContain(T51);
  expect(components).toContain(BUIT);
  expect(components).toContain(AUTOR);
  // Darrere de la regla de T51 i dins de la mateixa @layer components.
  expect(components.indexOf(BUIT)).toBeGreaterThan(components.indexOf(T51));
  const abans = components.slice(0, components.indexOf(BUIT));
  const tram = abans.slice(abans.lastIndexOf('@layer components {'));
  expect(abans.lastIndexOf('@layer components {')).toBeGreaterThan(-1);
  expect(tram.split('{').length - tram.split('}').length).toBe(1);
  expect(components).toContain('.bar-orange > .bar-actions { grid-column: 3; justify-self: end; }');
});
