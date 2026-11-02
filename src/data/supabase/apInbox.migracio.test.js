// @vitest-environment node
/* P1-23 (fase 2) / P2-07 · Marató 261101_2143 (carril M14-B5-SQL) · Prova
   estàtica de la migració <V>_ap_inbox_persistencia_i_cua.sql: la
   persistència de la inbox ActivityPub i la cua d'eixida signada. Ací no
   s'executa cap PostgreSQL: es llig el SQL i es comproven la capçalera, la
   transacció, les cinc taules (private, RLS, cap política, cap permís), les
   tretze RPC (SECURITY DEFINER, search_path buit, la guarda auth.role() com a
   primera sentència, un revoke i un grant a service_role per funció i amb la
   signatura exacta), SKIP LOCKED, els panys, el jsonb únic i validat, els
   missatges de quota de la memòria i la PARITAT amb magatzemPostgrest.js
   (carril M13): cada RPC que l'adaptador crida existix amb eixos noms de
   paràmetre exactes, com els resol PostgREST, i cap RPC de la migració queda
   sense cridar. També fixa les guardes de propietat, de quota i de cua que
   la forma no veu (GUARDES_SEMANTIQUES). Les mutacions del final demostren
   que l'anàlisi mossega. L'execució real (108 comprovacions a PGlite 0.3.16)
   és evidència no versionada, fora del repositori. */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, test } from 'vitest';
import * as inbox from '../federacio/inboxActivityPub.js';

/* vitest s'executa des de l'arrel del repositori (com qualitat.test.js). */
const ARREL = process.cwd();
const MIGRACIONS = path.join(ARREL, 'supabase/migrations');
const ORDRE = readdirSync(MIGRACIONS).filter((f) => f.endsWith('.sql')).sort();
const NOMS = ORDRE.filter((f) => /^\d{10}_ap_inbox_persistencia_i_cua\.sql$/.test(f));
const NOM = NOMS[0];
const VERSIO = NOM?.slice(0, 10);
const SQL = NOM ? readFileSync(path.join(MIGRACIONS, NOM), 'utf8') : '';
const README = readFileSync(path.join(ARREL, 'supabase/README.md'), 'utf8');
const ORDRE_DESPLEGAMENT = JSON.parse(readFileSync(path.join(ARREL, 'supabase/ordre_desplegament.json'), 'utf8'));
const CAMI_MAGATZEM = path.join(ARREL, 'supabase/functions/ap-inbox-verifica/magatzemPostgrest.js');
const FONT_INBOX = readFileSync(path.join(ARREL, 'src/data/federacio/inboxActivityPub.js'), 'utf8');

const RPC_ESPERADES = Object.freeze([
  'ap_inbox_reclama', 'ap_inbox_confirma', 'ap_inbox_allibera', 'ap_seguidor_desa', 'ap_seguidor_retira',
  'ap_actor_remot_retira', 'ap_alerta_desa', 'ap_alerta_retira', 'ap_alertes_vigents', 'ap_cua_encua',
  'ap_cua_reclama', 'ap_cua_resol', 'ap_purga'
]);
const TAULES_ESPERADES = Object.freeze(['ap_inbox_lliuraments', 'ap_seguidors', 'ap_alertes_remotes', 'ap_lapides', 'ap_cua_eixida']);
const GUARDA = "if coalesce((select auth.role()), '') <> 'service_role' then raise exception 'SDP-AP-000: només el servidor.' using errcode = '42501'; end if;";
/* Les guardes de propietat, de quota i de cua que la forma i la paritat no veuen (Àrbitre A2): sense PGlite al
   repositori (D-6), es fixen al text normalitzat del cos. El comportament el prova l'arnés PGlite, fora de l'arbre. */
