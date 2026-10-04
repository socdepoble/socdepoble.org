// @vitest-environment node
/* Gestoria · qualitat: les portes del repo sobre TOTS els fitxers .js i .jsx
   de src/sections/gestoria/ (proves incloses), sobre WikiDePobleSection.jsx
   i les seues proves de les eines locals, sobre el suport de proves dels
   tractors que fan servir i sobre la prova del 3T amb la carpeta real
   (tests/gestoria-3t-real.test.mjs). ESLint amb la configuració del projecte i zero
   missatges (l'equivalent de --max-warnings=0), i les comprovacions de Pedra
   Seca per text. Els patrons es componen a trossos perquè les portes que
   llegixen src/ no els troben ací. */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const CARRIL = 'src/sections/gestoria';
/* Carrils exclosos temporalment, amb el perquè. Buit: enviament/ (d'un altre
   agent, que hi treballa alhora) hi entra i passa; si un dia hi isquera
   alguna cosa, s'informa i s'hi afig ací amb la data, mai se silencia. */
const EXCLOSOS = Object.freeze([]);

function fitxersDe(directori) {
  const fitxers = [];
  for (const entrada of readdirSync(path.join(ARREL, directori), { withFileTypes: true })) {
    const ruta = `${directori}/${entrada.name}`;
    if (entrada.isDirectory()) fitxers.push(...fitxersDe(ruta));
    else if (/\.jsx?$/.test(entrada.name)) fitxers.push(ruta);
  }
  return fitxers.sort();
}

const GESTORIA = fitxersDe(CARRIL).filter((f) => !EXCLOSOS.some((exclos) => f.startsWith(exclos)));
/* Ordre del Mestre, 261004: també la ruta de la Wiki i les proves que fixen
   que una URL vella de la Gestoria cau com un ítem desconegut. */
const WIKI = [
  'src/sections/wiki-de-poble/WikiDePobleSection.jsx',
  'src/sections/wiki-de-poble/WikiDePobleSection.einesLocals.test.jsx',
  'src/sections/wiki-de-poble/WikiDePobleSection.produccio.test.jsx',
  'src/sections/wiki-de-poble/WikiDePobleSection.migracioGestoria.test.jsx',
  'src/sections/wiki-de-poble/RutaWikiDePoble.jsx',
  'src/sections/wiki-de-poble/RutaWikiDePoble.test.jsx'
];
/* Ordre del Mestre, 261004 («contaminació crítica de rutes/estats entre
   Gestoria i Wiki»): la Gestoria viu a la seua app. El pont, el manifest, les
   rutes i la seua prova passen les mateixes portes que el carril. */
const APP = [
  'src/apps/gestoria/AppGestoria.jsx',
  'src/apps/gestoria/AppGestoria.test.jsx',
  'src/apps/gestoria/manifest.js',
  'src/apps/gestoria/rutes.js'
];
const SUPORT = ['tests/helpers/autenticadorSimulat.js'];
/* La prova amb la carpeta real (node:test): no porta cap valor real, però sí les invariants de l'onada G3T. */
const PROVES_REALS = ['tests/gestoria-3t-real.test.mjs'];
const TOTS = [...GESTORIA, ...WIKI, ...APP, ...SUPORT, ...PROVES_REALS];
const esProva = (f) => /\.test\.m?jsx?$/.test(f) || f.includes('/__fixtures__/');
const PRODUCCIO = TOTS.filter((f) => !esProva(f));
const JSX = PRODUCCIO.filter((f) => f.endsWith('.jsx'));
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');

/* Els valors de className d'un JSX: literals i les dues branques d'una ternària. */
function classesDe(codi) {
  return [...codi.matchAll(/className=(?:"([^"]+)"|\{([^}]+)\})/g)]
    .flatMap(([, literal, expressio]) => (literal ? [literal] : [...expressio.matchAll(/'([^']+)'/g)].map((m) => m[1])))
    .flatMap((valor) => valor.split(/\s+/).filter(Boolean));
}

describe('el cens', () => {
  test('tots els fitxers del carril hi són, proves incloses', () => {
    for (const esperat of [
      'ContenidorGestoria.jsx', 'ContenidorGestoria.test.jsx', 'PanellGestoria.jsx', 'useGestoria.js', 'privacitat.test.js',
      'qualitat.test.js', 'nucli/tractor.js', 'nucli/tractor.test.js', 'font/fontNavegador.js', 'aprendre/Aprendre.jsx',
      'enviament/EnviamentGestoria.jsx', 'enviament/correuGestoria.js'
    ]) expect(GESTORIA, esperat).toContain(`${CARRIL}/${esperat}`);
    expect(GESTORIA.length).toBeGreaterThan(60);
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
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, CARRIL, 'sonda.js') });
    expect(sonda.messages.map((m) => m.ruleId)).toEqual(['no-unused-vars', 'eol-last']);
  }, 120000);
});

