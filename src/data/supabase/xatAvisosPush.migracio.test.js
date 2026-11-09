// @vitest-environment node
/* B8-SERVIDOR · S1 (marató 261101_2143, carril P01-B8S-MIGRACIO; ordre del
   Mestre 261101) · Prova estàtica de la migració <V>_xat_avisos_push.sql: els
   aparells push del Xat, el silenci per conversa, la cua del worker
   notifica-xat i les RPC del contracte únic (B8-SERVIDOR §2.9). Ací no hi ha
   cap PostgreSQL: es llig el SQL i es comproven la capçalera, la transacció,
   la taula (forma per tipus, unicitat, FK, cap repetició de més de 255), l'RLS
   i els permisos per columna (mai l'adreça), cada funció (definer, search_path
   buit, cap jsonb d'entrada), les signatures exactes de §2.9, els permisos per
   rol, el disparador que poda sempre i mai atura un missatge, el gest per a
   canviar d'amo, la sentinella del silenci, els filtres del reclam i cap
   pg_net, Vault ni secret.
   No és només forma: la llista blanca i les formes de l'adreça es lligen del
   SQL i s'avaluen en JS sobre un corpus (servidor ⊆ client amb el
   formaDeLaSubscripcio real; cada adreça que la RPC admet també passa el
   CHECK de la taula; les mateixes llistes que webpush.js del worker), i cada
   crida rpc() de notifica-xat ha de casar amb una funció de la migració pels
   noms dels paràmetres, com els resol PostgREST (R13), i el reclam cap sencer
   en el cos que el worker llig (ARB-P01-02). Les mutacions del final
   demostren que cada comprovació mossega. L'execució real (PGlite 0.3.16:
   l'arnés de la spec i la sonda del pressupost) és evidència no versionada,
   fora del repositori. */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { MAXIM_ENDPOINT, SERVEIS_DE_PUSH, formaDeLaSubscripcio } from '../../pwa/avisosPush.js';

/* vitest s'executa des de l'arrel del repositori (com qualitat.test.js). */
const ARREL = process.cwd();
const MIGRACIONS = path.join(ARREL, 'supabase/migrations');
const ORDRE = readdirSync(MIGRACIONS).filter((f) => f.endsWith('.sql')).sort();
const NOMS = ORDRE.filter((f) => /^\d{10}_xat_avisos_push\.sql$/.test(f));
const NOM = NOMS[0];
const VERSIO = NOM?.slice(0, 10);
const SQL = NOM ? readFileSync(path.join(MIGRACIONS, NOM), 'utf8') : '';
const SQL_LEASE=readFileSync(path.join(MIGRACIONS,'2611080431_xat_push_leases.sql'),'utf8');
const README = readFileSync(path.join(ARREL, 'supabase/README.md'), 'utf8');
const ORDRE_DESPLEGAMENT = JSON.parse(readFileSync(path.join(ARREL, 'supabase/ordre_desplegament.json'), 'utf8'));
const FUNCIO = path.join(ARREL, 'supabase/functions/notifica-xat');
const GESTOR = readFileSync(path.join(FUNCIO, 'gestor.js'), 'utf8');
/* ARB-P01-05: S3 (natius.js) pot no arribar a la integració; la spec admet S2 sense natius (§2.6, §7.3). */
const NATIUS_JS = existsSync(path.join(FUNCIO, 'natius.js')) ? readFileSync(path.join(FUNCIO, 'natius.js'), 'utf8') : null;
const WORKER = [GESTOR, NATIUS_JS].filter((text) => text !== null).join('\n');
const WEBPUSH = readFileSync(path.join(FUNCIO, 'webpush.js'), 'utf8');

const NO_APLICADA = "-- NO aplicada: l'aplica el Mestre, mai un agent.";
/* Sense comentaris de línia: es comprova el codi, no la prosa (cap literal del SQL porta «--»). */
const senseComentaris = (sql) => sql.split('\n').map((linia) => linia.replace(/--.*$/, '')).join('\n');
const pla = (text) => text.replace(/\s+/g, ' ').trim();
const ROLS = 'from public, anon, authenticated, service_role;';
const GUARDA = "if coalesce((select auth.role()), '') <> 'service_role' then raise exception 'SDP-PUSH-000: només el servidor.' using errcode = '42501'; end if;";
const PLATAFORMA = "case p_plataforma when 'web' then 'web' when 'ios' then 'apns' when 'android' then 'fcm' else null end";
const ADRECA_APNS = "case when v_tipus = 'apns' then lower(p_adreca) else p_adreca end";
const ACTIU = "coalesce((select a.valor from private.ajustos a where a.clau = 'push_xat_actiu'), '')";

/** Cada funció: esquema, nom, paràmetres, capçalera (de «)» a «as $$») i cos (pla). */
function funcions(sql) {
  const codi = senseComentaris(sql);
  const re = /create\s+(?:or\s+replace\s+)?function\s+(\w+)\.(\w+)\s*\(([^)]*)\)([\s\S]*?)\bas\s+\$(\w*)\$/gi;
  const eixida = [];
  let m;
  while ((m = re.exec(codi))) {
    const tanca = `$${m[5]}$`;
    const inici = re.lastIndex;
    const fi = codi.indexOf(tanca, inici);
    expect(fi, `cos sense tancar a ${m[1]}.${m[2]}`).toBeGreaterThan(inici);
    eixida.push({ esquema: m[1], nom: m[2], params: pla(m[3]), capcalera: pla(m[4]), cos: pla(codi.slice(inici, fi)) });
    re.lastIndex = fi + tanca.length;
  }
  return eixida;
}
const funcio = (sql, esquema, nom) => {
  const trobades = funcions(sql).filter((f) => f.esquema === esquema && f.nom === nom);
  expect(trobades, `${esquema}.${nom}`).toHaveLength(1);
  return trobades[0];
};
/* Els tipus d'una llista de paràmetres, com els escriu un GRANT: «p_x text default null» → «text». */
const tipusDe = (params) => (params ? params.split(',').map((p) => pla(p).split(' ')[1]).join(', ') : '');
const nomsDe = (params) => (params ? params.split(',').map((p) => pla(p).split(' ')[0]) : []);

/* §2.9 i §2.5: les signatures exactes (el client crida amb paràmetres amb nom; un altre nom és un 404 de PostgREST). */
const CLIENT = Object.freeze({
  xat_push_desa: { params: 'p_plataforma text, p_adreca text, p_caduca_al timestamptz default null, p_llengua text default null, p_gest boolean default false', torna: 'void' },
  xat_push_retira: { params: 'p_plataforma text, p_adreca text', torna: 'void' },
  xat_silencia: { params: 'p_fil_id uuid, p_durada text', torna: 'timestamptz' }
});
const SERVIDOR = Object.freeze({
  xat_push_reclama: { params: 'p_limit integer default 50', torna: 'jsonb' },
  xat_push_expulsa: { params: 'p_ids uuid[]', torna: 'integer' },
  xat_push_neteja: { params: '', torna: 'jsonb' },
  xat_push_credencial: { params: 'p_proveidor text', torna: 'text' },
  xat_push_desa_credencial: { params: 'p_proveidor text, p_valor text, p_caduca_al timestamptz', torna: 'boolean' }
});
const PRIVADES = Object.freeze(['xat_push_adreca_valida', 'xat_push_encua']);
/* Les dues RPC del worker que només criden els enviadors natius (S3, natius.js). */
const RPC_NATIUS = Object.freeze(['xat_push_credencial', 'xat_push_desa_credencial']);

/* ── Les comprovacions, com a funcions del text (les mutacions del final les tornen a passar) ── */

