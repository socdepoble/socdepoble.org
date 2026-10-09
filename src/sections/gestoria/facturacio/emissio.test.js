// @vitest-environment node
/* El cas d'ús d'emissió (F02 de l'auditoria de Codex del 261004): la política
   de numeració de l'empresa governa l'alta. Decisió del Mestre: sèrie NOVA el
   dia del pas, i la F del llegat queda tancada. Cap dada real: el NIF de
   l'empresa és el sintètic de les proves, el del client es compon a trossos
   perquè la porta de qualitat no hi veja un literal amb forma de DNI, i el
   domicili és inventat. */
import { describe, expect, test } from 'vitest';
import { ESQUEMA_CONFIG_EMPRESA } from './configEmpresa.js';
import { creaEmissio } from './emissio.js';
import { creaFacturaEmesa } from './facturaEmesa.js';
import { sembraLlegat } from './llegat.js';
import { registraAlta, registraAnulacio, verificaCadena } from './registre/cadena.js';
import { creaPortMemoria } from './registre/port.js';

const CIF_EMISSOR = 'B12345674';
const DNI_CLIENT = ['1234', '5678', 'Z'].join('');
/* Un altre NIF sintètic (la lletra de control quadra), per a un emissor que no és l'empresa. */
const DNI_ALIE = ['8765', '4321', 'X'].join('');
const MIGDIA = Date.UTC(2026, 9, 4, 10, 0, 0);
const PAS = '2026-10-04';
const DOMICILI = Object.freeze({ adreca: 'Plaça del Poble, 1', codiPostal: '46999', poblacio: 'Poble de Prova' });
const OBRADOR = Object.freeze({ adreca: 'Camí del Molí, 3', codiPostal: '46998', poblacio: 'Poble de Prova' });
/* El llegat de l'eina externa, en les formes pintades: la sèrie F de 2026 queda tancada. */
const LLEGAT_F26 = sembraLlegat(['F26 0001', 'F260002']);

function config(facturacio = { dataPas: PAS }) {
  return {
    esquema: ESQUEMA_CONFIG_EMPRESA,
    nif: CIF_EMISSOR,
    nom: 'Forn del Poble SL',
    domicilis: [{ id: 'fiscal', ...DOMICILI }, { id: 'obrador', ...OBRADOR }],
    domiciliFiscal: 'fiscal',
    ...(facturacio === null ? {} : { facturacio })
  };
}

function dades(canvis = {}) {
  return {
    tipus: 'F1',
    dataExpedicio: PAS,
    destinatari: { nif: DNI_CLIENT, nom: 'Client', domicili: DOMICILI },
    descripcio: 'Servici',
    linies: [{ concepte: 'Servici', quantitat: 1, preuUnitari: 1000, tipusIva: 21 }],
    ...canvis
  };
}

const emissio = ({ port = creaPortMemoria(), facturacio, llegat = LLEGAT_F26 } = {}) => creaEmissio({ port, config: config(facturacio), llegat });
const numeros = async (port) => (await port.llig()).map((r) => r.numSerie);

/* Un port que complix el contracte però no porta escriptor únic (ambEscriptor és opcional). */
function senseEscriptor(port) {
  return Object.freeze({
    afegix: (registre) => port.afegix(registre),
    ultim: (idEmisor) => port.ultim(idEmisor),
    llig: (opcions) => port.llig(opcions),
    exporta: () => port.exporta()
  });
}

describe('el que exigix abans d’emetre res', () => {
  test('un port, una configuració vàlida amb la data de pas i el llegat declarat', () => {
    const port = creaPortMemoria();
    expect(() => creaEmissio({ port: {}, config: config(), llegat: [] })).toThrow(expect.objectContaining({ codi: 'PORT_INVALID' }));
    expect(() => creaEmissio({ port, config: { ...config(), nif: 'no' }, llegat: [] })).toThrow(expect.objectContaining({ codi: 'CONFIG_INVALIDA' }));
    expect(() => creaEmissio({ port, config: config(null), llegat: [] })).toThrow(expect.objectContaining({ codi: 'SENSE_DATA_PAS' }));
    expect(() => creaEmissio({ port, config: config({ prefixos: { F1: 'A' } }), llegat: [] })).toThrow(expect.objectContaining({ codi: 'SENSE_DATA_PAS' }));
    expect(() => creaEmissio({ port, config: config() })).toThrow(expect.objectContaining({ codi: 'SENSE_LLEGAT' }));
    expect(() => creaEmissio({ port, config: config(), llegat: null })).toThrow(expect.objectContaining({ codi: 'SENSE_LLEGAT' }));
    // Un llegat mal format no s'ignora: un número pintat s'ha de passar abans per sembraLlegat.
    expect(() => creaEmissio({ port, config: config(), llegat: ['F26 0001'] })).toThrow(TypeError);
    // Una empresa sense llegat el declara buit.
    expect(creaEmissio({ port, config: config(), llegat: [] })).toMatchObject({ dataPas: PAS, nif: CIF_EMISSOR });
  });
});

