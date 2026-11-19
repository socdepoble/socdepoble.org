/**
 * Pressupost de derivació de text (R32.11). Abans del NFC/NFD natiu, una
 * passada per punts de codi rebutja més de 64 marques Unicode consecutives.
 * En normalitzaUnicodeSegura, el retorn buit indica rebuig: no és una
 * normalització de l'entrada. L'API estricta normalitzaUnicodeAmbLimit llança
 * un error; és la que usen secrets, identitats i resolucions.
 * Només deriva una cadena; no modifica ni esborra l'original o l'esborrany.
 *
 * UAX15 §13 descriu el problema de les seqüències llargues de non-starters:
 * Referència: Unicode UAX15 §13, Stream-Safe Text Format (18-11-2026).
 * Este límit de producte sobre General_Category=M és conservador: inclou
 * també marques de classe canònica 0. NO implementa Stream-Safe (30
 * non-starters després de NFKD), no inserix CGJ ni normalitza per fragments.
 * NFC/NFD conserva la semàntica nativa dins del pressupost. La passada
 * prèvia és O(n); limita les tirades que el motor natiu ha de reordenar,
 * sense prometre un termini de rellotge per a tots els motors JavaScript.
 * UAX44 §5.10 garantix CCC=0 fora de Mn/Mc; \p{M} inclou tots dos.
 * Referència: Unicode UAX44 §5.10, Invariants (18-11-2026).
 */
export const MAX_MARQUES_UNICODE_CONSECUTIVES = 64;
const MARCA = /\p{M}/u;

/* NFKx pot convertir un escalar que no és M (p. ex. FF9E) en una marca.
   La descomposició prèvia és sempre d'UN escalar, mai de la cadena completa.
   ASCII no es descompon i talla qualsevol tirada de marques. */
function dinsPressupost(text, forma) {
  let consecutives = 0;
  const compatible = forma === 'NFKC' || forma === 'NFKD';
  for (const punt of text) {
    const cp = punt.codePointAt(0);
    if (cp < (compatible ? 0x80 : 0x300)) { consecutives = 0; continue; }
    const descompost = compatible ? punt.normalize('NFKD') : punt;
    for (const part of descompost) {
      if (MARCA.test(part)) {
        if (++consecutives > MAX_MARQUES_UNICODE_CONSECUTIVES) return false;
      } else consecutives = 0;
    }
  }
  return true;
}

/** Normalització estricta per a identitats i secrets: mai substituïx per ''.
 * El cridador conserva l'entrada original i pot presentar l'error controlat.
 * No trunca, no inserix CGJ ni compon per fragments; el resultat admés és el
 * de l'operació nativa completa. El preflight és lineal en l'entrada.
 */
export function normalitzaUnicodeAmbLimit(text, forma = 'NFC') {
  if (typeof text !== 'string') throw new TypeError('El text per a normalitzar ha de ser una cadena.');
  if (!['NFC', 'NFD', 'NFKC', 'NFKD'].includes(forma)) throw new RangeError('Forma Unicode no admesa');
  if (!dinsPressupost(text, forma)) {
    throw Object.assign(new RangeError('El text té massa marques Unicode consecutives per a normalitzar-lo.'), { code: 'UNICODE_MARK_LIMIT' });
  }
  return text.normalize(forma);
}

export function normalitzaUnicodeSegura(text, forma = 'NFC') {
  if (typeof text !== 'string') return '';
  if (forma !== 'NFC' && forma !== 'NFD') throw new RangeError('Forma Unicode no admesa');
  if (!dinsPressupost(text, forma)) return '';
  return text.normalize(forma);
}
