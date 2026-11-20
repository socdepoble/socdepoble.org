import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { lligFitxerEditorialAcotat, main } from '../importacio/importa-editorial.mjs';
import { verificaMapaRedireccions301 } from '../seo/mapa-redireccions-301.mjs';
import { generaTaulaEditorial301, exportaTaulaEditorial301 } from '../importacio/mapa-editorial-301.mjs';
const temporary = fn => {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-editorial-r3216-')));
  try { return fn(dir); } finally { fs.rmSync(dir, { recursive: true, force: true }); }
};
const input = [{ id: 3, title: { rendered: 'La memòria' }, content: { rendered: '<p>Patrimoni segur.</p>' }, date_gmt: '2026-11-19T12:30:00', link: 'https://socdepoble.net/memoria/' }];

test('R32.16 CLI importa sense xarxa ni escriptures i genera mapa revisat', async () => {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-editorial-r3216-')));
  try {
    const file = path.join(dir, 'wp.json'), map = path.join(dir, 'map.json');
    fs.writeFileSync(file, JSON.stringify(input));
    fs.writeFileSync(map, JSON.stringify({ destinacions: { 'https://socdepoble.net/memoria/': '/mur/memoria' }, destinsDisponibles: ['/mur/memoria'] }));
    const files = fs.readdirSync(dir), output = [];
    assert.equal(await main(['--format', 'wordpress-json', '--input', file, '--mapa', map], { stdout: { write: s => output.push(s) } }), 0);
    const result = JSON.parse(output.join(''));
    assert.equal(result.articles[0].publish_date, '2026-11-19T12:30:00.000Z');
    assert.deepEqual(result.mapa301.redireccions, [{ source: 'https://socdepoble.net/memoria/', destination: '/mur/memoria', status: 301 }]);
    assert.deepEqual(fs.readdirSync(dir), files);
    const child = spawnSync(process.execPath, ['tooling/importacio/importa-editorial.mjs', '--format', 'wordpress-json', '--input', file], { cwd: path.resolve(import.meta.dirname, '../..'), encoding: 'utf8', timeout: 10000 });
    assert.equal(child.status, 0, child.stderr);
    assert.equal(JSON.parse(child.stdout).articles.length, 1);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('R32.16 lector refusa symlinks, hardlinks, directoris, excés i UTF8 invàlid', () => temporary(dir => {
  const file = path.join(dir, 'data.json'); fs.writeFileSync(file, 'abc');
  assert.equal(lligFitxerEditorialAcotat(file, 3).toString(), 'abc');
  assert.throws(() => lligFitxerEditorialAcotat(file, 2));
  assert.throws(() => lligFitxerEditorialAcotat(dir, 100));
  const symlink = path.join(dir, 'symlink'); fs.symlinkSync(file, symlink);
  assert.throws(() => lligFitxerEditorialAcotat(symlink, 3));
  const linkedDir = path.join(dir, 'linked-dir'); fs.symlinkSync(dir, linkedDir);
  assert.throws(() => lligFitxerEditorialAcotat(path.join(linkedDir, 'data.json'), 3));
  const hard = path.join(dir, 'hard'); fs.linkSync(file, hard);
  assert.throws(() => lligFitxerEditorialAcotat(file, 3));
}));

test('R32.16 lector conserva la cota quan el fitxer creix després de fstat', () => temporary(dir => {
  const file = path.join(dir, 'growing'); fs.writeFileSync(file, 'abc');
  const original = fs.readSync;
  let first = true;
  fs.readSync = (...args) => { if (first) { first = false; fs.appendFileSync(file, 'x'.repeat(100)); } return original(...args); };
  try { assert.throws(() => lligFitxerEditorialAcotat(file, 10), /fora de pressupost/); }
  finally { fs.readSync = original; }
}));

test('R32.16 CLI adjunts llegix bytes i refusa SHA, traversal, JSON i opcions mutants', async () => {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-editorial-r3216-')));
  try {
    const file = path.join(dir, 'wp.json'), media = path.join(dir, 'media.json');
    fs.writeFileSync(file, JSON.stringify(input)); fs.writeFileSync(path.join(dir, 'image.jpg'), 'abc');
    fs.writeFileSync(media, JSON.stringify([{ url: 'https://socdepoble.net/image.jpg', file: 'image.jpg' }]));
    const output = [];
    await main(['--format', 'wordpress-json', '--input', file, '--adjunts', media], { stdout: { write: s => output.push(s) } });
    assert.equal(JSON.parse(output.join('')).adjunts[0].sha256, 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    for (const mutant of [{ file: '../escape.jpg' }, { file: '/etc/passwd' }, { file: 'image.jpg', sha256: '0'.repeat(64) }]) {
      fs.writeFileSync(media, JSON.stringify([{ url: 'https://socdepoble.net/image.jpg', ...mutant }]));
      await assert.rejects(main(['--format', 'wordpress-json', '--input', file, '--adjunts', media]));
    }
    for (const args of [[], ['--input', file, '--format', 'evil'], ['--input', file, '--input', file, '--format', 'wordpress-json']]) await assert.rejects(main(args));
    fs.writeFileSync(file, Buffer.from([0xff]));
    await assert.rejects(main(['--format', 'wordpress-json', '--input', file]));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('R32.16 taula 301 refusa cadenes, bucles, open redirects i inventaris absents', () => {
  const source = 'https://socdepoble.net/memoria/', articles = [{ fontsOriginals: [source] }];
  for (const dest of [source, 'https://socdepoble.com/other', '//evil.test/a', 'https://evil.test/a', '/mur/../a', '/mur/%2Fa', '/mur/missing']) assert.throws(() => generaTaulaEditorial301(articles, { destinsDisponibles: ['/mur/memoria'], destinacions: { [source]: dest } }));
  assert.throws(() => generaTaulaEditorial301(articles, { destinsDisponibles: ['/mur/memoria'], destinacions: {} }));
  const table = generaTaulaEditorial301(articles, { destinsDisponibles: ['/mur/memoria'], destinacions: { [source]: '/mur/memoria' } });
  assert.equal(table.verificacio.valid, true);
  assert.match(exportaTaulaEditorial301(table).nginx, /return 301 https:\/\/socdepoble\.org\/mur\/memoria/);
  assert.deepEqual(generaTaulaEditorial301(articles, { destinsDisponibles: ['/mur/memoria'], destinacions: { [source]: '/mur/memoria' } }), table);
});

test('R32.16 lector detecta substitució d’ancestre entre lstat i open sense llegir fitxer alié', () => temporary(dir => {
  const safe = path.join(dir, 'safe'), outside = path.join(dir, 'outside');
  fs.mkdirSync(safe); fs.mkdirSync(outside);
  fs.writeFileSync(path.join(safe, 'file'), 'inside'); fs.writeFileSync(path.join(outside, 'file'), 'outside-snapshot');
  const original = fs.openSync, originalRead = fs.readSync;
  let readCalls = 0;
  fs.readSync = (...args) => { readCalls++; return originalRead(...args); };
  fs.openSync = (...args) => {
    fs.renameSync(safe, safe + '-old'); fs.symlinkSync(outside, safe);
    return original(...args);
  };
  try { assert.throws(() => lligFitxerEditorialAcotat(path.join(safe, 'file'), 100), /substituïda|Ruta modificada/); assert.equal(readCalls, 0); }
  finally { fs.openSync = original; fs.readSync = originalRead; }
}));

test('R32.16 constructor fusionat conserva decisions del verificador R32.14 sobre corpus diferencial fixat', () => {
  const fixture = JSON.parse(fs.readFileSync(new URL('./importacio-editorial-r3216-differential.json', import.meta.url), 'utf8'));
  assert.equal(fixture.schema, 'sdp.redirect301.legacy-differential.v1');
  assert.equal(fixture.referenceSHA256, '4f2d44075f9792249bdee5470bf23d2488bcc7b687b67d6797ea0323e245a0af');
  assert.equal(fixture.cases.length, 166);
  for (const entry of fixture.cases) {
    if (!entry.reference.valid) assert.throws(() => generaTaulaEditorial301(entry.articles, entry.options), new RegExp(entry.reference.code), entry.name);
    else {
      const table = generaTaulaEditorial301(entry.articles, entry.options);
      assert.equal(table.verificacio.valid, true, entry.name);
      assert.equal(table.redireccions.length, entry.reference.count, entry.name);
      // The separately callable raw verifier must still accept generated rows.
      assert.equal(verificaMapaRedireccions301(table).valid, true, entry.name);
    }
  }
});

test('R32.16 constructor refusa fonts buides, heretades i correspondències absents sense confiar en replay', () => {
  const source = 'https://socdepoble.net/a', options = { destinacions: { [source]: '/mur/final' }, destinsDisponibles: ['/mur/final'] };
  for (const article of [{ fontsOriginals: [] }, { fontsOriginals: 'oops', linkOriginal: source }, Object.create({ linkOriginal: source }), {}]) assert.throws(() => generaTaulaEditorial301([article], options));
  const articles = [{ linkOriginal: source }];
  assert.equal(generaTaulaEditorial301(articles, options).verificacio.valid, true);
  options.destinsDisponibles[0] = '/mur/other';
  assert.throws(() => generaTaulaEditorial301(articles, options), /desti_no_verificat/);
  assert.throws(() => generaTaulaEditorial301(articles, { destinacions: Object.create({ [source]: '/mur/final' }), destinsDisponibles: ['/mur/final'] }));
});

test('R32.16 rutaDestiCanonica explícita revisada conserva oracle R32.14 i totes les barreres', () => {
  const fixture = JSON.parse(fs.readFileSync(new URL('./importacio-editorial-r3216-differential.json', import.meta.url), 'utf8'));
  for (const entry of fixture.cases) {
    const articles = entry.articles.map(article => ({ linkOriginal: article.fontsOriginals[0], rutaDestiCanonica: entry.options.destinacions[article.fontsOriginals[0]] }));
    const options = { destinsDisponibles: entry.options.destinsDisponibles };
    if (!entry.reference.valid) assert.throws(() => generaTaulaEditorial301(articles, options), new RegExp(entry.reference.code), entry.name);
    else {
      const table = generaTaulaEditorial301(articles, options);
      assert.equal(table.verificacio.valid, true, entry.name);
      assert.equal(table.redireccions.length, entry.reference.count, entry.name);
      assert.equal(verificaMapaRedireccions301(table).valid, true, entry.name);
    }
  }
  const source = 'https://socdepoble.net/a', inventory = { destinsDisponibles: ['/mur/final'] };
  for (const route of [undefined, null, {}, '//evil.test/a', 'https://socdepoble.net/a', 'https://socdepoble.com/chain', '/mur/../final', '/mur/missing']) assert.throws(() => generaTaulaEditorial301([{ linkOriginal: source, rutaDestiCanonica: route }], inventory));
  assert.throws(() => generaTaulaEditorial301([{ linkOriginal: source, rutaDestiCanonica: '/mur/final' }], { ...inventory, destinacions: { [source]: '/mur/other' } }), /divergents/);
  assert.throws(() => generaTaulaEditorial301([{ linkOriginal: source, fontsOriginals: [source, 'https://socdepoble.com/b'], rutaDestiCanonica: '/mur/final' }], inventory), /expandir/);
  const table = generaTaulaEditorial301([{ linkOriginal: source, rutaDestiCanonica: '/mur/final' }, { linkOriginal: 'https://socdepoble.com/b', rutaDestiCanonica: '/mur/final' }], inventory);
  assert.equal(table.redireccions.length, 2);
  assert.throws(() => generaTaulaEditorial301([{ linkOriginal: source, rutaDestiCanonica: '/mur/final' }, { linkOriginal: 'http://www.socdepoble.net/a', rutaDestiCanonica: '/mur/final' }], inventory), /origen_duplicat/);
});
