// @vitest-environment node
/* P1-68 (pla 261028_1526, §3.8.2.3; decisions del Mestre, 261028) · Prova
   estàtica de la migració 2610282100_usuari_i_poble_canonic.sql. Cap base de
   dades: es llig el SQL (patró de membresConcurrents.migracio.test.js) i es
   comproven la capçalera (QUÈ CORREGIX, QUÈ FA, QUÈ NO FA, CODIS, Depén de,
   les consultes d'abans i de després, la recepta de les dues sessions i una
   sola línia «NO aplicada»), la transacció, el que no pot fer (polítiques,
   permisos de taula, anon, les funcions de l'alta i de la baixa, la
   pertinença al poble, UUID literals), l'ordre (backfill dins de la finestra
   sense trg_profiles_touch i abans del disparador; NOT NULL després), l'alta
   que no cau (SDP-REG-903), els codis tancats, perfil_public = 2610021520 +
   `usuari` a la fitxa sencera, la paritat literal de la regla amb el client
   (onboardingModel.js) i dels pobles amb nomsDelPoble.js, i l'entrada de
   supabase/README.md. Les sondes del final proven que els detectors veuen
   una variant dolenta. L'execució de veres la va fer la línia a PGlite
   (fora del repositori); la de dues sessions és del Mestre.
   Fixer (revisions de seguretat i de paritat, 261028): 'baixa' reservat, la
   base sense sufix possible a 'veina' i 100 candidats com a molt (el bucle
   que omplia la taula de panys); amb sessió, l'identificador només per la
   RPC (marca local; SDP-USER-006) i cap retingut (SDP-USER-007); el poble
   només es deriva a l'alta i quan canvia town_name, i el backfill només
   omple els buits; guardes de lectura (polítiques, vistes); les còpies de
   les identitats de la plataforma; cap identitat fundacional en el SQL
   (private.ajustos 'usuaris_reservats'); i els cossos de la regla fixats.
   Correccions H (revisió final, S-01 i S-02): el camí 'Veí/na' només des de
   l'identificador de reserva (una sola volta, cap oracle sense ritme) i
   «profiles read own» només amb una de les tres qual de fila pròpia del
   repositori i per a authenticated (la de 2609110600 avorta).
   QA-H02 (certificació de Codex sobre e36606db2): towns.slug és únic, name
   no. poble_derivat resol cada poble triat a UNA sola fila (la que la fila
   ja porta, el poble per defecte, el nom escrit igual, obert, el més antic i
   el slug) i en trau town_uuid, primary_town, provinces i comarcas; el
   town_uuid que ja hi ha (backfill: f.town_uuid; disparador: old.town_uuid)
   només desempata els homònims, mai no canvia ni l'ordre ni els pobles
   triats, i el cos sencer està fixat. El catàleg dona a un homònim la regió
   de l'entrada amb el seu slug (mai la que du el slug d'una altra fila) i,
   pel títol, només a la fila que eixe títol tria (el mateix ordre que
   poble_derivat); a un nom únic, la del títol, com abans. Revisió
   adversarial: el backfill no escriu cap camp de poble en una fila amb el
   town_uuid d'un altre poble que el primer (mai camps de dues files; ix a
   DESPRÉS). Verificat a PGlite 0.3.16 (fora del repositori): amb homònims
   de regions diferents, els camps ixen de la mateixa fila (backfill, alta,
   canvi de town_name i crida directa) i un canvi de town_name conserva
   l'homònim; amb noms únics, idèntic a e36606db2 (disparador, catàleg, 401
   crides i backfill, llevat de les files d'una forma antiga amb el town_uuid
   d'un altre poble, que ara no es toquen); la segona execució no canvia
   res. */
import { randomUUID } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import {
  ACCENTS_USERNAME, ARRELS_RESERVADES_USERNAME, LLIGADURES_USERNAME, MAXIM_BASE_USERNAME, MAXIM_CANDIDATS_USERNAME, MAXIM_USERNAME,
  MINIM_USERNAME, MISSATGES_USERNAME, PARTICULES_USERNAME, PREFIXOS_RESERVATS_USERNAME, PREFIX_USERNAME_DE_BAIXA, USERNAMES_FUNDACIONALS,
  USERNAMES_RESERVATS, USERNAME_DE_RESERVA, baseDeUsername
} from '../../sections/onboarding/onboardingModel.js';
import { PERSONA_PILOT, POBLE_FUNDACIONAL } from '../identitatsSeed.js';

/* [nom, base] sintètics · Verificats a PGlite 0.3.16 contra private.usuari_base
   d'esta migració (la mateixa taula que onboardingModel.username.test.js). */
const NOMS_I_BASES = Object.freeze([
  ['Joan Peris Gómez', 'joanperis'], ['Núria Col·lell i Ferrer', 'nuriacollell'], ['Maria de la Cruz Soler', 'mariacruz'],
  ["Pere d'Alcoi", 'perealcoi'], ['ÀNGELS  Ŀlorca', 'angelsllorca'], ['Veí/na', 'veina'], ['Ana-María López', 'anamaria'],
  ['Œdipe Ærø', 'oedipeaero'], ['李雷', ''], ['Josep  Maria  Vidal', 'josepmaria'], ['Jordi Pujolàs Carbó Martínez', 'jordipujolas'],
  ['Ignasi Col.lell', 'ignasicollell'], ['X', 'x'], ['Ramón Y Cajal', 'ramoncajal'], ['Anna Pérez Soler', 'annaperez'],
  ['Straße Groß', 'strassegross'], ['İlker Kaya', 'lkerkaya']
]);

/* vitest s'executa des de l'arrel del repositori (com qualitat.test.js). */
const ARREL = process.cwd();
const MIGRACIONS = path.join(ARREL, 'supabase/migrations');
const NOM = '2610282100_usuari_i_poble_canonic.sql';
const PERFIL_PUBLIC = '2610021520_perfil_public.sql';
const llig = (nom) => readFileSync(path.join(MIGRACIONS, nom), 'utf8');
const SQL = llig(NOM);
const LINIES = SQL.split('\n');
const CAPCALERA = SQL.slice(0, SQL.search(/^begin;/m));
const sensComentaris = (sql) => sql.split('\n').map((linia) => linia.replace(/--.*$/, '')).join('\n');
const CODI = sensComentaris(SQL);
const normal = (text) => text.replace(/\s+/g, ' ').trim().toLowerCase();
const README = readFileSync(path.join(ARREL, 'supabase/README.md'), 'utf8');
const MODEL = readFileSync(path.join(ARREL, 'src/sections/onboarding/onboardingModel.js'), 'utf8');
const POBLES = readFileSync(path.join(ARREL, 'src/sections/pobles/nomsDelPoble.js'), 'utf8');

/** Cada funció: esquema, nom, paràmetres, capçalera (fins a «as $$») i cos (sense normalitzar). */
function funcions(codi) {
  const re = /create\s+(?:or\s+replace\s+)?function\s+(\w+)\.(\w+)\s*\(([^)]*)\)([\s\S]*?)\bas\s+\$(\w*)\$/gi;
  const eixida = [];
  let m;
  while ((m = re.exec(codi))) {
    const tanca = `$${m[5]}$`;
    const inici = re.lastIndex;
    const fi = codi.indexOf(tanca, inici);
    expect(fi, `cos sense tancar a ${m[1]}.${m[2]}`).toBeGreaterThan(inici);
    eixida.push({ esquema: m[1].toLowerCase(), nom: m[2].toLowerCase(), params: normal(m[3]), capcalera: normal(m[4]), cos: codi.slice(inici, fi), inici: m.index });
    re.lastIndex = fi + tanca.length;
  }
  return eixida;
}
const FUNCIONS = funcions(CODI);
const funcio = (codi, esquema, nom) => funcions(codi).find((f) => f.esquema === esquema && f.nom === nom) ?? null;
const PLEGA = funcio(CODI, 'private', 'usuari_plega');
const BASE = funcio(CODI, 'private', 'usuari_base');
const RESERVAT = funcio(CODI, 'private', 'usuari_reservat');
const LLIURE = funcio(CODI, 'private', 'usuari_lliure');
const DISPARADOR = funcio(CODI, 'private', 'profiles_usuari_i_poble');
const RPC = funcio(CODI, 'public', 'desa_el_meu_usuari');
const DERIVAT = funcio(CODI, 'private', 'poble_derivat');

/* Els literals de la regla, tal com els escriu el SQL. */
const literals = (text) => [...text.matchAll(/'((?:[^']|'')*)'/g)].map((m) => m[1].replace(/''/g, "'"));
function plegatDelSql(cos) {
  const translates = [...cos.matchAll(/'([^']+)',\s*'([^']+)'\);?\s*$/gm)];
  const accents = /'(àáâ[^']*)',\s*'(a+e+[^']*)'/.exec(cos);
  const lligadures = [...cos.matchAll(/'(.)',\s*'([a-z]{1,2})'\)/g)].map((m) => [m[1], m[2]]);
  return { translates, accents: accents ? { de: accents[1], a: accents[2] } : null, lligadures };
}
const arrayDe = (cos) => {
  const m = /array\s*\[([\s\S]*?)\]/i.exec(cos);
  return m ? literals(m[1]) : null;
};

