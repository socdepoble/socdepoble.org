/**
 * i18nAdminEntitats.js — Textos complets en 5 llengües (`ca`, `es`, `en`, `eu`, `gl`),
 * etiquetes accessibles (`aria-label`) i locale `BCP 47` per als panells diferits
 * d'administració d'entitats, usuaris, sessions i botigues · Onada R32.37 + R32.45.
 *
 * Viu dins de `src/sections/profile/admin/` (`React.lazy`, `+0 B` a `pesDelNucli`),
 * preserva 100 % idèntics byte a byte tots els literals valencians (`ca`) i respecta
 * l'exclusió de plataforma aliena (`nativaIos`, regla 2.3.10 d'Apple) en les 5 llengües.
 */
import { CODI_RESUM_SESSIONS, MIGRACIO_RESUM_SESSIONS } from '../../../data/resumSessionsDispositius.js';
import { MIGRACIO_DETALL_SESSIONS } from '../../../data/sessionsDispositius.js';
import {
  ADRECA_VERIFICADORS_GOOGLE_PLAY,
  PASSOS_VERIFICADOR_GOOGLE_PLAY,
  URL_FITXA_APP_STORE,
  VERIFICADORS_DE_GOOGLE
} from './assistentBotigues.js';
import {
  APP_STORE,
  CAMINS_PANELL,
  MISSATGE_WHATSAPP_VERIFICADORS,
  NOTA_PAS_1_GOOGLE_PLAY,
  NOTA_RECOMPTES,
  NOTA_VERIFICADORS,
  TEXT_BOTO_CONSULTA,
  TEXT_ESTAT_INICIAL,
  textErrorResum
} from './usuarisDispositiusBotigues.js';

const CAMINS_CA = Object.freeze(Object.fromEntries(CAMINS_PANELL.map((c) => [c.cami, c.titol])));

function construeixWhatsapp(intro, passos, pas1Label, iosLabel) {
  return [
    intro,
    '',
    ...passos,
    '',
    `${pas1Label}: ${ADRECA_VERIFICADORS_GOOGLE_PLAY}`,
    `${iosLabel}: ${URL_FITXA_APP_STORE}`
  ].join('\n');
}

const PASSOS_ES = Object.freeze([
  'Paso 1 · Pantalla 1: entrar en play.google.com/apps/testing/org.socdepoble.app y pulsar el botón azul grande «Become a tester» (Convertirse en verificador).',
  'Paso 2 · Pantalla 2, «You’re a tester»: NO tocar el botón de abajo, «Leave the program», sino el enlace azul del final del segundo párrafo, el que dice «download it on Google Play».',
  `Paso 3 · Pantalla 3, Google Play: pulsar «Instalar» para que la app quede instalada en el móvil. Es imprescindible: Google solo cuenta dentro de los ${VERIFICADORS_DE_GOOGLE.persones} verificadores a quien la mantiene instalada durante ${VERIFICADORS_DE_GOOGLE.dies} días.`
]);

const PASSOS_EN = Object.freeze([
  'Step 1 · Screen 1: open play.google.com/apps/testing/org.socdepoble.app and press the large blue “Become a tester” button.',
  'Step 2 · Screen 2, “You’re a tester”: DO NOT tap the bottom “Leave the program” button; instead tap the blue link at the end of the second paragraph that says “download it on Google Play”.',
  `Step 3 · Screen 3, Google Play: tap “Install” so the app stays installed on the phone. This is essential: Google only counts among the ${VERIFICADORS_DE_GOOGLE.persones} testers those who keep it installed for ${VERIFICADORS_DE_GOOGLE.dies} consecutive days.`
]);

const PASSOS_EU = Object.freeze([
  '1. urratsa · 1. pantaila: sartu play.google.com/apps/testing/org.socdepoble.app helbidean eta sakatu «Become a tester» botoi urdin handia.',
  '2. urratsa · 2. pantaila, «You’re a tester»: EZ ukitu beheko «Leave the program» botoia; sakatu bigarren paragrafoaren amaierako «download it on Google Play» esteka urdina.',
  `3. urratsa · 3. pantaila, Google Play: sakatu «Instalatu» aplikazioa mugikorrean instalatuta gera dadin. Ezinbestekoa da: Googlek ${VERIFICADORS_DE_GOOGLE.persones} egiaztatzaileen artean ${VERIFICADORS_DE_GOOGLE.dies} egunez jarraian instalatuta dutenak bakarrik zenbatzen ditu.`
]);

const PASSOS_GL = Object.freeze([
  'Paso 1 · Pantalla 1: entrar en play.google.com/apps/testing/org.socdepoble.app e premer o botón azul grande «Become a tester» (Converterse en verificador).',
  'Paso 2 · Pantalla 2, «You’re a tester»: NON tocar o botón de abaixo, «Leave the program», senón a ligazón azul do final do segundo parágrafo, a que di «download it on Google Play».',
  `Paso 3 · Pantalla 3, Google Play: premer «Instalar» para que a app quede instalada no móbil. É imprescindible: Google só conta dentro dos ${VERIFICADORS_DE_GOOGLE.persones} verificadores quen a ten instalada durante ${VERIFICADORS_DE_GOOGLE.dies} días.`
]);

