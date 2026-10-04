// @vitest-environment node
/* Lot ESQ · l'esquelet comú de catàleg i col·lecció (ordre del Mestre,
   261002: sinergies T4/T8). Les portes del repo sobre TOTS els fitxers del
   lot: les peces de Pedra Seca, el seu full, l'esquelet de src/apps/comu, els
   espècimens i els fitxers del catàleg tocats.
   · ESLint amb la configuració del projecte i zero missatges.
   · Pedra Seca per text: cap style=, cap h1/h2, classes que existixen, cap
     CSS mort, només tokens, espais de l'escala, cap :has(), cap ombra,
     controls ≥ --sdp-touch i quadrats 1:1. Baseline 2022.
   · L'esquelet de src/apps/comu no porta cap classe: la geometria és de les
     peces. Cap AppGridShell a mà i la plataforma només per index.js.
   · La porta tooling/gates/tractor-cataleg.mjs (C1, C2, C3) per a les peces.
   · Cap dada personal: correus, telèfons, DNI/NIE ni IBAN.
   Els patrons vetats es componen a trossos perquè les portes que llegixen
   src/ no els troben ací (patró de src/sections/gestoria/qualitat.test.js). */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');

function fitxersDe(directori, extensio = /\.(?:jsx?|css)$/) {
  const fitxers = [];
  for (const entrada of readdirSync(path.join(ARREL, directori), { withFileTypes: true })) {
    const ruta = `${directori}/${entrada.name}`;
    if (entrada.isDirectory()) fitxers.push(...fitxersDe(ruta, extensio));
    else if (extensio.test(entrada.name)) fitxers.push(ruta);
  }
  return fitxers.sort();
}

const PS = 'src/components/PedraSeca';
const ORG = `${PS}/organismes`;
const CAT = 'src/sections/disseny/cataleg';
const CSS = `${PS}/catalegColleccio.css`;

/* [nom, fitxer, espècimen que el munta] */
const PECES = [
  ['GraellaArticles', `${ORG}/GraellaArticles.jsx`, 'EspecimenArticles'],
  ['LlistaArticles', `${ORG}/LlistaArticles.jsx`, 'EspecimenArticles'],
  ['SeccionsCategoria', `${ORG}/SeccionsCategoria.jsx`, 'EspecimenSeccionsCategoria'],
  ['SelectorCategoria', `${ORG}/SeccionsCategoria.jsx`, 'EspecimenSeccionsCategoria'],
  ['OrdenaCategories', `${ORG}/SeccionsCategoria.jsx`, 'EspecimenSeccionsCategoria'],
  ['LiniesColleccio', `${ORG}/LiniesColleccio.jsx`, 'EspecimenColleccio'],
  ['BarraResum', `${ORG}/BarraResum.jsx`, 'EspecimenColleccio'],
  ['TargetesColleccions', `${ORG}/TargetesColleccions.jsx`, 'EspecimenColleccio'],
  ['AfegitRapid', `${ORG}/AfegitRapid.jsx`, 'EspecimenAfegitRapid'],
  ['DetallArticle', `${ORG}/DetallArticle.jsx`, 'EspecimenDetallArticle'],
  ['MarcColumna', `${ORG}/MarcColumna.jsx`, 'EspecimenMarcColumna']
];
const COMPONENTS = [...new Set(PECES.map(([, fitxer]) => fitxer))];
const AJUDANTS = [`${ORG}/articles.js`, `${ORG}/pulsacioLlarga.js`, `${ORG}/marca.jsx`, `${ORG}/agrupacio.jsx`];
const PROVES_PS = [...COMPONENTS.map((f) => f.replace(/\.jsx$/, '.test.jsx')), `${ORG}/articles.test.js`];
const COMU = fitxersDe('src/apps/comu', /\.jsx?$/);
const esProva = (f) => /\.test\.jsx?$/.test(f);
const COMU_PRODUCCIO = COMU.filter((f) => !esProva(f));
const ESPECIMENS = [...new Set(PECES.map(([, , e]) => e)), 'EspecimenEsqueletBar', 'EspecimenEsqueletCompra']
  .map((e) => `${CAT}/detalls/${e}.jsx`);
