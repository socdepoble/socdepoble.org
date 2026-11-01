// @vitest-environment node
/* P1-67 (Llibre Mestre: «espaiat interior net i harmònic»; assalt 261101,
   T7 · S4, Millora Proactiva Reversible) · A la targeta de conversa de 96px
   (.sdp-xat-fila sense --senzilla: la llista de converses i de comunitats, la
   cerca, el diàleg de conversa nova i els espècimens del catàleg), el buit
   entre l'avatar de 76 i el text és --sdp-space-4 (16), el mateix que el
   coixí lateral: 16 | 76 | 16 | text | 16. La regla compartida (.sdp-xat-fila, .sdp-xat-opcio) conserva el gap de
   12 i el coixí de 8 | 16; l'opció dels Ajustos i la fila senzilla de 72 no
   reben cap gap propi; l'alçada (96) i l'avatar (76) no canvien. En mode de
   selecció, el cercle de tria també queda a 16 de l'avatar (abans 12): és un
   fill directe de la fila, sense marge propi (Gauntlet UI-01).
   jsdom no resol la cascada: es comproven les regles escrites, amb la capa
   que les embolcalla, l'ordre i l'especificitat (el parser és el de
   menusXatTipografia.capes.test.js). La guarda es prova també contra el full
   d'abans i contra regles mal posades: si no les detectara, no guardaria res. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(resolve(ARREL, ruta), 'utf8');
const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const net = (text) => text.replace(/\s+/g, ' ').trim();

/** Regles fulla, en l'ordre del full, amb les @-regles que les embolcallen. */
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
        eixida.push({ selectors: preludi.split(',').map(net), cos: net(buf), context: pila.filter((p) => p.startsWith('@')), ordre: eixida.length });
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
const valorDe = (regla, propietat) => declaracions(regla.cos).filter(([p]) => p === propietat).map(([, v]) => v).pop();
/** Especificitat (classes, atributs i pseudoclasses; :not() compta pel seu argument). */
const pes = (selector) => (selector.replace(/:not\(/g, '(').match(/\.[\w-]+|\[[^\]]*\]|:(?!:)[\w-]+/g) || []).length;

const MODULES = llig('src/css/modules.css');
const TOKENS = senseComentaris(llig('src/css/tokens.css'));
const token = (nom) => TOKENS.match(new RegExp(`${nom}\\s*:\\s*([^;]+);`))?.[1].trim();

const TARGETA = '.sdp-xat-fila:not(.sdp-xat-fila--senzilla)';

/** Els problemes de P1-67 d'un full; [] vol dir que és la decisió exacta. */
function problemesP167(css) {
  const totes = regles(css);
  const problemes = [];
  const comuna = totes.filter((r) => r.selectors.includes('.sdp-xat-fila') && r.selectors.includes('.sdp-xat-opcio') && valorDe(r, 'gap'));
  if (comuna.length !== 1) problemes.push(`regles compartides amb gap: ${comuna.length}`);
  const [compartida] = comuna;
  if (compartida && (valorDe(compartida, 'gap') !== 'var(--sdp-space-3)' || valorDe(compartida, 'padding') !== 'var(--sdp-space-2) var(--sdp-space-4)')) {
    problemes.push(`la compartida ha canviat: ${compartida.cos}`);
  }
  const propies = totes.filter((r) => r.selectors.includes(TARGETA) && valorDe(r, 'gap'));
  if (propies.length !== 1) problemes.push(`regles de gap de la targeta: ${propies.length}`);
  const [propia] = propies;
  if (propia) {
    if (propia.selectors.length !== 1) problemes.push(`la regla de la targeta comparteix selector: ${propia.selectors.join(', ')}`);
    if (valorDe(propia, 'gap') !== 'var(--sdp-space-4)') problemes.push(`gap de la targeta: ${valorDe(propia, 'gap')}`);
    if (declaracions(propia.cos).length !== 1) problemes.push(`la regla de la targeta fa més coses: ${propia.cos}`);
    if (JSON.stringify(propia.context) !== '["@layer components"]') problemes.push(`capa: ${JSON.stringify(propia.context)}`);
    if (compartida && (propia.ordre < compartida.ordre || pes(TARGETA) <= pes('.sdp-xat-fila'))) problemes.push('no guanya la compartida');
  }
  // Ni l'opció dels Ajustos ni la fila senzilla reben cap gap propi.
  const alienes = totes.filter((r) => valorDe(r, 'gap') && r.selectors.some((s) => /^\.sdp-xat-opcio(?![\w-])|^\.sdp-xat-fila--senzilla$|^\.sdp-xat-fila\.sdp-xat-fila--senzilla$/.test(s)) && !r.selectors.includes('.sdp-xat-fila'));
  if (alienes.length) problemes.push(`gap propi a l'opció o a la fila senzilla: ${alienes.map((r) => r.selectors.join(', ')).join(' | ')}`);
  return problemes;
}

