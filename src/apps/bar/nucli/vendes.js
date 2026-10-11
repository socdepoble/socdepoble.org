/**
 * El Bar · nucli/vendes.js — els tiquets tancats del Bar com a registre de
 * vendes neutre sdp.vendes.v1 (utils/vendes/registreVendes.js), el que el
 * Bar entregarà a la Gestoria de Poble (ordre del Mestre, 261006).
 *
 *   registreDeVendes(tiquets, { titular, establiment, zona, des, fins }) → registre vàlid i congelat
 *   vendaDeTiquet(tiquet, zona)                                          → una venda del registre
 *   dataLocal(moment, zona)                                              → { a, m, d } de l'establiment
 *   horaEnZona(moment, zona)                                             → 'HH:MM' de l'establiment
 *   esZona(zona)                                                         → cert si és una zona IANA
 *
 * · Hi entren els tiquets TANCATS de venda i de devolució; les comandes
 *   obertes o anul·lades, no.
 * · LA ZONA (`zona`, obligatòria): la zona IANA de l'establiment
 *   ('Europe/Madrid', 'Atlantic/Canary'). La data i l'hora de cada venda són
 *   les LOCALS de l'establiment, tretes de tancatA en eixa zona: mai les del
 *   dispositiu que exporta, que pot ser un altre (la Gestoria) o estar en una
 *   altra zona. Un tiquet tancat a les 22:30 UTC del 31 de març és de l'1
 *   d'abril (T2) a Madrid i del 31 de març (T1) a les Canàries.
 *   PENDENT (decisió del Mestre): el Bar encara no guarda la zona de
 *   l'establiment; qui crida (la Gestoria) l'ha de passar.
 * · `des` i `fins` ({ a, m, d }, tots dos inclosos; null deixa el rang obert)
 *   filtren per eixa data local.
 * · Ordre: per tancatA; al mateix moment, per número i per id.
 * · Una devolució ix en positiu, amb tipus 'devolucio' i tiquetOrigenId: la
 *   Gestoria resta. El -0 no és cap import.
 * · Del tiquet NO ix: qui atén, les notes, el motiu, la taula, el torn, les
 *   línies, el lliurat ni el canvi de l'efectiu (llista blanca del contracte).
 * · El titular el posa qui crida (la Gestoria, que alterna perfils): el TPV
 *   no decidix el perfil. Un titular de la Gestoria passa sencer i el
 *   contracte se'n queda { tipus, id, alies, ambit }; el de la llar, el
 *   refusa. Sense, null.
 * · Cap regla d'impostos (Principi 4 de la Gestoria): perIva porta, per cada
 *   tipus, el total venut amb l'IVA inclòs. El tiquet el guarda partit en
 *   base i quota (iva.js, per a la nota del client); ací només se sumen per
 *   a tornar el total del tipus, i la base i la quota les calcula la Gestoria.
 * · ELS ERRORS: un tiquet tancat mal format no es descarta d'amagat. Sense el
 *   moment del tancament (tancatA), qualsevol que siga el rang, registreDeVendes
 *   llança REGISTRE_INVALID amb `detalls` que en diuen la posició i l'id; la
 *   resta de malformacions, també REGISTRE_INVALID, amb els detalls del
 *   contracte. Els arguments dolents porten codi propi: TIQUETS, ZONA, DATA,
 *   RANG. vendaDeTiquet sola llança TIQUET, MOMENT o ZONA.
 *
 * ENDOLLAT (Onada 12, 261011; ordres 261011_0130, punt 6): el detall d'un torn
 * tancat (vistes/Torns.jsx, «Vendes per a la Gestoria (JSON)») baixa el
 * registre dels tiquets del torn en un fitxer, amb el titular a null i la zona
 * de l'establiment o, mentre el Bar no la guarde, la de la caixa que exporta
 * (vistes/desa.js; l'avís de la pantalla la diu). El fitxer és la frontera: el
 * Bar no importa la Gestoria, i el TPV i la Gestoria poden viure en dispositius
 * diferents. PENDENT: que la Gestoria el llija (el seu importador) i que el Bar
 * guarde la zona de l'establiment (decisió del Mestre).
 */
