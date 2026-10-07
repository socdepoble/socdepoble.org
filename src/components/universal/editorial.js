/**
 * editorial.js — peces compartides de la capçalera editorial de les pàgines
 * universals: H1 i H2 sense punt final, data i hora, copyright i píndoles.
 *
 * Poliment editorial 260925. Abans cada secció duia la seua còpia de
 * formatDate/formatTime (TextSection i Wiki, amb eixides diferents per a una
 * data invàlida) i el copyright només vivia a TextSection.
 *
 * Funcions pures: cap React, cap DOM, cap accés a PAGE_COPY.
 */
import { dosDigits, horaDe } from '../../utils/calendari.js';

/** Copyright de les pàgines de sistema. El mateix text que pintava TextSection. */
export const COPYRIGHT_SDP = 'CC BY-NC-SA 4.0 Sóc de Poble / Fet per la IAIA i Nano Banana';

/**
 * Lleva els espais finals i UN punt final. Els punts suspensius («...» i «…»)
 * es conserven: són part del text, no la puntuació que el tanca. Si no rep
 * text (un node de React, null, un número…), el torna tal qual.
 *
 * Sense lookbehind (Baseline Safari 16.0): «el caràcter d'abans no és un
 * punt» es diu amb `[^.]` dins del grup capturat.
 */
export function llevaPuntFinal(text) {
  if (typeof text !== 'string') return text;
  const net = text.replace(/\s+$/, '');
  const trobat = /^([\s\S]*[^.])\.$/.exec(net);
  return trobat ? trobat[1].replace(/\s+$/, '') : net;
}

/* ══ Data i hora de la barra taronja (T51) ═══════════════════════════════
   Format únic de tota l'aplicació (ca-ES): dia «dd/mm/aa» i hora «hh:mm» de
   24 hores, amb el calendari i el rellotge de qui mira. Es compon amb les
   xifres, no amb toLocale*: el resultat no depén de la versió d'ICU de cada
   navegador del Baseline.

   Una sola implementació: l'hora i les dos xifres són les de
   utils/calendari.js (horaDe i dosDigits, les mateixes del calendari de T40)
   i el dia es compon ací. La meitat d'EDICIÓ (barres/dataHoraBarra.js)
   importa estes peces: no en porta cap còpia. */

/** «dd/mm/aa» amb el calendari local. */
export const diaCurt = (d) => `${dosDigits(d.getDate())}/${dosDigits(d.getMonth() + 1)}/${String(d.getFullYear()).slice(-2)}`;
/** «AAAA-MM-DD» amb el calendari local. */
export const diaIso = (d) => `${d.getFullYear()}-${dosDigits(d.getMonth() + 1)}-${dosDigits(d.getDate())}`;

/**
 * ISO 8601 local amb el desplaçament horari («2026-09-25T15:12:23+02:00»).
 * El dia del text és el mateix que es pinta: el filtre del Mur (el dia, abans
 * de la «T») no salta de dia a la vora de la mitjanit com passava amb
 * toISOString(), que ho passa tot a UTC.
 */
function isoLocal(d) {
  const desplacament = -d.getTimezoneOffset();
  const signe = desplacament < 0 ? '-' : '+';
  const minuts = Math.abs(desplacament);
  return `${diaIso(d)}T${horaDe(d)}:${dosDigits(d.getSeconds())}${signe}${dosDigits(Math.floor(minuts / 60))}:${dosDigits(minuts % 60)}`;
}

const DIA_ISO = /^(\d{4})-(\d{2})-(\d{2})$/;
const DIA_CURT = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/;
/* Postgres i PostgREST envien fins a sis decimals de segon i «+00» com a
   zona; Safari 16 no llig cap de les dues coses. Es compon amb les xifres. */
const MOMENT_ISO = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:[.,](\d+))?)?(Z|[+-]\d{2}(?::?\d{2})?)?$/i;
const ZONA = /^([+-])(\d{2}):?(\d{2})?$/;

/** El dia existix al calendari: Chrome llig «2026-02-30» com el 2 de març i
    Safari la rebutja; així tots els navegadors diuen el mateix. */
function diaExistix(any, mes, dia) {
  const calendari = new Date(Date.UTC(any, mes - 1, dia));
  return calendari.getUTCFullYear() === any && calendari.getUTCMonth() === mes - 1 && calendari.getUTCDate() === dia;
}

