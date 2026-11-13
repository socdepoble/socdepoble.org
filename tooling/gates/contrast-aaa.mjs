/** P1-22 · Audit fotomètric dels tokens semàntics de src/css.
 * Mesura sRGB sense arredonir abans del llindar. No és una simulació de la
 * cascada DOM ni una certificació global WCAG: imatges, estils de l'amfitrió,
 * mida renderitzada i herència local requerixen inspecció del navegador.
 * CLI: node tooling/gates/contrast-aaa.mjs [--json]
 */
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const senseComentaris = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');
const declaracions = (s) => Object.fromEntries([...s.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));

/** Comes fora de parèntesis: var(), rgb() i color-mix() poden estar niats. */
function parts(s) {
  const out = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < s.length; i += 1) {
    if (s[i] === '(') depth += 1;
    else if (s[i] === ')') depth -= 1;
    else if (s[i] === ',' && depth === 0) { out.push(s.slice(start, i).trim()); start = i + 1; }
    if (depth < 0) throw new Error(`Parèntesis incorrectes: ${s}`);
  }
  if (depth !== 0) throw new Error(`Parèntesis incorrectes: ${s}`);
  return [...out, s.slice(start).trim()];
}

function substitueix(s, mapa, seen = new Set()) {
  let out = '';
  let start = 0;
  let i = s.indexOf('var(');
  while (i >= 0) {
    let depth = 1;
    let j = i + 4;
    for (; j < s.length && depth; j += 1) {
      if (s[j] === '(') depth += 1;
      else if (s[j] === ')') depth -= 1;
    }
    if (depth) throw new Error(`var() sense tancar: ${s}`);
    const [nom, fallback] = parts(s.slice(i + 4, j - 1));
    if (seen.has(nom)) throw new Error(`Cicle de tokens: ${[...seen, nom].join(' → ')}`);
    const value = mapa[nom] ?? fallback;
    if (value === undefined) throw new Error(`Token absent: ${nom}`);
    out += s.slice(start, i) + substitueix(value, mapa, new Set([...seen, nom]));
    start = j;
    i = s.indexOf('var(', j);
  }
  return (out + s.slice(start)).trim();
}

export function color(valor, mapa = {}) {
  const s = substitueix(valor, mapa).toLowerCase();
  if (s === 'transparent' || s === 'none') return [0, 0, 0, 0];
  if (/^#[0-9a-f]{3,4}$/.test(s) || /^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/.test(s)) {
    let hex = s.slice(1);
    if (hex.length <= 4) hex = [...hex].map((x) => x + x).join('');
    return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).concat(hex.length === 8 ? parseInt(hex.slice(6), 16) / 255 : 1);
  }
  const rgb = /^rgba?\((.*)\)$/.exec(s);
  if (rgb) {
    const args = rgb[1].includes(',') ? parts(rgb[1]) : rgb[1].split(/[\s/]+/);
    if (![3, 4].includes(args.length)) throw new Error(`rgb() no admés: ${s}`);
    const channels = args.slice(0, 3).map((x) => x.endsWith('%') ? Number(x.slice(0, -1)) / 100 : Number(x) / 255);
    const alpha = args.length === 4 ? (args[3].endsWith('%') ? Number(args[3].slice(0, -1)) / 100 : Number(args[3])) : 1;
    if (![...channels, alpha].every((x) => Number.isFinite(x) && x >= 0 && x <= 1)) throw new Error(`Canal fora de rang: ${s}`);
    return [...channels, alpha];
  }
  const mix = /^color-mix\((.*)\)$/.exec(s);
  if (mix) {
    const [space, ...args] = parts(mix[1]);
    if (space !== 'in srgb' || args.length !== 2) throw new Error(`Espai color-mix() no admés: ${s}`);
    const parsed = args.map((arg) => {
      const m = /\s+(\d+(?:\.\d+)?)%$/.exec(arg);
      return { c: color(m ? arg.slice(0, m.index) : arg), p: m ? Number(m[1]) / 100 : null };
    });
    let [p, q] = parsed.map((x) => x.p);
    if (p === null && q === null) [p, q] = [0.5, 0.5];
    else if (p === null) p = 1 - q;
    else if (q === null) q = 1 - p;
    if (p < 0 || q < 0 || p + q <= 0) throw new Error(`Percentatge color-mix() incorrecte: ${s}`);
    const total = p + q;
    [p, q] = [p / total, q / total];
    const [u, v] = parsed.map((x) => x.c);
    const alpha = p * u[3] + q * v[3];
    // CSS Color: interpolació amb alfa premultiplicada, sense quantitzar a 8 bits.
    return [0, 1, 2].map((i) => alpha ? (u[i] * u[3] * p + v[i] * v[3] * q) / alpha : 0).concat(alpha * Math.min(total, 1));
  }
  throw new Error(`Color no resolt: ${s}`);
}

