/* Onada 11 (261010; prompt 261010_1730, tasca 2) · aplicaEstil.js amb jsdom:
   el recurs <style data-sdp-estil> (jsdom no té adoptedStyleSheets ni
   replaceSync), el camí adoptat amb un doble de CSSStyleSheet, el crom
   (crom.js doblat: ací es prova QUAN es crida, no el gir) i la Llei del Píxel
   (un payload sense res vàlid no toca el DOM). */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cssDePersonalitzacio } from './estil.js';

const crom = vi.hoisted(() => ({ aplica: vi.fn(), restaura: vi.fn() }));
vi.mock('./crom.js', () => ({ aplica: (...a) => crom.aplica(...a), restaura: (...a) => crom.restaura(...a) }));

import { aplicaEstil, llevaEstil, teEstilAplicat } from './aplicaEstil.js';

const PAYLOAD = { v: 1, tokens: { '--sdp-radi-s': '12px', '--sdp-fons-app': '#ffffff' }, crom: null };
const ALTRE = { v: 1, tokens: { '--sdp-radi-m': '16px' }, crom: null };
const AMB_CROM = { v: 1, tokens: {}, crom: { to: 30 } };

const fulls = (arrel = document) => arrel.querySelectorAll('style[data-sdp-estil]');

function arrelNova(contenidor = document.body) {
  const div = document.createElement('div');
  div.className = 'sdp-root';
  contenidor.appendChild(div);
  return div;
}

