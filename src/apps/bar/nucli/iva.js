/**
 * El Bar · nucli/iva.js — el desglossament informatiu de l'IVA (§A.5).
 *
 * Per a cada tipus d'IVA, la suma dels totals de les línies (PVP amb IVA
 * inclòs) i, d'ací, base = total × 100 / (100 + iva), arrodonida a la meitat
 * cap amunt, i quota = total − base. Exemple: 1,00 € al 10 % → base 0,91 i
 * quota 0,09. És informatiu: la nota no és cap factura.
 */
import { mitjaAmunt } from './comu.js';

/**
 * @param {Array<{ ivaPercent: number }>} linies
 * @param {(linia: object) => number} importDe  el total de cada línia en cèntims (amb signe)
 * @returns {Array<{ ivaPercent: number, baseCents: number, quotaCents: number }>} per tipus, de menor a major
 */
export function desglossaIva(linies, importDe) {
  const perTipus = new Map();
  for (const linia of linies || []) {
    const total = importDe(linia);
    if (!total) continue;
    perTipus.set(linia.ivaPercent, (perTipus.get(linia.ivaPercent) || 0) + total);
  }
  return [...perTipus.entries()]
    .filter(([, total]) => total !== 0)
    .sort(([a], [b]) => a - b)
    .map(([ivaPercent, total]) => {
      const baseCents = mitjaAmunt(total * 100, 100 + ivaPercent);
      return { ivaPercent, baseCents, quotaCents: total - baseCents };
    });
}
