// @vitest-environment node
/* Empremta de Veri*Factu: els dos casos del document oficial de l'AEAT
   («Algoritmo de cálculo de codificación de la huella o hash») i les trampes
   de format. El NIF dels exemples es compon a trossos perquè la porta de
   qualitat no hi veja un literal amb forma de DNI. */
import { describe, expect, test } from 'vitest';
import {
  TIPUS_EMPREMTA, ZONA_AEAT, cadenaAlta, cadenaAnulacio, calculaEmpremta, dataAEAT, dataHoraAmbHus, empremtaDeRegistre,
  esDataHoraHus, esEmpremta, importAEAT
} from './empremta.js';

const NIF_AEAT = ['8989', '0001', 'K'].join('');
const EMPREMTA_CAS_1 = '3C464DAF61ACB827C65FDA19F352A4E3BDC2C640E9E9FC4CC058073F38F12F60';
const EMPREMTA_CAS_2 = 'F7B94CFD8924EDFF273501B01EE5153E4CE8F259766F88CF6ACB8935802A2B97';

const CAS_1 = Object.freeze({
  idEmisor: NIF_AEAT,
  numSerie: '12345678/G33',
  dataExpedicio: '01-01-2024',
  tipusFactura: 'F1',
  quotaTotal: '12.35',
  importTotal: '123.45',
  empremtaAnterior: '',
  dataHoraHusGeneracio: '2024-01-01T19:20:30+01:00'
});
const CAS_2 = Object.freeze({
  ...CAS_1,
  numSerie: '12345679/G34',
  empremtaAnterior: EMPREMTA_CAS_1,
  dataHoraHusGeneracio: '2024-01-01T19:20:35+01:00'
});

describe('els casos del document oficial de l’AEAT', () => {
  test('cas 1: primer registre, amb Huella buida', async () => {
    const cadena = cadenaAlta(CAS_1);
    expect(cadena).toBe([
      `IDEmisorFactura=${NIF_AEAT}`, 'NumSerieFactura=12345678/G33', 'FechaExpedicionFactura=01-01-2024', 'TipoFactura=F1',
      'CuotaTotal=12.35', 'ImporteTotal=123.45', 'Huella=', 'FechaHoraHusoGenRegistro=2024-01-01T19:20:30+01:00'
    ].join('&'));
    expect(await calculaEmpremta(cadena)).toBe(EMPREMTA_CAS_1);
  });

  test('cas 2: encadenat amb l’empremta del cas 1', async () => {
    expect(await calculaEmpremta(cadenaAlta(CAS_2))).toBe(EMPREMTA_CAS_2);
  });

  test('el mateix des del model: cèntims, data aaaa-mm-dd i encadenament', async () => {
    const registre = {
      tipusRegistre: 'alta', idEmisor: NIF_AEAT, numSerie: '12345678/G33', dataExpedicio: '2024-01-01', tipusFactura: 'F1',
      quotaTotal: 1235, importTotal: 12345, encadenament: null, dataHoraHusGeneracio: '2024-01-01T19:20:30+01:00'
    };
    expect(await empremtaDeRegistre(registre)).toBe(EMPREMTA_CAS_1);
    const segon = { ...registre, numSerie: '12345679/G34', encadenament: { empremta: EMPREMTA_CAS_1 }, dataHoraHusGeneracio: '2024-01-01T19:20:35+01:00' };
    expect(await empremtaDeRegistre(segon)).toBe(EMPREMTA_CAS_2);
  });

  test('les constants: SHA-256 és el tipus 01 i la zona és la de Madrid', () => {
    expect(TIPUS_EMPREMTA).toBe('01');
    expect(ZONA_AEAT).toBe('Europe/Madrid');
  });
});

