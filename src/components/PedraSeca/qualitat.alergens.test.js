// @vitest-environment node
/* Icones d'al·lèrgens (ordre del Mestre, 261006: «deixa previst en el
   component de la targeta de producte l'espai i el codi per a renderitzar
   aquestes xicotetes icones d'al·lèrgens»; «utilitza directament eixos
   SVGs») · qualitat d'IconesAlergens, del registre recursos/alergens.js, del
   full alergens.css, de les còpies dels SVG del Mestre, de l'espècimen i dels
   fitxers del catàleg tocats. Calcada de qualitat.tpv.test.js.
   · ESLint amb la configuració del projecte i zero missatges.
   · Pedra Seca per text: cap style=, cap h1/h2, cap import de CSS ni :has(),
     classes sdp-* literals amb regla a alergens.css o als fulls canònics, cap
     CSS mort, només tokens que existixen, espais de l'escala, cap ombra, tot
     dins de @layer components, cap :hover ni :focus (no són controls) i
     icones 1:1.
   · Les còpies: les 14, una per id de la llista canònica i cap més; netes
     (cap declaració XML, DOCTYPE, serif, xlink ni xml:space; l'única adreça
     és l'espai de noms de l'SVG); casades PEL NOM (el color de cada
     al·lergen); quadrades de dibuix (viewBox 16×16: el marc retallat de tres
     originals és l'única normalització); i, mentre els originals del Mestre
     hi siguen, idèntiques a ells llevat del que es lleva i del marc.
   · El fons de la figura buidada és el mateix blanc en clar i en fosc.
   · Sense xarxa: el registre porta els SVG dins del paquet (import.meta.glob
     amb ?raw i eager) i servix URIs data: que es descodifiquen en el mateix
     SVG; cap petició ni cap ruta. La CSP admet data: a img-src.
   · Baseline 2022 (Safari 16.0, Chrome 100, Firefox 100) de JS i CSS.
   · La porta tooling/gates/tractor-cataleg.mjs (C1, C2 i C3), l'export a la
     façana i l'@import d'index.css.
   · Sense dades personals ni caràcters invisibles.
   · SONDES: cada detector és una funció pura i, al final, ha de denunciar una
     mostra dolenta. Una porta que no troba res perquè s'ha trencat no ix verd.
   Els patrons vetats es componen a trossos perquè les portes que llegixen
   src/ no els troben ací. */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';
import { ABREVIATURES_ALERGENS } from '../../utils/productes/producteUniversal.js';
import { ABREVIATURES, ICONES_ALERGENS, IDS_ALERGENS, NOMS, PREFIX_URI } from './recursos/alergens.js';

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');
const t = (...trossos) => trossos.join('');
const PS = 'src/components/PedraSeca';
const CAT = 'src/sections/disseny/cataleg';
const CSS = `${PS}/alergens.css`;

const NOM = 'IconesAlergens';
const COMPONENT = `${PS}/molecules/IconesAlergens.jsx`;
const REGISTRE_ICONES = `${PS}/recursos/alergens.js`;
const ESPECIMEN = `${CAT}/detalls/EspecimenIconesAlergens.jsx`;
const JSX = [COMPONENT, ESPECIMEN];
const PROVES = [`${PS}/molecules/IconesAlergens.test.jsx`, `${PS}/molecules/IconesAlergens.senseIcona.test.jsx`, `${PS}/qualitat.alergens.test.js`];
const TOCATS = [`${PS}/index.js`, `${CAT}/registre.js`, `${CAT}/manifest.js`, `${CAT}/detailRegistry.jsx`];
const TOTS = [...JSX, REGISTRE_ICONES, ...PROVES, ...TOCATS];

const COPIES = 'src/assets/alergens';
const ORIGENS = '_wiki_de_poble/04_escriptori/01_produccio/alergens_svg';
const ESPAI_DE_NOMS = t('ht', 'tp://www.w3.org/2000/svg');

/* El color de cada al·lergen als dibuixos del Mestre: un intercanvi de fitxers es veu ací. */
const COLORS = Object.freeze({
  gluten: [223, 124, 63], crustacis: [7, 165, 223], ous: [247, 160, 53], peix: [32, 58, 143], cacauets: [185, 130, 82],
  soja: [14, 167, 74], llet: [110, 66, 33], 'fruits-closca': [191, 87, 83], api: [132, 188, 37], mostassa: [190, 155, 58],
  sesam: [169, 159, 129], sulfits: [118, 21, 77], tramussos: [235, 198, 56], molluscs: [117, 201, 219]
});

/* El nom del Mestre (sense número, sense accents i en majúscula) → l'id. PEL NOM: la
   numeració del Mestre intercanvia 03 i 04 respecte de l'annex II. */
const PER_NOM = Object.freeze({
  GLUTEN: 'gluten', CRUSTACEOS: 'crustacis', PESCADO: 'peix', HUEVOS: 'ous', CACAHUETES: 'cacauets', SOJA: 'soja',
  LACTEOS: 'llet', 'FRUTOS DE CASCARA': 'fruits-closca', APIO: 'api', MOSTAZA: 'mostassa', SESAMO: 'sesam',
  SULFITOS: 'sulfits', ALTRAMUCES: 'tramussos', MOLUSCOS: 'molluscs'
});
const FORA_DE_L_ENCARREC = ['1-0-PORCION', '1-2-PORCION', 'CASTELLANO', 'INGLES'];

