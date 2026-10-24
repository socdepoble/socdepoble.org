/* P2-08 (pla 261024_1315, T7; auditoria Codex C-04) · Prova estàtica de la
   migració 2610241410_exporta_dades_moderacio.sql. No hi ha cap base de
   dades: es llig el SQL i es comproven la capçalera (NO aplicada, l'aplica el
   Mestre), la transacció, la capçalera i els permisos de la funció, que el cos
   és el de 2609261500 al peu de la lletra amb només sis insercions, el format
   v1 contra l'adaptador compte.js, els filtres per la persona (A/B: cada
   lectura nova filtra per v_uid), la protecció de tercers (qui denuncia, qui
   bloqueja, qui seguix, l'empremta d'IP i el testimoni d'Apple), les guardes
   to_regclass, la federació intacta, els adjunts i l'àudio sense peu, i
   l'entrada de supabase/README.md. Calcada de moderacio.migracio.test.js.
   Correccions 261024 (revisions R2-02, R3-07 i R2-04): de les denúncies sobre
   tu, només quantes han acabat amb una mesura, i dels seguiments, només els
   vius (deixat_al null). */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from 'vitest';

/* vitest s'executa des de l'arrel del repositori (com qualitat.test.js). */
const ARREL = process.cwd();
const NOM = '2610241410_exporta_dades_moderacio.sql';
const F1 = '2609261500_identitat_perfil_f1.sql';
const ADJUNTS = '2610220240_xat_adjunts_i_quota.sql';
const MIGRACIONS = path.join(ARREL, 'supabase/migrations');
const llig = (fitxer) => readFileSync(path.join(MIGRACIONS, fitxer), 'utf8');
const SQL = llig(NOM);
const SQL_F1 = llig(F1);
const CLIENT = readFileSync(path.join(ARREL, 'src/data/supabase/compte.js'), 'utf8');
const README = readFileSync(path.join(ARREL, 'supabase/README.md'), 'utf8');
/* Sense comentaris de línia: es comprova el codi, no la prosa. */
const senseComentaris = (sql) => sql.split('\n').map((linia) => linia.replace(/--.*$/, '')).join('\n');
const CODI = senseComentaris(SQL);
const CAPCALERA = SQL.slice(0, SQL.search(/^begin;/m));
const SENSE_ESPAIS = (text) => text.replace(/\s+/g, ' ').trim().toLowerCase();
const LINIES = SQL.split('\n');

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
const EXPORTA = FUNCIONS.find((f) => f.esquema === 'public' && f.nom === 'exporta_les_meues_dades');
const COS = EXPORTA?.cos ?? '';
const COS_F1 = funcions(senseComentaris(SQL_F1)).find((f) => f.esquema === 'public' && f.nom === 'exporta_les_meues_dades').cos;

/** La definició crua (comentaris inclosos), de «create or replace» fins a «$$;». */
const definicio = (sql) => {
  const inici = sql.indexOf('create or replace function public.exporta_les_meues_dades()');
  const fi = sql.indexOf('\n$$;', inici);
  expect(inici, 'falta la definició').toBeGreaterThanOrEqual(0);
  expect(fi).toBeGreaterThan(inici);
  return sql.slice(inici, fi + 4).split('\n');
};

/* Les taules noves que llig l'exportació, amb la guarda que les protegix. */
const TAULES_NOVES = ['public.denuncies', 'public.bloquejos', 'private.normes_acceptades', 'public.xat_adjunts', 'public.seguiments', 'private.autoritzacions_apple'];
/** El bloc «if to_regclass('X') is not null then … end if;» del cos (dos espais de sagnat). */
const blocGuardat = (taula) => {
  const inici = COS.indexOf(`  if to_regclass('${taula}') is not null`);
  const fi = COS.indexOf('\n  end if;', inici);
  expect(inici, `falta la guarda de ${taula}`).toBeGreaterThan(0);
  expect(fi).toBeGreaterThan(inici);
  return { inici, fi, text: COS.slice(inici, fi) };
};

