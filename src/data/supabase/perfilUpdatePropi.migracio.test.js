// @vitest-environment node
/* Onada 1.1 (261016, Gauntlet nocturn; pla 261016_0015 §3, prompt Bloc 3.5.3)
   · Prova estàtica de la migració 2610160250_perfil_update_propi.sql: el 403
   (42501, «permission denied for table profiles») del PATCH de la fitxa. No
   hi ha cap base de dades: es llig el SQL i es comproven la guarda de la RLS,
   la paritat dels permisos amb el client (CAMPS_PERFIL de auth.js), una sola
   política d'UPDATE propi, que no toca res fora d'abast (lectura, anon,
   dades, esquema, rols, create_organization) i la seua entrada al catàleg
   supabase/README.md. Patró de
   personalitzacio.migracio.test.js i de
   tests/migracio-convergencia-perfil.test.mjs; l'ESLint del fitxer, com els
   qualitat*.test.js. La migració no l'executa cap prova: la llança el Mestre. */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

/* vitest s'executa des de l'arrel del repositori (com qualitat.test.js). */
const ARREL = process.cwd();
const NOM = '2610160250_perfil_update_propi.sql';
const AQUEST = 'src/data/supabase/perfilUpdatePropi.migracio.test.js';
const MIGRACIONS = path.join(ARREL, 'supabase/migrations');
const SQL = readFileSync(path.join(MIGRACIONS, NOM), 'utf8');
/* Porta Psicopatia · El vocabulari de les doctrines retirades es compon a
   trossos (convenció de src/config/qualitat.amfitrio.test.js): la porta que
   llig src/ no pren esta prova negativa per la doctrina mateixa. */
const DOCTRINA_RETIRADA = new RegExp(['off', 'line-first|lo', 'cal-first'].join(''), 'i');
/* Sense comentaris de línia: es comprova el codi, no la prosa. */
const CODI = SQL.split('\n').map((linia) => linia.replace(/--.*$/, '')).join('\n');
const CAPCALERA = SQL.slice(0, SQL.indexOf('\nbegin;'));
const SENSE_ESPAIS = (text) => text.replace(/\s+/g, ' ').trim().toLowerCase();

/* La llista del client, llegida del fitxer font: si algú hi afig un camp, esta
   prova obliga a decidir si la reparació també n'ha de donar el permís. */
function campsPerfilDelClient() {
  const font = readFileSync(path.join(ARREL, 'src/data/supabase/auth.js'), 'utf8');
  const llista = /const CAMPS_PERFIL = Object\.freeze\(\[([^\]]*)\]\);/.exec(font);
  expect(llista, 'falta CAMPS_PERFIL a auth.js').toBeTruthy();
  return [...llista[1].matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
}

test('el nom segueix el format de les migracions i va després de 2610042350 i de 2610101900', () => {
  expect(NOM).toMatch(/^\d{10}_[a-z0-9_]+\.sql$/);
  const ordre = readdirSync(MIGRACIONS).filter((f) => f.endsWith('.sql')).sort();
  expect(ordre.indexOf(NOM)).toBeGreaterThan(ordre.indexOf('2610042350_convergencia_perfil_i_create_organization.sql'));
  expect(ordre.indexOf(NOM)).toBeGreaterThan(ordre.indexOf('2610101900_personalitzacio_superadmin.sql'));
});

/* Com les germanes (personalitzacio.migracio.test.js, migracio-convergencia-perfil.test.mjs):
   el catàleg la nomena al seu lloc i diu el que el Mestre ha de saber abans d'aplicar-la. */
test('el catàleg supabase/README.md la nomena després de 2610101900, NO aplicada, amb el 42501 de privilegis i sense reaplicar les senceres', () => {
  const readme = readFileSync(path.join(ARREL, 'supabase/README.md'), 'utf8');
  const posicio = readme.indexOf(`migrations/${NOM}`);
  expect(posicio, 'falta l’entrada al README').toBeGreaterThanOrEqual(0);
  expect(posicio).toBeGreaterThan(readme.indexOf('migrations/2610101900_personalitzacio_superadmin.sql'));
  expect(posicio).toBeLessThan(readme.indexOf('- `seed.sql`'));
  const entrada = readme.slice(posicio).split('\n\n')[0];
  expect(entrada).toMatch(/Onada 1\.1[\s\S]*?Bloc 3\.5\.3/);
  expect(entrada).toMatch(/\*\*NO aplicada/);
  expect(entrada).toMatch(/42501 és de privilegis de\s+columna, no de RLS/);
  expect(entrada).toMatch(/No torneu a executar 2609110600 ni 2610042350\s+senceres/);
  expect(entrada).toMatch(/quatre consultes de només\s+lectura de la capçalera/);
});

