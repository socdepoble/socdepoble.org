#!/usr/bin/env node
/** Read-only conformance kit. No remote requests, publication or cache writes. */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { esMain } from '../lib/arrel.mjs';
import { validaActivityPub, validaWebFinger } from '../../src/data/federacio/conformitat.js';
import { construeixFitxersFederats, construeixWebFinger, urlsDeMunicipi } from '../../src/data/activitypub.js';

const fail = (code) => { throw Object.assign(new TypeError(code), { code }); };
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
function readRegular(file, limit = 16 * 1024 * 1024) {
  const listed = fs.lstatSync(file);
  if (!listed.isFile() || listed.isSymbolicLink()) fail('OD_FILE_INVALID');
  const fd = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW | fs.constants.O_NONBLOCK);
  try {
    const before = fs.fstatSync(fd);
    if (!before.isFile() || before.nlink !== 1 || before.size > limit
      || before.dev !== listed.dev || before.ino !== listed.ino) fail('OD_FILE_INVALID');
    const bytes = fs.readFileSync(fd), after = fs.fstatSync(fd);
    if (bytes.length !== before.size || after.size !== before.size || after.mtimeMs !== before.mtimeMs) fail('OD_FILE_CHANGED');
    return bytes;
  } finally { fs.closeSync(fd); }
}

/** Check the actual bytes named by public/opendata/manifest.json. A manifest is
 * an integrity inventory, not an author signature or proof of current data.
 */
export function verificaManifestOpenData(directory) {
  const root = path.resolve(directory);
  if (fs.lstatSync(root).isSymbolicLink() || !fs.lstatSync(root).isDirectory()) fail('OD_ROOT_INVALID');
  const manifestBytes = readRegular(path.join(root, 'manifest.json'), 1024 * 1024);
  const manifest = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(manifestBytes));
  if (!Array.isArray(manifest.resources) || !manifest.resources.length || manifest.resources.length > 256) fail('OD_RESOURCES_INVALID');
  const paths = new Set(), names = new Set(), result = [];
  for (const entry of manifest.resources) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)
      || typeof entry.path !== 'string' || !/^[a-z0-9][a-z0-9._-]{0,127}$/.test(entry.path)
      || entry.path.includes('..') || entry.path === 'manifest.json' || paths.has(entry.path)
      || typeof entry.name !== 'string' || !entry.name || names.has(entry.name)
      || !Number.isSafeInteger(entry.bytes) || entry.bytes < 0
      || typeof entry.hash !== 'string' || !/^sha256:[a-f0-9]{64}$/.test(entry.hash)) fail('OD_RESOURCE_INVALID');
    paths.add(entry.path); names.add(entry.name);
    const bytes = readRegular(path.join(root, entry.path));
    if (bytes.length !== entry.bytes || `sha256:${sha(bytes)}` !== entry.hash) fail('OD_INTEGRITY_MISMATCH');
    result.push({ path: entry.path, bytes: bytes.length, sha256: sha(bytes) });
  }
  if (!manifestBytes.equals(readRegular(path.join(root, 'manifest.json'), 1024 * 1024))) fail('OD_MANIFEST_CHANGED');
  return { valid: true, resources: result, manifestSha256: sha(manifestBytes), authenticity: 'not-verified' };
}

/** Run the same constructors used by production, including every object in
 * their outboxes. Negative vectors live in tests; nothing contacts a server.
 */
export function verificaPerfilFederat({ origen, actors }) {
  const actorIds = actors.map((actor) => urlsDeMunicipi(actor.slug, { origen, perfil: actor.perfil }).actor);
  const documents = [];
  for (const [file, document] of construeixFitxersFederats({ origen, actors })) {
    documents.push({ file, ...validaActivityPub(document, { origen, actorIds }) });
  }
  const webfinger = [];
  for (const actor of actors) {
    const urls = urlsDeMunicipi(actor.slug, { origen, perfil: actor.perfil });
    const resources = [urls.acct, urls.actor, urls.perfil,
      ...(actor.alies ?? []).map((name) => `acct:${name}@${new URL(origen).host}`)];
    for (const resource of resources) {
      webfinger.push(validaWebFinger(construeixWebFinger(resource, { origen, municipis: actors }), { resource, origen, municipis: actors }));
    }
  }
  return { valid: true, documents, webfinger, remoteInteropVerified: false };
}

if (esMain(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--json') continue;
      if (args[i] === '--opendata' && args[i + 1] && !args[i + 1].startsWith('--')) { i++; continue; }
      fail('ARGUMENT_INVALID');
    }
    if (args.filter((arg) => arg === '--opendata').length > 1) fail('ARGUMENT_INVALID');
    const at = args.indexOf('--opendata');
    if (at >= 0 && (!args[at + 1] || args[at + 1].startsWith('--'))) fail('ARGUMENT_INVALID');
    const directory = at < 0 ? path.resolve(fileURLToPath(new URL('../../public/opendata', import.meta.url))) : args[at + 1];
    const { preparaFederacio } = await import('../seo/genera-federacio.mjs');
    const prepared = await preparaFederacio({ origen: 'https://socdepoble.org', identitat: null });
    console.log(JSON.stringify({ federation: verificaPerfilFederat({ origen: prepared.origen, actors: prepared.actors }),
      openData: verificaManifestOpenData(directory) }, null, 2));
  } catch (error) { console.error(JSON.stringify({ valid: false, code: error.code ?? 'CONFORMANCE_FAILED', message: error.message })); process.exitCode = 1; }
}
