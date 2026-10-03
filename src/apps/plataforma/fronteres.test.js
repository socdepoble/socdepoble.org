/* Plataforma d'Apps Enxufables · les fronteres: el que no ha d'eixir d'una app.
   Telemetria (només /app/*, mai quina app ni on), cerca global (no indexa cap
   app), traducció de pàgina (cap app la munta), el criteri d'«ama del
   document» de la guarda de salut, que ha de ser el de RouteTelemetria, i el
   Model B per a TOTES les apps (regla transversal, Onada 3 · T4): cap backend,
   cap xarxa i l'emmagatzematge només per utils/magatzemLocal.js des de
   magatzem.js. Els patrons vetats es componen a trossos perquè les portes que
   llegixen src/ no els troben ací (patró de src/sections/gestoria/qualitat.test.js). */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { _reiniciaTelemetria, darrersEnviaments, declaraEncastada, registraVisita } from '../../data/telemetria.js';

const ARREL = process.cwd();
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

const esProva = (f) => /\.test\.[cm]?jsx?$/.test(f) || f.includes('/__fixtures__/');
const APPS = fitxersDe('src/apps').filter((f) => !esProva(f));
/* Els especificadors d'importació: estàtica, dinàmica (també amb un comentari
   davant de l'especificador, com el de @vite-ignore), reexportació, sense nom,
   require i els patrons de import.meta.glob (un o una llista). */
