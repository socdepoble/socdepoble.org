// @vitest-environment node
/* P1-16 (pla 261028_1526 §3.5.1) i PS-03 (B7, marató 261101_2143) · La
   capçalera de TOTA taula es distingix de totes les files en clar i en fosc:
   ΔE2000 ≥ 5 contra la fila parell (--sdp-fons-subtil), contra la senar, que
   és transparent i deixa vore la superfície que la porta (l'app, la targeta,
   l'elevat, la superfície i, en clar, la lectura), i contra la fila sota el
   ratolí (--sdp-accent-subtil). El títol i l'enllaç de la capçalera hi fan
   AAA. La prova llig els tokens de veres i els resol fins al hex. El
   CIEDE2000 és el de Sharma, Wu i Dalal (2005), comprovat amb tres parelles
   del seu joc de dades.
   PS-03 gira la frontera de P1-16: el fons és la regla d'elements de sdp.css
   (abans, només .sdp-taula-prosa). jsdom no resol capes: la prova llig l'ordre
   de @layer d'index.css i comprova qui guanya. Les graelles de calendari i la
   factura conserven el seu fons, cadascuna amb una regla de capa components.
   El cens (corrector B7c) tanca les dues portes per on PS-03 es podia desfer
   sense que caiguera res: una regla d'elements de capa guanyadora (sense
   classe, pinta totes les taules) i una cel·la de capçalera marcada només per
   classe als components (el cas «Accions» de l'Inventari), que guanya el
   token si ningú la torna a pintar dins de thead. */
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
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

/* ── La cascada escrita: regles fulla amb els blocs que les contenen ── */
/** Regles fulla d'un full: { prelud, cos, pares } (pares: els preludis dels blocs que la contenen). */
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
      if (marc && !marc.fills) eixida.push({ prelud: marc.prelud, cos: tros.replace(/\s+/g, ' ').trim(), pares: pila.map((p) => p.prelud) });
      tros = '';
    } else {
      tros += c;
    }
  }
  return eixida;
}
/** Selectors d'un prelud, tallats per les comes de primer nivell (no les de dins de :where()). */
const selectors = (prelud) => prelud.split(/,(?![^(]*\))/).map((s) => s.trim());
const valorDe = (regla, propietat) => regla.cos.split(';').map((d) => d.trim())
  .filter((d) => d.startsWith(`${propietat}:`)).map((d) => d.slice(propietat.length + 1).trim()).pop();
/** La capa d'una regla: el @layer més extern que la conté, el que s'ordena amb els altres (null si no en té cap). */
const capaDe = (regla) => regla.pares.filter((p) => p.startsWith('@layer ')).map((p) => p.slice(7).trim())[0] ?? null;

/* L'ordre de les capes el fixa la sentència d'index.css: la posterior guanya, siga quina siga l'especificitat. */
const ORDRE = (() => {
  const m = senseComentaris(llig('src/css/index.css')).match(/@layer\s+([\w\s,-]+);/);
  expect(m, 'index.css declara l’ordre de les capes').not.toBeNull();
  return m[1].split(',').map((c) => c.trim());
})();
/* Una declaració sense capa guanya totes les capes (CSS Cascade 5): va darrere de l'última. */
const posicio = (capa) => {
  if (capa === null) return ORDRE.length;
  expect(ORDRE, `la capa ${capa} és a l'ordre d'index.css`).toContain(capa);
  return ORDRE.indexOf(capa);
};

