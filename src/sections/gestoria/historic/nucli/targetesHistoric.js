/**
 * targetesHistoric.js — les targetes del director financer de la vista
 * «Històric i IA», sense React: el que diu cada una (títol, subtítol,
 * entradeta, xifra o el perquè no n'hi ha, detall, notes i d'on ix).
 *
 * Onada 6, ordre del Mestre (261009): «un panell de control financer
 * bestial»: caixa, despesa mensual mitjana, consum net, autonomia de caixa
 * (runway), pes de l'IA i provisió d'impostos del trimestre. Les pinta
 * TargetaTauler (la UniversalCard del Tauler), amb la xifra amagada fins que
 * la persona prem l'ull, i cada una té la seua pàgina (PaginaTargeta).
 * Com al Tauler, cap títol ni subtítol porta dades (l'Índex en fa la URL).
 * Cap xifra és escrita: totes ixen de despeses/nucli/serieHistorica.js i
 * impostos/nucli/simulacio.js. Sense dades, el perquè, mai «0,00 €».
 * JS pur: sense DOM ni React.
 */
import { formatData, nomMes } from '../../nucli/dates.js';
import { ETIQUETA_NO_VERIFICAT } from '../../impostos/nucli/simulacio.js';

const ETIQUETA_BANC = Object.freeze({ text: 'Banc', className: 'sdp-badge-system' });
const ETIQUETA_IA = Object.freeze({ text: 'IA', className: 'sdp-badge-system' });
const ETIQUETA_IMPOSTOS = Object.freeze({ text: 'Impostos', className: 'sdp-badge-system' });
const etiqueta = (text) => Object.freeze({ text, className: 'sdp-badge-tag' });
const IMPORT = (valor) => (Number.isSafeInteger(valor) ? { tipus: 'import', valor, moneda: 'EUR' } : null);
const MESOS = (valor) => (typeof valor === 'number' && Number.isFinite(valor) ? { tipus: 'mesos', valor } : null);
const RECOMPTE = (valor) => (typeof valor === 'number' && Number.isFinite(valor) ? { tipus: 'recompte', valor: Math.round(valor) } : null);
const dia = (d) => formatData(d, 'dd/mm/aaaa');

/** Per què un indicador no té xifra. */
export const SENSE_XIFRA_HISTORIC = Object.freeze({
  SENSE_DADES: 'Sense dades: encara no has triat cap extracte del banc.',
  SENSE_SALDO: 'Els extractes no porten cap saldo que es puga llegir.',
  POCS_MESOS: 'Cal almenys un mes sencer d’extractes per a calcular-la.',
  SENSE_CONSUM: 'La caixa no minva: els ingressos cobrixen les eixides i no hi ha consum net que la gaste.'
});
const motiu = (indicador) => SENSE_XIFRA_HISTORIC[indicador?.motiu] ?? SENSE_XIFRA_HISTORIC.SENSE_DADES;

/**
 * El nom d'un tram de la sèrie: «Gener 2025», «1T 2025» o «2025».
 * @param {{ clau: string, any: number, mes?: number, t?: number }} tram
 * @returns {string}
 */
export function nomDelTram(tram) {
  if (Number.isInteger(tram?.mes)) return `${nomMes(tram.mes, 'ca', { majuscula: true })} ${tram.any}`;
  if (Number.isInteger(tram?.t)) return `${tram.t}T ${tram.any}`;
  return String(tram?.any ?? tram?.clau ?? '');
}

/** El text de la cobertura d'un tram. */
export const TEXT_COBERTURA = Object.freeze({ completa: 'Completa', parcial: 'Parcial', cap: 'Sense extractes' });

/* Els últims mesos complets de la sèrie, els de la mitjana dels indicadors. */
const complets = (serie, n) => (serie?.mesos ?? []).filter((m) => m.cobertura === 'completa').slice(-n);

/**
 * Les targetes del director financer.
 * @param {{ serie: object|null, indicadors: object, provisio: { valor: number|null, any?: number, t?: number }|null }} p
 * @returns {object[]} en l'ordre en què es pinten
 */
