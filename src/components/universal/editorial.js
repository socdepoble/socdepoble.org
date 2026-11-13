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
export { COPYRIGHT_SDP } from '../../sections/text/pageContent.dretsPatrimoni.js';

/** Onada 5 (261008) · Copyright d'un poble (Viquipèdia i Wikimedia Commons,
 * CC BY-SA). Viu al costat de COPYRIGHT_SDP (Onada R22 · BOOT3): origenImatges.js
 * és a l'arrencada i el demana; d'ací arrossegava tot este mòdul. */
export { COPYRIGHT_VIQUIPEDIA } from '../../sections/text/pageContent.dretsPatrimoni.js';

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
 * Onada 6 (prompt 261009_0230, punt 1; pla de l'Onada 5, tasca 16) · On porta
 * l'etiqueta «Agenda» d'un acte: el Calendari en la vista Mes amb eixe dia
 * triat (?date=), que en mostra les targetes davall. És una clau «AAAA-MM-DD»
 * que existix al calendari, amb la regla del ?date= (agendaMur.js ·
 * cursorDeClau, calendari-5: any de quatre xifres a partir del 1000; el 30 de
 * febrer no és el 2 de març). Sense una clau vàlida, el Calendari tal qual.
 * La pastilla de data no la fa servir: continua portant al MES (ordre del
 * Mestre, 261001, carril A).
 */
export function rutaCalendariDeLaData(clau) {
  const parts = typeof clau === 'string' ? DIA_ISO.exec(clau) : null;
  const [any, mes, dia] = parts ? parts.slice(1).map(Number) : [];
  const existix = Boolean(parts) && any >= 1000 && mes >= 1 && mes <= 12 && dia >= 1 && dia <= new Date(any, mes, 0).getDate();
  return existix ? `${RUTA_CALENDARI}?vista=mes&date=${clau}` : RUTA_CALENDARI;
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
 * Pobles, Multimèdia), amb el format únic. L'origen és, per ordre: el dia (i
 * l'hora) propis de l'element, com els d'un acte de l'agenda; la data triada
 * al calendari (T40, publish_date); i, si no, la de creació, que el servidor
 * conserva. La fan servir el detall de la ruta (detail/elementDeSeccio.js),
 * el lector de connexions, les publicacions del MAS
 * (notes/PublicacioDetall.jsx) i les targetes del Mur.
 * R51 (P0-49 / IDEA-180; SPEC §2: «Mostrar el mateix instant editorial a
 * card i detall») · Derogada per a un element de secció la part de T51 que
 * hi posava la d'edició (`updated_at`, més d'un minut després de crear: el
 * marge W3A D1): és auditoria, no data editorial. La pastilla diu el mateix
 * instant pel qual el Mur ordena (mur/targetesMur.js · momentEditorial), i
 * editar una peça no li canvia la data. Les files sense secció (perfils,
 * entitats: dataDeFila) continuen amb la regla de la més recent.
 */
export function dataDElement(item) {
  return dataHoraDeBarra(fontsDElement(item));
}

/* R21 (regressio_ui_xat-09, honestedat_textos-06) · Els marcadors honestos, en les cinc llengües.
   Qui té el traductor de la interfície passa `t` (claus editorial.* dels cinc diccionaris); una app
   (Model B) no pot llegir UIContext i passa `idioma` (useClosaAplicacio().idioma, R16-F). Esta taula
   ha de dir el mateix que els diccionaris: ho guarda editorial.encapcalament.test.jsx. */
export const MARCADORS_NO_INDICATS = Object.freeze({
  ca: Object.freeze({ author: 'Autoria no indicada', location: 'Poble no indicat', date: 'Data no indicada' }),
  es: Object.freeze({ author: 'Autoría no indicada', location: 'Pueblo no indicado', date: 'Fecha no indicada' }),
  en: Object.freeze({ author: 'Author not stated', location: 'Town not stated', date: 'Date not stated' }),
  eu: Object.freeze({ author: 'Egilea adierazi gabe', location: 'Herria adierazi gabe', date: 'Data adierazi gabe' }),
  gl: Object.freeze({ author: 'Autoría non indicada', location: 'Pobo non indicado', date: 'Data non indicada' })
});

/** Complete reading header without inventing authorship, locality or dates.
 * A year or an unknown date is visible, but has no datetime/calendar action.
 * `t` (the interface translator) wins; without it, `idioma` picks the marker; otherwise Valencian.
 */
