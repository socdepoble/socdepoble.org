/**
 * mapaFotografic.js — el nucli pur del Mapa Fotogràfic del Mur (P1-64).
 *
 * Pla 261028_1526 §3.7.1 (Bloc G) i decisions 1 i 9 del Mestre (261028) · Les
 * fotos del Mur en un mapa que va del poble al món: de lluny, pocs nodes amb
 * el seu número; en acostar-se, zones, pobles, parades i, des del zoom 16,
 * cada foto en el seu punt. Ací no hi ha DOM, ni xarxa, ni cap adreça: només
 * números i text. El pinta MapaFotografic.jsx (Leaflet) i les dades les fa
 * puntsDelMapa.js.
 *
 * Referència d'Emowe (_investigacio_ia_de_poble/261014_1930_emowe_mapa_de_tu_viaje):
 * la plantilla no declara cap llicència. D'ella només en prenem les idees (els
 * llindars, la regla de l'estimació i el comportament del lliscador), escrites
 * de nou; ni una línia del seu codi.
 *
 * L'AGRUPACIÓ · Enllaç complet: dues parades van al mateix node si TOTES les
 * parelles del node queden a la distància triada o menys, de manera que una
 * cadena de veïns no ajunta llocs llunyans. L'arbre es calcula UNA vegada per
 * conjunt (arbreDAgrupacio) i cada llindar n'és un tall (tallaArbre): ni el
 * lliscador ni el zoom no recalculen distàncies.
 *   · Lance-Williams: la distància d'un node nou a qualsevol altre és la més
 *     gran de les dues dels nodes que l'han fet.
 *   · Empats: guanya la parella (a, b) més baixa, i el node que queda és a. És
 *     el mateix resultat que la cerca voraç d'Emowe (cada tall amb límit és un
 *     prefix de la fusió sense límit), i les proves ho comparen.
 *   · Mai llança: una entrada que no és una llista és un arbre buit, i un punt
 *     sense coordenades vàlides només s'ajunta amb «Tot junt» (també quan n'hi
 *     ha molts: mai no entren a la matriu).
 *   · Emowe M2 (decisió del Mestre, 261028: preagrupament exacte) · Les
 *     coordenades idèntiques es fonen sempre abans, a altura 0, siga quin siga
 *     el nombre de punts: el resultat de cada tall és el mateix que el de la
 *     matriu sencera (i el de l'oracle), però la matriu només porta els llocs
 *     diferents. Si encara en queden més de MAX_PUNTS_DE_LA_MATRIU, s'ajunten
 *     per cel·les (de 0,0001° en sèrie 1-2-5) fins que hi caben, i l'arbre ho
 *     diu (retallat: true, amb resolucioKm, la diagonal de la cel·la): la
 *     matriu de distàncies és quadràtica i un telèfon no n'ha de carregar més.
 *
 * LES DATES · dataCaptura és el text d'exif.js, «AAAA-MM-DDThh:mm:ss» amb la
 * zona «±hh:mm» si la càmera la va escriure (també s'accepta el brut d'EXIF,
 * «AAAA:MM:DD hh:mm:ss»). Una hora sense zona mai no es passa a UTC: es
 * compara amb altres hores sense zona com a hora de rellotge, i mai amb una
 * que en porta.
 *
 * L'ESTIMACIÓ (regla d'Emowe) · Una foto sense GPS d'una publicació pren el
 * lloc de la foto amb GPS MÉS PRÒXIMA EN EL TEMPS de la MATEIXA publicació,
 * d'abans o de després. Mai no s'interpola: un punt a mig camí entre dues
 * fotos seria un lloc inventat. Si no hi ha cap hora comparable, el centre
 * del poble; si tampoc, pendent d'ubicar (no es pinta).
 *
 * Mai no es crida cap geocodificador: el títol de la zona ix de les dades dels
 * pobles que porta l'app.
 */
import { coordenadesValides } from '../../components/universal/enquadrament/exif.js';

/** Les distàncies del lliscador «Agrupació per distància», en km, de «Tot junt» a «Totes les parades». */
export const LLINDARS_KM = Object.freeze([Infinity, 100, 60, 30, 15, 6, 2, 0.8, 0.2, 0]);
/** Des d'este zoom (sense llindar manual), una targeta per parada. */
export const ZOOM_PARADES = 13;
/** Des d'este zoom, sempre cada foto en el seu punt, fins i tot amb un llindar manual. */
export const ZOOM_FOTO_A_FOTO = 16;
/** Una estimació amb més distància que esta (o d'un altre dia) porta «incertesa alta». */
export const INCERTESA_ALTA_S = 7200;
/** El sostre de la matriu de distàncies (punts diferents): per damunt, s'arrodonix. */
export const MAX_PUNTS_DE_LA_MATRIU = 1500;
/** La línia discontínua de cada targeta al seu punt (stroke-dasharray de Leaflet). */
export const GUIONS = '4 5';

