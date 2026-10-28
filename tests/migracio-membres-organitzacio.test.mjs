// Prova estàtica de la migració 261008_1402 (ordre del Mestre, 261008, grup C:
// els membres d'una organització). No hi ha cap base de dades: es llig el SQL i
// es comproven la taula de les organitzacions membres (mateix poble, RLS,
// només lectura), les tres RPC (forma, permisos, guarda de sessió i les regles
// de les decisions del Mestre), els codis SDP-ORGMEM-000..008, que cap
// permís s'hereta, i que l'adaptador del client crida les mateixes RPC amb
// els mateixos paràmetres. S'executa amb `node --test`.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NOM = '2610081402_membres_organitzacio.sql';
/* P1-13 · C11-03 (261028) · La correcció de la carrera de l'alta concurrent. */
const MEMBRES_CONCURRENTS = '2610281730_membres_concurrents_i_correu_public.sql';
const MIGRACIONS = path.join(ARREL, 'supabase/migrations');
const SQL = fs.readFileSync(path.join(MIGRACIONS, NOM), 'utf8');
const CLIENT = fs.readFileSync(path.join(ARREL, 'src/data/supabase/organizations.js'), 'utf8');
// Sense comentaris de línia: es comprova el codi, no la prosa.
const senseComentaris = (sql) => sql.split('\n').map((linia) => linia.replace(/--.*$/, '')).join('\n');
const CODI = senseComentaris(SQL);
const SENSE_ESPAIS = (text) => text.replace(/\s+/g, ' ').trim().toLowerCase();

/** Cada funció: esquema, nom, paràmetres, capçalera (fins a «as $$») i cos. */
function funcions(sql) {
  const re = /create\s+(?:or\s+replace\s+)?function\s+(\w+)\.(\w+)\s*\(([^)]*)\)([\s\S]*?)\bas\s+\$(\w*)\$/gi;
  const eixida = [];
  let m;
  while ((m = re.exec(sql))) {
    const tanca = `$${m[5]}$`;
    const inici = re.lastIndex;
    const fi = sql.indexOf(tanca, inici);
    assert.ok(fi > inici, `cos sense tancar a ${m[1]}.${m[2]}`);
    eixida.push({ esquema: m[1].toLowerCase(), nom: m[2].toLowerCase(), params: SENSE_ESPAIS(m[3]), capcalera: m[4], cos: sql.slice(inici, fi) });
    re.lastIndex = fi + tanca.length;
  }
  return eixida;
}
const FUNCIONS = funcions(CODI);
const funcio = (nom) => FUNCIONS.find((f) => f.esquema === 'public' && f.nom === nom);
const LLISTA = funcio('membres_organitzacio');
const DESA = funcio('desa_membre_organitzacio');
const LLEVA = funcio('lleva_membre_organitzacio');
const COLUMNES_MEMBRE = ['tipus text', 'membre_id uuid', 'nom text', 'avatar_url text', 'role text', 'created_at timestamptz'];
const columnesDeRetorn = (f) => /returns\s+table\s*\(([\s\S]*?)\)\s*language/i.exec(f.capcalera)?.[1]
  .split(',').map((c) => SENSE_ESPAIS(c)) ?? [];

test('el nom segueix el format de les migracions i va després de 2610081401 i de 2610072230', () => {
  assert.match(NOM, /^\d{10}_[a-z0-9_]+\.sql$/);
  const ordre = fs.readdirSync(MIGRACIONS).filter((f) => f.endsWith('.sql')).sort();
  assert.ok(ordre.indexOf(NOM) > ordre.indexOf('2610072230_mur_imatges_propies.sql'));
  assert.ok(ordre.indexOf(NOM) > ordre.indexOf('2610081401_organitzacions_poble.sql'));
});

test('la capçalera diu què fa, les decisions del Mestre, que NO està aplicada i que va ABANS del client', () => {
  assert.match(SQL, /^-- =+\n-- 261008_1402 · /);
  assert.match(SQL, /NO aplicada/);
  assert.match(SQL, /ABANS de publicar el client/);
  assert.match(SQL, /NO hereta cap permís/);
});

