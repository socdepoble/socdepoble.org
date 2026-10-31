// @vitest-environment node
/* TPV Universal (ordre del Mestre, 261006: prompt 261006_1215 i skill
   sdp-clon-loiverse) · qualitat d'UniversalTPV, del seu full tpv.css, de
   l'espècimen i dels fitxers del catàleg tocats. Calcada de
   qualitat.pecesApps.test.js i de src/apps/comu/qualitat.test.js.
   · ESLint amb la configuració del projecte i zero missatges.
   · Pedra Seca per text: cap style=, cap h1/h2, cap import de CSS ni :has(),
     classes sdp-* literals amb regla a tpv.css o als fulls canònics, cap CSS
     mort, només tokens que existixen, espais de l'escala, cap ombra, tot dins
     de @layer components, cada :hover només amb ratolí, controls ≥ --sdp-touch
     i quadrats 1:1.
   · Baseline 2022 (Safari 16.0, Chrome 100, Firefox 100) de JS i CSS.
   · La porta tooling/gates/tractor-cataleg.mjs (C1, C2 i C3), l'export a la
     façana i l'@import d'index.css.
   · Presentacional i sense dades personals.
   · Sense xarxa (ordre del Mestre, 261006): tota <img> de la peça porta alt
     buit, loading lazy, decoding async, cap referent i onError.
   · SONDES: cada detector és una funció pura i, al final, ha de denunciar una
     mostra dolenta. Una porta que no troba res perquè s'ha trencat no ix verd.
   Els patrons vetats es componen a trossos perquè les portes que llegixen
   src/ no els troben ací. */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');
const PS = 'src/components/PedraSeca';
const CAT = 'src/sections/disseny/cataleg';
/* tractor-vocabulari (ordre del Mestre, 261030) · El full ja no viu al costat de
   la peça: és el bloc tpv de src/css/modules.css, entre les seues marques. */
const MODULS = 'src/css/modules.css';
const CSS_ANTIC = `${PS}/tpv.css`;
const blocDeModuls = (nom) => {
  const tot = llig(MODULS);
  const inici = tot.indexOf(`/* ═══ BLOC ${nom} · `);
  const fi = tot.indexOf(`/* ═══ FI DEL BLOC ${nom} ═══ */`);
  if (inici < 0 || fi < inici) throw new Error(`${MODULS} no té el bloc ${nom}`);
  return tot.slice(inici, fi);
};

const NOM = 'UniversalTPV';
const COMPONENT = `${PS}/organismes/UniversalTPV.jsx`;
const ESPECIMEN = `${CAT}/detalls/EspecimenUniversalTPV.jsx`;
const JSX = [COMPONENT, ESPECIMEN];
const PROVES = [`${PS}/organismes/UniversalTPV.test.jsx`, `${CAT}/detalls/EspecimensApps.test.jsx`, `${PS}/qualitat.tpv.test.js`];
const TOCATS = [`${PS}/index.js`, `${CAT}/registre.js`, `${CAT}/manifest.js`, `${CAT}/detailRegistry.jsx`];
const TOTS = [...JSX, ...PROVES, ...TOCATS];

const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const classesDelCss = (css) => new Set([...senseComentaris(css).matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]));
const CSS_SRC = readdirSync(path.join(ARREL, 'src/css')).filter((f) => f.endsWith('.css')).map((f) => llig(`src/css/${f}`)).join('\n');
/* Els fulls canònics: src/css i els dos fulls germans de les peces de les apps. */
const FULL = blocDeModuls('tpv');
const FULL_NET = senseComentaris(FULL);
/* Els fulls canònics sense el bloc mateix: src/css, amb els blocs germans
   (pecesApps, catalegColleccio…) de modules.css. Sense el bloc, «cap CSS mort»
   continua mirant les classes que només definix el TPV. */
const CSS_CANONIC = CSS_SRC.replace(FULL, '');