export function targetesHistoric({ serie, indicadors, provisio }) {
  const ind = indicadors ?? {};
  const base = ind.mesosBase ?? 0;
  const mesosBase = complets(serie, base);
  const finsDe = serie?.caixa?.fins ? ` el ${dia(serie.caixa.fins)}` : '';
  const periodeMitjana = base ? `els últims ${base === 1 ? 'mes sencer' : `${base} mesos sencers`} dels extractes` : 'els mesos sencers dels extractes';
  const trimestre = provisio && Number.isInteger(provisio.t) ? `${provisio.t}T ${provisio.any}` : 'el trimestre';
  return [
    {
      id: 'historic-caixa',
      icona: 'wallet',
      titol: 'Caixa real',
      subtitol: 'El saldo de tots els comptes en euros',
      entradeta: `La suma dels saldos dels teus comptes en euros a la darrera data dels extractes${finsDe}.`,
      xifra: IMPORT(ind.caixa?.valor),
      senseXifra: motiu(ind.caixa),
      etiquetes: [ETIQUETA_BANC, ...(serie?.caixa && !serie.caixa.completa ? [etiqueta('Incompleta')] : [])],
      detall: (serie?.comptes ?? []).map((c) => ({ etiqueta: `Compte ${c.n}`, xifra: IMPORT(c.saldo) })).filter((f) => f.xifra),
      notes: (serie?.comptes ?? []).map((c) => `Compte ${c.n}: entitat ${c.entitat ?? '—'}, acabat en ${c.compte4 ?? '—'}.`),
      font: 'El saldo final de l’últim extracte de cada compte en euros (el peu de la Norma 43 o la columna de saldo del CSV).'
    },
    {
      id: 'historic-despesa',
      icona: 'trendingDown',
      titol: 'Despesa mensual mitjana',
      subtitol: 'El que ix cada mes, de mitjana',
      entradeta: `La mitjana de les eixides de ${periodeMitjana}, sense els traspassos entre comptes propis.`,
      xifra: IMPORT(ind.despesaMensual?.valor),
      senseXifra: motiu(ind.despesaMensual),
      etiquetes: [ETIQUETA_BANC],
      detall: mesosBase.map((m) => ({ etiqueta: nomDelTram(m), xifra: IMPORT(m.eixides) })),
      notes: [],
      font: 'Les eixides dels extractes de cada mes sencer, menys els traspassos entre comptes propis.'
    },
    {
      id: 'historic-consum',
      icona: 'scale',
      titol: 'Consum net mensual',
      subtitol: 'El que gasta la caixa cada mes',
      entradeta: `Les eixides menys les entrades de ${periodeMitjana}, de mitjana. Si és negatiu, la caixa creix.`,
      xifra: IMPORT(ind.consumNet?.valor),
      senseXifra: motiu(ind.consumNet),
      etiquetes: [ETIQUETA_BANC],
      detall: mesosBase.map((m) => ({ etiqueta: nomDelTram(m), xifra: IMPORT(m.eixides - m.entrades) })),
      notes: [],
      font: 'Les entrades i les eixides dels extractes de cada mes sencer, sense els traspassos.'
    },
    {
      id: 'historic-runway',
      icona: 'hourglass',
      titol: 'Autonomia de caixa',
      subtitol: 'Els mesos que aguanta la caixa sense ingressos nous',
      entradeta: 'La caixa real dividida pel consum net mensual: el que els anglesos diuen «runway».',
      xifra: MESOS(ind.runway?.valor),
      senseXifra: motiu(ind.runway),
      etiquetes: [ETIQUETA_BANC],
      detall: [{ etiqueta: 'Caixa real', xifra: IMPORT(ind.caixa?.valor) }, { etiqueta: 'Consum net mensual', xifra: IMPORT(ind.consumNet?.valor) }]
        .filter((f) => f.xifra),
      notes: [],
      font: 'La caixa real i el consum net mensual d’estes mateixes targetes.'
    },
    {
      id: 'historic-ia',
      icona: 'percent',
      titol: 'Pes de l’IA (% de la despesa)',
      subtitol: 'La part de les eixides que va a la intel·ligència artificial',
      entradeta: 'La despesa neta en IA (eixides menys devolucions) sobre totes les eixides del període, sense traspassos, en percentatge arredonit.',
      xifra: RECOMPTE(ind.pesIa?.valor),
      senseXifra: motiu(ind.pesIa),
      etiquetes: [ETIQUETA_IA],
      /* Els cinc proveïdors amb més despesa, amb l'import i el recompte com a xifres: amb l'ull tancat, amagats (també els recomptes). */
      detall: [
        { etiqueta: 'Despesa neta en IA del període', xifra: IMPORT(serie?.ia?.net) },
        { etiqueta: 'Despesa en IA, mitjana mensual', xifra: IMPORT(ind.iaMensual?.valor) },
        { etiqueta: 'Comissions de divisa de compres d’IA', xifra: IMPORT(serie?.ia?.comissionsDivisa) },
        { etiqueta: 'Eixides del període', xifra: IMPORT(serie?.totals?.eixides) },
        ...(serie?.ia?.perProveidor ?? []).slice(0, 5).flatMap((p) => [
          { etiqueta: `${p.nom}: despesa neta`, xifra: IMPORT(p.net) },
          { etiqueta: `${p.nom}: moviments`, xifra: RECOMPTE(p.moviments) }
        ])
      ].filter((f) => f.xifra),
      notes: [],
      font: 'Els moviments classificats com a IA pel catàleg de proveïdors i per les teues regles i reclassificacions.'
    },
    {
      id: 'historic-provisio',
      icona: 'landmark',
      titol: 'Provisió d’impostos',
      subtitol: `Models 303 i 130 · ${trimestre}`,
      entradeta: `El que caldria reservar per a l’IVA (303) i el pagament fraccionat de l’IRPF (130) de ${trimestre}, calculat amb els moviments del banc. ${ETIQUETA_NO_VERIFICAT}.`,
      xifra: IMPORT(provisio?.valor),
      senseXifra: 'Sense extractes del trimestre: no hi ha cap estimació.',
      etiquetes: [ETIQUETA_IMPOSTOS, etiqueta('Estimació')],
      detall: [],
      notes: [ETIQUETA_NO_VERIFICAT, 'Cada despesa necessita la seua factura per a deduir-se.'],
      font: 'La simulació del 303 i del 130 amb les operacions tretes dels moviments del banc i les suposicions de la secció Simulacions.'
    }
  ];
}
