#!/usr/bin/env node
/** Schema-only bootstrap of the dedicated NixOS database: no invented public dataset. */
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {creaPlaMigracions, generaSql, aplicaAmbPsql} from '../tooling/node0/hidrata-postgres-node0.mjs';
const ROOT = fileURLToPath(new URL('..', import.meta.url));
export function main({env = process.env, run = spawnSync, stdout = process.stdout} = {}) {
  if (env.PGUSER !== 'postgres' || env.PGDATABASE !== 'socdepoble_node0' || env.PGHOST !== '/run/postgresql') throw Error('node0_nix_bootstrap_scope');
  const plan = creaPlaMigracions({root:ROOT});
  aplicaAmbPsql(generaSql(plan), {env, run});
  const result = run(env.NODE0_PSQL, ['-X', '-w', '-q', '-v', 'ON_ERROR_STOP=1', '-f', path.join(ROOT, 'tooling/node0/schema-node0.sql')], {env, encoding:'utf8', timeout:120000, maxBuffer:1024*1024, shell:false});
  if (result.error || result.status !== 0) throw Error('node0_nix_runtime_schema');
  stdout.write(JSON.stringify({schema:'socdepoble-node0-nixos-bootstrap/1', migrations:plan.migrations.length, orderSha256:plan.orderSha256, publicDataImported:false})+'\n');
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {main();} catch {process.stderr.write('node0_nix_bootstrap_failed\n'); process.exitCode = 1;}
}
