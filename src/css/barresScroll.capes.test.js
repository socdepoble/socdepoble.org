// @vitest-environment node
/* Ordre del Mestre (261012, vespre) · «Fes que les barres acompanyen l'scroll
   (que s'oculten al baixar) per alliberar el 100% de la pantalla per a l'ERP»
   i «Afig un botó suau de "Tornar a dalt" (Scroll to top) a la part inferior
   dreta (damunt de 'Pobles')». jsdom no resol la cascada ni pinta: es
   comproven les regles escrites, sense comentaris.
   El contracte: useBarresAmbScroll posa data-sdp-barres a l'arrel en
   compacte (dalt | totes). Sense l'atribut, res no canvia cap píxel; en
   escriptori, mai (Llei del Píxel). */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { CLASSES_PEU_ANCORAT } from '../hooks/useBarresAmbScroll.js';

const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const net = (text) => text.replace(/\s+/g, ' ').trim();

/** Parteix una llista de selectors per les comes de primer nivell. */
function parteix(preludi) {
  const trossos = [];
  let fondaria = 0;
  let actual = '';
  for (const caracter of preludi) {
    if (caracter === '(' || caracter === '[') fondaria += 1;
    if (caracter === ')' || caracter === ']') fondaria -= 1;
    if (caracter === ',' && fondaria === 0) {
      trossos.push(net(actual));
      actual = '';
    } else {
      actual += caracter;
    }
  }
  if (actual.trim()) trossos.push(net(actual));
  return trossos;
}

/** Regles fulla amb les @-regles que les embolcallen. */
function regles(css) {
  const eixida = [];
  const pila = [];
  let buf = '';
  for (const caracter of senseComentaris(css)) {
    if (caracter === '{') {
      pila.push(net(buf));
      buf = '';
    } else if (caracter === '}') {
      const preludi = pila.pop();
      if (preludi && !preludi.startsWith('@')) {
        eixida.push({ selectors: parteix(preludi), cos: net(buf), context: pila.filter((p) => p.startsWith('@')) });
      }
      buf = '';
    } else if (caracter === ';' && (pila.length === 0 || pila[pila.length - 1].startsWith('@'))) {
      buf = '';
    } else {
      buf += caracter;
    }
  }
  return eixida;
}

const declaracions = (cos) => cos.split(';').map((d) => d.trim()).filter(Boolean).map((d) => {
  const dos = d.indexOf(':');
  return [d.slice(0, dos).trim(), d.slice(dos + 1).trim()];
});
const cosDe = (llista, selector) => llista.filter((r) => r.selectors.includes(selector));
const valorDe = (llista, selector, propietat) => cosDe(llista, selector)
  .flatMap((r) => declaracions(r.cos)).filter(([p]) => p === propietat).map(([, v]) => v).pop();

const LAYOUT = regles(llig('src/css/layout.css'));
const COMPONENTS = regles(llig('src/css/components.css'));
const MODULES = regles(llig('src/css/modules.css'));
const ABAST = '.sdp-root.is-compact[data-sdp-barres';
const AMB_ATRIBUT = LAYOUT.filter((r) => r.selectors.some((s) => s.includes('data-sdp-barres')));
const RESERVA = 'calc(var(--sdp-alt-nav-mobil) + env(safe-area-inset-bottom, 0px))';

