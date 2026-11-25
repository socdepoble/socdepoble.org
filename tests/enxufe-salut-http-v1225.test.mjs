import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
const root = path.resolve(import.meta.dirname, '..');
function cercaPhp() {
  if (process.env.PHP_BIN) return process.env.PHP_BIN;
  const studio = path.join(os.homedir(), '.studio/php-bin');
  const instal_lats = fs.existsSync(studio) ? fs.readdirSync(studio).sort().reverse().map(v => path.join(studio, v, 'php')) : [];
  return ['php', ...instal_lats].find(bin => spawnSync(bin, ['-v'], { timeout: 5000 }).status === 0);
}
const php = cercaPhp();
const opcions = { skip: !php && 'PHP no disponible: prova de runtime pendent, sense instal·lació automàtica.' };
const fixture = path.join(root, 'tests/fixtures/enxufe-salut-http-v1225.php');
const run = cas => JSON.parse(execFileSync(php, [fixture, root], { encoding: 'utf8', timeout: 10000, input: JSON.stringify(cas) }));
const javascript = { code: 200, headers: { 'content-type': 'text/javascript; charset=utf-8' } };
const redirect = location => ({ code: 302, headers: { location } });

test('C4b PHP syntax and registration do not send requests on plugin load', opcions, () => {
  execFileSync(php, ['-l', path.join(root, 'wordpress-plugin/includes/salut.php')]);
  execFileSync(php, ['-l', fixture]);
  const r = run({ mode: 'register' });
  assert.equal(r.result.direct.socdepoble_enxufe_trossos_http.test, 'socdepoble_enxufe_prova_trossos_http');
  assert.equal(r.result.direct.socdepoble_enxufe_upgrade_http.test, 'socdepoble_enxufe_prova_upgrade_http');
  assert.deepEqual(r.requests, []);
});

test('C4b local entry module: zero or one redirect; no cookies/auth and bounded HEAD requests', opcions, () => {
  for (const responses of [[javascript], [redirect('entrada-final.js'), javascript], [redirect('/wp-content/plugins/socdepoble/dist/trossos/entrada-final.js'), javascript], [redirect('https://poble.example/wp-content/plugins/socdepoble/dist/trossos/entrada-final.js'), javascript], [redirect('//poble.example/wp-content/plugins/socdepoble/dist/trossos/entrada-final.js'), javascript]]) {
    const r = run({ mode: 'module', responses });
    assert.equal(r.result.estat, 'ok'); assert.equal(r.result.salts, responses.length - 1);
    for (const req of r.requests) {
      assert.equal(new URL(req.url).origin, 'https://poble.example');
      assert.equal(req.args.redirection, 0); assert.equal(req.args.timeout, 3);
      assert.equal(req.args.limit_response_size, 1024); assert.equal(req.args.sslverify, true);
      assert.equal(req.args.reject_unsafe_urls, true); assert.deepEqual(req.args.cookies, []);
      assert.deepEqual(Object.keys(req.args.headers), ['Accept']);
    }
  }
});

test('[DEFECTE] C4b two redirects are reported without following a third request', opcions, () => {
  const r = run({ mode: 'module-health', responses: [redirect('entrada-dos.js'), redirect('entrada-tres.js')] });
  assert.equal(r.result.status, 'recommended'); assert.match(r.result.description, /more than one redirect/);
  assert.equal(r.requests.length, 2);
});

test('[DEFECTE] C4b rejects redirects outside the exact local origin/plugin directory and hostile headers', opcions, () => {
  for (const location of ['https://attacker.invalid/a.js', 'https://poble.example.attacker.invalid/a.js', '//attacker.invalid/a.js', 'https://u:p@poble.example/wp-content/plugins/socdepoble/dist/trossos/a.js', 'http://poble.example/wp-content/plugins/socdepoble/dist/trossos/a.js', 'https://poble.example:8443/wp-content/plugins/socdepoble/dist/trossos/a.js', '/wp-admin/login.php', '../a.js', 'a.js?token=private', 'a.js#fragment', "a.js\r\nAuthorization: secret", ['a.js']]) {
    const r = run({ mode: 'module', responses: [redirect(location)] });
    assert.equal(r.result.estat, 'unknown', String(location)); assert.equal(r.requests.length, 1);
    assert.equal(JSON.stringify(r.result).includes('attacker'), false);
  }
});

