/** Porta executable del torn «Enxufe universal» (torn_ad8ad186, 260929).
 *  El hook del projecte no deixa executar `npm run lint` ni cap escombrada amb
 *  grep: ací es linten amb l'API d'ESLint (mateixa configuració que `npm run
 *  lint`, zero avisos) tots els fitxers .js/.jsx/.mjs que el torn ha tocat o
 *  afegit sota src/ i tests/, més vite.standalone.config.js, i es comproven com
 *  a text tres regles més:
 *   · tota classe nova de la marca de l'amfitrió (MarcaAmfitrio.jsx, App.jsx)
 *     té una regla als fulls canònics de src/css;
 *   · la clau i18n `amfitrio.servidor` és als cinc diccionaris de
 *     src/config/idiomes/ (Fase D, 261020, tasca 4.1 · L1: abans, cinc blocs
 *     de src/config/i18n.js);
 *   · cap fitxer del torn porta en cru caràcters de control, invisibles ni de
 *     control bidi (el conjunt es construïx amb String.fromCodePoint: ací no
 *     n'hi ha cap en cru).
 *  La llista de fitxers es va derivar de `git status --short` el 260929 (M i ??
 *  amb extensió .js/.jsx/.mjs sota src/ i tests/, i vite.standalone.config.js);
 *  src/data/wikiManifest.js queda fora perquè és generat. Onada R30 ·
 *  A3-ENX-01 · L'escombrada de caràcters val també per a tot l'abast (amb una
 *  sola excepció, l'unidor dels emojis); la prova de diagnòstic que mirava git
 *  i avisava de tot fitxer tocat fora de la llista, net o no, s'ha retirat.
 *  Cap import relatiu: tot es resol des de l'arrel del repositori. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const llig = (ruta) => fs.readFileSync(path.join(ARREL, ruta), 'utf8');
const existix = (ruta) => fs.existsSync(path.join(ARREL, ruta));

/* ─────────────────────────── Fitxers del torn ─────────────────────────── */

/* `git status --short` · M */
const MODIFICATS_JS = [
  'src/PedraSecaEmbed.jsx',
  'src/app/App.jsx',
  'src/app/App.test.jsx',
  'src/app/contexts/RouterContext.jsx',
  'src/components/PedraSeca/atoms/Avatar.xat.test.jsx',
  'src/components/PedraSeca/hooks/useAccions.js',
  'src/components/PedraSeca/hooks/useAccions.test.jsx',
  'src/components/universal/DocumentEditor.test.jsx',
  'src/components/universal/TargetaViva.jsx',
  'src/components/universal/UniversalEditorShell.autodesament.test.jsx',
  'src/components/universal/UniversalPage.jsx',
  'src/components/universal/UniversalUtils.js',
  'src/components/universal/editorial.test.js',
  'src/config/assetResolver.js',
  'src/config/backendConfig.js',
  'src/config/dataMode.session.test.js',
  'src/config/dataMode.test.js',
  'src/config/hostAdapter.test.js',
  'src/config/i18n.claus.test.js',
  'src/config/i18n.js',
  'src/data/sessionService.js',
  'src/data/sessionService.test.js',
  'src/data/telemetria.js',
  'src/embed.jsx',
  'src/hooks/RouteTelemetria.jsx',
  'src/hooks/RouteTelemetria.test.jsx',
  'src/hooks/seoHead.js',
  'src/hooks/useSEO.js',
  'src/hooks/useSEO.test.jsx',
  'src/host.js',
  'src/sections/connectar/ConnectarSection.jsx',
  'src/sections/consola/peces.jsx',
  'src/sections/detail/ItemDetailSection.jsx',
  'src/sections/detail/ItemDetailSection.test.jsx',
  'src/sections/detail/detailRichText.jsx',
  'src/sections/dispositius/DevicesSection.jsx',
  'src/sections/disseny/DesignSection.jsx',
  'src/sections/disseny/cataleg/detalls/EspecimenShell.jsx',
  'src/sections/mercat/MercatSection.jsx',
  'src/sections/multimedia/MultimediaSection.jsx',
  'src/sections/mur/MurContext.test.jsx',
  'src/sections/mur/articles/Aplec2023Article.jsx',
  'src/sections/notes/ConnexioDetall.jsx',
  'src/sections/notes/NotesContext.jsx',
  'src/sections/onboarding/OnboardingSection.jsx',
  'src/sections/onboarding/OnboardingSection.test.jsx',
  'src/sections/profile/PerfilContext.test.jsx',
  'src/sections/profile/PerfilEditor.autodesament.test.jsx',
  'src/sections/profile/PerfilShell.targetaViva.test.jsx',
  'src/sections/profile/autodesament.lentc.perfil.test.jsx',
  'src/sections/text/TextSection.jsx',
  'src/sections/wiki-de-poble/WikiDePobleSection.jsx',
  'src/sections/wiki-de-poble/WikiDePobleSection.navegacio.test.jsx',
  'src/sections/wiki-de-poble/WikiDePobleSection.test.jsx',
  'src/sections/xat/XatContext.ambit.test.jsx',
  'src/sections/xat/XatContext.test.jsx',
  'src/sections/xat/XatControlSection.jsx',
  'src/sections/xat/XatSection.jsx',
  'src/sections/xat/XatSection.test.jsx',
  'tests/enxufe-empaqueta.test.mjs',
  'tests/enxufe-pantalla.test.mjs',
  'tests/enxufe-plugin.test.mjs',
  'vite.standalone.config.js'
];

