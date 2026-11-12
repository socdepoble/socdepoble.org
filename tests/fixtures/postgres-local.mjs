import { constants } from 'node:fs';
import { access, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { delimiter, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { once } from 'node:events';

const execute = promisify(execFile);

async function nativeBinaries(require) {
  const configured = process.env.SDP_POSTGRES_BIN?.trim();
  const directories = configured ? [resolve(configured)] : (process.env.PATH ?? '').split(delimiter);
  for (const directory of directories) {
    const suffix = process.platform === 'win32' ? '.exe' : '';
    const binaries = { initdb: join(directory, `initdb${suffix}`), postgres: join(directory, `postgres${suffix}`) };
    try {
      await Promise.all(Object.values(binaries).map(file => access(file, constants.X_OK)));
      return binaries;
    } catch {
      if (configured) throw new Error('SDP_POSTGRES_BIN ha de contindre initdb i postgres executables.');
    }
  }
  const platformPackage = `@embedded-postgres/${process.platform}-${process.arch}`;
  return import(pathToFileURL(require.resolve(platformPackage)).href);
}

/** Cluster descartable. Les connexions i els rols no arriben a cap servidor extern. */
export async function startLocalPostgres() {
  const require = createRequire(import.meta.resolve('embedded-postgres'));
  const { Client } = require('pg');
  const binaries = await nativeBinaries(require);
  const parent = resolve('node_modules/.cache/sdp-postgres');
  await mkdir(parent, { recursive: true });
  const directory = await mkdtemp(join(parent, 'pg-'));
  const data = join(directory, 'data');
  let socket;
  const clients = new Set();
  let server;
  let serverExit;
  let closed = false;
  let logs = '';
  let onExit;

  async function close() {
    if (closed) return;
    closed = true;
    if (onExit) process.removeListener('exit', onExit);
    if (server && server.exitCode === null && server.signalCode === null) {
      server.kill('SIGINT');
      const force = setTimeout(() => server.kill('SIGKILL'), 5000);
      force.unref();
      // Un error de spawn pot rebutjar l'espera sense haver creat cap procés.
      // La retirada dels clients i dels directoris continua igualment.
      try { await serverExit; }
      catch { /* L'arrancada propaga l'error original després de retirar els recursos. */ }
      finally { clearTimeout(force); }
    }
    await Promise.allSettled([...clients].map(client => client.end()));
    await Promise.all([
      rm(directory, { recursive: true, force: true }),
      socket ? rm(socket, { recursive: true, force: true }) : Promise.resolve()
    ]);
  }

  try {
    // El límit Unix de Darwin és de 103 bytes per al nom complet del socket.
    // El cwd del repositori pot superar-lo; mkdtemp crea un directori 0700 curt.
    socket = await mkdtemp(join(tmpdir(), 'sdp-pg-'));
    await execute(binaries.initdb, ['-D', data, '-A', 'trust', '-U', 'postgres', '--encoding=UTF8', '--no-locale'],
      { timeout: 30000, env: { ...process.env, LC_ALL: 'C' } });
    server = spawn(binaries.postgres, ['-D', data, '-p', '5432', '-k', socket,
      '-c', 'listen_addresses=', '-c', 'fsync=off', '-c', 'max_connections=12'],
    { stdio: ['ignore', 'ignore', 'pipe'], env: { ...process.env, LC_ALL: 'C' } });
    serverExit = once(server, 'exit');
    serverExit.catch(() => {});
    onExit = () => server.kill('SIGINT');
    process.once('exit', onExit);
    await new Promise((ready, reject) => {
      const timeout = setTimeout(() => reject(new Error(`PostgreSQL no ha arrancat en 30 s. ${logs}`)), 30000);
      server.once('error', error => { clearTimeout(timeout); reject(error); });
      server.once('exit', () => { clearTimeout(timeout); reject(new Error(`PostgreSQL ha acabat durant l'arrancada. ${logs}`)); });
      server.stderr.on('data', chunk => {
        logs = (logs + chunk.toString()).slice(-16000);
        if (logs.includes('database system is ready to accept connections')) {
          clearTimeout(timeout);
          ready();
        }
      });
    });
    async function connect() {
      const client = new Client({ host: socket, port: 5432, user: 'postgres', database: 'postgres',
        connectionTimeoutMillis: 5000, query_timeout: 15000 });
      client.on('error', () => {});
      clients.add(client);
      await client.connect();
      return client;
    }
    const db = await connect();
    return { db, connect, close, directory, socketDirectory: socket, executable: binaries.postgres };
  } catch (error) {
    await close();
    throw error;
  }
}
