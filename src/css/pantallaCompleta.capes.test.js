import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';

/* Ordre del Mestre, 261001 · «Botó de Pantalla Completa al Calendari».
   jsdom no resol la cascada ni pinta: es comproven les regles noves dels
   fulls (el patró de navegacio-secundaria.capes.test.js).
   · Totes viuen dins de @layer components i només fan servir tokens
     (var(--sdp-*)) i env() de la zona segura: cap hex, rgb, :has(), vh/dvh,
     z-index nou ni ombra.
   · Llei del Píxel: cada selector nou nomena una classe nova, que cap node
     d'ara no porta; els diàlegs, el Mur i la Consola no canvien.
   · El display del diàleg porta [open]: sense, un diàleg tancat es veuria.
   · Llei de Scroll: només el visor desborda. */

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(resolve(ARREL, ruta), 'utf8');
const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** Regles fulla d'un full, amb la pila d'at-rules i blocs que les contenen. */
function regles(css) {
  const eixida = [];
  const pila = [];
  let tros = '';
  for (const c of senseComentaris(css)) {
    if (c === '{') {
      if (pila.length) pila[pila.length - 1].fills = true;
      pila.push({ prelud: tros.split(';').pop().trim().replace(/\s+/g, ' '), fills: false });
      tros = '';
    } else if (c === '}') {
      const bloc = pila.pop();
      if (bloc && !bloc.fills && !bloc.prelud.startsWith('@')) {
        eixida.push({
          selectors: bloc.prelud.split(',').map((s) => s.trim()),
          cos: tros.replace(/\s+/g, ' ').trim(),
          context: pila.map((b) => b.prelud)
        });
      }
      tros = '';
    } else {
      tros += c;
    }
  }
  return eixida;
}

const declaracions = (cos) => cos.split(';')
  .map((d) => d.split(':'))
  .filter((p) => p.length >= 2)
  .map(([prop, ...valor]) => [prop.trim(), valor.join(':').trim()]);

const FULLS = {
  components: llig('src/css/components.css'),
  layout: llig('src/css/layout.css'),
  modules: llig('src/css/modules.css')
};
const CLASSES_NOVES = ['sdp-pantalla-completa', 'sdp-dialeg--completa', 'sdp-capa-modal--completa'];
const esNova = (selector) => CLASSES_NOVES.some((classe) => selector.includes(`.${classe}`));
const NOVES = Object.entries(FULLS).flatMap(([full, css]) => regles(css)
  .filter((r) => r.selectors.some(esNova))
  .map((r) => ({ full, ...r })));
const regla = (full, selector) => NOVES.find((r) => r.full === full && r.selectors.includes(selector));

const ESPERADES = [
  ['components', '.sdp-dialeg.sdp-dialeg--completa:not(.sdp-dialeg--calaix)'],
  ['components', '.sdp-dialeg.sdp-dialeg--completa[open]'],
  ['components', '.sdp-pantalla-completa__barra'],
  ['components', '.sdp-pantalla-completa__barra .sdp-boto--secundari'],
  ['components', '.sdp-pantalla-completa__barra .sdp-boto--secundari:hover:not(:disabled)'],
  ['components', '.sdp-pantalla-completa__visor'],
  ['components', '.sdp-boto.sdp-pantalla-completa__entra'],
  ['layout', ':host .sdp-capa-modal--completa'],
  ['layout', ':host .sdp-capa-modal--completa > .sdp-dialeg.sdp-dialeg--completa'],
  ['layout', ':host .sdp-root[data-sdp-estret] > .sdp-capa-modal.sdp-capa-modal--completa'],
  ['layout', ':host .sdp-root[data-sdp-estret] > .sdp-capa-modal > .sdp-dialeg.sdp-dialeg--completa'],
  ['modules', '.sdp-calendari__barra > .sdp-pantalla-completa__entra'],
  ['modules', '.sdp-pantalla-completa .sdp-cal-setmana.sdp-cal-setmana']
];

