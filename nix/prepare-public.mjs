#!/usr/bin/env node
/** Validació del contracte públic del build Nix. No crea cap inbox activa. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';

const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const MAX_FILE = 8 * 1024 * 1024;
const MAX_BUNDLE = 64 * 1024 * 1024;
const REQUIRED = ['agenda.jsonld', 'configuracio.json', 'directori.jsonld', 'llicencies.md',
  'memoria-cultural.jsonld', 'memoria.md', 'municipi.jsonld', 'noticies.jsonld', 'activitystreams.json'];

export function validaOpcionsNode(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('Configuració Nix absent.');
  const { domain, municipality: identity, enableActivityPub = true, enableOpenData = true } = value;
  const municipality = typeof identity === 'string'
    ? { slug: identity, name: identity === 'la-torre-de-les-macanes' ? 'La Torre de les Maçanes' : identity }
    : identity;
  if (typeof domain !== 'string' || domain.length > 253 || domain.length < 3 || !domain.includes('.')
    || !domain.split('.').every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) {
    throw new TypeError('Cal un domini DNS ASCII sense esquema, port, ruta ni directives.');
  }
  if (!municipality || typeof municipality !== 'object' || Array.isArray(municipality)
    || typeof municipality.slug !== 'string' || municipality.slug.length > 64
    || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(municipality.slug) || municipality.slug === 'socdepoble'
    || typeof municipality.name !== 'string' || municipality.name !== municipality.name.trim()
    || !municipality.name || municipality.name.length > 120 || /[\p{Cc}\p{Cf}\u2028\u2029]/u.test(municipality.name)) {
    throw new TypeError('Identitat municipal invàlida.');
  }
  if (typeof enableActivityPub !== 'boolean' || typeof enableOpenData !== 'boolean') throw new TypeError('Els interruptors han de ser booleans.');
  return Object.freeze({ domain, municipality: Object.freeze({ slug: municipality.slug, name: municipality.name }),
    enableActivityPub, enableOpenData, origin: `https://${domain}` });
}

function resourcePath(value) {
  if (typeof value !== 'string' || value.length > 256 || !/^[a-z0-9][a-z0-9/_.-]*$/.test(value)
    || value.split('/').some(part => !part || part === '.' || part === '..' || part.startsWith('.'))) {
    throw new TypeError('Camí públic Open Data invàlid.');
  }
  return value;
}

function confinedRegular(root, relative, { writing = false } = {}) {
  const rel = relative === '.well-known/nodeinfo' ? relative : resourcePath(relative);
  let cursor = root;
  const rootStat = fs.lstatSync(root);
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) throw new TypeError('Arrel pública no regular.');
  const parts = rel.split('/');
  for (let i = 0; i < parts.length; i++) {
    cursor = path.join(cursor, parts[i]);
    let stat;
    try { stat = fs.lstatSync(cursor); }
    catch (error) {
      if (writing && error.code === 'ENOENT') return path.join(root, rel);
      throw error;
    }
    if (stat.isSymbolicLink() || (i < parts.length - 1 ? !stat.isDirectory() : !stat.isFile())) {
      throw new TypeError('Recurs públic no regular o enllaç simbòlic.');
    }
  }
  return cursor;
}

function readBytes(root, relative) {
  const file = confinedRegular(root, relative);
  const stat = fs.statSync(file);
  if (stat.size > MAX_FILE) throw new TypeError('Recurs públic massa gran.');
  return fs.readFileSync(file);
}

export function llegeixOpenDataPublic(root, options) {
  const cfg = validaOpcionsNode(options);
  const manifestBytes = readBytes(root, 'manifest.json');
  const manifest = JSON.parse(manifestBytes);
  const meta = manifest.socdepoble;
  if (!meta || meta.format !== 'socdepoble.dadesobertes.v1' || meta.versio !== '1.2.0'
    || meta.municipi !== cfg.municipality.slug || !Array.isArray(manifest.resources) || manifest.resources.length > 256) {
    throw new TypeError('El paquet Open Data 1.2.0 no correspon al municipi configurat.');
  }
  const files = new Map([['manifest.json', manifestBytes]]);
  let total = manifestBytes.length;
  for (const resource of manifest.resources) {
    const relative = resourcePath(resource?.path);
    if (files.has(relative)) throw new TypeError('Recurs Open Data duplicat.');
    const bytes = readBytes(root, relative);
    if (resource.bytes !== bytes.length || resource.hash !== `sha256:${sha256(bytes)}`) throw new TypeError('Empremta o mida Open Data divergent.');
    total += bytes.length;
    if (total > MAX_BUNDLE) throw new TypeError('Paquet Open Data massa gran.');
    files.set(relative, bytes);
  }
  if (REQUIRED.some(name => !files.has(name))) throw new TypeError('Paquet Open Data incomplet.');
  const municipality = JSON.parse(files.get('municipi.jsonld').toString('utf8'));
  const config = JSON.parse(files.get('configuracio.json').toString('utf8'));
  if (municipality.identifier !== cfg.municipality.slug || municipality.name !== cfg.municipality.name
    || config.municipi?.slug !== cfg.municipality.slug || config.municipi?.nom !== cfg.municipality.name) {
    throw new TypeError('Identitat pública divergent entre manifest, municipi i configuració.');
  }
  return files;
}

/** Aliàs d'actor estable, contingut AP canònic i comprovació abans de cap escriptura. */
export async function preparaPublicacio({ root, dist, options, openDataSource } = {}) {
  const cfg = validaOpcionsNode(options);
  const dest = path.resolve(dist);
  if (dest === path.resolve(root) || !fs.lstatSync(dest).isDirectory() || fs.lstatSync(dest).isSymbolicLink()) throw new TypeError('Cal un dist separat i regular.');
  const pending = new Map();
  if (cfg.enableActivityPub) {
    const actorPath = `ap/actors/${cfg.municipality.slug}.json`;
    const bytes = readBytes(dest, actorPath);
    const actor = JSON.parse(bytes);
    const nodeinfo = JSON.parse(readBytes(dest, '.well-known/nodeinfo'));
    const detail = JSON.parse(readBytes(dest, 'nodeinfo/2.1.json'));
    const inbox = JSON.parse(readBytes(dest, `ap/inbox/${cfg.municipality.slug}`));
    if (actor.id !== `${cfg.origin}/${actorPath}` || actor.preferredUsername !== cfg.municipality.slug
      || actor.type !== 'Organization' || actor.inbox !== `${cfg.origin}/ap/inbox/${cfg.municipality.slug}`
      || actor.outbox !== `${cfg.origin}/ap/outbox/${cfg.municipality.slug}.json`
      || nodeinfo.links?.[0]?.href !== `${cfg.origin}/nodeinfo/2.1.json` || detail.version !== '2.1'
      || detail.openRegistrations !== false || detail.services?.inbound?.length !== 0
      || detail.metadata?.nodeName !== `${cfg.municipality.name} · Sóc de Poble`
      || detail.software?.homepage !== `${cfg.origin}/` || inbox.type !== 'OrderedCollection' || inbox.totalItems !== 0) {
      throw new TypeError('Actor, descoberta o NodeInfo no corresponen al node de lectura.');
    }
    // El node canònic conserva /ap/actors/<slug>.json; /ap/actor.json n'és un aliàs byte a byte.
    pending.set('ap/actor.json', bytes);
  }
  const data = cfg.enableOpenData ? llegeixOpenDataPublic(openDataSource ?? path.join(dest, 'opendata'), cfg) : null;
  if (data) for (const [name, bytes] of data) pending.set(`opendata/${name}`, bytes);
  // Comprovació sencera abans d'escriure: cap symlink d'eixida ni substitució d'un directori.
  for (const relative of pending.keys()) confinedRegular(dest, relative, { writing: true });
  for (const [relative, bytes] of pending) {
    const target = confinedRegular(dest, relative, { writing: true });
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, bytes);
  }
  return { municipality: cfg.municipality.slug, origin: cfg.origin, actorAlias: cfg.enableActivityPub,
    openDataVersion: data ? '1.2.0' : null, files: [...pending.keys()].sort(), inboxRuntime: false };
}

async function main(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (!['--root', '--dist', '--config', '--open-data-source'].includes(key) || args[key] || !argv[i + 1]) throw new TypeError('Ús: --root RUTA --dist RUTA --config JSON [--open-data-source RUTA]');
    args[key] = argv[++i];
  }
  if (!args['--root'] || !args['--dist'] || !args['--config']) throw new TypeError('Falta configuració pública del build.');
  const result = await preparaPublicacio({ root: args['--root'], dist: args['--dist'],
    options: JSON.parse(fs.readFileSync(args['--config'], 'utf8')), openDataSource: args['--open-data-source'] });
  console.log(JSON.stringify(result));
}
if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main(process.argv.slice(2)).catch(error => { console.error(`[socdepoble-nix] ${error.message}`); process.exitCode = 1; });
}
