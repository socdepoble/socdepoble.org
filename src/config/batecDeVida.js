/**
 * IDEA-123 + IDEA-124 — Configuració i textos multiidioma (5 llengües) per al
 * Batec de Vida (finestra diürna de 6h + pausa nocturna fins a les 09:00 + 15 min
 * de cortesia, zero GPS en segon pla) i el Protocol d'Emergències Offline / DANA.
 *
 * Reversibilitat d'1 pas: BATEC_DE_VIDA_ACTIU = false per defecte.
 */
export const BATEC_DE_VIDA_ACTIU = false;

export const INTERVAL_DIA_HORES_DEFECTE = 6;
export const HORA_DESPERTAR_DEFECTE = '09:00';
export const HORA_PAUSA_NOCTURNA_DEFECTE = '22:00';
export const MINUTS_GRACIA_CORTESIA = 15;
export const CLAU_STORAGE_BATEC = 'sdp_batec_vida_local_v1';
export const CLAU_STORAGE_EMERGENCIES = 'sdp_protocol_emergencies_offline_v1';
export const MAX_BACKOFF_MINUTS_BATERIA = 60;

/*
 * Refugis: NO n'hi ha cap per defecte. La llista ve de la configuració del poble
 * (tenant), publicada per l'Ajuntament, amb font i data. Cada refugi:
 *   { id, nom, ubicacio, telefon?, font?, dataFont? }
 * `nom` i `ubicacio` poden ser un text o un objecte per idioma ({ ca, es, en, eu, gl }).
 * Sense dades, la targeta mostra `sheltersEmpty` (truca al 112).
 */

