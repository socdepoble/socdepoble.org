/**
 * textosEscutWebview.js · Onada R32.5 (P0-113) · Els textos de l'escut OAuth del navegador intern de
 * les xarxes socials (detectaWebViewInApp.js), en les 5 llengües (ca, es, en, eu, gl).
 *
 * Per què una taula pròpia i no claus del diccionari: el valencià (src/config/idiomes/ca.js) viatja a
 * l'arrencada estàtica del paquet de WordPress, que té el sostre de pes a tocar, i este avís només el
 * pinta OnboardingSection.jsx, que ja és un tros diferit. {app} és el nom de l'app que fa d'amfitriona (en
 * valencià va darrere de «l’app», i així «de» no s'ha d'apostrofar davant d'Instagram).
 *
 * v1.2.7 · R325-01 · No hi ha entrada per enllaç (loginWithMagicLink falla sense PKCE, data/supabase/auth.js).
 * La clau botoEnllacMagic es conserva perquè la llig OnboardingSection.jsx, però el botó obri «Recupera la
 * contrasenya», que envia un enllaç per a crear-ne una de nova si el compte existix: el text diu això, i
 * l'explicació ja no promet cap enllaç d'accés.
 */

export const TEXTOS_ESCUT_WEBVIEW = Object.freeze({
  ca: Object.freeze({
    avis: 'Dins del navegador intern de l’app {app}, Google bloqueja l’entrada per seguretat.',
    explicacio: 'Pots entrar ara mateix amb el correu i una contrasenya, o obrir Sóc de Poble al navegador del telèfon.',
    instruccionsIos: 'A l’iPhone o l’iPad: toca el menú «⋯» de l’app {app} i tria «Obri en Safari».',
    instruccionsAndroid: 'A Android: toca el menú «⋮» de l’app {app} i tria «Obri en Chrome» o «Obri al navegador».',
    instruccionsAltre: 'Toca el menú «⋯» de l’app {app} i tria «Obri al navegador extern» per a continuar amb Google.',
    botoEnllacMagic: 'Entraves amb Google o has oblidat la contrasenya? Rep un enllaç per a crear-ne una',
    botoCorreu: 'Entra o crea un compte amb el correu',
    botoCopiaUrl: 'Copia l’adreça per a Safari o Chrome',
    urlCopiada: 'Adreça copiada. Enganxa-la a Safari o Chrome.',
    errorCopia: 'No s’ha pogut copiar automàticament. Copia l’adreça de baix.'
  }),
  es: Object.freeze({
    avis: 'Dentro del navegador interno de {app}, Google bloquea la entrada por seguridad.',
    explicacio: 'Puedes entrar ahora mismo con tu correo y una contraseña, o abrir Sóc de Poble en el navegador del teléfono.',
    instruccionsIos: 'En iPhone o iPad: toca el menú «⋯» de {app} y elige «Abrir en Safari».',
    instruccionsAndroid: 'En Android: toca el menú «⋮» de {app} y elige «Abrir en Chrome» o «Abrir en el navegador».',
    instruccionsAltre: 'Toca el menú «⋯» de {app} y elige «Abrir en el navegador externo» para continuar con Google.',
    botoEnllacMagic: '¿Entrabas con Google o has olvidado la contraseña? Recibe un enlace para crear una',
    botoCorreu: 'Entrar o crear cuenta con correo',
    botoCopiaUrl: 'Copiar el enlace para Safari / Chrome',
    urlCopiada: 'Enlace copiado. Pégalo en Safari o Chrome.',
    errorCopia: 'No se ha podido copiar automáticamente. Copia el enlace de abajo.'
  }),
  en: Object.freeze({
    avis: 'Inside {app}’s built-in browser, Google blocks sign-in for security.',
    explicacio: 'You can sign in right now with your email and a password, or open Sóc de Poble in your phone’s browser.',
    instruccionsIos: 'On iPhone or iPad: tap the “⋯” menu in {app} and choose “Open in Safari”.',
    instruccionsAndroid: 'On Android: tap the “⋮” menu in {app} and choose “Open in Chrome” or “Open in browser”.',
    instruccionsAltre: 'Tap the “⋯” menu in {app} and choose “Open in external browser” to continue with Google.',
    botoEnllacMagic: 'Used Google to sign in, or forgot your password? Get a link to create one',
    botoCorreu: 'Sign in or create account with email',
    botoCopiaUrl: 'Copy link for Safari / Chrome',
    urlCopiada: 'Link copied. Paste it into Safari or Chrome.',
    errorCopia: 'Could not copy automatically. Copy the address below.'
  }),
  eu: Object.freeze({
    avis: '{app} aplikazioaren barneko nabigatzailean, Google-k sarrera blokeatzen du segurtasunagatik.',
    explicacio: 'Oraintxe bertan sar zaitezke posta elektronikoarekin eta pasahitz batekin, edo ireki Sóc de Poble telefonoko nabigatzailean.',
    instruccionsIos: 'iPhone edo iPad gailuetan: sakatu {app}-ko «⋯» menua eta aukeratu «Ireki Safarin».',
    instruccionsAndroid: 'Androiden: sakatu {app}-ko «⋮» menua eta aukeratu «Ireki Chromen» edo «Ireki nabigatzailean».',
    instruccionsAltre: 'Sakatu {app}-ko «⋯» menua eta aukeratu «Ireki kanpoko nabigatzailean» Google-rekin jarraitzeko.',
    botoEnllacMagic: 'Google-rekin sartzen zinen edo pasahitza ahaztu duzu? Jaso esteka bat pasahitz berri bat sortzeko',
    botoCorreu: 'Sartu edo sortu kontua posta elektronikoarekin',
    botoCopiaUrl: 'Kopiatu helbidea Safari / Chrome-rako',
    urlCopiada: 'Helbidea kopiatuta. Itsatsi Safarin edo Chromen.',
    errorCopia: 'Ezin izan da automatikoki kopiatu. Kopiatu beheko helbidea.'
  }),
  gl: Object.freeze({
    avis: 'Dentro do navegador interno de {app}, Google bloquea a entrada por seguridade.',
    explicacio: 'Podes entrar agora mesmo co correo e un contrasinal, ou abrir Sóc de Poble no navegador do teléfono.',
    instruccionsIos: 'No iPhone ou no iPad: toca o menú «⋯» de {app} e escolle «Abrir en Safari».',
    instruccionsAndroid: 'En Android: toca o menú «⋮» de {app} e escolle «Abrir en Chrome» ou «Abrir no navegador».',
    instruccionsAltre: 'Toca o menú «⋯» de {app} e escolle «Abrir no navegador externo» para continuar con Google.',
    botoEnllacMagic: 'Entrabas con Google ou esqueciches o contrasinal? Recibe unha ligazón para crear un',
    botoCorreu: 'Entrar ou crear conta co correo',
    botoCopiaUrl: 'Copiar o enderezo para Safari / Chrome',
    urlCopiada: 'Enderezo copiado. Pégao en Safari ou Chrome.',
    errorCopia: 'Non se puido copiar automaticamente. Copia o enderezo de embaixo.'
  })
});

/** Els textos en la llengua de la interfície ('es-ES' → 'es'); sense textos per a ella, el valencià. */
export function textosEscutWebview(idioma) {
  const codi = String(idioma || 'ca').toLowerCase().split('-')[0];
  return Object.hasOwn(TEXTOS_ESCUT_WEBVIEW, codi) ? TEXTOS_ESCUT_WEBVIEW[codi] : TEXTOS_ESCUT_WEBVIEW.ca;
}
