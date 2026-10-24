/**
 * Lector de notícies · EL PORT de notícies (Model B).
 *
 * L'app no fa xarxa MAI. Les fonts i les notícies entren per un adaptador que
 * li injecten: a les proves (o amb el literal VITE_SDP_LECTOR_LLAVOR=1), la
 * llavor sintètica (llavor/fontLlavor.js); fora d'ací, el que proveïsca
 * l'amfitrió o el backend. Les fonts RSS del
 * poble les llig el CONNECTOR al servidor (fa de proxy): el navegador del veí
 * no toca mai l'origen d'una font, ni per a l'XML ni per a les imatges.
 *
 *   creaFontNoticies(adaptador) → {
 *     llistaFonts()                            → { categories, fonts }
 *     llistaArticles({ categoriaId, fontId })  → [resum], de la més nova a la més vella
 *     article(id)                              → article | null
 *     salut()                                  → { caigudes: [{ fontId, motiu }], motiu }
 *   }
 * L'adaptador té la mateixa forma i pot tornar promeses. El port no se'n fia:
 * tot passa per la llista blanca del nucli (model.js) i el contingut es torna
 * a sanejar; el que no casa cau, sense llançar. Si l'adaptador falla, la
 * promesa es rebutja i la UI ho diu («Torna-ho a provar»).
 *
 * T5 (P1-07, 261024) · Les fonts territorials entren per un servei neutral que
 * dona la plataforma (useServeiNoticies) i que fa servir l'adaptador remot
 * (fontRemota.js); la xarxa és del servei, mai de l'app. Per això el port
 * entén ara per què una font no ha respost:
 *   · MOTIUS_NOTICIES, la llista tancada: 'sense-connexio', 'temps',
 *     'servidor', 'font', 'limit', 'adreca' i 'personals-off' (els dos últims,
 *     261024 Lector). Un rebuig de l'adaptador porta el seu
 *     `motiu` només si és d'esta llista; el port no reexpedix res més d'ell
 *     (ni codis, ni estats, ni adreces), només el missatge, curt.
 *   · salut(), opcional a l'adaptador: les fonts que han caigut a l'última
 *     ronda i el motiu que més s'hi repetix (o null). Un fontId que no és
 *     lliure cau; un motiu que no és de la llista és 'servidor'. Sense salut a
 *     l'adaptador, o si falla, cap caiguda.
 */
import {
  esIdLector, esIdLliure, normalitzaArticle, normalitzaCategoria, normalitzaFont, normalitzaResum, ordenaPerData
} from './nucli/index.js';

export const MAX_ARTICLES_PORT = 2000;
const METODES = Object.freeze(['llistaFonts', 'llistaArticles', 'article']);
/* La llista tancada dels motius (la mateixa del servei, src/data/adaptadors/noticies/client.js).
   261024 Lector: 'adreca' (una adreça personal que el servei no llig; cap font contactada) i
   'personals-off' (el servei no llig fonts personals; cap petició). */
export const MOTIUS_NOTICIES = Object.freeze(['sense-connexio', 'temps', 'servidor', 'font', 'limit', 'adreca', 'personals-off']);
/* Quan dos motius es repetixen igual (motiuDominant), mana el primer d'esta llista: sense
   connexió no hi ha res més a dir, i el límit diu a la persona que espere. 261024 (Lector final):
   'adreca' i 'personals-off' hi són també, darrere (no són silencis de cap web; el mateix ordre
   de la vista, vistes/Noticies.jsx), perquè motiuDominant els puga tornar: abans, unes caigudes
   que només eren d'eixos dos donaven null. */
const PRIORITAT = Object.freeze(['sense-connexio', 'limit', 'servidor', 'temps', 'font', 'adreca', 'personals-off']);
const MAX_MISSATGE = 200;
const SENSE_CAIGUDES = Object.freeze({ caigudes: Object.freeze([]), motiu: null });

