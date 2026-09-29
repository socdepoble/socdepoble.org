#!/usr/bin/env node
/**
 * neteja_brossa_arrel.mjs — Retira brossa solta de l'arrel del repositori.
 *
 * Per defecte NOMÉS INFORMA (simulació). Amb --aplica mou els candidats a
 * .sdp-paperera/quarantena-<ISO>/ i hi deixa MANIFEST.json amb l'origen de cada element.
 *
 * Regles (llista negra, no llista blanca):
 *   1. Mai toca una entrada que comença per punt (configuració d'eines i estat local:
 *      .claude, .codex, .immunitari, .sdp-reflex, .iaia_auth, .snapshots...).
 *   2. Mai toca directoris: només fitxers solts.
 *   3. Mai toca un fitxer seguit per git (eixe es retira amb `git rm`, amb commit i revisió).
 *   4. Només mou fitxers que casen amb PATRONS_BROSSA.
 *   5. No esborra mai res: si el destí ja existix, afig un sufix numèric.
 *   6. L'arrel del workspace només es recorre amb --workspace, i la seua brossa va a
 *      una paperera pròpia del workspace, mai dins del repositori.
 *
 * Substituïx la versió de llista blanca del 260929, que a les 18:50 va apartar
 * .claude, .codex, .sdp-reflex i .immunitari (l'original és a la quarantena
 * d'eixa hora, com a .txt).
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { arrelSegura, esMain } from '../lib/arrel.mjs';

export const PATRONS_BROSSA = Object.freeze([
  /\.log$/i, /\.diff$/i, /\.patch$/i, /\.orig$/i, /\.rej$/i, /\.tmp$/i, /~$/,
  /^test_output.*\.txt$/i, /^lint_results.*\.json$/i, /^eslint_errors/i, /^orphans\./i,
  /^probe_.*\.m?js$/i, /^scratchpad_.*\.m?js$/i, /^test-imports\.m?js$/i,
]);

/** Noms de primer nivell seguits per git; null si no és un repositori o git falla. */
export function seguitsPerGit(root) {
  try {
    const out = execFileSync('git', ['-C', root, 'ls-files', '-z'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
    return new Set(out.split('\0').filter(Boolean).map((f) => f.split('/')[0]));
  } catch { return null; }
}

export function candidats(root, { exigixGit = true } = {}) {
  const seguits = seguitsPerGit(root);
  if (!seguits && exigixGit) throw new Error(`Sense inventari de git a ${root}: no es mou res.`);
  return fs.readdirSync(root, { withFileTypes: true })
    .filter((e) => !e.name.startsWith('.'))
    .filter((e) => e.isFile())
    .filter((e) => !seguits || !seguits.has(e.name))
    .filter((e) => PATRONS_BROSSA.some((re) => re.test(e.name)))
    .map((e) => e.name)
    .sort();
}

function destiLliure(dir, nom) {
  let desti = path.join(dir, nom);
  for (let i = 1; fs.existsSync(desti); i += 1) desti = path.join(dir, `${nom}.${i}`);
  return desti;
}

export function neteja(root, { aplica = false, exigixGit = true, ara = new Date() } = {}) {
  const noms = candidats(root, { exigixGit });
  if (!aplica || noms.length === 0) return { root, aplica, noms, paperera: null, moguts: [] };
  const paperera = path.join(root, '.sdp-paperera', `quarantena-${ara.toISOString().replace(/[:.]/g, '-')}`);
  fs.mkdirSync(paperera, { recursive: true });
  const moguts = [];
  try {
    for (const nom of noms) {
      const desti = destiLliure(paperera, nom);
      fs.renameSync(path.join(root, nom), desti);
      moguts.push({ origen: nom, desti: path.relative(root, desti) });
    }
  } finally {
    // També si un moviment falla a mitges: el manifest diu què s'ha mogut fins ací.
    // Rutes relatives, perquè .sdp-paperera es versiona i no ha de dur l'usuari.
    fs.writeFileSync(path.join(paperera, 'MANIFEST.json'), `${JSON.stringify({ data: ara.toISOString(), moguts }, null, 2)}\n`, { flag: 'wx' });
  }
  return { root, aplica, noms, paperera, moguts };
}

if (esMain(import.meta.url)) {
  const aplica = process.argv.includes('--aplica');
  const repo = arrelSegura();
  const arrels = [{ root: repo, exigixGit: true }];
  if (process.argv.includes('--workspace')) arrels.push({ root: path.resolve(repo, '..'), exigixGit: false });
  let codi = 0;
  for (const { root, exigixGit } of arrels) {
    try {
      const r = neteja(root, { aplica, exigixGit });
      const verb = aplica ? 'Mogut' : 'Es mouria';
      if (!r.noms.length) console.log(`✨ ${path.basename(root)}: res a retirar.`);
      for (const nom of r.noms) console.log(`[NETEJA] ${verb}: ${nom} (${path.basename(root)})`);
      if (r.paperera) console.log(`🗑️ Manifest: ${path.join(r.paperera, 'MANIFEST.json')}`);
      else if (r.noms.length) console.log('Simulació: afig --aplica per a moure-ho.');
    } catch (e) {
      console.error(`[ERROR] ${e.message}`);
      codi = 1;
    }
  }
  process.exitCode = codi;
}
