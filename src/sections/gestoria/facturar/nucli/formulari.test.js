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
  OPCIONS_CAUSA, OPCIONS_ESTAT_LLIBRE, OPCIONS_IVA, OPCIONS_PERIODE, OPCIONS_RETENCIO, OPCIONS_TIPUS, anysDelLlibre, avisDelClient, clauDelClient,
  clientBuit, clientDeDestinatari, clientsDelLlibre, commutaRectificada, configDeFormulari, configDeJson, dadesDeFactura, dataCurta, errorsDeFactura,
  errorsDelPerfil, estatDeLaCadena, euros, facturaBuida, filesDelLlibre, formulariDeConfig, formulariImportat, llegixQuantitat,
  mesOpcionsDe, numerosDelText, rectificables, resumDelLlegat, resumDelLlibre, tipusEfectiu, tiquetsSubstituibles, titolDelLlegat, totalsDeFactura
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
    // Prompt 261014_1605, G1 · PODER 5: sense jerga, la «data de pas» és el primer dia que factures ací.
    expect(errors.at(-1)).toMatch(/^Falta el primer dia que factures ací: /);
    expect(errors.join(' ')).not.toMatch(/data de pas/);
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

  /* Prompt 261014_1605, G1 · PODER 5: el pas 2 fet es mostra recollit, amb el que s'hi ha declarat en una línia. */
  test('el llegat desat, en una línia: cap, una sèrie o diverses', () => {
    expect(titolDelLlegat(sembraLlegat([]))).toBe('Sense factures d’abans: el programa comença de zero');
    expect(titolDelLlegat(null)).toBe('Sense factures d’abans: el programa comença de zero');
    expect(titolDelLlegat(sembraLlegat(['F26 0001', 'F26 0003']))).toBe('Una sèrie d’abans, tancada');
    expect(titolDelLlegat(sembraLlegat(['F25 0001', 'F26 0004']))).toBe('2 sèries d’abans, tancades');
  });
});

