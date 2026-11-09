#!/usr/bin/env node
/** Offline pre-enable gate. Inputs are operator-captured evidence, not a remote-state assertion. */
import { readFileSync, realpathSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { PAGE_COPY } from '../../src/sections/text/pageContent.js';
import { VERSIO_POLITICA_PRIVACITAT } from '../../src/config/politicaPrivacitat.js';
const sha = text => createHash('sha256').update(text).digest('hex');
export function verificaPoliticaPublicada({ html, evidence, now = Date.now() } = {}) {
  const errors = [], version = VERSIO_POLITICA_PRIVACITAT;
  const expected = PAGE_COPY.legal.html, digest = sha(expected);
  if (typeof html !== 'string' || html !== expected) errors.push('served_html_mismatch');
  if (expected.match(/Versió ([0-9.]+)/)?.[1] !== version) errors.push('client_version_mismatch');
  if (evidence?.schema !== 'sdp.policy-publication-evidence.v1') errors.push('evidence_schema');
  if (!['supabase', 'node0'].includes(evidence?.backend)) errors.push('backend_missing');
  if (evidence?.signupsPaused !== true) errors.push('signups_not_paused');
  const observed = Date.parse(evidence?.observedAt);
  if (!Number.isFinite(now) || !Number.isFinite(observed) || observed > now || now - observed > 15 * 60_000) errors.push('evidence_not_recent');
  if (evidence?.currentVersion !== version) errors.push('server_current_version_mismatch');
  const row = evidence?.policy;
  if (row?.versio !== version || row?.url !== '/legal' || row?.text_sha256 !== digest || row?.text_complet !== expected) errors.push('server_policy_identity_mismatch');
  const effective = Date.parse(row?.vigent_des_de);
  if (!Number.isFinite(effective) || effective > now || effective !== Date.parse('2026-11-08T00:00:00+01:00')) errors.push('server_policy_not_effective');
  if (evidence?.backend === 'node0') {
    const privacy = evidence?.node0Policy?.privacy;
    if (privacy?.version !== version || privacy?.url !== '/legal' || privacy?.sha256 !== digest) errors.push('node0_auth_policy_mismatch');
  }
  return { valid: errors.length === 0, version, htmlSha256: digest, errors,
    scope: 'Offline validation of operator-provided evidence; no signup switch or remote verification performed.' };
}
export function main(args = process.argv.slice(2)) {
  if (args.length !== 4 || args[0] !== '--html' || args[2] !== '--evidence') throw new Error('Usage: --html SERVED_INNER_HTML --evidence OPERATOR_JSON');
  const report = verificaPoliticaPublicada({ html: readFileSync(args[1], 'utf8'), evidence: JSON.parse(readFileSync(args[3], 'utf8')) });
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  if (!report.valid) process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  try { main(); } catch (error) { process.stderr.write(error.message + '\n'); process.exitCode = 1; }
}
