// @vitest-environment node
/* Gauntlet 261025_0545 (RX-M1) · El complement d'un domicili (pis, porta,
   escala) es provava amb una expressió de retrocés EXPONENCIAL: el separador
   podia ser buit i \d{1,3} partia una tira de xifres de moltes maneres, de
   manera que una línia de 80 caràcters («CL MAJOR 5 1 1 1 … !») penjava la
   pestanya segons o minuts, al fil principal i sense que el senyal
   d'avortament ho poguera parar. Ara és lineal i decidix exactament el mateix
   que l'expressió d'abans. Els textos són sintètics. */
import { describe, expect, test } from 'vitest';
import { esComplement, extreuPropostes } from './extractorIdentitat.js';
import { plegaText } from './validadorsIdentitat.js';

/* L'expressió d'abans, només com a oracle de la prova (amb entrades curtes, on encara respon). */
const COMPLEMENT_DABANS = /^(?:(?:(?:esc|escalera|escala|bl|bloque|bloc|pis|piso|planta|pta|puerta|porta|portal|izq|izqda|izda|dcha|drcha|dch|esq|esquerra|dreta|bj|bajo|baix|baixos|atico|atic)(?![a-z])|\d{1,3}\s*[ºª]?|[a-z](?![a-z]))[\s.,ºª-]*)+$/;

const font = { ruta: '01_Identitat_Legal/vida_laboral_261025.pdf', sha256: 'ab'.repeat(32) };
const domicili = (linia) => Object.fromEntries(extreuPropostes({ tipus: 'vida-laboral', text: `INFORME DE VIDA LABORAL\n${linia}\n`, font })
  .filter((p) => p.camp.startsWith('domicili.')).map((p) => [p.camp, p.valor]));

/* Un generador determinista (LCG): la mateixa sèrie en cada execució. */
function generador(llavor) {
  let estat = llavor >>> 0;
  return (maxim) => {
    estat = (Math.imul(estat, 1664525) + 1013904223) >>> 0;
    return estat % maxim;
  };
}

/* Tots els textos fets d'entre 1 i `maxim` trossos, i `quantitat` d'aleatoris més llargs. */
function textos(trossos, maxim, quantitat, llargariaMaxima, llavor) {
  let nivell = [''];
  const tots = [];
  for (let n = 1; n <= maxim; n += 1) {
    nivell = nivell.flatMap((text) => trossos.map((tros) => text + tros));
    for (const text of nivell) tots.push(text);
  }
  const atzar = generador(llavor);
  for (let k = 0; k < quantitat; k += 1) {
    let text = '';
    for (let i = 1 + atzar(llargariaMaxima); i > 0; i -= 1) text += trossos[atzar(trossos.length)];
    tots.push(text);
  }
  return tots;
}

describe('RX-M1 · el complement del domicili es decidix en temps lineal', () => {
  test('una línia de 80 caràcters amb «1 » repetit i un final estrany: menys de 0,5 s (abans, de 6 a 19 s)', () => {
    const inici = performance.now();
    expect(domicili(`Domicilio: CL MAJOR 5 ${'1 '.repeat(28)}!`)).toEqual({ 'domicili.tipusVia': 'CL', 'domicili.via': 'MAJOR', 'domicili.numero': '5' });
    expect(domicili(`Domicilio: CL MAJOR 5 ${'1'.repeat(30)}!`)).toEqual({ 'domicili.tipusVia': 'CL', 'domicili.via': 'MAJOR', 'domicili.numero': '5' });
    expect(performance.now() - inici).toBeLessThan(500);
  });

  test('el predicat sol, amb tires de milers de xifres i blancs: menys de 0,5 s', () => {
    const inici = performance.now();
    expect(esComplement(`${'1'.repeat(5000)}!`)).toBe(false);
    expect(esComplement(`${'1 '.repeat(5000)}x!`)).toBe(false);
    expect(esComplement(`${'12º '.repeat(5000)}b`)).toBe(true);
    expect(performance.now() - inici).toBeLessThan(500);
  });

  test('decidix el mateix que l’expressió d’abans en tots els complements curts i en milers d’aleatoris', () => {
    const trossos = ['1', '23', ' ', 'º', 'ª', '.', ',', '-', 'a', 'b', 'esc', 'escalera', 'pis', 'izq', 'izqda', 'bajo', 'baixos', 'ab', 'x', '!', '/', '\t'];
    const valors = textos(trossos, 4, 30000, 9, 20261025);
    expect(valors.length).toBeGreaterThan(200000);
    expect(valors.filter((text) => esComplement(text) !== COMPLEMENT_DABANS.test(text))).toEqual([]);
  });

  test('els complements de les proves de sempre, plegats, decidixen igual', () => {
    const complements = ['2º B', 'ESC A 3º 1ª', 'PORTAL 2', '3º IZQDA', '1º DRCHA', '2ª ESQ', '4t ESQUERRA', 'PIS 1 DRETA', 'ÀTIC', 'BAIXOS',
      'LA TORRE DE LES MAÇANES', 'ALICANTE', 'PISA', 'PORTALET', 'BAIXADA', 'ESCOLA', '', ' 2º', '-2', 'Nº 3', 'BL. 2, ESC. 1, PTA 4'];
    for (const complement of complements) {
      const plegat = plegaText(complement);
      expect([complement, esComplement(plegat)]).toEqual([complement, COMPLEMENT_DABANS.test(plegat)]);
    }
    expect(domicili('Domicilio: CL MAJOR, 5 2º B')['domicili.complement']).toBe('2º B');
    expect(domicili('Domicilio: CL MAJOR, 5 ESCOLA')['domicili.complement']).toBeUndefined();
  });
});
