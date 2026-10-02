// @vitest-environment node
/* Gestoria · nucli · nif. Els DNI, NIE i CIF de prova es generen ací mateix
   calculant-ne el control: cap identificador de persona escrit a mà. */
import { describe, expect, test } from 'vitest';
import { normalitzaNif, validaNif } from './nif.js';

const LLETRES = 'TRWAGMYFPDXBNJZSQVHLCKE';
const dni = (numero) => `${String(numero).padStart(8, '0')}${LLETRES[numero % 23]}`;
const nie = (prefix, numero) => `${prefix}${String(numero).padStart(7, '0')}${LLETRES[Number(`${'XYZ'.indexOf(prefix)}${String(numero).padStart(7, '0')}`) % 23]}`;
/* Control de CIF calculat a la manera de l'Agència Tributària, independent del mòdul. */
function controlCif(xifres) {
  const parells = Number(xifres[1]) + Number(xifres[3]) + Number(xifres[5]);
  const senars = [0, 2, 4, 6].map((i) => Number(xifres[i]) * 2).map((n) => (n > 9 ? n - 9 : n)).reduce((a, b) => a + b, 0);
  const c = (10 - ((parells + senars) % 10)) % 10;
  return { xifra: String(c), lletra: 'JABCDEFGHI'[c] };
}
const cif = (lletra, xifres, forma) => `${lletra}${xifres}${controlCif(xifres)[forma]}`;
const altraLletra = (l) => LLETRES[(LLETRES.indexOf(l) + 1) % 23];

describe('normalitzaNif', () => {
  test('majúscules, sense espais, punts ni guions', () => {
    expect(normalitzaNif('A-12345674')).toBe('A12345674');
    expect(normalitzaNif(' a-12.345 674 ')).toBe('A12345674');
    // Amb un espai no separable, fet des del punt de codi.
    expect(normalitzaNif(`b${String.fromCharCode(0xa0)}12345674`)).toBe('B12345674');
    expect(normalitzaNif('ie 3668997 oh')).toBe('IE3668997OH');
  });

  test('lleva el prefix ES d’un NIF-IVA espanyol', () => {
    expect(normalitzaNif('ESA12345674')).toBe('A12345674');
    expect(normalitzaNif('es-a-12345674')).toBe('A12345674');
    expect(normalitzaNif(`ES${dni(4242)}`)).toBe(dni(4242));
    expect(normalitzaNif(`ES ${nie('X', 77)}`)).toBe(nie('X', 77));
    expect(normalitzaNif('ESX12')).toBe('ESX12');
  });

  test('absent: cadena buida', () => {
    expect(normalitzaNif(null)).toBe('');
    expect(normalitzaNif(undefined)).toBe('');
    expect(normalitzaNif('')).toBe('');
  });
});

describe('validaNif: DNI', () => {
  test.each([0, 1, 22, 23, 4242, 10000000, 50505050, 99999999])('DNI generat amb el número %i', (numero) => {
    const valor = dni(numero);
    expect(validaNif(valor)).toEqual({ valid: true, tipus: 'DNI', normalitzat: valor });
  });

  test('lletra errònia: tipus DNI però no vàlid', () => {
    const bo = dni(31415926);
    const dolent = bo.slice(0, 8) + altraLletra(bo[8]);
    expect(validaNif(dolent)).toEqual({ valid: false, tipus: 'DNI', normalitzat: dolent });
  });

  test('amb format lliure i prefix ES', () => {
    const bo = dni(27182818);
    const lliure = `${bo.slice(0, 2)}.${bo.slice(2, 5)}.${bo.slice(5, 8)}-${bo[8].toLowerCase()}`;
    expect(validaNif(lliure)).toEqual({ valid: true, tipus: 'DNI', normalitzat: bo });
    expect(validaNif(`ES${bo}`)).toEqual({ valid: true, tipus: 'DNI', normalitzat: bo });
  });
});

describe('validaNif: NIE', () => {
  test.each([['X', 1], ['X', 1234567], ['Y', 7654321], ['Z', 42], ['Z', 9999999]])('NIE generat %s amb %i', (prefix, numero) => {
    const valor = nie(prefix, numero);
    expect(validaNif(valor)).toEqual({ valid: true, tipus: 'NIE', normalitzat: valor });
  });

  test('la lletra del prefix compta: el mateix número amb X i amb Y no comparteix control', () => {
    const ambX = nie('X', 1234567);
    const ambY = `Y${ambX.slice(1)}`;
    expect(validaNif(ambY).tipus).toBe('NIE');
    expect(validaNif(ambY).valid).toBe(false);
  });
});