test('les regles de la pantalla completa són on toca, i no n’hi ha cap més', () => {
  for (const [full, selector] of ESPERADES) expect(regla(full, selector), `${full}: ${selector}`).toBeTruthy();
  expect(NOVES.map((r) => `${r.full}: ${r.selectors.join(', ')}`).sort())
    .toEqual(ESPERADES.map(([full, selector]) => `${full}: ${selector}`).sort());
});

test('totes dins de @layer components', () => {
  const fora = NOVES.filter((r) => r.context[0] !== '@layer components').map((r) => `${r.full}: ${r.selectors.join(', ')}`);
  expect(fora).toEqual([]);
});

test('Llei del Píxel: cada selector nou nomena una classe nova (cap node d’ara no la porta)', () => {
  const vells = NOVES.flatMap((r) => r.selectors.filter((s) => !esNova(s)).map((s) => `${r.full}: ${s}`));
  expect(vells).toEqual([]);
});

test('només tokens: var(--sdp-*) i env() de la zona segura; cap hex, rgb, :has(), vh/dvh, z-index ni ombra', () => {
  const infraccions = [];
  for (const r of NOVES) {
    const on = `${r.full}: ${r.selectors.join(', ')}`;
    if (r.selectors.some((s) => s.includes(':has('))) infraccions.push(`${on} · :has()`);
    for (const [prop, valor] of declaracions(r.cos)) {
      if (/#[0-9a-f]{3,8}\b/i.test(valor)) infraccions.push(`${on} · ${prop}: hex`);
      if (/\b(rgba?|hsla?|oklch|lab|lch|color-mix)\(/i.test(valor)) infraccions.push(`${on} · ${prop}: color cru`);
      if (/\d(d|s|l)?v(h|w|b|i|min|max)\b/.test(valor)) infraccions.push(`${on} · ${prop}: unitat de viewport`);
      if (prop === 'z-index') infraccions.push(`${on} · z-index`);
      if (prop === 'box-shadow' && valor !== 'none') infraccions.push(`${on} · ombra`);
      for (const m of valor.matchAll(/var\(\s*(--[\w-]+)/g)) if (!m[1].startsWith('--sdp-')) infraccions.push(`${on} · ${m[1]}`);
      for (const m of valor.matchAll(/env\(\s*([\w-]+)/g)) if (!m[1].startsWith('safe-area-inset-')) infraccions.push(`${on} · env(${m[1]})`);
      // Mides soltes: només el zero de reserva i les vores d'1 i 2px de la casa.
      for (const m of valor.matchAll(/(\d*\.?\d+)(px|rem|em)\b/g)) if (!['0px', '1px', '2px'].includes(m[0])) infraccions.push(`${on} · ${prop}: ${m[0]}`);
    }
  }
  expect(infraccions).toEqual([]);
});

test('el display del diàleg porta [open]; tancat, mana el full del navegador', () => {
  const ambDisplay = NOVES.filter((r) => declaracions(r.cos).some(([prop]) => prop === 'display') && r.selectors.some((s) => s.includes('.sdp-dialeg--completa')));
  expect(ambDisplay.map((r) => r.selectors.join(', '))).toEqual(['.sdp-dialeg.sdp-dialeg--completa[open]']);
  expect(regla('components', '.sdp-dialeg.sdp-dialeg--completa[open]').cos).toMatch(/display: flex; flex-direction: column/);
});

test('Llei de Scroll: només el visor desborda; el diàleg retalla', () => {
  const desborden = NOVES.filter((r) => declaracions(r.cos).some(([prop, valor]) => /^overflow/.test(prop) && /auto|scroll/.test(valor)));
  expect(desborden.map((r) => r.selectors.join(', '))).toEqual(['.sdp-pantalla-completa__visor']);
  const dialeg = declaracions(regla('components', '.sdp-dialeg.sdp-dialeg--completa:not(.sdp-dialeg--calaix)').cos);
  expect(dialeg).toEqual(expect.arrayContaining([['overflow', 'hidden'], ['position', 'fixed'], ['inset', '0'], ['max-width', 'none'], ['box-shadow', 'none']]));
  const visor = declaracions(regla('components', '.sdp-pantalla-completa__visor').cos);
  expect(visor).toEqual(expect.arrayContaining([['min-height', '0'], ['overscroll-behavior', 'contain'], ['container-type', 'inline-size']]));
});

test('el botó d’entrar fa 44×44 (var(--sdp-touch)) i «Eixir» torna a ser secundari davant de PerfilShell', () => {
  const entra = declaracions(regla('components', '.sdp-boto.sdp-pantalla-completa__entra').cos);
  expect(entra).toEqual(expect.arrayContaining([['inline-size', 'var(--sdp-touch)'], ['min-inline-size', 'var(--sdp-touch)'], ['padding', '0']]));
  const eixir = declaracions(regla('components', '.sdp-pantalla-completa__barra .sdp-boto--secundari').cos);
  expect(eixir).toEqual(expect.arrayContaining([['background', 'var(--sdp-fons-targeta)'], ['color', 'var(--sdp-text-titol)'], ['border', '2px solid var(--sdp-vora-control)']]));
  expect(declaracions(regla('modules', '.sdp-calendari__barra > .sdp-pantalla-completa__entra').cos)).toEqual([['margin-inline-start', 'auto']]);
});

test('dins de la pantalla completa, la capçalera de la Setmana s’enganxa a dalt del visor', () => {
  expect(declaracions(regla('modules', '.sdp-pantalla-completa .sdp-cal-setmana.sdp-cal-setmana').cos)).toEqual([['--sdp-cal-sostre', '0px']]);
  // Va darrere de la de l'espècimen, que té menys especificitat.
  const modules = senseComentaris(FULLS.modules);
  expect(modules.indexOf('.sdp-pantalla-completa .sdp-cal-setmana.sdp-cal-setmana')).toBeGreaterThan(modules.lastIndexOf('.sdp-especimen .sdp-cal-setmana'));
});

test('encastada, la capa ocupa la caixa de l’App i el diàleg l’ompli (Frontera C2)', () => {
  expect(declaracions(regla('layout', ':host .sdp-capa-modal--completa').cos)).toEqual([['padding', '0'], ['background', 'var(--sdp-fons-app)']]);
  expect(declaracions(regla('layout', ':host .sdp-capa-modal--completa > .sdp-dialeg.sdp-dialeg--completa').cos))
    .toEqual(expect.arrayContaining([['position', 'relative'], ['width', '100%'], ['height', '100%'], ['border-radius', '0']]));
  // Les d'estret van darrere de les de sempre: amb la mateixa especificitat, guanyen per l'ordre.
  const layout = senseComentaris(FULLS.layout);
  expect(layout.indexOf('.sdp-capa-modal.sdp-capa-modal--completa { align-items: stretch; }'))
    .toBeGreaterThan(layout.indexOf('> .sdp-capa-modal:not(.sdp-capa-modal--calaix) { align-items: flex-end; padding: 0; }'));
});

test('la guarda de tokens detecta un hex, una unitat de viewport i un var() aliè', () => {
  const prova = (cos) => {
    const r = [];
    for (const [prop, valor] of declaracions(cos)) {
      if (/#[0-9a-f]{3,8}\b/i.test(valor)) r.push(`${prop}:hex`);
      if (/\d(d|s|l)?v(h|w|b|i|min|max)\b/.test(valor)) r.push(`${prop}:viewport`);
      for (const m of valor.matchAll(/var\(\s*(--[\w-]+)/g)) if (!m[1].startsWith('--sdp-')) r.push(`${prop}:${m[1]}`);
    }
    return r;
  };
  expect(prova(`color: ${'#'}abcdef; height: 100dvh; background: var(--z-vel)`)).toEqual(['color:hex', 'height:viewport', 'background:--z-vel']);
  expect(prova('padding: env(safe-area-inset-top, 0px); color: var(--sdp-text-cos)')).toEqual([]);
});
