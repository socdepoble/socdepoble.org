import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { build } from 'vite';
import configWeb from '../vite.config.js';
import { recursosPublicsDelPlugin } from '../vite.standalone.config.js';
import publicNet, { esResiduFinder, recursosPublicsNets, retiraResidusFinder } from '../tooling/vite/public-net.mjs';

function posa(arrel, cami, contingut = `recurs:${cami}`) {
  const abs = path.join(arrel, cami);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, contingut);
}

function mostra(t) {
  const arrel = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-build-net-')));
  t.after(() => fs.rmSync(arrel, { recursive: true, force: true }));
  posa(arrel, 'index.html', '<!doctype html><script type="module" src="/entrada.js"></script>');
  posa(arrel, 'entrada.js', 'globalThis.provaBuildNet = true;');
  return arrel;
}

const RESIDUS = ['.DS_Store', '.DS-Store', '._foto.jpg', 'fotos/.DS_Store', 'fotos/.DS-Store', 'fotos/._imatge.webp', '._carpeta/fill.txt'];
const VALIDS = ['foto.webp', 'fotos/imatge.webp', '.well-known/assetlinks.json', '.htaccess', '.keep', 'fotos/.DS_Store.txt', 'fotos/normal._sufix'];

async function compila(arrel, plugins = [publicNet()], opcions = {}) {
  return build({
    configFile: false, root: arrel, logLevel: 'silent', plugins,
    build: { outDir: 'dist', emptyOutDir: false, minify: false, ...opcions }
  });
}

test('el filtre reconeix només Finder i AppleDouble, també la variant literal .DS-Store', () => {
  for (const nom of ['.DS_Store', '.DS-Store', '._imatge', '._']) assert.equal(esResiduFinder(nom), true, nom);
  for (const nom of ['.well-known', '.htaccess', '.keep', '.DS_Store.txt', 'a._b', 'DS_Store']) assert.equal(esResiduFinder(nom), false, nom);
});

test('el build web real exclou residus abans d’emetre public/ i conserva la font i els ocults legítims', async t => {
  const arrel = mostra(t);
  for (const cami of [...RESIDUS, ...VALIDS]) posa(arrel, `public/${cami}`);
  const abans = recursosPublicsNets(path.join(arrel, 'public'));
  assert.deepEqual(abans, [...VALIDS].sort());
  const configuracio = configWeb({ command: 'serve', mode: 'development', isPreview: true });
  const plugin = configuracio.plugins.find(p => p?.name === 'sdp-public-net');
  assert.ok(plugin, 'la configuració usada per build:web ha de registrar el plugin');
  assert.equal(plugin.apply, 'build', 'el servidor de desenvolupament no muta ni copia public/');
  await compila(arrel, [plugin]);
  for (const cami of RESIDUS) {
    assert.equal(fs.existsSync(path.join(arrel, 'dist', cami)), false, cami);
    assert.equal(fs.readFileSync(path.join(arrel, 'public', cami), 'utf8'), `recurs:public/${cami}`, 'public intacte');
  }
  for (const cami of VALIDS) assert.equal(fs.readFileSync(path.join(arrel, 'dist', cami), 'utf8'), `recurs:public/${cami}`, cami);
  assert.equal(fs.existsSync(path.join(arrel, 'dist/index.html')), true);
});

test('els generadors de federació/App Links conserven prioritat sobre la còpia estàtica', async t => {
  const arrel = mostra(t);
  posa(arrel, 'public/.well-known/assetlinks.json', 'estatic');
  const generador = { name: 'fixture-generador', generateBundle() {
    this.emitFile({ type: 'asset', fileName: '.well-known/assetlinks.json', source: 'generat' });
  } };
  await compila(arrel, [publicNet(), generador]);
  assert.equal(fs.readFileSync(path.join(arrel, 'dist/.well-known/assetlinks.json'), 'utf8'), 'generat');
});

