// @vitest-environment node
/* La Nevera de Casa · qualitat: les portes del repo sobre TOTS els fitxers
   de l'app (proves incloses) i sobre els dos fitxers de la plataforma que
   este lot toca (registreApps.js i la seua prova).
   · ESLint amb la configuració del projecte i zero missatges.
   · Ordre del Mestre (261002, sinergies T4/T8): un sol esquelet visual. Cap
     classe, cap element de llista, graella ni taula propi: tot el visual
     estructural ix de src/apps/comu/esquelet i de Pedra Seca.
   · Pedra Seca per text: cap style=, cap h1 ni h2, cap import de CSS ni :has().
   · Baseline 2022 (Safari 16.0, Chrome 100, Firefox 100).
   · El literal de compilació del manifest i el registre.
   · Dades sintètiques: cap correu, telèfon, DNI/NIE ni IBAN; cap invisible.
   Els patrons vetats es componen a trossos perquè les portes que llegixen
   src/ no els troben ací (patró de src/sections/gestoria/qualitat.test.js). */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const APP = 'src/apps/nevera';
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');

function fitxersDe(directori) {
  const fitxers = [];
  for (const entrada of readdirSync(path.join(ARREL, directori), { withFileTypes: true })) {
    const ruta = `${directori}/${entrada.name}`;
    if (entrada.isDirectory()) fitxers.push(...fitxersDe(ruta));
    else if (/\.jsx?$/.test(entrada.name)) fitxers.push(ruta);
  }
  return fitxers.sort();
}

const DE_LAPP = fitxersDe(APP);
const TOCATS = ['src/apps/plataforma/registreApps.js', 'src/apps/plataforma/registreApps.test.js'];
const TOTS = [...DE_LAPP, ...TOCATS];
const esProva = (f) => /\.test\.jsx?$/.test(f);
const PRODUCCIO = DE_LAPP.filter((f) => !esProva(f));
const JSX = PRODUCCIO.filter((f) => f.endsWith('.jsx'));
const especificadors = (codi) => [...codi.matchAll(/(?:from\s+|import\s*\(\s*)['"]([^'"]+)['"]/g)].map((m) => m[1]);
const importats = (codi) => [...codi.matchAll(/import\s*\{([^}]+)\}\s*from/g)].flatMap((m) => m[1].split(',').map((s) => s.trim()));
/* L'única excepció a «les graelles, només a través de les columnes»: tancada i
   PROVISIONAL, pendent del vistiplau del Mestre. El mig de la Temporada
   (decisió 1 del Mestre, 261003) agrupa la llista per l'estat de temporada i
   porta el mes i el filtre (NavegacioPeriode) a les eines. ColumnaCataleg té
   unes eines fixes (categoria, vista, afegit) i ColumnaColleccio no agrupa per
   seccions: cap columna de l'esquelet hi té lloc. Per això el mig munta la
   graella de Pedra Seca amb el marc de l'esquelet (MarcColumna +
   AppGridColumn), com Ajustos, i UNA sola vegada: el detall és ColumnaCataleg.
   Si el Mestre la rebutja, l'eixida és un lloc per a eines pròpies a
   l'esquelet comú (src/apps/comu). { fitxer: { peça: vegades que es munta } } */
const PECES_SOLTES = Object.freeze({ [`${APP}/vistes/Temporada.jsx`]: Object.freeze({ GraellaArticles: 1 }) });

