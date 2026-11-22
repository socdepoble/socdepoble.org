/**
 * navegadorIncrustat.js — Detector pur O(n) lineal i diccionari 5 llengües
 * per a navegadors socials incrustats (P0-114 Escut 1 · Onada R32.13).
 *
 * Detecta els WebViews interns d'aplicacions socials (Facebook iOS FBAN/FBIOS,
 * Facebook Android FB_IAB/FB4A/FBAV/FBMessenger, Instagram, TikTok, LINE i
 * WhatsApp `WhatsApp/…`) i el WebView genèric d'Android (`; wv)`), on Google
 * OAuth bloqueja l'autorització amb `403 disallowed_useragent`.
 *
 * SEGURETAT I RENDIMENT:
 *  · Escàner d'una sola passada lineal O(n) sobre codis ASCII, amb 0 expressions
 *    regulars i 0 backtracking (immune a cadenes User-Agent hostils).
 *  · Exclou SEMPRE l'App nativa Capacitor d'iOS i Android (`esNatiu`,
 *    `plataformaNativa() !== 'web'`, `Capacitor.isNativePlatform()` i protocols
 *    `capacitor:` / `ionic:`).
 */

export const NO_NAVEGADOR_INCRUSTAT = Object.freeze({
  esWebViewSocial: false,
  app: null,
  nomApp: null,
  sistema: 'altre'
});

const MAX_LONGITUD_TOKEN = 24;

const TOKENS_FACEBOOK = new Set([
  'fban',
  'fbav',
  'fb_iab',
  'fbios',
  'fb4a',
  'fbmessenger'
]);

const TOKENS_TIKTOK = new Set([
  'tiktok',
  'bytedancewebview',
  'bytelocale',
  'musical_ly'
]);

function esCaracterParaulaAscii(codi) {
  return (
    (codi >= 97 && codi <= 122) || // a-z
    (codi >= 65 && codi <= 90) ||  // A-Z
    (codi >= 48 && codi <= 57) ||  // 0-9
    codi === 95                    // _
  );
}

function esEntornCapacitorNatiu(opcions = {}) {
  if (opcions?.esNatiu === true) return true;
  if (typeof opcions?.plataformaNativa === 'function' && opcions.plataformaNativa() !== 'web') {
    return true;
  }
  const finestra = opcions?.finestra ?? (typeof window !== 'undefined' ? window : null);
  if (!finestra) return false;
  try {
    if (finestra.Capacitor?.isNativePlatform?.() === true) return true;
    const protocol = String(finestra.location?.protocol || '').toLowerCase();
    if (protocol === 'capacitor:' || protocol === 'ionic:') return true;
  } catch {
    return false;
  }
  return false;
}

/**
 * Escaneja la cadena `userAgent` en temps lineal O(n) estricte sense cap RegExp.
 *
 * @param {string} [userAgent] Cadena User-Agent opcional (per defecte `navigator.userAgent`).
 * @param {{ esNatiu?: boolean, finestra?: Window|null, plataformaNativa?: () => string }} [opcions]
 * @returns {Readonly<{ esWebViewSocial: boolean, app: string|null, nomApp: string|null, sistema: 'ios'|'android'|'altre' }>}
 */
