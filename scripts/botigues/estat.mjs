/**
 * scripts/botigues/estat.mjs — Onada R9 · C3 (IDEA-120 / P0-30, ordre del Mestre del 261106) ·
 * L'estat HONEST de les botigues, fora de línia: llig els fitxers reals del projecte i diu què hi ha,
 * sense eines, sense git, sense xarxa i sense pujar res. Dels fitxers d'entorn, només això (G2-08):
 * llig els .env de build només per saber si VITE_PUSH_VAPID_PUBLICA hi té valor; no en guarda ni n'imprimix cap.
 *
 *   node scripts/botigues/preflight.mjs --estat        (o: node scripts/botigues/estat.mjs)
 *
 * Què llig, i res més:
 *   · android/variables.gradle (minSdk, compileSdk, targetSdk) i android/app/build.gradle
 *     (applicationId, versionCode, versionName; el targetSdk efectiu, amb targetSdkAndroid);
 *   · ios/App/App.xcodeproj/project.pbxproj (MARKETING_VERSION, CURRENT_PROJECT_VERSION,
 *     IPHONEOS_DEPLOYMENT_TARGET, PRODUCT_BUNDLE_IDENTIFIER: el valor si totes les configuracions
 *     diuen el mateix, null si discrepen);
 *   · ios/App/App/App.entitlements (aps-environment, dominis associats), Info.plist (textos de
 *     permisos, ITSAppUsesNonExemptEncryption) i PrivacyInfo.xcprivacy (NSPrivacyTracking);
 *   · AndroidManifest.xml i els dels connectors (POST_NOTIFICATIONS), el connector d'avisos remots
 *     i l'AppDelegate (estatDelPush, el de preflight.mjs);
 *   · scripts/botigues/associacio-apps.json (les empremtes d'assetlinks.json) i si hi ha
 *     apple-app-site-association;
 *   · l'eliminació del compte: l'àncora pública de /legal (#esborra-compte) i la baixa dins de l'app
 *     (DetallPrivacitat.jsx crida demanaBaixa);
 *   · la versió de package.json.
 * Mai cap valor de cap .env ni cap secret: de la clau VAPID només diu si la variable hi té valor (a
 * l'entorn del procés o als .env del build de producció), sense guardar-lo ni imprimir-lo.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { estatDelPush, targetSdkAndroid, TARGET_SDK_PLAY_MINIM } from './preflight.mjs';

const lligDe = (arrel, ...trossos) => { try { return fs.readFileSync(path.join(arrel, ...trossos), 'utf8'); } catch { return null; } };
const existix = (arrel, ...trossos) => fs.existsSync(path.join(arrel, ...trossos));

/* Els comentaris d'XML fora, en una passada (sense regex amb retrocés). */
function senseComentarisXml(text) {
  const font = String(text ?? '');
  let eixida = '';
  let i = 0;
  for (;;) {
    const obri = font.indexOf('<!--', i);
    if (obri < 0) return eixida + font.slice(i);
    eixida += font.slice(i, obri);
    const tanca = font.indexOf('-->', obri + 4);
    if (tanca < 0) return eixida;
    i = tanca + 3;
  }
}
const senseComentarisGradle = (text) => String(text ?? '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(?<![:"'])\/\/[^\n]*/g, '');

/** Un enter d'ext { nom = N } de variables.gradle, o null. */
function variableGradle(text, nom) {
  const m = new RegExp(`^\\s*${nom}\\s*=\\s*(\\d+)\\s*$`, 'm').exec(senseComentarisGradle(text));
  return m ? Number(m[1]) : null;
}

/** El valor d'una clau del .pbxproj si totes les configuracions diuen el mateix; null si no n'hi ha o discrepen. */
export function valorPbxproj(text, clau) {
  const valors = [...String(text ?? '').matchAll(new RegExp(`\\b${clau} = "?([^";]+)"?;`, 'g'))].map((m) => m[1].trim());
  const unics = [...new Set(valors)];
  return unics.length === 1 ? unics[0] : null;
}

