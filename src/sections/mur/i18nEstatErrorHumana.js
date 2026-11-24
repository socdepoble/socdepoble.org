/**
 * i18nEstatErrorHumana.js — Resiliència offline en les 5 llengües oficials
 * (ca, es, en, eu, gl) i sanejament d'excepcions tècniques del navegador per a
 * Mur, Mercat i Pobles (Ronda G11 · R32.69).
 *
 * Quan un dispositiu amb 3G intermitent cau fora de línia abans que carregue
 * el paquet diferit d'idioma, `t(clau, reservaCa)` retorna la reserva en
 * valencià. `resolOffline` lliura la traducció exacta en la llengua activa de
 * la interfície sense alterar ni un caràcter del camí valencià ni de les
 * crides literals verificades per `i18n.claus.test.js`.
 */

export const CODIS_IDIOMA_HUMANA = Object.freeze(['ca', 'es', 'en', 'eu', 'gl']);

export const TEXTOS_OFFLINE_HUMANA = Object.freeze({
  ca: Object.freeze({
    'common.reintenta': 'Torna-ho a provar',
    'error.backendInabastable': 'El servidor de Sóc de Poble no respon ara mateix. El contingut no s’ha pogut carregar.',
    'error.servidor': 'El servidor de Sóc de Poble ha tornat un error. Torna-ho a provar més tard.',
    'error.xarxa': 'Revisa la connexió i torna-ho a provar.',
    'error.tornaDemostracio': 'Tornar al mode de proves',
    'error.esborrarEleccio': 'No s’ha pogut esborrar l’elecció. Permet l’emmagatzematge del navegador i torna a provar.',
    'section.notes.historic.mur.titol': 'Ja publicat al Mur',
    'section.notes.historic.mur.buit': 'Amb esta identitat encara no hi ha res publicat al Mur.',
    'section.notes.historic.mercat.titol': 'Ja publicat al Mercat',
    'section.notes.historic.mercat.buit': 'Amb esta identitat encara no hi ha res publicat al Mercat.',
    'section.notes.historic.events.titol': 'Ja publicat a Esdeveniments',
    'section.notes.historic.events.buit': 'Amb esta identitat encara no hi ha res publicat a Esdeveniments.',
    'section.notes.historic.carregant': 'Carregant les publicacions…',
    'section.notes.historic.error': 'No s’han pogut carregar les publicacions',
    'section.notes.historic.fallada': 'La resta de la pàgina continua com sempre.',
    'section.detail.pobles.entitats.buit': 'Encara no hi ha cap empresa ni entitat d’este poble al directori.',
    'section.detail.pobles.entitats.carregant': 'Carregant les empreses i entitats d’este poble…',
    'section.detail.pobles.entitats.error': 'No s’han pogut carregar les empreses i entitats d’este poble',
    'section.detail.pobles.entitats.noDisponible': 'Este servidor encara no llista les empreses i entitats dels pobles.',
    'section.detail.pobles.entitats.empresa': 'Empresa',
    'section.detail.pobles.entitats.entitat': 'Entitat',
    'section.detail.pobles.entitats.grup': 'Grup'
  }),
  es: Object.freeze({
    'common.reintenta': 'Vuelve a intentarlo',
    'error.backendInabastable': 'El servidor de Sóc de Poble no responde ahora mismo. No se ha podido cargar el contenido.',
    'error.servidor': 'El servidor de Sóc de Poble ha devuelto un error. Vuelve a intentarlo más tarde.',
    'error.xarxa': 'Revisa la conexión y vuelve a intentarlo.',
    'error.tornaDemostracio': 'Volver al modo de pruebas',
    'error.esborrarEleccio': 'No se ha podido borrar la elección. Permite el almacenamiento del navegador y vuelve a probar.',
    'section.notes.historic.mur.titol': 'Ya publicado en el Muro',
    'section.notes.historic.mur.buit': 'Con esta identidad todavía no hay nada publicado en el Muro.',
    'section.notes.historic.mercat.titol': 'Ya publicado en el Mercado',
    'section.notes.historic.mercat.buit': 'Con esta identidad todavía no hay nada publicado en el Mercado.',
    'section.notes.historic.events.titol': 'Ya publicado en Eventos',
    'section.notes.historic.events.buit': 'Con esta identidad todavía no hay nada publicado en Eventos.',
    'section.notes.historic.carregant': 'Cargando las publicaciones…',
    'section.notes.historic.error': 'No se han podido cargar las publicaciones',
    'section.notes.historic.fallada': 'El resto de la página sigue como siempre.',
    'section.detail.pobles.entitats.buit': 'Todavía no hay ninguna empresa ni entidad de este pueblo en el directorio.',
    'section.detail.pobles.entitats.carregant': 'Cargando las empresas y entidades del pueblo…',
    'section.detail.pobles.entitats.error': 'No se han podido cargar las empresas y entidades del pueblo',
    'section.detail.pobles.entitats.noDisponible': 'Este servidor todavía no lista las empresas y entidades de los pueblos.',
    'section.detail.pobles.entitats.empresa': 'Empresa',
    'section.detail.pobles.entitats.entitat': 'Entidad',
    'section.detail.pobles.entitats.grup': 'Grupo'
  }),
  en: Object.freeze({
    'common.reintenta': 'Try again',
    'error.backendInabastable': 'The Sóc de Poble server is not responding right now. The content could not be loaded.',
    'error.servidor': 'The Sóc de Poble server returned an error. Try again later.',
    'error.xarxa': 'Check your connection and try again.',
    'error.tornaDemostracio': 'Back to demo mode',
    'error.esborrarEleccio': 'Your choice could not be cleared. Allow browser storage and try again.',
    'section.notes.historic.mur.titol': 'Already published on the Wall',
    'section.notes.historic.mur.buit': 'Nothing has been published with this identity on the Wall yet.',
    'section.notes.historic.mercat.titol': 'Already published in the Market',
    'section.notes.historic.mercat.buit': 'Nothing has been published with this identity in the Market yet.',
    'section.notes.historic.events.titol': 'Already published in Events',
    'section.notes.historic.events.buit': 'Nothing has been published with this identity in Events yet.',
    'section.notes.historic.carregant': 'Loading the posts…',
    'section.notes.historic.error': 'The posts could not be loaded',
    'section.notes.historic.fallada': 'The rest of the page carries on as usual.',
    'section.detail.pobles.entitats.buit': 'There are no businesses or organisations from this town in the directory yet.',
    'section.detail.pobles.entitats.carregant': 'Loading the town’s businesses and organisations…',
    'section.detail.pobles.entitats.error': 'The town’s businesses and organisations could not be loaded',
    'section.detail.pobles.entitats.noDisponible': 'This server does not list the towns’ businesses and organisations yet.',
    'section.detail.pobles.entitats.empresa': 'Business',
    'section.detail.pobles.entitats.entitat': 'Organisation',
    'section.detail.pobles.entitats.grup': 'Group'
  }),
  eu: Object.freeze({
    'common.reintenta': 'Saiatu berriro',
    'error.backendInabastable': 'Sóc de Poble-ren zerbitzariak ez du erantzuten oraintxe. Ezin izan da edukia kargatu.',
    'error.servidor': 'Sóc de Poble-ren zerbitzariak errore bat itzuli du. Saiatu berriro geroago.',
    'error.xarxa': 'Egiaztatu konexioa eta saiatu berriro.',
    'error.tornaDemostracio': 'Itzuli proba modura',
    'error.esborrarEleccio': 'Ezin izan da hautua ezabatu. Baimendu nabigatzailearen biltegiratzea eta saiatu berriro.',
    'section.notes.historic.mur.titol': 'Dagoeneko Horman argitaratuta',
    'section.notes.historic.mur.buit': 'Identitate honekin ez dago oraindik ezer argitaratuta Horman.',
    'section.notes.historic.mercat.titol': 'Dagoeneko Merkatuan argitaratuta',
    'section.notes.historic.mercat.buit': 'Identitate honekin ez dago oraindik ezer argitaratuta Merkatuan.',
    'section.notes.historic.events.titol': 'Dagoeneko Ekitaldietan argitaratuta',
    'section.notes.historic.events.buit': 'Identitate honekin ez dago oraindik ezer argitaratuta Ekitaldietan.',
    'section.notes.historic.carregant': 'Argitalpenak kargatzen…',
    'section.notes.historic.error': 'Ezin izan dira argitalpenak kargatu',
    'section.notes.historic.fallada': 'Orriaren gainerakoak ohi bezala jarraitzen du.',
    'section.detail.pobles.entitats.buit': 'Oraindik ez dago herri honetako enpresarik edo erakunderik direktorioan.',
    'section.detail.pobles.entitats.carregant': 'Herriko enpresak eta erakundeak kargatzen…',
    'section.detail.pobles.entitats.error': 'Ezin izan dira herriko enpresak eta erakundeak kargatu',
    'section.detail.pobles.entitats.noDisponible': 'Zerbitzari honek oraindik ez ditu herrietako enpresak eta erakundeak zerrendatzen.',
    'section.detail.pobles.entitats.empresa': 'Enpresa',
    'section.detail.pobles.entitats.entitat': 'Erakundea',
    'section.detail.pobles.entitats.grup': 'Taldea'
  }),
  gl: Object.freeze({
    'common.reintenta': 'Téntao de novo',
    'error.backendInabastable': 'O servidor de Sóc de Poble non responde agora mesmo. Non se puido cargar o contido.',
    'error.servidor': 'O servidor de Sóc de Poble devolveu un erro. Téntao de novo máis tarde.',
    'error.xarxa': 'Revisa a conexión e téntao de novo.',
    'error.tornaDemostracio': 'Volver ao modo de probas',
    'error.esborrarEleccio': 'Non se puido borrar a elección. Permite o almacenamento do navegador e téntao de novo.',
    'section.notes.historic.mur.titol': 'Xa publicado no Muro',
    'section.notes.historic.mur.buit': 'Con esta identidade aínda non hai nada publicado no Muro.',
    'section.notes.historic.mercat.titol': 'Xa publicado no Mercado',
    'section.notes.historic.mercat.buit': 'Con esta identidade aínda non hai nada publicado no Mercado.',
    'section.notes.historic.events.titol': 'Xa publicado en Eventos',
    'section.notes.historic.events.buit': 'Con esta identidade aínda non hai nada publicado en Eventos.',
    'section.notes.historic.carregant': 'Cargando as publicacións…',
    'section.notes.historic.error': 'Non se puideron cargar as publicacións',
    'section.notes.historic.fallada': 'O resto da páxina segue coma sempre.',
    'section.detail.pobles.entitats.buit': 'Aínda non hai ningunha empresa nin entidade deste pobo no directorio.',
    'section.detail.pobles.entitats.carregant': 'Cargando as empresas e entidades do pobo…',
    'section.detail.pobles.entitats.error': 'Non se puideron cargar as empresas e entidades do pobo',
    'section.detail.pobles.entitats.noDisponible': 'Este servidor aínda non lista as empresas e entidades dos pobos.',
    'section.detail.pobles.entitats.empresa': 'Empresa',
    'section.detail.pobles.entitats.entitat': 'Entidade',
    'section.detail.pobles.entitats.grup': 'Grupo'
  })
});

