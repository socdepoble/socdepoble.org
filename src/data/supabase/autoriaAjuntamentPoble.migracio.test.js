// @vitest-environment node
/* D-6 (informe 261101_0409; assalt 261101_1246, carril T7 · S1) · Prova
   estàtica de la migració 2611011500_autoria_ajuntament_mateix_poble.sql: un
   ajuntament (kind 'city_hall') només signa publicacions del seu poble
   (tenant_id). No hi ha cap base de dades: es llig el SQL i es comproven la
   capçalera, la llista tancada de sentències, el cos (el de 2609261500 amb el
   JOIN i la condició del poble, i res més), els permisos, la CHECK not valid
   amb dos arguments, l'esborrat de la signatura vella i l'entrada de
   supabase/README.md. El detector `problemesD6` es prova també contra
   mutacions (sense la condició, amb la condició per a totes les entitats,
   amb un search_path no buit…): si no les detectara, no guardaria res.
   El comportament (les consultes d'abans, els casos, la idempotència i la
   inversa) es va provar en PGlite fora del repositori (evidència no
   versionada del torn torn_3f5652a2); vegeu el README. */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const NOM = '2611011500_autoria_ajuntament_mateix_poble.sql';
const MIGRACIONS = path.join(ARREL, 'supabase/migrations');
const ORDRE = readdirSync(MIGRACIONS).filter((f) => f.endsWith('.sql')).sort();
const llig = (fitxer) => readFileSync(path.join(MIGRACIONS, fitxer), 'utf8');
const SQL = llig(NOM);
const BASE_1500 = llig('2609261500_identitat_perfil_f1.sql');
const README = readFileSync(path.join(ARREL, 'supabase/README.md'), 'utf8');

/* Sense comentaris de línia: es comprova el codi, no la prosa. */
const senseComentaris = (sql) => sql.split('\n').map((linia) => linia.replace(/--.*$/, '')).join('\n');
const NET = (text) => text.replace(/\s+/g, ' ').trim().toLowerCase();

/** Cada funció: esquema, nom, paràmetres, capçalera (fins a «as $$») i cos. */
function funcions(sql) {
  const re = /create\s+(?:or\s+replace\s+)?function\s+(\w+)\.(\w+)\s*\(([^)]*)\)([\s\S]*?)\bas\s+\$(\w*)\$/gi;
  const eixida = [];
  let m;
  while ((m = re.exec(sql))) {
    const tanca = `$${m[5]}$`;
    const inici = re.lastIndex;
    const fi = sql.indexOf(tanca, inici);
    if (fi < inici) break;
    eixida.push({ esquema: m[1].toLowerCase(), nom: m[2].toLowerCase(), params: NET(m[3]), capcalera: NET(m[4]), cos: NET(sql.slice(inici, fi)) });
    re.lastIndex = fi + tanca.length;
  }
  return eixida;
}

/** Les sentències del codi, en ordre, amb els cossos $$…$$ plegats. */
function sentencies(sql) {
  const plegat = senseComentaris(sql).replace(/\$(\w*)\$[\s\S]*?\$\1\$/g, () => '$$cos$$');
  return plegat.split(';').map(NET).filter(Boolean);
}

/* El cos de 2609261500 (l'estat d'abans) i el cos esperat: el mateix amb el
   JOIN a organizations i la condició del poble per als ajuntaments. */
const COS_VELL = funcions(senseComentaris(BASE_1500)).find((f) => f.nom === 'pot_signar_com_organitzacio' && f.params === 'p_org_id uuid').cos;
const JOIN = 'join public.organizations o on o.id = m.organization_id';
const CONDICIO = "and (o.kind <> 'city_hall' or o.tenant_id = p_tenant_id)";
const COS_ESPERAT = COS_VELL
  .replace('from public.organization_memberships m', `from public.organization_memberships m ${JOIN}`)
  .replace("and m.role in ('owner', 'admin')", `and m.role in ('owner', 'admin') ${CONDICIO}`);

/* La llista tancada de sentències, en ordre. */
const SENTENCIES_ESPERADES = [
  'begin',
  "set local lock_timeout = '5s'",
  "set local statement_timeout = '60s'",
  "create or replace function public.pot_signar_com_organitzacio(p_org_id uuid, p_tenant_id uuid) returns boolean language sql stable security definer set search_path = '' as $$cos$$",
  'revoke execute on function public.pot_signar_com_organitzacio(uuid, uuid) from public, anon',
  'grant execute on function public.pot_signar_com_organitzacio(uuid, uuid) to authenticated',
  'alter table public.section_submissions drop constraint if exists section_submissions_autoria_org_valida',
  'alter table public.section_submissions add constraint section_submissions_autoria_org_valida check (public.pot_signar_com_organitzacio(author_org_id, tenant_id)) not valid',
  'drop function if exists public.pot_signar_com_organitzacio(uuid)',
  "notify pgrst, 'reload schema'",
  'commit'
];

