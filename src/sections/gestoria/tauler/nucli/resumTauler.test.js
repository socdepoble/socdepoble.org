// @vitest-environment node
/* Gestoria · Tauler · resumTauler: les xifres del Tauler a partir d'extractes
   sintètics de la Norma 43 i del CSV del banc, fets ací registre a registre.
   Cap dada és real: l'entitat 9999 és de prova, els comptes són inventats i
   el titular és «TITULAR SINTETIC». Imports en cèntims. */
import { describe, expect, test } from 'vitest';
import { llegeixC43 } from '../../nucli/c43.js';
import { crearFactura } from '../../nucli/model.js';
import { llegeixMovimentsCsv } from '../../nucli/movimentsBanc.js';
import {
  CODIS_TAULER, DIES_PER_MES, FINESTRA_DIES, MESOS_FLUX, MESOS_MITJANA, comptesDe, fluxMensual, restaMesos, resumTauler, sumaDies
} from './resumTauler.js';

/* ── Norma 43 sintètica (les posicions de c43.js) ─────────────────────── */
const xifres = (n, llargaria) => String(n).padStart(llargaria, '0');
const text = (valor, llargaria) => String(valor).padEnd(llargaria, ' ').slice(0, llargaria);
const COMPTE_A = { entitat: '9999', oficina: '0001', compte: '0000004321' };
const COMPTE_B = { entitat: '9999', oficina: '0002', compte: '0000008765' };
const r11 = (c, { inici, fi, dh = '2', saldo = 0, divisa = '978' }) =>
  `11${c.entitat}${c.oficina}${c.compte}${inici}${fi}${dh}${xifres(saldo, 14)}${divisa}3${text('TITULAR SINTETIC', 26)}${text('', 3)}`;
const r22 = ({ op, dh = '1', centims, comu = '99' }) =>
  `22${text('', 4)}0001${op}${op}${comu}000${dh}${xifres(centims, 14)}${xifres(0, 10)}${text('', 12)}${text('', 16)}`;
const r23 = (concepte) => `2301${text(concepte, 38)}${text('', 38)}`;
const r33 = (c, { nDeure, deure, nHaver, haver, dh = '2', saldo, divisa = '978' }) =>
  `33${c.entitat}${c.oficina}${c.compte}${xifres(nDeure, 5)}${xifres(deure, 14)}${xifres(nHaver, 5)}${xifres(haver, 14)}${dh}${xifres(saldo, 14)}${divisa}${text('', 4)}`;
const r88 = (n) => `88${'9'.repeat(18)}${xifres(n, 6)}${text('', 54)}`;
const fitxer = (linies) => `${[...linies, r88(linies.length)].join('\r\n')}\r\n`;
const llig = (linies) => ({ nom: 'extracte.n43', lectura: llegeixC43(fitxer(linies)) });

/* Compte A, del 01/04/26 al 30/06/26: 5.000,00 € d'inici, quatre càrrecs i un abonament; acaba amb 4.400,00 €. */
const TRIMESTRE_A = [
  r11(COMPTE_A, { inici: '260401', fi: '260630', saldo: 500000 }),
  r22({ op: '260410', centims: 60000 }),
  r22({ op: '260510', centims: 60000 }),
  r22({ op: '260605', dh: '2', centims: 150000 }),
  r22({ op: '260610', centims: 60000 }),
  r22({ op: '260620', centims: 30000 }),
  r23('FORN DE PROVA'),
  r33(COMPTE_A, { nDeure: 4, deure: 210000, nHaver: 1, haver: 150000, saldo: 440000 })
];
/* El mateix compte, del 15/06/26 al 15/07/26: repetix el càrrec del 20/06 i n'afig un del 05/07. */
const SOLAPAT_A = [
  r11(COMPTE_A, { inici: '260615', fi: '260715', saldo: 470000 }),
  r22({ op: '260620', centims: 30000 }),
  r22({ op: '260705', centims: 10000 }),
  r33(COMPTE_A, { nDeure: 2, deure: 40000, nHaver: 0, haver: 0, saldo: 430000 })
];
/* Compte B, en dòlars. */
const DOLARS_B = [
  r11(COMPTE_B, { inici: '260601', fi: '260630', saldo: 100000, divisa: '840' }),
  r33(COMPTE_B, { nDeure: 0, deure: 0, nHaver: 0, haver: 0, saldo: 100000, divisa: '840' })
];
/* Sense peu (33): el saldo es calcula. */
const SENSE_PEU_A = [
  r11(COMPTE_A, { inici: '260601', fi: '260630', saldo: 10000 }),
  r22({ op: '260602', dh: '2', centims: 2500 })
];

