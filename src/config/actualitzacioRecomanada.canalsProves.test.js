/* Onada v1.2.7 · P0-123 (ordre directa del Mestre, 17-11-2026) · El registre de la barra amb els canals
   nous: el que hi entra (un canal de la seua plataforma; l'APK només amb una SHA-256 vàlida; la web
   només des de la seua font), la retirada i l'ajornament, i el botó d'un toc de cada canal (TestFlight
   amb l'esquema i la reserva https, l'APK a l'adreça fixa, la web recarregant). */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  CANALS_ACTUALITZACIO,
  ENLLAC_APK_DIRECTE,
  ENLLAC_TESTFLIGHT,
  ESQUEMA_TESTFLIGHT,
  FONT_MANIFEST,
  FONT_NODE,
  FONT_WEB,
  descartaActualitzacioRecomanada,
  fixaRecarregaWeb,
  llegixActualitzacioRecomanada,
  netejaActualitzacioRecomanadaPerProves,
  obriBotigaActualitzacio,
  publicaActualitzacioRecomanada
} from './actualitzacioRecomanada.js';

const SHA = 'd'.repeat(64);
const tf = { plataforma: 'ios', canal: 'testflight', versioRecomanada: 12, versio: '1.2.7', enllac: ENLLAC_TESTFLIGHT };
const apk = { plataforma: 'android', canal: 'apk', versioRecomanada: 12, versio: '1.2.7', enllac: ENLLAC_APK_DIRECTE, sha256: SHA };
const web = { plataforma: 'web', canal: 'web', versioRecomanada: 1_002_007, versio: '1.2.7' };

beforeEach(() => netejaActualitzacioRecomanadaPerProves());
afterEach(() => {
  vi.useRealTimers();
  netejaActualitzacioRecomanadaPerProves();
});

describe('el que entra al registre', () => {
  test('els tres canals nous, amb la seua forma; l\'avís de la botiga de sempre, amb la forma de sempre', () => {
    publicaActualitzacioRecomanada(tf, FONT_MANIFEST);
    expect(llegixActualitzacioRecomanada()).toEqual({ plataforma: 'ios', versioRecomanada: 12, enllac: ENLLAC_TESTFLIGHT, marketUrl: null, canal: 'testflight', versio: '1.2.7' });
    publicaActualitzacioRecomanada(apk, FONT_MANIFEST);
    expect(llegixActualitzacioRecomanada()).toEqual({ plataforma: 'android', versioRecomanada: 12, enllac: ENLLAC_APK_DIRECTE, marketUrl: null, canal: 'apk', versio: '1.2.7', sha256: SHA });
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
      ['l\'APK a iOS', { ...apk, plataforma: 'ios' }, FONT_MANIFEST],
      ['un canal inventat', { ...tf, canal: 'beta' }, FONT_MANIFEST],
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
    publicaActualitzacioRecomanada(apk, FONT_MANIFEST);
    expect(descartaActualitzacioRecomanada()).toBe(true);
    expect(llegixActualitzacioRecomanada()).toBeNull();
    publicaActualitzacioRecomanada({ ...apk, versioRecomanada: 13, sha256: 'e'.repeat(64) }, FONT_MANIFEST);
    expect(llegixActualitzacioRecomanada()?.versioRecomanada).toBe(13);
  });

  test('el mateix build amb una altra suma avisa els oients (és un altre fitxer)', () => {
    publicaActualitzacioRecomanada(apk, FONT_MANIFEST);
    const primer = llegixActualitzacioRecomanada();
    publicaActualitzacioRecomanada({ ...apk, sha256: 'e'.repeat(64) }, FONT_MANIFEST);
    expect(llegixActualitzacioRecomanada()).not.toBe(primer);
    expect(llegixActualitzacioRecomanada().sha256).toBe('e'.repeat(64));
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

  test('l\'APK: l\'adreça fixa de /descarregues, mai una que porte l\'avís', () => {
    const finestra = finestraAmb();
    expect(obriBotigaActualitzacio({ ...apk, enllac: 'https://atacant.example/app.apk' }, { finestra })).toBe(ENLLAC_APK_DIRECTE);
    expect(finestra.open).toHaveBeenCalledTimes(1);
    expect(finestra.open).toHaveBeenCalledWith(ENLLAC_APK_DIRECTE, '_blank', 'noopener,noreferrer');
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
