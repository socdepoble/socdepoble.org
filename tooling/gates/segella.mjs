#!/usr/bin/env node
/** Llei Z · Segell criptogràfic de les skills.
 *
 *  Què protegix: que ningú modifique les regles d'amagat. Per tant el hash ha de
 *  cobrir les REGLES, no el que el sistema operatiu deixa caure dins de la
 *  carpeta. Un `.DS_Store` que el Finder escriu en obrir `.agents/skills/` no és
 *  una regla, i fins al 260923 trencava el segell i emmudia les 45 portes que
 *  venen darrere.
 *
 *  Superfície segellada: `.agents/skills/**\/*.md` (les 16 SKILL.md i
 *  00_INDEX_SKILLS.md). Qualsevol altra extensió queda fora del hash i es
 *  reporta com a ignorada perquè l'exclusió siga visible, no silenciosa.
 *
 *  Ús: segella.mjs [--update] [--json]
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';

const SEGELLABLE = /\.md$/i;

function getAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }
  return fileList;
}

/** Calcula el hash de la superfície segellable. Retorna també què ha quedat fora. */
export function calculaSegell(root = process.cwd()) {
  const agentsDir = path.resolve(root, '.agents/skills');
  const tots = getAllFiles(agentsDir).sort();
  const files = tots.filter((f) => SEGELLABLE.test(path.basename(f)));
  const ignorats = tots.filter((f) => !SEGELLABLE.test(path.basename(f)))
    .map((f) => path.relative(root, f));

  const combinedHash = crypto.createHash('sha256');
  for (const file of files) {
    combinedHash.update(path.relative(root, file));
    combinedHash.update(fs.readFileSync(file));
  }
  return { hash: combinedHash.digest('hex'), files: files.map((f) => path.relative(root, f)), ignorats };
}

/** Compara o actualitza el segell. No llança: torna un resultat descriptible. */
export function verificaSegell(root = process.cwd(), { update = false } = {}) {
  const sealFile = path.resolve(root, '.agents/SKILLS_SEAL.json');
  const { hash, files, ignorats } = calculaSegell(root);
  const existeix = fs.existsSync(sealFile);

  if (!existeix && !update) {
    return { ok: false, motiu: 'absent', hash, anterior: null, files, ignorats };
  }
  const oldSeal = existeix ? JSON.parse(fs.readFileSync(sealFile, 'utf8')) : { hash: null };

  if (!update) {
    const ok = oldSeal.hash === null || oldSeal.hash === hash;
    return { ok, motiu: ok ? 'intacte' : 'ruptura', hash, anterior: oldSeal.hash, files, ignorats };
  }

  const seal = { timestamp: new Date().toISOString(), hash, filesCount: files.length };
  fs.writeFileSync(sealFile, `${JSON.stringify(seal, null, 2)}\n`);
  return {
    ok: true,
    motiu: oldSeal.hash === hash ? 'intacte' : 'resegellat',
    hash,
    anterior: oldSeal.hash,
    files,
    ignorats
  };
}

function main() {
  const update = process.argv.includes('--update');
  const json = process.argv.includes('--json');
  const r = verificaSegell(process.cwd(), { update });

  if (json) {
    console.log(JSON.stringify(r, null, 2));
    process.exit(r.ok ? 0 : 1);
  }

  if (r.motiu === 'absent') {
    console.error('Segell absent; cal una actualització explícita amb --update');
    process.exit(1);
  }
  if (r.motiu === 'ruptura') {
    console.error(`❌ [Llei Z] Ruptura de segell detectada! El hash actual ${r.hash.substring(0, 8)} no coincideix amb el segellat ${r.anterior.substring(0, 8)}. T'han modificat les regles d'amagat? Usa --update si és intencionat.`);
    process.exit(1);
  }
  if (r.ignorats.length) {
    console.log(`ℹ️ [Llei Z] ${r.ignorats.length} fitxer(s) fora del segell perquè no són regles: ${r.ignorats.join(', ')}`);
  }
  if (r.motiu === 'resegellat') {
    console.log(`✅ [Llei Z] Nou segell de skills desat. Hash: ${r.hash.substring(0, 8)}... (anterior ${String(r.anterior).substring(0, 8)})`);
  } else {
    console.log(`✅ [Llei Z] Skills cryptosegellats sense canvis. Hash: ${r.hash.substring(0, 8)}...`);
  }
  process.exit(0);
}

// `import.meta.url` porta el camí REAL i `process.argv[1]` el camí tal com
// s'ha escrit: sota un symlink (/var cap a /private/var a macOS, i qualsevol
// fixture de proves a os.tmpdir()) no coincidixen, el mòdul es carrega en
// silenci i la porta ix 0 sense comprovar res. Resoldre el symlink és el que
// fa que la guarda parle sempre.
if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) main();
