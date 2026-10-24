/**
 * Lector de notícies · on és la persona i els camins de l'app.
 *
 *   /app/lector/noticies                    l'espai de treball, a «Hui»
 *   /app/lector/noticies/totes              «Totes» (el «Tot» de l'espai)
 *   /app/lector/noticies/<carpeta>          les notícies d'una carpeta
 *   /app/lector/noticies/<carpeta>/<font>   les notícies d'una font
 *   ?article=<id>                           la notícia oberta, al detall
 * Ordre del Mestre (261024, 15:05) · /app/lector/fonts ja no és cap pàgina:
 * les fonts viuen a l'arbre i la seua gestió és un diàleg (GestioFonts.jsx).
 * La carpeta és 'hui', 'despres' o l'id d'una categoria. Res de text lliure
 * a la URL (Clàusula dels Slugs): només ids opacs.
 *
 * Bloc 0 del Gauntlet (ordre del Mestre, 261016, prompt 261016_0015) · Les
 * notícies es munten sobre l'espai de treball del Bloc de notes
 * (Noticies.jsx), i ací viu la traducció entre el camí i la selecció de
 * l'espai, en les dues direccions (seleccioDeRuta i rutaDeSeleccio): mana la
 * URL. Cada opció de l'arbre porta un prefix (PREFIX_CARPETA, PREFIX_FONT)
 * perquè les categories i les fonts compartixen l'espai d'ids (nucli/model.js
 * · esIdLliure) i a l'arbre no poden xocar. «Totes» és la categoria null de
 * l'espai, el seu «Tot»: cap literal intern de l'espai viu ací (la porta del
 * nucli només n'exposa el component). Derogades amb les columnes pròpies
 * (Carpetes.jsx i Fonts.jsx, ordre del Mestre del 261004): l'entradeta de les
 * carpetes, el recompte de fonts seguides, la boina de l'app i useSeleccio.
 */
import { esIdOpac } from '../../plataforma/index.js';
import { DESPRES, HUI, llocDe } from '../nucli/index.js';

export const NOTICIES = 'noticies';
/* El tram de les fonts d'una carpeta en estret, de les columnes del 261004: ja
   només el porta l'enllaç vell, que AppLector canonitza a la carpeta. */
export const TRAM_FONTS = 'fonts';
export const TOTES = 'totes';

export const NOM_CARPETA_FIXA = Object.freeze({ [HUI]: 'Hui', [DESPRES]: 'Per a després' });

/* Una font es descriu ella o pel seu lloc web (el domini, sense camí). */
export const entradetaDeFont = (font) => font.descripcio || llocDe(font.lloc) || undefined;

export const PREFIX_CARPETA = 'carpeta:';
export const PREFIX_FONT = 'font:';

/** L'id de l'opció de l'arbre d'una carpeta ('hui', 'despres' o una categoria). */
export const opcioDeCarpeta = (carpeta) => `${PREFIX_CARPETA}${carpeta}`;
/** L'id de l'opció de l'arbre d'una font. */
export const opcioDeFont = (fontId) => `${PREFIX_FONT}${fontId}`;

const sensePrefix = (id, prefix) => (typeof id === 'string' && id.startsWith(prefix) && id.length > prefix.length ? id.slice(prefix.length) : null);
/** La carpeta d'una opció de l'arbre, o null si no n'és cap. */
export const carpetaDeOpcio = (id) => sensePrefix(id, PREFIX_CARPETA);
/** La font d'una opció de l'arbre, o null si no n'és cap. */
export const fontDeOpcio = (id) => sensePrefix(id, PREFIX_FONT);
/**
 * L'opció de l'arbre (una carpeta o una font) d'una categoria de l'espai, o
 * null, «Totes», si no n'és cap: el «Tot» de l'espai no porta cap prefix, com
 * a rutaDeSeleccio. Encàrrec F del Gauntlet (261016): el detall sense notícia
 * és de la llista que es veu, i no sempre és la de la URL.
 */
export const opcioDeLaSeleccio = (id) => (carpetaDeOpcio(id) || fontDeOpcio(id) ? id : null);

/**
 * La selecció de l'espai que diu la URL: { categoryId, itemId }.
 *   params   els de la ruta de notícies, ja validats (rutes.js · RUTES_NOTICIES)
 *   totes    si la ruta és la de «Totes»
 *   article  l'id de ?article=, o null
 * Sense carpeta, «Hui»; amb una font, l'opció de la font (la carpeta del camí
 * diu on era la persona, i no la canvia). itemId és sempre l'article o null,
 * mai absent: l'espai no tria cap notícia pel seu compte.
 */
export function seleccioDeRuta(params, { totes = false, article = null } = {}) {
  let categoryId = null;
  if (!totes) categoryId = params?.font ? opcioDeFont(params.font) : opcioDeCarpeta(params?.carpeta || HUI);
  return { categoryId, itemId: esIdOpac(article) ? article : null };
}

/**
 * El camí de l'app d'una selecció de l'espai (sense la base del router, com
 * useApp().ruta): la carpeta, la font (dins de la seua categoria o, si no en
 * té, de «Hui»; una font que ja no hi és, «Hui») o «Totes» per a qualsevol
 * altra opció (el «Tot» de l'espai no porta cap prefix), i ?article=<id> si
 * n'hi ha una d'oberta. La resta de la consulta no passa: ?seccio= és de
 * l'article que es deixa, i les columnes del 261004 (?vista=) ja no hi són.
 */
export function rutaDeSeleccio({ categoryId, itemId }, { fonts = [], ruta }) {
  const carpeta = carpetaDeOpcio(categoryId);
  const fontId = fontDeOpcio(categoryId);
  let cami;
  if (carpeta) {
    cami = ruta(NOTICIES, carpeta);
  } else if (fontId) {
    const font = fonts.find((candidata) => candidata.id === fontId) || null;
    cami = font ? ruta(NOTICIES, font.categoriaId || HUI, font.id) : ruta(NOTICIES, HUI);
  } else {
    cami = ruta(NOTICIES, TOTES);
  }
  return itemId != null && esIdOpac(String(itemId)) ? `${cami}?article=${itemId}` : cami;
}
