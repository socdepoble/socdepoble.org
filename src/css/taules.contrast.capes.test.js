// @vitest-environment node
/* P1-16 (pla 261028_1526 §3.5.1; abast aprovat: .sdp-taula-prosa) · La
   capçalera d'una taula de prosa es distingix de TOTES les files en clar i en
   fosc: ΔE2000 ≥ 5 contra la fila parell (--sdp-fons-subtil), contra la
   senanra, que és transparent i deixa vore la superfície que la porta
   (l'app, la targeta, l'elevat, la superfície i, en clar, la lectura), i
   contra la fila sota el ratolí (--sdp-accent-subtil). El títol hi fa AAA.
   La prova llig els tokens de veres i els resol fins al hex. El CIEDE2000 és
   el de Sharma, Wu i Dalal (2005), comprovat amb tres parelles del seu joc de
   dades. La resta de taules (sdp.css) no canvia: el restil global no està
   aprovat. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
// Decisió del Mestre (30-10-2026) · El var() esperat es compon: tractor-tokens (T4) llig src sencer.
const varDe = (nom) => ['var(', nom, ')'].join('');
const senseComentaris = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '');
const declaracions = (text) => Object.fromEntries(
  [...senseComentaris(text).matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()])
);
const TOKENS = llig('src/css/tokens.css');
function bloc(text, selector) {
  const inici = text.indexOf(`\n${selector} {`);
  expect(inici, `falta el bloc ${selector}`).toBeGreaterThan(-1);
  const obre = text.indexOf('{', inici);
  let prof = 0;
  for (let i = obre; i < text.length; i++) {
    if (text[i] === '{') prof++;
    if (text[i] === '}' && --prof === 0) return text.slice(obre + 1, i);
  }
  throw new Error(`bloc sense tancar: ${selector}`);
}
const PRINCIPAL = declaracions(bloc(TOKENS, ':root, :host, .sdp-root'));
const FOSC = declaracions(bloc(TOKENS, ':root[data-theme="dark"], :host([data-theme="dark"]),\n:root[data-theme="dark"] .sdp-root, :host([data-theme="dark"]) .sdp-root'));
const CLAR = { ...declaracions(llig('src/css/design-tokens.css')), ...PRINCIPAL };
const TEMES = Object.freeze({ clar: CLAR, fosc: { ...CLAR, ...FOSC } });

function resol(valor, mapa, vistos = new Set()) {
  return valor.replace(/var\((--[\w-]+)\)/g, (_, nom) => {
    expect(vistos.has(nom), `cicle a ${nom}`).toBe(false);
    expect(mapa[nom], `falta ${nom}`).toBeDefined();
    return resol(mapa[nom], mapa, new Set([...vistos, nom]));
  }).trim();
}
const hex = (token, mapa) => {
  const valor = resol(`var(${token})`, mapa);
  expect(valor, `${token}: color opac de sis xifres`).toMatch(/^#[0-9a-f]{6}$/i);
  return valor;
};

/* sRGB (D65) → CIELAB. */
const lineal = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
function lab(color) {
  const [r, g, b] = color.slice(1).match(/../g).map((x) => lineal(parseInt(x, 16) / 255));
  const x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047;
  const y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b;
  const z = (0.0193339 * r + 0.1191920 * g + 0.9503041 * b) / 1.08883;
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

/** CIEDE2000 entre dos colors (hex o [L, a, b]). */
function deltaE2000(u, v) {
  const [L1, a1, b1] = Array.isArray(u) ? u : lab(u);
  const [L2, a2, b2] = Array.isArray(v) ? v : lab(v);
  const graus = Math.PI / 180;
  const Cb = (Math.hypot(a1, b1) + Math.hypot(a2, b2)) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)));
  const a1p = (1 + G) * a1;
  const a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1);
  const C2p = Math.hypot(a2p, b2);
  const to = (b, a) => (a === 0 && b === 0 ? 0 : (Math.atan2(b, a) / graus + 360) % 360);
  const h1p = to(b1, a1p);
  const h2p = to(b2, a2p);
  const dL = L2 - L1;
  const dC = C2p - C1p;
  let dh = 0;
  if (C1p * C2p !== 0) {
    dh = h2p - h1p;
    if (dh > 180) dh -= 360;
    else if (dh < -180) dh += 360;
  }
  const dH = 2 * Math.sqrt(C1p * C2p) * Math.sin((dh * graus) / 2);
  const Lb = (L1 + L2) / 2;
  const Cbp = (C1p + C2p) / 2;
  let hb = h1p + h2p;
  if (C1p * C2p !== 0) hb = Math.abs(h1p - h2p) <= 180 ? hb / 2 : (hb + (hb < 360 ? 360 : -360)) / 2;
  const T = 1 - 0.17 * Math.cos((hb - 30) * graus) + 0.24 * Math.cos(2 * hb * graus)
    + 0.32 * Math.cos((3 * hb + 6) * graus) - 0.20 * Math.cos((4 * hb - 63) * graus);
  const dTh = 30 * Math.exp(-(((hb - 275) / 25) ** 2));
  const RC = 2 * Math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7));
  const SL = 1 + (0.015 * (Lb - 50) ** 2) / Math.sqrt(20 + (Lb - 50) ** 2);
  const SC = 1 + 0.045 * Cbp;
  const SH = 1 + 0.015 * Cbp * T;
  const RT = -Math.sin(2 * dTh * graus) * RC;
  return Math.sqrt((dL / SL) ** 2 + (dC / SC) ** 2 + (dH / SH) ** 2 + RT * (dC / SC) * (dH / SH));
}

