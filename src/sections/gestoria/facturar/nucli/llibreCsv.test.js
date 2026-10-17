// @vitest-environment node
/* El llibre registre de factures expedides en CSV (Gauntlet 261016, Onada 3,
   MCR o3_tpv_gestoria.2.1): el format que obri un full de càlcul sense
   preguntar (BOM, «;», coma decimal i CRLF), les columnes per tipus d'IVA, les
   cometes, la defensa contra la injecció de fórmules (les de nucli/csv.js:
   serialitzaCsv i protegeixFormula), l'ordre del llibre i un nom de fitxer
   sense dades personals. Cap dada real: els NIF es componen a trossos perquè
   la porta de qualitat no hi veja un literal amb forma de DNI. */
import { describe, expect, test } from 'vitest';
import { filesDelLlibre, resumDelLlibre } from './formulari.js';
import { AVIS_SENSE_XIFRAR_LLIBRE, TIPUS_CSV, importCsv, llibreCsv, nomDelLlibreCsv } from './llibreCsv.js';

const CIF_EMISSOR = 'B12345674';
const DNI_CLIENT = ['1234', '5678', 'Z'].join('');
const ALTRE_NIF = ['8765', '4321', 'X'].join('');
const ref = (numSerie, dataExpedicio) => ({ numSerie, dataExpedicio });
const S = (tipusIva, base, quota) => ({ qualificacio: 'S1', tipusIva, base, quota });
const alta = (numSerie, tipusFactura, data, { desglossament, client = { nif: DNI_CLIENT, nom: 'Bar de la Plaça' }, retencio = 0, ...factura }) => {
  const base = desglossament.reduce((suma, g) => suma + g.base, 0);
  const quota = desglossament.reduce((suma, g) => suma + g.quota, 0);
  return {
    tipusRegistre: 'alta', idEmisor: CIF_EMISSOR, numSerie, dataExpedicio: data, tipusFactura, quotaTotal: quota, importTotal: base + quota,
    factura: {
      destinatari: ['F2', 'R5'].includes(tipusFactura) ? null : client, desglossament, baseTotal: base, quotaTotal: quota,
      ...(retencio ? { retencio: { percentatge: 15, import: retencio } } : {}), liquid: base + quota - retencio, ...factura
    }
  };
};
const LLIBRE = [
  alta('A2026-0001', 'F1', '2026-07-02', { desglossament: [S(4, 50000, 2000), S(21, 123456, 25926)], retencio: 26018, dataOperacio: '2026-06-30' }),
  alta('T2026-0001', 'F2', '2026-07-03', { desglossament: [S(10, 300, 30)] }),
  alta('A2026-0002', 'F1', '2026-07-04', { desglossament: [{ qualificacio: null, exempcio: 'E1', base: 3000, quota: 0 }], client: { nif: ALTRE_NIF, nom: 'Bar "La Plaça"' } }),
  alta('A2026-0003', 'F1', '2026-07-05', { desglossament: [S(21, 1000, 210)], client: { nif: ALTRE_NIF, nom: '=HYPERLINK("exemple")' } }),
  { tipusRegistre: 'anulacio', idEmisor: CIF_EMISSOR, numSerie: 'A2026-0003', dataExpedicio: '2026-07-05' },
  alta('R2026-0001', 'R1', '2026-08-01', { desglossament: [S(4, -100, -4)], tipusRectificativa: 'I', rectificades: [ref('A2026-0001', '2026-07-02')] }),
  alta('A2026-0004', 'F3', '2026-08-02', { desglossament: [S(10, 300, 30)], client: { nif: DNI_CLIENT, nom: '-Joan' }, substituides: [ref('T2026-0001', '2026-07-03')] }),
  alta('A2026-0005', 'F1', '2026-08-03', { desglossament: [S(21, 100, 21)], client: { nif: DNI_CLIENT, nom: 'Forn; Pastisseria' } })
];
const linies = (csv) => csv.slice(1).split('\r\n');
const camps = (linia) => linia.split(';');

