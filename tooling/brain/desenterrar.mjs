#!/usr/bin/env node
/**
 * desenterrar.mjs — restauració segellada d'un fitxer a una revisió anterior.
 *
 * V7.1 · reescrit després de l'auditoria del Consell (Seient Núm. 5).
 *
 * Defectes tancats respecte de la V7:
 *   P0-1  `execSync` amb interpolació de cadena → shell obert a `--ref`.
 *         Ara: `execFileSync` amb argv. Cap shell. Mai.
 *   P0-2  `readFileSync` resolia contra el CWD i `git show` contra l'arrel
 *         del repositori. Divergien i el segell certificava l'intercanvi
 *         entre dos fitxers distints. Ara hi ha una sola ruta canònica,
 *         relativa a `git rev-parse --show-toplevel`.
 *   P0-3  Escrivia destructivament sense rastre. Ara: refús si el fitxer té
 *         canvis no compromesos (llevat de `--forca`), i còpia obligatòria a
 *         `.sdp-paperera/` abans de tocar res.
 *   P0-4  Perdia els permisos (755 → 644). Ara el mode ix de `git ls-tree`.
 *   P0-5  Segell per concatenació ambigua. Ara amb separador NUL i domini.
 *   P0-6  Escrivia sense rebut del Reflex. Ara `claimReceiptForMutation`
 *         abans i `completeMutationClaim` després. Fail-closed.
 *
 * Ús:
 *   node tooling/brain/desenterrar.mjs --ref <sha> --fitxer <ruta>
 *   node tooling/brain/desenterrar.mjs --ref <sha> --fitxer <ruta> --segell <sha256>
 *
 * Pedra Seca: zero dependències externes, ESM, fail-closed.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import {
  claimReceiptForMutation,
  completeMutationClaim,
} from '../wiki/reflex_petorreta.mjs';

/* ═══════════════════════════ Constants ═══════════════════════════ */

const OPERACIO = 'restauracio-segellada';
const DOMINI_SEGELL = 'sdp.desenterrar.segell.v3';
const PAPERERA = '.sdp-paperera';
const MODES_ADMESOS = new Set(['100644', '100755']);
const RE_REF = /^[A-Za-z0-9._/^~@{}-]{1,255}$/;

const sha256 = (v) => createHash('sha256').update(v).digest('hex');
const posix = (v) => v.split(path.sep).join('/');

/* ═══════════════════════════ Git sense shell ═══════════════════════════ */

/**
 * Executa git amb argv. Mai passa per un intèrpret d'ordres, així que cap
 * `;`, `$(...)`, backtick ni `&&` dins d'un argument s'interpreta com a codi.
 */