/* `git status --short` · ?? */
const NOUS_JS = [
  'src/PedraSecaEmbed.config.test.jsx',
  'src/PedraSecaEmbed.router.test.jsx',
  'src/app/contexts/RouterContext.embed.test.jsx',
  'src/app/contexts/politicaRouter.js',
  'src/app/contexts/politicaRouter.test.js',
  'src/app/enllacosInterns.js',
  'src/app/enllacosInterns.test.js',
  'src/components/universal/MarcaAmfitrio.capes.test.js',
  'src/components/universal/MarcaAmfitrio.jsx',
  'src/components/universal/UniversalPage.memoria.test.jsx',
  'src/config/assetResolver.test.js',
  'src/config/configAmfitrio.js',
  'src/config/configAmfitrio.test.js',
  'tests/standalone-build.test.mjs',
  'tests/lint_enxufe.test.mjs'
];

/* Generat per la compilació de la Wiki: no es linta ni s'escombra. */
const GENERATS = new Set(['src/data/wikiManifest.js']);

const JS_TORN = [...MODIFICATS_JS, ...NOUS_JS];

/* La resta de fitxers de text del torn (fulls, adaptador de WordPress, banc
   manual i contracte de l'amfitrió): entren a l'escombrada de caràcters. */
const ALTRES_TEXT_TORN = [
  'src/css/modules.css',
  'src/css/tokens.css',
  'wordpress-plugin/socdepoble-enxufe.php',
  'wordpress-plugin/templates/pantalla-completa.php',
  'tests/manual/enxufe-amfitrio.html',
  '_wiki_de_poble/02_saber/estandard_integracio_react.md'
];
const TEXT_TORN = [...JS_TORN, ...ALTRES_TEXT_TORN];

test('tots els fitxers del torn existixen i cap és generat', () => {
  assert.deepEqual(TEXT_TORN.filter((f) => !existix(f)), []);
  assert.deepEqual(JS_TORN.filter((f) => GENERATS.has(f)), []);
  assert.equal(new Set(JS_TORN).size, JS_TORN.length, 'la llista porta duplicats');
});

/* L'abast del torn: els .js/.jsx/.mjs de src/ i tests/, i
   vite.standalone.config.js, sense el manifest generat. Onada R30 · A3-ENX-01 ·
   L'escombrada de caràcters el recorre sencer (al final del fitxer). Abans, una
   prova de diagnòstic hi posava en TODO tot fitxer que git veia tocat i la llista
   no nomenava: soroll de qualsevol torn posterior, sense cap criteri. */
const DINS_DE_LABAST = (ruta) => (/^(src|tests)\/.+\.(js|jsx|mjs)$/.test(ruta) || ruta === 'vite.standalone.config.js') && !GENERATS.has(ruta);
const DIRECTORIS_FORA = new Set(['node_modules', 'dist', 'dist-natiu', 'coverage', '.git', 'android', 'ios']);

/** Tots els fitxers de l'abast que hi ha al disc (també els que git encara no
 *  coneix), en camins relatius a l'arrel i ordenats. */
function fitxersDeLAbast() {
  const eixida = existix('vite.standalone.config.js') ? ['vite.standalone.config.js'] : [];
  const camina = (dir) => {
    if (!existix(dir)) return;
    for (const e of fs.readdirSync(path.join(ARREL, dir), { withFileTypes: true })) {
      const ruta = `${dir}/${e.name}`;
      if (e.isDirectory()) { if (!DIRECTORIS_FORA.has(e.name)) camina(ruta); }
      else if (e.isFile() && DINS_DE_LABAST(ruta)) eixida.push(ruta);
    }
  };
  camina('src');
  camina('tests');
  return eixida.sort();
}

