/**
 * consola-iaia.mjs — Middleware només-dev que agrega l'estat de l'eixam.
 *
 * Serveix:
 *   GET /__iaia/consola.json  rebuts Matrix, consums de tòkens, inventari de
 *                             skills (manifest vs disc), segell i diari immunitari.
 *   GET /__iaia/mapa.json     el Mapa del Mas (sdp.mapa.v1), compilat en cada
 *                             petició per tooling/brain/mapa-consola.mjs.
 *   GET /__iaia/empaquetats.json  P1-35 (pla 261028_1526 §3.5.2) · les versions
 *                             que declara cada plataforma i els NOMS dels
 *                             artefactes de ../_builds_de_poble
 *                             (sdp.empaquetats.v1; src/sections/consola/empaquetats.js).
 *   GET /__iaia/govern.json   ordre del Mestre del 30-10-2026 (B2) · la matriu
 *                             viva del Govern del Mestre (sdp.govern.v1),
 *                             compilada en cada petició per
 *                             tooling/brain/fonts-govern.mjs des del Llibre
 *                             Mestre i el HEAD; un error, 500 amb JSON
 *                             { schema, codi, error } (servixGovern).
 *
 * Gauntlet f4b (govern, «text-falta-un-pas-de-maria-ara-fals») · Derogat:
 * «DESTÍ: … (substitució sencera; l'única diferència amb l'original és la
 * ruta RUTA_MAPA i el seu import)», d'abans de les rutes dels empaquetats i
 * del Govern.
 *
 * `apply: 'serve'` → el build de producció no coneix estes rutes.
 * No s'escriu res a disc. No es fa cap crida de xarxa.
 *
 * Decisió del Mestre (31-10-2026) · consolaIaia() torna dos connectors: el
 * de desenvolupament d'ací dalt (consolaIaiaDev, les quatre rutes vives) i
 * sdp:consola-instantania (apply 'build', instantaniaConsola, al final del
 * fitxer), que emet a dist/__iaia/ la instantània SANEJADA de les quatre
 * fonts amb els mateixos productors (tooling/vite/instantania-consola.mjs).
 */
import fs from 'node:fs';
import path from 'node:path';
import { loadEnv } from 'vite';
import { PROJECT_DIR, AGENTS_DIR, SKILLS_DIR } from '../wiki/lib/project_paths.mjs';
import { parseFrontmatter } from '../wiki/lib/frontmatter.mjs';
import { recullMapa } from '../brain/mapa-consola.mjs';

export const RUTA_CONSOLA = '/__iaia/consola.json';
export const RUTA_MAPA = '/__iaia/mapa.json';
export const RUTA_EMPAQUETATS = '/__iaia/empaquetats.json';
export const ESQUEMA_EMPAQUETATS = 'sdp.empaquetats.v1';

const llig = (ruta) => { try { return fs.readFileSync(ruta, 'utf8'); } catch { return null; } };

const parseJsonl = (txt) => {
  if (txt === null) return { items: [], font: { estat: 'absent' } };
  const items = [];
  let descartades = 0;
  for (const l of txt.split('\n').filter(Boolean)) {
    try { items.push(JSON.parse(l)); } catch { descartades++; }
  }
  return { items, font: { estat: 'ok', línies_descartades: descartades, h: Date.now() } };
};

/* Correcció 261026 («El pols del cervell: No s’han pogut llegir les dades») ·
   El parser mínim d'abans (còpia d'un tooling/brain/matrix.mjs que ja no el
   porta) no acceptava claus amb punt: les llistes de `contracte.llig:` i
   `contracte.escriu:` s'enganxaven a la clau anterior. En core-automillora,
   core-estrategia-ia i core-telemetria-huma eixa clau és `description`, que
   arribava com a llista, i normalitza (src/sections/consola/consolaContent.js)
   rebutjava consola.json sencer. Ara es llig amb l'únic parser lleuger del
   frontmatter (tooling/wiki/lib/frontmatter.mjs), el de cataleg_skills.mjs i
   build_skills_index.mjs, que coneix les claus amb punt i els blocs `>`/`|`. */
const frontmatter = (txt) => parseFrontmatter(txt ?? '').data;

