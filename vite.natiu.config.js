import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { esquemaInvertitDeGoogleIos, validatePublicCredentials } from './src/config/publicCredentials.js';
import { esHostLocal, politicaDeMitjans, recursosPublicsDelPlugin } from './vite.standalone.config.js';

/**
 * Build de l'app nativa (Fases 1 i 2 de l'empaquetat mòbil, 261003).
 * Disseny: _wiki_de_poble/04_escriptori/02_investigacio_ia/
 * 261003_1330_empaquetat_mobil_claude/ARQUITECTURA.txt, §4.4 i §5.
 *
 *   vite build -c vite.natiu.config.js --mode natiu
 *
 * L'eixida, dist-natiu/, és el webDir de Capacitor. L'entrada és el mateix
 * index.html del lloc, amb substitucions EXACTES (transformaIndexNatiu): si
 * algú canvia index.html i un text esperat ja no hi és, el build falla. Res de
 * substitucions a cegues.
 *
 * Fase C (261019_2115, tasca 2) · L'app porta la política de mitjans de
 * l'autònom: les bessones .webp en lloc dels originals pesants de
 * public/assets/ (politicaDeMitjansNativa, més avall).
 *
 * Este fitxer no importa res de Capacitor: es pot escriure i provar abans de
 * la lease de package.json (FASES_1_I_2.txt §1). Les peces pures s'exporten,
 * com fa vite.standalone.config.js, i les prova tests/natiu-build.test.mjs
 * amb fixtures, sense cap build.
 */

export const MODE_NATIU = 'natiu';
export const DIRECTORI_NATIU = 'dist-natiu';
export const ENTRADA_NATIVA = '/src/natiu/entrada.jsx';
export const FONTS_LOCALS = '/fonts/noto-sans.css';
/* Des del 261004 el lloc ja porta les fonts de casa (Q7): index.html no té
   cap enllaç a Google Fonts que calga substituir. Este és l'enllaç que l'app
   ha de conservar, una sola vegada. */
export const ENLLAC_FONTS_LOCALS = `<link rel="stylesheet" href="${FONTS_LOCALS}" />`;

/* La mateixa forma que exigix backendConfig.js:normalizeBackendConfig. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/* Fase D (261020, tasca 1) · La forma d'un client OAuth de Google (web o iOS). */
const CLIENT_GOOGLE = /^\d+-[a-z0-9]+\.apps\.googleusercontent\.com$/;
const errorDeFormaGoogle = (clau) => `${clau} no té la forma d’un client OAuth de Google (número-id.apps.googleusercontent.com).`;

/* ─────────────────────────── La CSP de l'app ───────────────────────────
   ARQUITECTURA §4.4. Dins de l'app només compta la meta (no hi ha cap
   capçalera de servidor). connect-src porta data: perquè tres pujades fan
   fetch(dataUrl) abans de pujar la imatge; la resta de connect-src és només el
   backend segellat. worker-src 'none': dins de l'app no hi ha cap worker.
   Gauntlet 261022_0225 (crítica Claude, MEDIA-2) · media-src, amb la mateixa
   amplària que img-src: sense, les notes de veu i els vídeos del xat (URL
   signades https del Storage) heretaven default-src i no sonaven mai. */

/** L'origen públic del backend, o un error: https, sense ruta i fora de la xarxa local. */
function origenPublic(origenBackend) {
  let url;
  try { url = new URL(origenBackend); } catch {
    throw new Error(`[sdp-natiu] origenBackend no és una URL: «${origenBackend}».`);
  }
  if (url.protocol !== 'https:' || url.origin !== origenBackend || esHostLocal(url.hostname)) {
    throw new Error(`[sdp-natiu] origenBackend ha de ser un origen https públic i exacte (protocol i host, sense ruta), no «${origenBackend}».`);
  }
  return url;
}

