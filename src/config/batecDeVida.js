/** Configuració i textos del Protocol d’Emergències Offline. */
export const CLAU_STORAGE_EMERGENCIES = 'sdp_protocol_emergencies_offline_v1';
export const MAX_BACKOFF_MINUTS_BATERIA = 60;

/*
 * Refugis: NO n'hi ha cap per defecte. La llista ve de la configuració del poble
 * (tenant), publicada per l'Ajuntament, amb font i data. Cada refugi:
 *   { id, nom, ubicacio, telefon?, font?, dataFont? }
 * `nom` i `ubicacio` poden ser un text o un objecte per idioma ({ ca, es, en, eu, gl }).
 * Sense dades, la targeta mostra `sheltersEmpty` (truca al 112).
 */

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

export function resolTextosEmergencies(idioma = 'ca') {
  return TEXTOS_EMERGENCIES_OFFLINE[idioma] || TEXTOS_EMERGENCIES_OFFLINE.ca;
}

export function calculaBackoffBateriaMinuts(intents = 0) {
  const n = Math.max(0, Math.min(10, Number(intents) || 0));
  return Math.min(MAX_BACKOFF_MINUTS_BATERIA, Math.pow(2, n));
}
