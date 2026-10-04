/* Higiene d'amfitrió (ordre del Mestre, 261004, front «amfitrio-admin») · El
   menú «/» es munta dins del contenidor de l'app (.sdp-root, també dins del
   shadow root de <soc-de-poble>), però el cursor dona coordenades del
   viewport. Amb un contenidor que no és document.body, top i left són
   relatius al seu rectangle i el gir cap amunt es decidix amb les seues
   vores; amb document.body, el comportament de sempre, contra el viewport.
   jsdom no fa layout: el rectangle del contenidor i la mida de la caixa es
   fixen a mà. Es crida el renderitzador del Suggestion directament. */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const captura = vi.hoisted(() => ({ opcions: null }));
vi.mock('@tiptap/suggestion', () => ({
  default: (opcions) => {
    captura.opcions = opcions;
    return {};
  }
}));

import { SlashMenu } from './slash.js';

const ALT = 100;
const AMPLE = 220;
const rect = (top, left, alt = 0, ample = 0) => ({
  top, left, bottom: top + alt, right: left + ample, width: ample, height: alt, x: left, y: top
});

/* El renderitzador del menú, tal com el crearia el Suggestion. */
function renderitzador() {
  SlashMenu.config.addProseMirrorPlugins.call({ options: { ordres: [], suggestion: { char: '/' } }, editor: {} });
  return captura.opcions.render();
}

const descriptors = {};
beforeEach(() => {
  for (const [prop, valor] of [['offsetHeight', ALT], ['offsetWidth', AMPLE]]) {
    descriptors[prop] = Object.getOwnPropertyDescriptor(HTMLElement.prototype, prop);
    Object.defineProperty(HTMLElement.prototype, prop, {
      configurable: true,
      get() { return this.classList?.contains('sdp-slash-menu') ? valor : 0; }
    });
  }
  vi.stubGlobal('innerWidth', 1024);
  vi.stubGlobal('innerHeight', 768);
});
afterEach(() => {
  for (const [prop, descriptor] of Object.entries(descriptors)) {
    if (descriptor) Object.defineProperty(HTMLElement.prototype, prop, descriptor);
  }
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

/* Un .sdp-root desplaçat (top 32, left 120), amb l'editor dins. */
function contenidorDesplacat(dins = document.body) {
  const arrel = document.createElement('div');
  arrel.className = 'sdp-root';
  arrel.getBoundingClientRect = () => rect(32, 120, 600, 800);
  const dom = document.createElement('div');
  arrel.appendChild(dom);
  dins.appendChild(arrel);
  return { arrel, editor: { view: { dom } } };
}

const posicio = (caixa) => [caixa.style.top, caixa.style.left];

describe('el menú «/» dins d’un contenidor desplaçat', () => {
  test('top i left relatius al contenidor; cap amunt amb les seues vores', () => {
    const { arrel, editor } = contenidorDesplacat();
    const menu = renderitzador();
    menu.onStart({ editor, items: [], clientRect: () => rect(200, 300, 20), command: () => {} });
    const caixa = arrel.querySelector(':scope > .sdp-slash-menu');
    // (220 + 6) - 32 i min(300, 920 - 220 - 12) - 120
    expect(posicio(caixa)).toEqual(['194px', '180px']);
    // A prop de la vora de baix del contenidor (632) gira cap amunt: (560 - 100 - 6) - 32 i min(900, 688) - 120.
    menu.onUpdate({ editor, items: [], clientRect: () => rect(560, 900, 20) });
    expect(posicio(caixa)).toEqual(['422px', '568px']);
    menu.onExit();
    expect(arrel.querySelector('.sdp-slash-menu')).toBeNull();
  });

  test('dins del shadow root de <soc-de-poble> (l’amfitrió), el mateix', () => {
    const host = document.createElement('soc-de-poble');
    document.body.appendChild(host);
    const { arrel, editor } = contenidorDesplacat(host.attachShadow({ mode: 'open' }));
    const menu = renderitzador();
    menu.onStart({ editor, items: [], clientRect: () => rect(200, 300, 20), command: () => {} });
    expect(posicio(arrel.querySelector('.sdp-slash-menu'))).toEqual(['194px', '180px']);
    // Res cau al document de l'amfitrió.
    expect(document.querySelector('.sdp-slash-menu')).toBeNull();
    menu.onExit();
  });
});

describe('amb document.body, el comportament de sempre (viewport)', () => {
  test('sense .sdp-root, les coordenades del cursor tal qual', () => {
    const dom = document.createElement('div');
    document.body.appendChild(dom);
    const editor = { view: { dom } };
    const menu = renderitzador();
    menu.onStart({ editor, items: [], clientRect: () => rect(200, 300, 20), command: () => {} });
    const caixa = document.body.querySelector(':scope > .sdp-slash-menu');
    expect(posicio(caixa)).toEqual(['226px', '300px']);
    // 720 + 108 > 768 i 700 - 108 > 0: cap amunt, 700 - 106; min(1000, 1024 - 232).
    menu.onUpdate({ editor, items: [], clientRect: () => rect(700, 1000, 20) });
    expect(posicio(caixa)).toEqual(['594px', '792px']);
    menu.onExit();
  });

  test('un shadow root sense .sdp-root (sense rectangle) també usa el viewport i no peta', () => {
    const host = document.createElement('soc-de-poble');
    document.body.appendChild(host);
    const sombra = host.attachShadow({ mode: 'open' });
    const dom = document.createElement('div');
    sombra.appendChild(dom);
    const menu = renderitzador();
    menu.onStart({ editor: { view: { dom } }, items: [], clientRect: () => rect(200, 300, 20), command: () => {} });
    expect(posicio(sombra.querySelector('.sdp-slash-menu'))).toEqual(['226px', '300px']);
    menu.onExit();
  });
});
