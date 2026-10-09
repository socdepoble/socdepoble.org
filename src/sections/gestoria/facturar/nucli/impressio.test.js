// @vitest-environment node
/* La factura en paper (Onada 6, 261009). Les factures s'emeten de veres amb
   el cas d'ús d'emissió sobre un port en memòria, i del registre d'alta es
   trau el model imprés: les mencions de la completa, la simplificada, la F3 i
   les rectificatives (art. 6, 7 i 15 del RD 1619/2012), la retenció d'IRPF,
   les exempcions i el QR de cotejo. Cap dada real: el NIF de l'empresa és el
   sintètic de les proves, el del client es compon a trossos i les adreces
   són inventades. */
import { describe, expect, test } from 'vitest';
import { ESQUEMA_CONFIG_EMPRESA } from '../../facturacio/configEmpresa.js';
import { creaEmissio } from '../../facturacio/emissio.js';
import { registraAnulacio } from '../../facturacio/registre/cadena.js';
import { creaPortMemoria } from '../../facturacio/registre/port.js';
import { textQR } from '../../facturacio/registre/qr.js';
import { AVIS_QR_SENSE_REMISSIO, CAUSES_RECTIFICATIVA, MENCIONS_EXEMPCIO, RETOL_QR, modelDeFactura, qrDeRegistre } from './impressio.js';

const CIF_EMISSOR = 'B12345674';
const DNI_CLIENT = ['1234', '5678', 'Z'].join('');
const PAS = '2026-10-07';
const ARA = Date.UTC(2026, 9, 9, 10, 0, 0);
const DOMICILI = Object.freeze({ adreca: 'Plaça del Poble, 1', codiPostal: '46999', poblacio: 'Poble de Prova', provincia: 'València' });
const CLIENT = Object.freeze({ nif: DNI_CLIENT, nom: 'Bar de la Plaça', domicili: { adreca: 'Carrer Major, 2', codiPostal: '46998', poblacio: 'Poble de Prova' } });

const CONFIG = Object.freeze({
  esquema: ESQUEMA_CONFIG_EMPRESA, nif: CIF_EMISSOR, nom: 'Forn del Poble SL', nomComercial: 'Forn Pepa',
  domicilis: [{ id: 'fiscal', ...DOMICILI }], domiciliFiscal: 'fiscal', facturacio: { dataPas: PAS }
});

async function llibre() {
  const port = creaPortMemoria();
  const cas = creaEmissio({ port, config: CONFIG, llegat: [] });
  const emet = (dades) => cas.emet({ dataExpedicio: '2026-10-08', ...dades }, { instant: ARA });
  return { port, emet };
}