/** El motiu si és de la llista tancada; si no, null. */
export const motiuNet = (motiu) => (MOTIUS_NOTICIES.includes(motiu) ? motiu : null);

/** El motiu que més es repetix entre unes caigudes (els empats, per PRIORITAT), o null. */
export function motiuDominant(caigudes) {
  const comptes = new Map();
  for (const { motiu } of caigudes) comptes.set(motiu, (comptes.get(motiu) || 0) + 1);
  let millor = null;
  for (const motiu of PRIORITAT) {
    if ((comptes.get(motiu) || 0) > (comptes.get(millor) || 0)) millor = motiu;
  }
  return millor;
}

/* L'error que el port reexpedix: el missatge (curt) i el motiu, si és de la llista. */
function errorNet(error) {
  const missatge = typeof error?.message === 'string' && error.message ? error.message.slice(0, MAX_MISSATGE) : 'La font de notícies no ha respost.';
  const net = new Error(missatge);
  const motiu = motiuNet(error?.motiu);
  if (motiu) net.motiu = motiu;
  return net;
}

async function crida(fer) {
  try {
    return await fer();
  } catch (error) {
    throw errorNet(error);
  }
}

/* La salut crua de l'adaptador, neta: fontIds lliures i sense repetir, motius de la llista. */
function salutNeta(cru) {
  const vistes = new Set();
  const caigudes = [];
  for (const caiguda of Array.isArray(cru?.caigudes) ? cru.caigudes : []) {
    if (!esIdLliure(caiguda?.fontId) || vistes.has(caiguda.fontId)) continue;
    vistes.add(caiguda.fontId);
    caigudes.push(Object.freeze({ fontId: caiguda.fontId, motiu: motiuNet(caiguda.motiu) || 'servidor' }));
  }
  return caigudes.length ? Object.freeze({ caigudes: Object.freeze(caigudes), motiu: motiuDominant(caigudes) }) : SENSE_CAIGUDES;
}

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
  const salutDeLAdaptador = typeof adaptador.salut === 'function' ? () => adaptador.salut() : null;
  return Object.freeze({
    async llistaFonts() {
      const cru = await crida(() => adaptador.llistaFonts());
      const categories = nets(cru?.categories, normalitzaCategoria).sort(perOrdre);
      const ids = new Set(categories.map((categoria) => categoria.id));
      const fonts = nets(cru?.fonts, (font) => normalitzaFont(font, ids));
      return Object.freeze({ categories: Object.freeze(categories), fonts: Object.freeze(fonts) });
    },

    async llistaArticles({ categoriaId = null, fontId = null } = {}) {
      if ((categoriaId !== null && !esIdLliure(categoriaId)) || (fontId !== null && !esIdLliure(fontId))) return Object.freeze([]);
      const filtre = { ...(categoriaId ? { categoriaId } : {}), ...(fontId ? { fontId } : {}) };
      const cru = await crida(() => adaptador.llistaArticles(filtre));
      const delaFont = nets(cru, normalitzaResum).filter((resum) => !fontId || resum.fontId === fontId);
      /* Primer s'ordena i després es talla: l'adaptador no promet cap ordre, i
         tallar la llista crua llevaria les notícies més noves si venen al final. */
      return Object.freeze(ordenaPerData(delaFont).slice(0, MAX_ARTICLES_PORT));
    },

    async article(id) {
      if (!esIdLector(id)) return null;
      const cru = await crida(() => adaptador.article(id));
      const net = cru ? normalitzaArticle(cru) : null;
      return net && net.id === id ? net : null;
    },

    /* T5 (261024) · Les fonts que no han respost a l'última ronda. No es rebutja mai. */
    async salut() {
      if (!salutDeLAdaptador) return SENSE_CAIGUDES;
      try {
        return salutNeta(await salutDeLAdaptador());
      } catch {
        return SENSE_CAIGUDES;
      }
    }
  });
}