/** Els problemes de D-6 d'un text SQL; [] vol dir que la migració és la decidida. */
function problemesD6(sql) {
  const problemes = [];
  const codi = senseComentaris(sql);
  const fs = funcions(codi);
  if (fs.length !== 1) problemes.push(`funcions: ${fs.length}`);
  const f = fs[0];
  if (f) {
    if (`${f.esquema}.${f.nom}` !== 'public.pot_signar_com_organitzacio' || f.params !== 'p_org_id uuid, p_tenant_id uuid') problemes.push('signatura');
    if (f.capcalera !== "returns boolean language sql stable security definer set search_path = ''") problemes.push(`capçalera: ${f.capcalera}`);
    if (f.cos !== COS_ESPERAT) problemes.push(`cos: ${f.cos}`);
  }
  const llista = sentencies(sql);
  if (JSON.stringify(llista) !== JSON.stringify(SENTENCIES_ESPERADES)) problemes.push(`sentències: ${JSON.stringify(llista)}`);
  if (/\bgrant\b[^;]*\bto\b[^;]*\banon\b/i.test(codi)) problemes.push('grant a anon');
  if (/\b(insert\s+into|update\s+public\.|delete\s+from|truncate)\b/i.test(codi)) problemes.push('toca dades');
  if (/\b(service_role|is_superadmin)\b/i.test(codi)) problemes.push('rol privilegiat');
  return problemes;
}

test('el nom segueix el format i va després de 2609261500 i de l’última del 31-10 (2610312000)', () => {
  expect(NOM).toMatch(/^\d{10}_[a-z0-9_]+\.sql$/);
  for (const anterior of ['2609261200_publicacions_autoria.sql', '2609261500_identitat_perfil_f1.sql', '2610312000_e2ee_lot3_validadors_service_role.sql']) {
    expect(ORDRE.indexOf(anterior), anterior).toBeGreaterThanOrEqual(0);
    expect(ORDRE.indexOf(NOM), anterior).toBeGreaterThan(ORDRE.indexOf(anterior));
  }
  expect(ORDRE.filter((f) => f.startsWith(NOM.slice(0, 10)))).toEqual([NOM]);
});