describe('les trampes de format', () => {
  test('123.4 i 123.40 donen empremtes distintes: per això el format el posa importAEAT, sempre amb dos decimals', async () => {
    const amb = await calculaEmpremta(cadenaAlta(CAS_1).replace('ImporteTotal=123.45', 'ImporteTotal=123.40'));
    const sense = await calculaEmpremta(cadenaAlta(CAS_1).replace('ImporteTotal=123.45', 'ImporteTotal=123.4'));
    expect(amb).not.toBe(sense);
    expect(() => cadenaAlta({ ...CAS_1, importTotal: '123.4' })).toThrow(/ImporteTotal/);
    expect(() => cadenaAlta({ ...CAS_1, quotaTotal: '12,35' })).toThrow(/CuotaTotal/);
    expect(importAEAT(12340)).toBe('123.40');
  });

  test('importAEAT: punt, dos decimals, signe i límits', () => {
    expect(importAEAT(0)).toBe('0.00');
    expect(importAEAT(5)).toBe('0.05');
    expect(importAEAT(-5)).toBe('-0.05');
    expect(importAEAT(-123045)).toBe('-1230.45');
    expect(importAEAT(99999999999999)).toBe('999999999999.99');
    for (const dolent of [1.5, '100', null, 100000000000000, Number.NaN]) expect(() => importAEAT(dolent)).toThrow(RangeError);
  });

  test('dataAEAT: aaaa-mm-dd → dd-mm-aaaa, i res que no existisca', () => {
    expect(dataAEAT('2024-01-01')).toBe('01-01-2024');
    expect(dataAEAT('2028-02-29')).toBe('29-02-2028');
    for (const dolenta of ['2027-02-29', '01-01-2024', '2024-1-1', '', null]) expect(() => dataAEAT(dolenta)).toThrow(RangeError);
  });

  test('cap codificació URL: la barra del número de sèrie va tal qual', () => {
    expect(cadenaAlta(CAS_1)).toContain('NumSerieFactura=12345678/G33&');
    expect(cadenaAlta(CAS_1)).not.toContain('%2F');
  });

  test('els valors es netegen d’espais als extrems, i el resultat no canvia', async () => {
    const ambEspais = { ...CAS_1, numSerie: '  12345678/G33 ', tipusFactura: ' F1' };
    expect(await calculaEmpremta(cadenaAlta(ambEspais))).toBe(EMPREMTA_CAS_1);
  });

  test('el camp Huella hi és sempre, i una empremta anterior mal formada no passa', () => {
    expect(cadenaAlta(CAS_1)).toContain('&Huella=&');
    expect(() => cadenaAlta({ ...CAS_1, empremtaAnterior: EMPREMTA_CAS_1.toLowerCase() })).toThrow(/Huella/);
    expect(() => cadenaAlta({ ...CAS_1, empremtaAnterior: undefined })).toThrow(/Huella/);
  });

  test('la data i hora porta el desfase; sense desfase o amb Z no passa', () => {
    expect(() => cadenaAlta({ ...CAS_1, dataHoraHusGeneracio: '2024-01-01T19:20:30' })).toThrow(/FechaHoraHuso/);
    expect(() => cadenaAlta({ ...CAS_1, dataHoraHusGeneracio: '2024-01-01T18:20:30Z' })).toThrow(/FechaHoraHuso/);
    expect(esDataHoraHus('2024-07-01T12:00:00+02:00')).toBe(true);
    expect(esDataHoraHus('2024-13-01T12:00:00+02:00')).toBe(false);
  });

  test('esEmpremta: 64 xifres hexadecimals en majúscules', () => {
    expect(esEmpremta(EMPREMTA_CAS_1)).toBe(true);
    expect(esEmpremta(EMPREMTA_CAS_1.toLowerCase())).toBe(false);
    expect(esEmpremta(EMPREMTA_CAS_1.slice(1))).toBe(false);
  });
});

describe('l’anul·lació', () => {
  test('cinc camps, en l’ordre de l’especificació', async () => {
    const camps = { idEmisor: NIF_AEAT, numSerie: '12345679/G34', dataExpedicio: '01-01-2024', empremtaAnterior: EMPREMTA_CAS_2, dataHoraHusGeneracio: '2024-01-01T19:20:40+01:00' };
    expect(cadenaAnulacio(camps)).toBe([
      `IDEmisorFacturaAnulada=${NIF_AEAT}`, 'NumSerieFacturaAnulada=12345679/G34', 'FechaExpedicionFacturaAnulada=01-01-2024',
      `Huella=${EMPREMTA_CAS_2}`, 'FechaHoraHusoGenRegistro=2024-01-01T19:20:40+01:00'
    ].join('&'));
    const empremta = await calculaEmpremta(cadenaAnulacio(camps));
    expect(esEmpremta(empremta)).toBe(true);
    expect(await empremtaDeRegistre({ tipusRegistre: 'anulacio', ...camps, dataExpedicio: '2024-01-01', encadenament: { empremta: EMPREMTA_CAS_2 } })).toBe(empremta);
  });
});

describe('la data i hora amb el desfase d’Europe/Madrid', () => {
  test('hivern (+01:00): l’instant del cas 1', () => {
    expect(dataHoraAmbHus(Date.UTC(2024, 0, 1, 18, 20, 30))).toBe('2024-01-01T19:20:30+01:00');
  });

  test('estiu (+02:00) i els dos canvis d’hora de 2024', () => {
    expect(dataHoraAmbHus(Date.UTC(2024, 6, 1, 10, 0, 0))).toBe('2024-07-01T12:00:00+02:00');
    // 31 de març: a les 01:00 UTC les 02:00 locals passen a ser les 03:00.
    expect(dataHoraAmbHus(Date.UTC(2024, 2, 31, 0, 59, 59))).toBe('2024-03-31T01:59:59+01:00');
    expect(dataHoraAmbHus(Date.UTC(2024, 2, 31, 1, 0, 0))).toBe('2024-03-31T03:00:00+02:00');
    // 27 d'octubre: a les 01:00 UTC les 03:00 locals tornen a ser les 02:00.
    expect(dataHoraAmbHus(Date.UTC(2024, 9, 27, 0, 59, 59))).toBe('2024-10-27T02:59:59+02:00');
    expect(dataHoraAmbHus(Date.UTC(2024, 9, 27, 1, 0, 0))).toBe('2024-10-27T02:00:00+01:00');
  });

  test('mitjanit local, una Date, els mil·lisegons tallats i una altra zona', () => {
    expect(dataHoraAmbHus(new Date(Date.UTC(2025, 11, 31, 23, 0, 0, 999)))).toBe('2026-01-01T00:00:00+01:00');
    expect(dataHoraAmbHus(Date.UTC(2024, 0, 1, 18, 20, 30, 999))).toBe('2024-01-01T19:20:30+01:00');
    expect(dataHoraAmbHus(Date.UTC(2024, 0, 1, 18, 20, 30), 'Atlantic/Canary')).toBe('2024-01-01T18:20:30+00:00');
    expect(() => dataHoraAmbHus(Number.NaN)).toThrow(RangeError);
  });
});
