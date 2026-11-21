/* Onada v1.2.7 · P0-123 (ordre directa del Mestre, 17-11-2026: «actualització automàtica real als
   mòbils de prova») · Els canals de proves del detector natiu: TestFlight (iOS) i l'APK directe
   (Android), segons d'on ve l'App. Casos: TestFlight, App Store, iOS d'origen desconegut, APK directe,
   Google Play, Android d'origen desconegut, un manifest d'abans sense els camps nous i valors no
   vàlids; i el detector sencer (fetch simulat, l'origen injectat) publicant a la barra el canal i la
   suma. Cap xarxa, cap Capacitor, la consola sempre neta.
   Onada v1.2.16 (ordres del Mestre 261121 01:32 i 01:55: ZERO APK fora de botiga) · El canal de l'APK
   directe es retira: fins a la v1.2.15, una App d'instal·lació directa (ORIGENS.DIRECTA) amb un
   apkDirectBuild més alt rebia l'avís que baixava l'APK amb la seua suma (estes proves ho fixaven). Ara
   cap origen no rep mai cap baixada d'APK: a Android, l'avís és sempre el de Google Play. Les proves
   d'eixe canal passen a provar que no n'hi ha cap; les de TestFlight no canvien.
   v1.2.17 · T-04 · config/actualitzacioRecomanada.js ja no exporta l'adreça de l'APK directe: la prova en
   guarda el literal en una constant local (APK_DIRECTE) per a continuar comprovant que cap avís no la porta. */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  CANALS_ACTUALITZACIO,
  ENLLAC_ANDROID_MARKET,
  ENLLAC_ANDROID_PLAY,
  ENLLAC_IOS_APP_STORE,
  ENLLAC_TESTFLIGHT,
  llegixActualitzacioRecomanada,
  llegixDiagnosiActualitzacio,
  netejaActualitzacioRecomanadaPerProves
} from '../config/actualitzacioRecomanada.js';
import { iniciaActualitzacioAppNativa, llegixManifestVersio, novaVersioDisponible } from './actualitzacioAppNativa.js';
import { ORIGENS } from './origenInstallacio.js';

// v1.2.17 · T-04 · L'adreça de l'APK que la v1.2.16 publicava: cap avís no l'ha de portar mai.
const APK_DIRECTE = 'https://socdepoble.org/descarregues/socdepoble-android-latest.apk';
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
    // v1.2.16 · A Android, cap canal de proves: l'anunci de l'APK d'ambProves no es llig (abans: apkBuild 12 i la suma).
    expect(llegixManifestVersio(ambProves, 'android')).toEqual({ versio: '1.2.7', build: 1 });
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

  /* v1.2.16 · ZERO APK fora de botiga: una App d'instal·lació directa ja no rep cap baixada d'APK. Amb
     androidBuild al sòl, cap avís (abans: l'APK 12 amb la suma); amb un build de Google Play més alt, el de
     Google Play, com qualsevol altre Android. */
  test('v1.2.16 · Android d\'instal·lació directa: mai l\'APK; l\'avís, si n\'hi ha, és el de Google Play', () => {
    expect(nova(ambProves, 'android', ORIGENS.DIRECTA)).toBeNull();
    expect(nova({ ...ambProves, androidBuild: 13 }, 'android', ORIGENS.DIRECTA)).toEqual({
      plataforma: 'android', versioRecomanada: 13, versio: '1.2.7', enllac: ENLLAC_ANDROID_PLAY, marketUrl: ENLLAC_ANDROID_MARKET
    });
  });

  test('v1.2.16 · ZERO APK: cap origen ni cap manifest (tampoc un heretat amb l\'APK ben anunciat) dona un avís d\'APK', () => {
    const heretats = [ambProves, manifest({ apkDirectBuild: 99, apkSha256: SHA }), manifest({ apkDirectBuild: 99, apkSha256: SHA, androidBuild: 13 }),
      manifest({ apkDirectBuild: 99, apkSha256: SHA, latestBuild: 99 })];
    for (const dades of heretats) {
      for (const origen of Object.values(ORIGENS)) {
        for (const local of [LOCAL, { versioLocal: '1.2.7', buildLocal: 1 }]) {
          const avis = nova(dades, 'android', origen, local);
          const text = JSON.stringify(avis);
          expect([origen, avis?.canal ?? null, /apk|sha256/i.test(text), text.includes(APK_DIRECTE)]).toEqual([origen, null, false, false]);
          if (avis) expect([avis.enllac, avis.marketUrl, avis.versioRecomanada]).toEqual([ENLLAC_ANDROID_PLAY, ENLLAC_ANDROID_MARKET, dades.androidBuild]);
        }
      }
    }
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

  /* v1.2.16 · ZERO APK: fins a la v1.2.15, esta App publicava a la barra l'APK amb la seua suma. Ara, amb
     l'anunci heretat de l'APK al manifest, no publica res; amb un build de Google Play més alt, l'avís de
     Google Play. L'origen sabut continua sense tornar-se a preguntar. */
  test('v1.2.16 · una App d\'instal·lació directa no publica mai l\'APK (sí Google Play); l\'origen sabut no es torna a preguntar', async () => {
    let ara = 0;
    const consultaOrigen = vi.fn(async () => ORIGENS.DIRECTA);
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(resposta(ambProves))
      .mockResolvedValueOnce(resposta({ ...ambProves, androidBuild: 13 }));
    const asa = iniciaActualitzacioAppNativa({ plataforma: 'android', finestra: finestraAmb(), fetchImpl, consultaOrigen, ara: () => ara, ...LOCAL });
    await asa.comprova();
    await torns();
    expect(llegixActualitzacioRecomanada()).toBeNull();
    expect(llegixDiagnosiActualitzacio()).toMatchObject({ motiu: 'al-dia', origen: ORIGENS.DIRECTA });
    ara += 24 * 60 * 60 * 1000;
    await asa.comprova();
    await torns();
    expect(llegixActualitzacioRecomanada()).toEqual({
      plataforma: 'android', versioRecomanada: 13, enllac: ENLLAC_ANDROID_PLAY, marketUrl: ENLLAC_ANDROID_MARKET
    });
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
    // v1.2.16 · L'origen ja se sap (DIRECTA), però no hi ha cap APK a publicar (abans: el canal APK).
    expect(llegixActualitzacioRecomanada()).toBeNull();
    expect(llegixDiagnosiActualitzacio()).toMatchObject({ motiu: 'al-dia', origen: ORIGENS.DIRECTA });
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
