/**
 * scripts/botigues/preflight.mjs — comprovacions prèvies a qualsevol pujada (261003).
 *
 * Instal·lat el 261019 (Fase C) des de nous/botigues/preflight.mjs.txt del laboratori
 * 261003_1330_empaquetat_mobil_claude. Proves: tests/botigues.test.mjs i, per al canal de producció
 * i els avisos push (B9, marató 261101_2143), tests/botigues.produccio.test.js.
 *
 *   node scripts/botigues/preflight.mjs --plataforma ios|android|totes [--signa] [--canal intern|produccio] [--push]
 *   node scripts/botigues/preflight.mjs --estat     (Onada R9: l'estat honest, fora de línia; scripts/botigues/estat.mjs)
 *
 * Només llig: el fitxer d'entorn (mai n'imprimix cap valor), les rutes que nomena, les eines i
 * l'estat de l'arbre (amb iOS, també que cap fitxer porte el SDK de Facebook: P1-08, 261028).
 * No compila, no signa i no puja res. Ix amb el codi de la primera família
 * que falla, en este ordre: fitxer (3), variable prohibida (4), variable o fitxer que falta (5),
 * eina (6), arbre (7). Els codis són a entorn.mjs (EIXIDA). L'arbre inclou el segell de dist-natiu/
 * (BOT-A4, 261025): el paquet ha d'eixir del commit de HEAD, amb l'arbre net.
 * B9 · «Avisos push» (davall d'«Arbre», amb el codi 7): connector, aps-environment, reenviament de
 * l'AppDelegate, google-services.json i POST_NOTIFICATIONS; sense connector ni --push no cal res.
 * --canal produccio exigix SDP_BUILDS_DIR (el registre de pujades) i afig avisos de botiga.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  CANALS, EIXIDA, JDK_MAXIM, JDK_MINIM, SEGELL, analitzaArguments, arbreNet, arrelDelRepositori, carregaEntorn, commitDeHead,
  comprovaVariables, gitIgnora, jdkPerAGradle, llegixAjuda, llegixSegell, mateixContingut, mostraCami, plega, problemesDelSegell
} from './entorn.mjs';
import { estatDeLesBotigues, liniesDeLEstat } from './estat.mjs';

/** L'arrel on viu el script instal·lat: scripts/botigues/ → dos nivells amunt. */
export const ARREL_DEL_SCRIPT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/* Les eines de cada plataforma i com es comprova que hi són. fastlane és opcional (Android
   sense fastlane imprimix els passos per a fer-ho a mà). */
const EINES = Object.freeze({
  ios: [['xcodebuild', ['-version']], ['xcrun', ['altool', '--help']], ['codesign', ['-h']], ['plutil', ['-help']]],
  android: [['keytool', ['-help']]]
});

/** El projecte iOS: l'espai de treball si n'hi ha (CocoaPods), si no el projecte (SPM, Capacitor 8).
    [VERIFICAT 261019: la plantilla ios-spm-template de @capacitor/cli 8.5.3 porta App/App.xcodeproj i
    cap App.xcworkspace, i «cap build ios» (dist/ios/build.js:16-22) tria igual, -project amb SPM.] */
export function projecteIos(arrel) {
  const espai = path.join(arrel, 'ios', 'App', 'App.xcworkspace');
  if (fs.existsSync(espai)) return { opcio: '-workspace', cami: espai };
  const projecte = path.join(arrel, 'ios', 'App', 'App.xcodeproj');
  return fs.existsSync(projecte) ? { opcio: '-project', cami: projecte } : null;
}

/* On deixa Capacitor la còpia de dist-natiu/ de cada plataforma (FASES §4) [VERIFICAT 261019 a
   @capacitor/cli 8.5.3, dist/config.js: Android, app/src/main/assets/public (:172-176); iOS,
   App/App/public (:228-230 i :306), llevat d'un projecte antic amb public a l'arrel d'ios/App; i la
   còpia és byte a byte, sense tocar l'index.html (dist/tasks/copy.js:134-146)]. */
const COPIA_NATIVA = Object.freeze({
  ios: ['ios', 'App', 'App', 'public', 'index.html'],
  android: ['android', 'app', 'src', 'main', 'assets', 'public', 'index.html']
});

/* P1-08 (pla 261028_1526, §3.6.2) · El SDK de Facebook per a iOS, amb els noms d'SPM i de
   CocoaPods. Sóc de Poble no l'enllaça: només Google i Apple. El connector social de capgo el porta
   comentat al seu Package.swift («Disabled via config») i el ganxo capacitor:sync:before el
   descomenta si capacitor.config.json no apaga facebook (sense la clau, capgo l'encén): d'eixe
   fitxer es mira el codi sense comentaris, i de capacitor.config.json, el proveïdor. La mateixa
   sentinella, en precommit: src/natiu/projecteIos.test.js. */
