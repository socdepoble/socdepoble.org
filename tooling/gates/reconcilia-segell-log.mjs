#!/usr/bin/env node
/** Reconciliació governada de la traça local `.agents/runtime/segell.log` (v1.2.26 · Lot C1-0b).
 *
 *  Problema: la traça és estat local (no versionat) i cada arbre (viu, worktree, clon) en té una.
 *  Una transacció segellada en un altre arbre arriba al viu amb el commit (evidència a
 *  `.agents/seal-transactions/<id>.json`) però sense la seua línia a la traça, i aleshores
 *  `durableMutation` refusa qualsevol escriptura governada («Evidència deslligada del journal»).
 *
 *  Què fa, sense copiar res a mà i amb el validador canònic de `tooling/lib/mutacio-durable.mjs`:
 *   1. Quarantena, mai esborrat. Una línia que el validador vigent refusa (esquema antic) o una
 *      transacció la seqüència de la qual refusa passen a `.agents/runtime/segell.quarantena.jsonl`
 *      amb l'índex, el motiu i la línia literal; la traça sencera d'abans es conserva a
 *      `.agents/runtime/segell.log.preimatge-<sha12>`. Límits (Gauntlet 261126, lent A):
 *      - una transacció amb evidència moderna pròpia no es posa mai en quarantena: es refusa;
 *      - una transacció que és l'origen d'una evidència històrica (`recovers`/`originalMutation`)
 *        només s'hi posa si el seu darrer estat és `failed` i la projecció de fitxers coincidix
 *        amb l'evidència (la mateixa comprovació que la quarantena desactivaria); si no, es refusa;
 *      - una evidència històrica que queda sense línies (exempta) ha de ser a HEAD amb els mateixos bytes.
 *      Un error d'evidència (absent o divergent) no es posa en quarantena: amagar-lo fabricaria un verd.
 *   2. Per a cada evidència sense registre terminal, importa la seqüència sencera de la traça
 *      donant (`--donant=ARREL`), també les línies posteriors al terminal, només si:
 *      - l'evidència està versionada a HEAD de l'arrel amb els mateixos bytes;
 *      - el registre terminal del donant és idèntic a l'evidència;
 *      - cap línia pròpia d'eixa transacció no ha anat a quarantena i les que hi ha són un prefix
 *        exacte de la seqüència del donant.
 *   3. La traça candidata passa `validaTracaAuditoria` en una còpia temporal abans d'escriure res.
 *
 *  Escriptura (`--aplica`): CAS sobre el SHA-256 de la traça (`--expected-hash=`, o `absent`),
 *  `mutation.lock` exclusiu, cap `mutation.pending.json`, fitxers 0600 amb fsync i O_NOFOLLOW,
 *  substitució atòmica per rename i, només després de tornar a validar l'arrel real, la quarantena
 *  i el rebut (`.agents/runtime/segell.reconciliacions.jsonl`, amb el donant i HEAD). Si la validació
 *  real fallara, es restaura la preimatge.
 *
 *  Ús: node tooling/gates/reconcilia-segell-log.mjs --donant=ARREL [--arrel=ARREL] [--json]
 *      node tooling/gates/reconcilia-segell-log.mjs --donant=ARREL --aplica --expected-hash=SHA256 [--arrel=ARREL]
 *  Eixida: 0 si la traça ja és vàlida i no cal canviar res (o si --aplica l'ha deixada vàlida);
 *          3 en sec si la candidata és vàlida però cal --aplica; 1 si hi ha refusos o la candidata no valida;
 *          2 per ús incorrecte.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import {
  digest, readState, safePath, syncDirectory,
  validaTracaAuditoria, validaRegistreAuditoria, comparableAuditoria, esTerminalAuditoria, esHistoricAuditoria,
  esInterrompudaAuditoria, projeccioFitxersAuditoria
} from '../lib/mutacio-durable.mjs';
import { esMain } from '../lib/arrel.mjs';

const JOURNAL = '.agents/runtime/segell.log';
const EVIDENCE = '.agents/seal-transactions';
const PENDING = '.agents/runtime/mutation.pending.json';
const LOCK = '.agents/runtime/mutation.lock';
const QUARANTENA = '.agents/runtime/segell.quarantena.jsonl';
const REBUTS = '.agents/runtime/segell.reconciliacions.jsonl';
const NOM_EVIDENCIA = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}\.json$/;
const origenDe = (e) => (esInterrompudaAuditoria(e) ? e.recovers : e.originalMutation);

function liniesDe(root) {
  const estat = readState(root, JOURNAL);
  if (!estat.bytes) return { hash: null, bytes: null, linies: [] };
  if (digest(estat.bytes) !== estat.hash) throw new Error(`Traça inestable durant la lectura: ${root}`);
  const text = estat.bytes.toString('utf8');
  if (!text.endsWith('\n')) throw new Error(`Traça incompleta (sense salt final): ${root}`);
  return { hash: estat.hash, bytes: estat.bytes, linies: text.slice(0, -1).split('\n') };
}

function blobDeHead(root, rel) {
  try {
    const fila = execFileSync('git', ['-C', root, 'ls-tree', 'HEAD', '--', rel], { encoding: 'utf8' }).trim();
    return fila ? fila.split(/\s+/)[2] : null;
  } catch { return null; }
}
const blobDelFitxer = (root, rel) => execFileSync('git', ['-C', root, 'hash-object', '--', rel], { encoding: 'utf8' }).trim();
const headDe = (root) => { try { return execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); } catch { return null; } };
function verificadaPerHead(root, rel) {
  const blob = blobDeHead(root, rel);
  if (!blob) return 'evidència no versionada a HEAD';
  if (blob !== blobDelFitxer(root, rel)) return 'evidència diferent del blob de HEAD';
  return null;
}

/** Evidències de l'arrel, llegides amb readState (sense symlinks ni hardlinks). */
function evidencies(root) {
  const dir = safePath(root, EVIDENCE);
  const noms = fs.existsSync(dir) ? fs.readdirSync(dir).filter((n) => n.endsWith('.json')).sort() : [];
  return noms.map((nom) => {
    if (!NOM_EVIDENCIA.test(nom)) return { nom, error: 'nom d’evidència no UUID v4' };
    const rel = `${EVIDENCE}/${nom}`;
    const bytes = readState(root, rel).bytes;
    try { return { nom, rel, bytes, entrada: JSON.parse(bytes.toString('utf8')) }; }
    catch { return { nom, rel, bytes, error: 'evidència il·legible' }; }
  });
}