describe('barres que acompanyen el scroll · layout.css', () => {
  test('els estats amagats només penjen de l’arrel compacta amb l’atribut i viuen a @layer components, sense @media', () => {
    expect(AMB_ATRIBUT.length).toBeGreaterThanOrEqual(5);
    for (const r of AMB_ATRIBUT) {
      for (const s of r.selectors) expect(s.replace(/^:where\(([^)]*)\)/, '$1').startsWith(ABAST), s).toBe(true);
      expect(r.context, r.selectors.join(', ')).toEqual(['@layer components']);
    }
  });

  test('amagar no és llevar: cap display, visibility, opacity ni aria- als estats amagats', () => {
    const vetades = AMB_ATRIBUT.flatMap((r) => declaracions(r.cos)).filter(([p]) => /^(display|visibility|opacity)$/.test(p));
    expect(vetades).toEqual([]);
  });

  test('la blava i la taronja: el `top` d’enganxament passa a negatiu (la pila puja sencera)', () => {
    expect(valorDe(LAYOUT, '.sdp-root.is-compact[data-sdp-barres] .sdp-universal-page-container > header.bar-blue', 'top'))
      .toBe('calc(var(--sdp-alt-accio) * -2)');
    expect(valorDe(LAYOUT, '.sdp-root.is-compact[data-sdp-barres] .sdp-universal-page-container > section.bar-orange', 'top'))
      .toBe('calc(var(--sdp-alt-accio) * -1)');
    /* Cap transform a les barres de la pàgina: una barra en el flux (la
       taronja davall d'una portada) no s'ha de moure. */
    const transformades = LAYOUT.filter((r) => r.selectors.some((s) => /bar-(blue|orange)/.test(s)))
      .filter((r) => declaracions(r.cos).some(([p]) => p === 'transform'));
    expect(transformades.map((r) => r.selectors.join(', '))).toEqual([]);
  });

  test('les peces enganxades davall de les barres pugen al cim, sense forat', () => {
    expect(valorDe(LAYOUT, '.sdp-root.is-compact[data-sdp-barres] .sdp-editor-eines', 'top')).toBe('0');
    expect(valorDe(LAYOUT, '.sdp-root.is-compact[data-sdp-barres] .sdp-cal-setmana__capcal', 'inset-block-start')).toBe('0');
  });

  test('la barra negra no s’amaga mai: cap regla de l’atribut la nomena', () => {
    expect(AMB_ATRIBUT.filter((r) => r.selectors.some((s) => s.includes('bar-black')))).toEqual([]);
    const negra = LAYOUT.filter((r) => r.selectors.some((s) => s.includes('header.bar-black')))
      .filter((r) => declaracions(r.cos).some(([p, v]) => p === 'transform' || (p === 'top' && v !== '0')));
    expect(negra).toEqual([]);
  });

  test('la barra inferior només baixa amb «totes», amb transform, i la reserva del visor no canvia', () => {
    const nav = AMB_ATRIBUT.filter((r) => r.selectors.some((s) => s.includes('nav.mobile-nav')));
    expect(nav.map((r) => [r.selectors, r.cos])).toEqual([
      [['.sdp-root.is-compact[data-sdp-barres="totes"] > nav.mobile-nav'], 'transform: translateY(100%);']
    ]);
    expect(AMB_ATRIBUT.filter((r) => r.selectors.some((s) => s.includes('.app-main__content') && !s.includes('--contained')))).toEqual([]);
  });

  test('les transicions: la del calaix (durada i corba de token), mai `all`, i declarades en repòs només en compacte', () => {
    const CALAIX = 'var(--sdp-durada-panell) var(--sdp-corba-calaix)';
    expect(valorDe(LAYOUT, '.sdp-root.is-compact .sdp-universal-page-container > header.bar-blue', 'transition')).toBe(`top ${CALAIX}`);
    expect(valorDe(LAYOUT, '.sdp-root.is-compact .sdp-universal-page-container > section.bar-orange', 'transition')).toBe(`top ${CALAIX}`);
    expect(valorDe(LAYOUT, '.sdp-root.is-compact .sdp-editor-eines', 'transition')).toBe(`top ${CALAIX}`);
    expect(valorDe(LAYOUT, '.sdp-root.is-compact .sdp-cal-setmana__capcal', 'transition')).toBe(`inset-block-start ${CALAIX}`);
    expect(valorDe(LAYOUT, '.sdp-root.is-compact > nav.mobile-nav', 'transition')).toBe(`transform ${CALAIX}`);
    const totes = LAYOUT.flatMap((r) => declaracions(r.cos).filter(([p]) => p === 'transition').map(([, v]) => v));
    expect(totes.filter((v) => v.split(',').some((t) => t.trim().startsWith('all')))).toEqual([]);
  });

  test('les pàgines «contingut» del visor: la mateixa caixa en repòs i, amb «totes», fins a baix amb la reserva a dins', () => {
    const REPOS = ':where(.sdp-root.is-compact) .app-main__content > .sdp-universal-page-container--contained';
    const TOTES = ':where(.sdp-root.is-compact[data-sdp-barres="totes"]) .app-main__content > .sdp-universal-page-container--contained';
    expect(declaracions(cosDe(LAYOUT, REPOS)[0].cos)).toEqual([
      ['position', 'absolute'], ['top', '0'], ['right', '0'], ['bottom', RESERVA], ['left', '0'], ['height', 'auto'],
      ['transition', 'bottom 0s linear var(--sdp-durada-panell), padding-bottom 0s linear var(--sdp-durada-panell)']
    ]);
    expect(declaracions(cosDe(LAYOUT, TOTES)[0].cos)).toEqual([
      ['bottom', '0'], ['padding-bottom', RESERVA], ['transition', 'none']
    ]);
    // Amb la mateixa especificitat, «totes» va darrere i guanya.
    const text = net(senseComentaris(llig('src/css/layout.css')));
    expect(text.indexOf(`${TOTES} {`)).toBeGreaterThan(text.indexOf(`${REPOS} {`));
  });

  test('cap @media ni @container nou: el tall és la classe is-compact d’App.jsx', () => {
    const blocNou = net(senseComentaris(llig('src/css/layout.css'))).split('.hero-image--buit')[1] ?? '';
    expect(blocNou).not.toMatch(/@media|@container/);
    expect(blocNou).toContain('@layer components {');
  });
});

