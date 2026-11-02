/**
 * scripts/botigues/puja-ios.mjs — arxiu, exportació i pujada a App Store Connect amb la clau
 * d'API (RUNBOOK_BOTIGUES_IA.txt, A6-A8). 261003.
 *
 * Instal·lat el 261019 (Fase C) des de nous/botigues/puja-ios.mjs.txt del laboratori
 * 261003_1330_empaquetat_mobil_claude. Proves: tests/botigues.test.mjs i, per a l'IPA que es puja
 * (PC155-03, marató 261101_2143), tests/botigues.ipa.test.js; el canal de producció i els drets
 * de push (B9, la mateixa marató), tests/botigues.produccio.ios.test.js.
 *
 *   node scripts/botigues/puja-ios.mjs --versio 1.0.0 --build 7                    en sec: comprova i mostra el pla
 *   node scripts/botigues/puja-ios.mjs --versio 1.0.0 --build 7 --compila          arxiva, exporta i verifica; NO puja
 *   node scripts/botigues/puja-ios.mjs --versio 1.0.0 --build 7 --confirma=1.0.0+7 valida i PUJA l'IPA ja exportat
 *
 * B9 · A iOS, intern i producció són la mateixa pujada (altool no té pista): --canal produccio canvia
 * el «sí» (--confirma=produccio:VERSIO+BUILD@<12 primers del sha256 de l'IPA>, el que dona el rebut
 * de --compila; --compila i --confirma no van junts), el registre de pujades i els passos que fa
 * després el Mestre: adjuntar la build a la versió de l'App Store i enviar-la a App Review, sense cap
 * grup de TestFlight (P9 i S6). Els drets de l'IPA es lligen amb codesign sense eco, i si l'app
 * anuncia avisos remots, l'IPA ha de portar aps-environment production. G1-B-seg-02 · Cap pas pinta
 * el Team ID: la màscara d'entorn.mjs el tapa arreu, també en l'eixida d'xcodebuild archive i
 * -exportArchive, que bolca els drets amb «<Team ID>.org.socdepoble.app».
 *
 * PC155-03 · El que es verifica és el que es puja. A export/ hi ha d'haver un sol IPA; es copia
 * en una carpeta privada nova (verifica-ipa-*, dins de la carpeta del build) i el seu sha256 es
 * fixa. La còpia s'obri amb ditto i dins d'ella es miren el segell, la signatura (codesign
 * --verify, i -dv per a l'equip) i l'Info.plist. altool valida i puja eixa mateixa còpia, i el
 * sha256 es torna a mirar després de verificar, de validar i de pujar. El rebut diu eixe sha256.
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
  BUILD, CANALS, EIXIDA, REBUTS, SEGELL, VERSIO, analitzaArguments, analitzaConfirmacio, apsDeCodesign, apuntaPujada, avisDelRegistre,
  confirmacioEsperada, equipDeCodesign, executa, exportOptionsPlist, guardaDelRegistre, llegixAjuda, mostraOrdre, opcionsQueFalten, plega,
  problemaDelPaquet, rutaDe, sha256DeFitxer
} from './entorn.mjs';
import { arrelComprovada, preflight, projecteIos } from './preflight.mjs';

import { problemaDeVersioClient } from './versio-client.mjs';

const ADMESOS = Object.freeze({ versio: true, build: true, compila: false, confirma: true, canal: true, push: false, ajuda: false });
const US = 'Ús: --versio X.Y.Z --build N [--canal intern|produccio] [--push] [--compila] [--confirma=X.Y.Z+N | --confirma=produccio:X.Y.Z+N@<sha12>]';

/* B9 · Després d'una pujada a producció, el que fa el Mestre a App Store Connect (P9 i S6), sense
   cap grup de proves: Apple processa la build i l'App Review és l'únic camí a la botiga. */
