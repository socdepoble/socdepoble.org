/* Onada 11 (261010; prompt 261010_1730, tasca 2) · Contrast WCAG 2.x, pur.
   La mateixa fórmula que src/css/tokens.contracte.test.js (luminancia i
   contrast): sRGB → lineal amb el llindar 0,04045, luminància relativa amb
   els pesos 0,2126 / 0,7152 / 0,0722 i ràtio (L1 + 0,05) / (L2 + 0,05).
   Cap dependència: entra al tros d'entrada per estil.js i ha de ser xicotet.
   Només colors opacs de sis xifres (#rrggbb): cap altra forma és un color del
   contracte de l'estil del poble (estil.js). */

const HEX6 = /^#[0-9a-f]{6}$/i;

/** Cert si el valor és un color opac #rrggbb (majúscules o minúscules). */
export const esHex6 = (valor) => typeof valor === 'string' && HEX6.test(valor);

const lineal = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

/** Luminància relativa (0..1) d'un #rrggbb; null si no ho és. */
export function luminancia(hex) {
  if (!esHex6(hex)) return null;
  const [r, g, b] = hex.slice(1).match(/../g).map((x) => lineal(parseInt(x, 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Ràtio de contrast (1..21) entre dos #rrggbb; null si algun no ho és. */
export function contrast(hexA, hexB) {
  const la = luminancia(hexA);
  const lb = luminancia(hexB);
  if (la === null || lb === null) return null;
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
