/**
 * estatCalendari.js — l'estat de /calendari llegit de la URL i escrit a la
 * URL, pur (sense React).
 *
 * T10 (ordre del Mestre, 261001) · Les vistes a l'estil Google Calendar
 * (VistaSetmana, VistaMes, VistaAny, VistaAgenda), triades amb un ?vista= de
 * la llista VISTES.
 *
 * Ordre del Mestre, 261003 (P6 de l'onada de producció) · A gentdelatorre.net
 * el Mestre va vore a /calendari el calendari d'abans (CalendariMur), «massa
 * bàsic»: les vistes noves només s'obrien amb un ?vista= que cap enllaç de
 * l'app escriu. Ara, sense ?vista= o amb qualsevol valor que no és cap vista,
 * la pàgina obri la vista Mes (VISTA_PER_DEFECTE): el clon de Google Calendar.
 * Les URL d'abans (?mes=, ?date=) es lligen igual que amb ?vista=mes.
 *
 * Fase visual (prompt 261001_0445) · Cinc vistes: Setmana, Dues setmanes,
 * Mes, Any i Agenda. Dues setmanes és la mateixa anatomia del mes amb dos
 * files des d'un dilluns; l'Agenda és la llista del mes (des de hui si és el
 * mes en curs); l'Any, dotze mesos xicotets, i clicar-ne un dia obri la
 * setmana d'eixe dia (obriDia).
 *
 * PARÀMETRES
 *   ?vista=   'setmana' | 'dues-setmanes' | 'mes' | 'any' | 'agenda'; sense,
 *             o amb un altre valor, 'mes'.
 *   ?date=    el dia triat ('AAAA-MM-DD'), el mateix del Mur i de la llista de
 *             davall. En les vistes noves, només si el dia existix.
 *   ?setmana= la setmana ISO ('AAAA-Www'): Setmana i Dues setmanes (la
 *             primera de les dues).
 *   ?mes=     el mes ('AAAA-MM'): Mes i Agenda; on porta la pastilla.
 *   ?any=     l'any ('AAAA', a partir del 1000): Any.
 * Precedència de l'àncora: ?date= vàlid (a Dues setmanes, si cau dins de les
 * dues setmanes del ?setmana=, mana el ?setmana=: triar un dia de la segona
 * fila no mou la graella; a Mes, si cau dins de la graella del ?mes=, amb els
 * dies dels mesos veïns, mana el ?mes=); després el paràmetre de la vista;
 * després ?mes= vàlid; i si no, el mes d'obertura (mesDObertura).
 *
 * L'ESTAT és { vista, diaTriat, cursor, dilluns }: el mes ({ any, mes }) i el
 * dilluns (Date, mitjanit local) del període que es veu. A l'Any, el cursor
 * porta l'any i el mes per on s'eixirà cap a una vista de mes (el de hui si
 * és l'any en curs; si no, gener). Per a les URL que escrivia l'app d'abans
 * de P6 (un ?mes= sol, un ?date= sol, o tots dos amb un ?date= que no cau a
 * la graella del ?mes=), el cursor de la vista Mes és el mes que obrien (la
 * prova de compatibilitat ho fixa). Un ?date= d'un mes veí que es veu a la
 * graella del ?mes= (?date=2026-09-28&mes=2026-10) és nou: la graella no es
 * mou. En moure's, la URL escriu ?vista=mes.
 */
import { cursorDe, mouMes } from '../../utils/calendari.js';
import { clauSetmanaIso, dillunsDe, dillunsDeClauSetmana, mouSetmana, rangDeLaGraella, sumaDies } from '../../utils/periodes.js';
import { clauDeMes, cursorDeMes, diaDeLaClau } from './calendariGlobal.js';
import { llegixDataHora } from '../../utils/esdeveniment.js';

export const VISTES = Object.freeze(['setmana', 'dues-setmanes', 'mes', 'any', 'agenda']);
/* Ordre del Mestre, 261003 (P6) · La vista de /calendari sense un ?vista= de la llista. */
export const VISTA_PER_DEFECTE = 'mes';
const PASSOS = Object.freeze({ anterior: -1, seguent: 1 });
/* Quantes setmanes pinta cada vista de setmanes. */
const SETMANES = Object.freeze({ setmana: 1, 'dues-setmanes': 2 });
/* Les files del mes: només les setmanes que toquen el mes (VistaMes). La
   pàgina les passa a la vista i demana l'agenda d'eixe mateix rang. */
