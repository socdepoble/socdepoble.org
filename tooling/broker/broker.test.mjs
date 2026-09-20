// broker.test.mjs — executar: node broker.test.mjs
// Recuperació provada amb estats durables simulats, sense tall elèctric real.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import {
  createBroker, contextPayload, signReceipt, sha256
} from './broker.mjs';

const base = await fs.mkdtemp(
  path.join(await fs.realpath(os.tmpdir()), 'sdp-broker-test-')
);
const contextKey = generateKeyPairSync('ed25519');
const approvalKey = generateKeyPairSync('ed25519');
let passed = 0;
let failures = 0;

async function fixture() {
  const home = await fs.mkdtemp(path.join(base, 'fixture-'));
  const root = path.join(home, 'root');
  const state = path.join(home, 'state');

  for (const dir of [
    root, state,
    path.join(root, '.agents/skills/basic'),
    path.join(root, 'tooling/wiki'),
    path.join(root, 'src'),
    path.join(root, 'docs')
  ]) {
    await fs.mkdir(dir, { recursive: true, mode: 0o700 });
  }

  for (const file of [
    '.agents/AGENTS.md',
    '.agents/BOOTSTRAP.md',
    '.agents/PROTOCOL_PETORRETA.md',
    'tooling/wiki/schema.json',
    '.agents/skills/basic/SKILL.md',
    'docs/procedure.md'
  ]) {
    await fs.writeFile(
      path.join(root, file),
      'Current binding procedure\n',
      { mode: 0o600 }
    );
  }

  await fs.writeFile(
    path.join(root, '.agents/protocolledge.json'),
    JSON.stringify({
      schema: 'sdp.protocolledge.v1',
      rutes: [{
        id: 'p',
        plantilla: 'docs/template.md',
        lectures: ['docs/read.md']
      }]
    }),
    { mode: 0o600 }
  );

  for (const file of [
    'src/a.txt', 'src/b.txt', 'docs/template.md', 'docs/read.md'
  ]) {
    await fs.writeFile(path.join(root, file), 'old\n', { mode: 0o600 });
  }

  const policy = {
    version: 1,
    root,
    state,
    agentUid: process.getuid() + 1,
    ttlMs: 900000,
    maxFileBytes: 1048576,
    maxBatchBytes: 4194304,
    maxContextBytes: 2097152,
    keys: {
      context: contextKey.publicKey.export({ type: 'spki', format: 'pem' }),
      approval: approvalKey.publicKey.export({ type: 'spki', format: 'pem' })
    },
    sources: [],
    routes: [
      { prefix: 'src', protocols: [], sources: ['docs/procedure.md'] },
      { prefix: 'docs', protocols: [], sources: [] }
    ]
  };

  const policyPath = path.join(home, 'policy.json');
  await fs.writeFile(policyPath, JSON.stringify(policy), { mode: 0o600 });

  return {
    root, state, policy, policyPath,
    broker: await createBroker(policyPath)
  };
}

const read = (f, file = 'src/a.txt') =>
  fs.readFile(path.join(f.root, file), 'utf8');

const write = (f, file, content) =>
  fs.writeFile(path.join(f.root, file), content);

const prepare = (f, paths = ['src/a.txt']) =>
  f.broker.prepare({
    session: 'session1',
    turn: 'turn1',
    intent: 'Edit requested files',
    paths
  });

const delivery = ticket =>
  signReceipt(
    contextPayload(ticket, sha256('exact request')),
    contextKey.privateKey
  );

const authorize = proposal =>
  signReceipt(proposal.approval, approvalKey.privateKey);

const propose = (
  f,
  ticket,
  changes = [{ path: 'src/a.txt', content: 'new\n' }]
) => f.broker.propose({
  id: ticket.id,
  receipt: delivery(ticket),
  changes
});

const denied = (fn, code) =>
  assert.rejects(fn, error => !code || error.code === code);

async function run(name, fn) {
  try {
    await fn();
    passed++;
    console.log('PASS ' + name);
  } catch (error) {
    failures++;
    console.error('FAIL ' + name + ': ' + error.stack);
  }
}

async function simulateCrash(f, ticket, proposal, applied = 0) {
  const file = path.join(f.state, ticket.id + '.json');
  const record = JSON.parse(await fs.readFile(file, 'utf8'));
  record.approval = authorize(proposal);
  record.status = 'committing';
  record.startedAt = Date.now();

  await fs.writeFile(file, JSON.stringify(record), { mode: 0o600 });

  for (let index = 0; index < applied; index++) {
    const after = record.after[index];
    await fs.writeFile(
      path.join(f.root, after.path),
      Buffer.from(after.base64, 'base64'),
      { mode: after.mode }
    );
  }

  return record;
}

