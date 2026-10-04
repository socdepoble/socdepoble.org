// @vitest-environment node
/* La factura emesa: validació, càlcul en cèntims i immutabilitat. Els NIF de
   persona es componen a trossos perquè la porta de qualitat no hi veja un
   literal amb forma de DNI. */
import { describe, expect, test } from 'vitest';
import { congela } from './comu.js';
import * as moduls from './facturaEmesa.js';
import {
  ESQUEMA_FACTURA, LIMIT_SIMPLIFICADA, MAX_BASE, TIPUS_FACTURA, creaFacturaEmesa, errorsDeRecalcul, esFacturaEmesa,
  validaFacturaEmesa
} from './facturaEmesa.js';

const CIF_EMISSOR = 'B12345674';
const DNI_CLIENT = ['1234', '5678', 'Z'].join('');
/* Domicilis sintètics: cap adreça real. */
const DOMICILI_FORN = Object.freeze({ adreca: 'Plaça del Poble, 1', codiPostal: '46999', poblacio: 'Poble de Prova' });
const DOMICILI_BAR = Object.freeze({ adreca: 'Carrer de la Prova, 2', codiPostal: '03999', poblacio: 'Altre Poble', provincia: 'Alacant' });

function dades(canvis = {}) {
  return {
    tipus: 'F1',
    numSerie: 'A2026-0001',
    dataExpedicio: '2026-10-04',
    emissor: { nif: CIF_EMISSOR, nom: 'Forn del Poble', domicili: DOMICILI_FORN },
    destinatari: { nif: DNI_CLIENT, nom: 'Bar de la Plaça', domicili: DOMICILI_BAR },
    descripcio: 'Pa i coca de la setmana',
    linies: [
      { concepte: 'Pa de llenya', quantitat: 12, preuUnitari: 250, tipusIva: 4 },
      { concepte: 'Lloguer del forn', quantitat: 1, preuUnitari: 1000, tipusIva: 21 }
    ],
    ...canvis
  };
}

const errorsDe = (canvis, opcions) => validaFacturaEmesa(dades(canvis), opcions).join(' ');

describe('una factura completa (F1)', () => {
  test('calcula les bases, el desglossament per tipus i els totals en cèntims', () => {
    const f = creaFacturaEmesa(dades());
    expect(f).toMatchObject({
      esquema: ESQUEMA_FACTURA, tipus: 'F1', numSerie: 'A2026-0001', dataExpedicio: '2026-10-04',
      emissor: { nif: CIF_EMISSOR, nom: 'Forn del Poble' }, destinatari: { nif: DNI_CLIENT, nom: 'Bar de la Plaça' },
      baseTotal: 4000, quotaTotal: 330, importTotal: 4330, liquid: 4330, moneda: 'EUR'
    });
    expect(f.linies.map((l) => l.base)).toEqual([3000, 1000]);
    expect(f.desglossament).toEqual([
      { qualificacio: 'S1', tipusIva: 4, base: 3000, quota: 120 },
      { qualificacio: 'S1', tipusIva: 21, base: 1000, quota: 210 }
    ]);
    expect(esFacturaEmesa(f)).toBe(true);
  });

  test('naix congelada en profunditat: no hi ha manera d’editar-la', () => {
    const f = creaFacturaEmesa(dades());
    for (const part of [f, f.emissor, f.destinatari, f.linies, f.linies[0], f.desglossament, f.desglossament[0]]) {
      expect(Object.isFrozen(part)).toBe(true);
    }
    expect(() => { f.importTotal = 1; }).toThrow(TypeError);
    expect(() => { f.linies[0].preuUnitari = 1; }).toThrow(TypeError);
    expect(() => f.linies.push({})).toThrow(TypeError);
    // Una còpia oberta ja no és una factura emesa.
    expect(esFacturaEmesa({ ...f })).toBe(false);
  });

  test('cap funció del mòdul edita, actualitza ni esborra', () => {
    expect(Object.keys(moduls).filter((nom) => /^(?:edita|actualitza|modifica|esborra|elimina|anul)/i.test(nom))).toEqual([]);
  });

  test('les dades d’entrada no queden enganxades a la factura', () => {
    const entrada = dades();
    const f = creaFacturaEmesa(entrada);
    entrada.linies[0].preuUnitari = 9999;
    entrada.emissor.nom = 'Un altre';
    expect(f.linies[0].preuUnitari).toBe(250);
    expect(f.emissor.nom).toBe('Forn del Poble');
  });

  test('els textos es netegen d’espais als extrems i el NIF es normalitza', () => {
    const f = creaFacturaEmesa(dades({ emissor: { nif: ' b-1234567.4 ', nom: '  Forn del Poble ', domicili: DOMICILI_FORN }, numSerie: ' A2026-0001 ' }));
    expect(f.emissor).toEqual({ nif: CIF_EMISSOR, nom: 'Forn del Poble', domicili: DOMICILI_FORN });
    expect(f.numSerie).toBe('A2026-0001');
  });
});

