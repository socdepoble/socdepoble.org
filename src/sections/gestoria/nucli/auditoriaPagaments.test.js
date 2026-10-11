// @vitest-environment node
/* Onada 12 (261011; ordres 261011_0130, punt 6). L'auditoria de pagaments amb
   un trimestre sintètic (any 2099, empreses i números inventats): les cinc
   preguntes de l'ordre, el resum del full i els talls exactes dels trimestres
   2n, 3r i 4t. */
import { describe, expect, test } from 'vitest';
import { CODIS_PAGAMENTS, MOTIUS_DUPLICAT, auditaPagaments, informePagaments } from './auditoriaPagaments.js';
import { rangTrimestre } from './dates.js';
import { crearFactura } from './model.js';

const D = (a, m, d) => ({ a, m, d });
const CIF = ['A1234', '5674'].join('');
const factura = (parcial) => crearFactura({ contrapart: 'Empresa Sintetica SL', nif: CIF, descripcio: 'Prova', ...parcial });
let linia = 0;
/* Un moviment amb la forma de la Norma 43 que entén la conciliació. */
const moviment = (data, centims, text) => {
  linia += 1;
  return { linia, dataOperacio: data, dataValor: data, centims, conceptComu: '', conceptes: [{ codi: '01', camps: [text, ''] }] };
};
const codis = (auditoria) => auditoria.incidencies.map((i) => i.codi);

const E1 = factura({ tipus: 'ingres', data: D(2099, 7, 1), num: 'F99-0001', subtotal: 100000, iva: 21000, total: 121000 });
const E2 = factura({ tipus: 'ingres', data: D(2099, 9, 30), num: 'F99-0002', subtotal: 50000, iva: 10500, total: 60500 });
const D1 = factura({ data: D(2099, 7, 10), num: 'PRV-1001', subtotal: 10000, iva: 2100, total: 12100 });
const D2 = factura({ data: D(2099, 7, 15), num: 'PRV-2002', subtotal: 4132, iva: 868, total: 5000 });
const D3 = factura({ data: D(2099, 10, 1), num: 'PRV-3003', subtotal: 2000, iva: 420, total: 2420 });
const FULL_3T = { any: 2099, t: 3, ingressos: [E1, E2], despeses: [D1, D2, D3] };

const COBRAMENT_E1 = moviment(D(2099, 7, 5), 121000, 'TRANSFERENCIA REBUDA F99-0001');
const PAGAMENT_D1 = moviment(D(2099, 7, 12), -12100, 'PAGO FACTURA PRV-1001 SUBMINISTRES');
const PAGAMENT_D2 = moviment(D(2099, 7, 16), -5500, 'PAGO FACTURA PRV-2002 TALLER');
const SEGON_D1 = moviment(D(2099, 8, 20), -12100, 'PAGO FACTURA PRV-1001 SUBMINISTRES');
const BAR_1 = moviment(D(2099, 9, 30), -4500, 'COMPRA BAR SINTETIC');
const BAR_2 = moviment(D(2099, 9, 30), -4500, 'COMPRA BAR SINTETIC');
const DE_JUNY = moviment(D(2099, 6, 30), -700, 'QUOTA DE JUNY');
const D_OCTUBRE = moviment(D(2099, 10, 1), -999, 'QUOTA D OCTUBRE');
const MOVIMENTS = [DE_JUNY, COBRAMENT_E1, PAGAMENT_D1, PAGAMENT_D2, SEGON_D1, BAR_1, BAR_2, D_OCTUBRE];

