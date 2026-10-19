/**
 * scripts/botigues/entorn.mjs — Sóc de Poble · pujades a les botigues («Pregunta Zero», 261003).
 *
 * Instal·lat el 261019 (Fase C, Capacitor 8.5.3) des del laboratori
 * _wiki_de_poble/04_escriptori/02_investigacio_ia/261003_1330_empaquetat_mobil_claude/nous/botigues/
 * (entorn.mjs.txt). Disseny i codis d'eixida: LLEGIU.txt d'eixa carpeta i RUNBOOK_BOTIGUES_IA.txt.
 * Proves: tests/botigues.test.mjs.
 *
 * Els secrets es lligen d'un fitxer d'entorn FORA del paquet de l'app: per defecte
 * .env.botigues.local a l'arrel del repositori (git l'ignora per «.env.*», .gitignore:15), o el
 * camí que porte SDP_BOTIGUES_ENV. Regles:
 *   · cap nom VITE_*: Vite segellaria el valor dins del paquet de l'app (telemetria.js i
 *     configFonts.js reben import.meta.env sencer);
 *   · cap clau escrita dins del fitxer: la .p8, el JSON del compte de servei i la keystore es
 *     nomenen per RUTA, i eixa ruta ha de ser FORA del repositori;
 *   · si el fitxer d'entorn és dins del repositori, git l'ha d'ignorar; i mai és un fitxer que
 *     Vite carregue (.env, .env.local, .env.production…, .env.natiu…);
 *   · permisos 600: ni el grup ni els altres el poden llegir;
 *   · mai s'imprimix cap valor del fitxer: en les ordres que es mostren, cada valor es canvia per
 *     <NOM>, i l'eixida de les eines es filtra igual, línia a línia.
 * Només mòduls de Node: cap dependència.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

export const FITXER_PER_DEFECTE = '.env.botigues.local';
export const VARIABLE_DEL_CAMI = 'SDP_BOTIGUES_ENV';

/* El laboratori del disseny («LAB»). La plantilla del fitxer d'entorn no s'instal·la (LLEGIU.txt §6:
   en fa la còpia el Mestre) i el rebut de cada pujada va a LAB/rebuts/ (RUNBOOK A10). Els scripts
   només imprimixen estos camins: no escriuen cap rebut ni creen la carpeta. */
const LABORATORI = '_wiki_de_poble/04_escriptori/02_investigacio_ia/261003_1330_empaquetat_mobil_claude';
export const PLANTILLA_DE_L_ENTORN = `${LABORATORI}/nous/botigues/botigues.env.exemple.txt`;
export const REBUTS = `${LABORATORI}/rebuts`;

/** Codis d'eixida, els mateixos als tres scripts. */
export const EIXIDA = Object.freeze({
  BE: 0,           // tot correcte: pla en sec, compilació feta o pujada feta
  US: 2,           // arguments que falten, que sobren o que no s'entenen
  FITXER: 3,       // el fitxer d'entorn no hi és, no es llig, té permisos oberts, git no l'ignora o és de Vite
  PROHIBIDA: 4,    // un nom VITE_*, una clau escrita dins del fitxer, un nom repetit o una línia que no s'entén
  FALTA: 5,        // falta una variable o el fitxer que nomena, o eixe fitxer és dins del repositori
  EINA: 6,         // falta una eina, o no té les opcions que el script farà servir
  ARBRE: 7,        // canvis sense cometre, dist-natiu/ absent, projecte natiu desincronitzat o versió que no casa
  EXTERNA: 8,      // xcodebuild, gradle, altool, keytool o fastlane han fallat
  VERIFICACIO: 9,  // l'equip de la signatura o l'empremta del certificat de pujada no casen
  CONFIRMACIO: 10  // --confirma no casa amb --versio i --build
});

/* Cada variable: el tipus i els contextos on és obligatòria.
   · id: identificador (no és secret, però no s'imprimix: tampoc va als rebuts);
   · ruta: un fitxer FORA del repositori (mai el seu contingut);
   · directori: una carpeta FORA del repositori;
   · empremta: SHA-256 en hexadecimal (amb o sense dos punts);
   · secret: contrasenya; només viatja a l'entorn del procés fill que la necessita.
   Contextos: 'ios', 'android' (verificar i pujar) i 'android-signa' (compilar i signar amb
   --compila; per defecte signa el Mestre, RUNBOOK A4 opció A). */
