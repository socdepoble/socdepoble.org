import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { startLocalPostgres } from './fixtures/postgres-local.mjs';

const TOWN = '11000000-0000-4000-8000-000000000021';
const OTHER_TOWN = '11000000-0000-4000-8000-000000000022';
const OWNER = '22000000-0000-4000-8000-000000000021';
const OTHER = '22000000-0000-4000-8000-000000000022';
const id = n => `44000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const MIGRATION = 'supabase/migrations/2611121430_mur_foraster_projeccio_publica_opcio_a.sql';
const files = [
  'tests/fixtures/copublicacio/bootstrap.sql', 'supabase/migrations/2609080000_initial_schema.sql',
  'tests/fixtures/copublicacio/bootstrap-perfils.sql', 'supabase/migrations/2609140000_schema_notes.sql',
  'supabase/migrations/2609261200_publicacions_autoria.sql', 'supabase/migrations/2610061448_superadmin_aal2.sql',
  'supabase/migrations/2611111735_copublicacio_registrada.sql', 'supabase/migrations/2611112005_mur_lectura_publica_foraster.sql',
  'supabase/migrations/2611112149_mur_estat_public_i_padro.sql', MIGRATION, MIGRATION,
  'supabase/migrations/2611121830_frontera_contingut_editorial_i_notes_privades.sql',
  'supabase/migrations/2611121850_mur_text_dates_i_contactes.sql',
  'supabase/migrations/2611121850_mur_text_dates_i_contactes.sql'
];
async function actor(db, person = null, callback, role = person ? 'authenticated' : 'anon') {
  await db.query('begin');
  try {
    await db.query(`set local role ${role}`);
    await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.aal','aal2',true)", [person ?? '']);
    const result = await callback(db);
    await db.query('commit');
    return result;
  } catch (error) { await db.query('rollback'); throw error; }
}
async function insert(db, n, payload = {}, extra = {}) {
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [OWNER]);
  return db.query(`insert into public.section_submissions(id,tenant_id,owner_user_id,section_id,title,description,payload,visibility,moderation_state,deleted_at)
    values($1,$2,$3,$4,$5,'Resum públic',$6,$7,$8,$9)`, [id(n), extra.tenant ?? TOWN, extra.owner ?? OWNER,
    extra.section ?? 'mur', extra.title ?? 'Títol públic', { content: '<p>Text públic</p>', status: 'published', visibility: 'public', ...payload },
    extra.visibility ?? 'public', extra.moderation ?? 'visible', extra.deleted ?? null]);
}
const read = (db, town = TOWN, section = null, limit = 200, before = null, beforeId = null) =>
  db.query('select * from public.llig_mur_public($1,$2,$3,$4,$5)', [town, section, limit, before, beforeId]);
const revoke = (db, n, town = TOWN) => db.query('select public.revoca_publicacio_mur($1,$2) as ok', [id(n), town]);

test('R21 D1/F03 · PostgreSQL 18.6 real, projecció Foraster i revocació durable', { timeout: 90000 }, async t => {
  const cluster = await startLocalPostgres();
  const db = cluster.db;
  try {
    const version = (await db.query('select version()')).rows[0].version;
    assert.match(version, /^PostgreSQL 18\.6\b/);
    t.diagnostic(version);
    for (const file of files) await db.query(readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'));
    // ACL d'escriptura de l'amfitrió Supabase: la fixture mínima no declara els defaults.
    await db.query('grant insert,update,delete on public.section_submissions to authenticated');
    await db.query(`insert into public.towns(id,slug,name) values($1,'r21-test','Poble sintètic'),($2,'r21-altre','Altre poble sintètic')`, [TOWN, OTHER_TOWN]);
    for (const [person, name] of [[OWNER, 'Persona privada sintètica'], [OTHER, 'Altra persona sintètica']]) {
      await db.query('insert into auth.users(id,email_confirmed_at,raw_user_meta_data) values($1,now(),$2)', [person, { name, tenant_id: TOWN }]);
    }
    await db.query('update public.profiles set is_public=false where id in ($1,$2)', [OWNER, OTHER]);

    await t.test('anon no té SELECT cru ni tan sols per columna, ni accés a tombstones', async () => {
      for (const query of ['select * from public.section_submissions', 'select owner_user_id from public.section_submissions',
        'select payload from public.section_submissions', 'select * from private.mur_publicacions_revocades']) {
        await assert.rejects(actor(db, null, c => c.query(query)), e => e.code === '42501');
      }
      const grants = await db.query(`select count(*)::int n from information_schema.column_privileges
        where table_schema='public' and table_name='section_submissions' and grantee in ('anon','PUBLIC') and privilege_type='SELECT'`);
      assert.equal(grants.rows[0].n, 0);
    });

    await t.test('projecció escalar sense perfil, owner, contacte, HTML, imatges, EXIF ni JSON desconegut', async () => {
      await insert(db, 1, { author_name: 'NOM PRIVAT', author_avatar: 'https://secret.invalid/photo.jpg',
        contact: { email: 'secret@example.invalid', phone: '+34999111222' }, gps: { lat: 38.123456, lon: -0.123456 },
        fotos_geo: [{ lat: 38.123456, lng: -0.123456 }], metadata: { owner_user_id: OWNER },
        unknown: { confidential: 'PRIVAT' }, content: `<script>SECRET_SCRIPT</script><p>Text públic</p><img src="https://secret.invalid/a.jpg" data-lat="38.123456">` });
      const result = await actor(db, null, read);
      assert.equal(result.rows.length, 1);
      assert.deepEqual(Object.keys(result.rows[0]), ['id','tenant_id','section_id','title','description','public_content','created_at','updated_at','catalog_font','catalog_id','catalog_destins','destinacio_workspace']);
      assert.equal(result.rows[0].public_content, 'Text públic');
      assert.doesNotMatch(JSON.stringify(result.rows), /NOM PRIVAT|secret|999111222|38\.123456|PRIVAT|SECRET_SCRIPT|owner_user_id|author_avatar|gps|fotos_geo/i);
      const signedIn = await actor(db, OTHER, read);
      assert.deepEqual(signedIn.rows, result.rows);
      const raw = await actor(db, OTHER, c => c.query('select id,owner_user_id,payload from public.section_submissions'));
      assert.equal(raw.rows.length, 0);
      const own = await actor(db, OWNER, c => c.query('select id,owner_user_id,payload from public.section_submissions where id=$1', [id(1)]));
      assert.equal(own.rows[0].owner_user_id, OWNER);
    });

    await t.test('privat/draft/moderat/eliminat i JSON compost malformat no es projecten', async () => {
      const cases = [
        [{ visibility: 'private' }], [{ status: 'draft' }], [{ isPublished: false }], [{ attributes: { visibility: 'private' } }],
        [{ payload: { status: 'draft' } }], [{ moderation_state: 'hidden' }], [{ attributes: { deleted_at: '2026-01-01' } }],
        [{ deletedAt: '2026-01-01' }], [{ attributes: [] }], [{ payload: 'public' }], [{ content: { secret: 'PRIVAT' } }],
        [{}, { visibility: 'private' }], [{}, { moderation: 'hidden' }], [{}, { deleted: '2026-01-01' }], [{}, { section: 'notes' }], [{ visibility: { public: true } }], [{ status: ['published'] }], [{ moderation_state: true }], [{ payload: { attributes: { deleted: true } } }]
      ];
      for (const [index, [payload, extra]] of cases.entries()) await insert(db, 100 + index, payload, extra);
      const visible = (await actor(db, null, read)).rows;
      assert.deepEqual(visible.map(r => r.id).sort(), [id(1), id(110)].sort());
      assert.equal(visible.find(r => r.id === id(110)).public_content, '');
    });

    await t.test('contactes i UUID enganxats al text es redacten, cap URL indirecta cap a binaris EXIF', async () => {
      await insert(db, 2, { content: `Mail secret@example.invalid +34 999 111 222 38.123456 -0.234567 ${OWNER} <a href="https://private.invalid">públic</a> https://private.invalid/original.jpg` });
      const row = (await actor(db, null, read)).rows.find(r => r.id === id(2));
      assert.doesNotMatch(row.public_content, /secret@|22000000|https:|href=|999|38\.123456|0\.234567/);
      assert.match(row.public_content, /públic/);
    });

    await t.test('R21.6 preserva dates ISO/rangs sense obrir telèfons curts separats, llargs o internacionals', async () => {
      for (const value of ['Festa 2026-11-12.', 'Període 1987-2026.', 'Línia\n2026-11-12\nText', 'Dia 2024-02-29.', 'Dia 2000-02-29.']) {
        assert.equal((await db.query('select private.mur_text_public($1) as text',[value])).rows[0].text,value);
      }
      for (const phone of ['12 34 56 78','999111222','02012345678','34999111222','+34 999 111 222','+49 (0) 123 456 7890','1234-56-78','2026-02-31','2026-13-01','2025-02-29','1900-02-29']) {
        const value=(await db.query('select private.mur_text_public($1) as text',[`Telèfon ${phone}.`])).rows[0].text;
        assert.equal(value,'Telèfon [contacte omés].');
      }
      assert.equal((await db.query("select private.mur_text_public('') as text")).rows[0].text,'');
      assert.equal((await db.query('select private.mur_text_public(null) as text')).rows[0].text,'');
      await assert.rejects(actor(db,null,c=>c.query("select private.mur_text_public('secret')")),e=>e.code==='42501');
    });

    await t.test('catàleg públic només projecta enums i identificadors escalars validats', async () => {
      await insert(db,30,{ projeccioCataleg: { v:1,font:'importacio-wp',id:'619',destins:['arbres-monumentals'],audiencia:'publica',owner_user_id:OWNER },destinacio_workspace:'arbres-monumentals' });
      const valid=(await actor(db,null,read)).rows.find(r => r.id===id(30));
      assert.equal(valid.catalog_font,'importacio-wp'); assert.equal(valid.catalog_id,'619');
      assert.deepEqual(valid.catalog_destins,['arbres-monumentals']); assert.equal(valid.destinacio_workspace,'arbres-monumentals');
      const markers = [{v:'1',font:'herbari',id:'romaní',destins:['herbari'],audiencia:'publica'},
        {v:1,font:'herbari',id:OWNER,destins:['herbari'],audiencia:'publica'},
        {v:1,font:{ private: OWNER },id:'x',destins:['herbari'],audiencia:'publica'},
        {v:1,font:'bar',id:'pa',destins:['bar'],audiencia:'publica'},
        {v:1,font:'herbari',id:'pa',destins:[{secret:OWNER}],audiencia:'publica'}];
      for (const [i,marker] of markers.entries()) {
        await insert(db,31+i,{projeccioCataleg:marker});
        const row=(await actor(db,null,read)).rows.find(r => r.id===id(31+i));
        assert.equal(row.catalog_font,null); assert.equal(row.catalog_id,null); assert.equal(row.catalog_destins,null);
      }
    });

    await t.test('només rol superadmin actiu aal2 pot canviar moderació o deleted_at', async () => {
      await insert(db,40,{}, { moderation:'hidden' });
      const modify = (aal,field='moderation_state',value='visible') => actor(db,OWNER,async c => {
        await c.query("select set_config('request.jwt.claim.aal',$1,true)",[aal]);
        return c.query(`update public.section_submissions set ${field}=$1 where id=$2`,[value,id(40)]);
      });
      await assert.rejects(modify('aal1'),e => e.code==='42501');
      await assert.rejects(modify('aal2'),e => e.code==='42501');
      await assert.rejects(modify('aal2','deleted_at','2026-01-01'),e => e.code==='42501');
      await db.query("insert into public.user_platform_roles(user_id,role) values($1,'superadmin')",[OWNER]);
      await assert.rejects(modify('aal1'),e => e.code==='42501');
      await db.query("update auth.users set banned_until=now()+interval '1 day' where id=$1",[OWNER]);
      await assert.rejects(modify('aal2'),e => e.code==='42501');
      await db.query('update auth.users set banned_until=null where id=$1',[OWNER]);
      assert.equal((await modify('aal2')).rowCount,1);
      assert((await actor(db,null,read)).rows.some(r => r.id===id(40)));
      await db.query('delete from public.user_platform_roles where user_id=$1',[OWNER]);
    });

    await t.test('el padró registrat tampoc revela publicadors de files privades, moderades o esborrades', async () => {
      await db.query("insert into public.organizations(id,tenant_id,slug,name,kind,created_by) values($1,$2,'r21-publicador','Entitat pública sintètica','entity',$3)",[id(5000),TOWN,OWNER]);
      await insert(db,50);
      await db.query('update public.section_submissions set author_org_id=$1 where id=$2',[id(5000),id(50)]);
      const registry = () => actor(db,null,c => c.query("select public.llig_publicadors_registrats($1,'article',$2) as value",[TOWN,id(50)]));
      assert.equal((await registry()).rows[0].value.publicadorsRegistrats.length,1);
      for (const fields of ["visibility='private'", "moderation_state='hidden'", "deleted_at=now()"]){
        await db.query("update public.section_submissions set visibility='public',moderation_state='visible',deleted_at=null where id=$1",[id(50)]);
        await db.query(`update public.section_submissions set ${fields} where id=$1`,[id(50)]);
        assert.deepEqual((await registry()).rows[0].value.publicadorsRegistrats,[]);
      }
      await db.query('delete from public.section_submissions where id=$1',[id(50)]);
      assert.deepEqual((await registry()).rows[0].value.publicadorsRegistrats,[]);
    });

    await t.test('filtre tenant, secció, paginació estable i límit acotat', async () => {
      await insert(db, 3, {}, { section: 'mercat' });
      await insert(db, 4, {}, { tenant: OTHER_TOWN });
      const first = (await actor(db, null, c => read(c, TOWN, 'mur', 1))).rows;
      assert.equal(first.length, 1);
      const next = (await actor(db, null, c => read(c, TOWN, 'mur', 1, first[0].created_at, first[0].id))).rows;
      assert.equal(next.length, 1);
      assert.notEqual(next[0].id, first[0].id);
      assert((await actor(db, null, c => read(c, TOWN, 'mercat'))).rows.every(r => r.section_id === 'mercat' && r.tenant_id === TOWN));
      assert.deepEqual((await actor(db, null, c => read(c, TOWN, null, 200, first[0].created_at, null))).rows, []);
    });

    await t.test('autor edita la seua publicació; l’altre compte no pot editar ni esborrar', async () => {
      const ownerUpdate = await actor(db, OWNER, c => c.query('update public.section_submissions set title=$1 where id=$2 returning id', ['Títol revisat',id(3)]));
      assert.equal(ownerUpdate.rowCount, 1);
      const otherUpdate = await actor(db, OTHER, c => c.query('update public.section_submissions set title=$1 where id=$2 returning id', ['Títol usurpat',id(3)]));
      assert.equal(otherUpdate.rowCount, 0);
      const otherDelete = await actor(db, OTHER, c => c.query('delete from public.section_submissions where id=$1 returning id', [id(3)]));
      assert.equal(otherDelete.rowCount, 0);
      assert.equal((await actor(db, null, c => read(c,TOWN,'mercat'))).rows[0].title, 'Títol revisat');
    });

    await t.test('no es pot escapar d’una retirada canviant UUID o poble d’una fila', async () => {
      await assert.rejects(actor(db, OWNER, c => c.query('update public.section_submissions set id=$1 where id=$2', [id(3000),id(3)])), e => e.code === '23514' && /SDP-MUR-IDENTITY/.test(e.message));
      await assert.rejects(actor(db, OWNER, c => c.query('update public.section_submissions set tenant_id=$1 where id=$2', [OTHER_TOWN,id(3)])), e => /SDP-MUR-IDENTITY|SDP-SEC-001/.test(e.message));
      assert((await actor(db,null,c => read(c,TOWN,'mercat'))).rows.some(r => r.id === id(3)));
    });

    await t.test('IDOR i cross-tenant rebutjats sense retirar la publicació', async () => {
      await assert.rejects(actor(db, OTHER, c => revoke(c, 1)), e => e.code === '42501');
      await assert.rejects(actor(db, OWNER, c => revoke(c, 1, OTHER_TOWN)), e => e.code === '42501');
      await assert.rejects(actor(db, null, c => revoke(c, 1)), e => e.code === '42501');
      assert((await actor(db, null, read)).rows.some(r => r.id === id(1)));
    });

    await t.test('revocació immediata per a anon/authenticated, replay idempotent i anti-upsert zombie', async () => {
      assert.equal((await actor(db, OWNER, c => revoke(c, 1))).rows[0].ok, true);
      assert.equal((await actor(db, OWNER, c => revoke(c, 1))).rows[0].ok, true);
      for (const person of [null, OWNER, OTHER]) assert(!(await actor(db, person, read)).rows.some(r => r.id === id(1)));
      assert.equal((await actor(db, OWNER, c => c.query('select id from public.section_submissions where id=$1', [id(1)]))).rows.length, 0);
      await assert.rejects(insert(db, 1), e => e.code === '23514' && /SDP-MUR-REVOKED/.test(e.message));
      await assert.rejects(actor(db, OTHER, c => revoke(c, 1)), e => e.code === '42501');
    });

    await t.test('revocació d’UUID absent és durable abans de publicació en vol', async () => {
      assert.equal((await actor(db, OWNER, c => revoke(c, 5))).rows[0].ok, true);
      await assert.rejects(insert(db, 5), e => e.code === '23514');
      await assert.rejects(actor(db, OWNER, c => revoke(c, 6, OTHER_TOWN)), e => e.code === '42501');
    });

    await t.test('DELETE de nota i despublicació retiren servidor en mateixa transacció', async () => {
      for (const [n, remove] of [[7, true], [8, false]]) {
        await insert(db, n);
        await db.query(`insert into public.notes(id,tenant_id,owner_user_id,is_published,published_submission_id) values($1,$2,$3,true,$4)`, [id(n+1000), TOWN, OWNER, id(n)]);
        await actor(db, OWNER, c => c.query(remove ? 'delete from public.notes where id=$1' : 'update public.notes set is_published=false where id=$1', [id(n+1000)]));
        assert(!(await actor(db, null, read)).rows.some(r => r.id === id(n)));
        assert.equal((await db.query('select count(*)::int n from public.section_submissions where id=$1', [id(n)])).rows[0].n, 0);
        await assert.rejects(insert(db, n), e => e.code === '23514');
      }
    });

    await t.test('RPC de nota valida CAS abans de retirar, amb identitat i tenant del servidor', async () => {
      await insert(db, 20);
      await db.query('insert into public.notes(id,tenant_id,owner_user_id,is_published,published_submission_id) values($1,$2,$3,true,$4)',[id(1020),TOWN,OWNER,id(20)]);
      const call = (c,person=OWNER,tenant=TOWN,revision=1) => actor(c,person,x => x.query('select public.revoca_publicacio_de_nota($1,$2,$3) as ok',[id(1020),tenant,revision]));
      await assert.rejects(call(db,OTHER), e => e.code==='42501');
      await assert.rejects(call(db,OWNER,OTHER_TOWN), e => e.code==='42501');
      await assert.rejects(call(db,OWNER,TOWN,99), e => e.code==='40001');
      assert((await actor(db,null,read)).rows.some(r => r.id===id(20)));
      assert.equal((await call(db)).rows[0].ok,true);
      assert.equal((await call(db)).rows[0].ok,true); // ACK perdut: FK ja ha incrementat revision.
      assert.equal((await db.query('select is_published from public.notes where id=$1',[id(1020)])).rows[0].is_published,false);
      await insert(db,24);
      await actor(db,OWNER,c => c.query('update public.notes set is_published=true,published_submission_id=$1 where id=$2',[id(24),id(1020)]));
      assert.equal((await call(db)).rows[0].ok,true); // Reintent vell no retira la nova publicació.
      assert((await actor(db,null,read)).rows.some(r => r.id===id(24)));
      assert(!(await actor(db,null,read)).rows.some(r => r.id===id(20)));
      await actor(db,OWNER,c => c.query('delete from public.notes where id=$1',[id(1020)]));
      assert.equal((await call(db)).rows[0].ok,true);
      assert.equal((await actor(db,OWNER,c => c.query('select public.revoca_publicacio_de_nota($1,$2,1) as ok',[id(9988),TOWN]))).rows[0].ok,false);
    });

    await t.test('dues retirades concurrents de la mateixa nota/revisió confirmen un únic intent', async () => {
      await insert(db,60);
      await db.query('insert into public.notes(id,tenant_id,owner_user_id,is_published,published_submission_id) values($1,$2,$3,true,$4)',[id(1060),TOWN,OWNER,id(60)]);
      const first=await cluster.connect(), second=await cluster.connect();
      for(const c of [first,second]) {
        await c.query('begin'); await c.query('set local role authenticated');
        await c.query("select set_config('request.jwt.claim.sub',$1,true)",[OWNER]);
      }
      const call=c => c.query('select public.revoca_publicacio_de_nota($1,$2,1) as ok',[id(1060),TOWN]);
      let pending;
      try {
        assert.equal((await call(first)).rows[0].ok,true);
        const pid=(await second.query('select pg_backend_pid() as pid')).rows[0].pid;
        pending=call(second);
        let locked=false; const end=Date.now()+5000;
        while(Date.now()<end) {
          const state=(await db.query('select wait_event from pg_stat_activity where pid=$1',[pid])).rows[0];
          if(state.wait_event==='advisory') { locked=true; break; }
          await new Promise(resolve => setTimeout(resolve,10));
        }
        assert.equal(locked,true);
        await first.query('commit');
        assert.equal((await pending).rows[0].ok,true);
        await second.query('commit');
        assert.equal((await db.query('select count(*)::int n from private.mur_revocacions_notes where note_id=$1 and expected_revision=1',[id(1060)])).rows[0].n,1);
      } finally {
        await first.query('rollback'); await second.query('rollback');
        if(pending) await pending.catch(() => {});
      }
    });

    await t.test('nota privada editada i primer vincle no retiren una primera publicació', async () => {
      await db.query('insert into public.notes(id,tenant_id,owner_user_id) values($1,$2,$3)',[id(21),TOWN,OWNER]);
      await actor(db,OWNER,c => c.query('update public.notes set title=$1 where id=$2',['Encara privada',id(21)]));
      await insert(db,21);
      await actor(db,OWNER,c => c.query('update public.notes set is_published=true,published_submission_id=$1 where id=$1',[id(21)]));
      assert((await actor(db,null,read)).rows.some(r => r.id===id(21)));
    });

    await t.test('esborrar nota abans del POST copublicat deixa tombstone del seu UUID', async () => {
      await db.query('insert into public.notes(id,tenant_id,owner_user_id) values($1,$2,$3)',[id(22),TOWN,OWNER]);
      await actor(db,OWNER,c => c.query('delete from public.notes where id=$1',[id(22)]));
      await assert.rejects(insert(db,22),e => e.code==='23514');
    });

    await t.test('paperera retira servidor també si la nota conserva is_published', async () => {
      await db.query("alter table public.notes add column status text not null default 'activa'");
      await insert(db,23);
      await db.query('insert into public.notes(id,tenant_id,owner_user_id,is_published,published_submission_id) values($1,$2,$3,true,$4)',[id(1023),TOWN,OWNER,id(23)]);
      await actor(db,OWNER,c => c.query("update public.notes set status='paperera' where id=$1",[id(1023)]));
      assert(!(await actor(db,null,read)).rows.some(r => r.id===id(23)));
      await assert.rejects(insert(db,23),e => e.code==='23514');
    });

    await t.test('ACK perdut de PATCH confirmat no deixa una retirada ja feta eternament pendent', async () => {
      for (const [n,patch] of [[70,'is_published=false'],[71,"status='paperera'"]]) {
        await insert(db,n);
        await db.query('insert into public.notes(id,tenant_id,owner_user_id,is_published,published_submission_id) values($1,$2,$3,true,$4)',[id(n+1000),TOWN,OWNER,id(n)]);
        await actor(db,OWNER,c => c.query(`update public.notes set ${patch} where id=$1`,[id(n+1000)]));
        const before=(await db.query('select * from public.notes where id=$1',[id(n+1000)])).rows[0];
        assert(before.revision>1); assert.equal(before.published_submission_id,null);
        const call=()=>actor(db,OWNER,c => c.query('select public.revoca_publicacio_de_nota($1,$2,1) as ok',[id(n+1000),TOWN]));
        assert.equal((await call()).rows[0].ok,true);
        assert.equal((await call()).rows[0].ok,true);
        const after=(await db.query('select * from public.notes where id=$1',[id(n+1000)])).rows[0];
        assert.deepEqual(after,before); // ACK, cap altra mutació ni revisió de nota.
        assert(!(await actor(db,null,read)).rows.some(r => r.id===id(n)));
        assert.equal((await db.query('select count(*)::int n from private.mur_revocacions_notes where note_id=$1 and expected_revision=1',[id(n+1000)])).rows[0].n,1);
        await assert.rejects(actor(db,OWNER,c => c.query('select public.revoca_publicacio_de_nota($1,$2,99)',[id(n+1000),TOWN])),e => e.code==='40001');
      }
      // Sense rebut anterior: un intent vell mai retira una republicació nova.
      await insert(db,72);
      await db.query('insert into public.notes(id,tenant_id,owner_user_id,is_published,published_submission_id) values($1,$2,$3,true,$4)',[id(1072),TOWN,OWNER,id(72)]);
      await actor(db,OWNER,c => c.query('update public.notes set is_published=false where id=$1',[id(1072)]));
      await insert(db,73);
      await actor(db,OWNER,c => c.query('update public.notes set is_published=true,published_submission_id=$1 where id=$2',[id(73),id(1072)]));
      await assert.rejects(actor(db,OWNER,c => c.query('select public.revoca_publicacio_de_nota($1,$2,1)',[id(1072),TOWN])),e => e.code==='40001');
      assert((await actor(db,null,read)).rows.some(r => r.id===id(73)));
    });

    await t.test('nota amb FK aliena no pot retirar la publicació d’altri', async () => {
      await insert(db, 9);
      await db.query(`insert into public.notes(id,tenant_id,owner_user_id,is_published,published_submission_id) values($1,$2,$3,true,$4)`, [id(1009), TOWN, OTHER, id(9)]);
      await actor(db, OTHER, c => c.query('delete from public.notes where id=$1', [id(1009)]));
      assert((await actor(db, null, read)).rows.some(r => r.id === id(9)));
    });

    await t.test('DELETE cru owner deixa tombstone i rollback restaura fila i projecció', async () => {
      await insert(db, 10);
      await db.query('begin');
      await db.query('set local role authenticated');
      await db.query("select set_config('request.jwt.claim.sub',$1,true)", [OWNER]);
      await revoke(db, 10);
      await db.query('rollback');
      assert((await actor(db, null, read)).rows.some(r => r.id === id(10)));
      await actor(db, OWNER, c => c.query('delete from public.section_submissions where id=$1', [id(10)]));
      await assert.rejects(insert(db, 10), e => e.code === '23514');
    });

    await t.test('dues connexions: publicació iniciada abans de revocar no sobreviu al commit de retirada', async () => {
      const publishing = await cluster.connect();
      const withdrawing = await cluster.connect();
      await publishing.query('begin');
      await insert(publishing, 11);
      await withdrawing.query('begin');
      await withdrawing.query('set local role authenticated');
      await withdrawing.query("select set_config('request.jwt.claim.sub',$1,true)", [OWNER]);
      const pending = revoke(withdrawing, 11);
      await publishing.query('commit');
      assert.equal((await pending).rows[0].ok, true);
      await withdrawing.query('commit');
      assert(!(await actor(db, null, read)).rows.some(r => r.id === id(11)));
      await assert.rejects(insert(db, 11), e => e.code === '23514');
    });
  } finally { await cluster.close(); }
});