/* ─────────────────────────────── ESLint ─────────────────────────────── */

async function linta(fitxers) {
  const eslint = new ESLint({ cwd: ARREL });
  const resultats = await eslint.lintFiles(fitxers.map((f) => path.join(ARREL, f)));
  const missatges = [];
  for (const r of resultats) {
    for (const m of r.messages) {
      missatges.push(`${path.relative(ARREL, r.filePath)}:${m.line}:${m.column} [${m.ruleId || `severitat ${m.severity}`}] ${m.message}`);
    }
  }
  return { missatges, linats: resultats.length };
}

test('ESLint: zero missatges (avisos inclosos) als fitxers .js/.jsx/.mjs del torn', async () => {
  const { missatges, linats } = await linta(JS_TORN);
  assert.equal(linats, JS_TORN.length, 'ESLint no ha linat tots els fitxers del torn');
  assert.deepEqual(missatges, [], `ESLint ha trobat ${missatges.length} missatge(s):\n${missatges.join('\n')}`);
});

/* ─────────────────────────── Classes ↔ CSS ─────────────────────────── */

const senseComentarisCss = (text) => text.replace(/\/\*[\s\S]*?\*\//g, (bloc) => bloc.replace(/[^\n]/g, ' '));

/* Els fulls canònics: tot src/css/*.css. */
const CSS_CANONIC = fs.readdirSync(path.join(ARREL, 'src/css'))
  .filter((f) => f.endsWith('.css'))
  .sort()
  .map((f) => `src/css/${f}`);

const ES_CLASSE = /^-?[_a-zA-Z][_a-zA-Z0-9-]*$/;

/** Classes que un JSX posa a `className`: literals i totes les cadenes de
 *  l'expressió (també les de dins d'un `${…}`), sense les interpolacions. */
function classesDeJsx(text) {
  const classes = new Set();
  const afig = (cadena) => cadena.split(/\s+/).filter((c) => ES_CLASSE.test(c)).forEach((c) => classes.add(c));
  for (const m of text.matchAll(/className="([^"]*)"/g)) afig(m[1]);
  for (const m of text.matchAll(/className='([^']*)'/g)) afig(m[1]);
  const obertura = 'className={';
  let i = text.indexOf(obertura);
  while (i >= 0) {
    const inici = i + obertura.length;
    let j = inici;
    let fondaria = 1;
    while (j < text.length && fondaria > 0) {
      if (text[j] === '{') fondaria += 1;
      else if (text[j] === '}') fondaria -= 1;
      j += 1;
    }
    const expressio = text.slice(inici, j - 1);
    for (const m of expressio.matchAll(/'([^'\n]*)'|"([^"\n]*)"/g)) afig(m[1] ?? m[2]);
    for (const m of expressio.matchAll(/`([^`]*)`/g)) afig(m[1].replace(/\$\{[^}]*\}/g, ' '));
    i = text.indexOf(obertura, j);
  }
  return classes;
}

/** classe → primer full:línia on un selector de regla (fora de comentaris i
 *  d'at-rules) la nomena. */
function classesAmbRegla(fulls) {
  const amb = new Map();
  for (const f of fulls) {
    const text = senseComentarisCss(llig(f));
    let preludi = '';
    let linia = 1;
    let liniaPreludi = 1;
    for (const c of text) {
      if (c === '\n') linia += 1;
      if (c === '{') {
        const selector = preludi.trim();
        if (selector && !selector.startsWith('@')) {
          for (const m of selector.matchAll(/\.(-?[_a-zA-Z][_a-zA-Z0-9-]*)/g)) {
            if (!amb.has(m[1])) amb.set(m[1], `${f}:${liniaPreludi}`);
          }
        }
        preludi = '';
      } else if (c === '}' || c === ';') {
        preludi = '';
      } else {
        if (!preludi.trim() && c.trim()) liniaPreludi = linia;
        preludi += c;
      }
    }
  }
  return amb;
}

const MARCA = 'src/components/universal/MarcaAmfitrio.jsx';
const APP = 'src/app/App.jsx';
const ESPECIMEN = 'src/sections/disseny/cataleg/detalls/EspecimenShell.jsx';

test('la marca de l’amfitrió: tota classe de MarcaAmfitrio.jsx i tota sdp-amfitrio-* d’App.jsx i del catàleg té regla a src/css', () => {
  const regles = classesAmbRegla(CSS_CANONIC);
  const deLaMarca = [...classesDeJsx(llig(MARCA))];
  /* T7-T8 (261001): la franja del node és un enllaç (pilot, frase, text per al
     lector i fletxa) i una X germana. */
  assert.deepEqual([...deLaMarca].sort(), [
    'sdp-amfitrio-franja', 'sdp-amfitrio-franja__enllac', 'sdp-amfitrio-franja__tanca',
    'sdp-amfitrio-franja__text', 'sdp-amfitrio-titol', 'sr-only'
  ], 'MarcaAmfitrio.jsx ha canviat de classes: revisa esta prova');
  const familia = [APP, ESPECIMEN].flatMap((f) => [...classesDeJsx(llig(f))].filter((c) => c.startsWith('sdp-amfitrio')));
  const noves = [...new Set([...deLaMarca, ...familia])].sort();
  const orfes = noves.filter((c) => !regles.has(c));
  assert.deepEqual(orfes, [], `Classes sense regla a src/css: ${orfes.join(', ')}`);
});

/* Les classes que App.jsx té ara i no tenia a HEAD: les noves del torn. Sense
   git (o sense HEAD) es salta; després del commit el conjunt és buit. */
function classesDeHead(ruta) {
  try {
    return classesDeJsx(execFileSync('git', ['show', `HEAD:${ruta}`], { cwd: ARREL, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
  } catch {
    return null;
  }
}

test('App.jsx: tota classe nova respecte de HEAD té regla a src/css', (t) => {
  const abans = classesDeHead(APP);
  if (abans === null) { t.skip('git o HEAD no disponibles'); return; }
  const regles = classesAmbRegla(CSS_CANONIC);
  const noves = [...classesDeJsx(llig(APP))].filter((c) => !abans.has(c)).sort();
  t.diagnostic(`classes noves a App.jsx: ${noves.length ? noves.join(', ') : 'cap'}`);
  assert.deepEqual(noves.filter((c) => !regles.has(c)), []);
});

test('App.jsx: classes heretades sense regla a src/css (diagnòstic)', (t) => {
  const regles = classesAmbRegla(CSS_CANONIC);
  const orfes = [...classesDeJsx(llig(APP))].filter((c) => !regles.has(c)).sort();
  if (orfes.length) {
    t.todo(`${orfes.length} classe(s) d’App.jsx sense regla a src/css`);
    for (const c of orfes) t.diagnostic(c);
  }
  assert.deepEqual(orfes, []);
});

/* La marca només pinta amb crom i tokens declarats, sense style= al JSX. */
test('les regles SDP:amfitrio usen tokens declarats, color només de --sdp-crom-*, cap hex/rgb, cap font-size en px menor de 16, i cap style= a la marca', () => {
  const declarats = new Set();
  for (const f of ['src/css/tokens.css', 'src/css/design-tokens.css']) {
    for (const m of llig(f).matchAll(/(--sdp-[a-z0-9-]+)\s*:/g)) declarats.add(m[1]);
  }
  const text = senseComentarisCss(llig('src/css/modules.css'));
  const blocs = [];
  const re = /([^{};]*\.sdp-amfitrio[^{};]*)\{([^{}]*)\}/g;
  for (const m of text.matchAll(re)) blocs.push({ selector: m[1].trim(), cos: m[2] });
  assert.ok(blocs.length >= 3, `Esperava les regles .sdp-amfitrio-* a modules.css, n’he trobat ${blocs.length}`);
  const dolentes = [];
  for (const { selector, cos } of blocs) {
    for (const v of cos.matchAll(/var\((--sdp-[a-z0-9-]+)/g)) if (!declarats.has(v[1])) dolentes.push(`${selector}: ${v[1]} no declarat`);
    if (/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/.test(cos)) dolentes.push(`${selector}: color en brut`);
    /* Només les propietats que porten color (border-radius no n'és cap). */
    for (const d of cos.matchAll(/(?:^|;)\s*(color|background(?:-color)?|outline(?:-color)?|border(?:-(?:top|right|bottom|left|block|inline)(?:-(?:start|end))?)?(?:-color)?)\s*:\s*([^;]+)/g)) {
      for (const v of d[2].matchAll(/var\((--sdp-[a-z0-9-]+)/g)) if (!v[1].startsWith('--sdp-crom-')) dolentes.push(`${selector} ${d[1]}: ${v[1]} no és crom`);
    }
    for (const f of cos.matchAll(/font-size\s*:\s*([0-9.]+)px/g)) if (Number(f[1]) < 16) dolentes.push(`${selector}: font-size ${f[1]}px`);
  }
  assert.deepEqual(dolentes, []);
  /* Usos, no mencions: la capçalera del fitxer diu «mai innerHTML». */
  assert.doesNotMatch(llig(MARCA), /\sstyle=/);
  assert.doesNotMatch(llig(MARCA), /dangerouslySetInnerHTML\s*=|\.innerHTML\b/);
});

/* ─────────────────────────────── i18n ─────────────────────────────── */

const LLENGUES = ['ca', 'es', 'en', 'eu', 'gl'];
/* T7 (261001): la franja diu l'estat del node amb una frase per estat (les
   tres porten {nom}) i dos noms accessibles. amfitrio.servidor s'ha retirat. */
const CLAUS_AMB_NOM = ['amfitrio.node', 'amfitrio.nodeConnectant', 'amfitrio.nodeSenseConnexio'];
const CLAUS_SENSE_NOM = ['amfitrio.mesInfo', 'amfitrio.tanca'];
const FAMILIA = [...CLAUS_AMB_NOM, ...CLAUS_SENSE_NOM].sort();

/** Per llengua: clau `amfitrio.*` → valors (més d'un vol dir duplicada).
 *  Fase D (261020, tasca 4.1) · L1 · Cada llengua es llig del seu diccionari,
 *  src/config/idiomes/<codi>.js; un fitxer absent tomba la prova. */
function valorsAmfitrio() {
  const resultat = {};
  for (const l of LLENGUES) {
    const ruta = `src/config/idiomes/${l}.js`;
    assert.ok(existix(ruta), `No trobe el diccionari ${l} (${ruta})`);
    const valors = new Map();
    for (const m of llig(ruta).matchAll(/^\s*'(amfitrio\.[^']+)'\s*:\s*(['"])(.*)\2,?\s*$/gm)) {
      valors.set(m[1], [...(valors.get(m[1]) || []), m[3]]);
    }
    resultat[l] = valors;
  }
  return resultat;
}

test('i18n: la família amfitrio.* existix una sola vegada a cada un dels cinc blocs; les frases porten {nom} una vegada', () => {
  const per = valorsAmfitrio();
  const referencia = [...per.ca.keys()].sort();
  assert.deepEqual(referencia, FAMILIA, 'La família amfitrio.* en ca ha canviat: revisa esta prova');
  for (const l of LLENGUES) {
    assert.deepEqual([...per[l].keys()].sort(), referencia, `Llengua ${l}: claus amfitrio.* diferents de ca`);
    for (const clau of FAMILIA) {
      const valors = per[l].get(clau);
      assert.equal(valors.length, 1, `Llengua ${l}: ${clau} duplicada`);
      const [valor] = valors;
      const esperat = CLAUS_AMB_NOM.includes(clau) ? 1 : 0;
      assert.equal(valor.split('{nom}').length - 1, esperat, `Llengua ${l}: «${valor}» ha de portar {nom} ${esperat} vegada(es)`);
      assert.ok(valor.replace('{nom}', '').trim().length > 0, `Llengua ${l}: ${clau} buida`);
    }
  }
});

test('i18n: MarcaAmfitrio.jsx demana cada clau de la família i la seua reserva és el valor en ca', () => {
  const marca = llig(MARCA);
  const ca = valorsAmfitrio().ca;
  for (const clau of FAMILIA) {
    const crida = marca.match(new RegExp(`t\\('${clau.replace('.', '\\.')}', '([^']*)'\\)`));
    assert.ok(crida, `MarcaAmfitrio.jsx no demana t('${clau}', …) amb reserva literal`);
    assert.equal(crida[1], ca.get(clau)[0], `${clau}: la reserva no és el valor en ca`);
  }
});

