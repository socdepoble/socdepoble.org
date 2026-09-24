import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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
  ['unobserved fetch', source => source.replace('await fetchImpl(url.href,', 'await fetch(url.href,')],
]) test(`AST rejects ${name} despite reassuring source literals`, () => {
  assert.throws(() => validateFrontissaStructure(client, mutation(transport)));
});

test('entry empty write catalog must really be frozen and linked to the audited transport', () => {
  for (const changed of [
    client.replace('ESCRIPTURES_PERMESES = Object.freeze([])', 'ESCRIPTURES_PERMESES = []'),
    client.replace('ESCRIPTURES_PERMESES = Object.freeze([])', "ESCRIPTURES_PERMESES = Object.freeze(['write'])"),
    client.replace("'./creaFrontissa.js'", "'./otherFactory.js'"),
  ]) assert.throws(() => validateFrontissaStructure(changed, transport));
});

for (const [name, editClient, editTransport] of [
  ['origin allowlist bypass', value => value, value => value.replace('!allowedOrigins.includes(base.origin)', 'false')],
  ['DTO decoder bypass', value => value, value => value.replace('resource.decode(JSON.parse(text))', 'JSON.parse(text)')],
  ['production catalog bypass', value => value.replace("if (!Object.hasOwn(CONFIGURACIO.resources, recurs)) throw new ErrorDades('UNKNOWN_RESOURCE');", 'return {};'), value => value],
]) test(`runtime probes detect ${name} with intact transport AST`, async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-frontissa-mutant-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, DIR), { recursive: true });
  fs.writeFileSync(path.join(root, 'package.json'), '{"type":"module"}');
  fs.writeFileSync(path.join(root, DIR, 'client.js'), editClient(client));
  fs.writeFileSync(path.join(root, DIR, 'creaFrontissa.js'), editTransport(transport));
  validateFrontissaStructure(editClient(client), editTransport(transport));
  const fetchBefore = globalThis.fetch;
  await assert.rejects(() => auditFrontissa(root));
  assert.equal(globalThis.fetch, fetchBefore, 'gate restores the fetch guard even after failure');
});
