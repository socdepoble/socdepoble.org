import test from 'node:test';
import assert from 'node:assert/strict';
import { creaBaseR3246, asClient, catalogueR3246, eviR3246 } from './fixtures/r3246-catalogue-pglite.mjs';

const uuid = n => `46050000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const A = uuid(1), B = uuid(2), T = 'ac3bec76-255b-5ca2-8886-28fcceab4267', OTHER = uuid(99);
const CODE = expected => error => error?.code === expected;
const key = object => `${object.schema}.${object.name}`;

// La matriu distingix inventari, contracte de catàleg i comportament real.
// Una consulta de catàleg mai acredita una operació funcional amb files.
test('R32.46 · contractes de taules i cobertura funcional declarada', { timeout: 180000 }, async t => {
  const pg = await creaBaseR3246(), cases = [], coverage = new Map(), failedCases = [];
  const run = (name, fn) => t.test(name, async () => { try { await fn(); } catch (error) { failedCases.push(name); throw error; } });
  const actor = (uid, sql, args = [], role = uid ? 'authenticated' : 'anon') => asClient(pg, { uid, role }, sql, args);
  const record = (id, objects, assertions) => {
    cases.push({ id, objects, assertions, status: 'passed' });
    for (const object of objects) coverage.set(object, [...(coverage.get(object) ?? []), id]);
  };
  let catalogue, compatibilityShim;
  try {
    catalogue = await catalogueR3246(pg);
    await run('T01 · catàleg complet i contractes efectius de rols, columnes i relacions', async () => {
      const raw = (await pg.query("SELECT n.nspname AS schema,c.relname AS name,c.relkind AS kind FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=ANY($1) AND c.relkind=ANY($2) ORDER BY 1,2", [['public', 'private', 'auth', 'storage', 'node0', 'realtime'], ['r', 'p', 'v', 'm', 'f']])).rows;
      assert.deepEqual(raw, catalogue.tables.map(({ schema, name, kind }) => ({ schema, name, kind })));
      assert.ok(catalogue.tables.length > 100); assert.ok(catalogue.functions.length > 400);
      for (const role of ['anon', 'authenticated', 'node0_runtime']) {
        const properties = catalogue.roles.find(r => r.rolname === role); assert.ok(properties);
        for (const field of ['rolsuper', 'rolbypassrls', 'rolcreaterole', 'rolcreatedb']) assert.equal(properties[field], false, `${role}.${field}`);
        assert.equal(catalogue.memberships.some(m => m.member === role), false);
      }
      for (const table of catalogue.tables) {
        assert.ok(Array.isArray(table.columns) && table.columns.length > 0, key(table));
        if (table.schema === 'public' && ['r', 'p'].includes(table.kind)) assert.equal(table.rls, true, key(table));
        for (const role of ['anon', 'authenticated']) for (const operation of ['truncate', 'trigger']) assert.equal(table.effective[role][operation], false, `${key(table)}:${role}:${operation}`);
      }
      const required = {
        'public.notes': { id: 'uuid', tenant_id: 'uuid', owner_user_id: 'uuid', revision: 'integer' },
        'public.town_memberships': { town_id: 'uuid', user_id: 'uuid', role: 'text' },
        'public.organization_memberships': { organization_id: 'uuid', tenant_id: 'uuid', user_id: 'uuid', role: 'text' },
        'public.section_submissions': { id: 'uuid', tenant_id: 'uuid', owner_user_id: 'uuid', payload: 'jsonb' }
      };
      for (const [relation, columns] of Object.entries(required)) for (const [name, type] of Object.entries(columns)) {
        const column = catalogue.tables.find(r => key(r) === relation)?.columns.find(c => c.name === name);
        assert.ok(column, `${relation}.${name}`); assert.equal(column.type, type); assert.equal(column.notnull, true);
      }
      const fullAcl = (await pg.query(`SELECT n.nspname AS schema,c.relname AS name,a.attname AS column,r.role,
        has_schema_privilege(r.role,n.oid,'USAGE') AS schema_usage,
        has_table_privilege(r.role,c.oid,'SELECT') AS table_select,has_table_privilege(r.role,c.oid,'INSERT') AS table_insert,has_table_privilege(r.role,c.oid,'UPDATE') AS table_update,
        has_column_privilege(r.role,c.oid,a.attnum,'SELECT') AS column_select,has_column_privilege(r.role,c.oid,a.attnum,'INSERT') AS column_insert,has_column_privilege(r.role,c.oid,a.attnum,'UPDATE') AS column_update
        FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_attribute a ON a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped
        CROSS JOIN (VALUES('anon'),('authenticated'))r(role) WHERE n.nspname IN ('public','private','auth','storage','node0','realtime') AND c.relkind IN ('r','p','v','m','f') ORDER BY 1,2,a.attnum,r.role`)).rows;
      assert.ok(fullAcl.some(a => a.column_select && !a.table_select || a.column_insert && !a.table_insert || a.column_update && !a.table_update));
      for (const role of ['anon', 'authenticated']) assert.equal(fullAcl.filter(a => a.schema === 'auth' && a.name === 'users' && a.role === role && a.column_select).length, 0);
      for (const fn of catalogue.functions.filter(f => f.security_definer)) assert.deepEqual(fn.config, ['search_path=""']);
      eviR3246('c3_contractes_column_acl.json', fullAcl);
      cases.push({ id: 'T01', status: 'passed', type: 'catalogue-contract', relations: catalogue.tables.length, functions: catalogue.functions.length, columnRoleRows: fullAcl.length });
    });

    // Camps d'infraestructura Auth que consumix l'RPC real, absents del
    // substitut Node0 mínim. Només la DB efímera rep estos dos camps nullable.
    const shimColumns = [];
    for (const name of ['created_at', 'last_sign_in_at']) {
      const before = (await pg.query("SELECT format_type(atttypid,atttypmod) AS type,attnotnull AS notnull FROM pg_attribute WHERE attrelid='auth.users'::regclass AND attname=$1 AND attnum>0 AND NOT attisdropped", [name])).rows;
      if (before.length) { assert.equal(before[0].type, 'timestamp with time zone'); assert.equal(before[0].notnull, false); }
      else await pg.exec(`ALTER TABLE auth.users ADD COLUMN ${name} timestamptz`);
      shimColumns.push({ name, type: 'timestamptz', nullable: true, added: !before.length, default: null });
    }
    compatibilityShim = { scope: 'ephemeral-auth-substitute-only', productionSchemaChanged: false, columns: shimColumns };
    for (const [uid, label] of [[A, 'A'], [B, 'B']]) {
      await pg.query('INSERT INTO auth.users(id,email,email_confirmed_at,raw_user_meta_data,created_at,last_sign_in_at) VALUES($1,$2,now(),$3,$4,$5)', [uid, `r3246-contracte-${label}@example.invalid`, { full_name: `Persona sintètica ${label}`, tenant_id: T, accepta_rgpd: true }, '2026-11-23T00:00:00Z', '2026-11-23T00:01:00Z']);
      await pg.query('INSERT INTO public.town_memberships(town_id,user_id) VALUES($1,$2) ON CONFLICT DO NOTHING', [T, uid]);
      await pg.query('INSERT INTO private.normes_acceptades(usuari_id,versio) VALUES($1,private.versio_normes_vigent()) ON CONFLICT DO NOTHING', [uid]);
    }
    await pg.query("INSERT INTO public.towns(id,slug,name) VALUES($1,'r3246-contracte-altre-poble','Poble sintètic sense pertinences')", [OTHER]);

    await run('T02 · sessió efectiva i restauració després de transacció fallida', async () => {
      assert.deepEqual(await actor(A, 'SELECT current_user AS role,auth.uid() AS uid,auth.role() AS claim'), [{ role: 'authenticated', uid: A, claim: 'authenticated' }]);
      await assert.rejects(actor(A, 'SELECT 1/0'), CODE('22012'));
      const reset = (await pg.query("SELECT current_user AS role,current_setting('request.jwt.claim.sub',true) AS uid")).rows[0];
      assert.equal(reset.role, 'postgres'); assert.ok(reset.uid == null || reset.uid === '');
      assert.deepEqual(await actor(B, 'SELECT auth.uid() AS uid'), [{ uid: B }]);
      record('T02', ['auth.uid', 'auth.role'], 'Rol SQL i claims locals reals; rollback i cap identitat residual.');
    });

    await run('T03 · notes: CRUD propi, aïllament i rebuig de canvi de propietària/poble', async () => {
      for (const [uid, n, label] of [[A, 10, 'A'], [B, 11, 'B']]) {
        const inserted = await actor(uid, 'INSERT INTO public.notes(id,tenant_id,owner_user_id,title,content) VALUES($1,$2,$3,$4,$5) RETURNING id,revision', [uuid(n), T, uid, `Nota ${label}`, `CANARI_C3_CONTRACTE_${label}`]);
        assert.deepEqual(inserted, [{ id: uuid(n), revision: 1 }]);
      }
      assert.equal((await pg.query('SELECT count(*)::int AS n FROM public.notes WHERE id=ANY($1::uuid[])', [[uuid(10), uuid(11)]])).rows[0].n, 2);
      assert.deepEqual(await actor(A, 'SELECT id,content FROM public.notes WHERE id=ANY($1::uuid[]) ORDER BY id', [[uuid(10), uuid(11)]]), [{ id: uuid(10), content: 'CANARI_C3_CONTRACTE_A' }]);
      assert.deepEqual(await actor(B, 'SELECT id,content FROM public.notes WHERE id=ANY($1::uuid[]) ORDER BY id', [[uuid(10), uuid(11)]]), [{ id: uuid(11), content: 'CANARI_C3_CONTRACTE_B' }]);
      assert.equal((await actor(A, 'UPDATE public.notes SET title=$2 WHERE id=$1 RETURNING revision', [uuid(10), 'Nota pròpia actualitzada']))[0].revision, 2);
      const before = (await pg.query('SELECT * FROM public.notes WHERE id=$1', [uuid(10)])).rows;
      assert.deepEqual(await actor(B, 'UPDATE public.notes SET content=$2 WHERE id=$1 RETURNING id', [uuid(10), 'intent alié']), []);
      assert.deepEqual(await actor(B, 'DELETE FROM public.notes WHERE id=$1 RETURNING id', [uuid(10)]), []);
      for (const [sql, args] of [
        ['UPDATE public.notes SET owner_user_id=$2 WHERE id=$1 RETURNING id', [uuid(10), B]],
        ['UPDATE public.notes SET tenant_id=$2 WHERE id=$1 RETURNING id', [uuid(10), OTHER]],
        ['INSERT INTO public.notes(id,tenant_id,owner_user_id) VALUES($1,$2,$3)', [uuid(12), T, B]],
        ['INSERT INTO public.notes(id,tenant_id,owner_user_id) VALUES($1,$2,$3)', [uuid(13), OTHER, A]]
      ]) await assert.rejects(actor(A, sql, args), CODE('42501'));
      await assert.rejects(actor(null, 'SELECT content FROM public.notes WHERE id=$1', [uuid(10)]), CODE('42501'));
      assert.deepEqual((await pg.query('SELECT * FROM public.notes WHERE id=$1', [uuid(10)])).rows, before);
      assert.equal((await pg.query('SELECT count(*)::int AS n FROM public.notes WHERE id=ANY($1::uuid[])', [[uuid(12), uuid(13)]])).rows[0].n, 0);
      assert.deepEqual(await actor(B, 'DELETE FROM public.notes WHERE id=$1 RETURNING id', [uuid(11)]), [{ id: uuid(11) }]);
      // La fixture es restaura per verificar les dues exportacions més avall.
      await actor(B, 'INSERT INTO public.notes(id,tenant_id,owner_user_id,content) VALUES($1,$2,$3,$4)', [uuid(11), T, B, 'CANARI_C3_CONTRACTE_B']);
      record('T03', ['public.notes', 'public.town_memberships'], 'Files presents; lectura/escriptura/eliminació pròpies positives, negatives alienes i estat final verificat.');
    });

    await run('T04 · unicitat, claus foranes i atomicitat de lots rebutjats', async () => {
      const membershipBefore = (await pg.query('SELECT * FROM public.town_memberships WHERE town_id=$1 AND user_id=$2', [T, A])).rows;
      await assert.rejects(pg.query('INSERT INTO public.town_memberships(town_id,user_id) VALUES($1,$2)', [T, A]), CODE('23505'));
      await assert.rejects(pg.query('INSERT INTO public.town_memberships(town_id,user_id) VALUES($1,$2)', [T, uuid(98)]), CODE('23503'));
      await assert.rejects(pg.query('INSERT INTO public.town_memberships(town_id,user_id) VALUES($1,$2)', [uuid(98), A]), CODE('23503'));
      assert.deepEqual((await pg.query('SELECT * FROM public.town_memberships WHERE town_id=$1 AND user_id=$2', [T, A])).rows, membershipBefore);
      await assert.rejects(actor(A, 'INSERT INTO public.notes(id,tenant_id,owner_user_id,title) VALUES($1,$2,$3,$4),($5,$2,$3,$6)', [uuid(14), T, A, 'Part que no ha de persistir', uuid(10), 'Clau duplicada']), CODE('23505'));
      assert.equal((await pg.query('SELECT count(*)::int AS n FROM public.notes WHERE id=$1', [uuid(14)])).rows[0].n, 0);
      await assert.rejects(pg.query('INSERT INTO public.notes(id,tenant_id,owner_user_id) VALUES($1,$2,NULL)', [uuid(15), T]), CODE('23502'));
      record('T04', ['public.notes', 'public.town_memberships', 'auth.users', 'public.towns'], 'PK, FK i NOT NULL exercitats; rebuig atòmic d’un INSERT multifila. Les proves de restriccions són d’operador local.');
    });

    await run('T05 · directori públic, columna de contacte reservada i auth sense enumeració', async () => {
      for (const [n, visibility] of [[20, 'public'], [21, 'members']]) await pg.query("INSERT INTO public.organizations(id,tenant_id,slug,name,kind,visibility,created_by,contact_email,public_email) VALUES($1,$2,$3,'Grup sintètic C3','group',$4,$5,'CONTACTE_C3_RESERVAT',false)", [uuid(n), T, `r3246-contracte-grup-${n}`, visibility, A]);
      const view = catalogue.tables.find(r => key(r) === 'public.organization_directory');
      assert.ok(view.options.includes('security_invoker=true')); assert.ok(view.options.includes('security_barrier=true'));
      const positive = await actor(null, 'SELECT * FROM public.organization_directory WHERE id=$1', [uuid(20)]);
      assert.equal(positive.length, 1); assert.equal(positive[0].correu_public, null); assert.ok(!Object.hasOwn(positive[0], 'contact_email')); assert.ok(!JSON.stringify(positive).includes('CONTACTE_C3_RESERVAT'));
      assert.deepEqual(await actor(null, 'SELECT * FROM public.organization_directory WHERE id=$1', [uuid(21)]), []);
      for (const uid of [null, B]) {
        await assert.rejects(actor(uid, 'SELECT contact_email FROM public.organizations WHERE id=$1', [uuid(20)]), CODE('42501'));
        await assert.rejects(actor(uid, 'SELECT id,email FROM auth.users WHERE id=ANY($1::uuid[])', [[A, B]]), CODE('42501'));
      }
      assert.equal((await pg.query('SELECT count(*)::int AS n FROM auth.users WHERE id=ANY($1::uuid[])', [[A, B]])).rows[0].n, 2);
      record('T05', ['public.organizations', 'public.organization_directory', 'auth.users'], 'Vista amb fila pública positiva i privada absent, columna reservada i comptes presents no enumerables.');
    });

    await run('T06 · exportació pròpia coherent amb notes i compte, sense dades de l’altra persona', async () => {
      for (const [uid, own, foreign] of [[A, 'A', 'B'], [B, 'B', 'A']]) {
        const exported = (await actor(uid, 'SELECT public.exporta_les_meues_dades() AS data'))[0].data;
        const text = JSON.stringify(exported);
        assert.ok(text.includes(`CANARI_C3_CONTRACTE_${own}`)); assert.ok(text.includes(`r3246-contracte-${own}@example.invalid`));
        assert.ok(!text.includes(`CANARI_C3_CONTRACTE_${foreign}`)); assert.ok(!text.includes(`r3246-contracte-${foreign}@example.invalid`));
      }
      await assert.rejects(actor(null, 'SELECT public.exporta_les_meues_dades()'), CODE('42501'));
      record('T06', ['public.notes', 'auth.users', 'public.exporta_les_meues_dades'], 'Dues exportacions amb dades pròpies presents i dades alienes absents; anònim rebutjat.');
    });

    await run('T07 · JSONB al límit de l’RPC i rebuig sense canvi parcial', async () => {
      const statement = 'SELECT public.publica_section_submission_beta_cas($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) AS ack';
      // El cos té el seu límit de 100000 caràcters independent del JSONB.
      const valid = { content: 'Cos sintètic breu', c3_padding: '' };
      const overhead = (await pg.query('SELECT octet_length($1::jsonb::text)::int AS n', [valid])).rows[0].n;
      valid.c3_padding = 'a'.repeat(700000 - overhead);
      const invalid = { ...valid, c3_padding: valid.c3_padding + 'a' };
      assert.equal((await pg.query('SELECT octet_length($1::jsonb::text)::int AS n', [valid])).rows[0].n, 700000);
      assert.equal((await pg.query('SELECT octet_length($1::jsonb::text)::int AS n', [invalid])).rows[0].n, 700001);
      const published = (await actor(A, statement, [uuid(30), T, 'mur', valid, 'JSONB sintètic al límit', '', null, false, null, uuid(40)]))[0].ack;
      assert.equal(published.id, uuid(30));
      const before = (await pg.query('SELECT * FROM public.section_submissions WHERE id=$1', [uuid(30)])).rows;
      const rejected = error => error?.code === '22023' && /SDP-BETA-001/.test(error.message);
      await assert.rejects(actor(A, statement, [uuid(30), T, 'mur', invalid, 'No ha de persistir', '', null, false, published.updated_at, uuid(41)]), rejected);
      await assert.rejects(actor(A, statement, [uuid(31), T, 'mur', invalid, 'Alta rebutjada', '', null, false, null, uuid(42)]), rejected);
      assert.deepEqual((await pg.query('SELECT * FROM public.section_submissions WHERE id=$1', [uuid(30)])).rows, before);
      assert.equal((await pg.query('SELECT count(*)::int AS n FROM public.section_submissions WHERE id=$1', [uuid(31)])).rows[0].n, 0);
      assert.equal((await pg.query('SELECT count(*)::int AS n FROM private.publicacions_beta_cas_rebuts WHERE operation_id=ANY($1::uuid[])', [[uuid(41), uuid(42)]])).rows[0].n, 0);
      assert.equal((await pg.query('SELECT count(*)::int AS n FROM private.publicacions_beta_cas_rebuts WHERE operation_id=$1', [uuid(40)])).rows[0].n, 1);
      record('T07', ['public.section_submissions', 'private.publicacions_beta_cas_rebuts', 'public.publica_section_submission_beta_cas', 'private.beta_payload_valid'], 'JSONB canònic de 700000 bytes acceptat; 700001 rebutjat en alta i canvi, fila i rebuts finals comprovats.');
    });

    await run('T08 · calibració del catàleg amb objectes locals deliberadament oberts', async () => {
      await pg.exec("CREATE TABLE public.c3_contract_probe(secret text);INSERT INTO public.c3_contract_probe VALUES('CANARI_CALIBRACIO_C3');GRANT SELECT ON public.c3_contract_probe TO anon;CREATE FUNCTION public.c3_contract_probe_fn() RETURNS text LANGUAGE sql SECURITY DEFINER AS $$SELECT secret FROM public.c3_contract_probe LIMIT 1$$;GRANT EXECUTE ON FUNCTION public.c3_contract_probe_fn() TO PUBLIC");
      try {
        const augmented = await catalogueR3246(pg), table = augmented.tables.find(r => r.name === 'c3_contract_probe'), fn = augmented.functions.find(r => r.name === 'c3_contract_probe_fn');
        assert.equal(table.rls, false); assert.equal(table.effective.anon.select, true); assert.equal(fn.security_definer, true); assert.equal(fn.effective.anon, true); assert.equal(fn.config, null);
        assert.deepEqual(await actor(null, 'SELECT * FROM public.c3_contract_probe'), [{ secret: 'CANARI_CALIBRACIO_C3' }]);
        assert.equal((await actor(null, 'SELECT public.c3_contract_probe_fn() AS secret'))[0].secret, 'CANARI_CALIBRACIO_C3');
      } finally { await pg.exec('DROP FUNCTION public.c3_contract_probe_fn();DROP TABLE public.c3_contract_probe'); }
      cases.push({ id: 'T08', status: 'passed', type: 'harness-calibration', productFinding: false });
    });
    assert.deepEqual(failedCases, [], 'Cap evidència final es genera si un subtest ha fallat.');
    assert.equal(cases.length, 8, 'T01..T08 han de completar-se.');
    const functionCases = new Map();
    for (const [signature, ids] of [
      ['auth.uid()', ['T02']], ['auth.role()', ['T02']],
      ['public.exporta_les_meues_dades()', ['T06']],
      ['public.publica_section_submission_beta_cas(uuid,uuid,text,jsonb,text,text,uuid,boolean,timestamptz,uuid)', ['T07']],
      ['private.beta_payload_valid(jsonb)', ['T07']]
    ]) {
      const rows = (await pg.query("SELECT n.nspname||'.'||p.proname||'('||pg_get_function_identity_arguments(p.oid)||')' AS object FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE p.oid=to_regprocedure($1)", [signature])).rows;
      assert.equal(rows.length, 1, signature); functionCases.set(rows[0].object, ids);
    }
    const matrix = [...catalogue.tables.map(object => ({ kind: 'relation', object: key(object), inventory: true, catalogueContract: true, functionalCases: coverage.get(key(object)) ?? [], functionalStatus: coverage.has(key(object)) ? 'executed' : 'outside-current-functional-scope' })),
      ...catalogue.functions.map(object => { const signature = `${key(object)}(${object.arguments})`; return { kind: 'function', object: signature, inventory: true, catalogueContract: object.security_definer ? 'fixed-search-path-and-effective-acl' : 'effective-acl-inventoried', functionalCases: functionCases.get(signature) ?? [], functionalStatus: functionCases.has(signature) ? 'executed-exact-signature-see-cases' : 'outside-current-functional-scope' }; })];
    eviR3246('c3_contractes_catalogue.json', catalogue);
    eviR3246('c3_contractes_cobertura.json', { scope: 'This suite only; identity and Storage evidence are separate.', matrix });
    eviR3246('c3_contractes_cases.json', { cases, compatibilityShim, source: pg.r3246, totals: { cases: cases.length, passed: cases.filter(c => c.status === 'passed').length, relationsInventoried: catalogue.tables.length, functionsInventoried: catalogue.functions.length, relationsFunctionallyExercised: matrix.filter(r => r.kind === 'relation' && r.functionalCases.length).length }, limits: ['PGlite local seqüencial; no concurrència PostgreSQL nativa.', 'Substitut Auth amb dos camps nullable declarats; cap servei HTTP Auth/Storage.', 'Inventari i ACL no equivalen a cobertura funcional completa de taules o RPC.', 'Les restriccions PK/FK/NOT NULL es proven amb rol operador separat de les comprovacions de rol client.'] });
  } finally { await pg.close(); }
});
