// @vitest-environment node
/* Els registres d'alta i d'anul·lació: el que porten, com s'encadenen i que
   no es poden tocar. El NIF del client es compon a trossos perquè la porta de
   qualitat no hi veja un literal amb forma de DNI. */
import { describe, expect, test } from 'vitest';
import { congela } from '../comu.js';
import { creaFacturaEmesa } from '../facturaEmesa.js';
import { cadenaAlta, cadenaAnulacio, calculaEmpremta } from './empremta.js';
import * as modulAlta from './registreAlta.js';
import { ESQUEMA_ALTA, creaRegistreAlta } from './registreAlta.js';
import * as modulAnulacio from './registreAnulacio.js';
import { ESQUEMA_ANULACIO, creaRegistreAnulacio } from './registreAnulacio.js';
import { encadenamentDe, validaRegistre } from './validacio.js';

const CIF_EMISSOR = 'B12345674';
const DNI_CLIENT = ['1234', '5678', 'Z'].join('');
/* 4 d'octubre de 2026 a les 12:00 a Madrid (horari d'estiu, +02:00). */
const MIGDIA = Date.UTC(2026, 9, 4, 10, 0, 0);
/* Un domicili sintètic: cap adreça real. */
const DOMICILI = Object.freeze({ adreca: 'Plaça del Poble, 1', codiPostal: '46999', poblacio: 'Poble de Prova' });

function factura(numero = 1, canvis = {}) {
  return creaFacturaEmesa({
    tipus: 'F1',
    numSerie: `A2026-${String(numero).padStart(4, '0')}`,
    dataExpedicio: '2026-10-04',
    emissor: { nif: CIF_EMISSOR, nom: 'Forn del Poble', domicili: DOMICILI },
    destinatari: { nif: DNI_CLIENT, nom: 'Bar de la Plaça', domicili: DOMICILI },
    descripcio: 'Pa de la setmana',
    linies: [
      { concepte: 'Pa de llenya', quantitat: 12, preuUnitari: 250, tipusIva: 4 },
      { concepte: 'Lloguer del forn', quantitat: 1, preuUnitari: 1000, tipusIva: 21 }
    ],
    ...canvis
  });
}

/* Una còpia oberta (descongelada) d'un registre, per a falsificar-lo a les proves. */
const obert = (valor) => JSON.parse(JSON.stringify(valor));

