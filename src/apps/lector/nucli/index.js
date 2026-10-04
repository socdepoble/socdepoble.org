/**
 * Lector de notícies · el nucli pur (cap React, DOM, rellotge ni xarxa).
 *
 *   entitats.js     entitats de caràcter i text net
 *   xml.js          lector XML mínim i tolerant (espais de noms)
 *   urls.js         adreces absolutes i web
 *   html.js         HTML → arbre per llista blanca (cap HTML cru a la UI)
 *   dates.js        RFC 822 i ISO 8601; hora relativa en valencià
 *   ids.js          ids deterministes que passen esIdOpac
 *   model.js        categoria, font, resum i article: la llista blanca
 *   analitzador.js  RSS 2.0, Atom 1.0 i RSS 1.0 → { font, articles, errors }
 *   estat.js        llegits, per a després i fonts seguides
 *   personals.js    les fonts que afig la persona (pendents del connector)
 *   noticies.js     carpetes, filtres i comptadors
 */
export { analitzaFeed, MAX_ARTICLES } from './analitzador.js';
export { dataCurta, dataDeBoina, dataLlarga, horaRelativa, isoDeMs, llegixData, msDeData } from './dates.js';
export { descodifica, netejaText, plega, talla } from './entitats.js';
export {
  ESQUEMA, LIMITS_ESTAT, commutaDespres, commutaSeguiment, esDesat, esLlegit, estatInicial, marcaLlegit, marcaLlegits,
  marcaNoLlegit, normalitzaEstat, seguix
} from './estat.js';
export {
  BLOCS, ETIQUETES_EN_LINIA, LIMITS_HTML, arbreDeText, arbreSegur, htmlDeArbre, llegixHtml, sanejaHtml, textDeArbre
} from './html.js';
export { PATRO_ID, empremta, esIdLector, idArticle } from './ids.js';
export {
  ICONES_CATEGORIA, LIMITS_MODEL, RESERVATS, esIdLliure, normalitzaArticle, normalitzaCategoria, normalitzaFont,
  normalitzaResum, resumDeText, senseFinal, textCurt
} from './model.js';
export {
  CARPETES_FIXES, DESPRES, FINESTRA_HUI, HUI, articlesDeCarpeta, comptadorsCarpetes, comptadorsFonts, esDeHui,
  fontsDeCarpeta, ordenaPerData
} from './noticies.js';
export {
  ESQUEMA_PERSONALS, LIMITS_PERSONALS, MOTIUS_PERSONAL, PREFIX_PERSONAL, afigPersonal, idFontPersonal, llevaPersonal, llocDe,
  normalitzaFontPersonal, normalitzaPersonals, personalsInicials, tePersonal, validaFontPersonal
} from './personals.js';
export { MAX_URL, PROTOCOLS_ENLLAC, PROTOCOLS_WEB, urlAbsoluta } from './urls.js';
export { LIMITS_XML, NS, llegixXml } from './xml.js';