/* Els detectors de les sondes. */
const grantsDeTaula = (codi) => codi.split(';').map(normal).filter((s) => /^grant\b/.test(s) && !/^grant execute on function\b/.test(s));
const tocaPoliticaOAnon = (codi) => /\b(create|alter|drop)\s+policy\b/i.test(codi) || /using\s*\(\s*true\s*\)/i.test(codi)
  || /\bgrant\b[^;]*\bto\b[^;]*\banon\b/i.test(codi);
const redefinixAltaOBaixa = (codi) => /function\s+public\.(handle_new_user|completa_la_meua_alta|create_organization|demana_baixa|cancela_baixa)\b/i.test(codi)
  || /function\s+(public|private)\.purga_\w+/i.test(codi);
const escriuPertinences = (codi) => /\b(insert\s+into|update|delete\s+from)\s+public\.town_memberships\b/i.test(codi);
/** El backfill de l'identificador va entre disable i enable de trg_profiles_touch, abans del disparador i del NOT NULL. */
function ordreBo(codi) {
  const desactiva = codi.search(/alter table public\.profiles disable trigger trg_profiles_touch;/i);
  const backfill = codi.search(/update public\.profiles p\s+set username = private\.usuari_lliure\(private\.usuari_base\(r\.full_name\), r\.id\)/i);
  const activa = codi.search(/alter table public\.profiles enable trigger trg_profiles_touch;/i);
  const notNull = codi.search(/alter table public\.profiles alter column username set not null;/i);
  const disparador = codi.search(/create trigger trg_profiles_usuari_i_poble\b/i);
  return desactiva > 0 && desactiva < backfill && backfill < activa && activa < notNull && notNull < disparador;
}
/** Fixer · usuari_lliure acaba sempre: la base sense sufix possible passa a 'veina' i, després de 100, 'veina-' a l'atzar. */
const lliureFitat = (cos) => normal(cos).includes(normal(`if private.usuari_reservat(rtrim(left(v_base, ${MAXIM_USERNAME} - char_length('-2')), '-') || '-2') then
    v_base := '${USERNAME_DE_RESERVA}'; end if; v_candidat := v_base; loop`))
  && normal(cos).includes(normal(`v_n := v_n + 1; if v_n > ${MAXIM_CANDIDATS_USERNAME} then
    v_candidat := '${USERNAME_DE_RESERVA}-' || left(replace(gen_random_uuid()::text, '-', ''), 8);
    perform pg_advisory_xact_lock(hashtextextended('sdp-usuari:' || v_candidat, 0)); exit; end if;`));
/** Fixer · Amb sessió, l'identificador només el canvia desa_el_meu_usuari (la marca local), i cap retingut. */
function nomesPerLaRpc(disparador, rpc) {
  const d = normal(disparador);
  const marca = d.indexOf(normal("v_rpc boolean := coalesce(current_setting('sdp.desa_el_meu_usuari', true), '') = 'on';"));
  const sessio = d.indexOf(normal('v_sessio boolean := (select auth.uid()) is not null;'));
  const fora = d.indexOf(normal("if v_sessio and not v_rpc then raise exception 'SDP-USER-006:"));
  const reservat = d.indexOf(normal("if v_sessio and private.usuari_reservat(new.username) then raise exception 'SDP-USER-002:"));
  const pany = d.indexOf(normal("perform pg_advisory_xact_lock(hashtextextended('sdp-usuari:' || new.username, 0));"));
  const retingut = d.indexOf(normal(`if exists (select 1 from private.usuaris_retinguts r where lower(r.username) = new.username and r.user_id <> new.id) then
    raise exception 'SDP-USER-007:`));
  const confirmat = d.indexOf(normal('new.username_confirmat_at := now();'));
  return marca > 0 && sessio > 0 && fora > 0 && fora < reservat && reservat < pany && pany < retingut && retingut < confirmat
    && d.includes(normal("if tg_op = 'UPDATE' and v_sessio and not v_rpc then new.username_confirmat_at := old.username_confirmat_at; end if;"))
    && normal(rpc).includes(normal(`begin perform pg_catalog.set_config('sdp.desa_el_meu_usuari', 'on', true);
      update public.profiles p set username = v_usuari, username_confirmat_at = now() where p.id = v_jo;
      perform pg_catalog.set_config('sdp.desa_el_meu_usuari', '', true); exception when unique_violation then`));
}
/** Fixer · El poble només es deriva a l'alta i quan canvia town_name; amb sessió, si no, els cinc derivats es queden. */
const pobleNomesAmbTria = (cos) => normal(cos).includes(normal(`if tg_op = 'INSERT' or new.town_name is distinct from old.town_name then begin
    select d.town_name, d.town_uuid, d.primary_town, d.secondary_towns, d.provinces, d.comarcas
      into new.town_name, new.town_uuid, new.primary_town, new.secondary_towns, new.provinces, new.comarcas
      from private.poble_derivat(new.town_name, case when tg_op = 'UPDATE' then old.town_uuid end) as d;`))
  && normal(cos).includes(normal(`elsif v_sessio then new.town_uuid := old.town_uuid; new.primary_town := old.primary_town;
    new.secondary_towns := old.secondary_towns; new.provinces := old.provinces; new.comarcas := old.comarcas; end if; return new;`));
/** Fixer · El backfill del poble només omple els camps NULL o '[]', dins de la primera finestra i abans del disparador. */
function backfillNomesBuits(codi) {
  const omple = codi.search(/set town_name = coalesce\(nullif\(btrim\(p\.town_name\), ''\), d\.town_name\),/);
  const finestra = codi.slice(0, codi.search(/alter table public\.profiles enable trigger trg_profiles_touch;/));
  return omple > 0 && finestra.length > omple && omple < codi.search(/create trigger trg_profiles_usuari_i_poble\b/)
    && /alter table public\.profiles disable trigger trg_profiles_usuari_i_poble;/.test(finestra)
    && normal(codi).includes(normal(`town_uuid = coalesce(p.town_uuid, d.town_uuid), primary_town = coalesce(p.primary_town, d.primary_town),
      secondary_towns = case when coalesce(p.secondary_towns, '[]'::jsonb) = '[]'::jsonb then d.secondary_towns else p.secondary_towns end,
      provinces = case when coalesce(p.provinces, '[]'::jsonb) = '[]'::jsonb then d.provinces else p.provinces end,
      comarcas = case when coalesce(p.comarcas, '[]'::jsonb) = '[]'::jsonb then d.comarcas else p.comarcas end`))
    && (codi.match(/set town_name = p\.town_name/g) || []).length === 0;
}
/** Fixer · Les guardes de lectura: cap altra política permissiva de lectura, cap política ni vista sobre les columnes noves. */
function guardesDeLectura(codi) {
  const g = normal(codi.slice(0, codi.search(/alter table public\.profiles add column/)));
  return g.includes(normal(`and pp.cmd in ('SELECT', 'ALL') and pp.permissive = 'PERMISSIVE' and pp.policyname <> 'profiles read own') then
      raise exception 'SDP-USER-022:`))
    && g.includes(normal("~ '\\m(username|username_confirmat_at|town_uuid|primary_town|secondary_towns|provinces|comarcas)\\m') then raise exception 'SDP-USER-022:"))
    && g.includes(normal(`join pg_catalog.pg_rewrite r on r.oid = d.objid join pg_catalog.pg_attribute a on a.attrelid = d.refobjid and a.attnum = d.refobjsubid
      where d.classid = 'pg_catalog.pg_rewrite'::regclass and d.refobjid = 'public.profiles'::regclass
      and a.attname in ('username', 'username_confirmat_at', 'town_uuid', 'primary_town', 'secondary_towns', 'provinces', 'comarcas')) then
      raise exception 'SDP-USER-022:`));
}
/* Correccions H (S-02) · Cada «profiles read own» del repositori: la clàusula
   USING tal com s'escriu i la qual que en desa pg_policies (verificades a
   PGlite 0.3.16, PostgreSQL 17.5); null, la de 2609110600, que obria el padró. */