export function recullConsola() {
  const diariData = parseJsonl(llig(path.join(AGENTS_DIR, '.diari_sessio.jsonl')));
  const diari = diariData.items;

  const rebuts = diari
    .filter((e) => e.tipus === 'matrix.rebut')
    .map((e) => ({
      t: e.t,
      peticio: e.peticio_sha256 ?? null,
      protocols: e.protocols ?? [],
      fonts: (e.fonts ?? []).map((f) => ({ ruta: f.ruta, sha256: f.sha256 }))
    }))
    .reverse();

  /* Contracte proposat (§3.6). Hui el diari no en té cap: la UI ho dirà. */
  const consums = diari.filter((e) => e.tipus === 'consum.tokens');

  const manifest = llig(path.join(AGENTS_DIR, 'manifest.yaml')) ?? '';
  const alManifest = [...manifest.matchAll(/^\s+-\s+skills\/([^/]+)\/SKILL\.md\s*$/gm)].map((m) => m[1]);
  const alDisc = fs.existsSync(SKILLS_DIR)
    ? fs.readdirSync(SKILLS_DIR).filter((n) => fs.existsSync(path.join(SKILLS_DIR, n, 'SKILL.md')))
    : [];

  const skills = [...new Set([...alManifest, ...alDisc])].sort().map((nom) => {
    const fm = frontmatter(llig(path.join(SKILLS_DIR, nom, 'SKILL.md')));
    return {
      nom,
      alManifest: alManifest.includes(nom),
      alDisc: alDisc.includes(nom),
      estat: fm.status ?? fm.estat ?? null,
      core: fm.core === 'true',
      descripcio: fm.description ?? ''
    };
  });

  let segell = null;
  try { segell = JSON.parse(llig(path.join(AGENTS_DIR, 'SKILLS_SEAL.json'))); } catch { /* sense segell */ }

  let credits = null;
  try {
    const txtCredits = llig(path.join(AGENTS_DIR, 'credits.json'));
    if (txtCredits) credits = JSON.parse(txtCredits);
  } catch { /* no hi ha */ }

  let estrategia_consum = null;
  try {
    estrategia_consum = llig(path.join(AGENTS_DIR, 'estrategia_consum.txt'));
  } catch { /* no hi ha */ }

  const immunitariData = parseJsonl(llig(path.join(PROJECT_DIR, '.immunitari', 'journal.ndjson')));
  const immunitari = immunitariData.items;

  return {
    generat: new Date().toISOString(),
    rebuts,
    consums,
    credits,
    estrategia_consum,
    skills,
    segell,
    immunitari: { operacions: immunitari.length, ultima: immunitari.at(-1) ?? null },
    fonts: { diari: diariData.font, immunitari: immunitariData.font }
  };
}

/* ── P1-35 · Empaquetats i llançament ────────────────────────────────────
   Decisió 6 del Mestre (261028): la Versió Canònica del Sistema és la de
   package.json. Ací es llig el que DECLARA cada plataforma (un camp, mai el
   fitxer sencer: versionName/versionCode de build.gradle, MARKETING_VERSION i
   CURRENT_PROJECT_VERSION de cada project.pbxproj, la capçalera Version del
   connector i `versio` del seu canal builds/stable.json) i els NOMS dels
   artefactes de ../_builds_de_poble/<plataforma>/. Cap artefacte s'obri, cap
   enllaç simbòlic es seguix, cap valor de l'entorn es llig ni s'envia: la
   carpeta viu al costat de les claus de pujada. Un valor fora de la regla
   (x.y.z amb sufix, build de xifres) no ix: el client no l'ha de posar en
   cap ordre. Es llig en cada petició, com el Mapa: no es guarda res. */
const VERSIO = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?$/;
const BUILD = /^\d{1,9}$/;
const ARTEFACTE = /\.(?:aab|apk|ipa|xcarchive|zip)$/;
const MAX_NOM = 200;
const PLATAFORMES_DE_BUILDS = Object.freeze(['android', 'ios', 'wordpress']);
const FORA_DELS_PROJECTES = new Set(['Pods', 'node_modules', 'DerivedData', 'build']);

