#!/usr/bin/env node
/**
 * scripts/botigues/publica-tot.mjs — Orquestrador Omnicanal Mode Jarvis (IDEA-60 · T1/T8).
 *
 * Unifica el protocol de línies JSON del corredor Jarvis per a la Consola (/consola/empaquetats,
 * POST /__iaia/botigues/publica-tot), la verificació en sec, la compilació signada (AAB + IPA +
 * WordPress) i el llançament confirmat de les quatre plataformes oficials reutilitzant entorn.mjs,
 * preflight.mjs, puja-android.mjs, puja-ios.mjs i higiene-paquets.mjs.
 *
 * Protocol de línies del corredor Jarvis (--notes <notes> [--canals web,wordpress,android,ios] [--sec]):
 *   · Emet a stdout una línia JSON per transició de pas:
 *       {"pas":"web","estat":"en_curs"}
 *       {"pas":"web","estat":"fet"|"error","text":"..."}
 *   · Cap secret ni camí absolut ix a `text`. Els registres humans van a stderr.
 *
 * Onada v1.2.16 (prompt 261121_0216, T3.1; ordres del Mestre 261121 01:32 i 01:55) · ZERO APK fora de
 * botiga: la Protecció Avançada d'Android bloqueja els APK de fora de botiga, i tota actualització
 * viatja per les 4 botigues oficials (Google Play, pista tancada alpha o production; Apple TestFlight;
 * WordPress.org SVN; i la Web). Per això este script ja no compila cap APK directe amb --compila, el pla
 * en sec no l'oferix, --publica-apk es refusa i --sincronitza-proves ja no l'anuncia (--build-apk es
 * refusa, i els anuncis heretats apkDirectBuild i apkSha256 es retiren d'ard.json en la pròxima
 * escriptura). Fins a la v1.2.15, «--sincronitza-proves --versio X.Y.Z [--build-testflight M] [--build-apk N]»
 * també anunciava l'APK publicat a dist/descarregues/ (P0-123, v1.2.7): la història és a git, i el
 * motiu del tall és MOTIU_APK_APAGAT. La pista tancada «alpha» de Google Play (--canal alpha, només
 * Android) és el camí dels verificadors.
 *
 * Onada R32.3 (P0, ordre del Mestre 261116 22:09: actualitzacions automàtiques en tot el sistema):
 *   --sincronitza-ard --versio X.Y.Z [--build N] [--build-ios M] [--corregeix-ard]
 *       escriu version i androidBuild (--build) i/o iosBuild (--build-ios) a public/.well-known/ard.json,
 *       el manifest que consulta src/natiu/actualitzacioAppNativa.js, amb sincronitzaManifestVersio.
 *       Va ABANS de npm run build (el build el copia a dist/). Abans d'escriure: la versió és la de
 *       package.json, cap build passa de VERSIO_CLIENT_NATIU, i el build ja es DONA al canal que obri
 *       el botó de l'App: Google Play el té «completed» a la pista production (l'API, només lectura; la
 *       prova interna i la tancada, alpha, només les reben els seus provadors, no tots els Android) i el
 *       d'iOS és al registre de pujades de producció (l'App Store). Si no, l'App avisaria d'una versió
 *       que la botiga encara no dona, a cada obertura. Mai baixa, llevat de --corregeix-ard (l'única
 *       manera de desfer una errada).
 *   --sincronitza-proves --versio X.Y.Z --build-testflight M [--corregeix-ard]
 *       Onada v1.2.7 · P0-123 (ordre directa del Mestre, 17-11-2026: actualització automàtica real als
 *       mòbils de prova) · escriu el canal de proves d'iOS del manifest (testflightIosBuild), amb les
 *       mateixes garanties que --sincronitza-ard (la versió de package.json, cap build per damunt de
 *       VERSIO_CLIENT_NATIU, mai baixa sense --corregeix-ard) i NOMÉS amb l'evidència del canal: després
 *       de puja-ios.mjs, el registre de pujades (SDP_BUILDS_DIR/pujades.jsonl, que puja-ios.mjs apunta
 *       DESPRÉS d'una pujada feta) ha de portar el build d'iOS (intern o producció: App Store Connect el
 *       dona a TestFlight). P0123-02 · I cap pujada de producció d'iOS entre l'iosBuild d'ard.json i el
 *       build demanat: eixa pot estar en App Review (on l'App porta el rebut de proves, com a
 *       TestFlight) o pendent de publicar, i no s'anuncia un TestFlight més nou fins que l'App Store la
 *       done (--sincronitza-ard --build-ios, i després esta ordre). I latestBuild, el més alt dels builds
 *       (també amb --sincronitza-ard). testflightIosBuild va a public/.well-known/ard.json i, si hi ha
 *       un build fet, a dist/.well-known/ard.json (la còpia que es desplega), tots dos o cap.
 *       v1.2.23 · D-V1223-BOTO-BETA-OCULT (ordre del Mestre 261123) · Es refusa (eixida d'ús, res escrit)
 *       mentre la ronda amb Beta Testers no és oberta: cal SDP_RONDA_BETA_TESTERS=1 a l'entorn, i el pla
 *       d'iOS només proposa este pas amb la mateixa variable.
 *   La pujada d'Android és la de puja-android.mjs (API REST de Google Play, sense fastlane), i
 *   --desplega hi passa tal qual (només a la prova interna o a la tancada, alpha). El corredor Jarvis
 *   (--notes) no puja mai res a Google Play: no fabrica el «sí» del Mestre (Elefant R32.3).
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  BUILD, CANALS, EIXIDA, VERSIO, analitzaArguments, canalAdmes, carregaEntorn, comparaVersions, emmascara,
  esDins, executa, llegixRegistre, plega, rutaDe, usDelCanal
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
const US = 'Ús: --notes "<notes>" [--canals web,wordpress,android,ios] [--sec] | --versio X.Y.Z --build N [--plataforma totes|web|wordpress|android|ios] [--canal intern|alpha|produccio] [--push] [--json] | --versio X.Y.Z --build N --plataforma android|ios [--canal intern|alpha|produccio] [--push] [--desplega] [--compila] [--confirma=X.Y.Z+N|alpha:X.Y.Z+N|produccio:X.Y.Z+N@<sha12>] | --versio X.Y.Z [--build N] [--build-ios M] --sincronitza-ard | --versio X.Y.Z --build-testflight M --sincronitza-proves (alpha: només Android; cap APK fora de botiga)';

/* Onada R24 · Consola Zero (P-A) · Firebase Hosting publica versions atòmiques
   des de dist/: sense retenció, una pestanya oberta abans del desplegament
   demana trossos que ja no hi són (404 de modulepreload). L'ordre web passa a
   ser build → arxiva → incorpora → deploy (tooling/scripts/retencio-assets.mjs),
   amb l'arxiu sempre explícit. La ubicació és una proposta pendent del Mestre
   (D-consola-1): fora del repositori i de dist/, dins del satèl·lit de builds. */
