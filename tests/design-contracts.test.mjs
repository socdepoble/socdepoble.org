import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { cromStyleOffsets, designColorSource } from '../tooling/lib/design-contracts.mjs';
import { run } from '../tooling/gates/design_guard.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PANEL = 'src/components/universal/PanellCrom.jsx';
const expr = "typeof hex === 'string' && hex.length === 7 && /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : null";
const jsx = value => `const panel = <li style={{ '--sdp-crom-mostra': ${value} }} />;`;
const manifest = content => `export const wikiManifest = ${JSON.stringify({ categories: [], items: [{ content }] }, null, 2)};`;

test('HEX6 runtime contract accepts colors and rejects CSS payloads, coercion and terminal newlines', () => {
  const evaluate = new Function('hex', `return ${expr};`);
  for (const value of ['#123456', '#aAbBcC']) assert.equal(evaluate(value), value);
  for (const value of [null, {}, 123456, '#12345', '#12345678', '#123456\n', '#123456; background:url(https://x)', 'url(https://x)', 'var(--x)', { toString: () => '#123456' }]) assert.equal(evaluate(value), null);
});

test('AST contract only accepts the one property, file and locally checked identifier', () => {
  assert.equal(cromStyleOffsets(jsx(expr), PANEL).size, 1);
  const unsafe = [
    jsx('hex'), jsx("'url(https://x)'"), jsx(expr.replace(' ? hex :', ' ? other :')),
    jsx(expr.replace(' && hex.length === 7', '')), jsx(expr.replace('{6}', '+')),
    jsx(expr.replace("typeof hex === 'string' && ", '')),
    jsx(expr).replace("'--sdp-crom-mostra'", "'--any-property'"),
    jsx(expr).replace(' }}', ', ...extra }}'),
    jsx(expr).replace("'--sdp-crom-mostra'", "['--sdp-crom-mostra']"),
    jsx(expr).replace('.test(hex)', '.test(other)'),
    jsx(expr).replace(' : null', ' : undefined'),
    jsx(expr).replace('hex.length === 7', 'hex.length >= 7'),
    jsx(expr).replace('style=', 'data-style='),
  ];
  for (const source of unsafe) assert.equal(cromStyleOffsets(source, PANEL).size, 0, source);
  assert.equal(cromStyleOffsets(jsx(expr), 'src/components/universal/Other.jsx').size, 0);
});

test('generated JSON documentary colors are masked with byte offsets preserved', () => {
  const text = manifest('Color de document: `#016ebf`.\n```json\n{"secondary":"#0e0d0c"}\n```');
  const masked = designColorSource(text, 'data/wikiManifest.js');
  assert.equal(masked.length, text.length);
  assert.doesNotMatch(masked, /#016ebf|#0e0d0c/);
  assert.equal(designColorSource(text, 'data/other.js'), text);
});

test('HTML/CSS colors and executable code remain detected, including mixed documents', () => {
  for (const content of ['<span style="color:#016ebf">x</span>', '<span\nstyle="color:\n#016ebf">x</span>', '<style>\np { color:\n#016ebf; }\n</style>', 'p { color: #016ebf; }', '```css\n--preview: #016ebf;\n```', '```jsx\nconst style = { arbitrary: "#016ebf" };\n```', '{"color": "#016ebf"}']) {
    const text = manifest(`Documentary #0e0d0c.\n${content}`);
    assert.match(designColorSource(text, 'data/wikiManifest.js'), /#016ebf/);
  }
  for (const text of [
    `${manifest('Documentary #016ebf')}\nconst actualStyle = { color: '#016ebf' };`,
    "export const wikiManifest = {items:[{content: (() => '#016ebf')()}]};",
    'export const wikiManifest = {"items": [{"content": "text", "style": "#016ebf"}]};',
  ]) assert.match(designColorSource(text, 'data/wikiManifest.js'), /#016ebf/);
});

test('both gates share the narrow contract and still report an unsafe inline property', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-design-contract-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const panel = path.join(root, PANEL);
  fs.mkdirSync(path.dirname(panel), { recursive: true });
  const scanPedra = () => spawnSync(process.execPath, [path.join(ROOT, 'tooling/brain/tractor-pedra-seca.mjs')], { cwd: root, encoding: 'utf8' });
  fs.writeFileSync(panel, jsx(expr));
  assert.equal((await run({ root: path.join(root, 'src') })).data.findings.some(f => f.rule === 'inline-style'), false);
  assert.match(scanPedra().stdout, /LLEI_03_ESTIL_EN_LINIA\s+0/);
  fs.writeFileSync(panel, jsx('hex'));
  assert.equal((await run({ root: path.join(root, 'src') })).data.findings.some(f => f.rule === 'inline-style'), true);
  assert.match(scanPedra().stdout, /LLEI_03_ESTIL_EN_LINIA\s+1/);
  fs.writeFileSync(panel, jsx("'#016ebf'"));
  assert.match(scanPedra().stdout, /LLEI_03_COLOR_EN_LINIA\s+1/);
});

test('host document policy excludes runner tests but still flags arbitrary production modules', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-head-contract-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'src/hooks'), { recursive: true });
  const runPedra = () => spawnSync(process.execPath, [path.join(ROOT, 'tooling/brain/tractor-pedra-seca.mjs')], { cwd: root, encoding: 'utf8' }).stdout;
  fs.writeFileSync(path.join(root, 'src/hooks/head.test.js'), 'document.head.replaceChildren();');
  assert.match(runPedra(), /LLEI_06_ENCAPSULAMENT\s+0/);
  fs.writeFileSync(path.join(root, 'src/hooks/test-helper.js'), 'document.head.replaceChildren();');
  assert.match(runPedra(), /LLEI_06_ENCAPSULAMENT\s+1/);
  fs.writeFileSync(path.join(root, 'src/hooks/otherSeoHead.js'), 'document.body.replaceChildren();');
  assert.match(runPedra(), /LLEI_06_ENCAPSULAMENT\s+2/);
  fs.writeFileSync(path.join(root, 'src/main.jsx'), "import './hooks/head.test.js';");
  assert.match(runPedra(), /LLEI_06_ENCAPSULAMENT\s+3/, 'test modules imported by a production entry remain audited');
});
