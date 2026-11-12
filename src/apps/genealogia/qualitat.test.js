// @vitest-environment node
/* Arbre Genealògic · qualitat: les portes del repo sobre els fitxers de
   src/apps/genealogia (proves incloses).
   · ESLint amb la configuració del projecte i zero missatges.
   · Llei d'Unificació de Pedra Seca (P0-114, punt 3), per text: cap full CSS
     ni import de CSS, cap style=, cap h1/h2, cap :has(); les classes són
     literals i existixen als fulls canònics (src/css); la closca és
     ClosaAplicacio (cap AppGridShell a mà) i cada columna és MarcColumna.
   · Tractor-promesa: cap text de la interfície diu que l'app cerca als arxius
     o que envia res.
   · Baseline 2022, cap caràcter invisible i cap dada personal real.
   Els patrons vetats es componen a trossos perquè les portes que llegixen
   src/ no els troben ací (patró de src/apps/salut/qualitat.test.js). */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';
import { TEXTOS } from './textos.js';

const ARREL = process.cwd();
const APP = 'src/apps/genealogia';
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

const TOTS = fitxersDe(APP);
const esProva = (f) => /\.test\.jsx?$/.test(f) || f.includes('/__fixtures__/');
const PRODUCCIO = TOTS.filter((f) => !esProva(f));
const JSX = PRODUCCIO.filter((f) => f.endsWith('.jsx'));
/* Els fitxers del grup de la interfície: l'arrel de l'app i les vistes. */
const esDelNucli = (f) => /\/(?:nucli|gedcom|arxius)\//.test(f);
const INTERFICIE = PRODUCCIO.filter((f) => !esDelNucli(f));
/*
 * L'abast de les portes de text: tot el codi de producció de l'app i les
 * proves de la interfície. Les proves de nucli/, gedcom/ i arxius/ porten a
 * posta entrades hostils (BOM, correus de mostra, ids inventats) i tenen les
 * seues pròpies portes.
 */
const ABAST = TOTS.filter((f) => !esProva(f) || !esDelNucli(f));
const senseComentarisCss = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const CSS_CANONIC = fitxersDe('src/css', /\.css$/).map(llig).join('\n');
const CLASSES_CANONIQUES = new Set([...senseComentarisCss(CSS_CANONIC).matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]));

describe('el cens', () => {
  test('hi són el manifest, l’app, les rutes, els textos, les sis vistes i les proves', () => {
    for (const esperat of [
      'manifest.js', 'AppGenealogia.jsx', 'rutesGenealogia.js', 'textos.js',
      'vistes/comunes.jsx', 'vistes/Entrevista.jsx', 'vistes/Arbre.jsx', 'vistes/Persones.jsx', 'vistes/Arxius.jsx', 'vistes/Intercanvi.jsx',
      'AppGenealogia.test.jsx', 'privacitat.test.js', 'qualitat.test.js'
    ]) expect(TOTS, esperat).toContain(`${APP}/${esperat}`);
  });
});

describe('ESLint', () => {
  /* Abast: tota l'app, proves incloses (la mateixa porta que plataforma/qualitat.test.js). */
  test('zero missatges, avisos inclosos, a tots els fitxers de l’app', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const js = TOTS.filter((f) => /\.jsx?$/.test(f));
    const resultats = await eslint.lintFiles(js.map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(js.length);
    expect(missatges).toEqual([]);
    // Sonda: la configuració del projecte és activa.
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, `${APP}/sonda.js`) });
    expect(sonda.messages.map((m) => m.ruleId)).toContain('no-unused-vars');
  }, 120000);
});

