import React, { useRef } from 'react';
import { act, render, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { useTeclatVirtual, ATRIBUT_TECLAT, VAR_VV_ALT } from './useTeclatVirtual.js';

let vv, frames, nextFrame;
function view({ owned = true } = {}) {
  function Fixture() {
    const ref = useRef(null);
    useTeclatVirtual(ref, owned);
    return <div ref={ref} className="sdp-root is-compact" data-testid="root"><div data-testid="scroll"><textarea data-testid="input"/><input type="checkbox" data-testid="check"/></div></div>;
  }
  const ui = render(<Fixture/>);
  return { ...ui, root: ui.getByTestId('root'), input: ui.getByTestId('input'), scroll: ui.getByTestId('scroll') };
}
function tick() { act(() => { const batch = [...frames.values()]; frames.clear(); for (const cb of batch) cb(0); }); }
function resize(height, { inner = false, width } = {}) {
  vv.height = height;
  if (inner) window.innerHeight = height;
  if (width) window.innerWidth = width;
  act(() => { if (inner || width) window.dispatchEvent(new Event('resize')); vv.dispatchEvent(new Event('resize')); });
  tick();
}
beforeEach(() => {
  frames = new Map(); nextFrame = 0;
  vv = new EventTarget(); Object.assign(vv, { height: 800, offsetTop: 0, scale: 1 });
  vi.stubGlobal('visualViewport', vv); vi.stubGlobal('innerWidth', 360); vi.stubGlobal('innerHeight', 800);
  vi.stubGlobal('requestAnimationFrame', cb => { const id = ++nextFrame; frames.set(id, cb); return id; });
  vi.stubGlobal('cancelAnimationFrame', id => frames.delete(id));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

test('resize sense focus actualitza repòs: enfocar després no inventa un teclat', () => {
  const ui = view();
  resize(560, { inner: true });
  expect(ui.root.hasAttribute(ATRIBUT_TECLAT)).toBe(false);
  act(() => ui.input.focus()); tick();
  expect(ui.root.hasAttribute(ATRIBUT_TECLAT)).toBe(false);
});
test('visor horitzontal de 153px no es clampa a 180px davall del teclat', () => {
  window.innerWidth = 667; window.innerHeight = 375; vv.height = 375;
  const ui = view(); act(() => ui.input.focus()); tick();
  resize(153);
  expect(ui.root.getAttribute(ATRIBUT_TECLAT)).toBe('obert');
  expect(ui.root.style.getPropertyValue(VAR_VV_ALT)).toBe('153px');
});
test('animació VV no cancel·la per sempre la revelació del camp', () => {
  const ui = view();
  vi.spyOn(window, 'getComputedStyle').mockImplementation(node => ({ overflowY: node === ui.scroll ? 'auto' : 'visible' }));
  Object.defineProperties(ui.scroll, { scrollHeight: { configurable: true, value: 800 }, clientHeight: { configurable: true, value: 300 } });
  ui.scroll.getBoundingClientRect = () => ({ top: 0, bottom: 300, height: 300 });
  ui.input.getBoundingClientRect = () => ({ top: 400, bottom: 440, height: 40 });
  act(() => ui.input.focus()); tick();
  resize(500); // actualitza programa revelació per al frame següent.
  resize(480); // un resize de l'animació arriba abans d'eixe frame.
  tick();
  expect(ui.scroll.scrollTop).toBeGreaterThan(0);
});
test('sense focus, zoom i arrel no pròpia no s’activen', () => {
  const ui = view(); resize(480);
  expect(ui.root.hasAttribute(ATRIBUT_TECLAT)).toBe(false);
  vv.scale = 1.5; act(() => ui.input.focus()); tick();
  expect(ui.root.hasAttribute(ATRIBUT_TECLAT)).toBe(false);
  ui.unmount(); vv.scale = 1; const alien = view({ owned: false });
  act(() => alien.input.focus()); tick();
  expect(alien.root.hasAttribute(ATRIBUT_TECLAT)).toBe(false);
});
test('Android iOS i retorn de teclat continuen funcionant', () => {
  const ui = view(); act(() => ui.input.focus()); tick();
  resize(480, { inner: true }); expect(ui.root.getAttribute(ATRIBUT_TECLAT)).toBe('obert');
  resize(800, { inner: true }); expect(ui.root.hasAttribute(ATRIBUT_TECLAT)).toBe(false);
  resize(500); expect(ui.root.style.getPropertyValue(VAR_VV_ALT)).toBe('500px');
  act(() => ui.input.blur()); tick(); expect(ui.root.hasAttribute(ATRIBUT_TECLAT)).toBe(false);
});
test('blur breu sense resize conserva repòs per al camp següent', () => {
  const ui = view(); act(() => ui.input.focus()); tick(); resize(480, { inner: true });
  act(() => ui.input.blur()); tick(); expect(ui.root.hasAttribute(ATRIBUT_TECLAT)).toBe(false);
  act(() => ui.input.focus()); tick(); expect(ui.root.getAttribute(ATRIBUT_TECLAT)).toBe('obert');
});
test('canviar de camp amb teclat obert també revela el nou destí', () => {
  const ui = view(); const other = document.createElement('textarea'); ui.scroll.appendChild(other);
  vi.spyOn(window, 'getComputedStyle').mockImplementation(node => ({ overflowY: node === ui.scroll ? 'auto' : 'visible' }));
  Object.defineProperties(ui.scroll, { scrollHeight: { configurable: true, value: 800 }, clientHeight: { configurable: true, value: 300 } });
  ui.scroll.getBoundingClientRect = () => ({ top: 0, bottom: 300, height: 300 });
  ui.input.getBoundingClientRect = () => ({ top: 20, bottom: 60, height: 40 });
  other.getBoundingClientRect = () => ({ top: 400, bottom: 440, height: 40 });
  act(() => ui.input.focus()); tick(); resize(480); tick(); expect(ui.scroll.scrollTop).toBe(0);
  act(() => other.focus()); tick(); tick(); expect(ui.scroll.scrollTop).toBeGreaterThan(0);
});
test('desmuntar cancel·la els frames pendents i restaura els atributs', () => {
  const ui = view(); act(() => ui.input.focus()); tick(); resize(480);
  expect(frames.size).toBeGreaterThan(0); ui.unmount();
  expect(frames.size).toBe(0); expect(ui.root.hasAttribute(ATRIBUT_TECLAT)).toBe(false);
  expect(ui.root.style.getPropertyValue(VAR_VV_ALT)).toBe('');
});
test('rotar sense focus reinicia repòs i no inventa teclat', () => {
  const ui = view(); resize(375, { inner: true, width: 667 });
  act(() => ui.input.focus()); tick(); expect(ui.root.hasAttribute(ATRIBUT_TECLAT)).toBe(false);
});
/* Onada R29 · R29-HOOKS-02 · En Android el WebView s'encongix amb el teclat:
   girar (o canviar d'amplada) amb el teclat obert prenia l'alçada encongida com
   a repòs, l'oclusió quedava a 0 i nav.mobile-nav tornava damunt del camp. */
test('R29 · Android: girar amb el teclat obert conserva «obert»; tancar-lo fixa el repòs real i reobrir-lo torna', () => {
  const ui = view(); act(() => ui.input.focus()); tick();
  resize(480, { inner: true }); expect(ui.root.getAttribute(ATRIBUT_TECLAT)).toBe('obert');
  resize(160, { inner: true, width: 800 });
  expect(document.activeElement).toBe(ui.input);
  expect(ui.root.getAttribute(ATRIBUT_TECLAT)).toBe('obert');
  resize(360, { inner: true }); expect(ui.root.hasAttribute(ATRIBUT_TECLAT)).toBe(false);
  resize(160, { inner: true }); expect(ui.root.getAttribute(ATRIBUT_TECLAT)).toBe('obert');
});
test('R29 · Android: el gir en dos fotogrames (inset vell i definitiu) també conserva «obert»', () => {
  const ui = view(); act(() => ui.input.focus()); tick();
  resize(480, { inner: true });
  resize(100, { inner: true, width: 800 }); expect(ui.root.getAttribute(ATRIBUT_TECLAT)).toBe('obert');
  resize(160, { inner: true }); expect(ui.root.getAttribute(ATRIBUT_TECLAT)).toBe('obert');
  // Blur i teclat tancat (resize sense camp): el repòs real torna a manar.
  act(() => ui.input.blur()); tick(); resize(360, { inner: true });
  act(() => ui.input.focus()); tick(); expect(ui.root.hasAttribute(ATRIBUT_TECLAT)).toBe(false);
});
