// @vitest-environment node
/* Gestoria · motors financers · els sis defectes de l'auditoria adversarial
   de Codex (261013_1510, §1 i el guió de «Reproducció financera conservada»),
   girats en proves del resultat CORRECTE. Ordre del Mestre, 13-10-2026 (pla
   261013_1405, front I · motors): GES-A1…A6 es corregixen amb els criteris
   d'acceptació de Codex, i les seues reproduccions queden com a regressió.
   Cada prova diu al costat el que donava el motor abans (HEAD 99aab3f7).
   Tots els imports són cèntims. Dades sintètiques: entitat 9999 de prova,
   comptes i números de factura inventats; cap fitxer real. */
import { describe, expect, test } from 'vitest';
import { estimaIrpf130, resumHisenda } from '../../impostos/nucli/impostos.js';
import { llegeixC43 } from '../../nucli/c43.js';
import { concilia } from '../../nucli/concilia.js';
import { comptesDe, resumTauler } from './resumTauler.js';
import { reduixC43 } from './tractorTauler.js';

const d = (month, day) => ({ a: 2026, m: month, d: day });

/* Norma 43 sintètica vàlida, amb les posicions del parser (la mateixa construcció que el guió de Codex). */
const digits = (n, width) => String(n).padStart(width, '0');
const field = (s, width) => String(s).padEnd(width, ' ').slice(0, width);
function syntheticN43(branch, account, balance) {
  const bank = '9999';
  const header = `11${bank}${branch}${account}2601012601312${digits(balance, 14)}9783${field('TITULAR SINTETIC', 26)}${field('', 3)}`;
  const footer = `33${bank}${branch}${account}${digits(0, 5)}${digits(0, 14)}${digits(0, 5)}${digits(0, 14)}2${digits(balance, 14)}978${field('', 4)}`;
  const end = `88${'9'.repeat(18)}${digits(2, 6)}${field('', 54)}`;
  return `${header}\r\n${footer}\r\n${end}\r\n`;
}
/* Pel parser real i per la reducció de privacitat real del tractor del Tauler. */
const extracte = (branch, account, balance) => ({ lectura: reduixC43(llegeixC43(syntheticN43(branch, account, balance))) });

describe('GES-A1 · el mateix CSV és idempotent; dos càrrecs iguals de veres es conserven', () => {
  const csv = { lectura: { moviments: [
    { dataOperacio: d(1, 1), centims: -1000, saldo: 9000 },
    { dataOperacio: d(2, 1), centims: -1000, saldo: 8000 }
  ] } };
  const projecta = (r) => ({ accounts: r.caixa.comptes, outflow: r.finances.banc.eixides, movements: r.finances.banc.moviments });

  test('dues còpies del mateix fitxer donen el mateix que una', () => {
    const single = resumTauler({ comptes: comptesDe({ csv: [csv] }).comptes });
    const duplicated = resumTauler({ comptes: comptesDe({ csv: [csv, structuredClone(csv)] }).comptes });
    /* Abans: { accounts: 1, outflow: 2000, movements: 2 } amb una còpia i el doble de moviments amb dues, sense avís. */
    expect(projecta(duplicated)).toEqual(projecta(single));
    expect(projecta(single)).toEqual({ accounts: 1, outflow: 1000, movements: 1 });
    expect(comptesDe({ csv: [csv, structuredClone(csv)] }).avisos.map((a) => a.codi)).toEqual(['FITXERS_REPETITS']);
  });

  test('dos càrrecs reals iguals (mateix dia i import) dins del mateix fitxer es conserven tots dos', () => {
    const doble = { lectura: { moviments: [
      { dataOperacio: d(2, 1), centims: -1000, saldo: 9000 },
      { dataOperacio: d(2, 1), centims: -1000, saldo: 8000 }
    ] } };
    for (const csvs of [[doble], [doble, structuredClone(doble)]]) {
      const r = resumTauler({ comptes: comptesDe({ csv: csvs }).comptes });
      expect(projecta(r), String(csvs.length)).toEqual({ accounts: 1, outflow: 2000, movements: 2 });
    }
  });

  /* Revisió adversarial 13-10-2026, troballes FIN-1 i TI-3: «no deduplicar només per import/data» també entre
     fitxers. Dos CSV diferents (cada un amb una entrada pròpia) sense la columna del saldo porten el mateix càrrec
     de 25,00 € el mateix dia: poden ser dos comptes amb la mateixa quota. */
  test('dos CSV diferents sense saldo amb el mateix càrrec el mateix dia: compten tots dos, amb un avís', () => {
    const fila = (month, day, centims) => ({ dataOperacio: d(month, day), dataValor: d(month, day), centims, saldo: null });
    const compte = { lectura: { moviments: [fila(6, 1, 100000), fila(6, 10, -2500)] } };
    const targeta = { lectura: { moviments: [fila(6, 3, 50000), fila(6, 10, -2500)] } };
    for (const csvs of [[compte, targeta], [targeta, compte]]) {
      const { comptes, avisos } = comptesDe({ csv: csvs });
      /* Abans: { accounts: 1, outflow: 2500, movements: 3 } i cap avís; el segon càrrec es perdia en silenci. */
      expect(projecta(resumTauler({ comptes }))).toEqual({ accounts: 1, outflow: 5000, movements: 4 });
      expect(avisos.map((a) => a.codi)).toEqual(['CSV_POSSIBLES_REPETITS']);
    }
  });
});

