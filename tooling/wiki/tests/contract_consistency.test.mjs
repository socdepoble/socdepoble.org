import test from 'node:test';
import assert from 'node:assert/strict';
import { auditContractClaims } from '../lib/contract_consistency.mjs';

const active = (path, content) => ({ path, content, authority: 'active' });
const audit = (...documents) => auditContractClaims({ scope: '0216', documents });
const rubric = (n, title = 'Dimensió auditada') => `| # | ${title} |\n| --- | --- |\n${Array.from({ length: n }, (_, i) => `| **${i + 1}** | àrea |`).join('\n')}`;

test('prose nine versus an explicit ten-dimension rubric is reported with lines', () => {
  const result = audit(active('pla.md', `Les 9 dimensions.\n\n${rubric(10)}`));
  assert.equal(result.status, 'explicit-disagreements');
  assert.deepEqual(result.findings[0].values, ['10', '9']);
  assert.deepEqual(result.findings[0].claims.map(({ line, source }) => ({ line, source })), [{ line: 1, source: 'prose' }, { line: 3, source: 'rubric' }]);
  assert.equal(result.findings[0].requiresReview, true);
});

test('nine versus ten in different active prose is within the same explicit scope', () => {
  const result = audit(active('b.md', 'Ten dimensions'), active('a.md', 'nou dimensions'));
  assert.deepEqual(result.findings[0].paths, ['a.md', 'b.md']);
  assert.equal(result.findings[0].scope, '0216');
});

test('matching prose and rubric has no explicit disagreement', () => {
  const result = audit(active('pla.md', `Les **10** dimensions\n${rubric(10)}`));
  assert.equal(result.status, 'no-explicit-disagreements');
  assert.deepEqual(result.findings, []);
});

test('a number table without dimension header is not a rubric', () => {
  assert.equal(audit(active('a', `9 dimensions\n${rubric(10, 'Tasques')}`)).findings.length, 0);
});

test('gapped or duplicate ordinal rows do not invent a rubric', () => {
  const duplicate = rubric(10).replace('| **10** |', '| **9** |');
  assert.equal(audit(active('a', `9 dimensions\n${duplicate}`)).findings.length, 0);
});

test('microphone self versus empty is reported separately from equal camera', () => {
  const result = audit(active('a', 'Permissions-Policy: camera=(), microphone=(self), geolocation=(self)'),
    active('b', '`Permissions-Policy: camera=(), microphone=(), geolocation=(self)`'));
  assert.equal(result.findings.length, 1);
  assert.equal(result.findings[0].contract, 'permissions-policy:microphone');
  assert.deepEqual(result.findings[0].values, ['()', '(self)']);
});

test('policy allowlists normalize whitespace, ordering, duplicate tokens and quoting', () => {
  const result = audit(active('a', 'Permissions-Policy: microphone=(self "https://a.test" "https://b.test")'),
    active('b', 'Permissions-Policy: microphone=( "https://b.test" self "https://a.test" self )'));
  assert.equal(result.status, 'no-explicit-disagreements');
});

test('all explicitly named policy features can disagree, not just microphone', () => {
  const result = audit(active('a', 'Permissions-Policy: geolocation=(self), camera=*'),
    active('b', 'Permissions-Policy: geolocation=(), camera=()'));
  assert.deepEqual(result.findings.map((f) => f.contract).sort(), ['permissions-policy:camera', 'permissions-policy:geolocation']);
});

test('history is counted but cannot contribute a claim', () => {
  const result = audit(active('a', '10 dimensions'), { path: 'historic', content: '9 dimensions\nPermissions-Policy: microphone=()', authority: 'history' });
  assert.equal(result.coverage.historicalDocuments, 1);
  assert.equal(result.coverage.explicitClaims, 1);
  assert.deepEqual(result.findings, []);
});

test('zero active documents is incomplete even with a historical text', () => {
  assert.equal(audit().status, 'incomplete');
  assert.equal(audit({ path: 'old', content: '9 dimensions', authority: 'history' }).status, 'incomplete');
});