describe('la factura', () => {
  /* Onada 6 (261009): la rectificativa, l'exempció E1 i la retenció d'IRPF entren al formulari. */
  test('les opcions del formulari: quatre tipus, els tipus d’IVA del nucli i l’exempció E1, la retenció i la causa', () => {
    expect(OPCIONS_TIPUS.map((o) => o.valor)).toEqual(['F1', 'F2', 'F3', 'R']);
    expect(OPCIONS_IVA.map((o) => o.valor)).toEqual(['4', '10', '21', 'E1']);
    expect(OPCIONS_RETENCIO.map((o) => o.valor)).toEqual(['', '7', '15']);
    expect(OPCIONS_CAUSA.map((o) => o.valor)).toEqual(['R1', 'R2', 'R3', 'R4']);
  });

  /* Prompt 261014_1605, G1 · PODER 4: el tipus, la data de l'operació i la descripció, dins de «Més opcions». */
  test('«Més opcions»: la completa per defecte i tancat; obert, i dit al resum, si n’hi ha alguna triada', () => {
    expect(facturaBuida(PAS).tipus).toBe('F1');
    expect(mesOpcionsDe(facturaBuida(PAS))).toEqual({ obertes: false, resum: 'Més opcions' });
    expect(mesOpcionsDe(facturaBuida(PAS, 'F2'))).toEqual({ obertes: true, resum: 'Més opcions: Factura simplificada (tiquet)' });
    expect(mesOpcionsDe(facturaBona({ tipus: 'R', dataOperacio: '2026-10-05', descripcio: ' Comanda ' })))
      .toEqual({ obertes: true, resum: 'Més opcions: Factura rectificativa, data de l’operació, descripció' });
    expect(mesOpcionsDe(facturaBona({ descripcio: '   ' }))).toEqual({ obertes: false, resum: 'Més opcions' });
    expect(mesOpcionsDe(undefined)).toEqual({ obertes: false, resum: 'Més opcions' });
  });

  test('la retenció d’IRPF, la data de l’operació i l’exempció arriben al nucli; la simplificada no porta retenció', () => {
    const config = llegixConfigEmpresa(configDeFormulari(formulariBo()));
    const { dades } = dadesDeFactura(facturaBona({ retencio: '15', dataOperacio: '2026-10-05' }));
    expect(dades).toMatchObject({ retencio: { percentatge: 15 }, dataOperacio: '2026-10-05' });
    // 2 × 2,50 € al 4 %: base 5,00, IVA 0,20, total 5,20; retenció del 15 % de la base, 0,75; a pagar, 4,45.
    expect(totalsDeFactura(dades, config)).toMatchObject({ importTotal: 520, retencio: { percentatge: 15, import: 75 }, liquid: 445 });
    // La mateixa data que la factura no es repetix.
    expect('dataOperacio' in dadesDeFactura(facturaBona({ dataOperacio: PAS })).dades).toBe(false);
    expect('retencio' in dadesDeFactura(facturaBona({ tipus: 'F2', retencio: '15' })).dades).toBe(false);
    expect(dadesDeFactura(facturaBona({ retencio: '19' })).errors).toEqual(['Tria la retenció d’IRPF de la llista.']);
    const exempta = dadesDeFactura(facturaBona({ linies: [{ concepte: 'Classe', quantitat: '1', preu: '30,00', tipusIva: 'E1' }] })).dades;
    expect(exempta.linies).toEqual([{ concepte: 'Classe', quantitat: 1, preuUnitari: 3000, exempcio: 'E1' }]);
    expect(totalsDeFactura(exempta, config)).toMatchObject({ baseTotal: 3000, quotaTotal: 0, importTotal: 3000 });
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

  /* Onada 6 (261009): la rectificativa des del formulari. */
  test('la rectificativa: les factures vives, R5 si són tiquets o la causa si no, i l’import rectificat de les triades', () => {
    const domicili = { adreca: 'Carrer Major, 2', codiPostal: '46998', poblacio: 'Poble de Prova' };
    const f1 = alta('A2026-0001', 'F1', { factura: { destinatari: { nif: DNI_CLIENT, nom: 'Bar de la Plaça', domicili }, baseTotal: 500, quotaTotal: 20 } });
    const t1 = alta('T2026-0001', 'F2', { factura: { destinatari: null, baseTotal: 300, quotaTotal: 30 } });
    const llibre = [f1, t1, alta('A2026-0002'), anulacio('A2026-0002')];
    expect(rectificables(llibre).map((r) => [r.clau, r.simplificada])).toEqual([['T2026-0001|2026-10-07', true], ['A2026-0001|2026-10-07', false]]);
    expect(rectificables(llibre)[1]).toMatchObject({ etiqueta: 'A2026-0001 · 07/10/2026 · Bar de la Plaça · 5,20 €', base: 500, quota: 20 });

    const rect = (canvis) => facturaBona({ tipus: 'R', ...canvis });
    const A1 = 'A2026-0001|2026-10-07';
    const T1 = 'T2026-0001|2026-10-07';
    expect(tipusEfectiu(rect(), llibre)).toBe('R1');
    expect(tipusEfectiu(rect({ causa: 'R3', rectificades: [A1] }), llibre)).toBe('R3');
    expect(tipusEfectiu(rect({ causa: 'R3', rectificades: [T1] }), llibre)).toBe('R5');
    expect(tipusEfectiu(facturaBona(), llibre)).toBe('F1');

    // Per substitució: l'import de la rectificada viatja, i el nucli l'accepta amb l'emissor de la configuració.
    const config = llegixConfigEmpresa(configDeFormulari(formulariBo()));
    const perSubstitucio = dadesDeFactura(rect({ rectificades: [A1] }), llibre).dades;
    expect(perSubstitucio).toMatchObject({
      tipus: 'R1', tipusRectificativa: 'S', rectificades: [{ numSerie: 'A2026-0001', dataExpedicio: PAS }], importRectificat: { base: 500, quota: 20 }
    });
    expect(errorsDeFactura(perSubstitucio, config, 'R2026-0001')).toEqual([]);
    // Per diferències: el que resta, amb el preu en negatiu; sense import rectificat.
    const perDiferencies = dadesDeFactura(rect({
      modalitat: 'I', rectificades: [A1], linies: [{ concepte: 'Descompte', quantitat: '1', preu: '-1,00', tipusIva: '4' }]
    }), llibre).dades;
    expect(perDiferencies).toMatchObject({ tipus: 'R1', tipusRectificativa: 'I', linies: [{ preuUnitari: -100 }] });
    expect('importRectificat' in perDiferencies).toBe(false);
    expect(totalsDeFactura(perDiferencies, config)).toMatchObject({ baseTotal: -100, quotaTotal: -4, importTotal: -104 });
    // La R5 corregix tiquets: sense client i, si es vol, amb l'IVA inclòs.
    const r5 = dadesDeFactura(rect({ rectificades: [T1] }), llibre).dades;
    expect(r5).toMatchObject({ tipus: 'R5', ivaInclos: true, importRectificat: { base: 300, quota: 30 } });
    expect('destinatari' in r5).toBe(false);

    // Els errors, en llenguatge planer.
    expect(dadesDeFactura(rect(), llibre).errors).toEqual(['Tria quina factura corregix esta rectificativa.']);
    expect(dadesDeFactura(rect({ rectificades: ['A2026-0002|2026-10-07'] }), llibre).errors[0]).toMatch(/^Alguna de les factures triades ja no es pot rectificar/);
    expect(dadesDeFactura(rect({ rectificades: [A1, T1] }), llibre).errors)
      .toEqual(['Una rectificativa corregix tiquets o factures completes, no les dues coses alhora.']);
    expect(dadesDeFactura(rect({ modalitat: 'X', rectificades: [A1] }), llibre).errors[0]).toMatch(/^Tria si la rectificativa/);
  });

  /* Correcció de la revisió (261009): triar A, desfer-la i triar B deixava el client d'A, i es podien
     triar factures de clients diferents en una sola rectificativa. */
  test('la rectificativa: el client copiat va darrere de la tria, el que s’escriu a mà no, i un sol client', () => {
    const domicili = { adreca: 'Carrer Major, 2', codiPostal: '46998', poblacio: 'Poble de Prova' };
    const altreNif = ['8765', '4321', 'X'].join('');
    const bar = { nif: DNI_CLIENT, nom: 'Bar de la Plaça', domicili };
    const casino = { nif: altreNif, nom: 'Casino del Poble', domicili: { ...domicili, adreca: 'Plaça Major, 9' } };
    const llibre = [
      alta('A2026-0001', 'F1', { factura: { destinatari: bar, baseTotal: 500, quotaTotal: 20 } }),
      alta('A2026-0002', 'F1', { factura: { destinatari: casino, baseTotal: 700, quotaTotal: 70 } }),
      alta('A2026-0003', 'F1', { factura: { destinatari: bar, baseTotal: 100, quotaTotal: 10 } }),
      alta('T2026-0001', 'F2', { factura: { destinatari: null, baseTotal: 300, quotaTotal: 30 } })
    ];
    const [A1, A2, A3, T1] = ['A2026-0001', 'A2026-0002', 'A2026-0003', 'T2026-0001'].map((n) => `${n}|${PAS}`);
    const buit = { ...facturaBuida(PAS), tipus: 'R', linies: facturaBona().linies };
    expect(buit.client).toEqual(clientBuit());

    // Tria A: es copia el seu client. Desfà-la: el client torna a ser buit. Tria B: el de B.
    const ambA = commutaRectificada(buit, A1, llibre);
    expect(ambA).toMatchObject({ rectificades: [A1], client: clientDeDestinatari(bar), clientCopiat: true });
    const senseRes = commutaRectificada(ambA, A1, llibre);
    expect(senseRes).toMatchObject({ rectificades: [], client: clientBuit(), clientCopiat: false });
    const ambB = commutaRectificada(senseRes, A2, llibre);
    expect(ambB).toMatchObject({ rectificades: [A2], client: clientDeDestinatari(casino), clientCopiat: true });
    expect(avisDelClient(ambB, llibre)).toBeNull();
    // Tria A i, damunt, B: el client és el de la primera, i no s'emet (clients diferents).
    const ambAiB = commutaRectificada(ambA, A2, llibre);
    expect(ambAiB).toMatchObject({ rectificades: [A1, A2], client: clientDeDestinatari(bar) });
    expect(dadesDeFactura(ambAiB, llibre).errors)
      .toEqual(['Una rectificativa corregix factures d’un sol client, i les triades són de clients diferents: fes-ne una per a cada client.']);
    // Dues del mateix client, sí; i un tiquet sense client no arrossega cap client.
    expect(dadesDeFactura(commutaRectificada(ambA, A3, llibre), llibre).errors).toEqual([]);
    expect(commutaRectificada(buit, T1, llibre)).toMatchObject({ client: clientBuit(), clientCopiat: false });

    // Un client escrit a mà (corregir-ne les dades) no es toca en canviar la tria, i es diu que no és el de la factura.
    const corregit = { ...ambA, client: { ...ambA.client, nom: 'Bar de la Plaça SL' }, clientCopiat: false };
    const avis = avisDelClient(corregit, llibre);
    expect(avis).toEqual({
      text: `La factura que corregixes és de Bar de la Plaça (NIF ${DNI_CLIENT}). Deixa el client així només si el que corregixes són les seues dades.`,
      client: clientDeDestinatari(bar)
    });
    const desfeta = commutaRectificada(corregit, A1, llibre);
    expect(desfeta).toMatchObject({ rectificades: [], client: corregit.client });
    expect(commutaRectificada(desfeta, A2, llibre).client).toEqual(corregit.client);
    expect(avisDelClient(commutaRectificada(desfeta, A2, llibre), llibre)?.client).toEqual(clientDeDestinatari(casino));
    // El NIF es compara net: espais, guions i minúscules no fan un altre client.
    expect(avisDelClient({ ...ambA, client: { ...ambA.client, nif: ` ${DNI_CLIENT.slice(0, 8)}-${DNI_CLIENT.slice(8).toLowerCase()} ` } }, llibre)).toBeNull();
    // Fora d'una rectificativa, o sense cap factura triada, no hi ha avís.
    expect(avisDelClient({ ...corregit, tipus: 'F1' }, llibre)).toBeNull();
    expect(avisDelClient(buit, llibre)).toBeNull();
  });

  /* Prompt 261014_1605, G1 · PODER 2: «A qui?» sense tornar a escriure el client, i sense cap magatzem nou. */
  test('els clients del llibre: un per NIF net, el de la factura viva més nova, en ordre alfabètic; ni anul·lades ni tiquets', () => {
    const domicili = { adreca: 'Carrer Major, 2', codiPostal: '46998', poblacio: 'Poble de Prova' };
    const altreNif = ['8765', '4321', 'X'].join('');
    const tercerNif = ['1111', '2222', 'R'].join('');
    const llibre = [
      alta('A2026-0001', 'F1', { factura: { destinatari: { nif: DNI_CLIENT, nom: 'Bar de la Plaça', domicili } } }),
      alta('A2026-0002', 'F1', { factura: { destinatari: { nif: altreNif, nom: 'Casino del Poble', domicili } } }),
      alta('A2026-0003', 'F1', { factura: { destinatari: { nif: ` ${DNI_CLIENT.toLowerCase()} `, nom: 'Bar de la Plaça SL', domicili } } }),
      alta('T2026-0001', 'F2'),
      alta('A2026-0004', 'F1', { factura: { destinatari: { nif: tercerNif, nom: 'Ajuntament', domicili } } }),
      anulacio('A2026-0004'),
      alta('A2026-0005', 'F1', { factura: { destinatari: { nif: altreNif, nom: 'Casino nou', domicili } } }),
      anulacio('A2026-0005')
    ];
    const clients = clientsDelLlibre(llibre);
    // El Bar, amb les dades de la més nova (el NIF es compara net); el Casino, de la viva (l'anul·lada no compta).
    expect(clients.map(({ clau, etiqueta }) => [clau, etiqueta])).toEqual([
      [DNI_CLIENT, `Bar de la Plaça SL · ${DNI_CLIENT}`],
      [altreNif, `Casino del Poble · ${altreNif}`]
    ]);
    expect(clients[1].client).toEqual(clientDeDestinatari({ nif: altreNif, nom: 'Casino del Poble', domicili }));
    expect(clientsDelLlibre(undefined)).toEqual([]);

    // Quin és el del formulari: tots els camps iguals, el NIF net; si se n'ha canviat un, cap.
    expect(clauDelClient(clients, clients[1].client)).toBe(altreNif);
    expect(clauDelClient(clients, { ...clients[1].client, nif: ` ${altreNif.toLowerCase()}` })).toBe(altreNif);
    expect(clauDelClient(clients, { ...clients[1].client, nom: 'Casino' })).toBe('');
    expect(clauDelClient(clients, clientBuit())).toBe('');
    expect(clauDelClient(undefined, clientBuit())).toBe('');
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

/* Gauntlet 261016, Onada 3 (MCR o3_tpv_gestoria.2.1): el llibre net a l'estil Holded. Un llibre de
   prova amb totes les menes: una completa amb retenció, una anul·lada, un tiquet i la F3 que el
   substituïx, una rectificativa per diferències i una per substitució, i una factura de l'any d'abans. */
describe('el llibre net: imports, període i totals', () => {
  const ALTRE_NIF = ['8765', '4321', 'X'].join('');
  const TERCER_NIF = ['1111', '2222', 'R'].join('');
  const BAR = { nif: DNI_CLIENT, nom: 'Bar de la Plaça' };
  const CASINO = { nif: ALTRE_NIF, nom: 'Casino del Poble' };
  const CAFE = { nif: TERCER_NIF, nom: 'Cafè del Racó' };
  const alta = (numSerie, tipusFactura, data, { base, quota, client = BAR, retencio = 0, ...factura }) => ({
    tipusRegistre: 'alta', idEmisor: CIF_EMISSOR, numSerie, dataExpedicio: data, tipusFactura, quotaTotal: quota, importTotal: base + quota,
    factura: {
      destinatari: ['F2', 'R5'].includes(tipusFactura) ? null : client, baseTotal: base, quotaTotal: quota,
      ...(retencio ? { retencio: { percentatge: 15, import: retencio } } : {}), ...factura
    }
  });
  const ref = (numSerie, dataExpedicio) => ({ numSerie, dataExpedicio });
  const LLIBRE = [
    alta('A2025-0009', 'F1', '2025-12-30', { base: 100, quota: 21 }),
    alta('A2026-0001', 'F1', '2026-02-10', { base: 1000, quota: 210, retencio: 150 }),
    alta('A2026-0002', 'F1', '2026-05-03', { base: 500, quota: 20 }),
    { tipusRegistre: 'anulacio', idEmisor: CIF_EMISSOR, numSerie: 'A2026-0002', dataExpedicio: '2026-05-03' },
    alta('T2026-0001', 'F2', '2026-07-01', { base: 300, quota: 30 }),
    alta('A2026-0003', 'F3', '2026-07-15', { base: 300, quota: 30, client: CASINO, substituides: [ref('T2026-0001', '2026-07-01')] }),
    alta('A2026-0004', 'F1', '2026-07-20', { base: 200, quota: 42, client: CAFE }),
    alta('R2026-0001', 'R1', '2026-08-01', { base: -100, quota: -21, client: CAFE, tipusRectificativa: 'I', rectificades: [ref('A2026-0004', '2026-07-20')] }),
    alta('R2026-0002', 'R1', '2026-11-20', {
      base: 1200, quota: 252, tipusRectificativa: 'S', rectificades: [ref('A2026-0001', '2026-02-10')], importRectificat: { base: 1000, quota: 210 }
    })
  ];
  const files = filesDelLlibre(LLIBRE);
  const fila = (numSerie) => files.find((f) => f.numSerie === numSerie);
  const numeros = (resum) => resum.files.map((f) => f.numSerie);

  test('cada fila porta el període, el NIF i els imports en cèntims crus, i el que suma al període', () => {
    expect(fila('A2026-0001')).toMatchObject({
      tipusFactura: 'F1', any: 2026, trimestre: 1, nif: DNI_CLIENT, base: 1000, quota: 210, retencio: 150, importTotal: 1210,
      efecte: { base: 1000, quota: 210, retencio: 150, total: 1210 }, substituix: false
    });
    // La de l'any d'abans és del 4t trimestre del 2025; el tiquet no té client ni NIF.
    expect(fila('A2025-0009')).toMatchObject({ any: 2025, trimestre: 4 });
    expect(fila('T2026-0001')).toMatchObject({ client: 'Sense client', nif: '', trimestre: 3 });
    // L'anul·lada no suma res, però es veu amb els seus imports.
    expect(fila('A2026-0002')).toMatchObject({ anulada: true, base: 500, quota: 20, efecte: { base: 0, quota: 0, retencio: 0, total: 0 } });
    // La rectificativa per diferències suma el que porta, amb el seu signe.
    expect(fila('R2026-0001')).toMatchObject({ base: -100, quota: -21, efecte: { base: -100, quota: -21, retencio: 0, total: -121 }, substituix: false });
    // La F3 substituïx el tiquet (la mateixa venda): suma la diferència, ací zero.
    expect(fila('A2026-0003')).toMatchObject({ efecte: { base: 0, quota: 0, retencio: 0, total: 0 }, substituix: true });
    // La rectificativa per substitució suma el que canvia: la seua menys la rectificada, també la retenció.
    expect(fila('R2026-0002')).toMatchObject({ efecte: { base: 200, quota: 42, retencio: -150, total: 242 }, substituix: true });
  });

  test('una factura que en substituïx una d’anul·lada suma sencera: l’anul·lada ja no sumava', () => {
    const llibre = [...LLIBRE, { tipusRegistre: 'anulacio', idEmisor: CIF_EMISSOR, numSerie: 'T2026-0001', dataExpedicio: '2026-07-01' }];
    expect(filesDelLlibre(llibre).find((f) => f.numSerie === 'A2026-0003')).toMatchObject({ efecte: { base: 300, quota: 30, total: 330 }, substituix: false });
  });

  test('els anys, del més nou al més antic; les opcions de període i d’estat', () => {
    expect(anysDelLlibre(files)).toEqual([2026, 2025]);
    expect(anysDelLlibre(undefined)).toEqual([]);
    expect(OPCIONS_PERIODE.map((o) => o.valor)).toEqual(['1', '2', '3', '4', 'any']);
    expect(OPCIONS_ESTAT_LLIBRE.map((o) => o.valor)).toEqual(['totes', 'emeses', 'anulades', 'rectificatives']);
  });

  test('els totals de l’any: les anul·lades fora i les rectificatives amb el seu signe; la mateixa venda no es compta dues vegades', () => {
    const any = resumDelLlibre(files, { any: 2026 });
    expect(any.files).toHaveLength(7);
    // El que s'ha venut de veres: A1 substituïda per R2 (1.200 + 252), el tiquet en la F3 (300 + 30) i A4 menys R1 (100 + 21).
    expect(any.totals).toEqual({ base: 1600, quota: 303, retencio: 0, total: 1903 });
    expect(any).toMatchObject({ anulades: 1, ambSubstitucions: true });
    // Sense any, tot el llibre.
    expect(resumDelLlibre(files).totals).toEqual({ base: 1700, quota: 324, retencio: 0, total: 2024 });
    expect(resumDelLlibre(files, { any: 2025 })).toMatchObject({ totals: { base: 100, quota: 21, retencio: 0, total: 121 }, anulades: 0, ambSubstitucions: false });
  });

  test('un trimestre: només les seues factures i els seus totals', () => {
    const t3 = resumDelLlibre(files, { any: 2026, trimestre: 3 });
    expect(numeros(t3)).toEqual(['R2026-0001', 'A2026-0004', 'A2026-0003', 'T2026-0001']);
    expect(t3.totals).toEqual({ base: 400, quota: 51, retencio: 0, total: 451 });
    // El 2n trimestre només té l'anul·lada: no suma res.
    expect(resumDelLlibre(files, { any: 2026, trimestre: 2 })).toMatchObject({ totals: { base: 0, quota: 0, retencio: 0, total: 0 }, anulades: 1 });
    expect(resumDelLlibre(files, { any: 2026, trimestre: 4 }).totals).toEqual({ base: 200, quota: 42, retencio: -150, total: 242 });
  });

  test('l’estat: les vives, les anul·lades o les rectificatives; un estat desconegut les mostra totes', () => {
    expect(numeros(resumDelLlibre(files, { any: 2026, estat: 'anulades' }))).toEqual(['A2026-0002']);
    expect(numeros(resumDelLlibre(files, { any: 2026, estat: 'rectificatives' }))).toEqual(['R2026-0002', 'R2026-0001']);
    expect(numeros(resumDelLlibre(files, { any: 2026, estat: 'emeses' }))).not.toContain('A2026-0002');
    expect(resumDelLlibre(files, { any: 2026, estat: 'emeses' }).totals).toEqual(resumDelLlibre(files, { any: 2026 }).totals);
    expect(resumDelLlibre(files, { any: 2026, estat: 'qualsevol' }).files).toHaveLength(7);
  });

  test('la cerca: pel número, el client o el NIF, sense majúscules ni accents', () => {
    expect(numeros(resumDelLlibre(files, { text: '  CASINO ' }))).toEqual(['A2026-0003']);
    expect(numeros(resumDelLlibre(files, { text: 'cafe del raco' }))).toEqual(['R2026-0001', 'A2026-0004']);
    expect(numeros(resumDelLlibre(files, { text: 'r2026' }))).toEqual(['R2026-0002', 'R2026-0001']);
    expect(numeros(resumDelLlibre(files, { text: DNI_CLIENT.toLowerCase() }))).toEqual(['R2026-0002', 'A2026-0002', 'A2026-0001', 'A2025-0009']);
    // La cerca també es combina amb el període, i els totals són els de les trobades.
    expect(resumDelLlibre(files, { any: 2026, trimestre: 3, text: 'racó' }).totals).toEqual({ base: 100, quota: 21, retencio: 0, total: 121 });
    expect(resumDelLlibre(files, { text: 'cap client' }).files).toEqual([]);
    expect(resumDelLlibre(undefined)).toEqual({ files: [], totals: { base: 0, quota: 0, retencio: 0, total: 0 }, anulades: 0, ambSubstitucions: false });
  });
});
