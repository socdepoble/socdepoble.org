import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import os from 'node:os';
import path from 'node:path';
import { generateVapid, stage } from '../tooling/push/aprovisiona-push.mjs';

const modulePath = process.env.SDP_PGLITE_MODULE;
const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const SA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const SA2 = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const SB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const ENDPOINT = 'https://fcm.googleapis.com/fcm/send/r31-sintetic';
const migrations = ['2611020417_xat_avisos_push.sql', '2611080431_xat_push_leases.sql', '20261116031000_r31_push_sessio_i_revocacio.sql'];

test('R31 · registre real, RLS i revocació Push per sessió Auth', {
  skip: !modulePath && 'Cal SDP_PGLITE_MODULE explícit; cap instal·lació implícita ni prova SQL inferida'
}, async t => {
  const { PGlite } = await import(modulePath.startsWith('file:') ? modulePath : pathToFileURL(modulePath).href);
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`create role anon; create role authenticated; create role service_role;
    create schema auth; create schema private;
    create table auth.users(id uuid primary key);
    create table auth.sessions(id uuid primary key,user_id uuid references auth.users(id) on delete cascade);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb,'{}'::jsonb)$$;
    create function auth.role() returns text language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claim.role',true),''),'authenticated')$$;
    grant usage on schema auth to authenticated,anon,service_role;
    create table private.ajustos(clau text primary key,valor text);
    insert into private.ajustos values('push_xat_actiu','si');
    create table public.xat_missatges(id uuid,fil_id uuid,usuari_id uuid,com_org_id uuid,resposta_a uuid,tipus text);
    create function public.xat_ritme(uuid) returns void language sql as $$select$$;
    insert into auth.users values('${A}'),('${B}');
    insert into auth.sessions values('${SA}','${A}'),('${SA2}','${A}'),('${SB}','${B}');`);
  for (const name of migrations.slice(0, 2)) await db.exec(await fs.readFile(new URL('../supabase/migrations/' + name, import.meta.url), 'utf8'));
  const com = async (who, sid, sql, params = []) => {
    await db.exec('begin');
    try {
      await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)", [who, JSON.stringify({ sub: who, session_id: sid })]);
      await db.exec('set local role authenticated');
      const r = await db.query(sql, params);
      await db.exec('commit');
      return r;
    } catch (error) { await db.exec('rollback'); throw error; }
  };
  const desa = (who = A, sid = SA, endpoint = ENDPOINT, gest = true) => com(who, sid, "select public.xat_push_desa('web',$1,null,'ca',$2)", [endpoint, gest]);
  const rows = async () => (await db.query('select id,usuari_id,sessio_id from public.xat_dispositius_push order by adreca')).rows;
  const newSql = await fs.readFile(new URL('../supabase/migrations/' + migrations[2], import.meta.url), 'utf8');
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'sdp-r31-push-stage-'));
  t.after(() => fs.rm(temp, { recursive: true, force: true }));
  const privateDir = path.join(temp, 'keys');
  const inputs = path.join(temp, 'inputs.env');
  generateVapid(privateDir, 'mailto:r31@example.invalid');
  await fs.writeFile(inputs, `SDP_CRON_SECRET=${'s'.repeat(48)}\n`, { mode: 0o600 });
  assert.equal(stage({ root: path.resolve(import.meta.dirname, '..'), dir: privateDir, inputs, channels: ['web'] }).ok, true);
  const activation = await fs.readFile(path.join(privateDir, 'staged/activa.sql'), 'utf8');

  await t.test('contraexemple pre-R31: el logout Auth deixava el registre Push viu', async () => {
    await desa();
    await db.query('delete from auth.sessions where id=$1', [SA]);
    assert.equal((await db.query('select count(*) n from public.xat_dispositius_push')).rows[0].n, 1);
    await db.query('insert into auth.sessions values($1,$2)', [SA, A]);
  });
  await t.test('l’activació real produïda per stage refusa un esquema sense la revocació R31', async () => {
    await assert.rejects(db.exec(activation), /push_schema_incomplete/);
    await db.exec('rollback');
  });
  await db.exec(newSql);
  await t.test('migració revoca només files llegades sense sessió demostrable', async () => {
    assert.equal((await rows()).length, 0);
    await desa();
    const [one] = await rows();
    assert.equal(one.usuari_id, A);
    assert.equal(one.sessio_id, SA);
    await db.exec(newSql);
    assert.deepEqual(await rows(), [one]);
    await db.exec(activation);
    assert.equal((await db.query("select valor from private.ajustos where clau='push_xat_actiu'")).rows[0].valor, 'si');
  });
  await t.test('renovació idempotent i cap secret en la lectura RLS', async () => {
    const [one] = await rows();
    await desa(A, SA, ENDPOINT, false);
    assert.deepEqual(await rows(), [one]);
    await desa(B, SB, ENDPOINT + '-b');
    const visible = await com(A, SA, 'select id,usuari_id from public.xat_dispositius_push');
    assert.equal(visible.rows.length, 1);
    assert.equal(visible.rows[0].usuari_id, A);
    for (const column of ['adreca', 'sessio_id']) await assert.rejects(com(A, SA, `select ${column} from public.xat_dispositius_push`), /permission denied/);
    await assert.rejects(com(A, SA, 'delete from public.xat_dispositius_push'), /permission denied/);
  });
  await t.test('JWT sense sessió, malformat o sessió d’un altre compte fallen tancats', async () => {
    for (const sid of [null, '', 'invalida', SB, 'dddddddd-dddd-4ddd-8ddd-dddddddddddd']) {
      await assert.rejects(desa(A, sid, ENDPOINT + '-invalid'), /SDP-PUSH-013/);
    }
    assert.equal((await rows()).length, 2);
  });
  await t.test('el logout local purga només el seu registre i rebutja el JWT encara no caducat', async () => {
    await desa(A, SA2, ENDPOINT + '-a2');
    await db.query('delete from auth.sessions where id=$1', [SA]);
    assert.deepEqual((await rows()).map(r => r.sessio_id).sort(), [SA2, SB].sort());
    await assert.rejects(desa(), /SDP-PUSH-013/);
    await db.query('delete from auth.sessions where user_id=$1', [A]);
    assert.deepEqual((await rows()).map(r => r.usuari_id), [B]);
  });
  await t.test('telèfon compartit: canvi d’amo només amb gest i cap revocació tardana d’A sobre B', async () => {
    await db.query('insert into auth.sessions values($1,$2)', [SA, A]);
    await desa(A, SA, ENDPOINT);
    await assert.rejects(desa(B, SB, ENDPOINT, false), /SDP-PUSH-011/);
    await desa(B, SB, ENDPOINT, true);
    await com(A, SA, "select public.xat_push_retira_segura('web',$1,$2)", [ENDPOINT, A]);
    assert.equal((await rows()).filter(r => r.usuari_id === B).length, 2);
    await db.query('delete from auth.sessions where id=$1', [SA]);
    assert.equal((await rows()).filter(r => r.usuari_id === B).length, 2);
    await db.query('delete from auth.sessions where id=$1', [SB]);
    assert.deepEqual(await rows(), []);
  });
});
