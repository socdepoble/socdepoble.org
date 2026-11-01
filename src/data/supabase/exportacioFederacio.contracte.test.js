// @vitest-environment node
/* P2-09 · Contracte v1 de l'exportació RGPD de les taules de federació
   (supabase/contracts/exportacio_federacio.v1.json i la migració 2611011800).
   Prova estàtica: ací no s'executa cap PostgreSQL. L'execució real (dues
   persones, mutacions d'esquema, permisos per rol, la capçalera i la
   reaplicació) es va fer a PGlite 0.3.16 fora del repositori, al torn
   torn_3f5652a2: és evidència no versionada. */
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import {
  CONTRACTE_EXPORTACIO_FEDERACIO,
  TAULES_FEDERACIO_CONTRACTE,
  aplicaContracteExportacioFederacio
} from './contracteExportacioFederacio.js';

const ARREL = new URL('../../../', import.meta.url);
const llig = (relatiu) => readFileSync(new URL(relatiu, ARREL), 'utf8');
const NOM = '2611011800_contracte_exportacio_federacio_v1.sql';
const ANTERIOR_NOM = '2610311900_exporta_dades_filtre_servidor_rgpd.sql';
const CONTRACTE = JSON.parse(llig('supabase/contracts/exportacio_federacio.v1.json'));
const SQL = llig(`supabase/migrations/${NOM}`);
const ANTERIOR = llig(`supabase/migrations/${ANTERIOR_NOM}`);
const senseComentaris = (sql) => sql.split('\n').map((linia) => linia.replace(/--.*$/, '')).join('\n');
const CODI = senseComentaris(SQL);
const CAPCALERA = SQL.slice(0, SQL.indexOf('\nbegin;'));
const tros = (text, inici, fi) => {
  const a = text.indexOf(inici);
  const b = text.indexOf(fi, a);
  expect(a, inici).toBeGreaterThanOrEqual(0);
  expect(b, fi).toBeGreaterThan(a);
  return text.slice(a, b + fi.length);
};
const PRIVADA = tros(SQL, 'create or replace function private.exporta_federacio_v1(p_uid uuid)', '$fed$;');
const RPC = tros(SQL, 'create or replace function public.exporta_les_meues_dades()', '\n$$;');
const RPC_ANTERIOR = tros(ANTERIOR, 'create or replace function public.exporta_les_meues_dades()', '\n$$;');
const TIPUS_ESCALARS = new Set(['uuid', 'text', 'character varying', 'timestamp with time zone', 'timestamp without time zone']);
const UID = '11111111-1111-4111-8111-111111111111';
/* El bloc nou de l'RPC: la crida a la privada, protegida (revisió P2-09-A2). */
const BLOC_FEDERACIO = [
  '  -- P2-09 v1: propietat demostrada i projecció per recurs. Si falla la crida',
  "  -- mateixa (la propietària de l'RPC no pot executar la privada, o la privada",
  "  -- s'ha esborrat abans de tornar a aplicar la 2610311900), cada recurs en diu",
  "  -- el SQLSTATE i la resta de l'exportació continua, com en la 2610311900.",
  '  -- Un error de primer nivell no serviria: el client només mira els recursos.',
  '  begin',
  '    v_federacio := private.exporta_federacio_v1(v_uid);',
  '  exception when insufficient_privilege or undefined_function then',
  "    v_federacio := jsonb_build_object('realms', jsonb_build_object('error', sqlstate),",
  "                                      'user_realms', jsonb_build_object('error', sqlstate),",
  "                                      'connections', jsonb_build_object('error', sqlstate),",
  "                                      'posts', jsonb_build_object('error', sqlstate));",
  '  end;',
  ''
].join('\n');

/* Les discrepàncies entre el JSON i el SQL de la funció privada. Una llista
   buida vol dir que casen; les mutacions de baix demostren que mossega. */
