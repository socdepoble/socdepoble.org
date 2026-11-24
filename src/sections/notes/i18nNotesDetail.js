/**
 * i18nNotesDetail.js — R32.67 · Paritat en 5 llengües (ca, es, en, eu, gl) i
 * sanejament d'errors tècnics per a NotesDetail i DialegEsborrarNota.
 * Conserva el valencià byte-per-byte idèntic a la còpia original.
 */

export const CODIS_IDIOMA_NOTES_DETAIL = Object.freeze(['ca', 'es', 'en', 'eu', 'gl']);

const TEXTOS_NOTES_DETAIL = Object.freeze({
  ca: Object.freeze({
    carregant: 'Carregant la nota…',
    noDisponible: 'La nota ja no està disponible.',
    errorXarxa: 'Ara mateix no s’ha pogut carregar la nota. Comprova la connexió i torna-ho a provar.',
    reintenta: 'Reintentar',
    conflicteTitol: 'Hi ha una versió més nova d’esta nota',
    conflicteDescripcio: (base, remota) =>
      `El teu esborrany es va començar sobre la revisió ${base} i al servidor ja hi ha la ${remota}. Mentre no tries, els canvis no es poden desar.`,
    conflicteDescarta: 'Descartar el meu esborrany',
    conflicteConserva: 'Conservar el meu i sobreescriure',
  }),
  es: Object.freeze({
    carregant: 'Cargando la nota…',
    noDisponible: 'La nota ya no está disponible.',
    errorXarxa: 'Ahora mismo no se ha podido cargar la nota. Comprueba la conexión y vuelve a intentarlo.',
    reintenta: 'Reintentar',
    conflicteTitol: 'Hay una versión más reciente de esta nota',
    conflicteDescripcio: (base, remota) =>
      `Tu borrador se empezó sobre la revisión ${base} y en el servidor ya está la ${remota}. Mientras no elijas, los cambios no se pueden guardar.`,
    conflicteDescarta: 'Descartar mi borrador',
    conflicteConserva: 'Conservar el mío y sobrescribir',
  }),
  en: Object.freeze({
    carregant: 'Loading note…',
    noDisponible: 'This note is no longer available.',
    errorXarxa: 'We could not load this note right now. Check your connection and try again.',
    reintenta: 'Try again',
    conflicteTitol: 'There is a newer version of this note',
    conflicteDescripcio: (base, remota) =>
      `Your draft started from revision ${base}, and revision ${remota} is already on the server. Changes cannot be saved until you choose.`,
    conflicteDescarta: 'Discard my draft',
    conflicteConserva: 'Keep mine and overwrite',
  }),
  eu: Object.freeze({
    carregant: 'Oharra kargatzen…',
    noDisponible: 'Ohar hau ez dago erabilgarri jada.',
    errorXarxa: 'Une honetan ezin izan da oharra kargatu. Egiaztatu konexioa eta saiatu berriro.',
    reintenta: 'Berriro saiatu',
    conflicteTitol: 'Ohar honen bertsio berriago bat dago',
    conflicteDescripcio: (base, remota) =>
      `Zure zirriborroa ${base}. berrikuspenean hasi zen eta zerbitzarian ${remota}. dago jada. Aukeratu arte, aldaketak ezin dira gorde.`,
    conflicteDescarta: 'Baztertu nire zirriborroa',
    conflicteConserva: 'Mantendu nirea eta gainidatzi',
  }),
  gl: Object.freeze({
    carregant: 'Cargando a nota…',
    noDisponible: 'A nota xa non está dispoñible.',
    errorXarxa: 'Agora mesmo non se puido cargar a nota. Comproba a conexión e téntao de novo.',
    reintenta: 'Tentar de novo',
    conflicteTitol: 'Hai unha versión máis recente desta nota',
    conflicteDescripcio: (base, remota) =>
      `O teu borrador comezouse sobre a revisión ${base} e no servidor xa está a ${remota}. Mentres non escollas, os cambios non se poden gardar.`,
    conflicteDescarta: 'Descartar o meu borrador',
    conflicteConserva: 'Conservar o meu e sobrescribir',
  }),
});

