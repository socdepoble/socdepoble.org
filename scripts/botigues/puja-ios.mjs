/**
 * scripts/botigues/puja-ios.mjs — arxiu, exportació i pujada a App Store Connect amb la clau
 * d'API (RUNBOOK_BOTIGUES_IA.txt, A6-A8). 261003.
 *
 * Instal·lat el 261019 (Fase C) des de nous/botigues/puja-ios.mjs.txt del laboratori
 * 261003_1330_empaquetat_mobil_claude. Proves: tests/botigues.test.mjs.
 *
 *   node scripts/botigues/puja-ios.mjs --versio 1.0.0 --build 7                    en sec: comprova i mostra el pla
 *   node scripts/botigues/puja-ios.mjs --versio 1.0.0 --build 7 --compila          arxiva, exporta i verifica; NO puja
 *   node scripts/botigues/puja-ios.mjs --versio 1.0.0 --build 7 --confirma=1.0.0+7 valida i PUJA l'IPA ja exportat
 *
 * Per defecte no fa res: comprova (preflight), verifica que les eines tenen les opcions que farà
 * servir i mostra el pla amb cada valor del fitxer d'entorn canviat per <NOM>. --compila fa A6 i
 * A7 (Xcode pot crear perfils al compte de l'equip: -allowProvisioningUpdates). Només
 * --confirma=VERSIO+BUILD puja, i només eixe build: el «sí» del Mestre en eixe moment, per a eixa
 * pujada (RUNBOOK §4, S4). La clau .p8 es passa per RUTA (-authenticationKeyPath a xcodebuild,
 * --p8-file-path a altool); el seu contingut no es llig mai.
 *
 * Les opcions d'xcodebuild i d'altool: el script les busca a l'ajuda de cada eina abans de fer res
 * i, si en falta alguna, para (eixida 6). Llavors es consulta la documentació oficial i s'esmena el
 * script; no s'endevina (AGENTS §10). [VERIFICAT 261019 amb Xcode 27.1 (27A9275): «xcodebuild -help»
 * porta les catorze d'OPCIONS_XCODEBUILD. L'altool que porta (27.0.5 (2.1)) ja no porta --file,
 * --type, --apiKey ni --apiIssuer per a pujar: --validate-app <fitxer>, --upload-app -f <fitxer>,
 * --api-key i --api-issuer, i cap tipus de plataforma. Esmenat ací; el pla de 261003 fallava amb
 * l'eixida 6. La clau va per --p8-file-path, de la secció AUTHENTICATION de la mateixa ajuda:
 * API_PRIVATE_KEYS_DIR és l'última carpeta on altool la busca, després de ./private_keys i tres
 * de la carpeta de l'usuari, i així podia agafar un altre fitxer que el que comprova el preflight.]
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  BUILD, EIXIDA, REBUTS, VERSIO, analitzaArguments, commitCurt, confirmacioEsperada, equipDeCodesign,
  executa, exportOptionsPlist, llegixAjuda, mostraOrdre, opcionsQueFalten, plega, rutaDe, sha256DeFitxer
} from './entorn.mjs';
import { arrelComprovada, preflight, projecteIos } from './preflight.mjs';

const ADMESOS = Object.freeze({ versio: true, build: true, compila: false, confirma: true, ajuda: false });

/* Les opcions que el pla fa servir, per a buscar-les a l'ajuda abans de res. */
export const OPCIONS_XCODEBUILD = Object.freeze(['-workspace', '-project', '-scheme', '-configuration', '-destination',
  '-archivePath', '-allowProvisioningUpdates', '-authenticationKeyPath', '-authenticationKeyID',
  '-authenticationKeyIssuerID', '-exportArchive', '-exportPath', '-exportOptionsPlist', '-packageAuthorizationProvider']);
export const OPCIONS_ALTOOL = Object.freeze(['--validate-app', '--upload-app', '-f', '--api-key', '--api-issuer', '--p8-file-path']);

