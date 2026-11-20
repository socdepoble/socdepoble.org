#!/usr/bin/env node
/** P2-15: read-only startup inventory and explicit budget gate. Nothing is
 * rotated, deleted or rewritten. The projected text is the document tooling's
 * operational view; this is not a measurement of any agent's actual tokens.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { arrelSegura, esMain } from '../lib/arrel.mjs';
import { operationalDocumentText } from '../lib/document-corpus.mjs';
import { BYTES_PER_TOKEN } from '../documental/capitol-estat.mjs';

export const PRESSUPOST_ARRENCADA = Object.freeze({ bytesFont: 524_288, bytesProjectats: 70_000 });
const fail = (code) => { throw Object.assign(new TypeError(code), { code }); };
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

function read(root, relative) {
  if (typeof relative !== 'string' || !relative || relative.length > 1024 || relative.includes('\\')
    || path.isAbsolute(relative) || /[\u0000-\u001f\u007f]/.test(relative)
    || relative.split('/').some((part) => !part || part === '.' || part === '..'
      || ['01_produccio', '90_arxiu_historic', 'node_modules', '.git'].includes(part.normalize('NFKC').toLowerCase()))) fail('BOOT_SOURCE_FORBIDDEN');
  let file = root;
  let listed;
  for (const part of relative.split('/')) {
    file = path.join(file, part);
    listed = fs.lstatSync(file);
    if (listed.isSymbolicLink()) fail('BOOT_SYMLINK');
  }
  if (!listed.isFile()) fail('BOOT_SOURCE_INVALID');
  const fd = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW | fs.constants.O_NONBLOCK);
  try {
    const before = fs.fstatSync(fd);
    if (!before.isFile() || before.size > 1_048_576 || before.nlink !== 1
      || before.dev !== listed.dev || before.ino !== listed.ino) fail('BOOT_SOURCE_INVALID');
    const bytes = fs.readFileSync(fd), after = fs.fstatSync(fd);
    if (bytes.length !== before.size || before.size !== after.size || before.mtimeMs !== after.mtimeMs) fail('BOOT_SOURCE_CHANGED');
    const text = bytes.toString('utf8');
    if (!Buffer.from(text).equals(bytes)) fail('BOOT_UTF8_INVALID');
    return { text, bytes: bytes.length, sha256: sha(bytes) };
  } finally { fs.closeSync(fd); }
}

export function mesuraEconomiaArrencada(root, { pressupost = PRESSUPOST_ARRENCADA } = {}) {
  const base = fs.realpathSync(root), config = read(base, '.agents/cervell.json');
  const paths = JSON.parse(config.text).entrada;
  if (!Array.isArray(paths) || !paths.length || paths.length > 64 || new Set(paths).size !== paths.length) fail('BOOT_CATALOGUE_INVALID');
  if (!pressupost || !Number.isSafeInteger(pressupost.bytesFont) || pressupost.bytesFont < 1
    || !Number.isSafeInteger(pressupost.bytesProjectats) || pressupost.bytesProjectats < 1) fail('BOOT_BUDGET_INVALID');
  const fonts = paths.map((relative) => {
    const source = read(base, relative);
    const projection = operationalDocumentText(source.text, relative);
    const projected = Buffer.byteLength(projection);
    return { ruta: relative, bytesFont: source.bytes, bytesProjectats: projected,
      tokensEstimatsFont: Math.ceil(source.bytes / BYTES_PER_TOKEN),
      tokensEstimatsProjectats: Math.ceil(projected / BYTES_PER_TOKEN), sha256: source.sha256 };
  });
  if (read(base, '.agents/cervell.json').sha256 !== config.sha256) fail('BOOT_CATALOGUE_CHANGED');
  // Detect changes to earlier sources while a later source was being read.
  for (const source of fonts) if (read(base, source.ruta).sha256 !== source.sha256) fail('BOOT_SOURCE_CHANGED');
  if (read(base, '.agents/cervell.json').sha256 !== config.sha256) fail('BOOT_CATALOGUE_CHANGED');
  const totals = fonts.reduce((sum, source) => ({ bytesFont: sum.bytesFont + source.bytesFont,
    bytesProjectats: sum.bytesProjectats + source.bytesProjectats }), { bytesFont: 0, bytesProjectats: 0 });
  const incidencies = [];
  if (totals.bytesFont > pressupost.bytesFont) incidencies.push('BOOT_SOURCE_BUDGET');
  if (totals.bytesProjectats > pressupost.bytesProjectats) incidencies.push('BOOT_PROJECTION_BUDGET');
  return { schema: 'sdp.economia-arrencada.v1', valid: incidencies.length === 0, incidencies, fonts, totals,
    pressupost: { ...pressupost }, bytesPerTokenEstimat: BYTES_PER_TOKEN, tokenizerUsed: false,
    actualAgentTokensMeasured: false, documentsMoved: false, rotationPerformed: false,
    pendingHumanDecision: 'D-9/D-10: rotació física i doctrina d’arrencada continuen separades.' };
}

export function main(argv = process.argv.slice(2), root = null) {
  try {
    if (argv.some((arg) => arg !== '--json')) fail('BOOT_ARGUMENT_INVALID');
    const report = mesuraEconomiaArrencada(root ?? arrelSegura());
    console.log(JSON.stringify(report, null, 2));
    return report.valid ? 0 : 1;
  } catch (error) { console.error(JSON.stringify({ valid: false, code: error.code ?? 'BOOT_READ_FAILED' })); if (esMain(import.meta.url)) process.exitCode = 1; return 1; }
}
if (esMain(import.meta.url)) process.exitCode = main();
