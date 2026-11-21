/* Onada v1.2.7 · P0-123 (ordre directa del Mestre, 17-11-2026) · El registre de la barra amb els canals
   nous: el que hi entra (un canal de la seua plataforma; la web només des de la seua font), la retirada i
   l'ajornament, i el botó d'un toc de cada canal (TestFlight amb l'esquema i la reserva https, la web
   recarregant).
   Onada v1.2.16 · ZERO APK fora de botiga (ordre del Mestre, 21-11-2026) · L'APK directe ja no és canal de
   cap plataforma: un avís APK, tampoc amb la suma bona, no entra al registre, i el botó no obri mai cap APK.
   v1.2.17 · T-04 · El mòdul ja no exporta l'adreça de l'APK directe ni té la clau APK del canal: les proves en
   guarden l'adreça en una constant local (APK_DIRECTE), perquè la defensa (un .apk per https cau a Google Play)
   s'ha de continuar provant, i el canal 'apk' és el literal que podria portar un avís vell o hostil. */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import * as moduldActualitzacio from './actualitzacioRecomanada.js';
import {
  CANALS_ACTUALITZACIO,
  ENLLAC_ANDROID_MARKET,
  ENLLAC_ANDROID_PLAY,
  ENLLAC_TESTFLIGHT,
  ESQUEMA_TESTFLIGHT,
  FONT_MANIFEST,
  FONT_NODE,
  FONT_WEB,
  descartaActualitzacioRecomanada,
  enllacDeLaPlataforma,
  fixaRecarregaWeb,
  llegixActualitzacioRecomanada,
  netejaActualitzacioRecomanadaPerProves,
  obriBotigaActualitzacio,
  publicaActualitzacioRecomanada,
  subscriuActualitzacioRecomanada
} from './actualitzacioRecomanada.js';

// v1.2.17 · T-04 · L'adreça de l'APK que la v1.2.16 publicava, ara només com a adreça d'atacant de les proves.
const APK_DIRECTE = 'https://socdepoble.org/descarregues/socdepoble-android-latest.apk';
const SHA = 'd'.repeat(64);
const tf = { plataforma: 'ios', canal: 'testflight', versioRecomanada: 12, versio: '1.2.7', enllac: ENLLAC_TESTFLIGHT };
const apk = { plataforma: 'android', canal: 'apk', versioRecomanada: 12, versio: '1.2.7', enllac: APK_DIRECTE, sha256: SHA };
const play = { plataforma: 'android', canal: 'play', versioRecomanada: 12, versio: '1.2.7', enllac: ENLLAC_ANDROID_PLAY, marketUrl: ENLLAC_ANDROID_MARKET };
const web = { plataforma: 'web', canal: 'web', versioRecomanada: 1_002_007, versio: '1.2.7' };

beforeEach(() => netejaActualitzacioRecomanadaPerProves());
afterEach(() => {
  vi.useRealTimers();
  netejaActualitzacioRecomanadaPerProves();
});

