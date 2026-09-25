/** Inventari compartit del graf operatiu; història i rebuts no són nodes d'autoria.
 * Els recursos humans i de recerca sí que es compten, però els binaris no es lligen.
 */
import fs from 'node:fs';
import path from 'node:path';
import { CAMINS } from './arrel.mjs';
import { isExecutionEvidence } from './corpus-scope.mjs';

export function isDocumentArchive(relative) {
  const rel = relative.replaceAll('\\', '/').replace(/^\.\//, '');
  return isExecutionEvidence(rel)
    || /(?:^|\/)(?:90_arxiu_historic|90_historic|05_ARXIU)(?:\/|$)/.test(rel)
    || /^(?:\.brain-trash|\.brain-reports|\.wiki-safety|var)(?:\/|$)/.test(rel)
    || /^\.agents\/(?:deute|seal-transactions|cervells)(?:\/|$)/.test(rel);
}

export function documentCorpus(root, roots = [CAMINS.wiki, '.agents']) {
  const files = new Set();
  function scan(relative) {
    if (isDocumentArchive(relative)) return;
    const absolute = path.resolve(root, relative);
    if (!fs.existsSync(absolute)) return;
    const stat = fs.lstatSync(absolute);
    if (stat.isSymbolicLink()) throw new Error(`Symlink no auditat: ${relative}`);
    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(absolute)) {
        if (entry.startsWith('.') || ['node_modules', 'dist', 'build'].includes(entry)) continue;
        scan(path.posix.join(relative, entry));
      }
    } else if (stat.isFile() && (/\.md$/i.test(relative)
      || relative.startsWith(`${CAMINS.escriptori}/01_produccio/`)
      || relative.startsWith(`${CAMINS.escriptori}/02_investigacio_ia/`))) files.add(relative);
  }
  roots.forEach(scan);
  // El BIOS original resol els seus enllaços des de l'arrel; el mirall no duplica el graf.
  if (fs.existsSync(path.join(root, 'AGENTS.md'))) files.delete('.agents/AGENTS.md');
  for (const file of ['AGENTS.md', 'CLAUDE.md', 'README.md', 'INTEGRACIO.md', 'VEINS.md']) {
    if (fs.existsSync(path.join(root, file))) files.add(file);
  }
  return [...files].sort();
}

/** Catàleg de destinacions: només noms i lstat, mai contingut de l'arxiu històric. */
export function documentLinkTargets(root, nodes) {
  const targets = new Set(nodes);
  function names(relative) {
    const absolute = path.join(root, relative);
    if (!fs.existsSync(absolute)) return;
    for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      const rel = path.posix.join(relative, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`Symlink no auditat: ${rel}`);
      if (entry.isDirectory()) names(rel);
      else if (entry.isFile()) targets.add(rel);
    }
  }
  names(`${CAMINS.wiki}/90_arxiu_historic`);
  if (fs.existsSync(path.join(root, '.agents'))) {
    for (const entry of fs.readdirSync(path.join(root, '.agents'), { withFileTypes: true })) {
      if (entry.isFile() && entry.name !== 'AGENTS.md') targets.add(`.agents/${entry.name}`);
    }
  }
  return [...targets].map(file => path.join(root, file));
}

/** L'estat vigent és el primer bloc; el LEDGER conserva evidència, no ordres actives.
 * Els bytes històrics romanen intactes i els enllaços es poden auditar separadament.
 */
export function operationalDocumentText(text, relative) {
  if (relative === '.agents/ESTAT.md') {
    const sections = [...text.matchAll(/^## ESTAT_ACTUAL\b.*$/gm)];
    if (sections.length > 1) return text.slice(0, sections[1].index);
  }
  if (relative === '.agents/LEDGER.md') {
    return text.match(/^## Vincles\s*\n[\s\S]*?(?=^## |$(?![\s\S]))/m)?.[0] || '';
  }
  return text;
}
