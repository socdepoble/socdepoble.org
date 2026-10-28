// @vitest-environment node
/* P1-37 (ordre del Mestre, 261026_2057; pla 261028_1526 §3.5.1) · Botons
   unificats Pedra Seca: l'aire d'un botó de bloc que va a soles i el buit
   entre els botons d'un grup són tres àlies de la reixeta, declarats una sola
   vegada al bloc principal de tokens.css i cap tema no els redefinix. Els
   consumixen, amb els mateixos píxels d'abans (16, 12 i 12), la píndola de la
   IAIA i el bloc d'accions canònic. Els buits de 8px del diàleg «Nova
   conversa» i de ControlsAdjunt no hi entren: passar-los a 12 seria un canvi
   visible, i és del Mestre. jsdom no calcula res: es lligen els fulls. */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(resolve(ARREL, ruta), 'utf8');
const senseComentaris = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '');
const declaracions = (text) => Object.fromEntries(
  [...senseComentaris(text).matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()])
);
const TOKENS = llig('src/css/tokens.css');

/** El cos del bloc que obri `selector {` a principi de línia (el patró de tokens.contracte.test.js). */
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
const PRINCIPAL = bloc(TOKENS, ':root, :host, .sdp-root');
const ALTRES = [
  ':root[data-theme="dark"], :host([data-theme="dark"]),\n:root[data-theme="dark"] .sdp-root, :host([data-theme="dark"]) .sdp-root',
  '.sdp-root[data-contrast="bancal"],\n:root[data-contrast="bancal"], :host([data-contrast="bancal"]),\n:root[data-contrast="bancal"] .sdp-root, :host([data-contrast="bancal"]) .sdp-root',
  ':root[data-theme="dark"] .sdp-root[data-contrast="bancal"],\n:root[data-theme="dark"][data-contrast="bancal"], :host([data-theme="dark"][data-contrast="bancal"]),\n'
    + ':root[data-theme="dark"][data-contrast="bancal"] .sdp-root, :host([data-theme="dark"][data-contrast="bancal"]) .sdp-root'
].map((selector) => bloc(TOKENS, selector));

const MAPA = { ...declaracions(llig('src/css/design-tokens.css')), ...declaracions(PRINCIPAL) };
function resol(valor, vistos = new Set()) {
  return valor.replace(/var\((--[\w-]+)\)/g, (_, nom) => {
    expect(vistos.has(nom), `cicle a ${nom}`).toBe(false);
    expect(MAPA[nom], `falta ${nom}`).toBeDefined();
    return resol(MAPA[nom], new Set([...vistos, nom]));
  }).trim();
}

/** El valor d'una propietat a les regles d'un selector exacte d'un full (l'última guanya). */
function valor(full, selector, propietat) {
  const net = (t) => t.replace(/\s+/g, ' ').trim();
  let trobat = null;
  for (const m of senseComentaris(full).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!net(m[1].split(';').pop()).split(',').map(net).includes(selector)) continue;
    for (const d of m[2].split(';')) {
      const [prop, ...resta] = d.split(':');
      if (net(prop || '') === propietat) trobat = net(resta.join(':'));
    }
  }
  return trobat;
}

function fullsCss(carpeta = 'src') {
  const eixida = [];
  for (const nom of readdirSync(resolve(ARREL, carpeta))) {
    const ruta = join(carpeta, nom);
    if (statSync(resolve(ARREL, ruta)).isDirectory()) eixida.push(...fullsCss(ruta));
    else if (nom.endsWith('.css')) eixida.push(ruta);
  }
  return eixida;
}

const ESPERATS = Object.freeze({
  '--sdp-boto-marge-inline': ['var(--sdp-space-4)', '16px'],
  '--sdp-boto-marge-block': ['var(--sdp-space-3)', '12px'],
  '--sdp-boto-separacio': ['var(--sdp-space-3)', '12px']
});

describe('P1-37 · els tokens dels botons', () => {
  test('cada un es declara una sola vegada, al bloc principal, com a àlies de la reixeta', () => {
    const P = declaracions(PRINCIPAL);
    for (const [nom, [alies]] of Object.entries(ESPERATS)) {
      expect(P[nom], nom).toBe(alies);
      const declarat = new RegExp(`${nom}\\s*:`, 'g');
      const vegades = fullsCss().reduce((n, ruta) => n + (senseComentaris(llig(ruta)).match(declarat)?.length ?? 0), 0);
      expect(vegades, nom).toBe(1);
    }
  });

  test('resolen a 16, 12 i 12 px, múltiples de 4', () => {
    for (const [nom, [, px]] of Object.entries(ESPERATS)) {
      const resolt = resol(`var(${nom})`);
      expect(resolt, nom).toBe(px);
      expect(Number.parseInt(resolt, 10) % 4, nom).toBe(0);
    }
  });

  test('ni el tema fosc ni el Bancal els redefinixen: valen igual a tot arreu', () => {
    for (const cos of ALTRES) for (const nom of Object.keys(ESPERATS)) expect(declaracions(cos)[nom], nom).toBeUndefined();
  });

  test('els consumixen la píndola de la IAIA i el bloc d’accions, amb els mateixos píxels', () => {
    const iaia = llig('src/sections/xat/components/ConsultaIAIA.css');
    expect(valor(iaia, '.sdp-xat-pindola.sdp-xat-pindola--iaia', 'margin-inline')).toBe('var(--sdp-boto-marge-inline)');
    expect(valor(iaia, '.sdp-xat-pindola.sdp-xat-pindola--iaia', 'margin-block')).toBe('var(--sdp-boto-marge-block)');
    const components = llig('src/css/components.css');
    expect(valor(components, '.sdp-accions', 'gap')).toBe('var(--sdp-boto-separacio)');
    // Els 24px de dalt i de baix de l'Accions són la distància al text (IDEA-26/27), no un marge de botó.
    expect(valor(components, '.sdp-accions', 'margin-block')).toBe('var(--sdp-space-6)');
  });
});