export const VARIABLES = Object.freeze({
  SDP_APP_ID: Object.freeze({ tipus: 'id', per: ['ios', 'android'] }),
  SDP_APPLE_TEAM_ID: Object.freeze({ tipus: 'id', per: ['ios'] }),
  SDP_ASC_KEY_ID: Object.freeze({ tipus: 'id', per: ['ios'] }),
  SDP_ASC_ISSUER_ID: Object.freeze({ tipus: 'id', per: ['ios'] }),
  SDP_ASC_KEY_PATH: Object.freeze({ tipus: 'ruta', per: ['ios'], extensions: ['.p8'] }),
  SDP_BUILDS_DIR: Object.freeze({ tipus: 'directori', per: ['ios'] }),
  SDP_PLAY_JSON_KEY_PATH: Object.freeze({ tipus: 'ruta', per: ['android'], extensions: ['.json'] }),
  SDP_ANDROID_UPLOAD_CERT_SHA256: Object.freeze({ tipus: 'empremta', per: ['android'] }),
  SDP_ANDROID_KEYSTORE_PATH: Object.freeze({ tipus: 'ruta', per: ['android-signa'], extensions: ['.jks', '.keystore'] }),
  SDP_ANDROID_KEY_ALIAS: Object.freeze({ tipus: 'id', per: ['android-signa'] }),
  SDP_ANDROID_KEYSTORE_PASSWORD: Object.freeze({ tipus: 'secret', per: ['android-signa'] }),
  SDP_ANDROID_KEY_PASSWORD: Object.freeze({ tipus: 'secret', per: ['android-signa'] })
});

/* ───────────────────────────── Peces pures ───────────────────────────── */

const LINIA = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/;

/**
 * Llig el text d'un fitxer d'entorn: NOM=valor, «export» opcional, comentaris de línia (#),
 * valors entre cometes simples o dobles en UNA línia. Res d'expansions ($VAR): el valor és
 * literal. Els errors només porten el número de línia i el nom, mai el valor.
 * @param {string} text
 * @returns {{ valors: Record<string,string>, errors: {linia:number, nom?:string, motiu:string}[] }}
 */