const GUARDES_SEMANTIQUES = Object.freeze([
  // Només l'autor fa directa una alerta anunciada: un altre compte del mateix origen no la reescriu.
  ['ap_alerta_desa', 'v_actual.via is not null and p_via is null and v_actual.actor = p_actor'],
  // El Delete només és del propietari, i l'Undo(Announce), de qui l'anuncià.
  ['ap_alerta_retira', 'a.id = p_id and a.actor <> p_actor) then return false'],
  ['ap_alerta_retira', 'b.activitat = p_activitat and b.via = p_actor'],
  // La quota de seguidors és de cada actor local, i l'Undo(Follow) només retira el followId vigent.
  ['ap_seguidor_desa', '(select count(*) from private.ap_seguidors s where s.slug = p_slug) >='],
  ['ap_seguidor_retira', 'and (p_follow_id is null or s.follow_id = p_follow_id)'],
  // Només es resol una fila reclamada.
  ['ap_cua_resol', "where c.id = p_id and c.estat = 'pendent' and c.intents > 0"],
  // La cua feta es conserva 7 dies i la fallida, 30.
  ['ap_purga', "(x.estat = 'fet' and x.resolt_al < now() - interval '7 days')"],
  ['ap_purga', "(x.estat = 'fallit' and x.resolt_al < now() - interval '30 days')"]
]);

/* Sense comentaris de línia: es comprova el codi, no la prosa. */
const senseComentaris = (sql) => sql.split('\n').map((linia) => linia.replace(/--.*$/, '')).join('\n');
const normal = (text) => text.replace(/\s+/g, ' ').trim().toLowerCase();

/** Cada funció: esquema, nom, paràmetres [{nom, tipus, perDefecte}], capçalera (fins a «as $$») i cos. */
function funcions(codi) {
  const re = /create\s+(?:or\s+replace\s+)?function\s+(\w+)\.(\w+)\s*\(([^)]*)\)([^$]*?)\bas\s+\$(\w*)\$/gi;
  const eixida = [];
  let m;
  while ((m = re.exec(codi))) {
    const tanca = `$${m[5]}$`;
    const inici = re.lastIndex;
    const fi = codi.indexOf(tanca, inici);
    if (fi < 0) throw new Error(`cos sense tancar a ${m[1]}.${m[2]}`);
    const params = normal(m[3]) ? normal(m[3]).split(',').map((p) => {
      const [nom, tipus, ...resta] = p.trim().split(' ');
      return { nom, tipus, perDefecte: resta[0] === 'default' };
    }) : [];
    eixida.push({ esquema: m[1].toLowerCase(), nom: m[2].toLowerCase(), params, capcalera: normal(m[4]), cos: codi.slice(inici, fi) });
    re.lastIndex = fi + tanca.length;
  }
  return eixida;
}