export function esNavegadorSocialIncrustat(userAgent, opcions = {}) {
  if (esEntornCapacitorNatiu(opcions)) return NO_NAVEGADOR_INCRUSTAT;

  const ua = typeof userAgent === 'string'
    ? userAgent
    : (typeof navigator !== 'undefined' && typeof navigator.userAgent === 'string' ? navigator.userAgent : '');

  if (!ua) return NO_NAVEGADOR_INCRUSTAT;

  let teCaracterVisible = false;
  let teInstagram = false;
  let teFacebook = false;
  let teTiktok = false;
  let teLine = false;
  let teWhatsapp = false;
  let teWebviewAndroid = false;
  let teIos = false;
  let teAndroid = false;

  let token = '';
  let massaLlarg = false;
  const len = ua.length;

  for (let i = 0; i <= len; i += 1) {
    const codi = i < len ? ua.charCodeAt(i) : 0;
    if (i < len && codi > 32) teCaracterVisible = true;

    if (i < len && esCaracterParaulaAscii(codi)) {
      if (!massaLlarg) {
        if (token.length < MAX_LONGITUD_TOKEN) {
          const minuscula = codi >= 65 && codi <= 90 ? codi + 32 : codi;
          token += String.fromCharCode(minuscula);
        } else {
          massaLlarg = true;
        }
      }
    } else {
      if (!massaLlarg && token.length > 0) {
        if (token === 'instagram') teInstagram = true;
        else if (TOKENS_FACEBOOK.has(token)) teFacebook = true;
        else if (TOKENS_TIKTOK.has(token) || token.startsWith('musical_ly_')) teTiktok = true;
        else if (token === 'line' && codi === 47) teLine = true;
        /* P0-ANDROID-PUSH (v1.2.16) · B7 · «WhatsApp/…»: el token tancat per «/» (codi 47). */
        else if (token === 'whatsapp' && codi === 47) teWhatsapp = true;
        /* «; wv)»: el token «wv» tancat per «)» (codi 41), la marca de tot WebView d'Android. */
        else if (token === 'wv' && codi === 41) teWebviewAndroid = true;
        else if (token === 'iphone' || token === 'ipad' || token === 'ipod') teIos = true;
        else if (token === 'android') teAndroid = true;
      }
      token = '';
      massaLlarg = false;
    }
  }

  if (!teCaracterVisible) return NO_NAVEGADOR_INCRUSTAT;

  const sistema = teIos ? 'ios' : (teAndroid ? 'android' : 'altre');

  if (teInstagram) {
    return Object.freeze({ esWebViewSocial: true, app: 'instagram', nomApp: 'Instagram', sistema });
  }
  if (teFacebook) {
    return Object.freeze({ esWebViewSocial: true, app: 'facebook', nomApp: 'Facebook', sistema });
  }
  if (teTiktok) {
    return Object.freeze({ esWebViewSocial: true, app: 'tiktok', nomApp: 'TikTok', sistema });
  }
  if (teLine) {
    return Object.freeze({ esWebViewSocial: true, app: 'line', nomApp: 'LINE', sistema });
  }
  if (teWhatsapp) {
    return Object.freeze({ esWebViewSocial: true, app: 'whatsapp', nomApp: 'WhatsApp', sistema });
  }
  /* P0-ANDROID-PUSH (v1.2.16) · B7 · Tot WebView d'Android porta «; wv)»; Chrome i les seues
     pestanyes personalitzades, no. Sense nom d'app: l'avís és el «SenseApp» (textosDeLEscut).
     L'App pròpia (Capacitor) ja ha eixit al principi (esEntornCapacitorNatiu). */
  if (teWebviewAndroid && teAndroid) {
    return Object.freeze({ esWebViewSocial: true, app: 'webview', nomApp: null, sistema: 'android' });
  }

  return NO_NAVEGADOR_INCRUSTAT;
}

/**
 * Copia una adreça al porta-retalls amb l'API asíncrona moderna i reserva
 * síncrona accessible (`sr-only`, sense estils en línia) quan `navigator.clipboard`
 * no existix en navegadors interns antics.
 *
 * @param {string} adreca
 * @param {{ nav?: Navigator|null, doc?: Document|null }} [entorn]
 * @returns {Promise<boolean>}
 */
