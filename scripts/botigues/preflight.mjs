/**
 * scripts/botigues/preflight.mjs — comprovacions prèvies a qualsevol pujada (261003).
 *
 * Instal·lat el 261019 (Fase C) des de nous/botigues/preflight.mjs.txt del laboratori
 * 261003_1330_empaquetat_mobil_claude. Proves: tests/botigues.test.mjs.
 *
 *   node scripts/botigues/preflight.mjs --plataforma ios|android|totes [--signa]
 *
 * Només llig: el fitxer d'entorn (mai n'imprimix cap valor), les rutes que nomena, les eines i
 * l'estat de l'arbre. No compila, no signa i no puja res. Ix amb el codi de la primera família
 * que falla, en este ordre: fitxer (3), variable prohibida (4), variable o fitxer que falta (5),
 * eina (6), arbre (7). Els codis són a entorn.mjs (EIXIDA).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  EIXIDA, JDK_MAXIM, JDK_MINIM, analitzaArguments, arbreNet, arrelDelRepositori, carregaEntorn, comprovaVariables,
  jdkPerAGradle, llegixAjuda, mateixContingut, mostraCami, plega
} from './entorn.mjs';

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

/* Les dues consultes a eines de fora que fa el preflight. Les proves les canvien per unes de
   fingides, perquè la suite no arranque cap eina (ni fastlane, ni keytool, ni cap JDK). */
const CONSULTES = Object.freeze({ llegixAjuda, jdkPerAGradle });

/**
 * Totes les comprovacions d'una o dues plataformes. No llança i no imprimix valors.
 * @param {{ arrel: string, plataformes: ('ios'|'android')[], signa?: boolean, env?: object, consultes?: object }} opcions
 * @returns {{ codi:number, linies:string[], valors:Record<string,string>, fastlane:boolean, jdk:{home:string, major:number}|null }}
 */
export function preflight({ arrel, plataformes, signa = false, env = process.env, consultes = {} }) {
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
  const contextos = [...plataformes, ...(signa ? ['android-signa'] : [])];
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
  if (!fs.existsSync(index)) {
    mal(EIXIDA.ARBRE, 'no hi ha dist-natiu/index.html: npm run build:natiu');
  } else {
    be('dist-natiu/index.html');
    for (const plataforma of plataformes) {
      const copia = path.join(arrel, ...COPIA_NATIVA[plataforma]);
      if (mateixContingut(index, copia)) be(`${plataforma}: la còpia de dist-natiu/ és la mateixa`);
      else mal(EIXIDA.ARBRE, `${plataforma}: ${COPIA_NATIVA[plataforma].join('/')} no és la de dist-natiu/: npx cap sync ${plataforma}`);
    }
  }
  if (plataformes.includes('ios') && !projecteIos(arrel)) mal(EIXIDA.ARBRE, 'no hi ha ios/App/App.xcworkspace ni ios/App/App.xcodeproj: npx cap add ios');
  if (plataformes.includes('android') && !fs.existsSync(path.join(arrel, 'android', 'gradlew'))) mal(EIXIDA.ARBRE, 'no hi ha android/gradlew: npx cap add android');

  const ordre = [EIXIDA.FITXER, EIXIDA.PROHIBIDA, EIXIDA.FALTA, EIXIDA.EINA, EIXIDA.ARBRE];
  const codi = ordre.find((c) => familia[c]) ?? EIXIDA.BE;
  return { codi, linies, valors: entorn.codi === EIXIDA.BE ? entorn.valors : {}, fastlane, jdk };
}

/** L'arrel del repositori, si és la del script. */
export function arrelComprovada() {
  const arrel = arrelDelRepositori(ARREL_DEL_SCRIPT);
  let esperada = ARREL_DEL_SCRIPT;
  try { esperada = fs.realpathSync(ARREL_DEL_SCRIPT); } catch { /* es compara tal qual */ }
  return arrel && arrel === esperada ? arrel : null;
}

function main(argv) {
  const { opcions, errors } = analitzaArguments(argv, { plataforma: true, signa: false, ajuda: false });
  if (opcions.ajuda) {
    process.stdout.write('node scripts/botigues/preflight.mjs --plataforma ios|android|totes [--signa]\n');
    return EIXIDA.BE;
  }
  const plataformes = { ios: ['ios'], android: ['android'], totes: ['ios', 'android'] }[opcions.plataforma];
  if (errors.length || !plataformes) return plega(EIXIDA.US, 'Ús: --plataforma ios|android|totes [--signa]', errors);
  if (opcions.signa && !plataformes.includes('android')) return plega(EIXIDA.US, '--signa només té sentit amb Android');
  const arrel = arrelComprovada();
  if (!arrel) return plega(EIXIDA.EINA, 'git no reconeix l\'arrel del repositori on viu este script');
  const resultat = preflight({ arrel, plataformes, signa: Boolean(opcions.signa) });
  process.stdout.write(`${resultat.linies.join('\n')}\n`);
  process.stdout.write(resultat.codi === EIXIDA.BE ? '\nPreflight net.\n' : `\nPreflight amb problemes: eixida ${resultat.codi}.\n`);
  return resultat.codi;
}

const principal = (() => {
  try { return process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href; } catch { return false; }
})();
if (principal) process.exitCode = main(process.argv.slice(2));
