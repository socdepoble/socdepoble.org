#!/usr/bin/env node
/** Compilació explícita a candidats. Mai modifica les fonts ni importa codi del destí.
 * Ús: node tooling/gates/compila-filtre-aprenentatge-node0.mjs --arrel REPO --sortida DIRECTORI_NOU
 * La integració dels dos candidats correspon al CAS existent.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
/* v1.2.25 · K-FILTRE (C13) · Guarda d'entrada canònica: esMain resol els àlies del CLI amb el camí real. */
import { esMain } from '../lib/arrel.mjs';
import { analitzaFonts, carregaBaseline, contextCache, lligFontsParalel, signaturaMotor, signaturaMotorDeBytes, validaRegles, RUTA_BASELINE, RUTA_CACHE, RUTA_REGLES } from './filtre-aprenentatge-node0.mjs';

const RUTA_MOTOR = 'tooling/gates/filtre-aprenentatge-node0.mjs';
const PIN = /^const CACHE_SHA256 = '[^']*';$/gm;
const sha = value => createHash('sha256').update(value).digest('hex');

function regular(arrel, relativa, { absent = false } = {}) {
  let ple = arrel;
  const parts = relativa.split('/');
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    ple = path.join(ple, part);
    if (!fs.existsSync(ple)) {
      if (absent && i === parts.length - 1) return null;
      throw new TypeError(`FN0_COMPILA: font absent ${relativa}`);
    }
    if (fs.lstatSync(ple).isSymbolicLink()) throw new TypeError(`FN0_COMPILA: symlink ${relativa}`);
  }
  if (!fs.statSync(ple).isFile()) throw new TypeError(`FN0_COMPILA: font no regular ${relativa}`);
  return fs.readFileSync(ple);
}

function snapshot(fonts) {
  return fonts.map(f => [f.fitxer, sha(f.bytes ?? f.text)]);
}