const ERRORS_ES = Object.freeze({
  [CODI_RESUM_SESSIONS.SENSE_MIGRACIO]: `La consulta del servidor todavía no está aplicada: falta la migración ${MIGRACIO_RESUM_SESSIONS}, pendiente de orden del Maestro.`,
  [CODI_RESUM_SESSIONS.SENSE_PORT]: `La consulta del servidor todavía no está conectada: la migración ${MIGRACIO_RESUM_SESSIONS} consta como no aplicada y el puerto de datos de la app aún no expone adminResumSessionsDispositius.`,
  [CODI_RESUM_SESSIONS.SENSE_SERVIDOR]: 'Este nodo no tiene servidor configurado (modo local o de demostración): no hay sesiones que contar.',
  [CODI_RESUM_SESSIONS.SENSE_PERMIS]: 'El servidor ha rechazado la consulta: se requiere ser superadmin con segundo factor confirmado (aal2) en esta sesión.',
  [CODI_RESUM_SESSIONS.RESPOSTA_INVALIDA]: 'El servidor ha devuelto una respuesta inválida para esta consulta: no se muestra ninguna cifra.',
  [CODI_RESUM_SESSIONS.ERROR]: 'La consulta ha fallado (red o servidor): no se muestra ninguna cifra. Vuelve a intentarlo con el mismo botón.'
});

const ERRORS_EN = Object.freeze({
  [CODI_RESUM_SESSIONS.SENSE_MIGRACIO]: `The server query is not yet applied: migration ${MIGRACIO_RESUM_SESSIONS} is still pending.`,
  [CODI_RESUM_SESSIONS.SENSE_PORT]: `The server query is not yet wired: migration ${MIGRACIO_RESUM_SESSIONS} is pending and the data port does not expose adminResumSessionsDispositius yet.`,
  [CODI_RESUM_SESSIONS.SENSE_SERVIDOR]: 'This node has no server configured (local or demo mode): there are no sessions to count.',
  [CODI_RESUM_SESSIONS.SENSE_PERMIS]: 'The server refused the query: superadmin role with confirmed second factor (aal2) is required in this session.',
  [CODI_RESUM_SESSIONS.RESPOSTA_INVALIDA]: 'The server returned an unexpected response for this query: no figures are shown.',
  [CODI_RESUM_SESSIONS.ERROR]: 'The query failed (network or server): no figures are shown. Try again using the same button.'
});

const ERRORS_EU = Object.freeze({
  [CODI_RESUM_SESSIONS.SENSE_MIGRACIO]: `Zerbitzariaren kontsulta ez dago oraindik aplikatuta: ${MIGRACIO_RESUM_SESSIONS} migrazioa falta da.`,
  [CODI_RESUM_SESSIONS.SENSE_PORT]: `Zerbitzariaren kontsulta ez dago oraindik konektatuta: ${MIGRACIO_RESUM_SESSIONS} migrazioa eta datu-atakako adminResumSessionsDispositius falta dira.`,
  [CODI_RESUM_SESSIONS.SENSE_SERVIDOR]: 'Nodo honek ez du zerbitzaririk konfiguratuta (tokiko edo erakustaldi modua): ez dago zenbatzeko saiorik.',
  [CODI_RESUM_SESSIONS.SENSE_PERMIS]: 'Zerbitzariak kontsulta ukatu du: saio honetan bigarren faktorea baieztatuta (aal2) duen superadmin izan behar da.',
  [CODI_RESUM_SESSIONS.RESPOSTA_INVALIDA]: 'Zerbitzariak ezusteko erantzuna itzuli du kontsulta honetarako: ez da zifrarik erakusten.',
  [CODI_RESUM_SESSIONS.ERROR]: 'Kontsultak huts egin du (sarea edo zerbitzaria): ez da zifrarik erakusten. Saiatu berriro botoi berarekin.'
});

const ERRORS_GL = Object.freeze({
  [CODI_RESUM_SESSIONS.SENSE_MIGRACIO]: `A consulta do servidor aínda non está aplicada: falta a migración ${MIGRACIO_RESUM_SESSIONS}.`,
  [CODI_RESUM_SESSIONS.SENSE_PORT]: `A consulta do servidor aínda non está conectada: falta a migración ${MIGRACIO_RESUM_SESSIONS} e o método adminResumSessionsDispositius no porto de datos.`,
  [CODI_RESUM_SESSIONS.SENSE_SERVIDOR]: 'Este nodo non ten ningún servidor configurado (modo local ou de demostración): non hai sesións que contar.',
  [CODI_RESUM_SESSIONS.SENSE_PERMIS]: 'O servidor rexeitou a consulta: cómpre ser superadmin co segundo factor confirmado (aal2) nesta sesión.',
  [CODI_RESUM_SESSIONS.RESPOSTA_INVALIDA]: 'O servidor devolveu unha resposta non válida para esta consulta: non se amosa ningunha cifra.',
  [CODI_RESUM_SESSIONS.ERROR]: 'A consulta fallou (rede ou servidor): non se amosa ningunha cifra. Téntao de novo co mesmo botón.'
});

