// @vitest-environment node
/* Fase E (261020, tasca 2; pla 261020_2045 «El Comú») · qualitat
   d'UniversalListCard, del seu full, del nucli pur, de l'espècimen i dels
   fitxers del catàleg tocats. Calcada de qualitat.tpv.test.js.
   · ESLint amb la configuració del projecte i zero missatges.
   · Pedra Seca per text: cap style=, cap h1/h2, cap import de CSS ni :has(),
     classes sdp-* literals amb regla, cap CSS mort, només tokens que
     existixen, espais de l'escala, cap ombra pròpia, tot dins de
     @layer components, cada :hover només amb ratolí, controls ≥ --sdp-touch.
   · L'ordre del Mestre (261020): rajoles de 98 × 116 px, 300 ms de transició
     i dues rajoles dins d'una bombolla d'un mòbil de 375 px.
   · Presentacional (cap emmagatzematge, xarxa ni backend) i Baseline 2022.
   · La porta del catàleg (C1, C2 i C3), la façana i l'@import d'index.css.
   · Reimplementació pròpia: cap tros del codi de Bring!.
   · SONDES: cada detector denuncia una mostra dolenta.
   Els patrons vetats es componen a trossos perquè les portes que llegixen
   src/ no els troben ací. */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');
const PS = 'src/components/PedraSeca';
const DIR = `${PS}/UniversalListCard`;
const CAT = 'src/sections/disseny/cataleg';
const CSS = `${DIR}/UniversalListCard.css`;

const NOM = 'UniversalListCard';
const COMPONENT = `${DIR}/UniversalListCard.jsx`;
const ESPECIMEN = `${CAT}/detalls/EspecimenUniversalListCard.jsx`;
const JSX = [COMPONENT, ESPECIMEN];
const JS_PURS = ['basesComu.js', 'extractorEspecificacio.js', 'nucliComu.js', 'useLlistaComu.js', 'textosComu.js', 'exportaComu.js',
  'modes/rebost.js', 'modes/barTpv.js', 'modes/collaCens.js', 'modes/bandaEixida.js', 'modes/loteriaDiposit.js', 'modes/escolaEducand.js']
  .map((f) => `${DIR}/${f}`);
const PRODUCCIO = [COMPONENT, ...JS_PURS];
const PROVES = [`${DIR}/UniversalListCard.test.jsx`, `${DIR}/useLlistaComu.test.jsx`, `${DIR}/nucliComu.test.js`,
  `${DIR}/extractorEspecificacio.test.js`, `${PS}/qualitat.universalListCard.test.js`, 'src/config/i18n.comu.test.js'];
const TOCATS = [`${PS}/index.js`, `${CAT}/registre.js`, `${CAT}/manifest.js`, `${CAT}/detailRegistry.jsx`];
const TOTS = [...JSX, ...JS_PURS, ...PROVES, ...TOCATS];

const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const classesDelCss = (css) => new Set([...senseComentaris(css).matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]));
const CSS_SRC = readdirSync(path.join(ARREL, 'src/css')).filter((f) => f.endsWith('.css')).map((f) => llig(`src/css/${f}`)).join('\n');
const CSS_CANONIC = [CSS_SRC, llig(`${PS}/pecesApps.css`), llig(`${PS}/catalegColleccio.css`)].join('\n');
const FULL = llig(CSS);
const FULL_NET = senseComentaris(FULL);

const classesNomenades = (codi) => [...codi.matchAll(/["'`]([^"'`\n]*\bsdp-[^"'`\n]*)["'`]/g)]
  .flatMap((m) => m[1].split(/\s+/)).filter((c) => /^sdp-[a-z0-9_-]+$/.test(c));

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
const valorDeToken = (token) => (CSS_SRC.match(new RegExp(`${token}:\\s*([^;]+);`)) ?? [])[1]?.trim() ?? null;

/* ── Els detectors ─────────────────────────────────────────────────── */
const classesOrfes = (codi, conegudes) => classesNomenades(codi).filter((c) => !conegudes.has(c));

