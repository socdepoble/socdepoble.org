// @vitest-environment node
/* Peces de les apps (Fase 0 del Bar i de Salut) · qualitat de Rajola,
   TeclatNumeric, LiniaDelTemps i Histograma, del seu full pecesApps.css, dels
   espècimens i dels fitxers del catàleg tocats.
   · ESLint amb la configuració del projecte i zero missatges.
   · Pedra Seca per text: cap style=, cap h1/h2, classes sdp-* que existixen,
     només tokens al CSS, espais de l'escala, cap :has(), cap ombra, controls
     ≥ --sdp-touch i imatges 1:1.
   · La porta tooling/gates/tractor-cataleg.mjs (C1, C2 i C3) reproduïda per a
     les quatre peces, amb les mateixes expressions.
   Els patrons es componen a trossos perquè les portes que llegixen src/ no els
   troben ací. */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');
const PS = 'src/components/PedraSeca';
const CAT = 'src/sections/disseny/cataleg';
const CSS = `${PS}/pecesApps.css`;

const PECES = [
  ['Rajola', `${PS}/molecules/Rajola.jsx`, 'EspecimenRajola'],
  ['TeclatNumeric', `${PS}/organismes/TeclatNumeric.jsx`, 'EspecimenTeclatNumeric'],
  ['LiniaDelTemps', `${PS}/organismes/LiniaDelTemps.jsx`, 'EspecimenLiniaDelTemps'],
  ['Histograma', `${PS}/organismes/Histograma.jsx`, 'EspecimenHistograma']
];
const COMPONENTS = PECES.map(([, fitxer]) => fitxer);
const ESPECIMENS = PECES.map(([, , especimen]) => `${CAT}/detalls/${especimen}.jsx`);
const JSX = [...COMPONENTS, ...ESPECIMENS];
const PROVES = [
  ...COMPONENTS.map((f) => f.replace(/\.jsx$/, '.test.jsx')),
  `${CAT}/detalls/EspecimensApps.test.jsx`,
  `${CAT}/detalls/allLoaders.test.jsx`,
  `${PS}/qualitat.pecesApps.test.js`
];
const TOCATS = [`${PS}/index.js`, `${CAT}/registre.js`, `${CAT}/manifest.js`, `${CAT}/detailRegistry.jsx`];
const TOTS = [...JSX, ...PROVES, ...TOCATS];

