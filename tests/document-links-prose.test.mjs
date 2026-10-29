import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { markdownProse } from '../tooling/lib/markdown-prose.mjs';
import { extractDocumentLinks, resolveDocumentLink } from '../tooling/lib/document-links.mjs';
import { prosaIndex, ancoresDe, checkTaula } from '../tooling/gates/porta-olivera.mjs';
import { withoutCode, anchored } from '../tooling/documental/core.mjs';
import { VerificadorSCC } from '../tooling/gates/verificador-scc.mjs';
const DESK = '_wiki_de_poble/04_escriptori';
const INDEX = `${DESK}/00_index_escriptori.md`;
function setup(t, payload) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-prose-test-')));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const put = (rel, text) => { const f = path.join(root, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, text); };
  put('_wiki_de_poble/00_index.md', '# Índex\n\n[[00_index_escriptori]]\n');
  put(`${DESK}/real.md`, '# Real\n');
  const index = `# Escriptori\n\n## Activitat en curs\n\n- [[real]]\n\n${payload}\n`;
  put(INDEX, index);
  return { root, index, source: path.join(root, INDEX), files: [path.join(root, '_wiki_de_poble/00_index.md'), path.join(root, INDEX), path.join(root, DESK, 'real.md')], put };
}
const codeCases = [
  ['tilde tres', '~~~markdown\n[[ghost]]\n[Ghost](ghost.md)\n~~~'],
  ['tilde quatre i fence curta interna', '~~~~markdown\n~~~\n[[ghost]]\n~~~\n~~~~'],
  ['backticks quatre i fence curta interna', '````markdown\n```\n[[ghost]]\n```\n````'],
  ['fence de cinc tancada per sis', '~~~~~text\n[[ghost]]\n~~~~~~'],
  ['families de fence diferents', '```markdown\n~~~\n[[ghost]]\n```'],
  ['delimitador de tancament amb text no tanca', '~~~markdown\n~~~encara_codi\n[[ghost]]\n~~~'],
  ['fence sense tancament', '~~~markdown\n[[ghost]]'],
  ['backtick inline simple', '`[[ghost]] [Ghost](ghost.md)`'],
  ['backtick inline doble amb backtick simple interior', '``[[ghost]] ` [Ghost](ghost.md)``'],
  ['backtick inline triple', 'Text ```[[ghost]]``` final'],
  ['span inline en dues línies', 'Text `[[ghost]]\n[Ghost](ghost.md)` final'],
  ['comentari HTML multilínia amb fences', '<!--\n~~~markdown\n[[ghost]]\n~~~\n-->'],
  ['comentari dins span inline no tapa la prosa posterior', '`<!-- [[ghost]]`\n[[real]]'],
  ['comentari sense tancament', '<!-- [[ghost]]'],
  ['wiki i Markdown escapats', String.raw`\[[ghost]] i \[Ghost](ghost.md)`],
];
for (const [name, payload] of codeCases) test(`C1-T11-FENCE ${name}: extract/resolve/core/Olivera/SCC compartixen prosa`, async t => {
  const f = setup(t, payload);
  const links = extractDocumentLinks(f.index);
  assert.ok(links.length >= 1, 'la font conserva un enllaç real de control');
  assert.ok(links.every(link => link.target === 'real'), JSON.stringify(links));
  for (const link of links) assert.equal(resolveDocumentLink(link, f.source, f.files, f.root), path.join(f.root, DESK, 'real.md'));
  assert.deepEqual(prosaIndex(f.index), markdownProse(f.index));
  assert.deepEqual(withoutCode(f.index), markdownProse(f.index));
  assert.ok(ancoresDe(f.index).every(a => a.raw === 'real'));
  assert.equal(anchored(payload, `${DESK}/ghost.md`), false);
  assert.equal(checkTaula(f.root).valid, true, JSON.stringify(checkTaula(f.root)));
  const scc = await new VerificadorSCC(f.root).runAudits();
  assert.equal(scc.valid, true, JSON.stringify(scc));
});

test('C1-T11-FENCE offsets, UTF-16, CRLF i enllaç real després del bloc es conserven', t => {
  const payload = '🙂\r\n~~~~\r\n[[ghost]]\r\n~~~\r\n~~~~\r\n[[real]]\r\n';
  const f = setup(t, payload), prose = markdownProse(f.index);
  assert.equal(prose.length, f.index.length);
  assert.deepEqual([...prose.matchAll(/\r?\n/g)].map(m => [m.index, m[0]]), [...f.index.matchAll(/\r?\n/g)].map(m => [m.index, m[0]]));
  const anchors = ancoresDe(f.index);
  assert.equal(anchors.length, 2);
  assert.ok(anchors.every(a => f.index.slice(a.inici, a.final) === '[[real]]'));
});

