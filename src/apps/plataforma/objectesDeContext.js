/* Gauntlet Loop 261029 (cicle 1, P1-71) · L'objecte de context del registre
   d'apps de l'amfitrió, en un mòdul que només importa React (el motiu, a
   src/app/contexts/objectesDeContext.js). PlataformaContext.jsx importa el
   registre i el port del backend, i és ascendent de totes les apps i de
   quasi tota l'App: una edició qualsevol en portava una instància nova amb
   un context nou, i useRegistre() dels consumidors que no s'havien tornat a
   executar deixava de vore el <ProveidorPlataforma> de les proves. Només
   l'importa PlataformaContext.jsx. */
import { createContext } from 'react';

export const RegistreContext = createContext(null);
