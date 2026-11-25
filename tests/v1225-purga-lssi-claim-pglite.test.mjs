import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { creaBaseR3246, asClient } from './fixtures/r3246-catalogue-pglite.mjs';
import { sembraR3264, SA, SF, STOWN, sid } from './fixtures/r3264-xat-elimina-per-a-tothom-casos.mjs';
import { cosMigracio } from '../tooling/node0/hidrata-postgres-node0.mjs';

const original = fs.readFileSync(new URL('../supabase/migrations/20261125010000_v1225_xat_cerca_fil_documents_i_purga_blobs.sql', import.meta.url), 'utf8');
const successor = fs.readFileSync(new URL('../supabase/migrations/20261125020000_v1225_purga_lssi_abans_claim.sql', import.meta.url), 'utf8');
const oldHash = '909093eec4d0cc86bc4cf378412a4401d4f2cc1c0434aa9faed31ff9ed250abb';
const newHash = '2d16822a48ecd8b1aa68f312e11059b7a47f560364647d3c4bb52a9506ad2553';
const signature = 'public.purga_fitxers_reclama(integer)';
const sha = value => createHash('sha256').update(value).digest('hex');
const contract = async pg => (await pg.query('select to_jsonb(p) as value from pg_catalog.pg_proc p where p.oid=pg_catalog.to_regprocedure($1)', [signature])).rows[0]?.value;
const queues = async (pg, names) => (await pg.query(`
  select 'ugc' as queue,id,nom,intents,ultim_error from public.cua_purga_storage_ugc where nom=any($1::text[])
  union all
  select 'private' as queue,id,nom,intents,ultim_error from private.purga_storage_pendent where nom=any($1::text[])
  order by queue,nom
`, [names])).rows;

