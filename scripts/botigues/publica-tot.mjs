#!/usr/bin/env node
/**
 * scripts/botigues/publica-tot.mjs — Orquestrador Omnicanal Mode Jarvis (IDEA-60 · T1/T8).
 *
 * Unifica el protocol de línies JSON del corredor Jarvis per a la Consola (/consola/empaquetats,
 * POST /__iaia/botigues/publica-tot), la verificació en sec, la compilació signada (AAB + APK
 * directe + IPA + WordPress 1.1.11) i el llançament confirmat de les quatre plataformes
 * reutilitzant entorn.mjs, preflight.mjs, puja-android.mjs, puja-ios.mjs i higiene-paquets.mjs.
 *
 * Protocol de línies del corredor Jarvis (--notes <notes> [--canals web,wordpress,android,ios] [--sec]):
 *   · Emet a stdout una línia JSON per transició de pas:
 *       {"pas":"web","estat":"en_curs"}
 *       {"pas":"web","estat":"fet"|"error","text":"..."}
 *   · Cap secret ni camí absolut ix a `text`. Els registres humans van a stderr.
 *
 * Onada R32.3 (P0, ordre del Mestre 261116 22:09: actualitzacions automàtiques en tot el sistema):
 *   --publica-apk --versio X.Y.Z --build N
 *       copia l'APK directe signat (../_builds_de_poble/android/AAMMDD_socdepoble_X.Y.Z+N.apk, ÚNIC per
 *       a la versió i el build, amb el seu .sha256 i la signatura de SDP_ANDROID_UPLOAD_CERT_SHA256
 *       verificada ara amb apksigner) a dist/descarregues/socdepoble-android-latest.apk, l'adreça de
 *       canalsDeBotiga.js. Va DESPRÉS de npm run build (que buida dist/) i ABANS de firebase deploy.
 *       Mai a public/: Vite el copiaria dins de dist-natiu/ (l'app nativa) i del connector WordPress.
 *   --sincronitza-ard --versio X.Y.Z [--build N] [--build-ios M] [--corregeix-ard]
 *       escriu version i androidBuild (--build) i/o iosBuild (--build-ios) a public/.well-known/ard.json,
 *       el manifest que consulta src/natiu/actualitzacioAppNativa.js, amb sincronitzaManifestVersio.
 *       Va ABANS de npm run build (el build el copia a dist/), i mai en la mateixa ordre que
 *       --publica-apk. Abans d'escriure: la versió és la de package.json, cap build passa de
 *       VERSIO_CLIENT_NATIU, i el build ja es DONA al canal que obri el botó de l'App: Google Play el
 *       té «completed» en alguna pista (l'API, només lectura) i el d'iOS és al registre de pujades de
 *       producció (l'App Store). Si no, l'App avisaria d'una versió que la botiga encara no dona, a
 *       cada obertura. Mai baixa, llevat de --corregeix-ard (l'única manera de desfer una errada).
 *   La pujada d'Android és la de puja-android.mjs (API REST de Google Play, sense fastlane), i
 *   --desplega hi passa tal qual (només a la prova interna). El corredor Jarvis (--notes) no puja mai
 *   res a Google Play: no fabrica el «sí» del Mestre (Elefant R32.3).
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  BUILD, CANALS, EIXIDA, VERSIO, analitzaArguments, carregaEntorn, comparaVersions, emmascara,
  empremtaDeKeytool, esDins, executa, jdkPerAGradle, llegixRegistre, normalitzaEmpremta, plega, rutaDe, sha256DeFitxer
} from './entorn.mjs';
import { arrelComprovada, llegixClauPlay, preflight } from './preflight.mjs';
import { ESTATS_PLAY, consultaLlancament, netejaText, main as pujaAndroid } from './puja-android.mjs';
import { main as pujaIos } from './puja-ios.mjs';
import { VERSIO_CLIENT_NATIU } from './versio-client.mjs';
import { CANALS_JARVIS, recullEmpaquetats } from '../../tooling/vite/consola-iaia.mjs';
import { inspeccionaHigienePaquets } from '../../tooling/gates/tractor-higiene-paquets.mjs';

export const ESQUEMA_PUBLICA_TOT = 'sdp.botigues.publica-tot.v1';

const ADMESOS = Object.freeze({
  notes: true,
  canals: true,
  sec: false,
  versio: true,
  build: true,
  canal: true,
  plataforma: true,
  compila: false,
  confirma: true,
  push: false,
  desplega: false,
  json: false,
  'publica-apk': false,
  'sincronitza-ard': false,
  'build-ios': true,
  'corregeix-ard': false,
  ajuda: false
});

const PLATAFORMES_VALIDES = Object.freeze(['totes', 'web', 'wordpress', 'android', 'ios']);
const US = 'Ús: --notes "<notes>" [--canals web,wordpress,android,ios] [--sec] | --versio X.Y.Z --build N [--plataforma totes|web|wordpress|android|ios] [--canal intern|produccio] [--push] [--json] | --versio X.Y.Z --build N --plataforma android|ios [--canal intern|produccio] [--push] [--desplega] [--compila] [--confirma=X.Y.Z+N|produccio:X.Y.Z+N@<sha12>] | --versio X.Y.Z --build N --publica-apk | --versio X.Y.Z [--build N] [--build-ios M] --sincronitza-ard';

/* Onada R24 · Consola Zero (P-A) · Firebase Hosting publica versions atòmiques
   des de dist/: sense retenció, una pestanya oberta abans del desplegament
   demana trossos que ja no hi són (404 de modulepreload). L'ordre web passa a
   ser build → arxiva → incorpora → deploy (tooling/scripts/retencio-assets.mjs),
   amb l'arxiu sempre explícit. La ubicació és una proposta pendent del Mestre
   (D-consola-1): fora del repositori i de dist/, dins del satèl·lit de builds. */
export const ARXIU_RETENCIO_PROPOSAT = '../_builds_de_poble/web_assets_retencio';
export const ORDRE_WEB = `npm run build && npm run deploy:arxiva -- --arxiu ${ARXIU_RETENCIO_PROPOSAT} && npm run deploy:retencio -- --arxiu ${ARXIU_RETENCIO_PROPOSAT} && firebase deploy --only hosting`;

export const APK_RELEASE = Object.freeze(['android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk']);
export const NOM_APK_PUBLIC = 'socdepoble-android-latest.apk';

