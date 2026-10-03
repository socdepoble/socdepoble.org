/**
 * articles.js — les formes de dades de l'esquelet de catàleg i col·lecció
 * (ordre del Mestre, 261002: sinergies T4/T8) i els ajudants purs que les
 * ordenen. Cap dada, cap preu, cap regla de negoci: el TPV del bar i La Compra
 * hi posen la seua intel·ligència i l'esquelet només la pinta.
 *
 *   article   { id, nom, categoriaId, secundari?, valor?, imatge?, estat?, insignia? }
 *             · valor: text ja format per l'app («1,50 €», «2 variants», «2 kg»)
 *             · estat: 'normal' (per defecte) | 'en-colleccio' | 'desactivat'
 *             · insignia: text curt damunt de la rajola («NOU», «3»)
 *   categoria { id, nom, icona?, visible, ordre }
 *             · icona: un component de lucide-react (o un element ja fet)
 *             · visible: false l'amaga del catàleg (es pot tornar a mostrar)
 *   linia     { id, articleId, quantitat, nom, detall?, valor?, estat? }
 *             · estat: 'normal' (per defecte) | 'fet' | 'anullat'
 */

export const ESTATS_ARTICLE = Object.freeze(['normal', 'en-colleccio', 'desactivat']);
export const ESTATS_LINIA = Object.freeze(['normal', 'fet', 'anullat']);

/** L'estat d'un article, 'normal' si no en porta cap de conegut. */
export const estatArticle = (article) => (ESTATS_ARTICLE.includes(article?.estat) ? article.estat : 'normal');

/** L'estat d'una línia, 'normal' si no en porta cap de conegut. */
export const estatLinia = (linia) => (ESTATS_LINIA.includes(linia?.estat) ? linia.estat : 'normal');

/* El text d'estat d'una línia, el mateix en línies (LiniesColleccio) i en
   rajoles (ColumnaColleccio). L'app el canvia («Comprat», «Servit»). */
export const TEXTOS_ESTAT_LINIA = Object.freeze({ fet: 'Fet', anullat: 'Anul·lat' });

/* Els textos per defecte. L'app els canvia pels seus («A la comanda»,
   «A la llista»): és ella qui sap què vol dir estar a la col·lecció. */
export const TEXTOS_ARTICLES = Object.freeze({
  'en-colleccio': 'Ja és a la col·lecció',
  desactivat: 'No disponible',
  pista: 'Mantín premut, fes clic amb el botó dret o prem Maj+F10 per a més opcions.',
  senseCategoria: 'Altres'
});

/** La línia de davall del nom: l'especificació i el valor, si n'hi ha. */
export function liniaSecundaria(article) {
  return [article?.secundari, article?.valor].filter((text) => typeof text === 'string' && text !== '').join(' · ');
}

const ordreDe = (categoria) => (Number.isFinite(categoria?.ordre) ? categoria.ordre : Number.MAX_SAFE_INTEGER);

/** Totes les categories en l'ordre de la persona (ordre i, a igualtat, nom). */
export function categoriesEnOrdre(categories) {
  return (Array.isArray(categories) ? categories : [])
    .filter((categoria) => categoria && typeof categoria.id === 'string')
    .slice()
    .sort((a, b) => ordreDe(a) - ordreDe(b) || String(a.nom).localeCompare(String(b.nom), 'ca'));
}

/** Les categories que es veuen al catàleg, en ordre: les que no diuen visible: false. */
export function categoriesVisibles(categories) {
  return categoriesEnOrdre(categories).filter((categoria) => categoria.visible !== false);
}

/**
 * Els articles agrupats per categoria visible i en l'ordre de les categories:
 * [{ categoria, articles }]. Un article d'una categoria amagada no es pinta;
 * el d'una categoria desconeguda va a un grup final «Altres». Cap grup buit.
 */
export function agrupaPerCategoria(articles, categories, textSenseCategoria = TEXTOS_ARTICLES.senseCategoria) {
  const totes = new Map(categoriesEnOrdre(categories).map((categoria) => [categoria.id, categoria]));
  const grups = new Map(categoriesVisibles(categories).map((categoria) => [categoria.id, []]));
  const orfes = [];
  for (const article of Array.isArray(articles) ? articles : []) {
    if (!article || typeof article.id !== 'string') continue;
    if (grups.has(article.categoriaId)) grups.get(article.categoriaId).push(article);
    else if (!totes.has(article.categoriaId)) orfes.push(article);
  }
  const resultat = [...grups].filter(([, llista]) => llista.length > 0)
    .map(([id, llista]) => ({ categoria: totes.get(id), articles: llista }));
  if (orfes.length) resultat.push({ categoria: { id: '__altres', nom: textSenseCategoria, visible: true }, articles: orfes });
  return resultat;
}

/**
 * Mou una categoria una posició amunt (-1) o avall (+1) i torna una llista
 * nova amb `ordre` renumerat de 0 en avant. Pura: l'app la desa on vulga.
 */
export function mouCategoria(categories, id, direccio) {
  const llista = categoriesEnOrdre(categories);
  const i = llista.findIndex((categoria) => categoria.id === id);
  const j = i + (direccio < 0 ? -1 : 1);
  if (i < 0 || j < 0 || j >= llista.length) return llista.map((categoria, ordre) => ({ ...categoria, ordre }));
  [llista[i], llista[j]] = [llista[j], llista[i]];
  return llista.map((categoria, ordre) => ({ ...categoria, ordre }));
}

/** Minúscules i sense diacrítics: «Creïlles» i «creilles» són el mateix article. */
export function normalitzaText(text) {
  return String(text ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('ca').trim();
}

/**
 * Els suggeriments que contenen el text (sense accents ni majúscules), primer
 * els que hi comencen. Sense text, els primers `maxim` tal com venen (els
 * recents o els més usats, si l'app els ordena així).
 */
export function filtraSuggeriments(text, suggeriments, maxim = 8) {
  const llista = (Array.isArray(suggeriments) ? suggeriments : []).filter((s) => s && typeof s.id === 'string');
  const net = normalitzaText(text);
  if (!net) return llista.slice(0, maxim);
  const comencen = [];
  const contenen = [];
  for (const suggeriment of llista) {
    const nom = normalitzaText(suggeriment.nom);
    if (nom.startsWith(net)) comencen.push(suggeriment);
    else if (nom.includes(net)) contenen.push(suggeriment);
  }
  return [...comencen, ...contenen].slice(0, maxim);
}
