/**
 * descarrega.js — guardar un fitxer al dispositiu (Blob + <a download>).
 *
 * Només ho fa la persona, amb un clic: el full per al metge i la còpia de
 * seguretat. L'adreça blob: és local i es revoca en acabar; res ix per la
 * xarxa. És l'únic lloc de Salut que crea adreces de fitxer.
 */

/** Descarrega `dades` (Uint8Array o text) amb el nom i el tipus donats. Torna true si s'ha pogut. */
export function descarregaFitxer({ nom, tipus, dades }) {
  if (typeof URL?.createObjectURL !== 'function' || typeof document === 'undefined') return false;
  const url = URL.createObjectURL(new Blob([dades], { type: tipus }));
  const enllac = document.createElement('a');
  enllac.href = url;
  enllac.download = nom;
  enllac.rel = 'noopener';
  /* Enllaç despenjat, com UniversalListCard.jsx (ofereixFitxer) i DetallPrivacitat.jsx:
     el clic no necessita penjar-lo del document de fora (Llei 06). */
  enllac.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