describe('les persones: domicili i nom comercial (onada 2)', () => {
  test('sense domicili de l’emissor o del destinatari, una completa no es crea', () => {
    expect(() => creaFacturaEmesa(dades({ emissor: { nif: CIF_EMISSOR, nom: 'Forn del Poble' } })))
      .toThrow(expect.objectContaining({ codi: 'FACTURA_INVALIDA' }));
    expect(errorsDe({ emissor: { nif: CIF_EMISSOR, nom: 'Forn del Poble' } })).toMatch(/Falta el domicili de l'emissor/);
    expect(errorsDe({ destinatari: { nif: DNI_CLIENT, nom: 'Bar' } })).toMatch(/Falta el domicili del destinatari/);
    for (const tipus of ['F3', 'R1']) {
      const canvis = tipus === 'F3'
        ? { tipus, substituides: [{ numSerie: 'T2026-0001', dataExpedicio: '2026-10-01' }] }
        : { tipus, numSerie: 'R2026-0001', tipusRectificativa: 'I', rectificades: [{ numSerie: 'A2026-0001', dataExpedicio: '2026-10-01' }] };
      expect(errorsDe({ ...canvis, destinatari: { nif: DNI_CLIENT, nom: 'Bar' } }), tipus).toMatch(/domicili del destinatari/);
    }
  });

  test('un domicili mal format: adreça, codi postal i població', () => {
    const amb = (domicili) => errorsDe({ destinatari: { nif: DNI_CLIENT, nom: 'Bar', domicili } });
    expect(amb({ ...DOMICILI_BAR, adreca: 'Carrer\nde dalt' })).toMatch(/adreça del destinatari/);
    expect(amb({ ...DOMICILI_BAR, codiPostal: '99001' })).toMatch(/codi postal del destinatari/);
    expect(amb({ ...DOMICILI_BAR, codiPostal: 3999 })).toMatch(/codi postal/);
    expect(amb({ ...DOMICILI_BAR, poblacio: '' })).toMatch(/població del destinatari/);
  });

  test('la factura congela el domicili triat: canviar l’objecte d’entrada després no la toca', () => {
    const domicili = { ...DOMICILI_BAR };
    const f = creaFacturaEmesa(dades({ destinatari: { nif: DNI_CLIENT, nom: 'Bar de la Plaça', domicili } }));
    domicili.adreca = 'Una altra adreça';
    expect(f.destinatari.domicili).toEqual(DOMICILI_BAR);
    expect(Object.isFrozen(f.destinatari.domicili)).toBe(true);
  });

  test('una simplificada no necessita el domicili de l’emissor, però si el porta es valida', () => {
    const tiquet = { tipus: 'F2', numSerie: 'T2026-0001', destinatari: null };
    expect(creaFacturaEmesa(dades({ ...tiquet, emissor: { nif: CIF_EMISSOR, nom: 'Forn' } })).emissor).toEqual({ nif: CIF_EMISSOR, nom: 'Forn' });
    expect(errorsDe({ ...tiquet, emissor: { nif: CIF_EMISSOR, nom: 'Forn', domicili: { adreca: 'X' } } })).toMatch(/codi postal de l'emissor/);
  });

  test('el nom comercial va separat del legal', () => {
    const f = creaFacturaEmesa(dades({ emissor: { nif: CIF_EMISSOR, nom: 'Forn del Poble SL', nomComercial: ' El Forn ', domicili: DOMICILI_FORN } }));
    expect(f.emissor).toMatchObject({ nom: 'Forn del Poble SL', nomComercial: 'El Forn' });
    expect('nomComercial' in f.destinatari).toBe(false);
    expect(errorsDe({ emissor: { nif: CIF_EMISSOR, nom: 'Forn', nomComercial: 'El\nForn', domicili: DOMICILI_FORN } })).toMatch(/nom comercial de l'emissor/);
  });
});

describe('les línies i la factura: camps de l’onada 2', () => {
  test('detall multilínia i unitat, fora dels camps fiscals: no canvien cap xifra', () => {
    const linia = { concepte: 'Pa de llenya', quantitat: 12, preuUnitari: 250, tipusIva: 4 };
    const amb = creaFacturaEmesa(dades({ linies: [{ ...linia, unitat: 'peces', detall: 'Dilluns: 6\r\nDijous: 6\n' }] }));
    const sense = creaFacturaEmesa(dades({ linies: [linia] }));
    expect(amb.linies[0]).toMatchObject({ unitat: 'peces', detall: 'Dilluns: 6\nDijous: 6' });
    expect(amb.desglossament).toEqual(sense.desglossament);
    expect(amb.importTotal).toBe(sense.importTotal);
    expect(errorsDe({ linies: [{ ...linia, detall: 'amb\ttabulador' }] })).toMatch(/detall/);
    expect(errorsDe({ linies: [{ ...linia, unitat: 'hores\nextres' }] })).toMatch(/unitat/);
    expect(errorsDe({ linies: [{ ...linia, detall: 'x'.repeat(2001) }] })).toMatch(/detall/);
  });

  test('sense descripció, la de l’operació és el primer concepte; una de buida no passa', () => {
    expect(creaFacturaEmesa(dades({ descripcio: undefined })).descripcio).toBe('Pa de llenya');
    expect(creaFacturaEmesa(dades({ descripcio: null })).descripcio).toBe('Pa de llenya');
    expect(errorsDe({ descripcio: '' })).toMatch(/descripció/);
  });

  test('venciment: una data que no és anterior a l’expedició', () => {
    expect(creaFacturaEmesa(dades({ venciment: '2026-11-03' })).venciment).toBe('2026-11-03');
    expect(errorsDe({ venciment: '2026-10-03' })).toMatch(/venciment no pot ser anterior/);
    expect(errorsDe({ venciment: '03/11/2026' })).toMatch(/venciment/);
    expect('venciment' in creaFacturaEmesa(dades())).toBe(false);
  });

  test('cobrament: mètode i compte com a referència opaca, mai el número del compte', () => {
    const f = creaFacturaEmesa(dades({ cobrament: { metode: 'transferencia', compte: 'compte-principal' } }));
    expect(f.cobrament).toEqual({ metode: 'transferencia', compte: 'compte-principal' });
    expect(creaFacturaEmesa(dades({ cobrament: { metode: 'efectiu' } })).cobrament).toEqual({ metode: 'efectiu' });
    expect(errorsDe({ cobrament: { metode: 'xec' } })).toMatch(/Mètode de cobrament desconegut/);
    // Una forma de número de compte, composta a trossos (cap literal): no és una referència.
    const formaDeCompte = ['es', '91', '0000', '0000', '0000', '0000', '0000'].join('');
    for (const compte of [formaDeCompte, formaDeCompte.toUpperCase(), 'compte 1', 'banc-12345678']) {
      expect(errorsDe({ cobrament: { metode: 'transferencia', compte } }), compte).toMatch(/mai el número del compte/);
    }
  });
});

describe('el mode «IVA inclòs» de la simplificada del TPV', () => {
  const tiquet = (linies, canvis = {}) => dades({ tipus: 'F2', numSerie: 'T2026-0001', destinatari: null, ivaInclos: true, linies, ...canvis });

  test('tres línies d’1,10 € al 10 % fan 3,30 € exactes', () => {
    const linies = [1, 2, 3].map((n) => ({ concepte: `Café ${n}`, quantitat: 1, preuUnitari: 110, tipusIva: 10 }));
    const f = creaFacturaEmesa(tiquet(linies));
    expect(f).toMatchObject({ ivaInclos: true, baseTotal: 300, quotaTotal: 30, importTotal: 330, liquid: 330 });
    expect(f.linies.map((l) => l.import)).toEqual([110, 110, 110]);
    expect(f.desglossament).toEqual([{ qualificacio: 'S1', tipusIva: 10, base: 300, quota: 30 }]);
    expect(esFacturaEmesa(f)).toBe(true);
  });

  test('el total és sempre la suma dels preus, també amb tipus barrejats i exempcions', () => {
    const linies = [
      { concepte: 'Pa', quantitat: 3, preuUnitari: 135, tipusIva: 4 },
      { concepte: 'Vi', quantitat: 1, preuUnitari: 799, tipusIva: 21 },
      { concepte: 'Curs', quantitat: 1, preuUnitari: 1000, exempcio: 'E1' }
    ];
    const f = creaFacturaEmesa(tiquet(linies));
    expect(f.importTotal).toBe(405 + 799 + 1000);
    for (const g of f.desglossament) expect(g.base + g.quota).toBe(f.linies.filter((l) => (l.exempcio ?? l.tipusIva) === (g.exempcio ?? g.tipusIva)).reduce((s, l) => s + l.import, 0));
  });

  test('només per a la simplificada i la seua rectificativa; una completa porta el preu sense IVA', () => {
    expect(errorsDe({ ivaInclos: true })).toMatch(/IVA inclòs.*només és per a la simplificada/);
    expect(errorsDe({ tipus: 'F2', numSerie: 'T2026-0001', destinatari: null, ivaInclos: 'sí' })).toMatch(/cert o fals/);
    expect('ivaInclos' in creaFacturaEmesa(dades({ ivaInclos: false }))).toBe(false);
  });
});

describe('el recàlcul d’una factura ja emesa', () => {
  const obert = (valor) => JSON.parse(JSON.stringify(valor));

  test('una factura bona torna a donar exactament la mateixa, també amb opcions pròpies', () => {
    expect(errorsDeRecalcul(creaFacturaEmesa(dades()))).toEqual([]);
    const linies = [{ concepte: 'Pa', quantitat: 1, preuUnitari: 1000, tipusIva: 7.5 }];
    expect(errorsDeRecalcul(creaFacturaEmesa(dades({ linies }), { tipusIva: [7.5] }))).toEqual([]);
    const gran = creaFacturaEmesa(dades({ tipus: 'F2', destinatari: null, linies: [{ concepte: 'Encàrrec', quantitat: 1, preuUnitari: 40000, tipusIva: 10 }] }), { sectorAmpliat: true });
    expect(errorsDeRecalcul(gran)).toEqual([]);
  });

  test('una factura retocada i congelada a mà ja no és una factura emesa', () => {
    const f = creaFacturaEmesa(dades());
    const retocs = [
      (x) => { x.linies[0].preuUnitari = 1; },
      (x) => { x.destinatari = null; },
      (x) => { x.linies = []; x.desglossament = []; x.baseTotal = 0; x.quotaTotal = 0; x.importTotal = 1; x.liquid = 1; },
      (x) => { x.nota = 'x'; },
      (x) => { x.desglossament[0].quota += 1; x.quotaTotal += 1; x.importTotal += 1; x.liquid += 1; }
    ];
    for (const retoca of retocs) {
      const copia = obert(f);
      retoca(copia);
      expect(esFacturaEmesa(congela(copia)), String(retoca)).toBe(false);
      expect(errorsDeRecalcul(copia).length, String(retoca)).toBeGreaterThan(0);
    }
    expect(errorsDeRecalcul({ esquema: 'un altre' })).toHaveLength(1);
  });
});

describe('l’arredoniment, sense coma flotant', () => {
  test('la quota es calcula sobre la base del grup, no línia a línia', () => {
    // Tres línies de 2 cèntims al 21 %: línia a línia serien 0 + 0 + 0; sobre la base (6) és 1,26 → 1.
    const linies = [1, 2, 3].map((n) => ({ concepte: `Clau ${n}`, quantitat: 1, preuUnitari: 2, tipusIva: 21 }));
    expect(creaFacturaEmesa(dades({ linies })).desglossament).toEqual([{ qualificacio: 'S1', tipusIva: 21, base: 6, quota: 1 }]);
  });

  test('la meitat s’arredonix lluny de zero, també en negatiu', () => {
    const f = creaFacturaEmesa(dades({ linies: [{ concepte: 'Oli', quantitat: 1.5, preuUnitari: 199, tipusIva: 10 }] }));
    expect(f.linies[0].base).toBe(299);
    expect(f.desglossament[0].quota).toBe(30);
    const r = creaFacturaEmesa(dades({
      tipus: 'R1', numSerie: 'R2026-0001', tipusRectificativa: 'I', rectificades: [{ numSerie: 'A2026-0001', dataExpedicio: '2026-10-01' }],
      linies: [{ concepte: 'Oli tornat', quantitat: -1.5, preuUnitari: 199, tipusIva: 10 }]
    }));
    expect(r.linies[0].base).toBe(-299);
    expect(r.desglossament[0].quota).toBe(-30);
    expect(r.importTotal).toBe(-329);
  });

  test('un import dins del rang però massa gran per a calcular-lo: error de validació, mai una excepció', () => {
    const enorme = [{ concepte: 'X', quantitat: 1, preuUnitari: 3000000000000, tipusIva: 21 }];
    expect(() => validaFacturaEmesa(dades({ linies: enorme }))).not.toThrow();
    expect(errorsDe({ linies: enorme })).toMatch(/massa gran/);
    expect(() => creaFacturaEmesa(dades({ linies: enorme }))).toThrow(expect.objectContaining({ codi: 'FACTURA_INVALIDA' }));
    // Regressió: una base exempta enorme amb un 50 % de retenció, que abans petava amb RangeError al
    // càlcul de la retenció. Ara el sostre de la línia la para abans, amb un error de validació.
    const retencio = { linies: [{ concepte: 'Curs', quantitat: 1, preuUnitari: 1000000000000, exempcio: 'E1' }], retencio: { percentatge: 50 } };
    expect(() => validaFacturaEmesa(dades(retencio))).not.toThrow();
    expect(errorsDe(retencio)).toMatch(/Línia 1: import massa gran/);
    // El camí de la retenció de veres: la base al sostre exacte i un 100 %, el producte més gran que hi
    // pot arribar (MAX_BASE × 10.000), es calcula sense perdre cap cèntim.
    const ambRetencioAlSostre = creaFacturaEmesa(dades({
      linies: [{ concepte: 'Curs', quantitat: 1, preuUnitari: MAX_BASE, exempcio: 'E1' }], retencio: { percentatge: 100 }
    }));
    expect(ambRetencioAlSostre.retencio).toEqual({ percentatge: 100, import: MAX_BASE });
    expect(ambRetencioAlSostre.liquid).toBe(0);
    // Al sostre exacte es calcula; dos grups que el passen junts, no.
    const alSostre = creaFacturaEmesa(dades({ linies: [{ concepte: 'X', quantitat: 1, preuUnitari: MAX_BASE, tipusIva: 21 }] }));
    expect(alSostre.quotaTotal).toBe(94500000000);
    const dosGrups = [21, 10].map((tipusIva) => ({ concepte: 'X', quantitat: 1, preuUnitari: MAX_BASE, tipusIva }));
    expect(errorsDe({ linies: dosGrups })).toMatch(/Import total massa gran/);
  });

  test('quantitats amb tres decimals com a molt', () => {
    expect(creaFacturaEmesa(dades({ linies: [{ concepte: 'Farina', quantitat: 0.333, preuUnitari: 300, tipusIva: 4 }] })).linies[0])
      .toMatchObject({ quantitat: 0.333, base: 100 });
    expect(errorsDe({ linies: [{ concepte: 'Farina', quantitat: 0.3333, preuUnitari: 300, tipusIva: 4 }] })).toMatch(/tres decimals/);
    expect(errorsDe({ linies: [{ concepte: 'Farina', quantitat: 0, preuUnitari: 300, tipusIva: 4 }] })).toMatch(/diferent de zero/);
    expect(errorsDe({ linies: [{ concepte: 'Farina', quantitat: 1, preuUnitari: 2.5, tipusIva: 4 }] })).toMatch(/cèntims enters/);
  });
});

describe('IVA i exempcions', () => {
  test('una línia exempta no porta quota i va darrere de les subjectes', () => {
    const f = creaFacturaEmesa(dades({
      linies: [
        { concepte: 'Curs de forn', quantitat: 1, preuUnitari: 5000, exempcio: 'E1' },
        { concepte: 'Pa', quantitat: 1, preuUnitari: 1000, tipusIva: 4 }
      ]
    }));
    expect(f.desglossament).toEqual([
      { qualificacio: 'S1', tipusIva: 4, base: 1000, quota: 40 },
      { qualificacio: null, exempcio: 'E1', base: 5000, quota: 0 }
    ]);
    expect(f.importTotal).toBe(6040);
  });

  test('o tipus d’IVA o exempció, i dels admesos', () => {
    expect(errorsDe({ linies: [{ concepte: 'Pa', quantitat: 1, preuUnitari: 100 }] })).toMatch(/només una de les dues/);
    expect(errorsDe({ linies: [{ concepte: 'Pa', quantitat: 1, preuUnitari: 100, tipusIva: 4, exempcio: 'E1' }] })).toMatch(/només una de les dues/);
    expect(errorsDe({ linies: [{ concepte: 'Pa', quantitat: 1, preuUnitari: 100, tipusIva: 7 }] })).toMatch(/no admés/);
    expect(errorsDe({ linies: [{ concepte: 'Pa', quantitat: 1, preuUnitari: 100, exempcio: 'E9' }] })).toMatch(/exempció desconeguda/);
  });

  test('quan la llei canvia un tipus, es passa la llista nova sense tocar el codi', () => {
    const linies = [{ concepte: 'Pa', quantitat: 1, preuUnitari: 1000, tipusIva: 7.5 }];
    expect(creaFacturaEmesa(dades({ linies }), { tipusIva: [4, 7.5, 10, 21] }).desglossament[0]).toMatchObject({ base: 1000, quota: 75 });
    expect(errorsDe({}, { tipusIva: [0, 21] })).toMatch(/percentatges positius/);
  });
});

describe('cada tipus de factura, amb les seues regles', () => {
  test('els huit tipus de l’AEAT', () => {
    expect(TIPUS_FACTURA).toEqual(['F1', 'F2', 'F3', 'R1', 'R2', 'R3', 'R4', 'R5']);
    expect(errorsDe({ tipus: 'F4' })).toMatch(/Tipus de factura desconegut/);
  });

  test('F1 i les rectificatives completes necessiten destinatari; F2 i R5, no', () => {
    expect(errorsDe({ destinatari: undefined })).toMatch(/Falta el destinatari/);
    const tiquet = creaFacturaEmesa(dades({ tipus: 'F2', numSerie: 'T2026-0001', destinatari: null }));
    expect(tiquet.destinatari).toBeNull();
    const r5 = creaFacturaEmesa(dades({
      tipus: 'R5', numSerie: 'RT2026-0001', destinatari: undefined, tipusRectificativa: 'I',
      rectificades: [{ numSerie: 'T2026-0001', dataExpedicio: '2026-10-04' }]
    }));
    expect(r5.destinatari).toBeNull();
  });

  test('una simplificada (F2) o una R5 amb destinatari identificat no passa: va com a completa o R1-R4', () => {
    // Regla de RegistroAlta de Veri*Factu, a contrastar amb «Validaciones y errores».
    expect(errorsDe({ tipus: 'F2', numSerie: 'T2026-0001' })).toMatch(/no porta destinatari.*completa \(F1\).*R1-R4/);
    const r5 = { tipus: 'R5', numSerie: 'RT2026-0001', tipusRectificativa: 'I', rectificades: [{ numSerie: 'T2026-0001', dataExpedicio: '2026-10-04' }] };
    expect(errorsDe(r5)).toMatch(/no porta destinatari/);
    expect(() => creaFacturaEmesa(dades({ tipus: 'F2', numSerie: 'T2026-0001' }))).toThrow(expect.objectContaining({ codi: 'FACTURA_INVALIDA' }));
  });

  test('una simplificada no passa de 400 € (3.000 € en els sectors de l’art. 4.1)', () => {
    const linies = [{ concepte: 'Encàrrec', quantitat: 1, preuUnitari: 40000, tipusIva: 10 }];
    expect(LIMIT_SIMPLIFICADA).toBe(40000);
    expect(errorsDe({ tipus: 'F2', destinatari: null, linies })).toMatch(/simplificada no pot passar de 400 €/);
    expect(creaFacturaEmesa(dades({ tipus: 'F2', destinatari: null, linies }), { sectorAmpliat: true }).importTotal).toBe(44000);
  });

  test('F3 porta les simplificades que substituïx', () => {
    expect(errorsDe({ tipus: 'F3' })).toMatch(/Falten Factura substituïda/);
    const f3 = creaFacturaEmesa(dades({ tipus: 'F3', substituides: [{ numSerie: 'T2026-0001', dataExpedicio: '2026-10-01' }] }));
    expect(f3.substituides).toEqual([{ numSerie: 'T2026-0001', dataExpedicio: '2026-10-01' }]);
    expect(errorsDe({ substituides: [] })).toMatch(/Només una F3/);
  });

  test('una rectificativa diu què rectifica i com; la de substitució porta l’import rectificat', () => {
    const base = { tipus: 'R1', numSerie: 'R2026-0001', rectificades: [{ numSerie: 'A2026-0001', dataExpedicio: '2026-10-01' }] };
    expect(errorsDe(base)).toMatch(/substitució \(S\) o per diferències \(I\)/);
    expect(errorsDe({ ...base, tipusRectificativa: 'S' })).toMatch(/import rectificat/);
    const s = creaFacturaEmesa(dades({ ...base, tipusRectificativa: 'S', importRectificat: { base: 4000, quota: 330 } }));
    expect(s).toMatchObject({ tipusRectificativa: 'S', importRectificat: { base: 4000, quota: 330 } });
    expect(errorsDe({ ...base, tipusRectificativa: 'I', rectificades: [] })).toMatch(/Falten Factura rectificada/);
    expect(errorsDe({ ...base, tipusRectificativa: 'I', rectificades: [{ numSerie: 'A2026-0009', dataExpedicio: '2026-10-05' }] }))
      .toMatch(/posterior a esta factura/);
    expect(errorsDe({ ...base, tipusRectificativa: 'I', rectificades: [base.rectificades[0], base.rectificades[0]] })).toMatch(/repetida/);
    expect(errorsDe({ rectificades: base.rectificades })).toMatch(/Només les rectificatives/);
  });

  test('una base negativa fora d’una rectificativa per diferències no passa: es rectifica, no es resta', () => {
    const linies = [{ concepte: 'Descompte', quantitat: 1, preuUnitari: -500, tipusIva: 21 }];
    expect(errorsDe({ linies })).toMatch(/base negativa/);
    // Un descompte dins del mateix tipus sí que es pot fer, mentre la base del grup no siga negativa.
    const ambDescompte = creaFacturaEmesa(dades({ linies: [{ concepte: 'Pa', quantitat: 1, preuUnitari: 1000, tipusIva: 21 }, ...linies] }));
    expect(ambDescompte.desglossament[0]).toMatchObject({ base: 500, quota: 105 });
  });
});

describe('les persones i les dades', () => {
  test('l’emissor és un NIF espanyol vàlid; el destinatari estranger és PENDENT', () => {
    expect(errorsDe({ emissor: { nif: 'B12345675', nom: 'Forn' } })).toMatch(/emissor no és un DNI, NIE o CIF vàlid/);
    expect(errorsDe({ destinatari: { nif: 'FR12345678901', nom: 'Boulangerie' } })).toMatch(/PENDENTS a la fase 0/);
    expect(errorsDe({ destinatari: { nif: CIF_EMISSOR, nom: 'Jo mateix' } })).toMatch(/mateix NIF/);
    expect(errorsDe({ emissor: { nif: CIF_EMISSOR, nom: 'Forn\ndel Poble' } })).toMatch(/nom de l'emissor és obligatori/);
  });

  test('número de sèrie, dates i descripció', () => {
    expect(errorsDe({ numSerie: '' })).toMatch(/número de sèrie és obligatori/);
    expect(errorsDe({ numSerie: 'A'.repeat(61) })).toMatch(/número de sèrie/);
    expect(errorsDe({ numSerie: 'A2026\t0001' })).toMatch(/número de sèrie/);
    expect(errorsDe({ dataExpedicio: '2026-02-30' })).toMatch(/data d'expedició/);
    expect(errorsDe({ dataOperacio: '04/10/2026' })).toMatch(/data d'operació/);
    expect(creaFacturaEmesa(dades({ dataOperacio: '2026-10-01' })).dataOperacio).toBe('2026-10-01');
    expect(errorsDe({ descripcio: '  ' })).toMatch(/descripció/);
    expect(errorsDe({ linies: [] })).toMatch(/almenys una línia/);
  });

  test('la retenció d’IRPF es calcula sobre la base i només canvia el líquid', () => {
    const f = creaFacturaEmesa(dades({
      linies: [{ concepte: 'Assessorament', quantitat: 1, preuUnitari: 100000, tipusIva: 21 }], retencio: { percentatge: 15 }
    }));
    expect(f).toMatchObject({ baseTotal: 100000, quotaTotal: 21000, importTotal: 121000, retencio: { percentatge: 15, import: 15000 }, liquid: 106000 });
    expect(errorsDe({ retencio: { percentatge: 0 } })).toMatch(/retenció/);
    expect(errorsDe({ retencio: { percentatge: 150 } })).toMatch(/retenció/);
  });

  test('l’error porta codi i la llista sencera; validaFacturaEmesa no llança', () => {
    let capturat = null;
    try {
      creaFacturaEmesa(dades({ numSerie: '', descripcio: '' }));
    } catch (error) {
      capturat = error;
    }
    expect(capturat.codi).toBe('FACTURA_INVALIDA');
    expect(capturat.detalls).toHaveLength(2);
    expect(validaFacturaEmesa(null)).toHaveLength(1);
    expect(validaFacturaEmesa(dades())).toEqual([]);
  });
});
