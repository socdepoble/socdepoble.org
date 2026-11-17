/**
 * manifestVersio.js — Onada v1.2.7 · P0-123 (ordre directa del Mestre, 17-11-2026: «actualització
 * automàtica real als mòbils de prova») · La lectura pura del manifest de versió públic,
 * https://socdepoble.org/.well-known/ard.json, i de public/versio-viva.json.
 *
 * Viu a config/ (i no a src/natiu/, que és un pou) perquè el lligen tres peces: el detector natiu
 * (natiu/actualitzacioAppNativa.js), l'avís de la PWA (pwa/actualitzacioWeb.js) i la línia
 * «Instal·lada al dispositiu · Última publicada» de /versions i /control
 * (components/universal/LiniaVersioInstallada.jsx). Pur (cap DOM, cap import), llevat de
 * consultaJsonPublic: un GET acotat amb el fetch que li passen.
 *
 * ELS CAMPS (els escriu NOMÉS scripts/botigues/publica-tot.mjs, amb les seues guardes):
 *   · version ············ la versió del sistema (package.json). Només veta un servidor més vell.
 *   · androidBuild ······· el build que ja dona Google Play (el sòl verificable de la botiga pública).
 *   · iosBuild ··········· el build que ja dona l'App Store.
 *   · testflightIosBuild · el build d'iOS que ha pujat puja-ios.mjs amb èxit (registre de pujades):
 *                          el canal de TestFlight. Opcional (els manifests d'abans no el porten).
 *   · apkDirectBuild ····· el build de l'APK signat que --publica-apk ha publicat a
 *     apkSha256            /descarregues/socdepoble-android-latest.apk, amb la SHA-256 d'eixe fitxer.
 *                          Opcionals i SEMPRE junts: un sense l'altre no val res.
 *   · latestBuild ········ el més alt de tots els anteriors (el calcula l'escriptor). Només per a
 *                          mostrar-lo: cap avís no el fa servir, perquè no diu de quin canal és.
 * Un camp mal format no tomba el manifest: es tracta com si no hi fóra (un manifest d'abans, o un
 * d'escrit a mà amb una errada, continua donant el comportament de sempre).
 */

/** Els camps de build del manifest, en l'ordre en què l'escriptor els deixa. */
export const CAMPS_BUILD_MANIFEST = Object.freeze(['androidBuild', 'iosBuild', 'testflightIosBuild', 'apkDirectBuild']);

const SEMVER = /^(\d{1,6})\.(\d{1,6})\.(\d{1,6})$/;
const SHA256 = /^[0-9a-f]{64}$/;

/** -1, 0 o 1 entre dues versions «x.y.z»; null si alguna no ho és. Mai llança. */
export function comparaSemver(a, b) {
  const pa = typeof a === 'string' ? SEMVER.exec(a) : null;
  const pb = typeof b === 'string' ? SEMVER.exec(b) : null;
  if (!pa || !pb) return null;
  for (let i = 1; i <= 3; i += 1) {
    const diferencia = Number(pa[i]) - Number(pb[i]);
    if (diferencia !== 0) return diferencia > 0 ? 1 : -1;
  }
  return 0;
}

/** Cert si `valor` és una versió «x.y.z». */
export const esSemver = (valor) => comparaSemver(valor, valor) === 0;

/** Cert si `valor` és un build: un enter positiu segur (mai un text). */
export const esBuild = (valor) => Number.isSafeInteger(valor) && valor >= 1;

/** Cert si `valor` és una SHA-256 en hexadecimal en minúscules. */
export const esSha256 = (valor) => typeof valor === 'string' && SHA256.test(valor);

/**
 * Un enter que ordena les versions «x.y.z» de la web (la barra ordena i ajorna per enters), o null
 * si la versió no s'entén o algun component passa de 999 (l'ordre deixaria de ser cert).
 */
export function ordinalSemver(versio) {
  const parts = typeof versio === 'string' ? SEMVER.exec(versio) : null;
  if (!parts) return null;
  const [major, minor, pedac] = [Number(parts[1]), Number(parts[2]), Number(parts[3])];
  if (minor > 999 || pedac > 999) return null;
  const ordinal = major * 1_000_000 + minor * 1_000 + pedac;
  return Number.isSafeInteger(ordinal) && ordinal >= 1 ? ordinal : null;
}

