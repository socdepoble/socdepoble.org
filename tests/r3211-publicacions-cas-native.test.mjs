import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { performance } from 'node:perf_hooks';
import test from 'node:test';
import { creaPlaMigracions, generaSql, preparaHidratacio } from '../tooling/node0/hidrata-postgres-node0.mjs';
import { startLocalPostgres } from './fixtures/postgres-local.mjs';

const MANUAL_URL = new URL('../supabase/snippets/r32_11_publicacions_cas.sql', import.meta.url);
const manual = readFileSync(MANUAL_URL, 'utf8');
const sha256 = value => createHash('sha256').update(value).digest('hex');
const OWNER = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';
const id = n => `33333333-3333-4333-8333-${String(n).padStart(12, '0')}`;
const operation = n => `44444444-4444-4444-8444-${String(n).padStart(12, '0')}`;
const RPC = 'SELECT public.publica_section_submission_cas($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) AS ack';
const PENDENTS_132_136 = [
  ['20261123180000', '20261123180000_r3252_indexs_suport_fk_verificats.sql', 'fb6e55c005c149d753f1fc10bc2f2de33387425f543c97476ab0b615e43a0410'],
  ['20261123233000', '20261123233000_r3264_xat_elimina_per_a_tothom_sense_caducitat.sql', '1bc848b4f67891d2a9430296ae8ef76ca2feaa5c4d0ad8c268135ca1349ea251'],
  ['20261124030000', '20261124030000_v1224_integritat_xat_perfils_i_realtime.sql', '9479af8c495c9968a3b35ff4bd5628adc92f4f35fb8e62a2f8bcb2357608c50b'],
  ['20261124033000', '20261124033000_r3272_profiles_sense_enumeracio_i_execute_minim.sql', '2578292da6597dd294765515e60018131ceabd37cd24691344bae17c62907f8c'],
  // v1.2.24 · R32.87 · Blindatges P0 de Gemini Neon, fila 136, NO aplicada.
  ['20261124174000', '20261124174000_r3287_blindatge_xat_elimina_lssi_i_resol_reclamacio.sql', '7c787d9509b6bd32da61b52f6f73d5d793314fe18006525a503e95a8ccfa2029']
];
function exigeixCataleg136(rows) {
  assert.equal(rows.length, 136, 'cataleg136_incomplet');
  assert.deepEqual(rows.slice(-5).map(({ version, file, sha256: hash }) => [version, file, hash]), PENDENTS_132_136, 'cataleg136_fonts_drift');
}
const SIGNATURE = 'public.publica_section_submission_cas(pg_catalog.uuid,pg_catalog.uuid,pg_catalog.text,pg_catalog.jsonb,pg_catalog.text,pg_catalog.text,pg_catalog.uuid,pg_catalog.bool,pg_catalog.timestamptz,pg_catalog.uuid)';

async function beginActor(client, actor = OWNER, role = 'authenticated') {
  await client.query('BEGIN ISOLATION LEVEL READ COMMITTED');
  await client.query("SELECT set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",
    [actor || '', JSON.stringify({ sub: actor, role, aal: 'aal1' })]);
  // Roles are fixed fixture constants, never request data.
  assert.ok(['authenticated', 'anon'].includes(role));
  await client.query(`SET LOCAL ROLE ${role}`);
}

