/**
 * cataleg.js · T5 (P1-07, 261024) · El catàleg de les fonts del sistema del
 * Lector de notícies (/app/lector).
 *
 * T5b (ordre del Mestre, 261024) · Les fonts del sistema amb què comença el
 * Lector són EXACTAMENT els referents de coneixement obert del §23 del text
 * legal («Agraïments a la comunitat divulgadora i de codi obert»,
 * src/sections/text/legalContent.js): quatre blogs i dos canals de vídeo. Cap
 * altra. Totes se seguixen per defecte i la persona les pot deixar de seguir
 * una per una (la gestió de fonts; el Lector ja no les demana) o afegir-ne de
 * seues (les fonts personals). Les deu fonts territorials que hi havia (mitjans
 * comarcals, ajuntaments, el camp i el temps) ja no són actives: queden
 * documentades al README.md d'esta carpeta com a candidates verificades.
 * Els noms de les constants (FONTS_TERRITORIALS, CATEGORIES_TERRITORIALS) són
 * els del T5 i es queden, perquè els llig el client i la plataforma.
 *
 * L'ÚNIC lloc del frontend amb les adreces dels feeds, i només com a dada: el
 * navegador del veí no les demana mai. Les llig el servei de notícies del poble
 * (la funció `noticies` del backend, supabase/functions/noticies/), que té la
 * mateixa llista blanca a fonts.json: una prova de paritat
 * (supabase/functions/noticies/paritat.test.js) vigila que diguen el mateix,
 * id per id i adreça per adreça. El client (client.js) només envia l'id.
 *
 * Les adreces són les FINALS, comprovades el 261024 amb l'agent honest del
 * servei i amb GET, com les demana el servei (200, sense redireccions): el
 * servei no seguix redireccions cap a un altre host. R6 L-06 (261024, Lector
 * final): la de Jon Hernández és el feed Atom, /feed/atom/; el /feed/ de RSS
 * respon a tot GET sense condicions 304 i cap byte (la memòria cau de la seua
 * web), encara que un HEAD diga 200. Els dos canals de vídeo són feeds Atom públics del vídeo
 * (www.youtube.com/feeds/videos.xml amb un sol paràmetre, channel_id): l'única
 * adreça del catàleg amb consulta, i cataleg.test.js no n'admet cap altra.
 * `llengua`: la dels continguts, castellà en totes sis.
 *
 *   { id, nom, categoriaId, descripcio, lloc, feed, llengua }
 *   fontsPerAlLector() · les fonts sense `feed` ni `llengua`: el que arriba al
 *                        port del Lector (fontNoticies.js), que ho torna a
 *                        passar per la seua llista blanca.
 */

export const CATEGORIES_TERRITORIALS = Object.freeze([
  Object.freeze({ id: 'coneixement', nom: 'Coneixement obert', ordre: 0, icona: 'BookOpen' }),
  Object.freeze({ id: 'videos', nom: 'Vídeos per a aprendre', ordre: 1, icona: 'Sprout' })
]);

export const FONTS_TERRITORIALS = Object.freeze([
  Object.freeze({
    id: 'emowe', nom: 'Emowe (Marcos)', categoriaId: 'coneixement',
    descripcio: 'Codi obert i mètodes per a treballar amb agents d’intel·ligència artificial i projectes amb IA.',
    lloc: 'https://emowe.com', feed: 'https://emowe.com/rss.xml', llengua: 'es'
  }),
  Object.freeze({
    id: 'ayudawp', nom: 'Fernando Tellado · AyudaWP', categoriaId: 'coneixement',
    descripcio: 'WordPress en castellà: optimització, seguretat i allotjament web.',
    lloc: 'https://ayudawp.com', feed: 'https://ayudawp.com/feed/', llengua: 'es'
  }),
  Object.freeze({
    id: 'xavier-mitjana', nom: 'Xavier Mitjana · IA en Acción', categoriaId: 'coneixement',
    descripcio: 'Formació i divulgació pràctica d’intel·ligència artificial, models de llenguatge i fluxos de treball.',
    lloc: 'https://iaenaccion.com', feed: 'https://iaenaccion.com/feed/', llengua: 'es'
  }),
  Object.freeze({
    id: 'jon-hernandez', nom: 'Jon Hernández', categoriaId: 'coneixement',
    descripcio: 'Les novetats, l’impacte i les eines de la intel·ligència artificial, explicades amb esperit crític.',
    lloc: 'https://www.jonhernandez.education', feed: 'https://www.jonhernandez.education/feed/atom/', llengua: 'es'
  }),
  Object.freeze({
    id: 'migue-baena', nom: 'Migue Baena', categoriaId: 'videos',
    descripcio: 'Vídeos d’intel·ligència artificial aplicada: prompts, projectes i fluxos de treball amb Claude.',
    lloc: 'https://www.youtube.com/@MigueBaenaIA',
    feed: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCX_dT6nVtCIHRo_GFOsWK2A', llengua: 'es'
  }),
  Object.freeze({
    id: 'ben-cord', nom: 'Ben Cord (Benjamín Cordero)', categoriaId: 'videos',
    descripcio: 'Vídeos d’automatitzacions, agents autònoms i vibe coding, amb un enfocament pràctic.',
    lloc: 'https://www.youtube.com/@bencord',
    feed: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCpq8lHHliCS3oBt-gfL0bKQ', llengua: 'es'
  })
]);

const PER_ID = new Map(FONTS_TERRITORIALS.map((font) => [font.id, font]));

/** La font del catàleg amb este id, o null (cap clau d'Object.prototype). */
export const fontDelCataleg = (id) => (typeof id === 'string' && PER_ID.has(id) ? PER_ID.get(id) : null);

/** Les fonts com les veu el Lector: sense l'adreça del feed ni la llengua. */
export function fontsPerAlLector(fonts = FONTS_TERRITORIALS) {
  return Object.freeze(fonts.map(({ id, nom, categoriaId, descripcio, lloc }) => Object.freeze({ id, nom, categoriaId, descripcio, lloc })));
}