export const SETMANES_DEL_MES = 'justes';
const ANY = /^\d{4}$/;

/** La vista d'un ?vista= de la llista, o null per a qualsevol altre valor (la pàgina hi posa VISTA_PER_DEFECTE). */
export const vistaDeLaUrl = (valor) => (VISTES.includes(valor) ? valor : null);

const esDeSetmanes = (vista) => Object.hasOwn(SETMANES, vista ?? '');
const diesDeLaVista = (vista) => 7 * (SETMANES[vista] ?? 1);
const delMes = (data, { any, mes }) => data.getFullYear() === any && data.getMonth() === mes;
/* La setmana que s'obri dins d'un mes: la de hui si hui és del mes; si no, la de l'1. */
const dillunsDelMes = (cursor, avui) => dillunsDe(delMes(avui, cursor) ? avui : new Date(cursor.any, cursor.mes, 1));
/* El mes d'una setmana, el del seu dijous (la regla ISO 8601). */
const mesDeLaSetmana = (dilluns) => cursorDe(sumaDies(dilluns, 3));
/* Hui cau dins del període de setmanes que es veu? */
const huiEsDelPeriode = (estat, avui) => avui >= estat.dilluns && avui < sumaDies(estat.dilluns, diesDeLaVista(estat.vista));
/* El mes que comença dins del període de setmanes (el dia 1 hi cau), o null. */
function mesQueComencaAlPeriode({ vista, dilluns }) {
  for (let i = 0; i < diesDeLaVista(vista); i += 1) {
    const dia = sumaDies(dilluns, i);
    if (dia.getDate() === 1) return cursorDe(dia);
  }
  return null;
}
/* El dia es veu a la graella de la vista Mes d'eixe cursor (amb els veïns)? */
function esDeLaGraellaDelMes(dia, cursor) {
  const { desde, fins } = rangDeLaGraella(cursor, { setmanes: SETMANES_DEL_MES });
  return dia >= desde && dia < fins;
}

/** L'any d'un ?any= ('AAAA', la mateixa regla que les claus de mes: a partir del 1000), o null. */
export function anyDeLaUrl(valor) {
  return typeof valor === 'string' && ANY.test(valor) && cursorDeMes(`${valor}-01`) ? Number(valor) : null;
}

/* El cursor de la vista Any: l'any i, per a eixir-ne cap a una vista de mes,
   el mes de hui si és l'any en curs o gener si no. */
const cursorDeLAny = (any, avui) => ({ any, mes: avui.getFullYear() === any ? avui.getMonth() : 0 });

/**
 * L'estat d'uns paràmetres de la URL ({ vista, setmana, date, mes, any }, els
 * de searchParams.get) amb el mes d'obertura i el dia de hui (Date).
 */