function comprovaCapcalera(sql) {
  const capcalera = sql.slice(0, sql.search(/^begin;/m));
  expect(capcalera).toMatch(new RegExp(`^-- =+\\n-- ${VERSIO.slice(0, 6)}_${VERSIO.slice(6)} · B8-SERVIDOR \\(marató 261101_2143; ordre del Mestre 261101\\) ·\\n`));
  for (const apartat of [/^-- PER QUÈ: /m, /^-- QUÈ FA:$/m, /^-- QUÈ NO FA:$/m, /^-- CODIS:$/m, /^-- Depén de: /m, /^-- ORDRE \(decisió del Mestre\): /m, /^-- Verificació posterior \(lectura\):$/m]) {
    expect(capcalera).toMatch(apartat);
  }
  expect(sql.split('\n').filter((l) => l === NO_APLICADA)).toHaveLength(1);
  expect(capcalera).toContain('-- Idempotent i en una sola transacció.');
  /* Cap rastre del prototip de la spec. */
  expect(sql).not.toMatch(/PROTOTIP|HHMM|26110HHHMM/);
  /* Cada codi que es llança és a CODIS, i CODIS no en promet cap que no existisca. */
  const codis = new Set([...capcalera.matchAll(/^-- {3}(SDP-(?:PUSH|XAT)-\d{3}) /gm)].map((m) => m[1]));
  const llancats = new Set([...senseComentaris(sql).matchAll(/raise (?:exception|warning) '(SDP-(?:PUSH|XAT)-\d{3}):/g)].map((m) => m[1]));
  expect([...llancats].sort()).toEqual([...codis].sort());
}

function comprovaTransaccio(sql) {
  const codi = senseComentaris(sql);
  expect(codi.match(/^begin;$/gm)).toHaveLength(1);
  expect(codi.match(/^commit;$/gm)).toHaveLength(1);
  expect(codi.search(/^begin;$/m)).toBeLessThan(codi.search(/\bcreate\b/));
  expect(codi.trimEnd().endsWith('commit;')).toBe(true);
  expect(codi).toMatch(/^set local lock_timeout = '\d+s';$/m);
  expect(codi).toMatch(/^set local statement_timeout = '\d+s';$/m);
}

function comprovaTaula(sql) {
  const codi = pla(senseComentaris(sql));
  const taula = codi.match(/create table if not exists public\.xat_dispositius_push \((.*?)\); create index/);
  expect(taula, 'la taula d’aparells').not.toBeNull();
  const cos = taula[1];
  expect(cos).toContain('id uuid primary key default gen_random_uuid()');
  expect(cos).toContain('usuari_id uuid not null references auth.users (id) on delete cascade');
  expect(cos).toContain("constraint xat_dispositius_push_tipus_valid check (tipus in ('web', 'apns', 'fcm'))");
  expect(cos).toContain("llengua text not null default 'ca' constraint xat_dispositius_push_llengua_valida check (llengua in ('ca', 'es', 'en', 'eu', 'gl'))");
  expect(cos).toContain('constraint xat_dispositius_push_unic unique (tipus, adreca)');
  expect(cos).toMatch(/constraint xat_dispositius_push_adreca_forma check \( \(tipus = 'web' and .*\) or \(tipus = 'apns' and .*\) or \(tipus = 'fcm' and .*\)\)/);
  expect(codi).toContain('create index if not exists xat_dispositius_push_usuari_idx on public.xat_dispositius_push (usuari_id, renovat_al desc);');
  /* R1: Postgres no admet repeticions de més de 255 ({32,1024} → 2201B al primer INSERT). */
  for (const m of sql.matchAll(/\{(\d+)(?:,(\d*))?\}/g)) {
    for (const n of [m[1], m[2]].filter(Boolean)) expect(Number(n), `repetició ${m[0]}`).toBeLessThanOrEqual(255);
  }
}

function comprovaRls(sql) {
  const codi = pla(senseComentaris(sql));
  expect(codi).toContain('alter table public.xat_dispositius_push enable row level security;');
  expect(codi).toContain(`revoke all on table public.xat_dispositius_push ${ROLS}`);
  /* Una sola política, de lectura i de propietari. Ningú hi escriu: només les RPC. */
  const politiques = [...codi.matchAll(/create policy "(\w+)" on public\.xat_dispositius_push (.*?);/g)];
  expect(politiques).toHaveLength(1);
  expect(politiques[0][2]).toBe('for select to authenticated using (usuari_id = (select auth.uid()))');
  expect(codi).toContain(`drop policy if exists "${politiques[0][1]}" on public.xat_dispositius_push;`);
  /* Un sol GRANT de taula, per columnes i sense l'adreça (un endpoint és una URL de capacitat). */
  const grants = [...codi.matchAll(/grant ([^;]*?) on table ([\w.]+) to ([^;]+);/g)];
  expect(grants.map((g) => [g[1], g[2], g[3]])).toEqual([
    ['select (id, usuari_id, tipus, llengua, caduca_al, creat_al, renovat_al)', 'public.xat_dispositius_push', 'authenticated']
  ]);
  expect(codi.indexOf('revoke all on table public.xat_dispositius_push')).toBeLessThan(codi.indexOf('grant select (id,'));
  /* ARB-P01-03: les taules privades, amb RLS i sense cap política (només hi entren les funcions de l'amo),
     com totes les private des de 2610201500. */
  for (const privada of ['private.xat_push_cua', 'private.xat_push_credencials']) {
    expect(codi).toContain(`create table if not exists ${privada} (`);
    const rls = `alter table ${privada} enable row level security;`;
    expect(codi, `RLS a ${privada}`).toContain(rls);
    expect(codi).toContain(`revoke all on table ${privada} ${ROLS}`);
    expect(codi.indexOf(rls)).toBeLessThan(codi.indexOf(`revoke all on table ${privada} ${ROLS}`));
  }
  expect(codi).not.toMatch(/create policy [^;]* on private\./);
  /* Cap taula nova sense RLS. */
  for (const [, taula] of codi.matchAll(/create table if not exists ([\w.]+) \(/g)) {
    expect(codi, `RLS a ${taula}`).toContain(`alter table ${taula} enable row level security;`);
  }
}

function comprovaFuncions(sql) {
  const totes = funcions(sql);
  const esperades = [...PRIVADES.map((n) => `private.${n}`), ...Object.keys(CLIENT).map((n) => `public.${n}`), ...Object.keys(SERVIDOR).map((n) => `public.${n}`)];
  expect(totes.map((f) => `${f.esquema}.${f.nom}`).sort()).toEqual(esperades.sort());
  for (const f of totes) {
    expect(f.capcalera, `${f.nom}: search_path buit`).toContain("set search_path = ''");
    expect(f.params, `${f.nom}: cap paràmetre jsonb`).not.toMatch(/\bjsonb?\b/);
    if (f.nom === 'xat_push_adreca_valida') {
      expect(f.capcalera).toMatch(/\bimmutable\b/);
      expect(f.capcalera).not.toContain('security definer');
    } else {
      expect(f.capcalera, `${f.nom}: security definer`).toContain('security definer');
    }
  }
  const codi = senseComentaris(sql);
  /* SQL dinàmic: qualsevol EXECUTE que no siga «grant execute on» ni «execute function» del disparador. */
  expect(codi).not.toMatch(/jsonb_populate_record|jsonb_to_record|\bexecute\s+(?!on\b|function\b)|format\(|\|\|/i);
}

function comprovaSignatures(sql) {
  for (const [nom, { params, torna }] of Object.entries({ ...CLIENT, ...SERVIDOR })) {
    const f = funcio(sql, 'public', nom);
    expect(f.params, nom).toBe(params);
    expect(f.capcalera, nom).toMatch(new RegExp(`^returns ${torna.replace('[', '\\[')} `));
  }
  /* Els noms de la primera versió de la spec (abans d'ARB-B8S-01) ja no valen. */
  expect(sql).not.toMatch(/xat_desa_dispositiu_push|xat_retira_dispositiu_push|xat_silencia_durada|\bp_fins\b|SDP_VAPID_/);
  for (const nom of Object.keys(CLIENT)) expect(nomsDe(funcio(sql, 'public', nom).params)).not.toContain('p_tipus');
}

function comprovaPermisos(sql) {
  const codi = pla(senseComentaris(sql));
  const grants = [...codi.matchAll(/grant execute on function ([\w.]+)\(([^)]*)\) to (\w+);/g)].map((m) => `${m[1]}(${m[2]}) → ${m[3]}`);
  const esperats = [
    ...Object.entries(CLIENT).map(([nom, { params }]) => `public.${nom}(${tipusDe(params)}) → authenticated`),
    ...Object.entries(SERVIDOR).map(([nom, { params }]) => `public.${nom}(${tipusDe(params)}) → service_role`)
  ];
  expect(grants.sort()).toEqual(esperats.sort());
  for (const [nom, { params }] of Object.entries({ ...CLIENT, ...SERVIDOR })) {
    const revoke = `revoke all on function public.${nom}(${tipusDe(params)}) ${ROLS}`;
    expect(codi.split(revoke), `revoke de ${nom}`).toHaveLength(2);
    expect(codi.indexOf(revoke)).toBeLessThan(codi.indexOf(`grant execute on function public.${nom}(`));
  }
  expect(codi).toContain(`revoke all on function private.xat_push_adreca_valida(text, text) ${ROLS}`);
  expect(codi).toContain(`revoke all on function private.xat_push_encua() ${ROLS}`);
  expect(codi).not.toMatch(/grant [^;]* to (?:anon|public)\b/);
  expect(codi).not.toMatch(/grant [^;]* on function private\./);
  /* La guarda és la primera sentència de les cinc del worker, i cap RPC del client no la porta. */
  for (const nom of Object.keys(SERVIDOR)) expect(funcio(sql, 'public', nom).cos, nom).toMatch(new RegExp(`^(?:declare .*? )?begin ${GUARDA.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  for (const nom of Object.keys(CLIENT)) expect(funcio(sql, 'public', nom).cos, nom).not.toContain("auth.role()");
  /* Les tres del client: qui crida ix d'auth.uid(), i la sessió és la primera comprovació. */
  for (const [nom, codiError] of [['xat_push_desa', 'SDP-PUSH-001'], ['xat_push_retira', 'SDP-PUSH-001'], ['xat_silencia', 'SDP-XAT-001']]) {
    const cos = funcio(sql, 'public', nom).cos;
    expect(cos, nom).toMatch(/^declare v_jo uuid := \(select auth\.uid\(\)\);/);
    expect(cos, nom).toMatch(new RegExp(` begin if v_jo is null then raise exception '${codiError}: [^']*' using errcode = '42501'; end if; `));
    expect(cos.indexOf(' begin if v_jo is null then '), nom).toBe(cos.indexOf(' begin '));
  }
}

function comprovaDisparador(sql) {
  const codi = pla(senseComentaris(sql));
  const drop = 'drop trigger if exists xat_missatges_push_encua on public.xat_missatges;';
  const crea = "create trigger xat_missatges_push_encua after insert on public.xat_missatges for each row when (new.tipus is distinct from 'sistema' and new.usuari_id is not null) execute function private.xat_push_encua();";
  expect(codi).toContain(drop);
  expect(codi).toContain(crea);
  expect(codi.indexOf(drop)).toBeLessThan(codi.indexOf(crea));
  const cos = funcio(sql, 'private', 'xat_push_encua').cos;
  /* ARB-B8S-03: la poda fitada és el primer que fa, FORA de l'if de l'ajust (la retenció no depén del worker). */
  expect(cos).toMatch(/^begin delete from private\.xat_push_cua c where c\.id in \(select q\.id from private\.xat_push_cua q where q\.creat_al < now\(\) - interval '1 hour' order by q\.creat_al limit 100 for update skip locked\); if /);
  expect(cos).toContain(`if ${ACTIU} = 'si' then insert into private.xat_push_cua (fil_id, missatge_id, autor_id, com_org_id, resposta_a) values (new.fil_id, new.id, new.usuari_id, new.com_org_id, new.resposta_a); end if;`);
  /* Cap error de la cua no atura mai un missatge. */
  expect(cos).toMatch(/return null; exception when others then raise warning 'SDP-PUSH-900: (?:[^']|'')*\(%\)\.', sqlstate; return null; end;$/);
  expect(cos).not.toContain('raise exception');
}

function comprovaDesa(sql) {
  const cos = funcio(sql, 'public', 'xat_push_desa').cos;
  const llegeixActiu = cos.indexOf(`if ${ACTIU} <> 'si' then raise exception 'SDP-PUSH-010:`);
  expect(llegeixActiu).toBeGreaterThan(0);
  expect(llegeixActiu).toBeLessThan(cos.search(/\b(?:insert into|delete from|update)\b/));
  expect(cos).toContain(`v_tipus := ${PLATAFORMA};`);
  expect(cos).toContain(`v_adreca := ${ADRECA_APNS};`);
  /* Coacció exacta de la plataforma, i la minúscula només per al testimoni d'APNs. */
  expect(cos).not.toMatch(/(?:lower|upper|btrim|trim)\(p_plataforma/);
  expect(cos.match(/lower\(p_adreca\)/g)).toHaveLength(1);
  expect(cos).toContain('if not private.xat_push_adreca_valida(v_tipus, v_adreca) then raise exception \'SDP-PUSH-003:');
  expect(cos).toContain("if p_caduca_al is not null and (not isfinite(p_caduca_al) or p_caduca_al <= now()) then raise exception 'SDP-PUSH-004:");
  /* ARB-B8S-04: el canvi d'amo només amb gest, en la mateixa ordre (atòmic), i 011 si no ha tocat cap fila. */
  expect(cos).toContain('on conflict (tipus, adreca) do update set usuari_id = excluded.usuari_id, llengua = excluded.llengua, caduca_al = excluded.caduca_al, renovat_al = now() where d.usuari_id = excluded.usuari_id or v_gest; get diagnostics v_n = row_count; if v_n = 0 then raise exception \'SDP-PUSH-011:');
  expect(cos).toContain('v_gest boolean := coalesce(p_gest, false);');
  expect(cos).toMatch(/order by x\.renovat_al desc, x\.id desc offset 10\);/);
  const retira = funcio(sql, 'public', 'xat_push_retira').cos;
  expect(retira).toContain(`v_tipus text := ${PLATAFORMA};`);
  expect(retira).toContain(`and d.adreca = ${ADRECA_APNS};`);
  expect(retira).toContain('d.usuari_id = v_jo');
  /* Retirar és la baixa en eixir: funciona amb els avisos apagats. */
  expect(retira).not.toContain('push_xat_actiu');
}

function comprovaSilenci(sql) {
  const cos = funcio(sql, 'public', 'xat_silencia').cos;
  expect(cos).toContain("if p_fil_id is null or p_durada is null or p_durada not in ('8h', '1setmana', 'sempre', 'cap') then raise exception 'SDP-XAT-050:");
  expect(cos).toContain("when '8h' then now() + interval '8 hours' when '1setmana' then now() + interval '7 days' when 'sempre' then timestamptz '9999-12-31 00:00:00+00' else null end;");
  /* ARB-P01-01: és l'únic camí d'escriptura d'authenticated a xat_participants (definer): només la fila de qui crida. */
  expect(cos).toContain('update public.xat_participants p set silenciat_fins_al = v_fins where p.fil_id = p_fil_id and p.usuari_id = v_jo and p.visible_fins_seq is null and private.xat_participant_vigent(p_fil_id, v_jo);');
  expect(cos.match(/\bupdate\b/g)).toHaveLength(1);
  expect(cos).toContain("if not found then raise exception 'SDP-XAT-006:");
  /* ARB-B8S-05: mai infinity ni 23:59:59 (NaN a new Date() fora d'UTC), ni cap data d'entrada. */
  expect(senseComentaris(sql)).not.toMatch(/23:59:59|infinity/i);
  expect(funcio(sql, 'public', 'xat_silencia').params).not.toContain('timestamptz');
}

function comprovaReclam(sql) {
  const cos = funcio(sql, 'public', 'xat_push_reclama').cos;
  expect(cos).toContain('v_lot integer := greatest(1, least(coalesce(p_limit, 50), 200));');
  expect(cos).toContain('order by q.id limit v_lot for update skip locked');
  expect(cos).toContain("l.creat_al > now() - interval '15 minutes'");
  /* ARB-B8S-07: el General i els Avisos de pàgines i comunitats, només amb push_xat_generals. */
  expect(cos).toContain("and (f.tipus = 'directe' or (f.tipus in ('canal', 'grup') and ((f.comunitat_id is null and f.subjecte_tipus is null) or v_generals)))");
  /* ARB-B8S-06: el retall de 5.000 no deixa fora sempre els mateixos (ordre aleatori). ARB-P01-02: i se'n queda
     un prefix que no passa del pressupost d'octets, mesurat sobre el JSON mateix que ix (amb les cometes escapades). */
  expect(cos).toContain("mostra as ( select jsonb_build_object('id', c.id, 'tipus', c.tipus, 'adreca', c.adreca, 'llengua', c.llengua) as fila, random() as atzar from candidats c order by atzar limit 5000 )");
  expect(cos).toMatch(/ dispositius as \( select f\.fila from \(select m\.fila, sum\(octet_length\(m\.fila::text\) \+ 2\) over \(order by m\.atzar rows between unbounded preceding and current row\) as octets from mostra m\) f where f\.octets <= \d+ \) select /);
  expect(cos).toContain("(select count(*) from candidats)::integer - (select count(*) from dispositius)::integer, coalesce((select jsonb_agg(s.fila) from dispositius s), '[]'::jsonb) into v_missatges, v_retallats, v_dispositius;");
  /* Missatges vigents: de menys de 15 minuts i no esborrats. Un aparell, un avís per lot (distinct). */
  expect(cos).toContain("vigents as ( select l.* from lot l where l.creat_al > now() - interval '15 minutes' and exists (select 1 from public.xat_missatges m where m.id = l.missatge_id and m.esborrat_al is null) )");
  expect(cos).toContain('destinataris as ( select distinct p.usuari_id from vigents v ');
  /* Avisos: 'tots', o 'destacats' només quan el missatge respon un missatge de la persona mateixa. */
  expect(cos).toContain("and (p.avisos = 'tots' or (p.avisos = 'destacats' and v.resposta_a is not null and exists (select 1 from public.xat_missatges r where r.id = v.resposta_a and r.usuari_id = p.usuari_id)))");
  /* Privacitat: qui ha bloquejat la persona que escriu o l'entitat que signa no rep res. */
  expect(cos).toContain("and not exists (select 1 from public.bloquejos b where b.bloquejador = p.usuari_id and ((b.bloquejat_tipus = 'persona' and b.bloquejat_persona = v.autor_id) or (b.bloquejat_tipus = 'entitat' and v.com_org_id is not null and b.bloquejat_entitat = v.com_org_id)))");
  expect(cos).toContain('where (d.caduca_al is null or d.caduca_al > now()) and d.renovat_al > now() - make_interval(days => v_dies)');
  for (const filtre of ['p.usuari_id is distinct from v.autor_id', 'p.visible_fins_seq is null', 'p.arxivat_al is null', '(p.silenciat_fins_al is null or p.silenciat_fins_al <= now())',
    'not (v.com_org_id is not null and p.com_org_id is not distinct from v.com_org_id)', 'private.xat_participant_vigent(v.fil_id, p.usuari_id)',
    'not exists (select 1 from private.baixes bx where bx.user_id = p.usuari_id)']) {
    expect(cos, filtre).toContain(filtre);
  }
  /* Un ajust de dies que no és un enter de 32 bits cau en 60: mai atura el worker ('9999999999'::integer dona 22003, no 22P02). */
  for (const nom of ['xat_push_reclama', 'xat_push_neteja']) {
    expect(funcio(sql, 'public', nom).cos, nom).toContain('exception when invalid_text_representation or numeric_value_out_of_range then v_dies := null; end; v_dies := coalesce(v_dies, 60);');
  }
}

/* ARB-P01-04: els límits de les RPC del worker. */
function comprovaWorker(sql) {
  const expulsa = funcio(sql, 'public', 'xat_push_expulsa').cos;
  expect(expulsa).toContain("if p_ids is null or cardinality(p_ids) not between 1 and 1000 then raise exception 'SDP-PUSH-005:");
  expect(expulsa).toContain('delete from public.xat_dispositius_push d where d.id = any (p_ids);');
  const neteja = funcio(sql, 'public', 'xat_push_neteja').cos;
  expect(neteja).toContain('where (x.caduca_al is not null and x.caduca_al <= now()) or x.renovat_al <= now() - make_interval(days => v_dies) limit 1000);');
  expect(neteja).toContain("delete from private.xat_push_cua c where c.creat_al <= now() - interval '1 hour';");
  /* La credencial vigent, amb cinc minuts de marge; una de nova, d'ara a 65 minuts i sense substituir-ne una de més llarga. */
  expect(funcio(sql, 'public', 'xat_push_credencial').cos).toContain("where c.proveidor = p_proveidor and c.caduca_al > now() + interval '5 minutes');");
  const desa = funcio(sql, 'public', 'xat_push_desa_credencial').cos;
  expect(desa).toContain("if p_proveidor is null or p_proveidor not in ('apns', 'fcm') or p_valor is null or char_length(p_valor) not between 20 and 4096 or p_valor !~ '^[A-Za-z0-9._-]+$' or p_caduca_al is null or not isfinite(p_caduca_al) or p_caduca_al <= now() or p_caduca_al > now() + interval '65 minutes' then raise exception 'SDP-PUSH-005:");
  expect(desa).toContain('on conflict (proveidor) do update set valor = excluded.valor, caduca_al = excluded.caduca_al where c.caduca_al < excluded.caduca_al;');
}

/* «2 * 1024 * 1024» → 2097152. */
const producte = (expressio) => expressio.split('*').map((x) => Number(x.trim())).reduce((a, b) => a * b, 1);

/* ARB-P01-02: el reclam cap sencer en el cos que el worker llig (MAXIM_COS_BASE de gestor.js), perquè el lot ja
   s'ha esborrat quan el worker el llig; i el sostre d'aparells és el mateix a les dues bandes. */
function comprovaPressupost(sql, gestor = GESTOR) {
  const cos = funcio(sql, 'public', 'xat_push_reclama').cos;
  const pressupost = cos.match(/ where f\.octets <= (\d+) \) select /);
  const sostre = cos.match(/ order by atzar limit (\d+) \)/);
  const cosBase = gestor.match(/MAXIM_COS_BASE: ([\d\s*]+),/);
  const maximDispositius = gestor.match(/MAXIM_DISPOSITIUS: (\d+)\b/);
  for (const [nom, m] of Object.entries({ pressupost, sostre, cosBase, maximDispositius })) expect(m, nom).not.toBeNull();
  expect(Number(sostre[1])).toBe(Number(maximDispositius[1]));
  /* El sobre ({"missatges": …, "retallats": …, "dispositius": […]}) hi cap amb 64 KiB de marge. */
  expect(Number(pressupost[1]) + 64 * 1024).toBeLessThanOrEqual(producte(cosBase[1]));
  /* I un lot sencer d'aparells web típics (endpoint de 190) no es retalla: 285 octets per fila, com mesura PGlite. */
  const fila = `{"id": "${'0'.repeat(8)}-0000-4000-8000-${'0'.repeat(12)}", "tipus": "web", "adreca": "${'x'.repeat(190)}", "llengua": "ca"}`;
  expect(Number(sostre[1]) * (fila.length + 2)).toBeLessThanOrEqual(Number(pressupost[1]));
}

function comprovaSenseXarxa(sql) {
  expect(senseComentaris(sql)).not.toMatch(/pg_net|\bnet\.|vault\.|http_post|cron\.schedule|service_role_key|secret|sb_secret|eyJ/i);
}

/** Les regles de private.xat_push_adreca_valida, llegides del SQL. */
function reglesDelValidador(sql) {
  const cos = funcio(sql, 'private', 'xat_push_adreca_valida').cos;
  const apns = cos.match(/if p_tipus = 'apns' then return p_adreca ~ '([^']+)'; end if;/);
  const fcm = cos.match(/if p_tipus = 'fcm' then return char_length\(p_adreca\) between (\d+) and (\d+) and p_adreca ~ '([^']+)'; end if;/);
  const web = cos.match(/if char_length\(p_adreca\) > (\d+) or p_adreca !~ '([^']+)' or position\('#' in p_adreca\) > 0 then return false; end if; v_resta := substr\(p_adreca, (\d+)\); if position\('\/' in v_resta\) = 0 then return false; end if; v_host := split_part\(v_resta, '\/', 1\); if v_host !~ '([^']+)' or left\(v_host, 1\) = '\.' or position\('\.\.' in v_host\) > 0 then return false; end if;/);
  const exactes = cos.match(/return v_host in \(([^)]*)\)/);
  for (const [nom, m] of Object.entries({ apns, fcm, web, exactes })) expect(m, `regla ${nom} del validador`).not.toBeNull();
  const sufixos = [...cos.matchAll(/or v_host like '%([^']+)'/g)].map((m) => m[1]);
  /* En LIKE, «_» i «%» són comodins: els sufixos han de ser literals. */
  for (const s of sufixos) expect(s).toMatch(/^\.[a-z0-9.-]+$/);
  expect(Number(web[3])).toBe('https://'.length + 1);
  return {
    apns: new RegExp(apns[1]), fcmMin: Number(fcm[1]), fcmMax: Number(fcm[2]), fcm: new RegExp(fcm[3]),
    webMax: Number(web[1]), web: new RegExp(web[2]), inici: Number(web[3]), host: new RegExp(web[4]),
    exactes: [...exactes[1].matchAll(/'([^']+)'/g)].map((m) => m[1]), sufixos
  };
}

