import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { auditCoherence, findDuplicates } from '../contradiction_engine.mjs';

const body = 'El procediment de qualitat conserva les fonts canòniques i comprova els contractes abans de publicar el resultat. Cada verificació conserva la seua evidència i els límits del tall. '.repeat(4);
const md = (text = body, type = 'document') => `---\ntype: ${type}\nstatus: canonic\ndescription: Document de prova per verificar la coherència del sistema documental.\ntags: [govern]\n---\n# Qualitat\n\n${text}\n`;
async function fixture(t, files = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'sdp-t11-fixture-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const write = async (rel, content) => { const file = path.join(root, rel); await fs.mkdir(path.dirname(file), { recursive: true }); await fs.writeFile(file, content); };
  await fs.mkdir(path.join(root, '_wiki_de_poble'), { recursive: true });
  await fs.mkdir(path.join(root, '.agents/skills'), { recursive: true });
  await write('.agents/cervell.json', JSON.stringify({ dimensions: [{ id: 'identitat', ruta: '_wiki_de_poble/01_ser' }] }));
  await write('.agents/protocolledge.json', JSON.stringify({ rutes: [] }));
  for (const [rel, content] of Object.entries(files)) await write(rel, content);
  return { root, wiki: path.join(root, '_wiki_de_poble'), write };
}

test('T11 llig carpetes actuals, skills i rutes; solapament no equival a contradicció', async t => {
  const f = await fixture(t, { '_wiki_de_poble/01_ser/a.md': md(), '_wiki_de_poble/02_saber/b.md': md(), '.agents/skills/prova/SKILL.md': md(body, 'skill') });
  const result = await auditCoherence(f.wiki);
  assert.equal(result.complete, true);
  assert.equal(result.coverage.wikiDocuments, 2);
  assert.equal(result.coverage.skillDocuments, 1);
  assert.equal(result.coverage.comparedDocuments, 3);
  assert.equal(result.overlaps.length, 3);
  assert.ok(result.overlaps.every(match => match.kind === 'lexical-overlap'));
  assert.deepEqual(result.contradictions, []);
});

test('T11 corpus buit queda incomplet', async t => {
  const f = await fixture(t);
  const result = await auditCoherence(f.wiki);
  assert.equal(result.complete, false);
  assert.ok(result.problems.some(problem => problem.code === 'empty-comparison-corpus'));
  await assert.rejects(findDuplicates(f.wiki), /Auditoria incompleta/);
});

test('T11 exclou arxiu, zona humana i laboratori abans de llegir-ne continguts', async t => {
  const f = await fixture(t, { '_wiki_de_poble/01_ser/a.md': md(),
    '_wiki_de_poble/90_arxiu_historic/a.md': 'frontmatter invàlid',
    '_wiki_de_poble/04_escriptori/01_produccio/a.md': 'frontmatter invàlid',
    '_wiki_de_poble/04_escriptori/02_investigacio_ia/a.md': 'frontmatter invàlid' });
  const result = await auditCoherence(f.wiki);
  assert.equal(result.complete, true);
  assert.equal(result.coverage.wikiDocuments, 1);
  assert.deepEqual(result.excluded.map(item => item.reason).sort(), ['historical-archive', 'protected-human-zone', 'protected-research-zone']);
});

test('T11 no seguix symlinks i declara la cobertura incompleta', async t => {
  const f = await fixture(t, { '_wiki_de_poble/01_ser/a.md': md() });
  await fs.symlink('/does-not-exist', path.join(f.wiki, '02_saber'));
  const result = await auditCoherence(f.wiki);
  assert.equal(result.complete, false);
  assert.ok(result.problems.some(problem => problem.code === 'symlink-not-followed'));
  assert.ok(result.excluded.some(item => item.reason === 'symlink-not-followed'));
});

