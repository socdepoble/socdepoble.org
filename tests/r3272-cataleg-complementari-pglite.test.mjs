import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {creaBaseR3246} from './fixtures/r3246-catalogue-pglite.mjs';

const probe = fs.readFileSync(new URL('../supabase/snippets/r3272_cataleg_complementari_readonly.sql', import.meta.url), 'utf8');
test('C12 supplement executes as read-only catalogue observation, without business rows or SQL bodies', {timeout: 180000}, async () => {
  const pg = await creaBaseR3246();
  try {
    const before = (await pg.query("SELECT txid_current()::text AS tx, count(*)::int AS count FROM storage.objects")).rows[0];
    const rows = (await pg.exec(probe)).flatMap(result => result.rows || []);
    const report = rows.find(row => row.catalogue_supplement)?.catalogue_supplement;
    assert.ok(report);
    assert.equal(report.format, 'sdp.r3272.catalogue-supplement.v1');
    assert.equal(report.functions.length, 7);
    const producer = report.functions.find(f => f.signature === 'private.r3244_edicio_snapshot()');
    assert.equal(producer.prosrc_sha256, 'dfd4af7e5d14168db57fcd18990bbec7e75c191c8e65736c6820ad94f758369e');
    assert.equal(report.functions.find(f => f.signature === 'private.xat_missatges_e2ee()').prosrc_sha256,
      '52436302704ec087a45a103c24d37bd458f5105089ebfe28d2c7b06d01c7c89f');
    // v1.2.24 · R32.87 · El catàleg complet ja porta la 136: el cos és el blindat (participació vigent i com_org_id nul);
    // el de la 133 era c6f167f2….
    assert.equal(report.functions.find(f => f.signature === 'xat_elimina_per_a_tothom(uuid,uuid)').prosrc_sha256,
      'c5dc8aa812c70a0e449cbba3ba129026bc23d5fdcb7c0de4bfdf1ea005a8e212');
    for (const f of report.functions) {
      assert.match(f.prosrc_sha256, /^[a-f0-9]{64}$/);
      assert.match(f.definition_sha256, /^[a-f0-9]{64}$/);
      assert.equal(Object.hasOwn(f, 'prosrc'), false);
      assert.equal(Object.hasOwn(f, 'definition'), false);
    }
    assert.match(report.edicio_contract.snapshot_sha256, /^[a-f0-9]{64}$/);
    assert.ok(report.foreign_keys_and_indexes.length > 82);
    assert.ok(report.foreign_keys_and_indexes.every(f => Array.isArray(f.indexes) && f.constraint_definition.startsWith('FOREIGN KEY')));
    const index = report.foreign_keys_and_indexes.flatMap(f => f.indexes).find(i => i.index_name.startsWith('r3252_fk_'));
    assert.ok(index?.valid && index.ready && index.live);
    assert.ok(report.storage_policies.some(p => p.policyname === 'r3272 profiles sense llista anon' && p.permissive === 'RESTRICTIVE'));
    assert.ok(report.target_trigger_bindings.length > 0);
    assert.ok(report.private_helper_policy_dependencies.length > 0);
    assert.equal(report.private_schema_usage.authenticated, true);
    assert.deepEqual(report.legacy_chat_attachments_aggregate, {objects: 0, bytes: 0});
    assert.equal(Object.hasOwn(report, 'storage_objects'), false);
    assert.equal((await pg.query('SELECT count(*)::int AS count FROM storage.objects')).rows[0].count, before.count);
    assert.match(probe, /BEGIN READ ONLY;/);
    assert.match(probe, /ROLLBACK;\s*$/);
    assert.equal((await pg.query("SELECT current_setting('transaction_read_only') AS value")).rows[0].value, 'off');
  } finally { await pg.close(); }
});
