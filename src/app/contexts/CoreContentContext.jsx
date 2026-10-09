import { backendScope } from '../../config/backendConfig.js';
import { useScopedResource } from './useScopedResource.js';
import { createContext, useContext, useEffect, useMemo } from 'react';
import { loadCoreContent } from '../../data/backendPort.js';
import { byId } from '../../config/contentHelpers';
import { useIdentitat } from './IdentitatContext.jsx';
import { useRecarregaExterna } from './useRecarregaExterna.jsx';
import { useUIActions } from './UIContext.jsx';
import { useSession } from './SessionContext.jsx';

const CoreContentContext = createContext(null);

export function CoreContentProvider({ children, config }) {
  const { actorId, actorKey } = useIdentitat();
  const { currentUser } = useSession();
  const { setGlobalStatus } = useUIActions();
  /* Decisió 2 del Mestre (261007) · Renovació silenciosa. La clau d'àmbit és
     la d'AÏLLAMENT (backend, persona, actor), sense `generacio`: renovar el
     JWT ja no buida el contingut ni fa parpellejar l'estat global (el
     contingut continua 'ready' mentre es revalida). La frescor per generació
     la porta useScopedResource. */
  const scopeKey = JSON.stringify([backendScope(config),
    currentUser?.id, actorKey]);
  const data = useScopedResource(loadCoreContent, actorId, scopeKey, config);
  const { status, payload, error, errorRevalidacio, refresh } = data;
  /* Decisió 2 del Mestre (261007) · L'estat global és l'entrada de la franja
     del node i del pilot del Perfil (T7 i T9, estatConnexio.js): «l'estat de
     l'última càrrega del contingut core» i «en el dubte, mai verd». Una
     revalidació en segon pla que falla conserva el contingut en 'ready' (la
     decisió només lleva el «Carregant»), però l'última càrrega ha fallat:
     l'estat global diu 'error' («Sense connexió»), com abans, sense buidar
     res. Torna a 'ready' quan una revalidació acaba bé. aria-busy només mira
     'loading' (App.jsx). */
  const estatGlobal = errorRevalidacio ? 'error' : status;
  useEffect(() => { setGlobalStatus(estatGlobal); }, [estatGlobal, setGlobalStatus]);

  /* Decisió 2 del Mestre (261007) · El valor es memoritza sobre camps i no
     sobre `data`: la marca `revalidant` fa un `data` nou en cada renovació i
     cada refresh, i amb `[data]` es refeien byId(towns) i tots els arrays
     amb el mateix contingut i es tornava a pintar cada consumidor de
     useCoreContent sense cap dada nova. `revalidant` no s'exposa: cap
     consumidor no la llig i el Mestre no ha demanat cap indicador.
     `errorRevalidacio` sí (l'error de la revalidació, a banda de `status`). */
  const value = useMemo(() => {
    if (status !== 'ready' || !payload) return { status, error, errorRevalidacio, towns: [], pages: [], pageCopy: {}, agents: [], sortedTowns: [], featuredTowns: [], refresh };
    return {
      status,
      error,
      errorRevalidacio,
      towns: payload.towns || [],
      sortedTowns: payload.towns ? byId(payload.towns) : [],
      featuredTowns: payload.towns ? byId(payload.towns).filter(t => t.is_featured) : [],
      pages: payload.pages || [],
      pageCopy: Object.fromEntries((payload.pages || []).map(page => [page.id, { ...page }])),
      agents: payload.agents || [],
      ownerUserId: payload.ownerUserId,
      refresh
    };
  }, [status, payload, error, errorRevalidacio, refresh]);

  useRecarregaExterna(refresh);

  return <CoreContentContext.Provider value={value}>{children}</CoreContentContext.Provider>;
}

export function useCoreContent() {
  return useContext(CoreContentContext) || { status: 'loading', towns: [], pages: [], pageCopy: {}, agents: [], sortedTowns: [], featuredTowns: [] };
}
