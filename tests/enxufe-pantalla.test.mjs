/** PHP real sobre el plugin i la plantilla; geometria CSS sobre l'HTML emés.
 * No carrega wp-config.php, cap BD ni el bundle real. La prova de navegador a
 * Studio continua sent necessària per a dvh, scroll i barra d'administració. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLUGIN = path.join(ARREL, 'wordpress-plugin');
const FIXTURE = path.join(ARREL, 'tests/fixtures/enxufe-pantalla.php');
const FULLSCREEN = 'socdepoble-enxufe-pantalla-completa';

function cercaPhp() {
  if (process.env.PHP_BIN) return process.env.PHP_BIN;
  const studio = path.join(os.homedir(), '.studio/php-bin');
  const instal_lats = fs.existsSync(studio)
    ? fs.readdirSync(studio).sort().reverse().map(versio => path.join(studio, versio, 'php'))
    : [];
  return ['php', ...instal_lats].find(binari => spawnSync(binari, ['-v'], { timeout: 5000 }).status === 0);
}

const PHP = cercaPhp();
const OPCIONS = { skip: !PHP && 'PHP absent: instal·la PHP o indica PHP_BIN (també es detecta WordPress Studio).' };

function executa(t, cas) {
  const temporal = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-pantalla-'));
  t.after(() => fs.rmSync(temporal, { recursive: true, force: true }));
  const plugin = path.join(temporal, 'socdepoble-enxufe');
  fs.mkdirSync(plugin);
  for (const rel of ['socdepoble-enxufe.php', 'includes', 'templates']) {
    fs.cpSync(path.join(PLUGIN, rel), path.join(plugin, rel), { recursive: true });
  }
  fs.mkdirSync(path.join(plugin, 'dist'));
  fs.writeFileSync(path.join(plugin, 'dist/soc-de-poble.standalone.js'), '// fixture\n');
  const resultat = spawnSync(PHP, [FIXTURE, plugin], {
    encoding: 'utf8', input: JSON.stringify(cas), timeout: 10000
  });
  assert.equal(resultat.status, 0, resultat.error?.message || resultat.stderr || resultat.stdout);
  assert.equal(resultat.stderr, '');
  return { ...JSON.parse(resultat.stdout), plugin };
}

test('pantalla completa: el selector només substituïx una pàgina que l’ha triada', OPCIONS, t => {
  for (const cas of [
    {},
    { plantilla: 'pagina.php' },
    { plantilla: FULLSCREEN, pagina: false },
    { plantilla: FULLSCREEN, id: 0 }
  ]) {
    assert.equal(executa(t, cas).plantilla, '/tema/pagina.php', JSON.stringify(cas));
  }
  const seleccionada = executa(t, { plantilla: FULLSCREEN });
  assert.equal(seleccionada.plantilla, fs.realpathSync(path.join(seleccionada.plugin, 'templates/pantalla-completa.php')));
  assert.equal(seleccionada.plantilles['pagina.php'], 'Tema');
  assert.ok(seleccionada.plantilles[FULLSCREEN]);
});

test('pantalla completa: conserva hooks i contingut, dos instàncies compartixen bundle i declaració', OPCIONS, t => {
  const resultat = executa(t, { plantilla: FULLSCREEN, render: true, instancies: 2 });
  assert.deepEqual(resultat.events, ['head', 'body_open', 'content', 'footer']);
  assert.equal(resultat.declaracions, 1);
  assert.equal(resultat.scripts.length, 1);
  const dom = new JSDOM(resultat.html);
  t.after(() => dom.window.close());
  const doc = dom.window.document;
  assert.ok(doc.head.querySelector('meta[name="fixture-head"]'));
  assert.equal(doc.body.firstElementChild.dataset.hook, 'body-open');
  assert.equal(doc.body.lastElementChild.dataset.hook, 'footer');
  assert.equal(doc.querySelectorAll('soc-de-poble').length, 2);
  assert.equal(doc.querySelectorAll('script[src]').length, 1);
  assert.ok(doc.querySelector('script:not([src])').textContent.includes('window.SocDePobleConfig'));
  assert.equal(doc.querySelector('script[src]').previousElementSibling.tagName, 'SCRIPT');
});

test('pantalla completa: delega el contingut protegit a WordPress sense llegir el cos cru', OPCIONS, t => {
  const resultat = executa(t, { plantilla: FULLSCREEN, render: true, protegit: true });
  assert.deepEqual(resultat.events, ['head', 'body_open', 'content', 'footer']);
  assert.ok(resultat.html.includes('post-password-form'));
  assert.ok(!resultat.html.includes('CONTINGUT_PROTEGIT_NO_PUBLICABLE'));
  assert.deepEqual(resultat.scripts, []);
  assert.equal(resultat.declaracions, 0);
});

test('pantalla completa: la caixa pot baixar de 32rem sense alterar les insercions ordinàries', OPCIONS, t => {
  const resultat = executa(t, { plantilla: FULLSCREEN, render: true });
  const dom = new JSDOM(resultat.html);
  t.after(() => dom.window.close());
  const { document, getComputedStyle } = dom.window;
  const caixa = document.querySelector('.socdepoble-enxufe');
  assert.equal(parseFloat(getComputedStyle(caixa).minHeight), 0, 'el mínim no pot superar el viewport curt');
  for (const costat of ['Top', 'Right', 'Bottom', 'Left']) {
    assert.equal(parseFloat(getComputedStyle(caixa)[`margin${costat}`]), 0);
    assert.equal(parseFloat(getComputedStyle(document.body)[`margin${costat}`]), 0);
    assert.equal(parseFloat(getComputedStyle(document.body)[`padding${costat}`]), 0);
  }
  document.body.className = '';
  assert.equal(getComputedStyle(caixa).minHeight, '32rem', 'l’override pertany només a la plantilla completa');
});