export const TEXTOS_BATEC_DE_VIDA = Object.freeze({
  ca: Object.freeze({
    title: 'Batec de Vida · Tranquil·litat Familiar ({hores}h)',
    subtitle: 'Avís preventiu amable sense rastreig GPS i amb pausa nocturna automàtica',
    badgeOff: 'Opt-in desactivat per defecte',
    badgeOn: 'Batec actiu (finestra diürna {hores}h)',
    badgePaused: 'Pausat temporalment',
    scheduleDay: '☀️ Cada {hores} hores de dia',
    scheduleNight: '🌙 Pausa nocturna fins a les {hora}',
    graceNotice: '⏱️ Cortesia de 15 minuts en este mòbil abans d’activar l’alerta local de contacte.',
    privacyGuarantee: '🔒 Zero GPS en segon pla: només es registra l’hora de l’últim batec, en este mòbil.',
    btnImOk: '💚 Estic bé (Enviar batec ara)',
    btnConfirmGrace: '💚 Tot bé? Toca ací per confirmar',
    btnToggleActive: 'Activar Batec de Vida',
    btnDisableActive: 'Desactivar Batec de Vida',
    btnPause: 'Pausar amb 1 toc',
    btnResume: 'Reprendre amb 1 toc',
    lastBeatLabel: 'Últim batec registrat:',
    noBeatYet: 'Encara no s’ha emés cap batec hui',
    trustedContactsLabel: 'Persones de confiança vinculades:',
    storageErrorNotice: '⚠️ No s’ha pogut guardar el batec en memòria local.',
    foregroundOnlyNotice: 'ℹ️ Només vigila mentre esta pàgina està oberta en este mòbil: no funciona en segon pla.',
    noTrustedContactsNotice: '⚠️ No hi ha cap persona de confiança vinculada: si el Batec venç, ningú no rebrà cap avís.',
    localAlert: '⚠️ Han passat {hores} h sense cap batec. Toca «Estic bé» per a confirmar que estàs bé.',
    noOneWarned: 'Ningú no ha estat avisat: no hi ha cap persona de confiança vinculada.',
  }),
  es: Object.freeze({
    title: 'Latido de Vida · Tranquilidad Familiar ({hores}h)',
    subtitle: 'Aviso preventivo amable sin rastreo GPS y con pausa nocturna automática',
    badgeOff: 'Opt-in desactivado por defecto',
    badgeOn: 'Latido activo (ventana diurna {hores}h)',
    badgePaused: 'Pausado temporalmente',
    scheduleDay: '☀️ Cada {hores} horas de día',
    scheduleNight: '🌙 Pausa nocturna hasta las {hora}',
    graceNotice: '⏱️ Cortesía de 15 minutos en este móvil antes de activar la alerta local de contacto.',
    privacyGuarantee: '🔒 Cero GPS en segundo plano: solo se registra la hora del último latido, en este móvil.',
    btnImOk: '💚 Estoy bien (Enviar latido ahora)',
    btnConfirmGrace: '💚 ¿Todo bien? Toca aquí para confirmar',
    btnToggleActive: 'Activar Latido de Vida',
    btnDisableActive: 'Desactivar Latido de Vida',
    btnPause: 'Pausar con 1 toque',
    btnResume: 'Reanudar con 1 toque',
    lastBeatLabel: 'Último latido registrado:',
    noBeatYet: 'Aún no se ha emitido ningún latido hoy',
    trustedContactsLabel: 'Personas de confianza vinculadas:',
    storageErrorNotice: '⚠️ No se ha podido guardar el latido en memoria local.',
    foregroundOnlyNotice: 'ℹ️ Solo vigila mientras esta página está abierta en este móvil: no funciona en segundo plano.',
    noTrustedContactsNotice: '⚠️ No hay ninguna persona de confianza vinculada: si el Latido vence, nadie recibirá ningún aviso.',
    localAlert: '⚠️ Han pasado {hores} h sin ningún latido. Toca «Estoy bien» para confirmar que estás bien.',
    noOneWarned: 'No se ha avisado a nadie: no hay ninguna persona de confianza vinculada.',
  }),
  en: Object.freeze({
    title: 'Heartbeat of Life · Family Peace of Mind ({hores}h)',
    subtitle: 'Gentle preventive check-in without GPS tracking and with automatic night pause',
    badgeOff: 'Opt-in disabled by default',
    badgeOn: 'Heartbeat active ({hores}h daytime window)',
    badgePaused: 'Temporarily paused',
    scheduleDay: '☀️ Every {hores} hours during the day',
    scheduleNight: '🌙 Night pause until {hora}',
    graceNotice: '⏱️ 15-minute courtesy window on this phone before triggering the local contact alert.',
    privacyGuarantee: '🔒 Zero background GPS: only the last heartbeat time is recorded, on this phone.',
    btnImOk: '💚 I am OK (Send heartbeat now)',
    btnConfirmGrace: '💚 Everything OK? Tap here to confirm',
    btnToggleActive: 'Enable Heartbeat of Life',
    btnDisableActive: 'Disable Heartbeat of Life',
    btnPause: 'One-tap pause',
    btnResume: 'One-tap resume',
    lastBeatLabel: 'Last recorded heartbeat:',
    noBeatYet: 'No heartbeat recorded today yet',
    trustedContactsLabel: 'Linked trusted contacts:',
    storageErrorNotice: '⚠️ Could not persist heartbeat in local storage.',
    foregroundOnlyNotice: 'ℹ️ It only watches while this page is open on this phone: it does not work in the background.',
    noTrustedContactsNotice: '⚠️ No trusted contact is linked: if the Heartbeat runs out, nobody will be warned.',
    localAlert: '⚠️ {hores} h have passed without a heartbeat. Tap “I am OK” to confirm you are fine.',
    noOneWarned: 'Nobody has been warned: no trusted contact is linked.',
  }),
  eu: Object.freeze({
    title: 'Bizi-Taupada · Familiaren Lasaitasuna ({hores}h)',
    subtitle: 'Abisu prebentibo adeitsua GPS jarraipenik gabe eta gaueko etenaldi automatikoarekin',
    badgeOff: 'Opt-in lehenetsita itzalita',
    badgeOn: 'Taupada aktibo (eguneko {hores}h leihoa)',
    badgePaused: 'Aldi baterako etenda',
    scheduleDay: '☀️ Egunez {hores} orduz behin',
    scheduleNight: '🌙 Gaueko etenaldia {hora}ak arte',
    graceNotice: '⏱️ 15 minutuko kortesia-leihoa mugikor honetan tokiko kontaktu-alerta aktibatu aurretik.',
    privacyGuarantee: '🔒 Zero GPS bigarren planoan: azken taupadaren ordua bakarrik gordetzen da, mugikor honetan.',
    btnImOk: '💚 Ondo nago (Bidali taupada orain)',
    btnConfirmGrace: '💚 Dena ondo? Sakatu hemen baieztatzeko',
    btnToggleActive: 'Aktibatu Bizi-Taupada',
    btnDisableActive: 'Desaktibatu Bizi-Taupada',
    btnPause: 'Eten ukitu batekin',
    btnResume: 'Berrekin ukitu batekin',
    lastBeatLabel: 'Erregistratutako azken taupada:',
    noBeatYet: 'Oraindik ez da taupadarik bidali gaur',
    trustedContactsLabel: 'Lotutako konfiantzazko pertsonak:',
    storageErrorNotice: '⚠️ Ezin izan da taupada memoria lokalean gorde.',
    foregroundOnlyNotice: 'ℹ️ Orri hau mugikor honetan irekita dagoen bitartean bakarrik zaintzen du: ez du bigarren planoan funtzionatzen.',
    noTrustedContactsNotice: '⚠️ Ez dago konfiantzazko pertsonarik lotuta: Taupadaren epea amaitzen bada, inork ez du abisurik jasoko.',
    localAlert: '⚠️ {hores} ordu igaro dira taupadarik gabe. Sakatu «Ondo nago» ondo zaudela baieztatzeko.',
    noOneWarned: 'Ez zaio inori abisatu: ez dago konfiantzazko pertsonarik lotuta.',
  }),
  gl: Object.freeze({
    title: 'Latexar de Vida · Tranquilidade Familiar ({hores}h)',
    subtitle: 'Aviso preventivo amable sen rastrexo GPS e con pausa nocturna automática',
    badgeOff: 'Opt-in desactivado por defecto',
    badgeOn: 'Latexar activo (fiestra diúrna {hores}h)',
    badgePaused: 'Pausado temporalmente',
    scheduleDay: '☀️ Cada {hores} horas de día',
    scheduleNight: '🌙 Pausa nocturna ata as {hora}',
    graceNotice: '⏱️ Cortesía de 15 minutos neste móbil antes de activar a alerta local de contacto.',
    privacyGuarantee: '🔒 Cero GPS en segundo plano: só se rexistra a hora do último latexar, neste móbil.',
    btnImOk: '💚 Estou ben (Enviar latexar agora)',
    btnConfirmGrace: '💚 Todo ben? Toca aquí para confirmar',
    btnToggleActive: 'Activar Latexar de Vida',
    btnDisableActive: 'Desactivar Latexar de Vida',
    btnPause: 'Pausar cun toque',
    btnResume: 'Retomar cun toque',
    lastBeatLabel: 'Último latexar rexistrado:',
    noBeatYet: 'Aínda non se emitiu ningún latexar hoxe',
    trustedContactsLabel: 'Persoas de confianza vinculadas:',
    storageErrorNotice: '⚠️ Non se puido gardar o latexar na memoria local.',
    foregroundOnlyNotice: 'ℹ️ Só vixía mentres esta páxina está aberta neste móbil: non funciona en segundo plano.',
    noTrustedContactsNotice: '⚠️ Non hai ningunha persoa de confianza vinculada: se o Latexar vence, ninguén recibirá ningún aviso.',
    localAlert: '⚠️ Pasaron {hores} h sen ningún latexar. Toca «Estou ben» para confirmar que estás ben.',
    noOneWarned: 'Non se avisou a ninguén: non hai ningunha persoa de confianza vinculada.',
  }),
});

