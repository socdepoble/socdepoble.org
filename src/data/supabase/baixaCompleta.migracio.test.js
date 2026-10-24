/* T8 (261024; P0-20, auditoria Codex 261024_1315 C-06) · Prova estàtica de
   la migració 2610241440_baixa_completa_ugc_i_fitxers.sql. No hi ha cap base
   de dades: es llig el SQL i es comproven la capçalera (NO aplicada, l'aplica
   el Mestre), la transacció, que private.purga_una_baixa és la de 2609282100
   LITERAL amb els tres canvis i prou (la porta d'Apple abans de
   «delete from auth.users», la neteja dels títols als fils de pàgina de les
   publicacions esborrades i l'esborrat de les publicacions personals, sense
   l'uuid zero), que private.purga_baixes_vencudes és la de 2609261500 LITERAL
   amb l'ordre nou del lot i prou, que el contingut d'una entitat no es toca, les tres RPC del
   worker purga-fitxers (només service_role, guarda auth.role(), FOR UPDATE
   SKIP LOCKED, espera i sostre d'intents), els permisos al peu de la lletra,
   cap pg_net ni http, el contracte amb el worker i l'entrada de
   supabase/README.md. tests/migracio-identitat-f1.test.mjs llig només F1 i no
   es toca: fixa la història, no la versió vigent. */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from 'vitest';

/* vitest s'executa des de l'arrel del repositori (com moderacio.migracio.test.js). */
const ARREL = process.cwd();
const NOM = '2610241440_baixa_completa_ugc_i_fitxers.sql';
const ANTERIOR = '2609282100_xat_de_pagina.sql';
const F1 = '2609261500_identitat_perfil_f1.sql';
const MIGRACIONS = path.join(ARREL, 'supabase/migrations');
const llig = (fitxer) => readFileSync(path.join(MIGRACIONS, fitxer), 'utf8');
const SQL = llig(NOM);
const README = readFileSync(path.join(ARREL, 'supabase/README.md'), 'utf8');
const GESTOR = path.join(ARREL, 'supabase/functions/purga-fitxers/gestor.js');
/* Sense comentaris de línia: es comprova el codi, no la prosa. */
const senseComentaris = (sql) => sql.split('\n').map((linia) => linia.replace(/--.*$/, '')).join('\n');
const CODI = senseComentaris(SQL);
const CAPCALERA = SQL.slice(0, SQL.search(/^begin;/m));
const SENSE_ESPAIS = (text) => text.replace(/\s+/g, ' ').trim().toLowerCase();
const normalitza = (sql) => SENSE_ESPAIS(senseComentaris(sql));
const LINIES = SQL.split('\n');
const migracions = () => readdirSync(MIGRACIONS).filter((f) => f.endsWith('.sql')).sort();

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
const funcio = (esquema, nom) => {
  const f = FUNCIONS.find((x) => x.esquema === esquema && x.nom === nom);
  expect(f, `${esquema}.${nom} absent`).toBeTruthy();
  return f;
};
/** La sentència sencera de create … private.<nom> … $$; d'un fitxer (per defecte, purga_una_baixa). */
const sentenciaPurga = (sql, nom = 'purga_una_baixa') => {
  const inici = sql.search(new RegExp(`create\\s+or\\s+replace\\s+function\\s+private\\.${nom}\\s*\\(`, 'i'));
  expect(inici, `${nom} absent`).toBeGreaterThanOrEqual(0);
  const fi = sql.indexOf('\n$$;', inici);
  expect(fi).toBeGreaterThan(inici);
  return sql.slice(inici, fi + 4);
};

/* Els dos canvis, en forma normalitzada (sense comentaris, espais reduïts, minúscules). */
const DECLARACIO_VELLA = 'declare r record; v_nou uuid; begin';
const DECLARACIO_NOVA = 'declare r record; v_nou uuid; v_dies_apple integer; begin';
const REBAIXA = 'if not found then return false; end if;';
const PORTA_APPLE = [
  "if to_regclass('private.autoritzacions_apple') is not null then",
  'if exists (select 1 from private.autoritzacions_apple a where a.user_id = p_uid) then',
  'begin',
  'select greatest(0, least(a.valor::integer, 30)) into v_dies_apple',
  "from private.ajustos a where a.clau = 'dies_espera_revocacio_apple';",
  'exception when invalid_text_representation then v_dies_apple := null;',
  'end;',
  'v_dies_apple := coalesce(v_dies_apple, 7);',
  'if exists (select 1 from private.baixes b where b.user_id = p_uid',
  'and b.purga_prevista_al > now() - make_interval(days => v_dies_apple)) then',
  "raise exception 'sdp-baixa-030: la revocació d''apple encara és pendent.' using errcode = '55000';",
  'end if;',
  'insert into private.revocacions_apple (subjecte_hash, origen, resultat, detall)',
  "select private.hash_subjecte(p_uid::text), 'purga', 'purgat_sense_revocar', left(a.ultim_error, 200)",
  'from private.autoritzacions_apple a where a.user_id = p_uid;',
  'end if;',
  'end if;'
].join(' ');
const REASSIGNACIO_VELLA = "update public.section_submissions s set owner_user_id = '00000000-0000-0000-0000-000000000000'::uuid, "
  + 'payload = s.payload - private.claus_personals_payload(s.payload, null) where s.owner_user_id = p_uid and s.author_org_id is null;';
