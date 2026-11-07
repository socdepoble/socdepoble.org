// @vitest-environment node
/* Onada R9 · C3 (IDEA-120 / P0-30) · SDP-RGPD-021: la 2.5 (avisos push del xat)
   s'afig en una migració nova; la 2.3 i la 2.4 queden immutables, byte a byte.
   La mateixa forma que politicaPrivacitat24.migracio.test.js: una sola
   inserció idempotent amb el text EXACTE que /legal servix, la seua empremta,
   el rètol i la data, i la guarda del conflicte. Sense DB ni SQL executat. */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { legalContent } from '../../sections/text/legalContent.js';
import { VERSIO_POLITICA_PRIVACITAT } from '../../config/politicaPrivacitat.js';

const NOM = '2611061520_politica_privacitat_2_5.sql';
const DELIM = '$politica_2_5$';
const SQL = readFileSync(resolve(process.cwd(), 'supabase/migrations', NOM), 'utf8');
const SQL_23 = readFileSync(resolve(process.cwd(), 'supabase/migrations/2611012257_politica_privacitat_2_3.sql'), 'utf8');
const SQL_24 = readFileSync(resolve(process.cwd(), 'supabase/migrations/2611030330_politica_privacitat_2_4.sql'), 'utf8');
const README = readFileSync(resolve(process.cwd(), 'supabase/README.md'), 'utf8');
const ORDRE = JSON.parse(readFileSync(resolve(process.cwd(), 'supabase/ordre_desplegament.json'), 'utf8'));
const sha = s => createHash('sha256').update(s).digest('hex');
const guardaDe = (empremta) => `begin
  if not exists (
    select 1 from public.politiques_privacitat
    where versio = '2.5'
      and url = '/legal'
      and text_sha256 = '${empremta}'
      and text_complet is not null
      and vigent_des_de = timestamptz '2026-11-06 00:00:00+01'
  ) then
    raise exception 'SDP-RGPD-021: la política 2.5 preexistent no coincidix amb el text, la data o URL esperats; no es modifica cap versió segellada.' using errcode = '42501';
  end if;
end;`;
function problemes(sql) {
  const parts = sql.split(DELIM), errors = [];
  if (parts.length !== 3 || parts[1] !== legalContent.html) errors.push('text segellat');
  const empremta = sha(parts[1] ?? '');
  if (!sql.includes(`  '${empremta}',\n`)) errors.push('empremta');
  if (!sql.includes(`select text_sha256 = '${empremta}' as segellada_2_5`)) errors.push('consulta posterior');
  if (!sql.includes("  '2.5',\n  timestamptz '2026-11-06 00:00:00+01',\n  '/legal',")) errors.push('fila');
  const guarda = sql.split('$verifica_politica_2_5$');
  const net = text => text.replace(/\s+/g, ' ').trim();
  if (guarda.length !== 3 || net(guarda[1] ?? '') !== net(guardaDe(sha(legalContent.html)))) errors.push('guarda del conflicte immutable');
  const tokens = sql.replace(/\$(\w*)\$[\s\S]*?\$\1\$/g, () => '$$cos$$').split('\n').map(l => l.replace(/--.*$/, '')).join('\n').replace(/'(?:[^']|'')*'/g, "'txt'").split(';').map(s => s.replace(/\s+/g, ' ').trim().toLowerCase()).filter(Boolean);
  const expected = ['begin', "set local lock_timeout = 'txt'", "set local statement_timeout = 'txt'", "insert into public.politiques_privacitat (versio, vigent_des_de, url, text_sha256, text_complet, mecanisme, resum_canvis) values ( 'txt', timestamptz 'txt', 'txt', 'txt', $$cos$$, 'txt', 'txt' ) on conflict (versio) do nothing", 'do $$cos$$', 'commit'];
  if (JSON.stringify(tokens) !== JSON.stringify(expected)) errors.push('sentències');
  if (!sql.includes('NO aplicada: l’aplica el Mestre') && !sql.includes("NO aplicada: l'aplica el Mestre")) errors.push('estat');
  for (const clau of ['ABANS (lectura):', 'DESPRÉS (lectura):', 'ORDRE:', 'INVERSA:']) if (!sql.includes(clau)) errors.push(clau);
  return errors;
}