const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const classesDelCss = (css) => new Set([...senseComentaris(css).matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]));
const CSS_SRC = readdirSync(path.join(ARREL, 'src/css')).filter((f) => f.endsWith('.css')).map((f) => llig(`src/css/${f}`)).join('\n');
const CSS_CANONIC = [CSS_SRC, llig(`${PS}/pecesApps.css`), llig(`${PS}/catalegColleccio.css`)].join('\n');
const FULL = llig(CSS);
const FULL_NET = senseComentaris(FULL);
const TOKENS_DEFINITS = new Set([...CSS_SRC.matchAll(/(--sdp-[\w-]+)\s*:/g)].map((m) => m[1]));

/* Les classes sdp-* que nomena un JSX: tot literal entre cometes que ho siga. */
const classesNomenades = (codi) => [...codi.matchAll(/["'`]([^"'`\n]*\bsdp-[^"'`\n]*)["'`]/g)]
  .flatMap((m) => m[1].split(/\s+/)).filter((c) => /^sdp-[a-z0-9_-]+$/.test(c));

/* Les regles del full amb el seu context d'@-regles: [{ selectors, cos, context }]. */
function regles(css) {
  const net = senseComentaris(css);
  const pila = [];
  const fulles = [];
  let marca = 0;
  for (let i = 0; i < net.length; i += 1) {
    if (net[i] === '{') {
      pila.push({ cap: net.slice(marca, i).trim(), inici: i + 1 });
      marca = i + 1;
    } else if (net[i] === '}') {
      const bloc = pila.pop();
      if (bloc && !bloc.cap.startsWith('@')) {
        fulles.push({ selectors: bloc.cap.split(',').map((s) => s.trim()), cos: net.slice(bloc.inici, i), context: pila.map((p) => p.cap) });
      }
      marca = i + 1;
    }
  }
  return fulles;
}
const REGLES = regles(FULL);
const cosDe = (selector) => REGLES.filter((r) => r.selectors.includes(selector)).map((r) => r.cos).join(';');
const valorDe = (cos, propietat) => cos.match(new RegExp(`(?:^|[;\\s])${propietat}\\s*:\\s*([^;]+);`))?.[1].trim() ?? null;

/* ── Els detectors (funcions pures; les sondes del final en proven la vista) ── */

/** Les classes sdp-* nomenades que no tenen regla a cap full conegut. */
const classesOrfes = (codi, conegudes) => classesNomenades(codi).filter((c) => !conegudes.has(c));

/** Els colors en cru (hex, rgb, hsl, oklch, color-mix) i els tokens primitius. */
function colorsCrus(cssNet) {
  return [
    ...[...cssNet.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) => m[0]),
    ...[...cssNet.matchAll(/\b(?:rgba?|hsla?|oklch|color-mix)\(/g)].map((m) => m[0]),
    ...[...cssNet.matchAll(/var\(\s*(--sdp-(?:pedra|primary|secondary|blanc|negre|canon|error-|avis-|exit-)[\w-]*)/g)].map((m) => m[1])
  ];
}

/** Els tokens que el full fa servir i que cap full de src/css definix. */
const tokensFantasma = (cssNet, definits) => [...new Set([...cssNet.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]))].filter((tk) => !definits.has(tk));

/** Les regles que no són dins de @layer components. */
const foraDeCapa = (llistaRegles) => llistaRegles.filter((r) => r.context[0] !== '@layer components').map((r) => r.selectors.join(', '));

/** Les regles d'un control (:hover, :focus, :active): estes icones no en són. */
const regledeControl = (llistaRegles) => llistaRegles.filter((r) => r.selectors.some((s) => /:(?:hover|focus|active)/.test(s))).map((r) => r.selectors.join(', '));

/** Marges, coixins i separacions: { inspeccionades, dolents }. Bo: 0, auto o l'escala --sdp-space-N. */
function espaisDolents(cssNet) {
  const dolents = [];
  let inspeccionades = 0;
  for (const m of cssNet.matchAll(/(?:^|[;{\s])((?:margin|padding|gap|row-gap|column-gap)[\w-]*)\s*:\s*([^;}]+)/g)) {
    inspeccionades += 1;
    for (const valor of m[2].trim().split(/\s+/)) {
      const ok = valor === '0' || valor === 'auto' || /^var\(--sdp-space-\d+\)$/.test(valor)
        || (/^\d*\.?\d+rem$/.test(valor) && Number.isInteger(parseFloat(valor) * 4));
      if (!ok) dolents.push(`${m[1]}: ${valor}`);
    }
  }
  return { inspeccionades, dolents };
}

/** Les <img> a les quals falta alguna marca de la icona decorativa que pot fallar.
    Una URI data: no fa cap petició: ni loading ni referrerPolicy no hi tenen res a fer. */
const MARQUES_IMATGE = ['alt=""', 'decoding="async"', 'onError={'];
const imatgesSenseMarques = (codi) => [...codi.matchAll(/<img\b[^>]*>/g)].map((m) => m[0])
  .filter((img) => MARQUES_IMATGE.some((marca) => !img.includes(marca)));

/* L'única normalització del dibuix: el marc. Tres originals no són quadrats de dibuix
   (SOJA i CACAHUETES, viewBox 16×17 amb el disc a y 0..16 i una franja buida a baix;
   ALTRAMUCES, 17×17 amb el disc de 16 a x 0,897..16,897 i y 0,832..16,832): dins de la
   caixa 1:1 el disc eixia més menut i descentrat, i el fons hi feia una lluna. La còpia
   retalla el viewBox al disc de 16×16 i no toca cap camí. */
