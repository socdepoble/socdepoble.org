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
 *   POST /__iaia/botigues/publica-tot        IDEA-60 (T1, prompt 261102_1532) ·
 *                             arranca el corredor Jarvis (scripts/botigues/
 *                             publica-tot.mjs) i torna 202 amb el progrés
 *                             inicial (sdp.jarvis.publica.v1).
 *   GET  /__iaia/botigues/publica-tot.json   el progrés del corredor d'ara.
 *
 * Gauntlet f4b (govern, «text-falta-un-pas-de-maria-ara-fals») · Derogat:
 * «DESTÍ: … (substitució sencera; l'única diferència amb l'original és la
 * ruta RUTA_MAPA i el seu import)», d'abans de les rutes dels empaquetats i
 * del Govern.
 *
 * `apply: 'serve'` → el build de producció no coneix estes rutes.
 * No s'escriu res a disc. No es fa cap crida de xarxa. L'única escriptura
 * indirecta és la del corredor Jarvis (un procés fill, mai un intèrpret),
 * que només arranca un POST del mateix ordinador, del mateix origen
 * (Origin i Sec-Fetch-Site: cap pàgina de fora oberta al navegador pot
 * arrancar-lo per CSRF) i amb cos application/json, en desenvolupament.
 *
 * Decisió del Mestre (31-10-2026) · consolaIaia() torna dos connectors: el
 * de desenvolupament d'ací dalt (consolaIaiaDev, les quatre rutes vives i el
 * corredor Jarvis) i sdp:consola-instantania (apply 'build',
 * instantaniaConsola, al final del fitxer), que emet a dist/__iaia/ la
 * instantània SANEJADA de les quatre fonts amb els mateixos productors
 * (tooling/vite/instantania-consola.mjs). El corredor no té instantània: és
 * una acció, no una font.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
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

  let artefactesActius = 0;
  try {
    const dirEsc = path.join(PROJECT_DIR, '_wiki_de_poble/04_escriptori');
    artefactesActius = fs.readdirSync(dirEsc, { withFileTypes: true })
      .filter((e) => e.isFile() && !e.name.startsWith('.') && !e.name.startsWith('00_'))
      .length;
  } catch { artefactesActius = 0; }

  return {
    generat: new Date().toISOString(),
    rebuts,
    consums,
    credits,
    estrategia_consum,
    skills,
    segell,
    termometria: { artefactesActius, abast: '04_escriptori' },
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
const IPS_LOCALS = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);
const delMateixOrdinador = (req) => IPS_LOCALS.has(req.socket?.remoteAddress);
function local(req) {
  return req.method === 'GET' && delMateixOrdinador(req);
}
/* IDEA-60 (T1, prompt 261102_1532) · La mateixa comprovació d'IP per a
   l'única ruta que accepta POST, l'arrencada del corredor Jarvis. */
function localPost(req) {
  return req.method === 'POST' && delMateixOrdinador(req);
}
/* Àrbitre T1a-ARB-01 (CSRF) · Una IP local no diu qui ha enviat el POST:
   mentre el servidor corre, qualsevol pàgina de fora oberta al navegador
   del Mestre pot fer un fetch no-cors (o un <form> text/plain) a localhost,
   una petició «simple» sense preflight que arriba amb remoteAddress
   127.0.0.1; el CORS de Vite només governa la resposta. El navegador posa
   Origin en tot POST i Sec-Fetch-Site quan el coneix: l'origen ha de ser el
   d'este servidor (localhost, 127.0.0.1 o [::1], amb la mateixa autoritat
   que Host: un altre port local tampoc no val) i, si Sec-Fetch-Site hi és,
   'same-origin'. Sense Origin (curl, un script) no s'arranca res: el client
   és el panell, i l'ordre del terminal és el camí de reserva. */
const ORIGEN_LOCAL = /^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d{1,5})?$/;
function origenLocal(req) {
  const origen = String(req.headers?.origin ?? '');
  if (!ORIGEN_LOCAL.test(origen)) return false;
  const host = String(req.headers?.host ?? '');
  if (!host || origen.slice(origen.indexOf('://') + 3) !== host) return false;
  const lloc = req.headers?.['sec-fetch-site'];
  return lloc === undefined || lloc === 'same-origin';
}
/* Un formulari o un fetch no-cors no poden posar application/json sense preflight. */
const ambCosJson = (req) => String(req.headers?.['content-type'] ?? '').trim().toLowerCase().startsWith('application/json');

function servix(res, estat, cos) {
  res.statusCode = estat;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(cos));
}