export async function copiaEnllacAmbReserva(adreca, entorn = {}) {
  const text = typeof adreca === 'string' ? adreca.trim() : '';
  if (!text) return false;

  const nav = entorn.nav !== undefined ? entorn.nav : (typeof navigator !== 'undefined' ? navigator : null);
  if (nav && typeof nav.clipboard?.writeText === 'function') {
    try {
      await nav.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  const doc = entorn.doc !== undefined ? entorn.doc : (typeof document !== 'undefined' ? document : null);
  if (doc?.body && typeof doc.execCommand === 'function') {
    const area = doc.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.className = 'sr-only';
    doc.body.appendChild(area);
    try {
      area.select();
      area.setSelectionRange(0, text.length);
      return Boolean(doc.execCommand('copy'));
    } catch {
      return false;
    } finally {
      area.remove();
    }
  }

  return false;
}

/**
 * Diccionari modular en les 5 llengües oficials (ca, es, en, eu, gl) per a
 * l'orientació OAuth dins de navegadors socials incrustats.
 * Viu fora del diccionari valencià de config per mantindre 0 B d'impacte en
 * l'arrencada estàtica del connector de WordPress.
 * P0-ANDROID-PUSH (v1.2.16) · B7 · `avisSenseApp` i `instruccionsAndroidSenseApp`:
 * el WebView genèric d'Android no diu de quina app és (textosDeLEscut).
 */
export const TEXTOS_NAVEGADOR_INCRUSTAT = Object.freeze({
  ca: Object.freeze({
    avis: 'Dins del navegador intern de l’app {app}, Google no permet obrir la sessió per a protegir el teu compte.',
    avisSenseApp: 'Dins del navegador intern d’una altra app, Google no permet obrir la sessió per a protegir el teu compte.',
    explicacio: 'Pots entrar ara mateix amb el correu i una contrasenya al servidor de Sóc de Poble, o obrir la pàgina al navegador del telèfon.',
    instruccionsIos: 'A l’iPhone o l’iPad: toca el menú «⋯» de l’app {app} i tria «Obri en Safari».',
    instruccionsAndroid: 'A Android: toca el menú «⋮» de l’app {app} i tria «Obri en Chrome» o «Obri al navegador».',
    instruccionsAndroidSenseApp: 'A Android: toca el menú «⋮» de l’app on has obert l’enllaç i tria «Obri en Chrome» o «Obri al navegador».',
    instruccionsAltre: 'Toca el menú «⋯» de l’app {app} i tria «Obri al navegador extern» per a continuar amb Google.',
    botoEnllacMagic: 'Entraves amb Google o has oblidat la contrasenya? Rep un enllaç per a crear-ne una',
    botoCorreu: 'Entra o crea un compte amb el correu',
    botoCopiaUrl: 'Copia l’adreça per a Safari o Chrome',
    urlCopiada: 'Adreça copiada. Enganxa-la a Safari o Chrome.',
    errorCopia: 'No s’ha pogut copiar automàticament. Copia l’adreça de baix.'
  }),
  es: Object.freeze({
    avis: 'Dentro del navegador interno de {app}, Google no permite iniciar sesión para proteger tu cuenta.',
    avisSenseApp: 'Dentro del navegador interno de otra aplicación, Google no permite iniciar sesión para proteger tu cuenta.',
    explicacio: 'Puedes entrar ahora mismo con tu correo y una contraseña en el servidor de Sóc de Poble, o abrir la página en el navegador del teléfono.',
    instruccionsIos: 'En iPhone o iPad: toca el menú «⋯» de {app} y elige «Abrir en Safari».',
    instruccionsAndroid: 'En Android: toca el menú «⋮» de {app} y elige «Abrir en Chrome» o «Abrir en el navegador».',
    instruccionsAndroidSenseApp: 'En Android: toca el menú «⋮» de la aplicación donde has abierto el enlace y elige «Abrir en Chrome» o «Abrir en el navegador».',
    instruccionsAltre: 'Toca el menú «⋯» de {app} y elige «Abrir en el navegador externo» para continuar con Google.',
    botoEnllacMagic: '¿Entrabas con Google o has olvidado la contraseña? Recibe un enlace para crear una',
    botoCorreu: 'Entrar o crear cuenta con correo',
    botoCopiaUrl: 'Copiar el enlace para Safari / Chrome',
    urlCopiada: 'Enlace copiado. Pégalo en Safari o Chrome.',
    errorCopia: 'No se ha podido copiar automáticamente. Copia el enlace de abajo.'
  }),
  en: Object.freeze({
    avis: 'Inside {app}’s built-in browser, Google does not allow signing in, to keep your account safe.',
    avisSenseApp: 'Inside another app’s built-in browser, Google does not allow signing in, to keep your account safe.',
    explicacio: 'You can sign in right now with your email and a password on the Sóc de Poble server, or open this page in your phone’s browser.',
    instruccionsIos: 'On iPhone or iPad: tap the “⋯” menu in {app} and choose “Open in Safari”.',
    instruccionsAndroid: 'On Android: tap the “⋮” menu in {app} and choose “Open in Chrome” or “Open in browser”.',
    instruccionsAndroidSenseApp: 'On Android: tap the “⋮” menu in the app where you opened the link and choose “Open in Chrome” or “Open in browser”.',
    instruccionsAltre: 'Tap the “⋯” menu in {app} and choose “Open in external browser” to continue with Google.',
    botoEnllacMagic: 'Used Google to sign in, or forgot your password? Get a link to create one',
    botoCorreu: 'Sign in or create account with email',
    botoCopiaUrl: 'Copy link for Safari / Chrome',
    urlCopiada: 'Link copied. Paste it into Safari or Chrome.',
    errorCopia: 'Could not copy automatically. Copy the address below.'
  }),
  eu: Object.freeze({
    avis: '{app} aplikazioaren barneko nabigatzailean, Google-k saio-hasiera gelditzen du zure kontua babesteko.',
    avisSenseApp: 'Beste aplikazio baten barneko nabigatzailean, Google-k saio-hasiera gelditzen du zure kontua babesteko.',
    explicacio: 'Oraintxe bertan sar zaitezke posta elektronikoarekin eta pasahitz batekin Sóc de Pobleren zerbitzarian, edo ireki orria telefonoko nabigatzailean.',
    instruccionsIos: 'iPhone edo iPad gailuetan: sakatu {app}-ko «⋯» menua eta aukeratu «Ireki Safarin».',
    instruccionsAndroid: 'Androiden: sakatu {app}-ko «⋮» menua eta aukeratu «Ireki Chromen» edo «Ireki nabigatzailean».',
    instruccionsAndroidSenseApp: 'Androiden: sakatu esteka ireki duzun aplikazioaren «⋮» menua eta aukeratu «Ireki Chromen» edo «Ireki nabigatzailean».',
    instruccionsAltre: 'Sakatu {app}-ko «⋯» menua eta aukeratu «Ireki kanpoko nabigatzailean» Google-rekin jarraitzeko.',
    botoEnllacMagic: 'Google-rekin sartzen zinen edo pasahitza ahaztu duzu? Jaso esteka bat pasahitz berri bat sortzeko',
    botoCorreu: 'Sartu edo sortu kontua posta elektronikoarekin',
    botoCopiaUrl: 'Kopiatu helbidea Safari / Chrome-rako',
    urlCopiada: 'Helbidea kopiatuta. Itsatsi Safarin edo Chromen.',
    errorCopia: 'Ezin izan da automatikoki kopiatu. Kopiatu beheko helbidea.'
  }),
  gl: Object.freeze({
    avis: 'Dentro do navegador interno de {app}, Google non permite iniciar sesión para protexer a túa conta.',
    avisSenseApp: 'Dentro do navegador interno doutra aplicación, Google non permite iniciar sesión para protexer a túa conta.',
    explicacio: 'Podes entrar agora mesmo co correo e un contrasinal no servidor de Sóc de Poble, ou abrir a páxina no navegador do teléfono.',
    instruccionsIos: 'No iPhone ou no iPad: toca o menú «⋯» de {app} e escolle «Abrir en Safari».',
    instruccionsAndroid: 'En Android: toca o menú «⋮» de {app} e escolle «Abrir en Chrome» ou «Abrir no navegador».',
    instruccionsAndroidSenseApp: 'En Android: toca o menú «⋮» da aplicación onde abriches a ligazón e escolle «Abrir en Chrome» ou «Abrir no navegador».',
    instruccionsAltre: 'Toca o menú «⋯» de {app} e escolle «Abrir no navegador externo» para continuar con Google.',
    botoEnllacMagic: 'Entrabas con Google ou esqueciches o contrasinal? Recibe unha ligazón para crear un',
    botoCorreu: 'Entrar ou crear conta co correo',
    botoCopiaUrl: 'Copiar o enderezo para Safari / Chrome',
    urlCopiada: 'Enderezo copiado. Pégao en Safari ou Chrome.',
    errorCopia: 'Non se puido copiar automaticamente. Copia o enderezo de embaixo.'
  })
});

export function textosNavegadorIncrustat(idioma) {
  const codi = String(idioma || 'ca').toLowerCase().split('-')[0];
  return Object.hasOwn(TEXTOS_NAVEGADOR_INCRUSTAT, codi)
    ? TEXTOS_NAVEGADOR_INCRUSTAT[codi]
    : TEXTOS_NAVEGADOR_INCRUSTAT.ca;
}

/**
 * P0-ANDROID-PUSH (v1.2.16) · B7 · L'avís i les instruccions de l'escut per a la
 * detecció `webview`, sense cap «{app}» sense omplir: amb nom d'app, els textos
 * de sempre; sense (el WebView genèric d'Android), els «SenseApp». Pura.
 *
 * @param {Readonly<Record<string, string>>} tx textos d'una llengua (textosNavegadorIncrustat)
 * @param {{ nomApp?: string|null, sistema?: string }|null} webview la detecció
 * @returns {Readonly<{ avis: string, instruccions: string }>}
 */
export function textosDeLEscut(tx, webview) {
  const nom = webview?.nomApp || null;
  const omple = (text) => text.replace('{app}', () => nom || '');
  const avis = nom ? omple(tx.avis) : tx.avisSenseApp;
  let instruccions;
  if (webview?.sistema === 'android') instruccions = nom ? omple(tx.instruccionsAndroid) : tx.instruccionsAndroidSenseApp;
  else instruccions = omple(webview?.sistema === 'ios' ? tx.instruccionsIos : tx.instruccionsAltre);
  return Object.freeze({ avis, instruccions });
}