export function estatDeLaUrl({ vista = null, setmana = null, date = null, mes = null, any = null } = {}, { obertura = null, avui = new Date() } = {}) {
  // P6 (261003) · Sense un ?vista= de la llista, la vista Mes: el calendari d'abans ja no es munta a /calendari.
  const v = vistaDeLaUrl(vista) ?? VISTA_PER_DEFECTE;
  const dia = diaDeLaClau(date);
  const diaTriat = dia ? date : null;
  if (v === 'mes' || v === 'agenda') {
    const delParametreMes = cursorDeMes(mes);
    // Mes: un dia d'un mes veí que es veu a la graella del ?mes= no la mou.
    const queda = v === 'mes' && dia && delParametreMes && esDeLaGraellaDelMes(dia, delParametreMes);
    let cursor = delParametreMes ?? obertura ?? cursorDe(avui);
    if (dia && !queda) cursor = cursorDe(dia);
    return Object.freeze({ vista: v, diaTriat, cursor, dilluns: dia ? dillunsDe(dia) : dillunsDelMes(cursor, avui) });
  }
  if (v === 'any') {
    const delParametreAny = anyDeLaUrl(any);
    let cursor = cursorDeMes(mes) ?? obertura ?? cursorDe(avui);
    if (dia) cursor = cursorDe(dia);
    else if (delParametreAny !== null) cursor = cursorDeLAny(delParametreAny, avui);
    return Object.freeze({ vista: 'any', diaTriat, cursor, dilluns: dia ? dillunsDe(dia) : dillunsDelMes(cursor, avui) });
  }
  const delParametreMes = cursorDeMes(mes);
  const delParametreSetmana = dillunsDeClauSetmana(setmana);
  // Dues setmanes: un dia de dins del període del ?setmana= no el mou.
  const dinsDelPeriode = v === 'dues-setmanes' && dia && delParametreSetmana
    && dia >= delParametreSetmana && dia < sumaDies(delParametreSetmana, diesDeLaVista(v));
  const ancora = (dinsDelPeriode ? delParametreSetmana : null)
    ?? dia
    ?? delParametreSetmana
    ?? (delParametreMes ? new Date(delParametreMes.any, delParametreMes.mes, 1) : null)
    ?? dillunsDelMes(obertura ?? cursorDe(avui), avui);
  const dilluns = dillunsDe(ancora);
  return Object.freeze({ vista: v, diaTriat, cursor: dia ? cursorDe(dia) : mesDeLaSetmana(dilluns), dilluns });
}

/**
 * Els paràmetres que escriu un estat (setSearchParams: null esborra). Cada
 * vista porta ?vista= (també Mes, la per defecte: P6, 261003) i el seu
 * període (?setmana=, ?mes= o ?any=), o el ?date= del dia triat, que ja diu
 * el període. Dues setmanes és l'excepció: el dia no diu quina és la primera
 * setmana, i el ?setmana= hi queda sempre. A Mes, un dia d'un mes veí tampoc
 * diu quin mes es veu: el ?mes= hi queda.
 */
export function paramsDeLEstat({ vista, diaTriat, cursor, dilluns }) {
  const date = diaTriat ?? null;
  const buits = { vista: null, setmana: null, mes: null, any: null, date };
  if (vista === 'setmana') return { ...buits, vista, setmana: date ? null : clauSetmanaIso(dilluns) };
  if (vista === 'dues-setmanes') return { ...buits, vista, setmana: clauSetmanaIso(dilluns) };
  if (vista === 'any') return { ...buits, vista, any: date ? null : String(cursor.any) };
  if (vista === 'mes') {
    const dia = date ? diaDeLaClau(date) : null;
    return { ...buits, vista, mes: dia && delMes(dia, cursor) ? null : clauDeMes(cursor) };
  }
  return { ...buits, vista: vista === 'agenda' ? vista : null, mes: date ? null : clauDeMes(cursor) };
}

/**
 * El període d'abans ('anterior'), el de després ('seguent') o el de hui
 * ('hui'), sempre sense dia triat: la llista de davall no es pot quedar en un
 * dia que la graella ja no mostra (com les fletxes de CalendariSection).
 * Setmana, d'una en una; Dues setmanes, de dos en dos; Mes i Agenda, d'un mes;
 * Any, d'un any.
 */
export function navega(estat, direccio, avui = new Date()) {
  if (direccio !== 'hui' && !(direccio in PASSOS)) return estat;
  if (esDeSetmanes(estat.vista)) {
    const dilluns = direccio === 'hui' ? dillunsDe(avui) : mouSetmana(estat.dilluns, PASSOS[direccio] * SETMANES[estat.vista]);
    return Object.freeze({ ...estat, diaTriat: null, dilluns, cursor: mesDeLaSetmana(dilluns) });
  }
  let cursor;
  if (direccio === 'hui') cursor = cursorDe(avui);
  else if (estat.vista === 'any') cursor = cursorDeLAny(estat.cursor.any + PASSOS[direccio], avui);
  else cursor = mouMes(estat.cursor, PASSOS[direccio]);
  return Object.freeze({ ...estat, diaTriat: null, cursor, dilluns: dillunsDelMes(cursor, avui) });
}

