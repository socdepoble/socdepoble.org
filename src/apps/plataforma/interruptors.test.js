/* Plataforma d'Apps Enxufables · els interruptors (interruptors.js) i la capa
   de la persona (preferenciesApps.js, sobre getVal/setVal de storage.js). */
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { delVal, getVal, setVal } from '../../config/storage.js';
import { manifestDeProva, manifestExternDeProva, manifestModulDeProva } from './__fixtures__/manifests.js';
import {
  ESTATS_APP, avaluaApp, avaluaInterruptor, esAmaDelDocument, estatApp, personaPotApagar, sanejaAppsDeclarades
} from './interruptors.js';
import { validaManifestApp } from './manifestApp.js';
import { APPS_INTERNES } from './registreApps.js';
import {
  CLAU_PREFERENCIES, _reiniciaPreferencies, desaAppApagada, desaInterruptorApagat, llegeixPreferencies,
  normalitzaPreferencies, subscriuPreferencies
} from './preferenciesApps.js';

const app = (canvis, origen) => validaManifestApp(manifestDeProva(canvis), { origen }).manifest;
const SEMPRE = () => true;
/* Un node de producció on tot està encés i la persona no ha tocat res. */
const PRODUCCIO = Object.freeze({ produccio: true, teCapacitat: SEMPRE, teDret: SEMPRE, amaDelDocument: true });