/** El contingut de la meta CSP de l'app nativa per al backend `origenBackend`. */
export function cspNativa(origenBackend) {
  const url = origenPublic(origenBackend);
  return [
    "default-src 'self' data: blob:",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    `connect-src 'self' data: ${url.origin} wss://${url.host}`,
    "img-src 'self' data: blob: https:",
    "media-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "frame-src 'self' https:",
    "worker-src 'none'",
    "object-src 'none'",
    "base-uri 'self'"
  ].join('; ');
}

/* ───────────────────── Les substitucions d'index.html ─────────────────────
   Cada `cerca` és un text literal de l'index.html actual i hi ha d'aparéixer
   EXACTAMENT una vegada. `posa` és el que el substituïx (un text, o una funció
   que rep la CSP nativa); si és null, la línia sencera se'n va (i el text ha
   d'estar sol a la seua línia). `fins` estén el tros que se'n va fins al
   primer text igual, per a un comentari de més d'una línia. Si index.html
   canvia, una prova ho diu abans que el build. */

const META_CSP_DEL_WEB = `<meta http-equiv="Content-Security-Policy" content="default-src 'self' data: blob:; style-src 'self' 'unsafe-inline' https:; script-src 'self'; worker-src 'self' blob:; connect-src 'self' data: https: wss: ws://localhost:* http://localhost:* http://127.0.0.1:*; img-src 'self' data: blob: https: http://localhost:* http://127.0.0.1:* sdp-media:; media-src 'self' data: blob: https: http://localhost:* http://127.0.0.1:*; font-src 'self' https: data:; frame-src 'self' https:; object-src 'none'; base-uri 'self';">`;

export const SUBSTITUCIONS_NATIVES = Object.freeze([
  Object.freeze({ que: "l'entrada del lloc", cerca: '<script type="module" src="/src/main.jsx"></script>', posa: `<script type="module" src="${ENTRADA_NATIVA}"></script>` }),
  Object.freeze({ que: 'la CSP del web', cerca: META_CSP_DEL_WEB, posa: (csp) => `<meta http-equiv="Content-Security-Policy" content="${csp}">` }),
  Object.freeze({ que: 'el comentari de la PWA (Fase 0)', cerca: '<!-- PWA (Fase 0, 261003): el primer theme-color que casa guanya. Només casa', fins: '-->', posa: null }),
  Object.freeze({ que: 'el theme-color de la PWA instal·lada', cerca: '<meta name="theme-color" media="(display-mode: standalone)" content="#0e0d0c" />', posa: null }),
  Object.freeze({ que: 'el manifest de la PWA', cerca: '<link rel="manifest" href="/manifest.webmanifest" />', posa: null }),
  Object.freeze({ que: 'mobile-web-app-capable', cerca: '<meta name="mobile-web-app-capable" content="yes" />', posa: null }),
  Object.freeze({ que: 'apple-mobile-web-app-capable', cerca: '<meta name="apple-mobile-web-app-capable" content="yes" />', posa: null }),
  Object.freeze({ que: 'apple-mobile-web-app-title', cerca: '<meta name="apple-mobile-web-app-title" content="Sóc de Poble" />', posa: null }),
  Object.freeze({ que: 'apple-mobile-web-app-status-bar-style', cerca: '<meta name="apple-mobile-web-app-status-bar-style" content="black" />', posa: null })
]);

/** On comença `text` dins d'`html`; llança si no hi és o si hi és més d'una vegada. */
function posicioUnica(html, text, que) {
  const inici = html.indexOf(text);
  if (inici === -1) {
    throw new Error(`[sdp-natiu] index.html ja no porta ${que} («${text}»). Revisa SUBSTITUCIONS_NATIVES a vite.natiu.config.js abans de compilar.`);
  }
  if (html.indexOf(text, inici + 1) !== -1) {
    throw new Error(`[sdp-natiu] index.html porta ${que} més d'una vegada («${text}»): la substitució seria ambigua.`);
  }
  return inici;
}