/* ───────────────────── Caràcters invisibles i bidi ───────────────────── */

/* Control C0 (menys tabulació i salt de línia), DEL i C1, la marca de lletra
   àrab, els amples zero i marques de direcció, els embeddings/overrides bidi,
   el word joiner i els isolats bidi, i el BOM. */
const RANGS_VETATS = Object.freeze([
  [0x0000, 0x0008],
  [0x000B, 0x001F],
  [0x007F, 0x009F],
  [0x061C, 0x061C],
  [0x200B, 0x200F],
  [0x202A, 0x202E],
  [0x2060, 0x2069],
  [0xFEFF, 0xFEFF]
]);
const car = (cp) => String.fromCodePoint(cp);
const RE_VETAT = new RegExp(`[${RANGS_VETATS.map(([a, b]) => (a === b ? car(a) : `${car(a)}-${car(b)}`)).join('')}]`, 'gu');
const hex = (cp) => `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`;

function vetatsDe(text) {
  const trobats = [];
  text.split('\n').forEach((linia, i) => {
    for (const m of linia.matchAll(RE_VETAT)) trobats.push({ linia: i + 1, columna: m.index + 1, cp: m[0].codePointAt(0) });
  });
  return trobats;
}

test('el detector reconeix cada vora dels rangs vetats i deixa passar les veïnes', () => {
  for (const [a, b] of RANGS_VETATS) {
    for (const cp of new Set([a, b])) {
      assert.deepEqual(vetatsDe(`x${car(cp)}y`).map((t) => t.cp), [cp], `${hex(cp)} no s’ha detectat`);
    }
  }
  const permesos = [0x0009, 0x000A, 0x0020, 0x00A0, 0x00AD, 0x061B, 0x061D, 0x200A, 0x2010, 0x2028, 0x2029, 0x202F, 0x205F, 0x206A, 0xFEFE, 0xFF01, 0x1F600];
  for (const cp of permesos) {
    assert.deepEqual(vetatsDe(`x${car(cp)}y`), [], `${hex(cp)} no hauria de ser vetat`);
  }
  // Un retorn de carro (CRLF) cau dins de U+000B–U+001F i es detecta.
  assert.deepEqual(vetatsDe(`a${car(0x000D)}${car(0x000A)}b`).map((t) => t.cp), [0x000D]);
});