test('quotations, fenced examples, frontmatter and explicit example lines are excluded', () => {
  const content = ['---', 'description: 9 dimensions', '---', '10 dimensions', '> 9 dimensions',
    '```md', '9 dimensions', 'Permissions-Policy: microphone=(self)', '```',
    '~~~', rubric(9), '~~~', 'Example: 9 dimensions', 'Exemple: Permissions-Policy: microphone=(self)',
    'Permissions-Policy: microphone=()'].join('\n');
  assert.deepEqual(audit(active('a', content)).findings, []);
});

test('a shorter or different fence marker does not close a longer code fence', () => {
  const text = '10 dimensions\n````md\n```\n9 dimensions\n~~~\n````\n';
  assert.equal(audit(active('a', text)).findings.length, 0);
});

test('indented code and example list items do not contribute claims', () => {
  const text = '10 dimensions\n    9 dimensions\n\t9 dimensions\n- Example: 9 dimensions\n1. Exemple: 9 dimensions';
  assert.equal(audit(active('a', text)).findings.length, 0);
});

test('reversed input produces exactly the same serialized bytes and codepoint order', () => {
  const docs = [active('z.md', '9 dimensions\nPermissions-Policy: microphone=()'),
    active('A.md', '10 dimensions\nPermissions-Policy: microphone=(self)'), active('à.md', '10 dimensions')];
  assert.equal(JSON.stringify(audit(...docs)), JSON.stringify(audit(...docs.toReversed())));
  assert.deepEqual(audit(...docs).findings[0].paths, ['A.md', 'z.md', 'à.md']);
});

test('scope and document input errors fail explicitly', () => {
  for (const scope of [undefined, '', ' ', 4]) assert.throws(() => auditContractClaims({ scope, documents: [] }), TypeError);
  assert.throws(() => auditContractClaims({ scope: '0216' }), TypeError);
  for (const doc of [null, [], {}, { path: 'a', content: '' }, { path: 'a', content: 3, authority: 'active' },
    { path: 'a', content: '', authority: 'assumed' }, { path: '', content: '', authority: 'active' }]) {
    assert.throws(() => audit(doc), TypeError);
  }
  assert.throws(() => audit(active('same', ''), active('same', '')), /unique/);
});

test('path order uses Unicode codepoints rather than a locale or UTF-16 code units', () => {
  const result = audit(active('😀', '9 dimensions'), active('\ue000', '10 dimensions'));
  assert.deepEqual(result.findings[0].paths, ['\ue000', '😀']);
});

test('an inherited authority is not explicit document authority', () => {
  const doc = Object.assign(Object.create({ authority: 'active' }), { path: 'a', content: '9 dimensions' });
  assert.throws(() => audit(doc), /explicitly/);
});

test('300k characters are scanned without dropping later claims', () => {
  const text = `${'a'.repeat(300_000)}\n9 dimensions\n10 dimensions`;
  const result = audit(active('large.md', text));
  assert.equal(result.coverage.scannedActiveLines, 3);
  assert.deepEqual(result.findings[0].claims.map((c) => c.line), [2, 3]);
});

test('unlabelled policy fragments and malformed directives do not become claims', () => {
  const result = audit(active('a', 'microphone=(self)\nPermissions-Policy: microphone=unclosed'),
    active('b', 'Permissions-Policy: microphone=()'));
  assert.equal(result.findings.length, 0);
  assert.equal(result.coverage.explicitClaims, 1);
});

const configured = (documents, claims, canonical = [{ id: 'CHECK-1', value: 'meaning-one' }]) => auditContractClaims({
  scope: '0216', documents, catalog: { scope: '0216', canonical, claims }
});

test('explicit catalog mapping reports a changed meaning with canonical and located evidence', () => {
  const result = configured([active('prompt', 'CHECK-1: meaning-two')], [{ id: 'CHECK-1', value: 'meaning-two', path: 'prompt', line: 1 }]);
  assert.equal(result.findings[0].code, 'EXPLICIT_CATALOG_DISAGREEMENT');
  assert.deepEqual(result.findings[0].canonical, { id: 'CHECK-1', value: 'meaning-one' });
  assert.equal(result.findings[0].claims[0].line, 1);
  assert.equal(result.findings[0].requiresReview, true);
});

