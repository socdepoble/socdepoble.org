/* Onada 11 (261010; prompt 261010_1730, tasca 2) · Prova estàtica de la
   migració 2610101900_personalitzacio_superadmin.sql. No hi ha cap base de
   dades: es llig el SQL i es comproven les tres polítiques de lectura
   d'app_content (amb 'taxonomia' i 'estil', i sense 'agents'), la taula de
   l'historial, les dues RPC (forma, guarda, codis, permisos) i que els noms i
   paràmetres són els que crida l'adaptador personalitzacio.js. */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from 'vitest';

/* vitest s'executa des de l'arrel del repositori (com qualitat.test.js). */
const ARREL = process.cwd();
const NOM = '2610101900_personalitzacio_superadmin.sql';
const MIGRACIONS = path.join(ARREL, 'supabase/migrations');
const SQL = readFileSync(path.join(MIGRACIONS, NOM), 'utf8');
const CLIENT = readFileSync(path.join(ARREL, 'src/data/supabase/personalitzacio.js'), 'utf8');
const README = readFileSync(path.join(ARREL, 'supabase/README.md'), 'utf8');
/* Sense comentaris de línia: es comprova el codi, no la prosa. */
const CODI = SQL.split('\n').map((linia) => linia.replace(/--.*$/, '')).join('\n');
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
    expect(fi, `cos sense tancar a ${m[1]}.${m[2]}`).toBeGreaterThan(inici);
    eixida.push({ esquema: m[1].toLowerCase(), nom: m[2].toLowerCase(), params: SENSE_ESPAIS(m[3]), capcalera: m[4], cos: sql.slice(inici, fi) });
    re.lastIndex = fi + tanca.length;
  }
  return eixida;
}
const FUNCIONS = funcions(CODI);
const funcio = (nom) => FUNCIONS.find((f) => f.esquema === 'public' && f.nom === nom);
const DESA = funcio('admin_desa_contingut');
const HISTORIAL = funcio('admin_historial_contingut');
const CLAUS_DE_LECTURA = ['towns', 'pages', 'feedPosts', 'marketItems', 'events', 'mediaItems', 'onboarding', 'taxonomia', 'estil'];

test('el nom segueix el format de les migracions i va després de 2610090100 i de 2610061448', () => {
  expect(NOM).toMatch(/^\d{10}_[a-z0-9_]+\.sql$/);
  const ordre = readdirSync(MIGRACIONS).filter((f) => f.endsWith('.sql')).sort();
  expect(ordre.indexOf(NOM)).toBeGreaterThan(ordre.indexOf('2610090100_convergencia_xat_de_pagina.sql'));
  expect(ordre.indexOf(NOM)).toBeGreaterThan(ordre.indexOf('2610061448_superadmin_aal2.sql'));
});

