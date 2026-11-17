/* Onada v1.2.7 · P0-123 (ordre directa del Mestre, 17-11-2026) · L'avís de la PWA: versio-viva.json
   (del mateix origen) diu una versió web més nova que la carregada → la barra de sempre, amb el canal
   'web', i l'esdeveniment perquè App.jsx la carregue; el toc prepara el worker (amb tall) i recarrega.
   Casos: més nova, igual, més vella, no vàlida, sense xarxa, ràfegues, tornada a primer pla, retirada
   i la frontera (cap nom del worker ni de la Cache API). Cap xarxa: fetch simulat. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  CANALS_ACTUALITZACIO,
  llegixActualitzacioRecomanada,
  netejaActualitzacioRecomanadaPerProves,
  obriBotigaActualitzacio
} from '../config/actualitzacioRecomanada.js';
import { VERSIO_SISTEMA } from '../config/versio.js';
import {
  ESDEVENIMENT_ACTUALITZACIO_WEB,
  INTERVAL_MINIM_WEB_MS,
  TEXTOS_PENDENTS_WEB,
  URL_VERSIO_VIVA,
  consultaVersioViva,
  iniciaActualitzacioWeb,
  novaVersioWeb,
  textPendentsWeb
} from './actualitzacioWeb.js';
import { buidaEstatsPendents, marcaEstatPendent } from './estatsPendents.js';
import { arrencaActualitzacioWeb } from './registre.js';

const resposta = (cos, { ok = true, status = 200 } = {}) => ({ ok, status, text: async () => (typeof cos === 'string' ? cos : JSON.stringify(cos)) });
const viva = (versioSistema) => resposta({ versioSistema, versioMinima: 2, versioRecomanada: 2 });

function finestraAmb() {
  const finestra = new EventTarget();
  finestra.document = new EventTarget();
  finestra.document.visibilityState = 'visible';
  finestra.setTimeout = (...a) => setTimeout(...a);
  finestra.clearTimeout = (id) => clearTimeout(id);
  finestra.Event = Event;
  finestra.navigator = { onLine: true };
  finestra.location = { reload: vi.fn() };
  return finestra;
}

let consola;
beforeEach(() => {
  netejaActualitzacioRecomanadaPerProves();
  consola = ['log', 'info', 'warn', 'error', 'debug'].map((nivell) => vi.spyOn(console, nivell));
});
afterEach(() => {
  for (const espia of consola) expect(espia).not.toHaveBeenCalled();
  vi.restoreAllMocks();
  vi.useRealTimers();
  netejaActualitzacioRecomanadaPerProves();
  buidaEstatsPendents();
});

describe('les peces pures', () => {
  test('novaVersioWeb: només una versió servida més nova que la carregada', () => {
    expect(novaVersioWeb('1.2.7', '1.2.6')).toEqual({ plataforma: 'web', canal: CANALS_ACTUALITZACIO.WEB, versioRecomanada: 1_002_007, versio: '1.2.7' });
    expect(novaVersioWeb('1.2.6', '1.2.6')).toBeNull();
    expect(novaVersioWeb('1.2.5', '1.2.6')).toBeNull();
    for (const dolenta of ['1.2', null, 'dev', '1.1000.0']) expect(novaVersioWeb(dolenta, '1.2.6'), String(dolenta)).toBeNull();
    expect(novaVersioWeb('1.2.7', 'dev')).toBeNull();
    // Per defecte, la versió del codi carregat.
    expect(novaVersioWeb(VERSIO_SISTEMA)).toBeNull();
  });

  test('consultaVersioViva: el mateix origen, i null amb qualsevol cosa que no siga versioSistema «x.y.z»', async () => {
    const fetchImpl = vi.fn(async () => viva('1.2.7'));
    await expect(consultaVersioViva({ fetchImpl })).resolves.toBe('1.2.7');
    expect(fetchImpl.mock.calls[0][0]).toBe(URL_VERSIO_VIVA);
    expect(URL_VERSIO_VIVA).toBe('/versio-viva.json');
    for (const dolenta of [viva('1.2'), resposta('{'), resposta('x', { ok: false, status: 500 }), resposta([1])]) {
      await expect(consultaVersioViva({ fetchImpl: async () => dolenta })).resolves.toBeNull();
    }
    await expect(consultaVersioViva({ fetchImpl: async () => { throw new TypeError('Failed to fetch'); } })).resolves.toBeNull();
  });
});

describe('iniciaActualitzacioWeb', () => {
  test('una versió servida més nova: l\'avís de la barra i l\'esdeveniment perquè App.jsx la carregue', async () => {
    const finestra = finestraAmb();
    const rebuts = [];
    finestra.addEventListener(ESDEVENIMENT_ACTUALITZACIO_WEB, (event) => rebuts.push(event));
    const asa = iniciaActualitzacioWeb({ finestra, fetchImpl: vi.fn(async () => viva('1.2.7')), versioCarregada: '1.2.6' });
    await asa.comprova();
    expect(llegixActualitzacioRecomanada()).toEqual({ plataforma: 'web', versioRecomanada: 1_002_007, enllac: null, marketUrl: null, canal: 'web', versio: '1.2.7' });
    expect(rebuts).toHaveLength(1);
    expect(ESDEVENIMENT_ACTUALITZACIO_WEB).toBe('sdp:actualitzacio-web');
    asa.tanca();
  });

  test('la mateixa versió o una de més vella: cap avís ni cap esdeveniment', async () => {
    for (const servida of ['1.2.6', '1.2.5']) {
      const finestra = finestraAmb();
      const rebuts = [];
      finestra.addEventListener(ESDEVENIMENT_ACTUALITZACIO_WEB, () => rebuts.push(1));
      const asa = iniciaActualitzacioWeb({ finestra, fetchImpl: vi.fn(async () => viva(servida)), versioCarregada: '1.2.6' });
      await asa.comprova();
      expect(llegixActualitzacioRecomanada(), servida).toBeNull();
      expect(rebuts, servida).toEqual([]);
      asa.tanca();
    }
  });

  test('ràfegues: una consulta bona gasta la franja; una fallida deixa tornar a provar al cap de poc; sense xarxa no pregunta', async () => {
    let ara = 0;
    const finestra = finestraAmb();
    const fetchImpl = vi.fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValue(viva('1.2.6'));
    const asa = iniciaActualitzacioWeb({ finestra, fetchImpl, versioCarregada: '1.2.6', ara: () => ara, retroces: 1000 });
    await asa.comprova();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    await asa.comprova();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    ara += 1000;
    await asa.comprova();
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    ara += INTERVAL_MINIM_WEB_MS - 1;
    finestra.document.dispatchEvent(new Event('visibilitychange'));
    await asa.comprova();
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    ara += 1;
    finestra.navigator.onLine = false;
    await asa.comprova();
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    finestra.navigator.onLine = true;
    finestra.dispatchEvent(new Event('online'));
    await Promise.resolve();
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    asa.tanca();
  });

  test('un desplegament que torna arrere retira l\'avís dins de la mateixa pestanya', async () => {
    let ara = 0;
    const fetchImpl = vi.fn().mockResolvedValueOnce(viva('1.2.7')).mockResolvedValueOnce(viva('1.2.6'));
    const asa = iniciaActualitzacioWeb({ finestra: finestraAmb(), fetchImpl, versioCarregada: '1.2.6', ara: () => ara });
    await asa.comprova();
    expect(llegixActualitzacioRecomanada()?.versio).toBe('1.2.7');
    ara += INTERVAL_MINIM_WEB_MS;
    await asa.comprova();
    expect(llegixActualitzacioRecomanada()).toBeNull();
    asa.tanca();
  });

  test('el toc: prepara el worker i recarrega una sola vegada; un worker que no contesta no ho para (tall)', async () => {
    vi.useFakeTimers();
    const finestra = finestraAmb();
    const preparaWorker = vi.fn(() => new Promise(() => {}));
    const asa = iniciaActualitzacioWeb({ finestra, fetchImpl: vi.fn(async () => viva('1.2.7')), versioCarregada: '1.2.6', preparaWorker, esperaWorker: 1500 });
    await vi.waitFor(() => expect(llegixActualitzacioRecomanada()).not.toBeNull());
    expect(obriBotigaActualitzacio(llegixActualitzacioRecomanada(), { finestra })).toBe(CANALS_ACTUALITZACIO.WEB);
    obriBotigaActualitzacio(llegixActualitzacioRecomanada(), { finestra });
    await vi.advanceTimersByTimeAsync(0);
    expect(preparaWorker).toHaveBeenCalledTimes(1);
    expect(preparaWorker.mock.calls[0][0].vigent()).toBe(true);
    expect(finestra.location.reload).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1500);
    expect(finestra.location.reload).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(5000);
    expect(finestra.location.reload).toHaveBeenCalledTimes(1);
    asa.tanca();
  });

  test('el toc amb un worker que acaba de seguida recarrega sense esperar el tall', async () => {
    const finestra = finestraAmb();
    const preparaWorker = vi.fn(async () => undefined);
    const asa = iniciaActualitzacioWeb({ finestra, fetchImpl: vi.fn(async () => viva('1.2.7')), versioCarregada: '1.2.6', preparaWorker, esperaWorker: 60_000 });
    await asa.comprova();
    obriBotigaActualitzacio(llegixActualitzacioRecomanada(), { finestra });
    await vi.waitFor(() => expect(finestra.location.reload).toHaveBeenCalledTimes(1));
    asa.tanca();
  });

  test('P0123-05 · amb un esborrany pendent (estatsPendents.js), el toc pregunta en la llengua triada i, si no s\'accepta, no recarrega', async () => {
    const finestra = finestraAmb();
    marcaEstatPendent('xat.esborranys');
    const confirma = vi.fn(() => false);
    const preparaWorker = vi.fn(async () => undefined);
    const asa = iniciaActualitzacioWeb({
      finestra, fetchImpl: vi.fn(async () => viva('1.2.7')), versioCarregada: '1.2.6', preparaWorker, confirma, llengua: () => 'es', esperaWorker: 10
    });
    await asa.comprova();
    obriBotigaActualitzacio(llegixActualitzacioRecomanada(), { finestra });
    await new Promise((resolve) => { setTimeout(resolve, 30); });
    expect(confirma).toHaveBeenCalledWith(TEXTOS_PENDENTS_WEB.es);
    expect(preparaWorker).not.toHaveBeenCalled();
    expect(finestra.location.reload).not.toHaveBeenCalled();
    // Acceptat: ara sí (el botó no s'ha quedat mort).
    confirma.mockReturnValue(true);
    obriBotigaActualitzacio(llegixActualitzacioRecomanada(), { finestra });
    await vi.waitFor(() => expect(finestra.location.reload).toHaveBeenCalledTimes(1));
    expect(confirma).toHaveBeenCalledTimes(2);
    // Sense res pendent, cap pregunta.
    buidaEstatsPendents();
    asa.tanca();
  });

  test('P0123-05 · amb estat pendent i sense poder preguntar (cap confirm, o un veto que llança), no recarrega', async () => {
    for (const opcions of [{ tePendents: () => true }, { tePendents: () => { throw new Error('x'); }, confirma: () => true, llengua: () => { throw new Error('y'); } }]) {
      const finestra = finestraAmb();
      const asa = iniciaActualitzacioWeb({ finestra, fetchImpl: vi.fn(async () => viva('1.2.7')), versioCarregada: '1.2.6', esperaWorker: 10, ...opcions });
      await asa.comprova();
      obriBotigaActualitzacio(llegixActualitzacioRecomanada(), { finestra });
      await new Promise((resolve) => { setTimeout(resolve, 30); });
      // El segon cas sí que pregunta (en valencià, la llengua per defecte) i, acceptat, recarrega.
      expect(finestra.location.reload).toHaveBeenCalledTimes(opcions.confirma ? 1 : 0);
      asa.tanca();
      netejaActualitzacioRecomanadaPerProves();
    }
    expect(textPendentsWeb(null)).toBe(TEXTOS_PENDENTS_WEB.ca);
    expect(textPendentsWeb('gl-ES')).toBe(TEXTOS_PENDENTS_WEB.gl);
    expect(Object.keys(TEXTOS_PENDENTS_WEB)).toEqual(['ca', 'es', 'en', 'eu', 'gl']);
  });

  test('P0123-05 · sense res pendent no pregunta; i una recàrrega que el navegador cancel·la (beforeunload) no deixa el botó mort', async () => {
    vi.useFakeTimers();
    const finestra = finestraAmb();
    const confirma = vi.fn(() => true);
    const asa = iniciaActualitzacioWeb({ finestra, fetchImpl: vi.fn(async () => viva('1.2.7')), versioCarregada: '1.2.6', confirma, esperaWorker: 1500 });
    await vi.waitFor(() => expect(llegixActualitzacioRecomanada()).not.toBeNull());
    obriBotigaActualitzacio(llegixActualitzacioRecomanada(), { finestra });
    await vi.advanceTimersByTimeAsync(1500);
    expect(finestra.location.reload).toHaveBeenCalledTimes(1);
    expect(confirma).not.toHaveBeenCalled();
    // La pàgina continua viva (la recàrrega s'ha cancel·lat): passat el tall, el toc torna a recarregar.
    await vi.advanceTimersByTimeAsync(1500);
    obriBotigaActualitzacio(llegixActualitzacioRecomanada(), { finestra });
    await vi.advanceTimersByTimeAsync(1500);
    expect(finestra.location.reload).toHaveBeenCalledTimes(2);
    asa.tanca();
  });

  test('sense fetch, document o temporitzadors: res (null) i cap error', () => {
    expect(iniciaActualitzacioWeb({ finestra: null })).toBeNull();
    expect(iniciaActualitzacioWeb({ finestra: { document: {} }, fetchImpl: async () => viva('1.2.7') })).toBeNull();
    const sensePublica = iniciaActualitzacioWeb({ finestra: finestraAmb(), fetchImpl: null });
    expect(sensePublica).toBeNull();
  });
});

describe('el cablatge i la frontera', () => {
  test('registre.js l\'arrenca per import(), passant-li la preparació del worker', async () => {
    const iniciaActualitzacioWebFals = vi.fn(() => 'asa');
    const finestra = { location: { origin: 'https://socdepoble.org' } };
    const navegador = { serviceWorker: { getRegistration: vi.fn(async () => null) } };
    await expect(arrencaActualitzacioWeb({ navegador, finestra, importa: async () => ({ iniciaActualitzacioWeb: iniciaActualitzacioWebFals }) })).resolves.toBe('asa');
    const [{ finestra: rebuda, preparaWorker }] = iniciaActualitzacioWebFals.mock.calls[0];
    expect(rebuda).toBe(finestra);
    await preparaWorker({ vigent: () => true });
    expect(navegador.serviceWorker.getRegistration).toHaveBeenCalledWith('https://socdepoble.org/');
    await expect(arrencaActualitzacioWeb({ navegador, finestra, importa: async () => { throw new Error('tros absent'); } })).resolves.toBeNull();
  });

  test('el mòdul no nomena el worker ni la Cache API, i App.jsx escolta el mateix esdeveniment', () => {
    const arrel = path.resolve(import.meta.dirname, '..', '..');
    const codi = readFileSync(path.join(arrel, 'src', 'pwa', 'actualitzacioWeb.js'), 'utf8');
    expect(codi).not.toMatch(new RegExp(['service', 'Worker|\\bcaches\\.|post', 'Message'].join('')));
    const app = readFileSync(path.join(arrel, 'src', 'app', 'App.jsx'), 'utf8');
    expect(app.match(new RegExp(`'${ESDEVENIMENT_ACTUALITZACIO_WEB}'`, 'g'))).toHaveLength(2);
  });
});
