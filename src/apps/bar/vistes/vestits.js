/**
 * El Bar · vistes/vestits.js — la intel·ligència de dades del Bar vestida
 * amb les formes de l'ESQUELET COMÚ (ordre del Mestre, 261002: sinergies
 * T4/T8). El Bar no pinta cap graella ni cap llista: només passa a
 * l'esquelet articles, categories, línies i col·leccions ja vestits.
 *
 *   article    { id, nom, categoriaId, secundari?, valor?, imatge?, estat?, insignia?, alergens? (només el TPV) }
 *   categoria  { id, nom, icona?, visible, ordre }
 *   linia      { id, articleId, quantitat, nom, detall?, valor?, estat? }
 *   colleccio  { id, nom, comptador, secundari? }
 *
 * El TPV (vistes/Tpv.jsx, ordre del Mestre, 261006) parla les mateixes
 * formes: articlesDelTpv, tiquetDeComanda i tiquetsOberts. Les funcions que
 * la Caixa i el TPV compartixen viuen ací perquè cap vista les duplique.
 *
 * Els imports es formen ací (formatEuros): l'esquelet no sap de cèntims.
 */
import {
  Beer, Coffee, CupSoda, GlassWater, IceCreamCone, Martini, Sandwich, Soup, Utensils, UtensilsCrossed, Wheat, Wine
} from 'lucide-react';
import { formatEuros } from '../../../utils/diners.js';
import { ordenaAlergens } from '../../../utils/productes/producteUniversal.js';
import { cartaDelCanal, grupsDe, teGrupObligatori } from '../nucli/cataleg.js';
import { totals } from '../nucli/comanda.js';
import { brutLinia, totalLinia } from '../nucli/linia.js';

/* Les icones de categoria que coneix el Bar (noms de lucide de la carta). GlassWater: els combinats de La Parròquia. */
const ICONES = Object.freeze({ Beer, Coffee, CupSoda, GlassWater, IceCreamCone, Martini, Sandwich, Soup, Utensils, UtensilsCrossed, Wheat, Wine });

export const euros = (cents) => formatEuros(cents);

/** «3 línies», «1 línia». */
export const textLinies = (n) => `${n} ${n === 1 ? 'línia' : 'línies'}`;

/** Les categories de la carta amb la icona feta component (cap color per categoria). */
export function categoriesVestides(carta) {
  return (carta?.categories || []).map((c) => ({
    id: c.id, nom: c.nom, ordre: c.ordre, visible: c.visible,
    ...(c.icona && Object.hasOwn(ICONES, c.icona) ? { icona: ICONES[c.icona] } : {})
  }));
}

/** El camí de la foto definitiva (§A.10); sense foto, el marcador 1:1 de l'esquelet. */
export function imatgeDe(producte, establiment) {
  if (producte?.imatge?.estat !== 'definitiva') return undefined;
  return `/assets/uploads/empresa/${establiment?.slug || 'el-meu-bar'}/bar/${producte.categoriaId}/${producte.imatge.slug}.webp`;
}

/** El valor de la rajola: el preu si n'hi ha un de sol, «N variants» si no, «Preu obert». */
export function valorDeProducte(producte) {
  if (producte.preuObert) return 'Preu obert';
  const preus = new Set(producte.variants.map((v) => v.preuCents));
  return preus.size === 1 ? euros(producte.variants[0].preuCents) : `${producte.variants.length} variants`;
}

/**
 * Els productes de la carta com a articles de l'esquelet. `aComanda`: els
 * ids que ja són a la comanda en curs (estat 'en-colleccio', amb text).
 */
export function articlesDeCarta(carta, { aComanda = new Set(), establiment, ambInactius = false } = {}) {
  return (carta?.productes || [])
    .filter((p) => ambInactius || p.actiu)
    .slice()
    .sort((a, b) => a.ordre - b.ordre)
    .map((p) => {
      let estat = 'normal';
      if (!p.actiu) estat = 'desactivat';
      else if (aComanda.has(p.id)) estat = 'en-colleccio';
      return {
        id: p.id,
        nom: p.nom,
        categoriaId: p.categoriaId,
        valor: valorDeProducte(p),
        ...(p.exemple ? { secundari: 'Preu d’exemple' } : {}),
        ...(imatgeDe(p, establiment) ? { imatge: imatgeDe(p, establiment) } : {}),
        estat
      };
    });
}

/**
 * Les opcions del diàleg d'un producte: les variants i, si en té, les del
 * PRIMER grup de modificadors (l'esquelet pinta un sol grup). Cada opció
 * porta el preu final i, a `valor`, una clau que l'app torna a llegir.
 *   valor 'variant~grup~opcio'
 */
