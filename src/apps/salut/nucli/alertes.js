/**
 * alertes.js — les alertes suaus (nucli pur).
 *
 * Cada regla és un objecte congelat:
 *   { id, nivell: 'informa' | 'parla-ho' | 'urgent', text, perQue, criteri, avalua(context) → null | { dades } }
 * Les alertes només DERIVEN: «parla-ho amb el metge», «truca al 112». Cap
 * text porta el nom de cap malaltia ni recomana res. Els llindars viuen ací,
 * amb la seua font al `criteri`, i no es poden canviar des de la UI.
 * No hi ha notificacions: la persona les veu quan obri «Resum i avisos», i
 * les pot descartar per a eixe període. Sempre hi ha el peu: que no hi haja
 * cap avís no vol dir que tot vaja bé.
 */
import { diesEntre, instantDe, ordenaPerInstant, sumaDies } from './hores.js';
import { datesDe, diesSenseDeposicio, metriquesJornada } from './metriques.js';

export const NIVELLS_ALERTA = Object.freeze(['informa', 'parla-ho', 'urgent']);
export const PEU_ALERTES = 'Que no hi haja cap avís no vol dir que tot vaja bé.';
export const ETIQUETA_NIVELL = Object.freeze({ informa: 'Per a saber-ho', 'parla-ho': 'Parla-ho', urgent: 'Urgent' });

const FEBRE = 378;
const FEBRE_REPETIDA = 372;
const PUJADA_SOBRE_HABITUAL = 11;
const BEU_POC_ML = 1000;
const REFERENCIA_BEURE_ML = 1600;
const ML_PER_KG = 40;
const NPI_GRAN = 33;
const NPI_JOVE = 20;

const regla = (definicio) => Object.freeze(definicio);
const minuts = (a, b) => Math.abs(instantDe(b.moment, b.ofsetMin) - instantDe(a.moment, a.ofsetMin)) / 60000;
const del = (ctx, tipus) => ctx.apunts.filter((apunt) => apunt.tipus === tipus && ctx.dins(apunt.jornada));

function febre(ctx) {
  const preses = del(ctx, 'observacio').filter((a) => a.que === 'temperatura' && Number.isSafeInteger(a.temperaturaDecimes));
  const altes = preses.filter((a) => a.temperaturaDecimes >= FEBRE);
  if (altes.length) return { maximaDecimes: Math.max(...altes.map((a) => a.temperaturaDecimes)), motiu: 'una presa alta' };
  const repetides = preses.filter((a) => a.temperaturaDecimes >= FEBRE_REPETIDA);
  if (repetides.some((a, i) => repetides.some((b, j) => j !== i && minuts(a, b) <= 24 * 60))) {
    return { maximaDecimes: Math.max(...repetides.map((a) => a.temperaturaDecimes)), motiu: 'dos preses en 24 hores' };
  }
  const habitual = ctx.persona.tempHabitualDecimes;
  if (Number.isSafeInteger(habitual)) {
    const pujades = preses.filter((a) => a.temperaturaDecimes >= habitual + PUJADA_SOBRE_HABITUAL);
    if (pujades.length) return { maximaDecimes: Math.max(...pujades.map((a) => a.temperaturaDecimes)), motiu: 'un grau per damunt de l’habitual' };
  }
  return null;
}

