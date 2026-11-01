/**
 * associacio-apps.mjs — Carril F-botigues (marató 261101, T6; Llibre Mestre P0-23) ·
 * L'associació entre el domini i l'app d'Android (Android App Links) sense cap
 * empremta inventada.
 *
 * El fitxer públic és /.well-known/assetlinks.json (Digital Asset Links). Una
 * empremta que no és la de la clau que signa l'app que la gent instal·la no
 * verifica res i diu una mentida en nom del domini. Per això:
 *   · les empremtes viuen a scripts/botigues/associacio-apps.json, buides fins
 *     que el Mestre hi copia les de Google Play Console (Integritat de l'app ›
 *     Signatura de l'app: la de la clau de signatura de l'app; si ho decidix,
 *     també la de la clau de pujada), en SHA-256, majúscules i dos punts;
 *   · el build web (vite.config.js, connector sdp:associacio-apps) emet
 *     .well-known/assetlinks.json NOMÉS amb empremtes i NOMÉS si l'origen del
 *     build és un dels `origens` de la configuració (un node germà amb un altre
 *     domini no parla en nom de l'app);
 *   · sense empremtes no s'emet res: el lloc torna 404 (firebase.json porta
 *     "appAssociation": "NONE", i la reescriptura de l'SPA deixa fora
 *     /.well-known/). Amb "AUTO", Firebase Hosting generaria el fitxer a partir
 *     de les apps del projecte de Firebase (API firebasehosting v1beta1,
 *     ServingConfig.appAssociation), fora del repositori: si n'hi ha empremtes i
 *     firebase.json no diu "NONE", el build para.
 *
 * L'App no declara hui cap intent-filter amb android:autoVerify (AndroidManifest.xml)
 * ni cap domini associat d'iOS (App.entitlements): publicar el fitxer no canvia
 * res fins que el manifest ho declare i l'App sàpia obrir l'enllaç rebut. El
 * fitxer d'Apple (apple-app-site-association) queda fora: no hi ha
 * com.apple.developer.associated-domains.
 *
 * Forma del fitxer (developer.android.com, «Verify Android App Links»):
 *   [{ "relation": ["delegate_permission/common.handle_all_urls"],
 *      "target": { "namespace": "android_app", "package_name": "org.socdepoble.app",
 *                  "sha256_cert_fingerprints": ["AA:BB:…"] } }]
 *
 * Ni el natiu (vite.natiu.config.js) ni el connector de WordPress
 * (vite.standalone.config.js) el registren. Un build SSR no emet res.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const CONFIGURACIO = 'scripts/botigues/associacio-apps.json';
export const FITXER_ASSETLINKS = '.well-known/assetlinks.json';
export const ESQUEMA = 'sdp.associacio-apps.v1';
export const PAQUET_ANDROID = 'org.socdepoble.app';
export const RELACIO = 'delegate_permission/common.handle_all_urls';
export const MAXIM_EMPREMTES = 4;
/* 32 octets en hexadecimal majúscul separats per dos punts: la forma que mostra Play Console. */
const EMPREMTA = /^[0-9A-F]{2}(?::[0-9A-F]{2}){31}$/;
const CLAUS_ARREL = Object.freeze(['$comentari', 'esquema', 'android']);
const CLAUS_ANDROID = Object.freeze(['package_name', 'origens', 'sha256_cert_fingerprints']);
const ORIGEN_PER_DEFECTE = 'src/config/origenPublic.js';

const esObjectePla = (valor) => valor !== null && typeof valor === 'object' && !Array.isArray(valor);

function nomesClaus(objecte, permeses, on) {
  const sobrants = Object.keys(objecte).filter((clau) => !permeses.includes(clau));
  if (sobrants.length) throw new TypeError(`${on}: claus desconegudes (${sobrants.join(', ')}).`);
}

/** L'origen https exacte (protocol i host, sense ruta ni barra final), o TypeError. */
export function origenExacte(valor) {
  let url = null;
  try { url = new URL(String(valor ?? '').trim()); } catch { url = null; }
  if (!url || url.protocol !== 'https:' || url.username || url.password || `${url.origin}` !== String(valor).trim().replace(/\/$/, '')) {
    throw new TypeError(`Origen no vàlid per a l'associació d'apps: ${String(valor).slice(0, 120)}`);
  }
  return url.origin;
}

/**
 * Una empremta SHA-256 tal com la mostra Play Console, o TypeError. Rebutja la
 * minúscula, els guions, la longitud que no és de 32 octets i el farciment
 * (tots els octets iguals, com 00:00:… o FF:FF:…): cap empremta de mostra.
 */
export function validaEmpremta(valor) {
  if (typeof valor !== 'string' || !EMPREMTA.test(valor)) {
    throw new TypeError('Empremta SHA-256 no vàlida: 32 octets en hexadecimal MAJÚSCUL separats per «:» (la forma de Play Console).');
  }
  const octets = valor.split(':');
  if (octets.every((octet) => octet === octets[0])) throw new TypeError(`Empremta de farciment rebutjada: ${valor.slice(0, 8)}…`);
  return valor;
}

