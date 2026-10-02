import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = process.env.SDP_TEST_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const studio = path.join(os.homedir(), '.studio/php-bin');
const candidates = fs.existsSync(studio) ? fs.readdirSync(studio).sort().reverse().map(v => path.join(studio, v, 'php')) : [];
const php = [process.env.PHP_BIN, 'php', ...candidates].filter(Boolean).find(p => spawnSync(p, ['-v']).status === 0);
assert.ok(php, 'PHP és obligatori per a la porta del traductor (PHP_BIN o WordPress Studio), amb PDO SQLite.');
const options = {};
const fixture = process.env.SDP_TEST_FIXTURE || path.join(root, 'tests/fixtures/enxufe-traduccio.php');
const module = process.env.SDP_TEST_MODULE || path.join(root, 'wordpress-plugin/includes/traduccio.php');
function run(cas = {}) {
  const p = spawnSync(php, [fixture, module], { input: JSON.stringify(cas), encoding: 'utf8', timeout: 15000 });
  assert.equal(p.status, 0, p.stderr || p.stdout);
  assert.equal(p.stderr, '');
  assert.ok(!p.stdout.includes('fixture-secret'), 'cap clau en respostes, cache ni diagnòstic');
  return JSON.parse(p.stdout);
}
const body = (textos = ['Bon dia'], extra = {}) => ({ textos, desti: 'ES', origen: 'CA', format: 'text', ...extra });

