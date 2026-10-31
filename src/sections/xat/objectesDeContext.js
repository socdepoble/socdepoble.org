/* Gauntlet Loop 261029 (cicle 1, P1-71) · L'objecte de context del xat, en
   un mòdul que només importa React (el motiu, a
   src/app/contexts/objectesDeContext.js). XatContext.jsx és ascendent de
   quasi tota l'App (→ backendPort.js → host.js → App.jsx): una edició
   qualsevol en portava una instància nova amb un context nou, i els
   consumidors que no s'havien tornat a executar es quedaven sense xat. Només
   l'importa XatContext.jsx, que el reexporta amb el mateix nom. */
import { createContext } from 'react';

export const XatContext = createContext(null);
