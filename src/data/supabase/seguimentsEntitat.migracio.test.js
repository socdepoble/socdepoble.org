/* IDEA-22 (pla 261025_0045, T5; Directiva del Mestre 261025) · Prova estàtica
   de la migració 2610250100_seguiments_des_d_entitat.sql: connectar des d'una
   entitat. No hi ha cap base de dades: es llig el SQL i es comproven la
   capçalera (QUÈ FA, QUÈ NO FA, CODIS, Depén de, NO aplicada, l'aplica el
   Mestre), la transacció, la columna seguidor_entitat, els CHECK, els índexs
   únics refets (els nous abans de llevar els vells), la RLS sense cap
   política i els permisos del mandat Supabase 30-Oct-2026, les signatures
   noves amb p_com (la vella llançada abans: PostgREST no tria entre dues
   sobrecàrregues), els REVOKE/GRANT de la signatura nova, SDP-SEG-007 i
   can_manage_organization després del pany, la quota de la persona que
   actua, qui_em_segueix amb seguidor_tipus, l'adaptador seguiments.js i
   l'entrada de supabase/README.md. El parser és el de
   seguiments.migracio.test.js. */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from 'vitest';
import { MISSATGES_SEGUIMENTS } from '../contracte.js';

/* vitest s'executa des de l'arrel del repositori (com qualitat.test.js). */
const ARREL = process.cwd();
const NOM = '2610250100_seguiments_des_d_entitat.sql';
const MIGRACIONS = path.join(ARREL, 'supabase/migrations');
const SQL = readFileSync(path.join(MIGRACIONS, NOM), 'utf8');
const CLIENT = readFileSync(path.join(ARREL, 'src/data/supabase/seguiments.js'), 'utf8');
const README = readFileSync(path.join(ARREL, 'supabase/README.md'), 'utf8');
/* Sense comentaris de línia: es comprova el codi, no la prosa. */
const CODI = SQL.split('\n').map((linia) => linia.replace(/--.*$/, '')).join('\n');
const CAPCALERA = SQL.slice(0, SQL.search(/^begin;/m));
const SENSE_ESPAIS = (text) => text.replace(/\s+/g, ' ').trim().toLowerCase();
const LINIES = SQL.split('\n');
const CODIS_SEG = ['000', '001', '002', '003', '004', '005', '006', '007'].map((n) => `SDP-SEG-${n}`);

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

/* [nom, paràmetres, signatura nova, signatura vella llançada abans o null]. */
const RPC = Object.freeze([
  ['segueix', 'p_tipus text, p_id uuid, p_com uuid default null', '(text, uuid, uuid)', '(text, uuid)'],
  ['deixa_de_seguir', 'p_tipus text, p_id uuid, p_com uuid default null', '(text, uuid, uuid)', '(text, uuid)'],
  ['estat_seguiment', 'p_tipus text, p_id uuid, p_com uuid default null', '(text, uuid, uuid)', '(text, uuid)'],
  ['els_meus_seguiments', '', '()', null],
  ['qui_em_segueix', 'p_org_id uuid default null', '(uuid)', '(uuid)']
]);
const PRIVADES = Object.freeze([
  ['poble_d_entitat_i_persona', '(uuid, uuid)'],
  ['seguiment_d_entitat_viu', '(uuid, text, uuid)'],
  ['entitat_bloquejada_pel_seguit', '(uuid, text, uuid)']
]);
const TEXT_007 = 'No administres l’entitat amb què vols connectar.';

test('el nom segueix el format de les migracions i va després de 2610241430 i de 2610242320', () => {
  expect(NOM).toMatch(/^\d{10}_[a-z0-9_]+\.sql$/);
  const ordre = readdirSync(MIGRACIONS).filter((f) => f.endsWith('.sql')).sort();
  expect(ordre.indexOf(NOM)).toBeGreaterThan(ordre.indexOf('2610241430_seguiments.sql'));
  expect(ordre.indexOf(NOM)).toBeGreaterThan(ordre.indexOf('2610242320_correu_propietaria_nomes_titular.sql'));
  expect(ordre.indexOf('2610241430_seguiments.sql')).toBeGreaterThanOrEqual(0);
});

