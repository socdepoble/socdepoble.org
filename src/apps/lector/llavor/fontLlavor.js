/**
 * Lector de notícies · l'adaptador de la llavor (les proves i el literal
 * VITE_SDP_LECTOR_LLAVOR=1; el servidor de desenvolupament ja no l'encén:
 * ordre del Mestre, 261016, «Purga de Mocks»).
 *
 * Té la forma de l'adaptador del port (fontNoticies.js) i no fa xarxa:
 * analitza en local els feeds de llavor/cataleg.js amb el nucli. Perquè
 * «Hui» no es quede buit amb els dies, totes les dates es desplacen en bloc
 * fins que la més nova és d'una hora abans d'`ara` (l'ordre i les distàncies
 * entre notícies no canvien).
 *
 *   creaAdaptadorLlavor({ ara, categories, fonts })  categories i fonts: per a les proves
 */
import { analitzaFeed, isoDeMs, msDeData } from '../nucli/index.js';
import { CATEGORIES_LLAVOR, FONTS_LLAVOR } from './cataleg.js';

const UNA_HORA = 60 * 60 * 1000;
const UN_MINUT = 60 * 1000;

/* El resum d'un article: sense el contingut. */
function resumDe(article) {
  const resum = { ...article };
  delete resum.contingutHtml;
  delete resum.mitjansOmesos;
  return resum;
}

export function creaAdaptadorLlavor({ ara, categories = CATEGORIES_LLAVOR, fonts = FONTS_LLAVOR } = {}) {
  const lesFonts = [];
  const articles = [];
  for (const font of fonts) {
    const { font: delFeed, articles: delaFont } = analitzaFeed(font.xml, { fontId: font.id });
    lesFonts.push({
      id: font.id, nom: font.nom, categoriaId: font.categoriaId,
      descripcio: font.descripcio || delFeed?.descripcio || '', lloc: delFeed?.enllac ?? null, imatge: delFeed?.imatge ?? null
    });
    articles.push(...delaFont);
  }
  const dates = articles.map((article) => msDeData(article.data)).filter(Number.isFinite);
  const mesNova = dates.length ? Math.max(...dates) : null;
  const desplacament = mesNova !== null && Number.isFinite(ara) ? Math.round((ara - UNA_HORA - mesNova) / UN_MINUT) * UN_MINUT : 0;
  const desplacats = articles.map((article) => ({
    ...article,
    data: article.data ? isoDeMs(msDeData(article.data) + desplacament) : null
  }));
  const perId = new Map(desplacats.map((article) => [article.id, article]));

  return Object.freeze({
    llistaFonts: async () => ({ categories: [...categories], fonts: lesFonts.map((font) => ({ ...font })) }),
    llistaArticles: async ({ categoriaId = null, fontId = null } = {}) => {
      const deCategoria = categoriaId ? new Set(lesFonts.filter((font) => font.categoriaId === categoriaId).map((font) => font.id)) : null;
      return desplacats
        .filter((article) => (!deCategoria || deCategoria.has(article.fontId)) && (!fontId || article.fontId === fontId))
        .map(resumDe);
    },
    article: async (id) => (perId.has(id) ? { ...perId.get(id) } : null)
  });
}
