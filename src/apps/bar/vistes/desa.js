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
  /* Enllaç despenjat, com UniversalListCard.jsx (ofereixFitxer) i DetallPrivacitat.jsx:
     el clic no necessita penjar-lo del document de fora (Llei 06). */
  enllac.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  return true;
}

/**
 * Onada 12 (261011; ordres 261011_0130, punt 6) · La zona IANA d'este
 * dispositiu ('Europe/Madrid'), o null si el navegador no la diu. El registre
 * de vendes (nucli/vendes.js) vol la zona de l'ESTABLIMENT: mentre el Bar no la
 * guarde (decisió del Mestre pendent), val la de la caixa que fa l'exportació,
 * que és al bar, i la pantalla ho diu.
 */
export function zonaDelDispositiu() {
  try {
    const zona = new Intl.DateTimeFormat().resolvedOptions().timeZone;
    return typeof zona === 'string' && zona !== '' ? zona : null;
  } catch {
    return null;
  }
}

/** Un nom de fitxer sense res de la persona: el tipus, l'id del torn i la data. */
export function nomFitxer(prefix, tornId, moment, extensio) {
  const data = typeof moment === 'string' ? moment.slice(0, 10) : 'sense-data';
  return `${prefix}-${data}-${tornId}.${extensio}`;
}
