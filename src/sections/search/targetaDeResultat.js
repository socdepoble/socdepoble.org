/**
 * targetaDeResultat.js — La vista «Targetes» de /cerca: quins tipus la tenen,
 * el ?vista= de la URL i les props de la UniversalCard d'un resultat. Mòdul
 * pur: cap React (qui munta la targeta hi posa l'extracte ressaltat i l'acció).
 *
 * Ordre del Mestre (261019 21:34, punt 9: «Visualització en Targetes (Cards vs
 * Llistat) … oferir un selector de vista (doble vista: llistat / targetes)») ·
 * Els resultats de Persones, Entitats, Pobles i Mercat es poden vore també en
 * targetes (UniversalCard dins de GraellaTargetes, la graella canònica). La
 * llista compacta (ResultatCerca) continua sent la vista per defecte.
 *
 *   ?vista=graella   les targetes; sense (o amb qualsevol altre valor), la
 *                    llista de sempre: la per defecte no s'escriu, com el
 *                    ?vista= del catàleg (apps/comu/esquelet/vistes.js).
 *
 * La targeta porta les MATEIXES dades que la fila de la llista i el mateix
 * enllaç; no s'inventa res:
 *   · una persona o una entitat (porta avatar): la boina porta la cara, el
 *     nom i el poble real, o les metadades declarades com a desconegudes.
 *     «El teu perfil» és meta de la llista, no un poble. La boina no duplica
 *     l'enllaç a la fitxa: només hi ha el de tota la targeta. Cap etiqueta: una persona no es
 *     categoritza (Directiva de Dignitat Humana, UniversalCard);
 *   · un poble o un producte (porta imatge): la imatge damunt i la meta en
 *     etiquetes;
 *   · cap peu (Comentar, Compartir, Connectar): la fila tampoc no en porta.
 * IDEA-61 (T0, prompt 261102_1532) · Les tres verticals del flux universal
 * (Compartir cotxe, Treball, Habitatge) també: una fitxa és una targeta, com
 * un producte, amb la meta de la fila en etiquetes.
 */

import { encapcalamentDeTargeta } from '../../components/universal/editorial.js';

/** Els tipus del filtre que ofereixen la vista de targetes. */
export const TIPUS_AMB_TARGETES = Object.freeze(['persones', 'entitats', 'pobles', 'mercat', 'calendari', 'mapa', 'vehicle', 'animalets', 'treball', 'habitatge']);

/** Les vistes d'un ?vista=: 'llista' (per defecte) o 'graella' (les targetes). */
export const VISTES_CERCA = Object.freeze(['llista', 'graella']);

/** Un ?vista= desconegut (o absent) és 'llista'. */
export const vistaValida = (valor) => (VISTES_CERCA.includes(valor) ? valor : 'llista');

/** Cert si el filtre `tipus` ofereix el selector de vista. */
export const teVistaDeTargetes = (tipus) => TIPUS_AMB_TARGETES.includes(tipus);

const ambText = (valor) => typeof valor === 'string' && valor.trim() !== '';

/**
 * Les props de la UniversalCard d'una entrada de l'índex (indexCerca.js ·
 * entrada). `meta` és la de la fila tal com la pinta la llista (amb «El teu
 * perfil» o «La gestiones tu» davant); sense, la de l'entrada.
 */
export function propsDeTargetaDeResultat(entrada, { meta, nomActual, t } = {}) {
  const dades = (Array.isArray(meta) ? meta : Array.isArray(entrada?.meta) ? entrada.meta : []).filter(ambText);
  const ambAvatar = Boolean(entrada?.avatar);
  const href = ambText(entrada?.href) ? entrada.href : undefined;
  return {
    ...encapcalamentDeTargeta(entrada?.editorial, {
      author: ambText(nomActual) && (entrada?.tipus === 'persones' || entrada?.tipus === 'entitats') ? nomActual : entrada?.editorial?.author,
      location: entrada?.editorial?.location || entrada?.poble,
      t
    }),
    title: ambText(nomActual) ? nomActual.trim() : (entrada?.titol || ''),
    mainHref: href,
    imageUrl: entrada?.imatge?.src || undefined,
    imageAlt: entrada?.imatge?.alt || '',
    /* Pla 261022_1955 (T2) · Sense foto que es puga pintar, la referència del
       bucket públic (un logo pujat): UniversalCard la demana al port. */
    avatarUrl: ambAvatar ? entrada.avatar.src || entrada.avatar.ref || undefined : undefined,
    labels: ambAvatar ? [] : dades,
    /* data-element a l'enllaç de la targeta: «Mostra'n més» hi porta el focus. */
    idElement: entrada?.clau,
    hasFooter: false
  };
}
