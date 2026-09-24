/** Shared path-based resolver. A Markdown URL is always relative to its source. */
import { CAMINS } from './arrel.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {canonical, inside} from '../documental/core.mjs';
export function extractDocumentLinks(content) {
  const clean = content.replace(/```[\s\S]*?```/g, '').replace(/`[^`]+`/g, '');
  const links = [];
  for (const m of clean.matchAll(/\[\[([^\]]+)\]\]/g)) links.push({kind: 'wiki', target: m[1].split('|')[0].split('#')[0].trim()});
  for (const m of clean.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) links.push({kind: 'markdown', target: m[1].trim().replace(/^<|>$/g, '').split('#')[0].split('?')[0]});
  return links.filter(l => l.target && !/^[a-z][a-z0-9+.-]*:/i.test(l.target));
}
export function resolveDocumentLink(link, source, files, root) {
  let target;
  try { target = decodeURIComponent(link.target); } catch { throw new Error(`URL invàlida: ${link.target}`); }
  if (link.kind === 'wiki' && !path.extname(target)) target += '.md';
  let candidates;
  if (link.kind === 'markdown' || target.startsWith('./') || target.startsWith('../')) candidates = [path.resolve(path.dirname(source), target)];
  else if (target.includes('/')) candidates = [...new Set([path.resolve(root, target), path.resolve(root, CAMINS.wiki, target), path.resolve(path.dirname(source), target)])];
  else candidates = files.filter(f => path.basename(f) === target);
  const found = candidates.filter(f => {
    if (!inside(path.resolve(root), f) || !inside(canonical(root), canonical(f))) throw new Error(`Enllaç fora de l’arrel: ${target}`);
    return fs.existsSync(f) && fs.statSync(f).isFile();
  });
  if (found.length !== 1) throw new Error(`${found.length ? 'Enllaç ambigu' : 'Enllaç inexistent'}: ${target}`);
  return found[0];
}
