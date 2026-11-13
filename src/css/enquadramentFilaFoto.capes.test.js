// @vitest-environment node
/* R22.1 (Gauntlet R22.1: r221-ui-01, r221-text-12 i r221-ui-08) · LA FILA DE
   «CANVIAR FOTO» DAMUNT DEL VISOR DEL RETALLADOR SENZILL.
   Ordre del Mestre (acta 261113_0442): «fer visible el botó "Canviar foto"
   sense scroll». El kit R22.1 la va pujar al principi del cos i la va fer
   adhesiva. Dues conseqüències, mesurades en Chrome pels verificadors:
   · Dins de .sdp-dialeg__cos, que fa scroll, la barra adhesiva (95 px)
     tapava sencers el lliscador, + i la píndola de la forma en tornar-hi amb
     Maj+Tab (WCAG 2.4.11). Amb el zoom del navegador al 200 % el cos és més
     baix que la barra i cap scroll-padding no ho salva: la fila no és
     adhesiva. Primer fill del cos, ja es veu en obrir.
   · El pressupost d'alçada del visor (T3, 261025: «la foto no ix de la vista
     mentre es tria i el cos no fa scroll») no la comptava: a 1280 × 800 les
     píndoles quedaven davall del plec. Amb la fila davant del visor, el
     pressupost la resta.
   jsdom no maqueta: es llegixen les regles escrites amb postcss i es
   calculen en px amb els tokens de tokens.css i design-tokens.css. L'alçada
   de la fila NO es copia de la regla que es prova: es deriva de les regles
   de la fila mateixa (farciment, gap, vora), del botó (.sdp-boto), de la
   línia d'ajuda (.sdp-camp__ajuda i l'interlineat del cos) i del gap de
   .sdp-enquadrament. */
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import postcss from 'postcss';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const ARREL_PX = 16;
const llig = (ruta) => readFileSync(resolve(ARREL, ruta), 'utf8');
const arbre = (ruta) => postcss.parse(llig(ruta));
const parteix = (selector) => selector.split(',').map((tros) => tros.replace(/\s+/g, ' ').trim());
const dinsDe = (node) => {
  const cadena = [];
  for (let pare = node.parent; pare; pare = pare.parent) {
    if (pare.type === 'atrule' && pare.name !== 'layer') cadena.push(`@${pare.name} ${pare.params}`);
  }
  return cadena;
};

/** Els tokens --sdp-* de :root (fora de cap @media o @supports). */
function tokens() {
  const mapa = new Map();
  for (const ruta of ['src/css/design-tokens.css', 'src/css/tokens.css']) {
    arbre(ruta).walkDecls(/^--sdp-/, (decl) => {
      if (decl.parent?.type !== 'rule' || !parteix(decl.parent.selector).includes(':root')) return;
      if (dinsDe(decl.parent).length) return;
      mapa.set(decl.prop, decl.value.trim());
    });
  }
  return mapa;
}
const TOKENS = tokens();

/** Avalua una mida CSS (calc, min, max, var, rem, px, vh i nombres) en px, per a una pantalla d'alçada `alt`. */
function avalua(expressio, alt) {
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
        if (!TOKENS.has(token)) throw new Error(`Token absent: ${token}`);
        return avalua(TOKENS.get(token), alt);
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
      throw new Error(`Funció CSS no prevista: ${nom}`);
    }
    if (font[pos] === '(') {
      pos += 1;
      const valor = suma();
      espera(')');
      return valor;
    }
    const nombre = /^(-?\d*\.?\d+)(rem|px|vh)?/.exec(font.slice(pos));
    if (!nombre) throw new Error(`No s'entén «${font.slice(pos)}».`);
    pos += nombre[0].length;
    const valor = Number(nombre[1]);
    if (nombre[2] === 'rem') return valor * ARREL_PX;
    if (nombre[2] === 'vh') return (valor * alt) / 100;
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

/** Les regles de `ruta` que nomenen exactament `selector`, amb el seu context (@media) i l'ordre. */
function regles(ruta, selector) {
  const trobades = [];
  let ordre = 0;
  arbre(ruta).walkRules((regla) => {
    ordre += 1;
    if (!parteix(regla.selector).includes(selector)) return;
    const decls = {};
    regla.walkDecls((decl) => { decls[decl.prop] = decl.value.trim(); });
    trobades.push({ ordre, context: dinsDe(regla), decls });
  });
  return trobades;
}
const declaracio = (ruta, selector, propietat, context = []) => {
  const regla = regles(ruta, selector).find((r) => JSON.stringify(r.context) === JSON.stringify(context) && propietat in r.decls);
  if (!regla) throw new Error(`${ruta}: cap ${selector} { ${propietat} } en ${JSON.stringify(context)}`);
  return regla.decls[propietat];
};

const FILA = '.sdp-enquadrament__foto';
const VISOR_BASE = '.sdp-enquadrament--formes .sdp-enquadrament__visor-caixa > .sdp-enquadrament__visor';
const VISOR_AMB_FILA = '.sdp-enquadrament--formes > .sdp-enquadrament__foto ~ .sdp-enquadrament__visor-caixa > .sdp-enquadrament__visor';
const MOBIL = ['@media (max-width: 720px)'];
const especificitat = (selector) => (selector.replace(/:where\([^)]*\)/g, '').match(/\.[\w-]+/g) || []).length;

