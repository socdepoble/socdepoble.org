/**
 * targetaDeLaPagina.js — La UniversalCard d'una pàgina és la miniatura de la
 * seua UniversalPage.
 *
 * Ordre del Mestre (261007) · «No vull cards inventades, vull cards de
 * veritat»: si hi ha una UniversalPage darrere d'una targeta, la targeta en
 * mostra el mateix, tot: la portada, el títol, el subtítol, l'entradilla, les
 * etiquetes, el rellotge, la boina (avatar, nom i poble) i els drets.
 *
 * Pur: de les props que rep la UniversalPage d'un original (propsDePaginaDeText
 * per a una pàgina de text; paginaDElement per a un element del Mur, el
 * Mercat, l'agenda o Pobles) a les props de DADES d'UniversalCard. L'autoria
 * seguix la MATEIXA regla de la barra taronja de la pàgina (PageFrame):
 *   · sense nom (undefined), signa Sóc de Poble (DEFAULT_AUTHOR) i porta al
 *     projecte; un nom buit declarat (null) no s'endevina, com a la barra;
 *   · sense poble ni avatar (undefined), els de l'entitat: els valors per
 *     defecte dels paràmetres de PageFrame, que no s'apliquen a un null.
 * Cap acció: qui pinta la targeta hi posa les seues (Connectar, Comentar, la
 * navegació o els avisos de l'editor). La imatge ve de les dades de l'app,
 * no d'una instantània desada: el filtre de sempre (imatgePrivada: false).
 * Decisió 3 del Mestre (261007) · Ja no és «com la targeta del Mur», que ara
 * porta imatgePrivada i el mode estricte (fontImatgePropia). Per a un element
 * del Mur, del Mercat o de l'agenda, el mode estricte ja l'aplica
 * paginaDElement abans d'arribar ací: una portada o un avatar de fora hi
 * arriben com a null (cap imatge, i l'avatar no cau al de sèrie).
 */
import { DEFAULT_AUTHOR } from './UniversalUtils.js';

const textOpcional = (valor) => (valor == null || valor === '' ? undefined : valor);
/* El valor per defecte d'un paràmetre: només si no arriba (undefined). */
const perDefecte = (valor, reserva) => (valor === undefined ? reserva : valor);

/** Les props de dades d'UniversalCard de la UniversalPage `pagina`, o null. */
export function propsDeTargetaDeLaPagina(pagina) {
  if (!pagina || typeof pagina !== 'object' || !pagina.title) return null;
  const signaPerDefecte = pagina.authorName === undefined;
  return {
    title: pagina.title,
    subtitle: textOpcional(pagina.subtitle),
    body: textOpcional(pagina.lead),
    imageUrl: textOpcional(pagina.heroImage),
    imageAlt: pagina.heroAlt || '',
    imatgePrivada: false,
    labels: Array.isArray(pagina.labels) ? pagina.labels : undefined,
    copyright: textOpcional(pagina.copyright),
    date: pagina.date,
    time: pagina.time,
    dateTime: pagina.dateTime,
    author: signaPerDefecte ? DEFAULT_AUTHOR.name : textOpcional(pagina.authorName),
    authorHref: pagina.authorHref ?? (signaPerDefecte ? DEFAULT_AUTHOR.href : undefined),
    avatarUrl: textOpcional(perDefecte(pagina.authorAvatar, DEFAULT_AUTHOR.avatarUrl)),
    location: textOpcional(perDefecte(pagina.authorLocation, DEFAULT_AUTHOR.location))
  };
}
