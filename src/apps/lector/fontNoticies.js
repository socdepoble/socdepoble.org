/**
 * Lector de notícies · EL PORT de notícies (Model B).
 *
 * L'app no fa xarxa MAI. Les fonts i les notícies entren per un adaptador que
 * li injecten: en desenvolupament, la llavor sintètica (llavor/fontLlavor.js);
 * en producció, el que proveïsca l'amfitrió o el backend. Les fonts RSS del
 * poble les llig el CONNECTOR al servidor (fa de proxy): el navegador del veí
 * no toca mai l'origen d'una font, ni per a l'XML ni per a les imatges.
 *
 *   creaFontNoticies(adaptador) → {
 *     llistaFonts()                            → { categories, fonts }
 *     llistaArticles({ categoriaId, fontId })  → [resum], de la més nova a la més vella
 *     article(id)                              → article | null
 *   }
 * L'adaptador té la mateixa forma i pot tornar promeses. El port no se'n fia:
 * tot passa per la llista blanca del nucli (model.js) i el contingut es torna
 * a sanejar; el que no casa cau, sense llançar. Si l'adaptador falla, la
 * promesa es rebutja i la UI ho diu («Torna-ho a provar»).
 */
import {
  esIdLector, esIdLliure, normalitzaArticle, normalitzaCategoria, normalitzaFont, normalitzaResum, ordenaPerData
} from './nucli/index.js';

export const MAX_ARTICLES_PORT = 2000;
const METODES = Object.freeze(['llistaFonts', 'llistaArticles', 'article']);

/* Els elements nets d'una llista crua, sense ids repetits (es queda el primer). */
function nets(llista, normalitza) {
  const vistos = new Set();
  const eixida = [];
  (Array.isArray(llista) ? llista : []).forEach((cru, posicio) => {
    const net = normalitza(cru, posicio);
    if (net && !vistos.has(net.id)) {
      vistos.add(net.id);
      eixida.push(net);
    }
  });
  return eixida;
}

const perOrdre = (a, b) => a.ordre - b.ordre || a.nom.localeCompare(b.nom, 'ca');

export function creaFontNoticies(adaptador) {
  for (const metode of METODES) {
    if (typeof adaptador?.[metode] !== 'function') throw new TypeError(`L’adaptador de notícies necessita ${metode}().`);
  }
  return Object.freeze({
    async llistaFonts() {
      const cru = await adaptador.llistaFonts();
      const categories = nets(cru?.categories, normalitzaCategoria).sort(perOrdre);
      const ids = new Set(categories.map((categoria) => categoria.id));
      const fonts = nets(cru?.fonts, (font) => normalitzaFont(font, ids));
      return Object.freeze({ categories: Object.freeze(categories), fonts: Object.freeze(fonts) });
    },

    async llistaArticles({ categoriaId = null, fontId = null } = {}) {
      if ((categoriaId !== null && !esIdLliure(categoriaId)) || (fontId !== null && !esIdLliure(fontId))) return Object.freeze([]);
      const filtre = { ...(categoriaId ? { categoriaId } : {}), ...(fontId ? { fontId } : {}) };
      const cru = await adaptador.llistaArticles(filtre);
      const delaFont = nets(cru, normalitzaResum).filter((resum) => !fontId || resum.fontId === fontId);
      /* Primer s'ordena i després es talla: l'adaptador no promet cap ordre, i
         tallar la llista crua llevaria les notícies més noves si venen al final. */
      return Object.freeze(ordenaPerData(delaFont).slice(0, MAX_ARTICLES_PORT));
    },

    async article(id) {
      if (!esIdLector(id)) return null;
      const cru = await adaptador.article(id);
      const net = cru ? normalitzaArticle(cru) : null;
      return net && net.id === id ? net : null;
    }
  });
}
