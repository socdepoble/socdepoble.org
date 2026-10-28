// @vitest-environment node
/* P1-13 (C11-03 i C11-05; auditoria Codex 261024_2254 i 261028_1611 C28-08;
   pla 261028_1526, §3.6.1) · Prova estàtica de la migració
   2610281730_membres_concurrents_i_correu_public.sql. Cap base de dades: es
   llig el SQL (patró de correuPropietaria.migracio.test.js i de
   titularPublic.migracio.test.js) i es comproven la capçalera (QUÈ CORREGIX,
   QUÈ FA, QUÈ NO FA, CODIS, Depén de, les consultes d'abans i de després, la
   recepta de les dues sessions i una sola línia «NO aplicada»), la
   transacció i la llista tancada de sentències; que desa_membre_organitzacio
   és la de 2610181915 amb tres canvis i cap més (el pany consultiu abans del
   `for update`, l'UPSERT guardat i el row_count que llança SDP-ORGMEM-006);
   la columna generada correu_public, el seu únic permís i la vista amb
   correu_public al final; el client (perfils.js, organizations.js i el kit
   de conformitat) i l'entrada de supabase/README.md. Les sondes del final
   proven que els detectors veuen una variant dolenta. La prova de veres amb
   dues sessions de PostgreSQL és del Mestre (la recepta, a la capçalera). */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

/* vitest s'executa des de l'arrel del repositori (com qualitat.test.js). */
const ARREL = process.cwd();
const MIGRACIONS = path.join(ARREL, 'supabase/migrations');
const NOM = '2610281730_membres_concurrents_i_correu_public.sql';
const MEMBRES = '2610181915_organitzacions_correu_i_membres.sql';
const VISTA = '2610081401_organitzacions_poble.sql';
const llig = (nom) => readFileSync(path.join(MIGRACIONS, nom), 'utf8');
const SQL = llig(NOM);
const LINIES = SQL.split('\n');
const CAPCALERA = SQL.slice(0, SQL.search(/^begin;/m));
const sensComentaris = (sql) => sql.split('\n').map((linia) => linia.replace(/--.*$/, '')).join('\n');
const CODI = sensComentaris(SQL);
const normal = (text) => text.replace(/\s+/g, ' ').trim().toLowerCase();
const sentencies = (sql) => sensComentaris(sql).replace(/\$\$[\s\S]*?\$\$/g, '$$$$').split(';').map(normal).filter(Boolean);

/** Cada funció: esquema, nom, paràmetres, capçalera (fins a «as $$») i cos, normalitzats. */
function funcions(codi) {
  const re = /create\s+(?:or\s+replace\s+)?function\s+(\w+)\.(\w+)\s*\(([^)]*)\)([\s\S]*?)\bas\s+\$(\w*)\$/gi;
  const eixida = [];
  let m;
  while ((m = re.exec(codi))) {
    const tanca = `$${m[5]}$`;
    const inici = re.lastIndex;
    const fi = codi.indexOf(tanca, inici);
    expect(fi, `cos sense tancar a ${m[1]}.${m[2]}`).toBeGreaterThan(inici);
    eixida.push({ esquema: m[1].toLowerCase(), nom: m[2].toLowerCase(), params: normal(m[3]), capcalera: normal(m[4]), cos: normal(codi.slice(inici, fi)) });
    re.lastIndex = fi + tanca.length;
  }
  return eixida;
}
const desaDe = (codi) => funcions(codi).find((f) => f.esquema === 'public' && f.nom === 'desa_membre_organitzacio') ?? null;
const DESA = desaDe(CODI);
const DESA_ORIGINAL = desaDe(sensComentaris(llig(MEMBRES)));

/** Les columnes de la vista organization_directory, en ordre (el parser de migracio-organitzacions-poble.test.mjs). */
function columnesDeLaVista(codi) {
  const vista = /create or replace view public\.organization_directory[^\n]*\nas\nselect\n([\s\S]*?)\nfrom public\.organizations\nwhere visibility = 'public';/i.exec(codi);
  return vista ? vista[1].split(',').map((c) => c.trim()).filter(Boolean) : null;
}

