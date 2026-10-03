/**
 * netejaCamp.js — El sanejador del canal d'escriptura de Notes, camp per camp.
 * Pur: sense React ni backend (Model B).
 *
 * Abans vivia dins de NotesContext.jsx (saveNoteField). P4 (revisió, 261003) ·
 * La «Nota sense títol» (notaPreparada.js) es crea amb el que la persona hi ha
 * escrit: l'entrada de creaNota i el que s'envia en eixir del Bloc passen pel
 * mateix sanejador que la cua de sempre. Mateix codi, ara en un sol lloc.
 */
import { sanitizeHtml, netejaText, esFontImatgeSegura } from '../../utils/sanitize.js';
import { emojiSol } from '../../utils/emoji.js';
import { dataIsoONull } from '../../utils/calendari.js';

const CAMPS_HTML = new Set(['title', 'subtitle', 'lead', 'content']);

export function netejaCamp(field, value) {
  if (field === 'copyright') return netejaText(value).slice(0, 256);
  /* T40 (ordre del Mestre, 260928) · data de publicació: ISO vàlida o null. */
  if (field === 'publishDate') return dataIsoONull(value);
  /* T23 · emoticona de la nota: un sol emoji (utils/emoji.emojiSol) o cadena
     buida per a llevar-la; qualsevol altra cosa es descarta. */
  if (field === 'icon') return emojiSol(value) || '';
  if (CAMPS_HTML.has(field)) return sanitizeHtml(value);
  if (field === 'heroImage' || field === 'logoImage') return esFontImatgeSegura(value) ? String(value).trim() : '';
  if (typeof value === 'boolean') return value;
  // If we start saving categories and tags, they are arrays
  if (Array.isArray(value)) return value.map(v => netejaText(v)).filter(Boolean);
  return netejaText(value);
}
