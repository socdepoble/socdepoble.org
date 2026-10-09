/**
 * calendariGlobal.js — de totes les targetes del poble al calendari, pur.
 *
 * Ordre del Mestre, 261001 · La pàgina /calendari mostra i endolla
 * ABSOLUTAMENT TOTES les targetes que existixen: les publicacions, els actes i
 * els productes del Mur i del Mercat, i les pàgines del sistema que el Mur hi
 * barreja. Cada targeta va al dia de la seua data, amb UNA sola regla per al
 * calendari, per al filtre ?date= i per a l'ordre, la mateixa del Mur:
 *   · un acte del model (acteAEsdeveniment) va els dies que ocorre, i sempre
 *     el dia de la seua pastilla (acteOcorreElDia);
 *   · la resta, el dia de la seua pastilla (dataDElement): la data de
 *     publicació, o la de l'última edició de veres si és posterior. Amb hora,
 *     un esdeveniment amb hora; amb el dia sol, un de tot el dia.
 * Una targeta sense cap data real no va a cap dia: no se n'inventa cap.
 *
 * Model B · Els actes de l'agenda de Sollutia (capacitat 'agenda') arriben
 * com a ActeDTO ({ id, titol, inici, fi?, lloc?, descripcio? }) i passen pel
 * MATEIX model d'esdeveniment (acteDeLAgendaAEsdeveniment): el calendari no
 * sap d'on venen.
 *
 * Cada entrada és { clau, item, agenda, acte, esdeveniment, dia, moment }:
 *   item          la targeta tal com la pinta el Mur (null per a l'agenda);
 *   agenda        l'ActeDTO de Sollutia (null per a les targetes);
 *   acte          el model de l'acte, si ho és (el pinta ocorreElDia);
 *   esdeveniment  el que es pinta al calendari (el de l'acte o el de la
 *                 pastilla), o null si la targeta no es pot situar: no porta
 *                 cap data real o no té identificador;
 *   dia           'AAAA-MM-DD' de la pastilla d'una targeta que no és acte,
 *                 només si té esdeveniment: la llista i la graella diuen
 *                 sempre el mateix;
 *   moment        l'instant (ms) per a ordenar, el que pinta la pastilla.
 *
 * Ordre del Mestre, 261001 (carril A) · El mes que es veu a /calendari el
 * governa la URL (estatCalendari.js · estatDeLaUrl): ?date=, ?mes= (on porta
 * la pastilla de les targetes) o, sense cap dels dos, el mes d'obertura
 * (mesDObertura). Ací en viuen les peces: cursorDeMes, clauDeMes i diaDeLaClau.
 */
import { dataDElement } from '../../components/universal/editorial.js';
import { esRutaInterna, getSectionItemPath, tipusDeSeccio } from '../../config/navigation.js';
import { cursorDe, dosDigits } from '../../utils/calendari.js';
import { clauDia, creaEsdeveniment, llegixDataHora } from '../../utils/esdeveniment.js';
import { clauDeData, sumaDies } from '../../utils/periodes.js';
import { acteAEsdeveniment, acteOcorreElDia, cursorDeClau, momentDe } from '../mur/agendaMur.js';
import { momentDeLaTargeta, perMomentDescendent } from '../mur/targetesMur.js';

const DIA = /^\d{4}-\d{2}-\d{2}$/;
/* El títol de la píndola d'una targeta que no en porta: el que fa el mateix
   Google Calendar (deGoogleCalendar). La targeta es pinta tal com és. */
const SENSE_TITOL = '(sense títol)';

const esProducte = (item) => item?.type === 'market' || item?.type === 'product';

/** La secció d'una targeta: la mateixa que decidix el seu enllaç (TargetaDelMur · mainHref). */
export function seccioDeLaTargeta(item) {
  if (item?.type === 'event') return 'events';
  if (esProducte(item)) return 'mercat';
  if (item?.type === 'poble') return 'pobles';
  return 'mur';
}

/** On porta la targeta: la ruta d'una pàgina del sistema o la de l'element. */
export function rutaDeLaTargeta(item) {
  return item?.mainHref || getSectionItemPath(seccioDeLaTargeta(item), item?.id);
}

