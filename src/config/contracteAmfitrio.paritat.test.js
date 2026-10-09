/* Contracte d'amfitrió sdp.amfitrio.v1 · paritat amb el codi que l'aplica.
   El contracte (contracteAmfitrio.js) és la llista; ací es comprova que
   l'element (PedraSecaEmbed.jsx) i l'arrencada (host.js) diuen el mateix.
   Un atribut, una clau de config, un verb de la cua, una ordre d'iframe, una
   clau de l'API o un esdeveniment nou a una banda sense l'altra posa açò en roig.
   L'App i els proveïdors no hi pinten res. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test, vi } from 'vitest';

vi.mock('../css/index.css?inline', () => ({ default: '.sdp-root { display: block; }' }));
vi.mock('../app/App.jsx', () => ({ default: () => null }));
vi.mock('../app/contexts/UIContext.jsx', () => ({ UIProvider: ({ children }) => children }));
vi.mock('../app/contexts/SessionContext.jsx', () => ({ SessionProvider: ({ children }) => children }));
vi.mock('../app/contexts/IdentitatContext.jsx', () => ({ IdentitatProvider: ({ children }) => children }));
vi.mock('../data/identitat.js', () => ({ adoptaSessioExterna: vi.fn(() => true), esborraSessio: vi.fn(), configuraBackendSessio: vi.fn() }));

import { ATRIBUTS, CLAUS_PERMESES, ESDEVENIMENTS_REEMESOS, defineCustomElement } from '../PedraSecaEmbed.jsx';
import { ORDRES_IFRAME, VERBS_CUA, exposaGlobal } from '../host.js';
import { _reiniciaTelemetria, registraEsdeveniment } from '../data/telemetria.js';
import { manifestModulDeProva } from '../apps/plataforma/__fixtures__/manifests.js';
import { ESQUEMA_MODUL } from '../apps/plataforma/contracteNucli.js';
import { llistaApps, retiraAppExterna } from '../apps/plataforma/registreApps.js';
import { MARCA_DEL_CARREGADOR, instalaCarregador } from './carregadorDelPaquet.js';
import { CONTRACTE_AMFITRIO_V1 as C, tapaRuta } from './contracteAmfitrio.js';

const ordenat = (llista) => [...llista].sort();

describe('l’element <soc-de-poble>', () => {
  test('els atributs de configuració són exactament marcatge ∪ opt-in ∪ propis de Sóc de Poble (llista tancada)', () => {
    expect(ordenat(Object.keys(ATRIBUTS))).toEqual(ordenat([...C.atributs, ...C.atributsOptIn, ...C.atributsPropisDeSdP]));
  });

  test('observedAttributes = atributs de configuració ∪ config i config-id ∪ pinta-amfitrio', () => {
    defineCustomElement();
    const observats = customElements.get(C.element).observedAttributes;
    expect(ordenat(observats)).toEqual(ordenat([...Object.keys(ATRIBUTS), ...C.atributsDeConfig, 'pinta-amfitrio']));
    // `arrencada` és de control però no s'observa: host.js el llig una vegada, en arrencar.
    expect(observats).not.toContain('arrencada');
  });

  test('les claus de configuració són exactament les de l’amfitrió ∪ les de Sóc de Poble', () => {
    expect(ordenat(CLAUS_PERMESES)).toEqual(ordenat([...C.clausDeConfig.amfitrio, ...C.clausDeConfig.propiesDeSdP]));
  });

  test('cada atribut de configuració porta a una clau permesa', () => {
    for (const [atribut, clau] of Object.entries(ATRIBUTS)) expect(CLAUS_PERMESES.has(clau), `${atribut} → ${clau}`).toBe(true);
  });

  test('els esdeveniments que l’element emet a l’amfitrió són els del contracte', () => {
    expect(ordenat(ESDEVENIMENTS_REEMESOS.map((nom) => nom.replace(':', '-')))).toEqual(ordenat(C.esdeveniments.element));
  });

  /* WP-R2: la propietat JS i els mètodes de la instància són canal d'entrada. */
  test('la propietat i els mètodes públics de l’element són exactament els del contracte (elementApi)', () => {
    defineCustomElement();
    const proto = customElements.get(C.element).prototype;
    const cicleDeVida = new Set(['constructor', 'connectedCallback', 'disconnectedCallback', 'attributeChangedCallback']);
    const publics = Object.getOwnPropertyNames(proto).filter((nom) => !cicleDeVida.has(nom) && !nom.startsWith('_'));
    const descriu = (nom) => Object.getOwnPropertyDescriptor(proto, nom);
    expect(ordenat(publics.filter((nom) => typeof descriu(nom).value === 'function'))).toEqual(ordenat(C.elementApi.metodes));
    expect(ordenat(publics.filter((nom) => descriu(nom).get || descriu(nom).set))).toEqual(ordenat(C.elementApi.propietats));
  });
});

/* WP-R1: sdp-navega tapa la ruta amb el mateix criteri que la telemetria
   (data/telemetria.js:rutaTapada, que no s'exporta: es llig la URL de
   l'intent que publica sense enviar res, amb la telemetria sense configurar). */