/* El mes que es veu, per a passar a una vista de mes (Mes, Agenda o Any):
   d'una vista de setmanes, el de hui si hui n'és; si no, el mes que hi
   comença, i si no en comença cap, el del primer dijous. El mes que hi
   comença fa d'anada i tornada amb dillunsCapASetmanes, que obri la setmana
   de l'1: si l'1 cau en divendres, dissabte o diumenge, el dijous d'eixa
   setmana és del mes d'abans (de novembre a la setmana i de tornada a
   octubre; de l'any 2027 a l'any 2026). */
function cursorCapAMes(estat, avui) {
  if (!esDeSetmanes(estat.vista)) return estat.cursor;
  if (huiEsDelPeriode(estat, avui)) return cursorDe(avui);
  return mesQueComencaAlPeriode(estat) ?? mesDeLaSetmana(estat.dilluns);
}

/* El dilluns que es veu, per a passar a una vista de setmanes: entre Setmana
   i Dues setmanes, el mateix (de dues a una, la de hui si hui n'és); d'una
   vista de mes, la setmana de hui si hui és del mes, o la de l'1. */
function dillunsCapASetmanes(estat, avui) {
  if (!esDeSetmanes(estat.vista)) return dillunsDelMes(estat.cursor, avui);
  return estat.vista === 'dues-setmanes' && huiEsDelPeriode(estat, avui) ? dillunsDe(avui) : estat.dilluns;
}

/**
 * Passa a una altra vista conservant el dia triat. Sense dia: a una vista de
 * setmanes, la de hui si hui és del període que es veu, o la primera; a una
 * vista de mes, el de hui si hui és del període que es veu, el mes que hi
 * comença o el del dijous (ISO) de la primera setmana (cursorCapAMes).
 */
export function canviaVista(estat, vista, avui = new Date()) {
  const nova = vistaDeLaUrl(vista);
  if (!nova || nova === estat.vista) return estat;
  const dia = estat.diaTriat ? diaDeLaClau(estat.diaTriat) : null;
  const diaTriat = dia ? estat.diaTriat : null;
  if (esDeSetmanes(nova)) {
    const dilluns = dia ? dillunsDe(dia) : dillunsCapASetmanes(estat, avui);
    return Object.freeze({ vista: nova, diaTriat, cursor: dia ? cursorDe(dia) : mesDeLaSetmana(dilluns), dilluns });
  }
  const cursor = dia ? cursorDe(dia) : cursorCapAMes(estat, avui);
  return Object.freeze({ vista: nova, diaTriat, cursor, dilluns: dia ? dillunsDe(dia) : dillunsDelMes(cursor, avui) });
}

/**
 * Clicar un dia: el tria (el període el seguix) o, si ja era el triat, el
 * lleva i deixa el període que es veu. Una clau que no existix no fa res. A
 * Dues setmanes, un dia de dins del període no el mou; a Mes, tampoc un dia
 * d'un mes veí que es veu a la graella (la cel·la «1 de nov.» d'octubre): si
 * no, la graella saltaria de mes i tornar-lo a clicar no la tornaria.
 */
export function triaDia(estat, clau) {
  if (!clau || clau === estat.diaTriat) return Object.freeze({ ...estat, diaTriat: null });
  const dia = diaDeLaClau(clau);
  if (!dia) return estat;
  const queda = estat.vista === 'dues-setmanes' && dia >= estat.dilluns && dia < sumaDies(estat.dilluns, diesDeLaVista(estat.vista));
  const quedaElMes = estat.vista === 'mes' && esDeLaGraellaDelMes(dia, estat.cursor);
  return Object.freeze({ ...estat, diaTriat: clau, cursor: quedaElMes ? estat.cursor : cursorDe(dia), dilluns: queda ? estat.dilluns : dillunsDe(dia) });
}

/**
 * Obrir un dia a la vista Setmana, amb el dia triat (el que fa un dia de la
 * vista Any). Una clau que no existix no fa res.
 */
export function obriDia(estat, clau) {
  const dia = diaDeLaClau(clau);
  if (!dia) return estat;
  return Object.freeze({ vista: 'setmana', diaTriat: clau, cursor: cursorDe(dia), dilluns: dillunsDe(dia) });
}

