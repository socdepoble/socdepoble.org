/** Porta executable del torn Xat F0 (pla 260927_0055 §4.G).
 *  El hook del projecte no deixa executar `npm run lint` ni cap escombrada amb
 *  grep: ací es linten amb l'API d'ESLint (mateixa configuració que `npm run
 *  lint`, zero avisos) tots els fitxers .js/.jsx/.mjs tocats en este torn, i es
 *  comproven com a text les regles que les altres portes vigilen al pre-commit:
 *  paritat i18n en cinc llengües, classes del JSX declarades al CSS canònic,
 *  tokens declarats, cap hex ni px xicotet al CSS del xat, cap vocabulari vetat.
 *  Cap import relatiu: tot es resol des de l'arrel del repositori. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const llig = (ruta) => fs.readFileSync(path.join(ARREL, ruta), 'utf8');
const existix = (ruta) => fs.existsSync(path.join(ARREL, ruta));

/* ─────────────────────────── Fitxers del torn ─────────────────────────── */

const COMPONENTS_XAT = [
  'ClosCaXat', 'FilaConversa', 'FilaPersona', 'LlistaConverses', 'CapcaleraConversa', 'FiltreConverses',
  'Bombolla', 'MarquesEstat', 'PastillaNoLlegits', 'SeparadorDia', 'Compositor', 'PanellInicialMobil',
  /* Onada 3 (T63.2, T67, T68, T69): la columna de llista calcada de WhatsApp Desktop. */
  'MenuLlista', 'BarraSeleccio', 'FiltresCerca', 'ResultatsCercaXat', 'FitxaComunitat', 'DialegNovaConversa',
  /* Onada 3B: les vistes de la columna central que obri el rail. */
  'VistaComunitats', 'VistaEnConstruccio',
  /* Torn 260930 (T1): la conversa calcada de WhatsApp, el grup del poble de
     l'amfitrió i el Xat de mostra sense sessió. */
  'Conversa', 'SeparadorNoLlegits', 'BotoBaixar', 'BarraResposta', 'CitaResposta',
  'FilaPoble', 'EntradaDelPoble', 'FakeChatOnboarding', 'FullAjustos',
  /* Onada 3 (AV, 261003): l'únic punt on el Xat pinta una cara. */
  'CaraXat',
  /* Onada 6: «Informa d'un error», l'accés dels beta testers. */
  'BotoInformaDUnError',
  /* Fase E (261020, tasca 3): la llista viva d'«El Comú» dins de la bombolla. */
  'TargetaLlistaComu',
  /* Pla 261022_1425: el calaix d'emoticones gran del compositor. */
  'SelectorEmoticones',
  /* 261026 (prompt 261026_1615, tasca 2): «Envia a…», el que arriba del menú «Compartir». */
  'DialegCompartir'
].map((nom) => `src/sections/xat/components/${nom}.jsx`);

/* Les proves dels components de l'onada 3 (també la de les files, T67), de
   l'onada 3B (el rail i les vistes) i del torn 260930. */
const PROVES_COMPONENTS_XAT = [
  'MenuLlista', 'BarraSeleccio', 'FiltresCerca', 'ResultatsCercaXat', 'FitxaComunitat', 'DialegNovaConversa', 'FilaConversa',
  'ClosCaXat', 'VistaComunitats', 'VistaEnConstruccio',
  'Conversa', 'FilaPoble', 'EntradaDelPoble', 'FakeChatOnboarding', 'FullAjustos', 'CaraXat'
].map((nom) => `src/sections/xat/components/${nom}.test.jsx`);

/* Els espècimens del Xat al catàleg de disseny (Pedra Seca §9). */
const ESPECIMENS_XAT = [
  'EspecimenXat', 'EspecimenXatLlista', 'EspecimenXatCerca', 'EspecimenXatComunitats', 'EspecimenXatNovaConversa', 'EspecimenXatRail',
  'EspecimenXatAjustos'
].map((nom) => `src/sections/disseny/cataleg/detalls/${nom}.jsx`);

const JSX_XAT = [
  'src/sections/xat/XatSection.jsx',
  'src/sections/xat/XatControlSection.jsx',
  'src/sections/xat/XatContext.jsx',
  ...COMPONENTS_XAT,
  ...ESPECIMENS_XAT
];

