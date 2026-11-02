/**
 * scripts/botigues/puja-android.mjs — AAB de publicació, verificació de la signatura i pujada a la
 * prova interna de Google Play (RUNBOOK_BOTIGUES_IA.txt, A4-A5). 261003.
 *
 * Instal·lat el 261019 (Fase C) des de nous/botigues/puja-android.mjs.txt del laboratori
 * 261003_1330_empaquetat_mobil_claude. Proves: tests/botigues.test.mjs i, per al canal de
 * producció (B9, marató 261101_2143), tests/botigues.produccio.android.test.js.
 *
 *   node scripts/botigues/puja-android.mjs --versio 1.0.0 --build 7                     en sec
 *   node scripts/botigues/puja-android.mjs --versio 1.0.0 --build 7 --compila           bundleRelease i verificació
 *   node scripts/botigues/puja-android.mjs --versio 1.0.0 --build 7 --confirma=1.0.0+7  verifica i PUJA (esborrany intern)
 *
 * B9 · --canal produccio deixa l'AAB en ESBORRANY a la pista production (mai completed ni per fases:
 * «Envia a revisió» és del Mestre, P9). El «sí» va lligat al canal i al binari:
 * --confirma=produccio:VERSIO+BUILD@<12 primers del sha256 de l'AAB>, que dona el rebut en sec (si
 * l'AAB ja l'has signat a Android Studio) o el de --compila; --compila i --confirma no van junts.
 * Cada pujada feta s'apunta a SDP_BUILDS_DIR/pujades.jsonl (fora del repositori), i un build que ja
 * hi és no es torna a pujar. Un compte personal de Play només publica a producció després de la
 * prova tancada (12 provadors × 14 dies, P0-23) o amb un compte d'organització (D-B9-2).
 *
 * Per defecte no fa res: preflight, versió de build.gradle, pla. La signatura és del Mestre
 * (RUNBOOK A4, opció A: Android Studio o el seu gradlew, amb les contrasenyes que posa ell). Si el
 * Mestre decidix que la signe el script, --compila llig la keystore per RUTA i les dues
 * contrasenyes del fitxer d'entorn, i les passa NOMÉS a l'entorn del procés de Gradle (amb
 * --no-daemon, perquè cap dimoni se les quede); mai a la línia d'ordres ni a la pantalla.
 * La pujada va per fastlane supply amb el JSON del compte de servei per RUTA; sense fastlane,
 * el script imprimix els passos per a fer-la a mà. No hi ha cap signatura JWT feta a mà.
 * Només --confirma=VERSIO+BUILD puja, i deixa la versió en ESBORRANY a la pista interna:
 * promoure-la o publicar-la és del Mestre (RUNBOOK P9).
 *
 * [NO VERIFICAT] les opcions de fastlane supply: el 261019 fastlane no és instal·lat en este Mac. El
 * script les busca a l'ajuda abans de pujar i, si en falta alguna, para (eixida 6).
 * Gradle compila amb el JDK que tria el preflight (del JDK_MINIM al JDK_MAXIM, 21-24, a entorn.mjs), passat per JAVA_HOME
 * només al procés de Gradle: el java del PATH d'este Mac és un 17 i Capacitor 8 compila amb Java 21
 * [VERIFICAT 261019].
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  BUILD, CANALS, EIXIDA, SEGELL, VERSIO, analitzaArguments, analitzaConfirmacio, apuntaPujada, avisDelRegistre, confirmacioEsperada,
  empremtaDeKeytool, guardaDelRegistre, REBUTS, executa, llegixAjuda, llegixDelZip, mostraCami, mostraOrdre, normalitzaEmpremta,
  opcionsQueFalten, plega, problemaDelPaquet, rutaDe, sha256DeFitxer, versioDeGradle
} from './entorn.mjs';
import { arrelComprovada, preflight } from './preflight.mjs';

import { problemaDeVersioClient } from './versio-client.mjs';

const ADMESOS = Object.freeze({ versio: true, build: true, compila: false, confirma: true, canal: true, push: false, ajuda: false });
const US = 'Ús: --versio X.Y.Z --build N [--canal intern|produccio] [--push] [--compila] [--confirma=X.Y.Z+N | --confirma=produccio:X.Y.Z+N@<sha12>]';
export const AAB = Object.freeze(['android', 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab']);
export const OPCIONS_SUPPLY = Object.freeze(['--aab', '--track', '--release_status', '--package_name', '--json_key',
  '--skip_upload_metadata', '--skip_upload_images', '--skip_upload_screenshots', '--skip_upload_changelogs', '--validate_only']);

/** El pla d'A4-A5 per a un canal (intern per defecte). Pur: no toca el disc. B9 · La pista és
    production o internal segons el canal, i el llançament és SEMPRE un esborrany (D-B9-3). */