import {
  ESQUEMA_VENDES, MONEDA_VENDES, creaRegistreVendes, esDataValida, titularDelRegistre
} from '../../../utils/vendes/registreVendes.js';
import { errorBar, esId, esMoment } from './comu.js';

const TIPUS_TIQUET = Object.freeze(['venda', 'devolucio']);

const exigeix = (condicio, codi, missatge) => {
  if (!condicio) throw errorBar(codi, missatge);
};

/** Cert si el tiquet entra al registre: tancat, de venda o de devolució. */
export const esTiquetDeVenda = (tiquet) => Boolean(tiquet) && tiquet.estat === 'tancada' && TIPUS_TIQUET.includes(tiquet.tipus);

/* Un formatador per zona: el dia i l'hora de rellotge (00-23) d'un instant. */
const FORMATADORS = new Map();
function formatadorDe(zona) {
  if (!FORMATADORS.has(zona)) {
    FORMATADORS.set(zona, new Intl.DateTimeFormat('en-CA', {
      timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }));
  }
  return FORMATADORS.get(zona);
}

/** Cert si `zona` és un nom de zona IANA que el navegador coneix ('Europe/Madrid'). */
export function esZona(zona) {
  if (typeof zona !== 'string' || zona === '') return false;
  try {
    formatadorDe(zona);
    return true;
  } catch {
    return false;
  }
}

/* Les parts d'un moment en la zona: { a, m, d, hora: 'HH:MM' }. */
function partsEnZona(moment, zona) {
  exigeix(esZona(zona), 'ZONA', 'Cal la zona IANA de l’establiment (per exemple, Europe/Madrid).');
  const parts = {};
  for (const { type, value } of formatadorDe(zona).formatToParts(new Date(moment))) parts[type] = value;
  return { a: Number(parts.year), m: Number(parts.month), d: Number(parts.day), hora: `${parts.hour}:${parts.minute}` };
}

/** El dia { a, m, d } d'un moment ISO en la zona de l'establiment. */
export function dataLocal(moment, zona) {
  const { a, m, d } = partsEnZona(moment, zona);
  return { a, m, d };
}

/** L'hora 'HH:MM' (00:00-23:59) d'un moment ISO en la zona de l'establiment. */
export function horaEnZona(moment, zona) {
  return partsEnZona(moment, zona).hora;
}

/* Un dia com a enter aaaammdd, per a comparar. */
const ordinal = (dia) => dia.a * 10000 + dia.m * 100 + dia.d;

/**
 * Un tiquet tancat (de venda o de devolució) com a venda del registre, amb la
 * data i l'hora en la zona de l'establiment. Copia sense arreglar res: el que
 * no casa ho troba la validació del contracte.
 * @param {object} tiquet
 * @param {string} zona  la zona IANA de l'establiment
 * @returns {object}
 */
export function vendaDeTiquet(tiquet, zona) {
  exigeix(esTiquetDeVenda(tiquet), 'TIQUET', 'Només un tiquet tancat de venda o de devolució entra al registre de vendes.');
  exigeix(esMoment(tiquet.tancatA), 'MOMENT', 'El tiquet necessita el moment del tancament.');
  const devolucio = tiquet.tipus === 'devolucio';
  /* Una devolució porta els imports en negatiu (tiquet.js): ací ixen en positiu.
     Un valor que no és un enter passa tal qual, perquè la validació el trobe. */
  const positiu = (cents) => (Number.isSafeInteger(cents) ? (devolucio ? -cents : cents) || 0 : cents);
  const totals = tiquet.totals || {};
  /* El total de cada tipus, amb l'IVA inclòs: el tiquet el guarda partit en base i quota. */
  const perIva = Array.isArray(totals.perIva)
    ? totals.perIva.map((grup) => ({
      ivaPercent: grup?.ivaPercent,
      totalCents: positiu(Number.isSafeInteger(grup?.baseCents) && Number.isSafeInteger(grup?.quotaCents) ? grup.baseCents + grup.quotaCents : null)
    }))
    : totals.perIva;
  const pagaments = Array.isArray(tiquet.pagaments)
    ? tiquet.pagaments.map((pagament) => ({ metode: pagament?.metode, importCents: positiu(pagament?.importCents) }))
    : tiquet.pagaments;
  const { a, m, d, hora } = partsEnZona(tiquet.tancatA, zona);
  return {
    id: tiquet.id,
    numero: tiquet.numero,
    tipus: tiquet.tipus,
    data: { a, m, d },
    hora,
    canal: tiquet.origen?.tipus,
    totalCents: positiu(totals.totalCents),
    perIva,
    pagaments,
    ...(devolucio ? { tiquetOrigenId: tiquet.tiquetOrigenId } : {})
  };
}