const TEXTOS_DIALEG_ESBORRAR = Object.freeze({
  ca: Object.freeze({
    titolPas1: (titol) => `Què vols fer amb «${titol}»?`,
    descripcioPas1: 'Només «Borrar definitivament» no té volta arrere.',
    paperera: 'Guardar durant 30 dies',
    arxivar: 'Arxivar',
    definitiu: 'Borrar definitivament',
    explicaPaperera: 'Ix del bloc i es guarda a la paperera 30 dies; després s’esborra per sempre.',
    explicaArxiu: 'Ix del bloc i es guarda a l’arxiu, sense data de caducitat.',
    explicaDefinitiu: 'S’esborra ara i no es podrà recuperar.',
    titolPas2: (titol) => `Borrar per sempre «${titol}»?`,
    descripcioPas2: 'S’esborra ara i no es podrà recuperar: no passa per la paperera.',
    enrere: 'Enrere',
    perSempre: 'Borrar per sempre',
    murQueda: 'La publicació al Mur es queda on és.',
  }),
  es: Object.freeze({
    titolPas1: (titol) => `¿Qué quieres hacer con «${titol}»?`,
    descripcioPas1: 'Solo «Borrar definitivamente» no tiene vuelta atrás.',
    paperera: 'Guardar durante 30 días',
    arxivar: 'Archivar',
    definitiu: 'Borrar definitivamente',
    explicaPaperera: 'Sale del bloc y se guarda en la papelera 30 días; después se borra para siempre.',
    explicaArxiu: 'Sale del bloc y se guarda en el archivo, sin fecha de caducidad.',
    explicaDefinitiu: 'Se borra ahora y no se podrá recuperar.',
    titolPas2: (titol) => `¿Borrar para siempre «${titol}»?`,
    descripcioPas2: 'Se borra ahora y no se podrá recuperar: no pasa por la papelera.',
    enrere: 'Atrás',
    perSempre: 'Borrar para siempre',
    murQueda: 'La publicación en el Muro se queda donde está.',
  }),
  en: Object.freeze({
    titolPas1: (titol) => `What would you like to do with «${titol}»?`,
    descripcioPas1: 'Only «Delete permanently» cannot be undone.',
    paperera: 'Keep for 30 days',
    arxivar: 'Archive',
    definitiu: 'Delete permanently',
    explicaPaperera: 'Leaves the notebook and stays in the bin for 30 days; then it is deleted forever.',
    explicaArxiu: 'Leaves the notebook and is kept in the archive with no expiry date.',
    explicaDefinitiu: 'Deleted right away and cannot be recovered.',
    titolPas2: (titol) => `Delete «${titol}» forever?`,
    descripcioPas2: 'It is deleted right away and cannot be recovered: it skips the bin.',
    enrere: 'Back',
    perSempre: 'Delete forever',
    murQueda: 'The post on the Wall stays where it is.',
  }),
  eu: Object.freeze({
    titolPas1: (titol) => `Zer egin nahi duzu «${titol}» oharrarekin?`,
    descripcioPas1: '«Betiko ezabatu» aukerak bakarrik ez du atzera bueltarik.',
    paperera: 'Gorde 30 egunez',
    arxivar: 'Artxibatu',
    definitiu: 'Betiko ezabatu',
    explicaPaperera: 'Koadernotik irten eta zakarrontzian gordetzen da 30 egunez; gero betiko ezabatzen da.',
    explicaArxiu: 'Koadernotik irten eta artxiboan gordetzen da, iraungitze-datarik gabe.',
    explicaDefinitiu: 'Orain ezabatzen da eta ezingo da berreskuratu.',
    titolPas2: (titol) => `«${titol}» betiko ezabatu?`,
    descripcioPas2: 'Orain ezabatzen da eta ezingo da berreskuratu: ez da zakarrontzitik igarotzen.',
    enrere: 'Atzera',
    perSempre: 'Betiko ezabatu',
    murQueda: 'Hormako argitalpena bere lekuan geratzen da.',
  }),
  gl: Object.freeze({
    titolPas1: (titol) => `Que queres facer con «${titol}»?`,
    descripcioPas1: 'Só «Borrar definitivamente» non ten volta atrás.',
    paperera: 'Gardar durante 30 días',
    arxivar: 'Arquivar',
    definitiu: 'Borrar definitivamente',
    explicaPaperera: 'Sae do caderno e gárdase no lixo 30 días; despois bórrase para sempre.',
    explicaArxiu: 'Sae do caderno e gárdase no arquivo, sen data de caducidade.',
    explicaDefinitiu: 'Bórrase agora e non se poderá recuperar.',
    titolPas2: (titol) => `Borrar para sempre «${titol}»?`,
    descripcioPas2: 'Bórrase agora e non se poderá recuperar: non pasa polo lixo.',
    enrere: 'Atrás',
    perSempre: 'Borrar para sempre',
    murQueda: 'A publicación no Muro queda onde está.',
  }),
});

export function normalitzaIdiomaNotes(llengua) {
  const codi = String(llengua || 'ca').trim().toLowerCase().split(/[-_]/)[0];
  return Object.hasOwn(TEXTOS_NOTES_DETAIL, codi) ? codi : 'ca';
}

export function textosNotesDetail(llengua = 'ca') {
  return TEXTOS_NOTES_DETAIL[normalitzaIdiomaNotes(llengua)];
}

export function textosDialegEsborrarNota(llengua = 'ca') {
  return TEXTOS_DIALEG_ESBORRAR[normalitzaIdiomaNotes(llengua)];
}

const PATRO_ARGOT_XARXA = /^(failed to fetch|network\s*error|load failed|fetch failed|typeerror|aborterror|http \d+|status \d+|timeout|err_)/i;

export function sanejaErrorNota(missatge, tx = TEXTOS_NOTES_DETAIL.ca) {
  const net = typeof missatge === 'string' ? missatge.trim() : '';
  if (!net || PATRO_ARGOT_XARXA.test(net)) return tx.errorXarxa;
  return net;
}
