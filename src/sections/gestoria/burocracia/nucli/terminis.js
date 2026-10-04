/**
 * terminis.js — el motor de terminis relatius de Burocràcia.
 *
 * Un termini naix d'un ORIGEN (una notificació, una publicació, una
 * resolució, una validació, una factura…) amb una DURADA en una UNITAT (dies
 * hàbils, dies naturals o mesos), té una CONSEQÜÈNCIA si no es complix i
 * algú que el FA. Les regles de còmput són les del procediment administratiu
 * comú (Llei 39/2015, art. 30), sempre «a verificar amb la gestoria», perquè
 * cada procediment pot tindre les seues:
 *   · Es compta des de l'endemà de l'origen.
 *   · Dies hàbils: se salten els dissabtes, els diumenges i els festius del
 *     calendari. L'últim dia comptat és el venciment.
 *   · Dies naturals: el venciment és l'origen més la durada.
 *   · Mesos: el venciment és el mateix dia del mes de l'origen, tants mesos
 *     després; si eixe mes no té eixe dia, l'últim dia del mes.
 *   · Si el venciment cau en un dia inhàbil, es corre al primer hàbil següent.
 *
 * El calendari d'inhàbils és INJECTABLE (creaCalendari): el motor no en sap
 * cap festiu, i ho diu (festiusCarregats). Sense festius, el venciment que
 * dona pot ser ANTERIOR al real, mai posterior: és el costat segur.
 * Cap avant, un festiu que no se sap només faria el real més tard. Cap
 * arrere («l'últim dia hàbil del mes») passa al revés: un festiu a final de
 * mes fa el real ANTERIOR. Per això, sense festius, la cerca cap arrere
 * recula un marge de dies hàbils i ho diu (habilCapArrere).
 * Les dates són text ISO «aaaa-mm-dd»; les comptes passen per Date.UTC, que
 * no coneix l'horari d'estiu. JS pur: sense DOM, React ni xarxa.
 */
import { diesDelMes } from '../../nucli/dates.js';
import { comprovaClaus, comprovaData, comprovaText, congela, errorAmbCodi, esDataIso, esObjecte, llancaSiCal, VERIFICAR } from '../../identitat/nucli/guardes.js';

export const UNITATS = Object.freeze(['dies-habils', 'dies-naturals', 'mesos']);
export const ORIGENS = Object.freeze(['notificacio', 'publicacio', 'resolucio', 'validacio', 'factura', 'presentacio', 'justificacio', 'venciment', 'altre']);
export const QUI_FA = Object.freeze(['titular', 'gestoria', 'agent', 'organisme']);
export const CATEGORIES = Object.freeze(['fiscal', 'cotitzacio', 'tributs-locals', 'propietat-industrial', 'expedient', 'administratiu']);
export const REGLA_COMPUT = 'Es compta des de l’endemà de l’origen; si l’últim dia és inhàbil, es corre al primer hàbil següent (Llei 39/2015, art. 30).';

const DIA_MS = 86400000;
/* Límits de seguretat: cap termini real dura més, i cap bucle penja la pantalla. */
const MAX_DIES = 3660;
const MAX_MESOS = 1200;
const MAX_CERCA_HABIL = 400;

const dosXifres = (n) => String(n).padStart(2, '0');
const parts = (iso) => [Number(iso.slice(0, 4)), Number(iso.slice(5, 7)), Number(iso.slice(8, 10))];
const msDe = (iso) => {
  const [a, m, d] = parts(iso);
  return Date.UTC(a, m - 1, d);
};
function isoDe(ms) {
  const data = new Date(ms);
  return `${String(data.getUTCFullYear()).padStart(4, '0')}-${dosXifres(data.getUTCMonth() + 1)}-${dosXifres(data.getUTCDate())}`;
}
function exigixData(iso, que) {
  if (!esDataIso(iso)) throw errorAmbCodi('DATA_INVALIDA', `${que} ha de ser una data «aaaa-mm-dd» que existisca.`);
}

/** La data ISO d'un any, un mes (1-12) i un dia. */
export const dataIso = (any, mes, dia) => `${any}-${dosXifres(mes)}-${dosXifres(dia)}`;

/** L'últim dia del mes (1-12) d'un any, en ISO. */
export const ultimDiaDelMes = (any, mes) => dataIso(any, mes, diesDelMes(any, mes));

/** La data n dies després (o abans, si n és negatiu). */
export function sumaDies(iso, n) {
  exigixData(iso, 'La data');
  if (!Number.isSafeInteger(n)) throw new RangeError('Els dies són un enter.');
  return isoDe(msDe(iso) + n * DIA_MS);
}

/** La data n mesos després (o abans), amb el dia retallat a l'últim del mes si no existix. */
export function sumaMesos(iso, n) {
  exigixData(iso, 'La data');
  if (!Number.isSafeInteger(n)) throw new RangeError('Els mesos són un enter.');
  const [a, m, d] = parts(iso);
  const total = a * 12 + (m - 1) + n;
  const any = Math.floor(total / 12);
  const mes = total - any * 12 + 1;
  return dataIso(any, mes, Math.min(d, diesDelMes(any, mes)));
}