/**
 * Onada 6 (prompt 261009_0230, punt 1; pla de l'Onada 5, tasca 16) · On porta
 * un esdeveniment de la graella: la pàgina de la seua publicació, la mateixa
 * on porta la seua targeta (TargetaDelMur i EventCard: un mainHref de l'app o
 * el detall de la seua secció), o null. Una entrada sense targeta (l'agenda de
 * Sollutia, les fonts de Google) o sense esdeveniment no en té cap: no té
 * pàgina a Sóc de Poble. Tota ruta passa per esRutaInterna: un mainHref de
 * fora (un payload escrit per PostgREST) no navega la pestanya de l'amfitrió.
 */
export function rutaDeLEntrada(entrada) {
  const item = entrada?.esdeveniment ? entrada.item : null;
  if (!item || typeof item !== 'object') return null;
  if (esRutaInterna(item.mainHref)) return item.mainHref;
  const ruta = getSectionItemPath(seccioDeLaTargeta(item), item.id);
  return esRutaInterna(ruta) ? ruta : null;
}

/** El tipus de la targeta, el de l'objecte connectable (publicacio, producte, esdeveniment, poble; pagina, el sistema). */
export function tipusDeLaTargeta(item) {
  return item?.isSystem ? 'pagina' : tipusDeSeccio(seccioDeLaTargeta(item));
}

/* L'esdeveniment de la pastilla d'una targeta (el seu dateTime de
   dataDElement: local amb el desplaçament si porta hora, el dia sol si no). */
function esdevenimentDeLaPastilla(item, dateTime) {
  if (!dateTime) return null;
  return creaEsdeveniment({
    id: item.id,
    titol: item.title || item.name || SENSE_TITOL,
    inici: DIA.test(dateTime) ? { data: dateTime } : { dataHora: dateTime },
    font: { tipus: tipusDeLaTargeta(item), id: item.id, ruta: rutaDeLaTargeta(item) }
  });
}

/**
 * Una targeta que no és cap acte del model, com a esdeveniment del calendari
 * el dia de la seua pastilla, amb el tipus i la ruta de l'element; o null si
 * no porta cap data real (o cap id).
 */
export function targetaAEsdeveniment(item) {
  if (!item || typeof item !== 'object') return null;
  return esdevenimentDeLaPastilla(item, dataDElement(item).dateTime);
}

/**
 * L'entrada del calendari d'una targeta del Mur o del Mercat.
 *
 * Revisió del carril A (ordre del Mestre, 261001) · El `dia` depén de
 * l'esdeveniment: una targeta amb data però sense id (creaEsdeveniment torna
 * null) eixia a la llista de davall i no a la graella. Ara, sense
 * esdeveniment, cap dia: no ix a cap de les dues, i la pàgina ho diu.
 */
export function entradaDeLaTargeta(item) {
  const acte = item?.type === 'event' ? acteAEsdeveniment(item) : null;
  const dateTime = acte ? '' : dataDElement(item).dateTime;
  const esdeveniment = acte ?? esdevenimentDeLaPastilla(item, dateTime);
  return Object.freeze({
    clau: `${item?.type}-${item?.id}`,
    item,
    agenda: null,
    acte,
    esdeveniment,
    dia: !acte && esdeveniment ? dateTime.slice(0, 10) : null,
    moment: momentDeLaTargeta(item, acte)
  });
}

/**
 * Totes les targetes de les llistes donades (actes, publicacions, productes,
 * pàgines del sistema…), com a entrades del calendari, de la més nova a la
 * més vella (perMomentDescendent, l'ordre del Mur).
 */
export function entradesDelCalendari(...llistes) {
  return llistes.flatMap((llista) => llista ?? []).filter(Boolean).map(entradaDeLaTargeta).sort(perMomentDescendent);
}

/**
 * Un acte de l'agenda de Sollutia (ActeDTO, traduït i congelat pel backend)
 * com a esdeveniment del model, o null si alguna peça no hi passa.
 */
