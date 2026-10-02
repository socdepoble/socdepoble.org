import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { construeixManifest, verificaEnllacos } from '../tooling/wiki/compile-wiki-to-app.mjs';
import { buildSlugIndex } from '../tooling/wiki/core/build_slug_index.mjs';
import { buildIndex } from '../tooling/wiki/core/build_rag_index.mjs';
import { publicMetadata, publicSeoRoute } from '../tooling/wiki/lib/publication-policy.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-public-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (rel, content) => {
    const file = path.join(root, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
    return file;
  };
  return { root, write };
}
const doc = (metadata = '', body = 'Informació comuna del poble') => `---\ntype: document\n${metadata}---\n${body}`;

test('manifest, RAG i slugs compartixen frontera pública i metadata canònica', async (t) => {
  const { root, write } = fixture(t);
  write('_wiki_de_poble/00_index.md', doc());
  write('_wiki_de_poble/01_ser/legacy.md', '# Sense frontmatter\nLlegat públic');
  write('_wiki_de_poble/02_saber/public.md', doc('visibility: public\ntitle: Títol del poble\nslug: titol-canonic\nid: identitat-canònica\n'));
  write('_wiki_de_poble/03_actuar/private.md', doc('visibility: private\n', 'secretprivat'));
  write('_wiki_de_poble/03_actuar/unknown.md', doc('visibility: internal\n', 'secretintern'));
  write('_wiki_de_poble/03_actuar/archived.md', doc('status: arxivat\n', 'secretarxivat'));
  write('_wiki_de_poble/03_actuar/quarantined.md', doc('status: quarantena\n', 'secretquarantena'));
  write('_wiki_de_poble/03_actuar/private.json', JSON.stringify({ visibility: 'private', secret: 'secretjson' }));
  write('_wiki_de_poble/03_actuar/public-json.json', JSON.stringify({ visibility: 'public', title: 'Públic JSON' }));
  for (const rel of ['.agents/private.md', 'README.md', '_wiki_de_poble/04_escriptori/private.md',
    '_wiki_de_poble/90_arxiu_historic/private.md', '_wiki_de_poble/10_actes/private.md',
    '_wiki_de_poble/01_ser/.agents/private.md', '_wiki_de_poble/02_saber/04_escriptori/private.md']) write(rel, doc('', 'secretzona'));
  const manifest = construeixManifest(root);
  const slugs = await buildSlugIndex(root);
  const rag = await buildIndex(root);
  assert.deepEqual(manifest.items.map((item) => item.id).sort(), ['00_index', 'legacy', 'public', 'public-json']);
  assert.equal(slugs.docs.length, 3);
  assert.equal(rag.docCount, 3);
  assert.deepEqual(slugs.docs.map((item) => item.path).sort(), rag.docs.map((item) => item.path).sort());
  assert.equal(slugs.docs.find((item) => item.slug === 'titol-canonic').id, 'identitat-canònica');
  assert.equal(slugs.docs.find((item) => item.slug === 'titol-canonic').title, 'Títol del poble');
  assert.doesNotMatch(JSON.stringify({ manifest: manifest.items, slugs, rag }), /secretprivat|secretintern|secretarxivat|secretquarantena|secretjson|secretzona/);
});

test('cap exportador seguix symlinks ni accepta files fora de la política', async (t) => {
  const { root, write } = fixture(t);
  const good = write('_wiki_de_poble/01_ser/public.md', doc('', 'normalpublic'));
  const privateFile = write('_wiki_de_poble/01_ser/private.md', doc('visibility: private\n', 'secretprivat'));
  const outside = write('outside/secret.md', doc('', 'secretexterior'));
  const desk = write('_wiki_de_poble/04_escriptori/secret.md', doc('', 'secretescriptori'));
  const linkedFile = path.join(root, '_wiki_de_poble/01_ser/link.md');
  fs.symlinkSync(outside, linkedFile);
  fs.symlinkSync(path.dirname(outside), path.join(root, '_wiki_de_poble/01_ser/linked-directory'));
  const privateJson = write('_wiki_de_poble/01_ser/private.json', JSON.stringify({ visibility: 'private', secret: 'secretjson' }));
  const files = [good, privateFile, privateJson, outside, desk, linkedFile, path.join(root, '_wiki_de_poble/01_ser/linked-directory/secret.md')];
  assert.deepEqual(construeixManifest(root).items.map((item) => item.id), ['public']);
  for (const result of [await buildIndex(root), await buildSlugIndex(root), await buildIndex(root, { files }), await buildSlugIndex(root, { files })]) {
    assert.equal(result.docs.length, 1);
    assert.equal(result.docs[0].path, '_wiki_de_poble/01_ser/public.md');
    assert.doesNotMatch(JSON.stringify(result), /secret/);
  }
});

