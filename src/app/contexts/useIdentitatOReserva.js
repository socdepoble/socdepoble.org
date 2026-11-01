/**
 * useIdentitatOReserva.js · P1-71 / D-7 (pla 261101_1246, decisió del Mestre)
 * · La identitat del proveïdor o, fora d'IdentitatProvider, la reserva
 * anònima de només lectura (identitatDeReserva.js).
 *
 * Té la semàntica d'useIdentitatOpcional() || IDENTITAT_DE_RESERVA, però
 * passa per useIdentitat(): unes 80 proves simulen IdentitatContext.jsx només
 * amb useIdentitat i, sense eixa exportació al doble, useIdentitatOpcional()
 * les faria caure. La forma `return useX()` dins d'un try és la que
 * rules-of-hooks accepta (usePublicacionsDeLActor.js · useIdentitatSiNHiHa):
 * useContext es crida una sola vegada pels dos camins, i l'ordre dels ganxos
 * no canvia. Dins del proveïdor, res no canvia.
 *
 * Només el pet de «sense proveïdor» passa a la reserva. Qualsevol altre error
 * (un doble de prova sense l'exportació useIdentitat, un error de veres) es
 * torna a llançar: mai una lectura silenciosa que ningú no ha demanat.
 */
import { useIdentitat } from './IdentitatContext.jsx';
import { IDENTITAT_DE_RESERVA } from './identitatDeReserva.js';

/** El missatge exacte que llança useIdentitat() fora d'IdentitatProvider
    (IdentitatContext.jsx). Si canvia allà, les proves d'esta reserva cauen. */
export const MISSATGE_SENSE_PROVEIDOR = 'useIdentitat ha de ser usat dins de IdentitatProvider';

export function useIdentitatOReserva() {
  try {
    return useIdentitat();
  } catch (error) {
    if (error?.message === MISSATGE_SENSE_PROVEIDOR) return IDENTITAT_DE_RESERVA;
    throw error;
  }
}