export const TEXTOS_EMERGENCIES_OFFLINE = Object.freeze({
  ca: Object.freeze({
    title: 'Protocol d’Emergències Offline · DANA i Apagada',
    subtitle: 'Refugis publicats per l’Ajuntament, guia per a gent major i codi «Estic bé» per a mostrar sense cobertura',
    badgeOfflineReady: 'Guia d’emergència',
    sheltersTitle: '🏛️ Punts de refugi de l’Ajuntament',
    sheltersEmpty: 'L’Ajuntament encara no ha publicat cap refugi. En cas d’emergència, truca al 112.',
    sheltersSource: 'Font',
    elderGuideTitle: '👵 Guia ràpida en cas d’apagada o DANA',
    elderStep1: '1. Queda’t en planta alta o lloc segur; no baixes a garatges ni travesses barrancs.',
    elderStep2: '2. Estalvia bateria: fes servir el mòbil només per al necessari.',
    elderStep3: '3. Sense cobertura, mostra el teu codi «Estic bé» a la brigada o a un veí.',
    btnQueueOkOffline: '💚 Desar «Estic bé» en este mòbil',
    btnShowQr: '📱 Mostrar Codi Veïnal d’Estat (Sense Internet)',
    queuedStatus: 'Estat «Estic bé» desat en este mòbil.',
    storageErrorStatus: 'Error de persistència local: no s’ha pogut desar l’estat «Estic bé». Mostra el codi directament.',
    batterySafeNotice: '🔋 Esta targeta no fa cap connexió de xarxa ni desa dades mèdiques.',
  }),
  es: Object.freeze({
    title: 'Protocolo de Emergencias Offline · DANA y Apagón',
    subtitle: 'Refugios publicados por el Ayuntamiento, guía para mayores y código «Estoy bien» para mostrar sin cobertura',
    badgeOfflineReady: 'Guía de emergencia',
    sheltersTitle: '🏛️ Puntos de refugio del Ayuntamiento',
    sheltersEmpty: 'El Ayuntamiento aún no ha publicado ningún refugio. En caso de emergencia, llama al 112.',
    sheltersSource: 'Fuente',
    elderGuideTitle: '👵 Guía rápida en caso de apagón o DANA',
    elderStep1: '1. Permanece en planta alta o lugar seguro; no bajes a garajes ni cruces barrancos.',
    elderStep2: '2. Ahorra batería: usa el móvil solo para lo necesario.',
    elderStep3: '3. Sin cobertura, muestra tu código «Estoy bien» a la brigada o a un vecino.',
    btnQueueOkOffline: '💚 Guardar «Estoy bien» en este móvil',
    btnShowQr: '📱 Mostrar Código Vecinal de Estado (Sin Internet)',
    queuedStatus: 'Estado «Estoy bien» guardado en este móvil.',
    storageErrorStatus: 'Error de persistencia local: no se pudo guardar el estado «Estoy bien». Muestra el código directamente.',
    batterySafeNotice: '🔋 Esta tarjeta no hace ninguna conexión de red ni guarda datos médicos.',
  }),
  en: Object.freeze({
    title: 'Offline Emergency Protocol · Storm & Blackout',
    subtitle: 'Shelters published by the town council, elder guide and an “I am OK” code to show without coverage',
    badgeOfflineReady: 'Emergency guide',
    sheltersTitle: '🏛️ Town council shelter points',
    sheltersEmpty: 'The town council has not published any shelter yet. In an emergency, call 112.',
    sheltersSource: 'Source',
    elderGuideTitle: '👵 Quick guide during a blackout or flood',
    elderStep1: '1. Stay on an upper floor or safe ground; never enter basements or cross ravines.',
    elderStep2: '2. Save battery: use your phone only for what is necessary.',
    elderStep3: '3. With no coverage, show your “I am OK” code to local responders or a neighbour.',
    btnQueueOkOffline: '💚 Save “I am OK” on this phone',
    btnShowQr: '📱 Show Neighbor Status Code (No Internet)',
    queuedStatus: '“I am OK” status saved on this phone.',
    storageErrorStatus: 'Local storage error: could not save “I am OK” status. Show the code directly.',
    batterySafeNotice: '🔋 This card makes no network connection and stores no medical data.',
  }),
  eu: Object.freeze({
    title: 'Lineaz Kanpoko Larrialdi Protokoloa · DANA eta Itzalaldia',
    subtitle: 'Udalak argitaratutako aterpeak, adinekoentzako gida eta estaldurarik gabe erakusteko «Ondo nago» kodea',
    badgeOfflineReady: 'Larrialdi-gida',
    sheltersTitle: '🏛️ Udalaren aterpe-guneak',
    sheltersEmpty: 'Udalak ez du oraindik aterperik argitaratu. Larrialdietan, deitu 112ra.',
    sheltersSource: 'Iturria',
    elderGuideTitle: '👵 Gida azkarra itzalaldi edo uholde kasuan',
    elderStep1: '1. Geratu goiko solairuan edo leku seguruan; ez jaitsi garajeetara eta ez zeharkatu errekak edo sakanak.',
    elderStep2: '2. Aurreztu bateria: erabili mugikorra beharrezkoa denerako soilik.',
    elderStep3: '3. Estaldurarik gabe, erakutsi zure «Ondo nago» kodea brigadari edo bizilagunari.',
    btnQueueOkOffline: '💚 Gorde «Ondo nago» mugikor honetan',
    btnShowQr: '📱 Erakutsi Auzo Egoera Kodea (Internet gabe)',
    queuedStatus: '«Ondo nago» egoera mugikor honetan gorde da.',
    storageErrorStatus: 'Biltegiratze lokaleko errorea: ezin izan da «Ondo nago» egoera gorde. Erakutsi kodea zuzenean.',
    batterySafeNotice: '🔋 Txartel honek ez du sare-konexiorik egiten eta ez du datu medikorik gordetzen.',
  }),
  gl: Object.freeze({
    title: 'Protocolo de Emerxencias Offline · DANA e Apagón',
    subtitle: 'Refuxios publicados polo Concello, guía para maiores e código «Estou ben» para mostrar sen cobertura',
    badgeOfflineReady: 'Guía de emerxencia',
    sheltersTitle: '🏛️ Puntos de refuxio do Concello',
    sheltersEmpty: 'O Concello aínda non publicou ningún refuxio. En caso de emerxencia, chama ao 112.',
    sheltersSource: 'Fonte',
    elderGuideTitle: '👵 Guía rápida en caso de apagón ou DANA',
    elderStep1: '1. Queda nun andar alto ou lugar seguro; non baixes a garaxes nin cruces regatos.',
    elderStep2: '2. Aforra batería: usa o móbil só para o necesario.',
    elderStep3: '3. Sen cobertura, mostra o teu código «Estou ben» á brigada ou a un veciño.',
    btnQueueOkOffline: '💚 Gardar «Estou ben» neste móbil',
    btnShowQr: '📱 Mostrar Código Veciñal de Estado (Sen Internet)',
    queuedStatus: 'Estado «Estou ben» gardado neste móbil.',
    storageErrorStatus: 'Erro de persistencia local: non se puido gardar o estado «Estou ben». Mostra o código directamente.',
    batterySafeNotice: '🔋 Esta tarxeta non fai ningunha conexión de rede nin garda datos médicos.',
  }),
});

/** Substituïx {clau} pel valor de `valors` (les claus absents es deixen tal qual). */
export function ompleText(plantilla, valors = {}) {
  return String(plantilla).replace(/\{(\w+)\}/g, (tros, clau) => (clau in valors ? String(valors[clau]) : tros));
}

/** El text d'un camp que pot ser un text o un objecte per idioma ({ ca, es, en, eu, gl }). */
export function textEnIdioma(valor, idioma = 'ca') {
  if (valor && typeof valor === 'object') {
    return valor[idioma] || valor.ca || '';
  }
  return typeof valor === 'string' ? valor : '';
}

export function resolTextosBatec(idioma = 'ca') {
  return TEXTOS_BATEC_DE_VIDA[idioma] || TEXTOS_BATEC_DE_VIDA.ca;
}

export function resolTextosEmergencies(idioma = 'ca') {
  return TEXTOS_EMERGENCIES_OFFLINE[idioma] || TEXTOS_EMERGENCIES_OFFLINE.ca;
}

export function calculaBackoffBateriaMinuts(intents = 0) {
  const n = Math.max(0, Math.min(10, Number(intents) || 0));
  return Math.min(MAX_BACKOFF_MINUTS_BATERIA, Math.pow(2, n));
}
