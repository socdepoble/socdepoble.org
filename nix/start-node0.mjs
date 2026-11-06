#!/usr/bin/env node
/** systemd credential boundary. Secrets never enter a Nix derivation or command line. */
import fs from 'node:fs';
import path from 'node:path';
import {parseEnv} from 'node:util';
import {pathToFileURL} from 'node:url';

const SECRETS = new Set(['SDP_NODE0_ADMIN_TOKEN', 'MASTODON_ACCESS_TOKEN', 'SDP_MASTODON_ACCESS_TOKEN']);
export function preparaEntornNodeZero({env = process.env, readFile = file => {
  const stat = fs.lstatSync(file);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 32768 || (stat.mode & 0o077)) throw Error('node0_nix_credential_permissions');
  return fs.readFileSync(file, 'utf8');
}} = {}) {
  const directory = env.CREDENTIALS_DIRECTORY;
  if (typeof directory !== 'string' || !path.isAbsolute(directory) || directory.includes('\0')) throw Error('node0_nix_credential_directory');
  const secrets = parseEnv(readFile(path.join(directory, 'environment')));
  if (Object.keys(secrets).some(key => !SECRETS.has(key))) throw Error('node0_nix_credential_fields');
  if (typeof secrets.SDP_NODE0_ADMIN_TOKEN !== 'string' || secrets.SDP_NODE0_ADMIN_TOKEN.length < 32 || secrets.SDP_NODE0_ADMIN_TOKEN.length > 1024) throw Error('node0_nix_admin_token');
  for (const token of Object.values(secrets)) if (/\s/.test(token) || token.length > 4096) throw Error('node0_nix_token_format');
  if (secrets.MASTODON_ACCESS_TOKEN && secrets.SDP_MASTODON_ACCESS_TOKEN && secrets.MASTODON_ACCESS_TOKEN !== secrets.SDP_MASTODON_ACCESS_TOKEN) throw Error('node0_nix_mastodon_token_mismatch');
  // No PG*, auth/POSSE activation, host, executable or identity override from the secret file.
  return {PATH: env.PATH, HOME: '/var/lib/socdepoble-node0', LANG: 'C', LC_ALL: 'C',
    PGHOST: '/run/postgresql', PGPORT: '5432', PGDATABASE: 'socdepoble_node0', PGUSER: 'node0_runtime',
    PGPASSFILE: '/dev/null', NODE0_PSQL: env.NODE0_PSQL, SDP_NODE0_PORT: '4340',
    SDP_NODE0_KEY_FILE: '/var/lib/socdepoble-node0/node0_ed25519.json', ...secrets};
}
export async function main(options = {}) {
  const env = preparaEntornNodeZero(options);
  if (!path.isAbsolute(env.NODE0_PSQL ?? '')) throw Error('node0_nix_psql_path');
  const {main: start} = await import('../tooling/node0/servidor-node0-soberania.mjs');
  return start(env);
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch(() => {process.stderr.write('node0_nix_start_failed\n'); process.exitCode = 1;});
}