export function acteDeLAgendaAEsdeveniment(acte) {
  if (!acte || typeof acte !== 'object') return null;
  return creaEsdeveniment({
    id: acte.id,
    titol: acte.titol,
    descripcio: acte.descripcio ?? null,
    lloc: acte.lloc ?? null,
    inici: momentDe(acte.inici),
    fi: acte.fi == null || acte.fi === '' ? null : (momentDe(acte.fi) ?? acte.fi),
    font: { tipus: 'agenda', id: acte.id, ruta: null }
  });
}

/* L'instant (ms) en què comença un esdeveniment, el mateix que porta la clau
   de la seua ocurrència a les vistes (esdeveniment.js · ocurrencia,
   `${uid}@${inici}`): la mitjanit local d'un acte de tot el dia; l'instant de
   la seua hora, si no. */
const iniciEnMs = (esdeveniment) => (esdeveniment.totElDia
  ? diaDeLaClau(esdeveniment.inici.data)?.getTime()
  : llegixDataHora(esdeveniment.inici.dataHora)?.instant) ?? null;

/**
 * L'entrada del calendari d'un acte de l'agenda de Sollutia, o null.
 *
 * Correcció de la revisió adversarial (prompt 261001_1140) · L'ActeDTO no
 * porta recurrència: un acte que es repetix arriba expandit, una instància
 * per dia, i les instàncies poden compartir id. La clau és la de l'ocurrència
 * (l'id i l'inici), com a les vistes: dos actes amb el mateix id i inicis
 * diferents són dues entrades; només el mateix id i el mateix inici és la
 * mateixa clau.
 */
export function entradaDeLAgenda(acte) {
  const esdeveniment = acteDeLAgendaAEsdeveniment(acte);
  if (!esdeveniment) return null;
  return Object.freeze({
    clau: `agenda-${esdeveniment.id}@${iniciEnMs(esdeveniment)}`,
    item: null,
    agenda: acte,
    acte: esdeveniment,
    esdeveniment,
    dia: null,
    moment: momentDeLaTargeta(null, esdeveniment)
  });
}

/**
 * L'entrada ocorre el dia d'una clau 'AAAA-MM-DD'? La regla del filtre ?date=
 * del Mur: un acte, els dies que el pinta el calendari i el de la seua
 * pastilla; la resta, el dia de la seua pastilla. Una clau que no existix
 * (el 30 de febrer) no en troba cap.
 */
export function entradaOcorreElDia(entrada, clau) {
  if (entrada?.acte) return acteOcorreElDia(entrada.item, clau, entrada.acte) === true;
  return Boolean(entrada?.dia) && entrada.dia === clau;
}

/** Les entrades d'un dia, en l'ordre en què arriben. */
export function entradesDelDia(entrades, clau) {
  return (entrades ?? []).filter((entrada) => entradaOcorreElDia(entrada, clau));
}

/**
 * Les entrades que ocorren algun dia d'un mes ({ any, mes }, de 0 a 11), en
 * l'ordre en què arriben: les targetes, pel dia de la seua pastilla; els
 * actes, cada dia que ocorren (i el de la seua pastilla).
 */
export function entradesDelMes(entrades, { any, mes }) {
  const dies = new Date(any, mes + 1, 0).getDate();
  const prefix = `${any}-${dosDigits(mes + 1)}-`;
  return (entrades ?? []).filter((entrada) => {
    if (!entrada?.acte) return Boolean(entrada?.dia) && entrada.dia.startsWith(prefix);
    for (let dia = 1; dia <= dies; dia++) {
      if (acteOcorreElDia(entrada.item, clauDia(any, mes, dia), entrada.acte)) return true;
    }
    return false;
  });
}

/**
 * T10 (ordre del Mestre, 261001) · Les entrades que ocorren algun dia del rang
 * de claus [desde, fins) ('AAAA-MM-DD', fins exclusiu): la llista de davall
 * de la vista Setmana. La mateixa regla que entradesDelMes (una targeta, el
 * dia de la seua pastilla; un acte, cada dia que ocorre i el de la seua
 * pastilla), en l'ordre en què arriben. Un rang amb una clau que no existix
 * no en troba cap.
 */
