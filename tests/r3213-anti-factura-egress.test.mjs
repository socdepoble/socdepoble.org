import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { inspeccionaEgress, MAX_VIDEO_BYTES, MAX_ZIP_OPENDATA_BYTES } from '../tooling/gates/tractor-anti-factura-egress.mjs';
const immutable = { source: '/assets/**', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] };
function fixture(t, extra = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-r3213-egress-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'public')); fs.mkdirSync(path.join(root, 'dist/assets'), { recursive: true });
  const config = { hosting: { public: 'dist', headers: [immutable], ...extra } };
  fs.writeFileSync(path.join(root, 'firebase.json'), JSON.stringify(config)); fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ scripts: {} }));
  fs.writeFileSync(path.join(root, 'dist/assets/index-AbCd1234.js'), 'export {}');
  return { root, config, put: (p, data = '') => { fs.mkdirSync(path.dirname(path.join(root, p)), { recursive: true }); fs.writeFileSync(path.join(root, p), data); },
    save: () => fs.writeFileSync(path.join(root, 'firebase.json'), JSON.stringify(config)) };
}
test('predeploy vàlid, lectura pura i resultat determinista', t => {
  const f = fixture(t), before = fs.readFileSync(path.join(f.root, 'firebase.json'));
  const a = inspeccionaEgress(f.root, { requireBuild: true });
  assert.equal(a.valid, true); assert.equal(a.assetsHash, 1); assert.deepEqual(a, inspeccionaEgress(f.root, { requireBuild: true }));
  assert.deepEqual(fs.readFileSync(path.join(f.root, 'firebase.json')), before);
});
for (const ext of ['apk', 'aab', 'ipa', 'zip', 'xcarchive']) test(`bloqueja ${ext} en Hosting i public, encara que siga menut`, t => {
  const f = fixture(t); f.put(`dist/descarregues/app.${ext}`);
  assert.equal(inspeccionaEgress(f.root).valid, false);
  fs.rmSync(path.join(f.root, 'dist/descarregues'), { recursive: true }); f.put(`public/app.${ext}`);
  assert.equal(inspeccionaEgress(f.root).valid, false);
});
test('directori xcarchive també bloquejat', t => { const f = fixture(t); f.put('dist/build.xcarchive/Info.plist'); assert.equal(inspeccionaEgress(f.root).valid, false); });
test('Hosting respecta ignore, la font Vite pública no el pot aprofitar', t => {
  const f = fixture(t, { ignore: ['**/*.apk'] }); f.put('dist/app.apk');
  assert.equal(inspeccionaEgress(f.root).valid, true); f.put('public/app.apk'); assert.equal(inspeccionaEgress(f.root).valid, false);
});
test('ignore negat restaura la prohibició', t => {
  const f = fixture(t, { ignore: ['**/*.apk', '!app.apk'] }); f.put('dist/app.apk'); assert.equal(inspeccionaEgress(f.root).valid, false);
});
test('vídeo superior a 15 MB sense llegir-ne el contingut', t => {
  const f = fixture(t); f.put('dist/raw.mov'); fs.truncateSync(path.join(f.root, 'dist/raw.mov'), MAX_VIDEO_BYTES + 1);
  assert.equal(inspeccionaEgress(f.root).valid, false);
  fs.truncateSync(path.join(f.root, 'dist/raw.mov'), MAX_VIDEO_BYTES); assert.equal(inspeccionaEgress(f.root).valid, true);
});
test('bloqueja symlink i ancestre symlink encara que ignore el nom', t => {
  const f = fixture(t, { ignore: ['**'] }); fs.symlinkSync('/tmp', path.join(f.root, 'dist/link')); assert.equal(inspeccionaEgress(f.root).valid, false);
  fs.unlinkSync(path.join(f.root, 'dist/link')); fs.symlinkSync('/tmp', path.join(f.root, 'alias')); f.config.hosting.public = 'alias/sub'; f.save();
  assert.equal(inspeccionaEgress(f.root).valid, false);
});
test('refusa hardlink a dades alienes', t => {
  const f = fixture(t); f.put('secret.txt', 'secret'); fs.linkSync(path.join(f.root, 'secret.txt'), path.join(f.root, 'dist/leak.txt'));
  assert.equal(inspeccionaEgress(f.root).valid, false);
});
test('refusa traversals i noms absoluts en cada target', t => {
  const f = fixture(t); for (const nom of ['../fora', '/tmp', 'dist/../public', 'dist\\public', './dist', 'dist//x']) {
    f.config.hosting.public = nom; f.save(); assert.equal(inspeccionaEgress(f.root).valid, false, nom);
  }
});
test('multi-hosting comprova tots els targets', t => {
  const f = fixture(t); f.put('segon/a.zip'); f.config.hosting = [f.config.hosting, { public: 'segon', headers: [immutable] }]; f.save();
  assert.equal(inspeccionaEgress(f.root).valid, false);
});
test('l’últim Cache-Control coincident mana; no-cache posterior revoca immutable', t => {
  const f = fixture(t); f.config.hosting.headers.push({ source: '**', headers: [{ key: 'Cache-Control', value: 'no-cache' }] }); f.save();
  assert.equal(inspeccionaEgress(f.root).valid, false);
});
test('regla immutable no és suficient si no coincidix amb asset real', t => {
  const f = fixture(t); f.put('dist/fonts/font-AbCd1234.woff2'); assert.equal(inspeccionaEgress(f.root).valid, false);
});
test('regex RE2 lineal de producció funciona i complement extglob també', t => {
  const f = fixture(t); f.config.hosting.headers = [
    { source: '!/@(assets|fonts)/**', headers: [{ key: 'Cache-Control', value: 'no-cache' }] },
    { regex: '^/assets/[^/]+-[A-Za-z0-9_-]{8}\\.(js|mjs|css|woff2?)$', headers: immutable.headers }
  ]; f.save(); assert.equal(inspeccionaEgress(f.root).valid, true);
});
test('regex adversarial i CRLF fallen tancades', t => {
  const f = fixture(t); for (const regex of ['^(a+)+$', '^(a|aa)+$', '^.*.*$', '(unanchored)', '^/assets/(?=x).*$']) {
    f.config.hosting.headers = [{ regex, headers: immutable.headers }]; f.save(); assert.equal(inspeccionaEgress(f.root).valid, false, regex);
  }
  f.config.hosting.headers = [{ ...immutable, headers: [{ key: 'Cache-Control', value: 'immutable\r\nX: 1' }] }]; f.save(); assert.equal(inspeccionaEgress(f.root).valid, false);
});
test('prebuild declara output absent i predeploy el rebutja', t => {
  const f = fixture(t); fs.rmSync(path.join(f.root, 'dist'), { recursive: true });
  const pre = inspeccionaEgress(f.root); assert.equal(pre.valid, true); assert.deepEqual(pre.absents, ['dist']);
  assert.equal(inspeccionaEgress(f.root, { requireBuild: true }).valid, false);
});
test('inspecciona scripts i regles declaratives sense executar-los', t => {
  const f = fixture(t); f.put('scripts/empaqueta.mjs', "// 'public/ignorat.zip'\nfs.writeFileSync('public/aplicacio.zip', bytes); throw new Error('NO EXECUTAR');\n");
  let r = inspeccionaEgress(f.root); assert.equal(r.valid, false); assert.equal(r.scriptsExaminats.length, 1);
  fs.rmSync(path.join(f.root, 'scripts/empaqueta.mjs'));
  f.put('package.json', JSON.stringify({ scripts: { build: 'cp build.apk dist/build.apk' }, sdpArtefactes: [{ destinacio: 'public/app.ipa' }] }));
  r = inspeccionaEgress(f.root); assert.equal(r.valid, false); assert.equal(r.incidencies.length, 2);
});
test('mutants: remove immutable, change hash route, exclude only APK cannot whitelist AAB', t => {
  const f = fixture(t, { ignore: ['**/*.apk'] });
  f.config.hosting.headers[0] = { source: '/assets/**', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000' }] }; f.save(); assert.equal(inspeccionaEgress(f.root).valid, false);
  f.config.hosting.headers = [immutable]; f.put('dist/app.aab'); f.save(); assert.equal(inspeccionaEgress(f.root).valid, false);
});

test('noms públics humans i dimensions no són fingerprints de Vite', t => {
  const f = fixture(t);
  f.config.hosting.headers = [{ regex: '^/assets/[^/]+-[A-Za-z0-9_-]{8}\\.(js|mjs|css|woff2?)$', headers: immutable.headers }]; f.save();
  f.put('dist/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png');
  f.put('dist/assets/system/ui/og-socdepoble-1200x630.webp');
  f.put('public/assets/system/ui/og-socdepoble-1200x630.webp');
  f.put('dist/assets/mur/copies_seguretat_farcellet_hero-social-1200x630.jpg');
  f.put('public/assets/mur/copies_seguretat_farcellet_hero-social-1200x630.jpg');
  assert.equal(inspeccionaEgress(f.root).valid, true);
  f.put('dist/assets/picture-CoTRNpyq.webp');
  assert.equal(inspeccionaEgress(f.root).valid, false);
});
test('reconeix hash Vite amb guió/underscore i digest hexadecimal llarg', t => {
  const f = fixture(t); f.put('dist/fonts/font-A_b-1234.woff2');
  assert.equal(inspeccionaEgress(f.root).valid, false);
  fs.rmSync(path.join(f.root, 'dist/fonts'), { recursive: true });
  f.put('dist/images/picture-0123456789abcdef0123456789abcdef.png');
  assert.equal(inspeccionaEgress(f.root).valid, false);
});
test('regex amb opcionals o alternances combinatòries falla abans d’avaluar-la', t => {
  const f = fixture(t);
  for (const regex of ['^' + 'a?'.repeat(120) + 'a'.repeat(120) + '$', '^' + '(a|aa)'.repeat(30) + '$', '^a{0,99}b{0,99}$']) {
    f.config.hosting.headers = [{ regex, headers: immutable.headers }]; f.save();
    const r = inspeccionaEgress(f.root); assert.equal(r.valid, false); assert.match(r.incidencies[0].motiu, /Regex|regex/);
  }
});

test('un hash que pareix dimensions exigix immutable si no té còpia pública idèntica', t => {
  const f = fixture(t); f.put('dist/imatges/photo-1200x630.webp', 'generated hash');
  assert.equal(inspeccionaEgress(f.root).valid, false);
  f.put('public/imatges/photo-1200x630.webp', 'different source');
  assert.equal(inspeccionaEgress(f.root).valid, false);
  f.put('public/imatges/photo-1200x630.webp', 'generated hash');
  assert.equal(inspeccionaEgress(f.root).valid, true);
});

test('paraula humana de 8 lletres i llicència només s’exempten amb font pública idèntica', t => {
  const f = fixture(t);
  f.config.hosting.headers = [{ regex: '^/assets/[^/]+-[A-Za-z0-9_-]{8}\\.(js|mjs|css|woff2?)$', headers: immutable.headers }]; f.save();
  for (const nom of ['assets/mur/el-viatjant.webp', 'assets/system/cc-by-nc-sa.svg']) {
    f.put('dist/' + nom, 'static human asset');
    assert.equal(inspeccionaEgress(f.root).valid, false);
    f.put('public/' + nom, 'static human asset');
    assert.equal(inspeccionaEgress(f.root).valid, true);
  }
});
test('digest hexadecimal d’imatge pública continua exigint immutable', t => {
  const f = fixture(t), nom = 'images/wp-public-01234567.webp';
  f.put('dist/' + nom, 'same'); f.put('public/' + nom, 'same');
  assert.equal(inspeccionaEgress(f.root).valid, false);
});

/* R32.14 (D07/D14) · L'única excepció: opendata/*.zip regular i <= 2 MB, a la font i a Hosting. */
test('R32.14 · el paquet OpenData lleuger passa, a la font i a Hosting', t => {
  const f = fixture(t); f.put('public/opendata/dades-obertes-poble.zip', Buffer.alloc(21_096)); f.put('dist/opendata/dades-obertes-poble.zip', Buffer.alloc(21_096));
  const r = inspeccionaEgress(f.root, { requireBuild: true });
  assert.equal(r.valid, true, JSON.stringify(r.incidencies));
  fs.truncateSync(path.join(f.root, 'dist/opendata/dades-obertes-poble.zip'), MAX_ZIP_OPENDATA_BYTES);
  assert.equal(inspeccionaEgress(f.root, { requireBuild: true }).valid, true);
});
test('R32.14 · un ZIP OpenData de més de 2 MB, niat, d’un altre format o fora d’opendata continua bloquejat', t => {
  for (const [cami, mida] of [['dist/opendata/gros.zip', MAX_ZIP_OPENDATA_BYTES + 1], ['public/opendata/gros.zip', MAX_ZIP_OPENDATA_BYTES + 1],
    ['dist/opendata/sub/a.zip', 10], ['dist/opendata/app.apk', 10], ['dist/opendata/app.aab', 10], ['dist/opendata/app.ipa', 10],
    ['dist/descarregues/opendata/a.zip', 10], ['dist/a.zip', 10], ['dist/opendatax/a.zip', 10]]) {
    const f = fixture(t); f.put(cami); fs.truncateSync(path.join(f.root, cami), mida);
    assert.equal(inspeccionaEgress(f.root, { requireBuild: true }).valid, false, cami);
  }
});
test('R32.14 · un directori amb nom de ZIP OpenData no és cap excepció', t => {
  const f = fixture(t); f.put('dist/opendata/paquet.zip/a.txt', 'x');
  assert.equal(inspeccionaEgress(f.root, { requireBuild: true }).valid, false);
});