/**
 * Una data REAL o null. Accepta un Date vàlid, «AAAA-MM-DD», «dd/mm/aa(aa)» i
 * «AAAA-MM-DD[T ]hh:mm[:ss[.fff…]][Z|±hh[:mm]]». Qualsevol altra cosa (buit,
 * «260921», «demà», «2026-02-30», un número, una llista) no és cap data.
 * Una data sense hora («AAAA-MM-DD», «dd/mm/aa») es queda sense hora
 * (`ambHora: false`) i és el dia LOCAL: l'hora no s'inventa, ni tampoc les
 * «02:00» que en faria `new Date('AAAA-MM-DD')`, que la llig com la mitjanit
 * UTC. Un ISO amb hora i zona sí que és un instant, també a la mitjanit UTC
 * (T4 del prompt 1140, vegeu davall).
 */
function llegixData(valor) {
  if (valor instanceof Date) {
    return Number.isNaN(valor.getTime()) ? null : { instant: new Date(valor.getTime()), ambHora: true };
  }
  if (typeof valor !== 'string') return null;
  const text = valor.trim();
  const dia = DIA_ISO.exec(text);
  if (dia) {
    const [any, mes, d] = dia.slice(1).map(Number);
    return diaExistix(any, mes, d) ? { instant: new Date(any, mes - 1, d), ambHora: false } : null;
  }
  const curt = DIA_CURT.exec(text);
  if (curt) {
    const [d, mes] = curt.slice(1, 3).map(Number);
    const any = curt[3].length === 2 ? 2000 + Number(curt[3]) : Number(curt[3]);
    return diaExistix(any, mes, d) ? { instant: new Date(any, mes - 1, d), ambHora: false } : null;
  }
  const moment = MOMENT_ISO.exec(text);
  if (!moment) return null;
  const [any, mes, d, hores, minuts, segons] = moment.slice(1, 7).map((x) => Number(x ?? 0));
  const milisegons = Number(`${moment[7] || ''}000`.slice(0, 3));
  if (!diaExistix(any, mes, d) || hores > 23 || minuts > 59 || segons > 59) return null;
  const zona = moment[8];
  if (!zona) return { instant: new Date(any, mes - 1, d, hores, minuts, segons, milisegons), ambHora: true };
  const utc = Date.UTC(any, mes - 1, d, hores, minuts, segons, milisegons);
  if (zona.toUpperCase() === 'Z') return { instant: new Date(utc), ambHora: true };
  const [, signe, zh, zm = '00'] = ZONA.exec(zona);
  if (Number(zh) > 23 || Number(zm) > 59) return null;
  const desplacament = (Number(zh) * 60 + Number(zm)) * (signe === '-' ? -1 : 1);
  return { instant: new Date(utc - desplacament * 60000), ambHora: true };
}

/*
 * Ordre del Mestre, 261001 (T4 del prompt 1140, «la pastilla legal») · La
 * pastilla és completa, data i hora, a totes les targetes i pàgines. Una font
 * que porta un INSTANT (un ISO amb hora i zona) es pinta amb l'hora i el dia
 * locals, també quan és la mitjanit UTC exacta: «2026-08-11T00:00:00.000Z»,
 * la forma del copy de les pàgines (PAGE_COPY, legalContent), es pinta a
 * València «02:00 11/08/26». Abans (D5) eixa forma, com a data de creació,
 * es llegia com un dia sol i la pastilla quedava sense hora; es retira. Només
 * una font que és literalment un dia («AAAA-MM-DD», «dd/mm/aa») continua
 * sense hora (Pedra Seca §10): l'hora no s'inventa. L'hora real de cada
 * pàgina és un deute de DADES del copy, no d'esta funció.
 */

/** El primer candidat que és una data real (un valor sol, o una llista). */
const primeraData = (valor) => (Array.isArray(valor)
  ? valor.reduce((trobada, candidat) => trobada || llegixData(candidat), null)
  : llegixData(valor));

/**
 * T51 · REGLA DEL MESTRE (ordre del 28-09-2026), vinculant:
 *
 *   «Cap document existeix sense data.» En mode LECTURA la pastilla de la
 *   barra taronja mostra la data de creació del document, o la de l'última
 *   modificació o versió si s'ha modificat: la més recent de les dues. Mai
 *   buida, mai guionets, mai inventada. (En mode EDICIÓ, la data i l'hora
 *   d'ara, o la de publicació triada al calendari: això ho fa
 *   barres/dataHoraBarra.js · dataHoraEdicio, no esta funció.)
 *
 * Substituïx la doctrina d'abans («sense data no es pinta cap píndola»): ara
 * cada pàgina de lectura ha de passar la seua data real d'origen, i una
 * pàgina sense cap font és un deute de DADES, no de pantalla. Esta funció no
 * en fabrica cap: sense cap font real torna null.
 *
 *   · `creat`     la data de creació (created_at, date del frontmatter…); un
 *                 instant és un instant, també la mitjanit UTC (T4, 261001);
 *   · `publicat`  la data que l'autor ha triat al calendari (T40, publish_date):
 *                 si n'hi ha, fa de data d'origen en lloc de la de creació;
 *   · `modificat` l'última modificació o versió (updated_at, generat…).
 *
 * Cada camp pot ser una llista de candidats (de més a menys fiable): hi
 * compta el primer que siga una data real.
 *
 * Torna `{ instant, ambHora, font }` (`font`: quina de les tres ha guanyat) o
 * null. Guanya `modificat` només si és posterior a l'origen.
 */