export function analitzaEntorn(text = '') {
  const valors = {};
  const errors = [];
  String(text).split(/\r?\n/).forEach((cru, index) => {
    const linia = index + 1;
    const net = cru.trim();
    if (!net || net.startsWith('#')) return;
    const coincidencia = cru.match(LINIA);
    if (!coincidencia) { errors.push({ linia, motiu: 'no és una línia NOM=valor' }); return; }
    const [, nom, brut] = coincidencia;
    let valor = brut;
    if (valor.startsWith('"') || valor.startsWith('\'')) {
      const tanca = valor.indexOf(valor[0], 1);
      if (tanca === -1) { errors.push({ linia, nom, motiu: 'cometes sense tancar (no s\'admeten valors de més d\'una línia)' }); return; }
      const resta = valor.slice(tanca + 1).trim();
      if (resta && !resta.startsWith('#')) { errors.push({ linia, nom, motiu: 'text després de les cometes' }); return; }
      valor = valor.slice(1, tanca);
    } else {
      valor = valor.replace(/\s+#.*$/, '');
    }
    if (Object.hasOwn(valors, nom)) { errors.push({ linia, nom, motiu: 'nom repetit' }); return; }
    valors[nom] = valor;
  });
  return { valors, errors };
}

/* Una clau escrita dins del fitxer en lloc de la seua ruta: una clau privada PEM (la .p8) o el
   JSON d'un compte de servei de Google. */
const CLAU_ESCRITA = /-----BEGIN [A-Z ]*PRIVATE KEY-----|"private_key"\s*:|"type"\s*:\s*"service_account"/;

/**
 * Els noms i valors que el fitxer no pot portar. Cap motiu porta el valor.
 * @param {Record<string,string>} valors
 * @returns {{nom:string, motiu:string}[]}
 */
export function prohibides(valors = {}) {
  const errors = [];
  for (const [nom, valor] of Object.entries(valors)) {
    if (nom.startsWith('VITE_')) {
      errors.push({ nom, motiu: 'cap variable d\'este fitxer pot dur el prefix VITE_: Vite segellaria el valor dins del paquet de l\'app' });
    } else if (CLAU_ESCRITA.test(valor) || (VARIABLES[nom]?.tipus === 'ruta' && valor.trim().startsWith('{'))) {
      errors.push({ nom, motiu: 'porta una clau escrita: posa-hi la RUTA del fitxer (fora del repositori), no el contingut' });
    }
  }
  return errors;
}

/** Les variables del fitxer que este script no coneix (un avís, no un error). */
export function desconegudes(valors = {}) {
  return Object.keys(valors).filter((nom) => !Object.hasOwn(VARIABLES, nom)).sort();
}

/** Les variables obligatòries dels `contextos` que falten o són buides, ordenades. */
export function falten(valors = {}, contextos = []) {
  return Object.entries(VARIABLES)
    .filter(([nom, { per }]) => per.some((context) => contextos.includes(context)) && !(valors[nom] || '').trim())
    .map(([nom]) => nom)
    .sort();
}

/** «~» o «~/…» amb la carpeta de l'usuari al davant. */
const ambCasa = (cami) => String(cami).replace(/^~(?=\/|$)/, os.homedir());

/* El que es busca per a cada valor. Una ruta o un directori ix a les ordres i a l'eixida de les
   eines tal com el resol rutaDe (amb ~ desplegat i des de l'arrel), no com està escrit al fitxer:
   es busquen les tres formes. I el Key ID d'App Store Connect també es busca dins del nom de la
   clau (AuthKey_<KEY_ID>.p8), on «_» i «.» el deixaven fora de la regla de la peça sencera. */
function substitucions(valors, arrel) {
  const llista = [];
  for (const [nom, cru] of Object.entries(valors)) {
    const valor = String(cru ?? '').trim();
    const { tipus } = VARIABLES[nom] ?? {};
    const arreu = !tipus || tipus === 'secret';
    const formes = [valor];
    if (tipus === 'ruta' || tipus === 'directori') {
      const desplegat = ambCasa(valor);
      formes.push(path.isAbsolute(desplegat) ? path.resolve(desplegat) : desplegat);
      if (arrel) formes.push(path.resolve(arrel, desplegat));
    }
    for (const forma of new Set(formes)) llista.push({ cerca: forma, arreu, posa: `<${nom}>` });
    if (nom === 'SDP_ASC_KEY_ID' && valor.length >= 4) llista.push({ cerca: `AuthKey_${valor}`, arreu: true, posa: `AuthKey_<${nom}>` });
  }
  return llista.filter(({ cerca }) => cerca.length >= 4).sort((a, b) => b.cerca.length - a.cerca.length);
}

/**
 * Canvia per <NOM> cada valor del fitxer d'entorn que aparega en `text`. Els valors més llargs
 * primer; els de menys de 4 caràcters no es canvien (no són secrets i ho embrutarien tot).
 * Una contrasenya, o una variable que el script no coneix, es canvia on siga, encara que vaja
 * enganxada a un altre text. Un identificador, una ruta o una empremta només es canvia si és
 * una peça sencera: un àlies «upload» no ha de convertir «--upload-app» en «--<…>-app».
 * Amb `arrel`, una ruta relativa es busca també resolta des d'ella, com la passa rutaDe a les eines.
 * @param {string} text
 * @param {Record<string,string>} valors
 * @param {string|null} [arrel]
 */
export function emmascara(text, valors = {}, arrel = null) {
  let eixida = String(text);
  const escapa = (valor) => valor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const { cerca, arreu, posa } of substitucions(valors, arrel)) {
    eixida = arreu
      ? eixida.split(cerca).join(posa)
      : eixida.replace(new RegExp(`(?<![\\w.-])${escapa(cerca)}(?![\\w.-])`, 'g'), posa);
  }
  return eixida;
}

