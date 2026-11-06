#!/usr/bin/env node
/** Fail-closed Nix proof runner. Node structural checks never stand in for Nix evaluation. */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {WIKI_DIR} from '../wiki/lib/project_paths.mjs';

export const ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
export const INPUT_REVISION = '7dcdd87373d72e7a2173e4db02e20d3d7f495cfd';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const SOURCE_PATHS = ['package.json', 'package-lock.json', 'index.html', 'firebase.json', 'vite.config.js',
  'AGENTS.md', '.agents/AGENTS.md', 'scripts/botigues/associacio-apps.json', 'scripts/supabase',
  'flake.nix', 'nix', 'src', 'public', 'tooling', 'supabase/migrations', 'supabase/ordre_desplegament.json',
  ...['01_ser', '02_saber', '03_actuar'].map(dir => `${path.basename(WIKI_DIR)}/${dir}`)];
const REQUIRED = ['flake.nix', 'nix/flake.nix', 'nix/module.nix', 'nix/node0.nix', 'nix/containers.nix',
  'nix/start-node0.mjs', 'nix/bootstrap-node0.mjs', 'package-lock.json'];
const fail = code => {throw Error(code);};
const regular = file => {
  const stat = fs.lstatSync(file);
  if (!stat.isFile() || stat.isSymbolicLink()) fail('nix_regular_file_required');
  return fs.readFileSync(file);
};
export function inventariFonts(root = ROOT) {
  root = path.resolve(root);
  const files = [];
  function walk(relative) {
    const file = path.join(root, relative), stat = fs.lstatSync(file);
    if (stat.isSymbolicLink()) fail('nix_source_symlink');
    if (stat.isDirectory()) {
      for (const name of fs.readdirSync(file).sort((a,b) => Buffer.compare(Buffer.from(a), Buffer.from(b)))) walk(path.posix.join(relative, name));
    } else if (stat.isFile()) {
      if (/^(?:\.env(?:\.|$)|docker\.env$)|\.(?:pem|key|p12)$/i.test(path.basename(file))) fail('nix_secret_like_source');
      const bytes = regular(file);
      files.push({path:relative, bytes:bytes.length, executable:Boolean(stat.mode & 0o111), sha256:sha(bytes)});
    } else fail('nix_source_special_file');
  }
  for (const relative of SOURCE_PATHS) walk(relative);
  return {files, sha256:sha(JSON.stringify(files))};
}
export function preparaFontNeta(root, inventory) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(),'sdp-nix-proof-'));
  try {
    for (const relative of SOURCE_PATHS) if (fs.lstatSync(path.join(root,relative)).isDirectory()) fs.mkdirSync(path.join(directory,relative),{recursive:true});
    for (const file of inventory.files) {
      const target = path.join(directory,file.path);
      fs.mkdirSync(path.dirname(target),{recursive:true});
      // Read once, compare with the captured inventory, then copy those exact bytes.
      const bytes = regular(path.join(root,file.path));
      if (sha(bytes) !== file.sha256) fail('nix_source_changed_before_copy');
      fs.writeFileSync(target,bytes,{flag:'wx',mode:file.executable ? 0o755 : 0o644});
      fs.utimesSync(target,315532800,315532800);
    }
    function dates(dir) {for (const name of fs.readdirSync(dir)) {const child = path.join(dir,name); if (fs.lstatSync(child).isDirectory()) dates(child);} fs.utimesSync(dir,315532800,315532800);}
    dates(directory);
    return directory;
  } catch(error) {fs.rmSync(directory,{recursive:true,force:true}); throw error;}
}
export function validaLock(root = ROOT) {
  for (const file of ['flake.nix','nix/flake.nix']) {
    const match = regular(path.join(root,file)).toString('utf8').match(/inputs\.nixpkgs\.url\s*=\s*"github:NixOS\/nixpkgs\/([a-f0-9]{40})";/);
    if (match?.[1] !== INPUT_REVISION) fail('nix_input_revision_drift');
  }
  let lock;
  try {lock = JSON.parse(regular(path.join(root,'nix/flake.lock')));} catch (error) {
    if (error.code === 'ENOENT') fail('nix_lock_missing');
    if (error.message === 'nix_regular_file_required') throw error;
    fail('nix_lock_invalid_json');
  }
  if (lock?.version !== 7 || lock.root !== 'root' || Object.keys(lock.nodes ?? {}).sort().join(',') !== 'nixpkgs,root'
      || lock.nodes.root.inputs?.nixpkgs !== 'nixpkgs') fail('nix_lock_graph');
  const {locked, original} = lock.nodes.nixpkgs;
  for (const entry of [locked, original]) {
    if (entry?.type !== 'github' || entry.owner !== 'NixOS' || entry.repo !== 'nixpkgs' || entry.rev !== INPUT_REVISION) fail('nix_lock_identity');
  }
  const digest = locked.narHash;
  if (typeof digest !== 'string' || !/^sha256-[A-Za-z0-9+/]{43}=$/.test(digest)
      || Buffer.from(digest.slice(7),'base64').length !== 32
      || Buffer.from(digest.slice(7),'base64').toString('base64') !== digest.slice(7)
      || !Number.isSafeInteger(locked.lastModified) || locked.lastModified < 0) fail('nix_lock_digest');
  // The format is checked here; Nix must fetch/verify the NAR before certification.
  return {lock, locked, sha256:sha(regular(path.join(root,'nix/flake.lock')))};
}
export function executaNix(binary, args, {cwd, timeoutMs = 900000, maxBytes = 16*1024*1024} = {}) {
  return new Promise(resolve => {
    const child = spawn(binary, args, {cwd, shell:false, stdio:['ignore','pipe','pipe']});
    let stdout = '', stderr = '', size = 0, failure = null, killTimer;
    const stop = code => {if (failure) return; failure = code; child.kill('SIGTERM'); killTimer = setTimeout(() => child.kill('SIGKILL'), 500);};
    const timer = setTimeout(() => stop('nix_command_timeout'), timeoutMs);
    const append = field => bytes => {
      size += bytes.length;
      if (size > maxBytes) {stop('nix_command_output_limit'); return;}
      if (field === 'stdout') stdout += bytes.toString('utf8'); else stderr += bytes.toString('utf8');
    };
    child.stdout.on('data',append('stdout')); child.stderr.on('data',append('stderr'));
    child.on('error',error => {failure = error.code === 'ENOENT' ? 'nix_unavailable' : 'nix_spawn_failed';});
    child.on('close',code => {clearTimeout(timer); clearTimeout(killTimer); resolve({status:code, stdout, stderr, error:failure});});
  });
}
const json = result => {try {return JSON.parse(result.stdout);} catch {fail('nix_command_invalid_json');}};
const FLAGS = ['--extra-experimental-features','nix-command flakes'];
const LOCK_FLAGS = ['--no-update-lock-file','--no-write-lock-file'];
const DRV_PATH = /^\/nix\/store\/[0-9a-z]{32}-[^/\n]+\.drv$/;
const OUT_PATH = /^\/nix\/store\/[0-9a-z]{32}-[^/\n]+$/;
export async function verificaFlake({root = ROOT, mode = 'full', system = 'x86_64-linux', runner = executaNix, nixBinary = 'nix'} = {}) {
  if (!['inspect','evaluation','full'].includes(mode) || !['x86_64-linux','aarch64-linux'].includes(system)) fail('nix_verifier_options');
  root = path.resolve(root);
  const report = {schema:'socdepoble-nix-reproducibility/1', mode, system, verified:false,
    evidenceKind:runner === executaNix ? 'native-process' : 'test-double', status:'incomplete',
    inputRevision:INPUT_REVISION, checks:[], issues:[], commands:[]};
  let before, locked;
  for (const relative of REQUIRED) {
    try {regular(path.join(root,relative));} catch {report.issues.push('nix_required_file_missing:'+relative);}
  }
  try {locked = validaLock(root); report.lockSha256 = locked.sha256;} catch(error) {report.issues.push(error.message);}
  try {before = inventariFonts(root); report.sources = {files:before.files.length, sha256:before.sha256};} catch(error) {report.issues.push(error.message.startsWith('nix_') ? error.message : 'nix_source_inventory_failed');}
  async function run(args) {
    const result = await runner(nixBinary,[...FLAGS,...args],{cwd:root});
    report.commands.push({args, status:result.status, stdoutSha256:sha(result.stdout ?? ''), stderrSha256:sha(result.stderr ?? '')});
    if (result.error || result.status !== 0) fail(result.error ?? 'nix_command_failed');
    return result;
  }
  try {
    const version = await run(['--version']);
    if (!/^nix \(Nix\) \d+\.\d+(?:\.\d+)?\S*\s*$/.test(version.stdout)) fail('nix_version_unrecognized');
    report.nixVersion = version.stdout.trim();
  } catch(error) {report.issues.push(error.message);}
  if (mode === 'inspect' || report.issues.length) return report;
  // Never pass the repository to a path fetcher: .env/.git and unrelated files
  // would enter the world-readable store. Only the inventoried public files do.
  let stage;
  try {
    stage = preparaFontNeta(root,before);
    const ref = 'path:'+stage.split(path.sep).map(encodeURIComponent).join('/')+'?dir=nix';
    report.sourceSnapshot = {kind:'allowlisted-path', sourceDateEpoch:315532800,
      releaseGitMetadata:false, includesUntrackedSource:true};
    const metadata = json(await run(['flake','metadata','--json',...LOCK_FLAGS,ref]));
    const observed = metadata.locks?.nodes?.nixpkgs?.locked;
    if (!observed || ['type','owner','repo','rev','narHash','lastModified'].some(key => observed[key] !== locked.locked[key])) fail('nix_metadata_lock_mismatch');
    report.checks.push({name:'locked-input-nar',passed:true});
    await run(['flake','check','--no-build',...LOCK_FLAGS,ref]);
    for (const name of ['module-evaluation','node0-evaluation','container-evaluation']) {
      const args = ['eval','--json','--option','eval-cache','false',...LOCK_FLAGS,`${ref}#checks.${system}.${name}.drvPath`];
      const first = json(await run(args)), second = json(await run(args));
      if (typeof first !== 'string' || !DRV_PATH.test(first) || first !== second) fail('nix_evaluation_not_reproducible');
      report.checks.push({name,passed:true,drvPath:first});
    }
    if (mode === 'full') {
      const target = `${ref}#packages.${system}.web`;
      const first = json(await run(['build','--no-link','--json',...LOCK_FLAGS,target]));
      const rebuilt = json(await run(['build','--no-link','--json','--rebuild',...LOCK_FLAGS,target]));
      const output = value => {
        if (!Array.isArray(value) || value.length !== 1 || !DRV_PATH.test(value[0].drvPath ?? '')
          || !OUT_PATH.test(value[0].outputs?.out ?? '') || !OUT_PATH.test(value[0].outputs?.integritat ?? '')) fail('nix_build_output_invalid');
        return value[0];
      };
      const a = output(first), b = output(rebuilt);
      if (JSON.stringify(a) !== JSON.stringify(b)) fail('nix_build_derivation_drift');
      const hashes = {};
      for (const [name,storePath] of Object.entries(a.outputs)) {
        const result = await run(['hash','path','--type','sha256',storePath]);
        if (!/^sha256-[A-Za-z0-9+/]{43}=\s*$/.test(result.stdout)) fail('nix_output_hash_invalid');
        hashes[name] = result.stdout.trim();
      }
      report.checks.push({name:'web-rebuild',passed:true,drvPath:a.drvPath,outputs:a.outputs,narHashes:hashes});
      for (const name of ['module-http','node0-http']) {
        await run(['build','--no-link',...LOCK_FLAGS,`${ref}#checks.${system}.${name}`]);
        report.checks.push({name,passed:true});
      }
    }
    if (inventariFonts(root).sha256 !== before.sha256 || validaLock(root).sha256 !== locked.sha256) fail('nix_sources_changed_during_verification');
    report.verified = mode === 'full' && runner === executaNix;
    report.status = report.verified ? 'verified' : runner === executaNix ? 'evaluated-build-pending' : 'simulated';
  } catch(error) {report.issues.push(error.message.startsWith('nix_') ? error.message : 'nix_verification_failed');}
  finally {if (stage) fs.rmSync(stage,{recursive:true,force:true});}
  return report;
}
export async function main(argv = process.argv.slice(2)) {
  const options = {}; let output;
  for (const arg of argv) {
    if (arg === '--inspect') options.mode = 'inspect';
    else if (arg === '--evaluation-only') options.mode = 'evaluation';
    else if (arg.startsWith('--root=')) options.root = path.resolve(arg.slice(7));
    else if (arg.startsWith('--system=')) options.system = arg.slice(9);
    else if (arg.startsWith('--out=')) output = path.resolve(arg.slice(6));
    else fail('nix_verifier_argument');
  }
  const report = await verificaFlake(options), bytes = JSON.stringify(report,null,2)+'\n';
  if (output) fs.writeFileSync(output,bytes,{flag:'wx'});
  process.stdout.write(bytes);
  return report.verified ? 0 : 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().then(code => {process.exitCode = code;}).catch(error => {process.stderr.write((error.message.startsWith('nix_') ? error.message : 'nix_verification_failed')+'\n'); process.exitCode = 1;});
}