/** El mateix algorisme que la funció SQL, amb les regles que n'han eixit. */
function validaSegonsSql(r, tipus, adreca) {
  if (tipus == null || adreca == null) return false;
  if (tipus === 'apns') return r.apns.test(adreca);
  if (tipus === 'fcm') return adreca.length >= r.fcmMin && adreca.length <= r.fcmMax && r.fcm.test(adreca);
  if (tipus !== 'web') return false;
  if (adreca.length > r.webMax || !r.web.test(adreca) || adreca.includes('#')) return false;
  const resta = adreca.slice(r.inici - 1);
  if (!resta.includes('/')) return false;
  const host = resta.split('/')[0];
  if (!r.host.test(host) || host.startsWith('.') || host.includes('..')) return false;
  return r.exactes.includes(host) || r.sufixos.some((s) => host.endsWith(s));
}

/** El CHECK de forma de la taula, llegit del SQL. */
function checkDeLaTaula(sql) {
  const codi = pla(senseComentaris(sql));
  const m = codi.match(/constraint xat_dispositius_push_adreca_forma check \( \(tipus = 'web' and char_length\(adreca\) <= (\d+) and adreca ~ '([^']+)'\) or \(tipus = 'apns' and adreca ~ '([^']+)'\) or \(tipus = 'fcm' and char_length\(adreca\) between (\d+) and (\d+) and adreca ~ '([^']+)'\)\)/);
  expect(m, 'el CHECK de forma').not.toBeNull();
  const [webMax, web, apns, fcmMin, fcmMax, fcm] = [Number(m[1]), new RegExp(m[2]), new RegExp(m[3]), Number(m[4]), Number(m[5]), new RegExp(m[6])];
  return (tipus, adreca) => (tipus === 'web' && adreca.length <= webMax && web.test(adreca))
    || (tipus === 'apns' && apns.test(adreca))
    || (tipus === 'fcm' && adreca.length >= fcmMin && adreca.length <= fcmMax && fcm.test(adreca));
}

/* Els quatre serveis reals (B8-SERVIDOR §3, S1 prova 13) i els enganys que el servidor ha de rebutjar. */
const REALS = Object.freeze([
  'https://fcm.googleapis.com/fcm/send/abcDEF_123-xyz:APA91bHPRgkF',
  'https://updates.push.services.mozilla.com/wpush/v2/gAAAAABk-x_y',
  'https://web.push.apple.com/QGx1bGx5IGFub255bW91cw',
  'https://wns2-par02p.notify.windows.com/w/?token=BQYAAAB%2bx'
]);
const ENGANYS = Object.freeze([
  'http://fcm.googleapis.com/x', 'HTTPS://fcm.googleapis.com/x', 'https://evil.example.com/x', 'https://fcm.googleapis.com:443/x',
  'https://u:p@fcm.googleapis.com/x', 'https://fcm.googleapis.com/x#f', 'https://FCM.googleapis.com/x', 'https://fcm.googleapis.com',
  'https://fcm.googleapis.com./x', 'https://push.apple.com.evil.com/x', 'https://.push.apple.com/x', 'https://a..push.apple.com/x',
  'https://xpush.apple.com/x', 'https://evilnotify.windows.com/x', 'https://notify.windows.com.evil/x', 'https://127.0.0.1/x',
  'https://169.254.169.254/latest', 'https://[::1]/x', 'https://fcm.googleapis.com/x y', 'https://fcm.googleapis.com/é',
  'https://fcm.googleapis.com\\@evil.com/x', 'https://evil.com%2f@fcm.googleapis.com/x', 'https://fcm.googleapis.com?x/y',
  `https://fcm.googleapis.com/${'a'.repeat(2048)}`, ''
]);
const NATIUS = Object.freeze([
  ['apns', 'a'.repeat(64), true], ['apns', '0f'.repeat(100), true], ['apns', 'A'.repeat(64), false], ['apns', 'a'.repeat(63), false],
  ['apns', 'a'.repeat(201), false], ['apns', 'g'.repeat(64), false], ['fcm', 'x'.repeat(31), false], ['fcm', 'x'.repeat(32), true],
  ['fcm', 'dXNlcl90b2tlbl9leGFtcGxlOkFQQTkxYkhQ_abc-123', true], ['fcm', 'x'.repeat(1024), true], ['fcm', 'x'.repeat(1025), false],
  ['fcm', `${'x'.repeat(40)} y`, false], ['fcm', `${'x'.repeat(40)}/`, false], ['web', 'a'.repeat(64), false], ['sms', 'a'.repeat(64), false]
]);

function comprovaParitat(sql, serveis = SERVEIS_DE_PUSH, forma = formaDeLaSubscripcio) {
  const r = reglesDelValidador(sql);
  const check = checkDeLaTaula(sql);
  for (const e of REALS) {
    expect(validaSegonsSql(r, 'web', e), `servidor: ${e}`).toBe(true);
    expect(serveis.some((s) => s.test(new URL(e).hostname)), `SERVEIS_DE_PUSH: ${e}`).toBe(true);
  }
  for (const e of ENGANYS) expect(validaSegonsSql(r, 'web', e), `enganys: ${e.slice(0, 60)}`).toBe(false);
  /* Servidor ⊆ client (R6): el que la RPC admet, el client també ho desa; i el CHECK de la taula no el rebutja (un 23514 en lloc de SDP-PUSH-003). */
  for (const e of [...REALS, ...ENGANYS]) {
    if (!validaSegonsSql(r, 'web', e)) continue;
    expect(forma({ endpoint: e }), `client: ${e}`).not.toBeNull();
    expect(check('web', e), `CHECK: ${e}`).toBe(true);
  }
  for (const [tipus, adreca, admesa] of NATIUS) {
    expect(validaSegonsSql(r, tipus, adreca), `${tipus} ${adreca.slice(0, 20)}…`).toBe(admesa);
    if (admesa) expect(check(tipus, adreca), `CHECK ${tipus}`).toBe(true);
  }
  /* Les mateixes llistes i el mateix sostre que el client i que el worker (webpush.js). */
  expect(r.webMax).toBe(MAXIM_ENDPOINT);
  const llista = (nom) => [...(WEBPUSH.match(new RegExp(`export const ${nom} = Object\\.freeze\\(\\[([^\\]]*)\\]\\)`)) ?? ['', ''])[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  expect([...r.exactes].sort()).toEqual(llista('AMFITRIONS_EXACTES').sort());
  expect([...r.sufixos].sort()).toEqual(llista('SUFIXOS_ADMESOS').sort());
  expect(WEBPUSH).toMatch(new RegExp(`MAXIM_ENDPOINT: ${r.webMax}\\b`));
}

/* R13: cada rpc() del worker existix a la migració amb eixos noms de paràmetre, i els obligatoris hi són. */
function comprovaCridesDelWorker(sql, worker = WORKER, ambNatius = NATIUS_JS !== null, lease=SQL_LEASE) {
  const crides = [...worker.matchAll(/rpc\('(xat_push_\w+)',\s*\{([^}]*)\}/g)].map((m) => ({ nom: m[1], claus: [...m[2].matchAll(/(\w+):/g)].map((c) => c[1]) }));
  // Legacy migration invariants below remain unchanged. The active worker's
  // exact contract is now supplied by the additive lease-v2 migration.
  const servidor=['xat_push_neteja','xat_push_reclama_v2','xat_push_confirma_v2',...RPC_NATIUS];
  const cridades = servidor.filter((nom) => ambNatius || !RPC_NATIUS.includes(nom));
  expect(new Set(crides.map((c) => c.nom))).toEqual(new Set(cridades));
  for (const { nom, claus } of crides) {
    // CREATE OR REPLACE in the later migration is the effective contract.
    const active = funcions(lease).some(f => f.esquema === 'public' && f.nom === nom) ? lease : sql;
    const f = funcio(active, 'public', nom);
    const params = f.params ? f.params.split(',').map((p) => pla(p)) : [];
    const noms = params.map((p) => p.split(' ')[0]);
    for (const c of claus) expect(noms, `${nom}: ${c}`).toContain(c);
    for (const p of params.filter((p) => !/\bdefault\b/.test(p))) expect(claus, `${nom}: ${p} és obligatori`).toContain(p.split(' ')[0]);
  }
  const rpcDelWorker = worker.match(/export const RPC_DEL_WORKER = Object\.freeze\(\[([^\]]*)\]\)/);
  expect(rpcDelWorker, 'RPC_DEL_WORKER de gestor.js').not.toBeNull();
  /* Amb natius, exactament les cinc de service_role; sense, la spec admet també la llista sense les credencials (§2.6). */
  const admeses = ambNatius ? [[...servidor].sort()] : [[...servidor].sort(), [...cridades].sort()];
  expect(admeses).toContainEqual([...rpcDelWorker[1].matchAll(/'([^']+)'/g)].map((m) => m[1]).sort());
}

/* Els adaptadors del client (src/data, sense proves) que nomenen una RPC del client: B8C-2 els escriu en un altre carril.
   Si encara no n'hi ha cap, la paritat no té res a comparar, però els noms vells continuen prohibits. */
const RPC_CLIENT = /rpc\('(xat_push_desa|xat_push_retira|xat_silencia)',\s*(?:\{([^}]*)\}|([A-Za-z_]\w*)\s*[,)])/g;
function fontsDelClient(dir = path.join(ARREL, 'src/data')) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const cami = path.join(dir, e.name);
    if (e.isDirectory()) return fontsDelClient(cami);
    if (!/\.jsx?$/.test(e.name) || /\.test\.jsx?$/.test(e.name) || e.name === 'wikiManifest.js') return [];
    const text = readFileSync(cami, 'utf8');
    return /xat_push_desa|xat_push_retira|xat_silencia|xat_desa_dispositiu_push|xat_retira_dispositiu_push/.test(text) ? [{ fitxer: path.relative(ARREL, cami), text }] : [];
  });
}
function comprovaCridesDelClient(sql, fonts = fontsDelClient()) {
  for (const { fitxer, text } of fonts) {
    expect(text, fitxer).not.toMatch(/xat_desa_dispositiu_push|xat_retira_dispositiu_push|xat_silencia_durada|\bp_fins\b/);
    for (const m of text.matchAll(RPC_CLIENT)) {
      const cos = m[2] ?? text.match(new RegExp(`const ${m[3]} = \\{([^}]*)\\}`))?.[1];
      expect(cos, `${fitxer}: el cos de rpc('${m[1]}')`).toBeDefined();
      const claus = [...cos.matchAll(/\b(p_\w+):/g)].map((c) => c[1]);
      const params = funcio(sql, 'public', m[1]).params.split(',').map((p) => pla(p));
      for (const c of claus) expect(nomsDe(params.join(',')), `${fitxer}: ${m[1]}.${c}`).toContain(c);
      for (const p of params.filter((p) => !/\bdefault\b/.test(p))) expect(claus, `${fitxer}: ${m[1]} sense ${p}`).toContain(p.split(' ')[0]);
    }
  }
}

