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
 * R24 botigues (D1, RC-6) · El push natiu només s'anuncia amb --push o amb VITE_SDP_PUSH_NATIU=1 a
 * .env.natiu o .env.natiu.local (la bandera que l'encén al paquet): el connector sol a package.json
 * ja no fa obligatori google-services.json, i les peces de push que falten són avisos.
 * R24 botigues (A2, RC-1) · «Entrada social del paquet» (també codi 7): els clients de Google que porta
 * dist-natiu/assets/*.js; amb --canal produccio, el que falta és un ✗ (en intern, un avís).
 * --canal produccio exigix SDP_BUILDS_DIR (el registre de pujades) i afig avisos de botiga.
 * Onada R30 · NAT-04 · Dins de «Fortificació de seguretat (R26)» (codi 7): cap permís d'identitat ni de
 * biometria (PERMISOS_D_IDENTITAT) declarat a l'app o als connectors sense llevar, i l'app els lleva tots.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  CANALS, EIXIDA, JDK_MAXIM, JDK_MINIM, SEGELL, analitzaArguments, arbreNet, arrelDelRepositori, carregaEntorn, commitDeHead,
  comprovaVariables, gitIgnora, jdkPerAGradle, llegixAjuda, llegixSegell, mateixContingut, mostraCami, plega, problemesDelSegell
} from './entorn.mjs';
import { estatDeLesBotigues, liniesDeLEstat } from './estat.mjs';
import { esquemaInvertitDeGoogleIos } from '../../src/config/publicCredentials.js';
import { validaConfiguracio as validaAssociacioApps } from '../../tooling/vite/associacio-apps.mjs';

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

/* Les etiquetes <uses-permission …> (i <uses-permission-sdk-23 …>) d'un manifest, sense comentaris:
   l'element, el nom i si el manifest el lleva.
   Onada R30 · NAT-04 · També amb cometes simples i espais al voltant de l'«=»: és XML vàlid. */
function permisosDe(text) {
  return [...senseComentarisXml(text).matchAll(/<(uses-permission(?:-sdk-23)?)\b[^>]*>/g)].map(([etiqueta, element]) => ({
    element,
    nom: /android:name\s*=\s*(["'])(.*?)\1/.exec(etiqueta)?.[2] ?? null,
    lleva: /tools:node\s*=\s*(["'])remove\1/.test(etiqueta)
  }));
}

/* ───────────── Onada R30 · NAT-04 (pla R30 §4) · Cap permís d'identitat ni de biometria ─────────────
   Decisió tancada per MarIA: el conjunt mínim de permisos d'Android es conserva estricte, sense els
   permisos d'identitat que hereta l'entrada amb Google. El manifest fusionat de release de l'1.0.0
   (build 2, android/app/build del 261102) portava USE_CREDENTIALS (el declara
   @capgo/capacitor-social-login) i USE_BIOMETRIC i USE_FINGERPRINT (androidx.biometric 1.1.0, que
   porta androidx.credentials 1.5.0). L'app els lleva amb tools:node="remove", i GET_ACCOUNTS també. RECORD_AUDIO i MODIFY_AUDIO_SETTINGS són de les notes de
   veu del xat: no són d'identitat i no entren ací. */
export const PERMISOS_D_IDENTITAT = Object.freeze([
  'android.permission.USE_BIOMETRIC',
  'android.permission.USE_FINGERPRINT',
  'android.permission.USE_CREDENTIALS',
  'android.permission.GET_ACCOUNTS'
]);
const MANIFEST_DE_L_APP = Object.freeze(['android', 'app', 'src', 'main', 'AndroidManifest.xml']);
const nomCurt = (nom) => nom.replace(/^android\.permission\./, '');
const llista = (noms) => (noms.length < 2 ? noms.join('') : `${noms.slice(0, -1).join(', ')} i ${noms.at(-1)}`);

/**
 * Onada R30 · NAT-04 · Els permisos de PERMISOS_D_IDENTITAT a l'app i als manifests dels connectors
 * (android/capacitor.settings.gradle). Només llig; null si no hi ha manifest de l'app. Per a cada permís:
 * `llevat`, si l'app el lleva amb <uses-permission … tools:node="remove">; `queden`, els manifests que
 * el declaren sense que ningú el lleve (el que l'app mateixa declara sempre hi compta, i un
 * <uses-permission-sdk-23> només el lleva un element del mateix tipus). Els AAR de Maven no es veuen:
 * per això l'app els ha de llevar tots encara que cap manifest de l'arbre no els declare.
 * @returns {{ connectors:number, permisos:{nom:string, llevat:boolean, queden:{cami:string, element:string}[]}[] }|null}
 */
export function permisosDIdentitatAndroid(arrel) {
  const text = lligDe(arrel, ...MANIFEST_DE_L_APP);
  if (text === null) return null;
  const app = MANIFEST_DE_L_APP.join('/');
  const delApp = permisosDe(text);
  const connectors = manifestsDeConnectors(arrel).map((manifest) => ({
    cami: path.relative(arrel, manifest).split(path.sep).join('/'),
    permisos: permisosDe(lligDe(manifest))
  }));
  const permisos = PERMISOS_D_IDENTITAT.map((nom) => {
    const llevats = new Set(delApp.filter((p) => p.nom === nom && p.lleva).map((p) => p.element));
    const queden = [{ cami: app, permisos: delApp }, ...connectors]
      .flatMap(({ cami, permisos: declarats }) => declarats.filter((p) => p.nom === nom && !p.lleva).map(({ element }) => ({ cami, element })))
      .filter(({ cami, element }) => cami === app || !llevats.has(element));
    return { nom, llevat: llevats.has('uses-permission'), queden };
  });
  return { connectors: connectors.length, permisos };
}

/**
 * Onada R30 · NAT-04 · Les línies dels permisos d'identitat (dins de «Fortificació de seguretat»). Pura.
 * Un permís que queda declarat és un ✗ per permís; els que l'app no lleva, un ✗ per a tots.
 * @returns {{ linies: string[], mal: string[] }}
 */
export function liniesPermisosDIdentitat(identitat) {
  const linies = [];
  const mal = [];
  if (!identitat?.permisos?.length) return { linies, mal };
  const app = MANIFEST_DE_L_APP.join('/');
  const errada = (text) => { linies.push(`  ✗ ${text}`); mal.push(text); };
  const queden = identitat.permisos.filter((p) => p.queden.length);
  for (const { nom, queden: fonts } of queden) {
    const on = fonts.map(({ cami, element }) => (element === 'uses-permission' ? cami : `${cami} (${element})`));
    const delApp = fonts.some(({ cami }) => cami === app);
    const elements = [...new Set(fonts.filter(({ cami }) => cami !== app).map(({ element }) => element))];
    const lleva = elements.map((element) => `<${element} android:name="${nom}" tools:node="remove" />`);
    errada(`Android: ${nomCurt(nom)} queda declarat a ${on.join(', ')}: NAT-04 (pla R30 §4) no admet cap permís d'identitat ni de biometria; ${[
      ...(delApp ? [`lleva'n la declaració de ${app}`] : []),
      ...(lleva.length ? [`posa ${lleva.join(' i ')} a ${app}`] : [])
    ].join(' i ')}`);
  }
  const senseLlevar = identitat.permisos.filter((p) => !p.queden.length && !p.llevat).map((p) => nomCurt(p.nom));
  if (senseLlevar.length) {
    const pronom = senseLlevar.length > 1 ? 'els' : 'el';
    errada(`Android: ${app} no lleva ${llista(senseLlevar)} amb tools:node="remove": cap manifest de l'arbre no ${pronom} declara, però una biblioteca (AAR) ${pronom} pot afegir al manifest fusionat sense que el preflight ho veja (androidx.biometric, que porta androidx.credentials del connector social, hi afig USE_BIOMETRIC i USE_FINGERPRINT); NAT-04, pla R30 §4`);
  }
  if (!mal.length) {
    const n = identitat.connectors;
    const cap = n === 0 ? 'l\'app no en deixa cap sense llevar (cap manifest de connectors a android/capacitor.settings.gradle)'
      : `ni l'app ni ${n === 1 ? 'l\'únic manifest' : `els ${n} manifests`} de connectors no en deixen cap sense llevar`;
    linies.push(`  ✓ Android: ${app} lleva ${llista(identitat.permisos.map((p) => nomCurt(p.nom)))} amb tools:node="remove", i ${cap} (NAT-04: cap permís d'identitat ni de biometria)`);
  }
  return { linies, mal };
}

/* R24 botigues (D1, RC-6) · La bandera de build que encén el push natiu dins del paquet
   (src/natiu/avisosPushNatius.js, tooling/vite/banderes-de-capacitat.mjs): només el valor exacte '1'.
   El build natiu la pren de .env.natiu i de .env.natiu.local (el .local mana; vite.natiu.config.js
   rebutja les que només vindrien de .env o de .env.local). */
export const BANDERA_PUSH_NATIU = 'VITE_SDP_PUSH_NATIU';
const FITXERS_DE_LA_BANDERA = Object.freeze(['.env.natiu', '.env.natiu.local']);

/* El valor (com el llig dotenv) de l'última declaració de `nom` en el text d'un .env, o undefined. */
function valorDeclarat(text, nom) {
  let valor;
  for (const linia of String(text ?? '').split(/\r?\n/)) {
    const m = /^[ \t]*(?:export[ \t]+)?([\w.-]+)[ \t]*=(.*)$/.exec(linia);
    if (!m || m[1] !== nom) continue;
    const cru = m[2].trim();
    const cometes = /^(["'`])(.*)\1(?:[ \t]+#.*)?$/.exec(cru);
    valor = cometes ? cometes[2] : cru.replace(/[ \t]+#.*$/, '').trim();
  }
  return valor;
}

/** Si .env.natiu o .env.natiu.local (el .local mana) declaren VITE_SDP_PUSH_NATIU=1. Només llig eixe
    nom i el compara amb '1': mai en retorna ni n'imprimix cap valor. Un fitxer il·legible no compta. */
export function banderaPushNatiu(arrel) {
  let valor;
  for (const nom of FITXERS_DE_LA_BANDERA) {
    const declarat = valorDeclarat(lligDe(arrel, nom), BANDERA_PUSH_NATIU);
    if (declarat !== undefined) valor = declarat;
  }
  return valor === '1';
}

/**
 * L'estat dels avisos push al projecte natiu. Només llig; de google-services.json només diu si hi
 * és, si git l'ignora i si és del paquet de capacitor.config.json, mai cap valor. `banderaNatiu`:
 * si .env.natiu* encén el push natiu al paquet (banderaPushNatiu, R24 D1).
 * @returns {{ connector:{paquet:boolean, ios:boolean, android:boolean},
 *   ios:{apsEnvironment:string|null, reenviaRegistre:boolean},
 *   android:{postNotifications:boolean, googleServices:{hiEs:boolean, ignorat:boolean|null, delPaquet:boolean|null}, connectorGoogleServices:boolean},
 *   banderaNatiu:boolean }}
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
    },
    banderaNatiu: banderaPushNatiu(arrel)
  };
}

/** Si esta pujada anuncia el push natiu: --push o la bandera de .env.natiu* (R24 D1). Pura. */
export const anunciaPushNatiu = (estat, push = false) => Boolean(push) || estat?.banderaNatiu === true;

/**
 * Les línies (✓, ! i ✗) de la família «Avisos push» per a estes plataformes. Pura. `mal` porta els ✗.
 * R24 botigues (D1) · Amb el connector però sense anunciar el push (ni --push ni la bandera), les
 * peces que només calen per al push (aps-environment, el reenviament d'APNs, google-services.json i
 * el connector de Gradle de Google) són avisos; la sincronia del connector, un google-services.json
 * versionat o d'un altre paquet (el build fallaria) i POST_NOTIFICATIONS continuen sent ✗.
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
  const anunciat = anunciaPushNatiu(estat, push);
  /* Una peça que només cal per al push: ✗ si s'anuncia; si no, un avís per a quan s'encenga. */
  const calPerAlPush = anunciat ? falla : (text) => avis(`${text} · cal abans d'encendre el push natiu`);
  if (!(connector.paquet || connector.ios || connector.android)) {
    if (anunciat) falla(`${push ? '--push' : `${BANDERA_PUSH_NATIU}=1 (.env.natiu*)`}: el connector ${PAQUET_PUSH} no és al projecte (package.json, ios/App/CapApp-SPM/Package.swift ni android/capacitor.settings.gradle); instal·lar-lo és decisió del Mestre (D-WP-7) i després npx cap sync`);
    else be('push: l\'app no porta cap connector d\'avisos remots (B8 en fase N1): ni aps-environment ni FCM no calen per a esta pujada');
    /* D-B9-17 · Un App ID amb Push i el dret és vàlid; si el perfil no el porta, xcodebuild para (8) sense pujar res. */
    if (ambIos && estat.ios.apsEnvironment) avis('ios/App/App/App.entitlements porta aps-environment sense connector: el perfil de distribució ha de tindre Push Notifications; si l\'App ID no la té, l\'arxiu fallarà en signar (eixida 8)');
    return { linies, mal };
  }
  if (!anunciat) avis(`el projecte porta el connector d'avisos remots, però esta pujada no anuncia push natiu (ni --push ni ${BANDERA_PUSH_NATIU}=1 a .env.natiu o .env.natiu.local): el paquet no el registra (src/natiu/avisosPushNatius.js) i FCM i APNs no es demanen`);
  else if (!push) avis(`${BANDERA_PUSH_NATIU}=1 a .env.natiu*: es comprova com amb --push`);
  if (!connector.paquet) falla(`el connector d'avisos remots és als projectes natius però no a package.json (${PAQUET_PUSH}): npx cap sync`);
  if (connector.paquet && ambIos && !connector.ios) falla(`${PAQUET_PUSH} és a package.json però no a ios/App/CapApp-SPM/Package.swift: npx cap sync ios`);
  if (connector.paquet && ambAndroid && !connector.android) falla(`${PAQUET_PUSH} és a package.json però no a android/capacitor.settings.gradle: npx cap sync android`);
  if (ambIos) {
    /* A la font s'admeten development i production: Xcode el posa en production en exportar per a
       l'App Store, i puja-ios el comprova dins de l'IPA. */
    if (!estat.ios.apsEnvironment) calPerAlPush('ios/App/App/App.entitlements no porta aps-environment: Xcode › Signing & Capabilities › Push Notifications (i la capacitat a l\'App ID)');
    else be(`aps-environment ${estat.ios.apsEnvironment} a App.entitlements (l'IPA de l'App Store l'ha de portar en production: es mira després d'exportar)`);
    if (!estat.ios.reenviaRegistre) calPerAlPush('ios/App/App/AppDelegate.swift no reenvia el registre d\'APNs a Capacitor (didRegisterForRemoteNotificationsWithDeviceToken → .capacitorDidRegisterForRemoteNotifications, i el de fallada): l\'esdeveniment registration no arribaria mai');
    else be('AppDelegate.swift reenvia el registre d\'APNs a Capacitor');
  }
  if (ambAndroid) {
    const gs = estat.android.googleServices;
    if (!gs.hiEs) calPerAlPush('falta android/app/google-services.json (Firebase › configuració del projecte; git l\'ignora)');
    else if (gs.ignorat !== true) falla('android/app/google-services.json: git no l\'ignora (o no s\'ha pogut comprovar), i no es versiona');
    else if (!gs.delPaquet) falla('android/app/google-services.json no és del paquet de capacitor.config.json');
    else be('google-services.json del paquet de l\'app, ignorat per git');
    if (!estat.android.connectorGoogleServices) calPerAlPush('android/app/build.gradle no aplica com.google.gms.google-services');
    if (!estat.android.postNotifications) falla('cap manifest declara android.permission.POST_NOTIFICATIONS (o l\'app el lleva amb tools:node="remove"): Android 13 o més nou no mostraria cap avís');
    else be('POST_NOTIFICATIONS declarat i no llevat');
  }
  return { linies, mal };
}

/* ───────────── R24 botigues · A2 (RC-1, incident 261106) · Entrada social del paquet ─────────────
   El build 1.0.0+2 va eixir sense cap client de Google: dins del bundle,
   `clients:{googleWeb:void 0,googleIos:void 0}`. Ni Android ni l'iPhone oferien «Continua amb Google»,
   i qui havia creat el compte amb Google al web (sense contrasenya) no podia entrar a l'app. El build
   natiu els admet buits (són opcionals a vite.natiu.config.js): ací es mira el que porta de veres el
   paquet. src/natiu/entrada.jsx registra l'adaptador amb `clients: { googleWeb, googleIos }` i
   `appleActiu`; el minificador conserva els noms de les propietats [VERIFICAT 261114 als bundles de
   l'APK 1.0.0+2 i de l'1.1.12+3]. Els clients són públics, però el preflight no n'imprimix cap. */
const CLIENT_DE_GOOGLE_AL_PAQUET = /\b\d+-[a-z0-9]+\.apps\.googleusercontent\.com\b/g;
const CLIENT_DE_GOOGLE = /^\d+-[a-z0-9]+\.apps\.googleusercontent\.com$/;
const LITERAL_MINIFICAT = String.raw`(void 0|undefined|null|"[^"\n]*"|'[^'\n]*'|\x60[^\x60\n]*\x60)`;
const REGISTRE_DELS_CLIENTS = new RegExp(String.raw`\bclients\s*:\s*\{\s*googleWeb\s*:\s*${LITERAL_MINIFICAT}\s*,\s*googleIos\s*:\s*${LITERAL_MINIFICAT}\s*\}(?:\s*,\s*appleActiu\s*:\s*(!0|!1|true|false))?`);

/* El client d'un literal del registre: només una cadena amb la forma d'un client, si no null. */
function clientDelLiteral(literal) {
  const m = /^(["'\x60])\s*(.*?)\s*\1$/.exec(String(literal ?? ''));
  return m && CLIENT_DE_GOOGLE.test(m[2]) ? m[2] : null;
}

/**
 * Els clients de Google (i Apple) que porta el paquet natiu: dist-natiu/assets/*.js. Només llig.
 * `paquet`: si hi ha dist-natiu/assets/; `registre`: si s'hi troba el registre de l'entrada nativa;
 * `clients`: tots els clients de Google que hi apareixen, ordenats (per si el registre canvia de forma).
 * @returns {{ paquet:boolean, registre:boolean, googleWeb:string|null, googleIos:string|null, appleActiu:boolean|null, clients:string[] }}
 */
export function entradaSocialDelPaquet(arrel) {
  const carpeta = path.join(arrel, 'dist-natiu', 'assets');
  let noms;
  try { noms = fs.readdirSync(carpeta).filter((nom) => nom.endsWith('.js')).sort(); }
  catch { return { paquet: false, registre: false, googleWeb: null, googleIos: null, appleActiu: null, clients: [] }; }
  const clients = new Set();
  let registre = null;
  for (const nom of noms) {
    const text = lligDe(carpeta, nom);
    if (text === null) continue;
    for (const [client] of text.matchAll(CLIENT_DE_GOOGLE_AL_PAQUET)) clients.add(client);
    registre ??= REGISTRE_DELS_CLIENTS.exec(text);
  }
  return {
    paquet: true,
    registre: Boolean(registre),
    googleWeb: clientDelLiteral(registre?.[1]),
    googleIos: clientDelLiteral(registre?.[2]),
    appleActiu: registre?.[3] ? registre[3] === '!0' || registre[3] === 'true' : null,
    clients: [...clients].sort()
  };
}

/**
 * Les línies de la família «Entrada social del paquet (dist-natiu)». Pura. A producció, cada peça que
 * falta és un ✗ (de l'arbre, 7); en intern, un avís. `infoPlist`: el text d'ios/App/App/Info.plist.
 * Apple apagat a iOS és sempre un avís: si s'encén, ho decidix el Mestre (compte-apple desplegada).
 * @returns {{ linies: string[], mal: string[] }}
 */
export function liniesEntradaSocial(entrada, { plataformes = [], produccio = false, infoPlist = null } = {}) {
  const linies = [];
  const mal = [];
  if (!plataformes.length) return { linies, mal };
  const be = (text) => linies.push(`  ✓ ${text}`);
  const avis = (text) => linies.push(`  ! ${text}`);
  const falta = produccio ? (text) => { linies.push(`  ✗ ${text}`); mal.push(text); } : avis;
  if (!entrada?.paquet) {
    avis('no hi ha dist-natiu/assets: no es pot mirar si el paquet porta els clients de Google (npm run build:natiu)');
    return { linies, mal };
  }
  if (!entrada.registre) {
    falta(`el paquet no porta el registre de l'entrada nativa (clients: { googleWeb, googleIos } de src/natiu/entrada.jsx; ${entrada.clients.length} client(s) de Google solts): no es pot certificar «Continua amb Google»`);
    return { linies, mal };
  }
  if (!entrada.googleWeb) falta('el paquet no porta VITE_NATIU_GOOGLE_WEB_CLIENT_ID: ni Android ni l\'iPhone oferiran «Continua amb Google», i qui va crear el compte amb Google al web no podrà entrar (RC-1, 261106); posa\'l a .env.natiu.local, npm run build:natiu i npx cap sync');
  else be('el paquet porta el client web de Google (Android i iOS)');
  if (plataformes.includes('ios')) {
    if (!entrada.googleIos) {
      falta('el paquet no porta VITE_NATIU_GOOGLE_IOS_CLIENT_ID: l\'iPhone no oferirà «Continua amb Google»; posa\'l a .env.natiu.local, npm run build:natiu i npx cap sync ios');
    } else {
      const esquema = esquemaInvertitDeGoogleIos(entrada.googleIos);
      if (!esquema || !senseComentarisXml(infoPlist).includes(`<string>${esquema}</string>`)) {
        falta('ios/App/App/Info.plist no registra l\'esquema invertit del client iOS del paquet (CFBundleURLTypes): GoogleSignIn faria petar l\'app en tocar «Continua amb Google»');
      } else {
        be('el paquet porta el client iOS de Google i Info.plist en registra l\'esquema invertit');
      }
    }
    if (entrada.appleActiu === false) avis('el paquet porta Apple apagat (VITE_APPLE_OAUTH_ACTIU): a l\'iPhone no hi haurà cap botó social, ni Apple ni Google (App Store 4.8), només el correu; encendre\'l és del Mestre, amb compte-apple desplegada');
  }
  return { linies, mal };
}

/* Les dues úniques claus d'ATS admeses, i totes dues a false: els valors per defecte d'Apple dits en
   veu alta. Amb NSAllowsArbitraryLoadsInWebContent present (amb qualsevol valor), iOS 10+ ignora
   NSAllowsArbitraryLoads; per això cap altra clau (NSExceptionDomains, NSAllowsLocalNetworking,
   NSAllowsArbitraryLoadsForMedia…) no pot entrar al bloc sense que el preflight ho diga. */
const ATS_FALS = Object.freeze([
  /<key>NSAllowsArbitraryLoads<\/key>\s*<false\s*\/>/,
  /<key>NSAllowsArbitraryLoadsInWebContent<\/key>\s*<false\s*\/>/
]);

/** Els `src` de tots els <certificates> d'un network_security_config (sense comentaris). */
const fontsDeCertificats = (xml) => [...xml.matchAll(/<certificates\b([^>]*)>/g)]
  .map(([, atributs]) => /\bsrc="([^"]*)"/.exec(atributs)?.[1] ?? '');

/**
 * Onada R26 · Llig l'estat real de fortificació nativa i de scripts/botigues/associacio-apps.json
 * (més l'absència de fitxers d'associació estàtics prohibits a public/). Només lectura; cap valor
 * secret ix mai. Si un projecte natiu no és en l'arbre (fixtures sintètics), `present` és false.
 */
export function seguretatBotigues(arrel) {
  const infoText = lligDe(arrel, 'ios', 'App', 'App', 'Info.plist');
  const infoNet = infoText === null ? '' : senseComentarisXml(infoText);
  const blocsAts = infoNet.match(/<key>NSAppTransportSecurity<\/key>/g) ?? [];
  const blocAts = /<key>NSAppTransportSecurity<\/key>\s*<dict>([\s\S]*?)<\/dict>/.exec(infoNet)?.[1] ?? '';
  /* Un dict niat (NSExceptionDomains) talla la captura al primer </dict> i deixa resta: també és ✗. */
  const restaAts = ATS_FALS.reduce((resta, clau) => resta.replace(clau, ''), blocAts).trim();
  const atsSegur = blocsAts.length === 1
    && ATS_FALS.every((clau) => clau.test(blocAts))
    && restaAts === ''
    && !/<key>NSAllowsArbitraryLoads<\/key>\s*<true\s*\/>/.test(infoNet);

  const privText = lligDe(arrel, 'ios', 'App', 'App', 'PrivacyInfo.xcprivacy');
  const privNet = privText === null ? '' : senseComentarisXml(privText);
  const privacitatSenseRastreig = /<key>NSPrivacyTracking<\/key>\s*<false\s*\/>/.test(privNet);
  const privacitatCa921 = privNet.includes('NSPrivacyAccessedAPICategoryUserDefaults') && privNet.includes('<string>CA92.1</string>');

  const associacioText = lligDe(arrel, 'scripts', 'botigues', 'associacio-apps.json');
  let associacioIosValida = false;
  let associacioIosPendent = false;
  let associacioAndroidValida = false;
  let associacioAndroidPendent = false;
  if (associacioText !== null) {
    /* Una sola font de veritat: el validador del connector del build web (tooling/vite/associacio-apps.mjs).
       Si el build web pararia, el preflight no pot dir ✓. Els valors no s'imprimixen mai. */
    try {
      const cfg = validaAssociacioApps(JSON.parse(associacioText));
      associacioAndroidValida = true;
      associacioAndroidPendent = cfg.android.sha256_cert_fingerprints.length === 0;
      if (cfg.ios) {
        associacioIosValida = true;
        associacioIosPendent = cfg.ios.team_ids.length === 0;
      }
    } catch {
      associacioIosValida = false;
      associacioAndroidValida = false;
    }
  }

  const aasaEstatica = fs.existsSync(path.join(arrel, 'public', '.well-known', 'apple-app-site-association'))
    || fs.existsSync(path.join(arrel, 'public', 'apple-app-site-association'));
  const assetlinksEstatic = fs.existsSync(path.join(arrel, 'public', '.well-known', 'assetlinks.json'))
    || fs.existsSync(path.join(arrel, 'public', 'assetlinks.json'));

  const manifestText = lligDe(arrel, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
  const manifestNet = manifestText === null ? '' : senseComentarisXml(manifestText);
  const aplicacio = /<application\b([^>]*)>/.exec(manifestNet)?.[1] ?? '';
  const allowBackupFals = /\bandroid:allowBackup="false"/.test(aplicacio) && !/\bandroid:allowBackup="true"/.test(manifestNet);
  const cleartextManifestFals = /\bandroid:usesCleartextTraffic="false"/.test(aplicacio) && !/\bandroid:usesCleartextTraffic="true"/.test(manifestNet);
  const referenciaNetworkConfig = /\bandroid:networkSecurityConfig="@xml\/network_security_config"/.test(aplicacio);

  const netCfgText = lligDe(arrel, 'android', 'app', 'src', 'main', 'res', 'xml', 'network_security_config.xml');
  const netCfgNet = netCfgText === null ? '' : senseComentarisXml(netCfgText);
  const fontsCertificats = fontsDeCertificats(netCfgNet);
  const networkConfigSegura = netCfgText !== null
    && /<base-config\s+cleartextTrafficPermitted="false"\s*>/.test(netCfgNet)
    && !netCfgNet.includes('cleartextTrafficPermitted="true"')
    && fontsCertificats.length > 0
    && fontsCertificats.every((font) => font === 'system');

  return {
    associacioPresent: associacioText !== null,
    ios: {
      present: infoText !== null,
      atsSegur,
      privacitatPresent: privText !== null,
      privacitatSenseRastreig,
      privacitatCa921,
      aasaEstatica,
      associacioValida: associacioIosValida,
      associacioPendent: associacioIosPendent
    },
    android: {
      present: manifestText !== null,
      allowBackupFals,
      cleartextManifestFals,
      referenciaNetworkConfig,
      networkConfigSegura,
      assetlinksEstatic,
      associacioValida: associacioAndroidValida,
      associacioPendent: associacioAndroidPendent,
      /* Onada R30 · NAT-04 · null sense manifest de l'app (fixtures sintètics). */
      identitat: permisosDIdentitatAndroid(arrel)
    }
  };
}

/**
 * Onada R26 · Genera les línies de verificació de fortificació nativa per a les plataformes demanades.
 * Qualsevol relaxació d'ATS, de PrivacyInfo, de cleartext/allowBackup, d'associacio-apps.json o un
 * fitxer estàtic prohibit a public/.well-known és un ✗ (arbre, 7).
 */
export function liniesSeguretatBotigues(estat, { plataformes = [], produccio = false } = {}) {
  const linies = [];
  const mal = [];
  const be = (text) => linies.push(`  ✓ ${text}`);
  const avis = (text) => linies.push(`  ! ${text}`);
  const errada = (text) => { linies.push(`  ✗ ${text}`); mal.push(text); };

  if (plataformes.includes('ios') && (estat?.ios?.present || estat?.ios?.aasaEstatica || estat?.associacioPresent)) {
    let iosNet = true;
    if (estat.ios.present) {
      if (!estat.ios.atsSegur) {
        iosNet = false;
        errada('ios/App/App/Info.plist no blinda NSAppTransportSecurity: un sol bloc amb NSAllowsArbitraryLoads i NSAllowsArbitraryLoadsInWebContent a false i cap altra clau (ni NSExceptionDomains, ni NSAllowsLocalNetworking, ni NSAllowsArbitraryLoadsForMedia)');
      }
      if (!estat.ios.privacitatPresent || !estat.ios.privacitatSenseRastreig || !estat.ios.privacitatCa921) {
        iosNet = false;
        errada('ios/App/App/PrivacyInfo.xcprivacy falta o no declara NSPrivacyTracking = false i UserDefaults CA92.1');
      }
    }
    if (estat.ios.aasaEstatica) {
      iosNet = false;
      errada('public/ porta apple-app-site-association estàtic: només el pot emetre tooling/vite/associacio-apps.mjs amb Team ID real (P0-23)');
    }
    if (estat.associacioPresent && !estat.ios.associacioValida) {
      iosNet = false;
      errada('scripts/botigues/associacio-apps.json no porta un bloc ios que el connector del build web (tooling/vite/associacio-apps.mjs) accepte per a org.socdepoble.app');
    }
    if (iosNet && estat.ios.present) {
      be('iOS: NSAppTransportSecurity estricte, PrivacyInfo.xcprivacy (CA92.1) i associacio-apps.json verificats');
    }
    if (produccio && estat.ios.associacioPendent) {
      avis('scripts/botigues/associacio-apps.json té ios.team_ids buit: afig el Team ID d\'Apple Developer per a publicar apple-app-site-association');
    }
  }

  if (plataformes.includes('android') && (estat?.android?.present || estat?.android?.assetlinksEstatic || estat?.associacioPresent)) {
    let androidNet = true;
    if (estat.android.present) {
      if (!estat.android.allowBackupFals) {
        androidNet = false;
        errada('android/app/src/main/AndroidManifest.xml no fixa android:allowBackup="false"');
      }
      if (!estat.android.cleartextManifestFals || !estat.android.referenciaNetworkConfig || !estat.android.networkConfigSegura) {
        androidNet = false;
        errada('Android permet trànsit HTTP en clar o àncores de confiança que no són les del sistema (CAs d\'usuari o @raw): cal usesCleartextTraffic="false" i @xml/network_security_config estricte, només amb <certificates src="system"/>');
      }
    }
    if (estat.android.assetlinksEstatic) {
      androidNet = false;
      errada('public/ porta assetlinks.json estàtic: només el pot emetre tooling/vite/associacio-apps.mjs amb empremtes reals de Play Console (P0-23)');
    }
    if (estat.associacioPresent && !estat.android.associacioValida) {
      androidNet = false;
      errada('scripts/botigues/associacio-apps.json no és vàlid per a Android org.socdepoble.app (el connector del build web tooling/vite/associacio-apps.mjs el rebutjaria)');
    }
    if (androidNet && estat.android.present) {
      be('Android: allowBackup="false", usesCleartextTraffic="false", network_security_config i associacio-apps.json verificats');
    }
    /* Onada R30 · NAT-04 · Línia pròpia: no toca el ✓ d'R26 de dalt. */
    if (estat.android.present) {
      const identitat = liniesPermisosDIdentitat(estat.android.identitat);
      linies.push(...identitat.linies);
      mal.push(...identitat.mal);
    }
    if (produccio && estat.android.associacioPendent) {
      avis('scripts/botigues/associacio-apps.json té android.sha256_cert_fingerprints buit: copia-hi la clau d\'App Signing de Play Console per a publicar assetlinks.json');
    }
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
 *   remots (--push o VITE_SDP_PUSH_NATIU=1 a .env.natiu*, R24 D1): puja-ios hi lliga l'aps-environment de l'IPA
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
  /* R24 botigues (A2) · Els clients de Google que porta el paquet: a producció, de l'arbre (7). */
  if (plataformes.length) {
    linies.push('Entrada social del paquet (dist-natiu)');
    const social = liniesEntradaSocial(entradaSocialDelPaquet(arrel), { plataformes, produccio, infoPlist: lligDe(arrel, 'ios', 'App', 'App', 'Info.plist') });
    linies.push(...social.linies);
    if (social.mal.length) familia[EIXIDA.ARBRE] = true;
    const seguretat = liniesSeguretatBotigues(seguretatBotigues(arrel), { plataformes, produccio });
    if (seguretat.linies.length) {
      linies.push('Fortificació de seguretat (R26)');
      linies.push(...seguretat.linies);
      if (seguretat.mal.length) familia[EIXIDA.ARBRE] = true;
    }
  }
  if (produccio) {
    linies.push('Producció (només avisos; mínim API de Play contrastat en l’auditoria O4)');
    for (const text of avisosDeProduccio(arrel, plataformes)) avis(text);
  }

  const ordre = [EIXIDA.FITXER, EIXIDA.PROHIBIDA, EIXIDA.FALTA, EIXIDA.EINA, EIXIDA.ARBRE];
  const codi = ordre.find((c) => familia[c]) ?? EIXIDA.BE;
  /* R24 botigues (D1) · Abans, el connector a package.json ja «anunciava» el push. */
  const anuncia = anunciaPushNatiu(estatPush, push);
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
      + '  --push: l\'app anunciarà avisos remots (també sense --push si .env.natiu o .env.natiu.local declaren VITE_SDP_PUSH_NATIU=1); sense el connector @capacitor/push-notifications, falla.\n'
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