describe('el registre d’alta', () => {
  test('el primer: ordre 1, sense encadenament, i l’empremta de la cadena de l’AEAT', async () => {
    const r = await creaRegistreAlta({ factura: factura(), anterior: null, instant: MIGDIA });
    expect(r).toMatchObject({
      esquema: ESQUEMA_ALTA, tipusRegistre: 'alta', ordre: 1, idEmisor: CIF_EMISSOR, numSerie: 'A2026-0001',
      dataExpedicio: '2026-10-04', tipusFactura: 'F1', quotaTotal: 330, importTotal: 4330, encadenament: null,
      dataHoraHusGeneracio: '2026-10-04T12:00:00+02:00', tipusEmpremta: '01'
    });
    const esperada = await calculaEmpremta([
      `IDEmisorFactura=${CIF_EMISSOR}`, 'NumSerieFactura=A2026-0001', 'FechaExpedicionFactura=04-10-2026', 'TipoFactura=F1',
      'CuotaTotal=3.30', 'ImporteTotal=43.30', 'Huella=', 'FechaHoraHusoGenRegistro=2026-10-04T12:00:00+02:00'
    ].join('&'));
    expect(r.empremta).toBe(esperada);
    expect(validaRegistre(r)).toEqual([]);
  });

  test('el segon s’encadena a l’empremta del primer', async () => {
    const primer = await creaRegistreAlta({ factura: factura(1), instant: MIGDIA });
    const segon = await creaRegistreAlta({ factura: factura(2), anterior: primer, instant: MIGDIA + 5000 });
    expect(segon.ordre).toBe(2);
    expect(segon.encadenament).toEqual({ idEmisor: CIF_EMISSOR, numSerie: 'A2026-0001', dataExpedicio: '2026-10-04', empremta: primer.empremta });
    expect(segon.empremta).toBe(await calculaEmpremta(cadenaAlta({
      idEmisor: CIF_EMISSOR, numSerie: 'A2026-0002', dataExpedicio: '04-10-2026', tipusFactura: 'F1', quotaTotal: '3.30',
      importTotal: '43.30', empremtaAnterior: primer.empremta, dataHoraHusGeneracio: '2026-10-04T12:00:05+02:00'
    })));
  });

  test('congelat en profunditat, amb la factura dins; cap funció el modifica', async () => {
    const r = await creaRegistreAlta({ factura: factura(), instant: MIGDIA });
    for (const part of [r, r.factura, r.factura.linies[0]]) expect(Object.isFrozen(part)).toBe(true);
    expect(() => { r.importTotal = 0; }).toThrow(TypeError);
    expect(() => { r.factura.importTotal = 0; }).toThrow(TypeError);
    const exportats = [...Object.keys(modulAlta), ...Object.keys(modulAnulacio)];
    expect(exportats.filter((nom) => /^(?:edita|actualitza|modifica|esborra|elimina|substituix)/i.test(nom))).toEqual([]);
  });

  test('només amb una factura de creaFacturaEmesa, i mai amb data de demà', async () => {
    await expect(creaRegistreAlta({ factura: obert(factura()), instant: MIGDIA })).rejects.toMatchObject({ codi: 'REGISTRE_INVALID' });
    await expect(creaRegistreAlta({ factura: factura(1, { dataExpedicio: '2026-10-05' }), instant: MIGDIA }))
      .rejects.toMatchObject({ codi: 'DATA_FUTURA' });
    // A les 00:30 de Madrid ja és el dia 5, encara que en UTC siga el 4.
    const mitjanit = Date.UTC(2026, 9, 4, 22, 30, 0);
    const r = await creaRegistreAlta({ factura: factura(1, { dataExpedicio: '2026-10-05' }), instant: mitjanit });
    expect(r.dataHoraHusGeneracio).toBe('2026-10-05T00:30:00+02:00');
  });

  test('l’anterior ha de ser vàlid i del mateix emissor', async () => {
    const primer = await creaRegistreAlta({ factura: factura(), instant: MIGDIA });
    const falsificat = { ...obert(primer), importTotal: 1 };
    await expect(creaRegistreAlta({ factura: factura(2), anterior: falsificat, instant: MIGDIA })).rejects.toMatchObject({ codi: 'REGISTRE_INVALID' });
    const altreEmissor = await creaRegistreAlta({
      factura: factura(1, {
        emissor: { nif: DNI_CLIENT, nom: 'Bar de la Plaça', domicili: DOMICILI },
        destinatari: { nif: CIF_EMISSOR, nom: 'Forn', domicili: DOMICILI }
      }),
      instant: MIGDIA
    });
    await expect(creaRegistreAlta({ factura: factura(2), anterior: altreEmissor, instant: MIGDIA })).rejects.toMatchObject({ codi: 'CADENA_ALIENA' });
  });

  test('una factura retocada i congelada a mà no es registra: es torna a calcular', async () => {
    const f = obert(factura());
    const incoherent = congela({ ...f, linies: [], desglossament: [], quotaTotal: 0, importTotal: 1 });
    await expect(creaRegistreAlta({ factura: incoherent, instant: MIGDIA })).rejects.toMatchObject({ codi: 'REGISTRE_INVALID' });
  });

  test('el detall i la unitat de les línies, fora dels camps fiscals: viatgen dins del registre però no canvien l’empremta', async () => {
    const linia = { concepte: 'Pa de llenya', quantitat: 12, preuUnitari: 250, tipusIva: 4 };
    const amb = factura(1, { linies: [{ ...linia, unitat: 'peces', detall: 'Dilluns: 6\nDijous: 6' }] });
    const sense = factura(1, { linies: [linia] });
    const [ra, rs] = await Promise.all([amb, sense].map((f) => creaRegistreAlta({ factura: f, instant: MIGDIA })));
    expect(ra.empremta).toBe(rs.empremta);
    // Dins del registre, sí: hi van amb la factura que porta (el comentari de facturaEmesa.js ho diu així).
    expect(ra.factura.linies[0].detall).toBe('Dilluns: 6\nDijous: 6');
    expect(ra.factura.linies[0].unitat).toBe('peces');
    // Als camps de l'AEAT del registre, no.
    expect(JSON.stringify({ ...ra, factura: null })).not.toMatch(/Dilluns|peces/);
    expect(validaRegistre(ra)).toEqual([]);
  });
});