beforeEach(() => { crom.aplica.mockReset(); crom.restaura.mockReset(); });
afterEach(() => {
  fulls().forEach((n) => n.remove());
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

describe('recurs <style data-sdp-estil> (jsdom: sense adoptedStyleSheets)', () => {
  test('UN full al final del <head>, amb el CSS de la personalització; actualitzar-lo no en crea un altre', () => {
    const arrel = arrelNova();
    aplicaEstil(arrel, PAYLOAD);
    expect(fulls()).toHaveLength(1);
    const node = fulls()[0];
    expect(node.parentNode).toBe(document.head);
    expect(document.head.lastElementChild).toBe(node);
    expect(node.textContent).toBe(cssDePersonalitzacio(PAYLOAD));
    expect(teEstilAplicat(arrel)).toBe(true);

    aplicaEstil(arrel, ALTRE);
    expect(fulls()).toHaveLength(1);
    expect(fulls()[0]).toBe(node);
    expect(node.textContent).toBe(cssDePersonalitzacio(ALTRE));
    expect(node.textContent).not.toContain('--sdp-fons-app');
  });

  test('llevaEstil trau el full i oblida l’arrel', () => {
    const arrel = arrelNova();
    aplicaEstil(arrel, PAYLOAD);
    llevaEstil(arrel);
    expect(fulls()).toHaveLength(0);
    expect(teEstilAplicat(arrel)).toBe(false);
    expect(crom.restaura).not.toHaveBeenCalled();   // no s'havia aplicat cap gir
    llevaEstil(arrel);   // idempotent
    llevaEstil(null);
  });

  test('passar d’un payload amb tokens a un sense cap de vàlid també trau el full', () => {
    const arrel = arrelNova();
    aplicaEstil(arrel, PAYLOAD);
    aplicaEstil(arrel, { v: 1, tokens: { '--sdp-fons-app': 'red' }, crom: null });
    expect(fulls()).toHaveLength(0);
    expect(teEstilAplicat(arrel)).toBe(false);
  });

  test('dins d’un shadow root, el full va al final del shadow root i no al <head>', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const ombra = host.attachShadow({ mode: 'open' });
    const arrel = arrelNova(ombra);
    aplicaEstil(arrel, PAYLOAD);
    expect(fulls(document)).toHaveLength(0);
    expect(fulls(ombra)).toHaveLength(1);
    expect(ombra.lastElementChild).toBe(fulls(ombra)[0]);
    llevaEstil(arrel);
    expect(fulls(ombra)).toHaveLength(0);
  });

  test('dues arrels, dos fulls independents', () => {
    const a = arrelNova();
    const b = arrelNova();
    aplicaEstil(a, PAYLOAD);
    aplicaEstil(b, ALTRE);
    expect(fulls()).toHaveLength(2);
    llevaEstil(a);
    expect(fulls()).toHaveLength(1);
    expect(fulls()[0].textContent).toBe(cssDePersonalitzacio(ALTRE));
    llevaEstil(b);
  });
});

describe('Llei del Píxel', () => {
  test.each([null, undefined, {}, { v: 1, tokens: {}, crom: null }, { v: 1, tokens: { '--sdp-pedra-900': '#ffffff' } }, { v: 1, tokens: {}, crom: { to: 0 } }])(
    'amb %j no s’afig cap full, cap <style> ni cap propietat, i el DOM és idèntic', (payload) => {
      const arrel = arrelNova();
      const abans = document.documentElement.outerHTML;
      aplicaEstil(arrel, payload);
      expect(document.documentElement.outerHTML).toBe(abans);
      expect(arrel.getAttribute('style')).toBeNull();
      expect(teEstilAplicat(arrel)).toBe(false);
      expect(crom.aplica).not.toHaveBeenCalled();
      expect(crom.restaura).not.toHaveBeenCalled();
    }
  );

  test('sense arrel no passa res', () => {
    aplicaEstil(null, PAYLOAD);
    aplicaEstil(undefined, PAYLOAD);
    expect(fulls()).toHaveLength(0);
  });
});

describe('crom', () => {
  test('un gir vàlid s’aplica amb crom.aplica(arrel, to); tornar a null el restaura una sola vegada', () => {
    const arrel = arrelNova();
    aplicaEstil(arrel, AMB_CROM);
    expect(crom.aplica).toHaveBeenCalledWith(arrel, 30);
    expect(fulls()).toHaveLength(0);   // cap token: cap full
    expect(teEstilAplicat(arrel)).toBe(true);
    aplicaEstil(arrel, { ...AMB_CROM, crom: { to: -15 } });
    expect(crom.aplica).toHaveBeenLastCalledWith(arrel, -15);
    aplicaEstil(arrel, PAYLOAD);
    expect(crom.restaura).toHaveBeenCalledTimes(1);
    aplicaEstil(arrel, PAYLOAD);
    expect(crom.restaura).toHaveBeenCalledTimes(1);
    llevaEstil(arrel);
  });

  test('un crom invàlid (fora de rang, no numèric) no gira res', () => {
    const arrel = arrelNova();
    aplicaEstil(arrel, { v: 1, tokens: {}, crom: { to: 200 } });
    aplicaEstil(arrel, { v: 1, tokens: {}, crom: { to: 'x' } });
    expect(crom.aplica).not.toHaveBeenCalled();
  });

  test('llevaEstil restaura el crom si s’havia girat', () => {
    const arrel = arrelNova();
    aplicaEstil(arrel, { ...PAYLOAD, crom: { to: 45 } });
    expect(fulls()).toHaveLength(1);
    llevaEstil(arrel);
    expect(crom.restaura).toHaveBeenCalledTimes(1);
    expect(fulls()).toHaveLength(0);
  });
});

describe('camí adoptat (adoptedStyleSheets + replaceSync)', () => {
  class FullDoble { replaceSync(css) { this.css = css; } }

  function arrelAdoptable() {
    vi.stubGlobal('CSSStyleSheet', FullDoble);
    const existent = new FullDoble();
    const contenidor = { nodeType: 11, adoptedStyleSheets: [existent] };
    const arrel = arrelNova();
    arrel.getRootNode = () => contenidor;
    return { arrel, contenidor, existent };
  }

  test('el full s’afig darrere dels existents, s’actualitza in situ i no es crea cap <style>', () => {
    const { arrel, contenidor, existent } = arrelAdoptable();
    aplicaEstil(arrel, PAYLOAD);
    expect(contenidor.adoptedStyleSheets).toHaveLength(2);
    expect(contenidor.adoptedStyleSheets[0]).toBe(existent);
    const full = contenidor.adoptedStyleSheets[1];
    expect(full).toBeInstanceOf(FullDoble);
    expect(full.css).toBe(cssDePersonalitzacio(PAYLOAD));
    expect(fulls()).toHaveLength(0);

    aplicaEstil(arrel, ALTRE);
    expect(contenidor.adoptedStyleSheets).toHaveLength(2);
    expect(contenidor.adoptedStyleSheets[1]).toBe(full);
    expect(full.css).toBe(cssDePersonalitzacio(ALTRE));
  });

  test('llevaEstil el trau de la llista i deixa els altres', () => {
    const { arrel, contenidor, existent } = arrelAdoptable();
    aplicaEstil(arrel, PAYLOAD);
    llevaEstil(arrel);
    expect(contenidor.adoptedStyleSheets).toEqual([existent]);
    expect(teEstilAplicat(arrel)).toBe(false);
  });

  test('si l’amfitrió trenca adoptedStyleSheets, cau al recurs <style>', () => {
    const { arrel, contenidor } = arrelAdoptable();
    Object.defineProperty(contenidor, 'adoptedStyleSheets', { get: () => { throw new Error('amfitrió hostil'); } });
    aplicaEstil(arrel, PAYLOAD);
    expect(fulls()).toHaveLength(1);
    expect(fulls()[0].textContent).toBe(cssDePersonalitzacio(PAYLOAD));
    llevaEstil(arrel);
    expect(fulls()).toHaveLength(0);
  });
});