test('T11 treball i actes són evidència censada, sense proposar-ne fusió normativa', async t => {
  const f = await fixture(t, { '_wiki_de_poble/01_ser/a.md': md(), '_wiki_de_poble/04_escriptori/informe.md': md(), '_wiki_de_poble/10_actes/acta.md': md() });
  const result = await auditCoherence(f.wiki);
  assert.equal(result.complete, true);
  assert.equal(result.coverage.readDocuments, 3);
  assert.equal(result.coverage.comparedDocuments, 1);
  assert.deepEqual(result.overlaps, []);
});

test('T11 conserva forma API v2 i jurisdiccions legacy', async t => {
  const f = await fixture(t, { '_wiki_de_poble/00_SER_Brain_Identitat/a.md': md(), '_wiki_de_poble/00_SER_Brain_Identitat/b.md': md() });
  const matches = await findDuplicates(f.wiki);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].a, '00_SER_Brain_Identitat/a.md');
  assert.equal(matches[0].jurA, 'principi');
  assert.equal(matches[0].marcaJurisdiccioDiferent, false);
  assert.equal(matches[0].s, 1);
});

test('T11 conserva errors de frontmatter/schema legacy', async t => {
  const f = await fixture(t, { '_wiki_de_poble/00_SER_Brain_Identitat/a.md': md().replace('type: document', 'type: desconegut') });
  await assert.rejects(findDuplicates(f.wiki), /legacy-schema-invalid/);
});

test('T11 detecta el mateix selector amb plantilles incompatibles', async t => {
  const f = await fixture(t, { '_wiki_de_poble/01_ser/a.md': md(), '_wiki_de_poble/03_actuar/plantilles/a.md': md(), '_wiki_de_poble/03_actuar/plantilles/b.md': md(), '.agents/skills/prova/SKILL.md': md(body, 'skill') });
  const skill = '.agents/skills/prova/SKILL.md';
  await f.write('.agents/protocolledge.json', JSON.stringify({ rutes: [
    { id: 'a', quan: { intencio: 'pla', destinatari: 'local' }, plantilla: '_wiki_de_poble/03_actuar/plantilles/a.md', skill },
    { id: 'b', quan: { destinatari: 'local', intencio: 'pla' }, plantilla: '_wiki_de_poble/03_actuar/plantilles/b.md', skill },
  ] }));
  const result = await auditCoherence(f.wiki);
  assert.equal(result.complete, true);
  assert.equal(result.coverage.protocolRoutes, 2);
  assert.equal(result.contradictions.length, 1);
  assert.equal(result.contradictions[0].kind, 'routing-contract-conflict');
});

test('T11 registra ruta absent i no confon API documentada pendent amb salut', async t => {
  const f = await fixture(t, { '_wiki_de_poble/01_ser/a.md': md() });
  await f.write('.agents/protocolledge.json', JSON.stringify({ rutes: [{ id: 'a', plantilla: '_wiki_de_poble/absent.md', skill: '../extern/SKILL.md' }] }));
  const result = await auditCoherence(f.wiki);
  assert.equal(result.complete, false);
  assert.ok(result.problems.some(problem => problem.code === 'route-target-unavailable'));
  assert.ok(result.problems.some(problem => problem.code === 'route-path-invalid'));
});

test('T11 determinista davant mateix tall, amb exclusions i problemes ordenats', async t => {
  const f = await fixture(t, { '_wiki_de_poble/02_saber/b.md': md(), '_wiki_de_poble/01_ser/a.md': md(), '_wiki_de_poble/04_escriptori/01_produccio/a.md': md() });
  assert.deepEqual(await auditCoherence(f.wiki), await auditCoherence(f.wiki));
});


test('T11 no seguix un directori .agents que siga symlink', async t => {
  const f = await fixture(t, { '_wiki_de_poble/01_ser/a.md': md() });
  const external = await fs.mkdtemp(path.join(os.tmpdir(), 'sdp-t11-external-'));
  t.after(() => fs.rm(external, { recursive: true, force: true }));
  await fs.rm(path.join(f.root, '.agents'), { recursive: true });
  await fs.symlink(external, path.join(f.root, '.agents'));
  const result = await auditCoherence(f.wiki);
  assert.equal(result.complete, false);
  assert.equal(result.coverage.skillDocuments, 0);
  assert.ok(result.problems.some(problem => problem.code === 'project-state-unavailable'));
});


