// @vitest-environment node
/* O6 · SDP-RGPD-021: la 2.4 s'afig en una migració nova; la 2.3 aplicada
   queda immutable. No hi ha DB ni execució SQL en esta prova estàtica. */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
/* Onada R9 · C3 · /legal ja és la 2.5 (2611061520, politicaPrivacitat25.migracio.test.js): la 2.4
   es prova com a versió segellada i immutable, contra la seua empremta i no contra el text viu. */
const SHA_24 = '2956bc30112b2e8d097815d502f9cd711e9ee0c213c5c73634340d9657343ff3';
const NOM = '2611030330_politica_privacitat_2_4.sql';
const DELIM = '$politica_2_4$';
const SQL = readFileSync(resolve(process.cwd(), 'supabase/migrations', NOM), 'utf8');
const OLD = readFileSync(resolve(process.cwd(), 'supabase/migrations/2611012257_politica_privacitat_2_3.sql'), 'utf8');
const README = readFileSync(resolve(process.cwd(), 'supabase/README.md'), 'utf8');
const ORDRE = JSON.parse(readFileSync(resolve(process.cwd(), 'supabase/ordre_desplegament.json'), 'utf8'));
const sha = s => createHash('sha256').update(s).digest('hex');
const GUARDA = `begin
  if not exists (
    select 1 from public.politiques_privacitat
    where versio = '2.4'
      and url = '/legal'
      and text_sha256 = '2956bc30112b2e8d097815d502f9cd711e9ee0c213c5c73634340d9657343ff3'
      and text_complet is not null
      and vigent_des_de = timestamptz '2026-11-03 00:00:00+01'
  ) then
    raise exception 'SDP-RGPD-021: la política 2.4 preexistent no coincidix amb el text, la data o URL esperats; no es modifica cap versió segellada.' using errcode = '42501';
  end if;
end;`;
const OLD_SHA = '144bb628557775a1f557ad929bf3335145c842d4214192b894d46097e2e68b8b';
function problemes(sql) {
  const parts = sql.split(DELIM), errors = [];
  if (parts.length !== 3 || sha(parts[1] ?? '') !== SHA_24) errors.push('text segellat');
  if (!sql.includes(`  '${sha(parts[1] ?? '')}',\n`)) errors.push('empremta');
  if (!sql.includes(`select text_sha256 = '${sha(parts[1] ?? '')}' as segellada_2_4`)) errors.push('consulta posterior');
  if (!sql.includes("  '2.4',\n  timestamptz '2026-11-03 00:00:00+01',\n  '/legal',")) errors.push('fila');
  const guarda = sql.split('$verifica_politica_2_4$');
  const net = text => text.replace(/\s+/g, ' ').trim();
  if (guarda.length !== 3 || net(guarda[1] ?? '') !== net(GUARDA)) errors.push('guarda del conflicte immutable');
  const tokens = sql.replace(/\$(\w*)\$[\s\S]*?\$\1\$/g, () => '$$cos$$').split('\n').map(l => l.replace(/--.*$/, '')).join('\n').replace(/'(?:[^']|'')*'/g, "'txt'").split(';').map(s => s.replace(/\s+/g, ' ').trim().toLowerCase()).filter(Boolean);
  const expected = ['begin', "set local lock_timeout = 'txt'", "set local statement_timeout = 'txt'", "insert into public.politiques_privacitat (versio, vigent_des_de, url, text_sha256, text_complet, mecanisme, resum_canvis) values ( 'txt', timestamptz 'txt', 'txt', 'txt', $$cos$$, 'txt', 'txt' ) on conflict (versio) do nothing", 'do $$cos$$', 'commit'];
  if (JSON.stringify(tokens) !== JSON.stringify(expected)) errors.push('sentències');
  if (!sql.includes('NO aplicada: l’aplica el Mestre') && !sql.includes("NO aplicada: l'aplica el Mestre")) errors.push('estat');
  for (const clau of ['ABANS (lectura):', 'DESPRÉS (lectura):', 'ORDRE:', 'INVERSA:']) if (!sql.includes(clau)) errors.push(clau);
  return errors;
}

describe('2.4 append-only d’enriquiment editorial', () => {
  test('segella exactament el text publicat, data/rètol i hash, amb una sola inserció idempotent', () => {
    expect(problemes(SQL)).toEqual([]);
    expect(SQL.split(DELIM)[1].replace(/<\/?strong>/g, '')).toMatch(/Versió 2\.4 · En vigor des del 3 de novembre de 2026\./);
    expect(SQL.split(DELIM)[1].length).toBeLessThanOrEqual(200000);
  });
  test('la migració històrica 2.3 és byte a byte l’original, sense cap canvi de fila ni text', () => {
    expect(sha(OLD)).toBe(OLD_SHA);
    expect(sha(OLD.split('$politica_2_3$')[1])).toBe('abd827d07af5aa30dc364f156a551deed4e9a43a830b9f57eca5a861ea4eadca');
  });
  test('el detector rebutja text/hashes/fila, upsert, DDL, deleció i dates adulterats', () => {
    const mutants = [SQL.replace('NIF 21476359V', 'NIF 00000000X'), SQL.replace(SHA_24, '0'.repeat(64)), SQL.replace("  '2.4',", "  '2.3',"), SQL.replace('on conflict (versio) do nothing;', 'on conflict (versio) do update set text_complet = excluded.text_complet;'), SQL.replace('commit;', 'drop table public.politiques_privacitat; commit;'), SQL.replace('commit;', "delete from public.politiques_privacitat where versio = '2.3'; commit;"), SQL.replace("timestamptz '2026-11-03 00:00:00+01'", "timestamptz '2026-11-01 00:00:00+01'"), SQL.replace('if not exists (', 'if exists ('), SQL.replace("and url = '/legal'", "and url = '/privacitat'"), SQL.replace("and text_sha256 = '2956bc30112b2e8d097815d502f9cd711e9ee0c213c5c73634340d9657343ff3'", "and text_sha256 = '0000000000000000000000000000000000000000000000000000000000000000'"), SQL.replace("and text_complet is not null", "and true")];
    for (const m of mutants) { expect(m).not.toBe(SQL); expect(problemes(m).length).toBeGreaterThan(0); }
  });
  test('README i ordre declaren la publicació web abans de la nova migració, sense aplicar-la', () => {
    expect(README).toContain(`- \`migrations/${NOM}\``);
    expect(README).toContain(SHA_24);
    expect(README).toMatch(/\| 72 \| `2611030330` \| `2611030330_politica_privacitat_2_4.sql` \| \*\*NO aplicada: l'aplica el Mestre\*\*/);
    expect(ORDRE.portes.find(p => p.id === 'web-legal-politica-2-4')).toMatchObject({ tipus: 'client', abans: ['2611030330'] });
  });
});
