/* Onada R32.3 (ordre del Mestre, 16-11-2026 22:09) · El detector de versió nova de l'App nativa.
   Tot és sintètic: cap xarxa (fetch simulat), cap Capacitor (la plataforma es passa), una CSP de
   meta com la de la closca (vite.natiu.config.js + el permís de socdepoble.org) i un document
   que és un EventTarget. Casos: versió més nova, igual, més vella, veto semàntic, JSON trencat,
   no 2xx, massa gran, tall, sense xarxa, ràfegues, tornada a primer pla, la web i la CSP, i la
   consola sempre neta. La barra i les 5 llengües: BarraActualitzacioRecomanada.test.jsx.
   Elefant R32.3 · Retrocés curt després d'una fallada (la franja sencera només la gasta un manifest
   vàlid), reintent i comprovació periòdica mentre l'App és visible, navigator.onLine i 'online',
   retirada d'un build dins de la sessió, dues fonts al registre i la diagnosi de cada motiu. La porta
   CSP contra la CSP REAL de la closca (cspNativa) és a tests/agentic-browsing-ard-llms.test.mjs (Node). */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  ENLLAC_ANDROID_MARKET,
  ENLLAC_ANDROID_PLAY,
  ENLLAC_IOS_APP_STORE,
  FONT_MANIFEST,
  FONT_NODE,
  descartaActualitzacioRecomanada,
  llegixActualitzacioRecomanada,
  llegixDiagnosiActualitzacio,
  netejaActualitzacioRecomanadaPerProves,
  publicaActualitzacioRecomanada
} from '../config/actualitzacioRecomanada.js';
import { VERSIO_SISTEMA } from '../config/versio.js';
import { VERSIO_CLIENT_NATIU } from '../data/contracte.js';
import {
  CAMP_BUILD,
  INTERVAL_MINIM_CONSULTES_MS,
  INTERVAL_PERIODIC_MS,
  MIDA_MAXIMA_MANIFEST,
  RETROCES_FALLADA_MS,
  TEMPS_MAXIM_CONSULTA_MS,
  URL_MANIFEST_VERSIO,
  comparaSemver,
  connexioPermesaPerCsp,
  consultaManifestVersio,
  iniciaActualitzacioAppNativa,
  llegixManifestVersio,
  novaVersioDisponible
} from './actualitzacioAppNativa.js';

const ORIGEN = 'https://socdepoble.org';
const CSP_AMB_PERMIS = `default-src 'self' data: blob:; script-src 'self'; connect-src 'self' data: https://backend.supabase.test wss://backend.supabase.test ${ORIGEN}; worker-src 'none'`;
const CSP_SENSE_PERMIS = "default-src 'self' data: blob:; script-src 'self'; connect-src 'self' data: https://backend.supabase.test wss://backend.supabase.test; worker-src 'none'";

const meta = (contingut, equiv = 'Content-Security-Policy') => ({
  getAttribute: (nom) => ({ 'http-equiv': equiv, content: contingut }[nom] ?? null)
});

/** Una finestra mínima de la closca: document EventTarget amb metes CSP i els seus temporitzadors. */
function finestraAmb({ csp = [CSP_AMB_PERMIS] } = {}) {
  const document = new EventTarget();
  document.visibilityState = 'visible';
  const metes = csp.map((c) => meta(c));
  document.querySelectorAll = (selector) => (selector === 'meta[http-equiv]' ? metes : []);
  return {
    document,
    setTimeout: (...args) => setTimeout(...args),
    clearTimeout: (id) => clearTimeout(id)
  };
}

const manifest = (camps = {}) => ({ version: '1.2.5', androidBuild: 10, iosBuild: 10, entries: [], ...camps });
const resposta = (cos, { ok = true, status = 200 } = {}) => ({
  ok,
  status,
  text: async () => (typeof cos === 'string' ? cos : JSON.stringify(cos))
});
const fetchAmb = (...respostes) => {
  const cua = [...respostes];
  return vi.fn(async () => {
    const seguent = cua.length > 1 ? cua.shift() : cua[0];
    if (seguent instanceof Error) throw seguent;
    return seguent;
  });
};
/* Un torn de macrotasca: buida totes les microtasques pendents (la consulta en té una dotzena). */
const torns = () => new Promise((resolve) => { setTimeout(resolve, 0); });

let consola;
beforeEach(() => {
  netejaActualitzacioRecomanadaPerProves();
  consola = ['log', 'info', 'warn', 'error', 'debug'].map((nivell) => vi.spyOn(console, nivell));
});
afterEach(() => {
  // Fail-silent: cap cas d'este fitxer escriu res a la consola.
  for (const espia of consola) expect(espia).not.toHaveBeenCalled();
  vi.restoreAllMocks();
  vi.useRealTimers();
  netejaActualitzacioRecomanadaPerProves();
});