describe('el que entra al registre', () => {
  test('els canals vius, amb la seua forma; l\'avís de la botiga de sempre, amb la forma de sempre', () => {
    publicaActualitzacioRecomanada(tf, FONT_MANIFEST);
    expect(llegixActualitzacioRecomanada()).toEqual({ plataforma: 'ios', versioRecomanada: 12, enllac: ENLLAC_TESTFLIGHT, marketUrl: null, canal: 'testflight', versio: '1.2.7' });
    publicaActualitzacioRecomanada(play, FONT_MANIFEST);
    expect(llegixActualitzacioRecomanada()).toEqual({ plataforma: 'android', versioRecomanada: 12, enllac: ENLLAC_ANDROID_PLAY, marketUrl: ENLLAC_ANDROID_MARKET, canal: 'play', versio: '1.2.7' });
    publicaActualitzacioRecomanada(null, FONT_MANIFEST);
    publicaActualitzacioRecomanada(web, FONT_WEB);
    expect(llegixActualitzacioRecomanada()).toEqual({ plataforma: 'web', versioRecomanada: 1_002_007, enllac: null, marketUrl: null, canal: 'web', versio: '1.2.7' });
    publicaActualitzacioRecomanada(null, FONT_WEB);
    publicaActualitzacioRecomanada({ plataforma: 'ios', versioRecomanada: 9 }, FONT_NODE);
    expect(Object.keys(llegixActualitzacioRecomanada())).toEqual(['plataforma', 'versioRecomanada', 'enllac', 'marketUrl']);
  });

  test('valors no vàlids: cap avís', () => {
    for (const [cas, dades, font] of [
      ['un canal d\'una altra plataforma', { ...tf, plataforma: 'android' }, FONT_MANIFEST],
      ['l\'APK a Android (v1.2.16, ZERO APK), amb la suma bona', apk, FONT_MANIFEST],
      ['l\'APK a Android des de la font del node', apk, FONT_NODE],
      ['l\'APK a Android des de la font per defecte', apk, null],
      ['l\'APK a iOS', { ...apk, plataforma: 'ios' }, FONT_MANIFEST],
      ['un canal inventat', { ...tf, canal: 'beta' }, FONT_MANIFEST],
      // v1.2.17 · T-04 · La suma ja no es mira: sense suma o amb una de dolenta, l'APK continua fora.
      ['l\'APK sense suma', { ...apk, sha256: undefined }, FONT_MANIFEST],
      ['l\'APK amb una suma en majúscules', { ...apk, sha256: SHA.toUpperCase() }, FONT_MANIFEST],
      ['la web sense versió', { ...web, versio: '1.2' }, FONT_WEB],
      ['la web amb un canal de botiga', { ...web, canal: 'play' }, FONT_WEB],
      ['la web des de la font del manifest', web, FONT_MANIFEST],
      ['la web des de la font per defecte', web, null],
      ['un avís natiu des de la font de la web', tf, FONT_WEB],
      ['un build zero', { ...tf, versioRecomanada: 0 }, FONT_MANIFEST]
    ]) {
      publicaActualitzacioRecomanada(dades, font);
      expect(llegixActualitzacioRecomanada(), cas).toBeNull();
    }
  });

  test('l\'ajornament val per al build del canal; un de més alt torna a eixir', () => {
    publicaActualitzacioRecomanada(tf, FONT_MANIFEST);
    expect(descartaActualitzacioRecomanada()).toBe(true);
    expect(llegixActualitzacioRecomanada()).toBeNull();
    publicaActualitzacioRecomanada({ ...tf, versioRecomanada: 13 }, FONT_MANIFEST);
    expect(llegixActualitzacioRecomanada()?.versioRecomanada).toBe(13);
  });

  test('v1.2.16 · ZERO APK: un avís APK, amb la suma bona i el build més alt, mai desplaça l\'avís de Google Play', () => {
    const oient = vi.fn();
    const desubscriu = subscriuActualitzacioRecomanada(oient);
    try {
      publicaActualitzacioRecomanada(play, FONT_NODE);
      expect(oient).toHaveBeenCalledTimes(1);
      const primer = llegixActualitzacioRecomanada();
      publicaActualitzacioRecomanada({ ...apk, versioRecomanada: 99, sha256: 'e'.repeat(64) }, FONT_MANIFEST);
      expect(llegixActualitzacioRecomanada()).toBe(primer);
      expect(oient).toHaveBeenCalledTimes(1);
      expect(JSON.stringify(llegixActualitzacioRecomanada())).not.toMatch(/apk|sha256/i);
    } finally {
      desubscriu();
    }
  });

  test('v1.2.17 · T-04: ni l\'adreça de l\'APK directe, ni la clau APK del canal, ni cap suma a l\'avís', () => {
    expect(Object.keys(moduldActualitzacio).filter((nom) => /APK/i.test(nom))).toEqual([]);
    expect(Object.keys(CANALS_ACTUALITZACIO)).toEqual(['PLAY', 'APP_STORE', 'TESTFLIGHT', 'WEB']);
    expect(Object.values(CANALS_ACTUALITZACIO)).not.toContain('apk');
    // Un avís de Google Play que porte una suma hi entra sense: el registre ja no en guarda cap.
    publicaActualitzacioRecomanada({ ...play, sha256: SHA }, FONT_MANIFEST);
    expect(llegixActualitzacioRecomanada()).toEqual({ plataforma: 'android', versioRecomanada: 12, enllac: ENLLAC_ANDROID_PLAY, marketUrl: ENLLAC_ANDROID_MARKET, canal: 'play', versio: '1.2.7' });
  });

  /* Gauntlet v1.2.16, ronda 2 (L3R2-03) · A Android, el registre només guarda l'https de play.google.com: un avís
     sense canal, o amb el canal 'play', que porte un APK (o un altre host) hi entra amb la fitxa de Google Play. */
  test('v1.2.16 · ZERO APK: a Android, l\'enllaç d\'un avís que no és de Google Play entra com la fitxa de Google Play', () => {
    for (const [cas, dades, font] of [
      ['sense canal, des del node', { plataforma: 'android', versioRecomanada: 99, enllac: APK_DIRECTE, marketUrl: null }, FONT_NODE],
      ['amb el canal play, des del manifest', { ...play, enllac: APK_DIRECTE }, FONT_MANIFEST],
      ['un host que comença per play.google.com', { ...play, enllac: 'https://play.google.com.atacant.example/app.apk' }, FONT_MANIFEST],
      ['play.google.com com a usuari', { ...play, enllac: 'https://play.google.com@atacant.example/app.apk' }, FONT_MANIFEST],
      ['play.google.com amb un altre port', { ...play, enllac: 'https://play.google.com:8443/app.apk' }, FONT_MANIFEST]
    ]) {
      netejaActualitzacioRecomanadaPerProves();
      publicaActualitzacioRecomanada(dades, font);
      expect(llegixActualitzacioRecomanada()?.enllac, cas).toBe(ENLLAC_ANDROID_PLAY);
      expect(JSON.stringify(llegixActualitzacioRecomanada()), cas).not.toMatch(/\.apk/i);
    }
    netejaActualitzacioRecomanadaPerProves();
    publicaActualitzacioRecomanada({ ...play, enllac: `${ENLLAC_ANDROID_PLAY}&hl=ca` }, FONT_MANIFEST);
    expect(llegixActualitzacioRecomanada()?.enllac).toBe(`${ENLLAC_ANDROID_PLAY}&hl=ca`);
    // Sense enllaç https, com sempre: null, i el botó obri la botiga per defecte.
    netejaActualitzacioRecomanadaPerProves();
    publicaActualitzacioRecomanada({ ...play, enllac: 'http://play.google.com/' }, FONT_MANIFEST);
    expect(llegixActualitzacioRecomanada()?.enllac).toBeNull();
    expect(enllacDeLaPlataforma('android', null)).toBeNull();
    expect(enllacDeLaPlataforma('ios', APK_DIRECTE)).toBe(APK_DIRECTE);
  });
});