export function normalitzaIdiomaHumana(idioma = 'ca') {
  const codi = String(idioma || 'ca').trim().toLowerCase().split(/[-_]/)[0];
  return Object.hasOwn(TEXTOS_OFFLINE_HUMANA, codi) ? codi : 'ca';
}

export function resolOffline(valorTraduit, clau, idioma = 'ca') {
  const codi = normalitzaIdiomaHumana(idioma);
  if (codi === 'ca') return valorTraduit;
  const valorCa = TEXTOS_OFFLINE_HUMANA.ca[clau];
  if (typeof valorTraduit === 'string' && valorTraduit.length > 0 && valorTraduit !== valorCa && valorTraduit !== clau) {
    return valorTraduit;
  }
  return TEXTOS_OFFLINE_HUMANA[codi][clau] ?? valorTraduit;
}

const PATRO_ARGOT_NAVEGADOR = /SecurityError|QuotaExceededError|DOMException|TypeError|ReferenceError|Failed to |Access is denied|The operation is insecure|localStorage|sessionStorage/i;

export function sanejaErrorEixidaRemota(err, idioma = 'ca') {
  const codi = normalitzaIdiomaHumana(idioma);
  const missatge = typeof err?.message === 'string' ? err.message.trim() : String(err ?? '').trim();
  if (!missatge || PATRO_ARGOT_NAVEGADOR.test(missatge)) {
    return TEXTOS_OFFLINE_HUMANA[codi]['error.esborrarEleccio'];
  }
  if (codi !== 'ca' && missatge === TEXTOS_OFFLINE_HUMANA.ca['error.esborrarEleccio']) {
    return TEXTOS_OFFLINE_HUMANA[codi]['error.esborrarEleccio'];
  }
  return missatge;
}