const ENQUADRAMENTS = Object.freeze({ soja: '0 0 16 16', cacauets: '0 0 16 16', tramussos: '0.897274 0.832487 16 16' });

/** Un original del Mestre net: el que la còpia lleva i, si l'id en té, el marc retallat. Res més. */
const neteja = (svg, id) => {
  const net = svg.replace(/\r\n/g, '\n')
    .replace(/^<\?xml[^>]*\?>\n/, '')
    .replace(/^<!DOCTYPE[^>]*>\n/, '')
    .replace(/ xmlns:xlink="[^"]*"/g, '')
    .replace(/ xml:space="[^"]*"/g, '')
    .replace(/ xmlns:serif="[^"]*"/g, '')
    .replace(/ serif:[\w-]+="[^"]*"/g, '');
  return Object.hasOwn(ENQUADRAMENTS, id ?? '') ? net.replace(/ viewBox="[^"]*"/, ` viewBox="${ENQUADRAMENTS[id]}"`) : net;
};

/** El viewBox d'un SVG: { x, y, amplada, alcada }, o null. */
function viewBoxDe(svg) {
  const m = svg.match(/ viewBox="([^"]*)"/);
  if (!m) return null;
  const [x, y, amplada, alcada] = m[1].trim().split(/\s+/).map(Number);
  return { x, y, amplada, alcada };
}

/* Els temes de tokens.css: el clar (tot el que hi ha abans del bloc fosc) i el fosc (el clar
   amb el bloc :root[data-theme="dark"] damunt). Resol un token fins al seu valor final. */
const TOKENS_NET = senseComentaris(llig('src/css/tokens.css'));
const INICI_FOSC = TOKENS_NET.indexOf(':root[data-theme="dark"]');
const declaracions = (text) => Object.fromEntries([...text.matchAll(/(--sdp-[\w-]+)\s*:\s*([^;{}]+);/g)].map((m) => [m[1], m[2].trim()]));
const TEMA_CLAR = declaracions(TOKENS_NET.slice(0, INICI_FOSC));
const TEMA_FOSC = { ...TEMA_CLAR, ...declaracions(TOKENS_NET.slice(TOKENS_NET.indexOf('{', INICI_FOSC) + 1, TOKENS_NET.indexOf('}', INICI_FOSC))) };
function resolToken(token, tema, vistos = new Set()) {
  if (vistos.has(token) || !Object.hasOwn(tema, token)) return null;
  const valor = tema[token];
  const nom = valor.match(/^var\(\s*(--sdp-[\w-]+)\s*\)$/)?.[1];
  return nom ? resolToken(nom, tema, new Set([...vistos, token])) : valor.toLowerCase();
}

