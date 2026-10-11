/**
 * El Bar · nucli/fullTancament.js — el que ix del tancament del torn
 * (disseny del Bar §A.5-§A.6): la còpia de seguretat del dia, en mans de qui
 * la fa. Cap xarxa: l'app només ho ofereix per a desar.
 *
 *   exportaTancament(torn)        → sdp.bar.tancament.v1 (JSON, contracte
 *                                   compartit amb el lot dels sentinelles)
 *   fullTancament(torn, tiquets)  → el model de full per a utils/fulls
 *                                   (fulles «Resum», «Per producte»,
 *                                   «Moviments» i «Anul·lacions»; amb la
 *                                   carta, també «Consum d'ingredients»)
 */
import { errorBar, esCents, esId, esMoment, esSlug } from './comu.js';
import { compta, totalLinia } from './linia.js';
import { textNumero } from './cobrament.js';
import { consumDeVendes } from './consum.js';

export const ESQUEMA_TANCAMENT = 'sdp.bar.tancament.v1';

/** sdp.bar.tancament.v1 a partir d'un torn tancat. */
export function exportaTancament(torn) {
  if (!torn || torn.estat !== 'tancat' || !torn.resum) throw errorBar('TORN', 'Només s’exporta un torn tancat.');
  const r = torn.resum;
  return {
    schema: ESQUEMA_TANCAMENT,
    tornId: torn.id,
    obertA: torn.obertA,
    tancatA: torn.tancatA,
    diferenciaCaixaCents: torn.diferenciaCaixaCents,
    resum: {
      vendesPerMetode: { efectiu: r.vendesPerMetode.efectiu, targeta: r.vendesPerMetode.targeta, altre: r.vendesPerMetode.altre },
      tiquets: r.tiquets,
      tiquetMitjaCents: r.tiquetMitjaCents,
      devolucionsCents: r.devolucionsCents,
      anullacions: { nombre: r.anullacions.nombre, importCents: r.anullacions.importCents },
      descomptesCents: r.descomptesCents,
      convidadesCents: r.convidadesCents,
      perCategoria: r.perCategoria.map(({ categoriaId, nom, unitats, importCents }) => ({ categoriaId, nom, unitats, importCents })),
      perProducte: r.perProducte.map(({ producteId, nom, unitats, importCents, costCents }) => ({ producteId, nom, unitats, importCents, costCents }))
    }
  };
}

/** Comprova la forma de sdp.bar.tancament.v1. @returns {{ ok, errors }} */
export function validaTancament(json) {
  const errors = [];
  if (!json || typeof json !== 'object') return { ok: false, errors: ['ha de ser un objecte'] };
  if (json.schema !== ESQUEMA_TANCAMENT) errors.push(`schema ha de ser ${ESQUEMA_TANCAMENT}`);
  if (!esId(json.tornId)) errors.push('tornId');
  if (!esMoment(json.obertA) || !esMoment(json.tancatA)) errors.push('obertA i tancatA són moments ISO');
  if (!esCents(json.diferenciaCaixaCents)) errors.push('diferenciaCaixaCents');
  const r = json.resum;
  if (!r || typeof r !== 'object') return { ok: false, errors: [...errors, 'resum'] };
  for (const metode of ['efectiu', 'targeta', 'altre']) if (!esCents(r.vendesPerMetode?.[metode])) errors.push(`resum.vendesPerMetode.${metode}`);
  for (const camp of ['tiquets', 'tiquetMitjaCents', 'devolucionsCents', 'descomptesCents', 'convidadesCents']) if (!esCents(r[camp])) errors.push(`resum.${camp}`);
  if (!esCents(r.anullacions?.nombre) || !esCents(r.anullacions?.importCents)) errors.push('resum.anullacions');
  if (!Array.isArray(r.perCategoria) || r.perCategoria.some((c) => !esSlug(c.categoriaId) || typeof c.nom !== 'string' || !esCents(c.unitats) || !esCents(c.importCents))) errors.push('resum.perCategoria');
  if (!Array.isArray(r.perProducte) || r.perProducte.some((p) => !esSlug(p.producteId) || typeof p.nom !== 'string' || !esCents(p.unitats)
    || !esCents(p.importCents) || !(p.costCents === null || esCents(p.costCents)))) errors.push('resum.perProducte');
  return { ok: errors.length === 0, errors };
}

const dosXifres = (n) => String(n).padStart(2, '0');

/** L'hora local d'un moment ISO ('HH:MM'): la del dispositiu que fa el tancament. */
export function horaLocal(moment) {
  const data = new Date(moment);
  return `${dosXifres(data.getHours())}:${dosXifres(data.getMinutes())}`;
}

/**
 * El model de full (utils/fulls/model.js) del torn tancat.
 * @param {object} torn  torn tancat
 * @param {object[]} tiquets  els tiquets del torn (per a les anul·lacions i devolucions)
 * @param {{ hora?: (iso: string) => string, carta?: object }} [opcions]  l'hora local (les proves la
 *   fixen) i, Onada 12 (261011; ordres 261011_0130, punt 6), la carta: amb ella, una cinquena
 *   fulla, «Consum d'ingredients» (nucli/consum.js: el consum teòric del rebost del bar segons
 *   els escandalls de la carta d'ara; al final, el venut sense escandall). Sense, les quatre de sempre.
 */
