import { mkdir, readFile, writeFile, rename, rm, stat, open } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, basename } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';

export class SdpSafetyError extends Error {
  constructor(code, message, data = {}) {
    super(message);
    this.name = 'SdpSafetyError';
    this.code = code;
    this.data = data;
  }
}

export const WRITE_ZONES = {
  live: [
    '00_SER_Brain_Identitat',
    '01_SABER_Cultura_Coneixement',
    '02_ACTUAR_Maquina_Tecnica',
    '03_GOVERNAR_Normativa_Regles'
  ],
  archive: ['90_historic'],
  ephemeral: ['04_escriptori'],
  generated: [
    '_build',
    '.snapshots'
  ]
};

import { realpathSync } from 'node:fs';

export function resolveInside(root, target, label = 'path') {
  const rootAbs = realpathSync(resolve(root));
  let abs = isAbsolute(target) ? resolve(target) : resolve(rootAbs, target);

  try {
    abs = realpathSync(abs);
  } catch {
    // Si no existeix encara, resolem pare
    try {
      const parentReal = realpathSync(dirname(abs));
      abs = join(parentReal, basename(abs));
    } catch {
      /* ignore */
    }
  }

  const rel = relative(rootAbs, abs);

  if (rel === '' || rel.startsWith('..') || isAbsolute(rel)) {
    throw new SdpSafetyError(
      'PATH_OUTSIDE_ROOT',
      `${label} ix fora de l'arrel permesa: ${target}`,
      { root: rootAbs, target: abs }
    );
  }

  return abs;
}

export function assertWriteZone(root, target, zone = 'generated') {
  const abs = resolveInside(root, target, 'write target');
  const rel = relative(resolve(root), abs).replaceAll('\\', '/');
  const allowed = WRITE_ZONES[zone] || [];

  if (!allowed.some(prefix => rel === prefix || rel.startsWith(`${prefix}/`))) {
    throw new SdpSafetyError(
      'WRITE_ZONE_DENIED',
      `Escriptura fora de zona '${zone}': ${rel}`,
      { root: resolve(root), target: abs, rel, zone, allowed }
    );
  }

  return abs;
}

export async function sha256File(path) {
  const buf = await readFile(path);
  return createHash('sha256').update(buf).digest('hex');
}

export async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

export async function atomicWriteFile(path, data, options = {}) {
  const dir = dirname(path);
  await mkdir(dir, { recursive: true });

  const tmp = join(dir, `.${Date.now()}-${randomUUID()}.tmp`);
  const backup = options.backup && await exists(path)
    ? join(dir, `.${Date.now()}-${randomUUID()}.bak`)
    : '';

  try {
    if (backup) await rename(path, backup);
    await writeFile(tmp, data, { encoding: options.encoding || 'utf8', flag: 'wx' });
    await rename(tmp, path);

    if (backup && !options.keepBackup) await rm(backup, { force: true });
    return { ok: true, path, backup: options.keepBackup ? backup : '' };
  } catch (err) {
    await rm(tmp, { force: true }).catch(() => {});
    if (backup && await exists(backup)) {
      await rm(path, { force: true }).catch(() => {});
      await rename(backup, path).catch(() => {});
    }
    throw new SdpSafetyError('ATOMIC_WRITE_FAILED', err.message, { path, backup });
  }
}

export async function atomicJsonFile(path, value, options = {}) {
  return atomicWriteFile(path, `${JSON.stringify(value, null, 2)}\n`, {
    ...options,
    encoding: 'utf8'
  });
}

export async function appendNdjson(path, event) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify({ ts: new Date().toISOString(), ...event })}\n`, {
    flag: 'a',
    encoding: 'utf8'
  });
}

export async function withLock(root, name, fn, options = {}) {
  const lockDir = resolveInside(root, options.lockDir || '.locks', 'lock dir');
  await mkdir(lockDir, { recursive: true });
  const lockPath = join(lockDir, `${name}.lock`);
  let handle;

  try {
    handle = await open(lockPath, 'wx');
    await handle.writeFile(JSON.stringify({
      pid: process.pid,
      created_at: new Date().toISOString(),
      name
    }));
  } catch {
    throw new SdpSafetyError('LOCK_HELD', `Ja hi ha una operacio en curs: ${name}`, { lockPath });
  }

  try {
    return await fn();
  } finally {
    await handle?.close().catch(() => {});
    await rm(lockPath, { force: true }).catch(() => {});
  }
}

export async function withRollback(root, name, fn) {
  const journalDir = assertWriteZone(root, '90_historic/01_logs_termodinamics', 'archive');
  const journal = join(journalDir, 'rollback.ndjson');
  const touched = [];

  const tx = {
    async backup(path) {
      const abs = resolveInside(root, path, 'backup target');
      if (!await exists(abs)) return null;
      const hash = await sha256File(abs);
      const backupPath = join(journalDir, `${Date.now()}_${randomUUID()}.bak`);
      await atomicWriteFile(backupPath, await readFile(abs), { keepBackup: true });
      const item = { path: abs, backupPath, hash };
      touched.push(item);
      return item;
    },
    async write(path, data, options = {}) {
      const abs = resolveInside(root, path, 'transaction write');
      await this.backup(abs);
      return atomicWriteFile(abs, data, { ...options, backup: true });
    },
    async move(from, to) {
      const fromAbs = resolveInside(root, from, 'transaction move from');
      const toAbs = resolveInside(root, to, 'transaction move to');
      await this.backup(fromAbs);
      if (await exists(toAbs)) await this.backup(toAbs);
      await mkdir(dirname(toAbs), { recursive: true });
      await rename(fromAbs, toAbs);
      touched.push({ movedFrom: fromAbs, movedTo: toAbs });
    }
  };

  await appendNdjson(journal, { event: 'tx_start', name });

  try {
    const result = await fn(tx);
    await appendNdjson(journal, { event: 'tx_commit', name, touched: touched.length });
    return result;
  } catch (err) {
    for (const item of touched.reverse()) {
      if (item.movedFrom && item.movedTo) {
        await rename(item.movedTo, item.movedFrom).catch(() => {});
      } else if (item.path && item.backupPath) {
        await atomicWriteFile(item.path, await readFile(item.backupPath), { backup: false }).catch(() => {});
      }
    }
    await appendNdjson(journal, { event: 'tx_rollback', name, error: err.message });
    throw err;
  }
}
