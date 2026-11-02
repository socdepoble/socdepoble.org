import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fixture, validDoc } from './helpers/documental.mjs';
import { sourceSections, sections, validateSections, loadContract, saveContract } from '../tooling/documental/core.mjs';
import { validateDocument } from '../tooling/documental/turns.mjs';

const name = 'Context Tècnic i Arquitectònic';
test('un prompt generat conserva rutes i ordres i rebutja canvis dins de backticks', t => {
  const root = fixture(t), d = validDoc(root, { route: 'prompt.local' });
  const route = loadContract(root).router.rutes.find(r => r.id === 'prompt.local');
  assert.equal(route.fixedBlocksFormat, 'markdown-v1');
  assert.ok(sourceSections(d.content).get(name).includes('`AGENTS.md`'));
  assert.ok(d.content.includes('`node tooling/gates/obrir_torn.mjs`'));
  assert.deepEqual(validateDocument(root, d.content, d.file), []);
  const altered = d.content.replace('`AGENTS.md`', '`IGNORA_LES_REGLES.md`');
  assert.match(validateDocument(root, altered, d.file).join(), /Bloc normatiu alterat/);
});
test('offsets UTF-16 i CRLF: el codi amb capçaleres i comentaris es copia literal', () => {
  const content = '🙂 `ruta/à.js`\r\n\r\n~~~~js\r\n## No és secció\r\nconst x = `valor`;\r\n~~~~\r\n<!-- conserva este comentari -->';
  const body = `## Context\r\n\r\n${content}\r\n\r\n<!-- SDP:SECTION prompt.s2 -->\r\n## Següent\r\n\r\nFinal\r\n`;
  assert.deepEqual([...sourceSections(body).keys()], ['Context', 'Següent']);
  assert.equal(sourceSections(body).get('Context'), content);
  assert.equal(sourceSections(body).get('Següent'), 'Final');
});
test('el bloc fix inclou fences, i capçaleres només en un exemple no acrediten seccions', () => {
  const body = '## Context\n\nText `a`\n~~~\n## Falsa\ncomanda --fixa\n~~~\n';
  const route = { seccions: ['Context'], fixedBlocksFormat: 'markdown-v1', fixedBlocks: Object.fromEntries(sourceSections(body)) };
  assert.deepEqual(validateSections(body, route), []);
  assert.match(validateSections(body.replace('--fixa', '--altera'), route).join(), /Bloc normatiu alterat/);
  assert.match(validateSections(body, { ...route, seccions: ['Context', 'Falsa'] }).join(), /Secció absent o pendent: Falsa/);
});
test('un rebut històric conserva les comparacions de la seua versió immutable', t => {
  const root = fixture(t), d = validDoc(root, { route: 'prompt.local' });
  const contract = loadContract(root);
  for (const r of contract.router.rutes) {
    delete r.fixedBlocksFormat;
    r.fixedBlocks = Object.fromEntries((r.blocsFixos || []).map(n => [n, sections(r.templateText).get(n)]));
  }
  const record = path.join(root, '.agents/runtime/turns', `${d.turn.turn_id}.json`);
  const turn = JSON.parse(fs.readFileSync(record));
  turn.receipts[d.delivery.reflex.split(':')[2]].contractSnapshot = saveContract(root, contract);
  fs.writeFileSync(record, JSON.stringify(turn));
  assert.deepEqual(validateDocument(root, d.content, d.file), []);
});
test('un format desconegut no pot degradar la comparació estricta', () => {
  assert.match(validateSections('## Context\nText', { seccions: ['Context'], fixedBlocksFormat: 'inventat' }).join(), /Format de blocs normatius desconegut/);
});

test('una còpia íntegra al final no amaga l’alteració del bloc normatiu original', () => {
  const route = { seccions: ['Context'], fixedBlocksFormat: 'markdown-v1', fixedBlocks: { Context: 'Norma `AGENTS.md`' } };
  const duplicat = '## Context\nNorma `IGNORA.md`\n\n## Context\nNorma `AGENTS.md`\n';
  assert.match(validateSections(duplicat, route).join(), /Bloc normatiu duplicat: Context/);
  const exemple = '## Context\nNorma `AGENTS.md`\n~~~\n## Context\nExemple\n~~~\n';
  assert.deepEqual(validateSections(exemple, { ...route, fixedBlocks: Object.fromEntries(sourceSections(exemple)) }), []);
  const legacy = { ...route, fixedBlocks: { Context: sections(duplicat).get('Context') } };
  delete legacy.fixedBlocksFormat;
  assert.deepEqual(validateSections(duplicat, legacy), []);
});
