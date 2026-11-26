#!/usr/bin/env node
/** A02 / D1 (v1.2.26, Lot C1-0c) · Coherència entre els manifests de privacitat dels SDK enllaçats
 *  i el que declara l'App (PrivacyInfo.xcprivacy + etiqueta App Privacy d'App Store Connect).
 *
 *  DADA de partida (arxiu 1.2.24-29, plutil, 26-11-2026): GoogleSignIn declara PhoneNumber,
 *  OtherDataTypes, DeviceID i OtherUsageData, i la finalitat Analytics per a UserID i OtherDataTypes;
 *  el PrivacyInfo de l'App no en declara cap.
 *
 *  Dues fonts, separades a propòsit (Gauntlet 261126, lent B):
 *   - `scripts/botigues/revisio-privacitat-sdk.json` (versionat): les parelles «Tipus|Finalitat» que
 *     declara el manifest de cada SDK, observades en un arxiu real. És un fet tècnic del codi.
 *   - `<SDP_BUILDS_DIR>/revisio-etiqueta-asc.json` (fora de Git): la revisió humana de l'etiqueta
 *     d'App Store Connect (data AAAA-MM-DD, versió, qui, parelles revisades). Apuntar-la no embruta
 *     l'arbre ni canvia el segell de dist-natiu: no obliga a compilar cap build nou.
 *  Una parella d'un SDK està coberta si el PrivacyInfo de l'App la declara o si la revisió d'ASC la llista.
 *  Abans de compilar, el preflight avisa (intern) o para (producció) si la revisió no cobrix el registre.
 *  Sobre l'IPA, `puja-ios.mjs` compara les parelles reals de cada manifest abans del rebut i de la pujada.
 *  Només llig. CLI: node scripts/botigues/privacitat-sdk.mjs --app=CAMI/App.app [--revisio=FITXER] [--produccio] [--json]
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const REGISTRE = ['scripts', 'botigues', 'revisio-privacitat-sdk.json'];
export const NOM_REVISIO_ASC = 'revisio-etiqueta-asc.json';
const PREFIX_TIPUS = 'NSPrivacyCollectedDataType';
const PREFIX_FINALITAT = 'NSPrivacyCollectedDataTypePurpose';
const PARELL = /^[A-Za-z]+\|[A-Za-z]+$/;
const DATA = /^\d{4}-\d{2}-\d{2}$/;
const curt = (valor, prefix) => String(valor ?? '').startsWith(prefix) ? String(valor).slice(prefix.length) : String(valor ?? '');
const parellsValids = (v) => Array.isArray(v) && v.length > 0 && v.every((p) => typeof p === 'string' && PARELL.test(p));

/** SDK que aporten manifest propi i com es detecta que el projecte natiu (SPM) els enllaça. */
export const SDK_AMB_MANIFEST = Object.freeze([
  Object.freeze({
    sdk: 'GoogleSignIn',
    connector: ['node_modules', '@capgo', 'capacitor-social-login', 'Package.swift'],
    producte: /\.product\(\s*name:\s*"GoogleSignIn"/,
    spm: /\.package\(\s*name:\s*"CapgoCapacitorSocialLogin"/
  })
]);

const senseComentaris = (codi) => codi.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(?<![:"])\/\/[^\n]*/g, '');
const lligDe = (arrel, trossos) => { try { return fs.readFileSync(path.join(arrel, ...trossos), 'utf8'); } catch { return null; } };

/** Parelles «Tipus|Finalitat» d'un manifest ja convertit a objecte. */
export function parellsDelManifest(manifest) {
  const parells = new Set();
  for (const t of manifest?.NSPrivacyCollectedDataTypes ?? []) {
    const tipus = curt(t?.NSPrivacyCollectedDataType, PREFIX_TIPUS);
    for (const f of t?.NSPrivacyCollectedDataTypePurposes ?? []) parells.add(`${tipus}|${curt(f, PREFIX_FINALITAT)}`);
  }
  return [...parells].sort();
}

export function llegixRegistre(arrel) {
  const text = lligDe(arrel, REGISTRE);
  if (text === null) return { registre: null, problema: `${REGISTRE.join('/')} no hi és` };
  try {
    const registre = JSON.parse(text);
    if (registre?.schema !== 'sdp.botigues.privacitat-sdk.v1' || !registre.sdks || typeof registre.sdks !== 'object'
      || Object.values(registre.sdks).some((e) => !parellsValids(e?.parells))) throw new Error('esquema');
    return { registre, problema: null };
  } catch { return { registre: null, problema: `${REGISTRE.join('/')} no és un registre sdp.botigues.privacitat-sdk.v1 amb parelles Tipus|Finalitat` }; }
}

/** La revisió humana de l'etiqueta d'ASC, fora de Git. Sense carpeta o sense fitxer: cap revisió. */
export function llegixRevisioAsc(carpeta) {
  if (!carpeta) return { revisio: null, problema: 'sense SDP_BUILDS_DIR no hi ha on llegir la revisió de l\'etiqueta d\'ASC', cami: null };
  const cami = path.join(carpeta, NOM_REVISIO_ASC);
  if (!fs.existsSync(cami)) return { revisio: null, problema: null, cami };
  try {
    const revisio = JSON.parse(fs.readFileSync(cami, 'utf8'));
    if (revisio?.schema !== 'sdp.botigues.revisio-etiqueta-asc.v1' || !revisio.sdks || typeof revisio.sdks !== 'object') throw new Error('esquema');
    return { revisio, problema: null, cami };
  } catch { return { revisio: null, problema: `${NOM_REVISIO_ASC} no és una revisió sdp.botigues.revisio-etiqueta-asc.v1`, cami }; }
}

/** Parelles revisades a ASC per a un SDK; només compten amb data AAAA-MM-DD i parelles vàlides. */
export function parellsRevisats(revisio, sdk) {
  const e = revisio?.sdks?.[sdk];
  return e && typeof e.revisadaEl === 'string' && DATA.test(e.revisadaEl) && parellsValids(e.parells) ? new Set(e.parells) : new Set();
}

/** Abans de compilar: SDK enllaçats que aporten manifest, i si la revisió d'ASC cobrix les seues parelles. */
export function privacitatSdkIos(arrel, { revisio = null } = {}) {
  const spm = lligDe(arrel, ['ios', 'App', 'CapApp-SPM', 'Package.swift']);
  const enllacats = SDK_AMB_MANIFEST.filter((s) => {
    const connector = lligDe(arrel, s.connector);
    return spm !== null && connector !== null && s.spm.test(senseComentaris(spm)) && s.producte.test(senseComentaris(connector));
  }).map((s) => s.sdk);
  if (!enllacats.length) return { enllacats, sdks: [], problema: null };
  const { registre, problema } = llegixRegistre(arrel);
  const sdks = enllacats.map((sdk) => {
    const parells = registre?.sdks?.[sdk]?.parells ?? [];
    const revisats = parellsRevisats(revisio, sdk);
    return { sdk, registrat: parells.length > 0, parells, faltenARevisio: parells.filter((p) => !revisats.has(p)) };
  });
  return { enllacats, sdks, problema };
}

export function liniesPrivacitatSdk(estat, { plataformes = [], produccio = false, problemaRevisio = null } = {}) {
  const linies = [], mal = [];
  if (!plataformes.includes('ios') || !estat?.enllacats?.length) return { linies, mal };
  const errada = (text) => { linies.push(`  ✗ ${text}`); mal.push(text); };
  const avis = (text) => linies.push(`  ! ${text}`);
  if (estat.problema) { errada(`${estat.problema}: els SDK ${estat.enllacats.join(', ')} aporten manifest de privacitat propi (A02)`); return { linies, mal }; }
  if (problemaRevisio) (produccio ? errada : avis)(`${problemaRevisio} (A02)`);
  const on = `${NOM_REVISIO_ASC} de SDP_BUILDS_DIR (fora de Git: no canvia el binari)`;
  for (const s of estat.sdks) {
    if (!s.registrat) errada(`${s.sdk} s'enllaça i aporta manifest de privacitat, però no té parelles a ${REGISTRE.join('/')} (A02)`);
    else if (!s.faltenARevisio.length) linies.push(`  ✓ ${s.sdk}: les ${s.parells.length} parelles del seu manifest consten revisades a l'etiqueta App Privacy d'App Store Connect`);
    else (produccio ? errada : avis)(`${s.sdk}: l'etiqueta App Privacy d'App Store Connect no consta revisada per a ${s.faltenARevisio.length} de ${s.parells.length} parelles; el Mestre la revisa i ho apunta a ${on} (A02)`);
  }
  return { linies, mal };
}

/** Converteix un .xcprivacy (plist XML o binari) a objecte amb plutil (macOS). */
export function llegixManifest(cami) {
  return JSON.parse(execFileSync('plutil', ['-convert', 'json', '-o', '-', '--', cami], { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 }));
}

/** El nom de l'SDK a partir del camí dins de l'App.app (SPM, CocoaPods, frameworks i extensions). */
export function nomDeLSdk(rel) {
  const trossos = rel.split(/[\\/]/);
  if (trossos.length === 1) return null;
  const contenidor = ['Frameworks', 'PlugIns'].includes(trossos[0]) && trossos.length > 2 ? trossos[1] : trossos[0];
  const base = contenidor.replace(/\.(bundle|framework|appex)$/, '');
  const parts = base.split('_');
  // SPM: «Paquet_Producte.bundle» → Producte. CocoaPods: «Pod_Privacy.bundle» o «PodPrivacy.bundle» → Pod.
  if (parts.length > 1 && parts.at(-1) === 'Privacy') return parts.slice(0, -1).join('_');
  return parts.at(-1).replace(/Privacy$/, '') || base;
}

/** Manifests d'una App.app: el de l'App (a l'arrel) i els dels SDK (bundles, frameworks i extensions). */
export function manifestsDeLApp(app, { llegix = llegixManifest } = {}) {
  const trobats = [];
  const camina = (dir) => {
    for (const nom of fs.readdirSync(dir).sort()) {
      const cami = path.join(dir, nom), estat = fs.lstatSync(cami);
      if (estat.isSymbolicLink()) continue;
      if (estat.isDirectory()) camina(cami);
      else if (nom === 'PrivacyInfo.xcprivacy') trobats.push(cami);
    }
  };
  camina(app);
  return trobats.map((cami) => {
    const rel = path.relative(app, cami);
    return { rel, sdk: nomDeLSdk(rel), parells: parellsDelManifest(llegix(cami)) };
  });
}

/** Parelles dels SDK que ni l'App ni la revisió d'ASC cobrixen. */
export function cobertura(manifests, { registre = null, revisio = null } = {}) {
  const app = new Set(manifests.find((m) => m.sdk === null)?.parells ?? []);
  const noCobertes = [];
  for (const m of manifests.filter((x) => x.sdk !== null)) {
    const revisats = parellsRevisats(revisio, m.sdk);
    for (const p of m.parells) if (!app.has(p) && !revisats.has(p)) noCobertes.push({ sdk: m.sdk, parell: p, registrat: Boolean(registre?.sdks?.[m.sdk]?.parells?.includes(p)) });
  }
  return { app: [...app], sdks: manifests.filter((x) => x.sdk !== null && x.parells.length).map((x) => ({ sdk: x.sdk, parells: x.parells })), noCobertes };
}

/** La decisió de puja-ios sobre l'App de l'IPA: línies per a stdout i, si cal parar, el motiu. */
export function comprovaPrivacitatIpa({ app, arrel, carpetaBuilds, produccio = false, llegix = llegixManifest }) {
  let manifests;
  try { manifests = manifestsDeLApp(app, { llegix }); }
  catch (e) {
    const motiu = `no s'han pogut llegir els manifests de privacitat (PrivacyInfo.xcprivacy) de l'app de l'IPA: ${String(e.message).split('\n')[0]}`;
    return produccio ? { linies: [], atura: `${motiu} (A02)` } : { linies: [`  ! ${motiu} (A02)`], atura: null };
  }
  const { registre } = llegixRegistre(arrel);
  const { revisio, problema } = llegixRevisioAsc(carpetaBuilds);
  const r = cobertura(manifests, { registre, revisio });
  if (!r.noCobertes.length) return { linies: [`✓ privacitat: les parelles dels ${r.sdks.length} SDK amb dades estan cobertes (A02)`], atura: null };
  const detall = r.noCobertes.map((n) => `${n.sdk} ${n.parell}`).join(', ');
  const on = `${NOM_REVISIO_ASC} de SDP_BUILDS_DIR, fora de Git`;
  if (produccio) return { linies: [], atura: `l'etiqueta App Privacy d'ASC no consta revisada per a ${detall}: el Mestre la revisa i ho apunta a ${on} (A02)${problema ? `; ${problema}` : ''}` };
  return { linies: [`  ! privacitat dels SDK sense revisió d'ASC: ${detall} (A02; a producció no es puja)`], atura: null };
}

function main(argv) {
  const opcio = (nom) => argv.find((a) => a.startsWith(`--${nom}=`))?.slice(nom.length + 3);
  const app = opcio('app');
  if (!app || !fs.existsSync(app)) { process.stderr.write('Ús: node scripts/botigues/privacitat-sdk.mjs --app=CAMI/App.app [--revisio=FITXER] [--produccio] [--json]\n'); return 2; }
  const arrel = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const { registre, problema } = llegixRegistre(arrel);
  const fitxerRevisio = opcio('revisio');
  const { revisio, problema: problemaRevisio } = fitxerRevisio ? llegixRevisioAsc(path.dirname(fitxerRevisio)) : { revisio: null, problema: null };
  const r = cobertura(manifestsDeLApp(app), { registre, revisio });
  if (argv.includes('--json')) process.stdout.write(`${JSON.stringify({ ...r, problemaRegistre: problema, problemaRevisio }, null, 2)}\n`);
  else {
    for (const s of r.sdks) process.stdout.write(`${s.sdk}: ${s.parells.join(', ')}\n`);
    for (const n of r.noCobertes) process.stdout.write(`  ${argv.includes('--produccio') ? '✗' : '!'} ${n.sdk} ${n.parell}: ni el PrivacyInfo de l'App ni la revisió d'ASC la cobrixen\n`);
    if (!r.noCobertes.length) process.stdout.write('✓ totes les parelles dels SDK estan cobertes\n');
  }
  return r.noCobertes.length && argv.includes('--produccio') ? 1 : 0;
}

const principal = (() => { try { return process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href; } catch { return false; } })();
if (principal) process.exitCode = main(process.argv.slice(2));
