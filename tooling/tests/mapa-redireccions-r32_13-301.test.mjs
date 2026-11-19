import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { benchmark301, compilaMapaRedireccions301, importaInventariHistoric301, normalitzaOrigen301,
  normalitzaDesti301, rutaCanonica301, verificaMapaRedireccions301 } from '../seo/mapa-redireccions-301.mjs';

const net = 'https://socdepoble.net';
const target = '/page/historia';
const map = rules => ({ redireccions: rules, destinsDisponibles: [target, '/page/cultura', '/page/oli'] });
const rule = (source = `${net}/2012/oli`, destination = target) => ({ source, destination, status: 301 });

for (const host of ['socdepoble.net', 'socdepoble.com']) {
  test(`imports explicit ${host} mappings including HTTP/www`, () => {
    const compiled = compilaMapaRedireccions301(map([rule(`http://www.${host}/noticies/oli`)]));
    assert.equal(compiled.redireccions[0].source, `https://${host}/noticies/oli`);
    assert.equal(compiled.firebase.hosting[0].redirects[0].type, 301);
    assert.equal(compiled.firebase.hosting[0].redirects[0].destination, `https://socdepoble.org${target}`);
    assert.match(compiled.wordpress, /R=301,END,NE,QSD/);
    assert.match(compiled.nginx, /return 301 https:\/\/socdepoble.org\/page\/historia;/);
  });
}

test('Blogger date article and sole mobile alias canonicalize identically', () => {
  assert.equal(normalitzaOrigen301('http://elrentonar.blogspot.com/2011/08/oli-del-poble.html?m=1'),
    'https://elrentonar.blogspot.com/2011/08/oli-del-poble.html');
  assert.equal(normalitzaOrigen301('https://elrentonar.blogspot.com/2011/13/oli.html'), null);
  assert.equal(normalitzaOrigen301('https://elrentonar.blogspot.com/2011/01/.html'), null);
  assert.equal(normalitzaOrigen301('https://elrentonar.blogspot.com/p/historia.html'), 'https://elrentonar.blogspot.com/p/historia.html');
  const compiled = compilaMapaRedireccions301(map([rule('https://elrentonar.blogspot.com/2011/08/oli.html?m=1')]));
  assert.equal(compiled.hostBindings[0].blogspotProviderManaged, true);
  assert.match(compiled.limits.join('\n'), /Blogspot provider control/);
});

test('hosts receive separate Firebase targets and literal RE2 regexes', () => {
  const compiled = compilaMapaRedireccions301(map([rule(`${net}/a.html`), rule('https://socdepoble.com/a.html', '/page/cultura'),
    rule('https://elrentonar.blogspot.com/2009/12/oli.html', '/page/oli')]));
  assert.equal(compiled.firebase.hosting.length, 3);
  assert.deepEqual(compiled.firebase.hosting.map(h => h.target), ['legacy-socdepoble-net', 'legacy-socdepoble-com', 'legacy-elrentonar-blogspot-com']);
  const regex = new RegExp(compiled.firebase.hosting[0].redirects[0].regex);
  assert.equal(regex.test('/a.html'), true);
  assert.equal(regex.test('/axhtml'), false);
  assert.equal(regex.test('/a.html/extra'), false);
  assert.equal(compiled.firebase.hosting[0].redirects[0].source, undefined);
});

test('source aliases collide and duplicate/conflicting destinations fail closed', () => {
  for (const destination of [target, '/page/cultura']) {
    assert.equal(verificaMapaRedireccions301(map([rule(`${net}/a`), rule('http://www.socdepoble.net/a', destination)])).valid, false);
  }
  assert.equal(verificaMapaRedireccions301(map([rule('https://elrentonar.blogspot.com/2011/08/oli.html'),
    rule('https://elrentonar.blogspot.com/2011/08/oli.html?m=1')])).valid, false);
});

