import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const candidats = ['php', process.env.PHP_BIN, path.join(os.homedir(), '.studio/php-bin/8.4.25-studio-1/php'), path.join(os.homedir(), '.studio/php-bin/8.2.32-studio-1/php')].filter(Boolean);
const php = candidats.find(bin => { try { execFileSync(bin, ['-v'], {stdio:'ignore'}); return true; } catch { return false; } });
const opcions = {skip: !php && 'PHP CLI no disponible'};
const run = cas => JSON.parse(execFileSync(php, [path.join(root, 'tests/fixtures/enxufe-wp72-r32-27.php'), cas], {encoding:'utf8'}));

test('IDEA-306: manage_options no substituïx manage_secrets, límit 172 i memzero sense perdre el valor retornat', opcions, () => {
  const r = run('capacitats');
  assert.equal(r.nomes_manage_options, 'socdepoble_enxufe_secret_permis');
  assert.equal(r.manage_secrets, true);
  assert.deepEqual(r.capacitat, ['manage_secrets', 'manage_secrets']);
  assert.deepEqual(r.limits, [true, false, 'socdepoble_enxufe_secret_invalid']);
  assert.equal(r.set_crides, 2, 'nom invàlid i permís denegat mai no arriben al proveïdor');
  assert.equal(r.llegit, true, 'la neteja de locals no destrueix la còpia retornada ni el secret desat');
  assert.deepEqual(r.estat, {origen:'secrets_api', estat:'ok'});
  assert.equal(r.excepcio, 'socdepoble_enxufe_secret_error');
  assert.ok(r.memzero.includes('fixture-nova'.length), 'també neteja quan wp_set_secret llança');
  assert.ok(r.memzero.filter(n => n === 'fixture'.length).length >= 6, 'lectura, diagnòstic i desament netegen locals');
});
test('IDEA-306: absència real de les APIs (incloent WP 7.2 RC1) i absència independent de memzero', opcions, () => {
  assert.deepEqual(run('sense_api'), {codi:'socdepoble_enxufe_secret_no_disponible',capacitat:['manage_options'],sense_memzero:true,memzero:[],events:[]});
  const parcial = run('sense_memzero');
  assert.equal(parcial.manage_secrets, true);
  assert.equal(parcial.llegit, true);
  assert.deepEqual(parcial.memzero, []);
});
/* v1.2.18 · Gauntlet R1 (L4-04) · Un reveal() que no torna cadena és «error», i un memzero estil sodium
   (llança amb una no-cadena) no pot eixir del finally i tapar eixe return ni el de desa. */
test('v1.2.18 · Gauntlet R1 (L4-04): memzero només rep cadenes; un reveal() no-cadena continua sent error', opcions, () => {
  const r = run('memzero_sodium');
  assert.deepEqual(r.resol_no_cadena, {estat:'error', valor:''});
  assert.deepEqual(r.estat_no_cadena, {origen:'secrets_api', estat:'error'});
  assert.ok(Array.isArray(r.destins), `traduccio_destins (marcatge.php a cada pàgina amb l'App) no peta: ${JSON.stringify(r.destins)}`);
  assert.deepEqual(r.resol_cadena, {estat:'ok', valor:'fixture'}, 'una cadena es continua resolent');
  assert.deepEqual(r.desa, {enter:'socdepoble_enxufe_secret_invalid', nul:'socdepoble_enxufe_secret_invalid', llista:'socdepoble_enxufe_secret_invalid', sense_permis:'socdepoble_enxufe_secret_permis'});
  assert.equal(r.set_crides, 0, 'cap valor que no és una cadena arriba al proveïdor');
  assert.ok(!r.memzero.includes(-1), 'memzero mai no rep una no-cadena');
  assert.ok(r.memzero.filter(n => n === 'fixture'.length).length >= 2, 'les cadenes es continuen netejant (revelat i valor)');
});
test('IDEA-306: finalitza també en error de proveïdor, cache completa i pausa sense HTTP', opcions, () => {
  const r = run('retorns');
  assert.equal(r.sense_proveidor, 'sdp_traduccio_sense_clau');
  assert.equal(r.cache, true);
  assert.equal(r.pausa, 'sdp_traduccio_limit');
  assert.equal(r.secret_intacte, true);
  assert.ok(r.memzero.filter(n => n === 'fixture:fx'.length).length >= 6);
  assert.ok(!r.events.includes('http'));
});
for (const motor of ['deepl','lliure']) for (const mode of ['ok','error','throw']) {
  test(`IDEA-306: ${motor} neteja credencials i payload immediatament després HTTP (${mode})`, opcions, () => {
    const r = run(`${motor}:${mode}`);
    assert.equal(r.http_credencial, true, 'la credencial arribava sencera a HTTP');
    assert.equal(r.events[0], 'http');
    assert.ok(r.events.slice(1).every(e => e === 'zero'));
    assert.equal(r.memzero.length, motor === 'deepl' ? 2 : 3);
    assert.ok(r.memzero.every(n => n > 0));
    assert.deepEqual(r.resultat, mode === 'ok' ? {id:'Hola'} : mode === 'error' ? 'sdp_traduccio_proveidor' : 'excepcio');
  });
}
test('IDEA-306: Apertium continua sense credencial ni còpia de secret al cos HTTP', () => {
  const codi = fs.readFileSync(path.join(root, 'wordpress-plugin/includes/traduccio.php'), 'utf8');
  const a = codi.indexOf('function socdepoble_enxufe_traduccio_apertium(');
  const b = codi.indexOf('\n}\n', a);
  assert.doesNotMatch(codi.slice(a, b), /api_key|Authorization|\['clau'\]/);
});
