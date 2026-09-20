#!/usr/bin/env node
// broker.mjs — Node >=20 · POSIX · zero dependències.
/**
 * FRONTERA D'EXECUCIÓ
 * Executar amb UID diferent del model. Repositori viu, política, estat,
 * executable i llançador no poden ser modificables pel model.
 * Els ancestres, ACLs i muntatges també han d'impedir substitucions.
 * El supervisor neteja NODE_OPTIONS/NODE_PATH i intercepta tots els efectes.
 * El model només disposa d'una còpia de lectura i un espai de proposta.
 *
 * OPERACIONS
 * Crear/reemplaçar fitxers UTF-8 en directoris existents.
 * Shell, xarxa, plugins, esborrat, Git, BD i publicació no estan exposats.
 * Cap eina alternativa pot conservar permisos d'escriptura sobre el viu.
 * Multiescriptura recuperable amb diari; sense atomicitat visual entre fitxers.
 * Els lectors respecten el pany o lligen un snapshot publicat externament.
 *
 * POLÍTICA EXTERNA, propietari UID broker, mode 0600:
 * {
 *   "version":1,
 *   "root":"/srv/sdp/live",
 *   "state":"/var/lib/sdp-broker",
 *   "agentUid":1002,
 *   "ttlMs":900000,
 *   "maxFileBytes":1048576,
 *   "maxBatchBytes":4194304,
 *   "maxContextBytes":2097152,
 *   "keys":{
 *     "context":"PEM públic Ed25519 del host",
 *     "approval":"PEM públic Ed25519 de l'autoritzador"
 *   },
 *   "sources":[".agents/PROFILE.md",".agents/skills/00_INDEX_SKILLS.md"],
 *   "routes":[
 *     {
 *       "prefix":"src",
 *       "protocols":[],
 *       "sources":[".agents/skills/pedra-seca/SKILL.md"]
 *     },
 *     {
 *       "prefix":"_wiki_de_poble/04_escriptori",
 *       "protocols":["estudi_ia"],
 *       "sources":[".agents/skills/skill-documentacio-i-reflex/SKILL.md"]
 *     }
 *   ]
 * }
 *
 * Root i state existixen prèviament; state, fora de root, té mode 0700.
 * L'executable i la política viuen fora de root.
 * sources declara les dependències transitives; no s'inferixen de prosa.
 * Es carreguen totes les skills, sense cardinalitat fixa.
 * Modificar fonts normatives requerix un canal administratiu separat.
 *
 * CONTRACTE DEL HOST
 * prepare({session,turn,intent,paths}) retorna context íntegre i ticket.
 * El host incorpora exactament context a la petició concreta del model.
 * Contrasta session/turn amb la sessió autenticada abans de signar.
 * contextPayload(ticket,sha256(requestBytes)) construïx el rebut de lliurament.
 * propose({id,receipt,changes:[{path,content}]}) retorna manifest i pre/postimatges.
 * L'autoritzador valida el lot complet, procediments, graf i índexs afectats.
 * Davant una norma contradictòria o no comprovada, no emet aprovació.
 * execute({id,approval}) exigix signatura dels bytes exactes.
 * Les signatures acrediten atestacions dels serveis, no comprensió del model.
 * Les claus privades romanen als serveis signants, mai al broker ni al model.
 *
 * RECUPERACIÓ
 * recover({id}) completa una transacció consumida, fins i tot caducada.
 * Una transacció pendent bloqueja noves propostes i execucions.
 * Un tercer contingut inesperat bloqueja la recuperació sense sobreescriure'l.
 * unlockDead({}) és administratiu: només accepta un PID verificablement mort.
 * Un pany buit requerix inspecció manual amb el servei aturat.
 *
 * CLI PRIVADA DEL SERVEI
 * node broker.mjs /ruta/protegida/policy.json prepare < request.json
 * Ordres: prepare, propose, execute, recover, inspect, unlockDead.
 * El supervisor fixa executable, política i operacions administratives.
 * No exposar shell lliure amb l'UID del broker.
 */
import fs from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import {
  createHash, randomUUID, createPublicKey, sign, verify
} from 'node:crypto';
import { fileURLToPath } from 'node:url';

const VERSION = 1;
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const HEX = /^[a-f0-9]{64}$/;
const UTF8 = new TextDecoder('utf-8', { fatal: true });

