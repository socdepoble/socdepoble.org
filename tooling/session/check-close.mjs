#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { buildGraph } from '../wiki/core/parse.mjs';

const PROJECT_DIR = process.cwd();
const WIKI_DIR = path.join(PROJECT_DIR, '_wiki_de_poble');

function getWikiDocs(dir) {
  const docs = [];
  function walk(d) {
    if (!fs.existsSync(d)) return;
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        if (!['.git', 'node_modules', '.obsidian'].includes(entry.name)) {
          walk(full);
        }
      } else if (entry.name.endsWith('.md')) {
        const relPath = path.relative(PROJECT_DIR, full);
        docs.push({
          relPath,
          base: entry.name,
          content: fs.readFileSync(full, 'utf8')
        });
      }
    }
  }
  walk(dir);
  return docs;
}

function unreachableFrom(graph, roots) {
  const seen = new Set();
  const queue = roots.filter(r => graph.outgoing.has(r));
  for (const r of queue) seen.add(r);
  
  for (let i = 0; i < queue.length; i++) {
    for (const next of graph.outgoing.get(queue[i]) ?? []) {
      if (!seen.has(next)) { 
        seen.add(next); 
        queue.push(next); 
      }
    }
  }
  return [...graph.outgoing.keys()].filter(id => !seen.has(id));
}

async function run() {
  console.log('🔍 Executant Accessibilitat Dirigida (SCC)...');
  const docs = getWikiDocs(WIKI_DIR);
  
  // buildGraph necessita que els nodes continguen un "parsed.body" o cridarà a extractLinks sobre ells
  // parse.mjs exporta funcions on parseFrontmatter i extractLinks s'usen, però la crida no 
  // ha funcionat així? Espera! parseFrontmatter(doc.content) is used in buildGraph.
  // ParseFrontmatter is not exported from parse.mjs, it's imported from '../lib/frontmatter.mjs'.
  const graph = buildGraph(docs);

  // Arrels canòniques: tots els 00_INDEX.md i els punts d'entrada essencials
  const roots = docs.filter(d => 
    d.base === '00_INDEX.md' || 
    d.base === '00_index_escriptori.md' ||
    d.relPath.includes('00_core_wiki')
  ).map(d => d.relPath);

  const unreachable = unreachableFrom(graph, roots).filter(r => {
    // Excepcions legítimes que no cal que estiguen al graf principal
    if (r.includes('00_plantilles')) return false;
    if (r.includes('90_historic')) return false;
    if (r.includes('.quarantena')) return false;
    if (r.includes('00_bandeja_d_entrada')) return false;
    if (r.includes('04_escriptori') && !r.includes('01_produccio')) return false;
    if (path.basename(r) === '00_INDEX.md') return false;
    return true;
  });

  if (unreachable.length > 0) {
    console.error('\n❌ TANCAMENT BLOQUEJAT: Hi ha nodes inabastables al graf de la Wiki (Accessibilitat Dirigida):');
    unreachable.forEach(u => console.error(`   - ${u}`));
    console.error('\n📝 Tot fitxer ha de ser assolible des d\'algun 00_INDEX.md d\'arrel.\n');
    process.exit(1);
  }

  // Transacció de l'Àncora
  const ancoraPath = path.join(WIKI_DIR, '04_escriptori', '.ancora_sessio.json');
  if (fs.existsSync(ancoraPath)) {
    const ancora = JSON.parse(fs.readFileSync(ancoraPath, 'utf8'));
    console.log(`✅ L'àncora de sessió (${ancora.timestamp}) ha sigut consumida.`);
    fs.unlinkSync(ancoraPath); // Netegem atòmicament
  }

  console.log('✅ Accessibilitat Dirigida: tots els nodes estan enllaçats.');
}

run().catch(e => {
  console.error('❌ Error de tancament:', e);
  process.exit(1);
});