describe('la factura completa', () => {
  test('emissor i client amb NIF i domicili, data de l’operació, línies, desglossament, retenció i QR', async () => {
    const { emet } = await llibre();
    const alta = await emet({
      tipus: 'F1', destinatari: CLIENT, dataOperacio: '2026-10-05', descripcio: 'Pa per al bar',
      linies: [
        { concepte: 'Pa de llenya', quantitat: 2.5, preuUnitari: 250, tipusIva: 4, unitat: 'kg', detall: 'Masa mare\nForn de llenya' },
        { concepte: 'Coca', quantitat: 1, preuUnitari: 1000, tipusIva: 10 }
      ],
      retencio: { percentatge: 15 }
    });
    const model = modelDeFactura(alta);
    expect(model).toMatchObject({
      numero: 'A2026-0001', titol: 'Factura', dataExpedicio: '08/10/2026', dataOperacio: '05/10/2026', descripcio: 'Pa per al bar',
      emissor: { nom: 'Forn del Poble SL', nomComercial: 'Forn Pepa', nif: CIF_EMISSOR, domicili: ['Plaça del Poble, 1', '46999 Poble de Prova (València)'] },
      destinatari: { nom: 'Bar de la Plaça', nif: DNI_CLIENT, domicili: ['Carrer Major, 2', '46998 Poble de Prova'] },
      referencies: [], mencions: [], anulada: false, ivaInclos: false
    });
    expect(model.linies).toEqual([
      { concepte: 'Pa de llenya', detall: 'Masa mare\nForn de llenya', quantitat: '2,5 kg', preu: '2,50 €', iva: '4 %', import: '6,25 €' },
      { concepte: 'Coca', quantitat: '1', preu: '10,00 €', iva: '10 %', import: '10,00 €' }
    ]);
    expect(model.desglossament).toEqual([
      { tipus: '4 %', base: '6,25 €', quota: '0,25 €' },
      { tipus: '10 %', base: '10,00 €', quota: '1,00 €' }
    ]);
    // Base 16,25 €; IVA 1,25 €; total 17,50 €; retenció del 15 % de la base, 2,44 €; a pagar, 15,06 €.
    expect(model.totals).toEqual([
      { etiqueta: 'Base imposable', valor: '16,25 €' },
      { etiqueta: 'IVA', valor: '1,25 €' },
      { etiqueta: 'Total de la factura', valor: '17,50 €', principal: false },
      { etiqueta: 'Retenció d’IRPF (15 %)', valor: '-2,44 €' },
      { etiqueta: 'Total a pagar', valor: '15,06 €', principal: true }
    ]);
    // El QR: l'adreça de cotejo amb l'ImporteTotal (sense restar la retenció) i el seu dibuix.
    expect(model.qr.url).toBe(textQR(alta));
    expect(model.qr.url).toMatch(/nif=B12345674&numserie=A2026-0001&fecha=08-10-2026&importe=17\.50$/);
    expect(model.qr.costat).toBe(model.qr.versio * 4 + 17 + 8);
    expect(model.qr.d).toMatch(/^M\d+ \d+h/);
    expect(RETOL_QR).toBe('QR tributario:');
    // Sense QR, si es vol; i mai la menció VERI*FACTU.
    expect(modelDeFactura(alta, { ambQr: false }).qr).toBeNull();
    expect(JSON.stringify(model)).not.toMatch(/VERI\*FACTU/i);
  });

  /* Correcció de la revisió (261009): l'avís que la seu de l'AEAT no trobarà la factura anava només a la
     pantalla; ara va al paper, davall de l'adreça del QR, mentre no hi haja remissió. */
  test('el QR porta al paper l’avís que encara no s’envia res a l’AEAT', async () => {
    const { emet } = await llibre();
    const alta = await emet({ tipus: 'F1', destinatari: CLIENT, linies: [{ concepte: 'Coca', quantitat: 1, preuUnitari: 1000, tipusIva: 10 }] });
    expect(modelDeFactura(alta).qr.avis).toBe(AVIS_QR_SENSE_REMISSIO);
    expect(AVIS_QR_SENSE_REMISSIO).toMatch(/no envia les factures a l’AEAT: si llegiu el QR, la seu electrònica de l’AEAT no hi trobarà esta factura\.$/);
    // Quan hi haja remissió, l'avís se'n va; sense QR, tampoc no hi és.
    expect(modelDeFactura(alta, { remesa: true }).qr).toMatchObject({ avis: null, url: textQR(alta) });
    expect(modelDeFactura(alta, { ambQr: false }).qr).toBeNull();
  });

  test('una línia exempta porta la menció de l’article; la mateixa data d’operació no es repetix', async () => {
    const { emet } = await llibre();
    const alta = await emet({ tipus: 'F1', destinatari: CLIENT, dataOperacio: '2026-10-08', linies: [{ concepte: 'Classe de valencià', quantitat: 1, preuUnitari: 3000, exempcio: 'E1' }] });
    const model = modelDeFactura(alta);
    expect(model.dataOperacio).toBeNull();
    expect(model.linies[0]).toMatchObject({ iva: 'Exempta', import: '30,00 €' });
    expect(model.desglossament).toEqual([{ tipus: 'Exempta (E1)', base: '30,00 €', quota: '0,00 €' }]);
    expect(model.mencions).toEqual([MENCIONS_EXEMPCIO.E1]);
    expect(MENCIONS_EXEMPCIO.E1).toBe('Operació exempta de l’IVA per l’article 20 de la Llei 37/1992.');
    expect(model.totals.map((t) => t.etiqueta)).toEqual(['Base imposable', 'IVA', 'Total de la factura']);
  });

  test('anul·lada, ho diu', async () => {
    const { emet } = await llibre();
    const alta = await emet({ tipus: 'F1', destinatari: CLIENT, linies: [{ concepte: 'Coca', quantitat: 1, preuUnitari: 1000, tipusIva: 10 }] });
    expect(modelDeFactura(alta, { anulada: true }).anulada).toBe(true);
    expect(() => modelDeFactura({ tipusRegistre: 'anulacio' })).toThrow(TypeError);
    expect(() => qrDeRegistre({ ...alta, tipusRegistre: 'anulacio' })).toThrow(expect.objectContaining({ codi: 'QR_INVALID' }));
  });
});