test('un build incremental retira residus antics de dist i no seguix enllaços', async t => {
  const arrel = mostra(t);
  const exterior = mostra(t);
  posa(exterior, '.DS_Store', 'exterior intacte');
  for (const cami of RESIDUS) posa(arrel, `dist/${cami}`);
  posa(arrel, 'dist/.well-known/antic.json', 'legitim');
  fs.symlinkSync(exterior, path.join(arrel, 'dist', 'enllac'));
  fs.symlinkSync(path.join(exterior, '.DS_Store'), path.join(arrel, 'dist', '._enllac'));
  await compila(arrel);
  for (const cami of [...RESIDUS, '._enllac']) assert.equal(fs.existsSync(path.join(arrel, 'dist', cami)), false, cami);
  assert.equal(fs.readFileSync(path.join(arrel, 'dist/.well-known/antic.json'), 'utf8'), 'legitim');
  assert.equal(fs.lstatSync(path.join(arrel, 'dist/enllac')).isSymbolicLink(), true);
  assert.equal(fs.readFileSync(path.join(exterior, '.DS_Store'), 'utf8'), 'exterior intacte');
});

test('WP i natiu mantenen la seua exclusió existent de tots els ocults en un build real', async t => {
  const arrel = mostra(t);
  for (const cami of [...RESIDUS, ...VALIDS]) posa(arrel, `public/${cami}`);
  for (const cami of RESIDUS) posa(arrel, `dist/${cami}`);
  await compila(arrel, [recursosPublicsDelPlugin()], { copyPublicDir: false });
  for (const cami of RESIDUS) assert.equal(fs.existsSync(path.join(arrel, 'dist', cami)), false, cami);
  for (const cami of ['foto.webp', 'fotos/imatge.webp', 'fotos/normal._sufix']) assert.equal(fs.existsSync(path.join(arrel, 'dist', cami)), true, cami);
});

test('public absent o desactivat continua permetent compilar l’entrada', async t => {
  const arrel = mostra(t);
  assert.deepEqual(recursosPublicsNets(false), []);
  assert.deepEqual(recursosPublicsNets(path.join(arrel, 'absent')), []);
  await compila(arrel);
  assert.equal(fs.existsSync(path.join(arrel, 'dist/index.html')), true);
  await build({ configFile: false, root: arrel, logLevel: 'silent', publicDir: false, plugins: [publicNet()], build: { outDir: 'dist' } });
});

test('els enllaços de la font fallen tancats i no poden fer copiar un arbre exterior', async t => {
  const arrel = mostra(t);
  const exterior = mostra(t);
  posa(exterior, 'foto.webp', 'fora');
  fs.mkdirSync(path.join(arrel, 'public'));
  fs.symlinkSync(exterior, path.join(arrel, 'public', 'enllac'));
  await assert.rejects(compila(arrel), /Enllaç simbòlic a public/);
  assert.equal(fs.readFileSync(path.join(exterior, 'foto.webp'), 'utf8'), 'fora');
  assert.equal(fs.existsSync(path.join(arrel, 'dist/enllac/foto.webp')), false);
});

test('la neteja rebutja una arrel simbòlica i el plugin un avantpassat simbòlic', t => {
  const arrel = mostra(t);
  const exterior = mostra(t);
  posa(exterior, '.DS_Store', 'fora');
  fs.symlinkSync(exterior, path.join(arrel, 'enllac'));
  assert.throws(() => retiraResidusFinder(path.join(arrel, 'enllac')), /directori real/);
  const plugin = publicNet();
  plugin.configResolved({ root: arrel, build: { outDir: 'enllac/subcarpeta' } });
  assert.throws(() => plugin.writeBundle({}), /simbòlic/);
  plugin.configResolved({ root: arrel, build: { outDir: exterior } });
  assert.throws(() => plugin.writeBundle({}), /estrictament dins/);
  assert.equal(fs.readFileSync(path.join(exterior, '.DS_Store'), 'utf8'), 'fora');
});
