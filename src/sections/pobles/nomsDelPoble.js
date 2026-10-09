/**
 * nomsDelPoble.js · Onada 5 (F5, fase 1) · Els dos noms que es deriven del
 * nom d'un poble, en un sol lloc:
 *   · nomDeLaGent: l'H1 de la seua Pàgina i el títol de la caputxa
 *     («Gent de la Torre de les Maçanes», «Gent d'Orxeta»);
 *   · slugDelPoble: l'id del poble, que és també la clau de /pobles/<id>.
 *
 * Pur: sense React, sense xarxa i sense dades. Un `author` guardat a la fitxa
 * sempre mana (la llavor porta noms curts triats per una persona); esta regla
 * és per als pobles que encara no en tenen.
 */
import { slugDeSeccio } from '../../components/universal/workspace/seleccioUrl.js';

/* L'article del topònim es contrau amb «de» i va en minúscula, com mana
   l'IEC: «el Campello» → «del Campello», «l'Alfàs» → «de l'Alfàs». L'ordre
   compta: «Els» abans que «El» i «Les» abans que «La». */
const ARTICLES = Object.freeze([
  [/^els\s+/i, 'dels '],
  [/^el\s+/i, 'del '],
  [/^les\s+/i, 'de les '],
  [/^la\s+/i, 'de la '],
  [/^l'\s*/i, "de l'"]
]);

/* S'apostrofa davant de vocal i de h muda més vocal… */
const COMENCA_PER_VOCAL = /^h?[aeiouàáèéíïòóúü]/i;
/* …però no davant d'una i o una u semivocals, que fan de consonant
   («de Iecla», «de Huelva», «de Iurreta»). Una u seguida d'i sí que és
   vocal: «la Vall d'Uixó». */
const COMENCA_PER_SEMIVOCAL = /^h?(?:i[aeouàáèéòóúü]|u[aeoàáèéòó])/i;

/* L'apòstrof tipogràfic (U+2019) es llig com el recte (U+0027), que és el
   de la llavor (townsSeed.js) i el que s'escriu. */
const net = (nom) => String(nom ?? '').replace(/’/g, "'").trim().replace(/\s+/g, ' ');

/** «Gent de…» per a un nom de poble, amb l'article contret i l'elisió. '' si no hi ha nom. */
export function nomDeLaGent(nom) {
  const poble = net(nom);
  if (!poble) return '';
  for (const [article, contraccio] of ARTICLES) {
    if (article.test(poble)) return `Gent ${contraccio}${poble.replace(article, '')}`;
  }
  if (COMENCA_PER_VOCAL.test(poble) && !COMENCA_PER_SEMIVOCAL.test(poble)) return `Gent d'${poble}`;
  return `Gent de ${poble}`;
}

/**
 * Onada 6 (pla 261009_0245, ítem 4) · El nom de la gent d'una FITXA de
 * poble: el seu `author` (la llavor porta el nom curt, «Gent de la Torre»)
 * o, si no en porta, nomDeLaGent del seu nom. El de l'H1 de la seua pàgina,
 * el de la caputxa de la seua targeta i el del seu xat. '' sense fitxa.
 */
export function nomDeLaGentDelPoble(town) {
  if (!town || typeof town !== 'object') return '';
  const author = typeof town.author === 'string' ? town.author.trim() : '';
  return author || nomDeLaGent(town.title || town.name);
}

/* La forma de l'id de la llavor: minúscules ASCII i xifres separades per un
   guió. Cap que no hi case cap a /pobles/<id> sense codificar (CLAU_DE_RUTA
   de src/data/contracte.js). */
const SLUG_DE_POBLE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * L'id d'un poble, fet del seu nom amb el mateix netejador que els slugs de
 * secció (seleccioUrl.js): 'La Torre de les Maçanes' → 'la-torre-de-les-macanes'.
 * null si el nom no té cap lletra ni xifra, o si en té d'un alfabet que no
 * cap en una ruta sense codificar.
 */
export function slugDelPoble(nom) {
  const text = net(nom).normalize('NFKD');
  if (!/[\p{L}\p{N}]/u.test(text)) return null;
  const slug = slugDeSeccio(text);
  return SLUG_DE_POBLE.test(slug) ? slug : null;
}
