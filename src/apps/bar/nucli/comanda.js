/**
 * El Bar · nucli/comanda.js — la comanda oberta (disseny del Bar §A.3-§A.5).
 *
 *   comanda { id, tornId, origen: { tipus: 'barra' | 'taula' | 'emportar', taulaId? },
 *             comensals?, linies, pagaments, estat: 'oberta' | 'tancada' | 'anullada',
 *             obertaA, atesPer, rev, historial }
 *
 * Totes les funcions són pures: tornen una comanda nova i no toquen la que
 * reben. L'historial només creix: { moment, tipus, liniaId?, abans?, despres?,
 * motiu?, per?, altra? }. `rev` el puja el magatzem en desar (concurrència
 * optimista): ací no es toca.
 *
 * Invariants que es vigilen ací (§A.4):
 *   1. diners en cèntims enters i ≥ 0;
 *   3. una línia marxada només s'anul·la amb motiu; abans de marxar, llevar-la és lliure;
 *   5. moure línies conserva la suma (parteixLinia reparteix el descompte en imports exactes);
 *   mai el pagat pot passar del total (cap operació deixa el pendent en negatiu).
 */
import { aliesNet, errorBar, esCents, esId, esMoment, esSlug, suma, textNet } from './comu.js';
import { ivaDe, nomVariant, variantDe } from './cataleg.js';
import { desglossaIva } from './iva.js';
import {
  TIPUS_DESCOMPTE, brutLinia, compta, convidadaLinia, descompteLinia, mateixaIdentitat, parteixLinia, totalLinia
} from './linia.js';

export const ORIGENS = Object.freeze(['barra', 'taula', 'emportar']);
export const MAX_NOTA = 80;
export const MAX_MOTIU = 80;
export const MAX_QUANTITAT = 999;

const exigeix = (condicio, codi, missatge) => {
  if (!condicio) throw errorBar(codi, missatge);
};

function exigeixMoment(ara) {
  exigeix(esMoment(ara), 'MOMENT', 'Cal el moment de l’operació (ISO 8601).');
}

function exigeixOberta(comanda) {
  exigeix(comanda && comanda.estat === 'oberta', 'NO_OBERTA', 'Esta comanda ja no està oberta.');
}

function motiuNet(motiu) {
  const net = textNet(motiu, MAX_MOTIU);
  exigeix(net, 'SENSE_MOTIU', 'Cal dir el motiu.');
  return net;
}

/** L'origen net: { tipus } o { tipus: 'taula', taulaId }. */
export function origenNet(origen) {
  exigeix(origen && ORIGENS.includes(origen.tipus), 'ORIGEN', 'L’origen ha de ser barra, taula o emportar.');
  if (origen.tipus === 'taula') {
    exigeix(esSlug(origen.taulaId), 'ORIGEN', 'Una comanda de taula necessita la taula.');
    return { tipus: 'taula', taulaId: origen.taulaId };
  }
  return { tipus: origen.tipus };
}

/** Mateix origen (la mateixa taula, o tots dos de barra…). */
export function mateixOrigen(a, b) {
  return a?.tipus === b?.tipus && (a.tipus !== 'taula' || a.taulaId === b.taulaId);
}

function liniaDe(comanda, liniaId) {
  const linia = comanda.linies.find((l) => l.id === liniaId);
  exigeix(linia, 'LINIA', 'Esta línia no és de la comanda.');
  return linia;
}

const ambEsdeveniment = (comanda, esdeveniment) => ({ ...comanda, historial: [...comanda.historial, esdeveniment] });

/**
 * Els totals d'una comanda (o d'un tiquet de venda):
 *   brut, descomptes, convidades i total de les línies que compten;
 *   anul·lats (el brut de les anul·lades, per al tancament);
 *   perIva (desglossament informatiu); pagat i pendent = total − pagat.
 */
export function totals(comanda) {
  const vives = comanda.linies.filter(compta);
  const totalCents = suma(vives, totalLinia);
  const pagatCents = suma(comanda.pagaments || [], (p) => p.importCents);
  return {
    brutCents: suma(vives, brutLinia),
    descomptesCents: suma(vives, descompteLinia),
    convidadesCents: suma(vives, convidadaLinia),
    totalCents,
    anullatsCents: suma(comanda.linies.filter((l) => !compta(l)), brutLinia),
    perIva: desglossaIva(vives, totalLinia),
    pagatCents,
    pendentCents: totalCents - pagatCents
  };
}

