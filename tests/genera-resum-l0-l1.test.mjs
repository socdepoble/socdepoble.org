import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const moduleUrl = new URL('../tooling/brain/genera-resum-l0-l1.mjs', import.meta.url);
const sha = text => createHash('sha256').update(text).digest('hex');
const note = (body, extra = '') => `---\ntype: document\nstatus: actiu\ndescription: Descripció acreditada del document.\n${extra}---\n${body}`;
const api = () => import(moduleUrl);
const sandbox = t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'r3245-index-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, '.agents')); fs.writeFileSync(path.join(root, '.agents/AGENTS.md'), '# Marcador de prova');
  return root;
};
const put = (root, rel, text) => {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), text);
};

test('L0 és una línia per document viu, determinista i privat; Master és elegible', async () => {
  const { generaResumL0L1 } = await api();
  const master = '_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md';
  const input = new Map([[master, note('# Mestre\n\n## Decisions\n- No activar el servei.\n', 'visibility: private\n')],
    ['_wiki_de_poble/02_saber/z.md', note('# Títol | amb tab\t\n')],
    ['_wiki_de_poble/02_saber/a.md', note('# Primer\n')]]);
  const before = [...input];
  const a = generaResumL0L1(input), b = generaResumL0L1(new Map([...input].reverse()));
  assert.deepEqual(a, b); assert.deepEqual([...input], before);
  assert.equal(a.visibility, 'private'); assert.equal(a.l0.length, 3);
  assert.ok(a.l0.every(line => !/[\n\r\t\u2028\u2029\u0000]/.test(line)));
  assert.deepEqual(a.l1.map(x => x.path), [...input.keys()].sort());
  assert.equal(a.l1.find(x => x.path === master).l2.sha256, sha(input.get(master)));
  assert.ok(a.l1.every(x => !Object.hasOwn(x.l2, 'text')));
});

test('L1 només extrau encapçalaments i decisions declarades, conserva negacions i línies', async () => {
  const { generaResumL0L1 } = await api();
  const body = '# Títol\n\n<!--\n## Fals\n- Aprovat fals\n-->\n```md\n## Decisions\n- No executar esta mostra\n```\n## Decisions\n- No publicar dades.\n- Aprovat: mantindre el flag apagat.\n\n### Detall\nEncara no.\n## Propostes de decisions\n- Activar-ho algun dia.\n';
  const text = note(body), result = generaResumL0L1(new Map([['_wiki_de_poble/02_saber/a.md', text]])).l1[0];
  assert.deepEqual(result.headings.map(h => h.text), ['Títol', 'Decisions', 'Detall', 'Propostes de decisions']);
  assert.deepEqual(result.decisions.map(d => d.text), ['- No publicar dades.', '- Aprovat: mantindre el flag apagat.', 'Encara no.']);
  for (const h of result.headings) assert.ok(text.split('\n')[h.line - 1].includes(h.text));
  for (const d of result.decisions) assert.equal(text.split('\n')[d.line - 1], d.text);
});

test('L2 original immutable amb BOM/CRLF, multilínia, Unicode i sense newline final', async () => {
  const { generaResumL0L1 } = await api();
  const text = '\uFEFF---\r\ntype: document\r\nstatus: actiu\r\ndescription: >\r\n  Dos línies\r\n  acreditades.\r\n---\r\n# Àvia\r\n\r\n## Acords\r\nNo substituir l’original.';
  const texts = new Map([['_wiki_de_poble/02_saber/a.md', text]]);
  const result = generaResumL0L1(texts);
  assert.equal(texts.values().next().value, text);
  assert.equal(result.l1[0].l2.sha256, sha(text));
  assert.equal(result.l1[0].headings[0].line, 8);
  assert.equal(result.l1[0].decisions[0].text, 'No substituir l’original.');
});

test('història, evidència, runtime i generats no són documents vius; privat sí', async () => {
  const { generaResumL0L1 } = await api();
  const input = new Map([
    ['_wiki_de_poble/90_arxiu_historic/secret.md', 'NO LLEGIR'],
    ['.agents/runtime/evidence.md', 'NO LLEGIR'],
    ['src/sections/tractors/sentinelles/fitxes/a.md', 'NO LLEGIR'],
    ['public/md/a.md', 'NO LLEGIR'],
    ['_wiki_de_poble/02_saber/arxivat.md', note('# Antic', 'status: arxivat\n')],
    ['_wiki_de_poble/02_saber/generat.md', note('# Derivat', 'status: generat\n')],
    ['_wiki_de_poble/02_saber/privat.md', note('# Privat', 'visibility: private\n')],
  ]);
  // Sense claus duplicades de YAML en les fonts que s'han de parsejar.
  for (const [key, text] of input) if (/arxivat|generat/.test(key)) input.set(key, text.replace('status: actiu\n', ''));
  assert.deepEqual(generaResumL0L1(input).l1.map(x => x.path), ['_wiki_de_poble/02_saber/privat.md']);
  assert.throws(() => generaResumL0L1(new Map([['../secret.md', '# secret']])), /ruta/i);
});

