import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const tractor = path.join(here, 'tractor-psicopatia.mjs');
const configSource = path.resolve(here, '../../requirements/online-first.json');

async function repo(files) {
  const root = await mkdtemp(path.join(tmpdir(), 'tractor-psicopatia-'));
  await mkdir(path.join(root, 'src'), { recursive: true });
  await mkdir(path.join(root, '_wiki_de_poble'), { recursive: true });
  await mkdir(path.join(root, 'requirements'), { recursive: true });
  await writeFile(path.join(root, 'requirements/online-first.json'), await (await import('node:fs/promises')).readFile(configSource));
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(root, rel);
    await mkdir(path.dirname(abs), { recursive: true });
    await writeFile(abs, content);
  }
  return root;
}

function run(root) {
  return spawnSync(process.execPath, [tractor, '--root', root], {
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1' }
  });
}

test('passa amb arquitectura vigent', async (t) => {
  const root = await repo({ 'src/architecture.md': 'Arquitectura Online-First estricta.\n' });
  t.after(() => rm(root, { recursive: true, force: true }));
  const result = run(root);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Coherència verificada/);
});

test('bloqueja una contradicció activa amb exit 1', async (t) => {
  const root = await repo({ '_wiki_de_poble/norma.md': 'El sistema és Offline-First.\n' });
  t.after(() => rm(root, { recursive: true, force: true }));
  const result = run(root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /_wiki_de_poble\/norma\.md:1:15/);
  assert.match(result.stderr, /BUILD BLOQUEJAT/);
});

test('ignora còpies .abans-* i .orig', async (t) => {
  const root = await repo({
    'src/architecture.md.abans-260830': 'Offline-First i iPad A10.\n',
    '_wiki_de_poble/norma.md.orig': 'Local-First.\n'
  });
  t.after(() => rm(root, { recursive: true, force: true }));
  assert.equal(run(root).status, 0);
});

test('ignora documents marcats com a històrics', async (t) => {
  const root = await repo({
    '_wiki_de_poble/memoria.md': '---\nstatus: historical\n---\nOffline-First i iPad A10.\n'
  });
  t.after(() => rm(root, { recursive: true, force: true }));
  assert.equal(run(root).status, 0);
});

test('admet una excepció explícita amb id i motiu', async (t) => {
  const root = await repo({
    'src/architecture.md': '<!-- tractor-psicopatia: allow ZOMBIE-OFFLINE-FIRST -- context històric -->\nOffline-First fou retirat.\n'
  });
  t.after(() => rm(root, { recursive: true, force: true }));
  assert.equal(run(root).status, 0);
});

test('falla tancat si falta un target obligatori', async (t) => {
  const root = await repo({ /* empty */ });
  await rm(path.join(root, '_wiki_de_poble'), { recursive: true, force: true });
  t.after(() => rm(root, { recursive: true, force: true }));
  const result = run(root);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /AUDITORIA INCOMPLETA/);
});
import { pathToFileURL } from 'url';
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) { process.exitCode = 0; }
