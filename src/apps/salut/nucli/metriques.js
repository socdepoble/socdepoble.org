/**
 * metriques.js — les mesures d'una jornada i d'un període (nucli pur).
 *
 * Terminologia de la nit (ICS 2019), amb paraules planeres:
 *   · vegades de dia (freqüència diürna): miccions des de la primera després
 *     d'alçar-se fins a l'última abans d'adormir-se, ambdues incloses;
 *   · vegades de nit (nictúria): miccions entre adormir-se i alçar-se, sense
 *     la primera del matí (que ja és de la jornada següent);
 *   · orina de nit (NUV): les de la nit més la primera del matí següent;
 *   · orina en 24 h: des de DESPRÉS de la primera micció del matí fins a la
 *     primera de l'endemà, inclosa (la mateixa finestra que l'orina de nit);
 *   · NPi = orina de nit / orina en 24 h; Ni = orina de nit / micció més gran.
 *
 * Regla general: cap volum ni cap índex sense una jornada COMPLETA (la
 * família diu que ho ha apuntat tot), amb TOTES les miccions mesurades i amb
 * la primera micció de l'endemà mesurada. Si no, el volum és null i
 * `motiuSenseVolums` diu per què: mai una xifra feta amb forats.
 */
import { diesEntre, instantDe, limitsJornada, ordenaPerInstant, periodeDe, sumaDies } from './hores.js';

const arrodonix = (valor, decimals) => {
  const factor = 10 ** decimals;
  return Math.round(valor * factor) / factor;
};
const suma = (llista) => llista.reduce((total, valor) => total + valor, 0);
const esMesurada = (apunt) => apunt.mesura === 'mesurat' && Number.isSafeInteger(apunt.volumMl);
const instant = (apunt) => instantDe(apunt.moment, apunt.ofsetMin);
const delTipus = (apunts, tipus) => apunts.filter((apunt) => apunt.tipus === tipus);

/* Una jornada completa segons el registre de jornades (Map o objecte). */
function esCompleta(jornades, data) {
  const registre = jornades instanceof Map ? jornades.get(data) : jornades?.[data];
  return registre?.completa === true;
}

export const MOTIUS_SENSE_VOLUMS = Object.freeze({
  'no-completa': 'La jornada no està marcada com a completa.',
  'sense-miccions': 'No hi ha cap micció apuntada.',
  cobertura: 'Hi ha miccions sense mesurar.',
  'sense-mati-seguent': 'Falta la primera micció del matí següent, mesurada.'
});

/**
 * Les mesures d'una jornada.
 * @param {string} data la jornada
 * @param {object[]} apunts tots els apunts, amb `jornada` (assignaJornades)
 * @param {{ persona?: object, jornades?: Map|object, ofsetDe?: Function }} [opcions]
 */