test('un symlink a l’arrel Wiki no convertix un directori extern en públic', async (t) => {
  const { root, write } = fixture(t);
  write('external/01_ser/secret.md', doc());
  fs.symlinkSync(path.join(root, 'external'), path.join(root, '_wiki_de_poble'));
  assert.equal(construeixManifest(root).items.length, 0);
  assert.equal((await buildSlugIndex(root)).docs.length, 0);
  assert.equal((await buildIndex(root)).docCount, 0);
});

test('frontmatter ambigu mai es publica, tampoc si l’últim visibility diu public', async (t) => {
  const { root, write } = fixture(t);
  write('_wiki_de_poble/01_ser/duplicate.md', doc('visibility: private\nvisibility: public\n', 'secretduplicat'));
  write('_wiki_de_poble/01_ser/open.md', '---\nvisibility: private\nsecretobert');
  assert.equal(construeixManifest(root).items.length, 0);
  for (const result of [await buildSlugIndex(root), await buildIndex(root)]) {
    assert.equal(result.docs.length, 0);
    assert.equal(result.malformedCount, 2);
  }
});

test('SEO no indexa seccions privades ni detalls marcats privats o arxivats', () => {
  assert.equal(publicMetadata({}), true, 'compatibilitat legacy documentada');
  for (const visibility of ['private', 'internal', '', null, ['public']]) assert.equal(publicMetadata({ visibility }), false);
  for (const route of ['/notes', 'notes/nota', '/xat/fil', 'chat/fil', '/perfil?tab=compte', '/connectar', '/gestoria', '/gestoria/factures?any=2026', '/tractors', '/tractors/aprovacions#actual']) assert.equal(publicSeoRoute(route), false, route);
  assert.equal(publicSeoRoute('/mercat/producte'), true);
  assert.equal(publicSeoRoute('/mercat/producte', { visibility: 'private' }), false);
  assert.equal(publicSeoRoute('/mercat/producte', { status: 'arxivat' }), false);
});


test('CLI SEO exclou seeds privats i verifica la política encara que el recompte no canvie', (t) => {
  const { root, write } = fixture(t);
  const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  for (const rel of ['tooling/gates/build-seo-manifest.mjs', 'tooling/lib/arrel.mjs', 'tooling/wiki/lib/publication-policy.mjs']) {
    write(rel, fs.readFileSync(path.join(repo, rel), 'utf8'));
  }
  fs.symlinkSync(path.join(repo, 'node_modules'), path.join(root, 'node_modules'));
  write('.agents/AGENTS.md', '# Fixture');
  write('package.json', '{"type":"module"}');
  const sections = ['notes', 'xat', 'gestoria', 'tractors', 'mercat', ...Array.from({ length: 12 }, (_, i) => `public${i}`)];
  write('src/config/sections.js', `export const SECTIONS = [${sections.map(id => `{ id: '${id}', path: '/${id}' }`).join(',')}];`);
  write('src/sections/mercat/marketSeed.js', `export const MOCK_MARKET_ITEMS = [
    { id: 'public', title: 'Public' },
    { id: 'private', title: 'Private', visibility: 'private' },
    { id: 'archive', title: 'Archive', status: 'arxivat' }
  ];`);
  const run = (...args) => spawnSync(process.execPath, ['tooling/gates/build-seo-manifest.mjs', ...args], {
    cwd: root, encoding: 'utf8', env: { ...process.env, SDP_ARREL: root },
  });
  const build = run('--escriu');
  assert.equal(build.status, 0, build.stderr);
  const out = path.join(root, 'wordpress-plugin/dist/seo-routes.json');
  const manifest = JSON.parse(fs.readFileSync(out, 'utf8'));
  assert.equal(manifest.routes.notes.index, false);
  assert.equal(manifest.routes.xat.index, false);
  assert.equal(manifest.routes.gestoria.index, false);
  assert.equal(manifest.routes.tractors.index, false);
  assert.equal(manifest.routes['mercat/public'].index, true);
  assert.equal(manifest.routes['mercat/private'], undefined);
  assert.equal(manifest.routes['mercat/archive'], undefined);
  assert.equal(run('--verifica').status, 0);
  manifest.routes.notes.index = true;
  fs.writeFileSync(out, JSON.stringify(manifest));
  assert.equal(run('--verifica').status, 1, 'mateix recompte però privacitat divergent ha de fallar');
});