async function transactionAs(client, actor, sql, params = [], role = 'authenticated') {
  await beginActor(client, actor, role);
  try {
    const result = await client.query(sql, params);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

/** Observe the exact held/waiting advisory key, not elapsed time as a barrier. */
async function advisoryBarrier(observer, holder, waiter, key) {
  const deadline = performance.now() + 4000;
  while (performance.now() < deadline) {
    const { rows } = await observer.query(`SELECT w.pid AS waiter,h.pid AS holder,w.mode,
      w.classid::text AS classid,w.objid::text AS objid,s.wait_event_type,s.wait_event,
      pg_blocking_pids(w.pid) AS blockers
      FROM pg_locks w JOIN pg_locks h ON h.locktype=w.locktype
       AND h.database=w.database AND h.classid=w.classid AND h.objid=w.objid AND h.objsubid=w.objsubid
      JOIN pg_stat_activity s ON s.pid=w.pid
      WHERE w.locktype='advisory' AND NOT w.granted AND h.granted AND h.pid=$1 AND w.pid=$2
       AND w.objsubid=1 AND w.classid::bigint=((hashtextextended($3,0)>>32)&4294967295)
       AND w.objid::bigint=(hashtextextended($3,0)&4294967295)
       AND $1=ANY(pg_blocking_pids(w.pid))`, [holder, waiter, key]);
    if (rows.length) {
      assert.equal(rows[0].wait_event_type, 'Lock');
      assert.equal(rows[0].wait_event, 'advisory');
      return rows[0];
    }
    await new Promise(resolve => setImmediate(resolve));
  }
  assert.fail('No exact advisory wait observed within4s; no commit barrier was established.');
}

test('R32.11 CAS general · native PostgreSQL independent sessions and transaction outcomes', { timeout: 180000 }, async t => {
  const cluster = await startLocalPostgres({ dataRoot: join(tmpdir(), 'sdp-cas-native') });
  const db = cluster.db;
  const manualSHA = sha256(manual);
  try {
    const version = (await db.query('SELECT version() AS version')).rows[0].version;
    assert.match(version, /PostgreSQL 18\.6(?:\s|$)/);
    assert.equal((await db.query('SELECT inet_server_addr() AS addr')).rows[0].addr, null);
    t.diagnostic(JSON.stringify({ version, connection: 'disposable Unix socket; listen_addresses empty', manualSHA }));
    const plan = creaPlaMigracions(), hydration = await preparaHidratacio();
    // v1.2.22 · R32.42 afig tres fonts NO aplicades (20261122160000, 20261122160200 i 20261122160300): 129 en total.
    // v1.2.23 · L4-10 i M3-01 (ordre del Mestre 261123) · R32.44 (20261122230000) i R32.46 (20261123010000), també NO
    // aplicades, porten el catàleg a 131; es compten amb les tres R32.42 i les 126 d'abans no canvien.
    // R78: els cinc afegits històrics i les quatre pendents exactes queden fora dels recomptes 126/125/124.
    const R32_42 = ['20261122160000', '20261122160200', '20261122160300', '20261122230000', '20261123010000', ...PENDENTS_132_136.map(([version]) => version)];
    exigeixCataleg136(plan.migrations);
    for (const [version] of PENDENTS_132_136) {
      assert.throws(() => exigeixCataleg136(plan.migrations.filter(row => row.version !== version)), /cataleg136_incomplet/);
    }
    const historical131 = plan.migrations.filter(row => !PENDENTS_132_136.some(([version]) => row.version === version));
    assert.equal(historical131.length, 131);
    assert.equal(sha256([...historical131].sort((a, b) => Buffer.compare(Buffer.from(a.version), Buffer.from(b.version))).map(({ version, file, sha256: hash }) => `${version}\t${file}\t${hash}`).join('\n')), 'c279b24d3b3b9330fdf0cf4726a95593c2c172dab0d37f11b52b14955f347cbe');
    assert.equal(plan.migrations.length, 136);
    assert.equal(plan.migrations.filter(row => !R32_42.includes(row.version)).length, 126);
    assert.equal(plan.migrations.filter(row => row.version !== '20261121090000' && !R32_42.includes(row.version)).length, 125);
    assert.deepEqual(plan.migrations.filter(row => row.version === '20261121090000').map(({file,sha256})=>[file,sha256]),[['20261121090000_r32_25_push_directes_i_bandols.sql','2122eceeef44039f60c9cf6931043a5d7dcc1bfd4c1ae834d651743119315b36']]);
    const preview = plan.migrations.filter(row => row.version === '20261119143000');
    assert.deepEqual(preview.map(({ version, file, sha256: hash }) => [version, file, hash]), [
      ['20261119143000', '20261119143000_r32_14_xat_fils_previa_sense_amagats.sql', 'a030604331e272f6560579c264d94f6ac763d2faa1e94db5e5a3fdfe154dd1b0']
    ]);
    // The 124 pre-R32.14 sources retain the exact A-03 ledger; no old source is repinned.
    const historical = plan.migrations.filter(row => row.version !== '20261119143000' && row.version !== '20261121090000' && !R32_42.includes(row.version));
    assert.equal(historical.length, 124);
    assert.equal(sha256([...historical].sort((a, b) => Buffer.compare(Buffer.from(a.version), Buffer.from(b.version)))
      .map(({ version: v, file, sha256: hash }) => `${v}\t${file}\t${hash}`).join('\n')),
    '8446cad1c497adbc31a4903d9161479ba1eef081de6445cbe148fb615a961277');
    await db.query(generaSql(plan, hydration, { advisoryLock: false }));
    await db.query(manual);
    const tenant = hydration.municipalityId;
    // Auth DTO columns used by the canonical export; only this disposable fixture.
    await db.query('ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(); ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS last_sign_in_at timestamptz');
    for (const actor of [OWNER, OTHER]) {
      await db.query('INSERT INTO auth.users(id,email,email_confirmed_at,raw_user_meta_data) VALUES($1,$2,now(),$3)',
        [actor, `${actor}@example.invalid`, { full_name: 'Native CAS LAB', tenant_id: tenant, accepta_rgpd: true }]);
      await db.query('INSERT INTO private.normes_acceptades(usuari_id,versio) VALUES($1,private.versio_normes_vigent()) ON CONFLICT DO NOTHING', [actor]);
      await db.query('INSERT INTO public.town_memberships(town_id,user_id) VALUES($1,$2) ON CONFLICT DO NOTHING', [tenant, actor]);
    }
    const args = (resource, op, expected, payload = { title: 'Native LAB', content: 'Concurrent local fixture' }) =>
      [resource, tenant, 'mur', payload, 'Native LAB', '', null, true, expected, op];
    const save = async (resource, op, expected = null, payload) =>
      (await transactionAs(db, OWNER, RPC, args(resource, op, expected, payload))).rows[0].ack;
    const a = await cluster.connect(), b = await cluster.connect();
    const pidA = (await a.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;
    const pidB = (await b.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;
    assert.notEqual(pidA, pidB);
    t.diagnostic(JSON.stringify({ independentBackendPids: [pidA, pidB], isolation: 'read committed' }));

    await t.test('PG18 NOT NULL catalog representation is bounded; unexpected metadata rolls back', async () => {
      const catalog = async () => (await db.query("SELECT to_jsonb(n) AS state FROM pg_constraint n WHERE conrelid='private.publicacions_cas_rebuts'::regclass ORDER BY oid")).rows;
      const before = await catalog();
      assert.equal(before.filter(row => row.state.contype === 'n').length, 8);
      const row = "WHERE conrelid='private.publicacions_cas_rebuts'::regclass AND contype='n' AND conkey=ARRAY[8]::int2[]";
      // Direct catalog mutations model an unexpected installation. They run only
      // as the disposable cluster operator and are each rolled back completely.
      const mutations = [
        `UPDATE pg_constraint SET convalidated=false ${row}`,
        `UPDATE pg_constraint SET conenforced=false ${row}`,
        `UPDATE pg_constraint SET conislocal=false ${row}`,
        `UPDATE pg_constraint SET connoinherit=true ${row}`,
        `UPDATE pg_constraint SET conkey=ARRAY[1]::int2[] ${row}`,
        `UPDATE pg_constraint SET conkey=ARRAY[8,1]::int2[] ${row}`,
        `DELETE FROM pg_constraint ${row}`,
        'ALTER TABLE private.publicacions_cas_rebuts ADD CONSTRAINT unexpected_native_check CHECK(true)',
        'ALTER TABLE private.publicacions_cas_rebuts ALTER created_at DROP NOT NULL'
      ];
      for (const mutation of mutations) {
        await db.query('BEGIN');
        try {
          await db.query(mutation);
          await assert.rejects(db.query(manual), error => error.code === '22023' && /SDP-PUB-CAS-000/.test(error.message));
        } finally { await db.query('ROLLBACK'); }
        assert.deepEqual(await catalog(), before);
      }
      await db.query(manual);
      assert.deepEqual(await catalog(), before);
    });

    let index = 0;
    for (const phase of ['create', 'update']) for (const outcome of ['conflict', 'replay', 'rollback']) {
      await t.test(`${phase}: observed lock then ${outcome}`, async () => {
        const n = ++index, resource = id(n), opA = operation(n * 10), opB = outcome === 'replay' ? opA : operation(n * 10 + 1);
        const baseline = phase === 'update' ? await save(resource, operation(n * 10 + 2)) : null;
        const expected = baseline?.updated_at ?? null;
        const request = args(resource, opA, expected, { title: 'Native LAB', content: `${phase}/${outcome}` });
        await beginActor(a); await beginActor(b);
        assert.equal((await a.query("SELECT current_setting('transaction_isolation') AS isolation")).rows[0].isolation, 'read committed');
        assert.equal((await b.query("SELECT current_setting('transaction_isolation') AS isolation")).rows[0].isolation, 'read committed');
        let pending;
        try {
          const first = (await a.query(RPC, request)).rows[0].ack;
          assert.equal(first.replay, false);
          if (baseline) assert.notEqual(first.updated_at, baseline.updated_at);
          // A has returned an ACK but its row and receipt remain uncommitted.
          const visible = (await db.query('SELECT count(*)::int AS n FROM private.publicacions_cas_rebuts WHERE operation_id=$1', [opA])).rows[0].n;
          assert.equal(visible, 0);
          let settled = false;
          pending = b.query(RPC, [...request.slice(0, 9), opB]).then(result => ({ ack: result.rows[0].ack }), error => ({ error })).finally(() => { settled = true; });
          const key = outcome === 'replay' ? `sdp:pub-cas:op:${opA}` : `sdp:mur:${resource}`;
          const barrier = await advisoryBarrier(db, pidA, pidB, key);
          assert.equal(settled, false);
          t.diagnostic(JSON.stringify({ phase, outcome, barrier }));
          await a.query(outcome === 'rollback' ? 'ROLLBACK' : 'COMMIT');
          const second = await pending;
          if (outcome === 'conflict') {
            assert.equal(second.error?.code, '40001');
            assert.match(second.error.message, /SDP-PUB-CAS-003/);
            await b.query('ROLLBACK');
          } else {
            assert.equal(second.error, undefined);
            if (outcome === 'replay') assert.deepEqual(second.ack, { ...first, replay: true });
            else { assert.equal(second.ack.operation_id, opB); assert.equal(second.ack.replay, false); }
            await b.query('COMMIT');
          }
          const winner = outcome === 'rollback' ? second.ack : first;
          const row = (await db.query(`SELECT to_char(updated_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS token,payload FROM public.section_submissions WHERE id=$1`, [resource])).rows[0];
          assert.equal(row.token, winner.updated_at);
          assert.equal(row.payload.content, `${phase}/${outcome}`);
          const receipts = (await db.query('SELECT operation_id FROM private.publicacions_cas_rebuts WHERE submission_id=$1 ORDER BY operation_id', [resource])).rows.map(r => r.operation_id);
          const concurrent = receipts.filter(op => op === opA || op === opB);
          assert.deepEqual(concurrent, [winner.operation_id]);
          assert.equal(receipts.length, baseline ? 2 : 1);
        } finally {
          // Releasing A before awaiting B also makes a failed barrier clean up.
          await a.query('ROLLBACK');
          if (pending) await pending;
          await b.query('ROLLBACK');
        }
      });
    }

    await t.test('native authority, receipt ACL and own-only minimal portable export', async () => {
      const ack = await save(id(50), operation(500), null, { content: 'Native authority', owner_user_id: OTHER, tenant_id: OTHER, isSystem: true, origen: { title: 'Forged authority' }, metadadesMedia: { copyright: 'CC BY LAB consent' } });
      assert.equal(ack.owner_user_id, OWNER); assert.equal(ack.tenant_id, tenant);
      const payload = (await db.query('SELECT payload FROM public.section_submissions WHERE id=$1', [id(50)])).rows[0].payload;
      for (const key of ['owner_user_id', 'tenant_id', 'isSystem', 'origen']) assert.equal(Object.hasOwn(payload, key), false);
      assert.deepEqual(payload.metadadesMedia, { copyright: 'CC BY LAB consent' });
      await assert.rejects(transactionAs(db, OTHER, RPC, args(id(50), operation(501), ack.updated_at)), error => error.code === '42501');
      for (const role of ['anon', 'authenticated']) await assert.rejects(transactionAs(db, OWNER, 'SELECT * FROM private.publicacions_cas_rebuts', [], role), error => error.code === '42501');
      await assert.rejects(transactionAs(db, OWNER, 'UPDATE public.section_submissions SET title=$1 WHERE id=$2', ['forged write', id(50)]), error => error.code === '42501');
      assert.equal((await db.query("SELECT has_function_privilege('anon',$1,'EXECUTE') AS allowed", [SIGNATURE])).rows[0].allowed, false);
      const exported = (await transactionAs(db, OWNER, 'SELECT public.exporta_les_meues_dades() AS result')).rows[0].result;
      assert.ok(exported.seed_revisions); assert.ok(exported.veu_del_poble);
      const count = (await db.query('SELECT count(*)::int AS n FROM private.publicacions_cas_rebuts WHERE owner_user_id=$1', [OWNER])).rows[0].n;
      assert.equal(exported.publicacions_cas_rebuts.length, count);
      assert.ok(exported.publicacions_cas_rebuts.every(receipt => !Object.hasOwn(receipt, 'request_sha256') && !Object.hasOwn(receipt, 'payload')));
      assert.deepEqual((await transactionAs(db, OTHER, 'SELECT public.exporta_les_meues_dades() AS result')).rows[0].result.publicacions_cas_rebuts, []);
    });

    await t.test('native routine source hashes and full canonical ledger remain exact', async () => {
      const expected = [
        ['private.publicacions_cas_token()', 'c5d0ff028732a22357413a48177b2cfb896e2b1b94ec0c008bc5001bfbb8fe58'],
        [SIGNATURE, '1c2801a39b7bd5b8abe43a0c20275404be9c9f30019b8f84d982c965b2725619'],
        ['public.exporta_les_meues_dades()', 'e11e57671fdb7096ef43c2cef4008cf765499f770173747cea7cd98f14852eea'],
        ['private.exporta_les_meues_dades_abans_r3211_cas()', '82cb25456d46aab8496596d3f97009399c0506c292ed439aaae4cf6841e9d029']
      ];
      for (const [signature, expectedSHA] of expected) {
        const actual = (await db.query("SELECT encode(sha256(convert_to(prosrc,'UTF8')),'hex') AS sha FROM pg_proc WHERE oid=to_regprocedure($1)", [signature])).rows[0].sha;
        assert.equal(actual, expectedSHA); t.diagnostic(JSON.stringify({ signature, prosrcSHA: actual }));
      }
      const receipts = (await db.query('SELECT * FROM private.publicacions_cas_rebuts ORDER BY operation_id')).rows;
      await db.query(manual);
      assert.deepEqual((await db.query('SELECT * FROM private.publicacions_cas_rebuts ORDER BY operation_id')).rows, receipts);
      const installed = (await db.query('SELECT version,file,sha256 FROM node0.schema_migrations ORDER BY version COLLATE "C"')).rows;
      assert.equal(installed.length, 136);
      assert.equal(installed.filter(row => !R32_42.includes(row.version)).length, 126);
      assert.equal(installed.filter(row => row.version !== '20261121090000' && !R32_42.includes(row.version)).length, 125);
      assert.deepEqual(installed, [...plan.migrations].sort((a, b) => Buffer.compare(Buffer.from(a.version), Buffer.from(b.version)))
        .map(({ version: v, file, sha256: hash }) => ({ version: v, file, sha256: hash })));
      assert.equal(sha256(readFileSync(MANUAL_URL)), manualSHA);
    });
  } finally { await cluster.close(); }
});