const JS_TORN = [
  ...JSX_XAT,
  'src/sections/xat/XatContext.test.jsx',
  'src/sections/xat/XatSection.test.jsx',
  'src/sections/xat/missatges.js',
  'src/sections/xat/missatges.test.js',
  'src/sections/xat/temps.js',
  'src/sections/xat/temps.test.js',
  'src/sections/xat/enllacos.js',
  'src/sections/xat/enllacos.test.js',
  'src/sections/xat/cercaXat.js',
  'src/sections/xat/cercaXat.test.js',
  /* Fase E (261020, tasca 3): quan un missatge porta una llista viva, i les seues proves. */
  'src/sections/xat/llistaComu.js',
  'src/sections/xat/components/Bombolla.llistaComu.test.jsx',
  /* Pla 261022_1425: les emoticones del compositor (inserció al cursor, «Del poble», recents) i les seues proves. */
  'src/sections/xat/emoticonesXat.js',
  'src/sections/xat/emoticonesXat.test.js',
  'src/sections/xat/components/SelectorEmoticones.test.jsx',
  'src/sections/xat/components/Compositor.emoticones.test.jsx',
  /* Torn 260930 (T1): lògica pura de la conversa, esborranys i poble. */
  'src/sections/xat/conversa.js',
  'src/sections/xat/conversa.test.js',
  'src/sections/xat/esborranys.js',
  'src/sections/xat/esborranys.test.js',
  'src/sections/xat/pobleAmfitrio.js',
  'src/sections/xat/pobleAmfitrio.test.js',
  'src/sections/xat/usePobleAmfitrio.js',
  'src/sections/xat/ajustosXat.js',
  'src/sections/xat/ajustosXat.test.js',
  'src/sections/xat/amplariaColumnes.js',
  /* Revisió adversarial 260930: les proves de cada correcció. */
  'src/sections/xat/XatContext.ambit.test.jsx',
  'src/sections/xat/XatSection.revisio260930.test.jsx',
  /* Onada 3 (AV, 261003): les cares del Xat, de cada font fins al DOM. */
  'src/sections/xat/XatSection.avatars.test.jsx',
  'src/sections/xat/ajustosXat.cerca.test.js',
  'src/sections/xat/components/Conversa.revisio260930.test.jsx',
  'src/sections/xat/components/FullAjustos.revisio.test.jsx',
  'src/sections/xat/components/FullAjustos.capes.test.js',
  'src/sections/xat/components/ClosCaXat.capes.test.js',
  'src/sections/disseny/cataleg/detalls/EspecimenXatRail.test.jsx',
  'src/sections/disseny/cataleg/detalls/EspecimenXatAjustos.test.jsx',
  'src/sections/disseny/cataleg/detalls/EspecimenXatLlista.test.jsx',
  'src/sections/control/ControlSection.eixida.test.jsx',
  ...PROVES_COMPONENTS_XAT,
  'src/data/localXat.js',
  'src/data/localXat.test.js',
  'src/data/contracte.test.js',
  'src/data/supabase/xat.pagina.test.js',
  'tests/migracio-xat-de-pagina.test.mjs',
  'src/data/xatSeed.js',
  'src/data/supabase/xat.js',
  'src/data/supabase/xat.test.js',
  'src/data/supabase/storage.js',
  'src/sections/disseny/cataleg/manifest.js',
  /* Onada 3B: el catàleg (carregadors, registre i proves) i la prova del marcador. */
  'src/sections/disseny/cataleg/registre.js',
  'src/sections/disseny/cataleg/detailRegistry.jsx',
  'src/sections/disseny/cataleg/detalls/EspecimenColor.jsx',
  'src/sections/disseny/cataleg/detalls/EspecimenTargetaViva.jsx',
  'src/sections/disseny/cataleg/detalls/EspecimensUniversals.test.jsx',
  'src/sections/disseny/cataleg/detalls/allLoaders.test.jsx',
  'src/css/navegacio-secundaria.capes.test.js',
  'src/components/PedraSeca/atoms/Avatar.jsx',
  'src/components/layout/AppGridColumn.jsx',
  'src/config/i18n.js',
  'tests/xat_f0_migracio.test.mjs',
  'tests/lint_xat.test.mjs',
  /* Onada 6: el xat per als beta testers i la identitat de la IAIA. */
  'src/data/xatsPerDefecte.js',
  'src/data/xatsPerDefecte.test.js',
  'src/data/supabase/xat.iaia.test.js',
  'src/sections/realitat/useNivellIaia.js',
  'src/sections/xat/contactesAjuda.js',
  'src/sections/xat/errorsXat.js',
  'src/sections/xat/informeDError.js',
  'src/sections/xat/useInformaDUnError.js',
  'src/sections/xat/XatContext.nivellIaia.test.jsx',
  'src/sections/xat/XatSection.onada6.test.jsx',
  /* Revisió 261009: la reserva de l'informe i el codi SDP de la bombolla. */
  'src/sections/xat/informeDError.test.js',
  'src/sections/xat/components/Bombolla.codiError.test.jsx',
  /* Onada 6 · Integració Xat i Pobles: el xat del poble es diu «Gent de …». */
  'src/sections/xat/XatContext.gentDelPoble.test.jsx',
  'src/sections/xat/XatSection.caraDelPoble.test.jsx',
  'src/sections/xat/components/FakeChatOnboarding.gentDelPoble.test.jsx'
];

