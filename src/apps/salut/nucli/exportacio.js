/**
 * exportacio.js — el fitxer que se'n va amb la persona (nucli pur).
 *
 *   · XLSX: totes les fulles del full per al metge (utils/fulls/xlsx.js).
 *     Propietats sense autor, títol ni dates; ZIP amb data fixa.
 *   · CSV: només la fulla «Diari» (utils/fulls/csv.js): punt i coma, BOM,
 *     CRLF i protecció contra fórmules en els textos lliures.
 *   · Nom NEUTRE: diari_AAAA-MM-DD_3d.xlsx. Ni l'àlies, ni el nom escrit en
 *     el moment, ni cap paraula de salut: el nom d'un fitxer es veu a les
 *     descàrregues, als adjunts i a les vistes prèvies.
 * El fitxer el descarrega o el compartix SEMPRE la persona (DialegExportacio).
 */
import { TIPUS_MIME_CSV, TIPUS_MIME_XLSX, creaXlsx, modelACsv } from '../../../utils/fulls/index.js';

export const FORMATS_EXPORTACIO = Object.freeze(['xlsx', 'csv']);
export const FULLA_CSV = 'Diari';

/** diari_2026-10-02_3d.xlsx */
export function nomFitxer(des, dies, format) {
  if (!FORMATS_EXPORTACIO.includes(format)) throw new RangeError(`Format desconegut: ${format}`);
  return `diari_${des}_${dies}d.${format}`;
}

/**
 * El fitxer d'un model de full.
 * @returns {{ nom: string, tipus: string, dades: Uint8Array | string }}
 */
export function exporta({ model, format, des, dies }) {
  const nom = nomFitxer(des, dies, format);
  if (format === 'xlsx') return { nom, tipus: TIPUS_MIME_XLSX, dades: creaXlsx(model) };
  return { nom, tipus: TIPUS_MIME_CSV, dades: modelACsv(model, FULLA_CSV) };
}
