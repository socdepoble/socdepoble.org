#!/usr/bin/env node
/**
 * PWA-03b (v1.2.25, Guàrdia #6 de MarIA, 11:00) · La predeploy de Firebase refusa un build que no siga d'esta versió.
 *
 * firebase.json desplega `dist/` tal com està: la predeploy no recompila. Un `dist/` d'una altra versió publicaria
 * brossa rància. A l'arbre viu del 261125, el `dist/` és de la 1.2.0, i la seua còpia de ngi-fediversity-tag.svg porta
 * un patró actiu que la de public/ ja no té.
 *
 * Esta porta només llig. Mira package.json, la capçalera del connector i els manifests de l'arrel del build, amb el
 * criteri únic de tooling/lib/versio-del-build.mjs (el de pesDelNucli i de la Vigilant). Només deixa passar un build
 * 'mesurat' (d'esta versió) que, a més, porte la versio-viva.json de l'App: una sdp-release.json no la pot tapar, i és
 * la que lligen les apps natives.
 * Es refusa (falla tancat) un build en qualsevol d'estos casos:
 *  · ranci;
 *  · trencat;
 *  · sense manifest;
 *  · absent;
 *  · amb un manifest que és un enllaç simbòlic;
 *  · d'un arbre sense versió.
 * Dins d'una predeploy, també es refusa si Firebase pujaria una altra carpeta (RESOURCE_DIR, per exemple amb
 * `--public`).
 * Al contrari que la Vigilant, que falla cap a mesurar, açò és una barrera de desplegament: el que no es pot acreditar
 * no es publica.
 *
 * ABAST: acredita la VERSIÓ, no el commit. Un dist/ de la mateixa versió compilat amb codi anterior passa. Segellar
 * l'arbre font al build és una peça a part.
 *
 * Ús: node tooling/gates/porta-build-fresc.mjs [--arrel DIR] [--build dist]
 * Codis: 0, el build és d'esta versió; 1, es refusa; 2, ús incorrecte.
 */
import fs from 'node:fs';
import path from 'node:path';
import { esMain } from '../lib/arrel.mjs';
import { ARRELS_DE_BUILD, MANIFEST_ILLEGIBLE, estatDelBuild, versionsDeLArbre } from '../lib/versio-del-build.mjs';

export const readOnly = true;
/* El mateix límit de lectura que la Vigilant (lligBuffer): un manifest més gran no és cap manifest. */
const MAX_LECTURA = 8 * 1024 * 1024;
/* La recepta web canònica (ORDRE_WEB de scripts/botigues/publica-tot.mjs): un build sol no conserva la retenció N-1. */
const REMEI = 'Torna a fer la recepta web sencera (ORDRE_WEB de scripts/botigues/publica-tot.mjs: npm run build, deploy:arxiva, deploy:retencio i després firebase deploy)';

/* El text d'un fitxer, null si no hi és, o MANIFEST_ILLEGIBLE si hi és però no és un fitxer regular llegible.
   Un enllaç simbòlic no compta: podria apuntar a un manifest fresc d'un altre lloc (Gauntlet T4). */
function llig(root, rel) {
  const absolut = path.join(root, rel);
  let estat;
  try { estat = fs.lstatSync(absolut); } catch (error) { return error?.code === 'ENOENT' ? null : MANIFEST_ILLEGIBLE; }
  if (estat.isSymbolicLink() || !estat.isFile() || estat.size > MAX_LECTURA) return MANIFEST_ILLEGIBLE;
  try { return fs.readFileSync(absolut, 'utf8'); } catch { return MANIFEST_ILLEGIBLE; }
}

/* Una versió llegida d'un manifest, per a un missatge de consola: sense salts de línia ni seqüències de control, i
   tallada (Gauntlet T7). El codi de sortida no en depén. */
const mostra = (valor) => {
  if (valor === null || valor === undefined) return 'versió desconeguda';
  const net = JSON.stringify(String(valor)).slice(1, -1);
  return net.length > 40 ? `${net.slice(0, 40)}…` : net;
};