export function opcionsDetall(producte, grups) {
  const [grup] = grupsDe(producte, grups);
  const variants = producte.variants;
  if (!grup) {
    return variants.map((v) => ({ valor: `${v.id}~~`, etiqueta: v.nom, ajuda: producte.preuObert ? 'Preu obert' : euros(v.preuCents) }));
  }
  const opcions = grup.min === 0 ? [{ id: '', nom: null, deltaCents: 0 }, ...grup.opcions] : grup.opcions;
  return variants.flatMap((v) => opcions.map((o) => ({
    valor: `${v.id}~${o.id ? grup.id : ''}~${o.id}`,
    etiqueta: [variants.length > 1 ? v.nom : null, o.nom].filter(Boolean).join(' · ') || v.nom,
    ajuda: euros(v.preuCents + o.deltaCents)
  })));
}

/** La clau d'una opció del diàleg → { varianteId, opcions: [{ grupId, opcioId }] }. */
export function llegixOpcio(valor) {
  const [varianteId, grupId, opcioId] = String(valor || '').split('~');
  return { varianteId: varianteId || undefined, opcions: grupId && opcioId ? [{ grupId, opcioId }] : [] };
}

/**
 * Un producte de preu obert amb més d'una variant («Malibú»: botella, copa,
 * got…): abans del preu cal triar la variant, que en fixa el nom i el cost
 * de la línia. La primera a cegues falsejaria el tiquet.
 */
export const triaLaVariant = (producte) => Boolean(producte?.preuObert) && producte.variants.length > 1;

/** El toc obri el diàleg menut quan el producte té un grup obligatori o cal triar-ne la variant abans del preu (§A.6, flux 1). */
export const necessitaTria = (producte, grups) => teGrupObligatori(producte, grups) || triaLaVariant(producte);

/**
 * El preu obert que demana la consulta (?preu=<producte>&variant=<variant>):
 * { producte, variant }, o tots dos null. Només un producte actiu de preu
 * obert; amb més d'una variant, només amb la variant triada (mai la primera
 * a cegues). La Caixa i el TPV el llegixen igual.
 */
export function preuObertDeConsulta(carta, { preu = null, variant = null } = {}) {
  const producte = preu ? (carta?.productes || []).find((p) => p.id === preu && p.preuObert && p.actiu !== false) || null : null;
  const triada = producte && triaLaVariant(producte) ? producte.variants.find((v) => v.id === variant) || null : null;
  return producte && (!triaLaVariant(producte) || triada) ? { producte, variant: triada } : { producte: null, variant: null };
}

/** El text de davall d'una línia: variant, modificadors, nota, descompte o convidada. */
export function detallDeLinia(linia) {
  const parts = [linia.varianteNomCongelat, ...(linia.modificadors || []).map((m) => m.nomCongelat), linia.nota ? `«${linia.nota}»` : null];
  if (linia.convidada) parts.push(`Convidada: ${linia.convidada.motiu}`);
  else if (linia.descompte) {
    parts.push(linia.descompte.tipus === 'percent' ? `Descompte ${linia.descompte.valor} %` : `Descompte ${euros(linia.descompte.valor)}`);
  }
  if (linia.estat === 'anullada' && linia.motiuAnullacio) parts.push(`Motiu: ${linia.motiuAnullacio}`);
  return parts.filter(Boolean).join(' · ') || undefined;
}

const ESTAT_LINIA = Object.freeze({ nova: 'normal', marxada: 'fet', anullada: 'anullat' });

/** Les línies d'una comanda o d'un tiquet per a l'esquelet (LiniesColleccio). */
export function liniesVestides(comanda) {
  return (comanda?.linies || []).map((l) => ({
    id: l.id,
    articleId: l.producteId,
    quantitat: l.quantitat,
    nom: l.nomCongelat,
    detall: detallDeLinia(l),
    valor: euros(l.estat === 'anullada' ? brutLinia(l) : totalLinia(l)),
    estat: ESTAT_LINIA[l.estat] || 'normal'
  }));
}

/** Els textos d'estat de les línies del Bar: «Marxat» i «Anul·lat». */
export const TEXTOS_LINIES_BAR = Object.freeze({ fet: 'Marxat', anullat: 'Anul·lat' });

/** El resum de la comanda per a la BarraResum de l'esquelet. */
export function resumDeComanda(comanda) {
  const t = comanda ? totals(comanda) : { totalCents: 0, pendentCents: 0, pagatCents: 0 };
  const vives = (comanda?.linies || []).filter((l) => l.estat !== 'anullada').length;
  return {
    etiqueta: 'Comanda',
    comptador: vives,
    textComptador: textLinies,
    total: euros(t.pagatCents > 0 ? t.pendentCents : t.totalCents),
    textTotal: t.pagatCents > 0 ? 'Pendent' : 'Total'
  };
}

/** El nom de l'origen d'una comanda: «Barra», «Taula 3», «Per emportar». */
export function nomOrigen(origen, sala) {
  if (origen?.tipus === 'taula') return sala?.taules?.find((t) => t.id === origen.taulaId)?.nom || origen.taulaId;
  return origen?.tipus === 'emportar' ? 'Per emportar' : 'Barra';
}

