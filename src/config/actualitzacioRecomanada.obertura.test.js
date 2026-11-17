/* Auditoria del kit de Gemini R22 (kit_gemini_auditor) · «Actualitza» no obri
   mai dues botigues. Amb la característica 'noopener', window.open torna SEMPRE
   null (HTML, «window open steps»: amb noopener es retorna null), també quan
   ha obert la finestra; la branca market:// del kit decidia la reserva per eixe
   valor i l'adreça https s'obria sempre darrere: dues botigues alhora a Android.
   La finestra de prova seguix l'estàndard; la del kit tornava {} amb noopener.

   Onada R32.3 (ordre del Mestre, 16-11-2026 22:09) · Android torna a provar
   market:// (l'app de Google Play sense passar pel navegador), però la reserva
   https ja no depén de window.open: només s'obri si, passada l'espera, l'App
   continua en primer pla. Si Google Play s'ha obert, l'App ha rebut `pause` (el
   pont de Capacitor), `visibilitychange` amagat o `pagehide`, i la reserva es
   cancel·la. Sense document ni temporitzadors, una sola destinació: l'https. */
import { afterEach, expect, test, vi } from 'vitest';
import {
  ENLLAC_ANDROID_MARKET,
  ENLLAC_ANDROID_PLAY,
  ENLLAC_IOS_APP_STORE,
  ESPERA_RESERVA_MARKET_MS,
  FONT_MANIFEST,
  FONT_NODE,
  anotaDiagnosiActualitzacio,
  descartaActualitzacioRecomanada,
  llegixActualitzacioRecomanada,
  llegixDiagnosiActualitzacio,
  netejaActualitzacioRecomanadaPerProves,
  obriBotigaActualitzacio,
  publicaActualitzacioRecomanada
} from './actualitzacioRecomanada.js';

