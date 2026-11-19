#!/usr/bin/env node
/** Export local per a revisió humana, sense escriure fitxers ni fer xarxa.
 * Ús: npm run gestoria:resum-anual -- operacions.json [--csv]
 * Entrada: {any:2026,operacions:[...]} amb dates {a,m,d} del model de Gestoria
 * i cèntims enters o cadenes exactes. No inferix deduïbilitat ni imports.
 * La destinació és stdout; el Mestre decidix si la desa. Mai presenta impostos.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { exportaResumAnualGestoria } from '../../src/sections/gestoria/historic/nucli/resumAnualGestoria.js';

export function main(args = process.argv.slice(2)) {
  if (args.length < 1 || args.length > 2 || args[0].startsWith('-')
    || (args.length === 2 && args[1] !== '--csv')) {
    throw new TypeError('Ús: resum-anual.mjs operacions.json [--csv]');
  }
  const fd = fs.openSync(args[0], 'r');
  let entrada;
  try {
    const info = fs.fstatSync(fd);
    if (!info.isFile() || info.size > 8 * 1024 * 1024) throw new TypeError('Cal un fitxer regular de fins a 8 MiB.');
    const bytes = fs.readFileSync(fd);
    if (bytes.byteLength > 8 * 1024 * 1024) throw new TypeError('Entrada superior a 8 MiB.');
    entrada = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } finally { fs.closeSync(fd); }
  if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada)
    || !Array.isArray(entrada.operacions)) throw new TypeError('Cal {any, operacions: [...]}.');
  const resultat = exportaResumAnualGestoria(entrada);
  process.stdout.write(args[1] === '--csv' ? resultat.csv : resultat.json);
  return 0;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try { process.exitCode = main(); }
  catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}
