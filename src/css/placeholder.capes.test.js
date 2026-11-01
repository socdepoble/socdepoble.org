// @vitest-environment node
/* P1-28 · PS-02 (Llibre Mestre; ordre del Mestre, 261101) · El text d'exemple
   dels camps (::placeholder) no el decidix el navegador. Sense regla, Chrome
   el pintava gris a 3,91:1 sobre el fons subtil i a 2,94:1 sobre el subtil
   fosc, i Firefox posava el color del camp al 54 %. Q1 del Mestre: AAA sempre.
   La prova llig els fulls de veres:
     · la regla viu dins de @layer sdp, amb especificitat mínima (0,0,1: el
       :where() no hi suma res), i només porta color i opacitat: no toca res
       més que el placeholder;
     · l'ordre de capes d'index.css deixa components darrere de sdp: per això
       .sdp-control continua manant, i amb el mateix token;
     · resol els tokens fins al hex en els quatre modes (clar, fosc, Bancal i
       Bancal fosc) i mesura el color del placeholder contra el fons REAL de
       cada camp, llegit de la seua regla: 7:1 o més;
     · cap altra regla de placeholder de src/ (també les dels prefixos -webkit-
       i -moz-) canvia el color fora del text suau, baixa l'opacitat o el
       repinta amb -webkit-text-fill-color; l'única excepció és el crom. */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { contrast } from '../config/contrast.js';

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(resolve(ARREL, ruta), 'utf8');
const senseComentaris = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '');
const LLINDAR_AAA = 7;
const SELECTOR = ':where(input, textarea)::placeholder';

const SDP = senseComentaris(llig('src/css/sdp.css'));
const COMPONENTS = senseComentaris(llig('src/css/components.css'));
const MODULES = senseComentaris(llig('src/css/modules.css'));
const TOKENS = llig('src/css/tokens.css');

/* El cos d'un bloc amb claus equilibrades que comença a `inici`. */
function cos(text, inici) {
  const obre = text.indexOf('{', inici);
  let prof = 0;
  for (let i = obre; i < text.length; i++) {
    if (text[i] === '{') prof++;
    if (text[i] === '}' && --prof === 0) return { obre, tanca: i, dins: text.slice(obre + 1, i) };
  }
  throw new Error(`bloc sense tancar a ${inici}`);
}
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Les declaracions de la regla `selector { … }` (selector exacte, a l'inici de línia). */
function regla(full, selector) {
  const m = new RegExp(`(?:^|\\n)[ \\t]*${esc(selector)}\\s*\\{([^}]*)\\}`).exec(full);
  expect(m, `falta la regla ${selector}`).not.toBeNull();
  return Object.fromEntries([...m[1].matchAll(/(?:^|;)\s*([\w-]+)\s*:\s*([^;]+)/g)]
    .map(([, prop, valor]) => [prop, valor.trim()]));
}

/* Tokens resolts en els quatre modes (mateix mètode que contrastControlsBlaus). */
const declaracions = (text) => Object.fromEntries(
  [...senseComentaris(text).matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()])
);
function bloc(text, selector) {
  const inici = text.indexOf(`\n${selector} {`);
  expect(inici, `falta el bloc ${selector}`).toBeGreaterThan(-1);
  return cos(text, inici).dins;
}
const CLAR = { ...declaracions(llig('src/css/design-tokens.css')), ...declaracions(bloc(TOKENS, ':root, :host, .sdp-root')) };
const FOSC = declaracions(bloc(TOKENS, ':root[data-theme="dark"], :host([data-theme="dark"]),\n:root[data-theme="dark"] .sdp-root, :host([data-theme="dark"]) .sdp-root'));
const B = declaracions(bloc(TOKENS, '.sdp-root[data-contrast="bancal"],\n:root[data-contrast="bancal"], :host([data-contrast="bancal"]),\n'
  + ':root[data-contrast="bancal"] .sdp-root, :host([data-contrast="bancal"]) .sdp-root'));
const BF = declaracions(bloc(TOKENS, ':root[data-theme="dark"] .sdp-root[data-contrast="bancal"],\n'
  + ':root[data-theme="dark"][data-contrast="bancal"], :host([data-theme="dark"][data-contrast="bancal"]),\n'
  + ':root[data-theme="dark"][data-contrast="bancal"] .sdp-root, :host([data-theme="dark"][data-contrast="bancal"]) .sdp-root'));