/**
 * El rang semiobert [desde, fins) (dos Date, mitjanit local) que pinta cada
 * vista: el que es demana a l'agenda de Sollutia i, menys a Mes (que llista
 * el mes natural, com sempre), el de la llista de davall. Setmana, 7 dies;
 * Dues setmanes, 14; Mes, les setmanes que toquen el mes; Agenda, el mes, des
 * de hui si és el mes en curs (o des del dia triat, si és anterior); Any, de
 * l'1 de gener a l'1 de gener següent.
 *
 * A l'Agenda el dia triat (el que ve de Mes o de Setmana) no filtra la llista
 * de davall: l'Agenda no el marca ni el deixa llevar. Només fa que el rang el
 * continga, perquè la llista, l'Agenda i l'agenda de Sollutia que es demana
 * diguen el mateix període; i tornar a Mes el conserva.
 */
export function rangDeLaVista({ vista, diaTriat = null, cursor, dilluns }, avui = new Date()) {
  if (esDeSetmanes(vista)) return { desde: dilluns, fins: sumaDies(dilluns, diesDeLaVista(vista)) };
  if (vista === 'any') return { desde: new Date(cursor.any, 0, 1), fins: new Date(cursor.any + 1, 0, 1) };
  if (vista === 'agenda') {
    const inici = delMes(avui, cursor) ? sumaDies(avui, 0) : new Date(cursor.any, cursor.mes, 1);
    const triat = diaTriat ? diaDeLaClau(diaTriat) : null;
    const desde = triat && delMes(triat, cursor) && triat < inici ? triat : inici;
    return { desde, fins: new Date(cursor.any, cursor.mes + 1, 1) };
  }
  return rangDeLaGraella(cursor, { setmanes: SETMANES_DEL_MES });
}

/* R32.5 · La publicació i l'acte són dos fets independents. Una crònica pot
   publicar-se després de l'acte; una data absent no s'inventa a partir de
   l'altra. updated_at és auditoria, mai cap d'estes dues dates. */
function dataCalendari(valor) {
  if (valor == null) return null;
  if (typeof valor !== 'string') throw new TypeError('Data de calendari invàlida');
  const text = valor.trim();
  if (!diaDeLaClau(text) && !llegixDataHora(text)) throw new TypeError('Data de calendari invàlida');
  return text;
}

/** Dates originals, separades, del DTO editorial o del model d'acte. */
export function datesDeLEsdeveniment(item = {}) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) throw new TypeError('Esdeveniment invàlid');
  return Object.freeze({
    dataPublicacio: dataCalendari(item.dataPublicacio ?? item.publish_date ?? item.created_at),
    dataActe: dataCalendari(item.dataActe ?? item.inici?.data ?? item.inici?.dataHora ?? item.date ?? item.dades?.data_inici)
  });
}

export const RESPOSTES_RSVP = Object.freeze(['assistire', 'no-assistire', 'pendent']);

function enterRsvp(valor, nom) {
  if (!Number.isSafeInteger(valor) || valor < 0) throw new TypeError(`${nom} ha de ser un enter segur no negatiu`);
  return valor;
}

function idRsvp(valor) {
  if (typeof valor !== 'string' || !valor.length || valor.length > 200 || valor !== valor.trim()
    || /[\u0000-\u001f\u007f]/u.test(valor)) throw new TypeError('Identificador RSVP invàlid');
  return valor;
}

function respostaRsvp({ idParticipant, resposta, places = resposta === 'assistire' ? 1 : 0 } = {}) {
  idRsvp(idParticipant);
  if (!RESPOSTES_RSVP.includes(resposta)) throw new TypeError('Resposta RSVP invàlida');
  enterRsvp(places, 'Places');
  if ((resposta === 'assistire' && places === 0) || (resposta !== 'assistire' && places !== 0)) {
    throw new TypeError('Places incompatibles amb la resposta RSVP');
  }
  return Object.freeze({ idParticipant, resposta, places });
}