/** Hora local curta d'un moment ISO. */
export function horaCurta(moment) {
  const data = new Date(moment);
  return Number.isNaN(data.getTime()) ? '' : `${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}`;
}

/**
 * Els tiquets oberts com a col·leccions de l'esquelet, de la més antiga a la
 * més nova: la barra (encara que no en tinga cap, amb l'id 'barra'), les
 * taules i per emportar. { id, nom, comptador (línies vives), secundari }.
 */
export function tiquetsOberts(comandes, sala) {
  const ordenades = [...comandes].sort((a, b) => (a.obertaA < b.obertaA ? -1 : 1));
  const targetes = ordenades.map((c) => {
    const t = totals(c);
    const vives = c.linies.filter((l) => l.estat !== 'anullada').length;
    return {
      id: c.id,
      nom: c.origen.tipus === 'taula' ? nomOrigen(c.origen, sala) : `${nomOrigen(c.origen, sala)} · ${horaCurta(c.obertaA)}`,
      comptador: vives,
      secundari: t.pagatCents > 0 ? `Pendent ${euros(t.pendentCents)}` : euros(t.totalCents)
    };
  });
  if (!comandes.some((c) => c.origen.tipus === 'barra')) targetes.unshift({ id: 'barra', nom: 'Barra', comptador: 0 });
  return targetes;
}

/* Les unitats de cada producte a la comanda, sense les línies anul·lades. */
function unitatsPerProducte(comanda) {
  const unitats = new Map();
  for (const linia of comanda?.linies || []) {
    if (linia.estat !== 'anullada') unitats.set(linia.producteId, (unitats.get(linia.producteId) || 0) + linia.quantitat);
  }
  return unitats;
}

/* «1 unitat», «3 unitats». */
const textUnitats = (n) => `${n} ${n === 1 ? 'unitat' : 'unitats'}`;

/**
 * Les rajoles del TPV: els productes de la carta (articlesDeCarta) amb la
 * insígnia de les unitats que ja són a la comanda («2») i el seu text per al
 * lector (insigniaLector, «2 unitats a la comanda»: el número sol no diu de
 * què és). Una comanda per emportar només veu el canal 'emportar' de la carta
 * (cartaDelCanal, ordre del Mestre, 261006: «la carta per a casa»).
 * Un producte amb al·lèrgens els porta a l'article (`alergens`, una còpia en
 * l'ordre del Reglament, ordenaAlergens del contracte comú); un sense, no en
 * porta la clau. Només el TPV: la Caixa (articlesDeCarta) no canvia.
 */
export function articlesDelTpv(carta, { comanda = null, establiment } = {}) {
  const unitats = unitatsPerProducte(comanda);
  const delCanal = comanda?.origen?.tipus === 'emportar' ? { ...carta, productes: cartaDelCanal(carta, 'emportar') } : carta;
  const perId = new Map((delCanal?.productes || []).map((p) => [p.id, p]));
  return articlesDeCarta(delCanal, { aComanda: new Set(unitats.keys()), establiment })
    .map((article) => {
      const alergens = ordenaAlergens(perId.get(article.id)?.alergens);
      const vestit = alergens.length ? { ...article, alergens } : article;
      return unitats.has(article.id)
        ? { ...vestit, insignia: String(unitats.get(article.id)), insigniaLector: `${textUnitats(unitats.get(article.id))} a la comanda` }
        : vestit;
    });
}

/**
 * El tiquet del TPV d'una comanda (o de cap): les unitats vives (el «[3]»
 * de Loyverse), les línies vestides, el total (el pendent si ja se n'ha
 * cobrat una part) i el resum: l'IVA inclòs per tipus, informatiu com a la
 * nota, i el que ja s'ha cobrat. Sense cap línia, ni total ni resum.
 *   { unitats, linies, total: { etiqueta, valor } | null, resum, pendentCents }
 */
export function tiquetDeComanda(comanda) {
  const unitats = [...unitatsPerProducte(comanda).values()].reduce((suma, n) => suma + n, 0);
  if (!comanda || comanda.linies.length === 0) return { unitats, linies: [], total: null, resum: [], pendentCents: 0 };
  const t = totals(comanda);
  const resum = t.perIva.map((g) => ({ etiqueta: `IVA del ${g.ivaPercent} % inclòs`, valor: euros(g.quotaCents) }));
  if (t.pagatCents > 0) resum.push({ etiqueta: 'Ja cobrat', valor: euros(t.pagatCents) });
  return {
    unitats,
    linies: liniesVestides(comanda),
    total: { etiqueta: t.pagatCents > 0 ? 'Pendent' : 'Total', valor: euros(t.pagatCents > 0 ? t.pendentCents : t.totalCents) },
    resum,
    pendentCents: t.pendentCents
  };
}