export const REGLES = Object.freeze([
  regla({
    id: 'risc', nivell: 'urgent',
    text: 'Si hi ha perill ara mateix, truca al 112. Si no, parla-ho amb l’equip que el porta.',
    perQue: 'Has apuntat una caiguda o un moment de perill.',
    criteri: 'Qualsevol episodi amb perill o qualsevol caiguda apuntada.',
    avalua: (ctx) => {
      const n = del(ctx, 'conducta').filter((a) => (a.risc || []).length > 0).length
        + del(ctx, 'observacio').filter((a) => a.que === 'caiguda').length;
      return n ? { dades: { vegades: n } } : null;
    }
  }),
  regla({
    id: 'canvi-brusc', nivell: 'parla-ho',
    text: 'Ha canviat de pressa. Un canvi brusc pot tindre una causa física que cal mirar: parla-ho hui amb el metge o infermeria.',
    perQue: 'Hi ha un dia amb el doble d’episodis que la mitjana dels set dies d’abans, o has apuntat que està diferent de colp.',
    criteri: 'Episodis del dia ≥ 2 × la mitjana dels 7 dies anteriors (amb 3 dies apuntats com a mínim), o una observació «canvi brusc». Un canvi brusc i fluctuant és un avís conegut en persones grans.',
    avalua: (ctx) => {
      const observacions = del(ctx, 'observacio').filter((a) => a.que === 'canvi-brusc').length;
      if (observacions) return { dades: { observacions } };
      for (const data of ctx.dates) {
        const n = ctx.apunts.filter((a) => a.tipus === 'conducta' && a.jornada === data).length;
        if (!n) continue;
        const base = datesDe(sumaDies(data, -7), 7).filter((d) => ctx.apunts.some((a) => a.jornada === d));
        if (base.length < 3) continue;
        const mitjana = base.reduce((total, d) => total + ctx.apunts.filter((a) => a.tipus === 'conducta' && a.jornada === d).length, 0) / base.length;
        if (n >= 2 * mitjana) return { dades: { data, episodis: n, mitjana: Math.round(mitjana * 10) / 10 } };
      }
      return null;
    }
  }),
  regla({
    id: 'febre', nivell: 'parla-ho',
    text: 'Té la temperatura alta. Parla-ho hui amb el metge.',
    perQue: 'Has apuntat una temperatura alta.',
    criteri: 'Una presa ≥ 37,8 °C, dos ≥ 37,2 °C en 24 hores, o 1,1 °C per damunt de la seua habitual (criteris per a persones grans en centres de llarga estada).',
    avalua: (ctx) => {
      const resultat = febre(ctx);
      return resultat ? { dades: resultat } : null;
    }
  }),
  regla({
    id: 'orina-diferent', nivell: 'parla-ho',
    text: 'Has apuntat canvis en l’orina o en orinar. Parla-ho amb el metge.',
    perQue: 'Has apuntat sang visible, cremor o dolor en orinar, o orina tèrbola amb la temperatura alta.',
    criteri: 'Sang visible, cremor o dolor; o orina tèrbola amb temperatura alta. En persones grans no es fa servir la tira de l’orina per a decidir res: ho ha de mirar el metge.',
    avalua: (ctx) => {
      const miccions = del(ctx, 'miccio');
      const n = miccions.filter((a) => (a.aspecte || []).includes('sang-visible') || (a.molesties || []).some((m) => m === 'cremor' || m === 'dolor')).length;
      if (n) return { dades: { vegades: n } };
      const terboles = miccions.filter((a) => (a.aspecte || []).includes('terbola')).length;
      return terboles && febre(ctx) ? { dades: { vegades: terboles, ambTemperatura: true } } : null;
    }
  }),
  regla({
    id: 'beu-poc', nivell: 'parla-ho',
    text: 'Ha begut poc dos dies seguits. Parla-ho amb el metge o infermeria.',
    perQue: 'Dos jornades completes seguides amb menys d’1 litre de beguda apuntada.',
    criteri: 'Menys de 1.000 ml en dos jornades completes seguides. No s’avalua si el metge ha posat un límit de líquids.',
    avalua: (ctx) => {
      if (ctx.persona.limitLiquidsMl) return null;
      const completes = ctx.metriques.filter((m) => m.completa);
      for (const m of completes) {
        const seguent = completes.find((x) => x.data === sumaDies(m.data, 1));
        if (seguent && m.ingestaTotal < BEU_POC_ML && seguent.ingestaTotal < BEU_POC_ML) {
          return { dades: { dies: [m.data, seguent.data], ml: [m.ingestaTotal, seguent.ingestaTotal] } };
        }
      }
      return null;
    }
  }),
  regla({
    id: 'davall-referencia', nivell: 'informa',
    text: 'Ha begut menys del que solen recomanar per a persones grans, si el metge no ha dit una altra cosa.',
    perQue: 'La mitjana de les jornades completes és de menys d’1,6 litres.',
    criteri: 'Referència de 1,6 l de begudes al dia per a persones grans (ESPEN 2019; 2,0 l en homes). No es pregunta el sexe: es fa servir la xifra més baixa. No s’avalua amb un límit de líquids.',
    avalua: (ctx) => {
      if (ctx.persona.limitLiquidsMl) return null;
      const completes = ctx.metriques.filter((m) => m.completa);
      if (!completes.length) return null;
      const mitjana = Math.round(completes.reduce((t, m) => t + m.ingestaTotal, 0) / completes.length);
      return mitjana < REFERENCIA_BEURE_ML ? { dades: { mitjanaMl: mitjana } } : null;
    }
  }),
  regla({
    id: 'nicturia', nivell: 'informa',
    text: 'S’alça a orinar a la nit sovint. Porta el full al metge; també és bo parlar de com evitar caigudes de nit.',
    perQue: 'Hi ha dos o més jornades completes amb 2 o més miccions de nit.',
    criteri: '2 o més miccions de nit en 2 o més jornades completes (terminologia ICS 2019).',
    avalua: (ctx) => {
      const n = ctx.metriques.filter((m) => m.completa && m.nicturia >= 2).length;
      return n >= 2 ? { dades: { jornades: n } } : null;
    }
  }),
  regla({
    id: 'orina-nit', nivell: 'informa',
    text: 'Bona part de l’orina és de nit. Porta el full al metge.',
    perQue: 'La part de l’orina feta de nit passa de la referència.',
    criteri: 'NPi > 33 % en persones grans (20 % si no ho és), amb jornades completes i totes les miccions mesurades (ICS 2019).',
    avalua: (ctx) => {
      const valors = ctx.metriques.map((m) => m.indexPoliuriaNocturna).filter(Number.isFinite);
      if (!valors.length) return null;
      const referencia = ctx.persona.majorDe65 === false ? NPI_JOVE : NPI_GRAN;
      const mitjana = Math.round((valors.reduce((a, b) => a + b, 0) / valors.length) * 10) / 10;
      return mitjana > referencia ? { dades: { percent: mitjana, referencia } } : null;
    }
  }),
  regla({
    id: 'molta-orina', nivell: 'informa',
    text: 'Orina molt en un dia. Porta el full al metge.',
    perQue: 'Una jornada passa de 40 ml per kg de pes.',
    criteri: 'Més de 40 ml per kg en 24 hores (ICS 2019). Només si s’ha posat el pes.',
    avalua: (ctx) => {
      const valors = ctx.metriques.map((m) => m.mlPerKg24h).filter(Number.isFinite);
      const maxim = valors.length ? Math.max(...valors) : 0;
      return maxim > ML_PER_KG ? { dades: { mlPerKg: maxim } } : null;
    }
  }),
  regla({
    id: 'ventre', nivell: 'parla-ho',
    text: 'Fa dies que no fa de ventre o li costa. El restrenyiment pot fer que estiga més inquiet: parla-ho amb infermeria.',
    perQue: 'Fa 3 dies o més de l’última deposició apuntada, o les últimes són molt dures.',
    criteri: '3 dies o més sense deposició, o Bristol 1–2 en 2 de les 3 últimes. Només si ja s’apunten les deposicions.',
    tipus: 'deposicio',
    avalua: (ctx) => {
      const dies = diesSenseDeposicio(ctx.apunts, ctx.fins);
      if (dies !== null && dies >= 3) return { dades: { dies } };
      const darreres = ordenaPerInstant(ctx.apunts.filter((a) => a.tipus === 'deposicio' && a.jornada <= ctx.fins)).slice(-3);
      const dures = darreres.filter((a) => a.bristol <= 2).length;
      return dures >= 2 ? { dades: { dures } } : null;
    }
  }),
  regla({
    id: 'medicacio-rebutjada', nivell: 'parla-ho',
    text: 'Ha deixat preses de medicació. Parla-ho amb el metge abans de canviar res.',
    perQue: 'Dos preses o més no s’han pres en tres dies.',
    criteri: '2 o més preses rebutjades o oblidades en 3 dies.',
    tipus: 'medicacio',
    avalua: (ctx) => {
      const tresDies = new Set(datesDe(sumaDies(ctx.fins, -2), 3));
      const n = ctx.apunts.filter((a) => a.tipus === 'medicacio' && tresDies.has(a.jornada) && (a.estat === 'rebutjada' || a.estat === 'oblidada')).length;
      return n >= 2 ? { dades: { preses: n } } : null;
    }
  }),
  regla({
    id: 'pell', nivell: 'parla-ho',
    text: 'Has apuntat la pell ferida. Parla-ho amb infermeria.',
    perQue: 'Un canvi d’absorbent amb la pell ferida.',
    criteri: 'Qualsevol canvi d’absorbent amb la pell ferida.',
    avalua: (ctx) => {
      const n = del(ctx, 'absorbent').filter((a) => a.pell === 'ferida').length;
      return n ? { dades: { vegades: n } } : null;
    }
  }),
  regla({
    id: 'escapaments-augmenten', nivell: 'informa',
    text: 'Hi ha més escapaments que l’altra vegada. Porta-ho al metge.',
    perQue: 'Els escapaments per dia d’este període són la meitat més que els del període anterior.',
    criteri: 'Escapaments per dia ≥ 1,5 × els del període anterior.',
    avalua: (ctx) => {
      const ordenats = (ctx.periodes || []).slice().sort((a, b) => (a.inici < b.inici ? -1 : 1));
      const i = ordenats.findIndex((p) => p.inici <= ctx.fins && ctx.fins <= sumaDies(p.inici, p.dies - 1));
      if (i < 1) return null;
      const perDia = (periode) => {
        const dates = new Set(datesDe(periode.inici, periode.dies));
        const ambDades = [...dates].filter((d) => ctx.apunts.some((a) => a.jornada === d)).length;
        if (!ambDades) return null;
        return ctx.apunts.filter((a) => a.tipus === 'escapament' && dates.has(a.jornada)).length / ambDades;
      };
      const ara = perDia(ordenats[i]);
      const abans = perDia(ordenats[i - 1]);
      return ara !== null && abans && ara >= 1.5 * abans ? { dades: { ara: Math.round(ara * 10) / 10, abans: Math.round(abans * 10) / 10 } } : null;
    }
  })
]);