test('la capçalera: procedència, QUÈ CORREGIX, QUÈ FA, QUÈ NO FA, Depén de, Abans, Després, Desfer i UNA sola línia NO aplicada', () => {
  const capcalera = SQL.slice(0, SQL.search(/^begin;/m));
  expect(SQL).toMatch(/^-- =+\n-- 261101_1500 · D-6 /);
  for (const apartat of [/^-- QUÈ CORREGIX:$/m, /^-- QUÈ FA:$/m, /^-- QUÈ NO FA:$/m, /^-- Depén de: 2609261200 .*2609261500/m, /^-- Abans \(lectura\): /m, /^-- Després \(lectura\): /m, /^-- Desfer \(inversa/m]) {
    expect(capcalera).toMatch(apartat);
  }
  expect(capcalera).toMatch(/Idempotent i en una sola transacció\./);
  expect(SQL.split('\n').filter((l) => /^-- NO aplicada: l'aplica el Mestre, mai un agent\.$/.test(l))).toHaveLength(1);
  expect(SQL.match(/no aplicada/gi)).toHaveLength(1);
  // La inversa torna exactament a la signatura i la CHECK d'abans.
  expect(capcalera).toMatch(/check \(public\.pot_signar_com_organitzacio\(author_org_id\)\) not valid;/);
  expect(capcalera).toMatch(/drop function if exists public\.pot_signar_com_organitzacio\(uuid, uuid\);/);
  // L'abast decidit: només els ajuntaments; la consulta d'abans per tipus d'entitat.
  expect(capcalera).toMatch(/where s\.tenant_id <> o\.tenant_id group by 1;/);
  // I la que troba l'ajuntament que encara no ha signat res: els pobles de
  // les seues administradores i els pobles on han publicat.
  const segona = NET(capcalera.split('\n').filter((l) => l.startsWith('--   ')).map((l) => l.slice(5)).join(' '));
  for (const tros of ['join public.town_memberships tm on tm.user_id = m.user_id', 'join public.section_submissions s on s.owner_user_id = m.user_id', "m.role in ('owner', 'admin')) as pobles_administradores", "from public.organizations o where o.kind = 'city_hall';"]) {
    expect(segona).toContain(tros);
  }
});

describe('el codi és exactament el decidit', () => {
  test('el cos de 2609261500 es troba i és el de sempre (base de la comparació)', () => {
    expect(COS_VELL).toBe("select p_org_id is null or exists ( select 1 from public.organization_memberships m where m.organization_id = p_org_id and m.user_id = (select auth.uid()) and m.role in ('owner', 'admin') );");
    expect(COS_ESPERAT).not.toBe(COS_VELL);
    expect(COS_ESPERAT).toContain(JOIN);
    expect(COS_ESPERAT).toContain(CONDICIO);
  });

  test('la migració no té cap problema: funció, cos, sentències i permisos', () => {
    expect(problemesD6(SQL)).toEqual([]);
  });

  /* La plataforma és «el Mas»: la paraula vetada no s'escriu ni ací (el
     mateix ajudant que xatE2ee.migracio.test.js). */
  test('cap línia porta la paraula vetada', () => {
    const PARAULA_VETADA = ['mas', 'ia'].join('');
    expect(SQL.toLowerCase()).not.toContain(PARAULA_VETADA);
    const vinyeta = README.indexOf(`- \`migrations/${NOM}\``);
    expect(vinyeta).toBeGreaterThan(0);
    expect(README.slice(vinyeta, README.indexOf('\n\n', vinyeta)).toLowerCase()).not.toContain(PARAULA_VETADA);
  });
});

describe('el detector mossega (mutacions)', () => {
  /* La mutació va al codi (des de `begin;`): la inversa de la capçalera
     repetix alguns trossos i no ha de ser ella la que canvie. */
  const INICI_CODI = SQL.search(/^begin;/m);
  const muta = (de, a) => {
    const codi = SQL.slice(INICI_CODI);
    expect(codi.includes(de), de).toBe(true);
    return SQL.slice(0, INICI_CODI) + codi.replace(de, a);
  };
  test.each([
    ['sense la condició del poble', () => muta("        and (o.kind <> 'city_hall' or o.tenant_id = p_tenant_id)\n", '')],
    ['la condició per a TOTES les entitats', () => muta("(o.kind <> 'city_hall' or o.tenant_id = p_tenant_id)", '(o.tenant_id = p_tenant_id)')],
    ['un altre tipus d’entitat', () => muta("o.kind <> 'city_hall'", "o.kind <> 'entity'")],
    ['search_path no buit', () => muta("set search_path = ''", 'set search_path = public')],
    ['security invoker', () => muta('security definer', 'security invoker')],
    ['la CHECK amb un sol argument', () => muta('check (public.pot_signar_com_organitzacio(author_org_id, tenant_id))', 'check (public.pot_signar_com_organitzacio(author_org_id))')],
    ['la CHECK sense tenant_id (dos arguments equivocats)', () => muta('check (public.pot_signar_com_organitzacio(author_org_id, tenant_id))', 'check (public.pot_signar_com_organitzacio(author_org_id, author_org_id))')],
    ['la CHECK validada (sense not valid)', () => muta('tenant_id)) not valid;', 'tenant_id));')],
    ['la signatura vella es queda', () => muta('drop function if exists public.pot_signar_com_organitzacio(uuid);\n', '')],
    ['EXECUTE per a anon', () => muta('to authenticated;', 'to authenticated, anon;')],
    ['sense revocar a public', () => muta('from public, anon;', 'from anon;')],
    ['una escriptura de dades', () => muta('commit;', "update public.section_submissions set author_org_id = null;\ncommit;")]
  ])('%s → el detector ho veu', (_nom, mutacio) => {
    expect(problemesD6(mutacio()).length).toBeGreaterThan(0);
  });
});

test('supabase/README.md la documenta: vinyeta en ordre, fila 65 i la sonda de lectura', () => {
  const vinyeta = README.indexOf(`- \`migrations/${NOM}\``);
  expect(vinyeta).toBeGreaterThan(README.indexOf('- `migrations/2610312000_e2ee_lot3_validadors_service_role.sql`'));
  expect(vinyeta).toBeLessThan(README.indexOf('\n- `seed.sql`'));
  const text = README.slice(vinyeta, README.indexOf('\n\n', vinyeta));
  expect(text).toMatch(/D-6/);
  expect(text).toMatch(/city_hall/);
  // Onada R10 · B4: la lectura REST del 6-11-2026 la troba a producció (la signatura nova sí, la vella no).
  expect(text.replace(/\s+/g, ' ')).toContain('**aplicada a producció** (lectura REST del 6-11-2026: `pot_signar_com_organitzacio(uuid, uuid)` existix, 401 42501, i la signatura vella `(uuid)` ja no, 404 PGRST202; acta 261102_1456)');
  expect(text).not.toMatch(/NO aplicada/);
  expect(README).toMatch(/^\| 65 \| `2611011500` \| `2611011500_autoria_ajuntament_mateix_poble\.sql` \| Aplicada a producció \(lectura REST del 6-11: [^|]*\) \| [^|]*D-6[^|]* \|$/m);
  expect(text).toContain("to_regprocedure('public.pot_signar_com_organitzacio(uuid,uuid)') IS NOT NULL AS te_autoria_poble_2611011500");
  expect(text).toContain("to_regprocedure('public.pot_signar_com_organitzacio(uuid)') IS NULL AS sense_signatura_vella");
  // Les dues consultes d'abans, també la dels ajuntaments que no han signat res.
  expect(text).toContain('where s.tenant_id <> o.tenant_id group by 1;');
  expect(text).toContain("join public.town_memberships tm on tm.user_id = m.user_id where m.organization_id = o.id and m.role in ('owner', 'admin')) as pobles_administradores");
  expect(text).toContain("from public.organizations o where o.kind = 'city_hall';");
  // L'evidència de PGlite es diu no versionada: cap promesa d'una prova que no és al repositori.
  expect(text).toMatch(/evidència no\s+versionada/);
});
