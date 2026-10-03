// @vitest-environment node
/* Salut · qualitat: les portes del repo sobre TOTS els fitxers de
   src/apps/salut (proves incloses).
   · ESLint amb la configuració del projecte i zero missatges.
   · Pedra Seca per text: cap style=, cap h1/h2, cap full CSS propi; les
     classes són literals i existixen als fulls canònics (src/css). La
     geometria és de les peces de Pedra Seca i de l'esquelet comú.
   · Cap text de la UI, de les alertes ni de la guia porta vocabulari de
     diagnosi: Salut descriu i deriva, no etiqueta ningú.
   · Baseline 2022, cap caràcter invisible i cap dada personal.
   Els patrons vetats es componen a trossos perquè les portes que llegixen
   src/ no els troben ací (patró de src/sections/gestoria/qualitat.test.js). */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const SALUT = 'src/apps/salut';
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

const TOTS = fitxersDe(SALUT);
const esProva = (f) => /\.test\.jsx?$/.test(f);
const PRODUCCIO = TOTS.filter((f) => !esProva(f));
const JSX = PRODUCCIO.filter((f) => f.endsWith('.jsx'));
const senseComentarisCss = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const CSS_CANONIC = fitxersDe('src/css', /\.css$/).map(llig).join('\n');
const CLASSES_CANONIQUES = new Set([...senseComentarisCss(CSS_CANONIC).matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]));

describe('el cens', () => {
  test('hi són el manifest, l’app, el nucli, el magatzem, les vistes i les proves', () => {
    for (const esperat of [
      'manifest.js', 'AppSalut.jsx', 'rutesSalut.js', 'useSalut.jsx', 'magatzem.js', 'textos.js',
      'nucli/diccionari.js', 'nucli/hores.js', 'nucli/metriques.js', 'nucli/agitacio.js', 'nucli/alertes.js',
      'nucli/full.js', 'nucli/exportacio.js', 'nucli/copia.js', 'nucli/importacio.js', 'nucli/__fixtures__/plantillaSintetica.js',
      'vistes/comunes.jsx', 'vistes/FormulariApunt.jsx', 'vistes/Diari.jsx', 'vistes/Full.jsx', 'vistes/DialegExportacio.jsx',
      'vistes/descarrega.js', 'vistes/Resum.jsx', 'vistes/Agitacio.jsx', 'vistes/Saber.jsx', 'vistes/Ajustos.jsx', 'vistes/ImportarFull.jsx',
      'nucli/diccionari.test.js', 'nucli/hores.test.js', 'nucli/metriques.test.js', 'nucli/agitacio.test.js', 'nucli/alertes.test.js',
      'nucli/full.test.js', 'nucli/exportacio.test.js', 'nucli/copia.test.js', 'nucli/importacio.test.js', 'magatzem.test.js', 'AppSalut.test.jsx',
      'privacitat.test.js', 'qualitat.test.js'
    ]) expect(TOTS, esperat).toContain(`${SALUT}/${esperat}`);
  });
});

describe('ESLint', () => {
  test('zero missatges, avisos inclosos, a tots els fitxers', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const js = TOTS.filter((f) => /\.jsx?$/.test(f));
    const resultats = await eslint.lintFiles(js.map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(js.length);
    expect(missatges).toEqual([]);
    // Sonda: la configuració del projecte és activa (un avís és un error amb --max-warnings=0).
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, `${SALUT}/sonda.js`) });
    expect(sonda.messages.map((m) => m.ruleId)).toEqual(['no-unused-vars', 'eol-last']);
  }, 120000);
});

