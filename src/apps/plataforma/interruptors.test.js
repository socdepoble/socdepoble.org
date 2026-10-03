/* Plataforma d'Apps Enxufables · els interruptors (interruptors.js) i la capa
   de la persona (preferenciesApps.js, sobre getVal/setVal de storage.js). */
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { delVal, getVal, setVal } from '../../config/storage.js';
import { manifestDeProva, manifestExternDeProva } from './__fixtures__/manifests.js';
import {
  ESTATS_APP, avaluaApp, avaluaInterruptor, esAmaDelDocument, estatApp, personaPotApagar, sanejaAppsDeclarades
} from './interruptors.js';
import { validaManifestApp } from './manifestApp.js';
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
    /* Les financeres no porten esta guarda. */
    expect(estatApp(app({ dadesPersonals: 'financeres' }), { ...PRODUCCIO, amaDelDocument: false })).toBe('available');
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
