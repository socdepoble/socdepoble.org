/** Prototip consultiu. Cap escriptura, fusió ni canvi de baseline. */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { extractDocumentLinks, resolveDocumentLink } from '../../../../tooling/lib/document-links.mjs';
import { arrelSegura, esMain } from '../../../../tooling/lib/arrel.mjs';

export function mesuraGraf(nodes, edges, roots) {
  const ids = new Set(nodes);
  if (ids.size !== nodes.length || !ids.size) throw new Error('Inventari buit o duplicat');
  if (!roots.length || roots.some(id => !ids.has(id))) throw new Error('Arrel absent');
  const outgoing = new Map(nodes.map(id => [id, new Set()]));
  const incoming = new Map(nodes.map(id => [id, new Set()]));
  for (const [from, to] of edges) {
    if (!ids.has(from) || !ids.has(to)) throw new Error('Aresta fora del snapshot');
    if (from === to) continue;
    outgoing.get(from).add(to);
    incoming.get(to).add(from);
  }
  const reachable = new Set();
  const queue = [...roots];
  while (queue.length) {
    const id = queue.pop();
    if (reachable.has(id)) continue;
    reachable.add(id);
    queue.push(...outgoing.get(id));
  }
  const rootSet = new Set(roots);
  return {
    nodes: nodes.length,
    edges: [...outgoing.values()].reduce((n, values) => n + values.size, 0),
    orphans: nodes.filter(id => !rootSet.has(id) && !incoming.get(id).size).sort(),
    unreachable: nodes.filter(id => !reachable.has(id)).sort()
  };
}

export function duplicatsExactes(documents) {
  const groups = new Map();
  for (const { file, text } of documents) {
    const digest = createHash('sha256').update(text).digest('hex');
    if (!groups.has(digest)) groups.set(digest, []);
    groups.get(digest).push(file);
  }
  return [...groups].filter(([, files]) => files.length > 1)
    .map(([sha256, files]) => ({ sha256, files: files.sort(), requires_human_decision: true }));
}

export function audita(root) {
  root = fs.realpathSync(root);
  const files = [], skipped = [];
  // L'arxiu i el laboratori són evidència/referències, no coneixement actiu.
  const excluded = new Set(['90_arxiu_historic', '90_historic', '02_investigacio_ia']);
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a,b) => a.name.localeCompare(b.name))) {
      const file = path.join(dir, entry.name);
      if (entry.name.startsWith('.') || excluded.has(entry.name)) { skipped.push(path.relative(root,file)); continue; }
      if (entry.isSymbolicLink()) throw new Error(`Symlink: ${path.relative(root,file)}`);
      if (entry.isDirectory()) walk(file);
      else if (entry.isFile() && file.endsWith('.md')) files.push(file);
    }
  }
  walk(path.join(root, '_wiki_de_poble'));
  walk(path.join(root, '.agents/skills'));
  for (const rel of ['AGENTS.md', 'CLAUDE.md', '.agents/BOOTSTRAP.md']) {
    const file = path.join(root, rel);
    if (!fs.lstatSync(file).isFile()) throw new Error(`Font no regular: ${rel}`);
    files.push(file);
  }
  const names = new Set(files);
  const docs = files.map(file => ({ file, text: fs.readFileSync(file, 'utf8') }));
  const edges = [], unresolved = [], outsideScope = [];
  for (const { file, text } of docs) {
    for (const link of extractDocumentLinks(text)) {
      try {
        const target = resolveDocumentLink(link, file, files, root);
        if (names.has(target)) edges.push([file,target]);
        else outsideScope.push({ source: path.relative(root,file), target: path.relative(root,target) });
      } catch (error) { unresolved.push({ source: path.relative(root,file), target: link.target, reason: error.message }); }
    }
  }
  // Comprova que el contingut llegit no ha canviat durant l'auditoria.
  for (const doc of docs) if (fs.readFileSync(doc.file,'utf8') !== doc.text) throw new Error('Snapshot canviat; repetix la lectura');
  const rel = file => path.relative(root,file);
  const graph = mesuraGraf(files.map(rel), edges.map(pair => pair.map(rel)), ['_wiki_de_poble/00_index.md', 'AGENTS.md']);
  return {
    schema: 'sdp.audit-prototype.v1', scope: 'wiki activa i skills; laboratori i història exclosos',
    parser: 'tooling/lib/document-links.mjs (ancoratges interns i aliases YAML no validats)',
    snapshot: createHash('sha256').update(docs.map(d => `${rel(d.file)}\0${d.text}`).join('\0')).digest('hex'),
    ...graph, unresolved, outsideScope, skipped,
    duplicates: duplicatsExactes(docs.map(d => ({ ...d, file: rel(d.file) })))
  };
}

if (esMain(import.meta.url)) {
  try { console.log(JSON.stringify(audita(arrelSegura()), null, 2)); }
  catch (error) { console.error(error.message); process.exitCode = 2; }
}
