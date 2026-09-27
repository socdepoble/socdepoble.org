// Prova estàtica de la migració 260926_1500 (Fase 1 · identitat i perfil).
// No hi ha cap base de dades: es llig el SQL i es comproven les regles que
// tractor-rls no mira (search_path buit, permisos de cada RPC, formes del
// contracte) i les decisions D2, D3, D10, D11 i D12.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FITXER = path.join(ARREL, 'supabase/migrations/2609261500_identitat_perfil_f1.sql');
const SQL = fs.readFileSync(FITXER, 'utf8');
// Sense comentaris de línia: es comprova el codi, no la prosa.
const CODI = SQL.split('\n').map((linia) => linia.replace(/--.*$/, '')).join('\n');

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
    eixida.push({ esquema: m[1].toLowerCase(), nom: m[2].toLowerCase(), params: m[3], capcalera: m[4], cos: sql.slice(inici, fi) });
    re.lastIndex = fi + tanca.length;
  }
  return eixida;
}
const FUNCIONS = funcions(CODI);
const funcio = (esquema, nom) => FUNCIONS.find((f) => f.esquema === esquema && f.nom === nom);
const escapa = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const SENSE_ESPAIS = (text) => text.replace(/\s+/g, ' ').trim().toLowerCase();

// Contracte d'interfícies comú, punt 2: nom, paràmetres i tipus de retorn.
const RPC = [
  { nom: 'exporta_les_meues_dades', params: '', retorn: 'jsonb' },
  { nom: 'estat_baixa', params: '', retorn: 'jsonb' },
  { nom: 'demana_baixa', params: 'p_motiu text default null', retorn: 'jsonb', firma: 'text' },
  { nom: 'cancela_baixa', params: '', retorn: 'jsonb' },
  { nom: 'estat_consentiment', params: '', retorn: 'jsonb' },
  { nom: 'registra_consentiment', params: 'p_tipus text, p_versio text', retorn: 'void', firma: 'text, text' },
  { nom: 'revoca_consentiment', params: 'p_tipus text', retorn: 'void', firma: 'text' },
  { nom: 'completa_la_meua_alta', params: 'p_tenant_id uuid default null', retorn: 'jsonb', firma: 'uuid' }
];

test('la migració és una sola transacció', () => {
  assert.match(CODI.trimStart(), /^begin;/i);
  assert.match(CODI.trimEnd(), /commit;$/i);
  assert.equal((CODI.match(/^\s*begin;\s*$/gim) || []).length, 1);
  assert.equal((CODI.match(/^\s*commit;\s*$/gim) || []).length, 1);
});

test("cada funció security definer porta set search_path = ''", () => {
  const definers = FUNCIONS.filter((f) => /security\s+definer/i.test(f.capcalera));
  assert.ok(definers.length >= 15, `massa poques funcions definer: ${definers.length}`);
  for (const f of definers) {
    assert.match(f.capcalera, /set\s+search_path\s*=\s*''/i, `${f.esquema}.${f.nom} sense search_path buit`);
  }
  // Cap «security definer» fora d'una capçalera de funció que el parser no haja vist.
  assert.equal((CODI.match(/security\s+definer/gi) || []).length, definers.length);
  assert.doesNotMatch(CODI, /set\s+search_path\s*=\s*public/i);
  assert.doesNotMatch(CODI, /set\s+search_path\s+to/i);
});

test('cap funció fixa un search_path que no siga buit', () => {
  for (const f of FUNCIONS) {
    const fixat = f.capcalera.match(/set\s+search_path\s*=\s*([^\s]+)/i);
    if (fixat) assert.equal(fixat[1], "''", `${f.esquema}.${f.nom}`);
  }
});

test('cap política oberta a tothom', () => {
  assert.doesNotMatch(CODI, /using\s*\(\s*true\s*\)/i);
  assert.doesNotMatch(CODI, /with\s+check\s*\(\s*true\s*\)/i);
});

