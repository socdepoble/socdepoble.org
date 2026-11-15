import React, { useRef } from 'react';
import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  ATRIBUT_TECLAT,
  ATRIBUT_TECLAT_VV,
  VAR_VV_ALT,
  campEditableEnfocat,
  useTeclatVirtual,
} from './useTeclatVirtual.js';

function ArrelDeProva({ encastada = false }) {
  const ref = useRef(null);
  useTeclatVirtual(ref, !encastada);
  if (encastada) {
    return (
      <div data-host="wordpress">
        <div ref={ref} className="sdp-root is-compact" data-testid="arrel">
          <textarea data-testid="camp" />
          <input type="checkbox" data-testid="casella" />
        </div>
      </div>
    );
  }
  return (
    <div ref={ref} className="sdp-root is-compact" data-testid="arrel">
      <div
        data-testid="visor"
        className="app-main__content"
      >
        <textarea data-testid="camp" />
        <input type="checkbox" data-testid="casella" />
        <div contentEditable="true" className="ProseMirror" data-testid="editor" />
      </div>
    </div>
  );
}

function creaVisualViewportMock(inicial = { height: 852, offsetTop: 0, scale: 1 }) {
  const oients = new Map();
  const estat = { ...inicial };
  return {
    get height() { return estat.height; },
    set height(v) { estat.height = v; },
    get offsetTop() { return estat.offsetTop; },
    set offsetTop(v) { estat.offsetTop = v; },
    get scale() { return estat.scale; },
    set scale(v) { estat.scale = v; },
    addEventListener(tipus, fn) {
      if (!oients.has(tipus)) oients.set(tipus, new Set());
      oients.get(tipus).add(fn);
    },
    removeEventListener(tipus, fn) {
      oients.get(tipus)?.delete(fn);
    },
    dispara(tipus) {
      for (const fn of oients.get(tipus) || []) fn();
    },
  };
}

