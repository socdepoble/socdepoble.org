/* Onada R28 · css-diferit-01 (revisió adversarial) · fullDiferit.js amb jsdom, sobre el model
   d'aplicaEstil.test.js. Vitest torna buit tot .css?inline (el bloc test de vite.config.js no té cap
   opció css), així que les proves dels adoptants no arriben mai a l'adopció: ací es crida
   adoptaFullDiferit amb un CSS no buit i es munta un adoptant real amb el seu ?inline doblat.
   · el recurs <style data-sdp-full-diferit> (jsdom no té adoptedStyleSheets): al final del shadow root
     de la peça o, per a una peça del document, al final del <head>;
   · el camí adoptat, amb un doble de CSSStyleSheet: darrere dels existents i a l'arrel de la peça;
   · una adopció per arrel i clau, i dues arrels, dos fulls;
   · un amfitrió que trenca adoptedStyleSheets o que no el desa cau al recurs (css-diferit-03);
   · un text nou per a la mateixa arrel i clau reescriu el mateix full o <style> (css-diferit-02). */
import { createElement, useRef } from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

const doble = vi.hoisted(() => ({ selector: '.sdp-selector-opcions{margin:0}' }));
vi.mock('../css/diferit-selector-opcions.css?inline', () => ({ default: doble.selector }));

import { adoptaFullDiferit, useFullDiferit } from './fullDiferit.js';
import { SelectorOpcionsDesplegable } from '../components/PedraSeca/molecules/SelectorOpcionsDesplegable.jsx';

const CSS_A = '.sdp-prova{padding:1px}';
const CSS_B = '.sdp-prova{padding:2px}';

const recursos = (arrel) => Array.from(arrel.querySelectorAll('style[data-sdp-full-diferit]'));

/* Un document propi per prova: el WeakMap del mòdul recorda cada arrel, i el document global és el
   mateix en tot el fitxer. */
const documentNou = () => document.implementation.createHTMLDocument('prova');

function ombraNova(doc = document) {
  const host = doc.createElement('div');
  doc.body.appendChild(host);
  return host.attachShadow({ mode: 'open' });
}

function pecaA(contenidor) {
  const doc = contenidor.ownerDocument || contenidor;
  const peca = doc.createElement('div');
  contenidor.appendChild(peca);
  return peca;
}

/* L'arrel de <soc-de-poble>: el <style data-sdp-fallback> del full principal al començament i
   l'.sdp-root amb la peça dins. */
function ombraDeSocDePoble(doc = document) {
  const ombra = ombraNova(doc);
  const principal = doc.createElement('style');
  principal.setAttribute('data-sdp-fallback', '');
  ombra.appendChild(principal);
  const punt = pecaA(ombra);
  punt.className = 'sdp-root';
  return { ombra, peca: pecaA(punt) };
}

class FullDoble {
  replaceSync(css) {
    this.css = css;
    this.escriptures = (this.escriptures || 0) + 1;
  }
}

/* adoptedStyleSheets simulat sobre un document o un shadow root de jsdom. */
function fesAdoptable(contenidor, existents = []) {
  vi.stubGlobal('CSSStyleSheet', FullDoble);
  let llista = [...existents];
  Object.defineProperty(contenidor, 'adoptedStyleSheets', {
    configurable: true,
    get: () => llista,
    set: (nova) => { llista = Array.from(nova); },
  });
  return () => llista;
}

