import { createContext, useContext } from 'react';

/** Kernel leaf only. An app consumes references through this port; account,
 * backend and session providers belong to the host route, never its body. */
const CAP = Object.freeze([]);
const RESERVA = Object.freeze({ projeccions: CAP, estat: 'inactiu', error: null, persistent: false,
  autoritzat: false, ownerId: null,
  desa: async () => { throw new Error('Sense proveïdor de publicació este espai és de només lectura.'); } });
export const ProjeccionsCatalegContext = createContext(RESERVA);
export const useProjeccionsCatalegContext = () => useContext(ProjeccionsCatalegContext);
