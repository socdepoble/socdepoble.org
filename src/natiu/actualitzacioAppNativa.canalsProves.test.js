/* Onada v1.2.7 · P0-123 (ordre directa del Mestre, 17-11-2026: «actualització automàtica real als
   mòbils de prova») · Els canals de proves del detector natiu: TestFlight (iOS) i l'APK directe
   (Android), segons d'on ve l'App. Casos: TestFlight, App Store, iOS d'origen desconegut, APK directe,
   Google Play, Android d'origen desconegut, un manifest d'abans sense els camps nous i valors no
   vàlids; i el detector sencer (fetch simulat, l'origen injectat) publicant a la barra el canal i la
   suma. Cap xarxa, cap Capacitor, la consola sempre neta. */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  CANALS_ACTUALITZACIO,
  ENLLAC_ANDROID_MARKET,
  ENLLAC_ANDROID_PLAY,
  ENLLAC_APK_DIRECTE,
  ENLLAC_IOS_APP_STORE,
  ENLLAC_TESTFLIGHT,
  llegixActualitzacioRecomanada,
  llegixDiagnosiActualitzacio,
  netejaActualitzacioRecomanadaPerProves
} from '../config/actualitzacioRecomanada.js';
import { iniciaActualitzacioAppNativa, llegixManifestVersio, novaVersioDisponible } from './actualitzacioAppNativa.js';
import { ORIGENS } from './origenInstallacio.js';

const SHA = 'c'.repeat(64);
const LOCAL = Object.freeze({ versioLocal: '1.2.6', buildLocal: 11 });
const manifest = (camps = {}) => ({ version: '1.2.7', androidBuild: 1, iosBuild: 1, entries: [], ...camps });
const ambProves = manifest({ testflightIosBuild: 12, apkDirectBuild: 12, apkSha256: SHA, latestBuild: 12 });
const nova = (dades, plataforma, origen, local = LOCAL) => novaVersioDisponible(llegixManifestVersio(dades, plataforma), { plataforma, origen, ...local });

let consola;
beforeEach(() => {
  netejaActualitzacioRecomanadaPerProves();
  consola = ['log', 'info', 'warn', 'error', 'debug'].map((nivell) => vi.spyOn(console, nivell));
});
afterEach(() => {
  for (const espia of consola) expect(espia).not.toHaveBeenCalled();
  vi.restoreAllMocks();
  netejaActualitzacioRecomanadaPerProves();
});

describe('llegixManifestVersio amb els canals de proves', () => {
  test('cada plataforma llig el seu canal de proves, només si és vàlid; un manifest d\'abans dona el mateix d\'abans', () => {
    expect(llegixManifestVersio(ambProves, 'ios')).toEqual({ versio: '1.2.7', build: 1, testflightBuild: 12 });
    expect(llegixManifestVersio(ambProves, 'android')).toEqual({ versio: '1.2.7', build: 1, apkBuild: 12, apkSha256: SHA });
    expect(llegixManifestVersio(manifest(), 'ios')).toEqual({ versio: '1.2.7', build: 1 });
    expect(llegixManifestVersio(manifest(), 'android')).toEqual({ versio: '1.2.7', build: 1 });
    expect(llegixManifestVersio(manifest({ testflightIosBuild: '12' }), 'ios')).toEqual({ versio: '1.2.7', build: 1 });
    expect(llegixManifestVersio(manifest({ apkDirectBuild: 12 }), 'android')).toEqual({ versio: '1.2.7', build: 1 });
    expect(llegixManifestVersio(manifest({ apkDirectBuild: 12, apkSha256: 'C'.repeat(64) }), 'android')).toEqual({ versio: '1.2.7', build: 1 });
    // El build de la botiga pública continua sent obligatori: sense, el manifest no val (com abans).
    expect(llegixManifestVersio({ version: '1.2.7', testflightIosBuild: 12 }, 'ios')).toBeNull();
  });
});