test('ESTAT només usa el bloc operatiu i LEDGER no adopta rebuts com a decisions', async () => {
  const { generaResumL0L1 } = await api();
  const texts = new Map([['.agents/LEDGER.md', '# Rebuts\n## Decisions\n- Secret antic\n## Vincles\n- [[00_index]]\n']]);
  const result = generaResumL0L1(texts);
  assert.deepEqual(result.l1[0].decisions, []);
  assert.deepEqual(result.l1[0].headings.map(x => x.text), ['Vincles']);
});

test('CLI privat, mode 0600, check sense escriptures i cap font L2 alterada', async t => {
  await api(); const root = sandbox(t), rel = '_wiki_de_poble/02_saber/a.md';
  const text = note('# Prova\n## Decisions\n- No publicar.\n'); put(root, rel, text);
  const out = path.join(root, 'private-index.json');
  const run = flags => spawnSync(process.execPath, [fileURLToPath(moduleUrl), '--arrel', root, '--out', out, ...flags], { encoding: 'utf8', timeout: 10000 });
  let r = run([]); assert.equal(r.status, 0, r.stderr); const before = fs.readFileSync(out);
  assert.equal(fs.statSync(out).mode & 0o777, 0o600); assert.equal(fs.readFileSync(path.join(root, rel), 'utf8'), text);
  fs.utimesSync(path.join(root, rel), 1, 1);
  r = run(['--check']); assert.equal(r.status, 0, r.stderr); assert.deepEqual(fs.readFileSync(out), before);
  put(root, rel, text + '\nCanvi'); r = run(['--check']); assert.notEqual(r.status, 0); assert.deepEqual(fs.readFileSync(out), before);
});

test('CLI refusa destins públics o documents font i symlinks sense filtrar contingut', async t => {
  await api(); const root = sandbox(t); put(root, '_wiki_de_poble/02_saber/a.md', note('# Original'));
  const cli = flags => spawnSync(process.execPath, [fileURLToPath(moduleUrl), '--arrel', root, ...flags], { encoding: 'utf8', timeout: 10000 });
  for (const out of ['public/index.json', 'src/index.json', 'tooling/index.json', '_wiki_de_poble/index.json', '.agents/index.json']) {
    const r = cli(['--out', path.join(root, out)]); assert.notEqual(r.status, 0); assert.equal(fs.existsSync(path.join(root, out)), false);
  }
  const secret = path.join(root, 'secret.md'); fs.writeFileSync(secret, 'NO FILTRAR ESTE SECRET');
  fs.symlinkSync(secret, path.join(root, '_wiki_de_poble/02_saber/link.md'));
  const r = cli(['--out', path.join(root, 'index.json')]); assert.notEqual(r.status, 0); assert.ok(!r.stderr.includes('NO FILTRAR'));
});

test('CLI invocat per àlies real executa el treball i no sobreescriu un fitxer alié', async t => {
  await api(); const root = sandbox(t); put(root, '_wiki_de_poble/02_saber/a.md', note('# Font'));
  const alias = path.join(root, 'generator-alias.mjs'), out = path.join(root, 'result.json');
  fs.symlinkSync(fileURLToPath(moduleUrl), alias);
  const run = () => spawnSync(process.execPath, [alias, '--arrel', root, '--out', out], { encoding: 'utf8', timeout: 10000 });
  let r = run(); assert.equal(r.status, 0, r.stderr); assert.equal(JSON.parse(fs.readFileSync(out, 'utf8')).visibility, 'private');
  fs.writeFileSync(out, 'Original alié'); r = run(); assert.notEqual(r.status, 0); assert.equal(fs.readFileSync(out, 'utf8'), 'Original alié');
});

test('canvi concurrent de font aborta abans de tornar un índex coherent', async t => {
  const { lligDocuments, generaResumL0L1 } = await api(); const root = sandbox(t);
  const rel = '_wiki_de_poble/02_saber/a.md'; put(root, rel, note('# Original'));
  assert.throws(() => lligDocuments(root, { abansDeVerificar: () => put(root, rel, note('# Modificat')) }), /canvi/i);
  assert.equal(generaResumL0L1(new Map([[rel, note('# Estable')]])).l0.length, 1);
});