const GLOBALS = [
  '.agents/AGENTS.md',
  '.agents/BOOTSTRAP.md',
  '.agents/PROTOCOL_PETORRETA.md',
  'tooling/wiki/schema.json'
];
const REGISTRY = '.agents/protocolledge.json';
const SKILLS = '.agents/skills';
const RESERVED = new Set([
  '.git', '.agents', 'tooling', 'node_modules', '.env',
  '.husky', '.github', '.sdp-reflex', '.wiki-safety', '.brain-trash'
]);

const fail = (code, message = code) => {
  throw Object.assign(new Error(message), { code });
};
const need = (condition, code) => {
  if (!condition) fail(code);
};

export const sha256 = bytes =>
  createHash('sha256').update(bytes).digest('hex');

export function canonical(value) {
  if (
    value === null ||
    typeof value === 'boolean' ||
    typeof value === 'string'
  ) return JSON.stringify(value);

  if (typeof value === 'number') {
    need(Number.isFinite(value), 'NON_FINITE');
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return '[' + value.map(canonical).join(',') + ']';
  }

  need(
    value && Object.getPrototypeOf(value) === Object.prototype,
    'NON_JSON'
  );

  return '{' + Object.keys(value).sort()
    .map(key => JSON.stringify(key) + ':' + canonical(value[key]))
    .join(',') + '}';
}

function exact(object, keys) {
  need(
    object && Object.getPrototypeOf(object) === Object.prototype,
    'OBJECT_REQUIRED'
  );
  need(
    Object.keys(object).sort().join('\0') === [...keys].sort().join('\0'),
    'INVALID_FIELDS'
  );
}

function text(value, max = 4096) {
  need(
    typeof value === 'string' &&
    value.trim().length > 0 &&
    Buffer.byteLength(value) <= max,
    'INVALID_TEXT'
  );
  need(UTF8.decode(Buffer.from(value)) === value, 'INVALID_UNICODE');
  return value;
}

function rel(value) {
  text(value, 1024);
  need(
    value === value.normalize('NFC') &&
    !path.isAbsolute(value) &&
    !/[\\\x00-\x1f\x7f:]/.test(value),
    'INVALID_PATH'
  );
  need(
    value.split('/').every(part => part && part !== '.' && part !== '..'),
    'INVALID_PATH'
  );
  return value;
}

const within = (candidate, parent) =>
  candidate === parent || candidate.startsWith(parent + path.sep);

const scope = (candidate, prefix) =>
  candidate === prefix || candidate.startsWith(prefix + '/');

function regular(stat) {
  need(stat.isFile() && stat.nlink === 1, 'REGULAR_SINGLE_LINK_REQUIRED');
}

function owned(stat, uid, privateMode = false) {
  need(
    stat.uid === uid && !(stat.mode & (privateMode ? 0o077 : 0o022)),
    'UNSAFE_OWNER_OR_MODE'
  );
}