test('el nom segueix el format de les migracions i va després de 2610220240 (adjunts)', () => {
  expect(NOM).toMatch(/^\d{10}_[a-z0-9_]+\.sql$/);
  const ordre = readdirSync(MIGRACIONS).filter((f) => f.endsWith('.sql')).sort();
  expect(ordre.indexOf(NOM)).toBeGreaterThan(ordre.indexOf(ADJUNTS));
  expect(ordre.indexOf(NOM)).toBeGreaterThan(ordre.indexOf(F1));
});

test('la capçalera: P2-08, QUÈ FA, QUÈ NO FA, CODIS, Depén de, NO aplicada i l’aplica el Mestre en UNA línia', () => {
  expect(SQL).toMatch(/^-- =+\n-- 261024_1410 · P2-08 \(pla 261024_1315, T7; auditoria Codex C-04\)/);
  for (const apartat of ['QUÈ FA:', 'QUÈ NO FA:', 'CODIS', 'Depén de:']) expect(CAPCALERA, apartat).toContain(apartat);
  expect(CAPCALERA).toMatch(/NO aplicada/);
  expect(CAPCALERA).toContain('SDP-EXPORT-000');
  expect(LINIES.filter((l) => /L'aplica el Mestre, mai un agent/.test(l))).toHaveLength(1);
  expect(LINIES.filter((l) => l === "-- L'aplica el Mestre, mai un agent.")).toHaveLength(1);
});

test('una sola transacció amb temps d’espera curts, i recarrega l’esquema de PostgREST abans del commit', () => {
  expect(CODI.trimStart()).toMatch(/^begin;/i);
  expect((CODI.match(/^\s*begin;\s*$/gim) || []).length).toBe(1);
  expect((CODI.match(/^\s*commit;\s*$/gim) || []).length).toBe(1);
  expect(CODI).toMatch(/begin;\nset local lock_timeout = '5s';\nset local statement_timeout = '60s';/);
  expect(CODI.trimEnd()).toMatch(/notify pgrst, 'reload schema';\s*commit;$/);
});

test('només redefinix l’exportació, amb la capçalera de 2609261500: sense paràmetres, jsonb, stable, definer i search_path buit', () => {
  expect(FUNCIONS.map((f) => `${f.esquema}.${f.nom}`)).toEqual(['public.exporta_les_meues_dades']);
  expect(EXPORTA.params).toBe('');
  expect(EXPORTA.capcalera).toBe("returns jsonb language plpgsql stable security definer set search_path = ''");
  expect(CODI).not.toMatch(/create\s+(table|policy|index|unique index|trigger|view)|alter\s+table|drop\s+/i);
});

test('els permisos: es revoca tot a public, anon, authenticated i service_role i després només authenticated l’executa', () => {
  const revoca = 'revoke all on function public.exporta_les_meues_dades() from public, anon, authenticated, service_role;';
  const dona = 'grant execute on function public.exporta_les_meues_dades() to authenticated;';
  expect(LINIES.filter((l) => l === revoca)).toHaveLength(1);
  expect(LINIES.filter((l) => l === dona)).toHaveLength(1);
  expect(CODI.indexOf(revoca)).toBeGreaterThan(CODI.indexOf('\n$$;'));
  expect(CODI.indexOf(dona)).toBeGreaterThan(CODI.indexOf(revoca));
  /* Cap altre permís: ni de taula ni de cap altra funció. */
  expect([...CODI.matchAll(/^\s*(grant|revoke)\b[^;]*;/gim)].map((m) => m[0].trim())).toEqual([revoca, dona]);
});

test('còpia literal: el cos de 2609261500 hi és sencer i en ordre, amb només sis insercions en llocs coneguts', () => {
  const vella = definicio(SQL_F1);
  const nova = definicio(SQL);
  /* Cada línia de la versió vigent, en el mateix ordre; el que no hi casa és inserció. */
  const insercions = [];
  let j = 0;
  for (const linia of vella) {
    const inici = j;
    while (j < nova.length && nova[j] !== linia) j += 1;
    expect(j, `falta la línia de 2609261500: «${linia}»`).toBeLessThan(nova.length);
    if (j > inici) insercions.push({ davantDe: linia.trim(), linies: nova.slice(inici, j) });
    j += 1;
  }
  expect(j, 'res després de «$$;»').toBe(nova.length);
  expect(insercions.map((i) => i.davantDe)).toEqual([
    'begin',
    'return jsonb_build_object(',
    "'converses', coalesce((",
    "'creada_per_mi', f.creat_per = v_uid) order by f.creat_al)",
    'order by m.creat_al)',
    "'fitxers', v_fitxers,"
  ]);
  /* Cap inserció no torna, no llança cap error ni escriu res. */
  const inserit = insercions.flatMap((i) => i.linies).map((l) => l.replace(/--.*$/, '')).join('\n');
  expect(inserit).not.toMatch(/\breturn\b|\braise\b|\b(insert|update|delete)\b|\bexecute\b|\bperform\b/i);
  /* I, de pas, cap literal de la versió vigent no s'ha perdut. */
  for (const literal of new Set(COS_F1.match(/'[a-z_]+'/g))) expect(COS, literal).toContain(literal);
});

test('el format continua sent el v1 que exigix l’adaptador compte.js', () => {
  const format = /const FORMAT_EXPORTACIO = '([^']+)';/.exec(CLIENT)?.[1];
  expect(format).toBe('socdepoble.exportacio.v1');
  expect(COS).toContain(`'format', '${format}'`);
  expect(CLIENT).toContain("rpc('exporta_les_meues_dades', {}");
});