export const ARXIU_RETENCIO_PROPOSAT = '../_builds_de_poble/web_assets_retencio';
export const ORDRE_WEB = `npm run build && npm run deploy:arxiva -- --arxiu ${ARXIU_RETENCIO_PROPOSAT} && npm run deploy:retencio -- --arxiu ${ARXIU_RETENCIO_PROPOSAT} && firebase deploy --only hosting`;

/* El nom de l'antic APK públic (/descarregues/<NOM_APK_PUBLIC>). Des de la v1.2.16 firebase.json ja no en
   redirigix l'adreça (src/config/firebaseHosting.test.js exigix zero redireccions); el motiu del tall el nomena.
   Cap eina en publica cap. */
export const NOM_APK_PUBLIC = 'socdepoble-android-latest.apk';
/** v1.2.16 · Ordre del Mestre (261121 01:32 i 01:55): ZERO APK fora de botiga. El motiu de cada refús. */
export const MOTIU_APK_APAGAT = `ZERO APK fora de botiga (ordre del Mestre 261121): l'APK directe està apagat (apk-directe sense adreça, url: null) i cap eina el compila, el publica a /descarregues/${NOM_APK_PUBLIC} ni l'anuncia a ard.json; Android s'actualitza NOMÉS per Google Play (la prova tancada alpha o production)`;

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
     darrere d'un arbre brut; i després «npm run build» (que copia ard.json a dist/ i buida dist/) i el
     connector WordPress, al mateix lloc que abans. Un --sincronitza-ard posterior al build no arribaria
     a l'App fins al desplegament següent. v1.2.16 · Cap pas d'APK directe (MOTIU_APK_APAGAT).
     La prova tancada (alpha) és de Google Play: a iOS, el canal equivalent és TestFlight (intern). */
  const natius = [];
  const anuncis = [];
  const web = [];
  const produccio = canal === CANALS.PRODUCCIO;
  const alpha = canal === CANALS.ALPHA;
  const canalIos = alpha ? CANALS.INTERN : canal;
  const pista = PISTES[canal] ?? PISTES[CANALS.INTERN];
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
      ordre: `SDP_RELEASE=1 SDP_VERSIO=${vWp} npm run build:wp && SDP_RELEASE=1 SDP_VERSIO=${vWp} npm run build:wp:directori && node wordpress-plugin/eines/empaqueta.mjs --directori && M=$(date +%y%m%d_%H%M) && cp -p wordpress-plugin/builds/directori/socdepoble.zip ../_builds_de_poble/wordpress/\${M}_wordpress_directori_v${vWp}.zip && (cd ../_builds_de_poble/wordpress && shasum -a 256 \${M}_wordpress_directori_v${vWp}.zip > \${M}_wordpress_directori_v${vWp}.zip.sha256)`
    });
    /* v1.2.16 · La quarta botiga: WordPress.org per SVN (Docker), primer en sec; --publica porta el «sí» lligat al zip. */
    web.push({
      plataforma: 'wordpress',
      accio: `Publicar el zip --directori v${vWp} a WordPress.org (trunk/ i tags/${vWp}/, SVN amb Docker; la contrasenya només per stdin), primer en sec i després amb --publica --confirma=${vWp}@<sha12 del zip>`,
      ordre: `node scripts/botigues/puja-wordpress-svn.mjs --zip <../_builds_de_poble/wordpress/AAMMDD_HHMM_wordpress_directori_v${vWp}.zip> --versio ${vWp}`
    });
  }
  if (plataformes.includes('android')) {
    natius.push({
      plataforma: 'android',
      accio: `Compilar i signar l'AAB (${v}+${b}) per a Google Play (${canal}, pista ${pista}); cap APK fora de botiga`,
      ordre: `node scripts/botigues/publica-tot.mjs --versio ${v} --build ${b} --plataforma android --canal ${canal} --compila`
    });
    /* R32.3 · La pujada per l'API REST de Google Play (sense fastlane). v1.2.16 · A la prova tancada
       (alpha), el pla porta --desplega: els verificadors la reben de Google Play sense cap clic. */
    const desplegament = produccio
      ? '«Envia a revisió» és del Mestre (P9)'
      : (alpha ? '--desplega la deixa desplegada (completed) per als verificadors de la prova tancada' : 'a la prova interna, --desplega el deixa desplegat');
    natius.push({
      plataforma: 'android',
      accio: `Pujar l'AAB a Google Play per l'API REST v3 (pista ${pista}, esborrany; ${desplegament}) amb el «sí» del Mestre`,
      ordre: `node scripts/botigues/puja-android.mjs --versio ${v} --build ${b} --canal ${canal}${alpha ? ' --desplega' : ''} --confirma=<«sí» del Mestre>`
    });
    /* R32.3-PEIX-ARD · Només a producció: un build de la prova interna no s'anuncia a tots els Android. */
    if (produccio) {
      anuncis.push({
        plataforma: 'android',
        accio: `Quan Google Play done el versionCode ${b} a la pista production («completed»: promogut a Play Console i desplegat al 100 %), anunciar-lo a les Apps de Google Play (androidBuild a public/.well-known/ard.json) ABANS de «npm run build» i del desplegament web`,
        ordre: `${ORDRE_SINCRONITZA_ARD} --versio ${v} --build ${b}`
      });
    }
  }
  if (plataformes.includes('ios')) {
    natius.push({
      plataforma: 'ios',
      accio: `Arxivar, exportar i verificar IPA (${v}+${b}) per a App Store Connect / TestFlight (${canalIos}${alpha ? ': la prova tancada d\'iOS és TestFlight' : ''})`,
      ordre: `node scripts/botigues/puja-ios.mjs --versio ${v} --build ${b} --canal ${canalIos} --compila`
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
    /* v1.2.7 · P0-123 · Les Apps de TestFlight s'assabenten del build nou pel manifest.
       v1.2.23 · D-V1223-BOTO-BETA-OCULT (ordre del Mestre 261123) · Només quan la ronda amb Beta Testers és oberta
       (SDP_RONDA_BETA_TESTERS=1, d'acord amb RONDA_BETA_TESTERS_OBERTA de src/config/ardSenseTestFlight.v1223.seguretat.test.js):
       fins aleshores el pla no proposa anunciar TestFlight a ard.json.
       v1.2.23 · L8-09 (Gauntlet R1) · Es llig de l'entorn que rep el resum (`env`, per defecte process.env), no de
       process.env: un entorn injectat sense la variable té la ronda tancada encara que el procés la porte. */
    if (env.SDP_RONDA_BETA_TESTERS === '1') {
      anuncis.push({
        plataforma: 'ios',
        accio: 'Anunciar el build pujat a les Apps de TestFlight (testflightIosBuild a ard.json): després de la pujada de puja-ios.mjs --confirma, que l\'apunta al registre, i mai mentre un build de producció més baix espera l\'App Store (App Review); la web el publica en el desplegament següent',
        ordre: `${ORDRE_SINCRONITZA_PROVES} --versio ${v} --build-testflight ${b}`
      });
    }
  }
  const passos = [...natius, ...anuncis, ...web];

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
    /* v1.2.16 · ZERO APK fora de botiga: el resum ho diu, sense cap artefacte ni suma. */
    apkDirecte: { actiu: false, motiu: MOTIU_APK_APAGAT },
    empaquetats,
    passos
  };
}

