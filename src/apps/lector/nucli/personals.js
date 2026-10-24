/**
 * Lector de notícies · les fonts personals (nucli pur).
 *
 * Una font personal és una adreça web que la persona afig al Lector (des del
 * Snippet Curador del Bloc). Viu només en este dispositiu, en un registre a
 * banda de l'estat, i queda PENDENT DEL CONNECTOR: l'app no baixa res per
 * ella mateixa (Model B). Quan l'amfitrió o el servidor la servisquen, les
 * seues notícies entraran pel port com les de qualsevol altra font (T5b,
 * 261024: el servei de notícies del poble ja ho fa, fontRemota.js).
 *
 *   font personal { id, nom, url, categoriaId }
 *     id           determinista per l'adreça: «meva-<16 hex>» (ids.js). La
 *                  mateixa adreça és sempre la mateixa font
 *     nom          el que tria la persona, net i tallat (LIMITS_MODEL.nom)
 *     url          absoluta, http o https, sense credencials (urls.js)
 *     categoriaId  una categoria del poble o null
 *   registre      { esquema, fonts: [font personal] }, la més nova davant
 * Les operacions són pures i tornen el MATEIX registre si no canvia res.
 * normalitzaPersonals és la llista blanca del magatzem.
 */
import { idArticle } from './ids.js';
import { LIMITS_MODEL, esIdLliure, textCurt } from './model.js';
import { MAX_URL, urlAbsoluta } from './urls.js';

export const ESQUEMA_PERSONALS = 1;
export const LIMITS_PERSONALS = Object.freeze({ fonts: 100 });
/** El prefix dels ids de les fonts personals. */
export const PREFIX_PERSONAL = 'meva';

/** Els motius, dits a la persona. `camp`: el camp del formulari que els porta. */
export const MOTIUS_PERSONAL = Object.freeze({
  url: Object.freeze({ camp: 'url', text: 'Falta l’adreça de la font.' }),
  'url-no-web': Object.freeze({
    camp: 'url',
    text: `Només es poden afegir adreces web (http o https), sense usuari ni contrasenya i de ${MAX_URL} caràcters com a màxim.`
  }),
  nom: Object.freeze({ camp: 'nom', text: 'Cal un nom per a la font.' }),
  /* Gemini G2-02.1 (261024) · Les categories són les del catàleg de fonts, no «del poble». */
  categoria: Object.freeze({ camp: 'categoria', text: 'Esta categoria no és del catàleg de fonts: tria’n una de la llista.' }),
  repetida: Object.freeze({ camp: null, text: 'Esta font ja és al teu Lector.' }),
  plena: Object.freeze({ camp: null, text: `El Lector admet ${LIMITS_PERSONALS.fonts} fonts teues com a màxim: lleva’n alguna abans.` }),
  /* Correcció SN-R2 · Sense base local (navegació privada, dades del lloc
     bloquejades) la font es perdria en silenci: no s'afig ni es lleva. */
  'no-persistent': Object.freeze({
    camp: null,
    text: 'Este navegador no deixa guardar dades en este dispositiu (per exemple, en una finestra privada): el Lector no pot guardar les teues fonts.'
  })
});

const esObjecte = (valor) => valor !== null && typeof valor === 'object' && !Array.isArray(valor);

/** L'id d'una font personal per l'adreça (ja normalitzada). */
export const idFontPersonal = (url) => idArticle(PREFIX_PERSONAL, url);

export function personalsInicials() {
  return { esquema: ESQUEMA_PERSONALS, fonts: [] };
}

/** Una font personal neta i congelada, o null. L'id es torna a calcular per l'adreça. */
export function normalitzaFontPersonal(cru) {
  if (!esObjecte(cru)) return null;
  const url = urlAbsoluta(cru.url);
  const nom = textCurt(cru.nom, LIMITS_MODEL.nom);
  if (!url || !nom) return null;
  return Object.freeze({
    id: idFontPersonal(url),
    nom,
    url,
    categoriaId: esIdLliure(cru.categoriaId) ? cru.categoriaId : null
  });
}

/** El registre net, sigui quin siga el que arriba (un de vell o corrupte inclòs). */
export function normalitzaPersonals(cru) {
  const font = esObjecte(cru) ? cru : {};
  const vistes = new Set();
  const fonts = (Array.isArray(font.fonts) ? font.fonts : [])
    .map(normalitzaFontPersonal)
    .filter((neta) => neta && !vistes.has(neta.id) && vistes.add(neta.id))
    .slice(0, LIMITS_PERSONALS.fonts);
  return { esquema: ESQUEMA_PERSONALS, fonts };
}

/**
 * Valida el que arriba d'un formulari: { url, nom, categoriaId }.
 * `categories`: els ids de les categories del poble (qualsevol iterable).
 * { ok: true, font } o { ok: false, motiu } (una clau de MOTIUS_PERSONAL).
 */
export function validaFontPersonal(entrada, categories = []) {
  const cru = esObjecte(entrada) ? entrada : {};
  if (typeof cru.url !== 'string' || cru.url.trim() === '') return { ok: false, motiu: 'url' };
  const url = urlAbsoluta(cru.url);
  if (!url) return { ok: false, motiu: 'url-no-web' };
  const nom = textCurt(cru.nom, LIMITS_MODEL.nom);
  if (!nom) return { ok: false, motiu: 'nom' };
  const categoriaId = cru.categoriaId === undefined || cru.categoriaId === null || cru.categoriaId === '' ? null : cru.categoriaId;
  if (categoriaId !== null && !(esIdLliure(categoriaId) && new Set(categories).has(categoriaId))) return { ok: false, motiu: 'categoria' };
  return { ok: true, font: Object.freeze({ id: idFontPersonal(url), nom, url, categoriaId }) };
}

export const tePersonal = (registre, id) => registre.fonts.some((font) => font.id === id);

/**
 * Afig una font (ja validada) davant de tot. { registre, motiu }: motiu null
 * si s'ha afegit; 'repetida' o 'plena' (i el mateix registre) si no.
 */
export function afigPersonal(registre, font) {
  if (tePersonal(registre, font.id)) return { registre, motiu: 'repetida' };
  if (registre.fonts.length >= LIMITS_PERSONALS.fonts) return { registre, motiu: 'plena' };
  return { registre: { ...registre, fonts: [font, ...registre.fonts] }, motiu: null };
}

/** Lleva una font per l'id; el mateix registre si no hi era. */
export function llevaPersonal(registre, id) {
  if (!tePersonal(registre, id)) return registre;
  return { ...registre, fonts: registre.fonts.filter((font) => font.id !== id) };
}

/** El domini d'una adreça ja normalitzada, sense «www.»: d'on ve la font. */
export function llocDe(url) {
  const net = urlAbsoluta(url);
  return net ? new URL(net).hostname.replace(/^www\./, '') : '';
}