export function encapcalamentDeTargeta(item, { author, location, t, idioma } = {}) {
  const text = value => typeof value === 'string' && value.trim() ? value.trim().slice(0, 500) : '';
  const pobleReal = value => {
    const net = text(value);
    return /^sóc\s+de\s+poble$/iu.test(net) ? '' : net;
  };
  const marcadors = MARCADORS_NO_INDICATS[typeof idioma === 'string' && Object.hasOwn(MARCADORS_NO_INDICATS, idioma) ? idioma : 'ca'];
  const label = (key, fallback) => {
    const translated = typeof t === 'function' ? t(key) : null;
    return text(translated) && translated !== key ? text(translated) : fallback;
  };
  const autoria = text(author) || text(item?.author_name) || text(item?.author?.name) || text(item?.author?.nom) || text(item?.author);
  const poble = pobleReal(location) || pobleReal(item?.town_name) || pobleReal(item?.townName) || pobleReal(item?.poble?.nom) || pobleReal(item?.poble);
  const actual = dataDElement(item);
  const year = [item?.year, item?.any, item?.date, item?.publish_date, item?.created_at]
    .find(value => typeof value === 'string' ? /^[1-9][0-9]{3}$/.test(value.trim()) : Number.isInteger(value) && value >= 1000 && value <= 9999);
  return {
    author: autoria || label('editorial.autoriaNoIndicada', marcadors.author),
    location: poble || label('editorial.pobleNoIndicat', marcadors.location),
    time: actual.time,
    date: actual.date || (year === undefined ? label('editorial.dataNoIndicada', marcadors.date) : `${year}`.trim()),
    dateTime: actual.dateTime || null
  };
}

/**
 * L'instant (ms) de la mateixa data que pinta dataDElement. Ja no ordena el
 * Mur (R51: mur/targetesMur.js · momentEditorial); l'ordena /pobles, amb la
 * creació sola. null si l'element no porta cap data real: no se n'inventa cap.
 */
export function momentDElement(item) {
  const data = dataDeDocument(fontsDElement(item));
  return data ? data.instant.getTime() : null;
}

/* Les fonts d'un element de secció, una sola vegada per a la pastilla i per
   a l'ordre de /pobles. R51 · Sense `modificat`. */
function fontsDElement(item) {
  return {
    // En actes amb la simetria editorial activada, date/time és la celebració;
    // publish_date/created_at són l'única font de la barra taronja.
    publicat: item?.boinaDataPublicacio === true
      ? item?.publish_date
      : [diaAmbHora(item?.date, item?.time), item?.publish_date],
    creat: item?.created_at
  };
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

/* seguretat-01 (261104) i AH-20 (IDEA-77, 261105) · El text d'una peça de
   `calendar_badge`: una cadena, tal qual; un número finit, el seu text; una
   peça buida (0, ''), cap; qualsevol altra cosa (objecte, llista, booleà), cap.
   Compartida entre EventCard i elementDeSeccio perquè la UniversalPage d'un
   acte pinte la mateixa insígnia quadrada que la targeta sense arrossegar el
   barril de Pedra Seca. */
const pecaDeLaInsignia = (valor) => (valor && (typeof valor === 'string' || Number.isFinite(valor)) ? String(valor) : '');

export function insigniaDeCalendari(esdeveniment, dateTime, item = null) {
  if (!esdeveniment && !item?.calendar_badge) return null;
  const iniciClau = (esdeveniment?.inici?.data || esdeveniment?.inici?.dataHora || dateTime || '').slice(0, 10);
  if (item?.calendar_badge && typeof item.calendar_badge === 'object') {
    const cb = item.calendar_badge;
    const label = pecaDeLaInsignia(cb.label);
    return {
      dia: pecaDeLaInsignia(cb.dia),
      mes: pecaDeLaInsignia(cb.mes),
      any: pecaDeLaInsignia(cb.any) || iniciClau.slice(0, 4),
      dateTime: pecaDeLaInsignia(cb.dateTime) || iniciClau,
      ...(label ? { label } : {})
    };
  }
  if (!esdeveniment || !dateTime) return null;
  const clau = item?.boinaDataPublicacio ? iniciClau : dateTime.slice(0, 10);
  const [any, mes, dia] = clau.split('-').map(Number);
  return {
    dia: String(dia),
    mes: new Date(any, mes - 1, dia).toLocaleDateString('ca-ES', { month: 'long' }).toUpperCase(),
    any: String(any),
    dateTime: clau
  };
}