test('una sola transacció amb temps d’espera curts, i recarrega l’esquema de PostgREST abans del commit', () => {
  assert.match(CODI.trimStart(), /^begin;/i);
  assert.equal((CODI.match(/^\s*begin;\s*$/gim) || []).length, 1);
  assert.equal((CODI.match(/^\s*commit;\s*$/gim) || []).length, 1);
  assert.match(CODI, /begin;\s*set local lock_timeout = '5s';\s*set local statement_timeout = '60s';/i);
  assert.match(CODI, /notify pgrst, 'reload schema';\s*commit;\s*$/i);
});

/* ── La taula ── */
const TAULA = /create table if not exists public\.organization_member_organizations \(([\s\S]*?)\n\);/i.exec(CODI)?.[1] ?? '';

test('taula: mateix poble per claus foranes compostes en cascada, i mai ella mateixa', () => {
  assert.ok(TAULA, 'falta la taula organization_member_organizations');
  const taula = SENSE_ESPAIS(TAULA);
  assert.match(taula, /foreign key \(tenant_id, organization_id\) references public\.organizations \(tenant_id, id\) on delete cascade/);
  assert.match(taula, /foreign key \(tenant_id, member_organization_id\) references public\.organizations \(tenant_id, id\) on delete cascade/);
  assert.match(taula, /check \(organization_id <> member_organization_id\)/);
  assert.match(taula, /primary key \(organization_id, member_organization_id\)/);
  // Qui l'ha afegida: si la persona s'esborra, la fila no bloqueja la purga.
  assert.match(taula, /created_by uuid references auth\.users \(id\) on delete set null/);
  assert.doesNotMatch(taula, /\brole\b/);
  assert.match(CODI, /create index if not exists \w+\s+on public\.organization_member_organizations \(tenant_id, member_organization_id\);/i);
});