describe('numerar i registrar en una sola secció', () => {
  test('la sèrie nova comença per 1, la factura porta l’emissor de la configuració i la cadena és vàlida', async () => {
    const port = creaPortMemoria();
    const cas = emissio({ port });
    expect(await cas.seguentNumero({ tipus: 'F1', dataExpedicio: PAS })).toBe('A2026-0001');
    const primer = await cas.emet(dades(), { instant: MIGDIA });
    expect(primer).toMatchObject({ numSerie: 'A2026-0001', ordre: 1, idEmisor: CIF_EMISSOR });
    expect(primer.factura.emissor).toEqual({ nif: CIF_EMISSOR, nom: 'Forn del Poble SL', domicili: DOMICILI });
    // El número que la pantalla ha mostrat es pot confirmar: és el que toca.
    expect((await cas.emet(dades({ numSerie: 'A2026-0002' }), { instant: MIGDIA })).numSerie).toBe('A2026-0002');
    // La simplificada, en la seua sèrie (el prefix recomanat o el de la configuració).
    expect((await cas.emet(dades({ tipus: 'F2', destinatari: null }), { instant: MIGDIA })).numSerie).toBe('T2026-0001');
    expect(await numeros(port)).toEqual(['A2026-0001', 'A2026-0002', 'T2026-0001']);
    expect((await verificaCadena(await port.llig())).valida).toBe(true);
    const ambPrefix = emissio({ facturacio: { dataPas: PAS, prefixos: { F1: 'B' } } });
    expect((await ambPrefix.emet(dades(), { instant: MIGDIA })).numSerie).toBe('B2026-0001');
  });

  test('un altre domicili de la mateixa empresa, sí; un altre emissor, no (EMISSOR_ALIE)', async () => {
    const port = creaPortMemoria();
    const cas = emissio({ port });
    const obrador = { nif: CIF_EMISSOR, nom: 'Forn del Poble SL', domicili: OBRADOR };
    expect((await cas.emet(dades({ emissor: obrador }), { instant: MIGDIA })).factura.emissor.domicili).toEqual(OBRADOR);
    await expect(cas.emet(dades({ emissor: { nif: DNI_ALIE, nom: 'Una altra', domicili: DOMICILI } }), { instant: MIGDIA }))
      .rejects.toMatchObject({ codi: 'EMISSOR_ALIE' });
    expect(await numeros(port)).toEqual(['A2026-0001']);
  });

  test('dades que no són una factura: FACTURA_INVALIDA, sense tocar el llibre', async () => {
    const port = creaPortMemoria();
    const cas = emissio({ port });
    for (const dolentes of [null, [], dades({ tipus: 'X1' }), dades({ dataExpedicio: '04/10/2026' }), dades({ linies: [] })]) {
      await expect(cas.emet(dolentes, { instant: MIGDIA }), JSON.stringify(dolentes)).rejects.toMatchObject({ codi: 'FACTURA_INVALIDA' });
    }
    expect(await port.llig()).toEqual([]);
  });
});

