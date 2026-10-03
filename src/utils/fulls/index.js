/**
 * utils/fulls — fulls de càlcul locals (XLSX i CSV) a partir d'un model comú.
 * Una app importa d'ací creaXlsx, fullaACsv i els tipus MIME (vegeu model.js
 * per a la forma del model). Per a llegir: llegixLlibre (un .xlsx, vegeu
 * lector.js per a la forma de les cel·les) i llegixCsv (un .csv).
 *
 * No depén de la Gestoria (sections/gestoria/nucli/{zip,xlsx,csv,inflate}.js):
 * és una evolució independent, i la migració de la Gestoria és un deute
 * declarat (inflate.js i el lector de csv.js en són còpies).
 */
export {
  TIPUS_CELLA, MAX_FILES, MAX_COLUMNES, MAX_TEXT,
  lletraColumna, partsData, segonsDeHora, dataLocal, eurosExactes, ampladaColumna,
  validaModel, comprovaModel, valorCela, textCela, decimalsColumna
} from './model.js';
export { creaXlsx, TIPUS_MIME_XLSX } from './xlsx.js';
export { fullaACsv, modelACsv, serialitzaCsv, protegeixFormula, llegixCsv, TIPUS_MIME_CSV, SEPARADOR_CSV } from './csv.js';
export { creaZip, llegeixZip, crc32 } from './zip.js';
export { inflateRawPur, ErrorInflate } from './inflate.js';
export { llegixLlibre } from './lector.js';