describe('les cinc preguntes de l’ordre, en un trimestre', () => {
  const auditoria = auditaPagaments({ fulls: [FULL_3T], moviments: MOVIMENTS });
  const [q] = auditoria.trimestres;

  test('un trimestre amb el seu rang exacte', () => {
    expect(auditoria.trimestres).toHaveLength(1);
    expect(q).toMatchObject({ any: 2099, t: 3, deduit: false, rang: { inici: D(2099, 7, 1), fi: D(2099, 9, 30) } });
  });

  test('factures emeses sense cobrament casat', () => {
    expect(q.emesesSenseCobrament).toEqual([E2]);
    expect(auditoria.incidencies.find((i) => i.codi === 'EMESA_SENSE_COBRAMENT')).toMatchObject({ severitat: 'mitjana', any: 2099, t: 3, facturaId: E2.id });
  });

  test('despeses del banc sense factura: només les del trimestre, i també el segon pagament d’una factura (no se’n lleva mai cap)', () => {
    expect(q.despesesSenseFactura).toEqual([SEGON_D1, BAR_1, BAR_2]);
    expect(q.ingressosSenseFactura).toEqual([]);
    expect(q.resum.movimentsDelBanc).toBe(6);
  });

  test('pagaments duplicats: la factura pagada dues vegades i els dos càrrecs iguals del mateix dia', () => {
    expect(q.duplicats).toEqual([
      { motiu: 'FACTURA_JA_PAGADA', severitat: 'mitjana', moviments: [PAGAMENT_D1, SEGON_D1], factures: [D1] },
      { motiu: 'MATEIXOS_DIES', severitat: 'baixa', moviments: [BAR_1, BAR_2], factures: [] }
    ]);
    for (const d of q.duplicats) expect(MOTIUS_DUPLICAT).toContain(d.motiu);
    expect(codis(auditoria).filter((c) => c === 'PAGAMENT_DUPLICAT')).toHaveLength(2);
  });

  test('imports que no quadren entre la factura i el moviment', () => {
    expect(q.importsQueNoQuadren).toHaveLength(1);
    expect(q.importsQueNoQuadren[0]).toMatchObject({ moviments: [PAGAMENT_D2], factures: [D2], diferencia: -500 });
    expect(auditoria.incidencies.find((i) => i.codi === 'IMPORT_NO_QUADRA').missatge).toContain('-5,00 €');
  });

  test('factures fora del trimestre del seu full, i rebudes sense pagament', () => {
    expect(q.foraDeTrimestre).toEqual([D3]);
    expect(q.rebudesSensePagament).toEqual([D3]);
    expect(auditoria.incidencies.find((i) => i.codi === 'FORA_TRIMESTRE').missatge).toContain('01/10/2099');
    expect(auditoria.incidencies.find((i) => i.codi === 'REBUDA_SENSE_PAGAMENT')).toMatchObject({ severitat: 'baixa' });
  });

  test('el resum del full: ingressos, despeses, IVA repercutit i suportat, retencions i resultat, al cèntim', () => {
    expect(q.resum).toEqual({
      ingressos: { factures: 2, base: 150000, iva: 31500, total: 181500, incomplet: false },
      despeses: { factures: 3, base: 16132, iva: 3388, total: 19520, incomplet: false },
      ivaRepercutit: 31500,
      ivaSuportat: 3388,
      diferenciaIva: 28112,
      retencions: 0,
      retencionsDeduides: 0,
      retencionsDesconegudes: 0,
      resultat: 133868,
      incomplet: false,
      cobrat: 121000,
      pendentDeCobrar: 60500,
      pagat: 17600,
      pendentDePagar: 2420,
      movimentsDelBanc: 6
    });
  });

  test('cada incidència porta un codi del catàleg, i van en l’ordre del catàleg', () => {
    const ordre = codis(auditoria).map((c) => CODIS_PAGAMENTS.indexOf(c));
    expect(ordre.every((n) => n >= 0)).toBe(true);
    expect(ordre).toEqual([...ordre].sort((x, y) => x - y));
  });

  test('res del que rep es modifica i el resultat no depén de l’ordre dels moviments', () => {
    const copia = JSON.stringify([FULL_3T, MOVIMENTS]);
    const alReves = auditaPagaments({ fulls: [FULL_3T], moviments: [...MOVIMENTS].reverse() });
    expect(JSON.stringify([FULL_3T, MOVIMENTS])).toBe(copia);
    expect(alReves.trimestres[0].resum).toEqual(q.resum);
    expect(codis(alReves)).toEqual(codis(auditoria));
  });

  test('l’informe en text diu el resum i cada llista', () => {
    const text = informePagaments(auditoria).join('\n');
    expect(text).toContain('── 3T de 2099 (01/07/2099 - 30/09/2099) ──');
    expect(text).toContain('Ingressos: 1.500,00 € de base, 315,00 € d’IVA repercutit i 1.815,00 € de total (2 factures).');
    expect(text).toContain('Resultat (base dels ingressos menys base de les despeses): 1.338,68 €.');
    expect(text).toContain('Factures emeses sense cobrament (1):');
    expect(text).toContain('- 30/09/2099 · «F99-0002» · 605,00 €');
    expect(text).toContain('Eixides del banc sense factura (3):');
    expect(text.startsWith('ATENCIÓ: açò és una ajuda per a revisar, no un veredicte.')).toBe(true);
    expect(text).toContain('Possibles pagaments duplicats (2):');
    expect(text).toContain('Imports que no quadren (1):');
    expect(text).toContain('Factures amb la data fora del trimestre (1):');
    const senseBanc = informePagaments(auditoria, { ambBanc: false }).join('\n');
    expect(senseBanc).toContain('IVA repercutit menys suportat: 281,12 €');
    expect(senseBanc).not.toContain('Banc:');
  });
});

