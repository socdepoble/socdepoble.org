/**
 * agitacio.js — els patrons dels episodis de conducta (nucli pur).
 *
 * Tot és DESCRIPTIU: recomptes, franges i comparacions amb l'atzar. Cap
 * mesura diu la causa de res; com a molt, dona una pista per a provar alguna
 * cosa i parlar-ho amb l'equip (enfocament DICE: descriure, investigar,
 * crear, avaluar; buscar primer les necessitats que no s'han cobert).
 */
import { horaDe, instantDe, limitsJornada, ordenaPerInstant, sumaDies } from './hores.js';

const MS_MINUT = 60000;
const FINESTRA_MIN = 60;
/* Mínims perquè la comparació amb l'atzar tinga sentit. */
export const MINIM_EPISODIS_ASSOCIACIO = 5;
export const MINIM_JORNADES_ASSOCIACIO = 3;
/* Els apunts que diuen que s'ha cobert la necessitat d'orinar. */
const TIPUS_ORINA = Object.freeze(['miccio', 'escapament', 'absorbent']);

export const FRANGES = Object.freeze([
  Object.freeze({ id: 'mati', etiqueta: 'Matí i migdia (6–16 h)', des: 6, fins: 16 }),
  Object.freeze({ id: 'vesprada', etiqueta: 'Vesprada (16–20 h)', des: 16, fins: 20 }),
  Object.freeze({ id: 'nit', etiqueta: 'Nit (20–6 h)', des: 20, fins: 6 })
]);

const instant = (apunt) => instantDe(apunt.moment, apunt.ofsetMin);
const horaEnter = (apunt) => Number(horaDe(apunt.moment).slice(0, 2));

/** Els episodis de conducta, per ordre. */
export const episodis = (apunts) => ordenaPerInstant(apunts.filter((apunt) => apunt.tipus === 'conducta'));

/** Episodis per hora del rellotge: 24 recomptes (0 h … 23 h). */
export function episodisPerHora(llista) {
  const hores = Array.from({ length: 24 }, () => 0);
  for (const apunt of llista) hores[horaEnter(apunt)] += 1;
  return hores;
}

/** Episodis per franja: { mati, vesprada, nit }. */
export function perFranja(llista) {
  const resultat = Object.fromEntries(FRANGES.map((franja) => [franja.id, 0]));
  for (const apunt of llista) {
    const hora = horaEnter(apunt);
    const franja = FRANGES.find((f) => (f.des < f.fins ? hora >= f.des && hora < f.fins : hora >= f.des || hora < f.fins));
    resultat[franja.id] += 1;
  }
  return resultat;
}

/** Episodis per jornada: { 'AAAA-MM-DD': n }. */
export function episodisPerDia(llista) {
  const resultat = {};
  for (const apunt of llista) resultat[apunt.jornada] = (resultat[apunt.jornada] || 0) + 1;
  return resultat;
}

/* Recompte de valors d'una llista de llistes, del més freqüent al menys. */
function recompte(llistes) {
  const vegades = new Map();
  for (const llista of llistes) for (const valor of new Set(llista || [])) vegades.set(valor, (vegades.get(valor) || 0) + 1);
  return [...vegades].map(([valor, n]) => ({ valor, vegades: n })).sort((a, b) => b.vegades - a.vegades || String(a.valor).localeCompare(String(b.valor)));
}

/** El que passava abans, del més freqüent al menys: [{ valor, vegades }]. */
export const antecedentsFrequents = (llista) => recompte(llista.map((apunt) => apunt.antecedents));

/**
 * Què ha calmat: per a cada acció, quantes vegades s'ha fet i quantes ha
 * acabat amb «es calma prompte» (i el %, sense decimals). Ordenat pel % i
 * després per les vegades.
 */
export function accionsQueCalmen(llista) {
  return recompte(llista.map((apunt) => apunt.accions)).map(({ valor, vegades }) => {
    const calmaPrompte = llista.filter((apunt) => (apunt.accions || []).includes(valor) && apunt.resultat === 'es-calma-prompte').length;
    return { valor, vegades, calmaPrompte, percent: Math.round((calmaPrompte / vegades) * 100) };
  }).sort((a, b) => b.percent - a.percent || b.vegades - a.vegades);
}

