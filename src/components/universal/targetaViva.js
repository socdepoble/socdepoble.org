/**
 * targetaViva.js — el document que s'està escrivint, dit com a targeta.
 *
 * T50 (decisió del Mestre, 260928: «Llista + dreta si hi cap») · La fitxa
 * activa de la columna central (Bloc de Notes i Perfil) i l'aside de la dreta
 * de l'editor pinten la MATEIXA UniversalCard que tindrà la publicació. Ací
 * es traduïx el document de l'editor a les props de la targeta, d'una sola
 * manera per a tots dos llocs. Pur: sense React ni backend.
 *
 *   · Títol, subtítol i entradilla en TEXT PLA: l'editor els desa en HTML
 *     sanejat («Pep&nbsp;<b>i</b>…») i la targeta els pinta com a text.
 *   · Un camp buit diu el text de llavor de l'editor (textosLlavor.js).
 *   · La data segueix la regla d'EDICIÓ del Mestre (T51): la targeta viva
 *     ensenya el que es publicaria ara. La de publicació triada al calendari
 *     (T40), si n'hi ha; si no, la d'ara (barres/dataHoraBarra.js).
 *   · L'emoticona només si s'ha triat (camp cru `icon`, un sol emoji): mai la
 *     ploma per defecte de la llista (T34), que és un valor de reserva.
 *   · Ordre del Mestre (261007) · Sense imatge, l'emoticona triada ocupa el
 *     quadrat en XL (emojiDelQuadrat; la insígnia la pinta TargetaViva, i
 *     només a la fitxa de la llista).
 */
import { extractPlainText } from '../../utils/contentAdapter.js';
import { emojiSol } from '../../utils/emoji.js';
import { TEXTOS_LLAVOR } from './textosLlavor.js';
import { dataHoraEdicio } from './barres/dataHoraBarra.js';

const SENSE_ETIQUETES = Object.freeze([]);

/** Text pla d'un camp de l'editor (HTML sanejat o text), sense retallar. */
export const textPla = (valor) => extractPlainText(typeof valor === 'string' ? valor : '', Infinity);

/**
 * { time, date, dateTime } de la caputxa, amb la regla d'edició
 * (dataHoraEdicio): la data de publicació triada o la d'ara. `dateTime` és
 * sempre un valor vàlid per a l'atribut de <time>.
 */
export function dataDeTargeta(document, ara = new Date()) {
  const { time, date, dateTime } = dataHoraEdicio({ publicat: (document || {}).publishDate }, ara);
  return { time, date, dateTime };
}

/**
 * Props de UniversalCard per al document viu.
 *   autor: { nom, avatar, poble } — el mateix de la barra taronja de l'editor.
 *   etiquetes: les píndoles del document (les mateixes de l'editor).
 *   ara: només per a les proves (la reserva de data).
 * `imageUrl` i `avatarUrl` van crus: qui pinta resol les referències
 * `sdp-media://` (TargetaViva), que UniversalCard no accepta.
 */
export function propsDeTargetaViva(document, { autor = null, etiquetes = SENSE_ETIQUETES, ara } = {}) {
  const d = document || {};
  const qui = autor || {};
  return {
    title: textPla(d.title) || TEXTOS_LLAVOR.titol,
    subtitle: textPla(d.subtitle) || TEXTOS_LLAVOR.subtitol,
    body: textPla(d.lead) || TEXTOS_LLAVOR.entradilla,
    imageUrl: d.heroImage || undefined,
    emoticona: emojiSol(d.icon) || '',
    author: qui.nom || undefined,
    avatarUrl: qui.avatar || undefined,
    location: qui.poble || undefined,
    ...dataDeTargeta(d, ara),
    labels: Array.isArray(etiquetes) ? etiquetes : SENSE_ETIQUETES,
    copyright: d.copyright || undefined,
  };
}

/**
 * Ordre del Mestre (261007) · «L'emoji XL ha d'ocupar el buit de la imatge o
 * el squareBadge». L'emoji del quadrat de la targeta viva: l'emoticona
 * triada (camp cru `icon`, un sol emoji; mai la 🪶 de reserva de la llista)
 * quan el document no té imatge (heroImage). Amb imatge, o sense emoticona
 * triada, '' (cap insígnia). Es mira la referència crua i no la resolta: una
 * capçalera sdp-media:// que encara es resol no fa parpellejar l'emoji.
 */
export function emojiDelQuadrat(document) {
  const d = document || {};
  return d.heroImage ? '' : emojiSol(d.icon) || '';
}