export const TEXTOS_ADMIN_ENTITATS = Object.freeze({
  ca: Object.freeze({
    locale: 'ca-ES',
    paginesTrilogiaRegio: 'Pàgines originals en revisió privada',
    directoriSessionsRegio: 'Directori d’usuaris i dispositius',
    usuarisBotiguesRegio: 'Usuaris, dispositius i botigues',
    descarreguesOficialsRegio: 'Descàrregues oficials',

    trilogiaCalSessio: 'Cal una sessió d’administració amb segon factor per revisar estes pàgines.',
    trilogiaErrorCorpus: (code) => `No s’ha pogut verificar el corpus: ${code}`,
    trilogiaVerificant: 'Verificant les deu pàgines originals…',
    trilogiaTitol: 'Trilogia Mediterrània i patrimoni de La Torre · 10 pàgines',
    trilogiaIntro: 'Esborranys privats per revisar. Obrir-los no crea notes ni publica contingut.',
    trilogiaPaginaOriginal: 'Pàgina original ',
    trilogiaDataOriginal: (data) => `Data original: ${data} (hora local de WordPress, sense fus declarat).`,
    trilogiaRevisioPendent: (n) => `Revisió pendent. ${n} imatges pendents de còpia pròpia verificada; publicació bloquejada.`,
    trilogiaImatgesVerificades: 'Imatges pròpies verificades. La revisió editorial continua pendent; no s’ha publicat res.',
    trilogiaObriEsborrany: 'Obri l’esborrany amb Edició avançada',

    sessionsTitol: 'Directori d’usuaris i dispositius',
    sessionsIntro: 'Persones i dispositius amb activitat en els últims 14 dies. Consulta restringida a superadmin amb segon factor; cada consulta queda registrada al servidor. Només hi apareixen comptes amb consentiment vigent i sense baixa demanada, amb el correu emmascarat. El canal és una estimació del navegador; no es mostra cap token, adreça IP, agent complet ni identificador de sessió o de persona.',
    sessionsFiltraNom: 'Filtra per nom o àlies',
    sessionsFiltraDispositiu: 'Filtra per dispositiu',
    sessionsTotsDispositius: 'Tots els dispositius',
    sessionsBotoConsulta: 'Consulta el directori',
    sessionsInicial: 'Encara no s’ha consultat el directori.',
    sessionsSenseMigracio: `El directori requerix la migració ${MIGRACIO_DETALL_SESSIONS}, encara pendent de verificació al servidor.`,
    sessionsResumIos: (visibles) => `${visibles} combinacions de persona i dispositiu visibles en esta consulta.`,
    sessionsResumWeb: (visibles, total) => `${visibles} de ${total} combinacions de persona i dispositiu coincidents.`,
    sessionsMaximNota: 'Es mostren com a màxim 200 combinacions per consulta; concreta els filtres per buscar-ne més. Hora:',
    sessionsCaption: 'Usuaris i dispositius amb activitat recent',
    sessionsColUsuari: 'Usuari',
    sessionsColDispositiu: 'Dispositiu',
    sessionsColActivitat: 'Última activitat',
    sessionsNomNoInformat: 'Nom no informat',
    sessionsCorreuNoDisponible: 'Correu no disponible',
    sessionsNombre: (n) => (n === 1 ? '1 sessió' : `${n} sessions`),
    sessionsCapCoincidencia: 'No hi ha sessions que coincidisquen amb estos filtres.',

    caminsTitols: CAMINS_CA,
    badgeGooglePlay: '🤖 Google Play: prova tancada amb verificadors',
    connectatsTitol: '👥 Usuaris i dispositius connectats',
    connectatsIntroIos: `Quantes persones han entrat des de l’app de l’App Store (v${APP_STORE.versio} · ${APP_STORE.id}), des de Safari o des de l’escriptori.`,
    connectatsIntroWeb: `Quantes persones han entrat des de l’app de l’App Store (v${APP_STORE.versio} · ${APP_STORE.id}) o des de Safari, des de l’app d’Android de Google Play o des de Chrome, i des de l’escriptori.`,
    botoConsultaAra: TEXT_BOTO_CONSULTA,
    estatInicial: TEXT_ESTAT_INICIAL,
    errorResum: (codi) => textErrorResum(codi),
    taulaCaptionPrefix: 'Persones distintes amb sessió activa · consulta de les ',
    colCami: 'Camí',
    col24h: '24 hores',
    col7d: '7 dies',
    col14d: '14 dies',
    filaTotal: 'Persones distintes (tots els camins)',
    notaRecomptes: NOTA_RECOMPTES,
    notaVerificadors: NOTA_VERIFICADORS,
    descarreguesTitol: '📲 Descàrregues oficials',
    botoAppStore: '🍎 Descarrega a l’App Store',
    botoGooglePlay: '▶️ Descarrega a Google Play Beta',
    notaPas1GooglePlay: NOTA_PAS_1_GOOGLE_PLAY,
    guiaAndroidTitol: 'Guia visual de 3 passos per als verificadors d’Android',
    passosAndroid: PASSOS_VERIFICADOR_GOOGLE_PLAY,
    botoCopiaWhatsapp: 'Copia el missatge per al grup de WhatsApp',
    copiatWhatsapp: 'Missatge copiat: enganxa’l al grup de WhatsApp.',
    copiaAMaEtiqueta: 'Este navegador no ha deixat copiar: selecciona el missatge i copia’l a mà',
    missatgeWhatsapp: MISSATGE_WHATSAPP_VERIFICADORS
  }),

  es: Object.freeze({
    locale: 'es-ES',
    paginesTrilogiaRegio: 'Páginas originales en revisión privada',
    directoriSessionsRegio: 'Directorio de usuarios y dispositivos',
    usuarisBotiguesRegio: 'Usuarios, dispositivos y tiendas',
    descarreguesOficialsRegio: 'Descargas oficiales',

    trilogiaCalSessio: 'Hace falta una sesión de administración con segundo factor para revisar estas páginas.',
    trilogiaErrorCorpus: (code) => `No se ha podido verificar el corpus: ${code}`,
    trilogiaVerificant: 'Verificando las diez páginas originales…',
    trilogiaTitol: 'Trilogía Mediterránea y patrimonio de La Torre · 10 páginas',
    trilogiaIntro: 'Borradores privados para revisar. Abrirlos no crea notas ni publica contenido.',
    trilogiaPaginaOriginal: 'Página original ',
    trilogiaDataOriginal: (data) => `Fecha original: ${data} (hora local de WordPress, sin huso declarado).`,
    trilogiaRevisioPendent: (n) => `Revisión pendiente. ${n} imágenes pendientes de copia propia verificada; publicación bloqueada.`,
    trilogiaImatgesVerificades: 'Imágenes propias verificadas. La revisión editorial continúa pendiente; no se ha publicado nada.',
    trilogiaObriEsborrany: 'Abrir el borrador con Edición avanzada',

    sessionsTitol: 'Directorio de usuarios y dispositivos',
    sessionsIntro: 'Personas y dispositivos con actividad en los últimos 14 días. Consulta restringida a superadmin con segundo factor; cada consulta queda registrada en el servidor. Solo aparecen cuentas con consentimiento vigente y sin baja solicitada, con el correo enmascarado. El canal es una estimación del navegador; no se muestra ningún token, dirección IP, agente completo ni identificador de sesión o de persona.',
    sessionsFiltraNom: 'Filtrar por nombre o alias',
    sessionsFiltraDispositiu: 'Filtrar por dispositivo',
    sessionsTotsDispositius: 'Todos los dispositivos',
    sessionsBotoConsulta: 'Consultar el directorio',
    sessionsInicial: 'Todavía no se ha consultado el directorio.',
    sessionsSenseMigracio: `El directorio requiere la migración ${MIGRACIO_DETALL_SESSIONS}, todavía pendiente de verificación en el servidor.`,
    sessionsResumIos: (visibles) => `${visibles} combinaciones de persona y dispositivo visibles en esta consulta.`,
    sessionsResumWeb: (visibles, total) => `${visibles} de ${total} combinaciones de persona y dispositivo coincidentes.`,
    sessionsMaximNota: 'Se muestran como máximo 200 combinaciones por consulta; concreta los filtros para buscar más. Hora:',
    sessionsCaption: 'Usuarios y dispositivos con actividad reciente',
    sessionsColUsuari: 'Usuario',
    sessionsColDispositiu: 'Dispositivo',
    sessionsColActivitat: 'Última actividad',
    sessionsNomNoInformat: 'Nombre no informado',
    sessionsCorreuNoDisponible: 'Correo no disponible',
    sessionsNombre: (n) => (n === 1 ? '1 sesión' : `${n} sesiones`),
    sessionsCapCoincidencia: 'No hay sesiones que coincidan con estos filtros.',

    caminsTitols: Object.freeze({
      app_ios: `🍎 App iPhone/iPad (App Store v${APP_STORE.versio} · ${APP_STORE.id})`,
      web_ios: '🧭 Safari y navegadores de iPhone/iPad (web)',
      app_android: '🤖 App Android (Google Play, WebView)',
      web_android: '🌐 Chrome y navegadores de Android (web)',
      escriptori: '💻 Escritorio (Mac/PC)',
      altres: '❔ Otros (sesiones sin navegador identificado)'
    }),
    badgeGooglePlay: '🤖 Google Play: prueba cerrada con verificadores',
    connectatsTitol: '👥 Usuarios y dispositivos conectados',
    connectatsIntroIos: `Cuántas personas han entrado desde la app del App Store (v${APP_STORE.versio} · ${APP_STORE.id}), desde Safari o desde el escritorio.`,
    connectatsIntroWeb: `Cuántas personas han entrado desde la app del App Store (v${APP_STORE.versio} · ${APP_STORE.id}) o desde Safari, desde la app de Android de Google Play o desde Chrome, y desde el escritorio.`,
    botoConsultaAra: '🔄 Consultar usuarios y dispositivos conectados ahora',
    estatInicial: 'Todavía no se ha consultado. El botón pide al servidor solo recuentos: ningún nombre, correo ni identificador de persona.',
    errorResum: (codi) => ERRORS_ES[codi] ?? ERRORS_ES[CODI_RESUM_SESSIONS.ERROR],
    taulaCaptionPrefix: 'Personas distintas con sesión activa · consulta de las ',
    colCami: 'Canal',
    col24h: '24 horas',
    col7d: '7 días',
    col14d: '14 días',
    filaTotal: 'Personas distintas (todos los canales)',
    notaRecomptes: 'Personas distintas con alguna sesión activa en cada ventana. Quien entra desde dos canales cuenta en ambos; la fila del total cuenta a cada persona una sola vez. Un iPad en modo escritorio (predeterminado desde iPadOS 13) se presenta como Mac y cuenta en escritorio.',
    notaVerificadors: `La app de Android activa en 14 días no es la cifra de verificadores de Google: Google pide ${VERIFICADORS_DE_GOOGLE.persones} con la app instalada durante ${VERIFICADORS_DE_GOOGLE.dies} días seguidos, y cuántos hay ahora solo se lee en Google Play Console › Pruebas › Prueba cerrada.`,
    descarreguesTitol: '📲 Descargas oficiales',
    botoAppStore: '🍎 Descargar en el App Store',
    botoGooglePlay: '▶️ Descargar en Google Play Beta',
    notaPas1GooglePlay: `Es el paso 1 de los verificadores: Google Play todavía no tiene ficha pública (prueba cerrada, ${VERIFICADORS_DE_GOOGLE.persones} verificadores durante ${VERIFICADORS_DE_GOOGLE.dies} días).`,
    guiaAndroidTitol: 'Guía visual de 3 pasos para los verificadores de Android',
    passosAndroid: PASSOS_ES,
    botoCopiaWhatsapp: 'Copiar el mensaje para el grupo de WhatsApp',
    copiatWhatsapp: 'Mensaje copiado: pégalo en el grupo de WhatsApp.',
    copiaAMaEtiqueta: 'Este navegador no ha permitido copiar: selecciona el mensaje y cópialo a mano',
    missatgeWhatsapp: construeixWhatsapp(
      `Sóc de Poble para Android: Google nos pide ${VERIFICADORS_DE_GOOGLE.persones} verificadores con la app instalada durante ${VERIFICADORS_DE_GOOGLE.dies} días seguidos para publicarla. Si tienes un móvil Android, haz estos tres pasos:`,
      PASSOS_ES,
      'Enlace del paso 1',
      'En iPhone y iPad ya está en el App Store'
    )
  }),

  en: Object.freeze({
    locale: 'en-GB',
    paginesTrilogiaRegio: 'Original pages under private review',
    directoriSessionsRegio: 'Users and devices directory',
    usuarisBotiguesRegio: 'Users, devices and app stores',
    descarreguesOficialsRegio: 'Official downloads',

    trilogiaCalSessio: 'An administrator session with second factor is required to review these pages.',
    trilogiaErrorCorpus: (code) => `Could not verify the corpus: ${code}`,
    trilogiaVerificant: 'Verifying the ten original pages…',
    trilogiaTitol: 'Mediterranean Trilogy and La Torre heritage · 10 pages',
    trilogiaIntro: 'Private drafts for review. Opening them does not create notes or publish content.',
    trilogiaPaginaOriginal: 'Original page ',
    trilogiaDataOriginal: (data) => `Original date: ${data} (WordPress local time, no declared timezone).`,
    trilogiaRevisioPendent: (n) => `Review pending. ${n} images awaiting a verified local copy; publishing is blocked.`,
    trilogiaImatgesVerificades: 'First-party images verified. Editorial review is still pending; nothing has been published.',
    trilogiaObriEsborrany: 'Open draft in Advanced editing',

    sessionsTitol: 'Users and devices directory',
    sessionsIntro: 'People and devices active in the last 14 days. Restricted to superadmins with second factor; every query is logged on the server. Only accounts with valid consent and no pending deletion appear, with masked email addresses. Channel is a browser estimate; no token, IP address, full user agent, or session/user identifier is shown.',
    sessionsFiltraNom: 'Filter by name or handle',
    sessionsFiltraDispositiu: 'Filter by device',
    sessionsTotsDispositius: 'All devices',
    sessionsBotoConsulta: 'Query directory',
    sessionsInicial: 'The directory has not been queried yet.',
    sessionsSenseMigracio: `The directory requires migration ${MIGRACIO_DETALL_SESSIONS}, still pending verification on the server.`,
    sessionsResumIos: (visibles) => `${visibles} person-and-device combinations visible in this query.`,
    sessionsResumWeb: (visibles, total) => `${visibles} of ${total} matching person-and-device combinations.`,
    sessionsMaximNota: 'Up to 200 combinations are shown per query; narrow the filters to search further. Time:',
    sessionsCaption: 'Users and devices with recent activity',
    sessionsColUsuari: 'User',
    sessionsColDispositiu: 'Device',
    sessionsColActivitat: 'Last activity',
    sessionsNomNoInformat: 'Name not provided',
    sessionsCorreuNoDisponible: 'Email unavailable',
    sessionsNombre: (n) => (n === 1 ? '1 session' : `${n} sessions`),
    sessionsCapCoincidencia: 'No sessions match these filters.',

    caminsTitols: Object.freeze({
      app_ios: `🍎 iPhone/iPad App (App Store v${APP_STORE.versio} · ${APP_STORE.id})`,
      web_ios: '🧭 Safari and iPhone/iPad browsers (web)',
      app_android: '🤖 Android App (Google Play, WebView)',
      web_android: '🌐 Chrome and Android browsers (web)',
      escriptori: '💻 Desktop (Mac/PC)',
      altres: '❔ Other (sessions without an identified browser)'
    }),
    badgeGooglePlay: '🤖 Google Play: closed testing with testers',
    connectatsTitol: '👥 Connected users and devices',
    connectatsIntroIos: `How many people signed in from the App Store app (v${APP_STORE.versio} · ${APP_STORE.id}), from Safari, or from desktop.`,
    connectatsIntroWeb: `How many people signed in from the App Store app (v${APP_STORE.versio} · ${APP_STORE.id}) or Safari, from the Google Play Android app or Chrome, and from desktop.`,
    botoConsultaAra: '🔄 Check connected users and devices now',
    estatInicial: 'Not queried yet. The button asks the server for counts only: no names, emails, or personal identifiers.',
    errorResum: (codi) => ERRORS_EN[codi] ?? ERRORS_EN[CODI_RESUM_SESSIONS.ERROR],
    taulaCaptionPrefix: 'Distinct people with an active session · queried at ',
    colCami: 'Channel',
    col24h: '24 hours',
    col7d: '7 days',
    col14d: '14 days',
    filaTotal: 'Distinct people (all channels)',
    notaRecomptes: 'Distinct people with at least one active session in each window. Signing in from two channels counts in both; the total row counts each person once. An iPad in desktop mode (default since iPadOS 13) reports as Mac and counts under desktop.',
    notaVerificadors: `Active Android app users in 14 days is not Google’s tester count: Google requires ${VERIFICADORS_DE_GOOGLE.persones} testers with the app installed for ${VERIFICADORS_DE_GOOGLE.dies} consecutive days, which is only shown in Google Play Console › Testing › Closed testing.`,
    descarreguesTitol: '📲 Official downloads',
    botoAppStore: '🍎 Download on the App Store',
    botoGooglePlay: '▶️ Download on Google Play Beta',
    notaPas1GooglePlay: `This is step 1 for testers: Google Play has no public listing yet (closed testing, ${VERIFICADORS_DE_GOOGLE.persones} testers for ${VERIFICADORS_DE_GOOGLE.dies} days).`,
    guiaAndroidTitol: '3-step visual guide for Android testers',
    passosAndroid: PASSOS_EN,
    botoCopiaWhatsapp: 'Copy message for the WhatsApp group',
    copiatWhatsapp: 'Message copied: paste it into the WhatsApp group.',
    copiaAMaEtiqueta: 'This browser blocked automatic copy: select the message and copy it manually',
    missatgeWhatsapp: construeixWhatsapp(
      `Sóc de Poble for Android: Google requires ${VERIFICADORS_DE_GOOGLE.persones} testers keeping the app installed for ${VERIFICADORS_DE_GOOGLE.dies} consecutive days before public release. If you have an Android phone, follow these three steps:`,
      PASSOS_EN,
      'Step 1 link',
      'On iPhone and iPad it is already on the App Store'
    )
  }),

  eu: Object.freeze({
    locale: 'eu-ES',
    paginesTrilogiaRegio: 'Berrikuspen pribatuko jatorrizko orriak',
    directoriSessionsRegio: 'Erabiltzaileen eta gailuen direktorioa',
    usuarisBotiguesRegio: 'Erabiltzaileak, gailuak eta dendak',
    descarreguesOficialsRegio: 'Deskarga ofizialak',

    trilogiaCalSessio: 'Bigarren faktorea duen administrazio-saioa behar da orri hauek berrikusteko.',
    trilogiaErrorCorpus: (code) => `Ezin izan da corpusa egiaztatu: ${code}`,
    trilogiaVerificant: 'Hamar jatorrizko orriak egiaztatzen…',
    trilogiaTitol: 'Mediterraneoko Trilogia eta La Torreko ondarea · 10 orri',
    trilogiaIntro: 'Berrikusteko zirriborro pribatuak. Irekitzeak ez du oharrik sortzen ezta edukirik argitaratzen ere.',
    trilogiaPaginaOriginal: 'Jatorrizko orria ',
    trilogiaDataOriginal: (data) => `Jatorrizko data: ${data} (WordPress-eko tokiko ordua, ordu-eremu deklaraturik gabe).`,
    trilogiaRevisioPendent: (n) => `Berrikuspena zain. ${n} irudi kopia propio egiaztatuaren zain; argitalpena blokeatuta.`,
    trilogiaImatgesVerificades: 'Irudi propioak egiaztatuta. Edizio-berrikuspena zain dago oraindik; ez da ezer argitaratu.',
    trilogiaObriEsborrany: 'Ireki zirriborroa Edizio aurreratuarekin',

    sessionsTitol: 'Erabiltzaileen eta gailuen direktorioa',
    sessionsIntro: 'Azken 14 egunetan jarduera izan duten pertsonak eta gailuak. Bigarren faktorea duen superadminari mugatuta; kontsulta bakoitza zerbitzarian erregistratzen da. Baimen indarduna eta baja-eskaerarik gabeko kontuak soilik agertzen dira, helbide elektronikoa maskaratuta. Kanala nabigatzailearen estimazioa da; ez da tokenik, IP helbiderik, agente osorik edo saio/pertsona identifikatzailerik erakusten.',
    sessionsFiltraNom: 'Iragazi izen edo ezizenaren arabera',
    sessionsFiltraDispositiu: 'Iragazi gailuaren arabera',
    sessionsTotsDispositius: 'Gailu guztiak',
    sessionsBotoConsulta: 'Kontsultatu direktorioa',
    sessionsInicial: 'Direktorioa ez da oraindik kontsultatu.',
    sessionsSenseMigracio: `Direktorioak ${MIGRACIO_DETALL_SESSIONS} migrazioa behar du, zerbitzarian oraindik egiaztatzeke.`,
    sessionsResumIos: (visibles) => `Pertsona eta gailu konbinazio ikusgai kontsulta honetan: ${visibles}.`,
    sessionsResumWeb: (visibles, total) => `Bat datozen ${total} pertsona eta gailu konbinazioetatik ${visibles}.`,
    sessionsMaximNota: 'Gehienez 200 konbinazio erakusten dira kontsulta bakoitzeko; zehaztu iragazkiak gehiago bilatzeko. Ordua:',
    sessionsCaption: 'Azkenaldian jarduera izan duten erabiltzaileak eta gailuak',
    sessionsColUsuari: 'Erabiltzailea',
    sessionsColDispositiu: 'Gailua',
    sessionsColActivitat: 'Azken jarduera',
    sessionsNomNoInformat: 'Izena ez da adierazi',
    sessionsCorreuNoDisponible: 'Helbide elektronikoa ez dago erabilgarri',
    sessionsNombre: (n) => (n === 1 ? 'saio 1' : `${n} saio`),
    sessionsCapCoincidencia: 'Ez dago iragazki hauekin bat datorren saiorik.',

    caminsTitols: Object.freeze({
      app_ios: `🍎 iPhone/iPad aplikazioa (App Store v${APP_STORE.versio} · ${APP_STORE.id})`,
      web_ios: '🧭 Safari eta iPhone/iPad nabigatzaileak (weba)',
      app_android: '🤖 Android aplikazioa (Google Play, WebView)',
      web_android: '🌐 Chrome eta Android nabigatzaileak (weba)',
      escriptori: '💻 Mahaigaina (Mac/PC)',
      altres: '❔ Beste batzuk (identifikatu gabeko nabigatzailedun saioak)'
    }),
    badgeGooglePlay: '🤖 Google Play: proba itxia egiaztatzaileekin',
    connectatsTitol: '👥 Konektatutako erabiltzaileak eta gailuak',
    connectatsIntroIos: `Zenbat pertsona sartu diren App Store-ko aplikaziotik (v${APP_STORE.versio} · ${APP_STORE.id}), Safaritik edo mahaigainetik.`,
    connectatsIntroWeb: `Zenbat pertsona sartu diren App Store-ko aplikaziotik (v${APP_STORE.versio} · ${APP_STORE.id}) edo Safaritik, Google Play-ko Android aplikaziotik edo Chrometik, eta mahaigainetik.`,
    botoConsultaAra: '🔄 Kontsultatu konektatutako erabiltzaileak eta gailuak orain',
    estatInicial: 'Oraindik ez da kontsultatu. Botoiak zenbaketak bakarrik eskatzen dizkio zerbitzariari: izenik, helbiderik edo identifikatzailerik ez.',
    errorResum: (codi) => ERRORS_EU[codi] ?? ERRORS_EU[CODI_RESUM_SESSIONS.ERROR],
    taulaCaptionPrefix: 'Saio aktiboa duten pertsona desberdinak · kontsulta-ordua: ',
    colCami: 'Kanala',
    col24h: '24 ordu',
    col7d: '7 egun',
    col14d: '14 egun',
    filaTotal: 'Pertsona desberdinak (kanal guztiak)',
    notaRecomptes: 'Leiho bakoitzean saio aktiboren bat duten pertsona desberdinak. Bi kanaletatik sartzen dena bietan zenbatzen da; guztizkoaren errenkadak pertsona bakoitza behin zenbatzen du. Mahaigain moduko iPad bat (lehenetsia iPadOS 13tik) Mac gisa aurkezten da eta mahaigainean zenbatzen da.',
    notaVerificadors: `14 egunetan aktibo dagoen Android aplikazioa ez da Googleren egiaztatzaile-kopurua: Googlek ${VERIFICADORS_DE_GOOGLE.persones} eskatzen ditu aplikazioa ${VERIFICADORS_DE_GOOGLE.dies} egunez jarraian instalatuta dutela, eta hori Google Play Console › Probak › Proba itxia atalean bakarrik irakurtzen da.`,
    descarreguesTitol: '📲 Deskarga ofizialak',
    botoAppStore: '🍎 Deskargatu App Store-n',
    botoGooglePlay: '▶️ Deskargatu Google Play Beta-n',
    notaPas1GooglePlay: `Egiaztatzaileen 1. urratsa da: Google Play-k oraindik ez du fitxa publikorik (proba itxia, ${VERIFICADORS_DE_GOOGLE.persones} egiaztatzaile ${VERIFICADORS_DE_GOOGLE.dies} egunez).`,
    guiaAndroidTitol: 'Androideko egiaztatzaileentzako 3 urratseko gida bisuala',
    passosAndroid: PASSOS_EU,
    botoCopiaWhatsapp: 'Kopiatu WhatsApp talderako mezua',
    copiatWhatsapp: 'Mezua kopiatuta: itsatsi WhatsApp taldean.',
    copiaAMaEtiqueta: 'Nabigatzaile honek ez du kopiatzen utzi: hautatu mezua eta kopiatu eskuz',
    missatgeWhatsapp: construeixWhatsapp(
      `Sóc de Poble Androiderako: Googlek ${VERIFICADORS_DE_GOOGLE.persones} egiaztatzaile eskatzen dizkigu aplikazioa ${VERIFICADORS_DE_GOOGLE.dies} egunez jarraian instalatuta dutela argitaratu ahal izateko. Android mugikorra baduzu, egin hiru urrats hauek:`,
      PASSOS_EU,
      '1. urratseko esteka',
      'iPhone eta iPaden dagoeneko App Store-n dago'
    )
  }),

  gl: Object.freeze({
    locale: 'gl-ES',
    paginesTrilogiaRegio: 'Páxinas orixinais en revisión privada',
    directoriSessionsRegio: 'Directorio de usuarios e dispositivos',
    usuarisBotiguesRegio: 'Usuarios, dispositivos e tendas',
    descarreguesOficialsRegio: 'Descargas oficiais',

    trilogiaCalSessio: 'Cómpre unha sesión de administración con segundo factor para revisar estas páxinas.',
    trilogiaErrorCorpus: (code) => `Non se puido verificar o corpus: ${code}`,
    trilogiaVerificant: 'Verificando as dez páxinas orixinais…',
    trilogiaTitol: 'Triloxía Mediterránea e patrimonio de La Torre · 10 páxinas',
    trilogiaIntro: 'Borradores privados para revisar. Abrilos non crea notas nin publica contido.',
    trilogiaPaginaOriginal: 'Páxina orixinal ',
    trilogiaDataOriginal: (data) => `Data orixinal: ${data} (hora local de WordPress, sen fuso declarado).`,
    trilogiaRevisioPendent: (n) => `Revisión pendente. ${n} imaxes pendentes de copia propia verificada; publicación bloqueada.`,
    trilogiaImatgesVerificades: 'Imaxes propias verificadas. A revisión editorial continúa pendente; non se publicou nada.',
    trilogiaObriEsborrany: 'Abrir o borrador con Edición avanzada',

    sessionsTitol: 'Directorio de usuarios e dispositivos',
    sessionsIntro: 'Persoas e dispositivos con actividade nos últimos 14 días. Consulta restrinxida a superadmin con segundo factor; cada consulta queda rexistrada no servidor. Só aparecen contas con consentimento vixente e sen baixa solicitada, co correo enmascarado. O canal é unha estimación do navegador; non se amosa ningún token, enderezo IP, axente completo nin identificador de sesión ou de persoa.',
    sessionsFiltraNom: 'Filtrar por nome ou alcume',
    sessionsFiltraDispositiu: 'Filtrar por dispositivo',
    sessionsTotsDispositius: 'Todos os dispositivos',
    sessionsBotoConsulta: 'Consultar o directorio',
    sessionsInicial: 'Aínda non se consultou o directorio.',
    sessionsSenseMigracio: `O directorio require a migración ${MIGRACIO_DETALL_SESSIONS}, aínda pendente de verificación no servidor.`,
    sessionsResumIos: (visibles) => `${visibles} combinacións de persoa e dispositivo visibles nesta consulta.`,
    sessionsResumWeb: (visibles, total) => `${visibles} de ${total} combinacións de persoa e dispositivo coincidentes.`,
    sessionsMaximNota: 'Amósanse como máximo 200 combinacións por consulta; concreta os filtros para buscar máis. Hora:',
    sessionsCaption: 'Usuarios e dispositivos con actividade recente',
    sessionsColUsuari: 'Usuario',
    sessionsColDispositiu: 'Dispositivo',
    sessionsColActivitat: 'Última actividade',
    sessionsNomNoInformat: 'Nome non informado',
    sessionsCorreuNoDisponible: 'Correo non dispoñible',
    sessionsNombre: (n) => (n === 1 ? '1 sesión' : `${n} sesións`),
    sessionsCapCoincidencia: 'Non hai sesións que coincidan con estes filtros.',

    caminsTitols: Object.freeze({
      app_ios: `🍎 App iPhone/iPad (App Store v${APP_STORE.versio} · ${APP_STORE.id})`,
      web_ios: '🧭 Safari e navegadores de iPhone/iPad (web)',
      app_android: '🤖 App Android (Google Play, WebView)',
      web_android: '🌐 Chrome e navegadores de Android (web)',
      escriptori: '💻 Escritorio (Mac/PC)',
      altres: '❔ Outros (sesións sen navegador identificado)'
    }),
    badgeGooglePlay: '🤖 Google Play: proba pechada con verificadores',
    connectatsTitol: '👥 Usuarios e dispositivos conectados',
    connectatsIntroIos: `Cantas persoas entraron desde a app da App Store (v${APP_STORE.versio} · ${APP_STORE.id}), desde Safari ou desde o escritorio.`,
    connectatsIntroWeb: `Cantas persoas entraron desde a app da App Store (v${APP_STORE.versio} · ${APP_STORE.id}) ou desde Safari, desde a app de Android de Google Play ou desde Chrome, e desde o escritorio.`,
    botoConsultaAra: '🔄 Consultar usuarios e dispositivos conectados agora',
    estatInicial: 'Aínda non se consultou. O botón pídelle ao servidor só recontos: ningún nome, correo nin identificador de persoa.',
    errorResum: (codi) => ERRORS_GL[codi] ?? ERRORS_GL[CODI_RESUM_SESSIONS.ERROR],
    taulaCaptionPrefix: 'Persoas distintas con sesión activa · consulta das ',
    colCami: 'Canle',
    col24h: '24 horas',
    col7d: '7 días',
    col14d: '14 días',
    filaTotal: 'Persoas distintas (todas as canles)',
    notaRecomptes: 'Persoas distintas con algunha sesión activa en cada xanela. Quen entra desde dúas canles conta nas dúas; a fila do total conta cada persoa unha vez. Un iPad en modo escritorio (predeterminado desde iPadOS 13) preséntase como Mac e conta no escritorio.',
    notaVerificadors: `A app de Android activa en 14 días non é a cifra de verificadores de Google: Google pide ${VERIFICADORS_DE_GOOGLE.persones} coa app instalada durante ${VERIFICADORS_DE_GOOGLE.dies} días seguidos, e cantos son agora só se le en Google Play Console › Probas › Proba pechada.`,
    descarreguesTitol: '📲 Descargas oficiais',
    botoAppStore: '🍎 Descargar na App Store',
    botoGooglePlay: '▶️ Descargar en Google Play Beta',
    notaPas1GooglePlay: `É o paso 1 dos verificadores: Google Play aínda non ten ficha pública (proba pechada, ${VERIFICADORS_DE_GOOGLE.persones} verificadores durante ${VERIFICADORS_DE_GOOGLE.dies} días).`,
    guiaAndroidTitol: 'Guía visual de 3 pasos para os verificadores de Android',
    passosAndroid: PASSOS_GL,
    botoCopiaWhatsapp: 'Copiar a mensaxe para o grupo de WhatsApp',
    copiatWhatsapp: 'Mensaxe copiada: pégaa no grupo de WhatsApp.',
    copiaAMaEtiqueta: 'Este navegador non deixou copiar: selecciona a mensaxe e cópiaa á man',
    missatgeWhatsapp: construeixWhatsapp(
      `Sóc de Poble para Android: Google pídenos ${VERIFICADORS_DE_GOOGLE.persones} verificadores coa app instalada durante ${VERIFICADORS_DE_GOOGLE.dies} días seguidos para publicala. Se tes un móbil Android, fai estes tres pasos:`,
      PASSOS_GL,
      'Ligazón do paso 1',
      'No iPhone e no iPad xa está na App Store'
    )
  })
});

export function textosAdminEntitats(idioma) {
  const codi = String(idioma || 'ca').toLowerCase().split(/[-_]/)[0];
  return Object.hasOwn(TEXTOS_ADMIN_ENTITATS, codi)
    ? TEXTOS_ADMIN_ENTITATS[codi]
    : TEXTOS_ADMIN_ENTITATS.ca;
}
