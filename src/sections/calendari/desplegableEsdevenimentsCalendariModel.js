/**
 * Model pur per a DesplegableEsdevenimentsCalendari (R32.24).
 */
import { diaDeLaClau } from './calendariGlobal.js';

export function textNet(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

const LOCALES_DESPLEGABLE = Object.freeze({
  ca: 'ca-ES',
  es: 'es-ES',
  en: 'en-GB',
  eu: 'eu-ES',
  gl: 'gl-ES',
});

export function localeCalendariDe(language = 'ca') {
  const codi = String(language || 'ca').trim().toLowerCase().split(/[-_]/)[0];
  return Object.hasOwn(LOCALES_DESPLEGABLE, codi) ? LOCALES_DESPLEGABLE[codi] : 'ca-ES';
}

export function formataDataCurtaIso(clau, locale) {
  const data = diaDeLaClau(clau);
  if (!data) return clau;
  try {
    return data.toLocaleDateString(locale || 'ca-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return clau;
  }
}

export function resumDataEntrada(entrada, locale) {
  const item = entrada?.item;
  const poble = textNet(item?.location) || textNet(item?.town_name) || textNet(entrada?.acte?.lloc);
  const etiqueta = textNet(item?.date_label) || textNet(item?.calendar_badge?.label);
  if (etiqueta) {
    if (poble && !etiqueta.toLowerCase().includes(poble.toLowerCase())) return `${etiqueta} · ${poble}`;
    return etiqueta;
  }
  const iniciCru = textNet(entrada?.acte?.inici?.data)
    || textNet(entrada?.acte?.inici?.dataHora)?.slice(0, 10)
    || textNet(item?.date);
  const inici = /^\d{4}-\d{2}-\d{2}$/.test(iniciCru) ? formataDataCurtaIso(iniciCru, locale) : iniciCru;
  if (inici && poble) return `${inici} · ${poble}`;
  return inici || poble;
}

export function mesDeLEntrada(entrada) {
  const inici = textNet(entrada?.acte?.inici?.data)
    || textNet(entrada?.acte?.inici?.dataHora)?.slice(0, 10)
    || textNet(entrada?.item?.inici)
    || textNet(entrada?.item?.date);
  return /^\d{4}-\d{2}/.test(inici) ? inici.slice(0, 7) : null;
}