describe('les peces pures', () => {
  test('comparaSemver: ordre numèric per components, i null per a qualsevol cosa que no siga x.y.z', () => {
    expect(comparaSemver('1.2.5', '1.2.4')).toBe(1);
    expect(comparaSemver('1.2.4', '1.2.4')).toBe(0);
    expect(comparaSemver('1.2.4', '1.10.0')).toBe(-1);
    expect(comparaSemver('2.0.0', '1.99.99')).toBe(1);
    for (const dolent of ['1.2', '1.2.4-beta', 'v1.2.4', '', null, 7, '1.2.4 ']) {
      expect(comparaSemver(dolent, '1.2.4'), String(dolent)).toBeNull();
      expect(comparaSemver('1.2.4', dolent), String(dolent)).toBeNull();
    }
  });

  test('llegixManifestVersio: version i el build de la plataforma, o null si falta o no té forma', () => {
    expect(CAMP_BUILD).toEqual({ android: 'androidBuild', ios: 'iosBuild' });
    expect(llegixManifestVersio(manifest(), 'android')).toEqual({ versio: '1.2.5', build: 10 });
    expect(llegixManifestVersio(manifest({ iosBuild: 11 }), 'ios')).toEqual({ versio: '1.2.5', build: 11 });
    for (const [cas, valor, plataforma] of [
      ['null', null, 'android'],
      ['una llista', [manifest()], 'android'],
      ['un text', JSON.stringify(manifest()), 'android'],
      ['la web', manifest(), 'web'],
      ['un prototip', manifest(), 'constructor'],
      ['sense version', { androidBuild: 10 }, 'android'],
      ['version no semver', manifest({ version: '1.2' }), 'android'],
      ['build en text', manifest({ androidBuild: '10' }), 'android'],
      ['build zero', manifest({ androidBuild: 0 }), 'android'],
      ['build decimal', manifest({ androidBuild: 9.5 }), 'android'],
      ['sense el build de la plataforma', { version: '1.2.5', androidBuild: 10 }, 'ios']
    ]) expect(llegixManifestVersio(valor, plataforma), cas).toBeNull();
  });

  test('novaVersioDisponible: el build mana i la versió semàntica només veta un servidor més vell', () => {
    const local = { versioLocal: '1.2.4', buildLocal: 9 };
    expect(novaVersioDisponible({ versio: '1.2.5', build: 10 }, { plataforma: 'android', ...local })).toEqual({
      plataforma: 'android',
      versioRecomanada: 10,
      versio: '1.2.5',
      enllac: ENLLAC_ANDROID_PLAY,
      marketUrl: ENLLAC_ANDROID_MARKET
    });
    expect(novaVersioDisponible({ versio: '1.2.5', build: 10 }, { plataforma: 'ios', ...local })).toEqual({
      plataforma: 'ios',
      versioRecomanada: 10,
      versio: '1.2.5',
      enllac: ENLLAC_IOS_APP_STORE,
      marketUrl: null
    });
    // El mateix semver amb un build més alt (una recompilació) també és nova.
    expect(novaVersioDisponible({ versio: '1.2.4', build: 10 }, { plataforma: 'android', ...local })?.versioRecomanada).toBe(10);
    // Igual, més vella, o una versió semàntica més nova sense build nou (la botiga no la pot donar).
    expect(novaVersioDisponible({ versio: '1.2.4', build: 9 }, { plataforma: 'android', ...local })).toBeNull();
    expect(novaVersioDisponible({ versio: '1.2.3', build: 8 }, { plataforma: 'android', ...local })).toBeNull();
    expect(novaVersioDisponible({ versio: '1.2.5', build: 9 }, { plataforma: 'android', ...local })).toBeNull();
    // Veto: un servidor amb una versió semàntica més vella no anuncia res, encara que el build siga més alt.
    expect(novaVersioDisponible({ versio: '1.2.3', build: 12 }, { plataforma: 'android', ...local })).toBeNull();
    // Sense manifest, fora de plataforma o amb una versió local que no s'entén: res.
    expect(novaVersioDisponible(null, { plataforma: 'android', ...local })).toBeNull();
    expect(novaVersioDisponible({ versio: '1.2.5', build: 10 }, { plataforma: 'web', ...local })).toBeNull();
    expect(novaVersioDisponible({ versio: '1.2.5', build: 10 }, { plataforma: 'android', versioLocal: 'dev', buildLocal: 9 })).toBeNull();
    expect(novaVersioDisponible({ versio: '1.2.5', build: 10 }, { plataforma: 'android', versioLocal: '1.2.4', buildLocal: '9' })).toBeNull();
  });

  test('sense versió local no anuncia res; el build local per defecte és VERSIO_CLIENT_NATIU', () => {
    expect(novaVersioDisponible({ versio: VERSIO_SISTEMA, build: VERSIO_CLIENT_NATIU + 1 }, { plataforma: 'android' })).toBeNull();
    expect(novaVersioDisponible({ versio: VERSIO_SISTEMA, build: VERSIO_CLIENT_NATIU }, { plataforma: 'android', versioLocal: VERSIO_SISTEMA })).toBeNull();
    expect(novaVersioDisponible({ versio: VERSIO_SISTEMA, build: VERSIO_CLIENT_NATIU + 1 }, { plataforma: 'android', versioLocal: VERSIO_SISTEMA })?.versioRecomanada)
      .toBe(VERSIO_CLIENT_NATIU + 1);
  });

  test('connexioPermesaPerCsp: només dins d’una closca amb CSP que deixa connectar amb socdepoble.org', () => {
    const doc = (csp) => finestraAmb({ csp }).document;
    expect(URL_MANIFEST_VERSIO).toBe(`${ORIGEN}/.well-known/ard.json`);
    expect(connexioPermesaPerCsp(URL_MANIFEST_VERSIO, doc([CSP_AMB_PERMIS]))).toBe(true);
    // Fora de la closca (cap meta CSP) no es pregunta: ni la web ni les proves d'altres fitxers fan xarxa.
    expect(connexioPermesaPerCsp(URL_MANIFEST_VERSIO, doc([]))).toBe(false);
    // Una CSP sense l'origen públic (la de la closca abans de R32.3): inert i sense «Refused to connect» a la consola.
    expect(connexioPermesaPerCsp(URL_MANIFEST_VERSIO, doc([CSP_SENSE_PERMIS]))).toBe(false);
    // Sense connect-src mana default-src; un esquema https: o * també permeten; la barra final no compta.
    expect(connexioPermesaPerCsp(URL_MANIFEST_VERSIO, doc([`default-src 'self' ${ORIGEN}/`]))).toBe(true);
    expect(connexioPermesaPerCsp(URL_MANIFEST_VERSIO, doc(["default-src 'self'"]))).toBe(false);
    expect(connexioPermesaPerCsp(URL_MANIFEST_VERSIO, doc(["connect-src 'self' https:"]))).toBe(true);
    expect(connexioPermesaPerCsp(URL_MANIFEST_VERSIO, doc(["connect-src *"]))).toBe(true);
    expect(connexioPermesaPerCsp(URL_MANIFEST_VERSIO, doc(["script-src 'self'"]))).toBe(true);
    // Dues polítiques: s'apliquen totes dues (intersecció).
    expect(connexioPermesaPerCsp(URL_MANIFEST_VERSIO, doc([CSP_AMB_PERMIS, CSP_SENSE_PERMIS]))).toBe(false);
    // Un origen que només s'hi assembla no val.
    expect(connexioPermesaPerCsp(URL_MANIFEST_VERSIO, doc(["connect-src https://socdepoble.org.evil.example"]))).toBe(false);
    expect(connexioPermesaPerCsp('no és una url', doc([CSP_AMB_PERMIS]))).toBe(false);
    expect(connexioPermesaPerCsp(URL_MANIFEST_VERSIO, null)).toBe(false);
    // Un altre http-equiv no és cap CSP.
    const altre = finestraAmb({ csp: [] }).document;
    altre.querySelectorAll = () => [meta('text/html', 'Content-Type')];
    expect(connexioPermesaPerCsp(URL_MANIFEST_VERSIO, altre)).toBe(false);
  });
});