/** Una ordre llegible i emmascarada, per a mostrar-la abans d'executar-la. */
export function mostraOrdre(ordre, args = [], valors = {}, arrel = null) {
  const cita = (part) => (/^[\w@%+=:,./<>-]+$/.test(part) ? part : `'${String(part).replace(/'/g, '\'\\\'\'')}'`);
  return emmascara([ordre, ...args].map(cita).join(' '), valors, arrel);
}

/** Cert si `cami` és `arrel` o és dins d'ella. */
export function esDins(arrel, cami) {
  const rel = path.relative(path.resolve(arrel), path.resolve(cami));
  return rel === '' || (rel !== '..' && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel));
}

/* Els fitxers d'entorn que Vite carrega en algun mode d'este projecte. */
const DE_VITE = /^\.env(?:\.(?:local|production|development|natiu|test))?(?:\.local)?$/;

/** Cert si `nom` (sense carpeta) és un fitxer que Vite carregaria. */
export function esFitxerDeVite(nom) {
  return DE_VITE.test(path.basename(String(nom)));
}

/** Una empremta SHA-256 en majúscules i sense separadors, o null si no en té la forma. */
export function normalitzaEmpremta(text) {
  const hex = String(text ?? '').replace(/[\s:]/g, '').toUpperCase();
  return /^[0-9A-F]{64}$/.test(hex) ? hex : null;
}

/** L'empremta SHA-256 del primer certificat que imprimix «keytool -printcert». */
export function empremtaDeKeytool(eixida) {
  const trobada = String(eixida ?? '').match(/SHA-?256:\s*([0-9A-Fa-f:]{64,})/);
  return trobada ? normalitzaEmpremta(trobada[1]) : null;
}

/** El TeamIdentifier que imprimix «codesign -dv». */
export function equipDeCodesign(eixida) {
  const trobat = String(eixida ?? '').match(/^TeamIdentifier=(\S+)/m);
  return trobat && trobat[1] !== 'not' ? trobat[1] : null;
}

/** Les opcions de `opcions` que no apareixen a l'ajuda d'una eina. */
export function opcionsQueFalten(ajuda, opcions = []) {
  const text = String(ajuda ?? '');
  const escapa = (opcio) => opcio.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return opcions.filter((opcio) => !new RegExp(`(?:^|[\\s,\\[|(])${escapa(opcio)}(?=$|[\\s,=\\]|)<])`, 'm').test(text));
}

export const VERSIO = /^\d+\.\d+\.\d+$/;
export const BUILD = /^[1-9]\d{0,8}$/;

/** El text que ha de portar --confirma per a esta versió i este build. */
export const confirmacioEsperada = (versio, build) => `${versio}+${build}`;

/**
 * Arguments de la línia d'ordres: --nom=valor, --nom valor i banderes. `admesos` diu quines
 * opcions porten valor (true) i quines són banderes (false).
 * @returns {{ opcions: Record<string,string|boolean>, errors: string[] }}
 */
export function analitzaArguments(argv = [], admesos = {}) {
  const opcions = {};
  const errors = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const coincidencia = /^--([a-z][a-z-]*)(?:=(.*))?$/.exec(arg);
    if (!coincidencia || !Object.hasOwn(admesos, coincidencia[1])) { errors.push(`argument desconegut: ${arg}`); continue; }
    const [, nom, igual] = coincidencia;
    if (Object.hasOwn(opcions, nom)) { errors.push(`--${nom} repetit`); continue; }
    if (!admesos[nom]) {
      if (igual !== undefined) errors.push(`--${nom} no porta valor`);
      else opcions[nom] = true;
    } else if (igual !== undefined) {
      opcions[nom] = igual;
    } else if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
      opcions[nom] = argv[i + 1];
      i += 1;
    } else {
      errors.push(`--${nom} necessita un valor`);
    }
  }
  return { opcions, errors };
}

/** versionCode i versionName d'un android/app/build.gradle (Groovy), o null si no hi són. */
export function versioDeGradle(text) {
  const codi = String(text ?? '').match(/^\s*versionCode\s+(\d+)\s*$/m);
  const nom = String(text ?? '').match(/^\s*versionName\s+["']([^"']+)["']\s*$/m);
  return { build: codi ? codi[1] : null, versio: nom ? nom[1] : null };
}

