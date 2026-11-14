/**
 * slugDeSeccio.js · Onada R24 · wp_trinquet (SEO-R22-08, trinquet de
 * l'arrencada estàtica) · El slug d'un encapçalament (seleccioUrl.js), en una
 * fulla sense imports: nomsDelPoble.js, que és de l'arrencada, només en vol
 * slugDeSeccio i, important-la de seleccioUrl.js, arrossegava al tros
 * d'entrada la selecció de l'espai de treball a la URL (llegixSeleccio,
 * escriuSeleccio, la secció del fragment), que només fan servir Notes i
 * PageFrame, diferits. Trasllat literal: seleccioUrl.js en reexporta les
 * constants i slugDeSeccio amb els mateixos noms, i fa servir netejaSlug.
 */

/** Llargària màxima d'un slug de secció. El text en pren com a molt
 *  LLARGARIA_TEXT_SLUG perquè el sufix d'un repetit (-2, -3…) hi capiga. */
export const LLARGARIA_SLUG = 80;
const LLARGARIA_TEXT_SLUG = 72;
/** Slug d'un encapçalament sense cap lletra ni xifra (només emojis o signes). */
export const SLUG_SENSE_TEXT = 'seccio';

/* Minúscules, sense diacrítics i amb guions entre paraules; cap guió a les
   puntes. Les lletres d'altres alfabets es conserven (la traducció). */
export function netejaSlug(text, llargaria) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('ca')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+/, '')
    .slice(0, llargaria)
    .replace(/-+$/, '');
}

/** El slug estable d'un encapçalament, fet del seu text. */
export function slugDeSeccio(text) {
  return netejaSlug(text, LLARGARIA_TEXT_SLUG) || SLUG_SENSE_TEXT;
}
