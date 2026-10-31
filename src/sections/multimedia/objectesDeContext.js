/* Gauntlet Loop 261029 (cicle 1, P1-71) · L'objecte de context de
   Multimèdia, en un mòdul que només importa React (el motiu, a
   src/app/contexts/objectesDeContext.js). MultimediaContext.jsx és ascendent
   de quasi tota l'App: una edició qualsevol en portava una instància nova amb
   un context nou, i els consumidors que no s'havien tornat a executar
   llegien el vell. Només l'importa MultimediaContext.jsx. */
import { createContext } from 'react';

export const MultimediaContext = createContext(null);
