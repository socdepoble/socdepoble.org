/**
 * Lector de notícies · la carpeta «Observatori I+D · Mestres» (IDEA-265, 261118),
 * només per a administradors. Mòdul pur: cap React, cap DOM, cap xarxa.
 *
 * El motor tooling/brain/observatori-rss-mestres.mjs escriu un RSS 2.0 amb les
 * peces que el sedàs ha aprovat: cada títol porta davant el veredicte entre
 * claudàtors («[PROPOSAR_IDEA_SISTEMA] Títol») i la descripció, el resum i les
 * aplicacions («[V] resum · Sóc de Poble: … · WordPress Mestre: …»). El Lector
 * no el llig mai pel seu compte: la font FONT_OBSERVATORI es demana al servei
 * de notícies com qualsevol altra (fontRemota.js), i només quan la plataforma
 * diu que qui mira és superadmin (useSessioApp().esSuperadmin) i el catàleg del
 * mateix servei ja la declara. Hui no la declara: el client del navegador
 * (src/data/adaptadors/noticies/client.js) només demana els ids del seu catàleg
 * (cataleg.js · FONTS_TERRITORIALS) i rebutja la resta sense eixir a la xarxa, i
 * la funció del backend (supabase/functions/noticies) no la servix. Fins que les
 * dues peces la porten (i el backend, només a superadmins), la carpeta no ix i
 * no es demana res.
 *
 *   CARPETA_OBSERVATORI, FONT_OBSERVATORI, NOM_OBSERVATORI   els ids i el nom
 *   VEREDICTES                    la llista tancada del motor (VEREDICTES_VALIDATS),
 *                                 copiada perquè el Lector no pot importar tooling/;
 *                                 la prova de paritat del motor la vigila
 *   catalegAmbObservatori(cataleg, visible)  el catàleg amb la carpeta i la font
 *                                 (visible i el servei la declara) o sense cap
 *                                 rastre d'elles (la resta de casos)
 *   esDeLObservatori(id)          si un id d'article és de la font de l'observatori
 *   estatSenseObservatori(estat)  l'estat del Lector sense els desats de l'observatori
 *                                 a «Per a després» (per a qui no el veu)
 *   llegixEntradaObservatori(article) → { veredicte, titol, resum, aplicacioSdp,
 *                                 aplicacioWp, enllac } o null si el veredicte no és
 *                                 de la llista
 *   textPromocio(entrada)         la fitxa per al Llibre Mestre, a punt d'enganxar
 *                                 (la persona la revisa: el navegador no escriu mai
 *                                 al Llibre)
 */
import { arbreSegur, plega, textDeArbre } from './nucli/index.js';

export const CARPETA_OBSERVATORI = 'observatori';
export const FONT_OBSERVATORI = 'observatori-mestres';
export const NOM_OBSERVATORI = 'Observatori I+D · Mestres';
export const VEREDICTES = Object.freeze(['DESCARTAR', 'GUARDAR_VIGILANT_WP', 'PROPOSAR_IDEA_SISTEMA']);

/* La carpeta va darrere de les del catàleg; la font, dins d'ella. */
const ORDRE_OBSERVATORI = 9999;
const CATEGORIA = Object.freeze({ id: CARPETA_OBSERVATORI, nom: NOM_OBSERVATORI, ordre: ORDRE_OBSERVATORI, icona: null });
const FONT = Object.freeze({
  id: FONT_OBSERVATORI,
  nom: NOM_OBSERVATORI,
  categoriaId: CARPETA_OBSERVATORI,
  descripcio: 'Les troballes de l’observatori de mestres, amb el veredicte del sedàs. Només per a administradors.',
  lloc: null
});

const PREFIX_ARTICLE = `${FONT_OBSERVATORI}-`;
const PATRO_VEREDICTE = /^\[([A-Z_]+)\]\s+/;
const MARCA_SDP = 'Sóc de Poble: ';
const MARCA_WP = 'WordPress Mestre: ';
const TALL_APLICACIONS = /\s*·\s*(?=(?:Sóc de Poble|WordPress Mestre): )/;

/** Si un id d'article és de la font de l'observatori. */
export const esDeLObservatori = (id) => typeof id === 'string' && id.startsWith(PREFIX_ARTICLE);