const SUPORT_CATALEG = [`${CAT}/detalls/mostraEsquelet.jsx`, `${CAT}/detalls/EspecimensEsquelet.test.jsx`];
const TOCATS = [`${PS}/index.js`, `${CAT}/registre.js`, `${CAT}/manifest.js`, `${CAT}/detailRegistry.jsx`];
const TOTS = [...COMPONENTS, ...AJUDANTS, ...PROVES_PS, ...COMU, ...ESPECIMENS, ...SUPORT_CATALEG, ...TOCATS];
const JSX_PS = [...COMPONENTS, `${ORG}/marca.jsx`, `${ORG}/agrupacio.jsx`];
const JSX_PRODUCCIO = [...JSX_PS, ...COMU_PRODUCCIO.filter((f) => f.endsWith('.jsx')), ...ESPECIMENS, `${CAT}/detalls/mostraEsquelet.jsx`];

const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const classesDelCss = (css) => new Set([...senseComentaris(css).matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]));
const CSS_CANONIC = [...fitxersDe('src/css', /\.css$/), `${PS}/pecesApps.css`, 'src/components/layout/AppGridShell.css'].map(llig).join('\n');
const FULL = llig(CSS);
const FULL_NET = senseComentaris(FULL);

/* Les classes sdp-* que nomena un JSX: tot literal entre cometes que ho siga
   (className, ternàries, llistes i constants de classes). */
const classesNomenades = (codi) => [...codi.matchAll(/["'`]([^"'`\n]*\bsdp-[^"'`\n]*)["'`]/g)]
  .flatMap((m) => m[1].split(/\s+/)).filter((c) => /^sdp-[a-z0-9_-]+$/.test(c));