const CSV = [
  'Fecha,F. valor,Concepto,Importe,Saldo',
  '2026-06-25,2026-06-25,COMPRA,-12.34,4387.66',
  '2026-06-20,2026-06-20,"OP.TARJ.COMPRA COMERCIO',
  '999999******1234 FORN DE PROVA",-300.00,4400.00'
].join('\n');
const csv = () => ({ nom: 'moviments.csv', lectura: llegeixMovimentsCsv(CSV) });
const d = (a, m, dia) => ({ a, m, d: dia });
const congela = (x) => JSON.parse(JSON.stringify(x), (_clau, valor) => (valor && typeof valor === 'object' ? Object.freeze(valor) : valor));

describe('el calendari del Tauler', () => {
  test('sumaDies travessa mesos i anys', () => {
    expect(sumaDies(d(2026, 6, 30), -29)).toEqual(d(2026, 6, 1));
    expect(sumaDies(d(2026, 12, 31), 1)).toEqual(d(2027, 1, 1));
    expect(sumaDies(d(2026, 2, 30), 1)).toBeNull();
  });

  test('restaMesos retalla el dia al final del mes', () => {
    expect(restaMesos(d(2026, 8, 31), 6)).toEqual(d(2026, 2, 28));
    expect(restaMesos(d(2028, 8, 31), 6)).toEqual(d(2028, 2, 29));
    expect(restaMesos(d(2026, 3, 15), 6)).toEqual(d(2025, 9, 15));
  });
});

describe('comptesDe', () => {
  test('un compte per entitat i quatre últims dígits, amb el saldo del peu', () => {
    const { comptes, avisos } = comptesDe({ extractes: [llig(TRIMESTRE_A)] });
    expect(avisos).toEqual([]);
    expect(comptes).toHaveLength(1);
    expect(comptes[0]).toMatchObject({
      id: 'c43-9999-4321', entitat: '9999', compte4: '4321', divisa: 'EUR', desde: d(2026, 4, 1), fins: d(2026, 6, 30),
      saldo: 440000, saldoDe: 'peu', avisos: 0
    });
    expect(comptes[0].moviments).toHaveLength(5);
    expect(JSON.stringify(comptes)).not.toMatch(/0000004321|TITULAR/);
  });

  test('dos extractes que es solapen: els moviments no es repetixen i mana el saldo del més recent', () => {
    const { comptes, avisos } = comptesDe({ extractes: [llig(SOLAPAT_A), llig(TRIMESTRE_A)] });
    expect(avisos.map((a) => a.codi)).toEqual(['EXTRACTES_SOLAPATS']);
    expect(comptes).toHaveLength(1);
    expect(comptes[0]).toMatchObject({ saldo: 430000, desde: d(2026, 4, 1), fins: d(2026, 7, 15) });
    expect(comptes[0].moviments.map((m) => m.centims)).toEqual([-60000, -60000, 150000, -60000, -30000, -10000]);
  });

  test('sense peu, el saldo és l’inicial més els moviments', () => {
    const [compte] = comptesDe({ extractes: [llig(SENSE_PEU_A)] }).comptes;
    expect(compte).toMatchObject({ saldo: 12500, saldoDe: 'calculat' });
  });

  test('el CSV del banc aporta el comerç; una fila sense parella ho diu i no es compta', () => {
    const { comptes, avisos } = comptesDe({ extractes: [llig(TRIMESTRE_A)], csv: [csv()] });
    expect(comptes[0].moviments).toHaveLength(5);
    expect(comptes[0].moviments.find((m) => m.comerc)).toMatchObject({ centims: -30000, comerc: 'FORN DE PROVA' });
    expect(avisos.map((a) => a.codi)).toEqual(['CSV_SENSE_PARELLA']);
  });

  test('un CSV sense cap Norma 43 fa un compte sense número amb el saldo de la fila més nova', () => {
    const { comptes } = comptesDe({ csv: [csv()] });
    expect(comptes).toEqual([expect.objectContaining({
      id: 'csv', compte4: null, divisa: 'EUR', desde: d(2026, 6, 20), fins: d(2026, 6, 25), saldo: 438766, saldoDe: 'csv'
    })]);
  });

  test('sense res, cap compte; i no modifica el que rep', () => {
    expect(comptesDe()).toEqual({ comptes: [], avisos: [] });
    const extractes = congela([llig(TRIMESTRE_A)]);
    expect(() => comptesDe({ extractes, csv: congela([csv()]) })).not.toThrow();
  });
});

/* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front I · motors): les correccions de l'auditoria de Codex
   261013_1510 (GES-A1, A2 i A3). Cada prova afirma el resultat correcte i, al costat, el que feia abans. */