export function planAndroid({ arrel, valors, canal = CANALS.INTERN }) {
  const aab = path.join(arrel, ...AAB);
  const pista = canal === CANALS.PRODUCCIO ? 'production' : 'internal';
  const supply = (nomesValida) => ['fastlane', ['supply', '--aab', aab, '--track', pista, '--release_status', 'draft',
    '--package_name', valors.SDP_APP_ID.trim(), '--json_key', rutaDe(arrel, valors, 'SDP_PLAY_JSON_KEY_PATH'),
    '--skip_upload_metadata', 'true', '--skip_upload_images', 'true', '--skip_upload_screenshots', 'true',
    '--skip_upload_changelogs', 'true', '--validate_only', nomesValida ? 'true' : 'false']];
  // Les quatre variables les llig la signingConfig de release d'android/app/build.gradle (LLEGIU.txt §4).
  const entornDeSignatura = () => ({
    SDP_ANDROID_KEYSTORE_PATH: rutaDe(arrel, valors, 'SDP_ANDROID_KEYSTORE_PATH'),
    SDP_ANDROID_KEY_ALIAS: valors.SDP_ANDROID_KEY_ALIAS,
    SDP_ANDROID_KEYSTORE_PASSWORD: valors.SDP_ANDROID_KEYSTORE_PASSWORD,
    SDP_ANDROID_KEY_PASSWORD: valors.SDP_ANDROID_KEY_PASSWORD
  });
  return {
    aab,
    pista,
    compila: [path.join(arrel, 'android', 'gradlew'), ['--no-daemon', 'bundleRelease']],
    entornDeSignatura,
    // Tot el que rep el procés de Gradle a més del seu entorn: el JDK que ha triat el preflight i la signatura.
    entornDeGradle: (jdkHome) => ({ JAVA_HOME: jdkHome, ...entornDeSignatura() }),
    certificat: ['keytool', ['-printcert', '-jarfile', aab]],
    valida: supply(true),
    puja: supply(false),
    entornFastlane: { FASTLANE_SKIP_UPDATE_CHECK: '1', FASTLANE_OPT_OUT_USAGE: '1' }
  };
}

export const PASSOS_A_MA = Object.freeze([
  'Play Console › Sóc de Poble › Test and release › Testing › Internal testing › Create new release [NO VERIFICAT el camí].',
  'Pujar android/app/build/outputs/bundle/release/app-release.aab (el mateix fitxer que diu el rebut, amb el mateix sha256).',
  'Nom de la versió: VERSIO (BUILD). Notes: les del laboratori, sense dades personals.',
  'Desar com a esborrany. Revisar-lo i desplegar-lo a la prova interna és del Mestre (RUNBOOK P9).',
  'Si és el PRIMER AAB d\'esta app, l\'API no el pot crear: este pas a mà és obligatori (RUNBOOK H-G5).'
]);

/* B9 · Producció a mà (sense fastlane) i després d'una pujada feta: sempre un esborrany, i
   «Envia a revisió» és del Mestre (P9). Cap desplegament per fases. */
