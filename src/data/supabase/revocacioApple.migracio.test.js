/* T1 (261024; P0-04, App Store 5.1.1(v); auditoria Codex 261024_1315 C-01) ·
   Prova estàtica de la migració 2610241420_revocacio_apple.sql. No hi ha cap
   base de dades: es llig el SQL i es comproven la capçalera (NO aplicada,
   l'aplica el Mestre), la transacció, les dues taules privades amb tots els
   permisos revocats (mandat Supabase 30-Oct-2026), l'ajust de l'espera, les
   quatre RPC SECURITY DEFINER només per a service_role amb la porta
   auth.role(), el vincle A/B a auth.identities, l'ordre del registre, que no
   redefinix cap funció existent (la purga és de 2610241440, T8), que cap URL
   ni cap secret entra a la base, que la funció compte-apple i el client criden
   estes RPC amb els mateixos noms, i l'entrada de supabase/README.md.
   Els noms vetats a src/ (la frontera de gestor.test.js) no s'escriuen ací. */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from 'vitest';

/* vitest s'executa des de l'arrel del repositori (com moderacio.migracio.test.js). */
const ARREL = process.cwd();
const NOM = '2610241420_revocacio_apple.sql';
const MIGRACIONS = path.join(ARREL, 'supabase/migrations');
const SQL = readFileSync(path.join(MIGRACIONS, NOM), 'utf8');
const GESTOR = readFileSync(path.join(ARREL, 'supabase/functions/compte-apple/gestor.js'), 'utf8');
const COMPTE = readFileSync(path.join(ARREL, 'src/data/supabase/compte.js'), 'utf8');
const AUTH = readFileSync(path.join(ARREL, 'src/data/supabase/auth.js'), 'utf8');
const README = readFileSync(path.join(ARREL, 'supabase/README.md'), 'utf8');
/* Sense comentaris de línia: es comprova el codi, no la prosa. */
const CODI = SQL.split('\n').map((linia) => linia.replace(/--.*$/, '')).join('\n');
const CAPCALERA = SQL.slice(0, SQL.search(/^begin;/m));
const SENSE_ESPAIS = (text) => text.replace(/\s+/g, ' ').trim().toLowerCase();
const LINIES = SQL.split('\n');
const ROLS = 'from public, anon, authenticated, service_role;';
const PORTA = "if coalesce((select auth.role()), '') <> 'service_role' then raise exception 'sdp-apple-000: només el servidor.' using errcode = '42501'; end if;";

const RPC = Object.freeze({
  apple_desa_autoritzacio: 'uuid, text, text, text',
  apple_autoritzacio_de: 'uuid',
  apple_revocacions_pendents: 'integer',
  apple_registra_revocacio: 'uuid, text, text, text, text'
});

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
    eixida.push({ esquema: m[1].toLowerCase(), nom: m[2].toLowerCase(), params: SENSE_ESPAIS(m[3]), capcalera: SENSE_ESPAIS(m[4]), cos: sql.slice(inici, fi) });
    re.lastIndex = fi + tanca.length;
  }
  return eixida;
}
const FUNCIONS = funcions(CODI);
const funcio = (nom) => FUNCIONS.find((f) => f.esquema === 'public' && f.nom === nom);
const llistaDelCheck = (columna) => {
  const m = new RegExp(`check \\(${columna} in \\(([^)]*)\\)\\)`, 'i').exec(CODI);
  return m ? [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]) : null;
};

test('el nom segueix el format, va després de 2610220240 i abans de la purga de T8 (2610241440)', () => {
  expect(NOM).toMatch(/^\d{10}_[a-z0-9_]+\.sql$/);
  const ordre = readdirSync(MIGRACIONS).filter((f) => f.endsWith('.sql')).sort();
  expect(ordre.indexOf(NOM)).toBeGreaterThan(ordre.indexOf('2610220240_xat_adjunts_i_quota.sql'));
  expect(NOM < '2610241440').toBe(true);
});

