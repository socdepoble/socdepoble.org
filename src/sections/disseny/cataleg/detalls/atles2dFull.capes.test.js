// @vitest-environment node
/* v1.2.19 · Gauntlet R2 (L4R2-01, L4R2-02, L4R2-05 i L4R2-06) · El full diferit de l'Atles 2D
   (src/css/diferit-atles-2d.css). jsdom no resol la cascada ni pinta: es comproven les regles escrites, i el
   contrast es calcula amb la fórmula WCAG 2.x sobre els valors de tokens.css (clar, fosc, Bancal i Mode Sènior),
   seguint el token que nomena cada regla. Cada guarda es prova també contra una còpia literal de la regla
   d'abans de la ronda 2: si no la detectara, la guarda no guardaria res.
   Cap prova de capes de src/css no recorre este full (la llista RUTES de rocaIGuardes.capes.test.js no
   l'inclou), per això la seua Fase B viu ací, al costat de les pàgines que l'adopten. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const net = (text) => text.replace(/\s+/g, ' ').trim();
const FULL = llig('src/css/diferit-atles-2d.css');

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

/** Regles fulla, amb les @-regles que les embolcallen (@layer, @media, @container…). */
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
/** Les declaracions d'un selector en un context (les regles que el nomenen, en ordre). */
const propietats = (llista, selector, enContext = (context) => context.length === 1) => Object.fromEntries(
  llista.filter((r) => r.selectors.includes(selector) && enContext(r.context)).flatMap((r) => declaracions(r.cos))
);
const token = (valor) => String(valor || '').match(/^var\((--[\w-]+)\)$/)?.[1] || null;

/* ── Tokens: el bloc clar i els que hi escriuen damunt ── */
const TOKENS_CSS = senseComentaris(`${llig('src/css/design-tokens.css')}\n${llig('src/css/tokens.css')}`);
const REGLES_TOKENS = regles(TOKENS_CSS);
function tema(predicat) {
  const mapa = new Map();
  for (const r of REGLES_TOKENS.filter((x) => x.context.length === 0 && predicat(x.selectors))) {
    for (const [propietat, valor] of declaracions(r.cos)) if (propietat.startsWith('--')) mapa.set(propietat, valor);
  }
  return mapa;
}
const CLAR = tema((s) => s.includes(':root') && s.includes(':host'));
const FOSC = new Map([...CLAR, ...tema((s) => s.includes(':root[data-theme="dark"]'))]);
const TEMES = [
  ['clar', CLAR],
  ['fosc', FOSC],
  ['Bancal clar', new Map([...CLAR, ...tema((s) => s.includes(':root[data-contrast="bancal"]'))])],
  ['Bancal fosc', new Map([...FOSC, ...tema((s) => s.includes(':root[data-theme="dark"][data-contrast="bancal"]'))])],
  ['Sènior clar', new Map([...CLAR, ...tema((s) => s.includes(':root[data-sdp-senior="true"]'))])],
  ['Sènior fosc', new Map([...FOSC, ...tema((s) => s.includes(':root[data-theme=\'dark\'][data-sdp-senior="true"]'))])]
];

