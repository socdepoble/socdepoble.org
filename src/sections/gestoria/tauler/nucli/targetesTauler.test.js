// @vitest-environment node
/* Gestoria · Tauler · targetesTauler: el model de cada targeta del Tauler
   (regla d'or 1: títol, subtítol, entradeta, xifra o el perquè, etiquetes,
   detall i d'on ix). Dades sintètiques. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { llegeixC43 } from '../../nucli/c43.js';
import { crearFactura } from '../../nucli/model.js';
import {
  BLOCS_TAULER, dadesDelTauler, etiquetaXifra, hisendaSobreCaixa, nomsDelsComptes, rellotgeDelTermini, textAmagat, textXifra,
  trimestreOperatiu, trimestreVei
} from './targetesTauler.js';
import { estimaIva303, resumHisenda } from '../../impostos/nucli/impostos.js';
import { reduixC43 } from './tractorTauler.js';

const xifres = (n, llargaria) => String(n).padStart(llargaria, '0');
const text = (valor, llargaria) => String(valor).padEnd(llargaria, ' ').slice(0, llargaria);
const N43 = [
  `119999000100000043212606012606302${xifres(100000, 14)}9783${text('TITULAR SINTETIC', 26)}${text('', 3)}`,
  `22${text('', 4)}000126061026061099000${'1'}${xifres(2500, 14)}${xifres(0, 10)}${text('', 12)}${text('', 16)}`,
  `3399990001000000432100001${xifres(2500, 14)}00000${xifres(0, 14)}2${xifres(97500, 14)}978${text('', 4)}`,
  `88${'9'.repeat(18)}${xifres(3, 6)}${text('', 54)}`
].join('\r\n');
/* La lectura tal com la torna el tractor: la reduïda. */
const LECTURA = { extractes: [{ lectura: reduixC43(llegeixC43(N43)) }], csv: [], identitat: null, avisos: [] };
/* Un compte en dòlars (divisa 840), sense cap moviment: res en euros. */
const N43_DOLARS = [
  `119999000200000087652606012606302${xifres(100000, 14)}8403${text('TITULAR SINTETIC', 26)}${text('', 3)}`,
  `3399990002000000876500000${xifres(0, 14)}00000${xifres(0, 14)}2${xifres(100000, 14)}840${text('', 4)}`,
  `88${'9'.repeat(18)}${xifres(2, 6)}${text('', 54)}`
].join('\r\n');
const LECTURA_DOLARS = { extractes: [{ lectura: reduixC43(llegeixC43(N43_DOLARS)) }], csv: [], identitat: null, avisos: [] };
const AVUI = { a: 2026, m: 10, d: 4 };
const ids = (dades) => dades.targetes.map((t) => t.id);
/* Tots els imports que una targeta pot pintar: el del quadrat i els del detall. */
const imports = (t) => [t.xifra, ...t.detall.map((fila) => fila.xifra)].filter((x) => x?.tipus === 'import');

