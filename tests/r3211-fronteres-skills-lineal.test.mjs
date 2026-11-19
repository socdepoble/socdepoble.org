import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { auditaSkill, auditaSkills, main, LIMITS_MOTORS } from '../tooling/brain/fronteres-skills.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-r3211-skills-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const escriu = (rel, text) => {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), text);
  };
  for (const f of ['PROFILE.md', 'AGENTS.md', 'BASELINE.md']) escriu(`.agents/${f}`, '# Fixture\n');
  escriu('.agents/consell.json', '{"membres":[]}\n');
  escriu('src/css/tokens.css', ':root {}\n');
  escriu('package.json', '{"scripts":{}}\n');
  escriu('docs/llig.md', '# Llegir\n'); escriu('docs/escriu.md', '# Escriure\n');
  const skill = body => ({ id: 'sdp-prova', sha256: 'fixture', text: [
    '---', 'name: sdp-prova', 'type: skill', 'status: actiu', 'description: Prova de límits estàtics de motors.',
    'triggers_on:', '  - prova', 'contracte.llig:', '  - docs/llig.md', 'contracte.escriu:', '  - docs/escriu.md', '---', body
  ].join('\n') });
  return { root, escriu, skill, audita: body => auditaSkill(skill(body), { arrel: root, versionats: new Set() }) };
}
const detalls = r => r.violacions.map(v => `${v.regla} ${v.detall}`);
const kib64 = s => s.repeat(Math.ceil(65536 / s.length)).slice(0, 65536);

test('R32.11 P1-30: límits estàtics immutables, sense rellotge ni deute acceptat', () => {
  assert.ok(Object.isFrozen(LIMITS_MOTORS));
  for (const n of Object.values(LIMITS_MOTORS)) assert.ok(Number.isSafeInteger(n) && n > 0);
});

test('R32.11 P1-30: 64KiB de sufixos superposats falla explícit, estable i sense exposar el cos', t => {
  const { audita } = fixture(t);
  const body = kib64('node ');
  const a = audita(body), b = audita(body);
  assert.deepEqual(a, b);
  assert.deepEqual(a.motors, []);
  assert.deepEqual(detalls(a), ['F2 MOTORS_WORK_LIMIT: anàlisi no completada dins del pressupost lineal']);
  assert.ok(a.violacions.every(v => v.linies.length === 1));
  assert.ok(JSON.stringify(a.violacions).length < 500);
});

test('R32.11 P1-30: la porta completa mai acredita una anàlisi limitada', t => {
  const { root, escriu, skill } = fixture(t);
  escriu('.agents/skills/sdp-prova/SKILL.md', skill(kib64('node ')).text);
  const r = auditaSkills(root);
  assert.equal(r.valid, false); assert.equal(r.enDeute.length, 0); assert.equal(r.noves.length, 1);
  assert.match(r.noves[0].detall, /^MOTORS_WORK_LIMIT:/);
  const linies = [];
  assert.equal(main([`--arrel=${root}`, '--json'], { deute: [], sortida: { log: s => linies.push(s), error: s => linies.push(s) } }), 1);
  assert.equal(JSON.parse(linies.join('\n')).valid, false);
});

test('R32.11 P1-30: permisos i ordres fora de contracte continuen caient', t => {
  const { audita } = fixture(t);
  const r = audita('node tooling/fora.mjs\n\n`find docs -delete`\n\n`cat src/fora.md`');
  assert.ok(detalls(r).includes('F2 motor absent tooling/fora.mjs'));
  assert.ok(detalls(r).includes('F2 motor executat al cos sense declarar a motors: tooling/fora.mjs'));
  assert.ok(r.violacions.some(v => v.regla === 'F3'));
  assert.ok(r.violacions.some(v => v.regla === 'F5'));
  const limitat = audita(kib64('node ') + '\n\n`find docs -delete`');
  assert.ok(limitat.violacions.some(v => v.regla === 'F3'), 'el límit no omet altres regles ni línies');
});

test('R32.11 P1-30: una ruta repetida conserva la mateixa empremta i les línies', t => {
  const { audita } = fixture(t);
  const r = audita('node --test tooling/prova.mjs tooling/prova.mjs\nnode tooling/prova.mjs');
  assert.deepEqual(r.motors, ['tooling/prova.mjs']);
  assert.equal(r.violacions.length, 2);
  assert.deepEqual(r.violacions.map(v => v.linies), [[13, 14], [13]]);
});

test('R32.11 P1-30: un excés de resultats o de longitud és diagnòstic incomplet, sense fabricar rutes', t => {
  const { audita } = fixture(t);
  const molts = audita('node --test ' + Array.from({ length: LIMITS_MOTORS.sortides + 1 }, (_, i) => `tooling/a${i}.mjs`).join(' '));
  assert.ok(detalls(molts).some(d => d.startsWith('F2 MOTORS_OUTPUT_LIMIT:')));
  assert.equal(molts.motors.length, LIMITS_MOTORS.sortides);
  const llarg = audita('node tooling/' + 'a'.repeat(65536) + '.mjs');
  assert.deepEqual(llarg.motors, []);
  assert.deepEqual(detalls(llarg), ['F2 MOTORS_PATH_LIMIT: anàlisi no completada dins del pressupost de longitud']);
  assert.ok(JSON.stringify(llarg.violacions).length < 500);
});

test('R32.11 P1-30: vectors hostils de 64KiB en menys de25ms observats', t => {
  const { audita } = fixture(t);
  const vectors = [kib64('node '), kib64('node "'), kib64('node --test '),
    'node tooling/' + 'a'.repeat(65536 - 13), 'node --test ' + 'canary*.mjs '.repeat(5461).slice(0, 65524)];
  for (const body of vectors) {
    assert.ok(Buffer.byteLength(body) >= 50 * 1024);
    for (let i = 0; i < 3; i++) audita(body);
    const mesures = [];
    for (let i = 0; i < 5; i++) { const start = performance.now(); const r = audita(body); mesures.push(performance.now() - start); assert.ok(r.violacions.some(v => v.regla === 'F2')); }
    mesures.sort((a, b) => a - b);
    assert.ok(mesures[2] < 25, `mediana local ${mesures[2]}ms; no és una garantia universal de rellotge`);
  }
});