function provaTemporal(fn) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-segell-log-'));
  try {
    fs.mkdirSync(path.join(temp, '.agents/runtime'), { recursive: true });
    fs.mkdirSync(path.join(temp, EVIDENCE), { recursive: true });
    return fn(temp);
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
}

/** Valida una traça candidata en una arrel temporal amb una còpia exacta de les evidències. */
function validaCandidata(evs, text) {
  return provaTemporal((temp) => {
    try {
      if (text) fs.writeFileSync(path.join(temp, JOURNAL), text, { mode: 0o600 });
      for (const e of evs) if (e.bytes) fs.writeFileSync(path.join(temp, EVIDENCE, e.nom), e.bytes);
      validaTracaAuditoria(temp);
      return { valida: true, error: null };
    } catch (e) { return { valida: false, error: e.message }; }
  });
}

/** Dues passades: registre a registre i, després, transacció a transacció (amb la seua evidència si n'hi ha). */
function classifica(linies, evs) {
  const registres = [], invalides = [];
  linies.forEach((linia, index) => {
    let entrada;
    try { entrada = JSON.parse(linia); validaRegistreAuditoria(entrada); registres.push({ index, linia, entrada }); }
    catch (e) { invalides.push({ index, linia, motiu: e.message, id: entrada?.id ?? null, state: entrada?.state ?? null }); }
  });
  const perEvidencia = new Map(evs.filter((e) => e.entrada).map((e) => [e.entrada.id, e]));
  const citadors = new Map();
  for (const e of evs) if (e.entrada && esHistoricAuditoria(e.entrada) && origenDe(e.entrada)) citadors.set(origenDe(e.entrada), e.entrada);
  const grups = new Map();
  for (const r of registres) { if (!grups.has(r.entrada.id)) grups.set(r.entrada.id, []); grups.get(r.entrada.id).push(r); }
  const quarantena = [], refusats = [], refusades = new Set();
  /** Pot anar a quarantena una transacció? Torna null si sí, o el motiu del refús. */
  const potAnarAQuarantena = (id, grup) => {
    const propia = perEvidencia.get(id);
    if (propia && !esHistoricAuditoria(propia.entrada)) return 'la transacció té evidència moderna pròpia: no es posa en quarantena';
    const citador = citadors.get(id);
    if (citador) {
      const darrer = grup.at(-1)?.entrada;
      if (!darrer || darrer.state !== 'failed') return `és l'origen de l'evidència històrica ${citador.id} i el seu darrer estat no és failed`;
      if (JSON.stringify(projeccioFitxersAuditoria(darrer.files)) !== JSON.stringify(projeccioFitxersAuditoria(citador.files))) return `és l'origen de l'evidència històrica ${citador.id} i els fitxers no coincidixen`;
    }
    return null;
  };
  provaTemporal((temp) => {
    for (const [id, grup] of grups) {
      fs.rmSync(path.join(temp, EVIDENCE), { recursive: true, force: true });
      fs.mkdirSync(path.join(temp, EVIDENCE), { recursive: true });
      const ev = perEvidencia.get(id);
      if (ev) fs.writeFileSync(path.join(temp, EVIDENCE, ev.nom), ev.bytes);
      fs.writeFileSync(path.join(temp, JOURNAL), `${grup.map((g) => g.linia).join('\n')}\n`, { mode: 0o600 });
      try { validaTracaAuditoria(temp); }
      catch (e) {
        if (/evid[eè]ncia/i.test(e.message)) continue;
        const refus = potAnarAQuarantena(id, grup);
        if (refus) { refusats.push({ id, motiu: `seqüència refusada pel validador (${e.message}) i ${refus}` }); continue; }
        refusades.add(id);
        const nota = citadors.has(id) ? ` · origen verificat (failed i fitxers idèntics) de ${citadors.get(id).id}` : '';
        for (const g of grup) quarantena.push({ index: g.index, linia: g.linia, motiu: `seqüència: ${e.message}${nota}`, id, state: g.entrada.state });
      }
    }
  });
  for (const inv of invalides) {
    if (inv.id) {
      const propia = perEvidencia.get(inv.id);
      if (propia && !esHistoricAuditoria(propia.entrada)) { refusats.push({ id: inv.id, motiu: `línia ${inv.index} il·legible per al validador i la transacció té evidència moderna pròpia` }); continue; }
      const citador = citadors.get(inv.id);
      if (citador) { refusats.push({ id: inv.id, motiu: `línia ${inv.index} il·legible i és l'origen de l'evidència històrica ${citador.id}` }); continue; }
      refusades.add(inv.id);
    }
    quarantena.push(inv);
  }
  // Una transacció amb alguna línia en quarantena hi va sencera (cap història a mitges).
  for (const id of refusades) for (const r of grups.get(id) ?? []) if (!quarantena.some((q) => q.index === r.index)) quarantena.push({ index: r.index, linia: r.linia, motiu: 'transacció amb una línia il·legible: va sencera a la quarantena', id, state: r.entrada.state });
  quarantena.sort((a, b) => a.index - b.index);
  return { valides: registres.filter((r) => !refusades.has(r.entrada.id)), quarantena, refusats, enQuarantena: refusades };
}