function discrepancies(contracte, privada) {
  const errors = [];
  const casos = [...privada.matchAll(/when '([^']+)' then v_propietari := '([^']+)'; v_columnes := '([^']+)'::jsonb;/g)];
  const recursosSql = /foreach v_recurs in array array\[([^\]]+)\]/.exec(privada);
  const llistaSql = recursosSql ? [...recursosSql[1].matchAll(/'([^']+)'/g)].map((m) => m[1]) : [];
  if (JSON.stringify(llistaSql) !== JSON.stringify(Object.keys(contracte.recursos))) errors.push(`recursos: ${llistaSql}`);
  if (casos.length !== Object.keys(contracte.recursos).length) errors.push(`casos: ${casos.length}`);
  for (const [, recurs, propietari, columnes] of casos) {
    const definicio = contracte.recursos[recurs];
    if (!definicio) { errors.push(`${recurs}: fora del contracte`); continue; }
    if (definicio.propietari !== propietari) errors.push(`${recurs}: propietari ${propietari}`);
    if (JSON.stringify(JSON.parse(columnes)) !== JSON.stringify(definicio.columnes)) errors.push(`${recurs}: columnes`);
  }
  if (!privada.includes(`jsonb_build_object('_contracte','${contracte.esquema}')`)) errors.push('marca _contracte');
  for (const fragment of [
    "c.data_type='uuid'", 'fk.convalidated', 'cardinality(fk.conkey)=1', 'cardinality(fk.confkey)=1',
    'origen.attname=v_propietari', "desti.attname='id'", "relkind in ('r','p')",
    "fk.confrelid in (to_regclass('auth.users'),to_regclass('public.profiles'))",
    'p_uid is distinct from (select auth.uid())'
  ]) if (!privada.includes(fragment)) errors.push(`falta ${fragment}`);
  return errors;
}

describe('P2-09 · el contracte JSON i la funció privada casen', () => {
  test('quatre recursos, una sola columna de propietat i tipus escalars per columna', () => {
    expect(CONTRACTE.esquema).toBe('sdp.exportacio.federacio.v1');
    expect(Object.keys(CONTRACTE.recursos)).toEqual([...TAULES_FEDERACIO_CONTRACTE]);
    expect(Object.fromEntries(Object.entries(CONTRACTE.recursos).map(([r, d]) => [r, d.propietari]))).toEqual({
      realms: 'owner_user_id', user_realms: 'user_id', connections: 'user_id', posts: 'author_id'
    });
    for (const [recurs, d] of Object.entries(CONTRACTE.recursos)) {
      expect(d.obligatories, recurs).toEqual(['id', d.propietari]);
      expect(d.referencia_propietari, recurs).toEqual(['auth.users.id', 'public.profiles.id']);
      expect(d.columnes.id, recurs).toEqual(['uuid']);
      expect(d.columnes[d.propietari], recurs).toEqual(['uuid']);
      for (const [columna, tipus] of Object.entries(d.columnes)) {
        expect(tipus.length, `${recurs}.${columna}`).toBeGreaterThan(0);
        for (const t of tipus) expect(TIPUS_ESCALARS.has(t), `${recurs}.${columna}: ${t}`).toBe(true);
      }
      expect(Object.keys(d.columnes).filter((c) => /token|secret|password|credential|private|key|ip_hash|email/i.test(c)), recurs).toEqual([]);
    }
    expect(discrepancies(CONTRACTE, PRIVADA)).toEqual([]);
  });

  test('mossega: una columna més al JSON, un altre propietari o una FK sense validar trenquen el casament', () => {
    const clona = () => JSON.parse(JSON.stringify(CONTRACTE));
    const ambIp = clona();
    ambIp.recursos.posts.columnes.ip_hash = ['text'];
    expect(discrepancies(ambIp, PRIVADA)).toContain('posts: columnes');
    const altrePropietari = clona();
    altrePropietari.recursos.connections.propietari = 'target_user_id';
    expect(discrepancies(altrePropietari, PRIVADA)).toContain('connections: propietari user_id');
    expect(discrepancies(CONTRACTE, PRIVADA.replace('and fk.convalidated', ''))).toContain('falta fk.convalidated');
    expect(discrepancies(CONTRACTE, PRIVADA.replace("'posts'] loop", "'posts','notes'] loop"))).not.toEqual([]);
  });
});