describe('la ruta tapada', () => {
  test.each([
    ['/'], ['/xat'], ['/xat/'], ['/cerca?q=nom-sintetic'], ['/mur?filtre=tot#ancora'], ['/perfil/agent-sintetic-1'],
    ['/perfil/agent-sintetic-1?x=1'], ['/pobles/sella/xat'], ['/?q=nom-sintetic'], ['/notes/n1#seccio']
  ])('tapaRuta(%j) és la de la telemetria', (ruta) => {
    try {
      const intent = registraEsdeveniment('sonda-de-paritat', null, { ruta, cfg: { actiu: false } });
      expect(intent.motiu).toBe('sense-configurar');
      expect(tapaRuta(ruta)).toBe(intent.url);
    } finally {
      _reiniciaTelemetria();
    }
  });
});

describe('l’arrencada (host.js)', () => {
  test('els verbs de la cua són exactament els classificats', () => {
    expect(ordenat(VERBS_CUA)).toEqual(ordenat(Object.keys(C.cua.verbs)));
  });

  test('les ordres del pont d’iframe són les que atén el gestor de missatges', () => {
    expect(ordenat(ORDRES_IFRAME)).toEqual(ordenat(C.ordresIframe));
    const font = readFileSync(path.join(process.cwd(), 'src/host.js'), 'utf8');
    const ateses = [...font.matchAll(/cmd === '([^']+)'/g)].map((m) => m[1]);
    expect(ordenat(new Set(ateses))).toEqual(ordenat(C.ordresIframe));
  });

  test('l’API congelada window.SocDePoble porta exactament les claus del contracte', () => {
    const api = exposaGlobal({});
    expect(Object.isFrozen(api)).toBe(true);
    expect(ordenat(Object.keys(api))).toEqual(ordenat(C.api.claus));
  });

  /* Onada 6 (261009, ADR-2026-12) · els mòduls opcionals: claus additives,
     al final i en este ordre (el provisional les reproduïx tal qual). */
  test('mòduls: el contracte nomena les claus de l’API, l’esquema és el del nucli i el Model B no canvia', () => {
    expect(C.moduls).toEqual({ esquema: ESQUEMA_MODUL, registra: 'registraModul', lliura: 'lliuraCos', nucli: 'nucli' });
    expect(C.api.claus.slice(-3)).toEqual([C.moduls.registra, C.moduls.lliura, C.moduls.nucli]);
    expect(C.api.claus.slice(0, 11)).toEqual(['configura', 'arrenca', 'arrencaAuto', 'deferArrenca', 'estat', 'CONTRACTE_BACKEND',
      'injectaSessio', 'expulsaSessio', 'quanLlest', 'isReady', 'registraApp']);
    expect(Object.keys(exposaGlobal({}))).toEqual([...C.api.claus]);
    /* Cap verb nou a la cua ni al pont d'iframe: els mòduls només parlen per l'API. */
    expect(Object.keys(C.cua.verbs)).toEqual(['sessio', 'configura']);
    expect(C.ordresIframe).not.toContain('registraModul');
  });

  test('mòduls: registraModul delega en el registre, lliuraCos ignora un id sense càrrega i nucli és una lectura (null fins que un mòdul el demana)', () => {
    const api = exposaGlobal({});
    expect(Object.getOwnPropertyDescriptor(api, 'nucli').get).toBeTypeOf('function');
    expect(api.nucli).toBeNull();
    expect(api.lliuraCos('llibreta', () => () => null)).toBe(false);
    try {
      expect(api.registraModul(manifestModulDeProva())).toMatchObject({ ok: true, manifest: { id: 'llibreta', origen: 'modul' } });
      expect(llistaApps().some((app) => app.id === 'llibreta' && app.origen === 'modul')).toBe(true);
      expect(api.registraModul(manifestModulDeProva({ nucli: '^2' })).ok).toBe(false);
    } finally {
      retiraAppExterna('llibreta');
    }
  });

  test('el provisional del paquet encua registraModul i lliuraCos, i nucli hi és una lectura: undefined fins a l’adopció', async () => {
    const finestra = { location: { origin: 'https://pagina.invalid' } };
    const script = document.createElement('script');
    script.setAttribute('src', 'https://pagina.invalid/dist/soc-de-poble.standalone.js');
    const provisional = instalaCarregador(finestra, document, script,
      { modul: 'trossos/soc-de-poble-Prova.js', claus: C.api.claus, fitxer: 'soc-de-poble.standalone.js' }, () => new Promise(() => {}));
    expect(Object.keys(provisional)).toEqual([...C.api.claus]);
    expect(provisional.nucli).toBeUndefined();
    const registrat = provisional.registraModul({ id: 'llibreta' });
    expect(registrat).toBeInstanceOf(Promise);
    const fabrica = () => () => null;
    const lliurat = provisional.lliuraCos('llibreta', fabrica);
    expect(lliurat).toBeInstanceOf(Promise);
    const lliuraCos = vi.fn(() => false);
    const real = Object.freeze({
      registraModul: (manifest) => ({ ok: true, manifest }), lliuraCos, isReady: true, nucli: Object.freeze({ versio: '1.0.0' })
    });
    delete finestra.SocDePoble;
    Object.defineProperty(finestra, 'SocDePoble', { value: real, writable: false, configurable: false });
    expect(provisional[Symbol.for(MARCA_DEL_CARREGADOR)].adopta(real)).toBe(true);
    await expect(registrat).resolves.toEqual({ ok: true, manifest: { id: 'llibreta' } });
    /* Encuat, arriba a l'API real amb els mateixos arguments; fora del script
       que s'està carregant, la real l'ignora (false), com qualsevol lliurament tardà. */
    await expect(lliurat).resolves.toBe(false);
    expect(lliuraCos).toHaveBeenCalledWith('llibreta', fabrica);
    expect(provisional.nucli).toBe(real.nucli);
  });
});
