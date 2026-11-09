// @vitest-environment node
/* R54 · la 2.6 és una PROPOSTA a la migració 2611080440 (NO aplicada: l'aplica el Mestre).
   Sanejament R15 (B1, P0-01/PRIV-04/R15-REG-01): mentre no s'aplique, el client continua
   mostrant, servint i enviant la 2.5. El text 2.6 viu NOMÉS dins de la migració: esta prova
   el segella pel seu hash i comprova que és exactament la 2.5 servida més els paràgrafs R54
   autoritzats (inversa forense), de manera que el dia que es publique no hi entre res més. */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdtempSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { beforeAll, describe, expect, test, vi } from 'vitest';
import { PAGE_COPY } from '../../sections/text/pageContent.js';
import { legalContent } from '../../sections/text/legalContent.js';
import { VERSIO_POLITICA_PRIVACITAT, consentimentMostrat } from '../../config/politicaPrivacitat.js';
import { legal26A25 } from '../../../tests/helpers/legalR54Forense.js';
import { verificaPoliticaPublicada } from '../../../tooling/privacy/verifica-politica-publicada.mjs';
const sha = s => createHash('sha256').update(s).digest('hex');
const read = name => readFileSync(new URL('../../../' + name, import.meta.url), 'utf8');
const SQL = read('supabase/migrations/2611080440_politica_privacitat_2_6.sql');
const HASH = 'ae73f12713ba2d7e86cc3610ae828cb231edb89a98749c27df9fddb177be5ab0';
const SHA_25 = 'ea13f0c4ca8f69ebf8c29035d6f7804d401d48dbdc6e3b5d5fb2b1b975fc1fc7';
/* La proposta 2.6: només a la migració. El que servix /legal (el paquet) és SERVIT. */
const HTML = SQL.split('$politica_2_6$')[1], SERVIT = PAGE_COPY.legal.html;
const NET = s => s.replace(/\s+/g, ' ').trim();
function problems(sql) {
  const parts = sql.split('$politica_2_6$'), errors = [];
  if (parts.length !== 3 || sha(parts[1]) !== HASH || parts[1].length !== 61194) errors.push('text');
  if (!sql.includes(`  '${HASH}',\n`)) errors.push('hash');
  if (!sql.includes("  '2.6',\n  timestamptz '2026-11-08 00:00:00+01',\n  '/legal',")) errors.push('row');
  if (!sql.includes(`select text_sha256 = '${HASH}' as segellada_2_6`)) errors.push('postcheck');
  const guard = sql.split('$verifica_politica_2_6$');
  const expected = `begin
  if not exists (
    select 1 from public.politiques_privacitat
    where versio = '2.6'
      and url = '/legal'
      and text_sha256 = '${HASH}'
      and text_complet is not null
      and vigent_des_de = timestamptz '2026-11-08 00:00:00+01'
  ) then
    raise exception 'SDP-RGPD-021: la política 2.6 preexistent no coincidix amb el text, la data o URL esperats; no es modifica cap versió segellada.' using errcode = '42501';
  end if;
end;`;
  if (guard.length !== 3 || NET(guard[1] ?? '') !== NET(expected)) errors.push('immutable conflict');
  const tokens = sql.replace(/\$(\w*)\$[\s\S]*?\$\1\$/g, () => '$$cos$$').split('\n').map(s => s.replace(/--.*$/, '')).join('\n').replace(/'(?:[^']|'')*'/g, "'txt'").split(';').map(s => NET(s).toLowerCase()).filter(Boolean);
  const expectedTokens = ['begin', "set local lock_timeout = 'txt'", "set local statement_timeout = 'txt'", "insert into public.politiques_privacitat (versio, vigent_des_de, url, text_sha256, text_complet, mecanisme, resum_canvis) values ( 'txt', timestamptz 'txt', 'txt', 'txt', $$cos$$, 'txt', 'txt' ) on conflict (versio) do nothing", 'do $$cos$$', 'commit'];
  if (JSON.stringify(tokens) !== JSON.stringify(expectedTokens)) errors.push('statements');
  for (const mark of ['NO aplicada:', 'ABANS (lectura):', 'DESPRÉS (lectura):', 'ORDRE:', 'INVERSA:']) if (!sql.includes(mark)) errors.push(mark);
  return errors;
}
describe('R54 proposed policy2.6 (0440 NOT applied), append-only; /legal keeps serving2.5', () => {
  test('/legal serves the sealed2.5; the2.6 lives only in 0440 and is exactly2.5 plus the authorized R54 paragraphs', () => {
    expect(SERVIT).toBe(legalContent.html); expect(SERVIT).toHaveLength(59594); expect(sha(SERVIT)).toBe(SHA_25);
    // Registre de la Frontissa (clau legal) de HEAD: el text servit no ha canviat.
    expect(sha(JSON.stringify(PAGE_COPY.legal))).toBe('0a08fd743c2b4139e322cdd457e489f5dab6003bfe53d93a5d424cb457495b94');
    expect(SERVIT).not.toMatch(/Versió 2\.6/);
    expect(SERVIT.replace(/<\/?strong>/g, '')).toContain('Versió 2.5 · En vigor des del 6 de novembre de 2026.');
    expect(HTML).toHaveLength(61194); expect(sha(HTML)).toBe(HASH);
    expect(problems(SQL)).toEqual([]);
    expect(HTML.replace(/<\/?strong>/g, '')).toContain('Versió 2.6 · En vigor des del 8 de novembre de 2026.');
    expect(legal26A25(HTML)).toBe(SERVIT);
  });
  test('signup records the version actually displayed (2.5) and never an unapplied or inferred version', () => {
    expect(VERSIO_POLITICA_PRIVACITAT).toBe('2.5');
    expect(VERSIO_POLITICA_PRIVACITAT).toBe(SERVIT.replace(/<\/?strong>/g, '').match(/Versió (\d+\.\d+) · En vigor/)[1]);
    expect(consentimentMostrat(true)).toEqual({ rgpd: true, versio_politica: '2.5' });
    expect(Object.values(consentimentMostrat(true))).not.toContain('2.6');
    for (const v of [false, undefined, 'true', 1]) expect(consentimentMostrat(v)).toEqual({ rgpd: false, versio_politica: '' });
    expect(Object.isFrozen(consentimentMostrat(true))).toBe(true);
  });
  const mutations = [
    ['text', s => s.replace('NIF 21476359V', 'NIF 00000000X')],
    ['hash', s => s.replace(`  '${HASH}',`, `  '${'0'.repeat(64)}',`)],
    ['version', s => s.replace("  '2.6',", "  '2.5',")],
    ['date', s => s.replace("timestamptz '2026-11-08 00:00:00+01',", "timestamptz '2026-11-06 00:00:00+01',")],
    ['upsert', s => s.replace('on conflict (versio) do nothing;', 'on conflict (versio) do update set text_complet = excluded.text_complet;')],
    ['ddl', s => s.replace('commit;', 'drop table public.politiques_privacitat; commit;')],
    ['delete', s => s.replace('commit;', "delete from public.politiques_privacitat; commit;")],
    ['guard', s => s.replace('if not exists (', 'if exists (')],
    ['guard hash', s => s.replace(`and text_sha256 = '${HASH}'`, 'and true')],
    ['guard url', s => s.replace("and url = '/legal'", 'and true')],
    ['guard text', s => s.replace('and text_complet is not null', 'and true')],
    ['postcheck', s => s.replace(`select text_sha256 = '${HASH}'`, 'select true')]
  ];
  test.each(mutations)('mutation rejected: %s', (_name, mutate) => { const changed = mutate(SQL); expect(changed).not.toBe(SQL); expect(problems(changed).length).toBeGreaterThan(0); });
  test('the exact authorized inverse recovers sealed2.5 and rejects missing/duplicated/altered paragraphs', () => {
    expect(sha(legal26A25(HTML))).toBe('ea13f0c4ca8f69ebf8c29035d6f7804d401d48dbdc6e3b5d5fb2b1b975fc1fc7');
    expect(() => legal26A25(HTML.replace('Versió 2.6', 'Versió 2.7'))).toThrow();
    expect(() => legal26A25(HTML + HTML)).toThrow();
  });
  test('deployment declares 84, paused signups and both publication/enable gates', () => {
    const docs = read('supabase/README.md'), order = JSON.parse(read('supabase/ordre_desplegament.json'));
    expect(docs).toContain('| 84 | `2611080440`'); expect(docs).toContain(HASH); expect(docs).toContain('**aturar les altes**');
    expect(docs).toContain("| 84 | `2611080440` | `2611080440_politica_privacitat_2_6.sql` | **NO aplicada: l’aplica el Mestre** |");
    expect(docs).toContain("- `migrations/2611080440_politica_privacitat_2_6.sql`\n  **NO aplicada: l'aplica el Mestre.**");
    expect(docs).toContain('**Sanejament R15 (B1):** el client continua mostrant, servint i enviant la 2.5');
    expect(order.portes.find(p => p.id === 'web-legal-politica-2-6')).toMatchObject({ abans: ['2611080440'] });
    expect(order.portes.find(p => p.id === 'altes-politica-2-6')).toMatchObject({ despres: ['2611080440'] });
    expect(docs).toContain('xat_push_reclama_v2'); expect(docs).toContain('xat_push_confirma_v2'); expect(docs).toContain('ACK falla');
  });
});
const NOW = Date.parse('2026-11-08T10:00:00Z');
const evidence = backend => ({ schema: 'sdp.policy-publication-evidence.v1', backend, signupsPaused: true, observedAt: new Date(NOW).toISOString(), currentVersion: '2.6', policy: { versio: '2.6', url: '/legal', text_sha256: HASH, text_complet: HTML, vigent_des_de: '2026-11-08T00:00:00+01:00' }, node0Policy: { privacy: { version: '2.6', url: '/legal', sha256: HASH } } });
/* El gate llig la versió i el /legal DEL BUILD que es desplega. Este client servix la 2.5,
   així que el camí positiu es prova amb el build futur 2.6 simulat (el text de la migració i
   la versió '2.6' en lloc de pageContent i politicaPrivacitat), i el build real ha de fallar. */
