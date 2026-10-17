// @vitest-environment node
/* Onada 0.3 (Gauntlet 261016, M03-M07 i I35) · Qualitat del visor de l'Arxiu
   visual (VisorImatges i la seua secció), calcada en menut de
   qualitat.carrusel.test.js:
   · ESLint amb la configuració del projecte i zero missatges, avisos inclosos,
     a tots els fitxers del front.
   · Pedra Seca per text: cap style=, cap color hex, cap :has() als fitxers de
     producció; Pedra Seca no importa de sections/.
   · El bloc VISOR D'IMATGES de components.css: dins de @layer components, només
     tokens que existixen, cap .sdp-boto (el carrusel ha d'anar darrere de tota
     regla .sdp-boto) ni cap classe de la pantalla completa; el bloc de les
     cel·les de modules.css, igual.
   · La porta del catàleg (tooling/gates/tractor-cataleg.mjs: C1, C2 i C3),
     l'export a la façana, l'ítem i el carregador.
   · Baseline 2022: cap API de JS més nova.
   Els patrons vetats es componen a trossos perquè les portes que llegixen
   src/ no els troben ací. */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');
const t = (...trossos) => trossos.join('');
const PS = 'src/components/PedraSeca';
const CAT = 'src/sections/disseny/cataleg';
const MM = 'src/sections/multimedia';

const NOM = 'VisorImatges';
const COMPONENT = `${PS}/organismes/VisorImatges.jsx`;
const ESPECIMEN = `${CAT}/detalls/EspecimenVisorImatges.jsx`;
const PRODUCCIO = [
  COMPONENT, ESPECIMEN,
  `${MM}/MultimediaSection.jsx`, `${MM}/MultimediaContext.jsx`, `${MM}/VisorDeLArxiu.jsx`, `${MM}/useMetadadesFoto.js`,
  `${MM}/useCensImatges.js`, `${MM}/censImatges.js`, `${MM}/origenImatges.js`, `${MM}/cronologia.js`, `${MM}/panellDeLaFoto.js`,
  `${MM}/rutesMultimedia.js`, `${MM}/mediaContent.js`, `${MM}/legacyMedia.js`,
  'src/sections/detail/ItemDetailSection.jsx', 'src/components/universal/enquadrament/exif.js'
];
const PROVES = [
  `${PS}/organismes/VisorImatges.test.jsx`, `${PS}/qualitat.visor.test.js`,
  `${MM}/censImatges.test.js`, `${MM}/cronologia.test.js`, `${MM}/origenImatges.test.js`, `${MM}/panellDeLaFoto.test.js`,
  `${MM}/MultimediaContext.test.jsx`, `${MM}/MultimediaSection.visor.test.jsx`, `${MM}/i18n.multimedia.test.js`,
  `${MM}/mediaContent.test.js`, `${MM}/MultimediaSection.test.jsx`, `${MM}/MultimediaSection.recursos.test.jsx`,
  'src/components/universal/enquadrament/exif.test.js', 'src/components/universal/enquadrament/exif.fuzz.test.js',
  'src/sections/detail/ItemDetailSection.test.jsx', 'src/sections/detail/ItemDetailSection.imatgesPropies.test.jsx',
  'src/sections/search/indexCerca.test.js'
];
/* Fitxers compartits que el front toca en un punt (lint, sense les regles de text de Pedra Seca). */
const COMPARTITS = ['src/config/navigation.js', 'src/config/i18n.js', 'src/components/PedraSeca/index.js',
  `${CAT}/registre.js`, `${CAT}/manifest.js`, `${CAT}/detailRegistry.jsx`, `${CAT}/versio.js`];

const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** El bloc de primer nivell d'un full que nomena `classe`. */
function blocAmb(full, classe) {
  const net = senseComentaris(llig(full));
  let profunditat = 0;
  let inici = 0;
  for (let i = 0; i < net.length; i += 1) {
    if (net[i] === '{') profunditat += 1;
    if (net[i] === ';' && profunditat === 0) inici = i + 1;
    if (net[i] === '}') {
      profunditat -= 1;
      if (profunditat === 0) {
        const tros = net.slice(inici, i + 1).trim();
        if (tros.includes(classe)) return { text: tros, inici, net };
        inici = i + 1;
      }
    }
  }
  return { text: '', inici: -1, net };
}