describe('el registre d’anul·lació', () => {
  test('s’encadena a l’últim registre (no a l’alta) i porta els cinc camps de l’AEAT', async () => {
    const primer = await creaRegistreAlta({ factura: factura(1), instant: MIGDIA });
    const segon = await creaRegistreAlta({ factura: factura(2), anterior: primer, instant: MIGDIA + 1000 });
    const anul = await creaRegistreAnulacio({ alta: primer, anterior: segon, motiu: '  Emesa per error  ', instant: MIGDIA + 2000 });
    expect(anul).toMatchObject({
      esquema: ESQUEMA_ANULACIO, tipusRegistre: 'anulacio', ordre: 3, idEmisor: CIF_EMISSOR, numSerie: 'A2026-0001',
      dataExpedicio: '2026-10-04', encadenament: encadenamentDe(segon), dataHoraHusGeneracio: '2026-10-04T12:00:02+02:00',
      motiu: 'Emesa per error'
    });
    expect('importTotal' in anul).toBe(false);
    expect(anul.empremta).toBe(await calculaEmpremta(cadenaAnulacio({
      idEmisor: CIF_EMISSOR, numSerie: 'A2026-0001', dataExpedicio: '04-10-2026', empremtaAnterior: segon.empremta,
      dataHoraHusGeneracio: '2026-10-04T12:00:02+02:00'
    })));
    expect(Object.isFrozen(anul)).toBe(true);
    expect(validaRegistre(anul)).toEqual([]);
  });

  test('el motiu no entra a l’empremta', async () => {
    const primer = await creaRegistreAlta({ factura: factura(1), instant: MIGDIA });
    const amb = await creaRegistreAnulacio({ alta: primer, anterior: primer, motiu: 'Duplicada', instant: MIGDIA + 1000 });
    const sense = await creaRegistreAnulacio({ alta: primer, anterior: primer, instant: MIGDIA + 1000 });
    expect(amb.empremta).toBe(sense.empremta);
    expect('motiu' in sense).toBe(false);
  });

  test('cal una alta vàlida, l’últim de la cadena i un motiu net', async () => {
    const primer = await creaRegistreAlta({ factura: factura(1), instant: MIGDIA });
    const segon = await creaRegistreAlta({ factura: factura(2), anterior: primer, instant: MIGDIA + 1000 });
    const anul = await creaRegistreAnulacio({ alta: primer, anterior: segon, instant: MIGDIA + 2000 });
    await expect(creaRegistreAnulacio({ alta: anul, anterior: anul, instant: MIGDIA })).rejects.toMatchObject({ codi: 'REGISTRE_INVALID' });
    await expect(creaRegistreAnulacio({ alta: primer, instant: MIGDIA })).rejects.toMatchObject({ codi: 'REGISTRE_INVALID' });
    await expect(creaRegistreAnulacio({ alta: segon, anterior: primer, instant: MIGDIA })).rejects.toMatchObject({ codi: 'CADENA_CANVIADA' });
    await expect(creaRegistreAnulacio({ alta: primer, anterior: segon, motiu: 'línia\nnova', instant: MIGDIA }))
      .rejects.toMatchObject({ codi: 'REGISTRE_INVALID' });
    await expect(creaRegistreAnulacio({ alta: primer, anterior: segon, motiu: '   ', instant: MIGDIA })).rejects.toMatchObject({ codi: 'REGISTRE_INVALID' });
  });
});

describe('validaRegistre: la forma, i només eixa forma', () => {
  test('cap camp de més, i la factura ha de dir el mateix que el registre', async () => {
    const r = obert(await creaRegistreAlta({ factura: factura(), instant: MIGDIA }));
    expect(validaRegistre({ ...r, nota: 'x' })).toEqual(['Camp desconegut: «nota».']);
    expect(validaRegistre({ ...r, importTotal: 1 }).join(' ')).toMatch(/no coincidixen en l'import total/);
    expect(validaRegistre({ ...r, factura: { ...r.factura, emissor: { nif: DNI_CLIENT, nom: 'X' } } }).join(' ')).toMatch(/no coincidixen en l'emissor/);
  });

  test('encadenament, ordre, empremta i dates', async () => {
    const r = obert(await creaRegistreAlta({ factura: factura(), instant: MIGDIA }));
    expect(validaRegistre({ ...r, ordre: 2 }).join(' ')).toMatch(/Només el primer registre/);
    expect(validaRegistre({ ...r, encadenament: { idEmisor: CIF_EMISSOR, numSerie: 'A2026-0000', dataExpedicio: '2026-10-04', empremta: r.empremta } }).join(' '))
      .toMatch(/no porta encadenament/);
    expect(validaRegistre({ ...r, empremta: r.empremta.toLowerCase() }).join(' ')).toMatch(/majúscules/);
    expect(validaRegistre({ ...r, dataHoraHusGeneracio: '2026-10-04T12:00:00Z' }).join(' ')).toMatch(/desfase/);
    expect(validaRegistre({ ...r, dataHoraHusGeneracio: '2026-10-03T12:00:00+02:00' }).join(' ')).toMatch(/posterior al dia/);
    expect(validaRegistre({ ...r, idEmisor: 'b12345674' }).join(' ')).toMatch(/idEmisor/);
    expect(validaRegistre({ ...r, tipusEmpremta: '02' }).join(' ')).toMatch(/SHA-256/);
    expect(validaRegistre(null)).toHaveLength(1);
    expect(validaRegistre({ ...r, tipusRegistre: 'esborrat' })).toHaveLength(1);
  });
});