function exigeixPagatCobert(comanda) {
  const { pendentCents } = totals(comanda);
  exigeix(pendentCents >= 0, 'PAGAT_SUPERA', 'Ja s’ha cobrat més del que quedaria: primer cal tornar la diferència.');
  return comanda;
}

/** Una comanda nova i buida. */
export function creaComanda({ id, tornId, origen, ara, per, comensals } = {}) {
  exigeix(esId(id), 'ID', 'La comanda necessita un id opac.');
  exigeix(esId(tornId), 'TORN', 'La comanda necessita el torn.');
  exigeixMoment(ara);
  const comanda = {
    id,
    tornId,
    origen: origenNet(origen),
    linies: [],
    pagaments: [],
    estat: 'oberta',
    obertaA: ara,
    atesPer: aliesNet(per),
    rev: 0,
    historial: []
  };
  if (comensals !== undefined) {
    exigeix(Number.isSafeInteger(comensals) && comensals >= 1 && comensals <= 99, 'COMENSALS', 'Els comensals són un enter d’1 a 99.');
    comanda.comensals = comensals;
  }
  return comanda;
}

/**
 * Afig un producte. Si l'última línia idèntica (producte, variant, modificadors,
 * nota i preu) encara és nova i sense descompte, hi suma la quantitat: tornar
 * a tocar el mateix producte suma 1. Si no, una línia nova que CONGELA nom,
 * preu, IVA i cost.
 *   producte, varianteId (la primera si no), modificadors (resolts amb
 *   resolModificadors), quantitat (1), nota, preuCents (només «preu obert»),
 *   costCents (si l'app el sap per escandall), ivaPerDefecte (de l'establiment)
 */
export function afegeixProducte(comanda, {
  producte, varianteId, modificadors = [], quantitat = 1, nota, preuCents, costCents, ivaPerDefecte
} = {}, { ara, idLinia } = {}) {
  exigeixOberta(comanda);
  exigeixMoment(ara);
  exigeix(producte && esSlug(producte.id), 'PRODUCTE', 'Cal un producte de la carta.');
  exigeix(producte.actiu !== false, 'PRODUCTE', 'Este producte no està actiu.');
  const variant = variantDe(producte, varianteId);
  exigeix(variant, 'VARIANT', 'Esta variant no és del producte.');
  exigeix(Number.isSafeInteger(quantitat) && quantitat >= 1 && quantitat <= MAX_QUANTITAT, 'QUANTITAT', 'La quantitat és un enter d’1 a 999.');
  exigeix(Array.isArray(modificadors) && modificadors.every((m) => esCents(m?.deltaCents) && m.deltaCents >= 0), 'MODIFICADORS', 'Modificadors no vàlids.');
  let preuUnitariCents;
  if (producte.preuObert) {
    exigeix(esCents(preuCents) && preuCents >= 0, 'PREU', 'Un producte de preu obert necessita el preu.');
    preuUnitariCents = preuCents;
  } else {
    preuUnitariCents = variant.preuCents + suma(modificadors, (m) => m.deltaCents);
  }
  const ivaPercent = ivaDe(producte, ivaPerDefecte);
  exigeix(Number.isSafeInteger(ivaPercent) && ivaPercent >= 0 && ivaPercent <= 100, 'IVA', 'Falta l’IVA (el del producte o el de l’establiment).');
  const cost = esCents(costCents) ? costCents : variant.costCents;
  const notaNeta = textNet(nota, MAX_NOTA);
  const candidata = {
    producteId: producte.id,
    varianteId: variant.id,
    preuUnitariCents,
    nota: notaNeta || undefined,
    modificadors: modificadors.map(({ grupId, opcioId, nomCongelat, deltaCents }) => ({ grupId, opcioId, nomCongelat, deltaCents }))
  };

  /* L'última línia amb la mateixa identitat: si és nova i neta, s'hi suma. */
  const ultima = [...comanda.linies].reverse().find((l) => mateixaIdentitat(l, candidata));
  if (ultima && ultima.estat === 'nova' && !ultima.descompte && !ultima.convidada) {
    exigeix(ultima.quantitat + quantitat <= MAX_QUANTITAT, 'QUANTITAT', 'Massa unitats en una línia.');
    const linies = comanda.linies.map((l) => (l.id === ultima.id ? { ...l, quantitat: l.quantitat + quantitat } : l));
    return ambEsdeveniment({ ...comanda, linies }, { moment: ara, tipus: 'quantitat', liniaId: ultima.id, abans: ultima.quantitat, despres: ultima.quantitat + quantitat });
  }

  exigeix(esId(idLinia) && !comanda.linies.some((l) => l.id === idLinia), 'ID', 'La línia nova necessita un id que no siga de cap altra.');
  const varianteNom = nomVariant(producte, variant);
  const linia = {
    id: idLinia,
    producteId: producte.id,
    varianteId: variant.id,
    categoriaId: producte.categoriaId,
    nomCongelat: producte.nom,
    ...(varianteNom ? { varianteNomCongelat: varianteNom } : {}),
    preuUnitariCents,
    ivaPercent,
    ...(esCents(cost) ? { costUnitariCents: cost } : {}),
    quantitat,
    modificadors: candidata.modificadors,
    ...(notaNeta ? { nota: notaNeta } : {}),
    estat: 'nova',
    afegidaA: ara
  };
  return ambEsdeveniment({ ...comanda, linies: [...comanda.linies, linia] }, { moment: ara, tipus: 'afegeix', liniaId: idLinia, despres: quantitat });
}

