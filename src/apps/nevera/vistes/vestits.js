/**
 * La Nevera de Casa · el «vestit» de les dades del nucli per a l'esquelet
 * comú: les formes d'article, categoria i línia d'articles.js de Pedra Seca.
 * Ací només es traduïx (icones, textos d'estat); la intel·ligència és del
 * nucli i el pintat, de l'esquelet.
 */
import {
  Apple, Beef, Candy, CupSoda, Flower2, House, Milk, PawPrint, Pill, Snowflake, Soup, Tag, Wheat, Croissant
} from 'lucide-react';
import { articlePerId, articlesDe, categoriesDeLlista } from '../nucli/index.js';

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
 * Tots els articles vestits per a ColumnaCataleg. `secundari(article)` és la
 * línia de davall; els que són a la llista (`aLaLlista`) porten 'en-colleccio'.
 */
export function articlesVestits(estat, { aLaLlista = new Set(), secundari = () => undefined } = {}) {
  return articlesDe(estat).map((article) => ({
    id: article.id,
    nom: article.nom,
    categoriaId: article.categoriaId,
    secundari: secundari(article) || undefined,
    estat: aLaLlista.has(article.id) ? 'en-colleccio' : 'normal'
  }));
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
