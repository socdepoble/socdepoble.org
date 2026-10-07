/**
 * useEntitatDelProjecte.js — T6 en remot (revisió del front «nucli», 261004).
 *
 * La boina d'una publicació de l'entitat pilot porta a la pàgina del projecte
 * (rutaDAutoria, config/navigation.js). En remot, l'id d'eixa entitat és el
 * del servidor i la llavor no el sap: este hook el demana al port una sola
 * vegada per abast de backend (resolEntitatDelProjecte: loadPerfilPublic amb
 * el slug declarat) i torna a pintar qui el crida quan arriba.
 *
 *  · LLAVOR ('seed' o 'local'): cap crida; els ids de la llavor ja hi són.
 *  · REMOT: cada render ho prova; sense la capacitat 'directori' (o amb el
 *    backend encara no a punt) no fa res, i amb ella, una sola crida.
 *  · Fora de l'app (sense UIProvider: un espècimen o una prova muntats
 *    sols) no hi ha backend: cap crida.
 *
 * Model B: cap import de cap proveïdor, només el port. Torna la versió dels
 * identificadors del projecte (no cal llegir-la: subscriure's ja repinta).
 */
import { useEffect, useSyncExternalStore } from 'react';
import { useUIState } from '../app/contexts/UIContext';
import { backendScope, normalizeBackendConfig } from '../config/backendConfig.js';
import {
  resolEntitatDelProjecte, subscriuEntitatDelProjecte, versioEntitatDelProjecte
} from '../config/navigation.js';
import { loadPerfilPublic, teCapacitat } from '../data/backendPort.js';

/* El port per defecte, llegit en cridar-lo (no en importar-lo): les dues peces que calen. */
const PORT = Object.freeze({
  teCapacitat: (capacitat) => teCapacitat(capacitat),
  loadPerfilPublic: (clau, config) => loadPerfilPublic(clau, config)
});

/* L'estat de la interfície, o null fora de l'app. La forma `return useUIState()`
   dins d'un try és la que rules-of-hooks accepta (com useEstatDeLApp de
   control/xatCorporatiu.js i useUbicacioApp de PedraSeca/hooks/useAccions.js). */
function useEstatDeLApp() {
  try {
    return useUIState();
  } catch {
    return null;
  }
}

/* El mode i l'abast del backend; una configuració invàlida no té abast: cap crida. */
function llegixBackend(config) {
  try {
    return { dataMode: normalizeBackendConfig(config || {}).dataMode, abast: backendScope(config || {}) };
  } catch {
    return { dataMode: null, abast: null };
  }
}

export function useEntitatDelProjecte() {
  const app = useEstatDeLApp();
  const config = app?.externalConfig;

  useEffect(() => {
    if (!app) return;
    const { dataMode, abast } = llegixBackend(config);
    resolEntitatDelProjecte({ abast, dataMode, port: PORT, config: config || {} });
  });

  return useSyncExternalStore(subscriuEntitatDelProjecte, versioEntitatDelProjecte, versioEntitatDelProjecte);
}
