import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { creaBaseR3246, asClient } from './fixtures/r3246-catalogue-pglite.mjs';
import { sembraR3264, enviaR3264, SA, SB, SO, SF, STOWN, sid } from './fixtures/r3264-xat-elimina-per-a-tothom-casos.mjs';
const migration = fs.readFileSync(new URL('../supabase/migrations/20261125010000_v1225_xat_cerca_fil_documents_i_purga_blobs.sql', import.meta.url), 'utf8');
test('v1225 C1 · documents, cerca privada i purga amb prova LSSI', { timeout: 180_000 }, async t => {
  const pg = await creaBaseR3246({ throughVersion: '20261124174000' });
  const actor = (uid, sql, args = []) => asClient(pg, { uid }, sql, args);
  const cerca = async (uid, q, limit = 50) => actor(uid, 'select * from public.xat_cerca_missatges_fil($1,$2,$3)', [SF, q, limit]);
  const adjunt = async (id, mime = 'text/plain', bytes = 16) => {
    await actor(SA, 'select public.xat_reserva_adjunt($1,$2,$3,$4,null)', [id, SF, bytes, mime]);
    await pg.query("insert into storage.objects(bucket_id,name,owner,owner_id,version,metadata) values('xat_adjunts',$1,$2::text::uuid,$2::text,'v1225',$3)", [id, SA, { size: bytes, mimetype: mime }]);
    return (await actor(SA, 'select public.xat_publica_adjunt($1,$2,null) as q', [id, 'Document'] ))[0].q;
  };
  try {
    await sembraR3264(pg);
    await t.test('migració repetible conserva ACL i metadades de RPC existents', async () => {
      const meta = async () => (await pg.query("select oid,proowner,proacl,prosecdef,proconfig from pg_proc where oid='public.xat_publica_adjunt(uuid,text,uuid)'::regprocedure")).rows;
      const before = await meta(); await pg.exec(migration); await pg.exec(migration); assert.deepEqual(await meta(), before);
      assert.equal((await pg.query("select count(*)::int n from pg_proc p join pg_namespace n on n.oid=p.pronamespace where p.proname like 'xat_%' and p.prosecdef and not coalesce(p.proconfig @> array['search_path=\"\"'],false)")).rows[0].n, 0);
    });
    await t.test('documents menuts admesos, sostre10MB i Content-Disposition contractat', async () => {
      const id = sid(800); const q = await adjunt(id); assert.equal(q.tipus, 'document');
      const read = (await actor(SB, 'select public.xat_llegix_adjunt($1) as q', [id]))[0].q;
      assert.deepEqual(read, { ruta: id, tipus: 'document' });
      await assert.rejects(actor(SA, 'select public.xat_reserva_adjunt($1,$2,10000001,$3,null)', [sid(801), SF, 'application/pdf']), e => e.code === '23514');
      await assert.rejects(actor(SA, 'select public.xat_reserva_adjunt($1,$2,10,$3,1)', [sid(802), SF, 'text/plain']));
      const bucket = (await pg.query("select allowed_mime_types from storage.buckets where id='xat_adjunts'")).rows[0]; assert(bucket.allowed_mime_types.includes('text/plain'));
    });
    await t.test('cerca accents literal, ACL, amagats, esborrats i fora del fil', async () => {
      await enviaR3264(pg, sid(810), { text: 'Café àvia 100%_ literal' });
      await enviaR3264(pg, sid(811), { text: 'Café àvia ocult' });
      await pg.query('insert into public.xat_missatges_amagats(usuari_id,missatge_id) values($1,$2)', [SA, sid(811)]);
      assert.equal((await cerca(SA, 'CAFE AVIA')).length, 1); assert.equal((await cerca(SA, '%_')).length, 1);
      await assert.rejects(cerca(SO, 'CAFE'), e => e.code === '42501'); await assert.rejects(cerca(null, 'CAFE'), e => e.code === '42501');
      await assert.rejects(cerca(SA, 'x', 101), e => e.code === '22023');
      const quote = (await actor(SA, 'select * from public.xat_missatge_fil_per_id($1,$2)', [SF, sid(810)])); assert.equal(quote[0].id, sid(810));
      await actor(SA, 'select public.xat_elimina_per_a_tothom($1,$2)', [SF, sid(810)]); assert.equal((await cerca(SA, 'CAFE')).length, 0);
    });
    await t.test('bloquejos en els dos sentits retiren coincidències', async () => {
      await enviaR3264(pg, sid(812), { uid: SB, text: 'Cerca bloqueig' });
      assert.equal((await cerca(SA, 'bloqueig')).length, 1);
      await actor(SA, "insert into public.bloquejos(bloquejador,bloquejat_tipus,bloquejat_persona) values($1,'persona',$2)", [SA, SB]);
      assert.equal((await cerca(SA, 'bloqueig')).length, 0);
      await actor(SA, 'delete from public.bloquejos where bloquejador=$1', [SA]);
      await actor(SB, "insert into public.bloquejos(bloquejador,bloquejat_tipus,bloquejat_persona) values($1,'persona',$2)", [SB, SA]);
      assert.equal((await cerca(SA, 'bloqueig')).length, 0); await actor(SB, 'delete from public.bloquejos where bloquejador=$1', [SB]);
    });
    await t.test('[DEFECTE] cursor compost conserva germans amb data idèntica i microsegons', async () => {
      await pg.transaction(async tx => {
        await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [SA]);
        for (let n = 830; n < 833; n++) await tx.query("select public.xat_envia($1,$2,'text','cursor germans',null,'{}')", [sid(n), SF]);
      });
      await pg.query("update public.xat_missatges set creat_al='2026-11-25T02:01:02.123456Z' where id=any($1::uuid[])", [[sid(830), sid(831), sid(832)]]);
      const page = async (date = null, seq = null) => (await actor(SA, 'select to_jsonb(q) as q from public.xat_cerca_missatges_fil_v2($1,$2,2,$3,$4) q', [SF, 'cursor germans', date, seq])).map(r => r.q);
      const a = await page(), b = await page(a.at(-1).creat_al, a.at(-1).seq);
      assert.equal(a.length, 2); assert.equal(b.length, 1); assert.equal(new Set([...a, ...b].map(m => m.id)).size, 3);
      assert.match(a[0].creat_al, /123456/);
      await assert.rejects(page(a[0].creat_al, null), e => e.code === '22023');
    });
    await t.test('purga encola la API; preserva cautelar fins després de reclamar el lot', async () => {
      const id = sid(820); await adjunt(id);
      const section = sid(821);
      await actor(SA, 'select public.publica_section_submission_beta_cas($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)', [section, STOWN, 'mur', { content: 'Evidència', adjunt: id }, 'Prova', '', null, false, null, sid(822)]);
      await pg.query("update public.section_submissions set moderation_state='retirada_cautelar' where id=$1", [section]);
      await actor(SA, 'select public.xat_elimina_per_a_tothom($1,$2)', [SF, id]);
      assert.equal((await pg.query('select private.xat_purga_blobs_esborrats(50) as n')).rows[0].n, 0);
      await pg.query('select private.xat_neteja_adjunts(50)');
      assert.equal((await pg.query('select count(*)::int n from public.xat_adjunts where id=$1', [id])).rows[0].n, 1);
      await assert.rejects(pg.query("delete from storage.objects where bucket_id='xat_adjunts' and name=$1", [id]), e => e.code === '42501');
      await pg.query("update public.section_submissions set moderation_state='visible' where id=$1", [section]);
      assert.equal((await pg.query('select private.xat_purga_blobs_esborrats(50) as n')).rows[0].n, 1);
      assert.equal((await pg.query("select count(*)::int n from private.purga_storage_pendent where nom=$1", [id])).rows[0].n, 1);
      assert.equal((await pg.query("select count(*)::int n from storage.objects where name=$1", [id])).rows[0].n, 1);
      await pg.query("update public.section_submissions set moderation_state='retirada_cautelar' where id=$1", [section]);
      await assert.rejects(pg.query("delete from storage.objects where name=$1 and bucket_id='xat_adjunts'", [id]), e => e.code === '42501');
    });
    /* SV-01 (Gauntlet de la integració v1.2.25) · Una publicació retirada d'un altre veí que cita l'UUID d'un
       adjunt no el fixa: la purga continua, la fila (i la quota) se'n va i el DELETE de Storage no es refusa.
       La retirada d'una publicació del mateix autor sí que el fixa (la prova d'abans, també després de purgar
       la fila de xat_adjunts). Reprodueix la prova adversària del verificador. */
    await t.test('SV-01 · un veí no pot fixar l’adjunt d’un altre citant-ne l’UUID', async () => {
      const id = sid(840); await adjunt(id, 'text/plain', 4096);
      const section = sid(841);
      await actor(SB, 'select public.publica_section_submission_beta_cas($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)', [section, STOWN, 'mur', { content: `text qualsevol ${id}` }, 'Prova veí', '', null, false, null, sid(842)]);
      assert.equal((await pg.query('select owner_user_id from public.section_submissions where id=$1', [section])).rows[0].owner_user_id, SB);
      await pg.query("update public.section_submissions set moderation_state='retirada_cautelar' where id=$1", [section]);
      assert.equal((await pg.query('select private.xat_adjunt_protegit_lssi($1) as held', [id])).rows[0].held, false);
      await actor(SA, 'select public.xat_elimina_per_a_tothom($1,$2)', [SF, id]);
      assert.equal((await pg.query('select private.xat_purga_blobs_esborrats(50) as n')).rows[0].n, 1);
      assert.equal((await pg.query('select count(*)::int n from public.xat_adjunts where id=$1', [id])).rows[0].n, 0);
      assert.equal((await pg.query('select count(*)::int n from private.purga_storage_pendent where nom=$1', [id])).rows[0].n, 1);
      await pg.query("delete from storage.objects where bucket_id='xat_adjunts' and name=$1", [id]);
      assert.equal((await pg.query('select count(*)::int n from storage.objects where name=$1', [id])).rows[0].n, 0);
    });
    await t.test('deriva de cos conegut avorta abans de modificar DDL', async () => {
      const d = (await pg.query("select pg_get_functiondef('public.xat_reserva_adjunt(uuid,uuid,bigint,text,integer)'::regprocedure) d")).rows[0].d;
      await pg.exec(d.replace('declare v_jo uuid', 'declare /* deriva */ v_jo uuid'));
      await assert.rejects(pg.exec(migration), e => e.code === '55000'); await pg.exec('rollback');
      assert((await pg.query("select pg_get_functiondef('public.xat_reserva_adjunt(uuid,uuid,bigint,text,integer)'::regprocedure) d")).rows[0].d.includes('/* deriva */'));
      await pg.exec(d);
    });
    await t.test('[DEFECTE] una funció nova amb el mateix nom però cos divergent no se sobreescriu', async () => {
      const d = (await pg.query("select pg_get_functiondef('public.xat_missatge_fil_per_id(uuid,uuid)'::regprocedure) d")).rows[0].d;
      const divergent = d.replace(' select m.id', ' select /* cos alié */ m.id');
      assert.notEqual(d, divergent); await pg.exec(divergent);
      await assert.rejects(pg.exec(migration), e => e.code === '55000' && /SDP-C1-NEW-DRIFT/.test(e.message));
      await pg.exec('rollback');
      assert.equal((await pg.query("select pg_get_functiondef('public.xat_missatge_fil_per_id(uuid,uuid)'::regprocedure) d")).rows[0].d, divergent);
    });
  } finally { await pg.close(); }
});
