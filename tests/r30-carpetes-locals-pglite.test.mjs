/* Onada R30 · PF-01 (Carril 1) amb els invariants R31 traslladats a l'Onada R32 · Prova SQL
   amb PGlite local explícit (SDP_PGLITE_MODULE): la migració de les carpetes de Notes que només
   són al navegador (src/components/universal/classificacio/migracioCarpetesLocals.js) contra la
   RPC viva crea_carpeta_notes (supabase/migrations/2611051930_edicio_publicacions_editorials.sql).
   Cap RPC nova: la de la PF-01 de Codex R30 (migracio 20261115233000, migra_carpeta_notes i
   àlies) es va rebutjar i no existix. Invariants R31 (Codex R31 lot_03 · P2-T3): una alta nova
   amb un nom que cauria a l'espai reservat (UUID o id de sèrie) pren f-carpeta-* i arriba a la
   RPC real; el llegat ambigu queda pendent amb diagnòstic sense cap crida; cap id local es
   reescriu i el segon inici no torna a eixir cap a la xarxa. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const modulePath = process.env.SDP_PGLITE_MODULE;
if (!modulePath) throw new Error('Cal SDP_PGLITE_MODULE explícit per a la prova SQL PF-01.');
const { PGlite } = await import(pathToFileURL(modulePath).href);

const A = '00000000-0000-4000-8000-000000000001';
const T = '00000000-0000-4000-8000-000000000003';
const U = '00000000-0000-4000-8000-000000000004';
const AMBIT = `supabase:poble_persona::${A}_${T}`;
const UUID = '32100000-0000-4000-8000-000000000005';
const AMBIGUA = 'identificador-reservat-sense-prova-remota';
const CLAU_LOCAL = 'sdp_embed_classificacio-carpetes-creades';
const CLAU_REGISTRE = 'sdp_embed_classificacio-carpetes-migrades';
const source = await fs.readFile(new URL('../supabase/migrations/2611051930_edicio_publicacions_editorials.sql', import.meta.url), 'utf8');

async function setup(t) {
  const pg = new PGlite(); t.after(() => pg.close());
  await pg.exec(`create role anon; create role authenticated; create role service_role; create schema auth; create schema private;
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
    create function private.is_town_member(t uuid) returns boolean language sql stable as $$select t='${T}'::uuid$$;
    create table public.towns(id uuid primary key); insert into public.towns values('${T}'),('${U}');
    create table auth.users(id uuid primary key); insert into auth.users values('${A}');
    grant usage on schema public,auth,private to authenticated;
    select set_config('test.uid','${A}',false);`);
  await pg.exec(source.slice(source.indexOf('create table if not exists public.note_folders ('), source.lastIndexOf('commit;')));
  await pg.exec('set role authenticated');
  return pg;
}

/* El navegador fals arriba després d'arrencar PGlite (amb window, PGlite es creu navegador).
   Els mòduls s'importen després, perquè config/storage.js hi trobe el localStorage. */
async function navegador(t) {
  const dades = new Map();
  const storage = { getItem: (k) => dades.get(k) ?? null, setItem: (k, v) => dades.set(k, String(v)), removeItem: (k) => dades.delete(k),
    key: (i) => [...dades.keys()][i] ?? null, clear: () => dades.clear(), get length() { return dades.size; } };
  const abans = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { localStorage: storage, sessionStorage: storage,
    location: new URL('https://r32.example.invalid'), addEventListener() {}, removeEventListener() {} } });
  t.after(() => { if (abans) Object.defineProperty(globalThis, 'window', abans); else delete globalThis.window; });
  const creades = await import('../src/components/universal/classificacio/carpetesCreades.js');
  const migracio = await import('../src/components/universal/classificacio/migracioCarpetesLocals.js');
  const { carpetaDeFila } = await import('../src/data/carpetesNotes.js');
  creades._reiniciaCarpetesCreades();
  migracio._reiniciaMigracioCarpetes();
  return { storage, creades, migracio, carpetaDeFila };
}

function portSql(pg, carpetaDeFila, tenant = T) {
  const port = { crides: 0, teCapacitat: (c) => c === 'carpetesNotes', getRuntimeDataMode: () => 'remote', getCurrentUser: () => ({ id: A }),
    async creaCarpetaNotes({ nom }) {
      port.crides += 1;
      return carpetaDeFila((await pg.query('select public.crea_carpeta_notes($1,$2) as c', [nom, tenant])).rows[0].c);
    } };
  return port;
}

