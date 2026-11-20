import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FONTS_PRODUCCIO_R3215, comprovaContracteRebutsR3215, verificaRebutProduccioR3215 } from '../tooling/gates/verifica-rebut-produccio-r3215.mjs';
import { avaluaMatriu, PROVES_MATRIU } from '../tooling/gates/avalua-matriu-d01-d15.mjs';

const source = fileURLToPath(new URL('../', import.meta.url));
function fonts() { return Object.fromEntries(FONTS_PRODUCCIO_R3215.map(({ id, ruta }) => [id, fs.readFileSync(path.join(source, ruta), 'utf8')])); }
function fixture(t) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-r3217-rebuts-')));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const { ruta } of FONTS_PRODUCCIO_R3215) {
    fs.mkdirSync(path.dirname(path.join(root, ruta)), { recursive: true });
    fs.copyFileSync(path.join(source, ruta), path.join(root, ruta));
  }
  return root;
}
function snapshot(root) {
  const result = {};
  for (const { ruta } of FONTS_PRODUCCIO_R3215) {
    const file = path.join(root, ruta), st = fs.lstatSync(file);
    result[ruta] = { content: fs.readFileSync(file).toString('hex'), mtime: st.mtimeMs, mode: st.mode };
  }
  return result;
}
function mutateReceipt(input, key, edit) { const value = JSON.parse(input[key]); edit(value); input[key] = JSON.stringify(value); }
function mutateSpecs(input, key, edit) {
  const marker = '$r3215_spec$', first = input[key].indexOf(marker) + marker.length, last = input[key].indexOf(marker, first);
  const specs = JSON.parse(input[key].slice(first, last)); edit(specs);
  input[key] = input[key].slice(0, first) + JSON.stringify(specs) + input[key].slice(last);
}
test('exact R32.15 bytes and all seven SQL bodies match; verification is read-only and never claims a live connection or signer', t => {
  const root = fixture(t), before = snapshot(root), actual = verificaRebutProduccioR3215(root);
  assert.equal(actual.valid, true); assert.equal(actual.definers.length, 7); assert.equal(actual.totalDefiners, 136);
  assert.equal(actual.connexioDirectaProduccio, false); assert.equal(actual.autoriaCriptograficaVerificada, false);
  assert.equal(actual.xarxaExterna, false); assert.equal(actual.nomesLectura, true); assert.deepEqual(actual.pendentsSQLR3215, []);
  assert.equal(actual.postgresVersionDeclarada, '17.6'); assert.deepEqual(snapshot(root), before);
  assert.deepEqual(comprovaContracteRebutsR3215(fonts()).definers, actual.definers);
});
for (const descriptor of FONTS_PRODUCCIO_R3215) {
  for (const mode of ['append', 'truncate', 'replace']) {
    test(`pinned ${descriptor.id} rejects ${mode}, including apparently harmless whitespace`, t => {
      const root = fixture(t), file = path.join(root, descriptor.ruta), bytes = fs.readFileSync(file);
      if (mode === 'append') fs.appendFileSync(file, ' ');
      if (mode === 'truncate') fs.writeFileSync(file, bytes.subarray(0, bytes.length - 1));
      if (mode === 'replace') { const altered = Buffer.from(bytes); altered[Math.floor(altered.length / 2)] ^= 1; fs.writeFileSync(file, altered); }
      const result = verificaRebutProduccioR3215(root);
      assert.equal(result.valid, false); assert.equal(result.error, 'R3215_SHA256_DIVERGENT');
    });
  }
}
for (const mode of ['missing', 'symlink', 'hardlink', 'oversize', 'directory-symlink']) {
  test(`the verifier fails closed on ${mode} inputs`, t => {
    const root = fixture(t), file = path.join(root, FONTS_PRODUCCIO_R3215[0].ruta), original = file + '.original';
    fs.renameSync(file, original);
    if (mode === 'symlink') fs.symlinkSync(original, file);
    if (mode === 'hardlink') fs.linkSync(original, file);
    if (mode === 'oversize') fs.writeFileSync(file, ' '.repeat(65537));
    if (mode === 'directory-symlink') { fs.renameSync(original, file); const dir = path.dirname(file); fs.renameSync(dir, dir + '.real'); fs.symlinkSync(dir + '.real', dir); }
    assert.equal(verificaRebutProduccioR3215(root).valid, false);
  });
}
const semanticMutants = [
  ['wrong-receipt-schema', f => mutateReceipt(f, 'rebutFinal', r => { r.schema += '.forged'; })],
  ['wrong-environment', f => mutateReceipt(f, 'rebutPas1', r => { r.environment = 'local'; })],
  ['future-attestation-date', f => mutateReceipt(f, 'rebutFinal', r => { r.verifiedAt = '2099-01-01'; })],
  ['census-truncated', f => mutateReceipt(f, 'rebutPas1', r => { r.total_definers_public_private = 135; })],
  ['census-string', f => mutateReceipt(f, 'rebutPas1', r => { r.total_definers_public_private = '136'; })],
  ['census-false', f => mutateReceipt(f, 'rebutFinal', r => { r.tots_136_search_path_buit = false; })],
  ['census-string-true', f => mutateReceipt(f, 'rebutFinal', r => { r.pas2_7_definers_blindats_ok = 'true'; })],
  ['lssi-hash-mutated', f => mutateReceipt(f, 'rebutFinal', r => { r.registra_denuncia_diligent_sha256 = '0'.repeat(64); })],
  ['lssi-path-poisoned', f => mutateReceipt(f, 'rebutPas1', r => { r.registra_denuncia_diligent.config = ['search_path=public']; })],
  ['lssi-public-execute', f => mutateReceipt(f, 'rebutPas1', r => { r.registra_denuncia_diligent.public_exec = true; })],
  ['lssi-body-mutated', f => { f.snippetLssi = f.snippetLssi.replace('declare who ', 'declare whom '); }],
  ['lssi-pas1-body-mutated', f => { f.pas1Sql = f.pas1Sql.replace('declare who ', 'declare whom '); }],
  ['postimages-truncated', f => mutateReceipt(f, 'rebutFinal', r => { r.postimatges_7_definers.pop(); })],
  ['postimages-duplicated', f => mutateReceipt(f, 'rebutFinal', r => { r.postimatges_7_definers[6] = r.postimatges_7_definers[0]; })],
  ['postimage-overload', f => mutateReceipt(f, 'rebutFinal', r => { r.postimatges_7_definers[0].sig = 'public.check_market_rate_limit(text)'; })],
  ['postimage-hash-mutated', f => mutateReceipt(f, 'rebutFinal', r => { r.postimatges_7_definers[0].prosrc_sha256 = 'f'.repeat(64); })],
  ['preimage-unknown', f => mutateReceipt(f, 'rebutPas1', r => { r.seven_r32_15_fossils_preimage_verified[0].prosrc_sha256 = 'f'.repeat(64); })],
  ['anon-execute', f => mutateReceipt(f, 'rebutFinal', r => { r.postimatges_7_definers[0].anon_exec = true; })],
  ['public-execute', f => mutateReceipt(f, 'rebutFinal', r => { r.postimatges_7_definers[0].public_exec = true; })],
  ['false-as-string', f => mutateReceipt(f, 'rebutFinal', r => { r.postimatges_7_definers[0].anon_exec = 'false'; })],
  ['acl-public-execute-even-flag-false', f => mutateReceipt(f, 'rebutFinal', r => { r.postimatges_7_definers[0].acl = '{=X/postgres,postgres=X/postgres}'; })],
  ['acl-anon-execute-even-flag-false', f => mutateReceipt(f, 'rebutFinal', r => { r.postimatges_7_definers[0].acl = '{postgres=X/postgres,anon=X/postgres}'; })],
  ['legitimate-acl-removed', f => mutateReceipt(f, 'rebutFinal', r => { r.postimatges_7_definers[1].acl = '{postgres=X/postgres}'; })],
  ['snippet-spec-diverged', f => mutateSpecs(f, 'snippetDefiners', specs => { specs[0].finalBodySHA256 = 'f'.repeat(64); })],
  ['both-spec-copies-body-mutated', f => { for (const key of ['snippetDefiners', 'pas2Sql']) mutateSpecs(f, key, specs => { specs[0].ddl = specs[0].ddl.replace('item_count', 'wrong_count'); }); }],
  ['spec-set-truncated', f => { for (const key of ['snippetDefiners', 'pas2Sql']) mutateSpecs(f, key, specs => { specs.pop(); }); }],
  ['repeated-sql-spec-delimiter', f => { f.pas2Sql += '$r3215_spec$'; }],
  ['missing-ddl-body-delimiter', f => { for (const key of ['snippetDefiners', 'pas2Sql']) mutateSpecs(f, key, specs => { specs[0].ddl = specs[0].ddl.replace('$r3215_body$', '$wrong$'); }); }]
];
for (const [name, mutate] of semanticMutants) test(`semantic contract rejects ${name} independently of byte pins`, () => {
  const f = fonts(); mutate(f); assert.throws(() => comprovaContracteRebutsR3215(f));
});
test('matrix has 17 probes, includes R32.15 in D04/D05/D10, and never promotes attestation to a direct production check', t => {
  const root = fixture(t);
  for (const p of PROVES_MATRIU) { const target = path.join(root, p.args.find(a => !a.startsWith('-'))); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, '// immutable probe fixture\n'); }
  fs.cpSync(path.join(source, 'tooling/gates/fixtures/produccio-r3214'), path.join(root, 'tooling/gates/fixtures/produccio-r3214'), { recursive: true });
  const good = args => { const p = PROVES_MATRIU.find(p => JSON.stringify(p.args) === JSON.stringify(args.filter(a => !a.startsWith('--ara=')))); return { status: 0, stdout: p.tests ? '# tests 1\n# pass 1\n# fail 0\n# cancelled 0\n# skipped 0\n# todo 0\n' : p.json ? '{"valid":true}' : p.senyal }; };
  const result = avaluaMatriu(root, { executa: good });
  assert.equal(result.valid, true); assert.equal(result.resum.senyalsVerificats, 17); assert.equal(result.resum.senyalsPrevistos, 17); assert.equal(result.resum.notaGlobal, null);
  for (const id of ['D04', 'D05', 'D10']) {
    const d = result.dimensions.find(d => d.id === id);
    assert.ok(d.evidenciesVerificades.some(p => p.id === 'rebuts-r3215')); assert.equal(d.notaCodiLocal, null);
    assert.equal(d.attestacionsProduccio[0].integritatVerificada, true); assert.equal(d.attestacionsProduccio[0].connexioDirectaProduccio, false);
  }
  assert.ok(result.dimensions.find(d => d.id === 'D04').bloquejosExternsLlei0.some(p => p.id === 'sql-produccio' && p.estat === 'no_verificat'));
  fs.appendFileSync(path.join(root, FONTS_PRODUCCIO_R3215[3].ruta), ' ');
  const forged = avaluaMatriu(root, { executa: good });
  assert.equal(forged.valid, false); assert.equal(forged.rebutsProduccioR3215.valid, false);
  assert.equal(forged.resum.senyalsVerificats, 17); // mocked successful probes cannot pardon independently checked bytes
});
