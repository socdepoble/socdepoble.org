/**
 * i18nCalendariDelPoble.js · Onada R32.33
 *
 * Diccionari modular diferit (0 B a l'arrencada estàtica de WordPress) per a
 * CalendariDelPoble en les 5 llengües oficials (ca, es, en, eu, gl): fletxes de
 * NavegacioPeriode, selector de 5 vistes, etiquetes ARIA de regió, recompte de
 * publicacions, buits i avisos. El valencià ('ca') conserva byte a byte la còpia
 * canònica històrica.
 */

export const CODIS_IDIOMA_CALENDARI = Object.freeze(['ca', 'es', 'en', 'eu', 'gl']);

export const LOCALES_CALENDARI = Object.freeze({
  ca: 'ca-ES',
  es: 'es-ES',
  en: 'en-GB',
  eu: 'eu-ES',
  gl: 'gl-ES',
});

export function codiIdiomaCalendari(idioma = 'ca') {
  const codi = String(idioma || 'ca').trim().toLowerCase().split(/[-_]/)[0];
  return CODIS_IDIOMA_CALENDARI.includes(codi) ? codi : 'ca';
}

export function localeCalendariPerIdioma(idioma = 'ca') {
  return LOCALES_CALENDARI[codiIdiomaCalendari(idioma)];
}

const ambDeCa = (text) => (/^[aeiouàèéíòóú]/i.test(text) ? `d’${text}` : `de ${text}`);

