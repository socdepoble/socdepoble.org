// @vitest-environment node
/* Ordre del Mestre (261007) · Les mides dels emojis, segons la columna.
     · PRIMERA columna (l'arbre i els rails plegats, NavGlyph · .sdp-nav-glyph):
       l'emoji NO és XL; fa la mida menuda de la icona de Lucide germana de la
       mateixa columna. La icona de Lucide no es toca.
     · SEGONA columna (la fitxa, ItemMedia) i el quadrat de la targeta viva:
       l'emoji SÍ és XL, proporcional al quadrat.
   jsdom no fa layout: es llig la regla escrita (modules.css, components.css),
   es resolen els tokens com el navegador (tokens.css, 1rem = 16px) i es llig
   la mida que el JSX dona a la icona (UniversalWorkspace.jsx).
   Criteri de «la mateixa mida»: la icona de Lucide dibuixa al llenç de 24
   unitats amb 2 unitats d'aire per costat (20 de 24, 5/6 de la caixa); l'emoji
   ocupa la seua caixa sencera. L'emoji casa amb la icona quan la seua mida va
   de la part dibuixada (5/6 de la caixa) a la caixa sencera, sense passar-la. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from 'vitest';

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');
const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** Regles fulla: { prelud, cos } (també les de dins de @layer i @media). */
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
      const marc = pila.pop();
      if (marc && !marc.fills) eixida.push({ prelud: marc.prelud, cos: tros.replace(/\s+/g, ' ').trim() });
      tros = '';
    } else {
      tros += c;
    }
  }
  return eixida;
}

/** El valor d'una propietat a les regles amb eixe prelud exacte (mana la darrera). */
const valorDe = (full, prelud, propietat) => full
  .filter((r) => r.prelud === prelud)
  .flatMap((r) => r.cos.split(';').map((d) => d.trim()).filter((d) => d.startsWith(`${propietat}:`)))
  .map((d) => d.slice(propietat.length + 1).trim())
  .pop();

const TOKENS = llig('src/css/tokens.css');
/** Un token de :root (la primera declaració del nom). */
const token = (nom) => new RegExp(`${nom}\\s*:\\s*([^;]+);`).exec(senseComentaris(TOKENS))?.[1].trim();

/** px d'un valor: literal (px, rem), var() o calc() de var() per un factor. */
function px(valor) {
  const v = String(valor ?? '').trim();
  const variable = /^var\((--[\w-]+)\)$/.exec(v);
  if (variable) return px(token(variable[1]));
  const calc = /^calc\(var\((--[\w-]+)\) \* (\d+) \/ (\d+)\)$/.exec(v);
  if (calc) return px(token(calc[1])) * Number(calc[2]) / Number(calc[3]);
  const literal = /^(\d*\.?\d+)(px|rem)$/.exec(v);
  if (literal) return Number(literal[1]) * (literal[2] === 'rem' ? 16 : 1);
  return null;
}

const MODULS = regles(llig('src/css/modules.css'));
const COMPONENTS = regles(llig('src/css/components.css'));
const WORKSPACE = llig('src/components/universal/workspace/UniversalWorkspace.jsx');

/* La part que dibuixa una icona de Lucide: 20 de les 24 unitats del llenç. */
const dibuixada = (caixa) => caixa * 20 / 24;
/** L'emoji casa amb la icona de Lucide germana: ni més menut que el seu dibuix ni més gran que la seua caixa. */
const casa = (emoji, caixa) => emoji >= dibuixada(caixa) - 1e-9 && emoji <= caixa + 1e-9;

/* La mida que el JSX dona al NavGlyph d'un context (l'element que l'envolta). */
const midaDelJsx = (patroContext) => {
  const m = new RegExp(`${patroContext}[\\s\\S]{0,400}?<NavGlyph[\\s\\S]*?size=\\{(\\d+)\\}`).exec(WORKSPACE);
  return m ? Number(m[1]) : null;
};

