// @vitest-environment node
/* IDEA-61 (T0, prompt 261102_1532; carril L1) · Prova estàtica de la migració
   2611021800_notes_fitxa_ambit.sql: la columna `notes.fitxa` (jsonb) de la
   fitxa d'àmbit del Flux Universal de Publicació. No hi ha cap base de dades:
   es llig el SQL i es comprova que només afig la columna amb el seu CHECK
   lleuger i el comentari, en una transacció curta, sense cap política, permís,
   funció ni backfill; la capçalera; l'entrada al catàleg supabase/README.md
   (vinyeta i fila de la taula canònica); i la paritat amb el client (la
   columna opcional de notes.js i el vocabulari del contracte). Patró de
   perfilPublicPerDefecte.migracio.test.js. La migració no l'executa cap prova:
   la llança el Mestre. */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

/* vitest s'executa des de l'arrel del repositori (com qualitat.test.js). */
const ARREL = process.cwd();
const NOM = '2611021800_notes_fitxa_ambit.sql';
const VERSIO = NOM.slice(0, 10);
const MIGRACIONS = path.join(ARREL, 'supabase/migrations');
const SQL = readFileSync(path.join(MIGRACIONS, NOM), 'utf8');
const README = readFileSync(path.join(ARREL, 'supabase/README.md'), 'utf8');
const CONTRACTE = readFileSync(path.join(ARREL, 'src/utils/publicacioUniversal.js'), 'utf8');
const NOTES_JS = readFileSync(path.join(ARREL, 'src/data/supabase/notes.js'), 'utf8');
/* Porta Psicopatia · El vocabulari de les doctrines retirades es compon a
   trossos (convenció de src/config/qualitat.amfitrio.test.js). */
const DOCTRINA_RETIRADA = new RegExp(['off', 'line-first|lo', 'cal-first'].join(''), 'i');
/* Sense comentaris de línia: es comprova el codi, no la prosa. */
const CODI = SQL.split('\n').map((linia) => linia.replace(/--.*$/, '')).join('\n');
const CAPCALERA = SQL.slice(0, SQL.indexOf('\nbegin;'));
/* Les sentències del cos, sense espais sobrants, en minúscules. */
const SENTENCIES = CODI.split(';').map((s) => s.replace(/\s+/g, ' ').trim().toLowerCase()).filter(Boolean);
const CONSULTA_POSTERIOR = "select exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'notes' and column_name = 'fitxa') as te_fitxa, exists (select 1 from pg_constraint where conname = 'notes_fitxa_objecte') as te_check;";

/* Una llista del contracte (AMBITS, ESTATS), llegida del text: cap importació
   de src/ en un entorn node. */