/** Dies de `des` a `fins` (positiu si `fins` és posterior). */
export function diesEntre(des, fins) {
  exigixData(des, 'La data d’inici');
  exigixData(fins, 'La data de fi');
  return Math.round((msDe(fins) - msDe(des)) / DIA_MS);
}

/** Dia de la setmana: 0 diumenge, 6 dissabte. */
export function diaDeLaSetmana(iso) {
  exigixData(iso, 'La data');
  return new Date(msDe(iso)).getUTCDay();
}

/**
 * Un calendari d'inhàbils. Per defecte, els dissabtes i els diumenges
 * (Llei 39/2015, art. 30.2) i cap festiu: qui el fa servir hi carrega els
 * festius nacionals, autonòmics i locals de l'any, d'una font que tria.
 * @param {{ festius?: string[], capsDeSetmana?: boolean }} opcions
 */
export function creaCalendari({ festius = [], capsDeSetmana = true } = {}) {
  if (!Array.isArray(festius)) throw new TypeError('Els festius són una llista de dates «aaaa-mm-dd».');
  festius.forEach((dia) => exigixData(dia, 'Cada festiu'));
  const conjunt = new Set(festius);
  const llista = Object.freeze([...conjunt].sort());
  return Object.freeze({
    festius: llista,
    capsDeSetmana: Boolean(capsDeSetmana),
    esInhabil(iso) {
      exigixData(iso, 'La data');
      if (conjunt.has(iso)) return true;
      if (!capsDeSetmana) return false;
      const dia = diaDeLaSetmana(iso);
      return dia === 0 || dia === 6;
    }
  });
}

const CALENDARI_PER_DEFECTE = creaCalendari();

/** El calendari que es fa servir: el donat o, si no n'hi ha, el de caps de setmana sense festius. */
export function calendariDe(calendari) {
  if (calendari === undefined) return CALENDARI_PER_DEFECTE;
  if (!calendari || typeof calendari.esInhabil !== 'function') throw new TypeError('El calendari s’ha de crear amb creaCalendari.');
  return calendari;
}

/** Cert si el calendari porta festius: sense, el motor ho ha de dir. */
export const festiusCarregats = (calendari) => Array.isArray(calendari?.festius) && calendari.festius.length > 0;

/* La cerca crua: el primer dia que el calendari no diu inhàbil, des d'una data (ella inclosa). */
function cercaHabil(iso, cal, sentit) {
  let dia = iso;
  for (let i = 0; i < MAX_CERCA_HABIL; i += 1) {
    if (!cal.esInhabil(dia)) return dia;
    dia = sumaDies(dia, sentit);
  }
  throw errorAmbCodi('CALENDARI_SENSE_HABILS', 'El calendari no té cap dia hàbil prop d’esta data: revisa els festius.');
}

/* Dies hàbils de més que recula la cerca cap arrere sense festius carregats.
   Dos, perquè el Dijous i el Divendres Sant poden caure seguits a final de
   mes, i un festiu local sol també hi cap. És una dada: es canvia ací. */
export const MARGE_SENSE_FESTIUS = 2;
export const AVIS_SENSE_FESTIUS = 'Sense festius carregats, l’últim dia hàbil podria ser festiu: es dona una data prudent, uns dies abans. Carrega els festius per a tindre la data exacta.';

/**
 * El dia hàbil cap arrere des d'una data (ella inclosa), amb la promesa
 * «mai posterior al real»: { data, exacte, avis }. Amb festius carregats, la
 * data és la del calendari i exacte és cert. Sense, un festiu a final de mes
 * (el Divendres Sant del 2029-03-30) faria el real anterior al trobat: es
 * recula MARGE_SENSE_FESTIUS dies hàbils més, exacte és fals i l'avís ho diu.
 */
export function habilCapArrere(iso, { calendari } = {}) {
  exigixData(iso, 'La data');
  const cal = calendariDe(calendari);
  const trobat = cercaHabil(iso, cal, -1);
  if (festiusCarregats(cal)) return congela({ data: trobat, exacte: true, avis: null });
  let dia = trobat;
  for (let i = 0; i < MARGE_SENSE_FESTIUS; i += 1) dia = cercaHabil(sumaDies(dia, -1), cal, -1);
  return congela({ data: dia, exacte: false, avis: AVIS_SENSE_FESTIUS });
}

/**
 * El primer dia hàbil a partir d'una data, ella inclosa: cap avant (sentit
 * 1) o cap arrere (sentit -1, per a «l'últim dia hàbil del mes»). Cap
 * arrere és sempre la data prudent d'habilCapArrere: mai posterior a la real.
 */
export function primerHabil(iso, { calendari, sentit = 1 } = {}) {
  exigixData(iso, 'La data');
  if (sentit !== 1 && sentit !== -1) throw new RangeError('El sentit és 1 (avant) o -1 (arrere).');
  if (sentit === -1) return habilCapArrere(iso, { calendari }).data;
  return cercaHabil(iso, calendariDe(calendari), 1);
}

