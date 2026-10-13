// @vitest-environment node
/* Gestoria · nucli · c43: lectura de la Norma 43 amb fitxers sintètics fets
   ací, registre a registre: Latin-1 amb un byte 0xD3, modalitat 4, registre
   24, dos comptes, saldo inicial deutor, rebut SEPA i els avisos de tot el
   que no quadra. Cap dada és real: ni dates, ni imports, ni números, i la
   targeta porta el prefix de prova 999999. */
import { describe, expect, test } from 'vitest';
import {
  CODIS_AVIS_C43, LLARGARIA_REGISTRE, filtraTrimestre, llegeixC43, monedaDeCodi, textDelsConceptes, totsElsMoviments
} from './c43.js';

/* ── Registres sintètics, camp a camp ─────────────────────────────────── */

const xifres = (n, llargaria) => String(n).padStart(llargaria, '0');
const text = (valor, llargaria) => String(valor).padEnd(llargaria, ' ').slice(0, llargaria);
const COMPTE_A = { entitat: '9999', oficina: '0001', compte: '0000004321' };
const COMPTE_B = { entitat: '9999', oficina: '0002', compte: '0000008765' };

function r11(c, { inici = '990701', fi = '990930', dh = '2', saldo = 0, divisa = '978', modalitat = '3', nom = 'TITULAR SINTETIC' } = {}) {
  return `11${c.entitat}${c.oficina}${c.compte}${inici}${fi}${dh}${xifres(saldo, 14)}${divisa}${modalitat}${text(nom, 26)}${text('', 3)}`;
}
function r22({ op, valor = op, comu = '99', propi = '000', dh = '1', centims, document = 0, ref1 = '', ref2 = '' }) {
  return `22${text('', 4)}0001${op}${valor}${comu}${propi}${dh}${xifres(centims, 14)}${xifres(document, 10)}${text(ref1, 12)}${text(ref2, 16)}`;
}
const r23 = (codi, a, b = '') => `23${codi}${text(a, 38)}${text(b, 38)}`;
/* El 2302 d'un rebut SEPA no fa dos camps de 38: identificador de creditor (35) i mandat des de la posició 40. */
const r2302 = (idCreditor, mandat) => `2302${text(idCreditor, 35)}${text(mandat, 41)}`;
const r24 = (divisa, centims) => `2401${divisa}${xifres(centims, 14)}${text('', 59)}`;
function r33(c, { nDeure, deure, nHaver, haver, dh = '2', saldo, divisa = '978' }) {
  return `33${c.entitat}${c.oficina}${c.compte}${xifres(nDeure, 5)}${xifres(deure, 14)}${xifres(nHaver, 5)}${xifres(haver, 14)}${dh}${xifres(saldo, 14)}${divisa}${text('', 4)}`;
}
const r88 = (n) => `88${'9'.repeat(18)}${xifres(n, 6)}${text('', 54)}`;

/* El fitxer: les línies i el registre de fi amb el recompte bo (o el que es diga). */
const ambFi = (linies, n = linies.length) => [...linies, r88(n)];
const fitxer = (linies) => `${linies.join('\r\n')}\r\n`;
/* ISO-8859-1: un caràcter, un byte. */
const latin1 = (cadena) => Uint8Array.from(cadena, (c) => c.charCodeAt(0));
const codis = (lectura) => lectura.avisos.map((a) => a.codi);

/* Compte A: saldo inicial deutor (−103,91), modalitat 4, una compra amb
   targeta en dòlars (24), un ingrés amb accents en Latin-1 i un rebut SEPA.
   Compte B: creditor, una transferència. */
const COMPTE_A_LINIES = [
  r11(COMPTE_A, { dh: '1', saldo: 10391, modalitat: '4' }),
  r22({ op: '990702', valor: '990701', comu: '12', propi: '071', centims: 1361, ref1: 'OP.TARJ.COMP' }),
  r23('01', 'OP.TARJ.COMPRA COMERCIO', '999999      0000         9900000000001'),
  r24('840', 1471),
  r22({ op: '990715', comu: '02', propi: '001', dh: '2', centims: 61743 }),
  r23('01', 'INGRÉS DE PROVA ÓPTIM'),
  r22({ op: '990801', comu: '03', propi: '691', centims: 4319, ref1: 'MANDAT-0001' }),
  r23('01', 'CORESUBMINISTRAMENTS SINTETICS SL'),
  r2302('ES12000B76543214', 'MANDAT-0001'),
  r23('03', '        Factura SINT-2099-0042'),
  r33(COMPTE_A, { nDeure: 2, deure: 5680, nHaver: 1, haver: 61743, dh: '2', saldo: 45672 })
];
const COMPTE_B_LINIES = [
  r11(COMPTE_B, { saldo: 213457 }),
  r22({ op: '990910', comu: '04', propi: '018', centims: 1129 }),
  r23('01', 'TRANSFERENCIA SINTETICA'),
  r33(COMPTE_B, { nDeure: 1, deure: 1129, nHaver: 0, haver: 0, saldo: 212328 })
];
const BO = ambFi([...COMPTE_A_LINIES, ...COMPTE_B_LINIES]);