for (const source of [
  'https://socdepoble.net.evil.org/a', 'https://socdepoble.net@evil.org/a', 'https://evil.org@socdepoble.net/a',
  'https://socdepoble.net:443/a', 'https://socdepoble.net./a', 'https://SOCDEPOBLE.NET/a', '//socdepoble.net/a',
  'javascript:alert(1)', 'https://sοcdepoble.net/a', 'https://socdepoble.net\\@evil.org/a',
  `${net}/a#fragment`, `${net}/a\n`, `${net}/a b`, `${net}//evil.org`, `${net}/../page`, `${net}/a/./b`,
  `${net}/a/%2e%2e/b`, `${net}/a/%2F/b`, `${net}/a/%5C/b`, `${net}/a/%252f/b`, `${net}/a/%00`,
  `${net}/a/%C0%AF`, `${net}/a/%EF%BC%8F`, `${net}/a/%E2%80%AE`, `${net}/a/%E2%81%A6`, `${net}/a/%EF%B8%8F`, `${net}/a/%CD%8F`,
  `${net}/a/%65%CC%81`, `${net}/a/e%CC%81`, `${net}/a/%c3%a9`, `${net}/a/%41`,
  `${net}/a/$host`, `${net}/a/"bad`, `${net}/a/{x}`, `${net}/a;a`, `${net}/a?next=https://evil.org`,
  'https://elrentonar.blogspot.com/2011/08/a.html?m=1&m=1', 'https://www.elrentonar.blogspot.com/2011/08/a.html',
]) test(`rejects malicious/noncanonical source ${JSON.stringify(source)}`, () => {
  assert.equal(normalitzaOrigen301(source), null);
  assert.equal(verificaMapaRedireccions301(map([rule(source)])).valid, false);
});

for (const destination of [
  'https://evil.org/a', '//evil.org/a', 'http://socdepoble.org/a', 'https://socdepoble.org.evil.org/a',
  'https://socdepoble.org@evil.org/a', `${net}/other`, '/a?next=https://evil.org', '/a#frag', '/a//b', '/a/..',
  '/%E2%80%A8', '/%EF%BC%8E%EF%BC%8E/a', '/a/%25', '/a/$request_uri', '/a/"',
]) test(`rejects external/unsafe destination ${JSON.stringify(destination)}`, () => {
  assert.equal(normalitzaDesti301(destination), null);
  assert.equal(verificaMapaRedireccions301(map([rule(undefined, destination)])).valid, false);
});

test('NFC stable Unicode path uses strict uppercase UTF-8, without compatibility normalization', () => {
  assert.equal(rutaCanonica301('/noticies/caf%C3%A9'), '/noticies/caf%C3%A9');
  assert.equal(rutaCanonica301('/noticies/café'), null);
  assert.equal(rutaCanonica301('/%EF%AC%81'), null); // ligature fi changes under NFKC
  assert.equal(rutaCanonica301('/a/%2E'), null);
  assert.equal(rutaCanonica301('/a/../b'), null);
  assert.equal(rutaCanonica301('/a/.'), null);
  assert.equal(rutaCanonica301('/'), '/');
  const compiled = compilaMapaRedireccions301(map([rule(`${net}/caf%C3%A9`)]));
  assert.match(compiled.nginx, /location = "\/café"/);
  assert.equal(new RegExp(compiled.firebase.hosting[0].redirects[0].regex).test(decodeURI('/caf%C3%A9')), true);
  const unicodeTarget = compilaMapaRedireccions301({ redireccions: [rule(`${net}/caf%C3%A9`, '/page/caf%C3%A9')], destinsDisponibles: ['/page/caf%C3%A9'] });
  assert.equal(unicodeTarget.firebase.hosting[0].redirects[0].destination, 'https://socdepoble.org/page/café');
  assert.equal(encodeURI(unicodeTarget.firebase.hosting[0].redirects[0].destination), 'https://socdepoble.org/page/caf%C3%A9');
  assert.ok(compiled.wordpress.includes('REQUEST_URI} ^/café$'));
  assert.equal(compiled.wordpress.includes('REQUEST_URI} ^/caf%C3%A9$'), false);
});

test('cycles, multi-hop and self redirect through legacy targets fail even if inventory names them', () => {
  for (const rules of [
    [rule(`${net}/a`, 'https://socdepoble.com/b'), rule('https://socdepoble.com/b', `${net}/a`)],
    [rule(`${net}/a`, `${net}/b`), rule(`${net}/b`, target)],
    [rule(`${net}/a`, `${net}/a`)],
  ]) assert.equal(verificaMapaRedireccions301(map(rules)).valid, false);
});

test('only enumerated final content routes count, no guessed slugs or SPA wildcard', () => {
  assert.equal(verificaMapaRedireccions301(map([rule(undefined, '/article/missing')])).valid, false);
  assert.equal(verificaMapaRedireccions301({ redireccions: [rule()], destinsDisponibles: ['/*'] }).valid, false);
  assert.equal(verificaMapaRedireccions301({ redireccions: [rule()], destinsDisponibles: [target, `https://socdepoble.org${target}`] }).valid, false);
  assert.equal(verificaMapaRedireccions301({ redireccions: [rule()], destinsDisponibles: [`https://socdepoble.org${target}`] }).valid, true);
});

