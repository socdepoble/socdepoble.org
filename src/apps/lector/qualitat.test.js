// @vitest-environment node
/* Notícies del Poble · qualitat: les portes del repo sobre TOTS els fitxers
   de l'app (proves incloses) i sobre els dos fitxers de la plataforma que
   este lot toca (registreApps.js i la seua prova).
   · ESLint amb la configuració del projecte i zero missatges.
   · Ordre del Mestre (261003): estil visual 100% Pedra Seca. Cap fitxer CSS a
     l'app, cap style=, cap className que no siga un literal d'una classe
     global que ja existix (src/css), cap h1, cap import de CSS ni :has().
   · Cap AppGridShell a mà: una sola ClosaAplicacio, a AppLector.
   · Cap HTML cru: l'article es pinta des de l'arbre net (Contingut.jsx).
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
const APP = 'src/apps/lector';
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');

function fitxersDe(directori, extensio = /\.jsx?$/) {
  const fitxers = [];
  for (const entrada of readdirSync(path.join(ARREL, directori), { withFileTypes: true })) {
    const ruta = `${directori}/${entrada.name}`;
    if (entrada.isDirectory()) fitxers.push(...fitxersDe(ruta, extensio));
    else if (extensio.test(entrada.name)) fitxers.push(ruta);
  }
  return fitxers.sort();
}

const DE_LAPP = fitxersDe(APP);
const TOCATS = ['src/apps/plataforma/registreApps.js', 'src/apps/plataforma/registreApps.test.js'];
const TOTS = [...DE_LAPP, ...TOCATS];
const esProva = (f) => /\.test\.jsx?$/.test(f) || f.includes('/__fixtures__/');
const PRODUCCIO = DE_LAPP.filter((f) => !esProva(f));
const JSX = PRODUCCIO.filter((f) => f.endsWith('.jsx'));
const especificadors = (codi) => [...codi.matchAll(/(?:from\s+|import\s*\(\s*)['"]([^'"]+)['"]/g)].map((m) => m[1]);
const senseComentaris = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '');

/* Les úniques classes que l'app escriu: globals de src/css, cap de nova. */
const CLASSES_GLOBALS = Object.freeze(['sdp-centre', 'lead', 'sdp-boto', 'sdp-boto--primari', 'sdp-boto--secundari', 'sdp-boto--gran', 'sdp-nomes-lector']);