/** Els colors en cru i els primitius (els -500, -50… de la paleta; els parells semàntics -fons i -text, sí). */
function colorsCrus(cssNet) {
  return [
    ...[...cssNet.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) => m[0]),
    ...[...cssNet.matchAll(/\b(?:rgba?|hsla?|oklch|color-mix)\(/g)].map((m) => m[0]),
    ...[...cssNet.matchAll(/var\(\s*(--sdp-(?:pedra|primary|secondary|blanc|negre|canon)[\w-]*|--sdp-(?:error|avis|exit|info)-\d[\w-]*)/g)].map((m) => m[1])
  ];
}
const tokensFantasma = (cssNet, definits) => [...new Set([...cssNet.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]))].filter((t) => !definits.has(t));
const foraDeCapa = (llistaRegles) => llistaRegles.filter((r) => r.context[0] !== '@layer components').map((r) => r.selectors.join(', '));
const hoversSolts = (llistaRegles) => llistaRegles.filter((r) => r.selectors.some((s) => s.includes(':hover')))
  .filter((r) => !r.context.includes('@media (hover: hover) and (pointer: fine)')).map((r) => r.selectors.join(', '));
/** Una ombra que no siga anul·lar-la. */
const ombres = (cssNet) => [...cssNet.matchAll(/box-shadow\s*:\s*([^;}]+)/g)].map((m) => m[1].trim()).filter((v) => v !== 'none');

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
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, DIR, 'sonda.js') });
    expect(sonda.messages.map((m) => m.ruleId)).toEqual(['no-unused-vars', 'eol-last']);
  }, 120000);
});

