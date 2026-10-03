/**
 * El Bar · vistes/desa.js — oferir un fitxer per a desar (el tancament en
 * XLSX, CSV o JSON, la còpia del dispositiu). Res no ix per la xarxa: el
 * fitxer es fa ací i el navegador el desa on diga la persona.
 */

/**
 * @param {string} nom  el nom del fitxer ('tancament-t-….xlsx')
 * @param {Uint8Array|string} contingut
 * @param {string} tipus  el tipus MIME
 * @returns {boolean} si el navegador ho ha pogut oferir
 */
export function desaFitxer(nom, contingut, tipus) {
  if (typeof URL?.createObjectURL !== 'function' || typeof document === 'undefined') return false;
  const url = URL.createObjectURL(new Blob([contingut], { type: tipus }));
  const enllac = document.createElement('a');
  enllac.href = url;
  enllac.download = nom;
  enllac.rel = 'noopener';
  document.body.append(enllac);
  enllac.click();
  enllac.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  return true;
}

/** Un nom de fitxer sense res de la persona: el tipus, l'id del torn i la data. */
export function nomFitxer(prefix, tornId, moment, extensio) {
  const data = typeof moment === 'string' ? moment.slice(0, 10) : 'sense-data';
  return `${prefix}-${data}-${tornId}.${extensio}`;
}