/**
 * Canvia la quantitat d'una línia NOVA (encara no marxada). 0 la lleva:
 * abans de marxar, llevar és lliure. Una línia marxada no baixa: s'anul·la.
 */
export function canviaQuantitat(comanda, liniaId, quantitat, { ara } = {}) {
  exigeixOberta(comanda);
  exigeixMoment(ara);
  const linia = liniaDe(comanda, liniaId);
  exigeix(linia.estat === 'nova', 'MARXADA', 'Esta línia ja ha marxat: per a llevar-ne, cal anul·lar-la amb motiu.');
  exigeix(Number.isSafeInteger(quantitat) && quantitat >= 0 && quantitat <= MAX_QUANTITAT, 'QUANTITAT', 'La quantitat és un enter de 0 a 999.');
  if (quantitat === linia.quantitat) return comanda;
  const linies = quantitat === 0
    ? comanda.linies.filter((l) => l.id !== liniaId)
    : comanda.linies.map((l) => (l.id === liniaId ? { ...l, quantitat } : l));
  const esdeveniment = { moment: ara, tipus: 'quantitat', liniaId, abans: linia.quantitat, despres: quantitat };
  return exigeixPagatCobert(ambEsdeveniment({ ...comanda, linies }, esdeveniment));
}

/**
 * Suma (o resta, amb `delta` negatiu) unitats a una línia nova sobre la
 * comanda d'ARA, no sobre la que es veia en tocar (BAR-R5): dos + seguits
 * fan dues unitats. Mai baixa de 0 (0 la lleva); si la línia ja no hi és
 * (un − anterior l'ha llevada), no canvia res.
 */
export function sumaQuantitat(comanda, liniaId, delta, { ara } = {}) {
  exigeix(Number.isSafeInteger(delta) && delta !== 0, 'QUANTITAT', 'Cal sumar o restar unitats senceres.');
  exigeixOberta(comanda);
  const linia = comanda.linies.find((l) => l.id === liniaId);
  if (!linia) return comanda;
  return canviaQuantitat(comanda, liniaId, Math.max(0, linia.quantitat + delta), { ara });
}

/** Lleva una línia nova (quantitat 0). */
export function llevaLinia(comanda, liniaId, opcions) {
  return canviaQuantitat(comanda, liniaId, 0, opcions);
}

/** Canvia la nota d'una línia nova (per a la barra o la cuina). */
export function canviaNota(comanda, liniaId, nota, { ara } = {}) {
  exigeixOberta(comanda);
  exigeixMoment(ara);
  const linia = liniaDe(comanda, liniaId);
  exigeix(linia.estat === 'nova', 'MARXADA', 'Esta línia ja ha marxat: la nota ja no es canvia.');
  const neta = textNet(nota, MAX_NOTA);
  if ((linia.nota || null) === neta) return comanda;
  const linies = comanda.linies.map((l) => {
    if (l.id !== liniaId) return l;
    const nova = { ...l };
    if (neta) nova.nota = neta;
    else delete nova.nota;
    return nova;
  });
  return ambEsdeveniment({ ...comanda, linies }, { moment: ara, tipus: 'nota', liniaId });
}

