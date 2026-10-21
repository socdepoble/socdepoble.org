import { defineConfig, loadEnv, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { validatePublicCredentials } from './src/config/publicCredentials.js';
import { CONTRACTE_AMFITRIO_V1 } from './src/config/contracteAmfitrio.js';
import { MITJANS_EXTERNS_DEL_DIRECTORI, bessonesDe, esHostLocal, separaRecursos } from './src/config/politicaDeMitjans.js';

/**
 * El que hi ha a public/ i és del SERVIDOR de socdepoble.org, no de l'app.
 *
 * L'enxufe porta l'App COMPLETA a l'amfitrió (WordPress de proves, Sollutia):
 * rag-index.json, slugIndex.json, la Wiki, la Consola i totes les imatges hi
 * van, per transparència radical. Només es queda a casa el que decidix com
 * socdepoble.org servix el SEU domini; dins de la carpeta d'un altre amfitrió
 * no té cap funció i sí pot fer mal.
 */
export const PROPIS_DEL_LLOC = Object.freeze({
  /* Qualsevol fitxer o carpeta que comence per '.', a qualsevol fondària.
     .DS_Store/.DS-Store i .keep són brossa de Finder i de git. .htaccess porta
     la regla SPA `RewriteRule . /index.html`: dins de dist/ reescriuria cap a
     l'index.html de l'amfitrió qualsevol recurs inexistent del plugin. */
  prefixOcult: '.',
  /* Només a l'arrel de public/: a una altra fondària són recursos qualsevol. */
  arrel: Object.freeze([
    'robots.txt',  // del domini socdepoble.org: l'amfitrió té el seu
    'sitemap.xml', // rutes de socdepoble.org, no de l'amfitrió
    'auth',        // relé OAuth: només es servix des de auth.socdepoble.org
    'enxufe',      // canal de releases (stable.json i la signatura): és el
                   // servidor que publica, no una peça del paquet publicat
    /* PWA de l'entrada pròpia (Fase 0, 261003). La pàgina l'instal·la, no el
       component (estandard_integracio_react, LLEI 3): dins de la carpeta d'un
       amfitrió, un worker amb abast «/» i un manifest de socdepoble.org no hi
       pinten res i sí poden fer mal. */
    'sw.js',
    'manifest.webmanifest',
    /* Ordre del Mestre (261021, prompt 261021_0015, tasca 3) · Les icones de
       192 i 512 que el manifest demana per a instal·lar a l'ordinador: només
       les llig eixe manifest, així que tampoc viatgen (el zip del directori
       de WordPress.org no creix). apple-touch-icon.png sí que hi va, com abans. */
    'icona-app-192.png',
    'icona-app-512.png'
  ])
});

/** Camins relatius (POSIX, ordenats) de `directori` que viatgen dins de l'enxufe. */
export function recursosDelPlugin(directori) {
  const eixida = [];
  const recorre = (abs, rel) => {
    for (const nom of fs.readdirSync(abs).sort()) {
      if (nom.startsWith(PROPIS_DEL_LLOC.prefixOcult)) continue;
      if (!rel && PROPIS_DEL_LLOC.arrel.includes(nom)) continue;
      const fill = path.join(abs, nom);
      const relFill = rel ? `${rel}/${nom}` : nom;
      // statSync segueix enllaços simbòlics, com el copyDir de Vite.
      if (fs.statSync(fill).isDirectory()) recorre(fill, relFill);
      else eixida.push(relFill);
    }
  };
  if (directori && fs.existsSync(directori)) recorre(directori, '');
  return eixida;
}

/**
 * El directori on Vite escriu el seu manifest (`build.manifest`). Comença per
 * '.', però és de Vite, no de public/: tractor-build-previ hi llig l'entrada.
 * Només el de l'arrel de l'outDir; un '.vite' a una altra fondària és un ocult.
 */
export const DIRECTORI_DE_VITE = '.vite';

/** Cert si `abs` és estrictament dins de `arrel`: mai `arrel` mateixa ni fora d'ella. */
function esDins(arrel, abs) {
  const rel = path.relative(arrel, abs);
  return rel !== '' && !path.isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${path.sep}`);
}

/**
 * Amb emptyOutDir:false, el que builds anteriors copiaren de public/ abans
 * de PROPIS_DEL_LLOC continua a l'outDir i viatja amb el plugin: deixar de
 * copiar-ho no ho lleva. Esborra EXACTAMENT el que descriuen les exclusions
 * (robots.txt, sitemap.xml i auth/ de l'arrel; qualsevol ocult a qualsevol
 * fondària) llevat de DIRECTORI_DE_VITE a l'arrel, que no es toca ni es
 * recorre. Mai segueix enllaços simbòlics: un enllaç propi es lleva com a
 * enllaç i cap altre es recorre. Torna els camins relatius (POSIX, ordenats)
 * que ha esborrat.
 */
export function retiraPropisDelLloc(directori) {
  const esborrats = [];
  if (!directori) return esborrats;
  const arrel = path.resolve(directori);
  if (!fs.existsSync(arrel)) return esborrats;
  const recorre = (abs, rel) => {
    const entrades = fs.readdirSync(abs, { withFileTypes: true })
      .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const entrada of entrades) {
      const nom = entrada.name;
      const fill = path.join(abs, nom);
      if (!esDins(arrel, fill)) {
        throw new Error(`[sdp-recursos-publics] Camí fora de l'outDir, no s'esborra: ${fill}`);
      }
      const relFill = rel ? `${rel}/${nom}` : nom;
      if (!rel && nom === DIRECTORI_DE_VITE) continue;
      const propi = nom.startsWith(PROPIS_DEL_LLOC.prefixOcult) ||
        (!rel && PROPIS_DEL_LLOC.arrel.includes(nom));
      if (propi) {
        fs.rmSync(fill, { recursive: true, force: true });
        esborrats.push(relFill);
      } else if (entrada.isDirectory()) {
        // Dirent no segueix enllaços: un enllaç a directori no és isDirectory().
        recorre(fill, relFill);
      }
    }
  };
  recorre(arrel, '');
  return esborrats.sort();
}

/* ─────────── Política de mitjans (encàrrec 261019_1425) ───────────
   El directori de WordPress.org no admet un zip de més de 10 MB
   (LIMIT_DIRECTORI d'empaqueta.mjs) i public/ en fa més de 130. La variant
   del directori (SDP_VARIANT=wordpress) porta l'estructura de la interfície
   i deixa fora:
     · els EXTERNS: les carpetes de contingut de
       MITJANS_EXTERNS_DEL_DIRECTORI (src/config/politicaDeMitjans.js), que
       el bundle demana a un origen extern (per defecte https://socdepoble.org,
       que desplega public/; SDP_ORIGEN_MITJANS el canvia, p. ex. per un
       bucket públic de Supabase Storage que replique assets/);
     · els SUBSTITUÏTS: els originals que tenen bessona .webp, que hi viatja
       en el seu lloc.
   La mateixa política se segella al bundle (define), perquè el resolutor
   (assetResolver.js) demane la bessona i l'origen extern: el que viatja i el
   que es demana ixen del mateix càlcul sobre el mateix public/.
   L'autònom (el canal propi, gentdelatorre.net i Sollutia) porta només els
   SUBSTITUÏTS, sense cap origen extern: tot viatja dins del paquet, però la
   bessona en lloc de l'original (decisió D3 del Mestre, 261019: el LCP de
   9,9 s de gentdelatorre.net). L'app nativa (vite.natiu.config.js, Fase C
   261019_2115) porta la de l'autònom, sense els originals que cita sense
   resolutor (politicaDeMitjansNativa). */

/**
 * L'origen dels mitjans externs: https i un host públic (en una release), sense
 * credencials, consulta ni fragment; torna l'origen i el camí sense barra final.
 * Fora d'una release també admet http cap a un host local (el servidor de
 * desenvolupament, per a provar el directori a WordPress Studio).
 */
export function origenDeMitjans(valor, { release = false } = {}) {
  let url;
  try { url = new URL(String(valor ?? '').trim()); } catch { throw new Error(`SDP_ORIGEN_MITJANS no és una URL: «${valor}».`); }
  const local = esHostLocal(url.hostname);
  if (url.username || url.password || url.search || url.hash) throw new Error('SDP_ORIGEN_MITJANS no pot portar credencials, consulta ni fragment.');
  if (url.protocol === 'https:' && !(release && local)) return `${url.origin}${url.pathname}`.replace(/\/+$/, '');
  if (url.protocol === 'http:' && local && !release) return `${url.origin}${url.pathname}`.replace(/\/+$/, '');
  throw new Error(`SDP_ORIGEN_MITJANS ha de ser https i d'un host públic${release ? '' : ' (http només cap a un host local, fora de les releases)'}: «${valor}».`);
}

/**
 * La política de mitjans d'una variant, o null. `directori` és el public/ que
 * s'emetrà: les bessones es calculen sobre els recursos que hi viatjarien.
 *   · wordpress (el directori): l'origen extern, les carpetes externes i les bessones;
 *   · autonom: només les bessones, sense origen (D3); sense cap bessona, null.
 */
export function politicaDeMitjans(variant = 'autonom', { env = {}, directori, release = false } = {}) {
  if (variant !== 'autonom' && variant !== 'wordpress') throw new Error(`SDP_VARIANT desconeguda: ${variant}`);
  /* Només sota assets/: és el que el resolutor sap demanar (els recursos de
     l'arrel, com apple-touch-icon.png, els nomena l'HTML de l'amfitrió). */
  const bessones = Object.freeze(bessonesDe(recursosDelPlugin(directori)).filter((cami) => cami.startsWith('assets/')));
  if (variant === 'autonom') {
    return bessones.length ? Object.freeze({ origen: null, externs: Object.freeze([]), bessones }) : null;
  }
  return Object.freeze({
    origen: origenDeMitjans(env.SDP_ORIGEN_MITJANS || MITJANS_EXTERNS_DEL_DIRECTORI.origen, { release }),
    externs: MITJANS_EXTERNS_DEL_DIRECTORI.prefixos,
    bessones
  });
}

/**
 * Substitut de `build.copyPublicDir`: el de Vite copia public/ sencer i no
 * admet exclusions. Ací cada recurs s'emet com a asset de Rollup, sense `name`,
 * de manera que no entra al manifest (tractor-build-previ hi busca l'entrada).
 * Sense `directori`, el de la config resolta: la mateixa carpeta que el
 * servidor de desenvolupament continua servint. Amb `politica` (la del
 * directori o la de l'autònom, D3), no s'emeten els externs (només en té el
 * directori) ni els originals substituïts.
 *
 * Després d'escriure (writeBundle), retira de l'outDir les còpies que
 * builds anteriors hi deixaren (retiraPropisDelLloc). Només si l'outDir és
 * estrictament dins de l'arrel del projecte, el mateix criteri de Vite per a
 * buidar-lo: un outDir que conté el projecte no es neteja mai.
 *
 * Fase D (261020, L10) · `exclosos`: camins POSIX exactes, relatius a public/
 * (tal com els torna recursosDelPlugin), que ESTE paquet no emet a més dels de
 * PROPIS_DEL_LLOC. Per defecte, cap. writeBundle continua retirant només els
 * propis del lloc.
 */
export function recursosPublicsDelPlugin({ directori, politica = null, exclosos = [] } = {}) {
  const fora = new Set(exclosos);
  let arrel = directori;
  let arrelProjecte;
  let outDir;
  let registre = console;
  return {
    name: 'sdp-recursos-publics',
    apply: 'build',
    configResolved(config) {
      arrel ??= config.publicDir;
      if (config.root) arrelProjecte = path.resolve(config.root);
      if (arrelProjecte && config.build?.outDir) outDir = path.resolve(arrelProjecte, config.build.outDir);
      if (config.logger) registre = config.logger;
    },
    generateBundle() {
      for (const fileName of separaRecursos(recursosDelPlugin(arrel), politica).viatgen) {
        if (fora.has(fileName)) continue;
        this.emitFile({ type: 'asset', fileName, source: fs.readFileSync(path.join(arrel, fileName)) });
      }
    },
    writeBundle(opcions) {
      const eixida = opcions?.dir ? path.resolve(opcions.dir) : outDir;
      if (!eixida) return;
      if (!arrelProjecte || !esDins(arrelProjecte, eixida)) {
        registre.warn(`[sdp-recursos-publics] ${eixida} no és dins de l'arrel del projecte: no se'n retira res.`);
        return;
      }
      const esborrats = retiraPropisDelLloc(eixida);
      if (esborrats.length) {
        registre.info(`[sdp-recursos-publics] Retirats de ${path.relative(arrelProjecte, eixida)} (propis del lloc, de builds anteriors): ${esborrats.join(', ')}`);
      }
    }
  };
}

/* ─────────── Manifest de l'artefacte universal (sdp.release.v1) ───────────
   El contracte es conserva entre les dues variants de runtime: WordPress (banc de
   proves), Sollutia o una pàgina estàtica. Cada build deixa, al costat del
   bundle, la seua identitat llegible sense executar res: versió, node de dades
   segellat, empremtes del bundle (sha256 i SRI) i l'inventari exacte del que ha
   emés. L'adaptador de WordPress la llig per a la memòria cau i l'atribut
   integrity; Sollutia, per a fixar la versió i l'integrity del seu <script>;
   el canal d'actualitzacions en signa una còpia. Cap clau ni credencial: del
   node només viatja l'origen públic, que el bundle ja porta segellat.
   Decisió 5 del Mestre (261007) · en el paquet trossejat, `entrada` és el
   carregador clàssic (2-4 KB): el sha256 i l'SRI el cobrixen a ell, i ell
   porta dins el nom amb hash del mòdul d'entrada (Rollup encadena els hash
   de cada tros amb els dels que referencia), de manera que qualsevol canvi de
   codi canvia el carregador i el `ver` de WordPress. Cada tros entra a
   l'inventari amb el seu sha256; la clau additiva `formatDelPaquet` diu quin
   format s'ha emés ({format:'trossos', modul, trossos} o {format:'monolitic'}).
   Relleu 261007 · abans es deia `paquet`, però el canal signat (stable.json =
   el manifest més els adaptadors) ja té `estatic.paquet` i
   `adaptadors.wordpress.paquet`, que són els zips: tres `paquet` amb tres
   significats. Cap release no l'havia publicada, i canviar-li el nom era gratis. */

export const ESQUEMA_RELEASE = 'sdp.release.v1';
export const FITXER_RELEASE = 'sdp-release.json';
export const FITXER_INVENTARI = 'sdp-inventari.json';
export const ENTRADA_DEL_PAQUET = 'soc-de-poble.standalone.js';
const FONTS_DEL_PAQUET = 'fonts/noto-sans.css';

/* El directori usa les biblioteques del nucli WP (sempre monolític: vegeu
   formatDelPaquet); Sollutia i el canal propi reben el paquet autònom, que
   per defecte és el carregador amb els seus trossos (decisió 5, 261007). */
export const GLOBALS_WORDPRESS = Object.freeze({
  react: 'React', 'react-dom': 'ReactDOM', 'react-dom/client': 'ReactDOM',
  'react/jsx-runtime': 'ReactJSXRuntime'
});
export function runtimeDelBuild(variant = 'autonom') {
  if (variant === 'autonom') return { amfitrio: 'autonom', dependencies: [] };
  if (variant === 'wordpress') return {
    amfitrio: 'wordpress', dependencies: ['react', 'react-dom', 'react-jsx-runtime'], wordpressMinim: '6.6'
  };
  throw new Error(`SDP_VARIANT desconeguda: ${variant}`);
}

export function externDeWordPress(id) {
  if (Object.hasOwn(GLOBALS_WORDPRESS, id)) return true;
  if (/^(react|react-dom)\//.test(id)) throw new Error(`Submòdul de React sense equivalent WordPress: ${id}`);
  return false;
}

export function senseReactIncrustat() {
  return {
    name: 'sdp-react-del-nucli', apply: 'build',
    generateBundle(_opcions, paquet) {
      for (const fitxer of Object.values(paquet)) {
        for (const id of Object.keys(fitxer.modules || {})) {
          if (/node_modules[\\/](react|react-dom)[\\/]/.test(id)) {
            this.error(`La variant WordPress encara incrusta React: ${id}`);
          }
        }
      }
    }
  };
}

/** El contracte d'amfitrió que implementa el paquet (LLEI 1 de estandard_integracio_react.md). */
export const CONTRACTE_AMFITRIO = Object.freeze({
  marcatge: 'sdp.markup.v1',
  element: 'soc-de-poble',
  global: 'SocDePobleConfig',
  claus: Object.freeze(['nomPoble', 'poble']),
  atributs: Object.freeze(['plugin-url', 'fonts-href', 'nom-poble', 'poble', 'ruta-inicial', 'base-path', 'traductor-url'])
});

const MODES_DE_DADES = Object.freeze(['remote', 'seed', 'local']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z]+(?:\.[0-9A-Za-z]+)*)?$/;

/* esHostLocal viu a src/config/politicaDeMitjans.js (pur): l'empaquetador la
   necessita sense carregar Vite. Es reexporta ací per als seus usuaris. */
export { esHostLocal };

/**
 * El node de dades que el build segella (Model B): origen públic, mode i tenant.
 * El mode es resol com src/config/dataMode.js: un valor desconegut és 'remote'.
 * `desenvolupament` és cert si el paquet no pot servir cap visitant real: sense
 * URL vàlida, sense https o amb un host local.
 */
export function nodeSegellat(env = {}) {
  let origen = null;
  let desenvolupament = true;
  try {
    const url = new URL(env.VITE_SUPABASE_URL);
    origen = url.origin;
    desenvolupament = url.protocol !== 'https:' || esHostLocal(url.hostname);
  } catch { /* sense URL vàlida: el paquet no arrenca enlloc */ }
  const mode = MODES_DE_DADES.includes(env.VITE_DATA_MODE) ? env.VITE_DATA_MODE : 'remote';
  const tenant = UUID.test(env.VITE_TENANT_ID || '') ? env.VITE_TENANT_ID.toLowerCase() : null;
  return { origen, mode, tenant, desenvolupament };
}

/**
 * Versió de l'artefacte. En una release la dona SDP_VERSIO (el tag), sense
 * tocar package.json; en qualsevol altre build és la de package.json amb el
 * sufix -dev, que no pot passar mai per una release.
 */
export function versioDelBuild(env = {}, versioDelPaquet = '0.0.0') {
  return env.SDP_VERSIO ? String(env.SDP_VERSIO).trim() : `${versioDelPaquet}-dev`;
}

/** Per què este build no es pot publicar com a release. Buit si es pot. */
export function errorsDeRelease({ versio, node }) {
  const errors = [];
  if (!SEMVER.test(versio || '') || /-dev(?:\.|$)/.test(versio)) {
    errors.push(`SDP_VERSIO ha de ser una versió SemVer de release (p. ex. 0.2.0), no «${versio}».`);
  }
  if (!node?.origen) errors.push('VITE_SUPABASE_URL no és una URL vàlida.');
  else if (node.desenvolupament) errors.push(`El node segellat (${node.origen}) és de desenvolupament: cal https i un host públic.`);
  if (node?.mode !== 'remote') errors.push(`VITE_DATA_MODE és «${node?.mode}»: una release només ix en mode remote.`);
  if (!node?.tenant) errors.push('VITE_TENANT_ID ha de ser l’UUID real d’un poble (public.towns).');
  return errors;
}

const sha256 = (dades) => createHash('sha256').update(dades).digest('hex');
const sri384 = (dades) => `sha384-${createHash('sha384').update(dades).digest('base64')}`;

/**
 * Manifest i inventari d'un build a partir dels fitxers que ha emés.
 * `fitxers`: [{ cami, contingut: Buffer }], amb camins POSIX relatius a
 * l'outDir, que és la base de plugin-url en qualsevol amfitrió.
 * `paquet` (decisió 5 del Mestre, 261007): la descripció additiva del format
 * (descripcioDelPaquet), que el manifest publica com a `formatDelPaquet`.
 * Sense ella, el manifest és idèntic al d'abans. No va dins de `contracte`,
 * que l'empaquetador exigix igual en les dues variants.
 * `mitjans` (encàrrec 261019_1425): la política de mitjans de la variant
 * (politicaDeMitjans), que el manifest publica com a clau additiva `mitjans`
 * ({ origen, externs, bessones: quantes }), fora de `contracte` i de `node`.
 */
export function manifestDeRelease({ versio, node, fitxers, generat, variant = 'autonom', paquet, mitjans }) {
  const ordenats = [...fitxers].sort((a, b) => (a.cami < b.cami ? -1 : a.cami > b.cami ? 1 : 0));
  const entrada = ordenats.find((f) => f.cami === ENTRADA_DEL_PAQUET);
  if (!entrada) throw new Error(`[sdp-manifest-release] El build no ha emés ${ENTRADA_DEL_PAQUET}.`);
  const fonts = ordenats.find((f) => f.cami === FONTS_DEL_PAQUET);
  const inventari = ordenats.map(({ cami, contingut }) => ({ cami, mida: contingut.length, sha256: sha256(contingut) }));
  const inventariText = `${JSON.stringify({ schema: ESQUEMA_RELEASE, fitxers: inventari }, null, 2)}\n`;
  const manifest = {
    schema: ESQUEMA_RELEASE,
    producte: 'soc-de-poble',
    versio,
    generat,
    contracte: CONTRACTE_AMFITRIO,
    runtime: runtimeDelBuild(variant),
    node,
    entrada: {
      cami: ENTRADA_DEL_PAQUET,
      mida: entrada.contingut.length,
      sha256: sha256(entrada.contingut),
      integrity: sri384(entrada.contingut)
    },
    ...(fonts ? { fonts: { cami: FONTS_DEL_PAQUET, integrity: sri384(fonts.contingut) } } : {}),
    inventari: { cami: FITXER_INVENTARI, fitxers: inventari.length, sha256: sha256(inventariText) },
    ...(paquet ? { formatDelPaquet: paquet } : {}),
    ...(mitjans ? { mitjans: { origen: mitjans.origen, externs: [...mitjans.externs], bessones: mitjans.bessones.length } } : {})
  };
  return { manifest, manifestText: `${JSON.stringify(manifest, null, 2)}\n`, inventariText };
}

/**
 * Escriu sdp-release.json i sdp-inventari.json a l'outDir amb el que el build
 * ha emés de veritat (el `bundle` de writeBundle), no amb el que hi ha al
 * disc: les restes de builds anteriors no entren mai a l'inventari, i
 * l'empaquetador només copia el que l'inventari nomena. El manifest de Vite
 * (.vite/) és una traça de compilació i en queda fora.
 * `format` (decisió 5, 261007): el de formatDelPaquet; amb ell, el manifest
 * porta la clau `formatDelPaquet`, deduïda del mateix `bundle` (el mòdul
 * d'entrada i els trossos que s'han emés de veritat).
 */
export function manifestDeReleasePlugin({ versio, node, generat, variant = 'autonom', format, mitjans } = {}) {
  let outDir;
  let registre = console;
  return {
    name: 'sdp-manifest-release',
    apply: 'build',
    configResolved(config) {
      if (config.root && config.build?.outDir) outDir = path.resolve(config.root, config.build.outDir);
      if (config.logger) registre = config.logger;
    },
    writeBundle(opcions, paquet) {
      const eixida = opcions?.dir ? path.resolve(opcions.dir) : outDir;
      if (!eixida) return;
      const fitxers = Object.values(paquet || {})
        .filter((f) => f && typeof f.fileName === 'string')
        .filter((f) => !f.fileName.startsWith(`${DIRECTORI_DE_VITE}/`) && f.fileName !== FITXER_RELEASE && f.fileName !== FITXER_INVENTARI)
        .map((f) => ({ cami: f.fileName, contingut: Buffer.from(f.type === 'chunk' ? f.code : f.source) }));
      const { manifest, manifestText, inventariText } = manifestDeRelease({
        versio, node, fitxers, variant, generat: generat ?? new Date().toISOString(),
        paquet: descripcioDelPaquet(format, paquet), mitjans
      });
      fs.writeFileSync(path.join(eixida, FITXER_INVENTARI), inventariText);
      fs.writeFileSync(path.join(eixida, FITXER_RELEASE), manifestText);
      registre.info(`[sdp-manifest-release] ${manifest.versio} · ${manifest.inventari.fitxers} fitxers · node ${manifest.node.origen ?? 'sense origen'} (${manifest.node.mode})${manifest.node.desenvolupament ? ' · DESENVOLUPAMENT: no es pot publicar' : ''}`);
    }
  };
}

/* ─────────── Paquet trossejat (decisió 5 del Mestre, 261007) ───────────
   «Paquet WordPress de 4,4 MB: CODE SPLITTING OBLIGATORI.» En format IIFE,
   Vite força inlineDynamicImports (buildOutputOptions de
   node_modules/vite/dist/node/chunks/config.js): les import() i els
   React.lazy viatjaven dins del fitxer, i posar-ne més no reduïa res. Cal
   canviar el format de l'eixida:
     · soc-de-poble.standalone.js, amb el MATEIX nom (marcatge.php, salut.php,
       manifest.php i els amfitrions no canvien), és un carregador clàssic
       menut compilat des de src/config/carregadorDelPaquet.js;
     · src/embed.jsx ix com a mòdul ESM a trossos/soc-de-poble-<hash>.js, i els
       seus trossos amb hash, al costat, a trossos/. En lib, Vite deixa els
       trossos a l'arrel de l'outDir (on xocarien amb assets/ de public/) i
       posa hoistTransitiveImports:false: ací es fixen tots dos.
   Interruptor SDP_PAQUET (el mateix loadEnv que SDP_RELEASE i SDP_VARIANT):
   `trossos` (el defecte de l'autònom), `monolitic` (l'IIFE d'abans, per a
   tornar enrere o per a un amfitrió sense CORS) o buit (el defecte de la
   variant). La variant del directori de WordPress és SEMPRE monolítica: amb
   format 'es' els externs de React ixen com a importacions nues ('react'),
   que el navegador no resol sense un import map, output.globals només val
   per a iife i umd, i al nucli de WordPress React són scripts clàssics. */
export const FORMATS_DEL_PAQUET = Object.freeze(['trossos', 'monolitic']);
export const CARPETA_DE_TROSSOS = 'trossos';
export const MODUL_DELS_TROSSOS = `${CARPETA_DE_TROSSOS}/soc-de-poble-[hash].js`;
/* Sostre del carregador: si creix, que siga a posta i amb la prova al davant. */
export const LIMIT_DEL_CARREGADOR = 4096;
const FONT_DEL_CARREGADOR = path.join(__dirname, 'src/config/carregadorDelPaquet.js');
const MODUL_VALID = new RegExp(`^${CARPETA_DE_TROSSOS}/[A-Za-z0-9_-]+\\.js$`);

/**
 * El format del paquet segons SDP_PAQUET i la variant. Es valida ABANS de
 * compilar, com runtimeDelBuild: cap fallback per a errades tipogràfiques.
 */
export function formatDelPaquet(valor, variant = 'autonom') {
  const demanat = String(valor ?? '').trim();
  const format = demanat || (variant === 'wordpress' ? 'monolitic' : 'trossos');
  if (!FORMATS_DEL_PAQUET.includes(format)) {
    throw new Error(`SDP_PAQUET desconegut: «${demanat}». Admet ${FORMATS_DEL_PAQUET.join(' o ')}, o buit per al defecte de la variant.`);
  }
  if (variant === 'wordpress' && format !== 'monolitic') {
    throw new Error('SDP_VARIANT=wordpress és sempre monolítica: el React del nucli no es pot importar des d’un mòdul ESM sense import map.');
  }
  return format;
}

/**
 * El codi del carregador per a un mòdul d'entrada concret: la font pura més
 * UNA crida que llig document.currentScript en la primera línia que
 * s'executa, compilat per esbuild en un IIFE minificat. El charset ASCII per
 * defecte és intencionat: un script clàssic es descodifica amb el charset de
 * la pàgina, i així cap accent dels missatges no en depén. Es comprova que és
 * un script clàssic (vm.Script: cap import ni export de nivell superior) i
 * que no passa de LIMIT_DEL_CARREGADOR. No llig process.env ni cap valor de
 * l'entorn: només el camí del mòdul, les claus de l'API i el nom del fitxer.
 */
export async function codiDelCarregador({ modul, claus = CONTRACTE_AMFITRIO_V1.api.claus } = {}) {
  if (typeof modul !== 'string' || !MODUL_VALID.test(modul)) {
    throw new Error(`[sdp-carregador] Mòdul d'entrada no vàlid: ${modul}`);
  }
  const opcions = JSON.stringify({ modul, claus: [...claus], fitxer: ENTRADA_DEL_PAQUET });
  const font = `${fs.readFileSync(FONT_DEL_CARREGADOR, 'utf8')}\n`
    + `instalaCarregador(window, document, document.currentScript, ${opcions}, (url) => import(url));\n`;
  const { code } = await transformWithEsbuild(font, FONT_DEL_CARREGADOR, {
    format: 'iife', minify: true, target: 'es2020', legalComments: 'none'
  });
  new vm.Script(code, { filename: ENTRADA_DEL_PAQUET });
  const mida = Buffer.byteLength(code);
  if (mida > LIMIT_DEL_CARREGADOR) {
    throw new Error(`[sdp-carregador] El carregador fa ${mida} B i el sostre és ${LIMIT_DEL_CARREGADOR} B.`);
  }
  return code;
}

/**
 * Emet el carregador per al mòdul d'entrada que ha escrit Rollup: a
 * generateBundle els noms amb hash ja són els definitius. Exigix un sol chunk
 * d'entrada. És un asset SENSE `name`: el manifest de Vite (.vite/) continua
 * amb una sola entrada, la ESM, i tractor-build-previ la troba.
 */
export function carregadorDelPaquetPlugin({ claus = CONTRACTE_AMFITRIO_V1.api.claus } = {}) {
  return {
    name: 'sdp-carregador',
    apply: 'build',
    async generateBundle(_opcions, paquet) {
      const entrades = Object.values(paquet).filter((f) => f.type === 'chunk' && f.isEntry);
      if (entrades.length !== 1) this.error(`El paquet trossejat necessita un sol mòdul d'entrada i n'hi ha ${entrades.length}.`);
      if (paquet[ENTRADA_DEL_PAQUET]) this.error(`${ENTRADA_DEL_PAQUET} ja l'ha emés una altra peça del build.`);
      const source = await codiDelCarregador({ modul: entrades[0].fileName, claus });
      this.emitFile({ type: 'asset', fileName: ENTRADA_DEL_PAQUET, source });
    }
  };
}

/**
 * En lib amb format 'es', Vite minifica identificadors i sintaxi però NO els
 * espais (resolveEsbuildTranspileOptions, isEsLibBuild): conserva el format
 * per als empaquetadors que consumixen una llibreria. Este paquet no el
 * consumix cap empaquetador, el servix un navegador; sense esta passada, els
 * trossos pesen més que l'IIFE minificat. Només espais, amb les mateixes
 * opcions de Vite (charset utf8, sense comentaris legals), després de la seua
 * transpilació (order 'post'): ni sintaxi ni identificadors no canvien, i els
 * marcadors dels hash de Rollup, que són dins de cadenes, queden intactes.
 */
export function espaisDelPaquetPlugin() {
  return {
    name: 'sdp-espais',
    apply: 'build',
    renderChunk: {
      order: 'post',
      async handler(code, chunk, opcions) {
        if (opcions.format !== 'es') return null;
        const { code: compacte } = await transformWithEsbuild(code, chunk.fileName, {
          loader: 'js', format: 'esm', minifyWhitespace: true, charset: 'utf8', legalComments: 'none', sourcemap: false
        });
        return compacte;
      }
    }
  };
}

/**
 * La clau additiva `formatDelPaquet` del manifest a partir del que el build ha emés.
 * Sense format, undefined (el manifest d'abans). En trossos: el mòdul
 * d'entrada (el chunk isEntry) i quants .js hi ha sota trossos/.
 */
export function descripcioDelPaquet(format, paquet) {
  if (!format) return undefined;
  if (format === 'monolitic') return { format };
  if (format !== 'trossos') throw new Error(`[sdp-manifest-release] Format de paquet desconegut: ${format}`);
  const fitxers = Object.values(paquet || {}).filter((f) => f && typeof f.fileName === 'string');
  const entrades = fitxers.filter((f) => f.type === 'chunk' && f.isEntry);
  if (entrades.length !== 1 || !MODUL_VALID.test(entrades[0].fileName)) {
    throw new Error(`[sdp-manifest-release] El paquet trossejat no té un sol mòdul d'entrada sota ${CARPETA_DE_TROSSOS}/.`);
  }
  const trossos = fitxers.filter((f) => f.fileName.startsWith(`${CARPETA_DE_TROSSOS}/`) && f.fileName.endsWith('.js')).length;
  return { format, modul: entrades[0].fileName, trossos };
}

const versioDePackageJson = () => JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8')).version;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isCI = !!process.env.CI;
  const supabaseUrl = env.VITE_SUPABASE_URL || (isCI ? 'https://mock.supabase.co' : undefined);
  const anonKey = env.VITE_SUPABASE_ANON_KEY || (isCI ? 'mock-anon-key' : undefined);
  validatePublicCredentials(supabaseUrl, anonKey);

  /* Release: `SDP_RELEASE=1 SDP_VERSIO=x.y.z npm run build:wp`, amb les VITE_*
     de producció (.env.production.local mana sobre .env.local). La porta falla
     ABANS de compilar si el node és de desenvolupament: un paquet segellat
     contra localhost o en mode seed no arriba mai ni a WordPress ni a Sollutia. */
  const release = env.SDP_RELEASE === '1';
  const variant = env.SDP_VARIANT || 'autonom';
  runtimeDelBuild(variant); // Valida abans de compilar; cap fallback per a errades tipogràfiques.
  const perWordPress = variant === 'wordpress';
  /* Decisió 5 del Mestre (261007): trossejat per defecte; SDP_PAQUET=monolitic
     torna a l'IIFE d'abans. Valida abans de compilar, com la variant. */
  const format = formatDelPaquet(env.SDP_PAQUET, variant);
  const trossejat = format === 'trossos';
  const versio = versioDelBuild(env, versioDePackageJson());
  /* El node és el que Vite segella de veritat al bundle (import.meta.env surt
     de les mateixes VITE_*), no la reserva de CI, que només servix per a
     validatePublicCredentials: sense URL real, el manifest diu «sense origen». */
  const node = nodeSegellat(env);
  if (release) {
    const errors = errorsDeRelease({ versio, node });
    if (errors.length) throw new Error(`[sdp-release] Este build no es pot publicar:\n- ${errors.join('\n- ')}`);
  }
  const generat = env.SOURCE_DATE_EPOCH ? new Date(Number(env.SOURCE_DATE_EPOCH) * 1000).toISOString() : undefined;
  /* Encàrrec 261019_1425 · En porten el directori (origen extern i bessones) i
     l'autònom (només les bessones, D3); el natiu porta la de l'autònom, des
     de vite.natiu.config.js. Valida l'origen del
     directori abans de compilar i calcula les bessones sobre el public/ que
     s'emetrà. */
  const mitjans = politicaDeMitjans(variant, { env, directori: path.resolve(__dirname, 'public'), release });

  return {
    plugins: [
    react(),
    recursosPublicsDelPlugin({ politica: mitjans }),
    manifestDeReleasePlugin({ versio, node, generat, variant, format, mitjans }),
    ...(perWordPress ? [senseReactIncrustat()] : []),
    ...(trossejat ? [carregadorDelPaquetPlugin(), espaisDelPaquetPlugin()] : []),
    {
      name: 'sdp-port-canonic',
      configResolved(config) {
        if (config.command === 'serve' && !config.isPreview &&
            (config.server.port !== 3340 || !config.server.strictPort)) {
          throw new Error('El servidor de desenvolupament usa exclusivament el port 3340 amb strictPort. Reutilitza http://localhost:3340.');
        }
      }
    },
    {
      /* T14 · Guarda dins del build: un amfitrió (WordPress, Sollutia, una pàgina
         estàtica) carrega el paquet amb un <script> clàssic (l'IIFE monolític o,
         des de la decisió 5 del Mestre, 261007, el carregador i els seus trossos
         ESM) i no té `process`. Si una dependència nova en llig una clau que el
         define no cobrix, el build falla ací, en qualsevol tros, en lloc de
         pintar una pantalla en blanc a l'amfitrió. Mira l'AST i no el text: la
         Wiki viatja dins del paquet i pot parlar de `process.env`. */
      name: 'sdp-sense-process',
      apply: 'build',
      generateBundle(_opcions, paquet) {
        for (const fitxer of Object.values(paquet)) {
          if (fitxer.type !== 'chunk' || !fitxer.code.includes('process')) continue;
          const pendents = [this.parse(fitxer.code)];
          while (pendents.length) {
            const node = pendents.pop();
            if (node.type === 'MemberExpression' && node.object.type === 'Identifier' && node.object.name === 'process'
                && (node.property.name === 'env' || node.property.value === 'env')) {
              this.error(`${fitxer.fileName} encara llig process.env: afig la clau al define del mode llibreria.`);
            }
            for (const fill of Object.values(node)) {
              if (Array.isArray(fill)) pendents.push(...fill.filter((element) => element && typeof element.type === 'string'));
              else if (fill && typeof fill.type === 'string') pendents.push(fill);
            }
          }
        }
      }
    }
  ],
  /* T14 · En mode llibreria Vite NO substituïx process.env.* (vite:define només
     ho fa fora de build.lib), i React, scheduler, use-sync-external-store i
     TipTap el lligen en carregar: sense açò l'IIFE peta amb «process is not
     defined». Només la clau concreta: `process.env: {}` evitava l'error però
     deixava React en mode desenvolupament (C-03 del 260921). El criteri és el
     de Vite per a isProduction, sobre el NODE_ENV que ja ha fixat abans
     d'avaluar este fitxer ('production' en tot build, també amb --mode
     development). Només un NODE_ENV posat per un .env.[mode] s'aplica després
     i el deixaria desquadrat: el projecte no en té cap. */
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV === 'production' ? 'production' : 'development'),
    /* Encàrrec 261019_1425 · La política de mitjans, segellada: assetResolver.js
       la llig en avaluar-se, abans que townsContent.js i marketContent.js
       resolguen cap imatge. Una clau de l'entorn i no una global de la
       pàgina: als builds que no la porten (el web) Vite la deixa en
       undefined i cap amfitrió no la pot posar. Vite en copia el valor als
       objectes import.meta.env sencers del bundle (un, ~10 KB, a cada paquet
       que la porta: el directori i l'autònom; a l'app nativa, que també la
       porta, n'hi ha dos). Sense política (un public/
       sense bessones), la clau no hi és. */
    ...(mitjans ? { 'import.meta.env.SDP_POLITICA_DE_MITJANS': JSON.stringify(mitjans) } : {})
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  build: {
    target: 'es2022',
    /* Alineat amb tooling/gates/tractor-build-previ.mjs. A `npm run build`,
       build:seo s'executa DESPRÉS de build:wp i escriu seo-routes.json dins
       d'aquest outDir. emptyOutDir:false el protegix quan build:wp s'executa
       a soles: buidar la carpeta l'esborraria fins al pròxim build:seo.
       En una release (SDP_RELEASE=1) la carpeta es buida: l'artefacte només
       porta el que este build ha emés. */
    outDir: perWordPress ? 'wordpress-plugin/builds/directori/dist' : 'wordpress-plugin/dist',
    emptyOutDir: release,
    /* public/ el copia recursosPublicsDelPlugin, sense el que és propi del
       lloc (PROPIS_DEL_LLOC), i en acabar en retira les còpies que builds
       anteriors deixaren ací. copyPublicDir i no publicDir: la carpeta
       continua resolta i servida en desenvolupament. */
    copyPublicDir: false,
    manifest: true,
    cssCodeSplit: false,
    ...(perWordPress ? { rollupOptions: { external: externDeWordPress, output: { globals: GLOBALS_WORDPRESS } } } : {}),
    /* Decisió 5 del Mestre (261007) · trossejat: entrada ESM i trossos amb
       hash sota trossos/, amb les importacions transitives elevades perquè el
       navegador demane en paral·lel. WordPress mai arriba ací (formatDelPaquet).
       preserveEntrySignatures: en lib, Vite posa 'strict', i com que els
       trossos importen de l'entrada (host.js també s'importa dinàmicament),
       Rollup hi interposava una façana de 30 B: una anada i tornada més abans
       del codi. embed.jsx no exporta res i ningú no en consumix la signatura:
       'allow-extension' deixa que l'entrada siga el mòdul que porta el codi. */
    ...(trossejat ? {
      rollupOptions: {
        preserveEntrySignatures: 'allow-extension',
        output: {
          entryFileNames: MODUL_DELS_TROSSOS,
          chunkFileNames: `${CARPETA_DE_TROSSOS}/[name]-[hash].js`,
          hoistTransitiveImports: true
        }
      }
    } : {}),
    lib: {
      entry: path.resolve(__dirname, 'src/embed.jsx'),
      name: 'SocDePoble',
      formats: trossejat ? ['es'] : ['iife'],
      fileName: () => (trossejat ? MODUL_DELS_TROSSOS : ENTRADA_DEL_PAQUET)
    }
  }
  };
});
