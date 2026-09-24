import { esMain } from '../lib/arrel.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { parse } from '@babel/parser';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CLIENT = 'src/data/adaptadors/sollutia/client.js';
const TRANSPORT = 'src/data/adaptadors/sollutia/creaFrontissa.js';
const requireContract = (ok, message) => { if (!ok) throw new Error(message); };
const named = (node, name) => node?.type === 'Identifier' && node.name === name;
const keyOf = property => property.key?.name ?? property.key?.value;
function nodes(ast, predicate) {
  const out = [];
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (predicate(node)) out.push(node);
    for (const [key, child] of Object.entries(node)) {
      if (['loc', 'extra', 'comments'].includes(key)) continue;
      if (Array.isArray(child)) child.forEach(visit); else visit(child);
    }
  }
  visit(ast);
  return out;
}

/** Checks executable AST, not reassuring words in comments or dead string data. */
export function validateFrontissaStructure(client, transport) {
  const entry = parse(client, { sourceType: 'module' });
  const factory = parse(transport, { sourceType: 'module' });
  const imports = entry.program.body.filter(node => node.type === 'ImportDeclaration');
  requireContract(imports.length === 1 && imports[0].source.value === './creaFrontissa.js'
    && imports[0].specifiers.some(s => s.type === 'ImportSpecifier' && named(s.imported, 'creaFrontissa') && named(s.local, 'creaFrontissa')),
  'client.js ha de consumir la frontissa local comprovada');
  requireContract(!factory.program.body.some(node => node.type === 'ImportDeclaration'), 'Transport amb dependència externa no auditada');
  const allowedStatements = new Set(['ImportDeclaration', 'VariableDeclaration', 'ExportNamedDeclaration']);
  for (const ast of [entry, factory]) {
    requireContract(ast.program.body.every(node => allowedStatements.has(node.type)), 'Efecte executable al nivell de mòdul');
    requireContract(nodes(ast, node => node.type === 'ImportExpression' || node.type === 'Import'
      || (node.type === 'CallExpression' && (named(node.callee, 'fetch') || named(node.callee, 'eval')
      || (node.callee.type === 'MemberExpression' && ['fetch', 'eval'].includes(node.callee.property?.name))))).length === 0,
    'El transport ha de passar només pel fetchImpl observat');
  }
  const declarations = entry.program.body.filter(node => node.type === 'ExportNamedDeclaration')
    .flatMap(node => node.declaration?.type === 'VariableDeclaration' ? node.declaration.declarations : []);
  const writes = declarations.find(node => named(node.id, 'ESCRIPTURES_PERMESES'))?.init;
  requireContract(writes?.type === 'CallExpression' && writes.arguments.length === 1
    && writes.callee?.type === 'MemberExpression' && !writes.callee.computed
    && named(writes.callee.object, 'Object') && named(writes.callee.property, 'freeze')
    && writes.arguments[0]?.type === 'ArrayExpression' && writes.arguments[0].elements.length === 0,
  'ESCRIPTURES_PERMESES ha de ser un array buit immutable');
  const calls = nodes(factory, node => node.type === 'CallExpression' && named(node.callee, 'fetchImpl'));
  requireContract(calls.length === 1, 'Cal un únic punt de transport fetchImpl');
  const options = calls[0].arguments[1];
  requireContract(options?.type === 'ObjectExpression'
    && options.properties.every(prop => prop.type === 'ObjectProperty' && !prop.computed),
  'Opcions de transport literals sense spreads ni claus calculades');
  const keys = options.properties.map(keyOf);
  requireContract(new Set(keys).size === keys.length, 'Opcions de transport duplicades');
  for (const [key, expected] of Object.entries({ method: 'GET', credentials: 'omit', redirect: 'error' })) {
    const value = options.properties.find(prop => keyOf(prop) === key)?.value;
    requireContract(value?.type === 'StringLiteral' && value.value === expected, `El transport exigix ${key}: ${expected}`);
  }
  requireContract(nodes(entry, node => node.type === 'CallExpression' && named(node.callee, 'creaFrontissa')
    && node.arguments.length === 1 && named(node.arguments[0], 'CONFIGURACIO')).length === 1,
  'L’entrada ha de construir la frontissa amb la configuració interna');
}

const descriptor = () => ({ enabled: true, captureId: 'gate-synthetic-v1', path: '/sample', params: ['q'],
  maxBytes: 128, timeoutMs: 100, decode: raw => {
    if (typeof raw.name !== 'string') throw new Error('INVALID_DTO');
    return { name: raw.name };
  } });
