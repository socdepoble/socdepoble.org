import test from 'node:test';
import assert from 'node:assert/strict';
import { creaFixturePosse } from './node0-posse-fixture.mjs';
import { sqlText, sqlJson } from '../tooling/node0/postgres-node0.mjs';
test('R12 carpetes privades: persistència, noms, RLS i autoritat del servidor', { skip: !process.env.SDP_PGLITE_MODULE && 'PGlite explícit requerit' }, async t => {
  const f = await creaFixturePosse();
  try {
    const query = async (user, sql) => {
      try {
        return await f.pg.exec(`BEGIN; SELECT set_config('request.jwt.claim.sub',${sqlText(user)},true); SELECT set_config('request.jwt.claims',${sqlJson({ sub: user, role: 'authenticated', aal: 'aal1' })}::text,true); SET LOCAL ROLE authenticated; ${sql}; COMMIT;`);
      } catch (error) { await f.pg.exec('ROLLBACK; RESET ROLE;'); throw error; }
    };
    const crea = async (user, nom, tenant = f.tenantId) => (await query(user, `SELECT public.crea_carpeta_notes(${sqlText(nom)},${sqlText(tenant)}::uuid) AS folder`)).find(r => r.rows?.[0]?.folder)?.rows[0].folder;
    await t.test('anònim no pot executar la RPC ni llegir carpetes', async () => {
      const row = (await f.pg.query("SELECT has_table_privilege('anon','public.note_folders','SELECT') AS llegir,has_function_privilege('anon','public.crea_carpeta_notes(text,uuid)','EXECUTE') AS crear")).rows[0];
      assert.equal(row.llegir, false); assert.equal(row.crear, false);
    });
    let festes;
    await t.test('un usuari sense rol admin crea carpeta persistent amb id únic i reintent idempotent', async () => {
      festes = await crea(f.alice.id, 'Festes');
      assert.match(festes.id, /^f-[a-f0-9-]{36}$/);
      assert.deepEqual(await crea(f.alice.id, ' FESTES '), festes);
      assert.notEqual((await crea(f.alice.id, 'Fèstes')).id, festes.id);
    });
    await t.test('un altre usuari no veu ni modifica la carpeta privada', async () => {
      const rows = await query(f.bob.id, 'SELECT id,nom FROM public.note_folders');
      assert.equal(rows.find(r => r.fields?.some(field => field.name === 'id'))?.rows.length, 0);
      const own = await crea(f.bob.id, 'Festes'); assert.notEqual(own.id, festes.id);
      await assert.rejects(query(f.bob.id, `UPDATE public.note_folders SET nom='Robada' WHERE id=${sqlText(festes.id)}`), e => e.code === '42501');
    });
    await t.test('text malformat i tenant absent es rebutgen sense crear files', async () => {
      await assert.rejects(crea(f.alice.id, ' '.repeat(4)), e => e.code === '22023');
      await assert.rejects(crea(f.alice.id, 'a'.repeat(121)), e => e.code === '22023');
      await assert.rejects(crea(f.alice.id, 'Nova', '00000000-0000-4000-8000-000000000000'), e => e.code === '42501');
    });
    await t.test('un autenticat no crea carpetes en un altre poble i les carpetes cauen amb la baixa del compte', async () => {
      const other = '99999999-2222-4222-8222-222222222222';
      await f.pg.query("INSERT INTO public.towns(id,slug,name) VALUES($1,'poble-privat-r12','Altre poble')", [other]);
      await assert.rejects(crea(f.alice.id, 'Invàlida', other), e => e.code === '42501');
      await f.pg.query('DELETE FROM auth.users WHERE id=$1', [f.bob.id]);
      assert.equal((await f.pg.query('SELECT count(*)::int AS total FROM public.note_folders WHERE owner_user_id=$1', [f.bob.id])).rows[0].total, 0);
    });
  } finally { await f.close(); }
});
