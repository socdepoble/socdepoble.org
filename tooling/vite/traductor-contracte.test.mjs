/**
 * Prova de contracte del Traductor Sobirà (IDEA-31, cicle 2 del Gauntlet,
 * decisió 9 de l'orquestrador, 261030). La matriu de motors del navegador,
 * MOTORS_TRADUCCIO de src/data/traductorLliure.js, és l'única font de veritat.
 * El servidor de dev (APERTIUM_PER_DESTI de traductor-iaia.mjs) i el connector
 * WordPress (wordpress-plugin/includes/traduccio.php, llegit com a text i
 * executat amb la fixture de PHP) la repliquen: els mateixos destins
 * d'Apertium, el mateix parell i els mateixos extrems en el mateix ordre (la
 * beta primer, G10), el gallec només a la beta, i la llista tancada de destins
 * és la del menú (LLENGUES_TRADUCCIO). Els destins que el navegador no envia
 * a Apertium (EU i DE, MyMemory) al servidor són sdp_traduccio_sense_clau
 * sense cap crida, si no hi ha proveïdor configurat (D-3).
 *
 * Cap xarxa: la fixture de PHP dobla wp_remote_post. SDP_TEST_ROOT apunta a
 * una altra arrel (còpies amb mutants fora del repositori).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const arrel = process.env.SDP_TEST_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const importa = (relatiu) => import(pathToFileURL(path.join(arrel, relatiu)).href);
const lliure = await importa('src/data/traductorLliure.js');
const { LLENGUES_TRADUCCIO } = await importa('src/data/traductor.js');
const dev = await importa('tooling/vite/traductor-iaia.mjs');
const MODUL_PHP = path.join(arrel, 'wordpress-plugin/includes/traduccio.php');
const FIXTURE_PHP = path.join(arrel, 'tests/fixtures/enxufe-traduccio.php');

const BETA = 'https://beta.apertium.org/apy/translate';
const PRINCIPAL = 'https://apertium.org/apy/translate';
const CODIS_MENU = LLENGUES_TRADUCCIO.map((llengua) => llengua.codi);
const ordenats = (llista) => [...llista].sort();

/** Els destins d'Apertium de MOTORS_TRADUCCIO: { destí: { parell, extrems } }. */
function apertiumDelClient() {
  const motors = lliure.MOTORS_TRADUCCIO;
  assert.ok(motors && typeof motors === 'object',
    'src/data/traductorLliure.js ha d’exportar MOTORS_TRADUCCIO (contracte A1/A2 del cicle 2)');
  return Object.fromEntries(Object.entries(motors)
    .filter(([, motor]) => motor.motor === 'apertium')
    .map(([desti, { parell, extrems }]) => [desti, { parell, extrems: [...extrems] }]));
}

/** El cos d'una funció del PHP, com a text. */
function cosPhp(nom) {
  const cos = fs.readFileSync(MODUL_PHP, 'utf8').match(new RegExp(`\\nfunction ${nom}\\([^)]*\\) \\{\\n([^]*?)\\n\\}\\n`))?.[1];
  assert.ok(cos, `traduccio.php té la funció ${nom}()`);
  return cos;
}

test('MOTORS_TRADUCCIO: congelada, un motor conegut per destí i els destins del menú; GL només a la beta, EU i DE a MyMemory', () => {
  const motors = lliure.MOTORS_TRADUCCIO;
  const apertium = apertiumDelClient();
  assert.ok(Object.isFrozen(motors), 'MOTORS_TRADUCCIO és congelada');
  assert.equal(lliure.APERTIUM_BETA, BETA);
  assert.deepEqual(ordenats(Object.keys(motors)), ordenats(CODIS_MENU), 'cada llengua del menú té el seu motor, i cap més');
  for (const [desti, motor] of Object.entries(motors)) {
    assert.ok(['apertium', 'mymemory'].includes(motor.motor), `${desti}: motor conegut`);
    assert.equal(typeof motor.parell, 'string', `${desti}: parell`);
    if (motor.motor === 'apertium') {
      assert.ok(Array.isArray(motor.extrems) && motor.extrems.length > 0, `${desti}: extrems en ordre`);
      assert.equal(motor.extrems[0], BETA, `${desti}: la beta primer (G10)`);
      assert.ok(motor.extrems.every((url) => url === BETA || url === PRINCIPAL), `${desti}: només els extrems del projecte Apertium`);
    } else {
      assert.equal(motor.extrems, undefined, `${desti}: els extrems només són d’Apertium`);
    }
  }
  assert.deepEqual(apertium.GL, { parell: 'cat|glg', extrems: [BETA] }, 'l’extrem principal no té cat|glg (400 «That pair is not installed»)');
  for (const desti of ['ES', 'EN-GB', 'FR']) assert.deepEqual(apertium[desti]?.extrems, [BETA, PRINCIPAL], desti);
  assert.deepEqual([motors.EU?.motor, motors.DE?.motor], ['mymemory', 'mymemory']);
});