describe('estatApp · les capes', () => {
  test('els quatre estats, i res més', () => {
    expect(ESTATS_APP).toEqual(['disabled', 'unavailable', 'unsubscribed', 'available']);
    expect(estatApp(app(), PRODUCCIO)).toBe('available');
  });

  test('build: una interna amb carrega null no és al paquet', () => {
    expect(avaluaApp(app({ carrega: null }), PRODUCCIO)).toEqual({ estat: 'disabled', motiu: 'no-compilada' });
  });

  test('una externa no necessita carrega', () => {
    const externa = validaManifestApp(manifestExternDeProva(), { origen: 'externa' }).manifest;
    expect(estatApp(externa, PRODUCCIO)).toBe('available');
  });

  test('entorn: desenvolupament mai en producció; sí en desenvolupament', () => {
    const enObres = app({ entorn: 'desenvolupament' });
    expect(avaluaApp(enObres, PRODUCCIO)).toEqual({ estat: 'disabled', motiu: 'entorn-desenvolupament' });
    expect(estatApp(enObres, { ...PRODUCCIO, produccio: false })).toBe('available');
    /* Sense dir res, val com a producció: la porta segura. */
    expect(avaluaApp(enObres, {}).motiu).toBe('entorn-desenvolupament');
  });

  test('amfitrió: si declara una llista, només esta s’encén, també les apagades per defecte', () => {
    const apagada = app({ actiuPerDefecte: false });
    expect(avaluaApp(apagada, PRODUCCIO)).toEqual({ estat: 'disabled', motiu: 'apagada-per-defecte' });
    expect(estatApp(apagada, { ...PRODUCCIO, declaradesPerAmfitrio: ['prova'] })).toBe('available');
    expect(avaluaApp(app(), { ...PRODUCCIO, declaradesPerAmfitrio: ['altra'] }))
      .toEqual({ estat: 'disabled', motiu: 'amfitrio-no-la-declara' });
    expect(avaluaApp(app(), { ...PRODUCCIO, declaradesPerAmfitrio: [] }).motiu).toBe('amfitrio-no-la-declara');
  });

  test('sense declaració: en desenvolupament s’encén tot el compilat', () => {
    expect(estatApp(app({ actiuPerDefecte: false }), { ...PRODUCCIO, produccio: false })).toBe('available');
  });

  test('persona: només pot apagar', () => {
    const apagadaPerLaPersona = { apps: { prova: false }, interruptors: {} };
    expect(avaluaApp(app(), { ...PRODUCCIO, preferencies: apagadaPerLaPersona }))
      .toEqual({ estat: 'disabled', motiu: 'persona-apagada' });
    /* Un «true» de la persona no encén una app apagada per defecte… */
    const vol = { apps: { prova: true }, interruptors: {} };
    expect(estatApp(app({ actiuPerDefecte: false }), { ...PRODUCCIO, preferencies: vol })).toBe('disabled');
    /* …ni un premium sense dret. */
    expect(estatApp(app({ nivell: 'premium', dret: 'sdp.app.prova' }), { ...PRODUCCIO, teDret: () => false, preferencies: vol }))
      .toBe('unsubscribed');
  });

  test('capacitats del backend: sense elles, unavailable', () => {
    const ambAgenda = app({ capacitats: ['agenda'] });
    expect(avaluaApp(ambAgenda, { ...PRODUCCIO, teCapacitat: (nom) => nom !== 'agenda' }))
      .toEqual({ estat: 'unavailable', motiu: 'sense-capacitat' });
    expect(estatApp(ambAgenda, PRODUCCIO)).toBe('available');
  });

  test('salut: només si l’App és l’ama del document', () => {
    const salut = app({ dadesPersonals: 'salut' });
    expect(avaluaApp(salut, { ...PRODUCCIO, amaDelDocument: false }))
      .toEqual({ estat: 'unavailable', motiu: 'document-no-propi' });
    expect(avaluaApp(salut, { ...PRODUCCIO, amaDelDocument: undefined }).motiu).toBe('document-no-propi');
    expect(estatApp(salut, PRODUCCIO)).toBe('available');
  });

  /* Onada 6 (261009) · la guarda financera, com la de salut: la Gestoria mai
     dins d'un WordPress ni de l'iframe d'un tercer, on l'IndexedDB és de
     l'origen de l'amfitrió. Amb el seu motiu, que diu «financeres». */
  test('financeres: només si l’App és l’ama del document, amb el seu motiu', () => {
    const financera = app({ dadesPersonals: 'financeres' });
    expect(avaluaApp(financera, { ...PRODUCCIO, amaDelDocument: false }))
      .toEqual({ estat: 'unavailable', motiu: 'document-no-propi-financeres' });
    expect(avaluaApp(financera, { ...PRODUCCIO, amaDelDocument: undefined }).motiu).toBe('document-no-propi-financeres');
    expect(avaluaApp(financera, { ...PRODUCCIO, amaDelDocument: 'true' }).estat).toBe('unavailable');
    expect(avaluaApp(financera, PRODUCCIO)).toEqual({ estat: 'available', motiu: null });
    /* Un mòdul financer (sdp.modul.v1) porta la mateixa guarda. */
    const modul = validaManifestApp(manifestModulDeProva({ dadesPersonals: 'financeres' }), { origen: 'modul' }).manifest;
    expect(avaluaApp(modul, { ...PRODUCCIO, amaDelDocument: false }).motiu).toBe('document-no-propi-financeres');
    /* Sense dades personals, cap guarda de document. */
    expect(estatApp(app({ dadesPersonals: false }), { ...PRODUCCIO, amaDelDocument: false })).toBe('available');
  });

  test('la Gestoria real (dadesPersonals financeres) no s’obri dins d’una altra web, ni encesa per l’amfitrió', () => {
    const gestoria = APPS_INTERNES.find((candidata) => candidata.id === 'gestoria');
    expect(gestoria.dadesPersonals).toBe('financeres');
    const dinsDUnWordPress = { ...PRODUCCIO, produccio: false, declaradesPerAmfitrio: ['gestoria'], amaDelDocument: false };
    expect(avaluaApp(gestoria, dinsDUnWordPress)).toEqual({ estat: 'unavailable', motiu: 'document-no-propi-financeres' });
    /* Dins d'un iframe: esAmaDelDocument diu que no, encara que l'amfitrió declare manageDocumentHead. */
    const iframe = { self: 1, top: 2 };
    expect(avaluaApp(gestoria, { ...dinsDUnWordPress, amaDelDocument: esAmaDelDocument({ manageDocumentHead: true }, iframe) }).motiu)
      .toBe('document-no-propi-financeres');
    /* Al lloc propi, en desenvolupament: com fins ara. */
    expect(estatApp(gestoria, { ...dinsDUnWordPress, amaDelDocument: true })).toBe('available');
  });

  test('un mòdul no passa per la capa de build: el seu codi no és del paquet', () => {
    const modul = validaManifestApp(manifestModulDeProva(), { origen: 'modul' }).manifest;
    expect(avaluaApp(modul, PRODUCCIO)).toEqual({ estat: 'available', motiu: null });
    expect(personaPotApagar(modul, PRODUCCIO)).toBe(true);
    expect(avaluaApp(validaManifestApp(manifestModulDeProva({ entorn: 'desenvolupament' }), { origen: 'modul' }).manifest, PRODUCCIO).motiu)
      .toBe('entorn-desenvolupament');
  });

  test('premium: sense dret, unsubscribed i ho diu', () => {
    const premium = app({ nivell: 'premium', dret: 'sdp.app.prova' });
    expect(avaluaApp(premium, { ...PRODUCCIO, teDret: () => false })).toEqual({ estat: 'unsubscribed', motiu: 'sense-dret' });
    expect(estatApp(premium, { ...PRODUCCIO, teDret: (dret) => dret === 'sdp.app.prova' })).toBe('available');
    expect(estatApp(premium, { ...PRODUCCIO, teDret: undefined })).toBe('unsubscribed');
  });

  test('personaPotApagar: només quan la resta de capes l’encenen', () => {
    expect(personaPotApagar(app(), PRODUCCIO)).toBe(true);
    expect(personaPotApagar(app({ carrega: null }), PRODUCCIO)).toBe(false);
    expect(personaPotApagar(app({ actiuPerDefecte: false }), PRODUCCIO)).toBe(false);
    expect(personaPotApagar(app(), { ...PRODUCCIO, preferencies: { apps: { prova: false }, interruptors: {} } })).toBe(true);
  });
});