const luminancia = (color) => {
  const [r, g, b] = color.slice(1).match(/../g).map((x) => lineal(parseInt(x, 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

/* Les files de cada tema: la parell, la senar (la superfície que la porta) i la del ratolí. */
const FILES = Object.freeze({
  clar: ['--sdp-fons-subtil', '--sdp-fons-app', '--sdp-fons-targeta', '--sdp-fons-elevat', '--sdp-fons-superficie', '--sdp-fons-lectura', '--sdp-accent-subtil'],
  fosc: ['--sdp-fons-subtil', '--sdp-fons-app', '--sdp-fons-targeta', '--sdp-fons-elevat', '--sdp-fons-superficie', '--sdp-accent-subtil']
});
const TOKEN = '--sdp-taula-capcalera-fons';

describe('CIEDE2000 · el càlcul de la prova', () => {
  test.each([
    // Sharma, Wu i Dalal (2005), taula 1: parelles 1, 7 i 17.
    [[50, 2.6772, -79.7751], [50, 0, -82.7485], 2.0425],
    [[50, 0, 0], [50, -1, 2], 2.3669],
    [[50, 2.5, 0], [73, 25, -18], 27.1492]
  ])('%j · %j → %f', (u, v, esperat) => {
    expect(deltaE2000(u, v)).toBeCloseTo(esperat, 4);
  });

  test('un color amb ell mateix és 0, i l’ordre no compta', () => {
    const [a, b] = [hex('--sdp-pedra-300', CLAR), hex('--sdp-pedra-200', CLAR)];
    expect(deltaE2000(a, a)).toBe(0);
    expect(deltaE2000(a, b)).toBeCloseTo(deltaE2000(b, a), 10);
  });
});

describe('P1-16 · la capçalera de .sdp-taula-prosa', () => {
  test('el token: pedra-300 en clar i pedra-650 en fosc, declarat una vegada a cada tema', () => {
    expect(PRINCIPAL[TOKEN]).toBe(varDe('--sdp-pedra-300'));
    expect(FOSC[TOKEN]).toBe(varDe('--sdp-pedra-650'));
    expect(senseComentaris(TOKENS).match(new RegExp(`${TOKEN}\\s*:`, 'g'))).toHaveLength(2);
    // Els primitius no canvien amb el tema: el fosc pinta la pedra-650 de l'escala.
    expect([hex(TOKEN, TEMES.clar), hex(TOKEN, TEMES.fosc)]).toEqual([hex('--sdp-pedra-300', CLAR), hex('--sdp-pedra-650', CLAR)]);
  });

  test.each(Object.keys(TEMES))('%s: ΔE2000 ≥ 5 contra cada fons de fila', (tema) => {
    const mapa = TEMES[tema];
    const capcalera = hex(TOKEN, mapa);
    const mesures = Object.fromEntries(FILES[tema].map((fila) => [fila, Number(deltaE2000(capcalera, hex(fila, mapa)).toFixed(2))]));
    for (const [fila, de] of Object.entries(mesures)) expect(de, `${tema} · ${fila}`).toBeGreaterThanOrEqual(5);
    // Les mesures del recon (P1-16): la parella és la més justa.
    expect(mesures['--sdp-fons-subtil']).toBe(tema === 'clar' ? 5.19 : 8.69);
  });

  test.each(Object.keys(TEMES))('%s: el títol i l’enllaç de la capçalera, AAA', (tema) => {
    const mapa = TEMES[tema];
    expect(contrast(hex('--sdp-text-titol', mapa), hex(TOKEN, mapa))).toBeGreaterThanOrEqual(7);
  });

  test('components.css el consumix només dins de .sdp-taula-prosa, i l’enllaç de la capçalera pren el color del títol', () => {
    const components = senseComentaris(llig('src/css/components.css')).replace(/\s+/g, ' ');
    expect(components).toContain('.sdp-taula-prosa :where(thead th) { background: var(--sdp-taula-capcalera-fons); }');
    expect(components).toContain('.sdp-taula-prosa :where(thead th a) { color: var(--sdp-text-titol); text-decoration: underline; }');
    expect(components.match(/var\(--sdp-taula-capcalera-fons\)/g)).toHaveLength(1);
    // La regla global de sdp.css no canvia: cap restil de totes les taules.
    expect(senseComentaris(llig('src/css/sdp.css')).replace(/\s+/g, ' ')).toMatch(/:where\(thead th\) \{ background: var\(--sdp-fons-app\);/);
  });
});