test('és l’última migració que definix l’exportació', () => {
  const ordre = readdirSync(MIGRACIONS).filter((f) => f.endsWith('.sql')).sort();
  const amb = ordre.filter((f) => /create\s+or\s+replace\s+function\s+public\.exporta_les_meues_dades\b/i.test(senseComentaris(llig(f))));
  expect(amb.at(-1)).toBe(NOM);
  expect(amb).toEqual([F1, NOM]);
});

test('A/B · cada lectura nova filtra per la persona (v_uid), i les de moderació són les de qui actua', () => {
  for (const taula of TAULES_NOVES) {
    const lectures = [...COS.matchAll(new RegExp(`from ${taula.replace('.', '\\.')} (\\w+) where ([^\\n]*)`, 'g'))];
    expect(lectures.length, taula).toBeGreaterThan(0);
    for (const [, alies, condicio] of lectures) {
      expect(condicio, `${taula}: ${condicio}`).toMatch(new RegExp(`^${alies}\\.\\w+ (=|is distinct from) v_uid\\b`));
    }
  }
  expect(COS).toMatch(/from public\.denuncies d where d\.denunciant = v_uid\)/);
  expect(COS).toMatch(/from public\.bloquejos b where b\.bloquejador = v_uid\)/);
  expect(COS).toMatch(/from private\.normes_acceptades n where n\.usuari_id = v_uid\)/);
  expect(COS).toMatch(/from public\.xat_adjunts a where a\.usuari_id = v_uid;/);
  /* Actualitzada a posta (261024 correccions): motiu, revisió R2-04 · deixar de seguir posa deixat_al i la fila ja no és un seguiment viu. */
  expect(COS).toMatch(/from public\.seguiments s where s\.seguidor = v_uid and s\.deixat_al is null\)/);
  expect(COS).toMatch(/from private\.autoritzacions_apple a where a\.user_id = v_uid\)/);
  /* Les rebudes: no les teues, i només les que t'apunten a tu o al que és teu.
     Actualitzada a posta (261024 correccions): motiu, revisió R2-02/R3-07 · ja no hi ha CTE «rebudes», només un recompte de les retirades. */
  const rebudes = SENSE_ESPAIS(COS.slice(COS.indexOf("'denuncies_rebudes'"), COS.indexOf("'bloquejos'")));
  expect(rebudes).toContain("from public.denuncies d where d.denunciant is distinct from v_uid and d.estat = 'retirada' and (");
  for (const condicio of [
    "(d.autor_tipus = 'persona' and d.autor_id = v_uid::text)",
    "(d.objecte_tipus = 'persona' and d.objecte_id = v_uid::text)",
    "(d.objecte_tipus in ('publicacio', 'producte', 'esdeveniment') and d.objecte_id in ( select s.id::text from public.section_submissions s where s.owner_user_id = v_uid))",
    "(d.objecte_tipus = 'missatge' and d.objecte_id in ( select m.id::text from public.xat_missatges m where m.usuari_id = v_uid))"
  ]) expect(rebudes, condicio).toContain(condicio);
});