/** L'ExportOptions.plist d'una exportació per a App Store Connect, sense pujar res. */
export function exportOptionsPlist(equip) {
  if (!/^[A-Z0-9]{10}$/.test(String(equip))) throw new Error('SDP_APPLE_TEAM_ID no té la forma d\'un Team ID (10 caràcters, A-Z i 0-9).');
  /* method «app-store-connect» és el nom d'Xcode 15.3 i posteriors (abans, «app-store»)
     [VERIFICAT 261019 a «xcodebuild -help» d'Xcode 27.1: «Available keys for -exportOptionsPlist»
     porta method (app-store-connect; app-store, «deprecated»), teamID, signingStyle, destination
     (export o upload), uploadSymbols i manageAppVersionAndBuildNumber; i és el method per defecte
     de «cap build ios» a @capacitor/cli 8.5.3]. destination «export»: MAI «upload»; la pujada és
     un pas a part, amb el seu «sí». */
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key><string>app-store-connect</string>
  <key>teamID</key><string>${equip}</string>
  <key>signingStyle</key><string>automatic</string>
  <key>destination</key><string>export</string>
  <key>uploadSymbols</key><true/>
  <key>manageAppVersionAndBuildNumber</key><false/>
</dict>
</plist>
`;
}

/* ─────────────────────────── Disc, git i eines ─────────────────────────── */

const real = (cami) => { try { return fs.realpathSync(cami); } catch { return path.resolve(cami); } };

/** On és el fitxer d'entorn: SDP_BOTIGUES_ENV (relatiu a l'arrel, o amb ~) o el de per defecte. */
export function camiDelFitxer({ arrel, env = process.env }) {
  const indicat = String(env[VARIABLE_DEL_CAMI] ?? '').trim();
  return indicat ? path.resolve(arrel, ambCasa(indicat)) : path.join(arrel, FITXER_PER_DEFECTE);
}

/** Com es mostra un camí: relatiu a l'arrel si hi és dins, amb ~ si és a casa. */
export function mostraCami(arrel, cami) {
  if (esDins(arrel, cami)) return path.relative(arrel, cami) || '.';
  const casa = os.homedir();
  return esDins(casa, cami) ? `~/${path.relative(casa, cami)}` : cami;
}

/** L'arrel del repositori segons git, real (sense enllaços), o null. */
export function arrelDelRepositori(desDe) {
  const r = spawnSync('git', ['rev-parse', '--show-toplevel'], { cwd: desDe, encoding: 'utf8' });
  if (r.error || r.status !== 0) return null;
  return real(r.stdout.trim());
}

/** true si git ignora `cami` (dins de l'arrel), false si no, null si no s'ha pogut saber. */
export function gitIgnora(arrel, cami) {
  const r = spawnSync('git', ['check-ignore', '-q', '--', path.relative(arrel, cami)], { cwd: arrel });
  if (r.error) return null;
  if (r.status === 0) return true;
  return r.status === 1 ? false : null;
}

/** Cert si `git status --porcelain` no diu res. */
export function arbreNet(arrel) {
  const r = spawnSync('git', ['status', '--porcelain'], { cwd: arrel, encoding: 'utf8' });
  return !r.error && r.status === 0 && r.stdout.trim() === '';
}

/** El commit curt de HEAD, o null. */
export function commitCurt(arrel) {
  const r = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: arrel, encoding: 'utf8' });
  return r.error || r.status !== 0 ? null : r.stdout.trim();
}

/** sha256 en hexadecimal d'un fitxer. */
export function sha256DeFitxer(cami) {
  return crypto.createHash('sha256').update(fs.readFileSync(cami)).digest('hex');
}

/** Cert si els dos fitxers existixen i tenen el mateix contingut. */
export function mateixContingut(a, b) {
  return fs.existsSync(a) && fs.existsSync(b) && sha256DeFitxer(a) === sha256DeFitxer(b);
}

/** L'ajuda d'una eina (stdout i stderr), o null si l'eina no hi és. */
export function llegixAjuda(ordre, args) {
  const r = spawnSync(ordre, args, { encoding: 'utf8', timeout: 120000, env: { ...process.env, FASTLANE_SKIP_UPDATE_CHECK: '1', FASTLANE_OPT_OUT_USAGE: '1' } });
  if (r.error) return null;
  return `${r.stdout || ''}\n${r.stderr || ''}`;
}

/* El JDK que necessita Gradle per a compilar l'Android de Capacitor 8: sourceCompatibility
   JavaVersion.VERSION_21 a node_modules/@capacitor/android/capacitor/build.gradle:66 i al
   capacitor.build.gradle que escriu la CLI (@capacitor/cli/dist/android/update.js:148)
   [VERIFICAT 261019 amb 8.5.3]. El gradlew de la plantilla fa servir JAVA_HOME si hi és i, si
   no, el java del PATH, que en este Mac és un 17: per això el script tria el JDK i el passa a
   Gradle per JAVA_HOME. I un sostre: el gradle-wrapper.properties de la plantilla android porta
   Gradle 8.14.3 [VERIFICAT 261019], i Gradle 8.14 corre amb Java 24 com a molt (Java 25 demana
   Gradle 9.1, segons la matriu de compatibilitat de Gradle) [NO VERIFICAT en local: Gradle no és
   instal·lat]. Si un dia es puja el Gradle d'android/, es puja també JDK_MAXIM. */
export const JDK_MINIM = 21;
export const JDK_MAXIM = 24;

/** La versió major que diu «java -version» («17.0.17» → 17, «1.8.0_402» → 8), o null. */
export function versioMajorDeJava(eixida) {
  const trobada = String(eixida ?? '').match(/version "(\d+)(?:\.(\d+))?/);
  if (!trobada) return null;
  const major = Number(trobada[1]);
  return major === 1 && trobada[2] ? Number(trobada[2]) : major;
}

/* On es busca, en ordre: JAVA_HOME (si el Mestre l'ha posat), el JBR que porta Android Studio (el
   mateix JDK amb què signa el Mestre, RUNBOOK A4 opció A) i «/usr/libexec/java_home -v 21».
   Compte: este últim, si no troba cap 21, torna un altre JDK amb eixida 0 [VERIFICAT 261019: ha
   tornat el 17]. Per això sempre es mira la versió real de cada candidat. */
export const JBR_D_ANDROID_STUDIO = '/Applications/Android Studio.app/Contents/jbr/Contents/Home';

/** Els JDK candidats per a Gradle, sense repetits i en l'ordre de dalt. */
export function candidatsDeJdk(env = process.env) {
  const candidats = [String(env.JAVA_HOME ?? '').trim(), JBR_D_ANDROID_STUDIO];
  if (process.platform === 'darwin') {
    const r = spawnSync('/usr/libexec/java_home', ['-v', String(JDK_MINIM)], { encoding: 'utf8', timeout: 30000 });
    if (!r.error && r.status === 0) candidats.push(r.stdout.trim());
  }
  return [...new Set(candidats.filter(Boolean))];
}

/** El primer JDK candidat entre JDK_MINIM i JDK_MAXIM: { home, major }, o null si no n'hi ha cap.
    `candidats` és per a les proves; per defecte, els de candidatsDeJdk. */
export function jdkPerAGradle({ env = process.env, candidats = candidatsDeJdk(env) } = {}) {
  for (const home of candidats) {
    const r = spawnSync(path.join(home, 'bin', 'java'), ['-version'], { encoding: 'utf8', timeout: 30000 });
    if (r.error) continue;
    const major = versioMajorDeJava(`${r.stdout || ''}\n${r.stderr || ''}`);
    if (major !== null && major >= JDK_MINIM && major <= JDK_MAXIM) return { home, major };
  }
  return null;
}

/**
 * Carrega i valida el fitxer d'entorn. No llança: torna el codi d'eixida i els problemes, sense
 * cap valor dins dels missatges.
 * @returns {{ cami:string, codi:number, problemes:string[], avisos:string[], valors:Record<string,string> }}
 */
export function carregaEntorn({ arrel, env = process.env }) {
  const cami = camiDelFitxer({ arrel, env });
  const mostra = mostraCami(arrel, cami);
  const resultat = (codi, problemes, valors = {}, avisos = []) => ({ cami, codi, problemes, avisos, valors });
  if (esFitxerDeVite(cami)) {
    return resultat(EIXIDA.FITXER, [`${mostra} és un fitxer que Vite carrega: els secrets de les botigues van a ${FITXER_PER_DEFECTE} o a un fitxer fora del repositori`]);
  }
  let estat;
  try { estat = fs.statSync(cami); } catch {
    return resultat(EIXIDA.FITXER, [`no hi ha cap fitxer d'entorn a ${mostra}: copia ${PLANTILLA_DE_L_ENTORN}, omple'l tu (el Mestre) i fes chmod 600`]);
  }
  if (!estat.isFile()) return resultat(EIXIDA.FITXER, [`${mostra} no és un fitxer`]);
  const problemes = [];
  if (process.platform !== 'win32' && (estat.mode & 0o077) !== 0) {
    problemes.push(`${mostra} té permisos ${(estat.mode & 0o777).toString(8)}: fes chmod 600 (ni el grup ni els altres l'han de poder llegir)`);
  }
  const dins = [path.resolve(cami), real(cami)].find((c) => esDins(arrel, c));
  if (dins) {
    const ignora = gitIgnora(arrel, dins);
    if (ignora === false) problemes.push(`${mostra} és dins del repositori i git NO l'ignora (o ja el seguix): mou-lo fora o revisa .gitignore`);
    if (ignora === null) problemes.push(`${mostra} és dins del repositori i no s'ha pogut comprovar que git l'ignore`);
  }
  if (problemes.length) return resultat(EIXIDA.FITXER, problemes);
  let text;
  try { text = fs.readFileSync(cami, 'utf8'); } catch { return resultat(EIXIDA.FITXER, [`no es pot llegir ${mostra}`]); }
  const { valors, errors } = analitzaEntorn(text);
  const dolentes = [
    ...errors.map(({ linia, nom, motiu }) => `línia ${linia}${nom ? ` (${nom})` : ''}: ${motiu}`),
    ...prohibides(valors).map(({ nom, motiu }) => `${nom}: ${motiu}`)
  ];
  if (dolentes.length) return resultat(EIXIDA.PROHIBIDA, dolentes);
  const avisos = desconegudes(valors).map((nom) => `${nom}: este script no la fa servir`);
  return resultat(EIXIDA.BE, [], valors, avisos);
}