describe('el cens', () => {
  test('hi són el manifest, el nucli, el magatzem, la vista i les proves', () => {
    for (const fitxer of [
      'manifest.js', 'AppNevera.jsx', 'rutes.js', 'magatzem.js', 'useNevera.js', 'importador.js',
      'nucli/index.js', 'nucli/cataleg.js', 'nucli/nevera.js', 'nucli/copia.js', 'nucli/productes.js',
      'vistes/constants.js', 'vistes/context.js', 'vistes/vestits.js', 'vistes/useObriDetall.js', 'vistes/AvisNevera.jsx',
      'vistes/Compra.jsx', 'vistes/Cataleg.jsx', 'vistes/Casa.jsx', 'vistes/Ajustos.jsx', 'vistes/DialegNovaLlista.jsx',
      'vistes/perTemporada.js', 'vistes/Temporada.jsx',
      'nucli/nevera.test.js', 'nucli/copia.test.js', 'nucli/productes.test.js', 'importador.test.js', 'magatzem.test.js',
      'vistes/vestits.test.js', 'vistes/perTemporada.test.js', 'AppNevera.test.jsx', 'Temporada.test.jsx',
      'frontera.test.js', 'qualitat.test.js'
    ]) expect(existsSync(path.join(ARREL, APP, fitxer)), fitxer).toBe(true);
  });
});

describe('ESLint', () => {
  test('zero missatges, avisos inclosos, a tots els fitxers', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles(TOTS.map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(TOTS.length);
    expect(missatges).toEqual([]);
    // Sonda: la configuració del projecte és activa (un avís és un error amb --max-warnings=0).
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, APP, 'sonda.js') });
    expect(sonda.messages.map((m) => m.ruleId)).toEqual(['no-unused-vars', 'eol-last']);
  }, 120000);
});