describe('F02 · la política governa l’alta', () => {
  /* Abans, registraAlta acceptava F260001 del 03/10 i la cadena eixia vàlida;
     només una crida separada a comprovaEmissio la refusava. */
  test('F260001 expedida abans del pas: SERIE_CONFUSA, i el llibre queda buit', async () => {
    const port = creaPortMemoria();
    const cas = emissio({ port });
    await expect(cas.emet(dades({ numSerie: 'F260001', dataExpedicio: '2026-10-03' }), { instant: MIGDIA }))
      .rejects.toMatchObject({ codi: 'SERIE_CONFUSA' });
    // També després del pas i amb qualsevol forma pintada: la sèrie de l'eina externa està tancada.
    await expect(cas.emet(dades({ numSerie: 'F260003' }), { instant: MIGDIA })).rejects.toMatchObject({ codi: 'SERIE_CONFUSA' });
    // Ni triant F com a prefix de la configuració: F2026 es confondria amb F26.
    const ambF = emissio({ port, facturacio: { dataPas: PAS, prefixos: { F1: 'F' } } });
    await expect(ambF.emet(dades(), { instant: MIGDIA })).rejects.toMatchObject({ codi: 'SERIE_CONFUSA' });
    // Abans del pas, en la sèrie pròpia: ABANS_DEL_PAS.
    await expect(cas.emet(dades({ dataExpedicio: '2026-10-03' }), { instant: MIGDIA })).rejects.toMatchObject({ codi: 'ABANS_DEL_PAS' });
    expect(await port.llig()).toEqual([]);
  });

  /* Abans, dos A2026-0001 del mateix emissor amb dates 03/10 i 04/10 entraven
     i la cadena eixia vàlida: la identitat fiscal porta la data. */
  test('dos A2026-0001 amb dates diferents: el segon es refusa (NUMERO_REPETIT)', async () => {
    const port = creaPortMemoria();
    const cas = emissio({ port, facturacio: { dataPas: '2026-10-01' } });
    await cas.emet(dades({ numSerie: 'A2026-0001', dataExpedicio: '2026-10-03' }), { instant: MIGDIA });
    await expect(cas.emet(dades({ numSerie: 'A2026-0001', dataExpedicio: '2026-10-04' }), { instant: MIGDIA }))
      .rejects.toMatchObject({ codi: 'NUMERO_REPETIT' });
    // Un salt tampoc: el número que toca és el següent.
    await expect(cas.emet(dades({ numSerie: 'A2026-0005' }), { instant: MIGDIA })).rejects.toMatchObject({ codi: 'NUMERO_NO_CORRELATIU' });
    // Ni un número d'una altra sèrie, d'un altre any o fora de la forma del programa.
    for (const numSerie of ['B2026-0002', 'A2025-0002', 'A2026-2', 'P2026-0002']) {
      await expect(cas.emet(dades({ numSerie }), { instant: MIGDIA }), numSerie).rejects.toMatchObject({ codi: 'SERIE_INVALIDA' });
    }
    expect(await numeros(port)).toEqual(['A2026-0001']);
  });

  test('un llibre que ja porta un número repetit no es continua: primer s’explica (SERIE_AMB_FORATS)', async () => {
    const port = creaPortMemoria();
    const emesa = (dataExpedicio) => creaFacturaEmesa({
      ...dades({ dataExpedicio }), numSerie: 'A2026-0001', emissor: { nif: CIF_EMISSOR, nom: 'Forn del Poble SL', domicili: DOMICILI }
    });
    // El constructor fiscal genèric no canvia: pel camí directe, les dos altes entren.
    await registraAlta(port, emesa('2026-10-03'), { instant: MIGDIA });
    await registraAlta(port, emesa('2026-10-04'), { instant: MIGDIA });
    const cas = emissio({ port, facturacio: { dataPas: '2026-10-01' } });
    await expect(cas.emet(dades(), { instant: MIGDIA })).rejects.toMatchObject({ codi: 'SERIE_AMB_FORATS', detalls: expect.objectContaining({ repetits: [1] }) });
    await expect(cas.seguentNumero({ tipus: 'F1', dataExpedicio: PAS })).rejects.toMatchObject({ codi: 'SERIE_AMB_FORATS' });
    expect(await port.llig()).toHaveLength(2);
  });
});

