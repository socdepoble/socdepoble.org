import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { documentCorpus, isVerifiedPublicApiResource } from '../tooling/lib/document-corpus.mjs';
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const RECURS = 'public/api-municipal/lectura.md';
const HASH = text => `sha256:${createHash('sha256').update(text).digest('hex')}`;
const doc = '# Recurs API portable, sense wikilinks ni metadades de la Wiki.\n';
function fixture(t) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-api-corpus-')));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const put = (rel, text) => { fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true }); fs.writeFileSync(path.join(root, rel), text); };
  put(RECURS, doc);
  const manifest = { $schema: 'https://datapackage.org/profiles/2.0/datapackage.json', name: 'municipal-public', resources: [{ name: 'lectura', path: 'lectura.md', mediatype: 'text/markdown', format: 'md', encoding: 'utf-8', bytes: Buffer.byteLength(doc), hash: HASH(doc) }] };
  const desa = () => put('public/api-municipal/manifest.json', JSON.stringify(manifest)); desa();
  return { root, put, manifest, desa };
}
test('contracte Data Package v2 verificat: només el recurs API queda fora del corpus autoral', t => {
  const { root, put } = fixture(t); put('public/api-municipal/nota-no-declarada.md', '# Nota ordinària');
  put('public/altre/lectura.md', doc); put('_wiki_de_poble/lectura.md', doc);
  assert.equal(isVerifiedPublicApiResource(root, RECURS), true);
  assert.equal(isVerifiedPublicApiResource(root, 'public/api-municipal/nota-no-declarada.md'), false);
  assert.equal(isVerifiedPublicApiResource(root, 'public/altre/lectura.md'), false);
  const corpus = documentCorpus(root, ['.']); assert.equal(corpus.includes(RECURS), false);
  assert.equal(corpus.includes('public/api-municipal/nota-no-declarada.md'), true);
  assert.equal(corpus.includes('_wiki_de_poble/lectura.md'), true);
});
test('hash divergent, bytes falsos, esquema desconegut, recurs absent o manifest manipulat no eximixen', async t => {
  for (const [nom, manipula] of [
    ['hash', ({ manifest }) => { manifest.resources[0].hash = 'sha256:' + '0'.repeat(64); }],
    ['bytes', ({ manifest }) => { manifest.resources[0].bytes += 1; }],
    ['schema', ({ manifest }) => { manifest.$schema = 'https://desconegut.example/schema'; }],
    ['desconegut', ({ manifest }) => { manifest.resources = []; }],
    ['mime', ({ manifest }) => { manifest.resources[0].mediatype = 'text/plain'; }],
    ['duplicat', ({ manifest }) => { manifest.resources.push({ ...manifest.resources[0] }); }],
    ['inline-i-path', ({ manifest }) => { manifest.resources[0].data = 'dades inline incompatibles amb path'; }],
    ['schema-recurs', ({ manifest }) => { manifest.resources[0].$schema = 'https://desconegut.example/resource'; }],
    ['path', ({ manifest }) => { manifest.resources[0].path = '../lectura.md'; }],
    ['altres-recursos', ({ manifest }) => { manifest.resources.push({ ...manifest.resources[0], name: 'absent', path: 'absent.md' }); }],
    ['contingut', ({ put }) => { put(RECURS, 'CONTINGUT ALTERAT'); }],
  ]) await t.test(nom, t => {
    const f = fixture(t); manipula(f); f.desa();
    assert.equal(isVerifiedPublicApiResource(f.root, RECURS), false);
    assert.equal(documentCorpus(f.root, ['.']).includes(RECURS), true);
  });
});
test('un symlink, manifest no JSON o .md fora de public no s’adopten com a artefactes', t => {
  const { root, put } = fixture(t);
  put('_wiki_de_poble/manifest.json', fs.readFileSync(path.join(root, 'public/api-municipal/manifest.json')));
  put('_wiki_de_poble/lectura.md', doc);
  assert.equal(isVerifiedPublicApiResource(root, '_wiki_de_poble/lectura.md'), false);
  fs.unlinkSync(path.join(root, RECURS)); fs.symlinkSync(path.join(root, '_wiki_de_poble/lectura.md'), path.join(root, RECURS));
  assert.equal(isVerifiedPublicApiResource(root, RECURS), false);
  put('public/api-municipal/manifest.json', '{'); assert.equal(isVerifiedPublicApiResource(root, RECURS), false);
});
test('tractor real: artefacte vàlid no rep F1/F9; fitxer alterat torna a ser document i falla', t => {
  const f = fixture(t);
  const wiki = (titol, vincle) => `---\ntype: document\nstatus: actiu\ndescription: Document de prova per a la frontera d’artefactes públics verificats.\n---\n# ${titol}\n\n## Vincles\n- [[${vincle}]]\n`;
  f.put('.agents/AGENTS.md', wiki('BIOS', 'index'));
  f.put('_wiki_de_poble/index.md', wiki('Índex', 'a'));
  f.put('_wiki_de_poble/a.md', wiki('A', 'index'));
  f.put('tooling/wiki/schema.json', fs.readFileSync(path.join(ROOT, 'tooling/wiki/schema.json')));
  const executa = () => {
    const r = spawnSync(process.execPath, [path.join(ROOT, 'tooling/wiki/tractor-frontmatter.mjs'), `--arrel=${f.root}`, '--json'], { cwd: f.root, encoding: 'utf8', env: Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('GIT_'))) });
    assert.ok(r.stdout.startsWith('{'), r.stderr); return JSON.parse(r.stdout);
  };
  const bo = executa(); for (const items of Object.values(bo.fallades)) assert.equal(items.some(x => x.n === RECURS), false);
  f.put(RECURS, doc + 'Alterat sense actualitzar el manifest.\n');
  const mal = executa(); assert.ok(mal.fallades.F1.some(x => x.n === RECURS)); assert.ok(mal.fallades.F9.some(x => x.n === RECURS));
});