describe('un sol esquelet visual (ordre del Mestre, sinergies T4/T8)', () => {
  test('cap classe pròpia: tota la geometria és de l’esquelet i de Pedra Seca', () => {
    for (const f of JSX) expect(/className=/.test(llig(f)), f).toBe(false);
  });

  test('cap element de llista, graella ni taula propi, ni cap rol que en faça', () => {
    const estructura = new RegExp(['<(?:ul|ol|li|dl|table|tr|td|th)[\\s>]|role=["\']', '(?:list|listitem|grid|gridcell|row|listbox|option)["\']'].join(''));
    for (const f of JSX) expect(llig(f).match(estructura), f).toBeNull();
    /* Sonda: el patró veu una llista, una taula i un rol de graella. */
    for (const sonda of ['<ul>', '<li key="x">', '<table aria-label="t">', 'role="grid"']) expect(estructura.test(sonda), sonda).toBe(true);
    expect(estructura.test('<ColumnaColleccio linies={[]} />')).toBe(false);
  });

  test('les columnes ixen de l’esquelet comú: catàleg, col·lecció, col·leccions i la taula de rutes', () => {
    const delEsquelet = new Set(PRODUCCIO.filter((f) => especificadors(llig(f)).some((e) => e.endsWith('comu/esquelet/index.js')))
      .flatMap((f) => importats(llig(f))));
    /* La llista activa de cada entrada (també Llistes i Ajustos, que no són de
       l'esquelet) es llig amb useRutaApp de la plataforma sobre la mateixa taula. */
    for (const peca of ['ColumnaCataleg', 'ColumnaColleccio', 'ColumnaColleccions', 'rutesCatalegColleccio', 'useVistaCataleg', 'useVistesEsquelet']) {
      expect(delEsquelet.has(peca), peca).toBe(true);
    }
    expect(llig(`${APP}/rutes.js`).match(/\.\.\.rutesCatalegColleccio\(/g)).toHaveLength(3);
  });

  test('cap peça de catàleg o col·lecció importada a soles: les graelles i targetes, només a través de les columnes', () => {
    const peces = /\b(?:GraellaArticles|LlistaArticles|LiniesColleccio|TargetesColleccions|SeccionsCategoria|BarraResum|AfegitRapid|DetallArticle|Rajola)\b/;
    const soltes = (f) => Object.keys(PECES_SOLTES[f] || {});
    for (const f of PRODUCCIO) expect(importats(llig(f)).filter((nom) => peces.test(nom) && !soltes(f).includes(nom)), f).toEqual([]);
    /* L'excepció no és morta ni s'eixampla: el fitxer encara importa cada peça
       que s'hi admet i la munta exactament les vegades que diu. */
    for (const [f, admeses] of Object.entries(PECES_SOLTES)) {
      expect(importats(llig(f)), f).toEqual(expect.arrayContaining(Object.keys(admeses)));
      for (const [peca, vegades] of Object.entries(admeses)) {
        expect(llig(f).match(new RegExp(`<${peca}\\b`, 'g')) || [], `${f}: ${peca}`).toHaveLength(vegades);
      }
    }
  });

  test('cap AppGridShell a mà: l’única closca és ClosaAplicacio, i una sola, a AppNevera', () => {
    const closca = /components\/layout\/AppGridShell/;
    expect(PRODUCCIO.flatMap((f) => especificadors(llig(f)).filter((e) => closca.test(e)))).toEqual([]);
    expect(PRODUCCIO.filter((f) => /<ClosaAplicacio\b/.test(llig(f)))).toEqual([`${APP}/AppNevera.jsx`]);
  });
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

  test('cap HTML cru', () => {
    const cru = new RegExp(['\\binner', 'HTML\\b|\\bouter', 'HTML\\b|insertAdjacent', 'HTML|dangerously', 'SetInnerHTML'].join(''));
    for (const f of DE_LAPP) expect(cru.test(llig(f)), f).toBe(false);
  });
});

describe('Baseline 2022 (Safari 16.0, Chrome 100, Firefox 100)', () => {
  test('cap API més nova ni lookbehind al codi de producció', () => {
    const vetat = /\.(?:findLast|findLastIndex|toSorted|toReversed|toSpliced|with)\(|Object\.groupBy|withResolvers|\(\?<[=!]/;
    for (const f of PRODUCCIO) expect(vetat.test(llig(f)), f).toBe(false);
  });
});

describe('el manifest i el registre', () => {
  test('la càrrega va darrere del literal de compilació EXACTE, amb una sola importació dinàmica', () => {
    const manifest = llig(`${APP}/manifest.js`);
    expect(manifest).toContain("import.meta.env.DEV || import.meta.env.VITE_SDP_APP_NEVERA === '1' ? () => import('./AppNevera.jsx') : null");
    expect(manifest.split('import(').length - 1).toBe(1);
  });

  test('registreApps.js la registra com a app interna, darrere de bar i salut', () => {
    const registre = llig('src/apps/plataforma/registreApps.js');
    expect(registre).toContain("import manifestNevera from '../nevera/manifest.js';");
    /* Les apps que es registren després (el Lector) no la mouen del seu lloc. */
    expect(registre).toMatch(/MANIFESTS_INTERNS = Object\.freeze\(\[manifestBar, manifestSalut, manifestNevera[\],]/);
  });
});

describe('dades sintètiques', () => {
  test('cap correu, telèfon, DNI/NIE ni IBAN', () => {
    const vetats = [
      [/[\w.+-]+@[\w-]+\.[a-z]{2,}/i, 'correu'],
      [/\b(?:\+34[\s.-]?)?[6789]\d{2}[\s.-]?\d{3}[\s.-]?\d{3}\b/, 'telèfon'],
      [/\b[XYZ]?\d{7,8}[A-HJ-NP-TV-Z]\b/, 'DNI/NIE'],
      [/\bES\d{2}[\s]?\d{4}/, 'IBAN']
    ];
    const trobats = DE_LAPP.flatMap((f) => vetats.filter(([patro]) => patro.test(llig(f))).map(([, que]) => `${f}: ${que}`));
    expect(trobats).toEqual([]);
  });

  test('cap caràcter de control, invisible ni bidi en cru', () => {
    const rangs = [[0x0000, 0x0008], [0x000B, 0x001F], [0x007F, 0x009F], [0x00AD, 0x00AD], [0x061C, 0x061C], [0x200B, 0x200F],
      [0x202A, 0x202E], [0x2060, 0x2069], [0xFEFF, 0xFEFF], [0xFFFE, 0xFFFF]];
    const car = (cp) => String.fromCodePoint(cp);
    const re = new RegExp(`[${rangs.map(([a, b]) => (a === b ? car(a) : `${car(a)}-${car(b)}`)).join('')}]`, 'u');
    for (const fitxer of TOTS) expect(re.test(llig(fitxer)), fitxer).toBe(false);
  });
});
