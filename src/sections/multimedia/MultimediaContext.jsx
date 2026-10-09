import { backendScope } from '../../config/backendConfig.js';
import { useSession } from '../../app/contexts/SessionContext.jsx';
import { useScopedResource } from '../../app/contexts/useScopedResource.js';
import { createContext, useContext, useMemo } from 'react';
import { loadMultimedia } from '../../data/backendPort.js';
import { useIdentitat } from '../../app/contexts/IdentitatContext.jsx';

import { useRecarregaExterna } from '../../app/contexts/useRecarregaExterna.jsx';

const MultimediaContext = createContext(null);

export function MultimediaProvider({ children, config }) {
  const { actorId, actorKey } = useIdentitat();
  const { currentUser } = useSession();
  /* Decisió 2 del Mestre (261007) · Renovació silenciosa. La clau d'àmbit és
     la d'AÏLLAMENT (backend, persona, actor), sense `generacio`: renovar el
     JWT ja no buida la Multimèdia. La frescor per generació la porta
     useScopedResource. */
  const scopeKey = JSON.stringify([backendScope(config),
    currentUser?.id, actorKey]);
  const data = useScopedResource(loadMultimedia, actorId, scopeKey, config);
  const { status, payload, error, errorRevalidacio, refresh } = data;

  /* Decisió 2 del Mestre (261007) · El valor es memoritza sobre camps i no
     sobre `data`: la marca `revalidant` fa un `data` nou en cada renovació i
     cada refresh, i amb `[data]` es tornava a pintar cada consumidor de
     useMultimedia sense cap dada nova. `revalidant` no s'exposa (cap
     consumidor no la llig); `errorRevalidacio` sí, a banda de `status`. */
  const value = useMemo(() => {
    if (status !== 'ready' || !payload) return {
      status,
      error,
      errorRevalidacio,
      mediaItems: [],
      mediaTimelineGroups: [],
      refresh
    };
    return {
      status,
      error,
      errorRevalidacio,
      mediaItems: payload.mediaItems || [],
      mediaTimelineGroups: payload.mediaTimelineGroups || [],
      refresh
    };
  }, [status, payload, error, errorRevalidacio, refresh]);

  useRecarregaExterna(refresh);

  return <MultimediaContext.Provider value={value}>{children}</MultimediaContext.Provider>;
}

export function useMultimedia() {
  return useContext(MultimediaContext) || { status: 'loading', mediaItems: [], mediaTimelineGroups: [] };
}