const LECTURES_DE_PROFILES = Object.freeze([
  ['(select auth.uid()) is not null and id = (select auth.uid())', '((( SELECT auth.uid() AS uid) IS NOT NULL) AND (id = ( SELECT auth.uid() AS uid)))'],
  ['(select auth.uid()) = id', '(( SELECT auth.uid() AS uid) = id)'],
  ['auth.uid() = id', '(auth.uid() = id)'],
  ['true', null]
]);
const QUALS_FILA_PROPIA = LECTURES_DE_PROFILES.map(([, qual]) => qual).filter(Boolean);
const qualsDeLaGuarda = (codi) => {
  const m = /pp\.qual not in \(([\s\S]*?)\)\s+or pp\.roles/.exec(codi);
  return m ? literals(m[1]) : null;
};
/** Correccions H (S-02) · La guarda: «profiles read own» només amb una qual de fila pròpia (literal, amb majúscules) i només authenticated. */
function lecturaNomesPropia(codi) {
  const g = codi.slice(0, codi.search(/alter table public\.profiles add column/));
  return JSON.stringify(qualsDeLaGuarda(g)) === JSON.stringify(QUALS_FILA_PROPIA)
    && normal(g).includes(normal(`and pp.cmd in ('SELECT', 'ALL') and pp.permissive = 'PERMISSIVE' and pp.policyname = 'profiles read own'
      and (pp.qual is null or pp.qual not in (${QUALS_FILA_PROPIA.map((q) => `'${q}'`).join(', ')})
      or pp.roles <> array['authenticated']::name[])) then raise exception 'SDP-USER-022:`));
}
/** Correccions H (S-01) · El camí 'Veí/na' només des de l'identificador de reserva: torna a generar una sola vegada. */
const appleUnaVegada = (cos) => normal(cos).includes(normal(`elsif old.full_name = 'Veí/na' and new.full_name is distinct from old.full_name
    and old.username_confirmat_at is null and old.username ~ '^${USERNAME_DE_RESERVA}(-[0-9a-f]+)?$'
    and old.baixa_demanada_at is null and new.baixa_demanada_at is null then
    new.username := private.usuari_lliure(private.usuari_base(new.full_name), new.id); end if;`));
/** QA-H02 · Cada poble triat, UNA fila de public.towns (desempat total: el slug és únic), i town_uuid,
    primary_town, provinces i comarcas d'eixes mateixes files; cap join per nom que n'aplegue diverses. */
function pobleDUnaFila(cos) {
  const c = normal(cos);
  return c.includes(normal(`with triades as ( select l.ordre, f.id, f.name, f.provincia, f.comarca
      from unnest(v_pobles) with ordinality as l(nom, ordre) cross join lateral (
      select t.id, t.name, t.provincia, t.comarca from public.towns t where lower(t.name) = lower(l.nom)
      order by (t.id = p_town_uuid) desc nulls last,
      (t.id::text = (select a.valor from private.ajustos a where a.clau = 'poble_per_defecte')) desc nulls last,
      (t.name = l.nom) desc, t.is_open desc, t.created_at, t.slug, t.id limit 1) as f)`))
    && c.includes(normal(`select (select r.id from triades r where r.ordre = 1),
      coalesce((select r.name from triades r where r.ordre = 1), v_pobles[1]),`))
    && ['provincia', 'comarca'].every((camp) => c.includes(normal(`(select coalesce(jsonb_agg(x.${camp} order by x.primer), '[]'::jsonb)
      from (select r.${camp}, min(r.ordre) as primer from triades r
      where nullif(btrim(r.${camp}), '') is not null group by r.${camp}) as x)`)))
    && c.includes('into town_uuid, primary_town, provinces, comarcas;')
    && (c.match(/\bfrom public\.towns t\b/g) || []).length === 1
    && !/\bjoin public\.towns\b/.test(c);
}
/* QA-H02 (fixer) · El cos sencer de poble_derivat: una línia de més després
   del select (town_uuid := null, primary_town := v_pobles[1]) passava els
   fragments de pobleDUnaFila. */
const COS_DERIVAT = `declare v_pobles text[] := private.llista_pobles(p_town_name);
  begin town_name := p_town_name;
    if cardinality(v_pobles) = 0 then v_pobles := array['${POBLE_FUNDACIONAL}']; town_name := v_pobles[1]; end if;
    with triades as ( select l.ordre, f.id, f.name, f.provincia, f.comarca
        from unnest(v_pobles) with ordinality as l(nom, ordre)
        cross join lateral ( select t.id, t.name, t.provincia, t.comarca from public.towns t where lower(t.name) = lower(l.nom)
          order by (t.id = p_town_uuid) desc nulls last,
            (t.id::text = (select a.valor from private.ajustos a where a.clau = 'poble_per_defecte')) desc nulls last,
            (t.name = l.nom) desc, t.is_open desc, t.created_at, t.slug, t.id
          limit 1) as f)
    select (select r.id from triades r where r.ordre = 1),
      coalesce((select r.name from triades r where r.ordre = 1), v_pobles[1]),
      (select coalesce(jsonb_agg(x.provincia order by x.primer), '[]'::jsonb)
        from (select r.provincia, min(r.ordre) as primer from triades r where nullif(btrim(r.provincia), '') is not null group by r.provincia) as x),
      (select coalesce(jsonb_agg(x.comarca order by x.primer), '[]'::jsonb)
        from (select r.comarca, min(r.ordre) as primer from triades r where nullif(btrim(r.comarca), '') is not null group by r.comarca) as x)
      into town_uuid, primary_town, provinces, comarcas;
    secondary_towns := to_jsonb(coalesce(v_pobles[2:], '{}'::text[]));
  end;`;
const derivatSencer = (cos) => normal(cos) === normal(COS_DERIVAT);
/** QA-H02 (fixer) · El town_uuid que la fila ja porta (backfill: f.town_uuid; disparador: old.town_uuid en un
    UPDATE) només desempata els homònims: cap altra assignació de v_pobles ni cap altre ús de p_town_uuid. */
const ancoraNomesDesempata = (cos, codi, disparador) => (normal(cos).match(/\bv_pobles :=/g) || []).length === 1
  && (normal(cos).match(/\bp_town_uuid\b/g) || []).length === 1
  && normal(cos).includes('order by (t.id = p_town_uuid) desc nulls last,')
  && normal(codi).includes(normal('then f.town_name else f.primary_town end, f.town_uuid) as x'))
  && normal(disparador).includes(normal("from private.poble_derivat(new.town_name, case when tg_op = 'UPDATE' then old.town_uuid end) as d;"));
/* QA-H02 (fixer) · El catàleg, sencer: un nom únic, pel títol com e36606db2;
   un homònim, l'entrada amb el seu slug i, si no n'hi ha cap, la del títol
   que no du el slug d'una altra fila, i només a la fila que eixe títol tria
   (revisió adversarial: una entrada sense id ja no arriba a tots els
   homònims). */
const CATALEG = `update public.towns t set provincia = nullif(left(btrim(c.provincia), 120), ''), comarca = nullif(left(btrim(c.comarca), 120), '')
  from (select distinct on (w.id) w.id, l.e ->> 'provincia' as provincia, l.e ->> 'comarca' as comarca
    from public.towns w
    cross join lateral (select exists (select 1 from public.towns o where lower(o.name) = lower(w.name) and o.id <> w.id) as homonim) as h
    join public.app_content ac on ac.key = 'towns'
    cross join lateral jsonb_array_elements( case when jsonb_typeof(ac.payload) = 'array' then ac.payload else '[]'::jsonb end) with ordinality as l(e, n)
    where jsonb_typeof(l.e) = 'object' and jsonb_typeof(l.e -> 'title') = 'string'
      and case when h.homonim then l.e ->> 'id' = w.slug
        or (lower(l.e ->> 'title') = lower(w.name) and not exists (select 1 from public.towns o where o.slug = l.e ->> 'id' and o.id <> w.id)
          and w.id = (select o.id from public.towns o where lower(o.name) = lower(w.name)
            order by (o.id::text = (select a.valor from private.ajustos a where a.clau = 'poble_per_defecte')) desc nulls last,
              (o.name = l.e ->> 'title') desc, o.is_open desc, o.created_at, o.slug, o.id limit 1))
        else lower(l.e ->> 'title') = lower(w.name) end
    order by w.id, coalesce(h.homonim and l.e ->> 'id' = w.slug, false) desc,
      (ac.tenant_id::text = (select a.valor from private.ajustos a where a.clau = 'poble_per_defecte')) desc nulls last,
      ac.updated_at desc, ac.tenant_id, l.n) as c
  where c.id = t.id and t.provincia is null and t.comarca is null;`;
const cataleguPerHomonim = (codi) => normal(codi.slice(codi.indexOf('update public.towns t'), codi.indexOf('create table if not exists private.usuaris_retinguts')))
  === normal(CATALEG);