test('[DEFECTE] C4b HTML200, errors, missing or invalid manifest, anonymous calls and external plugin/CDN origins never turn green', opcions, () => {
  for (const cas of [
    { responses: [{ code: 200, headers: { 'content-type': 'text/html' } }] },
    { responses: [{ code: 404 }] }, { responses: [{ code: 405 }] }, { responses: [{ error: 'private-sentinel' }] },
    { autoritzat: false }, { manifest: null }, { manifest: { formatDelPaquet: { modul: '../secret.php' } } },
    { pluginBase: 'https://cdn.example/' }, { pluginBase: 'https://user:pass@poble.example/' },
  ]) {
    const r = run({ mode: 'module', ...cas }); assert.equal(r.result.estat, 'unknown');
    assert.equal(JSON.stringify(r.result).includes('private-sentinel'), false);
  }
});

test('C4b upgrade: 401/403/404/410 observed as non-public; 2xx only recommends review; redirects stay unknown', opcions, () => {
  for (const code of [401, 403, 404, 410]) {
    const r = run({ mode: 'upgrade-health', responses: [{ code }] });
    assert.equal(r.result.status, 'good'); assert.equal(r.requests.length, 1);
    assert.equal(r.requests[0].url, 'https://poble.example/wp-content/upgrade/');
    assert.match(r.result.description, /does not certify/);
  }
  const ouvert = run({ mode: 'upgrade-health', responses: [{ code: 200, body: 'private-file-name' }] });
  assert.equal(ouvert.result.status, 'recommended'); assert.match(ouvert.result.description, /does not prove a vulnerability/);
  assert.equal(JSON.stringify(ouvert.result).includes('private-file-name'), false);
  for (const response of [redirect('https://attacker.invalid/'), { code: 500 }, { error: 'secret' }]) {
    const r = run({ mode: 'upgrade', responses: [response] });
    assert.equal(r.result.estat, 'unknown'); assert.equal(r.requests.length, 1);
  }
});

test('C4b unknown enum cannot become an arbitrary HTTP client; disabled privilege avoids every request', opcions, () => {
  for (const cas of [{ mode: 'https://attacker.invalid' }, { mode: 'upgrade', autoritzat: false }, { mode: 'upgrade', contentBase: 'https://cdn.example/' }]) {
    const r = run(cas); assert.equal(r.result.estat, 'unknown'); assert.equal(r.requests.length, 0);
  }
});


test('C4b format selection registers module HTTP only for the chunked package and excludes cron', opcions, () => {
  for (const manifest of [null, {}, { formatDelPaquet: { format: 'monolitic' } }, { formatDelPaquet: { modul: 'trossos/a.js' } }]) {
    const r=run({mode:'register',manifest});
    assert.equal(Object.hasOwn(r.result.direct,'socdepoble_enxufe_trossos_http'),false);
    assert.equal(r.result.direct.socdepoble_enxufe_upgrade_http.skip_cron,true);
    assert.deepEqual(r.requests,[]);
  }
  const r=run({mode:'register'});
  assert.equal(r.result.direct.socdepoble_enxufe_trossos_http.skip_cron,true);
  assert.equal(r.result.direct.socdepoble_enxufe_upgrade_http.skip_cron,true);
  assert.deepEqual(r.requests,[]);
});

test('C4b accepts the sixteen standard JavaScript MIME essences without following extra redirects', opcions, () => {
  const mimes = ["application/ecmascript", "application/javascript", "application/x-ecmascript", "application/x-javascript", "text/ecmascript", "text/javascript", "text/javascript1.0", "text/javascript1.1", "text/javascript1.2", "text/javascript1.3", "text/javascript1.4", "text/javascript1.5", "text/jscript", "text/livescript", "text/x-ecmascript", "text/x-javascript"];
  for(const mime of mimes) {
    const r=run({mode:'module',responses:[{code:200,headers:{'content-type':mime.toUpperCase()+'; charset=utf-8'}}]});
    assert.equal(r.result.estat,'ok',mime);assert.equal(r.requests.length,1);
  }
});

for (const [label, control] of [['NUL', '\u0000'], ['VT', '\u000b']]) {
  test(`C4b refuses malformed Content-Type containing ${label} instead of trimming it to success`, opcions, () => {
    for (const mime of [control + 'text/javascript', 'text/javascript' + control, 'text/javascript;' + control + 'charset=utf-8']) {
      const r = run({ mode: 'module', responses: [{ code: 200, headers: { 'content-type': mime } }] });
      assert.equal(r.result.estat, 'unknown');
      assert.equal(r.result.motiu, 'module_mime_unconfirmed');
      assert.equal(r.requests.length, 1);
    }
    const valid = run({ mode: 'module', responses: [{ code: 200, headers: { 'content-type': ' \tTEXT/JAVASCRIPT\t ; charset=utf-8' } }] });
    assert.equal(valid.result.estat, 'ok');
  });
}