describe('novaVersioDisponible segons l\'origen', () => {
  test('iOS de TestFlight: l\'avís obri TestFlight', () => {
    expect(nova(ambProves, 'ios', ORIGENS.TESTFLIGHT)).toEqual({
      plataforma: 'ios', canal: CANALS_ACTUALITZACIO.TESTFLIGHT, versioRecomanada: 12, versio: '1.2.7', enllac: ENLLAC_TESTFLIGHT, marketUrl: null
    });
  });

  test('P0123-02 · iOS d\'origen desconegut (una App de l\'App Store amb el pont mut): mai TestFlight, el de l\'App Store', () => {
    expect(nova(ambProves, 'ios', ORIGENS.DESCONEGUT)).toBeNull();
    // Per defecte, l'origen és desconegut.
    expect(novaVersioDisponible(llegixManifestVersio(ambProves, 'ios'), { plataforma: 'ios', ...LOCAL })).toBeNull();
    expect(nova({ ...ambProves, iosBuild: 13 }, 'ios', ORIGENS.DESCONEGUT)).toEqual({
      plataforma: 'ios', versioRecomanada: 13, versio: '1.2.7', enllac: ENLLAC_IOS_APP_STORE, marketUrl: null
    });
  });

  test('iOS de l\'App Store: el comportament de sempre (iosBuild), mai TestFlight', () => {
    expect(nova(ambProves, 'ios', ORIGENS.APP_STORE)).toBeNull();
    expect(nova({ ...ambProves, iosBuild: 13 }, 'ios', ORIGENS.APP_STORE)).toEqual({
      plataforma: 'ios', versioRecomanada: 13, versio: '1.2.7', enllac: ENLLAC_IOS_APP_STORE, marketUrl: null
    });
  });

  test('Android d\'instal·lació directa: l\'avís baixa l\'APK i porta la seua suma', () => {
    expect(nova(ambProves, 'android', ORIGENS.DIRECTA)).toEqual({
      plataforma: 'android', canal: CANALS_ACTUALITZACIO.APK, versioRecomanada: 12, versio: '1.2.7', enllac: ENLLAC_APK_DIRECTE, marketUrl: null, sha256: SHA
    });
    expect(ENLLAC_APK_DIRECTE).toBe('https://socdepoble.org/descarregues/socdepoble-android-latest.apk');
  });

  test('Android de Google Play, o d\'origen desconegut: el comportament de sempre (androidBuild i Google Play), mai l\'APK', () => {
    for (const origen of [ORIGENS.PLAY, ORIGENS.DESCONEGUT]) {
      expect(nova(ambProves, 'android', origen), origen).toBeNull();
      expect(nova({ ...ambProves, androidBuild: 13 }, 'android', origen), origen).toEqual({
        plataforma: 'android', versioRecomanada: 13, versio: '1.2.7', enllac: ENLLAC_ANDROID_PLAY, marketUrl: ENLLAC_ANDROID_MARKET
      });
    }
  });

  test('el canal de proves al dia (o per davall) torna a la botiga pública; i els orígens no es creuen de plataforma', () => {
    expect(nova(ambProves, 'ios', ORIGENS.TESTFLIGHT, { versioLocal: '1.2.7', buildLocal: 12 })).toBeNull();
    expect(nova({ ...ambProves, iosBuild: 13 }, 'ios', ORIGENS.TESTFLIGHT, { versioLocal: '1.2.7', buildLocal: 12 })?.enllac).toBe(ENLLAC_IOS_APP_STORE);
    expect(nova(ambProves, 'android', ORIGENS.DIRECTA, { versioLocal: '1.2.7', buildLocal: 12 })).toBeNull();
    expect(nova(ambProves, 'android', ORIGENS.TESTFLIGHT)).toBeNull();
    expect(nova(ambProves, 'ios', ORIGENS.DIRECTA)).toBeNull();
  });

  test('el veto de la versió semàntica val per als canals de proves: un servidor més vell no anuncia res', () => {
    expect(nova({ ...ambProves, version: '1.2.5' }, 'ios', ORIGENS.TESTFLIGHT)).toBeNull();
    expect(nova({ ...ambProves, version: '1.2.5' }, 'android', ORIGENS.DIRECTA)).toBeNull();
    expect(nova(ambProves, 'ios', ORIGENS.TESTFLIGHT, { versioLocal: 'dev', buildLocal: 11 })).toBeNull();
    expect(nova(ambProves, 'android', ORIGENS.DIRECTA, { versioLocal: '1.2.6', buildLocal: '11' })).toBeNull();
  });

  test('un manifest d\'abans o amb els camps nous mal formats: el mateix que abans per a tots els orígens', () => {
    for (const dades of [manifest(), manifest({ testflightIosBuild: 0, apkDirectBuild: 12 }), manifest({ apkSha256: SHA }), manifest({ testflightIosBuild: 12.5, apkDirectBuild: '12', apkSha256: SHA })]) {
      for (const origen of Object.values(ORIGENS)) {
        expect(nova(dades, 'ios', origen), `${JSON.stringify(dades)} ${origen}`).toBeNull();
        expect(nova(dades, 'android', origen), `${JSON.stringify(dades)} ${origen}`).toBeNull();
      }
    }
  });
});

