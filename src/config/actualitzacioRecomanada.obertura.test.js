/* Auditoria del kit de Gemini R22 (kit_gemini_auditor) · «Actualitza» obri UNA
   sola destinació. Amb la característica 'noopener', window.open torna SEMPRE
   null (HTML, «window open steps»: amb noopener es retorna null), també quan
   ha obert la finestra; la branca market:// no pot saber si ha obert res i
   l'adreça https s'obria sempre darrere: dues botigues alhora a Android. La
   finestra de prova seguix l'estàndard; la del kit tornava {} amb noopener. */
import { afterEach, expect, test } from 'vitest';
import {
  ENLLAC_ANDROID_MARKET,
  ENLLAC_ANDROID_PLAY,
  ENLLAC_IOS_APP_STORE,
  llegixActualitzacioRecomanada,
  netejaActualitzacioRecomanadaPerProves,
  obriBotigaActualitzacio,
  publicaActualitzacioRecomanada
} from './actualitzacioRecomanada.js';

afterEach(() => netejaActualitzacioRecomanadaPerProves());

/** Una finestra com la del navegador: obri sempre i, amb 'noopener', torna null. */
function finestraEstandard() {
  const obertes = [];
  return {
    obertes,
    open(url, _desti, caracteristiques = '') {
      obertes.push(url);
      return /(^|,)\s*noopener\s*(=|,|$)/i.test(String(caracteristiques)) ? null : {};
    }
  };
}

test('Android: un sol toc obri una sola botiga, l’adreça https de Google Play', () => {
  publicaActualitzacioRecomanada({ plataforma: 'android', versioRecomanada: 6, enllac: ENLLAC_ANDROID_PLAY, marketUrl: ENLLAC_ANDROID_MARKET });
  const finestra = finestraEstandard();
  expect(obriBotigaActualitzacio(llegixActualitzacioRecomanada(), { finestra })).toBe(ENLLAC_ANDROID_PLAY);
  expect(finestra.obertes).toEqual([ENLLAC_ANDROID_PLAY]);
});

test('iOS: una sola destinació, l’App Store', () => {
  publicaActualitzacioRecomanada({ plataforma: 'ios', versioRecomanada: 6, enllac: ENLLAC_IOS_APP_STORE, marketUrl: null });
  const finestra = finestraEstandard();
  expect(obriBotigaActualitzacio(llegixActualitzacioRecomanada(), { finestra })).toBe(ENLLAC_IOS_APP_STORE);
  expect(finestra.obertes).toEqual([ENLLAC_IOS_APP_STORE]);
});
