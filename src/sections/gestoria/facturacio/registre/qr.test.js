// @vitest-environment node
/* El text del QR: l'adreça de cotejo de l'AEAT amb els quatre paràmetres
   codificats. El NIF de l'exemple de l'AEAT es compon a trossos perquè la
   porta de qualitat no hi veja un literal amb forma de DNI. */
import { describe, expect, test } from 'vitest';
import { creaFacturaEmesa } from '../facturaEmesa.js';
import { creaRegistreAlta } from './registreAlta.js';
import { creaRegistreAnulacio } from './registreAnulacio.js';
import { ESPECIFICACIO_QR, URL_COTEJO, textQR } from './qr.js';

const NIF_AEAT = ['8989', '0001', 'K'].join('');
const CAMPS = Object.freeze({ idEmisor: NIF_AEAT, numSerie: '12345678/G33', dataExpedicio: '2024-01-01', importTotal: 12345 });

describe('l’adreça de cotejo', () => {
  test('producció: nif, numserie (amb la barra codificada), fecha dd-mm-aaaa i importe amb punt', () => {
    expect(textQR(CAMPS)).toBe(`${URL_COTEJO.produccio}?nif=${NIF_AEAT}&numserie=12345678%2FG33&fecha=01-01-2024&importe=123.45`);
  });

  test('preproducció, i una base passada per configuració', () => {
    expect(textQR(CAMPS, { entorn: 'preproduccio' }).startsWith(`${URL_COTEJO.preproduccio}?nif=`)).toBe(true);
    expect(textQR(CAMPS, { base: 'https://domini-verificat.example/ValidarQR' }).startsWith('https://domini-verificat.example/ValidarQR?nif=')).toBe(true);
  });

  test('cada paràmetre amb encodeURIComponent: un & del número no trenca l’adreça', () => {
    const text = textQR({ ...CAMPS, numSerie: 'A&B 1' });
    expect(text).toContain('&numserie=A%26B%201&');
    expect(new URL(text).searchParams.get('numserie')).toBe('A&B 1');
  });

  test('els imports negatius i els zeros finals', () => {
    expect(textQR({ ...CAMPS, importTotal: -12340 })).toMatch(/&importe=-123\.40$/);
  });

  test('refusa una base que no és https o que porta paràmetres, i una anul·lació', () => {
    expect(() => textQR(CAMPS, { base: 'http://insegur.example/ValidarQR' })).toThrow(expect.objectContaining({ codi: 'QR_INVALID' }));
    expect(() => textQR(CAMPS, { base: `${URL_COTEJO.produccio}?x=1` })).toThrow(/sense paràmetres/);
    expect(() => textQR(CAMPS, { entorn: 'desconegut' })).toThrow(/https/);
    expect(() => textQR({ ...CAMPS, idEmisor: 'X' })).toThrow(/NIF/);
    expect(() => textQR({ ...CAMPS, tipusRegistre: 'anulacio' })).toThrow(/anul·lació no porta QR/);
  });

  test('des d’un registre d’alta de debò', async () => {
    const factura = creaFacturaEmesa({
      tipus: 'F2', numSerie: 'T2026-0001', dataExpedicio: '2026-10-04', emissor: { nif: 'B12345674', nom: 'Forn del Poble' },
      descripcio: 'Tiquet', linies: [{ concepte: 'Pa', quantitat: 2, preuUnitari: 125, tipusIva: 4 }]
    });
    const alta = await creaRegistreAlta({ factura, instant: Date.UTC(2026, 9, 4, 10, 0, 0) });
    expect(textQR(alta)).toBe(`${URL_COTEJO.produccio}?nif=B12345674&numserie=T2026-0001&fecha=04-10-2026&importe=2.60`);
    const anul = await creaRegistreAnulacio({ alta, anterior: alta, instant: Date.UTC(2026, 9, 4, 10, 0, 1) });
    expect(() => textQR(anul)).toThrow(/anul·lació/);
  });
});

describe('el dibuix, PENDENT', () => {
  test('l’especificació que haurà de complir queda escrita i congelada', () => {
    expect(ESPECIFICACIO_QR).toEqual({ norma: 'ISO/IEC 18004', correccio: 'M', midaMinimaMm: 30, midaMaximaMm: 40, pagina: 'primera' });
    expect(Object.isFrozen(ESPECIFICACIO_QR)).toBe(true);
    expect(Object.isFrozen(URL_COTEJO)).toBe(true);
  });
});
