/**
 * Mode immersiu de la closca (ordre del Mestre, 261007).
 *
 * Una vista pot demanar la pantalla sencera: la closca (AppShell) marca la seua
 * arrel amb `data-sdp-immersiu` i layout.css amaga la barra negra, la franja de
 * l'amfitrió i la barra inferior mòbil, i posa a zero la reserva d'alçada de la
 * barra inferior. El primer cas és la conversa del Xat en mòbil, amb el patró
 * estàndard de missatgeria: entrar en una conversa dona el 100% de la
 * pantalla a la conversa, i la fletxa de la seua capçalera torna a la llista
 * (Pedra Seca §12).
 *
 * Les peticions es compten: dues vistes poden demanar-ho alhora i el mode no
 * s'apaga fins que no l'allibera l'última. Sense proveïdor (proves, catàleg,
 * una peça muntada sola), useModeImmersiu no fa res.
 */
import { createContext, useContext, useEffect } from 'react';

const ModeImmersiuContext = createContext(null);

/** El valor és una funció que demana el mode i torna la que l'allibera. */
export const ProveidorModeImmersiu = ModeImmersiuContext.Provider;

export function useModeImmersiu(actiu) {
  const demana = useContext(ModeImmersiuContext);
  useEffect(() => {
    if (!demana || !actiu) return undefined;
    return demana();
  }, [demana, actiu]);
}