test('T11 CLI JSON retorna 2 davant corpus buit, també amb entrada per symlink', async t => {
  const f = await fixture(t);
  await f.write('.agents/AGENTS.md', '# Marcador de prova\n');
  const launcher = path.join(f.root, 'engine-link.mjs');
  await fs.symlink(fileURLToPath(new URL('../contradiction_engine.mjs', import.meta.url)), launcher);
  const child = spawnSync(process.execPath, [launcher, '--json'], {
    cwd: f.root, env: { ...process.env, SDP_ARREL: f.root }, encoding: 'utf8', timeout: 10000,
  });
  assert.equal(child.error, undefined);
  assert.equal(child.status, 2, child.stderr);
  const result = JSON.parse(child.stdout);
  assert.equal(result.complete, false);
  assert.ok(result.problems.some(problem => problem.code === 'empty-comparison-corpus'));
});

const skillContract = metadata => md(body, 'skill').replace('tags: [govern]', `tags: [govern]\n${metadata}`);
const contractProblems = result => result.problems.filter(p => p.code.startsWith('skill-contract'));

test('T11 contractes de lectura: fitxer, directori i barra final tenen caixa exacta', async t => {
  const f = await fixture(t, { 'data/source.txt': 'source',
    '.agents/skills/prova/SKILL.md': skillContract('contracte.llig:\n  - data/source.txt\n  - data/\ncontracte.escriu:\n  - data/source.txt') });
  const result = await auditCoherence(f.wiki);
  assert.equal(result.complete, true);
  assert.equal(result.coverage.skillsWithReadContract, 1);
  assert.equal(result.coverage.skillsWithWriteContract, 1);
  assert.equal(result.coverage.skillReadReferences, 2);
  assert.equal(result.coverage.skillWriteTargets, 1);
});

test('T11 contracte de lectura absent queda incomplet, no salut sobre metadades', async t => {
  const f = await fixture(t, { '.agents/skills/prova/SKILL.md': skillContract('contracte.llig:\n  - absent.txt') });
  const result = await auditCoherence(f.wiki);
  assert.equal(result.complete, false);
  assert.equal(contractProblems(result).length, 1);
  assert.match(contractProblems(result)[0].detail, /contracte.llig\[0\].*absent.txt.*target-absent/);
});

test('T11 caixa incorrecta és rebutjada també en volums insensibles a caixa', async t => {
  const f = await fixture(t, { 'Data/Source.txt': 'source',
    '.agents/skills/prova/SKILL.md': skillContract('contracte.llig:\n  - Data/source.txt\ncontracte.escriu:\n  - data/future.txt') });
  const result = await auditCoherence(f.wiki);
  assert.equal(result.complete, false);
  assert.equal(contractProblems(result).length, 2);
  assert.ok(contractProblems(result).every(p => p.detail.endsWith('case-mismatch')));
});

test('T11 contracte d’escriptura pot anunciar fitxer i carpeta futurs sense crear-los', async t => {
  const f = await fixture(t, { 'data/source.txt': 'source',
    '.agents/skills/prova/SKILL.md': skillContract('contracte.escriu:\n  - data/future.txt\n  - new-directory/nested/') });
  const result = await auditCoherence(f.wiki);
  assert.equal(result.complete, true);
  assert.equal(result.coverage.skillWriteTargets, 2);
  await assert.rejects(fs.lstat(path.join(f.root, 'data/future.txt')), { code: 'ENOENT' });
  await assert.rejects(fs.lstat(path.join(f.root, 'new-directory')), { code: 'ENOENT' });
});