describe('dadesDelTauler', () => {
  test('sense lectura: totes les targetes del Tauler hi són, sense cap xifra i amb el perquè', () => {
    const dades = dadesDelTauler({ avui: AVUI });
    expect(ids(dades)).toEqual(['caixa', 'hisenda', 'cobertura', 'factures', 'ingressos', 'despeses', 'rendiment', 'conciliacio', 'iva-303', 'irpf-130']);
    for (const t of dades.targetes) {
      expect(t.xifra, t.id).toBeNull();
      expect(t.senseXifra, t.id).toMatch(/\S/);
      expect(t.titol && t.subtitol && t.entradeta && t.font, t.id).toBeTruthy();
      expect(Object.keys(BLOCS_TAULER)).toContain(t.bloc);
    }
    expect(dades.iva).toMatchObject({ any: 2026, t: 3, completa: false });
  });

  test('amb el trimestre del Full (periode), les estimacions són d’eixe trimestre i no del d’avui', () => {
    const factura = crearFactura({ tipus: 'ingres', data: '2026-07-15', num: 'A-0007', contrapart: 'Client de Prova', subtotal: '100,00', iva: '21,00', total: '121,00' });
    const dades = dadesDelTauler({ lectura: LECTURA, factures: [factura], avui: AVUI, periode: { any: 2026, t: 3 } });
    const per = Object.fromEntries(dades.targetes.map((t) => [t.id, t]));
    expect(dades.iva).toMatchObject({ any: 2026, t: 3, repercutit: 2100, factures: { emeses: 1, rebudes: 0 } });
    expect(per['iva-303'].subtitol).toBe('Estimació del 3T 2026');
    expect(per['iva-303'].etiquetes.map((e) => e.text)).toContain('Termini 20/10/2026');
    expect(per['irpf-130'].xifra).toEqual({ tipus: 'import', valor: 2000, moneda: 'EUR' });
    /* Un periode que no és un trimestre no mana: es torna al trimestre operatiu d'avui (3T 2026 el 04/10, 4T el 21/10). */
    expect(dadesDelTauler({ avui: AVUI, periode: { any: 2026, t: 7 } }).iva).toMatchObject({ any: 2026, t: 3 });
    expect(dadesDelTauler({ avui: { a: 2026, m: 10, d: 21 }, periode: { any: 2026, t: 7 } }).iva).toMatchObject({ any: 2026, t: 4 });
  });

  test('cap targeta diu que el Tauler no rep factures: sense, diu d’on vindran; amb, d’on ixen', () => {
    const sense = dadesDelTauler({ avui: AVUI });
    expect(JSON.stringify(sense.targetes)).not.toMatch(/pas 2 del MAPA|encara no rep/);
    expect(sense.targetes.find((t) => t.id === 'factures').senseXifra).toMatch(/Full trimestral/);
    const factura = crearFactura({ tipus: 'despesa', data: '2026-10-01', num: 'B-0001', contrapart: 'Proveïdor de Prova', subtotal: '10,00', iva: '2,10', total: '12,10' });
    const amb = dadesDelTauler({ lectura: LECTURA, factures: [factura], avui: AVUI });
    expect(amb.targetes.find((t) => t.id === 'iva-303').font).toMatch(/^Les factures que el Full trimestral ha passat al Tauler/);
  });

  test('amb un extracte: la caixa, el compte i el flux dels 30 dies; la cobertura diu que falta un mes', () => {
    const dades = dadesDelTauler({ lectura: LECTURA, avui: AVUI });
    const per = Object.fromEntries(dades.targetes.map((t) => [t.id, t]));
    expect(per.caixa.xifra).toEqual({ tipus: 'import', valor: 97500, moneda: 'EUR' });
    expect(per.caixa.entradeta).toMatch(/30\/06\/2026/);
    expect(per['compte-c43-9999-4321']).toMatchObject({ bloc: 'bancs', titol: 'Compte 1', subtitol: 'Saldo bancari · extracte del banc' });
    expect(per['compte-c43-9999-4321'].entradeta).toMatch(/^De l’entitat 9999, acabat en 4321\. El saldo/);
    expect(per.caixa.detall.map((fila) => fila.etiqueta)).toEqual(['Compte 1']);
    expect(per.despeses.xifra).toEqual({ tipus: 'import', valor: 2500, moneda: 'EUR' });
    expect(per.despeses.etiquetes.map((e) => e.text)).toEqual(['Banc']);
    expect(per.cobertura).toMatchObject({ xifra: null, senseXifra: 'Cal almenys un mes de moviments per a calcular-la.' });
    expect(per.conciliacio.xifra).toEqual({ tipus: 'recompte', valor: 1 });
    expect(per.hisenda.etiquetes.map((e) => e.text)).toEqual(['Impostos', 'Estimació incompleta', 'Termini 20/10/2026']);
    expect(JSON.stringify(dades.targetes)).not.toMatch(/0000004321|TITULAR SINTETIC/);
  });

  /* Ordre del Mestre, 261004 (privacitat): l'Índex escriu a la URL el títol de
     la secció triada, i el títol i el subtítol d'una targeta en són dos. */
  test('cap títol ni subtítol porta dades: els comptes es diuen «Compte 1, 2…»', () => {
    const dos = { extractes: [...LECTURA.extractes, ...LECTURA_DOLARS.extractes], csv: [], identitat: null, avisos: [] };
    const dades = dadesDelTauler({ lectura: dos, avui: AVUI });
    const comptes = dades.targetes.filter((t) => t.bloc === 'bancs' && t.id !== 'conciliacio');
    expect(comptes.map((t) => t.titol)).toEqual(['Compte 1', 'Compte 2']);
    expect(comptes.map((t) => t.entradeta.split('.')[0])).toEqual(['De l’entitat 9999, acabat en 4321', 'De l’entitat 9999, acabat en 8765']);
    for (const t of dades.targetes) {
      expect(`${t.titol} ${t.subtitol}`, t.id).not.toMatch(/4321|8765|9999|TITULAR/);
    }
    expect(nomsDelsComptes([{ id: 'csv' }])).toEqual(new Map([['csv', 'Moviments en CSV']]));
    expect(nomsDelsComptes(null)).toEqual(new Map());
  });

  /* Ordre del Mestre, 261004 (zeros falsos). */
  test('sense res en euros: «Sense mesura en euros», mai «0,00 €» ni al quadrat ni al detall', () => {
    const dades = dadesDelTauler({ lectura: LECTURA_DOLARS, avui: AVUI });
    const per = Object.fromEntries(dades.targetes.map((t) => [t.id, t]));
    for (const id of ['caixa', 'cobertura', 'ingressos', 'despeses', 'rendiment']) {
      expect(per[id].xifra, id).toBeNull();
      expect(per[id].senseXifra, id).toMatch(/^Sense mesura en euros: /);
    }
    for (const t of dades.targetes) {
      for (const xifra of imports(t)) expect(textXifra(xifra), t.id).not.toMatch(/^0,00/);
    }
    /* El compte en dòlars sí que té el seu saldo; de la finestra sense moviments, només el recompte. */
    expect(per['compte-c43-9999-8765'].detall.map((fila) => [fila.etiqueta, textXifra(fila.xifra)]))
      .toEqual([['Saldo', '1.000,00 USD'], ['Moviments (30 dies)', '0']]);
  });

  test('factures sense cap import en euros: el 303, el 130, Hisenda i les finances diuen «Sense mesura en euros»', () => {
    /* Una del trimestre operatiu (3T) i una de la finestra de les finances (juny), les dues en dòlars. */
    const enDolars = (data, num) => ({
      ...crearFactura({ tipus: 'ingres', data, num, contrapart: 'Client de Prova', subtotal: '100,00', iva: '21,00', total: '121,00' }),
      moneda: 'USD'
    });
    const dades = dadesDelTauler({ lectura: LECTURA, factures: [enDolars('2026-08-02', 'A-0009'), enDolars('2026-06-20', 'A-0008')], avui: AVUI });
    const per = Object.fromEntries(dades.targetes.map((t) => [t.id, t]));
    for (const id of ['hisenda', 'iva-303', 'irpf-130', 'ingressos', 'despeses', 'rendiment']) {
      expect(per[id].xifra, id).toBeNull();
      expect(per[id].senseXifra, id).toMatch(/^Sense mesura en euros: /);
    }
    expect(per.factures.detall.map((fila) => fila.etiqueta)).toEqual(['Factures emeses']);
  });

  test('les xifres fiscals porten sempre la llegenda d’estimació', () => {
    const dades = dadesDelTauler({ lectura: LECTURA, avui: AVUI });
    for (const id of ['hisenda', 'iva-303', 'irpf-130']) {
      expect(dades.targetes.find((t) => t.id === id).notes.at(-1), id).toMatch(/^Estimació per a revisar amb la gestoria/);
    }
  });

  /* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front I · motors; auditoria de Codex 261013_1510, GES-A5):
     la targeta Hisenda diu el que surt a pagar de cada model, sumat; un 303 a compensar va a part i no resta. */
  test('Hisenda: un 303 a compensar no resta del 130, i la fila del crèdit hi és sempre (no en diu el signe)', () => {
    const exempta = crearFactura({ tipus: 'ingres', data: '2026-07-15', num: 'A-0101', contrapart: 'Client de Prova', subtotal: '5000,00', iva: '0,00', total: '5000,00' });
    const inversio = {
      ...crearFactura({ tipus: 'despesa', data: '2026-08-10', num: 'B-0101', contrapart: 'Proveïdor de Prova', subtotal: '1000,00', iva: '210,00', total: '1210,00' }),
      tipusOperacio: 'interior-deduible'
    };
    const dades = dadesDelTauler({ lectura: LECTURA, factures: [exempta, inversio], avui: AVUI, periode: { any: 2026, t: 3 } });
    const hisenda = dades.targetes.find((t) => t.id === 'hisenda');
    expect(dades.iva.resultat).toBe(-21000);
    expect(dades.irpf.resultat).toBe(80000);
    /* Abans: el net, 590,00 €. Ara: el 130 sencer (800,00 €), i 210,00 € d'IVA a compensar al detall. */
    expect(hisenda.xifra).toEqual({ tipus: 'import', valor: 80000, moneda: 'EUR' });
    expect(hisenda.detall.map((fila) => [fila.etiqueta, fila.xifra?.valor ?? null]))
      .toEqual([['303 · IVA', -21000], ['130 · IRPF', 80000], ['IVA a compensar (no resta)', 21000]]);
    expect(hisenda.notes).toContain('Un 303 a compensar no resta del 130: és IVA per a trimestres següents (o, si toca, per a demanar), no diners cobrats.');
    expect(dades.liquidacio).toMatchObject({ estat: 'xifra', percentatge: 82, supera: false });
    /* Un 303 a pagar: la mateixa fila, amb 0. Les etiquetes del detall no canvien amb el signe. */
    const aPagar = dadesDelTauler({
      lectura: LECTURA, avui: AVUI, periode: { any: 2026, t: 3 },
      factures: [crearFactura({ tipus: 'ingres', data: '2026-07-15', num: 'A-0102', contrapart: 'Client de Prova', subtotal: '100,00', iva: '21,00', total: '121,00' })]
    }).targetes.find((t) => t.id === 'hisenda');
    expect(aPagar.detall.map((fila) => fila.etiqueta)).toEqual(hisenda.detall.map((fila) => fila.etiqueta));
    expect(aPagar.detall.at(-1).xifra).toEqual({ tipus: 'import', valor: 0, moneda: 'EUR' });
    expect(aPagar.xifra).toEqual({ tipus: 'import', valor: 2100 + 2000, moneda: 'EUR' });
  });
});

