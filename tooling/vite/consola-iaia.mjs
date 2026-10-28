/**
 * consola-iaia.mjs — Middleware només-dev que agrega l'estat de l'eixam.
 *
 * DESTÍ: tooling/vite/consola-iaia.mjs (substitució sencera; l'única
 * diferència amb l'original és la ruta RUTA_MAPA i el seu import).
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
 *
 * `apply: 'serve'` → el build de producció no coneix estes rutes.
 * No s'escriu res a disc. No es fa cap crida de xarxa.
 */
import fs from 'node:fs';
import path from 'node:path';
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

export default function consolaIaia() {
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
    }
  };
}