test('T11 un contracte escrit com escalar queda explícitament invalidat', async t => {
  const f = await fixture(t, { '.agents/skills/prova/SKILL.md': skillContract('contracte.llig: data/source.txt') });
  const result = await auditCoherence(f.wiki);
  assert.equal(result.complete, false);
  assert.equal(contractProblems(result)[0].code, 'skill-contract-invalid');
});

test('T11 contractes no interpreten URLs, glob, absoluts ni travessia com rutes', async t => {
  const f = await fixture(t, { '.agents/skills/prova/SKILL.md': skillContract('contracte.escriu:\n  - ../outside.txt\n  - /tmp/outside.txt\n  - https://example.invalid/a\n  - future/*.md\n  - future//a\n  - C:/outside.txt\n  - future/./a') });
  const result = await auditCoherence(f.wiki);
  assert.equal(result.complete, false);
  assert.equal(contractProblems(result).length, 7);
  assert.ok(contractProblems(result).every(p => p.detail.endsWith('invalid-repository-path')));
});

test('T11 contractes no seguixen symlink de lectura ni pare d’escriptura', async t => {
  const f = await fixture(t, { 'data/source.txt': 'source',
    '.agents/skills/prova/SKILL.md': skillContract('contracte.llig:\n  - link.txt\ncontracte.escriu:\n  - linked-dir/future.txt') });
  await fs.symlink(path.join(f.root, 'data/source.txt'), path.join(f.root, 'link.txt'));
  await fs.symlink(path.join(f.root, 'data'), path.join(f.root, 'linked-dir'));
  const result = await auditCoherence(f.wiki);
  assert.equal(result.complete, false);
  assert.equal(contractProblems(result).length, 2);
  assert.ok(contractProblems(result).every(p => p.detail.endsWith('symlink-not-followed')));
});

test('T11 pare existent que és fitxer no és destinació futura vàlida', async t => {
  const f = await fixture(t, { 'data.txt': 'source',
    '.agents/skills/prova/SKILL.md': skillContract('contracte.escriu:\n  - data.txt/future.txt') });
  const result = await auditCoherence(f.wiki);
  assert.equal(result.complete, false);
  assert.match(contractProblems(result)[0].detail, /ENOTDIR$/);
});

test('T11 inspeccionar una declaració protegida no llig el contingut exclòs', async t => {
  const f = await fixture(t, { '_wiki_de_poble/04_escriptori/01_produccio/protected.md': 'invalid-frontmatter-sentinel',
    '.agents/skills/prova/SKILL.md': skillContract('contracte.llig:\n  - _wiki_de_poble/04_escriptori/01_produccio/protected.md') });
  const result = await auditCoherence(f.wiki);
  assert.equal(result.complete, true);
  assert.equal(result.coverage.wikiDocuments, 0);
  assert.equal(result.coverage.skillReadReferences, 1);
  assert.ok(result.excluded.some(e => e.reason === 'protected-human-zone'));
});

test('T11 repetir una referència no es proclama contradicció; resultat determinista', async t => {
  const f = await fixture(t, { 'source.txt': 'source',
    '.agents/skills/prova/SKILL.md': skillContract('contracte.llig:\n  - source.txt\n  - source.txt') });
  const a = await auditCoherence(f.wiki);
  assert.equal(a.complete, true);
  assert.equal(a.coverage.skillReadReferences, 2);
  assert.deepEqual(a.contradictions, []);
  assert.deepEqual(a, await auditCoherence(f.wiki));
});

test('T11 barra final exigix directori quan el target ja existix', async t => {
  const f = await fixture(t, { 'source.txt': 'source',
    '.agents/skills/prova/SKILL.md': skillContract('contracte.llig:\n  - source.txt/\ncontracte.escriu:\n  - source.txt/') });
  const result = await auditCoherence(f.wiki);
  assert.equal(result.complete, false);
  assert.equal(contractProblems(result).length, 2);
  assert.ok(contractProblems(result).every(p => p.detail.endsWith('target-not-directory')));
});