export function dataDeDocument({ creat, modificat, publicat } = {}) {
  const dePublicacio = primeraData(publicat);
  const deCreacio = dePublicacio ? null : primeraData(creat);
  const origen = dePublicacio ? { ...dePublicacio, font: 'publicat' } : deCreacio && { ...deCreacio, font: 'creat' };
  const canvi = primeraData(modificat);
  if (canvi && (!origen || canvi.instant.getTime() > origen.instant.getTime())) return { ...canvi, font: 'modificat' };
  return origen || null;
}

/**
 * La pastilla de data de la barra taronja (i de la boina de les targetes):
 * `{ time: 'hh:mm', date: 'dd/mm/aa', dateTime }` a partir de les mateixes
 * fonts que dataDeDocument (vegeu-hi la regla del Mestre). `dateTime` és ISO
 * 8601 de veres per a <time datetime> i per al filtre del Mur: local amb el
 * desplaçament si hi ha hora, «AAAA-MM-DD» si només hi ha el dia (i llavors
 * `time` és buit: l'hora no s'inventa). Sense cap font real, els tres buits:
 * DateTimeControl no pinta res i la prova de contracte ho detecta.
 */
export function dataHoraDeBarra(fonts) {
  const data = dataDeDocument(fonts);
  if (!data) return { time: '', date: '', dateTime: '' };
  return {
    time: data.ambHora ? horaDe(data.instant) : '',
    date: diaCurt(data.instant),
    dateTime: data.ambHora ? isoLocal(data.instant) : diaIso(data.instant)
  };
}

/* ══ La pastilla en LECTURA porta al Calendari (ordre del Mestre, 261001) ══
   Tasca 4, «la Boina Taronja»: la pastilla de la barra taronja de les
   pàgines i la de la boina de les targetes és clicable i porta al calendari
   global. Abans duien al filtre del Mur, i cada peça en duia la seua còpia
   del càlcul del dia (UniversalCard i UniversalPage); la de la pàgina
   passava tota data que no fóra «dd/mm/aa» per toISOString(), que salta de
   dia a la vora de la mitjanit. Ara hi ha un sol lector (llegixData) i una
   sola ruta.

   Ordre del Mestre, 261001 (carril A) · La pastilla no porta al DIA sinó al
   MES en què es va publicar la targeta (/calendari?mes=AAAA-MM), «per tal
   que es mostren totes les cards publicades en eixe mateix període»: davall
   del calendari ixen totes les del mes. Abans, /calendari?date=AAAA-MM-DD, i
   la llista quedava filtrada a un sol dia. El mes és el LOCAL de la data que
   pinta la pastilla: una targeta de les 00:10 de l'1 d'octubre (hora de
   València) és d'octubre, encara que en UTC siga el 30 de setembre.
   L'enganxall de React (el clic amb el router) és a
   barres/pastillaCalendari.js; ací, les peces pures. */

/** La ruta del Calendari global. La mateixa de config/sections.js (id
    'calendari'): ací no s'importa per no arrossegar la configuració de
    seccions dins d'un mòdul pur; la prova de la pastilla comprova que
    coincidixen. */
export const RUTA_CALENDARI = '/calendari';

/** Què fa el clic de la pastilla en lectura: el nom accessible ho diu. */
export const ACCIO_PASTILLA_CALENDARI = 'Obri el calendari d’eixe mes';

/* Un mes «AAAA-MM»: la regla del ?mes= de /calendari, la mateixa del ?date=
   (agendaMur.js · cursorDeClau, calendari-5): quatre xifres d'any a partir
   del 1000 (Date llig «0026» com el 1926) i un mes del 01 al 12. La pàgina el
   llig amb calendariGlobal.js · cursorDeMes; la prova de la pastilla
   comprova que les dues diuen el mateix de cada valor. */
