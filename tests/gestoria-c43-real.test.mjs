/* Gestoria · Norma 43 amb l'extracte real del 3T de 2026 (node:test).
   Només s'hi afirmen agregats (recomptes, quadres de control i l'equació del
   saldo) i les comprovacions d'imports van per assert.ok: si fallen, no
   imprimixen cap valor del fitxer. Si el fitxer no és en esta màquina (la
   CI, un altre ordinador), la prova se salta. També comprova que c43.js es
   carrega en Node pur: només APIs estàndard i importacions relatives. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { filtraTrimestre, llegeixC43, totsElsMoviments } from '../src/sections/gestoria/nucli/c43.js';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CARPETA = path.resolve(ARREL, '../_gestoria_de_poble/02_Facturacio/2026_3T');
const NUCLI = path.join(ARREL, 'src/sections/gestoria/nucli');

/* El primer .txt amb «c43» al nom, o null si la carpeta no hi és. */
function extracteReal() {
  if (!existsSync(CARPETA)) return null;
  const nom = readdirSync(CARPETA).filter((n) => /\.txt$/i.test(n) && /c43/i.test(n)).sort()[0];
  return nom ? path.join(CARPETA, nom) : null;
}
const RUTA = extracteReal();

/* Les importacions d'un mòdul i, recursivament, les dels mòduls relatius que carrega. */
function importacionsDe(fitxer, vistos = new Set()) {
  if (vistos.has(fitxer)) return [];
  vistos.add(fitxer);
  const codi = readFileSync(fitxer, 'utf8');
  const especificadors = [...codi.matchAll(/^import\s[^'"]*['"]([^'"]+)['"]/gm)].map((m) => m[1]);
  return especificadors.flatMap((e) => [e, ...(e.startsWith('./') ? importacionsDe(path.join(path.dirname(fitxer), e), vistos) : [])]);
}

test('c43.js es carrega en Node: només importacions relatives a .js del nucli, cap API de Node', () => {
  const importacions = importacionsDe(path.join(NUCLI, 'c43.js'));
  assert.ok(importacions.length > 0);
  for (const e of importacions) assert.match(e, /^\.\/[A-Za-z]+\.js$/);
  const sintetic = llegeixC43('');
  assert.deepEqual(sintetic.comptes, []);
});

test('l’extracte real del 3T: recomptes, quadres de control i equació del saldo', { skip: RUTA ? false : 'no hi ha l’extracte real en esta màquina' }, () => {
  const lectura = llegeixC43(new Uint8Array(readFileSync(RUTA)));
  assert.equal(lectura.codificacio, 'windows-1252');
  assert.equal(lectura.registres, 825);
  assert.deepEqual(lectura.recompte, { 11: 1, 22: 317, 23: 505, 24: 0, 33: 1, 88: 1 });
  assert.ok(lectura.fi && lectura.fi.registres === lectura.registres - 1, 'el registre de fi compta tots els altres');
  /* L'únic avís és la modalitat 4, fora de la 1-3 que documenta la norma. */
  assert.deepEqual(lectura.avisos.map((a) => a.codi), ['MODALITAT']);

  assert.equal(lectura.comptes.length, 1);
  const [compte] = lectura.comptes;
  assert.equal(compte.capcalera.modalitat, '4');
  assert.equal(compte.capcalera.compte4.length, 4);
  assert.ok(compte.peu, 'el compte té peu');
  const moviments = totsElsMoviments(lectura);
  assert.equal(moviments.length, 317);
  assert.ok(moviments.every((m) => m.dataOperacio && m.dataValor && Number.isSafeInteger(m.centims) && m.centims !== 0),
    'tots els moviments tenen dates i import');

  /* Els quadres de control, recalculats ací (a més dels de llegeixC43, que ja no han avisat). */
  const deure = moviments.filter((m) => m.centims < 0);
  const haver = moviments.filter((m) => m.centims > 0);
  const suma = (llista) => llista.reduce((s, m) => s + Math.abs(m.centims), 0);
  assert.ok(deure.length === compte.peu.apuntsDeure && haver.length === compte.peu.apuntsHaver, 'apunts del 33');
  assert.ok(suma(deure) === compte.peu.totalDeure && suma(haver) === compte.peu.totalHaver, 'totals del 33');
  assert.ok(compte.capcalera.saldoInicial + suma(haver) - suma(deure) === compte.peu.saldoFinal, 'equació del saldo');

  assert.equal(filtraTrimestre(moviments, 2026, 3).length, 147);
  /* Els 42 rebuts SEPA (2301 amb CORE o B2B) porten el NIF del creditor i el mandat. */
  const sepa = moviments.filter((m) => m.sepa);
  assert.equal(sepa.length, 42);
  assert.ok(sepa.every((m) => m.sepa.cif.length >= 8 && m.sepa.mandat !== '' && m.sepa.creditor !== ''), 'rebuts SEPA complets');

  /* El compte sencer (posicions 11-20 de l'11) no ix mai de la lectura. */
  const compteSencer = readFileSync(RUTA, 'latin1').slice(10, 20);
  assert.ok(/^\d{10}$/.test(compteSencer), 'la capçalera porta el compte on diu la norma');
  assert.ok(!JSON.stringify(lectura).includes(compteSencer), 'el compte sencer no ix de la lectura');
});