async function syncDir(dir) {
  const handle = await fs.open(dir, 'r');
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function noLinksAbsolute(name) {
  need(
    path.isAbsolute(name) && path.resolve(name) === name,
    'ABSOLUTE_CANONICAL_PATH_REQUIRED'
  );

  let current = path.parse(name).root;
  for (const part of name.slice(current.length).split('/').filter(Boolean)) {
    current = path.join(current, part);
    const stat = await fs.lstat(current);
    need(!stat.isSymbolicLink(), 'SYMLINK');

    if (stat.isDirectory()) {
      need(
        stat.uid === 0 || stat.uid === process.getuid(),
        'UNTRUSTED_ANCESTOR'
      );
      need(
        !(stat.mode & 0o022) || (stat.mode & 0o1000),
        'WRITABLE_ANCESTOR'
      );
    }
  }

  need(await fs.realpath(name) === name, 'NON_CANONICAL_PATH');
}

async function readRegular(name, uid, max, privateMode = false) {
  const handle = await fs.open(
    name,
    constants.O_RDONLY | constants.O_NOFOLLOW
  );

  try {
    const before = await handle.stat();
    regular(before);
    owned(before, uid, privateMode);
    need(before.size <= max, 'FILE_TOO_LARGE');

    const buffer = await handle.readFile();
    need(buffer.length <= max, 'FILE_TOO_LARGE');

    const after = await handle.stat();
    need(
      before.size === after.size &&
      before.mtimeMs === after.mtimeMs &&
      before.ctimeMs === after.ctimeMs,
      'READ_CHANGED'
    );

    return { buffer, mode: before.mode & 0o777 };
  } finally {
    await handle.close();
  }
}

async function atomic(name, bytes, mode = 0o600) {
  const temp = path.join(
    path.dirname(name),
    `.sdp-broker-${randomUUID()}.tmp`
  );
  let installed = false;

  try {
    const handle = await fs.open(
      temp,
      constants.O_WRONLY |
        constants.O_CREAT |
        constants.O_EXCL |
        constants.O_NOFOLLOW,
      mode
    );

    try {
      await handle.chmod(mode);
      await handle.writeFile(bytes);
      await handle.sync();
    } finally {
      await handle.close();
    }

    await fs.rename(temp, name);
    installed = true;
    await syncDir(path.dirname(name));
  } finally {
    if (!installed) {
      await fs.unlink(temp).catch(error => {
        if (error.code !== 'ENOENT') throw error;
      });
    }
  }
}

export function signReceipt(payload, privateKey) {
  return {
    payload,
    signature: sign(
      null,
      Buffer.from(canonical(payload)),
      privateKey
    ).toString('base64')
  };
}

function checkReceipt(receipt, expected, publicKey) {
  exact(receipt, ['payload', 'signature']);
  need(
    canonical(receipt.payload) === canonical(expected),
    'RECEIPT_BINDING'
  );
  need(
    typeof receipt.signature === 'string' &&
    /^[A-Za-z0-9+/]{86}==$/.test(receipt.signature),
    'SIGNATURE_FORMAT'
  );
  need(
    verify(
      null,
      Buffer.from(canonical(expected)),
      publicKey,
      Buffer.from(receipt.signature, 'base64')
    ),
    'SIGNATURE_INVALID'
  );
}

export function contextPayload(ticket, requestSha256) {
  need(HEX.test(requestSha256), 'REQUEST_DIGEST_REQUIRED');

  return {
    version: VERSION,
    role: 'context-delivery',
    id: ticket.id,
    nonce: ticket.nonce,
    session: ticket.session,
    turn: ticket.turn,
    policySha256: ticket.policySha256,
    contextSha256: ticket.contextSha256,
    expiresAt: ticket.expiresAt,
    requestSha256,
    delivered: true
  };
}

function approvalPayload(record) {
  return {
    version: VERSION,
    role: 'authorize-write',
    id: record.id,
    nonce: record.nonce,
    session: record.session,
    turn: record.turn,
    policySha256: record.policySha256,
    contextSha256: record.contextSha256,
    proposalSha256: record.proposalSha256,
    deliverySha256: sha256(canonical(record.delivery)),
    expiresAt: record.expiresAt,
    proceduresSatisfied: true,
    authorizeExactBytes: true
  };
}

export async function createBroker(policyPath) {
  need(
    typeof process.getuid === 'function' &&
    constants.O_NOFOLLOW !== undefined,
    'POSIX_REQUIRED'
  );

  const uid = process.getuid();
  await noLinksAbsolute(policyPath);

  const raw = (
    await readRegular(policyPath, uid, 256 * 1024, true)
  ).buffer;
  const policySha256 = sha256(raw);
  const policy = JSON.parse(UTF8.decode(raw));

  exact(policy, [
    'version', 'root', 'state', 'agentUid', 'ttlMs',
    'maxFileBytes', 'maxBatchBytes', 'maxContextBytes',
    'keys', 'sources', 'routes'
  ]);

  need(
    policy.version === VERSION &&
    Number.isInteger(policy.agentUid) &&
    policy.agentUid > 0 &&
    policy.agentUid !== uid,
    'UID_SEPARATION_REQUIRED'
  );

  for (const [key, min, max] of [
    ['ttlMs', 1000, 3600000],
    ['maxFileBytes', 1, 16777216],
    ['maxBatchBytes', 1, 67108864],
    ['maxContextBytes', 1, 16777216]
  ]) {
    need(
      Number.isSafeInteger(policy[key]) &&
      policy[key] >= min &&
      policy[key] <= max,
      'INVALID_LIMIT_' + key
    );
  }

  need(policy.maxBatchBytes >= policy.maxFileBytes, 'BATCH_LIMIT');

  for (const dir of [policy.root, policy.state]) {
    await noLinksAbsolute(dir);
    const stat = await fs.lstat(dir);
    need(stat.isDirectory(), 'DIRECTORY_REQUIRED');
    owned(stat, uid, dir === policy.state);
  }

  need(
    !within(policy.state, policy.root) &&
    !within(policy.root, policy.state),
    'STATE_SEPARATION_REQUIRED'
  );
  need(
    !within(policyPath, policy.root),
    'POLICY_OUTSIDE_ROOT_REQUIRED'
  );

  const executable = fileURLToPath(import.meta.url);
  need(
    !within(executable, policy.root),
    'EXECUTABLE_OUTSIDE_ROOT_REQUIRED'
  );
  await noLinksAbsolute(executable);
  regular(await fs.lstat(executable));
  owned(await fs.lstat(executable), uid);

  exact(policy.keys, ['context', 'approval']);
  const keys = Object.fromEntries(
    Object.entries(policy.keys).map(([role, pem]) => {
      const key = createPublicKey(text(pem, 8192));
      need(key.asymmetricKeyType === 'ed25519', 'ED25519_REQUIRED');
      return [role, key];
    })
  );

  need(
    keys.context.export({ type: 'spki', format: 'der' }).compare(
      keys.approval.export({ type: 'spki', format: 'der' })
    ) !== 0,
    'DISTINCT_SIGNERS_REQUIRED'
  );

  need(
    Array.isArray(policy.sources) &&
    Array.isArray(policy.routes) &&
    policy.routes.length > 0,
    'POLICY_ROUTES_REQUIRED'
  );

  policy.sources.forEach(rel);
  for (const route of policy.routes) {
    exact(route, ['prefix', 'protocols', 'sources']);
    rel(route.prefix);
    need(
      Array.isArray(route.protocols) && Array.isArray(route.sources),
      'INVALID_ROUTE'
    );
    route.protocols.forEach(id => text(id, 128));
    route.sources.forEach(rel);
  }

  const lock = path.join(policy.state, 'lock');

  const stateFile = id => {
    need(UUID.test(id), 'INVALID_TICKET');
    return path.join(policy.state, id + '.json');
  };

  const save = record =>
    atomic(stateFile(record.id), canonical(record) + '\n');

  async function load(id, checkPolicy = true) {
    const record = JSON.parse(UTF8.decode((
      await readRegular(
        stateFile(id),
        uid,
        policy.maxBatchBytes * 8 + policy.maxContextBytes * 8 + 1048576,
        true
      )
    ).buffer));

    need(
      record.id === id &&
      record.version === VERSION &&
      ['prepared', 'proposed', 'committing', 'committed']
        .includes(record.status),
      'STATE_CORRUPT'
    );

    if (checkPolicy) {
      need(
        record.policySha256 === policySha256,
        'STATE_POLICY_MISMATCH'
      );
    }

    return record;
  }

  async function policyFresh() {
    for (const dir of [policy.root, policy.state]) {
      await noLinksAbsolute(dir);
      const stat = await fs.lstat(dir);
      need(stat.isDirectory(), 'DIRECTORY_REQUIRED');
      owned(stat, uid, dir === policy.state);
    }

    await noLinksAbsolute(policyPath);
    need(
      sha256((
        await readRegular(policyPath, uid, 256 * 1024, true)
      ).buffer) === policySha256,
      'POLICY_CHANGED'
    );
  }

  async function pendingExcept(id = null) {
    for (const name of await fs.readdir(policy.state)) {
      if (!/^[a-f0-9-]+\.json$/.test(name)) continue;
      const candidate = name.slice(0, -5);
      if (!UUID.test(candidate)) continue;

      const record = await load(candidate, false);
      need(
        record.status !== 'committing' || record.id === id,
        'RECOVERY_REQUIRED'
      );
    }
  }

  async function locked(fn) {
    await policyFresh();

    try {
      await fs.mkdir(lock, { mode: 0o700 });
    } catch (error) {
      if (error.code === 'EEXIST') fail('BROKER_LOCKED');
      throw error;
    }

    let initialized = false;

    try {
      const owner = {
        pid: process.pid,
        nonce: randomUUID(),
        createdAt: Date.now()
      };
      await atomic(path.join(lock, 'owner.json'), canonical(owner));
      initialized = true;
      await syncDir(policy.state);

      return await fn();
    } finally {
      // Un pany incomplet no es considera abandonat automàticament.
      if (initialized) {
        await fs.unlink(path.join(lock, 'owner.json'));
        await fs.rmdir(lock);
        await syncDir(policy.state);
      }
    }
  }

  async function location(relative) {
    rel(relative);
    let current = policy.root;
    const parts = relative.split('/');

    for (const part of parts.slice(0, -1)) {
      need(
        (await fs.readdir(current)).includes(part),
        'PARENT_CASE_OR_MISSING'
      );

      current = path.join(current, part);
      const stat = await fs.lstat(current);
      need(
        stat.isDirectory() && !stat.isSymbolicLink(),
        'UNSAFE_PARENT'
      );
      owned(stat, uid);
    }

    const names = await fs.readdir(current);
    const leaf = parts.at(-1);

    need(
      !names.some(name =>
        name !== leaf &&
        name.normalize('NFC').toLowerCase() === leaf.toLowerCase()
      ),
      'CASE_COLLISION'
    );

    return path.join(current, leaf);
  }

  async function snapshot(relative, max = policy.maxFileBytes) {
    const file = await location(relative);

    try {
      const stat = await fs.lstat(file);
      regular(stat);
      owned(stat, uid);

      const { buffer, mode } = await readRegular(file, uid, max);

      return {
        path: relative,
        hash: sha256(buffer),
        mode,
        bytes: buffer.length,
        base64: buffer.toString('base64')
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return {
          path: relative,
          hash: null,
          mode: 0o644,
          bytes: 0,
          base64: null
        };
      }
      throw error;
    }
  }

  function routeFor(relative) {
    rel(relative);
    need(
      !relative.split('/').some(part =>
        RESERVED.has(part.toLowerCase()) ||
        part.toLowerCase().startsWith('.env.') ||
        part.startsWith('.sdp-broker-')
      ),
      'RESERVED_PATH'
    );

    const matches = policy.routes.filter(route =>
      scope(relative, route.prefix)
    );

    need(matches.length === 1, 'ROUTE_MISSING_OR_AMBIGUOUS');
    return matches[0];
  }

  async function contextFor(plan) {
    const sources = new Map();
    let size = 0;

    async function add(relative) {
      if (sources.has(relative)) return sources.get(relative);

      const shot = await snapshot(relative, policy.maxContextBytes);
      need(shot.hash !== null, 'SOURCE_MISSING');

      const content = UTF8.decode(Buffer.from(shot.base64, 'base64'));
      need(content.trim(), 'SOURCE_EMPTY');

      size += Buffer.byteLength(content);
      need(size <= policy.maxContextBytes, 'CONTEXT_TOO_LARGE');

      const source = { path: relative, sha256: shot.hash, content };
      sources.set(relative, source);
      return source;
    }

    for (const source of [...GLOBALS, REGISTRY, ...policy.sources]) {
      await add(source);
    }

    const registry = JSON.parse(sources.get(REGISTRY).content);
    need(
      registry.schema === 'sdp.protocolledge.v1' &&
      Array.isArray(registry.rutes),
      'REGISTRY_INVALID'
    );

    const ids = new Set();
    for (const item of registry.rutes) {
      text(item.id, 128);
      need(!ids.has(item.id), 'PROTOCOL_DUPLICATE');
      ids.add(item.id);
      rel(item.plantilla);
      need(Array.isArray(item.lectures), 'PROTOCOL_READS_INVALID');
      item.lectures.forEach(rel);
    }

    const skillDir = await location(SKILLS + '/SKILL.md');
    const entries = await fs.readdir(path.dirname(skillDir), {
      withFileTypes: true
    });

    let count = 0;
    entries.sort((a, b) =>
      a.name < b.name ? -1 : a.name > b.name ? 1 : 0
    );

    for (const entry of entries) {
      need(!entry.isSymbolicLink(), 'SKILL_SYMLINK');
      if (!entry.isDirectory()) continue;

      need(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.name),
        'SKILL_ID_INVALID'
      );

      await add(`${SKILLS}/${entry.name}/SKILL.md`);
      count++;
    }

    need(count > 0, 'EMPTY_SKILLS');

    const selected = plan.paths.map(routeFor);

    for (const route of selected) {
      for (const source of route.sources) await add(source);

      for (const id of route.protocols) {
        const found = registry.rutes.find(item => item.id === id);
        need(found, 'PROTOCOL_UNKNOWN');

        for (const source of [found.plantilla, ...found.lectures]) {
          await add(source);
        }
      }
    }

    const protectedPaths = new Set([
      ...sources.keys(),
      ...policy.routes.flatMap(route => route.sources),
      ...registry.rutes.flatMap(route => [
        route.plantilla, ...route.lectures
      ])
    ]);

    for (const target of plan.paths) {
      need(!protectedPaths.has(target), 'NORMATIVE_WRITE_FORBIDDEN');
    }

    const result = {
      version: VERSION,
      plan,
      policySha256,
      rules: { routes: selected },
      sources: [...sources.values()].sort((a, b) =>
        a.path < b.path ? -1 : a.path > b.path ? 1 : 0
      )
    };

    const context = canonical(result);
    need(
      Buffer.byteLength(context) <= policy.maxContextBytes,
      'CONTEXT_ENVELOPE_TOO_LARGE'
    );

    return { context, contextSha256: sha256(context) };
  }

  async function fresh(record, checkExpiry = true) {
    await policyFresh();

    if (checkExpiry) {
      need(Date.now() <= record.expiresAt, 'TICKET_EXPIRED');
    }

    need(
      (await contextFor(record.plan)).contextSha256 === record.contextSha256,
      'PROCEDURES_CHANGED'
    );
  }

  function same(a, b) {
    return a.hash === b.hash &&
      (a.hash === null || a.mode === b.mode);
  }

  async function preimages(record) {
    for (const before of record.before) {
      need(
        same(await snapshot(before.path), before),
        'PREIMAGE_CHANGED'
      );
    }
  }

  function manifestFor(record) {
    return {
      version: VERSION,
      id: record.id,
      policySha256,
      contextSha256: record.contextSha256,
      deliverySha256: sha256(canonical(record.delivery)),
      session: record.session,
      turn: record.turn,
      changes: record.before.map((before, index) => ({
        path: before.path,
        before: before.hash,
        after: record.after[index].hash,
        mode: before.mode,
        bytes: record.after[index].bytes
      }))
    };
  }

  function integrity(record) {
    need(
      Array.isArray(record.before) &&
      Array.isArray(record.after) &&
      record.before.length === record.after.length &&
      record.before.length === record.plan.paths.length,
      'STATE_CORRUPT'
    );

    for (const [index, before] of record.before.entries()) {
      const after = record.after[index];

      need(
        before.path === record.plan.paths[index] &&
        after.path === before.path &&
        before.mode === after.mode &&
        Number.isInteger(after.mode) &&
        after.mode >= 0 &&
        after.mode <= 0o777 &&
        !(after.mode & 0o022),
        'STATE_CORRUPT'
      );

      for (const shot of [before, after]) {
        if (shot.hash === null) {
          need(
            shot === before &&
            shot.base64 === null &&
            shot.bytes === 0,
            'STATE_CORRUPT'
          );
        } else {
          need(typeof shot.base64 === 'string', 'STATE_CORRUPT');
          const bytes = Buffer.from(shot.base64, 'base64');

          need(
            bytes.toString('base64') === shot.base64 &&
            bytes.length === shot.bytes &&
            bytes.length <= policy.maxFileBytes &&
            sha256(bytes) === shot.hash,
            'STATE_CORRUPT'
          );
        }
      }
    }

    need(
      sha256(record.context) === record.contextSha256 &&
      canonical(manifestFor(record)) === canonical(record.manifest) &&
      sha256(canonical(record.manifest)) === record.proposalSha256,
      'STATE_CORRUPT'
    );
  }

  async function finish(record) {
    // Recuperació: únicament preimatge o resultat autoritzat.
    for (let index = 0; index < record.before.length; index++) {
      const actual = await snapshot(record.before[index].path);
      need(
        same(actual, record.before[index]) ||
        same(actual, record.after[index]),
        'RECOVERY_CONFLICT'
      );
    }

    for (let index = 0; index < record.after.length; index++) {
      const after = record.after[index];
      const before = record.before[index];
      const current = await snapshot(after.path);

      if (same(current, after)) continue;
      need(same(current, before), 'PREIMAGE_CHANGED');

      await atomic(
        await location(after.path),
        Buffer.from(after.base64, 'base64'),
        after.mode
      );
    }

    // També sincronitzar resultats ja presents després d'una interrupció.
    for (const after of record.after) {
      need(
        same(await snapshot(after.path), after),
        'POSTIMAGE_MISMATCH'
      );

      const file = await location(after.path);
      const handle = await fs.open(
        file,
        constants.O_RDONLY | constants.O_NOFOLLOW
      );

      try {
        await handle.sync();
      } finally {
        await handle.close();
      }

      await syncDir(path.dirname(file));
    }

    record.status = 'committed';
    record.finishedAt = Date.now();
    await save(record);

    return {
      id: record.id,
      status: record.status,
      proposalSha256: record.proposalSha256
    };
  }

  const api = {
    prepare: input => locked(async () => {
      await pendingExcept();
      exact(input, ['session', 'turn', 'intent', 'paths']);
      text(input.session, 256);
      text(input.turn, 256);
      text(input.intent, 16384);

      need(
        Array.isArray(input.paths) &&
        input.paths.length > 0 &&
        input.paths.length <= 128,
        'TARGET_COUNT'
      );

      const paths = [...input.paths].sort();
      paths.forEach(routeFor);
      need(
        new Set(paths.map(item => item.toLowerCase())).size === paths.length,
        'DUPLICATE_TARGET'
      );

      const plan = {
        session: input.session,
        turn: input.turn,
        intent: input.intent,
        paths
      };

      const context = await contextFor(plan);
      const before = [];
      let size = 0;

      for (const target of paths) {
        const shot = await snapshot(target);
        size += shot.bytes;
        before.push(shot);
      }

      need(size <= policy.maxBatchBytes, 'BATCH_TOO_LARGE');

      const record = {
        version: VERSION,
        id: randomUUID(),
        nonce: randomUUID(),
        policySha256,
        session: input.session,
        turn: input.turn,
        plan,
        before,
        ...context,
        status: 'prepared',
        expiresAt: Date.now() + policy.ttlMs
      };

      await save(record);

      return {
        id: record.id,
        nonce: record.nonce,
        session: record.session,
        turn: record.turn,
        policySha256,
        expiresAt: record.expiresAt,
        ...context
      };
    }),

    propose: input => locked(async () => {
      await pendingExcept();
      exact(input, ['id', 'receipt', 'changes']);

      const record = await load(input.id);
      need(record.status === 'prepared', 'TICKET_ALREADY_USED');
      await fresh(record);
      await preimages(record);

      const requestHash = input.receipt?.payload?.requestSha256;
      checkReceipt(
        input.receipt,
        contextPayload(record, requestHash),
        keys.context
      );

      need(
        Array.isArray(input.changes) &&
        input.changes.length === record.before.length,
        'CHANGE_COUNT'
      );

      const changes = new Map();
      let size = 0;

      for (const change of input.changes) {
        exact(change, ['path', 'content']);
        rel(change.path);
        need(
          !changes.has(change.path) && typeof change.content === 'string',
          'INVALID_CHANGE'
        );

        const bytes = Buffer.from(change.content, 'utf8');
        need(UTF8.decode(bytes) === change.content, 'INVALID_UNICODE');
        need(bytes.length <= policy.maxFileBytes, 'FILE_TOO_LARGE');

        size += bytes.length;
        changes.set(change.path, bytes);
      }

      need(size <= policy.maxBatchBytes, 'BATCH_TOO_LARGE');

      record.after = record.before.map(before => {
        need(changes.has(before.path), 'TARGET_MISMATCH');
        const bytes = changes.get(before.path);

        return {
          path: before.path,
          hash: sha256(bytes),
          bytes: bytes.length,
          mode: before.mode,
          base64: bytes.toString('base64')
        };
      });

      record.delivery = input.receipt;
      record.manifest = manifestFor(record);
      record.proposalSha256 = sha256(canonical(record.manifest));
      record.status = 'proposed';
      await save(record);

      return {
        id: record.id,
        manifest: record.manifest,
        approval: approvalPayload(record),
        review: record.before.map((before, index) => ({
          path: before.path,
          beforeBase64: before.base64,
          afterBase64: record.after[index].base64
        }))
      };
    }),

    execute: input => locked(async () => {
      await pendingExcept();
      exact(input, ['id', 'approval']);

      const record = await load(input.id);
      need(record.status === 'proposed', 'TICKET_ALREADY_USED');
      integrity(record);
      await fresh(record);
      await preimages(record);

      checkReceipt(
        record.delivery,
        contextPayload(record, record.delivery.payload.requestSha256),
        keys.context
      );
      checkReceipt(
        input.approval,
        approvalPayload(record),
        keys.approval
      );

      record.approval = input.approval;
      record.status = 'committing';
      record.startedAt = Date.now();
      need(record.startedAt <= record.expiresAt, 'TICKET_EXPIRED');

      // Consum durable anterior a tota mutació; inclou backups i resultats.
      await save(record);
      return finish(record);
    }),

    recover: input => locked(async () => {
      exact(input, ['id']);
      const record = await load(input.id);

      need(record.status === 'committing', 'NOT_RECOVERABLE');
      await pendingExcept(record.id);
      integrity(record);
      need(record.startedAt <= record.expiresAt, 'INVALID_START');
      await fresh(record, false);

      checkReceipt(
        record.delivery,
        contextPayload(record, record.delivery.payload.requestSha256),
        keys.context
      );
      checkReceipt(
        record.approval,
        approvalPayload(record),
        keys.approval
      );

      return finish(record);
    }),

    inspect: input => locked(async () => {
      exact(input, ['id']);
      const record = await load(input.id);

      return {
        id: record.id,
        status: record.status,
        expiresAt: record.expiresAt,
        proposalSha256: record.proposalSha256 ?? null
      };
    }),

    unlockDead: async input => {
      exact(input, []);
      await policyFresh();

      const stat = await fs.lstat(lock);
      need(
        stat.isDirectory() && !stat.isSymbolicLink(),
        'INVALID_LOCK'
      );
      owned(stat, uid, true);

      const ownerFile = path.join(lock, 'owner.json');
      const rawOwner = (
        await readRegular(ownerFile, uid, 4096, true)
      ).buffer;
      const owner = JSON.parse(UTF8.decode(rawOwner));

      need(
        Number.isSafeInteger(owner.pid) &&
        owner.pid > 0 &&
        UUID.test(owner.nonce),
        'INVALID_LOCK_OWNER'
      );

      try {
        process.kill(owner.pid, 0);
        fail('OWNER_ALIVE');
      } catch (error) {
        if (error.code !== 'ESRCH') throw error;
      }

      need(
        (
          await readRegular(ownerFile, uid, 4096, true)
        ).buffer.equals(rawOwner),
        'LOCK_CHANGED'
      );

      // Només una instància administrativa supervisada pot alliberar panys.
      const retired = path.join(
        policy.state,
        `dead-lock-${owner.nonce}`
      );

      await fs.rename(lock, retired);
      await syncDir(policy.state);

      return {
        status: 'unlocked',
        retainedEvidence: path.basename(retired)
      };
    }
  };

  return Object.freeze(api);
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    need(
      process.argv.length === 4,
      'USAGE: broker.mjs POLICY COMMAND'
    );
    need(
      !process.env.NODE_OPTIONS && !process.env.NODE_PATH,
      'CLEAN_LAUNCHER_REQUIRED'
    );

    const broker = await createBroker(process.argv[2]);
    const command = process.argv[3];
    need(Object.hasOwn(broker, command), 'UNKNOWN_COMMAND');

    const chunks = [];
    let size = 0;

    for await (const chunk of process.stdin) {
      size += chunk.length;
      need(size <= 80 * 1024 * 1024, 'INPUT_TOO_LARGE');
      chunks.push(chunk);
    }

    const input = JSON.parse(UTF8.decode(Buffer.concat(chunks)));
    const result = await broker[command](input);
    process.stdout.write(JSON.stringify(result) + '\n');
  } catch (error) {
    process.stderr.write(JSON.stringify({
      ok: false,
      code: error.code || 'BROKER_ERROR',
      message: error.message
    }) + '\n');
    process.exitCode = 1;
  }
}