test('la capçalera: QUÈ FA, QUÈ NO FA, CODIS i Depén de; NO aplicada i l’aplica el Mestre, en UNA línia', () => {
  expect(SQL).toMatch(/^-- =+\n-- 261024_1420 · T1 \(P0-04\)/);
  for (const apartat of ['-- QUÈ FA:', '-- QUÈ NO FA:', '-- CODIS', '-- Depén de:']) {
    expect(LINIES.filter((l) => l.startsWith(apartat)), apartat).toHaveLength(1);
  }
  expect(CAPCALERA).toMatch(/NO aplicada/);
  expect(LINIES.filter((l) => /L'aplica el Mestre, mai un agent\./.test(l))).toHaveLength(1);
  expect(CAPCALERA).toMatch(/C-01/);
  expect(CAPCALERA).toMatch(/2610241440/);
});

test('els codis SDP-APPLE-000…002 són a la capçalera i al codi, amb el seu errcode', () => {
  expect(CAPCALERA).toMatch(/SDP-APPLE-000 [^\n]*\(42501\)/);
  expect(CAPCALERA).toMatch(/SDP-APPLE-001 [^\n]*\(42501\)/);
  expect(CAPCALERA).toMatch(/SDP-APPLE-002 [^\n]*\(22023\)/);
  /* Un literal SQL pot portar l'apòstrof doblat (d''Apple). */
  expect(CODI).toMatch(/'SDP-APPLE-000: (?:[^']|'')+' using errcode = '42501'/);
  expect(CODI).toMatch(/'SDP-APPLE-001: (?:[^']|'')+' using errcode = '42501'/);
  expect(CODI).toMatch(/'SDP-APPLE-002: (?:[^']|'')+' using errcode = '22023'/);
});

test('una sola transacció amb temps d’espera curts, i recarrega l’esquema de PostgREST abans del commit', () => {
  expect(CODI.trimStart()).toMatch(/^begin;/i);
  expect((CODI.match(/^\s*begin;\s*$/gim) || []).length).toBe(1);
  expect((CODI.match(/^\s*commit;\s*$/gim) || []).length).toBe(1);
  expect(CODI).toMatch(/begin;\nset local lock_timeout = '5s';\nset local statement_timeout = '60s';/);
  expect(CODI.trimEnd()).toMatch(/notify pgrst, 'reload schema';\s*commit;$/);
});

test('l’ajust de l’espera: dies_espera_revocacio_apple = 7, sense trepitjar un valor ja posat', () => {
  expect(SENSE_ESPAIS(CODI)).toContain("insert into private.ajustos (clau, valor) values ('dies_espera_revocacio_apple', '7') on conflict (clau) do nothing;");
});

test('la custòdia: private.autoritzacions_apple amb els noms que usarà la purga (T8), en cascada amb auth.users', () => {
  const net = SENSE_ESPAIS(CODI);
  expect(net).toContain('create table if not exists private.autoritzacions_apple (');
  expect(net).toContain('user_id uuid primary key references auth.users (id) on delete cascade');
  for (const columna of ['client_id text not null', 'testimoni_xifrat text not null', 'desat_al timestamptz not null default now()',
    'intents integer not null default 0', 'ultim_error text', 'ultim_intent_al timestamptz']) {
    expect(net, columna).toContain(columna);
  }
  expect(net).toContain("check (char_length(testimoni_xifrat) between 40 and 4096 and testimoni_xifrat ~ '^[a-za-z0-9+/]+={0,2}$')");
  expect(net).toContain('check (ultim_error is null or char_length(ultim_error) <= 200)');
});

test('el registre: private.revocacions_apple sense clau forana, amb les llistes tancades d’origen i resultat', () => {
  const net = SENSE_ESPAIS(CODI);
  const taula = net.slice(net.indexOf('create table if not exists private.revocacions_apple ('));
  const definicio = taula.slice(0, taula.indexOf(');'));
  expect(definicio).toContain('id bigint generated always as identity primary key');
  expect(definicio).toContain('subjecte_hash text');
  expect(definicio).toContain('al timestamptz not null default now()');
  expect(definicio).not.toContain('references');
  expect(llistaDelCheck('origen')).toEqual(['baixa', 'cron', 'purga']);
  expect(llistaDelCheck('resultat')).toEqual(['revocat', 'ja_invalid', 'sense_testimoni', 'purgat_sense_revocar']);
  expect(net).toContain('check (detall is null or char_length(detall) <= 200)');
});