describe('Pedra Seca · JSX i nucli', () => {
  test('cap style=, cap h1 ni h2, cap import de CSS ni :has()', () => {
    const vetats = [
      [/\sstyle=[{"]/, 'style='],
      [new RegExp(['<h', '[12][\\s>]'].join('')), 'h1/h2'],
      [/^\s*import\s+[^;]*\.css['"]/m, 'import de CSS'],
      [new RegExp([':ha', 's\\('].join('')), ':has()']
    ];
    const trobats = [...JSX, ...JS_PURS].flatMap((f) => vetats.filter(([patro]) => patro.test(llig(f))).map(([, que]) => `${f}: ${que}`));
    expect(trobats).toEqual([]);
  });

  test('cap className fet amb plantilla', () => {
    for (const f of JSX) expect(/className=\{`/.test(llig(f)), f).toBe(false);
  });

  test('tota classe sdp-* nomenada té regla al full o a un full canònic', () => {
    const conegudes = new Set([...classesDelCss(FULL), ...classesDelCss(CSS_CANONIC)]);
    const orfes = JSX.flatMap((f) => classesOrfes(llig(f), conegudes).map((c) => `${f}: ${c}`));
    expect(orfes).toEqual([]);
    expect(classesNomenades(llig(COMPONENT))).toEqual(expect.arrayContaining(['sdp-comu', 'sdp-comu__rajola', 'sdp-comu__fila', 'sdp-comu__signatura']));
    expect(new Set(classesNomenades(llig(COMPONENT))).size).toBeGreaterThan(40);
  });

  test('cap CSS mort: tota classe pròpia del full la pinta la peça o l’espècimen', () => {
    const externes = classesDelCss(CSS_CANONIC);
    const usades = new Set(JSX.flatMap((f) => classesNomenades(llig(f))));
    const mortes = [...classesDelCss(FULL)].filter((c) => !externes.has(c) && !usades.has(c));
    expect(mortes).toEqual([]);
  });

  test('cap <img>: les icones són emojis o inicials, sense cap petició', () => {
    for (const f of JSX) expect([...llig(f).matchAll(/<img\b/g)], f).toHaveLength(0);
  });

  test('importa Pedra Seca pel camí directe, mai per la façana', () => {
    for (const f of PRODUCCIO) {
      const especificadors = [...llig(f).matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]);
      expect(especificadors.filter((e) => /(?:^|\/)index\.js$/.test(e)), f).toEqual([]);
    }
  });

  test('presentacional: cap emmagatzematge, xarxa ni backend, cap global escrita', () => {
    const vetats = [
      [new RegExp(['local', 'Storage|session', 'Storage|indexed', 'DB'].join('')), 'emmagatzematge'],
      [new RegExp(['\\bfet', 'ch\\(|XMLHttp', 'Request|Web', 'Socket|Event', 'Source'].join('')), 'xarxa'],
      [/supabase|backendPort|adaptadors|SessionContext/, 'backend'],
      [/(?:window|globalThis)\.\w+\s*=[^=]/, 'global escrita'],
      [/document\.(?:body|head|documentElement)/, 'document de fora (Llei 06)']
    ];
    const trobats = [...PRODUCCIO, ESPECIMEN].flatMap((f) => vetats.filter(([patro]) => patro.test(llig(f))).map(([, que]) => `${f}: ${que}`));
    expect(trobats).toEqual([]);
  });

  test('el nucli és pur: ni React ni DOM fora del hook i de la peça', () => {
    const purs = JS_PURS.filter((f) => !f.endsWith('useLlistaComu.js'));
    for (const f of purs) expect(/from 'react'|\bdocument\b|\bwindow\b/.test(senseComentaris(llig(f))), f).toBe(false);
    /* El nucli no llig cap rellotge ni cap atzar: els injecta qui crida. */
    for (const f of purs) expect(/Date\.now|new Date\(|Math\.random/.test(senseComentaris(llig(f))), f).toBe(false);
  });

  test('reimplementació pròpia: cap tros de les expressions ni de les unitats de Bring!', () => {
    const extractor = llig(`${DIR}/extractorEspecificacio.js`);
    for (const tros of [['pck|', 'pkg|stk'], ['\\u5242', ''], ['剂', '量'], ['[\\d]+[\\w/.,]*', '[.]*']]) {
      expect(extractor.includes(tros.join('')), tros.join('')).toBe(false);
    }
  });
});

describe('Pedra Seca · UniversalListCard.css', () => {
  test('només tokens semàntics que existixen', () => {
    expect(colorsCrus(FULL_NET)).toEqual([]);
    expect(tokensFantasma(FULL_NET, TOKENS_DEFINITS)).toEqual([]);
    expect(new Set([...FULL_NET.matchAll(/var\(\s*(--sdp-[\w-]+)/g)].map((m) => m[1])).size).toBeGreaterThan(30);
  });

  test('cap :has(), cap ombra pròpia, cap !important, i tot dins de @layer components', () => {
    expect(new RegExp([':ha', 's\\('].join('')).test(FULL_NET)).toBe(false);
    expect(ombres(FULL_NET)).toEqual([]);
    expect(/!important/.test(FULL_NET)).toBe(false);
    expect(FULL_NET.trim().startsWith('@layer components {')).toBe(true);
    expect(REGLES.length).toBeGreaterThan(50);
    expect(foraDeCapa(REGLES)).toEqual([]);
  });

  test('cada :hover, dins de @media (hover: hover) and (pointer: fine)', () => {
    expect(hoversSolts(REGLES)).toEqual([]);
    expect(REGLES.filter((r) => r.selectors.some((s) => s.includes(':hover'))).length).toBeGreaterThan(1);
  });

  test('espais de l’escala; cap rem fora de la graella de 0,25 llevat de l’amplada de la rajola (98 px)', () => {
    const { inspeccionades, dolents } = espaisDolents(FULL_NET);
    expect(dolents).toEqual([]);
    expect(inspeccionades).toBeGreaterThan(40);
    const foraDeGraella = [...FULL_NET.matchAll(/(\d*\.?\d+)rem/g)].map((m) => Number(m[1])).filter((v) => v % 0.25 !== 0);
    expect([...new Set(foraDeGraella)]).toEqual([6.125]);
  });

  test('la lletra: sempre un token, mai una mida en px ni per davall de --sdp-text-meta (14 px)', () => {
    const mides = [...FULL_NET.matchAll(/font-size\s*:\s*([^;}]+)/g)].map((m) => m[1].trim());
    expect(mides.length).toBeGreaterThan(10);
    expect(mides.filter((m) => !/^var\(--sdp-text-(?:meta|small|base|h5|h4)\)$/.test(m))).toEqual([]);
    expect(valorDeToken('--sdp-text-meta')).toBe('0.875rem');
  });

  test('ordre del Mestre (261020): la rajola de 98 × 116 px i la transició de 300 ms entre actiu i resolt', () => {
    const rajola = cosDe('.sdp-comu__rajola');
    expect(rajola).toMatch(/inline-size:\s*6\.125rem/);
    expect(rajola).toMatch(/block-size:\s*7\.25rem/);
    expect(6.125 * 16).toBe(98);
    expect(7.25 * 16).toBe(116);
    expect(cosDe('.sdp-comu__rajoles')).toMatch(/grid-template-columns:\s*repeat\(auto-fill, 6\.125rem\)/);
    expect(rajola).toMatch(/transition:\s*background-color var\(--sdp-durada-sostre\) var\(--sdp-corba-suau\)/);
    expect(valorDeToken('--sdp-durada-sostre')).toBe('300ms');
    for (const estat of ['actiu', 'mig', 'resolt']) expect(cosDe(`.sdp-comu__rajola[data-estat="${estat}"]`), estat).toMatch(/background:\s*var\(--sdp-/);
  });

  test('375 px: la variant bombolla no passa de la bombolla, i dins hi caben dues rajoles per fila', () => {
    expect(cosDe('.sdp-comu[data-variant="bombolla"]')).toMatch(/inline-size:\s*var\(--sdp-targeta-incrustada-ample\);\s*max-inline-size:\s*100%/);
    /* (375 − 2 × 12 − 4) × 90 % − (48 + 4) del ⋯ − 2 × 12 de coixí: el contingut d'una bombolla d'altri en 375 px. */
    const contingut = (375 - 24 - 4) * 0.9 - 52 - 24;
    const dues = 2 * 98 + 8;
    expect(dues).toBeLessThanOrEqual(contingut);
    expect(cosDe('.sdp-comu__rajoles')).toMatch(/gap:\s*var\(--sdp-space-2\)/);
    expect(['0.5rem', '8px']).toContain(valorDeToken('--sdp-space-2'));
  });

  test('els controls fan almenys --sdp-touch i els quadrats són 1:1', () => {
    for (const control of ['.sdp-comu__rajola', '.sdp-comu__signatura', '.sdp-comu__anota-resum', '.sdp-comu .sdp-comu__camp', '.sdp-comu__icona']) {
      expect(cosDe(control), control).toMatch(/(?:min-block-size|block-size):\s*var\(--sdp-touch\)/);
    }
    expect(cosDe('.sdp-comu__rajola')).toMatch(/min-inline-size:\s*var\(--sdp-touch\)/);
    for (const quadrat of ['.sdp-comu__icona', '.sdp-comu__rajola-icona']) expect(cosDe(quadrat), quadrat).toMatch(/aspect-ratio:\s*1\s*\/\s*1/);
  });

  test('la Llei de Scroll: cap regla de la peça fa scroll (viu dins de l’únic scroll del xat)', () => {
    expect(REGLES.filter((r) => /overflow(?:-[xy])?:\s*(?:auto|scroll)/.test(r.cos)).flatMap((r) => r.selectors)).toEqual([]);
  });

  test('la capçalera prescriu l’@import SENSE layer() i index.css l’importa una vegada, darrere de tpv.css', () => {
    const importacio = "@import url('../components/PedraSeca/UniversalListCard/UniversalListCard.css');";
    expect(FULL).toContain(importacio);
    const index = senseComentaris(llig('src/css/index.css'));
    expect([...index.matchAll(/@import[^;]*UniversalListCard\.css[^;]*;/g)].map((m) => m[0])).toEqual([importacio]);
    expect(index.indexOf('UniversalListCard.css')).toBeGreaterThan(index.indexOf('tpv.css'));
  });
});

describe('Baseline 2022 (Safari 16.0, Chrome 100, Firefox 100)', () => {
  test('JS: cap API més nova ni lookbehind', () => {
    const vetat = /\.(?:findLast|findLastIndex|toSorted|toReversed|toSpliced|with)\(|Object\.groupBy|withResolvers|\(\?<[=!]/;
    for (const f of [...JSX, ...JS_PURS]) expect(vetat.test(llig(f)), f).toBe(false);
  });

  test('CSS: cap @container, subgrid, color-mix, unitats dv/sv/lv ni propietats de transformació soltes', () => {
    expect(FULL_NET).not.toMatch(/@container|subgrid|color-mix|\b\d*\.?\d+(?:dv|sv|lv)(?:h|w)\b/);
    expect(FULL_NET).not.toMatch(/(?:^|[;{\s])(?:rotate|scale|translate)\s*:/);
  });
});

describe('la porta del catàleg (tooling/gates/tractor-cataleg.mjs) per a UniversalListCard', () => {
  const registre = llig(`${CAT}/registre.js`);
  const entrades = [...registre.matchAll(/\{\s*nom:\s*'([^']+)',\s*fitxer:\s*'([^']+)'[^}]*estat:\s*'(\w+)'([^}]*)\}/g)]
    .map(([, nom, fitxer, estat, resta]) => ({ nom, fitxer, estat, fora: /fora:\s*true/.test(resta) }));
  const detalls = readdirSync(path.join(ARREL, CAT, 'detalls')).filter((f) => /^Especimen.*\.jsx$/.test(f))
    .map((f) => llig(`${CAT}/detalls/${f}`)).join('\n');
  const importats = new Set([...detalls.matchAll(/import\s*\{([^}]+)\}\s*from\s*'[^']*(?:components\/(?:ui|PedraSeca)\/[^']+|UniversalElements)'/g)]
    .flatMap((m) => m[1].split(',').map((s) => s.trim()).filter(Boolean)));

  test('C1 registrat, C2 viu en un espècimen que el munta, C3 l’export existix; cap altre component exportat a la carpeta', () => {
    const exportats = [...llig(COMPONENT).matchAll(/^export\s+(?:function|const)\s+([A-Z]\w*)/gm)].map((m) => m[1]);
    expect(exportats).toEqual([NOM]);
    const jsxDeLaCarpeta = readdirSync(path.join(ARREL, DIR), { recursive: true }).filter((f) => String(f).endsWith('.jsx') && !String(f).endsWith('.test.jsx'));
    expect(jsxDeLaCarpeta).toEqual(['UniversalListCard.jsx']);
    expect(entrades.find((e) => e.nom === NOM)).toEqual({ nom: NOM, fitxer: 'PedraSeca/UniversalListCard/UniversalListCard.jsx', estat: 'viu', fora: false });
    expect(importats.has(NOM)).toBe(true);
    expect(llig(ESPECIMEN)).toMatch(new RegExp(`<${NOM}\\b`));
  });

  test('la façana l’exporta, i el catàleg en té l’ítem, l’emoji i el carregador', () => {
    expect(llig(`${PS}/index.js`)).toContain(`export { ${NOM} } from './UniversalListCard/UniversalListCard.jsx';`);
    expect(llig(`${CAT}/manifest.js`)).toMatch(/especimen\('estructura', 'llista-comu',/);
    expect(llig(`${CAT}/manifest.js`)).toContain("'llista-comu': '🧺'");
    expect(llig(`${CAT}/detailRegistry.jsx`)).toContain("'estructura/llista-comu': lazyRoute(() => import('./detalls/EspecimenUniversalListCard.jsx')),");
  });
});

describe('les sondes: els detectors denuncien una mostra dolenta', () => {
  const t = (...trossos) => trossos.join('');
  const dinsDeCapa = (cos) => t('@layer components { ', cos, ' }');

  test('espais, hover, capa i ombra', () => {
    const { dolents } = espaisDolents(dinsDeCapa(t('.x { pad', 'ding: 3', 'px; gap: var(--sdp-space-2); }')));
    expect(dolents).toEqual([t('pad', 'ding: 3', 'px')]);
    expect(hoversSolts(regles(dinsDeCapa('.x:hover { color: inherit; }')))).toEqual(['.x:hover']);
    expect(foraDeCapa(regles('.x { color: inherit; }'))).toEqual(['.x']);
    expect(ombres(t('.x { box-', 'shadow: 0 1px 2px var(--sdp-vora); } .y { box-', 'shadow: none; }'))).toEqual(['0 1px 2px var(--sdp-vora)']);
  });

  test('colors: un hex, un rgb i dos primitius; els parells semàntics passen', () => {
    const mostra = t('.x { color: #', 'fff; background: rg', 'b(0 0 0); border-color: var(--sdp-pe', 'dra-500); outline-color: var(--sdp-exit-', '500); }');
    expect(colorsCrus(mostra)).toEqual([t('#', 'fff'), t('rg', 'b('), t('--sdp-pe', 'dra-500'), t('--sdp-exit-', '500')]);
    expect(colorsCrus('.x { background: var(--sdp-exit-fons); color: var(--sdp-exit-text); }')).toEqual([]);
  });

  test('tokens i classes', () => {
    const inventat = t('--sdp-', 'inventat');
    expect(tokensFantasma(`.x { color: var(${inventat}); background: var(--sdp-fons-app); }`, TOKENS_DEFINITS)).toEqual([inventat]);
    const conegudes = new Set([...classesDelCss(FULL), ...classesDelCss(CSS_CANONIC)]);
    const inventada = t('sdp-', 'inventada');
    expect(classesOrfes(`<span className="${inventada} sdp-comu__rajola" />`, conegudes)).toEqual([inventada]);
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
    const fitxers = [...JSX, ...JS_PURS, ...PROVES, CSS];
    const trobats = fitxers.flatMap((f) => vetats.filter(([patro]) => patro.test(llig(f))).map(([, que]) => `${f}: ${que}`));
    expect(trobats).toEqual([]);
  });

  test('cap caràcter de control, invisible ni bidi en cru', () => {
    const rangs = [[0x0000, 0x0008], [0x000B, 0x001F], [0x007F, 0x009F], [0x0300, 0x036F], [0x061C, 0x061C], [0x200B, 0x200F],
      [0x202A, 0x202E], [0x2060, 0x2069], [0xFEFF, 0xFEFF]];
    const car = (cp) => String.fromCodePoint(cp);
    const re = new RegExp(`[${rangs.map(([a, b]) => (a === b ? car(a) : `${car(a)}-${car(b)}`)).join('')}]`, 'u');
    for (const fitxer of [...JSX, ...JS_PURS, ...PROVES, CSS, ...TOCATS]) expect(re.test(llig(fitxer)), fitxer).toBe(false);
  });
});
