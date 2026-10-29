/** Primer contingut editorial després de blancs, frontmatter i comentaris HTML. Funció pura compartida per la Wiki i la IAIA. */
const esBlanc = (caracter) => /\s/.test(caracter);
function esFiDeLinia(text, posicio) {
  while (posicio < text.length && text[posicio] !== '\n') {
    if (text[posicio] !== ' ' && text[posicio] !== '\t') return false;
    posicio += 1;
  }
  return true;
}
export function iniciDelContingut(text) {
  let i = 0;
  while (i < text.length && esBlanc(text[i])) i += 1;
  if (text.startsWith('---', i) && esFiDeLinia(text, i + 3)) {
    // Frontmatter romanent, tancat per una línia «---»; sense tancar és un regle.
    let tanca = text.indexOf('\n---', i + 3);
    while (tanca !== -1 && !esFiDeLinia(text, tanca + 4)) tanca = text.indexOf('\n---', tanca + 1);
    if (tanca !== -1) i = tanca + 4;
  }
  for (;;) {
    while (i < text.length && esBlanc(text[i])) i += 1;
    if (!text.startsWith('<!--', i)) return i;
    const tanca = text.indexOf('-->', i + 2);
    if (tanca === -1) return text.length;
    i = tanca + 3;
  }
}

