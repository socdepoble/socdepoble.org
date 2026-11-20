#!/usr/bin/env node
/** R32.17: integrity of the exact human-supplied R32.15 production receipts.
 * SHA-256 pins identify reviewed bytes, not a signer or the current database.
 * This verifier reads local files only and never executes SQL or contacts Cloud.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { arrelSegura, esMain } from '../lib/arrel.mjs';

const DIR = 'tooling/gates/fixtures/produccio-r3215/';
const DIR_SQL = 'tests/fixtures/produccio-r3215/';
export const FONTS_PRODUCCIO_R3215 = Object.freeze([
  ['pas1Sql', DIR_SQL + 'PAS1_PATCH_LSSI_I_SONDA_DEFINERS_R32_15_COPIAR_ENGANXAR.sql', '89c6ffbf24b3540d922fbab3c9ccdb2124e1ac5e59761a8d6261cc29356951ca'],
  ['pas2Sql', DIR_SQL + 'PAS2_BLINDA_7_DEFINERS_R32_15_COPIAR_ENGANXAR.sql', 'f3c2b962cd52599afd1e0e672650ab641442887619607395fb83be2904dd8e96'],
  ['rebutPas1', DIR + 'REBUT_SUPABASE_PRODUCCIO_R32_15_PAS1_LSSI_I_CENS_DEFINERS.json', '69d3df9bb9d8b84278ccc2d5ba6500b49926227efa1e902cb06623598df02e6a'],
  ['rebutFinal', DIR + 'REBUT_SUPABASE_PRODUCCIO_R32_15_COMPLET_136_DE_136.json', 'ecc6ae5da504bfc21e896fd6c33ee55ba710e05b0d997a3ea2c5d447e1b98b48'],
  ['snippetLssi', 'supabase/snippets/r32_15_patch_registra_denuncia_diligent_produccio.sql', '43128d6ba9740cc44d7694a996720adf060bd2fbf0c9abfa1d1cc8a2e9c41b91'],
  ['snippetDefiners', 'supabase/snippets/r32_15_blinda_definers_heretats_idempotent.sql', '922c1b3cd542f41b849164e39e8e0055187f71c5ba797efe4a26991883cfd82c']
].map(([id, ruta, sha256]) => Object.freeze({ id, ruta, sha256 })));
const LSSI_SHA = '6f9974a0f6a46d8ca8e87e7ed617dd3eb5dbf4dfe0d8a73d61f6a6f8dc178fe9';
const ENVIRONMENT = 'Supabase Cloud Production (Postgres 17.6)';
const HASH = /^[a-f0-9]{64}$/;
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
function requireThat(condition, code) { if (!condition) throw new Error(code); }
function delimited(text, marker) {
  const first = text.indexOf(marker), last = text.indexOf(marker, first + marker.length);
  requireThat(first >= 0 && last > first && text.indexOf(marker, last + marker.length) < 0, 'R3215_SQL_DELIMITADORS');
  return text.slice(first + marker.length, last);
}
function lssiBody(sql) {
  const header = 'create or replace function public.registra_denuncia_diligent(';
  const start = sql.indexOf(header);
  requireThat(start >= 0 && sql.indexOf(header, start + header.length) < 0, 'R3215_LSSI_IDENTITAT');
  const bodyStart = sql.indexOf(' as $$', start), bodyEnd = sql.indexOf('$$;', bodyStart + 6);
  requireThat(bodyStart >= 0 && bodyEnd > bodyStart, 'R3215_LSSI_COS');
  return sql.slice(bodyStart + 6, bodyEnd);
}
function signature(sig) {
  requireThat(typeof sig === 'string' && sig.length <= 256, 'R3215_SIGNATURA');
  const open = sig.indexOf('(');
  requireThat(open > 0 && sig.endsWith(')') && /^public\.[a-z_][a-z0-9_]*$/.test(sig.slice(0, open)), 'R3215_SIGNATURA');
  const content = sig.slice(open + 1, -1).trim();
  const args = content ? content.split(',').map(arg => {
    const tokens = arg.trim().split(/ +/);
    requireThat(tokens.length <= 2 && tokens.every(t => /^[a-z_][a-z0-9_.]*$/.test(t)), 'R3215_SIGNATURA');
    return tokens.at(-1).replace(/^pg_catalog\./, '').replace(/^boolean$/, 'bool');
  }) : [];
  return sig.slice(0, open) + '(' + args.join(',') + ')';
}
function indexed(rows, field) {
  requireThat(Array.isArray(rows) && rows.length === 7, 'R3215_SET_INCOMPLET');
  const map = new Map();
  for (const row of rows) {
    requireThat(row && typeof row === 'object' && !Array.isArray(row), 'R3215_FILA');
    const key = signature(row[field]);
    requireThat(!map.has(key), 'R3215_SIGNATURA_DUPLICADA');
    map.set(key, row);
  }
  return map;
}
function aclPrivada(acl) {
  return acl === '{postgres=X/postgres}' || acl === '{postgres=X/postgres,service_role=X/postgres}';
}
/** Pure contract check, deliberately separate from pinned integrity. It cannot
 * attest production: only verificaRebutProduccioR3215 accepts pinned disk bytes.
 */