/** Les línies senceres que ocupa [inici, fi); llança si hi ha res més en elles. */
function liniesSenceres(html, inici, fi, que) {
  const desDe = html.lastIndexOf('\n', inici - 1) + 1;
  const salt = html.indexOf('\n', fi);
  const finsA = salt === -1 ? html.length : salt + 1;
  if (html.slice(desDe, inici).trim() || html.slice(fi, finsA).trim()) {
    throw new Error(`[sdp-natiu] A index.html, ${que} no és sol a la seua línia: no es lleva a mitges.`);
  }
  return [desDe, finsA];
}

/* Després de substituir: el que l'app no ha de portar, de cap manera. */
const VETATS_A_L_EIXIDA = Object.freeze([
  ['fonts.googleapis.com', 'Google Fonts'],
  ['fonts.gstatic.com', 'Google Fonts'],
  ['rel="manifest"', 'el manifest de la PWA'],
  ['/src/main.jsx', "l'entrada del lloc"],
  ['apple-mobile-web-app', 'una meta de la PWA'],
  ['localhost', 'un origen local'],
  ['127.0.0.1', 'un origen local']
]);

/**
 * L'index.html del lloc convertit en el de l'app nativa: l'entrada nativa, la
 * CSP de §4.4 amb el backend segellat, les fonts locals i cap rastre de la PWA.
 * Pura: no llig cap fitxer ni cap variable d'entorn.
 * @param {string} html
 * @param {{ origenBackend: string }} opcions l'origen https de VITE_SUPABASE_URL
 * @returns {string}
 */
export function transformaIndexNatiu(html, { origenBackend } = {}) {
  if (typeof html !== 'string') throw new TypeError('[sdp-natiu] transformaIndexNatiu necessita el text d\'index.html.');
  const csp = cspNativa(origenBackend);
  let eixida = html;
  for (const { que, cerca, fins, posa } of SUBSTITUCIONS_NATIVES) {
    const inici = posicioUnica(eixida, cerca, que);
    let fi = inici + cerca.length;
    if (fins) {
      /* El tancament ha de ser el seu: si abans n'obri un altre (<!--), no
         s'empassa res més que el comentari propi. */
      const tanca = eixida.indexOf(fins, fi);
      const altre = eixida.indexOf('<!--', fi);
      if (tanca === -1 || (altre !== -1 && altre < tanca)) throw new Error(`[sdp-natiu] A index.html, ${que} no es tanca amb «${fins}».`);
      fi = tanca + fins.length;
    }
    if (posa === null) {
      const [desDe, finsA] = liniesSenceres(eixida, inici, fi, que);
      eixida = eixida.slice(0, desDe) + eixida.slice(finsA);
    } else {
      const text = typeof posa === 'function' ? posa(csp) : posa;
      eixida = eixida.slice(0, inici) + text + eixida.slice(fi);
    }
  }
  for (const [text, que] of VETATS_A_L_EIXIDA) {
    if (eixida.includes(text)) throw new Error(`[sdp-natiu] Després de substituir, index.html encara porta ${que} («${text}»).`);
  }
  if (eixida.split('http-equiv="Content-Security-Policy"').length !== 2) {
    throw new Error('[sdp-natiu] Després de substituir, index.html ha de portar exactament una meta CSP.');
  }
  if (eixida.split(ENLLAC_FONTS_LOCALS).length !== 2) {
    throw new Error(`[sdp-natiu] Després de substituir, index.html ha de portar les fonts de casa exactament una vegada («${ENLLAC_FONTS_LOCALS}»).`);
  }
  return eixida;
}

/* ─────────────────────────── L'entorn del build ───────────────────────────
   Vite carrega .env i .env.local en QUALSEVOL mode: un .env.local de
   desenvolupament acabaria segellat dins del binari de la botiga. I no només
   les variables que el codi llig una a una: telemetria.js i configFonts.js
   reben import.meta.env sencer, i el build el substituïx per un objecte amb
   TOTES les VITE_* (definePlugin de Vite). Per això, a més de
   errorsEntornNatiu, el build no hereta cap VITE_* amb valor de .env ni de
   .env.local (heretadesDelLloc): o la declara .env.natiu*, o el procés. */

