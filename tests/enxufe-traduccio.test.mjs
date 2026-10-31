import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
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
/* IDEA-31 · Els extrems d'Apertium i el nom de les entrades de cache, calculat
   com el PHP (wp_salt de la fixture): fixa les empremtes per proveïdor.
   Cicle 2 (G10): la beta és el primer extrem; la principal, la reserva. */
const BETA = 'https://beta.apertium.org/apy/translate';
const PRINCIPAL = 'https://apertium.org/apy/translate';
const LLIURE = 'https://lliure.example/translate';
const hmac = (text) => crypto.createHmac('sha256', 'test-salt-only').update(text).digest('hex');
const nomCache = (desti, format, text, empremta) => `sdp_tr_${hmac(JSON.stringify([2, 'CA', desti, format, text, empremta]))}`;
const traduccionsGuardades = (r) => Object.keys(r.cache).filter((k) => !k.startsWith('sdp_tr_ip_') && !k.startsWith('sdp_tr_pause_'));

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
/* IDEA-31 (ordre del Mestre 261029): sense clau de DeepL ja no hi ha 503
   sense_clau, sinó el proveïdor lliure. Una clau amb CRLF no val i també hi va. */
test('constant prioritza entorn; clau absent o amb CRLF passa al proveïdor lliure, mai a DeepL', options, () => {
  assert.equal(run({ constants: { DEEPL_API_KEY: 'constant-pro-key' } }).calls[0].url, 'https://api.deepl.com/v2/translate');
  for (const key of ['', 'bad\r\nInjected']) {
    const r = run({ key });
    assert.equal(r.responses[0].status, 200);
    assert.deepEqual(r.calls.map((c) => c.url), [BETA]);
    assert.equal(r.calls[0].headers.Authorization, undefined);
  }
});
/* Cicle 2 · DeepL admet GL i EU com a target_lang (documentació oficial de
   developers.deepl.com, d'ús general des del 8-1-2026): amb clau, hi van tots dos. */
