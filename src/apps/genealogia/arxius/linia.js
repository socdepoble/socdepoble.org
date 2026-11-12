/**
 * Arbre Genealògic · una dada de la persona convertida en un tros de línia
 * segur per a una consulta o un prompt (grup «arxius», ús intern).
 *
 * Coacció de primitius: només string, number i boolean passen; un objecte o
 * una funció tornen ''. Els caràcters de control (salts de línia inclosos)
 * i els separadors U+2028 i U+2029 es fan espai, perquè una dada no puga
 * obrir línies noves ni fer-se passar per una instrucció del prompt. Els
 * espais es col·lapsen i el resultat es talla a `max` punts de codi.
 * Sense regex.
 */
export function liniaNeta(valor, max = 200) {
  if (typeof valor !== 'string' && typeof valor !== 'number' && typeof valor !== 'boolean') return '';
  if (typeof valor === 'number' && !Number.isFinite(valor)) return '';
  const caracters = [];
  for (const caracter of String(valor)) {
    const codi = caracter.codePointAt(0);
    const control = codi < 32 || (codi >= 127 && codi < 160) || codi === 0x2028 || codi === 0x2029;
    caracters.push(control ? ' ' : caracter);
  }
  const net = caracters.join('').split(' ').filter((tros) => tros.length > 0).join(' ');
  const limit = Number.isSafeInteger(max) && max > 0 ? max : 200;
  return Array.from(net).slice(0, limit).join('');
}