const textNet = (valor) => (typeof valor === 'string' ? valor.trim() : '');

/* Un mode sense fitxers propis: loadEnv hi llig només .env, .env.local i el procés. */
const MODE_SENSE_FITXERS = 'sdp-natiu-sense-fitxers';

/**
 * Els noms que declara el text d'un fitxer .env, en l'ordre en què hi són. Cap
 * valor: només el que hi ha abans del primer «=» (o «: », que dotenv també
 * admet), amb l'«export» opcional.
 * @param {string} text
 * @returns {string[]}
 */
export function nomsDeclarats(text = '') {
  return [...String(text).matchAll(/^[ \t]*(?:export[ \t]+)?([\w.-]+)[ \t]*(?:=|:[ \t])/gm)].map((m) => m[1]);
}

/**
 * Les VITE_* amb valor que el build natiu només rebria de .env o de .env.local:
 * són a l'entorn de desenvolupament (`base`) amb el mateix valor, i ni els
 * fitxers .env.natiu* (`declarades`) ni el procés (`delProces`) no les
 * declaren. Ordenades. Pura.
 * @param {{ natiu?: object, base?: object, declarades?: Iterable<string>, delProces?: object }} entorns
 * @returns {string[]}
 */
export function heretadesDelLloc({ natiu = {}, base = {}, declarades = [], delProces = {} } = {}) {
  const propies = new Set(declarades);
  return Object.keys(natiu).filter((clau) => clau.startsWith('VITE_') && textNet(natiu[clau])
    && !propies.has(clau) && !Object.hasOwn(delProces, clau)
    && Object.hasOwn(base, clau) && base[clau] === natiu[clau]).sort();
}

/** Els noms que declaren .env.natiu i .env.natiu.local d'`arrel`, si hi són. */
function declaradesPelNatiu(arrel) {
  return [`.env.${MODE_NATIU}`, `.env.${MODE_NATIU}.local`].flatMap((nom) => {
    const cami = path.join(arrel, nom);
    return fs.existsSync(cami) ? nomsDeclarats(fs.readFileSync(cami, 'utf8')) : [];
  });
}

/**
 * Per què este entorn no pot fer un build natiu. Buit si pot.
 * · VITE_SUPABASE_URL: https i fora de la xarxa local.
 * · VITE_UMAMI_* i VITE_GOOGLE_OAUTH_CLIENT_ID: buides (D10 i BOTIGUES B5).
 * · VITE_TENANT_ID: opcional, perquè el poble el tria la persona; si hi és,
 *   ha de ser un UUID (si no, la capa el descartaria en silenci).
 * · VITE_NATIU_GOOGLE_WEB_CLIENT_ID i VITE_NATIU_GOOGLE_IOS_CLIENT_ID: opcionals,
 *   amb la forma d'un client de Google, l'iOS amb el web i diferents (Fase D).
 * @param {Record<string, string|undefined>} env
 * @returns {string[]}
 */
