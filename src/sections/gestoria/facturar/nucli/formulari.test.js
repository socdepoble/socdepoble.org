// @vitest-environment node
/* La pantalla de Facturació, la part pura (ordre del Mestre, 261007: «tindre
   la facturació operativa inclús sense xarxa»). Del formulari al nucli i
   tornada: el perfil curt sobre configEmpresa, els números del llegat, la
   lectura de la factura (cèntims, mil·lèsimes, client i tipus), els totals
   que calcula el nucli i els textos del llibre. Cap dada real: el NIF de
   l'empresa és el sintètic de les proves, el del client es compon a trossos
   perquè la porta de qualitat no hi veja un literal amb forma de DNI. */
import { describe, expect, test } from 'vitest';
import { ESQUEMA_CONFIG_EMPRESA, llegixConfigEmpresa } from '../../facturacio/configEmpresa.js';
import { sembraLlegat } from '../../facturacio/llegat.js';
import {
  OPCIONS_IVA, OPCIONS_TIPUS, configDeFormulari, configDeJson, dadesDeFactura, dataCurta, errorsDeFactura, errorsDelPerfil,
  estatDeLaCadena, euros, facturaBuida, filesDelLlibre, formulariDeConfig, formulariImportat, llegixQuantitat, numerosDelText,
  resumDelLlegat, tiquetsSubstituibles, totalsDeFactura
} from './formulari.js';

const CIF_EMISSOR = 'B12345674';
const DNI_CLIENT = ['1234', '5678', 'Z'].join('');
const PAS = '2026-10-07';

const formulariBo = (canvis = {}) => ({
  nif: ` ${CIF_EMISSOR.toLowerCase()} `, nom: 'Forn del Poble SL', nomComercial: '', adreca: 'Plaça del Poble, 1',
  codiPostal: '46999', poblacio: 'Poble de Prova', provincia: '', dataPas: PAS, ...canvis
});

const facturaBona = (canvis = {}) => ({
  ...facturaBuida(PAS),
  client: { nif: DNI_CLIENT, nom: 'Bar de la Plaça', adreca: 'Carrer Major, 2', codiPostal: '46998', poblacio: 'Poble de Prova' },
  linies: [{ concepte: 'Pa de llenya', quantitat: '2', preu: '2,50', tipusIva: '4' }],
  ...canvis
});

