#!/usr/bin/env node
/** Ús: node tooling/seo/verifica-mapa-301.mjs inventari.json
 * JSON: {redireccions:[{source,destination,status:301}],destinsDisponibles:[],
 *        origensEsperats:[]} · només lectura local, no peticions HTTP.
 */
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { validaMapaRedireccions301 } from '../../src/utils/mapaRedireccions301.js';

export function main(args = process.argv.slice(2)) {
  if (args.length !== 1 || args[0].startsWith('-')) throw new TypeError('Ús: verifica-mapa-301.mjs inventari.json');
  const bytes = fs.readFileSync(args[0]);
  if (bytes.byteLength > 8 * 1024 * 1024) throw new TypeError('Inventari superior a 8 MiB.');
  const inventari = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  const resultat = validaMapaRedireccions301(inventari.redireccions, inventari);
  process.stdout.write(`${JSON.stringify(resultat, null, 2)}\n`);
  return resultat.valid ? 0 : 1;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try { process.exitCode = main(); }
  catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}