export const PASSOS_A_MA_PRODUCCIO = Object.freeze([
  'Play Console › Sóc de Poble › Test and release › Production › Create new release [NO VERIFICAT el camí].',
  'Pujar android/app/build/outputs/bundle/release/app-release.aab: el mateix fitxer, amb el mateix sha256, que diu el rebut i el «sí».',
  'Nom de la versió: VERSIO (BUILD). Notes: les del laboratori, sense dades personals.',
  'Desar com a ESBORRANY. Revisar-lo i «Envia a revisió» és del Mestre (RUNBOOK P9).',
  'Si el compte (personal) no té accés a producció: primer la prova tancada de 12 provadors durant 14 dies (P0-23) o un compte d\'organització (D-B9-2).',
  'Si és el PRIMER AAB d\'esta app, potser s\'ha de pujar a mà (RUNBOOK H-G5) [NO VERIFICAT].'
]);
export const PASSOS_DESPRES_PRODUCCIO = Object.freeze([
  'Play Console › Sóc de Poble › Test and release › Production: obri l\'esborrany VERSIO (BUILD) [NO VERIFICAT el camí].',
  'Revisa les notes, els països i la fitxa de la botiga.',
  '«Envia a revisió»: ho fa el Mestre (RUNBOOK P9). El script no publica ni fa cap desplegament per fases.'
]);

/** Una llista de passos numerada, amb VERSIO i BUILD posats. */
const enumera = (passos, versio, build) => passos.map((p, i) => `  ${i + 1}. ${p}`).join('\n').replace(/VERSIO/g, versio).replace(/BUILD/g, build);

/* BOT-A4 (261025) · L'AAB és un zip i porta els recursos del mòdul base a base/assets/: la còpia de
   dist-natiu/ que fa cap sync hi és a base/assets/public/ [VERIFICAT 261025 en l'AAB de 261023:
   base/assets/public/index.html, amb deflate]. Si el segell de dins no és el de dist-natiu/, l'AAB
   s'ha signat abans de l'últim build o de l'últim cap sync, i no es puja. */
export const SEGELL_DE_L_AAB = 'base/assets/public/segell.json';

/** Per què l'AAB no ix del dist-natiu/ que ha contrastat el preflight, o null si en ix. */
export function problemaDeLAab(arrel, aab) {
  return problemaDelPaquet(arrel, llegixDelZip(aab, SEGELL_DE_L_AAB), 'app-release.aab');
}

/* BOT-A4 (261025) · El commit és el del segell de dist-natiu/ (el que el preflight ha contrastat
   amb HEAD), no el HEAD d'ara; main només imprimix el rebut quan l'AAB porta eixe segell. */
export function rebut({ segell, versio, build, aab, pujat, canal = CANALS.INTERN, sha256 = null }) {
  /* B9 · main passa el sha256 de l'AAB verificat; sense, es calcula com abans. En producció, el
     rebut porta també el «sí» exacte per a este AAB. */
  const empremta = sha256 ?? (fs.existsSync(aab) ? sha256DeFitxer(aab) : null);
  const produccio = canal === CANALS.PRODUCCIO;
  return ['', `REBUT (per a ${REBUTS}/AAMMDD_HHMM_pujada_android.txt; cap secret, cap adreça):`,
    `  commit: ${segell?.commit ?? 'desconegut'} (el de ${SEGELL.join('/')}, que porta l'AAB)`, `  versio: ${versio}  build (versionCode): ${build}`,
    `  sha256 de l'AAB: ${empremta ?? 'sense AAB'}`, `  canal: ${canal}`, `  hora: ${new Date().toISOString()}`,
    `  pujat a Google Play (esborrany, ${produccio ? 'pista production' : 'pista interna'}): ${pujat ? 'sí' : 'no'}`,
    ...(produccio && empremta && !pujat ? [`  «sí» per a pujar ESTE AAB: --canal produccio --confirma=${confirmacioEsperada(versio, build, { canal, sha256: empremta })}`] : []),
    '  qui ha dit «sí»: (ho escriu qui executa)', ''].join('\n');
}