/* Correccions 261011 (refutador adversari): cada prova era roja abans del canvi. */
describe('correccions del refutador', () => {
  test('punt 1 · una quota mensual SENSE factura no és el «segon pagament» de la del mes anterior, i continua sent una eixida sense factura', () => {
    const quotaAbril = factura({ data: D(2099, 4, 1), num: 'Q-2099-04', subtotal: 1000, iva: 210, total: 1210 });
    const rebutAbril = moviment(D(2099, 4, 5), -1210, 'REBUT QUOTA SERVEI SINTETIC');
    const rebutMaig = moviment(D(2099, 5, 5), -1210, 'REBUT QUOTA SERVEI SINTETIC');
    const auditoria = auditaPagaments({ fulls: [{ any: 2099, t: 2, factures: [quotaAbril] }], moviments: [rebutAbril, rebutMaig] });
    expect(auditoria.conciliacio.parelles).toEqual([expect.objectContaining({ moviments: [rebutAbril], factures: [quotaAbril] })]);
    expect(auditoria.duplicats).toEqual([]);
    expect(auditoria.trimestres[0].despesesSenseFactura).toEqual([rebutMaig]);
    expect(codis(auditoria)).toEqual(['DESPESA_SENSE_FACTURA']);
  });

  test('punt 1 · igual amb un client que paga una iguala i falta la factura emesa: és una entrada sense factura', () => {
    const iguala = factura({ tipus: 'ingres', data: D(2099, 4, 1), num: 'F99-0100', subtotal: 50000, iva: 10500, total: 60500 });
    const cobraments = [moviment(D(2099, 4, 3), 60500, 'TRANSFERENCIA CLIENT SINTETIC IGUALA'), moviment(D(2099, 5, 3), 60500, 'TRANSFERENCIA CLIENT SINTETIC IGUALA')];
    const [q] = auditaPagaments({ fulls: [{ any: 2099, t: 2, factures: [iguala] }], moviments: cobraments }).trimestres;
    expect(q.duplicats).toEqual([]);
    expect(q.ingressosSenseFactura).toEqual([cobraments[1]]);
  });

  test('punt 1 · el segon pagament que SÍ que cita la factura és un indici de duplicat, i no desapareix de les eixides sense factura', () => {
    const [q] = auditaPagaments({ fulls: [FULL_3T], moviments: MOVIMENTS }).trimestres;
    expect(q.duplicats[0]).toMatchObject({ motiu: 'FACTURA_JA_PAGADA', moviments: [PAGAMENT_D1, SEGON_D1] });
    expect(q.despesesSenseFactura).toContain(SEGON_D1);
  });

  test('punt 4 · sense camp de retenció (el full CSV no en té), es deduïx de base + IVA − total quan és un tipus habitual', () => {
    const emesa = factura({ tipus: 'ingres', data: D(2099, 7, 1), num: 'F99-0020', subtotal: 100000, iva: 21000, total: 106000 });
    const sense = factura({ tipus: 'ingres', data: D(2099, 7, 2), num: 'F99-0021', subtotal: 50000, iva: 10500, total: 60500 });
    expect(emesa).not.toHaveProperty('retencio');
    const auditoria = auditaPagaments({ fulls: [{ any: 2099, t: 3, factures: [emesa, sense] }] });
    expect(auditoria.trimestres[0].resum).toMatchObject({ retencions: 15000, retencionsDeduides: 1 });
    expect(informePagaments(auditoria).join('\n')).toContain('Retencions d’IRPF a les factures emeses: 150,00 € (deduïdes de base + IVA − total en una factura: el full no té columna de retenció).');
  });

  test('punt 4 · si una factura no quadra i la diferència no és cap retenció habitual, no es diu «0,00 €»: no es pot saber', () => {
    const rara = factura({ tipus: 'ingres', data: D(2099, 7, 1), num: 'F99-0030', subtotal: 100000, iva: 21000, total: 118000 });
    const auditoria = auditaPagaments({ fulls: [{ any: 2099, t: 3, factures: [rara] }] });
    expect(auditoria.trimestres[0].resum).toMatchObject({ retencions: null, retencionsDeduides: 0 });
    const text = informePagaments(auditoria).join('\n');
    expect(text).not.toContain('Retencions d’IRPF a les factures emeses: 0,00 €');
    expect(text).toContain('Retencions d’IRPF: no es poden saber');
  });

  test('punt 5 · el mateix full dues vegades no dobla la base, l’IVA ni el resultat, i ho avisa', () => {
    const copia = () => [
      factura({ tipus: 'ingres', data: D(2099, 7, 1), num: 'F99-0001', subtotal: 100000, iva: 21000, total: 121000 }),
      factura({ data: D(2099, 7, 10), num: 'PRV-1001', subtotal: 10000, iva: 2100, total: 12100 })
    ];
    const auditoria = auditaPagaments({ fulls: [{ any: 2099, t: 3, factures: copia() }, { any: 2099, t: 3, factures: copia() }] });
    expect(auditoria.trimestres[0].resum).toMatchObject({ ivaRepercutit: 21000, ivaSuportat: 2100, resultat: 90000 });
    expect(auditoria.trimestres[0].resum.ingressos.factures).toBe(1);
    expect(auditoria.incidencies[0]).toMatchObject({ codi: 'FACTURA_REPETIDA', severitat: 'mitjana', any: 2099, t: 3 });
    expect(codis(auditoria).filter((c) => c === 'EMESA_SENSE_COBRAMENT')).toHaveLength(1);
  });

  test('punt 6 · una factura de 1.000 € cobrada i un abonament de 200 € tornat fan 800 € cobrats, no 1.200', () => {
    const emesa = factura({ tipus: 'ingres', data: D(2099, 7, 1), num: 'F99-0040', subtotal: 82645, iva: 17355, total: 100000 });
    const abonament = factura({ tipus: 'ingres', data: D(2099, 7, 8), num: 'R99-0040', subtotal: -16529, iva: -3471, total: -20000, abonament: true });
    const moviments = [moviment(D(2099, 7, 3), 100000, 'TRANSFERENCIA REBUDA F99-0040'), moviment(D(2099, 7, 9), -20000, 'DEVOLUCIO ABONAMENT R99-0040')];
    const [q] = auditaPagaments({ fulls: [{ any: 2099, t: 3, factures: [emesa, abonament] }], moviments }).trimestres;
    expect(q.emesesSenseCobrament).toEqual([]);
    expect(q.resum).toMatchObject({ cobrat: 80000, pagat: 0, pendentDeCobrar: 0 });
  });

  test('punt 6 · un moviment que paga dues factures de dos trimestres es repartix: a cada trimestre, la seua part', () => {
    const delSegon = factura({ data: D(2099, 6, 30), num: 'AA-0001', subtotal: 1000, iva: 210, total: 1210 });
    const delTercer = factura({ data: D(2099, 7, 1), num: 'AA-0002', subtotal: 2000, iva: 420, total: 2420 });
    const pagament = moviment(D(2099, 7, 2), -3630, 'PAGO FACTURAS AA-0001 AA-0002');
    const auditoria = auditaPagaments({ fulls: [{ any: 2099, t: 2, factures: [delSegon] }, { any: 2099, t: 3, factures: [delTercer] }], moviments: [pagament] });
    expect(auditoria.conciliacio.parelles).toEqual([expect.objectContaining({ regla: 'R4', moviments: [pagament] })]);
    expect(auditoria.trimestres.map((q) => q.resum.pagat)).toEqual([1210, 2420]);
  });

  test('punt 9 · amb el trimestre deduït per majoria, la factura d’un altre trimestre es denuncia i el full té resum', () => {
    const auditoria = auditaPagaments({ fulls: [{ ingressos: [E1], despeses: [D1, D3] }] });
    expect(auditoria.trimestres).toHaveLength(1);
    expect(auditoria.trimestres[0]).toMatchObject({ any: 2099, t: 3, deduit: true, foraDeTrimestre: [D3] });
    expect(codis(auditoria)).toContain('FORA_TRIMESTRE');
    expect(codis(auditoria)).not.toContain('TRIMESTRE_INVALID');
  });
});

