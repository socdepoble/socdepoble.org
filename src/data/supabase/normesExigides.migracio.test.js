/* T2 (261024; P0-18, auditoria Codex 261024_1315 C-02) · Prova estàtica de la
   migració 2610241400_normes_exigides_ugc.sql. No hi ha cap base de dades: es
   llig el SQL i es comproven la capçalera (QUÈ FA, QUÈ NO FA, CODIS, Depén de,
   NO aplicada, l'aplica el Mestre, va DESPRÉS del client), la transacció, que
   la versió vigent del servidor és la del contracte, que les funcions són
   noves (cap redefinició), els permisos (un sol grant, el de
   he_acceptat_normes a authenticated), els dos disparadors i les seues
   exclusions (service_role, sistema, IAIA, notes), el camí del PATCH directe
   (auditoria Codex D-07.2: actualitzar el contingut també passa per la porta,
   però no les funcions SECURITY DEFINER de la baixa), el codi SDP-MOD-428 que
   el client reconeix, l'abast declarat (publicacions i missatges, R2-07) i
   l'entrada de supabase/README.md. Patró de moderacio.migracio.test.js. */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from 'vitest';
import { VERSIO_NORMES_CONVIVENCIA } from '../contracte.js';
import { IAIA_ID } from '../identitatsSeed.js';
import { CODI_NORMES_SERVIDOR } from '../errorsBackend.js';

/* vitest s'executa des de l'arrel del repositori (com qualitat.test.js). */
const ARREL = process.cwd();
const NOM = '2610241400_normes_exigides_ugc.sql';
const MIGRACIONS = path.join(ARREL, 'supabase/migrations');
const ORDRE = readdirSync(MIGRACIONS).filter((f) => f.endsWith('.sql')).sort();
const llig = (fitxer) => readFileSync(path.join(MIGRACIONS, fitxer), 'utf8');
const SQL = llig(NOM);
const README = readFileSync(path.join(ARREL, 'supabase/README.md'), 'utf8');
const XATS_PER_DEFECTE = readFileSync(path.join(ARREL, 'src/data/xatsPerDefecte.js'), 'utf8');
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
const funcio = (esquema, nom) => FUNCIONS.find((f) => f.esquema === esquema && f.nom === nom);
const NOMS = ['private.versio_normes_vigent', 'private.ha_acceptat_normes', 'private.he_acceptat_normes',
  'private.exigix_normes_publicacio', 'private.exigix_normes_missatge'];
/* D-07.2 · Les columnes que obrin la porta en actualitzar: el que es publica i on. */
const COLUMNES_PORTA = ['section_id', 'tenant_id', 'title', 'description', 'payload'];
const GRANT_PROPI = 'grant execute on function private.he_acceptat_normes() to authenticated;';

test('el nom segueix el format de les migracions i va després de 2610201500 i de 2610220240', () => {
  expect(NOM).toMatch(/^\d{10}_[a-z0-9_]+\.sql$/);
  expect(ORDRE.indexOf(NOM)).toBeGreaterThan(ORDRE.indexOf('2610201500_moderacio_denuncies_i_bloquejos.sql'));
  expect(ORDRE.indexOf(NOM)).toBeGreaterThan(ORDRE.indexOf('2610220240_xat_adjunts_i_quota.sql'));
  expect(ORDRE.filter((f) => f.startsWith('2610241400_'))).toEqual([NOM]);
});

