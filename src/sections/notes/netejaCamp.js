/**
 * netejaCamp.js — El sanejador del canal d'escriptura de Notes, camp per camp.
 * Pur: sense React ni backend (Model B).
 *
 * Abans vivia dins de NotesContext.jsx (saveNoteField). P4 (revisió, 261003) ·
 * La «Nota sense títol» (notaPreparada.js) es crea amb el que la persona hi ha
 * escrit: l'entrada de creaNota i el que s'envia en eixir del Bloc passen pel
 * mateix sanejador que la cua de sempre. Mateix codi, ara en un sol lloc.
 */
import { sanejaDrets } from '../../data/dretsAutor.js';
import { sanitizeHtml, netejaText, esFontImatgeSegura } from '../../utils/sanitize.js';
import { emojiSol } from '../../utils/emoji.js';
import { dataIsoONull } from '../../utils/calendari.js';
import { coaccionaAmbit, esFitxaDAmbit } from '../../utils/publicacioUniversal.js';

const CAMPS_HTML = new Set(['title', 'subtitle', 'lead', 'content']);

export function netejaCamp(field, value) {
  /* IDEA-61 (T0, prompt 261102_1532; L2-A3) · La fitxa d'àmbit és un objecte
     { ambit, estat, dades } coaccionat pel contracte, o null (res, o «Mur»): la
     nota preparada (notaPreparada.js) i el buidatge d'eixida del Bloc passen
     per ací, i sense esta branca un objecte acabava en «[object Object]». */
  if (field === 'fitxa') return esFitxaDAmbit(value) ? coaccionaAmbit(value) : null;
  if (field === 'copyright') return sanejaDrets(value, { estricte: true });
  /* T40 (ordre del Mestre, 260928) · data de publicació: ISO vàlida o null. */
  if (field === 'publishDate') return dataIsoONull(value);
  /* T23 · emoticona de la nota: un sol emoji (utils/emoji.emojiSol) o cadena
     buida per a llevar-la; qualsevol altra cosa es descarta. */
  if (field === 'icon') return emojiSol(value) || '';
  if (CAMPS_HTML.has(field)) return sanitizeHtml(value);
  if (field === 'heroImage' || field === 'logoImage' || field === 'logoImageDark') return esFontImatgeSegura(value) ? String(value).trim() : '';
  if (typeof value === 'boolean') return value;
  // If we start saving categories and tags, they are arrays
  if (Array.isArray(value)) return value.map(v => netejaText(v)).filter(Boolean);
  return netejaText(value);
}
