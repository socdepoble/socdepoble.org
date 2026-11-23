import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const gate = fileURLToPath(new URL('../tooling/wiki/tractor-frontmatter.mjs', import.meta.url));
const schema = fs.readFileSync(new URL('../tooling/wiki/schema.json', import.meta.url));
const scope = JSON.parse(fs.readFileSync(new URL('../tooling/wiki/frontmatter-abast.json', import.meta.url)));
const note = (name, link, extra = '') => `---\ntype: document\nstatus: actiu\ndescription: Document sintètic de la prova independent.\n${extra}---\n# ${name}\n\n## Vincles\n- [[${link}]]\n`;
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'r3245-fm-')); t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const put = (rel, bytes) => { fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true }); fs.writeFileSync(path.join(root, rel), bytes); };
  put('.agents/AGENTS.md', '# Marcador sintètic');
  put('tooling/wiki/schema.json', schema); put('tooling/wiki/frontmatter-abast.json', JSON.stringify({ ...scope, arrels: ['docs', 'src'] }));
  put('docs/a.md', note('A', 'b')); put('docs/b.md', note('B', 'a'));
  const run = args => { const r = spawnSync(process.execPath, [gate, `--arrel=${root}`, '--json', '--estricte', ...args], { cwd: root, encoding: 'utf8', timeout: 10000 }); return { ...r, data: r.stdout.trim() ? JSON.parse(r.stdout) : null }; };
  return { root, put, run };
}
test('core true operatiu conserva font i tipus, però altra redundància encara és F5', t => {
  const f = fixture(t); f.put('docs/a.md', note('A', 'b', 'core: true\n')); f.put('docs/b.md', note('B', 'a', 'core: true\n'));
  const before = fs.readFileSync(path.join(f.root, 'docs/a.md')); let r = f.run([]);
  assert.equal(r.status, 0, r.stderr); assert.deepEqual(r.data.fallades.F5, []); assert.deepEqual(fs.readFileSync(path.join(f.root, 'docs/a.md')), before);
  f.put('docs/a.md', note('A', 'b', 'core: "true"\n')); r = f.run([]); assert.equal(r.status, 1); assert.ok(r.data.fallades.F7.some(x => x.clau === 'core'));
  f.put('docs/a.md', note('A', 'b', 'lang: ca\n')); f.put('docs/b.md', note('B', 'a', 'lang: ca\n')); r = f.run([]);
  assert.ok(r.data.fallades.F5.some(x => x.clau === 'lang'));
});
test('set fitxes runtime exactes fora; nota adjacent d’autoria continua dins', t => {
  const f = fixture(t); const names = ['auditoria_aparador','consol_vendes','detectiu_poble','enllac_torn','estructural','policia_disseny','triturador_financer'];
  for (const name of names) f.put(`src/sections/tractors/sentinelles/fitxes/sentinella_${name}.md`, '# Text runtime immutable');
  let r = f.run([]); assert.equal(r.status, 0, r.stderr); assert.equal(r.data.documents, 2);
  f.put('src/sections/tractors/sentinelles/explicacio.md', '# Nota pròpia sense YAML'); r = f.run([]);
  assert.equal(r.status, 1); assert.ok(r.data.fallades.F1.some(x => x.n.endsWith('/explicacio.md')));
  f.put('src/sections/tractors/sentinelles/fitxes/nota_propia.md', '# No és una fitxa declarada'); r = f.run([]);
  assert.ok(r.data.fallades.F1.some(x => x.n.endsWith('/nota_propia.md')));
});
test('F9 catàleg extern verifica existència i caixa; no és node ni relaxa ambigüitat', t => {
  const f = fixture(t), external = fs.mkdtempSync(path.join(os.tmpdir(), 'r3245-external-')); t.after(() => fs.rmSync(external, { recursive: true, force: true }));
  const rel = '_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md'; fs.mkdirSync(path.dirname(path.join(external, rel)), { recursive: true }); fs.writeFileSync(path.join(external, rel), 'No s’ha de llegir el cos');
  f.put('docs/a.md', note('A', '03_llibre_mestre_tasques_i_idees')); f.put('targets.json', JSON.stringify({ version: 1, root: external, targets: [rel] }));
  let r = f.run([]); assert.equal(r.status, 1);
  r = f.run([`--cataleg-extern=${path.join(f.root, 'targets.json')}`]); assert.equal(r.status, 0, r.stderr); assert.equal(r.data.documents, 2);
  f.put('docs/a.md', note('A', '03_Llibre_mestre_tasques_i_idees')); r = f.run([`--cataleg-extern=${path.join(f.root, 'targets.json')}`]); assert.equal(r.status, 1);
  f.put('targets.json', JSON.stringify({ version: 1, root: external, targets: [rel.replace('03_', 'absent_')] })); r = f.run([`--cataleg-extern=${path.join(f.root, 'targets.json')}`]); assert.equal(r.status, 2);
});