describe('Tornar a dalt', () => {
  test('la closca el fixa damunt de «Pobles», dins de l’arrel compacta, per davall de la barra i del vel', () => {
    const regla = cosDe(LAYOUT, '.sdp-root.is-compact > .sdp-tornar-dalt');
    expect(regla).toHaveLength(1);
    expect(regla[0].context).toEqual(['@layer components']);
    expect(declaracions(regla[0].cos)).toEqual([
      ['position', 'fixed'],
      ['bottom', 'calc(var(--sdp-alt-nav-mobil) + env(safe-area-inset-bottom, 0px) + var(--sdp-space-3))'],
      ['right', 'calc(var(--sdp-space-3) + (100% - var(--sdp-space-3) * 2) / 10 - var(--sdp-touch) / 2)'],
      ['z-index', 'var(--z-fab)']
    ]);
    // L'àtom no porta posició: al catàleg va en el flux.
    expect(valorDe(COMPONENTS, '.sdp-tornar-dalt', 'position')).toBeUndefined();
  });

  test('la pell: 48px de token, redó, vora de control, fons elevat, ombra funcional i l’aparició comuna', () => {
    const pell = cosDe(COMPONENTS, '.sdp-tornar-dalt');
    expect(pell).toHaveLength(1);
    expect(pell[0].context).toEqual(['@layer components']);
    expect(declaracions(pell[0].cos)).toEqual(expect.arrayContaining([
      ['inline-size', 'var(--sdp-touch)'], ['block-size', 'var(--sdp-touch)'], ['padding', '0'],
      ['border', '1px solid var(--sdp-vora-control)'], ['border-radius', 'var(--sdp-radi-pastilla)'],
      ['background', 'var(--sdp-fons-elevat)'], ['color', 'var(--sdp-text-suau)'], ['box-shadow', 'var(--sdp-ombra-2)'],
      ['animation', 'sdp-aparicio var(--sdp-durada-base) var(--sdp-corba-eixida)']
    ]));
    expect(pell[0].cos).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|\b(44|56|58)px\b/i);
  });

  test('hover dins de la guarda de ratolí, anell de :focus-visible i premut amb l’escala comuna', () => {
    const hover = cosDe(COMPONENTS, '.sdp-tornar-dalt:hover');
    expect(hover).toHaveLength(1);
    expect(hover[0].context).toEqual(['@layer components', '@media (hover: hover) and (pointer: fine)']);
    expect(declaracions(hover[0].cos)).toEqual([['background-color', 'var(--sdp-fons-subtil)']]);
    expect(declaracions(cosDe(COMPONENTS, '.sdp-tornar-dalt:focus-visible')[0].cos)).toEqual([
      ['outline', 'var(--sdp-focus-gruix) solid var(--sdp-focus)'], ['outline-offset', 'var(--sdp-focus-separacio)']
    ]);
    expect(valorDe(COMPONENTS, '.sdp-tornar-dalt:active', 'transform')).toBe('scale(var(--sdp-escala-premut))');
    // Cap outline fora de :focus-visible.
    const outlines = COMPONENTS.filter((r) => r.selectors.some((s) => s.includes('sdp-tornar-dalt')))
      .filter((r) => declaracions(r.cos).some(([p]) => p.startsWith('outline')));
    expect(outlines.every((r) => r.selectors.every((s) => s.endsWith(':focus-visible')))).toBe(true);
  });
});