/** Les discrepàncies de seguretat i de forma del SQL. Una llista buida vol dir que és correcte. */
function analitza(sql) {
  const errors = [];
  const codi = senseComentaris(sql);
  const linies = codi.split('\n').map((l) => l.trim()).filter(Boolean);
  let fs;
  try { fs = funcions(codi); } catch (e) { return [e.message]; }

  // Taules: if not exists, a private, RLS, revoke total i cap política ni grant de taula.
  const taules = [...codi.matchAll(/create\s+table\s+(if\s+not\s+exists\s+)?([\w.]+)/gi)];
  const nomsTaules = taules.map((t) => t[2].toLowerCase());
  if (JSON.stringify(nomsTaules) !== JSON.stringify(TAULES_ESPERADES.map((t) => `private.${t}`))) errors.push(`taules: ${nomsTaules.join(', ')}`);
  for (const [, siNoExistix, nom] of taules) {
    if (!siNoExistix) errors.push(`${nom} sense if not exists`);
    if (!linies.includes(`alter table ${nom} enable row level security;`)) errors.push(`${nom} sense RLS`);
    if (linies.filter((l) => l === `revoke all on table ${nom} from public, anon, authenticated, service_role;`).length !== 1) errors.push(`${nom} sense el revoke de taula`);
  }
  if (/create\s+policy|alter\s+default\s+privileges|\bto\s+public\b/i.test(codi)) errors.push('política, privilegis per defecte o permís a public');

  // RPC: el conjunt exacte, SECURITY DEFINER, search_path buit, plpgsql i la guarda com a primera sentència.
  const rpc = fs.map((f) => `${f.esquema}.${f.nom}`);
  if (JSON.stringify(rpc) !== JSON.stringify(RPC_ESPERADES.map((n) => `public.${n}`))) errors.push(`rpc: ${rpc.join(', ')}`);
  for (const f of fs) {
    const id = `${f.esquema}.${f.nom}`;
    if (!f.capcalera.includes("language plpgsql") || !f.capcalera.includes("security definer set search_path = ''")) errors.push(`${id}: capçalera ${f.capcalera}`);
    const cos = normal(f.cos);
    const despresDeBegin = cos.slice(cos.indexOf(' begin ') >= 0 ? cos.indexOf(' begin ') + 7 : cos.indexOf('begin ') + 6);
    if (!despresDeBegin.startsWith(normal(GUARDA))) errors.push(`${id}: la guarda no és la primera sentència`);
    if (/\bexecute\b|\bformat\s*\(|to_jsonb\s*\(|jsonb_populate/.test(cos)) errors.push(`${id}: SQL dinàmic o conversió de fila`);
    const jsonb = f.params.filter((p) => p.tipus === 'jsonb').map((p) => p.nom);
    if (jsonb.length && !(f.nom === 'ap_cua_encua' && JSON.stringify(jsonb) === '["p_cos"]')) errors.push(`${id}: paràmetre jsonb ${jsonb.join(', ')}`);
    // Un revoke i un grant per funció, amb la signatura exacta dels seus paràmetres.
    const sig = `${id}(${f.params.map((p) => p.tipus).join(', ')})`;
    if (linies.filter((l) => l === `revoke all on function ${sig} from public, anon, authenticated, service_role;`).length !== 1) errors.push(`${id}: revoke`);
    if (linies.filter((l) => l === `grant execute on function ${sig} to service_role;`).length !== 1) errors.push(`${id}: grant`);
    if (linies.filter((l) => l.startsWith(`revoke all on function ${id}(`) || l.startsWith(`grant execute on function ${id}(`)).length !== 2) errors.push(`${id}: permisos de més`);
  }
  // Cap grant que no siga l'EXECUTE d'una RPC ap_* a service_role.
  for (const l of linies.filter((x) => /^grant\b/i.test(x))) {
    if (!/^grant execute on function public\.ap_\w+\([a-z, ]*\) to service_role;$/.test(l)) errors.push(`grant no admés: ${l}`);
  }
  const perNom = Object.fromEntries(fs.map((f) => [f.nom, normal(f.cos)]));
  if (!/for update of c skip locked/.test(perNom.ap_cua_reclama ?? '')) errors.push('ap_cua_reclama sense skip locked');
  for (const n of ['ap_inbox_reclama', 'ap_seguidor_desa', 'ap_alerta_desa']) if (!/pg_advisory_xact_lock\(hashtextextended\(/.test(perNom[n] ?? '')) errors.push(`${n} sense pany`);
  const encua = perNom.ap_cua_encua ?? '';
  for (const t of ["jsonb_typeof(p_cos) <> 'object'", "p_cos ->> 'id' is distinct from p_activitat_id", 'octet_length(p_cos::text) > 65536', 'c.cos = excluded.cos']) {
    if (!encua.includes(t)) errors.push(`ap_cua_encua sense «${t}»`);
  }
  if (!/p_resultat is null or p_resultat not in \('fet', 'reintent', 'fallit'\)/.test(perNom.ap_cua_resol ?? '')) errors.push('ap_cua_resol no rebutja un resultat null');
  for (const [nom, condicio] of GUARDES_SEMANTIQUES) if (!(perNom[nom] ?? '').includes(condicio)) errors.push(`${nom} sense «${condicio}»`);
  return errors;
}

/** PostgREST resol /rpc/<nom> pels noms de les claus del cos: totes han de ser paràmetres i hi han de ser tots els que no tenen valor per defecte. */
function paritat(fs, crides) {
  const errors = [];
  const perNom = new Map(fs.map((f) => [f.nom, f]));
  for (const { nom, claus } of crides) {
    const f = perNom.get(nom);
    if (!f) { errors.push(`l'adaptador crida ${nom}, que la migració no crea`); continue; }
    const params = new Set(f.params.map((p) => p.nom));
    for (const c of claus) if (!params.has(c)) errors.push(`${nom}: la clau ${c} no és cap paràmetre`);
    for (const p of f.params) if (!p.perDefecte && !claus.includes(p.nom)) errors.push(`${nom}: falta ${p.nom}`);
  }
  const cridades = new Set(crides.map((c) => c.nom));
  for (const f of fs) if (!cridades.has(f.nom)) errors.push(`${f.nom} no la crida l'adaptador`);
  return errors;
}

/* Les crides reals de l'adaptador: cada mètode del port amb un fetch doble que anota el nom i les claus i respon una forma vàlida. */
const RESPOSTES = Object.freeze({
  ap_inbox_reclama: true, ap_inbox_confirma: true, ap_inbox_allibera: true, ap_seguidor_desa: 'nou', ap_seguidor_retira: true,
  ap_actor_remot_retira: 1, ap_alerta_desa: 'nova', ap_alerta_retira: true, ap_alertes_vigents: [],
  ap_cua_encua: true, ap_cua_reclama: [], ap_cua_resol: 'fet', ap_purga: { activitats: 0, alertes: 0, lapides: 0, cua: 0 }
});
async function cridesDeLAdaptador() {
  const modul = await import(pathToFileURL(CAMI_MAGATZEM).href);
  const crides = [];
  const fetch = async (url, opcions = {}) => {
    const u = new URL(String(url));
    const nom = u.pathname.split('/rest/v1/rpc/')[1] ?? `(ruta ${u.pathname})`;
    const cos = typeof opcions.body === 'string' && opcions.body ? JSON.parse(opcions.body) : {};
    crides.push({ nom, claus: Object.keys(cos).sort(), metode: String(opcions.method ?? 'GET').toUpperCase() });
    return new Response(JSON.stringify(RESPOSTES[nom] ?? null), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  const magatzem = modul.creaMagatzemPostgrest({ base: 'https://ref.supabase.test', clau: 'sb_secret_prova_no_real', fetch });
  const ara = Date.parse('2026-11-02T00:00:00Z');
  const iso = new Date(ara).toISOString();
  const actor = 'https://m.example/users/anna';
  const local = 'https://socdepoble.org/ap/actors/la-torre-de-les-macanes.json';
  const casos = [
    () => magatzem.reclamaActivitat('https://m.example/activitats/1', { actor, tipus: 'Follow', rebuda: iso }),
    () => magatzem.confirmaActivitat('https://m.example/activitats/1'),
    () => magatzem.alliberaActivitat('https://m.example/activitats/1'),
    () => magatzem.desaSeguidor({ slug: 'la-torre-de-les-macanes', actor, inbox: `${actor}/inbox`, followId: 'https://m.example/f/1', acceptId: `${local}#accepts/abc`, des: iso }),
    () => magatzem.retiraSeguidor({ slug: 'la-torre-de-les-macanes', actor, followId: 'https://m.example/f/1' }),
    () => magatzem.retiraActorRemot(actor),
    () => magatzem.desaAlertaRemota({ id: 'https://m.example/notes/1', actor, via: null, activitat: 'https://m.example/activitats/2', tipus: 'alerta', url: null, nom: 'Nom', text: 'Text', publicat: iso, caduca: new Date(ara + 3_600_000).toISOString(), rebuda: iso }),
    () => magatzem.retiraAlertaRemota({ id: 'https://m.example/notes/1', actor, lapida: true }),
    () => magatzem.retiraAlertaRemota({ actor, activitat: 'https://m.example/activitats/3' }),
    () => magatzem.llistaAlertesVigents(ara),
    () => magatzem.purga(ara),
    () => magatzem.encua({ slug: 'la-torre-de-les-macanes', inbox: `${actor}/inbox`, activitat: { id: `${local}#accepts/abc`, type: 'Accept', actor: local } }),
    () => magatzem.reclama(5),
    () => magatzem.resol({ id: 1, resultat: 'fet', esperaS: null, error: null })
  ];
  for (const cas of casos) {
    try { await cas(); } catch { /* ací només compten les peticions; les formes les prova el carril M13 */ }
  }
  return crides;
}

describe('la migració de la inbox ActivityPub i la cua d’eixida', () => {
  const FUNCIONS = funcions(senseComentaris(SQL));

  test('una sola, amb el nom de la convenció i una versió posterior a 2611011800 que cap altra no repetix', () => {
    expect(NOMS).toHaveLength(1);
    expect(NOM).toMatch(/^\d{10}_[a-z0-9_]+\.sql$/);
    expect(Number(VERSIO)).toBeGreaterThan(2611011800);
    expect(ORDRE.indexOf(NOM)).toBeGreaterThan(ORDRE.indexOf('2611011800_contracte_exportacio_federacio_v1.sql'));
    expect(ORDRE.filter((f) => f.startsWith(VERSIO))).toEqual([NOM]);
  });

  test('la capçalera: PER QUÈ, QUÈ FA, QUÈ NO FA, CODIS, Depén de, Abans i Verificació posterior (lectura), Inversa, i NO aplicada en UNA línia', () => {
    const capcalera = SQL.slice(0, SQL.search(/^begin;/m));
    expect(capcalera.length).toBeGreaterThan(0);
    for (const apartat of [/^-- PER QUÈ: /m, /^-- QUÈ FA:$/m, /^-- QUÈ NO FA:$/m, /^-- CODIS:$/m, /^-- Depén de: .*\.$/m,
      /^-- Abans \(lectura\):$/m, /^-- Verificació posterior \(lectura\):$/m, /^-- Inversa /m]) {
      expect(capcalera).toMatch(apartat);
    }
    expect(SQL.split('\n').filter((l) => /^-- NO aplicada: l'aplica el Mestre, mai un agent\.$/.test(l))).toHaveLength(1);
    expect(capcalera).toMatch(/^-- Idempotent i en una sola transacció\.$/m);
    /* Les consultes de lectura no escriuen: cap verb d'escriptura entre «Abans» i «Inversa». */
    const lectura = capcalera.slice(capcalera.indexOf('-- Abans (lectura):'), capcalera.indexOf('-- Inversa '));
    expect(lectura).toMatch(/select to_regclass\('private\.ap_inbox_lliuraments'\) is null/);
    expect(lectura).not.toMatch(/\b(?:insert|update|delete|drop|create|alter|grant|revoke|truncate)\b/i);
    /* Cada signatura que nomenen la verificació i la inversa és la d'una funció real. */
    const signatures = new Set(FUNCIONS.map((f) => `public.${f.nom}(${f.params.map((p) => p.tipus).join(',')})`));
    for (const [, sig] of capcalera.matchAll(/'(public\.ap_\w+\([a-z,]*\))'/g)) expect(signatures.has(sig), sig).toBe(true);
    const inversa = normal(capcalera.slice(capcalera.indexOf('-- Inversa ')).replace(/^--/gm, ''));
    for (const f of FUNCIONS) expect(inversa, f.nom).toContain(`public.${f.nom}(${f.params.map((p) => p.tipus).join(', ')})`);
    for (const t of TAULES_ESPERADES) expect(inversa, t).toContain(`private.${t}`);
  });

  test('una sola transacció amb temps d’espera curts i la recàrrega de l’esquema de PostgREST abans del commit', () => {
    const codi = senseComentaris(SQL);
    expect((codi.match(/^\s*begin;\s*$/gim) || []).length).toBe(1);
    expect((codi.match(/^\s*commit;\s*$/gim) || []).length).toBe(1);
    expect(codi).toMatch(/begin;\nset local lock_timeout = '5s';\nset local statement_timeout = '60s';/);
    expect(codi.trimEnd()).toMatch(/notify pgrst, 'reload schema';\s*commit;$/);
  });

  test('l’anàlisi de seguretat no troba cap discrepància (taules, RPC, guardes, permisos, SKIP LOCKED, panys i jsonb)', () => {
    expect(analitza(SQL)).toEqual([]);
  });

  test('les RPC i els seus paràmetres són els de l’especificació B5 §2.2 (p_maxim de la reclamació es pot ometre)', () => {
    const sig = Object.fromEntries(FUNCIONS.map((f) => [f.nom, f.params.map((p) => `${p.nom} ${p.tipus}${p.perDefecte ? '?' : ''}`).join(', ')]));
    expect(sig).toEqual({
      ap_inbox_reclama: 'p_activitat_id text, p_actor text, p_host text, p_tipus text, p_retencio_s integer, p_maxim_per_host integer, p_maxim integer?',
      ap_inbox_confirma: 'p_activitat_id text',
      ap_inbox_allibera: 'p_activitat_id text',
      ap_seguidor_desa: 'p_slug text, p_actor text, p_inbox text, p_follow_id text, p_accept_id text, p_maxim integer',
      ap_seguidor_retira: 'p_slug text, p_actor text, p_follow_id text',
      ap_actor_remot_retira: 'p_actor text',
      ap_alerta_desa: 'p_id text, p_actor text, p_via text, p_activitat text, p_tipus text, p_url text, p_nom text, p_text text, p_publicat timestamptz, p_caduca timestamptz, p_rebuda timestamptz, p_maxim integer',
      ap_alerta_retira: 'p_id text, p_actor text, p_activitat text, p_lapida boolean, p_lapida_s integer',
      ap_alertes_vigents: 'p_ara timestamptz',
      ap_cua_encua: 'p_slug text, p_inbox text, p_activitat_id text, p_cos jsonb',
      ap_cua_reclama: 'p_limit integer',
      ap_cua_resol: 'p_id bigint, p_resultat text, p_espera_s integer, p_error text, p_maxim_intents integer',
      ap_purga: ''
    });
    /* Només lligen dades: vigents és stable; la resta, volatile. */
    for (const f of FUNCIONS) expect(f.capcalera, f.nom).toMatch(f.nom === 'ap_alertes_vigents' ? / stable / : / volatile /);
  });

  test('les quotes llancen 54000 amb els missatges exactes del magatzem en memòria de la biblioteca', () => {
    const codi = senseComentaris(SQL);
    const missatges = [...codi.matchAll(/raise exception 'SDP-AP-QUOTA: ([^']+)' using errcode = '(\d{5})'/g)];
    expect(missatges.length).toBe(4);
    for (const [, text, codiError] of missatges) {
      expect(codiError).toBe('54000');
      expect(['Quota de la inbox esgotada per a este origen.', 'Magatzem de la inbox ple.']).toContain(text);
      expect(FONT_INBOX, text).toContain(`'${text}'`);
    }
    expect(new Set(missatges.map((m) => m[1])).size).toBe(2);
    /* Cada raise porta un dels tres codis de la capçalera. */
    for (const [, codiAp] of codi.matchAll(/raise exception '(SDP-AP-[A-Z0-9]+)/g)) expect(['SDP-AP-000', 'SDP-AP-001', 'SDP-AP-QUOTA']).toContain(codiAp);
  });

  test('les retencions per defecte de la migració cobrixen les de la biblioteca (finestra de signatura i làpida)', () => {
    const retencio = (inbox.FINESTRA_SIGNATURA.maximMs + 2 * inbox.FINESTRA_SIGNATURA.margeMs) / 1000;
    const lapida = (inbox.MAXIM_VIGENCIA_ALERTA_MS + inbox.FINESTRA_SIGNATURA.maximMs + 2 * inbox.FINESTRA_SIGNATURA.margeMs) / 1000;
    if ('RETENCIO_ACTIVITAT_MS' in inbox) expect(inbox.RETENCIO_ACTIVITAT_MS / 1000).toBe(retencio);
    if ('RETENCIO_LAPIDA_MS' in inbox) expect(inbox.RETENCIO_LAPIDA_MS / 1000).toBe(lapida);
    const codi = senseComentaris(SQL);
    /* greatest(mínim, least(coalesce(p_x, per defecte), màxim)): el per defecte és la retenció i el màxim l'admet. */
    const [, minimR, perDefecteR, maximR] = codi.match(/greatest\((\d+), least\(coalesce\(p_retencio_s, (\d+)\), (\d+)\)\)/).map(Number);
    expect(perDefecteR).toBe(retencio);
    expect(minimR).toBeLessThanOrEqual(retencio);
    expect(maximR).toBeGreaterThanOrEqual(retencio);
    const [, minimL, perDefecteL, maximL] = codi.match(/greatest\((\d+), least\(coalesce\(p_lapida_s, (\d+)\), (\d+)\)\)/).map(Number);
    expect(minimL).toBeLessThanOrEqual(lapida);
    expect(perDefecteL).toBeGreaterThanOrEqual(lapida);
    expect(maximL).toBeGreaterThanOrEqual(lapida);
  });

  test('la PARITAT amb magatzemPostgrest.js (carril M13): cada RPC que crida existix amb els paràmetres exactes, i totes es criden', async () => {
    expect(existsSync(CAMI_MAGATZEM), 'falta supabase/functions/ap-inbox-verifica/magatzemPostgrest.js (carril M13)').toBe(true);
    const font = readFileSync(CAMI_MAGATZEM, 'utf8');
    /* Estàtica: cada nom ap_* de la font és una RPC de la migració, i al revés. */
    const noms = new Set([...font.matchAll(/['"`]\/?(?:rest\/v1\/rpc\/)?(ap_[a-z_]+)['"`]/g)].map((m) => m[1]));
    expect([...noms].filter((n) => !RPC_ESPERADES.includes(n))).toEqual([]);
    expect(RPC_ESPERADES.filter((n) => !font.includes(n))).toEqual([]);
    /* Dinàmica: les peticions reals del port. */
    const crides = await cridesDeLAdaptador();
    expect(crides.length).toBeGreaterThan(0);
    for (const c of crides) expect(c.metode, c.nom).toBe('POST');
    expect(paritat(FUNCIONS, crides)).toEqual([]);
  });

  test('el catàleg del README (vinyeta i fila, NO aplicada) i la porta de la funció a ordre_desplegament.json', () => {
    const posicio = README.indexOf(`- \`migrations/${NOM}\`\n`);
    expect(posicio, 'falta la vinyeta').toBeGreaterThanOrEqual(0);
    expect(posicio).toBeLessThan(README.indexOf('\n- `seed.sql`'));
    const vinyeta = README.slice(posicio).split('\n\n')[0];
    expect(vinyeta).toMatch(/\*\*NO aplicada: l'aplica el Mestre, mai un agent\*\*/);
    expect(vinyeta).toContain('src/data/supabase/apInbox.migracio.test.js');
    expect(README).toMatch(new RegExp(`^\\| \\d+ \\| \`${VERSIO}\` \\| \`${NOM.replace(/\./g, '\\.')}\` \\| \\*\\*NO aplicada: l'aplica el Mestre\\*\\* \\| [^|]+ \\|$`, 'm'));
    expect(README).toMatch(/^## Funció `ap-inbox-verifica` \(inbox ActivityPub, fase 2\)$/m);
    const porta = ORDRE_DESPLEGAMENT.portes.find((p) => p.id === 'funcio-ap-inbox-verifica');
    expect(porta).toMatchObject({ tipus: 'funcio', despres: [VERSIO], abans: [] });
  });

  test('higiene de fitxer: una sola línia buida final i cap vocabulari prohibit', () => {
    expect(SQL.endsWith(';\n') && !SQL.endsWith('\n\n')).toBe(true);
    expect(SQL).not.toMatch(/offline[- ]first|local[- ]first/i);
  });
});

describe('mutacions: l’anàlisi i la paritat mosseguen', () => {
  const FUNCIONS = funcions(senseComentaris(SQL));
  const muta = (de, a) => {
    expect(SQL.includes(de), `la mutació no troba «${de.slice(0, 60)}»`).toBe(true);
    return SQL.replace(de, a);
  };

  test('llevar la guarda d’una RPC', () => {
    const guarda = "  if coalesce((select auth.role()), '') <> 'service_role' then\n    raise exception 'SDP-AP-000: només el servidor.' using errcode = '42501';\n  end if;\n";
    expect(analitza(muta(guarda, ''))).not.toEqual([]);
  });

  test('un grant d’execució a authenticated', () => {
    expect(analitza(muta('notify pgrst', 'grant execute on function public.ap_purga() to authenticated;\nnotify pgrst'))).not.toEqual([]);
  });

  test('llevar SKIP LOCKED de la reclamació de la cua', () => {
    expect(analitza(muta('for update of c skip locked', 'for update of c'))).not.toEqual([]);
  });

  test('llevar el revoke d’una taula privada', () => {
    expect(analitza(muta('revoke all on table private.ap_seguidors from public, anon, authenticated, service_role;\n', ''))).not.toEqual([]);
  });

  test('una política, o una taula sense if not exists', () => {
    expect(analitza(muta('notify pgrst', 'create policy obert on private.ap_seguidors for select using (true);\nnotify pgrst'))).not.toEqual([]);
    expect(analitza(muta('create table if not exists private.ap_lapides', 'create table private.ap_lapides'))).not.toEqual([]);
  });

  test('un revoke amb una signatura que no és la de la funció', () => {
    expect(analitza(muta('revoke all on function public.ap_cua_reclama(integer)', 'revoke all on function public.ap_cua_reclama(bigint)'))).not.toEqual([]);
  });

  test('un paràmetre jsonb fora de ap_cua_encua', () => {
    expect(analitza(muta('public.ap_seguidor_retira(p_slug text, p_actor text, p_follow_id text)', 'public.ap_seguidor_retira(p_slug text, p_actor text, p_follow_id jsonb)'))).not.toEqual([]);
  });

  test('la cua acceptaria un cos distint amb el mateix id', () => {
    expect(analitza(muta(' and c.cos = excluded.cos', ''))).not.toEqual([]);
  });

  /* Els mutants de l'àrbitre que sobrevivien a totes les capes (M1, M5, M7, M8) i els de propietat (M4, M12). */
  test.each([
    ['M8 · un altre compte faria directa l’alerta anunciada', ' and v_actual.actor = p_actor then', ' then'],
    ['M4 · el Delete d’un altre compte retiraria l’alerta', "    if exists (select 1 from private.ap_alertes_remotes a where a.id = p_id and a.actor <> p_actor) then return false; end if;\n", ''],
    ['l’Undo(Announce) d’un altre retiraria l’alerta', ' and b.via = p_actor limit 1', ' limit 1'],
    ['M7 · quota de seguidors global', '(select count(*) from private.ap_seguidors s where s.slug = p_slug) >=', '(select count(*) from private.ap_seguidors s) >='],
    ['M12 · l’Undo d’un followId vell retiraria el seguidor', ' and (p_follow_id is null or s.follow_id = p_follow_id)', ''],
    ['M1 · es resoldria una fila no reclamada', " and c.intents > 0\n", '\n'],
    ['M5 · la cua feta es purgaria en 7 hores', "x.resolt_al < now() - interval '7 days'", "x.resolt_al < now() - interval '7 hours'"],
    ['la cua fallida es purgaria en 30 hores', "x.resolt_al < now() - interval '30 days'", "x.resolt_al < now() - interval '30 hours'"]
  ])('guarda semàntica: %s', (_nom, de, a) => {
    expect(analitza(SQL)).toEqual([]);
    expect(analitza(muta(de, a))).not.toEqual([]);
  });

  test('paritat: una RPC reanomenada, una clau de més, un paràmetre obligatori absent o una RPC que no es crida', () => {
    const crides = FUNCIONS.map((f) => ({ nom: f.nom, claus: f.params.filter((p) => !p.perDefecte).map((p) => p.nom) }));
    expect(paritat(FUNCIONS, crides)).toEqual([]);
    expect(paritat(funcions(senseComentaris(SQL.replaceAll('ap_cua_resol', 'ap_cua_resoldre'))), crides)).not.toEqual([]);
    expect(paritat(FUNCIONS, crides.map((c) => (c.nom === 'ap_inbox_reclama' ? { ...c, claus: [...c.claus, 'p_rebuda'] } : c)))).not.toEqual([]);
    expect(paritat(FUNCIONS, crides.map((c) => (c.nom === 'ap_cua_resol' ? { ...c, claus: c.claus.filter((k) => k !== 'p_espera_s') } : c)))).not.toEqual([]);
    expect(paritat(FUNCIONS, crides.filter((c) => c.nom !== 'ap_purga'))).not.toEqual([]);
    /* p_maxim té valor per defecte: l'adaptador el pot enviar o no. */
    expect(paritat(FUNCIONS, crides.map((c) => (c.nom === 'ap_inbox_reclama' ? { ...c, claus: [...c.claus, 'p_maxim'] } : c)))).toEqual([]);
  });
});