describe('consultaManifestVersio', () => {
  test('un GET sense galetes ni Referer, amb revalidació, que torna el JSON', async () => {
    const fetchImpl = fetchAmb(resposta(manifest()));
    await expect(consultaManifestVersio({ fetchImpl })).resolves.toEqual(manifest());
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, opcions] = fetchImpl.mock.calls[0];
    expect(url).toBe(URL_MANIFEST_VERSIO);
    expect(opcions).toMatchObject({
      method: 'GET',
      cache: 'no-cache',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      headers: { Accept: 'application/json' }
    });
    expect(opcions.signal).toBeInstanceOf(AbortSignal);
  });

  test('null sense xarxa, amb un estat no 2xx, un JSON trencat, massa gran o sense fetch', async () => {
    await expect(consultaManifestVersio({ fetchImpl: fetchAmb(new TypeError('Failed to fetch')) })).resolves.toBeNull();
    await expect(consultaManifestVersio({ fetchImpl: fetchAmb(resposta(manifest(), { ok: false, status: 404 })) })).resolves.toBeNull();
    await expect(consultaManifestVersio({ fetchImpl: fetchAmb(resposta('{"version": "1.2.5",')) })).resolves.toBeNull();
    await expect(consultaManifestVersio({ fetchImpl: fetchAmb(resposta(' '.repeat(MIDA_MAXIMA_MANIFEST + 1))) })).resolves.toBeNull();
    await expect(consultaManifestVersio({ fetchImpl: fetchAmb({ ok: true, text: async () => { throw new Error('cos tallat'); } }) })).resolves.toBeNull();
    await expect(consultaManifestVersio({ fetchImpl: null })).resolves.toBeNull();
  });

  test('un tall: passat TEMPS_MAXIM_CONSULTA_MS, null i la petició cancel·lada', async () => {
    vi.useFakeTimers();
    let senyal = null;
    const fetchImpl = vi.fn((_url, { signal }) => { senyal = signal; return new Promise(() => {}); });
    const consulta = consultaManifestVersio({ fetchImpl });
    await vi.advanceTimersByTimeAsync(TEMPS_MAXIM_CONSULTA_MS - 1);
    expect(senyal.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await expect(consulta).resolves.toBeNull();
    expect(senyal.aborted).toBe(true);
    expect(TEMPS_MAXIM_CONSULTA_MS).toBeLessThanOrEqual(5000);
  });
});