/* Els valors de className d'un JSX: literals, branques de ternària i elements d'una llista. */
function classesDe(codi) {
  return [...codi.matchAll(/className=(?:"([^"]+)"|\{([^}]+)\})/g)]
    .flatMap(([, literal, expressio]) => (literal ? [literal] : [...expressio.matchAll(/'([^']+)'/g)].map((m) => m[1])))
    .flatMap((valor) => valor.split(/\s+/).filter(Boolean));
}

const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const classesDelCss = (css) => new Set([...senseComentaris(css).matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]));
const CSS_CANONIC = readdirSync(path.join(ARREL, 'src/css')).filter((f) => f.endsWith('.css')).map((f) => llig(`src/css/${f}`)).join('\n');
const FULL = llig(CSS);
const FULL_NET = senseComentaris(FULL);

/* Les declaracions d'una regla: { selector → cos }. */
function regles(css) {
  const mapa = new Map();
  for (const m of senseComentaris(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    for (const selector of m[1].split(',').map((s) => s.trim())) mapa.set(selector, `${mapa.get(selector) ?? ''}${m[2]}`);
  }
  return mapa;
}

describe('ESLint', () => {
  test('zero missatges, avisos inclosos', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles(TOTS.map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(TOTS.length);
    expect(missatges).toEqual([]);
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

  test('tota classe dels components és sdp-* i té regla a pecesApps.css o als fulls canònics', () => {
    const propies = classesDelCss(FULL);
    const canoniques = classesDelCss(CSS_CANONIC);
    const orfes = [];
    for (const f of JSX) {
      for (const classe of classesDe(llig(f))) {
        expect(classe, `${f}: ${classe}`).toMatch(/^sdp-/);
        if (!propies.has(classe) && !canoniques.has(classe)) orfes.push(`${f}: ${classe}`);
      }
    }
    expect(orfes).toEqual([]);
    // Les classes de nivell de l'Histograma (fora del className) també hi són.
    for (let n = 0; n <= 10; n += 1) expect(propies.has(`sdp-histograma__barra--n${n}`), `n${n}`).toBe(true);
  });
});

describe('Pedra Seca · pecesApps.css', () => {
  test('només tokens semàntics: cap hex, rgb, hsl ni primitiu, i tots els tokens existixen', () => {
    expect(/#[0-9a-fA-F]{3,8}\b/.test(FULL_NET)).toBe(false);
    expect(/\b(?:rgba?|hsla?|oklch|color-mix)\(/.test(FULL_NET)).toBe(false);
    expect([...FULL_NET.matchAll(/var\(\s*(--sdp-(?:pedra|primary|secondary|blanc|negre|canon|error-|avis-|exit-)[\w-]*)/g)].map((m) => m[1])).toEqual([]);
    const definits = new Set([...CSS_CANONIC.matchAll(/(--sdp-[\w-]+)\s*:/g)].map((m) => m[1]));
    const fantasma = [...new Set([...FULL_NET.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]))].filter((t) => !definits.has(t));
    expect(fantasma).toEqual([]);
  });

  test('cap :has(), cap ombra, i tot dins de @layer components', () => {
    expect(new RegExp([':ha', 's\\('].join('')).test(FULL_NET)).toBe(false);
    expect(/box-shadow/.test(FULL_NET)).toBe(false);
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
  });

  test('els controls fan almenys --sdp-touch i les imatges són 1:1', () => {
    const r = regles(FULL);
    for (const control of ['.sdp-rajola', '.sdp-teclat__tecla', '.sdp-linia-temps__accio']) {
      expect(r.get(control), control).toMatch(/min-block-size:\s*var\(--sdp-touch(?:-comode)?\)/);
    }
    expect(r.get('.sdp-rajola')).toMatch(/min-inline-size:\s*var\(--sdp-touch\)/);
    expect(r.get('.sdp-teclat__tecla')).toMatch(/min-inline-size:\s*var\(--sdp-touch\)/);
    for (const quadrat of ['.sdp-rajola', '.sdp-rajola__media', '.sdp-rajola__imatge']) {
      expect(r.get(quadrat), quadrat).toMatch(/aspect-ratio:\s*1\s*\/\s*1/);
    }
  });
});

describe('la porta del catàleg (tooling/gates/tractor-cataleg.mjs) per a les quatre peces', () => {
  const registre = llig(`${CAT}/registre.js`);
  /* Les mateixes expressions que la porta. */
  const entrades = [...registre.matchAll(/\{\s*nom:\s*'([^']+)',\s*fitxer:\s*'([^']+)'[^}]*estat:\s*'(\w+)'([^}]*)\}/g)]
    .map(([, nom, fitxer, estat, resta]) => ({ nom, fitxer, estat, fora: /fora:\s*true/.test(resta) }));
  const detalls = readdirSync(path.join(ARREL, CAT, 'detalls')).filter((f) => /^Especimen.*\.jsx$/.test(f))
    .map((f) => llig(`${CAT}/detalls/${f}`)).join('\n');
  const importats = new Set([...detalls.matchAll(/import\s*\{([^}]+)\}\s*from\s*'[^']*(?:components\/(?:ui|PedraSeca)\/[^']+|UniversalElements)'/g)]
    .flatMap((m) => m[1].split(',').map((s) => s.trim()).filter(Boolean)));

  test.each(PECES)('%s: C1 registrat, C2 viu en un espècimen, C3 l’export existix', (nom, fitxer) => {
    const exportats = [...llig(fitxer).matchAll(/^export\s+(?:function|const)\s+([A-Z]\w*)/gm)].map((m) => m[1]);
    expect(exportats).toEqual([nom]);
    const entrada = entrades.find((e) => e.nom === nom);
    expect(entrada).toEqual({ nom, fitxer: fitxer.replace('src/components/', ''), estat: 'viu', fora: false });
    expect(importats.has(nom)).toBe(true);
  });

  test('la façana exporta les quatre peces', () => {
    const facana = llig(`${PS}/index.js`);
    for (const [nom, fitxer] of PECES) {
      expect(facana).toMatch(new RegExp(`export \\{ ${nom}\\b[^}]*\\} from '\\./${fitxer.replace(`${PS}/`, '').replace('.', '\\.')}'`));
    }
  });
});
