/* Onada 11 (261010; prompt 261010_1730, tasca 2) · EstilDelPoble: sense estil
   desat no toca el DOM (Llei del Píxel); amb estil, aplica el full sobre la
   .sdp-root de la instància (del targetNode o del document) i el lleva quan
   l'estil se'n va o el component es desmunta. aplicaEstil real (recurs
   <style> en jsdom). */
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({ core: { personalitzacio: null } }));
vi.mock('./contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => m.core }));

import { EstilDelPoble, arrelDelPoble } from './EstilDelPoble.jsx';
import { teEstilAplicat } from '../config/aplicaEstil.js';

const ESTIL = { payload: { v: 1, tokens: { '--sdp-radi-s': '12px' }, crom: null }, versio: 3 };
const fulls = (arrel = document) => arrel.querySelectorAll('style[data-sdp-estil]');

afterEach(() => {
  cleanup();
  m.core = { personalitzacio: null };
  fulls().forEach((n) => n.remove());
  document.body.innerHTML = '';
});

function Arrel({ children }) {
  return <div className="sdp-root">{children}</div>;
}

test('sense estil desat: cap node, cap <style>, cap propietat; el DOM de l’arrel és idèntic', () => {
  for (const personalitzacio of [null, { taxonomia: null, estil: null }, { estil: { payload: null, versio: 0 } }]) {
    m.core = { personalitzacio };
    const { container, unmount } = render(<Arrel><EstilDelPoble /></Arrel>);
    const arrel = container.firstElementChild;
    expect(arrel.outerHTML).toBe('<div class="sdp-root"></div>');
    expect(fulls()).toHaveLength(0);
    expect(arrel.getAttribute('style')).toBeNull();
    unmount();
  }
});

test('amb estil desat: un full amb el CSS a l’arrel del document; se’n va amb l’estil i amb el desmuntatge', () => {
  m.core = { personalitzacio: { taxonomia: null, estil: ESTIL } };
  const { container, rerender, unmount } = render(<Arrel><EstilDelPoble /></Arrel>);
  expect(container.firstElementChild.outerHTML).toBe('<div class="sdp-root"></div>');
  expect(fulls()).toHaveLength(1);
  expect(fulls()[0].textContent).toContain('  --sdp-radi-s: 12px;');

  m.core = { personalitzacio: { taxonomia: null, estil: { payload: { v: 1, tokens: { '--sdp-radi-m': '16px' }, crom: null }, versio: 4 } } };
  rerender(<Arrel><EstilDelPoble /></Arrel>);
  expect(fulls()).toHaveLength(1);
  expect(fulls()[0].textContent).toContain('--sdp-radi-m: 16px');
  expect(fulls()[0].textContent).not.toContain('--sdp-radi-s');

  m.core = { personalitzacio: { taxonomia: null, estil: null } };
  rerender(<Arrel><EstilDelPoble /></Arrel>);
  expect(fulls()).toHaveLength(0);

  m.core = { personalitzacio: { taxonomia: null, estil: ESTIL } };
  rerender(<Arrel><EstilDelPoble /></Arrel>);
  expect(fulls()).toHaveLength(1);
  unmount();
  expect(fulls()).toHaveLength(0);
});

test('amb targetNode (el shadow root de l’encastat), el full va dins del shadow root', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const ombra = host.attachShadow({ mode: 'open' });
  const arrel = document.createElement('div');
  arrel.className = 'sdp-root';
  ombra.appendChild(arrel);
  m.core = { personalitzacio: { estil: ESTIL } };
  const { unmount } = render(<EstilDelPoble targetNode={ombra} />);
  expect(fulls(document)).toHaveLength(0);
  expect(fulls(ombra)).toHaveLength(1);
  unmount();
  expect(fulls(ombra)).toHaveLength(0);
});

test('encastat: dues .sdp-root niades dins de l’ombra (punt de muntatge > AppShell); l’estil va a la interior, la que closest dona des de dins', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const ombra = host.attachShadow({ mode: 'open' });
  const exterior = document.createElement('div');
  exterior.className = 'sdp-root';
  const interior = document.createElement('div');
  interior.className = 'sdp-root';
  exterior.appendChild(interior);
  ombra.appendChild(exterior);
  const node = document.createElement('button');
  interior.appendChild(node);
  expect(arrelDelPoble(ombra)).toBe(interior);
  expect(node.closest('.sdp-root')).toBe(interior);   // el que fan PanellCrom, FacetaEstil i Dialeg
  m.core = { personalitzacio: { estil: { payload: { v: 1, tokens: { '--sdp-radi-s': '12px' }, crom: { to: 30 } }, versio: 1 } } };
  const { unmount } = render(<EstilDelPoble targetNode={ombra} />);
  expect(teEstilAplicat(interior)).toBe(true);
  expect(teEstilAplicat(exterior)).toBe(false);
  expect(exterior.getAttribute('style')).toBeNull();   // el crom en línia no toca el punt de muntatge
  expect(fulls(ombra)).toHaveLength(1);
  unmount();
  expect(teEstilAplicat(interior)).toBe(false);
  expect(fulls(ombra)).toHaveLength(0);
});

test('sense cap .sdp-root a l’abast no s’escriu res', () => {
  m.core = { personalitzacio: { estil: ESTIL } };
  render(<EstilDelPoble />);
  expect(fulls()).toHaveLength(0);
});

test('arrelDelPoble: primer dins del targetNode, després el document, sempre la més interior, i null sense res', () => {
  expect(arrelDelPoble(null)).toBeNull();
  const propia = document.createElement('div');
  propia.className = 'sdp-root';
  document.body.appendChild(propia);
  expect(arrelDelPoble()).toBe(propia);
  const contenidor = document.createElement('div');
  const dins = document.createElement('div');
  dins.className = 'sdp-root';
  contenidor.appendChild(dins);
  expect(arrelDelPoble(contenidor)).toBe(dins);
  expect(arrelDelPoble({})).toBe(propia);
  /* La SPA: <body class="sdp-root"> (index.html:78) amb la .sdp-root d'AppShell dins. */
  document.body.classList.add('sdp-root');
  expect(arrelDelPoble()).toBe(propia);
  document.body.classList.remove('sdp-root');
  const niada = document.createElement('div');
  niada.className = 'sdp-root';
  propia.appendChild(niada);
  expect(arrelDelPoble()).toBe(niada);
  expect(arrelDelPoble(document.body)).toBe(niada);
});