describe('GES-A2 · dos comptes Norma 43 amb la mateixa entitat i el mateix sufix no es confonen', () => {
  test('oficines i números diferents, sufix 4321: dos comptes i la caixa sencera', () => {
    const merged = comptesDe({ extractes: [extracte('0001', '0000004321', 10000), extracte('0002', '0000014321', 20000)] });
    const summary = resumTauler({ comptes: merged.comptes });
    /* Abans: { accounts: 1, cash: 20000 }, i la caixa, completa. */
    expect({ accounts: merged.comptes.length, cash: summary.caixa.saldo }).toEqual({ accounts: 2, cash: 30000 });
    expect(summary.caixa.completa).toBe(true);
  });

  test('també amb la mateixa oficina: només canvien els dígits del mig', () => {
    const merged = comptesDe({ extractes: [extracte('0001', '0000004321', 10000), extracte('0001', '0000014321', 20000)] });
    expect(resumTauler({ comptes: merged.comptes }).caixa.saldo).toBe(30000);
    expect(merged.comptes.map((c) => c.compte4)).toEqual(['4321', '4321']);
  });

  test('el mateix compte en dos extractes continua sent un compte', () => {
    const merged = comptesDe({ extractes: [extracte('0001', '0000004321', 10000), extracte('0001', '0000004321', 10000)] });
    expect(merged.comptes).toHaveLength(1);
  });

  test('la reducció de privacitat no deixa eixir el número ni l’oficina; el sufix només és de presentació', () => {
    const lectura = extracte('0002', '0000014321', 20000);
    expect(JSON.stringify(lectura)).not.toMatch(/0000014321|TITULAR/);
    expect(Object.keys(lectura.lectura.comptes[0].capcalera)).not.toContain('oficina');
    expect(comptesDe({ extractes: [lectura] }).comptes[0]).toMatchObject({ id: 'c43-9999-4321', compte4: '4321' });
  });
});

describe('GES-A3 · un extracte acumulat que inclou un interval anterior no perd gener', () => {
  const statement = (start, end, movements) => ({ lectura: { comptes: [{
    capcalera: { entitat: '9999', compte4: '4321', divisa: 'EUR', dataInicial: start, dataFinal: end, saldoInicial: 100000 },
    moviments: movements.map(([month, day, cents]) => ({ dataOperacio: d(month, day), centims: cents })),
    peu: { saldoFinal: 94000 }
  }] } });
  const febrer = () => statement(d(2, 1), d(2, 28), [[2, 5, -1000]]);
  const acumulat = () => statement(d(1, 1), d(3, 31), [[1, 5, -2000], [2, 5, -1000], [3, 5, -3000]]);
  const moviments = (extractes) => comptesDe({ extractes }).comptes[0].moviments
    .map((m) => [m.dataOperacio.m, m.centims]).sort((a, b) => a[0] - b[0]);

  test('febrer i després l’acumulat de gener a març: els tres mesos hi són', () => {
    /* Abans: [[2, -1000], [3, -3000]]. */
    expect(moviments([febrer(), acumulat()])).toEqual([[1, -2000], [2, -1000], [3, -3000]]);
  });

  test('invariant a l’ordre i a afegir l’acumulat una altra vegada', () => {
    const esperat = [[1, -2000], [2, -1000], [3, -3000]];
    expect(moviments([acumulat(), febrer()])).toEqual(esperat);
    expect(moviments([febrer(), acumulat(), acumulat()])).toEqual(esperat);
    expect(moviments([acumulat()])).toEqual(esperat);
  });
});

