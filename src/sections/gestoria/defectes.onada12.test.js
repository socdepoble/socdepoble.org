// @vitest-environment node
/* Onada 12 (261011; ordres 261011_0130, punt 6) · DEFECTES CONEGUTS de la
   Gestoria que NO s'han arreglat esta nit, perquè cada un viu en una font
   signada d'un tractor (impostos.js i categories.js són fonts de
   'gestoria.tauler' i de 'gestoria.historic') i tocar-la en tornaria
   l'aprovació a «pendent» sense ordre del Mestre. G1, G2 i G3 són defectes;
   G4 és un dubte (mig volgut) i l'últim, de resumTauler.js, és un límit
   conegut i volgut: no són defectes i ho diuen.

   Convenció de la casa (tests/porta-olivera-diagnosi.test.mjs): una prova
   «[DEFECTE Gn]» PASSA hui perquè afirma el comportament defectuós, amb el
   valor correcte escrit al costat. El dia que s'arregle, la prova cau i es
   gira. Dades sintètiques (any 2099, empreses inventades).
   G1 ja està arreglat i girat: ordre del Mestre, 13-10-2026 (pla
   261013_1405, front I · motors; auditoria de Codex 261013_1510, GES-A4).
   Ara és una prova de regressió «[ARREGLAT G1]» del resultat correcte. */
import { describe, expect, test } from 'vitest';
import { classificaMoviment } from './despeses/nucli/categories.js';
import { estimaIrpf130 } from './impostos/nucli/impostos.js';
import { crearFactura } from './nucli/model.js';
import { comptesDe } from './tauler/nucli/resumTauler.js';

const D = (a, m, d) => ({ a, m, d });
const CIF = ['A1234', '5674'].join('');
const emesa = (parcial) => crearFactura({ tipus: 'ingres', contrapart: 'Client Sintetic SL', nif: CIF, descripcio: 'Prova', ...parcial });

describe('impostos.js (font de gestoria.tauler i gestoria.historic)', () => {
  test('[ARREGLAT G1] la retenció d’un abonament resta: factura i abonament íntegre són neutrals per al 130', () => {
    const factures = [
      emesa({ data: D(2099, 1, 10), num: 'F99-0001', subtotal: 100000, iva: 21000, retencio: 15000, total: 106000 }),
      emesa({ data: D(2099, 1, 11), num: 'R99-0001', subtotal: -100000, iva: -21000, retencio: 15000, total: -106000, abonament: true }),
      emesa({ data: D(2099, 1, 12), num: 'F99-0002', subtotal: 100000, iva: 21000, total: 121000 })
    ];
    const irpf = estimaIrpf130({ factures, any: 2099, t: 1 });
    expect(irpf).toMatchObject({ ingressos: 100000, rendiment: 100000, quota: 20000 });
    /* Abans (defecte): retencions 30000 i resultat 0. Ara, el correcte: la factura i el seu abonament s'anul·len. */
    expect(irpf.retencions).toBe(0);
    expect(irpf.resultat).toBe(20000);
    /* I és el mateix 130 que sense la parella anul·lada. */
    const sense = estimaIrpf130({ factures: [factures[2]], any: 2099, t: 1 });
    expect({ retencions: irpf.retencions, resultat: irpf.resultat }).toEqual({ retencions: sense.retencions, resultat: sense.resultat });
  });
});