test('tercers · ni qui denuncia, ni qui bloqueja, ni qui seguix, ni l’empremta d’IP, ni el testimoni d’Apple', () => {
  /* Cap clau ni columna de tercers a l'eixida. */
  expect(COS).not.toMatch(/'denunciant'|'ip_hash'|'bloquejador'|'seguidor'|'testimoni_xifrat'|'esborrat_per'/);
  expect(COS).not.toMatch(/\btestimoni_xifrat\b|\bclient_id\b|\bultim_error\b/);
  /* L'empremta d'IP, només com a booleà. */
  const empremtes = [...COS.matchAll(/\b\w+\.ip_hash\b(.{0,12})/g)];
  expect(empremtes).toHaveLength(2);
  for (const [, despres] of empremtes) expect(despres).toMatch(/^ is not null/);
  /* Les rebudes (revisió 261024 R2-02 i R3-07): cap oracle en directe. Un
     recompte per tipus o per estat, amb les pendents, es podia comparar entre
     dues exportacions i delatava qui denuncia (en un directe 1:1, l'altra
     persona). Només ix quantes han acabat amb una mesura (estat 'retirada').
     Actualitzada a posta (261024 correccions): motiu, fora total, per_estat, per_motiu i per_tipus. */
  const rebudes = COS.slice(COS.indexOf("'denuncies_rebudes'"), COS.indexOf("'bloquejos'"));
  expect(SENSE_ESPAIS(rebudes)).toContain("'denuncies_rebudes', jsonb_build_object('amb_mesura', ( select count(*) from public.denuncies d "
    + "where d.denunciant is distinct from v_uid and d.estat = 'retirada' and (");
  expect([...rebudes.matchAll(/'(\w+)', (?:\(|coalesce|jsonb_build_object)/g)].map((m) => m[1])).toEqual(['denuncies_rebudes', 'amb_mesura']);
  expect(rebudes).not.toMatch(/\b(detall|fil_id|creat_al|revisada_al|ip_hash|jsonb_agg|jsonb_object_agg|group\s+by)\b/i);
  expect(rebudes).not.toMatch(/'(pendent|revisada|desestimada|total)'|per_estat|per_motiu|per_tipus/);
  /* L'estat només filtra (i només per 'retirada'); el motiu i el tipus no ixen. */
  expect([...rebudes.matchAll(/\bd\.estat\b(.{0,14})/g)].map((m) => m[1])).toEqual([" = 'retirada'"]);
  expect(rebudes).not.toMatch(/\bd\.motiu\b/);
  expect([...rebudes.matchAll(/\bselect\s+([^\s]+)/g)].map((m) => m[1])).toEqual(['count(*)', 's.id::text', 'm.id::text']);
  /* Els bloquejos rebuts no es lligen mai, ni per a comptar-los. */
  expect(COS).not.toMatch(/bloquejat_persona\s*=\s*v_uid|bloquejat_entitat\s*=/);
  /* Cap fila sencera de les taules noves: només columnes explícites. */
  for (const taula of ['public.denuncies', 'public.xat_adjunts', 'public.seguiments', 'private.autoritzacions_apple']) {
    expect(blocGuardat(taula).text, taula).not.toMatch(/to_jsonb\(|\b\w+\.\*/);
  }
  /* De qui et seguix, només el nombre; d'Apple, només la data. */
  /* Actualitzada a posta (261024 correccions): motiu, revisió R2-04 · només els seguidors vius (deixat_al null). */
  expect(COS).toContain("'total_seguidors', (select count(*) from public.seguiments s where s.seguit_persona = v_uid and s.deixat_al is null)");
  expect((COS.match(/\bs\.seguidor\b/g) || [])).toHaveLength(1);
  /* Cada lectura de seguiments és dels vius: ni els deixats de seguir a qui seguies ni els que t'han deixat de seguir. */
  const seguiments = [...COS.matchAll(/from public\.seguiments s where ([^\n]*)/g)].map((m) => m[1]);
  expect(seguiments).toHaveLength(2);
  for (const condicio of seguiments) expect(condicio).toMatch(/^s\.(seguidor|seguit_persona) = v_uid and s\.deixat_al is null\)/);
  expect(SENSE_ESPAIS(blocGuardat('private.autoritzacions_apple').text))
    .toContain("v_apple := jsonb_build_object('autoritzacio_desada_al', ( select a.desat_al from private.autoritzacions_apple a where a.user_id = v_uid));");
});

test('les guardes · cada lectura de moderació, adjunts, seguiments i Apple és dins del seu IF to_regclass', () => {
  const moderacio = COS.indexOf("  if to_regclass('public.denuncies') is not null\n     and to_regclass('public.bloquejos') is not null\n     and to_regclass('private.normes_acceptades') is not null then");
  expect(moderacio, 'la guarda triple de la moderació').toBeGreaterThan(0);
  const blocs = {
    'public.denuncies': blocGuardat('public.denuncies'),
    'public.bloquejos': blocGuardat('public.denuncies'),
    'private.normes_acceptades': blocGuardat('public.denuncies'),
    'public.xat_adjunts': blocGuardat('public.xat_adjunts'),
    'public.seguiments': blocGuardat('public.seguiments'),
    'private.autoritzacions_apple': blocGuardat('private.autoritzacions_apple')
  };
  for (const taula of TAULES_NOVES) {
    const { inici, fi } = blocs[taula];
    const posicions = [...COS.matchAll(new RegExp(`\\b${taula.replace('.', '\\.')}\\b`, 'g'))].map((m) => m.index);
    expect(posicions.length, taula).toBeGreaterThan(0);
    for (const p of posicions) expect(p > inici && p < fi, `${taula} fora de la seua guarda`).toBe(true);
  }
  /* Les dues de les tasques germanes (T6b i T1): un esquema que no casa no tomba l'exportació. */
  for (const taula of ['public.seguiments', 'private.autoritzacions_apple']) {
    expect(blocs[taula].text, taula).toMatch(/exception when undefined_column or datatype_mismatch then\n\s+v_\w+ := jsonb_build_object\('error', sqlstate\);/);
  }
  /* Sense la taula, la clau ix null (adjunts_propis, buida); cap lectura nova al return. */
  expect(COS).toMatch(/v_moderacio {2}jsonb;\n {2}v_adjunts {4}jsonb := '\[\]'::jsonb;\n {2}v_seguiments jsonb;\n {2}v_apple {6}jsonb;/);
  const retorn = COS.slice(COS.indexOf('  return jsonb_build_object('));
  for (const taula of TAULES_NOVES) expect(retorn, taula).not.toContain(taula);
});

test('les taules de les tasques germanes (T1, T6b), si la seua migració ja és a l’arbre, tenen les columnes que es lligen', () => {
  const ordre = readdirSync(MIGRACIONS).filter((f) => f.endsWith('.sql')).sort();
  const columnesDe = (taula) => {
    const re = new RegExp(`create table if not exists ${taula.replace('.', '\\.')} \\(([\\s\\S]*?)\\n\\);`, 'i');
    const fitxer = ordre.find((f) => re.test(senseComentaris(llig(f))));
    return fitxer ? { fitxer, cos: SENSE_ESPAIS(re.exec(senseComentaris(llig(fitxer)))[1]) } : null;
  };
  const apple = columnesDe('private.autoritzacions_apple');
  if (apple) {
    expect(apple.cos, apple.fitxer).toMatch(/(^|, )user_id uuid primary key references auth\.users \(id\) on delete cascade/);
    expect(apple.cos, apple.fitxer).toMatch(/, desat_al timestamptz not null/);
  }
  const seguiments = columnesDe('public.seguiments');
  if (seguiments) {
    for (const columna of ['seguidor', 'seguit_tipus', 'seguit_persona', 'seguit_entitat', 'creat_al']) {
      expect(seguiments.cos, `${seguiments.fitxer} · ${columna}`).toMatch(new RegExp(`(^|, )${columna} `));
    }
    /* Revisió 261024 R2-04 · deixat_al i reactivat_al, a la taula o afegides a la mateixa migració. */
    for (const columna of ['deixat_al', 'reactivat_al']) {
      const hiEs = new RegExp(`(^|, )${columna} timestamptz\\b`).test(seguiments.cos)
        || new RegExp(`alter table (if exists )?public\\.seguiments\\s+add column if not exists ${columna} timestamptz\\b`, 'i')
          .test(senseComentaris(llig(seguiments.fitxer)));
      expect(hiEs, `${seguiments.fitxer} · ${columna}`).toBe(true);
    }
  }
});

test('la federació no versionada continua igual que a 2609261500, sense cap taula literal', () => {
  assertFederacio(COS);
  expect(CODI).not.toMatch(/\bpublic\.(realms|user_realms|connections|posts)\b/i);
});
function assertFederacio(f) {
  expect(f).toMatch(/'federacio_no_versionada', v_federacio/);
  expect(f).toMatch(/array\['realms', 'user_realms', 'connections', 'posts'\]/);
  expect(f).toMatch(/to_regclass\(format\('public\.%I', v_taula\)\) is null/);
  expect(f).toMatch(/information_schema\.columns/);
  expect(f).toMatch(/c\.data_type = 'uuid'/);
  expect(f).toMatch(/c\.column_name not in \('id', 'tenant_id'\)/);
  expect(f).toMatch(/format\('t\.%I = \$1', c\.column_name\)/);
  expect(f).toMatch(/using v_uid;/);
}

test('el xat · adjunts recuperables, missatges amb metadades i esborrat_per_mi, i converses amb el subjecte i els teus ajustos', () => {
  const xat = SENSE_ESPAIS(COS.slice(COS.indexOf("'xat', jsonb_build_object("), COS.indexOf("'moderacio', v_moderacio")));
  expect(xat).toContain("'adjunts_propis', v_adjunts,");
  /* Cada adjunt porta el bucket i el nom de l'objecte: és el que el fa recuperable. */
  expect(SENSE_ESPAIS(blocGuardat('public.xat_adjunts').text)).toContain("'bucket', 'xat_adjunts', 'nom', a.id::text");
  for (const columna of ['id', 'seq', 'tipus', 'resposta_a', 'editat_al', 'esborrat_al', 'caduca_al', 'metadades', 'com_org_id']) {
    expect(xat, columna).toContain(`'${columna}', m.${columna}`);
  }
  expect(xat).toContain("'esborrat_per_mi', coalesce(m.esborrat_per = v_uid, false)");
  /* L'id de qui va esborrar el missatge (pot ser una admin) no ix mai. */
  expect([...COS.matchAll(/\bm\.esborrat_per\b(.{0,9})/g)].map((m) => m[1])).toEqual([' = v_uid,']);
  for (const columna of ['tipus', 'subjecte_tipus', 'subjecte_id', 'subjecte_ruta', 'subjecte_titol', 'subjecte_uri']) {
    expect(xat, columna).toContain(`'${columna}', f.${columna}`);
  }
  for (const columna of ['rol', 'com_org_id', 'etiqueta', 'eixit_al', 'silenciat_fins_al', 'arxivat_al', 'fixat_al', 'preferit_al', 'no_llegit_manual', 'avisos', 'llegit_fins_seq']) {
    expect(xat, columna).toContain(`'${columna}', p.${columna}`);
  }
  /* La conversa és la teua fila de participant: els ajustos d'altres no hi entren. */
  expect(xat).toContain('from public.xat_participants p join public.xat_fils f on f.id = p.fil_id where p.usuari_id = v_uid');
});

test('Codex C-04 · un àudio sense peu conserva la referència: text null i metadades.adjunt, i metadades s’exporta', () => {
  /* Com el desa 2610220240: sense peu, text null i l'adjunt a les metadades. */
  const adjunts = SENSE_ESPAIS(senseComentaris(llig(ADJUNTS)));
  expect(adjunts).toContain("v_peu text := nullif(btrim(p_text), '')");
  expect(adjunts).toContain("update public.xat_missatges set tipus = v_tipus, text = v_peu, metadades = jsonb_build_object('adjunt', jsonb_build_object('id', a.id,");
  /* I l'exportació en porta tots dos camps, de cada missatge propi, sense filtrar els que no tenen text. */
  const missatges = SENSE_ESPAIS(COS.slice(COS.indexOf("'missatges_propis'"), COS.indexOf("'lectures'")));
  expect(missatges).toContain("jsonb_build_object('fil_id', m.fil_id, 'text', m.text, 'creat_al', m.creat_al) || jsonb_build_object(");
  expect(missatges).toContain("'metadades', m.metadades");
  expect(missatges).toContain('from public.xat_missatges m where m.usuari_id = v_uid)');
  expect(missatges).not.toMatch(/m\.text is not null|coalesce\(m\.text/);
  /* L'adjunt de la reserva té el mateix id que el missatge: es casen pel nom de l'objecte. */
  expect(adjunts).toContain("insert into private.purga_storage_pendent(user_id, bucket_id, nom, referenciat) values (old.usuari_id, 'xat_adjunts', old.id::text, false)");
});

test('no_inclou · diu què es deixa fora i per què, en valencià', () => {
  const noInclou = COS.slice(COS.indexOf("'no_inclou', jsonb_build_array("), COS.indexOf("'fitxers', v_fitxers,"));
  const ques = [...noInclou.matchAll(/'que', '((?:[^']|'')+)'/g)].map((m) => m[1].replace(/''/g, "'"));
  /* Actualitzada a posta (261024 correccions): motiu, revisió R2-02/R3-07 · tampoc les que no han acabat amb una mesura. */
  expect(ques).toEqual([
    'qui ha fet les denúncies sobre tu o sobre el teu contingut, cadascuna d\'elles i les que no han acabat amb una mesura',
    'qui t\'ha bloquejat',
    'qui et seguix',
    'les empremtes de l\'adreça IP',
    'el permís xifrat d\'Apple',
    'el contingut dels fitxers i dels adjunts'
  ]);
  expect((noInclou.match(/'per_que', /g) || [])).toHaveLength(ques.length);
  expect(noInclou).toContain('RGPD, art. 15.4');
  /* El detall de les denúncies sobre tu es respon per correu, ponderant els drets de qui denuncia. */
  const denuncies = SENSE_ESPAIS(noInclou.slice(0, noInclou.indexOf("'que', 'qui t''ha bloquejat'")).replace(/'\s*\|\|\s*'/g, ''));
  expect(denuncies).toContain('només hi ha quantes han acabat amb una mesura');
  expect(denuncies).toContain('demana-nos-el per correu');
  expect(denuncies).toContain('ponderant els drets de qui denuncia (rgpd, art. 15.4)');
  expect(denuncies).not.toMatch(/en tens els recomptes/);
  expect(noInclou).not.toMatch(/ítems?|\baquest|\baquesta/i);
});

test('el catàleg supabase/README.md la nomena després de 2610220240 i abans de seed.sql, NO aplicada, en un sol paràgraf', () => {
  const posicio = README.indexOf(`migrations/${NOM}`);
  expect(posicio, 'falta l’entrada al README').toBeGreaterThanOrEqual(0);
  expect(posicio).toBeGreaterThan(README.indexOf(`migrations/${ADJUNTS}`));
  expect(posicio).toBeLessThan(README.indexOf('- `seed.sql`'));
  const entrada = README.slice(posicio).split('\n\n')[0];
  expect(entrada).toMatch(/P2-08 \(pla 261024_1315, T7/);
  expect(entrada).toMatch(/\*\*NO aplicada: l'aplica el Mestre, mai un agent\*\*/);
  expect(entrada).toContain('select jsonb_object_keys(public.exporta_les_meues_dades());');
  expect(entrada).not.toMatch(/offline[- ]first|local[- ]first/i);
});

test('higiene de fitxer: una sola línia buida final i cap vocabulari prohibit', () => {
  expect(SQL.endsWith(';\n') && !SQL.endsWith('\n\n')).toBe(true);
  expect(SQL).not.toMatch(/offline[- ]first|local[- ]first/i);
  expect(SQL).not.toMatch(/\t| +$/m);
});