const FULLS = readdirSync(resolve(process.cwd(), 'src/css')).filter((nom) => nom.endsWith('.css')).sort();
/* Els @import d'index.css, en l'ordre de la cascada. Els fulls de fora de src/css entren amb layer(): les seues regles viuen en eixa capa. */
const IMPORTS = [...senseComentaris(llig('src/css/index.css')).matchAll(/@import\s+url\('([^']+\.css)'\)(?:\s+layer\(([\w-]+)\))?\s*;/g)]
  .map((m) => ({ clau: m[1].startsWith('./') ? m[1].slice(2) : join('src/css', m[1]), capa: m[2] ?? null }));
const ambCapa = (llista, capa) => (capa ? llista.map((r) => ({ ...r, pares: [`@layer ${capa}`, ...r.pares] })) : llista);
const REGLES = Object.fromEntries([
  ...FULLS.map((nom) => [nom, regles(llig(`src/css/${nom}`))]),
  ...IMPORTS.filter((i) => i.clau.includes('/')).map((i) => [i.clau, ambCapa(regles(llig(i.clau)), i.capa)])
]);
/* Dins d'una capa i amb la mateixa especificitat, guanya el full importat després. */
const ORDRE_FULLS = IMPORTS.map((i) => i.clau);
/** Regles d'un full que tenen exactament eixe selector a la llista. */
const ambSelector = (full, selector) => REGLES[full].filter((r) => selectors(r.prelud).includes(selector));
/** Un selector que arriba a una cel·la de capçalera: th o thead com a element. */
const CEL = /(^|[\s>+~(])(th|thead)(?![\w-])/;
const unaRegla = (full, selector, propietat) => {
  const amb = ambSelector(full, selector).filter((r) => valorDe(r, propietat) !== undefined);
  expect(amb, `${full}: una regla «${selector}» amb ${propietat}`).toHaveLength(1);
  return amb[0];
};
const fonsDe = (regla) => valorDe(regla, 'background') ?? valorDe(regla, 'background-color');
const condicions = (regla) => regla.pares.filter((p) => /^@(media|supports|container)\b/.test(p));
/** El selector sense el contingut dels parèntesis: el que hi ha dins de :where() o :nth-child() no és avantpassat ni subjecte. */
const pla = (selector) => {
  let s = selector;
  for (let abans = ''; abans !== s;) { abans = s; s = s.replace(/\([^()]*\)/g, '()'); }
  return s;
};
/** El compost subjecte: l'element que la regla pinta. */
const subjecte = (selector) => pla(selector).split(/[\s>+~]+/).filter(Boolean).pop() ?? '';
/** Una regla limitada al cos o al peu, o a les td, no arriba a la capçalera. */
const nomesCos = (selector) => /(^|[\s>+~])(tbody|tfoot)(?![\w-])/.test(pla(selector)) || /^td(?![\w-])/.test(subjecte(selector));
const comparaEsp = (x, y) => (x[0] - y[0]) || (x[1] - y[1]) || (x[2] - y[2]);
/** Especificitat [a, b, c]: :where() val 0; :is(), :not() i :has(), la del seu argument més fort. */
function especificitat(selector) {
  const total = [0, 0, 0];
  let net = '';
  for (let i = 0; i < selector.length; i++) {
    const funcio = /^:(where|is|not|has)\(/.exec(selector.slice(i));
    if (!funcio) { net += selector[i]; continue; }
    let j = i + funcio[0].length;
    for (let prof = 1; j < selector.length && prof > 0; j++) prof += selector[j] === '(' ? 1 : selector[j] === ')' ? -1 : 0;
    if (funcio[1] !== 'where') {
      const fort = selectors(selector.slice(i + funcio[0].length, j - 1)).map(especificitat).sort(comparaEsp).pop();
      fort.forEach((n, k) => { total[k] += n; });
    }
    i = j - 1;
  }
  const s = pla(net).replace(/\[[^\]]*\]/g, '[]');
  const compte = (re) => (s.match(re) ?? []).length;
  return [
    total[0] + compte(/#[\w-]+/g),
    total[1] + compte(/\.[\w-]+/g) + compte(/\[\]/g) + compte(/(?<!:):[\w-]+/g),
    total[2] + compte(/(^|[\s>+~])[a-z][\w-]*/gi) + compte(/::[\w-]+/g)
  ];
}
/** L'etiqueta d'obertura que comença a `inici`: fins al > que no és dins de claus ni de cometes. */
function obertura(text, inici) {
  let prof = 0;
  let cometa = null;
  for (let i = inici; i < text.length; i++) {
    const c = text[i];
    if (cometa) { if (c === cometa) cometa = null; } else if (c === '"' || c === "'" || c === '`') cometa = c;
    else if (c === '{') prof++;
    else if (c === '}') prof--;
    else if (c === '>' && prof === 0) return text.slice(inici, i + 1);
  }
  return text.slice(inici);
}
/* Les classes de les cel·les de capçalera de columna dels components: tot <th> amb classe llevat dels de fila (scope="row"). */
const CLASSES_DE_CAPCALERA = (() => {
  const classes = new Set();
  const jsx = readdirSync(resolve(process.cwd(), 'src'), { recursive: true }).filter((f) => f.endsWith('.jsx') && !f.endsWith('.test.jsx'));
  for (const fitxer of jsx) {
    const text = llig(join('src', fitxer));
    for (const m of text.matchAll(/<th[\s>]/g)) {
      const etiqueta = obertura(text, m.index);
      const valor = /\bclassName=("[^"]*"|\{[^}]*\})/.exec(etiqueta)?.[1];
      if (!valor || /\bscope="row"/.test(etiqueta)) continue;
      const literals = valor.startsWith('"') ? [valor.slice(1, -1)] : [...valor.matchAll(/['"`]([^'"`]*)['"`]/g)].map((x) => x[1]);
      for (const classe of literals.join(' ').split(/\s+/)) if (/^[\w-]+$/.test(classe)) classes.add(classe);
    }
  }
  return classes;
})();
/* Les úniques cel·les de capçalera amb un altre fons que el token: graelles de calendari i documents amb disseny propi (Llei del Píxel). */
const EXCEPCIONS = Object.freeze({
  '.sdp-calendari--gran thead th': varDe('--sdp-fons-app'),
  '.sdp-calendari__taula thead th': varDe('--sdp-fons-app'),
  '.sdp-calendari--compacte thead th': 'transparent',
  '.sdp-cal-any__graella th': 'transparent',
  '.sdp-gestoria-factura__taula :where(th, td)': 'none',
  // El full de la gestoria (VistaPreviaFull): la barra de roca i la capçalera grisa, de sempre.
  '.sdp-gestoria-full__barra > th': varDe('--sdp-fons-roca'),
  '.sdp-gestoria-full__capcalera > th': varDe('--sdp-fons-subtil')
});

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

describe('P1-16 i PS-03 · el token de la capçalera', () => {
  test('pedra-300 en clar i pedra-650 en fosc, declarat una vegada a cada tema', () => {
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
});

describe('PS-03 · la regla genèrica i qui guanya', () => {
  test('sdp.css: :where(thead th) pinta el token, a la capa sdp i amb especificitat 0', () => {
    const regla = unaRegla('sdp.css', ':where(thead th)', 'background');
    expect(capaDe(regla)).toBe('sdp');
    expect(valorDe(regla, 'background')).toBe(varDe(TOKEN));
    expect(valorDe(regla, 'color')).toBe(varDe('--sdp-text-titol'));
    // Cap altra regla pinta el fons de la capçalera de manera genèrica.
    const sdp = senseComentaris(llig('src/css/sdp.css'));
    expect(sdp.match(new RegExp(`var\\(${TOKEN}\\)`, 'g'))).toHaveLength(1);
  });

  test('la frontera de P1-16 desapareix: cap regla de .sdp-taula-prosa per a la capçalera, i components.css no consumix el token', () => {
    for (const [nom, llista] of Object.entries(REGLES)) {
      for (const r of llista) {
        for (const s of selectors(r.prelud)) expect(s, `${nom}: ${r.prelud}`).not.toMatch(/\.sdp-taula-prosa\b.*\bth\b/);
      }
    }
    expect(senseComentaris(llig('src/css/components.css'))).not.toContain(varDe(TOKEN));
  });

  test('l’enllaç de la capçalera pren el títol subratllat, en una capa que guanya el color d’enllaç de base.css', () => {
    const enllac = unaRegla('components.css', ':where(thead th a)', 'color');
    expect(valorDe(enllac, 'color')).toBe(varDe('--sdp-text-titol'));
    expect(valorDe(enllac, 'text-decoration')).toBe('underline');
    // El color d'enllaç de sèrie (taronja) i el del hover viuen a base.css.
    const a = unaRegla('base.css', 'a', 'color');
    const hover = unaRegla('base.css', 'a:hover', 'color');
    expect(posicio(capaDe(enllac))).toBeGreaterThan(posicio(capaDe(a)));
    expect(posicio(capaDe(enllac))).toBeGreaterThan(posicio(capaDe(hover)));
    // A la capa sdp la regla seria morta: l'enllaç es quedaria taronja (3,84:1 damunt del token en clar).
    expect(posicio('sdp')).toBeLessThan(posicio(capaDe(a)));
    expect(ambSelector('sdp.css', ':where(thead th a)')).toHaveLength(0);
  });

  test.each(Object.entries(EXCEPCIONS))('excepció · %s conserva «%s», a una capa que guanya sdp', (selector, valor) => {
    const regla = unaRegla('modules.css', selector, 'background');
    expect(valorDe(regla, 'background')).toBe(valor);
    expect(posicio(capaDe(regla))).toBeGreaterThan(posicio('sdp'));
    // Cap altra regla del mateix component torna a pintar la capçalera amb un altre fons.
    const arrel = selector.split(' ')[0];
    const altres = Object.entries(REGLES).flatMap(([nom, llista]) => llista.map((r) => ({ nom, r })))
      .filter(({ r }) => selectors(r.prelud).some((s) => s.startsWith(`${arrel} `) && CEL.test(s)))
      .map(({ nom, r }) => [`${nom} · ${r.prelud}`, fonsDe(r)])
      .filter(([, fons]) => fons !== undefined);
    for (const [on, fons] of altres) expect(fons, on).toBe(valor);
  });

  test('cens · el fons d’una cel·la de capçalera el pinta la genèrica de sdp.css o una regla de component d’una capa que guanya, amb el token o amb l’excepció llistada', () => {
    const trobades = new Set();
    for (const [nom, llista] of Object.entries(REGLES)) {
      for (const r of llista) {
        const fons = fonsDe(r);
        if (fons === undefined) continue;
        for (const s of selectors(r.prelud).filter((x) => CEL.test(x) && !nomesCos(x))) {
          const on = `${nom}: ${s} { background: ${fons} }`;
          trobades.add(s);
          if (nom === 'sdp.css') {
            expect(fons, on).toBe(varDe(TOKEN));
            continue;
          }
          expect(posicio(capaDe(r)), `${on} ha de guanyar la regla d'elements`).toBeGreaterThan(posicio('sdp'));
          // Sense classe, una regla de capa guanyadora desfà PS-03 a totes les taules alhora.
          expect(s, `${on}: cap regla d'elements per a la capçalera fora de sdp.css`).toMatch(/\.[a-z][\w-]*/i);
          expect(fons, `${on}: un fons que no és el token només per a una excepció llistada`).toBe(EXCEPCIONS[s] ?? varDe(TOKEN));
        }
      }
    }
    // La genèrica i cada excepció hi són: la llista no guarda fantasmes.
    for (const s of [':where(thead th)', ...Object.keys(EXCEPCIONS)]) expect([...trobades], s).toContain(s);
  });

  test.each([
    [':where(thead th)', [0, 0, 0]],
    ['.sdp-inventari__accions', [0, 1, 0]],
    ['thead tr > .sdp-inventari__accions', [0, 1, 2]],
    ['tbody tr:nth-child(even) > .sdp-inventari__accions', [0, 2, 2]],
    ['a:hover:focus-visible', [0, 2, 1]],
    [':is(#u, .v) th:not(.w)::before', [1, 1, 2]]
  ])('especificitat · %s → %j', (selector, esperada) => {
    expect(especificitat(selector)).toEqual(esperada);
  });

  test('cel·les de capçalera marcades per classe · dins de thead guanya el token, encara que la classe pinte el fons de la seua columna', () => {
    // El cens llig els <th> dels components: el cas que l'Onada 6 va enganxar a la dreta n'és un.
    expect([...CLASSES_DE_CAPCALERA]).toContain('sdp-inventari__accions');
    const generica = { on: 'sdp.css · :where(thead th)', fons: varDe(TOKEN), capa: posicio('sdp'), esp: [0, 0, 0], full: ORDRE_FULLS.indexOf('sdp.css'), ordre: 0, cond: [] };
    const compara = (x, y) => (x.capa - y.capa) || comparaEsp(x.esp, y.esp) || (x.full - y.full) || (x.ordre - y.ordre);
    for (const classe of CLASSES_DE_CAPCALERA) {
      const candidates = [generica];
      for (const [nom, llista] of Object.entries(REGLES)) {
        llista.forEach((r, ordre) => {
          const fons = fonsDe(r);
          if (fons === undefined) return;
          for (const s of selectors(r.prelud)) {
            if (nomesCos(s) || !subjecte(s).split(/(?=[.#[:])/).includes(`.${classe}`)) continue;
            candidates.push({ on: `${nom} · ${s}`, fons, capa: posicio(capaDe(r)), esp: especificitat(s), full: ORDRE_FULLS.indexOf(nom), ordre, cond: condicions(r) });
          }
        });
      }
      for (const altre of candidates.filter((c) => c.fons !== varDe(TOKEN))) {
        // Quan s'aplica eixa regla, també s'apliquen les que demanen les mateixes condicions o menys.
        const guanya = candidates.filter((c) => c.cond.every((x) => altre.cond.includes(x))).sort(compara).pop();
        expect(guanya.fons, `.${classe}: a la capçalera guanya «${guanya.on}» amb ${guanya.fons}; cal una regla «thead tr > .${classe}» amb ${varDe(TOKEN)} que guanye «${altre.on}»`).toBe(varDe(TOKEN));
      }
    }
  });
});