export function metriquesJornada(data, apunts, { persona = {}, jornades = new Map(), ofsetDe } = {}) {
  const delDia = ordenaPerInstant(apunts.filter((apunt) => apunt.jornada === data));
  const limits = limitsJornada(data, apunts, persona, ofsetDe ? { ofsetDe } : undefined);
  const miccions = delTipus(delDia, 'miccio');
  const dia = miccions.filter((apunt) => periodeDe(apunt, limits) === 'dia');
  const nit = miccions.filter((apunt) => periodeDe(apunt, limits) === 'nit');
  const mesurades = miccions.filter(esMesurada);
  const cobertura = miccions.length ? Math.round((mesurades.length / miccions.length) * 100) : null;
  const completa = esCompleta(jornades, data);

  /* La finestra de 24 h: sense la primera del matí d'esta jornada, amb la primera de l'endemà. */
  const primeraEndema = ordenaPerInstant(delTipus(apunts.filter((apunt) => apunt.jornada === sumaDies(data, 1)), 'miccio'))[0] || null;
  let motiuSenseVolums = null;
  if (!completa) motiuSenseVolums = 'no-completa';
  else if (!miccions.length) motiuSenseVolums = 'sense-miccions';
  else if (cobertura !== 100) motiuSenseVolums = 'cobertura';
  else if (!primeraEndema || !esMesurada(primeraEndema)) motiuSenseVolums = 'sense-mati-seguent';

  let volums = { volum24h: null, volumNocturn: null, volumMaxim: null, volumMitja: null, indexPoliuriaNocturna: null, indexNicturia: null, mlPerKg24h: null };
  if (!motiuSenseVolums) {
    const finestra = [...dia.slice(1), ...nit, primeraEndema].map((apunt) => apunt.volumMl);
    const volum24h = suma(finestra);
    const volumNocturn = suma(nit.map((apunt) => apunt.volumMl)) + primeraEndema.volumMl;
    const volumMaxim = Math.max(...finestra);
    volums = {
      volum24h,
      volumNocturn,
      volumMaxim,
      volumMitja: Math.round(volum24h / finestra.length),
      indexPoliuriaNocturna: volum24h > 0 ? arrodonix((volumNocturn / volum24h) * 100, 1) : null,
      indexNicturia: volumMaxim > 0 ? arrodonix(volumNocturn / volumMaxim, 2) : null,
      mlPerKg24h: Number.isFinite(persona.pesKg) && persona.pesKg > 0 ? arrodonix(volum24h / persona.pesKg, 1) : null
    };
  }

  /* Intervals entre miccions de dia, en minuts reals (amb l'ofset). */
  const intervals = dia.slice(1).map((apunt, i) => (instant(apunt) - instant(dia[i])) / 60000);

  const begudes = delTipus(delDia, 'ingesta');
  const begut = begudes.filter((apunt) => !apunt.rebutjada);
  const ingestaPerTipus = {};
  for (const apunt of begut) ingestaPerTipus[apunt.beguda] = (ingestaPerTipus[apunt.beguda] || 0) + apunt.volumMl;
  /* El vespre acaba quan se'n va al llit per a passar la nit (no quan hi torna després d'un despertar). */
  const fiVespre = limits.gitar ? limits.gitar.instant : limits.adormir.instant;
  const ingestaVespre = suma(begut.filter((apunt) => instant(apunt) < fiVespre && instant(apunt) >= fiVespre - 3 * 3600000).map((a) => a.volumMl));
  const ingestaTotal = suma(begut.map((apunt) => apunt.volumMl));

  const urgencies = miccions.map((apunt) => apunt.urgencia).filter(Number.isSafeInteger);
  const deposicions = delTipus(delDia, 'deposicio');

  return Object.freeze({
    data,
    completa,
    limits,
    miccions: miccions.length,
    mesurades: mesurades.length,
    cobertura,
    frequenciaDiurna: dia.length,
    nicturia: nit.length,
    frequencia24h: dia.length + nit.length,
    ...volums,
    motiuSenseVolums,
    intervalMitjaMin: intervals.length ? Math.round(suma(intervals) / intervals.length) : null,
    intervalMesLlargMin: intervals.length ? Math.max(...intervals) : null,
    ingestaTotal,
    ingestaPerTipus: Object.freeze(ingestaPerTipus),
    ingestaVespre,
    begudesRebutjades: begudes.length - begut.length,
    /* No és un balanç: no compta la suor, la respiració, el menjar ni els escapaments. */
    diferenciaApuntada: completa && cobertura !== null && cobertura >= 80
      ? ingestaTotal - suma(mesurades.map((apunt) => apunt.volumMl)) : null,
    escapaments: delTipus(delDia, 'escapament').length,
    canvisAbsorbent: delTipus(delDia, 'absorbent').length,
    urgenciaMitjana: urgencies.length ? arrodonix(suma(urgencies) / urgencies.length, 1) : null,
    deposicions: deposicions.length,
    bristol: Object.freeze(deposicions.map((apunt) => apunt.bristol)),
    episodis: delTipus(delDia, 'conducta').length
  });
}

/** El text de la cobertura: «100 %», «parcial (60 %)» o «—». */
export function textCobertura(metriques) {
  if (metriques.cobertura === null) return '—';
  return metriques.cobertura === 100 ? '100 %' : `parcial (${metriques.cobertura} %)`;
}

/* Les claus numèriques que tenen mitjana de període. */
export const CLAUS_MITJANA = Object.freeze(['frequenciaDiurna', 'nicturia', 'frequencia24h', 'volum24h', 'volumNocturn',
  'indexPoliuriaNocturna', 'indexNicturia', 'volumMaxim', 'volumMitja', 'mlPerKg24h', 'ingestaTotal', 'escapaments',
  'canvisAbsorbent', 'deposicions', 'episodis']);
const DECIMALS_MITJANA = Object.freeze({ indexPoliuriaNocturna: 1, indexNicturia: 2, mlPerKg24h: 1 });

/** Les dates d'un període: des de `des`, `dies` dies seguits. */
export const datesDe = (des, dies) => Array.from({ length: dies }, (_, i) => sumaDies(des, i));

/**
 * Les mesures de cada jornada d'un període i la mitjana de les jornades
 * COMPLETES (per a cada mesura, només les que la tenen calculada).
 */
export function metriquesPeriode(des, dies, apunts, opcions) {
  const jornades = datesDe(des, dies).map((data) => metriquesJornada(data, apunts, opcions));
  const completes = jornades.filter((m) => m.completa);
  const mitjana = {};
  for (const clau of CLAUS_MITJANA) {
    const valors = completes.map((m) => m[clau]).filter((valor) => Number.isFinite(valor));
    mitjana[clau] = valors.length ? arrodonix(suma(valors) / valors.length, DECIMALS_MITJANA[clau] ?? 1) : null;
  }
  return Object.freeze({ jornades: Object.freeze(jornades), completes: completes.length, mitjana: Object.freeze(mitjana) });
}

/**
 * Dies seguits sense fer de ventre fins a `fins`, comptats per jornades.
 * null si mai s'ha apuntat cap deposició (no es pot saber).
 */
export function diesSenseDeposicio(apunts, fins) {
  const jornades = apunts.filter((apunt) => apunt.tipus === 'deposicio' && apunt.jornada && apunt.jornada <= fins).map((a) => a.jornada).sort();
  if (!jornades.length) return null;
  return diesEntre(jornades[jornades.length - 1], fins);
}