test('cap fitxer del torn porta en cru caràcters de control, invisibles ni bidi', () => {
  const trobats = [];
  for (const f of TEXT_TORN) {
    for (const t of vetatsDe(llig(f))) trobats.push(`${f}:${t.linia}:${t.columna} ${hex(t.cp)}`);
  }
  assert.deepEqual(trobats, []);
});

/* ─────────────────────── L'abast sencer, no sols el torn ─────────────────────── */

/* Onada R30 · A3-ENX-01 · El torn ad8ad186 es va tancar el 261001 i la seua
   llista és congelada. El diagnòstic que hi havia ací posava en TODO tot fitxer
   de l'abast que git veia tocat i la llista no nomenava: cada torn posterior amb
   l'arbre brut hi apareixia sencer (117 fitxers a R29, 119 en la rèplica de
   l'arbre de R29), nets o no, i la xifra es llegia com a deute de l'enxufe.
   N'eren zero: només era una llista vella contra git. El criteri de la llista
   que encara no cobria ningú és este, i ara val per a tot l'abast: cap fitxer
   porta en cru caràcters de control, invisibles ni bidi (Trojan Source,
   CVE-2021-42574). On calen, s'escriuen com a escapament \uXXXX dins de la
   cadena o del regex: el valor és el mateix i la revisió els veu (17 fitxers
   reescrits així el 261115, amb l'AST idèntic). L'única excepció és l'unidor
   U+200D quan enganxa una seqüència d'emoji (la família, les professions): entre
   dos pictogrames, o darrere d'un to de pell o del selector U+FE0F, és contingut.
   Fora d'eixe context, un U+200D parteix un identificador en dos d'invisibles
   (`esAdmin` i `esAdmin` + U+200D són dues variables: CVE-2021-42694), i entre dos
   escapaments (`\u{1F600}` + U+200D + `\u{1F600}`) la revisió no el veu; s'escriu
   com a \u200D, com ja feia src/services/veuIaiaService.js (set fitxers més
   s'hi han posat el 261116, amb l'AST idèntic). Pel mateix motiu, un selector
   de variació (U+FE00–U+FE0F) no pot anar enganxat a una lletra d'identificador
   ni a una xifra que no fa tecla (1 + U+FE0F + U+20E3, la tecla u, sí que és
   contingut); darrere d'un emoji, ho és. Límit conegut: U+2139, el signe
   d'informació, és pictograma i lletra alhora, i es deixa passar. La llista del
   torn, dalt, no en té cap.
   Onada R30 · A3-ENX-01 (segon àrbitre, P2) · L'unidor i el selector no són
   els únics invisibles que caben dins d'un identificador: també hi caben la
   resta de punts de codi que són alhora Default_Ignorable_Code_Point i
   ID_Continue. El més conegut és el farcit Hangul U+3164, que és ID_Start i fa
   sencera una variable invisible (`const { a, ` + U+3164 + ` } = req.query`,
   la porta del darrere que va publicar Certitude el 2021). Amb ell, U+115F,
   U+1160 i U+FFA0, el CGJ U+034F, les vocals inherents khmer U+17B4 i U+17B5,
   els selectors mongols U+180B–U+180D i U+180F, i el suplement de selectors
   U+E0100–U+E01EF. Fins ara passaven. No n'hi ha cap a l'arbre, i on calguen
   s'escriuen com a escapament. El conjunt es llig de les propietats Unicode
   del motor, i la prova del detector el fixa: si una versió d'Unicode el
   canvia, ho diu.
   ESLint amb zero avisos sobre tot l'abast ja és la porta «Linter» de
   run-portes.mjs (npm run lint), i no es duplica ací. */