test('D10 i D12: author_org_id i xat_fils.creat_per passen a ON DELETE SET NULL', () => {
  assert.match(CODI, /alter table public\.section_submissions\s+add constraint section_submissions_author_org_id_fkey\s+foreign key \(author_org_id\) references public\.organizations \(id\) on delete set null/i);
  assert.match(CODI, /alter table public\.xat_fils\s+add constraint xat_fils_creat_per_fkey\s+foreign key \(creat_per\) references auth\.users \(id\) on delete set null/i);
  assert.match(CODI, /alter table public\.xat_fils alter column creat_per drop not null;/i);
  // T1: les dues FK sense acció que impedien esborrar una persona.
  assert.match(CODI, /foreign key \(granted_by\) references auth\.users \(id\) on delete set null/i);
  assert.match(CODI, /foreign key \(resolta_per\) references auth\.users \(id\) on delete set null/i);
  // Les velles es busquen pel catàleg i s'esborren abans de crear les noves.
  const esborra = CODI.search(/execute format\('alter table public\.%I drop constraint %I'/i);
  const crea = CODI.search(/add constraint section_submissions_author_org_id_fkey/i);
  assert.ok(esborra > 0 && esborra < crea, "el bloc que esborra les FK velles ha d'anar abans");
  for (const [taula, columna] of [['section_submissions', 'author_org_id'], ['xat_fils', 'creat_per'],
    ['user_platform_roles', 'granted_by'], ['organization_claims', 'resolta_per']]) {
    assert.match(CODI, new RegExp(`cl\\.relname = '${taula}'\\s+and a\\.attname = '${columna}'`, 'i'));
  }
});

test("s'esborra l'índex duplicat i es conserva el que servix la FK", () => {
  assert.match(CODI, /drop index if exists public\.section_submissions_author_org_idx;/i);
  assert.doesNotMatch(CODI, /drop index[^;]*idx_section_submissions_author_org\b/i);
});

test('D10: el trigger d\'autor conserva la signatura de l\'entitat quan la FK la posa a null', () => {
  const f = funcio('public', 'trg_force_submission_author');
  assert.ok(f, 'falta trg_force_submission_author');
  assert.match(f.cos, /old\.author_org_id is not null and new\.author_org_id is null and pg_trigger_depth\(\) > 1/i);
  // La protecció C1 de 260916_2300 continua.
  assert.match(f.cos, /new\.payload = new\.payload - 'id' - 'created_at' - 'author';/i);
});

test('les 8 RPC del contracte existixen amb la seua forma, revoke i grant', () => {
  for (const rpc of RPC) {
    const f = funcio('public', rpc.nom);
    assert.ok(f, `falta public.${rpc.nom}`);
    assert.equal(SENSE_ESPAIS(f.params), rpc.params, `paràmetres de ${rpc.nom}`);
    assert.match(f.capcalera, new RegExp(`returns\\s+${rpc.retorn}\\b`, 'i'), `retorn de ${rpc.nom}`);
    assert.match(f.capcalera, /security\s+definer/i, `${rpc.nom} ha de ser definer`);
    const firma = escapa(rpc.firma ?? '');
    assert.match(CODI, new RegExp(`revoke execute on function public\\.${rpc.nom}\\(${firma}\\) from public, anon;`, 'i'),
      `revoke de ${rpc.nom}`);
    assert.match(CODI, new RegExp(`grant execute on function public\\.${rpc.nom}\\(${firma}\\) to authenticated;`, 'i'),
      `grant de ${rpc.nom}`);
    // Tota RPC exigix sessió abans de fer res.
    if (rpc.nom !== 'estat_consentiment') assert.match(f.cos, /is null then\s+raise exception 'SDP-[A-Z]+-0\d0:/i, `${rpc.nom} sense guarda de sessió`);
  }
});

test('les formes jsonb que torna el servidor casen amb el contracte', () => {
  assert.match(funcio('public', 'estat_baixa').cos, /'demanada',[\s\S]*'demanada_al',[\s\S]*'purga_prevista_al'/);
  const demana = funcio('public', 'demana_baixa').cos;
  assert.equal((demana.match(/'ja_demanada', (true|false)/g) || []).length, 2);
  assert.match(demana, /'demanada_al'[\s\S]*'purga_prevista_al'/);
  assert.match(funcio('public', 'cancela_baixa').cos, /jsonb_build_object\('cancelada', true\)/);
  const estat = funcio('public', 'estat_consentiment').cos;
  for (const clau of ['versio_vigent', 'url', 'text_sha256', 'consentiments', 'cal_reconsentir', 'tipus', 'accio', 'versio', 'al']) {
    assert.match(estat, new RegExp(`'${clau}'`), `falta ${clau} a estat_consentiment`);
  }
  assert.match(funcio('public', 'exporta_les_meues_dades').cos, /'format', 'socdepoble\.exportacio\.v1'/);
});

test('cap funció pública queda executable per anon', () => {
  const publiques = FUNCIONS.filter((f) => f.esquema === 'public');
  assert.ok(publiques.length >= 14);
  for (const f of publiques) {
    const revoke = CODI.match(new RegExp(`revoke execute on function public\\.${f.nom}\\([^)]*\\) from ([^;]+);`, 'i'));
    assert.ok(revoke, `public.${f.nom} sense revoke`);
    const rols = revoke[1].split(',').map((r) => r.trim().toLowerCase());
    assert.ok(rols.includes('public') && rols.includes('anon'), `public.${f.nom}: revoke de ${rols.join(', ')}`);
  }
  assert.doesNotMatch(CODI, /grant execute on function[^;]*\bto\b[^;]*\banon\b/i);
  assert.doesNotMatch(CODI, /grant execute on function[^;]*\bto\b[^;]*\bpublic\s*;/i);
});

test('les funcions de private no les executa cap rol de client', () => {
  const privades = FUNCIONS.filter((f) => f.esquema === 'private');
  assert.ok(privades.length >= 10);
  for (const f of privades) {
    assert.match(CODI, new RegExp(`revoke execute on function private\\.${f.nom}\\([^)]*\\) from public, anon, authenticated;`, 'i'),
      `private.${f.nom}`);
  }
  assert.doesNotMatch(CODI, /grant execute on function private\./i);
});

test('D11: completa_la_meua_alta diu si la pertinença al poble ha nascut ara', () => {
  const f = funcio('public', 'completa_la_meua_alta').cos;
  const insereix = f.search(/insert into public\.town_memberships/i);
  const compta = f.search(/get diagnostics v_nou = row_count;/i);
  assert.ok(insereix > 0 && compta > insereix, 'el recompte ha de seguir la inserció de la pertinença');
  assert.match(f, /'poble_nou', v_nou > 0/);
});

test('D11: l\'alta no llança mai', () => {
  const alta = funcio('public', 'handle_new_user');
  assert.ok(alta);
  assert.doesNotMatch(alta.cos, /raise\s+exception/i);
  assert.doesNotMatch(alta.cos, /\braise\s*;/i);
  // Tres blocs protegits: perfil, poble i consentiment.
  assert.equal((alta.cos.match(/exception when others then/gi) || []).length, 3);
  const incidencia = funcio('private', 'anota_incidencia_alta');
  assert.match(incidencia.cos, /exception when others then\s+raise warning/i);
  assert.doesNotMatch(incidencia.cos, /raise\s+exception/i);
});

test('D12: la purga no esborra cap publicació i sí les notes', () => {
  assert.doesNotMatch(CODI, /delete\s+from\s+public\.section_submissions/i);
  const purga = funcio('private', 'purga_una_baixa');
  assert.match(purga.cos, /delete from public\.notes where owner_user_id = p_uid;/i);
  assert.match(purga.cos, /owner_user_id = '00000000-0000-0000-0000-000000000000'::uuid/i);
  // Les signades per una entitat no es toquen (CHECK pot_signar, T3).
  assert.match(purga.cos, /s\.author_org_id is null/i);
});

test('D12: les claus personals del payload són les del mapejador i la llavor', () => {
  const claus = funcio('private', 'claus_personals_payload').cos;
  for (const clau of ['ownerUserId', 'author_id', 'author', 'author_avatar', 'authorAvatar', 'avatar_url', 'seller']) {
    assert.match(claus, new RegExp(`'${clau}'`), `falta ${clau}`);
  }
  // La baixa guarda el que retira perquè la cancel·lació ho puga tornar.
  assert.match(funcio('public', 'demana_baixa').cos, /'publicacions', v_retirat/);
  assert.match(funcio('public', 'cancela_baixa').cos, /instantania -> 'publicacions' -> \(s\.id::text\)/);
});

test('D12: searchText (Connectar hi escriu el nom de l\'autora) és clau personal, a la baixa i a la purga', () => {
  const claus = funcio('private', 'claus_personals_payload').cos;
  const llista = claus.match(/e\.key in \(([^)]*)\)/);
  assert.ok(llista, 'falta la llista de claus personals');
  assert.match(llista[1], /'searchText'/);
  // La baixa i la purga passen per la mateixa llista: cap altra via la retira.
  assert.match(funcio('public', 'demana_baixa').cos, /s\.payload - private\.claus_personals_payload\(s\.payload, v_perfil\.full_name\)/);
  assert.match(funcio('private', 'purga_una_baixa').cos, /s\.payload - private\.claus_personals_payload\(s\.payload, null\)/);
});

test('D12: la purga torna a comprovar la baixa, bloquejada, i només compta les purgades de veres', () => {
  const purga = funcio('private', 'purga_una_baixa');
  assert.match(purga.capcalera, /returns\s+boolean/i);
  assert.match(CODI, /drop function if exists private\.purga_una_baixa\(uuid\);\s+create or replace function private\.purga_una_baixa/i);
  const guarda = purga.cos.search(/from private\.baixes b\s+where b\.user_id = p_uid\s+and b\.purga_prevista_al <= now\(\)\s+for update;\s+if not found then\s+return false;/i);
  assert.ok(guarda >= 0, 'falta la guarda amb for update sobre private.baixes');
  assert.ok(guarda < purga.cos.search(/delete from public\.notes/i), 'la guarda ha d\'anar abans d\'esborrar res');
  assert.ok(guarda < purga.cos.search(/delete from auth\.users/i));
  assert.match(purga.cos, /return true;\s*end;\s*$/i);
  // cancela_baixa bloqueja la mateixa fila: les dues s'ordenen.
  assert.match(funcio('public', 'cancela_baixa').cos, /from private\.baixes b where b\.user_id = v_uid for update;/i);
  const vencudes = funcio('private', 'purga_baixes_vencudes').cos;
  assert.match(vencudes, /if not private\.purga_una_baixa\(r\.user_id\) then\s+continue;\s+end if;/i);
  assert.doesNotMatch(vencudes, /perform private\.purga_una_baixa/i);
});

test('D12: un fitxer és referenciat per bucket i nom, també des del cos de la fitxa d\'una entitat', () => {
  const purga = funcio('private', 'purga_una_baixa').cos;
  const cua = purga.slice(purga.search(/insert into private\.purga_storage_pendent/i), purga.search(/from storage\.objects o/i));
  assert.ok(cua.length > 0, 'falta la inserció a la cua de Storage');
  // Mai el nom sol: la còpia pública d'un adjunt té el mateix nom que l'original privat.
  assert.doesNotMatch(cua, /strpos\([^,]+,\s*o\.name\)/i);
  assert.doesNotMatch(cua, /char_length\(o\.name\)\)\s*=\s*o\.name/i);
  assert.match(cua, /strpos\(s\.payload::text, o\.bucket_id \|\| '\/' \|\| o\.name\) > 0/);
  assert.match(cua, /strpos\(coalesce\(org\.presentacio_html, ''\), o\.bucket_id \|\| '\/' \|\| o\.name\) > 0/);
  for (const col of ['logo_url', 'hero_url']) {
    assert.match(cua, new RegExp(`right\\(coalesce\\(org\\.${col}, ''\\), char_length\\(o\\.bucket_id \\|\\| '/' \\|\\| o\\.name\\)\\) = o\\.bucket_id \\|\\| '/' \\|\\| o\\.name`));
  }
});