afterEach(() => {
  cleanup();
  document.head.querySelectorAll('style[data-sdp-full-diferit], style[data-prova]').forEach((node) => node.remove());
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

describe('recurs <style data-sdp-full-diferit> (jsdom: sense adoptedStyleSheets)', () => {
  test('dins d’un shadow root, el full va al final del shadow root i no al <head>', () => {
    const { ombra, peca } = ombraDeSocDePoble();
    expect('adoptedStyleSheets' in ombra).toBe(false);   // precondició: el camí de jsdom és el recurs
    expect(adoptaFullDiferit(peca, 'selector-opcions', CSS_A)).toBe(true);
    const [node] = recursos(ombra);
    expect(recursos(ombra)).toHaveLength(1);
    expect(node.parentNode).toBe(ombra);
    expect(ombra.lastElementChild).toBe(node);
    expect(node.getAttribute('data-sdp-full-diferit')).toBe('selector-opcions');
    expect(node.textContent).toBe(CSS_A);
    expect(recursos(document.head)).toHaveLength(0);
  });

  test('per a una peça del document, el full va al final del <head>', () => {
    expect('adoptedStyleSheets' in document).toBe(false);   // precondició: el camí de jsdom és el recurs
    const previ = document.createElement('style');
    previ.setAttribute('data-prova', '');
    document.head.appendChild(previ);
    const peca = pecaA(document.body);
    expect(adoptaFullDiferit(peca, 'prova-head', CSS_A)).toBe(true);
    const [node] = recursos(document.head);
    expect(recursos(document.head)).toHaveLength(1);
    expect(document.head.lastElementChild).toBe(node);
    expect(node.textContent).toBe(CSS_A);
    expect(recursos(document.body)).toHaveLength(0);
  });

  test('una sola adopció per arrel i clau; dues claus, dos fulls en l’ordre de muntatge', () => {
    const doc = documentNou();
    expect(adoptaFullDiferit(pecaA(doc.body), 'especimens', CSS_A)).toBe(true);
    expect(adoptaFullDiferit(pecaA(doc.body), 'especimens', CSS_A)).toBe(false);
    expect(recursos(doc.head)).toHaveLength(1);
    expect(adoptaFullDiferit(pecaA(doc.body), 'barra-veu', CSS_B)).toBe(true);
    expect(recursos(doc.head).map((node) => node.getAttribute('data-sdp-full-diferit'))).toEqual(['especimens', 'barra-veu']);
  });

  test('dues arrels, dos fulls: cada shadow root i el document tenen el seu', () => {
    const doc = documentNou();
    const a = ombraNova(doc);
    const b = ombraNova(doc);
    expect(adoptaFullDiferit(pecaA(a), 'barra-veu', CSS_A)).toBe(true);
    expect(adoptaFullDiferit(pecaA(b), 'barra-veu', CSS_A)).toBe(true);
    expect(adoptaFullDiferit(pecaA(doc.body), 'barra-veu', CSS_A)).toBe(true);
    expect(recursos(a)).toHaveLength(1);
    expect(recursos(b)).toHaveLength(1);
    expect(recursos(doc.head)).toHaveLength(1);
    expect(recursos(a)[0]).not.toBe(recursos(b)[0]);
  });

  test('css-diferit-02 · un text nou per a la mateixa arrel i clau reescriu el mateix <style>', () => {
    const doc = documentNou();
    expect(adoptaFullDiferit(pecaA(doc.body), 'refranyer', CSS_A)).toBe(true);
    const [node] = recursos(doc.head);
    expect(adoptaFullDiferit(pecaA(doc.body), 'refranyer', CSS_B)).toBe(false);
    expect(recursos(doc.head)).toEqual([node]);
    expect(node.textContent).toBe(CSS_B);
  });

  test('un <style> de recurs que ja hi era no es duplica i passa a dur el text d’ara', () => {
    const doc = documentNou();
    const vell = doc.createElement('style');
    vell.setAttribute('data-sdp-full-diferit', 'joc-parla');
    vell.textContent = CSS_A;
    doc.head.appendChild(vell);
    expect(adoptaFullDiferit(pecaA(doc.body), 'joc-parla', CSS_B)).toBe(true);
    expect(recursos(doc.head)).toEqual([vell]);
    expect(vell.textContent).toBe(CSS_B);
  });
});

describe('camí adoptat (adoptedStyleSheets + replaceSync)', () => {
  test('el full s’afig darrere dels existents de l’arrel de la peça, i no al document', () => {
    const doc = documentNou();
    const delDocument = fesAdoptable(doc);
    const { ombra, peca } = ombraDeSocDePoble(doc);
    const principal = new FullDoble();
    const deLOmbra = fesAdoptable(ombra, [principal]);
    expect(adoptaFullDiferit(peca, 'especimens', CSS_A)).toBe(true);
    expect(deLOmbra()).toHaveLength(2);
    expect(deLOmbra()[0]).toBe(principal);
    expect(deLOmbra()[1]).toBeInstanceOf(FullDoble);
    expect(deLOmbra()[1].css).toBe(CSS_A);
    expect(delDocument()).toHaveLength(0);
    expect(recursos(ombra)).toHaveLength(0);
    expect(recursos(doc.head)).toHaveLength(0);
  });

  test('una adopció per arrel i clau, i dues arrels, dos fulls', () => {
    const doc = documentNou();
    const a = ombraNova(doc);
    const b = ombraNova(doc);
    const deA = fesAdoptable(a);
    const deB = fesAdoptable(b);
    expect(adoptaFullDiferit(pecaA(a), 'selector-opcions', CSS_A)).toBe(true);
    expect(adoptaFullDiferit(pecaA(a), 'selector-opcions', CSS_A)).toBe(false);
    expect(adoptaFullDiferit(pecaA(b), 'selector-opcions', CSS_A)).toBe(true);
    expect(deA()).toHaveLength(1);
    expect(deB()).toHaveLength(1);
    expect(deA()[0]).not.toBe(deB()[0]);
  });

  test('css-diferit-02 · un text nou reescriu el mateix full amb replaceSync i no n’afig cap altre', () => {
    const ombra = ombraNova(documentNou());
    const llista = fesAdoptable(ombra);
    const peca = pecaA(ombra);
    expect(adoptaFullDiferit(peca, 'barra-veu', CSS_A)).toBe(true);
    const [full] = llista();
    expect(adoptaFullDiferit(peca, 'barra-veu', CSS_A)).toBe(false);
    expect(full.escriptures).toBe(1);   // el mateix text: cap escriptura
    expect(adoptaFullDiferit(peca, 'barra-veu', CSS_B)).toBe(false);
    expect(llista()).toEqual([full]);
    expect(full.css).toBe(CSS_B);
    expect(full.escriptures).toBe(2);
  });

  test('si el setter llança, cau al <style> de recurs, al final del shadow root', () => {
    const { ombra, peca } = ombraDeSocDePoble(documentNou());
    vi.stubGlobal('CSSStyleSheet', FullDoble);
    const principal = new FullDoble();
    Object.defineProperty(ombra, 'adoptedStyleSheets', {
      configurable: true,
      get: () => [principal],
      set: () => { throw new Error('amfitrió hostil'); },
    });
    expect(adoptaFullDiferit(peca, 'especimens', CSS_A)).toBe(true);
    expect(recursos(ombra)).toHaveLength(1);
    expect(ombra.lastElementChild).toBe(recursos(ombra)[0]);
    expect(recursos(ombra)[0].textContent).toBe(CSS_A);
    expect(adoptaFullDiferit(peca, 'especimens', CSS_A)).toBe(false);
    expect(recursos(ombra)).toHaveLength(1);
  });

  test('si el getter llança, també cau al <style> de recurs', () => {
    const ombra = ombraNova(documentNou());
    vi.stubGlobal('CSSStyleSheet', FullDoble);
    Object.defineProperty(ombra, 'adoptedStyleSheets', {
      configurable: true,
      get: () => { throw new Error('amfitrió hostil'); },
    });
    expect(adoptaFullDiferit(pecaA(ombra), 'refranyer', CSS_A)).toBe(true);
    expect(recursos(ombra)).toHaveLength(1);
    expect(recursos(ombra)[0].textContent).toBe(CSS_A);
  });

  test('css-diferit-03 · un setter mut (ni llança ni desa) cau al <style> de recurs i no es perd', () => {
    const { ombra, peca } = ombraDeSocDePoble(documentNou());
    vi.stubGlobal('CSSStyleSheet', FullDoble);
    Object.defineProperty(ombra, 'adoptedStyleSheets', {
      configurable: true,
      get: () => [],
      set: () => {},
    });
    expect(adoptaFullDiferit(peca, 'barra-veu', CSS_A)).toBe(true);
    expect(ombra.adoptedStyleSheets).toHaveLength(0);
    const [node] = recursos(ombra);
    expect(recursos(ombra)).toHaveLength(1);
    expect(ombra.lastElementChild).toBe(node);
    expect(node.textContent).toBe(CSS_A);
    expect(adoptaFullDiferit(peca, 'barra-veu', CSS_B)).toBe(false);
    expect(recursos(ombra)).toEqual([node]);
    expect(node.textContent).toBe(CSS_B);
  });
});

describe('Llei del Píxel · sense peça, clau o CSS no es toca res', () => {
  const CASOS = [
    ['sense peça', () => null, 'k', CSS_A],
    ['sense clau', (doc) => pecaA(doc.body), '', CSS_A],
    ['CSS buit (el que dona Vitest per a un ?inline)', (doc) => pecaA(doc.body), 'k', ''],
    ['CSS absent', (doc) => pecaA(doc.body), 'k', undefined],
    ['CSS que no és text', (doc) => pecaA(doc.body), 'k', 42],
  ];
  test.each(CASOS)('%s: torna false i el DOM és idèntic', (_nom, peca, clau, css) => {
    const doc = documentNou();
    const llista = fesAdoptable(doc);
    const element = peca(doc);
    const abans = doc.documentElement.outerHTML;
    expect(adoptaFullDiferit(element, clau, css)).toBe(false);
    expect(doc.documentElement.outerHTML).toBe(abans);
    expect(llista()).toHaveLength(0);
  });
});

describe('useFullDiferit i un adoptant real', () => {
  function contenidorA(ombra) {
    const contenidor = ombra.ownerDocument.createElement('div');
    ombra.appendChild(contenidor);
    return contenidor;
  }

  function Peca({ visible }) {
    const ref = useRef(null);
    useFullDiferit(ref, 'peca', CSS_A);
    return visible ? createElement('div', { ref, className: 'sdp-peca' }) : null;
  }

  test('una peça que primer torna null rep el full quan es pinta, a l’arrel on es munta', () => {
    const ombra = ombraNova();
    const { rerender } = render(createElement(Peca, { visible: false }), { container: contenidorA(ombra) });
    expect(recursos(ombra)).toHaveLength(0);
    rerender(createElement(Peca, { visible: true }));
    expect(recursos(ombra)).toHaveLength(1);
    expect(recursos(ombra)[0].textContent).toBe(CSS_A);
    rerender(createElement(Peca, { visible: true }));
    expect(recursos(ombra)).toHaveLength(1);
    expect(recursos(document.head)).toHaveLength(0);
  });

  const SELECTOR = {
    llegenda: 'Tria',
    opcions: [{ id: 'a', titol: 'Una', explicacio: 'La primera.' }, { id: 'b', titol: 'Dues', explicacio: 'La segona.' }],
    valor: 'a',
    onCanvi: () => {},
  };

  test('SelectorOpcionsDesplegable adopta el seu full en muntar-se dins del shadow root, i no al <head>', () => {
    const ombra = ombraNova();
    render(createElement(SelectorOpcionsDesplegable, SELECTOR), { container: contenidorA(ombra) });
    expect(ombra.querySelector('fieldset.sdp-selector-opcions')).not.toBeNull();
    const node = ombra.querySelector('style[data-sdp-full-diferit="selector-opcions"]');
    expect(node).not.toBeNull();
    expect(node.textContent).toBe(doble.selector);
    expect(ombra.lastElementChild).toBe(node);
    expect(recursos(document.head)).toHaveLength(0);
  });

  test('SelectorOpcionsDesplegable amb adoptedStyleSheets: el full va a l’arrel del shadow root', () => {
    const ombra = ombraNova();
    const llista = fesAdoptable(ombra);
    render(createElement(SelectorOpcionsDesplegable, SELECTOR), { container: contenidorA(ombra) });
    expect(llista()).toHaveLength(1);
    expect(llista()[0].css).toBe(doble.selector);
    expect(recursos(ombra)).toHaveLength(0);
    expect(recursos(document.head)).toHaveLength(0);
  });
});