test('matching explicit catalog labels have no explicit disagreement', () => {
  const result = configured([active('a', 'CHECK-1: meaning-one')], [{ id: 'CHECK-1', value: 'meaning-one', path: 'a', line: 1 }]);
  assert.equal(result.status, 'no-explicit-disagreements');
  assert.equal(result.coverage.catalog.comparedIds, 1);
});

test('arbitrary natural-language QA associations are not automatically interpreted', () => {
  const result = audit(active('prompt', 'QA-S01 means rotation. QA-S01 means verification.'));
  assert.deepEqual(result.findings, []);
  assert.equal(result.coverage.explicitClaims, 0);
});

test('catalog labels are exact and support arbitrary caller-defined ids', () => {
  const result = configured([active('a', 'custom')], [{ id: 'other-project', value: 'LABEL', path: 'a', line: 1 }], [{ id: 'other-project', value: 'label' }]);
  assert.equal(result.findings[0].contract, 'catalog:other-project');
  assert.deepEqual(result.findings[0].values, ['LABEL', 'label']);
});

test('catalog history is census only, even when its label conflicts', () => {
  const documents = [active('a', 'present'), { path: 'old', content: 'old meaning', authority: 'history' }];
  const claims = [{ id: 'CHECK-1', value: 'meaning-one', path: 'a', line: 1 }, { id: 'CHECK-1', value: 'old-meaning', path: 'old', line: 1 }];
  const result = configured(documents, claims);
  assert.deepEqual(result.findings, []);
  assert.equal(result.coverage.catalog.historicalClaims, 1);
});

test('catalog locations in code, quotations and example lines are excluded', () => {
  const document = active('a', '````md\nclaim\n````\n> claim\nExample: claim\nreal');
  const claims = [2, 4, 5, 6].map((line) => ({ id: 'CHECK-1', value: line === 6 ? 'meaning-one' : 'other', path: 'a', line }));
  const result = configured([document], claims);
  assert.equal(result.coverage.catalog.excludedClaims, 3);
  assert.deepEqual(result.findings, []);
});

test('catalog input requires its own explicit scope matching the requested scope', () => {
  const documents = [active('a', 'line')];
  for (const catalog of [{}, { scope: 'other', canonical: [], claims: [] }, null]) {
    assert.throws(() => auditContractClaims({ scope: '0216', documents, catalog }), /catalog.scope/);
  }
});

test('document and claim scopes cannot silently leak into another audit scope', () => {
  assert.throws(() => auditContractClaims({ scope: '0216', documents: [{ ...active('a', 'line'), scope: 'other' }] }), /document.scope/);
  assert.throws(() => configured([active('a', 'line')], [{ id: 'CHECK-1', value: 'meaning-one', path: 'a', line: 1, scope: 'other' }]), /claim.scope/);
});

test('canonical ids and labels must be explicit, unique and nonempty', () => {
  for (const canonical of [[], [{ id: '', value: 'a' }], [{ id: 'x', value: '' }], [{ id: 'x', value: ' a ' }], [{ id: 'x', value: 'a' }, { id: 'x', value: 'b' }]]) {
    assert.throws(() => configured([active('a', 'line')], [], canonical), TypeError);
  }
});

test('each configured claim needs a mapped id and an existing positive line location', () => {
  const claim = { id: 'CHECK-1', value: 'meaning-one', path: 'a', line: 1 };
  for (const bad of [{ ...claim, id: 'unmapped' }, { ...claim, path: 'absent' }, { ...claim, line: 0 },
    { ...claim, line: 2 }, { ...claim, line: 1.5 }, { ...claim, value: '' }, { ...claim, line: undefined }]) {
    assert.throws(() => configured([active('a', 'line')], [bad]), TypeError);
  }
});

test('no active catalog evidence reports incomplete rather than a successful comparison', () => {
  assert.equal(configured([active('a', 'line')], []).status, 'incomplete');
  const result = configured([{ path: 'old', content: 'line', authority: 'history' }], [{ id: 'CHECK-1', value: 'other', path: 'old', line: 1 }]);
  assert.equal(result.status, 'incomplete');
  assert.equal(result.coverage.catalog.activeClaims, 0);
});