test('C1-05 successor filters both LSSI queues before claim; local SQL evidence only', { timeout: 180000 }, async t => {
  const report = {
    schema: 'sdp.purga-lssi-claim.pglite.v1',
    sourceOriginalSha256: sha(original), sourceSuccessorSha256: sha(successor),
    beforeDesiredContract: 'NOT_YET_OBSERVED', afterDesiredContract: 'NOT_YET_OBSERVED',
    serviceStarted: false, networkUsed: false, storageHttpExecuted: false,
    physicalStorageDeletionProven: false, nativeConcurrencyProven: false,
    cases: [], databaseClosed: false
  };
  const pg = await creaBaseR3246({ throughVersion: '20261124174000' });
  let serial = 5000;
  const actor = (sql, args = []) => asClient(pg, { uid: SA }, sql, args);
  const service = (sql, args = []) => asClient(pg, { role: 'service_role' }, sql, args);
  const claim = limit => service('select * from public.purga_fitxers_reclama($1)', [limit]);
  const failed = async rows => (await service('select public.purga_fitxers_fallits($1::bigint[],$2) as n',
    [rows.map(row => row.id), 'synthetic worker failure']))[0].n;
  const scenario = async (name, run) => t.test(name, async () => {
    try {
      const evidence = await run();
      report.cases.push({ name, status: 'PASS', ...(evidence ?? {}) });
    } catch (error) {
      report.cases.push({ name, status: 'FAIL', code: error.code ?? null, message: error.message });
      throw error;
    }
  });
  const mixed = async (queue, protectedNow = true) => {
    const hold = sid(serial++), free = sid(serial++), section = sid(serial++), nonce = sid(serial++);
    for (const id of [hold, free]) {
      await actor('select public.xat_reserva_adjunt($1,$2,16,$3,null)', [id, SF, 'text/plain']);
      await pg.query(`insert into storage.objects(bucket_id,name,owner,owner_id,version,metadata)
        values('xat_adjunts',$1,$2::uuid,$2::text,'lssi-claim-fixture',$3)`, [id, SA, { size: 16, mimetype: 'text/plain' }]);
      await actor('select public.xat_publica_adjunt($1,$2,null)', [id, 'Document sintètic']);
    }
    await actor('select public.publica_section_submission_beta_cas($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
      [section, STOWN, 'mur', { content: 'Evidència sintètica', adjunt: hold }, 'Prova', '', null, false, null, nonce]);
    await pg.query("update public.section_submissions set moderation_state='visible' where id=$1", [section]);
    for (const id of [hold, free]) await actor('select public.xat_elimina_per_a_tothom($1,$2)', [SF, id]);
    await pg.query('select private.xat_purga_blobs_esborrats(50)');
    if (queue === 'ugc') await pg.query('select private.encua_storage_ugc($1)', [SA]);
    // Isolate this scenario's candidate data; no trigger, RLS or constraint is disabled.
    await pg.exec('update public.cua_purga_storage_ugc set referenciat=true; update private.purga_storage_pendent set referenciat=true;');
    const table = queue === 'ugc' ? 'public.cua_purga_storage_ugc' : 'private.purga_storage_pendent';
    await pg.query(`update ${table} set referenciat=false where nom=any($1::text[])`, [[hold, free]]);
    if (queue === 'ugc') await pg.query('update private.purga_storage_pendent set referenciat=false where nom=any($1::text[])', [[hold, free]]);
    await pg.query(`update ${table} set creat_al=case when nom=$1 then '2000-01-01'::timestamptz else '2000-01-02'::timestamptz end where nom=any($2::text[])`, [hold, [hold, free]]);
    if (protectedNow) await pg.query("update public.section_submissions set moderation_state='retirada_cautelar' where id=$1", [section]);
    assert.equal((await pg.query('select private.xat_adjunt_protegit_lssi($1) as held', [hold])).rows[0].held, protectedNow);
    return { hold, free, section, queue };
  };
  const expectOnlyFreeThenFail = async queue => {
    const sample = await mixed(queue), rows = await claim(1);
    assert.deepEqual(rows.map(row => row.nom), [sample.free]);
    assert.equal(await failed(rows), 1);
    const state = await queues(pg, [sample.hold, sample.free]);
    for (const row of state.filter(row => row.nom === sample.hold)) {
      assert.equal(row.intents, 0); assert.equal(row.ultim_error, null);
    }
    const changed = state.filter(row => row.nom === sample.free && row.queue === queue);
    assert.equal(changed.length, 1); assert.equal(changed[0].intents, 1);
    assert.equal(changed[0].ultim_error, 'synthetic worker failure');
    return { queue, protectedClaimed: false, protectedQueueUntouched: true, failedReceipt: 1,
      privateShadowUntouched: queue === 'ugc' ? state.filter(row => row.queue === 'private').every(row => row.intents === 0) : null };
  };
  const guardRejects = async (name, alter, prefix = 'SDP-PURGA-LSSI-') => scenario(name, async () => {
    const before = await contract(pg);
    await assert.rejects(pg.transaction(async tx => {
      await tx.exec(alter);
      await tx.exec(cosMigracio(successor));
    }), error => error.code === '55000' && error.message.startsWith(prefix));
    assert.deepEqual(await contract(pg), before);
    return { sqlstate: '55000', transactionRolledBack: true };
  });
  try {
    await sembraR3264(pg); await pg.exec(original);
    const before = await contract(pg); assert.equal(sha(before.prosrc), oldHash);
    for (const queue of ['private', 'ugc']) await scenario(`[DEFECTE] historical ${queue} claim admits a held attachment and marks the mixed failure`, async () => {
      const sample = await mixed(queue), rows = await claim(50);
      assert.deepEqual(new Set(rows.map(row => row.nom)), new Set([sample.hold, sample.free]));
      assert.equal(await failed(rows), 2);
      const held = (await queues(pg, [sample.hold])).find(row => row.queue === queue);
      assert.equal(held.intents, 1); assert.equal(held.ultim_error, 'synthetic worker failure');
      report.beforeDesiredContract = 'FAIL_REPRODUCED';
      return { queue, protectedClaimed: true, failedReceipt: 2, desiredContract: 'FAIL' };
    });
    await scenario('successor changes only the known function body and preserves the complete pg_proc contract', async () => {
      const metadata = { ...before }; delete metadata.prosrc;
      await pg.exec(successor);
      const after = await contract(pg), afterMetadata = { ...after }; delete afterMetadata.prosrc;
      assert.equal(sha(after.prosrc), newHash); assert.deepEqual(afterMetadata, metadata);
      const first = "    where not c.referenciat and c.intents < v_maxim\n";
      const second = "    where c.bucket_id = 'xat_adjunts' and not c.referenciat and c.feta_al is null and c.intents < v_maxim\n";
      const exact = before.prosrc.replace(first, first + "      and (c.bucket_id <> 'xat_adjunts'\n        or not private.xat_adjunt_protegit_lssi(private.xat_id_de_ruta(c.nom)))\n")
        .replace(second, second + '      and not private.xat_adjunt_protegit_lssi(private.xat_id_de_ruta(c.nom))\n');
      assert.equal(after.prosrc, exact);
      return { beforeBodySha256: oldHash, afterBodySha256: newHash, ownerAclSearchPathAndContractPreserved: true };
    });
    for (const queue of ['private', 'ugc']) await scenario(`[DEFECTE] ${queue} held row is skipped before LIMIT and attempts; only eligible row receives failure`,
      () => expectOnlyFreeThenFail(queue));
    await scenario('other UGC buckets retain their existing eligibility even when an equal UUID has LSSI protection in chat', async () => {
      const sample = await mixed('ugc');
      await pg.query(`insert into storage.objects(bucket_id,name,owner,owner_id,version,metadata)
        values('mitjans',$1,$2::uuid,$2::text,'lssi-claim-fixture',$3)`, [sample.hold, SA, { size: 16, mimetype: 'image/png' }]);
      await pg.query('select private.encua_storage_ugc($1)', [SA]);
      await pg.exec('update public.cua_purga_storage_ugc set referenciat=true; update private.purga_storage_pendent set referenciat=true;');
      await pg.query("update public.cua_purga_storage_ugc set referenciat=false where nom=$1 and bucket_id in ('mitjans','xat_adjunts')", [sample.hold]);
      const rows = await claim(50);
      assert.equal(rows.length, 1); assert.equal(rows[0].bucket_id, 'mitjans'); assert.equal(rows[0].nom, sample.hold);
      return { nonChatBucketUnaffected: true, protectedChatExcluded: true };
    });
    await scenario('absent objects remain claimable and can receive SQL absence receipts; unknown receipt IDs are no-ops', async () => {
      await pg.exec('update public.cua_purga_storage_ugc set referenciat=true; update private.purga_storage_pendent set referenciat=true;');
      const first = sid(serial++), second = sid(serial++), object = sid(serial++);
      await pg.query("insert into private.purga_storage_pendent(user_id,bucket_id,nom,referenciat) values($1,'xat_adjunts',$2,false)", [SA, first]);
      await pg.query("insert into public.cua_purga_storage_ugc(user_id,object_id,object_version,bucket_id,nom,referenciat) values($1,$2,'v1','xat_adjunts',$3,false)", [SA, object, second]);
      const rows = await claim(50); assert.deepEqual(new Set(rows.map(row => row.nom)), new Set([first, second]));
      const receipt = (await service('select public.purga_fitxers_fets($1::bigint[]) as n', [rows.map(row => row.id)]))[0].n;
      assert.equal(receipt, 2); assert.deepEqual(await queues(pg, [first, second]), []);
      assert.equal((await service('select public.purga_fitxers_fets($1::bigint[]) as n', [[-987654321]]))[0].n, 0);
      assert.equal((await service('select public.purga_fitxers_fallits($1::bigint[],$2) as n', [[-987654321], 'synthetic']))[0].n, 0);
      return { absentMetadataReceipt: 2, physicalDeletionProven: false, unknownIdsNoOp: true };
    });
    await scenario('LIMIT: protection introduced after claim can still reject the subsequent SQL DELETE and fail the mixed receipt', async () => {
      const sample = await mixed('private', false), rows = await claim(50);
      assert.deepEqual(new Set(rows.map(row => row.nom)), new Set([sample.hold, sample.free]));
      await pg.query("update public.section_submissions set moderation_state='retirada_cautelar' where id=$1", [sample.section]);
      await assert.rejects(pg.query("delete from storage.objects where bucket_id='xat_adjunts' and name=any($1::text[])", [[sample.hold, sample.free]]),
        error => error.code === '42501' && error.message === 'SDP-C1-LSSI: evidència protegida.');
      assert.equal((await pg.query("select count(*)::int as n from storage.objects where bucket_id='xat_adjunts' and name=any($1::text[])", [[sample.hold, sample.free]])).rows[0].n, 2);
      assert.equal(await failed(rows), 2);
      return { lateProtectionStillBlocksSqlDelete: true, failedMixedReceipt: 2, serializedOracleOnly: true,
        storageHttpExecuted: false, nativeConcurrencyProven: false };
    });
    await scenario('client roles cannot invoke the server-only claim RPC', async () => {
      for (const role of ['anon', 'authenticated']) await assert.rejects(asClient(pg, { role, uid: SA }, 'select * from public.purga_fitxers_reclama(50)'), error => error.code === '42501');
      return { anonDenied: true, authenticatedDenied: true };
    });
    await scenario('known reapply is idempotent and does not touch queue attempts or receipts', async () => {
      const before = await contract(pg), data = (await pg.query('select to_jsonb(p) as value from private.purga_storage_pendent p order by p.id')).rows;
      await pg.exec(successor); assert.deepEqual(await contract(pg), before);
      assert.deepEqual((await pg.query('select to_jsonb(p) as value from private.purga_storage_pendent p order by p.id')).rows, data);
      return { knownReapply: true, queueUnchanged: true };
    });
    await guardRejects('missing claim function is refused without creating it', 'alter function public.purga_fitxers_reclama(integer) rename to lssi_test_missing_claim');
    await guardRejects('unknown claim body is refused before overwrite', "update pg_catalog.pg_proc set prosrc=prosrc||E'\\n-- unknown variant' where oid='public.purga_fitxers_reclama(integer)'::regprocedure");
    await guardRejects('search_path drift is refused', 'alter function public.purga_fitxers_reclama(integer) set search_path=public');
    await guardRejects('SECURITY DEFINER drift is refused', 'alter function public.purga_fitxers_reclama(integer) security invoker');
    await guardRejects('unexpected client EXECUTE grant is refused', 'grant execute on function public.purga_fitxers_reclama(integer) to anon');
    await guardRejects('different owner is refused', 'alter function public.purga_fitxers_reclama(integer) owner to service_role');
    await guardRejects('nondefault function metadata cannot be silently replaced; postcondition rolls back DDL', 'alter function public.purga_fitxers_reclama(integer) cost 42', 'SDP-PURGA-LSSI-PRESERVE:');
    for (const [dependency, type] of [['xat_adjunt_protegit_lssi', 'uuid'], ['xat_id_de_ruta', 'text']]) {
      await guardRejects(`absent ${dependency} dependency is refused`, `alter function private.${dependency}(${type}) rename to lssi_test_missing_${dependency}`);
      await guardRejects(`unknown ${dependency} dependency body is refused`, `update pg_catalog.pg_proc set prosrc=prosrc||E'\\n-- unknown dependency' where oid='private.${dependency}(${type})'::regprocedure`);
      await guardRejects(`strictness drift of ${dependency} is refused even with the known body`, `alter function private.${dependency}(${type}) returns null on null input`);
    }
    report.afterDesiredContract = report.cases.every(row => row.status === 'PASS') ? 'PASS_PRECLAIM_SCOPE_ONLY' : 'FAIL';
  } finally {
    await pg.close(); report.databaseClosed = true;
    const file = process.env.SDP_PURGA_LSSI_EVIDENCE;
    if (file) {
      assert.ok(path.isAbsolute(file), 'Absolute evidence path required');
      fs.writeFileSync(file, JSON.stringify(report, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
    }
  }
});