export function entradesDelRang(entrades, { desde, fins } = {}) {
  const primer = diaDeLaClau(desde);
  if (!primer || !diaDeLaClau(fins)) return [];
  const claus = [];
  for (let dia = primer; clauDeData(dia) < fins; dia = sumaDies(dia, 1)) claus.push(clauDeData(dia));
  return (entrades ?? []).filter((entrada) => {
    if (!entrada?.acte) return Boolean(entrada?.dia) && entrada.dia >= desde && entrada.dia < fins;
    return claus.some((clau) => acteOcorreElDia(entrada.item, clau, entrada.acte));
  });
}

/**
 * El Date local (mitjanit) d'una clau 'AAAA-MM-DD' que existix al calendari,
 * o null: «2026-02-30» no és el 2 de març, ni «0026-…» el 1926.
 */
export function diaDeLaClau(clau) {
  const cursor = cursorDeClau(clau);
  if (!cursor) return null;
  const dia = Number(clau.slice(8, 10));
  const data = new Date(cursor.any, cursor.mes, dia);
  return dia >= 1 && data.getMonth() === cursor.mes ? data : null;
}

/**
 * El mes on s'obri la pàgina sense ?date= ni ?mes=: el de hui si hi ha alguna targeta;
 * si no, el de la targeta més recent fins a hui (la de dalt del Mur); si totes
 * són futures, el de la més pròxima; sense cap targeta amb data, el de hui.
 * Així el calendari no s'obri mai en un mes buit havent-hi targetes.
 */
export function mesDObertura(entrades, avui = new Date()) {
  const mesDeHui = cursorDe(avui);
  const ambData = (entrades ?? []).filter((entrada) => entrada?.esdeveniment && entrada.moment !== null);
  if (!ambData.length || entradesDelMes(ambData, mesDeHui).length) return mesDeHui;
  const fiDeHui = new Date(avui.getFullYear(), avui.getMonth(), avui.getDate() + 1).getTime();
  const passades = ambData.filter((entrada) => entrada.moment < fiDeHui);
  const triada = passades.length
    ? passades.reduce((a, b) => (b.moment > a.moment ? b : a))
    : ambData.reduce((a, b) => (b.moment < a.moment ? b : a));
  return cursorDe(new Date(triada.moment));
}

const MES = /^\d{4}-\d{2}$/;

/**
 * El mes ({ any, mes }, de 0 a 11) d'una clau 'AAAA-MM' (el ?mes= de
 * /calendari, on porta la pastilla de les targetes), o null. La mateixa regla
 * que el ?date= (cursorDeClau, calendari-5): any de quatre xifres a partir del
 * 1000 i mes del 01 al 12. «2026-9», «2026-13» o «0026-01» no són cap mes.
 */
export function cursorDeMes(clau) {
  return typeof clau === 'string' && MES.test(clau) ? cursorDeClau(`${clau}-01`) : null;
}

/** La clau 'AAAA-MM' d'un mes ({ any, mes }, de 0 a 11): la que escriuen les
    fletxes i «Hui» al ?mes=. */
export const clauDeMes = ({ any, mes }) => `${any}-${dosDigits(mes + 1)}`;

/* P6 (ordre del Mestre, 261003) · Des que /calendari ja no munta el
   calendari del Mur, mesDeLaUrl i rangDelMes no tenien cap consumidor: el mes
   que es veu el llig estatCalendari.js · estatDeLaUrl, i l'agenda de Sollutia
   es demana amb rangDeLaVista. Retirats amb les seues proves. */

/** El recompte de targetes d'un dia o d'un període: el nom de cada dia a les vistes i el títol de la llista de davall. */
export const recompteTargetes = (n) => (n === 1 ? '1 publicació' : `${n} publicacions`);

/* Els textos de la pàgina /calendari que no diu cap vista: l'avís dels actes
   que es repetixen d'una manera que el calendari no sap pintar (es troben el
   dia i el mes que comencen). P6 · Ja no són els textos de CalendariMur: el
   recompte i el mes buit de la pàgina d'abans s'han retirat. */
export const TEXTOS_TARGETES = Object.freeze({
  sensePintar: (n) => (n === 1
    ? 'Un acte es repetix d’una manera que el calendari encara no sap pintar: el trobaràs a les targetes del dia i del mes que comença.'
    : `${n} actes es repetixen d’una manera que el calendari encara no sap pintar: els trobaràs a les targetes del dia i del mes que comencen.`)
});