describe('el format', () => {
  test('la marca BOM, «;», CRLF al final de cada línia i una fila per factura, de la més antiga a la més nova', () => {
    const csv = llibreCsv(filesDelLlibre(LLIBRE));
    expect(csv.charCodeAt(0)).toBe(0xFEFF);
    expect(csv.endsWith('\r\n')).toBe(true);
    const totes = linies(csv);
    // La capçalera, les set altes i la línia buida darrere de l'últim CRLF.
    expect(totes).toHaveLength(9);
    expect(totes.at(-1)).toBe('');
    expect(totes.slice(1, -1).map((l) => camps(l)[0]))
      .toEqual(['A2026-0001', 'T2026-0001', 'A2026-0002', 'A2026-0003', 'R2026-0001', 'A2026-0004', 'A2026-0005']);
    // Ningú escriu un salt de línia solt: tots van amb el retorn de carro davant.
    expect(csv.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/);
    expect(TIPUS_CSV).toBe('text/csv;charset=utf-8');
  });

  test('la capçalera porta la base i l’IVA de cada tipus que hi ha (de menor a major) i la base de cada exempció', () => {
    const [capcalera] = linies(llibreCsv(filesDelLlibre(LLIBRE)));
    expect(camps(capcalera)).toEqual([
      'Número', 'Data d’expedició', 'Data de l’operació', 'Tipus (AEAT)', 'Tipus', 'Rectificativa', 'Factures que corregix o substituïx',
      'NIF del client', 'Client', 'Base al 4 %', 'IVA al 4 %', 'Base al 10 %', 'IVA al 10 %', 'Base al 21 %', 'IVA al 21 %',
      'Base exempta (E1)', 'Base imposable', 'IVA', 'Total', 'Retenció d’IRPF', 'Total a pagar', 'Estat',
      'Base que suma al període', 'IVA que suma al període', 'Total que suma al període', 'Base rectificada', 'IVA rectificat'
    ]);
    // Un període amb un sol tipus només porta les seues columnes.
    const [nomesUn] = linies(llibreCsv(filesDelLlibre([LLIBRE[1]])));
    expect(camps(nomesUn).filter((c) => /^(?:Base|IVA) al/.test(c))).toEqual(['Base al 10 %', 'IVA al 10 %']);
  });

  test('una completa amb dos tipus i retenció: els imports amb coma decimal i sense separador de milers', () => {
    const [, primera] = linies(llibreCsv(filesDelLlibre(LLIBRE)));
    expect(camps(primera)).toEqual([
      'A2026-0001', '02/07/2026', '30/06/2026', 'F1', 'Completa', '', '', DNI_CLIENT, 'Bar de la Plaça',
      '500,00', '20,00', '', '', '1234,56', '259,26', '', '1734,56', '279,26', '2013,82', '260,18', '1753,64', 'Emesa',
      // No en substituïx cap: suma el que porta; no és cap rectificativa per substitució.
      '1734,56', '279,26', '2013,82', '', ''
    ]);
  });

  test('el tiquet sense client, l’exempta, l’anul·lada marcada, la rectificativa amb signe i la F3 amb els tiquets que substituïx', () => {
    const [, , tiquet, exempta, anulada, rectificativa, f3] = linies(llibreCsv(filesDelLlibre(LLIBRE))).map(camps);
    expect(tiquet.slice(3, 9)).toEqual(['F2', 'Simplificada', '', '', '', '']);
    expect(tiquet.slice(11, 13)).toEqual(['3,00', '0,30']);
    expect(exempta[15]).toBe('30,00');
    expect(exempta.slice(16, 19)).toEqual(['30,00', '0,00', '30,00']);
    // L'estat és a la columna «Estat» (la 22a), abans de les del període; l'anul·lada no suma res.
    expect(anulada[21]).toBe('Anul·lada');
    expect(anulada.slice(-5)).toEqual(['0,00', '0,00', '0,00', '', '']);
    expect(rectificativa.slice(3, 7)).toEqual(['R1', 'Rectificativa', 'Per diferències', 'A2026-0001 (02/07/2026)']);
    // Els imports negatius són xifres: cap apòstrof davant del signe.
    expect(rectificativa.slice(9, 11)).toEqual(['-1,00', '-0,04']);
    expect(rectificativa.slice(16, 19)).toEqual(['-1,00', '-0,04', '-1,04']);
    expect(f3.slice(3, 7)).toEqual(['F3', 'En lloc de tiquets', '', 'T2026-0001 (03/07/2026)']);
  });

  test('les cometes, només on calen i doblades; un text que seria una fórmula porta un apòstrof davant', () => {
    const csv = llibreCsv(filesDelLlibre(LLIBRE));
    expect(csv).toContain(';"Bar ""La Plaça""";');
    expect(csv).toContain(';"\'=HYPERLINK(""exemple"")";');
    expect(csv).toContain(';\'-Joan;');
    // Un «;» dins d'un nom no parteix la fila: el camp va entre cometes.
    expect(csv).toContain(';"Forn; Pastisseria";');
  });

  test('els imports: cèntims enters, el signe davant i dos decimals sempre', () => {
    for (const [centims, text] of [[0, '0,00'], [5, '0,05'], [-104, '-1,04'], [123456, '1234,56'], [-5, '-0,05'], [100000000, '1000000,00']]) {
      expect([centims, importCsv(centims)]).toEqual([centims, text]);
    }
    for (const dolent of [1.5, null, undefined, '12', Number.NaN]) expect(importCsv(dolent)).toBe('');
  });
});