/** Revisió adversarial · El títol d'un homònim tria la fila amb el mateix ordre que poble_derivat, sense la fila d'abans. */
const ordreDe = (re, text) => {
  const m = re.exec(text);
  return m ? normal(m[1]) : null;
};
function mateixOrdre(codi, derivat) {
  const cataleg = ordreDe(/and w\.id = \(select o\.id from public\.towns o\s+where lower\(o\.name\) = lower\(w\.name\)\s+order by ([\s\S]*?)\s+limit 1\)\)/, codi);
  const triada = ordreDe(/order by \(t\.id = p_town_uuid\) desc nulls last,\s+([\s\S]*?)\s+limit 1\) as f\)/, derivat);
  return cataleg !== null && triada !== null && cataleg === triada.replace(/\bt\./g, 'o.').replace('o.name = l.nom', "o.name = l.e ->> 'title'");
}
/** Revisió adversarial · El backfill no escriu cap camp de poble en una fila amb el town_uuid d'un altre poble que el
    primer (mai camps de dues files); el d'una fila que ja no existix es conserva i la resta ix del nom. */
const backfillSenseBarreja = (codi) => normal(codi).includes(normal(`or coalesce(f.comarcas, '[]'::jsonb) = '[]'::jsonb) as d
  where d.id = p.id and (p.town_uuid is null or d.town_uuid is not distinct from p.town_uuid
    or not exists (select 1 from public.towns t where t.id = p.town_uuid));`));
