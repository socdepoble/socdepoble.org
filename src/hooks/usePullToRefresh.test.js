import React, { useRef } from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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
      h('dialog', { open: true }, h('p', { 'data-testid': 'dialeg' }, 'Diàleg')),
      h('canvas', { 'data-testid': 'llenç' })
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

/* ── Encastat dins d'un ShadowRoot (<soc-de-poble>, Gent de la Torre) ──────
   Ordre del Mestre, 261004 11:11 · Deroga la prova «incrustat dins d'un
   ShadowRoot no s'activa»: ara s'activa i recarrega la pàgina, com el
   refresc natiu, però només amb la pàgina de l'amfitrió a dalt i amb
   <soc-de-poble> començant dins del viewport. L'ombra és tancada, com la de
   PedraSecaEmbed: la prova guarda la referència que torna attachShadow. */
function muntaEnOmbra(onRecarrega) {
  const amfitrio = document.createElement('soc-de-poble');
  document.body.appendChild(amfitrio);
  const ombra = amfitrio.attachShadow({ mode: 'closed' });
  const punt = document.createElement('div');
  ombra.appendChild(punt);
  const { unmount } = render(h(Banc, { onRecarrega }), { container: punt });
  const dins = (id) => ombra.querySelector(`[data-testid="${id}"]`);
  const desmunta = () => {
    unmount();
    amfitrio.remove();
  };
  return { amfitrio, ombra, dins, desmunta };
}

test('dins d’un ShadowRoot s’activa: un gest complet crida la recàrrega (ordre del Mestre, 261004)', () => {
  const onRecarrega = vi.fn();
  const { dins, desmunta } = muntaEnOmbra(onRecarrega);
  const objectiu = dins('objectiu');
  expect(dins('indicador').dataset.estat).toBe('repos');

  const moviments = estira(objectiu, [[0, 40], [0, PASSAT]]);
  expect(moviments.every((ev) => ev.defaultPrevented)).toBe(true);
  expect(dins('indicador').dataset.estat).toBe('llest');
  toca(objectiu, 'touchend');
  expect(onRecarrega).toHaveBeenCalledTimes(1);
  expect(dins('indicador').dataset.estat).toBe('recarregant');
  desmunta();
});

test('dins d’un ShadowRoot amb la pàgina de l’amfitrió desplaçada no s’arma', () => {
  const onRecarrega = vi.fn();
  const { dins, desmunta } = muntaEnOmbra(onRecarrega);
  // El scrollingElement és el de la pàgina del tema, no el de l'app.
  Object.defineProperty(document, 'scrollingElement', {
    configurable: true,
    value: { scrollTop: 300 }
  });
  try {
    const moviments = estira(dins('objectiu'), [[0, 40], [0, PASSAT]]);
    toca(dins('objectiu'), 'touchend');
    expect(moviments.some((ev) => ev.defaultPrevented)).toBe(false);
    expect(dins('indicador').dataset.estat).toBe('repos');
    expect(onRecarrega).not.toHaveBeenCalled();

    // Control: amb la pàgina tornada a dalt, el mateix gest sí que s'arma.
    delete document.scrollingElement;
    estira(dins('objectiu'), [[0, PASSAT]]);
    expect(dins('indicador').dataset.estat).toBe('llest');
    toca(dins('objectiu'), 'touchcancel');
  } finally {
    delete document.scrollingElement;
    desmunta();
  }
});

test('dins d’un ShadowRoot, amb <soc-de-poble> començant per damunt del viewport, no s’arma', () => {
  const onRecarrega = vi.fn();
  const { amfitrio, dins, desmunta } = muntaEnOmbra(onRecarrega);
  // El tema ha desplaçat un contenidor seu: l'app comença 50px per damunt.
  amfitrio.getBoundingClientRect = () => ({ top: -50, bottom: 600, left: 0, right: 375, width: 375, height: 650, x: 0, y: -50 });
  const moviments = estira(dins('objectiu'), [[0, 40], [0, PASSAT]]);
  toca(dins('objectiu'), 'touchend');
  expect(moviments.some((ev) => ev.defaultPrevented)).toBe(false);
  expect(dins('indicador').dataset.estat).toBe('repos');
  expect(onRecarrega).not.toHaveBeenCalled();

  // Amb l'app tornada a dalt (top 0), el mateix gest sí que és nostre.
  amfitrio.getBoundingClientRect = () => ({ top: 0, bottom: 650, left: 0, right: 375, width: 375, height: 650, x: 0, y: 0 });
  estira(dins('objectiu'), [[0, 40], [0, PASSAT]]);
  toca(dins('objectiu'), 'touchend');
  expect(onRecarrega).toHaveBeenCalledTimes(1);
  desmunta();
});

