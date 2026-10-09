/** Invariants de text de la migració del xat de pàgina (T63.2 i T67,
 *  2609282100_xat_de_pagina.sql). No hi ha cap base de dades local: es
 *  comprova el SQL com a text, amb el mateix escàner de sentències que
 *  tests/xat_f0_migracio.test.mjs (comentaris fora, cadenes i cossos $$
 *  respectats), perquè cap comentari puga donar un verd o un roig fals. La
 *  llista blanca de subjectes es contrasta amb la del client (contracte.js). */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {PAGINES_AMB_XAT, TIPUS_SUBJECTE_XAT, rutaDeSubjecte} from '../src/data/contracte.js';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIGRACIO = 'supabase/migrations/2609282100_xat_de_pagina.sql';
const CANONICA = 'supabase/migrations/2610042330_xat_pagina_iaia.sql';
const llig = (cami) => fs.readFileSync(path.join(REPO, cami), 'utf8');
const sql = llig(MIGRACIO);
const sqlCanonica = llig(CANONICA);
const readme = llig('supabase/README.md');
const capcalera = sql.slice(0, sql.indexOf('begin;'));

/** Talla el SQL en sentències pel `;` de nivell zero, sense comentaris.
 *  Còpia fidel de l'escàner de tests/xat_f0_migracio.test.mjs. */