export function fullTancament(torn, tiquets = [], { hora = horaLocal, carta = null } = {}) {
  if (!torn || torn.estat !== 'tancat' || !torn.resum) throw errorBar('TORN', 'Només es fa el full d’un torn tancat.');
  const r = torn.resum;
  const nomCategoria = new Map(r.perCategoria.map((c) => [c.categoriaId, c.nom]));
  const resum = [
    ['Fons inicial', r.fonsInicialCents, ''],
    ['Vendes en efectiu', r.vendesPerMetode.efectiu, ''],
    ['Vendes amb targeta (datàfon)', r.vendesPerMetode.targeta, ''],
    ['Vendes amb altres mètodes', r.vendesPerMetode.altre, ''],
    ['Total vendes', r.totalVendesCents, r.tiquets],
    ['Tiquet mitjà', r.tiquetMitjaCents, ''],
    ['Devolucions', r.devolucionsCents, r.devolucions],
    ['Anul·lacions', r.anullacions.importCents, r.anullacions.nombre],
    ['Descomptes', r.descomptesCents, ''],
    ['Convidades', r.convidadesCents, ''],
    ['Entrades de caixa', r.entradesCents, ''],
    ['Eixides de caixa', r.eixidesCents, ''],
    ['Efectiu esperat', r.efectiuEsperatCents, ''],
    ['Efectiu comptat', torn.arqueig.totalCents, ''],
    ['Diferència de caixa', torn.diferenciaCaixaCents, ''],
    ['Comandes obertes que passen al torn següent', r.obertesCents, r.comandesObertes],
    ['Fons que es deixa', torn.traspas?.fonsDeixatCents ?? '', '']
  ];
  const delTorn = tiquets.filter((t) => t.tornId === torn.id && t.estat === 'tancada');
  const devolucions = delTorn.filter((t) => t.tipus === 'devolucio')
    .flatMap((t) => t.linies.map((l) => [hora(t.tancatA), t.numero, 'Devolució', l.nomCongelat, l.quantitat, -totalLinia(l) || 0, t.motiu]));
  /* Les anul·lacions ixen del resum congelat (BAR-R3): les mateixes que la
     fila «Anul·lacions», també les de les comandes que passen de torn. Un
     torn tancat abans que el resum en portara el detall les llig dels tiquets. */
  const anullacions = Array.isArray(r.anullacions.detall)
    ? r.anullacions.detall.map((a) => [hora(a.moment), a.numero, 'Anul·lació', a.nom, a.quantitat, a.importCents, a.motiu])
    : delTorn.filter((t) => t.tipus !== 'devolucio').flatMap((t) => t.linies.filter((l) => !compta(l))
      .map((l) => [hora(l.anulladaA || t.tancatA), t.numero, 'Anul·lació', l.nomCongelat, l.quantitat, l.preuUnitariCents * l.quantitat, l.motiuAnullacio || '']));
  /* Per número de nota; les de comandes obertes (sense número), al final. */
  const ordre = (numero) => (numero === null ? Number.MAX_SAFE_INTEGER : numero);
  const incidencies = [...anullacions, ...devolucions].sort((a, b) => ordre(a[1]) - ordre(b[1]));
  return {
    fulles: [
      {
        nom: 'Resum',
        columnes: [{ titol: 'Concepte', tipus: 'text', amplada: 44 }, { titol: 'Import', tipus: 'import' }, { titol: 'Nombre', tipus: 'nombre' }],
        files: resum
      },
      {
        nom: 'Per producte',
        columnes: [
          { titol: 'Producte', tipus: 'text' }, { titol: 'Categoria', tipus: 'text' }, { titol: 'Unitats', tipus: 'nombre' },
          { titol: 'Import', tipus: 'import' }, { titol: 'Cost', tipus: 'import' }
        ],
        files: r.perProducte.map((p) => [p.nom, nomCategoria.get(p.categoriaId) || p.categoriaId || '', p.unitats, p.importCents, p.costCents ?? ''])
      },
      {
        nom: 'Moviments',
        columnes: [{ titol: 'Hora', tipus: 'hora' }, { titol: 'Tipus', tipus: 'text' }, { titol: 'Motiu', tipus: 'text' }, { titol: 'Import', tipus: 'import' }],
        files: torn.moviments.map((m) => [hora(m.moment), m.tipus === 'entrada' ? 'Entrada' : 'Eixida', m.motiu, m.importCents])
      },
      {
        nom: 'Anul·lacions',
        columnes: [
          { titol: 'Hora', tipus: 'hora' }, { titol: 'Nota', tipus: 'text' }, { titol: 'Tipus', tipus: 'text' }, { titol: 'Producte', tipus: 'text' },
          { titol: 'Unitats', tipus: 'nombre' }, { titol: 'Import', tipus: 'import' }, { titol: 'Motiu', tipus: 'text' }
        ],
        files: incidencies.map(([h, numero, ...resta]) => [h, numero === null ? 'Comanda oberta' : textNumero(numero), ...resta])
      },
      ...(carta ? [fullaDeConsum(consumDeVendes(delTorn, carta))] : [])
    ]
  };
}

/* La fulla «Consum d'ingredients»: una fila per ingredient i, darrere, el venut que no té escandall. */
function fullaDeConsum({ ingredients, senseEscandall }) {
  return {
    nom: 'Consum d’ingredients',
    columnes: [
      { titol: 'Ingredient o producte', tipus: 'text', amplada: 32 }, { titol: 'Unitat', tipus: 'text' },
      { titol: 'Quantitat neta', tipus: 'nombre' }, { titol: 'Quantitat amb minva', tipus: 'nombre' }, { titol: 'Nota', tipus: 'text', amplada: 44 }
    ],
    files: [
      ...ingredients.map((i) => [i.nom, i.unitatBase, i.quantitat, i.quantitatBruta, '']),
      ...senseEscandall.map((p) => [p.nom, 'u', p.unitats, '', 'Venut sense escandall: no se’n sap el consum'])
    ]
  };
}
