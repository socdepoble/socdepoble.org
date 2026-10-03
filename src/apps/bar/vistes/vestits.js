/**
 * El Bar · vistes/vestits.js — la intel·ligència de dades del Bar vestida
 * amb les formes de l'ESQUELET COMÚ (ordre del Mestre, 261002: sinergies
 * T4/T8). El Bar no pinta cap graella ni cap llista: només passa a
 * l'esquelet articles, categories, línies i col·leccions ja vestits.
 *
 *   article    { id, nom, categoriaId, secundari?, valor?, imatge?, estat?, insignia? }
 *   categoria  { id, nom, icona?, visible, ordre }
 *   linia      { id, articleId, quantitat, nom, detall?, valor?, estat? }
 *   colleccio  { id, nom, comptador, secundari? }
 *
 * Els imports es formen ací (formatEuros): l'esquelet no sap de cèntims.
 */
import {
  Beer, Coffee, CupSoda, IceCreamCone, Martini, Sandwich, Soup, Utensils, UtensilsCrossed, Wheat, Wine
} from 'lucide-react';
import { formatEuros } from '../../../utils/diners.js';
import { grupsDe, teGrupObligatori } from '../nucli/cataleg.js';
import { totals } from '../nucli/comanda.js';
import { brutLinia, totalLinia } from '../nucli/linia.js';

/* Les icones de categoria que coneix el Bar (noms de lucide de la carta). */
const ICONES = Object.freeze({ Beer, Coffee, CupSoda, IceCreamCone, Martini, Sandwich, Soup, Utensils, UtensilsCrossed, Wheat, Wine });

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

/** El toc obri el diàleg menut quan el producte té un grup obligatori (§A.6, flux 1). */
export const necessitaTria = (producte, grups) => teGrupObligatori(producte, grups);

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
