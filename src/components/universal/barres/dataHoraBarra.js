/**
 * dataHoraBarra.js — la data de la barra taronja en EDICIÓ, sense React.
 *
 * T51 (decisió del Mestre, 260928) · Cap document existix sense data. La
 * pastilla de la barra taronja no queda mai buida ni diu guionets:
 *   · LECTURA → la data de creació, o la de l'última modificació (o versió)
 *     si és posterior. La pinta cada pàgina (editorial.js · dataHoraDeBarra).
 *   · EDICIÓ  → la data de publicació que la persona ha triat expressament al
 *     calendari (T40, publishDate), si n'hi ha; si no, la data i l'hora
 *     d'ara. MAI la data de l'última edició del document: obrir una nota
 *     vella no la fa passar per una nota d'aquell dia.
 *
 * Ací viu la meitat d'EDICIÓ. El format no: el dia i l'ISO són els
 * d'editorial.js i l'hora la de utils/calendari.js (horaDe), els mateixos de
 * la lectura i del calendari de la barra (SelectorDataHora). El contracte de
 * DateTimeControl ({ time, date, dateTime, onClick }) no canvia: estes
 * funcions n'alimenten els tres primers camps.
 */
import { horaDe } from '../../../utils/calendari.js';
import { dataDeDocument, diaCurt, diaIso } from '../editorial.js';

/** Què és la reserva quan és la d'ara (nom accessible de SelectorDataHora). */
export const ETIQUETA_RESERVA_ARA = 'la data i l’hora d’ara';

/**
 * La data i l'hora d'un instant per a la pastilla. `dateTime` és la data i
 * l'hora locals («2026-09-28T10:07»): un valor vàlid per a l'atribut de
 * <time>, i no un text de pantalla.
 */
export function dataHoraAra(ara = new Date()) {
  const time = horaDe(ara);
  return { time, date: diaCurt(ara), dateTime: `${diaIso(ara)}T${time}` };
}

/**
 * La pastilla d'un document en EDICIÓ. `publicat` és la data de publicació
 * triada al calendari de T40 (publishDate: ISO o Date).
 *
 *   · Amb una tria que és una data de veres, eixa tria, en hora local.
 *     SelectorDataHora la desa sempre amb el dia I l'hora (combinaDataHora):
 *     el calendari de T40 guarda l'hora, i per això mai no cal completar-la.
 *   · Una tria de dia sol («2026-10-05») no pot vindre d'eixe calendari: es
 *     mostra el dia triat i cap hora. Afegir-hi l'hora d'ara faria passar per
 *     triada una hora que ningú no ha triat (inventada).
 *   · Sense tria (o amb una que no és data), la data i l'hora d'ara; `esAra`
 *     ho diu perquè el nom accessible no l'anomene «data triada».
 *
 * Els camps de l'última edició (formattedTime / formattedDate) no hi entren:
 * qui encara els passe ({ time, date }) rep la d'ara, que és la regla.
 */
export function dataHoraEdicio(fonts, ara = new Date()) {
  const triada = dataDeDocument({ publicat: fonts?.publicat });
  if (!triada) return { ...dataHoraAra(ara), esAra: true };
  if (!triada.ambHora) {
    return { time: '', date: diaCurt(triada.instant), dateTime: diaIso(triada.instant), esAra: false };
  }
  return { ...dataHoraAra(triada.instant), esAra: false };
}
