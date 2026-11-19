// P0-05 / P1-11 G-P11-01 / P1-68 / P2-10: l'«Estat declarat» de la taula canònica de supabase/README.md
// cita un rebut per fila. Font del veredicte: deriva R22 (bolcat de producció del 13-11-2026).
// Només llig l'arbre real; cap xarxa ni base de dades.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as V from '../scripts/supabase/verifica-migracions.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const README = fs.readFileSync(path.join(REPO, 'supabase/README.md'), 'utf8');
const taula = V.llegixReadme(README).taula;
const informe = V.verifica({ arrel: REPO, ara: new Date('2026-11-18T00:00:00Z') });
const declarat = new Map(informe.migracions.map((m) => [m.versio, m.estatDeclarat]));
const fila = (versio) => taula.find((f) => f.versio === versio);

// Rebuts d'una lectura de la base (no narratives del manifest com el «70/70»).
const RE_REBUT = /bolcat del 13-11-2026|T2 del 13-11-2026|13-11-2026 al T2|certificat 261117_0155|captura 2611\d{2}_\d{4}|lectura REST del 6-11/;
// NO aplicades que el bolcat del 13-11-2026 confirma o contradiu: cada una ho cita.
const NO_APLICADES_DEL_BOLCAT = [
  '2610061448', '2610061450', '2610081400', '2610081543', '2610101900', '2611110010',
  '2611070600', '2611080430', '2611080432', '2611082238',
];

// Veredictes congelats de la deriva R22 per a les files problemàtiques.
const MAI_APLICADES = [
  '2610061448', '2610061450', '2610081400', '2610081543', '2610101900', // NO aplicades
  '2610081401', '2610282100', '2609080000', '2609130500', '2609140100', '2609160600', // parcials
];
const JA_NO_DESCONEGUDES = ['2610201500', '2610220240', '2610241400', '2610290400', '2610312000'];
// Les úniques files que continuen «no acreditat»: sense empremta d'esquema (5), parcials (6), evidència REST
// contradictòria (2609121600), cap objecte coincident sinó només superats (5) o desconeguts (2), i la guarda
// de curadoria i la RPC de revisió de 2611091500, que no coincidixen amb cap versió de Git.
const DESCONEGUDES = [
  '2609211820', '2610042350', '2610090100', '2610211715', '2611121700',
  '2609080000', '2609130500', '2609140100', '2609160600', '2610081401', '2610282100',
  '2609121600',
  '2609110600', '2609200600', '2610021520', '2610241410', '2610311900',
  '2610160250', '2610181800',
  '2611091500',
];

test('la taula canònica es llig sencera i cada estat és reconegut', () => {
  // 124 des de P1-74 (A-03): 20261118230000, NO aplicada.
  assert.equal(taula.length, 124);
  assert.deepEqual(informe.errors, []);
  assert.deepEqual(informe.avisos.filter((a) => a.codi === 'A-ESTAT-NO-RECONEGUT'), []);
});

test('cap fila es recolza en el «70/70» ni en «declarat en esta llista»', () => {
  for (const f of taula) {
    assert.doesNotMatch(f.estat, /70\/70 verificat pel Mestre|declarat en esta llista/, `fila ${f.ordre} (${f.versio})`);
  }
});

test('tota fila «Aplicada» cita un rebut d’una lectura de la base', () => {
  for (const f of taula) {
    if (declarat.get(f.versio) !== 'declarada_aplicada') continue;
    assert.match(f.estat, RE_REBUT, `fila ${f.ordre} (${f.versio}) sense rebut`);
    // El bolcat només acredita una migració si hi ha algun objecte amb l'estat exacte que deixa.
    assert.doesNotMatch(f.estat, /^Aplicada a producció segons el bolcat del 13-11-2026 \(deriva R22: 0 coincidents/, `fila ${f.ordre}`);
  }
});

test('les «NO aplicada» que el bolcat del 13-11-2026 confirma o contradiu el citen', () => {
  for (const v of NO_APLICADES_DEL_BOLCAT) {
    assert.equal(declarat.get(v), 'declarada_no_aplicada', v);
    assert.match(fila(v).estat, /bolcat del 13-11-2026/, v);
  }
});

test('els veredictes de la deriva R22 es respecten', () => {
  for (const v of MAI_APLICADES) {
    assert.ok(fila(v), `${v} absent de la taula`);
    assert.notEqual(declarat.get(v), 'declarada_aplicada', `${v} no es pot declarar aplicada`);
  }
  for (const v of ['2610061448', '2610061450', '2610081400', '2610081543', '2610101900']) {
    assert.equal(declarat.get(v), 'declarada_no_aplicada', v);
  }
  for (const v of JA_NO_DESCONEGUDES) assert.equal(declarat.get(v), 'declarada_aplicada', v);
  // Les instruccions d'R22 es conserven.
  assert.match(fila('2610081543').estat, /MAI sencera, la substituïx `20261114000100`/);
  assert.match(fila('2610081400').estat, /sencera després de `20261114000100`/);
  assert.match(fila('2610061450').estat, /sencera després de `20261114000100`/);
  // Evidència contradictòria: es diu, però no es gira.
  for (const v of ['2611070600', '2611080430', '2611080432', '2611082238']) {
    assert.equal(declarat.get(v), 'declarada_no_aplicada', v);
    assert.match(fila(v).estat, /evidència contradictòria: el bolcat del 13-11-2026 hi troba \d+ objectes? coincidents?/, v);
  }
});

test('només les files sense rebut que les acredite continuen «no acreditat», i cada una diu per què', () => {
  const desconegudes = taula.filter((f) => declarat.get(f.versio) === 'desconegut').map((f) => f.versio);
  assert.deepEqual([...desconegudes].sort(), [...DESCONEGUDES].sort());
  for (const v of desconegudes) assert.match(fila(v).estat, /bolcat del 13-11-2026/, v);
});

test('2611091500 no es declara aplicada: les dues funcions que no coincidixen amb Git són de seguretat i s’hi nomenen', () => {
  const e = fila('2611091500').estat;
  assert.equal(declarat.get('2611091500'), 'desconegut');
  assert.match(e, /`private\.pot_curar_cultura\(\)`/);
  assert.match(e, /`revisa_aportacio_cultural\(uuid,text,text\)`/);
  assert.match(e, /no exigix aal2 \(2610061448 encara no aplicada\)/);
});

test('tota vinyeta d’una fila declarada aplicada que encara diu «NO aplicada» o «no acreditat» porta l’estat vigent', () => {
  assert.match(README, /L'estat vigent és el d'esta taula/);
  const linies = README.split('\n');
  for (const f of taula) {
    if (declarat.get(f.versio) !== 'declarada_aplicada') continue;
    const i = linies.findIndex((l) => l.startsWith(`- \`migrations/${f.versio}_`));
    if (i < 0) continue;
    let j = i + 1;
    while (j < linies.length && !/^(- |#)/.test(linies[j])) j += 1;
    const text = linies.slice(i, j).join(' ').replace(/\s+/g, ' ');
    if (!/NO aplicada|no acreditat/.test(text)) continue;
    assert.match(text, /Estat vigent: aplicada a producció segons el bolcat del 13-11-2026/, `vinyeta de ${f.versio}`);
  }
});