test('servidor de dev: els mateixos destins d’Apertium, el mateix parell i els mateixos extrems en el mateix ordre', () => {
  const client = apertiumDelClient();
  const servidor = Object.fromEntries(Object.entries(dev.APERTIUM_PER_DESTI).map(([desti, { parell, extrems }]) => [desti, { parell, extrems: [...extrems] }]));
  assert.deepEqual(servidor, client);
  assert.deepEqual(ordenats(dev.DESTINS_TRADUCCIO), ordenats(CODIS_MENU), 'la llista tancada del servidor és la del menú');
  for (const desti of CODIS_MENU) {
    const proveidor = dev.proveidorPer(desti, {});
    if (client[desti]) {
      assert.deepEqual([proveidor.nom, proveidor.parell, proveidor.extrems], ['apertium', client[desti].parell, client[desti].extrems], desti);
    } else {
      assert.equal(proveidor.error?.cos.code, 'sdp_traduccio_sense_clau', `${desti}: sense proveïdor, «no disponible» sense cap crida (D-3)`);
      assert.equal(dev.proveidorPer(desti, { SDP_TRADUCCIO_URL: 'https://lliure.example/translate' }).target, dev.CODIS_LLIURE[desti], `${desti}: target del destí (G3)`);
    }
  }
});

test('connector WordPress (llegit com a text): mateixos parells i extrems en el mateix ordre, mateixa llista tancada i mateixos codis lliures', () => {
  const client = apertiumDelClient();
  const cos = cosPhp('socdepoble_enxufe_traduccio_apertium_motors');
  const files = cos.split('\n').filter((linia) => linia.includes('=>'));
  const motors = Object.fromEntries(files.map((linia) => {
    const parts = linia.match(/^\t\t'([A-Z-]+)' => array\( '([a-z|]+)', array\( ((?:'[^']+'(?:, )?)+) \) \),$/);
    assert.ok(parts, `fila llegible: ${linia.trim()}`);
    return [parts[1], { parell: parts[2], extrems: [...parts[3].matchAll(/'([^']+)'/g)].map((m) => m[1]) }];
  }));
  assert.deepEqual(motors, client);
  const llista = cosPhp('socdepoble_enxufe_traduir').match(/! in_array\( \$desti, array\( ([^)]*) \), true \)/)?.[1];
  assert.ok(llista, 'trobada la llista tancada de destins');
  assert.deepEqual(ordenats([...llista.matchAll(/'([^']+)'/g)].map((m) => m[1])), ordenats(CODIS_MENU));
  const codis = cosPhp('socdepoble_enxufe_traduccio_lliure').match(/\$codis = array\( ([^)]*) \);/)?.[1];
  assert.ok(codis, 'trobats els codis del proveïdor lliure');
  assert.deepEqual(Object.fromEntries([...codis.matchAll(/'([A-Z-]+)' => '([a-z]+)'/g)].map((m) => [m[1], m[2]])), { ...dev.CODIS_LLIURE });
  assert.doesNotMatch(fs.readFileSync(MODUL_PHP, 'utf8'), /'target' => 'de'/, 'G3: cap target fix');
});

test('connector WordPress (executat): cada destí d’Apertium crida els extrems del contracte, en ordre i amb el seu parell; els altres, cap crida', () => {
  const studio = path.join(os.homedir(), '.studio/php-bin');
  const candidats = fs.existsSync(studio) ? fs.readdirSync(studio).sort().reverse().map((versio) => path.join(studio, versio, 'php')) : [];
  const php = [process.env.PHP_BIN, 'php', ...candidats].filter(Boolean).find((cami) => spawnSync(cami, ['-v']).status === 0);
  assert.ok(php, 'PHP és obligatori per a la prova de contracte (PHP_BIN o WordPress Studio)');
  const executa = (cas) => {
    const p = spawnSync(php, [FIXTURE_PHP, MODUL_PHP], { input: JSON.stringify(cas), encoding: 'utf8', timeout: 15000 });
    assert.equal(p.status, 0, p.stderr || p.stdout);
    return JSON.parse(p.stdout);
  };
  const client = apertiumDelClient();
  for (const desti of CODIS_MENU) {
    const cos = { textos: ['Bon dia'], desti, origen: 'CA', format: 'text' };
    if (client[desti]) {
      // Tots els extrems cauen (503): el connector els prova tots, en ordre, i cap més.
      const fail = Object.fromEntries([BETA, PRINCIPAL].map((url) => [url, 503]));
      const r = executa({ key: '', steps: [{ body: cos, fail }] });
      assert.deepEqual(r.calls.map((c) => c.url), client[desti].extrems, desti);
      assert.ok(r.calls.every((c) => c.body.langpair === client[desti].parell && c.body.format === 'txt'), `${desti}: parell i format=txt`);
    } else {
      const r = executa({ key: '', steps: [{ body: cos }] });
      assert.deepEqual([r.responses[0].code, r.calls.length], ['sdp_traduccio_sense_clau', 0], desti);
    }
  }
});