/** Una finestra amb document EventTarget, temporitzadors falsos i window.open espiat. */
function finestraAmb() {
  const document = new EventTarget();
  document.visibilityState = 'visible';
  const finestra = new EventTarget();
  finestra.document = document;
  finestra.open = vi.fn();
  finestra.setTimeout = (...a) => setTimeout(...a);
  finestra.clearTimeout = (id) => clearTimeout(id);
  finestra.location = { reload: vi.fn() };
  return finestra;
}

describe('el botó d\'un toc', () => {
  test('TestFlight: obri l\'app TestFlight i, si l\'App no perd el primer pla, l\'adreça https de reserva', () => {
    vi.useFakeTimers();
    const finestra = finestraAmb();
    expect(obriBotigaActualitzacio(tf, { finestra, espera: 1500 })).toBe(ESQUEMA_TESTFLIGHT);
    expect(finestra.open).toHaveBeenCalledWith(ESQUEMA_TESTFLIGHT, '_blank', 'noopener,noreferrer');
    vi.advanceTimersByTime(1500);
    expect(finestra.open).toHaveBeenLastCalledWith(ENLLAC_TESTFLIGHT, '_blank', 'noopener,noreferrer');
    expect(finestra.open).toHaveBeenCalledTimes(2);
  });

  test('TestFlight s\'obri (l\'App passa a segon pla): cap reserva', () => {
    vi.useFakeTimers();
    const finestra = finestraAmb();
    obriBotigaActualitzacio(tf, { finestra, espera: 1500 });
    finestra.document.visibilityState = 'hidden';
    finestra.document.dispatchEvent(new Event('visibilitychange'));
    vi.advanceTimersByTime(5000);
    expect(finestra.open).toHaveBeenCalledTimes(1);
    expect(ESQUEMA_TESTFLIGHT).toBe('itms-beta://beta.itunes.apple.com/v1/app/6826441844');
    expect(ENLLAC_TESTFLIGHT).toBe('https://beta.itunes.apple.com/v1/app/6826441844');
  });

  test('v1.2.16 · ZERO APK: el botó no obri cap APK, ni l\'adreça fixa, ni la que porte l\'avís, ni la botiga', () => {
    vi.useFakeTimers();
    const finestra = finestraAmb();
    for (const avis of [
      apk,
      { ...apk, enllac: 'https://atacant.example/app.apk' },
      { ...apk, marketUrl: ENLLAC_ANDROID_MARKET },
      { ...apk, enllac: undefined, sha256: undefined },
      { ...apk, plataforma: 'ios' },
      { ...apk, plataforma: 'desconeguda' }
    ]) {
      expect(obriBotigaActualitzacio(avis, { finestra, espera: 1500 }), JSON.stringify(avis)).toBeNull();
    }
    vi.advanceTimersByTime(5000);
    expect(finestra.open).not.toHaveBeenCalled();
    // L'avís de Google Play continua obrint la botiga: market:// i, si l'App no perd el primer pla, l'https.
    expect(obriBotigaActualitzacio(play, { finestra, espera: 1500 })).toBe(ENLLAC_ANDROID_MARKET);
    vi.advanceTimersByTime(1500);
    expect(finestra.open.mock.calls.map(([url]) => url)).toEqual([ENLLAC_ANDROID_MARKET, ENLLAC_ANDROID_PLAY]);
  });

  /* Gauntlet v1.2.16, ronda 2 (L3R2-03) · La guarda no mira només el canal: un avís Android sense canal, o amb el
     canal 'play', que porte l'adreça https d'un APK obri la fitxa de Google Play (o el market://), mai l'APK. */
  test('v1.2.16 · ZERO APK: a Android, un avís sense canal o amb el canal \'play\' que porte un APK obri Google Play', () => {
    vi.useFakeTimers();
    const finestra = finestraAmb();
    const senseCanal = { plataforma: 'android', versioRecomanada: 99, enllac: APK_DIRECTE, marketUrl: null };
    expect(obriBotigaActualitzacio(senseCanal, { finestra, espera: 1500 })).toBe(ENLLAC_ANDROID_PLAY);
    expect(obriBotigaActualitzacio({ ...senseCanal, enllac: 'https://play.google.com.atacant.example/app.apk' }, { finestra, espera: 1500 }))
      .toBe(ENLLAC_ANDROID_PLAY);
    expect(obriBotigaActualitzacio({ ...play, enllac: 'https://atacant.example/app.apk' }, { finestra, espera: 1500 })).toBe(ENLLAC_ANDROID_MARKET);
    vi.advanceTimersByTime(1500);
    expect(finestra.open.mock.calls.map(([url]) => url)).toEqual([ENLLAC_ANDROID_PLAY, ENLLAC_ANDROID_PLAY, ENLLAC_ANDROID_MARKET, ENLLAC_ANDROID_PLAY]);
    // La fitxa de Google Play que porte l'avís es conserva (amb la llengua); iOS no canvia.
    const PLAY_CA = `${ENLLAC_ANDROID_PLAY}&hl=ca`;
    expect(obriBotigaActualitzacio({ ...senseCanal, enllac: PLAY_CA }, { finestra, espera: 1500 })).toBe(PLAY_CA);
    expect(obriBotigaActualitzacio({ plataforma: 'ios', versioRecomanada: 99, enllac: 'https://apps.apple.com/es/app/x/id1' }, { finestra }))
      .toBe('https://apps.apple.com/es/app/x/id1');
  });

  test('la web: recarrega amb el recarregador de la PWA; sense, la recàrrega de sempre', () => {
    const finestra = finestraAmb();
    expect(obriBotigaActualitzacio(web, { finestra })).toBe(CANALS_ACTUALITZACIO.WEB);
    expect(finestra.location.reload).toHaveBeenCalledTimes(1);
    expect(finestra.open).not.toHaveBeenCalled();
    const recarrega = vi.fn();
    fixaRecarregaWeb(recarrega);
    expect(obriBotigaActualitzacio(web, { finestra })).toBe(CANALS_ACTUALITZACIO.WEB);
    expect(recarrega).toHaveBeenCalledTimes(1);
    expect(finestra.location.reload).toHaveBeenCalledTimes(1);
    fixaRecarregaWeb(() => { throw new Error('res'); });
    expect(obriBotigaActualitzacio(web, { finestra })).toBeNull();
    fixaRecarregaWeb(null);
    expect(obriBotigaActualitzacio(web, { finestra: { location: {} } })).toBeNull();
  });
});