/** Els PRODUCT_BUNDLE_IDENTIFIER diferents del .pbxproj, en ordre d'aparició. */
export function identificadorsPbxproj(text) {
  return [...new Set([...String(text ?? '').matchAll(/\bPRODUCT_BUNDLE_IDENTIFIER = "?([^";]+)"?;/g)].map((m) => m[1].trim()))];
}

/* Els fitxers d'entorn que Vite llig en un build de producció (mode production), en ordre.
   Només es mira si la variable hi té NOM i un valor no buit: el valor no es guarda ni s'imprimix. */
const ENTORNS_DEL_BUILD = Object.freeze(['.env', '.env.local', '.env.production', '.env.production.local']);
function teClauVapid(arrel, env) {
  if (typeof env?.VITE_PUSH_VAPID_PUBLICA === 'string' && env.VITE_PUSH_VAPID_PUBLICA.trim()) return { te: true, on: 'entorn del procés' };
  for (const fitxer of ENTORNS_DEL_BUILD) {
    const text = lligDe(arrel, fitxer);
    if (text !== null && /^\s*VITE_PUSH_VAPID_PUBLICA\s*=\s*\S/m.test(text)) return { te: true, on: fitxer };
  }
  return { te: false, on: null };
}

/** Les claus <key>…</key> d'un plist (sense comentaris). */
const clausPlist = (text) => [...senseComentarisXml(text).matchAll(/<key>([^<]+)<\/key>/g)].map((m) => m[1]);

/**
 * L'estat, com a dades. Pura respecte al disc: només llig.
 * @returns {object}
 */
export function estatDeLesBotigues(arrel, { env = process.env } = {}) {
  const variables = lligDe(arrel, 'android', 'variables.gradle');
  const gradle = senseComentarisGradle(lligDe(arrel, 'android', 'app', 'build.gradle'));
  const pbx = lligDe(arrel, 'ios', 'App', 'App.xcodeproj', 'project.pbxproj');
  const drets = senseComentarisXml(lligDe(arrel, 'ios', 'App', 'App', 'App.entitlements'));
  const plist = lligDe(arrel, 'ios', 'App', 'App', 'Info.plist');
  const privacitat = senseComentarisXml(lligDe(arrel, 'ios', 'App', 'App', 'PrivacyInfo.xcprivacy'));
  let associacio = null;
  try { associacio = JSON.parse(lligDe(arrel, 'scripts', 'botigues', 'associacio-apps.json') ?? 'null'); } catch { associacio = null; }
  let paquet = null;
  try { paquet = JSON.parse(lligDe(arrel, 'package.json') ?? 'null'); } catch { paquet = null; }
  const legal = lligDe(arrel, 'src', 'sections', 'text', 'legalContent.js') ?? '';
  const privacitatApp = lligDe(arrel, 'src', 'sections', 'profile', 'DetallPrivacitat.jsx') ?? '';
  const push = estatDelPush(arrel);
  let appId = null;
  try { appId = JSON.parse(lligDe(arrel, 'capacitor.config.json') ?? 'null')?.appId ?? null; } catch { appId = null; }
  const permisos = clausPlist(plist).filter((clau) => /^NS[A-Za-z]+UsageDescription$/.test(clau));
  return {
    versioWeb: paquet?.version ?? null,
    android: {
      paquet: /^\s*applicationId\s+["']([^"']+)["']\s*$/m.exec(gradle)?.[1] ?? null,
      versio: /^\s*versionName\s+["']([^"']+)["']\s*$/m.exec(gradle)?.[1] ?? null,
      build: Number(/^\s*versionCode\s+(\d+)\s*$/m.exec(gradle)?.[1] ?? NaN) || null,
      minSdk: variableGradle(variables, 'minSdkVersion'),
      compileSdk: variableGradle(variables, 'compileSdkVersion'),
      targetSdk: targetSdkAndroid(arrel),
      targetSdkPlayMinim: TARGET_SDK_PLAY_MINIM,
      postNotifications: push.android.postNotifications,
      assetlinks: Array.isArray(associacio?.android?.sha256_cert_fingerprints) ? associacio.android.sha256_cert_fingerprints.length : null
    },
    ios: {
      /* L'app i les seues extensions (la de Compartir) tenen identificadors diferents: el de l'app
         és el de capacitor.config.json, si el .pbxproj el porta. */
      paquet: identificadorsPbxproj(pbx).includes(appId) ? appId : null,
      extensions: identificadorsPbxproj(pbx).filter((id) => id !== appId),
      versio: valorPbxproj(pbx, 'MARKETING_VERSION'),
      build: Number(valorPbxproj(pbx, 'CURRENT_PROJECT_VERSION')) || null,
      iosMinim: valorPbxproj(pbx, 'IPHONEOS_DEPLOYMENT_TARGET'),
      apsEnvironment: push.ios.apsEnvironment,
      dominisAssociats: /<key>com\.apple\.developer\.associated-domains<\/key>/.test(drets),
      appleAppSiteAssociation: existix(arrel, 'public', '.well-known', 'apple-app-site-association') || existix(arrel, 'public', 'apple-app-site-association'),
      signInWithApple: /<key>com\.apple\.developer\.applesignin<\/key>/.test(drets),
      permisos,
      xifratgeExempt: /<key>ITSAppUsesNonExemptEncryption<\/key>\s*<false\s*\/>/.test(senseComentarisXml(plist)),
      rastreig: /<key>NSPrivacyTracking<\/key>\s*<true\s*\/>/.test(privacitat) ? true
        : (/<key>NSPrivacyTracking<\/key>\s*<false\s*\/>/.test(privacitat) ? false : null)
    },
    push: {
      connectorRemot: push.connector.paquet || push.connector.ios || push.connector.android,
      reenviaRegistreApns: push.ios.reenviaRegistre,
      googleServices: push.android.googleServices.hiEs,
      clauVapid: teClauVapid(arrel, env)
    },
    baixa: {
      ancoraPublica: /data-sdp-ancora="esborra-compte"/.test(legal),
      dinsDeLApp: /\bdemanaBaixa\b/.test(privacitatApp)
    }
  };
}

/** Les línies del resum (✓ fet, · dada, ! pendent). Pura. */
export function liniesDeLEstat(e) {
  const linies = [];
  const be = (t) => linies.push(`  ✓ ${t}`);
  const dada = (t) => linies.push(`  · ${t}`);
  const pendent = (t) => linies.push(`  ! ${t}`);
  const o = (v) => (v === null || v === undefined ? 'no es pot llegir' : String(v));
  linies.push('Estat de les botigues (fora de línia: només fitxers del projecte; ni xarxa ni pujades)');
  dada(`web (package.json): ${o(e.versioWeb)}`);
  linies.push('Android (Google Play)');
  dada(`paquet ${o(e.android.paquet)} · versió ${o(e.android.versio)} (versionCode ${o(e.android.build)})`);
  dada(`minSdk ${o(e.android.minSdk)} · compileSdk ${o(e.android.compileSdk)} · targetSdk efectiu ${o(e.android.targetSdk)}`);
  if (e.android.targetSdk !== null && e.android.targetSdk >= e.android.targetSdkPlayMinim) be(`targetSdk ${e.android.targetSdk} ≥ ${e.android.targetSdkPlayMinim} (el mínim contrastat a l'auditoria O4)`);
  else pendent(`targetSdk per davall de ${e.android.targetSdkPlayMinim} o il·legible`);
  if (e.android.postNotifications) be('POST_NOTIFICATIONS declarat (avisos locals del xat; Android 13+ el demana)');
  else pendent('POST_NOTIFICATIONS no declarat');
  if (e.android.assetlinks > 0) be(`assetlinks.json: ${e.android.assetlinks} empremta/es (les copia el Mestre de Play Console)`);
  else pendent('assetlinks.json no es publica: cap empremta a scripts/botigues/associacio-apps.json (les ha de copiar el Mestre de Play Console)');
  linies.push('iOS (App Store / TestFlight)');
  dada(`paquet ${o(e.ios.paquet)}${e.ios.extensions.length ? ` (extensions: ${e.ios.extensions.join(', ')})` : ''} · versió ${o(e.ios.versio)} (build ${o(e.ios.build)}) · iOS mínim ${o(e.ios.iosMinim)}`);
  if (e.ios.rastreig === false) be('PrivacyInfo.xcprivacy: NSPrivacyTracking = false');
  else pendent('PrivacyInfo.xcprivacy no diu NSPrivacyTracking = false');
  if (e.ios.xifratgeExempt) be('Info.plist: ITSAppUsesNonExemptEncryption = false');
  else pendent('Info.plist no diu ITSAppUsesNonExemptEncryption = false');
  dada(`textos de permisos a Info.plist: ${e.ios.permisos.length ? e.ios.permisos.join(', ') : 'cap'}`);
  if (e.ios.signInWithApple) be('Sign in with Apple (com.apple.developer.applesignin)');
  if (e.ios.dominisAssociats || e.ios.appleAppSiteAssociation) dada(`dominis associats: ${e.ios.dominisAssociats ? 'sí' : 'no'} · apple-app-site-association: ${e.ios.appleAppSiteAssociation ? 'sí' : 'no'}`);
  else pendent('cap domini associat ni apple-app-site-association (Universal Links): els enllaços s\'obrin al navegador');
  linies.push('Avisos push del xat');
  if (e.push.connectorRemot) be('connector d\'avisos remots al projecte');
  else pendent('l\'app nativa no porta el connector @capacitor/push-notifications: a l\'iPhone i a Android no hi ha avisos push (instal·lar-lo és decisió del Mestre)');
  if (e.ios.apsEnvironment) be(`aps-environment = ${e.ios.apsEnvironment}`);
  else pendent('App.entitlements sense aps-environment (APNs)');
  if (e.push.reenviaRegistreApns) be('AppDelegate reenvia el testimoni d\'APNs');
  else pendent('AppDelegate no reenvia el testimoni d\'APNs a Capacitor');
  if (e.push.googleServices) be('google-services.json present (FCM)');
  else pendent('sense google-services.json (FCM d\'Android)');
  if (e.push.clauVapid.te) be(`VITE_PUSH_VAPID_PUBLICA amb valor a ${e.push.clauVapid.on} (el valor no s'imprimix)`);
  else pendent(`cap clau pública VAPID (VITE_PUSH_VAPID_PUBLICA) a l'entorn ni a ${ENTORNS_DEL_BUILD.join(', ')}: el build web eixirà sense clau i els avisos web no s'oferiran (sense-clau)`);
  linies.push('Eliminació del compte (App Store 5.1.1(v) i Google Play)');
  if (e.baixa.dinsDeLApp) be('es pot demanar dins de l\'app (DetallPrivacitat → demanaBaixa)');
  else pendent('no es troba la baixa dins de l\'app');
  if (e.baixa.ancoraPublica) be('adreça pública: https://socdepoble.org/legal#esborra-compte');
  else pendent('falta l\'àncora pública #esborra-compte a /legal');
  linies.push('No es comprova d\'ací: l\'estat a App Store Connect i a Play Console, les signatures, les credencials ni cap pujada.');
  return linies;
}

const principal = (() => {
  try { return process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href; } catch { return false; }
})();
if (principal) {
  const arrel = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  process.stdout.write(`${liniesDeLEstat(estatDeLesBotigues(arrel)).join('\n')}\n`);
}
