/* Codi propi del mòdul de prova: viatja dins del seu cos, no és del nucli. */
export const MAXIM_DE_CLICS = 3;

export function comptaFins(valor, maxim = MAXIM_DE_CLICS) {
  return Math.min(valor, maxim);
}