describe('els registres sintètics', () => {
  test('fan 80 caràcters, i el text porta el byte 0xD3 en Latin-1', () => {
    for (const linia of BO) expect(linia, linia).toHaveLength(LLARGARIA_REGISTRE);
    expect(latin1(fitxer(BO))).toContain(0xd3);
  });
});

describe('llegeixC43 · un fitxer bo', () => {
  const lectura = llegeixC43(latin1(fitxer(BO)));

  test('decodifica Latin-1 (no és UTF-8) i compta els registres per tipus', () => {
    expect(lectura.codificacio).toBe('windows-1252');
    expect(lectura.registres).toBe(16);
    expect(lectura.recompte).toEqual({ 11: 2, 22: 4, 23: 6, 24: 1, 33: 2, 88: 1 });
    expect(lectura.fi).toEqual({ registres: 15 });
  });

  test('l’únic avís és la modalitat 4, informatiu', () => {
    expect(lectura.avisos).toEqual([expect.objectContaining({ codi: 'MODALITAT', severitat: 'info', linia: 1 })]);
  });

  test('la capçalera: saldo deutor en negatiu, divisa i només els 4 últims dígits del compte', () => {
    const [a, b] = lectura.comptes;
    /* Ordre del Mestre, 13-10-2026 (auditoria de Codex 261013_1510, GES-A2): la capçalera porta també
       l'id opac del compte, fet de la clau sencera abans de reduir-la (16 consonants, cap xifra). */
    expect(a.capcalera).toEqual({
      entitat: '9999', oficina: '0001', compte4: '4321', idCompte: expect.stringMatching(/^[bcdfghjklmnpqrst]{16}$/),
      dataInicial: { a: 2099, m: 7, d: 1 }, dataFinal: { a: 2099, m: 9, d: 30 },
      saldoInicial: -10391, divisa: 'EUR', codiDivisa: '978', modalitat: '4', nom: 'TITULAR SINTETIC'
    });
    expect(b.capcalera).toMatchObject({ compte4: '8765', saldoInicial: 213457, modalitat: '3' });
    const json = JSON.stringify(lectura);
    expect(json).not.toContain(COMPTE_A.compte);
    expect(json).not.toContain(COMPTE_B.compte);
  });

  test('els moviments: dates, signe, referències, conceptes i la divisa del 24', () => {
    const [targeta, ingres, rebut] = lectura.comptes[0].moviments;
    expect(targeta).toMatchObject({
      linia: 2, oficina: '0001', dataOperacio: { a: 2099, m: 7, d: 2 }, dataValor: { a: 2099, m: 7, d: 1 },
      conceptComu: '12', conceptPropi: '071', centims: -1361, document: '0000000000', ref1: 'OP.TARJ.COMP', ref2: '',
      divisa: { codi: '840', moneda: 'USD', centims: -1471 }
    });
    expect(targeta.conceptes).toEqual([{ codi: '01', camps: ['OP.TARJ.COMPRA COMERCIO', '999999      0000         9900000000001'] }]);
    expect(targeta.sepa).toBeUndefined();
    expect(ingres).toMatchObject({ centims: 61743, conceptComu: '02' });
    expect(textDelsConceptes(ingres)).toBe('INGRÉS DE PROVA ÓPTIM');
    expect(rebut.centims).toBe(-4319);
    expect(rebut.divisa).toBeUndefined();
  });

  test('el rebut SEPA: esquema, creditor, identificador, NIF i mandat', () => {
    const rebut = lectura.comptes[0].moviments[2];
    expect(rebut.sepa).toEqual({
      esquema: 'CORE', creditor: 'SUBMINISTRAMENTS SINTETICS SL', idCreditor: 'ES12000B76543214', cif: 'B76543214', mandat: 'MANDAT-0001'
    });
    expect(textDelsConceptes(rebut)).toContain('Factura SINT-2099-0042');
  });

  test('SEPA: també amb el mandat on el posen els dos camps de 38; sense CORE o B2B al 2301 no és SEPA', () => {
    const rebut = (primer, segon) => llegeixC43(fitxer(ambFi([
      r11(COMPTE_B), r22({ op: '990705', comu: '03', centims: 113 }), primer, segon,
      r33(COMPTE_B, { nDeure: 1, deure: 113, nHaver: 0, haver: 0, dh: '1', saldo: 113 })
    ]))).comptes[0].moviments[0];
    expect(rebut(r23('01', 'B2BSINTETICA PROVEIDORA'), r23('02', 'ES12000B76543214', 'MANDAT-0002')).sepa)
      .toEqual({ esquema: 'B2B', creditor: 'SINTETICA PROVEIDORA', idCreditor: 'ES12000B76543214', cif: 'B76543214', mandat: 'MANDAT-0002' });
    expect(rebut(r23('01', 'TRANSFERENCIA REBUDA'), r2302('ES12000B76543214', 'REF')).sepa).toBeUndefined();
    expect(rebut(r23('01', 'CORESINTETICA'), r2302('NO ES CAP ID', 'REF')).sepa).toBeUndefined();
  });

  test('el peu de cada compte, amb els totals en positiu i el saldo final amb signe', () => {
    expect(lectura.comptes[0].peu).toEqual({
      apuntsDeure: 2, totalDeure: 5680, apuntsHaver: 1, totalHaver: 61743, saldoFinal: 45672, divisa: 'EUR', codiDivisa: '978'
    });
    expect(lectura.comptes[1].peu).toMatchObject({ apuntsDeure: 1, totalDeure: 1129, saldoFinal: 212328 });
  });

  test('el text ja decodificat, un ArrayBuffer i el fitxer sense salts donen el mateix', () => {
    const delText = llegeixC43(fitxer(BO));
    expect(delText.comptes).toEqual(lectura.comptes);
    expect(delText.codificacio).toBeNull();
    const bytes = latin1(fitxer(BO));
    expect(llegeixC43(bytes.buffer).comptes).toEqual(lectura.comptes);
    const seguit = llegeixC43(BO.join(''));
    expect(seguit.comptes).toEqual(lectura.comptes);
    expect(codis(seguit)).toEqual(['SENSE_SALTS', 'MODALITAT']);
  });

  test('un fitxer només ASCII es llig com a UTF-8', () => {
    const ascii = ambFi([r11(COMPTE_B), r33(COMPTE_B, { nDeure: 0, deure: 0, nHaver: 0, haver: 0, saldo: 0 })]);
    const r = llegeixC43(new TextEncoder().encode(fitxer(ascii)));
    expect(r.codificacio).toBe('utf-8');
    expect(r.avisos).toEqual([]);
  });
});

/* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front I · motors; auditoria de Codex 261013_1510, GES-A2). */
describe('llegeixC43 · l’id opac del compte', () => {
  const sol = (c) => ambFi([r11(c), r33(c, { nDeure: 0, deure: 0, nHaver: 0, haver: 0, saldo: 0 })]);
  const idDe = (c) => llegeixC43(fitxer(sol(c))).comptes[0].capcalera.idCompte;
  /* Comptes inventats: mateixa entitat i mateix sufix 4321; només canvien l'oficina o els dígits del mig. */
  const ALTRA_OFICINA = { ...COMPTE_A, oficina: '0002' };
  const ALTRES_DIGITS = { ...COMPTE_A, compte: '0000014321' };

  test('el mateix compte dona el mateix id, en dos fitxers i en dues lectures', () => {
    expect(idDe(COMPTE_A)).toBe(idDe(COMPTE_A));
    expect(llegeixC43(latin1(fitxer(BO))).comptes[0].capcalera.idCompte).toBe(idDe(COMPTE_A));
  });

  test('dos comptes amb la mateixa entitat i el mateix sufix tenen ids diferents', () => {
    const ids = [idDe(COMPTE_A), idDe(ALTRA_OFICINA), idDe(ALTRES_DIGITS), idDe(COMPTE_B)];
    expect(new Set(ids).size).toBe(4);
    expect(llegeixC43(fitxer(sol(ALTRA_OFICINA))).comptes[0].capcalera.compte4).toBe('4321');
  });

  test('no porta cap xifra ni el número: només 16 consonants', () => {
    for (const c of [COMPTE_A, ALTRA_OFICINA, ALTRES_DIGITS]) {
      const id = idDe(c);
      expect(id).toMatch(/^[bcdfghjklmnpqrst]{16}$/);
      for (const tros of [c.entitat, c.oficina, c.compte, c.compte.slice(-4)]) expect(id).not.toContain(tros);
    }
  });
});

