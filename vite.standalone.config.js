import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { validatePublicCredentials } from './src/config/publicCredentials.js';

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
    'enxufe'       // canal de releases (stable.json i la signatura): és el
                   // servidor que publica, no una peça del paquet publicat
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

/**
 * Substitut de `build.copyPublicDir`: el de Vite copia public/ sencer i no
 * admet exclusions. Ací cada recurs s'emet com a asset de Rollup, sense `name`,
 * de manera que no entra al manifest (tractor-build-previ hi busca l'entrada).
 * Sense `directori`, el de la config resolta: la mateixa carpeta que el
 * servidor de desenvolupament continua servint.
 *
 * Després d'escriure (writeBundle), retira de l'outDir les còpies que
 * builds anteriors hi deixaren (retiraPropisDelLloc). Només si l'outDir és
 * estrictament dins de l'arrel del projecte, el mateix criteri de Vite per a
 * buidar-lo: un outDir que conté el projecte no es neteja mai.
 */
export function recursosPublicsDelPlugin({ directori } = {}) {
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
      for (const fileName of recursosDelPlugin(arrel)) {
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
   El paquet és UN artefacte per a tots els amfitrions: WordPress (banc de
   proves), Sollutia o una pàgina estàtica. Cada build deixa, al costat del
   bundle, la seua identitat llegible sense executar res: versió, node de dades
   segellat, empremtes del bundle (sha256 i SRI) i l'inventari exacte del que ha
   emés. L'adaptador de WordPress la llig per a la memòria cau i l'atribut
   integrity; Sollutia, per a fixar la versió i l'integrity del seu <script>;
   el canal d'actualitzacions en signa una còpia. Cap clau ni credencial: del
   node només viatja l'origen públic, que el bundle ja porta segellat. */

export const ESQUEMA_RELEASE = 'sdp.release.v1';
export const FITXER_RELEASE = 'sdp-release.json';
export const FITXER_INVENTARI = 'sdp-inventari.json';
export const ENTRADA_DEL_PAQUET = 'soc-de-poble.standalone.js';
const FONTS_DEL_PAQUET = 'fonts/noto-sans.css';

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

/** Cert si el host no és d'Internet: localhost, loopback, xarxa privada, enllaç local o .local. */
export function esHostLocal(host) {
  const h = String(host).replace(/^\[|\]$/g, '').toLowerCase();
  return h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h === '0.0.0.0' || h === '::1'
    || /^127\./.test(h) || /^10\./.test(h) || /^192\.168\./.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h)
    || /^169\.254\./.test(h) || /^f[cd][0-9a-f]{2}:/.test(h) || /^fe80:/.test(h);
}

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
 */
export function manifestDeRelease({ versio, node, fitxers, generat }) {
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
    node,
    entrada: {
      cami: ENTRADA_DEL_PAQUET,
      mida: entrada.contingut.length,
      sha256: sha256(entrada.contingut),
      integrity: sri384(entrada.contingut)
    },
    ...(fonts ? { fonts: { cami: FONTS_DEL_PAQUET, integrity: sri384(fonts.contingut) } } : {}),
    inventari: { cami: FITXER_INVENTARI, fitxers: inventari.length, sha256: sha256(inventariText) }
  };
  return { manifest, manifestText: `${JSON.stringify(manifest, null, 2)}\n`, inventariText };
}

/**
 * Escriu sdp-release.json i sdp-inventari.json a l'outDir amb el que el build
 * ha emés de veritat (el `bundle` de writeBundle), no amb el que hi ha al
 * disc: les restes de builds anteriors no entren mai a l'inventari, i
 * l'empaquetador només copia el que l'inventari nomena. El manifest de Vite
 * (.vite/) és una traça de compilació i en queda fora.
 */
export function manifestDeReleasePlugin({ versio, node, generat } = {}) {
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
        versio, node, fitxers, generat: generat ?? new Date().toISOString()
      });
      fs.writeFileSync(path.join(eixida, FITXER_INVENTARI), inventariText);
      fs.writeFileSync(path.join(eixida, FITXER_RELEASE), manifestText);
      registre.info(`[sdp-manifest-release] ${manifest.versio} · ${manifest.inventari.fitxers} fitxers · node ${manifest.node.origen ?? 'sense origen'} (${manifest.node.mode})${manifest.node.desenvolupament ? ' · DESENVOLUPAMENT: no es pot publicar' : ''}`);
    }
  };
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

  return {
    plugins: [
    react(),
    recursosPublicsDelPlugin(),
    manifestDeReleasePlugin({ versio, node, generat }),
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
         estàtica) carrega l'IIFE com a <script> clàssic i no té `process`. Si una
         dependència nova en llig una clau que el define no cobrix, el build falla
         ací en lloc de pintar una pantalla en blanc a l'amfitrió. Mira l'AST i no
         el text: la Wiki viatja dins del paquet i pot parlar de `process.env`. */
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
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV === 'production' ? 'production' : 'development')
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
    outDir: 'wordpress-plugin/dist',
    emptyOutDir: release,
    /* public/ el copia recursosPublicsDelPlugin, sense el que és propi del
       lloc (PROPIS_DEL_LLOC), i en acabar en retira les còpies que builds
       anteriors deixaren ací. copyPublicDir i no publicDir: la carpeta
       continua resolta i servida en desenvolupament. */
    copyPublicDir: false,
    manifest: true,
    cssCodeSplit: false,
    lib: {
      entry: path.resolve(__dirname, 'src/embed.jsx'),
      name: 'SocDePoble',
      formats: ['iife'],
      fileName: () => 'soc-de-poble.standalone.js'
    }
  }
  };
});
