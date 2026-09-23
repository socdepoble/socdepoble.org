import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { search } from './edge_rag.mjs';

export async function run(options) {
  if (!options.query) return { ok: false, summary: '[ERROR] Cal --query="text a buscar".', data: {} };
  const root = options.root || '.';
  
  let indexData;
  try {
    const indexPath = join(root, 'public', 'rag-index.json');
    indexData = await readFile(indexPath, 'utf8');
  } catch {
    return { ok: false, summary: '[ERROR] rag-index.json no trobat. Executa el pre-build de RAG.', data: {} };
  }
  
  const index = JSON.parse(indexData);
  const results = search(index, options.query, options.top ? Number(options.top) : undefined);
  
  return {
    ok: true,
    summary: `${results.length} resultats per a "${options.query}" (corpus: ${index.docCount} fitxers).`,
    data: { query: options.query, docCount: index.docCount, results },
  };
}