describe('llegeixC43 · el que no quadra torna com a avís, mai com a excepció', () => {
  test('una línia curta: avís de llargària amb la línia, i la resta es llig', () => {
    const linies = [...BO];
    linies[2] = linies[2].slice(0, 79);
    const r = llegeixC43(fitxer(linies));
    expect(r.avisos.filter((a) => a.codi === 'LONGITUD')).toEqual([expect.objectContaining({ severitat: 'mitjana', linia: 3 })]);
    expect(r.comptes[0].moviments[0].conceptes[0].camps[1]).toBe('999999      0000         990000000000');
    expect(totsElsMoviments(r)).toHaveLength(4);
  });

  test('un peu que no quadra: apunts, sumes i saldo', () => {
    const peuDolent = r33(COMPTE_B, { nDeure: 2, deure: 1013, nHaver: 0, haver: 0, saldo: 212328 });
    const r = llegeixC43(fitxer(ambFi([...COMPTE_B_LINIES.slice(0, 3), peuDolent])));
    expect(codis(r)).toEqual(['RECOMPTE', 'SUMA']);
    expect(r.avisos.every((a) => a.linia === 4 && a.severitat === 'alta')).toBe(true);
    const saldoDolent = r33(COMPTE_B, { nDeure: 1, deure: 1129, nHaver: 0, haver: 0, saldo: 211328 });
    expect(codis(llegeixC43(fitxer(ambFi([...COMPTE_B_LINIES.slice(0, 3), saldoDolent]))))).toEqual(['SALDO']);
  });

  test('l’equació del saldo amb saldo inicial deutor que acaba deutor', () => {
    const linies = [
      r11(COMPTE_A, { dh: '1', saldo: 5137 }),
      r22({ op: '990705', centims: 2591 }),
      r22({ op: '990706', dh: '2', centims: 1129 }),
      r33(COMPTE_A, { nDeure: 1, deure: 2591, nHaver: 1, haver: 1129, dh: '1', saldo: 6599 })
    ];
    const r = llegeixC43(fitxer(ambFi(linies)));
    expect(r.avisos).toEqual([]);
    expect(r.comptes[0].peu.saldoFinal).toBe(-6599);
    const malament = [...linies.slice(0, 3), r33(COMPTE_A, { nDeure: 1, deure: 2591, nHaver: 1, haver: 1129, dh: '2', saldo: 6599 })];
    expect(codis(llegeixC43(fitxer(ambFi(malament))))).toEqual(['SALDO']);
  });

  test('el peu d’un altre compte o d’una altra divisa', () => {
    const r = llegeixC43(fitxer(ambFi([
      r11(COMPTE_A), r33(COMPTE_B, { nDeure: 0, deure: 0, nHaver: 0, haver: 0, saldo: 0, divisa: '840' })
    ])));
    expect(codis(r)).toEqual(['COMPTE_DIFERENT', 'DIVISA_DIFERENT']);
  });

  test('l’ordre: moviment sense capçalera, concepte després del peu, registres després del fi i conceptes desordenats', () => {
    const r = llegeixC43(fitxer([
      r22({ op: '990701', centims: 113 }),
      ...ambFi([
        r11(COMPTE_B),
        r22({ op: '990702', centims: 113 }),
        r23('02', 'SEGON'),
        r23('01', 'PRIMER'),
        r33(COMPTE_B, { nDeure: 1, deure: 113, nHaver: 0, haver: 0, dh: '1', saldo: 113 }),
        r23('01', 'ORFE')
      ], 7),
      r22({ op: '990703', centims: 113 })
    ]));
    expect(codis(r)).toEqual(['ORDRE', 'ORDRE', 'ORDRE', 'ORDRE', 'ORDRE']);
    expect(r.avisos.map((a) => a.linia)).toEqual([1, 5, 7, 9, 9]);
    expect(r.avisos.map((a) => a.severitat)).toEqual(['alta', 'baixa', 'alta', 'alta', 'alta']);
    expect(totsElsMoviments(r)).toHaveLength(1);
  });

  test('el recompte del fi, el fi absent i el peu absent', () => {
    expect(codis(llegeixC43(fitxer(ambFi(COMPTE_B_LINIES, 9))))).toEqual(['RECOMPTE_FI']);
    expect(codis(llegeixC43(fitxer(COMPTE_B_LINIES)))).toEqual(['SENSE_FI']);
    expect(codis(llegeixC43(fitxer(ambFi(COMPTE_B_LINIES.slice(0, 3)))))).toEqual(['SENSE_PEU']);
    const dosSensePeu = llegeixC43(fitxer([...COMPTE_B_LINIES.slice(0, 3), ...COMPTE_A_LINIES.slice(0, 2)]));
    expect(codis(dosSensePeu)).toEqual(['SENSE_PEU', 'MODALITAT', 'SENSE_PEU', 'SENSE_FI']);
    expect(dosSensePeu.comptes.map((c) => c.peu)).toEqual([null, null]);
  });

  test('camps que no es poden llegir: queden null, amb avís, i les sumes no es comparen', () => {
    const r = llegeixC43(fitxer(ambFi([
      r11(COMPTE_B),
      r22({ op: '991332', valor: '990701', centims: 113 }),
      `${r22({ op: '990702', centims: 113 }).slice(0, 27)}X${r22({ op: '990702', centims: 113 }).slice(28)}`,
      r23('07', 'CODI FORA DE LA NORMA'),
      r33(COMPTE_B, { nDeure: 1, deure: 0, nHaver: 0, haver: 0, saldo: 0 })
    ])));
    expect(codis(r)).toEqual(['CAMP_INVALID', 'CAMP_INVALID', 'CAMP_INVALID']);
    const [dataDolenta, signeDolent] = totsElsMoviments(r);
    expect(dataDolenta.dataOperacio).toBeNull();
    expect(dataDolenta.centims).toBe(-113);
    expect(signeDolent.centims).toBeNull();
  });

  test('línies buides, tipus desconeguts i el sostre d’avisos per codi', () => {
    const r = llegeixC43(fitxer(ambFi([r11(COMPTE_B), '', `99${text('', 78)}`, r33(COMPTE_B, { nDeure: 0, deure: 0, nHaver: 0, haver: 0, saldo: 0 })], 2)));
    expect(codis(r)).toEqual(['LINIA_BUIDA', 'TIPUS_DESCONEGUT']);
    expect(r.registres).toBe(4);
    const curtes = Array.from({ length: 25 }, (_, k) => r22({ op: '990701', centims: k + 1 }).slice(0, 70));
    const moltes = llegeixC43(fitxer(ambFi([r11(COMPTE_B), ...curtes], 26)));
    const llargaria = moltes.avisos.filter((a) => a.codi === 'LONGITUD');
    expect(llargaria).toHaveLength(21);
    expect(llargaria[20]).toEqual({ codi: 'LONGITUD', severitat: 'mitjana', missatge: 'I 5 avisos més del mateix tipus.' });
  });

  test('cap codi fora de la llista publicada; i l’entrada que no és ni text ni bytes és un error de codi', () => {
    for (const a of [...llegeixC43(fitxer(['', '99'])).avisos, ...llegeixC43('').avisos]) expect(CODIS_AVIS_C43).toContain(a.codi);
    expect(llegeixC43('')).toMatchObject({ comptes: [], fi: null, registres: 0 });
    expect(() => llegeixC43(null)).toThrow(TypeError);
    expect(() => llegeixC43(43)).toThrow(TypeError);
  });
});

