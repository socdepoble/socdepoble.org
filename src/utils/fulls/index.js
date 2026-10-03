/**
 * utils/fulls — fulls de càlcul locals (XLSX i CSV) a partir d'un model comú.
 * Una app importa d'ací creaXlsx, fullaACsv i els tipus MIME (vegeu model.js
 * per a la forma del model).
 *
 * No depén de la Gestoria (sections/gestoria/nucli/{zip,xlsx,csv}.js): és una
 * evolució independent, i la migració de la Gestoria és un deute declarat.
 */
export {
  TIPUS_CELLA, MAX_FILES, MAX_COLUMNES, MAX_TEXT,
  lletraColumna, partsData, segonsDeHora, dataLocal, eurosExactes, ampladaColumna,
  validaModel, comprovaModel, valorCela, textCela, decimalsColumna
} from './model.js';
export { creaXlsx, TIPUS_MIME_XLSX } from './xlsx.js';
export { fullaACsv, modelACsv, serialitzaCsv, protegeixFormula, TIPUS_MIME_CSV, SEPARADOR_CSV } from './csv.js';
export { creaZip, llegeixZip, crc32 } from './zip.js';