/* Les declaracions d'una regla: { selector → cos }. */
function regles(css) {
  const mapa = new Map();
  for (const m of senseComentaris(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    for (const selector of m[1].split(',').map((s) => s.trim())) mapa.set(selector, `${mapa.get(selector) ?? ''}${m[2]}`);
  }
  return mapa;
}

describe('el cens del lot', () => {
  test('hi són tots els fitxers, l’esquelet i les seues proves inclosos', () => {
    for (const fitxer of TOTS) expect(existsSync(path.join(ARREL, fitxer)), fitxer).toBe(true);
    for (const esperat of ['esquelet/index.js', 'esquelet/vistes.js', 'esquelet/rutesCatalegColleccio.js', 'esquelet/ColumnaCataleg.jsx',
      'esquelet/ColumnaColleccio.jsx', 'esquelet/ColumnaColleccions.jsx', 'esquelet/EsqueletCatalegColleccio.jsx',
      'esquelet/EsqueletCatalegColleccio.test.jsx', 'esquelet/columnes.test.jsx', 'qualitat.test.js']) {
      expect(COMU, esperat).toContain(`src/apps/comu/${esperat}`);
    }
  });
});

describe('ESLint', () => {
  test('zero missatges, avisos inclosos', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles(TOTS.map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(TOTS.length);
    expect(missatges).toEqual([]);
    // Sonda: la configuració del projecte és activa (un avís és un error amb --max-warnings=0).
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, 'src/apps/comu/sonda.js') });
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
    const trobats = JSX_PRODUCCIO.flatMap((f) => vetats.filter(([patro]) => patro.test(llig(f))).map(([, que]) => `${f}: ${que}`));
    expect(trobats).toEqual([]);
  });

  test('cap className fet amb plantilla: totes les classes són literals que es poden buscar', () => {
    for (const f of JSX_PRODUCCIO) expect(/className=\{`/.test(llig(f)), f).toBe(false);
  });

  test('tota classe sdp-* de les peces té regla al full propi o a un full canònic', () => {
    const conegudes = new Set([...classesDelCss(FULL), ...classesDelCss(CSS_CANONIC)]);
    const orfes = JSX_PS.flatMap((f) => classesNomenades(llig(f)).filter((c) => !conegudes.has(c)).map((c) => `${f}: ${c}`));
    expect(orfes).toEqual([]);
  });

  test('cap CSS mort: tota classe pròpia del full la pinta alguna peça', () => {
    const externes = classesDelCss(CSS_CANONIC);
    const usades = new Set(JSX_PS.flatMap((f) => classesNomenades(llig(f))));
    const mortes = [...classesDelCss(FULL)].filter((c) => !externes.has(c) && !usades.has(c));
    expect(mortes).toEqual([]);
  });
});

describe('l’esquelet de src/apps/comu', () => {
  const especificadors = (codi) => [...codi.matchAll(/(?:from\s+|import\s*\(\s*)['"]([^'"]+)['"]/g)].map((m) => m[1]);

  test('cap classe pròpia: tota la geometria és de les peces de Pedra Seca', () => {
    for (const f of COMU_PRODUCCIO) expect(/className=/.test(llig(f)), f).toBe(false);
  });

  test('cap AppGridShell a mà (l’única porta és ClosaAplicacio) i la plataforma només per index.js', () => {
    const closca = /components\/layout\/AppGridShell(?:\.jsx)?$/;
    const trobats = COMU_PRODUCCIO.flatMap((f) => especificadors(llig(f))
      .filter((e) => closca.test(e) || (e.includes('/plataforma/') && !/\/plataforma\/index\.js$/.test(e)))
      .map((e) => `${f}: ${e}`));
    expect(trobats).toEqual([]);
    expect(llig('src/apps/comu/esquelet/EsqueletCatalegColleccio.jsx')).toMatch(/import \{[^}]*\bClosaAplicacio\b[^}]*\} from '\.\.\/\.\.\/plataforma\/index\.js';/);
  });

  test('presentacional: cap emmagatzematge, xarxa ni backend, cap global escrita', () => {
    const vetats = [
      [new RegExp(['local', 'Storage|session', 'Storage|indexed', 'DB|magatzem', 'Local'].join('')), 'emmagatzematge'],
      [new RegExp(['\\bfet', 'ch\\(|XMLHttp', 'Request|Web', 'Socket'].join('')), 'xarxa'],
      [/supabase|backendPort|adaptadors/, 'backend'],
      [/(?:window|globalThis)\.\w+\s*=[^=]/, 'global escrita']
    ];
    const ambPeces = [...COMU_PRODUCCIO, ...COMPONENTS, ...AJUDANTS];
    const trobats = ambPeces.flatMap((f) => vetats.filter(([patro]) => patro.test(llig(f))).map(([, que]) => `${f}: ${que}`));
    expect(trobats).toEqual([]);
  });

  test('l’API pública de l’esquelet i la façana de Pedra Seca', () => {
    const esquelet = llig('src/apps/comu/esquelet/index.js');
    for (const nom of ['EsqueletCatalegColleccio', 'ColumnaCataleg', 'ColumnaColleccio', 'ColumnaColleccions', 'rutesCatalegColleccio', 'useVistaCataleg', 'useVistesEsquelet', 'useColleccioActiva']) {
      expect(esquelet, nom).toMatch(new RegExp(`\\b${nom}\\b`));
    }
    const facana = llig(`${PS}/index.js`);
    for (const [nom, fitxer] of PECES) {
      expect(facana, nom).toMatch(new RegExp(`export \\{[^}]*\\b${nom}\\b[^}]*\\} from '\\./${fitxer.replace(`${PS}/`, '').replace('.', '\\.')}'`));
    }
  });
});

describe('Baseline 2022 (Safari 16.0, Chrome 100, Firefox 100)', () => {
  test('JS: cap API més nova ni lookbehind', () => {
    const vetat = /\.(?:findLast|findLastIndex|toSorted|toReversed|toSpliced|with)\(|Object\.groupBy|withResolvers|\(\?<[=!]/;
    for (const f of [...COMPONENTS, ...AJUDANTS, ...COMU_PRODUCCIO]) expect(vetat.test(llig(f)), f).toBe(false);
  });

  test('CSS: cap @container, subgrid, color-mix, unitats dv/sv/lv ni propietats de transformació soltes', () => {
    expect(FULL_NET).not.toMatch(/@container|subgrid|color-mix|\b\d*\.?\d+(?:dv|sv|lv)(?:h|w)\b/);
    expect(FULL_NET).not.toMatch(/(?:^|[;{\s])(?:rotate|scale|translate)\s*:/);
  });
});

describe('Pedra Seca · catalegColleccio.css', () => {
  test('només tokens semàntics: cap hex, rgb, hsl ni primitiu, i tots els tokens existixen', () => {
    expect(/#[0-9a-fA-F]{3,8}\b/.test(FULL_NET)).toBe(false);
    expect(/\b(?:rgba?|hsla?|oklch|color-mix)\(/.test(FULL_NET)).toBe(false);
    expect([...FULL_NET.matchAll(/var\(\s*(--sdp-(?:pedra|primary|secondary|blanc|negre|canon|error-|avis-|exit-)[\w-]*)/g)].map((m) => m[1])).toEqual([]);
    const definits = new Set([...CSS_CANONIC.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
    const fantasma = [...new Set([...FULL_NET.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]))].filter((t) => !definits.has(t));
    expect(fantasma).toEqual([]);
  });

  test('cap :has(), cap ombra, cap !important, i tot dins de @layer components', () => {
    expect(new RegExp([':ha', 's\\('].join('')).test(FULL_NET)).toBe(false);
    expect(/box-shadow|!important/.test(FULL_NET)).toBe(false);
    expect(FULL_NET.trim().startsWith('@layer components {')).toBe(true);
  });

  test('marges, coixins i separacions: 0, auto o l’escala --sdp-space-N (múltiples de 0.25rem)', () => {
    const dolents = [];
    for (const m of FULL_NET.matchAll(/(?:^|[;{\s])((?:margin|padding|gap|row-gap|column-gap)[\w-]*)\s*:\s*([^;}]+)/g)) {
      for (const valor of m[2].trim().split(/\s+/)) {
        const ok = valor === '0' || valor === 'auto' || /^var\(--sdp-space-\d+\)$/.test(valor)
          || (/^\d*\.?\d+rem$/.test(valor) && Number.isInteger(parseFloat(valor) * 4));
        if (!ok) dolents.push(`${m[1]}: ${valor}`);
      }
    }
    expect(dolents).toEqual([]);
    for (const [, valor] of FULL_NET.matchAll(/(\d*\.?\d+)rem/g)) expect(Number(valor) % 0.25, `${valor}rem`).toBe(0);
  });

  test('els controls fan almenys --sdp-touch i els quadrats són 1:1', () => {
    const r = regles(FULL);
    for (const control of ['.sdp-accio-icona', '.sdp-seccio__plega', '.sdp-llista-articles__fila', '.sdp-linies__principal',
      '.sdp-afegit-rapid__opcio', '.sdp-barra-resum__obri', '.sdp-ordena-categories__fila']) {
      expect(r.get(control), control).toMatch(/min-block-size:\s*var\(--sdp-touch(?:-comode)?\)/);
    }
    expect(r.get('.sdp-accio-icona')).toMatch(/min-inline-size:\s*var\(--sdp-touch\)/);
    expect(r.get('.sdp-targeta-colleccio')).toMatch(/min-block-size:\s*6rem/);
    for (const quadrat of ['.sdp-marca-article', '.sdp-marca-article__imatge', '.sdp-llista-articles__quadrat',
      '.sdp-detall-article__quadrat', '.sdp-targeta-colleccio__imatge']) {
      expect(r.get(quadrat), quadrat).toMatch(/aspect-ratio:\s*1\s*\/\s*1/);
    }
  });

  test('un element amb display propi que s’amaga amb [hidden] té la seua regla [hidden]', () => {
    expect(FULL_NET).toMatch(/\.sdp-afegit-rapid__opcions\[hidden\]\s*\{\s*display:\s*none;/);
  });

  /* ESQ-R3 · Les regles ja són dins de `@layer components { }`. Importat amb
     layer(components), el full aniria a la subcapa components.components, que
     perd sempre contra les regles de components.css i modules.css (.sdp-pindola,
     .sdp-camp): les sobreescriptures de les eines deixarien de funcionar. */
  test('la capçalera del full prescriu l’@import SENSE layer(), com components.css i modules.css', () => {
    expect(FULL).toContain("@import url('../components/PedraSeca/catalegColleccio.css');");
    expect(FULL).not.toMatch(/catalegColleccio\.css'\)\s*layer\(/);
  });

  /* ESQ-R2 · Sense esta línia les peces i els espècimens es pinten sense
     estils i la porta Pedra Seca marca el full com a LLEI_08_SUBARBRE_ORFE.
     La prova queda roja fins que index.css (fora de l'abast del lot) l'importe. */
  test('index.css l’importa una sola vegada i sense layer()', () => {
    const index = senseComentaris(llig('src/css/index.css'));
    const imports = [...index.matchAll(/@import[^;]*catalegColleccio\.css[^;]*;/g)].map((m) => m[0]);
    expect(imports).toEqual(["@import url('../components/PedraSeca/catalegColleccio.css');"]);
  });
});

describe('la porta del catàleg (tooling/gates/tractor-cataleg.mjs) per a les peces', () => {
  const registre = llig(`${CAT}/registre.js`);
  /* Les mateixes expressions que la porta. */
  const entrades = [...registre.matchAll(/\{\s*nom:\s*'([^']+)',\s*fitxer:\s*'([^']+)'[^}]*estat:\s*'(\w+)'([^}]*)\}/g)]
    .map(([, nom, fitxer, estat, resta]) => ({ nom, fitxer, estat, fora: /fora:\s*true/.test(resta) }));
  const detalls = readdirSync(path.join(ARREL, CAT, 'detalls')).filter((f) => /^Especimen.*\.jsx$/.test(f))
    .map((f) => llig(`${CAT}/detalls/${f}`)).join('\n');
  const importats = new Set([...detalls.matchAll(/import\s*\{([^}]+)\}\s*from\s*'[^']*(?:components\/(?:ui|PedraSeca)\/[^']+|UniversalElements)'/g)]
    .flatMap((m) => m[1].split(',').map((s) => s.trim()).filter(Boolean)));

  /* Ordre del Mestre, 261004 (prompt 261004_0515, «no inventar targetes») · GraellaArticles i
     LlistaArticles passen a 'obsolet' per a codi nou, amb el substitut al registre. Salut i el
     Bar encara les fan servir: continuen exportades i el seu espècimen, viu. La resta, 'viu'. */
  const OBSOLETES = new Map([
    ['GraellaArticles', 'UniversalCard + GraellaTargetes'],
    ['LlistaArticles', 'UniversalCard + GraellaTargetes']
  ]);
  test.each(PECES)('%s: C1 registrat, C2 viu en un espècimen, C3 l’export existix', (nom, fitxer, especimen) => {
    expect([...llig(fitxer).matchAll(/^export\s+(?:function|const)\s+([A-Z]\w*)/gm)].map((m) => m[1])).toContain(nom);
    const estat = OBSOLETES.has(nom) ? 'obsolet' : 'viu';
    expect(entrades.find((e) => e.nom === nom)).toEqual({ nom, fitxer: fitxer.replace('src/components/', ''), estat, fora: false });
    if (OBSOLETES.has(nom)) {
      expect(registre).toContain(`{ nom: '${nom}', fitxer: '${fitxer.replace('src/components/', '')}', pagina: 'fonaments', estat: 'obsolet', substitut: '${OBSOLETES.get(nom)}' }`);
      expect(llig(fitxer), nom).toMatch(new RegExp(`@deprecated[\\s\\S]*?\\*/\\s*export function ${nom}\\b`));
    }
    expect(importats.has(nom)).toBe(true);
    expect(llig(`${CAT}/detalls/${especimen}.jsx`), especimen).toMatch(new RegExp(`\\b${nom}\\b`));
  });

  test('cap altre component PascalCase als fitxers del lot (els ajudants són funcions de pintat)', () => {
    const exportats = [...COMPONENTS, `${ORG}/marca.jsx`, `${ORG}/agrupacio.jsx`]
      .flatMap((f) => [...llig(f).matchAll(/^export\s+(?:function|const)\s+([A-Z]\w*)/gm)].map((m) => m[1]));
    expect(exportats.sort()).toEqual(PECES.map(([nom]) => nom).sort());
  });

  test('les peces de src/apps/comu: fora de la porta, amb un fitxer que existix i l’export que diuen', () => {
    for (const nom of ['EsqueletCatalegColleccio', 'ColumnaCataleg', 'ColumnaColleccio', 'ColumnaColleccions']) {
      const entrada = entrades.find((e) => e.nom === nom);
      expect(entrada, nom).toMatchObject({ estat: 'viu', fora: true });
      expect(llig(`src/${entrada.fitxer}`), nom).toMatch(new RegExp(`^export function ${nom}\\b`, 'm'));
    }
  });
});

describe('dades sintètiques', () => {
  test('cap correu, telèfon, DNI/NIE ni IBAN als fitxers del lot', () => {
    const vetats = [
      [/[\w.+-]+@[\w-]+\.[a-z]{2,}/i, 'correu'],
      [/\b(?:\+34[\s.-]?)?[6789]\d{2}[\s.-]?\d{3}[\s.-]?\d{3}\b/, 'telèfon'],
      [/\b[XYZ]?\d{7,8}[A-HJ-NP-TV-Z]\b/, 'DNI/NIE'],
      [/\bES\d{2}[\s]?\d{4}/, 'IBAN']
    ];
    const trobats = TOTS.filter((f) => !f.endsWith('registre.js') && !f.endsWith('manifest.js'))
      .flatMap((f) => vetats.filter(([patro]) => patro.test(llig(f))).map(([, que]) => `${f}: ${que}`));
    expect(trobats).toEqual([]);
  });

  test('cap caràcter de control, invisible ni bidi en cru', () => {
    const rangs = [[0x0000, 0x0008], [0x000B, 0x001F], [0x007F, 0x009F], [0x061C, 0x061C], [0x200B, 0x200F],
      [0x202A, 0x202E], [0x2060, 0x2069], [0xFEFF, 0xFEFF]];
    const car = (cp) => String.fromCodePoint(cp);
    const re = new RegExp(`[${rangs.map(([a, b]) => (a === b ? car(a) : `${car(a)}-${car(b)}`)).join('')}]`, 'u');
    for (const fitxer of [...TOTS, CSS]) expect(re.test(llig(fitxer)), fitxer).toBe(false);
  });
});
