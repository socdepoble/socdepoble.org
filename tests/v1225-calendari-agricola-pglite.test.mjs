import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { creaPlaMigracions } from '../tooling/node0/hidrata-postgres-node0.mjs';
const modul = process.env.SDP_PGLITE_MODULE;
const id = (n) => `12250000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const llig = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
test('C2 agrícola · SQL real, dues aplicacions, membresia, aïllament i baixa després d’eixir', { skip: !modul && 'Cal SDP_PGLITE_MODULE' }, async (t) => {
  const url = modul.startsWith('file:') ? new URL(modul) : pathToFileURL(path.resolve(modul));
  const { PGlite } = await import(url.href); const { pgcrypto } = await import(new URL('./contrib/pgcrypto.js', url));
  const pg = new PGlite({ extensions: { pgcrypto } }); t.after(() => pg.close());
  await pg.exec(llig('tests/fixtures/r32-platform.sql'));
  for (const e of creaPlaMigracions().migrations) {
    try { await pg.exec(e.sql); } catch (cause) { throw new Error(`${e.file}: ${cause.message}`, { cause }); }
  }
  const sql = llig('supabase/migrations/20261125013000_v1225_calendari_agricola_subscripcions.sql');
  await pg.exec(sql); await pg.exec(sql);
  const town = id(1), alice = id(2), bob = id(3), fil = id(4);
  await pg.query("insert into public.towns(id,slug,name) values($1,'agricola-c2','Agrícola C2')", [town]);
  for (const actor of [alice, bob]) {
    await pg.query('insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)', [actor, `${actor}@example.invalid`, { full_name: actor, tenant_id: town, accepta_rgpd: true }]);
    await pg.query('insert into public.town_memberships(town_id,user_id) values($1,$2) on conflict do nothing', [town, actor]);
  }
  await pg.query("insert into public.xat_fils(id,tenant_id,creat_per,tipus) values($1,$2,$3,'grup')", [fil,town,alice]);
  await pg.query('insert into public.xat_participants(fil_id,usuari_id) values($1,$2)', [fil,alice]);
  async function com(actor, consulta, params = [], rol = 'authenticated') {
    await pg.exec('begin');
    try {
      await pg.query("select set_config('request.jwt.claim.sub',$1,true)", [actor || '']);
      await pg.exec(`set local role ${rol}`);
      const r = await pg.query(consulta, params); await pg.exec('commit'); return r.rows;
    } catch (e) { await pg.exec('rollback'); throw e; }
  }
  const desa = 'select (public.calendari_agricola_desa_subscripcio($1,$2,$3,$4,$5)).*';
  const args = [town,fil,'tomaca','alcoia',true];
  const primera = (await com(alice,desa,args))[0];
  assert.equal(primera.activa,true);
  assert.equal((await com(alice,desa,args))[0].id,primera.id);
  assert.equal((await com(bob,'select * from public.calendari_agricola_subscripcions_meues()')).length,0);
  await assert.rejects(com(bob,desa,args), /not_authorized/);
  await assert.rejects(com(alice,'select * from public.calendari_agricola_subscripcions'), /permission denied/);
  await assert.rejects(com(null,'select * from public.calendari_agricola_subscripcions_meues()',[],'anon'), /permission denied/);
  await pg.query('update public.xat_participants set visible_fins_seq=0 where fil_id=$1 and usuari_id=$2',[fil,alice]);
  await assert.rejects(com(alice,desa,args), /not_authorized/);
  assert.equal((await com(alice,desa,[...args.slice(0,4),false]))[0].activa,false);
  const defs = await pg.query("select proconfig from pg_proc where proname in('calendari_agricola_desa_subscripcio','calendari_agricola_subscripcions_meues')");
  assert.ok(defs.rows.every((r) => r.proconfig.includes('search_path=""')));
});