describe('GES-A4 · factura i abonament íntegre són neutrals per a les retencions i el 130', () => {
  /* El model llegat representa les retencions com a magnitud positiva; la base diu l'abonament. */
  const invoice = (base, withholding = 0) => ({
    tipus: 'ingres', data: d(1, 5), subtotal: base, iva: 0,
    total: base - (base < 0 ? -withholding : withholding), retencio: withholding, estat: 'completa'
  });
  const run = (factures) => estimaIrpf130({ factures, any: 2026, t: 1 });
  const projecta = (r) => ({ income: r.rendiment, withheld: r.retencions, payment: r.resultat });

  test('afegir la parella no canvia ni la retenció neta ni el 130', () => {
    const neutral = run([invoice(10000)]);
    const reversed = run([invoice(10000, 1500), invoice(-10000, 1500), invoice(10000)]);
    /* Abans: { income: 10000, withheld: 3000, payment: 0 }. */
    expect(projecta(reversed)).toEqual(projecta(neutral));
    expect(projecta(reversed)).toEqual({ income: 10000, withheld: 0, payment: 2000 });
  });
});

describe('GES-A5 · el que surt a pagar no resta un 303 a compensar', () => {
  test('303 = −500,00 i 130 = 300,00: 300,00 a pagar i 500,00 de crèdit d’IVA, sense donar-lo per cobrat', () => {
    const r = resumHisenda({
      iva: { resultat: -50000, completa: true, falten: [] },
      irpf: { resultat: 30000, completa: true, falten: [] }
    });
    /* Abans: total −20000. */
    expect(r.total).toBe(30000);
    expect(r.ivaACompensar).toBe(50000);
  });
});

describe('GES-A6 · «desconegut» no és «diferència zero»', () => {
  const highConfidenceUnknown = (currency, total) => {
    const r = concilia({
      moviments: [{ dataOperacio: d(1, 5), centims: -1, ref1: 'INV-0001' }],
      factures: [{ id: 'synthetic-invoice', tipus: 'despesa', num: 'INV-0001', moneda: currency, total, data: d(1, 5) }]
    });
    return {
      altes: r.parelles.filter((p) => p.confianca === 'alta').length,
      altesSenseDiferencia: r.parelles.filter((p) => p.confianca === 'alta' && p.diferencia === null).length,
      pendents: r.facturesSensePagament.length,
      incidencies: r.incidencies.map((i) => i.codi)
    };
  };

  test.each([['USD', 10000], ['EUR', null]])('factura en %s amb total %s: cap parella alta, i una incidència per a revisar', (currency, total) => {
    /* Abans: R1 alta amb diferencia null, i la factura fora de les pendents sense cap avís. */
    expect(highConfidenceUnknown(currency, total)).toEqual({ altes: 0, altesSenseDiferencia: 0, pendents: 0, incidencies: ['IMPORT_DESCONEGUT'] });
  });

  test('una parella alta té sempre la diferència 0', () => {
    const r = concilia({
      moviments: [{ dataOperacio: d(1, 6), centims: -12100, ref1: 'INV-0002' }],
      factures: [{ id: 'synthetic-invoice-2', tipus: 'despesa', num: 'INV-0002', moneda: 'EUR', total: 12100, data: d(1, 5) }]
    });
    expect(r.parelles.map((p) => [p.regla, p.confianca, p.diferencia])).toEqual([['R1', 'alta', 0]]);
  });
});
