#!/usr/bin/env node
/** Entrades operatives dels motors purs. Només llig un fitxer JSON regular;
 * emet un esborrany o un càlcul, mai envia comandes ni escriu dades remotes. */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { disponibilitatSenseSolapament } from '../../src/data/calendari/disponibilitatSenseSolapament.js';
import { exportaGestoriaCentims } from '../../src/data/esborranyGestoriaCentims.js';
import { planificaReposicioInventari } from '../../src/data/reposicioInventariEsdeveniments.js';

export function calculaDades(mode, input) {
  if (mode === 'disponibilitat') {
    if (!input || typeof input !== 'object' || Array.isArray(input)
      || Object.keys(input).some(k => !['intervals', 'capacitat'].includes(k))) throw new TypeError('Entrada de disponibilitat invàlida.');
    return disponibilitatSenseSolapament(input.intervals, { capacitat: input.capacitat ?? 1 });
  }
  if (mode === 'gestoria') return exportaGestoriaCentims(input);
  if (mode === 'reposicio') return planificaReposicioInventari(input);
  throw new TypeError('Mode desconegut: disponibilitat, gestoria o reposicio.');
}

export function main(args = process.argv.slice(2), io = process) {
  if (args.length !== 2 || !['disponibilitat', 'gestoria', 'reposicio'].includes(args[0])) {
    throw new TypeError('Ús: calcula-dades.mjs disponibilitat|gestoria|reposicio entrada.json');
  }
  const fd = fs.openSync(args[1], fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW | fs.constants.O_NONBLOCK);
  let bytes;
  try {
    const stat = fs.fstatSync(fd);
    if (!stat.isFile() || stat.size > 32 * 1024 * 1024) throw new TypeError('Cal un JSON regular de fins a 32 MiB.');
    const limit = 32 * 1024 * 1024;
    const chunks = [];
    let total = 0;
    while (true) {
      const chunk = Buffer.allocUnsafe(Math.min(64 * 1024, limit + 1 - total));
      const count = fs.readSync(fd, chunk, 0, chunk.length, null);
      if (!count) break;
      total += count;
      if (total > limit) throw new TypeError('JSON fora de pressupost.');
      chunks.push(chunk.subarray(0, count));
    }
    bytes = Buffer.concat(chunks, total);
  } finally { fs.closeSync(fd); }
  const input = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  io.stdout.write(JSON.stringify(calculaDades(args[0], input)) + '\n');
  return 0;
}
if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try { process.exitCode = main(); }
  catch (error) { process.stderr.write(error.message + '\n'); process.exitCode = 1; }
}