/** Marxa: les línies noves passen a marxades (servides o enviades). */
export function marxa(comanda, { ara } = {}) {
  exigeixOberta(comanda);
  exigeixMoment(ara);
  if (!comanda.linies.some((l) => l.estat === 'nova')) return comanda;
  const linies = comanda.linies.map((l) => (l.estat === 'nova' ? { ...l, estat: 'marxada' } : l));
  return ambEsdeveniment({ ...comanda, linies }, { moment: ara, tipus: 'marxa' });
}

/**
 * Anul·la una línia MARXADA, sencera o en part (`quantitat`, amb `idLinia`
 * per a la part anul·lada). El motiu és obligatori i queda a l'historial i
 * al tancament. Una línia nova no s'anul·la: es lleva.
 */
export function anullaLinia(comanda, liniaId, { motiu, ara, quantitat, idLinia, per } = {}) {
  exigeixOberta(comanda);
  exigeixMoment(ara);
  const net = motiuNet(motiu);
  const linia = liniaDe(comanda, liniaId);
  exigeix(linia.estat !== 'anullada', 'ANULLADA', 'Esta línia ja està anul·lada.');
  exigeix(linia.estat === 'marxada', 'NOVA', 'Esta línia encara no ha marxat: es pot llevar sense motiu.');
  const q = quantitat === undefined ? linia.quantitat : quantitat;
  exigeix(Number.isSafeInteger(q) && q >= 1 && q <= linia.quantitat, 'QUANTITAT', 'No es poden anul·lar més unitats de les que té la línia.');
  const marca = (l) => ({ ...l, estat: 'anullada', motiuAnullacio: net, anulladaA: ara });
  let linies;
  let idAnullada = liniaId;
  if (q === linia.quantitat) {
    linies = comanda.linies.map((l) => (l.id === liniaId ? marca(l) : l));
  } else {
    exigeix(esId(idLinia) && !comanda.linies.some((l) => l.id === idLinia), 'ID', 'La part anul·lada necessita un id nou.');
    const [resta, part] = parteixLinia(linia, q, idLinia);
    idAnullada = idLinia;
    linies = comanda.linies.flatMap((l) => (l.id === liniaId ? [resta, marca(part)] : [l]));
  }
  const esdeveniment = { moment: ara, tipus: 'anulla', liniaId: idAnullada, abans: linia.quantitat, despres: linia.quantitat - q, motiu: net, ...(per ? { per: aliesNet(per) } : {}) };
  return exigeixPagatCobert(ambEsdeveniment({ ...comanda, linies }, esdeveniment));
}

/**
 * Posa (o lleva, amb null) un descompte a una línia:
 *   { tipus: 'percent', valor: 1-100, motiu } · { tipus: 'import', valor: cèntims ≤ brut, motiu }
 */
export function aplicaDescompte(comanda, liniaId, descompte, { ara, per } = {}) {
  exigeixOberta(comanda);
  exigeixMoment(ara);
  const linia = liniaDe(comanda, liniaId);
  exigeix(compta(linia), 'ANULLADA', 'Una línia anul·lada no porta descompte.');
  exigeix(!linia.convidada, 'CONVIDADA', 'Esta línia ja està convidada.');
  const abans = descompteLinia(linia);
  let nova;
  if (descompte === null) {
    nova = { ...linia };
    delete nova.descompte;
  } else {
    exigeix(descompte && TIPUS_DESCOMPTE.includes(descompte.tipus), 'DESCOMPTE', 'El descompte és percent o import.');
    const brut = brutLinia(linia);
    if (descompte.tipus === 'percent') {
      exigeix(Number.isSafeInteger(descompte.valor) && descompte.valor >= 1 && descompte.valor <= 100, 'DESCOMPTE', 'El percentatge és un enter d’1 a 100.');
    } else {
      exigeix(esCents(descompte.valor) && descompte.valor >= 1 && descompte.valor <= brut, 'DESCOMPTE', 'L’import del descompte no pot passar del de la línia.');
    }
    nova = { ...linia, descompte: { tipus: descompte.tipus, valor: descompte.valor, motiu: motiuNet(descompte.motiu) } };
  }
  const linies = comanda.linies.map((l) => (l.id === liniaId ? nova : l));
  const esdeveniment = {
    moment: ara, tipus: 'descompte', liniaId, abans, despres: descompteLinia(nova),
    ...(nova.descompte ? { motiu: nova.descompte.motiu } : {}), ...(per ? { per: aliesNet(per) } : {})
  };
  return exigeixPagatCobert(ambEsdeveniment({ ...comanda, linies }, esdeveniment));
}