/* Correcció del Gauntlet (261016, troballa P3): l'entrada lligava la reparació
   urgent a aplicar abans totes les pendents en ordre alfabètic, incloses
   2610042350 (la que ella mateixa diu que no s'ha de reexecutar sencera) i
   2610081543 (que demana un pla de reconsentiment previ). La migració només
   necessita la RLS i les columnes de CAMPS_PERFIL, i eixes columnes les creen
   migracions que el catàleg no marca com a pendents. L'entrada ho ha de dir. */
const ORIGEN_DE_LES_COLUMNES = Object.freeze({
  2609080000: ['full_name', 'visibility'],
  2609110600: ['avatar_url', 'town_name', 'bio', 'is_public'],
  2609261500: ['lema', 'presentacio_html', 'hero_url'],
  2609262232: ['copyright'],
  2609282035: ['icon']
});
test('el catàleg la declara independent de les pendents i nomena les migracions de les columnes, cap d’elles pendent', () => {
  const readme = readFileSync(path.join(ARREL, 'supabase/README.md'), 'utf8');
  const entradaDe = (versio) => {
    const posicio = readme.indexOf(`migrations/${versio}_`);
    return posicio < 0 ? null : readme.slice(posicio).split('\n\n')[0];
  };
  const entrada = entradaDe(NOM.slice(0, 10));
  expect(SENSE_ESPAIS(entrada)).not.toMatch(/després de (totes )?les pendents/);
  expect(entrada).toMatch(/No depén de cap altra pendent d'esta\s+llista/);
  expect(entrada).toMatch(/SDP-PERFIL-020[\s\S]*?SDP-PERFIL-021/);
  /* Si el client afig un camp, cal dir d'on ix la seua columna. */
  expect(Object.values(ORIGEN_DE_LES_COLUMNES).flat().sort()).toEqual([...campsPerfilDelClient()].sort());
  const fitxers = readdirSync(MIGRACIONS).filter((f) => f.endsWith('.sql'));
  for (const [versio, columnes] of Object.entries(ORIGEN_DE_LES_COLUMNES)) {
    const fitxer = fitxers.find((f) => f.startsWith(`${versio}_`));
    expect(fitxer, versio).toBeTruthy();
    expect(fitxer < NOM, versio).toBe(true);
    const sql = readFileSync(path.join(MIGRACIONS, fitxer), 'utf8');
    for (const columna of columnes) {
      expect(sql, `${versio} · ${columna}`).toMatch(new RegExp(
        `alter table public\\.profiles\\s+add column (if not exists )?${columna}\\b|create table if not exists public\\.profiles \\([\\s\\S]*?\\b${columna} text\\b`, 'i'));
    }
    expect(entrada, versio).toContain(versio);
    const seua = entradaDe(versio);
    if (seua) expect(seua, versio).not.toMatch(/no aplicada/i);
  }
});

describe('la capçalera', () => {
  test('diu què fa, que NO està aplicada i quan s’aplica', () => {
    expect(SQL).toMatch(/^-- =+\n-- 261016_0250 · Onada 1\.1 · Bloc 3\.5\.3 · /);
    expect(CAPCALERA).toMatch(/NO aplicada/);
    expect(CAPCALERA).toMatch(/DESPRÉS de les pendents del supabase\/README\.md/);
  });

  test('explica per què el 42501 és de privilegis i no de RLS', () => {
    expect(CAPCALERA).toMatch(/permission denied for table profiles/);
    expect(CAPCALERA).toMatch(/new row\s+(--\s+)?violates row-level security policy/);
    expect(CAPCALERA).toMatch(/zero files, sense error/);
    expect(CAPCALERA).toMatch(/la política sola de l'ordre[\s\S]*?no cura este error/);
    /* Per què no es tornen a executar les migracions completes. */
    expect(CAPCALERA).toMatch(/2609110600[\s\S]*?using \(true\) per a anon/);
    expect(CAPCALERA).toMatch(/2610042350[\s\S]*?create_organization/);
  });

  test('porta les quatre consultes de només lectura que permeten desfer-la', () => {
    for (const consulta of [
      /select relrowsecurity, relforcerowsecurity from pg_catalog\.pg_class/,
      /select policyname, permissive, roles, cmd, qual, with_check from pg_catalog\.pg_policies/,
      /select column_name, privilege_type from information_schema\.column_privileges/,
      /select version from supabase_migrations\.schema_migrations/
    ]) expect(CAPCALERA).toMatch(consulta);
    expect(CAPCALERA).toMatch(/Mai cap retirada de la taula sencera/);
  });
});

test('una sola transacció amb temps d’espera curts, recàrrega de PostgREST i commit; cap rollback', () => {
  expect(CODI.trimStart()).toMatch(/^begin;/i);
  expect((CODI.match(/^\s*begin;\s*$/gim) || []).length).toBe(1);
  expect((CODI.match(/^\s*commit;\s*$/gim) || []).length).toBe(1);
  expect(CODI).toMatch(/begin;\s*set local lock_timeout = '5s';\s*set local statement_timeout = '60s';/i);
  expect(CODI).toMatch(/notify pgrst, 'reload schema';\s*commit;\s*$/i);
  expect(CODI).not.toMatch(/\brollback\b/i);
});

test('guarda: la taula i la RLS activa es comproven abans de cap permís o política, i avorten (SDP-PERFIL-020)', () => {
  const taula = CODI.search(/if pg_catalog\.to_regclass\('public\.profiles'\) is null then\s+raise exception 'SDP-PERFIL-020:/i);
  const rls = CODI.search(/if not exists \(select 1 from pg_catalog\.pg_class\s+where oid = pg_catalog\.to_regclass\('public\.profiles'\) and relrowsecurity\) then\s+raise exception 'SDP-PERFIL-020:/i);
  expect(taula, 'falta la guarda de la taula').toBeGreaterThan(0);
  expect(rls, 'falta la guarda de la RLS').toBeGreaterThan(taula);
  expect(CODI.search(/grant update/i)).toBeGreaterThan(rls);
  expect(CODI.search(/drop policy/i)).toBeGreaterThan(rls);
  expect(CODI.search(/create policy/i)).toBeGreaterThan(rls);
});

describe('permisos de columna', () => {
  test('paritat: el bucle és exactament CAMPS_PERFIL del client, en el mateix ordre', () => {
    const bucle = /foreach v_columna in array array\[([^\]]*)\] loop/i.exec(CODI);
    expect(bucle, 'falta el bucle de permisos').toBeTruthy();
    const columnes = [...bucle[1].matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
    expect(columnes).toEqual(campsPerfilDelClient());
    /* Les columnes que el client no escriu mai no hi entren. */
    for (const vetada of ['id', 'baixa_demanada_at', 'consentiment_rgpd_at', 'role', 'tenant_id']) {
      expect(columnes, vetada).not.toContain(vetada);
    }
  });

  test('cada permís va guardat per information_schema.columns i només és UPDATE de columna per a authenticated', () => {
    expect(CODI).toMatch(/if exists \(select 1 from information_schema\.columns\s+where table_schema = 'public' and table_name = 'profiles' and column_name = v_columna\) then\s+execute format\('grant update \(%I\) on table public\.profiles to authenticated', v_columna\);\s+else\s+raise notice 'SDP-PERFIL-021:/i);
    expect((CODI.match(/\bgrant\b/gi) || []).length, 'un sol grant, el del bucle').toBe(1);
    expect(CODI).not.toMatch(/grant (select|insert|delete|all|execute|usage)/i);
    expect(CODI).not.toMatch(/\brevoke\b/i);
    expect(CODI).not.toMatch(/\banon\b/i);
  });
});

describe('la política d’UPDATE propi', () => {
  const POLITIQUES = [...CODI.matchAll(/create policy "([^"]+)" on public\.profiles\s+([\s\S]*?);/gi)]
    .map((m) => ({ nom: m[1], cos: SENSE_ESPAIS(m[2]) }));

  test('una sola: «profiles update own», permissiva, auth.uid() = id al USING i al WITH CHECK', () => {
    expect(POLITIQUES.map((p) => p.nom)).toEqual(['profiles update own']);
    expect(POLITIQUES[0].cos).toBe('for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id)');
    expect(CODI).not.toMatch(/as restrictive/i);
    expect(CODI).not.toMatch(/\balter policy\b/i);
  });

  test('es torna a crear sencera i esborra abans el nom de l’ordre, perquè no en queden dues d’equivalents', () => {
    expect(CODI).toMatch(/drop policy if exists "Users can update own profile" on public\.profiles;\s*drop policy if exists "profiles update own" on public\.profiles;\s*create policy "profiles update own"/i);
    const drops = [...CODI.matchAll(/drop policy (if exists )?"([^"]+)"/gi)];
    expect(drops.map((m) => m[2])).toEqual(['Users can update own profile', 'profiles update own']);
    expect(drops.every((m) => m[1]), 'cada drop porta if exists').toBe(true);
  });

  test('no toca les altres polítiques de profiles: lectura, alta i baixa', () => {
    for (const nom of ['profiles read own', 'profiles insert own private', 'profiles sense baixa']) {
      expect(CODI, nom).not.toContain(`"${nom}"`);
    }
    expect(CODI).not.toMatch(/using\s*\(\s*true\s*\)/i);
    expect(CODI).not.toMatch(/with\s+check\s*\(\s*true\s*\)/i);
  });
});

test('diagnòstic sense canvis: SDP-PERFIL-022 (lectura del RETURNING) i SDP-PERFIL-023 (altres permissives)', () => {
  expect(CODI).toMatch(/not pg_catalog\.has_column_privilege\('authenticated', a\.attrelid, a\.attnum, 'SELECT'\);\s+if v_sense_lectura is not null then\s+raise warning 'SDP-PERFIL-022:/i);
  expect(CODI).toMatch(/p\.polcmd in \('w', '\*'\) and p\.polname <> 'profiles update own';\s+if v_altres is not null then\s+raise notice 'SDP-PERFIL-023:/i);
  const codis = new Set([...CODI.matchAll(/'(SDP-PERFIL-\d{3}):/g)].map((m) => m[1]));
  expect([...codis].sort()).toEqual(['SDP-PERFIL-020', 'SDP-PERFIL-021', 'SDP-PERFIL-022', 'SDP-PERFIL-023']);
});

test('fora d’abast: cap dada, columna, restricció, taula, funció, vista, trigger, rol ni create_organization', () => {
  expect(CODI).not.toMatch(/\b(alter table|add column|drop column|add constraint|drop constraint|create table|drop table|truncate|delete from|insert into|update public\.)/i);
  expect(CODI).not.toMatch(/\b(create|drop)\s+(or\s+replace\s+)?(function|view|trigger|index)\b/i);
  expect(CODI).not.toMatch(/\b(create|alter|drop) role\b|\bset role\b/i);
  expect(CODI).not.toMatch(/create_organization/i);
  /* limitsText.test.js busca l'última migració amb char_length(lema) o que
     redefinix create_organization (llig el fitxer sencer): esta no hi entra. */
  expect(SQL).not.toMatch(/char_length\(lema\)/i);
  expect(SQL).not.toMatch(/create\s+or\s+replace\s+function\s+public\.create_organization\b/i);
});

test('higiene de fitxer: una sola línia buida final i cap vocabulari prohibit', () => {
  expect(SQL.endsWith(';\n') && !SQL.endsWith('\n\n')).toBe(true);
  expect(SQL).not.toMatch(DOCTRINA_RETIRADA);
});

describe('ESLint', () => {
  test('zero missatges, avisos inclosos', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles([path.join(ARREL, AQUEST)]);
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(1);
    expect(missatges).toEqual([]);
    // Sonda: la configuració del projecte és activa (un avís compta com a error).
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, 'src/data/supabase/sonda.js') });
    expect(sonda.messages.map((m) => m.ruleId)).toEqual(['no-unused-vars', 'eol-last']);
  }, 120000);
});