test('C1-T11-FENCE links visibles ficticis continuen rojos, sense verd per buit', async t => {
  const f = setup(t, '~~~\n[[ghost_exemple]]\n~~~\n[[ghost_visible]]');
  const links = extractDocumentLinks(f.index);
  assert.ok(links.some(link => link.target === 'ghost_visible'));
  assert.ok(!links.some(link => link.target === 'ghost_exemple'));
  const olivera = checkTaula(f.root), scc = await new VerificadorSCC(f.root).runAudits();
  assert.equal(olivera.valid, false);
  assert.equal(scc.valid, false);
  assert.ok(scc.errors.some(error => error.code === 'LINK_INVALID' && error.message.includes('ghost_visible')));
});

test('C1-T11-FENCE backticks escapats i run sense parella no oculten links reals', async t => {
  const f = setup(t, [String.fromCharCode(92), '`[[real]]', String.fromCharCode(92), '`\n', '`` literal sense tancament [[real]]'].join(''));
  assert.equal(extractDocumentLinks(f.index).filter(link => link.target === 'real').length, 3);
  const scc = await new VerificadorSCC(f.root).runAudits();
  assert.equal(scc.valid, true, JSON.stringify(scc));
});

test('C1-T11-FENCE dos backslashes no escapen el wikilink; tres sí', () => {
  assert.deepEqual(extractDocumentLinks(String.raw`\\[[real]]`), [{ kind: 'wiki', target: 'real' }]);
  assert.deepEqual(extractDocumentLinks(String.raw`\\\[[ghost]]`), []);
});

test('C1-T11-FENCE àlies escapats de taula Obsidian resolen el mateix destí', async t => {
  const f = setup(t, String.raw`| [[real\|Etiqueta]] | text |`);
  const links = extractDocumentLinks(f.index);
  assert.ok(links.every(link => link.target === 'real'), JSON.stringify(links));
  assert.equal(checkTaula(f.root).valid, true);
  const scc = await new VerificadorSCC(f.root).runAudits();
  assert.equal(scc.valid, true, JSON.stringify(scc));
});

test('C1-T11-FENCE un span inline no travessa paràgraf buit ni una fence nova', t => {
  for (const payload of ['`literal\n\n[[real]] `', '`literal\n~~~\n[[ghost]]\n~~~\n[[real]] `']) {
    const f = setup(t, payload);
    assert.equal(extractDocumentLinks(f.index).filter(link => link.target === 'real').length, 2);
    assert.ok(extractDocumentLinks(f.index).every(link => !link.target.includes('ghost')));
  }
});

test('C1-T11-FENCE C1 resolutor binari, confinament i symlink exterior es preserven', t => {
  const f = setup(t, '');
  f.put(`${DESK}/recurs`, Buffer.from([0, 255]));
  assert.equal(resolveDocumentLink({ kind: 'wiki', target: './recurs' }, f.source, f.files, f.root), path.join(f.root, DESK, 'recurs'));
  fs.symlinkSync('/tmp', path.join(f.root, DESK, 'extern'));
  assert.throws(() => resolveDocumentLink({ kind: 'wiki', target: './extern/recurs.bin' }, f.source, f.files, f.root), /fora de l’arrel/);
});

test('C1-T11-FENCE corpus de 300k conserva tots els controls visibles', t => {
  const f = setup(t, ('~~~markdown\n[[ghost]]\n~~~\nText `[[ghost]]` [[real]]\n\n').repeat(6000));
  assert.ok(f.index.length >= 300000);
  const links = extractDocumentLinks(f.index);
  assert.equal(links.length, 6001);
  assert.ok(links.every(link => link.target === 'real'));
});

test('directive mode keeps inline bytes and offsets while hiding comments and fences',()=>{
 const raw='`Permissions-Policy: camera=(self)`\n<!-- hidden -->\n~~~\nsecret\n~~~\nTail',prose=markdownProse(raw,{preserveInlineCode:true});assert.equal(prose.length,raw.length);assert.equal(prose.split('\n').length,raw.split('\n').length);assert.ok(prose.startsWith('`Permissions-Policy: camera=(self)`'));assert.ok(!prose.includes('hidden'));assert.ok(!prose.includes('secret'));assert.ok(prose.endsWith('Tail'));assert.ok(!markdownProse(raw).includes('Permissions-Policy'));
});
test('directive mode keeps multiline inline code and literal comment markers inside it',()=>{
 const raw='Start `<!-- literal\ncomment -->` End\n<!-- hidden -->',prose=markdownProse(raw,{preserveInlineCode:true});assert.ok(prose.includes('`<!-- literal\ncomment -->`'));assert.ok(!prose.includes('hidden'));
});

test('directive mode rejects ambiguous non-boolean configuration',()=>{
  for(const preserveInlineCode of ['false',1,null]) assert.throws(()=>markdownProse('text',{preserveInlineCode}),TypeError);
});

test('T11-40 resolveDocumentLink resol el nom de carpeta d un skill cap al seu SKILL.md', t => {
  const f = setup(t, '');
  const skillFile = path.join(f.root, '.agents/skills/core-automillora/SKILL.md');
  f.put('.agents/skills/core-automillora/SKILL.md', '# Skill');
  f.files.push(skillFile);
  assert.equal(
    resolveDocumentLink({ kind: 'wiki', target: 'core-automillora' }, f.source, f.files, f.root),
    path.join(f.root, '.agents/skills/core-automillora/SKILL.md')
  );
});