test('el mandat: RLS i revoke all als quatre rols a les dues taules, i cap grant de taula', () => {
  for (const taula of ['private.autoritzacions_apple', 'private.revocacions_apple']) {
    expect(CODI).toContain(`alter table ${taula} enable row level security;`);
    expect(CODI).toContain(`revoke all on table ${taula} ${ROLS}`);
  }
  const grantsDeTaula = [...CODI.matchAll(/^\s*grant\b[^;]*\bon\b(?!\s+function)[^;]*;/gim)].map((g) => g[0].trim());
  expect(grantsDeTaula).toEqual([]);
  expect(CODI).not.toMatch(/\bto\s+(?:public|anon|authenticated)\b/i);
});

test('les quatre RPC, i cap altra funció: SECURITY DEFINER, search_path buit i la porta de service_role com a primera sentència', () => {
  expect(FUNCIONS.map((f) => `${f.esquema}.${f.nom}`).sort()).toEqual(Object.keys(RPC).map((n) => `public.${n}`).sort());
  for (const f of FUNCIONS) {
    expect(f.capcalera, f.nom).toContain('security definer');
    expect(f.capcalera, f.nom).toContain("set search_path = ''");
    expect(f.capcalera, f.nom).toContain('language plpgsql');
    const despresDelBegin = SENSE_ESPAIS(f.cos.slice(f.cos.search(/^begin$/m) + 'begin'.length));
    expect(despresDelBegin.startsWith(PORTA), f.nom).toBe(true);
  }
});

test('els permisos de cada RPC: revoke all als quatre rols i execute NOMÉS a service_role', () => {
  for (const [nom, tipus] of Object.entries(RPC)) {
    const signatura = `public.${nom}(${tipus})`;
    expect(CODI.split('\n').filter((l) => l.trim() === `revoke all on function ${signatura} ${ROLS}`), nom).toHaveLength(1);
    expect(CODI.split('\n').filter((l) => l.trim() === `grant execute on function ${signatura} to service_role;`), nom).toHaveLength(1);
  }
  const grants = [...CODI.matchAll(/^\s*grant\b[^;]*;/gim)].map((g) => g[0].trim());
  expect(grants).toHaveLength(Object.keys(RPC).length);
  for (const g of grants) expect(g).toMatch(/^grant execute on function public\.apple_\w+\([^)]*\) to service_role;$/);
});

test('apple_desa_autoritzacio: valida, exigix la identitat d’Apple del mateix subjecte i després desa (vincle A/B)', () => {
  const f = funcio('apple_desa_autoritzacio');
  expect(f.params).toBe('p_user_id uuid, p_sub text, p_client_id text, p_xifrat text');
  const cos = SENSE_ESPAIS(f.cos);
  const valida = cos.indexOf("raise exception 'sdp-apple-002:");
  const identitat = cos.indexOf("if not exists (select 1 from auth.identities i where i.user_id = p_user_id and i.provider = 'apple' and i.provider_id = p_sub) then raise exception 'sdp-apple-001:");
  const desa = cos.indexOf('insert into private.autoritzacions_apple (user_id, client_id, testimoni_xifrat, desat_al, intents, ultim_error, ultim_intent_al)');
  expect(valida).toBeGreaterThan(0);
  expect(identitat).toBeGreaterThan(valida);
  expect(desa).toBeGreaterThan(identitat);
  expect(cos).toContain('on conflict (user_id) do update');
  expect(cos).toContain('intents = 0');
});

test('apple_revocacions_pendents: només les de les baixes, amb el respir de les fallides i un sostre de 200', () => {
  const f = funcio('apple_revocacions_pendents');
  expect(f.params).toBe('p_limit integer default 50');
  const cos = SENSE_ESPAIS(f.cos);
  expect(cos).toContain('from private.autoritzacions_apple a join private.baixes b on b.user_id = a.user_id');
  expect(cos).toContain("where (a.desat_al <= b.demanada_al or b.purga_prevista_al <= now() + interval '1 day')");
  expect(cos).toContain("and (a.ultim_intent_al is null or a.ultim_intent_al < now() - interval '30 minutes')");
  expect(cos).toContain('limit greatest(1, least(coalesce(p_limit, 50), 200))');
  expect(funcio('apple_autoritzacio_de').params).toBe('p_user_id uuid');
});