/**
 * El pla d'A6-A8 per a una versió i un build. Pur: no toca el disc.
 * @returns {{ carpeta, arxiu, plist, exportacio, app, arxiva, exporta, valida, puja }}
 */
export function planIos({ arrel, valors, versio, build, projecte }) {
  const carpeta = path.join(rutaDe(arrel, valors, 'SDP_BUILDS_DIR'), `sdp-ios-${versio}-${build}`);
  const arxiu = path.join(carpeta, 'App.xcarchive');
  const plist = path.join(carpeta, 'ExportOptions.plist');
  const exportacio = path.join(carpeta, 'export');
  const clau = rutaDe(arrel, valors, 'SDP_ASC_KEY_PATH');
  const autenticacio = ['-allowProvisioningUpdates', '-authenticationKeyPath', clau,
    '-authenticationKeyID', valors.SDP_ASC_KEY_ID.trim(), '-authenticationKeyIssuerID', valors.SDP_ASC_ISSUER_ID.trim()];
  /* La forma d'altool 27.0.5: «--validate-app <fitxer>» i «--upload-app -f <fitxer>». La clau, per
     la seua ruta (--p8-file-path), mai escrita (--auth-string la portaria a la línia d'ordres)
     [VERIFICAT 261019, «xcrun altool --help»]. */
  const altool = (accio, ipa) => ['altool', accio, ...(accio === '--upload-app' ? ['-f', ipa] : [ipa]),
    '--api-key', valors.SDP_ASC_KEY_ID.trim(), '--api-issuer', valors.SDP_ASC_ISSUER_ID.trim(), '--p8-file-path', clau];
  return {
    carpeta, arxiu, plist, exportacio,
    app: path.join(arxiu, 'Products', 'Applications', 'App.app'),
    /* Fase C (261019) · Swift Package Manager resol capacitor-swift-pm des de github.com i, per
       defecte, hi busca credencials al clauer de macOS: amb un element de github.com al clauer,
       la resolució es queda esperant el clauer (10 min en la validació d'iOS de la Fase C).
       Amb netrc no toca el clauer; sense ~/.netrc, la baixada és anònima [VERIFICAT 261019,
       «xcodebuild -help» d'Xcode 27.1 i resolució real en 17,9 s]. */
    arxiva: ['xcodebuild', [projecte.opcio, projecte.cami, '-scheme', 'App', '-configuration', 'Release',
      '-destination', 'generic/platform=iOS', '-packageAuthorizationProvider', 'netrc', '-archivePath', arxiu, ...autenticacio,
      `MARKETING_VERSION=${versio}`, `CURRENT_PROJECT_VERSION=${build}`, 'archive']],
    exporta: ['xcodebuild', ['-exportArchive', '-archivePath', arxiu, '-exportPath', exportacio,
      '-exportOptionsPlist', plist, ...autenticacio]],
    valida: (ipa) => ['xcrun', altool('--validate-app', ipa)],
    puja: (ipa) => ['xcrun', altool('--upload-app', ipa)]
  };
}

/** El primer .ipa de la carpeta d'exportació, o null. */
function ipaDe(exportacio) {
  if (!fs.existsSync(exportacio)) return null;
  const ipa = fs.readdirSync(exportacio).find((nom) => nom.endsWith('.ipa'));
  return ipa ? path.join(exportacio, ipa) : null;
}

/** Un valor de l'Info.plist de l'app arxivada (plutil, de macOS). */
function delInfoPlist(app, clau, { valors, arrel }) {
  return executa('plutil', ['-extract', clau, 'raw', '-o', '-', path.join(app, 'Info.plist')], { valors, arrel, mostra: false })
    .then(({ codi, crua }) => (codi === 0 ? crua.trim() : null));
}