export function planifica(root, donant) {
  root = fs.realpathSync(root); donant = fs.realpathSync(donant);
  const propi = liniesDe(root), donantTraca = liniesDe(donant);
  const evs = evidencies(root);
  const { valides, quarantena, refusats, enQuarantena } = classifica(propi.linies, evs);
  const perId = new Map();
  for (const v of valides) { if (!perId.has(v.entrada.id)) perId.set(v.entrada.id, []); perId.get(v.entrada.id).push(v); }
  const donantPerId = new Map();
  donantTraca.linies.forEach((linia, index) => {
    let entrada; try { entrada = JSON.parse(linia); validaRegistreAuditoria(entrada); } catch { return; }
    if (!donantPerId.has(entrada.id)) donantPerId.set(entrada.id, []);
    donantPerId.get(entrada.id).push({ index, linia, entrada });
  });

  const importats = [], exempts = [];
  for (const e of evs) {
    if (e.error) { refusats.push({ nom: e.nom, motiu: e.error }); continue; }
    const evidencia = e.entrada;
    const propies = perId.get(evidencia.id) || [];
    if (propies.some((p) => esTerminalAuditoria(p.entrada))) continue;
    if (esHistoricAuditoria(evidencia) && !propies.length) {
      const motiu = verificadaPerHead(root, e.rel);
      if (motiu) refusats.push({ id: evidencia.id, motiu: `evidència històrica exempta però ${motiu}` });
      else exempts.push(evidencia.id);
      continue;
    }
    const motiuHead = verificadaPerHead(root, e.rel);
    if (motiuHead) { refusats.push({ id: evidencia.id, motiu: motiuHead }); continue; }
    if (enQuarantena.has(evidencia.id)) { refusats.push({ id: evidencia.id, motiu: 'la història pròpia ha anat a quarantena: no se substituïx per la del donant' }); continue; }
    const seq = donantPerId.get(evidencia.id) || [];
    const terminal = seq.find((s) => esTerminalAuditoria(s.entrada));
    if (!terminal) { refusats.push({ id: evidencia.id, motiu: 'el donant no té cap registre terminal' }); continue; }
    if (comparableAuditoria(terminal.entrada) !== comparableAuditoria(evidencia)) { refusats.push({ id: evidencia.id, motiu: 'el terminal del donant no és idèntic a l’evidència' }); continue; }
    if (propies.some((p, i) => seq[i]?.linia !== p.linia)) { refusats.push({ id: evidencia.id, motiu: 'les línies pròpies no són un prefix exacte del donant' }); continue; }
    importats.push({ id: evidencia.id, linies: seq.slice(propies.length) });
  }
  const noves = importats.flatMap((i) => i.linies).sort((a, b) => a.index - b.index).map((l) => l.linia);
  const candidata = [...valides.map((v) => v.linia), ...noves];
  const text = candidata.length ? `${candidata.join('\n')}\n` : '';
  const actual = propi.bytes ? validaCandidata(evs, propi.bytes.toString('utf8')) : validaCandidata(evs, '');
  const validacio = validaCandidata(evs, text);
  return {
    arrel: root, head: headDe(root), donant, donantHash: donantTraca.hash, donantHead: headDe(donant),
    hashAbans: propi.hash, liniesAbans: propi.linies.length, actualValida: actual.valida,
    quarantena, importats: importats.map((i) => ({ id: i.id, estats: i.linies.map((l) => l.entrada.state) })),
    refusats, exempts, liniesDespres: candidata.length, hashCandidat: text ? digest(text) : null,
    canvia: quarantena.length > 0 || noves.length > 0, ...validacio, text, bytesAbans: propi.bytes
  };
}