const MODES = {
  clar: CLAR,
  fosc: { ...CLAR, ...FOSC },
  bancal: { ...CLAR, ...B },
  'bancal fosc': { ...CLAR, ...FOSC, ...B, ...BF }
};
function hex(valor, mapa, vistos = new Set()) {
  const net = valor.replace(/var\((--[\w-]+)\)/g, (_, nom) => {
    expect(vistos.has(nom), `cicle a ${nom}`).toBe(false);
    expect(mapa[nom], `falta ${nom}`).toBeDefined();
    return hex(mapa[nom], mapa, new Set([...vistos, nom]));
  }).trim();
  return net;
}
const opac = (valor, mapa, on) => {
  const h = hex(valor, mapa);
  expect(h, `${on}: color opac de sis xifres`).toMatch(/^#[0-9a-f]{6}$/i);
  return h;
};

describe('P1-28 · PS-02 · el placeholder dels camps', () => {
  test('la regla viu dins de @layer sdp, amb especificitat mínima, i només porta color i opacitat', () => {
    const capa = cos(SDP, SDP.indexOf('@layer sdp'));
    const pos = SDP.indexOf(`${SELECTOR} {`);
    expect(pos, 'falta la regla de placeholder a sdp.css').toBeGreaterThan(-1);
    expect(pos > capa.obre && pos < capa.tanca, 'la regla ha de viure dins de @layer sdp').toBe(true);
    expect(SDP.indexOf(`${SELECTOR} {`, pos + 1), 'una sola regla').toBe(-1);
    const r = regla(SDP, SELECTOR);
    expect(Object.keys(r).sort()).toEqual(['color', 'opacity']);
    expect(r.color).toBe('var(--sdp-text-suau)');
    expect(r.opacity).toBe('1');
  });

  test('components va darrere de sdp: .sdp-control continua manant, amb el mateix token', () => {
    const ordre = /@layer\s+([^;{]+);/.exec(senseComentaris(llig('src/css/index.css')));
    expect(ordre, 'falta la sentència @layer d\'index.css').not.toBeNull();
    const capes = ordre[1].split(',').map((c) => c.trim());
    expect(capes.indexOf('sdp')).toBeGreaterThan(-1);
    expect(capes.indexOf('components')).toBeGreaterThan(capes.indexOf('sdp'));
    expect(regla(COMPONENTS, '.sdp-control::placeholder').color).toBe(regla(SDP, SELECTOR).color);
  });

  /* El fons real de cada camp amb placeholder, llegit de la seua regla. Els
     camps transparents (cerca del Xat, cerca de l'espai de treball, compositor)
     deixen vore el fons del seu contenidor. */
  const FONS = [
    ['camp nu (sdp.css)', SDP, ':where(input:not([type="checkbox"]):not([type="radio"]):not([type="file"]), select, textarea)'],
    ['camp nu desactivat (sdp.css)', SDP, ':where(input:disabled, select:disabled, textarea:disabled)'],
    ['.sdp-control', COMPONENTS, '.sdp-control'],
    ['cerca del Xat', MODULES, '.sdp-xat-cerca__camp'],
    ['cerca de l\'espai de treball', MODULES, '.sdp-workspace-search'],
    ['compositor del Xat', MODULES, '.sdp-xat-compositor__camp'],
    ['peu d\'un adjunt del Xat', MODULES, '.sdp-xat-adjunts__peu input'],
    ['cerca universal', MODULES, '.universal-search-input']
  ];
  for (const [nom, full, selector] of FONS) {
    test(`${nom}: 7:1 o més en clar, fosc, Bancal i Bancal fosc`, () => {
      const fons = regla(full, selector).background;
      expect(fons, `${nom}: sense fons declarat`).toBeDefined();
      const color = regla(SDP, SELECTOR).color;
      for (const [mode, mapa] of Object.entries(MODES)) {
        const ratio = contrast(opac(color, mapa, `${nom} · ${mode} · placeholder`), opac(fons, mapa, `${nom} · ${mode} · fons`));
        expect(ratio, `${nom} · ${mode}`).toBeGreaterThanOrEqual(LLINDAR_AAA);
      }
    });
  }

  /* L'única família de placeholder amb un altre color: el cercador del crom
     (AppGridShell.css, CSS sense consumidor JSX), amb els tokens --sdp-crom-*
     i el seu bloc Bancal. Clau: «ruta|color». Cap altre full no hi entra. */
  const EXCEPCIONS_DE_COLOR = new Set([
    'src/components/layout/AppGridShell.css|var(--sdp-crom-text-suau)',
    'src/components/layout/AppGridShell.css|var(--sdp-crom-text)'
  ]);
  /* ::placeholder i els prefixos (::-webkit-input-, ::-moz-, :-ms-input-),
     però no :placeholder-shown ni [data-placeholder]. Lineal: cap grup niat. */
  const REGLA_DE_PLACEHOLDER = /::?(?:-webkit-input-|-moz-|-ms-input-)?placeholder(?![\w-])[^{]*\{([^}]*)\}/g;

  test('cap altra regla de placeholder de src/ canvia el color, baixa l\'opacitat ni el repinta', () => {
    const fulls = [];
    const recorre = (dir) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const ruta = join(dir, e.name);
        if (e.isDirectory()) recorre(ruta);
        else if (e.name.endsWith('.css')) fulls.push(ruta);
      }
    };
    recorre(resolve(ARREL, 'src'));
    let regles = 0;
    const infraccions = [];
    for (const ruta of fulls) {
      const rel = relative(ARREL, ruta).split('\\').join('/');
      const net = senseComentaris(readFileSync(ruta, 'utf8'));
      for (const m of net.matchAll(REGLA_DE_PLACEHOLDER)) {
        regles++;
        const d = Object.fromEntries([...m[1].matchAll(/(?:^|;)\s*([\w-]+)\s*:\s*([^;]+)/g)]
          .map(([, prop, valor]) => [prop.toLowerCase(), valor.trim()]));
        if ('color' in d && d.color !== 'var(--sdp-text-suau)' && !EXCEPCIONS_DE_COLOR.has(`${rel}|${d.color}`)) {
          infraccions.push(`${rel}: color ${d.color}`);
        }
        if ('opacity' in d && Number(d.opacity) !== 1) infraccions.push(`${rel}: opacity ${d.opacity}`);
        if ('-webkit-text-fill-color' in d) infraccions.push(`${rel}: -webkit-text-fill-color ${d['-webkit-text-fill-color']}`);
      }
    }
    /* Com a mínim, la regla de sdp.css i la de .sdp-control: si el patró no
       en trobara cap, la prova no vigilaria res. */
    expect(regles).toBeGreaterThanOrEqual(2);
    expect(infraccions).toEqual([]);
  });
});
