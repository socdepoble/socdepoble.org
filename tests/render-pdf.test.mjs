import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const render = fileURLToPath(new URL('../tooling/pdf/render_pdf.sh', import.meta.url));

function fixture(t) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-render-pdf-test-')));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const input = path.join(root, 'entrada amb espais.html');
  const output = path.join(root, 'eixida amb espais.pdf');
  const record = path.join(root, 'chrome.json');
  const stub = path.join(root, 'chrome-stub');
  fs.mkdirSync(path.join(root, 'temp'));
  fs.writeFileSync(input, '<!doctype html><h1>Informe</h1>');
  // Mai arranca Chrome: observa arguments i produïx una capçalera/longitud controlades.
  fs.writeFileSync(stub, `#!${process.execPath}\nconst fs = require('node:fs');
const args = process.argv.slice(2);
fs.writeFileSync(process.env.SDP_PDF_TEST_RECORD, JSON.stringify(args));
if (process.env.SDP_PDF_TEST_MODE === 'error') process.exit(17);
const out = args.find(a => a.startsWith('--print-to-pdf=')).slice('--print-to-pdf='.length);
fs.writeFileSync(out, process.env.SDP_PDF_TEST_MODE === 'invalid' ? 'no és un PDF' : '%PDF-1.7\\n' + 'x'.repeat(1200));
`);
  fs.chmodSync(stub, 0o755);
  return {
    root, input, output, record,
    run(mode = 'ok', args = [input, output]) {
      return spawnSync('/bin/sh', [render, ...args], {
        cwd: root,
        env: { ...process.env, CHROME_BIN: stub, TMPDIR: 'temp', SDP_PDF_TEST_RECORD: record, SDP_PDF_TEST_MODE: mode },
        encoding: 'utf8',
      });
    },
  };
}

function assertCleanup(f) {
  assert.deepEqual(fs.readdirSync(path.join(f.root, 'temp')), [], 'perfil i memòria cau temporals eliminats');
  assert.ok(!fs.readdirSync(f.root).some(n => n.startsWith('.eixida amb espais.pdf.')), 'PDF provisional eliminat');
}

test('PDF: Chrome rep perfil i cau absoluts aïllats, clauer simulat i URI segura', (t) => {
  const f = fixture(t);
  const result = f.run();
  assert.equal(result.status, 0, result.stderr);
  const args = JSON.parse(fs.readFileSync(f.record, 'utf8'));
  for (const flag of ['--user-data-dir=', '--disk-cache-dir=']) {
    const value = args.find(a => a.startsWith(flag))?.slice(flag.length);
    assert.ok(value && path.isAbsolute(value), flag);
    assert.ok(value.startsWith(`${f.root}/temp/sdp-pdf.`), value);
  }
  assert.ok(args.includes('--use-mock-keychain'));
  assert.ok(args.includes('--password-store=basic'));
  assert.ok(args.includes('--no-pdf-header-footer'));
  assert.ok(args.includes(pathToFileURL(f.input).href));
  assert.match(fs.readFileSync(f.output, 'utf8'), /^%PDF-/);
  assertCleanup(f);
});

for (const mode of ['error', 'invalid']) {
  test(`PDF: ${mode} conserva el destí i neteja tots els temporals`, (t) => {
    const f = fixture(t);
    fs.writeFileSync(f.output, 'PDF anterior');
    const result = f.run(mode, ['--replace', f.input, f.output]);
    assert.notEqual(result.status, 0);
    assert.equal(fs.readFileSync(f.output, 'utf8'), 'PDF anterior');
    assert.ok(!fs.readdirSync(f.root).some(n => n.includes('.bak.')));
    assertCleanup(f);
  });
}

test('PDF: refusar sobreescriptura no arranca el navegador; --replace preserva una còpia', (t) => {
  const f = fixture(t);
  fs.writeFileSync(f.output, 'PDF anterior');
  assert.equal(f.run().status, 3);
  assert.ok(!fs.existsSync(f.record));
  const result = f.run('ok', ['--replace', f.input, f.output]);
  assert.equal(result.status, 0, result.stderr);
  const backups = fs.readdirSync(f.root).filter(n => n.includes('.bak.'));
  assert.equal(backups.length, 1);
  assert.equal(fs.readFileSync(path.join(f.root, backups[0]), 'utf8'), 'PDF anterior');
  assertCleanup(f);
});