/* La vinyeta, la fila, la secció i la porta (B8S-12). */
function comprovaDocumentacio(readme, ordre) {
  const vinyeta = readme.split('\n- `seed.sql`')[0].split(`\n- \`migrations/${NOM}\`\n`)[1]?.split('\n\n')[0] ?? '';
  expect(vinyeta, 'la vinyeta').not.toBe('');
  const vinyetaPla = pla(vinyeta);
  /* Gauntlet R9 · FB · L'estat cert (acta 261102_1456 i lectura REST de producció del 6-11-2026: la
     taula existix). La capçalera del SQL no es toca: la migració ja aplicada no canvia. */
  expect(vinyetaPla).toContain('**aplicada a producció** (acta 261102_1456; lectura REST del 6-11-2026: la taula `public.xat_dispositius_push` existix)');
  expect(vinyetaPla).not.toMatch(/NO aplicada/);
  expect(vinyetaPla).toContain('Idempotent i en una sola transacció');
  expect(vinyetaPla).toContain('`src/data/supabase/xatAvisosPush.migracio.test.js`');
  expect(vinyetaPla).toContain('porta `funcio-notifica-xat`');
  /* La «Verificació posterior» de la vinyeta és la mateixa consulta que la capçalera de la migració. */
  const consulta = SQL.match(/^-- {3}(select to_regclass\('public\.xat_dispositius_push'\).*;)$/m);
  expect(consulta).not.toBeNull();
  expect(vinyetaPla).toContain(`Verificació posterior (lectura): \`${consulta[1]}\``);
  const files = readme.split('\n').filter((l) => l.includes(`\`${NOM}\``) && l.startsWith('| '));
  expect(files).toHaveLength(1);
  expect(files[0]).toMatch(new RegExp(`^\\| \\d+ \\| \`${VERSIO}\` \\| \`${NOM}\` \\| Aplicada a producció \\(acta 261102_1456; lectura REST del 6-11: la taula existix\\) \\| [^|]+ \\|$`));
  const inici = readme.indexOf('\n## Funció `notifica-xat` (avisos push del Xat)\n');
  expect(inici, 'la secció de la funció').toBeGreaterThan(0);
  expect(inici).toBeLessThan(readme.indexOf('\n## Funció `noticies` (lector territorial)\n'));
  const seccio = readme.slice(inici + 1, readme.indexOf('\n## ', inici + 1));
  for (const text of ['SDP_PUSH_VAPID_PUBLICA', 'SDP_PUSH_VAPID_PRIVADA', 'SDP_PUSH_VAPID_SUBJECTE', 'VITE_PUSH_VAPID_PUBLICA', 'SDP_PUSH_ACTIU=si', 'x-sdp-cron',
    `migrations/${NOM}`, 'supabase functions deploy notifica-xat --no-verify-jwt --project-ref <ref>', "insert into private.ajustos (clau, valor) values ('push_xat_actiu', 'si')",
    'delete from private.xat_push_cua;', 'push_xat_generals']) {
    expect(seccio, text).toContain(text);
  }
  expect(seccio).not.toMatch(/SDP_VAPID_|npx web-push/);
  const porta = ordre.portes.find((p) => p.id === 'funcio-notifica-xat');
  expect(porta, 'la porta funcio-notifica-xat').toBeDefined();
  expect(porta.tipus).toBe('funcio');
  expect(porta.despres).toEqual([VERSIO, '2611080431']);
  expect(porta.abans).toEqual([]);
  expect(porta.font).toBe('README «Funció notifica-xat»');
  expect(porta.descripcio).toMatch(/push_xat_actiu = si/);
  expect((ordre.fantasmes ?? []).map((f) => f.versio)).not.toContain(VERSIO);
}