const CAMI_ABSOLUT = /\/(?:Users|home|private|var|tmp|etc|opt|Volumes)\/[^\s"')]*/g;
const sanejaTextPas = (txt) => String(txt ?? '').replace(CAMI_ABSOLUT, '<camí>').trim().slice(0, 300);

/**
 * Construeix el resum omnicanal en sec (sense secrets) per a la CLI i per a proves.
 */
export function resumOmnicanal(arrel, { versio, build, canal = CANALS.INTERN, plataforma = 'totes', push = false, env = process.env, consultes = {} } = {}) {
  const empaquetats = recullEmpaquetats(arrel);
  const v = versio ?? empaquetats.canonica ?? '1.0.0';
  const b = build ?? empaquetats.plataformes?.android?.builds?.[0] ?? '2';
  const plataformes = plataforma === 'totes' ? ['web', 'wordpress', 'android', 'ios'] : [plataforma];
  const natives = plataformes.filter((p) => p === 'android' || p === 'ios');

  const pre = natives.length
    ? preflight({ arrel, plataformes: natives, signa: false, env, consultes, canal, push })
    : { codi: EIXIDA.BE, linies: [], valors: {}, play: null, jdk: null, segell: null };

  const higiene = inspeccionaHigienePaquets(arrel);
  const valors = pre.valors ?? {};

  const passos = [];
  if (plataformes.includes('web')) {
    passos.push({
      plataforma: 'web',
      accio: 'Compilar i desplegar PWA + Open Data + ActivityPub a socdepoble.org',
      ordre: ORDRE_WEB
    });
  }
  if (plataformes.includes('wordpress')) {
    const vWp = empaquetats.plataformes?.wordpress?.versions?.[0] ?? '1.1.11';
    passos.push({
      plataforma: 'wordpress',
      accio: `Empaquetar connector WordPress v${vWp} (sense banners de vitrina dins del ZIP · IDEA-62)`,
      ordre: `SDP_RELEASE=1 SDP_VERSIO=${vWp} npm run build:wp && SDP_RELEASE=1 SDP_VERSIO=${vWp} npm run build:wp:directori && node wordpress-plugin/eines/empaqueta.mjs --directori`
    });
  }
  if (plataformes.includes('android')) {
    passos.push({
      plataforma: 'android',
      accio: `Compilar i signar AAB (${v}+${b}) per a Google Play (${canal}) + APK directe universal (${NOM_APK_PUBLIC})`,
      ordre: `node scripts/botigues/publica-tot.mjs --versio ${v} --build ${b} --plataforma android --canal ${canal} --compila`
    });
    /* R32.3 · La pujada per l'API REST de Google Play (sense fastlane) i l'APK públic. */
    passos.push({
      plataforma: 'android',
      accio: `Pujar l'AAB a Google Play per l'API REST v3 (pista ${canal === CANALS.PRODUCCIO ? 'production' : 'internal'}, esborrany; a la prova interna, --desplega el deixa desplegat) amb el «sí» del Mestre`,
      ordre: `node scripts/botigues/puja-android.mjs --versio ${v} --build ${b} --canal ${canal} --confirma=<«sí» del Mestre>`
    });
    passos.push({
      plataforma: 'android',
      accio: `Publicar l'APK directe a /descarregues/${NOM_APK_PUBLIC}: entre «npm run build» i «firebase deploy» del pas web (el build buida dist/)`,
      ordre: `${ORDRE_PUBLICA_APK} --versio ${v} --build ${b}`
    });
  }
  if (plataformes.includes('ios')) {
    passos.push({
      plataforma: 'ios',
      accio: `Arxivar, exportar i verificar IPA (${v}+${b}) per a App Store Connect / TestFlight (${canal})`,
      ordre: `node scripts/botigues/puja-ios.mjs --versio ${v} --build ${b} --canal ${canal} --compila`
    });
  }

  const carpetaAndroid = path.resolve(arrel, '..', '_builds_de_poble', 'android');
  const apks = (empaquetats.plataformes?.android?.artefactes ?? []).filter((nom) => nom.endsWith('.apk'));
  const ultimApk = apks.at(-1) ?? null;
  let apkSha256 = null;
  if (ultimApk) {
    const camiSha = path.join(carpetaAndroid, `${ultimApk}.sha256`);
    if (fs.existsSync(camiSha)) {
      apkSha256 = fs.readFileSync(camiSha, 'utf8').trim().split(/\s+/)[0] || null;
    }
  }

  return {
    schema: ESQUEMA_PUBLICA_TOT,
    generat: new Date().toISOString(),
    enSec: true,
    versio: v,
    build: b,
    canal,
    plataforma,
    preflight: {
      codi: pre.codi,
      ok: pre.codi === EIXIDA.BE,
      linies: pre.linies.map((l) => emmascara(l, valors, arrel))
    },
    higiene: {
      valid: higiene.valid,
      fitxers: higiene.fitxers,
      examinades: higiene.examinades,
      incidencies: higiene.incidencies
    },
    apkDirecte: {
      nomPublic: NOM_APK_PUBLIC,
      artefacte: ultimApk,
      sha256: apkSha256
    },
    empaquetats,
    passos
  };
}

/**
 * Compila i signa l'APK directe universal d'Android i el deixa a ../_builds_de_poble/android/ amb el seu .sha256.
 */
export async function compilaApkDirecte({ arrel, valors, jdkHome, versio, build, data = new Date() }) {
  const gradlew = path.join(arrel, 'android', 'gradlew');
  const entornExtra = {
    JAVA_HOME: jdkHome,
    SDP_ANDROID_KEYSTORE_PATH: rutaDe(arrel, valors, 'SDP_ANDROID_KEYSTORE_PATH'),
    SDP_ANDROID_KEY_ALIAS: valors.SDP_ANDROID_KEY_ALIAS,
    SDP_ANDROID_KEYSTORE_PASSWORD: valors.SDP_ANDROID_KEYSTORE_PASSWORD,
    SDP_ANDROID_KEY_PASSWORD: valors.SDP_ANDROID_KEY_PASSWORD
  };
  const res = await executa(gradlew, ['--no-daemon', 'assembleRelease'], {
    cwd: path.join(arrel, 'android'),
    valors,
    arrel,
    entornExtra
  });
  if (res.codi !== 0) return { codi: EIXIDA.EXTERNA, error: 'gradlew assembleRelease ha fallat' };

  const apk = path.join(arrel, ...APK_RELEASE);
  if (!fs.existsSync(apk)) return { codi: EIXIDA.ARBRE, error: 'no s’ha generat app-release.apk' };

  /* Elefant R32.3 · La mateixa verificació que --publica-apk (empremtaDeLApk), sense ser estricta: si
     apksigner no dona l'empremta, keytool, com sempre. */
  const empremta = await empremtaDeLApk({ apk, valors, arrel, jdkHome, estricte: false });
  if (!empremta) {
    return { codi: EIXIDA.EXTERNA, error: 'apksigner/keytool no ha pogut verificar la signatura de l’APK' };
  }
  if (empremta !== normalitzaEmpremta(valors.SDP_ANDROID_UPLOAD_CERT_SHA256)) {
    return { codi: EIXIDA.VERIFICACIO, error: 'l’APK està signat amb una clau diferent de SDP_ANDROID_UPLOAD_CERT_SHA256' };
  }

  const aammdd = data.toISOString().slice(2, 10).replaceAll('-', '');
  const carpetaDesti = path.resolve(arrel, '..', '_builds_de_poble', 'android');
  fs.mkdirSync(carpetaDesti, { recursive: true });
  const nomFitxer = `${aammdd}_socdepoble_${versio}+${build}.apk`;
  const desti = path.join(carpetaDesti, nomFitxer);
  fs.copyFileSync(apk, desti);
  const sha256 = sha256DeFitxer(desti);
  fs.writeFileSync(`${desti}.sha256`, `${sha256}  ${NOM_APK_PUBLIC}\n`, 'utf8');

  return { codi: EIXIDA.BE, desti, nomFitxer, sha256 };
}

/* ───────── R32.3 · L'APK directe a /descarregues i la versió publicada a ard.json ───────── */

/* Firebase Hosting servix dist/ (firebase.json) i /descarregues/socdepoble-android-latest.apk és
   l'adreça única de canalsDeBotiga.js (FITXER_APK). L'APK NO va a public/: Vite el copiaria dins de
   dist-natiu/ (107 MB dins de l'app) i del connector WordPress. `npm run build` buida dist/, per
   això es copia DESPRÉS del build i ABANS de firebase deploy. Els noms que comencen per «.» no es
   despleguen (hosting.ignore de firebase.json exclou els fitxers ocults): la còpia temporal no pot eixir mai a la web.
   Elefant R32.3 (Peix security_reviewer, P2) · Un .sha256 al costat només diu que l'APK casa amb ell
   mateix: en publicar, la signatura es torna a VERIFICAR (apksigner) contra
   SDP_ANDROID_UPLOAD_CERT_SHA256, i dos APK de la mateixa versió i build són ambigus (cap «el més nou»).
   L'APK directe va signat amb la clau de PUJADA; Google Play reparteix amb la d'App Signing: si són
   diferents, un mòbil amb este APK no s'actualitza des de Play sense desinstal·lar (D-R32.3-PLAY-3). */
export const DESCARREGUES_DIST = Object.freeze(['dist', 'descarregues']);
export const ORDRE_PUBLICA_APK = 'node scripts/botigues/publica-tot.mjs --publica-apk';
const APK_DE_BUILD = /^(\d{6})_socdepoble_(\d+\.\d+\.\d+)\+([1-9]\d{0,8})\.apk$/;
/** Els build-tools de l'SDK d'Android (on viu apksigner). */
export const BUILD_TOOLS_ANDROID = path.join(os.homedir(), 'Library', 'Android', 'sdk', 'build-tools');

/** La carpeta dels binaris d'Android, germana del repositori (la de compilaApkDirecte). */
export const carpetaBuildsAndroid = (arrel) => path.resolve(arrel, '..', '_builds_de_poble', 'android');

/** Els APK signats d'una versió i un build (AAMMDD_socdepoble_X.Y.Z+N.apk), en ordre de nom: [] si no n'hi ha. */
export function apksDeLaVersio(carpeta, versio, build) {
  let noms;
  try { noms = fs.readdirSync(carpeta); } catch { return []; }
  return noms.filter((nom) => {
    const trobat = APK_DE_BUILD.exec(nom);
    return trobat && trobat[2] === String(versio) && trobat[3] === String(build);
  }).sort().map((nom) => path.join(carpeta, nom));
}

/** L'apksigner del build-tools més alt (ordre numèric), o null si no n'hi ha cap. */
function apksignerDe(buildTools) {
  let versions;
  try { versions = fs.readdirSync(buildTools).sort((a, b) => a.localeCompare(b, 'en', { numeric: true })); } catch { return null; }
  for (const versio of versions.reverse()) {
    const cami = path.join(buildTools, versio, 'apksigner');
    if (fs.existsSync(cami)) return cami;
  }
  return null;
}

/**
 * L'empremta SHA-256 (normalitzada) del certificat que signa l'APK, VERIFICADA: «apksigner verify
 * --print-certs» (només ix amb 0 si les signatures v1-v4 són bones; totes les empremtes que diu han de
 * ser la mateixa). Sense apksigner, «keytool -printcert -jarfile» (només v1). Amb `estricte`, un
 * apksigner que diu que no (o que no dona cap empremta) és un no: keytool només hi és si falta
 * apksigner. Sense, com sempre a compilaApkDirecte: si apksigner no dona l'empremta, keytool.
 * Torna null si no es pot verificar. Només llig; l'eixida de les eines no es pinta.
 */
export async function empremtaDeLApk({ apk, valors = {}, arrel = null, jdkHome = null, buildTools = BUILD_TOOLS_ANDROID, estricte = true }) {
  const apksigner = apksignerDe(buildTools);
  if (apksigner) {
    const cert = await executa(apksigner, ['verify', '--print-certs', apk], {
      valors, arrel, mostra: false, eco: false, entornExtra: jdkHome ? { JAVA_HOME: jdkHome } : {}
    });
    const empremtes = [...String(cert.crua ?? '').matchAll(/SHA-256 digest:\s*([0-9a-fA-F:]{64,})/g)].map((m) => normalitzaEmpremta(m[1]));
    if (cert.codi === 0 && empremtes.length && empremtes.every((e) => e && e === empremtes[0])) return empremtes[0];
    if (estricte) return null;
  }
  const cert = await executa('keytool', ['-printcert', '-jarfile', apk], { valors, arrel, mostra: false, eco: false });
  return cert.codi === 0 ? empremtaDeKeytool(cert.crua) : null;
}

/* Escriu `dades` a `cami` passant per una còpia oculta del mateix directori i un rename: qui llig
   (o desplega) mai veu un fitxer a mitges, i un enllaç simbòlic al destí no es seguix. */
function escriuAtomic(cami, escriu) {
  const temporal = path.join(path.dirname(cami), `.${path.basename(cami)}.${process.pid}.tmp`);
  try {
    escriu(temporal);
    fs.renameSync(temporal, cami);
  } finally {
    fs.rmSync(temporal, { force: true });
  }
}

/**
 * Publica a dist/descarregues/socdepoble-android-latest.apk (i el seu .sha256) l'APK signat d'esta
 * versió. Només un APK ÚNIC per a la versió i el build, amb un .sha256 que casa i la signatura de
 * la clau de pujada (SDP_ANDROID_UPLOAD_CERT_SHA256 de `valors`), verificada ara amb apksigner
 * (`empremta`, que les proves poden canviar). La còpia ha de tindre el mateix sha256.
 * @returns {Promise<{ codi:number, error?:string, desti?:string, origen?:string, sha256?:string, octets?:number }>}
 */
export async function publicaApkDirecte({
  arrel, versio, build, valors = {}, jdkHome = null, carpeta = carpetaBuildsAndroid(arrel),
  empremta = (apk) => empremtaDeLApk({ apk, valors, arrel, jdkHome })
}) {
  const no = (codi, error) => ({ codi, error });
  if (!VERSIO.test(String(versio ?? '')) || !BUILD.test(String(build ?? ''))) return no(EIXIDA.US, '--publica-apk necessita --versio X.Y.Z i --build N');
  const esperada = normalitzaEmpremta(valors.SDP_ANDROID_UPLOAD_CERT_SHA256);
  if (!esperada) return no(EIXIDA.FALTA, 'falta SDP_ANDROID_UPLOAD_CERT_SHA256 al fitxer d’entorn: sense la clau de pujada no es pot verificar l’APK');
  const dist = path.join(arrel, 'dist');
  if (!fs.existsSync(path.join(dist, 'index.html'))) {
    return no(EIXIDA.ARBRE, 'no hi ha dist/index.html: primer npm run build (el build buida dist/ i s’emportaria l’APK); després, abans de firebase deploy');
  }
  const candidats = apksDeLaVersio(carpeta, versio, build);
  if (!candidats.length) return no(EIXIDA.ARBRE, `no hi ha cap APK ${versio}+${build} a _builds_de_poble/android/: el fa publica-tot.mjs --plataforma android --compila`);
  if (candidats.length > 1) {
    return no(EIXIDA.ARBRE, `hi ha ${candidats.length} APK ${versio}+${build} a _builds_de_poble/android/ (${candidats.map((c) => path.basename(c)).join(', ')}): no se sap quin és el bo; trau-ne els que no ho són (a la paperera, no s’esborren) i torna-hi`);
  }
  const [apk] = candidats;
  let estat;
  try { estat = fs.lstatSync(apk); } catch { return no(EIXIDA.ARBRE, `no es pot llegir ${path.basename(apk)}`); }
  if (!estat.isFile()) return no(EIXIDA.ARBRE, `${path.basename(apk)} no és un fitxer regular`);
  let declarat = '';
  try { declarat = fs.readFileSync(`${apk}.sha256`, 'utf8').trim().split(/\s+/)[0].toLowerCase(); } catch { /* no hi és */ }
  if (!/^[0-9a-f]{64}$/.test(declarat)) {
    return no(EIXIDA.VERIFICACIO, `${path.basename(apk)} no té un .sha256 vàlid al costat: només es publica un APK que compilaApkDirecte ha verificat`);
  }
  const sha256 = sha256DeFitxer(apk);
  if (sha256 !== declarat) return no(EIXIDA.VERIFICACIO, `${path.basename(apk)} no és l’APK verificat: el sha256 no casa amb el del seu .sha256`);
  let signatura = null;
  try { signatura = await empremta(apk); } catch { signatura = null; }
  if (!signatura) return no(EIXIDA.VERIFICACIO, `apksigner no ha pogut verificar la signatura de ${path.basename(apk)}: no es publica`);
  if (signatura !== esperada) return no(EIXIDA.VERIFICACIO, `${path.basename(apk)} està signat amb una clau diferent de SDP_ANDROID_UPLOAD_CERT_SHA256: no es publica`);
  if (sha256DeFitxer(apk) !== sha256) return no(EIXIDA.VERIFICACIO, `${path.basename(apk)} ha canviat mentre es verificava: no es publica`);
  const desti = path.join(arrel, ...DESCARREGUES_DIST);
  fs.mkdirSync(desti, { recursive: true });
  if (fs.lstatSync(desti).isSymbolicLink() || !esDins(fs.realpathSync(dist), fs.realpathSync(desti))) {
    return no(EIXIDA.ARBRE, 'dist/descarregues ha de ser una carpeta de dist/, no un enllaç');
  }
  const final = path.join(desti, NOM_APK_PUBLIC);
  try {
    escriuAtomic(final, (temporal) => {
      fs.copyFileSync(apk, temporal);
      if (sha256DeFitxer(temporal) !== sha256) throw new Error('la còpia de l’APK no té el sha256 de l’original');
    });
    escriuAtomic(`${final}.sha256`, (temporal) => fs.writeFileSync(temporal, `${sha256}  ${NOM_APK_PUBLIC}\n`, 'utf8'));
  } catch (error) {
    return no(EIXIDA.VERIFICACIO, `no s’ha pogut publicar l’APK a dist/descarregues: ${String(error?.message ?? error).replace(/\/(?:Users|home|private|var|tmp)\/\S*/g, '<camí>')}`);
  }
  return { codi: EIXIDA.BE, desti: final, origen: path.basename(apk), sha256, octets: estat.size };
}

/* El manifest públic de versió: public/.well-known/ard.json (es copia a dist/ en el build). Les
   claus de nivell superior són les que llig el detector natiu (src/natiu/actualitzacioAppNativa.js,
   llegixManifestVersio): version (X.Y.Z, la del sistema: la de package.json; només veta un servidor
   més vell), androidBuild i iosBuild (enters: el versionCode i el CFBundleVersion del darrer build JA
   DISPONIBLE al canal que obri el botó, Google Play o l'App Store; mai el compilat). El «version»
   de cada entrada és la mateixa versió publicada (R31, T3). Cada build és opcional: el que no es
   passa es conserva tal qual.
   Elefant R32.3 (Peixos security_reviewer i silent_failure_hunter, P2) · Un build que l'App anuncia
   sense que la botiga el done fa que totes les Apps mostren la barra a cada obertura: cap build pot
   passar de VERSIO_CLIENT_NATIU (cap App ni botiga el pot tindre), la versió ha de ser la de
   package.json, i la disponibilitat es pregunta a la font (comprovaDisponibilitat: Google Play per
   l'API, el registre de pujades de producció per a l'App Store) ABANS d'escriure. Mai baixa, llevat
   de --corregeix-ard, l'única manera explícita de desfer una errada. */
export const MANIFEST_VERSIO = Object.freeze(['public', '.well-known', 'ard.json']);

/**
 * Pur: el text d'ard.json amb version, i androidBuild i/o iosBuild, posats (i el version de cada
 * entrada). Conserva l'ordre de les claus; les que no hi eren van primer. Llança si el text no és el
 * manifest, si no es passa cap build, si un build passa de `maximBuild` (VERSIO_CLIENT_NATIU) o si
 * baixaria sense `corregeix`.
 */
export function sincronitzaManifestVersio(text, { versio, androidBuild = null, iosBuild = null, maximBuild = Number(VERSIO_CLIENT_NATIU), corregeix = false } = {}) {
  if (!VERSIO.test(String(versio ?? ''))) throw new Error('la versió ha de ser X.Y.Z');
  const builds = Object.entries({ androidBuild, iosBuild }).filter(([, valor]) => valor !== null && valor !== undefined);
  if (!builds.length) throw new Error('cal androidBuild o iosBuild: el build que ja dona la botiga');
  for (const [nom, valor] of builds) {
    if (!BUILD.test(String(valor))) throw new Error(`${nom} ha de ser un enter positiu`);
    if (Number.isSafeInteger(maximBuild) && Number(valor) > maximBuild) {
      throw new Error(`${nom} ${valor} passa de VERSIO_CLIENT_NATIU (${maximBuild}, src/data/contracte.js): cap App ni cap botiga el pot tindre encara`);
    }
  }
  let dades;
  try { dades = JSON.parse(String(text ?? '')); } catch { throw new Error('ard.json no és JSON'); }
  if (!dades || typeof dades !== 'object' || Array.isArray(dades) || !Array.isArray(dades.entries)) throw new Error('ard.json no té «entries»');
  const nou = { version: String(versio), ...Object.fromEntries(builds.map(([nom, valor]) => [nom, Number(valor)])) };
  if (!corregeix && VERSIO.test(String(dades.version ?? '')) && comparaVersions(nou.version, dades.version) < 0) {
    throw new Error(`ard.json ja publica la versió ${dades.version}: no es baixa a ${nou.version} (si és una errada, --corregeix-ard)`);
  }
  for (const [nom] of builds) {
    if (!corregeix && Number.isSafeInteger(dades[nom]) && nou[nom] < dades[nom]) {
      throw new Error(`ard.json ja publica ${nom} ${dades[nom]}: no es baixa a ${nou[nom]} (si és una errada, --corregeix-ard)`);
    }
  }
  const resultat = Object.keys(nou).every((clau) => Object.hasOwn(dades, clau)) ? dades : { ...nou, ...dades };
  Object.assign(resultat, nou);
  for (const entrada of resultat.entries) {
    if (entrada && typeof entrada === 'object' && typeof entrada.version === 'string') entrada.version = nou.version;
  }
  return `${JSON.stringify(resultat, null, 2)}\n`;
}

/** La versió de package.json de l'arrel, o null. */
export function versioDelPaquet(arrel) {
  try {
    const versio = JSON.parse(fs.readFileSync(path.join(arrel, 'package.json'), 'utf8')).version;
    return VERSIO.test(String(versio ?? '')) ? String(versio) : null;
  } catch { return null; }
}

/**
 * Escriu la versió a public/.well-known/ard.json (o a `cami`). La versió ha de ser la de package.json
 * (`versioPaquet`). No pregunta a cap botiga: abans, comprovaDisponibilitat (la CLI ho fa sempre).
 * Amb `sec`, només les guardes: no escriu res.
 * @returns {{ codi:number, canviat?:boolean, error?:string }}
 */
export function escriuManifestVersio({
  arrel, versio, androidBuild = null, iosBuild = null, corregeix = false, cami = path.join(arrel, ...MANIFEST_VERSIO),
  versioPaquet = versioDelPaquet(arrel), maximBuild = Number(VERSIO_CLIENT_NATIU), sec = false
}) {
  if (String(versio) !== String(versioPaquet)) {
    return { codi: EIXIDA.ARBRE, error: `--versio ${versio} no és la de package.json (${versioPaquet ?? 'il·legible'}): el manifest anuncia la versió del sistema` };
  }
  let abans;
  try { abans = fs.readFileSync(cami, 'utf8'); } catch { return { codi: EIXIDA.ARBRE, error: `no es pot llegir ${MANIFEST_VERSIO.join('/')}` }; }
  let despres;
  try { despres = sincronitzaManifestVersio(abans, { versio, androidBuild, iosBuild, maximBuild, corregeix }); } catch (error) { return { codi: EIXIDA.ARBRE, error: error.message }; }
  if (despres === abans) return { codi: EIXIDA.BE, canviat: false };
  if (sec) return { codi: EIXIDA.BE, canviat: true };
  escriuAtomic(cami, (temporal) => fs.writeFileSync(temporal, despres, 'utf8'));
  return { codi: EIXIDA.BE, canviat: true };
}

/**
 * Elefant R32.3 · Si els builds que anunciarà ard.json ja els dona el canal que obri el botó de l'App:
 *  · Android (Google Play): l'API REST (consultaLlancament, només lectura) ha de tindre el versionCode
 *    en un llançament «completed» d'alguna pista (internal o production): un esborrany, un desplegament
 *    per fases o un llançament aturat no es dona a tothom;
 *  · iOS (l'App Store): el registre de pujades (SDP_BUILDS_DIR/pujades.jsonl) ha de tindre el build al
 *    canal de producció (TestFlight no és l'App Store). Que Apple ja l'haja publicat ho mira el Mestre.
 * `consulta` és consultaLlancament (les proves hi passen les adreces locals). Mai llança.
 * @returns {Promise<{ codi:number, problemes:string[], avisos:string[] }>}
 */
export async function comprovaDisponibilitat({ arrel, valors = {}, androidBuild = null, iosBuild = null, consulta = consultaLlancament, opcionsPlay = {} }) {
  const problemes = [];
  const avisos = [];
  let codi = EIXIDA.BE;
  const mal = (c, text) => { if (codi === EIXIDA.BE) codi = c; problemes.push(text); };
  if (androidBuild !== null && androidBuild !== undefined) {
    const clau = String(valors.SDP_PLAY_JSON_KEY_PATH ?? '').trim() ? llegixClauPlay(rutaDe(arrel, valors, 'SDP_PLAY_JSON_KEY_PATH')) : { valida: false, problema: 'falta' };
    const paquet = String(valors.SDP_APP_ID ?? '').trim();
    if (!clau.valida) mal(EIXIDA.FALTA, `SDP_PLAY_JSON_KEY_PATH: ${clau.problema}: sense la clau no es pot preguntar a Google Play si el build ${androidBuild} ja es dona (guia de 3 passos de puja-android.mjs)`);
    else if (!paquet) mal(EIXIDA.FALTA, 'falta SDP_APP_ID');
    else {
      try {
        const trobats = await consulta({ ...opcionsPlay, clau: clau.clau, paquet, build: String(androidBuild) });
        const desplegat = trobats.find((t) => t.status === ESTATS_PLAY.DESPLEGAT);
        if (desplegat) avisos.push(`Google Play dona el versionCode ${androidBuild} a la pista ${desplegat.pista} (completed)`);
        else if (trobats.length) mal(EIXIDA.ARBRE, `Google Play té el versionCode ${androidBuild} però no el dona a tothom (${trobats.map((t) => `${t.pista}: ${t.status}`).join(', ')}): desplega'l a Play Console (o puja amb --desplega a la prova interna) i torna-hi`);
        else mal(EIXIDA.ARBRE, `Google Play no té el versionCode ${androidBuild} a cap pista (internal, production): primer puja-android.mjs --confirma`);
      } catch (error) {
        mal(EIXIDA.EXTERNA, `Google Play no ha respost (${netejaText(error?.message ?? error)}): no s'anuncia cap build sense saber si es dona`);
      }
    }
  }
  if (iosBuild !== null && iosBuild !== undefined) {
    let carpeta = null;
    if (String(valors.SDP_BUILDS_DIR ?? '').trim()) {
      const cami = rutaDe(arrel, valors, 'SDP_BUILDS_DIR');
      try {
        const real = fs.realpathSync(cami);
        if (fs.statSync(real).isDirectory() && !esDins(arrel, cami) && !esDins(arrel, real)) carpeta = cami;
      } catch { /* no hi és */ }
    }
    if (!carpeta) mal(EIXIDA.FALTA, `falta SDP_BUILDS_DIR (o no és una carpeta de fora del repositori): el registre de pujades és l'única prova que el build ${iosBuild} d'iOS ha anat a l'App Store`);
    else {
      const { entrades, errors } = llegixRegistre(carpeta);
      if (errors.length) mal(EIXIDA.ARBRE, `SDP_BUILDS_DIR/pujades.jsonl no es pot llegir sencer (línies ${errors.join(', ')}): arregla-ho a mà`);
      else if (!entrades.some((e) => e.plataforma === 'ios' && e.canal === CANALS.PRODUCCIO && e.build === String(iosBuild))) {
        mal(EIXIDA.ARBRE, `el build ${iosBuild} d'iOS no és al registre de pujades de producció: l'App d'iOS obri l'App Store, i TestFlight (intern) no hi compta`);
      } else {
        avisos.push(`el build ${iosBuild} d'iOS és al registre de producció: comprova a App Store Connect que Apple ja el dona a l'App Store abans de desplegar la web`);
      }
    }
  }
  return { codi, problemes, avisos };
}

/**
 * Executa el protocol de línies JSON del corredor Jarvis (LLEGIM.txt §3) per als canals demanats.
 */
export async function correProtocolJarvis({ arrel, notes, canals, sec = false, surt = (linia) => process.stdout.write(`${linia}\n`) }) {
  const emet = (pas, estat, text) => {
    const msg = { pas, estat };
    if (text) msg.text = sanejaTextPas(text);
    surt(JSON.stringify(msg));
  };
  const empaquetats = recullEmpaquetats(arrel);
  const higiene = inspeccionaHigienePaquets(arrel);
  const vCanonica = empaquetats.canonica ?? '1.0.0';
  const vWp = empaquetats.plataformes?.wordpress?.versions?.[0] ?? '1.1.11';
  const vAndroid = empaquetats.plataformes?.android?.versions?.[0] ?? vCanonica;
  const bAndroid = empaquetats.plataformes?.android?.builds?.[0] ?? '2';
  const vIos = empaquetats.plataformes?.ios?.versions?.[0] ?? vCanonica;
  const bIos = empaquetats.plataformes?.ios?.builds?.[0] ?? '1';

  let totBe = true;
  for (const canal of canals) {
    emet(canal, 'en_curs');
    if (!higiene.valid) {
      emet(canal, 'error', `Higiene de paquets (IDEA-62) amb ${higiene.incidencies.length} incidència(es).`);
      totBe = false;
      continue;
    }
    if (canal === 'web') {
      if (sec) {
        emet('web', 'fet', `Assaig web verificat (${vCanonica}, higiene neta).`);
      } else {
        emet('web', 'error', 'El desplegament web directe no té script connectat al repositori (NOTA_ORDRE.pwa).');
        totBe = false;
      }
      continue;
    }
    if (canal === 'wordpress') {
      if (sec) {
        emet('wordpress', 'fet', `Assaig WordPress verificat (v${vWp}, vitrina fora del zip).`);
      } else {
        emet('wordpress', 'error', `Pujada automàtica SVN a WordPress.org no configurada en este entorn (v${vWp}).`);
        totBe = false;
      }
      continue;
    }
    if (canal === 'android') {
      const pre = preflight({ arrel, plataformes: ['android'], signa: true, canal: CANALS.INTERN });
      if (pre.codi !== EIXIDA.BE) {
        emet('android', 'error', `Preflight Android no superat (${vAndroid}+${bAndroid}).`);
        totBe = false;
      } else if (sec) {
        const apk = (empaquetats.plataformes?.android?.artefactes ?? []).find((n) => n.endsWith('.apk')) ?? 'llest';
        emet('android', 'fet', `Assaig Android verificat (${vAndroid}+${bAndroid}, APK: ${apk}).`);
      } else {
        /* Elefant R32.3 (Peix security_reviewer, P2) · El corredor no fabrica mai el «sí» del Mestre: amb
           el client REST de Google Play (sense fastlane), un --confirma=V+B fet ací pujaria de veres i
           cremaria el versionCode. La pujada d'Android és sempre una ordre del Mestre, a la terminal. */
        emet('android', 'error', `Google Play no es puja des del corredor: el «sí» és del Mestre per a cada pujada (node scripts/botigues/puja-android.mjs --versio ${vAndroid} --build ${bAndroid} --confirma=${vAndroid}+${bAndroid}).`);
        totBe = false;
      }
      continue;
    }
    if (canal === 'ios') {
      const pre = preflight({ arrel, plataformes: ['ios'], signa: true, canal: CANALS.INTERN });
      if (pre.codi !== EIXIDA.BE) {
        emet('ios', 'error', `Preflight iOS no superat (${vIos}+${bIos}).`);
        totBe = false;
      } else if (sec) {
        emet('ios', 'fet', `Assaig Apple verificat (${vIos}+${bIos}).`);
      } else {
        const res = await executa(process.execPath, [
          'scripts/botigues/puja-ios.mjs',
          '--versio', vIos,
          '--build', bIos,
          `--confirma=${vIos}+${bIos}`
        ], { cwd: arrel, valors: pre.valors, arrel, mostra: false, eco: false });
        if (res.codi === 0) {
          emet('ios', 'fet', `Apple enviat (${vIos}+${bIos}).`);
        } else {
          emet('ios', 'error', `puja-ios.mjs ha tornat ${res.codi} (${vIos}+${bIos}).`);
          totBe = false;
        }
      }
    }
  }
  if (notes) {
    process.stderr.write(`[corredor-jarvis] Notes registrades (${notes.length} caràcters).\n`);
  }
  return totBe ? EIXIDA.BE : EIXIDA.EXTERNA;
}

/**
 * @param {string[]} argv
 * @param {{ env?: object, play?: object, manifest?: string|null }} [dependencies] Només per a les proves: l'entorn
 *   (SDP_BOTIGUES_ENV), les opcions del client de Google Play (adreces locals) i la ruta d'un ard.json temporal.
 */
export async function main(argv = process.argv.slice(2), { env = process.env, play = {}, manifest = null } = {}) {
  const { opcions, errors } = analitzaArguments(argv, ADMESOS);
  if (opcions.ajuda) {
    process.stdout.write(`node scripts/botigues/publica-tot.mjs ${US.slice(4)}\n`);
    return EIXIDA.BE;
  }
  if (errors.length) return plega(EIXIDA.US, US, errors);

  const arrel = arrelComprovada();
  if (!arrel) return plega(EIXIDA.EINA, 'git no reconeix l’arrel del repositori');

  /* R32.3 · Les dues accions de publicació, cada una sola (sense plataforma, canal ni pujada).
     Elefant R32.3 (Peix silent_failure_hunter, P2) · Mai juntes: el manifest viu a public/ i el build el
     copia a dist/, així que --sincronitza-ard va ABANS de npm run build; l'APK va a dist/, DESPRÉS del
     build i abans de firebase deploy. Cap de les dues escriu res fins que totes les guardes passen. */
  if (opcions['publica-apk'] || opcions['sincronitza-ard']) {
    const admesos = new Set(['publica-apk', 'sincronitza-ard', 'versio', 'build', 'build-ios', 'corregeix-ard']);
    const sobren = Object.keys(opcions).filter((nom) => !admesos.has(nom));
    if (sobren.length) return plega(EIXIDA.US, `--publica-apk i --sincronitza-ard només van amb --versio, --build, --build-ios i --corregeix-ard (sobren: ${sobren.map((n) => `--${n}`).join(', ')})`);
    if (opcions['publica-apk'] && opcions['sincronitza-ard']) {
      return plega(EIXIDA.US, '--publica-apk i --sincronitza-ard van en ordres a banda: el manifest (public/) abans de npm run build; l’APK (dist/) després del build i abans de firebase deploy');
    }
    if (opcions['build-ios'] !== undefined && !opcions['sincronitza-ard']) return plega(EIXIDA.US, '--build-ios només va amb --sincronitza-ard');
    if (opcions['corregeix-ard'] && !opcions['sincronitza-ard']) return plega(EIXIDA.US, '--corregeix-ard només va amb --sincronitza-ard');
    const bonBuild = (nom) => opcions[nom] === undefined || BUILD.test(String(opcions[nom]));
    if (!VERSIO.test(String(opcions.versio ?? '')) || !bonBuild('build') || !bonBuild('build-ios')
        || (opcions['publica-apk'] && opcions.build === undefined) || (opcions.build === undefined && opcions['build-ios'] === undefined)) {
      return plega(EIXIDA.US, 'cal --versio X.Y.Z explícita i --build N (Android; obligatori amb --publica-apk) i/o --build-ios M (iOS)');
    }
    const entorn = carregaEntorn({ arrel, env });
    if (entorn.codi !== EIXIDA.BE) return plega(entorn.codi, 'El fitxer d\'entorn no deixa seguir: no es fa res.', entorn.problemes);
    const { valors } = entorn;
    const net = (text) => emmascara(text, valors, arrel);

    if (opcions['sincronitza-ard']) {
      const corregeix = Boolean(opcions['corregeix-ard']);
      const builds = { androidBuild: opcions.build ?? null, iosBuild: opcions['build-ios'] ?? null };
      const cami = manifest ?? path.join(arrel, ...MANIFEST_VERSIO);
      // 1. Les guardes pures, en sec: la versió de package.json, el sostre de VERSIO_CLIENT_NATIU i la monotonia.
      const assaig = escriuManifestVersio({ arrel, versio: opcions.versio, ...builds, corregeix, cami, sec: true });
      if (assaig.codi !== EIXIDA.BE) return plega(assaig.codi, `${assaig.error}: ard.json no canvia`);
      // 2. La botiga ja el dona? Google Play per l'API (només lectura) i el registre de producció d'iOS.
      const disponible = await comprovaDisponibilitat({ arrel, valors, ...builds, opcionsPlay: play });
      for (const avis of disponible.avisos) process.stdout.write(`  · ${net(avis)}\n`);
      if (disponible.codi !== EIXIDA.BE) return plega(disponible.codi, 'ard.json no canvia: l’App avisaria d’un build que la botiga encara no dona.', disponible.problemes.map(net));
      // 3. Ara sí, l'escriptura (atòmica).
      const res = escriuManifestVersio({ arrel, versio: opcions.versio, ...builds, corregeix, cami });
      if (res.codi !== EIXIDA.BE) return plega(res.codi, res.error);
      const dits = Object.entries(builds).filter(([, valor]) => valor !== null).map(([nom, valor]) => `${nom} ${valor}`).join(', ');
      if (corregeix && res.canviat) process.stdout.write(`! --corregeix-ard: ${MANIFEST_VERSIO.join('/')} s'ha corregit a mà (pot baixar); anota-ho al rebut del desplegament\n`);
      process.stdout.write(`✓ ${MANIFEST_VERSIO.join('/')}: version ${opcions.versio}, ${dits}${res.canviat ? '' : ' (ja hi era)'}; ara npm run build i el desplegament web\n`);
      return EIXIDA.BE;
    }

    const res = await publicaApkDirecte({ arrel, versio: opcions.versio, build: opcions.build, valors, jdkHome: jdkPerAGradle({ env })?.home ?? null });
    if (res.codi !== EIXIDA.BE) return plega(res.codi, net(res.error));
    process.stdout.write(`✓ /descarregues/${NOM_APK_PUBLIC} ← ${res.origen} (${res.octets} B, SHA-256: ${res.sha256}; signatura de la clau de pujada verificada); ara firebase deploy\n`);
    process.stdout.write('  ! L’APK directe va signat amb la clau de PUJADA: si Google Play reparteix amb una altra (App Signing), un mòbil amb este APK no s’actualitza des de Play sense desinstal·lar (D-R32.3-PLAY-3).\n');
    return EIXIDA.BE;
  }

  // Camí del corredor Jarvis (--notes, --canals, --sec)
  if (opcions.notes !== undefined || opcions.canals !== undefined || opcions.sec) {
    if (['versio', 'build', 'plataforma', 'canal', 'compila', 'confirma', 'push', 'desplega', 'json'].some((nom) => opcions[nom] !== undefined)) {
      return plega(EIXIDA.US, 'No es poden mesclar les opcions del corredor --notes/--canals/--sec amb les de versió i plataforma.');
    }
    const notes = String(opcions.notes ?? '').trim();
    if (!notes) return plega(EIXIDA.US, 'Cal indicar --notes "<notes>" no buides.');
    const llistaCrua = String(opcions.canals ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    if (llistaCrua.some((c) => !CANALS_JARVIS.includes(c))) {
      return plega(EIXIDA.US, `--canals només admet: ${CANALS_JARVIS.join(',')}`);
    }
    const canals = llistaCrua.length ? CANALS_JARVIS.filter((c) => llistaCrua.includes(c)) : [...CANALS_JARVIS];
    return correProtocolJarvis({ arrel, notes, canals, sec: Boolean(opcions.sec) });
  }

  const plataforma = opcions.plataforma ?? 'totes';
  if (!PLATAFORMES_VALIDES.includes(plataforma)) {
    return plega(EIXIDA.US, `--plataforma ha de ser una de: ${PLATAFORMES_VALIDES.join(', ')}`);
  }
  const canal = opcions.canal ?? CANALS.INTERN;
  if (!Object.values(CANALS).includes(canal)) {
    return plega(EIXIDA.US, `--canal ha de ser ${Object.values(CANALS).join(' o ')}`);
  }

  const empaquetats = recullEmpaquetats(arrel);
  const versio = opcions.versio ?? empaquetats.canonica ?? '1.0.0';
  const build = opcions.build ?? empaquetats.plataformes?.android?.builds?.[0] ?? '2';
  if (!VERSIO.test(versio) || !BUILD.test(build)) {
    return plega(EIXIDA.US, US);
  }

  const resum = resumOmnicanal(arrel, { versio, build, canal, plataforma, push: Boolean(opcions.push) });

  if (!opcions.compila && opcions.confirma === undefined) {
    if (opcions.json) {
      process.stdout.write(`${JSON.stringify(resum, null, 2)}\n`);
    } else {
      process.stdout.write([
        `[Mode Jarvis Omnicanal · IDEA-60] Versió ${versio}+${build} · Canal: ${canal} · Plataforma: ${plataforma}`,
        `Higiene de paquets (IDEA-62): ${resum.higiene.valid ? '✓ neta' : '✗ incidències'} (${resum.higiene.fitxers} fitxers en ${resum.higiene.examinades.length} superfícies)`,
        `APK directe signat: ${resum.apkDirecte.artefacte ?? 'pendent'} (SHA-256: ${resum.apkDirecte.sha256 ?? 'pendent'})`,
        ...resum.preflight.linies,
        '',
        'PLA OMNICANAL EN SEC:',
        ...resum.passos.map((p, i) => `  ${i + 1}. [${p.plataforma.toUpperCase()}] ${p.accio}\n     $ ${p.ordre}`),
        ''
      ].join('\n'));
    }
    return resum.higiene.valid ? resum.preflight.codi : EIXIDA.ARBRE;
  }

  /* Una acció real sempre pertany a un únic artefacte: la confirmació de
     producció porta el seu sha12 i no pot autoritzar alhora AAB i IPA. Les
     guardes de versió, preflight i confirmació són les dels scripts existents. */
  if (plataforma === 'totes') {
    return plega(EIXIDA.US, 'Per a --compila o --confirma, tria una sola --plataforma android o ios; cada artefacte té el seu rebut i la seua confirmació.');
  }
  if (plataforma === 'web' || plataforma === 'wordpress') {
    return plega(EIXIDA.EINA, `L’acció ${plataforma} no té cap publicador connectat a esta CLI; el resum en sec mostra les ordres disponibles.`);
  }
  if (opcions.json) return plega(EIXIDA.US, '--json és només per al resum en sec; la compilació o pujada conserva el rebut del script natiu.');

  if (!resum.higiene.valid) {
    return plega(EIXIDA.ARBRE, 'IDEA-62: tractor-higiene-paquets ha detectat contaminació als paquets:', resum.higiene.incidencies.map((i) => `${i.cami}: ${i.motiu}`));
  }

  if (opcions.desplega && plataforma !== 'android') return plega(EIXIDA.US, '--desplega només és d’Android (la prova interna de Google Play)');
  const argumentsNatius = ['--versio', versio, '--build', build, '--canal', canal];
  if (opcions.push) argumentsNatius.push('--push');
  if (opcions.desplega) argumentsNatius.push('--desplega');
  if (opcions.compila) argumentsNatius.push('--compila');
  if (opcions.confirma !== undefined) argumentsNatius.push(`--confirma=${opcions.confirma}`);
  const codiNatiu = await (plataforma === 'ios' ? pujaIos : pujaAndroid)(argumentsNatius);
  if (codiNatiu !== EIXIDA.BE) return codiNatiu;

  /* El script d'Android ja ha compilat i verificat l'AAB. El mateix build
     genera també l'APK directe, sense substituir ni duplicar la pujada. */
  if (opcions.compila && plataforma === 'android') {
    const pre = preflight({ arrel, plataformes: ['android'], signa: true, canal, push: Boolean(opcions.push) });
    if (pre.codi !== EIXIDA.BE) return plega(pre.codi, 'Preflight Android amb problemes: no es compila res.', pre.linies);
    const resApk = await compilaApkDirecte({ arrel, valors: pre.valors, jdkHome: pre.jdk.home, versio, build });
    if (resApk.codi !== EIXIDA.BE) return plega(resApk.codi, resApk.error);
    process.stdout.write(`✓ APK directe universal signat i verificat: ${resApk.nomFitxer} (SHA-256: ${resApk.sha256})\n`);
    process.stdout.write(`  Per a publicar-lo a /descarregues/${NOM_APK_PUBLIC}: després de «npm run build» i abans de «firebase deploy», ${ORDRE_PUBLICA_APK} --versio ${versio} --build ${build}\n`);
  }

  return EIXIDA.BE;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then((codi) => { process.exitCode = codi; });
}
