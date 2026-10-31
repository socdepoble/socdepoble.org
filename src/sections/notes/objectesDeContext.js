/* Gauntlet Loop 261029 (cicle 1, P1-71) · Els objectes de context del Bloc
   de notes, en un mòdul que només importa React (el motiu, a
   src/app/contexts/objectesDeContext.js). NotesContext.jsx i
   NotesDataContext.jsx són ascendents de quasi tota l'App: una edició
   qualsevol en portava una instància nova amb un context nou, i els
   consumidors que no s'havien tornat a executar llegien el vell. Només els
   importen NotesContext.jsx i NotesDataContext.jsx. */
import { createContext } from 'react';

export const NotesContext = createContext(null);
export const NotesDataContext = createContext(null);
