/* Plataforma d'Apps Enxufables · les fronteres: el que no ha d'eixir d'una app.
   Telemetria (només /app/*, mai quina app ni on), cerca global (no indexa cap
   app), traducció de pàgina (cap app la munta), el criteri d'«ama del
   document» de la guarda de salut, que ha de ser el de RouteTelemetria, i el
   Model B per a TOTES les apps (regla transversal, Onada 3 · T4): cap backend,
   cap xarxa i l'emmagatzematge només per utils/magatzemLocal.js des de
   magatzem.js. I, des del 261006, que l'API pública (plataforma/index.js) no
   arribe a cap app ni importe els contexts de l'arrel (el desenvolupament amb
   HMR). Els patrons vetats es componen a trossos perquè les portes que
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

/* EL PONT DE LA GESTORIA · ruta → { especificadors, motiu }. Ordre del Mestre,
   261004 («contaminació crítica de rutes/estats entre Gestoria i Wiki»): la
   Gestoria ix de la Wiki i viu a la seua app, /app/gestoria. El seu codi es
   queda a src/sections/gestoria, on el vigila la seua guarda
   (gestoria/privacitat.test.js: cap xarxa ni backend, l'emmagatzematge només
   als magatzems declarats, i només en desenvolupament). Este és l'ÚNIC
   fitxer de src/apps que hi entra, amb ELS especificadors d'esta llista i cap
   altre, tots per import() dins de la constant de DEV. Cap altre fitxer de
   src/apps, tampoc de la mateixa app, s'hi acull; i els Tractors, mai. No
   afebleix cap regla general: només eixos parells (fitxer, especificador)
   passen, i la resta de comprovacions (xarxa, URL, emmagatzematge, backend)
   s'apliquen igual al pont. */
const PONTS_GESTORIA = new Map([
  ['src/apps/gestoria/AppGestoria.jsx', Object.freeze({
    especificadors: Object.freeze([
      '../../sections/gestoria/tauler/ShellGestoria.jsx',
      '../../sections/gestoria/aprendre/Aprendre.jsx',
      '../../sections/gestoria/facturar/Facturacio.jsx'
    ]),
    motiu: 'Ordre del Mestre, 261004: la Gestoria passa de la Wiki a /app/gestoria; el codi es queda al seu carril, amb la seua guarda. 261007: la Facturació entra pel pont i no per ShellGestoria (font del tractor gestoria.tauler).'
  })]
]);
const esPont = (ruta, especificador, ponts = PONTS_GESTORIA) => Boolean(ponts.get(ruta)?.especificadors.includes(especificador));