const MES_ISO = /^(\d{4})-(\d{2})$/;
function esMesIso(valor) {
  const parts = typeof valor === 'string' ? MES_ISO.exec(valor) : null;
  return Boolean(parts) && Number(parts[1]) >= 1000 && Number(parts[2]) >= 1 && Number(parts[2]) <= 12;
}

/**
 * El mes local («AAAA-MM») que pinta una pastilla `{ dateTime, date }`, amb
 * el lector únic de la barra (llegixData): primer el `dateTime` (ISO), i si
 * no n'hi ha, el dia de pantalla («dd/mm/aa»). Un instant amb zona («…Z»,
 * «…+02:00») es passa al dia local, el mateix que pinta dataHoraDeBarra. Una
 * font de només dia també té mes. null si cap dels dos és una data real: no
 * se n'inventa cap.
 */
export function mesDeLaPastilla({ dateTime, date } = {}) {
  const data = llegixData(dateTime) || llegixData(date);
  return data ? `${data.instant.getFullYear()}-${dosDigits(data.instant.getMonth() + 1)}` : null;
}

/** La ruta del Calendari en eixe mes; sense un mes «AAAA-MM» vàlid, el
    Calendari tal qual (que s'obri en el seu mes d'obertura). */
export function rutaCalendariDelMes(mes) {
  return esMesIso(mes) ? `${RUTA_CALENDARI}?mes=${encodeURIComponent(mes)}` : RUTA_CALENDARI;
}

/**
 * El nom accessible de la pastilla que porta al Calendari: el que es llig i
 * on porta. WCAG 2.5.3 (el nom conté el text visible, en el mateix ordre):
 * la pastilla pinta primer l'hora i després el dia (DateTimeControl), i el
 * nom també. «19:22 30/09/26 · Obri el calendari d’eixe mes». Una pastilla de
 * només dia no diu cap hora.
 */
export function etiquetaPastillaCalendari({ time, date } = {}) {
  const quan = [time, date].filter((valor) => typeof valor === 'string' && valor.trim()).join(' ');
  return quan ? `${quan} · ${ACCIO_PASTILLA_CALENDARI}` : ACCIO_PASTILLA_CALENDARI;
}

/**
 * La pastilla d'una fila del servidor tal com arriba (profiles,
 * list_my_organizations, section_submissions…): `created_at` és la creació i
 * `updated_at` l'última modificació (el mode seed les posa a localPerfils.js,
 * com el `default now()` del servidor). Sense cap de les dues, no hi ha data.
 */
export function dataDeFila(fila) {
  return dataHoraDeBarra({ creat: fila?.created_at, modificat: fila?.updated_at });
}

/**
 * Dia «dd/mm/aa» i hora «hh:mm» d'una data de CREACIÓ, amb el mateix lector
 * i la mateixa regla que la pastilla (dataHoraDeBarra): una data que no és
 * data no dona res, un dia sol no porta hora. Cap codi de producció no les
 * fa servir ja; les conserven les proves de pàgines que comparen amb el copy
 * (WikiDePobleSection.test.jsx). Quan migren a dataHoraDeBarra, es retiren.
 */
export const formatDate = (valor) => dataHoraDeBarra({ creat: valor }).date;
export const formatTime = (valor) => dataHoraDeBarra({ creat: valor }).time;

/**
 * T51 · La pastilla de data d'un element de secció (Mur, Mercat, agenda,
 * Pobles, Multimèdia), amb el format únic i la regla del Mestre (la de
 * creació, o la de l'última modificació si és posterior). L'origen és, per
 * ordre: el dia (i l'hora) propis de l'element, com els d'un acte de
 * l'agenda; la data triada al calendari (T40, publish_date, la mateixa que la
 * targeta del Mur); i, si no, la de creació, que el servidor conserva.
 * `updated_at` és la d'edició de la publicació (section_submissions, que
 * supabase/content.js ja demana), però només quan és una edició de veres
 * (vegeu MARGE_INSERCIO_MS). La fan servir el detall de la ruta
 * (detail/elementDeSeccio.js), el lector de connexions, les publicacions del
 * MAS (notes/PublicacioDetall.jsx) i les targetes del Mur.
 */
export function dataDElement(item) {
  return dataHoraDeBarra(fontsDElement(item));
}

/**
 * L'instant (ms) de la mateixa data que pinta dataDElement, per a ORDENAR
 * (el Mur, de més nova a més vella): la llista i la pastilla no poden dir
 * dues dates diferents. null si l'element no porta cap data real: no se
 * n'inventa cap per a ordenar-lo.
 */