const jsonResponse = body => new Response(body, { headers: { 'content-type': 'application/json' } });

/** Executes the real factory with an observed, offline transport. No production resource is enabled. */
export async function auditFrontissa(root = ROOT) {
  const clientText = fs.readFileSync(path.join(root, CLIENT), 'utf8');
  const factoryText = fs.readFileSync(path.join(root, TRANSPORT), 'utf8');
  validateFrontissaStructure(clientText, factoryText);
  const url = (file, text) => `${pathToFileURL(path.join(root, file)).href}?audit=${createHash('sha256').update(text).digest('hex')}`;
  const savedFetch = globalThis.fetch;
  let unexpectedFetch = 0;
  globalThis.fetch = () => { unexpectedFetch++; throw new Error('NETWORK_NOT_ALLOWED_IN_GATE'); };
  try {
    const { creaFrontissa } = await import(url(TRANSPORT, factoryText));
    const { llig, ESCRIPTURES_PERMESES } = await import(url(CLIENT, clientText));
    assert.ok(Object.isFrozen(ESCRIPTURES_PERMESES) && ESCRIPTURES_PERMESES.length === 0);
    for (const name of ['/perfil', 'sample', 'https://evil.test/'])
      await assert.rejects(() => llig(name), { code: 'UNKNOWN_RESOURCE' });
    const observations = [];
    const observedFetch = async (request, options) => {
      observations.push({ request, options });
      return jsonResponse('{"name":"A","secret":"not-a-dto-field"}');
    };
    const setup = (overrides = {}, fetchImpl = observedFetch) => creaFrontissa({
      apiOrigin: 'https://api.example.test', allowedOrigins: ['https://api.example.test'],
      resources: { sample: descriptor() }, fetchImpl, ...overrides
    });
    const read = setup();
    assert.deepEqual(await read('sample', { q: 'text' }), { name: 'A' });
    assert.equal(observations.length, 1);
    assert.equal(observations[0].request, 'https://api.example.test/sample?q=text');
    for (const [key, expected] of Object.entries({ method: 'GET', credentials: 'omit', redirect: 'error' }))
      assert.equal(observations[0].options[key], expected);
    assert.equal(observations[0].options.headers.Accept, 'application/json');
    const baselineCalls = observations.length;
    for (const name of ['unknown', 'https://evil.test/', '//evil.test/'])
      await assert.rejects(() => read(name), { code: 'UNKNOWN_RESOURCE' });
    await assert.rejects(() => read('sample', { unauthorized: 'x' }), { code: 'INVALID_QUERY' });
    for (const apiOrigin of ['http://api.example.test', 'https://evil.test', 'https://user:pass@api.example.test', 'https://api.example.test/path'])
      assert.throws(() => setup({ apiOrigin }), { code: 'INVALID_ORIGIN' });
    assert.throws(() => setup({ allowedOrigins: [] }), { code: 'INVALID_ORIGIN' });
    for (const resourcePath of ['//evil.test/path', '/\\evil.test/path', '/sample?q=unexpected'])
      assert.throws(() => setup({ resources: { sample: { ...descriptor(), path: resourcePath } } }), { code: 'INVALID_RESOURCE' });
    const cancelled = new AbortController(); cancelled.abort();
    await assert.rejects(() => read('sample', {}, { signal: cancelled.signal }), { code: 'CANCELLED' });
    assert.equal(observations.length, baselineCalls, 'Els casos denegats no poden arribar al transport');
    for (const body of ['{', '{}'])
      await assert.rejects(() => setup({}, async () => jsonResponse(body))('sample'), { code: 'INVALID_PAYLOAD' });
    await assert.rejects(() => setup({}, async () => jsonResponse('x'.repeat(129)))('sample'), { code: 'PAYLOAD_TOO_LARGE' });
    await assert.rejects(() => setup({}, async () => new Response('html'))('sample'), { code: 'INVALID_PAYLOAD' });
    assert.equal(unexpectedFetch, 0, 'No es permet xarxa real en la porta');
    return { ok: true, checked: ['client.js', 'creaFrontissa.js'], transportCalls: observations.length };
  } finally { globalThis.fetch = savedFetch; }
}

if (esMain(import.meta.url)) {
  auditFrontissa().then(() => {
    console.log('✅ tractor-frontissa: entrada tancada, transport GET sense credencials, origen i DTO verificats.');
  }).catch(error => {
    console.error('❌ tractor-frontissa: contracte d’entrada o transport incomplit.');
    console.error(error.message);
    process.exitCode = 1;
  });
}
