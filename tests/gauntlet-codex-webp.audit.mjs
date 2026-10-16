#!/usr/bin/env node
/**
 * Explicit, synthetic-only adversarial audit (not part of *.test.mjs discovery).
 * Run: node tests/gauntlet-codex-webp.audit.mjs
 * Optional report destination: SDP_WEBP_AUDIT_REPORT=/tmp/result.json
 * Requires the converter's own runtime dependency: python3 + Pillow/WebP.
 * Missing prerequisites fail the audit; they are never silently skipped.
 * No photographs, repository assets, network, or installed Python changes.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { tiff, dataOriginal, gpsTorre, orientacio, TIPUS } from '../src/components/universal/enquadrament/jpegProva.js';

const converterUrl = new URL('../tooling/maquinaria/convertir_a_webp.mjs', import.meta.url);
const converterPath = fileURLToPath(converterUrl);
const digest = value => createHash('sha256').update(value).digest('hex');
const sourceHash = () => digest(fs.readFileSync(converterPath));
const beforeHash = sourceHash();
const reportPath = process.env.SDP_WEBP_AUDIT_REPORT
  || path.join(os.tmpdir(), `sdp-webp-codex-audit-${Date.now()}.json`);
const report = { createdAt: new Date().toISOString(), sourceSha256Before: beforeHash,
  syntheticOnly: true, probes: [], status: 'running' };
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-webp audit amb espais '));
const fixture = name => path.join(dir, name);
const python = (script, ...args) => execFileSync('python3', ['-c', script, ...args],
  { encoding: 'utf8', timeout: 60_000 });
let failures = 0;

async function check(name, run) {
  const evidence = {};
  try { await run(evidence); report.probes.push({ name, pass: true, ...evidence }); }
  catch (error) {
    failures++;
    report.probes.push({ name, pass: false, ...evidence, error: error.message, code: error.code ?? null });
  }
}

// Independent RIFF extraction: do not use the converter's own EXIF reader as oracle.
function readWebpExif(bytes) {
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
  assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
  assert.equal(bytes.readUInt32LE(4) + 8, bytes.length);
  for (let pos = 12; pos + 8 <= bytes.length;) {
    const length = bytes.readUInt32LE(pos + 4), end = pos + 8 + length;
    assert.ok(end <= bytes.length, 'RIFF chunk cannot extend beyond the file');
    if (bytes.toString('ascii', pos, pos + 4) === 'EXIF') {
      const value = bytes.subarray(pos + 8, end);
      return value.subarray(value.subarray(0, 6).equals(Buffer.from('Exif\0\0')) ? 6 : 0);
    }
    pos = end + length % 2;
  }
  return null;
}

const exifOptions = { ordre: 'II',
  ifd0: [orientacio(6), { tag: 0x010f, tipus: TIPUS.ASCII, valors: 'Synthetic camera' }],
  exif: [...dataOriginal('2026:10:15 09:15:30', '+02:00'),
    { tag: 0x927c, tipus: TIPUS.BYTE, valors: [8, 2, 7, 4, 9, 1] }], gps: gpsTorre() };
const inputExif = Buffer.from(tiff(exifOptions));
// The expected TIFF is generated independently with only Orientation changed.
const expectedExif = Buffer.from(tiff({ ...exifOptions,
  ifd0: [orientacio(1), exifOptions.ifd0[1]] }));

function describe(file) {
  return JSON.parse(python(`from PIL import Image
import json,sys
with Image.open(sys.argv[1]) as im:
    e=im.getexif(); x=e.get_ifd(34665); g=e.get_ifd(34853)
    rgb=im.convert('RGB')
    print(json.dumps({'size':im.size,'orientation':e.get(274),'make':e.get(271),
      'date':x.get(36867),'offset':x.get(36881),'makerNote':list(x.get(37500,b'')),
      'gpsLatitude':[float(v) for v in g.get(2,[])], 'gpsLongitude':[float(v) for v in g.get(4,[])],
      'pixels':[rgb.getpixel((im.width//2,im.height//4)),rgb.getpixel((im.width//2,3*im.height//4))]}))`, file));
}

function assertMetadata(image) {
  assert.equal(image.orientation, 1);
  assert.equal(image.make, 'Synthetic camera');
  assert.equal(image.date, '2026:10:15 09:15:30');
  assert.equal(image.offset, '+02:00');
  assert.deepEqual(image.makerNote, [8, 2, 7, 4, 9, 1]);
  assert.deepEqual(image.gpsLatitude, [38, 35, 30.84]);
  assert.deepEqual(image.gpsLongitude, [0, 25, 6.24]);
}

try {
  const { convertirImatgeAWebp } = await import(converterUrl);
  report.environment = JSON.parse(python(`import sys,PIL,json
from PIL import features
assert features.check('webp'), 'Pillow requires WebP support'
print(json.dumps({'python':sys.executable,'pillow':PIL.__version__,'webp':True}))`));
  fs.writeFileSync(fixture('exif.bin'), inputExif);
  python(`from PIL import Image,ImageDraw
import os,sys
p=sys.argv[1]; im=Image.new('RGB',(600,300),'red')
ImageDraw.Draw(im).rectangle((300,0,599,299),fill='green')
exif=b'Exif\\0\\0'+open(os.path.join(p,'exif.bin'),'rb').read()
for fmt,ext in [('JPEG','jpg'),('PNG','png'),('TIFF','tiff')]:
    im.save(os.path.join(p,'foto amb espais.'+ext),format=fmt,exif=exif)
large=Image.Exif(); large[270]='M'*90000; large[274]=1
im.save(os.path.join(p,'large-exif.webp'),format='WEBP',exif=large)
im.save(os.path.join(p,'source.webp'),format='WEBP')`, dir);

  for (const [mode, size, budget] of [
    ['original', [300, 600], 80], ['quadrat', [1200, 1200], 80], ['avatar', [400, 400], 40],
  ]) await check(`jpeg-${mode}-exif-orientation-dimensions-spaces`, evidence => {
    const input = fixture('foto amb espais.jpg'), output = fixture(`${mode} amb espais.webp`);
    const original = digest(fs.readFileSync(input));
    evidence.result = convertirImatgeAWebp(input, output, { mode, maxKb: budget });
    evidence.decoded = describe(output);
    assert.deepEqual(evidence.decoded.size, size);
    assertMetadata(evidence.decoded);
    assert.deepEqual(readWebpExif(fs.readFileSync(output)), expectedExif);
    assert.ok(fs.statSync(output).size < budget * 1000, 'Final file must be strictly below its decimal KB budget');
    assert.equal(digest(fs.readFileSync(input)), original, 'Explicit output must preserve the source');
    const [top, bottom] = evidence.decoded.pixels;
    assert.ok(top[0] > 240 && top[1] < 15 && bottom[1] > 115 && bottom[0] < 15,
      'Orientation 6 must rotate the red left half to the top exactly once');
  });

  for (const ext of ['png', 'tiff']) await check(`${ext}-metadata-preservation`, evidence => {
    const input = fixture(`foto amb espais.${ext}`), output = fixture(`${ext}-result.webp`);
    const original = digest(fs.readFileSync(input));
    evidence.result = convertirImatgeAWebp(input, output, { mode: 'original' });
    evidence.decoded = describe(output);
    assertMetadata(evidence.decoded);
    if (ext === 'png') assert.deepEqual(readWebpExif(fs.readFileSync(output)), expectedExif);
    assert.equal(digest(fs.readFileSync(input)), original);
  });

  await check('oversized-exif-rejected-without-changing-existing-files', evidence => {
    const input = fixture('large-exif.webp'), output = fixture('protected-large.webp');
    const original = digest(fs.readFileSync(input));
    fs.writeFileSync(output, 'existing-output-must-survive');
    let rejected;
    try { evidence.result = convertirImatgeAWebp(input, output); } catch (error) { rejected = error; }
    evidence.rejected = Boolean(rejected); evidence.reason = rejected?.message;
    assert.ok(rejected, 'EXIF alone exceeds 80,000 bytes: conversion must fail safely');
    assert.equal(digest(fs.readFileSync(input)), original);
    assert.equal(fs.readFileSync(output, 'utf8'), 'existing-output-must-survive');
  });

  await check('explicit-small-budget-enforced-or-rejected-safely', evidence => {
    const output = fixture('small-budget.webp'); let rejected;
    try { evidence.result = convertirImatgeAWebp(fixture('foto amb espais.jpg'), output, { maxKb: 1 }); }
    catch (error) { rejected = error; }
    evidence.rejected = Boolean(rejected); evidence.reason = rejected?.message;
    if (rejected) assert.equal(fs.existsSync(output), false, 'Failed conversion must not publish an output');
    else {
      assert.ok(fs.statSync(output).size < 1000, 'Caller-supplied decimal KB limit must be enforced');
      assertMetadata(describe(output));
    }
  });

  await check('exactly-80000-bytes-rejected-before-publishing', evidence => {
    const input = fixture('source.webp'), output = fixture('exact-budget-output.webp');
    const base = fs.readFileSync(input), original = digest(base);
    const candidate = fixture('exactly-80000.webp'), marker = fixture('boundary-encoder-invoked');
    const padded = Buffer.alloc(80_000);
    base.copy(padded);
    padded.write('JUNK', base.length, 'ascii');
    padded.writeUInt32LE(80_000 - base.length - 8, base.length + 4);
    padded.writeUInt32LE(80_000 - 8, 4);
    fs.writeFileSync(candidate, padded);
    // An unknown RIFF chunk is allowed; Pillow independently confirms that the
    // candidate still decodes. Its exact size distinguishes <80 KB from <=80 KB
    // and from the old <80 KiB interpretation.
    assert.deepEqual(describe(candidate).size, [600, 300]);
    fs.writeFileSync(output, 'previous-destination');
    const shim = fixture('exact budget encoder shim'); fs.mkdirSync(shim);
    fs.writeFileSync(path.join(shim, 'python3'),
      '#!/bin/sh\ncp "$SDP_WEBP_AUDIT_CANDIDATE" "$4"\nprintf invoked > "$SDP_WEBP_AUDIT_ENCODER_MARKER"\n',
      { mode: 0o755 });
    let rejected;
    try {
      execFileSync(process.execPath, [converterPath, input, output, '--mode', 'original'], {
        env: { ...process.env, PATH: `${shim}${path.delimiter}${process.env.PATH || ''}`,
          SDP_WEBP_AUDIT_CANDIDATE: candidate, SDP_WEBP_AUDIT_ENCODER_MARKER: marker },
        stdio: 'pipe', timeout: 10_000,
      });
    } catch (error) { rejected = error; }
    evidence.candidateBytes = padded.length;
    evidence.encoderInvoked = fs.existsSync(marker);
    evidence.rejected = Boolean(rejected);
    evidence.reason = rejected?.stderr?.toString().split('\n').find(line => line.startsWith('Error:'));
    assert.equal(evidence.encoderInvoked, true, 'The boundary candidate must reach the converter');
    assert.ok(rejected, 'Exactly 80,000 bytes must be rejected');
    assert.equal(digest(fs.readFileSync(input)), original);
    assert.equal(fs.readFileSync(output, 'utf8'), 'previous-destination');
    assert.deepEqual(fs.readdirSync(dir).filter(name => name.includes('.tmp-')), []);
  });

  await check('encoder-failure-preserves-in-place-source-and-cleans-temporary', evidence => {
    const input = fixture('source.webp'), original = digest(fs.readFileSync(input));
    const shim = fixture('encoder failure shim'); fs.mkdirSync(shim);
    // execFileSync passes the output as argv[4] to python3. This temporary
    // process simulates an encoder crash after opening its requested output.
    const marker = fixture('failing-encoder-invoked');
    fs.writeFileSync(path.join(shim, 'python3'),
      '#!/bin/sh\nprintf invoked > "$SDP_WEBP_AUDIT_ENCODER_MARKER"\nprintf partial > "$4"\nexit 9\n',
      { mode: 0o755 });
    let failed;
    try {
      execFileSync(process.execPath, [converterPath, input], { env: { ...process.env,
        PATH: `${shim}${path.delimiter}${process.env.PATH || ''}`, SDP_WEBP_AUDIT_ENCODER_MARKER: marker },
        stdio: 'pipe', timeout: 10_000 });
    } catch (error) { failed = error; }
    evidence.failed = Boolean(failed); evidence.exitStatus = failed?.status;
    evidence.encoderInvoked = fs.existsSync(marker);
    evidence.sourceUnchanged = digest(fs.readFileSync(input)) === original;
    evidence.temporaryFiles = fs.readdirSync(dir).filter(name => name.includes('.tmp-'));
    assert.ok(failed, 'Injected encoder failure must not return success');
    assert.equal(evidence.encoderInvoked, true, 'The injected crash must actually occur in the encoder');
    assert.equal(evidence.sourceUnchanged, true, 'A failed in-place conversion must preserve all original bytes');
    assert.deepEqual(evidence.temporaryFiles, []);
  });

  await check('invalid-input-preserves-existing-destination', () => {
    const input = fixture('invalid.jpg'), output = fixture('existing.webp');
    fs.writeFileSync(input, 'not an image'); fs.writeFileSync(output, 'keep-existing');
    assert.throws(() => convertirImatgeAWebp(input, output));
    assert.equal(fs.readFileSync(input, 'utf8'), 'not an image');
    assert.equal(fs.readFileSync(output, 'utf8'), 'keep-existing');
  });
} catch (error) {
  failures++;
  report.fatal = { message: error.message, code: error.code ?? null };
} finally {
  report.sourceSha256After = sourceHash();
  report.sourceUnchanged = beforeHash === report.sourceSha256After;
  if (!report.sourceUnchanged) {
    failures++;
    report.invalidated = 'Converter changed during audit; no result certifies either version.';
  }
  try { fs.rmSync(dir, { recursive: true, force: true }); report.syntheticFilesCleaned = true; }
  catch (error) { failures++; report.cleanupError = error.message; }
  report.failures = failures;
  report.status = report.sourceUnchanged ? (failures ? 'failed' : 'passed') : 'invalidated';
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
}
console.log(JSON.stringify({ status: report.status, failures, reportPath,
  probes: report.probes.map(({ name, pass }) => ({ name, pass })), sourceUnchanged: report.sourceUnchanged }, null, 2));
process.exitCode = failures ? 1 : 0;
