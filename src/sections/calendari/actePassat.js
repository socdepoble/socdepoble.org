/* P0-ANDROID-PUSH (v1.2.16) · B10b i B10c (decisió del Mestre D-12, ordre de les 01:55 del
   21-11-2026: «Calendari mai en un mes passat ni "Assistiré" en actes passats") · Un acte que ja
   s'ha fet no pregunta «Assistiràs?», ni al detall (/events/<id>) ni al desplegable de /calendari.

   Gauntlet R1 de la v1.2.16 (L2-01, L2-02 i L2-04) · «Ja s'ha fet» és una afirmació, i no es fa
   amb l'interval de l'avís de solapament (intervalRsvpDe, rsvpEsdeveniments.js, del carril de
   Codex R32.25): eixe interval dona una hora a l'acte que no declara fi (la fi d'exportació de
   fiEfectiva, que Google exigix) i llig l'hora de paret amb el fus de qui mira. Ací l'hora es llig
   en la zona de l'acte (instantEnLaZona; Europe/Madrid per defecte) i un acte sense fi no s'acaba
   abans que el seu dia. Només l'importen trossos diferits (el detall de l'acte i el desplegable del
   calendari): 0 B a l'arrencada de WordPress. */
import { acteAEsdeveniment } from '../mur/agendaMur.js';
import {
  ZONA_PER_DEFECTE, clauDia, fiEfectiva, instantEnLaZona, ocurrenciesEnRang, recurrenciaSuportada, xifresEnZona
} from '../../utils/esdeveniment.js';

const DIA_MS = 86400000;
const HORA_MS = 3600000;
/* El sostre de COUNT del model (utils/esdeveniment.js, LIMIT_DIES_COUNT): cent anys des de
   l'inici. Més enllà, el calendari el pinta sense fi. */
const DIES_COUNT = 36525;
/* Fins a quantes ocurrències es compten des de l'inici per a veure si un COUNT s'ha esgotat. */
const MAX_COUNT_COMPTAT = 1000;
const DIA = /^(\d{4})-(\d{2})-(\d{2})/;

/* Els dies van per número (des de l'1-1-1970, amb Date.UTC): aritmètica de calendari, sense fus. */
function numDeClau(text) {
  const p = typeof text === 'string' ? DIA.exec(text) : null;
  return p ? Date.UTC(Number(p[1]), Number(p[2]) - 1, Number(p[3])) / DIA_MS : null;
}

