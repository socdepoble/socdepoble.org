import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { writeIndexedDraft } from '../tooling/documental/draft-write.mjs';
import { VerificadorSCC } from '../tooling/gates/verificador-scc.mjs';
import { checkTaula, ancoratge, ancoresDe, resolAncora, nomsSolts } from '../tooling/gates/porta-olivera.mjs';
import { extractDocumentLinks, resolveDocumentLink } from '../tooling/lib/document-links.mjs';

const DESK = '_wiki_de_poble/04_escriptori';
const INDEX = `${DESK}/00_index_escriptori.md`;
function setup(t) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-draft-attachment-')));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const put = (rel, text) => { const file = path.join(root, rel); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text); };
  put('_wiki_de_poble/00_index.md', '# Índex\n\n[[00_index_escriptori]]\n');
  put(INDEX, '# Escriptori\n\n## Activitat en curs\n\n## Referències\n\nText humà que es conserva.\n');
  fs.mkdirSync(path.join(root, '.agents/runtime'), { recursive: true });
  const write = (name, content = Buffer.from([0, 255, 42])) => writeIndexedDraft(root, path.join(root, DESK, name), content);
  return { root, put, write, index: () => fs.readFileSync(path.join(root, INDEX), 'utf8') };
}
async function bothGates(root) {
  assert.deepEqual(ancoratge(root), { senseAncora: [], fantasma: [] });
  const olivera = checkTaula(root);
  assert.equal(olivera.valid, true, JSON.stringify(olivera));
  const scc = await new VerificadorSCC(root).runAudits();
  assert.equal(scc.valid, true, JSON.stringify(scc));
  return scc;
}

for (const extension of ['patch', 'json', 'html', 'png', 'bin', 'tar.gz']) {
  test(`T11-12 productor: .${extension} queda ancorat en Olivera i SCC sense modificar el binari`, async t => {
    const f = setup(t), name = `261029_0408_solucio_qa.${extension}`, bytes = Buffer.from([0, 255, 42]);
    f.write(name, bytes);
    assert.ok(f.index().includes(`[[./${name}|${name}]]`));
    assert.deepEqual(fs.readFileSync(path.join(f.root, DESK, name)), bytes);
    assert.ok(f.index().includes('Text humà que es conserva.'));
    assert.equal(fs.existsSync(path.join(f.root, '.agents/runtime/document-create.lock')), false);
    await bothGates(f.root);
  });
}

test('T11-12 adjunt sense extensió i Markdown homònim mantenen dos destins exactes', async t => {
  const f = setup(t), stem = '261029_0408_solucio_qa';
  f.write(stem);
  f.write(`${stem}.md`, '# Document\n');
  assert.ok(f.index().includes(`[[./${stem}|${stem}]]`));
  assert.ok(f.index().includes(`[[${stem}.md]]`));
  const presents = nomsSolts(f.root);
  assert.deepEqual(new Set(ancoresDe(f.index()).map(a => resolAncora(a.raw, presents))), new Set([stem, `${stem}.md`]));
  const scc = await bothGates(f.root);
  assert.equal(scc.filesChecked, 3);
});

test('T11-12 .patch i .patch.md homònims no compartixen àncora ni aresta', async t => {
  const f = setup(t), attachment = '261029_0408_solucio_qa.patch';
  f.write(`${attachment}.md`, '# Document\n');
  f.write(attachment);
  assert.ok(f.index().includes(`[[${attachment}.md]]`));
  assert.ok(f.index().includes(`[[./${attachment}|${attachment}]]`));
  await bothGates(f.root);
});

test('T11-12 Markdown simple conserva abreviatura i inserció dins Activitat en curs', async t => {
  const f = setup(t), name = '261029_0408_auditoria_prova.md';
  f.write(name, '# Document\n');
  assert.ok(f.index().includes(`[[${name.slice(0, -3)}]]`));
  assert.ok(f.index().indexOf(name.slice(0, -3)) < f.index().indexOf('## Referències'));
  await bothGates(f.root);
});

