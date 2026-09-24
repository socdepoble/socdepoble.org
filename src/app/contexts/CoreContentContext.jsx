import { useScopedResource } from './useScopedResource.js';
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { loadCoreContent } from '../../data/backendPort.js';
import { byId } from '../../config/contentHelpers';
import { useIdentitat } from './IdentitatContext.jsx';
import { useRecarregaExterna } from './useRecarregaExterna.jsx';
import { useUIActions } from './UIContext.jsx';
import { useSession } from './SessionContext.jsx';

const CoreContentContext = createContext(null);

export function CoreContentProvider({ children, config }) {
  const { actorId, actorKey } = useIdentitat();
  const { generacio, currentUser } = useSession();
  const { setGlobalStatus } = useUIActions();
  const scopeKey = JSON.stringify([config?.backendId || 'supabase', config?.tenantId,
    currentUser?.id, actorKey, generacio]);
  const data = useScopedResource(loadCoreContent, actorId, scopeKey, config);
  useEffect(() => { setGlobalStatus(data.status); }, [data.status, setGlobalStatus]);

  const value = useMemo(() => {
    if (data.status !== 'ready' || !data.payload) return { status: data.status, error: data.error, towns: [], pages: [], pageCopy: {}, agents: [], sortedTowns: [], featuredTowns: [], refresh: data.refresh };
    return {
      status: data.status,
      error: data.error,
      towns: data.payload.towns || [],
      sortedTowns: data.payload.towns ? byId(data.payload.towns) : [],
      featuredTowns: data.payload.towns ? byId(data.payload.towns).filter(t => t.is_featured) : [],
      pages: data.payload.pages || [],
      pageCopy: Object.fromEntries((data.payload.pages || []).map(page => [page.id, { ...page }])),
      agents: data.payload.agents || [],
      ownerUserId: data.payload.ownerUserId,
      refresh: data.refresh
    };
  }, [data]);

  useRecarregaExterna(data.refresh);

  return <CoreContentContext.Provider value={value}>{children}</CoreContentContext.Provider>;
}

export function useCoreContent() {
  return useContext(CoreContentContext) || { status: 'loading', towns: [], pages: [], pageCopy: {}, agents: [], sortedTowns: [], featuredTowns: [] };
}
