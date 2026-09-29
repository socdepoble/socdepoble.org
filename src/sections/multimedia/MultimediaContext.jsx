import { backendScope } from '../../config/backendConfig.js';
import { useSession } from '../../app/contexts/SessionContext.jsx';
import { useScopedResource } from '../../app/contexts/useScopedResource.js';
import React, { createContext, useContext, useMemo } from 'react';
import { loadMultimedia } from '../../data/backendPort.js';
import { useIdentitat } from '../../app/contexts/IdentitatContext.jsx';

import { useRecarregaExterna } from '../../app/contexts/useRecarregaExterna.jsx';

const MultimediaContext = createContext(null);

export function MultimediaProvider({ children, config }) {
  const { actorId, actorKey } = useIdentitat();
  const { generacio, currentUser } = useSession();
  const scopeKey = JSON.stringify([backendScope(config),
    currentUser?.id, actorKey, generacio]);
  const data = useScopedResource(loadMultimedia, actorId, scopeKey, config);

  const value = useMemo(() => {
    if (data.status !== 'ready' || !data.payload) return { 
      status: data.status, 
      error: data.error, 
      mediaItems: [], 
      mediaTimelineGroups: [],
      refresh: data.refresh
    };
    return {
      status: data.status,
      error: data.error,
      mediaItems: data.payload.mediaItems || [],
      mediaTimelineGroups: data.payload.mediaTimelineGroups || [],
      refresh: data.refresh
    };
  }, [data]);

  useRecarregaExterna(data.refresh);

  return <MultimediaContext.Provider value={value}>{children}</MultimediaContext.Provider>;
}

export function useMultimedia() {
  return useContext(MultimediaContext) || { status: 'loading', mediaItems: [], mediaTimelineGroups: [] };
}