test('una sola ruta pública POST amb comprovació de permisos', options, () => {
  const r = run();
  assert.equal(r.routes['socdepoble/v1/traduir'].methods, 'POST');
  assert.equal(r.routes['socdepoble/v1/traduir'].permission_callback, 'socdepoble_enxufe_traduccio_permis');
  assert.equal(Object.keys(r.routes).length, 1);
});
test('cache per text: deduplica, conserva ordre/buits i factura només els nous', options, () => {
  const r = run({ steps: [{ body: body(['Bon dia', '', 'Poble', 'Bon dia']) }, { body: body(['Poble', 'Bon dia']) }, { body: body(['Poble', 'Nit']) }] });
  assert.deepEqual(r.responses[0].data.traduccions, ['ES:Bon dia', '', 'ES:Poble', 'ES:Bon dia']);
  assert.equal(r.responses[1].data.cache, true);
  assert.equal(r.responses[2].data.cache, false);
  assert.deepEqual(r.calls.map(c => c.body.text), [['Bon dia', 'Poble'], ['Nit']]);
  assert.equal(r.budget.diari, 15);
  assert.ok(Object.entries(r.cache).filter(([k]) => !k.startsWith('sdp_tr_ip_') && !k.startsWith('sdp_tr_pause_')).every(([,v]) => v.ttl === 604800));
});
test('DeepL CA explícit, Free/Pro, format HTML, límits HTTP i aïllament del cache', options, () => {
  const r = run({ steps: [{}, { body: body(['Bon dia'], { desti: 'FR' }) }, { body: body(['Bon dia'], { format: 'html' }) }, { key: 'different-key' }] });
  assert.equal(r.calls.length, 4);
  assert.equal(r.calls[0].url, 'https://api-free.deepl.com/v2/translate');
  assert.equal(r.calls[3].url, 'https://api.deepl.com/v2/translate');
  assert.equal(r.calls[0].body.source_lang, 'CA');
  assert.equal(r.calls[0].headers.Authorization, 'DeepL-Auth-Key <redactada>');
  assert.equal(r.calls[2].body.tag_handling, 'html');
  assert.equal(r.calls[0].body.tag_handling, undefined);
  assert.equal(r.calls[0].redirection, 0);
  assert.equal(r.calls[0].timeout, 15);
  assert.equal(r.calls[0].limit_response_size, 131072);
});
test('constant prioritza entorn; clau absent o amb CRLF falla sense xarxa', options, () => {
  assert.equal(run({ constants: { DEEPL_API_KEY: 'constant-pro-key' } }).calls[0].url, 'https://api.deepl.com/v2/translate');
  for (const key of ['', 'bad\r\nInjected']) {
    const r = run({ key });
    assert.equal(r.responses[0].code, 'sdp_traduccio_sense_clau');
    assert.equal(r.calls.length, 0);
  }
});
for (const [name, change, status] of [
  ['text escalar', { textos: 'Bon dia' }, 400], ['text numèric', { textos: [1] }, 400],
  ['lot buit', { textos: [] }, 400], ['51 textos', { textos: Array(51).fill('a') }, 400],
  ['només blancs', { textos: [' ', ''] }, 400], ['destí fals', { desti: 'ZZ' }, 400],
  ['origen diferent', { origen: 'ES' }, 400], ['format fals', { format: 'xml' }, 400],
  ['URL injectada', { url: 'http://evil.test' }, 400], ['5001 caràcters', { textos: ['é'.repeat(5001)] }, 413]
]) test(`entrada rebutjada: ${name}`, options, () => {
  const r = run({ steps: [{ body: { ...body(), ...change } }] });
  assert.equal(r.responses[0].data.status, status);
  assert.equal(r.calls.length, 0);
});
test('JSON malformat, objecte que imita un array i cos massa gran rebutjats', options, () => {
  for (const [raw, status] of [['{',400], ['[]',400], ['{"textos":{"0":"text"}}',400], [' '.repeat(32769),413]]) {
    const r = run({ steps: [{ raw }] });
    assert.equal(r.responses[0].data.status, status);
    assert.equal(r.calls.length, 0);
  }
});
test('mateix origen i CLI permesos, cross-site i formularis bloquejats', options, () => {
  for (const origin of ['https://evil.test', 'null', 'http://host.example', 'https://host.example:444']) {
    const r = run({ steps: [{ headers: { origin } }] });
    assert.equal(r.responses[0].data.status, 403); assert.equal(r.calls.length, 0);
  }
  assert.equal(run({ steps: [{ headers: { origin: '' } }] }).responses[0].status, 200);
  assert.equal(run({ steps: [{ headers: { 'content-type': 'application/x-www-form-urlencoded' } }] }).responses[0].data.status, 415);
  assert.equal(run({ steps: [{ headers: { 'sec-fetch-site': 'cross-site' } }] }).responses[0].data.status, 403);
});
test('pressupost durable resistix evicció; es reserva abans de timeout, cache no gasta', options, () => {
  const r = run({ constants: { SDP_TRADUCCIO_LIMIT_DIARI: 10 }, steps: [{ transport: true }, { evict: true }] });
  assert.equal(r.responses[0].data.status, 502);
  assert.equal(r.responses[1].data.status, 429);
  assert.equal(r.calls.length, 1);
  assert.equal(r.budget.diari, 7);
  const cached = run({ constants: { SDP_TRADUCCIO_LIMIT_DIARI: 7 }, steps: [{}, {}] });
  assert.equal(cached.responses[1].data.cache, true);
  for (const constants of [{ SDP_TRADUCCIO_LIMIT_DIARI: 0 }, { SDP_TRADUCCIO_LIMIT_MENSUAL: 6 }, { SDP_TRADUCCIO_LIMIT_DIARI: -1 }]) {
    assert.equal(run({ constants }).calls.length, 0);
  }
});
test('fallades de persistència i lock ocupat impedixen consumir; lock caducat es recupera', options, () => {
  for (const step of [{ failSql: true }, { failTransient: true }, { lock: `${Math.floor(Date.now()/1000)+90}:other` }]) {
    const r = run({ steps: [step] }); assert.equal(r.calls.length, 0); assert.equal(r.responses[0].data.status, 503);
  }
  const r = run({ steps: [{ lock: '1:stale' }] });
  assert.equal(r.calls.length, 1); assert.equal(r.lock, null);
});
test('petició simultània no duplica DeepL; finally allibera també en errors', options, () => {
  const r = run({ steps: [{ reentry: true }, {}] });
  assert.equal(r.nested.code, 'sdp_traduccio_ocupada'); assert.equal(r.calls.length, 1); assert.equal(r.lock, null);
  assert.equal(run({ steps: [{ transport: true }] }).lock, null);
});
test('ritme de client: petició31 limitada, X-Forwarded-For no la reinicia', options, () => {
  const r = run({ steps: Array.from({ length: 31 }, (_, i) => ({ body: body([`text${i}`]), headers: { 'x-forwarded-for': `192.0.2.${i}` } })) });
  assert.equal(r.calls.length, 30); assert.equal(r.responses[30].code, 'sdp_traduccio_limit');
});
for (const status of [302, 400, 403, 429, 456, 500, 504]) test(`DeepL ${status}: error controlat, sense cache ni clau`, options, () => {
  const r = run({ steps: [{ status, upstreamRaw: 'fixture-secret:fx' }] });
  assert.equal(r.responses[0].data.status, [429,456].includes(status) ? 429 : 502);
  assert.equal(Object.keys(r.cache).filter(k => !k.startsWith('sdp_tr_ip_') && !k.startsWith('sdp_tr_pause_')).length, 0);
  assert.equal(r.lock, null);
});
test('resposta malformada o lot incomplet no contaminen el cache', options, () => {
  for (const upstream of [{}, { translations: [] }, { translations: [{ text: 2 }] }, { translations: [{ text: '' }] }, { translations: [{ text: 'a' }, { text: 'b' }] }]) {
    const r = run({ steps: [{ upstream }] });
    assert.equal(r.responses[0].data.status, 502);
    assert.equal(Object.keys(r.cache).filter(k => !k.startsWith('sdp_tr_ip_') && !k.startsWith('sdp_tr_pause_')).length, 0);
  }
});