test('exact corpus coverage detects missing, extra and normalized duplicate inputs', () => {
  const valid = { ...map([rule()]), origensEsperats: [`${net}/2012/oli`] };
  assert.equal(verificaMapaRedireccions301(valid).valid, true);
  assert.equal(verificaMapaRedireccions301({ ...valid, origensEsperats: [] }).valid, false);
  assert.equal(verificaMapaRedireccions301({ ...valid, origensEsperats: [`${net}/other`] }).valid, false);
  assert.equal(verificaMapaRedireccions301({ ...valid, origensEsperats: [`${net}/2012/oli`, 'http://www.socdepoble.net/2012/oli'] }).valid, false);
});

test('WordPress query IDs remain exact; Firebase export refuses unsupported semantics', () => {
  const input = map([rule(`${net}/index.php?p=123`), rule(`${net}/index.php?page_id=42`, '/page/cultura')]);
  assert.equal(verificaMapaRedireccions301(input).valid, true);
  assert.throws(() => compilaMapaRedireccions301(input), /only matches paths/);
  assert.throws(() => compilaMapaRedireccions301(input, { format: 'firebase' }), /only matches paths/);
  const wp = compilaMapaRedireccions301(input, { format: 'wordpress' }).wordpress;
  assert.match(wp, /QUERY_STRING} \^p=123\$/);
  assert.match(wp, /QUERY_STRING} \^page_id=42\$/);
  const ng = compilaMapaRedireccions301(input, { format: 'nginx' }).nginx;
  assert.equal((ng.match(/location =/g) || []).length, 1);
  assert.match(ng, /if \(\$args = "p=123"\)/);
  assert.match(ng, /return 404/);
});

test('emitters discard incoming queries and prioritize exact query over path fallback', () => {
  const input = map([rule(`${net}/index.php`, target), rule(`${net}/index.php?p=4`, '/page/cultura')]);
  const wp = compilaMapaRedireccions301(input, { format: 'wordpress' }).wordpress;
  assert.ok(wp.indexOf('QUERY_STRING') < wp.indexOf('socdepoble.org/page/historia'));
  assert.match(wp, /NE,QSD/);
  const ng = compilaMapaRedireccions301(input, { format: 'nginx' }).nginx;
  assert.ok(ng.indexOf('if ($args') < ng.indexOf('return 301 https://socdepoble.org/page/historia'));
  assert.equal(ng.includes('$request_uri'), false);
  assert.equal(ng.includes('$is_args'), false);
});

test('schemas fail closed for non-primitive and inherited fields without coercion', () => {
  const evil = { toString() { throw new Error('coercion'); } };
  for (const input of [null, [], {}, { redireccions: {}, destinsDisponibles: [] }, map([null]), map([[]]),
    map([{ source: evil, destination: target, status: 301 }]), map([rule(undefined, evil)]),
    map([{ ...rule(), status: '301' }]), map([Object.create(rule())])]) assert.equal(verificaMapaRedireccions301(input).valid, false);
  const polluted = JSON.parse('{"redireccions":[{"source":"https://socdepoble.net/a","destination":"/page/historia","status":301,"__proto__":{"polluted":true}}],"destinsDisponibles":["/page/historia"],"constructor":{"prototype":{"polluted":true}}}');
  assert.equal(verificaMapaRedireccions301(polluted).valid, true);
  assert.equal({}.polluted, undefined);
  assert.equal(Object.hasOwn(compilaMapaRedireccions301(polluted).redireccions[0], '__proto__'), false);
});

test('article importer requires explicit reconciliation and preserves deterministic input order', () => {
  const input = [{ linkOriginal: 'http://socdepoble.com/z', rutaDestiCanonica: target },
    { linkOriginal: `${net}/a`, rutaDestiCanonica: '/page/cultura' }];
  const result = importaInventariHistoric301(input, [target, '/page/cultura']);
  assert.equal(result.redireccions[0].source, 'https://socdepoble.com/z');
  assert.deepEqual(result, importaInventariHistoric301(input, [target, '/page/cultura']));
  assert.throws(() => importaInventariHistoric301([{ linkOriginal: `${net}/missing` }], [target]), /Mapa 301 invàlid/);
});

test('seeded adversarial property corpus cannot escape canonical destination host', () => {
  let seed = 3213;
  const rand = () => { seed = Math.imul(seed, 1664525) + 1013904223 | 0; return seed >>> 0; };
  const mutators = ['\\', '?', '#', '%2f', '%2e', ' ', '\u202e', '\u2066', '$', '"', '{', '}', '\n'];
  for (let i = 0; i < 5000; i++) {
    const base = `${net}/corpus/${rand()}`;
    const inserted = mutators[rand() % mutators.length];
    const source = `${base}${inserted}suffix`;
    assert.equal(normalitzaOrigen301(source), null);
    assert.equal(verificaMapaRedireccions301(map([rule(source)])).valid, false);
  }
});

