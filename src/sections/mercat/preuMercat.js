/** Preu visible del Mercat: només imports numèrics inequívocs en euros.
 * El text lliure (unitats, rangs, «A convenir») es conserva: mai s'inventa un import.
 * Sense Intl ni dependències: mateix resultat en les cinc llengües i els dos lectors. */
export function formataPreuMercat(valor) {
  const text = typeof valor === 'number' && Number.isFinite(valor) ? String(valor)
    : typeof valor === 'string' ? valor.trim() : '';
  if (!text || text.length > 100) return text;
  const captura = /^(?:€\s*)?([+-]?)([\d.,]+)\s*(?:€|EUR)?$/i.exec(text);
  if (!captura) return text;
  let nombre = captura[2];
  if (nombre.includes('.') && nombre.includes(',')) {
    if (/^\d{1,3}(?:\.\d{3})+,\d{1,2}$/.test(nombre)) nombre = nombre.replace(/\./g, '').replace(',', '.');
    else if (/^\d{1,3}(?:,\d{3})+\.\d{1,2}$/.test(nombre)) nombre = nombre.replace(/,/g, '');
    else return text;
  } else {
    if (!/^\d+(?:[.,]\d{1,2})?$/.test(nombre)) return text;
    nombre = nombre.replace(',', '.');
  }
  const [enters, decimals = ''] = nombre.split('.');
  const net = enters.replace(/^0+(?=\d)/, '');
  const signe = captura[1] === '-' && (/[1-9]/.test(net + decimals)) ? '-' : '';
  return `${signe}${net.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${decimals.padEnd(2, '0')}\u00a0€`;
}