export function momentDElement(item) {
  const data = dataDeDocument(fontsDElement(item));
  return data ? data.instant.getTime() : null;
}

/* Les fonts d'un element de secció, una sola vegada per a la pastilla i per
   a l'ordre. */
function fontsDElement(item) {
  return {
    publicat: [diaAmbHora(item?.date, item?.time), item?.publish_date],
    creat: item?.created_at,
    modificat: esEdicioReal(item?.created_at, item?.updated_at) ? item?.updated_at : null
  };
}

/**
 * W3A D1 · Marge perquè l'`updated_at` d'una fila compte com a MODIFICACIÓ.
 *
 * A section_submissions, `updated_at` naix a la inserció amb el `default
 * now()` del servidor (migració 2609261200; el trigger només actua `before
 * update`), mentre que `created_at` el posa el client (supabase/content.js).
 * Una publicació que ningú no ha editat porta, doncs, un `updated_at` uns
 * mil·lisegons posterior a `created_at`, i la regla de la més recent el
 * prendria per una edició: la pastilla diria l'hora d'inserció en lloc de la
 * data triada al calendari (T40) o del dia de l'acte.
 *
 * Una edició de veres arriba, com a mínim, uns segons després de publicar.
 * Per això un `updated_at` només compta si supera `created_at` en MÉS d'un
 * minut. Límit conegut: si el rellotge del client va més d'un minut endarrere
 * del servidor, una publicació sense editar comptaria com a editada. La
 * solució de fons és al servidor (trigger `before insert` que faça
 * `updated_at := created_at` i esmena de les files antigues): decisió pendent.
 */
export const MARGE_INSERCIO_MS = 60 * 1000;

/** L'`updated_at` és una edició posterior a la inserció (no el `now()` del
    mateix moment)? Sense creació llegible, qualsevol `updated_at` real compta. */
function esEdicioReal(creat, modificat) {
  const canvi = llegixData(modificat);
  if (!canvi) return false;
  const creacio = primeraData(creat);
  return !creacio || canvi.instant.getTime() - creacio.instant.getTime() > MARGE_INSERCIO_MS;
}

const HORA_SOLTA = /^(\d{1,2})[:.h](\d{2})\s*h?$/i;

/**
 * Un dia («AAAA-MM-DD») i una hora solta («18:30», «9.05», «18:30h») en un
 * sol moment local «AAAA-MM-DDThh:mm». L'hora d'un acte de l'agenda viu en un
 * camp a banda del dia. Si l'hora no és una hora, torna el dia tal qual.
 */
export function diaAmbHora(dia, hora) {
  if (typeof dia !== 'string' || !DIA_ISO.test(dia.trim())) return dia;
  const parts = typeof hora === 'string' ? HORA_SOLTA.exec(hora.trim()) : null;
  if (!parts || Number(parts[1]) > 23 || Number(parts[2]) > 59) return dia.trim();
  return `${dia.trim()}T${dosDigits(parts[1])}:${parts[2]}`;
}

const SEGELL_DE_NOM = /^(\d{2})(\d{2})(\d{2})(?:_(\d{2})(\d{2}))?(?=_|$)/;

/**
 * La data que porta el nom d'un document segons la taxonomia (AGENTS §2):
 * «aammdd_hhmm_categoria_titol» → «20aa-mm-ddThh:mm» (hora local), o només
 * el dia si el nom no porta l'hora. null si el nom no comença per un segell
 * que existisca al calendari («00_index», «ADR-2026-08…»).
 */
export function dataDelNom(nom) {
  const parts = typeof nom === 'string' ? SEGELL_DE_NOM.exec(nom) : null;
  if (!parts) return null;
  const dia = `20${parts[1]}-${parts[2]}-${parts[3]}`;
  const valor = parts[4] ? `${dia}T${parts[4]}:${parts[5]}` : dia;
  return llegixData(valor) ? valor : null;
}

/**
 * Píndoles sense buits ni duplicats (sdp-universal-page §4): dues píndoles
 * amb el mateix text, encara que canvie la caixa, en són una. Guanya la
 * primera, que és la de més rang (carpeta → categoria → etiqueta).
 */
export function pindolesUniques(labels) {
  const vistes = new Set();
  return (Array.isArray(labels) ? labels : []).filter((label) => {
    const text = typeof label === 'string' ? label : label?.text;
    if (typeof text !== 'string' || !text.trim()) return false;
    const clau = text.trim().toLocaleLowerCase('ca');
    if (vistes.has(clau)) return false;
    vistes.add(clau);
    return true;
  });
}
