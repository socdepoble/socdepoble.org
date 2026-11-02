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
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  BUILD, CANALS, EIXIDA, VERSIO, analitzaArguments, emmascara,
  empremtaDeKeytool, executa, normalitzaEmpremta, plega, rutaDe, sha256DeFitxer
} from './entorn.mjs';
import { arrelComprovada, preflight } from './preflight.mjs';
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
  json: false,
  ajuda: false
});

const PLATAFORMES_VALIDES = Object.freeze(['totes', 'web', 'wordpress', 'android', 'ios']);
const US = 'Ús: --notes "<notes>" [--canals web,wordpress,android,ios] [--sec] | --versio X.Y.Z --build N [--plataforma totes|web|wordpress|android|ios] [--canal intern|produccio] [--compila] [--confirma=...] [--json]';

export const APK_RELEASE = Object.freeze(['android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk']);
export const NOM_APK_PUBLIC = 'socdepoble-android-latest.apk';

const CAMI_ABSOLUT = /\/(?:Users|home|private|var|tmp|etc|opt|Volumes)\/[^\s"')]*/g;
const sanejaTextPas = (txt) => String(txt ?? '').replace(CAMI_ABSOLUT, '<camí>').trim().slice(0, 300);

/**
 * Construeix el resum omnicanal en sec (sense secrets) per a la CLI i per a proves.
 */
export function resumOmnicanal(arrel, { versio, build, canal = CANALS.INTERN, plataforma = 'totes', env = process.env, consultes = {} } = {}) {
  const empaquetats = recullEmpaquetats(arrel);
  const v = versio ?? empaquetats.canonica ?? '1.0.0';
  const b = build ?? empaquetats.plataformes?.android?.builds?.[0] ?? '2';
  const plataformes = plataforma === 'totes' ? ['web', 'wordpress', 'android', 'ios'] : [plataforma];
  const natives = plataformes.filter((p) => p === 'android' || p === 'ios');

  const pre = natives.length
    ? preflight({ arrel, plataformes: natives, signa: false, env, consultes, canal })
    : { codi: EIXIDA.BE, linies: [], valors: {}, fastlane: false, jdk: null, segell: null };

  const higiene = inspeccionaHigienePaquets(arrel);
  const valors = pre.valors ?? {};

  const passos = [];
  if (plataformes.includes('web')) {
    passos.push({
      plataforma: 'web',
      accio: 'Compilar i desplegar PWA + Open Data + ActivityPub a socdepoble.org',
      ordre: 'npm run build && firebase deploy --only hosting'
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
      ordre: `node scripts/botigues/puja-android.mjs --versio ${v} --build ${b} --canal ${canal} --compila`
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

  const btDir = path.join(os.homedir(), 'Library', 'Android', 'sdk', 'build-tools');
  const versionsBt = fs.existsSync(btDir) ? fs.readdirSync(btDir).sort() : [];
  const apksigner = versionsBt.length ? path.join(btDir, versionsBt.at(-1), 'apksigner') : null;
  let empremta = null;
  if (apksigner && fs.existsSync(apksigner)) {
    const certApk = await executa(apksigner, ['verify', '--print-certs', apk], {
      valors,
      arrel,
      mostra: false,
      eco: false,
      entornExtra: { JAVA_HOME: jdkHome }
    });
    const m = String(certApk.crua ?? '').match(/SHA-256 digest:\s*([0-9a-fA-F:]{64,})/);
    if (certApk.codi === 0 && m) empremta = normalitzaEmpremta(m[1]);
  }
  if (!empremta) {
    const cert = await executa('keytool', ['-printcert', '-jarfile', apk], { valors, arrel, mostra: false, eco: false });
    if (cert.codi === 0) empremta = empremtaDeKeytool(cert.crua);
  }
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
        const res = await executa(process.execPath, [
          'scripts/botigues/puja-android.mjs',
          '--versio', vAndroid,
          '--build', bAndroid,
          `--confirma=${vAndroid}+${bAndroid}`
        ], { cwd: arrel, valors: pre.valors, arrel, mostra: false, eco: false });
        if (res.codi === 0) {
          emet('android', 'fet', `Google Play i APK enviats (${vAndroid}+${bAndroid}).`);
        } else {
          emet('android', 'error', `puja-android.mjs ha tornat ${res.codi} (${vAndroid}+${bAndroid}).`);
          totBe = false;
        }
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

export async function main(argv = process.argv.slice(2)) {
  const { opcions, errors } = analitzaArguments(argv, ADMESOS);
  if (opcions.ajuda) {
    process.stdout.write(`node scripts/botigues/publica-tot.mjs ${US.slice(4)}\n`);
    return EIXIDA.BE;
  }
  if (errors.length) return plega(EIXIDA.US, US, errors);

  const arrel = arrelComprovada();
  if (!arrel) return plega(EIXIDA.EINA, 'git no reconeix l’arrel del repositori');

  // Camí del corredor Jarvis (--notes, --canals, --sec)
  if (opcions.notes !== undefined || opcions.canals !== undefined || opcions.sec) {
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

  const resum = resumOmnicanal(arrel, { versio, build, canal, plataforma });

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
    return resum.higiene.valid ? EIXIDA.BE : EIXIDA.ARBRE;
  }

  if (!resum.higiene.valid) {
    return plega(EIXIDA.ARBRE, 'IDEA-62: tractor-higiene-paquets ha detectat contaminació als paquets:', resum.higiene.incidencies.map((i) => `${i.cami}: ${i.motiu}`));
  }

  if (opcions.compila && (plataforma === 'totes' || plataforma === 'android')) {
    const pre = preflight({ arrel, plataformes: ['android'], signa: true, canal, push: Boolean(opcions.push) });
    if (pre.codi !== EIXIDA.BE) return plega(pre.codi, 'Preflight Android amb problemes: no es compila res.', pre.linies);
    const resApk = await compilaApkDirecte({ arrel, valors: pre.valors, jdkHome: pre.jdk.home, versio, build });
    if (resApk.codi !== EIXIDA.BE) return plega(resApk.codi, resApk.error);
    process.stdout.write(`✓ APK directe universal signat i verificat: ${resApk.nomFitxer} (SHA-256: ${resApk.sha256})\n`);
  }

  return EIXIDA.BE;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then((codi) => { process.exitCode = codi; });
}