const ESBORRAT_NOU = 'delete from public.section_submissions s where s.owner_user_id = p_uid and s.author_org_id is null;';
/* D-02 (Codex 261024; Gemini G2-05.1; R3-10a) · El tercer canvi: els fils de
   pàgina de les publicacions que s'esborren perden la còpia del títol, just
   abans de l'esborrat. */
const TITOL_ESBORRADA = 'Publicació esborrada';
const NETEJA_FILS = [
  `update public.xat_fils f set titol = '${TITOL_ESBORRADA.toLowerCase()}', subjecte_titol = null, subjecte_ruta = null, subjecte_uri = null`,
  'from public.section_submissions s where s.owner_user_id = p_uid and s.author_org_id is null',
  'and f.tenant_id = s.tenant_id and f.subjecte_id = s.id::text',
  "and f.subjecte_tipus = case s.section_id when 'mur' then 'publicacio' when 'mercat' then 'producte'",
  "when 'events' then 'esdeveniment' when 'multimedia' then 'multimedia' end;"
].join(' ');

const VELLA = normalitza(sentenciaPurga(llig(ANTERIOR)));
const NOVA = normalitza(sentenciaPurga(SQL));
const PURGA = funcio('private', 'purga_una_baixa');
const COS_PURGA = SENSE_ESPAIS(PURGA.cos);

/* R1-04 · L'ordre del lot de purga_baixes_vencudes (F1 2609261500). */
const ORDRE_VELL = 'order by b.purga_prevista_al asc limit';
const ORDRE_NOU = 'order by b.ultim_intent_al asc nulls first, b.purga_prevista_al asc limit';

/* Actualitzada a posta (261024 correccions): R1-04 redefinix
   purga_baixes_vencudes en esta migració, i el seu revoke (el de F1, literal)
   va entre el de la purga i els de les RPC del worker. */
const REVOCA_VENCUDES = 'revoke execute on function private.purga_baixes_vencudes(integer) from public, anon, authenticated;';
const REVOCA_RPC = [
  'revoke all on function public.purga_fitxers_reclama(integer) from public, anon, authenticated, service_role;',
  'revoke all on function public.purga_fitxers_fets(bigint[]) from public, anon, authenticated, service_role;',
  'revoke all on function public.purga_fitxers_fallits(bigint[], text) from public, anon, authenticated, service_role;'
];
const GRANTS_RPC = [
  'grant execute on function public.purga_fitxers_reclama(integer) to service_role;',
  'grant execute on function public.purga_fitxers_fets(bigint[]) to service_role;',
  'grant execute on function public.purga_fitxers_fallits(bigint[], text) to service_role;'
];
const PERMISOS = [
  'revoke all on table private.purga_storage_pendent from public, anon, authenticated, service_role;',
  'revoke execute on function private.purga_una_baixa(uuid) from public, anon, authenticated;',
  REVOCA_VENCUDES,
  ...REVOCA_RPC,
  ...GRANTS_RPC
];
const GUARDA = "if coalesce((select auth.role()), '') <> 'service_role' then raise exception 'sdp-purga-000: només el servidor.' using errcode = '42501'; end if;";

test('el nom segueix el format i va després de 2610220240 i de la custòdia d’Apple de T1, si ja hi és', () => {
  expect(NOM).toMatch(/^\d{10}_[a-z0-9_]+\.sql$/);
  const ordre = migracions();
  expect(ordre.indexOf(NOM)).toBeGreaterThan(ordre.indexOf('2610220240_xat_adjunts_i_quota.sql'));
  for (const f of ordre.filter((x) => /create table if not exists private\.autoritzacions_apple/i.test(llig(x)))) {
    expect(ordre.indexOf(NOM), f).toBeGreaterThan(ordre.indexOf(f));
  }
});