const ESPECIFICADOR = /(?:\bfrom\s*|\bimport\s*\(\s*(?:\/\*[\s\S]*?\*\/\s*)*|\bimport\s+|\brequire\s*\(\s*)(['"`])([^'"`\n]+)\1/g;
const GLOB = /\bimport\.meta\.glob(?:Eager)?\s*\(\s*(\[[^\]]*\]|(['"`])[^'"`\n]+\2)/g;
const LITERAL = /(['"`])([^'"`\n]+)\1/g;
const especificadors = (codi) => [
  ...[...codi.matchAll(ESPECIFICADOR)].map((m) => m[2]),
  ...[...codi.matchAll(GLOB)].flatMap((m) => [...m[1].matchAll(LITERAL)].map((l) => l[2].replace(/^!/, '')))
];
/* Un especificador relatiu, resolt des de l'arrel i sense ?consulta; els paquets i les adreces, tal qual. */
function resol(ruta, especificador) {
  const net = especificador.replace(/\?.*$/, '');
  if (!net.startsWith('.')) return net;
  return path.posix.normalize(path.posix.join(path.posix.dirname(ruta), net));
}

/* ── Model B a totes les apps ──────────────────────────────────────────────
   Una app és una carpeta de src/apps que no és la plataforma ni l'esquelet
   comú (el mateix criteri que qualitat.test.js). El seu codi de producció
   (sense *.test.* ni __fixtures__):
   · Importa només fitxers propis, les portes de fora de PERMESOS_DE_FORA,
     src/utils i els paquets de PAQUETS (llista blanca sobre el destí resolt,
     com nevera/frontera i salut/privacitat). La llista negra IMPORT_VETAT és la
     segona línia: el backend, la capa de dades, config/storage.js i les
     importacions remotes no hi entren ni amb una entrada nova a la blanca.
   · No obri cap canal de xarxa ni porta cap URL externa.
   · No nomena cap API d'emmagatzematge, tampoc magatzem.js: només
     <app>/magatzem.js importa utils/magatzemLocal.js, que és el motor (Web
     Lock, BroadcastChannel i, demà, l'àmbit). El veto dels noms de
     localStorage, sessionStorage i indexedDB ja el fa plataforma/qualitat.test.js;
     ací s'hi afigen les galetes i la Cache API.
   · Les utilitats de src/utils que arrossega, en tancament transitiu (com
     utilsDe de salut/privacitat), tampoc no obrin xarxa ni emmagatzematge
     (llevat del motor) ni importen res de fora de src/utils.
   Sí que pot llegir el fitxer que tria la persona (File.arrayBuffer), carregar
   mòduls propis amb import() i importar text propi amb ?raw. Les portes de fora
   (plataforma, esquelet, Pedra Seca…) no es miren per dins: són del nucli i les
   vigilen les seues proves. Les proves de cada app (bar/frontera,
   nevera/frontera, salut/privacitat) poden ser més estrictes; esta és el terra
   comú d'una app nova. */
const NO_APPS = new Set(['plataforma', 'comu']);
const CODI = /\.(?:[cm]?js|jsx)$/;
const APP_DE = /^src\/apps\/[^/]+\//;
const UTILS = 'src/utils/';
const PERMESOS_DE_FORA = new Set([
  'src/apps/plataforma/index.js',
  'src/apps/comu/esquelet/index.js',
  'src/components/PedraSeca/index.js',
  'src/components/layout/AppGridColumn.jsx',
  'src/components/universal/connexio/useEnLinia.js',
  'src/app/contexts/RouterContext',
  'src/app/contexts/RouterContext.jsx'
]);
const PAQUETS = new Set(['react', 'lucide-react']);
const IMPORT_VETAT = new RegExp(['supa', 'base|backend', 'Port|adapta', 'dors|(?:^|\\/)data(?:\\/|$)|(?:^|\\/)config\\/stor',
  'age\\b|^(?:https?:)?\\/\\/'].join(''), 'i');
const XARXA = [
  [new RegExp(['\\bfet', 'ch\\s*\\('].join('')), 'fetch'],
  [new RegExp(['\\bXMLHttp', 'Request\\b'].join('')), 'XMLHttpRequest'],
  [new RegExp(['\\bWeb', 'Socket\\b'].join('')), 'WebSocket'],
  [new RegExp(['\\bEvent', 'Source\\b'].join('')), 'EventSource'],
  [new RegExp(['\\bsend', 'Beacon\\b'].join('')), 'sendBeacon']
];
const URL_EXTERNA = [new RegExp(['https?', ':\\/\\/'].join('')), 'URL externa'];
const EMMAGATZEMATGE = [
  [new RegExp(['\\blocal', 'Storage\\b'].join('')), 'localStorage'],
  [new RegExp(['\\bsession', 'Storage\\b'].join('')), 'sessionStorage'],
  [new RegExp(['\\bindexed', 'DB\\b'].join('')), 'indexedDB'],
  [new RegExp(['\\bdocument\\.coo', 'kie\\b'].join('')), 'document.cookie'],
  [new RegExp(['\\bcaches\\.', '[a-z]'].join('')), 'Cache API']
];
const MOTOR_LOCAL = /^src\/utils\/magatzemLocal(?:\.js)?$/;
const MAGATZEM = /^src\/apps\/[^/]+\/magatzem\.js$/;
/* Fitxers d'una app que, a més de <app>/magatzem.js, poden importar el motor
   local: ruta → motiu. Cap excepció obri l'API directa. A 261003 no n'hi ha
   cap: bar, nevera i salut hi entren només per <app>/magatzem.js. */
const EXCEPCIONS_EMMAGATZEMATGE = new Map();

/* Les infraccions d'un fitxer de producció d'una app, com a «ruta: què». */
function infraccionsDe(ruta, codi, excepcions = EXCEPCIONS_EMMAGATZEMATGE) {
  const propia = (ruta.match(APP_DE) || [''])[0];
  const potMotor = MAGATZEM.test(ruta) || excepcions.has(ruta);
  const trobades = [];
  for (const especificador of especificadors(codi)) {
    const desti = resol(ruta, especificador);
    if (propia && desti.startsWith(propia)) continue;
    if (IMPORT_VETAT.test(desti)) trobades.push(`import ${especificador}`);
    else if (MOTOR_LOCAL.test(desti)) {
      if (!potMotor) trobades.push(`import ${especificador} fora de magatzem.js`);
    } else if (!PAQUETS.has(desti) && !PERMESOS_DE_FORA.has(desti) && !desti.startsWith(UTILS)) {
      trobades.push(`import ${especificador} fora de la llista blanca`);
    }
  }
  trobades.push(...[...XARXA, URL_EXTERNA].filter(([patro]) => patro.test(codi)).map(([, que]) => que));
  trobades.push(...EMMAGATZEMATGE.filter(([patro]) => patro.test(codi)).map(([, que]) => `${que} directe`));
  return trobades.map((que) => `${ruta}: ${que}`);
}

/* La regla sobre un cens [{ app, fitxers: [[ruta, codi]] }]. Un cens buit o
   una app sense codi també són infraccions: una porta que no mira res no pot
   eixir verda. */
function infraccionsDelCens(cens) {
  if (cens.length === 0) return ['src/apps: cens d’apps buit'];
  return cens.flatMap(({ app, fitxers }) => (fitxers.length === 0
    ? [`src/apps/${app}: cap fitxer de producció`]
    : fitxers.flatMap(([ruta, codi]) => infraccionsDe(ruta, codi))));
}

/* El fitxer que hi ha de veres darrere d'un destí resolt (amb extensió o index.js si en falta), o null. */
function fitxerDe(desti) {
  return [desti, `${desti}.js`, `${desti}.jsx`, `${desti}/index.js`]
    .find((candidat) => CODI.test(candidat) && existsSync(path.join(ARREL, candidat))) || null;
}

/* Les utilitats de src/utils que arrossega un cens, i les que estes importen
   (tancament transitiu), com a [[ruta, codi]]. */
function utilsDe(cens) {
  const vistes = new Map();
  const pendents = cens.flatMap(({ fitxers }) => fitxers);
  while (pendents.length) {
    const [ruta, codi] = pendents.pop();
    for (const especificador of especificadors(codi)) {
      const desti = fitxerDe(resol(ruta, especificador));
      if (desti && desti.startsWith(UTILS) && !vistes.has(desti)) {
        vistes.set(desti, llig(desti));
        pendents.push([desti, vistes.get(desti)]);
      }
    }
  }
  return [...vistes].sort(([a], [b]) => (a < b ? -1 : 1));
}

/* Les infraccions d'eixes utilitats: cap xarxa, cap emmagatzematge directe
   (llevat del motor local, que n'és la implementació) i cap import de fora de
   src/utils. Les URL no es veten ací: utils/fulls/xlsx.js porta els espais de
   noms OOXML, que no són xarxa (salut/privacitat ho comprova host a host). */
function infraccionsDeUtils(fitxers) {
  return fitxers.flatMap(([ruta, codi]) => {
    const trobades = especificadors(codi).filter((e) => !resol(ruta, e).startsWith(UTILS)).map((e) => `import ${e} fora de src/utils`);
    trobades.push(...XARXA.filter(([patro]) => patro.test(codi)).map(([, que]) => que));
    if (!MOTOR_LOCAL.test(ruta)) trobades.push(...EMMAGATZEMATGE.filter(([patro]) => patro.test(codi)).map(([, que]) => `${que} directe`));
    return trobades.map((que) => `${ruta}: ${que}`);
  });
}

const CENS = readdirSync(path.join(ARREL, 'src/apps'), { withFileTypes: true })
  .filter((d) => d.isDirectory() && !NO_APPS.has(d.name)).map((d) => d.name).sort()
  .map((app) => ({ app, fitxers: fitxersDe(`src/apps/${app}`, CODI).filter((f) => !esProva(f)).map((f) => [f, llig(f)]) }));
const UTILS_DE_LES_APPS = utilsDe(CENS);

describe('telemetria', () => {
  beforeEach(() => { _reiniciaTelemetria(); declaraEncastada(false); });
  afterEach(() => { _reiniciaTelemetria(); });

  test.each([
    ['/app/salut/diari/2026-10-02', '/app/*'],
    ['/app/salut', '/app/*'],
    ['/app/bar/caixa/t-3?filtre=obert', '/app/*'],
    ['/app', '/app']
  ])('%s viatja com a %s', (ruta, esperada) => {
    registraVisita(ruta);
    const [intent] = darrersEnviaments();
    expect(intent.url).toBe(esperada);
    /* El moment és l'hora de l'intent (no és de la ruta): la resta no diu quina app ni on. */
    const resta = { ...intent };
    delete resta.moment;
    expect(JSON.stringify(resta)).not.toMatch(/salut|bar|diari|caixa|t-3|filtre|2026/);
  });
});

describe('cerca global i traducció', () => {
  test('la cerca global no importa res de les apps', () => {
    for (const fitxer of ['src/sections/search/indexCerca.js', 'src/sections/search/useCercaGlobal.js']) {
      expect(especificadors(llig(fitxer)).filter((e) => e.includes('/apps/')), fitxer).toEqual([]);
    }
  });

  test('cap fitxer de src/apps munta la traducció de pàgina, la Pàgina Universal ni la telemetria', () => {
    const vetats = /useTraduccioPagina|UniversalPage|PageFrame|UniversalEditorShell|data\/telemetria/;
    const trobats = APPS.flatMap((fitxer) => especificadors(llig(fitxer)).filter((e) => vetats.test(e)).map((e) => `${fitxer}: ${e}`));
    expect(trobats).toEqual([]);
  });

  test('cap app importa la Gestoria ni els Tractors (D3)', () => {
    const trobats = APPS.flatMap((fitxer) => especificadors(llig(fitxer))
      .filter((e) => /sections\/(?:gestoria|tractors)\//.test(e)).map((e) => `${fitxer}: ${e}`));
    expect(trobats).toEqual([]);
  });
});

describe('guarda de salut', () => {
  test('el criteri d’ama del document és el de RouteTelemetria (cap divergència)', () => {
    const telemetria = llig('src/hooks/RouteTelemetria.jsx');
    expect(telemetria).toContain("externalConfig?.manageDocumentHead !== true || window.__SDP_EMBEDDED__");
    expect(telemetria).toContain('window.self === window.top');
    const propi = llig('src/apps/plataforma/interruptors.js');
    expect(propi).toContain("externalConfig?.manageDocumentHead !== true || finestra.__SDP_EMBEDDED__");
    expect(propi).toContain('finestra.self === finestra.top');
  });
});

describe('Model B a totes les apps (regla transversal)', () => {
  test('el cens mira de veres: les apps del disc, amb el seu codi real i sense les proves que hi ha al costat', () => {
    expect(CENS.map(({ app }) => app)).toEqual(expect.arrayContaining(['bar', 'nevera', 'salut']));
    const rutes = CENS.flatMap(({ fitxers }) => fitxers.map(([ruta]) => ruta));
    expect(rutes).toEqual(expect.arrayContaining(['src/apps/bar/magatzem.js', 'src/apps/nevera/magatzem.js', 'src/apps/salut/magatzem.js']));
    /* Proves reals que el recorregut sense filtre troba i el cens deixa fora. */
    const proves = ['src/apps/bar/frontera.test.js', 'src/apps/nevera/frontera.test.js', 'src/apps/salut/privacitat.test.js'];
    expect(fitxersDe('src/apps', CODI)).toEqual(expect.arrayContaining(proves));
    expect(rutes.filter((ruta) => proves.includes(ruta))).toEqual([]);
    /* El codi és el del disc: cap fitxer buit, i el magatzem.js real de cada app, posat en un altre fitxer, és una infracció. */
    expect(CENS.flatMap(({ fitxers }) => fitxers.filter(([, codi]) => codi.trim() === '').map(([ruta]) => ruta))).toEqual([]);
    for (const app of ['bar', 'nevera', 'salut']) {
      const [, codi] = CENS.find((c) => c.app === app).fitxers.find(([ruta]) => ruta === `src/apps/${app}/magatzem.js`);
      const sonda = `src/apps/${app}/sonda.js`;
      expect(infraccionsDe(sonda, codi)).toContain(`${sonda}: import ../../utils/magatzemLocal.js fora de magatzem.js`);
    }
    for (const [ruta, motiu] of EXCEPCIONS_EMMAGATZEMATGE) expect(rutes, motiu).toContain(ruta);
  });

  test('cap app importa res de fora de la llista blanca ni el backend, ni obri xarxa, ni nomena l’emmagatzematge; el motor, només magatzem.js', () => {
    expect(infraccionsDelCens(CENS)).toEqual([]);
  });

  test('les utilitats que arrosseguen, en tancament transitiu, tampoc no obrin xarxa ni emmagatzematge ni ixen de src/utils', () => {
    const rutes = UTILS_DE_LES_APPS.map(([ruta]) => ruta);
    /* fulls/model.js hi arriba per fulls/index.js: el tancament és transitiu també sobre el disc. */
    expect(rutes).toEqual(expect.arrayContaining(['src/utils/magatzemLocal.js', 'src/utils/diners.js', 'src/utils/fulls/index.js', 'src/utils/fulls/model.js']));
    expect(infraccionsDeUtils(UTILS_DE_LES_APPS)).toEqual([]);
  });
});

describe('la regla transversal detecta (casos sintètics en memòria)', () => {
  const VISTA = 'src/apps/sonda/vistes/Vista.jsx';
  const MAGATZEM_SONDA = 'src/apps/sonda/magatzem.js';
  const t = (...trossos) => trossos.join('');

  test.each([
    ['el port del backend', t("import { llig } from '../../../data/backend", "Port.js';"), t('import ../../../data/backend', 'Port.js')],
    ['el client de la base remota', t("import { createClient } from '@supa", 'base/supa', "base-js';"), t('import @supa', 'base/supa', 'base-js')],
    ['un adaptador per import() dinàmic', t("const m = await import('../../../data/adapta", "dors/sollutia/client.js');"),
      t('import ../../../data/adapta', 'dors/sollutia/client.js')],
    ['un import() amb un comentari davant', t("const m = await import(/* @vite-ignore */ '../../../data/backend", "Port.js');"),
      t('import ../../../data/backend', 'Port.js')],
    ['la capa de dades per import.meta.glob', "const moduls = import.meta.glob('../../../data/*.js');", 'import ../../../data/*.js'],
    ['la capa d’emmagatzematge dins d’una llista de import.meta.glob', t("const moduls = import.meta.glob(['./vistes/*.jsx', '../../../config/stor", "age.js']);"),
      t('import ../../../config/stor', 'age.js')],
    ['la capa de dades per reexportació', "export { registraVisita } from '../../../data/telemetria.js';", 'import ../../../data/telemetria.js'],
    ['la capa de dades sencera', "import * as dades from '../../../data';", 'import ../../../data'],
    ['la capa de dades per require', t("const port = require('../../../data/supa", "base/index.js');"), t('import ../../../data/supa', 'base/index.js')],
    ['la capa d’emmagatzematge del projecte', t("import { setVal } from '../../../config/stor", "age.js';"), t('import ../../../config/stor', 'age.js')],
    ['una importació remota sense protocol', "const m = await import('//exemple.org/modul.js');", 'import //exemple.org/modul.js'],
    ['un pont al backend (el context de sessió)', "import { useSession } from '../../../app/contexts/SessionContext.jsx';",
      'import ../../../app/contexts/SessionContext.jsx fora de la llista blanca'],
    ['un pont al backend (l’API de l’amfitrió)', "import { configura } from '../../../host.js';", 'import ../../../host.js fora de la llista blanca'],
    ['una altra app', "import { llavorCarta } from '../../bar/nucli/llavor.js';", 'import ../../bar/nucli/llavor.js fora de la llista blanca'],
    ['un paquet no declarat', "import Dexie from 'dexie';", 'import dexie fora de la llista blanca'],
    ['fetch', t('const resposta = await fet', 'ch(adreca);'), 'fetch'],
    ['XMLHttpRequest', t('const peticio = new XMLHttp', 'Request();'), 'XMLHttpRequest'],
    ['WebSocket', t('const canal = new Web', 'Socket(adreca);'), 'WebSocket'],
    ['EventSource', t('const fil = new Event', 'Source(adreca);'), 'EventSource'],
    ['sendBeacon', t('navigator.send', 'Beacon(adreca, cos);'), 'sendBeacon'],
    ['una URL externa', t("const adreca = 'https:", "//exemple.org/api';"), 'URL externa'],
    ['localStorage', t("window.local", "Storage.setItem('clau', 'valor');"), 'localStorage directe'],
    ['sessionStorage', t('session', 'Storage.clear();'), 'sessionStorage directe'],
    ['indexedDB', t('const peticio = indexed', "DB.open('sdp-sonda');"), 'indexedDB directe'],
    ['les galetes', t('document.coo', "kie = 'clau=valor';"), 'document.cookie directe'],
    ['la Cache API', t('const reserva = await caches.', "open('sdp-sonda');"), 'Cache API directe'],
    ['el motor local fora de magatzem.js', "import { creaMagatzemIdb } from '../../../utils/magatzemLocal.js';",
      'import ../../../utils/magatzemLocal.js fora de magatzem.js']
  ])('%s', (_que, codi, esperada) => {
    expect(infraccionsDe(VISTA, codi)).toEqual([`${VISTA}: ${esperada}`]);
  });

  test('una importació remota amb protocol: l’import i la URL', () => {
    expect(infraccionsDe(VISTA, t("const m = await import('https:", "//exemple.org/modul.js');")))
      .toEqual([t(`${VISTA}: import https:`, '//exemple.org/modul.js'), `${VISTA}: URL externa`]);
  });

  test('totes les infraccions d’un mateix fitxer, no només la primera', () => {
    const codi = [
      t("import { llig } from '../../../data/backend", "Port.js';"),
      t('await fet', 'ch(adreca);'),
      t('session', 'Storage.clear();')
    ].join('\n');
    expect(infraccionsDe(VISTA, codi)).toHaveLength(3);
  });

  test('magatzem.js a l’arrel de l’app importa el motor; el mateix nom en una subcarpeta, no; l’API directa i la xarxa, enlloc', () => {
    expect(infraccionsDe(MAGATZEM_SONDA, "import { creaMagatzemIdb } from '../../utils/magatzemLocal.js';")).toEqual([]);
    expect(infraccionsDe('src/apps/sonda/vistes/magatzem.js', "import { creaMagatzemIdb } from '../../../utils/magatzemLocal.js';"))
      .toEqual(['src/apps/sonda/vistes/magatzem.js: import ../../../utils/magatzemLocal.js fora de magatzem.js']);
    expect(infraccionsDe(MAGATZEM_SONDA, t('const peticio = indexed', "DB.open('sdp-sonda');"))).toEqual([`${MAGATZEM_SONDA}: indexedDB directe`]);
    expect(infraccionsDe(MAGATZEM_SONDA, t("import { getVal } from '../../config/stor", "age.js';"))).toEqual([t(`${MAGATZEM_SONDA}: import ../../config/stor`, 'age.js')]);
    expect(infraccionsDe(MAGATZEM_SONDA, t('await fet', 'ch(adreca);'))).toEqual([`${MAGATZEM_SONDA}: fetch`]);
  });

  test('una excepció declarada (ruta → motiu) deixa importar el motor a eixe fitxer i a cap altre, i no obri l’API directa', () => {
    const excepcions = new Map([[VISTA, 'motiu sintètic de la prova']]);
    const motor = "import { creaMagatzemIdb } from '../../../utils/magatzemLocal.js';";
    expect(infraccionsDe(VISTA, motor, excepcions)).toEqual([]);
    expect(infraccionsDe('src/apps/sonda/vistes/Altra.jsx', motor, excepcions)).toHaveLength(1);
    expect(infraccionsDe(VISTA, t('session', 'Storage.clear();'), excepcions)).toEqual([`${VISTA}: sessionStorage directe`]);
  });

  test('un cens buit, o una app sense codi de producció, fa fallar la regla', () => {
    expect(infraccionsDelCens([])).toEqual(['src/apps: cens d’apps buit']);
    expect(infraccionsDelCens([{ app: 'sonda', fitxers: [] }])).toEqual(['src/apps/sonda: cap fitxer de producció']);
    expect(infraccionsDelCens([{ app: 'sonda', fitxers: [[VISTA, t('new Web', 'Socket(adreca);')]] }])).toEqual([`${VISTA}: WebSocket`]);
  });

  test('el cens deixa fora les proves i el suport de proves, i res més', () => {
    const fora = ['src/apps/sonda/vistes/Vista.test.jsx', 'src/apps/sonda/nucli/llig.test.mjs', 'src/apps/sonda/nucli/__fixtures__/llibre.js'];
    expect(fora.filter(esProva)).toEqual(fora);
    expect(['src/apps/sonda/nucli/importacio.js', 'src/apps/sonda/vistes/ImportarFull.jsx', 'src/apps/sonda/testimonis.js'].filter(esProva)).toEqual([]);
  });

  test('el tancament de les utilitats seguix els imports des d’un cens en memòria', () => {
    const rutes = utilsDe([{ app: 'sonda', fitxers: [[VISTA, "import { llegixLlibre } from '../../../utils/fulls/index.js';"]] }]).map(([ruta]) => ruta);
    expect(rutes).toEqual(expect.arrayContaining(['src/utils/fulls/index.js', 'src/utils/fulls/model.js']));
    expect(rutes).not.toContain('src/utils/magatzemLocal.js');
    expect(utilsDe([{ app: 'sonda', fitxers: [[VISTA, "import { useState } from 'react';"]] }])).toEqual([]);
  });

  test('les utilitats: cap xarxa, cap emmagatzematge fora del motor i cap import de fora de src/utils', () => {
    const UTIL = 'src/utils/sonda/model.js';
    expect(infraccionsDeUtils([[UTIL, "import { a } from './b.js';\nimport { parseEuros } from '../diners.js';"]])).toEqual([]);
    expect(infraccionsDeUtils([[UTIL, t('await fet', 'ch(adreca);')]])).toEqual([`${UTIL}: fetch`]);
    expect(infraccionsDeUtils([[UTIL, t('window.local', "Storage.getItem('clau');")]])).toEqual([`${UTIL}: localStorage directe`]);
    expect(infraccionsDeUtils([[UTIL, t("import { llig } from '../../data/backend", "Port.js';")]]))
      .toEqual([t(`${UTIL}: import ../../data/backend`, 'Port.js fora de src/utils')]);
    expect(infraccionsDeUtils([['src/utils/magatzemLocal.js', t('const idb = globalThis.indexed', 'DB;')]])).toEqual([]);
    expect(infraccionsDeUtils([['src/utils/fulls/xlsx.js', t("const NS = 'http:", "//schemas.openxmlformats.org/x';")]])).toEqual([]);
  });

  /* El que fan les apps de l'Onada 3 (T2, T3, T5) i la regla no pot prohibir. */
  test.each([
    ['un text importat amb ?raw', "import TEXT from './llavors/carta-exemple.csv?raw';"],
    ['un mòdul propi amb import() dinàmic', "const carrega = () => import('./llavors/exemple.js').then((m) => m.llavor());"],
    ['un fitxer triat per la persona, llegit en local', 'const octets = new Uint8Array(await fitxer.arrayBuffer());'],
    ['les utilitats de fulls i de diners', "import { llegixLlibre } from '../../../utils/fulls/index.js';\nimport { parseEuros } from '../../../utils/diners.js';"],
    ['la plataforma, l’esquelet i Pedra Seca', ["import { ClosaAplicacio } from '../../plataforma/index.js';",
      "import { EsqueletCatalegColleccio } from '../../comu/esquelet/index.js';", "import { Boto } from '../../../components/PedraSeca/index.js';"].join('\n')],
    ['les altres portes de fora i els paquets', ["import AppGridColumn from '../../../components/layout/AppGridColumn.jsx';",
      "import { useRouter } from '../../../app/contexts/RouterContext';", "import { useEnLinia } from '../../../components/universal/connexio/useEnLinia.js';",
      "import { useState } from 'react';", "import { Coffee } from 'lucide-react';"].join('\n')],
    ['una carpeta pròpia que només s’hi assembla', "import { vestit } from './metadata/vestits.js';"],
    ['carpetes pròpies amb nom de capa (adaptadors, data)', "import { llegix } from './adaptadors/csv.js';\nimport { llavor } from '../data/llavor.js';"],
    ['funcions pròpies que només s’hi assemblen', 'refetch(); prefetchCarta();'],
    ['un comentari sobre la base local', "// Les dades viuen a l'IndexedDB d'este dispositiu."]
  ])('no confon %s amb una infracció', (_que, codi) => {
    expect(infraccionsDe(VISTA, codi)).toEqual([]);
  });
});
