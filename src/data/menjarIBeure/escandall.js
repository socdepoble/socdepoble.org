/** Exact rational consumption costs. Money is integer cents; round only at output. */
const UNITATS = Object.freeze({ g: ['massa', 1], kg: ['massa', 1000], ml: ['volum', 1], cl: ['volum', 10], l: ['volum', 1000], u: ['unitats', 1] });
const RECARREC = Object.freeze({ 4: 50, 10: 140, 21: 520 });
export function unitatsCompatibles(a, b) { return Boolean(typeof a === 'string' && typeof b === 'string' && Object.hasOwn(UNITATS, a) && Object.hasOwn(UNITATS, b) && UNITATS[a][0] === UNITATS[b][0]); }
function decimal(value, label) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1000000 || !/^\d+(?:\.\d{1,6})?$/.test(String(value))) throw new TypeError(`${label}: nombre de 0 a 1.000.000, màxim sis decimals.`);
  const [n, d = ''] = String(value).split('.');
  return [BigInt(n + d), 10n ** BigInt(d.length)];
}
function cents(value) { if (!Number.isSafeInteger(value) || value < 0) throw new TypeError('Cal un import en cèntims enters no negatius.'); return BigInt(value); }
function rounded([n, d]) {
  const sign = n < 0n ? -1n : 1n;
  const v = sign * ((2n * (n * sign) + d) / (2n * d));
  if (v > BigInt(Number.MAX_SAFE_INTEGER) || v < BigInt(Number.MIN_SAFE_INTEGER)) throw new RangeError('Import fora de rang.');
  return Number(v);
}
function gcd(a, b) { while (b) [a, b] = [b, a % b]; return a; }
function suma([a, b], [c, d]) { const n = a * d + c * b; const q = b * d; const g = gcd(n, q); return [n / g, q / g]; }
function fraccioConsum({ preuCents, quantitatCompra, unitatCompra, quantitat, unitat, minvaPercent = 0, factorNumerador = 1, factorDenominador = 1 }) {
  const a = UNITATS[unitat], b = UNITATS[unitatCompra];
  if (!a || !b || a[0] !== b[0]) throw new TypeError('Unitats incompatibles; cal pes o densitat documentats per canviar dimensió.');
  const [q, qd] = decimal(quantitat, 'Quantitat');
  const [pack, pd] = decimal(quantitatCompra, 'Format de compra');
  const [m, md] = decimal(minvaPercent, 'Minva');
  if (!pack || m >= 100n * md) throw new RangeError('Format positiu i minva inferior al 100%.');
  if (![factorNumerador, factorDenominador].every((v) => Number.isSafeInteger(v) && v >= 1 && v <= 10000)) throw new RangeError('Factor de racions no vàlid.');
  return [cents(preuCents) * q * BigInt(a[1]) * pd * 100n * md * BigInt(factorNumerador), qd * pack * BigInt(b[1]) * (100n * md - m) * BigInt(factorDenominador)];
}
export function costConsum(dades) { return rounded(fraccioConsum(dades)); }

/** Missing lines stay missing. A partial cost never masquerades as a total. */
export function calculaEscandall({ racions, linies = [], altresCostosCents = 0 }) {
  if (!Number.isSafeInteger(racions) || racions < 1 || racions > 10000) throw new RangeError('Racions: enter d’1 a 10.000.');
  let total = [cents(altresCostosCents), 1n];
  const detall = linies.map((linia) => {
    if (linia.preuCents == null || linia.quantitat == null || linia.quantitatCompra == null || linia.minvaPercent == null) return { id: linia.id, estat: 'pendent', costCents: null, ...(linia.motiu ? { motiu: linia.motiu } : {}) };
    try { const f = fraccioConsum(linia); total = suma(total, f); return { id: linia.id, estat: 'calculat', costCents: rounded(f), font: linia.font ?? null }; }
    catch (error) { return { id: linia.id, estat: 'pendent', costCents: null, motiu: error.message }; }
  });
  const complet = detall.length > 0 && detall.every((l) => l.estat === 'calculat');
  return { estat: complet ? 'complet' : 'parcial', linies: detall, pendents: detall.filter((l) => l.estat !== 'calculat').length,
    costParcialCents: rounded(total), costTotalCents: complet ? rounded(total) : null,
    costRacioCents: complet ? rounded([total[0], total[1] * BigInt(racions)]) : null };
}
export function costCopa({ preuBotellaCents, volumBotellaCl, volumCopaCl, minvaPercent = 0 }) {
  return costConsum({ preuCents: preuBotellaCents, quantitatCompra: volumBotellaCl, unitatCompra: 'cl', quantitat: volumCopaCl, unitat: 'cl', minvaPercent });
}
/** Surcharge is an explicit purchase-regime choice, never inferred from a bar. */
export function costCompraPack({ preuPackCents, unitatsPack, ivaPercent, recarrecEquivalencia = false, ivaDeductible = true }) {
  if (!Number.isInteger(ivaPercent) || !Object.hasOwn(RECARREC, ivaPercent)) throw new TypeError('IVA admés: 4, 10 o 21.');
  if (typeof recarrecEquivalencia !== 'boolean' || typeof ivaDeductible !== 'boolean') throw new TypeError('Indica el règim fiscal i la deduïbilitat.');
  if (recarrecEquivalencia && ivaDeductible) throw new TypeError('El model de recàrrec requerix compra amb IVA no deduïble.');
  const price = cents(preuPackCents), [units, ud] = decimal(unitatsPack, 'Unitats del pack');
  if (!units) throw new RangeError('El pack ha de tindre unitats positives.');
  const iva = rounded([price * BigInt(ivaPercent), 100n]);
  const recarrec = recarrecEquivalencia ? rounded([price * BigInt(RECARREC[ivaPercent]), 10000n]) : 0;
  const cost = price + BigInt(ivaDeductible ? 0 : iva) + BigInt(recarrec);
  return { baseUnitatCents: rounded([price * ud, units]), costUnitatCents: rounded([cost * ud, units]), costPackCents: rounded([cost, 1n]), ivaCents: iva, recarrecCents: recarrec };
}
/** Net of supplied operating costs, before direct taxes and unreported costs. */
export function fiscalVenda({ pvpCents, costCompraCents, ivaVendaPercent = 10, altresCostosCents = 0 }) {
  if (!Number.isInteger(ivaVendaPercent) || !Object.hasOwn(RECARREC, ivaVendaPercent)) throw new TypeError('IVA admés: 4, 10 o 21.');
  const price = cents(pvpCents), cost = cents(costCompraCents) + cents(altresCostosCents);
  const base = rounded([price * 100n, BigInt(100 + ivaVendaPercent)]);
  const profit = BigInt(base) - cost;
  return { baseImposableCents: base, ivaVendaCents: pvpCents - base, guanyNetCents: rounded([profit, 1n]),
    margePermil: base ? rounded([profit * 1000n, BigInt(base)]) : null,
    costPermil: base ? rounded([cost * 1000n, BigInt(base)]) : null,
    limit: 'Abans d’impostos directes i altres costos no informats' };
}