describe('Pedra Seca: la Llei d’Unificació', () => {
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
    expect(CLASSES_CANONIQUES.has('sdp-boto--secundari')).toBe(true);
  });

  test('l’esquelet comú: ClosaAplicacio, MarcColumna i peces de Pedra Seca; cap closca, llista ni graella pròpia', () => {
    const codi = INTERFICIE.map(llig).join('\n');
    expect(codi).toMatch(/<ClosaAplicacio\b/);
    expect(codi).toMatch(/<MarcColumna\b/);
    expect(codi).toMatch(/<Accions\b/);
    expect(codi).not.toMatch(/components\/layout\/AppGridShell/);
    expect(codi).not.toMatch(/\bUnica\s*:/);
    expect(/<(?:ul|ol|div|section|article|nav|aside|header|footer|main)\b/.test(JSX.map(llig).join('\n'))).toBe(false);
    /* Cada vista exportada es pinta dins de MarcGenealogia (MarcColumna). */
    for (const f of INTERFICIE.filter((r) => r.includes('/vistes/') && !r.endsWith('comunes.jsx'))) {
      expect(llig(f), f).toMatch(/<MarcGenealogia\b/);
    }
  });

  test('els botons van dins d’Accions (centrats) o són peces que ja ho fan', () => {
    for (const f of INTERFICIE.filter((r) => r.endsWith('.jsx'))) {
      const codi = llig(f);
      const botons = (codi.match(/<Boto\b/g) || []).length;
      if (botons === 0) continue;
      expect(codi, f).toMatch(/<Accions\b/);
    }
  });
});

describe('tractor-promesa i paraules', () => {
  test('cap text diu que l’app cerca als arxius, que envia les dades o que les publica', () => {
    const promeses = [
      /l[’']app (?:cerca|busca) (?:als|en los|nos) arxius/i,
      /(?:enviem|enviarem|s[’']envien a) (?:un|cap) servidor/i,
      /\bpublic(?:a|arà|ar) l[’']arbre\b/i,
      /\bthe app searches\b/i
    ];
    for (const [llengua, textos] of Object.entries(TEXTOS)) {
      for (const [clau, text] of Object.entries(textos)) {
        for (const patro of promeses) expect(patro.test(text), `${llengua}.${clau}: ${text}`).toBe(false);
      }
    }
    /* Sonda: i sí que diu el que fa. */
    expect(TEXTOS.ca['avis.noFa']).toMatch(/no cerca als arxius/);
    expect(TEXTOS.ca['exporta.preparaNoPublica.titol']).toBe('Prepara, no publica');
  });

  test('valencià del repo: cap forma incoativa en -eix a la interfície (la forma és -ix)', () => {
    const NO_INCOATIUS = new Set(['mateix', 'coneix', 'reconeix', 'desconeix', 'apareix', 'desapareix', 'pareix', 'neix', 'creix', 'peix', 'greix', 'feix', 'eix']);
    const INCOATIU = /\b([a-zà-ú]+eix)(?:en|es|o)?\b/giu;
    const valencia = [...INTERFICIE.map(llig), ...Object.values(TEXTOS.ca)].join('\n');
    const trobats = [...valencia.matchAll(INCOATIU)].filter((m) => !NO_INCOATIUS.has(m[1].toLowerCase())).map((m) => m[0]);
    expect(trobats).toEqual([]);
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
    /* Tota l'app, proves incloses: una entrada hostil (el BOM) es compon amb el seu punt de codi. */
    for (const f of TOTS) expect(re.test(llig(f)), f).toBe(false);
  });

  test('dades sintètiques: cap correu, telèfon, DNI/NIE ni IBAN', () => {
    const vetats = [
      [/[\w.+-]+@[\w-]+\.[a-z]{2,}/i, 'correu'],
      [/\b(?:\+34[\s.-]?)?[6789]\d{2}[\s.-]?\d{3}[\s.-]?\d{3}\b/, 'telèfon'],
      [/\b[XYZ]?\d{7,8}[A-HJ-NP-TV-Z]\b/, 'DNI/NIE'],
      [/\bES\d{2}[\s]?\d{4}/, 'IBAN']
    ];
    const trobats = ABAST.flatMap((f) => vetats.filter(([patro]) => patro.test(llig(f))).map(([, que]) => `${f}: ${que}`));
    expect(trobats).toEqual([]);
  });
});
