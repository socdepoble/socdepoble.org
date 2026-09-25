import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { documentCorpus, documentLinkTargets, operationalDocumentText } from '../tooling/lib/document-corpus.mjs';
import { extractDocumentLinks, resolveDocumentLink } from '../tooling/lib/document-links.mjs';

function fixture(t, files) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-corpus-')));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const [file, body] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), body);
  }
  return root;
}

test('el corpus inclou recursos humans i recerca, però no duplica BIOS ni tracta evidència com autoria', t => {
  const files = {
    'AGENTS.md': '# BIOS', '.agents/AGENTS.md': '# Mirall', '.agents/index.md': '# Agents',
    '.agents/runtime/rebut.md': '# Rebut', '.agents/deute/baseline.md': '# Evidència',
    '_wiki_de_poble/runtime/nota.md': '# Capítol legítim',
    '_wiki_de_poble/04_escriptori/01_produccio/font.pdf': Buffer.from([0, 255, 1]),
    '_wiki_de_poble/04_escriptori/02_investigacio_ia/prototip.mjs': 'export const prova = 1;',
    '_wiki_de_poble/90_arxiu_historic/antic.md': '[[ruta_que_ja_no_existeix]]',
  };
  const root = fixture(t, files), corpus = documentCorpus(root);
  assert.deepEqual(corpus, ['.agents/index.md', 'AGENTS.md',
    '_wiki_de_poble/04_escriptori/01_produccio/font.pdf',
    '_wiki_de_poble/04_escriptori/02_investigacio_ia/prototip.mjs',
    '_wiki_de_poble/runtime/nota.md']);
  assert.ok(documentLinkTargets(root, corpus).includes(path.join(root, '_wiki_de_poble/90_arxiu_historic/antic.md')));
});

test('el resolutor prioritza el veïnat wiki, rebutja ambigüitat i manté Markdown relatiu', t => {
  const root = fixture(t, { 'a/font.md': '', 'a/nota.md': '', 'b/nota.md': '', 'b/altre.md': '', 'index.md': '' });
  const files = ['a/font.md', 'a/nota.md', 'b/nota.md', 'b/altre.md', 'index.md'].map(f => path.join(root, f));
  const resolve = (kind, target, source = 'a/font.md') => resolveDocumentLink({kind, target}, path.join(root, source), files, root);
  assert.equal(resolve('wiki', 'nota'), path.join(root, 'a/nota.md'));
  assert.equal(resolve('wiki', 'altre'), path.join(root, 'b/altre.md'));
  assert.throws(() => resolve('wiki', 'nota', 'index.md'), /ambigu/);
  assert.throws(() => resolve('markdown', 'altre.md'), /inexistent/);
  assert.throws(() => resolve('wiki', '../fora', 'index.md'), /fora de/);
  assert.equal(resolve('markdown', '../b/altre.md'), path.join(root, 'b/altre.md'));
});

test('la història d’ESTAT no reactiva ordres, i els enllaços trencats del bloc vigent continuen visibles', () => {
  const current = '# ESTAT\n## ESTAT_ACTUAL · hui\n[[pendent_real]]\n';
  const history = '## ESTAT_ACTUAL · ahir\n[[ruta_antiga]]\n';
  assert.equal(operationalDocumentText(current + history, '.agents/ESTAT.md'), current);
  assert.deepEqual(extractDocumentLinks(operationalDocumentText(current + history, '.agents/ESTAT.md')), [{kind: 'wiki', target: 'pendent_real'}]);
  assert.equal(operationalDocumentText(current + history, '_wiki_de_poble/nota.md'), current + history);
  assert.equal(operationalDocumentText('# LEDGER\n[[antic]]\n## Vincles\n- [[index]]\n## Història\n[[antic]]', '.agents/LEDGER.md'), '## Vincles\n- [[index]]\n');
});

test('un symlink al corpus falla abans de llegir contingut alié', t => {
  const root = fixture(t, { '_wiki_de_poble/nota.md': '' });
  fs.symlinkSync(os.tmpdir(), path.join(root, '_wiki_de_poble/extern'));
  assert.throws(() => documentCorpus(root), /Symlink no auditat/);
});