describe('el perfil fiscal', () => {
  test('el formulari curt fa una configuració vàlida, amb el domicili fiscal i la data de pas', () => {
    expect(errorsDelPerfil(formulariBo())).toEqual([]);
    const config = configDeFormulari(formulariBo({ nomComercial: 'Forn Pepa', provincia: 'València' }));
    expect(llegixConfigEmpresa(config)).toMatchObject({
      esquema: ESQUEMA_CONFIG_EMPRESA, nif: CIF_EMISSOR, nom: 'Forn del Poble SL', nomComercial: 'Forn Pepa', domiciliFiscal: 'fiscal',
      domicilis: [{ id: 'fiscal', adreca: 'Plaça del Poble, 1', codiPostal: '46999', poblacio: 'Poble de Prova', provincia: 'València' }],
      facturacio: { dataPas: PAS }
    });
    // I tornada: el formulari d'una configuració desada.
    expect(formulariDeConfig(llegixConfigEmpresa(config))).toEqual(formulariBo({ nif: CIF_EMISSOR, nomComercial: 'Forn Pepa', provincia: 'València' }));
    expect(formulariDeConfig(null)).toEqual({ nif: '', nom: '', nomComercial: '', adreca: '', codiPostal: '', poblacio: '', provincia: '', dataPas: '' });
  });

  test('els errors, en llenguatge planer: també la data de pas que falta', () => {
    const errors = errorsDelPerfil(formulariBo({ nif: 'X', codiPostal: '9', dataPas: '' }));
    expect(errors.some((e) => e.includes('NIF'))).toBe(true);
    expect(errors.some((e) => e.includes('codi postal'))).toBe(true);
    expect(errors.at(-1)).toMatch(/^Falta la data de pas/);
  });

  test('sobre una configuració importada, es conserva el que el formulari no mostra', () => {
    const importada = {
      esquema: ESQUEMA_CONFIG_EMPRESA, nif: CIF_EMISSOR, nom: 'Forn', nomComercial: 'Vell',
      domicilis: [{ id: 'seu', adreca: 'A', codiPostal: '46999', poblacio: 'P' }, { id: 'obrador', adreca: 'B', codiPostal: '46998', poblacio: 'P' }],
      domiciliFiscal: 'seu', logo: 'logo-forn', facturacio: { prefixos: { F1: 'B' } }
    };
    const config = configDeFormulari(formulariBo({ nomComercial: '' }), importada);
    expect(config).toMatchObject({ domiciliFiscal: 'seu', logo: 'logo-forn', facturacio: { prefixos: { F1: 'B' }, dataPas: PAS } });
    expect(config.domicilis.map((d) => d.id)).toEqual(['seu', 'obrador']);
    expect(config.domicilis[0].adreca).toBe('Plaça del Poble, 1');
    expect('nomComercial' in config).toBe(false);
    expect(errorsDelPerfil(formulariBo(), importada)).toEqual([]);
  });

  test('importar un .json: la configuració o els errors', () => {
    expect(configDeJson('no és json').errors).toEqual(['El fitxer no és JSON: tria el fitxer de configuració de l’empresa.']);
    expect(configDeJson(JSON.stringify({ esquema: 'un altre' })).errors.length).toBeGreaterThan(0);
    const bona = configDeFormulari(formulariBo());
    expect(configDeJson(JSON.stringify(bona))).toEqual({ config: bona, errors: [] });
  });

  /* Troballa F4 de la revisió (261007): amb factures emeses, el perfil és fix. */
  test('amb factures emeses, el NIF i la data de pas no canvien: ni escrits ni importats', () => {
    const fixada = llegixConfigEmpresa(configDeFormulari(formulariBo()));
    // El nom, sí; i el NIF escrit amb minúscules o espais és el mateix.
    expect(errorsDelPerfil(formulariBo({ nom: 'Forn del Poble i Fills SL' }), fixada, fixada)).toEqual([]);
    expect(errorsDelPerfil(formulariBo({ nif: DNI_CLIENT }), fixada, fixada))
      .toEqual([`Ja hi ha factures emeses amb el NIF ${CIF_EMISSOR}: el NIF no es pot canviar.`]);
    expect(errorsDelPerfil(formulariBo({ dataPas: '2026-10-01' }), fixada, fixada))
      .toEqual(['Ja hi ha factures emeses des del pas del 07/10/2026: la data de pas no es pot canviar.']);
    // Sense factures (fixada null), tot es pot corregir.
    expect(errorsDelPerfil(formulariBo({ nif: DNI_CLIENT, dataPas: '2026-10-01' }), fixada)).toEqual([]);
    // Un .json de la mateixa empresa conserva la data de pas vigent; el d'una altra, es refusa.
    const importada = configDeFormulari(formulariBo({ nom: 'Forn Nou SL', dataPas: '2026-11-01' }));
    expect(formulariImportat(importada, fixada)).toEqual({ formulari: formulariBo({ nif: CIF_EMISSOR, nom: 'Forn Nou SL' }), errors: [] });
    expect(formulariImportat(importada, null).formulari.dataPas).toBe('2026-11-01');
    expect(formulariImportat(configDeFormulari(formulariBo({ nif: DNI_CLIENT })), fixada)).toEqual({
      formulari: null,
      errors: [`Este fitxer és d’una altra empresa (${DNI_CLIENT}). Ja hi ha factures emeses amb el NIF ${CIF_EMISSOR}, que no es pot canviar.`]
    });
  });
});

describe('el llegat', () => {
  test('els números d’un text: un per línia o separats per comes, amb els espais de dins', () => {
    expect(numerosDelText('F26 0001\nF260002\r\n\n  F26 0003 ; F26 0004,F26 0005')).toEqual(['F26 0001', 'F260002', 'F26 0003', 'F26 0004', 'F26 0005']);
    expect(numerosDelText(undefined)).toEqual([]);
  });

  test('el resum, una frase per sèrie', () => {
    expect(resumDelLlegat(sembraLlegat(['F26 0001', 'F26 0003', 'F26 0003']))).toEqual([
      'Sèrie F de 2026: fins al número 3 (2 factures, falta 1, 1 repetit). Queda tancada.'
    ]);
    expect(resumDelLlegat(sembraLlegat(['F25 0001', 'F26 0004']))).toEqual([
      'Sèrie F de 2025: fins al número 1 (1 factura). Queda tancada.',
      'Sèrie F de 2026: fins al número 4 (1 factura, falten 3). Queda tancada.'
    ]);
    expect(resumDelLlegat(sembraLlegat([]))).toEqual([]);
  });
});

