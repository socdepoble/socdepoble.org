import { registre, resolProtocols } from './context_documental.mjs';
export const TAULA = registre().rutes.map(r => ({ plantilla: r.plantilla, claus: r.claus }));
export function classifica(text) {
  const matches = resolProtocols(text);
  if (matches.length !== 1) throw new Error('Múltiples protocols: usa el resolver documental complet');
  return { plantilla: matches[0].plantilla, puntuacio: 1 };
}