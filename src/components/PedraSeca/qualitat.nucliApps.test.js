// @vitest-environment node
/* Ordre del Mestre, 261004 (prompt 261004_0515; D-A del xat de les 06:38) ·
   qualitat del front «nucli»: PaginaApp, GraellaTargetes, les opcionals
   d'UniversalCard, PageFrame, la barra taronja i l'autoria.
   · ESLint amb la configuració del projecte i zero missatges, avisos inclosos,
     a tots els fitxers del front.
   · Pedra Seca per text a les peces noves i als seus espècimens: cap style=,
     cap h1/h2 escrit a mà, cap :has(), cap className fet amb plantilla, i tota
     classe és sdp-* (o la de PageFrame) i té regla als fulls canònics.
   · El bloc CSS nou de modules.css: dins de @layer components, només tokens
     i espais de l'escala.
   · La porta tooling/gates/tractor-cataleg.mjs (C1, C2 i C3) per a les dues
     peces noves, amb les mateixes expressions, i la façana que les exporta.
   Els patrons es componen a trossos perquè les portes que llegixen src/ no els
   troben ací. */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');
const PS = 'src/components/PedraSeca';
const ORG = `${PS}/organismes`;
const CAT = 'src/sections/disseny/cataleg';

const PECES = [
  ['PaginaApp', `${ORG}/PaginaApp.jsx`, 'EspecimenPaginaApp'],
  ['GraellaTargetes', `${ORG}/GraellaTargetes.jsx`, 'EspecimenGraellaTargetes']
];
const ESPECIMENS = PECES.map(([, , especimen]) => `${CAT}/detalls/${especimen}.jsx`);
const JSX_NOUS = [...PECES.map(([, fitxer]) => fitxer), ...ESPECIMENS];
const TOCATS = [
  `${ORG}/UniversalCard.jsx`, `${ORG}/GraellaArticles.jsx`, `${ORG}/LlistaArticles.jsx`, `${PS}/index.js`,
  'src/components/universal/PageFrame.jsx', 'src/components/universal/UniversalUtils.js',
  'src/components/universal/barres/BarraTaronja.jsx', 'src/config/navigation.js',
  `${CAT}/registre.js`, `${CAT}/manifest.js`, `${CAT}/detailRegistry.jsx`, `${CAT}/detalls/EspecimenUniversalCard.jsx`
];
const PROVES = [
  `${ORG}/PaginaApp.test.jsx`, `${ORG}/GraellaTargetes.test.jsx`, `${ORG}/UniversalCard.apps.test.jsx`,
  'src/components/universal/PageFrame.apps.test.jsx', 'src/components/universal/barres/BarraTaronja.test.jsx',
  'src/config/navigation.autoria.test.js', `${CAT}/detalls/EspecimenUniversalCard.vinyeta.test.jsx`,
  'src/apps/comu/qualitat.test.js', `${PS}/qualitat.nucliApps.test.js`
];
const TOTS = [...JSX_NOUS, ...TOCATS, ...PROVES];

const senseComentaris = (codi) => codi.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const classesDelCss = (css) => new Set([...senseComentaris(css).matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]));
const CSS_CANONIC = readdirSync(path.join(ARREL, 'src/css')).filter((f) => f.endsWith('.css')).map((f) => llig(`src/css/${f}`))
  .concat([llig(`${PS}/pecesApps.css`), llig(`${PS}/catalegColleccio.css`)]).join('\n');