describe('2.5 append-only: els avisos push del xat', () => {
  test('segella exactament el text publicat, amb rètol, data i hash, en una sola inserció idempotent', () => {
    expect(problemes(SQL)).toEqual([]);
    expect(legalContent.html.replace(/<\/?strong>/g, '')).toMatch(/Versió 2\.5 · En vigor des del 6 de novembre de 2026\./);
    expect(legalContent.html.length).toBeLessThanOrEqual(200000);
  });

  test('la versió que mostra el client (l’alta del Node 0) és la de /legal', () => {
    expect(VERSIO_POLITICA_PRIVACITAT).toBe('2.5');
  });

  test('les migracions de la 2.3 i de la 2.4 són byte a byte les originals', () => {
    expect(sha(SQL_23)).toBe('144bb628557775a1f557ad929bf3335145c842d4214192b894d46097e2e68b8b');
    expect(sha(SQL_24)).toBe('941f72e64b8b5266600e8d89678d08dedec94559375748b980d68b63938b6252');
  });

  test('el detector rebutja text/hashes/fila, upsert, DDL, deleció i dates adulterats', () => {
    const empremta = sha(legalContent.html);
    const mutants = [
      SQL.replace('NIF 21476359V', 'NIF 00000000X'),
      SQL.replace(`  '${empremta}',\n`, `  '${'0'.repeat(64)}',\n`),
      SQL.replace("  '2.5',", "  '2.4',"),
      SQL.replace('on conflict (versio) do nothing;', 'on conflict (versio) do update set text_complet = excluded.text_complet;'),
      SQL.replace('commit;', 'drop table public.politiques_privacitat; commit;'),
      SQL.replace('commit;', "delete from public.politiques_privacitat where versio = '2.4'; commit;"),
      SQL.replace("  timestamptz '2026-11-06 00:00:00+01',", "  timestamptz '2026-11-03 00:00:00+01',"),
      SQL.replace('if not exists (', 'if exists ('),
      SQL.replace("and url = '/legal'", "and url = '/privacitat'"),
      SQL.replace(`and text_sha256 = '${empremta}'`, `and text_sha256 = '${'0'.repeat(64)}'`),
      SQL.replace('and text_complet is not null', 'and true')
    ];
    for (const m of mutants) { expect(m).not.toBe(SQL); expect(problemes(m).length).toBeGreaterThan(0); }
  });

  test('README i ordre declaren la publicació web abans de la migració nova, i el README la dona aplicada pel Mestre el 6-11', () => {
    expect(README).toContain(`- \`migrations/${NOM}\``);
    expect(README).toContain(sha(legalContent.html));
    // Onada R10 · B4: la lectura REST del 6-11-2026 hi troba la 2.5 amb l'empremta del /legal d'este build.
    expect(README).toMatch(new RegExp(`\\| 79 \\| \`2611061520\` \\| \`2611061520_politica_privacitat_2_5.sql\` \\| Aplicada a producció \\(lectura REST del 6-11: \`politiques_privacitat\` té la 2\\.5, vigent des del 2026-11-05T23:00Z, amb l'empremta \`${sha(legalContent.html).slice(0, 8)}…\` d'esta migració; aplicada pel Mestre el 6-11\\)`));
    expect(ORDRE.portes.find(p => p.id === 'web-legal-politica-2-5')).toMatchObject({ tipus: 'client', abans: ['2611061520'] });
  });
});

/* Onada R10 · B4 (VFC-02 de R9) · El comentari de src/config/politicaPrivacitat.js diu com es comporta cada
   servidor quan la versió que envia el formulari no és la del servidor, i cada frase té la peça que la sosté:
   handle_new_user (2609261500) la substituïx en silenci per la vigent; el Node 0 rebutja l'alta. */
describe('VFC-02 · el comentari de la versió de la política diu el que fa cada servidor', () => {
  const COMENTARI = readFileSync(resolve(process.cwd(), 'src/config/politicaPrivacitat.js'), 'utf8').split('*/')[0];
  test('Supabase registra la vigent si no troba la versió; el Node 0 rebutja', () => {
    expect(COMENTARI).not.toMatch(/A server mismatch must reject the\s+\* registration/);
    for (const peca of ['handle_new_user (2609261500)', 'private.versio_vigent()', 'la substituïx en silenci', '2611061520', 'consent_version_invalid (422)']) expect(COMENTARI, peca).toContain(peca);
    const alta = readFileSync(resolve(process.cwd(), 'supabase/migrations/2609261500_identitat_perfil_f1.sql'), 'utf8');
    expect(alta).toContain('v_versio := coalesce(v_versio, private.versio_vigent());');
    expect(alta).toContain("where p.versio = v_meta ->> 'versio_politica'\n        and p.vigent_des_de <= now();");
    expect(readFileSync(resolve(process.cwd(), 'tooling/node0/auth-node0.mjs'), 'utf8')).toContain("meta.versio_politica !== policy.privacy.version) throw failure('consent_version_invalid', 422)");
    // La 2.5 entra en vigor el 6-11-2026 a les 00:00 CET, com diu el comentari.
    expect(SQL).toContain("timestamptz '2026-11-06 00:00:00+01'");
    expect(VERSIO_POLITICA_PRIVACITAT).toBe('2.5');
  });
  // B4 segona ronda (B4V-T5, MV10): la frase del Node 0 és la que diu el codi (auth-node0.mjs llança, no substituïx).
  test('la frase del Node 0: no substituïx res i rebutja; mai «també la substituïx»', () => {
    const pla = COMENTARI.replace(/\n \* /g, ' ').replace(/\s+/g, ' ');
    expect(pla).toContain("El Node 0 (tooling/node0/auth-node0.mjs) no substituïx res: si no coincidix amb la política del node, rebutja l'alta (i la verificació) amb consent_version_invalid (422).");
    const node0 = pla.split(/(?<=\.)\s+/).filter((frase) => frase.includes('Node 0'));
    expect(node0).toHaveLength(1);
    expect(node0[0]).not.toMatch(/també|en silenci|la substituïx|registra la vigent/);
  });
});