describe('ajudants', () => {
  test('textDelsConceptes torna a ajuntar una paraula tallada entre els dos camps', () => {
    const tallat = { conceptes: [{ codi: '03', camps: [`${'X'.repeat(30)} QZ71000`, '58243 resta'] }] };
    expect(textDelsConceptes(tallat)).toBe(`${'X'.repeat(30)} QZ7100058243 resta`);
    expect(textDelsConceptes({ conceptes: [{ codi: '01', camps: ['A', 'B'] }, { codi: '02', camps: ['C', ''] }] })).toBe('A B C');
    expect(textDelsConceptes(null)).toBe('');
  });

  test('filtraTrimestre per data d’operació, i [] amb un trimestre impossible', () => {
    const moviments = [{ dataOperacio: { a: 2099, m: 6, d: 30 } }, { dataOperacio: { a: 2099, m: 7, d: 1 } }, { dataOperacio: { a: 2099, m: 9, d: 30 } },
      { dataOperacio: { a: 2099, m: 10, d: 1 } }, { dataOperacio: null }];
    expect(filtraTrimestre(moviments, 2099, 3)).toEqual([moviments[1], moviments[2]]);
    expect(filtraTrimestre(moviments, 2099, 5)).toEqual([]);
    expect(filtraTrimestre(null, 2099, 3)).toEqual([]);
  });

  test('monedaDeCodi i totsElsMoviments', () => {
    expect(monedaDeCodi('978')).toBe('EUR');
    expect(monedaDeCodi('840')).toBe('USD');
    expect(monedaDeCodi('000')).toBeNull();
    expect(totsElsMoviments(null)).toEqual([]);
  });
});