test('la capçalera diu què fa, que NO està aplicada, que va ABANS del client i que agents és decisió del Mestre', () => {
  expect(SQL).toMatch(/^-- =+\n-- 261010_1900 · /);
  expect(SQL).toMatch(/NO aplicada/);
  expect(SQL).toMatch(/ABANS de publicar el client/);
  expect(SQL).toMatch(/NO s'afig 'agents'/);
});

test('una sola transacció amb temps d’espera curts, i recarrega l’esquema de PostgREST abans del commit', () => {
  expect(CODI.trimStart()).toMatch(/^begin;/i);
  expect((CODI.match(/^\s*begin;\s*$/gim) || []).length).toBe(1);
  expect((CODI.match(/^\s*commit;\s*$/gim) || []).length).toBe(1);
  expect(CODI).toMatch(/begin;\s*set local lock_timeout = '5s';\s*set local statement_timeout = '60s';/i);
  expect(CODI).toMatch(/notify pgrst, 'reload schema';\s*commit;\s*$/i);
});

/* ── Les polítiques de lectura d'app_content ── */
const POLITIQUES = [...CODI.matchAll(/create policy "([^"]+)" on public\.app_content\s+(as restrictive\s+)?for select to ([\w, ]+)\s+using \(([\s\S]*?)\);/gi)]
  .map((m) => ({ nom: m[1], restrictiva: Boolean(m[2]), rols: m[3].trim(), condicio: SENSE_ESPAIS(m[4]) }));
const llistaDeClaus = (condicio) => /key in \(([^)]*)\)/.exec(condicio)?.[1].split(',').map((c) => c.trim().replace(/'/g, '')) ?? [];

test('les tres polítiques de lectura de 2609200300 es tornen a crear, cada una amb drop if exists davant', () => {
  expect(POLITIQUES.map((p) => p.nom)).toEqual(['app_content lectura publica', 'sdp app_content anon frontera', 'sdp app_content auth frontera']);
  for (const p of POLITIQUES) {
    expect(CODI).toMatch(new RegExp(`drop policy if exists "${p.nom}" on public\\.app_content;\\s*create policy "${p.nom}"`, 'i'));
  }
  expect(POLITIQUES[0].restrictiva).toBe(false);
  expect(POLITIQUES[0].rols).toBe('anon, authenticated');
  expect(POLITIQUES[1]).toMatchObject({ restrictiva: true, rols: 'anon' });
  expect(POLITIQUES[2]).toMatchObject({ restrictiva: true, rols: 'authenticated' });
  expect(POLITIQUES[2].condicio).toMatch(/or \(select private\.es_superadmin\(\)\)$/);
});

test('les tres polítiques porten taxonomia i estil, les set claus d’abans, i NO agents', () => {
  for (const p of POLITIQUES) {
    const claus = llistaDeClaus(p.condicio);
    expect(claus, p.nom).toEqual(CLAUS_DE_LECTURA.map((c) => c.toLowerCase()));
    expect(claus).not.toContain('agents');
  }
  expect(CODI).not.toMatch(/'agents'/);
  /* Cap política d'escriptura d'app_content: hi escriu només la RPC. */
  expect(CODI).not.toMatch(/create policy "[^"]+" on public\.app_content\s+(as restrictive\s+)?for (insert|update|delete|all)/i);
});

/* ── La taula de l'historial ── */
const TAULA = /create table if not exists public\.app_content_historial \(([\s\S]*?)\n\);/i.exec(CODI)?.[1] ?? '';

test('historial: columnes, claus només taxonomia i estil, RLS, revoke all i només SELECT per a la superadmin', () => {
  expect(TAULA).toBeTruthy();
  const taula = SENSE_ESPAIS(TAULA);
  expect(taula).toMatch(/id bigserial primary key/);
  expect(taula).toMatch(/tenant_id uuid not null references public\.towns \(id\) on delete cascade/);
  expect(taula).toMatch(/key text not null check \(key in \('taxonomia', 'estil'\)\)/);
  expect(taula).toMatch(/payload jsonb not null/);
  expect(taula).toMatch(/version integer not null/);
  expect(taula).toMatch(/autor uuid references auth\.users \(id\) on delete set null/);
  expect(taula).toMatch(/creat timestamptz not null default now\(\)/);
  expect(CODI).toMatch(/alter table public\.app_content_historial enable row level security;/i);
  expect(CODI).toMatch(/revoke all on table public\.app_content_historial from public, anon, authenticated;/i);
  expect(CODI).toMatch(/grant select on table public\.app_content_historial to authenticated;/i);
  expect(CODI).not.toMatch(/grant (insert|update|delete|all)[^;]*app_content_historial/i);
  const politiques = [...CODI.matchAll(/create policy "[^"]+" on public\.app_content_historial\s+for (\w+) to (\w+)\s+using \(([\s\S]*?)\);/gi)];
  expect(politiques).toHaveLength(1);
  expect(politiques[0][1].toLowerCase()).toBe('select');
  expect(politiques[0][2].toLowerCase()).toBe('authenticated');
  expect(SENSE_ESPAIS(politiques[0][3])).toBe('(select private.es_superadmin())');
  expect(CODI).not.toMatch(/using\s*\(\s*true\s*\)/i);
});

/* ── Les RPC ── */
test('forma: les dues RPC, security definer, search_path buit, i cap funció de private es toca', () => {
  expect(FUNCIONS).toHaveLength(2);
  expect(DESA && HISTORIAL, 'falten RPC').toBeTruthy();
  expect(DESA.params).toBe('p_tenant_id uuid, p_clau text, p_payload jsonb, p_versio integer');
  expect(HISTORIAL.params).toBe('p_tenant_id uuid, p_clau text');
  for (const f of [DESA, HISTORIAL]) {
    expect(f.capcalera, f.nom).toMatch(/security\s+definer/i);
    expect(f.capcalera, f.nom).toMatch(/set\s+search_path\s*=\s*''/i);
    expect(f.capcalera, f.nom).toMatch(/language plpgsql/i);
  }
  expect(DESA.capcalera).toMatch(/returns jsonb\s+language plpgsql\s+volatile/i);
  expect(HISTORIAL.capcalera).toMatch(/returns setof public\.app_content_historial\s+language plpgsql\s+stable/i);
  expect(CODI).not.toMatch(/set\s+search_path\s*=\s*public/i);
  expect(CODI).not.toMatch(/function\s+private\./i);
});

test('guarda: cada RPC llança SDP-ADMIN-003 (42501) amb es_superadmin abans de llegir res', () => {
  for (const f of [DESA, HISTORIAL]) {
    const guarda = f.cos.search(/if not coalesce\(\(select private\.es_superadmin\(\)\), false\) then\s+raise exception 'SDP-ADMIN-003:[^']*' using errcode = '42501';/i);
    expect(guarda, `${f.nom}: falta la guarda`).toBeGreaterThanOrEqual(0);
    const primeraLectura = f.cos.search(/\b(from|into|insert|delete|update)\s+public\./i);
    expect(guarda, `${f.nom}: la guarda va abans de cap lectura`).toBeLessThan(primeraLectura);
    expect(f.cos).toMatch(/p_clau not in \('taxonomia', 'estil'\) then\s+raise exception 'SDP-ADMIN-004:[^']*' using errcode = '22023';/i);
  }
});

test('desa: objecte JSON de fins a 64 KB (005), versió vigent bloquejada i comparada (006, 409), upsert per la clau primària i historial', () => {
  expect(DESA.cos).toMatch(/jsonb_typeof\(p_payload\) <> 'object' or octet_length\(p_payload::text\) > 65536 then\s+raise exception 'SDP-ADMIN-005:[^']*' using errcode = '22023';/i);
  /* `for update` no bloqueja una fila absent: el pany consultiu per (poble, clau) va just abans
     de llegir la versió, perquè dues primeres versions alhora no es trepitgen (patró del xat, 2609282100). */
  expect(DESA.cos).toMatch(/perform pg_advisory_xact_lock\(hashtextextended\('personalitzacio:' \|\| p_tenant_id::text \|\| ':' \|\| p_clau, 0\)\);\s+select c\.version into v_vigent\s+from public\.app_content c\s+where c\.tenant_id = p_tenant_id and c\.key = p_clau\s+for update;/i);
  expect(DESA.cos).toMatch(/v_vigent := coalesce\(v_vigent, 0\);/i);
  expect(DESA.cos).toMatch(/if v_vigent <> coalesce\(p_versio, 0\) then\s+raise exception 'SDP-ADMIN-006:[^']*'[^;]*using errcode = 'PT409';/i);
  expect(DESA.cos).toMatch(/v_nova := v_vigent \+ 1;/i);
  expect(DESA.cos).toMatch(/insert into public\.app_content \(tenant_id, key, payload, version, updated_at\)\s+values \(p_tenant_id, p_clau, p_payload, v_nova, now\(\)\)\s+on conflict \(tenant_id, key\) do update\s+set payload = excluded\.payload, version = excluded\.version, updated_at = now\(\);/i);
  expect(DESA.cos).toMatch(/insert into public\.app_content_historial \(tenant_id, key, payload, version, autor\)\s+values \(p_tenant_id, p_clau, p_payload, v_nova, v_jo\);/i);
  expect(DESA.cos).toMatch(/return jsonb_build_object\('key', p_clau, 'payload', p_payload, 'version', v_nova\);/i);
  /* Les comprovacions van totes abans de la primera escriptura. */
  const escriu = DESA.cos.search(/insert into public\./i);
  for (const codi of ['003', '004', '005', '006']) expect(DESA.cos.search(new RegExp(`SDP-ADMIN-${codi}`)), codi).toBeLessThan(escriu);
});

test('historial: només la clau i el poble demanats, de més nova a més vella, com a màxim 50', () => {
  expect(HISTORIAL.cos).toMatch(/return query\s+select h\.\*\s+from public\.app_content_historial h\s+where h\.tenant_id = p_tenant_id and h\.key = p_clau\s+order by h\.version desc\s+limit 50;/i);
});

test('els codis: SDP-ADMIN-003 a 006, tots presents, i cap altre d’esta família', () => {
  const codis = new Set([...CODI.matchAll(/'(SDP-ADMIN-\d{3}):/g)].map((m) => m[1]));
  expect([...codis].sort()).toEqual(['SDP-ADMIN-003', 'SDP-ADMIN-004', 'SDP-ADMIN-005', 'SDP-ADMIN-006']);
});

test('permisos: revoke a public i anon, grant només a authenticated, el revoke abans del grant', () => {
  for (const firma of ['admin_desa_contingut(uuid, text, jsonb, integer)', 'admin_historial_contingut(uuid, text)']) {
    const escapada = firma.replace(/[()]/g, '\\$&');
    const revoke = CODI.search(new RegExp(`revoke execute on function public\\.${escapada} from public, anon;`, 'i'));
    const grant = CODI.search(new RegExp(`grant execute on function public\\.${escapada} to authenticated;`, 'i'));
    expect(revoke, firma).toBeGreaterThan(0);
    expect(grant, firma).toBeGreaterThan(revoke);
  }
  expect(CODI).not.toMatch(/grant execute on function[^;]*\bto\b[^;]*\b(anon|public)\s*;/i);
});

test('el client crida les dues RPC amb els mateixos noms i paràmetres, i llig la fila que tornen', () => {
  expect(CLIENT).toMatch(/rpc\('admin_desa_contingut', \{ p_clau: nom, p_payload: payload, p_versio: esperada, p_tenant_id: tenantId \}/);
  expect(CLIENT).toMatch(/rpc\('admin_historial_contingut', \{ p_clau: nom, p_tenant_id: tenantId \}/);
  /* El client tradueix pel prefix del missatge: 006 → conflicte, la resta de SDP-ADMIN amb 42501 → segon factor. */
  expect(CLIENT).toMatch(/SDP-ADMIN-006/);
  expect(CLIENT).toMatch(/codiPg === '42501'[^\n]*SDP-ADMIN/);
  /* La fila d'historial porta `creat` i `autor`: el client les llig (també created_at/author, per si de cas). */
  expect(CLIENT).toMatch(/fila\?\.created_at \?\? fila\?\.creat/);
  expect(CLIENT).toMatch(/fila\?\.author \?\? fila\?\.autor/);
});

test('el catàleg supabase/README.md la nomena després de 2610090100 i diu que va abans del client', () => {
  const nom = `migrations/${NOM}`;
  expect(README.includes(nom), 'falta l’entrada al README').toBe(true);
  expect(README.indexOf(nom)).toBeGreaterThan(README.indexOf('migrations/2610090100_convergencia_xat_de_pagina.sql'));
  const entrada = README.slice(README.indexOf(nom)).split('\n\n')[0];
  expect(entrada).toMatch(/abans de publicar el client/i);
  expect(entrada).toMatch(/no aplicada/i);
});