let verifica26, main26;
beforeAll(async () => {
  vi.resetModules();
  vi.doMock('../../sections/text/pageContent.js', () => ({ PAGE_COPY: { legal: { html: HTML } } }));
  vi.doMock('../../config/politicaPrivacitat.js', () => ({ VERSIO_POLITICA_PRIVACITAT: '2.6' }));
  try {
    ({ verificaPoliticaPublicada: verifica26, main: main26 } = await import('../../../tooling/privacy/verifica-politica-publicada.mjs'));
  } finally {
    vi.doUnmock('../../sections/text/pageContent.js'); vi.doUnmock('../../config/politicaPrivacitat.js'); vi.resetModules();
  }
});
describe('offline pre-enable gate fails closed', () => {
  test('the simulated2.6 build is a different module instance from the real2.5 gate', () => {
    expect(verifica26).not.toBe(verificaPoliticaPublicada);
    expect(verifica26({ html: HTML, evidence: evidence('supabase'), now: NOW }).version).toBe('2.6');
    expect(verificaPoliticaPublicada({ html: HTML, evidence: evidence('supabase'), now: NOW }).version).toBe('2.5');
  });
  test.each(['supabase', 'node0'])('%s accepts only coherent operator-provided evidence (future2.6 build)', backend => expect(verifica26({ html: HTML, evidence: evidence(backend), now: NOW }).valid).toBe(true));
  test.each(['supabase', 'node0'])('%s: this2.5 build never validates2.6 publication, even with perfect evidence', backend => {
    const report = verificaPoliticaPublicada({ html: HTML, evidence: evidence(backend), now: NOW });
    expect(report.valid).toBe(false);
    expect(report.errors).toEqual(expect.arrayContaining(['served_html_mismatch', 'server_current_version_mismatch', 'server_policy_identity_mismatch']));
  });
  const bad = [
    ['missing evidence', () => null], ['not paused', e => ({ ...e, signupsPaused: false })],
    ['stale', e => ({ ...e, observedAt: '2026-11-08T09:00:00Z' })], ['future evidence', e => ({ ...e, observedAt: '2026-11-09T09:00:00Z' })],
    ['server fallback2.5', e => ({ ...e, currentVersion: '2.5' })], ['absent2.6', e => ({ ...e, policy: null })],
    ['wrong hash', e => ({ ...e, policy: { ...e.policy, text_sha256: '0'.repeat(64) } })],
    ['different text', e => ({ ...e, policy: { ...e.policy, text_complet: HTML + ' ' } })],
    ['future policy', e => ({ ...e, policy: { ...e.policy, vigent_des_de: '2026-11-09T00:00:00Z' } })],
    ['node0 mismatch', e => ({ ...e, node0Policy: { privacy: { version: '2.5' } } })],
    ['wrong URL', e => ({ ...e, policy: { ...e.policy, url: '/other' } })]
  ];
  test.each(bad)('rejects %s', (_name, mutate) => expect(verifica26({ html: HTML, evidence: mutate(evidence('node0')), now: NOW }).valid).toBe(false));
  test('CLI main (future2.6 build) exits 0 only on coherent evidence', () => {
    const dir = mkdtempSync(join(tmpdir(), 'sdp-policy26-main-'));
    const write = process.stdout.write, exitCode = process.exitCode;
    try {
      const html = join(dir, 'legal.html'), proof = join(dir, 'proof.json'), out = [];
      writeFileSync(html, HTML);
      const capture = { ...evidence('supabase'), observedAt: new Date().toISOString() };
      for (const [currentVersion, expectedExit] of [['2.6', 0], ['2.5', 1]]) {
        writeFileSync(proof, JSON.stringify({ ...capture, currentVersion }));
        out.length = 0; process.exitCode = undefined; process.stdout.write = chunk => { out.push(String(chunk)); return true; };
        try { main26(['--html', html, '--evidence', proof]); } finally { process.stdout.write = write; }
        expect(process.exitCode ?? 0).toBe(expectedExit);
        expect(JSON.parse(out.join('')).valid).toBe(expectedExit === 0);
      }
    } finally { process.stdout.write = write; process.exitCode = exitCode; rmSync(dir, { recursive: true, force: true }); }
  });
  test('CLI via a filesystem alias executes the real gate and fails closed: this2.5 client never opens2.6 signups', () => {
    const dir = mkdtempSync(join(tmpdir(), 'sdp-policy26-cli-'));
    try {
      const alias = join(dir, 'gate.mjs'), html = join(dir, 'legal.html'), proof = join(dir, 'proof.json');
      symlinkSync(fileURLToPath(new URL('../../../tooling/privacy/verifica-politica-publicada.mjs', import.meta.url)), alias);
      const capture = { ...evidence('supabase'), observedAt: new Date().toISOString() };
      for (const served of [HTML, SERVIT]) for (const currentVersion of ['2.6', '2.5']) {
        writeFileSync(html, served);
        writeFileSync(proof, JSON.stringify({ ...capture, currentVersion }));
        const result = spawnSync(process.execPath, [alias, '--html', html, '--evidence', proof], { encoding: 'utf8' });
        expect(result.status, result.stderr).toBe(1);
        const report = JSON.parse(result.stdout);
        expect([report.valid, report.version]).toEqual([false, '2.5']);
      }
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
  test('rejects stale served HTML even when server evidence is coherent', () => expect(verifica26({ html: legal26A25(HTML), evidence: evidence('supabase'), now: NOW }).valid).toBe(false));
  test('rejects the HTML this bundle actually serves (2.5): signups cannot be reopened as2.6 with this client', () => {
    for (const backend of ['supabase', 'node0']) {
      expect(verifica26({ html: SERVIT, evidence: evidence(backend), now: NOW }).valid).toBe(false);
      expect(verificaPoliticaPublicada({ html: SERVIT, evidence: evidence(backend), now: NOW }).valid).toBe(false);
    }
  });
});
