/**
 * descarrega.js — guardar un fitxer al dispositiu (Blob + <a download>).
 *
 * Només ho fa la persona, amb un clic, després de revisar el text («Prepara,
 * no publica»). L'adreça blob: és local i es revoca en acabar; res ix per la
 * xarxa. És l'únic fitxer de l'Arbre Genealògic que crea adreces de fitxer.
 * El nom del fitxer mai porta cap nom de persona, de casa ni de poble.
 */

export const TIPUS_GED = 'text/vnd.familysearch.gedcom;charset=utf-8';
export const TIPUS_JSON = 'application/json;charset=utf-8';

const EXTENSIONS = Object.freeze(['ged', 'json']);
const RE_ISO_DATA = /^(\d{4})-(\d{2})-(\d{2})/;

const dosXifres = (n) => (n < 10 ? `0${n}` : String(n));

/** 'arbre-genealogic-AAAA-MM-DD.ged' (o .json) a partir de la data d'ara. */
export function nomFitxer(extensio, { ara } = {}) {
  if (!EXTENSIONS.includes(extensio)) throw new TypeError('extensio');
  let dia = '';
  if (ara instanceof Date && !Number.isNaN(ara.getTime())) {
    dia = `${ara.getFullYear()}-${dosXifres(ara.getMonth() + 1)}-${dosXifres(ara.getDate())}`;
  } else if (typeof ara === 'string') {
    const m = RE_ISO_DATA.exec(ara);
    if (m) dia = `${m[1]}-${m[2]}-${m[3]}`;
  }
  return dia ? `arbre-genealogic-${dia}.${extensio}` : `arbre-genealogic.${extensio}`;
}

/** Descarrega `contingut` amb el nom i el tipus donats. Torna true si s'ha pogut. */
export function descarregaText(contingut, nom, tipus = 'text/plain;charset=utf-8') {
  if (typeof contingut !== 'string' || typeof nom !== 'string' || nom === '') return false;
  if (typeof URL?.createObjectURL !== 'function' || typeof document === 'undefined') return false;
  const url = URL.createObjectURL(new Blob([contingut], { type: tipus }));
  const enllac = document.createElement('a');
  enllac.href = url;
  enllac.download = nom;
  enllac.rel = 'noopener';
  /* Enllaç despenjat, com a Salut: el clic no necessita penjar-lo del document. */
  enllac.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
