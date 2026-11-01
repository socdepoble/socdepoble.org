/**
 * useRellotgeAlertes.js — T7 · S2 (assalt 261101) · El rellotge de la
 * caducitat de les alertes municipals del Mur.
 *
 * Abans, la vigència (alertesMunicipals.js · esVigent) només es calculava
 * quan canviaven les dades del Mur: una alerta que caducava amb el Mur obert
 * es quedava dalt i a la regió viva fins a la recàrrega següent. Ara un sol
 * temporitzador espera la caducitat més pròxima (`propera`, de
 * properaCaducitat) i, quan ja ha passat, crida `marca(instant)`: qui pinta
 * (MurSection) torna a calcular la vigència amb el rellotge de paret.
 *
 *  · Si el temporitzador arriba abans d'hora (el rellotge de paret ha anat
 *    enrere, o l'espera s'ha tallat a MAX_ESPERA_MS), torna a esperar.
 *  · Després de marcar, torna a armar-se: si el recàlcul encara veu vigent
 *    la mateixa alerta (el rellotge ha reculat entre el toc i el render),
 *    `propera` no canvia i el rellotge hi torna a mirar (com a molt, un cop
 *    per segon). Quan `propera` canvia, la neteja de l'efecte el desarma.
 *  · En tornar a la pestanya (visibilitychange → 'visible') marca només si
 *    la caducitat ja ha passat: els navegadors retarden els temporitzadors
 *    en segon pla, i si no ha caducat res no cal tornar a pintar el Mur.
 *  · Sense cap alerta vigent (`propera` null), cap temporitzador ni cap
 *    escolta: el Mur de sempre.
 *  · Cap compte enrere: la data que es pinta és absoluta, i la regió viva no
 *    torna a parlar fins que canvia el conjunt d'avisos.
 *
 * `ara` i `doc` s'injecten a les proves; han de ser referències estables
 * (una funció nova a cada render tornaria a armar el temporitzador).
 */
import { useEffect } from 'react';
import { esperaFins } from './alertesMunicipals.js';

export function useRellotgeAlertes(propera, marca, { ara = Date.now, doc = globalThis.document } = {}) {
  useEffect(() => {
    if (!Number.isFinite(propera) || typeof marca !== 'function') return undefined;
    let id = null;
    const arma = () => {
      id = setTimeout(() => {
        const instant = ara();
        // Primer s'arma: si `marca` repinta de colp, la neteja ja el troba.
        arma();
        if (instant > propera) marca(instant);
      }, esperaFins(propera, ara()));
    };
    arma();
    const tornaALaPestanya = () => {
      if (doc?.visibilityState !== 'visible') return;
      const instant = ara();
      if (instant > propera) marca(instant);
    };
    doc?.addEventListener?.('visibilitychange', tornaALaPestanya);
    return () => {
      clearTimeout(id);
      doc?.removeEventListener?.('visibilitychange', tornaALaPestanya);
    };
  }, [propera, marca, ara, doc]);
}
