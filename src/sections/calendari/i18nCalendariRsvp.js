/* Onada R32.16 · T1 (IDEA-284) · Diccionari diferit en 5 llengües per al
   selector d'assistència RSVP (Assistiré / Potser / No assistiré) i l'avís
   amable de coincidència horària a /calendari, /events/:id i /calendari/:id.
   Viatja exclusivament dins dels trossos diferits (0 B a l'arrencada estàtica
   de WordPress). Llei 32 estricta.
   P0-ANDROID-PUSH (v1.2.16) · B10b · `actePassat`: el que diu el detall d'un
   acte que ja s'ha fet, en lloc de la pregunta i dels tres botons (actePassat.js). */

import { createTranslator } from '../../config/i18n.js';

/* El valencià del diccionari central (ja és al tros d'entrada): cap altre fitxer nomena la carpeta dels diccionaris. */
const VALENCIA = createTranslator('ca');

export const CODIS_IDIOMA_CALENDARI_RSVP = Object.freeze(['ca', 'es', 'en', 'eu', 'gl']);

const DICCIONARI_CALENDARI_RSVP = Object.freeze({
  ca: Object.freeze({
    filtreAria: 'Contingut del calendari',
    filtreEsdeveniments: 'Esdeveniments',
    filtreTot: 'Totes les publicacions',
    desplegableTitol: 'Esdeveniments de Sóc de Poble',
    desplegablePlega: 'Amaga el llistat ràpid',
    desplegableDesplega: 'Mostra tots els esdeveniments',
    desplegableBuit: 'Encara no hi ha cap esdeveniment publicat.',
    desplegableVeureTot: 'Veure totes les publicacions del poble',
    desplegableMes: 'Veure al calendari',
    desplegableVeure: 'Obrir i apuntar-s’hi',
    titolPregunta: 'Assistiràs a este esdeveniment?',
    assistire: 'Assistiré',
    assistireLlarg: 'Sí, compta amb mi',
    potser: 'Potser',
    noAssistire: 'No assistiré',
    noAssistireLlarg: 'No podré anar-hi',
    confirmats: 'Compta amb mi',
    potserComptador: 'Potser',
    grupAria: (titol) => (titol ? `Assistència a ${titol}` : 'Assistència a l’esdeveniment'),
    notaLabel: 'Vols afegir un comentari o motiu? (opcional)',
    notaPlaceholder: 'Ex.: Eixes dates coincidixen amb festes al meu poble, anem dos en cotxe…',
    desa: 'Desar resposta',
    desat: 'S’ha desat la teua resposta en este navegador.',
    actePassat: 'Este acte ja s’ha fet.',
    enviaXat: 'Comentar al xat públic',
    obriXat: 'Xat públic de l’esdeveniment',
    xatPrivat: 'Preguntar en privat',
    xatPrivatAmb: 'Preguntar en privat a {nom}',
    solapamentTitol: 'Coincidència d’horari a la teua agenda',
    solapamentHorari: (titols) =>
      `Coincidix en horari amb «${titols}», on també has marcat «Assistiré». La teua resposta es conserva igualment.`,
    solapamentMateixDia: (titols) =>
      `Coincidix el mateix dia amb «${titols}», on també has marcat «Assistiré». La teua resposta es conserva igualment.`
  }),
  es: Object.freeze({
    filtreAria: 'Contenido del calendario',
    filtreEsdeveniments: 'Eventos',
    filtreTot: 'Todas las publicaciones',
    desplegableTitol: 'Eventos de Sóc de Poble',
    desplegablePlega: 'Ocultar el listado rápido',
    desplegableDesplega: 'Mostrar todos los eventos',
    desplegableBuit: 'Todavía no hay ningún evento publicado.',
    desplegableVeureTot: 'Ver todas las publicaciones del pueblo',
    desplegableMes: 'Ver en el calendario',
    desplegableVeure: 'Abrir y apuntarse',
    titolPregunta: '¿Asistirás a este evento?',
    assistire: 'Asistiré',
    assistireLlarg: 'Sí, cuenta conmigo',
    potser: 'Quizá',
    noAssistire: 'No asistiré',
    noAssistireLlarg: 'No podré asistir',
    confirmats: 'Cuenta conmigo',
    potserComptador: 'Quizá',
    grupAria: (titol) => (titol ? `Asistencia a ${titol}` : 'Asistencia al evento'),
    notaLabel: '¿Quieres añadir un comentario o motivo? (opcional)',
    notaPlaceholder: 'Ej.: Esas fechas coinciden con fiestas en mi pueblo, vamos dos en coche…',
    desa: 'Guardar respuesta',
    desat: 'Se ha guardado tu respuesta en este navegador.',
    actePassat: 'Este acto ya se celebró.',
    enviaXat: 'Comentar en el chat público',
    obriXat: 'Chat público del evento',
    xatPrivat: 'Preguntar en privado',
    xatPrivatAmb: 'Preguntar en privado a {nom}',
    solapamentTitol: 'Coincidencia de horario en tu agenda',
    solapamentHorari: (titols) =>
      `Coincide en horario con «${titols}», donde también has marcado «Asistiré». Tu respuesta se conserva igualmente.`,
    solapamentMateixDia: (titols) =>
      `Coincide el mismo día con «${titols}», donde también has marcado «Asistiré». Tu respuesta se conserva igualmente.`
  }),
  en: Object.freeze({
    filtreAria: 'Calendar content',
    filtreEsdeveniments: 'Events',
    filtreTot: 'All posts',
    desplegableTitol: 'Sóc de Poble events',
    desplegablePlega: 'Hide quick list',
    desplegableDesplega: 'Show all events',
    desplegableBuit: 'No events have been published yet.',
    desplegableVeureTot: 'See all village posts',
    desplegableMes: 'View on calendar',
    desplegableVeure: 'Open and RSVP',
    titolPregunta: 'Will you attend this event?',
    assistire: 'Attending',
    assistireLlarg: 'Yes, count me in',
    potser: 'Maybe',
    noAssistire: 'Not attending',
    noAssistireLlarg: 'I cannot make it',
    confirmats: 'Count me in',
    potserComptador: 'Maybe',
    grupAria: (titol) => (titol ? `Attendance for ${titol}` : 'Event attendance'),
    notaLabel: 'Would you like to add a note or reason? (optional)',
    notaPlaceholder: 'E.g.: Those dates overlap with our town festival, two of us are driving…',
    desa: 'Save response',
    desat: 'Your response has been saved in this browser.',
    actePassat: 'This event has already taken place.',
    enviaXat: 'Comment in public chat',
    obriXat: 'Public event chat',
    xatPrivat: 'Ask privately',
    xatPrivatAmb: 'Ask {nom} privately',
    solapamentTitol: 'Schedule overlap in your calendar',
    solapamentHorari: (titols) =>
      `Overlaps in time with «${titols}», which you also marked as «Attending». Your response is kept either way.`,
    solapamentMateixDia: (titols) =>
      `Falls on the same day as «${titols}», which you also marked as «Attending». Your response is kept either way.`
  }),
  eu: Object.freeze({
    filtreAria: 'Egutegiaren edukia',
    filtreEsdeveniments: 'Ekitaldiak',
    filtreTot: 'Argitalpen guztiak',
    desplegableTitol: 'Sóc de Poble ekitaldiak',
    desplegablePlega: 'Ezkutatu zerrenda azkarra',
    desplegableDesplega: 'Erakutsi ekitaldi guztiak',
    desplegableBuit: 'Oraindik ez dago ekitaldirik argitaratuta.',
    desplegableVeureTot: 'Ikusi herriko argitalpen guztiak',
    desplegableMes: 'Ikusi egutegian',
    desplegableVeure: 'Ireki eta izena eman',
    titolPregunta: 'Ekitaldi honetara joango zara?',
    assistire: 'Joango naiz',
    assistireLlarg: 'Bai, kontatu nirekin',
    potser: 'Beharbada',
    noAssistire: 'Ez naiz joango',
    noAssistireLlarg: 'Ezingo naiz joan',
    confirmats: 'Kontatu nirekin',
    potserComptador: 'Beharbada',
    grupAria: (titol) => (titol ? `${titol} ekitaldirako asistentzia` : 'Ekitaldirako asistentzia'),
    notaLabel: 'Iruzkin edo arrazoi bat gehitu nahi duzu? (aukerakoa)',
    notaPlaceholder: 'Adib.: Data horiek nire herriko jaiekin bat datoz, bi goaz autoan…',
    desa: 'Gorde erantzuna',
    desat: 'Zure erantzuna nabigatzaile honetan gorde da.',
    actePassat: 'Ekitaldi hau dagoeneko egin da.',
    enviaXat: 'Idatzi txat publikoan',
    obriXat: 'Ekitaldiaren txat publikoa',
    xatPrivat: 'Galdetu pribatuan',
    xatPrivatAmb: 'Galdetu pribatuan honi: {nom}',
    solapamentTitol: 'Ordutegi-gainjartzea zure agendan',
    solapamentHorari: (titols) =>
      `Ordutegian bat dator «${titols}» ekitaldiarekin, eta han ere «Joango naiz» markatu duzu. Zure erantzuna berdin gordeko da.`,
    solapamentMateixDia: (titols) =>
      `Egun berean da «${titols}» ekitaldiarekin, eta han ere «Joango naiz» markatu duzu. Zure erantzuna berdin gordeko da.`
  }),
  gl: Object.freeze({
    filtreAria: 'Contido do calendario',
    filtreEsdeveniments: 'Eventos',
    filtreTot: 'Todas as publicacións',
    desplegableTitol: 'Eventos de Sóc de Poble',
    desplegablePlega: 'Agochar a listaxe rápida',
    desplegableDesplega: 'Amosar todos os eventos',
    desplegableBuit: 'Aínda non hai ningún evento publicado.',
    desplegableVeureTot: 'Ver todas as publicacións da vila',
    desplegableMes: 'Ver no calendario',
    desplegableVeure: 'Abrir e anotarse',
    titolPregunta: 'Asistirás a este evento?',
    assistire: 'Asistirei',
    assistireLlarg: 'Si, conta comigo',
    potser: 'Quizais',
    noAssistire: 'Non asistirei',
    noAssistireLlarg: 'Non poderei ir',
    confirmats: 'Conta comigo',
    potserComptador: 'Quizais',
    grupAria: (titol) => (titol ? `Asistencia a ${titol}` : 'Asistencia ao evento'),
    notaLabel: 'Queres engadir un comentario ou motivo? (opcional)',
    notaPlaceholder: 'Ex.: Esas datas coinciden con festas na miña vila, imos dous en coche…',
    desa: 'Gardar resposta',
    desat: 'Gardouse a túa resposta neste navegador.',
    actePassat: 'Este acto xa se celebrou.',
    enviaXat: 'Comentar no chat público',
    obriXat: 'Chat público do evento',
    xatPrivat: 'Preguntar en privado',
    xatPrivatAmb: 'Preguntar en privado a {nom}',
    solapamentTitol: 'Coincidencia de horario na túa axenda',
    solapamentHorari: (titols) =>
      `Coincide en horario con «${titols}», onde tamén marcaches «Asistirei». A túa resposta consérvase igualmente.`,
    solapamentMateixDia: (titols) =>
      `Coincide o mesmo día con «${titols}», onde tamén marcaches «Asistirei». A túa resposta consérvase igualmente.`
  })
});

export function normalitzaIdiomaCalendariRsvp(llengua) {
  const base = String(llengua || 'ca').trim().toLowerCase().split(/[-_]/)[0];
  return Object.hasOwn(DICCIONARI_CALENDARI_RSVP, base) ? base : 'ca';
}

export function textosCalendariRsvp(llengua = 'ca') {
  return DICCIONARI_CALENDARI_RSVP[normalitzaIdiomaCalendariRsvp(llengua)];
}

/* Gauntlet v1.2.13 · Els rètols que ja tenien traducció revisada als diccionaris centrals (p. ex. «Sóc de Pobleren
   ekitaldiak», «No podré ir») no canvien: el central mana en totes les llengües. Fora del valencià, el traductor torna
   el valencià quan la clau no és (o encara no ha arribat) al diccionari de la llengua; llavors mana el diferit. */
export function resolTextCalendariRsvp(t, llengua, clau, valorDiccionari) {
  if (typeof t !== 'function') return valorDiccionari;
  const codi = normalitzaIdiomaCalendariRsvp(llengua);
  const central = t(clau, valorDiccionari);
  if (codi !== 'ca' && central === VALENCIA(clau, null)) return valorDiccionari;
  return central;
}
