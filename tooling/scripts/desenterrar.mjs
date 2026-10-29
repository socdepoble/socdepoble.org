#!/usr/bin/env node
/** Retired duplicate restoration CLI. The canonical route owns its receipt and seal contract. */
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {realpathSync} from 'node:fs';
export const CANONICAL_CLI='tooling/brain/desenterrar.mjs';
const message=`Ruta retirada: usa node ${CANONICAL_CLI} amb el seu contracte de rebut i segell vigent. El segell antic no es reutilitza. Esta ruta no executa Git ni restaura fitxers.`;
let main=false;
try{main=Boolean(process.argv[1])&&realpathSync(path.resolve(process.argv[1]))===realpathSync(fileURLToPath(import.meta.url));}catch{/* Imported by a host without a filesystem entrypoint. */}
if(main){
 const args=process.argv.slice(2),help=args.length===1&&['--help','-h'].includes(args[0]);
 if(help)console.log(message);else console.error(message);
 process.exitCode=help?0:2;
}