test('CLI compiles UTF-8 JSON, enforces format/schema, and refuses symlinks/directories', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-r3213-seo-cli-'));
  try {
    const file = path.join(dir, 'input.json');
    fs.writeFileSync(file, JSON.stringify(map([rule()])));
    const cli = new URL('../seo/mapa-redireccions-301.mjs', import.meta.url);
    const run = args => spawnSync(process.execPath, [fileURLToPath(cli), ...args], { encoding: 'utf8', timeout: 10000 });
    const result = run([file]);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).schema, 'sdp.redirect301.v1');
    assert.equal(run([file, '--format', 'nope']).status, 1);
    assert.equal(run([file, '--unknown', 'nginx']).status, 1);
    assert.equal(run([]).status, 1);
    fs.symlinkSync(file, path.join(dir, 'link.json'));
    assert.equal(run([path.join(dir, 'link.json')]).status, 1);
    assert.equal(run([dir]).status, 1);
    assert.equal(run(['--benchmark', 'invalid']).status, 1);
    fs.writeFileSync(file, Buffer.from([0xff, 0xfe]));
    assert.equal(run([file]).status, 1);
    fs.writeFileSync(file, '{"redireccions":');
    assert.equal(run([file]).status, 1);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('100k complete raw verification and compilation report stage timings', t => {
  const input = { redireccions: [], destinsDisponibles: [] };
  for (let i = 0; i < 100000; i++) {
    const destination = `/page/article-${i}`;
    input.destinsDisponibles.push(destination);
    input.redireccions.push(rule(`https://${i % 2 ? 'socdepoble.net' : 'socdepoble.com'}/article-${i}`, destination));
  }
  const samples = [];
  for (let i = 0; i < 5; i++) {
    const start = performance.now();
    const result = verificaMapaRedireccions301(input);
    samples.push(performance.now() - start);
    assert.equal(result.valid, true);
    assert.equal(result.count, 100000);
  }
  const started = performance.now();
  const compiled = compilaMapaRedireccions301(input);
  const compileMs = performance.now() - started;
  assert.equal(compiled.redireccions.length, 100000);
  const medianMs = [...samples].sort((a, b) => a - b)[2];
  t.diagnostic(JSON.stringify({ urls: 100000, uniqueDestinations: 100000, samplesMs: samples, medianMs,
    minimumMs: Math.min(...samples), maximumMs: Math.max(...samples), targetMs: 25, targetMet: medianMs < 25,
    fullCompileMs: compileMs, timingIncludes: 'all raw URI validation, duplicate detection and destination Set construction; no caches' }));
  // Generous anti-quadratic regression bound; the separately reported 25ms
  // acceptance target is NOT inferred from this complexity regression check.
  assert.ok(medianMs < 5000, `unexpected superlinear/blocked verifier: ${medianMs}ms`);
});


test('ordered bijective optimization revalidates every raw row and proves uniqueness without cached state', () => {
  const input = { redireccions: [], destinsDisponibles: [] };
  for (let i = 0; i < 200; i++) {
    const id = String(i).padStart(6, '0');
    const destination = `/page/article-${id}`;
    input.destinsDisponibles.push(destination);
    input.redireccions.push(rule(`${net}/article-${id}`, destination));
  }
  assert.equal(verificaMapaRedireccions301(input).mode, 'ordered-bijective-ascii');
  input.redireccions[199].source = input.redireccions[198].source;
  assert.equal(verificaMapaRedireccions301(input).valid, false);
  input.redireccions[199].source = `${net}/article-000199`;
  input.redireccions[199].destination = '/page/not-in-inventory';
  assert.equal(verificaMapaRedireccions301(input).valid, false);
  input.redireccions[199].destination = '/page/article-000199';
  input.redireccions[199].source = `${net}/article-000199/$host`;
  assert.equal(verificaMapaRedireccions301(input).valid, false);
  input.redireccions[199].source = `${net}/article-000199`;
  input.redireccions[199].destination = input.redireccions[198].destination;
  assert.equal(verificaMapaRedireccions301(input).valid, true); // valid many-to-one uses general verifier
  assert.equal(verificaMapaRedireccions301(input).mode, 'general');
});

test('benchmark exposes scope and honest acceptance result, rejecting malformed options', () => {
  const report = benchmark301({ shape: 'ordered', count: 100, samples: 3 });
  assert.equal(report.urls, 100);
  assert.equal(report.samplesMs.length, 3);
  assert.equal(report.targetMet, report.medianMs < 25);
  assert.equal(report.mode, 'ordered-bijective-ascii');
  assert.match(report.limits, /does not certify arbitrary/);
  assert.throws(() => benchmark301({ shape: 'fake' }), /Benchmark invàlid/);
  assert.throws(() => benchmark301({ count: -1 }), /Benchmark invàlid/);
});