const RADI_TERRA_KM = 6371;
const RAD = Math.PI / 180;
/* Els km d'un grau de latitud (2πR / 360): la diagonal d'una cel·la de `pas` graus és com a molt pas · KM_PER_GRAU · √2. */
const KM_PER_GRAU = (2 * Math.PI * RADI_TERRA_KM) / 360;
/* Les cel·les (graus) amb què s'ajunta quan hi ha massa punts diferents, de
   0,0001° (uns 11 m) a 10°: amb 10°, el món sencer ja cap en la matriu. */
const PASSOS_DE_RETALL = Object.freeze([1e-4, 2e-4, 5e-4, 1e-3, 2e-3, 5e-3, 1e-2, 2e-2, 5e-2, 0.1, 0.2, 0.5, 1, 2, 5, 10]);
/* El zoom de cada llindar automàtic: fins al zoom 6, tot junt; 100 km, 0,2 km i 0 només ixen del lliscador. */
const LLINDARS_DEL_ZOOM = Object.freeze([[6, Infinity], [7, 60], [8, 30], [9, 15], [10, 6], [11, 2]]);
const LLINDAR_DE_PROP = 0.8;

const esLlista = (valor) => Array.isArray(valor);
const textNet = (valor) => (typeof valor === 'string' ? valor.trim() : '');
const tradueix = (t, clau, reserva) => (typeof t === 'function' ? t(clau, reserva) : reserva);

/** Si `punt` té coordenades possibles (coordenadesValides: finites, dins del rang i no el 0/0). */
export const esPuntValid = (punt) => Boolean(punt) && coordenadesValides(punt.lat, punt.lng);

/** Una plantilla «… {d} …» amb els seus valors. Substitució amb funció: un «$&» d'un nom no es reinterpreta. */
export function omplix(plantilla, valors = {}) {
  return String(plantilla ?? '').replace(/\{(\w+)\}/g, (sencer, nom) => (Object.hasOwn(valors, nom) ? String(valors[nom]) : sencer));
}

/* ═══ DISTÀNCIES I ZOOM ═══════════════════════════════════════════ */

