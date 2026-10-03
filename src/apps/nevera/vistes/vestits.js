/**
 * La Nevera de Casa · el «vestit» de les dades del nucli per a l'esquelet
 * comú: les formes d'article, categoria i línia d'articles.js de Pedra Seca.
 * Ací només es traduïx (icones, textos d'estat); la intel·ligència és del
 * nucli i el pintat, de l'esquelet.
 *
 * Els productes de botiga ixen sempre a l'afegit ràpid (suggerimentsVestits,
 * després dels de base i dels propis) i a la graella només quan s'usen o quan
 * se n'obri el detall (productesALaGraella). Cap imatge de la botiga: porten
 * la icona de la seua secció, com tots.
 */
import {
  Apple, Beef, Candy, CupSoda, Flower2, House, Milk, PawPrint, Pill, Snowflake, Soup, Tag, Wheat, Croissant
} from 'lucide-react';
import {
  ARTICLES_PRODUCTES, articlePerId, articlesDe, categoriesDeLlista, clauDeNom, productesEnUs, textQuantitat
} from '../nucli/index.js';

/* Cap color per categoria (disseny de l'esquelet): la icona i el nom la distingixen. */
const ICONES = Object.freeze({
  'fruita-verdura': Apple,
  'pa-pastissos': Croissant,
  'llet-formatge': Milk,
  'carn-peix': Beef,
  'ingredients-especies': Soup,
  congelats: Snowflake,
  'cereals-pasta': Wheat,
  'picar-dolcos': Candy,
  begudes: CupSoda,
  llar: House,
  'higiene-salut': Pill,
  mascotes: PawPrint,
  jardi: Flower2,
  propis: Tag
});

/** El que hi ha a casa, dit amb paraules (mai només amb color). */
export const TEXTOS_CASA = Object.freeze({ 'hi-ha': 'N’hi ha', 'se-n-acaba': 'Se n’acaba', acabat: 'S’ha acabat' });

/** Les seccions d'una llista amb la seua icona: { id, nom, icona, ordre, visible }. */
export function seccionsDe(estat, llistaId, opcions) {
  return categoriesDeLlista(estat, llistaId, opcions).map((categoria) => ({ ...categoria, icona: ICONES[categoria.id] }));
}

/**
 * Els articles de la graella vestits per a ColumnaCataleg: els de base, els
 * propis i els `productes` de botiga que se li passen (productesALaGraella).
 * `secundari(article)` és la línia de davall; els que són a la llista
 * (`aLaLlista`) porten 'en-colleccio'.
 */
export function articlesVestits(estat, { aLaLlista = new Set(), secundari = () => undefined, productes = [] } = {}) {
  return [...articlesDe(estat), ...productes].map((article) => ({
    id: article.id,
    nom: article.nom,
    categoriaId: article.categoriaId,
    secundari: secundari(article) || undefined,
    estat: aLaLlista.has(article.id) ? 'en-colleccio' : 'normal'
  }));
}

/**
 * «Hacendado · Bote 600 g»: la marca i l'envàs d'un producte de botiga, amb
 * la quantitat si l'envàs no la diu ja («Botella 500 ml», no «Botella 500 ml
 * 500 ml»). El preu no es mostra.
 */
export function detallDeProducte(article) {
  const quantitat = textQuantitat(article.quantitat, article.unitat);
  const jaHiEs = quantitat !== '' && ` ${clauDeNom(article.envas)} `.includes(` ${clauDeNom(quantitat)} `);
  const envas = [article.envas, jaHiEs ? '' : quantitat].filter(Boolean).join(' ');
  return [article.marca, envas].filter(Boolean).join(' · ');
}

/* Els productes vestits per a l'afegit ràpid, fets una sola vegada (n'hi ha centenars). */
const PRODUCTES_SUGGERITS = Object.freeze(ARTICLES_PRODUCTES.map((article) => Object.freeze({
  id: article.id,
  nom: article.nom,
  categoriaId: article.categoriaId,
  secundari: detallDeProducte(article) || undefined,
  estat: 'normal'
})));

/**
 * Els productes de botiga que van a la graella: els que la casa fa servir
 * (productesEnUs) i el del detall obert (`obert`, l'?article= de la URL), que
 * s'hi ha de trobar perquè el detall s'obriga (ColumnaCataleg el busca entre
 * els articles). Mentre el detall és obert, la seua rajola i el comptador de
 * la secció hi són; si es tanca sense afegir-lo, la graella torna a ser la
 * d'abans (AppNevera.test.jsx ho comprova). Sense cap d'ells, cap: la graella
 * és la de sempre.
 */
export function productesALaGraella(estat, llistaId, obert) {
  const enUs = productesEnUs(estat, llistaId);
  if (!obert || enUs.some((article) => article.id === obert)) return enUs;
  const article = articlePerId(estat, obert);
  return article?.font ? [...enUs, article] : enUs;
}

/**
 * Les opcions de l'afegit ràpid: les de la graella sense productes (base i
 * propis, com sempre) i, després, tots els productes de botiga amb «marca ·
 * envàs» de secundari. Així un nom propi o de base va davant d'un de botiga.
 */
export function suggerimentsVestits(estat, { aLaLlista = new Set(), secundari } = {}) {
  return [
    ...articlesVestits(estat, { aLaLlista, secundari }),
    ...PRODUCTES_SUGGERITS.map((article) => (aLaLlista.has(article.id) ? { ...article, estat: 'en-colleccio' } : article))
  ];
}

/** Files { articleId, especificacio } (línies o recents) com a línies de l'esquelet. */
export function liniesVestides(estat, files, { detall = (fila) => fila.especificacio } = {}) {
  return files.map((fila) => ({
    id: fila.articleId,
    articleId: fila.articleId,
    nom: articlePerId(estat, fila.articleId)?.nom ?? fila.articleId,
    detall: detall(fila) || undefined
  }));
}

/** Les línies d'una llista per articleId. */
export const perArticle = (llista) => new Map((llista ? llista.linies : []).map((linia) => [linia.articleId, linia]));