/* Panell ERP, ordre del Mestre, 261012: la capçalera de context. */
describe('el context del panell', () => {
  const rellotgeDe = (any, t, avui = AVUI) => {
    const { periode, termini } = estimaIva303({ any, t });
    return rellotgeDelTermini({ any, t, periode, termini, avui });
  };

  test('trimestreVei i trimestreOperatiu: la finestra de presentació oberta mana sobre el trimestre natural', () => {
    expect(trimestreVei({ any: 2026, t: 4 }, 1)).toEqual({ any: 2027, t: 1 });
    expect(trimestreVei({ any: 2026, t: 1 }, -1)).toEqual({ any: 2025, t: 4 });
    expect(trimestreVei({ any: 2026, t: 2 }, 1)).toEqual({ any: 2026, t: 3 });
    expect(trimestreVei({ any: 2026, t: 3 }, 0)).toEqual({ any: 2026, t: 3 });
    expect(trimestreVei({ any: 2026, t: 5 }, 1)).toBeNull();
    expect(trimestreVei(null, 1)).toBeNull();
    expect(trimestreVei({ any: 2026, t: 2 }, 0.5)).toBeNull();
    expect(trimestreOperatiu({ a: 2026, m: 10, d: 14 })).toEqual({ any: 2026, t: 3 });
    expect(trimestreOperatiu({ a: 2026, m: 10, d: 20 })).toEqual({ any: 2026, t: 3 });
    expect(trimestreOperatiu({ a: 2026, m: 10, d: 21 })).toEqual({ any: 2026, t: 4 });
    expect(trimestreOperatiu({ a: 2027, m: 1, d: 30 })).toEqual({ any: 2026, t: 4 });
    expect(trimestreOperatiu({ a: 2027, m: 1, d: 31 })).toEqual({ any: 2027, t: 1 });
    expect(trimestreOperatiu(null)).toBeNull();
  });

  test('el rellotge del termini: dins del trimestre, en la finestra de presentació, abans i després', () => {
    const obert3T = 'Ara és oberta la presentació del 3T 2026: acaba el 20/10/2026.';
    expect(rellotgeDe(2026, 4)).toEqual({
      fase: 'trimestre', valor: 4, max: 92, etiqueta: 'El 4T 2026: dia 4 de 92',
      text: 'La presentació del 303 i del 130 va del 01/01/2027 al 30/01/2027.', obert: obert3T
    });
    /* El venciment que corre no s'amaga mai darrere del trimestre triat; si el triat és eixe, el text ja ho diu. */
    expect(rellotgeDe(2026, 3)).toMatchObject({ fase: 'presentacio', valor: 4, max: 20, etiqueta: 'Presentació del 3T 2026: dia 4 de 20', obert: null });
    expect(rellotgeDe(2027, 1)).toMatchObject({ fase: 'abans', valor: null, max: null, text: 'El 1T 2027 encara no ha començat: comença el 01/01/2027.', obert: obert3T });
    expect(rellotgeDe(2026, 2)).toMatchObject({ fase: 'vencut', valor: null, text: 'El termini de presentació del 2T 2026 va acabar el 20/07/2026.', obert: obert3T });
    /* Fora de cap finestra (el 21 d'octubre), res; la del 4T va fins al 30 de gener de l'any següent. */
    expect(rellotgeDe(2026, 4, { a: 2026, m: 10, d: 21 }).obert).toBeNull();
    expect(rellotgeDe(2027, 1, { a: 2027, m: 1, d: 30 }).obert).toBe('Ara és oberta la presentació del 4T 2026: acaba el 30/01/2027.');
    expect(rellotgeDe(2027, 1, { a: 2027, m: 1, d: 31 }).obert).toBeNull();
    /* L'últim dia del trimestre i l'últim de la finestra encara hi són. */
    expect(rellotgeDe(2026, 3, { a: 2026, m: 9, d: 30 })).toMatchObject({ fase: 'trimestre', valor: 92, max: 92 });
    expect(rellotgeDe(2026, 3, { a: 2026, m: 10, d: 20 })).toMatchObject({ fase: 'presentacio', valor: 20, max: 20 });
    expect(rellotgeDe(2026, 3, { a: 2026, m: 10, d: 21 })).toMatchObject({ fase: 'vencut' });
    expect(rellotgeDelTermini({ any: 2026, t: 4 })).toMatchObject({ fase: 'sense', valor: null });
    expect(rellotgeDe(2026, 4, null)).toMatchObject({ fase: 'sense' });
  });

  /* Ordre del Mestre, 14-10-2026 (prompt 261014_2015, punt 1): el trimestre per defecte és l'operatiu. */
  test('trimestreOperatiu a totes les vores de les quatre finestres; res sense un dia vàlid', () => {
    const casos = [
      [{ a: 2026, m: 9, d: 30 }, { any: 2026, t: 3 }], [{ a: 2026, m: 10, d: 1 }, { any: 2026, t: 3 }],
      [{ a: 2026, m: 12, d: 31 }, { any: 2026, t: 4 }], [{ a: 2027, m: 1, d: 1 }, { any: 2026, t: 4 }],
      [{ a: 2027, m: 3, d: 31 }, { any: 2027, t: 1 }], [{ a: 2027, m: 4, d: 1 }, { any: 2027, t: 1 }],
      [{ a: 2027, m: 4, d: 20 }, { any: 2027, t: 1 }], [{ a: 2027, m: 4, d: 21 }, { any: 2027, t: 2 }],
      [{ a: 2027, m: 7, d: 1 }, { any: 2027, t: 2 }], [{ a: 2027, m: 7, d: 20 }, { any: 2027, t: 2 }],
      [{ a: 2027, m: 7, d: 21 }, { any: 2027, t: 3 }]
    ];
    for (const [avui, esperat] of casos) expect(trimestreOperatiu(avui), JSON.stringify(avui)).toEqual(esperat);
    for (const invalid of [undefined, { a: 2026, m: 2, d: 30 }, '2026-10-14', { a: 2026, m: 13, d: 1 }]) {
      expect(trimestreOperatiu(invalid), String(invalid)).toBeNull();
    }
  });

  test('el cas del Mestre (14-10-2026, sense Full): el 3T en presentació, dia 14 de 20 i queden 6 dies', () => {
    const dades = dadesDelTauler({ avui: { a: 2026, m: 10, d: 14 } });
    expect(dades.iva).toMatchObject({ any: 2026, t: 3 });
    expect(dades.rellotge).toEqual({
      fase: 'presentacio', valor: 14, max: 20, etiqueta: 'Presentació del 3T 2026: dia 14 de 20',
      text: 'Ara és el termini de presentació del 303 i del 130, que acaba el 20/10/2026: queden 6 dies.', obert: null
    });
    const per = Object.fromEntries(dades.targetes.map((t) => [t.id, t]));
    expect(per['iva-303'].subtitol).toBe('Estimació del 3T 2026');
    expect(per['iva-303'].etiquetes.map((e) => e.text)).toContain('Termini 20/10/2026');
    expect(per.hisenda.subtitol).toBe('Models 303 i 130 · 3T 2026');
    /* Els venciments del Quadre de comandament: el 3T obert (el mateix compte enrere) i el 4T proper, sense repetir-ne cap. */
    expect(dades.cabina.venciments.map((v) => [v.clau, v.fase])).toEqual([['2026-T3', 'oberta'], ['2026-T4', 'propera']]);
    expect(dades.cabina.venciments[0].text).toBe('La presentació acaba el 20/10/2026: queden 6 dies.');
  });

  test('el compte enrere del rellotge: queda un dia, acaba hui; l’endemà, el trimestre natural sense presentació oberta', () => {
    const rellotge = (d) => dadesDelTauler({ avui: { a: 2026, m: 10, d } }).rellotge;
    expect(rellotge(19).text).toBe('Ara és el termini de presentació del 303 i del 130, que acaba el 20/10/2026: queda un dia.');
    expect(rellotge(20)).toMatchObject({ valor: 20, max: 20, text: 'Ara és el termini de presentació del 303 i del 130, que acaba hui, el 20/10/2026.' });
    expect(rellotge(21)).toMatchObject({ fase: 'trimestre', etiqueta: 'El 4T 2026: dia 21 de 92', obert: null });
    expect(dadesDelTauler({ avui: { a: 2027, m: 1, d: 1 } }).rellotge).toMatchObject({ etiqueta: 'Presentació del 4T 2026: dia 1 de 30' });
    expect(dadesDelTauler({ avui: { a: 2027, m: 1, d: 31 } }).rellotge.etiqueta).toBe('El 1T 2027: dia 31 de 90');
    expect(dadesDelTauler({ avui: { a: 2028, m: 1, d: 31 } }).rellotge.etiqueta).toBe('El 1T 2028: dia 31 de 91');
  });

  test('el Full continua manant sobre el trimestre operatiu: amb el 2T, vençut, i l’avís de la presentació oberta del 3T', () => {
    const dades = dadesDelTauler({ avui: { a: 2026, m: 10, d: 14 }, periode: { any: 2026, t: 2 } });
    expect(dades.iva).toMatchObject({ any: 2026, t: 2 });
    expect(dades.rellotge).toMatchObject({ fase: 'vencut', obert: 'Ara és oberta la presentació del 3T 2026: acaba el 20/10/2026.' });
  });

  test('invariant: cap dia del 2026 al 2028 deixa el rellotge per defecte fora del trimestre o amb un avís d’una altra finestra', () => {
    const dia = new Date(Date.UTC(2026, 0, 1));
    while (dia.getUTCFullYear() < 2029) {
      const avui = { a: dia.getUTCFullYear(), m: dia.getUTCMonth() + 1, d: dia.getUTCDate() };
      const natural = { any: avui.a, t: Math.ceil(avui.m / 3) };
      const operatiu = trimestreOperatiu(avui);
      expect([JSON.stringify(natural), JSON.stringify(trimestreVei(natural, -1))], JSON.stringify(avui)).toContain(JSON.stringify(operatiu));
      const { rellotge } = dadesDelTauler({ avui });
      expect(['trimestre', 'presentacio'], JSON.stringify(avui)).toContain(rellotge.fase);
      expect(rellotge.obert, JSON.stringify(avui)).toBeNull();
      dia.setUTCDate(dia.getUTCDate() + 1);
    }
  });

  test('Hisenda sobre la caixa: la part de la caixa, amb sostre de 100 i el perquè quan no es pot dir', () => {
    const caixa = (saldo, completa = true) => ({ saldo, completa });
    const hisenda = (total, completa = true) => ({ total, completa });
    expect(hisendaSobreCaixa({ hisenda: hisenda(2500), caixa: caixa(10000) })).toEqual({ estat: 'xifra', percentatge: 25, supera: false, completa: true });
    expect(hisendaSobreCaixa({ hisenda: hisenda(15000), caixa: caixa(10000) })).toEqual({ estat: 'xifra', percentatge: 100, supera: true, completa: true });
    expect(hisendaSobreCaixa({ hisenda: hisenda(2500, false), caixa: caixa(10000) })).toMatchObject({ completa: false });
    expect(hisendaSobreCaixa({ hisenda: hisenda(2500), caixa: caixa(10000, false) })).toMatchObject({ completa: false });
    expect(hisendaSobreCaixa({ hisenda: hisenda(0), caixa: caixa(10000) })).toEqual({ estat: 'res', completa: true });
    expect(hisendaSobreCaixa({ hisenda: hisenda(-500), caixa: caixa(10000) })).toEqual({ estat: 'res', completa: true });
    expect(hisendaSobreCaixa({ hisenda: hisenda(null), caixa: caixa(10000) })).toMatchObject({ estat: 'sense', motiu: expect.stringMatching(/^Sense estimació de Hisenda/) });
    /* 'sense' (i el seu motiu, que es veu amb l'ull tancat) només vol dir que falta la dada, mai el signe d'una xifra. */
    for (const saldo of [null, 1.5]) {
      expect(hisendaSobreCaixa({ hisenda: hisenda(2500), caixa: caixa(saldo) }), String(saldo)).toMatchObject({ estat: 'sense', motiu: expect.stringMatching(/^Sense caixa real/) });
    }
    for (const saldo of [0, -100]) {
      expect(hisendaSobreCaixa({ hisenda: hisenda(2500), caixa: caixa(saldo) }), String(saldo)).toEqual({ estat: 'descobert', completa: true });
      expect(hisendaSobreCaixa({ hisenda: hisenda(null), caixa: caixa(saldo) }), String(saldo)).toMatchObject({ estat: 'sense', motiu: expect.stringMatching(/^Sense estimació/) });
      expect(hisendaSobreCaixa({ hisenda: hisenda(0), caixa: caixa(saldo) }), String(saldo)).toEqual({ estat: 'res', completa: true });
    }
    /* Codex, GES-04: un net a zero d'una estimació incompleta no es dona per segur. */
    expect(hisendaSobreCaixa({ hisenda: hisenda(0, false), caixa: caixa(10000) })).toEqual({ estat: 'res', completa: false });
    expect(hisendaSobreCaixa()).toMatchObject({ estat: 'sense' });
  });

  test('dadesDelTauler porta el rellotge del trimestre de les estimacions i Hisenda sobre la caixa', () => {
    const dades = dadesDelTauler({ lectura: LECTURA, avui: AVUI, periode: { any: 2026, t: 3 } });
    expect(dades.rellotge).toMatchObject({ fase: 'presentacio', etiqueta: 'Presentació del 3T 2026: dia 4 de 20' });
    expect(dades.liquidacio).toMatchObject({ estat: 'sense', motiu: expect.stringMatching(/^Sense estimació de Hisenda/) });
    expect(dadesDelTauler({ avui: AVUI }).liquidacio).toMatchObject({ estat: 'sense', motiu: expect.stringMatching(/^Sense caixa real/) });
  });

  /* Revisió adversarial 13-10-2026, troballa FIN-3: resumHisenda suma només els models amb resultat, i un total de
     zero amb un model sense estimació no diu res d'eixe model. El «res» porta quin falta i no es dona per complet. */
  test('Hisenda sobre la caixa, «res» amb un model sense estimació: diu quin falta i és incomplet; sense cap dels dos, «sense»', () => {
    const caixa = { saldo: 10000, completa: true };
    const model = (resultat, completa = true) => ({ resultat, completa });
    const amb = (iva, irpf) => hisendaSobreCaixa({ hisenda: resumHisenda({ iva, irpf }), caixa, iva, irpf });
    /* Els dos models coneguts: el «res» de sempre, complet o no. */
    expect(amb(model(-50000), model(0))).toEqual({ estat: 'res', completa: true });
    expect(amb(model(-50000, false), model(0, false))).toEqual({ estat: 'res', completa: false });
    /* Un 303 a compensar i el 130 sense estimació; i el mirall, un 303 sense estimació i el 130 a zero. */
    expect(amb(model(-50000), model(null, false))).toEqual({ estat: 'res', completa: false, desconegut: '130' });
    expect(amb(model(null, false), model(0))).toEqual({ estat: 'res', completa: false, desconegut: '303' });
    /* Cap dels dos: no hi ha estimació, ni tan sols amb un total de fora que diga zero. */
    expect(amb(model(null, false), model(null, false))).toMatchObject({ estat: 'sense', motiu: expect.stringMatching(/^Sense estimació de Hisenda/) });
    expect(hisendaSobreCaixa({ hisenda: { total: 0, completa: true }, caixa, iva: model(null), irpf: model(null) }))
      .toMatchObject({ estat: 'sense', motiu: expect.stringMatching(/^Sense estimació de Hisenda/) });
    /* Un model desconegut no deixa mai l'estimació completa, encara que el total de fora diga que sí. */
    expect(hisendaSobreCaixa({ hisenda: { total: 0, completa: true }, caixa, iva: model(-50000), irpf: model(null) }))
      .toEqual({ estat: 'res', completa: false, desconegut: '130' });
    expect(hisendaSobreCaixa({ hisenda: { total: 2500, completa: true }, caixa, iva: model(2500), irpf: model(null) }))
      .toEqual({ estat: 'xifra', percentatge: 25, supera: false, completa: false });
  });

  test('dadesDelTauler passa el 303 i el 130 a Hisenda sobre la caixa: el «res» d’un sol model conegut diu quin falta', () => {
    /* Una compra deduïble amb l'IVA llegit i sense la base: el 303 surt a compensar i el 130 no té cap base de l'any. */
    const senseBase = {
      ...crearFactura({ tipus: 'despesa', data: '2026-08-10', num: 'B-0301', contrapart: 'Proveïdor de Prova', iva: '210,00', total: '1210,00' }),
      tipusOperacio: 'interior-deduible'
    };
    const ambSenseBase = dadesDelTauler({ lectura: LECTURA, factures: [senseBase], avui: AVUI, periode: { any: 2026, t: 3 } });
    expect([ambSenseBase.iva.resultat, ambSenseBase.irpf.resultat, ambSenseBase.hisenda.total]).toEqual([-21000, null, 0]);
    expect(ambSenseBase.liquidacio).toEqual({ estat: 'res', completa: false, desconegut: '130' });
    /* El mirall: una compra amb la base i sense l'IVA llegit; el 303 no té cap factura amb IVA i el 130 queda a zero. */
    const senseIva = crearFactura({ tipus: 'despesa', data: '2026-08-10', num: 'B-0302', contrapart: 'Proveïdor de Prova', subtotal: '1000,00', total: '1210,00' });
    const ambSenseIva = dadesDelTauler({ lectura: LECTURA, factures: [senseIva], avui: AVUI, periode: { any: 2026, t: 3 } });
    expect([ambSenseIva.iva.resultat, ambSenseIva.irpf.resultat, ambSenseIva.hisenda.total]).toEqual([null, 0, 0]);
    expect(ambSenseIva.liquidacio).toEqual({ estat: 'res', completa: false, desconegut: '303' });
  });
});

