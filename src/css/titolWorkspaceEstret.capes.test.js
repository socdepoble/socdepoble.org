// @vitest-environment node
/* workspace-04 (Gauntlet R22) · Fase D (pla 261004_0050, Q5 del Mestre): l'H1
   de pàgina és el primer nivell també en mòbil, mai per davall de l'h2 del cos
   (comentari de layout.css, header.page-title h1). R21.7 va afegir, dins del
   detall del workspace (.sdp-workspace-detail), dues @container que reduïxen
   l'H1 en columnes estretes; amb un contenidor de 375 px el deixaven en 28 px
   davant de 29,4 px de l'h2. La guarda Q5 de rocaIGuardes.capes.test.js només
   llig layout.css i no ho veia.
   jsdom no resol la cascada ni les unitats de contenidor: es llegixen les
   regles escrites (layout.css, base.css i les @container de modules.css) i es
   calcula la mida en px per a cada ample de contenidor, amb els tokens de
   tokens.css. Els --sdp-fluid-* prenen la variant en cqi del bloc
   @supports (width: 1cqi), que és la que mana en tot navegador que entén
   @container. La guarda es prova també contra el valor d'R21.7 d'abans: si no
   el detectara, no guardaria res. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import postcss from 'postcss';
import { describe, expect, test } from 'vitest';

const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const ARREL_PX = 16;
const SELECTOR_H1_DETALL = '.sdp-workspace-detail header.page-title h1';
const varDe = (nom) => ['var(', nom, ')'].join('');

function parteix(selector) {
  return selector.split(',').map((tros) => tros.replace(/\s+/g, ' ').trim());
}

/** Tokens de tokens.css: els de base i, damunt, els de @supports (width: 1cqi). */
function tokens() {
  const base = new Map();
  const cqi = new Map();
  postcss.parse(llig('src/css/tokens.css')).walkDecls(/^--sdp-(text|fluid)-/, (decl) => {
    const pare = decl.parent?.parent;
    const dinsCqi = pare?.type === 'atrule' && pare.name === 'supports' && /1cqi/.test(pare.params);
    (dinsCqi ? cqi : base).set(decl.prop, decl.value.trim());
  });
  return new Map([...base, ...cqi]);
}