/* ── IDEA-60 (T1, prompt 261102_1532) · El corredor Jarvis ────────────────
   Ordre del Mestre (Llibre Mestre, fila IDEA-60, 2026-11-02 14:46): un sol
   botó a /consola/empaquetats (src/sections/consola/jarvis.js i SeccioJarvis
   d'EmpaquetatsConsola.jsx) publica a totes les botigues. Ací, l'endpoint
   local que eixe botó crida:
     POST RUTA_PUBLICA_TOT          arranca el corredor → 202 { schema, estat, passos }
     GET  RUTA_PROGRES_JARVIS       el progrés d'ara   → 200 { schema, estat, passos }
   Les dos rutes compartixen prefix i connect les fa arribar al mateix gestor
   (gestorJarvis), que mira el mètode i el sufix. Només des del mateix
   ordinador (local() per al GET, localPost() per al POST), només del mateix
   origen i amb Content-Type application/json (origenLocal() i ambCosJson():
   cap CSRF des d'una pàgina de fora), només en DEV (el connector és apply
   'serve'), amb un cos JSON de MAX_COS_JARVIS bytes com a
   molt validat sencer (validaPeticioJarvis: schema, notes de MAX_NOTES_JARVIS
   caràcters com a molt sense caràcters de control, canals del conjunt
   CANALS_JARVIS, sec booleà) i un sol corredor alhora (corredorJarvis, el
   pany de mòdul: un segon POST mentre corre és 409).
   El corredor és `node scripts/botigues/publica-tot.mjs --notes <notes>
   --canals <llista> [--sec]`, llançat amb execFile (mai cap intèrpret) i cwd
   a l'arrel: les notes viatgen com a argument, no per cap shell. El seu
   stdout són línies JSON { pas, estat, text } que omplin el progrés
   (aplicaLiniaJarvis); el que no és JSON s'ignora, i el codi d'eixida tanca
   el que quede (tancaJarvis). L'entorn del procés és el del servidor, com el
   d'un terminal: el middleware no en llig cap valor.
   Cap error no porta camins: els textos són fixos (ERROR_JARVIS) i el detall
   d'un pas que porte un camí absolut s'emmascara (emmascaraCamins). */