export const PASSOS_REVISIO_IOS = Object.freeze([
  'Espera que App Store Connect acabe de processar la build (de minuts a una hora; arriba un correu).',
  'App Store Connect › Apps › Sóc de Poble › Distribució › versió iOS VERSIO (crea-la si no hi és) › Compilació › tria la BUILD [NO VERIFICAT el camí].',
  'Metadades, captures d\'iPhone i d\'iPad, privacitat, edat, informació per a la revisió (el compte de prova l\'escriu el Mestre, P5) i estat de comerciant de la DSA (P6).',
  '«Publicació de la versió: manual» (el botó final és del Mestre).',
  '«Afegeix per a revisió» › «Envia a App Review»: ho fa el Mestre (RUNBOOK P9 i S6).'
]);
/* B9 · Abans d'enviar la primera versió a revisió (guia de publicació §14.2). */
export const ABANS_DE_REVISIO_IOS = Object.freeze([
  'L\'estat de comerciant de la DSA (UE) declarat a App Store Connect, abans de res.',
  'Apple a Supabase si es vol el botó «Continua amb Apple» (D-10).',
  'Les captures d\'iPhone i d\'iPad (TARGETED_DEVICE_FAMILY 1,2, D-4).',
  'El compte de prova per al revisor (l\'escriu el Mestre, P5).'
]);

/** Una llista de passos numerada, amb VERSIO i BUILD posats. */
const enumera = (passos, versio, build) => passos.map((p, i) => `  ${i + 1}. ${p}`).join('\n').replace(/VERSIO/g, versio).replace(/BUILD/g, build);

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

/**
 * PC155-03 · L'únic IPA de la carpeta d'exportació: { ipa, problema }. Sense carpeta o sense cap
 * IPA → { ipa: null, problema: null }. Dos o més (un de vell i un de nou) o un que no és un fitxer
 * regular són un problema, i no es tria cap. L'extensió es mira sense caixa (APFS no la distingix).
 */
export function ipaUnicDe(exportacio) {
  let noms;
  try { noms = fs.readdirSync(exportacio); } catch { return { ipa: null, problema: null }; }
  const ipas = noms.filter((nom) => nom.toLowerCase().endsWith('.ipa')).sort();
  if (ipas.length === 0) return { ipa: null, problema: null };
  if (ipas.length > 1) {
    return { ipa: null, problema: `hi ha ${ipas.length} IPA a la carpeta d'exportació (${ipas.join(', ')}): n'hi ha d'haver un, el d'este arxiu` };
  }
  const ipa = path.join(exportacio, ipas[0]);
  let regular = false;
  try { regular = fs.lstatSync(ipa).isFile(); } catch { /* ha desaparegut */ }
  return regular ? { ipa, problema: null } : { ipa: null, problema: `${ipas[0]} no és un fitxer regular` };
}

/**
 * PC155-03 · Obri l'IPA amb ditto (de macOS) a `desti` i torna { app, problema }: l'única
 * Payload/*.app, que ha de ser una carpeta de veres (no un enllaç) de dins de `desti`.
 * Symbols/ i SwiftSupport/ de l'IPA no compten. ditto deixa dins de `desti` les entrades amb «..»
 * [VERIFICAT 261101 en este Mac], però conserva els enllaços: per això es miren ací i a fitxerDeLApp.
 */
export async function obriIpa(ipa, desti, { valors, arrel }) {
  if ((await executa('ditto', ['-x', '-k', ipa, desti], { valors, arrel, mostra: false })).codi !== 0) {
    return { app: null, problema: 'ditto no ha pogut obrir l\'IPA' };
  }
  let apps = [];
  try { apps = fs.readdirSync(path.join(desti, 'Payload')).filter((nom) => nom.endsWith('.app')); } catch { /* sense Payload/ */ }
  if (apps.length !== 1) return { app: null, problema: `l'IPA porta ${apps.length} apps a Payload/: n'ha de portar una` };
  const app = path.join(desti, 'Payload', apps[0]);
  let carpeta = false;
  try { carpeta = fs.lstatSync(app).isDirectory() && fs.realpathSync(app).startsWith(fs.realpathSync(desti) + path.sep); } catch { /* no hi és */ }
  return carpeta ? { app, problema: null } : { app: null, problema: `Payload/${apps[0]} no és una carpeta de l'IPA` };
}

/**
 * PC155-03 · Un fitxer de dins de l'app de l'IPA: { cami, problema }. Si no hi és, tots dos null.
 * Un enllaç (o una carpeta enllaçada) que isca de l'app és un problema: un segell.json enllaçat al
 * dist-natiu/ del repositori faria passar per bo un IPA que no el porta.
 */
