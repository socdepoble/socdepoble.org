// @vitest-environment node
/* El pressupost: sèrie pròpia, validesa de 90 dies i conversió a factura sense
   copiar res a mà. Dades sintètiques; el NIF del client es compon a trossos
   perquè la porta de qualitat no hi veja un literal amb forma de DNI. */
import { describe, expect, test } from 'vitest';
import { esFacturaEmesa } from './facturaEmesa.js';
import * as moduls from './pressupost.js';
import {
  ESQUEMA_PRESSUPOST, PREFIX_PRESSUPOST, VALIDESA_DIES, creaPressupost, esPressupost, facturaDePressupost, validaPressupost
} from './pressupost.js';
import { creaRegistreAlta } from './registre/registreAlta.js';
import { PREFIX_RECOMANAT, seguentNumSerie } from './serie.js';

const CIF_EMISSOR = 'B12345674';
const DNI_CLIENT = ['1234', '5678', 'Z'].join('');
/* Un domicili sintètic: cap adreça real. */
const DOMICILI = Object.freeze({ adreca: 'Plaça del Poble, 1', codiPostal: '46999', poblacio: 'Poble de Prova' });

function dades(canvis = {}) {
  return {
    numero: 'P2026-0001',
    data: '2026-10-04',
    emissor: { nif: CIF_EMISSOR, nom: 'Forn del Poble', domicili: DOMICILI },
    destinatari: { nif: DNI_CLIENT, nom: 'Bar de la Plaça', domicili: DOMICILI },
    linies: [
      { concepte: 'Coques per a la festa', quantitat: 40, preuUnitari: 350, tipusIva: 10, unitat: 'peces' },
      { concepte: 'Lloguer del forn', quantitat: 2, preuUnitari: 2500, tipusIva: 21, unitat: 'hores', detall: 'Divendres\nDissabte' }
    ],
    ...canvis
  };
}

describe('el pressupost', () => {
  test('es calcula com la factura completa que serà, amb una validesa de 90 dies', () => {
    const p = creaPressupost(dades());
    expect(VALIDESA_DIES).toBe(90);
    expect(p).toMatchObject({
      esquema: ESQUEMA_PRESSUPOST, numero: 'P2026-0001', data: '2026-10-04', validFins: '2027-01-02',
      descripcio: 'Coques per a la festa', baseTotal: 19000, quotaTotal: 2450, importTotal: 21450, liquid: 21450, moneda: 'EUR'
    });
    expect(Object.isFrozen(p.linies[1])).toBe(true);
    expect(esPressupost(p)).toBe(true);
  });

  test('en sèrie pròpia: P, que no és de cap factura', () => {
    expect(Object.values(PREFIX_RECOMANAT)).not.toContain(PREFIX_PRESSUPOST);
    for (const numero of ['A2026-0001', 'P2026-1', 'P1999-0001', '']) {
      expect(validaPressupost(dades({ numero })).join(' '), numero).toMatch(/sèrie/);
    }
    expect(seguentNumSerie(['P2026-0001', 'A2026-0001'], { prefix: PREFIX_PRESSUPOST, any: 2026 })).toBe('P2026-0002');
  });

  test('com una completa: domicilis, data i línies', () => {
    expect(validaPressupost(dades({ destinatari: { nif: DNI_CLIENT, nom: 'Bar' } })).join(' ')).toMatch(/domicili del destinatari/);
    expect(validaPressupost(dades({ data: '2026-02-30' })).join(' ')).toMatch(/data del pressupost/);
    expect(() => creaPressupost(dades({ linies: [] }))).toThrow(expect.objectContaining({ codi: 'PRESSUPOST_INVALID' }));
    expect(validaPressupost(null)).toHaveLength(1);
  });

  test('fora de la cadena fiscal: no és una factura i no es registra', async () => {
    const p = creaPressupost(dades());
    expect(esFacturaEmesa(p)).toBe(false);
    await expect(creaRegistreAlta({ factura: p, instant: Date.UTC(2026, 9, 4, 10) })).rejects.toMatchObject({ codi: 'REGISTRE_INVALID' });
    expect(Object.keys(moduls).filter((nom) => /^(?:edita|actualitza|modifica|esborra|elimina)/i.test(nom))).toEqual([]);
  });

  test('un pressupost retocat, o una còpia oberta, ja no ho és', () => {
    const retocat = JSON.parse(JSON.stringify(creaPressupost(dades())));
    retocat.validFins = '2027-12-31';
    expect(esPressupost(Object.freeze(retocat))).toBe(false);
    expect(esPressupost({ ...creaPressupost(dades()) })).toBe(false);
  });
});