describe('comptesDe · la identitat dels comptes (GES-A2)', () => {
  /* Mateixa entitat, mateixa oficina i mateix sufix 4321; un altre compte (dígits del mig inventats). */
  const COMPTE_A2 = { ...COMPTE_A, compte: '0000014321' };
  const sol = (c, saldo) => [
    r11(c, { inici: '260601', fi: '260630', saldo }),
    r33(c, { nDeure: 0, deure: 0, nHaver: 0, haver: 0, saldo })
  ];

  test('dos comptes amb la mateixa entitat i el mateix sufix no es confonen: dos comptes i la caixa sencera', () => {
    const { comptes, avisos } = comptesDe({ extractes: [llig(sol(COMPTE_A, 100000)), llig(sol(COMPTE_A2, 200000))] });
    /* Abans: un compte i la caixa de 2.000,00 €, marcada completa. */
    expect(comptes.map((c) => [c.id, c.compte4, c.saldo])).toEqual(expect.arrayContaining([
      [expect.stringMatching(/^c43-9999-4321(-2)?$/), '4321', 100000], [expect.stringMatching(/^c43-9999-4321(-2)?$/), '4321', 200000]
    ]));
    expect(new Set(comptes.map((c) => c.id))).toEqual(new Set(['c43-9999-4321', 'c43-9999-4321-2']));
    expect(avisos).toEqual([]);
    expect(resumTauler({ comptes }).caixa).toMatchObject({ saldo: 300000, comptes: 2, completa: true });
    expect(JSON.stringify(comptes)).not.toMatch(/0000014321|0000004321|0001/);
  });

  test('l’ordre dels fitxers no canvia qui és qui', () => {
    const perId = (extractes) => Object.fromEntries(comptesDe({ extractes }).comptes.map((c) => [c.id, c.saldo]));
    const a = llig(sol(COMPTE_A, 100000));
    const b = llig(sol(COMPTE_A2, 200000));
    expect(perId([b, a])).toEqual(perId([a, b]));
  });

  test('una lectura feta a mà, sense id opac, torna a la clau d’abans (entitat i sufix)', () => {
    const tram = (saldo) => ({ lectura: { comptes: [{
      capcalera: { entitat: '9999', compte4: '4321', divisa: 'EUR', dataInicial: d(2026, 6, 1), dataFinal: d(2026, 6, 30), saldoInicial: saldo },
      moviments: [], peu: { saldoFinal: saldo }
    }] } });
    expect(comptesDe({ extractes: [tram(100000), tram(100000)] }).comptes.map((c) => c.id)).toEqual(['c43-9999-4321']);
  });
});

describe('comptesDe · extractes que se solapen (GES-A3)', () => {
  const FEBRER = [
    r11(COMPTE_A, { inici: '260201', fi: '260228', saldo: 100000 }),
    r22({ op: '260205', centims: 1000 }),
    r33(COMPTE_A, { nDeure: 1, deure: 1000, nHaver: 0, haver: 0, saldo: 99000 })
  ];
  /* L'acumulat de gener a març, que torna a portar el càrrec de febrer. */
  const GENER_MARC = [
    r11(COMPTE_A, { inici: '260101', fi: '260331', saldo: 102000 }),
    r22({ op: '260105', centims: 2000 }),
    r22({ op: '260205', centims: 1000 }),
    r22({ op: '260305', centims: 3000 }),
    r33(COMPTE_A, { nDeure: 3, deure: 6000, nHaver: 0, haver: 0, saldo: 96000 })
  ];
  const resum = (extractes) => {
    const { comptes, avisos } = comptesDe({ extractes });
    return {
      n: comptes.length, saldo: comptes[0].saldo, desde: comptes[0].desde, fins: comptes[0].fins, cobert: comptes[0].cobert,
      moviments: comptes[0].moviments.map((m) => [m.dataOperacio.m, m.centims]).sort((x, y) => x[0] - y[0]),
      avisos: avisos.map((a) => a.codi)
    };
  };

  test('un acumulat que inclou un extracte ja vist no perd res: gener hi és', () => {
    /* Abans, en este ordre, es perdia el càrrec de gener: [[2, -1000], [3, -3000]]. */
    expect(resum([llig(FEBRER), llig(GENER_MARC)])).toEqual({
      n: 1, saldo: 96000, desde: d(2026, 1, 1), fins: d(2026, 3, 31), cobert: [{ desde: d(2026, 1, 1), fins: d(2026, 3, 31) }],
      moviments: [[1, -2000], [2, -1000], [3, -3000]], avisos: ['EXTRACTES_SOLAPATS']
    });
  });

  test('el resultat no depén de l’ordre dels fitxers', () => {
    expect(resum([llig(GENER_MARC), llig(FEBRER)])).toEqual(resum([llig(FEBRER), llig(GENER_MARC)]));
  });

  test('dos càrrecs iguals de veres del mateix dia es conserven, encara que un altre extracte en porte un', () => {
    const doble = [
      r11(COMPTE_A, { inici: '260201', fi: '260228', saldo: 100000 }),
      r22({ op: '260205', centims: 1000 }),
      r22({ op: '260205', centims: 1000 }),
      r33(COMPTE_A, { nDeure: 2, deure: 2000, nHaver: 0, haver: 0, saldo: 98000 })
    ];
    for (const extractes of [[llig(FEBRER), llig(doble)], [llig(doble), llig(FEBRER)], [llig(doble)]]) {
      expect(resum(extractes).moviments).toEqual([[2, -1000], [2, -1000]]);
    }
  });

  test('un buit entre dos extractes del mateix compte queda a `cobert`', () => {
    const GENER = [r11(COMPTE_A, { inici: '260101', fi: '260131', saldo: 0 }), r33(COMPTE_A, { nDeure: 0, deure: 0, nHaver: 0, haver: 0, saldo: 0 })];
    const MARC = [r11(COMPTE_A, { inici: '260301', fi: '260331', saldo: 0 }), r33(COMPTE_A, { nDeure: 0, deure: 0, nHaver: 0, haver: 0, saldo: 0 })];
    expect(resum([llig(MARC), llig(GENER)]).cobert).toEqual([{ desde: d(2026, 1, 1), fins: d(2026, 1, 31) }, { desde: d(2026, 3, 1), fins: d(2026, 3, 31) }]);
    /* Dos extractes que es toquen (l'un acaba el dia abans que l'altre comence) fan un sol interval. */
    expect(resum([llig(GENER), llig(FEBRER)]).cobert).toEqual([{ desde: d(2026, 1, 1), fins: d(2026, 2, 28) }]);
  });
});

