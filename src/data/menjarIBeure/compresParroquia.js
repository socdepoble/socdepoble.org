/** Explicit purchase formats over the actual historical source rows. No inferred contents or tax regime. */
import { costCompraPack, costCopa } from './escandall.js';

const UNITATS = new Set(['g', 'kg', 'ml', 'cl', 'l', 'u']);
const pendent = (motiu) => ({ estat: 'pendent', preuCents: null, motiu });

function decimalPositiu(value, label) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || value > 1000000 || !/^\d+(?:\.\d{1,6})?$/.test(String(value))) {
    throw new TypeError(`${label}: quantitat positiva amb sis decimals com a màxim.`);
  }
  return String(value);
}

/** Decimal multiplication without binary-float artifacts or silent quantity rounding. */
function quantitatTotal(unitats, contingut) {
  const parts = (value, label) => {
    const [integer, fraction = ''] = decimalPositiu(value, label).split('.');
    return [BigInt(integer + fraction), fraction.length];
  };
  const [a, ad] = parts(unitats, 'Unitats del pack');
  const [b, bd] = parts(contingut, 'Contingut per unitat');
  const decimals = ad + bd;
  let text = String(a * b).padStart(decimals + 1, '0');
  if (decimals) text = `${text.slice(0, -decimals)}.${text.slice(-decimals)}`.replace(/0+$/, '').replace(/\.$/, '');
  const result = Number(text);
  if (text.includes('.') && text.split('.')[1].length > 6) throw new RangeError('El contingut total del pack excedix sis decimals; cal una unitat base més menuda.');
  decimalPositiu(result, 'Contingut total del pack');
  return result;
}

export function tarifesCompraParroquia(dades) {
  const fulls = [...new Set((dades?.tarifes || []).map((t) => t.full))];
  const workbook = dades?.fonts?.find((f) => f.ruta.endsWith('La Parròquia - Llistat de preus.xlsx'));
  return (dades?.tarifes || []).map((tarifa) => ({ ...tarifa,
    id: `parroquia-preus-${fulls.indexOf(tarifa.full) + 1}-${tarifa.fila}`,
    font: workbook ? { ruta: workbook.ruta, sha256: workbook.sha256, full: tarifa.full, fila: tarifa.fila } : null }));
}

/** `preuCents` and `quantitatCompra` describe the WHOLE pack, preserving sub-cent unit costs. */
export function ingredientDeTarifaParroquia(args) {
  const { dades, tarifaId, quantitatPerUnitat, unitat, ivaPercent, ivaDeductible, recarrecEquivalencia, zeroConfirmat = false } = args;
  const tarifa = tarifesCompraParroquia(dades).find((t) => t.id === tarifaId);
  if (!tarifa?.font) return pendent('Tria una tarifa amb full, fila i empremta de la font.');
  const price = args.preuPackCents === undefined ? tarifa.preuPackCents : args.preuPackCents;
  const units = args.unitatsPack === undefined ? tarifa.unitatsPack : args.unitatsPack;
  if (!Number.isSafeInteger(price) || price < 0) return pendent('Falta el preu base del pack, en cèntims enters.');
  if (price === 0 && zeroConfirmat !== true) return pendent('Un preu zero de la font continua pendent fins que el confirmes expressament.');
  const changedPrice = price !== tarifa.preuPackCents;
  if (changedPrice && (typeof args.fontPreu !== 'string' || !args.fontPreu.trim())) return pendent('Indica la font i la data del preu revisat.');
  if (!UNITATS.has(unitat)) return pendent('Indica la unitat real del contingut: g, kg, ml, cl, l o u.');
  if (typeof ivaDeductible !== 'boolean' || typeof recarrecEquivalencia !== 'boolean') return pendent('Indica explícitament el règim fiscal de la compra.');
  try {
    const quantity = quantitatTotal(units, quantitatPerUnitat);
    const cost = costCompraPack({ preuPackCents: price, unitatsPack: units, ivaPercent, ivaDeductible, recarrecEquivalencia });
    const font = `${tarifa.font.ruta}; full ${tarifa.full}, fila ${tarifa.fila}; SHA-256 ${tarifa.font.sha256}${changedPrice ? `; preu revisat: ${args.fontPreu.trim()}` : ''}`;
    return { estat: 'preparat', tarifaId, nom: tarifa.nom, preuCents: cost.costPackCents, quantitatCompra: quantity, unitatCompra: unitat,
      unitatsPack: units, quantitatPerUnitat, costUnitatCents: cost.costUnitatCents, costBaseFiscal: ivaDeductible ? 'base-cost-deduccions' : 'cost-final-no-deduible',
      preuBasePackCents: price, ivaPercent, ivaDeductible, recarrecEquivalencia,
      ivaCents: cost.ivaCents, recarrecCents: cost.recarrecCents, font, fontOrigen: { ...tarifa.font },
      baseCalcul: 'pack_complet_amb_quantitat_total', zeroConfirmat: price === 0 && zeroConfirmat === true };
  } catch (error) {
    return pendent(error.message);
  }
}

export function costCopaDeTarifaParroquia(args) {
  const { volumBotellaCl, volumCopaCl, minvaPercent } = args;
  if (typeof minvaPercent !== 'number' || !Number.isFinite(minvaPercent) || minvaPercent < 0 || minvaPercent >= 100) return pendent('Indica la minva real de la copa, de 0 a menys del 100%.');
  const compra = ingredientDeTarifaParroquia({ ...args, quantitatPerUnitat: volumBotellaCl, unitat: 'cl' });
  if (compra.estat !== 'preparat') return compra;
  try {
    decimalPositiu(volumCopaCl, 'Volum de la copa');
    // A pack is an exact aggregate bottle: consume against its total volume, never a rounded bottle price.
    const costCopaCents = costCopa({ preuBotellaCents: compra.preuCents, volumBotellaCl: compra.quantitatCompra, volumCopaCl, minvaPercent });
    return { estat: 'preparat', costCopaCents, compra, font: compra.font, volumBotellaCl, volumCopaCl, minvaPercent };
  } catch (error) {
    return pendent(error.message);
  }
}