const valids = (valors, regla) => [...new Set(valors.filter((v) => typeof v === 'string' && regla.test(v)))];
const jsonDe = (ruta) => { try { return JSON.parse(llig(ruta) ?? 'null'); } catch { return null; } };
const relatiu = (arrel, ruta) => path.relative(arrel, ruta).split(path.sep).join('/');

/** Els noms (mai el contingut) dels artefactes d'una carpeta: fitxers i carpetes (.xcarchive), sense enllaços. */
export function nomsDArtefactes(carpeta) {
  try {
    return fs.readdirSync(carpeta, { withFileTypes: true })
      .filter((e) => (e.isFile() || e.isDirectory()) && !e.name.startsWith('.') && e.name.length <= MAX_NOM && ARTEFACTE.test(e.name))
      .map((e) => e.name)
      .sort();
  } catch {
    return [];
  }
}

/* Els project.pbxproj d'ios/ (cada *.xcodeproj), sense dependències ni derivats. */
function pbxprojs(carpeta, fondaria = 0) {
  if (fondaria > 3) return [];
  let entrades;
  try { entrades = fs.readdirSync(carpeta, { withFileTypes: true }); } catch { return []; }
  return entrades.filter((e) => e.isDirectory() && !FORA_DELS_PROJECTES.has(e.name)).flatMap((e) => {
    const ruta = path.join(carpeta, e.name);
    if (!e.name.endsWith('.xcodeproj')) return pbxprojs(ruta, fondaria + 1);
    const projecte = path.join(ruta, 'project.pbxproj');
    return fs.existsSync(projecte) ? [projecte] : [];
  });
}

const camps = (text, regla) => [...(text ?? '').matchAll(regla)].map((m) => m[1].trim());

/**
 * sdp.empaquetats.v1. `arrel` és l'arrel del repositori; `carpeta`, la de
 * builds (per a les proves). Mai llança per un fitxer que falte: el que no
 * es pot llegir no hi és, i el client ho diu.
 */
export function recullEmpaquetats(arrel = PROJECT_DIR, { carpeta = path.resolve(arrel, '..', '_builds_de_poble'), ara = new Date() } = {}) {
  const canonica = jsonDe(path.join(arrel, 'package.json'))?.version ?? null;
  const gradle = llig(path.join(arrel, 'android', 'app', 'build.gradle'));
  const projectes = pbxprojs(path.join(arrel, 'ios')).sort();
  const textosIos = projectes.map((ruta) => llig(ruta));
  const php = llig(path.join(arrel, 'wordpress-plugin', 'socdepoble-enxufe.php'));
  const estable = jsonDe(path.join(arrel, 'wordpress-plugin', 'builds', 'stable.json'))?.versio;
  const artefactes = Object.fromEntries(PLATAFORMES_DE_BUILDS.map((id) => [id, nomsDArtefactes(path.join(carpeta, id))]));
  let ambCarpeta = false;
  try { ambCarpeta = fs.statSync(carpeta).isDirectory(); } catch { /* sense carpeta de builds */ }
  return {
    schema: ESQUEMA_EMPAQUETATS,
    generat: ara.toISOString(),
    canonica: typeof canonica === 'string' && VERSIO.test(canonica) ? canonica : null,
    carpeta: ambCarpeta,
    plataformes: {
      android: {
        versions: valids(camps(gradle, /^[ \t]*versionName[ \t]+"([^"\n]+)"/gm), VERSIO),
        builds: valids(camps(gradle, /^[ \t]*versionCode[ \t]+(\d+)[ \t]*$/gm), BUILD),
        font: 'android/app/build.gradle',
        artefactes: artefactes.android
      },
      ios: {
        versions: valids(textosIos.flatMap((t) => camps(t, /^[ \t]*MARKETING_VERSION = ([^;\n]+);/gm)), VERSIO),
        builds: valids(textosIos.flatMap((t) => camps(t, /^[ \t]*CURRENT_PROJECT_VERSION = ([^;\n]+);/gm)), BUILD),
        font: projectes.length ? projectes.map((ruta) => relatiu(arrel, ruta)).join(', ') : null,
        artefactes: artefactes.ios
      },
      pwa: {
        versions: valids([canonica], VERSIO),
        font: 'package.json',
        artefactes: []
      },
      wordpress: {
        versions: valids(camps(php, /^[ \t*]*Version:[ \t]*(\S+)[ \t]*$/gm), VERSIO),
        estable: typeof estable === 'string' && VERSIO.test(estable) ? estable : null,
        font: 'wordpress-plugin/socdepoble-enxufe.php',
        artefactes: artefactes.wordpress
      }
    }
  };
}