/** L'últim dia hàbil d'un mes (1-12): sense festius, la data prudent (mai posterior a la real). */
export const ultimHabilDelMes = (any, mes, opcions = {}) => primerHabil(ultimDiaDelMes(any, mes), { ...opcions, sentit: -1 });

const CLAUS = Object.freeze(['id', 'categoria', 'origen', 'durada', 'unitat', 'consequencia', 'qui', 'correSiInhabil']);

/**
 * Els errors d'un termini, sense llançar: [] si és vàlid.
 */
export function validaTermini(dades) {
  const errors = [];
  if (!esObjecte(dades)) return [{ codi: 'TERMINI_INVALID', camp: 'termini', missatge: 'El termini ha de ser un objecte.' }];
  comprovaClaus(dades, CLAUS, 'termini', errors);
  comprovaText(dades.id, 'termini.id', errors, { maxim: 120 });
  if (dades.categoria !== undefined && !CATEGORIES.includes(dades.categoria)) {
    errors.push({ codi: 'CATEGORIA_INVALIDA', camp: 'termini.categoria', missatge: `La categoria és una de: ${CATEGORIES.join(', ')}.` });
  }
  if (!esObjecte(dades.origen)) errors.push({ codi: 'ORIGEN_INVALID', camp: 'termini.origen', missatge: 'L’origen és { tipus, data }.' });
  else {
    comprovaClaus(dades.origen, ['tipus', 'data'], 'termini.origen', errors);
    if (!ORIGENS.includes(dades.origen.tipus)) errors.push({ codi: 'ORIGEN_INVALID', camp: 'termini.origen.tipus', missatge: `L’origen és un de: ${ORIGENS.join(', ')}.` });
    comprovaData(dades.origen.data, 'termini.origen.data', errors, { obligatori: true });
  }
  if (!UNITATS.includes(dades.unitat)) errors.push({ codi: 'UNITAT_INVALIDA', camp: 'termini.unitat', missatge: `La unitat és una de: ${UNITATS.join(', ')}.` });
  const maxim = dades.unitat === 'mesos' ? MAX_MESOS : MAX_DIES;
  if (!Number.isInteger(dades.durada) || dades.durada < 1 || dades.durada > maxim) {
    errors.push({ codi: 'DURADA_INVALIDA', camp: 'termini.durada', missatge: `La durada és un enter entre 1 i ${maxim}.` });
  }
  comprovaText(dades.consequencia, 'termini.consequencia', errors, { maxim: 200 });
  if (dades.qui !== undefined && !QUI_FA.includes(dades.qui)) errors.push({ codi: 'QUI_INVALID', camp: 'termini.qui', missatge: `Qui el fa és un de: ${QUI_FA.join(', ')}.` });
  if (dades.correSiInhabil !== undefined && typeof dades.correSiInhabil !== 'boolean') {
    errors.push({ codi: 'CORRE_INVALID', camp: 'termini.correSiInhabil', missatge: 'correSiInhabil és cert o fals.' });
  }
  return errors;
}

function venciment({ origen, durada, unitat }, cal) {
  if (unitat === 'dies-naturals') return sumaDies(origen.data, durada);
  if (unitat === 'mesos') return sumaMesos(origen.data, durada);
  let dia = origen.data;
  let comptats = 0;
  for (let passos = 0; comptats < durada; passos += 1) {
    if (passos > durada * 7 + MAX_CERCA_HABIL) throw errorAmbCodi('CALENDARI_SENSE_HABILS', 'El calendari no deixa prou dies hàbils per a este termini.');
    dia = sumaDies(dia, 1);
    if (!cal.esInhabil(dia)) comptats += 1;
  }
  return dia;
}

/**
 * Calcula un termini: el primer dia del còmput, el venciment, si s'ha corregut
 * per un inhàbil i el que s'hi juga. Torna un objecte congelat.
 * @param {object} dades { id?, categoria?, origen: { tipus, data }, durada, unitat, consequencia?, qui?, correSiInhabil? }
 * @param {{ calendari?: object }} opcions
 */
export function calculaTermini(dades, { calendari } = {}) {
  llancaSiCal(validaTermini(dades), 'TERMINI_INVALID', 'El termini no és vàlid');
  const cal = calendariDe(calendari);
  const sensCorrer = venciment(dades, cal);
  const corre = dades.correSiInhabil !== false;
  const final = corre ? primerHabil(sensCorrer, { calendari: cal }) : sensCorrer;
  return congela({
    id: dades.id ?? null,
    categoria: dades.categoria ?? 'administratiu',
    origen: { tipus: dades.origen.tipus, data: dades.origen.data },
    durada: dades.durada,
    unitat: dades.unitat,
    inici: sumaDies(dades.origen.data, 1),
    venciment: final,
    vencimentSenseCorrer: sensCorrer,
    corregut: final !== sensCorrer,
    consequencia: dades.consequencia?.trim() || null,
    qui: dades.qui ?? 'titular',
    festiusCarregats: festiusCarregats(cal),
    regla: REGLA_COMPUT,
    verificar: VERIFICAR
  });
}