export async function generaCandidats({ arrel, sortida, abansDeVerificar = null } = {}) {
  if (typeof arrel !== 'string' || !arrel || typeof sortida !== 'string' || !sortida) throw new TypeError('FN0_COMPILA: --arrel i --sortida són obligatoris');
  const root = fs.realpathSync(path.resolve(arrel));
  const explicit = path.resolve(sortida);
  const desti = path.join(fs.realpathSync(path.dirname(explicit)), path.basename(explicit));
  if (desti === root || desti.startsWith(root + path.sep)) throw new TypeError('FN0_COMPILA: la sortida ha de quedar fora de les fonts');
  if (fs.existsSync(desti)) throw new TypeError('FN0_COMPILA: la sortida ja existix; no se sobreescriu');
  const motorBytes = regular(root, RUTA_MOTOR), motorText = new TextDecoder('utf-8', { fatal: true }).decode(motorBytes);
  const lexerBytes = regular(root, 'tooling/lib/lexic-css.mjs');
  if ((motorText.match(PIN) ?? []).length !== 1 || signaturaMotorDeBytes(motorText, lexerBytes) !== signaturaMotor()) throw new TypeError('FN0_COMPILA: el motor del destí no coincidix amb el compilador; no s’importa ni executa');
  const reglesBytes = regular(root, RUTA_REGLES);
  const regles = validaRegles(JSON.parse(reglesBytes.toString('utf8')));
  const mapaBytes = regular(root, '.agents/coherencia-editorial-mapa.json');
  const lexic = JSON.parse(mapaBytes.toString('utf8')).lexicProhibit;
  if (!Array.isArray(lexic) || lexic.length === 0) throw new TypeError('FN0_COMPILA: lèxic canònic absent');
  const baselineBytes = regular(root, RUTA_BASELINE), baseline = carregaBaseline(root);
  const cacheAnterior = regular(root, RUTA_CACHE, { absent: true });
  const fonts = await lligFontsParalel(root), abans = snapshot(fonts), fitxers = Object.create(null);
  const resultat = analitzaFonts(fonts, { regles, lexic, recullCache: fitxers, baseline });
  const cache = { schema: 'sdp.node0.filtre.cache.v1', motor: signaturaMotor(), context: contextCache(fonts, regles, lexic), fitxers };
  const cacheText = JSON.stringify(cache) + '\n', cacheSha256 = sha(cacheText);
  const motorCandidat = motorText.replace(PIN, `const CACHE_SHA256 = '${cacheSha256}';`);

  // Dos lectures completes. No és una transacció del sistema de fitxers: una mutació
  // posterior encara és possible i la porta tornarà a hashejar cada font quan s'execute.
  if (abansDeVerificar) await abansDeVerificar();
  const despres = snapshot(await lligFontsParalel(root));
  if (JSON.stringify(abans) !== JSON.stringify(despres)
    || !regular(root, RUTA_MOTOR).equals(motorBytes)
    || !regular(root, 'tooling/lib/lexic-css.mjs').equals(lexerBytes)
    || !regular(root, RUTA_REGLES).equals(reglesBytes)
    || !regular(root, RUTA_BASELINE).equals(baselineBytes)
    || !regular(root, '.agents/coherencia-editorial-mapa.json').equals(mapaBytes)) throw new TypeError('FN0_COMPILA: font alterada durant la compilació; cap candidat escrit');
  const cacheAra = regular(root, RUTA_CACHE, { absent: true });
  if ((cacheAnterior === null) !== (cacheAra === null) || cacheAnterior && !cacheAnterior.equals(cacheAra)) throw new TypeError('FN0_COMPILA: cache alterada durant la compilació; cap candidat escrit');

  const manifest = {
    schema: 'sdp.node0.filtre.candidats.v1', motorSha256: cache.motor,
    fontSnapshotSha256: sha(JSON.stringify(abans)), fonts: fonts.length,
    lectura: 'dues_lectures_completes_sense_canvi_observat', snapshotAtomic: false,
    fontMutations: 0, destinacio: desti, integracio: 'CAS extern; cap aplicació automàtica',
    candidats: [
      { ruta: RUTA_CACHE, fitxer: path.basename(RUTA_CACHE), abansSha256: cacheAnterior === null ? null : sha(cacheAnterior), sha256: cacheSha256 },
      { ruta: RUTA_MOTOR, fitxer: path.basename(RUTA_MOTOR), abansSha256: sha(motorBytes), sha256: sha(motorCandidat) }
    ],
    baseline: { ruta: RUTA_BASELINE, sha256: sha(baselineBytes), total: baseline.total },
    diagnostic: { troballes: resultat.troballes.length, baselineTotal: baseline.total, noves: resultat.regressions.noves.length, resoltes: resultat.regressions.resoltes.length, validRegressions: resultat.validRegressions, estatComplet: resultat.estatComplet, certificaProduccio: false }
  };
  fs.mkdirSync(desti);
  fs.writeFileSync(path.join(desti, path.basename(RUTA_CACHE)), cacheText, { flag: 'wx' });
  fs.writeFileSync(path.join(desti, path.basename(RUTA_MOTOR)), motorCandidat, { flag: 'wx' });
  fs.writeFileSync(path.join(desti, 'MANIFEST_CANDIDATS.json'), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
  return manifest;
}

export async function main(argv = process.argv.slice(2), { out = console.log, err = console.error } = {}) {
  try {
    const options = {};
    for (let i = 0; i < argv.length; i++) {
      if (argv[i] === '--help') { out('Ús: compila-filtre-aprenentatge-node0.mjs --arrel REPO --sortida DIRECTORI_NOU\nNomés genera cache i motor candidats amb manifest; aplicar per CAS.'); return 0; }
      if (!['--arrel', '--sortida'].includes(argv[i]) || !argv[i + 1] || argv[i + 1].startsWith('--')) throw new TypeError('FN0_COMPILA: cal --arrel REPO --sortida DIRECTORI_NOU, sense altres opcions');
      const key = argv[i].slice(2);
      if (options[key]) throw new TypeError(`FN0_COMPILA: opció duplicada --${key}`);
      options[key] = argv[++i];
    }
    const result = await generaCandidats(options);
    out(JSON.stringify(result, null, 2)); return 0;
  } catch (error) { err(error.message); return 2; }
}

if (esMain(import.meta.url)) process.exitCode = await main();

export const ARREL_COMPILADOR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
