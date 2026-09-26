import React, { useRef } from 'react';
import { render, cleanup, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { usePullToRefresh, LLINDAR_PTR, RESISTENCIA_PTR } from './usePullToRefresh.js';

/*
 * Lliscar per recarregar amb esdeveniments tàctils sintètics. jsdom no fa
 * layout: el desplaçament d'un contenidor es simula definint-li scrollTop.
 * El fitxer és .js, per això el banc de proves usa createElement.
 */

const h = React.createElement;
const TEXTOS = { estirant: 'Estira', llest: 'Deixa anar', recarregant: 'Recarregant' };
/* Recorregut del dit que passa el llindar amb la resistència aplicada. */
const PASSAT = Math.ceil(LLINDAR_PTR / RESISTENCIA_PTR) + 10;

afterEach(() => cleanup());

function Banc({ onRecarrega }) {
  const superficie = useRef(null);
  const contingut = useRef(null);
  const indicador = useRef(null);
  usePullToRefresh({
    superficieRef: superficie,
    contingutRef: contingut,
    indicadorRef: indicador,
    textos: TEXTOS,
    onRecarrega
  });
  return h('main', { ref: superficie },
    h('div', { ref: indicador, role: 'status', 'data-testid': 'indicador' }),
    h('div', { ref: contingut, 'data-testid': 'contingut' },
      h('div', { 'data-testid': 'intern' }, h('p', { 'data-testid': 'objectiu' }, 'Una nota')),
      h('input', { 'data-testid': 'camp', 'aria-label': 'Camp' }),
      h('div', { 'data-testid': 'editable', contentEditable: true, suppressContentEditableWarning: true }, 'Editable'),
      h('div', { className: 'sdp-wiki-graf' }, h('span', { 'data-testid': 'graf' }, 'Graf')),
      h('dialog', { open: true }, h('p', { 'data-testid': 'dialeg' }, 'Diàleg'))
    )
  );
}

function toca(el, tipus, punts = []) {
  const ev = new Event(tipus, { bubbles: true, cancelable: true });
  Object.defineProperty(ev, 'touches', { value: punts.map(([x, y]) => ({ clientX: x, clientY: y })) });
  el.dispatchEvent(ev);
  return ev;
}

/* Un gest d'un sol dit: x0,y0 i després cada [dx, dy] relatiu. */
function estira(el, passos, { x0 = 100, y0 = 100 } = {}) {
  toca(el, 'touchstart', [[x0, y0]]);
  return passos.map(([dx, dy]) => toca(el, 'touchmove', [[x0 + dx, y0 + dy]]));
}

const indicador = () => screen.getByTestId('indicador');

test('a dalt de tot el gest s’arma, estira amb resistència i en deixar anar recarrega', () => {
  const onRecarrega = vi.fn();
  render(h(Banc, { onRecarrega }));
  const objectiu = screen.getByTestId('objectiu');
  expect(indicador().dataset.estat).toBe('repos');
  expect(indicador().textContent).toBe('');

  const [primer] = estira(objectiu, [[0, 40]]);
  expect(primer.defaultPrevented).toBe(true);
  expect(indicador().dataset.estat).toBe('estirant');
  expect(indicador().textContent).toBe('Estira');
  expect(screen.getByTestId('contingut').dataset.ptr).toBe('actiu');

  // Amb resistència, 120px de dit encara no arriben al llindar.
  toca(objectiu, 'touchmove', [[100, 220]]);
  expect(indicador().dataset.estat).toBe('estirant');

  toca(objectiu, 'touchmove', [[100, 100 + PASSAT]]);
  expect(indicador().dataset.estat).toBe('llest');
  expect(indicador().textContent).toBe('Deixa anar');

  toca(objectiu, 'touchend');
  expect(onRecarrega).toHaveBeenCalledTimes(1);
  expect(indicador().dataset.estat).toBe('recarregant');
  expect(indicador().textContent).toBe('Recarregant');
});

test('amb un contenidor intern desplaçat no s’arma ni bloqueja el scroll', () => {
  const onRecarrega = vi.fn();
  render(h(Banc, { onRecarrega }));
  Object.defineProperty(screen.getByTestId('intern'), 'scrollTop', { configurable: true, value: 1200 });

  const moviments = estira(screen.getByTestId('objectiu'), [[0, 40], [0, PASSAT]]);
  expect(moviments.some((ev) => ev.defaultPrevented)).toBe(false);
  expect(indicador().dataset.estat).toBe('repos');
  toca(screen.getByTestId('objectiu'), 'touchend');
  expect(onRecarrega).not.toHaveBeenCalled();
});

test('un xat invertit (column-reverse) a baix de tot té contingut per damunt: no s’arma', () => {
  const onRecarrega = vi.fn();
  render(h(Banc, { onRecarrega }));
  const intern = screen.getByTestId('intern');
  intern.style.display = 'flex';
  intern.style.flexDirection = 'column-reverse';
  intern.style.overflowY = 'auto';
  Object.defineProperty(intern, 'scrollHeight', { configurable: true, value: 2000 });
  Object.defineProperty(intern, 'clientHeight', { configurable: true, value: 500 });
  Object.defineProperty(intern, 'scrollTop', { configurable: true, value: 0 });

  estira(screen.getByTestId('objectiu'), [[0, PASSAT]]);
  toca(screen.getByTestId('objectiu'), 'touchend');
  expect(indicador().dataset.estat).toBe('repos');
  expect(onRecarrega).not.toHaveBeenCalled();
});

test.each(['camp', 'editable', 'graf', 'dialeg'])('dins de «%s» el gest no s’arma', (id) => {
  const onRecarrega = vi.fn();
  render(h(Banc, { onRecarrega }));
  estira(screen.getByTestId(id), [[0, PASSAT]]);
  toca(screen.getByTestId(id), 'touchend');
  expect(indicador().dataset.estat).toBe('repos');
  expect(onRecarrega).not.toHaveBeenCalled();
});

test('bloqueig de direcció: un gest horitzontal o cap amunt és del navegador fins al final', () => {
  const onRecarrega = vi.fn();
  render(h(Banc, { onRecarrega }));
  const objectiu = screen.getByTestId('objectiu');

  const horitzontal = estira(objectiu, [[60, 10], [60, PASSAT]]);
  expect(horitzontal.some((ev) => ev.defaultPrevented)).toBe(false);
  expect(indicador().dataset.estat).toBe('repos');
  toca(objectiu, 'touchend');

  const amunt = estira(objectiu, [[0, -30], [0, PASSAT]]);
  expect(amunt.some((ev) => ev.defaultPrevented)).toBe(false);
  toca(objectiu, 'touchend');
  expect(onRecarrega).not.toHaveBeenCalled();
});

test('dins del marge de decisió no es fa res; passat el marge, decidix', () => {
  render(h(Banc, { onRecarrega: vi.fn() }));
  const objectiu = screen.getByTestId('objectiu');
  const [curt] = estira(objectiu, [[0, 4]]);
  expect(curt.defaultPrevented).toBe(false);
  expect(indicador().dataset.estat).toBe('repos');
  expect(toca(objectiu, 'touchmove', [[100, 140]]).defaultPrevented).toBe(true);
  expect(indicador().dataset.estat).toBe('estirant');
});

test('touchcancel reinicia sense recarregar', () => {
  const onRecarrega = vi.fn();
  render(h(Banc, { onRecarrega }));
  const objectiu = screen.getByTestId('objectiu');
  estira(objectiu, [[0, PASSAT]]);
  expect(indicador().dataset.estat).toBe('llest');

  toca(objectiu, 'touchcancel');
  expect(indicador().dataset.estat).toBe('repos');
  expect(indicador().textContent).toBe('');
  expect(screen.getByTestId('contingut').style.transform).toBe('');
  toca(objectiu, 'touchend');
  expect(onRecarrega).not.toHaveBeenCalled();
});

test('un segon dit (zoom) desfà el gest', () => {
  const onRecarrega = vi.fn();
  render(h(Banc, { onRecarrega }));
  const objectiu = screen.getByTestId('objectiu');
  estira(objectiu, [[0, PASSAT]]);
  toca(objectiu, 'touchstart', [[100, 100 + PASSAT], [200, 200]]);
  expect(indicador().dataset.estat).toBe('repos');
  toca(objectiu, 'touchend');
  expect(onRecarrega).not.toHaveBeenCalled();
});

test('si no arriba al llindar, torna a repòs sense recarregar', () => {
  const onRecarrega = vi.fn();
  render(h(Banc, { onRecarrega }));
  const objectiu = screen.getByTestId('objectiu');
  estira(objectiu, [[0, 60]]);
  toca(objectiu, 'touchend');
  expect(indicador().dataset.estat).toBe('repos');
  expect(screen.getByTestId('contingut').dataset.ptr).toBe('solt');
  expect(onRecarrega).not.toHaveBeenCalled();
});

test('una recàrrega asíncrona torna l’indicador a repòs quan acaba', async () => {
  let acaba;
  const onRecarrega = vi.fn(() => new Promise((resol) => { acaba = resol; }));
  render(h(Banc, { onRecarrega }));
  const objectiu = screen.getByTestId('objectiu');
  estira(objectiu, [[0, PASSAT]]);
  toca(objectiu, 'touchend');
  expect(indicador().dataset.estat).toBe('recarregant');
  acaba();
  await Promise.resolve();
  await Promise.resolve();
  expect(indicador().dataset.estat).toBe('repos');
});

test('incrustat dins d’un ShadowRoot no s’activa', () => {
  const onRecarrega = vi.fn();
  const amfitrio = document.createElement('div');
  document.body.appendChild(amfitrio);
  const ombra = amfitrio.attachShadow({ mode: 'open' });
  const punt = document.createElement('div');
  ombra.appendChild(punt);
  const { unmount } = render(h(Banc, { onRecarrega }), { container: punt });

  const objectiu = ombra.querySelector('[data-testid="objectiu"]');
  const moviments = estira(objectiu, [[0, PASSAT]]);
  toca(objectiu, 'touchend');
  expect(moviments.some((ev) => ev.defaultPrevented)).toBe(false);
  expect(ombra.querySelector('[data-testid="indicador"]').hasAttribute('data-estat')).toBe(false);
  expect(onRecarrega).not.toHaveBeenCalled();
  unmount();
  amfitrio.remove();
});
