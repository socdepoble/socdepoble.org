// @vitest-environment node
/* Crítica de correcció del lliurament R22 · La icona de «Silenciada» que el kit
   de Gemini R22 (T1) posa al costat del nom, a la capçalera de la conversa
   (CapcaleraConversa.jsx · .sdp-xat-capcalera__silenci), va damunt de la fila 1
   de la columna, que és fosca en els dos temes (--sdp-workspace-fila1-fons, la
   roca). Es pintava amb --sdp-text-suau, el gris pensat per als fons clars: en
   clar quedava a 1,77:1 i en Bancal clar a 1,44:1, quasi invisible (WCAG 1.4.11
   en demana 3:1 i Pedra Seca, AAA). La línia de davall de la mateixa capçalera
   (.sdp-xat-capcalera__sub) ja pinta amb el crom.
   jsdom no resol la cascada: la prova llig les regles escrites i els tokens de
   veres (design-tokens.css i tokens.css), en clar, en fosc i en Bancal, i
   compon el color translúcid damunt del fons, com rocaIGuardes.capes.test.js. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** Les regles d'un full amb el seu context d'at-rules (@layer, @media…). */
function regles(css) {
  const net = senseComentaris(css);
  const eixida = [];
  const context = [];
  let inici = 0;
  for (let i = 0; i < net.length; i += 1) {
    const c = net[i];
    if (c === ';') { inici = i + 1; continue; }
    if (c === '}') { context.pop(); inici = i + 1; continue; }
    if (c !== '{') continue;
    const preludi = net.slice(inici, i).trim();
    if (preludi.startsWith('@')) { context.push(preludi); inici = i + 1; continue; }
    let prof = 1;
    let j = i + 1;
    for (; j < net.length && prof; j += 1) {
      if (net[j] === '{') prof += 1;
      else if (net[j] === '}') prof -= 1;
    }
    eixida.push({
      selectors: preludi.split(',').map((s) => s.trim().replace(/\s+/g, ' ')),
      cos: net.slice(i + 1, j - 1),
      context: [...context]
    });
    i = j - 1;
    inici = j;
  }
  return eixida;
}

const declaracions = (cos) => [...cos.matchAll(/(--[\w-]+|[a-z-]+)\s*:\s*([^;]+)/g)]
  .map((m) => [m[1], m[2].trim()]);

const TOKENS = [...regles(llig('src/css/design-tokens.css')), ...regles(llig('src/css/tokens.css'))]
  .filter((r) => !r.context.some((c) => c.startsWith('@media')));
const esDeTema = (r, { fosc, bancal }) => r.selectors.every((s) => /^(?::root|:host|\.sdp-root)/.test(s))
  && r.selectors.every((s) => s.includes('data-theme="dark"') === fosc && s.includes('data-contrast="bancal"') === bancal);
function mapa(...capes) {
  const m = new Map();
  for (const capa of capes) {
    for (const r of TOKENS.filter((x) => esDeTema(x, capa))) {
      for (const [p, v] of declaracions(r.cos)) if (p.startsWith('--')) m.set(p, v);
    }
  }
  return m;
}
const CLAR = { fosc: false, bancal: false };
const FOSC = { fosc: true, bancal: false };
const BANCAL = { fosc: false, bancal: true };
const BANCAL_FOSC = { fosc: true, bancal: true };
const TEMES = [
  ['clar', mapa(CLAR)],
  ['fosc', mapa(CLAR, FOSC)],
  ['Bancal clar', mapa(CLAR, BANCAL)],
  ['Bancal fosc', mapa(CLAR, FOSC, BANCAL, BANCAL_FOSC)]
];

function resol(valor, m, salts = 0) {
  const ref = String(valor).trim().match(/^var\((--[\w-]+)\)$/);
  if (!ref) return String(valor).trim();
  expect(salts, `cicle a ${ref[1]}`).toBeLessThan(20);
  expect(m.has(ref[1]), `falta ${ref[1]}`).toBe(true);
  return resol(m.get(ref[1]), m, salts + 1);
}
function color(valor, m) {
  const v = resol(valor, m).toLowerCase();
  const hex = v.match(/^#([0-9a-f]{6})$/);
  if (hex) return { r: parseInt(hex[1].slice(0, 2), 16), g: parseInt(hex[1].slice(2, 4), 16), b: parseInt(hex[1].slice(4, 6), 16), a: 1 };
  const rgb = v.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/);
  expect(rgb, `${valor} → ${v}: un color que la prova sàpia llegir`).not.toBeNull();
  return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]), a: rgb[4] === undefined ? 1 : Number(rgb[4]) };
}
const sobre = (dalt, baix) => ({
  r: dalt.r * dalt.a + baix.r * (1 - dalt.a),
  g: dalt.g * dalt.a + baix.g * (1 - dalt.a),
  b: dalt.b * dalt.a + baix.b * (1 - dalt.a),
  a: 1
});
const lineal = (canal) => {
  const s = canal / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const lluminancia = ({ r, g, b }) => 0.2126 * lineal(r) + 0.7152 * lineal(g) + 0.0722 * lineal(b);
const contrast = (a, b) => {
  const [clar, fosc] = [lluminancia(a), lluminancia(b)].sort((x, y) => y - x);
  return (clar + 0.05) / (fosc + 0.05);
};

const MODULS = regles(llig('src/css/modules.css')).filter((r) => !r.context.some((c) => c.startsWith('@media')));
function propietat(selector, nom) {
  const valors = MODULS.filter((r) => r.selectors.includes(selector))
    .flatMap((r) => declaracions(r.cos)).filter(([p]) => p === nom).map(([, v]) => v);
  expect(valors.length, `${selector} { ${nom} }`).toBeGreaterThan(0);
  return valors.at(-1);
}

describe('capçalera de la conversa · la icona «Silenciada» es veu damunt de la roca', () => {
  test.each(TEMES)('en %s, la icona fa 7:1 o més contra el fons de la capçalera', (_nom, m) => {
    const fons = color(propietat('.sdp-xat-capcalera', 'background'), m);
    const valor = propietat('.sdp-xat-capcalera__silenci', 'color');
    const pintura = valor === 'inherit' || valor === 'currentColor'
      ? propietat('.sdp-xat-capcalera', 'color')
      : valor;
    expect(contrast(sobre(color(pintura, m), fons), fons)).toBeGreaterThanOrEqual(7);
  });
});