test('la capçalera: QUÈ FA, QUÈ NO FA, CODIS i Depén de; NO aplicada, l’aplica el Mestre i va DESPRÉS del client', () => {
  expect(SQL).toMatch(/^-- =+\n-- 261024_1400 · T2 \(P0-18\)/);
  for (const seccio of ['-- QUÈ FA:', '-- QUÈ NO FA:', '-- CODIS', '-- Depén de:']) expect(CAPCALERA, seccio).toContain(seccio);
  expect(CAPCALERA).toMatch(/C-02/);
  expect(LINIES.filter((l) => /NO aplicada/.test(l))).toHaveLength(1);
  expect(LINIES.filter((l) => l === "-- L'aplica el Mestre, mai un agent.")).toHaveLength(1);
  expect(LINIES.filter((l) => /^-- Va DESPRÉS de publicar el client amb VERSIO_NORMES_CONVIVENCIA = '/.test(l))).toHaveLength(1);
  expect(CAPCALERA).toContain(`VERSIO_NORMES_CONVIVENCIA = '${VERSIO_NORMES_CONVIVENCIA}'`);
});

test('els codis SDP-MOD-428 (42501) i SDP-MOD-901 són a la capçalera i al codi', () => {
  expect(CAPCALERA).toContain('SDP-MOD-428 cal acceptar les normes de convivència (42501)');
  expect(CAPCALERA).toMatch(/SDP-MOD-901 en aplicar-la: falta 2610201500/);
  const rebutjos = [...CODI.matchAll(/raise exception '(SDP-MOD-428: [^']+)' using errcode = '(\w+)';/g)];
  expect(rebutjos).toHaveLength(2);
  for (const [, missatge, errcode] of rebutjos) {
    expect(missatge).toBe('SDP-MOD-428: cal acceptar les normes de convivència.');
    expect(errcode).toBe('42501');
  }
  expect(CODI).toMatch(/raise exception 'SDP-MOD-901: [^']+'\s+using errcode = '42P01';/);
});

test('el client reconeix el codi del servidor (errorsBackend.js · esRebuigDeNormes)', () => {
  expect(CODI_NORMES_SERVIDOR).toBe('SDP-MOD-428');
  expect(CODI).toContain(`'${CODI_NORMES_SERVIDOR}: `);
});

test('una sola transacció amb temps d’espera curts, i recarrega l’esquema de PostgREST abans del commit', () => {
  expect(CODI.trimStart()).toMatch(/^begin;/i);
  expect((CODI.match(/^\s*begin;\s*$/gim) || []).length).toBe(1);
  expect((CODI.match(/^\s*commit;\s*$/gim) || []).length).toBe(1);
  expect(CODI).toMatch(/begin;\nset local lock_timeout = '5s';\nset local statement_timeout = '60s';/);
  expect(CODI.trimEnd()).toMatch(/notify pgrst, 'reload schema';\s*commit;$/);
});

test('falla sencera si falta private.normes_acceptades (2610201500), abans de crear res', () => {
  const guarda = CODI.indexOf("if to_regclass('private.normes_acceptades') is null then");
  expect(guarda).toBeGreaterThan(0);
  expect(guarda).toBeLessThan(CODI.search(/create\s+or\s+replace\s+function/i));
});

test('la versió vigent del servidor és la del contracte (VERSIO_NORMES_CONVIVENCIA), una data real', () => {
  const f = funcio('private', 'versio_normes_vigent');
  expect(f.params).toBe('');
  expect(f.capcalera).toContain('returns text');
  expect(f.capcalera).toContain("set search_path = ''");
  const versio = /^\s*select '(\d{4}-\d{2}-\d{2})'::text;\s*$/.exec(f.cos)?.[1];
  expect(versio).toBe(VERSIO_NORMES_CONVIVENCIA);
  expect(new Date(`${versio}T00:00:00Z`).toISOString().slice(0, 10)).toBe(versio);
  /* El CHECK de private.normes_acceptades (2610201500) la deixa passar. */
  expect(versio).toMatch(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/);
});

test('ha_acceptat_normes mira private.normes_acceptades de la persona i la versió vigent; null és fals', () => {
  const f = funcio('private', 'ha_acceptat_normes');
  expect(f.params).toBe('p_usuari uuid');
  expect(f.capcalera).toContain('returns boolean');
  expect(f.capcalera).toContain("set search_path = ''");
  expect(SENSE_ESPAIS(f.cos)).toBe(SENSE_ESPAIS(`
    select p_usuari is not null and exists (
      select 1 from private.normes_acceptades n
       where n.usuari_id = p_usuari and n.versio = private.versio_normes_vigent());`));
});

/* Actualitzada a posta (261024 correccions): D-07.2 / R2-03. Per a saber si
   una actualització ve directament de l'API, el disparador de publicacions ha
   de vore el rol de qui escriu (current_user), i per això deixa de ser
   SECURITY DEFINER. La consulta de les normes passa a he_acceptat_normes(),
   SECURITY DEFINER, sense paràmetre i executable només per authenticated:
   l'únic grant de la migració. */
test('les cinc funcions són noves (cap redefinició), totes amb search_path buit; només he_acceptat_normes torna a authenticated', () => {
  expect(FUNCIONS.map((f) => `${f.esquema}.${f.nom}`).sort()).toEqual([...NOMS].sort());
  const anteriors = ORDRE.slice(0, ORDRE.indexOf(NOM)).map((f) => senseComentaris(llig(f)).toLowerCase());
  for (const nom of NOMS) {
    expect(anteriors.some((sql) => new RegExp(`function\\s+${nom.replace('.', '\\.')}\\s*\\(`).test(sql)), `${nom} ja existia`).toBe(false);
  }
  for (const f of FUNCIONS) expect(f.capcalera, f.nom).toContain("set search_path = ''");
  const definidores = FUNCIONS.filter((f) => /security definer/.test(f.capcalera)).map((f) => `${f.esquema}.${f.nom}`).sort();
  expect(definidores).toEqual(['private.exigix_normes_missatge', 'private.he_acceptat_normes']);
  const firmes = { versio_normes_vigent: '', ha_acceptat_normes: 'uuid', he_acceptat_normes: '', exigix_normes_publicacio: '', exigix_normes_missatge: '' };
  for (const [nom, args] of Object.entries(firmes)) {
    expect(CODI.split('\n').filter((l) => l.trim() === `revoke execute on function private.${nom}(${args}) from public, anon, authenticated, service_role;`), nom)
      .toHaveLength(1);
  }
  /* Un sol grant, a authenticated i després del seu revoke; cap a anon ni a public. */
  expect(CODI.split('\n').filter((l) => /^\s*grant\b/i.test(l)).map((l) => l.trim())).toEqual([GRANT_PROPI]);
  expect(CODI.indexOf(GRANT_PROPI)).toBeGreaterThan(CODI.indexOf('revoke execute on function private.he_acceptat_normes() from public, anon, authenticated, service_role;'));
  /* Sense paràmetre: només respon per la persona de la sessió, mai per una altra. */
  const propia = funcio('private', 'he_acceptat_normes');
  expect(propia.params).toBe('');
  expect(propia.capcalera).toBe("returns boolean language sql stable security definer set search_path = ''");
  expect(SENSE_ESPAIS(propia.cos)).toBe('select private.ha_acceptat_normes((select auth.uid()));');
  /* authenticated pot entrar a l'esquema private per a cridar-la (2609080000). */
  expect(llig('2609080000_initial_schema.sql')).toMatch(/^grant usage on schema private to authenticated;$/m);
});

test('cap taula, política ni permís de taula nou; no es toca cap fila', () => {
  expect(CODI).not.toMatch(/create\s+(table|policy|index|unique index|view)|alter\s+table|drop\s+(table|policy|function)|truncate/i);
  expect(CODI).not.toMatch(/\b(insert\s+into|delete\s+from|update\s+public\.)/i);
});

/* Actualitzada a posta (261024 correccions): D-07.2 / R2-03. El disparador de
   publicacions també salta en actualitzar el contingut (title, description,
   payload) i el poble (tenant_id), no només la secció. */
test('els disparadors: idempotents, abans d’inserir (i d’actualitzar el contingut d’una publicació), un per taula', () => {
  const triggers = [...CODI.matchAll(/create trigger (\w+)\s+(before [^\n]+?) on (public\.\w+)\s+for each row execute function (private\.\w+)\(\);/g)]
    .map((m) => [m[1], m[2], m[3], m[4]]);
  expect(triggers).toEqual([
    ['section_submissions_exigix_normes', `before insert or update of ${COLUMNES_PORTA.join(', ')}`, 'public.section_submissions', 'private.exigix_normes_publicacio'],
    ['xat_missatges_exigix_normes', 'before insert', 'public.xat_missatges', 'private.exigix_normes_missatge']
  ]);
  for (const [nom, , taula] of triggers) {
    const drop = CODI.indexOf(`drop trigger if exists ${nom} on ${taula};`);
    expect(drop, nom).toBeGreaterThan(0);
    expect(drop, nom).toBeLessThan(CODI.indexOf(`create trigger ${nom}`));
  }
  /* Els BEFORE s'executen per ordre de nom: el rebuig va abans de la
     numeració de F0 (xat_missatges_seq), i cap seq no es gasta. */
  const deF0 = [...llig('2609270200_xat_f0_fonament.sql').matchAll(/create trigger (\w+) before insert on public\.xat_missatges/gi)].map((m) => m[1]);
  expect(deF0).toEqual(['xat_missatges_seq']);
  expect('xat_missatges_exigix_normes' < deF0[0]).toBe(true);
});

/* Actualitzada a posta (261024 correccions): D-07.2 / R2-03. En actualitzar,
   la porta ja no mira només la secció: mira les cinc columnes del que es
   publica, i només per a les escriptures directes (current_user). */
test('publicacions: fora sense persona i service_role, fora les notes; en actualitzar, només escriptures directes que canvien el contingut', () => {
  const f = funcio('private', 'exigix_normes_publicacio');
  expect(f.capcalera).toContain('returns trigger');
  const cos = SENSE_ESPAIS(f.cos);
  const persona = cos.indexOf("v_jo uuid := (select auth.uid());");
  const fora = cos.indexOf("if v_jo is null or coalesce((select auth.role()), '') = 'service_role' then return new; end if;");
  const notes = cos.indexOf("if new.section_id = 'notes' then return new; end if;");
  const canvi = cos.indexOf(`if tg_op = 'update' then if current_user <> 'authenticated' then return new; end if; `
    + `if (${COLUMNES_PORTA.map((c) => `old.${c}`).join(', ')}) is not distinct from (${COLUMNES_PORTA.map((c) => `new.${c}`).join(', ')}) `
    + 'then return new; end if; end if;');
  const porta = cos.search(/if not private\.he_acceptat_normes\(\) then raise exception 'sdp-mod-428: [^']+' using errcode = '42501'; end if; return new; end;$/);
  expect(persona, 'qui crida').toBeGreaterThan(0);
  expect(fora, 'sense persona o service_role').toBeGreaterThan(persona);
  expect(notes, 'les notes privades').toBeGreaterThan(fora);
  expect(canvi, 'en actualitzar, només el PATCH directe que canvia el contingut').toBeGreaterThan(notes);
  expect(porta, 'la porta, al final').toBeGreaterThan(canvi);
});

/* D-07.2 (Codex 261024; Gemini G2-06.2; R2-03) · Abans, un PATCH directe
   /rest/v1/section_submissions?id=eq.<publicació> amb {title, description,
   payload} no tocava section_id i el disparador ni saltava: qui no havia
   acceptat les normes vigents podia reescriure el que ja havia publicat. */
test('el PATCH directe: les columnes de la porta són tot el contingut de section_submissions, i les funcions de la baixa queden fora', () => {
  /* Les columnes reals de la taula (2609080000 i cada add column posterior). */
  const creacio = /create table if not exists public\.section_submissions \(([\s\S]*?)\n\);/.exec(llig('2609080000_initial_schema.sql'))?.[1];
  expect(creacio, 'section_submissions sense create table').toBeTruthy();
  const columnes = new Set(creacio.split('\n').map((l) => /^\s*(\w+)\s+\w/.exec(l)?.[1]).filter(Boolean));
  for (const fitxer of ORDRE.slice(0, ORDRE.indexOf(NOM))) {
    for (const m of SENSE_ESPAIS(senseComentaris(llig(fitxer))).matchAll(/alter table public\.section_submissions add column if not exists (\w+)/g)) columnes.add(m[1]);
  }
  expect([...columnes].sort()).toEqual(['author_org_id', 'created_at', 'description', 'id', 'owner_user_id', 'payload', 'section_id', 'tenant_id', 'title', 'updated_at']);
  /* Fora de la porta només la identitat, la propietat, la signatura i les dates;
     una columna nova de contingut fa fallar esta prova fins que es decidisca. */
  const fora = ['author_org_id', 'created_at', 'id', 'owner_user_id', 'updated_at'];
  expect([...columnes].filter((c) => !fora.includes(c)).sort()).toEqual([...COLUMNES_PORTA].sort());

  /* SECURITY INVOKER: si no, current_user seria sempre la propietària i la
     porta no distingiria el PATCH de la baixa. */
  const f = funcio('private', 'exigix_normes_publicacio');
  expect(f.capcalera).not.toMatch(/security definer/);
  expect(SENSE_ESPAIS(f.cos)).not.toContain('private.ha_acceptat_normes(');

  /* Les escriptures SECURITY DEFINER vigents de section_submissions (demana_baixa
     i cancela_baixa, 2609291200) passen per la propietària: no les para la porta. */
  for (const nom of ['demana_baixa', 'cancela_baixa']) {
    const fitxer = ORDRE.slice(0, ORDRE.indexOf(NOM)).filter((x) => new RegExp(`create\\s+or\\s+replace\\s+function\\s+public\\.${nom}\\s*\\(`, 'i').test(llig(x))).at(-1);
    expect(fitxer, nom).toBe('2609291200_baixa_icon_copyright.sql');
    const vigent = funcions(senseComentaris(llig(fitxer))).find((x) => x.esquema === 'public' && x.nom === nom);
    expect(vigent.capcalera, nom).toContain('security definer');
    expect(SENSE_ESPAIS(vigent.cos), nom).toMatch(/update public\.section_submissions s set payload = /);
  }
  /* Cap migració posterior les redefinix sense SECURITY DEFINER (si ho fa, cal revisar la porta). */
  for (const fitxer of ORDRE.slice(ORDRE.indexOf(NOM) + 1)) {
    expect(/function\s+public\.(demana_baixa|cancela_baixa)\s*\(/i.test(senseComentaris(llig(fitxer))), fitxer).toBe(false);
  }
});

/* R2-07 · La capçalera deia «contingut dels veïns (UGC)», i la porta només
   cobrix les publicacions i els missatges. */
test('l’abast declarat: publicacions i missatges; la resta de l’UGC queda com a decisió del Mestre', () => {
  expect(LINIES.slice(1, 3).join(' ')).toMatch(/exigides al servidor\s+-- abans d'admetre publicacions i missatges dels veïns/);
  expect(CAPCALERA).not.toMatch(/abans d'admetre contingut dels veïns \(UGC\)/);
  const noFa = SENSE_ESPAIS(CAPCALERA.slice(CAPCALERA.indexOf('-- QUÈ NO FA:'), CAPCALERA.indexOf('-- CODIS')).replace(/^-- ?/gm, ''));
  for (const superficie of ['camps del perfil', 'bio', 'presentacio_html', 'hero_url', 'textos de les entitats', 'description', 'pujades a storage', 'decisió del mestre']) {
    expect(noFa, superficie).toContain(superficie);
  }
  expect(noFa).toContain('demana_baixa i cancela_baixa');
});

test('missatges: només el text que envia la persona; fora la IAIA (es_ia i el xat privat), el sistema i service_role', () => {
  const f = funcio('private', 'exigix_normes_missatge');
  expect(f.capcalera).toContain('returns trigger');
  const cos = SENSE_ESPAIS(f.cos);
  expect(cos).toContain("if v_jo is null or coalesce((select auth.role()), '') = 'service_role' or coalesce(new.es_ia, false) "
    + "or new.tipus is distinct from 'text' or new.usuari_id is distinct from v_jo then return new; end if;");
  expect(cos).toContain("and (f.tipus = 'iaia' or (f.tipus not in ('grup', 'canal', 'comunitat') and exists "
    + '(select 1 from public.xat_participants p where p.fil_id = f.id '
    + `and p.usuari_id = '${IAIA_ID}'::uuid)))) then return new; end if;`);
  expect(cos).toMatch(/if not private\.ha_acceptat_normes\(v_jo\) then raise exception 'sdp-mod-428: [^']+' using errcode = '42501'; end if; return new; end;$/);
  /* Els tipus de grup són els del client (xatsPerDefecte.js · GRUPALS): el
     xat privat amb la IAIA és el mateix als dos llocs. */
  const grupals = /const GRUPALS = new Set\(\[([^\]]*)\]\)/.exec(XATS_PER_DEFECTE)?.[1];
  expect([...String(grupals).matchAll(/'([^']+)'/g)].map((m) => m[1]).sort()).toEqual(['canal', 'comunitat', 'grup']);
  /* El xat públic de la pàgina /iaia sí que les exigix: el llig el poble. */
  expect(f.cos).not.toMatch(/subjecte_/);
});

test('xat_envia vigent inserix els missatges de la persona amb tipus text i es_ia fals: el disparador els veu', () => {
  const envia = senseComentaris(llig('2610081543_xat_consentiment_i_metadades.sql'));
  expect(SENSE_ESPAIS(envia)).toContain("values (p_id, p_fil_id, v_jo, v_org, v_text, 'text', p_resposta_a, '{}'::jsonb, false)");
  /* Cap migració posterior a 2610081543 la redefinix (si ho fa, cal revisar el disparador). */
  const posteriors = ORDRE.slice(ORDRE.indexOf('2610081543_xat_consentiment_i_metadades.sql') + 1);
  for (const fitxer of posteriors) expect(/function\s+public\.xat_envia\s*\(/i.test(senseComentaris(llig(fitxer))), fitxer).toBe(false);
});

test('el catàleg supabase/README.md la nomena abans de seed.sql, NO aplicada, en un sol paràgraf', () => {
  const posicio = README.indexOf(`migrations/${NOM}`);
  expect(posicio, 'falta l’entrada al README').toBeGreaterThanOrEqual(0);
  expect(posicio).toBeGreaterThan(README.indexOf('migrations/2610220240_xat_adjunts_i_quota.sql'));
  expect(posicio).toBeLessThan(README.indexOf('- `seed.sql`'));
  const entrada = README.slice(posicio).split('\n\n')[0];
  expect(entrada).toMatch(/T2 \(P0-18; auditoria Codex 261024_1315 C-02/);
  expect(entrada).toMatch(/\*\*NO aplicada: l'aplica el Mestre, mai un agent\*\*\.?$/);
  expect(entrada).toContain(`\`'${VERSIO_NORMES_CONVIVENCIA}'\``);
  expect(entrada).toContain('SDP-MOD-428');
  expect(SENSE_ESPAIS(entrada)).toContain('va després de publicar el client');
  /* D-07.2 i R2-07 · El catàleg diu el mateix que la capçalera. */
  expect(entrada).toContain(GRANT_PROPI);
  for (const col of COLUMNES_PORTA) expect(entrada, col).toContain(`\`${col}\``);
  expect(entrada).toContain("`current_user = 'authenticated'`");
  expect(SENSE_ESPAIS(entrada)).toContain("abans d'admetre publicacions i missatges dels veïns");
  expect(SENSE_ESPAIS(entrada)).toContain('pujades a storage');
  expect(entrada).not.toMatch(/cap grant|encara no hi pregunta/);
  expect(entrada).not.toMatch(/offline[- ]first|local[- ]first/i);
});

test('higiene de fitxer: una sola línia buida final i cap vocabulari prohibit', () => {
  expect(SQL.endsWith(';\n') && !SQL.endsWith('\n\n')).toBe(true);
  expect(SQL).not.toMatch(/offline[- ]first|local[- ]first/i);
});