/* Revisió adversarial del Carril E (261016): la suma de les columnes del
   període del CSV és la del peu de la pantalla (resumDelLlibre), i la mateixa
   venda no es compta dues vegades. Les columnes noves són les cinc últimes:
   es lligen des del final perquè un «;» dins d'un nom entre cometes
   («Forn; Pastisseria») no les mou. */
const enCentims = (text) => {
  const [enters, decimals] = text.replace(/^-/, '').split(',');
  const valor = Number(enters) * 100 + Number(decimals);
  return text.startsWith('-') ? -valor : valor;
};
const sumaDeLaColumna = (csv, desDelFinal) => linies(csv).slice(1, -1)
  .reduce((suma, linia) => suma + enCentims(camps(linia).at(desDelFinal)), 0);

describe('el que suma al període', () => {
  test('la suma de «Base/IVA/Total que suma al període» és el total del peu de la pantalla, també d’un període', () => {
    const files = filesDelLlibre(LLIBRE);
    for (const filtre of [{}, { any: 2026, trimestre: 3 }, { any: 2026, trimestre: 3, estat: 'emeses' }]) {
      const { files: delPeriode, totals } = resumDelLlibre(files, filtre);
      const csv = llibreCsv(delPeriode);
      expect([sumaDeLaColumna(csv, -5), sumaDeLaColumna(csv, -4), sumaDeLaColumna(csv, -3)])
        .toEqual([totals.base, totals.quota, totals.total]);
    }
    // El total de 2026 (el peu de la pantalla): 1767,56 de base, sense la factura anul·lada ni el tiquet dues vegades.
    expect(resumDelLlibre(files).totals.base).toBe(176756);
  });

  test('el tiquet substituït i la F3 que el substituïx: la venda suma una vegada (la F3, la diferència)', () => {
    const [, , tiquet, , , , f3] = linies(llibreCsv(filesDelLlibre(LLIBRE))).map(camps);
    // Els imports de cada factura, tal com és, no canvien: totes dues porten 3,00 de base.
    expect([tiquet[16], f3[16]]).toEqual(['3,00', '3,00']);
    expect(tiquet.slice(-5)).toEqual(['3,00', '0,30', '3,30', '', '']);
    expect(f3.slice(-5)).toEqual(['0,00', '0,00', '0,00', '', '']);
  });

  test('la rectificativa per substitució porta l’import rectificat i suma la diferència; la de diferències, el que porta', () => {
    const LLIBRE_S = [
      alta('A2026-0001', 'F1', '2026-07-02', { desglossament: [S(21, 1000, 210)] }),
      alta('R2026-0001', 'R1', '2026-08-01', {
        desglossament: [S(21, 1200, 252)], tipusRectificativa: 'S', rectificades: [ref('A2026-0001', '2026-07-02')],
        importRectificat: { base: 1000, quota: 210 }
      })
    ];
    const files = filesDelLlibre(LLIBRE_S);
    const csv = llibreCsv(files);
    const [, original, rectificativa] = linies(csv).map(camps);
    expect(original.slice(-5)).toEqual(['10,00', '2,10', '12,10', '', '']);
    expect(rectificativa.slice(5, 7)).toEqual(['Per substitució', 'A2026-0001 (02/07/2026)']);
    // Un sol tipus (el 21 %): la base imposable, l'IVA i el total són les columnes 12a-14a.
    expect(rectificativa.slice(11, 14)).toEqual(['12,00', '2,52', '14,52']);
    expect(rectificativa.slice(-5)).toEqual(['2,00', '0,42', '2,42', '10,00', '2,10']);
    // Sumades, la factura que val: 14,52, el que diu el peu de la pantalla.
    expect(sumaDeLaColumna(csv, -3)).toBe(resumDelLlibre(files).totals.total);
    expect(sumaDeLaColumna(csv, -3)).toBe(1452);
    // La rectificativa per diferències de LLIBRE no porta import rectificat i suma el seu signe.
    const perDiferencies = linies(llibreCsv(filesDelLlibre(LLIBRE))).map(camps)[5];
    expect(perDiferencies.slice(-5)).toEqual(['-1,00', '-0,04', '-1,04', '', '']);
  });
});