/* Revisió adversarial 261012 · Un peu enganxat a baix que reserva l'alçada
   de la barra inferior la deixaria buida si la barra se n'anara («totes»),
   i el botó «Tornar a dalt» hi cauria damunt. El hook ho evita per a les
   classes de CLASSES_PEU_ANCORAT: cap peu enganxat amb reserva en queda fora. */
describe('peus ancorats que reserven la barra inferior (modules.css)', () => {
  test('cada peu enganxat a baix amb la reserva de la barra és a CLASSES_PEU_ANCORAT', () => {
    const classe = (selector) => selector.match(/\.([\w-]+)\s*$/)?.[1];
    const enganxats = new Set(MODULES.filter((r) => {
      const d = declaracions(r.cos);
      return d.some(([p, v]) => p === 'position' && v === 'sticky')
        && d.some(([p, v]) => (p === 'bottom' || p === 'inset-block-end') && v === '0');
    }).flatMap((r) => r.selectors.map(classe)));
    const ambReserva = new Set(MODULES.filter((r) => r.cos.includes('var(--sdp-alt-nav-mobil)'))
      .flatMap((r) => r.selectors.map(classe)));
    const peus = [...ambReserva].filter((c) => c && enganxats.has(c)).sort();
    // No és buida: els dos peus enganxats d'avui hi són.
    expect(peus).toEqual(expect.arrayContaining(['sdp-drets__peu', 'sdp-xat-fitxa-comunitat__peu']));
    expect(peus.filter((c) => !CLASSES_PEU_ANCORAT.includes(c))).toEqual([]);
  });
});

describe('la closca de la Gestoria (modules.css)', () => {
  test('les barres continuen static en escriptori, i en compacte s’enganxen com les de tota pàgina', () => {
    const SELECTORS = [
      ':where(.sdp-root:not(.is-compact) > .app-main) .sdp-gestoria-closca .sdp-universal-page-container > header.bar-blue',
      ':where(.sdp-root:not(.is-compact) > .app-main) .sdp-gestoria-closca .sdp-universal-page-container > section.bar-orange'
    ];
    const regla = MODULES.find((r) => r.selectors.includes(SELECTORS[0]));
    expect(regla?.selectors).toEqual(SELECTORS);
    expect(regla.cos).toBe('position: static;');
    expect(regla.context).toEqual(['@layer components']);
    // Cap regla de la closca sense l'abast d'escriptori torna a fer-les static.
    const sense = MODULES.filter((r) => r.selectors.some((s) => s.startsWith('.sdp-gestoria-closca .sdp-universal-page-container')));
    expect(sense).toEqual([]);
  });
});