/* ───────── R32.3 · La versió publicada a ard.json ───────── */

export const ORDRE_SINCRONITZA_PROVES = 'node scripts/botigues/publica-tot.mjs --sincronitza-proves';
/** R32.3-PEIX-ARD · L'anunci a les Apps de les botigues (public/.well-known/ard.json), abans de npm run build. */
export const ORDRE_SINCRONITZA_ARD = 'node scripts/botigues/publica-tot.mjs --sincronitza-ard';

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
   públiques, la del canal de proves d'iOS (src/config/manifestVersio.js) i latestBuild, el més alt de
   tots els builds (el calcula l'escriptor; mai s'escriu a mà).
   v1.2.16 · ZERO APK fora de botiga (MOTIU_APK_APAGAT): apkDirectBuild i apkSha256 ja no són claus de
   versió. Si un ard.json encara en porta (de la v1.2.7 a la v1.2.15 només anaven a la còpia de dist/),
   la pròxima escriptura els retira i latestBuild ja no els compta: cap App veu cap APK anunciat. */
export const CLAUS_DE_VERSIO = Object.freeze(['version', 'androidBuild', 'iosBuild', 'testflightIosBuild', 'latestBuild']);
const CLAUS_DE_BUILD = Object.freeze(['androidBuild', 'iosBuild', 'testflightIosBuild']);
/** v1.2.16 · Els anuncis de l'APK directe que es retiren en escriure ard.json. */
export const CLAUS_APK_RETIRADES = Object.freeze(['apkDirectBuild', 'apkSha256']);