test('catalog comparison is deterministic when document, canonical and claim arrays reverse', () => {
  const documents = [active('z', 'line\nline'), active('a', 'line')];
  const claims = [{ id: 'CHECK-1', value: 'other', path: 'z', line: 2 }, { id: 'CHECK-2', value: 'other', path: 'a', line: 1 }];
  const canonical = [{ id: 'CHECK-1', value: 'meaning-one' }, { id: 'CHECK-2', value: 'meaning-two' }];
  const forward = configured(documents, claims, canonical);
  const reversed = configured(documents.toReversed(), claims.toReversed(), canonical.toReversed());
  assert.equal(JSON.stringify(forward), JSON.stringify(reversed));
  assert.deepEqual(forward.findings.map((f) => f.paths[0]), ['a', 'z']);
});

test('duplicate catalog evidence is counted once and same-id claims group together', () => {
  const claim = { id: 'CHECK-1', value: 'other', path: 'a', line: 1 };
  const result = configured([active('a', 'line')], [claim, { ...claim }]);
  assert.equal(result.coverage.catalog.configuredClaims, 2);
  assert.equal(result.coverage.catalog.activeClaims, 1);
  assert.equal(result.findings.length, 1);
});

test('catalog evidence and 300k characters do not require searching natural-language meanings', () => {
  const result = configured([active('a', `${'a'.repeat(300_000)}\nCHECK-1`)],[{ id: 'CHECK-1', value: 'other', path: 'a', line: 2 }]);
  assert.equal(result.findings[0].claims[0].line, 2);
});

test('explicitly numbered nested list items remain active claims rather than indented code', () => {
  const text = '    2. CHECK-1 means other';
  const result = configured([active('a', text)], [{ id: 'CHECK-1', value: 'other', path: 'a', line: 1, text }]);
  assert.equal(result.findings.length, 1);
  assert.equal(result.coverage.catalog.excludedClaims, 0);
});

test('an optional exact source line prevents reuse of a stale configured label', () => {
  assert.throws(() => configured([active('a', 'current source')], [{ id: 'CHECK-1', value: 'other', path: 'a', line: 1, text: 'old source' }]), /source line/);
});

test('HTML comments are not active claims, including multiline and unclosed comments', () => {
  for (const text of ['10 dimensions\n<!-- 9 dimensions -->','10 dimensions\n<!--\n9 dimensions\nPermissions-Policy: camera=()\n-->','10 dimensions\n<!--\n9 dimensions']) {const r=audit(active('a',text));assert.equal(r.findings.length,0);assert.equal(r.coverage.explicitClaims,1);}
});
test('a fence inside a comment cannot hide a later real contradiction', () => {
  const text='10 dimensions\n<!--\n~~~md\n9 dimensions\n-->\n9 dimensions';assert.deepEqual(audit(active('a',text)).findings[0].claims.map(c=>c.line),[1,6]);
});
test('inline code directives stay active while HTML comments stay hidden', () => {
  const r=audit(active('a','`Permissions-Policy: camera=(self)`\n<!-- Permissions-Policy: camera=* -->'),active('b','`Permissions-Policy: camera=()`'));assert.deepEqual(r.findings[0].values,['()','(self)']);assert.equal(r.coverage.explicitClaims,2);
});
test('BOM frontmatter is not contract prose',()=>{const r=audit(active('a','\ufeff---\ndescription: 9 dimensions\n---\n10 dimensions'));assert.deepEqual(r.findings,[]);assert.equal(r.coverage.explicitClaims,1);});
test('configured labels in comments are excluded rather than conflicting',()=>{
 const r=configured([active('a','<!--\nold rule\n-->\nnew rule')],[{id:'CHECK-1',value:'other',path:'a',line:2},{id:'CHECK-1',value:'meaning-one',path:'a',line:4}]);assert.equal(r.coverage.catalog.excludedClaims,1);assert.deepEqual(r.findings,[]);
});
test('exact pins use the original line when a trailing comment is masked',()=>{
 const text='new rule <!-- explanatory note -->',claim={id:'CHECK-1',value:'other',path:'a',line:1,text};assert.equal(configured([active('a',text)],[claim]).findings.length,1);assert.throws(()=>configured([active('a',text)],[{...claim,text:'new rule'}]),/source line/);
});
test('escaped comment openers stay visible literal prose',()=>{assert.deepEqual(audit(active('a','10 dimensions\n\\<!-- 9 dimensions -->')).findings[0].values,['10','9']);});