describe('la factura', () => {
  test('les opcions del formulari: tres tipus i els tipus d’IVA del nucli', () => {
    expect(OPCIONS_TIPUS.map((o) => o.valor)).toEqual(['F1', 'F2', 'F3']);
    expect(OPCIONS_IVA.map((o) => o.valor)).toEqual(['4', '10', '21']);
  });

  test('una completa: client amb domicili, cèntims i mil·lèsimes', () => {
    const { dades, errors } = dadesDeFactura(facturaBona({ linies: [{ concepte: ' Pa ', quantitat: '2,5', preu: '1.234,56', tipusIva: '10' }], descripcio: ' Comanda ' }));
    expect(errors).toEqual([]);
    expect(dades).toEqual({
      tipus: 'F1', dataExpedicio: PAS, descripcio: 'Comanda',
      destinatari: { nif: DNI_CLIENT, nom: 'Bar de la Plaça', domicili: { adreca: 'Carrer Major, 2', codiPostal: '46998', poblacio: 'Poble de Prova' } },
      linies: [{ concepte: 'Pa', quantitat: 2.5, preuUnitari: 123456, tipusIva: 10 }]
    });
  });

  test('una simplificada: sense client i, si es vol, amb l’IVA inclòs', () => {
    expect(dadesDeFactura(facturaBona({ tipus: 'F2' })).dades).toMatchObject({ tipus: 'F2', ivaInclos: true });
    expect('destinatari' in dadesDeFactura(facturaBona({ tipus: 'F2' })).dades).toBe(false);
    expect('ivaInclos' in dadesDeFactura(facturaBona({ tipus: 'F2', ivaInclos: false })).dades).toBe(false);
    // L'IVA inclòs només és de la simplificada.
    expect('ivaInclos' in dadesDeFactura(facturaBona({ tipus: 'F1', ivaInclos: true })).dades).toBe(false);
  });

  test('una F3: els tiquets que substituïx, o l’error si no se n’ha triat cap', () => {
    expect(dadesDeFactura(facturaBona({ tipus: 'F3' })).errors).toEqual(['Tria quins tiquets substituïx esta factura.']);
    expect(dadesDeFactura(facturaBona({ tipus: 'F3', substituides: ['T2026-0001|2026-10-07'] })).dades.substituides)
      .toEqual([{ numSerie: 'T2026-0001', dataExpedicio: '2026-10-07' }]);
  });

  test('el que no es pot llegir es diu per línia, sense endevinar', () => {
    const { dades, errors } = dadesDeFactura(facturaBona({ linies: [{ concepte: 'A', quantitat: '0', preu: 'dotze', tipusIva: '21' }] }));
    expect(dades).toBeNull();
    expect(errors).toEqual([
      'Línia 1: la quantitat ha de ser un número més gran que zero (per exemple 1 o 2,5).',
      'Línia 1: el preu no s’entén; escriu-lo amb coma per als cèntims, com 12,50.'
    ]);
    expect(dadesDeFactura(facturaBona({ linies: [] })).errors).toEqual(['Afig almenys una línia.']);
    expect(dadesDeFactura(facturaBona({ tipus: 'R1' })).errors).toEqual(['Tria el tipus de factura.']);
    for (const [text, valor] of [['1', 1], ['2,5', 2.5], ['0.125', 0.125], ['2,5555', null], ['-1', null], ['', null], ['1e3', null]]) {
      expect([text, llegixQuantitat(text)]).toEqual([text, valor]);
    }
  });

  test('els totals i els errors són els del nucli, amb l’emissor de la configuració', () => {
    const config = llegixConfigEmpresa(configDeFormulari(formulariBo()));
    const { dades } = dadesDeFactura(facturaBona());
    expect(totalsDeFactura(dades, config)).toMatchObject({ baseTotal: 500, quotaTotal: 20, importTotal: 520 });
    expect(errorsDeFactura(dades, config, 'A2026-0001')).toEqual([]);
    // Amb l'IVA inclòs, el total és la suma dels preus.
    const tiquet = dadesDeFactura(facturaBona({ tipus: 'F2', linies: [{ concepte: 'Cafè', quantitat: '3', preu: '1,10', tipusIva: '10' }] })).dades;
    expect(totalsDeFactura(tiquet, config)).toMatchObject({ importTotal: 330, baseTotal: 300, quotaTotal: 30 });
    // Una completa sense client: el nucli ho diu, i no hi ha total.
    const senseClient = dadesDeFactura(facturaBona({ client: { nif: '', nom: '', adreca: '', codiPostal: '', poblacio: '' } })).dades;
    expect(totalsDeFactura(senseClient, config)).toBeNull();
    expect(errorsDeFactura(senseClient, config, 'A2026-0001').some((e) => e.includes('destinatari'))).toBe(true);
    expect(errorsDeFactura(dades, null, 'A2026-0001')).toEqual(['Falten les dades de l’empresa (pas 1).']);
    expect(totalsDeFactura(null, config)).toBeNull();
  });
});