describe('P2-09 · propietat demostrada, sense inferència', () => {
  test('un sol filtre per recurs, per la columna del contracte i amb l’uid com a paràmetre', () => {
    const privada = senseComentaris(PRIVADA);
    expect(privada.match(/\bexecute format\(/g)).toHaveLength(1);
    expect(privada).toContain("from (select %s from public.%I t where t.%I = $1) e',v_projeccio,v_recurs,v_propietari)");
    expect(privada).toContain('into v_files using p_uid;');
    /* L'únic %s és la projecció, i la projecció només es fa amb %I. */
    expect(privada.match(/%s/g)).toHaveLength(1);
    expect(privada).toContain("string_agg(format('t.%I',c.column_name),', ' order by c.ordinal_position)");
    /* Res de la 2610311900: ni precedència ni llistes alternatives. */
    expect(privada).not.toMatch(/v_propietats|v_exportades|with ordinality|limit 1/);
    expect(privada).not.toMatch(/c\.column_name not in \('id', 'tenant_id'\)/);
    expect(privada).not.toMatch(/where\s+.*realm_id\s*=\s*\$1/i);
  });

  test('projecció tancada: només columnes del contracte, mai la fila sencera', () => {
    const privada = senseComentaris(PRIVADA);
    expect(privada).toContain('v_columnes ? c.column_name');
    expect(privada).toContain('(v_columnes -> c.column_name) ? c.data_type');
    expect(privada).not.toMatch(/select\s+(?:\w+\.)?\*|to_jsonb\(t\)/i);
    expect(privada).toContain("jsonb_build_object('error','SDP-FED-ESQUEMA-NO-ADMES')");
    expect(privada).toMatch(/exception when others then\n\s+v_resultat := v_resultat \|\| jsonb_build_object\(v_recurs,jsonb_build_object\('error',sqlstate\)\);/);
  });
});

describe('P2-09 · permisos i forma de la migració', () => {
  test('la privada és INVOKER i ningú la pot executar; l’RPC continua DEFINER i només per a authenticated', () => {
    expect(PRIVADA).toContain("returns jsonb language plpgsql stable security invoker set search_path = '' as $fed$");
    expect(RPC).toContain("security definer\nset search_path = ''");
    const linies = CODI.split('\n');
    expect(linies.filter((l) => l === 'revoke all on function private.exporta_federacio_v1(uuid) from public, anon, authenticated, service_role;')).toHaveLength(1);
    expect(linies.filter((l) => l === 'revoke all on function public.exporta_les_meues_dades() from public, anon, authenticated, service_role;')).toHaveLength(1);
    expect(linies.filter((l) => l === 'grant execute on function public.exporta_les_meues_dades() to authenticated;')).toHaveLength(1);
    expect(CODI.match(/\bgrant\b[^;]*;/gi)).toEqual(['grant execute on function public.exporta_les_meues_dades() to authenticated;']);
    expect([...CODI.matchAll(/create or replace function ([\w.]+)\(/g)].map((m) => m[1])).toEqual(['private.exporta_federacio_v1', 'public.exporta_les_meues_dades']);
    expect(CODI).not.toMatch(/create\s+(table|policy|index|unique index|trigger|view)|alter\s+table|drop\s+/i);
  });

  test('una transacció amb esperes curtes; capçalera amb NO aplicada i qui l’aplica', () => {
    expect(CODI.trimStart()).toMatch(/^begin;\nset local lock_timeout = '5s';\nset local statement_timeout = '60s';/);
    expect(CODI.match(/^\s*begin;\s*$/gim)).toHaveLength(1);
    expect(CODI.match(/^\s*commit;\s*$/gim)).toHaveLength(1);
    expect(CODI.trimEnd()).toMatch(/notify pgrst, 'reload schema';\s*commit;$/);
    for (const apartat of ['QUÈ FA:', 'QUÈ NO FA:', 'CODIS:', 'Depén de:', 'Verificació posterior (lectura):', 'Inversa:']) expect(CAPCALERA, apartat).toContain(apartat);
    expect(CAPCALERA).toMatch(/NO aplicada/);
    /* Abans d'aplicar, la propietària de l'RPC ha de ser qui aplica (P2-09-A2). */
    expect(CAPCALERA).toContain("pg_get_userbyid(p.proowner) = current_user as casen from pg_catalog.pg_proc p where p.oid = to_regprocedure('public.exporta_les_meues_dades()');");
    expect(CAPCALERA).toContain('as mateixa_propietaria;');
    expect(SQL.split('\n').filter((l) => l === "-- L'aplica el Mestre, mai un agent.")).toHaveLength(1);
    const ordre = readdirSync(new URL('supabase/migrations/', ARREL)).filter((f) => f.endsWith('.sql')).sort();
    expect(ordre.indexOf(NOM)).toBeGreaterThan(ordre.indexOf(ANTERIOR_NOM));
  });
});

describe('P2-09 · compatibilitat amb l’RPC i el client actuals', () => {
  test('fora del bloc de federació, l’RPC és la de 2610311900 caràcter a caràcter', () => {
    const blocVell = tros(RPC_ANTERIOR, '  -- Federació no versionada (directiva del Mestre)', '  end loop;\n');
    const esperada = RPC_ANTERIOR
      .replace(blocVell, BLOC_FEDERACIO)
      .replace(/ {2}v_taula {5}text;\n {2}v_propietat text;\n {2}v_tipus text;\n {2}v_propietats text\[\];\n {2}v_exportades text\[\];\n {2}v_projeccio text;\n {2}v_files {5}jsonb;\n/, '');
    expect(esperada).not.toBe(RPC_ANTERIOR);
    expect(RPC).toBe(esperada);
    expect(RPC).toContain("'format', 'socdepoble.exportacio.v1'");
    expect(RPC).toContain("'federacio_no_versionada', v_federacio");
    expect(RPC).toContain("raise exception 'SDP-EXPORT-000: cal la sessió iniciada.' using errcode = '42501';");
  });

  test('el que projecta el servidor és dins del contracte del client, amb la mateixa columna de propietat', () => {
    for (const recurs of TAULES_FEDERACIO_CONTRACTE) {
      const client = CONTRACTE_EXPORTACIO_FEDERACIO[recurs];
      const servidor = CONTRACTE.recursos[recurs];
      expect(servidor.propietari, recurs).toBe(client.columnaPropietat);
      expect(Object.keys(servidor.columnes).filter((c) => !client.columnesExportades.includes(c)), recurs).toEqual([]);
      expect(client.columnesExclosesPropietat, recurs).not.toContain(servidor.propietari);
    }
  });

  test('si falla la crida a la privada, cada recurs en diu el SQLSTATE i el client el conserva', () => {
    const rpc = senseComentaris(RPC);
    /* Una sola crida, dins d'un bloc que només captura permís i funció absent. */
    expect(rpc.match(/private\.exporta_federacio_v1\(/g)).toHaveLength(1);
    expect(rpc).toMatch(/\n {2}begin\n {4}v_federacio := private\.exporta_federacio_v1\(v_uid\);\n {2}exception when insufficient_privilege or undefined_function then\n/);
    const reserva = tros(rpc, 'exception when insufficient_privilege or undefined_function then', '  end;');
    expect([...reserva.matchAll(/'(\w+)', jsonb_build_object\('error', sqlstate\)/g)].map((m) => m[1])).toEqual([...TAULES_FEDERACIO_CONTRACTE]);
    expect(reserva).not.toMatch(/\bothers\b|_contracte/);
    /* El que arriba al client: els quatre errors, recurs per recurs. */
    for (const sqlstate of ['42501', '42883']) {
      const federacio = Object.fromEntries(TAULES_FEDERACIO_CONTRACTE.map((r) => [r, { error: sqlstate }]));
      const eixida = aplicaContracteExportacioFederacio({ format: 'socdepoble.exportacio.v1', federacio_no_versionada: federacio }, UID);
      expect(eixida.federacio_no_versionada, sqlstate).toEqual(federacio);
    }
    /* Per què no un error de primer nivell: el client el convertiria en {} sense dir res. */
    expect(aplicaContracteExportacioFederacio({ federacio_no_versionada: { error: '42501' } }, UID).federacio_no_versionada).toEqual({});
  });

  test('compte.js deixa passar sencera una resposta del servidor v1 i en conserva els errors', () => {
    const fila = (recurs, n) => Object.fromEntries(Object.entries(CONTRACTE.recursos[recurs].columnes).map(([columna, tipus]) => {
      if (columna === CONTRACTE.recursos[recurs].propietari) return [columna, UID];
      if (tipus[0] === 'uuid') return [columna, `00000000-0000-4000-8000-00000000000${n}`];
      if (tipus[0].startsWith('timestamp')) return [columna, '2026-11-01T18:00:00+00:00'];
      return [columna, `${recurs}.${columna}`];
    }));
    const federacio = {
      _contracte: CONTRACTE.esquema,
      realms: [fila('realms', 1)],
      user_realms: [fila('user_realms', 2), fila('user_realms', 3)],
      connections: { error: 'SDP-FED-ESQUEMA-NO-ADMES' },
      posts: { error: '42501' }
    };
    const eixida = aplicaContracteExportacioFederacio({ format: 'socdepoble.exportacio.v1', federacio_no_versionada: federacio }, UID);
    expect(eixida.federacio_no_versionada.realms).toEqual(federacio.realms);
    expect(eixida.federacio_no_versionada.user_realms).toEqual(federacio.user_realms);
    expect(eixida.federacio_no_versionada.connections).toEqual({ error: 'SDP-FED-ESQUEMA-NO-ADMES' });
    expect(eixida.federacio_no_versionada.posts).toEqual({ error: '42501' });
  });
});
