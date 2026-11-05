/**
 * genera-index-articles-importats.mjs — P1-f (Onada R6, Bloc 2).
 *
 * Escriu src/data/taxonomia/indexArticlesImportats.js: les claus (slug i id
 * de WordPress) dels articles importats de socdepoble.net, sense la resta del
 * tesaurus doctoral. Amb l'índex, el detall del Mur sap si una clau és d'un
 * article importat sense carregar els 450 KB; l'article sencer arriba després
 * amb import() (src/utils/articlesImportatsMandros.js).
 *
 * Ús: node scripts/genera-index-articles-importats.mjs
 * La prova src/utils/articlesImportatsMandros.test.js falla si l'índex i el
 * tesaurus divergixen.
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ARTICLES_SIMULADOR_IA_425 } from '../src/data/taxonomia/tesaurusDoctoralSocDePoble.js';

function clausDArticlesImportats(articles = ARTICLES_SIMULADOR_IA_425) {
  const claus = new Set();
  for (const article of articles) {
    if (article?.slug != null && article.slug !== '') claus.add(String(article.slug));
    if (article?.id != null && article.id !== '') claus.add(String(article.id));
  }
  return [...claus].sort();
}

const desti = resolve(process.cwd(), 'src/data/taxonomia/indexArticlesImportats.js');
const claus = clausDArticlesImportats();
const cos = `/**
 * indexArticlesImportats.js — GENERAT per scripts/genera-index-articles-importats.mjs.
 * No l'edites a mà: torna a executar el generador.
 *
 * P1-f (Onada R6, Bloc 2) · Les claus (slug i id de WordPress) dels
 * ${ARTICLES_SIMULADOR_IA_425.length} articles importats de socdepoble.net (tesaurusDoctoralSocDePoble.js
 * · ARTICLES_SIMULADOR_IA_425), sense la resta del tesaurus.
 */
export const CLAUS_ARTICLES_IMPORTATS = new Set(${JSON.stringify(claus, null, 2)});
`;
writeFileSync(desti, cos, 'utf8');
console.log(`Índex escrit a ${desti} (${claus.length} claus)`);