/* Unió d'intervals [inici, fi) ordenats, en ms. */
function unix(intervals) {
  const ordenats = intervals.filter(([a, b]) => b > a).sort((x, y) => x[0] - y[0]);
  const resultat = [];
  for (const [a, b] of ordenats) {
    const darrer = resultat[resultat.length - 1];
    if (darrer && a <= darrer[1]) darrer[1] = Math.max(darrer[1], b);
    else resultat.push([a, b]);
  }
  return resultat;
}

const llargada = (intervals) => intervals.reduce((total, [a, b]) => total + (b - a), 0);

function interseccio(as, bs) {
  const resultat = [];
  for (const [a1, a2] of as) {
    for (const [b1, b2] of bs) {
      const inici = Math.max(a1, b1);
      const fi = Math.min(a2, b2);
      if (fi > inici) resultat.push([inici, fi]);
    }
  }
  return unix(resultat);
}

/**
 * Quants episodis acaben amb una micció, un escapament o un canvi
 * d'absorbent dins dels 60 minuts següents a l'inici, comparat amb els que
 * n'esperaríem per atzar: esperat = n × p, on p és la part dels minuts
 * desperts registrats (de dia, en jornades completes) que cauen dins dels
 * 60 minuts d'abans d'un d'eixos apunts.
 * null si hi ha menys de 5 episodis o menys de 3 jornades completes.
 * @returns {null | { n: number, ambOrina: number, esperat: number, p: number }}
 */
export function associacioMiccio(apunts, { persona = {}, jornadesCompletes = [], ofsetDe } = {}) {
  if (jornadesCompletes.length < MINIM_JORNADES_ASSOCIACIO) return null;
  const completes = new Set(jornadesCompletes);
  const llista = episodis(apunts).filter((apunt) => completes.has(apunt.jornada));
  if (llista.length < MINIM_EPISODIS_ASSOCIACIO) return null;
  const orina = apunts.filter((apunt) => TIPUS_ORINA.includes(apunt.tipus)).map(instant);
  const ambOrina = llista.filter((apunt) => {
    const inici = instant(apunt);
    return orina.some((t) => t >= inici && t <= inici + FINESTRA_MIN * MS_MINUT);
  }).length;
  const desperts = unix(jornadesCompletes.map((data) => {
    const limits = limitsJornada(data, apunts, persona, ofsetDe ? { ofsetDe } : undefined);
    return [limits.alcar.instant, limits.adormir.instant];
  }));
  const abansDOrina = unix(orina.map((t) => [t - FINESTRA_MIN * MS_MINUT, t]));
  const total = llargada(desperts);
  const p = total > 0 ? llargada(interseccio(desperts, abansDOrina)) / total : 0;
  return { n: llista.length, ambOrina, esperat: Math.round(llista.length * p * 10) / 10, p: Math.round(p * 1000) / 1000 };
}

/** El text de l'associació, sense valors p ni la paraula «causa». */
export function textAssociacio(resultat) {
  if (!resultat) return null;
  const esperat = String(resultat.esperat).replace('.', ',');
  return `${resultat.ambOrina} de ${resultat.n} episodis van acabar amb una micció, un escapament o un canvi d’absorbent en menys d’una hora. Per atzar n’esperaríem uns ${esperat}. És una pista per a provar d’oferir el vàter abans; parla-ho amb l’equip.`;
}

/**
 * Nits dolentes (2 o més despertars apuntats, o un episodi de nit) i els
 * episodis de l'endemà, comparats amb els de després d'una nit bona.
 */
export function nitsDolentes(apunts, jornadesCompletes = []) {
  const completes = new Set(jornadesCompletes);
  const llista = episodis(apunts);
  const perDia = episodisPerDia(llista);
  const dolentes = [];
  const bones = [];
  for (const data of jornadesCompletes) {
    const endema = sumaDies(data, 1);
    if (!completes.has(endema)) continue;
    const delDia = apunts.filter((apunt) => apunt.jornada === data);
    const despertars = delDia.filter((apunt) => apunt.tipus === 'son' && apunt.event === 'despertar').length;
    const episodiDeNit = delDia.some((apunt) => apunt.tipus === 'conducta' && (horaEnter(apunt) >= 22 || horaEnter(apunt) < 6));
    (despertars >= 2 || episodiDeNit ? dolentes : bones).push(perDia[endema] || 0);
  }
  const mitjana = (llista2) => (llista2.length ? Math.round((llista2.reduce((a, b) => a + b, 0) / llista2.length) * 10) / 10 : null);
  return { nitsDolentes: dolentes.length, nitsBones: bones.length, despresDolenta: mitjana(dolentes), despresBona: mitjana(bones) };
}