/** Distància de gran cercle (haversine, R = 6371 km) entre dos { lat, lng }; Infinity si algun no és vàlid. */
export function distanciaKm(a, b) {
  if (!esPuntValid(a) || !esPuntValid(b)) return Infinity;
  const dLat = (b.lat - a.lat) * RAD;
  const dLng = (b.lng - a.lng) * RAD;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.sin(dLng / 2) ** 2;
  return 2 * RADI_TERRA_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** El llindar automàtic d'un zoom: fins al 6 (o sense zoom), tot junt; 7 → 60; … ; 11 → 2; des del 12, 0,8 km. */
export function llindarDelZoom(zoom) {
  if (!Number.isFinite(zoom)) return Infinity;
  for (const [sostre, km] of LLINDARS_DEL_ZOOM) if (zoom <= sostre) return km;
  return LLINDAR_DE_PROP;
}

/** La posició del lliscador (0..9) d'una distància: la del primer llindar que no la passa. */
export function indexDelLlindar(km) {
  if (typeof km !== 'number' || Number.isNaN(km)) return 0;
  const exacte = LLINDARS_KM.indexOf(km);
  if (exacte >= 0) return exacte;
  const index = LLINDARS_KM.findIndex((llindar) => llindar <= km);
  return index >= 0 ? index : LLINDARS_KM.length - 1;
}

/** La distància d'una posició del lliscador (s'arrodonix i es tanca dins de 0..9). */
export function llindarDelLliscador(valor) {
  const n = Math.round(Number(valor));
  const index = Number.isFinite(n) ? Math.min(LLINDARS_KM.length - 1, Math.max(0, n)) : 0;
  return LLINDARS_KM[index];
}

/**
 * Què pinta el mapa: 'foto-a-foto' des del zoom 16 (sempre: el lliscador no
 * bloqueja mai el detall local); 'parades' del 13 al 15 en mode automàtic;
 * 'grups' en la resta (i sempre que hi ha un llindar manual per davall del 16).
 */
export function modeDelMapa({ zoom, llindarManual = null } = {}) {
  if (Number.isFinite(zoom) && zoom >= ZOOM_FOTO_A_FOTO) return 'foto-a-foto';
  if (llindarManual === null && Number.isFinite(zoom) && zoom >= ZOOM_PARADES) return 'parades';
  return 'grups';
}

/** L'etiqueta d'una distància del lliscador: «Tot junt», «Totes les parades», «800 m» o «6 km». */
export function etiquetaDistancia(km, t) {
  if (km === Infinity) return tradueix(t, 'section.mur.mapa.totJunt', 'Tot junt');
  if (km === 0) return tradueix(t, 'section.mur.mapa.totesLesParades', 'Totes les parades');
  if (typeof km !== 'number' || !Number.isFinite(km) || km < 0) return '';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${String(km).replace('.', ',')} km`;
}

/**
 * L'explicació del lliscador, com a { clau, reserva, valors } per a t(): canvia
 * amb el valor triat, i en el detall local (zoom 16 o més) diu que cada foto
 * conserva la seua ubicació.
 */
export function ajudaDelLliscador({ llindarManual = null, mode } = {}) {
  if (mode === 'foto-a-foto') {
    return { clau: 'section.mur.mapa.ajuda.detallLocal', reserva: 'Detall local actiu: cada foto conserva la seua ubicació. En allunyar-te es recupera l’agrupació triada.', valors: {} };
  }
  if (llindarManual === null) {
    return { clau: 'section.mur.mapa.ajuda.automatica', reserva: 'La distància d’agrupació canvia en acostar o allunyar el mapa. Mou el lliscador per a triar-la sense canviar el zoom.', valors: {} };
  }
  if (llindarManual === Infinity) {
    return { clau: 'section.mur.mapa.ajuda.totJunt', reserva: 'Agrupem totes les parades en un sol node, estiguen on estiguen.', valors: {} };
  }
  if (llindarManual === 0) {
    return { clau: 'section.mur.mapa.ajuda.separades', reserva: 'Mostrem cada parada en un node a banda, encara que n’hi haja diverses al mateix lloc.', valors: {} };
  }
  return {
    clau: 'section.mur.mapa.ajuda.distancia',
    reserva: 'Agrupem en un mateix node les parades que estan a {d} o menys entre si. Les més allunyades queden en nodes separats.',
    valors: { d: etiquetaDistancia(llindarManual) }
  };
}

/* ═══ L'ARBRE D'AGRUPACIÓ ═════════════════════════════════════════ */

/* L'índex de la parella (i, j), i < j, dins del triangle superior de la matriu. */
const desplacamentDeFila = (i, m) => (i * (2 * m - i - 1)) / 2;

/* Enllaç complet sobre els representants `reps` (índexs de `punts`, en ordre
   creixent). Mínim de cada fila guardat: només es recalculen les files que
   apuntaven a una de les dues parades que s'acaben d'ajuntar (les distàncies
   d'enllaç complet només creixen), i el resultat és el de la cerca sencera. */
function enllacComplet(punts, reps, fusions) {
  const m = reps.length;
  if (m < 2) return;
  const fila = new Float64Array(m);
  const lat = new Float64Array(m);
  const lng = new Float64Array(m);
  const cosLat = new Float64Array(m);
  const valid = new Uint8Array(m);
  for (let i = 0; i < m; i += 1) {
    const punt = punts[reps[i]];
    fila[i] = desplacamentDeFila(i, m);
    valid[i] = esPuntValid(punt) ? 1 : 0;
    if (valid[i]) {
      lat[i] = punt.lat;
      lng[i] = punt.lng;
      cosLat[i] = Math.cos(punt.lat * RAD);
    }
  }
  const d = new Float64Array((m * (m - 1)) / 2);
  for (let i = 0; i < m; i += 1) {
    const base = fila[i] - i - 1;
    for (let j = i + 1; j < m; j += 1) {
      if (!valid[i] || !valid[j]) { d[base + j] = Infinity; continue; }
      // La mateixa expressió, en el mateix ordre, que distanciaKm: els empats són els mateixos.
      const h = Math.sin(((lat[j] - lat[i]) * RAD) / 2) ** 2 + cosLat[i] * cosLat[j] * Math.sin(((lng[j] - lng[i]) * RAD) / 2) ** 2;
      d[base + j] = 2 * RADI_TERRA_KM * Math.asin(Math.min(1, Math.sqrt(h)));
    }
  }
  const pos = (i, j) => (i < j ? fila[i] + j - i - 1 : fila[j] + i - j - 1);
  const viu = new Uint8Array(m).fill(1);
  const minim = new Float64Array(m);
  const parella = new Int32Array(m).fill(-1);
  const recalcula = (i) => {
    let millor = Infinity;
    let arg = -1;
    const base = fila[i] - i - 1;
    for (let j = i + 1; j < m; j += 1) {
      if (!viu[j]) continue;
      const valor = d[base + j];
      if (arg === -1 || valor < millor) { millor = valor; arg = j; }
    }
    minim[i] = millor;
    parella[i] = arg;
  };
  for (let i = 0; i < m; i += 1) recalcula(i);
  for (let pas = 0; pas < m - 1; pas += 1) {
    let a = -1;
    for (let i = 0; i < m; i += 1) {
      if (viu[i] && parella[i] !== -1 && (a === -1 || minim[i] < minim[a])) a = i;
    }
    if (a === -1) break;
    const b = parella[a];
    fusions.push({ a: reps[a], b: reps[b], altura: minim[a] });
    viu[b] = 0;
    for (let k = 0; k < m; k += 1) {
      if (!viu[k] || k === a) continue;
      const ka = pos(k, a);
      const kb = pos(k, b);
      if (d[kb] > d[ka]) d[ka] = d[kb];
    }
    recalcula(a);
    for (let k = 0; k < b; k += 1) {
      if (viu[k] && k !== a && (parella[k] === a || parella[k] === b)) recalcula(k);
    }
  }
}

/* Els representants dels punts vàlids amb la mateixa clau (el primer índex
   de cada clau, en ordre), les fusions a altura 0 de la resta i, a banda, els
   punts no vàlids: eixos no entren mai a la matriu. */
function fonPerClau(punts, clauDe) {
  const primer = new Map();
  const reps = [];
  const invalids = [];
  const fusions = [];
  punts.forEach((punt, index) => {
    if (!esPuntValid(punt)) {
      invalids.push(index);
      return;
    }
    const clau = clauDe(punt);
    if (!primer.has(clau)) {
      primer.set(clau, index);
      reps.push(index);
      return;
    }
    fusions.push({ a: primer.get(clau), b: index, altura: 0 });
  });
  return { reps, invalids, fusions };
}

const arbreFet = (n, fusions, resolucioKm) => Object.freeze({ n, fusions: Object.freeze(fusions), retallat: resolucioKm > 0, resolucioKm });

/**
 * L'arbre d'enllaç complet d'una llista de { lat, lng }, una vegada per
 * conjunt: { n, fusions: [{ a, b, altura }] en ordre d'altura, retallat,
 * resolucioKm }. Les fusions van en índexs de `punts`; el node que queda és
 * sempre `a`. resolucioKm és 0 si l'arbre és exacte; si s'ha ajuntat per
 * cel·les, la seua diagonal (arrodonida a dos xifres): dins d'un grup, dos
 * punts poden quedar a eixa distància de més del llindar triat.
 */
export function arbreDAgrupacio(punts) {
  const llista = esLlista(punts) ? punts : [];
  const n = llista.length;
  try {
    // M2 · Sempre, també amb pocs punts: les coordenades idèntiques, a altura 0 (clau exacta, cap arrodoniment).
    let fosos = fonPerClau(llista, (punt) => `${punt.lat}|${punt.lng}`);
    let pas = 0;
    for (const mida of PASSOS_DE_RETALL) {
      if (fosos.reps.length <= MAX_PUNTS_DE_LA_MATRIU) break;
      fosos = fonPerClau(llista, (punt) => `${Math.round(punt.lat / mida)}|${Math.round(punt.lng / mida)}`);
      pas = mida;
    }
    const fusions = fosos.fusions.slice();
    const cap = fosos.reps.length <= MAX_PUNTS_DE_LA_MATRIU;
    if (cap) enllacComplet(llista, fosos.reps, fusions);
    // «Tot junt»: el node dels vàlids (el primer, si l'enllaç els ha ajuntat) i cada punt no vàlid, a l'infinit.
    const arrels = (cap ? fosos.reps.slice(0, 1) : fosos.reps).concat(fosos.invalids).sort((x, y) => x - y);
    for (const b of arrels.slice(1)) fusions.push({ a: arrels[0], b, altura: Infinity });
    return arbreFet(n, fusions, pas ? Number((pas * KM_PER_GRAU * Math.SQRT2).toPrecision(2)) : 0);
  } catch {
    // Sense memòria per a la matriu: cap fusió, cada punt el seu node.
    return arbreFet(n, [], Infinity);
  }
}

/**
 * Els grups d'un tall de l'arbre a `km`: les fusions d'altura `km` o menys
 * (0 és «Totes les parades»: cap fusió). Cada grup va ordenat, i els grups
 * pel seu primer índex: amb els punts en ordre cronològic, el número de cada
 * node és el de la seua primera visita.
 */
export function tallaArbre(arbre, km) {
  const n = Number.isInteger(arbre?.n) && arbre.n > 0 ? arbre.n : 0;
  const grups = Array.from({ length: n }, (_, index) => [index]);
  if (km !== 0 && typeof km === 'number' && !(km < 0) && esLlista(arbre?.fusions)) {
    for (const { a, b, altura } of arbre.fusions) {
      if (!(altura <= km)) break;
      if (!grups[a] || !grups[b]) continue;
      grups[a] = grups[a].concat(grups[b]);
      grups[b] = null;
    }
  }
  return grups.filter(Boolean).map((grup) => grup.sort((x, y) => x - y)).sort((x, y) => x[0] - y[0]);
}

/** Els grups de `punts` a `km` (arbre i tall de colp): per a una sola consulta. */
export function agrupaPerDistancia(punts, km) {
  return tallaArbre(arbreDAgrupacio(punts), km);
}

/**
 * El punt que representa un grup: la mitjana de les latituds i la mitjana
 * circular de les longituds dels seus punts vàlids, o null. QA-02 (Codex
 * 261028_1611): amb la mitjana aritmètica, dos punts a ±179,8° tenien el
 * centre a 0°, a l'altra banda del món; amb sinus i cosinus, al Pacífic. Si
 * les longituds s'anul·len (punts antipodals), no hi ha cap direcció: la
 * mitjana aritmètica, com abans.
 */
export function centreDelGrup(punts, ids) {
  const valids = (esLlista(ids) ? ids : []).map((id) => punts?.[id]).filter(esPuntValid);
  if (!valids.length) return null;
  const mitjana = (valor) => valids.reduce((suma, punt) => suma + valor(punt), 0) / valids.length;
  const sinus = mitjana((punt) => Math.sin(punt.lng * RAD));
  const cosinus = mitjana((punt) => Math.cos(punt.lng * RAD));
  return {
    lat: mitjana((punt) => punt.lat),
    lng: Math.hypot(sinus, cosinus) < 1e-9 ? mitjana((punt) => punt.lng) : Math.atan2(sinus, cosinus) / RAD
  };
}

/**
 * El nom d'un grup: `nomDeTot` si porta tots els punts (i més d'un); amb dos
 * llocs o menys, els seus noms junts («La Torre · Penàguila»); si no, el
 * primer i quants més en porta (formataMes).
 */
export function nomDelGrup(ids, punts, { nomDeTot = '', nomSenseLloc = '', formataMes = (primer, n) => `${primer} · ${n} zones més` } = {}) {
  const llista = esLlista(ids) ? ids : [];
  const total = esLlista(punts) ? punts.length : 0;
  if (nomDeTot && total > 1 && llista.length === total) return nomDeTot;
  const noms = [...new Set(llista.map((id) => textNet(punts?.[id]?.lloc) || nomSenseLloc).filter(Boolean))];
  if (noms.length <= 2) return noms.join(' · ');
  return formataMes(noms[0], noms.length - 1);
}

/* ═══ DATES DE CAPTURA ════════════════════════════════════════════ */

const FORMA_DE_CAPTURA = /^(\d{4})[-:](\d{2})[-:](\d{2})[T ](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?([+-](?:0\d|1[0-4]):[0-5]\d|Z)?$/;

/**
 * L'instant d'una dataCaptura: { s, zona, dia, local } o null. `s` són segons
 * UTC si porta zona; sense zona, els segons del rellotge local (només es
 * comparen amb altres hores sense zona). `local` és «AAAA-MM-DDThh:mm:ss».
 */
export function instantDeCaptura(text) {
  const m = FORMA_DE_CAPTURA.exec(textNet(text));
  if (!m) return null;
  const [any, mes, dia, hora, minut, segon] = m.slice(1, 7).map(Number);
  if (any < 1800 || mes < 1 || mes > 12 || dia < 1 || hora > 23 || minut > 59 || segon > 59) return null;
  const rellotge = Date.UTC(any, mes - 1, dia, hora, minut, segon);
  const data = new Date(rellotge);
  if (data.getUTCMonth() !== mes - 1 || data.getUTCDate() !== dia) return null;
  const zona = m[7] ? (m[7] === 'Z' ? '+00:00' : m[7]) : null;
  let desplacament = 0;
  if (zona) {
    const signe = zona[0] === '-' ? -1 : 1;
    desplacament = signe * (Number(zona.slice(1, 3)) * 60 + Number(zona.slice(4, 6))) * 60;
  }
  const diaText = `${m[1]}-${m[2]}-${m[3]}`;
  return { s: rellotge / 1000 - desplacament, zona, dia: diaText, local: `${diaText}T${m[4]}:${m[5]}:${m[6]}` };
}

/**
 * Com es comparen les captures d'un conjunt: 'instant' si totes les que
 * porten data porten també zona; si no, 'local' (l'hora de rellotge, una
 * aproximació quan es barregen zones conegudes i desconegudes: mai no s'hi
 * inventa cap UTC).
 */
export function modeDeComparacio(instants) {
  const amb = (esLlista(instants) ? instants : []).filter(Boolean);
  return amb.length > 0 && amb.every((instant) => instant.zona) ? 'instant' : 'local';
}

/** Compara dos instants amb el mode del conjunt; sense data, al final. */
export function comparaCaptures(a, b, mode = 'local') {
  if (!a || !b) return (a ? -1 : 0) + (b ? 1 : 0);
  const x = mode === 'instant' ? a.s : a.local;
  const y = mode === 'instant' ? b.s : b.local;
  if (x < y) return -1;
  return x > y ? 1 : 0;
}

/** Una còpia de `llista` en ordre de captura (estable: els empats i els que no tenen data, en l'ordre d'entrada). */
export function ordenaPerCaptura(llista, { data = (element) => element?.dataCaptura } = {}) {
  const entrades = (esLlista(llista) ? llista : []).map((element, index) => ({ element, index, instant: instantDeCaptura(data(element)) }));
  const mode = modeDeComparacio(entrades.map((entrada) => entrada.instant));
  return entrades
    .sort((a, b) => comparaCaptures(a.instant, b.instant, mode) || a.index - b.index)
    .map((entrada) => entrada.element);
}

/** «DD/MM/AAAA» d'una dataCaptura (llegida com a text: cap zona convertida), o ''. */
export function formataDia(text) {
  const m = /^(\d{4})[-:](\d{2})[-:](\d{2})/.exec(textNet(text));
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}

/** «hh:mm» d'una dataCaptura, o ''. */
export function formataHora(text) {
  const m = /^\d{4}[-:]\d{2}[-:]\d{2}[T ](\d{2}):(\d{2})/.exec(textNet(text));
  return m ? `${m[1]}:${m[2]}` : '';
}

/* ═══ L'ESTIMACIÓ ═════════════════════════════════════════════════ */

/** Emowe M1 · Com s'ha deduït el lloc d'una foto que no en porta de propi. */
export const INFERENCIES = Object.freeze(['estimada', 'poble']);

const esGps = (foto) => foto.origen === 'exif' && coordenadesValides(foto.lat, foto.lng);

/**
 * L'estat d'una foto, derivat del seu origen i de la seua inferència (M1): la
 * inferència mana ('estimada' o 'poble'); sense, 'gps' si el lloc és de
 * l'EXIF, 'indicada' si és d'un altre origen i 'pendent' si no n'hi ha.
 */
export function estatDe(foto) {
  const tipus = foto?.inferencia?.tipus;
  if (INFERENCIES.includes(tipus)) return tipus;
  if (!coordenadesValides(foto?.lat, foto?.lng)) return 'pendent';
  return foto.origen === 'exif' ? 'gps' : 'indicada';
}

/**
 * Les fotos d'UNA publicació amb el seu estat: 'gps' (GPS de la foto),
 * 'indicada' (unes coordenades que no són de l'EXIF), 'estimada' (la foto amb
 * GPS més pròxima en el temps de la mateixa publicació, amb referencia,
 * diferencia_s i incertesaAlta), 'poble' (el centre del poble) o 'pendent'
 * (sense lloc: no es pinta). Mai no es compara una hora amb zona amb una sense.
 *
 * Emowe M1 · D'on ve el lloc i com s'ha deduït van a banda. `origen` és el de
 * les coordenades PRÒPIES de la foto ('exif' o 'manual'), i null si no en té:
 * les de l'estimada són d'una altra foto, i les del poble, del poble.
 * `inferencia` és { tipus: 'estimada' | 'poble', referencia, diferencia_s,
 * incertesaAlta }, o null si el lloc és el seu. `estat` ix d'estatDe, i
 * l'estimada continua portant referencia, diferencia_s i incertesaAlta en solt:
 * el que es pinta no canvia (la precisió 'poble' del centre del poble, tampoc:
 * són els decimals que en mostra el visor). Res d'açò no torna al payload, on
 * geolocalitzacio.origen només és 'exif' o 'manual' (geolocalitzacio.js).
 */
export function estimaUbicacions(fotos, { centreDelPoble = null } = {}) {
  const llista = (esLlista(fotos) ? fotos : []).filter((foto) => foto && typeof foto === 'object');
  const ambInstant = llista.map((foto) => ({ foto, instant: instantDeCaptura(foto.dataCaptura) }));
  const referencies = ambInstant.filter(({ foto, instant }) => instant && esGps(foto));
  const poble = esPuntValid(centreDelPoble) ? centreDelPoble : null;
  const amb = (foto, camps) => {
    const nova = { ...foto, ...camps };
    return { ...nova, estat: estatDe(nova) };
  };
  return ambInstant.map(({ foto, instant }) => {
    if (esGps(foto)) return amb(foto, { origen: 'exif', inferencia: null });
    if (coordenadesValides(foto.lat, foto.lng)) return amb(foto, { origen: 'manual', inferencia: null });
    let millor = null;
    if (instant) {
      for (const ref of referencies) {
        if (Boolean(ref.instant.zona) !== Boolean(instant.zona)) continue;
        const diferencia = Math.abs(ref.instant.s - instant.s);
        if (!millor || diferencia < millor.diferencia) millor = { ref, diferencia };
      }
    }
    if (millor) {
      const { ref, diferencia } = millor;
      const inferencia = Object.freeze({
        tipus: 'estimada', referencia: ref.foto.id ?? null, diferencia_s: diferencia,
        incertesaAlta: diferencia > INCERTESA_ALTA_S || ref.instant.dia !== instant.dia
      });
      return amb(foto, {
        lat: ref.foto.lat, lng: ref.foto.lng, precisio: null, precisio_m: null, origen: null, inferencia,
        referencia: inferencia.referencia, diferencia_s: inferencia.diferencia_s, incertesaAlta: inferencia.incertesaAlta
      });
    }
    if (poble) {
      // El centre del poble no diu on es va fer la foto: incertesa alta, sempre.
      const inferencia = Object.freeze({ tipus: 'poble', referencia: null, diferencia_s: null, incertesaAlta: true });
      return amb(foto, { lat: poble.lat, lng: poble.lng, precisio: 'poble', precisio_m: null, origen: null, inferencia });
    }
    return amb(foto, { lat: null, lng: null, origen: null, inferencia: null });
  });
}

/** El to d'una ubicació: 'verd' per al GPS real; 'ocre' per a l'estimada, la del poble o la indicada; null si no es pinta. */
export function tonDeLaUbicacio(estat) {
  if (estat === 'gps') return 'verd';
  return ['estimada', 'poble', 'indicada'].includes(estat) ? 'ocre' : null;
}

/* FNV-1a de 32 bits d'un text, en base 36: una empremta curta (no és cap secret). */
function empremta(text) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(36);
}

/**
 * La clau d'un grup pel seu contingut (l'empremta dels ids ordenats): la de
 * les posicions desades de les targetes. Curta encara que el grup porte mil
 * fotos: cada id porta l'adreça de la foto, i l'emmagatzematge d'un portal
 * amfitrió és compartit.
 */
export function clauDeContingut(ids) {
  return empremta(JSON.stringify((esLlista(ids) ? ids : []).map(String).sort()));
}

/** Una empremta curta d'un conjunt de fotos: canvia si canvia cap foto, lloc o data. */
export function clauDelConjunt(fotos) {
  return empremta(JSON.stringify((esLlista(fotos) ? fotos : []).map((foto) => [foto?.id, foto?.lat, foto?.lng, foto?.dataCaptura])));
}

/* ═══ EL NOM DE LA ZONA ═══════════════════════════════════════════ */

/** El poble més pròxim a `centre` de la llista `pobles` ({ title, lat, lng, comarca }): { poble, nom, km } o null. */
export function pobleMesProper(centre, pobles) {
  if (!esPuntValid(centre)) return null;
  let millor = null;
  for (const poble of esLlista(pobles) ? pobles : []) {
    const nom = textNet(poble?.title) || textNet(poble?.name);
    if (!nom || !esPuntValid(poble)) continue;
    const km = distanciaKm(centre, poble);
    if (!millor || km < millor.km) millor = { poble, nom, km };
  }
  return millor;
}

/**
 * El títol de la vista, només amb les dades dels pobles que porta l'app (cap
 * geocodificador): des del zoom 11, el poble més pròxim dins de
 * max(3, 12 − (z − 11) · 2) km com a «{poble} · rodalia»; des del 7 i a 25 km
 * o menys d'un poble, la seua comarca; de més lluny, `nomGeneral`; si no,
 * `nomDeFora`.
 */
export function nomDeLaZona({ centre, zoom, pobles, nomDeFora = '', nomGeneral = '', rodalia = (nom) => `${nom} · rodalia` } = {}) {
  const general = nomGeneral || nomDeFora;
  if (!esPuntValid(centre) || !Number.isFinite(zoom)) return general;
  const proper = pobleMesProper(centre, pobles);
  if (zoom >= 11 && proper && proper.km < Math.max(3, 12 - (zoom - 11) * 2)) return rodalia(proper.nom);
  if (zoom < 7) return general;
  if (proper && proper.km <= 25) return textNet(proper.poble.comarca) || proper.nom;
  return nomDeFora || general;
}

/* ═══ ON VA CADA TARGETA ══════════════════════════════════════════ */

/** Si dues caixes { x, y, w, h } se solapen, amb `marge` píxels de separació. */
export function solapen(a, b, marge = 0) {
  return a.x < b.x + b.w + marge && a.x + a.w + marge > b.x && a.y < b.y + b.h + marge && a.y + a.h + marge > b.y;
}

const tapaElPunt = (caixa, punt, marge) => punt.x > caixa.x - marge && punt.x < caixa.x + caixa.w + marge
  && punt.y > caixa.y - marge && punt.y < caixa.y + caixa.h + marge;

/**
 * La caixa lliure més pròxima a `origen` (píxels del mapa) per a una targeta
 * de `mida` { w, h }: anells creixents al voltant del punt, sense tapar cap
 * caixa `ocupades` ni cap punt de `punts` (el seu inclòs). Amb `limits`
 * { w, h } (la mida del mapa), primer les que hi caben senceres: en un
 * telèfon, una targeta no queda tallada per la vora. Si no en troba cap, a la
 * dreta i davall del punt: la targeta sempre es pot abastar.
 */
export function caixaLliure({ origen, mida, ocupades = [], punts = [], limits = null, marge = 8, radiMaxim = 360, pas = 12 }) {
  const { w, h } = mida;
  const lliure = (caixa) => !ocupades.some((altra) => solapen(altra, caixa, marge)) && !punts.some((punt) => tapaElPunt(caixa, punt, marge));
  const dins = (caixa) => !limits || (caixa.x >= marge && caixa.y >= marge && caixa.x + w <= limits.w - marge && caixa.y + h <= limits.h - marge);
  let fora = null;
  for (let radi = pas; radi <= radiMaxim; radi += pas) {
    const passos = Math.max(8, Math.ceil((2 * Math.PI * radi) / 24));
    for (let k = 0; k < passos; k += 1) {
      // Comença dalt a la dreta i gira en el sentit de les agulles: la primera lliure és la més pròxima.
      const angle = -Math.PI / 4 + (k * 2 * Math.PI) / passos;
      const caixa = { x: Math.round(origen.x + Math.cos(angle) * radi - w / 2), y: Math.round(origen.y + Math.sin(angle) * radi - h / 2), w, h };
      if (!lliure(caixa)) continue;
      if (dins(caixa)) return caixa;
      fora = fora || caixa;
    }
  }
  return fora || { x: Math.round(origen.x + marge * 2), y: Math.round(origen.y + marge * 2), w, h };
}

/** El punt de la vora d'una caixa més pròxim a `origen`: on acaba la línia discontínua. */
export function puntDeLaVora(origen, caixa) {
  return {
    x: Math.min(caixa.x + caixa.w, Math.max(caixa.x, origen.x)),
    y: Math.min(caixa.y + caixa.h, Math.max(caixa.y, origen.y))
  };
}
