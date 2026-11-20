#!/usr/bin/env node
/** Offline local-only import. Writes only stdout; review artifacts never publish.
 * npm run importacio:editorial -- --format wordpress-wxr --input /abs/export.xml
 * [--adjunts /abs/media.json] [--mapa /abs/destinations.json]
 * media.json: [{url,file,sha256?}]; files must stay under its directory.
 * destinations.json: {destinsDisponibles:[],destinacions:{legacyURL:finalPath}} */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { importaEditorial, LIMITS_EDITORIALS } from '../../src/data/importacioEditorial/index.js';
import { generaTaulaEditorial301 } from './mapa-editorial-301.mjs';

/** Reading is capped even if another process grows the file after fstat.
 * O_NOFOLLOW covers the leaf; every parent component is checked as well. */
export function lligFitxerEditorialAcotat(file, maxBytes = LIMITS_EDITORIALS.bytes) {
  if (typeof file !== 'string' || !path.isAbsolute(file) || !Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > LIMITS_EDITORIALS.totalMediaBytes) throw new TypeError('Cal ruta absoluta i pressupost finit.');
  let part = path.parse(file).root;
  const absolute = path.resolve(file);
  // macOS exposes these two OS-owned aliases; arbitrary source symlinks fail.
  const alias = ['/tmp', '/var'].find(p => absolute.startsWith(p + path.sep) && fs.lstatSync(p).isSymbolicLink());
  const resolved = alias ? fs.realpathSync(alias) + absolute.slice(alias.length) : absolute;
  const observed = [];
  for (const name of resolved.slice(part.length).split(path.sep)) {
    part = path.join(part, name);
    const stat = fs.lstatSync(part);
    if (stat.isSymbolicLink() || part !== resolved && !stat.isDirectory()) throw new TypeError('No es permeten enllaços simbòlics d’importació.');
    observed.push({ path: part, dev: stat.dev, ino: stat.ino, mode: stat.mode, size: stat.size, mtimeMs: stat.mtimeMs, ctimeMs: stat.ctimeMs });
  }
  const expected = observed.at(-1);
  const revalidate = () => {
    for (const before of observed) {
      const after = fs.lstatSync(before.path);
      if (after.isSymbolicLink() || after.dev !== before.dev || after.ino !== before.ino || after.mode !== before.mode) throw new TypeError('Ruta modificada durant la lectura.');
    }
  };
  const fd = fs.openSync(resolved, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW | fs.constants.O_NONBLOCK);
  try {
    const stat = fs.fstatSync(fd);
    if (!stat.isFile() || stat.nlink > 1 || stat.size > maxBytes) throw new TypeError('Entrada no regular, hardlink o fora de pressupost.');
    if (stat.dev !== expected.dev || stat.ino !== expected.ino || stat.mode !== expected.mode || stat.size !== expected.size || stat.mtimeMs !== expected.mtimeMs || stat.ctimeMs !== expected.ctimeMs) throw new TypeError('Entrada substituïda abans de la lectura.');
    revalidate();
    const chunks = [];
    let total = 0;
    while (total <= maxBytes) {
      const chunk = Buffer.alloc(Math.min(64 * 1024, maxBytes + 1 - total));
      const count = fs.readSync(fd, chunk, 0, chunk.byteLength, null);
      if (!count) break;
      total += count;
      if (total > maxBytes) throw new TypeError('Entrada creixent fora de pressupost.');
      chunks.push(chunk.subarray(0, count));
    }
    revalidate();
    const after = fs.fstatSync(fd);
    if (stat.size !== after.size || stat.mtimeMs !== after.mtimeMs || stat.ctimeMs !== after.ctimeMs || total !== after.size) throw new TypeError('Entrada modificada durant la lectura.');
    return Buffer.concat(chunks, total);
  } finally { fs.closeSync(fd); }
}
const decode = bytes => new TextDecoder('utf-8', { fatal: true }).decode(bytes);
export async function main(args = process.argv.slice(2), io = process) {
  const options = Object.create(null);
  for (let i = 0; i < args.length; i += 2) {
    if (!['--input', '--format', '--adjunts', '--mapa'].includes(args[i]) || !args[i + 1] || Object.hasOwn(options, args[i])) throw new TypeError('Ús: --format wordpress-wxr|wordpress-json|blogger-atom|blogger-json --input /absolute/file [--adjunts /absolute/media.json] [--mapa /absolute/map.json]');
    options[args[i]] = args[i + 1];
  }
  if (!options['--format'] || !options['--input']) throw new TypeError('Cal format i fitxer d’entrada.');
  const adjunts = [];
  if (options['--adjunts']) {
    const manifest = JSON.parse(decode(lligFitxerEditorialAcotat(options['--adjunts'])));
    if (!Array.isArray(manifest) || manifest.length > LIMITS_EDITORIALS.articles) throw new TypeError('Manifest d’adjunts invàlid.');
    const mediaRoot = path.dirname(path.resolve(options['--adjunts']));
    let total = 0;
    for (const item of manifest) {
      if (!item || typeof item !== 'object' || typeof item.file !== 'string' || path.isAbsolute(item.file) || item.file.split(/[\\/]/).some(p => !p || p === '.' || p === '..')) throw new TypeError('Ruta d’adjunt invàlida.');
      const file = path.resolve(mediaRoot, item.file);
      if (!file.startsWith(mediaRoot + path.sep)) throw new TypeError('Adjunt fora del manifest.');
      const bytes = lligFitxerEditorialAcotat(file, LIMITS_EDITORIALS.mediaBytes);
      total += bytes.byteLength;
      if (total > LIMITS_EDITORIALS.totalMediaBytes) throw new TypeError('Adjunts fora del pressupost total.');
      adjunts.push({ url: item.url, sha256: item.sha256, bytes });
    }
  }
  const result = await importaEditorial(decode(lligFitxerEditorialAcotat(options['--input'])), { format: options['--format'], adjunts });
  const mapa301 = options['--mapa'] ? generaTaulaEditorial301(result.articles, JSON.parse(decode(lligFitxerEditorialAcotat(options['--mapa'])))) : null;
  io.stdout.write(JSON.stringify({ ...result, mapa301 }, null, 2) + '\n');
  return 0;
}
if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try { process.exitCode = await main(); }
  catch (error) { process.stderr.write(JSON.stringify({ valid: false, error: error.message }) + '\n'); process.exitCode = 1; }
}
