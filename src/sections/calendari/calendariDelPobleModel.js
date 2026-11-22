/**
 * Model pur de formatació, períodes i textos per a CalendariDelPoble (R32.24 + R32.33).
 */
import { sumaDies } from '../../utils/periodes.js';
import {
  TEXTOS_CALENDARI_POBLE,
  localeCalendariPerIdioma,
  textosCalendariPoble,
} from './i18nCalendariDelPoble.js';

export const LOCALE_CALENDARI = 'ca-ES';

export const DENSITAT_CALENDARI = 'responsiva';

export const MES_PER_PAS = TEXTOS_CALENDARI_POBLE.ca.etiquetesPeriode.mes;

export const ETIQUETES_PERIODE = TEXTOS_CALENDARI_POBLE.ca.etiquetesPeriode;

export const nomDelMes = ({ any, mes }, locale = LOCALE_CALENDARI) => (
  new Date(any, mes, 1).toLocaleDateString(locale || LOCALE_CALENDARI, { month: 'long', year: 'numeric' })
);

export const dataSenseDiaDeLaSetmana = (data, locale = LOCALE_CALENDARI) => (
  data.toLocaleDateString(locale || LOCALE_CALENDARI, { day: 'numeric', month: 'long', year: 'numeric' })
);

export const nomDelRang = ({ desde, fins }, locale = LOCALE_CALENDARI) => (
  `${dataSenseDiaDeLaSetmana(desde, locale)} – ${dataSenseDiaDeLaSetmana(sumaDies(fins, -1), locale)}`
);

export const ambDe = (text) => (/^[aeiouàèéíòóú]/i.test(text) ? `d’${text}` : `de ${text}`);

export function textosDeLaVista(vista, cursor, rang, idioma = 'ca') {
  const tx = textosCalendariPoble(idioma);
  const locale = localeCalendariPerIdioma(idioma);
  if (vista === 'setmana') {
    const periode = nomDelRang(rang, locale);
    return {
      periode,
      regio: tx.regioSetmana(periode),
      buit: tx.buitSetmana,
      buitDia: tx.buitDia,
      buitAgenda: tx.buitAgenda,
    };
  }
  if (vista === 'dues-setmanes') {
    const periode = nomDelRang(rang, locale);
    return {
      periode,
      regio: tx.regioDuesSetmanes(periode),
      buit: tx.buitDuesSetmanes,
      buitDia: tx.buitDia,
      buitAgenda: tx.buitAgenda,
    };
  }
  if (vista === 'any') {
    const periode = String(cursor.any);
    return {
      periode,
      regio: tx.regioAny(periode),
      buit: tx.buitAny,
      buitDia: tx.buitDia,
      buitAgenda: tx.buitAgenda,
    };
  }
  const periode = nomDelMes(cursor, locale);
  if (vista === 'agenda') {
    return {
      periode,
      regio: tx.regioAgenda(periode),
      buit: tx.buitAgenda,
      buitDia: tx.buitDia,
      buitAgenda: tx.buitAgenda,
    };
  }
  return {
    periode,
    regio: tx.regioMes(periode),
    buit: tx.buitMes,
    buitDia: tx.buitDia,
    buitAgenda: tx.buitAgenda,
  };
}

export const capitalitzaPeriode = (periode) => (
  periode ? periode.charAt(0).toUpperCase() + periode.slice(1) : ''
);

export const textSenseDataCalendari = (senseData, idioma = 'ca') => (
  textosCalendariPoble(idioma).senseData(senseData)
);