test('la mesura: el criteri trau un emoji més gran que la icona i un de massa menut, i resol els tokens', () => {
  expect(casa(24, 20)).toBe(false);
  expect(casa(16, 24)).toBe(false);
  expect(casa(20, 24)).toBe(true);
  expect(casa(20, 20)).toBe(true);
  expect([px('var(--sdp-text-h6)'), px('var(--sdp-text-h5)'), px('1.5rem'), px('24px')]).toEqual([20, 24, 24, 24]);
  expect(px('calc(var(--sdp-fitxa-mida) * 11 / 16)')).toBe(66);
});

test('PRIMERA columna · arbre: l’emoji fa la mida de la carpeta de Lucide germana (20px de 24 de caixa), sense tocar la icona', () => {
  // La icona de Lucide de l'arbre: el JSX li demana 18 i el full la fixa a 24 (no es toca).
  expect(midaDelJsx('className="sdp-workspace-nav-item__icon"')).toBe(18);
  const caixa = px(valorDe(MODULS, '.sdp-workspace-nav-item__icon svg', 'width'));
  expect([caixa, px(valorDe(MODULS, '.sdp-workspace-nav-item__icon svg', 'height'))]).toEqual([24, 24]);
  const emoji = px(valorDe(MODULS, '.sdp-nav-glyph', 'font-size'));
  expect(emoji).toBe(20);
  expect(casa(emoji, caixa), `emoji ${emoji}px amb una Lucide de ${caixa}px`).toBe(true);
});

test('PRIMERA columna · rail plegat: l’emoji fa la mida de la Lucide germana (20px), ja no la passa', () => {
  // Les dues icones dels rails (carpetes i documents) són de 20px, i cap regla les canvia.
  expect(midaDelJsx('className="sdp-workspace-rail__boto"\\s+aria-label=\\{category\\.label\\}')).toBe(20);
  expect(midaDelJsx('className="sdp-workspace-rail__boto"\\s+aria-label=\\{titol\\}')).toBe(20);
  expect(MODULS.filter((r) => /sdp-workspace-rail[\w-]*.*\bsvg\b/.test(r.prelud) && /\b(width|height)\s*:/.test(r.cos)).map((r) => r.prelud)).toEqual([]);
  const emoji = px(valorDe(MODULS, '.sdp-workspace-rail .sdp-nav-glyph', 'font-size'));
  expect(emoji).toBe(20);
  expect(casa(emoji, 20), `emoji ${emoji}px amb una Lucide de 20px`).toBe(true);
});

test('cap emoji de la navegació és XL: l’XL és de la fitxa i del quadrat de la targeta, proporcional al quadrat', () => {
  const navegacio = [
    px(valorDe(MODULS, '.sdp-nav-glyph', 'font-size')),
    px(valorDe(MODULS, '.sdp-workspace-rail .sdp-nav-glyph', 'font-size'))
  ];
  // SEGONA columna: 11/16 del quadrat de la fitxa (96px, i 86px al Bloc de Notes).
  const fitxa = px(valorDe(MODULS, '.sdp-fitxa-emoji-xl', 'font-size'));
  const notes = px(valorDe(MODULS, '.sdp-bloc-list--notes .sdp-fitxa-emoji-xl', 'font-size'));
  expect([fitxa, notes]).toEqual([66, 86 * 11 / 16]);
  expect(fitxa / px('var(--sdp-fitxa-mida)')).toBe(11 / 16);
  // Dins del document: l'emoji del quadrat de la targeta (88px de 128).
  const quadrat = px(valorDe(COMPONENTS, '.sp-card-calendar-badge__emoji', 'font-size'));
  expect(quadrat).toBe(88);
  for (const xl of [fitxa, notes, quadrat]) {
    for (const menut of navegacio) expect(xl, `${xl}px XL contra ${menut}px de navegació`).toBeGreaterThan(menut * 2);
  }
  // La regla XL de la fitxa no arriba a la navegació.
  expect(MODULS.filter((r) => /sdp-fitxa-emoji-xl/.test(r.prelud) && /sdp-nav-glyph|sdp-workspace-(rail|nav-item)/.test(r.prelud))).toEqual([]);
});