describe('el text de les xifres', () => {
  test('imports, mesos i recomptes; en una altra moneda, el codi', () => {
    expect(textXifra({ tipus: 'import', valor: 123456, moneda: 'EUR' })).toBe('1.234,56 €');
    expect(textXifra({ tipus: 'import', valor: -5000 })).toBe('-50,00 €');
    expect(textXifra({ tipus: 'import', valor: 100000, moneda: 'USD' })).toBe('1.000,00 USD');
    expect(textXifra({ tipus: 'mesos', valor: 6.3 })).toBe('6,3');
    expect(etiquetaXifra({ tipus: 'mesos', valor: 1 })).toBe('1,0 mes');
    expect(etiquetaXifra({ tipus: 'mesos', valor: 6.3 })).toBe('6,3 mesos');
    expect(textXifra({ tipus: 'recompte', valor: 7 })).toBe('7');
    expect(textXifra(null)).toBe('');
    expect(textAmagat({ tipus: 'import' })).toBe('Import amagat');
    expect(textAmagat({ tipus: 'mesos' })).toBe('Xifra amagada');
  });

  /* Cabina d'Avió, ordre del Mestre, 13-10-2026 (pla 261013_1405, front E): els dies de cobertura i la ràtio. */
  test('dies i ràtio: enters amb dia o dies, dos decimals amb la coma i «vegades»; amagats, «Xifra amagada»', () => {
    expect(textXifra({ tipus: 'dies', valor: 1 })).toBe('1');
    expect(etiquetaXifra({ tipus: 'dies', valor: 1 })).toBe('1 dia');
    expect(etiquetaXifra({ tipus: 'dies', valor: 37 })).toBe('37 dies');
    expect(etiquetaXifra({ tipus: 'dies', valor: 0 })).toBe('0 dies');
    expect(textXifra({ tipus: 'ratio', valor: 2.35 })).toBe('2,35');
    expect(etiquetaXifra({ tipus: 'ratio', valor: 2.35 })).toBe('2,35 vegades');
    expect(etiquetaXifra({ tipus: 'ratio', valor: 1 })).toBe('1,00 vegades');
    expect(textXifra({ tipus: 'ratio', valor: 10 })).toBe('10,00');
    expect(textAmagat({ tipus: 'dies' })).toBe('Xifra amagada');
    expect(textAmagat({ tipus: 'ratio' })).toBe('Xifra amagada');
    /* Uns dies que no són enters no es pinten com si ho foren; ni una ràtio infinita. */
    expect(textXifra({ tipus: 'dies', valor: 1.5 })).toBe('');
    expect(etiquetaXifra({ tipus: 'dies', valor: 1.5 })).toBe('');
    expect(textXifra({ tipus: 'ratio', valor: Infinity })).toBe('');
  });

  test('dadesDelTauler porta la Cabina: sense lectura, cap mes de flux i cada instrument amb el seu perquè', () => {
    const dades = dadesDelTauler({ avui: AVUI });
    expect(dades.cabina).toMatchObject({ fins: null, mesos: [], maxim: null });
    expect(dades.cabina.instruments.map((i) => i.xifra)).toEqual(Array(8).fill(null));
    for (const i of dades.cabina.instruments) expect(i.senseXifra, i.id).toMatch(/\S/);
    /* El 4 d'octubre: la presentació del 3T, oberta; la del 4T, propera. */
    expect(dades.cabina.venciments.map((v) => [v.clau, v.fase])).toEqual([['2026-T3', 'oberta'], ['2026-T4', 'propera']]);
    const ambExtracte = dadesDelTauler({ lectura: LECTURA, avui: AVUI }).cabina;
    expect(ambExtracte.mesos.map((m) => [m.clau, m.entrades, m.eixides, m.net])).toEqual([['2026-06', 0, 2500, -2500]]);
    expect(ambExtracte.instruments.find((i) => i.id === 'caixa').xifra).toEqual({ tipus: 'import', valor: 97500, moneda: 'EUR' });
    expect(Object.isFrozen(ambExtracte)).toBe(true);
  });

  test('cap xifra escrita al codi del model: totes ixen de les lectures', () => {
    const codi = readFileSync(path.join(process.cwd(), 'src/sections/gestoria/tauler/nucli/targetesTauler.js'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '');
    expect(codi).not.toMatch(/\d+,\d{2} ?€|\d{4,}/);
  });
});