export function errorsEntornNatiu(env = {}) {
  const errors = [];
  let url = null;
  try { url = new URL(textNet(env.VITE_SUPABASE_URL)); } catch { /* sense URL vàlida */ }
  if (!url) {
    errors.push('VITE_SUPABASE_URL no és una URL vàlida: el binari no tindria backend.');
  } else if (url.protocol !== 'https:') {
    errors.push(`VITE_SUPABASE_URL (${url.origin}) ha de ser https: l'app no parla amb cap backend en clar.`);
  } else if (esHostLocal(url.hostname)) {
    errors.push(`VITE_SUPABASE_URL (${url.origin}) és local: un .env.local de desenvolupament quedaria segellat dins del binari.`);
  }
  for (const clau of Object.keys(env).filter((nom) => nom.startsWith('VITE_UMAMI_')).sort()) {
    if (textNet(env[clau])) errors.push(`${clau} ha d'estar buida: dins de l'app la telemetria va apagada (D10).`);
  }
  if (textNet(env.VITE_GOOGLE_OAUTH_CLIENT_ID)) {
    errors.push('VITE_GOOGLE_OAUTH_CLIENT_ID ha d\'estar buida: Google Calendar no funciona dins de l\'app (BOTIGUES B5).');
  }
  /* Fase D (261020, tasca 1) · Els dos clients OAuth de Google de l'entrada nativa
     (src/natiu/entrada.jsx). Públics i opcionals; si hi són, amb la forma d'un client,
     l'iOS mai sense el web (el testimoni naix amb l'audiència del web) i mai el mateix. */
  const googleWeb = textNet(env.VITE_NATIU_GOOGLE_WEB_CLIENT_ID);
  const googleIos = textNet(env.VITE_NATIU_GOOGLE_IOS_CLIENT_ID);
  for (const [clau, valor] of [['VITE_NATIU_GOOGLE_WEB_CLIENT_ID', googleWeb], ['VITE_NATIU_GOOGLE_IOS_CLIENT_ID', googleIos]]) {
    if (valor && !CLIENT_GOOGLE.test(valor)) errors.push(errorDeFormaGoogle(clau));
  }
  if (googleIos && !googleWeb) errors.push('VITE_NATIU_GOOGLE_IOS_CLIENT_ID sense VITE_NATIU_GOOGLE_WEB_CLIENT_ID: el testimoni naix amb l’audiència del client web i Supabase el rebutjaria.');
  if (googleWeb && googleWeb === googleIos) errors.push('El client web i el client iOS de Google han de ser dos clients diferents.');
  const tenant = textNet(env.VITE_TENANT_ID);
  if (tenant && !UUID.test(tenant)) {
    errors.push('VITE_TENANT_ID és opcional, però si hi és ha de ser l’UUID d’un poble (public.towns).');
  }
  return errors;
}

/* Fase D (261020, tasca 5) · El projecte d'iOS (ios/, de `cap add ios`) porta a
   Info.plist este esquema de reserva fins que el Mestre dona el client d'iOS de
   Google (públic): GoogleSignIn fa petar l'app si l'esquema invertit del client no
   hi és registrat, i amb la reserva Google no s'oferix a iOS. */
export const ESQUEMA_GOOGLE_PENDENT = 'com.googleusercontent.apps.pendent';

/**
 * Per què el client d'iOS de Google i l'Info.plist del projecte no casen. Buit si
 * casen, si no hi ha client (Google no s'oferix a iOS) o si no hi ha projecte
 * d'iOS (`infoPlist` null). Mai imprimix el client. Pura.
 * @param {{ clientId?: string, infoPlist?: string|null }} entrada
 * @returns {string[]}
 */
export function errorsGoogleIos({ clientId, infoPlist = null } = {}) {
  const client = textNet(clientId);
  if (!client) return [];
  const esquema = esquemaInvertitDeGoogleIos(client);
  if (!esquema) return [errorDeFormaGoogle('VITE_NATIU_GOOGLE_IOS_CLIENT_ID')];
  if (infoPlist === null || infoPlist === undefined) return [];
  return String(infoPlist).includes(`<string>${esquema}</string>`) ? [] : [
    'ios/App/App/Info.plist no registra a CFBundleURLTypes l\'esquema invertit de VITE_NATIU_GOOGLE_IOS_CLIENT_ID: GoogleSignIn faria petar l\'app en tocar «Continua amb Google».'
  ];
}

/** L'Info.plist del projecte d'iOS d'`arrel`, o null si no n'hi ha. */
function infoPlistDe(arrel) {
  const cami = path.join(arrel, 'ios', 'App', 'App', 'Info.plist');
  return fs.existsSync(cami) ? fs.readFileSync(cami, 'utf8') : null;
}

