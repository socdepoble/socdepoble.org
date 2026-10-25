/* T6b (IDEA-14; decisió del Mestre, 261024) · Prova estàtica de la migració
   2610241430_seguiments.sql. No hi ha cap base de dades: es llig el SQL i es
   comproven la capçalera (QUÈ FA, QUÈ NO FA, CODIS, Depén de, NO aplicada,
   l'aplica el Mestre), la transacció, la RLS sense cap política, els permisos
   del mandat Supabase 30-Oct-2026 (cap permís de taula per a anon ni
   authenticated), les llistes blanques contra el contracte, les funcions
   SECURITY DEFINER amb el search_path buit, les regles de segueix (veïnatge,
   bloquejos, límit sota el pany), les columnes que llegirà l'exportació (T7),
   les RPC que crida l'adaptador seguiments.js i l'entrada de
   supabase/README.md. El parser és el de moderacio.migracio.test.js. */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from 'vitest';
import { MISSATGES_SEGUIMENTS, TIPUS_SEGUIT } from '../contracte.js';

/* vitest s'executa des de l'arrel del repositori (com qualitat.test.js). */
const ARREL = process.cwd();
const NOM = '2610241430_seguiments.sql';
const MIGRACIONS = path.join(ARREL, 'supabase/migrations');
const SQL = readFileSync(path.join(MIGRACIONS, NOM), 'utf8');
const CLIENT = readFileSync(path.join(ARREL, 'src/data/supabase/seguiments.js'), 'utf8');
const README = readFileSync(path.join(ARREL, 'supabase/README.md'), 'utf8');
/* Sense comentaris de línia: es comprova el codi, no la prosa. */
const CODI = SQL.split('\n').map((linia) => linia.replace(/--.*$/, '')).join('\n');
const CAPCALERA = SQL.slice(0, SQL.search(/^begin;/m));
const SENSE_ESPAIS = (text) => text.replace(/\s+/g, ' ').trim().toLowerCase();
const LINIES = SQL.split('\n');
const CODIS_SEG = ['000', '001', '002', '003', '004', '005', '006'].map((n) => `SDP-SEG-${n}`);

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
const funcio = (esquema, nom) => FUNCIONS.find((f) => f.esquema === esquema && f.nom === nom);
/* La llista d'un `check (columna in ('a', 'b'))`, en ordre. */
const llistaDelCheck = (columna) => {
  const m = new RegExp(`check \\(${columna} in \\(([^)]*)\\)\\)`, 'i').exec(CODI);
  return m ? [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]) : null;
};

const RPC = Object.freeze([
  ['segueix', 'p_tipus text, p_id uuid', '(text, uuid)'],
  ['deixa_de_seguir', 'p_tipus text, p_id uuid', '(text, uuid)'],
  ['estat_seguiment', 'p_tipus text, p_id uuid', '(text, uuid)'],
  ['els_meus_seguiments', '', '()'],
  ['qui_em_segueix', 'p_org_id uuid default null', '(uuid)']
]);
const PRIVADES = Object.freeze([
  ['poble_compartit', '(uuid, uuid)'],
  ['bloqueig_de_seguiment', '(uuid, text, uuid)'],
  ['seguiment_viu', '(uuid, text, uuid)']
]);

test('el nom segueix el format de les migracions i va després de les del 261024 que la precedixen', () => {
  expect(NOM).toMatch(/^\d{10}_[a-z0-9_]+\.sql$/);
  const ordre = readdirSync(MIGRACIONS).filter((f) => f.endsWith('.sql')).sort();
  expect(ordre.indexOf(NOM)).toBeGreaterThan(ordre.indexOf('2610201500_moderacio_denuncies_i_bloquejos.sql'));
  expect(ordre.indexOf(NOM)).toBeGreaterThan(ordre.indexOf('2610220240_xat_adjunts_i_quota.sql'));
});

