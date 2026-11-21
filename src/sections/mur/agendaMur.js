/**
 * agendaMur.js — dels actes del Mur al model d'esdeveniment, pur.
 *
 * Ordre del Mestre, 261001 · La pestanya i la pàgina es diuen «Calendari»
 * (CalendariMur, CalendariSection). Este mòdul conserva el nom de fitxer: el
 * nomena el contracte segellat (src/data/contracte.js, SDP-LOCK) com l'única
 * funció de l'element al model, i el llegixen proves d'altres carrils.
 *
 * T6 (ordre del Mestre, 260930) · El Calendari del Mur pinta els seus actes amb
 * CalendariEsdeveniments (utils/esdeveniment.js). Un acte del Mur porta date
 * ('AAAA-MM-DD') si qui el publica n'ha triat un i, si de cas, time ('HH:MM')
 * (mapejadorSeccions.js); no porta fi, zona, uid ni recurrència. Si algun dia
 * el payload els porta (inici, fi, zona, uid, recurrencia), es lligen tal
 * qual: cap migració. created_at i updated_at són la publicació: mai el dia
 * de l'acte (T5).
 *
 * El lloc és el de l'acte (location), mai el poble de qui el publica
 * (author_location): cap dada inventada.
 *
 * Privacitat: el Calendari només rep els actes i les targetes del Mur i del
 * Mercat, mai les tasques del Mapa de la Consola (descriuen la màquina del
 * Mestre).
 */
import { diaAmbHora } from '../../components/universal/editorial.js';
import { getSectionItemPath } from '../../config/navigation.js';
import { extractPlainText } from '../../utils/contentAdapter.js';
import { cursorDe, dataIsoONull } from '../../utils/calendari.js';
import {
  clauDia, creaEsdeveniment, fiEfectiva, llegixDataHora, ocorreElDia
} from '../../utils/esdeveniment.js';

const DIA = /^(\d{4})-(\d{2})-(\d{2})$/;
/* Fins on busca el Calendari la primera ocurrència del mes d'obertura (calendari-3). */
const HORITZO_MESOS = 24;
const textNet = (valor) => (typeof valor === 'string' && valor.trim() ? valor.trim() : null);