describe('interruptors interns d’una app', () => {
  const ambInterruptors = app({
    interruptors: [
      { id: 'cuina', titol: { ca: 'Cuina' } },
      { id: 'reserves', titol: { ca: 'Reserves' }, actiuPerDefecte: false },
      { id: 'escandalls', titol: { ca: 'Escandalls' }, nivell: 'premium', dret: 'sdp.app.prova.escandalls' }
    ]
  });

  test('encés per defecte, apagat per defecte, desconegut i premium', () => {
    expect(avaluaInterruptor(ambInterruptors, 'cuina', PRODUCCIO)).toEqual({ estat: 'available', motiu: null, actiu: true });
    expect(avaluaInterruptor(ambInterruptors, 'reserves', PRODUCCIO)).toMatchObject({ actiu: false, motiu: 'apagat-per-defecte' });
    expect(avaluaInterruptor(ambInterruptors, 'fantasma', PRODUCCIO)).toMatchObject({ actiu: false, motiu: 'desconegut' });
    expect(avaluaInterruptor(ambInterruptors, 'escandalls', { ...PRODUCCIO, teDret: () => false }))
      .toEqual({ estat: 'unsubscribed', motiu: 'sense-dret', actiu: false });
    expect(avaluaInterruptor(ambInterruptors, 'escandalls', PRODUCCIO).actiu).toBe(true);
  });

  test('la persona l’apaga, i un «true» seu no l’encén', () => {
    const preferencies = { apps: {}, interruptors: { prova: { cuina: false, reserves: true } } };
    expect(avaluaInterruptor(ambInterruptors, 'cuina', { ...PRODUCCIO, preferencies })).toMatchObject({ actiu: false, motiu: 'persona-apagat' });
    expect(avaluaInterruptor(ambInterruptors, 'reserves', { ...PRODUCCIO, preferencies }).actiu).toBe(false);
  });
});