describe('categories.js (font de gestoria.historic)', () => {
  test('[DEFECTE G2] «SUMA GESTION TRIBUTARIA» (els tributs locals, en castellà) no es reconeix com a impostos', () => {
    /* Correcte: { categoria: 'impostos', motiu: 'CATEGORIA_GENERICA' }. El patró només casa «SUMA GESTIO». */
    expect(classificaMoviment({ text: 'SUMA GESTION TRIBUTARIA', centims: -10000 })).toMatchObject({ categoria: 'altres', motiu: 'EIXIDA_SENSE_PATRO' });
    expect(classificaMoviment({ text: 'SUMA GESTIO TRIBUTARIA', centims: -10000 })).toMatchObject({ categoria: 'impostos' });
  });

  test('[DEFECTE G3] una ENTRADA amb la paraula «comisiones» es torna comissió del banc amb confiança mitjana, i no ix a revisar', () => {
    /* Correcte: una entrada no és una despesa de comissions sense que la persona ho mire (confiança baixa, o «clients»). */
    expect(classificaMoviment({ text: 'TRANSFERENCIA RECIBIDA COMISIONES AGENTE', centims: 50000 }))
      .toEqual({ categoria: 'comissions', proveidor: null, confianca: 'mitjana', motiu: 'COMISSIO' });
  });

  test('[DUBTE G4, mig volgut] «mantenimiento» al concepte passa davant del creditor del rebut SEPA, encara que siga un proveïdor conegut', () => {
    /* No és un defecte clar: categories.js decidix a posta que la comissió del banc mana sobre el proveïdor
       (categories.test.js: «la comissió del banc mana sobre el proveïdor»), i només n'exceptua el comerç de la
       targeta. El que queda per decidir (el Mestre) és si el creditor d'un rebut SEPA ha de tindre la mateixa
       excepció: el banc no cobra les seues comissions amb un rebut d'un tercer, i així un rebut de SiteGround amb
       «mantenimiento» aniria a 'allotjament' (motiu 'CREDITOR_SEPA'). Ací només es fixa el que fa hui. */
    expect(classificaMoviment({ sepa: { creditor: 'SITEGROUND SPAIN SL' }, text: 'MANTENIMIENTO WEB', centims: -12000 }))
      .toMatchObject({ categoria: 'comissions', motiu: 'COMISSIO' });
    expect(classificaMoviment({ comerc: 'SITEGROUND SPAIN SL', text: 'MANTENIMIENTO WEB', centims: -12000 }))
      .toMatchObject({ categoria: 'allotjament', proveidor: 'siteground', motiu: 'COMERC' });
  });
});

describe('resumTauler.js (font de gestoria.tauler i gestoria.historic) · un límit conegut i VOLGUT, no un defecte', () => {
  test('[LÍMIT VOLGUT] amb Norma 43 present, les files d’un CSV que no hi fan parella no es compten', () => {
    /* Correcció 261011 (refutador, punt 11): açò NO és un defecte. És el comportament volgut i provat
       (resumTauler.test.js: «una fila sense parella ho diu i no es compta», i el missatge de l'avís): el CSV del
       banc és el mateix compte que la Norma 43, i sumar-ne les files soltes comptaria dues vegades. Es fixa ací
       només per la conseqüència: mentre siga així, el Tauler i l'Històric no poden llegir l'extracte d'una
       targeta de crèdit al costat del compte (els seus moviments no són a la Norma 43 un per un). Per a fer-ho
       caldria que un CSV d'un altre compte fora un compte a part: una decisió, no una correcció. */
    const dia = D(2099, 1, 10);
    const extractes = [{
      lectura: {
        comptes: [{
          capcalera: { entitat: '9999', compte4: '4321', dataInicial: D(2099, 1, 1), dataFinal: D(2099, 1, 31), saldoInicial: 0, divisa: 'EUR' },
          moviments: [{ dataOperacio: dia, dataValor: dia, centims: -1000, conceptComu: '' }],
          peu: { saldoFinal: -1000 }
        }],
        avisos: []
      }
    }];
    const csv = [{ lectura: { moviments: [{ fila: 2, dataOperacio: D(2099, 2, 5), dataValor: D(2099, 2, 5), centims: -2500, saldo: null }], avisos: [] } }];
    const { comptes, avisos } = comptesDe({ extractes, csv });
    expect(comptes).toHaveLength(1);
    expect(comptes[0].moviments.map((m) => m.centims)).toEqual([-1000]);
    expect(avisos.map((a) => a.codi)).toEqual(['CSV_SENSE_PARELLA']);
  });
});