/* Els valors de className d'un JSX: literals, branques de ternària i elements d'una llista. */
function classesDe(codi) {
  return [...codi.matchAll(/className=(?:"([^"]+)"|\{([^}]+)\})/g)]
    .flatMap(([, literal, expressio]) => (literal ? [literal] : [...expressio.matchAll(/'([^']+)'/g)].map((m) => m[1])))
    .flatMap((valor) => valor.split(/\s+/).filter(Boolean));
}

describe('ESLint', () => {
  test('zero missatges, avisos inclosos, a tots els fitxers del front', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles(TOTS.map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(TOTS.length);
    expect(missatges).toEqual([]);
  }, 120000);
});

describe('Pedra Seca · JSX de les peces noves i dels seus espècimens', () => {
  test('cap style=, cap h1 ni h2 escrit a mà, cap :has() ni className fet amb plantilla', () => {
    const vetats = [
      [/\sstyle=[{"]/, 'style='],
      [new RegExp(['<h', '[12][\\s>]'].join('')), 'h1/h2'],
      [new RegExp([':ha', 's\\('].join('')), ':has()'],
      [/className=\{`/, 'className amb plantilla']
    ];
    const trobats = JSX_NOUS.flatMap((f) => vetats.filter(([patro]) => patro.test(llig(f))).map(([, que]) => `${f}: ${que}`));
    expect(trobats).toEqual([]);
  });

  test('tota classe de les peces és sdp-* i té regla als fulls canònics', () => {
    const canoniques = classesDelCss(CSS_CANONIC);
    const orfes = [];
    for (const f of PECES.map(([, fitxer]) => fitxer)) {
      for (const classe of classesDe(llig(f))) {
        expect(classe, `${f}: ${classe}`).toMatch(/^sdp-/);
        if (!canoniques.has(classe)) orfes.push(`${f}: ${classe}`);
      }
    }
    expect(orfes).toEqual([]);
    expect(classesDe(llig(`${ORG}/GraellaTargetes.jsx`)).sort()).toEqual(['sdp-card-grid', 'sdp-card-llista']);
  });

  test('les classes noves de PageFrame i d’UniversalCard tenen regla (o són el ganxo acordat amb el front CSS)', () => {
    const canoniques = classesDelCss(CSS_CANONIC);
    expect(canoniques.has('page-title-accio')).toBe(true);
    expect(llig('src/components/universal/PageFrame.jsx')).toContain("'sp-card-label--amb-accio'");
  });
});

describe('el bloc CSS nou de modules.css', () => {
  const MODULES = llig('src/css/modules.css');
  const inici = MODULES.indexOf("Front «nucli».");
  const bloc = MODULES.slice(MODULES.indexOf('@layer components {', inici), MODULES.indexOf('\n}\n', inici) + 2);

  test('viu dins de @layer components i definix les dues regles', () => {
    expect(inici).toBeGreaterThan(-1);
    expect(bloc.startsWith('@layer components {')).toBe(true);
    expect(bloc).toMatch(/\.page-title-accio \{\s*margin-block: var\(--sdp-space-8\);\s*\}/);
    expect(bloc).toMatch(/\.sdp-card-llista \{\s*display: flex;\s*flex-direction: column;\s*gap: 0;\s*\}/);
  });

  test('només tokens i espais de l’escala: cap color cru, cap :has(), cap px', () => {
    const net = senseComentaris(bloc);
    expect(/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch)\(/.test(net)).toBe(false);
    expect(new RegExp([':ha', 's\\('].join('')).test(net)).toBe(false);
    expect(/\d+px/.test(net)).toBe(false);
    const definits = new Set([...CSS_CANONIC.matchAll(/(--sdp-[\w-]+)\s*:/g)].map((m) => m[1]));
    expect([...net.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]).filter((t) => !definits.has(t))).toEqual([]);
  });
});

describe('la porta del catàleg (tooling/gates/tractor-cataleg.mjs) per a les dues peces noves', () => {
  const registre = llig(`${CAT}/registre.js`);
  /* Les mateixes expressions que la porta. */
  const entrades = [...registre.matchAll(/\{\s*nom:\s*'([^']+)',\s*fitxer:\s*'([^']+)'[^}]*estat:\s*'(\w+)'([^}]*)\}/g)]
    .map(([, nom, fitxer, estat, resta]) => ({ nom, fitxer, estat, fora: /fora:\s*true/.test(resta) }));
  const detalls = readdirSync(path.join(ARREL, CAT, 'detalls')).filter((f) => /^Especimen.*\.jsx$/.test(f))
    .map((f) => llig(`${CAT}/detalls/${f}`)).join('\n');
  const importats = new Set([...detalls.matchAll(/import\s*\{([^}]+)\}\s*from\s*'[^']*(?:components\/(?:ui|PedraSeca)\/[^']+|UniversalElements)'/g)]
    .flatMap((m) => m[1].split(',').map((s) => s.trim()).filter(Boolean)));

  test.each(PECES)('%s: C1 registrat, C2 viu en un espècimen, C3 l’export existix', (nom, fitxer, especimen) => {
    const exportats = [...llig(fitxer).matchAll(/^export\s+(?:function|const)\s+([A-Z]\w*)/gm)].map((m) => m[1]);
    expect(exportats).toEqual([nom]);
    expect(entrades.find((e) => e.nom === nom)).toEqual({ nom, fitxer: fitxer.replace('src/components/', ''), estat: 'viu', fora: false });
    expect(importats.has(nom)).toBe(true);
    expect(llig(`${CAT}/detalls/${especimen}.jsx`)).toMatch(new RegExp(`<${nom}\\b`));
  });

  test('la façana les exporta', () => {
    const facana = llig(`${PS}/index.js`);
    for (const [nom, fitxer] of PECES) {
      expect(facana).toContain(`export { ${nom} } from './${fitxer.replace(`${PS}/`, '')}';`);
    }
  });
});

/* Revisió del front «nucli» (261004) · La guarda «les apps hi entren per la
   façana» aplicava la regex a una cadena fixa: verda siga quin siga el codi.
   Ara recorre el codi de veres de src/apps (sense les proves): cap app munta
   la traducció de pàgina, la Pàgina Universal ni la telemetria, i tota
   UniversalCard d'una app porta el Connectar sense telemetria. */
describe('les apps, pel seu codi de veres', () => {
  /* Verificació del front «autoria» (261004) · La llista vetada cobrix també
     el client del servei de traducció (data/traductor), els mòduls de la
     traducció de pàgina (components/universal/traduccio/), el hook de les
     accions importat directament des d'una app (PedraSeca/hooks/useAccions:
     crida registraEsdeveniment; les apps el reben, si de cas, dins de les
     peces de la façana) i el comptador de rutes (hooks/RouteTelemetria). */
  const VETATS = new RegExp([
    'useTraduccioPagina|UniversalPage|PageFrame|UniversalEditorShell|data', '\\/telemetria',
    '|data\\/tradu', 'ctor|universal\\/tradu', 'ccio|hooks\\/useAcc', 'ions|RouteTele', 'metria'
  ].join(''));
  const SENSE_TELEMETRIA = 'SENSE_TELEMETRIA = Object.freeze({ comptar: false })';
  const AMB_SENSE_TELEMETRIA = 'telemetria={SENSE_TELEMETRIA}';
  /* El recompte de targetes i de Connectars sense telemetria es fa sobre el
     codi sense comentaris (de bloc, de JSX i de línia): un comentari que diu
     telemetria={SENSE_TELEMETRIA} no compensa una targeta que no la porta. */
  const nomesCodi = (codi) => codi.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"\\])\/\/.*$/gm, '$1');

  /* Tots els fitxers de codi d'un directori, recursivament, sense les proves. */
  function codiDe(dir) {
    return readdirSync(path.join(ARREL, dir), { withFileTypes: true }).flatMap((entrada) => {
      const ruta = `${dir}/${entrada.name}`;
      if (entrada.isDirectory()) return codiDe(ruta);
      return /\.jsx?$/.test(entrada.name) && !/\.test\.jsx?$/.test(entrada.name) ? [ruta] : [];
    });
  }
  /* Els especificadors d'importació, estàtics, dinàmics i de reexportació. */
  const especificadors = (codi) => [...codi.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)['"]([^'"]+)['"]/g)].map((m) => m[1]);

  /* Les infraccions d'un fitxer: un especificador vetat, o més UniversalCard que Connectars sense telemetria. */
  function infraccionsDe(ruta, codi) {
    const vetats = especificadors(codi).filter((e) => VETATS.test(e)).map((e) => `${ruta}: import ${e}`);
    const net = nomesCodi(codi);
    const targetes = (net.match(/<UniversalCard\b/g) || []).length;
    if (targetes === 0) return vetats;
    const senseTelemetria = net.split(AMB_SENSE_TELEMETRIA).length - 1;
    const definida = net.includes(SENSE_TELEMETRIA);
    return senseTelemetria >= targetes && definida
      ? vetats
      : [...vetats, `${ruta}: ${targetes} UniversalCard, ${senseTelemetria} sense telemetria${definida ? '' : ' (SENSE_TELEMETRIA no definida)'}`];
  }

  const APPS = codiDe('src/apps');

  /* Gauntlet 261016 · El flux de Notícies del Lector ja no munta UniversalCard
     (llegix sobre l'espai de treball); la del Lector que queda és la de «Les que
     seguixes», a vistes/comunes.jsx. Les peces continuen sent tres. */
  test('el recorregut troba el codi de veres: les apps i les tres peces que munten UniversalCard', () => {
    expect(APPS.length).toBeGreaterThan(20);
    expect(APPS.filter((ruta) => ruta.includes('.test.'))).toEqual([]);
    const ambTargeta = APPS.filter((ruta) => /<UniversalCard\b/.test(llig(ruta)));
    expect(ambTargeta).toEqual(expect.arrayContaining([
      'src/apps/lector/vistes/comunes.jsx', 'src/apps/nevera/vistes/Temporada.jsx', 'src/apps/comu/esquelet/ColumnaCataleg.jsx'
    ]));
  });

  test('cap app importa la traducció de pàgina, la Pàgina Universal ni la telemetria; tota UniversalCard, sense telemetria', () => {
    expect(APPS.flatMap((ruta) => infraccionsDe(ruta, llig(ruta)))).toEqual([]);
  });

  test('la guarda detecta (casos sintètics en memòria)', () => {
    const VISTA = 'src/apps/sonda/vistes/Vista.jsx';
    const t = (...trossos) => trossos.join('');
    expect(infraccionsDe(VISTA, t("import { PageFrame } from '../../../components/universal/Page", "Frame.jsx';")))
      .toEqual([t(VISTA, ': import ../../../components/universal/Page', 'Frame.jsx')]);
    expect(infraccionsDe(VISTA, t("const m = await import('../../../data/tele", "metria.js');"))).toHaveLength(1);
    expect(infraccionsDe(VISTA, t("export { registraVisita } from '../../../data/tele", "metria.js';"))).toHaveLength(1);
    expect(infraccionsDe(VISTA, "import { UniversalCard } from '../../../components/PedraSeca/index.js';\nconst V = () => <UniversalCard title=\"x\" />;"))
      .toEqual([`${VISTA}: 1 UniversalCard, 0 sense telemetria (SENSE_TELEMETRIA no definida)`]);
    const ambUna = `const ${SENSE_TELEMETRIA};\nconst V = () => <><UniversalCard ${AMB_SENSE_TELEMETRIA} /><UniversalCard title="y" /></>;`;
    expect(infraccionsDe(VISTA, ambUna)).toEqual([`${VISTA}: 2 UniversalCard, 1 sense telemetria`]);
    /* La façana no és cap especificador vetat. */
    expect(infraccionsDe(VISTA, "import { PaginaApp } from '../../../components/PedraSeca/index.js';")).toEqual([]);
  });

  /* Verificació del front «autoria» (261004) · Un cas sintètic per a cada
     veto nou i per al recompte sense comentaris. */
  test('la guarda detecta el traductor, la traducció de pàgina, useAccions directe i RouteTelemetria', () => {
    const VISTA = 'src/apps/sonda/vistes/Vista.jsx';
    const t = (...trossos) => trossos.join('');
    expect(infraccionsDe(VISTA, t("import { tradueix } from '../../../data/tradu", "ctor.js';")))
      .toEqual([t(VISTA, ': import ../../../data/tradu', 'ctor.js')]);
    expect(infraccionsDe(VISTA, t("import { AvisTraduccio } from '../../../components/universal/tradu", "ccio/TraduccioPagina.jsx';")))
      .toEqual([t(VISTA, ': import ../../../components/universal/tradu', 'ccio/TraduccioPagina.jsx')]);
    expect(infraccionsDe(VISTA, t("const { tradueixBlocs } = await import('../../../components/universal/tradu", "ccio/blocs.js');"))).toHaveLength(1);
    expect(infraccionsDe(VISTA, t("import { useAccions } from '../../../components/PedraSeca/hooks/useAcc", "ions.js';")))
      .toEqual([t(VISTA, ': import ../../../components/PedraSeca/hooks/useAcc', 'ions.js')]);
    expect(infraccionsDe(VISTA, t("import { RouteTele", "metria } from '../../../hooks/RouteTele", "metria';")))
      .toEqual([t(VISTA, ': import ../../../hooks/RouteTele', 'metria')]);
    expect(infraccionsDe(VISTA, t("export { RouteTele", "metria } from '../../../hooks/RouteTele", "metria.jsx';"))).toHaveLength(1);
    /* El mateix nom en un comentari o en un text no és cap import. */
    expect(infraccionsDe(VISTA, t('/* Sense tradu', 'ctor ni RouteTele', "metria: la plataforma ho fa. */\nconst x = 'hooks/useAcc", "ions';"))).toEqual([]);
  });

  test('un telemetria={SENSE_TELEMETRIA} dins d’un comentari no compta (de bloc, de JSX ni de línia)', () => {
    const VISTA = 'src/apps/sonda/vistes/Vista.jsx';
    const definida = `const ${SENSE_TELEMETRIA};\n`;
    const senseRes = `${definida}const V = () => <UniversalCard title="x" />;`;
    const esperat = [`${VISTA}: 1 UniversalCard, 0 sense telemetria`];
    expect(infraccionsDe(VISTA, `/* ${AMB_SENSE_TELEMETRIA} */\n${senseRes}`)).toEqual(esperat);
    expect(infraccionsDe(VISTA, `${definida}const V = () => <>{/* ${AMB_SENSE_TELEMETRIA} */}<UniversalCard title="x" /></>;`)).toEqual(esperat);
    expect(infraccionsDe(VISTA, `// ${AMB_SENSE_TELEMETRIA}\n${senseRes}`)).toEqual(esperat);
    expect(infraccionsDe(VISTA, `${senseRes} // ${AMB_SENSE_TELEMETRIA}`)).toEqual(esperat);
    // Una definició comentada tampoc no compta.
    expect(infraccionsDe(VISTA, `/* const ${SENSE_TELEMETRIA}; */\nconst V = () => <UniversalCard ${AMB_SENSE_TELEMETRIA} />;`))
      .toEqual([`${VISTA}: 1 UniversalCard, 1 sense telemetria (SENSE_TELEMETRIA no definida)`]);
    // Una targeta comentada no és cap targeta; una URL en una cadena no és cap comentari.
    expect(infraccionsDe(VISTA, `${definida}/* <UniversalCard title="vella" /> */\nconst u = 'https://exemple.test';\nconst V = () => <UniversalCard ${AMB_SENSE_TELEMETRIA} />;`)).toEqual([]);
  });
});

/* Front «autoria» (261004) · ESLint amb zero missatges als fitxers que toca:
   la boina per id remot, l'acte de la llavor, les barres de PublicacioDetall i
   DetallEspai, i les seues proves. */
describe('ESLint del front «autoria»', () => {
  const AUTORIA = [
    'src/config/navigation.js', 'src/config/navigation.autoria.test.js',
    'src/hooks/useEntitatDelProjecte.js',
    'src/sections/mur/TargetaDelMur.jsx', 'src/sections/mur/TargetaDelMur.autoria.test.jsx',
    'src/sections/mur/TargetaDelMur.remot.test.jsx', 'src/sections/mur/eventsSeed.js',
    'src/sections/notes/PublicacioDetall.jsx', 'src/sections/notes/PublicacioDetall.boina.test.jsx',
    'src/sections/profile/DetallEspai.jsx', 'src/sections/profile/DetallEspai.boina.test.jsx',
    `${ORG}/blocAutoria.selectors.test.jsx`, `${PS}/qualitat.nucliApps.test.js`
  ];

  test('zero missatges, avisos inclosos', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles(AUTORIA.map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(AUTORIA.length);
    expect(missatges).toEqual([]);
  }, 120000);
});

/* Front «barra-autoria» (verificació, 261004) · ESLint amb zero missatges als
   fitxers que toca: la via d'excepció només per prop, el disparador únic de
   l'entitat del projecte a nivell d'app, l'Aplec declarat i les seues proves. */
describe('ESLint del front «barra-autoria»', () => {
  const BARRA_AUTORIA = [
    'src/app/App.jsx', 'src/app/App.entitatDelProjecte.test.jsx',
    'src/components/universal/UniversalPage.jsx', 'src/components/universal/PageFrame.jsx',
    'src/components/universal/PageFrame.barraTaronja.test.jsx', 'src/components/universal/PageFrame.capes.test.js',
    'src/sections/admin/AdminSection.barraTaronja.test.jsx', 'src/css/pantallaCompleta.capes.test.js',
    'src/sections/mur/eventsSeed.js', 'src/sections/mur/eventsSeed.test.js'
  ];

  test('zero missatges, avisos inclosos', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles(BARRA_AUTORIA.map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(BARRA_AUTORIA.length);
    expect(missatges).toEqual([]);
  }, 120000);
});

/* Front «autoria» (261004) · El bloc propi de modules.css: la targeta plana
   ocupa la columna de la llista i el sobreposat amb acció secundària no obri
   el menú de l'enllaç en la pulsació llarga. */
describe('el bloc CSS del front «autoria» de modules.css', () => {
  const MODULES = llig('src/css/modules.css');
  const inici = MODULES.indexOf('Front «autoria».');
  const bloc = inici < 0 ? '' : MODULES.slice(MODULES.indexOf('@layer components {', inici), MODULES.indexOf('\n}\n', inici) + 2);

  test('viu dins de @layer components i definix les dues regles', () => {
    expect(inici).toBeGreaterThan(-1);
    expect(bloc.startsWith('@layer components {')).toBe(true);
    expect(bloc).toMatch(/\.sdp-card-llista > \.sp-card \{\s*max-width: none;\s*\}/);
    expect(bloc).toMatch(/\.sp-card-link-overlay\[aria-keyshortcuts\] \{\s*touch-action: manipulation;\s*-webkit-user-select: none;\s*user-select: none;\s*-webkit-touch-callout: none;\s*\}/);
  });

  test('només tokens: cap color cru, cap :has(), cap px', () => {
    const net = senseComentaris(bloc);
    expect(net.length).toBeGreaterThan(0);
    expect(/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch)\(/.test(net)).toBe(false);
    expect(new RegExp([':ha', 's\\('].join('')).test(net)).toBe(false);
    expect(/\d+px/.test(net)).toBe(false);
  });
});