describe('capa amfitrió i document', () => {
  test('sanejaAppsDeclarades: cadena o llista de slugs; la resta, fora', () => {
    expect(sanejaAppsDeclarades('bar  salut bar')).toEqual(['bar', 'salut']);
    expect(sanejaAppsDeclarades(['bar', 'Salut', '../x', 7, 'te-la'])).toEqual(['bar', 'te-la']);
    expect(Object.isFrozen(sanejaAppsDeclarades('bar'))).toBe(true);
    expect(sanejaAppsDeclarades(undefined)).toBeUndefined();
    expect(sanejaAppsDeclarades({ bar: true })).toBeUndefined();
    expect(sanejaAppsDeclarades('')).toEqual([]);
  });

  test('esAmaDelDocument: manageDocumentHead, sense __SDP_EMBEDDED__ i fora d’iframe', () => {
    const propia = { self: 1, top: 1 };
    expect(esAmaDelDocument({ manageDocumentHead: true }, propia)).toBe(true);
    expect(esAmaDelDocument({}, propia)).toBe(false);
    expect(esAmaDelDocument({ manageDocumentHead: 'true' }, propia)).toBe(false);
    expect(esAmaDelDocument({ manageDocumentHead: true }, { ...propia, __SDP_EMBEDDED__: true })).toBe(false);
    expect(esAmaDelDocument({ manageDocumentHead: true }, { self: 1, top: 2 })).toBe(false);
    expect(esAmaDelDocument({ manageDocumentHead: true }, null)).toBe(false);
    /* Sense finestra explícita, la del document (jsdom: fora d'iframe). */
    expect(esAmaDelDocument({ manageDocumentHead: true })).toBe(true);
    const iframeTancat = { self: 1, get top() { throw new Error('origen creuat'); } };
    expect(esAmaDelDocument({ manageDocumentHead: true }, iframeTancat)).toBe(false);
  });
});

describe('preferències de la persona (storage.js)', () => {
  beforeEach(() => { delVal(CLAU_PREFERENCIES); _reiniciaPreferencies(); });
  afterEach(() => { delVal(CLAU_PREFERENCIES); _reiniciaPreferencies(); });

  test('sense res desat, buides', () => {
    expect(llegeixPreferencies()).toEqual({ v: 1, apps: {}, interruptors: {} });
  });

  test('apagar i tornar a deixar com estava; només es guarda el false', () => {
    let avisos = 0;
    const desubscriu = subscriuPreferencies(() => { avisos += 1; });
    desaAppApagada('bar', true);
    expect(llegeixPreferencies().apps).toEqual({ bar: false });
    expect(getVal(CLAU_PREFERENCIES)).toEqual({ v: 1, apps: { bar: false }, interruptors: {} });
    desaAppApagada('bar', false);
    expect(llegeixPreferencies().apps).toEqual({});
    desaInterruptorApagat('bar', 'cuina', true);
    expect(getVal(CLAU_PREFERENCIES).interruptors).toEqual({ bar: { cuina: false } });
    desaInterruptorApagat('bar', 'cuina', false);
    expect(llegeixPreferencies().interruptors).toEqual({});
    expect(avisos).toBe(4);
    desubscriu();
    desaAppApagada('bar', true);
    expect(avisos).toBe(4);
  });

  test('un id no vàlid no s’escriu', () => {
    desaAppApagada('../bar', true);
    desaInterruptorApagat('bar', 'Cuina', true);
    expect(getVal(CLAU_PREFERENCIES)).toBeNull();
  });

  test('el que hi haja desat es llig net: versió, ids i només false', () => {
    setVal(CLAU_PREFERENCIES, { v: 1, apps: { bar: false, salut: true, 'X': false }, interruptors: { bar: { cuina: false, sala: 'no' }, '..': { a: false } } });
    _reiniciaPreferencies();
    expect(llegeixPreferencies()).toEqual({ v: 1, apps: { bar: false }, interruptors: { bar: { cuina: false } } });
    expect(normalitzaPreferencies({ v: 2, apps: { bar: false } })).toEqual({ v: 1, apps: {}, interruptors: {} });
    expect(normalitzaPreferencies('bar')).toEqual({ v: 1, apps: {}, interruptors: {} });
  });
});