export const RUTA_PUBLICA_TOT = '/__iaia/botigues/publica-tot';
export const RUTA_PROGRES_JARVIS = `${RUTA_PUBLICA_TOT}.json`;
export const ESQUEMA_JARVIS = 'sdp.jarvis.publica.v1';
export const SCRIPT_PUBLICA_TOT = 'scripts/botigues/publica-tot.mjs';
export const CANALS_JARVIS = Object.freeze(['web', 'wordpress', 'android', 'ios']);
export const ERROR_JARVIS = Object.freeze({
  cos: 'La petició no és vàlida.',
  mida: 'La petició és massa gran.',
  ocupat: 'Ja hi ha una publicació en marxa.',
  arrancada: 'No s’ha pogut arrancar el corredor.',
  cap: 'Cap publicació en marxa.'
});
const MAX_COS_JARVIS = 4096;
const MAX_NOTES_JARVIS = 500;
const MAX_LINIA_JARVIS = 4096;
const MAX_TEXT_PAS = 300;
const TEMPS_MAXIM_CORREDOR = 30 * 60 * 1000;
const ESTATS_PAS = new Set(['pendent', 'en_curs', 'fet', 'error']);
const TITOL_PAS = Object.freeze({ web: 'Web al dia', wordpress: 'WordPress al dia', android: 'Google Play i APK enviats', ios: 'Apple enviat' });
const CAMI_ABSOLUT = /\/(?:Users|home|private|var|tmp|etc|opt|Volumes)\/[^\s"')]*/g;
const SUFIX_PROGRES = /^\.json(?:\?|$)/;
const SUFIX_ARRENCADA = /^\/?(?:\?|$)/;

/* Un caràcter de control fora del tabulador i del salt de línia. */
const teControl = (text) => [...text].some((c) => {
  const n = c.charCodeAt(0);
  return (n < 32 && n !== 9 && n !== 10) || n === 127;
});
const emmascaraCamins = (text) => String(text).replace(CAMI_ABSOLUT, '<camí>');

/** La petició validada ({ notes, canals, sec }) o null. Canals buits vol dir tots. Pura. */
export function validaPeticioJarvis(cos) {
  if (!cos || typeof cos !== 'object' || Array.isArray(cos)) return null;
  if (cos.schema !== ESQUEMA_JARVIS || typeof cos.notes !== 'string' || typeof cos.sec !== 'boolean') return null;
  const notes = cos.notes.replace(/\r\n?/g, '\n').trim();
  if (!notes || notes.length > MAX_NOTES_JARVIS || teControl(notes)) return null;
  if (!Array.isArray(cos.canals) || cos.canals.some((c) => !CANALS_JARVIS.includes(c))) return null;
  const canals = CANALS_JARVIS.filter((c) => cos.canals.includes(c));
  return { notes, canals: canals.length ? canals : [...CANALS_JARVIS], sec: cos.sec };
}

/** Els passos inicials del corredor, numerats sobre els canals demanats (els mateixos títols que la Consola). Pura. */
export const passosJarvis = (canals) => canals.map((canal, i) => ({ id: canal, canal, titol: `${i + 1}/${canals.length} ${TITOL_PAS[canal]}`, estat: 'pendent' }));

/**
 * Aplica una línia del stdout del corredor al progrés: { pas, estat, text? }.
 * Una línia que no és del protocol (no és JSON, pas desconegut, estat fora
 * del vocabulari) no canvia res i torna false. Pura sobre `progres`.
 */
export function aplicaLiniaJarvis(progres, linia) {
  if (typeof linia !== 'string' || !linia.trim() || linia.length > MAX_LINIA_JARVIS) return false;
  let m;
  try { m = JSON.parse(linia); } catch { return false; }
  if (!m || typeof m !== 'object' || Array.isArray(m)) return false;
  const pas = progres.passos.find((p) => p.id === m.pas);
  if (!pas || !ESTATS_PAS.has(m.estat)) return false;
  pas.estat = m.estat;
  if (typeof m.text === 'string' && m.text.trim()) pas.detall = emmascaraCamins(m.text.trim()).slice(0, MAX_TEXT_PAS);
  else delete pas.detall;
  return true;
}

/**
 * Tanca el progrés quan el procés acaba: l'última línia sense salt, cap pas
 * que es quede «en curs» (el procés ha mort a mitges: error), i 'fet' només
 * si el codi d'eixida és 0 i tots els passos han dit 'fet'. Pura.
 */
export function tancaJarvis(progres, resta, codi) {
  if (progres.estat !== 'en_curs') return progres;
  if (typeof resta === 'string' && resta.trim()) aplicaLiniaJarvis(progres, resta);
  for (const p of progres.passos) if (p.estat === 'en_curs') p.estat = 'error';
  progres.estat = codi === 0 && progres.passos.every((p) => p.estat === 'fet') ? 'fet' : 'error';
  return progres;
}

/* El pany de mòdul: un sol corredor alhora. */
let corredorJarvis = null;

/** El progrés del corredor d'ara (sdp.jarvis.publica.v1), o null si no se n'ha arrancat cap. */
export function progresJarvis() {
  if (!corredorJarvis) return null;
  const { progres } = corredorJarvis;
  return { schema: ESQUEMA_JARVIS, estat: progres.estat, passos: progres.passos.map((p) => ({ ...p })), iniciat: progres.iniciat };
}

/** Per a les proves: oblida el corredor d'ara (no mata cap procés). */
export function oblidaCorredorJarvis() {
  corredorJarvis = null;
}

/**
 * Arranca el corredor amb execFile (mai shell), un sol alhora. `executa`
 * (execFile per defecte) i `arrel` són per a les proves. Torna el progrés
 * inicial, o llança amb codi 'ocupat' si n'hi ha un en marxa.
 */
export function arrancaJarvis({ notes, canals, sec }, { arrel = PROJECT_DIR, executa = execFile } = {}) {
  if (corredorJarvis && corredorJarvis.progres.estat === 'en_curs') {
    const e = new Error(ERROR_JARVIS.ocupat);
    e.codi = 'ocupat';
    throw e;
  }
  const progres = { estat: 'en_curs', passos: passosJarvis(canals), iniciat: new Date().toISOString() };
  const args = [SCRIPT_PUBLICA_TOT, '--notes', notes, '--canals', canals.join(',')];
  if (sec) args.push('--sec');
  const proces = executa(process.execPath, args, { cwd: arrel, timeout: TEMPS_MAXIM_CORREDOR, maxBuffer: 16 * 1024 * 1024, windowsHide: true }, () => {});
  corredorJarvis = { progres, proces };
  let resta = '';
  proces.stdout?.on('data', (tros) => {
    resta += String(tros);
    for (let i = resta.indexOf('\n'); i !== -1; i = resta.indexOf('\n')) {
      aplicaLiniaJarvis(progres, resta.slice(0, i));
      resta = resta.slice(i + 1);
    }
    if (resta.length > MAX_LINIA_JARVIS) resta = '';
  });
  proces.on?.('error', () => { tancaJarvis(progres, resta, 1); });
  proces.on?.('close', (codi) => { tancaJarvis(progres, resta, codi); });
  return progres;
}

/* El cos d'una petició, com a text, fins a `maxim` bytes: més, error amb codi 'mida'. */
function lligCos(req, maxim) {
  return new Promise((resol, rebutja) => {
    const massaGran = () => Object.assign(new Error(ERROR_JARVIS.mida), { codi: 'mida' });
    const declarada = Number(req.headers?.['content-length']);
    if (Number.isFinite(declarada) && declarada > maxim) { rebutja(massaGran()); return; }
    const trossos = [];
    let mida = 0;
    req.on('data', (tros) => {
      mida += tros.length;
      if (mida > maxim) { rebutja(massaGran()); req.destroy?.(); return; }
      trossos.push(tros);
    });
    req.on('end', () => resol(Buffer.concat(trossos).toString('utf8')));
    req.on('error', (e) => rebutja(Object.assign(e ?? new Error(ERROR_JARVIS.cos), { codi: 'cos' })));
  });
}

/**
 * El gestor de RUTA_PUBLICA_TOT: POST a l'arrel arranca (202, 400, 409, 413,
 * 415 o 500 en JSON amb text fix); GET a .json, el progrés (200, o 404 si no
 * se n'ha arrancat cap). Qualsevol altre mètode, una petició de fora o un
 * POST d'un altre origen (Origin, Sec-Fetch-Site), 403 i res més, com les
 * quatre fonts; un POST local sense Content-Type application/json, 415.
 * `opcions` (arrel, executa) són per a les proves. Connect lleva el prefix
 * de req.url; una prova que crida el gestor a pèl pot passar la ruta sencera.
 */
export function gestorJarvis(opcions = {}) {
  return async (req, res) => {
    const url = String(req.url ?? '');
    const sufix = url.startsWith(RUTA_PUBLICA_TOT) ? url.slice(RUTA_PUBLICA_TOT.length) : url;
    if (SUFIX_PROGRES.test(sufix)) {
      if (!local(req)) {
        res.statusCode = 403;
        res.end('Forbidden');
        return;
      }
      const progres = progresJarvis();
      if (!progres) {
        servix(res, 404, { schema: ESQUEMA_JARVIS, codi: 'cap', error: ERROR_JARVIS.cap });
        return;
      }
      servix(res, 200, progres);
      return;
    }
    if (!SUFIX_ARRENCADA.test(sufix) || !localPost(req) || !origenLocal(req)) {
      res.statusCode = 403;
      res.end('Forbidden');
      return;
    }
    if (!ambCosJson(req)) {
      servix(res, 415, { schema: ESQUEMA_JARVIS, codi: 'cos', error: ERROR_JARVIS.cos });
      return;
    }
    let peticio = null;
    try {
      peticio = validaPeticioJarvis(JSON.parse(await lligCos(req, MAX_COS_JARVIS)));
    } catch (e) {
      const mida = e?.codi === 'mida';
      servix(res, mida ? 413 : 400, { schema: ESQUEMA_JARVIS, codi: mida ? 'mida' : 'cos', error: mida ? ERROR_JARVIS.mida : ERROR_JARVIS.cos });
      return;
    }
    if (!peticio) {
      servix(res, 400, { schema: ESQUEMA_JARVIS, codi: 'cos', error: ERROR_JARVIS.cos });
      return;
    }
    try {
      const progres = arrancaJarvis(peticio, opcions);
      servix(res, 202, { schema: ESQUEMA_JARVIS, estat: progres.estat, passos: progres.passos.map((p) => ({ ...p })) });
    } catch (e) {
      if (e?.codi === 'ocupat') servix(res, 409, { schema: ESQUEMA_JARVIS, codi: 'ocupat', error: ERROR_JARVIS.ocupat });
      else servix(res, 500, { schema: ESQUEMA_JARVIS, codi: 'arrancada', error: ERROR_JARVIS.arrancada });
    }
  };
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
   consolaIaiaDev; consolaIaia() (vite.config.js) el torna amb el del build.
   IDEA-60 (T1, prompt 261102_1532) · `arrelJarvis` i `executaJarvis` (execFile
   per defecte) són per a les proves del corredor Jarvis. */
export function consolaIaiaDev({
  arrelGovern = PROJECT_DIR, compiladorGovern: compilador = compiladorGovern, vocabulariGovern: vocabulari = vocabulariGovern,
  arrelJarvis = PROJECT_DIR, executaJarvis = execFile
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
      /* IDEA-60 (T1, prompt 261102_1532) · El corredor Jarvis: POST a la ruta
         arranca; GET a la ruta .json, el progrés. Connect fa arribar les dos
         (el prefix i el sufix «.json») al mateix gestor. */
      server.middlewares.use(RUTA_PUBLICA_TOT, gestorJarvis({ arrel: arrelJarvis, executa: executaJarvis }));
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