const CSS_SRC = readdirSync(path.join(ARREL, 'src/css')).filter((f) => f.endsWith('.css')).map((f) => llig(`src/css/${f}`)).join('\n');
const TOKENS_DEFINITS = new Set([...CSS_SRC.matchAll(/(--sdp-[\w-]+)\s*:/g)].map((m) => m[1]));

describe('ESLint', () => {
  test('zero missatges, avisos inclosos', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const fitxers = [...PRODUCCIO, ...PROVES, ...COMPARTITS];
    const resultats = await eslint.lintFiles(fitxers.map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(fitxers.length);
    expect(missatges).toEqual([]);
  }, 120000);
});

describe('Pedra Seca per text', () => {
  test('fora de proves: cap style=, cap color hex, cap :has()', () => {
    const vetats = [
      [new RegExp(t('\\sst', 'yle=[{"]')), 'style='],
      [/#[0-9a-fA-F]{3,8}\b/, 'color hex'],
      [new RegExp([':ha', 's\\('].join('')), ':has()']
    ];
    const trobats = PRODUCCIO.flatMap((f) => vetats.filter(([patro]) => patro.test(llig(f))).map(([, que]) => `${f}: ${que}`));
    expect(trobats).toEqual([]);
  });

  test('l’organisme no importa de sections/ ni pel barril de Pedra Seca', () => {
    const codi = llig(COMPONENT);
    const especificadors = [...codi.matchAll(/\bfrom\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
    expect(especificadors.filter((e) => e.includes('sections/') || /\/index\.js$/.test(e))).toEqual([]);
  });

  test('una sola peça PascalCase exportada', () => {
    expect([...llig(COMPONENT).matchAll(/^export\s+(?:function|const)\s+([A-Z]\w*)/gm)].map((m) => m[1])).toEqual([NOM]);
  });
});

describe('el bloc VISOR D’IMATGES de components.css', () => {
  const bloc = blocAmb('src/css/components.css', 'sdp-visor');

  test('existix, dins de @layer components i darrere del carrusel', () => {
    expect(bloc.text.startsWith('@layer components')).toBe(true);
    expect(bloc.inici).toBeGreaterThan(bloc.net.indexOf('.sdp-carrusel'));
  });

  test('cap .sdp-boto (el carrusel en depén), cap classe de la pantalla completa, cap !important', () => {
    expect(bloc.text).not.toMatch(/\.sdp-boto\b/);
    expect(bloc.text).not.toMatch(/sdp-pantalla-completa|sdp-dialeg--completa|sdp-capa-modal--completa/);
    expect(bloc.text).not.toMatch(/!important/);
  });

  test('només tokens que existixen, cap color cru ni unitat de viewport', () => {
    const usats = [...bloc.text.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]);
    expect(usats.length).toBeGreaterThan(10);
    expect(usats.filter((token) => !token.startsWith('--sdp-') || !TOKENS_DEFINITS.has(token))).toEqual([]);
    expect(bloc.text).not.toMatch(/#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|color-mix)\(/i);
    expect(bloc.text).not.toMatch(/\d(?:d|s|l)?v(?:h|w)\b/);
  });

  test('el zoom: transform amb les tres propietats pròpies, declarades al mateix bloc', () => {
    for (const propietat of ['--sdp-visor-escala', '--sdp-visor-x', '--sdp-visor-y']) expect(bloc.text).toContain(`${propietat}:`);
    expect(bloc.text).toMatch(/transform:\s*translate\(var\(--sdp-visor-x\), var\(--sdp-visor-y\)\) scale\(var\(--sdp-visor-escala\)\)/);
    expect(bloc.text).not.toMatch(/(?:^|[;{\s])(?:rotate|scale|translate)\s*:/);
  });

  test('el fons fosc és el del crom, (0,3,0) damunt del Dialeg complet', () => {
    expect(bloc.text).toMatch(/\.sdp-dialeg\.sdp-visor\.sdp-dialeg--sense-marc\s*\{\s*background:\s*var\(--sdp-crom-fons\);/);
  });
});

/* Revisió adversarial del 261016 · Abans la cel·la era el mateix <button> amb
   la classe .photo-grid__item i un reset en flex: no creixia fins a contindre
   la foto (Chrome no aplica el mínim automàtic d'aspect-ratio a un botó) i
   la foto tapava la fila de davall. Ara el botó és un embolcall en bloc i la
   cel·la de sempre va a dins, en bloc com l'<a> d'abans. */
describe('les cel·les de l’Arxiu (modules.css)', () => {
  const bloc = blocAmb('src/css/modules.css', '.photo-grid__boto');

  test('el botó embolcall, dins de @layer components; la cel·la, en bloc; el hover, només amb ratolí; la regla legacy, intacta', () => {
    expect(bloc.text.startsWith('@layer components')).toBe(true);
    expect(bloc.text).toMatch(/\.photo-grid__boto\s*\{[^}]*display:\s*block;[^}]*inline-size:\s*100%;[^}]*padding:\s*0;[^}]*border:\s*0;[^}]*background:\s*transparent;[^}]*color:\s*var\(--sdp-accent-titol\);/);
    expect(bloc.text).not.toMatch(/\.photo-grid__boto\s*\{[^}]*display:\s*flex/);
    expect(bloc.text).toMatch(/\.photo-grid__boto > \.photo-grid__item\s*\{\s*display:\s*block;\s*\}/);
    expect(bloc.text).toMatch(/@media \(hover: hover\) and \(pointer: fine\)\s*\{\s*\.photo-grid__boto:hover/);
    expect(bloc.text).not.toMatch(/button\.photo-grid__item/);
    const net = senseComentaris(llig('src/css/modules.css'));
    expect(net).toMatch(/\.photo-grid__item \{\s*width: 100%;\s*aspect-ratio: 1 \/ 1;\s*object-fit: cover;\s*border-radius: var\(--sdp-radi-m\);\s*border: 1px solid var\(--sdp-vora\);\s*\}/);
  });
});

describe('la porta del catàleg (tooling/gates/tractor-cataleg.mjs) per a VisorImatges', () => {
  const registre = llig(`${CAT}/registre.js`);
  const entrades = [...registre.matchAll(/\{\s*nom:\s*'([^']+)',\s*fitxer:\s*'([^']+)'[^}]*estat:\s*'(\w+)'([^}]*)\}/g)]
    .map(([, nom, fitxer, estat, resta]) => ({ nom, fitxer, estat, fora: /fora:\s*true/.test(resta) }));
  const detalls = readdirSync(path.join(ARREL, CAT, 'detalls')).filter((f) => /^Especimen.*\.jsx$/.test(f))
    .map((f) => llig(`${CAT}/detalls/${f}`)).join('\n');
  const importats = new Set([...detalls.matchAll(/import\s*\{([^}]+)\}\s*from\s*'[^']*(?:components\/(?:ui|PedraSeca)\/[^']+|UniversalElements)'/g)]
    .flatMap((m) => m[1].split(',').map((s) => s.trim()).filter(Boolean)));

  test('C1 registrat, C2 viu en un espècimen que el munta, C3 l’export existix', () => {
    expect(entrades.find((e) => e.nom === NOM)).toEqual({ nom: NOM, fitxer: 'PedraSeca/organismes/VisorImatges.jsx', estat: 'viu', fora: false });
    expect(importats.has(NOM)).toBe(true);
    expect(llig(ESPECIMEN)).toMatch(new RegExp(`<${NOM}\\b`));
  });

  test('la façana l’exporta i el catàleg en té l’ítem i el carregador', () => {
    expect(llig(`${PS}/index.js`)).toContain(`export { ${NOM} } from './organismes/VisorImatges.jsx';`);
    expect(llig(`${CAT}/manifest.js`)).toMatch(/especimen\('superposicions', 'visor-imatges',/);
    expect(llig(`${CAT}/detailRegistry.jsx`)).toContain("'superposicions/visor-imatges': lazyRoute(() => import('./detalls/EspecimenVisorImatges.jsx')),");
  });
});

describe('Baseline 2022 (Safari 16.0, Chrome 100, Firefox 100)', () => {
  test('JS: cap API més nova ni lookbehind', () => {
    const vetat = /\.(?:findLast|findLastIndex|toSorted|toReversed|toSpliced|with)\(|Object\.groupBy|withResolvers|\(\?<[=!]/;
    expect(PRODUCCIO.filter((f) => vetat.test(llig(f)))).toEqual([]);
  });
});
