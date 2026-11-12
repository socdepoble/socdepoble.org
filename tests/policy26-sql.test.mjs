import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { verifica } from '../scripts/supabase/verifica-migracions.mjs';
const root = fileURLToPath(new URL('..', import.meta.url));
const modulePath = process.env.SDP_PGLITE_MODULE;
if (!modulePath || !path.isAbsolute(modulePath)) throw new Error('Explicit local SDP_PGLITE_MODULE required; no installation or remote SQL');
const moduleURL = pathToFileURL(modulePath), { PGlite } = await import(moduleURL.href);
const { pgcrypto } = await import(new URL('./contrib/pgcrypto.js', moduleURL));
const sha = value => createHash('sha256').update(value).digest('hex');
const latest = '2611080440_politica_privacitat_2_6.sql';
const dir = path.join(root, 'supabase/migrations');
const load = name => fs.readFileSync(path.join(dir, name), 'utf8');
const scalar = async (db, sql, params = []) => Object.values((await db.query(sql, params)).rows[0])[0];
const sql = load(latest), html = sql.split('$politica_2_6$')[1];
test('policy2.6 executes in the full migration catalogue; silent fallback window is demonstrated, never credited as2.6', async t => {
  const report = verifica({ arrel: root }); assert.deepEqual(report.errors, []);
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql'));
  const ordered = report.ordre.filter(n => n.tipus === 'migracio').map(n => files.find(f => f.startsWith(n.id + '_')));
  assert.deepEqual([...ordered].sort(), files.sort());
  const policyIndex = ordered.indexOf(latest);
  const resumIndex = ordered.indexOf('2611082238_admin_resum_sessions_dispositius.sql');
  const curadoriaIndex = ordered.indexOf('2611091500_sessions_i_curadoria_cultural.sql');
  assert.ok(policyIndex > 0 && resumIndex > policyIndex && curadoriaIndex > resumIndex);
  const db = new PGlite({ extensions: { pgcrypto } });
  const oldFetch = globalThis.fetch; globalThis.fetch = () => { throw new Error('NETWORK_DISABLED'); };
  try {
    await db.exec(fs.readFileSync(path.join(root, 'tooling/node0/bootstrap-node0.sql'), 'utf8'));
    for (const file of ordered.slice(0, policyIndex)) await db.exec(load(file));
    const before = (await db.query('select versio,vigent_des_de,url,text_sha256,text_complet from public.politiques_privacitat order by versio')).rows;
    await t.test('actual handle_new_user silently records2.5 for requested absent2.6', async () => {
      assert.equal(await scalar(db, 'select private.versio_vigent()'), '2.5');
      await db.query("insert into public.towns(id,slug,name) values('26000000-0000-4000-8000-000000000001','policy26-test','Policy26 synthetic fixture')");
      await db.query('insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)', ['26000000-0000-4000-8000-000000000002', 'before26@example.invalid', { accepta_rgpd: true, versio_politica: '2.6', tenant_id: '26000000-0000-4000-8000-000000000001', full_name: 'Synthetic Before26' }]);
      assert.equal(await scalar(db,"select versio_politica from public.consentiments where user_id='26000000-0000-4000-8000-000000000002' and tipus='rgpd_acepta'"), '2.5');
    });
    await db.exec(sql);
    for (const file of ordered.slice(policyIndex + 1)) await db.exec(load(file));
    await t.test('migration84 stores exactly served2.6, is repeatable and preserves every historical policy row', async () => {
      const row = (await db.query("select versio,url,text_sha256,text_complet from public.politiques_privacitat where versio='2.6'")).rows[0];
      assert.deepEqual(row, { versio: '2.6', url: '/legal', text_sha256: sha(html), text_complet: html });
      assert.equal(row.text_sha256, '7db70d0101ef51d095ed94110ed560bbd010f62d7d1b8ccf6b0d3f6cc9901d4e');
      assert.equal(await scalar(db,'select private.versio_vigent()'),'2.6');
      const after = (await db.query("select versio,vigent_des_de,url,text_sha256,text_complet from public.politiques_privacitat where versio <> '2.6' order by versio")).rows;
      assert.deepEqual(after, before); await db.exec(sql); assert.equal(Number(await scalar(db,"select count(*) from public.politiques_privacitat where versio='2.6'")), 1);
    });
    await t.test('actual signup after matching publication stores2.6 and its HTML hash', async () => {
      await db.query('insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)', ['26000000-0000-4000-8000-000000000003', 'after26@example.invalid', { accepta_rgpd: true, versio_politica: '2.6', tenant_id: '26000000-0000-4000-8000-000000000001', full_name: 'Synthetic After26' }]);
      assert.deepEqual((await db.query("select versio_politica,text_sha256 from public.consentiments where user_id='26000000-0000-4000-8000-000000000003' and tipus='rgpd_acepta'")).rows, [{ versio_politica: '2.6', text_sha256: sha(html) }]);
    });
    await t.test('database CHECK and immutable trigger reject altered hashes/text and deletion', async () => {
      await assert.rejects(db.query("insert into public.politiques_privacitat(versio,vigent_des_de,text_sha256,text_complet) values('test-false',now(),$1,'altered')", ['0'.repeat(64)]), e => e.code === '23514');
      await assert.rejects(db.query("update public.politiques_privacitat set text_complet=text_complet||' ',text_sha256=$1 where versio='2.6'",[sha(html+' ')]), e => e.code === '42501');
      await assert.rejects(db.query("delete from public.politiques_privacitat where versio='2.6'"), e => e.code === '42501');
    });
    await t.test('pre-existing conflicting2.6 is rejected and left untouched', async () => {
      await db.exec('BEGIN');
      try {
        await db.exec('alter table public.politiques_privacitat disable trigger trg_politiques_immutables');
        await db.query("update public.politiques_privacitat set url='/conflicting' where versio='2.6'");
        await db.exec('alter table public.politiques_privacitat enable trigger trg_politiques_immutables');
        // The append-only insert cannot replace the conflicting row; its DO guard rejects.
        const body = sql.slice(sql.indexOf('insert into'), sql.lastIndexOf('commit;'));
        await assert.rejects(db.exec(body), e => e.code === '42501');
      } finally { await db.exec('ROLLBACK'); }
      assert.equal(await scalar(db,"select url from public.politiques_privacitat where versio='2.6'"), '/legal');
    });
  } finally { globalThis.fetch = oldFetch; await db.close(); }
});