describe('iniciaActualitzacioAppNativa', () => {
  /* Cada detector engegat es tanca en acabar (cap temporitzador de reintent o periòdic penjat). */
  const engegats = [];
  afterEach(() => { for (const asa of engegats.splice(0)) asa?.tanca(); });
  const engega = (opcions = {}) => {
    const finestra = opcions.finestra ?? finestraAmb();
    const publica = opcions.publica ?? vi.fn();
    const asa = iniciaActualitzacioAppNativa({
      plataforma: 'android',
      versioLocal: '1.2.4',
      buildLocal: 9,
      ara: () => 0,
      ...opcions,
      finestra,
      publica
    });
    engegats.push(asa);
    return { asa, finestra, publica };
  };

  test('la web, la PWA, sense fetch, sense document o sense permís de la CSP: null i cap consulta', () => {
    const fetchImpl = fetchAmb(resposta(manifest()));
    for (const plataforma of ['web', undefined, 'electron']) {
      expect(engega({ plataforma, fetchImpl }).asa, String(plataforma)).toBeNull();
    }
    expect(engega({ finestra: finestraAmb({ csp: [] }), fetchImpl }).asa).toBeNull();
    expect(engega({ finestra: finestraAmb({ csp: [CSP_SENSE_PERMIS] }), fetchImpl }).asa).toBeNull();
    expect(engega({ finestra: {}, fetchImpl }).asa).toBeNull();
    expect(engega({ fetchImpl: null, finestra: { ...finestraAmb(), fetch: undefined } }).asa).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  test('Android amb una versió més nova al servidor: la publica a la barra, amb Google Play (market:// i https)', async () => {
    const fetchImpl = fetchAmb(resposta(manifest()));
    const { asa, publica } = engega({ fetchImpl });
    expect(asa).not.toBeNull();
    await asa.comprova();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(publica).toHaveBeenCalledTimes(1);
    expect(publica).toHaveBeenCalledWith({
      plataforma: 'android',
      versioRecomanada: 10,
      versio: '1.2.5',
      enllac: ENLLAC_ANDROID_PLAY,
      marketUrl: ENLLAC_ANDROID_MARKET
    }, FONT_MANIFEST);
    expect(asa.estat()).toMatchObject({ motiu: 'publicada', build: 10, versio: '1.2.5' });
    expect(llegixDiagnosiActualitzacio()).toEqual(asa.estat());
    asa.tanca();
  });

  test('iOS llig iosBuild i obri l’App Store', async () => {
    const fetchImpl = fetchAmb(resposta(manifest({ androidBuild: 9, iosBuild: 11 })));
    const { asa, publica } = engega({ plataforma: 'ios', fetchImpl });
    await asa.comprova();
    expect(publica).toHaveBeenCalledWith(expect.objectContaining({ plataforma: 'ios', versioRecomanada: 11, enllac: ENLLAC_IOS_APP_STORE, marketUrl: null }), FONT_MANIFEST);
    asa.tanca();
  });

  test('la mateixa versió, una de més vella, un JSON trencat, un 500 o sense xarxa: res a la barra i la consola neta', async () => {
    for (const [cas, sortida, motiu] of [
      ['igual', resposta(manifest({ version: '1.2.4', androidBuild: 9 })), 'al-dia'],
      ['més vella', resposta(manifest({ version: '1.2.3', androidBuild: 8 })), 'al-dia'],
      ['veto semàntic', resposta(manifest({ version: '1.2.3', androidBuild: 12 })), 'al-dia'],
      ['JSON trencat', resposta('<!doctype html>'), 'json'],
      ['sense camps de versió', resposta({ entries: [] }), 'manifest-invalid'],
      ['massa gran', resposta(' '.repeat(MIDA_MAXIMA_MANIFEST + 1)), 'massa-gran'],
      ['404', resposta(manifest(), { ok: false, status: 404 }), 'http-404'],
      ['500', resposta(manifest(), { ok: false, status: 500 }), 'http-500'],
      ['sense xarxa', new TypeError('Failed to fetch'), 'sense-xarxa']
    ]) {
      const { asa, publica } = engega({ fetchImpl: fetchAmb(sortida) });
      await expect(asa.comprova(), cas).resolves.toBeNull();
      expect(publica, cas).not.toHaveBeenCalled();
      // Cada «no hi ha avís» diu per què (la diagnosi, mai la consola).
      expect(asa.estat()?.motiu, cas).toBe(motiu);
      expect(llegixDiagnosiActualitzacio()?.motiu, cas).toBe(motiu);
      asa.tanca();
    }
  });

  test('un tall no penja l’App ni gasta la franja: la tornada a primer pla passat el primer retrocés (molt abans de l’interval) torna a preguntar', async () => {
    vi.useFakeTimers();
    let rellotge = 0;
    const fetchImpl = vi.fn()
      .mockImplementationOnce(() => new Promise(() => {}))
      .mockImplementation(async () => resposta(manifest()));
    const { asa, publica, finestra } = engega({ fetchImpl, ara: () => rellotge });
    await vi.advanceTimersByTimeAsync(TEMPS_MAXIM_CONSULTA_MS);
    expect(publica).not.toHaveBeenCalled();
    expect(asa.estat()).toMatchObject({ motiu: 'tall', fallades: 1 });
    // Dins del retrocés, una tornada no pregunta; passat (30 s), sí.
    rellotge = RETROCES_FALLADA_MS[0] - 1;
    finestra.document.dispatchEvent(new Event('resume'));
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    rellotge = RETROCES_FALLADA_MS[0];
    finestra.document.dispatchEvent(new Event('resume'));
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(publica).toHaveBeenCalledTimes(1);
    expect(RETROCES_FALLADA_MS[0]).toBeLessThan(INTERVAL_MINIM_CONSULTES_MS);
    asa.tanca();
  });

  test('retrocés creixent després de fallades seguides (30 s, 1, 2 i 5 min; després l’interval) i, amb l’App oberta i visible, el reintent arriba sol', async () => {
    vi.useFakeTimers();
    let rellotge = 0;
    const fetchImpl = fetchAmb(new TypeError('Failed to fetch'));
    const { asa } = engega({ fetchImpl, ara: () => rellotge });
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const esperes = [...RETROCES_FALLADA_MS, INTERVAL_MINIM_CONSULTES_MS, INTERVAL_MINIM_CONSULTES_MS];
    for (const [i, espera] of esperes.entries()) {
      // Un instant abans no hi ha cap consulta nova; en complir-se l'espera, el temporitzador la fa.
      rellotge += espera - 1;
      await vi.advanceTimersByTimeAsync(espera - 1);
      expect(fetchImpl, `fallada ${i + 1}`).toHaveBeenCalledTimes(i + 1);
      rellotge += 1;
      await vi.advanceTimersByTimeAsync(1);
      expect(fetchImpl, `reintent ${i + 1}`).toHaveBeenCalledTimes(i + 2);
    }
    expect(asa.estat()).toMatchObject({ motiu: 'sense-xarxa', fallades: esperes.length + 1 });
    asa.tanca();
  });

  test('en segon pla el reintent no pregunta; la tornada a primer pla, sí', async () => {
    vi.useFakeTimers();
    let rellotge = 0;
    const fetchImpl = vi.fn()
      .mockImplementationOnce(async () => { throw new TypeError('Failed to fetch'); })
      .mockImplementation(async () => resposta(manifest()));
    const { asa, finestra, publica } = engega({ fetchImpl, ara: () => rellotge });
    await vi.advanceTimersByTimeAsync(0);
    finestra.document.visibilityState = 'hidden';
    rellotge = RETROCES_FALLADA_MS[0];
    await vi.advanceTimersByTimeAsync(RETROCES_FALLADA_MS[0]);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    finestra.document.visibilityState = 'visible';
    finestra.document.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(publica).toHaveBeenCalledTimes(1);
    asa.tanca();
  });

  test('navigator.onLine fals no pregunta ni gasta cap franja; l’esdeveniment online sí que pregunta', async () => {
    const finestra = Object.assign(new EventTarget(), finestraAmb(), { navigator: { onLine: false } });
    const fetchImpl = fetchAmb(resposta(manifest()));
    const { asa, publica } = engega({ finestra, fetchImpl });
    await torns();
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(asa.estat()?.motiu).toBe('sense-xarxa');
    finestra.navigator.onLine = true;
    finestra.dispatchEvent(new Event('online'));
    await torns();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(publica).toHaveBeenCalledTimes(1);
    // Tancat, 'online' ja no pregunta.
    asa.tanca();
    finestra.dispatchEvent(new Event('online'));
    await torns();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  test('amb l’App oberta i visible, una comprovació cada INTERVAL_PERIODIC_MS (una versió nova arriba sense tancar l’App)', async () => {
    vi.useFakeTimers();
    let rellotge = 0;
    const fetchImpl = fetchAmb(resposta(manifest({ version: '1.2.4', androidBuild: 9 })), resposta(manifest()));
    const { asa, publica } = engega({ fetchImpl, ara: () => rellotge });
    await vi.advanceTimersByTimeAsync(0);
    expect(asa.estat()?.motiu).toBe('al-dia');
    rellotge = INTERVAL_PERIODIC_MS - 1;
    await vi.advanceTimersByTimeAsync(INTERVAL_PERIODIC_MS - 1);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    rellotge = INTERVAL_PERIODIC_MS;
    await vi.advanceTimersByTimeAsync(1);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(publica).toHaveBeenCalledWith(expect.objectContaining({ versioRecomanada: 10 }), FONT_MANIFEST);
    expect(INTERVAL_PERIODIC_MS).toBeGreaterThanOrEqual(INTERVAL_MINIM_CONSULTES_MS);
    // Tancat, cap temporitzador viu.
    asa.tanca();
    expect(vi.getTimerCount()).toBe(0);
  });

  test('ràfegues: una sola consulta en vol i, com a molt, una per interval; la tornada a primer pla pregunta passat l’interval', async () => {
    let rellotge = 1_000;
    const fetchImpl = fetchAmb(resposta(manifest({ version: '1.2.4', androidBuild: 9 })));
    const { asa, finestra } = engega({ fetchImpl, ara: () => rellotge });
    // L'arrencada ja ha preguntat; una crida mentre vola reutilitza la mateixa promesa.
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const primera = asa.comprova();
    expect(asa.comprova()).toBe(primera);
    await primera;
    // Deu tornades a primer pla seguides: cap consulta nova dins de l'interval.
    for (let i = 0; i < 10; i += 1) {
      rellotge += 1_000;
      finestra.document.dispatchEvent(new Event('visibilitychange'));
      finestra.document.dispatchEvent(new Event('resume'));
    }
    await torns();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    // Passat l'interval des de la darrera consulta, la tornada a primer pla torna a preguntar.
    rellotge = 1_000 + INTERVAL_MINIM_CONSULTES_MS;
    finestra.document.dispatchEvent(new Event('visibilitychange'));
    await torns();
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(INTERVAL_MINIM_CONSULTES_MS).toBeGreaterThanOrEqual(5 * 60 * 1000);
    // Un rellotge que torna arrere més d'un interval no deixa el detector mut.
    await torns();
    rellotge -= 3 * INTERVAL_MINIM_CONSULTES_MS;
    finestra.document.dispatchEvent(new Event('resume'));
    await torns();
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    asa.tanca();
  });

  test('passar a segon pla no pregunta; tornar-hi (visibilitychange visible o resume del pont) sí', async () => {
    let rellotge = 0;
    const fetchImpl = fetchAmb(resposta(manifest({ version: '1.2.4', androidBuild: 9 })));
    const { asa, finestra } = engega({ fetchImpl, ara: () => rellotge });
    await torns();
    rellotge = INTERVAL_MINIM_CONSULTES_MS;
    finestra.document.visibilityState = 'hidden';
    finestra.document.dispatchEvent(new Event('visibilitychange'));
    await torns();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    finestra.document.visibilityState = 'visible';
    finestra.document.dispatchEvent(new Event('visibilitychange'));
    await torns();
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    rellotge = 2 * INTERVAL_MINIM_CONSULTES_MS;
    finestra.document.dispatchEvent(new Event('resume'));
    await torns();
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    // Tancat: ni oients ni consultes.
    asa.tanca();
    asa.tanca();
    rellotge = 3 * INTERVAL_MINIM_CONSULTES_MS;
    finestra.document.dispatchEvent(new Event('resume'));
    await expect(asa.comprova()).resolves.toBeNull();
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  test('el servidor retira el build (11 → 10, l’App és la 9): es retira el que esta font havia publicat; una consulta fallida no retira res', async () => {
    let rellotge = 0;
    const fetchImpl = fetchAmb(
      resposta(manifest({ version: '1.2.6', androidBuild: 11 })),
      new TypeError('Failed to fetch'),
      resposta(manifest({ version: '1.2.6', androidBuild: 10 })),
      resposta(manifest({ version: '1.2.4', androidBuild: 9 }))
    );
    const finestra = finestraAmb();
    const asa = iniciaActualitzacioAppNativa({ plataforma: 'android', versioLocal: '1.2.4', buildLocal: 9, finestra, fetchImpl, ara: () => rellotge });
    engegats.push(asa);
    await torns();
    expect(llegixActualitzacioRecomanada()?.versioRecomanada).toBe(11);
    rellotge = INTERVAL_MINIM_CONSULTES_MS;
    await asa.comprova();
    expect(llegixActualitzacioRecomanada()?.versioRecomanada).toBe(11);
    rellotge += RETROCES_FALLADA_MS[0];
    await asa.comprova();
    expect(llegixActualitzacioRecomanada()?.versioRecomanada).toBe(10);
    rellotge += INTERVAL_MINIM_CONSULTES_MS;
    await asa.comprova();
    expect(llegixActualitzacioRecomanada()).toBeNull();
    expect(asa.estat()?.motiu).toBe('al-dia');
    asa.tanca();
  });

  test('dues fonts: el manifest no esborra la del node, i amb el mateix build mana la del node (el seu enllaç)', async () => {
    const ENLLAC_NODE = 'https://play.google.com/store/apps/details?id=org.socdepoble.app&hl=ca';
    publicaActualitzacioRecomanada({ plataforma: 'android', versioRecomanada: 10, enllac: ENLLAC_NODE, marketUrl: null });
    let rellotge = 0;
    const fetchImpl = fetchAmb(resposta(manifest()), resposta(manifest({ version: '1.2.4', androidBuild: 9 })));
    const finestra = finestraAmb();
    const asa = iniciaActualitzacioAppNativa({ plataforma: 'android', versioLocal: '1.2.4', buildLocal: 9, finestra, fetchImpl, ara: () => rellotge });
    engegats.push(asa);
    await torns();
    expect(llegixActualitzacioRecomanada()).toMatchObject({ versioRecomanada: 10, enllac: ENLLAC_NODE });
    // El manifest retira la seua: la del node continua.
    rellotge = INTERVAL_MINIM_CONSULTES_MS;
    await asa.comprova();
    expect(llegixActualitzacioRecomanada()).toMatchObject({ versioRecomanada: 10, enllac: ENLLAC_NODE });
    expect(FONT_NODE).not.toBe(FONT_MANIFEST);
    asa.tanca();
  });

  test('una versió encara més nova en una tornada posterior es torna a publicar; la mateixa, no', async () => {
    let rellotge = 0;
    const fetchImpl = fetchAmb(resposta(manifest()), resposta(manifest()), resposta(manifest({ version: '1.2.6', androidBuild: 11 })));
    const { asa, publica } = engega({ fetchImpl, ara: () => rellotge });
    await torns();
    rellotge = INTERVAL_MINIM_CONSULTES_MS;
    await asa.comprova();
    expect(publica).toHaveBeenCalledTimes(1);
    rellotge = 2 * INTERVAL_MINIM_CONSULTES_MS;
    await asa.comprova();
    expect(publica).toHaveBeenCalledTimes(2);
    expect(publica).toHaveBeenLastCalledWith(expect.objectContaining({ versioRecomanada: 11, versio: '1.2.6' }), FONT_MANIFEST);
    asa.tanca();
  });

  test('un publicador que llança no trenca res, queda a la diagnosi i la consulta següent torna a publicar', async () => {
    let rellotge = 0;
    const publica = vi.fn()
      .mockImplementationOnce(() => { throw new Error('registre trencat'); })
      .mockImplementation(() => {});
    const { asa } = engega({ fetchImpl: fetchAmb(resposta(manifest())), publica, ara: () => rellotge });
    await expect(asa.comprova()).resolves.toBeNull();
    expect(asa.estat()).toMatchObject({ motiu: 'error-publica', build: 10, error: 'registre trencat' });
    rellotge = INTERVAL_MINIM_CONSULTES_MS;
    await asa.comprova();
    expect(publica).toHaveBeenCalledTimes(2);
    expect(asa.estat()?.motiu).toBe('publicada');
    asa.tanca();
  });

  test('una diagnosi que llança no tomba el detector', async () => {
    const { asa, publica } = engega({ fetchImpl: fetchAmb(resposta(manifest())), diagnostica: () => { throw new Error('diagnosi'); } });
    await asa.comprova();
    expect(publica).toHaveBeenCalledTimes(1);
    asa.tanca();
  });

  test('inert: la diagnosi en diu el motiu (sobretot la CSP, que no es veu des de fora)', () => {
    const fetchImpl = fetchAmb(resposta(manifest()));
    expect(engega({ finestra: finestraAmb({ csp: [CSP_SENSE_PERMIS] }), fetchImpl }).asa).toBeNull();
    expect(llegixDiagnosiActualitzacio()).toMatchObject({ motiu: 'inert-csp', url: URL_MANIFEST_VERSIO });
    expect(engega({ plataforma: 'web', fetchImpl }).asa).toBeNull();
    expect(llegixDiagnosiActualitzacio()?.motiu).toBe('inert-plataforma');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  test('amb el registre de veres: la barra rep l’avís, l’ajornament per versió es conserva i una versió més alta torna a eixir', async () => {
    let rellotge = 0;
    const fetchImpl = fetchAmb(resposta(manifest()), resposta(manifest()), resposta(manifest({ version: '1.2.6', androidBuild: 11 })));
    const finestra = finestraAmb();
    const asa = iniciaActualitzacioAppNativa({ plataforma: 'android', versioLocal: '1.2.4', buildLocal: 9, finestra, fetchImpl, ara: () => rellotge });
    await torns();
    expect(llegixActualitzacioRecomanada()).toEqual({ plataforma: 'android', versioRecomanada: 10, enllac: ENLLAC_ANDROID_PLAY, marketUrl: ENLLAC_ANDROID_MARKET });
    expect(descartaActualitzacioRecomanada()).toBe(true);
    expect(llegixActualitzacioRecomanada()).toBeNull();
    // La mateixa versió en la tornada següent: continua ajornada.
    rellotge = INTERVAL_MINIM_CONSULTES_MS;
    finestra.document.dispatchEvent(new Event('resume'));
    await torns();
    expect(llegixActualitzacioRecomanada()).toBeNull();
    // Una de més alta: torna a eixir.
    rellotge = 2 * INTERVAL_MINIM_CONSULTES_MS;
    finestra.document.dispatchEvent(new Event('resume'));
    await torns();
    expect(llegixActualitzacioRecomanada()?.versioRecomanada).toBe(11);
    asa.tanca();
  });

  test('per defecte compara amb la versió i el build d’este paquet (package.json i VERSIO_CLIENT_NATIU)', async () => {
    const publica = vi.fn();
    const igual = iniciaActualitzacioAppNativa({
      plataforma: 'android', finestra: finestraAmb(), publica,
      fetchImpl: fetchAmb(resposta(manifest({ version: VERSIO_SISTEMA, androidBuild: VERSIO_CLIENT_NATIU })))
    });
    await expect(igual.comprova()).resolves.toBeNull();
    igual.tanca();
    const nova = iniciaActualitzacioAppNativa({
      plataforma: 'android', finestra: finestraAmb(), publica,
      fetchImpl: fetchAmb(resposta(manifest({ version: VERSIO_SISTEMA, androidBuild: VERSIO_CLIENT_NATIU + 1 })))
    });
    await expect(nova.comprova()).resolves.toMatchObject({ versioRecomanada: VERSIO_CLIENT_NATIU + 1, versio: VERSIO_SISTEMA });
    expect(publica).toHaveBeenCalledTimes(1);
    nova.tanca();
  });

  test('sense fetch injectat, usa el de la finestra lligat a ella (cap «Illegal invocation»)', async () => {
    const finestra = finestraAmb();
    finestra.fetch = vi.fn(function fetchDeLaFinestra() {
      if (this !== finestra) throw new TypeError('Illegal invocation');
      return Promise.resolve(resposta(manifest()));
    });
    const publica = vi.fn();
    const asa = iniciaActualitzacioAppNativa({ plataforma: 'android', versioLocal: '1.2.4', buildLocal: 9, finestra, publica });
    await asa.comprova();
    expect(finestra.fetch).toHaveBeenCalledTimes(1);
    expect(publica).toHaveBeenCalledTimes(1);
    asa.tanca();
  });
});