describe('el cens', () => {
  test('hi són el manifest, el nucli, el port, la llavor, el magatzem, les vistes i les proves', () => {
    for (const fitxer of [
      'manifest.js', 'AppLector.jsx', 'rutes.js', 'magatzem.js', 'fontNoticies.js', 'useLector.js', 'useNoticies.js',
      'llavor/cataleg.js', 'llavor/fontLlavor.js', 'nucli/index.js', 'nucli/analitzador.js', 'nucli/html.js', 'nucli/xml.js',
      'vistes/context.js', 'vistes/navegacio.js', 'vistes/icones.js', 'vistes/comunes.jsx', 'vistes/Carpetes.jsx', 'vistes/Fonts.jsx',
      'vistes/Noticies.jsx', 'vistes/Lector.jsx', 'vistes/Contingut.jsx', 'vistes/GestioFonts.jsx',
      'nucli/xml.test.js', 'nucli/html.test.js', 'nucli/dates.test.js', 'nucli/analitzador.test.js', 'nucli/estat.test.js',
      'fontNoticies.test.js', 'magatzem.test.js', 'AppLector.test.jsx', 'privacitat.test.jsx', 'frontera.test.js', 'qualitat.test.js',
      /* SN (261003) · Les fonts personals: el nucli, l'API pública, el hook i les proves. */
      'nucli/personals.js', 'fontsPersonals.js', 'useFontsPersonals.js',
      'nucli/personals.test.js', 'fontsPersonals.test.js', 'fontsPersonals.vista.test.jsx'
    ]) expect(existsSync(path.join(ARREL, APP, fitxer)), fitxer).toBe(true);
  });

  test('cap fitxer CSS a l’app: tot el visual és de Pedra Seca', () => {
    expect(fitxersDe(APP, /\.(?:css|scss|less)$/)).toEqual([]);
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

describe('estil visual 100% Pedra Seca (ordre del Mestre, 261003)', () => {
  test('cap style=, cap h1, cap import de CSS ni :has(); cap h2 literal acabat en punt', () => {
    const vetats = [
      [/\sstyle=[{"]/, 'style='],
      [new RegExp(['<h', '1[\\s>]'].join('')), 'h1'],
      [/^\s*import\s+[^;]*\.css['"]/m, 'import de CSS'],
      [new RegExp([':ha', 's\\('].join('')), ':has()']
    ];
    const trobats = JSX.flatMap((f) => vetats.filter(([patro]) => patro.test(llig(f))).map(([, que]) => `${f}: ${que}`));
    expect(trobats).toEqual([]);
    for (const f of JSX) {
      for (const [, text] of llig(f).matchAll(/<h2[^>]*>([^<{]*)<\/h2>/g)) expect(text.trim().endsWith('.'), `${f}: «${text}»`).toBe(false);
    }
  });

  test('cada className és un literal de la llista de classes globals, i totes existixen a src/css', () => {
    const usades = new Set();
    for (const f of JSX) {
      const codi = llig(f);
      expect(/className=\{/.test(codi), `${f}: className amb expressió`).toBe(false);
      for (const [, valor] of codi.matchAll(/className="([^"]*)"/g)) {
        for (const classe of valor.split(/\s+/).filter(Boolean)) {
          expect(CLASSES_GLOBALS, `${f}: .${classe}`).toContain(classe);
          usades.add(classe);
        }
      }
    }
    expect([...usades].sort()).toEqual([...CLASSES_GLOBALS].sort());
    const canoniques = fitxersDe('src/css', /\.css$/).map((f) => senseComentaris(llig(f))).join('\n');
    for (const classe of CLASSES_GLOBALS) expect(new RegExp(`\\.${classe}(?![\\w-])`).test(canoniques), classe).toBe(true);
  });

  test('cap element de llista, graella ni taula escrit a mà: els de l’article ixen de la llista tancada de Contingut.jsx', () => {
    const estructura = new RegExp(['<(?:ul|ol|li|dl|table|tr|td|th)[\\s>]|role=["\']', '(?:list|listitem|grid|gridcell|row|listbox|option)["\']'].join(''));
    for (const f of JSX) expect(llig(f).match(estructura), f).toBeNull();
    for (const sonda of ['<ul>', '<li key="x">', 'role="grid"']) expect(estructura.test(sonda), sonda).toBe(true);
  });

  test('cap AppGridShell a mà: l’única closca és ClosaAplicacio, i una sola, a AppLector', () => {
    const closca = /components\/layout\/AppGridShell/;
    expect(PRODUCCIO.flatMap((f) => especificadors(llig(f)).filter((e) => closca.test(e)))).toEqual([]);
    expect(PRODUCCIO.filter((f) => /<ClosaAplicacio\b/.test(llig(f)))).toEqual([`${APP}/AppLector.jsx`]);
  });

  test('cap HTML cru, tampoc a les proves', () => {
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
    expect(manifest).toContain("import.meta.env.DEV || import.meta.env.VITE_SDP_APP_LECTOR === '1' ? () => import('./AppLector.jsx') : null");
    expect(manifest.split('import(').length - 1).toBe(1);
  });

  test('la llavor sintètica va darrere del seu literal EXACTE i només AppLector la crea (Model B)', () => {
    const app = llig(`${APP}/AppLector.jsx`);
    expect(app).toContain("const LLAVOR_ACTIVA = import.meta.env.DEV || import.meta.env.VITE_SDP_LECTOR_LLAVOR === '1';");
    expect(app).toContain('(LLAVOR_ACTIVA ? creaFontNoticies(creaAdaptadorLlavor({ ara: rellotge() })) : null)');
    const creen = PRODUCCIO.filter((f) => /(?<!function )creaAdaptadorLlavor\(/.test(senseComentaris(llig(f))));
    expect(creen).toEqual([`${APP}/AppLector.jsx`]);
  });

  test('registreApps.js la registra com a app interna, darrere de la Nevera', () => {
    const registre = llig('src/apps/plataforma/registreApps.js');
    expect(registre).toContain("import manifestLector from '../lector/manifest.js';");
    expect(registre).toMatch(/MANIFESTS_INTERNS = Object\.freeze\(\[[^\]]*manifestNevera, manifestLector\]\)/);
  });
});

describe('dades sintètiques', () => {
  const ambLlavor = [...TOTS, ...fitxersDe(`${APP}/llavor`, /\.xml$/)];

  test('cap correu, telèfon, DNI/NIE ni IBAN (codi, proves i llavor)', () => {
    const vetats = [
      [/[\w.+-]+@[\w-]+\.[a-z]{2,}/i, 'correu'],
      [/\b(?:\+34[\s.-]?)?[6789]\d{2}[\s.-]?\d{3}[\s.-]?\d{3}\b/, 'telèfon'],
      [/\b[XYZ]?\d{7,8}[A-HJ-NP-TV-Z]\b/, 'DNI/NIE'],
      [/\bES\d{2}[\s]?\d{4}/, 'IBAN']
    ];
    const trobats = ambLlavor.filter((f) => !f.endsWith('registreApps.js') && !f.endsWith('registreApps.test.js'))
      .flatMap((f) => vetats.filter(([patro]) => patro.test(llig(f))).map(([, que]) => `${f}: ${que}`));
    expect(trobats).toEqual([]);
  });

  test('cap caràcter de control, invisible ni bidi en cru', () => {
    const rangs = [[0x0000, 0x0008], [0x000B, 0x001F], [0x007F, 0x009F], [0x00AD, 0x00AD], [0x061C, 0x061C], [0x200B, 0x200F],
      [0x202A, 0x202E], [0x2060, 0x2069], [0xFEFF, 0xFEFF], [0xFFFE, 0xFFFF]];
    const car = (cp) => String.fromCodePoint(cp);
    const re = new RegExp(`[${rangs.map(([a, b]) => (a === b ? car(a) : `${car(a)}-${car(b)}`)).join('')}]`, 'u');
    for (const fitxer of [...ambLlavor, ...fitxersDe(`${APP}/nucli/__fixtures__`, /\.xml$/)]) expect(re.test(llig(fitxer)), fitxer).toBe(false);
  });
});