/* Les infraccions d'un fitxer de producció d'una app, com a «ruta: què». */
function infraccionsDe(ruta, codi, excepcions = EXCEPCIONS_EMMAGATZEMATGE, ponts = PONTS_GESTORIA) {
  const propia = (ruta.match(APP_DE) || [''])[0];
  const potMotor = MAGATZEM.test(ruta) || excepcions.has(ruta);
  const trobades = [];
  for (const especificador of especificadors(codi)) {
    const desti = resol(ruta, especificador);
    if (propia && desti.startsWith(propia)) continue;
    if (IMPORT_VETAT.test(desti)) trobades.push(`import ${especificador}`);
    else if (MOTOR_LOCAL.test(desti)) {
      if (!potMotor) trobades.push(`import ${especificador} fora de magatzem.js`);
    } else if (!PAQUETS.has(desti) && !PERMESOS_DE_FORA.has(desti) && !desti.startsWith(UTILS) && !esPont(ruta, especificador, ponts)) {
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

/* ── L'API pública no arriba a cap app (correcció del 261006, HMR) ──────────
   En desenvolupament, Vite marca com a invalidat, cada vegada que es desa un
   fitxer, tot mòdul que hi arriba per imports, també per import(). Les apps
   es carreguen per import() des del registre (registreApps.js), i host.js i
   el port del backend (que importa host.js amb import()) arriben al
   registre: són ASCENDENTS de totes les apps, com SessionContext i
   IdentitatContext (SessionContext → sessionService → host.js; IdentitatContext
   → backendPort → host.js). Si l'API pública (plataforma/index.js), que
   importen les vistes, en portava algun, desar una vista el tornava a
   carregar amb un createContext nou: React Refresh posava la implementació
   nova al proveïdor muntat (SessionProvider i IdentitatProvider a l'arrel;
   ProveidorApp i ProveidorBar dins de l'app) i els consumidors que no
   s'havien tornat a executar (TopBar, CoreContentProvider, les vistes)
   queien: «useSession ha de ser usat dins de SessionProvider», «useBar
   s'ha de cridar dins de ProveidorBar». En producció no hi ha HMR.
   La regla, sobre la clausura d'imports de plataforma/index.js:
   · la clausura estàtica no importa SessionContext ni IdentitatContext (la
     sessió entra per fontSessio.js, que només importa RutaApps.jsx);
   · la clausura sencera (també import(), require() i import.meta.glob) no
     arriba a cap fitxer de src/apps fora de la plataforma, ni al registre,
     ni a host.js, ni al port del backend. RouterContext i UIContext sí que
     hi són: no arriben a cap app. */
const IMPORT_ESTATIC = /(?:\bfrom\s*|\bimport\s+)(['"`])([^'"`\n]+)\1/g;
const especificadorsEstatics = (codi) => [...codi.matchAll(IMPORT_ESTATIC)].map((m) => m[2]);
const CONTEXTS_DE_L_ARREL = new Set(['src/app/contexts/SessionContext.jsx', 'src/app/contexts/IdentitatContext.jsx']);
const ARRIBA_A_LES_APPS = new Set(['src/apps/plataforma/registreApps.js', 'src/host.js', 'src/data/backendPort.js']);
const esDUnaApp = (ruta) => /^src\/apps\/(?!plataforma\/)/.test(ruta);
const existixAlDisc = (ruta) => existsSync(path.join(ARREL, ruta));

/* El fitxer de codi que hi ha darrere d'un especificador relatiu o amb l'àlies
   @/ (vite.config.js), amb extensió, sense o amb index; o null: un paquet o
   una adreça. */
function fitxerImportat(ruta, especificador, existix) {
  const net = especificador.replace(/\?.*$/, '');
  let desti = null;
  if (net.startsWith('.')) desti = path.posix.normalize(path.posix.join(path.posix.dirname(ruta), net));
  else if (net.startsWith('@/')) desti = `src/${net.slice(2)}`;
  if (!desti) return null;
  return [desti, `${desti}.js`, `${desti}.jsx`, `${desti}/index.js`, `${desti}/index.jsx`]
    .find((candidat) => CODI.test(candidat) && existix(candidat)) || null;
}

/* La clausura d'imports des d'`inici`, com a Map fitxer → qui l'ha importat
   primer (null, l'inici). Sense `dinamics`, només els imports estàtics i les
   reexportacions; amb, també import(), require() i import.meta.glob. */
function clausuraDImports(inici, { dinamics = false, llegix = llig, existix = existixAlDisc } = {}) {
  const vistes = new Map([[inici, null]]);
  const pendents = [inici];
  while (pendents.length) {
    const ruta = pendents.pop();
    const codi = llegix(ruta);
    for (const especificador of (dinamics ? especificadors(codi) : especificadorsEstatics(codi))) {
      const desti = fitxerImportat(ruta, especificador, existix);
      if (desti && !vistes.has(desti)) {
        vistes.set(desti, ruta);
        pendents.push(desti);
      }
    }
  }
  return vistes;
}

/* El camí d'imports des de l'inici fins a `fi`: «a > b > c». */
function camiFins(clausura, fi) {
  const cami = [fi];
  for (let ruta = clausura.get(fi); ruta; ruta = clausura.get(ruta)) cami.unshift(ruta);
  return cami.join(' > ');
}

/* Les infraccions de la regla des d'`inici`, amb el camí que hi porta. */
function infraccionsDeLAPI(inici, opcions = {}) {
  const estatica = clausuraDImports(inici, opcions);
  const sencera = clausuraDImports(inici, { ...opcions, dinamics: true });
  return [
    ...[...estatica.keys()].filter((ruta) => CONTEXTS_DE_L_ARREL.has(ruta)).map((ruta) => `context de l'arrel: ${camiFins(estatica, ruta)}`),
    ...[...sencera.keys()].filter((ruta) => esDUnaApp(ruta) || ARRIBA_A_LES_APPS.has(ruta)).map((ruta) => `arriba a les apps: ${camiFins(sencera, ruta)}`)
  ];
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

  /* D3 continua per a tota la resta de src/apps: només el pont de la Gestoria
     (PONTS_GESTORIA, ordre del Mestre del 261004) hi entra, amb els seus dos
     especificadors. Els Tractors, cap. */
  test('cap app importa la Gestoria ni els Tractors (D3), llevat del pont declarat de la Gestoria', () => {
    const trobats = APPS.flatMap((fitxer) => especificadors(llig(fitxer))
      .filter((e) => /sections\/(?:gestoria|tractors)\//.test(e) && !esPont(fitxer, e)).map((e) => `${fitxer}: ${e}`));
    expect(trobats).toEqual([]);
  });

  test('el pont de la Gestoria és just: existix, porta exactament els seus especificadors, dinàmics i dins de DEV, i cap dels Tractors', () => {
    expect([...PONTS_GESTORIA.keys()]).toEqual(['src/apps/gestoria/AppGestoria.jsx']);
    for (const [ruta, { especificadors: llista, motiu }] of PONTS_GESTORIA) {
      expect(APPS, ruta).toContain(ruta);
      expect(motiu.length, ruta).toBeGreaterThan(40);
      expect(llista.every((e) => /^\.\.\/\.\.\/sections\/gestoria\//.test(e)), ruta).toBe(true);
      const codi = llig(ruta);
      const delsCarrils = (text) => especificadors(text).filter((e) => /sections\/(?:gestoria|tractors)\//.test(e));
      /* Tots dins de la constant de DEV, per import(), i fora d'ella cap. */
      const inici = codi.indexOf('const VISTES = import.meta.env.DEV ? Object.freeze({');
      const fi = codi.indexOf('}) : null;', inici);
      expect(inici, ruta).toBeGreaterThan(-1);
      expect(fi, ruta).toBeGreaterThan(inici);
      const bloc = codi.slice(inici, fi);
      expect(delsCarrils(bloc)).toEqual([...llista]);
      expect([...bloc.matchAll(/lazyRoute\(\(\) => import\('\.\.\/\.\.\/sections\/gestoria\//g)]).toHaveLength(llista.length);
      expect(delsCarrils(codi.slice(0, inici) + codi.slice(fi))).toEqual([]);
    }
  });

  test('el pont no s’estén: ni a un altre fitxer, ni a un altre especificador, ni als Tractors (casos sintètics)', () => {
    const PONT = 'src/apps/gestoria/AppGestoria.jsx';
    const shell = "const C = lazy(() => import('../../sections/gestoria/tauler/ShellGestoria.jsx'));";
    expect(infraccionsDe(PONT, shell)).toEqual([]);
    expect(infraccionsDe('src/apps/gestoria/Altre.jsx', shell))
      .toEqual(['src/apps/gestoria/Altre.jsx: import ../../sections/gestoria/tauler/ShellGestoria.jsx fora de la llista blanca']);
    expect(infraccionsDe('src/apps/bar/AppBar.jsx', shell)).toHaveLength(1);
    expect(infraccionsDe(PONT, "import C from '../../sections/gestoria/ContenidorGestoria.jsx';"))
      .toEqual([`${PONT}: import ../../sections/gestoria/ContenidorGestoria.jsx fora de la llista blanca`]);
    expect(infraccionsDe(PONT, "const T = lazy(() => import('../../sections/tractors/PanellTractors.jsx'));"))
      .toEqual([`${PONT}: import ../../sections/tractors/PanellTractors.jsx fora de la llista blanca`]);
    /* La resta de la regla s'aplica igual al pont. */
    expect(infraccionsDe(PONT, ['await fet', 'ch(adreca);'].join(''))).toEqual([`${PONT}: fetch`]);
    expect(esPont(PONT, '../../sections/gestoria/aprendre/Aprendre.jsx')).toBe(true);
    expect(esPont(PONT, '../../sections/gestoria/aprendre/Aprendre.jsx', new Map())).toBe(false);
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

describe('l’API pública no arriba a cap app (correcció del 261006, HMR)', () => {
  const API = 'src/apps/plataforma/index.js';

  test('plataforma/index.js: cap context de l’arrel a la clausura i, sencera, cap app, ni el registre, ni host.js, ni el port', () => {
    expect(infraccionsDeLAPI(API)).toEqual([]);
  });

  test('la porta mira de veres: la clausura porta el pont, el context de l’app i la closca; la font i el context de l’amfitrió, no, i la porta els detecta', () => {
    const estatica = clausuraDImports(API);
    expect([...estatica.keys()]).toEqual(expect.arrayContaining([
      'src/apps/plataforma/sessioApp.js', 'src/apps/plataforma/ContextApp.jsx', 'src/apps/plataforma/ClosaAplicacio.jsx',
      'src/app/contexts/RouterContext.jsx', 'src/app/contexts/UIContext.jsx'
    ]));
    expect(estatica.has('src/apps/plataforma/fontSessio.js')).toBe(false);
    expect(estatica.has('src/apps/plataforma/PlataformaContext.jsx')).toBe(false);
    /* Sondes sobre fitxers reals: la font llig els contexts de l'arrel i el context de l'amfitrió porta el registre i el port. */
    const font = infraccionsDeLAPI('src/apps/plataforma/fontSessio.js');
    expect(font).toEqual(expect.arrayContaining([
      "context de l'arrel: src/apps/plataforma/fontSessio.js > src/app/contexts/SessionContext.jsx",
      "context de l'arrel: src/apps/plataforma/fontSessio.js > src/app/contexts/IdentitatContext.jsx"
    ]));
    expect(font.some((trobada) => trobada.startsWith('arriba a les apps: ') && trobada.endsWith(' > src/host.js'))).toBe(true);
    expect(infraccionsDeLAPI('src/apps/plataforma/PlataformaContext.jsx')).toEqual(expect.arrayContaining([
      'arriba a les apps: src/apps/plataforma/PlataformaContext.jsx > src/apps/plataforma/registreApps.js',
      'arriba a les apps: src/apps/plataforma/PlataformaContext.jsx > src/data/backendPort.js'
    ]));
  });

  test('RouterContext i UIContext, que la clausura sí que importa, no arriben a cap app', () => {
    for (const context of ['src/app/contexts/RouterContext.jsx', 'src/app/contexts/UIContext.jsx']) {
      expect(infraccionsDeLAPI(context), context).toEqual([]);
    }
  });

  test('la font de la sessió (fontSessio.js) només l’importa RutaApps.jsx', () => {
    const FONT = 'src/apps/plataforma/fontSessio.js';
    const importadors = fitxersDe('src', CODI).filter((f) => !esProva(f) && f !== FONT)
      .filter((f) => especificadors(llig(f)).some((e) => fitxerImportat(f, e, existixAlDisc) === FONT));
    expect(importadors).toEqual(['src/apps/plataforma/RutaApps.jsx']);
  });
});

describe('la porta de l’API pública detecta (grafs sintètics en memòria)', () => {
  const API = 'src/apps/plataforma/index.js';
  const graf = (fitxers) => ({ llegix: (ruta) => fitxers[ruta], existix: (ruta) => Object.hasOwn(fitxers, ruta) });
  const finals = (trobades) => trobades.filter((t) => t.startsWith('arriba a les apps: ')).map((t) => t.split(' > ').pop()).sort();
  /* La cadena de veres, en miniatura: els contexts de l'arrel arriben a host.js
     (per import()), host.js al registre i el registre a l'app (per import()). */
  const CADENA = Object.freeze({
    'src/app/contexts/SessionContext.jsx': "import { getSessionState } from '../../data/sessionService.js';",
    'src/app/contexts/IdentitatContext.jsx': "import { listMyOrganizations } from '../../data/backendPort.js';",
    'src/data/sessionService.js': "const llest = () => import('../host.js');",
    'src/data/backendPort.js': "export const recull = async () => (await import('../host.js')).quanLlest();",
    'src/host.js': "import { registre } from './apps/plataforma/registreApps.js';",
    'src/apps/plataforma/registreApps.js': "import manifestBar from '../bar/manifest.js';",
    'src/apps/bar/manifest.js': "export default { carrega: () => import('./AppBar.jsx') };",
    'src/apps/bar/AppBar.jsx': 'export default function AppBar() { return null; }',
    'src/app/contexts/RouterContext.jsx': "import { resolRuta } from './politicaRouter.js';",
    'src/app/contexts/politicaRouter.js': 'export const resolRuta = (ruta) => ruta;'
  });
  const TOTA_LA_CADENA = ['src/apps/bar/AppBar.jsx', 'src/apps/bar/manifest.js', 'src/apps/plataforma/registreApps.js', 'src/data/backendPort.js', 'src/host.js'];

  test('el pont d’abans: index.js → sessioApp.js → els dos contexts de l’arrel, i per ells, l’app', () => {
    const trobades = infraccionsDeLAPI(API, graf({
      ...CADENA,
      [API]: "export { useSessioApp } from './sessioApp.js';",
      'src/apps/plataforma/sessioApp.js': [
        "import { useSessioOpcional } from '../../app/contexts/SessionContext';",
        "import { useIdentitatOpcional } from '../../app/contexts/IdentitatContext';"
      ].join('\n')
    }));
    expect(trobades.filter((t) => t.startsWith("context de l'arrel"))).toEqual([
      "context de l'arrel: src/apps/plataforma/index.js > src/apps/plataforma/sessioApp.js > src/app/contexts/SessionContext.jsx",
      "context de l'arrel: src/apps/plataforma/index.js > src/apps/plataforma/sessioApp.js > src/app/contexts/IdentitatContext.jsx"
    ]);
    expect(finals(trobades)).toEqual(TOTA_LA_CADENA);
  });

  test('l’àlies @/ i un import sense extensió', () => {
    expect(infraccionsDeLAPI(API, graf({ ...CADENA, [API]: "import { useIdentitatOpcional } from '@/app/contexts/IdentitatContext';" })))
      .toEqual(expect.arrayContaining(["context de l'arrel: src/apps/plataforma/index.js > src/app/contexts/IdentitatContext.jsx"]));
  });

  test('una reexportació en cadena (export * from) fins a SessionContext', () => {
    const trobades = infraccionsDeLAPI(API, graf({
      ...CADENA,
      [API]: "export * from './a.js';",
      'src/apps/plataforma/a.js': "export * from './b.js';",
      'src/apps/plataforma/b.js': "import { ESTAT } from '../../app/contexts/SessionContext.jsx';"
    }));
    expect(trobades).toContain("context de l'arrel: src/apps/plataforma/index.js > src/apps/plataforma/a.js > src/apps/plataforma/b.js > src/app/contexts/SessionContext.jsx");
  });

  test('el context de l’amfitrió: el port del backend arriba a host.js per import(), que la clausura estàtica no seguix i la sencera sí', () => {
    const fitxers = graf({
      ...CADENA,
      [API]: "export { useApp } from './PlataformaContext.jsx';",
      'src/apps/plataforma/PlataformaContext.jsx': "import { teCapacitat } from '../../data/backendPort.js';"
    });
    const trobades = infraccionsDeLAPI(API, fitxers);
    expect(trobades.filter((t) => t.startsWith("context de l'arrel"))).toEqual([]);
    expect(finals(trobades)).toEqual(TOTA_LA_CADENA);
    expect(clausuraDImports(API, fitxers).has('src/host.js')).toBe(false);
    expect(clausuraDImports(API, { ...fitxers, dinamics: true }).has('src/host.js')).toBe(true);
  });

  test('una app carregada per import() des de l’API', () => {
    expect(infraccionsDeLAPI(API, graf({ ...CADENA, [API]: "export const carregaBar = () => import('../bar/AppBar.jsx');" })))
      .toEqual(['arriba a les apps: src/apps/plataforma/index.js > src/apps/bar/AppBar.jsx']);
  });

  test('no confon el router, un comentari ni un text amb el nom d’un context', () => {
    expect(infraccionsDeLAPI(API, graf({
      ...CADENA,
      [API]: [
        "import { useLocation } from '../../app/contexts/RouterContext';",
        '// La sessió la llig fontSessio.js, no SessionContext.',
        "export const nom = 'IdentitatContext';"
      ].join('\n')
    }))).toEqual([]);
  });
});