test('R1-01 (261024 correccions) · apple_revocacions_pendents: primer les no provades, després les provades fa més temps', () => {
  const cos = SENSE_ESPAIS(funcio('apple_revocacions_pendents').cos);
  expect(cos).toContain('order by a.ultim_intent_al asc nulls first, b.purga_prevista_al, a.user_id limit');
  /* Una fila que falla al capdavant per data de purga taparia la resta cada hora. */
  expect(cos).not.toMatch(/order by b\.purga_prevista_al/);
});

test('R1-03 (261024 correccions) · sense_testimoni: només amb la baixa ja demanada i un per persona cada 24 hores', () => {
  const cos = SENSE_ESPAIS(funcio('apple_registra_revocacio').cos);
  const branca = cos.slice(cos.indexOf("if p_resultat = 'sense_testimoni' then"), cos.indexOf('else delete from private.autoritzacions_apple'));
  const custodiat = branca.indexOf('if exists (select 1 from private.autoritzacions_apple a where a.user_id = p_user_id) then return; end if;');
  const baixa = branca.indexOf('if not exists (select 1 from private.baixes b where b.user_id = p_user_id) then return; end if;');
  const dia = branca.indexOf("if exists (select 1 from private.revocacions_apple r where r.subjecte_hash = private.hash_subjecte(p_user_id::text) and r.resultat = 'sense_testimoni' and r.al > now() - interval '24 hours') then return; end if;");
  expect(custodiat).toBeGreaterThanOrEqual(0);
  expect(baixa).toBeGreaterThan(custodiat);
  expect(dia).toBeGreaterThan(baixa);
  /* L'índex que fa barata la comprovació del dia. */
  expect(CODI).toContain('create index if not exists idx_revocacions_apple_subjecte on private.revocacions_apple (subjecte_hash, al desc);');
  /* Els terminals no depenen de la baixa: una revocació feta s'anota sempre. */
  const terminal = cos.slice(cos.indexOf('else delete from private.autoritzacions_apple'));
  expect(terminal).not.toContain('private.baixes');
});

test('apple_registra_revocacio: la fila només desapareix amb el xifrat revocat, i el registre és pseudònim', () => {
  const f = funcio('apple_registra_revocacio');
  expect(f.params).toBe('p_user_id uuid, p_origen text, p_resultat text, p_xifrat text default null, p_detall text default null');
  const cos = SENSE_ESPAIS(f.cos);
  expect(cos).toContain("p_origen not in ('baixa', 'cron')");
  expect(cos).toContain("p_resultat not in ('revocat', 'ja_invalid', 'sense_testimoni', 'fallida')");
  expect(cos).toContain("(p_resultat <> 'sense_testimoni' and p_xifrat is null)");
  expect(cos).toContain("(p_detall is not null and p_detall !~ '^[a-z0-9_:-]{1,60}$')");
  const fallida = cos.indexOf("if p_resultat = 'fallida' then update private.autoritzacions_apple a set intents = a.intents + 1, ultim_error = left(p_detall, 200), ultim_intent_al = now() where a.user_id = p_user_id and a.testimoni_xifrat = p_xifrat; return; end if;");
  const esborra = cos.indexOf('delete from private.autoritzacions_apple a where a.user_id = p_user_id and a.testimoni_xifrat = p_xifrat; get diagnostics v_n = row_count; if v_n = 0 then return; end if;');
  const registre = cos.indexOf('insert into private.revocacions_apple (subjecte_hash, origen, resultat, detall) values (private.hash_subjecte(p_user_id::text), p_origen, p_resultat, p_detall);');
  expect(fallida).toBeGreaterThan(0);
  expect(esborra).toBeGreaterThan(fallida);
  expect(registre).toBeGreaterThan(esborra);
  /* La fila custodiada només l'esborra esta RPC: cap altre delete al fitxer. */
  expect((CODI.match(/delete from private\.autoritzacions_apple/g) || []).length).toBe(1);
});