describe('entre trimestres', () => {
  test('una factura del 3T cobrada el 2 d’octubre fa parella i s’informa: compta per a la caixa del 4T', () => {
    const cobrament = moviment(D(2099, 10, 2), 60500, 'TRANSFERENCIA REBUDA F99-0002');
    const auditoria = auditaPagaments({ fulls: [FULL_3T], moviments: [...MOVIMENTS, cobrament] });
    const [q] = auditoria.trimestres;
    expect(q.emesesSenseCobrament).toEqual([]);
    expect(q.pagamentsEnAltreTrimestre).toHaveLength(1);
    expect(q.resum).toMatchObject({ cobrat: 181500, pendentDeCobrar: 0, movimentsDelBanc: 6 });
    expect(auditoria.incidencies.find((i) => i.codi === 'PAGAMENT_EN_ALTRE_TRIMESTRE')).toMatchObject({ severitat: 'info' });
  });

  test('els talls del 2n, 3r i 4t trimestre: l’últim dia hi entra i el primer del següent, no', () => {
    const dies = [D(2099, 3, 31), D(2099, 4, 1), D(2099, 6, 30), D(2099, 7, 1), D(2099, 9, 30), D(2099, 10, 1), D(2099, 12, 31), D(2100, 1, 1)];
    const moviments = dies.map((dia, i) => moviment(dia, -(1000 + i), `CARREC ${i}`));
    const fulls = [2, 3, 4].map((t) => {
      const { inici, fi } = rangTrimestre(2099, t);
      return {
        any: 2099, t,
        ingressos: [factura({ tipus: 'ingres', data: inici, num: `T${t}-0001`, subtotal: 1000, iva: 210, total: 1210 })],
        despeses: [factura({ data: fi, num: `P${t}-0001`, subtotal: 500, iva: 105, total: 605 })]
      };
    });
    const auditoria = auditaPagaments({ fulls, moviments });
    expect(auditoria.trimestres.map((q) => [q.t, q.rang.inici, q.rang.fi, q.resum.movimentsDelBanc, q.foraDeTrimestre.length])).toEqual([
      [2, D(2099, 4, 1), D(2099, 6, 30), 2, 0],
      [3, D(2099, 7, 1), D(2099, 9, 30), 2, 0],
      [4, D(2099, 10, 1), D(2099, 12, 31), 2, 0]
    ]);
    expect(auditoria.trimestres.map((q) => q.despesesSenseFactura.map((m) => m.dataOperacio))).toEqual([
      [D(2099, 4, 1), D(2099, 6, 30)], [D(2099, 7, 1), D(2099, 9, 30)], [D(2099, 10, 1), D(2099, 12, 31)]
    ]);
    for (const q of auditoria.trimestres) expect(q.resum).toMatchObject({ ivaRepercutit: 210, ivaSuportat: 105, resultat: 500 });
  });

  test('una factura datada l’1 de juliol dins del full del 2T és fora del trimestre; la del 30 de juny, no', () => {
    const full = {
      any: 2099, t: 2, ingressos: [],
      despeses: [
        factura({ data: D(2099, 6, 30), num: 'P-0001', subtotal: 500, iva: 105, total: 605 }),
        factura({ data: D(2099, 7, 1), num: 'P-0002', subtotal: 500, iva: 105, total: 605 })
      ]
    };
    expect(auditaPagaments({ fulls: [full] }).trimestres[0].foraDeTrimestre.map((f) => f.num)).toEqual(['P-0002']);
  });
});

