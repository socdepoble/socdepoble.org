/* B1.3-c · D6 (marató 261101_2143) · Coherència de src/data/SELF-DESCRIBE.md amb
   les portes i amb el codi. Comprova:
   1. Porta Doctrina: cap camí citat absent ni cap nom nu exempt.
   2. Porta Frontmatter: cap deute F1-F9 i el ## Vincles resol.
   3. Tres afirmacions lligades al codi, en els dos sentits (si canvia el
      document o si canvia el codi, la prova cau): el mode de dades per defecte,
      que cap entrada crida injectaBackendDelPaquet i el nom de la cua de les Notes.
   No acredita la resta del document. Les portes s'executen en mode de només
   lectura: cap bandera que escriga (--baseline, --segella-esquema). */
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ARREL = process.env.SDP_SELF_ARREL || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOC = 'src/data/SELF-DESCRIBE.md';
const env = { ...process.env };
delete env.SDP_ARREL;

const llig = (rel) => fs.readFileSync(path.join(ARREL, rel), 'utf8');

function porta(script, args) {
  const r = spawnSync(process.execPath, [script, ...args, `--arrel=${ARREL}`], { cwd: ARREL, env, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  assert.equal(r.error, undefined, String(r.error));
  return r;
}

test('Porta Doctrina: SELF-DESCRIBE no cita cap camí absent ni cap nom nu exempt', () => {
  const r = porta('tooling/gates/tractor-doctrina.mjs', [`--abast=${DOC}`, '--json']);
  const j = JSON.parse(r.stdout);
  assert.deepEqual(j.absents, [], 'camins citats que no existixen');
  assert.deepEqual(j.externs, [], 'camins exempts o externs: cal citar-los sencers');
  assert.ok(j.resum.uniques >= 10, 'el document ha de sostindre cada afirmació amb un fitxer');
  assert.equal(r.status, 0);
});

test('Porta Frontmatter: SELF-DESCRIBE no té deute (F1-F9) i el ## Vincles resol', () => {
  const r = porta('tooling/wiki/tractor-frontmatter.mjs', ['--json']);
  const j = JSON.parse(r.stdout);
  const propis = Object.entries(j.fallades).flatMap(([llei, items]) => items.filter((it) => it.n === DOC).map((it) => `${llei} ${it.clau ?? ''} ${it.detall ?? ''}`.trim()));
  assert.deepEqual(propis, []);
});

test('El mode de dades per defecte del document és el de normalizeDataMode, també per a un mode desconegut', async () => {
  const doc = llig(DOC);
  const declarat = doc.match(/`(\w+)` \(el per defecte, i també el d'un mode desconegut\)/);
  assert.ok(declarat, 'el document ha de declarar el mode per defecte i el d\'un mode desconegut');
  const { normalizeDataMode } = await import(pathToFileURL(path.join(ARREL, 'src/data/supabase/runtime.js')).href);
  assert.equal(normalizeDataMode(undefined), declarat[1]);
  assert.equal(normalizeDataMode('mode-inventat'), declarat[1]);
});

test('Cap entrada crida injectaBackendDelPaquet, com diu el document', () => {
  const frase = llig(DOC).split('\n').find((l) => l.includes('`injectaBackendDelPaquet()`') && l.includes('no la crida cap entrada'));
  assert.ok(frase, 'el document ha de dir que cap entrada crida injectaBackendDelPaquet()');
  // Camins entre accents greus, sense quantificadors niats.
  const entrades = [...frase.matchAll(/`(src\/[^`]+)`/g)].map((m) => m[1]).filter((c) => /\.jsx?$/.test(c));
  assert.ok(entrades.length >= 2, 'la frase ha de nomenar les entrades');
  for (const entrada of entrades) {
    assert.equal(llig(entrada).includes('injectaBackendDelPaquet'), false, `${entrada} crida la costura interna`);
  }
});

test('La cua de les Notes que cita el document és la del seu gestor', () => {
  const nom = llig('src/sections/notes/GlobalSaveManager.js').match(/const DB_NAME = '([^']+)'/)?.[1];
  assert.ok(nom, 'GlobalSaveManager ha de declarar DB_NAME');
  assert.ok(llig(DOC).includes(`'${nom}'`), `el document ha de citar la cua '${nom}'`);
});
