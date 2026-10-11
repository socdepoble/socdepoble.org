/**
 * El Bar · nucli/migMoviment.js — DETECTAR un «Mou» o un «Dividix» que s'ha
 * quedat a mitges (correcció del refutador, 261011, T2; decisió de la mateixa
 * nit: «detecta i avisa», sense escriure res).
 *
 * EL PROBLEMA. Moure línies toca DUES comandes i el magatzem les desa en dues
 * transaccions: primer el destí (amb les línies) i després l'origen (sense).
 * Es fa en eixe ordre perquè un tall entremig DUPLIQUE i no perda: la línia
 * que es veu dues vegades es pot arreglar; la que no es veu, no. Però el
 * duplicat es pot cobrar dues vegades si ningú el veu.
 *
 * LA MARCA. Cada moviment porta un id (`op`, mouLinies) que queda escrit a
 * l'historial de les DUES comandes. L'esdeveniment del destí diu, a més, de
 * quina línia de l'origen ve (`deLinia`), quantes unitats tenia (`abans`) i
 * quantes se'n va emportar (`despres`). Per tant:
 *
 *   el destí porta la marca, l'origen NO, i l'origen encara té eixes unitats
 *   ⇒ les unitats són a les dues bandes.
 *
 * QUÈ ES FA: NOMÉS AVISAR (detectaMigsMoviments). Res s'escriu, res es
 * retalla, res es descarta: la persona ho veu a la pantalla, amb les comandes
 * i les línies, i ho arregla ella (lleva o anul·la la línia on sobra). L'avís
 * dura mentre el duplicat hi siga i se'n va sol quan ja no hi és.
 *
 *   motiu  A_MITGES       origen i destí oberts
 *          ORIGEN_COBRAT  l'origen ja és un tiquet del torn (sense la marca)
 *                         i el destí encara porta les línies
 *          DESTI_COBRAT   el destí ja és un tiquet del torn i l'origen
 *                         encara porta les línies
 *          ERROR          la detecció ha fallat (dades malmeses): no se sap
 *
 * LÍMITS CONEGUTS: els moviments d'abans de la marca no es detecten; un
 * origen cobrat en un torn ANTERIOR tampoc (només es miren els tiquets del
 * torn obert); i si l'origen sencer s'ha mogut després a una altra comanda,
 * el rastre es perd.
 *
 * REPARACIÓ PREPARADA, DESENDOLLADA (acabaOrigen). Refà l'origen que hauria
 * escrit el moviment. Està provada, però CAP codi de producció la crida, per
 * decisió de la nit del 261011: endollada a la càrrega, dues lectures
 * concurrents podien deixar a la pantalla l'origen vell i acabar en un
 * cobrament doble. Activar-la demana ordre del Mestre i tindre resolt, abans:
 *   1. que la càrrega siga d'un sol vol (cap doble carrega() concurrent);
 *   3. que el descart de l'origen mire el `rev` del disc;
 *   4. que es compare la línia sencera (un descompte posat després del tall
 *      es perdria), no només la quantitat i l'estat;
 *   5. que es detecte el destí ja cobrat o absorbit abans de reparar.
 *
 * Els esdeveniments heretats d'una altra comanda (`de`, heretaHistorial) no
 * són moviments propis d'esta com a ORIGEN; com a destí sí que compten: les
 * línies que va rebre la comanda absorbida són ara en esta.
 *
 * Tot és pur i res no llança: una dada malmesa és, com a molt, un ERROR.
 */
import { compta, parteixLinia } from './linia.js';
import { totals } from './comanda.js';

const llista = (valor) => (Array.isArray(valor) ? valor : []);
const esRebut = (esdeveniment) => esdeveniment?.tipus === 'mou' && typeof esdeveniment.op === 'string'
  && typeof esdeveniment.deLinia === 'string' && typeof esdeveniment.altra === 'string';

/**
 * Els moviments marcats que una comanda (o un tiquet) ha REBUT, en ordre:
 * [{ op, origenId, esdeveniments }]. Amb `ambHeretats`, també els que va
 * rebre una comanda que esta ha absorbit (per defecte, només els propis).
 */
export function movimentsRebuts(desti, { ambHeretats = false } = {}) {
  const perOp = new Map();
  for (const esdeveniment of llista(desti?.historial)) {
    if (!esRebut(esdeveniment) || (esdeveniment.de && !ambHeretats)) continue;
    const clau = `${esdeveniment.op}|${esdeveniment.altra}`;
    if (!perOp.has(clau)) perOp.set(clau, { op: esdeveniment.op, origenId: esdeveniment.altra, esdeveniments: [] });
    perOp.get(clau).esdeveniments.push(esdeveniment);
  }
  return [...perOp.values()];
}

/** Cert si la comanda (o el tiquet) ja porta anotat este moviment com a seu. */
export function teOperacio(comanda, op) {
  return llista(comanda?.historial).some((esdeveniment) => esdeveniment?.op === op && !esdeveniment.de);
}

/* Les unitats d'un moviment que l'origen ENCARA té: [{ nom, quantitat }]. Una línia que ja no hi
   és, que està anul·lada o que ja s'ha quedat amb les unitats que li tocaven no hi compta
   (algú ho ha arreglat a mà, o el moviment d'eixa línia sí que es va acabar). */
function encaraALOrigen(origen, moviment) {
  const duplicades = [];
  for (const rebut of moviment.esdeveniments) {
    const linia = llista(origen?.linies).find((l) => l?.id === rebut.deLinia);
    if (!linia || !compta(linia) || !Number.isSafeInteger(linia.quantitat)) continue;
    const quedaven = Number.isSafeInteger(rebut.abans) && Number.isSafeInteger(rebut.despres) ? rebut.abans - rebut.despres : 0;
    const sobren = Math.min(linia.quantitat - quedaven, Number.isSafeInteger(rebut.despres) ? rebut.despres : linia.quantitat);
    if (sobren > 0) duplicades.push({ nom: String(linia.nomCongelat ?? ''), quantitat: sobren });
  }
  return duplicades;
}