/** El que una còpia no ha de portar: declaracions, atributs d'editor i adreces que no són l'espai de noms. */
function brutsDeLaCopia(svg) {
  const peces = [t('<', '?xml'), t('<', '!DOCTYPE'), 'serif', 'xlink', 'xml:space'].filter((peca) => svg.includes(peca));
  const adreces = [...svg.matchAll(/\bhttps?:\/\/[^"'\s)]+/g)].map((m) => m[0]).filter((adreca) => adreca !== ESPAI_DE_NOMS);
  return [...peces, ...adreces];
}

/** Els ids de la llista canònica escrits a mà com a clau d'un objecte literal ({ gluten: 'GL' }). */
const idsEscritsAMa = (codi) => [...codi.matchAll(/(?:^|[{,\s])'?([a-z][\w-]*)'?\s*:\s*'/gm)].map((m) => m[1])
  .filter((clau) => IDS_ALERGENS.includes(clau));

/** Els colors de farcit d'un SVG, com a triplets. */
const FARCIT = new RegExp(t('fill:rg', 'b\\((\\d+),(\\d+),(\\d+)\\)'), 'g');
const colorsDe = (svg) => [...svg.matchAll(FARCIT)].map((m) => m.slice(1, 4).map(Number));

/** El nom d'un fitxer del Mestre sense número, accents ni extensió: '02-CRUSTÁCEOS.svg' → 'CRUSTACEOS'. */
const nomDelFitxer = (fitxer) => fitxer.normalize('NFD').replace(/\p{M}/gu, '').replace(/\.svg$/i, '').replace(/^\d+-/, '');

describe('ESLint', () => {
  test('zero missatges, avisos inclosos', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles(TOTS.map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(TOTS.length);
    expect(missatges).toEqual([]);
    /* Sonda: la configuració del projecte és activa (un avís és un error amb --max-warnings=0). */
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, PS, 'sonda.js') });
    expect(sonda.messages.map((m) => m.ruleId)).toEqual(['no-unused-vars', 'eol-last']);
  }, 120000);
});

describe('Pedra Seca · JSX', () => {
  test('cap style=, cap h1 ni h2, cap import de CSS ni :has()', () => {
    const vetats = [
      [/\sstyle=[{"]/, 'style='],
      [new RegExp(['<h', '[12][\\s>]'].join('')), 'h1/h2'],
      [/^\s*import\s+[^;]*\.css['"]/m, 'import de CSS'],
      [new RegExp([':ha', 's\\('].join('')), ':has()']
    ];
    const trobats = JSX.flatMap((f) => vetats.filter(([patro]) => patro.test(llig(f))).map(([, que]) => `${f}: ${que}`));
    expect(trobats).toEqual([]);
  });

  test('cap className fet amb plantilla, i l’espècimen no en posa cap: el pinta la peça', () => {
    for (const f of JSX) expect(/className=\{`/.test(llig(f)), f).toBe(false);
    expect(/className=/.test(llig(ESPECIMEN))).toBe(false);
  });

  test('tota classe sdp-* de la peça té regla a alergens.css o a un full canònic', () => {
    const conegudes = new Set([...classesDelCss(FULL), ...classesDelCss(CSS_CANONIC)]);
    expect(classesOrfes(llig(COMPONENT), conegudes)).toEqual([]);
    expect(new Set(classesNomenades(llig(COMPONENT)))).toEqual(new Set([
      'sdp-alergens', 'sdp-alergens--mitjana', 'sdp-alergens__icona', 'sdp-alergens__abreviatura', 'sdp-alergens__resta'
    ]));
  });

  test('cap CSS mort: tota classe d’alergens.css la pinta la peça', () => {
    const usades = new Set(classesNomenades(llig(COMPONENT)));
    expect([...classesDelCss(FULL)].filter((c) => !usades.has(c))).toEqual([]);
  });

  test('cada icona: <img> decorativa, que no es pot arrossegar i amb alternativa (onError)', () => {
    const codi = llig(COMPONENT);
    expect(imatgesSenseMarques(codi)).toEqual([]);
    /* Cota: el detector veu l'única imatge de la peça. */
    expect([...codi.matchAll(/<img\b[^>]*>/g)]).toHaveLength(1);
    expect(codi).toContain('draggable="false"');
  });

  test('importa pel camí directe, mai per la façana, i no és cap control', () => {
    const codi = llig(COMPONENT);
    const especificadors = [...codi.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]);
    expect(especificadors).toEqual(['react', '../recursos/alergens.js']);
    expect(/<(?:button|a|input|select|textarea)\b|onClick|tabIndex/.test(codi)).toBe(false);
    expect(codi).toContain('role="img"');
  });

  test('presentacional: cap emmagatzematge, xarxa ni backend, cap global escrita', () => {
    const vetats = [
      [new RegExp(['local', 'Storage|session', 'Storage|indexed', 'DB'].join('')), 'emmagatzematge'],
      [new RegExp(['\\bfet', 'ch\\(|XMLHttp', 'Request|Web', 'Socket|new URL\\('].join('')), 'xarxa'],
      [/supabase|backendPort|adaptadors|SessionContext/, 'backend'],
      [/(?:window|globalThis)\.\w+\s*=[^=]/, 'global escrita']
    ];
    const trobats = [...JSX, REGISTRE_ICONES].flatMap((f) => vetats.filter(([patro]) => patro.test(llig(f))).map(([, que]) => `${f}: ${que}`));
    expect(trobats).toEqual([]);
  });

  test('la targeta de la Carta Digital: UniversalCard de sempre, amb la peça dins del cos (body)', () => {
    const especimen = llig(ESPECIMEN);
    expect(especimen).toMatch(/<UniversalCard[\s\S]*?body=\{\(\s*<>[\s\S]*?<IconesAlergens\b[\s\S]*?<\/>\s*\)\}/);
  });
});

describe('Pedra Seca · alergens.css', () => {
  test('només tokens semàntics: cap hex, rgb, hsl ni primitiu, i tots els tokens existixen', () => {
    expect(colorsCrus(FULL_NET)).toEqual([]);
    expect(tokensFantasma(FULL_NET, TOKENS_DEFINITS)).toEqual([]);
    /* Cota: el full fa servir tokens de veres. */
    expect(new Set([...FULL_NET.matchAll(/var\(\s*(--sdp-[\w-]+)/g)].map((m) => m[1])).size).toBeGreaterThan(5);
  });

  test('cap :has(), cap ombra, cap !important, tot dins de @layer components i cap regla de control', () => {
    expect(new RegExp([':ha', 's\\('].join('')).test(FULL_NET)).toBe(false);
    expect(/box-shadow|!important/.test(FULL_NET)).toBe(false);
    expect(FULL_NET.trim().startsWith('@layer components {')).toBe(true);
    expect(REGLES.length).toBeGreaterThan(4);
    expect(foraDeCapa(REGLES)).toEqual([]);
    expect(regledeControl(REGLES)).toEqual([]);
  });

  test('marges, coixins i separacions: 0, auto o l’escala --sdp-space-N; la separació, --sdp-space-1', () => {
    const { inspeccionades, dolents } = espaisDolents(FULL_NET);
    expect(dolents).toEqual([]);
    expect(inspeccionades).toBeGreaterThan(4);
    for (const [, valor] of FULL_NET.matchAll(/(\d*\.?\d+)rem/g)) expect(Number(valor) % 0.25, `${valor}rem`).toBe(0);
    expect(valorDe(cosDe('.sdp-alergens'), 'gap')).toBe('var(--sdp-space-1)');
  });

  /* El dibuix del Mestre és un disc de color amb la figura buidada: la figura es veu del color
     del fons de la icona. Amb el fons de la targeta, en fosc (#181715), el peix quedava a 1,76:1
     del seu disc. El fons ha de ser el blanc de sempre en clar i en fosc. */
  test('el fons de la figura buidada és el mateix blanc en clar i en fosc, i en clar és el de la targeta (cap píxel no canvia)', () => {
    const fons = valorDe(cosDe('.sdp-alergens__icona'), 'background');
    const token = fons?.match(/^var\(\s*(--sdp-[\w-]+)\s*\)$/)?.[1];
    expect(token, fons).toBeTruthy();
    expect(INICI_FOSC).toBeGreaterThan(0);
    expect(resolToken(token, TEMA_CLAR)).toBe('#ffffff');
    expect(resolToken(token, TEMA_FOSC)).toBe(resolToken(token, TEMA_CLAR));
    expect(resolToken(token, TEMA_CLAR)).toBe(resolToken('--sdp-fons-targeta', TEMA_CLAR));
    /* Sonda: el fons de la targeta sí que canvia amb el tema (el que fallava). */
    expect(resolToken('--sdp-fons-targeta', TEMA_FOSC)).not.toBe(resolToken('--sdp-fons-targeta', TEMA_CLAR));
  });

  test('les icones són 1:1: xicoteta 1.25rem i mitjana 2rem, i les pastilles fan la seua alçada', () => {
    for (const [selector, mida] of [['.sdp-alergens__icona', '1.25rem'], ['.sdp-alergens--mitjana .sdp-alergens__icona', '2rem']]) {
      const cos = cosDe(selector);
      expect(valorDe(cos, 'inline-size'), selector).toBe(mida);
      expect(valorDe(cos, 'block-size'), selector).toBe(mida);
    }
    expect(cosDe('.sdp-alergens__icona')).toMatch(/aspect-ratio:\s*1\s*\/\s*1/);
    expect(valorDe(cosDe('.sdp-alergens__resta'), 'block-size')).toBe('1.25rem');
    expect(valorDe(cosDe('.sdp-alergens--mitjana .sdp-alergens__resta'), 'block-size')).toBe('2rem');
  });

  test('la capçalera prescriu l’@import SENSE layer() i index.css l’importa una sola vegada, davant de tpv.css', () => {
    expect(FULL).toContain("@import url('../components/PedraSeca/alergens.css');");
    const index = senseComentaris(llig('src/css/index.css'));
    expect([...index.matchAll(/@import[^;]*alergens\.css[^;]*;/g)].map((m) => m[0])).toEqual(["@import url('../components/PedraSeca/alergens.css');"]);
    expect(index.indexOf('alergens.css')).toBeGreaterThan(index.indexOf('catalegColleccio.css'));
    expect(index.indexOf('alergens.css')).toBeLessThan(index.indexOf('tpv.css'));
  });
});

describe('les còpies dels SVG del Mestre (src/assets/alergens)', () => {
  const copies = readdirSync(path.join(ARREL, COPIES)).sort();

  test('una per al·lergen de la llista canònica, i cap més', () => {
    expect(IDS_ALERGENS).toHaveLength(14);
    expect(copies).toEqual(IDS_ALERGENS.map((id) => `${id}.svg`).sort());
  });

  test('netes: cap declaració XML, DOCTYPE, serif, xlink ni xml:space, i l’única adreça és l’espai de noms', () => {
    for (const fitxer of copies) {
      const svg = llig(`${COPIES}/${fitxer}`);
      expect(brutsDeLaCopia(svg), fitxer).toEqual([]);
      expect(svg.startsWith('<svg '), fitxer).toBe(true);
      expect(svg.endsWith('</svg>\n'), fitxer).toBe(true);
      expect(svg, fitxer).toContain(`xmlns="${ESPAI_DE_NOMS}"`);
    }
  });

  test('quadrades de dibuix: totes amb un viewBox de 16×16 (el disc omple la caixa 1:1); el marc retallat, només on cal', () => {
    for (const fitxer of copies) {
      const id = fitxer.replace(/\.svg$/, '');
      const marc = viewBoxDe(llig(`${COPIES}/${fitxer}`));
      expect([marc?.amplada, marc?.alcada], fitxer).toEqual([16, 16]);
      expect(`${marc.x} ${marc.y} 16 16`, fitxer).toBe(Object.hasOwn(ENQUADRAMENTS, id) ? ENQUADRAMENTS[id] : '0 0 16 16');
    }
    expect(Object.keys(ENQUADRAMENTS).every((id) => IDS_ALERGENS.includes(id))).toBe(true);
  });

  test('casades pel nom: cada còpia porta el color del seu al·lergen (el peix, blau; els ous, taronja)', () => {
    for (const id of IDS_ALERGENS) expect(colorsDe(llig(`${COPIES}/${id}.svg`)), id).toEqual([COLORS[id]]);
    /* Els 14 colors són diferents: un fitxer repetit es veuria. */
    expect(new Set(Object.values(COLORS).map(String)).size).toBe(14);
  });
});

/* Mentre els originals siguen a la zona humana (01_produccio), la còpia ha de ser l'original
   net, byte a byte. Si el Mestre els trasllada, este bloc es salta (i ho diu el resum de la
   prova): els colors de dalt continuen vigilant que cap fitxer canvie de lloc. */
describe.runIf(existsSync(path.join(ARREL, ORIGENS)))('les còpies són fidels als originals del Mestre', () => {
  const originals = readdirSync(path.join(ARREL, ORIGENS)).filter((f) => /\.svg$/i.test(f));

  test('els 14 es casen pel nom, i els altres quatre no entren en l’encàrrec', () => {
    const casats = originals.map((f) => PER_NOM[nomDelFitxer(f)]).filter(Boolean);
    expect(casats.sort()).toEqual([...IDS_ALERGENS].sort());
    const fora = originals.filter((f) => !PER_NOM[nomDelFitxer(f)]).map((f) => f.normalize('NFC').replace(/\.svg$/i, '')).sort();
    expect(fora).toEqual(FORA_DE_L_ENCARREC);
    /* La numeració del Mestre intercanvia 03 i 04: mana el nom. */
    expect(originals.filter((f) => /^0[34]-/.test(f)).map((f) => [f.slice(0, 2), PER_NOM[nomDelFitxer(f)]]).sort())
      .toEqual([['03', 'peix'], ['04', 'ous']]);
  });

  test('cada còpia és el seu original net, byte a byte (el marc retallat, l’única normalització)', () => {
    for (const fitxer of originals) {
      const id = PER_NOM[nomDelFitxer(fitxer)];
      if (!id) continue;
      expect(llig(`${COPIES}/${id}.svg`), `${fitxer} → ${id}`).toBe(neteja(readFileSync(path.join(ARREL, ORIGENS, fitxer), 'utf8'), id));
    }
  });

  test('el marc es retalla només als originals que no són de 16×16 des de l’origen, i a tots ells', () => {
    const noQuadrats = originals.filter((f) => PER_NOM[nomDelFitxer(f)])
      .filter((f) => {
        const marc = viewBoxDe(readFileSync(path.join(ARREL, ORIGENS, f), 'utf8'));
        return `${marc.x} ${marc.y} ${marc.amplada} ${marc.alcada}` !== '0 0 16 16';
      })
      .map((f) => PER_NOM[nomDelFitxer(f)]).sort();
    expect(noQuadrats).toEqual(Object.keys(ENQUADRAMENTS).sort());
  });
});

describe('el registre (recursos/alergens.js): dins del paquet i sense xarxa', () => {
  test('carrega els SVG com a text dins del paquet, amb els ids i els noms de la llista canònica', () => {
    const codi = llig(REGISTRE_ICONES);
    expect(codi).toContain("import.meta.glob('../../../assets/alergens/*.svg', { query: '?raw', import: 'default', eager: true })");
    expect(codi).toContain("from '../../../utils/productes/producteUniversal.js'");
    expect(/\/assets\/|https?:/.test(senseComentaris(codi).replace(/import\.meta\.glob\([^)]*\)/, ''))).toBe(false);
  });

  test('una URI data: per a cada un dels 14, que es descodifica en el SVG de la seua còpia', () => {
    expect(PREFIX_URI).toBe('data:image/svg+xml;charset=utf-8,');
    expect(Object.keys(ICONES_ALERGENS)).toEqual([...IDS_ALERGENS]);
    for (const id of IDS_ALERGENS) {
      const uri = ICONES_ALERGENS[id];
      expect(uri.startsWith(PREFIX_URI), id).toBe(true);
      /* Codificada: cap blanc, cometa, angle ni coixinet en cru dins de la URI. */
      expect(/[\s"'<>#]/.test(uri.slice(PREFIX_URI.length)), id).toBe(false);
      expect(decodeURIComponent(uri.slice(PREFIX_URI.length)), id).toBe(llig(`${COPIES}/${id}.svg`).replace(/>\s+</g, '><').trim());
    }
    expect(Object.isFrozen(ICONES_ALERGENS)).toBe(true);
  });

  test('els noms, en minúscula per a dir-los dins d’una frase, i una abreviatura per a cada un', () => {
    expect(Object.keys(NOMS)).toEqual([...IDS_ALERGENS]);
    for (const id of IDS_ALERGENS) expect(NOMS[id], id).toBe(NOMS[id].toLocaleLowerCase('ca'));
    expect([NOMS['fruits-closca'], NOMS.sulfits, NOMS.molluscs, NOMS.sesam]).toEqual(['fruits de closca', 'diòxid de sofre i sulfits', 'mol·luscs', 'sèsam']);
    expect(Object.keys(ABREVIATURES).sort()).toEqual([...IDS_ALERGENS].sort());
  });

  test('les abreviatures són les de la llista canònica (el mateix objecte): el registre no escriu cap id a mà', () => {
    expect(ABREVIATURES).toBe(ABREVIATURES_ALERGENS);
    expect(idsEscritsAMa(senseComentaris(llig(REGISTRE_ICONES)))).toEqual([]);
  });

  test('la CSP admet data: a img-src (index.html i vercel.json)', () => {
    for (const fitxer of ['index.html', 'vercel.json']) {
      const imgSrc = llig(fitxer).match(/img-src([^;"]*)/);
      expect(imgSrc, fitxer).not.toBeNull();
      expect(imgSrc[1].trim().split(/\s+/), fitxer).toContain('data:');
    }
  });
});

describe('Baseline 2022 (Safari 16.0, Chrome 100, Firefox 100)', () => {
  test('JS: cap API més nova ni lookbehind', () => {
    const vetat = /\.(?:findLast|findLastIndex|toSorted|toReversed|toSpliced|with)\(|Object\.groupBy|withResolvers|\(\?<[=!]/;
    for (const f of [...JSX, REGISTRE_ICONES]) expect(vetat.test(llig(f)), f).toBe(false);
  });

  test('CSS: cap @container, subgrid, color-mix, unitats dv/sv/lv ni propietats de transformació soltes', () => {
    expect(FULL_NET).not.toMatch(/@container|subgrid|color-mix|\b\d*\.?\d+(?:dv|sv|lv)(?:h|w)\b/);
    expect(FULL_NET).not.toMatch(/(?:^|[;{\s])(?:rotate|scale|translate)\s*:/);
  });
});

describe('la porta del catàleg (tooling/gates/tractor-cataleg.mjs) per a IconesAlergens', () => {
  const registre = llig(`${CAT}/registre.js`);
  /* Les mateixes expressions que la porta. */
  const entrades = [...registre.matchAll(/\{\s*nom:\s*'([^']+)',\s*fitxer:\s*'([^']+)'[^}]*estat:\s*'(\w+)'([^}]*)\}/g)]
    .map(([, nom, fitxer, estat, resta]) => ({ nom, fitxer, estat, fora: /fora:\s*true/.test(resta) }));
  const detalls = readdirSync(path.join(ARREL, CAT, 'detalls')).filter((f) => /^Especimen.*\.jsx$/.test(f))
    .map((f) => llig(`${CAT}/detalls/${f}`)).join('\n');
  const importats = new Set([...detalls.matchAll(/import\s*\{([^}]+)\}\s*from\s*'[^']*(?:components\/(?:ui|PedraSeca)\/[^']+|UniversalElements)'/g)]
    .flatMap((m) => m[1].split(',').map((s) => s.trim()).filter(Boolean)));

  test('C1 registrat, C2 viu en un espècimen que el munta, C3 l’export existix', () => {
    const exportats = [...llig(COMPONENT).matchAll(/^export\s+(?:function|const)\s+([A-Z]\w*)/gm)].map((m) => m[1]);
    expect(exportats).toEqual([NOM]);
    expect(entrades.find((e) => e.nom === NOM)).toEqual({ nom: NOM, fitxer: 'PedraSeca/molecules/IconesAlergens.jsx', estat: 'viu', fora: false });
    expect(importats.has(NOM)).toBe(true);
    expect(llig(ESPECIMEN)).toMatch(new RegExp(`<${NOM}\\b`));
  });

  test('la façana l’exporta, i el catàleg en té l’ítem i el carregador; el TPV la munta', () => {
    expect(llig(`${PS}/index.js`)).toContain(`export { ${NOM} } from './molecules/IconesAlergens.jsx';`);
    expect(llig(`${CAT}/manifest.js`)).toMatch(/especimen\('fonaments', 'icones-alergens',/);
    expect(llig(`${CAT}/detailRegistry.jsx`)).toContain("'fonaments/icones-alergens': lazyRoute(() => import('./detalls/EspecimenIconesAlergens.jsx')),");
    expect(llig(`${PS}/organismes/UniversalTPV.jsx`)).toContain("import { IconesAlergens } from '../molecules/IconesAlergens.jsx';");
  });
});

describe('dades sintètiques', () => {
  test('cap correu, telèfon, DNI/NIE, IBAN ni URL http(s)', () => {
    const vetats = [
      [/[\w.+-]+@[\w-]+\.[a-z]{2,}/i, 'correu'],
      [/\b(?:\+34[\s.-]?)?[6789]\d{2}[\s.-]?\d{3}[\s.-]?\d{3}\b/, 'telèfon'],
      [/\b[XYZ]?\d{7,8}[A-HJ-NP-TV-Z]\b/, 'DNI/NIE'],
      [/\bES\d{2}[\s]?\d{4}/, 'IBAN'],
      [new RegExp(['ht', 'tps?:', '\\/\\/'].join('')), 'URL']
    ];
    const fitxers = [...JSX, REGISTRE_ICONES, ...PROVES, CSS];
    const trobats = fitxers.flatMap((f) => vetats.filter(([patro]) => patro.test(llig(f))).map(([, que]) => `${f}: ${que}`));
    expect(trobats).toEqual([]);
  });

  test('cap caràcter de control, invisible, combinant ni bidi en cru (les còpies dels SVG incloses)', () => {
    const rangs = [[0x0000, 0x0008], [0x000B, 0x001F], [0x007F, 0x009F], [0x0300, 0x036F], [0x061C, 0x061C], [0x200B, 0x200F],
      [0x202A, 0x202E], [0x2060, 0x2069], [0xFEFF, 0xFEFF]];
    const car = (cp) => String.fromCodePoint(cp);
    const re = new RegExp(`[${rangs.map(([a, b]) => (a === b ? car(a) : `${car(a)}-${car(b)}`)).join('')}]`, 'u');
    const copies = IDS_ALERGENS.map((id) => `${COPIES}/${id}.svg`);
    for (const fitxer of [...TOTS, CSS, ...copies]) expect(re.test(llig(fitxer)), fitxer).toBe(false);
  });
});

/* Les sondes: cada detector ha de denunciar una mostra dolenta. Les mostres
   es componen a trossos (les portes que llegixen src/ no les han de trobar). */
describe('les sondes: els detectors denuncien una mostra dolenta', () => {
  const dinsDeCapa = (cos) => t('@layer components { ', cos, ' }');

  test('espais: un valor fora de l’escala, i la cota compta el que inspecciona', () => {
    const { inspeccionades, dolents } = espaisDolents(dinsDeCapa(t('.x { pad', 'ding: 3', 'px; gap: var(--sdp-space-1); }')));
    expect(dolents).toEqual([t('pad', 'ding: 3', 'px')]);
    expect(inspeccionades).toBe(2);
  });

  test('capa i control: una regla fora de @layer components i un :hover', () => {
    expect(foraDeCapa(regles('.x { color: inherit; }'))).toEqual(['.x']);
    expect(foraDeCapa(regles(dinsDeCapa('.x { color: inherit; }')))).toEqual([]);
    expect(regledeControl(regles(dinsDeCapa('.x:hover { color: inherit; } .y { color: inherit; }')))).toEqual(['.x:hover']);
  });

  test('colors i tokens: un hex, un rgb, un primitiu i un token que cap full no definix', () => {
    const mostra = t('.x { color: #', 'fff; background: rg', 'b(0 0 0); border-color: var(--sdp-pe', 'dra-500); }');
    expect(colorsCrus(mostra)).toEqual([t('#', 'fff'), t('rg', 'b('), t('--sdp-pe', 'dra-500')]);
    const inventat = t('--sdp-', 'inventat');
    expect(tokensFantasma(`.x { color: var(${inventat}); background: var(--sdp-fons-targeta); }`, TOKENS_DEFINITS)).toEqual([inventat]);
  });

  test('classes: una sdp-* sense regla en cap full', () => {
    const conegudes = new Set([...classesDelCss(FULL), ...classesDelCss(CSS_CANONIC)]);
    const inventada = t('sdp-', 'inventada');
    expect(classesOrfes(`<span className="${inventada} sdp-alergens" />`, conegudes)).toEqual([inventada]);
  });

  test('imatges: una <img> sense onError', () => {
    const dolenta = t('<im', 'g src={uri} alt="" decoding="async" />');
    const bona = t('<im', 'g src={uri} alt="" decoding="async" onError={falla} />');
    expect(imatgesSenseMarques(`${dolenta}\n${bona}`)).toEqual([dolenta]);
  });

  test('còpies: l’original es neteja de les quatre coses i res més; una còpia bruta es denuncia', () => {
    const original = [
      t('<', '?xml version="1.0" encoding="UTF-8" standalone="no"?>'),
      t('<', '!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "', 'ht', 'tp://exemple.test/svg11.dtd">'),
      t('<svg viewBox="0 0 16 16" xmlns="', ESPAI_DE_NOMS, '" xmlns:xl', 'ink="u" xml:sp', 'ace="preserve" xmlns:se', 'rif="u">'),
      t('<g id="_01-X" se', 'rif:id="01-X"><path d="M0,0Z" style="fill:rg', 'b(1,2,3);"/></g>'),
      '</svg>',
      ''
    ].join('\n');
    const neta = neteja(original);
    expect(neta).toBe(t('<svg viewBox="0 0 16 16" xmlns="', ESPAI_DE_NOMS, '">\n<g id="_01-X"><path d="M0,0Z" style="fill:rg', 'b(1,2,3);"/></g>\n</svg>\n'));
    expect(brutsDeLaCopia(neta)).toEqual([]);
    expect(brutsDeLaCopia(original)).toEqual([t('<', '?xml'), t('<', '!DOCTYPE'), 'serif', 'xlink', 'xml:space', t('ht', 'tp://exemple.test/svg11.dtd')]);
    expect(colorsDe(neta)).toEqual([[1, 2, 3]]);
  });

  test('marc: només els ids d’ENQUADRAMENTS el retallen, i el viewBox es llig en números', () => {
    const original = t('<svg viewBox="0 0 17 17" xmlns="', ESPAI_DE_NOMS, '">\n<path d="M0,0Z"/>\n</svg>\n');
    expect(viewBoxDe(neteja(original, 'tramussos'))).toEqual({ x: 0.897274, y: 0.832487, amplada: 16, alcada: 16 });
    expect(neteja(original, 'tramussos')).toContain('<path d="M0,0Z"/>');
    expect(neteja(original, 'peix')).toBe(original);
    expect(neteja(original)).toBe(original);
    expect(viewBoxDe('<svg>')).toBeNull();
  });

  test('ids a mà: una abreviatura escrita com a objecte literal es denuncia; una referència, no', () => {
    expect(idsEscritsAMa("const A = Object.freeze({ gluten: 'GL', 'fruits-closca': 'FC', altre: 'X' });")).toEqual(['gluten', 'fruits-closca']);
    expect(idsEscritsAMa('export const ABREVIATURES = ABREVIATURES_ALERGENS;')).toEqual([]);
  });

  test('temes: el token resolt fins al valor, en clar i en fosc; un token que no existix, null', () => {
    expect(resolToken('--sdp-fons-targeta', TEMA_CLAR)).toBe('#ffffff');
    expect(resolToken('--sdp-fons-targeta', TEMA_FOSC)).toMatch(/^#[0-9a-f]{6}$/);
    expect(resolToken(t('--sdp-', 'inventat'), TEMA_CLAR)).toBeNull();
  });

  test('noms del Mestre: sense número, accents ni extensió, siga quina siga la normalització', () => {
    const crustacis = t('02-CRUST', String.fromCodePoint(0xC1), 'CEOS.svg');
    expect(nomDelFitxer(crustacis)).toBe('CRUSTACEOS');
    expect(nomDelFitxer(crustacis.normalize('NFD'))).toBe('CRUSTACEOS');
    expect(nomDelFitxer('08-FRUTOS DE CÁSCARA.svg')).toBe('FRUTOS DE CASCARA');
    expect(nomDelFitxer('1-0-PORCION.svg')).toBe('0-PORCION');
    expect(PER_NOM[nomDelFitxer('03-PESCADO.svg')]).toBe('peix');
  });
});
