// @vitest-environment node
/* Onada 12 (261011; ordres 261011_0130, punt 6: «revisar els trimestres 2n,
   3r i 4t»). Els talls exactes dels trimestres i les hores a prop de la
   mitjanit: una factura és d'un dia del calendari, no d'un instant, i el dia
   que porta escrit no es mou per cap zona horària. dates.js és font dels
   tractors signats i no es toca: ací només es fixa el que ja fa. */
import { describe, expect, test } from 'vitest';
import { filtraTrimestre } from './c43.js';
import { dinsDeRang, formatData, parseData, rangTrimestre, serialExcel, trimestreDe } from './dates.js';
import { validaFactura, crearFactura } from './model.js';

const D = (a, m, d) => ({ a, m, d });
/* Cada trimestre: l'últim dia de l'anterior, el primer, l'últim i el primer del següent. */
const TALLS = [
  [2, D(2026, 3, 31), D(2026, 4, 1), D(2026, 6, 30), D(2026, 7, 1)],
  [3, D(2026, 6, 30), D(2026, 7, 1), D(2026, 9, 30), D(2026, 10, 1)],
  [4, D(2026, 9, 30), D(2026, 10, 1), D(2026, 12, 31), D(2027, 1, 1)]
];

describe('els talls del 2n, 3r i 4t trimestre', () => {
  test.each(TALLS)('%iT: el primer i l’últim dia hi entren; el d’abans i el de després, no', (t, abans, primer, ultim, despres) => {
    const rang = rangTrimestre(2026, t);
    expect(rang).toEqual({ inici: primer, fi: ultim });
    expect([abans, primer, ultim, despres].map((d) => dinsDeRang(d, rang))).toEqual([false, true, true, false]);
    expect([primer, ultim].map(trimestreDe)).toEqual([t, t]);
    expect(trimestreDe(abans)).not.toBe(t);
    expect(trimestreDe(despres)).not.toBe(t);
  });

  test.each(TALLS)('%iT: una factura de l’últim dia no és fora del trimestre; la de l’endemà, sí', (t, _abans, _primer, ultim, despres) => {
    const rang = rangTrimestre(2026, t);
    const factura = (data) => crearFactura({ data, num: 'P-0001', contrapart: 'Proveidor Sintetic SL', nif: ['A1234', '5674'].join(''), subtotal: 1000, iva: 210, total: 1210 });
    const codis = (data) => validaFactura(factura(data), { rang }).map((i) => i.codi);
    expect(codis(ultim)).toEqual([]);
    expect(codis(despres)).toEqual(['FORA_TRIMESTRE']);
  });

  test.each(TALLS)('%iT: els moviments del banc es tallen pels mateixos dies', (t, abans, primer, ultim, despres) => {
    const moviments = [abans, primer, ultim, despres].map((dataOperacio) => ({ dataOperacio }));
    expect(filtraTrimestre(moviments, 2026, t).map((m) => m.dataOperacio)).toEqual([primer, ultim]);
  });

  test('el 4t trimestre acaba el 31 de desembre i el següent és el 1r de l’any que ve', () => {
    expect(trimestreDe(D(2027, 1, 1))).toBe(1);
    expect(dinsDeRang(D(2027, 1, 1), rangTrimestre(2027, 1))).toBe(true);
    expect(dinsDeRang(D(2026, 12, 31), rangTrimestre(2027, 1))).toBe(false);
  });
});

describe('les hores a prop de la mitjanit no mouen el dia', () => {
  test('el dia escrit és el dia, digue el que digue la zona horària del text (i això és un LÍMIT per a les marques de temps)', () => {
    /* Les 23:30 de Madrid del 30 de juny i les 22:30 UTC: tots dos, 30 de juny. Això és el que fa parseData
       (dates.js, font signada, que no es toca): es queda amb el dia escrit i no converteix res. Val per a una
       factura o un extracte, que porten un dia del calendari. NO val per a una marca de temps: les 22:30 UTC del
       30 de juny són, a l'hora d'ací, l'1 de juliol, que és un altre trimestre. Esta prova no beneïx eixe cas:
       fixa el comportament perquè es veja. Una font que done instants en UTC (una connexió bancària) ha de
       convertir-los a la zona de la persona ABANS de passar-los pel port, que només admet dies { a, m, d }
       (fitxes/gestoria_port_bancari.md, «Marques de temps»). */
    expect(parseData('2026-06-30T23:30:00+02:00')).toEqual(D(2026, 6, 30));
    expect(parseData('2026-06-30T22:30:00Z')).toEqual(D(2026, 6, 30));
    expect(parseData('2026-07-01T00:15:00+02:00')).toEqual(D(2026, 7, 1));
    expect(parseData('30/09/2026 23:59')).toEqual(D(2026, 9, 30));
    expect(parseData('01/10/26 00:00')).toEqual(D(2026, 10, 1));
    expect(parseData('31/12/2026 23:59:59')).toEqual(D(2026, 12, 31));
  });

  test('dd/mm/aa és sempre el dia abans que el mes: l’1 d’octubre no és el 10 de gener', () => {
    expect(parseData('01/10/26')).toEqual(D(2026, 10, 1));
    expect(parseData('10/01/26')).toEqual(D(2026, 1, 10));
    expect(trimestreDe(parseData('01/10/26'))).toBe(4);
  });

  test('anar i tornar pel text i pel número de sèrie d’Excel no mou cap dia de tall', () => {
    for (const [, abans, primer, ultim, despres] of TALLS) {
      for (const dia of [abans, primer, ultim, despres]) {
        expect(parseData(formatData(dia, 'dd/mm/aa'))).toEqual(dia);
        expect(parseData(formatData(dia, 'aaaa-mm-dd'))).toEqual(dia);
      }
      expect(serialExcel(primer) - serialExcel(abans)).toBe(1);
      expect(serialExcel(despres) - serialExcel(ultim)).toBe(1);
    }
  });
});