/* Només el mateix ordinador: la Consola descriu la maquinària interna. */
function local(req) {
  const ip = req.socket.remoteAddress;
  return req.method === 'GET' && (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1');
}

function servix(res, estat, cos) {
  res.statusCode = estat;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(cos));
}

/* ── GET /__iaia/govern.json · ordre del Mestre del 30-10-2026 (B2) ───────
   La matriu viva del Govern del Mestre (sdp.govern.v1, la forma que espera
   normalitzaGovern de src/sections/consola/govern/governContent.js),
   compilada en cada petició per tooling/brain/fonts-govern.mjs a partir del
   Llibre Mestre i del HEAD: només lectura del Llibre i de git, cap
   escriptura. Camí de govern escrit per ordre explícita del Mestre.
   El compilador es carrega pel seu camí amb ?v=<mtime> (el patró de
   generadorDe, federacio-iaia.mjs): no és cap dependència de la
   configuració, i un canvi seu es veu sense reiniciar el servidor.
   Gauntlet f4b (govern, «vocabulari-en-cache») · El vocabulari de la
   Consola (estatDeStatus de src/sections/consola/govern/matriuGovern.js)
   també: el compilador l'importa sense marca, i Node el guardava per a tota
   la vida del servidor mentre el client el rep nou. La guarda contra el verd
   sense commit (estatDelLlibre) rep el d'ara (vocabulariGovern).
   Un error controlat (Llibre absent, git absent, taula mal formada) es diu
   amb 500 i un JSON { schema, codi, error } amb el text fix del compilador,
   sense camins; qualsevol altre, amb un text fix. Mai l'HTML de l'SPA: la
   Consola el pinta com a error, amb el text del compilador (carregaGovern),
   no com a absència. */
export const RUTA_GOVERN = '/__iaia/govern.json';
export const ESQUEMA_GOVERN = 'sdp.govern.v1';
const COMPILADOR_GOVERN = new URL('../brain/fonts-govern.mjs', import.meta.url);
const VOCABULARI_GOVERN = new URL('../../src/sections/consola/govern/matriuGovern.js', import.meta.url);
export const ERROR_GOVERN_INTERN = 'No s’ha pogut compilar la matriu del Govern.';

/** Un mòdul pel seu camí, amb la marca del seu mtime: un canvi seu es carrega de nou sense reiniciar el servidor. */
export const carregaAmbMarca = (url) => import(`${url.href}?v=${Math.trunc(fs.statSync(url).mtimeMs)}`);
/** El compilador del Govern, tornat a carregar quan el fitxer canvia. */
export const compiladorGovern = () => carregaAmbMarca(COMPILADOR_GOVERN);
/** El vocabulari de la Consola (matriuGovern.js), tornat a carregar quan el fitxer canvia. */
export const vocabulariGovern = () => carregaAmbMarca(VOCABULARI_GOVERN);

/** La matriu del Govern compilada ara (o a l'instant `ara`, per a la instantània): el compilador i el vocabulari d'ara. */
export async function compilaGovern({ arrel = PROJECT_DIR, compilador = compiladorGovern, vocabulari = vocabulariGovern, ara } = {}) {
  const [{ recullGovern }, { estatDeStatus }] = await Promise.all([compilador(), vocabulari()]);
  return recullGovern(arrel, ara === undefined ? { estatDeStatus } : { ara: new Date(ara), estatDeStatus });
}

/** Respon /__iaia/govern.json: 200 amb la matriu, o 500 amb l'error en JSON. */
export async function servixGovern(res, { arrel = PROJECT_DIR, compilador = compiladorGovern, vocabulari = vocabulariGovern } = {}) {
  try {
    servix(res, 200, await compilaGovern({ arrel, compilador, vocabulari }));
  } catch (e) {
    // Pel nom i no per instanceof: cada versió del compilador porta la seua classe.
    const controlat = e?.name === 'ErrorGovern' && typeof e.codi === 'string' && typeof e.message === 'string';
    servix(res, 500, { schema: ESQUEMA_GOVERN, codi: controlat ? e.codi : 'intern', error: controlat ? e.message : ERROR_GOVERN_INTERN });
  }
}

