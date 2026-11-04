/** Inventari compartit del graf operatiu; història i rebuts no són nodes d'autoria.
 * Els recursos humans i de recerca sí que es compten, però els binaris no es lligen.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { CAMINS } from './arrel.mjs';
import { isExecutionEvidence } from './corpus-scope.mjs';

export function isDocumentArchive(relative) {
  const rel = relative.replaceAll('\\', '/').replace(/^\.\//, '');
  return isExecutionEvidence(rel)
    || /(?:^|\/)(?:90_arxiu_historic|90_historic|05_ARXIU)(?:\/|$)/.test(rel)
    || /^(?:\.brain-trash|\.brain-reports|\.wiki-safety|var)(?:\/|$)/.test(rel)
    || /^\.agents\/(?:deute|seal-transactions|cervells)(?:\/|$)/.test(rel);
}

/** Un Markdown servit com a recurs d'una API Data Package no és una nota
 * d'autoria. La frontera depén del contracte verificat, mai d'un nom de .md:
 * manifest v2, path local únic, mediatype/format/UTF-8, bytes i SHA-256 de
 * TOTS els recursos. Si falta o divergix res, torna al corpus ordinari.
 * Només reconeix recursos dins de public/ (l'arrel web), sense symlinks.
 * Açò prova pertinença/integritat, no autoria, llicència oberta ni absència
 * de PII en un contingut que algú haja decidit publicar.
 */
export function isVerifiedPublicApiResource(root, relative) {
  if (typeof relative !== 'string' || !relative.startsWith('public/') || !/\.md$/i.test(relative)
    || path.posix.normalize(relative) !== relative || relative.includes('\\')) return false;
  const MAXIM = 64 * 1024 * 1024;
  const regular = (rel, maxim) => {
    let actual = root;
    for (const part of rel.split('/')) {
      actual = path.join(actual, part);
      const stat = fs.lstatSync(actual);
      if (stat.isSymbolicLink()) throw new Error('Symlink no auditat');
    }
    const fd = fs.openSync(actual, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
    try {
      const stat = fs.fstatSync(fd);
      if (!stat.isFile() || stat.size > maxim) throw new Error('Recurs absent o massa gran');
      const bytes = fs.readFileSync(fd);
      if (bytes.length > maxim) throw new Error('Recurs massa gran');
      return bytes;
    } finally { fs.closeSync(fd); }
  };
  const pla = x => x !== null && typeof x === 'object' && !Array.isArray(x);
  const recursLocal = value => typeof value === 'string' && /^[a-zA-Z0-9_.-]+(?:\/[a-zA-Z0-9_.-]+)*$/.test(value)
    && !value.split('/').some(x => x === '.' || x === '..');
  // Qualsevol directori públic pot publicar un Data Package amb el seu contracte.
  for (let dir = path.posix.dirname(relative); dir === 'public' || dir.startsWith('public/'); dir = path.posix.dirname(dir)) {
    for (const nom of ['datapackage.json', 'manifest.json']) {
      try {
        const manifest = JSON.parse(regular(`${dir}/${nom}`, 2 * 1024 * 1024).toString('utf8'));
        if (!pla(manifest) || manifest.$schema !== 'https://datapackage.org/profiles/2.0/datapackage.json'
          || typeof manifest.name !== 'string' || !/^[a-z0-9._-]+$/.test(manifest.name)
          || !Array.isArray(manifest.resources) || !manifest.resources.length || manifest.resources.length > 1000) continue;
        const paths = new Set(), noms = new Set(); let elegible = false, valid = true, total = 0;
        for (const recurs of manifest.resources) {
          if (!pla(recurs) || Object.hasOwn(recurs, 'data')
            || (recurs.$schema !== undefined && recurs.$schema !== 'https://datapackage.org/profiles/2.0/dataresource.json')
            || !recursLocal(recurs.path) || paths.has(recurs.path)
            || typeof recurs.name !== 'string' || !/^[a-z0-9._-]+$/.test(recurs.name) || noms.has(recurs.name)
            || !Number.isSafeInteger(recurs.bytes) || recurs.bytes < 0 || recurs.bytes > MAXIM
            || typeof recurs.hash !== 'string' || !/^sha256:[0-9a-f]{64}$/.test(recurs.hash)
            || typeof recurs.mediatype !== 'string' || typeof recurs.format !== 'string') { valid = false; break; }
          paths.add(recurs.path); noms.add(recurs.name);
          total += recurs.bytes; if (total > MAXIM) { valid = false; break; }
          const bytes = regular(`${dir}/${recurs.path}`, MAXIM);
          if (bytes.length !== recurs.bytes || `sha256:${createHash('sha256').update(bytes).digest('hex')}` !== recurs.hash) { valid = false; break; }
          if (`${dir}/${recurs.path}` === relative) {
            if (recurs.mediatype !== 'text/markdown' || recurs.format !== 'md' || recurs.encoding !== 'utf-8') { valid = false; break; }
            new TextDecoder('utf-8', { fatal: true }).decode(bytes);
            elegible = true;
          }
        }
        if (valid && elegible) return true;
      } catch { /* Sense contracte demostrat, és document ordinari. */ }
    }
    if (dir === 'public') break;
  }
  return false;
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
    } else if (stat.isFile() && !isVerifiedPublicApiResource(root, relative) && (/\.md$/i.test(relative)
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