const UNIDOR = 0x200D;
const UNIDOR_D_EMOJI = /(?<=[\p{Extended_Pictographic}\p{Emoji_Modifier}\uFE0F])\u200D(?=[\p{Extended_Pictographic}\p{Emoji_Component}])/gu;
const SELECTOR_EN_IDENTIFICADOR = /(?<=[\p{L}\p{Nl}\p{Mn}\p{Mc}\p{Pc}$])(?<!\u2139)[\uFE00-\uFE0F]|(?<=[0-9])[\uFE00-\uFE0F](?!\u20E3)/gu;
/* Els que ja miren RE_VETAT (U+200B–U+200F) i el selector amb context
   (U+FE00–U+FE0F) en queden fora. */
const INVISIBLE_D_IDENTIFICADOR = /(?![\u200B-\u200F])(?![\uFE00-\uFE0F])(?=\p{ID_Continue})\p{Default_Ignorable_Code_Point}/gu;

/** Els caràcters vetats de l'abast: els de la llista del torn, menys l'unidor
 *  quan és d'una seqüència d'emoji, més el selector de variació enganxat a un
 *  identificador i la resta d'invisibles que caben dins d'un identificador. */
function vetatsDeLAbast(text) {
  return text.split('\n').flatMap((linia, i) => {
    const unidorsDEmoji = new Set([...linia.matchAll(UNIDOR_D_EMOJI)].map((m) => m.index));
    const vetats = [...linia.matchAll(RE_VETAT)].filter((m) => !(m[0].codePointAt(0) === UNIDOR && unidorsDEmoji.has(m.index)));
    return [...vetats, ...linia.matchAll(SELECTOR_EN_IDENTIFICADOR), ...linia.matchAll(INVISIBLE_D_IDENTIFICADOR)]
      .sort((a, b) => a.index - b.index)
      .map((m) => ({ linia: i + 1, columna: m.index + 1, cp: m[0].codePointAt(0) }));
  });
}

