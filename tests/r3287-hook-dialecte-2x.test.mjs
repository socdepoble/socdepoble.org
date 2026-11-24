/**
 * r3287-hook-dialecte-2x.test.mjs — Cobertura del dialecte Antigravity 2.x
 * (`write_file` / `edit_file` amb `Path`/`Content`/`Target`/`Replacement`/`Append`)
 * en tots 5 guardians de governança (Peix 7 · R32.87).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { calenPortes, esEscriptura, preTool } from '../tooling/gates/antigravity-hook.mjs';
import { normalitza } from '../tooling/gates/porta-reflex.mjs';
import { checkPayload as oliveraCheck } from '../tooling/gates/porta-olivera.mjs';
import { decide as verifyDecide } from '../.agents/hooks/verify.mjs';

function tempRepo(t) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-r3287-hook-')));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(dir, '_wiki_de_poble/04_escriptori/01_produccio'), { recursive: true });
  fs.mkdirSync(path.join(dir, '.agents'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'tooling/gates'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'src/css'), { recursive: true });
  fs.writeFileSync(path.join(dir, '_wiki_de_poble/04_escriptori/00_index_escriptori.md'), '# Índex\n');
  fs.writeFileSync(path.join(dir, 'AGENTS.md'), '# BIOS\n');
  fs.writeFileSync(path.join(dir, '.agents/hooks.json'), '{}\n');
  return dir;
}

test('R32.87 · esEscriptura reconeix write_file, edit_file i claus 2.x', () => {
  assert.equal(esEscriptura('write_file', { Path: 'a.md', Content: 'hola' }), true);
  assert.equal(esEscriptura('edit_file', { Path: 'a.md', Target: 'a', Replacement: 'b' }), true);
  assert.equal(esEscriptura('eina_futura', { Content: 'hola' }), true);
  assert.equal(esEscriptura('read_file', { Path: 'a.md' }), false);
});

test('R32.87 · preTool bloqueja write_file i edit_file en 01_produccio, AUTOPROTEGITS i governança', (t) => {
  const root = tempRepo(t);
  const casos = [
    ['write_file', { Path: path.join(root, '_wiki_de_poble/04_escriptori/01_produccio/secret.html'), Content: '<p>x</p>' }, '01_produccio'],
    ['edit_file', { Path: path.join(root, '.agents/hooks.json'), Target: '{}', Replacement: '{"x":1}' }, 'hooks'],
    ['write_file', { Path: path.join(root, 'tooling/gates/antigravity-hook.mjs'), Content: '// hacked' }, 'hooks'],
    ['edit_file', { Path: path.join(root, 'AGENTS.md'), Target: '# BIOS', Replacement: '# PWN' }, 'governança'],
    ['write_file', { Path: path.join(root, 'package.json'), Content: '{}' }, 'governança'],
  ];

  for (const [name, args, etiqueta] of casos) {
    const res = preTool({ toolCall: { name, args } }, { root });
    assert.equal(res.decision, 'force_ask', `${name} sobre ${etiqueta} ha d'exigir force_ask, no ${res.decision}`);
  }
});

test('R32.87 · calenPortes activa escriptura per a write_file/edit_file al primer nivell de l’Escriptori', (t) => {
  const root = tempRepo(t);
  const p = path.join(root, '_wiki_de_poble/04_escriptori/261124_1700_auditoria_prova.md');
  assert.equal(calenPortes('pre-tool', { toolCall: { name: 'write_file', args: { Path: p, Content: '# H1' } } }, root), 'escriptura');
  assert.equal(calenPortes('pre-tool', { toolCall: { name: 'edit_file', args: { Path: p, Target: 'a', Replacement: 'b' } } }, root), 'escriptura');
});

test('R32.87 · porta-reflex normalitza write_file (sencer i Append) i edit_file (Target/Replacement)', (t) => {
  const root = tempRepo(t);
  const rel = '_wiki_de_poble/04_escriptori/261124_1700_prompt_prova.md';
  const abs = path.join(root, rel);
  fs.writeFileSync(abs, 'Títol inicial\nLínia A\n');

  const opWrite = normalitza({ toolArgs: { Path: abs, Content: '# Nou\n', Overwrite: true }, cwd: root }, root);
  assert.equal(opWrite.fitxer, rel);
  assert.equal(opWrite.contingut, '# Nou\n');

  const opAppend = normalitza({ toolArgs: { Path: abs, Content: 'Línia B\n', Append: true }, cwd: root }, root);
  assert.equal(opAppend.contingut, 'Títol inicial\nLínia A\nLínia B\n');

  const opEdit = normalitza({ toolArgs: { Path: abs, Target: 'Línia A', Replacement: 'Línia Z' }, cwd: root }, root);
  assert.equal(opEdit.contingut, 'Títol inicial\nLínia Z\n');
});

test('R32.87 · porta-olivera i verify.mjs reconeixen Path/Content/Replacement del dialecte 2.x', (t) => {
  const root = tempRepo(t);
  const petorreta = path.join(root, '_wiki_de_poble/04_escriptori/261124_1700_prompt_codex_prova.md');
  const resOl = oliveraCheck({ tool_name: 'write_file', toolArgs: { Path: petorreta, Content: '# sense seccio 0\n' } }, root);
  assert.notEqual(resOl.code, 0, 'porta-olivera ha d’inspeccionar una petorreta escrita amb write_file');

  const cssPath = path.join(root, 'src/css/tokens.css');
  const vCss = verifyDecide({
    toolCall: { name: 'edit_file', args: { Path: cssPath, Target: 'color: red;', Replacement: 'color: red !important;' } },
  }, root);
  assert.equal(vCss.decision, 'deny');
  assert.match(vCss.reason, /!important/);

  const vProd = verifyDecide({
    toolCall: { name: 'write_file', args: { Path: path.join(root, '_wiki_de_poble/04_escriptori/01_produccio/x.html'), Content: 'x' } },
  }, root);
  assert.equal(vProd.decision, 'deny');
});