/** La configuració validada i congelada. Llança TypeError si no és exactament la forma esperada. */
export function validaConfiguracio(configuracio) {
  if (!esObjectePla(configuracio)) throw new TypeError(`${CONFIGURACIO}: ha de ser un objecte JSON.`);
  nomesClaus(configuracio, CLAUS_ARREL, CONFIGURACIO);
  if (configuracio.esquema !== ESQUEMA) throw new TypeError(`${CONFIGURACIO}: esquema ${ESQUEMA} absent.`);
  const android = configuracio.android;
  if (!esObjectePla(android)) throw new TypeError(`${CONFIGURACIO}: falta l'objecte android.`);
  nomesClaus(android, CLAUS_ANDROID, `${CONFIGURACIO} › android`);
  if (android.package_name !== PAQUET_ANDROID) {
    throw new TypeError(`${CONFIGURACIO} › android.package_name ha de ser ${PAQUET_ANDROID} (capacitor.config.json i android/app/build.gradle).`);
  }
  if (!Array.isArray(android.origens) || android.origens.length === 0) throw new TypeError(`${CONFIGURACIO} › android.origens: cal almenys un origen.`);
  const origens = android.origens.map(origenExacte);
  if (new Set(origens).size !== origens.length) throw new TypeError(`${CONFIGURACIO} › android.origens: origen repetit.`);
  const empremtes = android.sha256_cert_fingerprints;
  if (!Array.isArray(empremtes)) throw new TypeError(`${CONFIGURACIO} › android.sha256_cert_fingerprints ha de ser una llista (buida si encara no n'hi ha).`);
  if (empremtes.length > MAXIM_EMPREMTES) throw new TypeError(`${CONFIGURACIO} › android.sha256_cert_fingerprints: com a molt ${MAXIM_EMPREMTES}.`);
  empremtes.forEach(validaEmpremta);
  if (new Set(empremtes).size !== empremtes.length) throw new TypeError(`${CONFIGURACIO} › android.sha256_cert_fingerprints: empremta repetida.`);
  return Object.freeze({
    esquema: ESQUEMA,
    android: Object.freeze({ package_name: PAQUET_ANDROID, origens: Object.freeze(origens), sha256_cert_fingerprints: Object.freeze([...empremtes]) })
  });
}

/** Llig i valida la configuració del repositori (`arrel`). */
export function llegixConfiguracio(arrel) {
  const fitxer = path.join(arrel, CONFIGURACIO);
  let text = '';
  try { text = fs.readFileSync(fitxer, 'utf8'); } catch (error) {
    throw new Error(`${CONFIGURACIO} absent: l'associació d'apps no pot decidir res sense ell.`, { cause: error });
  }
  let json = null;
  try { json = JSON.parse(text); } catch (error) { throw new TypeError(`${CONFIGURACIO}: JSON no vàlid.`, { cause: error }); }
  return validaConfiguracio(json);
}

/**
 * Les declaracions de Digital Asset Links per a `origen`, o null si no se n'ha
 * de publicar cap (sense empremtes, o un origen que no és dels de la configuració).
 */
export function construeixAssetLinks(configuracio, origen) {
  const { android } = validaConfiguracio(configuracio);
  if (android.sha256_cert_fingerprints.length === 0) return null;
  if (!android.origens.includes(origenExacte(origen))) return null;
  return [{
    relation: [RELACIO],
    target: { namespace: 'android_app', package_name: android.package_name, sha256_cert_fingerprints: [...android.sha256_cert_fingerprints] }
  }];
}

/** El text del fitxer: JSON amb dos espais i salt de línia final (estable entre builds). */
export const serialitza = (declaracions) => `${JSON.stringify(declaracions, null, 2)}\n`;

/** Llança si Firebase Hosting no servirà el fitxer del build (appAssociation ha de ser "NONE"). */
export function comprovaHosting(arrel) {
  let hosting = null;
  try { hosting = JSON.parse(fs.readFileSync(path.join(arrel, 'firebase.json'), 'utf8')).hosting; } catch { hosting = null; }
  if (!hosting || hosting.appAssociation !== 'NONE') {
    throw new Error('firebase.json ha de portar "appAssociation": "NONE": amb AUTO, Firebase Hosting genera el seu assetlinks.json i no serviria el del build.');
  }
}

/** L'origen públic del build: VITE_CANONICAL_URL o el de src/config/origenPublic.js. */
export async function origenDelBuild({ env = {}, arrel }) {
  const canonic = typeof env.VITE_CANONICAL_URL === 'string' ? env.VITE_CANONICAL_URL.trim() : '';
  if (canonic) return origenExacte(canonic.replace(/\/$/, ''));
  const { ORIGEN_PUBLIC_PER_DEFECTE } = await import(pathToFileURL(path.join(arrel, ORIGEN_PER_DEFECTE)).href);
  return origenExacte(ORIGEN_PUBLIC_PER_DEFECTE);
}

/** [[fileName, text]] del que el build ha d'emetre per a `origen` (buit si res). */
export function fitxersAssociacio({ arrel, origen }) {
  const declaracions = construeixAssetLinks(llegixConfiguracio(arrel), origen);
  if (!declaracions) return [];
  comprovaHosting(arrel);
  return [[FITXER_ASSETLINKS, serialitza(declaracions)]];
}

export default function associacioApps({ arrel } = {}) {
  let configuracio = null;
  return {
    name: 'sdp:associacio-apps',
    apply: 'build',
    configResolved(config) { configuracio = config; },
    async generateBundle() {
      if (!configuracio || configuracio.build?.ssr) return;
      const arrelDelProjecte = arrel ?? configuracio.root;
      const origen = await origenDelBuild({ env: configuracio.env ?? {}, arrel: arrelDelProjecte });
      for (const [fileName, source] of fitxersAssociacio({ arrel: arrelDelProjecte, origen })) {
        this.emitFile({ type: 'asset', fileName, source });
      }
    }
  };
}