/** Una sonda que no canvia el text no prova res. */
const muta = (text, de, a) => {
  const nou = text.replace(de, a);
  expect(nou, String(de)).not.toBe(text);
  return nou;
};
/** La branca INSERT del disparador no deixa caure l'alta: fallback i SDP-REG-903. */
const altaSegura = (cos) => /if tg_op = 'INSERT' then\s+begin[\s\S]*?exception when others then\s+new\.username := 'veina-' \|\| left\(replace\(new\.id::text, '-', ''\), 8\);\s+perform private\.anota_incidencia_alta\(new\.id, 'SDP-REG-903'/.test(cos);

describe('P1-68 · la migració: nom, capçalera i transacció', () => {
  test('el nom segueix el format i va després de totes les migracions de què depén', () => {
    expect(NOM).toMatch(/^\d{10}_[a-z0-9_]+\.sql$/);
    const ordre = readdirSync(MIGRACIONS).filter((f) => f.endsWith('.sql')).sort();
    for (const anterior of ['2609080000_initial_schema.sql', '2609110600_perfil_avatar_i_permisos.sql', '2609261500_identitat_perfil_f1.sql',
      PERFIL_PUBLIC, '2610160250_perfil_update_propi.sql', '2610241440_baixa_completa_ugc_i_fitxers.sql', '2610281730_membres_concurrents_i_correu_public.sql']) {
      expect(ordre.indexOf(anterior), anterior).toBeGreaterThanOrEqual(0);
      expect(ordre.indexOf(NOM), anterior).toBeGreaterThan(ordre.indexOf(anterior));
    }
  });

  test('la capçalera: procedència, els apartats, les consultes, les dues sessions i UNA sola línia NO aplicada', () => {
    expect(SQL).toMatch(/^-- =+\n-- 261028_2100 · P1-68 \(pla 261028_1526, §3\.8\.2\.3; decisions del Mestre\n/);
    for (const apartat of [/^-- QUÈ CORREGIX:$/m, /^-- QUÈ FA:$/m, /^-- QUÈ NO FA:$/m, /^-- CODIS:$/m, /^-- Depén de: 2609080000/m,
      /^-- ABANS D'APLICAR-LA \(lectura/m, /^-- DESPRÉS D'APLICAR-LA \(lectura\):$/m, /^-- VERIFICACIÓ MANUAL AMB DUES SESSIONS/m]) {
      expect(CAPCALERA).toMatch(apartat);
    }
    expect(CAPCALERA).toContain('261028_2008_produccio_supabase_profiles_1..4');
    for (let n = 1; n <= 8; n += 1) expect(CAPCALERA, `consulta ${n}`).toMatch(new RegExp(`^--   ${n}\\. select `, 'm'));
    expect(CAPCALERA).toMatch(/select public\.desa_el_meu_usuari\('pepa'\);[\s\S]*?\{"desat": false, "motiu": "ocupat", "proposta": "pepa-2"\}/);
    expect(CAPCALERA).toContain('select count(*) from public.profiles where username is null;  (0)');
    expect(LINIES.filter((l) => /NO aplicada/.test(l))).toEqual(["-- NO aplicada: l'aplica el Mestre, mai un agent."]);
  });

  test('una sola transacció amb temps d’espera curts, recàrrega de PostgREST i commit; cap rollback', () => {
    expect(CODI.trimStart()).toMatch(/^begin;\s*set local lock_timeout = '5s';\s*set local statement_timeout = '60s';/i);
    expect((CODI.match(/^\s*begin;\s*$/gim) || []).length).toBe(1);
    expect((CODI.match(/^\s*commit;\s*$/gim) || []).length).toBe(1);
    expect(CODI).toMatch(/notify pgrst, 'reload schema';\s*commit;\s*$/i);
    expect(CODI).not.toMatch(/\brollback\b/i);
  });
});

describe('P1-68 · el que no fa', () => {
  test('cap política, cap permís de taula ni per a anon; només execute per a authenticated', () => {
    expect(tocaPoliticaOAnon(CODI)).toBe(false);
    expect(grantsDeTaula(CODI)).toEqual([]);
    expect(CODI.split(';').map(normal).filter((s) => /^grant\b/.test(s))).toEqual([
      'grant execute on function public.desa_el_meu_usuari(text) to authenticated',
      'grant execute on function public.perfil_public(uuid) to authenticated'
    ]);
    expect(CODI).toMatch(/revoke execute on function public\.desa_el_meu_usuari\(text\) from public, anon;\s*grant execute on function public\.desa_el_meu_usuari\(text\) to authenticated;/);
  });

  test('no redefinix cap funció de l’alta ni de la baixa, ni toca la pertinença al poble', () => {
    expect(redefinixAltaOBaixa(CODI)).toBe(false);
    expect(escriuPertinences(CODI)).toBe(false);
    expect(CODI).not.toMatch(/contact_email|organization_member_organizations/i);
  });

  test('cap UUID literal ni cap fila d’una persona concreta', () => {
    expect(CODI).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    expect(CODI).not.toMatch(/where\s+(p\.)?id\s*=\s*'/i);
  });

  test('les funcions privades: search_path buit i cap execute per a public, anon ni authenticated', () => {
    const privades = FUNCIONS.filter((f) => f.esquema === 'private');
    expect(privades.map((f) => f.nom).sort()).toEqual(['llista_pobles', 'poble_derivat', 'profiles_usuari_i_poble', 'usuari_base', 'usuari_lliure', 'usuari_normalitzat', 'usuari_plega', 'usuari_reservat']);
    for (const f of privades) {
      expect(f.capcalera, f.nom).toMatch(/set search_path = ''/);
      expect(CODI, f.nom).toMatch(new RegExp(`revoke execute on function private\\.${f.nom}\\([^)]*\\) from public, anon, authenticated;`));
    }
    for (const f of [DISPARADOR, RPC]) expect(f.capcalera).toMatch(/volatile security definer set search_path = ''/);
  });

  test('les taules privades: RLS activa, tot revocat i cap política', () => {
    for (const taula of ['usuaris_retinguts', 'usuari_intents']) {
      expect(CODI).toMatch(new RegExp(`create table if not exists private\\.${taula} \\(`));
      expect(CODI).toMatch(new RegExp(`alter table private\\.${taula} enable row level security;`));
      expect(CODI).toMatch(new RegExp(`revoke all on table private\\.${taula} from public, anon, authenticated, service_role;`));
      expect(CODI).toMatch(new RegExp(`create table if not exists private\\.${taula} \\([\\s\\S]*?references auth\\.users \\(id\\) on delete cascade`));
    }
  });
});

describe('P1-68 · ordre, alta i codis', () => {
  test('guardes primer: la taula, la RLS i els tipus avorten abans de cap ALTER', () => {
    const guarda = CODI.search(/raise exception 'SDP-USER-022: falta public\.profiles/);
    expect(guarda).toBeGreaterThan(0);
    expect(guarda).toBeLessThan(CODI.search(/alter table public\.profiles add column/));
    expect(CODI.search(/raise exception 'SDP-USER-020:/)).toBeGreaterThan(CODI.search(/add column if not exists username text;/));
    expect(CODI.search(/raise exception 'SDP-USER-020:/)).toBeLessThan(CODI.search(/create unique index if not exists profiles_usuari_unic/));
  });

  test('el backfill va dins de la finestra sense trg_profiles_touch, abans del NOT NULL i del disparador', () => {
    expect(ordreBo(CODI)).toBe(true);
    expect(CODI).toMatch(/where p\.username is null\s+order by p\.created_at, p\.id loop/);
    /* Fixer (revisió de seguretat, troballa 2) · El poble, en la mateixa
       finestra (també sense el disparador, per a una segona execució), i
       només els camps buits: «Backfill: només files amb NULL». */
    expect((CODI.match(/disable trigger trg_profiles_touch;/g) || []).length).toBe(1);
    expect(backfillNomesBuits(CODI)).toBe(true);
    /* Revisió adversarial (QA-H02): cap fila no rep camps de dues files. */
    expect(backfillSenseBarreja(CODI)).toBe(true);
    expect(normal(CODI)).toContain(normal(`case when f.primary_town is null
      or lower(btrim(f.primary_town)) = lower(coalesce((private.llista_pobles(f.town_name))[1], '')) then f.town_name else f.primary_town end`));
  });

  test('el disparador: BEFORE INSERT OR UPDATE per fila, i l’alta no cau mai (SDP-REG-903)', () => {
    expect(normal(CODI)).toContain('create trigger trg_profiles_usuari_i_poble before insert or update on public.profiles for each row execute function private.profiles_usuari_i_poble();');
    expect(altaSegura(DISPARADOR.cos)).toBe(true);
    expect(DISPARADOR.cos).toMatch(/exception when others then\s+if tg_op <> 'INSERT' then\s+raise;\s+end if;\s+perform private\.anota_incidencia_alta\(new\.id, 'SDP-REG-903'/);
    /* La reserva només es mira amb sessió: el SQL Editor del Mestre en pot
       assignar una. Fixer (troballa 3): amb sessió, només per la RPC; cap
       retingut, ni sense sessió. */
    expect(DISPARADOR.cos).toMatch(/if v_sessio and private\.usuari_reservat\(new\.username\) then\s+raise exception 'SDP-USER-002/);
    expect(nomesPerLaRpc(DISPARADOR.cos, RPC.cos)).toBe(true);
    /* Fixer (troballa 2): el poble, només a l'alta i quan canvia town_name. */
    expect(pobleNomesAmbTria(DISPARADOR.cos)).toBe(true);
    expect(DISPARADOR.cos).not.toMatch(/from public\.towns/);
    /* La baixa: es reté i la metadada de GoTrue se'n va. */
    expect(DISPARADOR.cos).toMatch(/insert into private\.usuaris_retinguts \(user_id, username\)\s+values \(new\.id, old\.username\)/);
    expect(DISPARADOR.cos).toContain("set raw_user_meta_data = u.raw_user_meta_data - 'username'");
    /* L'alta d'Apple: només des del nom de reserva de private.nom_d_alta. */
    expect(DISPARADOR.cos).toMatch(/elsif old\.full_name = 'Veí\/na' and new\.full_name is distinct from old\.full_name\s+and old\.username_confirmat_at is null/);
  });

  test('Correccions H (S-01) · el camí Veí/na torna a generar una sola vegada: només des d’un identificador de reserva', () => {
    expect(appleUnaVegada(DISPARADOR.cos)).toBe(true);
    const reserva = new RegExp(/and old\.username ~ '([^']+)'/.exec(DISPARADOR.cos)[1]);
    /* Totes les formes de reserva d'esta migració: 'veina' i 'veina-N'
       (usuari_lliure) i 'veina-' amb 8 xifres hex d'un uuid (passats els
       100 candidats i el camí d'error de l'alta). Cap altra. */
    expect([...new Set(literals(CODI).filter((l) => l.includes(USERNAME_DE_RESERVA)))].sort())
      .toEqual([`^${USERNAME_DE_RESERVA}(-[0-9a-f]+)?$`, USERNAME_DE_RESERVA, `${USERNAME_DE_RESERVA}-`]);
    const vuit = [...CODI.matchAll(/'veina-' \|\| left\(replace\((gen_random_uuid\(\)|new\.id)::text, '-', ''\), 8\)/g)].map((m) => m[1]);
    expect(vuit).toEqual(['gen_random_uuid()', 'new.id']);
    expect((CODI.match(/'veina-'/g) || []).length).toBe(vuit.length);
    const formes = [USERNAME_DE_RESERVA, ...Array.from({ length: MAXIM_CANDIDATS_USERNAME - 1 }, (_, i) => `${USERNAME_DE_RESERVA}-${i + 2}`),
      `${USERNAME_DE_RESERVA}-${randomUUID().replace(/-/g, '').slice(0, 8)}`,
      `${USERNAME_DE_RESERVA}-${'0f1e2d3c-4b5a-4968-8778-a9b8c7d6e5f4'.replace(/-/g, '').slice(0, 8)}`];
    for (const forma of formes) expect(forma).toMatch(reserva);
    for (const deVeres of ['annaperez', 'annaperez-2', 'veinat', 'veinaperez', 'xveina', 'veina-', 'veina-x', 'veina-2-3', 'baixa-0123456789ab'])
      expect(deVeres).not.toMatch(reserva);
  });

  test('Correccions H (S-02) · «profiles read own»: només les qual de fila pròpia del repositori i només authenticated', () => {
    const creades = readdirSync(MIGRACIONS).filter((f) => f.endsWith('.sql') && f < NOM).sort()
      .flatMap((f) => [...sensComentaris(llig(f)).matchAll(/create policy "profiles read own" on public\.profiles\s+for select\s+to ([a-z_, ]+?)\s+using \(([\s\S]*?)\);/gi)]
        .map((m) => ({ f: f.slice(0, 10), rols: normal(m[1]), using: normal(m[2]) })));
    expect(creades.map((c) => c.f)).toEqual(['2609080000', '2609110600', '2609121500', '2609150000', '2609160600']);
    const qual = new Map(LECTURES_DE_PROFILES);
    for (const c of creades) {
      expect(qual.has(c.using), `${c.f}: ${c.using}`).toBe(true);
      if (qual.get(c.using)) expect(c.rols, c.f).toBe('authenticated');
    }
    expect(creades.find((c) => c.f === '2609110600')).toEqual({ f: '2609110600', rols: 'authenticated, anon', using: 'true' });
    expect(qualsDeLaGuarda(CODI)).toEqual(QUALS_FILA_PROPIA);
    expect(lecturaNomesPropia(CODI)).toBe(true);
    expect(CODI.search(/and pp\.policyname = 'profiles read own'/)).toBeLessThan(CODI.search(/alter table public\.profiles add column/));
  });

  test('la RPC: sessió, forma, ritme sota pany, fila, baixa, reserva i ocupat amb proposta', () => {
    expect(RPC.params).toBe('p_usuari text');
    const cos = RPC.cos;
    const ordre = ['SDP-USER-000', 'SDP-USER-001', 'sdp-usuari-ritme:', 'SDP-USER-005', 'SDP-USER-004', 'SDP-USER-002', 'SDP-USER-003', "'sdp-usuari:' || v_usuari", "'motiu', 'ocupat'"]
      .map((marca) => cos.indexOf(marca));
    expect(ordre.every((pos) => pos > 0)).toBe(true);
    expect([...ordre].sort((a, b) => a - b)).toEqual(ordre);
    expect(cos).toMatch(/where p\.id = v_jo for update;/);
    expect(cos).toMatch(/exception when unique_violation then\s+return jsonb_build_object\('desat', false, 'motiu', 'ocupat'/);
    expect(cos).toMatch(/if v_hora >= 10 then/);
  });

  test('els codis són una llista tancada, documentada a CODIS i coneguda pel client', () => {
    const usats = [...new Set([...CODI.matchAll(/SDP-USER-\d{3}/g)].map((m) => m[0]))].sort();
    expect(usats).toEqual(['SDP-USER-000', 'SDP-USER-001', 'SDP-USER-002', 'SDP-USER-003', 'SDP-USER-004', 'SDP-USER-005',
      'SDP-USER-006', 'SDP-USER-007', 'SDP-USER-020', 'SDP-USER-021', 'SDP-USER-022', 'SDP-USER-023', 'SDP-USER-024']);
    const codis = CAPCALERA.slice(CAPCALERA.indexOf('-- CODIS:'), CAPCALERA.indexOf('-- Depén de:'));
    for (const codi of [...usats, 'SDP-REG-903']) expect(codis, codi).toContain(codi);
    for (const codi of usats.filter((c) => c < 'SDP-USER-020')) expect(Object.hasOwn(MISSATGES_USERNAME, codi), codi).toBe(true);
  });
});

describe('P1-68 · paritat amb el client', () => {
  test('el plegat: els accents, les lligadures i la ela geminada són els d’onboardingModel.js', () => {
    const plegat = plegatDelSql(PLEGA.cos);
    expect(plegat.accents).toEqual({ de: ACCENTS_USERNAME.de, a: ACCENTS_USERNAME.a });
    expect(plegat.lligadures).toEqual(LLIGADURES_USERNAME.map(([de, a]) => [de, a]));
    expect(PLEGA.cos).toContain("'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'");
    expect(PLEGA.cos).toContain("regexp_replace(normalize(coalesce(p_text, ''), NFC), '([lL])[.·‧∙]([lL])', '\\1\\2', 'g')");
    expect(MODEL).toContain(".normalize('NFC').replace(/([lL])[.·‧∙]([lL])/g, '$1$2')");
    expect(PLEGA.cos).not.toMatch(/\blower\(|unaccent|nfd/i);
  });

  test('les partícules, la llista reservada, el prefix de baixa i els límits', () => {
    expect(arrayDe(BASE.cos)).toEqual([...PARTICULES_USERNAME]);
    expect(arrayDe(RESERVAT.cos)).toEqual([...USERNAMES_RESERVATS]);
    expect(RESERVAT.cos).toContain(`starts_with(p_usuari, '${PREFIX_USERNAME_DE_BAIXA}')`);
    /* Fixer (troballes 1, 5 i 6): 'baixa' a la llista, les còpies de les
       identitats de la plataforma i les fundacionals de private.ajustos. */
    expect(USERNAMES_RESERVATS).toContain('baixa');
    const arrels = /regexp_replace\(replace\(p_usuari, '-', ''\), '\[0-9\]\+\$', ''\) = any \(array\[([^\]]*)\]\)/.exec(RESERVAT.cos);
    expect(arrels && literals(arrels[1])).toEqual([...ARRELS_RESERVADES_USERNAME]);
    expect([...RESERVAT.cos.matchAll(/starts_with\(replace\(p_usuari, '-', ''\), '([a-z]+)'\)/g)].map((m) => m[1])).toEqual([...PREFIXOS_RESERVATS_USERNAME]);
    expect(normal(RESERVAT.cos)).toContain(normal(`exists (select 1 from private.ajustos a where a.clau = 'usuaris_reservats'
      and p_usuari = any (regexp_split_to_array(btrim(a.valor), '[\\s,]+')))`));
    expect(RESERVAT.capcalera).toMatch(/\bstable\b/);
    expect(lliureFitat(LLIURE.cos)).toBe(true);
    expect(BASE.cos).toContain(`left(array_to_string(v_bones, ''), ${MAXIM_BASE_USERNAME})`);
    expect(BASE.cos).toContain('exit when cardinality(v_bones) = 2;');
    expect(LLIURE.cos).toContain(`when char_length(coalesce(p_base, '')) >= ${MINIM_USERNAME} then p_base else '${USERNAME_DE_RESERVA}'`);
    expect(LLIURE.cos).toContain(`rtrim(left(v_base, ${MAXIM_USERNAME} - char_length('-' || v_n)), '-') || '-' || v_n`);
    expect(CODI).toContain(`check (username ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(username) between ${MINIM_USERNAME} and ${MAXIM_USERNAME})`);
  });

  /* Fixer (revisió de paritat, troballa 1) · Els cossos, no només els
     literals: les 13 mutacions que passaven les proves (sense la reserva, el
     retingut, el pany o l'exclusió pròpia a usuari_lliure, el tall o el
     separador de usuari_normalitzat, les branques del disparador i de la RPC,
     les xifres de usuari_base) ja no passen. */
  test('cossos de la col·lisió, del normalitzat, de la RPC i del disparador', () => {
    const cos = (nom, esquema = 'private') => normal(funcio(CODI, esquema, nom).cos);
    expect(cos('usuari_lliure')).toContain("perform pg_advisory_xact_lock(hashtextextended('sdp-usuari:' || v_candidat, 0)); exit when not private.usuari_reservat(v_candidat) and not exists (select 1 from public.profiles p where lower(p.username) = v_candidat and p.id is distinct from p_usuari) and not exists (select 1 from private.usuaris_retinguts r where lower(r.username) = v_candidat and r.user_id is distinct from p_usuari);");
    expect(cos('usuari_base')).toContain("btrim(regexp_replace(private.usuari_plega(p_nom), '[^a-z0-9]+', ' ', 'g')), ' ') loop");
    expect(cos('usuari_normalitzat')).toBe(normal(`select nullif(btrim(left(btrim(regexp_replace(private.usuari_plega(p_text), '[^a-z0-9]+', '-', 'g'), '-'), ${MAXIM_USERNAME}), '-'), '');`));
    expect(cos('desa_el_meu_usuari', 'public')).toContain('if private.usuari_reservat(v_usuari) and v_usuari is distinct from v_actual then');
    expect(cos('desa_el_meu_usuari', 'public')).toContain('or exists (select 1 from private.usuaris_retinguts r where lower(r.username) = v_usuari and r.user_id <> v_jo) then');
    const d = cos('profiles_usuari_i_poble');
    expect(d).toContain('if v_desitjat is not null and char_length(v_desitjat) >= 3 and not private.usuari_reservat(v_desitjat) then');
    expect(d).toMatch(/exit when not exists \(select 1 from public\.profiles p where lower\(p\.username\) = v_retingut\); end loop; new\.username := v_retingut;/);
    expect(d).toContain("perform pg_advisory_xact_lock(hashtextextended('sdp-usuari:' || new.username, 0)); if exists (select 1 from private.usuaris_retinguts r where lower(r.username) = new.username and r.user_id <> new.id) then raise exception 'sdp-user-007:");
    expect(d).toMatch(/v_retingut := private\.usuari_lliure\(private\.usuari_normalitzat\(v_retingut\), new\.id\); end if; new\.username := v_retingut;/);
  });

  test('cap identitat fundacional ni cap nom de persona al SQL, ni als comentaris', () => {
    const text = SQL.toLowerCase();
    for (const nom of [PERSONA_PILOT.nom, ...PERSONA_PILOT.nom.split(/\s+/), PERSONA_PILOT.slug, ...USERNAMES_FUNDACIONALS]) {
      expect(text, nom).not.toContain(nom.toLowerCase());
    }
    expect(CAPCALERA).toContain('USERNAMES_FUNDACIONALS.join(\' \')');
  });

  test.each(NOMS_I_BASES)('la taula de noms (verificada a PGlite) passa per baseDeUsername: %j', (nom, base) => {
    expect(baseDeUsername(nom)).toBe(base);
  });

  test('els pobles: la ela geminada i el separador són els de nomsDelPoble.js; el de sèrie, POBLE_FUNDACIONAL', () => {
    expect(POBLES).toContain('const ELA_GEMINADA = /([lL])·(?=[lL])/g;');
    expect(POBLES).toContain('const SEPARADOR_DE_POBLES = /\\s*·\\s*/;');
    const llista = funcio(CODI, 'private', 'llista_pobles').cos;
    expect(llista).toContain("regexp_replace(coalesce(p_text, ''), '([lL])·(?=[lL])', '\\1' || chr(57344), 'g')");
    expect(llista).toContain("'\\s*·\\s*'");
    const pobles = literals(CODI).filter((l) => /Torre|Maçanes/.test(l));
    expect(new Set(pobles)).toEqual(new Set([POBLE_FUNDACIONAL]));
    expect(pobles.length).toBeGreaterThanOrEqual(2);
    expect(llig('2609110600_perfil_avatar_i_permisos.sql')).toContain(`town_name text default '${POBLE_FUNDACIONAL}'`);
    /* El catàleg es llig per la clau 'towns' i cap nom de poble escrit a mà. */
    const omple = CODI.slice(CODI.indexOf('update public.towns t'), CODI.indexOf('create table if not exists private.usuaris_retinguts'));
    expect(omple).toMatch(/\bac\.key = 'towns'/);
    expect(new Set(literals(omple))).toEqual(new Set(['', '[]', 'array', 'comarca', 'id', 'object', 'poble_per_defecte', 'provincia', 'string', 'title', 'towns']));
  });
});

describe('QA-H02 · el poble canònic amb homònims: una sola fila per poble triat', () => {
  test('la premissa: towns.slug és únic i name no', () => {
    expect(llig('2609080000_initial_schema.sql')).toMatch(/create table if not exists public\.towns \(\s+id uuid primary key default gen_random_uuid\(\),\s+slug text not null unique,\s+name text not null,/);
    expect(sensComentaris(llig('2609080000_initial_schema.sql'))).not.toMatch(/unique\s*\(\s*(lower\()?name\b/i);
  });

  test('poble_derivat: una fila per poble (desempat total) i els camps de poble d’eixes mateixes files', () => {
    expect(pobleDUnaFila(DERIVAT.cos)).toBe(true);
    /* El cos sencer: town_name és la tria, tal qual (buit → La Torre, com
       e36606db2); secondary_towns, la resta dels noms triats. */
    expect(derivatSencer(DERIVAT.cos)).toBe(true);
    expect(normal(DERIVAT.cos)).toContain(normal(`town_name := p_town_name; if cardinality(v_pobles) = 0 then
      v_pobles := array['${POBLE_FUNDACIONAL}']; town_name := v_pobles[1]; end if;`));
    expect(DERIVAT.capcalera).toMatch(/^language plpgsql stable set search_path = ''$/);
  });

  test('la signatura: el backfill i el disparador (old.town_uuid) porten la fila que ja hi ha, que només desempata', () => {
    expect(DERIVAT.params).toBe(normal(`p_town_name text, p_town_uuid uuid default null, out town_name text, out town_uuid uuid,
      out primary_town text, out secondary_towns jsonb, out provinces jsonb, out comarcas jsonb`));
    expect(FUNCIONS.filter((f) => f.nom === 'poble_derivat')).toHaveLength(1);
    const drop = CODI.search(/drop function if exists private\.poble_derivat\(text\);/);
    expect(drop).toBeGreaterThan(0);
    expect(drop).toBeLessThan(DERIVAT.inici);
    expect(CODI).toMatch(/revoke execute on function private\.poble_derivat\(text, uuid\) from public, anon, authenticated;/);
    expect(ancoraNomesDesempata(DERIVAT.cos, CODI, DISPARADOR.cos)).toBe(true);
    expect(pobleNomesAmbTria(DISPARADOR.cos)).toBe(true);
    expect(DISPARADOR.cos).not.toMatch(/poble_derivat\(new\.town_name, new\.town_uuid\)/);
    expect((CODI.match(/\b(?:lateral|from) private\.poble_derivat\(/g) || []).length).toBe(2);
  });

  test('el catàleg: un nom únic pel títol (com e36606db2); un homònim pel seu slug, mai pel d’una altra fila, i pel títol només la fila que tria', () => {
    expect(cataleguPerHomonim(CODI)).toBe(true);
    expect(mateixOrdre(CODI, DERIVAT.cos)).toBe(true);
    expect(CODI).not.toMatch(/where lower\(c\.titol\) = lower\(t\.name\)/);
  });

  test('la capçalera: el desempat, els homònims abans d’aplicar-la i la comprovació de després', () => {
    const text = normal(CAPCALERA.replace(/^--/gm, ''));
    expect(text).toContain(normal(`Cada poble de town_name, UNA sola fila de public.towns (slug
      és únic, name no; si n'hi ha dos amb el mateix nom: en un canvi de town_name, la que ja tenia, old.town_uuid; després,
      el poble_per_defecte de private.ajustos, el nom escrit igual, obert, el més antic i el slug, QA-H02).`));
    expect(text).toContain(normal(`Una fila que ja porta town_uuid (d'una forma antiga) el conserva, i eixa fila només desempata
      els homònims (QA-H02)`));
    expect(text).toContain(normal(`Una fila amb el town_uuid d'un poble que no és el seu primer no rep cap camp de poble (mai camps
      de dues files) i ix a la comprovació de DESPRÉS`));
    expect(text).toContain(normal(`update public.profiles p set (town_name, town_uuid, primary_town, secondary_towns, provinces, comarcas) =
      (select d.town_name, d.town_uuid, d.primary_town, d.secondary_towns, d.provinces, d.comarcas
      from private.poble_derivat(p.town_name) as d) where p.id = '<id>';`));
    expect(CAPCALERA).toContain('select lower(name), array_agg(slug order by created_at) from public.towns group by 1 having count(*) > 1;');
    expect(text).toContain(normal(`select count(*) from public.profiles p join public.towns t on t.id = p.town_uuid
      where lower(p.primary_town) is distinct from lower(t.name)
      or (nullif(btrim(t.provincia), '') is not null and p.provinces ->> 0 is distinct from t.provincia)
      or (nullif(btrim(t.comarca), '') is not null and p.comarcas ->> 0 is distinct from t.comarca);`));
  });
});

describe('P1-68 · perfil_public amb usuari, només a la fitxa sencera', () => {
  const vella = funcio(sensComentaris(llig(PERFIL_PUBLIC)), 'public', 'perfil_public');
  const nova = funcio(CODI, 'public', 'perfil_public');

  test('DROP + CREATE (canvia el RETURNS TABLE), els mateixos revoke i grant', () => {
    expect(CODI.search(/drop function if exists public\.perfil_public\(uuid\);/)).toBeLessThan(nova.inici);
    expect(CODI).toMatch(/revoke execute on function public\.perfil_public\(uuid\) from public, anon;\s*grant execute on function public\.perfil_public\(uuid\) to authenticated;/);
  });

  test('la de 2610021520 sencera, amb `usuari` al final i només si d.sencera', () => {
    expect(nova.params).toBe(vella.params);
    expect(nova.capcalera).toBe(vella.capcalera.replace('updated_at timestamptz )', 'updated_at timestamptz, usuari text )'));
    expect(normal(nova.cos)).toBe(normal(vella.cos).replace('case when d.sencera then p.updated_at end from',
      'case when d.sencera then p.updated_at end, case when d.sencera then p.username end from'));
    expect(nova.cos).toMatch(/and p\.baixa_demanada_at is null/);
  });
});

describe('P1-68 · el catàleg', () => {
  test('supabase/README.md la nomena després de 2610281730 i abans de seed.sql, NO aplicada', () => {
    const posicio = README.indexOf(`migrations/${NOM}`);
    expect(posicio).toBeGreaterThan(README.indexOf('migrations/2610281730_membres_concurrents_i_correu_public.sql'));
    expect(posicio).toBeLessThan(README.indexOf('- `seed.sql`'));
    const entrada = README.slice(posicio).split('\n\n')[0];
    expect(entrada).toMatch(/P1-68/);
    expect(entrada).toContain('src/data/supabase/usuariIPoble.migracio.test.js');
    expect(entrada).toMatch(/\*\*NO aplicada: l'aplica el Mestre, mai un agent\*\*\.?$/);
  });
});

describe('P1-68 · les sondes: els detectors veuen una variant dolenta', () => {
  test('un permís de columna, una política o un grant a anon', () => {
    expect(grantsDeTaula(`${CODI}\ngrant update (username) on public.profiles to authenticated;`)).toEqual(['grant update (username) on public.profiles to authenticated']);
    expect(tocaPoliticaOAnon('create policy "x" on public.profiles for select using (true);')).toBe(true);
    expect(tocaPoliticaOAnon('grant execute on function public.desa_el_meu_usuari(text) to anon;')).toBe(true);
  });

  test('redefinir l’alta, escriure la pertinença o fer el backfill després del disparador', () => {
    expect(redefinixAltaOBaixa('create or replace function public.handle_new_user() returns trigger')).toBe(true);
    expect(escriuPertinences('insert into public.town_memberships (town_id, user_id, role) values (1, 2, 3);')).toBe(true);
    const disparadorAbans = CODI.replace(/create trigger trg_profiles_usuari_i_poble\b/, 'create trigger trg_x')
      .replace('-- ── 4 · Backfill', 'create trigger trg_profiles_usuari_i_poble before insert on public.profiles;\n-- ── 4 · Backfill');
    expect(ordreBo(disparadorAbans)).toBe(false);
    expect(ordreBo(CODI.replace(/alter table public\.profiles enable trigger trg_profiles_touch;/, ''))).toBe(false);
  });

  test('Fixer · un bucle sense límit, un canvi directe amb sessió, un retingut, el poble rederivat o un backfill que reescriu', () => {
    expect(lliureFitat(LLIURE.cos.replace(/if v_n > \d+ then[\s\S]*?end if;/, ''))).toBe(false);
    expect(lliureFitat(LLIURE.cos.replace("v_base := 'veina';", 'null;'))).toBe(false);
    expect(nomesPerLaRpc(DISPARADOR.cos.replace("raise exception 'SDP-USER-006:", "raise notice 'SDP-USER-006:"), RPC.cos)).toBe(false);
    expect(nomesPerLaRpc(DISPARADOR.cos.replace(/if exists \(select 1 from private\.usuaris_retinguts r where lower\(r\.username\) = new\.username[^;]*;\s*end if;/, ''), RPC.cos)).toBe(false);
    expect(nomesPerLaRpc(DISPARADOR.cos, RPC.cos.replace("perform pg_catalog.set_config('sdp.desa_el_meu_usuari', 'on', true);", ''))).toBe(false);
    expect(nomesPerLaRpc(DISPARADOR.cos.replace('new.username_confirmat_at := old.username_confirmat_at;', 'null;'), RPC.cos)).toBe(false);
    expect(pobleNomesAmbTria(DISPARADOR.cos.replace("if tg_op = 'INSERT' or new.town_name is distinct from old.town_name then", 'if true then'))).toBe(false);
    expect(pobleNomesAmbTria(DISPARADOR.cos.replace('new.town_uuid := old.town_uuid;', ''))).toBe(false);
    expect(backfillNomesBuits(CODI.replace('town_uuid = coalesce(p.town_uuid, d.town_uuid)', 'town_uuid = d.town_uuid'))).toBe(false);
    expect(backfillNomesBuits(CODI.replace("when coalesce(p.provinces, '[]'::jsonb) = '[]'::jsonb", "when p.provinces = '[]'::jsonb"))).toBe(false);
    expect(backfillNomesBuits(CODI.replace(/alter table public\.profiles disable trigger trg_profiles_usuari_i_poble;/, ''))).toBe(false);
    expect(backfillNomesBuits(`${CODI}\nupdate public.profiles p set town_name = p.town_name where p.town_uuid is null;`)).toBe(false);
    expect(guardesDeLectura(CODI)).toBe(true);
    expect(guardesDeLectura(CODI.replace("and pp.policyname <> 'profiles read own'", ''))).toBe(false);
    expect(guardesDeLectura(CODI.replace('join pg_catalog.pg_rewrite r on r.oid = d.objid', 'join pg_catalog.pg_class r on r.oid = d.objid'))).toBe(false);
  });

  test('Correccions H · el camí Veí/na sense la condició de reserva, o una lectura de profiles oberta', () => {
    expect(appleUnaVegada(muta(DISPARADOR.cos, /\s+and old\.username ~ '[^']+'/, ''))).toBe(false);
    expect(appleUnaVegada(muta(DISPARADOR.cos, "'^veina(-[0-9a-f]+)?$'", "'^veina'"))).toBe(false);
    expect(appleUnaVegada(muta(DISPARADOR.cos, 'and old.username ~', 'or old.username ~'))).toBe(false);
    expect(lecturaNomesPropia(muta(CODI, /\s+or pp\.roles <> array\['authenticated'\]::name\[\]/, ''))).toBe(false);
    expect(lecturaNomesPropia(muta(CODI, "'(auth.uid() = id)')", "'(auth.uid() = id)', 'true')"))).toBe(false);
    expect(lecturaNomesPropia(muta(CODI, /\(pp\.qual is null\s+or /, '('))).toBe(false);
    expect(lecturaNomesPropia(muta(CODI, "'(( SELECT auth.uid() AS uid) = id)'", "'(( select auth.uid() as uid) = id)'"))).toBe(false);
    expect(lecturaNomesPropia(muta(CODI, "and pp.policyname = 'profiles read own'\n", ''))).toBe(false);
  });

  test('QA-H02 · regions de tots els homònims, un desempat parcial, una línia de més, una àncora que reordena o que falta, o el catàleg desquadrat', () => {
    const cos = DERIVAT.cos;
    /* La forma de e36606db2: les regions de totes les files amb el mateix nom. */
    expect(pobleDUnaFila(muta(cos, /from triades r\s+where nullif\(btrim\(r\.provincia\), ''\) is not null/,
      "from unnest(v_pobles) with ordinality as l(nom, ordre) join public.towns r on lower(r.name) = lower(l.nom) where nullif(btrim(r.provincia), '') is not null"))).toBe(false);
    expect(pobleDUnaFila(muta(cos, /\s+limit 1\) as f\)/, ') as f)'))).toBe(false);
    expect(pobleDUnaFila(muta(cos, 't.created_at, t.slug, t.id', 't.created_at, t.id'))).toBe(false);
    expect(pobleDUnaFila(muta(cos, '(t.name = l.nom) desc, ', ''))).toBe(false);
    expect(pobleDUnaFila(muta(cos, '(t.id = p_town_uuid) desc nulls last,', ''))).toBe(false);
    expect(pobleDUnaFila(muta(cos, 'select (select r.id from triades r where r.ordre = 1),',
      'select (select t.id from public.towns t where lower(t.name) = lower(v_pobles[1]) limit 1),'))).toBe(false);
    /* Revisió adversarial (troballa 2): una línia de més després del select
       passa els fragments; només el cos sencer la veu. */
    const anula = muta(cos, 'into town_uuid, primary_town, provinces, comarcas;', 'into town_uuid, primary_town, provinces, comarcas;\n  town_uuid := null;');
    expect(pobleDUnaFila(anula)).toBe(true);
    expect(derivatSencer(anula)).toBe(false);
    expect(derivatSencer(muta(cos, 'into town_uuid, primary_town, provinces, comarcas;', 'into town_uuid, primary_town, provinces, comarcas;\n  primary_town := v_pobles[1];'))).toBe(false);
    /* F1 i troballa 1: l'àncora de b03cdc3d posava el poble de town_uuid
       davant, o en un town_name buit, en lloc de desempatar. */
    const davant = muta(cos, /(town_name := v_pobles\[1\];\s+end if;)/,
      '$1\n  if p_town_uuid is not null then v_pobles := array[(select t.name from public.towns t where t.id = p_town_uuid)] || v_pobles; end if;');
    expect(ancoraNomesDesempata(davant, CODI, DISPARADOR.cos)).toBe(false);
    expect(derivatSencer(davant)).toBe(false);
    const buit = muta(cos, `array['${POBLE_FUNDACIONAL}']`, `array[coalesce((select t.name from public.towns t where t.id = p_town_uuid), '${POBLE_FUNDACIONAL}')]`);
    expect(ancoraNomesDesempata(buit, CODI, DISPARADOR.cos)).toBe(false);
    expect(derivatSencer(buit)).toBe(false);
    expect(ancoraNomesDesempata(cos, muta(CODI, /then f\.town_name else f\.primary_town end,\s+f\.town_uuid\) as x/,
      'then f.town_name else f.primary_town end) as x'), DISPARADOR.cos)).toBe(false);
    /* Troballa 4: el disparador sense l'àncora (la forma d'abans) o amb la que escriu la sessió. */
    const senseAncora = muta(DISPARADOR.cos, "poble_derivat(new.town_name, case when tg_op = 'UPDATE' then old.town_uuid end)", 'poble_derivat(new.town_name)');
    expect(ancoraNomesDesempata(cos, CODI, senseAncora)).toBe(false);
    expect(pobleNomesAmbTria(senseAncora)).toBe(false);
    expect(pobleNomesAmbTria(muta(DISPARADOR.cos, "then old.town_uuid end)", "then new.town_uuid end)"))).toBe(false);
    /* El catàleg: F2 (el slug abans que el títol també per a un nom únic),
       troballa 3 (el títol amb el slug d'una altra fila) i la forma de b03cdc3d. */
    expect(cataleguPerHomonim(muta(CODI, 'coalesce(h.homonim and l.e ->> \'id\' = w.slug, false) desc,', "(l.e ->> 'id' = w.slug) desc nulls last,"))).toBe(false);
    expect(cataleguPerHomonim(muta(CODI, /\s+and not exists \(select 1 from public\.towns o where o\.slug = l\.e ->> 'id' and o\.id <> w\.id\)/, ''))).toBe(false);
    /* Revisió adversarial: el títol d'una entrada sense id a tots els homònims
       (la forma de d7e9893a), o amb un ordre que ja no és el de poble_derivat. */
    expect(cataleguPerHomonim(muta(CODI, /\s+and w\.id = \(select o\.id from public\.towns o[\s\S]*?limit 1\)\)/, ')'))).toBe(false);
    expect(mateixOrdre(muta(CODI, /(lower\(w\.name\)\s+order by [\s\S]*?)o\.is_open desc, /, '$1'), cos)).toBe(false);
    expect(mateixOrdre(muta(CODI, "(o.name = l.e ->> 'title') desc, ", ''), cos)).toBe(false);
    expect(mateixOrdre(CODI, muta(cos, 't.is_open desc, t.created_at', 't.created_at, t.is_open desc'))).toBe(false);
    /* Revisió adversarial: el backfill sense la guarda (la forma de d7e9893a:
       camps de dues files) o amb una guarda que deixa passar un altre poble. */
    expect(backfillSenseBarreja(muta(CODI, /\s+and \(p\.town_uuid is null or d\.town_uuid is not distinct from p\.town_uuid\s+or not exists \(select 1 from public\.towns t where t\.id = p\.town_uuid\)\);/, ';'))).toBe(false);
    expect(backfillSenseBarreja(muta(CODI, 'd.town_uuid is not distinct from p.town_uuid', 'd.town_uuid is not null'))).toBe(false);
    expect(backfillSenseBarreja(muta(CODI, /or not exists \(select 1 from public\.towns t where t\.id = p\.town_uuid\)\);/, 'or true);'))).toBe(false);
    expect(cataleguPerHomonim(muta(CODI, /and case when h\.homonim[\s\S]*?else lower\(l\.e ->> 'title'\) = lower\(w\.name\) end/,
      "and (l.e ->> 'id' = w.slug or lower(l.e ->> 'title') = lower(w.name))"))).toBe(false);
    expect(cataleguPerHomonim(muta(CODI, /where c\.id = t\.id/, 'where lower(c.id::text) = lower(t.name)'))).toBe(false);
  });

  test('una alta que pot caure o una regla desquadrada', () => {
    expect(altaSegura(DISPARADOR.cos.replace("'SDP-REG-903'", "'SDP-REG-900'"))).toBe(false);
    expect(arrayDe(RESERVAT.cos.replace("'consola', ", ''))).not.toEqual([...USERNAMES_RESERVATS]);
    expect(plegatDelSql(PLEGA.cos.replace("'Œ', 'oe'", "'Œ', 'o'")).lligadures).not.toEqual(LLIGADURES_USERNAME.map(([de, a]) => [de, a]));
  });
});