/* Les classes sdp-* que nomena un JSX: tot literal entre cometes que ho siga
   (className, ternàries, llistes i constants de classes). */
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
const TOKENS_DEFINITS = new Set([...CSS_SRC.matchAll(/(--sdp-[\w-]+)\s*:/g)].map((m) => m[1]));

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

/** Sense xarxa (ordre del Mestre, 261006): les <img> a les quals falta alguna
    de les marques de la imatge decorativa que pot fallar. */
const MARQUES_IMATGE = ['alt=""', 'loading="lazy"', 'decoding="async"', 'referrerPolicy="no-referrer"', 'onError={'];
const imatgesSenseAlternativa = (codi) => [...codi.matchAll(/<img\b[^>]*>/g)].map((m) => m[0])
  .filter((img) => MARQUES_IMATGE.some((marca) => !img.includes(marca)));

/** Els tokens que el full fa servir i que cap full de src/css definix. */
const tokensFantasma = (cssNet, definits) => [...new Set([...cssNet.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]))].filter((t) => !definits.has(t));

/** Les regles que no són dins de @layer components. */
const foraDeCapa = (llistaRegles) => llistaRegles.filter((r) => r.context[0] !== '@layer components').map((r) => r.selectors.join(', '));

/** Les regles amb :hover fora de @media (hover: hover) and (pointer: fine). */
const hoversSolts = (llistaRegles) => llistaRegles.filter((r) => r.selectors.some((s) => s.includes(':hover')))
  .filter((r) => !r.context.includes('@media (hover: hover) and (pointer: fine)')).map((r) => r.selectors.join(', '));

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

  test('cap className fet amb plantilla: totes les classes són literals que es poden buscar', () => {
    for (const f of JSX) expect(/className=\{`/.test(llig(f)), f).toBe(false);
  });

  test('tota classe sdp-* nomenada té regla a tpv.css o a un full canònic', () => {
    const conegudes = new Set([...classesDelCss(FULL), ...classesDelCss(CSS_CANONIC)]);
    const orfes = JSX.flatMap((f) => classesOrfes(llig(f), conegudes).map((c) => `${f}: ${c}`));
    expect(orfes).toEqual([]);
    expect(classesNomenades(llig(COMPONENT))).toEqual(expect.arrayContaining(['sdp-tpv', 'sdp-tpv__rajola', 'sdp-tpv__accions']));
    /* Cota: el detector veu de veres les classes de la peça (n'hi ha més de 40). */
    expect(new Set(classesNomenades(llig(COMPONENT))).size).toBeGreaterThan(40);
  });

  test('cap CSS mort: tota classe pròpia de tpv.css la pinta la peça o l’espècimen', () => {
    /* El bloc s'ha llevat de veres dels fulls externs (una sola vegada). */
    expect(CSS_CANONIC.length).toBe(CSS_SRC.length - FULL.length);
    const externes = classesDelCss(CSS_CANONIC);
    const usades = new Set(JSX.flatMap((f) => classesNomenades(llig(f))));
    const mortes = [...classesDelCss(FULL)].filter((c) => !externes.has(c) && !usades.has(c));
    expect(mortes).toEqual([]);
  });

  test('sense xarxa: tota <img> de la peça és decorativa, mandrosa, sense referent i amb alternativa (onError)', () => {
    expect(imatgesSenseAlternativa(llig(COMPONENT))).toEqual([]);
    /* Cota: el detector veu les dues imatges de la peça (el logotip i la foto de la rajola). */
    expect([...llig(COMPONENT).matchAll(/<img\b[^>]*>/g)]).toHaveLength(2);
  });

  test('importa Pedra Seca pel camí directe, mai per la façana', () => {
    const especificadors = [...llig(COMPONENT).matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]);
    expect(especificadors.filter((e) => /(?:^|\/)index\.js$/.test(e))).toEqual([]);
  });

  test('presentacional: cap emmagatzematge, xarxa ni backend, cap global escrita', () => {
    const vetats = [
      [new RegExp(['local', 'Storage|session', 'Storage|indexed', 'DB'].join('')), 'emmagatzematge'],
      [new RegExp(['\\bfet', 'ch\\(|XMLHttp', 'Request|Web', 'Socket'].join('')), 'xarxa'],
      [/supabase|backendPort|adaptadors|SessionContext/, 'backend'],
      [/(?:window|globalThis)\.\w+\s*=[^=]/, 'global escrita']
    ];
    const trobats = JSX.flatMap((f) => vetats.filter(([patro]) => patro.test(llig(f))).map(([, que]) => `${f}: ${que}`));
    expect(trobats).toEqual([]);
  });
});

describe('Pedra Seca · tpv.css', () => {
  test('només tokens semàntics: cap hex, rgb, hsl ni primitiu, i tots els tokens existixen', () => {
    expect(colorsCrus(FULL_NET)).toEqual([]);
    expect(tokensFantasma(FULL_NET, TOKENS_DEFINITS)).toEqual([]);
    /* Cota: el full fa servir tokens de veres (el detector no mira un full buit). */
    expect(new Set([...FULL_NET.matchAll(/var\(\s*(--sdp-[\w-]+)/g)].map((m) => m[1])).size).toBeGreaterThan(30);
  });

  test('cap :has(), cap ombra, cap !important, i tot dins de @layer components', () => {
    expect(new RegExp([':ha', 's\\('].join('')).test(FULL_NET)).toBe(false);
    expect(/box-shadow|!important/.test(FULL_NET)).toBe(false);
    expect(FULL_NET.trim().startsWith('@layer components {')).toBe(true);
    expect(REGLES.length).toBeGreaterThan(50);
    expect(foraDeCapa(REGLES)).toEqual([]);
  });

  test('cada :hover, dins de @media (hover: hover) and (pointer: fine)', () => {
    expect(hoversSolts(REGLES)).toEqual([]);
    /* Cota: el full té hovers i el detector els veu. */
    expect(REGLES.filter((r) => r.selectors.some((s) => s.includes(':hover'))).length).toBeGreaterThan(4);
  });

  test('marges, coixins i separacions: 0, auto o l’escala --sdp-space-N (múltiples de 0.25rem)', () => {
    const { inspeccionades, dolents } = espaisDolents(FULL_NET);
    expect(dolents).toEqual([]);
    /* Cota: si l'expressió deixara de casar, no inspeccionaria res i acceptaria qualsevol valor. */
    expect(inspeccionades).toBeGreaterThan(40);
    for (const [, valor] of FULL_NET.matchAll(/(\d*\.?\d+)rem/g)) expect(Number(valor) % 0.25, `${valor}rem`).toBe(0);
  });

  test('els controls fan almenys --sdp-touch i els quadrats són 1:1', () => {
    for (const control of ['.sdp-tpv__rajola', '.sdp-tpv__linia', '.sdp-tpv__accio', '.sdp-tpv__opcio', '.sdp-control.sdp-tpv__camp-cerca']) {
      expect(cosDe(control), control).toMatch(/min-block-size:\s*var\(--sdp-touch(?:-comode)?\)/);
    }
    expect(cosDe('.sdp-tpv__rajola')).toMatch(/min-inline-size:\s*var\(--sdp-touch\)/);
    for (const quadrat of ['.sdp-tpv__rajola', '.sdp-tpv__rajola--imatge .sdp-tpv__media', '.sdp-tpv__marca', '.sdp-tpv__logotip']) {
      expect(cosDe(quadrat), quadrat).toMatch(/aspect-ratio:\s*1\s*\/\s*1/);
    }
  });

  test('la Llei de Scroll: la peça ompli el contenidor i només les línies i la graella fan scroll', () => {
    expect(cosDe('.sdp-tpv')).toMatch(/block-size:\s*100%/);
    expect(cosDe('.sdp-tpv')).toMatch(/overflow:\s*hidden/);
    const ambScroll = REGLES.filter((r) => /overflow(?:-y)?:\s*(?:auto|scroll)/.test(r.cos)).flatMap((r) => r.selectors);
    expect(ambScroll.sort()).toEqual(['.sdp-tpv__buit', '.sdp-tpv__graella', '.sdp-tpv__linies']);
  });

  test('les dues disposicions penjen de data-mida; la graella densa i el tiquet d’uns 22rem', () => {
    expect(cosDe('.sdp-tpv[data-mida="ampla"]')).toMatch(/grid-template-columns:\s*minmax\(18rem, 24rem\) minmax\(0, 1fr\)/);
    expect(cosDe('.sdp-tpv[data-mida="estreta"]')).toMatch(/flex-direction:\s*column/);
    expect(cosDe('.sdp-tpv__graella')).toMatch(/grid-template-columns:\s*repeat\(auto-fill, minmax\(7\.5rem, 1fr\)\)/);
    expect(cosDe('.sdp-tpv__graella')).toMatch(/gap:\s*var\(--sdp-space-2\)/);
  });

  /* Ordre del Mestre, 261006 («vital per a la Carta Digital i el TPV») · la
     cantonada dels al·lèrgens, com la insígnia: fora del toc i per damunt de la
     banda; amb insígnia (abans al DOM), la cantonada de la dreta queda lliure;
     a la comanda, davall de la marca i de la insígnia, amb tota l'amplada. */
  test('la cantonada dels al·lèrgens: a dalt a l’esquerra, sense toc, per damunt de la banda i sense tapar la insígnia ni la marca', () => {
    const cos = cosDe('.sdp-tpv__alergens');
    for (const declaracio of [/position:\s*absolute/, /inset-block-start:\s*var\(--sdp-space-1\)/, /inset-inline-start:\s*var\(--sdp-space-1\)/,
      /z-index:\s*2/, /pointer-events:\s*none/, /max-inline-size:\s*calc\(100% - var\(--sdp-space-2\)\)/]) {
      expect(cos).toMatch(declaracio);
    }
    expect(cosDe('.sdp-tpv__insignia ~ .sdp-tpv__alergens')).toMatch(/max-inline-size:\s*calc\(100% - 3\.75rem\)/);
    /* La marca, de --sdp-space-6, comença a --sdp-space-1 de dalt: les icones, un --sdp-space-1 més avall del seu peu. */
    expect(cosDe('.sdp-tpv__marca-colleccio')).toMatch(/block-size:\s*var\(--sdp-space-6\)/);
    expect(cosDe('.sdp-tpv__element--en-colleccio > .sdp-tpv__alergens')).toMatch(/inset-block-start:\s*calc\(var\(--sdp-space-2\) \+ var\(--sdp-space-6\)\)/);
    /* La regla de la comanda va darrere de la de la insígnia: amb les dues, mana la de la comanda. */
    const ordre = REGLES.map((r) => r.selectors.join(', '));
    expect(ordre.indexOf('.sdp-tpv__element--en-colleccio > .sdp-tpv__alergens')).toBeGreaterThan(ordre.indexOf('.sdp-tpv__insignia ~ .sdp-tpv__alergens'));
    /* Ni un forat a la rajola sense al·lèrgens: cap regla nova toca el botó, la marca ni la insígnia soles. */
    expect(REGLES.filter((r) => r.selectors.some((s) => s.includes('alergens'))).flatMap((r) => r.selectors).sort())
      .toEqual(['.sdp-tpv__alergens', '.sdp-tpv__element--en-colleccio > .sdp-tpv__alergens', '.sdp-tpv__insignia ~ .sdp-tpv__alergens']);
  });

  test('el panell de pestanyes amb display propi té la seua regla [hidden]', () => {
    expect(FULL_NET).toMatch(/\.sdp-tpv__pestanyes \.sdp-pestanyes__panell\[hidden\]\s*\{\s*display:\s*none;/);
  });

  /* tractor-vocabulari (261030) · El bloc viu una sola vegada a modules.css,
     darrere dels blocs germans (les seues regles s'hi poden ajustar) i, com
     abans darrere de modules.css, darrere de tota regla del full que ajusta:
     cap regla posterior als blocs migrats no toca .sdp-control, .sdp-pindola
     ni .sdp-pestanyes (si no, guanyaria per ordre on abans perdia). */
  test('viu a modules.css: un sol bloc, darrere de catalegColleccio i alergens, cap regla posterior que l’ajuste, i ni fitxer ni @import del full antic', () => {
    const moduls = llig(MODULS);
    const posicio = (marca) => {
      const i = moduls.indexOf(marca);
      expect(i, marca).toBeGreaterThan(-1);
      return i;
    };
    expect(moduls.split('/* ═══ BLOC tpv · ')).toHaveLength(2);
    const inici = posicio('/* ═══ BLOC tpv · ');
    expect(inici).toBeGreaterThan(posicio('/* ═══ FI DEL BLOC catalegColleccio ═══ */'));
    expect(inici).toBeGreaterThan(posicio('/* ═══ FI DEL BLOC alergens ═══ */'));
    const darrereDelsMigrats = moduls.slice(posicio('/* ═══ FI DEL BLOC ConsultaIAIA ═══ */'));
    expect(senseComentaris(darrereDelsMigrats)).not.toMatch(/\.sdp-(?:control|pindola|pestanyes)(?![a-z0-9])/);
    /* Sonda: la guarda veu una regla posterior que ajustaria les peces. */
    expect(senseComentaris('/* x */ @layer components { .sdp-pestanyes__panell { padding: 0; } }')).toMatch(/\.sdp-(?:control|pindola|pestanyes)(?![a-z0-9])/);
    expect(existsSync(path.join(ARREL, CSS_ANTIC))).toBe(false);
    expect(senseComentaris(llig('src/css/index.css'))).not.toMatch(/tpv\.css/);
  });
});

describe('Baseline 2022 (Safari 16.0, Chrome 100, Firefox 100)', () => {
  test('JS: cap API més nova ni lookbehind', () => {
    const vetat = /\.(?:findLast|findLastIndex|toSorted|toReversed|toSpliced|with)\(|Object\.groupBy|withResolvers|\(\?<[=!]/;
    for (const f of JSX) expect(vetat.test(llig(f)), f).toBe(false);
  });

  test('CSS: cap @container, subgrid, color-mix, unitats dv/sv/lv ni propietats de transformació soltes', () => {
    expect(FULL_NET).not.toMatch(/@container|subgrid|color-mix|\b\d*\.?\d+(?:dv|sv|lv)(?:h|w)\b/);
    expect(FULL_NET).not.toMatch(/(?:^|[;{\s])(?:rotate|scale|translate)\s*:/);
  });
});

describe('la porta del catàleg (tooling/gates/tractor-cataleg.mjs) per a UniversalTPV', () => {
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
    expect(entrades.find((e) => e.nom === NOM)).toEqual({ nom: NOM, fitxer: 'PedraSeca/organismes/UniversalTPV.jsx', estat: 'viu', fora: false });
    expect(importats.has(NOM)).toBe(true);
    expect(llig(ESPECIMEN)).toMatch(new RegExp(`<${NOM}\\b`));
  });

  test('la façana l’exporta, i el catàleg en té l’ítem i el carregador', () => {
    expect(llig(`${PS}/index.js`)).toContain(`export { ${NOM} } from './organismes/UniversalTPV.jsx';`);
    expect(llig(`${CAT}/manifest.js`)).toMatch(/especimen\('estructura', 'universal-tpv',/);
    expect(llig(`${CAT}/detailRegistry.jsx`)).toContain("'estructura/universal-tpv': lazyRoute(() => import('./detalls/EspecimenUniversalTPV.jsx')),");
  });
});

/* Les sondes: cada detector ha de denunciar una mostra dolenta. Les mostres
   es componen a trossos (les portes que llegixen src/ no les han de trobar). */
describe('les sondes: els detectors denuncien una mostra dolenta', () => {
  const t = (...trossos) => trossos.join('');
  const dinsDeCapa = (cos) => t('@layer components { ', cos, ' }');

  test('espais: un valor fora de l’escala, i la cota compta el que inspecciona', () => {
    const { inspeccionades, dolents } = espaisDolents(dinsDeCapa(t('.x { pad', 'ding: 3', 'px; gap: var(--sdp-space-2); }')));
    expect(dolents).toEqual([t('pad', 'ding: 3', 'px')]);
    expect(inspeccionades).toBe(2);
  });

  test('hover: un :hover fora de @media (hover: hover) and (pointer: fine)', () => {
    expect(hoversSolts(regles(dinsDeCapa('.x:hover { color: inherit; }')))).toEqual(['.x:hover']);
    expect(hoversSolts(regles(dinsDeCapa('@media (hover: hover) and (pointer: fine) { .x:hover { color: inherit; } }')))).toEqual([]);
  });

  test('capa: una regla fora de @layer components', () => {
    expect(foraDeCapa(regles('.x { color: inherit; }'))).toEqual(['.x']);
    expect(foraDeCapa(regles(dinsDeCapa('.x { color: inherit; }')))).toEqual([]);
  });

  test('colors: un hex, un rgb i un primitiu', () => {
    const mostra = t('.x { color: #', 'fff; background: rg', 'b(0 0 0); border-color: var(--sdp-pe', 'dra-500); }');
    expect(colorsCrus(mostra)).toEqual([t('#', 'fff'), t('rg', 'b('), t('--sdp-pe', 'dra-500')]);
  });

  test('tokens: un que cap full no definix', () => {
    const inventat = t('--sdp-', 'inventat');
    expect(tokensFantasma(`.x { color: var(${inventat}); background: var(--sdp-fons-app); }`, TOKENS_DEFINITS)).toEqual([inventat]);
  });

  test('imatges: una <img> sense onError ni decoding', () => {
    const dolenta = t('<im', 'g src={font} alt="" loading="lazy" referrerPolicy="no-referrer" />');
    const bona = t('<im', 'g src={font} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={onFalla} />');
    expect(imatgesSenseAlternativa(`${dolenta}\n${bona}`)).toEqual([dolenta]);
  });

  test('classes: una sdp-* sense regla en cap full', () => {
    const conegudes = new Set([...classesDelCss(FULL), ...classesDelCss(CSS_CANONIC)]);
    const inventada = t('sdp-', 'inventada');
    expect(classesOrfes(`<span className="${inventada} sdp-tpv__rajola" />`, conegudes)).toEqual([inventada]);
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
    const textos = [...[...JSX, ...PROVES].map((f) => [f, llig(f)]), [`${MODULS} · bloc tpv`, FULL]];
    const trobats = textos.flatMap(([f, text]) => vetats.filter(([patro]) => patro.test(text)).map(([, que]) => `${f}: ${que}`));
    expect(trobats).toEqual([]);
  });

  test('cap caràcter de control, invisible, combinant ni bidi en cru', () => {
    const rangs = [[0x0000, 0x0008], [0x000B, 0x001F], [0x007F, 0x009F], [0x0300, 0x036F], [0x061C, 0x061C], [0x200B, 0x200F],
      [0x202A, 0x202E], [0x2060, 0x2069], [0xFEFF, 0xFEFF]];
    const car = (cp) => String.fromCodePoint(cp);
    const re = new RegExp(`[${rangs.map(([a, b]) => (a === b ? car(a) : `${car(a)}-${car(b)}`)).join('')}]`, 'u');
    for (const [fitxer, text] of [...[...JSX, ...PROVES, ...TOCATS].map((f) => [f, llig(f)]), [`${MODULS} · bloc tpv`, FULL]]) {
      expect(re.test(text), fitxer).toBe(false);
    }
  });
});