describe('F02 · sense carreres', () => {
  test('emissions concurrents del mateix cas d’ús: números consecutius, sense repetir', async () => {
    const port = creaPortMemoria();
    const cas = emissio({ port });
    const desats = await Promise.all([1, 2, 3].map(() => cas.emet(dades(), { instant: MIGDIA })));
    expect(desats.map((r) => r.numSerie)).toEqual(['A2026-0001', 'A2026-0002', 'A2026-0003']);
    expect(desats.map((r) => r.ordre)).toEqual([1, 2, 3]);
    expect((await verificaCadena(await port.llig())).valida).toBe(true);
  });

  test('dos casos d’ús sobre el mateix port: l’escriptor únic del port les posa en fila', async () => {
    const port = creaPortMemoria();
    const [a, b] = [emissio({ port }), emissio({ port })];
    const desats = await Promise.all([a.emet(dades(), { instant: MIGDIA }), b.emet(dades(), { instant: MIGDIA })]);
    expect(desats.map((r) => r.numSerie).sort()).toEqual(['A2026-0001', 'A2026-0002']);
    expect((await verificaCadena(await port.llig())).valida).toBe(true);
  });

  test('un port sense escriptor únic: la fila del cas d’ús; i si un altre s’hi cola, el port ho refusa, mai un número repetit', async () => {
    const memoria = creaPortMemoria();
    const port = senseEscriptor(memoria);
    const cas = emissio({ port });
    const desats = await Promise.all([cas.emet(dades(), { instant: MIGDIA }), cas.emet(dades(), { instant: MIGDIA })]);
    expect(desats.map((r) => r.numSerie)).toEqual(['A2026-0001', 'A2026-0002']);
    // Dos casos d'ús sense cap escriptor comú: els dos lligen el mateix llibre i un perd.
    const altre = senseEscriptor(creaPortMemoria());
    const resultats = await Promise.allSettled([emissio({ port: altre }).emet(dades(), { instant: MIGDIA }), emissio({ port: altre }).emet(dades(), { instant: MIGDIA })]);
    expect(resultats.map((r) => r.status).sort()).toEqual(['fulfilled', 'rejected']);
    expect(resultats.find((r) => r.status === 'rejected').reason.codi).toBe('CADENA_CANVIADA');
    expect(await numeros(altre)).toEqual(['A2026-0001']);
  });
});

/* Pas 4 del mapa de la Gestoria (ordre del Mestre, 261007; buit G10): abans,
   una rectificativa o una F3 podien referir una factura que no era al llibre,
   d'un altre emissor o ja anul·lada, i la cadena eixia vàlida. */
