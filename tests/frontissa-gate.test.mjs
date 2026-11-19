import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '@babel/parser';
import { auditFrontissa, validateFrontissaStructure } from '../tooling/gates/tractor-frontissa.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = 'src/data/adaptadors/sollutia';
const client = fs.readFileSync(path.join(ROOT, DIR, 'client.js'), 'utf8');
const transport = fs.readFileSync(path.join(ROOT, DIR, 'creaFrontissa.js'), 'utf8');

test('actual separated client/factory satisfy executable contracts without network', async () => {
  const fetchBefore = globalThis.fetch;
  assert.deepEqual(await auditFrontissa(ROOT), { ok: true, checked: ['client.js', 'creaFrontissa.js'], transportCalls: 1 });
  assert.equal(globalThis.fetch, fetchBefore);
});

for (const [name, mutation] of [
  ['credentials include', source => source.replace("credentials: 'omit'", "credentials: 'include' /* credentials: 'omit' */")],
  ['redirect follow', source => source.replace("redirect: 'error'", "redirect: 'follow' /* redirect: 'error' */")],
  ['POST', source => source.replace("method: 'GET'", "method: 'POST' /* method: 'GET' */")],
  ['spread override', source => source.replace("credentials: 'omit',", "credentials: 'omit', ...{ credentials: 'include' },")],
  ['duplicate override', source => source.replace("credentials: 'omit',", "credentials: 'omit', credentials: 'include',")],
  ['unobserved fetch', source => source.replace('espera(fetchImpl(url.href,', 'espera(fetch(url.href,')],
]) test(`AST rejects ${name} despite reassuring source literals`, () => {
  const changed = mutation(transport);
  assert.notEqual(changed, transport, 'the intended mutant must actually change the transport');
  assert.throws(() => validateFrontissaStructure(client, changed));
});

for (const addition of [
  '\nconst effect = setTimeout(() => {}, 0);',
  '\nexport const effect = (() => 1)();',
  '\nclass Effect { static { globalThis.effect = true; } }',
]) test('AST admits hoisted helper declarations but rejects executable module initializers', () => {
  validateFrontissaStructure(client, transport);
  assert.throws(() => validateFrontissaStructure(client, transport + addition), /Efecte executable/);
});

test('entry empty write catalog must really be frozen and linked to the audited transport', () => {
  for (const changed of [
    client.replace('ESCRIPTURES_PERMESES = Object.freeze([])', 'ESCRIPTURES_PERMESES = []'),
    client.replace('ESCRIPTURES_PERMESES = Object.freeze([])', "ESCRIPTURES_PERMESES = Object.freeze(['write'])"),
    client.replace("'./creaFrontissa.js'", "'./otherFactory.js'"),
  ]) assert.throws(() => validateFrontissaStructure(changed, transport));
});

/* Mutate one executable node, never an obsolete source-text spelling. Missing
   or ambiguous targets fail the harness instead of silently testing the original. */
function mutaNode(source, label, predicate, replacement) {
  const targets = [];
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (predicate(node)) targets.push(node);
    for (const child of Object.values(node)) {
      if (Array.isArray(child)) child.forEach(visit);
      else if (child && typeof child === 'object') visit(child);
    }
  }
  visit(parse(source, { sourceType: 'module' }));
  assert.equal(targets.length, 1, `${label}: exactly one executable mutation target is required`);
  const node = targets[0], changed = source.slice(0, node.start) + replacement(node) + source.slice(node.end);
  assert.notEqual(changed, source, `${label}: the selected node must actually change`);
  return changed;
}
const identifier = (node, name) => node?.type === 'Identifier' && node.name === name;
const member = (node, object, property) => node?.type === 'MemberExpression' && !node.computed
  && identifier(node.object, object) && identifier(node.property, property);

for (const [name, editClient, editTransport, expectedFailure] of [
  ['origin allowlist bypass', value => value, value => mutaNode(value, 'origin allowlist',
    node => node.type === 'UnaryExpression' && node.operator === '!' && node.argument.type === 'CallExpression'
      && member(node.argument.callee, 'allowedOrigins', 'includes'), () => 'false'),
  error => error.code === 'ERR_ASSERTION' && /Missing expected exception/.test(error.message)
    && error.expected?.code === 'INVALID_ORIGIN'],
  ['DTO decoder bypass', value => value, value => mutaNode(value, 'DTO decoder',
    node => node.type === 'CallExpression' && member(node.callee, 'resource', 'decode'), node => {
      assert.equal(node.arguments.length, 1, 'the decoder must receive one complete envelope');
      // Keep envelope validation intact; bypass only the DTO translator.
      return value.slice(node.arguments[0].start, node.arguments[0].end);
    }),
  error => error.code === 'ERR_ASSERTION' && error.actual?.secret === 'not-a-dto-field'
    && error.expected?.name === 'A' && !Object.hasOwn(error.expected, 'secret')],
  ['production catalog bypass', value => mutaNode(value, 'production catalog',
    node => node.type === 'IfStatement' && node.consequent.type === 'ThrowStatement'
      && node.consequent.argument.type === 'NewExpression' && identifier(node.consequent.argument.callee, 'ErrorDades')
      && node.consequent.argument.arguments[0]?.value === 'UNKNOWN_RESOURCE', () => 'return {};'), value => value,
  error => error.code === 'ERR_ASSERTION' && /Missing expected rejection/.test(error.message)
    && error.expected?.code === 'UNKNOWN_RESOURCE'],
]) test(`runtime probes detect ${name} with intact transport AST`, async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-frontissa-mutant-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, DIR), { recursive: true });
  fs.writeFileSync(path.join(root, 'package.json'), '{"type":"module"}');
  const changedClient = editClient(client), changedTransport = editTransport(transport);
  assert.ok(changedClient !== client || changedTransport !== transport, 'the intended mutant must actually change source');
  fs.writeFileSync(path.join(root, DIR, 'client.js'), changedClient);
  fs.writeFileSync(path.join(root, DIR, 'creaFrontissa.js'), changedTransport);
  validateFrontissaStructure(changedClient, changedTransport);
  const fetchBefore = globalThis.fetch;
  await assert.rejects(() => auditFrontissa(root), expectedFailure,
    'the injected mutant must be detected by its intended runtime security oracle');
  assert.equal(globalThis.fetch, fetchBefore, 'gate restores the fetch guard even after failure');
  t.diagnostic(`${name}: one AST mutation injected; structure accepted; intended runtime oracle rejected it`);
});