/** La clau amb què es descarta una alerta per a un període. */
export const clauDescart = (id, des, fins) => `${id}@${des}..${fins}`;

/**
 * Les alertes d'una finestra de jornades [des, fins].
 * @param {object} opcions
 * @param {object[]} opcions.apunts tots, amb `jornada`
 * @param {Map|object} [opcions.jornades] el registre de jornades (completa)
 * @param {object} [opcions.persona]
 * @param {string} opcions.des
 * @param {string} opcions.fins
 * @param {object[]} [opcions.periodes]
 * @param {string[]} [opcions.descartades] claus de clauDescart
 * @param {string[]} [opcions.tipusApagats] tipus d'apunt apagats (les seues regles no s'avaluen)
 * @param {Function} [opcions.ofsetDe]
 * @returns {{ alertes: object[], descartades: number, peu: string }}
 */
export function avaluaAlertes({ apunts, jornades, persona = {}, des, fins, periodes = [], descartades = [], tipusApagats = [], ofsetDe }) {
  const dates = datesDe(des, Math.max(1, diesEntre(des, fins) + 1));
  const conjunt = new Set(dates);
  const ctx = {
    apunts, persona, des, fins, dates, periodes,
    dins: (data) => conjunt.has(data),
    metriques: dates.map((data) => metriquesJornada(data, apunts, { persona, jornades, ofsetDe }))
  };
  const descart = new Set(descartades);
  const alertes = [];
  let amagades = 0;
  for (const r of REGLES) {
    if (r.tipus && tipusApagats.includes(r.tipus)) continue;
    const resultat = r.avalua(ctx);
    if (!resultat) continue;
    if (descart.has(clauDescart(r.id, des, fins))) {
      amagades += 1;
      continue;
    }
    alertes.push(Object.freeze({ id: r.id, nivell: r.nivell, text: r.text, perQue: r.perQue, criteri: r.criteri, dades: Object.freeze(resultat.dades) }));
  }
  const ordre = (a) => NIVELLS_ALERTA.length - NIVELLS_ALERTA.indexOf(a.nivell);
  alertes.sort((a, b) => ordre(a) - ordre(b));
  return { alertes, descartades: amagades, peu: PEU_ALERTES };
}