/** Convida una línia sencera (amb motiu): el total de la línia passa a 0 i queda al tancament. */
export function convida(comanda, liniaId, { motiu, ara, per } = {}) {
  exigeixOberta(comanda);
  exigeixMoment(ara);
  const net = motiuNet(motiu);
  const linia = liniaDe(comanda, liniaId);
  exigeix(compta(linia), 'ANULLADA', 'Una línia anul·lada no es pot convidar.');
  exigeix(!linia.convidada, 'CONVIDADA', 'Esta línia ja està convidada.');
  const nova = { ...linia, convidada: { motiu: net } };
  delete nova.descompte;
  const linies = comanda.linies.map((l) => (l.id === liniaId ? nova : l));
  const esdeveniment = { moment: ara, tipus: 'convida', liniaId, abans: totalLinia(linia), despres: 0, motiu: net, ...(per ? { per: aliesNet(per) } : {}) };
  return exigeixPagatCobert(ambEsdeveniment({ ...comanda, linies }, esdeveniment));
}

/**
 * Mou línies (o part) d'una comanda a una altra: «Mou a una altra taula»,
 * «Ajunta taules», dividir el compte. La suma es conserva: total(origen) +
 * total(destí) després === abans (invariant 5).
 *   seleccio [{ liniaId, quantitat }] · nouIdLinia() per a les parts i per a
 *   un id que ja existisca al destí.
 *   op (opcional, un id) · LA MARCA DEL MOVIMENT (correcció del refutador,
 *   261011, T2). Les dues comandes es desen en dues transaccions (primer el
 *   destí): amb `op`, cada esdeveniment «mou» de les DUES bandes porta la
 *   mateixa marca, i el del destí diu a més de quina línia ve (`deLinia`) i
 *   quantes unitats tenia (`abans`). Amb això, si un tall deixa el destí
 *   escrit i l'origen sencer, es pot acabar el moviment sense endevinar res
 *   (migMoviment.js). Sense `op`, els esdeveniments de sempre.
 * @returns {{ origen: object, desti: object }}
 */
export function mouLinies(origen, desti, seleccio, { ara, nouIdLinia, op } = {}) {
  exigeixOberta(origen);
  exigeixOberta(desti);
  exigeixMoment(ara);
  exigeix(origen.id !== desti.id, 'MATEIXA', 'L’origen i el destí són la mateixa comanda.');
  exigeix(Array.isArray(seleccio) && seleccio.length > 0, 'SELECCIO', 'Tria almenys una línia.');
  exigeix(new Set(seleccio.map((s) => s.liniaId)).size === seleccio.length, 'SELECCIO', 'Una línia només es pot triar una vegada.');
  const nouId = () => {
    const id = typeof nouIdLinia === 'function' ? nouIdLinia() : null;
    exigeix(esId(id), 'ID', 'Cal un generador d’ids per a les línies noves.');
    return id;
  };
  exigeix(op === undefined || esId(op), 'ID', 'La marca del moviment és un id.');
  const marca = op === undefined ? {} : { op };
  const idsDesti = new Set(desti.linies.map((l) => l.id));
  let liniesOrigen = [...origen.linies];
  const mogudes = [];
  const esdevenimentsOrigen = [];
  const esdevenimentsDesti = [];
  for (const { liniaId, quantitat } of seleccio) {
    const linia = liniaDe(origen, liniaId);
    exigeix(compta(linia), 'ANULLADA', 'Una línia anul·lada no es mou.');
    const q = quantitat === undefined ? linia.quantitat : quantitat;
    exigeix(Number.isSafeInteger(q) && q >= 1 && q <= linia.quantitat, 'QUANTITAT', 'No es poden moure més unitats de les que té la línia.');
    let movent;
    if (q === linia.quantitat) {
      liniesOrigen = liniesOrigen.filter((l) => l.id !== liniaId);
      movent = idsDesti.has(linia.id) ? { ...linia, id: nouId() } : linia;
    } else {
      const [resta, part] = parteixLinia(linia, q, nouId());
      liniesOrigen = liniesOrigen.map((l) => (l.id === liniaId ? resta : l));
      movent = part;
    }
    idsDesti.add(movent.id);
    mogudes.push(movent);
    esdevenimentsOrigen.push({ moment: ara, tipus: 'mou', liniaId, abans: linia.quantitat, despres: linia.quantitat - q, altra: desti.id, ...marca });
    esdevenimentsDesti.push({
      moment: ara, tipus: 'mou', liniaId: movent.id, despres: q, altra: origen.id, ...(op === undefined ? {} : { op, deLinia: liniaId, abans: linia.quantitat })
    });
  }
  const nouOrigen = exigeixPagatCobert({ ...origen, linies: liniesOrigen, historial: [...origen.historial, ...esdevenimentsOrigen] });
  const nouDesti = { ...desti, linies: [...desti.linies, ...mogudes], historial: [...desti.historial, ...esdevenimentsDesti] };
  return { origen: nouOrigen, desti: nouDesti };
}