describe('de pressupost a factura, sense copiar a mà', () => {
  test('persones, línies i descripció passen tal qual; la factura es torna a calcular', () => {
    const p = creaPressupost(dades());
    const f = facturaDePressupost(p, {
      numSerie: 'A2026-0007', dataExpedicio: '2026-10-20', venciment: '2026-11-19',
      cobrament: { metode: 'transferencia', compte: 'compte-principal' }
    });
    expect(esFacturaEmesa(f)).toBe(true);
    expect(f).toMatchObject({
      tipus: 'F1', numSerie: 'A2026-0007', descripcio: p.descripcio, baseTotal: p.baseTotal, quotaTotal: p.quotaTotal,
      importTotal: p.importTotal, venciment: '2026-11-19', cobrament: { metode: 'transferencia', compte: 'compte-principal' }
    });
    expect(f.emissor).toEqual(p.emissor);
    expect(f.destinatari).toEqual(p.destinatari);
    expect(f.linies).toEqual(p.linies);
    expect(f.desglossament).toEqual(p.desglossament);
  });

  test('només dins de la validesa: s’accepta del dia del pressupost a 90 dies després', () => {
    const p = creaPressupost(dades());
    expect(facturaDePressupost(p, { numSerie: 'A2027-0001', dataExpedicio: '2027-01-02' }).dataExpedicio).toBe('2027-01-02');
    expect(() => facturaDePressupost(p, { numSerie: 'A2027-0001', dataExpedicio: '2027-01-03' }))
      .toThrow(expect.objectContaining({ codi: 'PRESSUPOST_CADUCAT' }));
    expect(() => facturaDePressupost(p, { numSerie: 'A2026-0007', dataExpedicio: '2026-10-03' }))
      .toThrow(expect.objectContaining({ codi: 'PRESSUPOST_CADUCAT' }));
    // Acceptat a temps i facturat després: val.
    expect(facturaDePressupost(p, { numSerie: 'A2027-0001', dataExpedicio: '2027-02-15', dataAcceptacio: '2026-12-01' }).numSerie).toBe('A2027-0001');
    expect(() => facturaDePressupost(p, { numSerie: 'A2026-0007', dataExpedicio: '2026-11-01', dataAcceptacio: '2026-11-02' }))
      .toThrow(/anterior a l'acceptació/);
  });

  test('la factura va en la sèrie de les factures, i amb la llei del dia que s’emet', () => {
    const p = creaPressupost(dades());
    expect(() => facturaDePressupost(p, { numSerie: 'P2026-0002', dataExpedicio: '2026-10-20' })).toThrow(/sèrie de les factures/);
    // Tampoc cap número que hi puga passar per un de pressupost, encara que no siga la forma canònica.
    for (const numSerie of ['P2026-2', 'P2026-00002', 'p2026-0002', ' P 2026-0002 ', 'P26-0002', 'P1']) {
      expect(() => facturaDePressupost(p, { numSerie, dataExpedicio: '2026-10-20' }), numSerie)
        .toThrow(expect.objectContaining({ codi: 'FACTURA_INVALIDA', message: expect.stringMatching(/sèrie de les factures/) }));
    }
    // Un prefix que només comença per P, sense xifra darrere, és una altra sèrie.
    expect(facturaDePressupost(p, { numSerie: 'PA2026-0001', dataExpedicio: '2026-10-20' }).numSerie).toBe('PA2026-0001');
    expect(() => facturaDePressupost({ ...p }, { numSerie: 'A2026-0007', dataExpedicio: '2026-10-20' }))
      .toThrow(expect.objectContaining({ codi: 'PRESSUPOST_INVALID' }));
    // Un tipus que la llei ja no admet el dia de la factura: no passa.
    const amb75 = creaPressupost(dades({ linies: [{ concepte: 'Pa', quantitat: 1, preuUnitari: 1000, tipusIva: 7.5 }] }), { tipusIva: [7.5] });
    expect(esPressupost(amb75)).toBe(true);
    expect(() => facturaDePressupost(amb75, { numSerie: 'A2026-0007', dataExpedicio: '2026-10-20' }))
      .toThrow(expect.objectContaining({ codi: 'FACTURA_INVALIDA' }));
  });
});
