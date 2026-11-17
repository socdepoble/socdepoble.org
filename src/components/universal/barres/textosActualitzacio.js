/**
 * textosActualitzacio.js — Onada v1.2.7 · P0-123 (ordre directa del Mestre, 17-11-2026) · Els textos
 * de BarraActualitzacioRecomanada per als canals nous (TestFlight, l'APK directe i la web), en les
 * cinc llengües.
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
    detallApk: 'Pots continuar usant l’aplicació ara i baixar l’APK signat de la versió nova quan et vinga bé. Comprova que la suma SHA-256 del fitxer és esta:',
    accioApk: 'Baixa l’APK',
    detallWeb: 'Pots continuar ara i carregar la versió {versio} quan et vinga bé.',
    accioWeb: 'Carrega la versió nova'
  }),
  es: Object.freeze({
    detallTestflight: 'Puedes seguir usando la aplicación ahora y actualizarla desde TestFlight cuando te venga bien.',
    accioTestflight: 'Actualizar en TestFlight',
    detallApk: 'Puedes seguir usando la aplicación ahora y descargar el APK firmado de la nueva versión cuando te venga bien. Comprueba que la suma SHA-256 del archivo es esta:',
    accioApk: 'Descargar el APK',
    detallWeb: 'Puedes continuar ahora y cargar la versión {versio} cuando te venga bien.',
    accioWeb: 'Cargar la nueva versión'
  }),
  en: Object.freeze({
    detallTestflight: 'You can keep using the app right now and update it from TestFlight whenever suits you.',
    accioTestflight: 'Update on TestFlight',
    detallApk: 'You can keep using the app right now and download the signed APK of the new version whenever suits you. Check that the file’s SHA-256 checksum is:',
    accioApk: 'Download the APK',
    detallWeb: 'You can carry on now and load version {versio} whenever suits you.',
    accioWeb: 'Load the new version'
  }),
  eu: Object.freeze({
    detallTestflight: 'Aplikazioa orain erabiltzen jarrai dezakezu eta TestFlight-etik eguneratu ondo datorkizunean.',
    accioTestflight: 'Eguneratu TestFlight-en',
    detallApk: 'Aplikazioa orain erabiltzen jarrai dezakezu eta bertsio berriaren APK sinatua deskargatu ondo datorkizunean. Egiaztatu fitxategiaren SHA-256 batura hau dela:',
    accioApk: 'Deskargatu APKa',
    detallWeb: 'Orain jarrai dezakezu eta {versio} bertsioa kargatu ondo datorkizunean.',
    accioWeb: 'Kargatu bertsio berria'
  }),
  gl: Object.freeze({
    detallTestflight: 'Podes seguir usando a aplicación agora e actualizala desde TestFlight cando che veña ben.',
    accioTestflight: 'Actualizar en TestFlight',
    detallApk: 'Podes seguir usando a aplicación agora e descargar o APK asinado da nova versión cando che veña ben. Comproba que a suma SHA-256 do ficheiro é esta:',
    accioApk: 'Descargar o APK',
    detallWeb: 'Podes continuar agora e cargar a versión {versio} cando che veña ben.',
    accioWeb: 'Cargar a nova versión'
  })
});

/** La taula de la llengua de la interfície («es-ES» → es); si no n'hi ha, la valenciana. */
export function textosActualitzacio(llengua) {
  const codi = String(llengua || 'ca').toLowerCase().split('-')[0];
  return Object.hasOwn(TEXTOS_ACTUALITZACIO, codi) ? TEXTOS_ACTUALITZACIO[codi] : TEXTOS_ACTUALITZACIO.ca;
}