describe('el llibre', () => {
  const alta = (numSerie, tipusFactura = 'F1', canvis = {}) => ({
    tipusRegistre: 'alta', idEmisor: CIF_EMISSOR, numSerie, dataExpedicio: PAS, tipusFactura, importTotal: 520,
    factura: { destinatari: tipusFactura === 'F2' ? null : { nom: 'Bar de la Plaça' } }, ...canvis
  });
  const anulacio = (numSerie) => ({ tipusRegistre: 'anulacio', idEmisor: CIF_EMISSOR, numSerie, dataExpedicio: PAS });

  test('les altes, de la més nova a la més antiga, amb el seu estat', () => {
    const files = filesDelLlibre([alta('A2026-0001'), alta('T2026-0001', 'F2'), anulacio('A2026-0001')]);
    expect(files.map(({ numSerie, data, tipus, client, total, anulada }) => ({ numSerie, data, tipus, client, total, anulada }))).toEqual([
      { numSerie: 'T2026-0001', data: '07/10/2026', tipus: 'Simplificada', client: 'Sense client', total: '5,20 €', anulada: false },
      { numSerie: 'A2026-0001', data: '07/10/2026', tipus: 'Completa', client: 'Bar de la Plaça', total: '5,20 €', anulada: true }
    ]);
    expect(filesDelLlibre(undefined)).toEqual([]);
  });

  test('els tiquets que una F3 pot substituir: simplificades vives', () => {
    expect(tiquetsSubstituibles([alta('T2026-0001', 'F2'), alta('T2026-0002', 'F2'), alta('A2026-0001'), anulacio('T2026-0002')]))
      .toEqual([{ clau: 'T2026-0001|2026-10-07', etiqueta: 'T2026-0001 · 07/10/2026 · 5,20 €' }]);
  });

  /* Troballa F5 de la revisió (261007): un tiquet ja substituït continuava a la llista. */
  test('un tiquet que ja substituïx una F3 viva no torna a eixir; anul·lada la F3, sí', () => {
    const f3 = alta('A2026-0002', 'F3', { factura: { destinatari: { nom: 'Bar' }, substituides: [{ numSerie: 'T2026-0001', dataExpedicio: PAS }] } });
    const llibre = [alta('T2026-0001', 'F2'), alta('T2026-0002', 'F2'), f3];
    expect(tiquetsSubstituibles(llibre).map((t) => t.clau)).toEqual(['T2026-0002|2026-10-07']);
    expect(tiquetsSubstituibles([...llibre, anulacio('A2026-0002')]).map((t) => t.clau)).toEqual(['T2026-0002|2026-10-07', 'T2026-0001|2026-10-07']);
  });

  test('l’estat de la cadena, sempre amb text', () => {
    expect(estatDeLaCadena(null)).toMatchObject({ to: 'info', insignia: 'Sense verificar' });
    expect(estatDeLaCadena({ valida: true, registres: 0, incidencies: [] })).toMatchObject({ to: 'exit', text: 'El llibre encara és buit.' });
    expect(estatDeLaCadena({ valida: true, registres: 3, incidencies: [] }).text).toMatch(/^Els 3 registres del llibre/);
    expect(estatDeLaCadena({ valida: true, registres: 1, incidencies: [] }).text).toBe('L’únic registre del llibre s’ha tornat a calcular: ningú no l’ha tocat.');
    expect(estatDeLaCadena({ valida: true, registres: 2, incidencies: [{ codi: 'RELLOTGE_ENRERE', numSerie: 'A2026-0002', missatge: 'Revisa el rellotge.' }] }))
      .toMatchObject({ to: 'avis', incidencies: ['A2026-0002: Revisa el rellotge.'] });
    const ambIncidencies = estatDeLaCadena({ valida: false, registres: 2, incidencies: [{ codi: 'TRUNCAMENT', numSerie: null, missatge: 'Falta el registre 5.' }] });
    expect(ambIncidencies).toMatchObject({ to: 'error', insignia: 'Amb incidències', incidencies: ['Falta el registre 5.'] });
    // Troballes F2 i F3 (261007): la via d'eixida és restaurar la còpia bona, i mentrestant no s'emet ni s'anul·la.
    expect(ambIncidencies.text).toMatch(/no es pot emetre ni anul·lar cap factura\. Si tens una còpia bona del llibre, restaura-la al pas 5/);
  });

  test('dates i imports com els llig la persona', () => {
    expect(dataCurta('2026-10-07')).toBe('07/10/2026');
    expect(dataCurta('7/10/2026')).toBe('');
    expect(euros(123456)).toBe('1.234,56 €');
  });
});