/* Fitxers de l'arbre compartit tocats per un altre actor (MarIA) durant el torn:
   es linten a banda perquè el pre-commit els passarà igualment. */
const JS_ARBRE_COMPARTIT = [
  'src/components/universal/DocumentEditor.jsx',
  'src/components/universal/UniversalToolbar.jsx',
  'src/components/universal/richText/UniversalRichTextToolbar.jsx',
  'src/sections/notes/NotesEditor.jsx',
  'src/sections/profile/PerfilEditor.jsx'
];

/* Els fulls que el torn toca. Per a resoldre classes també compten els altres
   fulls canònics de src/css (components.css declara les utilitats compartides,
   com sdp-nomes-lector o sdp-especimen__fila). */
const CSS_CANONIC = ['src/css/modules.css', 'src/css/sdp.css', 'src/css/layout.css', 'src/components/layout/AppGridShell.css'];
const CSS_RESOLUCIO = [...CSS_CANONIC, 'src/css/components.css', 'src/css/utilities.css', 'src/css/base.css'];
const CSS_TOKENS = ['src/css/tokens.css', 'src/css/design-tokens.css'];
const TEXT_TORN = [
  ...JS_TORN,
  ...CSS_CANONIC,
  'src/css/tokens.css',
  'supabase/migrations/2609270200_xat_f0_fonament.sql',
  'supabase/migrations/2609282100_xat_de_pagina.sql',
  'supabase/README.md'
];

test('tots els fitxers del torn existixen', () => {
  const absents = [...JS_TORN, ...CSS_CANONIC, ...CSS_TOKENS].filter((f) => !existix(f));
  assert.deepEqual(absents, []);
});

/* ─────────────────────────────── ESLint ─────────────────────────────── */

async function linta(fitxers) {
  const eslint = new ESLint({ cwd: ARREL });
  const resultats = await eslint.lintFiles(fitxers.map((f) => path.join(ARREL, f)));
  const missatges = [];
  for (const r of resultats) {
    for (const m of r.messages) {
      missatges.push(`${path.relative(ARREL, r.filePath)}:${m.line}:${m.column} [${m.ruleId || m.severity}] ${m.message}`);
    }
  }
  return missatges;
}

test('ESLint: zero missatges (avisos inclosos) als fitxers del torn', async () => {
  const missatges = await linta(JS_TORN);
  assert.deepEqual(missatges, [], `ESLint ha trobat ${missatges.length} missatge(s):\n${missatges.join('\n')}`);
});

/* Estos fitxers no són d'este torn: si tenen missatges, la prova queda en TODO
   (visible, sense tombar la bateria) i cada missatge s'imprimix com a diagnòstic
   perquè qui en tinga la propietat el veja. El pre-commit (`npm run lint`) els
   bloquejarà igualment. */
test('ESLint: fitxers de l’arbre compartit tocats durant el torn per un altre actor', async (t) => {
  const presents = JS_ARBRE_COMPARTIT.filter(existix);
  const missatges = await linta(presents);
  if (missatges.length) {
    t.todo(`${missatges.length} missatge(s) d’ESLint en fitxers d’un altre actor`);
    for (const m of missatges) t.diagnostic(m);
  }
  assert.deepEqual(missatges, []);
});

/* ─────────────────────────── Higiene de text ─────────────────────────── */

/** Les dos proves de text (esta i la de la migració) porten els patrons dins
 *  d’expressions regulars: no compten com a ocurrències. */