describe('validaNif: CIF', () => {
  test('l’exemple clàssic, també amb guió', () => {
    expect(validaNif('A-12345674')).toEqual({ valid: true, tipus: 'CIF', normalitzat: 'A12345674' });
    expect(validaNif('A12345675').valid).toBe(false);
  });

  test('CIF públics d’empreses del catàleg', () => {
    for (const valor of ['F55091367', 'A80907397', 'B87194171', 'B57333601']) expect(validaNif(valor)).toEqual({ valid: true, tipus: 'CIF', normalitzat: valor });
  });

  const MOSTRES = ['1234567', '0000000', '7654321', '5091360', '9999999', '0101010', '3141592'];

  test.each(['P', 'Q', 'R', 'S', 'W', 'N'])('%s exigix lletra de control', (lletra) => {
    for (const xifres of MOSTRES) {
      expect(validaNif(cif(lletra, xifres, 'lletra'))).toMatchObject({ valid: true, tipus: 'CIF' });
      expect(validaNif(cif(lletra, xifres, 'xifra')).valid).toBe(false);
    }
  });

  test.each(['A', 'B', 'E', 'H'])('%s exigix xifra de control', (lletra) => {
    for (const xifres of MOSTRES) {
      expect(validaNif(cif(lletra, xifres, 'xifra'))).toMatchObject({ valid: true, tipus: 'CIF' });
      expect(validaNif(cif(lletra, xifres, 'lletra')).valid).toBe(false);
    }
  });

  test.each(['C', 'D', 'F', 'G', 'J', 'U', 'V'])('%s accepta xifra o lletra', (lletra) => {
    for (const xifres of MOSTRES) {
      expect(validaNif(cif(lletra, xifres, 'xifra')).valid).toBe(true);
      expect(validaNif(cif(lletra, xifres, 'lletra')).valid).toBe(true);
    }
  });

  test('control zero: xifra 0 o lletra J', () => {
    let xifres = '';
    for (let n = 0; n < 10000000 && !xifres; n += 1) {
      const candidat = String(n).padStart(7, '0');
      if (controlCif(candidat).xifra === '0') xifres = candidat;
    }
    expect(validaNif(`G${xifres}0`).valid).toBe(true);
    expect(validaNif(`G${xifres}J`).valid).toBe(true);
    expect(validaNif(`B${xifres}J`).valid).toBe(false);
    expect(validaNif(`Q${xifres}0`).valid).toBe(false);
  });

  test('qualsevol altre control és invàlid', () => {
    const bo = cif('B', '2468013', 'xifra');
    const dolent = bo.slice(0, 8) + String((Number(bo[8]) + 1) % 10);
    expect(validaNif(dolent)).toEqual({ valid: false, tipus: 'CIF', normalitzat: dolent });
  });

  test('lletres que no són de CIF no hi entren', () => {
    for (const lletra of ['I', 'K', 'L', 'M', 'O', 'T']) expect(validaNif(`${lletra}12345674`).tipus).toBe('desconegut');
  });
});

describe('validaNif: NIF-IVA de la UE', () => {
  test.each(['IE3668997OH', 'IE6364992H', 'DE123456789', 'FR12345678901', 'ATU12345678', 'EL123456789', 'XI123456789', 'PT123456789'])(
    '%s és vàlid de forma',
    (valor) => {
      expect(validaNif(valor)).toEqual({ valid: true, tipus: 'IVA-UE', normalitzat: valor });
    }
  );

  test('amb espais i minúscules', () => {
    expect(validaNif('at u 1234 5678')).toEqual({ valid: true, tipus: 'IVA-UE', normalitzat: 'ATU12345678' });
    const neerlandes = 'nl 123456789 b01';
    expect(validaNif(neerlandes)).toEqual({ valid: true, tipus: 'IVA-UE', normalitzat: neerlandes.toUpperCase().replace(/\s/g, '') });
  });

  test('un ES sense forma de NIF espanyol no és vàlid', () => {
    expect(validaNif('ESX12')).toEqual({ valid: false, tipus: 'IVA-UE', normalitzat: 'ESX12' });
    expect(validaNif('ESA12345675')).toEqual({ valid: false, tipus: 'CIF', normalitzat: 'A12345675' });
  });

  test('país de fora de la llista, cos massa curt o llarg, o sense cap xifra: desconegut', () => {
    for (const valor of ['GR123456789', 'GB123456789', 'US123456789', 'DE1', 'DE1234567890123', 'DESCONEGUT']) {
      expect(validaNif(valor)).toMatchObject({ valid: false, tipus: 'desconegut' });
    }
  });
});

describe('validaNif: entrades buides o estranyes', () => {
  test.each([null, undefined, '', '   ', '-', '12345', 'hola'])('«%s» és desconegut', (valor) => {
    expect(validaNif(valor)).toMatchObject({ valid: false, tipus: 'desconegut' });
  });
});