function escriuDurable(fitxer, contingut, append = false) {
  const flags = fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_NOFOLLOW | (append ? fs.constants.O_APPEND : fs.constants.O_EXCL);
  const fd = fs.openSync(fitxer, flags, 0o600);
  try { fs.writeFileSync(fd, contingut); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
}

/** Substitució atòmica de la traça per temporal i rename; el temporal mai no queda orfe. */
function substituix(root, bytes) {
  const runtime = safePath(root, '.agents/runtime');
  const temp = path.join(runtime, `segell.log.${randomUUID()}.tmp`);
  try {
    escriuDurable(temp, bytes);
    fs.renameSync(temp, safePath(root, JOURNAL));
    syncDirectory(root, '.agents/runtime');
  } finally { if (fs.existsSync(temp)) fs.unlinkSync(temp); }
}

export function aplica(root, donant, expectedHash) {
  root = fs.realpathSync(root);
  const lock = safePath(root, LOCK);
  const fd = fs.openSync(lock, fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_NOFOLLOW, 0o600);
  const lockStat = fs.fstatSync(fd);
  try {
    if (readState(root, PENDING).hash !== null) throw new Error('Operació incompleta pendent (mutation.pending.json): reconciliació refusada');
    const pla = planifica(root, donant);
    if ((pla.hashAbans ?? 'absent') !== expectedHash) throw new Error(`CAS divergent: la traça és ${pla.hashAbans ?? 'absent'}, no ${expectedHash}`);
    if (pla.refusats.length) throw new Error(`Hi ha ${pla.refusats.length} refús(os): no s'escriu una traça parcial`);
    if (!pla.valida) throw new Error(`La traça candidata no valida: ${pla.error}`);
    if (!pla.canvia) return { ...pla, aplicat: false };
    const runtime = safePath(root, '.agents/runtime');
    const ara = new Date().toISOString();
    if (pla.bytesAbans) escriuDurable(path.join(runtime, `segell.log.preimatge-${pla.hashAbans.slice(0, 12)}`), pla.bytesAbans);
    if (liniesDe(root).hash !== pla.hashAbans) throw new Error('Canvi concurrent de la traça durant la reconciliació');
    substituix(root, pla.text);
    try { validaTracaAuditoria(root); }
    catch (e) {
      if (pla.bytesAbans) substituix(root, pla.bytesAbans);
      throw new Error(`La traça real no valida després del rename (${e.message}): s'ha restaurat la preimatge`);
    }
    if (pla.quarantena.length) {
      escriuDurable(safePath(root, QUARANTENA), pla.quarantena.map((q) => JSON.stringify({ quan: ara, traçaAbans: pla.hashAbans, index: q.index, motiu: q.motiu, linia: q.linia })).join('\n') + '\n', true);
    }
    const rebut = { quan: ara, head: pla.head, donant: pla.donant, donantHash: pla.donantHash, donantHead: pla.donantHead, abans: pla.hashAbans, despres: pla.hashCandidat, quarantena: pla.quarantena.map((q) => q.index), importats: pla.importats.map((i) => i.id), exempts: pla.exempts };
    escriuDurable(safePath(root, REBUTS), `${JSON.stringify(rebut)}\n`, true);
    syncDirectory(root, '.agents/runtime');
    return { ...pla, aplicat: true, rebut };
  } finally {
    fs.closeSync(fd);
    let actual = null; try { actual = fs.lstatSync(lock); } catch { /* ja no hi és */ }
    if (actual && actual.dev === lockStat.dev && actual.ino === lockStat.ino) { fs.unlinkSync(lock); syncDirectory(root, '.agents/runtime'); }
  }
}

function main() {
  const opcio = (nom) => process.argv.find((a) => a.startsWith(`--${nom}=`))?.slice(nom.length + 3);
  const conegudes = /^--(donant|arrel|expected-hash)=.+|^--(aplica|json)$/;
  const estranyes = process.argv.slice(2).filter((a) => !conegudes.test(a));
  const donant = opcio('donant');
  if (estranyes.length || !donant) {
    console.error('Ús: reconcilia-segell-log.mjs --donant=ARREL [--arrel=ARREL] [--aplica --expected-hash=SHA256|absent] [--json]');
    process.exitCode = 2; return;
  }
  const arrel = opcio('arrel') || process.cwd();
  const aplicant = process.argv.includes('--aplica');
  const resultat = aplicant ? aplica(arrel, donant, opcio('expected-hash')) : planifica(arrel, donant);
  const { text, bytesAbans, ...visible } = resultat;
  void text; void bytesAbans;
  if (process.argv.includes('--json')) console.log(JSON.stringify(visible, null, 2));
  else {
    console.log(`Traça ${visible.arrel}/${JOURNAL}: ${visible.liniesAbans} línies (${visible.hashAbans ?? 'absent'}) · ${visible.actualValida ? 'vàlida' : 'INVÀLIDA'} ara.`);
    console.log(`  quarantena: ${visible.quarantena.length} · importades: ${visible.importats.length} transaccions · refusades: ${visible.refusats.length} · exemptes històriques: ${visible.exempts.length}`);
    for (const q of visible.quarantena) console.log(`  [quarantena] línia ${q.index} ${q.id ?? '(sense id)'} ${q.state ?? ''}: ${q.motiu}`);
    for (const r of visible.refusats) console.log(`  [refusada] ${r.id ?? r.nom}: ${r.motiu}`);
    console.log(`  candidata: ${visible.liniesDespres} línies (${visible.hashCandidat ?? 'buida'}) · ${visible.valida ? 'VÀLIDA' : `INVÀLIDA: ${visible.error}`}`);
    if (visible.aplicat) console.log(`  APLICADA · rebut a ${REBUTS}`);
    else if (aplicant) console.log('  Res a aplicar: la traça ja estava reconciliada.');
    else if (visible.canvia) console.log(`  Mode sec. Per aplicar: --aplica --expected-hash=${visible.hashAbans ?? 'absent'}`);
  }
  if (visible.refusats.length || !visible.valida) process.exitCode = 1;
  else if (!aplicant && visible.canvia) process.exitCode = 3;
  else process.exitCode = 0;
}

if (esMain(import.meta.url)) {
  try { main(); } catch (e) { console.error(`reconcilia-segell-log: ${e.message}`); process.exitCode = 1; }
}