describe('els fulls', () => {
  test('un full sense any ni trimestre pren el de les dates de les factures, i ho diu', () => {
    const auditoria = auditaPagaments({ fulls: [{ any: null, t: null, ingressos: [E1], despeses: [D1] }], moviments: [] });
    expect(auditoria.trimestres[0]).toMatchObject({ any: 2099, t: 3, deduit: true });
    expect(informePagaments(auditoria).join('\n')).toContain('trimestre deduït de les dates de les factures');
  });

  test('si les dates són de dos trimestres, no s’inventa cap: s’avisa i no entra a cap resum', () => {
    const auditoria = auditaPagaments({ fulls: [{ ingressos: [E1], despeses: [D3] }], moviments: [COBRAMENT_E1] });
    expect(auditoria.trimestres).toEqual([]);
    expect(codis(auditoria)).toEqual(['TRIMESTRE_INVALID']);
    expect(auditoria.conciliacio.parelles).toHaveLength(1);
  });

  test('dos fulls del mateix trimestre s’ajunten; sense fulls ni moviments no hi ha res', () => {
    const auditoria = auditaPagaments({ fulls: [{ any: 2099, t: 3, factures: [E1] }, { any: 2099, t: 3, factures: [D1] }] });
    expect(auditoria.trimestres).toHaveLength(1);
    expect(auditoria.trimestres[0].resum).toMatchObject({ ivaRepercutit: 21000, ivaSuportat: 2100 });
    expect(auditaPagaments()).toEqual({ conciliacio: expect.any(Object), trimestres: [], duplicats: [], incidencies: [] });
  });

  test('la retenció d’una rectificativa resta: una factura i el seu abonament deixen les retencions a zero', () => {
    const emesa = factura({ tipus: 'ingres', data: D(2099, 7, 1), num: 'F99-0010', subtotal: 100000, iva: 21000, retencio: 15000, total: 106000 });
    const abonament = factura({ tipus: 'ingres', data: D(2099, 7, 2), num: 'R99-0001', subtotal: -100000, iva: -21000, retencio: 15000, total: -106000, abonament: true });
    const { resum } = auditaPagaments({ fulls: [{ any: 2099, t: 3, factures: [emesa, abonament] }] }).trimestres[0];
    expect(resum).toMatchObject({ retencions: 0, ivaRepercutit: 0, resultat: 0 });
  });

  test('una factura en una altra moneda no se suma, i el resum ho diu', () => {
    const dolars = factura({ data: D(2099, 7, 3), num: 'USD-0001', subtotal: 1000, iva: 0, total: 1000, moneda: 'USD' });
    const { resum } = auditaPagaments({ fulls: [{ any: 2099, t: 3, factures: [D1, dolars] }] }).trimestres[0];
    expect(resum.despeses).toMatchObject({ factures: 2, base: 10000, incomplet: true });
    expect(resum.incomplet).toBe(true);
  });

  test('dos pagaments iguals de dues factures diferents no són cap duplicat', () => {
    const quotes = [1, 2].map((n) => factura({ data: D(2099, 7, n), num: `QUOTA-000${n}`, subtotal: 1000, iva: 210, total: 1210 }));
    const pagaments = [1, 2].map((n) => moviment(D(2099, 7, n + 1), -1210, `REBUT QUOTA-000${n} SERVEI`));
    const auditoria = auditaPagaments({ fulls: [{ any: 2099, t: 3, factures: quotes }], moviments: pagaments });
    expect(auditoria.conciliacio.parelles).toHaveLength(2);
    expect(auditoria.duplicats).toEqual([]);
  });
});