describe('comptesDe · el mateix fitxer dues vegades (GES-A1)', () => {
  const sense = ({ comptes }) => comptes;

  test('el mateix CSV dues vegades: el mateix compte que amb una, i un avís', () => {
    const una = comptesDe({ csv: [csv()] });
    const dues = comptesDe({ csv: [csv(), csv()] });
    /* Abans: el doble d'eixides i de moviments, sense cap avís. */
    expect(sense(dues)).toEqual(sense(una));
    expect(dues.avisos.map((a) => a.codi)).toEqual(['FITXERS_REPETITS']);
    expect(resumTauler({ comptes: dues.comptes }).finances.banc).toEqual(resumTauler({ comptes: una.comptes }).finances.banc);
  });

  test('dos càrrecs iguals de veres al MATEIX CSV compten dos; el fitxer repetit no en fa quatre', () => {
    const dia = d(2026, 6, 10);
    const lectura = { moviments: [
      { fila: 2, dataOperacio: dia, dataValor: dia, centims: -1000, saldo: null },
      { fila: 3, dataOperacio: dia, dataValor: dia, centims: -1000, saldo: null }
    ], avisos: [] };
    for (const n of [1, 2, 3]) {
      const { comptes } = comptesDe({ csv: Array.from({ length: n }, () => ({ lectura: structuredClone(lectura) })) });
      expect(comptes[0].moviments.map((m) => m.centims), String(n)).toEqual([-1000, -1000]);
    }
  });

  test('dos CSV que comparteixen dies: cada fila una vegada, en qualsevol ordre', () => {
    const fila = (n, dia, centims, saldo) => ({ fila: n, dataOperacio: dia, dataValor: dia, centims, saldo });
    const juny = { lectura: { moviments: [fila(2, d(2026, 6, 10), -1000, 9000), fila(3, d(2026, 6, 20), -500, 8500)], avisos: [] } };
    const juliol = { lectura: { moviments: [fila(2, d(2026, 6, 20), -500, 8500), fila(3, d(2026, 7, 5), 2000, 10500)], avisos: [] } };
    for (const csvs of [[juny, juliol], [juliol, juny]]) {
      const { comptes, avisos } = comptesDe({ csv: csvs });
      expect(comptes[0].moviments.map((m) => m.centims)).toEqual([-1000, -500, 2000]);
      expect(comptes[0]).toMatchObject({ saldo: 10500, desde: d(2026, 6, 10), fins: d(2026, 7, 5) });
      expect(avisos).toEqual([]);
    }
  });

  /* Revisió adversarial 13-10-2026, troballes FIN-1 i TI-3: sense saldo, dates i import no anclen la identitat
     d'una fila; dues files iguals de fitxers DIFERENTS poden ser dos càrrecs de veres (un compte i una targeta). */
  describe('CSV diferents sense la columna del saldo', () => {
    const fila = (n, dia, centims) => ({ fila: n, dataOperacio: dia, dataValor: dia, centims, saldo: null });
    const compte = () => ({ lectura: { moviments: [fila(2, d(2026, 6, 10), -2500)], avisos: [] } });
    const targeta = () => ({ lectura: { moviments: [fila(2, d(2026, 6, 10), -2500), fila(3, d(2026, 6, 12), -700)], avisos: [] } });

    test('cap fila es perd: les eixides són les dels dos fitxers, en qualsevol ordre, i un avís ho diu', () => {
      for (const csvs of [[compte(), targeta()], [targeta(), compte()]]) {
        const { comptes, avisos } = comptesDe({ csv: csvs });
        /* Abans: [-2500, -700] i 3.200 d'eixides, sense cap avís. */
        expect(comptes[0].moviments.map((m) => m.centims)).toEqual([-2500, -2500, -700]);
        expect(resumTauler({ comptes }).finances.banc).toEqual({ entrades: 0, eixides: 5700, net: -5700, moviments: 3 });
        expect(avisos.map((a) => a.codi)).toEqual(['CSV_POSSIBLES_REPETITS']);
        expect(avisos[0].missatge).toMatch(/^Una fila sense saldo/);
        for (const a of avisos) expect(CODIS_TAULER).toContain(a.codi);
      }
    });

    test('l’avís compta les files dubtoses: dos iguals en un fitxer i tres en l’altre en fan dues de dubtoses', () => {
      const dia = d(2026, 6, 10);
      const dos = { lectura: { moviments: [fila(2, dia, -1000), fila(3, dia, -1000)], avisos: [] } };
      const tres = { lectura: { moviments: [fila(2, dia, -1000), fila(3, dia, -1000), fila(4, dia, -1000)], avisos: [] } };
      const { comptes, avisos } = comptesDe({ csv: [dos, tres] });
      expect(comptes[0].moviments).toHaveLength(5);
      expect(avisos.map((a) => a.missatge)).toEqual([expect.stringMatching(/^2 files sense saldo/)]);
    });

    test('amb saldo s’unixen com sempre; una fila amb saldo i una sense compten totes dues, amb l’avís', () => {
      const ambSaldo = (saldo) => ({ lectura: { moviments: [{ ...fila(2, d(2026, 6, 10), -2500), saldo }], avisos: [] } });
      const unides = comptesDe({ csv: [ambSaldo(7500), { lectura: { moviments: [{ ...fila(2, d(2026, 6, 10), -2500), saldo: 7500 }, fila(3, d(2026, 6, 12), -700)], avisos: [] } }] });
      expect(unides.comptes[0].moviments.map((m) => m.centims)).toEqual([-2500, -700]);
      expect(unides.avisos).toEqual([]);
      /* Dues exportacions que no porten igual la columna del saldo: abans ja comptaven dues vegades, sense dir res. */
      const mixtes = comptesDe({ csv: [ambSaldo(7500), targeta()] });
      expect(mixtes.comptes[0].moviments.map((m) => m.centims)).toEqual([-2500, -2500, -700]);
      expect(mixtes.avisos.map((a) => a.codi)).toEqual(['CSV_POSSIBLES_REPETITS']);
      /* Dos càrrecs iguals amb saldos diferents són dos, sense cap dubte. */
      expect(comptesDe({ csv: [ambSaldo(7500), { lectura: { moviments: [{ ...fila(2, d(2026, 6, 10), -2500), saldo: 1000 }, fila(3, d(2026, 6, 12), -700)], avisos: [] } }] }).avisos).toEqual([]);
    });

    test('dos CSV sense saldo iguals fila a fila compten com un, i l’avís diu el dubte', () => {
      const { comptes, avisos } = comptesDe({ csv: [compte(), compte()] });
      expect(comptes[0].moviments.map((m) => m.centims)).toEqual([-2500]);
      expect(avisos.map((a) => a.codi)).toEqual(['FITXERS_REPETITS']);
      /* Abans: «El mateix CSV del banc s’ha triat més d’una vegada», com si no hi haguera cap dubte. */
      expect(avisos[0].missatge).toMatch(/sense la columna del saldo/);
      expect(comptesDe({ csv: [csv(), csv()] }).avisos[0].missatge).toBe('El mateix CSV del banc s’ha triat més d’una vegada: compta una sola vegada.');
    });

    test('amb Norma 43 les files del CSV no són diners: cap avís de repetits, i cap fila es perd per a aparellar', () => {
      const { avisos } = comptesDe({ extractes: [llig(TRIMESTRE_A)], csv: [compte(), targeta()] });
      expect(avisos.map((a) => a.codi)).not.toContain('CSV_POSSIBLES_REPETITS');
      expect(avisos.map((a) => a.codi)).toEqual(['CSV_SENSE_PARELLA']);
      expect(avisos[0].missatge).toMatch(/^3 files/);
    });
  });

  test('el mateix extracte dues vegades: el mateix compte, un avís, i el CSV del costat compta igual', () => {
    const una = comptesDe({ extractes: [llig(TRIMESTRE_A)], csv: [csv()] });
    const dues = comptesDe({ extractes: [llig(TRIMESTRE_A), llig(TRIMESTRE_A)], csv: [csv(), csv()] });
    expect(sense(dues)).toEqual(sense(una));
    expect(una.avisos.map((a) => a.codi)).toEqual(['CSV_SENSE_PARELLA']);
    expect(dues.avisos.map((a) => a.codi).sort()).toEqual(['CSV_SENSE_PARELLA', 'FITXERS_REPETITS', 'FITXERS_REPETITS']);
    expect(dues.avisos.find((a) => a.codi === 'CSV_SENSE_PARELLA').missatge).toBe(una.avisos[0].missatge);
    for (const a of dues.avisos) expect(CODIS_TAULER).toContain(a.codi);
  });
});

