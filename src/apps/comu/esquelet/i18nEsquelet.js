/**
 * Esquelet comú de catàleg i col·lecció · i18nEsquelet.js (Onada R32.13 · T3-UI-03).
 *
 * Diccionari pur (zero classes CSS, zero emmagatzematge, zero xarxa) en les 5
 * llengües oficials (ca, es, en, eu, gl) per a les etiquetes per defecte de
 * ColumnaCataleg, ColumnaColleccio i ColumnaColleccions. En valencià ('ca')
 * conserva byte a byte els literals històrics.
 */
import { useClosaAplicacio } from '../../plataforma/index.js';

export const CODIS_IDIOMA_ESQUELET = Object.freeze(['ca', 'es', 'en', 'eu', 'gl']);

export function codiIdiomaEsquelet(idioma) {
  const codi = String(idioma || 'ca').toLowerCase().split('-')[0];
  return CODIS_IDIOMA_ESQUELET.includes(codi) ? codi : 'ca';
}

export function useIdiomaEsquelet() {
  const { idioma } = useClosaAplicacio();
  return codiIdiomaEsquelet(idioma);
}

export const TEXTOS_TARGETES_ESQUELET = Object.freeze({
  ca: Object.freeze({ 'en-colleccio': 'Ja és a la col·lecció', desactivat: 'No disponible' }),
  es: Object.freeze({ 'en-colleccio': 'Ya está en la colección', desactivat: 'No disponible' }),
  en: Object.freeze({ 'en-colleccio': 'Already in collection', desactivat: 'Unavailable' }),
  eu: Object.freeze({ 'en-colleccio': 'Bilduman dago jada', desactivat: 'Ez dago erabilgarri' }),
  gl: Object.freeze({ 'en-colleccio': 'Xa está na colección', desactivat: 'Non dispoñible' })
});

export const TEXTOS_CATALEG_ESQUELET = Object.freeze({
  ca: Object.freeze({
    titolPerDefecte: 'Catàleg',
    buit: 'No hi ha cap article ací',
    buitText: 'Tria una altra categoria o afig-ne un amb el camp de dalt.',
    vista: 'Vista del catàleg',
    graella: 'Graella',
    llista: 'Llista',
    categoria: 'Categoria',
    totes: 'Totes',
    opcions: 'Opcions',
    fitxaArticle: 'Fitxa de l’article'
  }),
  es: Object.freeze({
    titolPerDefecte: 'Catálogo',
    buit: 'No hay ningún artículo aquí',
    buitText: 'Elige otra categoría o añade uno con el campo superior.',
    vista: 'Vista del catálogo',
    graella: 'Cuadrícula',
    llista: 'Lista',
    categoria: 'Categoría',
    totes: 'Todas',
    opcions: 'Opciones',
    fitxaArticle: 'Ficha del artículo'
  }),
  en: Object.freeze({
    titolPerDefecte: 'Catalogue',
    buit: 'No items here yet',
    buitText: 'Choose another category or add an item using the field above.',
    vista: 'Catalogue view',
    graella: 'Grid',
    llista: 'List',
    categoria: 'Category',
    totes: 'All',
    opcions: 'Options',
    fitxaArticle: 'Item card'
  }),
  eu: Object.freeze({
    titolPerDefecte: 'Katalogoa',
    buit: 'Ez dago artikulurik hemen',
    buitText: 'Aukeratu beste kategoria bat edo gehitu bat goiko eremuarekin.',
    vista: 'Katalogoaren ikuspegia',
    graella: 'Sareta',
    llista: 'Zerrenda',
    categoria: 'Kategoria',
    totes: 'Guztiak',
    opcions: 'Aukerak',
    fitxaArticle: 'Artikuluaren fitxa'
  }),
  gl: Object.freeze({
    titolPerDefecte: 'Catálogo',
    buit: 'Non hai ningún artigo aquí',
    buitText: 'Escolle outra categoría ou engade un co campo superior.',
    vista: 'Vista do catálogo',
    graella: 'Grella',
    llista: 'Lista',
    categoria: 'Categoría',
    totes: 'Todas',
    opcions: 'Opcións',
    fitxaArticle: 'Ficha do artigo'
  })
});

export const TEXTOS_COLLECCIO_ESQUELET = Object.freeze({
  ca: Object.freeze({
    titolPerDefecte: 'Col·lecció',
    buit: 'Encara no hi ha res',
    buitText: 'Toca un article del catàleg per a afegir-lo.',
    tornaCataleg: 'Torna al catàleg',
    obriCataleg: 'Afig des del catàleg',
    enColleccio: 'Pendent'
  }),
  es: Object.freeze({
    titolPerDefecte: 'Colección',
    buit: 'Todavía no hay nada',
    buitText: 'Toca un artículo del catálogo para añadirlo.',
    tornaCataleg: 'Volver al catálogo',
    obriCataleg: 'Añadir desde el catálogo',
    enColleccio: 'Pendiente'
  }),
  en: Object.freeze({
    titolPerDefecte: 'Collection',
    buit: 'Nothing here yet',
    buitText: 'Tap an item from the catalogue to add it.',
    tornaCataleg: 'Back to catalogue',
    obriCataleg: 'Add from catalogue',
    enColleccio: 'Pending'
  }),
  eu: Object.freeze({
    titolPerDefecte: 'Bilduma',
    buit: 'Oraindik ez dago ezer',
    buitText: 'Ukitu katalogoko artikulu bat gehitzeko.',
    tornaCataleg: 'Itzuli katalogora',
    obriCataleg: 'Gehitu katalogotik',
    enColleccio: 'Zain'
  }),
  gl: Object.freeze({
    titolPerDefecte: 'Colección',
    buit: 'Aínda non hai nada',
    buitText: 'Toca un artigo do catálogo para engadilo.',
    tornaCataleg: 'Volver ao catálogo',
    obriCataleg: 'Engadir dende o catálogo',
    enColleccio: 'Pendente'
  })
});

export const TEXTOS_COLLECCIONS_ESQUELET = Object.freeze({
  ca: Object.freeze({
    titolPerDefecte: 'Col·leccions',
    buit: 'Encara no n’hi ha cap',
    buitText: 'Crea’n una amb el botó de davall.'
  }),
  es: Object.freeze({
    titolPerDefecte: 'Colecciones',
    buit: 'Todavía no hay ninguna',
    buitText: 'Crea una con el botón inferior.'
  }),
  en: Object.freeze({
    titolPerDefecte: 'Collections',
    buit: 'None yet',
    buitText: 'Create one with the button below.'
  }),
  eu: Object.freeze({
    titolPerDefecte: 'Bildumak',
    buit: 'Oraindik ez dago bat ere',
    buitText: 'Sortu bat beheko botoiarekin.'
  }),
  gl: Object.freeze({
    titolPerDefecte: 'Coleccións',
    buit: 'Aínda non hai ningunha',
    buitText: 'Crea unha co botón inferior.'
  })
});

export function textosTargetesEsquelet(idioma) {
  return TEXTOS_TARGETES_ESQUELET[codiIdiomaEsquelet(idioma)];
}

export function textosCatalegEsquelet(idioma) {
  return TEXTOS_CATALEG_ESQUELET[codiIdiomaEsquelet(idioma)];
}

export function textosColleccioEsquelet(idioma) {
  return TEXTOS_COLLECCIO_ESQUELET[codiIdiomaEsquelet(idioma)];
}

export function textosColleccionsEsquelet(idioma) {
  return TEXTOS_COLLECCIONS_ESQUELET[codiIdiomaEsquelet(idioma)];
}
