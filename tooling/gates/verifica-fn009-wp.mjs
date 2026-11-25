#!/usr/bin/env node
/** Validate relocated local build evidence. Never compiles or contacts a service. */
import fs from 'node:fs';
import path from 'node:path';
import { readJsonFile, validateReceipt, invalidResult, exitCode } from './lib/fn009-wp-build.mjs';
// v1.2.25 · K-ARREL-PROMESA · La guarda d'entrada és la canònica (tractor-arrel A4 només acredita esMain).
import { esMain } from '../lib/arrel.mjs';

export function main(args = process.argv.slice(2)) {
  try {
    const found = {};
    for (let index = 0; index < args.length; index++) {
      const flag = args[index];
      if (!['--arrel', '--rebut'].includes(flag) || !args[index + 1] || args[index + 1].startsWith('--') || found[flag]) {
        throw new Error('Ús: --arrel REPO --rebut JSON; sense duplicats ni altres opcions');
      }
      found[flag] = args[++index];
    }
    if (!found['--arrel'] || !found['--rebut']) throw new Error('Calen --arrel i --rebut explícits');
    const explicit = path.resolve(found['--rebut']);
    if (fs.lstatSync(explicit).isSymbolicLink()) throw new Error('Rebut simbòlic refusat');
    const artifactRoot = fs.realpathSync(path.dirname(explicit));
    const receipt = readJsonFile(path.join(artifactRoot, path.basename(explicit)));
    const result = validateReceipt(receipt, { root: fs.realpathSync(found['--arrel']), artifactRoot });
    console.log(JSON.stringify(result, null, 2));
    return exitCode(result);
  } catch (error) {
    console.log(JSON.stringify(invalidResult(error), null, 2));
    return 2;
  }
}

if (esMain(import.meta.url)) process.exitCode = main();