function diaSeguent(clau) {
  const m = DIA.exec(typeof clau === 'string' ? clau.trim() : '');
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + 1));
  return clauDia(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/* Una hora de paret (sense desplaçament) és anterior a l'altra? Es comparen les
   xifres, sense cap fus: totes dues són de la mateixa zona. */
function abansALaParet(a, b) {
  const [x, y] = [llegixDataHora(a), llegixDataHora(b)];
  if (!x || !y || x.ambDesfas || y.ambDesfas) return false;
  return Date.UTC(x.any, x.mes, x.dia, x.hora, x.minut, x.segon) < Date.UTC(y.any, y.mes, y.dia, y.hora, y.minut, y.segon);
}

/** Si l'element és un acte o una publicació de l'àmbit Calendari (AH-04). */
export function esActeDelCalendari(item) {
  return Boolean(item && typeof item === 'object' && (
    item.type === 'event' || item.type === 'calendari' || item.ambit === 'calendari'
  ));
}

/* Un moment del payload: l'objecte del model tal qual, o una cadena (un dia
   'AAAA-MM-DD' o una dataHora). creaEsdeveniment el valida.
   Ordre del Mestre, 261001 · exportat: els actes de l'agenda de Sollutia
   (calendariGlobal.js) porten l'inici i la fi en la mateixa forma. */
export function momentDe(valor, zona) {
  if (valor && typeof valor === 'object') return valor;
  if (typeof valor !== 'string' || !valor.trim()) return null;
  const text = valor.trim();
  return DIA.test(text) ? { data: text } : { dataHora: text, zona };
}

/**
 * Un acte del Mur (o una fitxa d'àmbit 'calendari', AH-04) com a esdeveniment,
 * o null si no se'n pot fer cap (sense títol o sense un dia que existisca).
 * L'inici és el del payload o, si no en porta, el dia i l'hora de l'acte
 * (diaAmbHora): amb hora, un acte amb hora; sense, de tot el dia. Quan porta
 * data_fi (i hora_fi opcional), l'interval multi-dia cobreix tots els dies des
 * de data_inici fins a data_fi inclòs. Sense data_fi, una hora_fi anterior a
 * l'hora d'inici és de l'endemà: una revetla de 23:00 a 03:00 acaba a les 03:00
 * del dia següent (Gauntlet R1 de la v1.2.16, L2-01); abans es descartava i
 * l'acte quedava sense fi.
 */
export function acteAEsdeveniment(item) {
  if (!item || typeof item !== 'object') return null;
  const zona = item.zona ?? undefined;
  const dades = item.dades && typeof item.dades === 'object' ? item.dades : null;
  const dataInici = textNet(item.date) ?? textNet(dades?.data_inici);
  const horaInici = textNet(item.time) ?? textNet(dades?.hora_inici);
  const dataFi = textNet(item.endDate) ?? textNet(dades?.data_fi);
  const horaFi = textNet(item.endTime) ?? textNet(dades?.hora_fi);
  const inici = momentDe(item.inici, zona) ?? momentDe(diaAmbHora(dataInici, horaInici), zona);
  let fi = momentDe(item.fi, zona);
  if (!fi && inici && (dataFi || horaFi)) {
    const diaFinal = dataFi ?? dataInici;
    if ('data' in inici) {
      const exclusiu = diaSeguent(diaFinal);
      if (exclusiu && exclusiu > inici.data) fi = { data: exclusiu };
    } else if (diaFinal) {
      fi = momentDe(diaAmbHora(diaFinal, horaFi ?? (dataFi ? '23:59' : null)), zona);
      if (!dataFi && fi?.dataHora && abansALaParet(fi.dataHora, inici.dataHora)) {
        fi = momentDe(diaAmbHora(diaSeguent(diaFinal), horaFi), zona);
      }
    }
  }
  const llocDades = [textNet(dades?.lloc), textNet(dades?.municipi)].filter(Boolean).join(' · ') || null;
  const lloc = textNet(item.location) ?? llocDades;
  const seccioRuta = item.ambit === 'calendari' || item.type === 'calendari' ? 'calendari' : 'events';
  const base = {
    id: item.id,
    uid: item.uid,
    titol: item.title || item.name,
    descripcio: extractPlainText(item.entradilla || item.summary || item.description || '', Infinity),
    lloc: lloc ?? item.location,
    inici,
    recurrencia: item.recurrencia ?? null,
    font: { tipus: 'mur', id: item.id, ruta: getSectionItemPath(seccioRuta, item.id) },
    actualitzat: dataIsoONull(item.updated_at)
  };
  return creaEsdeveniment({ ...base, fi }) ?? (fi ? creaEsdeveniment({ ...base, fi: null }) : null);
}

/* El dia (clau 'AAAA-MM-DD') d'un moment del model, al calendari de qui mira. */
function diaDe(moment) {
  if ('data' in moment) return moment.data;
  const d = new Date(llegixDataHora(moment.dataHora).instant);
  return clauDia(d.getFullYear(), d.getMonth(), d.getDate());
}

/* El dia en què comença: el de la seua pastilla (EventCard). */
const diaDInici = (esd) => diaDe(esd.inici);

/**
 * El mes ({ any, mes }) d'una clau 'AAAA-MM-DD' (el ?date= del Mur), o null.
 * calendari-5 · L'any ha de tindre quatre xifres significatives: Date llig
 * «0026» com a 1926 i clauDia l'escriuria sense zeros.
 */
export function cursorDeClau(clau) {
  const p = typeof clau === 'string' ? DIA.exec(clau) : null;
  const [any, mes] = p ? [Number(p[1]), Number(p[2])] : [];
  return p && any >= 1000 && mes >= 1 && mes <= 12 ? { any, mes: mes - 1 } : null;
}

/* D5 · El dia ({ any, mes, dia }) d'una clau, o null si no existix al
   calendari: «2026-02-30» no és el 2 de març. */
function diaDeClau(clau) {
  const cursor = cursorDeClau(clau);
  const dia = cursor ? Number(clau.slice(8, 10)) : 0;
  return cursor && dia >= 1 && dia <= new Date(cursor.any, cursor.mes + 1, 0).getDate() ? { ...cursor, dia } : null;
}

/**
 * T5 · Un acte del Mur ocorre el dia d'una clau 'AAAA-MM-DD' (el ?date= del
 * Mur)? El criteri del Calendari (ocorreElDia: tot el dia, amb hora, amb fi o
 * repetit): el dia que el calendari el pinta, el filtre el troba. I el dia
 * que comença, el de la seua pastilla, sempre: clicar-la no fa desaparéixer
 * la targeta, encara que la regla no genere eixe dia (un mercat dels
 * dissabtes que comença un dijous, una EXDATE sobre l'inici) o que el
 * calendari no sàpia pintar la repetició. Una clau que no existix no troba
 * cap acte. null si l'element no és cap acte del model: qui filtra fa servir
 * la seua pastilla. `esd`: el model, si qui filtra ja el té.
 */
export function acteOcorreElDia(item, clau, esd = acteAEsdeveniment(item)) {
  if (!esd) return null;
  const dia = diaDeClau(clau);
  if (!dia) return false;
  return diaDInici(esd) === clau || ocorreElDia(esd, dia.any, dia.mes, dia.dia);
}

/**
 * El mes on s'obri el Calendari: el de la primera ocurrència a partir de hui
 * (hui compta com a futur), buscada amb ocorreElDia fins a dos anys: una
 * fira en curs o un mercat setmanal compten el dia que ocorren, no el dia que
 * van començar. Si cap no ocorre en eixe temps, el criteri d'abans: el de
 * l'acte que comença més prompte a partir de hui. null sense actes.
 *
 * P0-ANDROID-PUSH (v1.2.16) · B10a (decisió del Mestre D-12; revisió [VA-1]) ·
 * Mai un mes passat: si cap acte no ha de vindre, null, i qui crida obri el
 * mes de hui (CalendariDelMur, cursorDe(avui)) o el seu mes d'obertura
 * (CalendariSection, mesDObertura, que tampoc no en torna cap de passat).
 * Abans tornava el mes del més recent, i /calendari s'obria a l'octubre el
 * 20 de novembre perquè l'últim acte havia començat el 23 d'octubre. Amb un
 * hui que no és cap data no se sap què és passat, i es conserva el criteri
 * d'abans, el mes de l'acte més recent: és el que fixa la prova «amb un hui
 * invàlid no es penja» (agendaMur.test.js), anterior a la v1.2.16. No és
 * cap guarda contra un mes impossible: cursorDe ja cau a hui amb una data
 * invàlida, i cap consumidor no hi arriba (CalendariDelMur i CalendariSection
 * hi passen diaDeLaClau(diaIso(new Date())), que sempre és una data, i
 * mesDObertura no la crida amb un hui invàlid).
 */
export function mesDeLActeMesProper(esdeveniments, avui = new Date()) {
  const actes = (esdeveniments ?? []).filter(Boolean);
  if (!actes.length) return null;
  const [any, mes, dia] = [avui.getFullYear(), avui.getMonth(), avui.getDate()];
  const hui = clauDia(any, mes, dia);
  // A partir de hui només poden ocórrer els repetits i els que encara no han acabat.
  const vigents = actes.filter((esd) => esd.recurrencia || diaDe(fiEfectiva(esd)) >= hui);
  const limit = new Date(any, mes + HORITZO_MESOS, dia).getTime();
  for (let k = 0; vigents.length; k++) {
    const d = new Date(any, mes, dia + k);
    // Escrit en negatiu: amb un hui invàlid tot és NaN, la comparació és falsa i no es busca.
    if (!(d.getTime() < limit)) break;
    if (vigents.some((esd) => ocorreElDia(esd, d.getFullYear(), d.getMonth(), d.getDate()))) return cursorDe(d);
  }
  const dies = actes.map(diaDInici).sort();
  const proper = dies.find((d) => d >= hui);
  if (proper) return cursorDeClau(proper);
  return Number.isFinite(avui.getTime()) ? null : cursorDeClau(dies[dies.length - 1]);
}