test('l’unidor U+200D només passa dins d’una seqüència d’emoji, i el selector de variació no s’enganxa a cap identificador', () => {
  const cps = (text) => vetatsDeLAbast(text).map((t) => hex(t.cp));
  const ZWJ = '\u200D';
  const VS16 = '\uFE0F';
  /* Contingut: la família, la pagesa amb to de pell, l'ull dins del bocadillo
     (VS16 + ZWJ), la bandera de l'arc de Sant Martí, el pèl roig (component),
     la tecla u i el signe d'informació. */
  for (const emoji of [
    `\u{1F468}${ZWJ}\u{1F469}${ZWJ}\u{1F467}`,
    `\u{1F469}\u{1F3FD}${ZWJ}\u{1F33E}`,
    `\u{1F441}${VS16}${ZWJ}\u{1F5E8}${VS16}`,
    `\u{1F3F3}${VS16}${ZWJ}\u{1F308}`,
    `\u{1F9D1}${ZWJ}\u{1F9B0}`,
    `1${VS16}\u20E3`,
    `\u2139${VS16}`,
    `\u2764${VS16}`
  ]) assert.deepEqual(cps(`const e = '${emoji}';`), [], [...emoji].map((c) => hex(c.codePointAt(0))).join(' '));
  /* Identificadors invisibles i unidors que la revisió no veu. */
  assert.deepEqual(cps(`export const esAdmin = false; export const esAdmin${ZWJ} = true;`), ['U+200D']);
  assert.deepEqual(cps(`const parell = '\\u{1F600}${ZWJ}\\u{1F600}';`), ['U+200D'], 'entre dos escapaments');
  assert.deepEqual(cps(`a${ZWJ}${ZWJ}\u{1F600}`), ['U+200D', 'U+200D']);
  assert.deepEqual(cps(`\u{1F600}${ZWJ}${ZWJ}\u{1F600}`), ['U+200D'], 'el segon unidor no va darrere de cap pictograma');
  assert.deepEqual(cps(`export const esAdmin${VS16} = true;`), ['U+FE0F']);
  assert.deepEqual(cps(`let x_\uFE0E = 1, d1${VS16} = 2, és${VS16} = 3;`), ['U+FE0E', 'U+FE0F', 'U+FE0F']);
  assert.deepEqual(cps(`x${car(0x200B)}y`), ['U+200B'], 'la resta de vetats, com abans');
});