function git(args, { arrel, buffer = false } = {}) {
  return execFileSync('git', arrel ? ['-C', arrel, ...args] : args, {
    encoding: buffer ? 'buffer' : 'utf8',
    maxBuffer: 256 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

/** Arrel física del repositori. Única autoritat sobre rutes. */
function arrelRepositori(desDe) {
  const cru = git(['rev-parse', '--show-toplevel'], { arrel: desDe }).trim();
  if (!cru) throw new Error('No s\'ha pogut determinar l\'arrel del repositori.');
  return fs.realpathSync(cru);
}

const dins = (arrel, candidat) => {
  const r = path.relative(arrel, candidat);
  return r === '' || (!r.startsWith('..') && !path.isAbsolute(r));
};

/**
 * Converteix qualsevol ruta que escriga l'operador en UNA ruta relativa a
 * l'arrel del repositori. Això és el que mata el P0-2: a partir d'ací el disc
 * i l'índex de Git parlen exactament del mateix fitxer.
 */
function rutaCanonica(arrel, cru) {
  if (typeof cru !== 'string' || !cru.trim()) throw new Error('--fitxer buit.');
  if (cru.includes('\0')) throw new Error('--fitxer amb byte NUL.');

  const absolut = path.resolve(process.cwd(), cru);
  if (!dins(arrel, absolut)) {
    throw new Error(`El fitxer viu fora del repositori: ${cru}`);
  }

  // realpath del primer ancestre existent, per a detectar symlinks sense
  // exigir que el fitxer existisca (pot haver-se esborrat).
  let cursor = absolut;
  const cua = [];
  let resolt;
  for (;;) {
    try { resolt = fs.realpathSync(cursor); break; } catch (e) {
      if (e.code !== 'ENOENT') throw e;
      const pare = path.dirname(cursor);
      if (pare === cursor) throw e;
      cua.unshift(path.basename(cursor));
      cursor = pare;
    }
  }
  const fisic = path.resolve(resolt, ...cua);
  if (!dins(arrel, fisic)) {
    throw new Error(`Ruta físicament fora del repositori (symlink): ${cru}`);
  }
  const lexica = posix(path.relative(arrel, absolut));
  const fisica = posix(path.relative(arrel, fisic));
  if (lexica !== fisica) {
    throw new Error(`Ruta ambigua a través d'un symlink: ${lexica} → ${fisica}. Declara la ruta física.`);
  }
  if (lexica === '' || lexica.startsWith('..')) throw new Error(`Ruta insegura: ${cru}`);
  if (lexica === PAPERERA || lexica.startsWith(`${PAPERERA}/`)) {
    throw new Error('La paperera no és un destí restaurable.');
  }
  return lexica;
}

/* ═══════════════════ Lectura de la revisió antiga ═══════════════════ */

/**
 * Torna { blob, mode } del fitxer a la referència demanada. El mode ix de
 * `git ls-tree`, no s'endevina: és el que tanca el P0-4.
 */
function llegeixRevisio(arrel, ref, rutaRel) {
  let brut;
  try {
    brut = git(['ls-tree', '-z', '--full-tree', ref, '--', rutaRel], { arrel });
  } catch {
    throw new Error(`La referència «${ref}» no existix o no és llegible.`);
  }
  const registre = brut.split('\0').filter(Boolean)[0];
  if (!registre) throw new Error(`«${rutaRel}» no existix a la referència «${ref}».`);

  const m = /^([0-7]{6}) (blob|tree|commit) ([0-9a-f]+)\t([\s\S]+)$/.exec(registre);
  if (!m) throw new Error('Resposta inesperada de `git ls-tree`.');
  const [, mode, tipus, objecte] = m;

  if (tipus !== 'blob') {
    throw new Error(`«${rutaRel}» a «${ref}» és un ${tipus}, no un fitxer. No es restaura.`);
  }
  if (!MODES_ADMESOS.has(mode)) {
    const quin = mode === '120000' ? 'symlink' : mode === '160000' ? 'submòdul' : `mode ${mode}`;
    throw new Error(`«${rutaRel}» a «${ref}» és un ${quin}. Restaurar-ho seria materialitzar el que Git no garantix.`);
  }
  return { blob: git(['cat-file', 'blob', objecte], { arrel, buffer: true }), mode };
}

/* ═══════════════════════════ Segell ═══════════════════════════ */

/**
 * Segell v3 lligat a commit resolt, HEAD, bytes i mode actual. La V7 concatenava
 * `ref + fitxer + old + curr`: («abc»,«def») i («abcd»,«ef») donaven la
 * mateixa cadena. Amb NUL cap parell distint col·lisiona.
 */
const calculaSegell = ({ ref, head, ruta, modeAntic, shaAntic, shaActual, modeActual }) =>
  sha256([DOMINI_SEGELL, ref, head, ruta, modeAntic, shaAntic, shaActual, modeActual].join('\0'));

/** Capture bytes and filesystem mode; absence is distinct from an empty file. */
function estatFitxer(abs) {
  const st = fs.lstatSync(abs, { throwIfNoEntry: false });
  if (st && (!st.isFile() || st.isSymbolicLink() || st.nlink !== 1)) {
    throw new Error('El destí no és un fitxer regular amb identitat exclusiva.');
  }
  const blob = st ? fs.readFileSync(abs) : Buffer.alloc(0);
  return { st, blob, hash: st ? sha256(blob) : '(absent)', mode: st ? (st.mode & 0o777).toString(8) : '(absent)' };
}

function comprovaCAS(arrel, abs, head, actual) {
  const ara = estatFitxer(abs);
  if (git(['rev-parse', '--verify', 'HEAD'], { arrel }).trim() !== head
      || ara.hash !== actual.hash || ara.mode !== actual.mode
      || Boolean(ara.st) !== Boolean(actual.st)
      || (ara.st && (ara.st.dev !== actual.st.dev || ara.st.ino !== actual.st.ino))) {
    throw new Error('CAS divergent: HEAD o el destí han canviat; cap substitució.');
  }
}

/* ═══════════════════════════ Paperera ═══════════════════════════ */

/**
 * Còpia del que estem a punt de destruir. Sense açò, restaurar un fitxer amb
 * feina no compromesa és irreversible — i la llei diu que no ho pot ser.
 */
function soterra(arrel, rutaRel, contingut, mode, context) {
  const marca = new Date().toISOString().replace(/[:.]/g, '-');
  const desti = path.join(arrel, PAPERERA, marca, rutaRel);
  fs.mkdirSync(path.dirname(desti), { recursive: true, mode: 0o700 });
  if (!dins(arrel, fs.realpathSync(path.dirname(desti)))) throw new Error('Còpia de recuperació fora del repositori.');
  const fd = fs.openSync(desti, 'wx', mode);
  try {
    fs.writeFileSync(fd, contingut);
    fs.fchmodSync(fd, mode);
    fs.fsyncSync(fd);
  } finally { fs.closeSync(fd); }
  if (!fs.readFileSync(desti).equals(contingut) || (fs.statSync(desti).mode & 0o777) !== mode) {
    throw new Error('La còpia prèvia no conserva els bytes i el mode; cap substitució.');
  }
  const manifest = { schema: 'sdp.restauracio.backup.v1', ...context,
    ruta: rutaRel, backup: posix(path.relative(arrel, desti)), beforeSha256: sha256(contingut),
    beforeMode: mode.toString(8), createdAt: new Date().toISOString() };
  fs.writeFileSync(`${desti}.restauracio.json`, JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  return manifest;
}

/* ═══════════════════════════ Escriptura ═══════════════════════════ */

function escriuAtomic(abs, blob, mode, abansDeRename) {
  const tmp = path.join(path.dirname(abs), `.${path.basename(abs)}.desenterrar-${process.pid}`);
  fs.writeFileSync(tmp, blob, { flag: 'wx', mode: mode === '100755' ? 0o755 : 0o644 });
  try {
    abansDeRename();
    fs.renameSync(tmp, abs);
  } catch (e) {
    fs.rmSync(tmp, { force: true });
    throw e;
  }
  fs.chmodSync(abs, mode === '100755' ? 0o755 : 0o644);
  const escrit = estatFitxer(abs);
  if (!escrit.blob.equals(blob) || escrit.mode !== (mode === '100755' ? '755' : '644')) {
    throw new Error('La verificació dels bytes o mode restaurats ha fallat.');
  }
}

/* ═══════════════════════════ Programa ═══════════════════════════ */

async function main() {
  const { values } = parseArgs({
    options: {
      ref: { type: 'string' },
      fitxer: { type: 'string' },
      segell: { type: 'string' },
      forca: { type: 'boolean', default: false },
      rebut: { type: 'string' },
    },
  });
  const { ref, fitxer, segell, forca, rebut } = values;

  if (!ref || !fitxer) {
    console.error('Ús: node tooling/brain/desenterrar.mjs --ref <sha> --fitxer <ruta> [--segell <sha256> --rebut <rebut.json>] [--forca]');
    process.exit(1);
  }
  if (!RE_REF.test(ref)) {
    throw new Error(`Referència amb caràcters no admesos: «${ref}». Només [A-Za-z0-9._/^~@{}-].`);
  }

  const arrel = arrelRepositori(process.cwd());
  const rutaRel = rutaCanonica(arrel, fitxer);
  const abs = path.join(arrel, rutaRel);

  // Resolve moving names once; all reads, the seal and output use the same commit.
  const revisio = git(['rev-parse', '--verify', `${ref}^{commit}`], { arrel }).trim();
  const head = git(['rev-parse', '--verify', 'HEAD'], { arrel }).trim();
  const actual = estatFitxer(abs);
  const { st, blob: blobActual, hash: shaActual, mode: modeActual } = actual;
  const { blob: blobAntic, mode: modeAntic } = llegeixRevisio(arrel, revisio, rutaRel);
  const shaAntic = sha256(blobAntic);
  const segellEsperat = calculaSegell({ ref: revisio, head, ruta: rutaRel, modeAntic, shaAntic, shaActual, modeActual });

  /* ─────────────── Mode inspecció ─────────────── */
  if (!segell) {
    const data = git(['show', '-s', '--format=%ci', revisio], { arrel }).trim();
    const brut = git(['status', '--porcelain=v1', '-z', '--', rutaRel], { arrel });
    console.log(`\n--- AUTÒPSIA: ${rutaRel} ---`);
    console.log(`Arrel del repositori : ${arrel}`);
    console.log(`Commit resolt        : ${revisio}`);
    console.log(`HEAD actual          : ${head}`);
    console.log(`Data de la revisió   : ${data}`);
    console.log(`Mode actual          : ${modeActual}`);
    console.log(`Mode a la revisió    : ${modeAntic}`);
    console.log(`SHA-256 revisió      : ${shaAntic}`);
    console.log(`SHA-256 disc         : ${shaActual}`);
    console.log(`Estat de treball     : ${brut ? '⚠️  BRUT — hi ha canvis no compromesos' : 'net'}`);
    console.log(`\nSegell per aplicar   : ${segellEsperat}\n`);
    console.log('--- DIFF (revisió → disc) ---');
    try {
      process.stdout.write(git(['diff', '--no-ext-diff', revisio, '--', rutaRel], { arrel }));
    } catch { console.log('(sense diff llegible)'); }
    return;
  }

  /* ─────────────── Mode aplicació ─────────────── */

  if (segell !== segellEsperat) {
    console.error('❌ Segell invàlid: el fitxer o la revisió han canviat des de la inspecció.');
    console.error(`   S'esperava: ${segellEsperat}`);
    console.error(`   Rebut     : ${segell}`);
    process.exit(1);
  }

  // Feina no compromesa: refús per defecte. Açò és la llei d'Irreversibilitat.
  const brut = git(['status', '--porcelain=v1', '-z', '--', rutaRel], { arrel });
  if (brut && !forca) {
    console.error(`❌ «${rutaRel}» té canvis no compromesos. Restaurar-lo els destruiria.`);
    console.error('   Compromet-los, guarda\'ls amb `git stash`, o repetix amb --forca (quedarà còpia a la paperera).');
    process.exit(1);
  }

  comprovaCAS(arrel, abs, head, actual);

  // Rebut del Reflex. Fail-closed: sense lease no s'escriu.
  let claim;
  try {
    claim = await claimReceiptForMutation({
      receiptPath: rebut,
      operation: OPERACIO,
      targets: [rutaRel],
      checkDirty: !forca,
    });
  } catch (e) {
    console.error(`❌ Sense lease del Reflex no es restaura res: ${e.message}`);
    console.error(`   Obri'n una: node tooling/wiki/reflex_petorreta.mjs open --risk=high --scope=<abast> --operation=${OPERACIO} --intent="..."`);
    process.exit(1);
  }

  let lapida = null;
  try {
    comprovaCAS(arrel, abs, head, actual);
    if (st) lapida = soterra(arrel, rutaRel, blobActual, st.mode & 0o777, { head, revisio, segell: segellEsperat });
    escriuAtomic(abs, blobAntic, modeAntic, () => comprovaCAS(arrel, abs, head, actual));
    await completeMutationClaim({ receiptPath: rebut, operation: OPERACIO }, claim.claimToken);
  } catch (e) {
    console.error(`❌ Restauració avortada: ${e.message}`);
    if (lapida) console.error(`   La còpia prèvia està a ${lapida.backup}`);
    process.exit(1);
  }

  console.log(`✅ ${rutaRel} restaurat a ${revisio} (mode ${modeAntic}).`);
  if (lapida) {
    console.log(`   Còpia verificada del contingut anterior: ${lapida.backup}`);
    console.log(`   Manifest de retorn: ${lapida.backup}.restauracio.json`);
  }
  console.log(`   Claim completat del rebut: ${claim.receipt.sessionId}`);
}

const esPrincipal = Boolean(process.argv[1])
  && import.meta.url === pathToFileURL(fs.realpathSync(path.resolve(process.argv[1]))).href;
if (esPrincipal) {
  main().catch((e) => {
    console.error(`❌ [DESENTERRAR] ${e.message}`);
    process.exitCode = 1;
  });
}

export { calculaSegell, rutaCanonica, arrelRepositori };