export function fitxerDeLApp(app, ...peces) {
  const cami = path.join(app, ...peces);
  let fitxa;
  try { fitxa = fs.lstatSync(cami); } catch { return { cami: null, problema: null }; }
  let dins = false;
  try { dins = fs.realpathSync(cami).startsWith(fs.realpathSync(app) + path.sep); } catch { /* enllaç trencat */ }
  if (!fitxa.isFile() || !dins) return { cami: null, problema: `${peces.join('/')} de l'app de l'IPA no és un fitxer regular de dins de l'app` };
  return { cami, problema: null };
}

/** Un valor de l'Info.plist d'una app (plutil, de macOS). */
function delInfoPlist(app, clau, { valors, arrel }) {
  return executa('plutil', ['-extract', clau, 'raw', '-o', '-', path.join(app, 'Info.plist')], { valors, arrel, mostra: false })
    .then(({ codi, crua }) => (codi === 0 ? crua.trim() : null));
}

/* BOT-A4 (261025) · public/ és una carpeta de recursos de l'app (ios/App/App.xcodeproj/project.pbxproj,
   «public in Resources», lastKnownFileType = folder): el segell que copia cap sync hi és a
   App.app/public/segell.json [VERIFICAT 261025 en l'arxiu de 261024: App.app/public/index.html].
   Si no és el de dist-natiu/, l'arxiu és d'un build d'abans i no es puja. PC155-03: el mateix
   segell, l'equip i la versió es comproven també dins de l'app de l'IPA que es puja. */
export const SEGELL_DE_L_APP = Object.freeze(['public', 'segell.json']);

/** Per què l'app arxivada no ix del dist-natiu/ que ha contrastat el preflight, o null si en ix. */
export function problemaDeLApp(arrel, app) {
  let dins = null;
  try { dins = fs.readFileSync(path.join(app, ...SEGELL_DE_L_APP)); } catch { /* no en porta */ }
  return problemaDelPaquet(arrel, dins, 'l\'app arxivada');
}

/* BOT-A4 (261025) · El commit és el del segell de dist-natiu/ (el que el preflight ha contrastat
   amb HEAD), no el HEAD d'ara; main només imprimix el rebut quan l'app arxivada i la de l'IPA
   porten eixe segell. */
export function rebut({ segell, versio, build, ipa, sha256 = null, pujat, canal = CANALS.INTERN }) {
  /* PC155-03 · main passa el sha256 fixat abans de verificar: recalcular-lo ací acreditaria uns
     octets que potser no són els verificats ni els pujats. Sense, es calcula com abans.
     B9 · El canal, i en producció el «sí» exacte per a esta còpia. */
  const empremta = sha256 ?? (ipa ? sha256DeFitxer(ipa) : null);
  const produccio = canal === CANALS.PRODUCCIO;
  return ['', `REBUT (per a ${REBUTS}/AAMMDD_HHMM_pujada_ios.txt; cap secret, cap Key ID, cap adreça):`,
    `  commit: ${segell?.commit ?? 'desconegut'} (el de ${SEGELL.join('/')}, que porta l'app arxivada)`, `  versio: ${versio}  build: ${build}`,
    `  IPA: ${ipa ? path.basename(ipa) : 'sense IPA'}`, `  sha256 de l'IPA: ${empremta ?? 'sense IPA'}`, `  canal: ${canal}`, `  hora: ${new Date().toISOString()}`,
    `  pujat a App Store Connect: ${pujat ? 'sí' : 'no'}`,
    ...(produccio && empremta && !pujat ? [`  «sí» per a pujar ESTE IPA: --canal produccio --confirma=${confirmacioEsperada(versio, build, { canal, sha256: empremta })}`] : []),
    '  qui ha dit «sí»: (ho escriu qui executa)', ''].join('\n');
}