/** Avalua una mida CSS (calc, clamp, max, min, var, rem, px i cqi) en px. */
function avaluaMida(expressio, ampleContenidor, mapaTokens) {
  const font = String(expressio);
  let pos = 0;
  const espais = () => { while (pos < font.length && /\s/.test(font[pos])) pos += 1; };
  const espera = (caracter) => {
    espais();
    if (font[pos] !== caracter) throw new Error(`S'esperava «${caracter}» a «${font}» (posició ${pos}).`);
    pos += 1;
  };
  function primari() {
    espais();
    const funcio = /^([a-z-]+)\(/i.exec(font.slice(pos));
    if (funcio) {
      pos += funcio[0].length;
      const nom = funcio[1].toLowerCase();
      if (nom === 'var') {
        const fi = font.indexOf(')', pos);
        const token = font.slice(pos, fi).trim();
        pos = fi + 1;
        if (!mapaTokens.has(token)) throw new Error(`Token absent de tokens.css: ${token}`);
        return avaluaMida(mapaTokens.get(token), ampleContenidor, mapaTokens);
      }
      const operands = [suma()];
      espais();
      while (font[pos] === ',') {
        pos += 1;
        operands.push(suma());
        espais();
      }
      espera(')');
      if (nom === 'calc') return operands[0];
      if (nom === 'max') return Math.max(...operands);
      if (nom === 'min') return Math.min(...operands);
      if (nom === 'clamp') return Math.max(operands[0], Math.min(operands[1], operands[2]));
      throw new Error(`Funció CSS no prevista: ${nom}`);
    }
    if (font[pos] === '(') {
      pos += 1;
      const valor = suma();
      espera(')');
      return valor;
    }
    const nombre = /^(-?\d*\.?\d+)(rem|px|cqi)?/.exec(font.slice(pos));
    if (!nombre) throw new Error(`No s'entén «${font.slice(pos)}».`);
    pos += nombre[0].length;
    const valor = Number(nombre[1]);
    if (nombre[2] === 'rem') return valor * ARREL_PX;
    if (nombre[2] === 'cqi') return (valor * ampleContenidor) / 100;
    return valor;
  }
  function producte() {
    let valor = primari();
    espais();
    while (font[pos] === '*' || font[pos] === '/') {
      const operador = font[pos];
      pos += 1;
      const dreta = primari();
      valor = operador === '*' ? valor * dreta : valor / dreta;
      espais();
    }
    return valor;
  }
  function suma() {
    let valor = producte();
    espais();
    while (font[pos] === '+' || font[pos] === '-') {
      const operador = font[pos];
      pos += 1;
      const dreta = producte();
      valor = operador === '+' ? valor + dreta : valor - dreta;
      espais();
    }
    return valor;
  }
  const valor = suma();
  espais();
  if (pos !== font.length) throw new Error(`Sobra «${font.slice(pos)}» a «${font}».`);
  return valor;
}

/** La font-size de la primera regla (fora de @container) que nomena el selector. */
function midaDeRegla(ruta, selector) {
  let mida = null;
  postcss.parse(llig(ruta)).walkRules((regla) => {
    if (mida != null || !parteix(regla.selector).includes(selector)) return;
    for (let pare = regla.parent; pare; pare = pare.parent) {
      if (pare.type === 'atrule' && pare.name === 'container') return;
    }
    regla.walkDecls('font-size', (decl) => { mida = decl.value; });
  });
  if (mida == null) throw new Error(`${ruta} no dona mida a ${selector}`);
  return mida;
}

/** Les @container (max-width: N px) de modules.css que donen mida a l'H1 del detall, en ordre de font. */
function reglesContenidorH1() {
  const regles = [];
  postcss.parse(llig('src/css/modules.css')).walkAtRules('container', (atRegla) => {
    const ample = /^\(\s*max-width:\s*(\d+(?:\.\d+)?)px\s*\)$/.exec(atRegla.params.trim());
    atRegla.walkRules((regla) => {
      if (!parteix(regla.selector).includes(SELECTOR_H1_DETALL)) return;
      if (!ample) throw new Error(`@container no previst per a l'H1 del detall: ${atRegla.params}`);
      regla.walkDecls('font-size', (decl) => regles.push({ maxim: Number(ample[1]), valor: decl.value }));
    });
  });
  return regles;
}

/** Amples on l'H1 del detall queda per davall de l'h2 del cos. */
function jerarquiaTrencada(regles, { h1Base, h2, mapaTokens }) {
  const trencades = [];
  for (let ample = 280; ample <= 520; ample += 1) {
    const aplicables = regles.filter((regla) => ample <= regla.maxim);
    const valorH1 = aplicables.length ? aplicables.at(-1).valor : h1Base;
    const pxH1 = avaluaMida(valorH1, ample, mapaTokens);
    const pxH2 = avaluaMida(h2, ample, mapaTokens);
    if (pxH1 + 0.01 < pxH2) trencades.push({ ample, h1: Number(pxH1.toFixed(2)), h2: Number(pxH2.toFixed(2)) });
  }
  return trencades;
}

describe('títol de pàgina dins del detall del workspace · jerarquia fluida (Q5) en columna estreta', () => {
  const mapaTokens = tokens();
  const context = {
    mapaTokens,
    h1Base: midaDeRegla('src/css/layout.css', 'header.page-title h1'),
    h2: midaDeRegla('src/css/base.css', 'h2')
  };

  test('l’avaluador reproduïx els tokens fluids (28 px i 32 px a 320 px; 46 px i 56 px a 1024 px)', () => {
    expect(avaluaMida(varDe('--sdp-fluid-h2'), 320, mapaTokens)).toBeCloseTo(28, 1);
    expect(avaluaMida(varDe('--sdp-fluid-h1'), 320, mapaTokens)).toBeCloseTo(32, 1);
    expect(avaluaMida(varDe('--sdp-fluid-h2'), 1024, mapaTokens)).toBeCloseTo(46, 1);
    expect(avaluaMida(varDe('--sdp-fluid-h1'), 1024, mapaTokens)).toBeCloseTo(56, 1);
  });

  test('de 280 a 520 px de contenidor, l’H1 del detall mai queda per davall de l’h2 del cos', () => {
    expect(context.h2).toBe(varDe('--sdp-fluid-h2'));
    expect(jerarquiaTrencada(reglesContenidorH1(), context)).toEqual([]);
  });

  test('la guarda detecta el clamp() d’R21.7 sense sòl (28 px davant de 29,4 px a 375 px)', () => {
    const r217 = [
      { maxim: 520, valor: `clamp(${varDe('--sdp-text-h5')}, 1rem + 4cqi, ${varDe('--sdp-text-h3')})` },
      { maxim: 380, valor: `clamp(${varDe('--sdp-text-h6')}, 0.95rem + 3.5cqi, ${varDe('--sdp-text-h4')})` }
    ];
    const trencades = jerarquiaTrencada(r217, context);
    expect(trencades.find((fila) => fila.ample === 375)).toEqual({ ample: 375, h1: 28, h2: 29.41 });
    expect(trencades.some((fila) => fila.ample === 520)).toBe(true);
  });
});