await run('replacement and new UTF8 file', async () => {
  const f = await fixture();
  const ticket = await prepare(f, ['src/a.txt', 'src/new.txt']);
  const proposal = await propose(f, ticket, [
    { path: 'src/a.txt', content: 'updated\n' },
    { path: 'src/new.txt', content: 'Valencià 🎉\n' }
  ]);

  const result = await f.broker.execute({
    id: ticket.id, approval: authorize(proposal)
  });

  assert.equal(result.status, 'committed');
  assert.equal(await read(f, 'src/new.txt'), 'Valencià 🎉\n');
});

await run('forged context signature', async () => {
  const f = await fixture();
  const ticket = await prepare(f);

  await denied(() => f.broker.propose({
    id: ticket.id,
    receipt: signReceipt(
      contextPayload(ticket, sha256('request')),
      approvalKey.privateKey
    ),
    changes: [{ path: 'src/a.txt', content: 'bad' }]
  }), 'SIGNATURE_INVALID');
});

await run('forged approval signature', async () => {
  const f = await fixture();
  const ticket = await prepare(f);
  const proposal = await propose(f, ticket);

  await denied(() => f.broker.execute({
    id: ticket.id,
    approval: signReceipt(proposal.approval, contextKey.privateKey)
  }), 'SIGNATURE_INVALID');

  assert.equal(await read(f), 'old\n');
});

await run('execution and proposal replay', async () => {
  const f = await fixture();
  const ticket = await prepare(f);
  const proposal = await propose(f, ticket);
  const approval = authorize(proposal);

  await f.broker.execute({ id: ticket.id, approval });
  await denied(
    () => f.broker.execute({ id: ticket.id, approval }),
    'TICKET_ALREADY_USED'
  );
  await denied(() => propose(f, ticket), 'TICKET_ALREADY_USED');
});

await run('context changes after prepare', async () => {
  const f = await fixture();
  const ticket = await prepare(f);
  await write(f, '.agents/AGENTS.md', 'Changed');

  await denied(() => propose(f, ticket), 'PROCEDURES_CHANGED');
});

await run('context changes after propose', async () => {
  const f = await fixture();
  const ticket = await prepare(f);
  const proposal = await propose(f, ticket);
  await write(f, '.agents/skills/basic/SKILL.md', 'Changed');

  await denied(() => f.broker.execute({
    id: ticket.id, approval: authorize(proposal)
  }), 'PROCEDURES_CHANGED');
});

await run('target changes after prepare', async () => {
  const f = await fixture();
  const ticket = await prepare(f);
  await write(f, 'src/a.txt', 'Changed');

  await denied(() => propose(f, ticket), 'PREIMAGE_CHANGED');
});

await run('target changes after propose', async () => {
  const f = await fixture();
  const ticket = await prepare(f);
  const proposal = await propose(f, ticket);
  await write(f, 'src/a.txt', 'Changed');

  await denied(() => f.broker.execute({
    id: ticket.id, approval: authorize(proposal)
  }), 'PREIMAGE_CHANGED');
});

await run('traversal and reserved paths', async () => {
  const f = await fixture();

  for (const target of [
    'src/../a.txt', '/tmp/a', 'src//a.txt', 'src/./a.txt',
    'src/evil\\x', 'src/.git/config', 'src/.GIT/config',
    'src/.env', 'src/.env.local'
  ]) {
    await denied(() => prepare(f, [target]));
  }
});

await run('symlink leaf', async () => {
  const f = await fixture();
  await fs.symlink(
    path.join(f.root, 'src/a.txt'),
    path.join(f.root, 'src/evil.txt')
  );

  await denied(() => prepare(f, ['src/evil.txt']));
});

await run('symlink parent', async () => {
  const f = await fixture();
  await fs.symlink(
    path.join(f.root, 'docs'),
    path.join(f.root, 'src/evil')
  );

  await denied(() => prepare(f, ['src/evil/procedure.md']));
});

await run('hardlink target', async () => {
  const f = await fixture();
  await fs.link(
    path.join(f.root, 'src/a.txt'),
    path.join(f.root, 'src/evil.txt')
  );

  await denied(
    () => prepare(f, ['src/evil.txt']),
    'REGULAR_SINGLE_LINK_REQUIRED'
  );
});

await run('normative file from another route', async () => {
  const f = await fixture();

  await denied(
    () => prepare(f, ['docs/procedure.md']),
    'NORMATIVE_WRITE_FORBIDDEN'
  );
});

await run('unselected protocol source', async () => {
  const f = await fixture();

  await denied(
    () => prepare(f, ['docs/template.md']),
    'NORMATIVE_WRITE_FORBIDDEN'
  );
});