afterEach(() => {
  netejaActualitzacioRecomanadaPerProves();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

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

/** La finestra de la closca de Capacitor: la d'abans, amb document, esdeveniments i temporitzadors. */
function finestraDeLaClosca({ obriLlanca = () => false } = {}) {
  const finestra = Object.assign(new EventTarget(), finestraEstandard());
  const obri = finestra.open;
  finestra.open = (url, ...resta) => {
    if (obriLlanca(url)) throw new Error('esquema sense app');
    return obri(url, ...resta);
  };
  finestra.document = Object.assign(new EventTarget(), { visibilityState: 'visible' });
  finestra.setTimeout = (...args) => setTimeout(...args);
  finestra.clearTimeout = (id) => clearTimeout(id);
  return finestra;
}

const ANDROID = Object.freeze({ plataforma: 'android', versioRecomanada: 6, enllac: ENLLAC_ANDROID_PLAY, marketUrl: ENLLAC_ANDROID_MARKET });

test('Android en una finestra sense document ni temporitzadors: una sola botiga, l’adreça https de Google Play', () => {
  publicaActualitzacioRecomanada(ANDROID);
  const finestra = finestraEstandard();
  expect(obriBotigaActualitzacio(llegixActualitzacioRecomanada(), { finestra })).toBe(ENLLAC_ANDROID_PLAY);
  expect(finestra.obertes).toEqual([ENLLAC_ANDROID_PLAY]);
});

test('Android a la closca: market:// i, si Google Play pren el primer pla (pause del pont), cap reserva', async () => {
  vi.useFakeTimers();
  publicaActualitzacioRecomanada(ANDROID);
  const finestra = finestraDeLaClosca();
  expect(obriBotigaActualitzacio(llegixActualitzacioRecomanada(), { finestra })).toBe(ENLLAC_ANDROID_MARKET);
  expect(finestra.obertes).toEqual([ENLLAC_ANDROID_MARKET]);
  finestra.document.dispatchEvent(new Event('pause'));
  await vi.advanceTimersByTimeAsync(ESPERA_RESERVA_MARKET_MS * 2);
  expect(finestra.obertes).toEqual([ENLLAC_ANDROID_MARKET]);
});

test('Android a la closca: visibilitychange amagat o pagehide també cancel·len la reserva; un visibilitychange visible, no', async () => {
  vi.useFakeTimers();
  for (const marxa of [
    (f) => { f.document.visibilityState = 'hidden'; f.document.dispatchEvent(new Event('visibilitychange')); },
    (f) => f.dispatchEvent(new Event('pagehide'))
  ]) {
    const finestra = finestraDeLaClosca();
    obriBotigaActualitzacio(ANDROID, { finestra });
    marxa(finestra);
    finestra.document.visibilityState = 'visible';
    await vi.advanceTimersByTimeAsync(ESPERA_RESERVA_MARKET_MS);
    expect(finestra.obertes).toEqual([ENLLAC_ANDROID_MARKET]);
  }
  const finestra = finestraDeLaClosca();
  obriBotigaActualitzacio(ANDROID, { finestra });
  finestra.document.dispatchEvent(new Event('visibilitychange'));
  await vi.advanceTimersByTimeAsync(ESPERA_RESERVA_MARKET_MS);
  expect(finestra.obertes).toEqual([ENLLAC_ANDROID_MARKET, ENLLAC_ANDROID_PLAY]);
});

test('Android sense Google Play (l’App no perd el primer pla): passada l’espera, l’https de reserva, una sola volta', async () => {
  vi.useFakeTimers();
  const finestra = finestraDeLaClosca();
  obriBotigaActualitzacio(ANDROID, { finestra });
  await vi.advanceTimersByTimeAsync(ESPERA_RESERVA_MARKET_MS - 1);
  expect(finestra.obertes).toEqual([ENLLAC_ANDROID_MARKET]);
  await vi.advanceTimersByTimeAsync(1);
  expect(finestra.obertes).toEqual([ENLLAC_ANDROID_MARKET, ENLLAC_ANDROID_PLAY]);
  // Un pause tardà o més temps no obrin res més.
  finestra.document.dispatchEvent(new Event('pause'));
  await vi.advanceTimersByTimeAsync(ESPERA_RESERVA_MARKET_MS * 3);
  expect(finestra.obertes).toEqual([ENLLAC_ANDROID_MARKET, ENLLAC_ANDROID_PLAY]);
  expect(ESPERA_RESERVA_MARKET_MS).toBeLessThanOrEqual(2000);
});

test('Android: si window.open llança amb market://, l’https a l’acte i cap reserva pendent', async () => {
  vi.useFakeTimers();
  const finestra = finestraDeLaClosca({ obriLlanca: (url) => url.startsWith('market:') });
  expect(obriBotigaActualitzacio(ANDROID, { finestra })).toBe(ENLLAC_ANDROID_PLAY);
  expect(finestra.obertes).toEqual([ENLLAC_ANDROID_PLAY]);
  await vi.advanceTimersByTimeAsync(ESPERA_RESERVA_MARKET_MS * 2);
  expect(finestra.obertes).toEqual([ENLLAC_ANDROID_PLAY]);
});

test('Android: un marketUrl que no és la fitxa de l’App no s’obri mai; va directe a l’https', () => {
  const finestra = finestraDeLaClosca();
  for (const marketUrl of ['market://search?q=poble', 'intent://details?id=org.socdepoble.app', 'market://details?id=org.socdepoble.app&x=<y>', null]) {
    finestra.obertes.length = 0;
    expect(obriBotigaActualitzacio({ ...ANDROID, marketUrl }, { finestra }), String(marketUrl)).toBe(ENLLAC_ANDROID_PLAY);
    expect(finestra.obertes).toEqual([ENLLAC_ANDROID_PLAY]);
  }
});

test('iOS: una sola destinació, l’App Store, també a la closca', async () => {
  vi.useFakeTimers();
  publicaActualitzacioRecomanada({ plataforma: 'ios', versioRecomanada: 6, enllac: ENLLAC_IOS_APP_STORE, marketUrl: null });
  for (const finestra of [finestraEstandard(), finestraDeLaClosca()]) {
    expect(obriBotigaActualitzacio(llegixActualitzacioRecomanada(), { finestra })).toBe(ENLLAC_IOS_APP_STORE);
    await vi.advanceTimersByTimeAsync(ESPERA_RESERVA_MARKET_MS * 2);
    expect(finestra.obertes).toEqual([ENLLAC_IOS_APP_STORE]);
  }
});

test('R32.3 · dues fonts: la barra mostra la més alta, l’ordre d’arribada no importa i cap font esborra l’altra', () => {
  for (const ordre of [[FONT_NODE, FONT_MANIFEST], [FONT_MANIFEST, FONT_NODE]]) {
    netejaActualitzacioRecomanadaPerProves();
    publicaActualitzacioRecomanada({ ...ANDROID, versioRecomanada: ordre[0] === FONT_NODE ? 10 : 7 }, ordre[0]);
    publicaActualitzacioRecomanada({ ...ANDROID, versioRecomanada: ordre[1] === FONT_NODE ? 10 : 7 }, ordre[1]);
    expect(llegixActualitzacioRecomanada()?.versioRecomanada, ordre.join('→')).toBe(10);
  }
  // La retirada d'una font (null amb font) no toca l'altra.
  publicaActualitzacioRecomanada({ ...ANDROID, versioRecomanada: 11 }, FONT_MANIFEST);
  expect(llegixActualitzacioRecomanada()?.versioRecomanada).toBe(11);
  publicaActualitzacioRecomanada(null, FONT_MANIFEST);
  expect(llegixActualitzacioRecomanada()?.versioRecomanada).toBe(10);
  // Una font desconeguda no fa res.
  publicaActualitzacioRecomanada({ ...ANDROID, versioRecomanada: 99 }, 'una-altra');
  expect(llegixActualitzacioRecomanada()?.versioRecomanada).toBe(10);
  // null sense font les buida totes (la porta de versió mínima quan bloqueja l'App).
  publicaActualitzacioRecomanada({ ...ANDROID, versioRecomanada: 12 }, FONT_MANIFEST);
  publicaActualitzacioRecomanada(null);
  expect(llegixActualitzacioRecomanada()).toBeNull();
});

test('R32.3 (Elefant) · una font pot rebaixar o retirar la seua: un build retirat de la botiga deixa de prometre’s en la mateixa sessió', () => {
  publicaActualitzacioRecomanada({ ...ANDROID, versioRecomanada: 11 }, FONT_MANIFEST);
  publicaActualitzacioRecomanada({ ...ANDROID, versioRecomanada: 10 }, FONT_MANIFEST);
  expect(llegixActualitzacioRecomanada()?.versioRecomanada).toBe(10);
  // Sense font és la del node (la font per defecte dels qui ja publicaven abans de R32.3).
  publicaActualitzacioRecomanada({ ...ANDROID, versioRecomanada: 7 });
  publicaActualitzacioRecomanada({ ...ANDROID, versioRecomanada: 6 }, FONT_NODE);
  expect(llegixActualitzacioRecomanada()?.versioRecomanada).toBe(10);
  publicaActualitzacioRecomanada(null, FONT_MANIFEST);
  expect(llegixActualitzacioRecomanada()?.versioRecomanada).toBe(6);
});

test('R32.3 (Elefant) · amb el mateix build mana la primera font (el node): el seu enllaç no el trepitja el manifest', () => {
  const ENLLAC_NODE = 'https://play.google.com/store/apps/details?id=org.socdepoble.app&hl=ca';
  publicaActualitzacioRecomanada({ ...ANDROID, versioRecomanada: 10, enllac: ENLLAC_NODE, marketUrl: null }, FONT_NODE);
  publicaActualitzacioRecomanada({ ...ANDROID, versioRecomanada: 10 }, FONT_MANIFEST);
  expect(llegixActualitzacioRecomanada()).toMatchObject({ versioRecomanada: 10, enllac: ENLLAC_NODE, marketUrl: null });
});

test('R32.3 (Elefant) · sense emmagatzematge, «Més tard» val per a tota la sessió: cap font torna a mostrar la mateixa versió', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
  publicaActualitzacioRecomanada({ ...ANDROID, versioRecomanada: 10 }, FONT_NODE);
  expect(descartaActualitzacioRecomanada()).toBe(true);
  expect(llegixActualitzacioRecomanada()).toBeNull();
  publicaActualitzacioRecomanada({ ...ANDROID, versioRecomanada: 10 }, FONT_MANIFEST);
  expect(llegixActualitzacioRecomanada()).toBeNull();
  publicaActualitzacioRecomanada({ ...ANDROID, versioRecomanada: 11 }, FONT_MANIFEST);
  expect(llegixActualitzacioRecomanada()?.versioRecomanada).toBe(11);
});

test('R32.3 (Elefant) · sense window.open no s’obri res i no es diu que s’ha obert', () => {
  expect(obriBotigaActualitzacio({ plataforma: 'ios', versioRecomanada: 10 }, { finestra: {} })).toBeNull();
  expect(obriBotigaActualitzacio(ANDROID, { finestra: { open: 'no és una funció' } })).toBeNull();
});

test('R32.3 (Elefant) · la diagnosi del detector: només valors plans, congelada i neta entre proves', () => {
  expect(llegixDiagnosiActualitzacio()).toEqual({ motiu: 'absent', quan: null });
  const anotada = anotaDiagnosiActualitzacio({ motiu: 'inert-csp', quan: 5, url: 'https://socdepoble.org/.well-known/ard.json', objecte: { x: 1 }, funcio: () => 1 });
  expect(anotada).toEqual({ motiu: 'inert-csp', quan: 5, url: 'https://socdepoble.org/.well-known/ard.json' });
  expect(Object.isFrozen(llegixDiagnosiActualitzacio())).toBe(true);
  expect(anotaDiagnosiActualitzacio(null)).toEqual({ motiu: 'desconegut', quan: null });
});