/**
 * Comprova les variables obligatòries dels `contextos` i els fitxers i carpetes que nomenen.
 * @returns {{ codi:number, problemes:string[] }}
 */
export function comprovaVariables({ arrel, valors, contextos }) {
  const problemes = falten(valors, contextos).map((nom) => `falta ${nom} (o és buida)`);
  for (const [nom, { tipus, per, extensions }] of Object.entries(VARIABLES)) {
    if (!per.some((context) => contextos.includes(context))) continue;
    const valor = (valors[nom] || '').trim();
    if (!valor) continue;
    if (tipus === 'empremta' && !normalitzaEmpremta(valor)) problemes.push(`${nom} no és una empremta SHA-256`);
    if (tipus !== 'ruta' && tipus !== 'directori') continue;
    const cami = path.resolve(arrel, ambCasa(valor));
    let estat;
    try { estat = fs.statSync(cami); } catch { problemes.push(`${nom}: el ${tipus === 'ruta' ? 'fitxer' : 'directori'} no existix`); continue; }
    if ([cami, real(cami)].some((c) => esDins(arrel, c))) {
      problemes.push(`${nom}: és dins del repositori; les claus i els binaris viuen FORA (RUNBOOK §1)`);
      continue;
    }
    if (tipus === 'directori' && !estat.isDirectory()) problemes.push(`${nom}: no és un directori`);
    if (tipus === 'ruta') {
      if (!estat.isFile()) problemes.push(`${nom}: no és un fitxer`);
      else if (extensions && !extensions.some((ext) => cami.toLowerCase().endsWith(ext))) problemes.push(`${nom}: s'esperava ${extensions.join(' o ')}`);
      else if (process.platform !== 'win32' && (estat.mode & 0o077) !== 0) problemes.push(`${nom}: el fitxer té permisos ${(estat.mode & 0o777).toString(8)}; fes chmod 600`);
    }
  }
  /* AuthKey_<KEY_ID>.p8 és el nom amb què App Store Connect la dona i el que altool busca per
     --api-key en les seues carpetes fixes (./private_keys, ~/private_keys, ~/.private_keys,
     ~/.appstoreconnect/private_keys i, l'última, $API_PRIVATE_KEYS_DIR). El script no se'n fia
     de la busca: li passa la ruta amb --p8-file-path [VERIFICAT 261019 a «xcrun altool --help»,
     altool 27.0.5 d'Xcode 27.1]. */
  if (contextos.includes('ios') && valors.SDP_ASC_KEY_PATH && valors.SDP_ASC_KEY_ID
      && path.basename(ambCasa(valors.SDP_ASC_KEY_PATH)) !== `AuthKey_${valors.SDP_ASC_KEY_ID.trim()}.p8`) {
    problemes.push('SDP_ASC_KEY_PATH s\'ha de dir AuthKey_<SDP_ASC_KEY_ID>.p8: altool la busca per eixe nom');
  }
  return { codi: problemes.length ? EIXIDA.FALTA : EIXIDA.BE, problemes };
}