/* Onada R30 · A3-ENX-01 (segon àrbitre, P2) · Els invisibles que caben dins
   d'un identificador, més enllà de l'unidor i del selector. */
const RANGS_INVISIBLES_D_IDENTIFICADOR = Object.freeze([
  [0x034F, 0x034F],
  [0x115F, 0x1160],
  [0x17B4, 0x17B5],
  [0x180B, 0x180D],
  [0x180F, 0x180F],
  [0x3164, 0x3164],
  [0xFFA0, 0xFFA0],
  [0xE0100, 0xE01EF]
]);

test('cap invisible que càpia dins d’un identificador passa, i el conjunt és el que diuen les propietats Unicode', () => {
  const cps = (text) => vetatsDeLAbast(text).map((t) => hex(t.cp));
  const HANGUL = car(0x3164);
  /* La porta del darrere: una variable que no es veu, sola o enganxada. */
  assert.deepEqual(cps(`const { timeout, ${HANGUL} } = req.query;`), ['U+3164']);
  assert.deepEqual(cps(`export const esAdmin${HANGUL} = true;`), ['U+3164']);
  for (const [a, b] of RANGS_INVISIBLES_D_IDENTIFICADOR) {
    for (const cp of new Set([a, b])) assert.deepEqual(cps(`x${car(cp)} = 1`), [hex(cp)], `${hex(cp)} no s’ha detectat`);
  }
  /* Les veïnes visibles passen. */
  for (const cp of [0x034E, 0x0350, 0x115E, 0x1161, 0x17B3, 0x17B6, 0x180A, 0x1810, 0x3163, 0x3165, 0xFF9F, 0xFFA1]) {
    assert.deepEqual(cps(`x${car(cp)}y`), [], `${hex(cp)} no hauria de ser vetat`);
  }
  /* El conjunt sencer, llegit del motor: Default_Ignorable_Code_Point i
     ID_Continue, fora de l'unidor, del ZWNJ i dels selectors. */
  const delMotor = [];
  const fixats = RANGS_INVISIBLES_D_IDENTIFICADOR.flatMap(([a, b]) => Array.from({ length: b - a + 1 }, (_, k) => a + k));
  for (let cp = 0; cp <= 0x10FFFF; cp += 1) {
    if (cp >= 0xD800 && cp <= 0xDFFF) continue;
    if (/(?=\p{ID_Continue})\p{Default_Ignorable_Code_Point}/u.test(car(cp)) && !(cp >= 0x200B && cp <= 0x200F) && !(cp >= 0xFE00 && cp <= 0xFE0F)) delMotor.push(cp);
  }
  assert.deepEqual(delMotor.map(hex), fixats.map(hex), `Unicode ${process.versions.unicode} ha canviat el conjunt: revisa RANGS_INVISIBLES_D_IDENTIFICADOR`);
});

test('cap fitxer de l’abast (src/, tests/, vite.standalone.config.js) porta en cru caràcters de control, invisibles ni bidi, llevat de l’unidor d’una seqüència d’emoji', () => {
  const fitxers = fitxersDeLAbast();
  assert.ok(fitxers.length > JS_TORN.length, `l’abast té ${fitxers.length} fitxers: menys que la llista del torn`);
  const trobats = [];
  for (const f of fitxers) {
    for (const t of vetatsDeLAbast(llig(f))) trobats.push(`${f}:${t.linia}:${t.columna} ${hex(t.cp)}`);
  }
  assert.deepEqual(trobats, [], 'escriu-los com a escapament \\uXXXX dins de la cadena o del regex: el valor és el mateix');
});