test('amb DEEPL_API_KEY, GL i EU van a DeepL amb target_lang GL i EU (i DE, com sempre)', options, () => {
  const r = run({ steps: ['GL', 'EU', 'DE'].map((desti) => ({ body: body(['Bon dia'], { desti }) })) });
  assert.deepEqual(r.responses.map((x) => x.data.traduccions), [['GL:Bon dia'], ['EU:Bon dia'], ['DE:Bon dia']]);
  assert.deepEqual(r.calls.map((c) => [c.url, c.body.source_lang, c.body.target_lang]), [
    ['https://api-free.deepl.com/v2/translate', 'CA', 'GL'], ['https://api-free.deepl.com/v2/translate', 'CA', 'EU'], ['https://api-free.deepl.com/v2/translate', 'CA', 'DE']
  ]);
});
test('llista tancada de destins: ES, EN-GB, FR, DE, GL i EU; cap altra variant', options, () => {
  const bons = run({ key: '', constants: { SDP_TRADUCCIO_URL: LLIURE }, steps: ['ES', 'EN-GB', 'FR', 'DE', 'GL', 'EU'].map((desti) => ({ body: body([`Bon dia ${desti}`], { desti }) })) });
  assert.deepEqual(bons.responses.map((x) => x.status), [200, 200, 200, 200, 200, 200]);
  const dolents = run({ key: '', steps: ['gl', 'eu', 'EU-ES', 'GL-ES', 'constructor', 'CA'].map((desti) => ({ body: body(['Bon dia'], { desti }) })) });
  assert.deepEqual(dolents.responses.map((x) => x.data.status), [400, 400, 400, 400, 400, 400]);
  assert.equal(dolents.calls.length, 0);
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

/* Decisió del Mestre 261030 §2: un termini o un error de xarxa puntual no
   bloqueja 60 s; la petició següent torna a provar (i es factura, com sempre). */
test('transport fallit: 502 sense pausa; la petició següent torna a provar', options, () => {
  const r = run({ steps: [{ transport: true }, { body: body(['Nit']) }] });
  assert.equal(r.calls.length, 2);
  assert.deepEqual(r.responses.map(x => x.status ?? x.data.status), [502, 200]);
  assert.equal(r.budget.diari, 10);
  assert.equal(Object.keys(r.cache).filter((k) => k.startsWith('sdp_tr_pause_')).length, 0, 'cap transient de pausa');
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

/* ───────────── IDEA-31 · proveïdor lliure sense clau (QA-R2-13) ───────────── */

test('sense clau: Apertium amb cat|spa, cat|eng, cat|fra i cat|glg, beta primer, format txt, una crida de formulari per text i l’agent honest del Mas', options, () => {
  const r = run({ key: '', steps: [{ body: body(['Bon dia', 'Poble']) }, { body: body(['Bon dia'], { desti: 'EN-GB' }) }, { body: body(['Bon dia'], { desti: 'FR' }) },
    { body: body(['Bon dia'], { desti: 'GL' }) }] });
  assert.deepEqual(r.responses.map((x) => x.status), [200, 200, 200, 200]);
  assert.deepEqual(r.responses.map((x) => x.data.traduccions), [['spa:Bon dia', 'spa:Poble'], ['eng:Bon dia'], ['fra:Bon dia'], ['glg:Bon dia']]);
  assert.deepEqual(r.responses.map((x) => [x.data.origen, x.data.desti, x.data.cache]), [['CA', 'ES', false], ['CA', 'EN-GB', false], ['CA', 'FR', false], ['CA', 'GL', false]]);
  assert.equal(r.responses[0].headers['Cache-Control'], 'no-store');
  assert.deepEqual(r.calls.map((c) => [c.url, c.body.langpair, c.body.q]), [
    [BETA, 'cat|spa', 'Bon dia'], [BETA, 'cat|spa', 'Poble'], [BETA, 'cat|eng', 'Bon dia'], [BETA, 'cat|fra', 'Bon dia'], [BETA, 'cat|glg', 'Bon dia']
  ]);
  for (const c of r.calls) {
    assert.equal(c.body.markUnknown, 'no');
    assert.equal(c.body.format, 'txt', 'C6: el text pla porta format=txt (l’APy, sense format, el tractaria com a HTML)');
    assert.equal(c.headers['Content-Type'], 'application/x-www-form-urlencoded; charset=UTF-8');
    assert.equal(c.headers.Authorization, undefined);
    assert.equal(c['user-agent'], 'SocDePoble-Translation/1.1');
    assert.equal(c.redirection, 0);
    assert.equal(c.limit_response_size, 131072);
    assert.equal(c.timeout, 12);
  }
});

test('sense clau, format html: Apertium rep format=html; el text pla amb angles, entitats, acrònims i URL hi va tal qual amb format=txt', options, () => {
  const r = run({ key: '', steps: [{ body: body(['<p>Bon <strong>dia</strong></p>'], { format: 'html' }) }] });
  assert.equal(r.calls[0].body.format, 'html');
  assert.deepEqual(r.responses[0].data.traduccions, ['spa:<p>Bon <strong>dia</strong></p>']);
  const literal = 'Si a < b i c > d, l’ONU escriu &amp; a https://socdepoble.org/page/fediversity?a=1&b=2';
  const txt = run({ key: '', steps: [{ body: body([literal], { desti: 'FR' }) }] });
  assert.deepEqual([txt.calls[0].body.q, txt.calls[0].body.format], [literal, 'txt']);
  assert.deepEqual(txt.responses[0].data.traduccions, [`fra:${literal}`]);
});

test('la beta d’Apertium cau (5xx o transport): l’extrem principal, i la resta de la petició hi va directa, sense pausa', options, () => {
  for (const fail of [500, 503, 'transport']) {
    const r = run({ key: '', steps: [{ body: body(['Bon dia', 'Poble']), fail: { [BETA]: fail } }] });
    assert.deepEqual(r.calls.map((c) => c.url), [BETA, PRINCIPAL, PRINCIPAL], String(fail));
    assert.deepEqual(r.responses[0].data.traduccions, ['spa:Bon dia', 'spa:Poble']);
    assert.equal(Object.keys(r.cache).filter((k) => k.startsWith('sdp_tr_pause_')).length, 0);
  }
  // Un 4xx no és una caiguda: no es reintenta en un altre extrem.
  const refusat = run({ key: '', steps: [{ fail: { [BETA]: 400 } }] });
  assert.deepEqual(refusat.calls.map((c) => c.url), [BETA]);
  assert.equal(refusat.responses[0].code, 'sdp_traduccio_proveidor');
  // 429 respecta el límit del servei: pausa i cap crida a l'extrem principal.
  const limitat = run({ key: '', steps: [{ fail: { [BETA]: 429 } }, { body: body(['Nit']) }] });
  assert.deepEqual(limitat.calls.map((c) => c.url), [BETA]);
  assert.deepEqual(limitat.responses.map((x) => x.code), ['sdp_traduccio_limit', 'sdp_traduccio_limit']);
});

test('GL només a la beta: si cau, 502 net i mai l’extrem principal (400 «That pair is not installed»)', options, () => {
  for (const fail of [500, 503, 'transport']) {
    const r = run({ key: '', steps: [{ body: body(['Bon dia'], { desti: 'GL' }), fail: { [BETA]: fail } }] });
    assert.deepEqual(r.calls.map((c) => c.url), [BETA], String(fail));
    assert.equal(r.responses[0].code, 'sdp_traduccio_proveidor');
    assert.equal(traduccionsGuardades(r).length, 0);
  }
  // Amb un proveïdor LibreTranslate configurat, el gallec continua a Apertium.
  const amb = run({ key: '', constants: { SDP_TRADUCCIO_URL: LLIURE }, steps: [{ body: body(['Bon dia'], { desti: 'GL' }) }] });
  assert.deepEqual(amb.calls.map((c) => [c.url, c.body.langpair]), [[BETA, 'cat|glg']]);
});

test('els dos extrems d’Apertium caiguts: 502 sense cache; ni el transport ni un 5xx obrin la pausa', options, () => {
  const caiguts = run({ key: '', steps: [{ fail: { [BETA]: 'transport', [PRINCIPAL]: 'transport' } }, { body: body(['Nit']) }] });
  assert.deepEqual(caiguts.calls.map((c) => c.url), [BETA, PRINCIPAL, BETA]);
  assert.deepEqual(caiguts.responses.map((x) => x.status ?? x.data.status), [502, 200]);
  assert.equal(traduccionsGuardades(caiguts).length, 1, 'només la traducció de la segona petició');
  assert.equal(caiguts.lock, null);
  const fail = { [BETA]: 500, [PRINCIPAL]: 502 };
  const errors = run({ key: '', steps: [{ fail }, { body: body(['Nit']), fail }] });
  assert.equal(errors.calls.length, 4, 'un 5xx no obri la pausa, com amb DeepL');
  assert.equal(traduccionsGuardades(errors).length, 0);
});

test('SDP_TRADUCCIO_APERTIUM_URL https és l’únic extrem; una constant que no és https sense credencials s’ignora', options, () => {
  const propi = 'https://apertium.example/apy/translate';
  const r = run({ key: '', constants: { SDP_TRADUCCIO_APERTIUM_URL: propi }, steps: [{}, { body: body(['Nit']), fail: { [propi]: 500 } }] });
  assert.deepEqual(r.calls.map((c) => c.url), [propi, propi]);
  assert.deepEqual(r.responses.map((x) => x.status ?? x.data.status), [200, 502]);
  for (const invalida of ['http://apertium.example/apy/translate', 'https://usuari:contrasenya@apertium.example/apy', 'https://usuari@apertium.example/apy',
    'ftp://apertium.example/apy', 'https://apertium.example/a b', "https://apertium.example/\r\nx", 'https://', '//apertium.example/apy', '', 42]) {
    assert.deepEqual(run({ key: '', constants: { SDP_TRADUCCIO_APERTIUM_URL: invalida } }).calls.map((c) => c.url), [BETA], JSON.stringify(invalida));
  }
  const gallec = run({ key: '', constants: { SDP_TRADUCCIO_APERTIUM_URL: propi }, steps: [{ body: body(['Bon dia'], { desti: 'GL' }) }] });
  assert.deepEqual(gallec.calls.map((c) => [c.url, c.body.langpair]), [[propi, 'cat|glg']], 'també substituïx la beta del gallec');
});

test('DE i EU sense SDP_TRADUCCIO_URL vàlida: 503 estable («no disponible» al client, D-3), sense xarxa, ritme ni pressupost', options, () => {
  for (const desti of ['DE', 'EU']) {
    for (const constants of [{}, { SDP_TRADUCCIO_URL: 'http://lliure.example/translate' }, { SDP_TRADUCCIO_URL: 'https://clau:x@lliure.example/translate' }]) {
      const r = run({ key: '', constants, steps: [{ body: body(['Bon dia'], { desti }) }] });
      assert.equal(r.responses[0].code, 'sdp_traduccio_sense_clau', `${desti} ${JSON.stringify(constants)}`);
      assert.equal(r.responses[0].data.status, 503);
      assert.equal(r.calls.length, 0);
      assert.equal(Object.keys(r.cache).length, 0);
      assert.equal(r.budget, null);
    }
  }
});

/* Gauntlet 261030 (Fase 3, TC3.1) · Els destins declarats (traductor-llengues
   de marcatge.php) són EXACTAMENT els que el servidor servix: cap destí
   declarat torna el 503 sense_clau, i cap destí servit queda fora (el client
   no el demanaria). Amb la clau de DeepL, els sis; sense, Apertium; amb
   SDP_TRADUCCIO_URL, també EU i DE. En l'ordre del menú. */
test('TC3.1 · destins declarats = destins servits, en l’ordre del menú, per a cada configuració', options, () => {
  const ORDRE = ['ES', 'GL', 'EU', 'EN-GB', 'FR', 'DE'];
  const casos = [
    [{}, ORDRE],
    [{ key: '' }, ['ES', 'GL', 'EN-GB', 'FR']],
    [{ key: '', constants: { SDP_TRADUCCIO_URL: 'http://lliure.example/translate' } }, ['ES', 'GL', 'EN-GB', 'FR']],
    [{ key: '', constants: { SDP_TRADUCCIO_URL: LLIURE } }, ORDRE],
  ];
  for (const [cas, esperats] of casos) {
    const r = run({ ...cas, steps: ORDRE.map((desti) => ({ body: body([`Bon dia ${desti}`], { desti }) })) });
    assert.deepEqual(r.destins, esperats, JSON.stringify(cas));
    const servits = ORDRE.filter((_, i) => r.responses[i]?.code !== 'sdp_traduccio_sense_clau');
    assert.deepEqual(servits, esperats, `servits ${JSON.stringify(cas)}`);
  }
});

/* G3: el `target` del proveïdor compatible amb LibreTranslate és el del destí. */
test('EU amb un extrem compatible amb LibreTranslate: target eu, mai el de fix', options, () => {
  const r = run({ key: '', constants: { SDP_TRADUCCIO_URL: LLIURE }, steps: [{ body: body(['Bon dia', 'Poble'], { desti: 'EU' }) }, { body: body(['Bon dia'], { desti: 'DE' }) }] });
  assert.deepEqual(r.responses.map((x) => x.data.traduccions), [['eu:Bon dia', 'eu:Poble'], ['de:Bon dia']]);
  assert.deepEqual(r.calls.map((c) => [c.url, c.body.target]), [[LLIURE, 'eu'], [LLIURE, 'de']]);
  assert.ok(r.cache[nomCache('EU', 'text', 'Bon dia', hmac(`sdp-lliure-v1|${LLIURE}`))], 'cache separada per destí');
});

test('DE amb un extrem compatible amb LibreTranslate: un lot JSON, clau opcional al cos i mai fora de la crida', options, () => {
  const r = run({ key: '', constants: { SDP_TRADUCCIO_URL: LLIURE, SDP_TRADUCCIO_URL_CLAU: 'fixture-secret-lliure' }, steps: [
    { body: body(['Bon dia', 'Poble'], { desti: 'DE' }) }, { body: body(['<b>Nit</b>'], { desti: 'DE', format: 'html' }) }, {}
  ] });
  assert.deepEqual(r.responses[0].data.traduccions, ['de:Bon dia', 'de:Poble']);
  assert.deepEqual(r.calls[0].body, { q: ['Bon dia', 'Poble'], source: 'ca', target: 'de', format: 'text', api_key: '<redactada>' });
  assert.equal(r.calls[0].url, LLIURE);
  assert.equal(r.calls[0].headers['Content-Type'], 'application/json');
  assert.equal(r.calls[0]['user-agent'], 'SocDePoble-Translation/1.1');
  assert.equal(r.calls[0].redirection, 0);
  assert.equal(r.calls[1].body.format, 'html');
  // ES continua anant a Apertium encara que hi haja un extrem per a DE.
  assert.equal(r.calls[2].url, BETA);
  assert.equal(run({ key: '', constants: { SDP_TRADUCCIO_URL: LLIURE }, steps: [{ body: body(['Nit'], { desti: 'DE' }) }] }).calls[0].body.api_key, undefined);
  for (const upstream of [{}, { translatedText: 'de:Nit' }, { translatedText: [] }, { translatedText: ['a', 'b'] }, { translatedText: [''] }, { translatedText: [3] }]) {
    const dolenta = run({ key: '', constants: { SDP_TRADUCCIO_URL: LLIURE }, steps: [{ body: body(['Nit'], { desti: 'DE' }), upstream }] });
    assert.equal(dolenta.responses[0].data.status, 502, JSON.stringify(upstream));
    assert.equal(traduccionsGuardades(dolenta).length, 0);
  }
});

test('cache de 7 dies amb empremtes separades: DeepL conserva la de sempre i no es barreja amb Apertium', options, () => {
  const r = run({ key: '', steps: [{}, {}, { key: 'fixture-secret:fx' }, {}, { key: '' }] });
  assert.deepEqual(r.calls.map((c) => c.url), [BETA, 'https://api-free.deepl.com/v2/translate']);
  assert.deepEqual(r.responses.map((x) => x.data.cache), [false, true, false, true, true]);
  assert.deepEqual(r.responses.map((x) => x.data.traduccions[0]), ['spa:Bon dia', 'spa:Bon dia', 'ES:Bon dia', 'ES:Bon dia', 'spa:Bon dia']);
  const apertium = r.cache[nomCache('ES', 'text', 'Bon dia', hmac('sdp-apertium-v1'))];
  const deepl = r.cache[nomCache('ES', 'text', 'Bon dia', hmac('fixture-secret:fx'))];
  assert.deepEqual(apertium, { value: 'spa:Bon dia', ttl: 604800 });
  assert.deepEqual(deepl, { value: 'ES:Bon dia', ttl: 604800 }, 'mateixa empremta DeepL que abans d’IDEA-31: res del que ja hi ha es perd');
  for (const k of Object.keys(r.cache)) assert.match(k, /^sdp_tr_(?:ip_|pause_)?[a-f0-9]{64}$/);
  const lliure = run({ key: '', constants: { SDP_TRADUCCIO_URL: LLIURE }, steps: [{ body: body(['Bon dia'], { desti: 'DE' }) }] });
  assert.ok(lliure.cache[nomCache('DE', 'text', 'Bon dia', hmac(`sdp-lliure-v1|${LLIURE}`))]);
  assert.ok(!JSON.stringify(lliure.cache).includes('lliure.example'), 'cap URL en clar a la cache');
});

test('sense clau, el pressupost durable i el ritme per client valen igual (protegixen també el servei d’Apertium)', options, () => {
  const r = run({ key: '', constants: { SDP_TRADUCCIO_LIMIT_DIARI: 10 }, steps: [{ transport: true }, { evict: true }] });
  assert.deepEqual(r.responses.map((x) => x.data.status), [502, 429]);
  assert.equal(r.calls.length, 2, 'beta i principal, i cap crida passat el pressupost');
  assert.equal(r.budget.diari, 7, 'reservat abans d’enviar i sense reemborsament');
  assert.equal(run({ key: '', constants: { SDP_TRADUCCIO_LIMIT_DIARI: 0 } }).calls.length, 0);
  const ritme = run({ key: '', steps: Array.from({ length: 31 }, (_, i) => ({ body: body([`text${i}`]) })) });
  assert.equal(ritme.calls.length, 30);
  assert.equal(ritme.responses[30].code, 'sdp_traduccio_limit');
  const ocupat = run({ key: '', steps: [{ lock: `${Math.floor(Date.now() / 1000) + 90}:other` }] });
  assert.equal(ocupat.calls.length, 0);
  assert.equal(ocupat.responses[0].data.status, 503);
});

test('resposta d’Apertium malformada, buida o amb responseStatus dolent no contamina el cache', options, () => {
  const casos = [{ upstream: {} }, { upstream: { responseStatus: 200 } }, { upstream: { responseStatus: 200, responseData: { translatedText: '' } } },
    { upstream: { responseStatus: 200, responseData: { translatedText: 5 } } }, { upstream: { responseStatus: 400, responseData: { translatedText: 'x' } } },
    { upstream: { responseStatus: '200', responseData: { translatedText: 'x' } } }, { upstream: { responseStatus: 200, responseData: 'x' } }, { upstreamRaw: 'no és JSON' }];
  for (const cas of casos) {
    const r = run({ key: '', steps: [cas] });
    assert.equal(r.responses[0].data.status, 502, JSON.stringify(cas));
    assert.equal(traduccionsGuardades(r).length, 0);
    assert.equal(r.lock, null);
  }
});

/* Decisió del Mestre 261030 §2: 12 s per crida dins dels 30 s de la petició,
   perquè una sola crida lenta no l'esgote; un termini no obri la pausa. */
test('termini: 12 s per crida i 30 s per petició; el que ha arribat es guarda i el reintent continua on s’havia quedat', options, () => {
  const textos = ['u', 'dos', 'tres', 'quatre'];
  const r = run({ key: '', steps: [{ body: body(textos), cost: 11 }, { body: body(textos) }] });
  assert.equal(r.responses[0].code, 'sdp_traduccio_proveidor');
  assert.deepEqual(r.calls.slice(0, 3).map((c) => c.body.q), ['u', 'dos', 'tres'], 'dues crides lentes d’11 s no esgoten la petició');
  assert.deepEqual(r.calls.slice(0, 2).map((c) => c.timeout), [12, 12]);
  assert.ok(r.calls[2].timeout <= 8, `la tercera crida només té el que queda: ${r.calls[2].timeout}`);
  assert.deepEqual(r.calls.slice(3).map((c) => c.body.q), ['quatre'], 'el reintent només demana el que faltava (cap pausa)');
  assert.deepEqual(r.responses[1].data.traduccions, textos.map((t) => `spa:${t}`));
  assert.equal(Object.keys(r.cache).filter((k) => k.startsWith('sdp_tr_pause_')).length, 0);
  assert.equal(run({ key: '', steps: [{ elapsed: 30 }] }).calls.length, 0, 'sense temps, cap crida');
  const lliure = run({ key: '', constants: { SDP_TRADUCCIO_URL: LLIURE }, steps: [{ body: body(['Nit'], { desti: 'DE' }), elapsed: 25 }] });
  assert.ok(lliure.calls[0].timeout <= 5, `LibreTranslate també respecta el total: ${lliure.calls[0].timeout}`);
});

test('el permís ja no exigix DEEPL_API_KEY: cap rastre del 503 sense_clau al callback', options, () => {
  const permis = fs.readFileSync(module, 'utf8').match(/function socdepoble_enxufe_traduccio_permis\([^]*?\n}\n/)?.[0] ?? '';
  assert.ok(permis.includes('is_json_content_type'), 'trobat el callback de permís');
  assert.doesNotMatch(permis, /sense_clau|deepl_clau/);
});