/* `arrelGovern`, `compiladorGovern` i `vocabulariGovern` són per a les proves;
   sense opcions, el connector de sempre més la ruta del Govern.
   Decisió del Mestre (31-10-2026) · El connector de desenvolupament es diu
   consolaIaiaDev; consolaIaia() (vite.config.js) el torna amb el del build. */
export function consolaIaiaDev({
  arrelGovern = PROJECT_DIR, compiladorGovern: compilador = compiladorGovern, vocabulariGovern: vocabulari = vocabulariGovern
} = {}) {
  return {
    name: 'sdp:consola-iaia',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(RUTA_CONSOLA, (req, res) => {
        if (!local(req)) {
          res.statusCode = 403;
          res.end('Forbidden');
          return;
        }
        servix(res, 200, recullConsola());
      });
      server.middlewares.use(RUTA_MAPA, (req, res) => {
        if (!local(req)) {
          res.statusCode = 403;
          res.end('Forbidden');
          return;
        }
        // Un error del compilador es diu amb 500: la UI el pinta com a error, no com a buit.
        try { servix(res, 200, recullMapa(PROJECT_DIR)); }
        catch (e) { servix(res, 500, { error: e.message }); }
      });
      /* P1-35 · Només noms i versions declarades. Un error es diu amb 500 i
         un text fix: el missatge d'un error de disc portaria camins. */
      server.middlewares.use(RUTA_EMPAQUETATS, (req, res) => {
        if (!local(req)) {
          res.statusCode = 403;
          res.end('Forbidden');
          return;
        }
        try { servix(res, 200, recullEmpaquetats(PROJECT_DIR)); }
        catch { servix(res, 500, { error: 'No s’han pogut llegir els empaquetats.' }); }
      });
      // Ordre del Mestre del 30-10-2026 (B2) · La matriu viva del Govern del Mestre (servixGovern).
      server.middlewares.use(RUTA_GOVERN, (req, res) => {
        if (!local(req)) {
          res.statusCode = 403;
          res.end('Forbidden');
          return;
        }
        servixGovern(res, { arrel: arrelGovern, compilador, vocabulari });
      });
    }
  };
}

/* ── Decisió del Mestre (31-10-2026) · La instantània sanejada del build ──
   «Sí, vull que la web publicada mostre una instantània sanejada amb totes les
   dades reals de la Consola a qualsevol usuari» (prompt 261030_2208, T2.2).
   El build web emet a dist/__iaia/ les quatre fonts que servix el middleware,
   amb ELS MATEIXOS productors (recullConsola, recullMapa, compilaGovern i
   recullEmpaquetats), passades pel sanejador de
   tooling/vite/instantania-consola.mjs: fail-closed, un secret o una dada que
   no sap emmascarar atura el build sense mostrar el valor. El sanejador es
   carrega pel seu camí dins del ganxo (carregaAmbMarca): no és cap dependència
   de la configuració, i un canvi seu no reinicia el servidor de desenvolupament.
   El connector segella al bundle import.meta.env.SDP_CONSOLA_INSTANTANIA ('1'):
   la Consola publicada només demana /__iaia/*.json si el build l'ha emesa
   (src/sections/consola/fontsConsola.js). Ni vite.standalone.config.js
   (WordPress) ni vite.natiu.config.js registren consolaIaia(): no porten
   instantània i no la demanen. Un build SSR no n'emet. */
const MODUL_INSTANTANIA = new URL('./instantania-consola.mjs', import.meta.url);
/** La bandera que el build web segella al bundle quan emet la instantània. */
export const BANDERA_INSTANTANIA = 'import.meta.env.SDP_CONSOLA_INSTANTANIA';

/* consola.json data la lectura amb el rellotge d'ara (generat i fonts.*.h);
   a la instantània, amb el de la instantània (SOURCE_DATE_EPOCH en un build
   reproduïble): dos builds de la mateixa font donen els mateixos bytes. */