test('la validació reconeix destins exclosos sense llegir cossos ni ampliar el manifest públic', (t) => {
  const { root, write } = fixture(t);
  write('_wiki_de_poble/00_index.md', doc('', '[[privat]] [[acta]] [[escriptori]] [[AGENTS]] [[policy_SKILL]] [[historic]]'));
  write('_wiki_de_poble/01_ser/privat.md', doc('visibility: private\n', 'secretprivat'));
  write('_wiki_de_poble/10_actes/acta.md', 'secretacta');
  write('_wiki_de_poble/04_escriptori/escriptori.md', 'secretescriptori');
  write('_wiki_de_poble/90_arxiu_historic/historic.md', 'secrethistoric');
  write('AGENTS.md', 'secretgovern');
  write('.agents/skills/policy/SKILL.md', 'secretskill');
  const manifest = construeixManifest(root);
  assert.deepEqual(manifest.items.map(item => item.id), ['00_index']);
  const publicBefore = JSON.stringify({ categories: manifest.categories, items: manifest.items });
  const read = t.mock.method(fs, 'readFileSync', () => { throw new Error('El validador no pot llegir contingut'); });
  const result = verificaEnllacos(root, manifest, { log: { log() {}, error() {} } });
  assert.deepEqual(result.trencats, []);
  assert.equal(result.capArxiu, 1);
  assert.equal(result.capNoPublics, 5);
  assert.equal(read.mock.callCount(), 0);
  assert.equal(JSON.stringify({ categories: manifest.categories, items: manifest.items }), publicBefore);
  assert.doesNotMatch(publicBefore, /secretprivat|secretacta|secretescriptori|secrethistoric|secretgovern|secretskill/);
});

test('un destí inexistent o un symlink no queda validat per l’índex físic', (t) => {
  const { root, write } = fixture(t);
  write('_wiki_de_poble/00_index.md', doc('', '[[inexistent]] [[link]] [[external]]'));
  const outside = write('outside/external.md', 'No és part del graf documental');
  fs.symlinkSync(outside, path.join(root, '_wiki_de_poble/link.md'));
  fs.symlinkSync(path.dirname(outside), path.join(root, '_wiki_de_poble/linked-dir'));
  const result = verificaEnllacos(root, construeixManifest(root), { log: { log() {}, error() {} } });
  assert.deepEqual(result.trencats.map(link => link.target), ['inexistent', 'link', 'external']);
});

test('CLI --check --strict accepta privat existent i rebutja desaparegut sense escriure outputs', (t) => {
  const { root, write } = fixture(t);
  const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  for (const rel of ['tooling/wiki/compile-wiki-to-app.mjs', 'tooling/wiki/lib/publication-policy.mjs',
    'tooling/wiki/lib/frontmatter.mjs', 'tooling/lib/arrel.mjs', 'tooling/scripts/canonada.mjs']) {
    write(rel, fs.readFileSync(path.join(repo, rel), 'utf8'));
  }
  fs.symlinkSync(path.join(repo, 'node_modules'), path.join(root, 'node_modules'));
  write('package.json', '{"type":"module"}');
  write('_wiki_de_poble/00_index.md', doc('', '[[privat]]'));
  const privateFile = write('_wiki_de_poble/04_escriptori/privat.md', 'No llegir ni exportar');
  const run = () => spawnSync(process.execPath, ['tooling/wiki/compile-wiki-to-app.mjs', '--check', '--strict'], { cwd: root, encoding: 'utf8' });
  const valid = run();
  assert.equal(valid.status, 0, valid.stderr);
  fs.unlinkSync(privateFile);
  const invalid = run();
  assert.equal(invalid.status, 1, invalid.stderr);
  assert.match(invalid.stderr, /privat.*no existeix/);
  assert.equal(fs.existsSync(path.join(root, 'src/data/wikiManifest.js')), false);
});