/* ─────────────────── La política de mitjans de l'app ───────────────────
   Fase C (261019_2115, tasca 2) · L'app porta la política de l'autònom
   (decisió D3 del Mestre, politicaDeMitjans de vite.standalone.config.js):
   viatja la bessona .webp en lloc de cada original PNG/JPEG que en té, i
   cap origen extern, perquè dins de l'app tot és local (capacitor://localhost
   a iOS, https://localhost a Android). S'aplica als mateixos dos llocs que a
   l'autònom, o les imatges es trenquen: recursosPublicsDelPlugin no emet els
   originals substituïts, i el define la segella perquè resolveAsset
   (assetResolver.js) hi demane la bessona.
   El recurs de fallbackBessones.js no s'hi instal·la: només el munta
   <soc-de-poble>, i l'app munta PedraSecaEmbed sense l'element. Està bé
   així: l'original no hi viatja, i un segon intent seria un altre fitxer que
   no hi és. Les bessones, sí: les tria el mateix càlcul sobre el mateix
   public/. */

/* Els originals que l'app demana TAL QUAL, sense passar pel resolutor. Dins
   de l'app un fitxer local que falta és una imatge trencada: estos no se
   substituïxen, i hi viatgen com al lloc (l'original, i la bessona al
   costat). `fitxer` és on viu la cita i `cites`, els textos que la fan; una
   prova comprova que hi continuen (si algú la fa passar pel resolutor,
   l'excepció sobra i la prova ho diu) i que cap url() dels CSS de src/ no
   cita cap altre original amb bessona.
   Ordre del Mestre (261021, pla 261021_0015 §13, P1-05) · Buida: les dues que
   hi havia ja citen la bessona .webp (el fons del Xat a tokens.css i a
   PedraSecaEmbed.jsx, i la foto de mostra d'EspecimenEnquadrament.jsx), i els
   seus originals (1,2 MB i 764 KB) ja no viatgen dins de l'app. Una cita crua
   nova d'un original amb bessona torna ací, amb la forma
   { original, que, fitxer, cites }, congelada. */
export const ORIGINALS_CITATS_SENSE_RESOLUTOR = Object.freeze([]);

/* Fase D (261020, L10) · Els índexs de la Wiki que el connector porta per transparència
   radical i que l'app no llig mai (cap fitxer de src/ els demana; la IAIA local llig
   wikiManifest.js amb import(), iaiaLocal.js:217). −1.432.575 B crus.
   seo-routes.json no hi és: build:seo l'escriu a wordpress-plugin/dist/. */
export const RECURSOS_QUE_L_APP_NO_LLIG = Object.freeze(['rag-index.json', 'slugIndex.json']);

/**
 * La política de mitjans de l'app a partir de la de l'autònom
 * (politicaDeMitjans('autonom')): cap origen ni cap carpeta externa, encara
 * que la rebuda en portara, i les bessones menys els originals `excloses`.
 * Sense cap bessona, null, com politicaDeMitjans. Pura.
 * @param {{ bessones?: string[] } | null} politica
 * @param {Iterable<string>} excloses
 * @returns {{ origen: null, externs: string[], bessones: string[] } | null}
 */
export function politicaDeMitjansNativa(politica, excloses = ORIGINALS_CITATS_SENSE_RESOLUTOR.map(({ original }) => original)) {
  if (!politica) return null;
  const fora = new Set(excloses);
  const bessones = Object.freeze((politica.bessones || []).filter((cami) => !fora.has(cami)));
  return bessones.length ? Object.freeze({ origen: null, externs: Object.freeze([]), bessones }) : null;
}

/** Connector de Vite: aplica transformaIndexNatiu abans que Vite busque l'entrada a l'HTML. */
export function indexNatiuPlugin({ origenBackend } = {}) {
  cspNativa(origenBackend); // Valida en crear el connector, abans de compilar res.
  return {
    name: 'sdp-index-natiu',
    apply: 'build',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => transformaIndexNatiu(html, { origenBackend })
    }
  };
}

