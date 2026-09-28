/* ═══════════════════════════════════════════════════════════════════
   T47 (ordre del Mestre, 260928) · useAutodesament

   L'estat de la cua per a una entitat, llegit amb useSyncExternalStore:
   { camps, errors, estat, problema, persistent }.
     camps       l'esborrany per camp (el que la persona té davant)
     errors      per camp: { tipus, missatge, llargaria, maxim, columna }
     estat       'net' | 'pendent' | 'enviant' | 'sessio' | 'error'
     problema    { tipus: 'temporal', missatge } mentre es reintenta
     persistent  true si l'esborrany sobreviu a tancar la pestanya
   Sense `ref` (fitxa en lectura) torna sempre l'estat buit.
   ═══════════════════════════════════════════════════════════════════ */
import { useCallback, useSyncExternalStore } from 'react';
import { BUIDA_AUTODESAMENT, cuaDesament } from './cua.js';

export function useAutodesament(ref, cua = cuaDesament) {
  const clau = ref ? cua.clauDe(ref) : null;
  const subscriu = useCallback((oient) => cua.subscriu(oient), [cua]);
  const instantania = useCallback(
    () => (clau ? cua.instantania(clau) : BUIDA_AUTODESAMENT),
    [cua, clau],
  );
  return useSyncExternalStore(subscriu, instantania, instantania);
}
