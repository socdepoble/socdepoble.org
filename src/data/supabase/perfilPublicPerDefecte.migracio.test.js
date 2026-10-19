// @vitest-environment node
/* Pla 261018_1605 (Tasca 1, D2; ordre del Mestre, 18-10-2026) · Prova estàtica
   de la migració 2610181800_perfil_public_per_defecte.sql: la fitxa d'una
   persona naix pública (profiles.is_public default true). No hi ha cap base de
   dades: es llig el SQL i es comprova que només canvia el default, en una
   transacció curta, sense backfill, sense tocar el CHECK de visibility ni cap
   funció, i la seua entrada al catàleg supabase/README.md. Patró de
   perfilUpdatePropi.migracio.test.js. La migració no l'executa cap prova: la
   llança el Mestre. */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

/* vitest s'executa des de l'arrel del repositori (com qualitat.test.js). */
const ARREL = process.cwd();
const NOM = '2610181800_perfil_public_per_defecte.sql';
const AQUEST = 'src/data/supabase/perfilPublicPerDefecte.migracio.test.js';
const MIGRACIONS = path.join(ARREL, 'supabase/migrations');
const SQL = readFileSync(path.join(MIGRACIONS, NOM), 'utf8');
/* Sense comentaris de línia: es comprova el codi, no la prosa. */
const CODI = SQL.split('\n').map((linia) => linia.replace(/--.*$/, '')).join('\n');
const CAPCALERA = SQL.slice(0, SQL.indexOf('\nbegin;'));
/* Les sentències del cos, sense espais sobrants, en minúscules. */
const SENTENCIES = CODI.split(';').map((s) => s.replace(/\s+/g, ' ').trim().toLowerCase()).filter(Boolean);

test('el nom segueix el format de les migracions i va després de 2610160250, l’última d’abans', () => {
  expect(NOM).toMatch(/^\d{10}_[a-z0-9_]+\.sql$/);
  const ordre = readdirSync(MIGRACIONS).filter((f) => f.endsWith('.sql')).sort();
  expect(ordre.indexOf(NOM)).toBeGreaterThan(ordre.indexOf('2610160250_perfil_update_propi.sql'));
  /* La columna que canvia la creen migracions d'abans. */
  expect(ordre.indexOf(NOM)).toBeGreaterThan(ordre.indexOf('2609110600_perfil_avatar_i_permisos.sql'));
  expect(ordre.indexOf(NOM)).toBeGreaterThan(ordre.indexOf('2610042350_convergencia_perfil_i_create_organization.sql'));
});

test('el cos és exactament el default nou, en una transacció curta amb la recàrrega de PostgREST', () => {
  expect(SENTENCIES).toEqual([
    'begin',
    "set local lock_timeout = '5s'",
    "set local statement_timeout = '60s'",
    'alter table public.profiles alter column is_public set default true',
    "notify pgrst, 'reload schema'",
    'commit'
  ]);
  expect(CODI).not.toMatch(/\brollback\b/i);
});

test('fora d’abast: cap backfill, cap CHECK de visibility, cap funció, política, permís ni columna', () => {
  expect(CODI).not.toMatch(/\bupdate\s+public\./i);
  expect(CODI).not.toMatch(/\b(insert into|delete from|truncate)\b/i);
  expect(CODI).not.toMatch(/\bvisibility\b/i);
  expect(CODI).not.toMatch(/\b(add|drop)\s+(constraint|column)\b/i);
  expect(CODI).not.toMatch(/\b(create|drop)\s+(or\s+replace\s+)?(function|policy|trigger|view|index|table|role)\b/i);
  expect(CODI).not.toMatch(/\balter\s+(function|policy|trigger|view|index|role)\b/i);
  expect(CODI).not.toMatch(/\b(grant|revoke)\b/i);
  expect(CODI).not.toMatch(/\bset default false\b/i);
  /* limitsText.test.js i organizations.test.js busquen l'última migració que
     fixa el lema, que redefinix create_organization o can_create_group (lligen
     el fitxer sencer, comentaris inclosos): esta no hi ha d'entrar. */
  for (const vetat of [/char_length\(lema\)/i, /char_length\(icon\)/i, /create_organization/i, /can_create_group/i]) {
    expect(SQL).not.toMatch(vetat);
  }
});

describe('la capçalera', () => {
  test('diu què fa, per què només el default, que NO està aplicada i quan s’aplica', () => {
    expect(SQL).toMatch(/^-- =+\n-- 261018_1800 · Pla 261018_1605 · Tasca 1 \(D2\) · /);
    expect(CAPCALERA).toMatch(/NO aplicada/);
    expect(CAPCALERA).toMatch(/mai un\s+(--\s+)?agent/);
    expect(CAPCALERA).toMatch(/DESPRÉS de les pendents del supabase\/README\.md/);
    expect(CAPCALERA).toMatch(/handle_new_user/);
    expect(CAPCALERA).toMatch(/completa_la_meua_alta/);
    expect(CAPCALERA).toMatch(/Cap backfill/);
    expect(CAPCALERA).toMatch(/visibility = 'private'/);
  });

  test('porta la consulta de només lectura per a comprovar-la i la sentència per a desfer-la', () => {
    expect(CAPCALERA).toMatch(/select column_name, column_default, is_nullable from information_schema\.columns\s+(--\s+)?where table_schema = 'public' and table_name = 'profiles' and column_name = 'is_public';/);
    expect(CAPCALERA).toMatch(/alter table public\.profiles alter column is_public set default false;/);
  });
});

test('el catàleg supabase/README.md la nomena després de 2610160250 i abans de seed.sql, NO aplicada', () => {
  const readme = readFileSync(path.join(ARREL, 'supabase/README.md'), 'utf8');
  const posicio = readme.indexOf(`migrations/${NOM}`);
  expect(posicio, 'falta l’entrada al README').toBeGreaterThanOrEqual(0);
  expect(posicio).toBeGreaterThan(readme.indexOf('migrations/2610160250_perfil_update_propi.sql'));
  expect(posicio).toBeLessThan(readme.indexOf('- `seed.sql`'));
  const entrada = readme.slice(posicio).split('\n\n')[0];
  expect(entrada).toMatch(/Pla 261018_1605 \(Tasca 1, D2/);
  expect(entrada).toMatch(/\*\*NO aplicada: l'aplica el Mestre, mai un agent\*\*/);
  expect(entrada).toMatch(/set default true/);
  expect(entrada).toMatch(/Cap backfill/);
  expect(entrada).toMatch(/set default\s+false/);
  expect(entrada).not.toMatch(/offline-first|local-first/i);
});

test('higiene de fitxer: una sola línia buida final i cap vocabulari prohibit', () => {
  expect(SQL.endsWith(';\n') && !SQL.endsWith('\n\n')).toBe(true);
  expect(SQL).not.toMatch(/offline-first|local-first/i);
});

describe('ESLint', () => {
  test('zero missatges, avisos inclosos', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles([path.join(ARREL, AQUEST)]);
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(1);
    expect(missatges).toEqual([]);
  }, 120000);
});
