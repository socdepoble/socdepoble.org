/* Gauntlet Loop 261029 (cicle 1, P1-71) · L'objecte de context del mode
   privacitat de la Consola, en un mòdul que només importa React (el motiu, a
   src/app/contexts/objectesDeContext.js). peces.jsx és ascendent de quasi
   tota l'App: una edició qualsevol en portava una instància nova amb un
   context nou. React Refresh posava el <Privat> nou dins dels proveïdors
   vells (PolsConsola, XifresMas, EmpaquetatsConsola), que llegia el valor
   per defecte, false, i les rutes, ordres i empremtes es tornaven a vore amb
   el mode privacitat encés. Només l'importa peces.jsx, que el reexporta amb
   el mateix nom. */
import { createContext } from 'react';

export const PrivacitatConsola = createContext(false);
