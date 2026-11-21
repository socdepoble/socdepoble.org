/**
 * Model pur de formatació, períodes i textos per a CalendariDelPoble (R32.24).
 */
import { sumaDies } from '../../utils/periodes.js';

export const LOCALE_CALENDARI = 'ca-ES';

export const DENSITAT_CALENDARI = 'responsiva';

export const MES_PER_PAS = Object.freeze({
  anterior: 'Mes anterior',
  hui: 'Hui',
  seguent: 'Mes següent',
});

export const ETIQUETES_PERIODE = Object.freeze({
  setmana: Object.freeze({ anterior: 'Setmana anterior', hui: 'Hui', seguent: 'Setmana següent' }),
  'dues-setmanes': Object.freeze({
    anterior: 'Dues setmanes anteriors',
    hui: 'Hui',
    seguent: 'Dues setmanes següents',
  }),
  mes: MES_PER_PAS,
  any: Object.freeze({ anterior: 'Any anterior', hui: 'Hui', seguent: 'Any següent' }),
  agenda: MES_PER_PAS,
});

export const nomDelMes = ({ any, mes }) => (
  new Date(any, mes, 1).toLocaleDateString(LOCALE_CALENDARI, { month: 'long', year: 'numeric' })
);

export const dataSenseDiaDeLaSetmana = (data) => (
  data.toLocaleDateString(LOCALE_CALENDARI, { day: 'numeric', month: 'long', year: 'numeric' })
);

export const nomDelRang = ({ desde, fins }) => (
  `${dataSenseDiaDeLaSetmana(desde)} – ${dataSenseDiaDeLaSetmana(sumaDies(fins, -1))}`
);

export const ambDe = (text) => (/^[aeiouàèéíòóú]/i.test(text) ? `d’${text}` : `de ${text}`);

export function textosDeLaVista(vista, cursor, rang) {
  if (vista === 'setmana') {
    const periode = nomDelRang(rang);
    return {
      periode,
      regio: `Calendari de la setmana del ${periode}`,
      buit: 'Cap publicació esta setmana.',
    };
  }
  if (vista === 'dues-setmanes') {
    const periode = nomDelRang(rang);
    return {
      periode,
      regio: `Calendari de les dues setmanes del ${periode}`,
      buit: 'Cap publicació estes dues setmanes.',
    };
  }
  if (vista === 'any') {
    const periode = String(cursor.any);
    return {
      periode,
      regio: `Calendari de l’any ${periode}`,
      buit: 'Cap publicació este any.',
    };
  }
  const periode = nomDelMes(cursor);
  if (vista === 'agenda') {
    return {
      periode,
      regio: `Agenda ${ambDe(periode)}`,
      buit: 'Cap publicació en este període.',
    };
  }
  return {
    periode,
    regio: `Calendari ${ambDe(periode)}`,
    buit: 'Cap publicació este mes.',
  };
}

export const capitalitzaPeriode = (periode) => (
  periode.charAt(0).toUpperCase() + periode.slice(1)
);

export const textSenseDataCalendari = (senseData) => (
  senseData === 1
    ? 'Una publicació no es pot situar al calendari perquè no porta cap data o no té identificador: la trobaràs al Mur.'
    : `${senseData} publicacions no es poden situar al calendari perquè no porten cap data o no tenen identificador: les trobaràs al Mur.`
);