test.each(['camp', 'editable', 'graf', 'dialeg', 'llenç'])('dins d’un ShadowRoot, sobre «%s» el gest no s’arma', (id) => {
  const onRecarrega = vi.fn();
  const { dins, desmunta } = muntaEnOmbra(onRecarrega);
  const moviments = estira(dins(id), [[0, 40], [0, PASSAT]]);
  toca(dins(id), 'touchend');
  expect(moviments.some((ev) => ev.defaultPrevented)).toBe(false);
  expect(dins('indicador').dataset.estat).toBe('repos');
  expect(onRecarrega).not.toHaveBeenCalled();
  // Control: fora de l'exclusió, el mateix gest dins de l'ombra sí que s'arma.
  estira(dins('objectiu'), [[0, PASSAT]]);
  expect(dins('indicador').dataset.estat).toBe('llest');
  toca(dins('objectiu'), 'touchcancel');
  desmunta();
});

test('dins d’un ShadowRoot, una columna desplaçada, touch-action: none i un segon dit no arrenquen cap recàrrega', () => {
  const onRecarrega = vi.fn();
  const { dins, desmunta } = muntaEnOmbra(onRecarrega);

  // Columna a mitja llista (com les de l'AppGridShell): el dit que baixa vol pujar.
  Object.defineProperty(dins('intern'), 'scrollTop', { configurable: true, value: 1200 });
  let moviments = estira(dins('objectiu'), [[0, 40], [0, PASSAT]]);
  toca(dins('objectiu'), 'touchend');
  expect(moviments.some((ev) => ev.defaultPrevented)).toBe(false);
  Object.defineProperty(dins('intern'), 'scrollTop', { configurable: true, value: 0 });

  // Una superfície amb el seu propi gest (touch-action: none). jsdom no
  // resol touch-action: l'estil computat d'eixe node es dona a mà.
  const original = window.getComputedStyle.bind(window);
  const espia = vi.spyOn(window, 'getComputedStyle').mockImplementation((el, ...resta) => (
    el === dins('intern') ? { touchAction: 'none' } : original(el, ...resta)
  ));
  moviments = estira(dins('objectiu'), [[0, 40], [0, PASSAT]]);
  toca(dins('objectiu'), 'touchend');
  expect(moviments.some((ev) => ev.defaultPrevented)).toBe(false);
  espia.mockRestore();

  // Un segon dit (zoom) desfà el gest enganxat.
  estira(dins('objectiu'), [[0, PASSAT]]);
  expect(dins('indicador').dataset.estat).toBe('llest');
  toca(dins('objectiu'), 'touchstart', [[100, 100 + PASSAT], [200, 200]]);
  expect(dins('indicador').dataset.estat).toBe('repos');
  toca(dins('objectiu'), 'touchend');

  expect(onRecarrega).not.toHaveBeenCalled();
  desmunta();
});

/* Encastat, la franja de l'amfitrió s'interposa entre la barra negra (on naix
   l'indicador) i el contingut: l'indicador baixa apegat al contingut, sense
   deixar un forat de franja entre tots dos. jsdom no fa layout: els offsetTop
   es definixen a mà (indicador a 64px, contingut a 129px). */
test('l’indicador baixa apegat al contingut encara que una franja s’hi interpose', () => {
  const onRecarrega = vi.fn();
  render(h(Banc, { onRecarrega }));
  Object.defineProperty(indicador(), 'offsetTop', { configurable: true, value: 64 });
  Object.defineProperty(screen.getByTestId('contingut'), 'offsetTop', { configurable: true, value: 129 });
  const objectiu = screen.getByTestId('objectiu');
  estira(objectiu, [[0, PASSAT]]);
  toca(objectiu, 'touchend');
  expect(screen.getByTestId('contingut').style.transform).toBe(`translateY(${LLINDAR_PTR}px)`);
  expect(indicador().style.transform).toBe(`translateY(calc(${LLINDAR_PTR + 65}px - 100%))`);
});

/* La franja tapa l'indicador mentre naix, com la barra negra: ha d'estar
   posicionada i per damunt del seu z-index (modules.css, «Lliscar per
   recarregar»). jsdom no resol la cascada: es llig el full. */
test('la franja de l’amfitrió queda per damunt de l’indicador, dins de @layer components', () => {
  const css = readFileSync(resolve(process.cwd(), 'src/css/modules.css'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  const regles = [];
  const pila = [];
  let tros = '';
  for (const c of css) {
    if (c === '{') {
      pila.push(tros.split(';').pop().trim().replace(/\s+/g, ' '));
      tros = '';
    } else if (c === '}') {
      const prelud = pila.pop();
      if (prelud && !prelud.startsWith('@')) regles.push({ prelud, cos: tros, context: [...pila] });
      tros = '';
    } else {
      tros += c;
    }
  }
  const valor = (cos, prop) => (cos.match(new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`)) || [])[1]?.trim();
  const franja = regles.filter((r) => r.prelud === '.app-main > .sdp-amfitrio-franja');
  expect(franja).toHaveLength(1);
  expect(franja[0].context).toEqual(['@layer components']);
  expect(valor(franja[0].cos, 'position')).toBe('relative');
  const zIndicador = Math.max(...regles
    .filter((r) => r.prelud === '.sdp-ptr-indicator')
    .map((r) => Number(valor(r.cos, 'z-index')))
    .filter(Number.isFinite));
  expect(Number(valor(franja[0].cos, 'z-index'))).toBeGreaterThan(zIndicador);
});
