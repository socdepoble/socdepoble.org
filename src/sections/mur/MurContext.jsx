import { useScopedResource } from '../../app/contexts/useScopedResource.js';
import React, { createContext, useContext, useMemo } from 'react';
import { loadMur, appendSectionSubmissionNetworkOnly } from '../../data/backendPort.js';
import { sortPinnedContent } from '../../config/contentHelpers';
import { useIdentitat } from '../../app/contexts/IdentitatContext.jsx';
import { useRecarregaExterna } from '../../app/contexts/useRecarregaExterna.jsx';

import { useSession } from '../../app/contexts/SessionContext.jsx';

const MurContext = createContext(null);

export function MurProvider({ children, config }) {
  const { actorId, actorKey } = useIdentitat();
  const { generacio, currentUser } = useSession();
  const scopeKey = JSON.stringify([config?.backendId || 'supabase', config?.tenantId,
    currentUser?.id, actorKey, generacio]);
  const data = useScopedResource(loadMur, actorId, scopeKey, config);

  const value = useMemo(() => {
    if (data.status !== 'ready' || !data.payload) return { refresh: data.refresh, status: data.status, error: data.error, feedPosts: [], events: [], marketItems: [], sortedFeedPosts: [], sortedEvents: [], sortedMarketItems: [], sendSectionSubmission: async () => { throw new Error('El Mur no està llest o no té dades disponibles.'); } };
    return {
      status: data.status,
      error: data.error,
      feedPosts: data.payload.feedPosts || [],
      events: data.payload.events || [],
      marketItems: data.payload.marketItems || [],
      sortedFeedPosts: data.payload.feedPosts ? sortPinnedContent(data.payload.feedPosts) : [],
      sortedEvents: data.payload.events ? sortPinnedContent(data.payload.events) : [],
      sortedMarketItems: data.payload.marketItems ? sortPinnedContent(data.payload.marketItems) : [],
      sendSectionSubmission: async (sub) => {
        return await appendSectionSubmissionNetworkOnly(sub, config);
      },
      refresh: data.refresh
    };
  }, [data, config]);

  useRecarregaExterna(data.refresh);

  return <MurContext.Provider value={value}>{children}</MurContext.Provider>;
}

export function useMur() {
  return useContext(MurContext) || { status: 'loading', feedPosts: [], events: [], marketItems: [], sortedFeedPosts: [], sortedEvents: [], sortedMarketItems: [], sendSectionSubmission: async () => { throw new Error('El Mur no està llest o no té dades disponibles.'); } };
}