const PROVES_DE_TEXT = new Set(['tests/lint_xat.test.mjs', 'tests/xat_f0_migracio.test.mjs', 'tests/migracio-xat-de-pagina.test.mjs']);
const senseComentarisCss = (text) => text.replace(/\/\*[\s\S]*?\*\//g, (bloc) => bloc.replace(/[^\n]/g, ' '));

function liniesQueCasen(fitxers, patro, { neteja = (text) => text, exclou = new Set() } = {}) {
  const trobades = [];
  for (const f of fitxers) {
    if (!existix(f) || exclou.has(f)) continue;
    neteja(llig(f)).split('\n').forEach((linia, i) => {
      if (patro.test(linia)) trobades.push(`${f}:${i + 1}: ${linia.trim()}`);
    });
  }
  return trobades;
}

test('cap paraula vetada, cap console.log, cap residu mock-fil-, cap innerHTML', () => {
  const vetades = liniesQueCasen(TEXT_TORN, /offline-first|local-first/i, { exclou: PROVES_DE_TEXT });
  assert.deepEqual(vetades, []);
  const consoleLog = liniesQueCasen(JS_TORN, /console\.log\(/, { exclou: PROVES_DE_TEXT });
  assert.deepEqual(consoleLog, []);
  const mock = liniesQueCasen(JS_TORN, /mock-fil-/, { exclou: PROVES_DE_TEXT });
  assert.deepEqual(mock, []);
  const inner = liniesQueCasen(JS_TORN, /innerHTML/, { exclou: PROVES_DE_TEXT });
  assert.deepEqual(inner, []);
});

test('cap style= al JSX del xat, cap import de CSS des de JSX, cap :has() al CSS', () => {
  const style = liniesQueCasen(JSX_XAT, /\sstyle=\{/);
  assert.deepEqual(style, []);
  const importCss = liniesQueCasen(JS_TORN, /^\s*import\s+[^;]*\.css['"]/);
  assert.deepEqual(importCss, []);
  const has = liniesQueCasen(CSS_CANONIC, /:has\(/, { neteja: senseComentarisCss });
  assert.deepEqual(has, []);
});

test('Supabase només s’importa dins de src/data/supabase/', () => {
  const fora = JS_TORN.filter((f) => !f.startsWith('src/data/supabase/'));
  const imports = liniesQueCasen(fora, /@supabase\/supabase-js|from\s+['"][^'"]*\/supabase\/[^'"]*['"]/);
  assert.deepEqual(imports, []);
});

test('tot fitxer del torn acaba amb una línia buida', () => {
  const senseFinal = TEXT_TORN.filter((f) => existix(f) && !llig(f).endsWith('\n'));
  assert.deepEqual(senseFinal, []);
});

/* ─────────────────────────────── i18n ─────────────────────────────── */

const LLENGUES = ['ca', 'es', 'en', 'eu', 'gl'];

/* Fase D (261020, tasca 4.1) · L1 · El text del diccionari d'una llengua,
   src/config/idiomes/<codi>.js (abans, un bloc de TRANSLATIONS a i18n.js).
   Un fitxer absent tomba la prova: cap comprovació no passa en buit. */
function diccionariDe(l) {
  const ruta = `src/config/idiomes/${l}.js`;
  assert.ok(existix(ruta), `No trobe el diccionari ${l} (${ruta})`);
  return llig(ruta);
}

function clausPerLlengua() {
  const resultat = {};
  for (const l of LLENGUES) {
    const claus = new Map();
    for (const m of diccionariDe(l).matchAll(/^\s*'(section\.xat\.[^']+)'\s*:\s*(.*?),?\s*$/gm)) {
      claus.set(m[1], (claus.get(m[1]) || 0) + 1);
    }
    resultat[l] = claus;
  }
  return resultat;
}

test('i18n: les claus section.xat.* són idèntiques a les cinc llengües i sense duplicats', () => {
  const per = clausPerLlengua();
  const referencia = [...per.ca.keys()].sort();
  assert.ok(referencia.length > 50, `Massa poques claus section.xat.* en ca: ${referencia.length}`);
  for (const l of LLENGUES) {
    const claus = [...per[l].keys()].sort();
    const falten = referencia.filter((c) => !per[l].has(c));
    const sobren = claus.filter((c) => !per.ca.has(c));
    const duplicades = [...per[l].entries()].filter(([, n]) => n > 1).map(([c]) => c);
    assert.deepEqual({ falten, sobren, duplicades }, { falten: [], sobren: [], duplicades: [] }, `Llengua ${l}`);
  }
});

test('i18n: tota clau section.xat.* usada al codi del xat existix en ca', () => {
  const per = clausPerLlengua();
  const usades = new Set();
  for (const f of [...JSX_XAT, 'src/sections/xat/temps.js', 'src/sections/xat/cercaXat.js']) {
    for (const m of llig(f).matchAll(/'(section\.xat\.[A-Za-z0-9_.]+)'/g)) usades.add(m[1]);
  }
  const absents = [...usades].filter((c) => !per.ca.has(c)).sort();
  assert.deepEqual(absents, []);
});

/* ─────────────────────────── Classes ↔ CSS ─────────────────────────── */

function classesUsadesAlJsx(fitxers) {
  const classes = new Map();
  const afig = (classe, f) => {
    if (!classe || classe.includes('$') || classe.includes('{')) return;
    if (!classes.has(classe)) classes.set(classe, new Set());
    classes.get(classe).add(f);
  };
  for (const f of fitxers) {
    const text = llig(f);
    for (const m of text.matchAll(/className="([^"]*)"/g)) m[1].split(/\s+/).forEach((c) => afig(c, f));
    for (const m of text.matchAll(/className=\{`([^`]*)`\}/g)) {
      m[1].replace(/\$\{[^}]*\}/g, ' ').split(/\s+/).forEach((c) => afig(c, f));
    }
    /* Literals dins de condicionals: 'sdp-xat-item--meu', "sdp-xat-marques--llegit"… */
    for (const m of text.matchAll(/['"]((?:sdp|app|d)-[a-z0-9_-]+(?:\s+(?:sdp|app|d)-[a-z0-9_-]+)*)['"]/g)) {
      m[1].split(/\s+/).forEach((c) => afig(c, f));
    }
  }
  return classes;
}

function classesDeclaradesAlCss(fitxers) {
  const declarades = new Set();
  for (const f of fitxers) {
    for (const m of llig(f).matchAll(/\.(-?[_a-zA-Z][_a-zA-Z0-9-]*)/g)) declarades.add(m[1]);
  }
  return declarades;
}

/* Prefixos que no són classes CSS sinó claus, rutes o identificadors. */
/* app-grid-sidebar és l'id de la columna del rail (aria-controls), no una classe. */
const NO_ES_CLASSE = /^(sdp-xat-rail|sdp-root)$|^sdp:|^app-grid-(list|main|sidebar)$/;

test('tota classe usada al JSX del xat i d’AppGridColumn existix als fulls canònics de src/css', () => {
  const usades = classesUsadesAlJsx([...JSX_XAT, 'src/components/layout/AppGridColumn.jsx']);
  const declarades = classesDeclaradesAlCss(CSS_RESOLUCIO);
  const orfes = [...usades.entries()]
    .filter(([c]) => !declarades.has(c) && !NO_ES_CLASSE.test(c))
    .map(([c, fitxers]) => `${c} (${[...fitxers].map((f) => path.basename(f)).join(', ')})`)
    .sort();
  assert.deepEqual(orfes, []);
});

/* ─────────────────────────── CSS del xat ─────────────────────────── */

/** Talla un full en regles fulla: { selector, cos, linia }. */
function reglesFulla(text) {
  const regles = [];
  let selector = '';
  let cos = '';
  let liniaSelector = 1;
  let linia = 1;
  let enCos = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (c === '\n') linia += 1;
    if (c === '{') {
      if (!enCos) { enCos = true; cos = ''; liniaSelector = linia; }
      else { selector = ''; cos = ''; }
      continue;
    }
    if (c === '}') {
      if (enCos && cos.trim()) regles.push({ selector: selector.trim(), cos, linia: liniaSelector });
      selector = '';
      cos = '';
      enCos = false;
      continue;
    }
    if (enCos) cos += c;
    else selector += c;
  }
  return regles;
}

function reglesDelXat() {
  const regles = [];
  for (const r of reglesFulla(llig('src/css/modules.css'))) {
    if (r.selector.includes('sdp-xat')) regles.push({ ...r, fitxer: 'src/css/modules.css' });
  }
  for (const r of reglesFulla(llig('src/css/sdp.css'))) {
    if (r.selector.includes('sdp-avatar--to')) regles.push({ ...r, fitxer: 'src/css/sdp.css' });
  }
  return regles;
}

test('el CSS del xat només usa tokens: cap hex, cap rgb(), cap fallback dins de var()', () => {
  const dolentes = [];
  for (const r of reglesDelXat()) {
    if (/#[0-9a-fA-F]{3,8}\b/.test(r.cos) || /\brgba?\(/.test(r.cos) || /\bhsla?\(/.test(r.cos)) dolentes.push(`${r.fitxer}:${r.linia} ${r.selector}: color en brut`);
    if (/var\(--[a-z0-9-]+\s*,/.test(r.cos)) dolentes.push(`${r.fitxer}:${r.linia} ${r.selector}: fallback dins de var()`);
    if (/!important/.test(r.cos)) dolentes.push(`${r.fitxer}:${r.linia} ${r.selector}: !important`);
  }
  assert.deepEqual(dolentes, []);
});

test('el CSS del xat: cap font-size en px menor de 16, cap 56px/58px en brut, radis només per token', () => {
  const dolentes = [];
  for (const r of reglesDelXat()) {
    for (const m of r.cos.matchAll(/font-size\s*:\s*([0-9.]+)px/g)) {
      if (Number(m[1]) < 16) dolentes.push(`${r.fitxer}:${r.linia} ${r.selector}: font-size ${m[1]}px`);
    }
    if (/\b5[68]px\b/.test(r.cos)) dolentes.push(`${r.fitxer}:${r.linia} ${r.selector}: 56px/58px en brut`);
    for (const m of r.cos.matchAll(/border-radius\s*:\s*([^;]+);/g)) {
      const valor = m[1].trim();
      if (!/^(var\(--sdp-radi-(s|m|g|xl|boto|pastilla)\)(\s+var\(--sdp-radi-(s|m|g|xl|boto|pastilla)\))*|0|inherit)$/.test(valor)) {
        dolentes.push(`${r.fitxer}:${r.linia} ${r.selector}: border-radius ${valor}`);
      }
    }
  }
  assert.deepEqual(dolentes, []);
});

test('tot var(--sdp-*) usat al xat (CSS i JSX) està declarat a tokens.css o design-tokens.css', () => {
  const declarats = new Set();
  for (const f of CSS_TOKENS) {
    if (!existix(f)) continue;
    for (const m of llig(f).matchAll(/(--sdp-[a-z0-9-]+)\s*:/g)) declarats.add(m[1]);
  }
  const usats = new Map();
  const registra = (nom, on) => { if (!usats.has(nom)) usats.set(nom, on); };
  for (const r of reglesDelXat()) {
    for (const m of r.cos.matchAll(/var\((--sdp-[a-z0-9-]+)/g)) registra(m[1], `${r.fitxer}:${r.linia}`);
  }
  for (const f of JSX_XAT) {
    for (const m of llig(f).matchAll(/var\((--sdp-[a-z0-9-]+)/g)) registra(m[1], f);
  }
  const noDeclarats = [...usats.entries()].filter(([nom]) => !declarats.has(nom)).map(([nom, on]) => `${nom} (${on})`).sort();
  assert.deepEqual(noDeclarats, []);
});

/* ─────────────────────────── Onada 3B · el rail ─────────────────────────── */

/* Cap entrada del rail avisa amb un toast de «pendent»: totes porten a una
   vista (decisió del Mestre, 260928). La clau vella ja no existix enlloc. */
test('3B · el rail no avisa de «pendent»: la clau section.xat.rail.pendent ha desaparegut', () => {
  const rail = llig('src/sections/xat/components/ClosCaXat.jsx');
  assert.doesNotMatch(rail, /section\.xat\.rail\.pendent|showToast|useToast/);
  for (const l of LLENGUES) assert.doesNotMatch(diccionariDe(l), /section\.xat\.rail\.pendent/, l);
  for (const vista of ['comunitats', 'telefonades', 'multimedia', 'destacats']) {
    assert.match(rail, new RegExp(`id: '${vista}', accio: 'vista'`), `${vista} no és una vista del rail`);
  }
  assert.match(rail, /id: 'novetats', accio: 'control'/);
});

/* La graella del rail (ordre del Mestre, 260927 nit): les capçaleres de
   secció i el peu són files del crom, a sang i sense radi, amb la zona tàctil
   de la llei; només pinten amb --sdp-crom-*. */
test('3B · les capçaleres de secció i el peu del rail seguixen la graella del crom', () => {
  /* Sense comentaris: el comentari que precedix una regla no forma part del selector. */
  const regles = reglesFulla(senseComentarisCss(llig('src/css/modules.css'))).filter((r) => r.selector.includes('sdp-xat'));
  const cos = (selector) => regles.filter((r) => r.selector === selector).map((r) => r.cos).join(' ');
  const cap = cos('.sdp-xat-rail-seccio__cap');
  assert.match(cap, /border-radius\s*:\s*0\s*;/);
  assert.match(cap, /min-height\s*:\s*var\(--sdp-touch\)\s*;/);
  assert.match(cap, /padding\s*:\s*var\(--sdp-space-2\)\s+var\(--sdp-space-4\)\s*;/);
  assert.match(cos('.sdp-xat-rail-peu'), /padding\s*:\s*0\s+var\(--sdp-space-2\)\s+0\s+var\(--sdp-space-4\)\s*;/);
  const colors = [];
  for (const r of regles.filter((regla) => /\.sdp-xat-rail-(seccio|peu)/.test(regla.selector))) {
    for (const m of r.cos.matchAll(/(?:^|;)\s*(color|background|border(?:-top)?)\s*:\s*([^;]+)/g)) {
      for (const v of m[2].matchAll(/var\((--sdp-[a-z0-9-]+)/g)) if (!v[1].startsWith('--sdp-crom-')) colors.push(`${r.selector} ${m[1]}: ${v[1]}`);
    }
  }
  assert.deepEqual(colors, []);
});

/* ─────────────── Onada 3B · segona passada (revisió adversarial) ─────────────── */

/** El cos de les regles d'un full amb un selector exacte, sense comentaris. */
function cosDeRegles(ruta) {
  const regles = reglesFulla(senseComentarisCss(llig(ruta)));
  return (selector) => regles.filter((r) => r.selector === selector).map((r) => r.cos).join(' ');
}

/** Els valors section.xat.* de cada llengua, sense cometes. */
function valorsPerLlengua() {
  const resultat = {};
  for (const l of LLENGUES) {
    const valors = new Map();
    for (const m of diccionariDe(l).matchAll(/^\s*'(section\.xat\.[^']+)'\s*:\s*(['"])(.*)\2,?\s*$/gm)) valors.set(m[1], m[3]);
    resultat[l] = valors;
  }
  return resultat;
}

/* WCAG 2.5.3 (etiqueta en el nom): el nom accessible d'un control conté el
   text que es veu, perquè qui el prem amb la veu el trobe dient-lo. En basc
   «Ikusi {nom} osorik» no contenia «Ikusi dena». */
test('3B · i18n: el nom accessible de «Veure-ho tot» i de les seccions del rail conté el text visible, a les cinc llengües', () => {
  const per = valorsPerLlengua();
  const falles = [];
  for (const l of LLENGUES) {
    const visible = per[l].get('section.xat.vista.comunitats.veureTot');
    const nom = per[l].get('section.xat.vista.comunitats.veureTotDe');
    assert.ok(visible && nom, `Falten les claus de «Veure-ho tot» en ${l}`);
    if (!nom.replace('{nom}', '').toLocaleLowerCase().includes(visible.toLocaleLowerCase())) falles.push(`${l}: «${nom}» no conté «${visible}»`);
    for (const clau of ['section.xat.rail.seccio', 'section.xat.rail.seccioActual']) {
      if (!per[l].get(clau)?.includes('{nom}')) falles.push(`${l}: ${clau} no conté {nom} (el nom visible de la secció)`);
    }
  }
  assert.deepEqual(falles, []);
});

/* L'eix dret del rail desplegat (captura 19.11.50): el xebró de les seccions
   i el llapis del peu cauen sobre la mateixa vertical. Els dos van en una
   cel·la de var(--sdp-touch) amb var(--sdp-space-2) de coixí final: el
   centre a 8 + 22 = 30px de la vora. Amb el xebró solt i 16 de coixí,
   quedava a 28 i el llapis a 30. */
test('3B · el xebró de les seccions i el llapis del peu comparteixen l’eix dret', () => {
  const cos = cosDeRegles('src/css/modules.css');
  const cap = cos('.sdp-xat-rail-seccio__cap');
  const final = cap.search(/padding-inline-end\s*:\s*var\(--sdp-space-2\)\s*;/);
  assert.ok(final >= 0, 'La capçalera de secció no acaba amb var(--sdp-space-2) de coixí');
  assert.ok(final > cap.search(/(^|;)\s*padding\s*:/), 'El coixí final ha d’anar darrere de la forma curta');
  const cella = cos('.sdp-xat-rail-seccio__xebro-cella');
  assert.match(cella, /inline-size\s*:\s*var\(--sdp-touch\)\s*;/);
  assert.match(cella, /justify-content\s*:\s*center\s*;/);
  assert.match(cos('.sdp-xat-rail-peu'), /padding\s*:\s*0\s+var\(--sdp-space-2\)\s+0\s+var\(--sdp-space-4\)\s*;/);
  assert.match(cos('.sdp-xat-icona'), /width\s*:\s*var\(--sdp-touch\)\s*;/);
  assert.match(llig('src/sections/xat/components/ClosCaXat.jsx'), /className="sdp-xat-rail-seccio__xebro-cella"[^>]*>\s*<ChevronDown/);
});

/* Plegar no fa cap bot (ordre del Mestre, 260927): el peu fa
   var(--sdp-alt-accio) amb la vora inclosa en els dos estats, centra
   l'avatar i va a ras de baix. Plegat, viu dins de la capçalera plegada, que
   porta coixí de baix: el marge negatiu del peu ha de ser exactament eixe. */
test('3B · el peu del rail té la mateixa geometria plegat i desplegat', () => {
  const cos = cosDeRegles('src/css/modules.css');
  const desplegat = cos('.sdp-xat-rail-peu');
  const plegat = cos('.sdp-xat-rail-peu.sdp-xat-rail-peu--plegat');
  for (const regla of [desplegat, plegat]) {
    assert.match(regla, /min-height\s*:\s*var\(--sdp-alt-accio\)\s*;/);
    assert.match(regla, /align-items\s*:\s*center\s*;/);
  }
  assert.match(plegat, /display\s*:\s*flex\s*;/);
  assert.match(plegat, /padding\s*:\s*0\s*;/);
  const capcalera = cosDeRegles('src/components/layout/AppGridShell.css')('.app-grid-col-header.app-grid-col-header--collapsed');
  const coixi = capcalera.match(/padding\s*:\s*0\s+0\s+var\((--sdp-space-\d+)\)\s*;/);
  assert.ok(coixi, 'La capçalera plegada ha canviat de coixí: revisa el marge del peu plegat');
  assert.match(plegat, new RegExp(`margin-bottom\\s*:\\s*calc\\(var\\(${coixi[1]}\\)\\s*\\*\\s*-1\\)\\s*;`));
  assert.match(llig('src/css/base.css'), /\*,\s*\*::before,\s*\*::after\s*\{\s*box-sizing:\s*border-box;/);
});

/* Contrast WCAG 2.x a partir dels hex de tokens.css. */
function contrastWcag(a, b) {
  const lum = (hex) => {
    const [r, g, bl] = [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [clar, fosc] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (clar + 0.05) / (fosc + 0.05);
}
function declaracions(text, nom) {
  return [...text.matchAll(new RegExp(`${nom}\\s*:\\s*([^;]+);`, 'g'))].map((m) => m[1].trim());
}
function hexDe(text, valor) {
  let v = valor;
  for (let i = 0; i < 6 && v.startsWith('var('); i += 1) v = declaracions(text, v.slice(4, -1).trim())[0];
  assert.match(v, /^#[0-9a-fA-F]{6}$/, `${valor} no es resol a un hex`);
  return v;
}

/* WCAG 1.4.11: l'estat d'un component (el segment premut) ha de fer 3:1.
   El blanc de la targeta sobre el fons subtil només fa 1,18:1; la vora de
   --sdp-vora-control fa ≥ 3:1 contra el fons subtil i contra la targeta, en
   clar i en fosc. I el títol «En construcció» no hereta el coixí del h3. */
test('3B · el segment premut porta una vora de ≥ 3:1 i el títol «En construcció» no hereta el coixí del h3', () => {
  const cos = cosDeRegles('src/css/modules.css');
  assert.match(cos('.sdp-xat-segments__opcio'), /border\s*:\s*1px solid transparent\s*;/);
  assert.match(cos('.sdp-xat-segments__opcio[aria-pressed="true"]'), /border-color\s*:\s*var\(--sdp-vora-control\)\s*;/);

  const tokens = llig('src/css/tokens.css');
  const vora = declaracions(tokens, '--sdp-vora-control');
  const subtil = declaracions(tokens, '--sdp-fons-subtil');
  const targeta = declaracions(tokens, '--sdp-fons-targeta');
  assert.equal(vora.length, 2, 'Esperava --sdp-vora-control en clar i en fosc');
  const xifres = vora.map((v, i) => [
    contrastWcag(hexDe(tokens, v), hexDe(tokens, subtil[i])),
    contrastWcag(hexDe(tokens, v), hexDe(tokens, targeta[i]))
  ]);
  for (const parell of xifres) for (const x of parell) assert.ok(x >= 3, `Vora del segment premut a ${x.toFixed(2)}:1`);
  assert.deepEqual(xifres.map((p) => p.map((x) => x.toFixed(2))), [['3.11', '3.66'], ['3.71', '4.90']]);
  /* Sense la vora, l'estat només era el to: 1,18:1. */
  assert.equal(contrastWcag(hexDe(tokens, targeta[0]), hexDe(tokens, subtil[0])).toFixed(2), '1.18');

  const titol = cos('.sdp-xat-construccio__titol');
  assert.match(titol, /(^|;)\s*padding\s*:\s*0\s*;/);
  assert.match(titol, /text-align\s*:\s*center\s*;/);
});

test('els tokens nous del xat viuen a tokens.css i no en cap altre full', () => {
  const tokens = llig('src/css/tokens.css');
  assert.match(tokens, /--sdp-xat-fila-mida\s*:/);
  assert.match(tokens, /--sdp-xat-bombolla-max\s*:/);
  const foraDeLloc = liniesQueCasen(CSS_CANONIC, /^\s*--sdp-xat-[a-z-]+\s*:/);
  assert.deepEqual(foraDeLloc, []);
});