function sentencies(text) {
  const fora = [];
  let buf = '';
  let i = 0;
  const n = text.length;
  while (i < n) {
    const c = text[i];
    const d = text[i + 1];
    if (c === '-' && d === '-') {
      while (i < n && text[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && d === '*') {
      let prof = 1;
      i += 2;
      while (i < n && prof > 0) {
        if (text[i] === '/' && text[i + 1] === '*') { prof++; i += 2; continue; }
        if (text[i] === '*' && text[i + 1] === '/') { prof--; i += 2; continue; }
        i++;
      }
      buf += ' ';
      continue;
    }
    if (c === "'") {
      buf += c; i++;
      while (i < n) {
        if (text[i] === "'" && text[i + 1] === "'") { buf += "''"; i += 2; continue; }
        buf += text[i];
        if (text[i] === "'") { i++; break; }
        i++;
      }
      continue;
    }
    if (c === '"') {
      buf += c; i++;
      while (i < n) {
        buf += text[i];
        if (text[i] === '"') { i++; break; }
        i++;
      }
      continue;
    }
    if (c === '$') {
      const m = /^\$[a-zA-Z_][a-zA-Z0-9_]*\$|^\$\$/.exec(text.slice(i));
      if (m) {
        const tanca = m[0];
        const fi = text.indexOf(tanca, i + tanca.length);
        const tall = fi === -1 ? n : fi + tanca.length;
        buf += text.slice(i, tall);
        i = tall;
        continue;
      }
    }
    if (c === ';') {
      if (buf.trim()) fora.push(buf);
      buf = '';
      i++;
      continue;
    }
    buf += c;
    i++;
  }
  if (buf.trim()) fora.push(buf);
  return fora;
}

const STS = sentencies(sql);
const CODI = STS.join(';\n').toLowerCase();
const funcionsDe = (sts) => sts.flatMap((st) => {
  const m = /^\s*create\s+(?:or\s+replace\s+)?function\s+(public|private)\.([a-zA-Z0-9_]+)\s*\(/i.exec(st);
  if (!m) return [];
  const cosA = st.search(/\bas\s+\$/i);
  return [{esquema: m[1], nom: m[2], capcalera: (cosA === -1 ? st : st.slice(0, cosA)).toLowerCase(), st}];
});
const FUNCIONS = funcionsDe(STS);
const STS_CANONICA = sentencies(sqlCanonica);
const FUNCIONS_VIGENTS = funcionsDe([...STS, ...STS_CANONICA]);
const subjecteVigent = () => FUNCIONS_VIGENTS.filter((f) => f.nom === 'xat_subjecte').at(-1);
const funcio = (nom) => {
  const f = FUNCIONS.find((x) => x.nom === nom);
  assert.ok(f, `${nom} absent`);
  return f;
};
/* Els tipus que es GUARDEN: la llista del client sense els àlies. */
const GUARDATS = [...TIPUS_SUBJECTE_XAT.comunitat, ...TIPUS_SUBJECTE_XAT.grup].filter((t) => t !== 'organitzacio');

/* Les tres funcions que esta migració redefinix d'altres: han de ser la
   darrera versió LITERAL més una sola condició, amb els mateixos permisos. La
   comparació es fa sense comentaris i amb els espais reduïts a un. */
const normalitza = (text) => text.replace(/--[^\n]*/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
const REDEFINIDES = Object.freeze([
  {
    nom: 'xat_participant_vigent',
    origen: 'supabase/migrations/2609272200_xat_entitats.sql',
    clausula: "and (f.subjecte_tipus is null or f.subjecte_tipus not in ('entitat', 'grup') "
      + "or exists (select 1 from public.organizations so "
      + "where so.id = (case when f.subjecte_tipus in ('entitat', 'grup') then f.subjecte_id::uuid end) "
      + "and (so.visibility = 'public' or exists (select 1 from public.organization_memberships sm "
      + 'where sm.organization_id = so.id and sm.user_id = p_usuari_id))))'
  },
  {
    nom: 'xat_pot_veure_participant',
    origen: 'supabase/migrations/2609272200_xat_entitats.sql',
    clausula: 'and (p_usuari_id = (select auth.uid()) or not exists (select 1 from public.xat_fils sf '
      + 'where sf.id = p_fil_id and sf.subjecte_tipus is not null))'
  },
  {
    nom: 'purga_una_baixa',
    origen: 'supabase/migrations/2609261500_identitat_perfil_f1.sql',
    clausula: 'and f.subjecte_tipus is null'
  }
]);
const COPIES = new Set(REDEFINIDES.map((r) => r.nom));

// ── Transacció i capçalera ────────────────────────────────────────────────────
test('una sola transacció amb temps d’espera, com les migracions recents, i reload de PostgREST', () => {
  assert.equal(STS[0].trim().toLowerCase(), 'begin');
  assert.match(STS[1], /^\s*set local lock_timeout = '5s'\s*$/i);
  assert.match(STS[2], /^\s*set local statement_timeout = '120s'\s*$/i);
  assert.match(STS.at(-2), /^\s*notify pgrst, 'reload schema'\s*$/i);
  assert.equal(STS.at(-1).trim().toLowerCase(), 'commit');
});

test('la capçalera diu que no està aplicada, en nomena les dependències i avisa que no hi ha moderació', () => {
  assert.match(capcalera, /NO aplicada/);
  assert.ok(capcalera.includes('2609270200_xat_f0_fonament.sql'), 'no nomena F0');
  assert.ok(capcalera.includes('2609272200_xat_entitats.sql'), 'no nomena xat_entitats');
  assert.match(capcalera, /TAMPOC no estan aplicades/);
  assert.match(capcalera, /MODERACIÓ: NO N'HI HA/);
  assert.match(capcalera, /ABANS D'OBRIR ELS FILS DE PÀGINA A TOT EL POBLE/);
  for (const codi of ['SDP-XAT-011', 'SDP-XAT-012', 'SDP-XAT-013']) {
    assert.ok(capcalera.includes(codi), `${codi} absent de la capçalera`);
    assert.ok(CODI.includes(codi.toLowerCase()), `${codi} absent del codi`);
  }
});

test('cap raise propi porta dades: només codi i frase fixa (la purga copiada conserva els seus)', () => {
  const propi = STS.filter((st) => !funcionsDe([st]).some((f) => COPIES.has(f.nom))).join(';\n');
  const raises = [...propi.matchAll(/raise\s+(?:exception|notice)\s+'([^']*(?:''[^']*)*)'([^;]*);/gi)];
  assert.ok(raises.length >= 8);
  for (const [, missatge, resta] of raises) {
    assert.match(missatge, /^SDP-XAT-\d{3}: /, `raise sense codi: ${missatge}`);
    assert.doesNotMatch(missatge, /%/, `raise amb interpolació: ${missatge}`);
    assert.doesNotMatch(resta, /\b(new|old|p_text|v_text|p_id|v_id)\b/i, `raise que arrossega dades: ${resta}`);
  }
});

// ── Esquema additiu ──────────────────────────────────────────────────────────
test('les cinc columnes del subjecte són text, additives i sense clau forana', () => {
  for (const col of ['subjecte_tipus', 'subjecte_id', 'subjecte_ruta', 'subjecte_titol', 'subjecte_uri']) {
    assert.match(CODI, new RegExp(`alter table public\\.xat_fils\\s+add column if not exists ${col} text;`), `${col} absent`);
  }
  assert.equal((CODI.match(/add column/g) ?? []).length, (CODI.match(/add column if not exists/g) ?? []).length);
  assert.doesNotMatch(CODI, /subjecte_\w+ text references/);
  assert.doesNotMatch(CODI, /drop column|drop table|create table|truncate/);
});

test('el CHECK de llista blanca és el mateix que el del client, sense notes ni res privat', () => {
  const m = /add constraint xat_fils_subjecte_tipus_valid check \(subjecte_tipus in\s*\(([^)]*)\)\)/.exec(CODI);
  assert.ok(m, 'CHECK de llista blanca absent');
  const llista = [...m[1].matchAll(/'([a-z]+)'/g)].map((x) => x[1]);
  assert.deepEqual([...llista].sort(), [...GUARDATS].sort());
  for (const privat of ['nota', 'carpeta', 'categoria', 'etiqueta', 'persona', 'ia', 'organitzacio']) {
    assert.ok(!llista.includes(privat), `${privat} no pot tindre xat`);
  }
  assert.match(CODI, /drop constraint if exists xat_fils_subjecte_tipus_valid/);
  assert.match(CODI, /drop constraint if exists xat_fils_subjecte_coherent/);
});

test('coherència: subjecte i id van junts, només comunitat/canal/grup i la comunitat només per a entitat o poble', () => {
  const st = STS.find((s) => /add constraint xat_fils_subjecte_coherent/i.test(s));
  assert.ok(st, 'CHECK de coherència absent');
  assert.match(st, /\(subjecte_tipus is null\) = \(subjecte_id is null\)/);
  assert.match(st, /tipus in \('comunitat', 'canal', 'grup'\)/);
  assert.match(st, /tipus = 'grup' or subjecte_tipus in \('entitat', 'poble'\)/);
  assert.match(st, /subjecte_uri like 'https:\/\/%'/);
  assert.match(st, /subjecte_ruta not like '\/\/%'/);
  /* La clau d'una organització és el seu uuid: xat_participant_vigent la llig com a tal. */
  assert.match(st, /subjecte_tipus not in \('entitat', 'grup'\)\s+or subjecte_id ~ '\^\[0-9a-f\]\{8\}-/);
});

test('índex únic parcial per poble, subjecte i tipus de fil', () => {
  assert.match(CODI, /create unique index if not exists xat_fils_subjecte_uq\s+on public\.xat_fils \(tenant_id, subjecte_tipus, subjecte_id, tipus\)\s+where subjecte_tipus is not null/);
});

// ── Funcions i permisos ──────────────────────────────────────────────────────
test('tota funció és security definer amb search_path buit a la capçalera', () => {
  assert.deepEqual(FUNCIONS.map((f) => f.nom), [
    'xat_subjecte', 'xat_fil_de_pagina_visible', 'xat_fil_del_subjecte', 'obri_fil_de_pagina',
    'xat_llig_fil_de_pagina', 'xat_entra_al_fil_de_pagina', 'xat_canal_nomes_admins',
    'xat_participant_vigent', 'xat_pot_veure_participant', 'xat_fils_meus', 'purga_una_baixa'
  ]);
  for (const f of FUNCIONS) {
    assert.ok(f.capcalera.includes('security definer'), `${f.esquema}.${f.nom} no és security definer`);
    assert.ok(f.capcalera.includes("set search_path = ''"), `${f.esquema}.${f.nom} sense search_path buit`);
    assert.match(f.capcalera, /language (plpgsql|sql)\b/);
  }
});

test('revoke just després de cada funció; les RPC públiques a authenticated, les privades a ningú', () => {
  /* La funció de la política de RLS l'ha de poder executar authenticated, com a 2609272200. */
  const DE_POLITICA = new Set(['xat_pot_veure_participant']);
  for (const f of FUNCIONS) {
    const idx = STS.indexOf(f.st);
    const seguent = (STS[idx + 1] ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
    const privat = f.esquema === 'private' && !DE_POLITICA.has(f.nom);
    assert.match(seguent, new RegExp(`^revoke execute on function ${f.esquema}\\.${f.nom}\\([^)]*\\) from public, anon${privat ? ', authenticated' : ''}$`),
      `${f.esquema}.${f.nom}: la sentència següent és ${seguent.slice(0, 90)}`);
    const grant = (STS[idx + 2] ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
    if (privat) assert.doesNotMatch(grant, new RegExp(`grant execute on function private\\.${f.nom}`));
    else assert.match(grant, new RegExp(`^grant execute on function ${f.esquema}\\.${f.nom}\\([^)]*\\) to authenticated$`));
  }
  assert.deepEqual(FUNCIONS.filter((f) => f.esquema === 'public').map((f) => f.nom).sort(),
    ['obri_fil_de_pagina', 'xat_entra_al_fil_de_pagina', 'xat_fils_meus', 'xat_llig_fil_de_pagina']);
});

test('la signatura del revoke coincidix amb la de la funció', () => {
  for (const f of FUNCIONS) {
    const params = /\(([^)]*)\)/.exec(f.st.slice(f.st.search(/\(/)))[1]
      .split(',').map((p) => p.trim()).filter(Boolean)
      .map((p) => p.replace(/\s+default\s+.*$/i, '').split(/\s+/).slice(1).join(' ').toLowerCase())
      .join(', ');
    const revoke = STS[STS.indexOf(f.st) + 1].toLowerCase().replace(/\s+/g, ' ');
    assert.equal(/\(([^)]*)\)/.exec(revoke)[1].trim(), params, `${f.nom}`);
  }
});

test('les RPC que canvien de forma es tornen a crear amb drop previ (idempotència)', () => {
  for (const firma of ['public.obri_fil_de_pagina(uuid, text, text, text)', 'public.xat_llig_fil_de_pagina(uuid, bigint, bigint, integer)',
    'public.xat_entra_al_fil_de_pagina(uuid)', 'public.xat_fils_meus(uuid)',
    /* La forma de l'esborrany, amb p_ruta: sense el drop, PostgREST tindria dos candidats (PGRST203). */
    'public.obri_fil_de_pagina(uuid, text, text, text, text)', 'private.xat_subjecte(uuid, text, text, text)']) {
    assert.ok(CODI.includes(`drop function if exists ${firma}`), `${firma} sense drop previ`);
  }
});

// ── Comportament de les RPC ──────────────────────────────────────────────────
test('private.xat_subjecte: mai notes i organitzacions de membres només per a membres', () => {
  const f = funcio('xat_subjecte');
  assert.match(f.capcalera, /xat_subjecte\(p_tenant_id uuid, p_tipus text, p_id text\)/);
  assert.match(f.capcalera, /returns table \(clau text, titol text, org_id uuid, ruta text\)/);
  assert.match(f.st, /s\.section_id = case p_tipus when 'publicacio' then 'mur' when 'producte' then 'mercat'/i);
  assert.doesNotMatch(f.st, /'notes'/);
  assert.match(f.st, /o\.visibility = 'public' or private\.is_organization_member\(o\.id\)/i);
  assert.match(f.st, /o\.tenant_id = p_tenant_id/i);
});

test('la llista vigent de pàgines després d’història + correcció és exactament la del client', () => {
  const f = subjecteVigent();
  assert.ok(f, 'resolutor vigent absent');
  const parells = [...f.st.matchAll(/\('(\/[a-z]+)', '((?:[^']|'')*)'\)/g)].map(([, cami, nom]) => [cami, nom.replace(/''/g, "'")]);
  assert.deepEqual(Object.fromEntries(parells), {...PAGINES_AMB_XAT});
  assert.equal(parells.length, Object.keys(PAGINES_AMB_XAT).length, 'rutes repetides');
  assert.match(f.st, /\) as pg \(cami, nom\)\s+where pg\.cami = case when p_id = '\/ia' then '\/iaia' else p_id end;/);
  /* Cap ruta privada ni cap prefix: la llista és de rutes senceres. */
  for (const [cami] of parells) {
    assert.doesNotMatch(cami, /^\/(notes|gent|perfil|el-meu-perfil|xat|control|consola|connectar|registre|admin|e)(\/|$)/);
  }
  assert.doesNotMatch(CODI, /p_ruta/, 'la ruta del client ja no entra enlloc');
});

test('la ruta del subjecte la deriva el servidor amb els mateixos prefixos que rutaDeSubjecte', () => {
  const f = funcio('xat_subjecte');
  const prefixos = [...f.st.matchAll(/when '([a-z]+)' then '(\/[a-z]+\/)'/g)].map(([, tipus, prefix]) => [tipus, prefix]);
  assert.deepEqual(prefixos.map(([tipus]) => tipus).sort(), GUARDATS.filter((t) => t !== 'pagina').sort());
  for (const [tipus, prefix] of prefixos) assert.equal(rutaDeSubjecte(tipus, 'clau-1._~'), `${prefix}clau-1._~`, tipus);
  /* Una clau que caldria codificar es queda sense ruta, a les dos bandes. */
  assert.match(f.st, /when v_tram !~ '\^\[A-Za-z0-9\._~-\]\{1,200\}\$' then null/);
  for (const clau of ['a b', 'a/b', 'a%2Fb', 'x'.repeat(201)]) assert.equal(rutaDeSubjecte('publicacio', clau), null, clau);
  assert.match(f.st, /when p_tipus = 'pagina' then v_clau/);
  /* El tram de la ruta és la clau, excepte un poble de towns: el seu slug, com /pobles/:id. */
  assert.match(f.st, /select t\.id::text, t\.name::text, coalesce\(t\.slug, t\.id::text\) into v_clau, v_titol, v_tram/);
  assert.match(f.st, /v_tram := coalesce\(v_tram, v_clau\);/);
  assert.match(f.st, /when 'multimedia' then '\/multimedia\/' end\) \|\| v_tram/);
});

test('obri_fil_de_pagina valida, bloqueja per subjecte, troba o crea i NO fa participant a qui l’obri', () => {
  const f = funcio('obri_fil_de_pagina');
  assert.match(f.capcalera, /obri_fil_de_pagina\(p_tenant_id uuid, p_tipus text, p_id text,\s+p_titol text default null\)/);
  assert.match(f.st, /private\.is_town_member\(p_tenant_id\)[\s\S]*SDP-XAT-003/);
  assert.match(f.st, /SDP-XAT-012/);
  assert.match(f.st, /from private\.xat_subjecte\(p_tenant_id, v_tipus, v_id\) s;\s+if v_clau is null then\s+raise exception 'SDP-XAT-013/);
  assert.match(f.st, /if v_tipus = 'organitzacio' then\s+v_tipus := 'entitat';/);
  assert.match(f.st, /pg_advisory_xact_lock\(hashtextextended\('xat:subjecte:'/);
  assert.match(f.st, /'comunitat', null, v_titol[\s\S]*'canal', v_comunitat, 'Avisos'[\s\S]*'grup', v_comunitat, 'General'/);
  /* El títol del client només per al fil d'un contingut sense títol; mai per a subjecte_titol. */
  assert.match(f.st, /v_titol := coalesce\(v_titol_srv, left\(nullif\(btrim\(p_titol\), ''\), 100\), left\(v_clau, 100\)\);/);
  const creacions = [...f.st.matchAll(/private\.xat_fil_del_subjecte\(([^;]*?)\);/g)];
  assert.equal(creacions.length, 4, 'comunitat, Avisos, General i grup');
  for (const crida of creacions) {
    assert.match(crida[1], /v_ruta, v_titol_srv, v_uri$/, 'el subjecte es guarda amb dades del servidor');
  }
  /* Un fil que ja existia es completa: la URI i el títol no els fixa qui l'obri primer. */
  assert.match(f.st, /update public\.xat_fils f\s+set subjecte_ruta = v_ruta,\s+subjecte_uri = coalesce\(v_uri, f\.subjecte_uri\),\s+subjecte_titol = coalesce\(v_titol_srv, f\.subjecte_titol\)\s+where f\.id in \(v_comunitat, v_canal, v_desti\)/);
  /* Cap alta de qui obri: les úniques altes són dels gestors de l'entitat. */
  const altes = [...f.st.matchAll(/insert into public\.xat_participants[\s\S]*?;/gi)].map((m) => m[0]);
  assert.equal(altes.length, 1);
  assert.doesNotMatch(altes[0], /v_jo/);
  assert.match(altes[0], /om\.role in \('owner', 'admin'\)/);
  assert.match(f.capcalera, /participant boolean, rol text, desti boolean/);
  assert.match(f.st, /jo\.usuari_id is not null and jo\.visible_fins_seq is null and private\.xat_participant_vigent\(f\.id, v_jo\)/);
});

test('el fil de pàgina naix sense creador i el canal diu qui hi escriu', () => {
  const f = funcio('xat_fil_del_subjecte');
  assert.match(f.st, /values \(p_tenant_id, p_titol, null, p_tipus/i);
  assert.match(f.st, /when p_tipus = 'canal' then '\{"escriuen": "administradors"\}'::jsonb/);
});

test('xat_llig_fil_de_pagina llig sense ser-ne participant, dins del poble i del subjecte visible', () => {
  const f = funcio('xat_llig_fil_de_pagina');
  assert.match(f.st, /if not private\.xat_fil_de_pagina_visible\(p_fil_id\) then\s+raise exception 'SDP-XAT-006/);
  assert.doesNotMatch(f.st, /es_participant|xat_participant_vigent|xat_participants/);
  assert.match(f.st, /v_limit < 1 or v_limit > 100[\s\S]*SDP-XAT-009/);
  assert.match(f.st, /m\.caduca_al is null or m\.caduca_al > now\(\)/);
  assert.match(f.capcalera, /cos\s+text/);
  /* Un missatge signat per l'entitat no diu a un visitant qui de l'equip l'ha escrit. */
  assert.match(f.st, /m\.seq,\s+case when m\.com_org_id is not null then null else m\.usuari_id end as usuari_id,\s+coalesce\(o\.name/);
  assert.doesNotMatch(f.st, /m\.seq,\s+m\.usuari_id,/);
  const visible = funcio('xat_fil_de_pagina_visible');
  assert.match(visible.st, /private\.is_town_member\(f\.tenant_id\)/);
  assert.match(visible.st, /private\.xat_subjecte\(f\.tenant_id, f\.subjecte_tipus, f\.subjecte_id\)/);
});

test('xat_entra_al_fil_de_pagina és l’alta, idempotent i amb tota la història, només en un grup de pàgina', () => {
  const f = funcio('xat_entra_al_fil_de_pagina');
  assert.match(f.st, /v_tipus is distinct from 'grup' or not private\.xat_fil_de_pagina_visible\(p_fil_id\)/);
  assert.match(f.st, /insert into public\.xat_participants \(fil_id, usuari_id, rol, visible_des_de_seq\)\s+select x\.fil, v_jo, 'membre', 0/);
  assert.match(f.st, /on conflict \(fil_id, usuari_id\) do nothing/);
  assert.match(f.st, /c\.id = v_comunitat or \(c\.comunitat_id = v_comunitat and c\.tipus = 'canal'\)/);
});

test('la comunitat no té missatges i als Avisos només hi escriuen els administradors, abans de numerar', () => {
  const f = funcio('xat_canal_nomes_admins');
  assert.match(f.capcalera, /returns trigger/);
  assert.match(f.st, /v_tipus = 'comunitat' then\s+raise exception 'SDP-XAT-011/);
  assert.match(f.st, /p\.rol in \('propietari', 'admin'\) or p\.com_org_id is not null/);
  /* Els BEFORE s'executen per ordre de nom: el rebuig ha d'anar abans del
     disparador de numeració de F0. Els noms es lligen dels dos fitxers. */
  const BEFORE = /create trigger (\w+) before insert on public\.xat_missatges/gi;
  const nostres = [...sql.matchAll(BEFORE)].map((m) => m[1]);
  const deF0 = [...llig('supabase/migrations/2609270200_xat_f0_fonament.sql').matchAll(BEFORE)].map((m) => m[1]);
  assert.deepEqual(nostres, ['xat_missatges_canal']);
  assert.equal(deF0.length, 1, 'F0 ha de tindre un sol BEFORE INSERT, el de numeració');
  assert.ok(nostres[0] < deF0[0], `${nostres[0]} s'executaria després de ${deF0[0]}`);
  assert.match(CODI, new RegExp(`create trigger ${nostres[0]} before insert on public\\.xat_missatges\\s+for each row execute function private\\.xat_canal_nomes_admins\\(\\)`));
});

// ── Redefinicions d'altres migracions ────────────────────────────────────────
for (const {nom, origen, clausula} of REDEFINIDES) {
  test(`${nom} és la de ${path.basename(origen)} literal més una sola condició, amb els mateixos permisos`, () => {
    const altres = sentencies(llig(origen));
    const original = funcionsDe(altres).filter((f) => f.nom === nom).at(-1);
    assert.ok(original, `${nom} absent de ${origen}`);
    const meua = funcio(nom);
    const n = normalitza(meua.st);
    assert.equal(n.split(clausula).length, 2, `la condició de ${nom} hi ha de ser una vegada`);
    assert.equal(n.replace(` ${clausula}`, ''), normalitza(original.st));
    /* Revoke i grant idèntics als de l'original. */
    const permisos = (sts, st) => {
      const i = sts.indexOf(st);
      return sts.slice(i + 1, i + 3).map(normalitza).filter((s) => /^(revoke|grant) execute on function /.test(s)
        && s.includes(`.${nom}(`));
    };
    assert.deepEqual(permisos(STS, meua.st), permisos(altres, original.st));
  });
}

test('en un fil de pàgina, cadascú veu només la seua fila de participant', () => {
  const f = funcio('xat_pot_veure_participant');
  assert.match(f.st, /p_usuari_id = \(select auth\.uid\(\)\) or not exists \(select 1 from public\.xat_fils sf\s+where sf\.id = p_fil_id and sf\.subjecte_tipus is not null\)/);
  /* La política que la usa és la de 2609272200: no se'n crea cap de nova. */
  assert.match(llig('supabase/migrations/2609272200_xat_entitats.sql'),
    /create policy "xat_participants_lectura"[\s\S]*?using \(private\.xat_pot_veure_participant\(fil_id, usuari_id\)\)/);
});

test('la purga d’una baixa no esborra els fils de pàgina', () => {
  const f = funcio('purga_una_baixa');
  assert.match(f.st, /delete from public\.xat_fils f\s+where f\.creat_per is null\s+and f\.subjecte_tipus is null\s+and not exists/);
});

test('xat_fils_meus v4 torna la comunitat, el subjecte, el rol i el recompte, i no llista persones als fils de pàgina', () => {
  const f = funcio('xat_fils_meus');
  for (const col of ['comunitat_id uuid', 'subjecte_tipus text', 'subjecte_id text', 'subjecte_ruta text',
    'subjecte_titol text', 'subjecte_uri text', 'rol text', 'participants integer', 'altres jsonb', 'org_id uuid']) {
    assert.ok(f.capcalera.includes(col), `${col} absent del returns table`);
  }
  assert.match(f.st, /and f\.subjecte_tipus is null\s+\) c/);
  assert.match(f.st, /private\.xat_participant_vigent\(f\.id, \(select auth\.uid\(\)\)\)/);
});

test('cap política, cap grant de taula i cap escriptura directa nova', () => {
  assert.doesNotMatch(CODI, /create policy/);
  assert.doesNotMatch(CODI, /grant\s+(select|insert|update|delete)\b/);
});

// ── Documentació i higiene ───────────────────────────────────────────────────
test('el README llista la migració després de perfil_emoticona, amb els codis i la condició de moderació', () => {
  const nova = readme.indexOf('`migrations/2609282100_xat_de_pagina.sql`');
  assert.ok(nova > readme.indexOf('`migrations/2609282035_perfil_emoticona.sql`'), 'fora d’ordre o absent');
  for (const text of ['SDP-XAT-011', 'SDP-XAT-012', 'SDP-XAT-013', 'obri_fil_de_pagina', 'xat_llig_fil_de_pagina',
    'xat_entra_al_fil_de_pagina', 'url_publica_node', 'moderació', 'PAGINES_AMB_XAT', 'xat_participant_vigent',
    'xat_pot_veure_participant', 'purga_una_baixa']) {
    assert.ok(readme.includes(text), `${text} absent del README`);
  }
});

test('higiene de fitxer: una sola línia buida final i cap vocabulari prohibit', () => {
  assert.ok(sql.endsWith('\n'));
  assert.ok(!sql.endsWith('\n\n'));
  assert.doesNotMatch(sql, /offline-first|local-first/i);
});


// ── Correcció posterior: la història es conserva, la versió vigent canvia ──
test('la correcció és una transacció posterior amb bloqueig, esperes i reload', () => {
  assert.equal(STS_CANONICA[0].trim().toLowerCase(), 'begin');
  assert.match(STS_CANONICA[1], /^\s*set local lock_timeout = '5s'\s*$/i);
  assert.match(STS_CANONICA[2], /^\s*set local statement_timeout = '120s'\s*$/i);
  assert.match(STS_CANONICA[3], /^\s*lock table public\.xat_fils in share row exclusive mode\s*$/i);
  assert.match(STS_CANONICA.at(-2), /^\s*notify pgrst, 'reload schema'\s*$/i);
  assert.equal(STS_CANONICA.at(-1).trim().toLowerCase(), 'commit');
  const header = sqlCanonica.slice(0, sqlCanonica.indexOf('begin;'));
  assert.match(header, /NO aplicada/);
  assert.ok(header.includes(path.basename(MIGRACIO)));
  assert.match(header, /moderació/);
});

test('el resolutor nou conserva totes les autoritzacions i només canvia la clau i l’àlies exacte', () => {
  const original = funcio('xat_subjecte');
  assert.match(original.st, /\('\/ia', 'L''ànima de la iaia'\)/, 'la història no es reescriu');
  const expected = original.st
    .replace("('/ia', 'L''ànima de la iaia')", "('/iaia', 'L''ànima de la iaia')")
    .replace('where pg.cami = p_id;', "where pg.cami = case when p_id = '/ia' then '/iaia' else p_id end;");
  assert.equal(normalitza(subjecteVigent().st), normalitza(expected));
  const noves = funcionsDe(STS_CANONICA);
  assert.deepEqual(noves.map((f) => `${f.esquema}.${f.nom}`), ['private.xat_subjecte']);
  assert.match(noves[0].capcalera, /security definer set search_path = ''/);
  const revoke = STS_CANONICA[STS_CANONICA.indexOf(noves[0].st) + 1];
  assert.match(revoke, /^\s*revoke execute on function private\.xat_subjecte\(uuid, text, text\) from public, anon, authenticated\s*$/i);
  assert.doesNotMatch(STS_CANONICA.join(';\n'), /create policy|grant\s|create.*function public\./i);
});

test('la identitat canònica arriba a la RPC abans del seu bloqueig i la cerca del fil existent', () => {
  const vigent = subjecteVigent();
  assert.match(vigent.st, /select pg\.cami, pg\.nom into v_clau, v_titol/);
  assert.match(vigent.st, /where pg\.cami = case when p_id = '\/ia' then '\/iaia' else p_id end;/);
  assert.match(vigent.st, /when p_tipus = 'pagina' then v_clau/);
  const obri = funcio('obri_fil_de_pagina').st;
  assert.ok(obri.indexOf('from private.xat_subjecte(') < obri.indexOf('pg_advisory_xact_lock('));
  assert.match(obri, /hashtextextended\('xat:subjecte:' \|\| p_tenant_id::text \|\| ':' \|\| v_tipus \|\| ':' \|\| v_clau, 0\)/);
  assert.match(funcio('xat_fil_del_subjecte').st, /f\.subjecte_id = p_subjecte_id and f\.tipus = p_tipus/);
  assert.doesNotMatch(vigent.st, /where pg\.cami like|where pg\.cami ilike|p_ruta/i);
});

test('dos fils antics i canònics avorten abans d’actualitzar, sense fusionar històries', () => {
  const guard = STS_CANONICA.find((st) => /^\s*do \$\$/i.test(st));
  const update = STS_CANONICA.find((st) => /^\s*update public\.xat_fils f/i.test(st));
  assert.ok(guard && update, 'guàrdia i actualització necessàries');
  assert.ok(STS_CANONICA.indexOf(guard) < STS_CANONICA.indexOf(update));
  assert.match(guard, /f\.subjecte_tipus = 'pagina' and f\.subjecte_id in \('\/ia', '\/iaia'\)/);
  assert.match(guard, /group by f\.tenant_id, f\.tipus\s+having count\(\*\) > 1/);
  assert.match(guard, /raise exception 'SDP-XAT-014: hi ha dos fils per a la pàgina canònica\.' using errcode = '23505';/);
  assert.doesNotMatch(guard, /exception when|raise notice|%/i);
  assert.doesNotMatch(STS_CANONICA.join(';\n'), /delete from|truncate|drop table|insert into|xat_missatges|xat_participants/i);
});

test('la migració canvia només metadades del subjecte i conserva id, seq, participants i autoria', () => {
  const updates = STS_CANONICA.filter((st) => /^\s*update /i.test(st));
  assert.equal(updates.length, 1);
  const update = updates[0];
  assert.match(update, /where f\.subjecte_tipus = 'pagina' and f\.subjecte_id in \('\/ia', '\/iaia'\)/i);
  const changed = [...update.matchAll(/(?:\bset|,)\s*([a-z_]+)\s*=/gi)].map((m) => m[1]);
  assert.deepEqual(changed, ['subjecte_id', 'subjecte_ruta', 'subjecte_titol', 'subjecte_uri']);
  assert.match(update, /set subjecte_id = '\/iaia',\s+subjecte_ruta = '\/iaia',\s+subjecte_titol = 'L''ànima de la iaia'/);
  assert.match(update, /f\.subjecte_uri like 'https:\/\/%\/ia'/);
  assert.match(update, /char_length\(f\.subjecte_uri\) <= 598\s+then regexp_replace\(f\.subjecte_uri, '\/ia\$', '\/iaia'\) else null end/);
  assert.match(update, /else f\.subjecte_uri end/);
  assert.match(update, /and \(f\.subjecte_id is distinct from '\/iaia'/, 'idempotent: només les files divergents');
});

test('el CHECK impedeix recrear /ia encara que una RPC antiga estiga en vol', () => {
  const drop = STS_CANONICA.find((st) => /drop constraint if exists xat_fils_pagina_iaia_canonica/i.test(st));
  const add = STS_CANONICA.find((st) => /add constraint xat_fils_pagina_iaia_canonica/i.test(st));
  assert.ok(drop && add);
  assert.ok(STS_CANONICA.indexOf(drop) < STS_CANONICA.indexOf(add));
  assert.match(add, /check \(\s*subjecte_tipus is distinct from 'pagina' or subjecte_id is distinct from '\/ia'\s*\)/i);
  assert.doesNotMatch(add, /not valid/i);
  assert.ok(STS_CANONICA.indexOf(add) < STS_CANONICA.indexOf(subjecteVigent().st));
});

/* Les capçaleres dels SQL es conserven tal com es van aplicar; l'estat viu
   el porta el README. El Mestre va aplicar la cadena al node remot el 261009. */
const APLICADA = 'Aplicada al node remot pel Mestre el 261009';

test('el README documenta dependència, àlies, identitat estable i conflicte, i que ja està aplicada', () => {
  const entry = readme.indexOf(`\`migrations/${path.basename(CANONICA)}\``);
  assert.ok(entry > readme.indexOf(`\`migrations/${path.basename(MIGRACIO)}\``));
  const docs = readme.slice(entry, readme.indexOf('- `seed.sql`', entry));
  for (const text of ['/iaia', '/ia', 'SDP-XAT-014', 'id', 'missatges', 'participants']) {
    assert.ok(docs.includes(text), `${text} absent`);
  }
  for (const migracio of [MIGRACIO, CANONICA]) {
    const posicio = readme.indexOf(`\`migrations/${path.basename(migracio)}\``);
    const entrada = readme.slice(posicio).split('\n\n')[0].replace(/\s+/g, ' ');
    assert.ok(entrada.includes(APLICADA), `${path.basename(migracio)}: falta l'estat aplicat`);
    assert.ok(!/NO aplicada|No està aplicada/.test(entrada), `${path.basename(migracio)}: encara es diu pendent`);
  }
  assert.ok(sqlCanonica.endsWith('\n') && !sqlCanonica.endsWith('\n\n'));
});


// ── Convergència del node remot (F6, Onada 5): cap còpia de la funció ─────────
/* El 404 de POST /rest/v1/rpc/obri_fil_de_pagina es cura aplicant la cadena
   pendent; la convergència només comprova, esborra sobrecàrregues i torna a
   donar permisos. Si definira la funció, en faria una segona font. */
const CONVERGENCIA = 'supabase/migrations/2610090100_convergencia_xat_de_pagina.sql';
const sqlConvergencia = llig(CONVERGENCIA);
const STS_CONVERGENCIA = sentencies(sqlConvergencia);
const CODI_CONVERGENCIA = STS_CONVERGENCIA.join(';\n').toLowerCase();
const capcaleraConvergencia = sqlConvergencia.slice(0, sqlConvergencia.indexOf('begin;'));
const FIRMA = 'public.obri_fil_de_pagina(uuid, text, text, text)';
const MIGRACIONS = fs.readdirSync(path.join(REPO, 'supabase/migrations')).filter((f) => f.endsWith('.sql')).sort();
/* El codi d'una migració, sense comentaris i en minúscules, pel prefix de versió. */
const codiDeVersio = (versio) => {
  const nom = MIGRACIONS.find((f) => f.startsWith(`${versio}_`));
  assert.ok(nom, `cap migració ${versio}`);
  return sentencies(llig(`supabase/migrations/${nom}`)).join(';\n').toLowerCase();
};
const espais = (text) => text.replace(/\s+/g, ' ');
/* Les cinc consultes de lectura, a la capçalera i al README. */
const DIAGNOSTIC = [
  "pg_catalog.pg_proc where proname = 'obri_fil_de_pagina'",
  'select version from supabase_migrations.schema_migrations',
  "table_schema = 'public' and table_name = 'xat_fils'",
  "has_function_privilege('authenticated', p.oid, 'execute')",
  "pg_catalog.pg_constraint where conname = 'xat_fils_pagina_iaia_canonica'"
];

test('la convergència no crea ni redefinix cap funció, ni toca taules o polítiques', () => {
  assert.deepEqual(funcionsDe(STS_CONVERGENCIA), []);
  assert.doesNotMatch(CODI_CONVERGENCIA, /create\s+(or\s+replace\s+)?function/);
  assert.doesNotMatch(CODI_CONVERGENCIA, /drop function (if exists )?public\.obri_fil_de_pagina/, 'la canònica no s’esborra mai');
  assert.doesNotMatch(CODI_CONVERGENCIA, /create (table|policy|index|unique index|trigger)|alter table|drop table|truncate|insert into|update public\.|delete from/);
});

test('la convergència és una transacció amb esperes, recarrega PostgREST i acaba amb commit', () => {
  assert.equal(STS_CONVERGENCIA[0].trim().toLowerCase(), 'begin');
  assert.match(STS_CONVERGENCIA[1], /^\s*set local lock_timeout = '5s'\s*$/i);
  assert.match(STS_CONVERGENCIA[2], /^\s*set local statement_timeout = '60s'\s*$/i);
  assert.match(STS_CONVERGENCIA.at(-2), /^\s*notify pgrst, 'reload schema'\s*$/i);
  assert.equal(STS_CONVERGENCIA.at(-1).trim().toLowerCase(), 'commit');
});

test('la canònica es busca per la signatura exacta de 2609282100 i ha de ser security definer amb search_path buit', () => {
  assert.ok(CODI_CONVERGENCIA.includes(`to_regprocedure('${FIRMA}')`), 'to_regprocedure de la canònica absent');
  assert.ok(CODI.includes(`revoke execute on function ${FIRMA} from public, anon`), 'la firma no és la de 2609282100');
  assert.match(CODI_CONVERGENCIA, /p\.prosecdef\s+and 'search_path=""' = any \(coalesce\(p\.proconfig, '\{\}'::text\[\]\)\)\) then\s+raise exception 'sdp-conv-005: /);
  /* El client envia els noms de la signatura canònica: la deriva no és la causa. */
  const params = /obri_fil_de_pagina\(([^)]*)\)/.exec(funcio('obri_fil_de_pagina').capcalera)[1]
    .split(',').map((p) => p.trim().replace(/\s+default\s+.*$/, '').split(/\s+/));
  assert.equal(params.map(([, tipus]) => tipus).join(', '), /\(([^)]*)\)/.exec(FIRMA)[1]);
  const client = /rpc\('obri_fil_de_pagina', \{([\s\S]*?)\}\)/.exec(llig('src/data/supabase/xat.js'));
  assert.ok(client, 'la crida del client a obri_fil_de_pagina absent');
  assert.deepEqual([...client[1].matchAll(/(p_[a-z_]+):/g)].map((m) => m[1]).sort(), params.map(([nom]) => nom).sort());
});

test('cada dependència que comprova SDP-CONV-004 existix amb eixe nom i eixos tipus a la migració que nomena', () => {
  const DEPENDENCIES = STS_CONVERGENCIA.find((st) => /sdp-conv-004/i.test(st));
  assert.ok(DEPENDENCIES, 'el bloc de dependències absent');
  const codi = DEPENDENCIES.toLowerCase();
  assert.ok(STS_CONVERGENCIA.indexOf(DEPENDENCIES) < STS_CONVERGENCIA.findIndex((st) => /sdp-conv-005/i.test(st)),
    'les dependències es comproven abans que la canònica');
  /* Columnes: (taula, columna, migració) creades per eixa migració. */
  const columnes = [...codi.matchAll(/\('([a-z_]+)', '([a-z_]+)', '(\d{10})'\)/g)];
  assert.ok(columnes.length >= 10, 'massa poques columnes');
  for (const [, taula, columna, versio] of columnes) {
    const origen = codiDeVersio(versio);
    const creada = new RegExp(`alter table public\\.${taula}\\s+add column if not exists ${columna}\\b`).test(origen)
      || new RegExp(`create table if not exists public\\.${taula} \\([^;]*\\b${columna}\\s+\\w`).test(origen);
    assert.ok(creada, `public.${taula}.${columna} no la crea ${versio}`);
  }
  for (const [taula, columna] of [['xat_fils', 'ultim_seq'], ['xat_fils', 'comunitat_id'], ['xat_fils', 'interlocutor_id'],
    ['xat_fils', 'subjecte_tipus'], ['towns', 'slug'], ['organizations', 'logo_url']]) {
    assert.ok(columnes.some(([, t, c]) => t === taula && c === columna), `${taula}.${columna} no es comprova`);
  }
  /* to_regprocedure necessita els tipus exactes: els de les revoke i grant de les migracions. */
  const firmes = [...codi.matchAll(/to_regprocedure\('(private\.[a-z_]+\([^)]*\))'\)/g)].map((m) => m[1]);
  assert.deepEqual(firmes.map((f) => f.slice(0, f.indexOf('('))).sort(), [
    'private.is_organization_member', 'private.is_town_member', 'private.xat_fil_del_subjecte',
    'private.xat_participant_vigent', 'private.xat_subjecte'
  ]);
  const totes = MIGRACIONS.filter((f) => f !== path.basename(CONVERGENCIA))
    .map((f) => espais(sentencies(llig(`supabase/migrations/${f}`)).join(';\n').toLowerCase())).join('\n');
  for (const firma of firmes) assert.ok(totes.includes(`on function ${firma}`), `${firma}: cap migració la definix amb eixos tipus`);
  /* Cada etiqueta «private.x (versió)» del missatge apunta a la migració que la crea. */
  const etiquetes = [...codi.matchAll(/'private\.([a-z_]+) \((\d{10})\)'/g)];
  assert.equal(etiquetes.length, 6);
  for (const [, nom, versio] of etiquetes) {
    assert.match(codiDeVersio(versio), new RegExp(`create (or replace function|table if not exists) private\\.${nom}\\b`),
      `private.${nom} no la crea ${versio}`);
  }
});

test('sense la correcció /iaia avorta amb SDP-CONV-007, amb el CHECK que crea 2610042330', () => {
  assert.match(CODI_CONVERGENCIA, /conrelid = 'public\.xat_fils'::regclass and conname = 'xat_fils_pagina_iaia_canonica'\) then\s+raise exception 'sdp-conv-007: /);
  assert.match(sqlCanonica, /add constraint xat_fils_pagina_iaia_canonica check/);
});

test('les altres sobrecàrregues s’esborren dins del bucle, només funcions i sense CASCADE', () => {
  const bucle = /for v_sobrecarrega in([\s\S]*?)\bloop([\s\S]*?)end loop/.exec(CODI_CONVERGENCIA);
  assert.ok(bucle, 'bucle de sobrecàrregues absent');
  assert.match(bucle[1], /n\.nspname = 'public' and p\.proname = 'obri_fil_de_pagina' and p\.prokind = 'f'\s+and p\.oid <> v_canonica::oid/);
  assert.match(bucle[2], /raise notice 'sdp-conv-006: public\.obri_fil_de_pagina\(%\) no és la canònica i s''esborra\.', v_sobrecarrega\.arguments;/);
  assert.match(bucle[2], /execute format\('drop function public\.%i\(%s\)', v_sobrecarrega\.proname, v_sobrecarrega\.arguments\);/);
  assert.doesNotMatch(CODI_CONVERGENCIA, /cascade/);
  assert.equal((CODI_CONVERGENCIA.match(/drop function/g) ?? []).length, 1, 'un sol drop, el del bucle');
});

test('els permisos són els de 2609282100: revoke de public i anon, grant a authenticated, i cap altre', () => {
  const permisos = (sts) => sts.map(normalitza).filter((s) => /^(revoke|grant)\b/.test(s));
  assert.deepEqual(permisos(STS_CONVERGENCIA), [
    `revoke execute on function ${FIRMA} from public, anon`,
    `grant execute on function ${FIRMA} to authenticated`
  ]);
  const originals = permisos(STS).filter((s) => s.includes('public.obri_fil_de_pagina('));
  assert.deepEqual(permisos(STS_CONVERGENCIA), originals);
});

test('els codis SDP-CONV-004 a 007 són d’esta convergència i el README els cita', () => {
  assert.match(CODI_CONVERGENCIA, /raise exception 'sdp-conv-004: /);
  assert.match(CODI_CONVERGENCIA, /raise exception 'sdp-conv-005: /);
  assert.match(CODI_CONVERGENCIA, /raise notice 'sdp-conv-006: /);
  assert.match(CODI_CONVERGENCIA, /raise exception 'sdp-conv-007: /);
  const nom = `\`migrations/${path.basename(CONVERGENCIA)}\``;
  const posicio = readme.indexOf(nom);
  assert.ok(posicio > readme.indexOf('`migrations/2610081543_xat_consentiment_i_metadades.sql`'), 'fora d’ordre o absent del README');
  const entrada = espais(readme.slice(posicio).split('\n\n')[0]);
  for (const codi of ['SDP-CONV-004', 'SDP-CONV-005', 'SDP-CONV-006', 'SDP-CONV-007']) {
    assert.ok(capcaleraConvergencia.includes(codi), `${codi} absent de la capçalera`);
    assert.ok(entrada.includes(codi), `${codi} absent del README`);
    for (const altra of MIGRACIONS.filter((f) => f !== path.basename(CONVERGENCIA))) {
      assert.ok(!llig(`supabase/migrations/${altra}`).includes(codi), `${codi} repetit a ${altra}`);
    }
  }
  for (const text of [APLICADA, 'Mestre', 'INFERÈNCIA', 'ordre alfabètic', 'moderació', '404', 'PGRST202', '42501', ...DIAGNOSTIC]) {
    assert.ok(entrada.includes(text), `${text} absent del README`);
  }
  assert.doesNotMatch(entrada, /NO aplicada/);
});

test('la capçalera de la convergència diu que no està aplicada, qui l’aplica, l’ordre, la inferència i el diagnòstic', () => {
  const capcalera = espais(capcaleraConvergencia.replace(/^--\s?/gm, ''));
  for (const text of ['NO aplicada', 'Mestre', 'mai un agent', 'ordre alfabètic', 'INFERÈNCIA', 'MODERACIÓ', '404', 'PGRST202',
    '2609270200', '2609272200', '2609282100', '2610042330', ...DIAGNOSTIC]) {
    assert.ok(capcalera.includes(text), `${text} absent de la capçalera`);
  }
  /* S'aplica després de la cadena pendent: l'ordre alfabètic la posa darrere. */
  assert.ok(path.basename(CONVERGENCIA) > path.basename(CANONICA));
  assert.ok(path.basename(CONVERGENCIA) > '2610081543_xat_consentiment_i_metadades.sql');
  assert.ok(sqlConvergencia.endsWith('\n') && !sqlConvergencia.endsWith('\n\n'));
  assert.doesNotMatch(sqlConvergencia, /offline-first|local-first/i);
});