test('la capçalera: la procedència, QUÈ FA, QUÈ NO FA, CODIS, Depén de i NO aplicada, l’aplica el Mestre, en UNA línia', () => {
  expect(SQL).toMatch(/^-- =+\n-- 261025_0100 · IDEA-22 \(pla 261025_0045, T5; Directiva del Mestre 261025\)/);
  for (const apartat of [/^-- QUÈ FA:$/m, /^-- QUÈ NO FA \(/m, /^-- CODIS \(/m, /^-- Depén de: /m]) expect(CAPCALERA).toMatch(apartat);
  expect(LINIES.filter((l) => /^-- NO aplicada: l'aplica el Mestre, mai un agent\.$/.test(l))).toHaveLength(1);
  expect(CAPCALERA).toMatch(/Idempotent i en una sola transacció/);
  /* El perill de tornar a aplicar la germana després d'esta, dit a la capçalera. */
  expect(CAPCALERA).toMatch(/No es pot tornar a aplicar 2610241430 després d'esta/);
  expect(CAPCALERA).toMatch(/PGRST203/);
});

test('els codis: SDP-SEG-007 és nou (capçalera, codi, contracte, amb el seu text); el codi no en porta cap altre', () => {
  expect(CAPCALERA).toContain('SDP-SEG-007');
  expect(CODI).toContain('SDP-SEG-007');
  expect([...new Set([...CODI.matchAll(/SDP-SEG-\d{3}/g)].map((m) => m[0]))].every((codi) => CODIS_SEG.includes(codi))).toBe(true);
  expect(Object.keys(MISSATGES_SEGUIMENTS).filter((codi) => codi.startsWith('SDP-SEG-')).sort()).toEqual(CODIS_SEG);
  /* Apòstrof tipogràfic, com la resta del contracte. */
  expect(MISSATGES_SEGUIMENTS['SDP-SEG-007']).toBe(TEXT_007);
  /* 007 és un permís: 42501 (com 005), mai 404. */
  const raises007 = [...CODI.matchAll(/raise exception 'SDP-SEG-007:[^;]*;/g)].map((m) => m[0]);
  expect(raises007).toHaveLength(3);
  for (const raise of raises007) expect(raise).toMatch(/using errcode = '42501';$/);
  /* El text de 003 no es toca: el mateix de 2610241430. */
  const germana = readFileSync(path.join(MIGRACIONS, '2610241430_seguiments.sql'), 'utf8');
  const text003 = /'SDP-SEG-003: [^']+'/.exec(germana)[0];
  expect([...CODI.matchAll(/'SDP-SEG-003: [^']+'/g)].map((m) => m[0])).toEqual([text003]);
});

test('cap errcode no es tradueix a 404: runtime.rpc() el donaria per «esquema absent»', () => {
  const errcodes = [...CODI.matchAll(/errcode = '([0-9A-Z]{5})'/g)].map((m) => m[1]);
  expect(errcodes.length).toBeGreaterThan(10);
  expect([...new Set(errcodes)].sort()).toEqual(['22023', '42501', '42900']);
  expect(CODI).not.toMatch(/P0002|42883|42P01/);
});

test('una sola transacció amb temps d’espera curts, i recarrega l’esquema de PostgREST abans del commit', () => {
  expect(CODI.trimStart()).toMatch(/^begin;/i);
  expect((CODI.match(/^\s*begin;\s*$/gim) || []).length).toBe(1);
  expect((CODI.match(/^\s*commit;\s*$/gim) || []).length).toBe(1);
  expect(CODI).toMatch(/begin;\nset local lock_timeout = '5s';\nset local statement_timeout = '60s';/);
  expect(CODI.trimEnd()).toMatch(/notify pgrst, 'reload schema';\s*commit;$/);
  /* Cap CONCURRENTLY: no cap dins d'una transacció. */
  expect(CODI).not.toMatch(/concurrently/i);
});

test('la columna seguidor_entitat: nul·la, de public.organizations, en cascada i idempotent', () => {
  const codi = SENSE_ESPAIS(CODI);
  expect(codi).toContain('alter table public.seguiments add column if not exists seguidor_entitat uuid references public.organizations (id) on delete cascade;');
  expect(codi).not.toMatch(/seguidor_entitat uuid not null/);
  /* Cap altra columna nova ni cap canvi de les de 2610241430. */
  expect(codi.match(/add column/g)).toHaveLength(1);
  expect(codi).not.toMatch(/alter column|drop column|rename/);
});

test('els CHECK: ningú no se seguix a si mateix (persona), una entitat tampoc; idempotents (drop if exists i add)', () => {
  const codi = SENSE_ESPAIS(CODI);
  const dropPersona = codi.indexOf('alter table public.seguiments drop constraint if exists seguiments_no_autoseguiment;');
  const addPersona = codi.indexOf('alter table public.seguiments add constraint seguiments_no_autoseguiment check (seguidor_entitat is not null or seguidor <> seguit_persona);');
  const dropEntitat = codi.indexOf('alter table public.seguiments drop constraint if exists seguiments_entitat_no_autoseguiment;');
  const addEntitat = codi.indexOf('alter table public.seguiments add constraint seguiments_entitat_no_autoseguiment check (seguidor_entitat <> seguit_entitat);');
  expect([dropPersona, addPersona, dropEntitat, addEntitat].every((p) => p > 0)).toBe(true);
  expect(dropPersona < addPersona && dropEntitat < addEntitat).toBe(true);
});

test('els índexs únics: persona i entitat separades, els nous abans de llevar els vells, i un índex per seguidor_entitat', () => {
  const codi = SENSE_ESPAIS(CODI);
  const nous = [
    "create unique index if not exists seguiments_persona_a_persona_unic on public.seguiments (seguidor, seguit_persona) where seguit_tipus = 'persona' and seguidor_entitat is null;",
    "create unique index if not exists seguiments_persona_a_entitat_unic on public.seguiments (seguidor, seguit_entitat) where seguit_tipus = 'entitat' and seguidor_entitat is null;",
    "create unique index if not exists seguiments_entitat_a_persona_unic on public.seguiments (seguidor_entitat, seguit_persona) where seguit_tipus = 'persona' and seguidor_entitat is not null;",
    "create unique index if not exists seguiments_entitat_a_entitat_unic on public.seguiments (seguidor_entitat, seguit_entitat) where seguit_tipus = 'entitat' and seguidor_entitat is not null;"
  ].map((frase) => codi.indexOf(frase));
  const vells = ['drop index if exists public.seguiments_persona_unic;', 'drop index if exists public.seguiments_entitat_unic;'].map((frase) => codi.indexOf(frase));
  expect([...nous, ...vells].every((p) => p > 0), JSON.stringify([...nous, ...vells])).toBe(true);
  expect(Math.max(...nous)).toBeLessThan(Math.min(...vells));
  expect(codi).toContain('create index if not exists idx_seguiments_seguidor_entitat_creat on public.seguiments (seguidor_entitat, creat_al desc) where seguidor_entitat is not null;');
  /* Cap índex únic sense separar persona i entitat. */
  for (const m of codi.matchAll(/create unique index[^;]*;/g)) expect(m[0], m[0]).toMatch(/seguidor_entitat is (not )?null;$/);
});

test('la taula: RLS activa, cap política, i només service_role hi té permís de taula, després de revocar-ho tot', () => {
  expect(CODI).toContain('alter table public.seguiments enable row level security;');
  expect(CODI).not.toMatch(/create policy/i);
  const revoca = CODI.indexOf('revoke all on table public.seguiments from public, anon, authenticated, service_role;');
  const concedix = CODI.indexOf('grant select, insert, update, delete on public.seguiments to service_role;');
  expect(revoca).toBeGreaterThan(0);
  expect(concedix).toBeGreaterThan(revoca);
  const grantsDeTaula = [...CODI.matchAll(/^\s*grant\b[^;]*\bon\b(?!\s+function)[^;]*;/gim)].map((m) => m[0].trim());
  expect(grantsDeTaula).toEqual(['grant select, insert, update, delete on public.seguiments to service_role;']);
  expect(CODI).not.toMatch(/grant[^;]*\bto\b[^;]*\banon\b/i);
  /* El registre de les altes no es toca. */
  expect(CODI).not.toMatch(/(grant|revoke|alter table|create table)[^;]*seguiments_altes/i);
});

test('les funcions: totes SECURITY DEFINER amb el search_path buit; les privades no les crida cap client', () => {
  expect(FUNCIONS.map((f) => `${f.esquema}.${f.nom}`).sort()).toEqual([
    ...PRIVADES.map(([nom]) => `private.${nom}`), ...RPC.map(([nom]) => `public.${nom}`)
  ].sort());
  for (const f of FUNCIONS) {
    expect(f.capcalera, f.nom).toContain('security definer');
    expect(f.capcalera, f.nom).toContain("set search_path = ''");
  }
  for (const [nom, firma] of PRIVADES) {
    expect(CODI).toContain(`revoke all on function private.${nom}${firma} from public, anon, authenticated, service_role;`);
    expect(CODI).not.toMatch(new RegExp(`grant[^;]*private\\.${nom}\\b`, 'i'));
  }
  /* Les privades de 2610241430 i can_manage_organization es criden, no es redefinixen. */
  expect(CODI).not.toMatch(/function\s+private\.(poble_compartit|bloqueig_de_seguiment|seguiment_viu|can_manage_organization)\s*\(/i);
});

test('els noms dels cossos van amb el seu esquema: cap taula ni funció sense qualificar', () => {
  for (const f of FUNCIONS) {
    const nus = [...f.cos.matchAll(/\b(?:from|join|into|update)\s+(?!public\.|private\.|auth\.)([a-z_][a-z0-9_]*)\b/gi)]
      .map((m) => m[1]).filter((nom) => !nom.startsWith('v_'));
    expect(nus, f.nom).toEqual([]);
    /* can_manage_organization, sempre amb el seu esquema (search_path buit). */
    expect(f.cos.replace(/private\.can_manage_organization/g, ''), f.nom).not.toMatch(/can_manage_organization/);
  }
});

test('les RPC: la signatura vella fora abans de la nova, p_com uuid default null, i els REVOKE/GRANT de la signatura nova', () => {
  for (const [nom, params, firma, vella] of RPC) {
    const f = funcio('public', nom);
    expect(f, nom).toBeTruthy();
    expect(f.params, nom).toBe(params);
    expect(f.cos, nom).toMatch(/v_jo\s+uuid := \(select auth\.uid\(\)\);/);
    expect(f.cos, nom).toMatch(/if v_jo is null then\s+raise exception 'SDP-SEG-000: [^']+' using errcode = '42501';/);
    expect(CODI).toContain(`revoke all on function public.${nom}${firma} from public, anon, authenticated, service_role;`);
    expect(CODI.split('\n').filter((l) => l.trim().startsWith('grant ') && l.includes(`public.${nom}(`)))
      .toEqual([`grant execute on function public.${nom}${firma} to authenticated;`]);
    if (vella) {
      const llança = CODI.indexOf(`drop function if exists public.${nom}${vella};`);
      expect(llança, `${nom}: falta el drop de ${vella}`).toBeGreaterThan(0);
      expect(llança).toBeLessThan(f.posicio);
    }
  }
  /* Cap REVOKE ni GRANT amb la signatura (text, uuid): ja no existix. */
  expect(CODI).not.toMatch(/(grant|revoke)[^;]*public\.(segueix|deixa_de_seguir|estat_seguiment)\(text, uuid\)/i);
  /* La de les llistes: els_meus_seguiments no es llança (mateixa forma); qui_em_segueix, sí (canvia el retorn). */
  expect(CODI).not.toMatch(/drop function[^;]*els_meus_seguiments/i);
  expect(funcio('public', 'qui_em_segueix').capcalera).toContain('returns table (id uuid, nom text, creat_al timestamptz, seguidor_tipus text)');
  expect(funcio('public', 'els_meus_seguiments').capcalera).toContain('returns table (tipus text, id uuid, nom text, creat_al timestamptz)');
});

test('segueix: entrada, el pany de la persona, la porta de l’entitat (007) i el seu pany, l’instant, i les portes de sempre en el seu ordre', () => {
  const cos = SENSE_ESPAIS(funcio('public', 'segueix').cos);
  const posicio = (frase) => cos.indexOf(frase);
  const ordre = [
    posicio('if v_jo is null then raise exception \'sdp-seg-000:'),
    posicio("if p_tipus is null or p_tipus not in ('persona', 'entitat') or p_id is null then raise exception 'sdp-seg-001:"),
    posicio("perform pg_advisory_xact_lock(hashtextextended('seguiments:' || v_jo::text, 0));"),
    posicio("if p_com is not null then if not coalesce(private.can_manage_organization(p_com), false) then raise exception 'sdp-seg-007:"),
    posicio("perform pg_advisory_xact_lock(hashtextextended('seguiments:entitat:' || p_com::text, 0)); end if;"),
    posicio('v_ara := clock_timestamp();'),
    posicio("if (p_com is null and ((p_tipus = 'persona' and p_id = v_jo) or (p_tipus = 'entitat' and coalesce(private.can_manage_organization(p_id), false)))) "
      + "or (p_com is not null and p_tipus = 'entitat' and p_id = p_com) then raise exception 'sdp-seg-003:"),
    posicio("if p_com is null and p_tipus = 'persona' then v_poble := private.poble_compartit(v_jo, p_id);"),
    posicio('elsif exists (select 1 from public.profiles p where p.id = v_jo and p.baixa_demanada_at is null) then'),
    posicio('v_poble := private.poble_d_entitat_i_persona(p_com, p_id);'),
    posicio("select o.tenant_id into v_poble from public.organizations o where o.id = p_id and o.visibility = 'public';"),
    posicio('v_bloqueig := private.bloqueig_de_seguiment(v_jo, p_tipus, p_id);'),
    posicio("if v_bloqueig = 'seguidor' then raise exception 'sdp-seg-004:"),
    posicio("if v_poble is null then raise exception 'sdp-seg-002:"),
    posicio('select s.id, s.creat_al, s.reactivat_al, s.deixat_al into v_fila, v_al, v_represa, v_deixat from public.seguiments s '
      + 'where ((p_com is null and s.seguidor = v_jo and s.seguidor_entitat is null) or (p_com is not null and s.seguidor_entitat = p_com)) and (('),
    posicio("if v_fila is not null and v_deixat is null then return jsonb_build_object('seguint', true, 'creat_al', coalesce(v_represa, v_al), 'nou', false, 'primer', false);"),
    posicio("if v_fila is not null and coalesce(v_represa, v_al) > v_ara - interval '10 minutes' then raise exception 'sdp-seg-006:"),
    posicio("delete from private.seguiments_altes a where a.seguidor = v_jo and a.al <= v_ara - interval '1 hour';"),
    posicio("select count(*) into v_hora from private.seguiments_altes a where a.seguidor = v_jo and a.al > v_ara - interval '1 hour';"),
    posicio('select count(*) into v_total from public.seguiments s where ((p_com is null and s.seguidor = v_jo and s.seguidor_entitat is null) '
      + 'or (p_com is not null and s.seguidor_entitat = p_com)) and s.deixat_al is null;'),
    posicio("if v_hora >= 30 then raise exception 'sdp-seg-006:"),
    posicio("if v_total >= 1000 then raise exception 'sdp-seg-006:"),
    posicio('insert into private.seguiments_altes (seguidor, al) values (v_jo, v_ara);'),
    posicio('if v_fila is not null then update public.seguiments s set deixat_al = null, reactivat_al = v_ara, tenant_id = v_poble, seguidor = v_jo where s.id = v_fila returning s.reactivat_al into v_al;'),
    posicio('insert into public.seguiments (tenant_id, seguidor, seguidor_entitat, seguit_tipus, seguit_persona, seguit_entitat, creat_al) values (v_poble, v_jo, p_com, p_tipus, '),
    posicio("return jsonb_build_object('seguint', true, 'creat_al', v_al, 'nou', true, 'primer', true);")
  ];
  expect(ordre.every((p) => p >= 0), JSON.stringify(ordre)).toBe(true);
  expect([...ordre].sort((a, b) => a - b)).toEqual(ordre);
  /* La porta de l'entitat, una sola vegada a segueix i DESPRÉS del pany; cap porta que depenga de l'entitat abans. */
  expect(cos.match(/can_manage_organization\(p_com\)/g)).toHaveLength(1);
  expect(cos.indexOf('poble_d_entitat_i_persona')).toBeGreaterThan(cos.indexOf('sdp-seg-007'));
  /* Un sol instant d'admissió i cap now(); primer: true una sola vegada (la fila nova). */
  expect(cos.match(/clock_timestamp\(\)/g)).toHaveLength(1);
  expect(cos).not.toMatch(/now\(\)/);
  expect(cos.match(/'primer', true/g)).toHaveLength(1);
  expect(cos.match(/'nou', (true|false), 'primer', \1/g)).toHaveLength(3);
});

test('la quota és de la PERSONA que actua: el registre de les altes no mira mai l’entitat', () => {
  const segueix = funcio('public', 'segueix').cos;
  const delRegistre = segueix.split(';').filter((sentencia) => /seguiments_altes/.test(sentencia));
  expect(delRegistre).toHaveLength(3);
  for (const sentencia of delRegistre) {
    expect(sentencia).toMatch(/v_jo/);
    expect(sentencia).not.toMatch(/p_com|seguidor_entitat/);
  }
  /* Només segueix hi escriu, com a 2610241430. */
  expect(FUNCIONS.filter((f) => f.cos.includes('seguiments_altes')).map((f) => f.nom)).toEqual(['segueix']);
});

test('deixa_de_seguir i estat_seguiment: la porta de l’entitat (007) abans de tocar o llegir res; sense p_com, només les files de la persona', () => {
  for (const nom of ['deixa_de_seguir', 'estat_seguiment']) {
    const cos = SENSE_ESPAIS(funcio('public', nom).cos);
    const valida = cos.indexOf("if p_tipus is null or p_tipus not in ('persona', 'entitat') or p_id is null then raise exception 'sdp-seg-001:");
    const porta = cos.indexOf("if p_com is not null and not coalesce(private.can_manage_organization(p_com), false) then raise exception 'sdp-seg-007:");
    const fila = cos.search(/update public\.seguiments s|select coalesce\(s\.reactivat_al, s\.creat_al\) into v_al/);
    expect([valida, porta, fila].every((p) => p > 0), nom).toBe(true);
    expect(valida < porta && porta < fila, nom).toBe(true);
    expect(cos, nom).toContain('(p_com is null and s.seguidor = v_jo and s.seguidor_entitat is null');
    expect(cos, nom).toContain('(p_com is not null and s.seguidor_entitat = p_com');
    expect(cos, nom).toContain('s.deixat_al is null');
  }
  /* Deixar de seguir: esborrat suau, mai un DELETE; i sense cap pany ni cap porta de veïnatge. */
  const deixa = SENSE_ESPAIS(funcio('public', 'deixa_de_seguir').cos);
  expect(deixa).toContain('update public.seguiments s set deixat_al = now() where ((p_com is null');
  expect(CODI).not.toMatch(/\bdelete\s+from\s+public\.seguiments\b/i);
  expect(deixa).not.toMatch(/seguiment_viu|seguiment_d_entitat_viu|pg_advisory/);
  /* L'estat: el viu de cada banda i només el bloqueig propi de qui mira. */
  const estat = SENSE_ESPAIS(funcio('public', 'estat_seguiment').cos);
  expect(estat).toContain('and private.seguiment_viu(v_jo, p_tipus, p_id))');
  expect(estat).toContain('and private.seguiment_d_entitat_viu(p_com, p_tipus, p_id)))');
  expect(estat).toContain("and private.bloqueig_de_seguiment(v_jo, p_tipus, p_id) is distinct from 'seguidor';");
});

test('els_meus_seguiments: la mateixa forma, i només les files de la persona (seguidor_entitat is null)', () => {
  const cos = SENSE_ESPAIS(funcio('public', 'els_meus_seguiments').cos);
  expect(cos).toContain('where s.seguidor = v_jo and s.seguidor_entitat is null and s.deixat_al is null');
  expect(cos).toContain('order by coalesce(s.reactivat_al, s.creat_al) desc, s.id limit 1000;');
  expect(cos).toContain('#variable_conflict use_column');
});

test('qui_em_segueix: seguidor_tipus, i d’una entitat seguidora el seu id i el seu nom, mai els de la persona que el va fer', () => {
  const cos = SENSE_ESPAIS(funcio('public', 'qui_em_segueix').cos);
  const seleccio = 'select coalesce(s.seguidor_entitat, s.seguidor), case when s.seguidor_entitat is null then p.full_name else o.name end, '
    + "coalesce(s.reactivat_al, s.creat_al), case when s.seguidor_entitat is null then 'persona' else 'entitat' end from public.seguiments s "
    + 'left join public.profiles p on s.seguidor_entitat is null and p.id = s.seguidor left join public.organizations o on o.id = s.seguidor_entitat';
  expect(cos.split(seleccio)).toHaveLength(3);
  /* Les dues branques, la porta de l'entitat seguida entre elles, i els filtres de cada banda. */
  const persona = cos.indexOf("where s.seguit_tipus = 'persona' and s.seguit_persona = v_jo");
  const porta = cos.indexOf("if not coalesce(private.can_manage_organization(p_org_id), false) then raise exception 'sdp-seg-005:");
  const entitat = cos.indexOf("where s.seguit_tipus = 'entitat' and s.seguit_entitat = p_org_id");
  expect([persona, porta, entitat].every((p) => p > 0)).toBe(true);
  expect(persona < porta && porta < entitat).toBe(true);
  for (const [tipus, seguit] of [['persona', 'v_jo'], ['entitat', 'p_org_id']]) {
    expect(cos, tipus).toContain(`and private.bloqueig_de_seguiment(s.seguidor, '${tipus}', ${seguit}) is null`);
    expect(cos, tipus).toContain(`((s.seguidor_entitat is null and private.seguiment_viu(s.seguidor, '${tipus}', ${seguit}))`);
    expect(cos, tipus).toContain(`and private.seguiment_d_entitat_viu(s.seguidor_entitat, '${tipus}', ${seguit})`);
    expect(cos, tipus).toContain(`and not private.entitat_bloquejada_pel_seguit(s.seguidor_entitat, '${tipus}', ${seguit})))`);
  }
  expect(cos.match(/order by coalesce\(s\.reactivat_al, s\.creat_al\) desc, s\.id limit 1000;/g)).toHaveLength(2);
  expect(cos).toContain('#variable_conflict use_column');
});

test('les funcions privades noves: el poble de l’entitat, el seguiment d’entitat viu i el bloqueig a l’entitat (amb to_regclass)', () => {
  const poble = SENSE_ESPAIS(funcio('private', 'poble_d_entitat_i_persona').cos);
  expect(poble).toContain('from public.organizations o join public.town_memberships tm on tm.town_id = o.tenant_id where o.id = p_entitat and tm.user_id = p_persona');
  expect(poble).toContain('exists (select 1 from public.profiles p where p.id = p_persona and p.baixa_demanada_at is null)');
  const viu = SENSE_ESPAIS(funcio('private', 'seguiment_d_entitat_viu').cos);
  expect(viu).toContain("when 'persona' then private.poble_d_entitat_i_persona(p_entitat, p_id) is not null");
  expect(viu).toContain("when 'entitat' then p_id <> p_entitat and exists (select 1 from public.organizations o where o.id = p_id and o.visibility = 'public')");
  expect(viu).not.toContain('bloqueig');
  const bloqueig = SENSE_ESPAIS(funcio('private', 'entitat_bloquejada_pel_seguit').cos);
  expect(bloqueig.indexOf("if to_regclass('public.bloquejos') is null then return false; end if;")).toBe(bloqueig.indexOf('if '));
  expect(bloqueig).toContain("where b.bloquejat_entitat = p_entitat and ((p_tipus = 'persona' and b.bloquejador = p_id) or (p_tipus = 'entitat' and b.bloquejador in ( "
    + "select m.user_id from public.organization_memberships m where m.organization_id = p_id and m.role in ('owner', 'admin')))));");
});

test('l’adaptador crida les RPC amb p_com i llig seguidor_tipus', () => {
  for (const [nom] of RPC) expect(CLIENT, nom).toContain(`cridaRpc('${nom}'`);
  for (const parametre of ['p_tipus', 'p_id', 'p_com', 'p_org_id']) {
    expect(CLIENT, parametre).toContain(`${parametre}`);
    expect(CODI, parametre).toContain(parametre);
  }
  expect(CLIENT).toContain('seguidor_tipus');
  expect(CODI).toMatch(/\bseguidor_tipus\b/);
});

test('el catàleg supabase/README.md la nomena després de 2610241430 i de 2610242320, abans de seed.sql, NO aplicada, en un sol paràgraf', () => {
  const posicio = README.indexOf(`migrations/${NOM}`);
  expect(posicio, 'falta l’entrada al README').toBeGreaterThanOrEqual(0);
  expect(posicio).toBeGreaterThan(README.indexOf('migrations/2610241430_seguiments.sql'));
  expect(posicio).toBeGreaterThan(README.indexOf('migrations/2610242320_correu_propietaria_nomes_titular.sql'));
  expect(posicio).toBeLessThan(README.indexOf('- `seed.sql`'));
  const entrada = README.slice(posicio).split('\n\n')[0];
  expect(entrada).toMatch(/IDEA-22 \(pla 261025_0045, T5; Directiva del Mestre 261025/);
  expect(entrada).toMatch(/\*\*NO aplicada:\s+l'aplica el Mestre, mai un agent\*\*/);
  expect(entrada).toContain('grant select, insert, update, delete on public.seguiments to service_role;');
  for (const text of ['`seguidor_entitat`', '`p_com', '`seguidor_tipus`', '`SDP-SEG-007`', 'src/data/supabase/seguimentsEntitat.migracio.test.js']) {
    expect(entrada, text).toContain(text);
  }
  expect(entrada).not.toMatch(/offline[- ]first|local[- ]first/i);
});

test('higiene de fitxer: una sola línia buida final i cap vocabulari prohibit', () => {
  expect(SQL.endsWith(';\n') && !SQL.endsWith('\n\n')).toBe(true);
  expect(SQL).not.toMatch(/offline[- ]first|local[- ]first/i);
  expect(SQL).not.toMatch(/contact_email|organization_member_organizations/);
});