/* Els tiquets tancats sense el moment del tancament: el rang no s'hi pot
   aplicar, i el registre sencer es refusa amb la posició i l'id de cadascun. */
function refusaSenseMoment(tiquets) {
  const detalls = [];
  tiquets.forEach((tiquet, i) => {
    if (!esTiquetDeVenda(tiquet) || esMoment(tiquet.tancatA)) return;
    const quin = esId(tiquet.id) ? `El tiquet ${tiquet.id}` : 'Un tiquet sense id vàlid';
    detalls.push({ codi: 'MOMENT_INVALID', camp: `tiquets[${i}].tancatA`, missatge: `${quin} no té el moment del tancament (tancatA).` });
  });
  if (detalls.length) {
    throw Object.assign(errorBar('REGISTRE_INVALID', `El registre de vendes no és vàlid: ${detalls.map((e) => e.missatge).join(' ')}`), { detalls });
  }
}

/**
 * El registre sdp.vendes.v1 dels tiquets tancats del Bar, validat i congelat.
 * @param {object[]} tiquets  els tiquets (i, si de cas, comandes) del magatzem
 * @param {{ titular?: object|null, establiment: string, zona: string, des?: object|null, fins?: object|null }} opcions
 *   titular: el perfil que tria qui crida (o null) · establiment: l'slug del bar ·
 *   zona: la zona IANA de l'establiment · des, fins: { a, m, d } locals, inclosos (null, rang obert)
 * @returns {Readonly<object>}
 */
export function registreDeVendes(tiquets, { titular = null, establiment, zona, des = null, fins = null } = {}) {
  exigeix(Array.isArray(tiquets), 'TIQUETS', 'Cal la llista de tiquets.');
  exigeix(esZona(zona), 'ZONA', 'Cal la zona IANA de l’establiment (per exemple, Europe/Madrid).');
  exigeix(des === null || esDataValida(des), 'DATA', '«des» ha de ser un dia { a, m, d } que existisca, o null.');
  exigeix(fins === null || esDataValida(fins), 'DATA', '«fins» ha de ser un dia { a, m, d } que existisca, o null.');
  exigeix(des === null || fins === null || ordinal(des) <= ordinal(fins), 'RANG', '«des» no pot ser posterior a «fins».');
  refusaSenseMoment(tiquets);
  const dins = (dia) => (des === null || ordinal(dia) >= ordinal(des)) && (fins === null || ordinal(dia) <= ordinal(fins));
  const vendes = tiquets
    .filter(esTiquetDeVenda)
    .map((tiquet) => ({ venda: vendaDeTiquet(tiquet, zona), ms: Date.parse(tiquet.tancatA) }))
    .filter(({ venda }) => dins(venda.data))
    .sort((x, y) => (x.ms - y.ms) || (x.venda.numero - y.venda.numero) || (x.venda.id < y.venda.id ? -1 : x.venda.id > y.venda.id ? 1 : 0))
    .map(({ venda }) => venda);
  return creaRegistreVendes({
    esquema: ESQUEMA_VENDES,
    moneda: MONEDA_VENDES,
    titular: titularDelRegistre(titular),
    origen: { app: 'bar', establiment },
    vendes
  });
}