/* Per a la Cabina d'Avió (ordre del Mestre, 13-10-2026, pla 261013_1405, front E). */
describe('fluxMensual', () => {
  const quiet = (inici, fi) => [r11(COMPTE_A, { inici, fi, saldo: 0 }), r33(COMPTE_A, { nDeure: 0, deure: 0, nHaver: 0, haver: 0, saldo: 0 })];

  test('DIES_PER_MES és el mes mitjà gregorià, i MESOS_FLUX, 12', () => {
    expect(DIES_PER_MES).toBe(365.2425 / 12);
    expect(MESOS_FLUX).toBe(12);
  });

  test('dotze mesos fins al de `fins`, del més antic al més nou; sense extracte, «cap» i cap xifra (mai 0)', () => {
    const { comptes } = comptesDe({ extractes: [llig(TRIMESTRE_A)] });
    const mesos = fluxMensual({ comptes, fins: d(2026, 6, 30) });
    expect(mesos.map((m) => m.clau)).toEqual([
      '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'
    ]);
    for (const m of mesos.slice(0, 9)) {
      expect(m, m.clau).toMatchObject({ cobertura: 'cap', entrades: null, eixides: null, net: null, moviments: 0 });
    }
    expect(mesos.slice(9).map((m) => [m.clau, m.cobertura, m.entrades, m.eixides, m.net, m.moviments])).toEqual([
      ['2026-04', 'completa', 0, 60000, -60000, 1],
      ['2026-05', 'completa', 0, 60000, -60000, 1],
      ['2026-06', 'completa', 150000, 90000, 60000, 3]
    ]);
    expect(mesos[11]).toMatchObject({ any: 2026, mes: 6, inici: d(2026, 6, 1), fi: d(2026, 6, 30) });
  });

  test('el mes de `fins` és parcial si `fins` no és l’últim dia; el seu `fi` és `fins`', () => {
    const { comptes } = comptesDe({ extractes: [llig(TRIMESTRE_A), llig(SOLAPAT_A)] });
    const fins = resumTauler({ comptes }).fins;
    const [juny, juliol] = fluxMensual({ comptes, fins, mesos: 2 });
    expect(juny).toMatchObject({ clau: '2026-06', cobertura: 'completa', eixides: 90000 });
    /* Amb moviments, una entrada que no hi ha és 0 de veres (com a fluxDe): la finestra s'ha mesurat. */
    expect(juliol).toMatchObject({ clau: '2026-07', cobertura: 'parcial', fi: d(2026, 7, 15), entrades: 0, eixides: 10000, net: -10000, moviments: 1 });
  });

  test('un mes cobert sense cap moviment: «completa» però sense xifra', () => {
    const { comptes } = comptesDe({ extractes: [llig(quiet('260501', '260531'))] });
    expect(fluxMensual({ comptes, fins: d(2026, 5, 31), mesos: 1 })).toEqual([{
      clau: '2026-05', any: 2026, mes: 5, inici: d(2026, 5, 1), fi: d(2026, 5, 31), cobertura: 'completa',
      entrades: null, eixides: null, net: null, moviments: 0
    }]);
  });

  test('un buit entre extractes és «cap»; un compte que cobrix i un altre que no, «parcial»', () => {
    const { comptes } = comptesDe({ extractes: [llig(quiet('260101', '260131')), llig(quiet('260301', '260331'))] });
    expect(fluxMensual({ comptes, fins: d(2026, 3, 31), mesos: 3 }).map((m) => m.cobertura)).toEqual(['completa', 'cap', 'completa']);
    const dos = [
      { id: 'a', divisa: 'EUR', desde: d(2026, 1, 1), fins: d(2026, 3, 31), moviments: [] },
      { id: 'b', divisa: 'EUR', desde: d(2026, 3, 1), fins: d(2026, 3, 31), moviments: [] }
    ];
    expect(fluxMensual({ comptes: dos, fins: d(2026, 3, 31), mesos: 3 }).map((m) => m.cobertura)).toEqual(['parcial', 'parcial', 'completa']);
  });

  test('només euros; sense `fins` vàlid, sense euros o amb uns mesos que no valen: cap mes', () => {
    const { comptes } = comptesDe({ extractes: [llig(TRIMESTRE_A), llig(DOLARS_B)] });
    expect(fluxMensual({ comptes, fins: d(2026, 6, 30), mesos: 1 })[0]).toMatchObject({ entrades: 150000, eixides: 90000 });
    expect(fluxMensual({ comptes: comptes.filter((c) => c.divisa !== 'EUR'), fins: d(2026, 6, 30) })).toEqual([]);
    expect(fluxMensual({ comptes, fins: null })).toEqual([]);
    expect(fluxMensual({ comptes, fins: d(2026, 2, 30) })).toEqual([]);
    for (const mesos of [0, -1, 1.5, '12']) expect(fluxMensual({ comptes, fins: d(2026, 6, 30), mesos }), String(mesos)).toEqual([]);
    expect(fluxMensual()).toEqual([]);
  });

  test('travessa l’any i no modifica el que rep', () => {
    const comptes = congela(comptesDe({ extractes: [llig(TRIMESTRE_A)] }).comptes);
    const mesos = fluxMensual({ comptes, fins: d(2026, 2, 10), mesos: 3 });
    expect(mesos.map((m) => m.clau)).toEqual(['2025-12', '2026-01', '2026-02']);
    expect(mesos[2].fi).toEqual(d(2026, 2, 10));
  });
});