export default defineConfig(({ mode, command, isPreview }) => {
  /* Compilar, o previsualitzar dist-natiu/ en un navegador d'escriptori. */
  if (command !== 'build' && !isPreview) {
    throw new Error('[sdp-natiu] vite.natiu.config.js només compila (o previsualitza): el desenvolupament es fa amb vite.config.js.');
  }
  if (mode !== MODE_NATIU) {
    throw new Error(`[sdp-natiu] El build natiu va amb --mode ${MODE_NATIU} (llig .env.natiu i .env.natiu.local), no amb «${mode}».`);
  }
  const arrel = process.cwd();
  const env = loadEnv(mode, arrel, '');
  const heretades = heretadesDelLloc({
    natiu: env,
    base: loadEnv(MODE_SENSE_FITXERS, arrel, ''),
    declarades: declaradesPelNatiu(arrel),
    delProces: process.env
  });
  /* Fase D (tasca 5) · Sense l'esquema invertit a Info.plist, el client d'iOS faria
     petar l'app; un client mal format ja el diu errorsEntornNatiu, i no es repetix. */
  const errorsGoogle = errorsGoogleIos({ clientId: env.VITE_NATIU_GOOGLE_IOS_CLIENT_ID, infoPlist: infoPlistDe(arrel) });
  const errors = [
    ...new Set([...errorsEntornNatiu(env), ...errorsGoogle]),
    ...(heretades.length ? [`Només arriben de .env o .env.local: ${heretades.join(', ')}. El binari no hereta l'entorn de desenvolupament; declara cadascuna a .env.natiu.local (buida, si no ha d'entrar).`] : [])
  ];
  if (errors.length) throw new Error(`[sdp-natiu] Este build natiu no es pot fer:\n- ${errors.join('\n- ')}`);
  validatePublicCredentials(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
  const origenBackend = new URL(env.VITE_SUPABASE_URL).origin;
  /* Fase C (tasca 2) · La de l'autònom, calculada sobre el public/ que
     s'emetrà, sense els originals que l'app cita sense resolutor. */
  const mitjans = politicaDeMitjansNativa(politicaDeMitjans('autonom', { directori: path.resolve(__dirname, 'public') }));

  return {
    mode: MODE_NATIU,
    /* Capacitor servix l'app a l'arrel de capacitor://localhost (iOS) i
       https://localhost (Android). La base del web i del connector no canvia
       (consell de Codex, 261003_1950_auditoria_codex). */
    base: '/',
    plugins: [
      react(),
      /* Els recursos de public/ sense els propis del lloc (PROPIS_DEL_LLOC):
         ni sw.js ni manifest.webmanifest, ni auth/, ni robots.txt. Amb la
         política, sense els originals que tenen bessona (Fase C, tasca 2), i
         sense els índexs de la Wiki que l'app no llig (Fase D, L10). */
      recursosPublicsDelPlugin({ politica: mitjans, exclosos: RECURSOS_QUE_L_APP_NO_LLIG }),
      indexNatiuPlugin({ origenBackend })
    ],
    /* Fase C (tasca 2) · La política, segellada com a l'autònom
       (vite.standalone.config.js): assetResolver.js la llig en avaluar-se,
       abans que cap mòdul resolga cap imatge. Sense política (un public/
       sense bessones), la clau no hi és i tot resol com al lloc. */
    define: {
      ...(mitjans ? { 'import.meta.env.SDP_POLITICA_DE_MITJANS': JSON.stringify(mitjans) } : {})
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    build: {
      target: 'es2022',
      outDir: DIRECTORI_NATIU,
      emptyOutDir: true,
      /* public/ el copia recursosPublicsDelPlugin; el copyPublicDir de Vite
         el copiaria sencer, amb la PWA. */
      copyPublicDir: false
    }
  };
});