/** La ruta absoluta d'una variable de tipus ruta o directori. */
export const rutaDe = (arrel, valors, nom) => path.resolve(arrel, ambCasa(String(valors[nom] ?? '').trim()));

/**
 * Executa una ordre sense shell. Mostra l'ordre emmascarada i filtra l'eixida línia a línia amb
 * la mateixa màscara (amb `arrel`, la de les rutes resoltes: emmascara). `entornExtra` només
 * arriba al procés fill (mai s'imprimix).
 * `eixida` és el text emmascarat (el que s'ha vist). `crua` és el text tal qual: només per a
 * analitzar-lo dins del script (l'equip de codesign, l'empremta de keytool), mai per a imprimir-lo.
 * Si s'analitzara l'emmascarat, «TeamIdentifier=<SDP_APPLE_TEAM_ID>» faria fallar l'equip bo.
 * @returns {Promise<{ codi:number, eixida:string, crua:string }>}
 */
export function executa(ordre, args, { cwd, valors = {}, arrel = null, entornExtra = {}, mostra = true } = {}) {
  if (mostra) process.stdout.write(`$ ${mostraOrdre(ordre, args, valors, arrel)}\n`);
  return new Promise((resol) => {
    let fill;
    try {
      fill = spawn(ordre, args, { cwd, shell: false, env: { ...process.env, ...entornExtra }, stdio: ['ignore', 'pipe', 'pipe'] });
    } catch {
      resol({ codi: 127, eixida: '', crua: '' });
      return;
    }
    const vistes = [];
    const crues = [];
    const filtre = (desti) => {
      let pendent = '';
      const escriu = (linia) => {
        const neta = emmascara(linia, valors, arrel);
        crues.push(linia);
        vistes.push(neta);
        desti.write(`${neta}\n`);
      };
      return {
        dades: (tros) => {
          pendent += tros.toString('utf8');
          const linies = pendent.split('\n');
          pendent = linies.pop();
          for (const linia of linies) escriu(linia);
        },
        final: () => {
          if (pendent) escriu(pendent);
          pendent = '';
        }
      };
    };
    const eix = filtre(process.stdout);
    const err = filtre(process.stderr);
    const acaba = (codi) => resol({ codi, eixida: vistes.join('\n'), crua: crues.join('\n') });
    fill.stdout.on('data', eix.dades);
    fill.stderr.on('data', err.dades);
    fill.on('error', () => acaba(127));
    fill.on('close', (codi) => { eix.final(); err.final(); acaba(codi ?? 1); });
  });
}

/** Imprimix una llista de problemes i torna el codi, per a acabar el script. */
export function plega(codi, titol, problemes = []) {
  process.stderr.write(`\n✗ ${titol}\n${problemes.map((p) => `  · ${p}`).join('\n')}${problemes.length ? '\n' : ''}`);
  return codi;
}