export function sobre(fg, bg) {
  const a = fg[3] + bg[3] * (1 - fg[3]);
  return [0, 1, 2].map((i) => a ? (fg[i] * fg[3] + bg[i] * bg[3] * (1 - fg[3])) / a : 0).concat(a);
}
export function luminancia(c) {
  if (c[3] !== 1) throw new Error('Cal un color compost sobre un fons opac');
  const linear = c.slice(0, 3).map((x) => x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}
export function ratio(fg, bg, backdrop) {
  const base = bg[3] === 1 ? bg : sobre(bg, backdrop ?? [0, 0, 0, 0]);
  if (base[3] !== 1) throw new Error('Fons translúcid sense superfície opaca');
  const a = luminancia(sobre(fg, base));
  const b = luminancia(base);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
export const llindar = (gran = false) => gran ? 4.5 : 7;

/** Regles fulla. No interpreta selectors ni fa veure que resol herència DOM. */
function regles(css) {
  const net = senseComentaris(css);
  return [...net.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ selector: m[1].trim(), body: m[2] }));
}
export function llegeixTemes(arrel = process.cwd()) {
  const llig = (f) => readFileSync(resolve(arrel, f), 'utf8');
  const base = declaracions(senseComentaris(llig('src/css/design-tokens.css')));
  const roots = regles(llig('src/css/tokens.css')).filter((r) => /(?:^|,)\s*(?::root|:host|\.sdp-root)/.test(r.selector));
  const modes = {};
  for (const [nom, dark, bancal] of [['clar', false, false], ['fosc', true, false], ['bancal', false, true], ['bancal fosc', true, true]]) {
    const mapa = { ...base };
    for (const r of roots) {
      if (r.selector.includes('data-theme') && !dark) continue;
      if (r.selector.includes('data-contrast') && !bancal) continue;
      Object.assign(mapa, declaracions(r.body));
    }
    modes[nom] = mapa;
  }
  return modes;
}

const SUPERFICIES = ['fons-app', 'fons-targeta', 'fons-elevat', 'fons-superficie', 'fons-subtil', 'fons-lectura'];
const TINTES = ['text-titol', 'text-cos', 'text-suau', 'text-desactivat', 'accent-text', 'accent-text-hover', 'accent-titol', 'accio-text'];
const token = (s) => `--sdp-${s}`;

/** Parelles amb herència coneguda: prosa, taules, controls i closca. Els
 * títols també passen 7 perquè accent-titol s'usa en enllaços normals;
 * no s'inferix text gran a partir del nom d'un token.
 */
