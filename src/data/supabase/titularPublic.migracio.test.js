/* IDEA-22, punt 2 (Directiva del Mestre, àudios 01:14-01:16; pla 261025_0200)
   · Prova estàtica de la migració 2610250300_titular_public.sql: la persona
   titular d'una entitat a /connectar, NOMÉS si ella ho ha triat. No hi ha cap
   base de dades: es llig el SQL i es comproven la capçalera (PER QUÈ, QUÈ FA,
   QUÈ NO FA, CODIS, Depén de, NO aplicada, l'aplica el Mestre), la
   transacció, la columna amb el seu default false, el disparador que la
   torna a false fora de l'owner, els permisos de la taula reafirmats (mandat
   Supabase 30-Oct-2026), les tres RPC SECURITY DEFINER amb el search_path buit
   i execució només per a authenticated, la tria només de la propietària, les
   cinc condicions de la lectura (owner, tria, perfil públic i sense baixa,
   organització pública, cap bloqueig), que mai no torna cap correu ni cap
   rol, l'adaptador perfils.js, el contracte i l'entrada de supabase/README.md.
   El parser és el de seguimentsEntitat.migracio.test.js. */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from 'vitest';
import { CAPACITATS, MISSATGES_TITULAR } from '../contracte.js';

/* vitest s'executa des de l'arrel del repositori (com qualitat.test.js). */
const ARREL = process.cwd();
const NOM = '2610250300_titular_public.sql';
const MIGRACIONS = path.join(ARREL, 'supabase/migrations');
const SQL = readFileSync(path.join(MIGRACIONS, NOM), 'utf8');
const CLIENT = readFileSync(path.join(ARREL, 'src/data/supabase/perfils.js'), 'utf8');
const README = readFileSync(path.join(ARREL, 'supabase/README.md'), 'utf8');
/* Sense comentaris de línia: es comprova el codi, no la prosa. */
const CODI = SQL.split('\n').map((linia) => linia.replace(/--.*$/, '')).join('\n');
const CAPCALERA = SQL.slice(0, SQL.search(/^begin;/m));
const SENSE_ESPAIS = (text) => text.replace(/\s+/g, ' ').trim().toLowerCase();
const LINIES = SQL.split('\n');
const CODIS_TIT = ['000', '001', '002'].map((n) => `SDP-TIT-${n}`);

/** Cada funció: esquema, nom, paràmetres, capçalera (fins a «as $$») i cos. */
function funcions(sql) {
  const re = /create\s+(?:or\s+replace\s+)?function\s+(\w+)\.(\w+)\s*\(([^)]*)\)([\s\S]*?)\bas\s+\$(\w*)\$/gi;
  const eixida = [];
  let m;
  while ((m = re.exec(sql))) {
    const tanca = `$${m[5]}$`;
    const inici = re.lastIndex;
    const fi = sql.indexOf(tanca, inici);
    expect(fi, `cos sense tancar a ${m[1]}.${m[2]}`).toBeGreaterThan(inici);
    eixida.push({ esquema: m[1].toLowerCase(), nom: m[2].toLowerCase(), params: SENSE_ESPAIS(m[3]), capcalera: SENSE_ESPAIS(m[4]), cos: sql.slice(inici, fi), posicio: m.index });
    re.lastIndex = fi + tanca.length;
  }
  return eixida;
}
const FUNCIONS = funcions(CODI);
const funcio = (esquema, nom) => FUNCIONS.find((f) => f.esquema === esquema && f.nom === nom);

/* [nom, paràmetres, signatura]. */
const RPC = Object.freeze([
  ['marca_titular_public', 'p_org_id uuid, p_public boolean', '(uuid, boolean)'],
  ['estat_titular_public', 'p_org_id uuid', '(uuid)'],
  ['titular_public', 'p_org_id uuid', '(uuid)']
]);

test('el nom segueix el format de les migracions i va després de 2610250100', () => {
  expect(NOM).toMatch(/^\d{10}_[a-z0-9_]+\.sql$/);
  const ordre = readdirSync(MIGRACIONS).filter((f) => f.endsWith('.sql')).sort();
  expect(ordre.indexOf('2610250100_seguiments_des_d_entitat.sql')).toBeGreaterThanOrEqual(0);
  expect(ordre.indexOf(NOM)).toBeGreaterThan(ordre.indexOf('2610250100_seguiments_des_d_entitat.sql'));
});