/* ── Les proves ── */

test('el nom: <AAMMDDHHMM>_xat_avisos_push.sql, únic, posterior a les que hi havia i sense col·lisió de prefix', () => {
  expect(NOMS).toHaveLength(1);
  expect(VERSIO).toMatch(/^\d{10}$/);
  expect(ORDRE).toContain('2611012257_politica_privacitat_2_3.sql');
  for (const anterior of ['2611012257_politica_privacitat_2_3.sql', '2611020106_ap_inbox_persistencia_i_cua.sql'].filter((f) => ORDRE.includes(f))) {
    expect(ORDRE.indexOf(NOM)).toBeGreaterThan(ORDRE.indexOf(anterior));
  }
  expect(ORDRE.filter((f) => f.startsWith(VERSIO))).toEqual([NOM]);
});

describe('la migració per dins', () => {
  test('capçalera: PER QUÈ, QUÈ FA, QUÈ NO FA, CODIS (els mateixos que es llancen), Depén de, ORDRE, verificació i NO aplicada en UNA línia', () => comprovaCapcalera(SQL));
  test('una sola transacció amb lock_timeout i statement_timeout', () => comprovaTransaccio(SQL));
  test('la taula: forma per tipus, únic per (tipus, adreca), FK en cascada, índex i cap repetició de més de 255 (R1)', () => comprovaTaula(SQL));
  test('RLS de propietari, revoke a quatre rols i un sol grant per columnes sense l’adreça; les taules privades, amb RLS i sense cap grant ni política (ARB-P01-03)', () => comprovaRls(SQL));
  test('cada funció: definer (tret de la validadora, immutable), search_path buit i cap jsonb d’entrada ni SQL dinàmic', () => comprovaFuncions(SQL));
  test('les signatures exactes del contracte únic (§2.9 i §2.5), sense els noms vells', () => comprovaSignatures(SQL));
  test('permisos: el client a authenticated amb la sessió com a primera comprovació, el worker a service_role amb la guarda com a primera sentència, i res a anon', () => comprovaPermisos(SQL));
  test('el disparador poda sempre, fora de l’ajust, i cap error de la cua no atura un missatge (ARB-B8S-03)', () => comprovaDisparador(SQL));
  test('desar: l’ajust abans de cap escriptura, plataformes exactes, minúscula només a APNs, canvi d’amo només amb gest i sostre de deu (ARB-B8S-04)', () => comprovaDesa(SQL));
  test('el silenci: només la fila de qui crida, quatre durades tancades, rellotge del servidor i «sempre» = 9999-12-31 00:00 UTC (ARB-B8S-05, ARB-P01-01)', () => comprovaSilenci(SQL));
  test('el reclam: lot amb SKIP LOCKED, filtres dels destinataris (bloquejos, avisos, esborrats, distinct), Avisos i General apagats, retall aleatori i pressupost d’octets (ARB-B8S-06, 07, ARB-P01-02, 04)', () => comprovaReclam(SQL));
  test('les RPC del worker: expulsa d’1 a 1.000, neteja de 1.000 en 1.000, credencial amb cinc minuts de marge i una de nova fins a 65 minuts sense substituir-ne una de més llarga (ARB-P01-04)', () => comprovaWorker(SQL));
  test('cap pg_net, Vault, cron ni secret', () => comprovaSenseXarxa(SQL));
});

