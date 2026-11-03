/**
 * carpetaAmbit.js — O4-CLAUDE-1 (ordre del Mestre, captura 261102_2121) · La
 * correspondència entre l'àmbit de la fitxa d'una nota i la seua carpeta del
 * Bloc, en els dos sentits i sense bucles:
 *
 *   · àmbit → carpeta: en triar un àmbit de forma explícita (el bloc «On es
 *     publica?» o l'entrada ?ambit= del Bloc), la carpeta de la secció on
 *     viurà la publicació (CARPETA_PER_SECCIO[SECTION_ID_PER_AMBIT[àmbit]]):
 *     el Mercat, a la del Mercat; Mur, Compartir cotxe, Treball i Habitatge,
 *     a la del Mur;
 *   · carpeta → àmbit: només dos casos. Moure la nota a la carpeta del Mercat
 *     li posa l'àmbit Mercat, i traure-la'n cap a la del Mur amb l'àmbit
 *     Mercat la torna al Mur. Cap altre moviment toca la fitxa.
 *
 * Universal: cap importació de seccions. El mapa de carpetes per secció el
 * passa qui crida (el Bloc, masDeLUsuari.js · CARPETA_PER_SECCIO). JS pur.
 */
import { AMBITS, SECTION_ID_PER_AMBIT } from '../../../utils/publicacioUniversal.js';

const esMapa = (valor) => valor !== null && typeof valor === 'object';

/** La carpeta on viu una fitxa de l'àmbit (p. ex. 'mercat' → 'f-mercat'), o null. */
export function carpetaDeLAmbit(ambit, carpetaPerSeccio) {
  if (!AMBITS.includes(ambit) || !esMapa(carpetaPerSeccio)) return null;
  const seccio = SECTION_ID_PER_AMBIT[ambit];
  return Object.hasOwn(carpetaPerSeccio, seccio) ? String(carpetaPerSeccio[seccio]) : null;
}

/**
 * L'àmbit que porta un canvi de carpeta ('mercat' o 'mur'), o null quan el
 * canvi no toca la fitxa.
 * @param {object} canvi
 * @param {string} canvi.ambitActual       L'àmbit de la nota ('mur' sense fitxa).
 * @param {string} canvi.abans             La carpeta d'on ix.
 * @param {string} canvi.despres           La carpeta on va.
 * @param {object} canvi.carpetaPerSeccio  { mur: 'f-mur', mercat: 'f-mercat', … }
 */
export function ambitPerCanviDeCarpeta({ ambitActual, abans, despres, carpetaPerSeccio } = {}) {
  const delMercat = carpetaDeLAmbit('mercat', carpetaPerSeccio);
  const delMur = carpetaDeLAmbit('mur', carpetaPerSeccio);
  if (!delMercat || abans === despres) return null;
  if (despres === delMercat) return ambitActual === 'mercat' ? null : 'mercat';
  if (abans === delMercat && despres === delMur && ambitActual === 'mercat') return 'mur';
  return null;
}
