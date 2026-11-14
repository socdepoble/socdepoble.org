import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const MIG_DIR = path.join(ARREL, 'supabase/migrations');

test('T4 (CODEX-R24.2-T1-02): la migració 20261114171500 imposa octet_length <= 4096 idempotent amb NOT VALID + VALIDATE sobre totes les taules i columnes R23', () => {
  const ruta = path.join(MIG_DIR, '20261114171500_r25_2_r23_octet_length_bounds.sql');
  assert.ok(fs.existsSync(ruta), 'La migració 20261114171500 ha d’existir');
  const sql = fs.readFileSync(ruta, 'utf8');

  assert.match(sql, /^begin;/m);
  assert.match(sql, /set local lock_timeout\s*=\s*'5s';/i);
  assert.match(sql, /^commit;/m);

  // Totes tres taules reals de R23 tenen DROP IF EXISTS + ADD NOT VALID + VALIDATE
  for (const [taula, restriccio] of [
    ['public.refranys_poble', 'refranys_poble_octets_bounds'],
    ['public.aportacions_veu_poble', 'aportacions_veu_poble_octets_bounds'],
    ['public.joc_isoglosses_vots_consens', 'joc_isoglosses_vots_consens_octets_bounds'],
  ]) {
    assert.match(sql, new RegExp(`alter table ${taula.replace('.', '\\.')}\\s+drop constraint if exists ${restriccio};`, 'i'));
    assert.match(sql, new RegExp(`alter table ${taula.replace('.', '\\.')}\\s+add constraint ${restriccio}[\\s\\S]*?not valid;`, 'i'));
    assert.match(sql, new RegExp(`alter table ${taula.replace('.', '\\.')}\\s+validate constraint ${restriccio};`, 'i'));
  }

  // Tots els límits d'octet_length estan per sota o iguals al sostre màxim de 4096 bytes
  const limits = [...sql.matchAll(/octet_length\([^)]+\)\s*<=\s*(\d+)/gi)].map((m) => Number(m[1]));
  assert.ok(limits.length >= 15, `Cal cobrir totes les columnes de text lliure R23 (trobades: ${limits.length})`);
  for (const n of limits) {
    assert.ok(n > 0 && n <= 4096, `Límit d’octets fora de rang: ${n}`);
  }

  // Coherència amb els esquemes de 20261113233000 i 20261114023000
  const r23a = fs.readFileSync(path.join(MIG_DIR, '20261113233000_refranyer_sonor_i_aportacions_dialectals.sql'), 'utf8');
  const r23b = fs.readFileSync(path.join(MIG_DIR, '20261114023000_joc_isoglosses_consens_comarcal.sql'), 'utf8');
  for (const col of ['text_refrany', 'text_aportat', 'poble_comarca', 'audio_storage_path', 'paraula_etiqueta']) {
    assert.ok(r23a.includes(col) || r23b.includes(col), `Columna R23 real: ${col}`);
    assert.match(sql, new RegExp(`octet_length\\(${col}\\)\\s*<=\\s*\\d+`, 'i'));
  }
});

/* Onada R26 · coherència dels sostres amb els límits reals de R23 i estat documentat al README. */

function limitsR23(sqls) {
  const caracters = new Map();
  const ascii = new Map();
  for (const sql of sqls) {
    const blocs = [
      ...[...sql.matchAll(/create table if not exists public\.(\w+)\s*\(([\s\S]*?)\n\);/gi)].map((m) => [m[1], m[2]]),
      ...[...sql.matchAll(/alter table public\.(\w+)\s+add constraint \w+\s+check\s*\(([\s\S]*?)\);/gi)].map((m) => [m[1], m[2]]),
    ];
    for (const [taula, cos] of blocs) {
      for (const m of cos.matchAll(/char_length\((\w+)\)\s*<=\s*(\d+)/gi)) caracters.set(`${taula}.${m[1]}`, Number(m[2]));
      for (const m of cos.matchAll(/(\w+)\s*~\s*'\^\[[^\]]*\]\{\d+,(\d+)\}\$'/g)) ascii.set(`${taula}.${m[1]}`, Number(m[2]));
    }
  }
  return { caracters, ascii };
}

test('R26 · cada sostre d\'octets és exactament 4 × el límit de caràcters R23 (o cobrix el límit ASCII) i cap columna limitada queda fora', () => {
  const sql = fs.readFileSync(path.join(MIG_DIR, '20261114171500_r25_2_r23_octet_length_bounds.sql'), 'utf8');
  const { caracters, ascii } = limitsR23([
    fs.readFileSync(path.join(MIG_DIR, '20261113233000_refranyer_sonor_i_aportacions_dialectals.sql'), 'utf8'),
    fs.readFileSync(path.join(MIG_DIR, '20261114023000_joc_isoglosses_consens_comarcal.sql'), 'utf8'),
  ]);
  const sostres = new Map();
  for (const m of sql.matchAll(/alter table public\.(\w+)\s+add constraint \w+\s+check\s*\(([\s\S]*?)\)\s*not valid;/gi)) {
    for (const o of m[2].matchAll(/octet_length\((\w+)(?:::text)?\)\s*<=\s*(\d+)/gi)) sostres.set(`${m[1]}.${o[1]}`, Number(o[2]));
  }
  assert.ok(caracters.size >= 10, `Límits R23 llegits: ${[...caracters.keys()]}`);
  for (const [columna, n] of caracters) {
    assert.equal(sostres.get(columna), 4 * n, `${columna}: char_length <= ${n} exigix octet_length <= ${4 * n}`);
  }
  for (const [columna, n] of ascii) {
    if (caracters.has(columna)) continue;
    assert.ok(sostres.get(columna) >= n, `${columna}: el límit ASCII ${n} no pot quedar per damunt del sostre`);
  }
  const senseLimitPrevi = [...sostres.keys()].filter((c) => !caracters.has(c) && !ascii.has(c));
  assert.deepEqual(senseLimitPrevi, ['refranys_poble.explicacio_i18n'], 'Només el JSONB rep un sostre nou efectiu');
  assert.equal(sostres.get('refranys_poble.explicacio_i18n'), 4096);
});

test('R26 · supabase/README.md llista 20261114171500 com a NO aplicada, l\'aplica el Mestre', () => {
  const readme = fs.readFileSync(path.join(ARREL, 'supabase/README.md'), 'utf8');
  assert.match(readme, /^- `migrations\/20261114171500_r25_2_r23_octet_length_bounds\.sql`$/m);
  const fila = readme.split('\n').find((l) => l.includes('`20261114171500_r25_2_r23_octet_length_bounds.sql`') && l.startsWith('|'));
  assert.ok(fila, 'Falta la fila de la taula canònica');
  assert.match(fila, /\*\*NO aplicada: [^*]*l'aplica el Mestre\*\*/);
});