describe('P1-67 · el ritme 16 | 76 | 16 | text | 16 de la targeta de conversa', () => {
  test('modules.css porta la decisió exacta i res més', () => {
    expect(problemesP167(MODULES)).toEqual([]);
  });

  test('els tokens: 16 de gap i de coixí lateral, 8 de coixí vertical, fila de 96 i avatar de 76 (sense canvis)', () => {
    expect([token('--sdp-space-2'), token('--sdp-space-3'), token('--sdp-space-4')]).toEqual(['8px', '12px', '16px']);
    expect(token('--sdp-xat-fila-mida')).toBe('calc(2 * var(--sdp-touch))');
    expect(token('--sdp-touch')).toBe('48px');
    expect(token('--sdp-xat-avatar-mida')).toBe('76px');
    expect(token('--sdp-xat-fila-senzilla-mida')).toBe('72px');
  });

  test('l’avatar i el coixí vertical del full continuen cabent en la fila (8 + 76 + 8 ≤ 96)', () => {
    const [compartida] = regles(MODULES).filter((r) => r.selectors.includes('.sdp-xat-fila') && r.selectors.includes('.sdp-xat-opcio') && valorDe(r, 'gap'));
    const px = (valor) => parseFloat(String(valor).replace(/^var\((--[\w-]+)\)$/, (_, nom) => token(nom)));
    const vertical = px(valorDe(compartida, 'padding').split(' ')[0]);
    const avatar = px(token('--sdp-xat-avatar-mida'));
    const fila = 2 * px(token('--sdp-touch'));
    expect([vertical, avatar, fila]).toEqual([8, 76, 96]);
    expect(2 * vertical + avatar).toBeLessThanOrEqual(fila);
  });

  test('en mode de selecció, el cercle de tria també queda a 16 de l’avatar (abans 12): fill directe i sense marge propi', () => {
    // Fill directe de la fila, just davant de l'avatar, a les dues files que es poden triar.
    const fila = llig('src/sections/xat/components/FilaConversa.jsx');
    expect(fila.match(/\{seleccio \? <MarcaTria triada=\{seleccio\.triada\} \/> : null\}\s*<Avatar(?:Fil|Comunitat) /g)).toHaveLength(2);
    // Cap regla no li dona marge ni coixí: el buit fins a l'avatar és el gap de la fila.
    const tria = regles(MODULES).filter((r) => r.selectors.some((s) => /\.sdp-xat-fila__tria(?![\w-])/.test(s)));
    expect(tria.length).toBeGreaterThan(0);
    for (const regla of tria) {
      expect(declaracions(regla.cos).map(([p]) => p).filter((p) => /^(?:margin|padding)/.test(p)), regla.selectors.join(', ')).toEqual([]);
    }
  });

  test('cap regla de la targeta no toca el coixí ni l’alçada (el gap és horitzontal)', () => {
    const totes = regles(MODULES).filter((r) => r.selectors.includes(TARGETA));
    for (const regla of totes) {
      expect([valorDe(regla, 'padding'), valorDe(regla, 'min-height'), valorDe(regla, 'height')], regla.cos).toEqual([undefined, undefined, undefined]);
    }
  });
});

describe('la guarda mossega (mutacions)', () => {
  const REGLA = '.sdp-xat-fila:not(.sdp-xat-fila--senzilla) { gap: var(--sdp-space-4); }';
  test('el full ha de contindre la regla, una sola vegada', () => {
    expect(MODULES.split(REGLA)).toHaveLength(2);
  });
  test.each([
    ['el full d’abans (sense la regla)', () => MODULES.replace(REGLA, '')],
    ['un altre valor (12)', () => MODULES.replace(REGLA, REGLA.replace('--sdp-space-4', '--sdp-space-3'))],
    ['un valor en px (no és un token)', () => MODULES.replace(REGLA, REGLA.replace('var(--sdp-space-4)', '16px'))],
    ['la regla fora de @layer components', () => `${MODULES.replace(REGLA, '')}\n${REGLA}\n`],
    ['la regla compartida canviada a 16', () => MODULES.replace(/(\.sdp-xat-fila,\s*\.sdp-xat-opcio \{[^}]*?gap: )var\(--sdp-space-3\)/, '$1var(--sdp-space-4)')],
    ['un gap propi a l’opció dels Ajustos', () => MODULES.replace(REGLA, `${REGLA}\n  .sdp-xat-opcio { gap: var(--sdp-space-4); }`)],
    ['un gap propi a la fila senzilla', () => MODULES.replace(REGLA, `${REGLA}\n  .sdp-xat-fila--senzilla { gap: var(--sdp-space-4); }`)],
    ['la regla fa també el coixí', () => MODULES.replace(REGLA, REGLA.replace('gap: var(--sdp-space-4);', 'gap: var(--sdp-space-4); padding: 0;'))]
  ])('%s → la guarda ho veu', (_nom, mutacio) => {
    const mutat = mutacio();
    expect(mutat).not.toBe(MODULES);
    expect(problemesP167(mutat).length).toBeGreaterThan(0);
  });
});