/** Una finestra mínima de la closca: la CSP que deixa connectar amb socdepoble.org. */
function finestraAmb() {
  const document = new EventTarget();
  document.visibilityState = 'visible';
  const csp = "default-src 'self'; connect-src 'self' https://socdepoble.org";
  document.querySelectorAll = (selector) => (selector === 'meta[http-equiv]'
    ? [{ getAttribute: (nom) => ({ 'http-equiv': 'Content-Security-Policy', content: csp }[nom] ?? null) }]
    : []);
  return { document, setTimeout: (...a) => setTimeout(...a), clearTimeout: (id) => clearTimeout(id), addEventListener() {}, removeEventListener() {} };
}
const resposta = (cos) => ({ ok: true, status: 200, text: async () => JSON.stringify(cos) });
const torns = () => new Promise((resolve) => { setTimeout(resolve, 0); });

describe('el detector sencer', () => {
  test('una App de TestFlight publica a la barra el canal de TestFlight, i la diagnosi diu l\'origen', async () => {
    const consultaOrigen = vi.fn(async () => ORIGENS.TESTFLIGHT);
    const asa = iniciaActualitzacioAppNativa({
      plataforma: 'ios', finestra: finestraAmb(), fetchImpl: vi.fn(async () => resposta(ambProves)), consultaOrigen, ...LOCAL
    });
    await asa.comprova();
    await torns();
    expect(llegixActualitzacioRecomanada()).toEqual({
      plataforma: 'ios', versioRecomanada: 12, enllac: ENLLAC_TESTFLIGHT, marketUrl: null, canal: CANALS_ACTUALITZACIO.TESTFLIGHT, versio: '1.2.7'
    });
    expect(llegixDiagnosiActualitzacio()).toMatchObject({ motiu: 'publicada', origen: ORIGENS.TESTFLIGHT, canal: 'testflight', buildCanal: 12 });
    asa.tanca();
  });

  test('una App d\'instal·lació directa publica l\'APK amb la seua suma; l\'origen sabut no es torna a preguntar', async () => {
    let ara = 0;
    const consultaOrigen = vi.fn(async () => ORIGENS.DIRECTA);
    const fetchImpl = vi.fn(async () => resposta(ambProves));
    const asa = iniciaActualitzacioAppNativa({ plataforma: 'android', finestra: finestraAmb(), fetchImpl, consultaOrigen, ara: () => ara, ...LOCAL });
    await asa.comprova();
    await torns();
    expect(llegixActualitzacioRecomanada()).toEqual({
      plataforma: 'android', versioRecomanada: 12, enllac: ENLLAC_APK_DIRECTE, marketUrl: null, canal: CANALS_ACTUALITZACIO.APK, versio: '1.2.7', sha256: SHA
    });
    ara += 24 * 60 * 60 * 1000;
    await asa.comprova();
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(consultaOrigen).toHaveBeenCalledTimes(1);
    asa.tanca();
  });

  test('una App de Google Play continua amb el comportament d\'ara: amb androidBuild al sòl, cap avís', async () => {
    const asa = iniciaActualitzacioAppNativa({
      plataforma: 'android', finestra: finestraAmb(), fetchImpl: vi.fn(async () => resposta(ambProves)), consultaOrigen: async () => ORIGENS.PLAY, ...LOCAL
    });
    await asa.comprova();
    expect(llegixActualitzacioRecomanada()).toBeNull();
    expect(llegixDiagnosiActualitzacio()).toMatchObject({ motiu: 'al-dia', origen: ORIGENS.PLAY });
    asa.tanca();
  });

  test('un origen que no se sap es torna a preguntar; una consulta que llança o torna brossa és desconegut', async () => {
    let ara = 0;
    const respostes = [Promise.reject(new Error('pont')), 'brossa', ORIGENS.DIRECTA];
    const consultaOrigen = vi.fn(() => respostes.shift());
    const asa = iniciaActualitzacioAppNativa({
      plataforma: 'android', finestra: finestraAmb(), fetchImpl: vi.fn(async () => resposta(ambProves)), consultaOrigen, ara: () => ara, ...LOCAL
    });
    await asa.comprova();
    expect(llegixActualitzacioRecomanada()).toBeNull();
    ara += 24 * 60 * 60 * 1000;
    await asa.comprova();
    expect(llegixActualitzacioRecomanada()).toBeNull();
    ara += 24 * 60 * 60 * 1000;
    await asa.comprova();
    expect(llegixActualitzacioRecomanada()?.canal).toBe(CANALS_ACTUALITZACIO.APK);
    expect(consultaOrigen).toHaveBeenCalledTimes(3);
    asa.tanca();
  });

  test('P0123-02 · un iPhone d\'origen desconegut no publica TestFlight a la barra; quan l\'origen es demostra TestFlight, sí', async () => {
    let ara = 0;
    const respostes = [ORIGENS.DESCONEGUT, ORIGENS.TESTFLIGHT];
    const asa = iniciaActualitzacioAppNativa({
      plataforma: 'ios', finestra: finestraAmb(), fetchImpl: vi.fn(async () => resposta(ambProves)), consultaOrigen: async () => respostes.shift(), ara: () => ara, ...LOCAL
    });
    await asa.comprova();
    expect(llegixActualitzacioRecomanada()).toBeNull();
    expect(llegixDiagnosiActualitzacio()).toMatchObject({ motiu: 'al-dia', origen: ORIGENS.DESCONEGUT });
    ara += 24 * 60 * 60 * 1000;
    await asa.comprova();
    expect(llegixActualitzacioRecomanada()?.canal).toBe(CANALS_ACTUALITZACIO.TESTFLIGHT);
    asa.tanca();
  });

  test('si el manifest retira el canal de proves (o el baixa al build instal·lat), la barra el retira en la mateixa sessió', async () => {
    let ara = 0;
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(resposta(ambProves))
      .mockResolvedValueOnce(resposta(manifest()));
    const asa = iniciaActualitzacioAppNativa({ plataforma: 'ios', finestra: finestraAmb(), fetchImpl, consultaOrigen: async () => ORIGENS.TESTFLIGHT, ara: () => ara, ...LOCAL });
    await asa.comprova();
    expect(llegixActualitzacioRecomanada()?.canal).toBe(CANALS_ACTUALITZACIO.TESTFLIGHT);
    ara += 24 * 60 * 60 * 1000;
    await asa.comprova();
    expect(llegixActualitzacioRecomanada()).toBeNull();
    asa.tanca();
  });
});
