/**
 * textosActualitzacio.js — Onada v1.2.7 · P0-123 (ordre directa del Mestre, 17-11-2026) · Els textos
 * de BarraActualitzacioRecomanada per als canals nous (TestFlight i la web), en les cinc llengües.
 * v1.2.17 · T-04 · ZERO APK fora de botiga (ordre del Mestre 261121): retirats els textos de l'APK
 * directe (el detall amb la suma SHA-256 i l'acció de baixar-lo), que cap avís no podia pintar des
 * de la v1.2.16.
 *
 * No van als diccionaris de src/config/idiomes/: el valencià (ca.js) viatja a l'arrencada estàtica
 * del connector de WordPress, que té el sostre a tocar, i estos textos només els pinta la barra, que
 * és un tros diferit (App.jsx, BarraActualitzacioDiferida). El patró de SelectorRealitat.jsx i de
 * TEXTOS_CONTROL: una taula per llengua i, si la llengua no hi és, el valencià. Els textos de la
 * botiga de sempre (Google Play i l'App Store) continuen als diccionaris, com abans.
 * `{versio}` es canvia per la versió de l'avís.
 */
export const TEXTOS_ACTUALITZACIO = Object.freeze({
  ca: Object.freeze({
    detallTestflight: 'Pots continuar usant l’aplicació ara i actualitzar-la des de TestFlight quan et vinga bé.',
    accioTestflight: 'Actualitza a TestFlight',
    detallWeb: 'Pots continuar ara i carregar la versió {versio} quan et vinga bé.',
    accioWeb: 'Carrega la versió nova'
  }),
  es: Object.freeze({
    detallTestflight: 'Puedes seguir usando la aplicación ahora y actualizarla desde TestFlight cuando te venga bien.',
    accioTestflight: 'Actualizar en TestFlight',
    detallWeb: 'Puedes continuar ahora y cargar la versión {versio} cuando te venga bien.',
    accioWeb: 'Cargar la nueva versión'
  }),
  en: Object.freeze({
    detallTestflight: 'You can keep using the app right now and update it from TestFlight whenever suits you.',
    accioTestflight: 'Update on TestFlight',
    detallWeb: 'You can carry on now and load version {versio} whenever suits you.',
    accioWeb: 'Load the new version'
  }),
  eu: Object.freeze({
    detallTestflight: 'Aplikazioa orain erabiltzen jarrai dezakezu eta TestFlight-etik eguneratu ondo datorkizunean.',
    accioTestflight: 'Eguneratu TestFlight-en',
    detallWeb: 'Orain jarrai dezakezu eta {versio} bertsioa kargatu ondo datorkizunean.',
    accioWeb: 'Kargatu bertsio berria'
  }),
  gl: Object.freeze({
    detallTestflight: 'Podes seguir usando a aplicación agora e actualizala desde TestFlight cando che veña ben.',
    accioTestflight: 'Actualizar en TestFlight',
    detallWeb: 'Podes continuar agora e cargar a versión {versio} cando che veña ben.',
    accioWeb: 'Cargar a nova versión'
  })
});

/** La taula de la llengua de la interfície («es-ES» → es); si no n'hi ha, la valenciana. */
export function textosActualitzacio(llengua) {
  const codi = String(llengua || 'ca').toLowerCase().split('-')[0];
  return Object.hasOwn(TEXTOS_ACTUALITZACIO, codi) ? TEXTOS_ACTUALITZACIO[codi] : TEXTOS_ACTUALITZACIO.ca;
}