test('la capçalera: NO aplicada, l’aplica el Mestre en UNA línia, QUÈ FA, QUÈ NO FA, CODIS i Depén de', () => {
  expect(SQL).toMatch(/^-- =+\n-- 261024_1440 · T8 \(P0-20; pla 261024_1315; auditoria Codex 261024_1315 C-06\)/);
  expect(CAPCALERA).toMatch(/NO aplicada/);
  expect(LINIES.filter((l) => /L'aplica el Mestre, mai un agent/.test(l))).toHaveLength(1);
  for (const apartat of ['QUÈ FA:', 'QUÈ NO FA:', 'CODIS:', 'Depén de:']) expect(CAPCALERA, apartat).toContain(apartat);
  expect(CAPCALERA).toMatch(/ABANS de desplegar la\s*\n?--\s*funció supabase\/functions\/purga-fitxers/);
});

test('els codis SDP-BAIXA-030 i SDP-PURGA-000…002 són a la capçalera i al codi, amb el seu errcode', () => {
  for (const codi of ['SDP-BAIXA-030', 'SDP-PURGA-000', 'SDP-PURGA-001', 'SDP-PURGA-002']) {
    expect(CAPCALERA, `capçalera ${codi}`).toContain(codi);
    expect(CODI, `codi ${codi}`).toContain(codi);
  }
  expect(CODI).toMatch(/SDP-BAIXA-030[^;]*errcode = '55000'/);
  expect(CODI).toMatch(/SDP-PURGA-000[^;]*errcode = '42501'/);
  expect(CODI).toMatch(/SDP-PURGA-001[^;]*errcode = '22023'/);
});

test('una sola transacció amb temps d’espera curts, i recarrega l’esquema de PostgREST abans del commit', () => {
  expect(CODI.trimStart()).toMatch(/^begin;/i);
  expect((CODI.match(/^\s*begin;\s*$/gim) || []).length).toBe(1);
  expect((CODI.match(/^\s*commit;\s*$/gim) || []).length).toBe(1);
  expect(CODI).toMatch(/begin;\nset local lock_timeout = '5s';\nset local statement_timeout = '60s';/);
  expect(CODI.trimEnd()).toMatch(/notify pgrst, 'reload schema';\s*commit;$/);
});

/* Actualitzada a posta (261024 correccions): D-02 afig un tercer canvi, la
   neteja dels títols als fils de pàgina just abans de l'esborrat. La resta de
   la còpia continua sent literal. */
test('private.purga_una_baixa és la de 2609282100 LITERAL amb els tres canvis i prou', () => {
  /* Cada àncora de la versió vella hi és una sola volta: el reemplaçament és determinista. */
  for (const ancora of [DECLARACIO_VELLA, REBAIXA, REASSIGNACIO_VELLA]) {
    expect(VELLA.split(ancora).length - 1, ancora).toBe(1);
  }
  const esperada = VELLA
    .replace(DECLARACIO_VELLA, DECLARACIO_NOVA)
    .replace(REBAIXA, `${REBAIXA} ${PORTA_APPLE}`)
    .replace(REASSIGNACIO_VELLA, `${NETEJA_FILS} ${ESBORRAT_NOU}`);
  expect(NOVA).toBe(esperada);
  /* Mateixa capçalera, mateixos permisos. */
  expect(PURGA.params).toBe('p_uid uuid');
  expect(PURGA.capcalera).toBe("returns boolean language plpgsql volatile security definer set search_path = ''");
  expect(llig(ANTERIOR)).toContain(PERMISOS[1]);
  expect(CODI.split('\n').filter((l) => l.trim() === PERMISOS[1])).toHaveLength(1);
});

test('la porta d’Apple va just després de tornar a bloquejar la baixa i abans de «delete from auth.users»', () => {
  const bloqueig = COS_PURGA.indexOf('for update; if not found then return false; end if;');
  const porta = COS_PURGA.indexOf("if to_regclass('private.autoritzacions_apple') is not null then");
  const raise = COS_PURGA.indexOf("raise exception 'sdp-baixa-030");
  const auditoria = COS_PURGA.indexOf('insert into private.revocacions_apple');
  const grups = COS_PURGA.indexOf('for r in select m.organization_id');
  const usuaris = COS_PURGA.indexOf('delete from auth.users where id = p_uid;');
  expect(bloqueig).toBeGreaterThan(0);
  expect(porta).toBe(bloqueig + 'for update; if not found then return false; end if; '.length);
  expect(raise).toBeGreaterThan(porta);
  expect(auditoria).toBeGreaterThan(raise);
  expect(grups).toBeGreaterThan(auditoria);
  expect(usuaris).toBeGreaterThan(grups);
  /* Dos if: amb un sol «and», la consulta es prepararia encara que la taula no hi fóra. */
  expect(COS_PURGA).not.toMatch(/is not null and exists \(select 1 from private\.autoritzacions_apple/);
  /* Cap uid en clar al registre: l'empremta amb pebre. */
  expect(COS_PURGA).toContain("private.hash_subjecte(p_uid::text), 'purga', 'purgat_sense_revocar'");
});

test('les publicacions personals s’esborren: cap uuid zero, cap reassignació ni cap retall del payload', () => {
  expect(COS_PURGA).not.toContain('00000000-0000-0000-0000-000000000000');
  expect(COS_PURGA).not.toMatch(/update public\.section_submissions/);
  expect(COS_PURGA).not.toContain('claus_personals_payload');
  expect(COS_PURGA).toContain(ESBORRAT_NOU);
  /* Abans de la cua de fitxers: les imatges que només usaven elles deixen d'estar referenciades. */
  const esborrat = COS_PURGA.indexOf(ESBORRAT_NOU);
  const cua = COS_PURGA.indexOf('insert into private.purga_storage_pendent (user_id, bucket_id, nom, referenciat)');
  const referencia = COS_PURGA.indexOf("or exists (select 1 from public.section_submissions s where strpos(s.payload::text, o.bucket_id || '/' || o.name) > 0)");
  expect(esborrat).toBeGreaterThan(COS_PURGA.indexOf('delete from public.notes where owner_user_id = p_uid;'));
  expect(cua).toBeGreaterThan(esborrat);
  expect(referencia).toBeGreaterThan(cua);
});

/* D-02 (Codex 261024, segona passada; Gemini G2-05.1; R3-10a) · Abans, el fil
   de pàgina d'una publicació purgada conservava titol i subjecte_titol, i
   xat_fils_meus els tornava a qui hi havia escrit. */
test('els fils de pàgina de les publicacions esborrades perden la còpia del títol i es queden amb els missatges d’altres persones', () => {
  const neteja = COS_PURGA.indexOf(NETEJA_FILS);
  expect(neteja, 'falta la neteja dels fils').toBeGreaterThan(COS_PURGA.indexOf('delete from public.notes where owner_user_id = p_uid;'));
  /* Just abans de l'esborrat (després ja no se sap quines eren) i amb el mateix filtre. */
  expect(COS_PURGA.indexOf(ESBORRAT_NOU)).toBe(neteja + NETEJA_FILS.length + 1);
  expect(COS_PURGA.split('update public.xat_fils').length - 1).toBe(1);

  /* Només el que ella va escriure: el títol del fil i el títol, la ruta i la
     URI del subjecte. subjecte_tipus i subjecte_id es queden (CHECK
     xat_fils_subjecte_coherent: o els dos o cap). */
  const columnes = /update public\.xat_fils f set (.*?) from /.exec(NETEJA_FILS)[1].split(', ').map((c) => c.split(' = ')[0]);
  expect(columnes).toEqual(['titol', 'subjecte_titol', 'subjecte_ruta', 'subjecte_uri']);
  for (const fixa of ['subjecte_tipus', 'subjecte_id', 'creat_per', 'tenant_id']) expect(columnes).not.toContain(fixa);

  /* Les columnes són les de veres (2609080100 i 2609282100), no les d'una recepta. */
  expect(SENSE_ESPAIS(llig('2609080100_xat_v2.sql'))).toMatch(/create table if not exists public\.xat_fils \([^;]*? titol text,/);
  const pagina = SENSE_ESPAIS(senseComentaris(llig(ANTERIOR)));
  for (const col of ['subjecte_tipus', 'subjecte_id', 'subjecte_ruta', 'subjecte_titol', 'subjecte_uri']) {
    expect(pagina, col).toContain(`alter table public.xat_fils add column if not exists ${col} text;`);
  }
  /* El títol nou cap al CHECK xat_fils_titol_llargaria (2609270200). */
  expect(SENSE_ESPAIS(llig('2609270200_xat_f0_fonament.sql'))).toContain('add constraint xat_fils_titol_llargaria check (char_length(titol) <= 100)');
  expect(TITOL_ESBORRADA.length).toBeLessThanOrEqual(100);
  expect(SQL).toContain(`set titol = '${TITOL_ESBORRADA}',`);

  /* Secció → subjecte: la mateixa correspondència que private.xat_subjecte
     vigent (l'última migració que la definix: 2610042330 a 261024). */
  const definidores = migracions().filter((f) => /create\s+or\s+replace\s+function\s+private\.xat_subjecte\b/i.test(llig(f)));
  expect(definidores.length).toBeGreaterThanOrEqual(1);
  const subjecte = normalitza(sentenciaPurga(llig(definidores.at(-1)), 'xat_subjecte'));
  const casSubjecte = /s\.section_id = case p_tipus (when [^;]*? else '(\w+)' end)/.exec(subjecte);
  expect(casSubjecte, 'xat_subjecte sense la correspondència').toBeTruthy();
  const delSubjecte = Object.fromEntries([...casSubjecte[1].matchAll(/when '(\w+)' then '(\w+)'/g)].map((m) => [m[2], m[1]]));
  delSubjecte[casSubjecte[2]] = 'multimedia';
  expect(subjecte).toContain("elsif p_tipus in ('publicacio', 'producte', 'esdeveniment', 'multimedia') then");
  expect(subjecte).toContain('where s.tenant_id = p_tenant_id and s.id::text = p_id');
  const deLaPurga = Object.fromEntries([...NETEJA_FILS.matchAll(/when '(\w+)' then '(\w+)'/g)].map((m) => [m[1], m[2]]));
  expect(deLaPurga).toEqual(delSubjecte);
  expect(Object.keys(deLaPurga).sort()).toEqual(['events', 'mercat', 'multimedia', 'mur']);

  /* Els missatges i les participacions d'altres persones no es toquen: els
     d'ella se'n van per la cascada d'auth.users. */
  expect(COS_PURGA).not.toMatch(/delete from public\.xat_(missatges|participants|fils f where f\.subjecte)/);
  expect(COS_PURGA).toContain('delete from public.xat_fils f where f.creat_per is null and f.subjecte_tipus is null and not exists');
});

/* R1-04 · Qui espera la revocació d'Apple torna SDP-BAIXA-030 cada dia: amb
   l'ordre de F1 (només per data prevista) es quedava al cap del lot. */
test('private.purga_baixes_vencudes és la de 2609261500 LITERAL amb l’ordre nou del lot i prou', () => {
  const vella = normalitza(sentenciaPurga(llig(F1), 'purga_baixes_vencudes'));
  const nova = normalitza(sentenciaPurga(SQL, 'purga_baixes_vencudes'));
  expect(vella.split(ORDRE_VELL).length - 1).toBe(1);
  expect(nova).toBe(vella.replace(ORDRE_VELL, ORDRE_NOU));
  /* Només F1 i esta la definixen: cap versió intermèdia es desfà. */
  const definidores = migracions().filter((f) => /create\s+or\s+replace\s+function\s+private\.purga_baixes_vencudes\b/i.test(llig(f)));
  expect(definidores).toEqual([F1, NOM]);
  /* Mateixa capçalera i mateix revoke que F1; el lot es fa amb el mateix pany. */
  const f = funcio('private', 'purga_baixes_vencudes');
  expect(f.params).toBe('p_limit integer default 100');
  expect(f.capcalera).toBe("returns integer language plpgsql volatile security definer set search_path = ''");
  expect(llig(F1)).toContain(REVOCA_VENCUDES);
  expect(CODI.split('\n').filter((l) => l.trim() === REVOCA_VENCUDES)).toHaveLength(1);
  /* Un error (SDP-BAIXA-030 inclòs) anota ultim_intent_al: és la clau que la passa darrere. */
  const cos = SENSE_ESPAIS(f.cos);
  expect(cos).toContain('exception when others then update private.baixes set intents = intents + 1, '
    + "ultim_error = left(sqlstate || ': ' || sqlerrm, 500), ultim_intent_al = now() where user_id = r.user_id;");
  expect(cos.indexOf(ORDRE_NOU)).toBeLessThan(cos.indexOf('exception when others'));
  /* La redefinició va després de la purga que crida i no programa res (cap cron). */
  expect(CODI.indexOf('function private.purga_baixes_vencudes')).toBeGreaterThan(CODI.indexOf('function private.purga_una_baixa'));
});

test('el contingut d’una entitat no es toca: l’única escriptura de section_submissions és l’esborrat amb author_org_id null', () => {
  const escriptures = [...SENSE_ESPAIS(CODI).matchAll(/(update|delete from|insert into) public\.section_submissions[^;]*;/g)].map((m) => m[0]);
  expect(escriptures).toEqual([ESBORRAT_NOU]);
  expect(SENSE_ESPAIS(CODI)).not.toMatch(/author_org_id is not null/);
  /* demana_baixa i cancela_baixa (2609291200) no canvien: la quarantena es desfà com abans. */
  expect(CODI).not.toMatch(/function\s+public\.(demana_baixa|cancela_baixa|exporta_les_meues_dades)\b/i);
});

test('la versió vigent és la que esborra: l’última migració que definix la purga no torna a l’uuid zero', () => {
  const definidores = migracions().filter((f) => /create\s+or\s+replace\s+function\s+private\.purga_una_baixa\b/i.test(llig(f)));
  const vigent = normalitza(sentenciaPurga(llig(definidores.at(-1))));
  expect(vigent).toContain(ESBORRAT_NOU);
  expect(vigent).toContain("raise exception 'sdp-baixa-030");
  expect(vigent).not.toContain('00000000-0000-0000-0000-000000000000');
  /* La porta compta amb el bloc per persona de purga_baixes_vencudes (F1): un error no para el lot. */
  const vencudes = migracions().filter((f) => /create\s+or\s+replace\s+function\s+private\.purga_baixes_vencudes\b/i.test(llig(f))).at(-1);
  expect(SENSE_ESPAIS(senseComentaris(llig(vencudes)))).toContain(
    "exception when others then update private.baixes set intents = intents + 1, ultim_error = left(sqlstate || ': ' || sqlerrm, 500), ultim_intent_al = now() where user_id = r.user_id;");
  /* R1-04 · I la vigent passa darrere les que ja han fallat. */
  expect(normalitza(sentenciaPurga(llig(vencudes), 'purga_baixes_vencudes'))).toContain(ORDRE_NOU);
  /* D-02 · La vigent neteja els títols dels fils abans d'esborrar les publicacions. */
  expect(vigent).toContain(`${NETEJA_FILS} ${ESBORRAT_NOU}`);
});

test('la cua: tres columnes noves si no hi són, l’índex de la cua viva i els ajustos sense trepitjar-ne cap', () => {
  expect(CODI).toContain('alter table private.purga_storage_pendent\n  add column if not exists intents integer not null default 0;');
  expect(CODI).toContain('alter table private.purga_storage_pendent\n  add column if not exists ultim_error text check (ultim_error is null or char_length(ultim_error) <= 200);');
  expect(CODI).toContain('alter table private.purga_storage_pendent\n  add column if not exists ultim_intent_al timestamptz;');
  expect(SENSE_ESPAIS(CODI)).toContain('create index if not exists purga_storage_pendent_cua on private.purga_storage_pendent (creat_al, id) where not referenciat and feta_al is null;');
  expect(SENSE_ESPAIS(CODI)).toContain("insert into private.ajustos (clau, valor) values ('dies_espera_revocacio_apple', '7'), ('purga_fitxers_max_intents', '10') on conflict (clau) do nothing;");
  /* Cada referència a la cua o a Storage porta l'esquema (search_path buit). */
  expect((CODI.match(/purga_storage_pendent\b/g) || []).length).toBe((CODI.match(/private\.purga_storage_pendent\b/g) || []).length);
  expect((CODI.match(/\bobjects\b/g) || []).length).toBe((CODI.match(/storage\.objects\b/g) || []).length);
});

test('els permisos, al peu de la lletra i cap altre: cap grant a anon ni a authenticated, cap permís de taula', () => {
  const linies = CODI.split('\n').map((l) => l.trim()).filter((l) => /^(grant|revoke)\b/i.test(l));
  expect(linies).toEqual(PERMISOS);
  expect(CODI).not.toMatch(/\bgrant\b[^;]*\bto\b[^;]*\b(anon|authenticated|public)\b/i);
  expect(CODI).not.toMatch(/\bgrant\s+(select|insert|update|delete|all)\b/i);
  /* Els revoke de les RPC van després de crear-les i abans dels grant. */
  const ultimaFuncio = CODI.lastIndexOf('create or replace function');
  for (const linia of [...REVOCA_RPC, ...GRANTS_RPC]) expect(CODI.indexOf(linia), linia).toBeGreaterThan(ultimaFuncio);
  for (const g of GRANTS_RPC) expect(CODI.indexOf(g)).toBeGreaterThan(CODI.indexOf(REVOCA_RPC.at(-1)));
  /* El de purga_baixes_vencudes, just després de redefinir-la. */
  expect(CODI.indexOf(REVOCA_VENCUDES)).toBeGreaterThan(CODI.indexOf('function private.purga_baixes_vencudes'));
});

/* Actualitzada a posta (261024 correccions): R1-04 hi afig la redefinició de
   private.purga_baixes_vencudes (SECURITY DEFINER a F1, i ací igual). */
test('les cinc SECURITY DEFINER tenen el search_path buit, i les tres RPC comencen per la guarda de service_role', () => {
  const definidores = FUNCIONS.filter((f) => /security definer/.test(f.capcalera));
  expect(definidores.map((f) => `${f.esquema}.${f.nom}`).sort()).toEqual([
    'private.purga_baixes_vencudes', 'private.purga_una_baixa', 'public.purga_fitxers_fallits', 'public.purga_fitxers_fets', 'public.purga_fitxers_reclama'
  ]);
  for (const f of definidores) expect(f.capcalera, f.nom).toContain("set search_path = ''");
  expect(funcio('public', 'purga_fitxers_reclama').params).toBe('p_limit integer default 50');
  expect(funcio('public', 'purga_fitxers_fets').params).toBe('p_ids bigint[]');
  expect(funcio('public', 'purga_fitxers_fallits').params).toBe('p_ids bigint[], p_error text');
  for (const nom of ['purga_fitxers_reclama', 'purga_fitxers_fets', 'purga_fitxers_fallits']) {
    const cos = SENSE_ESPAIS(funcio('public', nom).cos);
    expect(cos.slice(cos.indexOf(' begin ') + ' begin '.length).startsWith(GUARDA), nom).toBe(true);
  }
});

test('purga_fitxers_reclama: SKIP LOCKED, suma l’intent, espera exponencial, sostre d’intents i cap fila conservada', () => {
  const f = funcio('public', 'purga_fitxers_reclama');
  const cos = SENSE_ESPAIS(f.cos);
  expect(f.capcalera).toBe("returns table (id bigint, bucket_id text, nom text, intents integer) language plpgsql volatile security definer set search_path = ''");
  expect(cos).toContain('#variable_conflict use_column');
  expect(cos).toContain("select greatest(1, least(a.valor::integer, 100)) into v_maxim from private.ajustos a where a.clau = 'purga_fitxers_max_intents'; exception when invalid_text_representation then v_maxim := null; end; v_maxim := coalesce(v_maxim, 10);");
  expect(cos).toContain('where not c.referenciat and c.feta_al is null and c.intents < v_maxim');
  expect(cos).toContain("and (c.ultim_intent_al is null or c.ultim_intent_al <= now() - least(make_interval(mins => (5 * 2 ^ least(c.intents, 9))::integer), interval '1 day'))");
  expect(cos).toContain('order by c.creat_al, c.id limit greatest(1, least(coalesce(p_limit, 50), 200)) for update of c skip locked');
  expect(cos).toContain('update private.purga_storage_pendent p set intents = p.intents + 1, ultim_intent_al = now() from triades t where p.id = t.id returning p.id, p.bucket_id, p.nom, p.intents;');
});

test('purga_fitxers_fets només lleva les files reclamades sense objecte a Storage; fallits només anota l’error, tallat', () => {
  const fets = SENSE_ESPAIS(funcio('public', 'purga_fitxers_fets').cos);
  expect(fets).toContain("if p_ids is null or cardinality(p_ids) not between 1 and 1000 then raise exception 'sdp-purga-001: paràmetre invàlid.' using errcode = '22023';");
  expect(fets).toContain('delete from private.purga_storage_pendent p where p.id = any (p_ids) and not p.referenciat and p.feta_al is null and p.intents > 0 '
    + 'and not exists (select 1 from storage.objects o where o.bucket_id = p.bucket_id and o.name = p.nom);');
  expect(fets).toContain("set ultim_error = 'sdp-purga-002: l''objecte encara és a storage.'");
  expect(fets.indexOf('get diagnostics v_fetes = row_count;')).toBeGreaterThan(fets.indexOf('delete from private.purga_storage_pendent'));
  expect(fets.indexOf('update private.purga_storage_pendent')).toBeGreaterThan(fets.indexOf('get diagnostics v_fetes = row_count;'));
  const fallits = SENSE_ESPAIS(funcio('public', 'purga_fitxers_fallits').cos);
  expect(fallits).toContain("set ultim_error = left(coalesce(nullif(btrim(p_error), ''), 'sense detall'), 200) where p.id = any (p_ids) and p.feta_al is null and p.intents > 0;");
  expect(fallits).not.toMatch(/intents\s*=/);
});

test('cap pg_net, cap http, cap Vault, cap cron, cap extensió ni cap secret dins de la migració', () => {
  expect(CODI).not.toMatch(/\bpg_net\b|\bnet\.http|https?:|\bhttp\b|\bvault\.|\bcron\.|create\s+extension|service_role_key|sdp_cron_secret/i);
});

test('el contracte amb el worker: les mateixes RPC, els mateixos paràmetres i les columnes que llig', () => {
  const gestor = readFileSync(GESTOR, 'utf8');
  expect(gestor).toContain("rpc('purga_fitxers_reclama', { p_limit:");
  expect(gestor).toContain("rpc('purga_fitxers_fets', { p_ids:");
  expect(gestor).toContain("rpc('purga_fitxers_fallits', { p_ids: ids, p_error:");
  for (const columna of ['id', 'bucket_id', 'nom']) expect(gestor).toContain(`f?.${columna}`);
  expect(gestor).toContain('/storage/v1/object/');
  expect(gestor).toContain('prefixes: noms');
});

/* La porta usa les taules de T1 (2610241420): si la migració ja és a l'arbre,
   les columnes i els valors dels CHECK han de casar amb els que s'hi escriuen. */
const T1 = migracions().find((f) => /create table if not exists private\.revocacions_apple/i.test(llig(f)));
test.runIf(Boolean(T1))('les taules de T1 casen amb la porta: user_id i ultim_error; origen «purga» i resultat «purgat_sense_revocar»', () => {
  const t1 = SENSE_ESPAIS(senseComentaris(llig(T1)));
  expect(t1).toMatch(/create table if not exists private\.autoritzacions_apple \( user_id uuid primary key references auth\.users \(id\) on delete cascade,/);
  expect(t1).toMatch(/ultim_error text (constraint \w+ )?check \(ultim_error is null or char_length\(ultim_error\) <= 200\)/);
  expect(t1).toMatch(/check \(origen in \([^)]*'purga'[^)]*\)\)/);
  expect(t1).toMatch(/check \(resultat in \([^)]*'purgat_sense_revocar'[^)]*\)\)/);
  expect(t1).toMatch(/subjecte_hash text,/);
  expect(t1).toMatch(/detall text (constraint \w+ )?check \(detall is null or char_length\(detall\) <= 200\)/);
});

test('el catàleg supabase/README.md la nomena després de 2610220240 i abans de seed.sql, en un sol paràgraf que acaba NO aplicada', () => {
  const posicio = README.indexOf(`migrations/${NOM}`);
  expect(posicio, 'falta l’entrada al README').toBeGreaterThanOrEqual(0);
  expect(posicio).toBeGreaterThan(README.indexOf('migrations/2610220240_xat_adjunts_i_quota.sql'));
  expect(posicio).toBeLessThan(README.indexOf('- `seed.sql`'));
  const entrada = README.slice(posicio).split('\n\n')[0];
  expect(entrada.trimEnd()).toMatch(/\*\*NO aplicada: l'aplica el Mestre, mai un agent\*\*\.?$/);
  for (const text of ['SDP-BAIXA-030', 'SDP-PURGA-000', 'purga_fitxers_reclama', 'purga_fitxers_fets', 'purga_fitxers_fallits',
    'dies_espera_revocacio_apple', 'purga_fitxers_max_intents', 'baixaCompleta.migracio.test.js', '2610241420',
    'purga_baixes_vencudes', 'ultim_intent_al', `'${TITOL_ESBORRADA}'`, 'subjecte_titol']) {
    expect(entrada, text).toContain(text);
  }
  for (const linia of GRANTS_RPC) expect(entrada, linia).toContain(linia);
  /* D-02 ja no és pendent: el README no torna a dir que el títol es conserva. */
  expect(entrada).not.toMatch(/la còpia del títol\)/);
  expect(entrada).not.toMatch(/offline[- ]first|local[- ]first/i);
});

test('el README explica la funció purga-fitxers al final i la secció de la baixa ja no diu que falta el worker', () => {
  const seccio = README.indexOf('## Funció `purga-fitxers` (cua de fitxers de la baixa)');
  expect(seccio, 'falta la secció').toBeGreaterThan(README.indexOf('## Vincles'));
  const text = README.slice(seccio);
  for (const peca of ['SUPABASE_SERVICE_ROLE_KEY', 'SDP_CRON_SECRET', 'x-sdp-cron', '03:17', '47 * * * *', 'purga_fitxers_max_intents',
    'supabase functions deploy purga-fitxers --no-verify-jwt', 'SDP-PURGA-002', 'update private.purga_storage_pendent set intents = 0']) {
    expect(text, peca).toContain(peca);
  }
  const baixa = README.slice(README.indexOf('## Baixa, purga i consentiment'), README.indexOf('## Xat F0'));
  expect(baixa).not.toContain('Falta la peça que buida la cua');
  expect(baixa).toContain('**La porta d\'Apple**');
  expect(baixa).toContain('**Què esborra la purga.**');
  expect(baixa).toContain('`purga-fitxers`');
  expect(README.endsWith('\n') && !README.endsWith('\n\n')).toBe(true);
});

test('la funció purga-fitxers és on diu el README', () => {
  for (const f of ['index.ts', 'gestor.js', 'gestor.test.js']) {
    expect(existsSync(path.join(ARREL, 'supabase/functions/purga-fitxers', f)), f).toBe(true);
  }
});

test('higiene de fitxer: una sola línia buida final i cap vocabulari prohibit', () => {
  expect(SQL.endsWith(';\n') && !SQL.endsWith('\n\n')).toBe(true);
  expect(SQL).not.toMatch(/offline[- ]first|local[- ]first/i);
  expect(SQL).not.toMatch(/[ \t]+$/m);
});