test('la capçalera: QUÈ FA, QUÈ NO FA, CODIS, Depén de, NO aplicada i l’aplica el Mestre, cada frase en UNA línia', () => {
  expect(SQL).toMatch(/^-- =+\n-- 261024_1430 · T6b \(IDEA-14\)/);
  for (const apartat of [/^-- QUÈ FA:$/m, /^-- QUÈ NO FA \(/m, /^-- CODIS \(/m, /^-- Depén de: /m]) expect(CAPCALERA).toMatch(apartat);
  expect(CAPCALERA).toMatch(/NO aplicada/);
  expect(LINIES.filter((l) => /^-- L'aplica el Mestre, mai un agent\.$/.test(l))).toHaveLength(1);
  expect(LINIES.filter((l) => /ABANS de publicar el client/.test(l))).toHaveLength(1);
  expect(CAPCALERA).toMatch(/Decisió del Mestre \(261024/);
});

/* Actualitzada a posta (IDEA-22, pla 261025_0045, T5; Directiva del Mestre 261025): el contracte guanya
   SDP-SEG-007, que és de 2610250100_seguiments_des_d_entitat.sql (la contrasta
   seguimentsEntitat.migracio.test.js); esta migració continua portant només 000…006. */
test('els codis SDP-SEG-000…006 són a la capçalera, al codi i al contracte, i cap altre (el contracte, a més, el 007 de 2610250100)', () => {
  for (const codi of CODIS_SEG) {
    expect(CAPCALERA, `capçalera ${codi}`).toContain(codi);
    expect(CODI, `codi ${codi}`).toContain(codi);
  }
  expect([...new Set([...CODI.matchAll(/SDP-SEG-\d{3}/g)].map((m) => m[0]))].sort()).toEqual(CODIS_SEG);
  expect(Object.keys(MISSATGES_SEGUIMENTS).filter((codi) => codi.startsWith('SDP-SEG-')).sort()).toEqual([...CODIS_SEG, 'SDP-SEG-007']);
  expect(CODI).toMatch(/SDP-SEG-006[^;]*errcode = '42900'/);
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
  /* Cap permís de cap mena per a anon, ni de taula ni de funció. */
  expect(CODI).not.toMatch(/grant[^;]*\bto\b[^;]*\banon\b/i);
});

test('les columnes, les claus foranes i els CHECK: un sol seguit del seu tipus, ningú no se seguix a si mateix', () => {
  const codi = SENSE_ESPAIS(CODI);
  expect(llistaDelCheck('seguit_tipus')).toEqual([...TIPUS_SEGUIT]);
  expect(codi).toContain('id uuid primary key default gen_random_uuid()');
  expect(codi).toContain('tenant_id uuid not null references public.towns (id) on delete cascade');
  expect(codi).toContain('seguidor uuid not null references auth.users (id) on delete cascade');
  expect(codi).toContain('seguit_persona uuid references auth.users (id) on delete cascade');
  expect(codi).toContain('seguit_entitat uuid references public.organizations (id) on delete cascade');
  expect(codi).toContain('creat_al timestamptz not null default now()');
  /* Correccions 261024 (Codex D-07.1, R2-04): l'esborrat suau. deixat_al null és un seguiment viu. */
  expect(codi).toContain('creat_al timestamptz not null default now(), reactivat_al timestamptz, deixat_al timestamptz, constraint seguiments_un_sol_seguit');
  expect(codi).toContain("constraint seguiments_un_sol_seguit check ( (seguit_tipus = 'persona' and seguit_persona is not null and seguit_entitat is null) "
    + "or (seguit_tipus = 'entitat' and seguit_entitat is not null and seguit_persona is null))");
  expect(codi).toContain('constraint seguiments_no_autoseguiment check (seguidor <> seguit_persona)');
});

test('una sola fila per parella: dos índexs únics parcials', () => {
  const codi = SENSE_ESPAIS(CODI);
  expect(codi).toContain("create unique index if not exists seguiments_persona_unic on public.seguiments (seguidor, seguit_persona) where seguit_tipus = 'persona';");
  expect(codi).toContain("create unique index if not exists seguiments_entitat_unic on public.seguiments (seguidor, seguit_entitat) where seguit_tipus = 'entitat';");
});

/* Actualitzada a posta (261024 correccions): motiu, l'esborrat suau (Codex D-07.1,
   R2-04); l'exportació (C4) filtra els vius amb deixat_al is null, i el nom no canvia. */
test('T7 · l’exportació llegirà seguidor, seguit_tipus, seguit_persona, seguit_entitat, creat_al i deixat_al: els noms no canvien', () => {
  const taula = CODI.slice(CODI.indexOf('create table if not exists public.seguiments'), CODI.indexOf('alter table public.seguiments'));
  for (const columna of ['seguidor', 'seguit_tipus', 'seguit_persona', 'seguit_entitat', 'creat_al', 'deixat_al']) {
    expect(taula, columna).toMatch(new RegExp(`^\\s+${columna}\\s+(uuid|text|timestamptz)\\b`, 'm'));
  }
  expect(CAPCALERA).toContain('un seguiment viu és deixat_al is null');
});

test('deixar de seguir és un esborrat suau: cap DELETE, la fila viva es marca amb deixat_al', () => {
  /* Codex D-07.1 / Gemini G2-06.1 / R2-04: amb el DELETE, deixar de seguir tornava la fila al compte per hora. */
  expect(CODI).not.toMatch(/\bdelete\s+from\s+public\.seguiments\b/i);
  const cos = SENSE_ESPAIS(funcio('public', 'deixa_de_seguir').cos);
  expect(cos).toContain('update public.seguiments s set deixat_al = now() where s.seguidor = v_jo and s.deixat_al is null and ((');
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
});

test('els noms dels cossos van amb el seu esquema: cap taula ni funció sense qualificar', () => {
  for (const f of FUNCIONS) {
    const nus = [...f.cos.matchAll(/\b(?:from|join|into|update)\s+(?!public\.|private\.|auth\.)([a-z_][a-z0-9_]*)\b/gi)]
      .map((m) => m[1]).filter((nom) => !nom.startsWith('v_'));
    expect(nus, f.nom).toEqual([]);
  }
});

test('les RPC: només per a authenticated, amb (select auth.uid()) i SDP-SEG-000 sense sessió', () => {
  for (const [nom, params, firma] of RPC) {
    const f = funcio('public', nom);
    expect(f, nom).toBeTruthy();
    expect(f.params, nom).toBe(params);
    expect(f.cos, nom).toMatch(/v_jo\s+uuid := \(select auth\.uid\(\)\);/);
    expect(f.cos, nom).toMatch(/if v_jo is null then\s+raise exception 'SDP-SEG-000: [^']+' using errcode = '42501';/);
    expect(CODI).toContain(`revoke all on function public.${nom}${firma} from public, anon, authenticated, service_role;`);
    expect(CODI.split('\n').filter((l) => l.trim().startsWith('grant ') && l.includes(`public.${nom}${firma}`)))
      .toEqual([`grant execute on function public.${nom}${firma} to authenticated;`]);
  }
});

/* Actualitzada a posta (261024 correccions): motiu, l'esborrat suau i el bloqueig a
   l'ombra (Codex D-07.1, Gemini G2-06.1, R2-01, R2-04, R4-01). La fila de la parella
   es busca viva o deixada; una deixada es reprén (amb la seua espera) i només una
   fila nova dona primer: true. El 002 ja no depén de cap bloqueig. */
test('segueix: tu mateix i les entitats que administres, abans; veïnatge, el teu bloqueig i, sota el pany, la fila de la parella, l’espera de represa, el límit, la represa i l’alta', () => {
  const cos = SENSE_ESPAIS(funcio('public', 'segueix').cos);
  const valida = cos.indexOf("if p_tipus is null or p_tipus not in ('persona', 'entitat') or p_id is null then raise exception 'sdp-seg-001:");
  const propi = cos.indexOf("if (p_tipus = 'persona' and p_id = v_jo) or (p_tipus = 'entitat' and coalesce(private.can_manage_organization(p_id), false)) then raise exception 'sdp-seg-003:");
  const veina = cos.indexOf('v_poble := private.poble_compartit(v_jo, p_id);');
  const entitat = cos.indexOf("select o.tenant_id into v_poble from public.organizations o where o.id = p_id and (o.visibility = 'public' or exists (");
  const bloqueig = cos.indexOf('v_bloqueig := private.bloqueig_de_seguiment(v_jo, p_tipus, p_id);');
  const meu = cos.indexOf("if v_bloqueig = 'seguidor' then raise exception 'sdp-seg-004:");
  const absent = cos.indexOf("if v_poble is null then raise exception 'sdp-seg-002:");
  const pany = cos.indexOf("perform pg_advisory_xact_lock(hashtextextended('seguiments:' || v_jo::text, 0));");
  const fila = cos.indexOf('select s.id, s.creat_al, s.reactivat_al, s.deixat_al into v_fila, v_al, v_represa, v_deixat from public.seguiments s where s.seguidor = v_jo and ((');
  const repetit = cos.indexOf("if v_fila is not null and v_deixat is null then return jsonb_build_object('seguint', true, 'creat_al', coalesce(v_represa, v_al), 'nou', false, 'primer', false);");
  /* Actualitzada a posta (Gauntlet 261024_1945, Gemini G1945-03): l'espera de represa es compta des de
     l'última represa o, si no n'hi ha cap, des de l'alta (v_al, el creat_al de la fila), i amb v_ara. */
  const espera = cos.indexOf("if v_fila is not null and coalesce(v_represa, v_al) > v_ara - interval '10 minutes' then raise exception 'sdp-seg-006:");
  /* Actualitzada a posta (261024_1800, T2; Codex C6-01): el que fixava era el defecte. El compte per
     hora ja no és de files de public.seguiments (una parella represa tres vegades hi pesava una): és
     del registre de les altes, podat de més d'una hora; el total, només els vius. I l'anotació de
     l'alta va abans de la represa i de l'alta, dins del pany. */
  const instant = cos.indexOf('v_ara := clock_timestamp();');
  const poda = cos.indexOf("delete from private.seguiments_altes a where a.seguidor = v_jo and a.al <= v_ara - interval '1 hour';");
  const compte = cos.indexOf("select count(*) into v_hora from private.seguiments_altes a where a.seguidor = v_jo and a.al > v_ara - interval '1 hour';");
  const vius = cos.indexOf('select count(*) into v_total from public.seguiments s where s.seguidor = v_jo and s.deixat_al is null;');
  /* Actualitzada a posta (Gauntlet 261024_1945, Codex G-01, Gemini G1945-02): 30 altes o represes per hora. */
  const hora = cos.indexOf("if v_hora >= 30 then raise exception 'sdp-seg-006:");
  const total = cos.indexOf("if v_total >= 1000 then raise exception 'sdp-seg-006:");
  const anota = cos.indexOf('insert into private.seguiments_altes (seguidor, al) values (v_jo, v_ara);');
  const represa = cos.indexOf('if v_fila is not null then update public.seguiments s set deixat_al = null, reactivat_al = v_ara, tenant_id = v_poble where s.id = v_fila returning s.reactivat_al into v_al; '
    + "return jsonb_build_object('seguint', true, 'creat_al', v_al, 'nou', false, 'primer', false);");
  const alta = cos.indexOf("insert into public.seguiments (tenant_id, seguidor, seguit_tipus, seguit_persona, seguit_entitat, creat_al) values (v_poble, v_jo, p_tipus, "
    + "case when p_tipus = 'persona' then p_id end, case when p_tipus = 'entitat' then p_id end, v_ara) returning creat_al into v_al;");
  const primer = cos.indexOf("return jsonb_build_object('seguint', true, 'creat_al', v_al, 'nou', true, 'primer', true);");
  const ordre = [valida, propi, veina, entitat, bloqueig, meu, absent, pany, instant, fila, repetit, espera, poda, compte, vius, hora, total, anota, represa, alta, primer];
  expect(ordre.every((posicio) => posicio > 0), JSON.stringify(ordre)).toBe(true);
  expect([...ordre].sort((a, b) => a - b)).toEqual(ordre);
  /* primer: true (i nou: true, el mateix valor) només hi és una vegada: el de la fila nova. */
  expect(cos.match(/'primer', true/g)).toHaveLength(1);
  expect(cos.match(/'nou', true/g)).toHaveLength(1);
  expect(cos.match(/'nou', (true|false), 'primer', \1/g)).toHaveLength(3);
});

/* Actualitzada a posta (261024 correccions): motiu, R2-01. El bloqueig de l'altra banda
   ja no dona SDP-SEG-002: és a l'ombra, i només la llista de qui és seguit l'amaga. */
test('els bloquejos: la taula de 2610201500 amb to_regclass, de les dues bandes, i el de l’altra banda és a l’ombra', () => {
  const cos = SENSE_ESPAIS(funcio('private', 'bloqueig_de_seguiment').cos);
  expect(cos.indexOf("if to_regclass('public.bloquejos') is null then return null; end if;")).toBe(cos.indexOf('if '));
  expect(cos).toContain("where b.bloquejador = p_seguidor and ((p_tipus = 'persona' and b.bloquejat_persona = p_id) or (p_tipus = 'entitat' and b.bloquejat_entitat = p_id))) then return 'seguidor';");
  expect(cos).toContain("where b.bloquejat_persona = p_seguidor and ((p_tipus = 'persona' and b.bloquejador = p_id) or (p_tipus = 'entitat' and b.bloquejador in ( "
    + "select m.user_id from public.organization_memberships m where m.organization_id = p_id and m.role in ('owner', 'admin'))))) then return 'seguit';");
  expect(CODI.match(/SDP-SEG-004/g)).toHaveLength(1);
  /* segueix només refusa el bloqueig propi; cap condició no hi mira 'seguit' ni «qualsevol bloqueig». */
  const segueix = SENSE_ESPAIS(funcio('public', 'segueix').cos);
  expect(segueix).not.toContain("'seguit'");
  expect(segueix).not.toMatch(/v_bloqueig is not null/);
  /* La declaració, l'assignació i la porta del 004: res més. */
  expect(segueix.match(/v_bloqueig/g)).toHaveLength(3);
  /* seguiment_viu ja no mira els bloquejos: cada lectura ho fa del seu sentit. */
  expect(funcio('private', 'seguiment_viu').cos).not.toContain('bloqueig_de_seguiment');
  expect(CAPCALERA).toMatch(/El bloqueig de l'altra banda és a l'ombra/);
  expect(CAPCALERA).not.toMatch(/bloqueig de l'altra banda diu SDP-SEG-002/);
});

test('el veïnatge: dues persones que compartixen poble, cap de les dues amb la baixa demanada', () => {
  const cos = SENSE_ESPAIS(funcio('private', 'poble_compartit').cos);
  expect(cos).toContain('from public.town_memberships tm_a join public.town_memberships tm_b on tm_b.town_id = tm_a.town_id where tm_a.user_id = p_a and tm_b.user_id = p_b and p_a <> p_b');
  expect(cos).toContain('exists (select 1 from public.profiles pa where pa.id = p_a and pa.baixa_demanada_at is null)');
  expect(cos).toContain('exists (select 1 from public.profiles pb where pb.id = p_b and pb.baixa_demanada_at is null)');
});

/* Actualitzada a posta (261024 correccions): motiu, les lectures només tornen files vives
   (deixat_al is null), van per «des de quan se seguix ara» i cada una mira els bloquejos
   del seu sentit (R2-01): qui seguix, només el seu; qui és seguit, els dos. */
test('les lectures només tornen el que es pot vore ara, per data, i qui_em_segueix d’una entitat demana administrar-la', () => {
  for (const nom of ['estat_seguiment', 'els_meus_seguiments', 'qui_em_segueix']) {
    const cos = funcio('public', nom).cos;
    expect(cos, nom).toContain('private.seguiment_viu(');
    expect(cos, nom).toContain('s.deixat_al is null');
    expect(cos, nom).toContain('coalesce(s.reactivat_al, s.creat_al)');
  }
  for (const nom of ['els_meus_seguiments', 'qui_em_segueix']) {
    const cos = SENSE_ESPAIS(funcio('public', nom).cos);
    expect(cos, nom).toContain('order by coalesce(s.reactivat_al, s.creat_al) desc, s.id limit 1000;');
    expect(cos, nom).toContain('#variable_conflict use_column');
  }
  /* Les de qui seguix: el bloqueig de l'altra banda no hi amaga res (a l'ombra). */
  expect(SENSE_ESPAIS(funcio('public', 'estat_seguiment').cos))
    .toContain("and private.bloqueig_de_seguiment(v_jo, p_tipus, p_id) is distinct from 'seguidor';");
  expect(SENSE_ESPAIS(funcio('public', 'els_meus_seguiments').cos))
    .toContain("and private.bloqueig_de_seguiment(v_jo, s.seguit_tipus, coalesce(s.seguit_persona, s.seguit_entitat)) is distinct from 'seguidor' order by");
  /* La de qui és seguit: un bloqueig de qualsevol sentit deixa fora qui seguix. */
  const quiCos = SENSE_ESPAIS(funcio('public', 'qui_em_segueix').cos);
  expect(quiCos).toContain("and private.bloqueig_de_seguiment(s.seguidor, 'persona', v_jo) is null order by");
  expect(quiCos).toContain("and private.bloqueig_de_seguiment(s.seguidor, 'entitat', p_org_id) is null order by");
  const qui = SENSE_ESPAIS(funcio('public', 'qui_em_segueix').cos);
  const persona = qui.indexOf("where s.seguit_tipus = 'persona' and s.seguit_persona = v_jo");
  const porta = qui.indexOf("if not coalesce(private.can_manage_organization(p_org_id), false) then raise exception 'sdp-seg-005:");
  const entitat = qui.indexOf("where s.seguit_tipus = 'entitat' and s.seguit_entitat = p_org_id");
  expect([persona, porta, entitat].every((p) => p > 0)).toBe(true);
  expect(persona < porta && porta < entitat).toBe(true);
  /* La desactivació no demana veïnatge ni cap altra porta: sempre es pot deixar de seguir. */
  expect(funcio('public', 'deixa_de_seguir').cos).not.toContain('seguiment_viu');
});

test('l’adaptador crida les RPC d’esta migració amb els mateixos noms de paràmetre', () => {
  /* Totes passen per cridaRpc, l'embolcall de rpc() que traduïx l'error. */
  expect(CLIENT).toMatch(/const cridaRpc = \(nom, cos, config\) => rpc\(nom, cos, config, \{ signal: signalDe\(config\) \}\)\.catch\(\(error\) => \{ throw traduix\(error\); \}\);/);
  for (const [nom] of RPC) expect(CLIENT, nom).toContain(`cridaRpc('${nom}'`);
  for (const parametre of ['p_tipus', 'p_id', 'p_org_id']) {
    expect(CLIENT, parametre).toContain(`${parametre}:`);
    expect(CODI, parametre).toContain(parametre);
  }
  for (const columna of ['seguint', 'creat_al', 'nou', 'primer', 'tipus', 'nom']) expect(CODI, columna).toMatch(new RegExp(`\\b${columna}\\b`));
  expect(CLIENT).toContain('fila?.primer === true');
});

test('el catàleg supabase/README.md la nomena abans de seed.sql, NO aplicada, en un sol paràgraf', () => {
  const posicio = README.indexOf(`migrations/${NOM}`);
  expect(posicio, 'falta l’entrada al README').toBeGreaterThanOrEqual(0);
  expect(posicio).toBeGreaterThan(README.indexOf('migrations/2610201500_moderacio_denuncies_i_bloquejos.sql'));
  expect(posicio).toBeLessThan(README.indexOf('- `seed.sql`'));
  const entrada = README.slice(posicio).split('\n\n')[0];
  expect(entrada).toMatch(/T6b \(IDEA-14/);
  expect(entrada).toMatch(/\*\*NO aplicada: l'aplica el Mestre, mai un agent\*\*/);
  expect(entrada).toContain('grant select, insert, update, delete on public.seguiments to service_role;');
  for (const codi of CODIS_SEG) expect(entrada, codi).toContain(codi.slice(-3));
  expect(entrada).not.toMatch(/offline[- ]first|local[- ]first/i);
  /* Correccions 261024 (Codex D-07.1, R2-01, R2-04): l'esborrat suau, primer i el bloqueig a l'ombra. */
  for (const text of ['`deixat_al`', '`primer`', 'a l’ombra']) expect(entrada, text).toContain(text);
  expect(entrada).not.toMatch(/també quan l'altra banda\s+t'ha bloquejat/);
});

test('higiene de fitxer: una sola línia buida final i cap vocabulari prohibit', () => {
  expect(SQL.endsWith(';\n') && !SQL.endsWith('\n\n')).toBe(true);
  expect(SQL).not.toMatch(/offline[- ]first|local[- ]first/i);
  /* Ni el correu de les organitzacions ni la taula d'organitzacions membres (2610181915). */
  expect(SQL).not.toMatch(/contact_email|organization_member_organizations/);
});

/* T2 (261024_1800, P2-10; auditoria Codex 261024_1800 C6-01) · El registre de les altes: el límit per
   hora no depén de les files vives ni de les deixades de public.seguiments, sinó d'una fila per alta o
   represa acceptada, que cap baixa ni cap represa no esborra ni sobreescriu. */
test('T2 · private.seguiments_altes: qui i quan (mai a qui), a l’esquema private, RLS activa, cap política i cap permís per a ningú', () => {
  const codi = SENSE_ESPAIS(CODI);
  expect(codi).toContain('create table if not exists private.seguiments_altes ( id uuid primary key default gen_random_uuid(), '
    + 'seguidor uuid not null references auth.users (id) on delete cascade, al timestamptz not null default now() );');
  const taula = CODI.slice(CODI.indexOf('create table if not exists private.seguiments_altes'), CODI.indexOf('create index if not exists idx_seguiments_altes_seguidor_al'));
  expect(taula).not.toMatch(/seguit_|tenant_id|organizations/);
  expect(codi).toContain('create index if not exists idx_seguiments_altes_seguidor_al on private.seguiments_altes (seguidor, al desc);');
  expect(CODI).toContain('alter table private.seguiments_altes enable row level security;');
  expect(CODI).toContain('revoke all on table private.seguiments_altes from public, anon, authenticated, service_role;');
  expect(CODI).not.toMatch(/grant[^;]*seguiments_altes/i);
  expect(CODI).not.toMatch(/public\.seguiments_altes/);
  /* Només segueix hi escriu (i la purga horària); cap UPDATE, i cap lectura del client. */
  const queLaToquen = FUNCIONS.filter((f) => f.cos.includes('seguiments_altes')).map((f) => `${f.esquema}.${f.nom}`);
  expect(queLaToquen).toEqual(['public.segueix']);
  expect(CODI).not.toMatch(/update\s+private\.seguiments_altes/i);
  /* Una sola anotació, i abans de les dues eixides que donen seguint: true per una alta o una represa. */
  const segueix = funcio('public', 'segueix').cos;
  expect(segueix.match(/insert into private\.seguiments_altes/g)).toHaveLength(1);
  expect(segueix.indexOf('insert into private.seguiments_altes')).toBeLessThan(segueix.indexOf('update public.seguiments s'));
  /* La tornada idempotent (ja la seguies) ix abans de comptar ni d'anotar res. */
  expect(segueix.indexOf("if v_fila is not null and v_deixat is null then")).toBeLessThan(segueix.indexOf('delete from private.seguiments_altes'));
  /* El compte és de l'hora lliscant i ja no mira public.seguiments per a v_hora. */
  expect(SENSE_ESPAIS(segueix)).not.toMatch(/s\.creat_al > now\(\) - interval '1 hour'|s\.reactivat_al > now\(\) - interval '1 hour'/);
  /* segueix és volatile: cada sentència, després del pany, veu les anotacions de l'anterior. */
  expect(funcio('public', 'segueix').capcalera).toContain('volatile');
  /* Codex 261024_1800 · L'instant d'admissió és clock_timestamp() pres després del pany, una sola vegada,
     i el registre no fa servir now() (l'inici de la transacció, potser abans d'esperar el pany). */
  expect(segueix.match(/clock_timestamp\(\)/g)).toHaveLength(1);
  expect(segueix.indexOf('v_ara := clock_timestamp();')).toBeGreaterThan(segueix.indexOf('perform pg_advisory_xact_lock('));
  const delRegistre = segueix.split('\n').filter((linia) => /seguiments_altes|a\.al\b/.test(linia) || /v_ara - interval/.test(linia)).join('\n');
  expect(delRegistre).not.toMatch(/now\(\)/);
  /* Gauntlet 261024_1945 (Codex, Gemini G1945-03) · segueix no usa now() enlloc: l'espera de represa,
     reactivat_al i creat_al són de v_ara, el mateix instant d'admissió que el registre. */
  expect(segueix).not.toMatch(/now\(\)/);
  expect(CAPCALERA).toMatch(/30 altes o represes per hora/);
  expect(CAPCALERA).not.toMatch(/\b60 (altes|per)\b/);
});

/* Codex 261024_1800 (observació secundària) · La branca d'entitat de segueix mira, com seguiment_viu,
   que qui seguix no haja demanat la baixa: si no, admetria una fila que cap lectura no mostraria. */
test('segueix d’una entitat: qui seguix sense la baixa demanada, com seguiment_viu', () => {
  const cos = SENSE_ESPAIS(funcio('public', 'segueix').cos);
  expect(cos).toContain("select o.tenant_id into v_poble from public.organizations o where o.id = p_id and (o.visibility = 'public' or exists ( "
    + 'select 1 from public.organization_memberships m where m.organization_id = o.id and m.user_id = v_jo)) '
    + 'and exists (select 1 from public.profiles p where p.id = v_jo and p.baixa_demanada_at is null);');
});

test('T2 · la purga del registre cada 10 minuts, programada només si pg_cron hi és, abans del notify', () => {
  const codi = SENSE_ESPAIS(CODI);
  /* Revisió adversarial T2 · skip locked: la purga no espera mai la poda d'una alta (cap interbloqueig). */
  const purga = codi.indexOf("perform cron.schedule('sdp-purga-altes-seguiments', '*/10 * * * *', $cron$delete from private.seguiments_altes where id in "
    + "(select a.id from private.seguiments_altes a where a.al <= now() - interval '1 hour' for update skip locked)$cron$);");
  expect(purga).toBeGreaterThan(0);
  expect(codi.lastIndexOf("if exists (select 1 from pg_catalog.pg_extension where extname = 'pg_cron') then", purga)).toBeGreaterThan(0);
  expect(purga).toBeLessThan(codi.indexOf("notify pgrst, 'reload schema';"));
  expect(CAPCALERA).toMatch(/private\.seguiments_altes/);
  expect(CAPCALERA).toMatch(/l'exportació\n?-- *\(2610241410\) no el dona|l'exportació \(2610241410\) no el dona/);
});