const esObjectePla = (valor) => Boolean(valor) && typeof valor === 'object' && !Array.isArray(valor);

/**
 * Els canals del manifest, cada camp validat a part: { versio, androidBuild, iosBuild,
 * testflightIosBuild, apkDirectBuild, apkSha256, latestBuild } amb null per a cada camp absent o mal
 * format, o null si `manifest` no és un objecte. `latestBuild` és el més alt entre el que diu el
 * manifest i els builds vàlids (mai més baix que cap canal). apkDirectBuild i apkSha256 van junts.
 */
export function llegixCanalsManifest(manifest) {
  if (!esObjectePla(manifest)) return null;
  const build = (camp) => (Object.hasOwn(manifest, camp) && esBuild(manifest[camp]) ? manifest[camp] : null);
  const apkSha256 = Object.hasOwn(manifest, 'apkSha256') && esSha256(manifest.apkSha256) ? manifest.apkSha256 : null;
  const apkBuild = build('apkDirectBuild');
  const canals = {
    versio: Object.hasOwn(manifest, 'version') && esSemver(manifest.version) ? manifest.version : null,
    androidBuild: build('androidBuild'),
    iosBuild: build('iosBuild'),
    testflightIosBuild: build('testflightIosBuild'),
    apkDirectBuild: apkBuild !== null && apkSha256 !== null ? apkBuild : null,
    apkSha256: apkBuild !== null && apkSha256 !== null ? apkSha256 : null
  };
  const builds = [build('latestBuild'), ...CAMPS_BUILD_MANIFEST.map((camp) => canals[camp])].filter((valor) => valor !== null);
  return Object.freeze({ ...canals, latestBuild: builds.length ? Math.max(...builds) : null });
}

/** La versió web publicada a versio-viva.json (versioSistema, «x.y.z»), o null. */
export function llegixVersioViva(dades) {
  if (!esObjectePla(dades) || !Object.hasOwn(dades, 'versioSistema')) return null;
  return esSemver(dades.versioSistema) ? dades.versioSistema : null;
}

export const TEMPS_MAXIM_CONSULTA_PUBLICA_MS = 5000;
export const MIDA_MAXIMA_JSON_PUBLIC = 64 * 1024;

/**
 * Un GET d'un JSON públic (el manifest o versio-viva.json): l'objecte, o null sense xarxa, amb un tall,
 * un no 2xx, un text massa gran o un JSON trencat. Sense galetes ni Referer, amb revalidació. Mai llança.
 */
export async function consultaJsonPublic({
  fetchImpl, url, tempsMaxim = TEMPS_MAXIM_CONSULTA_PUBLICA_MS, midaMaxima = MIDA_MAXIMA_JSON_PUBLIC, rellotge = globalThis
} = {}) {
  if (typeof fetchImpl !== 'function' || typeof url !== 'string' || !url) return null;
  let control = null;
  try { control = typeof AbortController === 'function' ? new AbortController() : null; } catch { control = null; }
  let temporitzador = null;
  const tall = new Promise((resolve) => {
    try {
      temporitzador = rellotge.setTimeout(() => {
        try { control?.abort(); } catch { /* res */ }
        resolve(null);
      }, tempsMaxim);
    } catch { resolve(null); }
  });
  const lectura = (async () => {
    const resposta = await fetchImpl(url, {
      method: 'GET',
      cache: 'no-cache',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      headers: { Accept: 'application/json' },
      ...(control ? { signal: control.signal } : {})
    });
    if (!resposta?.ok) return null;
    const text = await resposta.text();
    if (typeof text !== 'string' || text.length > midaMaxima) return null;
    const dades = JSON.parse(text);
    return esObjectePla(dades) ? dades : null;
  })().catch(() => null);
  try {
    return await Promise.race([lectura, tall]);
  } finally {
    try { rellotge.clearTimeout(temporitzador); } catch { /* res */ }
  }
}