test('T11-12 àncora existent explícita amb àlies es conserva sense duplicació', async t => {
  const f = setup(t), name = '261029_0408_solucio_qa.patch';
  f.put(INDEX, `# Escriptori\n\n## Activitat en curs\n\n- [[./${name}|Pegat comprovat]]\n`);
  const before = f.index();
  f.write(name);
  assert.equal(f.index(), before);
  await bothGates(f.root);
});

test('T11-12 un adjunt d’altra carpeta no queda acreditat per un homònim local', async t => {
  const f = setup(t), name = '261029_0408_solucio_qa.patch';
  f.put(`${DESK}/sub/${name}`, 'Fora del primer nivell');
  f.put(INDEX, `# Escriptori\n\n## Activitat en curs\n\n- [[sub/${name}|Recurs de subcarpeta]]\n`);
  f.write(name);
  assert.ok(f.index().includes(`[[./${name}|${name}]]`));
  assert.equal(ancoresDe(f.index()).length, 2);
  await bothGates(f.root);
});

test('T11-12 lock ocupat impedix escriptura i conserva l’índex', t => {
  const f = setup(t), name = '261029_0408_solucio_qa.patch';
  f.put('.agents/runtime/document-create.lock', 'operació concurrent');
  const before = f.index();
  assert.throws(() => f.write(name), /EEXIST/);
  assert.equal(f.index(), before);
  assert.equal(fs.existsSync(path.join(f.root, DESK, name)), false);
  assert.equal(fs.readFileSync(path.join(f.root, '.agents/runtime/document-create.lock'), 'utf8'), 'operació concurrent');
});

test('T11-12 ruta relativa sense extensió preferix el recurs exacte; abreviatura .md continua disponible', t => {
  const f = setup(t), attachment = path.join(f.root, DESK, 'recurs'), markdown = attachment + '.md';
  f.put(`${DESK}/recurs`, 'binari'); f.put(`${DESK}/recurs.md`, '# Document');
  const files = [markdown], source = path.join(f.root, INDEX);
  assert.equal(resolveDocumentLink({ kind: 'wiki', target: './recurs' }, source, files, f.root), attachment);
  assert.equal(resolveDocumentLink({ kind: 'wiki', target: 'recurs' }, source, files, f.root), markdown);
  fs.unlinkSync(attachment);
  assert.equal(resolveDocumentLink({ kind: 'wiki', target: './recurs' }, source, files, f.root), markdown);
  assert.equal(extractDocumentLinks('[[./recurs|Recurs]]')[0].target, './recurs');
});

test('T11-12 ruta explícita fora de l’arrel continua rebutjada', t => {
  const f = setup(t);
  assert.throws(() => resolveDocumentLink({ kind: 'wiki', target: '../../../extern' }, path.join(f.root, INDEX), [], f.root), /fora de l’arrel/);
});


test('T11-12 crear adjunt després del Markdown homònim conserva l’abreviatura anterior amb destí exacte', async t => {
  const f = setup(t), stem = '261029_0408_solucio_qa';
  f.write(`${stem}.md`, '# Document\n');
  assert.ok(f.index().includes(`[[${stem}]]`));
  f.write(stem);
  assert.ok(f.index().includes(`[[${stem}.md|${stem}]]`));
  assert.ok(f.index().includes(`[[./${stem}|${stem}]]`));
  await bothGates(f.root);
});

test('T11-12 una àncora anticipada bare s’actualitza sense duplicar i conserva àlies/fragment', async t => {
  const f = setup(t), name = '261029_0408_solucio_qa.patch';
  f.put(INDEX, `# Escriptori\n\n## Activitat en curs\n\n- [[${name}#Resultat|Pegat comprovat]]\n`);
  f.write(name);
  assert.ok(f.index().includes(`[[./${name}#Resultat|Pegat comprovat]]`));
  assert.equal(ancoresDe(f.index()).length, 1);
  await bothGates(f.root);
});