const llistaDelContracte = (nom) => [...(CONTRACTE.match(new RegExp(`export const ${nom} = Object\\.freeze\\(\\[([^\\]]*)\\]\\)`)) ?? ['', ''])[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);

test('el nom segueix el format de les migracions, és únic pel prefix i va després de 2611020417 (l’última d’abans) i de la taula notes', () => {
  expect(NOM).toMatch(/^\d{10}_[a-z0-9_]+\.sql$/);
  const ordre = readdirSync(MIGRACIONS).filter((f) => f.endsWith('.sql')).sort();
  expect(ordre.filter((f) => f.startsWith(VERSIO))).toEqual([NOM]);
  expect(ordre.indexOf(NOM)).toBeGreaterThan(ordre.indexOf('2611020417_xat_avisos_push.sql'));
  expect(ordre.indexOf(NOM)).toBeGreaterThan(ordre.indexOf('2609140000_schema_notes.sql'));
  expect(ordre.indexOf(NOM)).toBeGreaterThan(ordre.indexOf('2609272100_notes_origen.sql'));
});

test('el cos és exactament la columna amb el seu CHECK i el comentari, en una transacció curta amb la recàrrega de PostgREST', () => {
  expect(SENTENCIES).toHaveLength(7);
  expect(SENTENCIES.slice(0, 4)).toEqual([
    'begin',
    "set local lock_timeout = '5s'",
    "set local statement_timeout = '60s'",
    "alter table public.notes add column if not exists fitxa jsonb constraint notes_fitxa_objecte check (fitxa is null or jsonb_typeof(fitxa) = 'object')"
  ]);
  expect(SENTENCIES[4]).toMatch(/^comment on column public\.notes\.fitxa is 'idea-61 · /);
  expect(SENTENCIES.slice(5)).toEqual(["notify pgrst, 'reload schema'", 'commit']);
  expect(CODI).not.toMatch(/\brollback\b/i);
  /* El mateix patró que notes.origen (2609272100): un jsonb amb el CHECK de forma. */
  const origen = readFileSync(path.join(MIGRACIONS, '2609272100_notes_origen.sql'), 'utf8');
  expect(origen).toMatch(/jsonb_typeof\(origen\) = 'object'/);
  expect(CODI).toMatch(/jsonb_typeof\(fitxa\) = 'object'/);
});

test('el comentari de la columna diu el vocabulari del contracte: els àmbits verticals i els estats', () => {
  const ambits = llistaDelContracte('AMBITS').filter((ambit) => ambit !== 'mur');
  const estats = llistaDelContracte('ESTATS');
  expect(ambits).toEqual(['mercat', 'vehicle', 'treball', 'habitatge']);
  expect(estats).toEqual(['disponible', 'reservat', 'complet', 'tancat']);
  expect(CODI).toContain(`ambit: ${ambits.join(' | ')}`);
  expect(CODI).toContain(`estat: ${estats.join(' | ')}`);
});

test('fora d’abast: cap backfill, política, permís, funció, disparador, índex ni cap altra taula', () => {
  expect(CODI).not.toMatch(/\bupdate\s+public\./i);
  expect(CODI).not.toMatch(/\b(insert into|delete from|truncate)\b/i);
  expect(CODI).not.toMatch(/\b(create|drop)\s+(or\s+replace\s+)?(function|policy|trigger|view|index|table|role)\b/i);
  expect(CODI).not.toMatch(/\balter\s+(function|policy|trigger|view|index|role)\b/i);
  expect(CODI).not.toMatch(/\b(grant|revoke)\b/i);
  expect(CODI).not.toMatch(/section_submissions/i);
  expect(CODI.match(/\balter table\b/gi)).toHaveLength(1);
  /* limitsText.test.js i organizations.test.js busquen l'última migració que
     fixa el lema o que redefinix create_organization o can_create_group. */
  for (const vetat of [/char_length\(lema\)/i, /char_length\(icon\)/i, /create_organization/i, /can_create_group/i]) {
    expect(SQL).not.toMatch(vetat);
  }
});

describe('la capçalera', () => {
  test('diu per què, què fa, què no fa, de què depén, l’ordre, i que NO està aplicada en una sola línia', () => {
    expect(SQL).toMatch(/^-- =+\n-- 261102_1800 · IDEA-61 \(T0, prompt 261102_1532; carril L1\) · Notes: la fitxa\n/);
    for (const apartat of [/^-- PER QUÈ: /m, /^-- QUÈ FA:$/m, /^-- QUÈ NO FA:$/m, /^-- Depén de: 2609140000/m, /^-- ORDRE: additiva i idempotent/m, /^-- Verificació posterior \(lectura\):$/m]) {
      expect(CAPCALERA).toMatch(apartat);
    }
    expect(SQL.split('\n').filter((l) => l === "-- NO aplicada: l'aplica el Mestre, mai un agent.")).toHaveLength(1);
    expect(CAPCALERA).toContain('-- Idempotent i en una sola transacció.');
    expect(CAPCALERA).toContain('coaccionaAmbit');
    expect(CAPCALERA).toContain('src/data/supabase/notesFitxa.migracio.test.js');
  });

  test('porta la consulta de només lectura per a comprovar-la i la sentència per a desfer-la', () => {
    expect(CAPCALERA).toContain(`--   ${CONSULTA_POSTERIOR}`);
    expect(CAPCALERA).toContain('-- Per a desfer-la: alter table public.notes drop column if exists fitxa;');
  });
});

describe('el catàleg supabase/README.md', () => {
  test('la vinyeta va després de 2611020417 i abans de seed.sql, diu NO aplicada, la prova i la verificació', () => {
    const posicio = README.indexOf(`- \`migrations/${NOM}\``);
    expect(posicio, 'falta l’entrada al README').toBeGreaterThanOrEqual(0);
    expect(posicio).toBeGreaterThan(README.indexOf('- `migrations/2611020417_xat_avisos_push.sql`'));
    expect(posicio).toBeLessThan(README.indexOf('- `seed.sql`'));
    const entrada = README.slice(posicio).split('\n\n')[0].replace(/\s+/g, ' ');
    expect(entrada).toContain('IDEA-61 (T0, prompt 261102_1532');
    expect(entrada).toContain("**NO aplicada: l'aplica el Mestre, mai un agent**");
    expect(entrada).toContain('Idempotent i en una sola transacció');
    expect(entrada).toContain('`notes_fitxa_objecte`');
    expect(entrada).toContain('`src/data/supabase/notesFitxa.migracio.test.js`');
    expect(entrada).toContain(`Verificació posterior (lectura): \`${CONSULTA_POSTERIOR}\``);
    expect(entrada).toContain('`alter table public.notes drop column if exists fitxa;`');
    expect(entrada).not.toMatch(DOCTRINA_RETIRADA);
  });

  test('la fila de la taula canònica, única i amb el número següent al de 2611020417', () => {
    const files = README.split('\n').filter((l) => l.startsWith('| ') && l.includes(`\`${NOM}\``));
    expect(files).toHaveLength(1);
    const fila = files[0].match(/^\| (\d+) \| `(\d{10})` \| `([^`]+)` \| \*\*NO aplicada: l'aplica el Mestre\*\* \| [^|]+ \|$/);
    expect(fila, 'la forma de la fila').not.toBeNull();
    expect(fila[2]).toBe(VERSIO);
    expect(fila[3]).toBe(NOM);
    const anterior = README.split('\n').find((l) => l.startsWith('| ') && l.includes('`2611020417_xat_avisos_push.sql`'));
    expect(Number(fila[1])).toBe(Number(anterior.match(/^\| (\d+) \|/)[1]) + 1);
  });

  test('no és cap fantasma de supabase/ordre_desplegament.json', () => {
    const ordre = JSON.parse(readFileSync(path.join(ARREL, 'supabase/ordre_desplegament.json'), 'utf8'));
    expect((ordre.fantasmes ?? []).map((f) => f.versio)).not.toContain(VERSIO);
  });
});

test('paritat amb el client: notes.js tracta `fitxa` com a columna opcional (quarantena fins que s’aplique) i la coacciona pel contracte', () => {
  expect(NOTES_JS).toMatch(/creaColumnesOpcionals\('notes', \{[^}]*\bfitxa: 'fitxa'[^}]*\}\)/);
  expect(NOTES_JS).toContain("import { coaccionaAmbit, esFitxaDAmbit } from '../../utils/publicacioUniversal.js';");
  /* Com publish_date: el resum no demana la columna, perquè una base sense la migració servisca el Bloc. */
  expect(NOTES_JS.match(/^const SUMMARY_COLUMNS = '([^']*)';$/m)[1].split(',')).not.toContain('fitxa');
});

test('higiene de fitxer: una sola línia buida final i cap vocabulari prohibit', () => {
  expect(SQL.endsWith(';\n') && !SQL.endsWith('\n\n')).toBe(true);
  expect(SQL).not.toMatch(DOCTRINA_RETIRADA);
  expect(SQL).not.toMatch(/PROTOTIP|HHMM/);
});