await run('partial recovery and recovery replay', async () => {
  const f = await fixture();
  const ticket = await prepare(f, ['src/a.txt', 'src/b.txt']);
  const proposal = await propose(f, ticket, [
    { path: 'src/a.txt', content: 'first\n' },
    { path: 'src/b.txt', content: 'second\n' }
  ]);

  await simulateCrash(f, ticket, proposal, 1);
  const result = await f.broker.recover({ id: ticket.id });

  assert.equal(result.status, 'committed');
  assert.equal(await read(f, 'src/b.txt'), 'second\n');
  await denied(
    () => f.broker.recover({ id: ticket.id }),
    'NOT_RECOVERABLE'
  );
});

await run('persistent pending-transaction barrier', async () => {
  const f = await fixture();
  const ticket0 = await prepare(f);
  const ticket1 = await prepare(f);
  const proposal1 = await propose(f, ticket1);
  const ticket2 = await prepare(f, ['src/b.txt']);
  const proposal2 = await propose(f, ticket2, [
    { path: 'src/b.txt', content: 'crash\n' }
  ]);

  await simulateCrash(f, ticket2, proposal2);
  const restart = await createBroker(f.policyPath);

  await denied(() => restart.prepare({
    session: 's', turn: 't', intent: 'x', paths: ['src/a.txt']
  }), 'RECOVERY_REQUIRED');

  await denied(() => restart.propose({
    id: ticket0.id,
    receipt: delivery(ticket0),
    changes: [{ path: 'src/a.txt', content: 'x' }]
  }), 'RECOVERY_REQUIRED');

  await denied(() => restart.execute({
    id: ticket1.id, approval: authorize(proposal1)
  }), 'RECOVERY_REQUIRED');

  await restart.recover({ id: ticket2.id });
  await restart.execute({
    id: ticket1.id, approval: authorize(proposal1)
  });
});

await run('recovery preserves conflicting content', async () => {
  const f = await fixture();
  const ticket = await prepare(f);
  const proposal = await propose(f, ticket);

  await simulateCrash(f, ticket, proposal);
  await write(f, 'src/a.txt', 'third value');

  await denied(
    () => f.broker.recover({ id: ticket.id }),
    'RECOVERY_CONFLICT'
  );
  assert.equal(await read(f), 'third value');
});

await run('corrupted postimage rejected', async () => {
  const f = await fixture();
  const ticket = await prepare(f);
  const proposal = await propose(f, ticket);
  const record = await simulateCrash(f, ticket, proposal);

  record.after[0].base64 = Buffer.from('evil\n').toString('base64');
  await fs.writeFile(
    path.join(f.state, ticket.id + '.json'),
    JSON.stringify(record)
  );

  await denied(() => f.broker.recover({ id: ticket.id }));
  assert.equal(await read(f), 'old\n');
});

await run('expired ticket before proposal', async () => {
  const f = await fixture();
  const ticket = await prepare(f);
  const originalNow = Date.now;

  try {
    Date.now = () => ticket.expiresAt + 1;
    await denied(() => propose(f, ticket), 'TICKET_EXPIRED');
  } finally {
    Date.now = originalNow;
  }
});

await run('expired ticket before execution', async () => {
  const f = await fixture();
  const ticket = await prepare(f);
  const proposal = await propose(f, ticket);
  const originalNow = Date.now;

  try {
    Date.now = () => ticket.expiresAt + 1;
    await denied(() => f.broker.execute({
      id: ticket.id, approval: authorize(proposal)
    }), 'TICKET_EXPIRED');
  } finally {
    Date.now = originalNow;
  }
});

await run('consumed transaction recovers after expiry', async () => {
  const f = await fixture();
  const ticket = await prepare(f);
  const proposal = await propose(f, ticket);
  const originalNow = Date.now;

  await simulateCrash(f, ticket, proposal);

  try {
    Date.now = () => ticket.expiresAt + 1;
    assert.equal(
      (await f.broker.recover({ id: ticket.id })).status,
      'committed'
    );
  } finally {
    Date.now = originalNow;
  }
});

await run('receipt cannot cross ticket boundary', async () => {
  const f = await fixture();
  const ticket1 = await prepare(f);
  const ticket2 = await prepare(f);

  await denied(() => f.broker.propose({
    id: ticket2.id,
    receipt: delivery(ticket1),
    changes: [{ path: 'src/a.txt', content: 'bad' }]
  }), 'RECEIPT_BINDING');
});

console.log(JSON.stringify({ base, passed, failures }));
process.exitCode = failures ? 1 : 0;