/* Els detectors de les sondes. */
const PANY = "perform pg_advisory_xact_lock(hashtextextended('sdp-orgmem:' || p_organization_id::text || ':' || p_membre_id::text, 0));";
const SELECT_AMB_PANY = 'select m.role into v_actual from public.organization_memberships m where m.organization_id = p_organization_id and m.user_id = p_membre_id for update;';
const UPSERT_ORIGINAL = 'insert into public.organization_memberships (organization_id, tenant_id, user_id, role) values (p_organization_id, v_tenant, p_membre_id, v_role) on conflict (organization_id, user_id) do update set role = excluded.role;';
const UPSERT_GUARDAT = 'insert into public.organization_memberships as actual (organization_id, tenant_id, user_id, role) values (p_organization_id, v_tenant, p_membre_id, v_role) '
  + "on conflict (organization_id, user_id) do update set role = excluded.role where actual.role <> 'owner' and (v_meu = 'owner' or (actual.role <> 'admin' and excluded.role <> 'admin')); "
  + 'get diagnostics v_n = row_count; '
  + "if v_n = 0 then raise exception 'sdp-orgmem-006: només la propietària nomena, degrada o lleva administradores.' using errcode = '42501'; end if;";
/** El pany consultiu del parell va just abans del `select … for update` de la persona. */
const teElPany = (cos) => cos.includes(`${PANY} ${SELECT_AMB_PANY}`);
/** L'UPSERT només escriu sobre una fila que no és d'owner (ni d'admin, si no ho fa la propietària), i 0 files és 006. */
const teLaGuarda = (cos) => cos.includes(UPSERT_GUARDAT) && !cos.includes(UPSERT_ORIGINAL);
const EXPRESSIO = "generated always as (case when public_email is true then nullif(btrim(contact_email), '') end) stored";
/* Com organitzacionsCorreu.migracio.test.js: un GRANT de taula sencera tornaria a exposar contact_email. */
const grantDeTaula = (s) => /^grant\b[^(]*\b(select|all)\b[^(]*\bon (?:(?:table )?(?:public\.)?organizations\b|all tables in schema public\b)/.test(s)
  && /\bto\b.*\b(anon|authenticated|public)\b/.test(s);
const grantsDe = (llista, columna) => llista.filter((s) => s.startsWith('grant')
  && new RegExp(`\\(([^)]*\\b${columna}\\b[^)]*)\\)`).test(s) && /\bto\b.*\b(anon|authenticated|public)\b/.test(s));
const PRIVADES = ['contact_email', 'public_email', 'created_by', 'visibility'];
const vistaSegura = (columnes) => Array.isArray(columnes) && !columnes.some((c) => PRIVADES.includes(c));

describe('P1-13 · la migració: nom, capçalera i transacció', () => {
  test('el nom segueix el format i va després de totes les migracions de què depén', () => {
    expect(NOM).toMatch(/^\d{10}_[a-z0-9_]+\.sql$/);
    const ordre = readdirSync(MIGRACIONS).filter((f) => f.endsWith('.sql')).sort();
    for (const anterior of [VISTA, MEMBRES, '2610211715_revoca_correu_organitzacions.sql', '2610242320_correu_propietaria_nomes_titular.sql', '2610250300_titular_public.sql']) {
      expect(ordre.indexOf(anterior), anterior).toBeGreaterThanOrEqual(0);
      expect(ordre.indexOf(NOM), anterior).toBeGreaterThan(ordre.indexOf(anterior));
    }
  });

  test('la capçalera: procedència, QUÈ CORREGIX, QUÈ FA, QUÈ NO FA, CODIS, Depén de i UNA sola línia NO aplicada', () => {
    expect(SQL).toMatch(/^-- =+\n-- 261028_1730 · P1-13 \(C11-03 i C11-05; auditoria Codex 261024_2254 i\n-- 261028_1611 C28-08; pla 261028_1526, §3\.6\.1\)/);
    for (const apartat of [/^-- QUÈ CORREGIX:$/m, /^-- QUÈ FA:$/m, /^-- QUÈ NO FA:$/m, /^-- CODIS: cap de nou\. Reutilitza SDP-ORGMEM-006/m, /^-- Depén de: 2610081401/m]) {
      expect(CAPCALERA).toMatch(apartat);
    }
    expect(CAPCALERA).toMatch(/C11-03 · /);
    expect(CAPCALERA).toMatch(/C11-05 · /);
    expect(LINIES.filter((l) => /^-- NO aplicada: l'aplica el Mestre, mai un agent\.$/.test(l))).toHaveLength(1);
    expect(LINIES.filter((l) => /NO aplicada/i.test(l))).toHaveLength(1);
    expect(CAPCALERA).toMatch(/Idempotent \(ADD COLUMN IF NOT EXISTS, CREATE OR REPLACE amb la mateixa\n-- signatura\) i en una sola transacció/);
    for (const depen of ['2610181915', '2610211715', '2610242320', '2610250300']) expect(CAPCALERA.slice(CAPCALERA.indexOf('-- Depén de:')), depen).toContain(depen);
  });

  test('les consultes de lectura d’abans i de després, a la capçalera', () => {
    expect(CAPCALERA).toMatch(/^-- ABANS D'APLICAR-LA \(lectura; el resultat s'ha de guardar\):$/m);
    expect(CAPCALERA).toMatch(/--\s+select column_name from information_schema\.columns\n--\s+where table_schema = 'public' and table_name = 'organization_directory'\n--\s+order by ordinal_position;/);
    expect(CAPCALERA).toMatch(/les 15 columnes de 2610081401, acabades en town_name/);
    expect(CAPCALERA).toMatch(/^-- DESPRÉS D'APLICAR-LA \(lectura\):$/m);
    expect(CAPCALERA).toContain("has_column_privilege(r.rolname, 'public.organizations', 'contact_email', 'select') as privat");
    expect(CAPCALERA).toContain("has_column_privilege(r.rolname, 'public.organizations', 'correu_public', 'select') as public");
    expect(CAPCALERA).toContain('select count(*) from public.organizations where public_email is not true and correu_public is not null;');
  });

  test('la recepta manual de les dues sessions: la propietària confirma, l’administradora rep 006 i X continua admin', () => {
    const recepta = CAPCALERA.slice(CAPCALERA.indexOf('-- VERIFICACIÓ MANUAL AMB DUES SESSIONS'));
    expect(recepta.length).toBeGreaterThan(200);
    expect(recepta).toMatch(/mai en\n-- la de producció/);
    expect(recepta).toMatch(/Sessió 1: begin;/);
    expect(recepta).toMatch(/Sessió 2: begin;/);
    expect(recepta).toContain("desa_membre_organitzacio('<G>', '<X>', 'persona', 'admin')");
    expect(recepta).toContain("desa_membre_organitzacio('<G>', '<X>', 'persona', 'member')");
    expect(recepta).toMatch(/Sessió 1: commit;/);
    expect(recepta).toMatch(/Sessió 2: falla amb SDP-ORGMEM-006 \(42501\); rollback;/);
    expect(recepta).toMatch(/ha de tornar admin/);
  });

  test('una sola transacció, amb la llista tancada de sentències i res més', () => {
    expect(sentencies(SQL)).toEqual([
      'begin',
      "set local lock_timeout = '5s'",
      "set local statement_timeout = '60s'",
      "create or replace function public.desa_membre_organitzacio( p_organization_id uuid, p_membre_id uuid, p_tipus text, p_role text default 'member' ) "
        + "returns table (tipus text, membre_id uuid, nom text, avatar_url text, role text, created_at timestamptz) language plpgsql volatile security definer set search_path = '' as $$",
      'revoke execute on function public.desa_membre_organitzacio(uuid, uuid, text, text) from public, anon',
      'grant execute on function public.desa_membre_organitzacio(uuid, uuid, text, text) to authenticated',
      `alter table public.organizations add column if not exists correu_public text ${EXPRESSIO}`,
      'grant select (correu_public) on table public.organizations to anon, authenticated',
      expect.stringMatching(/^create or replace view public\.organization_directory with \(security_invoker = true, security_barrier = true\) as select id, /),
      'revoke all on table public.organization_directory from public, anon, authenticated',
      'grant select on table public.organization_directory to anon, authenticated',
      "notify pgrst, 'reload schema'",
      'commit'
    ]);
    expect(CODI).toMatch(/notify pgrst, 'reload schema';\s*commit;\s*$/);
    expect(SQL.endsWith(';\n') && !SQL.endsWith('\n\n')).toBe(true);
  });
});

describe('C11-03 · desa_membre_organitzacio sense carrera', () => {
  test('la mateixa signatura, la mateixa capçalera i el mateix retorn que 2610181915', () => {
    expect(DESA).not.toBeNull();
    expect(DESA_ORIGINAL).not.toBeNull();
    expect(funcions(CODI).map((f) => `${f.esquema}.${f.nom}`)).toEqual(['public.desa_membre_organitzacio']);
    expect(DESA.params).toBe("p_organization_id uuid, p_membre_id uuid, p_tipus text, p_role text default 'member'");
    expect(DESA.capcalera).toBe(DESA_ORIGINAL.capcalera);
    expect(DESA.capcalera).toBe("returns table (tipus text, membre_id uuid, nom text, avatar_url text, role text, created_at timestamptz) language plpgsql volatile security definer set search_path = ''");
    expect(DESA.cos.startsWith('#variable_conflict use_column declare ')).toBe(true);
  });

  test('el cos és el de 2610181915 amb tres canvis i cap més: v_n, el pany i l’UPSERT guardat', () => {
    const esperat = DESA_ORIGINAL.cos
      .replace('v_actual text; begin', 'v_actual text; v_n integer := 0; begin')
      .replace(SELECT_AMB_PANY, `${PANY} ${SELECT_AMB_PANY}`)
      .replace(UPSERT_ORIGINAL, UPSERT_GUARDAT);
    expect(esperat).not.toBe(DESA_ORIGINAL.cos);
    expect(DESA.cos).toBe(esperat);
  });

  test('el pany consultiu del parell (organització, persona) va després de les comprovacions i just abans del for update', () => {
    expect(teElPany(DESA.cos)).toBe(true);
    const pany = DESA.cos.indexOf(PANY);
    for (const codi of ['000', '001', '002', '003', '004']) expect(DESA.cos.indexOf(`sdp-orgmem-${codi}`), codi).toBeLessThan(pany);
    expect(pany).toBeLessThan(DESA.cos.indexOf('sdp-orgmem-005'));
    expect(DESA.cos.match(/pg_advisory_xact_lock/g)).toHaveLength(1);
    /* El pany és de transacció: mai un pg_advisory_lock de sessió que caldria alliberar a mà. */
    expect(DESA.cos).not.toMatch(/pg_advisory_lock\(|pg_advisory_unlock/);
  });

  test('l’UPSERT mai escriu sobre una owner ni sobre o cap a admin sense la propietària, i 0 files és SDP-ORGMEM-006', () => {
    expect(teLaGuarda(DESA.cos)).toBe(true);
    const insercio = DESA.cos.indexOf('insert into public.organization_memberships as actual');
    const diagnostic = DESA.cos.indexOf('get diagnostics v_n = row_count;');
    expect(insercio).toBeGreaterThan(DESA.cos.indexOf(PANY));
    expect(diagnostic).toBeGreaterThan(insercio);
    expect(DESA.cos.slice(diagnostic)).toMatch(/^get diagnostics v_n = row_count; if v_n = 0 then raise exception 'sdp-orgmem-006: [^']+' using errcode = '42501'; end if;/);
    /* La branca d'organitzacions membres, igual que abans. */
    expect(DESA.cos).toContain('on conflict (organization_id, member_organization_id) do nothing;');
  });

  test('els mateixos permisos d’execució: revoke a public i anon abans del grant a authenticated', () => {
    const ss = sentencies(SQL);
    const revoke = ss.indexOf('revoke execute on function public.desa_membre_organitzacio(uuid, uuid, text, text) from public, anon');
    const grant = ss.indexOf('grant execute on function public.desa_membre_organitzacio(uuid, uuid, text, text) to authenticated');
    expect(revoke).toBeGreaterThan(0);
    expect(grant).toBe(revoke + 1);
    expect(ss.filter((s) => /^grant execute\b/.test(s) && /\bto\b.*\b(anon|public)\b/.test(s))).toEqual([]);
  });
});

describe('C11-05 · el correu triat, en una columna generada i al directori', () => {
  const ss = sentencies(SQL);

  test('la columna generada només porta el correu si public_email és true, i ningú no la pot escriure', () => {
    expect(ss).toContain(`alter table public.organizations add column if not exists correu_public text ${EXPRESSIO}`);
    expect(ss.filter((s) => /\bcorreu_public\b/.test(s) && /^(grant|revoke)\b/.test(s))).toEqual([
      'grant select (correu_public) on table public.organizations to anon, authenticated'
    ]);
  });

  test('cap permís de contact_email ni de taula sencera; cap escriptura nova', () => {
    expect(grantsDe(ss, 'contact_email')).toEqual([]);
    expect(ss.filter(grantDeTaula)).toEqual([]);
    expect(ss.filter((s) => /^grant (insert|update|delete|all)\b/.test(s))).toEqual([]);
  });

  test('la vista és la de 2610081401 amb correu_public al final, sense cap columna privada, i amb els mateixos permisos', () => {
    const anteriors = columnesDeLaVista(sensComentaris(llig(VISTA)));
    expect(anteriors).toHaveLength(15);
    expect(anteriors.at(-1)).toBe('town_name');
    const columnes = columnesDeLaVista(CODI);
    expect(columnes).toEqual([...anteriors, 'correu_public']);
    expect(vistaSegura(columnes)).toBe(true);
    expect(CODI).toMatch(/create or replace view public\.organization_directory with \(security_invoker = true, security_barrier = true\)/);
    expect(CODI).toMatch(/revoke all on table public\.organization_directory from public, anon, authenticated;\s*grant select on table public\.organization_directory to anon, authenticated;/);
  });

  test('el client llig correu_public i mai el booleà; el llistat del directori i el kit no hi deixen passar cap correu', () => {
    const perfils = readFileSync(path.join(ARREL, 'src/data/supabase/perfils.js'), 'utf8');
    /* Sense comentaris de JavaScript: es comprova el codi, no la prosa que l'explica. */
    const fitxa = perfils.slice(perfils.indexOf('export function perfilDOrganitzacio'), perfils.indexOf('export function perfilDePersona'))
      .replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/.*$/gm, ' ');
    expect(fitxa).toMatch(/correu: text\(org\.correu_public\)/);
    expect(fitxa).not.toMatch(/public_email|contact_email/);
    const organitzacions = readFileSync(path.join(ARREL, 'src/data/supabase/organizations.js'), 'utf8');
    const directori = /const COLUMNES_DIRECTORI = Object\.freeze\(\[([\s\S]*?)\]\);/.exec(organitzacions)?.[1] ?? '';
    expect(directori).toMatch(/'town_name'/);
    expect(directori).not.toMatch(/correu|mail/);
    const kit = readFileSync(path.join(ARREL, 'src/data/conformitat/kit.js'), 'utf8');
    expect(kit).toMatch(/\['contact_email', 'public_email', 'correu_public', 'email', 'correu'\]\.some\(/);
  });
});

describe('P1-13 · el catàleg i les sondes', () => {
  test('l’entrada de supabase/README.md: després de 2610250300, abans de seed.sql, C11-03 i C11-05, NO aplicada', () => {
    const readme = readFileSync(path.join(ARREL, 'supabase/README.md'), 'utf8');
    const posicio = readme.indexOf(`migrations/${NOM}`);
    expect(posicio, 'falta l’entrada al README').toBeGreaterThanOrEqual(0);
    expect(posicio).toBeGreaterThan(readme.indexOf('migrations/2610250300_titular_public.sql'));
    expect(posicio).toBeLessThan(readme.indexOf('- `seed.sql`'));
    const entrada = readme.slice(posicio).split('\n\n')[0];
    for (const text of ['**C11-03**', '**C11-05**', '`SDP-ORGMEM-006`', '`public.organizations.correu_public`', '`COLUMNES_DIRECTORI`',
      'pg_advisory_xact_lock', 'src/data/supabase/membresConcurrents.migracio.test.js', "**NO aplicada: l'aplica el Mestre, mai un agent**"]) {
      expect(entrada, text).toContain(text);
    }
    expect(entrada).toMatch(/dues sessions/);
  });

  test('la sonda: els detectors veuen la carrera, l’UPSERT sense guarda, el correu privat a la vista i el permís dolent', () => {
    /* Sense el pany, el cos ja no és segur. */
    const sensePany = desaDe(sensComentaris(SQL.replace(/^\s*perform pg_advisory_xact_lock\(.*\n/m, '')));
    expect(teElPany(sensePany.cos)).toBe(false);
    /* El pany després del for update no ordena res. */
    const panyTard = desaDe(sensComentaris(SQL.replace(/^(\s*perform pg_advisory_xact_lock\(.*\n)([\s\S]*?for update;\n)/m, '$2$1')));
    expect(teElPany(panyTard.cos)).toBe(false);
    /* L'UPSERT d'abans (sense WHERE ni row_count) torna la carrera. */
    expect(teLaGuarda(DESA_ORIGINAL.cos)).toBe(false);
    const senseWhere = desaDe(sensComentaris(SQL.replace(/\n\s*where actual\.role <> 'owner'\n[^\n]*\n/, ';\n')));
    expect(teLaGuarda(senseWhere.cos)).toBe(false);
    /* Una vista que projecta el correu privat, o una columna privada qualsevol. */
    expect(vistaSegura(columnesDeLaVista(CODI.replace('  town_name,\n  correu_public\n', '  town_name,\n  contact_email\n')))).toBe(false);
    expect(vistaSegura(columnesDeLaVista(CODI.replace('  town_name,\n  correu_public\n', '  town_name,\n  public_email\n')))).toBe(false);
    expect(vistaSegura(null)).toBe(false);
    /* El permís de la columna privada o de la taula sencera. */
    expect(grantsDe(['grant select (correu_public, contact_email) on table public.organizations to anon'], 'contact_email')).toHaveLength(1);
    expect(['grant select on table public.organizations to anon', 'grant all on table public.organizations to authenticated'].filter(grantDeTaula)).toHaveLength(2);
  });

  test('higiene: cap vocabulari prohibit', () => {
    expect(SQL).not.toMatch(/offline[- ]first|local[- ]first/i);
  });
});
