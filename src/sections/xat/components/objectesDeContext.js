/* v1.2.23 · costura objectes de context (ordre del Mestre 261123) · L'objecte
   de context de la closca del xat (IDEA-327 v2, kit Gemini R32.46), en un
   mòdul que només importa React (el motiu, a src/app/contexts/objectesDeContext.js).
   ClosCaXat.jsx és ascendent de l'App i exporta constants (clauSeccio,
   entradaDeVista, rutaDeVista), i per això no és una frontera de React
   Refresh: amb el createContext dins, una edició en portava una instància
   nova amb un context nou, i BotoTitolSeccioXat llegia el vell. Només
   l'importa ClosCaXat.jsx, com abans el tenia de portes endins. */
import { createContext } from 'react';

export const ClosCaXatContext = createContext(null);