/**
 * El catàleg { categories, fonts } amb l'observatori o sense. Amb, només si `visible` i el catàleg del
 * servei ja declara FONT_OBSERVATORI: el Lector no s'inventa la font, perquè el client del navegador
 * rebutja un id que el seu catàleg no porta i la carpeta quedaria buida amb un avís fals de font
 * caiguda. Sense, es lleva també el que un servei mal configurat poguera portar amb eixos ids: la
 * carpeta no ix mai a qui no és superadmin, i la font no es demana.
 */
export function catalegAmbObservatori({ categories = [], fonts = [] } = {}, visible = false) {
  const altresCategories = categories.filter((categoria) => categoria?.id !== CARPETA_OBSERVATORI);
  const altresFonts = fonts.filter((font) => font?.id !== FONT_OBSERVATORI && font?.categoriaId !== CARPETA_OBSERVATORI);
  const declarada = fonts.some((font) => font?.id === FONT_OBSERVATORI);
  if (!visible || !declarada) return { categories: altresCategories, fonts: altresFonts };
  return { categories: [...altresCategories, { ...CATEGORIA }], fonts: [...altresFonts, { ...FONT }] };
}

/**
 * L'estat del Lector per a qui no veu l'observatori: «Per a després» sense els articles seus. El
 * magatzem és un per navegador, no per compte: el que va desar un superadmin no es llista ni es llig
 * després amb una altra sessió (o sense). Només es mira; les accions continuen sobre l'estat sencer.
 */
export function estatSenseObservatori(estat) {
  if (!Array.isArray(estat?.despres) || !estat.despres.some((desat) => esDeLObservatori(desat?.id))) return estat;
  return { ...estat, despres: estat.despres.filter((desat) => !esDeLObservatori(desat?.id)) };
}

/* El text sencer d'un article: el del contingut (el resum de la llista es talla als 280 caràcters). */
function textDe(article) {
  const delContingut = typeof article?.contingutHtml === 'string' && article.contingutHtml
    ? textDeArbre(arbreSegur(article.contingutHtml).arbre)
    : '';
  return plega(delContingut || (typeof article?.resum === 'string' ? article.resum : ''));
}

/**
 * La lectura d'un article de l'observatori: el veredicte del títol, el títol sense el prefix i,
 * de la descripció, el resum i les dues aplicacions. null si no és de la font de l'observatori o si
 * el veredicte no és de VEREDICTES.
 */
export function llegixEntradaObservatori(article) {
  if (!article || article.fontId !== FONT_OBSERVATORI || typeof article.titol !== 'string') return null;
  const prefix = PATRO_VEREDICTE.exec(article.titol);
  if (!prefix || !VEREDICTES.includes(prefix[1])) return null;
  const veredicte = prefix[1];
  const cos = textDe(article).replace(PATRO_VEREDICTE, '');
  let resum = '';
  let aplicacioSdp = '';
  let aplicacioWp = '';
  cos.split(TALL_APLICACIONS).forEach((tros, posicio) => {
    if (tros.startsWith(MARCA_SDP)) aplicacioSdp = tros.slice(MARCA_SDP.length).trim();
    else if (tros.startsWith(MARCA_WP)) aplicacioWp = tros.slice(MARCA_WP.length).trim();
    else if (posicio === 0) resum = tros.trim();
  });
  return Object.freeze({
    veredicte,
    titol: article.titol.slice(prefix[0].length).trim(),
    resum,
    aplicacioSdp,
    aplicacioWp,
    enllac: typeof article.enllac === 'string' ? article.enllac : null
  });
}

/* L'origen i el camí de l'enllaç (sense consulta ni fragment), només si és https. */
function origenICami(enllac) {
  try {
    const url = new URL(enllac);
    return url.protocol === 'https:' && !url.username && !url.password ? `${url.origin}${url.pathname}` : null;
  } catch {
    return null;
  }
}

/** La fitxa per al Llibre Mestre (Markdown), o '' sense entrada. */
export function textPromocio(entrada) {
  if (!entrada?.veredicte || !entrada.titol) return '';
  const origen = entrada.enllac ? origenICami(entrada.enllac) : null;
  return [
    `- **IDEA-265-OBS · ${entrada.titol}** · [${entrada.veredicte}]`,
    `  - Origen: ${NOM_OBSERVATORI}${origen ? ` · ${origen}` : ''}`,
    entrada.resum ? `  - Resum: ${entrada.resum}` : null,
    entrada.aplicacioSdp ? `  - ${MARCA_SDP}${entrada.aplicacioSdp}` : null,
    entrada.aplicacioWp ? `  - ${MARCA_WP}${entrada.aplicacioWp}` : null
  ].filter(Boolean).join('\n');
}