test('R32 · noms reservats nous, llegat ambigu i una carpeta normal contra la RPC viva crea_carpeta_notes', async (t) => {
  const pg = await setup(t);
  const { storage, creades, migracio, carpetaDeFila } = await navegador(t);
  for (const nom of [UUID, 'Notes']) {
    const nova = await creades.creaCarpetaCreada(AMBIT, nom);
    assert.deepEqual(nova, { id: `f-carpeta-${nom.toLowerCase()}`, nom, nova: true, desti: 'navegador' });
  }
  creades.desaCarpetaCreada(AMBIT, { id: 'f-mur', nom: 'Mur' });
  creades.desaCarpetaCreada(AMBIT, { id: 'f-festes', nom: 'Festes' });
  const localAbans = storage.getItem(CLAU_LOCAL);
  const port = portSql(pg, carpetaDeFila);
  const config = { dataMode: 'remote', tenantId: T };
  const diagnostic = [{ id: 'f-mur', motiu: AMBIGUA }];

  const primer = await migracio.migraCarpetesLocals({ scopeKey: AMBIT, entrada: 1, config }, A, { port });
  assert.deepEqual(primer, { estat: 'pendent', migrades: 3, pendents: 1, noMigrables: 0, ambigues: diagnostic });
  assert.equal(port.crides, 3);
  const files = (await pg.query('select id,nom from public.note_folders order by nom')).rows;
  assert.deepEqual(files.map((f) => f.nom).sort(), [UUID, 'Festes', 'Notes'].sort());
  const repliques = migracio.repliquesDeCarpetes(AMBIT);
  assert.deepEqual(repliques.map((r) => r.local), [`f-carpeta-${UUID}`, 'f-carpeta-notes', 'f-festes']);
  for (const r of repliques) {
    const fila = files.find((f) => f.id === r.remot);
    assert.ok(fila, `la rèplica ${r.local} apunta a una fila real`);
    assert.notEqual(r.remot, r.local);
  }
  /* Cap id local reescrit, i «Mur» no ha eixit cap a la xarxa. */
  assert.equal(storage.getItem(CLAU_LOCAL), localAbans);
  assert.equal(files.some((f) => f.nom === 'Mur'), false);

  /* Segon inici: cap crida ni fila noves; el diagnòstic continua. */
  const segon = await migracio.migraCarpetesLocals({ scopeKey: AMBIT, entrada: 2, config }, A, { port });
  assert.deepEqual(segon, { estat: 'pendent', migrades: 0, pendents: 1, noMigrables: 0, ambigues: diagnostic });
  assert.equal(port.crides, 3);
  assert.equal((await pg.query('select count(*)::int as n from public.note_folders')).rows[0].n, 3);
  /* La RPC viva és idempotent pel nom: «festes» torna la mateixa carpeta que la rèplica. */
  const mateixa = (await pg.query("select public.crea_carpeta_notes('festes',$1) as c", [T])).rows[0].c;
  assert.equal(mateixa.id, repliques.find((r) => r.local === 'f-festes').remot);
});

test('R32 · un error real de la RPC (poble aliè) para la pujada i ho conserva tot', async (t) => {
  const pg = await setup(t);
  const { storage, creades, migracio, carpetaDeFila } = await navegador(t);
  creades.desaCarpetaCreada(AMBIT, { id: 'f-festes', nom: 'Festes' });
  creades.desaCarpetaCreada(AMBIT, { id: 'f-hort', nom: 'Hort' });
  const localAbans = storage.getItem(CLAU_LOCAL);
  const port = portSql(pg, carpetaDeFila, U);
  const resultat = await migracio.migraCarpetesLocals({ scopeKey: AMBIT, entrada: 1, config: { dataMode: 'remote', tenantId: T } }, A, { port });
  assert.deepEqual(resultat, { estat: 'pendent', migrades: 0, pendents: 2, noMigrables: 0 });
  assert.equal(port.crides, 1);
  assert.equal((await pg.query('select count(*)::int as n from public.note_folders')).rows[0].n, 0);
  assert.equal(storage.getItem(CLAU_LOCAL), localAbans);
  assert.equal(storage.getItem(CLAU_REGISTRE), null);
});