function rebut({ arrel, versio, build, ipa, pujat }) {
  return ['', `REBUT (per a ${REBUTS}/AAMMDD_HHMM_pujada_ios.txt; cap secret, cap Key ID, cap adreça):`,
    `  commit: ${commitCurt(arrel) ?? 'desconegut'}`, `  versio: ${versio}  build: ${build}`,
    `  sha256 de l'IPA: ${ipa ? sha256DeFitxer(ipa) : 'sense IPA'}`, `  hora: ${new Date().toISOString()}`,
    `  pujat a App Store Connect: ${pujat ? 'sí' : 'no'}`, '  qui ha dit «sí»: (ho escriu qui executa)', ''].join('\n');
}

export async function main(argv) {
  const { opcions, errors } = analitzaArguments(argv, ADMESOS);
  if (opcions.ajuda) {
    process.stdout.write('node scripts/botigues/puja-ios.mjs --versio X.Y.Z --build N [--compila] [--confirma=X.Y.Z+N]\n');
    return EIXIDA.BE;
  }
  const { versio, build } = opcions;
  if (errors.length || !VERSIO.test(versio ?? '') || !BUILD.test(build ?? '')) {
    return plega(EIXIDA.US, 'Ús: --versio X.Y.Z --build N [--compila] [--confirma=X.Y.Z+N]', errors);
  }
  if (opcions.confirma !== undefined && opcions.confirma !== confirmacioEsperada(versio, build)) {
    return plega(EIXIDA.CONFIRMACIO, `--confirma ha de ser exactament ${confirmacioEsperada(versio, build)}: un «sí» val per a una sola pujada`);
  }
  if (process.platform !== 'darwin') return plega(EIXIDA.EINA, 'l\'arxiu d\'iOS només es pot fer en macOS amb Xcode');
  const arrel = arrelComprovada();
  if (!arrel) return plega(EIXIDA.EINA, 'git no reconeix l\'arrel del repositori on viu este script');

  const pre = preflight({ arrel, plataformes: ['ios'] });
  process.stdout.write(`${pre.linies.join('\n')}\n`);
  if (pre.codi !== EIXIDA.BE) return plega(pre.codi, 'Preflight amb problemes: no es fa res.');
  const valors = pre.valors;

  const faltenXcode = opcionsQueFalten(llegixAjuda('xcodebuild', ['-help']), OPCIONS_XCODEBUILD);
  const faltenAltool = opcionsQueFalten(llegixAjuda('xcrun', ['altool', '--help']), OPCIONS_ALTOOL);
  if (faltenXcode.length || faltenAltool.length) {
    return plega(EIXIDA.EINA, 'Les eines no tenen les opcions del pla (Fusible: consulta la documentació oficial i esmena el script):',
      [...faltenXcode.map((o) => `xcodebuild ${o}`), ...faltenAltool.map((o) => `xcrun altool ${o}`)]);
  }

  const pla = planIos({ arrel, valors, versio, build, projecte: projecteIos(arrel) });
  const ipaPrevist = path.join(pla.exportacio, 'App.ipa');
  process.stdout.write(['', 'PLA (cada valor del fitxer d\'entorn es mostra com a <NOM>):',
    `  A6 ${mostraOrdre(...pla.arxiva, valors, arrel)}`,
    `  A7 ExportOptions.plist (destination export, mai upload) a ${mostraOrdre(pla.plist, [], valors, arrel)}`,
    `  A7 ${mostraOrdre(...pla.exporta, valors, arrel)}`,
    `  V  codesign -dv: TeamIdentifier = <SDP_APPLE_TEAM_ID>; Info.plist: ${versio} (${build})`,
    `  A8 ${mostraOrdre(...pla.valida(ipaPrevist), valors, arrel)}`,
    `  A8 ${mostraOrdre(...pla.puja(ipaPrevist), valors, arrel)}`, ''].join('\n'));

  if (!opcions.compila && opcions.confirma === undefined) {
    process.stdout.write(`En sec: no s'ha fet res. Per a arxivar i exportar: --compila. Per a pujar, amb el «sí» del Mestre per a ESTA pujada: --confirma=${confirmacioEsperada(versio, build)}\n`);
    return EIXIDA.BE;
  }

  if (opcions.compila) {
    if (fs.existsSync(pla.arxiu)) {
      return plega(EIXIDA.ARBRE, 'ja hi ha un arxiu per a esta versió i este build: puja el build següent (el Mestre decidix què fer amb l\'anterior)');
    }
    fs.mkdirSync(pla.carpeta, { recursive: true, mode: 0o700 });
    if ((await executa(...pla.arxiva, { cwd: arrel, valors, arrel })).codi !== 0) return plega(EIXIDA.EXTERNA, 'xcodebuild archive ha fallat');
    fs.writeFileSync(pla.plist, exportOptionsPlist(valors.SDP_APPLE_TEAM_ID.trim()), { mode: 0o600 });
    if ((await executa(...pla.exporta, { cwd: arrel, valors, arrel })).codi !== 0) return plega(EIXIDA.EXTERNA, 'xcodebuild -exportArchive ha fallat');
  }

  // Verificació local, abans de qualsevol pujada.
  const ipa = ipaDe(pla.exportacio);
  if (!fs.existsSync(pla.app) || !ipa) return plega(EIXIDA.ARBRE, `no hi ha arxiu ni IPA per a ${versio} (${build}): primer --compila`);
  const signatura = await executa('codesign', ['-dv', '--verbose=4', pla.app], { valors, arrel, mostra: false });
  const equip = equipDeCodesign(signatura.crua);
  if (signatura.codi !== 0 || !equip) return plega(EIXIDA.EXTERNA, 'codesign -dv no ha dit l\'equip de la signatura');
  if (equip !== valors.SDP_APPLE_TEAM_ID.trim()) return plega(EIXIDA.VERIFICACIO, 'l\'app està signada per un altre equip que SDP_APPLE_TEAM_ID');
  const [versioArxivada, buildArxivat] = await Promise.all([delInfoPlist(pla.app, 'CFBundleShortVersionString', { valors, arrel }), delInfoPlist(pla.app, 'CFBundleVersion', { valors, arrel })]);
  if (versioArxivada !== versio || buildArxivat !== build) {
    return plega(EIXIDA.VERIFICACIO, `l'app arxivada diu ${versioArxivada} (${buildArxivat}), no ${versio} (${build}): revisa que l'Info.plist llija MARKETING_VERSION i CURRENT_PROJECT_VERSION`);
  }
  process.stdout.write(`✓ signada per l'equip de SDP_APPLE_TEAM_ID; Info.plist ${versio} (${build})\n`);

  if (opcions.confirma === undefined) {
    process.stdout.write(rebut({ arrel, versio, build, ipa, pujat: false }));
    return EIXIDA.BE;
  }

  // altool corre des de la carpeta del build (fora del repositori): el seu ./private_keys no és el del repositori.
  if ((await executa(...pla.valida(ipa), { cwd: pla.carpeta, valors, arrel })).codi !== 0) {
    return plega(EIXIDA.EXTERNA, 'altool --validate-app ha fallat: no es puja res');
  }
  if ((await executa(...pla.puja(ipa), { cwd: pla.carpeta, valors, arrel })).codi !== 0) {
    return plega(EIXIDA.EXTERNA, 'altool --upload-app ha fallat');
  }
  process.stdout.write('✓ pujat. App Store Connect el processa uns minuts; la prova i l\'enviament a revisió són del Mestre (RUNBOOK P9).\n');
  process.stdout.write(rebut({ arrel, versio, build, ipa, pujat: true }));
  return EIXIDA.BE;
}

const principal = (() => {
  try { return process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href; } catch { return false; }
})();
if (principal) main(process.argv.slice(2)).then((codi) => { process.exitCode = codi; });