test('no redefinix cap funció d’una altra migració: ni la purga (és de T8) ni cap de les existents', () => {
  expect(CODI).not.toMatch(/purga_una_baixa|purga_baixes_vencudes|demana_baixa|cancela_baixa/);
  expect(CODI).not.toMatch(/delete from auth\.users/i);
  const altres = readdirSync(MIGRACIONS).filter((f) => f.endsWith('.sql') && f !== NOM);
  for (const fitxer of altres) {
    const text = readFileSync(path.join(MIGRACIONS, fitxer), 'utf8');
    for (const nom of Object.keys(RPC)) expect(text, `${fitxer} · ${nom}`).not.toMatch(new RegExp(`function\\s+public\\.${nom}\\b`, 'i'));
  }
});

test('cap URL, cap crida de xarxa, cap Vault i cap testimoni en clar dins de la base', () => {
  expect(CODI).not.toMatch(/https?:\/\//i);
  expect(CODI).not.toMatch(/appleid/i);
  expect(CODI).not.toMatch(/net\.http_|pg_net|\bhttp\(|vault\./i);
  expect(CODI).not.toMatch(/\brefresh_token\b|client.secret|\bp8\b/i);
});

test('la funció compte-apple i el client criden estes RPC i esta funció amb els mateixos noms', () => {
  const cridades = [...new Set([...GESTOR.matchAll(/'(apple_\w+)'/g)].map((x) => x[1]))].sort();
  expect(cridades).toEqual(Object.keys(RPC).sort());
  const parametres = [...new Set([...GESTOR.matchAll(/\b(p_\w+):/g)].map((x) => x[1]))];
  expect(parametres.length).toBeGreaterThan(5);
  for (const p of parametres) expect(CODI, p).toMatch(new RegExp(`\\b${p}\\b`));
  for (const resultat of ['revocat', 'ja_invalid', 'sense_testimoni', 'fallida']) expect(GESTOR, resultat).toContain(`p_resultat: '${resultat}'`);
  for (const origen of ["'baixa'", "'cron'"]) expect(GESTOR).toContain(origen);
  expect(COMPTE).toContain("'/functions/v1/compte-apple'");
  expect(COMPTE).toContain("accio: 'revoca'");
  expect(AUTH).toContain("'/functions/v1/compte-apple'");
  expect(AUTH).toContain("accio: 'custodia'");
  expect(GESTOR).toContain("new Set(['custodia', 'revoca', 'buida'])");
});

test('el catàleg supabase/README.md la nomena després de 2610220240 i abans de seed.sql, i acaba NO aplicada', () => {
  const posicio = README.indexOf(`- \`migrations/${NOM}\``);
  expect(posicio, 'falta l’entrada al README').toBeGreaterThanOrEqual(0);
  expect(posicio).toBeGreaterThan(README.indexOf('- `migrations/2610220240_xat_adjunts_i_quota.sql`'));
  expect(posicio).toBeLessThan(README.indexOf('- `seed.sql`'));
  const entrada = README.slice(posicio).split('\n\n')[0];
  expect(entrada.trimEnd().endsWith("**NO aplicada: l'aplica el Mestre, mai un agent**.")).toBe(true);
  for (const nom of Object.keys(RPC)) expect(entrada, nom).toContain(`\`${nom}\``);
  expect(SENSE_ESPAIS(entrada)).toContain('revoke all ... from public, anon, authenticated, service_role');
  expect(entrada).toContain('`grant execute on function ... to service_role`');
  expect(entrada).toContain('select count(*) from private.autoritzacions_apple;');
  expect(entrada).toMatch(/2610241440/);
});

test('higiene de fitxer: una sola línia buida final i cap vocabulari prohibit', () => {
  expect(SQL.endsWith(';\n') && !SQL.endsWith('\n\n')).toBe(true);
  expect(SQL).not.toMatch(/offline[- ]first|local[- ]first/i);
});
