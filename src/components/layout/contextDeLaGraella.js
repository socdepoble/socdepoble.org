/* El context de la closca (AppGridShell), en un mòdul sense dependències.
   Ordre d'usabilitat del Mestre (30-10-2026) · AppGridColumn el llig per a
   saber si la closca és «estret» (la icona de l'esquerra només fa de botó on
   es veu el [|<]). Si l'importara d'AppGridShell.jsx, les apps compilades com
   a mòdul, que importen AppGridColumn directament, durien dins del cos la
   closca sencera i el seu magatzem (src/config/storage.js), i les guardes del
   build ho vetarien (guardesDelModul.test.js). AppGridShell.jsx el reexporta:
   és el mateix objecte de sempre. */
import { createContext } from 'react';

export const AppGridContext = createContext(null);

/* Ordre d'usabilitat del Mestre (30-10-2026) · Els noms traduïts dels botons
   de cada columna, que posa qui munta les columnes (l'UniversalWorkspace):
   AppGridColumn no pot importar el traductor (guardesDelModul.test.js).
   Corrector del Gauntlet f4 (30-10-2026, separadors-nom-sense-traduir) · Viu
   ací, i no a AppGridColumn.jsx, perquè la closca també el llig per al nom
   dels dos separadors (redimensionaColumna) sense importar cap columna.
   AppGridColumn.jsx el reexporta: és el mateix objecte de sempre. Sense
   proveïdor (el Xat, les apps, el catàleg), els textos en valencià. */
export const TextosDeLaColumna = createContext(null);