describe('Onada R28 · useTeclatVirtual (iOS WKWebView + Android Edge-to-Edge)', () => {
  const vvOriginal = window.visualViewport;
  const innerHeightOriginal = window.innerHeight;
  const innerWidthOriginal = window.innerWidth;
  const rafOriginal = window.requestAnimationFrame;
  const cafOriginal = window.cancelAnimationFrame;

  beforeEach(() => {
    /* Onada R28 · Arrel buida amb l'API del DOM (la Porta InnerHTML no admet cap assignació d'HTML cru). */
    const arrel = document.createElement('div');
    arrel.id = 'root';
    document.body.replaceChildren(arrel);
    Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 393 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: 852 });
    window.requestAnimationFrame = (cb) => { cb(0); return 1; };
    window.cancelAnimationFrame = () => {};
  });

  afterEach(() => {
    Object.defineProperty(window, 'visualViewport', { configurable: true, writable: true, value: vvOriginal });
    Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: innerHeightOriginal });
    Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: innerWidthOriginal });
    window.requestAnimationFrame = rafOriginal;
    window.cancelAnimationFrame = cafOriginal;
    vi.restoreAllMocks();
  });

  test('iOS WKWebView: quan visualViewport s’encongix amb un camp enfocat, ajusta --teclat-vv-alt i marca data-sdp-teclat="obert"', () => {
    const vv = creaVisualViewportMock({ height: 852, offsetTop: 0, scale: 1 });
    Object.defineProperty(window, 'visualViewport', { configurable: true, writable: true, value: vv });

    const contenidor = document.getElementById('root');
    const { getByTestId, unmount } = render(<ArrelDeProva />, { container: contenidor });
    const arrel = getByTestId('arrel');
    const camp = getByTestId('camp');

    expect(arrel.hasAttribute(ATRIBUT_TECLAT)).toBe(false);

    act(() => {
      camp.focus();
      vv.height = 516;
      vv.dispara('resize');
    });

    expect(arrel.getAttribute(ATRIBUT_TECLAT)).toBe('obert');
    expect(arrel.hasAttribute(ATRIBUT_TECLAT_VV)).toBe(true);
    expect(arrel.style.getPropertyValue(VAR_VV_ALT)).toBe('516px');

    /* Si l'usuari fa zoom amb dos dits (scale > 1.05, WCAG 1.4.4), es desactiva l'ajust d'alçada. */
    act(() => {
      vv.scale = 1.5;
      vv.dispara('resize');
    });
    expect(arrel.hasAttribute(ATRIBUT_TECLAT)).toBe(false);
    expect(arrel.style.getPropertyValue(VAR_VV_ALT)).toBe('');

    /* Torna a escala 1 i es tanca el teclat. */
    act(() => {
      vv.scale = 1;
      vv.height = 852;
      camp.blur();
      vv.dispara('resize');
    });
    expect(arrel.hasAttribute(ATRIBUT_TECLAT)).toBe(false);
    unmount();
  });

  test('iOS 27 real (iPhone 18 Pro): WebKit desplaça el visor (offsetTop) i retalla innerHeight; la closca es retalla igualment i el document torna a dalt', () => {
    /* Mesures preses amb el Web Inspector al simulador: el visor visual baixa a 478 px, s'ha desplaçat
       396 px i innerHeight mostra 478 px (874 − 396); en tornar a dalt, innerHeight torna a 874. */
    const vv = creaVisualViewportMock({ height: 874, offsetTop: 0, scale: 1 });
    Object.defineProperty(window, 'visualViewport', { configurable: true, writable: true, value: vv });
    Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 402 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: 874 });
    const scrollYOriginal = Object.getOwnPropertyDescriptor(window, 'scrollY');
    Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 0 });
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => { window.scrollY = 0; });

    try {
      const contenidor = document.getElementById('root');
      const { getByTestId, unmount } = render(<ArrelDeProva />, { container: contenidor });
      const arrel = getByTestId('arrel');
      const camp = getByTestId('camp');

      act(() => {
        camp.focus();
        window.innerHeight = 478;
        window.scrollY = 396;
        vv.height = 478;
        vv.offsetTop = 396;
        vv.dispara('resize');
      });

      expect(arrel.getAttribute(ATRIBUT_TECLAT)).toBe('obert');
      expect(arrel.hasAttribute(ATRIBUT_TECLAT_VV)).toBe(true);
      expect(arrel.style.getPropertyValue(VAR_VV_ALT)).toBe('478px');
      expect(scrollTo).toHaveBeenCalledWith(0, 0);

      /* Després del retorn a dalt, WebKit torna innerHeight a 874 i offsetTop a 0: l'estat es manté. */
      act(() => {
        window.innerHeight = 874;
        vv.offsetTop = 0;
        vv.dispara('scroll');
      });
      expect(arrel.hasAttribute(ATRIBUT_TECLAT_VV)).toBe(true);
      expect(arrel.style.getPropertyValue(VAR_VV_ALT)).toBe('478px');
      unmount();
    } finally {
      if (scrollYOriginal) Object.defineProperty(window, 'scrollY', scrollYOriginal);
    }
  });

  test('iOS 27 real: l’avís de scroll que arriba amb offsetTop 0 i innerHeight encara retallat no desfà el retall (el contenidor de l’arrel mana)', () => {
    /* La carrera observada al simulador: després de scrollTo(0, 0), WebKit avisa amb offsetTop 0 i
       innerHeight encara a 478. El contenidor de l'arrel continua a 874 (el teclat d'iOS no l'encongix). */
    const vv = creaVisualViewportMock({ height: 874, offsetTop: 0, scale: 1 });
    Object.defineProperty(window, 'visualViewport', { configurable: true, writable: true, value: vv });
    Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 402 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: 874 });
    const contenidor = document.getElementById('root');
    Object.defineProperty(contenidor, 'clientHeight', { configurable: true, get: () => 874 });
    const scrollYOriginal = Object.getOwnPropertyDescriptor(window, 'scrollY');
    Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 0 });
    vi.spyOn(window, 'scrollTo').mockImplementation(() => { window.scrollY = 0; });

    try {
      const { getByTestId, unmount } = render(<ArrelDeProva />, { container: contenidor });
      const arrel = getByTestId('arrel');
      const camp = getByTestId('camp');

      act(() => {
        camp.focus();
        window.innerHeight = 478;
        vv.height = 478;
        vv.offsetTop = 0;
        vv.dispara('scroll');
      });

      expect(arrel.getAttribute(ATRIBUT_TECLAT)).toBe('obert');
      expect(arrel.hasAttribute(ATRIBUT_TECLAT_VV)).toBe(true);
      expect(arrel.style.getPropertyValue(VAR_VV_ALT)).toBe('478px');
      unmount();
    } finally {
      if (scrollYOriginal) Object.defineProperty(window, 'scrollY', scrollYOriginal);
    }
  });

  test('Notes: amb el teclat obert, el cursor d’un editor ric llarg queda a la vista dins del seu visor', () => {
    const vv = creaVisualViewportMock({ height: 852, offsetTop: 0, scale: 1 });
    Object.defineProperty(window, 'visualViewport', { configurable: true, writable: true, value: vv });

    const contenidor = document.getElementById('root');
    const { getByTestId, unmount } = render(<ArrelDeProva />, { container: contenidor });
    const visor = getByTestId('visor');
    const editor = getByTestId('editor');
    editor.tabIndex = 0;
    editor.appendChild(document.createTextNode('text de la nota'));
    visor.style.overflowY = 'auto';
    Object.defineProperty(visor, 'scrollHeight', { configurable: true, value: 4000 });
    Object.defineProperty(visor, 'clientHeight', { configurable: true, value: 400 });
    visor.getBoundingClientRect = () => ({ top: 126, bottom: 516, height: 390, left: 0, right: 393, width: 393 });
    editor.getBoundingClientRect = () => ({ top: -900, bottom: 3000, height: 3900, left: 0, right: 393, width: 393 });
    vi.spyOn(window, 'getSelection').mockReturnValue({
      rangeCount: 1,
      getRangeAt: () => ({
        endContainer: editor.firstChild,
        getClientRects: () => [{ top: 700, bottom: 724, height: 24 }],
      }),
    });

    act(() => {
      editor.focus();
      vv.height = 516;
      vv.dispara('resize');
    });

    /* 724 + 16 de marge − 516 de vora inferior del visor = 224 px de desplaçament intern. */
    expect(visor.scrollTop).toBe(224);
    unmount();
  });

  test('Android Edge-to-Edge: si baixa innerHeight >= 120px amb un camp enfocat, amaga nav.mobile-nav sense forçar --teclat-vv-alt', () => {
    const vv = creaVisualViewportMock({ height: 800, offsetTop: 0, scale: 1 });
    Object.defineProperty(window, 'visualViewport', { configurable: true, writable: true, value: vv });
    Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 360 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: 800 });

    const contenidor = document.getElementById('root');
    const { getByTestId } = render(<ArrelDeProva />, { container: contenidor });
    const arrel = getByTestId('arrel');
    const camp = getByTestId('camp');

    act(() => {
      camp.focus();
      window.innerHeight = 490;
      vv.height = 490;
      window.dispatchEvent(new Event('resize'));
    });

    expect(arrel.getAttribute(ATRIBUT_TECLAT)).toBe('obert');
    expect(arrel.hasAttribute(ATRIBUT_TECLAT_VV)).toBe(false);
  });

  test('ignora controls no textuals (checkbox) i instàncies incrustades fora de #root', () => {
    const vv = creaVisualViewportMock({ height: 500, offsetTop: 0, scale: 1 });
    Object.defineProperty(window, 'visualViewport', { configurable: true, writable: true, value: vv });

    const contenidor = document.getElementById('root');
    const { getByTestId, unmount } = render(<ArrelDeProva />, { container: contenidor });
    const arrel = getByTestId('arrel');
    const casella = getByTestId('casella');
    const editor = getByTestId('editor');

    expect(campEditableEnfocat(casella, arrel)).toBeNull();
    expect(campEditableEnfocat(editor, arrel)).toBe(editor);
    unmount();

    const extern = document.createElement('div');
    document.body.appendChild(extern);
    const encastat = render(<ArrelDeProva encastada />, { container: extern });
    const arrelEncastada = encastat.getByTestId('arrel');
    const campEncastat = encastat.getByTestId('camp');

    act(() => {
      campEncastat.focus();
      vv.dispara('resize');
    });
    expect(arrelEncastada.hasAttribute(ATRIBUT_TECLAT)).toBe(false);
    encastat.unmount();
    extern.remove();
  });

  test('funciona dins del ShadowRoot de <soc-de-poble> quan amaDelDocument és true i s’apaga quan és false', () => {
    const vv = creaVisualViewportMock({ height: 852, offsetTop: 0, scale: 1 });
    Object.defineProperty(window, 'visualViewport', { configurable: true, writable: true, value: vv });

    const hostPropi = document.createElement('div');
    document.body.appendChild(hostPropi);
    const shadowPropi = hostPropi.attachShadow({ mode: 'open' });
    const propi = render(<ArrelDeProva encastada={false} />, { container: shadowPropi });
    const arrelPropia = propi.getByTestId('arrel');
    const campPropi = propi.getByTestId('camp');

    act(() => {
      campPropi.focus();
      vv.height = 516;
      vv.dispara('resize');
    });
    expect(arrelPropia.getAttribute(ATRIBUT_TECLAT)).toBe('obert');
    expect(arrelPropia.style.getPropertyValue(VAR_VV_ALT)).toBe('516px');
    propi.unmount();
    hostPropi.remove();

    const hostAlie = document.createElement('div');
    document.body.appendChild(hostAlie);
    const shadowAlie = hostAlie.attachShadow({ mode: 'open' });
    const alie = render(<ArrelDeProva encastada />, { container: shadowAlie });
    const arrelAliena = alie.getByTestId('arrel');
    const campAlie = alie.getByTestId('camp');

    act(() => {
      campAlie.focus();
      vv.height = 516;
      vv.dispara('resize');
    });
    expect(arrelAliena.hasAttribute(ATRIBUT_TECLAT)).toBe(false);
    alie.unmount();
    hostAlie.remove();
  });
});
