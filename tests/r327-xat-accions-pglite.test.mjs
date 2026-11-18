import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { creaPlaMigracions } from '../tooling/node0/hidrata-postgres-node0.mjs';
const read = p => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const migration = read('supabase/migrations/20261117173000_r32_7_xat_reaccions_destacats_fixats_amagats.sql');
const id = n => `32700000-0000-4000-8000-${String(n).padStart(12, '0')}`;

// v1.2.8 · Com la resta de proves PGlite del repositori: el mòdul el dona SDP_PGLITE_MODULE (cap dependència nova al package.json).
const MODUL_PGLITE = process.env.SDP_PGLITE_MODULE;
test('R32.7 · SQL real: catàleg, doble aplicació, ACL, agregats privats i seq intacte', { timeout: 180000, skip: !MODUL_PGLITE && 'Set SDP_PGLITE_MODULE for actual PostgreSQL SQL proof' }, async t => {
  const moduleURL = MODUL_PGLITE.startsWith('file:') ? new URL(MODUL_PGLITE) : pathToFileURL(path.resolve(MODUL_PGLITE));
  const { PGlite } = await import(moduleURL.href), { pgcrypto } = await import(new URL('./contrib/pgcrypto.js', moduleURL));
  const db = new PGlite({ extensions: { pgcrypto } }); t.after(() => db.close());
  await db.exec(read('tests/fixtures/r32-platform.sql'));
  for (const entry of creaPlaMigracions().migrations) {
    try { await db.exec(entry.sql); }
    catch (error) { await db.exec('rollback'); throw new Error(`${entry.file}: ${error.message}`, { cause: error }); }
  }
  await db.exec(migration); await db.exec(migration);
  const town = id(1), otherTown = id(2), alice = id(3), bob = id(4), stranger = id(5);
  await db.query("insert into public.towns(id,slug,name) values($1,'r327','R327'),($2,'r327-other','Altre')", [town, otherTown]);
  for (const [actor, poble] of [[alice, town], [bob, town], [stranger, otherTown]]) {
    await db.query('insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)', [actor, `${actor}@example.invalid`, { full_name: actor, tenant_id: poble, accepta_rgpd: true }]);
    await db.query('insert into public.town_memberships(town_id,user_id) values($1,$2) on conflict do nothing', [poble, actor]);
    await db.query('insert into private.normes_acceptades(usuari_id,versio) values($1,private.versio_normes_vigent()) on conflict do nothing', [actor]);
  }
  async function as(actor, sql, params = [], role = 'authenticated') {
    await db.exec('begin');
    try {
      await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)", [actor ?? '', JSON.stringify({ sub: actor, role, aal: 'aal1' })]);
      await db.exec(`set local role ${role}`);
      const r = await db.query(sql, params); await db.exec('commit'); return r;
    } catch (e) { await db.exec('rollback'); throw e; }
  }
  const direct = (await as(alice, 'select public.crea_fil_directe($1,$2,null) id', [town, bob])).rows[0].id;
  const own = (await as(alice, 'select public.crea_fil_directe($1,$2,null) id', [town, alice])).rows[0].id;
  await as(alice, "select * from public.xat_envia($1,$2,'text','Missatge',null,'{}')", [id(10), direct]);
  await as(alice, "select * from public.xat_envia($1,$2,'text','Privat',null,'{}')", [id(11), own]);
  const before = (await db.query('select id,fil_id,seq,text from public.xat_missatges where id=any($1::uuid[]) order by id', [[id(10), id(11)]])).rows;
  const mutate = async (actor, fn, args) => (await as(actor, `select public.${fn}(${args.map((_, i) => `$${i + 1}`).join(',')}) value`, args)).rows[0].value;
  await t.test('PK, UUID, RLS i ACL exactes, sense accés cru als operadors', async () => {
    for (const table of ['xat_reaccions', 'xat_missatges_destacats', 'xat_missatges_fixats', 'xat_missatges_amagats']) {
      assert.equal((await db.query('select relrowsecurity from pg_class where oid=$1::regclass', [`public.${table}`])).rows[0].relrowsecurity, true);
      for (const role of ['anon', 'authenticated']) assert.equal((await db.query("select has_table_privilege($1,$2,'SELECT,INSERT,UPDATE,DELETE') yes", [role, `public.${table}`])).rows[0].yes, false);
      await assert.rejects(as(alice, `select * from public.${table}`), /permission denied/);
    }
    await assert.rejects(as(null, 'select public.xat_accions_missatges($1)', [direct], 'anon'), /permission denied/);
    const defs = (await db.query("select p.proconfig from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in('public','private') and p.proname in('xat_accio_visible','xat_accio_estat','xat_accions_missatges','xat_alterna_reaccio','xat_alterna_destacat','xat_alterna_fixat','xat_elimina_per_a_mi')")).rows;
    assert.equal(defs.length, 7); assert.ok(defs.every(r => r.proconfig.includes('search_path=""')));
  });
  await t.test('repetir l’estat final és idempotent; un emoji per actor i agregat sense identitats', async () => {
    const args = [direct, id(10), '😂', true];
    await mutate(alice, 'xat_alterna_reaccio', args); await mutate(alice, 'xat_alterna_reaccio', args);
    const value = await mutate(bob, 'xat_alterna_reaccio', args);
    assert.deepEqual(value.reaccions, [{ emoji: '😂', total: 2, meua: true }]);
    const changed = await mutate(alice, 'xat_alterna_reaccio', [direct, id(10), '❤️', true]);
    assert.equal(changed.reaccions.length, 2); assert.ok(!JSON.stringify(changed).includes(alice)); assert.ok(!JSON.stringify(changed).includes(bob));
    await mutate(alice, 'xat_alterna_reaccio', [direct, id(10), '❤️', false]);
    const batch = await mutate(alice, 'xat_accions_missatges', [direct]);
    assert.deepEqual(batch.missatges[0].reaccions, [{ emoji: '😂', total: 1, meua: false }]);
  });
  await t.test('destacat i amagat són personals, persistixen i no alteren cap seq/text', async () => {
    await mutate(alice, 'xat_alterna_destacat', [direct, id(10), true]);
    await mutate(alice, 'xat_elimina_per_a_mi', [direct, id(10)]); await mutate(alice, 'xat_elimina_per_a_mi', [direct, id(10)]);
    const mine = await mutate(alice, 'xat_accions_missatges', [null, [], true]);
    assert.equal(mine.missatges[0].destacat, true); assert.equal(mine.missatges[0].amagat, true);
    const theirs = await mutate(bob, 'xat_accions_missatges', [direct]);
    assert.equal(theirs.missatges[0].destacat, false); assert.equal(theirs.missatges[0].amagat, false);
    assert.deepEqual((await db.query('select id,fil_id,seq,text from public.xat_missatges where id=any($1::uuid[]) order by id', [[id(10), id(11)]])).rows, before);
  });
  await t.test('fora de poble, altre fil i participant amb finestra tancada no muten', async () => {
    await assert.rejects(mutate(stranger, 'xat_alterna_reaccio', [direct, id(10), '👍', true]), /SDP-XAT-006/);
    await assert.rejects(mutate(alice, 'xat_alterna_fixat', [own, id(10), true]), /SDP-XAT-006/);
    await assert.rejects(mutate(bob, 'xat_accions_missatges', [own]), /SDP-XAT-006/);
    await db.query('update public.xat_participants set visible_fins_seq=1 where fil_id=$1 and usuari_id=$2', [direct, bob]);
    await assert.rejects(mutate(bob, 'xat_alterna_destacat', [direct, id(10), true]), /SDP-XAT-006/);
    await db.query('update public.xat_participants set visible_fins_seq=null where fil_id=$1 and usuari_id=$2', [direct, bob]);
  });
  await t.test('fixar un directe és compartit; en grup exigix rol admin vigent', async () => {
    assert.equal((await mutate(alice, 'xat_alterna_fixat', [direct, id(10), true])).fixat, true);
    assert.equal((await mutate(bob, 'xat_accions_missatges', [direct])).missatges[0].fixat, true);
    await db.query("update public.xat_fils set tipus='grup' where id=$1", [direct]);
    await assert.rejects(mutate(bob, 'xat_alterna_fixat', [direct, id(10), false]), /SDP-XAT-011/);
    await db.query("update public.xat_participants set rol='admin' where fil_id=$1 and usuari_id=$2", [direct, bob]);
    assert.equal((await mutate(bob, 'xat_alterna_fixat', [direct, id(10), false])).fixat, false);
    await db.query("update public.xat_participants set rol='membre' where fil_id=$1 and usuari_id=$2", [direct, bob]);
    await assert.rejects(mutate(bob, 'xat_alterna_fixat', [direct, id(10), true]), /SDP-XAT-011/);
  });
  await t.test('caducitat, buidat, revocació del poble i paginació fan servir helpers reals', async () => {
    await db.query("update public.xat_missatges set caduca_al=now()-interval '1 second' where id=$1", [id(10)]);
    await assert.rejects(mutate(alice, 'xat_elimina_per_a_mi', [direct, id(10)]), /SDP-XAT-006/);
    await db.query('update public.xat_missatges set caduca_al=null where id=$1', [id(10)]);
    await db.query('update public.xat_participants set buidat_fins_seq=1 where fil_id=$1 and usuari_id=$2', [direct, bob]);
    assert.equal((await mutate(bob, 'xat_accions_missatges', [direct])).missatges.length, 0);
    await db.query('delete from public.town_memberships where town_id=$1 and user_id=$2', [town, bob]);
    await assert.rejects(mutate(bob, 'xat_accions_missatges', [direct]), /SDP-XAT-006/);
    await mutate(alice, 'xat_alterna_destacat', [own, id(11), true]);
    const first = await mutate(alice, 'xat_accions_missatges', [null, [], true, null, 1]);
    assert.equal(first.teMes, true); assert.equal(first.missatges.length, 1);
    const second = await mutate(alice, 'xat_accions_missatges', [null, [], true, first.seguentId, 1]);
    assert.equal(second.teMes, false); assert.equal(second.missatges.length, 1); assert.notEqual(first.missatges[0].missatgeId, second.missatges[0].missatgeId);
  });
});