test('taula: RLS activa, revoke all i només SELECT per a qui administra alguna de les dues', () => {
  assert.match(CODI, /alter table public\.organization_member_organizations enable row level security;/i);
  assert.match(CODI, /revoke all on table public\.organization_member_organizations from public, anon, authenticated;/i);
  assert.match(CODI, /grant select on table public\.organization_member_organizations to authenticated;/i);
  assert.doesNotMatch(CODI, /grant (insert|update|delete|all)[^;]*organization_member_organizations/i);
  const politiques = [...CODI.matchAll(/create policy "[^"]+" on public\.organization_member_organizations\s+for (\w+) to (\w+)\s+using \(([\s\S]*?)\n\);/gi)];
  assert.equal(politiques.length, 1);
  const [, accio, rol, condicio] = politiques[0];
  assert.equal(accio.toLowerCase(), 'select');
  assert.equal(rol.toLowerCase(), 'authenticated');
  assert.equal(SENSE_ESPAIS(condicio),
    '(select private.can_manage_organization(organization_id)) or (select private.can_manage_organization(member_organization_id))');
  assert.doesNotMatch(CODI, /using\s*\(\s*true\s*\)/i);
});

test('cap permís s’hereta: només les tres RPC accedixen a la taula, també en la consolidació posterior', () => {
  assert.equal(FUNCIONS.length, 3);
  assert.ok(FUNCIONS.every((f) => f.esquema === 'public'), 'cap funció de private (permisos) es toca');
  for (const permis of ['can_manage_organization', 'is_organization_member', 'can_create_group', 'pot_signar_com_organitzacio']) {
    assert.doesNotMatch(CODI, new RegExp(`function\\s+\\w+\\.${permis}\\b`, 'i'));
  }
  // La consolidació de correu i membres repetix el bloc complet sense canvis.
  // Validem també taula, RLS, cossos i grants; no excloem el fitxer de l'auditoria.
  const iniciBloc = 'create table if not exists public.organization_member_organizations';
  const finalBloc = "notify pgrst, 'reload schema';";
  const blocOriginal = CODI.slice(CODI.indexOf(iniciBloc), CODI.indexOf(finalBloc));
  const normalitzaBloc = (sql) => sql.replace(/\s+/g, ' ').trim();
  for (const fitxer of fs.readdirSync(MIGRACIONS).filter((f) => f.endsWith('.sql') && f !== NOM)) {
    const codi = senseComentaris(fs.readFileSync(path.join(MIGRACIONS, fitxer), 'utf8'));
    if (fitxer === '2610181915_organitzacions_correu_i_membres.sql') {
      const inici = codi.indexOf(iniciBloc), fi = codi.indexOf(finalBloc);
      assert.ok(inici >= 0 && fi > inici, `${fitxer}: falta el bloc consolidat`);
      assert.equal(normalitzaBloc(codi.slice(inici, fi)), normalitzaBloc(blocOriginal),
        `${fitxer}: el bloc de membres ha de conservar taula, RLS, RPC i permisos`);
      assert.doesNotMatch(codi.slice(0, inici) + codi.slice(fi), /organization_member_organizations/i,
        `${fitxer}: cap altre accés a la taula fora del bloc consolidat`);
    } else if (fitxer === MEMBRES_CONCURRENTS) {
      /* Actualitzada a posta (P1-13 · C11-03, 261028): la migració torna a crear
         desa_membre_organitzacio (i cap altra funció), i la seua branca
         d'organitzacions hi escriu exactament com la d'ací. Cap altre accés. */
      const desa = funcions(codi).filter((f) => f.esquema === 'public' && f.nom === 'desa_membre_organitzacio');
      assert.deepEqual(funcions(codi).map((f) => `${f.esquema}.${f.nom}`), ['public.desa_membre_organitzacio'], fitxer);
      assert.equal((codi.match(/organization_member_organizations/gi) || []).length, 1, `${fitxer}: un sol accés a la taula`);
      const insercio = (cos) => SENSE_ESPAIS(/insert into public\.organization_member_organizations[^;]*;/i.exec(cos)?.[0] ?? '');
      assert.ok(insercio(DESA.cos), 'falta la inserció de l’original');
      assert.equal(insercio(desa[0].cos), insercio(DESA.cos), `${fitxer}: la branca d’organitzacions no canvia`);
    } else {
      assert.doesNotMatch(codi, /organization_member_organizations/i, fitxer);
    }
  }
});

/* ── Les RPC ── */
test('forma: les tres RPC, security definer, search_path buit, i la mateixa fila de membre', () => {
  assert.ok(LLISTA && DESA && LLEVA, 'falten RPC');
  assert.equal(LLISTA.params, 'p_organization_id uuid');
  assert.equal(DESA.params, "p_organization_id uuid, p_membre_id uuid, p_tipus text, p_role text default 'member'");
  assert.equal(LLEVA.params, 'p_organization_id uuid, p_membre_id uuid, p_tipus text');
  for (const f of [LLISTA, DESA, LLEVA]) {
    assert.match(f.capcalera, /security\s+definer/i, f.nom);
    assert.match(f.capcalera, /set\s+search_path\s*=\s*''/i, f.nom);
  }
  assert.match(LLISTA.capcalera, /\bstable\b/i);
  assert.match(DESA.capcalera, /\bvolatile\b/i);
  assert.match(LLEVA.capcalera, /returns boolean\s+language plpgsql\s+volatile/i);
  assert.deepEqual(columnesDeRetorn(LLISTA), COLUMNES_MEMBRE);
  assert.deepEqual(columnesDeRetorn(DESA), COLUMNES_MEMBRE);
  assert.doesNotMatch(CODI, /set\s+search_path\s*=\s*public/i);
});

test('permisos: revoke a public i anon, grant només a authenticated, el revoke abans del grant', () => {
  for (const firma of ['membres_organitzacio(uuid)', 'desa_membre_organitzacio(uuid, uuid, text, text)', 'lleva_membre_organitzacio(uuid, uuid, text)']) {
    const escapada = firma.replace(/[()]/g, '\\$&');
    const revoke = CODI.search(new RegExp(`revoke execute on function public\\.${escapada} from public, anon;`, 'i'));
    const grant = CODI.search(new RegExp(`grant execute on function public\\.${escapada} to authenticated;`, 'i'));
    assert.ok(revoke > 0 && grant > revoke, firma);
  }
  assert.doesNotMatch(CODI, /grant execute on function[^;]*\bto\b[^;]*\b(anon|public)\s*;/i);
});

test('guarda de sessió: cada RPC llança SDP-ORGMEM-000 abans de llegir res', () => {
  for (const f of [LLISTA, DESA, LLEVA]) {
    assert.match(f.cos, /v_jo\s+uuid := \(select auth\.uid\(\)\);/i, f.nom);
    const guarda = f.cos.search(/if v_jo is null then\s+raise exception 'SDP-ORGMEM-000:[^']*' using errcode = '42501';/i);
    assert.ok(guarda >= 0, `${f.nom}: falta la guarda`);
    const primeraLectura = f.cos.search(/\b(from|into|insert|delete|update)\s+public\./i);
    assert.ok(guarda < primeraLectura, `${f.nom}: la guarda va abans de cap lectura`);
  }
});

test('la llista només la veuen owner i admin: can_manage_organization abans de la consulta', () => {
  const permis = LLISTA.cos.search(/not private\.can_manage_organization\(p_organization_id\) then\s+raise exception 'SDP-ORGMEM-002:/i);
  assert.ok(permis > 0 && permis < LLISTA.cos.search(/return query/i));
  assert.match(LLISTA.cos, /from public\.organization_memberships m\s+join public\.profiles pr on pr\.id = m\.user_id/i);
  assert.match(LLISTA.cos, /from public\.organization_member_organizations mo\s+join public\.organizations o on o\.id = mo\.member_organization_id and o\.tenant_id = mo\.tenant_id/i);
  // Cap dada sensible d'una persona: ni correu, ni consentiment, ni metadades.
  assert.doesNotMatch(LLISTA.cos, /\b(email|consentiment_rgpd_at|raw_user_meta_data|auth\.users)\b/i);
});

test('desa · persona: rol member o admin, mai owner; del poble, sense baixa; no un mateix', () => {
  assert.match(DESA.cos, /v_role not in \('member', 'admin'\)/i);
  assert.match(DESA.cos, /\(v_tipus = 'organitzacio' and v_role <> 'member'\)/i);
  assert.match(DESA.cos, /raise exception 'SDP-ORGMEM-001:/i);
  assert.doesNotMatch(DESA.cos, /'owner'\s*\)\s*on conflict/i);
  assert.match(DESA.cos, /if p_membre_id = v_jo then\s+raise exception 'SDP-ORGMEM-004:/i);
  assert.match(DESA.cos, /join public\.town_memberships tm on tm\.user_id = pr\.id and tm\.town_id = v_tenant\s+where pr\.id = p_membre_id and pr\.baixa_demanada_at is null/i);
  assert.match(DESA.cos, /raise exception 'SDP-ORGMEM-003:/i);
  // El permís de gestora, abans de qualsevol escriptura.
  assert.ok(DESA.cos.search(/not private\.can_manage_organization\(p_organization_id\) then\s+raise exception 'SDP-ORGMEM-002:/i)
    < DESA.cos.search(/insert into public\./i));
});

test('desa · la propietària és intocable i només ella nomena o degrada administradores', () => {
  assert.match(DESA.cos, /if v_actual = 'owner' then\s+raise exception 'SDP-ORGMEM-005:/i);
  assert.match(DESA.cos, /if \(v_role = 'admin' or v_actual = 'admin'\) and v_meu is distinct from 'owner' then\s+raise exception 'SDP-ORGMEM-006:/i);
  assert.match(DESA.cos, /on conflict \(organization_id, user_id\) do update set role = excluded\.role;/i);
  // L'escriptura de la persona va després de les tres comprovacions.
  const escriu = DESA.cos.search(/insert into public\.organization_memberships/i);
  for (const codi of ['003', '004', '005', '006']) assert.ok(DESA.cos.search(new RegExp(`SDP-ORGMEM-${codi}`)) < escriu, codi);
});

test('desa · organització: només member, del mateix poble, no ella mateixa, i qui crida l’administra també', () => {
  assert.match(DESA.cos, /if p_membre_id = p_organization_id or not exists \(\s*select 1 from public\.organizations o where o\.id = p_membre_id and o\.tenant_id = v_tenant\s*\) then\s+raise exception 'SDP-ORGMEM-007:/i);
  assert.match(DESA.cos, /if not private\.can_manage_organization\(p_membre_id\) then\s+raise exception 'SDP-ORGMEM-008:/i);
  assert.match(DESA.cos, /on conflict \(organization_id, member_organization_id\) do nothing;/i);
  assert.ok(DESA.cos.search(/SDP-ORGMEM-008/) < DESA.cos.search(/insert into public\.organization_member_organizations/i));
});

test('lleva · eixida pròpia de qualsevol no-propietària, abans del permís de gestora; idempotent', () => {
  const eixida = LLEVA.cos.search(/if v_tipus = 'persona' and p_membre_id = v_jo then/i);
  const gestora = LLEVA.cos.search(/not private\.can_manage_organization\(p_organization_id\) then\s+raise exception 'SDP-ORGMEM-002:/i);
  assert.ok(eixida > 0 && eixida < gestora, 'l’eixida pròpia no demana ser gestora');
  const tram = LLEVA.cos.slice(eixida, gestora);
  assert.match(tram, /if not found then\s+return false;/i);
  assert.match(tram, /if v_actual = 'owner' then\s+raise exception 'SDP-ORGMEM-005:/i);
  // Idempotent: qui no hi és torna false, mai un error.
  assert.equal((LLEVA.cos.match(/if not found then\s+return false;/gi) || []).length, 2);
  assert.match(LLEVA.cos, /return v_n > 0;\s*end;\s*$/i);
});

test('lleva · la propietària no es lleva i una admin només la lleva la propietària', () => {
  const persona = LLEVA.cos.slice(LLEVA.cos.search(/SDP-ORGMEM-002/));
  assert.match(persona, /if v_actual = 'owner' then\s+raise exception 'SDP-ORGMEM-005:/i);
  assert.match(persona, /if v_actual = 'admin' and v_meu is distinct from 'owner' then\s+raise exception 'SDP-ORGMEM-006:/i);
  assert.ok(persona.search(/SDP-ORGMEM-006/) < persona.search(/delete from public\.organization_memberships/i));
});

test('els codis: SDP-ORGMEM-000 a 008, tots presents i amb missatge en valencià', () => {
  const codis = new Set([...CODI.matchAll(/'(SDP-ORGMEM-\d{3}): [^']+'/g)].map((m) => m[1]));
  assert.deepEqual([...codis].sort(), Array.from({ length: 9 }, (_, i) => `SDP-ORGMEM-00${i}`));
  assert.doesNotMatch(CODI, /SDP-ORGMEM-(0(09|[1-9]\d)|[1-9]\d\d)/);
});

test('el client crida les tres RPC amb els mateixos paràmetres i llig columnes que tornen', () => {
  assert.match(CLIENT, /'\/rest\/v1\/rpc\/membres_organitzacio'/);
  assert.match(CLIENT, /'\/rest\/v1\/rpc\/desa_membre_organitzacio'/);
  assert.match(CLIENT, /'\/rest\/v1\/rpc\/lleva_membre_organitzacio'/);
  assert.match(CLIENT, /p_organization_id: id, p_membre_id: membreId, p_tipus: membre\.tipus, p_role: membre\.rol/);
  assert.match(CLIENT, /p_organization_id: id, p_membre_id: membreId, p_tipus: membre\.tipus \}/);
  const mapatge = CLIENT.slice(CLIENT.indexOf('function membreDeFila'), CLIENT.indexOf('function membreDeFila') + 900);
  const llegides = new Set([...mapatge.matchAll(/fila\.(\w+)/g)].map((m) => m[1]));
  const tornades = new Set(COLUMNES_MEMBRE.map((c) => c.split(' ')[0]));
  assert.deepEqual([...llegides].filter((c) => !tornades.has(c)), []);
  // Els codis que el client tradueix (una sola taula, contracte.js) són els del servidor, ni un més.
  const contracte = fs.readFileSync(path.join(ARREL, 'src/data/contracte.js'), 'utf8');
  const taula = /export const MISSATGES_MEMBRES_ORGANITZACIO = Object\.freeze\(\{([\s\S]*?)\}\);/.exec(contracte)?.[1] ?? '';
  assert.deepEqual([...taula.matchAll(/'(SDP-ORGMEM-\d{3})'/g)].map((m) => m[1]),
    Array.from({ length: 9 }, (_, i) => `SDP-ORGMEM-00${i}`));
});

test('el catàleg supabase/README.md la nomena després de 2610081401 i diu que va abans del client', () => {
  const readme = fs.readFileSync(path.join(ARREL, 'supabase/README.md'), 'utf8');
  const nom = `migrations/${NOM}`;
  assert.ok(readme.includes(nom), 'falta l’entrada al README');
  assert.ok(readme.indexOf(nom) > readme.indexOf('migrations/2610081401_organitzacions_poble.sql'));
  const entrada = readme.slice(readme.indexOf(nom)).split('\n\n')[0];
  assert.match(entrada, /abans de publicar el client/i);
  assert.match(entrada, /no aplicada/i);
});