test('lots independents poden traduir en paral·lel; quota de DeepL obri circuit curt', options, () => {
  const r = run({ steps: [{ reentry: { body: body(['Bona nit']) } }] });
  assert.equal(r.calls.length, 2);
  assert.equal(r.nested.status, 200);
  assert.equal(r.budget.diari, 15);
  const limited = run({ steps: [{ status: 456 }, { body: body(['Altra pàgina']) }] });
  assert.equal(limited.calls.length, 1);
  assert.equal(limited.responses[1].code, 'sdp_traduccio_limit');
});

test('absència real de capçalera (null WordPress) manté el contracte CLI', options, () => {
  assert.equal(run({steps:[{headers:{origin:null}}]}).responses[0].status,200);
});
test('el pressupost no es reinicia per un add_option que faria upsert', options, () => {
  const r=run({steps:[{}, {body:body(['Nit'])}]});
  assert.equal(r.budget.diari,10);
});
test('403 obri pausa: no crema quota repetidament per una clau invàlida', options, () => {
  const r=run({steps:[{status:403}, {body:body(['Nit'])}]});
  assert.equal(r.calls.length,1);
  assert.deepEqual(r.responses.map(x=>x.data.status),[502,502]);
});

test('transport fallit obri pausa sense facturar un segon intent', options, () => {
  const r = run({ steps: [{ transport: true }, { body: body(['Nit']) }] });
  assert.equal(r.calls.length, 1);
  assert.deepEqual(r.responses.map(x => x.data.status), [502, 502]);
  assert.equal(r.budget.diari, 7);
});


test('IPv4 i IPv6 vàlides tenen comptadors diferents, sense IP en clar al cache', options, () => {
  const addresses = ['192.0.2.10', '2001:db8::10'];
  const steps = addresses.flatMap((remote_addr, a) => Array.from({ length: 31 }, (_, i) => ({ remote_addr, body: body([`client${a}-${i}`]) })));
  const r = run({ steps });
  assert.equal(r.calls.length, 60);
  assert.equal(r.responses[30].code, 'sdp_traduccio_limit');
  assert.equal(r.responses[61].code, 'sdp_traduccio_limit');
  const keys = Object.keys(r.cache).filter(k => k.startsWith('sdp_tr_ip_'));
  assert.equal(keys.length, 2);
  for (const key of keys) assert.match(key, /^sdp_tr_ip_[a-f0-9]{64}$/);
  for (const address of addresses) assert.ok(!JSON.stringify(r.cache).includes(address));
});

test('valors REMOTE_ADDR invàlids compartixen un sol comptador', options, () => {
  const r = run({ steps: Array.from({ length: 31 }, (_, i) => ({ remote_addr: `invalid-client-${i}`, body: body([`invalid-${i}`]) })) });
  assert.equal(r.calls.length, 30);
  assert.equal(r.responses[30].code, 'sdp_traduccio_limit');
  assert.equal(Object.keys(r.cache).filter(k => k.startsWith('sdp_tr_ip_')).length, 1);
});

test('adreces absents, buides o no escalars fallen al mateix comptador sense avisos PHP', options, () => {
  const addresses = [null, '', [], { ip: '192.0.2.1' }, 123, 'bad\\value'];
  const r = run({ steps: Array.from({ length: 31 }, (_, i) => ({ remote_addr: addresses[i % addresses.length], body: body([`malformed-${i}`]) })) });
  assert.equal(r.calls.length, 30);
  assert.equal(r.responses[30].code, 'sdp_traduccio_limit');
  assert.equal(Object.keys(r.cache).filter(k => k.startsWith('sdp_tr_ip_')).length, 1);
});