/** Diu si `build` (una de les ARRELS_DE_BUILD) és d'esta versió. Torna { ok, estat, versio, arbre, motiu }. */
export function avaluaBuildFresc(root, build = 'dist') {
  if (!ARRELS_DE_BUILD.includes(build)) return { ok: false, estat: null, motiu: `«${mostra(build)}» no és cap carpeta de build coneguda (${ARRELS_DE_BUILD.join(', ')})` };
  let carpeta = null;
  try { carpeta = fs.statSync(path.join(root, build)); } catch { carpeta = null; }
  if (!carpeta?.isDirectory()) return { ok: false, estat: null, motiu: `no hi ha cap ${build}/ per desplegar` };
  const paquetCru = llig(root, 'package.json');
  if (typeof paquetCru !== 'string') return { ok: false, estat: null, motiu: 'package.json és absent o il·legible: no se sap de quina versió és l’arbre' };
  const paquet = paquetCru.replace(/^\uFEFF/, '');
  try { JSON.parse(paquet); } catch { return { ok: false, estat: null, motiu: 'package.json no és JSON: no se sap de quina versió és l’arbre' }; }
  const connector = llig(root, 'wordpress-plugin/socdepoble-enxufe.php');
  const arbre = versionsDeLArbre({ paquet, connector: typeof connector === 'string' ? connector : null });
  if (!arbre) return { ok: false, estat: null, motiu: 'package.json no porta cap versió' };
  const viva = llig(root, `${build}/versio-viva.json`);
  const comu = estatDelBuild({ release: llig(root, `${build}/sdp-release.json`), viva }, arbre);
  /* Gauntlet T3 · Una release amb la versió de l'arbre no tapa una versio-viva.json vella, i dist/ (que sempre la
     porta, copiada de public/) sense ella no s'acredita. */
  const vivaVella = comu.estat === 'mesurat' && typeof viva === 'string' && comu.versioViva !== arbre.app;
  const senseViva = comu.estat === 'mesurat' && build === 'dist' && viva === null;
  if (comu.estat === 'mesurat' && !vivaVella && !senseViva) return { ok: true, estat: 'mesurat', versio: comu.versio, arbre: arbre.app };
  const estat = vivaVella || senseViva ? 'ranci' : comu.estat;
  const motiu = vivaVella ? `${build}/versio-viva.json és de la ${mostra(comu.versioViva)} i l’arbre, de la ${mostra(arbre.app)}`
    : senseViva ? `${build}/ no porta la versio-viva.json de l’App`
      : estat === 'ranci' ? `${build}/ és de la ${mostra(comu.versio)} i l’arbre, de la ${mostra(arbre.app)}`
        : estat === 'trencat' ? `un manifest de ${build}/ no es pot llegir, és un enllaç o no és JSON`
          : `${build}/ no porta cap manifest de versió (ni sdp-release.json ni versio-viva.json)`;
  return { ok: false, estat, versio: comu.versio, arbre: arbre.app, motiu };
}

/* Gauntlet T1 · Dins d'una predeploy, Firebase posa a RESOURCE_DIR la carpeta que pujarà (hosting.public o la de
   `--public`). Si no és la que acredita esta porta, el veredicte no parla del que es publica. */
function mateixaCarpeta(resourceDir, root, build) {
  try { return fs.realpathSync(resourceDir) === fs.realpathSync(path.join(root, build)); } catch { return false; }
}

export function main(argv = process.argv.slice(2), env = process.env) {
  let root = process.cwd(), build = 'dist';
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--arrel' && argv[i + 1]) root = path.resolve(argv[++i]);
    else if (arg.startsWith('--arrel=') && arg.length > 8) root = path.resolve(arg.slice(8));
    else if (arg === '--build' && argv[i + 1]) build = argv[++i];
    else if (arg.startsWith('--build=') && arg.length > 8) build = arg.slice(8);
    else { console.error('Ús: porta-build-fresc.mjs [--arrel DIR] [--build dist]'); return 2; }
  }
  if (env.RESOURCE_DIR !== undefined && !mateixaCarpeta(env.RESOURCE_DIR, root, build)) {
    console.error(`❌ [Build fresc] No es desplega: Firebase pujaria una carpeta que no és ${build}/ (--public o hosting.public diferent), i esta porta només acredita ${build}/.`);
    return 1;
  }
  const resultat = avaluaBuildFresc(root, build);
  if (resultat.ok) {
    console.log(`✅ [Build fresc] ${build}/ és de la versió ${mostra(resultat.versio)} de l’arbre (${mostra(resultat.arbre)}). Es comprova la versió, no el commit.`);
    return 0;
  }
  console.error(`❌ [Build fresc] No es desplega: ${resultat.motiu}. ${REMEI}.`);
  return 1;
}

/* La guarda d'identitat canònica de les portes (Porta Arrel A4). El cas --preserve-symlinks-main (Gauntlet T5) es
   corregix a esMain mateix, per a totes les portes alhora. */
if (esMain(import.meta.url)) process.exitCode = main();