export const SDK_FACEBOOK = /facebook-ios-sdk|FBSDK[A-Za-z]*|\bFacebook(?:Core|Login|AEM|Share|Gaming|Basics)|\bFBAEMKit\b/i;
const FITXERS_DEL_SDK = Object.freeze([
  { trossos: ['ios', 'App', 'App.xcodeproj', 'project.pbxproj'] },
  { trossos: ['ios', 'App', 'CapApp-SPM', 'Package.swift'] },
  { trossos: ['ios', 'App', 'App.xcodeproj', 'project.xcworkspace', 'xcshareddata', 'swiftpm', 'Package.resolved'] },
  { trossos: ['ios', 'App', 'App.xcworkspace', 'xcshareddata', 'swiftpm', 'Package.resolved'] },
  { trossos: ['ios', 'App', 'Podfile'] },
  { trossos: ['ios', 'App', 'Podfile.lock'] },
  { trossos: ['node_modules', '@capgo', 'capacitor-social-login', 'Package.swift'], senseComentaris: true }
]);
/* Els comentaris de Swift fora («//» dins d'una URL entre cometes no és cap comentari). */
const senseComentarisSwift = (codi) => codi.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(?<![:"])\/\/[^\n]*/g, '');

/* Capacitor llig capacitor.config.ts, després .js i només sense cap dels dos .json (@capacitor/cli,
   config.js · loadExtConfig). Esta sentinella no avalua cap .ts ni .js: si n'hi ha un, compta. */
const CONFIGS_QUE_PASSEN_DAVANT = Object.freeze(['capacitor.config.ts', 'capacitor.config.js']);

/** Els camins (relatius a l'arrel, amb «/») que porten el SDK de Facebook a l'app d'iOS, en l'ordre
 *  de FITXERS_DEL_SDK; després, el capacitor.config.ts o .js que passaria davant del .json, i
 *  capacitor.config.json si, amb el connector social instal·lat o configurat, no apaga facebook o
 *  no hi és (sense config, capgo l'encén); [] si cap. Un fitxer del SDK que no hi és no compta; un
 *  capacitor.config.json il·legible, sí. Només llig. */
export function sdkFacebookIos(arrel) {
  const trobats = FITXERS_DEL_SDK.filter(({ trossos, senseComentaris }) => {
    const cami = path.join(arrel, ...trossos);
    if (!fs.existsSync(cami)) return false;
    const text = fs.readFileSync(cami, 'utf8');
    return SDK_FACEBOOK.test(senseComentaris ? senseComentarisSwift(text) : text);
  }).map(({ trossos }) => trossos.join('/'));
  const davant = CONFIGS_QUE_PASSEN_DAVANT.filter((nom) => fs.existsSync(path.join(arrel, nom)));
  trobats.push(...davant);
  const config = path.join(arrel, 'capacitor.config.json');
  const connector = fs.existsSync(path.join(arrel, 'node_modules', '@capgo', 'capacitor-social-login'));
  if (fs.existsSync(config)) {
    let social = null;
    try { social = JSON.parse(fs.readFileSync(config, 'utf8'))?.plugins?.SocialLogin ?? null; } catch { social = { illegible: true }; }
    if ((social || connector) && social?.providers?.facebook !== false) trobats.push('capacitor.config.json');
  } else if (connector && !davant.length) trobats.push('capacitor.config.json');
  return trobats;
}

/* ───────────── B9 · Avisos push (marató 261101_2143, spec B9-BOTIGUES §3.1.2) ─────────────
   Sense connector ni --push no cal aps-environment ni FCM. Amb el connector present,
   cada peça que falte és un ✗
   de la família de l'arbre (7). Només llig, i de google-services.json no ix mai cap valor. */
export const PAQUET_PUSH = '@capacitor/push-notifications';
export const PRODUCTE_SPM_PUSH = 'CapacitorPushNotifications';
export const PROJECTE_GRADLE_PUSH = ':capacitor-push-notifications';
const PERMIS_D_AVISOS = 'android.permission.POST_NOTIFICATIONS';

const lligDe = (arrel, ...trossos) => { try { return fs.readFileSync(path.join(arrel, ...trossos), 'utf8'); } catch { return null; } };
/* Els comentaris d'XML fora, en una passada (sense regex: cap retrocés amb un «<!--» sense tancar). */
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
const codiSwift = (text) => senseComentarisSwift(String(text ?? ''));

/* Els manifests dels connectors que inclou android/capacitor.settings.gradle (l'escriu cap sync). */
function manifestsDeConnectors(arrel) {
  const settings = codiSwift(lligDe(arrel, 'android', 'capacitor.settings.gradle'));
  return [...settings.matchAll(/projectDir = new File\('([^']+)'\)/g)]
    .map(([, rel]) => path.join(path.resolve(arrel, 'android', rel), 'src', 'main', 'AndroidManifest.xml'))
    .filter((manifest) => fs.existsSync(manifest));
}

/* Les etiquetes <uses-permission …> d'un manifest, sense comentaris: el nom i si l'app el lleva. */
function permisosDe(text) {
  return [...senseComentarisXml(text).matchAll(/<uses-permission\b[^>]*>/g)].map(([etiqueta]) => ({
    nom: /android:name="([^"]*)"/.exec(etiqueta)?.[1] ?? null,
    lleva: /tools:node="remove"/.test(etiqueta)
  }));
}

/**
 * L'estat dels avisos push al projecte natiu. Només llig; de google-services.json només diu si hi
 * és, si git l'ignora i si és del paquet de capacitor.config.json, mai cap valor.
 * @returns {{ connector:{paquet:boolean, ios:boolean, android:boolean},
 *   ios:{apsEnvironment:string|null, reenviaRegistre:boolean},
 *   android:{postNotifications:boolean, googleServices:{hiEs:boolean, ignorat:boolean|null, delPaquet:boolean|null}, connectorGoogleServices:boolean} }}
 */
export function estatDelPush(arrel) {
  let paquet = false;
  try { paquet = Boolean(JSON.parse(lligDe(arrel, 'package.json') ?? '{}')?.dependencies?.[PAQUET_PUSH]); } catch { paquet = false; }
  const ios = codiSwift(lligDe(arrel, 'ios', 'App', 'CapApp-SPM', 'Package.swift')).includes(PRODUCTE_SPM_PUSH);
  const android = codiSwift(lligDe(arrel, 'android', 'capacitor.settings.gradle')).includes(`'${PROJECTE_GRADLE_PUSH}'`);
  /* ARB-B9-05 · El connector oficial necessita que l'AppDelegate reenvie el testimoni d'APNs a
     Capacitor (CAPNotifications.swift només definix els noms; el nucli no els publica). Un
     reenviament comentat no compta. La detecció és per text, no per compilació. */
  const delegat = codiSwift(lligDe(arrel, 'ios', 'App', 'App', 'AppDelegate.swift'));
  const reenviaRegistre = ['didRegisterForRemoteNotificationsWithDeviceToken', '.capacitorDidRegisterForRemoteNotifications',
    'didFailToRegisterForRemoteNotificationsWithError', '.capacitorDidFailToRegisterForRemoteNotifications'].every((nom) => delegat.includes(nom));
  const drets = lligDe(arrel, 'ios', 'App', 'App', 'App.entitlements');
  const apsEnvironment = drets === null ? null : (/<key>aps-environment<\/key>\s*<string>([a-z]+)<\/string>/.exec(senseComentarisXml(drets))?.[1] ?? null);
  const delApp = permisosDe(lligDe(arrel, 'android', 'app', 'src', 'main', 'AndroidManifest.xml'));
  const lleva = delApp.some((p) => p.nom === PERMIS_D_AVISOS && p.lleva);
  const declarat = [...delApp, ...manifestsDeConnectors(arrel).flatMap((manifest) => permisosDe(lligDe(manifest)))]
    .some((p) => p.nom === PERMIS_D_AVISOS && !p.lleva);
  const fitxerGs = path.join(arrel, 'android', 'app', 'google-services.json');
  let googleServices = { hiEs: false, ignorat: null, delPaquet: null };
  if (fs.existsSync(fitxerGs)) {
    let appId = null;
    try { appId = JSON.parse(lligDe(arrel, 'capacitor.config.json') ?? '{}')?.appId ?? null; } catch { appId = null; }
    let delPaquet = false;
    try {
      const clients = JSON.parse(fs.readFileSync(fitxerGs, 'utf8'))?.client;
      delPaquet = Boolean(appId) && Array.isArray(clients) && clients.some((c) => c?.client_info?.android_client_info?.package_name === appId);
    } catch { delPaquet = false; }
    googleServices = { hiEs: true, ignorat: gitIgnora(arrel, fitxerGs), delPaquet };
  }
  const gradle = codiSwift(lligDe(arrel, 'android', 'app', 'build.gradle'));
  return {
    connector: { paquet, ios, android },
    ios: { apsEnvironment, reenviaRegistre },
    android: {
      postNotifications: declarat && !lleva,
      googleServices,
      connectorGoogleServices: /apply plugin:\s*'com\.google\.gms\.google-services'/.test(gradle)
    }
  };
}

/**
 * Les línies (✓, ! i ✗) de la família «Avisos push» per a estes plataformes. Pura. `mal` porta els ✗.
 * @returns {{ linies: string[], mal: string[] }}
 */
export function liniesDelPush(estat, { push = false, plataformes = [] } = {}) {
  const linies = [];
  const mal = [];
  const be = (text) => linies.push(`  ✓ ${text}`);
  const avis = (text) => linies.push(`  ! ${text}`);
  const falla = (text) => { linies.push(`  ✗ ${text}`); mal.push(text); };
  const { connector } = estat;
  const ambIos = plataformes.includes('ios');
  const ambAndroid = plataformes.includes('android');
  if (!(connector.paquet || connector.ios || connector.android)) {
    if (push) falla(`--push: el connector ${PAQUET_PUSH} no és al projecte (package.json, ios/App/CapApp-SPM/Package.swift ni android/capacitor.settings.gradle); instal·lar-lo és decisió del Mestre (D-WP-7) i després npx cap sync`);
    else be('push: l\'app no porta cap connector d\'avisos remots (B8 en fase N1): ni aps-environment ni FCM no calen per a esta pujada');
    /* D-B9-17 · Un App ID amb Push i el dret és vàlid; si el perfil no el porta, xcodebuild para (8) sense pujar res. */
    if (ambIos && estat.ios.apsEnvironment) avis('ios/App/App/App.entitlements porta aps-environment sense connector: el perfil de distribució ha de tindre Push Notifications; si l\'App ID no la té, l\'arxiu fallarà en signar (eixida 8)');
    return { linies, mal };
  }
  if (!push) avis('el projecte porta el connector d\'avisos remots: es comprova com amb --push');
  if (!connector.paquet) falla(`el connector d'avisos remots és als projectes natius però no a package.json (${PAQUET_PUSH}): npx cap sync`);
  if (connector.paquet && ambIos && !connector.ios) falla(`${PAQUET_PUSH} és a package.json però no a ios/App/CapApp-SPM/Package.swift: npx cap sync ios`);
  if (connector.paquet && ambAndroid && !connector.android) falla(`${PAQUET_PUSH} és a package.json però no a android/capacitor.settings.gradle: npx cap sync android`);
  if (ambIos) {
    /* A la font s'admeten development i production: Xcode el posa en production en exportar per a
       l'App Store, i puja-ios el comprova dins de l'IPA. */
    if (!estat.ios.apsEnvironment) falla('ios/App/App/App.entitlements no porta aps-environment: Xcode › Signing & Capabilities › Push Notifications (i la capacitat a l\'App ID)');
    else be(`aps-environment ${estat.ios.apsEnvironment} a App.entitlements (l'IPA de l'App Store l'ha de portar en production: es mira després d'exportar)`);
    if (!estat.ios.reenviaRegistre) falla('ios/App/App/AppDelegate.swift no reenvia el registre d\'APNs a Capacitor (didRegisterForRemoteNotificationsWithDeviceToken → .capacitorDidRegisterForRemoteNotifications, i el de fallada): l\'esdeveniment registration no arribaria mai');
    else be('AppDelegate.swift reenvia el registre d\'APNs a Capacitor');
  }
  if (ambAndroid) {
    const gs = estat.android.googleServices;
    if (!gs.hiEs) falla('falta android/app/google-services.json (Firebase › configuració del projecte; git l\'ignora)');
    else if (gs.ignorat !== true) falla('android/app/google-services.json: git no l\'ignora (o no s\'ha pogut comprovar), i no es versiona');
    else if (!gs.delPaquet) falla('android/app/google-services.json no és del paquet de capacitor.config.json');
    else be('google-services.json del paquet de l\'app, ignorat per git');
    if (!estat.android.connectorGoogleServices) falla('android/app/build.gradle no aplica com.google.gms.google-services');
    if (!estat.android.postNotifications) falla('cap manifest declara android.permission.POST_NOTIFICATIONS (o l\'app el lleva amb tools:node="remove"): Android 13 o més nou no mostraria cap avís');
    else be('POST_NOTIFICATIONS declarat i no llevat');
  }
  return { linies, mal };
}

/* Google Play, termini 31-08-2026: API36 per a apps noves/actualitzacions.
   Font contrastada per l'auditoria O4 (02-11-2026):
   https://support.google.com/googleplay/android-developer/answer/11926878
   És un mínim: una API superior no produïx un avís fals. */
export const TARGET_SDK_PLAY_MINIM = 36;

/* No executa Groovy. Amaga comentaris i cadenes (també triples), conservant
   salts de línia perquè un exemple de target no compte com a declaració. */
function codiGradle(text) {
  const font=String(text??''), parts=[];
  let i=0;
  while(i<font.length) {
    const inici=i;
    if(font.startsWith('//',i)) {
      while(i<font.length&&font[i]!=='\n')i++;
    } else if(font.startsWith('/*',i)) {
      const fi=font.indexOf('*/',i+2);i=fi<0?font.length:fi+2;
    } else if(font[i]==="'"||font[i]==='"') {
      const q=font[i],delimitador=font.startsWith(q.repeat(3),i)?q.repeat(3):q;
      i+=delimitador.length;
      while(i<font.length) {
        if(font[i]==='\\') {i=Math.min(font.length,i+2);continue;}
        if(font.startsWith(delimitador,i)) {i+=delimitador.length;break;}
        i++;
      }
    } else if(font[i]==='/') {
      // Slashy, dollar-slashy o divisió: fora del subset, no és evidència.
      return null;
    } else {parts.push(font[i++]);continue;}
    parts.push(font.slice(inici,i).replace(/[^\n]/g,' '));
  }
  return parts.join('');
}

function blocGradle(codi,nom) {
  if(typeof codi!=='string')return null;
  const troballes=[...codi.matchAll(new RegExp(`\\b${nom}\\s*\\{`,'g'))];
  if(troballes.length!==1)return null;
  const inici=troballes[0].index+troballes[0][0].length;
  let profunditat=1;
  for(let i=inici;i<codi.length;i++) {
    if(codi[i]==='{')profunditat++;
    if(codi[i]==='}'&&--profunditat===0)return {codi:codi.slice(inici,i),inici:troballes[0].index,fi:i+1};
  }
  return null;
}

/* Subset explícit de la configuració usada pel projecte: un android/defaultConfig
   i un target literal o rootProject.ext.<nom> numèric a variables.gradle.
   Expressions, flavors i altres sobreescriptures requerixen el manifest final. */
export function targetSdkAndroid(arrel) {
  const app=codiGradle(lligDe(arrel,'android','app','build.gradle'));
  if(app===null||/\b(?:productFlavors|applicationVariants|androidComponents|afterEvaluate)\b/.test(app))return null;
  const android=blocGradle(app,'android');
  if(android===null)return null;
  const foraAndroid=app.slice(0,android.inici)+app.slice(android.fi);
  if(/\b(?:android|defaultConfig|targetSdk(?:Version)?)\b/.test(foraAndroid))return null;
  const config=blocGradle(android.codi,'defaultConfig');
  if(config===null)return null;
  const foraConfig=android.codi.slice(0,config.inici)+android.codi.slice(config.fi);
  if(/\b(?:defaultConfig|targetSdk(?:Version)?)\b/.test(foraConfig))return null;
  const objectius=[...config.codi.matchAll(/(?:^|[;\n])\s*targetSdk(?:Version)?\s*(?:=\s*)?([^;\n]+?)\s*(?=;|\n|$)/g)];
  if(objectius.length!==1)return null;
  const foraObjectiu=config.codi.slice(0,objectius[0].index)+config.codi.slice(objectius[0].index+objectius[0][0].length);
  if(/\btargetSdk(?:Version)?\b/.test(foraObjectiu))return null;
  const abans=config.codi.slice(0,objectius[0].index);
  if((abans.match(/\{/g)||[]).length!==(abans.match(/\}/g)||[]).length)return null;
  const expressio=objectius[0][1].trim().replace(/^\(\s*(.*?)\s*\)$/,'$1');
  let valor=/^\d+$/.test(expressio)?expressio:null;
  const referencia=/^rootProject\.ext\.([a-zA-Z_][a-zA-Z0-9_]*)$/.exec(expressio);
  if(referencia) {
    const variables=codiGradle(lligDe(arrel,'android','variables.gradle'));
    const ext=blocGradle(variables,'ext');
    if(ext===null)return null;
    const foraExt=variables.slice(0,ext.inici)+variables.slice(ext.fi);
    if(new RegExp(`\\b${referencia[1]}\\b`).test(foraExt))return null;
    const valors=[...ext.codi.matchAll(new RegExp(`(?:^|[;\\n])\\s*${referencia[1]}\\s*=\\s*(\\d+)\\s*(?=;|\\n|$)`,'g'))];
    if(valors.length!==1)return null;
    const foraValor=ext.codi.slice(0,valors[0].index)+ext.codi.slice(valors[0].index+valors[0][0].length);
    if(new RegExp(`\\b${referencia[1]}\\b`).test(foraValor))return null;
    const abansValor=ext.codi.slice(0,valors[0].index);
    if((abansValor.match(/\{/g)||[]).length!==(abansValor.match(/\}/g)||[]).length)return null;
    valor=valors[0][1];
  }
  const api=valor===null?NaN:Number(valor);
  return Number.isSafeInteger(api)&&api>0?api:null;
}

/**
 * Avisos de botiga per a --canal produccio. Només llig i no para res: cap llindar no s'ha verificat
 * contra les botigues en execució. El mínim API és el contrast documental O4,
 * no una consulta al compte de Play ni una prova de l'AAB final.
 * @returns {string[]}
 */
export function avisosDeProduccio(arrel, plataformes = []) {
  const avisos = [];
  if (plataformes.includes('ios')) {
    const plist = senseComentarisXml(lligDe(arrel, 'ios', 'App', 'App', 'Info.plist'));
    if (plist.includes('com.googleusercontent.apps.pendent')) {
      avisos.push('Info.plist porta l\'esquema de Google de reserva (com.googleusercontent.apps.pendent): l\'iPhone no oferirà l\'entrada amb Google fins que el Mestre hi pose el client d\'iOS');
    }
    if (!/<key>ITSAppUsesNonExemptEncryption<\/key>\s*<false\s*\/>/.test(plist)) {
      avisos.push('Info.plist no diu ITSAppUsesNonExemptEncryption = false: App Store Connect preguntarà la conformitat de xifratge a cada build');
    }
    const families = [...String(lligDe(arrel, 'ios', 'App', 'App.xcodeproj', 'project.pbxproj') ?? '').matchAll(/TARGETED_DEVICE_FAMILY = "?([0-9,]+)"?;/g)]
      .flatMap(([, valor]) => valor.split(','));
    if (families.includes('2')) avisos.push('TARGETED_DEVICE_FAMILY porta l\'iPad (2): la fitxa de l\'App Store necessita captures d\'iPad (D-4)');
    avisos.push('enviar la versió a App Review i publicar-la és del Mestre a App Store Connect (RUNBOOK P9 i S6): el script només puja la build');
  }
  if (plataformes.includes('android')) {
    const objectiu = targetSdkAndroid(arrel);
    if (objectiu === null) avisos.push('no es pot resoldre el targetSdkVersion efectiu de android/app/build.gradle: cal contrastar la configuració i el manifest final de l’AAB');
    else if (objectiu < TARGET_SDK_PLAY_MINIM) avisos.push(`targetSdkVersion ${objectiu} és més baix que ${TARGET_SDK_PLAY_MINIM}: Play pot rebutjar l'AAB`);
    avisos.push('un compte personal de Play Console només publica a producció després de la prova tancada (12 provadors durant 14 dies, P0-23) o amb un compte d\'organització (D-B9-2): sense eixe accés, --validate_only pararà amb l\'eixida 8 i no es pujarà res');
  }
  return avisos;
}

/* Les dues consultes a eines de fora que fa el preflight. Les proves les canvien per unes de
   fingides, perquè la suite no arranque cap eina (ni fastlane, ni keytool, ni cap JDK). */
const CONSULTES = Object.freeze({ llegixAjuda, jdkPerAGradle });

/**
 * Totes les comprovacions d'una o dues plataformes. No llança i no imprimix valors.
 * @param {{ arrel: string, plataformes: ('ios'|'android')[], signa?: boolean, env?: object, consultes?: object,
 *   canal?: 'intern'|'produccio', push?: boolean }} opcions
 * @returns {{ codi:number, linies:string[], valors:Record<string,string>, fastlane:boolean, jdk:{home:string, major:number}|null,
 *   segell:{commit:string, arbreNet:boolean, data:string}|null, push:{anuncia:boolean, estat:object} }} `segell`, el de
 *   dist-natiu/ tal com es llig (val per al rebut només si `codi` és EIXIDA.BE); `push.anuncia`, si l'app anuncia avisos
 *   remots (connector o --push): puja-ios hi lliga l'aps-environment de l'IPA
 */
export function preflight({ arrel, plataformes, signa = false, env = process.env, consultes = {}, canal = CANALS.INTERN, push = false }) {
  const { llegixAjuda: ajuda, jdkPerAGradle: jdkDe } = { ...CONSULTES, ...consultes };
  const linies = [];
  const familia = { [EIXIDA.FITXER]: false, [EIXIDA.PROHIBIDA]: false, [EIXIDA.FALTA]: false, [EIXIDA.EINA]: false, [EIXIDA.ARBRE]: false };
  const be = (text) => linies.push(`  ✓ ${text}`);
  const mal = (codi, text) => { familia[codi] = true; linies.push(`  ✗ ${text}`); };
  const avis = (text) => linies.push(`  ! ${text}`);

  linies.push('Fitxer d\'entorn');
  const entorn = carregaEntorn({ arrel, env });
  if (entorn.codi === EIXIDA.BE) be(`${mostraCami(arrel, entorn.cami)}: ${Object.keys(entorn.valors).length} variables, cap VITE_*, cap clau escrita, permisos 600`);
  else for (const problema of entorn.problemes) mal(entorn.codi, problema);
  for (const text of entorn.avisos) avis(text);

  linies.push('Variables i fitxers que nomena');
  const produccio = canal === CANALS.PRODUCCIO;
  const contextos = [...plataformes, ...(signa ? ['android-signa'] : []), ...(produccio ? ['produccio'] : [])];
  if (entorn.codi === EIXIDA.BE) {
    const variables = comprovaVariables({ arrel, valors: entorn.valors, contextos });
    if (variables.codi === EIXIDA.BE) be(`les de ${contextos.join(', ')} hi són, i les claus i carpetes són fora del repositori`);
    else for (const problema of variables.problemes) mal(EIXIDA.FALTA, problema);
  } else {
    avis('no es miren fins que el fitxer d\'entorn estiga bé');
  }

  linies.push('Eines');
  const presents = [['git', ['--version']], ...plataformes.flatMap((p) => EINES[p])];
  for (const [ordre, args] of presents) {
    if (ajuda(ordre, args) === null) mal(EIXIDA.EINA, `no es troba ${ordre}`);
    else be(ordre);
  }
  const fastlane = plataformes.includes('android') && ajuda('fastlane', ['--version']) !== null;
  if (plataformes.includes('android')) {
    if (fastlane) be('fastlane (pujada per API a Google Play)');
    else avis('no hi ha fastlane: la pujada a Google Play es farà a mà (el script imprimirà els passos)');
  }
  /* Gradle només corre amb --compila (--signa ací): sense eixe JDK, només és un avís. */
  const jdk = plataformes.includes('android') ? jdkDe({ env }) : null;
  if (plataformes.includes('android')) {
    const rang = `JDK del ${JDK_MINIM} al ${JDK_MAXIM}`;
    const javaHome = String(env.JAVA_HOME ?? '').trim();
    if (jdk) be(`JDK ${jdk.major} per a Gradle: ${mostraCami(arrel, jdk.home)}`);
    else if (signa) mal(EIXIDA.EINA, `no es troba cap ${rang} per a Gradle (JAVA_HOME, el JBR d'Android Studio o java_home): Capacitor 8 compila amb Java ${JDK_MINIM} i el seu Gradle 8.14 no corre amb un Java més nou que el ${JDK_MAXIM}`);
    else avis(`no es troba cap ${rang} per a Gradle: --compila no podrà compilar (Android Studio porta el seu)`);
    if (javaHome && jdk?.home !== javaHome) avis(`el JAVA_HOME de l'entorn no és un ${rang}: Gradle no el farà servir`);
  }

  linies.push('Arbre');
  if (arbreNet(arrel)) be('git status --porcelain no diu res');
  else mal(EIXIDA.ARBRE, 'hi ha canvis sense cometre (o eixides sense ignorar: FASE_PRELEASE_FETA.txt §6): es puja des d\'un commit');
  const index = path.join(arrel, 'dist-natiu', 'index.html');
  /* BOT-A4 (261025) · L'arbre net no diu res de dist-natiu/ ni de les còpies, que git ignora: el
     segell diu de quin commit ixen (entorn.mjs, SEGELL). */
  const segell = llegixSegell(arrel);
  const delSegell = path.join(arrel, ...SEGELL);
  if (!fs.existsSync(index)) {
    mal(EIXIDA.ARBRE, 'no hi ha dist-natiu/index.html: npm run build:natiu');
  } else {
    be('dist-natiu/index.html');
    const problemes = problemesDelSegell(segell, commitDeHead(arrel));
    if (problemes.length) for (const problema of problemes) mal(EIXIDA.ARBRE, problema);
    else be(`${SEGELL.join('/')}: compilat des de HEAD (${segell.commit.slice(0, 12)}) amb l'arbre net, ${segell.data}`);
    for (const plataforma of plataformes) {
      const copia = path.join(arrel, ...COPIA_NATIVA[plataforma]);
      // cap sync copia el segell amb la resta: si el de la còpia és un altre, la còpia és d'un altre build.
      const copiaDelSegell = path.join(path.dirname(copia), SEGELL.at(-1));
      const mateixSegell = !fs.existsSync(delSegell) || mateixContingut(delSegell, copiaDelSegell);
      if (!mateixContingut(index, copia)) mal(EIXIDA.ARBRE, `${plataforma}: ${COPIA_NATIVA[plataforma].join('/')} no és la de dist-natiu/: npx cap sync ${plataforma}`);
      else if (!mateixSegell) mal(EIXIDA.ARBRE, `${plataforma}: ${[...COPIA_NATIVA[plataforma].slice(0, -1), SEGELL.at(-1)].join('/')} no és el de dist-natiu/ (l'index.html és igual, però la còpia és d'un altre build): npx cap sync ${plataforma}`);
      else be(`${plataforma}: la còpia de dist-natiu/ és la mateixa`);
    }
  }
  if (plataformes.includes('ios') && !projecteIos(arrel)) mal(EIXIDA.ARBRE, 'no hi ha ios/App/App.xcworkspace ni ios/App/App.xcodeproj: npx cap add ios');
  if (plataformes.includes('ios')) {
    const facebook = sdkFacebookIos(arrel);
    if (facebook.length) mal(EIXIDA.ARBRE, `SDK de Facebook a ${facebook.join(', ')}: l'app no l'enllaça; deixa SocialLogin.providers.facebook a false a capacitor.config.json (l'únic config de Capacitor: sense .ts ni .js) i npx cap sync ios`);
    else be('cap SDK de Facebook a ios/ ni al connector social');
  }
  if (plataformes.includes('android') && !fs.existsSync(path.join(arrel, 'android', 'gradlew'))) mal(EIXIDA.ARBRE, 'no hi ha android/gradlew: npx cap add android');

  /* B9 · Els problemes dels avisos push són de l'arbre (7: projecte natiu desincronitzat). */
  linies.push('Avisos push');
  const estatPush = estatDelPush(arrel);
  const delPush = liniesDelPush(estatPush, { push, plataformes });
  linies.push(...delPush.linies);
  if (delPush.mal.length) familia[EIXIDA.ARBRE] = true;
  if (produccio) {
    linies.push('Producció (només avisos; mínim API de Play contrastat en l’auditoria O4)');
    for (const text of avisosDeProduccio(arrel, plataformes)) avis(text);
  }

  const ordre = [EIXIDA.FITXER, EIXIDA.PROHIBIDA, EIXIDA.FALTA, EIXIDA.EINA, EIXIDA.ARBRE];
  const codi = ordre.find((c) => familia[c]) ?? EIXIDA.BE;
  const anuncia = Boolean(estatPush.connector.paquet || estatPush.connector.ios || estatPush.connector.android || push);
  return { codi, linies, valors: entorn.codi === EIXIDA.BE ? entorn.valors : {}, fastlane, jdk, segell, push: { anuncia, estat: estatPush } };
}

/** L'arrel del repositori, si és la del script. */
export function arrelComprovada() {
  const arrel = arrelDelRepositori(ARREL_DEL_SCRIPT);
  let esperada = ARREL_DEL_SCRIPT;
  try { esperada = fs.realpathSync(ARREL_DEL_SCRIPT); } catch { /* es compara tal qual */ }
  return arrel && arrel === esperada ? arrel : null;
}

function main(argv) {
  const { opcions, errors } = analitzaArguments(argv, { plataforma: true, signa: false, canal: true, push: false, ajuda: false, estat: false });
  const us = 'Ús: --plataforma ios|android|totes [--signa] [--canal intern|produccio] [--push] · o --estat';
  if (opcions.ajuda) {
    process.stdout.write(`node scripts/botigues/preflight.mjs ${us.slice(4)}\n`
      + '  --canal intern (per defecte) o produccio: producció exigix SDP_BUILDS_DIR (registre de pujades) i afig avisos de botiga.\n'
      + '  --push: l\'app anunciarà avisos remots; sense el connector @capacitor/push-notifications, falla.\n'
      + '  --estat: només l\'estat honest de les botigues (scripts/botigues/estat.mjs), fora de línia, sense eines ni git; llig els .env de build només per saber si VITE_PUSH_VAPID_PUBLICA hi té valor; no en guarda ni n\'imprimix cap.\n');
    return EIXIDA.BE;
  }
  /* Onada R9 · C3 · L'estat, sense res més: llig fitxers del projecte i ix amb 0 (no és cap porta). */
  if (opcions.estat) {
    if (errors.length || Object.keys(opcions).length > 1) return plega(EIXIDA.US, '--estat va sol', errors);
    process.stdout.write(`${liniesDeLEstat(estatDeLesBotigues(ARREL_DEL_SCRIPT)).join('\n')}\n`);
    return EIXIDA.BE;
  }
  const plataformes = { ios: ['ios'], android: ['android'], totes: ['ios', 'android'] }[opcions.plataforma];
  if (errors.length || !plataformes) return plega(EIXIDA.US, us, errors);
  if (opcions.signa && !plataformes.includes('android')) return plega(EIXIDA.US, '--signa només té sentit amb Android');
  const canal = opcions.canal ?? CANALS.INTERN;
  if (!Object.values(CANALS).includes(canal)) return plega(EIXIDA.US, `--canal ha de ser ${Object.values(CANALS).join(' o ')}`);
  const arrel = arrelComprovada();
  if (!arrel) return plega(EIXIDA.EINA, 'git no reconeix l\'arrel del repositori on viu este script');
  const resultat = preflight({ arrel, plataformes, signa: Boolean(opcions.signa), canal, push: Boolean(opcions.push) });
  process.stdout.write(`${resultat.linies.join('\n')}\n`);
  process.stdout.write(resultat.codi === EIXIDA.BE ? '\nPreflight net.\n' : `\nPreflight amb problemes: eixida ${resultat.codi}.\n`);
  return resultat.codi;
}

const principal = (() => {
  try { return process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href; } catch { return false; }
})();
if (principal) process.exitCode = main(process.argv.slice(2));