describe('Pedra Seca', () => {
  test('cap full CSS propi ni import de CSS: la geometria és de Pedra Seca', () => {
    expect(TOTS.filter((f) => f.endsWith('.css'))).toEqual([]);
    for (const f of PRODUCCIO) expect(/^\s*import\s+[^;]*\.css['"]/m.test(llig(f)), f).toBe(false);
  });

  test('cap style=, cap h1 ni h2, cap :has()', () => {
    const vetats = [
      [/\sstyle=[{"]/, 'style='],
      [new RegExp(['<h', '[12][\\s>]'].join('')), 'h1/h2'],
      [new RegExp([':ha', 's\\('].join('')), ':has()']
    ];
    const trobats = JSX.flatMap((f) => vetats.filter(([patro]) => patro.test(llig(f))).map(([, que]) => `${f}: ${que}`));
    expect(trobats).toEqual([]);
  });

  test('les classes són literals i totes existixen als fulls canònics', () => {
    const orfes = [];
    for (const f of JSX) {
      const codi = llig(f);
      expect(/className=\{/.test(codi), `${f}: className calculat`).toBe(false);
      for (const [, valor] of codi.matchAll(/className="([^"]+)"/g)) {
        for (const classe of valor.split(/\s+/)) if (!CLASSES_CANONIQUES.has(classe)) orfes.push(`${f}: .${classe}`);
      }
    }
    expect(orfes).toEqual([]);
    expect(CLASSES_CANONIQUES.has('sdp-boto--perill')).toBe(true);
  });

  test('l’esquelet comú: cap graella, llista ni closca pròpia', () => {
    const codi = PRODUCCIO.map(llig).join('\n');
    expect(codi).toMatch(/\bGraellaArticles\b/);
    expect(codi).toMatch(/\bLlistaArticles\b/);
    expect(codi).toMatch(/\bLiniaDelTemps\b/);
    expect(codi).toMatch(/\bHistograma\b/);
    expect(codi).toMatch(/\bClosaAplicacio\b/);
    expect(codi).not.toMatch(/components\/layout\/AppGridShell/);
    expect(/<(?:ul|ol)\b/.test(JSX.filter((f) => !f.endsWith('DialegExportacio.jsx')).map(llig).join('\n'))).toBe(false);
  });
});

describe('dignitat i paraules', () => {
  /* La llista vetada de §B.13: cap etiqueta clínica sobre la persona ni recomanació. */
  const VETATS = [
    ['diagn', 'òstic'], ['infec', 'ció'], ['té dem', 'ència'], ['poliú', 'ria'], ['incontinència d', '[’\']esforç'],
    ['tractament recom', 'anat'], ['dosi recom', 'anada']
  ].map((trossos) => new RegExp(trossos.join(''), 'i'));

  test('cap fitxer de producció (UI, alertes, guia, diccionari ni comentaris) porta el vocabulari vetat', () => {
    const trobats = PRODUCCIO.flatMap((f) => VETATS.filter((patro) => patro.test(llig(f))).map((patro) => `${f}: ${patro.source}`));
    expect(trobats).toEqual([]);
    // Sonda: els patrons troben les formes vetades.
    expect(VETATS[0].test(['Diagn', 'òstic'].join(''))).toBe(true);
    expect(VETATS[4].test(['incontinència d', '’esforç'].join(''))).toBe(true);
  });
});

describe('valencià del repo', () => {
  /* SAL-10: els verbs incoatius van en -ix (servix, substituïx, compartix,
     corregix), com a la resta del repo. Abast: els fitxers de producció de
     Salut (UI, textos, diccionari i comentaris). No són incoatius, i es
     queden: mateix, conéixer (coneix), aparéixer, paréixer, nàixer, créixer, peix… */
  const NO_INCOATIUS = new Set(['mateix', 'coneix', 'reconeix', 'desconeix', 'apareix', 'desapareix', 'pareix', 'neix', 'creix', 'peix', 'greix', 'feix', 'eix']);
  const INCOATIU = /\b([a-zà-ú]+eix)(?:en|es|o)?\b/giu;

  test('cap forma incoativa en -eix a Salut: la forma del repo és -ix', () => {
    const trobats = PRODUCCIO.flatMap((f) => [...llig(f).matchAll(INCOATIU)]
      .filter((m) => !NO_INCOATIUS.has(m[1].toLowerCase()))
      .map((m) => `${f}: ${m[0]}`));
    expect(trobats).toEqual([]);
    // Sonda: el patró troba les formes vetades i deixa les que no ho són.
    expect([...'Serveix i comparteix, el mateix'.matchAll(INCOATIU)].map((m) => m[1]).filter((p) => !NO_INCOATIUS.has(p.toLowerCase())))
      .toEqual(['Serveix', 'comparteix']);
  });
});

describe('higiene', () => {
  test('Baseline 2022: cap API més nova ni lookbehind', () => {
    const vetat = /\.(?:findLast|findLastIndex|toSorted|toReversed|toSpliced|with)\(|Object\.groupBy|withResolvers|\(\?<[=!]/;
    for (const f of PRODUCCIO) expect(vetat.test(llig(f)), f).toBe(false);
  });

  test('cap caràcter de control, invisible ni bidi en cru', () => {
    const rangs = [[0x0000, 0x0008], [0x000B, 0x001F], [0x007F, 0x009F], [0x00AD, 0x00AD], [0x061C, 0x061C], [0x200B, 0x200F],
      [0x202A, 0x202E], [0x2060, 0x2069], [0xFEFF, 0xFEFF], [0xFFFE, 0xFFFF]];
    const car = (cp) => String.fromCodePoint(cp);
    const re = new RegExp(`[${rangs.map(([a, b]) => (a === b ? car(a) : `${car(a)}-${car(b)}`)).join('')}]`, 'u');
    for (const f of TOTS) expect(re.test(llig(f)), f).toBe(false);
  });

  test('dades sintètiques: cap correu, telèfon (llevat del 112), DNI/NIE ni IBAN', () => {
    const vetats = [
      [/[\w.+-]+@[\w-]+\.[a-z]{2,}/i, 'correu'],
      [/\b(?:\+34[\s.-]?)?[6789]\d{2}[\s.-]?\d{3}[\s.-]?\d{3}\b/, 'telèfon'],
      [/\b[XYZ]?\d{7,8}[A-HJ-NP-TV-Z]\b/, 'DNI/NIE'],
      [/\bES\d{2}[\s]?\d{4}/, 'IBAN']
    ];
    const trobats = TOTS.flatMap((f) => vetats.filter(([patro]) => patro.test(llig(f))).map(([, que]) => `${f}: ${que}`));
    expect(trobats).toEqual([]);
    expect([...new Set(PRODUCCIO.flatMap((f) => [...llig(f).matchAll(/tel:(\d+)/g)].map((m) => m[1])))]).toEqual(['112']);
  });
});