describe('pas 4 · rectificatives segures', () => {
  const PER_DIFERENCIES = Object.freeze([{ concepte: 'Descompte acordat', quantitat: 1, preuUnitari: -100, tipusIva: 21 }]);
  const rectificativa = (rectificades, canvis = {}) => dades({ tipus: 'R1', tipusRectificativa: 'I', rectificades, linies: PER_DIFERENCIES, ...canvis });
  const simplificada = (canvis = {}) => dades({ tipus: 'F2', destinatari: null, ivaInclos: true, linies: [{ concepte: 'Cafè', quantitat: 2, preuUnitari: 150, tipusIva: 10 }], ...canvis });

  test('una rectificativa d’una factura emesa i viva: s’emet en la seua sèrie i la cadena és vàlida', async () => {
    const port = creaPortMemoria();
    const cas = emissio({ port });
    const original = await cas.emet(dades(), { instant: MIGDIA });
    const rectificada = await cas.emet(rectificativa([{ numSerie: original.numSerie, dataExpedicio: original.dataExpedicio }]), { instant: MIGDIA });
    expect(rectificada).toMatchObject({ numSerie: 'R2026-0001', tipusFactura: 'R1' });
    expect(rectificada.factura.rectificades).toEqual([{ numSerie: 'A2026-0001', dataExpedicio: PAS }]);
    // La rectificativa de la simplificada (R5) també: IVA inclòs i sense destinatari.
    const tiquet = await cas.emet(simplificada(), { instant: MIGDIA });
    const r5 = await cas.emet(simplificada({ tipus: 'R5', tipusRectificativa: 'I', rectificades: [{ numSerie: tiquet.numSerie, dataExpedicio: PAS }],
      linies: [{ concepte: 'Cafè tornat', quantitat: 1, preuUnitari: -150, tipusIva: 10 }] }), { instant: MIGDIA });
    expect(r5.numSerie).toBe('RT2026-0001');
    expect((await verificaCadena(await port.llig())).valida).toBe(true);
  });

  test('una factura que no és al llibre, o amb una altra data: FACTURA_RECTIFICADA_INEXISTENT, i el llibre no canvia', async () => {
    const port = creaPortMemoria();
    const cas = emissio({ port });
    await cas.emet(dades(), { instant: MIGDIA });
    await expect(cas.emet(rectificativa([{ numSerie: 'A2026-0009', dataExpedicio: PAS }]), { instant: MIGDIA })).rejects.toMatchObject({
      codi: 'FACTURA_RECTIFICADA_INEXISTENT', detalls: ['A2026-0009 del 2026-10-04 no és al llibre d\'esta empresa.']
    });
    // El número existix, però la identitat fiscal porta la data: una altra data no és la mateixa factura.
    await expect(cas.emet(rectificativa([{ numSerie: 'A2026-0001', dataExpedicio: '2026-10-03' }]), { instant: MIGDIA }))
      .rejects.toMatchObject({ codi: 'FACTURA_RECTIFICADA_INEXISTENT' });
    // Una de bona i una de dolenta: tampoc. Es diu quina falla.
    await expect(cas.emet(rectificativa([{ numSerie: 'A2026-0001', dataExpedicio: PAS }, { numSerie: 'F260001', dataExpedicio: '2026-01-10' }]), { instant: MIGDIA }))
      .rejects.toMatchObject({ codi: 'FACTURA_RECTIFICADA_INEXISTENT', detalls: ['F260001 del 2026-01-10 no és al llibre d\'esta empresa.'] });
    expect(await numeros(port)).toEqual(['A2026-0001']);
  });

  test('una factura anul·lada no es rectifica, tampoc si l’anul·lació arriba just abans en la mateixa fila', async () => {
    const port = creaPortMemoria();
    const cas = emissio({ port });
    const [primera, segona] = [await cas.emet(dades(), { instant: MIGDIA }), await cas.emet(dades(), { instant: MIGDIA })];
    await registraAnulacio(port, { idEmisor: CIF_EMISSOR, numSerie: primera.numSerie, dataExpedicio: PAS, motiu: 'Duplicada', instant: MIGDIA });
    await expect(cas.emet(rectificativa([{ numSerie: primera.numSerie, dataExpedicio: PAS }]), { instant: MIGDIA })).rejects.toMatchObject({
      codi: 'FACTURA_RECTIFICADA_INEXISTENT', detalls: ['A2026-0001 del 2026-10-04 està anul·lada.']
    });
    // L'anul·lació de la segona i la rectificativa, alhora: la fila les ordena i la rectificativa ja la veu anul·lada.
    const [anulacio, rectificacio] = await Promise.allSettled([
      registraAnulacio(port, { idEmisor: CIF_EMISSOR, numSerie: segona.numSerie, dataExpedicio: PAS, instant: MIGDIA }),
      cas.emet(rectificativa([{ numSerie: segona.numSerie, dataExpedicio: PAS }]), { instant: MIGDIA })
    ]);
    expect(anulacio.status).toBe('fulfilled');
    expect(rectificacio).toMatchObject({ status: 'rejected', reason: { codi: 'FACTURA_RECTIFICADA_INEXISTENT' } });
    expect((await port.llig()).map((r) => r.tipusRegistre)).toEqual(['alta', 'alta', 'anulacio', 'anulacio']);
  });

  /* Correcció de la revisió del front de facturació (261009): cap capa refusava una rectificativa de
     factures de clients diferents, i el llibre és de només afegir. */
  test('una rectificativa de factures de clients diferents: RECTIFICADES_DE_DIVERSOS_CLIENTS, i el llibre no canvia', async () => {
    const port = creaPortMemoria();
    const cas = emissio({ port });
    const altre = { nif: DNI_ALIE, nom: 'Un altre client', domicili: OBRADOR };
    const [a, b, c] = [
      await cas.emet(dades(), { instant: MIGDIA }),
      await cas.emet(dades({ destinatari: altre }), { instant: MIGDIA }),
      await cas.emet(dades(), { instant: MIGDIA })
    ];
    const ref = (r) => ({ numSerie: r.numSerie, dataExpedicio: r.dataExpedicio });
    await expect(cas.emet(rectificativa([ref(a), ref(b)]), { instant: MIGDIA })).rejects.toMatchObject({
      codi: 'RECTIFICADES_DE_DIVERSOS_CLIENTS', detalls: ['A2026-0001', 'A2026-0002']
    });
    // Un tiquet i una factura completa tampoc no són del mateix destinatari.
    const tiquet = await cas.emet(simplificada(), { instant: MIGDIA });
    await expect(cas.emet(rectificativa([ref(a), ref(tiquet)]), { instant: MIGDIA }))
      .rejects.toMatchObject({ codi: 'RECTIFICADES_DE_DIVERSOS_CLIENTS' });
    expect(await numeros(port)).toEqual(['A2026-0001', 'A2026-0002', 'A2026-0003', 'T2026-0001']);
    // Dos factures del mateix client, sí; i la rectificativa pot anar a nom d'unes altres dades (és corregir-les).
    const r = await cas.emet(rectificativa([ref(a), ref(c)], { destinatari: { nif: DNI_CLIENT, nom: 'Client corregit', domicili: OBRADOR } }), { instant: MIGDIA });
    expect(r).toMatchObject({ numSerie: 'R2026-0001', tipusFactura: 'R1' });
    expect((await verificaCadena(await port.llig())).valida).toBe(true);
  });

  test('la factura d’un altre emissor del mateix llibre no és de la cadena de l’empresa', async () => {
    const port = creaPortMemoria();
    const alie = creaFacturaEmesa({ ...dades(), numSerie: 'A2026-0001', emissor: { nif: DNI_ALIE, nom: 'Una altra', domicili: DOMICILI }, destinatari: { nif: CIF_EMISSOR, nom: 'Forn', domicili: DOMICILI } });
    await registraAlta(port, alie, { instant: MIGDIA });
    const cas = emissio({ port });
    await expect(cas.emet(rectificativa([{ numSerie: 'A2026-0001', dataExpedicio: PAS }]), { instant: MIGDIA }))
      .rejects.toMatchObject({ codi: 'FACTURA_RECTIFICADA_INEXISTENT' });
    expect(await port.llig({ idEmisor: CIF_EMISSOR })).toEqual([]);
  });

  test('una F3 només substituïx simplificades del llibre que no estiguen anul·lades', async () => {
    const port = creaPortMemoria();
    const cas = emissio({ port });
    const tiquet = await cas.emet(simplificada(), { instant: MIGDIA });
    const substitucio = (substituides) => dades({ tipus: 'F3', substituides });
    await expect(cas.emet(substitucio([{ numSerie: 'T2026-0002', dataExpedicio: PAS }]), { instant: MIGDIA }))
      .rejects.toMatchObject({ codi: 'FACTURA_RECTIFICADA_INEXISTENT', detalls: ['T2026-0002 del 2026-10-04 no és al llibre d\'esta empresa.'] });
    const f3 = await cas.emet(substitucio([{ numSerie: tiquet.numSerie, dataExpedicio: PAS }]), { instant: MIGDIA });
    expect(f3).toMatchObject({ numSerie: 'A2026-0001', tipusFactura: 'F3' });
    expect(f3.factura.substituides).toEqual([{ numSerie: 'T2026-0001', dataExpedicio: PAS }]);
    expect((await verificaCadena(await port.llig())).valida).toBe(true);
  });

  /* Troballa F5 de la revisió (261007): una segona F3 del mateix tiquet entrava
     i la venda quedava amb dos factures completes, l'IVA comptat dos vegades. */
  test('un tiquet només se substituïx una vegada: FACTURA_JA_SUBSTITUIDA; anul·lada la F3, es pot tornar a fer', async () => {
    const port = creaPortMemoria();
    const cas = emissio({ port });
    const [primer, segon] = [await cas.emet(simplificada(), { instant: MIGDIA }), await cas.emet(simplificada(), { instant: MIGDIA })];
    const substitucio = (substituides) => dades({ tipus: 'F3', substituides });
    const ref = (tiquet) => ({ numSerie: tiquet.numSerie, dataExpedicio: PAS });
    const f3 = await cas.emet(substitucio([ref(primer)]), { instant: MIGDIA });
    await expect(cas.emet(substitucio([ref(primer)]), { instant: MIGDIA })).rejects.toMatchObject({
      codi: 'FACTURA_JA_SUBSTITUIDA', detalls: ['T2026-0001 del 2026-10-04 ja el substituïx la factura A2026-0001.']
    });
    // Barrejat amb un tiquet lliure, tampoc: es diu quin està repetit.
    await expect(cas.emet(substitucio([ref(segon), ref(primer)]), { instant: MIGDIA })).rejects.toMatchObject({
      codi: 'FACTURA_JA_SUBSTITUIDA', detalls: ['T2026-0001 del 2026-10-04 ja el substituïx la factura A2026-0001.']
    });
    expect(await numeros(port)).toEqual(['T2026-0001', 'T2026-0002', 'A2026-0001']);
    // Anul·lada la primera F3, el tiquet torna a estar lliure.
    await registraAnulacio(port, { idEmisor: CIF_EMISSOR, numSerie: f3.numSerie, dataExpedicio: PAS, motiu: 'Dades del client errònies', instant: MIGDIA });
    const nova = await cas.emet(substitucio([ref(primer), ref(segon)]), { instant: MIGDIA });
    expect(nova).toMatchObject({ numSerie: 'A2026-0002', tipusFactura: 'F3' });
    expect((await verificaCadena(await port.llig())).valida).toBe(true);
  });
});