export function comprovaContracteRebutsR3215(fonts) {
  for (const { id } of FONTS_PRODUCCIO_R3215) requireThat(typeof fonts?.[id] === 'string' && Buffer.byteLength(fonts[id]) <= 64 * 1024, 'R3215_FONT_INVALIDA');
  const before = JSON.parse(fonts.rebutPas1), after = JSON.parse(fonts.rebutFinal);
  requireThat(before.schema === 'sdp.r3215.pas1-produccio-receipt.v1' && after.schema === 'sdp.r3215.produccio-completa-receipt.v1'
    && before.environment === ENVIRONMENT && after.environment === ENVIRONMENT
    && before.verifiedAt === '2026-11-19T23:11:15+01:00' && after.verifiedAt === '2026-11-19T23:22:12+01:00', 'R3215_REBUT_IDENTITAT');
  requireThat(before.patch_lssi_r32_15_ok === true && before.total_definers_public_private === 136 && before.all_definers_empty_search_path === true
    && after.pas1_patch_lssi_r32_15_ok === true && after.pas2_7_definers_blindats_ok === true && after.tots_136_search_path_buit === true, 'R3215_CENS');
  const lssi = before.registra_denuncia_diligent;
  requireThat(lssi && signature(lssi.sig) === 'public.registra_denuncia_diligent(uuid,text,text,uuid)' && lssi.owner === 'postgres'
    && Array.isArray(lssi.config) && lssi.config.length === 1 && lssi.config[0] === 'search_path=""' && lssi.path_buit === true
    && lssi.public_exec === false && lssi.anon_exec === true && lssi.auth_exec === true
    && lssi.acl === '{postgres=X/postgres,anon=X/postgres,authenticated=X/postgres}'
    && lssi.prosrc_sha256 === LSSI_SHA && after.registra_denuncia_diligent_sha256 === LSSI_SHA, 'R3215_LSSI_REBUT');
  requireThat(sha(lssiBody(fonts.pas1Sql)) === LSSI_SHA && sha(lssiBody(fonts.snippetLssi)) === LSSI_SHA, 'R3215_LSSI_POSTIMATGE');
  const specs = JSON.parse(delimited(fonts.pas2Sql, '$r3215_spec$'));
  const sourceSpecs = JSON.parse(delimited(fonts.snippetDefiners, '$r3215_spec$'));
  requireThat(JSON.stringify(specs) === JSON.stringify(sourceSpecs), 'R3215_SPECS_DIVERGENTS');
  const definitions = indexed(specs, 'signature'), preimages = indexed(before.seven_r32_15_fossils_preimage_verified, 'sig'), postimages = indexed(after.postimatges_7_definers, 'sig');
  for (const [sig, spec] of definitions) {
    const pre = preimages.get(sig), post = postimages.get(sig);
    requireThat(pre && post && HASH.test(spec.finalBodySHA256) && Array.isArray(spec.bodyHashes)
      && spec.bodyHashes.includes(pre.prosrc_sha256) && spec.bodyHashes.includes(spec.finalBodySHA256)
      && signature(spec.qualifiedSignature) === sig, 'R3215_IDENTITAT_POSTIMATGE');
    requireThat(typeof spec.ddl === 'string' && sha(delimited(spec.ddl, '$r3215_body$')) === spec.finalBodySHA256
      && spec.ddl.includes('SECURITY DEFINER SET search_path=\'\'') && post.prosrc_sha256 === spec.finalBodySHA256, 'R3215_DEFINER_COS');
    requireThat(post.anon_exec === false && post.public_exec === false && aclPrivada(post.acl) && aclPrivada(pre.acl)
      && pre.acl === post.acl, 'R3215_DEFINER_ACL');
  }
  return { lssiBodySHA256: LSSI_SHA, definers: [...definitions].map(([sig, spec]) => ({ signature: sig, finalBodySHA256: spec.finalBodySHA256 })), totalDefiners: 136 };
}
function readPinned(root, descriptor) {
  let file = root;
  for (const part of descriptor.ruta.split('/')) {
    file = path.join(file, part);
    requireThat(!fs.lstatSync(file).isSymbolicLink(), 'R3215_ENLLAC');
  }
  const st = fs.lstatSync(file);
  requireThat(st.isFile() && st.nlink === 1 && st.size <= 64 * 1024, 'R3215_FONT_NO_REGULAR');
  const bytes = fs.readFileSync(file);
  requireThat(sha(bytes) === descriptor.sha256, 'R3215_SHA256_DIVERGENT');
  return bytes.toString('utf8');
}
export function verificaRebutProduccioR3215(root) {
  const limit = 'Attestació humana aportada, fixada per SHA-256 i coherent amb els cossos SQL revisats. Sense firma criptogràfica d’autoria, connexió directa ni consulta actual a Supabase. No és 10/10 global.';
  try {
    const base = fs.realpathSync(root), fonts = {};
    for (const descriptor of FONTS_PRODUCCIO_R3215) fonts[descriptor.id] = readPinned(base, descriptor);
    const contracte = comprovaContracteRebutsR3215(fonts);
    return { schema: 'sdp.r3215.production-receipt-integrity.v1', valid: true, wave: 'R32.15', estat: 'attestacio_humana_integritat_verificada',
      nomesLectura: true, xarxaExterna: false, connexioDirectaProduccio: false, autoriaCriptograficaVerificada: false,
      postgresVersionDeclarada: '17.6', execucionsDeclarades: ['2026-11-19T23:11:15+01:00', '2026-11-19T23:22:12+01:00'],
      fonts: FONTS_PRODUCCIO_R3215, ...contracte, pendentsSQLR3215: [], limit };
  } catch (error) {
    return { schema: 'sdp.r3215.production-receipt-integrity.v1', valid: false, estat: 'no_acreditat', nomesLectura: true, xarxaExterna: false,
      connexioDirectaProduccio: false, autoriaCriptograficaVerificada: false,
      error: typeof error.message === 'string' && error.message.startsWith('R3215_') ? error.message : 'R3215_LECTURA_O_CONTRACTE_INVALID', limit };
  }
}
if (esMain(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.some(a => a !== '--json' && !a.startsWith('--arrel='))) { console.log(JSON.stringify({ valid: false, error: 'Ús: --json [--arrel=RUTA]' })); process.exitCode = 2; }
  else { const result = verificaRebutProduccioR3215(arrelSegura()); console.log(JSON.stringify(result, null, 2)); process.exitCode = result.valid ? 0 : 1; }
}