export const TEXTOS_CALENDARI_POBLE = Object.freeze({
  ca: Object.freeze({
    etiquetaVistes: 'Vista',
    vistes: Object.freeze([
      Object.freeze({ valor: 'setmana', text: 'Setmana' }),
      Object.freeze({ valor: 'dues-setmanes', text: 'Dues setmanes' }),
      Object.freeze({ valor: 'mes', text: 'Mes' }),
      Object.freeze({ valor: 'any', text: 'Any' }),
      Object.freeze({ valor: 'agenda', text: 'Agenda' }),
    ]),
    etiquetesPeriode: Object.freeze({
      setmana: Object.freeze({ anterior: 'Setmana anterior', hui: 'Hui', seguent: 'Setmana següent' }),
      'dues-setmanes': Object.freeze({
        anterior: 'Dues setmanes anteriors',
        hui: 'Hui',
        seguent: 'Dues setmanes següents',
      }),
      mes: Object.freeze({ anterior: 'Mes anterior', hui: 'Hui', seguent: 'Mes següent' }),
      any: Object.freeze({ anterior: 'Any anterior', hui: 'Hui', seguent: 'Any següent' }),
      agenda: Object.freeze({ anterior: 'Mes anterior', hui: 'Hui', seguent: 'Mes següent' }),
    }),
    regioSetmana: (periode) => `Calendari de la setmana del ${periode}`,
    regioDuesSetmanes: (periode) => `Calendari de les dues setmanes del ${periode}`,
    regioAny: (periode) => `Calendari de l’any ${periode}`,
    regioAgenda: (periode) => `Agenda ${ambDeCa(periode)}`,
    regioMes: (periode) => `Calendari ${ambDeCa(periode)}`,
    buitDia: 'Cap publicació este dia.',
    buitSetmana: 'Cap publicació esta setmana.',
    buitDuesSetmanes: 'Cap publicació estes dues setmanes.',
    buitAny: 'Cap publicació este any.',
    buitAgenda: 'Cap publicació en este període.',
    buitMes: 'Cap publicació este mes.',
    recompte: (n) => (n === 1 ? '1 publicació' : `${n} publicacions`),
    sensePintar: (n) => (n === 1
      ? 'Un acte es repetix d’una manera que el calendari encara no sap pintar: el trobaràs a les targetes del dia i del mes que comença.'
      : `${n} actes es repetixen d’una manera que el calendari encara no sap pintar: els trobaràs a les targetes del dia i del mes que comencen.`),
    senseData: (n) => (n === 1
      ? 'Una publicació no es pot situar al calendari perquè no porta cap data o no té identificador: la trobaràs al Mur.'
      : `${n} publicacions no es poden situar al calendari perquè no porten cap data o no tenen identificador: les trobaràs al Mur.`),
  }),
  es: Object.freeze({
    etiquetaVistes: 'Vista',
    vistes: Object.freeze([
      Object.freeze({ valor: 'setmana', text: 'Semana' }),
      Object.freeze({ valor: 'dues-setmanes', text: 'Dos semanas' }),
      Object.freeze({ valor: 'mes', text: 'Mes' }),
      Object.freeze({ valor: 'any', text: 'Año' }),
      Object.freeze({ valor: 'agenda', text: 'Agenda' }),
    ]),
    etiquetesPeriode: Object.freeze({
      setmana: Object.freeze({ anterior: 'Semana anterior', hui: 'Hoy', seguent: 'Semana siguiente' }),
      'dues-setmanes': Object.freeze({
        anterior: 'Dos semanas anteriores',
        hui: 'Hoy',
        seguent: 'Dos semanas siguientes',
      }),
      mes: Object.freeze({ anterior: 'Mes anterior', hui: 'Hoy', seguent: 'Mes siguiente' }),
      any: Object.freeze({ anterior: 'Año anterior', hui: 'Hoy', seguent: 'Año siguiente' }),
      agenda: Object.freeze({ anterior: 'Mes anterior', hui: 'Hoy', seguent: 'Mes siguiente' }),
    }),
    regioSetmana: (periode) => `Calendario de la semana del ${periode}`,
    regioDuesSetmanes: (periode) => `Calendario de las dos semanas del ${periode}`,
    regioAny: (periode) => `Calendario del año ${periode}`,
    regioAgenda: (periode) => `Agenda de ${periode}`,
    regioMes: (periode) => `Calendario de ${periode}`,
    buitDia: 'Ninguna publicación este día.',
    buitSetmana: 'Ninguna publicación esta semana.',
    buitDuesSetmanes: 'Ninguna publicación estas dos semanas.',
    buitAny: 'Ninguna publicación este año.',
    buitAgenda: 'Ninguna publicación en este periodo.',
    buitMes: 'Ninguna publicación este mes.',
    recompte: (n) => (n === 1 ? '1 publicación' : `${n} publicaciones`),
    sensePintar: (n) => (n === 1
      ? 'Un acto se repite de una forma que el calendario aún no sabe dibujar: lo encontrarás en las tarjetas del día y del mes en que empieza.'
      : `${n} actos se repiten de una forma que el calendario aún no sabe dibujar: los encontrarás en las tarjetas del día y del mes en que empiezan.`),
    senseData: (n) => (n === 1
      ? 'Una publicación no se puede situar en el calendario porque no lleva fecha o identificador: la encontrarás en el Muro.'
      : `${n} publicaciones no se pueden situar en el calendario porque no llevan fecha o identificador: las encontrarás en el Muro.`),
  }),
  en: Object.freeze({
    etiquetaVistes: 'View',
    vistes: Object.freeze([
      Object.freeze({ valor: 'setmana', text: 'Week' }),
      Object.freeze({ valor: 'dues-setmanes', text: 'Two weeks' }),
      Object.freeze({ valor: 'mes', text: 'Month' }),
      Object.freeze({ valor: 'any', text: 'Year' }),
      Object.freeze({ valor: 'agenda', text: 'Schedule' }),
    ]),
    etiquetesPeriode: Object.freeze({
      setmana: Object.freeze({ anterior: 'Previous week', hui: 'Today', seguent: 'Next week' }),
      'dues-setmanes': Object.freeze({
        anterior: 'Previous two weeks',
        hui: 'Today',
        seguent: 'Next two weeks',
      }),
      mes: Object.freeze({ anterior: 'Previous month', hui: 'Today', seguent: 'Next month' }),
      any: Object.freeze({ anterior: 'Previous year', hui: 'Today', seguent: 'Next year' }),
      agenda: Object.freeze({ anterior: 'Previous month', hui: 'Today', seguent: 'Next month' }),
    }),
    regioSetmana: (periode) => `Calendar for week of ${periode}`,
    regioDuesSetmanes: (periode) => `Calendar for two weeks of ${periode}`,
    regioAny: (periode) => `Calendar for ${periode}`,
    regioAgenda: (periode) => `Schedule for ${periode}`,
    regioMes: (periode) => `Calendar for ${periode}`,
    buitDia: 'No posts on this day.',
    buitSetmana: 'No posts this week.',
    buitDuesSetmanes: 'No posts during these two weeks.',
    buitAny: 'No posts this year.',
    buitAgenda: 'No posts in this period.',
    buitMes: 'No posts this month.',
    recompte: (n) => (n === 1 ? '1 post' : `${n} posts`),
    sensePintar: (n) => (n === 1
      ? 'One event uses a recurrence pattern not yet rendered on the grid: you can find it in the cards for its start day and month.'
      : `${n} events use recurrence patterns not yet rendered on the grid: you can find them in the cards for their start day and month.`),
    senseData: (n) => (n === 1
      ? 'One post cannot be placed on the calendar because it lacks a date or identifier: you can find it on the Wall.'
      : `${n} posts cannot be placed on the calendar because they lack a date or identifier: you can find them on the Wall.`),
  }),
  eu: Object.freeze({
    etiquetaVistes: 'Ikuspegia',
    vistes: Object.freeze([
      Object.freeze({ valor: 'setmana', text: 'Astea' }),
      Object.freeze({ valor: 'dues-setmanes', text: 'Bi aste' }),
      Object.freeze({ valor: 'mes', text: 'Hilabetea' }),
      Object.freeze({ valor: 'any', text: 'Urtea' }),
      Object.freeze({ valor: 'agenda', text: 'Agenda' }),
    ]),
    etiquetesPeriode: Object.freeze({
      setmana: Object.freeze({ anterior: 'Aurreko astea', hui: 'Gaur', seguent: 'Hurrengo astea' }),
      'dues-setmanes': Object.freeze({
        anterior: 'Aurreko bi asteak',
        hui: 'Gaur',
        seguent: 'Hurrengo bi asteak',
      }),
      mes: Object.freeze({ anterior: 'Aurreko hilabetea', hui: 'Gaur', seguent: 'Hurrengo hilabetea' }),
      any: Object.freeze({ anterior: 'Aurreko urtea', hui: 'Gaur', seguent: 'Hurrengo urtea' }),
      agenda: Object.freeze({ anterior: 'Aurreko hilabetea', hui: 'Gaur', seguent: 'Hurrengo hilabetea' }),
    }),
    regioSetmana: (periode) => `${periode} asteko egutegia`,
    regioDuesSetmanes: (periode) => `${periode} bi asteetako egutegia`,
    regioAny: (periode) => `${periode} urteko egutegia`,
    regioAgenda: (periode) => `${periode} agenda`,
    regioMes: (periode) => `${periode} egutegia`,
    buitDia: 'Ez dago argitalpenik egun honetan.',
    buitSetmana: 'Ez dago argitalpenik aste honetan.',
    buitDuesSetmanes: 'Ez dago argitalpenik bi aste hauetan.',
    buitAny: 'Ez dago argitalpenik urte honetan.',
    buitAgenda: 'Ez dago argitalpenik aldi honetan.',
    buitMes: 'Ez dago argitalpenik hilabete honetan.',
    recompte: (n) => (n === 1 ? 'Argitalpen 1' : `${n} argitalpen`),
    sensePintar: (n) => (n === 1
      ? 'Ekitaldi bat egutegiak oraindik marraztu ezin duen moduan errepikatzen da: hasten den eguneko eta hilabeteko txarteletan aurkituko duzu.'
      : `${n} ekitaldi egutegiak oraindik marraztu ezin duen moduan errepikatzen dira: hasten diren eguneko eta hilabeteko txarteletan aurkituko dituzu.`),
    senseData: (n) => (n === 1
      ? 'Argitalpen bat ezin da egutegian kokatu datarik edo identifikatzailerik ez duelako: Horman aurkituko duzu.'
      : `${n} argitalpen ezin dira egutegian kokatu datarik edo identifikatzailerik ez dutelako: Horman aurkituko dituzu.`),
  }),
  gl: Object.freeze({
    etiquetaVistes: 'Vista',
    vistes: Object.freeze([
      Object.freeze({ valor: 'setmana', text: 'Semana' }),
      Object.freeze({ valor: 'dues-setmanes', text: 'Dúas semanas' }),
      Object.freeze({ valor: 'mes', text: 'Mes' }),
      Object.freeze({ valor: 'any', text: 'Ano' }),
      Object.freeze({ valor: 'agenda', text: 'Axenda' }),
    ]),
    etiquetesPeriode: Object.freeze({
      setmana: Object.freeze({ anterior: 'Semana anterior', hui: 'Hoxe', seguent: 'Semana seguinte' }),
      'dues-setmanes': Object.freeze({
        anterior: 'Dúas semanas anteriores',
        hui: 'Hoxe',
        seguent: 'Dúas semanas seguintes',
      }),
      mes: Object.freeze({ anterior: 'Mes anterior', hui: 'Hoxe', seguent: 'Mes seguinte' }),
      any: Object.freeze({ anterior: 'Ano anterior', hui: 'Hoxe', seguent: 'Ano seguinte' }),
      agenda: Object.freeze({ anterior: 'Mes anterior', hui: 'Hoxe', seguent: 'Mes seguinte' }),
    }),
    regioSetmana: (periode) => `Calendario da semana do ${periode}`,
    regioDuesSetmanes: (periode) => `Calendario das dúas semanas do ${periode}`,
    regioAny: (periode) => `Calendario do ano ${periode}`,
    regioAgenda: (periode) => `Axenda de ${periode}`,
    regioMes: (periode) => `Calendario de ${periode}`,
    buitDia: 'Ningunha publicación este día.',
    buitSetmana: 'Ningunha publicación esta semana.',
    buitDuesSetmanes: 'Ningunha publicación estas dúas semanas.',
    buitAny: 'Ningunha publicación este ano.',
    buitAgenda: 'Ningunha publicación neste período.',
    buitMes: 'Ningunha publicación este mes.',
    recompte: (n) => (n === 1 ? '1 publicación' : `${n} publicacións`),
    sensePintar: (n) => (n === 1
      ? 'Un acto repítese dun xeito que o calendario aínda non sabe debuxar: atoparalo nas tarxetas do día e do mes en que comeza.'
      : `${n} actos repítense dun xeito que o calendario aínda non sabe debuxar: atoparalos nas tarxetas do día e do mes en que comezan.`),
    senseData: (n) => (n === 1
      ? 'Unha publicación non se pode situar no calendario porque non leva data ou identificador: atoparala no Muro.'
      : `${n} publicacións non se poden situar no calendario porque non levan data ou identificador: atoparalas no Muro.`),
  }),
});

export function textosCalendariPoble(idioma = 'ca') {
  return TEXTOS_CALENDARI_POBLE[codiIdiomaCalendari(idioma)];
}