export async function main(argv) {
  const { opcions, errors } = analitzaArguments(argv, ADMESOS);
  if (opcions.ajuda) {
    process.stdout.write(`node scripts/botigues/puja-ios.mjs ${US.slice(4)}\n`);
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
    return plega(EIXIDA.US, 'en producció, primer --compila (el rebut porta el sha256 de l\'IPA); el «sí» va en una altra execució');
  }
  const confirmacio = opcions.confirma === undefined ? null : analitzaConfirmacio(opcions.confirma, { versio, build, canal });
  if (confirmacio && !confirmacio.valida) {
    const pista = produccio ? ' i per a un sol IPA (els 12 primers caràcters del sha256 que diu el rebut de --compila); un «sí» intern no val per a producció'
      : (String(opcions.confirma).startsWith('produccio:') ? ' (este és un «sí» de producció: va amb --canal produccio)' : '');
    return plega(EIXIDA.CONFIRMACIO, `--confirma ha de ser exactament ${confirmacioEsperada(versio, build, { canal })}: un «sí» val per a una sola pujada${pista}`);
  }
  // P0-23 · El build porta la versió del client que l'app dirà al node (versio-client.mjs).
  const deLaVersio = problemaDeVersioClient(build);
  if (deLaVersio) return plega(EIXIDA.ARBRE, deLaVersio);
  if (process.platform !== 'darwin') return plega(EIXIDA.EINA, 'l\'arxiu d\'iOS només es pot fer en macOS amb Xcode');
  const arrel = arrelComprovada();
  if (!arrel) return plega(EIXIDA.EINA, 'git no reconeix l\'arrel del repositori on viu este script');

  const pre = preflight({ arrel, plataformes: ['ios'], canal, push: Boolean(opcions.push) });
  process.stdout.write(`${pre.linies.join('\n')}\n`);
  if (pre.codi !== EIXIDA.BE) return plega(pre.codi, 'Preflight amb problemes: no es fa res.');
  /* ARB-B9-02 · Tancat per defecte: sense l'estat dels avisos push no se sap quin aps-environment
     ha de portar l'IPA, i no es fa res (cap «?.» que apague la guarda en silenci). */
  if (pre.push === null || typeof pre.push !== 'object' || typeof pre.push.anuncia !== 'boolean') {
    return plega(EIXIDA.ARBRE, 'el preflight no ha dit l\'estat dels avisos push: no es fa res');
  }
  const valors = pre.valors;

  /* B9 · El registre de pujades, abans de --compila: no s'arxiva cap build que ja s'ha pujat. */
  const registre = guardaDelRegistre({ arrel, valors, canal, plataforma: 'ios', versio, build });
  for (const text of registre.avisos) process.stdout.write(`  ! ${text}\n`);
  if (registre.codi !== EIXIDA.BE) return plega(registre.codi, 'El registre de pujades no deixa seguir: no es fa res.', registre.problemes);

  const faltenXcode = opcionsQueFalten(llegixAjuda('xcodebuild', ['-help']), OPCIONS_XCODEBUILD);
  const faltenAltool = opcionsQueFalten(llegixAjuda('xcrun', ['altool', '--help']), OPCIONS_ALTOOL);
  if (faltenXcode.length || faltenAltool.length) {
    return plega(EIXIDA.EINA, 'Les eines no tenen les opcions del pla (Fusible: consulta la documentació oficial i esmena el script):',
      [...faltenXcode.map((o) => `xcodebuild ${o}`), ...faltenAltool.map((o) => `xcrun altool ${o}`)]);
  }

  const pla = planIos({ arrel, valors, versio, build, projecte: projecteIos(arrel) });
  /* PC155-03 · altool rep la còpia privada de l'IPA verificat, no el fitxer d'export/. */
  const ipaPrevist = path.join(pla.carpeta, 'verifica-ipa-XXXXXX', 'App.ipa');
  process.stdout.write(['', 'PLA (cada valor del fitxer d\'entorn es mostra com a <NOM>):',
    `  A6 ${mostraOrdre(...pla.arxiva, valors, arrel)}`,
    `  A7 ExportOptions.plist (destination export, mai upload) a ${mostraOrdre(pla.plist, [], valors, arrel)}`,
    `  A7 ${mostraOrdre(...pla.exporta, valors, arrel)}`,
    `  V  l'únic IPA d'export/, copiat a una carpeta privada (verifica-ipa-*) amb el sha256 fixat i obert amb ditto: segell, codesign --verify --deep --strict, codesign -dv (TeamIdentifier = <SDP_APPLE_TEAM_ID>, drets (aps-environment), sense eco) i Info.plist ${versio} (${build})`,
    `  A8 ${mostraOrdre(...pla.valida(ipaPrevist), valors, arrel)}`,
    `  A8 ${mostraOrdre(...pla.puja(ipaPrevist), valors, arrel)}`, ''].join('\n'));

  if (!opcions.compila && opcions.confirma === undefined) {
    if (produccio) {
      /* El rebut d'iOS ix de --compila: ací el «sí» porta el marcador del sha256. ARB-N05-03 · Si l'arxiu
         i l'IPA ja hi són (p. ex., d'un --compila intern), --compila pararia (eixida 7) i gastaria un
         build: es diu d'on traure el sha12 (el rebut d'eixe --compila o shasum). Només llig la carpeta;
         --confirma torna a verificar l'IPA sencer abans de pujar-lo. */
      const { ipa: jaExportat } = fs.existsSync(pla.app) ? ipaUnicDe(pla.exportacio) : { ipa: null };
      const primer = jaExportat
        ? `En sec (producció): no s'ha fet res. L'arxiu i l'IPA de ${versio} (${build}) ja hi són: no cal --compila (pararia, perquè l'arxiu ja hi és). Els 12 primers caràcters del sha256 són els del rebut d'eixe --compila, o els de «${mostraOrdre('shasum', ['-a', '256', jaExportat], valors, arrel)} | cut -c1-12»; --confirma torna a verificar l'IPA sencer abans de pujar-lo. Amb el «sí» del Mestre per a ESTE IPA: --canal produccio --confirma=${confirmacioEsperada(versio, build, { canal })}\n`
        : `En sec (producció): no s'ha fet res. Primer --canal produccio --compila (arxiva, exporta i verifica; el rebut porta el sha256). Després, amb el «sí» del Mestre per a ESTE IPA: --canal produccio --confirma=${confirmacioEsperada(versio, build, { canal })}\n`;
      process.stdout.write(`${primer}Abans d'enviar la versió a revisió (guia de publicació §14.2):\n${enumera(ABANS_DE_REVISIO_IOS, versio, build)}\n`);
      return EIXIDA.BE;
    }
    process.stdout.write(`En sec: no s'ha fet res. Per a arxivar i exportar: --compila. Per a pujar, amb el «sí» del Mestre per a ESTA pujada: --confirma=${confirmacioEsperada(versio, build)}\n`);
    return EIXIDA.BE;
  }

  if (opcions.compila) {
    if (fs.existsSync(pla.arxiu)) {
      /* ARB-N05-03 · A producció, primer el camí que no gasta cap build: el --confirma de l'IPA que ja hi és. */
      return plega(EIXIDA.ARBRE, produccio
        ? `ja hi ha un arxiu per a esta versió i este build: si el seu IPA és el que vols publicar, no cal compilar-lo de nou: --canal produccio --confirma=${confirmacioEsperada(versio, build, { canal })} amb els 12 primers caràcters del sha256 del rebut del seu --compila (l'execució en sec diu com calcular-los); si no, puja el build següent (el Mestre decidix què fer amb l'anterior)`
        : 'ja hi ha un arxiu per a esta versió i este build: puja el build següent (el Mestre decidix què fer amb l\'anterior)');
    }
    fs.mkdirSync(pla.carpeta, { recursive: true, mode: 0o700 });
    if ((await executa(...pla.arxiva, { cwd: arrel, valors, arrel })).codi !== 0) return plega(EIXIDA.EXTERNA, 'xcodebuild archive ha fallat');
    fs.writeFileSync(pla.plist, exportOptionsPlist(valors.SDP_APPLE_TEAM_ID.trim()), { mode: 0o600 });
    if ((await executa(...pla.exporta, { cwd: arrel, valors, arrel })).codi !== 0) return plega(EIXIDA.EXTERNA, 'xcodebuild -exportArchive ha fallat');
  }

  // Verificació local, abans de qualsevol pujada.
  const { ipa, problema: deLExportacio } = ipaUnicDe(pla.exportacio);
  if (deLExportacio) return plega(EIXIDA.ARBRE, `${deLExportacio}: no se'n tria cap ni s'esborra res; el Mestre decidix què fer amb l'anterior`);
  if (!fs.existsSync(pla.app) || !ipa) return plega(EIXIDA.ARBRE, `no hi ha arxiu ni IPA per a ${versio} (${build}): primer --compila`);
  const deLApp = problemaDeLApp(arrel, pla.app);
  if (deLApp) return plega(EIXIDA.ARBRE, `${deLApp}: un build nou va amb el --build següent i --compila`);
  process.stdout.write(`✓ l'app arxivada porta el ${SEGELL.join('/')} del preflight\n`);

  /* PC155-03 · La carpeta privada (mkdtemp: 0700) és dins de la carpeta del build, fora del
     repositori. La còpia de l'IPA hi és clonada (APFS) i de només lectura; s'esborra en acabar. */
  let privada;
  try { privada = fs.mkdtempSync(path.join(pla.carpeta, 'verifica-ipa-')); } catch {
    return plega(EIXIDA.ARBRE, 'no es pot crear la carpeta privada de verificació dins de la carpeta del build');
  }
  try {
    const copia = path.join(privada, path.basename(ipa));
    const delOriginal = sha256DeFitxer(ipa);
    try {
      fs.copyFileSync(ipa, copia, fs.constants.COPYFILE_EXCL | fs.constants.COPYFILE_FICLONE);
      fs.chmodSync(copia, 0o400);
    } catch { return plega(EIXIDA.ARBRE, 'no s\'ha pogut copiar l\'IPA a la carpeta privada de verificació'); }
    const empremta = sha256DeFitxer(copia);
    if (empremta !== delOriginal) return plega(EIXIDA.VERIFICACIO, 'l\'IPA ha canviat mentre es copiava: no es puja res');
    const intacta = () => sha256DeFitxer(copia) === empremta;
    /* B9 · El «sí» de producció va lligat als 12 primers caràcters del sha256 de la còpia fixada (D-B9-7). */
    if (produccio && confirmacio && empremta.slice(0, 12) !== confirmacio.sha12) {
      return plega(EIXIDA.CONFIRMACIO, `l'IPA d'ara no és el del «sí»: el seu sha256 comença per ${empremta.slice(0, 12)}, no per ${confirmacio.sha12}; el rebut de --compila diu el bo`);
    }

    const { app, problema: deLIpa } = await obriIpa(copia, path.join(privada, 'obert'), { valors, arrel });
    if (deLIpa) return plega(EIXIDA.VERIFICACIO, deLIpa);
    const segellDeLIpa = fitxerDeLApp(app, ...SEGELL_DE_L_APP);
    if (segellDeLIpa.problema) return plega(EIXIDA.VERIFICACIO, segellDeLIpa.problema);
    const delSegell = problemaDelPaquet(arrel, segellDeLIpa.cami ? fs.readFileSync(segellDeLIpa.cami) : null, 'l\'app de l\'IPA');
    if (delSegell) return plega(EIXIDA.ARBRE, `${delSegell}: un build nou va amb el --build següent i --compila`);
    // PC155-03c · -dv només llig la signatura; --verify en comprova la integritat [VERIFICAT 261101: -dv dona 0 amb un recurs canviat].
    const integritat = await executa('codesign', ['--verify', '--deep', '--strict', '--verbose=2', app], { valors, arrel, mostra: false });
    if (integritat.codi !== 0) return plega(EIXIDA.VERIFICACIO, 'codesign --verify rebutja la signatura de l\'app de l\'IPA: no es puja res');
    /* ARB-B9-03 · Els drets ixen en XML amb «<Team ID>.org.socdepoble.app»: l'eixida de codesign no es
       pinta (eco: false) i el script escriu la seua línia. Des de G1-B-seg-02 la màscara també tapa eixe Team ID.
       [VERIFICAT 261102: -dv --verbose=4 --entitlements - --xml torna 0, el detall a stderr i l'XML a stdout.] */
    const signatura = await executa('codesign', ['-dv', '--verbose=4', '--entitlements', '-', '--xml', app], { valors, arrel, mostra: false, eco: false });
    const equip = equipDeCodesign(signatura.crua);
    if (signatura.codi !== 0 || !equip) return plega(EIXIDA.EXTERNA, 'codesign -dv no ha dit l\'equip de la signatura');
    if (equip !== valors.SDP_APPLE_TEAM_ID.trim()) return plega(EIXIDA.VERIFICACIO, 'l\'app de l\'IPA està signada per un altre equip que SDP_APPLE_TEAM_ID');
    const aps = apsDeCodesign(signatura.crua);
    process.stdout.write(`✓ signatura de l'equip de SDP_APPLE_TEAM_ID; aps-environment: ${aps ?? 'cap'}\n`);
    if (pre.push.anuncia && aps !== 'production') {
      return plega(EIXIDA.VERIFICACIO, 'l\'IPA no porta aps-environment production: revisa la capacitat Push de l\'App ID i torna a --compila');
    }
    if (!pre.push.anuncia && aps) process.stdout.write(`  ! l'IPA porta aps-environment ${aps} però l'app no anuncia avisos remots: el perfil ha de tindre Push Notifications (D-B9-17)\n`);
    const plist = fitxerDeLApp(app, 'Info.plist');
    if (!plist.cami) return plega(EIXIDA.VERIFICACIO, plist.problema ?? 'l\'app de l\'IPA no porta Info.plist');
    const [versioIpa, buildIpa] = await Promise.all([delInfoPlist(app, 'CFBundleShortVersionString', { valors, arrel }), delInfoPlist(app, 'CFBundleVersion', { valors, arrel })]);
    if (versioIpa !== versio || buildIpa !== build) {
      return plega(EIXIDA.VERIFICACIO, `l'app de l'IPA diu ${versioIpa} (${buildIpa}), no ${versio} (${build}): revisa que l'Info.plist llija MARKETING_VERSION i CURRENT_PROJECT_VERSION`);
    }
    if (!intacta()) return plega(EIXIDA.VERIFICACIO, 'la còpia de l\'IPA ha canviat mentre es verificava: no es puja res');
    process.stdout.write(`✓ IPA ${path.basename(ipa)}: segell, signatura íntegra de l'equip de SDP_APPLE_TEAM_ID i Info.plist ${versio} (${build}); sha256 ${empremta}\n`);

    if (opcions.confirma === undefined) {
      process.stdout.write(rebut({ segell: pre.segell, versio, build, ipa, sha256: empremta, pujat: false, canal }));
      return EIXIDA.BE;
    }

    // altool corre des de la carpeta del build (fora del repositori): el seu ./private_keys no és el del repositori.
    if ((await executa(...pla.valida(copia), { cwd: pla.carpeta, valors, arrel })).codi !== 0) {
      return plega(EIXIDA.EXTERNA, 'altool --validate-app ha fallat: no es puja res');
    }
    if (!intacta()) return plega(EIXIDA.VERIFICACIO, 'la còpia de l\'IPA ha canviat després de validar-la: no es puja res');
    if ((await executa(...pla.puja(copia), { cwd: pla.carpeta, valors, arrel })).codi !== 0) {
      return plega(EIXIDA.EXTERNA, 'altool --upload-app ha fallat');
    }
    if (!intacta()) {
      return plega(EIXIDA.VERIFICACIO, 'la còpia de l\'IPA ha canviat durant la pujada: cap rebut; el Mestre mira a App Store Connect quin build ha arribat');
    }
    // B9 · La pujada s'apunta al registre DESPRÉS de fer-se (mai abans).
    if (registre.carpeta) {
      const avis = avisDelRegistre(apuntaPujada(registre.carpeta, { plataforma: 'ios', canal, versio, build, sha256: empremta, commit: pre.segell?.commit ?? null, data: new Date().toISOString() }));
      if (avis) process.stderr.write(`avís: ${avis}\n`);
    }
    process.stdout.write(produccio
      ? `✓ pujat. Per a publicar-la, el Mestre (RUNBOOK P9 i S6), sense cap grup de proves:\n${enumera(PASSOS_REVISIO_IOS, versio, build)}\n`
      : '✓ pujat. App Store Connect el processa uns minuts; la prova i l\'enviament a revisió són del Mestre (RUNBOOK P9).\n');
    process.stdout.write(rebut({ segell: pre.segell, versio, build, ipa, sha256: empremta, pujat: true, canal }));
    return EIXIDA.BE;
  } finally {
    try { fs.rmSync(privada, { recursive: true, force: true }); } catch {
      process.stderr.write('avís: no s\'ha pogut esborrar la carpeta privada verifica-ipa-* de la carpeta del build\n');
    }
  }
}

const principal = (() => {
  try { return process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href; } catch { return false; }
})();
if (principal) main(process.argv.slice(2)).then((codi) => { process.exitCode = codi; });