function clauDeNum(n) {
  const d = new Date(n * DIA_MS);
  return clauDia(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/* El dia de paret d'un instant en una zona, o null. */
function diaEnLaZona(ms, zona) {
  const x = xifresEnZona(ms, zona);
  return x ? Date.UTC(x.any, x.mes, x.dia) / DIA_MS : null;
}

/* La mitjanit (ms) amb què comença el dia n en una zona, o null. */
const mitjanitEnLaZona = (n, zona) => instantEnLaZona({ dataHora: `${clauDeNum(n)}T00:00`, zona });

/* La mitjanit LOCAL del dia n: la unitat de dies del motor de repeticions (ocurrenciesEnRang). Per a
   una hora de paret, el dia del motor és el que porta escrit l'acte, el de la seua zona. */
function mitjanitLocal(n) {
  const d = new Date(n * DIA_MS);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()).getTime();
}

/* Un acte de tot el dia no porta zona: és la del poble. */
const zonaDe = (acte) => acte.inici.zona ?? ZONA_PER_DEFECTE;

/**
 * L'instant (ms) en què s'acaba un acte que no es repetix, o null:
 *   · de tot el dia, la mitjanit que obri l'endemà del seu últim dia (la fi és exclusiva);
 *   · amb una fi declarada posterior a l'inici, eixa fi;
 *   · amb hora i sense fi (o de durada zero), la mitjanit que tanca el dia que comença: l'acte pot
 *     durar tota la vesprada. Si comença a última hora, mai abans de l'hora que li dona fiEfectiva
 *     (23:30 → 00:30).
 */
function fiDeLActe(acte) {
  const zona = zonaDe(acte);
  if (acte.totElDia) {
    const n = numDeClau(fiEfectiva(acte).data);
    return n === null ? null : mitjanitEnLaZona(n, zona);
  }
  const inici = instantEnLaZona(acte.inici);
  if (inici === null) return null;
  const fi = acte.fi ? instantEnLaZona(acte.fi) : null;
  if (fi !== null && fi > inici) return fi;
  const dia = diaEnLaZona(inici, zona);
  const mitjanit = dia === null ? null : mitjanitEnLaZona(dia + 1, zona);
  const unaHora = instantEnLaZona(fiEfectiva({ ...acte, fi: null }));
  return Math.max(mitjanit ?? inici, unaHora ?? inici);
}

/* Els dies de més que pot cobrir una ocurrència, amb marge: on pot arribar l'última. */
function diesQueCobrix(acte) {
  if (acte.totElDia) return numDeClau(fiEfectiva(acte).data) - numDeClau(acte.inici.data);
  const [inici, fi] = [instantEnLaZona(acte.inici), instantEnLaZona(fiEfectiva(acte))];
  return inici === null || fi === null ? 1 : Math.ceil((fi - inici) / DIA_MS) + 1;
}

/* Diverses ocurrències per dia (BYHOUR, BYMINUTE o una xarxa de passos): l'última del dia pot
   començar a última hora, encara que l'acte comence de matí. */
const VARIES_PER_DIA = /(?:^RRULE:|;)(?:BYHOUR=|BYMINUTE=|FREQ=(?:HOURLY|MINUTELY|SECONDLY)(?:;|$))/i;

/**
 * Gauntlet R2 de la v1.2.16 (L2R2-04) · La gràcia de fiDeLActe a cada ocurrència d'un acte amb
 * hora i sense fi (o de durada zero): el que passa de la mitjanit que tanca el seu dia l'hora que
 * li dona fiEfectiva, en ms (23:30 → 30 minuts; abans de les 23:00, 0). Amb diverses ocurrències
 * per dia, tota l'hora: mai no s'amaga abans d'hora.
 */
function graciaDeLaNit(acte, regla, zona) {
  if (acte.totElDia) return 0;
  const inici = instantEnLaZona(acte.inici);
  const fi = acte.fi ? instantEnLaZona(acte.fi) : null;
  if (inici === null || (fi !== null && fi > inici)) return 0;
  if (VARIES_PER_DIA.test(regla)) return HORA_MS;
  const x = xifresEnZona(inici, zona);
  return x ? Math.max(0, ((x.hora * 60 + x.minut) * 60 + x.segon) * 1000 + HORA_MS - DIA_MS) : 0;
}

/* Gauntlet R2 de la v1.2.16 (L2R2-02) · El motor (ocurrenciesEnRang) fa l'hora de paret de cada
   ocurrència amb el fus de qui mira i la compara amb l'instant de l'UNTIL (utils/esdeveniment.js,
   iniciaElDia). Només en fa bé el tall si, a l'instant de l'UNTIL, el fus de qui mira i la zona de
   l'acte marquen la mateixa hora. */
function motorALaZona(ms, zona) {
  const x = xifresEnZona(ms, zona);
  const l = new Date(ms);
  return x !== null && Date.UTC(x.any, x.mes, x.dia, x.hora, x.minut, x.segon)
    === Date.UTC(l.getFullYear(), l.getMonth(), l.getDate(), l.getHours(), l.getMinutes(), l.getSeconds());
}

/**
 * Un acte que es repetix s'ha acabat si la regla té fi (UNTIL o COUNT) i cap ocurrència no toca hui
 * ni cap dia posterior. Hui és el dia de la zona de l'acte, mogut enrere la gràcia de la nit
 * (graciaDeLaNit): l'ocurrència de les 23:30 dura fins a les 00:30, com un acte sense repetició.
 * Sense UNTIL ni COUNT no s'acaba mai. Amb un UNTIL ja passat i només RRULE i EXDATE, tampoc no cal
 * pintar la regla: cap ocurrència no comença després de l'UNTIL, i passat el seu dia (en la zona de
 * l'acte) i el que dura l'acte, s'ha fet. Una RDATE o una EXRULE, que el calendari no sap pintar,
 * no passa per la drecera: una RDATE afig dates que l'UNTIL no limita (RFC 5545). La resta, només
 * si el calendari sap pintar la regla (recurrenciaSuportada) i, amb un UNTIL en UTC, si el motor en
 * fa bé el tall (motorALaZona). Una regla que no sap pintar, o un tall que no sap fer, no s'amaga.
 */
function repeticioAcabada(acte, instant) {
  const regles = acte.recurrencia.filter((linia) => /^RRULE:/i.test(linia));
  const regla = regles.length === 1 ? regles[0] : '';
  const until = /(?:^RRULE:|;)UNTIL=(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?/i.exec(regla);
  const count = /(?:^RRULE:|;)COUNT=(\d{1,6})(?:;|$)/i.exec(regla);
  if (!until && !count) return false;
  const zona = zonaDe(acte);
  const hui = diaEnLaZona(instant - graciaDeLaNit(acte, regla, zona), zona);
  if (hui === null) return false;
  const marge = diesQueCobrix(acte) + 1;
  // Un UNTIL en UTC sobre un acte amb hora és un instant: el seu dia és el de la zona de l'acte.
  const instantUntil = until?.[7] && !acte.totElDia
    ? Date.UTC(Number(until[1]), Number(until[2]) - 1, Number(until[3]), Number(until[4]), Number(until[5]), Number(until[6]))
    : null;
  let diaUntil = null;
  if (instantUntil !== null) diaUntil = diaEnLaZona(instantUntil, zona);
  else if (until) diaUntil = Date.UTC(Number(until[1]), Number(until[2]) - 1, Number(until[3])) / DIA_MS;
  const nomesReglaIExdate = acte.recurrencia.every((linia) => /^(?:RRULE:|EXDATE[;:])/i.test(linia));
  if (diaUntil !== null && nomesReglaIExdate && hui > diaUntil + marge) return true;
  if (!recurrenciaSuportada(acte)) return false;
  // El motor no fa bé el tall (qui mira és en un altre fus: a Canàries o a Lisboa, l'última
  // ocurrència «ja s'havia fet» abans de començar): mana la drecera, i encara no ha passat.
  if (instantUntil !== null && !motorALaZona(instantUntil, zona)) return false;
  const diaInici = numDeClau(acte.totElDia ? acte.inici.data : acte.inici.dataHora);
  if (count && Number(count[1]) <= MAX_COUNT_COMPTAT) {
    // COUNT ocurrències com a molt: si totes s'han acabat abans de hui, la regla s'ha esgotat. Una
    // EXDATE no descompta COUNT (RFC 5545) i en deixa menys de visibles: llavors es busca.
    const { ocurrencies } = ocurrenciesEnRang(acte, mitjanitLocal(diaInici), mitjanitLocal(hui), { maxOcurrencies: Number(count[1]) });
    if (ocurrencies.length >= Number(count[1]) && ocurrencies.every((o) => numDeClau(o.diaFi) <= hui)) return true;
  }
  const fins = (diaUntil ?? diaInici + DIES_COUNT) + marge + 1;
  // maxOcurrencies 0: s'atura en la primera ocurrència que toca hui o un dia posterior.
  return !ocurrenciesEnRang(acte, mitjanitLocal(hui), mitjanitLocal(fins), { maxOcurrencies: 0 }).retallat;
}

/**
 * Cert si l'acte ja s'ha acabat a `ara` (ms o Date): la seua fi (fiDeLActe) no és posterior a
 * `ara`, o, si es repetix, la regla s'ha esgotat (repeticioAcabada). Rep un element del Mur o una
 * entrada del calendari (calendariGlobal.js). Fals si no és cap acte del model (una publicació no
 * «passa»), sense data real o cancel·lat. Amb un `ara` que no és cap instant, fals: un rellotge
 * trencat no amaga mai res.
 */
export function esActePassat(entradaOItem, ara = Date.now()) {
  if (!entradaOItem || typeof entradaOItem !== 'object') return false;
  const esEntrada = 'esdeveniment' in entradaOItem || 'acte' in entradaOItem || 'item' in entradaOItem;
  const item = esEntrada ? entradaOItem.item : entradaOItem;
  const acte = (esEntrada ? entradaOItem.acte : null) ?? acteAEsdeveniment(item);
  if (!acte || acte.estat === 'cancellat') return false;
  const instant = ara instanceof Date ? ara.getTime() : ara;
  if (!Number.isFinite(instant)) return false;
  if (acte.recurrencia) return repeticioAcabada(acte, instant);
  const fi = fiDeLActe(acte);
  return fi !== null && fi <= instant;
}