/**
 * L'historial d'una comanda que es descarta, guardat a la que se n'ha emportat
 * les línies (correcció del refutador, 261011, T7). Quan «Mou» o «Dividix»
 * buiden l'origen, l'origen s'esborra, i amb ell es perdia qui havia fet cada
 * descompte, quan va marxar, quan es va obrir i qui l'atenia. Sense canviar
 * l'esquema (l'historial ja és una llista oberta d'esdeveniments): el destí
 * rep un esdeveniment «absorbix» ({ altra: l'origen, obertaA, per, comensals? })
 * i una còpia de cada esdeveniment de l'origen marcada amb `de` (l'id de la
 * comanda on va passar; si ja venia heretat, es conserva el primer). Les
 * línies, els pagaments i els totals no canvien. Els esdeveniments amb `de`
 * no són moviments propis del destí (migMoviment.js els salta).
 */
export function heretaHistorial(desti, origen, { ara } = {}) {
  exigeixMoment(ara);
  const absorbix = {
    moment: ara, tipus: 'absorbix', altra: origen.id, obertaA: origen.obertaA, per: origen.atesPer,
    ...(origen.comensals === undefined ? {} : { comensals: origen.comensals })
  };
  const heretats = origen.historial.map((esdeveniment) => ({ ...esdeveniment, de: esdeveniment.de || origen.id }));
  return { ...desti, historial: [...desti.historial, absorbix, ...heretats] };
}

/**
 * Una comanda que passa al torn següent (estava a la nota de traspàs).
 * Només n'hi passen sense pagaments (vegeu traspas.js): ací es comprova.
 */
export function adoptaComanda(comanda, tornId, { ara } = {}) {
  exigeixOberta(comanda);
  exigeixMoment(ara);
  exigeix(esId(tornId), 'TORN', 'Cal el torn nou.');
  exigeix(comanda.pagaments.length === 0, 'AMB_PAGAMENTS', 'Una comanda amb pagaments no passa de torn.');
  if (comanda.tornId === tornId) return comanda;
  return ambEsdeveniment({ ...comanda, tornId }, { moment: ara, tipus: 'traspas', altra: comanda.tornId });
}

/**
 * La comanda oberta on va un producte quan la ruta no en nomena cap:
 *   barra     la de barra oberta més recent
 *   taula     la primera que es va obrir a eixa taula
 *   emportar  cap (cada comanda per emportar és nova)
 * null si no n'hi ha: el primer producte la crea.
 */
export function comandaObertaDe(comandes, origen) {
  const obertes = (comandes || []).filter((c) => c.estat === 'oberta' && mateixOrigen(c.origen, origen));
  if (!obertes.length || origen?.tipus === 'emportar') return null;
  const ordenades = [...obertes].sort((a, b) => (a.obertaA < b.obertaA ? -1 : 1));
  return origen.tipus === 'barra' ? ordenades[ordenades.length - 1] : ordenades[0];
}

/** Una comanda buida (sense cap línia ni pagament) es pot descartar: no hi ha res a guardar. */
export function esDescartable(comanda) {
  return Boolean(comanda) && comanda.estat === 'oberta' && comanda.linies.length === 0 && comanda.pagaments.length === 0;
}
