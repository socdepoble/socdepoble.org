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
 *       canalsDeBotiga.js. Va DESPRÉS de npm run build (que buida dist/) i ABANS de l'rsync de dist/
 *       al Node 0. Mai a public/: Vite el copiaria dins de dist-natiu/ (l'app nativa) i del connector
 *       WordPress.
 *       Onada v1.2.6 (ordre del Mestre del 17-11-2026: cap descàrrega de l'APK ha de costar a Firebase
 *       Hosting) · Firebase NO el servix: firebase.json l'exclou del paquet (hosting.ignore «**\/*.apk»
 *       i «**\/*.apk.sha256») i redirigix (302) /descarregues/socdepoble-android-latest.apk i el seu
 *       .sha256 a la mateixa ruta de https://socdepoble.cat (src/config/firebaseHosting.test.js). Qui el
 *       servix és el Node 0 (Caddy darrere de Cloudflare), i l'ÚNIC camí pel qual hi arriba és la còpia
 *       de dist/ al mirall (rsync sense --delete, sense cap exclusió de dist/descarregues/). Si eixa
 *       còpia no es fa DESPRÉS d'esta ordre, l'adreça de socdepoble.org continua redirigint a l'APK
 *       anterior del Node 0 (o a un 404 si no n'hi ha cap), encara que «firebase deploy» isca bé.
 *   --sincronitza-ard --versio X.Y.Z [--build N] [--build-ios M] [--corregeix-ard]
 *       escriu version i androidBuild (--build) i/o iosBuild (--build-ios) a public/.well-known/ard.json,
 *       el manifest que consulta src/natiu/actualitzacioAppNativa.js, amb sincronitzaManifestVersio.
 *       Va ABANS de npm run build (el build el copia a dist/), i mai en la mateixa ordre que
 *       --publica-apk. Abans d'escriure: la versió és la de package.json, cap build passa de
 *       VERSIO_CLIENT_NATIU, i el build ja es DONA al canal que obri el botó de l'App: Google Play el
 *       té «completed» a la pista production (l'API, només lectura; la prova interna només la reben
 *       els provadors de Play, no tots els Android) i el d'iOS és al registre de pujades de producció
 *       (l'App Store). Si no, l'App avisaria d'una versió que la botiga encara no dona, a cada
 *       obertura. Mai baixa, llevat de --corregeix-ard (l'única manera de desfer una errada).
 *   --sincronitza-proves --versio X.Y.Z [--build-testflight M] [--build-apk N] [--corregeix-ard]
 *       Onada v1.2.7 · P0-123 (ordre directa del Mestre, 17-11-2026: actualització automàtica real als
 *       mòbils de prova) · escriu els canals de proves del manifest, amb les mateixes garanties que
 *       --sincronitza-ard (la versió de package.json, cap build per damunt de VERSIO_CLIENT_NATIU, mai
 *       baixa sense --corregeix-ard) i NOMÉS amb l'evidència de cada canal:
 *         · testflightIosBuild (--build-testflight) · després de puja-ios.mjs: el registre de pujades
 *           (SDP_BUILDS_DIR/pujades.jsonl, que puja-ios.mjs apunta DESPRÉS d'una pujada feta) ha de
 *           portar el build d'iOS (intern o producció: App Store Connect el dona a TestFlight). P0123-02 ·
 *           I cap pujada de producció d'iOS entre l'iosBuild d'ard.json i el build demanat: eixa pot
 *           estar en App Review (on l'App porta el rebut de proves, com a TestFlight) o pendent de
 *           publicar, i no s'anuncia un TestFlight més nou fins que l'App Store la done (--sincronitza-ard
 *           --build-ios, i després esta ordre);
 *         · apkDirectBuild i apkSha256 (--build-apk) · després de --publica-apk: dist/descarregues/ ha
 *           de portar l'APK publicat, amb el .sha256 que casa, idèntic a l'APK ÚNIC de la versió i el
 *           build de _builds_de_poble/android/ i signat amb SDP_ANDROID_UPLOAD_CERT_SHA256 (apksigner,
 *           ara); apkSha256 és la SHA-256 d'eixe fitxer publicat.
 *       I latestBuild, el més alt dels builds de cada fitxer (també amb --sincronitza-ard). testflightIosBuild
 *       va a public/.well-known/ard.json i, si hi ha un build fet, a dist/.well-known/ard.json (la còpia
 *       que es desplega), tots dos o cap. P0123-01 · L'anunci de l'APK (apkDirectBuild i apkSha256) va
 *       NOMÉS a dist/.well-known/ard.json, mai a public/: viu i mor amb l'APK de dist/descarregues/, i un
 *       «npm run build» posterior (ORDRE_WEB en comença per ací) els retira tots dos alhora. Per a
 *       l'APK, l'ordre és: npm run build → --publica-apk → --sincronitza-proves --build-apk → rsync de
 *       dist/ al Node 0 → firebase deploy d'eixe mateix dist/, SENSE cap build entremig (el manifest no
 *       pot arribar a socdepoble.org abans que l'APK al Node 0). Si entremig es fa un build, l'APK i el
 *       seu anunci han desaparegut junts de dist/: torna a --publica-apk i a --sincronitza-proves --build-apk.
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
import { ESTATS_PLAY, PISTES, consultaLlancament, netejaText, main as pujaAndroid } from './puja-android.mjs';
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
  'sincronitza-proves': false,
  'build-testflight': true,
  'build-apk': true,
  ajuda: false
});

const PLATAFORMES_VALIDES = Object.freeze(['totes', 'web', 'wordpress', 'android', 'ios']);
const US = 'Ús: --notes "<notes>" [--canals web,wordpress,android,ios] [--sec] | --versio X.Y.Z --build N [--plataforma totes|web|wordpress|android|ios] [--canal intern|produccio] [--push] [--json] | --versio X.Y.Z --build N --plataforma android|ios [--canal intern|produccio] [--push] [--desplega] [--compila] [--confirma=X.Y.Z+N|produccio:X.Y.Z+N@<sha12>] | --versio X.Y.Z --build N --publica-apk | --versio X.Y.Z [--build N] [--build-ios M] --sincronitza-ard | --versio X.Y.Z [--build-testflight M] [--build-apk N] --sincronitza-proves';

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

  /* R32.3-PEIX-ARD · L'ordre del pla: primer les compilacions i pujades natives (el preflight de cada
     una vol l'arbre net); després els anuncis que escriuen public/.well-known/ard.json, versionat
     (a producció, --sincronitza-ard, i l'anunci de TestFlight), perquè cap compilació nativa vinga
     darrere d'un arbre brut; després «npm run build» (que copia ard.json a dist/ i buida dist/) i el
     connector WordPress, al mateix lloc que abans; i al final el que necessita eixe dist/ (l'APK
     directe i el seu anunci). Un --sincronitza-ard posterior al build no arribaria a l'App fins al
     desplegament següent. */
  const natius = [];
  const anuncis = [];
  const web = [];
  const despresDelBuild = [];
  const produccio = canal === CANALS.PRODUCCIO;
  if (plataformes.includes('web')) {
    web.push({
      plataforma: 'web',
      accio: 'Compilar i desplegar PWA + Open Data + ActivityPub a socdepoble.org',
      ordre: ORDRE_WEB
    });
  }
  if (plataformes.includes('wordpress')) {
    const vWp = empaquetats.plataformes?.wordpress?.versions?.[0] ?? '1.1.11';
    web.push({
      plataforma: 'wordpress',
      accio: `Empaquetar connector WordPress v${vWp} (sense banners de vitrina dins del ZIP · IDEA-62)`,
      ordre: `SDP_RELEASE=1 SDP_VERSIO=${vWp} npm run build:wp && SDP_RELEASE=1 SDP_VERSIO=${vWp} npm run build:wp:directori && node wordpress-plugin/eines/empaqueta.mjs --directori`
    });
  }
  if (plataformes.includes('android')) {
    natius.push({
      plataforma: 'android',
      accio: `Compilar i signar AAB (${v}+${b}) per a Google Play (${canal}) + APK directe universal (${NOM_APK_PUBLIC})`,
      ordre: `node scripts/botigues/publica-tot.mjs --versio ${v} --build ${b} --plataforma android --canal ${canal} --compila`
    });
    /* R32.3 · La pujada per l'API REST de Google Play (sense fastlane) i l'APK públic. */
    natius.push({
      plataforma: 'android',
      accio: `Pujar l'AAB a Google Play per l'API REST v3 (pista ${produccio ? 'production' : 'internal'}, esborrany; a la prova interna, --desplega el deixa desplegat) amb el «sí» del Mestre`,
      ordre: `node scripts/botigues/puja-android.mjs --versio ${v} --build ${b} --canal ${canal} --confirma=<«sí» del Mestre>`
    });
    /* R32.3-PEIX-ARD · Només a producció: un build de la prova interna no s'anuncia a tots els Android. */
    if (produccio) {
      anuncis.push({
        plataforma: 'android',
        accio: `Quan Google Play done el versionCode ${b} a la pista production («completed»: promogut a Play Console i desplegat al 100 %), anunciar-lo a les Apps de Google Play (androidBuild a public/.well-known/ard.json) ABANS de «npm run build» i del desplegament web`,
        ordre: `${ORDRE_SINCRONITZA_ARD} --versio ${v} --build ${b}`
      });
    }
    despresDelBuild.push({
      plataforma: 'android',
      accio: `Publicar l'APK directe a /descarregues/${NOM_APK_PUBLIC}: entre «npm run build» (que buida dist/) i l'rsync de dist/ al Node 0 (socdepoble.cat), que és qui el servix; Firebase no el puja i hi redirigix (302)`,
      ordre: `${ORDRE_PUBLICA_APK} --versio ${v} --build ${b}`
    });
    /* v1.2.7 · P0-123 · Les Apps d'instal·lació directa s'assabenten de l'APK nou pel manifest. */
    despresDelBuild.push({
      plataforma: 'android',
      accio: `Anunciar l'APK publicat a les Apps d'instal·lació directa (apkDirectBuild i apkSha256 NOMÉS a dist/.well-known/ard.json: un build nou el retira amb l'APK): després de --publica-apk i ABANS de l'rsync de dist/ al Node 0 i de firebase deploy d'eixe dist/, sense cap build entremig`,
      ordre: `${ORDRE_SINCRONITZA_PROVES} --versio ${v} --build-apk ${b}`
    });
  }
  if (plataformes.includes('ios')) {
    natius.push({
      plataforma: 'ios',
      accio: `Arxivar, exportar i verificar IPA (${v}+${b}) per a App Store Connect / TestFlight (${canal})`,
      ordre: `node scripts/botigues/puja-ios.mjs --versio ${v} --build ${b} --canal ${canal} --compila`
    });
    /* R32.3-PEIX-ARD · Només a producció, i abans de l'anunci de TestFlight, que no avança mentre un
       build de producció més baix espera l'App Store. */
    if (produccio) {
      anuncis.push({
        plataforma: 'ios',
        accio: `Quan Apple publique el build ${b} a l'App Store (la pujada de producció ha de ser al registre de pujades; que Apple ja el dona es comprova a App Store Connect), anunciar-lo a les Apps de l'App Store (iosBuild a public/.well-known/ard.json) ABANS de «npm run build» i del desplegament web`,
        ordre: `${ORDRE_SINCRONITZA_ARD} --versio ${v} --build-ios ${b}`
      });
    }
    /* v1.2.7 · P0-123 · Les Apps de TestFlight s'assabenten del build nou pel manifest. */
    anuncis.push({
      plataforma: 'ios',
      accio: 'Anunciar el build pujat a les Apps de TestFlight (testflightIosBuild a ard.json): després de la pujada de puja-ios.mjs --confirma, que l\'apunta al registre, i mai mentre un build de producció més baix espera l\'App Store (App Review); la web el publica en el desplegament següent',
      ordre: `${ORDRE_SINCRONITZA_PROVES} --versio ${v} --build-testflight ${b}`
    });
  }
  const passos = [...natius, ...anuncis, ...web, ...despresDelBuild];

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

/* https://socdepoble.org/descarregues/socdepoble-android-latest.apk és l'adreça única de
   canalsDeBotiga.js (FITXER_APK). L'APK NO va a public/: Vite el copiaria dins de dist-natiu/ (107 MB
   dins de l'app) i del connector WordPress. `npm run build` buida dist/, per això es copia DESPRÉS del
   build i ABANS de l'rsync de dist/ al Node 0.
   Onada v1.2.6 (ordre del Mestre del 17-11-2026) · Firebase Hosting servix dist/ (firebase.json) però
   NO l'APK: hosting.ignore deixa fora del paquet tot .apk i tot .apk.sha256, i les dues adreces de
   /descarregues/ redirigixen (302) a la mateixa ruta de https://socdepoble.cat, el mirall del Node 0
   (Caddy darrere de Cloudflare). Cada descàrrega des de socdepoble.org costa a Firebase només la
   resposta de la redirecció, no els 107 MB. L'APK arriba al Node 0 NOMÉS per la còpia de dist/ al
   mirall (rsync sense --delete), que ha d'incloure dist/descarregues/ i fer-se després d'esta ordre;
   la recepta d'eixa còpia no és al repositori (tooling/node0/ i scripts/ no porten cap rsync).
   Els noms que comencen per «.» no es despleguen (hosting.ignore de firebase.json exclou els fitxers
   ocults): la còpia temporal no pot eixir mai a Firebase, i a l'rsync només si es llançara mentre
   esta ordre escriu (el temporal s'esborra en acabar).
   Elefant R32.3 (Peix security_reviewer, P2) · Un .sha256 al costat només diu que l'APK casa amb ell
   mateix: en publicar, la signatura es torna a VERIFICAR (apksigner) contra
   SDP_ANDROID_UPLOAD_CERT_SHA256, i dos APK de la mateixa versió i build són ambigus (cap «el més nou»).
   L'APK directe va signat amb la clau de PUJADA; Google Play reparteix amb la d'App Signing: si són
   diferents, un mòbil amb este APK no s'actualitza des de Play sense desinstal·lar (D-R32.3-PLAY-3). */
export const DESCARREGUES_DIST = Object.freeze(['dist', 'descarregues']);
export const ORDRE_PUBLICA_APK = 'node scripts/botigues/publica-tot.mjs --publica-apk';
export const ORDRE_SINCRONITZA_PROVES = 'node scripts/botigues/publica-tot.mjs --sincronitza-proves';
/** R32.3-PEIX-ARD · L'anunci a les Apps de les botigues (public/.well-known/ard.json), abans de npm run build. */
export const ORDRE_SINCRONITZA_ARD = 'node scripts/botigues/publica-tot.mjs --sincronitza-ard';
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
    return no(EIXIDA.ARBRE, 'no hi ha dist/index.html: primer npm run build (el build buida dist/ i s’emportaria l’APK); després, abans de l’rsync de dist/ al Node 0');
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
/** v1.2.7 · La còpia que es desplega (el build copia public/ a dist/). */
export const MANIFEST_VERSIO_DIST = Object.freeze(['dist', '.well-known', 'ard.json']);

/* v1.2.7 · P0-123 · L'ordre de les claus de versió, davant de les entrades: les de les botigues
   públiques, les dels canals de proves (src/config/manifestVersio.js) i latestBuild, el més alt de
   tots els builds (el calcula l'escriptor; mai s'escriu a mà). */
export const CLAUS_DE_VERSIO = Object.freeze(['version', 'androidBuild', 'iosBuild', 'testflightIosBuild', 'apkDirectBuild', 'apkSha256', 'latestBuild']);
const CLAUS_DE_BUILD = Object.freeze(['androidBuild', 'iosBuild', 'testflightIosBuild', 'apkDirectBuild']);
const SHA256_HEX = /^[0-9a-f]{64}$/;

/* Les guardes comunes i l'escriptura de les claus de versió: la versió X.Y.Z que mai baixa, cada build
   un enter positiu que no passa de `maximBuild` i que mai baixa, i latestBuild recalculat. Llança amb el
   motiu; torna el text nou. `builds` només porta els builds que es canvien. */
function aplicaVersions(text, { versio, builds, extra = {}, maximBuild, corregeix }) {
  if (!VERSIO.test(String(versio ?? ''))) throw new Error('la versió ha de ser X.Y.Z');
  for (const [nom, valor] of builds) {
    if (!BUILD.test(String(valor))) throw new Error(`${nom} ha de ser un enter positiu`);
    if (Number.isSafeInteger(maximBuild) && Number(valor) > maximBuild) {
      throw new Error(`${nom} ${valor} passa de VERSIO_CLIENT_NATIU (${maximBuild}, src/data/contracte.js): cap App ni cap botiga el pot tindre encara`);
    }
  }
  let dades;
  try { dades = JSON.parse(String(text ?? '')); } catch { throw new Error('ard.json no és JSON'); }
  if (!dades || typeof dades !== 'object' || Array.isArray(dades) || !Array.isArray(dades.entries)) throw new Error('ard.json no té «entries»');
  const nou = { version: String(versio), ...Object.fromEntries(builds.map(([nom, valor]) => [nom, Number(valor)])), ...extra };
  if (!corregeix && VERSIO.test(String(dades.version ?? '')) && comparaVersions(nou.version, dades.version) < 0) {
    throw new Error(`ard.json ja publica la versió ${dades.version}: no es baixa a ${nou.version} (si és una errada, --corregeix-ard)`);
  }
  for (const [nom] of builds) {
    if (!corregeix && Number.isSafeInteger(dades[nom]) && nou[nom] < dades[nom]) {
      throw new Error(`ard.json ja publica ${nom} ${dades[nom]}: no es baixa a ${nou[nom]} (si és una errada, --corregeix-ard)`);
    }
  }
  const fusio = { ...dades, ...nou };
  const valids = CLAUS_DE_BUILD.map((clau) => fusio[clau]).filter((valor) => Number.isSafeInteger(valor) && valor >= 1);
  if (valids.length) fusio.latestBuild = Math.max(...valids);
  const resultat = {};
  for (const clau of CLAUS_DE_VERSIO) if (Object.hasOwn(fusio, clau)) resultat[clau] = fusio[clau];
  for (const [clau, valor] of Object.entries(dades)) if (!CLAUS_DE_VERSIO.includes(clau)) resultat[clau] = valor;
  for (const entrada of resultat.entries) {
    if (entrada && typeof entrada === 'object' && typeof entrada.version === 'string') entrada.version = nou.version;
  }
  return `${JSON.stringify(resultat, null, 2)}\n`;
}

/**
 * Pur: el text d'ard.json amb version, i androidBuild i/o iosBuild, posats (i el version de cada
 * entrada, i latestBuild). Les claus de versió van davant de les entrades, en l'ordre de CLAUS_DE_VERSIO.
 * Llança si el text no és el manifest, si no es passa cap build, si un build passa de `maximBuild`
 * (VERSIO_CLIENT_NATIU) o si baixaria sense `corregeix`.
 */
export function sincronitzaManifestVersio(text, { versio, androidBuild = null, iosBuild = null, maximBuild = Number(VERSIO_CLIENT_NATIU), corregeix = false } = {}) {
  if (!VERSIO.test(String(versio ?? ''))) throw new Error('la versió ha de ser X.Y.Z');
  const builds = Object.entries({ androidBuild, iosBuild }).filter(([, valor]) => valor !== null && valor !== undefined);
  if (!builds.length) throw new Error('cal androidBuild o iosBuild: el build que ja dona la botiga');
  return aplicaVersions(text, { versio, builds, maximBuild, corregeix });
}

/**
 * v1.2.7 · P0-123 · Pur: el text d'ard.json amb version, testflightIosBuild i/o apkDirectBuild (amb la
 * seua apkSha256) posats, i latestBuild. Les mateixes guardes que sincronitzaManifestVersio, i una més:
 * el mateix apkDirectBuild amb una altra suma és un altre fitxer amb el mateix build, i només entra
 * amb `corregeix`. Llança amb el motiu.
 */
export function sincronitzaManifestProves(text, {
  versio, testflightIosBuild = null, apkDirectBuild = null, apkSha256 = null, maximBuild = Number(VERSIO_CLIENT_NATIU), corregeix = false,
  senseSuma = false
} = {}) {
  if (!VERSIO.test(String(versio ?? ''))) throw new Error('la versió ha de ser X.Y.Z');
  const builds = Object.entries({ testflightIosBuild, apkDirectBuild }).filter(([, valor]) => valor !== null && valor !== undefined);
  if (!builds.length) throw new Error('cal testflightIosBuild o apkDirectBuild: el build que ja dona el canal de proves');
  const ambApk = apkDirectBuild !== null && apkDirectBuild !== undefined;
  /* `senseSuma` · només per a l'assaig en sec d'abans de llegir l'APK: les guardes de versió i de build,
     sense la suma (el text que torna no s'escriu mai). */
  if (senseSuma) return aplicaVersions(text, { versio, builds, maximBuild, corregeix });
  if (ambApk && !SHA256_HEX.test(String(apkSha256 ?? ''))) throw new Error('apkDirectBuild va sempre amb apkSha256, la SHA-256 (64 xifres hexadecimals en minúscula) de l’APK publicat');
  if (!ambApk && apkSha256 !== null && apkSha256 !== undefined) throw new Error('apkSha256 només va amb apkDirectBuild');
  if (ambApk && !corregeix) {
    let dades = null;
    try { dades = JSON.parse(String(text ?? '')); } catch { /* aplicaVersions ho dirà */ }
    if (dades && Number(dades.apkDirectBuild) === Number(apkDirectBuild) && SHA256_HEX.test(String(dades.apkSha256 ?? '')) && dades.apkSha256 !== apkSha256) {
      throw new Error(`ard.json ja publica l’apkDirectBuild ${apkDirectBuild} amb una altra SHA-256: un altre fitxer amb el mateix build no entra (si és una correcció, --corregeix-ard)`);
    }
  }
  return aplicaVersions(text, { versio, builds, extra: ambApk ? { apkSha256: String(apkSha256) } : {}, maximBuild, corregeix });
}

/** P0123-02 · L'iosBuild (enter positiu) que publica l'ard.json de `cami`, o null. Mai llança. */
export function iosBuildDelManifest(cami) {
  try {
    const { iosBuild } = JSON.parse(fs.readFileSync(cami, 'utf8')) ?? {};
    return Number.isSafeInteger(iosBuild) && iosBuild >= 1 ? iosBuild : null;
  } catch { return null; }
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
 *    en un llançament «completed» de la pista production. R32.3-PEIX-ARD · La prova interna (internal)
 *    només la reben els provadors de Play, i androidBuild s'anuncia a tots els Android: una pista
 *    internal «completed» no hi compta. Un esborrany, un desplegament per fases o un llançament aturat
 *    tampoc es donen a tothom. Es pregunta per les dues pistes perquè l'error explique on és el build;
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
        const produccio = PISTES[CANALS.PRODUCCIO];
        const desplegat = trobats.find((t) => t.pista === produccio && t.status === ESTATS_PLAY.DESPLEGAT);
        if (desplegat) avisos.push(`Google Play dona el versionCode ${androidBuild} a la pista ${produccio} (completed)`);
        else if (trobats.length) mal(EIXIDA.ARBRE, `Google Play té el versionCode ${androidBuild} però no el dona a tots els Android (${trobats.map((t) => `${t.pista}: ${t.status}`).join(', ')}): ard.json (androidBuild) només anuncia un build de la pista ${produccio} «completed»; promou-lo a ${produccio} a Play Console, desplega'l al 100 % i torna-hi`);
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

/* ───────── v1.2.7 · P0-123 · Els canals de proves del manifest (TestFlight i l'APK directe) ───────── */

/**
 * Escriu els canals de proves a public/.well-known/ard.json (o `cami`) i, si hi ha un build fet
 * (dist/index.html i dist/.well-known/ard.json; o `camiDist`), també a la còpia de dist/ que es
 * desplega: totes dues o cap (primer es calculen les dues, després s'escriuen). La versió ha de ser la
 * de package.json. Amb `sec`, només les guardes.
 * P0123-01 · public/ només rep testflightIosBuild (i el seu latestBuild); apkDirectBuild i apkSha256
 * van NOMÉS a la còpia de dist/, la mateixa on viu l'APK: un build posterior, que buida dist/ i hi torna
 * a copiar public/, retira l'APK i el seu anunci alhora (mai el manifest nou amb l'APK vell).
 * @returns {{ codi:number, canviat?:boolean, escrits?:string[], error?:string }}
 */
export function escriuManifestProves({
  arrel, versio, testflightIosBuild = null, apkDirectBuild = null, apkSha256 = null, corregeix = false, senseSuma = false,
  cami = path.join(arrel, ...MANIFEST_VERSIO),
  camiDist = fs.existsSync(path.join(arrel, 'dist', 'index.html')) ? path.join(arrel, ...MANIFEST_VERSIO_DIST) : null,
  versioPaquet = versioDelPaquet(arrel), maximBuild = Number(VERSIO_CLIENT_NATIU), sec = false
}) {
  if (String(versio) !== String(versioPaquet)) {
    return { codi: EIXIDA.ARBRE, error: `--versio ${versio} no és la de package.json (${versioPaquet ?? 'il·legible'}): el manifest anuncia la versió del sistema` };
  }
  const ambTestflight = testflightIosBuild !== null && testflightIosBuild !== undefined;
  if (!ambTestflight && (apkDirectBuild === null || apkDirectBuild === undefined)) {
    return { codi: EIXIDA.ARBRE, error: 'cal testflightIosBuild o apkDirectBuild: el build que ja dona el canal de proves' };
  }
  const ambDist = Boolean(camiDist) && fs.existsSync(camiDist);
  /* L'APK viu a dist/ (--publica-apk el copia després del build): el seu anunci va NOMÉS en la mateixa
     còpia de dist/ que es desplega (P0123-01), i public/ només porta TestFlight. */
  if (apkDirectBuild !== null && apkDirectBuild !== undefined && !ambDist) {
    return { codi: EIXIDA.ARBRE, error: `no hi ha ${MANIFEST_VERSIO_DIST.join('/')}: l’APK publicat i el seu anunci van en el mateix build (npm run build, --publica-apk i després esta ordre)` };
  }
  const camins = [];
  if (ambTestflight) camins.push([cami, MANIFEST_VERSIO.join('/'), { testflightIosBuild }]);
  if (ambDist) camins.push([camiDist, MANIFEST_VERSIO_DIST.join('/'), { testflightIosBuild, apkDirectBuild, apkSha256 }]);
  const plans = [];
  for (const [desti, nom, canals] of camins) {
    let abans;
    try {
      if (fs.lstatSync(desti).isSymbolicLink()) return { codi: EIXIDA.ARBRE, error: `${nom} és un enllaç: no s’escriu` };
      abans = fs.readFileSync(desti, 'utf8');
    } catch { return { codi: EIXIDA.ARBRE, error: `no es pot llegir ${nom}` }; }
    let despres;
    try {
      despres = sincronitzaManifestProves(abans, { versio, ...canals, maximBuild, corregeix, senseSuma });
    } catch (error) { return { codi: EIXIDA.ARBRE, error: `${nom}: ${error.message}` }; }
    plans.push({ desti, nom, abans, despres });
  }
  if (sec || senseSuma) return { codi: EIXIDA.BE, canviat: plans.some((pla) => pla.despres !== pla.abans), escrits: [] };
  const canviats = plans.filter((pla) => pla.despres !== pla.abans);
  if (!canviats.length) return { codi: EIXIDA.BE, canviat: false, escrits: [] };
  for (const pla of canviats) escriuAtomic(pla.desti, (temporal) => fs.writeFileSync(temporal, pla.despres, 'utf8'));
  return { codi: EIXIDA.BE, canviat: true, escrits: canviats.map((pla) => pla.nom) };
}

/**
 * L'evidència dels canals de proves, ABANS d'escriure res. Mai llança.
 *  · TestFlight (testflightIosBuild) · el registre de pujades (SDP_BUILDS_DIR/pujades.jsonl, fora del
 *    repositori) porta el build d'iOS, de qualsevol canal (puja-ios.mjs només l'apunta DESPRÉS d'una
 *    pujada feta a App Store Connect, que el dona a TestFlight quan acaba de processar-lo), d'una
 *    versió que no és més nova que la del manifest. P0123-02 · I cap pujada de PRODUCCIÓ d'iOS amb un
 *    build més alt que `iosBuildPublicat` (l'iosBuild d'ard.json, el que ja dona l'App Store) i més baix
 *    que el demanat: eixe build pot estar en App Review, on l'App porta el rebut de proves com a
 *    TestFlight, o pendent de publicar, i un TestFlight més nou li mostraria «Actualitza a TestFlight».
 *  · APK directe (apkDirectBuild) · dist/descarregues/socdepoble-android-latest.apk (el que ha publicat
 *    --publica-apk) és un fitxer regular dins de dist/, casa amb el seu .sha256, és byte a byte l'APK
 *    ÚNIC AAMMDD_socdepoble_<versio>+<build>.apk de _builds_de_poble/android/ (amb el seu .sha256) i
 *    està signat amb SDP_ANDROID_UPLOAD_CERT_SHA256 (`empremta`, apksigner, ara). `apkSha256` és la
 *    SHA-256 d'eixe fitxer publicat.
 * @returns {Promise<{ codi:number, problemes:string[], avisos:string[], apkSha256:string|null }>}
 */
export async function comprovaProves({
  arrel, valors = {}, versio, testflightIosBuild = null, apkDirectBuild = null, jdkHome = null, iosBuildPublicat = null,
  carpeta = carpetaBuildsAndroid(arrel), dist = path.join(arrel, 'dist'),
  empremta = (apk) => empremtaDeLApk({ apk, valors, arrel, jdkHome })
}) {
  const problemes = [];
  const avisos = [];
  let codi = EIXIDA.BE;
  let apkSha256 = null;
  const mal = (c, text) => { if (codi === EIXIDA.BE) codi = c; problemes.push(text); };
  if (testflightIosBuild !== null && testflightIosBuild !== undefined) {
    let registre = null;
    if (String(valors.SDP_BUILDS_DIR ?? '').trim()) {
      const cami = rutaDe(arrel, valors, 'SDP_BUILDS_DIR');
      try {
        const real = fs.realpathSync(cami);
        if (fs.statSync(real).isDirectory() && !esDins(arrel, cami) && !esDins(arrel, real)) registre = cami;
      } catch { /* no hi és */ }
    }
    if (!registre) mal(EIXIDA.FALTA, `falta SDP_BUILDS_DIR (o no és una carpeta de fora del repositori): el registre de pujades és l'única prova que el build ${testflightIosBuild} d'iOS ha arribat a App Store Connect`);
    else {
      const { entrades, errors } = llegixRegistre(registre);
      const pujada = entrades.find((e) => e.plataforma === 'ios' && e.build === String(testflightIosBuild));
      const sol = Number.isSafeInteger(iosBuildPublicat) && iosBuildPublicat >= 1 ? iosBuildPublicat : 0;
      const enRevisio = entrades
        .filter((e) => e.plataforma === 'ios' && e.canal === CANALS.PRODUCCIO && BUILD.test(String(e.build)))
        .map((e) => Number(e.build))
        .filter((b) => b > sol && b < Number(testflightIosBuild));
      if (errors.length) mal(EIXIDA.ARBRE, `SDP_BUILDS_DIR/pujades.jsonl no es pot llegir sencer (línies ${errors.join(', ')}): arregla-ho a mà`);
      else if (!pujada) mal(EIXIDA.ARBRE, `el build ${testflightIosBuild} d'iOS no és al registre de pujades: primer puja-ios.mjs --confirma (l'apunta quan la pujada s'ha fet)`);
      else if (comparaVersions(pujada.versio, versio) === 1) mal(EIXIDA.ARBRE, `el build ${testflightIosBuild} d'iOS és de la versió ${pujada.versio}, més nova que la ${versio} del manifest`);
      else if (enRevisio.length) {
        const b = Math.max(...enRevisio);
        mal(EIXIDA.ARBRE, `el build ${b} d'iOS és al registre de producció i ard.json encara publica iosBuild ${sol || 'cap'}: pot estar en App Review (on l'App porta el rebut de proves, com a TestFlight) o pendent de publicar, i no s'anuncia testflightIosBuild ${testflightIosBuild} fins que l'App Store el done. Quan el done: node scripts/botigues/publica-tot.mjs --sincronitza-ard --versio ${versio} --build-ios ${b}, i torna a esta ordre`);
      } else avisos.push(`el build ${testflightIosBuild} d'iOS (${pujada.versio}, ${pujada.canal}) és al registre de pujades: TestFlight el dona quan App Store Connect acaba de processar-lo (de minuts a una hora)`);
    }
  }
  if (apkDirectBuild !== null && apkDirectBuild !== undefined) {
    const esperada = normalitzaEmpremta(valors.SDP_ANDROID_UPLOAD_CERT_SHA256);
    const carpetaPublica = path.join(dist, ...DESCARREGUES_DIST.slice(1));
    const publicat = path.join(carpetaPublica, NOM_APK_PUBLIC);
    const unic = apksDeLaVersio(carpeta, versio, apkDirectBuild);
    let fitxa = null;
    try {
      const dins = !fs.lstatSync(carpetaPublica).isSymbolicLink() && esDins(fs.realpathSync(dist), fs.realpathSync(carpetaPublica));
      fitxa = dins ? fs.lstatSync(publicat) : null;
    } catch { fitxa = null; }
    if (!esperada) mal(EIXIDA.FALTA, 'falta SDP_ANDROID_UPLOAD_CERT_SHA256 al fitxer d’entorn: sense la clau de pujada no es pot verificar l’APK publicat');
    else if (!fitxa || !fitxa.isFile()) mal(EIXIDA.ARBRE, `no hi ha cap APK publicat a dist/descarregues/${NOM_APK_PUBLIC}: primer npm run build i ${ORDRE_PUBLICA_APK} --versio ${versio} --build ${apkDirectBuild}`);
    else if (unic.length !== 1) mal(EIXIDA.ARBRE, `hi ha ${unic.length} APK ${versio}+${apkDirectBuild} a _builds_de_poble/android/: n'hi ha d'haver un, el que ha publicat --publica-apk`);
    else {
      const suma = sha256DeFitxer(publicat);
      const llig = (fitxer) => { try { return fs.readFileSync(fitxer, 'utf8').trim().split(/\s+/)[0].toLowerCase(); } catch { return ''; } };
      if (llig(`${publicat}.sha256`) !== suma) mal(EIXIDA.VERIFICACIO, `dist/descarregues/${NOM_APK_PUBLIC} no casa amb el seu .sha256: torna a ${ORDRE_PUBLICA_APK}`);
      else if (sha256DeFitxer(unic[0]) !== suma || llig(`${unic[0]}.sha256`) !== suma) {
        mal(EIXIDA.VERIFICACIO, `l’APK publicat no és ${path.basename(unic[0])} (o este no casa amb el seu .sha256): el build ${apkDirectBuild} no es pot anunciar amb este fitxer`);
      } else {
        let signatura = null;
        try { signatura = await empremta(publicat); } catch { signatura = null; }
        if (!signatura) mal(EIXIDA.VERIFICACIO, 'apksigner no ha pogut verificar la signatura de l’APK publicat: no s’anuncia');
        else if (signatura !== esperada) mal(EIXIDA.VERIFICACIO, 'l’APK publicat està signat amb una clau diferent de SDP_ANDROID_UPLOAD_CERT_SHA256: no s’anuncia');
        else if (sha256DeFitxer(publicat) !== suma) mal(EIXIDA.VERIFICACIO, 'l’APK publicat ha canviat mentre es verificava: no s’anuncia');
        else {
          apkSha256 = suma;
          avisos.push(`dist/descarregues/${NOM_APK_PUBLIC} és ${path.basename(unic[0])} (SHA-256 ${suma}), signat amb la clau de pujada`);
        }
      }
    }
  }
  return { codi, problemes, avisos, apkSha256 };
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
 * @param {{ env?: object, play?: object, manifest?: string|null, manifestDist?: string|null, proves?: object }} [dependencies]
 *   Només per a les proves: l'entorn (SDP_BOTIGUES_ENV), les opcions del client de Google Play (adreces locals), la
 *   ruta d'un ard.json temporal (i la de la seua còpia de dist/, per a --sincronitza-proves) i les dependències de
 *   comprovaProves (la carpeta dels APK i la verificació de la signatura).
 */
export async function main(argv = process.argv.slice(2), { env = process.env, play = {}, manifest = null, manifestDist = null, proves = {} } = {}) {
  const { opcions, errors } = analitzaArguments(argv, ADMESOS);
  if (opcions.ajuda) {
    process.stdout.write(`node scripts/botigues/publica-tot.mjs ${US.slice(4)}\n`);
    return EIXIDA.BE;
  }
  if (errors.length) return plega(EIXIDA.US, US, errors);

  const arrel = arrelComprovada();
  if (!arrel) return plega(EIXIDA.EINA, 'git no reconeix l’arrel del repositori');

  /* v1.2.7 · P0-123 · Els canals de proves, una ordre sola: després de puja-ios.mjs (TestFlight) i/o
     després de --publica-apk (l'APK directe). Res s'escriu fins que totes les guardes passen. */
  if (opcions['sincronitza-proves']) {
    const admesos = new Set(['sincronitza-proves', 'versio', 'build-testflight', 'build-apk', 'corregeix-ard']);
    const sobren = Object.keys(opcions).filter((nom) => !admesos.has(nom));
    if (sobren.length) return plega(EIXIDA.US, `--sincronitza-proves només va amb --versio, --build-testflight, --build-apk i --corregeix-ard (sobren: ${sobren.map((n) => `--${n}`).join(', ')})`);
    const bo = (nom) => opcions[nom] === undefined || BUILD.test(String(opcions[nom]));
    if (!VERSIO.test(String(opcions.versio ?? '')) || !bo('build-testflight') || !bo('build-apk')
        || (opcions['build-testflight'] === undefined && opcions['build-apk'] === undefined)) {
      return plega(EIXIDA.US, 'cal --versio X.Y.Z explícita i --build-testflight M (iOS, TestFlight) i/o --build-apk N (Android, l’APK directe publicat)');
    }
    const corregeix = Boolean(opcions['corregeix-ard']);
    const builds = { testflightIosBuild: opcions['build-testflight'] ?? null, apkDirectBuild: opcions['build-apk'] ?? null };
    const camins = manifest ? { cami: manifest, camiDist: manifestDist } : {};
    // 1. Les guardes pures, en sec, abans de llegir cap entorn (la suma de l'APK encara no se sap).
    const assaig = escriuManifestProves({ arrel, versio: opcions.versio, ...builds, senseSuma: true, corregeix, ...camins, sec: true });
    if (assaig.codi !== EIXIDA.BE) return plega(assaig.codi, `${assaig.error}: ard.json no canvia`);
    const entorn = carregaEntorn({ arrel, env });
    if (entorn.codi !== EIXIDA.BE) return plega(entorn.codi, 'El fitxer d\'entorn no deixa seguir: no es fa res.', entorn.problemes);
    const { valors } = entorn;
    const net = (text) => emmascara(text, valors, arrel);
    // 2. L'evidència de cada canal: el registre de pujades d'iOS (amb l'iosBuild que ja publica ard.json, P0123-02) i l'APK publicat a dist/.
    const iosBuildPublicat = iosBuildDelManifest(camins.cami ?? path.join(arrel, ...MANIFEST_VERSIO));
    const evidencia = await comprovaProves({ arrel, valors, versio: opcions.versio, ...builds, iosBuildPublicat, jdkHome: jdkPerAGradle({ env })?.home ?? null, ...proves });
    for (const avis of evidencia.avisos) process.stdout.write(`  · ${net(avis)}\n`);
    if (evidencia.codi !== EIXIDA.BE) return plega(evidencia.codi, 'ard.json no canvia: l’App avisaria d’un build que el canal de proves encara no dona.', evidencia.problemes.map(net));
    // 3. L'escriptura (atòmica), amb la suma del fitxer publicat i totes les guardes de nou.
    const res = escriuManifestProves({ arrel, versio: opcions.versio, ...builds, apkSha256: evidencia.apkSha256, corregeix, ...camins });
    if (res.codi !== EIXIDA.BE) return plega(res.codi, `${res.error}: ard.json no canvia`);
    const dits = [
      builds.testflightIosBuild !== null ? `testflightIosBuild ${builds.testflightIosBuild}` : null,
      builds.apkDirectBuild !== null ? `apkDirectBuild ${builds.apkDirectBuild} (SHA-256 ${evidencia.apkSha256})` : null
    ].filter(Boolean).join(', ');
    if (corregeix && res.canviat) process.stdout.write('! --corregeix-ard: el manifest s\'ha corregit a mà (pot baixar); anota-ho al rebut del desplegament\n');
    process.stdout.write(`✓ ${res.canviat ? res.escrits.join(' i ') : MANIFEST_VERSIO.join('/')}: version ${opcions.versio}, ${dits}${res.canviat ? '' : ' (ja hi era)'}\n`);
    process.stdout.write(builds.apkDirectBuild !== null
      ? '  Ara l’rsync de dist/ al Node 0 (l’APK) i DESPRÉS firebase deploy (el manifest): mai al revés. L’anunci de l’APK només és a dist/: cap npm run build entremig (el retiraria amb l’APK).\n'
      : '  El desplegament web següent el publica (npm run build copia public/ a dist/).\n');
    return EIXIDA.BE;
  }
  if (opcions['build-testflight'] !== undefined || opcions['build-apk'] !== undefined) {
    return plega(EIXIDA.US, '--build-testflight i --build-apk només van amb --sincronitza-proves');
  }

  /* R32.3 · Les dues accions de publicació, cada una sola (sense plataforma, canal ni pujada).
     Elefant R32.3 (Peix silent_failure_hunter, P2) · Mai juntes: el manifest viu a public/ i el build el
     copia a dist/, així que --sincronitza-ard va ABANS de npm run build; l'APK va a dist/, DESPRÉS del
     build i abans de l'rsync de dist/ al Node 0 (Onada v1.2.6: Firebase no el puja i hi redirigix).
     Cap de les dues escriu res fins que totes les guardes passen. */
  if (opcions['publica-apk'] || opcions['sincronitza-ard']) {
    const admesos = new Set(['publica-apk', 'sincronitza-ard', 'versio', 'build', 'build-ios', 'corregeix-ard']);
    const sobren = Object.keys(opcions).filter((nom) => !admesos.has(nom));
    if (sobren.length) return plega(EIXIDA.US, `--publica-apk i --sincronitza-ard només van amb --versio, --build, --build-ios i --corregeix-ard (sobren: ${sobren.map((n) => `--${n}`).join(', ')})`);
    if (opcions['publica-apk'] && opcions['sincronitza-ard']) {
      return plega(EIXIDA.US, '--publica-apk i --sincronitza-ard van en ordres a banda: el manifest (public/) abans de npm run build; l’APK (dist/) després del build i abans de l’rsync de dist/ al Node 0');
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
    process.stdout.write(`✓ dist/descarregues/${NOM_APK_PUBLIC} ← ${res.origen} (${res.octets} B, SHA-256: ${res.sha256}; signatura de la clau de pujada verificada)\n`);
    process.stdout.write(`  Ara l’rsync de dist/ al Node 0 (socdepoble.cat), que és qui el servix: Firebase no el puja (hosting.ignore) i /descarregues/${NOM_APK_PUBLIC} hi redirigix (302).\n`);
    process.stdout.write('  ! L’APK directe va signat amb la clau de PUJADA: si Google Play reparteix amb una altra (App Signing), un mòbil amb este APK no s’actualitza des de Play sense desinstal·lar (D-R32.3-PLAY-3).\n');
    // v1.2.7 · P0-123 · Perquè les Apps d'instal·lació directa ho sàpien (abans de l'rsync i de firebase deploy).
    process.stdout.write(`  Perquè les Apps d’instal·lació directa ho sàpien, abans de l’rsync i de firebase deploy: ${ORDRE_SINCRONITZA_PROVES} --versio ${opcions.versio} --build-apk ${opcions.build}\n`);
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
    process.stdout.write(`  Per a publicar-lo a /descarregues/${NOM_APK_PUBLIC}: després de «npm run build» i abans de l’rsync de dist/ al Node 0 (socdepoble.cat), ${ORDRE_PUBLICA_APK} --versio ${versio} --build ${build}\n`);
  }

  return EIXIDA.BE;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then((codi) => { process.exitCode = codi; });
}