export function parellesSemantiques() {
  const rows = [];
  const add = (fg, bg, origen, options = {}) => rows.push({ fg: token(fg), bg: token(bg), origen, ...options });
  for (const fg of TINTES) for (const bg of SUPERFICIES) add(fg, bg, 'prosa i UI sobre superfícies generals');
  for (const fg of ['text-titol', 'text-cos', 'text-suau', 'text-desactivat', 'accent-text', 'accent-text-hover', 'accent-titol']) add(fg, 'accent-subtil', 'píndoles, avatar to-6 i taula hover');
  for (const fg of ['text-titol', 'text-cos', 'text-suau', 'accio-text']) add(fg, 'accio-subtil', 'selecció i ressaltat d’acció');
  for (const estat of ['error', 'avis', 'exit', 'info']) {
    add(`${estat}-text`, `${estat}-fons`, 'alerta semàntica');
    for (const bg of ['fons-targeta', 'fons-app']) add(`${estat}-text`, bg, 'missatge d’estat sense caixa');
  }
  for (const bg of ['accio-control', 'accio-control-hover', 'crom-control-fons', 'crom-control-hover', 'crom-seleccio-fons']) add('sobre-accio', bg, 'control blau amb etiqueta');
  for (const bg of ['accent', 'accent-hover']) add('sobre-accent', bg, 'control taronja amb etiqueta');
  for (const bg of ['accent-control', 'accent-control-hover', 'error', 'exit-control', 'verd', 'verd-hover']) add('sobre-color', bg, 'control massís amb etiqueta');
  add('exit', 'fons-targeta', 'vora de calendari i pilot d’estat (1.4.11)', { minim: 3, tipus: 'gràfic' });
  add('text-invers', 'fons-invers', 'superfície inversa');
  add('text-invers', 'accio-text', 'calendari: número del dia de hui');
  for (const bg of ['taula-capcalera-fons']) for (const fg of ['text-titol', 'text-cos']) add(fg, bg, 'capçalera de taula');
  for (const marca of ['apple', 'google']) add(`marca-${marca}-text`, `marca-${marca}-fons`, 'botó d’accés');
  for (const bg of ['crom-fons', 'crom-capcalera', 'crom-subcapcalera', 'crom-subcapcalera-fosca', 'crom-capcalera-profunda']) {
    for (const fg of ['crom-text', 'crom-text-suau', 'crom-text-secundari']) add(fg, bg, 'closca immutable');
  }
  add('crom-text', 'crom-capcalera-clara', 'hover calendari');
  add('crom-contenidor-text', 'workspace-nav-fons', 'carpetes i grups de primera columna');
  add('crom-grup-text', 'crom-fons', 'grup sobre la roca');
  for (const bg of ['crom-actiu-fons', 'crom-actiu-fons-hover']) add('crom-actiu-text', bg, 'navegació activa');
  add('crom-text', 'crom-barra-lector', 'barra del Lector');
  add('mapa-rotul', 'mapa-fons', 'nom de poble al mapa');
  // Els nombres de les targetes són text normal (no s’eximixen com a punts SVG).
  for (const bg of ['mapa-gps', 'mapa-estimada']) add('mapa-sobre', bg, 'número i hora de targeta al mapa');
  add('pou-tinta', 'pou-pergami', 'text de la làmina');
  return rows;
}

/** Cens de TOTS els parells explícits color/fons de src/css. El resultat
 * deixa visibles els casos contextuals en comptes de confondre'ls amb PASS.
 * La matriu semàntica anterior cobreix l'herència general del producte.
 */
export function cens(arrel = process.cwd()) {
  return readdirSync(resolve(arrel, 'src/css')).filter((f) => f.endsWith('.css')).sort().flatMap((f) => {
    const ruta = `src/css/${f}`;
    return regles(readFileSync(resolve(arrel, ruta), 'utf8')).flatMap((r) => {
      const ds = Object.fromEntries([...r.body.matchAll(/(?:^|;)\s*(color|background(?:-color)?)\s*:\s*([^;]+)/g)].map((m) => [m[1].replace('background-color', 'background'), m[2].trim()]));
      return ds.color && ds.background ? [{ ruta, selector: r.selector, fg: ds.color, bg: ds.background }] : [];
    });
  });
}