describe('resumTauler', () => {
  const comptes = comptesDe({ extractes: [llig(TRIMESTRE_A), llig(DOLARS_B)] }).comptes;

  test('la caixa real suma els saldos en euros; un compte en dòlars queda fora i ho diu', () => {
    const { caixa, fins } = resumTauler({ comptes });
    expect(fins).toEqual(d(2026, 6, 30));
    expect(caixa).toEqual({ saldo: 440000, completa: false, comptes: 1, exclosos: ['c43-9999-8765'], motiu: 'ALTRA_MONEDA' });
    expect(resumTauler({ comptes: comptes.slice(0, 1) }).caixa).toMatchObject({ saldo: 440000, completa: true, motiu: null });
  });

  test('les finances dels últims 30 dies fins a l’última data dels extractes, mai fins a avui', () => {
    const { finances } = resumTauler({ comptes, avui: d(2026, 10, 4) });
    expect(FINESTRA_DIES).toBe(30);
    expect(finances).toEqual({
      desde: d(2026, 6, 1), fins: d(2026, 6, 30),
      banc: { entrades: 150000, eixides: 90000, net: 60000, moviments: 3 },
      factures: null,
      motiu: null
    });
  });

  test('la cobertura: la caixa entre la despesa mensual mitjana dels mesos observats (com a molt sis)', () => {
    const { cobertura } = resumTauler({ comptes });
    expect(MESOS_MITJANA).toBe(6);
    const mesos = 91 / (365.2425 / 12);
    const despesaMensual = Math.round(210000 / mesos);
    expect(cobertura).toEqual({ mesos: 6.3, despesaMensual, mesosObservats: 3, motiu: null });
    expect(Math.round((440000 / despesaMensual) * 10) / 10).toBe(6.3);
  });

  test('la tresoreria de cada compte, amb el flux de la finestra', () => {
    const { tresoreria } = resumTauler({ comptes });
    expect(tresoreria.map((c) => [c.id, c.compte4, c.divisa, c.saldo])).toEqual([
      ['c43-9999-4321', '4321', 'EUR', 440000],
      ['c43-9999-8765', '8765', 'USD', 100000]
    ]);
    expect(tresoreria[0].finestra).toEqual({ entrades: 150000, eixides: 90000, net: 60000, moviments: 3 });
  });

  test('sense factures no hi ha res a conciliar, i es diu; amb factures, el recompte de concilia', () => {
    expect(resumTauler({ comptes }).conciliacio).toEqual({ ambFactures: false, moviments: 5, factures: 0 });
    const factura = crearFactura({
      tipus: 'despesa', data: '2026-06-18', num: 'FRA-77001', contrapart: 'Forn de Prova', subtotal: '247,93', iva: '52,07', total: '300,00'
    });
    const r = resumTauler({ comptes, factures: [factura] });
    expect(r.conciliacio).toEqual({
      ambFactures: true, moviments: 5, factures: 1, parelles: 1, movimentsSenseFactura: 4, facturesSensePagament: 0, incidencies: 0
    });
    /* Cap factura emesa en euros: les vendes no s'han mesurat (null, no 0); el rendiment sí, amb les compres. */
    expect(r.finances.factures).toEqual({ emeses: 0, rebudes: 1, vendes: null, compres: 24793, rendiment: -24793, completa: true });
  });

  test('sense cap extracte: cap xifra, amb el motiu (mai un zero)', () => {
    const r = resumTauler({ comptes: [] });
    expect(r.caixa).toMatchObject({ saldo: null, motiu: 'SENSE_DADES' });
    expect(r.cobertura).toEqual({ mesos: null, despesaMensual: null, mesosObservats: 0, motiu: 'SENSE_DADES' });
    expect(r.finances).toEqual({ desde: null, fins: null, banc: null, factures: null, motiu: 'SENSE_DADES' });
    expect(r.tresoreria).toEqual([]);
    expect(CODIS_TAULER).toContain(r.caixa.motiu);
  });

  /* Ordre del Mestre, 261004 (zeros falsos): sense res en euros, cap import és 0. */
  test('tots els comptes en una altra moneda: «sense mesura en euros», mai un zero', () => {
    const dolars = comptesDe({ extractes: [llig(DOLARS_B)] }).comptes;
    const r = resumTauler({ comptes: dolars });
    expect(r.finances.banc).toEqual({ entrades: null, eixides: null, net: null, moviments: 0 });
    expect(r.finances.motiu).toBe('ALTRA_MONEDA');
    expect(r.caixa).toMatchObject({ saldo: null, motiu: 'ALTRA_MONEDA' });
    expect(r.cobertura).toMatchObject({ mesos: null, despesaMensual: null, motiu: 'ALTRA_MONEDA' });
    expect(r.tresoreria[0].finestra).toEqual({ entrades: null, eixides: null, net: null, moviments: 0 });
    for (const motiu of [r.finances.motiu, r.caixa.motiu, r.cobertura.motiu]) expect(CODIS_TAULER).toContain(motiu);
  });

  test('un compte en euros sense cap moviment a la finestra: «sense mesura en euros», mai un zero', () => {
    const quiet = [
      r11(COMPTE_A, { inici: '260601', fi: '260630', saldo: 500000 }),
      r33(COMPTE_A, { nDeure: 0, deure: 0, nHaver: 0, haver: 0, saldo: 500000 })
    ];
    const r = resumTauler({ comptes: comptesDe({ extractes: [llig(quiet)] }).comptes });
    expect(r.caixa).toMatchObject({ saldo: 500000, motiu: null });
    expect(r.finances.banc).toEqual({ entrades: null, eixides: null, net: null, moviments: 0 });
    expect(r.finances.motiu).toBe('SENSE_MOVIMENTS');
    expect(r.cobertura.despesaMensual).toBeNull();
    expect(CODIS_TAULER).toContain(r.finances.motiu);
  });

  test('factures del període en una altra moneda o sense base: cap venda, compra ni rendiment de zero', () => {
    const enDolars = crearFactura({
      tipus: 'ingres', data: '2026-06-18', num: 'FRA-77002', contrapart: 'Client de Prova', subtotal: '100,00', iva: '21,00', total: '121,00'
    });
    const factures = [{ ...enDolars, moneda: 'USD' }, { ...enDolars, num: 'FRA-77003', tipus: 'despesa', subtotal: null }];
    const r = resumTauler({ comptes, factures });
    expect(r.finances.factures).toEqual({ emeses: 1, rebudes: 1, vendes: null, compres: null, rendiment: null, completa: false });
  });

  test('menys d’un mes de moviments: la cobertura no s’inventa', () => {
    const curt = comptesDe({ extractes: [llig(SENSE_PEU_A)] }).comptes;
    expect(resumTauler({ comptes: curt }).cobertura).toMatchObject({ mesos: null, motiu: 'POCS_DIES' });
  });

  test('no modifica el que rep', () => {
    const congelats = congela(comptes);
    expect(() => resumTauler({ comptes: congelats, factures: congela([]) })).not.toThrow();
  });
});