/* Les guardes comunes i l'escriptura de les claus de versió: la versió X.Y.Z que mai baixa, cada build
   un enter positiu que no passa de `maximBuild` i que mai baixa, i latestBuild recalculat. Llança amb el
   motiu; torna el text nou. `builds` només porta els builds que es canvien. */
function aplicaVersions(text, { versio, builds, maximBuild, corregeix }) {
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
  const nou = { version: String(versio), ...Object.fromEntries(builds.map(([nom, valor]) => [nom, Number(valor)])) };
  if (!corregeix && VERSIO.test(String(dades.version ?? '')) && comparaVersions(nou.version, dades.version) < 0) {
    throw new Error(`ard.json ja publica la versió ${dades.version}: no es baixa a ${nou.version} (si és una errada, --corregeix-ard)`);
  }
  for (const [nom] of builds) {
    if (!corregeix && Number.isSafeInteger(dades[nom]) && nou[nom] < dades[nom]) {
      throw new Error(`ard.json ja publica ${nom} ${dades[nom]}: no es baixa a ${nou[nom]} (si és una errada, --corregeix-ard)`);
    }
  }
  const fusio = { ...dades, ...nou };
  for (const clau of CLAUS_APK_RETIRADES) delete fusio[clau];
  const valids = CLAUS_DE_BUILD.map((clau) => fusio[clau]).filter((valor) => Number.isSafeInteger(valor) && valor >= 1);
  if (valids.length) fusio.latestBuild = Math.max(...valids);
  const resultat = {};
  for (const clau of CLAUS_DE_VERSIO) if (Object.hasOwn(fusio, clau)) resultat[clau] = fusio[clau];
  for (const [clau, valor] of Object.entries(fusio)) if (!CLAUS_DE_VERSIO.includes(clau)) resultat[clau] = valor;
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

/* v1.2.16 · Un anunci de l'APK directe (apkDirectBuild o apkSha256) que algú encara demana: es refusa. */
const demanaApk = ({ apkDirectBuild = null, apkSha256 = null } = {}) => [apkDirectBuild, apkSha256].some((valor) => valor !== null && valor !== undefined);

/**
 * v1.2.7 · P0-123 · Pur: el text d'ard.json amb version i testflightIosBuild posats, i latestBuild. Les
 * mateixes guardes que sincronitzaManifestVersio. v1.2.16 · Un apkDirectBuild o una apkSha256 es refusen
 * (MOTIU_APK_APAGAT). Llança amb el motiu.
 */
export function sincronitzaManifestProves(text, { versio, testflightIosBuild = null, maximBuild = Number(VERSIO_CLIENT_NATIU), corregeix = false, ...resta } = {}) {
  if (demanaApk(resta)) throw new Error(MOTIU_APK_APAGAT);
  if (!VERSIO.test(String(versio ?? ''))) throw new Error('la versió ha de ser X.Y.Z');
  if (testflightIosBuild === null || testflightIosBuild === undefined) throw new Error('cal testflightIosBuild: el build que ja dona TestFlight');
  return aplicaVersions(text, { versio, builds: [['testflightIosBuild', testflightIosBuild]], maximBuild, corregeix });
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
 *    i la tancada (alpha, v1.2.16) només les reben els seus provadors, i androidBuild s'anuncia a tots
 *    els Android: una pista internal o alpha «completed» no hi compta. Un esborrany, un desplegament
 *    per fases o un llançament aturat tampoc es donen a tothom. Es pregunta per totes les pistes
 *    perquè l'error explique on és el build;
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
        else mal(EIXIDA.ARBRE, `Google Play no té el versionCode ${androidBuild} a cap pista (${Object.values(PISTES).join(', ')}): primer puja-android.mjs --confirma`);
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

/* ───────── v1.2.7 · P0-123 · El canal de proves del manifest (TestFlight) ───────── */

/**
 * Escriu el canal de proves d'iOS (testflightIosBuild) a public/.well-known/ard.json (o `cami`) i, si hi
 * ha un build fet (dist/index.html i dist/.well-known/ard.json; o `camiDist`), també a la còpia de dist/
 * que es desplega: totes dues o cap (primer es calculen les dues, després s'escriuen). La versió ha de ser
 * la de package.json. Amb `sec`, només les guardes.
 * v1.2.16 · ZERO APK fora de botiga: un apkDirectBuild o una apkSha256 es refusen abans de llegir res, i
 * els anuncis heretats de l'APK que encara hi haja a qualsevol de les dues còpies es retiren.
 * @returns {{ codi:number, canviat?:boolean, escrits?:string[], error?:string }}
 */
export function escriuManifestProves({
  arrel, versio, testflightIosBuild = null, corregeix = false,
  cami = path.join(arrel, ...MANIFEST_VERSIO),
  camiDist = fs.existsSync(path.join(arrel, 'dist', 'index.html')) ? path.join(arrel, ...MANIFEST_VERSIO_DIST) : null,
  versioPaquet = versioDelPaquet(arrel), maximBuild = Number(VERSIO_CLIENT_NATIU), sec = false, ...resta
}) {
  if (demanaApk(resta)) return { codi: EIXIDA.US, error: MOTIU_APK_APAGAT };
  if (String(versio) !== String(versioPaquet)) {
    return { codi: EIXIDA.ARBRE, error: `--versio ${versio} no és la de package.json (${versioPaquet ?? 'il·legible'}): el manifest anuncia la versió del sistema` };
  }
  if (testflightIosBuild === null || testflightIosBuild === undefined) {
    return { codi: EIXIDA.ARBRE, error: 'cal testflightIosBuild: el build que ja dona TestFlight' };
  }
  const camins = [[cami, MANIFEST_VERSIO.join('/')]];
  if (camiDist && fs.existsSync(camiDist)) camins.push([camiDist, MANIFEST_VERSIO_DIST.join('/')]);
  const plans = [];
  for (const [desti, nom] of camins) {
    let abans;
    try {
      if (fs.lstatSync(desti).isSymbolicLink()) return { codi: EIXIDA.ARBRE, error: `${nom} és un enllaç: no s’escriu` };
      abans = fs.readFileSync(desti, 'utf8');
    } catch { return { codi: EIXIDA.ARBRE, error: `no es pot llegir ${nom}` }; }
    let despres;
    try {
      despres = sincronitzaManifestProves(abans, { versio, testflightIosBuild, maximBuild, corregeix });
    } catch (error) { return { codi: EIXIDA.ARBRE, error: `${nom}: ${error.message}` }; }
    plans.push({ desti, nom, abans, despres });
  }
  if (sec) return { codi: EIXIDA.BE, canviat: plans.some((pla) => pla.despres !== pla.abans), escrits: [] };
  const canviats = plans.filter((pla) => pla.despres !== pla.abans);
  if (!canviats.length) return { codi: EIXIDA.BE, canviat: false, escrits: [] };
  for (const pla of canviats) escriuAtomic(pla.desti, (temporal) => fs.writeFileSync(temporal, pla.despres, 'utf8'));
  return { codi: EIXIDA.BE, canviat: true, escrits: canviats.map((pla) => pla.nom) };
}

/**
 * L'evidència del canal de proves d'iOS, ABANS d'escriure res. Mai llança.
 *  · TestFlight (testflightIosBuild) · el registre de pujades (SDP_BUILDS_DIR/pujades.jsonl, fora del
 *    repositori) porta el build d'iOS, de qualsevol canal (puja-ios.mjs només l'apunta DESPRÉS d'una
 *    pujada feta a App Store Connect, que el dona a TestFlight quan acaba de processar-lo), d'una
 *    versió que no és més nova que la del manifest. P0123-02 · I cap pujada de PRODUCCIÓ d'iOS amb un
 *    build més alt que `iosBuildPublicat` (l'iosBuild d'ard.json, el que ja dona l'App Store) i més baix
 *    que el demanat: eixe build pot estar en App Review, on l'App porta el rebut de proves com a
 *    TestFlight, o pendent de publicar, i un TestFlight més nou li mostraria «Actualitza a TestFlight».
 *  · v1.2.16 · Un apkDirectBuild es refusa (eixida 2, MOTIU_APK_APAGAT): cap APK fora de botiga.
 * @returns {Promise<{ codi:number, problemes:string[], avisos:string[] }>}
 */
export async function comprovaProves({ arrel, valors = {}, versio, testflightIosBuild = null, iosBuildPublicat = null, ...resta }) {
  const problemes = [];
  const avisos = [];
  let codi = EIXIDA.BE;
  const mal = (c, text) => { if (codi === EIXIDA.BE) codi = c; problemes.push(text); };
  if (demanaApk(resta)) mal(EIXIDA.US, MOTIU_APK_APAGAT);
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
        // v1.2.16 · El corredor no fabrica el «sí» del Mestre: WordPress.org es publica a la terminal.
        emet('wordpress', 'error', `WordPress.org no es publica des del corredor: el «sí» és del Mestre (node scripts/botigues/puja-wordpress-svn.mjs --zip <zip --directori v${vWp}> --versio ${vWp}, primer en sec).`);
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
        // v1.2.16 · ZERO APK fora de botiga: l'assaig només parla de l'AAB per a Google Play.
        emet('android', 'fet', `Assaig Android verificat (${vAndroid}+${bAndroid}, AAB per a Google Play).`);
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
 * @param {{ env?: object, play?: object, manifest?: string|null, manifestDist?: string|null }} [dependencies]
 *   Només per a les proves: l'entorn (SDP_BOTIGUES_ENV), les opcions del client de Google Play (adreces locals) i la
 *   ruta d'un ard.json temporal (i la de la seua còpia de dist/, per a --sincronitza-proves).
 */
export async function main(argv = process.argv.slice(2), { env = process.env, play = {}, manifest = null, manifestDist = null } = {}) {
  const { opcions, errors } = analitzaArguments(argv, ADMESOS);
  if (opcions.ajuda) {
    process.stdout.write(`node scripts/botigues/publica-tot.mjs ${US.slice(4)}\n`);
    return EIXIDA.BE;
  }
  /* v1.2.16 · ZERO APK fora de botiga (ordre del Mestre 261121): --publica-apk i --build-apk es refusen
     abans de res més, amb el motiu, i sense llegir cap entorn ni tocar cap fitxer. */
  if (opcions['publica-apk'] || opcions['build-apk'] !== undefined) {
    return plega(EIXIDA.US, `${opcions['publica-apk'] ? '--publica-apk' : '--build-apk'}: ${MOTIU_APK_APAGAT}`);
  }
  if (errors.length) return plega(EIXIDA.US, US, errors);

  const arrel = arrelComprovada();
  if (!arrel) return plega(EIXIDA.EINA, 'git no reconeix l’arrel del repositori');

  /* v1.2.7 · P0-123 · El canal de proves d'iOS, una ordre sola: després de puja-ios.mjs (TestFlight). Res
     s'escriu fins que totes les guardes passen. */
  if (opcions['sincronitza-proves']) {
    /* v1.2.23 · D-V1223-BOTO-BETA-OCULT (ordre del Mestre 261123) · El botó/anunci públic de TestFlight queda ocult fins
       a l'inici formal de la ronda amb Beta Testers: abans de cap guarda, sense llegir l'entorn ni tocar cap fitxer.
       Obrir-la és SDP_RONDA_BETA_TESTERS=1, en el mateix canvi que posa RONDA_BETA_TESTERS_OBERTA a true.
       v1.2.23 · L8-09 (Gauntlet R1) · La variable es llig de l'entorn de main (`env`, per defecte process.env), el
       mateix que després carrega el fitxer d'entorn; continua sent abans de cap guarda i sense llegir cap fitxer. */
    if (env.SDP_RONDA_BETA_TESTERS !== '1') return plega(EIXIDA.US, 'v1.2.23 · D-V1223-BOTO-BETA-OCULT (ordre del Mestre 261123) · la ronda amb Beta Testers no és oberta: testflightIosBuild no s\'escriu a ard.json');
    const admesos = new Set(['sincronitza-proves', 'versio', 'build-testflight', 'corregeix-ard']);
    const sobren = Object.keys(opcions).filter((nom) => !admesos.has(nom));
    if (sobren.length) return plega(EIXIDA.US, `--sincronitza-proves només va amb --versio, --build-testflight i --corregeix-ard (sobren: ${sobren.map((n) => `--${n}`).join(', ')})`);
    if (!VERSIO.test(String(opcions.versio ?? '')) || !BUILD.test(String(opcions['build-testflight'] ?? ''))) {
      return plega(EIXIDA.US, 'cal --versio X.Y.Z explícita i --build-testflight M (iOS, TestFlight)');
    }
    const corregeix = Boolean(opcions['corregeix-ard']);
    const testflightIosBuild = opcions['build-testflight'];
    const camins = manifest ? { cami: manifest, camiDist: manifestDist } : {};
    // 1. Les guardes pures, en sec, abans de llegir cap entorn.
    const assaig = escriuManifestProves({ arrel, versio: opcions.versio, testflightIosBuild, corregeix, ...camins, sec: true });
    if (assaig.codi !== EIXIDA.BE) return plega(assaig.codi, `${assaig.error}: ard.json no canvia`);
    const entorn = carregaEntorn({ arrel, env });
    if (entorn.codi !== EIXIDA.BE) return plega(entorn.codi, 'El fitxer d\'entorn no deixa seguir: no es fa res.', entorn.problemes);
    const { valors } = entorn;
    const net = (text) => emmascara(text, valors, arrel);
    // 2. L'evidència: el registre de pujades d'iOS, amb l'iosBuild que ja publica ard.json (P0123-02).
    const iosBuildPublicat = iosBuildDelManifest(camins.cami ?? path.join(arrel, ...MANIFEST_VERSIO));
    const evidencia = await comprovaProves({ arrel, valors, versio: opcions.versio, testflightIosBuild, iosBuildPublicat });
    for (const avis of evidencia.avisos) process.stdout.write(`  · ${net(avis)}\n`);
    if (evidencia.codi !== EIXIDA.BE) return plega(evidencia.codi, 'ard.json no canvia: l’App avisaria d’un build que el canal de proves encara no dona.', evidencia.problemes.map(net));
    // 3. L'escriptura (atòmica), amb totes les guardes de nou.
    const res = escriuManifestProves({ arrel, versio: opcions.versio, testflightIosBuild, corregeix, ...camins });
    if (res.codi !== EIXIDA.BE) return plega(res.codi, `${res.error}: ard.json no canvia`);
    if (corregeix && res.canviat) process.stdout.write('! --corregeix-ard: el manifest s\'ha corregit a mà (pot baixar); anota-ho al rebut del desplegament\n');
    process.stdout.write(`✓ ${res.canviat ? res.escrits.join(' i ') : MANIFEST_VERSIO.join('/')}: version ${opcions.versio}, testflightIosBuild ${testflightIosBuild}${res.canviat ? '' : ' (ja hi era)'}\n`);
    process.stdout.write('  El desplegament web següent el publica (npm run build copia public/ a dist/).\n');
    return EIXIDA.BE;
  }
  if (opcions['build-testflight'] !== undefined) {
    return plega(EIXIDA.US, '--build-testflight només va amb --sincronitza-proves');
  }

  /* R32.3 · L'anunci a les Apps de les botigues, sol (sense plataforma, canal ni pujada): el manifest viu
     a public/ i el build el copia a dist/, així que --sincronitza-ard va ABANS de npm run build. No
     escriu res fins que totes les guardes passen. */
  if (opcions['sincronitza-ard']) {
    const admesos = new Set(['sincronitza-ard', 'versio', 'build', 'build-ios', 'corregeix-ard']);
    const sobren = Object.keys(opcions).filter((nom) => !admesos.has(nom));
    if (sobren.length) return plega(EIXIDA.US, `--sincronitza-ard només va amb --versio, --build, --build-ios i --corregeix-ard (sobren: ${sobren.map((n) => `--${n}`).join(', ')})`);
    const bonBuild = (nom) => opcions[nom] === undefined || BUILD.test(String(opcions[nom]));
    if (!VERSIO.test(String(opcions.versio ?? '')) || !bonBuild('build') || !bonBuild('build-ios')
        || (opcions.build === undefined && opcions['build-ios'] === undefined)) {
      return plega(EIXIDA.US, 'cal --versio X.Y.Z explícita i --build N (Android) i/o --build-ios M (iOS)');
    }
    const entorn = carregaEntorn({ arrel, env });
    if (entorn.codi !== EIXIDA.BE) return plega(entorn.codi, 'El fitxer d\'entorn no deixa seguir: no es fa res.', entorn.problemes);
    const { valors } = entorn;
    const net = (text) => emmascara(text, valors, arrel);
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
  if (opcions['build-ios'] !== undefined) return plega(EIXIDA.US, '--build-ios només va amb --sincronitza-ard');
  if (opcions['corregeix-ard']) return plega(EIXIDA.US, '--corregeix-ard només va amb --sincronitza-ard o --sincronitza-proves');

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
  /* v1.2.16 · alpha és la prova tancada de Google Play: val per a Android (i per al pla de totes, on
     iOS va a TestFlight, el canal intern); amb --plataforma ios, no. */
  const canal = opcions.canal ?? CANALS.INTERN;
  const delCanal = plataforma === 'ios' ? ['ios'] : ['android'];
  if (!canalAdmes(canal, delCanal)) return plega(EIXIDA.US, usDelCanal(delCanal));

  const empaquetats = recullEmpaquetats(arrel);
  const versio = opcions.versio ?? empaquetats.canonica ?? '1.0.0';
  const build = opcions.build ?? empaquetats.plataformes?.android?.builds?.[0] ?? '2';
  if (!VERSIO.test(versio) || !BUILD.test(build)) {
    return plega(EIXIDA.US, US);
  }

  /* v1.2.23 · L8-09 (Gauntlet R1) · El pla rep l'entorn de main: el mateix per al preflight i per a la ronda de TestFlight. */
  const resum = resumOmnicanal(arrel, { versio, build, canal, plataforma, push: Boolean(opcions.push), env });

  if (!opcions.compila && opcions.confirma === undefined) {
    if (opcions.json) {
      process.stdout.write(`${JSON.stringify(resum, null, 2)}\n`);
    } else {
      process.stdout.write([
        `[Mode Jarvis Omnicanal · IDEA-60] Versió ${versio}+${build} · Canal: ${canal} · Plataforma: ${plataforma}`,
        `Higiene de paquets (IDEA-62): ${resum.higiene.valid ? '✓ neta' : '✗ incidències'} (${resum.higiene.fitxers} fitxers en ${resum.higiene.examinades.length} superfícies)`,
        `APK directe: apagat · ${resum.apkDirecte.motiu}`,
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
    return plega(EIXIDA.EINA, `L’acció ${plataforma} no té cap publicador connectat a esta CLI; el resum en sec mostra les ordres disponibles${plataforma === 'wordpress' ? ' (WordPress.org: scripts/botigues/puja-wordpress-svn.mjs)' : ''}.`);
  }
  if (opcions.json) return plega(EIXIDA.US, '--json és només per al resum en sec; la compilació o pujada conserva el rebut del script natiu.');

  if (!resum.higiene.valid) {
    return plega(EIXIDA.ARBRE, 'IDEA-62: tractor-higiene-paquets ha detectat contaminació als paquets:', resum.higiene.incidencies.map((i) => `${i.cami}: ${i.motiu}`));
  }

  if (opcions.desplega && plataforma !== 'android') return plega(EIXIDA.US, '--desplega només és d’Android (la prova interna o la tancada, alpha, de Google Play)');
  const argumentsNatius = ['--versio', versio, '--build', build, '--canal', canal];
  if (opcions.push) argumentsNatius.push('--push');
  if (opcions.desplega) argumentsNatius.push('--desplega');
  if (opcions.compila) argumentsNatius.push('--compila');
  if (opcions.confirma !== undefined) argumentsNatius.push(`--confirma=${opcions.confirma}`);
  /* v1.2.16 · Només l'AAB (Android) o l'IPA (iOS): cap APK directe al costat (MOTIU_APK_APAGAT). */
  return (plataforma === 'ios' ? pujaIos : pujaAndroid)(argumentsNatius);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then((codi) => { process.exitCode = codi; });
}
