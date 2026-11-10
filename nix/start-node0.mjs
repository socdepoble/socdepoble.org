#!/usr/bin/env node
/** systemd credential boundary. Secrets never enter a Nix derivation or command line. */
import fs from 'node:fs';
import path from 'node:path';
import {parseEnv} from 'node:util';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';

const SECRETS = new Set(['SDP_NODE0_ADMIN_TOKEN', 'MASTODON_ACCESS_TOKEN', 'SDP_MASTODON_ACCESS_TOKEN']);
// Substituted by mkNodeZeroRuntime with lib.getExe' pkgs.acl "getfacl".
// No environment variable or credential field can choose an executable.
const GETFACL = '@SDP_NODE0_GETFACL@';
export function validaAclCredencialSystemd(acl, uid) {
  if (!Number.isSafeInteger(uid) || uid <= 0 || typeof acl !== 'string' || acl.length > 4096) return false;
  return acl.trimEnd() === ['user::r--',`user:${uid}:r--`,'group::---','mask::r--','other::---'].join('\n');
}
function aclDescriptor(fd) {
  if (!/^\/nix\/store\/[a-z0-9]{32}-acl-[0-9][^/\s]*\/bin\/getfacl$/.test(GETFACL)) throw Error('node0_nix_credential_acl_binary');
  const result=spawnSync(GETFACL,['--omit-header','--absolute-names','--numeric','/proc/self/fd/3'],{
    env:{LANG:'C',LC_ALL:'C'},stdio:['ignore','pipe','pipe',fd],encoding:'utf8',timeout:3000,maxBuffer:4096,shell:false
  });
  if (result.error || result.status !== 0) throw Error('node0_nix_credential_permissions');
  return result.stdout;
}
const identity = s => [s.dev,s.ino,s.uid,s.gid,s.mode,s.nlink,s.size,s.mtimeMs,s.ctimeMs];
const same = (a,b) => JSON.stringify(identity(a)) === JSON.stringify(identity(b));
export function llegixCredencialNodeZero(file, {uid=process.getuid?.(),readACL=aclDescriptor}={}) {
  let fd;
  try {
    const named=fs.lstatSync(file);
    if (!named.isFile() || named.isSymbolicLink()) throw Error('invalid');
    fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK);
    const before=fs.fstatSync(fd),mode=before.mode&0o7777;
    if (!same(named,before) || before.nlink!==1 || before.size>32768 || !Number.isSafeInteger(uid) || uid<0) throw Error('invalid');
    const privateOwner=before.uid===uid && [0o400,0o600].includes(mode);
    // systemd260 uses a root-owned0400 file plus one named-user read ACL.
    // Its ACL mask appears as0440 in stat; group read remains forbidden.
    const systemdACL=!privateOwner && before.uid===0 && uid>0 && mode===0o440
      && validaAclCredencialSystemd(readACL(fd),uid);
    if (!privateOwner && !systemdACL) throw Error('invalid');
    const buffer=Buffer.alloc(32769),length=fs.readSync(fd,buffer,0,buffer.length,0);
    if (length!==before.size || !same(before,fs.fstatSync(fd)) || !same(before,fs.lstatSync(file))) throw Error('changed');
    return new TextDecoder('utf-8',{fatal:true}).decode(buffer.subarray(0,length));
  } catch {throw Error('node0_nix_credential_permissions');}
  finally {if (fd!==undefined) fs.closeSync(fd);}
}
export function preparaEntornNodeZero({env = process.env, readFile = llegixCredencialNodeZero} = {}) {
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