/** L'alçada de la fila i del gap fins al visor, en px, a partir de les regles de cada peça. */
function alcadaDeLaFila() {
  const farciment = avalua(declaracio('src/css/components.css', FILA, 'padding-block'), 0);
  const gapIntern = avalua(declaracio('src/css/components.css', FILA, 'gap'), 0);
  const vora = avalua(declaracio('src/css/components.css', FILA, 'border-bottom').split(/\s+/)[0], 0);
  const boto = avalua(declaracio('src/css/components.css', '.sdp-boto', 'min-height'), 0);
  const lletraAjuda = avalua(declaracio('src/css/components.css', '.sdp-camp__ajuda', 'font-size'), 0);
  const interlineat = Number(declaracio('src/css/base.css', '.sdp-root', 'line-height'));
  const gapFinsAlVisor = avalua(declaracio('src/css/modules.css', '.sdp-enquadrament', 'gap'), 0);
  return farciment * 2 + boto + gapIntern + lletraAjuda * interlineat + vora + gapFinsAlVisor;
}

describe('R22.1 · la fila de «Canviar foto» no tapa el focus', () => {
  test('cap regla de cap full fa adhesiva o fixa la fila (ni la del cos del diàleg)', () => {
    const fulls = readdirSync(resolve(ARREL, 'src/css')).filter((nom) => nom.endsWith('.css')).map((nom) => `src/css/${nom}`);
    const adhesives = [];
    for (const ruta of fulls) {
      arbre(ruta).walkRules((regla) => {
        if (!parteix(regla.selector).some((s) => /\.sdp-enquadrament__foto(?![\w-])(?:$|[:[])/.test(s))) return;
        regla.walkDecls('position', (decl) => {
          if (/sticky|fixed/.test(decl.value)) adhesives.push(`${ruta}: ${regla.selector} { position: ${decl.value} }`);
        });
      });
    }
    expect(adhesives).toEqual([]);
  });
});

describe('R22.1 · el pressupost del visor compta la fila de «Canviar foto»', () => {
  const fila = alcadaDeLaFila();

  test('la fila fa uns 94 px (mesurada en Chrome: 95 px, amb la lletra de reserva) i el gap la porta a 110', () => {
    expect(fila).toBeCloseTo(110, 0);
  });

  test('amb la fila davant, el visor guanya a la regla de sèrie, en escriptori i en mòbil, i en este ordre', () => {
    const base = regles('src/css/modules.css', VISOR_BASE);
    const ambFila = regles('src/css/modules.css', VISOR_AMB_FILA);
    expect(ambFila.map((r) => r.context)).toEqual([[], MOBIL]);
    expect(especificitat(VISOR_AMB_FILA)).toBeGreaterThan(especificitat(VISOR_BASE));
    // La de mòbil (mateixa especificitat) va després de la d'escriptori.
    expect(ambFila[1].ordre).toBeGreaterThan(ambFila[0].ordre);
    expect(base.map((r) => r.context)).toEqual([[], MOBIL]);
  });

  /* L'invariant de T3: el visor no passa de l'espai que la regla de sèrie li
     deixa (el seu min(), sense el sòl: 100vh menys el que no és visor, i 22rem
     quan el diàleg ja no creix), ara menys la fila; amb el sòl de 10rem quan
     la pantalla és molt curta. */
  test.each([
    ['escriptori', [], [[1280, 800], [1280, 720], [1440, 900], [1920, 1080], [1366, 768], [768, 1024]]],
    ['mòbil', MOBIL, [[375, 812], [390, 844], [360, 740], [414, 896]]],
  ])('%s: visor + fila caben on abans cabia el visor sol', (_nom, context, pantalles) => {
    const valorBase = regles('src/css/modules.css', VISOR_BASE).find((r) => JSON.stringify(r.context) === JSON.stringify(context)).decls['max-height'];
    const senseSol = /^max\(10rem, (.*)\)$/.exec(valorBase);
    expect(senseSol).not.toBeNull();
    const regla = regles('src/css/modules.css', VISOR_AMB_FILA).find((r) => JSON.stringify(r.context) === JSON.stringify(context));
    expect(regla).toBeTruthy();
    const sol = avalua('10rem', 0);
    for (const [, alt] of pantalles) {
      const visor = avalua(regla.decls['max-height'], alt);
      const lliure = avalua(senseSol[1], alt);
      expect(visor + 0.5, `${alt}px: el sòl de 10rem`).toBeGreaterThan(sol);
      if (visor > sol + 0.5) expect(visor + fila, `${alt}px: visor ${visor} + fila ${fila} dins de ${lliure}`).toBeLessThanOrEqual(lliure + 0.5);
    }
    // 1280 × 800 (el cas de la troballa): el visor es queda en 178 px i, amb la fila, caben dins dels 288 de sèrie.
    if (!context.length) expect(avalua(regla.decls['max-height'], 800)).toBeCloseTo(178, 0);
  });
});
