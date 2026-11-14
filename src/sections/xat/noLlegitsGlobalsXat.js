/**
 * noLlegitsGlobalsXat.js — R24 · xat_entrega (IDEA-260 b, P1-4).
 *
 * El pont del comptador global de no llegits entre XatProvider (dins
 * d'AppContent) i la closca (AppShell: la barra lateral i la barra mòbil), que
 * viu PER DAMUNT de XatProvider i no pot llegir useXat(). App.jsx munta el
 * proveïdor per damunt d'AppShell; ComptadorGlobalXat (dins de XatProvider)
 * hi publica useXat().totalNoLlegits i l'entrada «Xat» el llig. Un estat per
 * instància de l'App: dos Mas a la mateixa pàgina no es barregen.
 *
 * Com objectesDeContext.js: només importa React. Cap edició de l'App no el
 * marca per a React Refresh i tots els importadors comparteixen els mateixos
 * objectes de context. Sense proveïdor (un espècimen o una prova), 0 i cap
 * publicació.
 */
import { createContext, createElement, useContext, useState } from 'react';

const ValorNoLlegits = createContext(0);
const FixaNoLlegits = createContext(null);

export function ProveidorNoLlegitsGlobalsXat({ children }) {
  const [total, fixa] = useState(0);
  return createElement(FixaNoLlegits.Provider, { value: fixa },
    createElement(ValorNoLlegits.Provider, { value: total }, children));
}

/** El total publicat (0 sense proveïdor). */
export const useNoLlegitsGlobalsXat = () => useContext(ValorNoLlegits);
/** La funció per a publicar-lo (null sense proveïdor). */
export const useFixaNoLlegitsGlobalsXat = () => useContext(FixaNoLlegits);
