/** R29 · Paritat dels límits JSON de les mesures de patrimoni entre el port
 * neutral i les restriccions PostgreSQL reals. PGlite local explícit; les
 * fixtures d'Auth/Storage de Node 0 no acrediten serveis remots.
 *   SDP_PGLITE_MODULE=/ruta/existent/pglite/dist/index.js node --test tests/r29-esquemes-json-contractes.test.mjs
 * També admet file:///.../dist/index.js. Sense el mòdul indicat, només declara l'omissió: cap SQL validat. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { capturaEdicioRevisioPatrimoni } from '../src/data/revisionsPatrimoni.js';
import { creaPlaMigracions, generaSql } from '../tooling/node0/hidrata-postgres-node0.mjs';

const entrada = process.env.SDP_PGLITE_MODULE?.trim() || '';
let moduleURL = null;
if (entrada) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(entrada) && !entrada.startsWith('file:')) {
    throw new TypeError('SDP_PGLITE_MODULE només admet una ruta local o file URL.');
  }
  moduleURL = entrada.startsWith('file:') ? new URL(entrada) : pathToFileURL(path.resolve(entrada));
  if (moduleURL.search || moduleURL.hash) throw new TypeError('El mòdul local no admet query ni fragment.');
}
const modulePath = moduleURL ? fileURLToPath(moduleURL) : null;
const omissio = !entrada ? 'Falta SDP_PGLITE_MODULE; cap SQL executat.'
  : !fs.existsSync(modulePath) ? 'El mòdul indicat no existix; cap SQL executat.' : false;

const edicio = mesures => ({ entitatTipus: 'arbre', entitatSlug: 'arbre-de-prova',
  campanyaAny: 2026, versio: 0, estatConservacio: 'Bo', mesures, observacions: '' });
const entradaJSON = valor => JSON.stringify(valor);
const portAccepta = valor => {
  try { capturaEdicioRevisioPatrimoni(edicio(valor)); return true; }
  catch (error) { assert.equal(error.codi, 'revisio-patrimoni-invalida'); return false; }
};

test('R29 · paritat de tipus, límits Unicode i dominis de mesures JSON entre el port i PostgreSQL', {
  skip: omissio
}, async t => {
  assert.equal(fs.statSync(modulePath).isFile(), true, 'SDP_PGLITE_MODULE ha d’apuntar al fitxer d’entrada del mòdul.');
  const { PGlite } = await import(moduleURL.href);
  const { pgcrypto } = await import(new URL('./contrib/pgcrypto.js', moduleURL));
  assert.equal(typeof PGlite, 'function', 'El mòdul indicat no exporta PGlite.');
  const inicial = new PGlite();
  let imatge;
  try { await inicial.exec('CREATE DATABASE socdepoble_node0'); imatge = await inicial.dumpDataDir('none'); }
  finally { await inicial.close(); }
  const db = new PGlite({ database: 'socdepoble_node0', loadDataDir: imatge, extensions: { pgcrypto } });
  t.after(() => db.close());
  const pla = creaPlaMigracions();
  await db.exec(generaSql(pla, null, { advisoryLock: false }));
  t.diagnostic(`Catàleg real complet: ${pla.migrations.length} migracions; cap servei remot.`);

  const casos = [
    ['objecte buit', {}], ['null JSON', null], ['llista buida', []], ['nombre arrel', 1], ['text arrel', 'm'],
    ['valors primitius', { alcada: 13.25, absencia: null, revisat: false, text: '' }],
    ['enter segur màxim', { mesura: Number.MAX_SAFE_INTEGER }],
    ['enter segur mínim', { mesura: -Number.MAX_SAFE_INTEGER }],
    ['fora del límit numèric', { mesura: 2 ** 53 }],
    ['fora del límit numèric negatiu', { mesura: -(2 ** 53) }],
    ['objecte niat', { mesura: { valor: 3 } }], ['llista niada', { mesura: [3] }],
    ['clau reservada constructor', { constructor: 'text' }], ['clau reservada prototype', { prototype: 'text' }],
    ['clau amb salt final', { 'mesura\n': 'text' }], ['clau amb guió', { 'altura-m': 3 }],
    ['clau de 48 caràcters', { ['a'.repeat(48)]: 3 }], ['clau de 49 caràcters', { ['a'.repeat(49)]: 3 }],
    ['text BMP al límit', { mesura: 'x'.repeat(160) }], ['text BMP sobre el límit', { mesura: 'x'.repeat(161) }],
    ['text suplementari al límit', { mesura: '🌳'.repeat(160) }],
    ['text suplementari sobre el límit', { mesura: '🌳'.repeat(161) }],
    ['caràcter nul', { mesura: 'x\0y' }], ['surrogat aïllat', { mesura: '\uD800' }],
    ['32 camps al límit', Object.fromEntries(Array.from({ length: 32 }, (_, i) => [`m${i}`, '🌳'.repeat(160)]))],
    ['33 camps', Object.fromEntries(Array.from({ length: 33 }, (_, i) => [`m${i}`, i]))]
  ];
  for (const [nom, valor] of casos) await t.test(nom, async () => {
    const esperat = portAccepta(valor);
    let observat;
    try {
      observat = (await db.query('SELECT private.mesures_revisio_patrimoni_valides($1::jsonb) AS valid', [entradaJSON(valor)])).rows[0].valid;
    } catch (error) {
      assert.ok(['22P02', '22P05'].includes(error.code), `Codi SQL inesperat: ${error.code}`);
      observat = false;
    }
    assert.equal(observat, esperat, 'La mateixa dada JSON ha de tindre el mateix resultat al port i al servidor');
  });
});
