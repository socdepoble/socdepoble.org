#!/usr/bin/env node
/** Explicit slow producer. The private worker is this same reviewed file. */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { performance } from 'node:perf_hooks';
import {
  SCHEMA, PROFILE, BUDGETS, CONFIG_PATH, createContext, captureSnapshot,
  captureOutputs, captureAst, captureRuntimePins, runtimeIdentitySet, captureConfigIds,
  moduleIdentity, toolIdentity, dependencyDeclarations,
  graphSummary, artifactPin, readJsonFile, normalProcess, parseLawLog,
  deriveMetrics, validateReceipt, invalidResult, exitCode, sha256
} from './lib/fn009-wp-build.mjs';
// v1.2.25 · K-ARREL-PROMESA · La guarda d'entrada és la canònica (tractor-arrel A4 només acredita esMain):
// compara import.meta.url amb el camí real de process.argv[1], i per tant també accepta els àlies del CLI.
import { esMain } from '../lib/arrel.mjs';

const WORKER_SCHEMA = 'sdp.fn009.worker.v1';
const TIMEOUT_MS = 600_000;
const self = fileURLToPath(import.meta.url);
const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const sortedSet = values => [...new Set(values)].sort(compare);

function insist(condition, message) { if (!condition) throw new Error(message); }
function writeJson(file, value) { fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', { flag: 'wx', mode: 0o644 }); }
function processInfo(result) {
  return normalProcess(result.status, result.signal ?? null, result.error?.code ?? null, result.error?.code === 'ENOBUFS');
}

function options(args) {
  const found = {};
  for (let index = 0; index < args.length; index++) {
    const flag = args[index];
    insist(['--arrel', '--sortida'].includes(flag), 'Ús: --arrel REPO --sortida DIRECTORI_NOU');
    insist(args[index + 1] && !args[index + 1].startsWith('--') && !found[flag], 'Valor absent o opció duplicada');
    found[flag] = args[++index];
  }
  insist(found['--arrel'] && found['--sortida'], 'Calen --arrel i --sortida explícits');
  return found;
}

function minimalEnvironment(privateDirectory, token) {
  const environment = {
    PATH: process.platform === 'win32' ? `${process.env.SystemRoot ?? 'C:\\Windows'}\\System32` : '/usr/bin:/bin:/usr/sbin:/sbin',
    TMPDIR: privateDirectory, TMP: privateDirectory, TEMP: privateDirectory,
    LANG: 'C', LC_ALL: 'C', CI: '1', NODE_ENV: 'production',
    SDP_FN009_WORKER_TOKEN: token,
    SDP_RELEASE: '', SDP_VARIANT: '', SDP_PAQUET: '', SDP_VERSIO: '', SOURCE_DATE_EPOCH: '0',
    VITE_SUPABASE_URL: 'https://fixture.invalid',
    VITE_SUPABASE_ANON_KEY: 'sb_publishable_fixturesintetica',
    VITE_DATA_MODE: 'remote', VITE_TENANT_ID: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  };
  if (process.platform === 'win32') environment.SystemRoot = process.env.SystemRoot ?? 'C:\\Windows';
  return environment;
}

function validateWorkerJob(job, jobFile) {
  insist(job && typeof job === 'object' && !Array.isArray(job), 'Job worker invàlid');
  insist(JSON.stringify(Object.keys(job).sort()) === JSON.stringify(['schema', 'root', 'output', 'privateDirectory', 'token'].sort()), 'Camps worker divergents');
  insist(job.schema === WORKER_SCHEMA && job.token === process.env.SDP_FN009_WORKER_TOKEN && typeof job.token === 'string' && job.token.length >= 32, 'Worker privat sense token local');
  for (const field of ['root', 'output', 'privateDirectory']) insist(typeof job[field] === 'string' && path.isAbsolute(job[field]), 'Ruta worker no explícita');
  const output = fs.realpathSync(job.output);
  const root = fs.realpathSync(job.root);
  const privateDirectory = fs.realpathSync(job.privateDirectory);
  insist(output !== root && !output.startsWith(root + path.sep), 'Sortida worker dins del repo refusada');
  insist(privateDirectory === path.join(output, '.worker'), 'Temporal worker fora de la sortida');
  insist(path.dirname(jobFile) === privateDirectory && fs.statSync(privateDirectory).mode % 0o1000 === 0o700, 'Temporal worker no privat');
  insist((fs.statSync(jobFile).mode & 0o777) === 0o600, 'Job worker no privat');
  insist(JSON.stringify(fs.readdirSync(output)) === JSON.stringify(['.worker']), 'La sortida worker conté entrades prèvies');
  insist(!fs.existsSync(path.join(output, 'rebut.json')) && !fs.existsSync(path.join(output, 'build')), 'Sortida worker ja ocupada');
  const environmentDirectory = path.join(privateDirectory, 'env');
  insist(fs.lstatSync(environmentDirectory).isDirectory() && !fs.lstatSync(environmentDirectory).isSymbolicLink()
    && fs.readdirSync(environmentDirectory).length === 0, 'cwd/envDir worker no buit o no regular');
  return { ...job, root, output, privateDirectory };
}

async function worker(jobFile) {
  const job = validateWorkerJob(readJsonFile(jobFile), jobFile);
  const context = createContext(job.root);
  const identityBefore = toolIdentity(context);
  const before = captureSnapshot(context.root);
  const initialRuntime = new Map();
  const modulesRaw = [];
  const chunksRaw = [];
  const warnings = [];
  const configIds = captureConfigIds(context);

  function observeFile(rawId) {
    const item = moduleIdentity(rawId, context);
    if (item.fileId && !initialRuntime.has(item.fileId)) {
      initialRuntime.set(item.fileId, captureRuntimePins([item.fileId], context)[0]);
    }
  }
  for (const file of context.metadataFiles) observeFile(file);
  for (const id of configIds) initialRuntime.set(id, captureRuntimePins([id], context)[0]);
  const plugin = {
    name: 'sdp-fn009-material-capture', enforce: 'pre',
    configResolved(config) {
      for (const file of config.configFileDependencies ?? []) observeFile(file);
    },
    load(id) { observeFile(id); return null; },
    transform(_code, id) { observeFile(id); return null; },
    generateBundle(_options, bundle) {
      for (const id of this.getModuleIds()) {
        const info = this.getModuleInfo(id);
        insist(info, 'Mòdul Rollup sense informació');
        modulesRaw.push({ rawId: id, external: info.isExternal, entry: info.isEntry,
          imports: [...info.importedIds], dynamicImports: [...info.dynamicallyImportedIds] });
      }
      for (const value of Object.values(bundle)) {
        if (value.type !== 'chunk') continue;
        chunksRaw.push({ fileName: value.fileName, entry: value.isEntry, facade: value.facadeModuleId,
          imports: [...value.imports], dynamicImports: [...value.dynamicImports], modules: Object.keys(value.modules) });
      }
    }
  };

  const require = createRequire(path.join(context.toolRoot, 'package.json'));
  const { build } = await import(pathToFileURL(require.resolve('vite')));
  const start = performance.now();
  await build({
    root: context.root, configFile: path.join(context.root, CONFIG_PATH), configLoader: 'native',
    mode: 'production', publicDir: false, envDir: path.join(job.privateDirectory, 'env'),
    cacheDir: path.join(job.privateDirectory, 'vite-cache'), logLevel: 'warn', plugins: [plugin],
    build: {
      outDir: path.join(job.output, 'build'), emptyOutDir: true,
      rollupOptions: {
        onwarn(warning, handler) {
          let id = null;
          if (warning.id) id = moduleIdentity(warning.id, context).id;
          warnings.push({ code: warning.code ?? 'UNKNOWN', message: warning.message, id });
          handler(warning);
        }
      }
    }
  });
  const buildDuration = performance.now() - start;
  const identities = new Map(modulesRaw.map(item => [item.rawId, moduleIdentity(item.rawId, context, item.external)]));
  const idFor = rawId => {
    insist(identities.has(rawId), `Referència Rollup sense mòdul: ${rawId}`);
    return identities.get(rawId).id;
  };
  const modules = modulesRaw.map(item => ({ ...identities.get(item.rawId), entry: item.entry,
    imports: sortedSet(item.imports.map(idFor)), dynamicImports: sortedSet(item.dynamicImports.map(idFor)) }))
    .sort((a, b) => compare(a.id, b.id));
  const chunks = chunksRaw.map(item => ({ fileName: item.fileName, entry: item.entry,
    facadeId: item.facade === null ? null : idFor(item.facade),
    imports: sortedSet(item.imports), dynamicImports: sortedSet(item.dynamicImports),
    modules: sortedSet(item.modules.map(idFor)) })).sort((a, b) => compare(a.fileName, b.fileName));
  const graph = graphSummary(modules, chunks);
  const runtimeIds = runtimeIdentitySet(modules, configIds, context);
  for (const id of runtimeIds) insist(initialRuntime.has(id), `Falta observació inicial d’un input físic: ${id}`);
  const pinsBefore = runtimeIds.map(id => initialRuntime.get(id));
  const pinsAfter = captureRuntimePins(runtimeIds, context);

  const lawProcess = spawnSync(process.execPath, [path.join(context.root, 'tooling/brain/tractor-pedra-seca.mjs'), '--detall'], {
    cwd: context.root, env: minimalEnvironment(job.privateDirectory, job.token), encoding: 'utf8',
    timeout: TIMEOUT_MS, maxBuffer: 16 * 1024 * 1024
  });
  const settlement = processInfo(lawProcess);
  const lawLog = (lawProcess.stdout ?? '') + (lawProcess.stderr ?? '');
  fs.writeFileSync(path.join(job.output, 'llei08.log'), lawLog, { flag: 'wx', mode: 0o644 });
  const law = parseLawLog(lawLog, settlement);
  writeJson(path.join(job.output, 'ast.json'), captureAst(context.root));
  const outputs = captureOutputs(path.join(job.output, 'build'));
  const after = captureSnapshot(context.root);
  insist(JSON.stringify(identityBefore) === JSON.stringify(toolIdentity(context)), 'Les eines han canviat durant el productor');
  const receipt = {
    schema: SCHEMA, profile: PROFILE, budgets: BUDGETS, producerPins: identityBefore,
    dependencyRoots: dependencyDeclarations(context), versions: context.versions,
    source: { before, after }, runtime: { configIds, pinsBefore, pinsAfter },
    graph: { modules, chunks, staticScc: graph.staticScc, combinedScc: graph.combinedScc },
    astPin: artifactPin(job.output, 'ast.json'), outputs, metrics: deriveMetrics(chunks, outputs),
    law: { process: settlement, logPin: artifactPin(job.output, 'llei08.log'), ...law },
    build: { process: normalProcess(0), durationMs: buildDuration, environment: 'minimal-ci-fixture-v1',
      publicCopied: false, snapshotAtomic: false, warnings },
    coverage: { allRoots: false, scope: PROFILE }
  };
  writeJson(path.join(job.output, 'rebut.json'), receipt);
  const validation = validateReceipt(receipt, { root: context.root, artifactRoot: job.output });
  writeJson(path.join(job.output, 'validacio.json'), validation);
  writeJson(path.join(job.privateDirectory, 'worker-result.json'), {
    schema: WORKER_SCHEMA, receiptSha256: sha256(fs.readFileSync(path.join(job.output, 'rebut.json'))), result: validation
  });
  return exitCode(validation);
}

export async function main(args = process.argv.slice(2)) {
  let privateDirectory;
  try {
    if (args[0] === '--worker') {
      insist(args.length === 3 && args[1] === '--job', 'Protocol worker invàlid');
      const jobFile = path.join(fs.realpathSync(path.dirname(path.resolve(args[2]))), path.basename(args[2]));
      return await worker(jobFile);
    }
    const parsed = options(args);
    const root = fs.realpathSync(parsed['--arrel']);
    const explicit = path.resolve(parsed['--sortida']);
    const output = path.join(fs.realpathSync(path.dirname(explicit)), path.basename(explicit));
    insist(output !== root && !output.startsWith(root + path.sep), 'Sortida dins del repo refusada');
    insist(!fs.existsSync(output) && !fs.lstatSync(path.dirname(output)).isSymbolicLink(), 'Sortida existent o pare no canònic');
    fs.mkdirSync(output, { mode: 0o700 });
    privateDirectory = path.join(output, '.worker');
    fs.mkdirSync(privateDirectory, { mode: 0o700 });
    fs.mkdirSync(path.join(privateDirectory, 'env'), { mode: 0o700 });
    const token = randomUUID();
    const jobFile = path.join(privateDirectory, 'job.json');
    fs.writeFileSync(jobFile, JSON.stringify({ schema: WORKER_SCHEMA, root, output, privateDirectory, token }), { flag: 'wx', mode: 0o600 });
    const result = spawnSync(process.execPath, [self, '--worker', '--job', jobFile], {
      cwd: path.join(privateDirectory, 'env'), env: minimalEnvironment(privateDirectory, token), encoding: 'utf8', timeout: TIMEOUT_MS,
      maxBuffer: 16 * 1024 * 1024
    });
    fs.writeFileSync(path.join(output, 'build.log'), (result.stdout ?? '') + (result.stderr ?? ''), { flag: 'wx', mode: 0o644 });
    insist(Number.isInteger(result.status) && [0, 1, 2].includes(result.status) && result.signal === null && !result.error,
      `Worker sense settlement normal: ${result.error?.code ?? result.signal ?? result.status}`);
    const protocol = readJsonFile(path.join(privateDirectory, 'worker-result.json'));
    insist(protocol.schema === WORKER_SCHEMA && protocol.receiptSha256 === sha256(fs.readFileSync(path.join(output, 'rebut.json'))), 'Protocol/rebut worker incomplet');
    insist(result.status === exitCode(protocol.result), 'Exit worker no correspon al veredicte estructurat');
    console.log(JSON.stringify({ ...protocol.result, receipt: path.join(output, 'rebut.json'), producerSlowExplicit: true }, null, 2));
    return exitCode(protocol.result);
  } catch (error) {
    const result = invalidResult(error);
    console.log(JSON.stringify(result, null, 2));
    // v1.2.25 · K-ARREL-PROMESA (tractor-promesa P2) · La fallada no es degrada a avís: el motiu va també a stderr i
    // el procés acaba en 2 encara que qui crida main() no use el valor de retorn. El JSON de stdout no canvia.
    console.error(`[fn009] INVALIDAT: ${result.issues.join('; ')}`);
    process.exitCode = 2;
    return 2;
  } finally {
    if (privateDirectory) fs.rmSync(privateDirectory, { recursive: true, force: true });
  }
}

if (esMain(import.meta.url)) process.exitCode = await main();