describe('Pedra Seca', () => {
  test('JSX: cap style=, cap h1 i className només literal o ternària de literals, sense classes d’utilitat', () => {
    const utilitats = /^sdp-(?:w|h|p|m|mt|mb|ml|mr|px|py|gap|bg|border|text|font|radius)-|^sdp-(?:flex|grid)(?:-|$)/;
    const h1 = new RegExp(['<h', '1[\\s>]'].join(''));
    for (const fitxer of JSX) {
      const codi = llig(fitxer);
      expect(/\sstyle=[{"]/.test(codi), `${fitxer}: style=`).toBe(false);
      expect(h1.test(codi), `${fitxer}: h1`).toBe(false);
      for (const [, expressio] of codi.matchAll(/className=\{([^}]*)\}/g)) {
        expect(expressio.trim(), `${fitxer}: className={${expressio}}`).toMatch(/^[^?'"`]+\?\s*'[^']*'\s*:\s*'[^']*'$/);
      }
      for (const classe of classesDe(codi)) {
        expect(classe, `${fitxer}: ${classe} sense prefix`).toMatch(/^sdp-/);
        expect(utilitats.test(classe), `${fitxer}: ${classe} és una classe d’utilitat`).toBe(false);
      }
    }
  });

  test('tota classe sdp-gestoria-* del JSX té regla a algun full de src/css', () => {
    const fulls = readdirSync(path.join(ARREL, 'src/css')).filter((f) => f.endsWith('.css')).map((f) => llig(`src/css/${f}`)).join('\n');
    const propies = [...new Set(JSX.filter((f) => f.startsWith(`${CARRIL}/`)).flatMap((f) => classesDe(llig(f))))]
      .filter((classe) => classe.startsWith('sdp-gestoria-'));
    expect(propies.length).toBeGreaterThan(20);
    const senseRegla = propies.filter((classe) => !new RegExp(`\\.${classe}(?![\\w-])`).test(fulls));
    expect(senseRegla).toEqual([]);
  });

  test('cap coixinet amb hex, terme vetat, espai invisible ni literal de DNI, proves incloses', () => {
    const vetats = [
      [/#[0-9a-fA-F]{3,8}\b/, 'color hex'],
      [new RegExp(['Local-', 'First|Offline-', 'First|iOS ', '15|iPad ', 'A10'].join('')), 'terme vetat'],
      [/\b\d{8}[A-Za-z]\b/, 'un literal de DNI'],
      [/from '@\//, 'import amb @/']
    ];
    const trobats = TOTS.flatMap((fitxer) => {
      const codi = llig(fitxer);
      const invisibles = codi.split('\n').flatMap((linia, i) => [...linia.matchAll(/[^\S\n\r\t ]/g)]
        .map((m) => `${fitxer}:${i + 1} espai invisible U+${m[0].codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`));
      return [...vetats.filter(([patro]) => patro.test(codi)).map(([, que]) => `${fitxer}: ${que}`), ...invisibles];
    });
    expect(trobats).toEqual([]);
  });

  test('HTML: cap HTML cru (tampoc a les proves); el perillós de React només amb sanitizeHtml', () => {
    const cru = new RegExp(['\\binner', 'HTML\\b|\\bouter', 'HTML\\b|insertAdjacent', 'HTML'].join(''));
    const perill = ['dangerously', 'SetInnerHTML'].join('');
    for (const fitxer of TOTS) {
      const codi = llig(fitxer);
      expect(cru.test(codi), `${fitxer}: HTML cru`).toBe(false);
      if (esProva(fitxer)) continue;
      const usos = codi.split(perill).length - 1;
      const sanejats = codi.split(`${perill}={{ __html: sanitizeHtml(`).length - 1;
      expect(sanejats, `${fitxer}: ${perill} sense sanitizeHtml`).toBe(usos);
    }
  });

  test('fora de proves: cap emmagatzematge del navegador (ni en comentaris), cap global escrita, res fora del Baseline', () => {
    const vetats = [
      [new RegExp(['local', 'Storage|session', 'Storage'].join('')), 'emmagatzematge del navegador'],
      [/(?:window|globalThis)\.\w+\s*=[^=]/, 'global escrita'],
      [/\.(?:findLast|findLastIndex|toSorted|toReversed|toSpliced|with)\(|Object\.groupBy|withResolvers/, 'fora del Baseline'],
      [/\(\?<[=!]/, 'lookbehind']
    ];
    const trobats = PRODUCCIO.flatMap((fitxer) => {
      const codi = llig(fitxer);
      return vetats.filter(([patro]) => patro.test(codi)).map(([, que]) => `${fitxer}: ${que}`);
    });
    expect(trobats).toEqual([]);
  });
});