describe('el comportament de la llista blanca i el contracte amb el worker', () => {
  test('servidor ⊆ client, els quatre serveis reals passen, els enganys no, i cada adreça admesa passa el CHECK de la taula', () => comprovaParitat(SQL));
  test('cada rpc() de notifica-xat casa amb una funció de la migració pels noms dels paràmetres (R13)', () => comprovaCridesDelWorker(SQL));
  test('el reclam cap sencer en el cos que el worker llig (MAXIM_COS_BASE) i el sostre és MAXIM_DISPOSITIUS (ARB-P01-02)', () => comprovaPressupost(SQL));
  test('cada rpc() del client (B8C-2: desar, retirar i silenciar) casa amb §2.9 pels noms dels paràmetres (R13)', () => comprovaCridesDelClient(SQL));
});

test('supabase/README.md i ordre_desplegament.json: vinyeta, fila, secció de la funció i porta', () => comprovaDocumentacio(README, ORDRE_DESPLEGAMENT));

describe('mutacions: cada comprovació mossega', () => {
  const muta = (vell, nou) => {
    expect(SQL.split(vell).length, `àncora de la mutació: ${vell.slice(0, 50)}`).toBeGreaterThan(1);
    return SQL.replace(vell, nou);
  };
  test.each([
    ['una repetició de més de 255 a Postgres', comprovaTaula, "adreca ~ '^[0-9a-f]{64,200}$')", "adreca ~ '^[0-9a-f]{64,300}$')"],
    ['el canvi d’amo sense gest', comprovaDesa, 'where d.usuari_id = excluded.usuari_id or v_gest;', 'where true;'],
    ['la plataforma amb lower()', comprovaDesa, "v_tipus := case p_plataforma when", "v_tipus := case lower(p_plataforma) when"],
    ['el retall determinista', comprovaReclam, 'random() as atzar', '0 as atzar'],
    ['el reclam sense pressupost d’octets', comprovaReclam, '     where f.octets <= 1800000\n', ''],
    ['un pressupost que no compta les cometes escapades', comprovaReclam, 'sum(octet_length(m.fila::text) + 2)', "sum(octet_length(m.fila->>'adreca') + 2)"],
    ['un pressupost que el worker no pot llegir sencer', comprovaPressupost, 'where f.octets <= 1800000', 'where f.octets <= 2100000'],
    ['un pressupost on no cap un lot típic de 5.000', comprovaPressupost, 'where f.octets <= 1800000', 'where f.octets <= 1000000'],
    ['un sostre d’aparells que no és el del worker', comprovaPressupost, 'order by atzar\n     limit 5000', 'order by atzar\n     limit 8000'],
    ['el reclam sense el filtre de bloquejos', comprovaReclam, '       and not exists (select 1 from public.bloquejos b', '       and true or not exists (select 1 from public.bloquejos b'],
    ['els avisos a «cap» que també avisen', comprovaReclam, "       and (p.avisos = 'tots'", "       and (p.avisos in ('tots', 'cap')"],
    ['els missatges esborrats que encara avisen', comprovaReclam, 'where m.id = l.missatge_id and m.esborrat_al is null)', 'where m.id = l.missatge_id)'],
    ['els destacats sense mirar de qui és el missatge respost', comprovaReclam, 'where r.id = v.resposta_a and r.usuari_id = p.usuari_id)))', 'where r.id = v.resposta_a)))'],
    ['un aparell amb un avís per missatge (sense distinct)', comprovaReclam, '    select distinct p.usuari_id', '    select p.usuari_id'],
    ['el silenci que toca tot el fil', comprovaSilenci, '   where p.fil_id = p_fil_id\n     and p.usuari_id = v_jo\n', '   where p.fil_id = p_fil_id\n'],
    ['la cua sense RLS', comprovaRls, 'alter table private.xat_push_cua enable row level security;\n', ''],
    ['les credencials sense RLS', comprovaRls, 'alter table private.xat_push_credencials enable row level security;\n', ''],
    ['desar sense la guarda de sessió', comprovaPermisos, "  if v_jo is null then\n    raise exception 'SDP-PUSH-001: cal la sessió iniciada.' using errcode = '42501';\n  end if;\n  if coalesce(", '  if coalesce('],
    ['una credencial que en substituïx una de més llarga', comprovaWorker, '    where c.caduca_al < excluded.caduca_al;', '    where true;'],
    ['una credencial de més de 65 minuts', comprovaWorker, " or p_caduca_al > now() + interval '65 minutes'", ''],
    ['expulsar sense el límit de 1.000 ids', comprovaWorker, 'if p_ids is null or cardinality(p_ids) not between 1 and 1000 then', 'if p_ids is null then'],
    ['la neteja sense el límit de 1.000', comprovaWorker, '                   limit 1000);', '                   );'],
    ['la credencial sense el marge de cinc minuts', comprovaWorker, "c.caduca_al > now() + interval '5 minutes'", 'c.caduca_al > now()'],
    ['els Avisos de pàgina encesos per defecte', comprovaReclam, "f.tipus in ('canal', 'grup')", "f.tipus = 'grup' or f.tipus in ('canal', 'grup')"],
    ['l’ajust fora de rang que atura el worker', comprovaReclam, 'exception when invalid_text_representation or numeric_value_out_of_range then', 'exception when invalid_text_representation then'],
    ['la sentinella 23:59:59', comprovaSilenci, "timestamptz '9999-12-31 00:00:00+00'", "timestamptz '9999-12-31 23:59:59+00'"],
    ['un grant de taula sencer', comprovaRls, 'drop policy if exists', 'grant select on table public.xat_dispositius_push to authenticated;\ndrop policy if exists'],
    ['l’adreça llegible per authenticated', comprovaRls, 'grant select (id, usuari_id, tipus,', 'grant select (id, usuari_id, adreca, tipus,'],
    ['el reclam obert a authenticated', comprovaPermisos, 'notify pgrst', 'grant execute on function public.xat_push_reclama(integer) to authenticated;\nnotify pgrst'],
    ['la guarda del worker llevada', comprovaPermisos, "begin\n  if coalesce((select auth.role()), '') <> 'service_role' then\n    raise exception 'SDP-PUSH-000: només el servidor.' using errcode = '42501';\n  end if;\n  if p_ids", 'begin\n  if p_ids'],
    ['la poda dins de l’if de l’ajust', comprovaDisparador, 'for update skip locked);\n  if coalesce', 'for update);\n  if coalesce'],
    ['un error de la cua que atura el missatge', comprovaDisparador, "raise warning 'SDP-PUSH-900", "raise exception 'SDP-PUSH-900"],
    ['una signatura del contracte canviada', comprovaSignatures, 'p_durada text)\nreturns timestamptz', 'p_fins timestamptz)\nreturns timestamptz'],
    ['un paràmetre jsonb d’entrada', comprovaFuncions, 'create or replace function public.xat_push_expulsa(p_ids uuid[])', 'create or replace function public.xat_push_expulsa(p_ids jsonb)'],
    ['un secret dins de la migració', comprovaSenseXarxa, 'notify pgrst', "select net.http_post('https://x', '{}');\nnotify pgrst"],
    ['un codi llançat que CODIS no diu', comprovaCapcalera, "'SDP-PUSH-005: paràmetre del worker invàlid.' using errcode = '22023';\n  end if;\n  delete from public.xat_dispositius_push d where d.id", "'SDP-PUSH-099: paràmetre del worker invàlid.' using errcode = '22023';\n  end if;\n  delete from public.xat_dispositius_push d where d.id"],
    ['un amfitrió que el client no coneix', comprovaParitat, "'notify.windows.com')", "'notify.windows.com', 'evil.example.com')"],
    ['un sufix que el worker no té', comprovaParitat, "or v_host like '%.notify.windows.com';", "or v_host like '%.notify.windows.com' or v_host like '%.example.org';"],
    ['un CHECK de taula més estret que la RPC', comprovaParitat, "(tipus = 'fcm' and char_length(adreca) between 32 and 1024", "(tipus = 'fcm' and char_length(adreca) between 32 and 512"]
  ])('%s', (_nom, comprova, vell, nou) => {
    expect(() => comprova(SQL)).not.toThrow();
    /* L'àncora es busca fora del toThrow: una àncora perduda ha de fer caure la prova, no passar-la. */
    const mutat = muta(vell, nou);
    expect(mutat).not.toBe(SQL);
    expect(() => comprova(mutat)).toThrow();
  });

  test('el worker que crida un paràmetre que la migració no té, o se’n deixa un d’obligatori', () => {
    expect(() => comprovaCridesDelWorker(SQL)).not.toThrow();
    /* ARB-P01-05: l'àncora no depén del nom de la variable local de gestor.js. */
    const expulsa = /rpc\('xat_push_confirma_v2',\s*\{\s*p_resultats:/;
    expect(WORKER).toMatch(expulsa);
    expect(() => comprovaCridesDelWorker(SQL, WORKER.replace(expulsa, "rpc('xat_push_confirma_v2', { p_resultat:"))).toThrow();
    const altered=SQL_LEASE.replace('xat_push_reclama_v2(p_limit integer default 50)','xat_push_reclama_v2(p_lot integer default 50)');
    expect(altered).not.toBe(SQL_LEASE);
    expect(() => comprovaCridesDelWorker(SQL,WORKER,true,altered)).toThrow();
    const netejaObligatoria = SQL_LEASE.replace('function public.xat_push_neteja()', 'function public.xat_push_neteja(p_obligatori integer)');
    expect(netejaObligatoria).not.toBe(SQL_LEASE);
    expect(() => comprovaCridesDelWorker(SQL,WORKER,true,netejaObligatoria)).toThrow();
  });

  test('la variant sense natius.js (S2 sense S3, §2.6): gestor.js sol és conforme, i sense natius no es poden exigir les credencials', () => {
    expect(() => comprovaCridesDelWorker(SQL, GESTOR, false)).not.toThrow();
    expect(() => comprovaCridesDelWorker(SQL, GESTOR, true)).toThrow();
    const sensCredencials = GESTOR.replace(/export const RPC_DEL_WORKER = Object\.freeze\(\[[^\]]*\]\)/, "export const RPC_DEL_WORKER = Object.freeze(['xat_push_neteja', 'xat_push_reclama_v2', 'xat_push_confirma_v2'])");
    expect(sensCredencials).not.toBe(GESTOR);
    expect(() => comprovaCridesDelWorker(SQL, sensCredencials, false)).not.toThrow();
    expect(() => comprovaCridesDelWorker(SQL, sensCredencials, true)).toThrow();
  });

  test('un worker que llig menys del que el reclam pot tornar, o amb un altre sostre d’aparells (ARB-P01-02)', () => {
    expect(() => comprovaPressupost(SQL)).not.toThrow();
    const cosBase = /MAXIM_COS_BASE: [\d\s*]+,/;
    expect(GESTOR).toMatch(cosBase);
    expect(() => comprovaPressupost(SQL, GESTOR.replace(cosBase, 'MAXIM_COS_BASE: 1024 * 1024,'))).toThrow();
    expect(GESTOR).toMatch(/MAXIM_DISPOSITIUS: \d+\b/);
    expect(() => comprovaPressupost(SQL, GESTOR.replace(/MAXIM_DISPOSITIUS: \d+\b/, 'MAXIM_DISPOSITIUS: 4000'))).toThrow();
  });

  test('el client que crida amb el contracte vell, amb una clau de més o sense un paràmetre obligatori', () => {
    const client = (text) => [{ fitxer: 'src/data/supabase/fals.js', text }];
    expect(() => comprovaCridesDelClient(SQL, client("await rpc('xat_push_desa', { p_plataforma: 'web', p_adreca: a, p_gest: true }, config);"))).not.toThrow();
    expect(() => comprovaCridesDelClient(SQL, client("const cos = { p_plataforma: p, p_adreca: a };\nawait rpc('xat_push_desa', cos, config);"))).not.toThrow();
    expect(() => comprovaCridesDelClient(SQL, client("supabase.rpc('xat_silencia', { p_fil_id: f, p_fins: x })"))).toThrow();
    expect(() => comprovaCridesDelClient(SQL, client("supabase.rpc('xat_silencia', { p_fil_id: f, p_hores: 8 })"))).toThrow();
    expect(() => comprovaCridesDelClient(SQL, client("await rpc('xat_push_retira', { p_plataforma: p }, config);"))).toThrow();
    expect(() => comprovaCridesDelClient(SQL, client("const cos = { p_tipus: 'apns', p_adreca: a };\nawait rpc('xat_push_desa', cos, config);"))).toThrow();
    expect(() => comprovaCridesDelClient(SQL, client("await rpc('xat_desa_dispositiu_push', {}, config);"))).toThrow();
  });

  test('un client més estricte que el servidor fa caure la paritat', () => {
    const nomesGoogle = [/^fcm\.googleapis\.com$/];
    expect(() => comprovaParitat(SQL, nomesGoogle)).toThrow();
    expect(() => comprovaParitat(SQL, SERVEIS_DE_PUSH, () => null)).toThrow();
  });

  test('la documentació sense porta, amb la porta d’una altra versió o sense la vinyeta', () => {
    expect(() => comprovaDocumentacio(README, ORDRE_DESPLEGAMENT)).not.toThrow();
    const sensePorta = { ...ORDRE_DESPLEGAMENT, portes: ORDRE_DESPLEGAMENT.portes.filter((p) => p.id !== 'funcio-notifica-xat') };
    expect(() => comprovaDocumentacio(README, sensePorta)).toThrow();
    const senseLeaseV2 = { ...ORDRE_DESPLEGAMENT, portes: ORDRE_DESPLEGAMENT.portes.map((p) => (p.id === 'funcio-notifica-xat' ? { ...p, despres: [VERSIO] } : p)) };
    expect(() => comprovaDocumentacio(README, senseLeaseV2)).toThrow();
    const altraVersio = { ...ORDRE_DESPLEGAMENT, portes: ORDRE_DESPLEGAMENT.portes.map((p) => (p.id === 'funcio-notifica-xat' ? { ...p, despres: ['2611012257'] } : p)) };
    expect(() => comprovaDocumentacio(README, altraVersio)).toThrow();
    expect(() => comprovaDocumentacio(README.replace(`\n- \`migrations/${NOM}\`\n`, '\n'), ORDRE_DESPLEGAMENT)).toThrow();
    expect(() => comprovaDocumentacio(README.replace('SDP_PUSH_VAPID_SUBJECTE', 'SDP_VAPID_SUBJECTE'), ORDRE_DESPLEGAMENT)).toThrow();
    /* Gauntlet R9 · FB · Tornar a dir «NO aplicada» a la fila o a la vinyeta cau. */
    const fila = README.split('\n').find((l) => l.startsWith('| ') && l.includes(`\`${NOM}\``));
    expect(() => comprovaDocumentacio(README.replace(fila, fila.replace(/\| Aplicada a producció[^|]+\|/, "| **NO aplicada: l'aplica el Mestre** |")), ORDRE_DESPLEGAMENT)).toThrow();
    expect(() => comprovaDocumentacio(README.replace('**aplicada a producció** (acta 261102_1456', "**NO aplicada: l'aplica el Mestre, mai un agent** (acta 261102_1456"), ORDRE_DESPLEGAMENT)).toThrow();
  });
});