const ambRellotge = (consola, ara) => ({
  ...consola,
  generat: new Date(ara).toISOString(),
  fonts: Object.fromEntries(Object.entries(consola?.fonts ?? {})
    .map(([clau, font]) => [clau, font && typeof font === 'object' && 'h' in font ? { ...font, h: ara } : font]))
});

/* Gauntlet f9 (F7-source-date-epoch-pinta-tota-la-matriu-obsoleta) · Cap temps
   de paret de la instantània passa del seu rellotge: es fixa a l'instant de la
   instantània (la regla de reproducible-builds per als mtime). La matriu data
   `at` amb el mtime del Llibre; en un build amb SOURCE_DATE_EPOCH sobre una
   còpia neta el Llibre és posterior al commit, i la Consola publicada (que
   jutja la matriu amb el rellotge de la instantània) ho pintaria tot obsolet
   per «data futura». Sense SOURCE_DATE_EPOCH el rellotge és el d'ara i no
   canvia res. */
const fixaAlRellotge = (iso, ara) => (typeof iso === 'string' && Date.parse(iso) > ara ? new Date(ara).toISOString() : iso);
const ambAt = (part, ara) => (part && typeof part === 'object' && !Array.isArray(part) && 'at' in part ? { ...part, at: fixaAlRellotge(part.at, ara) } : part);
/** La matriu del Govern amb `mcr.at` i `trasllat.at` fixats a l'instant `ara` si el passen. */
export const governAlRellotge = (govern, ara) => (govern && typeof govern === 'object' && !Array.isArray(govern)
  ? { ...govern, mcr: ambAt(govern.mcr, ara), trasllat: ambAt(govern.trasllat, ara) }
  : govern);

/** Els productors de la instantània: els del middleware, amb el rellotge `ara` (ms). */
export function productorsDeLaInstantania({ arrel = PROJECT_DIR, ara = Date.now(), compilador = compiladorGovern, vocabulari = vocabulariGovern } = {}) {
  return {
    consola: () => ambRellotge(recullConsola(), ara),
    mapa: () => recullMapa(arrel, { ara }),
    govern: async () => governAlRellotge(await compilaGovern({ arrel, compilador, vocabulari, ara }), ara),
    empaquetats: () => recullEmpaquetats(arrel, { ara: new Date(ara) })
  };
}

/** El connector del build web: emet __iaia/<font>.json sanejats i segella la bandera. `arrel` i `productors` són per a les proves. */
export function instantaniaConsola({ arrel = null, productors = productorsDeLaInstantania } = {}) {
  let configuracio = null;
  return {
    name: 'sdp:consola-instantania',
    apply: 'build',
    config(config) {
      if (config?.build?.ssr) return undefined;
      return { define: { [BANDERA_INSTANTANIA]: JSON.stringify('1') } };
    },
    configResolved(config) { configuracio = config; },
    async generateBundle() {
      if (!configuracio || configuracio.build?.ssr) return;
      const arrelDelProjecte = arrel ?? configuracio.root;
      const modul = await carregaAmbMarca(MODUL_INSTANTANIA);
      const carpetaEntorn = typeof configuracio.envDir === 'string' ? configuracio.envDir : arrelDelProjecte;
      const ara = modul.instantDeLaInstantania(process.env);
      const { fitxers, recompte, errors } = await modul.construeixInstantania({
        productors: productors({ arrel: arrelDelProjecte, ara }),
        agulles: modul.agullesDeLEntorn({ entorn: loadEnv(configuracio.mode, carpetaEntorn, ''), arrel: arrelDelProjecte })
      });
      for (const [fileName, source] of fitxers) this.emitFile({ type: 'asset', fileName, source });
      const emmascarats = Object.entries(recompte).map(([classe, n]) => `${n} ${classe}`).join(', ') || 'res';
      configuracio.logger.info(`[sdp:consola-instantania] ${fitxers.size} fonts a ${modul.CARPETA_INSTANTANIA}/ · emmascarat: ${emmascarats}`);
      for (const { font, codi } of errors) configuracio.logger.warn(`[sdp:consola-instantania] ${font}.json ix com a error (${codi}): la Consola publicada ho dirà.`);
    }
  };
}

/** vite.config.js: el connector de desenvolupament i el de la instantània del build. */
export default function consolaIaia(opcions = {}) {
  return [consolaIaiaDev(opcions), instantaniaConsola()];
}