test('la capçalera: la procedència, PER QUÈ, QUÈ FA, QUÈ NO FA, CODIS, Depén de i NO aplicada, l’aplica el Mestre, en UNA línia', () => {
  expect(SQL).toMatch(/^-- =+\n-- 261025_0300 · IDEA-22, punt 2 \(Directiva del Mestre, àudios 01:14-01:16;\n-- pla 261025_0200\)/);
  for (const apartat of [/^-- PER QUÈ: /m, /^-- QUÈ FA:$/m, /^-- QUÈ NO FA \(/m, /^-- CODIS \(/m, /^-- Depén de: /m]) expect(CAPCALERA).toMatch(apartat);
  expect(LINIES.filter((l) => /^-- NO aplicada: l'aplica el Mestre, mai un agent\.$/.test(l))).toHaveLength(1);
  expect(CAPCALERA).toMatch(/Idempotent i en una sola transacció/);
  /* El motiu de l'opt-in, dit: un perfil públic no és cap permís. */
  expect(CAPCALERA).toMatch(/un perfil públic\n-- no és cap permís/);
  /* La via d'owner_user_id que ja existix, declarada i no tocada. */
  expect(CAPCALERA).toMatch(/owner_user_id/);
});

test('els codis: SDP-TIT-000…002, iguals a la capçalera, al codi i al contracte; mai cap 404', () => {
  for (const codi of CODIS_TIT) {
    expect(CAPCALERA, codi).toContain(codi);
    expect(CODI, codi).toContain(codi);
  }
  expect([...new Set([...CODI.matchAll(/SDP-[A-Z]+-\d{3}/g)].map((m) => m[0]))].sort()).toEqual(CODIS_TIT);
  expect(Object.keys(MISSATGES_TITULAR).filter((codi) => codi.startsWith('SDP-TIT-')).sort()).toEqual(CODIS_TIT);
  const errcodes = [...CODI.matchAll(/errcode = '([0-9A-Z]{5})'/g)].map((m) => m[1]);
  expect([...new Set(errcodes)].sort()).toEqual(['22023', '42501']);
  for (const raise of CODI.matchAll(/raise exception 'SDP-TIT-00[01]:[^;]*;/g)) expect(raise[0]).toMatch(/using errcode = '42501';$/);
  for (const raise of CODI.matchAll(/raise exception 'SDP-TIT-002:[^;]*;/g)) expect(raise[0]).toMatch(/using errcode = '22023';$/);
  expect(CODI).not.toMatch(/P0002|42883|42P01/);
  /* La lectura no en llança cap: zero files, sense dir per què. */
  expect(funcio('public', 'titular_public').cos).not.toMatch(/raise/i);
});

test('una sola transacció amb temps d’espera curts, i recarrega l’esquema de PostgREST abans del commit', () => {
  expect(CODI.trimStart()).toMatch(/^begin;/i);
  expect((CODI.match(/^\s*begin;\s*$/gim) || []).length).toBe(1);
  expect((CODI.match(/^\s*commit;\s*$/gim) || []).length).toBe(1);
  expect(CODI).toMatch(/begin;\nset local lock_timeout = '5s';\nset local statement_timeout = '60s';/);
  expect(CODI.trimEnd()).toMatch(/notify pgrst, 'reload schema';\s*commit;$/);
  expect(CODI).not.toMatch(/concurrently/i);
});

test('la columna: booleana, no nul·la, false per defecte (ningú no es mostra sense triar-ho) i idempotent', () => {
  expect(SENSE_ESPAIS(CODI)).toContain('alter table public.organization_memberships add column if not exists titular_public boolean not null default false;');
  expect(CODI).not.toMatch(/default true/i);
  /* Cap còpia de dades: cap UPDATE massiu que encenga la tria de ningú. */
  expect(CODI).not.toMatch(/set titular_public = true/i);
});

test('el disparador torna la tria a false en tota fila que no és d’owner, abans d’escriure-la', () => {
  const f = funcio('private', 'titular_public_nomes_owner');
  expect(f).toBeTruthy();
  expect(f.capcalera).toContain('returns trigger');
  expect(SENSE_ESPAIS(f.cos)).toContain("if new.role is distinct from 'owner' then new.titular_public := false; end if; return new;");
  const codi = SENSE_ESPAIS(CODI);
  expect(codi).toContain('drop trigger if exists sdp_titular_public_nomes_owner on public.organization_memberships;');
  expect(codi).toContain('create trigger sdp_titular_public_nomes_owner before insert or update on public.organization_memberships for each row execute function private.titular_public_nomes_owner();');
  expect(CODI).toContain('revoke all on function private.titular_public_nomes_owner() from public, anon, authenticated;');
  expect(CODI).not.toMatch(/grant[^;]*private\.titular_public_nomes_owner/i);
});

test('la taula: cap client no hi escriu (reafirmat), cap política nova i cap permís de taula nou', () => {
  expect(CODI).toContain('revoke insert, update, delete on table public.organization_memberships from public, anon, authenticated;');
  expect(CODI).not.toMatch(/create policy|drop policy|disable row level security/i);
  expect([...CODI.matchAll(/^\s*grant\b[^;]*\bon\b(?!\s+function)[^;]*;/gim)]).toEqual([]);
  expect(CODI).not.toMatch(/grant[^;]*\bto\b[^;]*\banon\b/i);
});

test('les funcions: totes SECURITY DEFINER amb el search_path buit, i les RPC només per a authenticated', () => {
  expect(FUNCIONS.map((f) => `${f.esquema}.${f.nom}`).sort()).toEqual([
    'private.titular_public_nomes_owner', ...RPC.map(([nom]) => `public.${nom}`)
  ].sort());
  for (const f of FUNCIONS) {
    expect(f.capcalera, f.nom).toContain('security definer');
    expect(f.capcalera, f.nom).toContain("set search_path = ''");
  }
  for (const [nom, params, firma] of RPC) {
    const f = funcio('public', nom);
    expect(f.params, nom).toBe(params);
    expect(f.cos, nom).toMatch(/v_jo\s+uuid := \(select auth\.uid\(\)\);/);
    expect(CODI).toContain(`revoke all on function public.${nom}${firma} from public, anon, authenticated, service_role;`);
    expect(CODI.split('\n').filter((l) => l.trim().startsWith('grant ') && l.includes(`public.${nom}(`)))
      .toEqual([`grant execute on function public.${nom}${firma} to authenticated;`]);
  }
  expect(funcio('public', 'marca_titular_public').capcalera).toMatch(/^returns boolean language plpgsql volatile security definer/);
  expect(funcio('public', 'estat_titular_public').capcalera).toMatch(/^returns boolean language plpgsql stable security definer/);
  expect(funcio('public', 'titular_public').capcalera).toMatch(/^returns table \( ?id uuid, full_name text, avatar_url text ?\) language plpgsql stable security definer/);
});

test('els noms dels cossos van amb el seu esquema: cap taula ni funció sense qualificar', () => {
  for (const f of FUNCIONS) {
    const nus = [...f.cos.matchAll(/\b(?:from|join|into|update)\s+(?!public\.|private\.|auth\.)([a-z_][a-z0-9_]*)\b/gi)]
      .map((m) => m[1]).filter((nom) => !nom.startsWith('v_') && !nom.startsWith('p_'));
    expect(nus, f.nom).toEqual([]);
  }
});

test('la tria: només la propietària que crida (user_id = auth.uid() i role owner), mai per a una altra persona; sense sessió, 000', () => {
  for (const nom of ['marca_titular_public', 'estat_titular_public']) {
    const cos = SENSE_ESPAIS(funcio('public', nom).cos);
    expect(cos, nom).toMatch(/if v_jo is null then raise exception 'sdp-tit-000: [^']+' using errcode = '42501';/);
    /* Cada lectura o escriptura de la taula porta les tres condicions. */
    const sentencies = cos.split(';').filter((s) => /public\.organization_memberships/.test(s));
    expect(sentencies.length, nom).toBeGreaterThan(0);
    for (const s of sentencies) {
      expect(s, nom).toContain('m.organization_id = p_org_id');
      expect(s, nom).toContain('m.user_id = v_jo');
      expect(s, nom).toContain("m.role = 'owner'");
    }
    expect(cos, nom).toMatch(/if not found then raise exception 'sdp-tit-001: .*?' using errcode = '42501';/);
    /* Cap porta d'administradora: can_manage_organization obriria la tria a les admins. */
    expect(cos, nom).not.toMatch(/can_manage_organization|'admin'/);
  }
  const marca = SENSE_ESPAIS(funcio('public', 'marca_titular_public').cos);
  expect(marca).toMatch(/if p_public is null then raise exception 'sdp-tit-002: [^']+' using errcode = '22023';/);
  expect(marca).toContain('set titular_public = p_public');
  /* Només s'escriu si canvia (els disparadors de la taula, capçalera). */
  expect(marca).toContain('and m.titular_public is distinct from p_public');
  expect(marca.indexOf('sdp-tit-002')).toBeLessThan(marca.indexOf('update public.organization_memberships'));
});

test('la lectura: les cinc condicions (owner, la tria, perfil públic i sense baixa, organització pública, cap bloqueig), una fila com a molt i mai cap correu ni cap rol', () => {
  const f = funcio('public', 'titular_public');
  const cos = SENSE_ESPAIS(f.cos);
  expect(f.cos).toMatch(/#variable_conflict use_column/);
  expect(cos).toMatch(/if v_jo is null or p_org_id is null then return; end if;/);
  for (const condicio of [
    "o.visibility = 'public'",
    "m.role = 'owner'",
    'and m.titular_public',
    'coalesce(p.is_public, false)',
    'p.baixa_demanada_at is null',
    'limit 1'
  ]) expect(cos, condicio).toContain(condicio);
  /* (v) Els dos sentits del bloqueig, i sense la taula de la moderació, cap. */
  // La consulta a la taula, en un IF propi: amb un sol `and`, PL/pgSQL la
  // planificaria igualment i una base sense la taula fallaria amb 42P01.
  expect(cos).toContain("if to_regclass('public.bloquejos') is not null then if exists (");
  expect(cos).not.toMatch(/to_regclass\('public\.bloquejos'\) is not null and exists/);
  expect(cos).toContain('(b.bloquejador = v_jo and b.bloquejat_persona = v_titular)');
  expect(cos).toContain('(b.bloquejador = v_titular and b.bloquejat_persona = v_jo)');
  /* Només l'id, el nom i la foto: cap correu, cap rol, cap auth.users. */
  expect(cos).toContain('return query select p.id, p.full_name, p.avatar_url from public.profiles p where p.id = v_titular;');
  expect(f.cos).not.toMatch(/email|auth\.users|m\.role\s*,|select[^;]*\brole\b[^;]*from/i);
  expect(f.cos).not.toMatch(/created_by|owner_user_id|seguiments/i);
});

test('l’adaptador perfils.js crida les tres RPC amb p_org_id, i el contracte en té les dues capacitats fora de directori', () => {
  expect(CLIENT).toMatch(/rpc\('titular_public', \{ p_org_id: clau \}/);
  expect(CLIENT).toMatch(/rpc\('estat_titular_public', \{ p_org_id: clau \}/);
  expect(CLIENT).toMatch(/rpc\('marca_titular_public', \{ p_org_id: clau, p_public: titularPublic \}/);
  expect(CAPACITATS.titularPublic).toEqual(['loadTitularPublic']);
  expect(CAPACITATS.consentimentTitular).toEqual(['estatTitularPublic', 'marcaTitularPublic']);
  expect(CAPACITATS.directori).not.toContain('loadTitularPublic');
});

test('el catàleg supabase/README.md la nomena després de 2610250100, abans de seed.sql, NO aplicada, en un sol paràgraf', () => {
  const posicio = README.indexOf(`migrations/${NOM}`);
  expect(posicio, 'falta l’entrada al README').toBeGreaterThanOrEqual(0);
  expect(posicio).toBeGreaterThan(README.indexOf('migrations/2610250100_seguiments_des_d_entitat.sql'));
  expect(posicio).toBeLessThan(README.indexOf('- `seed.sql`'));
  const entrada = README.slice(posicio).split('\n\n')[0];
  expect(entrada).toMatch(/IDEA-22, punt 2 \(Directiva del Mestre, àudios 01:14-01:16; pla\s+261025_0200\)/);
  expect(entrada).toMatch(/\*\*NO aplicada:\s+l'aplica el\s+Mestre, mai un agent\*\*/);
  expect(entrada).toContain('revoke insert, update, delete on table public.organization_memberships from public, anon, authenticated;');
  for (const text of ['`public.organization_memberships.titular_public`', '`marca_titular_public(p_org_id, p_public)`', '`estat_titular_public(p_org_id)`', '`titular_public(p_org_id)`',
    '`SDP-TIT-001`', 'src/data/supabase/titularPublic.migracio.test.js']) {
    expect(entrada, text).toContain(text);
  }
  expect(entrada).not.toMatch(/offline[- ]first|local[- ]first/i);
});

test('higiene de fitxer: una sola línia buida final i cap vocabulari prohibit', () => {
  expect(SQL.endsWith(';\n') && !SQL.endsWith('\n\n')).toBe(true);
  expect(SQL).not.toMatch(/offline[- ]first|local[- ]first/i);
  expect(SQL).not.toMatch(/contact_email|public_email/);
});