export async function main(argv) {
  const { opcions, errors } = analitzaArguments(argv, ADMESOS);
  if (opcions.ajuda) {
    process.stdout.write(`node scripts/botigues/puja-android.mjs ${US.slice(4)}\n`);
    return EIXIDA.BE;
  }
  const { versio, build } = opcions;
  if (errors.length || !VERSIO.test(versio ?? '') || !BUILD.test(build ?? '')) {
    return plega(EIXIDA.US, US, errors);
  }
  /* B9 · Les guardes del canal, en este ordre i abans de tocar res: canal conegut, en producció el
     «sí» en una execució a banda de --compila, i un --confirma amb la forma d'este canal. */
  const canal = opcions.canal ?? CANALS.INTERN;
  if (!Object.values(CANALS).includes(canal)) return plega(EIXIDA.US, `--canal ha de ser ${Object.values(CANALS).join(' o ')}`);
  const produccio = canal === CANALS.PRODUCCIO;
  if (produccio && opcions.compila && opcions.confirma !== undefined) {
    return plega(EIXIDA.US, 'en producció, primer el rebut amb el sha256 (en sec si signes tu a Android Studio, o --compila); el «sí» va en una altra execució');
  }
  const confirmacio = opcions.confirma === undefined ? null : analitzaConfirmacio(opcions.confirma, { versio, build, canal });
  if (confirmacio && !confirmacio.valida) {
    const pista = produccio ? ' i per a un sol AAB (els 12 primers caràcters del sha256 que diu el rebut); un «sí» intern no val per a producció'
      : (String(opcions.confirma).startsWith('produccio:') ? ' (este és un «sí» de producció: va amb --canal produccio)' : '');
    return plega(EIXIDA.CONFIRMACIO, `--confirma ha de ser exactament ${confirmacioEsperada(versio, build, { canal })}: un «sí» val per a una sola pujada${pista}`);
  }
  // P0-23 · El build porta la versió del client que l'app dirà al node (versio-client.mjs).
  const deLaVersio = problemaDeVersioClient(build);
  if (deLaVersio) return plega(EIXIDA.ARBRE, deLaVersio);
  const arrel = arrelComprovada();
  if (!arrel) return plega(EIXIDA.EINA, 'git no reconeix l\'arrel del repositori on viu este script');

  const pre = preflight({ arrel, plataformes: ['android'], signa: Boolean(opcions.compila), canal, push: Boolean(opcions.push) });
  process.stdout.write(`${pre.linies.join('\n')}\n`);
  if (pre.codi !== EIXIDA.BE) return plega(pre.codi, 'Preflight amb problemes: no es fa res.');
  const valors = pre.valors;

  /* B9 · El registre de pujades (SDP_BUILDS_DIR/pujades.jsonl): un build ja pujat no es torna a pujar,
     i el que ja és a la prova interna es promou des de Play Console. */
  const registre = guardaDelRegistre({ arrel, valors, canal, plataforma: 'android', versio, build });
  for (const text of registre.avisos) process.stdout.write(`  ! ${text}\n`);
  if (registre.codi !== EIXIDA.BE) return plega(registre.codi, 'El registre de pujades no deixa seguir: no es fa res.', registre.problemes);

  // El versionCode i el versionName que es compilen han de ser els que es confirmen.
  const gradle = path.join(arrel, 'android', 'app', 'build.gradle');
  const deGradle = fs.existsSync(gradle) ? versioDeGradle(fs.readFileSync(gradle, 'utf8')) : { versio: null, build: null };
  if (deGradle.versio !== versio || deGradle.build !== build) {
    return plega(EIXIDA.ARBRE, `android/app/build.gradle diu versionName ${deGradle.versio} i versionCode ${deGradle.build}, no ${versio} i ${build} (RUNBOOK A1)`);
  }

  const pla = planAndroid({ arrel, valors, canal });
  process.stdout.write(['', 'PLA (cada valor del fitxer d\'entorn es mostra com a <NOM>):',
    produccio ? `  P  canal produccio: pista ${pla.pista}, sempre en esborrany (--track ${pla.pista} --release_status draft); «Envia a revisió» és del Mestre (P9)` : '',
    opcions.compila
      ? `  A4 JAVA_HOME=${mostraOrdre(mostraCami(arrel, pre.jdk.home), [], valors, arrel)} SDP_ANDROID_KEYSTORE_PATH SDP_ANDROID_KEY_ALIAS SDP_ANDROID_KEYSTORE_PASSWORD SDP_ANDROID_KEY_PASSWORD (només a l'entorn de Gradle) ${mostraOrdre(...pla.compila, valors, arrel)}`
      : '  A4 (el Mestre signa l\'AAB: Android Studio › Generate Signed Bundle, o el seu gradlew; o bé --compila)',
    `  V  ${mostraOrdre(...pla.certificat, valors, arrel)} → SHA-256 = <SDP_ANDROID_UPLOAD_CERT_SHA256>`,
    pre.fastlane ? `  A5 ${mostraOrdre(...pla.valida, valors, arrel)}` : '  A5 sense fastlane: pujada a mà (els passos ixen en confirmar)',
    pre.fastlane ? `  A5 ${mostraOrdre(...pla.puja, valors, arrel)}` : '', ''].filter((l, i, tot) => l || i === tot.length - 1).join('\n'));

  const enSec = !opcions.compila && opcions.confirma === undefined;
  if (enSec && !produccio) {
    process.stdout.write(`En sec: no s'ha fet res. Per a compilar i signar amb les claus del fitxer: --compila. Per a pujar, amb el «sí» del Mestre per a ESTA pujada: --confirma=${confirmacioEsperada(versio, build)}\n`);
    return EIXIDA.BE;
  }
  /* ARB-B9-04 · En sec a producció no es compila ni es puja res, però si l'AAB ja hi és (signat pel
     Mestre a Android Studio), es verifica en local (segell i keytool, només lectura) i el rebut dona
     el «sí» exacte. Sense AAB, només el pla i què cal fer. */
  if (enSec && !fs.existsSync(pla.aab)) {
    process.stdout.write(`En sec (producció: pista ${pla.pista}, esborrany): no hi ha app-release.aab. Signa l'AAB (Android Studio › Build › Generate Signed Bundle) o fes --compila, i torna a executar esta ordre en sec per a tindre el «sí» (${confirmacioEsperada(versio, build, { canal })}).\n`);
    return EIXIDA.BE;
  }

  if (opcions.compila) {
    const resultat = await executa(...pla.compila, { cwd: path.join(arrel, 'android'), valors, arrel, entornExtra: pla.entornDeGradle(pre.jdk.home) });
    if (resultat.codi !== 0) return plega(EIXIDA.EXTERNA, 'gradlew bundleRelease ha fallat');
  }

  // Verificació local: l'AAB existix, ix del dist-natiu/ del preflight i el signa la clau de pujada que coneix Play.
  if (!fs.existsSync(pla.aab)) return plega(EIXIDA.ARBRE, 'no hi ha app-release.aab: signa\'l tu (Android Studio) o fes --compila');
  const deLAab = problemaDeLAab(arrel, pla.aab);
  if (deLAab) return plega(EIXIDA.ARBRE, `${deLAab}: torna a signar-lo després de l'últim cap sync (Android Studio) o fes --compila`);
  process.stdout.write(`✓ l'AAB porta el ${SEGELL.join('/')} del preflight\n`);
  /* En producció, l'eixida de keytool (el propietari del certificat) no es pinta: només se'n llig l'empremta. */
  const certificat = await executa(...pla.certificat, { valors, arrel, mostra: false, eco: !produccio });
  const empremta = empremtaDeKeytool(certificat.crua);
  if (certificat.codi !== 0 || !empremta) return plega(EIXIDA.EXTERNA, 'keytool -printcert no ha donat cap empremta SHA-256 (l\'AAB no està signat?)');
  if (empremta !== normalitzaEmpremta(valors.SDP_ANDROID_UPLOAD_CERT_SHA256)) {
    return plega(EIXIDA.VERIFICACIO, 'l\'AAB està signat amb una altra clau que la de pujada (SDP_ANDROID_UPLOAD_CERT_SHA256): no es puja');
  }
  process.stdout.write('✓ signat amb la clau de pujada de SDP_ANDROID_UPLOAD_CERT_SHA256\n');

  // B9 · El sha256 de l'AAB verificat: el rebut el diu, i el «sí» de producció hi va lligat (D-B9-7).
  const sha256 = sha256DeFitxer(pla.aab);
  if (opcions.confirma === undefined) {
    process.stdout.write(rebut({ segell: pre.segell, versio, build, aab: pla.aab, pujat: false, canal, sha256 }));
    return EIXIDA.BE;
  }
  if (produccio && sha256.slice(0, 12) !== confirmacio.sha12) {
    return plega(EIXIDA.CONFIRMACIO, `l'AAB d'ara no és el del «sí»: el seu sha256 comença per ${sha256.slice(0, 12)}, no per ${confirmacio.sha12}; torna a executar l'ordre en sec per al rebut d'este AAB`);
  }

  if (!pre.fastlane) {
    process.stdout.write(`\nNo hi ha fastlane: la pujada la fa el Mestre a mà.\n${enumera(produccio ? PASSOS_A_MA_PRODUCCIO : PASSOS_A_MA, versio, build)}\n`);
    process.stdout.write(rebut({ segell: pre.segell, versio, build, aab: pla.aab, pujat: false, canal, sha256 }));
    return EIXIDA.EINA;
  }
  const falten = opcionsQueFalten(llegixAjuda('fastlane', ['supply', '--help']), OPCIONS_SUPPLY);
  if (falten.length) {
    return plega(EIXIDA.EINA, 'fastlane supply no té les opcions del pla (Fusible: consulta la documentació oficial i esmena el script):', falten);
  }
  if ((await executa(...pla.valida, { cwd: arrel, valors, arrel, entornExtra: pla.entornFastlane })).codi !== 0) {
    return plega(EIXIDA.EXTERNA, produccio
      ? 'fastlane supply --validate_only (pista production) ha fallat: no es puja res. Un compte personal sense accés a producció necessita la prova tancada de 12 provadors × 14 dies (P0-23) o un compte d\'organització (D-B9-2); si no, permisos del compte de servei (RUNBOOK H-G4) o primer AAB (H-G5)'
      : 'fastlane supply --validate_only ha fallat: no es puja res (permisos del compte de servei? RUNBOOK H-G4; primer AAB? H-G5)');
  }
  /* B9 · En producció, l'AAB ha de continuar sent el del «sí» abans i després de pujar-lo (la idea
     de la còpia fixada del kit de Codex, aquí només com a comprovació). */
  const intacte = () => !produccio || sha256DeFitxer(pla.aab) === sha256;
  if (!intacte()) return plega(EIXIDA.VERIFICACIO, 'l\'AAB ha canviat després de validar-lo: no es puja res');
  if ((await executa(...pla.puja, { cwd: arrel, valors, arrel, entornExtra: pla.entornFastlane })).codi !== 0) {
    return plega(EIXIDA.EXTERNA, 'fastlane supply ha fallat');
  }
  if (!intacte()) {
    return plega(EIXIDA.VERIFICACIO, 'l\'AAB ha canviat durant la pujada: cap rebut ni registre; el Mestre mira a Play Console quin AAB ha arribat');
  }
  // B9 · La pujada s'apunta al registre DESPRÉS de fer-se (mai abans).
  if (registre.carpeta) {
    const avis = avisDelRegistre(apuntaPujada(registre.carpeta, { plataforma: 'android', canal, versio, build, sha256, commit: pre.segell?.commit ?? null, data: new Date().toISOString() }));
    if (avis) process.stderr.write(`avís: ${avis}\n`);
  }
  process.stdout.write(produccio
    ? `✓ pujat com a ESBORRANY a la pista production. Enviar-lo a revisió és del Mestre (RUNBOOK P9):\n${enumera(PASSOS_DESPRES_PRODUCCIO, versio, build)}\n`
    : '✓ pujat com a ESBORRANY a la prova interna. Revisar-lo i desplegar-lo és del Mestre (RUNBOOK P9).\n');
  process.stdout.write(rebut({ segell: pre.segell, versio, build, aab: pla.aab, pujat: true, canal, sha256 }));
  return EIXIDA.BE;
}

const principal = (() => {
  try { return process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href; } catch { return false; }
})();
if (principal) main(process.argv.slice(2)).then((codi) => { process.exitCode = codi; });