describe('el període i la privacitat', () => {
  test('el CSV d’un període només porta les seues factures', () => {
    const files = filesDelLlibre(LLIBRE);
    const rectificatives = resumDelLlibre(files, { any: 2026, trimestre: 3, text: 'R2026' }).files;
    expect(linies(llibreCsv(rectificatives)).slice(1, -1).map((l) => camps(l)[0])).toEqual(['R2026-0001']);
    // Sense cap factura, només la capçalera.
    expect(linies(llibreCsv([]))).toHaveLength(2);
    expect(linies(llibreCsv(undefined))).toHaveLength(2);
  });

  test('el nom del fitxer només porta el període: cap NIF ni cap nom', () => {
    expect(nomDelLlibreCsv({ any: 2026, trimestre: 3 })).toBe('llibre-factures-emeses-2026-3t.csv');
    expect(nomDelLlibreCsv({ any: 2026 })).toBe('llibre-factures-emeses-2026.csv');
    expect(nomDelLlibreCsv({ any: 2026, trimestre: 5 })).toBe('llibre-factures-emeses-2026.csv');
    expect(nomDelLlibreCsv()).toBe('llibre-factures-emeses.csv');
    expect(nomDelLlibreCsv({ any: '2026; rm' })).toBe('llibre-factures-emeses.csv');
    for (const nom of [nomDelLlibreCsv({ any: 2026, trimestre: 1 }), nomDelLlibreCsv({ any: 2026 })]) {
      expect(nom).toMatch(/^[a-z0-9-]+\.csv$/);
      expect(nom).not.toContain(CIF_EMISSOR);
    }
  });

  test('l’avís diu que ix sense xifrar i que porta les dades dels clients', () => {
    expect(AVIS_SENSE_XIFRAR_LLIBRE).toMatch(/SENSE xifrar/);
    expect(AVIS_SENSE_XIFRAR_LLIBRE).toMatch(/els NIF dels teus clients/);
  });
});