function valor(mapa, nom, salts = 0) {
  const v = mapa.get(nom);
  if (v === undefined) return null;
  const ref = v.match(/^var\((--[\w-]+)\)$/);
  return ref && salts < 20 ? valor(mapa, ref[1], salts + 1) : v;
}
function color(mapa, nom) {
  const v = nom ? valor(mapa, nom)?.toLowerCase() : null;
  const hex = v?.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (!hex) return null;
  const h = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join('') : hex[1];
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}
const lineal = (canal) => {
  const s = canal / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const lluminancia = ({ r, g, b }) => 0.2126 * lineal(r) + 0.7152 * lineal(g) + 0.0722 * lineal(b);
const contrast = (a, b) => {
  const [clar, fosc] = [lluminancia(a), lluminancia(b)].sort((x, y) => y - x);
  return (clar + 0.05) / (fosc + 0.05);
};
/** Mides en px d'una longitud rem/px o d'un token d'espai (--sdp-space-n) del bloc clar. */
const px = (text) => {
  const t = token(text);
  const v = t ? valor(CLAR, t) : String(text || '').trim();
  const m = String(v || '').match(/^(\d*\.?\d+)(rem|px)$/);
  return m ? Number(m[1]) * (m[2] === 'rem' ? 16 : 1) : NaN;
};

/* ── Guardes ── */
const GUARDA = '@media (hover: hover) and (pointer: fine)';
/** Els :hover fora de la guarda de ratolí (un neutralitzador, que nomena també el selector sense :hover, no compta). */
function hoversSenseGuarda(css) {
  const fora = [];
  for (const r of regles(css)) {
    if (r.context.includes(GUARDA)) continue;
    for (const s of r.selectors.filter((x) => x.includes(':hover'))) {
      if (!r.selectors.includes(s.replace(/:hover/g, ''))) fora.push(s);
    }
  }
  return fora;
}

const CANTONADA = '.sdp-atles__mapa :where(thead th:first-child)';
const FILA = '.sdp-atles__mapa :where(th[scope="row"])';
/** Què falta a la cantonada perquè vaja enganxada per damunt de les capçaleres de fila, amb fons opac. */
function faltesCantonada(css) {
  const rl = regles(css);
  const cantonada = propietats(rl, CANTONADA);
  const fila = propietats(rl, FILA);
  const faltes = [];
  if (cantonada.position !== 'sticky') faltes.push('la cantonada no és sticky');
  if (cantonada['inset-inline-start'] !== '0') faltes.push('la cantonada no s’enganxa a l’inici');
  if (!(Number(cantonada['z-index']) > Number(fila['z-index']))) faltes.push('la cantonada no va per damunt de les capçaleres de fila');
  if (!TEMES.every(([, t]) => color(t, token(cantonada.background)))) faltes.push('la cantonada no té un fons opac de token');
  return faltes;
}

/* L4R2-02 · L'amplada de les paraules més llargues de les capçaleres del mapa, en em de la Noto Sans negreta
   (mesura de la ronda 2 amb canvas a Chrome: «Ajuntament» 95,6 px a 16 px; «estructurades» 97,8 px a 14 px;
   vegeu r2.json, L4R2-02). En em no depenen de la mida de la lletra: la capçalera hi ha de deixar lloc. */
const PARAULA_COLUMNA_EM = 95.6 / 16;
const PARAULA_FILA_EM = 97.8 / 14;
const IPAD = '@container (max-width: 34rem)';
/** L'amplada útil, en em, de la capçalera d'una entitat i de la de fila dins de la caixa estreta (iPad). */
function pressupostIpad(css) {
  const rl = regles(css);
  const dins = (context) => context.includes(IPAD);
  const fora = (context) => context.length === 1;
  const base = (sel) => ({ ...propietats(rl, sel, fora), ...propietats(rl, '.sdp-atles__mapa :where(th)', fora) });
  const ipad = (sel) => ({ ...propietats(rl, sel, dins), ...propietats(rl, '.sdp-atles__mapa :where(th)', dins) });
  const taula = px(propietats(rl, '.sdp-atles__mapa :where(table)', dins)['min-inline-size']);
  const primera = px(propietats(rl, '.sdp-atles__mapa :where(thead th:first-child, th[scope="row"])', dins)['inline-size']);
  const columna = (taula - primera) / 5;
  /* El farciment de tota taula (sdp.css, :where(th, td)) és 12 px per costat; la lletra, la del cos (16 px). */
  const farciment = (props) => (props['padding-inline'] ? px(props['padding-inline']) : 12);
  const lletra = (props) => (props['font-size'] ? px(props['font-size']) : 16);
  const col = { ...base('.sdp-atles__mapa :where(thead th)'), ...ipad('.sdp-atles__mapa :where(thead th)') };
  const fil = { ...base(FILA), ...ipad(FILA) };
  return {
    columna: (columna - 2 * farciment(col)) / lletra(col),
    fila: (primera - 2 * farciment(fil)) / lletra(fil)
  };
}

/** El contrast pitjor del text de la cel·la apagada sobre el seu propi fons, i si encara depén d'una opacitat. */
function auditaApagada(css) {
  const rl = regles(css);
  const cos = propietats(rl, '.sdp-atles__cel--apagada');
  const fallades = [];
  if (cos.opacity !== undefined && Number(cos.opacity) < 1) fallades.push(`opacitat ${cos.opacity}`);
  if (cos.filter) fallades.push(`filtre ${cos.filter}`);
  for (const [nom, t] of TEMES) {
    const text = color(t, token(cos.color));
    const fons = color(t, token(cos.background));
    if (!text || !fons) { fallades.push(`${nom}: sense color o fons de token`); continue; }
    const ratio = contrast(text, fons);
    if (ratio < 7) fallades.push(`${nom}: ${ratio.toFixed(2)}:1`);
    const marca = propietats(rl, '.sdp-atles__cel-marca');
    const textMarca = color(t, token(propietats(rl, '.sdp-atles__cel--apagada .sdp-atles__cel-marca').color || marca.color));
    const fonsMarca = color(t, token(marca.background));
    if (!textMarca || !fonsMarca || contrast(textMarca, fonsMarca) < 7) fallades.push(`${nom}: la marca «Corregida» d'una cel·la apagada`);
  }
  return fallades;
}

/* ── Còpies literals de les regles d'abans de la ronda 2 ── */
const HOVER_ABANS = `@layer components {
  .sdp-atles__targeta:hover { border-color: var(--sdp-accio); background: var(--sdp-accio-subtil); }
  .sdp-atles__grafic-fila:hover { background: var(--sdp-accio-subtil); }
}`;
const CANTONADA_ABANS = `@layer components {
  .sdp-atles__mapa :where(thead th:first-child) { inline-size: 12rem; }
  .sdp-atles__mapa :where(th[scope="row"]) { vertical-align: middle; position: sticky; inset-inline-start: 0; z-index: 1; inline-size: 12rem; background: var(--sdp-taula-capcalera-fons); font-size: var(--sdp-text-meta); }
}`;
const IPAD_ABANS = `@layer components {
  .sdp-atles__mapa :where(th) { white-space: normal; overflow-wrap: break-word; vertical-align: bottom; }
  .sdp-atles__mapa :where(th[scope="row"]) { position: sticky; inset-inline-start: 0; z-index: 1; inline-size: 12rem; font-size: var(--sdp-text-meta); }
  @container (max-width: 34rem) {
    .sdp-atles__mapa :where(table) { min-inline-size: 44rem; }
    .sdp-atles__mapa :where(thead th:first-child, th[scope="row"]) { inline-size: 7.5rem; }
  }
}`;
const APAGADA_ABANS = `@layer components {
  .sdp-atles__cel--fet { background: var(--sdp-exit-fons); color: var(--sdp-exit-text); }
  .sdp-atles__cel--apagada { opacity: 0.32; }
  .sdp-atles__cel-marca { background: var(--sdp-fons-targeta); color: var(--sdp-text-titol); }
}`;

describe('les guardes detecten les regles d’abans de la ronda 2', () => {
  test('dos :hover sense guarda, la cantonada solta, les capçaleres estretes i la cel·la esvaïda', () => {
    expect(hoversSenseGuarda(HOVER_ABANS)).toEqual(['.sdp-atles__targeta:hover', '.sdp-atles__grafic-fila:hover']);
    expect(faltesCantonada(CANTONADA_ABANS)).toEqual([
      'la cantonada no és sticky', 'la cantonada no s’enganxa a l’inici', 'la cantonada no va per damunt de les capçaleres de fila',
      'la cantonada no té un fons opac de token'
    ]);
    const abans = pressupostIpad(IPAD_ABANS);
    expect(abans.columna).toBeLessThan(PARAULA_COLUMNA_EM);
    expect(abans.fila).toBeLessThan(PARAULA_FILA_EM);
    expect(auditaApagada(APAGADA_ABANS)).toContain('opacitat 0.32');
  });
});

describe('el full de l’Atles 2D d’ara', () => {
  test('L4R2-06 · Fase B: tot :hover va dins de la guarda de ratolí (cap ressalt enganxat al tàctil de l’iPad)', () => {
    expect(hoversSenseGuarda(FULL)).toEqual([]);
    expect(regles(FULL).filter((r) => r.selectors.some((s) => s.includes(':hover'))).length).toBeGreaterThan(0);
  });

  test('L4R2-01 · la cantonada «Dimensió» va enganxada, opaca i per damunt de les capçaleres de fila', () => {
    expect(faltesCantonada(FULL)).toEqual([]);
  });

  test('L4R2-02 · a la caixa estreta (iPad), les capçaleres deixen lloc a la paraula més llarga sense partir-la', () => {
    const { columna, fila } = pressupostIpad(FULL);
    expect(columna).toBeGreaterThanOrEqual(PARAULA_COLUMNA_EM);
    expect(fila).toBeGreaterThanOrEqual(PARAULA_FILA_EM);
    /* El darrer recurs continua: amb una lletra més gran (Mode Sènior, el sistema), abans partir que trepitjar. */
    expect(propietats(regles(FULL), '.sdp-atles__mapa :where(th)')['overflow-wrap']).toBe('break-word');
  });

  test('L4R2-05 · una cel·la fora del ressalt no s’esvaïx: el seu text continua en AAA en tots els temes', () => {
    expect(auditaApagada(FULL)).toEqual([]);
    const ambOpacitat = regles(FULL).filter((r) => r.selectors.some((s) => s.includes('sdp-atles__cel'))
      && declaracions(r.cos).some(([p, v]) => p === 'opacity' && Number(v) < 1));
    expect(ambOpacitat).toEqual([]);
  });
});