/* Les unitats d'un moviment que el destí encara porta (per id de línia; si la línia ha canviat
   d'id en una absorció, no es pot saber: es dona per bona la de l'esdeveniment). */
function encaraAlDesti(desti, moviment) {
  return moviment.esdeveniments.some((rebut) => {
    if (rebut.de) return true;
    const linia = llista(desti?.linies).find((l) => l?.id === rebut.liniaId);
    return Boolean(linia) && compta(linia);
  });
}

const descriu = (comanda) => ({
  id: comanda.id,
  origen: comanda.origen && typeof comanda.origen === 'object' ? { ...comanda.origen } : null,
  obertaA: typeof comanda.obertaA === 'string' ? comanda.obertaA : null,
  numero: Number.isSafeInteger(comanda.numero) ? comanda.numero : null
});

/**
 * Els moviments a mitges que es veuen entre les comandes obertes i els tiquets
 * del torn: [{ op, motiu, origenId, destiId, origen, desti, linies }], on
 * `origen` i `desti` són { id, origen: { tipus, taulaId? }, obertaA, numero }
 * (numero, si ja és un tiquet) i `linies`, [{ nom, quantitat }] les unitats
 * que poden estar dues vegades. Pura; MAI llança ni toca res: si les dades
 * estan malmeses torna un sol { motiu: 'ERROR' }.
 */
export function detectaMigsMoviments(comandes, tiquets) {
  try {
    const obertes = llista(comandes).filter((c) => c && typeof c === 'object' && c.estat === 'oberta');
    const cobrats = llista(tiquets).filter((t) => t && typeof t === 'object' && t.tipus === 'venda');
    const obertaPerId = new Map(obertes.map((c) => [c.id, c]));
    const tiquetPerId = new Map(cobrats.map((t) => [t.id, t]));
    const trobats = [];
    const vistos = new Set();
    const mira = (desti, destiCobrat) => {
      for (const moviment of movimentsRebuts(desti, { ambHeretats: true })) {
        const clau = `${moviment.op}|${moviment.origenId}`;
        if (vistos.has(clau) || moviment.origenId === desti.id) continue;
        const oberta = obertaPerId.get(moviment.origenId);
        const cobrada = oberta ? null : tiquetPerId.get(moviment.origenId);
        const origen = oberta || cobrada;
        if (!origen || teOperacio(origen, moviment.op)) continue;
        const linies = encaraALOrigen(origen, moviment);
        if (linies.length === 0 || (!destiCobrat && !encaraAlDesti(desti, moviment))) continue;
        /* Tots dos cobrats: ja no hi ha res a evitar ací (i els tiquets no es toquen). */
        if (destiCobrat && cobrada) continue;
        vistos.add(clau);
        trobats.push({
          op: moviment.op,
          motiu: destiCobrat ? 'DESTI_COBRAT' : (cobrada ? 'ORIGEN_COBRAT' : 'A_MITGES'),
          origenId: origen.id,
          destiId: desti.id,
          origen: descriu(origen),
          desti: descriu(desti),
          linies
        });
      }
    };
    for (const comanda of obertes) mira(comanda, false);
    for (const tiquet of cobrats) mira(tiquet, true);
    return trobats;
  } catch {
    return [{ op: null, motiu: 'ERROR', origenId: null, destiId: null, origen: null, desti: null, linies: [] }];
  }
}

/**
 * REPARACIÓ PREPARADA, DESENDOLLADA (vegeu la capçalera: cap codi de producció
 * la crida). L'origen tal com l'hauria deixat el moviment, o el motiu del dubte.
 * @returns {{ ok: true, origen: object } | { ok: false, motiu: string }}
 */
export function acabaOrigen(origen, desti, moviment) {
  if (!Array.isArray(origen?.linies) || !Array.isArray(origen?.historial) || !Array.isArray(moviment?.esdeveniments)) {
    return { ok: false, motiu: 'ORIGEN_CANVIAT' };
  }
  let linies = [...origen.linies];
  const esdeveniments = [];
  for (const rebut of moviment.esdeveniments) {
    const q = rebut.despres;
    const alDesti = llista(desti?.linies).find((l) => l?.id === rebut.liniaId);
    if (!alDesti || !compta(alDesti) || alDesti.quantitat !== q) return { ok: false, motiu: 'DESTI_CANVIAT' };
    const linia = linies.find((l) => l?.id === rebut.deLinia);
    if (!linia || !compta(linia) || linia.quantitat !== rebut.abans || !Number.isSafeInteger(q) || q < 1 || q > linia.quantitat) {
      return { ok: false, motiu: 'ORIGEN_CANVIAT' };
    }
    linies = q === linia.quantitat
      ? linies.filter((l) => l.id !== linia.id)
      : linies.map((l) => (l.id === linia.id ? parteixLinia(linia, q, rebut.liniaId)[0] : l));
    esdeveniments.push({ moment: rebut.moment, tipus: 'mou', liniaId: linia.id, abans: linia.quantitat, despres: linia.quantitat - q, altra: desti.id, op: moviment.op });
  }
  const acabat = { ...origen, linies, historial: [...origen.historial, ...esdeveniments] };
  if (totals(acabat).pendentCents < 0) return { ok: false, motiu: 'ORIGEN_PAGAT' };
  return { ok: true, origen: acabat };
}