function ocupacioRsvp(estat) {
  if (!estat || typeof estat !== 'object' || Array.isArray(estat)) throw new TypeError('Estat RSVP invàlid');
  idRsvp(estat.idEsdeveniment);
  enterRsvp(estat.aforament, 'Aforament');
  enterRsvp(estat.revisio, 'Revisió');
  if (!Array.isArray(estat.respostes)) throw new TypeError('Respostes RSVP invàlides');
  const participants = new Set();
  let ocupades = 0n;
  for (const entrada of estat.respostes) {
    if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada)) throw new TypeError('Resposta RSVP invàlida');
    enterRsvp(entrada.places, 'Places');
    const resposta = respostaRsvp(entrada);
    if (participants.has(resposta.idParticipant)) throw new TypeError('Participant RSVP duplicat');
    participants.add(resposta.idParticipant);
    ocupades += BigInt(resposta.places);
  }
  if (ocupades > BigInt(estat.aforament)) throw new RangeError('Estat RSVP amb sobrevenda');
  return Number(ocupades);
}

/** Aforament finit obligatori: 0 tanca les places; mai significa il·limitat. */
export function creaEstatRsvp({ idEsdeveniment, aforament, respostes = [], revisio = 0 } = {}) {
  const estat = { idEsdeveniment, aforament, respostes, revisio };
  ocupacioRsvp(estat);
  return Object.freeze({
    idEsdeveniment, aforament, revisio,
    respostes: Object.freeze(respostes.map(respostaRsvp).sort((a, b) => (
      a.idParticipant < b.idParticipant ? -1 : Number(a.idParticipant > b.idParticipant)
    )))
  });
}

/** Recompte exacte: també rebutja instantànies corruptes, duplicades o amb sobrevenda. */
export function resumAforamentRsvp(estat) {
  const ocupades = ocupacioRsvp(estat);
  return Object.freeze({ aforament: estat.aforament, ocupades, disponibles: estat.aforament - ocupades, complet: ocupades === estat.aforament });
}

function resultatRsvp(estat, ok, codi) {
  return Object.freeze({ ok, codi, estat });
}

function incrementaRevisioRsvp(estat) {
  if (estat.revisio === Number.MAX_SAFE_INTEGER) throw new RangeError('Revisió RSVP esgotada');
  return estat.revisio + 1;
}

/**
 * Substituïx la resposta d'una persona: repetir-la no suma places. Cancel·lar
 * o quedar pendent les allibera. Cada canvi requerix revisioEsperada.
 *
 * És una transició pura sobre UNA instantània. El servidor ha de persistir
 * amb CAS/transacció de la revisió; dos clients sobre la mateixa instantània
 * poden produir candidats vàlids i només un pot confirmar-se remotament.
 */
export function aplicaRsvp(estat, canvi = {}) {
  const ocupades = ocupacioRsvp(estat);
  const nova = respostaRsvp(canvi);
  enterRsvp(canvi.revisioEsperada, 'Revisió esperada');
  if (canvi.revisioEsperada !== estat.revisio) return resultatRsvp(estat, false, 'revisio-divergent');
  const anterior = estat.respostes.find(resposta => resposta.idParticipant === nova.idParticipant);
  if (anterior?.resposta === nova.resposta && anterior.places === nova.places) return resultatRsvp(estat, true, 'sense-canvis');
  // Resta abans de sumar: cap producte o suma intermedi supera l'enter segur.
  if (nova.places > estat.aforament - (ocupades - (anterior?.places ?? 0))) return resultatRsvp(estat, false, 'aforament-complet');
  const respostes = estat.respostes.filter(resposta => resposta.idParticipant !== nova.idParticipant);
  return resultatRsvp(creaEstatRsvp({ ...estat, respostes: [...respostes, nova], revisio: incrementaRevisioRsvp(estat) }), true, 'actualitzat');
}

/** Una reducció de capacitat no pot expulsar silenciosament reserves confirmades. */
export function canviaAforamentRsvp(estat, { aforament, revisioEsperada } = {}) {
  const ocupades = ocupacioRsvp(estat);
  enterRsvp(aforament, 'Aforament');
  enterRsvp(revisioEsperada, 'Revisió esperada');
  if (revisioEsperada !== estat.revisio) return resultatRsvp(estat, false, 'revisio-divergent');
  if (aforament < ocupades) return resultatRsvp(estat, false, 'aforament-inferior-ocupacio');
  if (aforament === estat.aforament) return resultatRsvp(estat, true, 'sense-canvis');
  return resultatRsvp(creaEstatRsvp({ ...estat, aforament, revisio: incrementaRevisioRsvp(estat) }), true, 'actualitzat');
}
