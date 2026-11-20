#!/usr/bin/env node
/** Verify the exact supplied R32.14 attestation, without network or SQL execution.
 * A pinned SHA-256 proves correspondence to reviewed bytes, never authorship or
 * independent observation of the remote database. Later SQL remains pending.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { arrelSegura, esMain } from '../lib/arrel.mjs';

export const REBUT_PRODUCCIO_R3214 = Object.freeze({
  receipt: 'tooling/gates/fixtures/produccio-r3214/REBUT_SUPABASE_PRODUCCIO_R32_14_10_DE_10_TRUE.json',
  receiptSHA256: '19aaff52ad70ed3e4c0dd2caa6e6226d166ca229c64a09b85023556cc7030678',
  bundle: 'tests/fixtures/produccio-r3214/SUPER_BUNDLE_SQL_PRODUCCIO_R32_14_COPIAR_ENGANXAR.sql',
  bundleSHA256: '1815387bdbe458678c22f414d4397f5d0c13cc0643c1df654f4c6ba0b34b9fab',
  source: '../_investigacio_ia_de_poble/261119_marato_dinar_v1_2_11_r32_14/',
  bundleBytes: 129350, bundleLines: 1126
});
const CHECKS = Object.freeze(['accions_r327', 'ubicacio_r328', 'quota_250mb', 'push_v2', 'push_nomes_servidor',
  'reconciliacio_rls', 'fossils_acl', 'pf03', 'lssi', 'previa_sense_amagats']);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
function read(root, relative, max) {
  let file = fs.realpathSync(root);
  for (const part of relative.split('/')) {
    file = path.join(file, part);
    if (fs.lstatSync(file).isSymbolicLink()) throw new Error('Enllaç no admés');
  }
  const st = fs.lstatSync(file);
  if (!st.isFile() || st.nlink !== 1 || st.size > max) throw new Error('Font no regular o massa gran');
  return fs.readFileSync(file);
}
export function verificaRebutProduccioR3214(root) {
  const pending = [
    { id: 'r3215-p2-registra-denuncia-diligent', estat: 'no_verificat', motiu: 'Patch P2 repetida/detall fora del bundle R32.14 acreditat.' },
    { id: 'r3215-set-definers', estat: 'no_verificat', motiu: 'Diagnòstic i blindatge dels 7 SECURITY DEFINER en Producció encara sense rebut aportat.' }
  ];
  try {
    const bytes = read(root, REBUT_PRODUCCIO_R3214.receipt, 16384), bundle = read(root, REBUT_PRODUCCIO_R3214.bundle, 256 * 1024);
    if (sha(bytes) !== REBUT_PRODUCCIO_R3214.receiptSHA256 || sha(bundle) !== REBUT_PRODUCCIO_R3214.bundleSHA256) throw new Error('Empremta SHA-256 divergent');
    const r = JSON.parse(bytes.toString('utf8'));
    const count = Object.keys(r.postVerification ?? {});
    if (r.schema !== 'sdp.supabase.production.receipt.v1' || r.wave !== 'R32.14' || r.postgresVersion !== '17.6'
      || r.appliedAt !== '2026-11-19T18:02:42+01:00' || r.allChecksPassed !== true || r.checksPassedCount !== 10 || r.checksTotalCount !== 10
      || count.length !== 10 || !CHECKS.every(k => r.postVerification[k] === true)
      || r.bundlePath !== REBUT_PRODUCCIO_R3214.source + path.basename(REBUT_PRODUCCIO_R3214.bundle)
      || r.bundleBytes !== bundle.length || bundle.length !== REBUT_PRODUCCIO_R3214.bundleBytes || r.bundleLines !== REBUT_PRODUCCIO_R3214.bundleLines
      || bundle.toString('utf8').split('\n').length !== REBUT_PRODUCCIO_R3214.bundleLines) throw new Error('Contracte del rebut divergent');
    return { schema: 'sdp.production-receipt-integrity.v1', valid: true, wave: r.wave, estat: 'rebut_aportat_integritat_verificada',
      appliedAt: r.appliedAt, postgresVersion: r.postgresVersion, checksPassed: 10, checksTotal: 10,
      receiptSHA256: sha(bytes), bundleSHA256: sha(bundle),
      linees: { declarades: r.bundleLines, convencioDeclarada: 'split LF incloent registre final buit', saltsLF: bundle.toString('utf8').split('\n').length - 1 }, fonts: { ...REBUT_PRODUCCIO_R3214 }, pendents: pending,
      limit: 'Rebut aportat pel projecte i bytes contrastats; sense connexió remota ni prova criptogràfica d’autoria. No acredita SQL posterior ni 10/10 global.' };
  } catch (error) { return { schema: 'sdp.production-receipt-integrity.v1', valid: false, estat: 'no_acreditat', error: error.message, pendents: pending }; }
}
if (esMain(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.some(a => a !== '--json' && !a.startsWith('--arrel='))) { console.log(JSON.stringify({ valid: false, error: 'Ús: --json [--arrel=RUTA]' })); process.exitCode = 2; }
  else { const result = verificaRebutProduccioR3214(arrelSegura()); console.log(JSON.stringify(result, null, 2)); process.exitCode = result.valid ? 0 : 1; }
}