test('logo_url, escrivible i públic, té la mateixa regla que hero_url, sense bloquejar cap fila vella', () => {
  assert.match(CODI, /add constraint organizations_logo_url_valida check \(\s*logo_url is null\s+or logo_url = ''\s+or \(char_length\(logo_url\) <= 2048 and logo_url ~ '\^\(https:\/\/\|sdp-media:\/\/mitjans\/\|\/\[\^\/\]\)'\)\s*\)/i);
  assert.match(CODI, /conrelid = 'public\.organizations'::regclass and conname = 'organizations_logo_url_valida'/i);
  assert.match(CODI, /raise notice 'SDP-PERFIL-002/i);
  // La restricció es posa abans d'obrir l'escriptura de la columna.
  assert.ok(CODI.search(/add constraint organizations_logo_url_valida/i) < CODI.search(/grant update \(logo_url, hero_url, presentacio_html\)/i));
});

test('D12: la baixa retira el nom i la foto de les metadades de GoTrue i la cancel·lació els torna', () => {
  const CLAUS = /array\['full_name', 'name', 'avatar_url', 'picture', 'bio'\]/;
  const demana = funcio('public', 'demana_baixa').cos;
  // Primer a la instantània, després fora d'auth.users (millor esforç).
  assert.match(demana, new RegExp(`e\\.key = any \\(${CLAUS.source}\\)`));
  assert.match(demana, /'metadades', v_meta\)/);
  const retira = demana.search(/update auth\.users u\s+set raw_user_meta_data = u\.raw_user_meta_data - array\[/i);
  assert.ok(retira > demana.search(/insert into private\.baixes/i), 'la instantània ha d\'anar abans de retirar res');
  assert.match(demana.slice(retira), /exception when insufficient_privilege then\s+raise notice 'SDP-BAIXA-021/i);
  const cancela = funcio('public', 'cancela_baixa').cos;
  assert.match(cancela, /set raw_user_meta_data = coalesce\(u\.raw_user_meta_data, '\{\}'::jsonb\) \|\| \(v_b\.instantania -> 'metadades'\)/);
  assert.match(cancela, /exception when insufficient_privilege then\s+raise notice 'SDP-BAIXA-022/i);
});

test('D2: la bio (H2 de la persona) té el límit del client, sense bloquejar cap fila vella', () => {
  assert.match(CODI, /add constraint profiles_bio_llargaria check \(char_length\(bio\) <= 500\)/i);
  assert.match(CODI, /elsif exists \(select 1 from public\.profiles where char_length\(bio\) > 500\) then\s+raise notice 'SDP-PERFIL-001/i);
  assert.match(CODI, /conrelid = 'public\.profiles'::regclass and conname = 'profiles_bio_llargaria'/i);
});

test('exportació: federació no versionada sense cap columna endevinada', () => {
  const f = funcio('public', 'exporta_les_meues_dades').cos;
  assert.match(f, /'federacio_no_versionada', v_federacio/);
  assert.match(f, /array\['realms', 'user_realms', 'connections', 'posts'\]/);
  assert.match(f, /to_regclass\(format\('public\.%I', v_taula\)\) is null/);
  assert.match(f, /information_schema\.columns/);
  assert.match(f, /c\.data_type = 'uuid'/);
  assert.match(f, /c\.column_name not in \('id', 'tenant_id'\)/);
  assert.match(f, /format\('t\.%I = \$1', c\.column_name\)/);
  assert.match(f, /using v_uid;/);
  // Cap referència literal a les taules que no són al repositori.
  assert.doesNotMatch(CODI, /\bpublic\.(realms|user_realms|connections|posts)\b/i);
});

test('D2: columnes noves de la fitxa i permisos del contracte', () => {
  assert.match(CODI, /alter table public\.profiles\s+add column if not exists lema text not null default ''\s+constraint \w+ check \(char_length\(lema\) <= 120\)/i);
  assert.match(CODI, /alter table public\.profiles\s+add column if not exists presentacio_html text not null default ''\s+constraint \w+ check \(char_length\(presentacio_html\) <= 20000\)/i);
  assert.match(CODI, /alter table public\.profiles\s+add column if not exists hero_url text/i);
  assert.match(CODI, /alter table public\.profiles\s+add column if not exists baixa_demanada_at timestamptz;/i);
  assert.match(CODI, /alter table public\.organizations\s+add column if not exists presentacio_html text not null default ''/i);
  assert.match(CODI, /alter table public\.organizations\s+add column if not exists hero_url text/i);
  assert.match(CODI, /grant update \(lema, presentacio_html, hero_url\) on table public\.profiles to authenticated;/i);
  assert.match(CODI, /grant select \(logo_url, hero_url, presentacio_html\) on table public\.organizations to anon, authenticated;/i);
  assert.match(CODI, /grant update \(logo_url, hero_url, presentacio_html\) on table public\.organizations to authenticated;/i);
  // La marca de baixa no la pot escriure el client.
  for (const grant of CODI.match(/grant [^;]*on table public\.profiles[^;]*;/gi) || []) {
    assert.doesNotMatch(grant, /baixa_demanada_at/i);
  }
  // Un hero_url buit (el client esborra la capçalera amb '') ha de passar el CHECK.
  assert.equal((CODI.match(/or hero_url = ''/g) || []).length, 2);
  const llista = funcio('public', 'list_my_organizations');
  assert.match(llista.capcalera, /logo_url text,\s+hero_url text,\s+presentacio_html text\s*\)/i);
  assert.match(llista.capcalera, /security\s+invoker/i);
  assert.match(CODI, /drop function if exists public\.list_my_organizations\(uuid\);\s+create function public\.list_my_organizations/i);
});

test('idempotència: cada objecte nou es pot tornar a crear', () => {
  for (const m of CODI.matchAll(/create table (\S+)/gi)) assert.equal(m[1].toLowerCase(), 'if', `create table sense if not exists: ${m[0]}`);
  for (const m of CODI.matchAll(/add column (\S+)/gi)) assert.equal(m[1].toLowerCase(), 'if', `add column sense if not exists: ${m[0]}`);
  for (const m of CODI.matchAll(/create index (\S+)/gi)) assert.equal(m[1].toLowerCase(), 'if', `create index sense if not exists: ${m[0]}`);
  for (const m of CODI.matchAll(/create policy "([^"]+)" on (\S+)/gi)) {
    assert.match(CODI, new RegExp(`drop policy if exists "${escapa(m[1])}" on ${escapa(m[2])};`, 'i'), `política ${m[1]}`);
  }
  for (const m of CODI.matchAll(/create trigger (\w+)\s+[\s\S]*?\son (\S+)\s/gi)) {
    assert.match(CODI, new RegExp(`drop trigger if exists ${m[1]} on ${escapa(m[2])};`, 'i'), `trigger ${m[1]}`);
  }
  for (const m of CODI.matchAll(/create function (\w+)\.(\w+)\(/gi)) {
    assert.match(CODI, new RegExp(`drop function if exists ${m[1]}\\.${m[2]}\\(`, 'i'), `funció ${m[2]}`);
  }
  assert.match(CODI, /on conflict \(clau\) do nothing;/i);
  assert.match(CODI, /on conflict \(versio\) do nothing;/i);
});

test('tota taula pública nova té RLS activa', () => {
  const noves = [...CODI.matchAll(/create table if not exists public\.(\w+)/gi)].map((m) => m[1]);
  assert.deepEqual(noves, ['politiques_privacitat']);
  for (const taula of noves) {
    assert.match(CODI, new RegExp(`alter table public\\.${taula} enable row level security;`, 'i'));
    assert.match(CODI, new RegExp(`revoke all on table public\\.${taula} from public, anon, authenticated;`, 'i'));
  }
  for (const taula of ['consentiments_bloquejats', 'incidencies_alta', 'baixes', 'purga_storage_pendent']) {
    assert.match(CODI, new RegExp(`revoke all on table private\\.${taula} from public, anon, authenticated;`, 'i'));
  }
});

test('D3: el registre de consentiments només admet afegir', () => {
  const immutable = funcio('private', 'consentiments_immutables').cos;
  assert.match(immutable, /if tg_op = 'UPDATE' then\s+raise exception 'SDP-RGPD-010/i);
  assert.match(immutable, /if pg_trigger_depth\(\) <= 1 then\s+raise exception 'SDP-RGPD-011/i);
  assert.match(immutable, /private\.consentiments_bloquejats/i);
  assert.match(CODI, /revoke all on table public\.consentiments from public, anon, authenticated;/i);
  const grant = CODI.match(/grant select \(([^)]+)\)\s+on table public\.consentiments to authenticated;/i);
  assert.ok(grant, 'falta el grant de columnes de consentiments');
  assert.doesNotMatch(grant[1], /ip_hash|user_agent|subjecte_hash/);
  assert.doesNotMatch(CODI, /grant (insert|update|delete)[^;]*public\.consentiments/i);
});