describe('la simplificada, la F3 i les rectificatives', () => {
  test('la simplificada amb l’IVA inclòs: sense client, preus amb IVA i el total «IVA inclòs»', async () => {
    const { emet } = await llibre();
    const tiquet = await emet({ tipus: 'F2', ivaInclos: true, linies: [{ concepte: 'Cafè', quantitat: 3, preuUnitari: 110, tipusIva: 10 }] });
    const model = modelDeFactura(tiquet);
    expect(model).toMatchObject({ titol: 'Factura simplificada', numero: 'T2026-0001', destinatari: null, ivaInclos: true });
    expect(model.linies).toEqual([{ concepte: 'Cafè', quantitat: '3', preu: '1,10 €', iva: '10 %', import: '3,30 €' }]);
    expect(model.totals[2]).toEqual({ etiqueta: 'Total, IVA inclòs', valor: '3,30 €', principal: true });
  });

  test('la F3 diu quins tiquets substituïx', async () => {
    const { emet } = await llibre();
    await emet({ tipus: 'F2', ivaInclos: true, linies: [{ concepte: 'Cafè', quantitat: 3, preuUnitari: 110, tipusIva: 10 }] });
    const f3 = await emet({
      tipus: 'F3', destinatari: CLIENT, substituides: [{ numSerie: 'T2026-0001', dataExpedicio: '2026-10-08' }],
      linies: [{ concepte: 'Cafè', quantitat: 3, preuUnitari: 100, tipusIva: 10 }]
    });
    expect(modelDeFactura(f3).referencies).toEqual(['Emesa en substitució de les factures simplificades: T2026-0001 (08/10/2026).']);
  });

  test('R1 per substitució, R3 per diferències i R5 d’un tiquet: la condició, la causa, la manera i les rectificades', async () => {
    const { emet } = await llibre();
    await emet({ tipus: 'F1', destinatari: CLIENT, linies: [{ concepte: 'Coca', quantitat: 1, preuUnitari: 1000, tipusIva: 10 }] });
    await emet({ tipus: 'F2', ivaInclos: true, linies: [{ concepte: 'Cafè', quantitat: 3, preuUnitari: 110, tipusIva: 10 }] });
    const rectificada = [{ numSerie: 'A2026-0001', dataExpedicio: '2026-10-08' }];
    const r1 = await emet({
      tipus: 'R1', tipusRectificativa: 'S', rectificades: rectificada, importRectificat: { base: 1000, quota: 100 }, destinatari: CLIENT,
      linies: [{ concepte: 'Coca', quantitat: 1, preuUnitari: 900, tipusIva: 10 }]
    });
    expect(modelDeFactura(r1)).toMatchObject({
      titol: 'Factura rectificativa', numero: 'R2026-0001',
      referencies: [
        CAUSES_RECTIFICATIVA.R1,
        'Factura rectificada: A2026-0001 (08/10/2026).',
        'Per substitució: esta factura substituïx la rectificada. Import rectificat: base 10,00 €, IVA 1,00 €.'
      ]
    });
    const r3 = await emet({
      tipus: 'R3', tipusRectificativa: 'I', rectificades: rectificada, destinatari: CLIENT,
      linies: [{ concepte: 'Impagat', quantitat: 1, preuUnitari: -1000, tipusIva: 10 }]
    });
    const model3 = modelDeFactura(r3);
    expect(model3.referencies).toEqual([CAUSES_RECTIFICATIVA.R3, 'Factura rectificada: A2026-0001 (08/10/2026).', 'Per diferències: esta factura porta només el que canvia.']);
    expect(model3.totals[2]).toMatchObject({ valor: '-11,00 €' });
    expect(model3.qr.url).toMatch(/importe=-11\.00$/);
    const r5 = await emet({
      tipus: 'R5', tipusRectificativa: 'I', ivaInclos: true, rectificades: [{ numSerie: 'T2026-0001', dataExpedicio: '2026-10-08' }],
      linies: [{ concepte: 'Cafè tornat', quantitat: 1, preuUnitari: -110, tipusIva: 10 }]
    });
    expect(modelDeFactura(r5)).toMatchObject({ titol: 'Factura rectificativa simplificada', numero: 'RT2026-0001', destinatari: null });
    expect(modelDeFactura(r5).referencies[0]).toBe(CAUSES_RECTIFICATIVA.R5);
  });

  test('una rectificativa d’una factura anul·lada no s’emet: FACTURA_RECTIFICADA_INEXISTENT', async () => {
    const { port, emet } = await llibre();
    await emet({ tipus: 'F1', destinatari: CLIENT, linies: [{ concepte: 'Coca', quantitat: 1, preuUnitari: 1000, tipusIva: 10 }] });
    await registraAnulacio(port, { idEmisor: CIF_EMISSOR, numSerie: 'A2026-0001', dataExpedicio: '2026-10-08', instant: ARA });
    await expect(emet({
      tipus: 'R1', tipusRectificativa: 'I', rectificades: [{ numSerie: 'A2026-0001', dataExpedicio: '2026-10-08' }], destinatari: CLIENT,
      linies: [{ concepte: 'Descompte', quantitat: 1, preuUnitari: -100, tipusIva: 10 }]
    })).rejects.toMatchObject({ codi: 'FACTURA_RECTIFICADA_INEXISTENT' });
  });
});