// Estes superfícies només porten icones. Les etiquetes dels controls fills
// tenen el seu propi parell de text (p. ex. CONNECTAR: accio-control).
const GRAFICS = new Set([
  'header.bar-blue', '.sp-card-footer', '.download-card-btn',
  '.sdp-edicio-avancada__icona', '.sdp-xat-nova', '.sdp-xat-compositor__envia',
  '.page-title-avatar__marca', '.sdp-connectar__notes-icona',
  '.sdp-graella-articles__marca-colleccio,\n  .sdp-llista-articles__marca-colleccio'
]);

export function audita(arrel = process.cwd()) {
  const modes = llegeixTemes(arrel);
  const mesures = [];
  const explicites = [];
  const contextuals = [];
  const inventari = cens(arrel);
  for (const [mode, mapa] of Object.entries(modes)) {
    for (const pair of parellesSemantiques()) {
      const r = ratio(color(`var(${pair.fg})`, mapa), color(`var(${pair.bg})`, mapa));
      const minim = pair.minim ?? llindar(pair.gran);
      mesures.push({ mode, ...pair, ratio: r, minim, passa: r >= minim });
    }
    for (const pair of inventari) {
      if (pair.selector.includes('data-theme="dark"') && !mode.includes('fosc')) continue;
      if (pair.selector.includes('data-contrast="bancal"') && !mode.includes('bancal')) continue;
      const contextual = (motiu) => contextuals.push({ mode, ...pair, motiu });
      if (pair.selector.startsWith('.sw-')) { contextual('mostra de paleta primitiva; no és una parella semàntica de text del producte'); continue; }
      if (/:disabled|aria-disabled/.test(pair.selector)) { contextual('component inactiu, exempt de WCAG 1.4.6; no es compta com AAA'); continue; }
      if (['inherit', 'currentColor'].includes(pair.fg) || pair.bg === 'inherit') { contextual('color heretat: cal comprovar l’element pare renderitzat'); continue; }
      if (/Highlight|Canvas/.test(pair.fg + pair.bg)) { contextual('colors forçats del sistema operatiu; no es coneix la paleta'); continue; }
      if (/var\(--(?:cal-|pou-neu-)/.test(pair.fg + pair.bg)) { contextual('àlies locals de calendari/Pou; les seues parelles font estan a la matriu semàntica'); continue; }
      const fg = color(pair.fg, mapa);
      const bg = color(pair.bg, mapa);
      if (bg[3] < 1) { contextual('fons transparent o translúcid: la matriu semàntica mesura les superfícies font, el DOM fixa el fons concret'); continue; }
      const minim = GRAFICS.has(pair.selector) ? 3 : llindar();
      const r = ratio(fg, bg);
      explicites.push({ mode, ...pair, ratio: r, minim, tipus: minim === 3 ? 'icona (1.4.11)' : 'text normal (1.4.6)', passa: r >= minim });
    }
  }
  return {
    mesures, explicites, fallades: [...mesures, ...explicites].filter((x) => !x.passa),
    cens: inventari, contextuals,
    limit: 'Tokens semàntics i parelles explícites opaces; els casos contextuals NO són PASS ni certificació AAA. Cal navegador per a herència DOM, fotografies, filtres i CSS de l’amfitrió.'
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const report = audita();
    if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2));
    else {
      console.log(`P1-22 · ${report.mesures.length} mesures en 4 modes · ${report.fallades.length} fallades · ${report.cens.length} parells explícits censats · ${report.explicites.length} mesures explícites · ${report.contextuals.length} casos contextuals`);
      for (const f of report.fallades) console.log(`${f.mode}: ${f.fg} / ${f.bg} = ${f.ratio.toFixed(6)} < ${f.minim}`);
      console.log(report.limit);
    }
    process.exitCode = report.fallades.length ? 1 : 0;
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
